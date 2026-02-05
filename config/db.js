const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  // Connection pool settings
  max: 20, // Maximum number of connections in the pool
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established

  //   SSL configuration (if needed, e.g., for production environments)
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
});

// Connection event handlers
pool.on('connect', (client) => {
  console.log('✅ New client connected to Postgresql database');
});

pool.on('error', (err, client) => {
  console.error('❌ Unexpected error on idle client', err);
  //   process.exit(-1);
});

pool.on('acquire', (client) => {
  console.log('🔄 Client acquired from pool');
});

pool.on('remove', (client) => {
  console.log('🗑️ Client removed from pool');
});

// Test the connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
  } else {
    console.log('✅ Database connected successfully at:', res.rows[0].now);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔄 SIGTERM received, shutting down gracefully');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔄 SIGINT received, shutting down gracefully');
  await pool.end();
  process.exit(0);
});

module.exports = pool;
