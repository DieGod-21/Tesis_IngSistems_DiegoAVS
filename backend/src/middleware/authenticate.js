const jwt = require('jsonwebtoken');
const { JWT_OPTIONS } = require('../lib/jwtConfig');

const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ error: 'Token de autenticación requerido' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET, JWT_OPTIONS);
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

module.exports = authenticate;
