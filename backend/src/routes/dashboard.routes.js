const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const authorize    = require('../middleware/authorize');
const ctrl         = require('../controllers/dashboard.controller');

const router = Router();

router.get('/summary',         authenticate, authorize('admin', 'asesor'), ctrl.getSummary);
router.get('/recent-students', authenticate, authorize('admin', 'asesor'), ctrl.getRecentStudents);

module.exports = router;
