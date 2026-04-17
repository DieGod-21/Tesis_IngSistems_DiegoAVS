const REQUIRED_VARS = [
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'PORT',
  'JWT_SECRET',
  'CORS_ORIGIN',
];

const MIN_JWT_SECRET_LENGTH = 32;

const validate = () => {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
  if (missing.length) {
    console.error(`[ENV] Variables de entorno faltantes: ${missing.join(', ')}`);
    process.exit(1);
  }

  if (process.env.JWT_SECRET.length < MIN_JWT_SECRET_LENGTH) {
    console.error(`[ENV] JWT_SECRET debe tener al menos ${MIN_JWT_SECRET_LENGTH} caracteres (actual: ${process.env.JWT_SECRET.length})`);
    process.exit(1);
  }
};

module.exports = { validate };