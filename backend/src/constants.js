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

/** Mínimo 8 caracteres, 1 mayúscula, 1 minúscula, 1 número */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

module.exports = { EMAIL_REGEX, ESTADOS, TIPOS, PASSWORD_REGEX };