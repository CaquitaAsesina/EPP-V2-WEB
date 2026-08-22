const app = require('./app');
const env = require('./config/env');

const PORT = env.port;

// Catch uncaught errors so the server stays alive
process.on('uncaughtException', (err) => {
  console.error('❌ Excepción no capturada:', err.message);
  console.error(err.stack);
});
process.on('unhandledRejection', (reason) => {
  console.error('❌ Rechazo no manejado:', reason);
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor EPP Inventory corriendo en http://localhost:${PORT}`);
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
