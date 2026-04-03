/**
 * students.test.js
 *
 * Tests automatizados para el módulo de Estudiantes.
 * Cubre los endpoints:
 *   - GET  /api/students             (listado y filtros)
 *   - POST /api/students             (registro individual)
 *   - PUT  /api/students/:id         (actualización / toggle aprobación)
 *   - POST /api/students/bulk        (carga masiva desde JSON de filas)
 *
 * Casos cubiertos:
 *   ✓ Carga correcta (datos válidos)
 *   ✓ Datos incompletos o faltantes
 *   ✓ Formato de correo inválido
 *   ✓ Fase académica inválida
 *   ✓ Duplicados (carnet_id único)
 *   ✓ Filtros por aprobación
 *   ✓ Toggle de aprobación (PUT)
 *   ✓ Carga masiva con filas mixtas (válidas + inválidas)
 *   ✓ Acceso sin token (401)
 */

require('dotenv').config();
const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db/pool');
const { obtenerToken, semesterIdValido, limpiarEstudiante } = require('./helpers');

// ─── Estado compartido entre tests ──────────────────────────────────────────
let token;
let semesterId;
let estudianteId; // ID creado en "registro exitoso", reutilizado en tests posteriores

const CARNET_PRUEBA = 'TEST-2026-001';
const CARNET_BULK_1 = 'TEST-BULK-001';
const CARNET_BULK_2 = 'TEST-BULK-002';

// ─── Setup / Teardown ────────────────────────────────────────────────────────

beforeAll(async () => {
    token = await obtenerToken();
    semesterId = await semesterIdValido(token);
});

afterAll(async () => {
    // Limpieza: eliminar registros creados durante los tests
    await limpiarEstudiante(CARNET_PRUEBA);
    await limpiarEstudiante(CARNET_BULK_1);
    await limpiarEstudiante(CARNET_BULK_2);
    await pool.end();
});

// ─── 1. GET /api/students ────────────────────────────────────────────────────

describe('GET /api/students', () => {
    test('retorna lista de estudiantes con token válido', async () => {
        const res = await request(app)
            .get('/api/students')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    test('retorna 401 sin token de autenticación', async () => {
        const res = await request(app).get('/api/students');
        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('error');
    });

    test('filtra por approved=false correctamente', async () => {
        const res = await request(app)
            .get('/api/students?approved=false')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        // Todos los resultados deben tener approved = false
        res.body.forEach((e) => {
            expect(e.approved).toBe(false);
        });
    });

    test('filtra por approved=true correctamente', async () => {
        const res = await request(app)
            .get('/api/students?approved=true')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        res.body.forEach((e) => {
            expect(e.approved).toBe(true);
        });
    });

    test('filtra por fase_academica válida', async () => {
        const res = await request(app)
            .get('/api/students?fase_academica=tesis')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        res.body.forEach((e) => {
            expect(e.fase_academica).toBe('tesis');
        });
    });

    test('retorna 400 con fase_academica inválida', async () => {
        const res = await request(app)
            .get('/api/students?fase_academica=invalida')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
    });
});

// ─── 2. POST /api/students — Registro individual ─────────────────────────────

describe('POST /api/students — registro individual', () => {
    test('registra un estudiante con datos válidos', async () => {
        const res = await request(app)
            .post('/api/students')
            .set('Authorization', `Bearer ${token}`)
            .send({
                nombre_completo: 'Estudiante de Prueba',
                carnet_id: CARNET_PRUEBA,
                correo_institucional: 'eprueba@miumg.edu.gt',
                fase_academica: 'tesis',
                semester_id: semesterId,
                approved: false,
            });

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({
            nombre_completo: 'Estudiante de Prueba',
            carnet_id: CARNET_PRUEBA,
            fase_academica: 'tesis',
            approved: false,
        });
        expect(res.body).toHaveProperty('id');
        estudianteId = res.body.id; // guardar para tests de PUT
    });

    test('retorna 400 si faltan campos obligatorios', async () => {
        const res = await request(app)
            .post('/api/students')
            .set('Authorization', `Bearer ${token}`)
            .send({
                nombre_completo: 'Sin Carnet',
                // carnet_id faltante
                correo_institucional: 'test@miumg.edu.gt',
                fase_academica: 'eps',
                semester_id: semesterId,
            });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
    });

    test('retorna 400 con correo de formato inválido', async () => {
        const res = await request(app)
            .post('/api/students')
            .set('Authorization', `Bearer ${token}`)
            .send({
                nombre_completo: 'Correo Malo',
                carnet_id: 'CARNET-CORREO-MAL',
                correo_institucional: 'no-es-un-correo',
                fase_academica: 'tesis',
                semester_id: semesterId,
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/correo/i);
    });

    test('retorna 400 con fase_academica inválida', async () => {
        const res = await request(app)
            .post('/api/students')
            .set('Authorization', `Bearer ${token}`)
            .send({
                nombre_completo: 'Fase Inválida',
                carnet_id: 'CARNET-FASE-MAL',
                correo_institucional: 'fasemala@miumg.edu.gt',
                fase_academica: 'postgrado', // no válida
                semester_id: semesterId,
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/fase_academica/i);
    });

    test('retorna error al intentar duplicar carnet_id', async () => {
        // Intenta registrar el mismo carnet creado en el test anterior
        const res = await request(app)
            .post('/api/students')
            .set('Authorization', `Bearer ${token}`)
            .send({
                nombre_completo: 'Duplicado Test',
                carnet_id: CARNET_PRUEBA, // duplicado
                correo_institucional: 'duplicado@miumg.edu.gt',
                fase_academica: 'anteproyecto',
                semester_id: semesterId,
            });

        // El backend retorna 409 (conflict) o 500 según constraint de BD
        expect([409, 400, 500]).toContain(res.status);
        expect(res.body).toHaveProperty('error');
    });

    test('retorna 401 sin token al intentar crear estudiante', async () => {
        const res = await request(app)
            .post('/api/students')
            .send({
                nombre_completo: 'Sin Auth',
                carnet_id: 'CARNET-SIN-AUTH',
                correo_institucional: 'sinauth@miumg.edu.gt',
                fase_academica: 'tesis',
                semester_id: semesterId,
            });

        expect(res.status).toBe(401);
    });
});

// ─── 3. PUT /api/students/:id — Actualización y toggle aprobación ─────────────

describe('PUT /api/students/:id — actualización', () => {
    test('aprueba un estudiante (toggle approved = true)', async () => {
        expect(estudianteId).toBeDefined(); // debe haber sido creado antes

        const res = await request(app)
            .put(`/api/students/${estudianteId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ approved: true });

        expect(res.status).toBe(200);
        expect(res.body.approved).toBe(true);
        expect(res.body.id).toBe(estudianteId);
    });

    test('desaprueba un estudiante (toggle approved = false)', async () => {
        const res = await request(app)
            .put(`/api/students/${estudianteId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ approved: false });

        expect(res.status).toBe(200);
        expect(res.body.approved).toBe(false);
    });

    test('actualiza la fase académica correctamente', async () => {
        const res = await request(app)
            .put(`/api/students/${estudianteId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ fase_academica: 'eps' });

        expect(res.status).toBe(200);
        expect(res.body.fase_academica).toBe('eps');
    });

    test('retorna 400 con fase_academica inválida en PUT', async () => {
        const res = await request(app)
            .put(`/api/students/${estudianteId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ fase_academica: 'invalida' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
    });

    test('retorna 400 con UUID inválido en la ruta', async () => {
        const res = await request(app)
            .put('/api/students/no-es-uuid')
            .set('Authorization', `Bearer ${token}`)
            .send({ approved: true });

        expect(res.status).toBe(400);
    });

    test('retorna 404 con UUID válido pero inexistente', async () => {
        const res = await request(app)
            .put('/api/students/00000000-0000-0000-0000-000000000000')
            .set('Authorization', `Bearer ${token}`)
            .send({ approved: true });

        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error');
    });
});

// ─── 4. POST /api/students/bulk — Carga masiva ───────────────────────────────

describe('POST /api/students/bulk — carga masiva', () => {
    test('importa correctamente filas válidas', async () => {
        const filas = [
            {
                nombre_completo: 'Bulk Estudiante Uno',
                carnet_id: CARNET_BULK_1,
                correo_institucional: 'bulk1@miumg.edu.gt',
                fase_academica: 'anteproyecto',
                semester_id: semesterId,
            },
            {
                nombre_completo: 'Bulk Estudiante Dos',
                carnet_id: CARNET_BULK_2,
                correo_institucional: 'bulk2@miumg.edu.gt',
                fase_academica: 'tesis',
                semester_id: semesterId,
            },
        ];

        const res = await request(app)
            .post('/api/students/bulk')
            .set('Authorization', `Bearer ${token}`)
            .send({ filas });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('importados');
        expect(res.body).toHaveProperty('rechazados');
        expect(res.body).toHaveProperty('errores');
        expect(res.body.importados).toBe(2);
        expect(res.body.rechazados).toBe(0);
    });

    test('rechaza filas con correo inválido y acepta las válidas', async () => {
        const filas = [
            {
                nombre_completo: 'Correo Malo Bulk',
                carnet_id: 'BULK-CORREO-MAL',
                correo_institucional: 'no-es-correo',
                fase_academica: 'tesis',
                semester_id: semesterId,
            },
            {
                nombre_completo: 'Correo Bueno Bulk',
                carnet_id: 'BULK-CORREO-OK-' + Date.now(),
                correo_institucional: 'bueno' + Date.now() + '@miumg.edu.gt',
                fase_academica: 'eps',
                semester_id: semesterId,
            },
        ];

        const res = await request(app)
            .post('/api/students/bulk')
            .set('Authorization', `Bearer ${token}`)
            .send({ filas });

        expect(res.status).toBe(200);
        expect(res.body.rechazados).toBe(1);
        expect(res.body.importados).toBe(1);
        expect(res.body.errores.length).toBeGreaterThanOrEqual(1);
        expect(res.body.errores[0]).toHaveProperty('fila');
        expect(res.body.errores[0]).toHaveProperty('razon');

        // Limpiar el que sí se insertó
        await limpiarEstudiante(filas[1].carnet_id);
    });

    test('rechaza filas con datos incompletos (nombre faltante)', async () => {
        const filas = [
            {
                // nombre_completo faltante
                carnet_id: 'BULK-SIN-NOMBRE',
                correo_institucional: 'sinnombre@miumg.edu.gt',
                fase_academica: 'tesis',
                semester_id: semesterId,
            },
        ];

        const res = await request(app)
            .post('/api/students/bulk')
            .set('Authorization', `Bearer ${token}`)
            .send({ filas });

        expect(res.status).toBe(200);
        expect(res.body.rechazados).toBe(1);
        expect(res.body.importados).toBe(0);
    });

    test('detecta duplicados dentro de la misma carga masiva', async () => {
        const filas = [
            {
                nombre_completo: 'Dup A',
                carnet_id: 'BULK-DUP-SAME',
                correo_institucional: 'dupa@miumg.edu.gt',
                fase_academica: 'tesis',
                semester_id: semesterId,
            },
            {
                nombre_completo: 'Dup B',
                carnet_id: 'BULK-DUP-SAME', // mismo carnet
                correo_institucional: 'dupb@miumg.edu.gt',
                fase_academica: 'anteproyecto',
                semester_id: semesterId,
            },
        ];

        const res = await request(app)
            .post('/api/students/bulk')
            .set('Authorization', `Bearer ${token}`)
            .send({ filas });

        expect(res.status).toBe(200);
        // Solo uno puede haberse insertado; el otro es duplicado
        expect(res.body.importados + res.body.rechazados).toBe(2);
        expect(res.body.rechazados).toBeGreaterThanOrEqual(1);

        // Limpiar
        await limpiarEstudiante('BULK-DUP-SAME');
    });

    test('retorna 400 si no se envían filas', async () => {
        const res = await request(app)
            .post('/api/students/bulk')
            .set('Authorization', `Bearer ${token}`)
            .send({});

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
    });

    test('retorna 400 si filas no es un array', async () => {
        const res = await request(app)
            .post('/api/students/bulk')
            .set('Authorization', `Bearer ${token}`)
            .send({ filas: 'no-es-array' });

        expect(res.status).toBe(400);
    });

    test('retorna 401 sin token', async () => {
        const res = await request(app)
            .post('/api/students/bulk')
            .send({ filas: [] });

        expect(res.status).toBe(401);
    });
});
