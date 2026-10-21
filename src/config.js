require("dotenv").config();

function getDatabaseConfig(){
    return {
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 3306,
        database: process.env.DB_NAME || "techstore",
        username: process.env.DB_USER ||"techstore_app",
        password: process.env.DB_PASSWORD
    };
}

module.exports = {
    getDatabaseConfig
};
