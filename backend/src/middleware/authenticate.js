const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const { JWT_OPTIONS } = require('../lib/jwtConfig');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ error: 'Token de autenticación requerido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, JWT_OPTIONS);

    // Validate token_version against the database
    if (decoded.token_version !== undefined) {
      const { rows } = await pool.query(
        'SELECT token_version FROM users WHERE id = $1',
        [decoded.user_id]
      );
      if (!rows.length || rows[0].token_version !== decoded.token_version) {
        return res.status(401).json({ error: 'Token revocado. Inicia sesión nuevamente.' });
      }
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }
    next(err);
  }
};

module.exports = authenticate;
