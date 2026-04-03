const router = require('express').Router();
const ctrl   = require('../controllers/auth.controller');

// POST /api/auth/login  — ruta pública, sin autenticación
router.post('/login', ctrl.login);

module.exports = router;
