const router = require('express').Router();
const ctrl = require('../controllers/students.controller');
const validateUUID = require('../middleware/validateUUID');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

// Plantilla Excel descargable (pública con auth)
router.get('/template', authenticate, ctrl.downloadTemplate);

// Lectura: admin y asesor | Escritura: admin y asesor
router.get('/',       authenticate, authorize('admin', 'asesor'), ctrl.getAll);
router.post('/bulk',  authenticate, authorize('admin', 'asesor'), ctrl.bulkCreate);
router.get('/:id',   authenticate, authorize('admin', 'asesor'), validateUUID('id'), ctrl.getById);
router.post('/',      authenticate, authorize('admin', 'asesor'), ctrl.create);
router.put('/:id',   authenticate, authorize('admin', 'asesor'), validateUUID('id'), ctrl.update);
router.delete('/:id',authenticate, authorize('admin', 'asesor'), validateUUID('id'), ctrl.remove);

module.exports = router;
