const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

/**
 * Builds the SSL config from env vars. A CA file path is read once at
 * startup so failures surface early, before any request is served.
 *
 * @returns {object | false} node-postgres `ssl` option or `false` for no TLS.
 */
function getSslConfig() {
  if (process.env.DB_SSL !== 'true') return false;
  const caPath = process.env.DB_SSL_CA_PATH;
  return {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
    ...(caPath ? { ca: fs.readFileSync(path.resolve(caPath)).toString() } : {}),
  };
}

/** Shared PostgreSQL connection pool (max 20 clients, 30s idle, 10s connect). */
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'lms_dev',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  ssl: getSslConfig(),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Idle/broken connections emit errors here — log instead of crashing.
pool.on('error', (err) => {
  console.error('Unexpected pool error:', err.message);
});

module.exports = pool;
