const sql = require('mysql2')

const pool = sql.createPool({
    host:'localhost',
    user:'root',
    password:'',
    database:'nodejslogin',
})

const conn = pool.promise();

module.exports = conn;