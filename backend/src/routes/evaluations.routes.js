const router = require('express').Router();
const ctrl = require('../controllers/evaluations.controller');
const validateUUID = require('../middleware/validateUUID');

router.get('/by-project/:project_id',  validateUUID('project_id'), ctrl.getByProject);
router.get('/:id',                     validateUUID('id'), ctrl.getById);
router.post('/',                       ctrl.create);
router.put('/:id',                     validateUUID('id'), ctrl.update);

module.exports = router;
