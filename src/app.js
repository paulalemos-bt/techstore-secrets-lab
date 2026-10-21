const express = require("express");
const database = require("./database");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/health", (req, res) => {
    res.json({
        status: "healthy",
        
    });
});


app.get("/config-check", (req, res) => {
    res.json({
        databaseConfigured: Bolean(process.env.DB_HOST),
        adminConfigured: Boolean(process.env.DB_PASSWORD),
        paymentConfigured: Boolean(process.env.PAYMENT_API_KEY),        
    });
});


app.listen(PORT, () => {
    console.log(`API Techstore is running on port ${PORT}`);
});
