const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'Libreria',
    port: 3306,
    waitForConnections: true,
    charset: 'utf8mb4'
});

module.exports = pool;
