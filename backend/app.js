const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const app = express();

// Middleware
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/periods', require('./routes/periodRoutes'));
app.use('/api/epp-types', require('./routes/eppTypeRoutes'));
app.use('/api/sizes', require('./routes/sizeRoutes'));
app.use('/api/workers', require('./routes/workerRoutes'));
app.use('/api/clean-inventory', require('./routes/cleanInventoryRoutes'));
app.use('/api/dirty-inventory', require('./routes/dirtyInventoryRoutes'));
app.use('/api/incomes', require('./routes/incomeRoutes'));
app.use('/api/deliveries', require('./routes/deliveryRoutes'));
app.use('/api/returns', require('./routes/returnRoutes'));
app.use('/api/laundry', require('./routes/laundryRoutes'));
app.use('/api/physical-inventory', require('./routes/physicalInventoryRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/movements', require('./routes/movementRoutes'));
app.use('/api/audit', require('./routes/auditRoutes'));
app.use('/api/user-preferences', require('./routes/userPreferencesRoutes'));

// Fallback for non-API, non-static routes
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.includes('.')) {
    return res.sendFile(path.join(__dirname, '../frontend/html/login.html'));
  }
  next();
});

// 404 for API routes
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});

// Global error handler - MUST be last with 4 params
app.use((err, req, res, next) => {
  console.error('❌ ERROR HANDLER:', err.message);
  console.error('❌ Stack:', err.stack);
  const statusCode = err.statusCode || 500;
  const message = err.statusCode ? err.message : 'Error interno del servidor';
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;
