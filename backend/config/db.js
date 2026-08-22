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
    console.error('❌ Error al conectar con MySQL:', err.message || err.code || String(err));
    console.error('   Host:', process.env.DB_HOST);
    console.error('   Port:', process.env.DB_PORT);
    console.error('   User:', process.env.DB_USER);
    console.error('   SSL:', process.env.DB_SSL);
    console.error('   Stack:', err.stack || 'no stack');
  });

module.exports = pool;
