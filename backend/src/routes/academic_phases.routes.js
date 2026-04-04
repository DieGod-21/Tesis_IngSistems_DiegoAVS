const router = require('express').Router();
const ctrl = require('../controllers/academic_phases.controller');
const authenticate = require('../middleware/authenticate');

router.get('/',         authenticate, ctrl.getAll);
router.post('/refresh', authenticate, ctrl.refresh);

module.exports = router;
