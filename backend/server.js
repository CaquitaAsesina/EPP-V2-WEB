const app = require('./app');
const env = require('./config/env');

const PORT = env.port;

// Catch uncaught errors so the server stays alive
process.on('uncaughtException', (err) => {
  console.error('❌ Excepción no capturada:', err.message || err);
  console.error(err.stack || err);
});
process.on('unhandledRejection', (reason) => {
  console.error('❌ Rechazo no manejado:', reason || 'unknown reason');
});

console.log('🚀 Iniciando Sistema de Inventario EPP...');
console.log('📋 NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('📋 DB_HOST:', process.env.DB_HOST || 'not set');
console.log('📋 DB_SSL:', process.env.DB_SSL || 'not set');

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor EPP Inventory corriendo en http://0.0.0.0:${PORT}`);
  console.log(`📊 Frontend: http://localhost:${PORT}/html/login.html`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
});

// Keep alive
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM recibido, cerrando servidor...');
  server.close(() => process.exit(0));
});
process.on('SIGINT', () => {
  console.log('🛑 SIGINT recibido, cerrando servidor...');
  server.close(() => process.exit(0));
});
