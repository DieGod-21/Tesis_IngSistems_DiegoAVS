const router = require('express').Router();
const ctrl = require('../controllers/semesters.controller');
const validateUUID = require('../middleware/validateUUID');

router.get('/',      ctrl.getAll);
router.get('/:id',   validateUUID('id'), ctrl.getById);
router.post('/',     ctrl.create);
router.put('/:id',   validateUUID('id'), ctrl.update);

module.exports = router;
