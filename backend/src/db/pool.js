const { Pool } = require('pg');
const logger = require('../lib/logger');

function buildSslConfig() {
  if (process.env.NODE_ENV !== 'production') return false;
  const cfg = { rejectUnauthorized: true };
  if (process.env.DB_CA_CERT) cfg.ca = process.env.DB_CA_CERT;
  return cfg;
}

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: buildSslConfig(),
});

pool.connect()
  .then((client) => {
    logger.info('Conexión a PostgreSQL exitosa');
    client.release();
  })
  .catch((err) => logger.error({ err }, 'Error al conectar a PostgreSQL'));

module.exports = pool;