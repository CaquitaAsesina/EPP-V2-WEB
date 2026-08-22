const dotenv = require('dotenv');
const path = require('path');

// Only load .env file for LOCAL development
// Render, Vercel, etc. inject env vars directly into process.env
dotenv.config({ path: path.join(__dirname, '../../.env') });

const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'epp_inventory',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 10,
  dniEncryptionKey: process.env.DNI_ENCRYPTION_KEY
};

// Debug: log where config is coming from (only in production)
if (process.env.NODE_ENV === 'production') {
  console.log('📋 Config DB host:', config.db.host);
  console.log('📋 Config DB port:', config.db.port);
  console.log('📋 Config DB user:', config.db.user);
  console.log('📋 Config DB ssl:', String(process.env.DB_SSL).toLowerCase() === 'true');
  console.log('📋 Config DB name:', config.db.database);
}

module.exports = config;
