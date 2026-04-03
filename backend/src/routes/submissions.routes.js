const router = require('express').Router();
const ctrl = require('../controllers/submissions.controller');
const validateUUID = require('../middleware/validateUUID');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

// Lectura: todos los roles autenticados
// Crear entrega: todos los roles (estudiante sube su propio archivo — submitted_by viene del token)
// Observaciones: solo admin y asesor pueden crearlas
router.get('/by-deliverable/:deliverable_id', authenticate, validateUUID('deliverable_id'), ctrl.getByDeliverable);
router.get('/:id', authenticate, validateUUID('id'), ctrl.getById);
router.post('/', authenticate, ctrl.create);
router.get('/:id/observations', authenticate, validateUUID('id'), ctrl.getObservations);
router.post('/:id/observations', authenticate, authorize('admin', 'asesor'), validateUUID('id'), ctrl.createObservation);

module.exports = router;
