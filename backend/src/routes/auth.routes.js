const router    = require('express').Router();
const rateLimit = require('express-rate-limit');
const ctrl      = require('../controllers/auth.controller');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,                  // 10 intentos por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.' },
});

// POST /api/auth/login  — ruta pública, con rate limiting
router.post('/login', loginLimiter, ctrl.login);

module.exports = router;
