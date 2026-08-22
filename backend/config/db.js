const mysql = require('mysql2/promise');
const env = require('./env');

const pool = mysql.createPool(env.db);

// Test connection
pool.getConnection()
  .then(conn => {
    console.log('✅ Conexión a MySQL establecida correctamente');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Error al conectar con MySQL:', err.message);
  });

module.exports = pool;
