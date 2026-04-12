const router = require('express').Router();
const ctrl = require('../controllers/uploads.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validateUUID = require('../middleware/validateUUID');

router.get('/',    authenticate, authorize('admin', 'asesor'), ctrl.getRecent);
router.delete('/:id', authenticate, authorize('admin', 'asesor'), validateUUID('id'), ctrl.deleteUpload);

module.exports = router;
