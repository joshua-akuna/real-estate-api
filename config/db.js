const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Connection event handlers
pool.on('connect', (client) => {
  console.log('✅ New client connected to Postgresql database');
});

pool.on('error', (err, client) => {
  console.error('❌ Unexpected error on idle client', err);
  //   process.exit(-1);
});

// helper function to execute queries
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    if (process.env.NODE_ENV === 'development') {
      console.log('Executed query', { text, duration, rows: result.rowCount });
    }
    return result;
  } catch (err) {
    console.error('Error executing query', { text, err });
    throw err;
  }
};

module.exports = { pool, query };
