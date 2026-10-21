const config = require("./config");
const dbConfig = config.getDatabaseConfig();

const connection= {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    username: dbConfig.username,
    password: dbConfig.password
};

function connect() {
    console.log(
        `Conectando ao banco ${connection.database} com o usuário ${connection.username}...`
    );

    return connection;

}

module.exports = {
    connect
};

