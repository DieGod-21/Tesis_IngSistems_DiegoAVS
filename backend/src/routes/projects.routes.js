const router = require('express').Router();
const ctrl = require('../controllers/projects.controller');
const validateUUID = require('../middleware/validateUUID');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

// Lectura: todos los roles autenticados | Escritura: admin y asesor
router.get('/', authenticate, ctrl.getAll);
router.get('/by-student/:student_id', authenticate, validateUUID('student_id'), ctrl.getByStudent);
router.get('/:id', authenticate, validateUUID('id'), ctrl.getById);
router.post('/', authenticate, authorize('admin', 'asesor'), ctrl.create);
router.put('/:id', authenticate, authorize('admin', 'asesor'), validateUUID('id'), ctrl.update);

module.exports = router;
