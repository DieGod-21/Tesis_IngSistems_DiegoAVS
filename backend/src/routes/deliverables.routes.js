const router = require('express').Router();
const ctrl = require('../controllers/deliverables.controller');
const validateUUID = require('../middleware/validateUUID');

// Plantillas
router.get('/templates',             ctrl.getTemplates);
router.get('/templates/:id',         validateUUID('id'), ctrl.getTemplateById);
router.post('/templates',            ctrl.createTemplate);

// Entregables por proyecto
router.get('/project/:project_id',   validateUUID('project_id'), ctrl.getByProject);
router.get('/:id',                   validateUUID('id'), ctrl.getDeliverableById);
router.post('/',                     ctrl.createDeliverable);
router.put('/:id',                   validateUUID('id'), ctrl.updateDeliverable);

module.exports = router;
