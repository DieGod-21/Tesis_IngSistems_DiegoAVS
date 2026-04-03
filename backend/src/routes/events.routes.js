const router = require('express').Router();
const ctrl = require('../controllers/events.controller');
const validateUUID = require('../middleware/validateUUID');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

// Lectura: todos los roles autenticados | Escritura: admin y asesor
router.get('/', authenticate, ctrl.getAll);
router.get('/:id', authenticate, validateUUID('id'), ctrl.getById);
router.post('/', authenticate, authorize('admin', 'asesor'), ctrl.create);
router.put('/:id', authenticate, authorize('admin', 'asesor'), validateUUID('id'), ctrl.update);
router.delete('/:id', authenticate, authorize('admin', 'asesor'), validateUUID('id'), ctrl.remove);

module.exports = router;
