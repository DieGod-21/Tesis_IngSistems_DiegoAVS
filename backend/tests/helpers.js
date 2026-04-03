/**
 * helpers.js
 *
 * Utilidades compartidas para los tests:
 *   - obtenerToken(): hace login y devuelve un JWT válido de admin
 *   - semesterIdValido(): crea o recupera un semestre de prueba
 *   - limpiarEstudiante(): elimina un estudiante por carnet (cleanup)
 */

const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db/pool');

/**
 * Realiza el login como administrador y retorna el token JWT.
 * Usa las credenciales del usuario admin de la base de datos de prueba.
 */
async function obtenerToken() {
    const res = await request(app)
        .post('/api/auth/login')
        .send({
            correo_electronico: process.env.TEST_ADMIN_EMAIL || 'admin@demo.com',
            contrasena: process.env.TEST_ADMIN_PASSWORD || 'admin123',
        });

    if (res.status !== 200 || !res.body.token) {
        throw new Error(
            `Login de prueba falló (${res.status}): ${JSON.stringify(res.body)}\n` +
            'Verifica TEST_ADMIN_EMAIL y TEST_ADMIN_PASSWORD en .env'
        );
    }
    return res.body.token;
}

/**
 * Recupera el ID del primer semestre disponible en la BD.
 * Si no existe ninguno, lo crea automáticamente.
 */
async function semesterIdValido(token) {
    const res = await request(app)
        .get('/api/semesters')
        .set('Authorization', `Bearer ${token}`);

    if (res.status === 200 && res.body.length > 0) {
        return res.body[0].id;
    }

    // Crea un semestre de prueba si la tabla está vacía
    const crear = await request(app)
        .post('/api/semesters')
        .set('Authorization', `Bearer ${token}`)
        .send({ nombre: 'Semestre Test', anio: 2026, numero: 1 });

    if (crear.status !== 201) {
        throw new Error(`No se pudo crear semestre de prueba: ${JSON.stringify(crear.body)}`);
    }
    return crear.body.id;
}

/**
 * Elimina un estudiante por carnet_id directamente en BD (cleanup de tests).
 */
async function limpiarEstudiante(carnetId) {
    await pool.query('DELETE FROM students WHERE carnet_id = $1', [carnetId]);
}

module.exports = { obtenerToken, semesterIdValido, limpiarEstudiante };
