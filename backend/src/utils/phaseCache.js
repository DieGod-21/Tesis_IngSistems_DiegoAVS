/**
 * phaseCache.js
 *
 * Cache en memoria de fases académicas (academic_phases).
 *
 * Contexto de migración:
 *   El sistema migró de un campo de texto libre (fase_academica) a una FK
 *   relacional (academic_phase_id → academic_phases.id).
 *   Beneficios: integridad referencial, escalabilidad y sin valores hardcodeados.
 *
 * Uso:
 *   1. Llamar loadCache() una vez al iniciar el servidor (en index.js).
 *   2. Usar getAllPhases(), getPhaseById(id) o getPhaseByName(name) en los controladores.
 *   3. Llamar refreshCache() después de crear/modificar fases en caliente.
 */

const pool = require('../db/pool');

/** @type {Map<number, {id: number, name: string, description: string, is_active: boolean}>} */
let _cache = new Map();

/** Carga todas las fases desde la BD (activas e inactivas) y llena el cache. */
async function loadCache() {
    const { rows } = await pool.query(
        'SELECT id, name, description, is_active FROM academic_phases ORDER BY id'
    );
    _cache = new Map(rows.map((p) => [p.id, p]));
    console.log(`[phaseCache] ${_cache.size} fase(s) académica(s) cargada(s)`);
}

/** Retorna solo las fases activas como array (uso en formularios de estudiantes y API pública). */
function getAllPhases() {
    return Array.from(_cache.values()).filter((p) => p.is_active);
}

/** Retorna todas las fases (activas e inactivas) — solo para administradores. */
function getAllPhasesAdmin() {
    return Array.from(_cache.values());
}

/**
 * Retorna la fase por su ID numérico, o null si no existe.
 * Busca en el cache completo (activas e inactivas).
 * @param {number|string} id
 */
function getPhaseById(id) {
    return _cache.get(Number(id)) ?? null;
}

/**
 * Retorna la fase por su nombre, o null si no existe.
 * Uso interno para compatibilidad con el campo legado fase_academica.
 * @param {string} name
 */
function getPhaseByName(name) {
    for (const p of _cache.values()) {
        if (p.name === name) return p;
    }
    return null;
}

/** Recarga el cache desde la BD (llamar después de crear/modificar fases). */
async function refreshCache() {
    await loadCache();
}

module.exports = { loadCache, getAllPhases, getAllPhasesAdmin, getPhaseById, getPhaseByName, refreshCache };
