const router = require('express').Router();
const ctrl = require('../controllers/users.controller');
const validateUUID = require('../middleware/validateUUID');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

// Rutas del usuario autenticado (sin rol admin)
router.get('/me', authenticate, ctrl.getMe);
router.patch('/me/password', authenticate, ctrl.changePassword);

// Solo admin puede gestionar usuarios
router.get('/', authenticate, authorize('admin'), ctrl.getAll);
router.get('/:id', authenticate, authorize('admin'), validateUUID('id'), ctrl.getById);
router.post('/', authenticate, authorize('admin'), ctrl.create);
router.put('/:id', authenticate, authorize('admin'), validateUUID('id'), ctrl.update);
router.delete('/:id', authenticate, authorize('admin'), validateUUID('id'), ctrl.remove);

module.exports = router;
