const router = require('express').Router();
const ctrl = require('../controllers/semesters.controller');
const validateUUID = require('../middleware/validateUUID');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

// Lectura: todos los roles autenticados | Escritura: solo admin
router.get('/', authenticate, ctrl.getAll);
router.get('/:id', authenticate, validateUUID('id'), ctrl.getById);
router.post('/', authenticate, authorize('admin'), ctrl.create);
router.put('/:id', authenticate, authorize('admin'), validateUUID('id'), ctrl.update);

module.exports = router;
