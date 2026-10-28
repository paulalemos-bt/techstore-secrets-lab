Relatório de Análise de Segurança

Projeto:TechStore Secrets Lab  
Objetivo: Identificar, corrigir e documentar problemas relacionados ao gerenciamento de segredos, à configuração da aplicação e à infraestrutura Docker.

## Problema 1 — Credenciais e tokens armazenados diretamente em arquivo JSON

### Local

Arquivo: `config/credentials.json`

### Problema identificado

O arquivo contém credenciais escritas diretamente no código de configuração, incluindo:

- Usuário e senha do banco de dados;
- Chave de API do serviço de pagamento;
- Token de comunicação da API interna.

Essas informações estão armazenadas em texto simples no arquivo JSON.

### Risco

Qualquer pessoa que tenha acesso ao arquivo poderá visualizar as credenciais e utilizá-las indevidamente. Se o arquivo for compartilhado ou enviado a um repositório público, as informações poderão ser expostas.

### Correção aplicada

Remover as credenciais do arquivo versionado e deixar de utilizá-lo para armazenar segredos. Transferir as configurações necessárias para variáveis de ambiente protegidas ou para um gerenciador de segredos, como o AWS Secrets Manager.

### Justificativa

A separação entre código e segredos reduz a possibilidade de exposição de credenciais durante o compartilhamento e a manutenção do projeto. O uso de um gerenciador de segredos também permite controlar o acesso e facilitar a rotação das credenciais.

---

## Problema 2 — Arquivo `.env` não protegido pelo `.gitignore`

### Local

Arquivos: `.env` e `.gitignore`

### Problema identificado

O arquivo `.env` contém configurações e informações sensíveis, como senha do banco de dados, chave de API de pagamento e token interno. Entretanto, o `.gitignore` original não possui regras para ignorar esse arquivo.

### Risco

O arquivo `.env` pode ser incluído acidentalmente em um commit e enviado ao GitHub, permitindo que outras pessoas tenham acesso às credenciais.

### Correção aplicada

Adicionar as seguintes regras ao `.gitignore`:

```gitignore
node_modules/
logs/
dist/
.env
.env.*
!.env.example
```

Manter um arquivo `.env.example` contendo apenas nomes de variáveis e valores fictícios ou marcadores de preenchimento.

### Justificativa

O `.gitignore` ajuda a impedir que arquivos locais com informações sensíveis sejam adicionados acidentalmente ao repositório. O arquivo de exemplo permite documentar as configurações necessárias sem compartilhar credenciais.

Se o `.env` já tiver sido enviado ao Git, também será necessário tratar o histórico do repositório e substituir os segredos expostos. Apenas adicionar o arquivo ao `.gitignore` não remove versões anteriores.

---

## Problema 3 — Credenciais do banco de dados fixas no código-fonte

### Local

Arquivo: `src/config.js`

### Problema identificado

A função `getDatabaseConfig()` define diretamente o host, o nome do banco, o usuário e a senha. O usuário `techstore_root` e a senha `uchihaItachi` estão escritos no próprio código.

Além disso, o arquivo não utiliza as variáveis de ambiente já previstas no projeto.

### Risco

As credenciais podem ser expostas quando o código é enviado ao repositório, compartilhado ou copiado para outros ambientes. A utilização de valores fixos também dificulta a alteração das configurações entre desenvolvimento, testes e produção.

### Correção aplicada

Alterar a função `getDatabaseConfig()` para obter as configurações por meio das variáveis de ambiente, utilizando `process.env`.

Exemplo:

```javascript
require("dotenv").config();

function getDatabaseConfig() {
    return {
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT || 3306),
        database: process.env.DB_NAME || "techstore",
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    };
}

module.exports = {
    getDatabaseConfig
};
```

### Justificativa

Separar as credenciais do código-fonte reduz a exposição de informações sensíveis e permite configurar a aplicação sem modificar o código. Os valores padrão devem ser utilizados somente quando forem apropriados para o ambiente, sem incluir senhas reais ou privilegiadas.

---

## Problema 4 — Variável de conexão não definida e interpolação incorreta

### Local

Arquivo: `src/database.js`

### Problema identificado

O objeto `connection` utiliza `database.host`, `database.port`, `database.database` e `database.password`, mas a variável `database` não foi declarada nem importada no arquivo.

Além disso, a mensagem de log utiliza `$(connection.database)` e `$(connection.username)`, em vez da sintaxe correta de interpolação de template strings do JavaScript.

### Risco

A ausência da variável `database` pode provocar um `ReferenceError` durante a execução do arquivo. A interpolação incorreta também impede que a mensagem de log apresente os valores esperados, dificultando a identificação de problemas na configuração.

### Correção aplicada

Importar a função `getDatabaseConfig()` de `src/config.js` e utilizá-la para obter as configurações da conexão.

Exemplo:

```javascript
const { getDatabaseConfig } = require("./config");

const connection = getDatabaseConfig();

function connect() {
    console.log(
        `Configuração do banco carregada para ${connection.database}.`
    );

    return connection;
}

module.exports = {
    connect
};
```

### Justificativa

A importação da configuração elimina a dependência de uma variável inexistente e centraliza a leitura das informações de conexão. A interpolação correta melhora as mensagens de diagnóstico. O log não deve incluir senhas, tokens ou chaves.

**Observação:** esse exemplo organiza a configuração, mas não estabelece uma conexão real com o MySQL. Para isso, é necessário implementar e testar a conexão utilizando um driver apropriado.

---

## Problema 5 — Utilização de usuário administrativo na conexão da aplicação

### Local

Arquivo: `src/database.js`

### Problema identificado

O objeto `connection` define o usuário do banco como `root`, embora o projeto possua uma variável de ambiente `DB_USER` destinada ao usuário da aplicação.

### Risco

A utilização de uma conta administrativa concede privilégios excessivos à aplicação. Caso ocorra uma falha de segurança, um invasor poderá ter acesso a operações mais abrangentes no banco de dados do que as necessárias para o funcionamento da aplicação.

### Correção aplicada

Substituir o usuário fixo `root` pela configuração obtida de `DB_USER`. Configurar uma conta específica para a aplicação no MySQL e conceder somente as permissões necessárias para suas operações.

### Justificativa

O princípio do menor privilégio determina que cada componente deve possuir apenas as permissões necessárias para executar suas funções. Uma conta específica para a aplicação reduz o impacto de uma possível invasão ou falha de segurança.

A conta administrativa deve ser reservada para tarefas administrativas que realmente necessitem desses privilégios.

---

## Problema 6 — Referência a variável inexistente e exposição de segredo nos logs do backup

### Local

Arquivo: `scripts/backup.js`

### Problema identificado

O script lê a variável `process.env.API_KEY`, mas o arquivo `.env` define `PAYMENT_API_KEY`, gerando uma inconsistência entre o nome esperado e o nome configurado.

Além disso, a mensagem de log utiliza `${senhaTesteBackup123}`, variável que não foi declarada, e tenta imprimir o conteúdo de uma credencial.

O script também apresenta uma mensagem de sucesso sem executar efetivamente uma operação de backup.

### Risco

A variável não declarada pode provocar um `ReferenceError` e interromper a execução do script. A impressão de uma chave ou senha nos logs pode expor informações confidenciais. A mensagem de sucesso sem a execução do backup pode levar à falsa impressão de que os dados foram protegidos.

### Correção aplicada

Remover a referência à variável inexistente e não imprimir chaves, senhas ou tokens nos logs. Utilizar mensagens operacionais que não revelem informações sensíveis.

Exemplo:

```javascript
require("dotenv").config();

console.log("Inicializando rotina de backup...");

// Implementar e validar a operação real de backup.

console.log("Rotina de backup finalizada.");
```

A variável de ambiente utilizada deve corresponder à finalidade real do serviço. A rotina de backup deverá registrar sucesso somente depois de confirmar a conclusão da operação.

### Justificativa

Os logs devem permitir o acompanhamento da aplicação sem revelar credenciais. A padronização dos nomes das variáveis evita inconsistências de configuração. A confirmação real da operação de backup também impede que mensagens de sucesso sejam registradas sem que a tarefa tenha sido executada.

---

## Problema 7 — Aplicação Express e variáveis de configuração não inicializadas

### Local

Arquivo: `src/app.js`

### Problema identificado

O arquivo utiliza `app.get()` e `app.listen()`, mas não apresenta a importação do Express nem a criação do objeto `app`.

Também utiliza `PORT` e `database` sem declarar ou importar essas variáveis no código apresentado.

### Risco

A aplicação pode falhar durante a inicialização, pois o Node.js não encontrará as variáveis necessárias. Isso impede que a API disponibilize os endpoints esperados e dificulta a validação das demais correções de segurança.

### Correção aplicada

Inicializar o Express, carregar as variáveis de ambiente e declarar a porta da aplicação.

Exemplo:

```javascript
require("dotenv").config();

const express = require("express");
const app = express();

const PORT = Number(process.env.PORT || 3000);
```

Importar a função de configuração do banco quando ela for necessária e garantir que todas as variáveis utilizadas nas rotas estejam declaradas ou importadas.

### Justificativa

A inicialização correta do Express e a declaração das variáveis necessárias permitem que a aplicação seja executada de maneira previsível. A leitura da porta pelo ambiente também facilita a configuração em diferentes ambientes de execução.

A correção deve preservar os endpoints e permitir que sejam testados após a alteração.

---

## Problema 8 — Endpoint `/config-check` utiliza variáveis de segredos não declaradas

### Local

Arquivo: `src/app.js`, endpoint `/config-check`

### Problema identificado

O endpoint utiliza as variáveis `senhaUsuarioTeste123`, `chaveAPI111222333444555777888999000` e `tokenInterno1234567890`, mas elas não estão declaradas nem são obtidas das variáveis de ambiente.

### Risco

A requisição ao endpoint pode resultar em erro de execução devido às referências inexistentes. Além disso, retornar valores reais de credenciais em endpoints de configuração representaria um risco de exposição de informações confidenciais.

### Correção aplicada

Utilizar as variáveis de ambiente correspondentes e retornar somente indicadores booleanos que informem se as configurações estão presentes.

Exemplo:

```javascript
app.get("/config-check", (req, res) => {
    res.json({
        databaseConfigured: Boolean(
            process.env.DB_HOST &&
            process.env.DB_USER &&
            process.env.DB_PASSWORD
        ),
        paymentConfigured: Boolean(process.env.PAYMENT_API_KEY),
        internalApiConfigured: Boolean(process.env.INTERNAL_API_TOKEN)
    });
});
```

### Justificativa

O endpoint pode informar se as configurações necessárias estão presentes sem divulgar o conteúdo das credenciais. Isso reduz a exposição de informações sensíveis e evita erros causados por variáveis inexistentes.

Em ambientes de produção, o acesso a endpoints de diagnóstico também deve ser avaliado e restringido conforme a necessidade.

---

## Problema 9 — Estrutura e sintaxe inadequadas no Docker Compose

### Local

Arquivo: `docker-compose.yml`

### Problema identificado

O arquivo apresenta configurações de `volumes`, `ports` e `environment` fora de uma estrutura completa de serviços. A declaração do volume `-.:/app` também está incorreta, e as variáveis de ambiente utilizam uma estrutura inadequada para o YAML.

O serviço `database` não está organizado sob a seção `services`, e não há uma definição completa do serviço da aplicação.

### Risco

O Docker Compose pode rejeitar o arquivo por erro de sintaxe ou configuração. Como consequência, os serviços podem não iniciar corretamente, impedindo a execução e a validação da aplicação.

### Correção aplicada

Reorganizar o arquivo utilizando a estrutura `services`, declarar os serviços necessários e utilizar a sintaxe apropriada para portas, volumes e variáveis de ambiente.

Exemplo estrutural:

```yaml
services:
  app:
    # Configuração da aplicação Node.js
    environment:
      NODE_ENV: development
      DB_HOST: database
      DB_PORT: 3306

  database:
    image: mysql:8.0
    # Configuração do banco de dados
```

Os volumes devem ser declarados dentro do serviço correspondente e, quando necessário, na seção global `volumes`.

### Justificativa

Uma estrutura válida permite que o Docker Compose interprete corretamente os serviços, suas dependências e suas configurações. Isso melhora a reprodutibilidade do ambiente e reduz falhas durante a implantação.

Após a alteração, o arquivo deve ser validado com `docker compose config` antes de iniciar os serviços.

---

## Problema 10 — Credenciais expostas e acesso desnecessário ao banco no Docker Compose

### Local

Arquivo: `docker-compose.yml`

### Problema identificado

O arquivo contém senhas escritas diretamente na configuração, utiliza credenciais iguais para o usuário da aplicação e para a conta administrativa e declara `MYSQL_ROOT_PASSWORD` duas vezes com valores diferentes.

Além disso, publica a porta `3306` do MySQL no host por meio de `3306:3306`.

### Risco

As credenciais podem ser expostas por meio do repositório, de cópias do arquivo ou de registros de configuração. A duplicação da variável administrativa torna a configuração ambígua. O compartilhamento da mesma senha entre contas com privilégios diferentes aumenta o impacto de uma eventual exposição.

A publicação da porta do banco também pode permitir tentativas de acesso externas, dependendo da rede e das regras de firewall.

### Correção aplicada

Remover as senhas fixas do arquivo e utilizar variáveis de ambiente protegidas ou um mecanismo de gerenciamento de segredos adequado ao ambiente.

Definir uma única variável `MYSQL_ROOT_PASSWORD`, com uma senha administrativa própria, e utilizar credenciais distintas para o usuário da aplicação.

Se não houver necessidade de acesso externo ao MySQL, remover a publicação da porta `3306` e permitir que a aplicação acesse o banco pela rede interna do Docker Compose.

### Justificativa

A separação das credenciais, a eliminação de valores duplicados e a redução das portas expostas melhoram o gerenciamento dos segredos e diminuem a superfície de ataque. A aplicação passa a utilizar uma conta com permissões limitadas, enquanto a conta administrativa permanece reservada às tarefas que exigem privilégios elevados.

As variáveis de ambiente ajudam a separar as credenciais do arquivo versionado, mas devem ser protegidas. Em produção, recomenda-se utilizar um gerenciador de segredos apropriado e estabelecer procedimentos de rotação e revogação.

---

## Considerações finais

A análise identificou problemas relacionados ao armazenamento de credenciais, à proteção de arquivos sensíveis, à utilização de privilégios excessivos, à exposição de informações nos logs e às configurações da aplicação e do Docker Compose.

As correções propostas procuram reduzir a exposição de segredos, separar configuração de código, aplicar o princípio do menor privilégio e melhorar a confiabilidade do ambiente.

A conclusão da atividade depende da aplicação efetiva das alterações e da validação do projeto corrigido. Devem ser testados os endpoints, a inicialização da API, a configuração do Docker Compose e os logs, confirmando que as credenciais não são exibidas indevidamente.

Também é necessário verificar `git status` e `git diff` antes do commit, para evitar o envio de arquivos sensíveis.

**Observação sobre a validação:** este relatório documenta os problemas identificados no projeto original e as correções propostas. As alterações somente devem ser consideradas concluídas após serem implementadas e testadas no repositório.
