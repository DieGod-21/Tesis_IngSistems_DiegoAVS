/**
 * phaseCache.js
 *
 * Cache en memoria de fases académicas (academic_phases).
 *
 * Contexto de migración:
 *   El sistema migró de un campo de texto libre (fase_academica) a una FK
 *   relacional (academic_phase_id → academic_phases.id).
 *   Beneficios: integridad referencial, escalabilidad y sin valores hardcodeados.
 *   Nuevas fases se agregan solo en la BD; el código no requiere cambios.
 *
 * Uso:
 *   1. Llamar loadCache() una vez al iniciar el servidor (en index.js).
 *   2. Usar getAllPhases(), getPhaseById(id) o getPhaseByName(name) en los controladores.
 *   3. Llamar refreshCache() si se agregan/modifican fases en caliente.
 */

const pool = require('../db/pool');

/** @type {Map<number, {id: number, name: string, description: string}>} */
let _cache = new Map();

/** Carga todas las fases desde la BD y llena el cache. */
async function loadCache() {
    const { rows } = await pool.query(
        'SELECT id, name, description FROM academic_phases ORDER BY id'
    );
    _cache = new Map(rows.map((p) => [p.id, p]));
    console.log(`[phaseCache] ${_cache.size} fase(s) académica(s) cargada(s)`);
}

/** Retorna todas las fases como array. */
function getAllPhases() {
    return Array.from(_cache.values());
}

/**
 * Retorna la fase por su ID numérico, o null si no existe.
 * @param {number|string} id
 */
function getPhaseById(id) {
    return _cache.get(Number(id)) ?? null;
}

/**
 * Retorna la fase por su nombre (code), o null si no existe.
 * Uso interno para compatibilidad con el campo legado fase_academica.
 * @param {string} name
 */
function getPhaseByName(name) {
    for (const p of _cache.values()) {
        if (p.name === name) return p;
    }
    return null;
}

/** Recarga el cache desde la BD (útil si se agregan fases sin reiniciar). */
async function refreshCache() {
    await loadCache();
}

module.exports = { loadCache, getAllPhases, getPhaseById, getPhaseByName, refreshCache };
