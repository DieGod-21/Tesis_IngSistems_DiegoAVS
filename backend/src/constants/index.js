const FASES_VALIDAS = ['anteproyecto', 'tesis', 'eps'];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ESTADOS = {
  usuario:     ['activo', 'inactivo', 'suspendido'],
  proyecto:    ['activo', 'inactivo', 'completado', 'suspendido'],
  entregable:  ['pendiente', 'entregado', 'aprobado', 'rechazado'],
  evaluacion:  ['borrador', 'publicado', 'revisado'],
};

const TIPOS = {
  evaluacion: ['parcial', 'final', 'defensa'],
  evento:     ['defensa', 'reunion', 'taller', 'otro'],
};

module.exports = { FASES_VALIDAS, EMAIL_REGEX, ESTADOS, TIPOS };
