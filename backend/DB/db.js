const mysql = require('mysql2');

const connexion = mysql.createConnection( {
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'forumDb',
    port: '3306'
});

module.exports = connexion;