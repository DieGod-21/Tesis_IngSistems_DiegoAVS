const router       = require('express').Router();
const rateLimit    = require('express-rate-limit');
const ctrl         = require('../controllers/auth.controller');
const authenticate = require('../middleware/authenticate');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.' },
});

router.post('/login', loginLimiter, ctrl.login);
router.get('/verify', authenticate, ctrl.verify);

module.exports = router;
