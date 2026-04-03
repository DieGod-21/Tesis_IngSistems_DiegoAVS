const router = require('express').Router();
const ctrl = require('../controllers/submissions.controller');
const validateUUID = require('../middleware/validateUUID');

router.get('/by-deliverable/:deliverable_id',  validateUUID('deliverable_id'), ctrl.getByDeliverable);
router.get('/:id',                             validateUUID('id'), ctrl.getById);
router.post('/',                               ctrl.create);
router.get('/:id/observations',                validateUUID('id'), ctrl.getObservations);
router.post('/:id/observations',               validateUUID('id'), ctrl.createObservation);

module.exports = router;
