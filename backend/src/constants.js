/** Expresión regular para validar formato de correo electrónico */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Estados válidos por entidad.
 * Los valores deben coincidir exactamente con los CHECK constraints de la BD.
 */
const ESTADOS = {
    usuario:    ['activo', 'inactivo', 'suspendido'],
    proyecto:   ['activo', 'inactivo', 'completado', 'cancelado'],
    entregable: ['pendiente', 'entregado', 'revisado', 'aprobado', 'rechazado'],
    evaluacion: ['borrador', 'publicado', 'cerrado'],
};

/**
 * Tipos válidos por entidad.
 * Los valores deben coincidir exactamente con los CHECK constraints de la BD.
 */
const TIPOS = {
    evento:     ['defensa', 'reunion', 'revision', 'entrega', 'otro'],
    evaluacion: ['parcial', 'final', 'seguimiento'],
};

module.exports = { EMAIL_REGEX, ESTADOS, TIPOS };