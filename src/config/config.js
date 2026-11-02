const mysql = require('mysql2/promise');
var dotenv = require('dotenv');
dotenv.config(); // Load environment variables from .env file

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    namedPlaceholders: true
    // waitForConnections: true,
    // connectionLimit: 10,
    // queueLimit: 0
});

module.exports = db;