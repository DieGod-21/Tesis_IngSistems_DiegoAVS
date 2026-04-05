const router      = require('express').Router();
const ctrl        = require('../controllers/academic_phases.controller');
const authenticate = require('../middleware/authenticate');
const authorize    = require('../middleware/authorize');

// Lectura pública (autenticado) — solo fases activas, para formularios de estudiantes
router.get('/',       authenticate, ctrl.getAll);

// Lectura admin — todas las fases (activas e inactivas)
router.get('/admin',  authenticate, authorize('admin'), ctrl.getAllAdmin);

// CRUD admin
router.post('/',              authenticate, authorize('admin'), ctrl.create);
router.put('/:id',            authenticate, authorize('admin'), ctrl.update);
router.patch('/:id/toggle',   authenticate, authorize('admin'), ctrl.toggle);

// Recarga manual del cache
router.post('/refresh',       authenticate, authorize('admin'), ctrl.refresh);

module.exports = router;
