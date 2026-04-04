const router = require('express').Router();
const ctrl = require('../controllers/uploads.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

router.get('/', authenticate, authorize('admin', 'asesor'), ctrl.getRecent);

module.exports = router;
