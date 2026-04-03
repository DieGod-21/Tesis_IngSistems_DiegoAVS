const REQUIRED_VARS = [
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'PORT',
  'JWT_SECRET',
];

const validate = () => {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
  if (missing.length) {
    console.error(`[ENV] Variables de entorno faltantes: ${missing.join(', ')}`);
    process.exit(1);
  }
};

module.exports = { validate };