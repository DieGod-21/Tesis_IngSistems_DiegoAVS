const router = require('express').Router();
const ctrl = require('../controllers/evaluations.controller');
const validateUUID = require('../middleware/validateUUID');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

// Solo admin y asesor pueden ver y gestionar evaluaciones
router.get('/by-project/:project_id', authenticate, authorize('admin', 'asesor'), validateUUID('project_id'), ctrl.getByProject);
router.get('/:id', authenticate, authorize('admin', 'asesor'), validateUUID('id'), ctrl.getById);
router.post('/', authenticate, authorize('admin', 'asesor'), ctrl.create);
router.put('/:id', authenticate, authorize('admin', 'asesor'), validateUUID('id'), ctrl.update);

module.exports = router;
