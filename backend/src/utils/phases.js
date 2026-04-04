/**
 * phases.js
 *
 * Helper para validar fases académicas usando el cache en memoria.
 * Ya no realiza consultas a la BD en cada llamada.
 */

const { getPhaseByName, getAllPhases } = require('./phaseCache');

/**
 * Busca una fase por nombre desde el cache.
 * Retorna { id, name, description } o null si no existe.
 * @param {string} name
 */
function findPhaseByName(name) {
    if (!name) return null;
    return getPhaseByName(name);
}

/**
 * Retorna un mensaje de error si `name` no es una fase válida, o null si es válida.
 * Uso: const err = validatePhaseName(fase_academica); if (err) return res.status(400)…
 * @param {string} name
 */
function validatePhaseName(name) {
    if (!name) return null;
    const phase = getPhaseByName(name);
    if (!phase) {
        const valid = getAllPhases().map((p) => p.name).join(', ');
        return `fase_academica inválida: "${name}". Valores válidos: ${valid}`;
    }
    return null;
}

module.exports = { findPhaseByName, validatePhaseName };
