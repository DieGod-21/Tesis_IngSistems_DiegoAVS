const router       = require('express').Router();
const ctrl         = require('../controllers/notifications.controller');
const authenticate = require('../middleware/authenticate');
const validateUUID = require('../middleware/validateUUID');

router.get('/',              authenticate, ctrl.getAll);
router.get('/unread-count',  authenticate, ctrl.unreadCount);
router.patch('/read-all',    authenticate, ctrl.markAllRead);
router.patch('/:id/read',    authenticate, validateUUID('id'), ctrl.markRead);

module.exports = router;
