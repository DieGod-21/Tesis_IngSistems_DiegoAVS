const router = require('express').Router();
const ctrl = require('../controllers/students.controller');
const validateUUID = require('../middleware/validateUUID');

router.get('/',        ctrl.getAll);
router.get('/:id',     validateUUID('id'), ctrl.getById);
router.post('/',       ctrl.create);
router.put('/:id',     validateUUID('id'), ctrl.update);
router.delete('/:id',  validateUUID('id'), ctrl.remove);

module.exports = router;
