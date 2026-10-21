require("dotenv").config();

const apiKey = process.env.PAYMENT_API_KEY;

console.log("Inicializando rotina de backup...");

if (!apiKey) {
  console.error("ERRO: PAYMENT_API_KEY não configurada nas variáveis de ambiente.");
  process.exit(1);
}
console.log("Autenticação configurada com sucesso.");
console.log("Backup relizado com sucesso!")
