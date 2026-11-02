const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
    process.env.DB_NAME || "pos_db",
    process.env.DB_USER || "root",
    process.env.DB_PASSWORD || "",
    {
        host: process.env.DB_HOST || "localhost",
        dialect: "mysql",
        logging: false
    }
);

sequelize.authenticate()
    .then(() => console.log("Database connected!"))
    .catch(err => console.log("Connection error:", err));


module.exports = { sequelize };