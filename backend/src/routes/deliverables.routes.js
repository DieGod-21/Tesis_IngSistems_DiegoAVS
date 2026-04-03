const router = require('express').Router();
const ctrl = require('../controllers/deliverables.controller');
const validateUUID = require('../middleware/validateUUID');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

// Plantillas
router.get('/templates', authenticate, ctrl.getTemplates);
router.get('/templates/:id', authenticate, validateUUID('id'), ctrl.getTemplateById);
router.post('/templates', authenticate, authorize('admin', 'asesor'), ctrl.createTemplate);

// Entregables por proyecto
router.get('/project/:project_id', authenticate, validateUUID('project_id'), ctrl.getByProject);
router.get('/:id', authenticate, validateUUID('id'), ctrl.getDeliverableById);
router.post('/', authenticate, authorize('admin', 'asesor'), ctrl.createDeliverable);
router.put('/:id', authenticate, authorize('admin', 'asesor'), validateUUID('id'), ctrl.updateDeliverable);

module.exports = router;
