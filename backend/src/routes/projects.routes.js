const router = require('express').Router();
const ctrl = require('../controllers/projects.controller');
const validateUUID = require('../middleware/validateUUID');

router.get('/', ctrl.getAll);
router.get('/by-student/:student_id', validateUUID('student_id'), ctrl.getByStudent);
router.get('/:id', validateUUID('id'), ctrl.getById);
router.post('/', ctrl.create);
router.put('/:id', validateUUID('id'), ctrl.update);

module.exports = router;
