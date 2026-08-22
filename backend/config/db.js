const mysql = require('mysql2/promise');
const env = require('./env');

// Build pool config — add SSL when DB_SSL=true (Aiven, Render, cloud DBs)
const poolConfig = { ...env.db };
if (String(process.env.DB_SSL).toLowerCase() === 'true') {
  poolConfig.ssl = { rejectUnauthorized: true };
}

const pool = mysql.createPool(poolConfig);

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
