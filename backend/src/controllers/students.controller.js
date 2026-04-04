const pool = require('../db/pool');
const ExcelJS = require('exceljs');
const { EMAIL_REGEX } = require('../constants');
const { getPhaseById, getPhaseByName, getAllPhases } = require('../utils/phaseCache');

// ─── Helpers ─────────────────────────────────────────────────────────────────

const normalize = (str) => str?.trim().replace(/\s+/g, ' ') ?? '';

/**
 * Resuelve la fase académica a { phaseId, phaseName } desde el cache en memoria.
 * Acepta `academic_phase_id` (número) — vía relacional (preferido)
 *   o `fase_academica` (texto) — campo legado (@deprecated), por compatibilidad.
 * Retorna null si ninguno fue provisto.
 * Lanza un error con .status=400 si el valor no es válido.
 */
function resolvePhase({ academic_phase_id, fase_academica }) {
    if (academic_phase_id != null) {
        const phase = getPhaseById(academic_phase_id);
        if (!phase) {
            const err = new Error('academic_phase_id no válido');
            err.status = 400;
            throw err;
        }
        return { phaseId: phase.id, phaseName: phase.name };
    }
    // Compatibilidad con el campo legado fase_academica (texto)
    if (fase_academica) {
        const phase = getPhaseByName(fase_academica);
        if (!phase) {
            const err = new Error(`fase_academica inválida: "${fase_academica}"`);
            err.status = 400;
            throw err;
        }
        return { phaseId: phase.id, phaseName: phase.name };
    }
    return null;
}

// ─── Columnas SELECT con JOINs ────────────────────────────────────────────────
// Nota: academic_phase_id es el nombre correcto de la columna post-migración 002.
// INNER JOIN es seguro porque academic_phase_id es NOT NULL.

const STUDENT_SELECT = `
  SELECT s.id, s.nombre_completo, s.carnet_id, s.correo_institucional,
         s.fase_academica, s.semester_id, s.approved,
         s.created_by, s.created_at, s.updated_at,
         s.academic_phase_id,
         ap.name AS phase_name, ap.description AS phase_description,
         sem.nombre AS semestre
  FROM students s
  LEFT JOIN semesters sem ON sem.id = s.semester_id
  INNER JOIN academic_phases ap ON ap.id = s.academic_phase_id
`;

// ─── Controllers ─────────────────────────────────────────────────────────────

const getAll = async (req, res, next) => {
    try {
        const { fase_academica, academic_phase_id, semester_id, approved } = req.query;

        let query = STUDENT_SELECT + ' WHERE 1=1';
        const params = [];

        if (academic_phase_id) {
            params.push(Number(academic_phase_id));
            query += ` AND s.academic_phase_id = $${params.length}`;
        } else if (fase_academica) {
            // Compatibilidad legado: resuelve el nombre a ID via cache
            const phase = getPhaseByName(fase_academica);
            if (phase) {
                params.push(phase.id);
                query += ` AND s.academic_phase_id = $${params.length}`;
            }
        }
        if (semester_id) {
            params.push(semester_id);
            query += ` AND s.semester_id = $${params.length}`;
        }
        if (approved !== undefined) {
            params.push(approved === 'true');
            query += ` AND s.approved = $${params.length}`;
        }
        query += ' ORDER BY s.nombre_completo';

        const { rows } = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        next(err);
    }
};

const getById = async (req, res, next) => {
    try {
        const { rows } = await pool.query(
            STUDENT_SELECT + ' WHERE s.id = $1',
            [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ error: 'Estudiante no encontrado' });
        res.json(rows[0]);
    } catch (err) {
        next(err);
    }
};

const create = async (req, res, next) => {
    try {
        const {
            nombre_completo,
            carnet_id,
            correo_institucional,
            /** @deprecated usar academic_phase_id */
            fase_academica,
            academic_phase_id,
            semester_id,
            approved = false,
        } = req.body;

        const nc  = normalize(nombre_completo);
        const cid = normalize(carnet_id);
        const co  = normalize(correo_institucional);

        if (!nc || !cid || !co || !semester_id) {
            return res.status(400).json({
                error: 'nombre_completo, carnet_id, correo_institucional y semester_id son requeridos',
            });
        }
        if (!fase_academica && academic_phase_id == null) {
            return res.status(400).json({ error: 'Se requiere academic_phase_id o fase_academica' });
        }
        if (nc.length > 150)  return res.status(400).json({ error: 'nombre_completo no puede exceder 150 caracteres' });
        if (cid.length > 50)  return res.status(400).json({ error: 'carnet_id no puede exceder 50 caracteres' });
        if (!EMAIL_REGEX.test(co)) return res.status(400).json({ error: 'Formato de correo institucional inválido' });
        if (co.length > 100)  return res.status(400).json({ error: 'correo_institucional no puede exceder 100 caracteres' });

        let phase;
        try {
            phase = resolvePhase({ academic_phase_id, fase_academica });
        } catch (e) {
            return res.status(400).json({ error: e.message });
        }

        const created_by = req.user.user_id;

        const { rows } = await pool.query(
            `WITH ins AS (
               INSERT INTO students
                 (id, nombre_completo, carnet_id, correo_institucional,
                  fase_academica, semester_id, approved, created_by,
                  academic_phase_id, created_at, updated_at)
               VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
               RETURNING *
             )
             SELECT ins.id, ins.nombre_completo, ins.carnet_id, ins.correo_institucional,
                    ins.fase_academica, ins.semester_id, ins.approved,
                    ins.created_by, ins.created_at, ins.updated_at,
                    ins.academic_phase_id,
                    ap.name AS phase_name, ap.description AS phase_description,
                    sem.nombre AS semestre
             FROM ins
             INNER JOIN academic_phases ap ON ap.id = ins.academic_phase_id
             LEFT  JOIN semesters sem ON sem.id = ins.semester_id`,
            [nc, cid, co, phase.phaseName, semester_id, approved, created_by, phase.phaseId]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('[students.create] DB error:', err.message, '| payload:', {
            nombre_completo: req.body.nombre_completo,
            carnet_id: req.body.carnet_id,
            fase_academica: req.body.fase_academica,
        });
        next(err);
    }
};

const update = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            nombre_completo,
            correo_institucional,
            /** @deprecated usar academic_phase_id */
            fase_academica,
            academic_phase_id,
            semester_id,
            approved,
        } = req.body;

        if (correo_institucional && !EMAIL_REGEX.test(correo_institucional.trim())) {
            return res.status(400).json({ error: 'Formato de correo institucional inválido' });
        }

        let phaseId   = undefined;
        let phaseName = undefined;

        if (academic_phase_id != null || fase_academica) {
            let phase;
            try {
                phase = resolvePhase({ academic_phase_id, fase_academica });
            } catch (e) {
                return res.status(400).json({ error: e.message });
            }
            phaseId   = phase.phaseId;
            phaseName = phase.phaseName;
        }

        const { rows } = await pool.query(
            `WITH upd AS (
               UPDATE students SET
                 nombre_completo      = COALESCE($1, nombre_completo),
                 correo_institucional = COALESCE($2, correo_institucional),
                 fase_academica       = COALESCE($3, fase_academica),
                 semester_id          = COALESCE($4, semester_id),
                 approved             = COALESCE($5, approved),
                 academic_phase_id    = COALESCE($6, academic_phase_id),
                 updated_at           = NOW()
               WHERE id = $7
               RETURNING *
             )
             SELECT upd.id, upd.nombre_completo, upd.carnet_id, upd.correo_institucional,
                    upd.fase_academica, upd.semester_id, upd.approved,
                    upd.created_by, upd.created_at, upd.updated_at,
                    upd.academic_phase_id,
                    ap.name AS phase_name, ap.description AS phase_description,
                    sem.nombre AS semestre
             FROM upd
             INNER JOIN academic_phases ap ON ap.id = upd.academic_phase_id
             LEFT  JOIN semesters sem ON sem.id = upd.semester_id`,
            [
                nombre_completo?.trim()      ?? null,
                correo_institucional?.trim() ?? null,
                phaseName                    ?? null,
                semester_id                  ?? null,
                approved                     ?? null,
                phaseId                      ?? null,
                id,
            ]
        );
        if (!rows.length) return res.status(404).json({ error: 'Estudiante no encontrado' });
        res.json(rows[0]);
    } catch (err) {
        next(err);
    }
};

const remove = async (req, res, next) => {
    try {
        const { rowCount } = await pool.query('DELETE FROM students WHERE id = $1', [req.params.id]);
        if (!rowCount) return res.status(404).json({ error: 'Estudiante no encontrado' });
        res.status(204).send();
    } catch (err) {
        next(err);
    }
};

const bulkCreate = async (req, res, next) => {
    try {
        const { filas } = req.body;
        if (!filas || !Array.isArray(filas)) {
            return res.status(400).json({ error: 'Se requiere un array "filas" en el body' });
        }
        if (filas.length === 0) {
            return res.status(400).json({ error: 'El array "filas" no puede estar vacío' });
        }

        const created_by = req.user.user_id;

        // Usar cache en lugar de consultar la BD por cada fila
        const allPhases  = getAllPhases();
        const phaseByName = new Map(allPhases.map((p) => [p.name, p]));

        const carnetsCargaActual = new Set();
        let importados = 0;
        const errores  = [];

        for (let i = 0; i < filas.length; i++) {
            const fila    = filas[i];
            const numFila = i + 2;

            const {
                nombre_completo,
                carnet_id,
                correo_institucional,
                /** @deprecated usar academic_phase_id */
                fase_academica,
                academic_phase_id,
                semester_id,
                approved = false,
            } = fila;

            const nc  = normalize(nombre_completo);
            const cid = normalize(carnet_id);
            const co  = normalize(correo_institucional);

            // Validaciones
            if (!nc)          { errores.push({ fila: numFila, carnet_id: cid || '', razon: 'nombre_completo es obligatorio' }); continue; }
            if (nc.length > 150) { errores.push({ fila: numFila, carnet_id: cid, razon: 'nombre_completo excede 150 caracteres' }); continue; }
            if (!cid)         { errores.push({ fila: numFila, carnet_id: '', razon: 'carnet_id es obligatorio' }); continue; }
            if (cid.length > 50) { errores.push({ fila: numFila, carnet_id: cid, razon: 'carnet_id excede 50 caracteres' }); continue; }
            if (!co)          { errores.push({ fila: numFila, carnet_id: cid, razon: 'correo_institucional es obligatorio' }); continue; }
            if (co.length > 100) { errores.push({ fila: numFila, carnet_id: cid, razon: 'correo_institucional excede 100 caracteres' }); continue; }
            if (!EMAIL_REGEX.test(co)) { errores.push({ fila: numFila, carnet_id: cid, razon: 'Formato de correo institucional inválido' }); continue; }
            if (!semester_id) { errores.push({ fila: numFila, carnet_id: cid, razon: 'semester_id es obligatorio' }); continue; }

            // Resolución de fase desde cache
            let phaseId   = null;
            let phaseName = null;

            if (academic_phase_id != null) {
                const phase = getPhaseById(academic_phase_id);
                if (!phase) { errores.push({ fila: numFila, carnet_id: cid, razon: `academic_phase_id ${academic_phase_id} no existe` }); continue; }
                phaseId   = phase.id;
                phaseName = phase.name;
            } else if (fase_academica) {
                const phase = phaseByName.get(fase_academica);
                if (!phase) { errores.push({ fila: numFila, carnet_id: cid, razon: `fase_academica inválida: "${fase_academica}"` }); continue; }
                phaseId   = phase.id;
                phaseName = phase.name;
            } else {
                errores.push({ fila: numFila, carnet_id: cid, razon: 'Se requiere academic_phase_id o fase_academica' }); continue;
            }

            // Duplicado en esta carga
            const carnetNorm = cid.toLowerCase();
            if (carnetsCargaActual.has(carnetNorm)) {
                errores.push({ fila: numFila, carnet_id: cid, razon: 'Carnet duplicado en esta carga' }); continue;
            }
            carnetsCargaActual.add(carnetNorm);

            try {
                await pool.query(
                    `INSERT INTO students
                       (id, nombre_completo, carnet_id, correo_institucional,
                        fase_academica, semester_id, approved, created_by,
                        academic_phase_id, created_at, updated_at)
                     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
                    [nc, cid, co, phaseName, semester_id, Boolean(approved), created_by, phaseId]
                );
                importados++;
            } catch (dbErr) {
                const esUnico = dbErr.code === '23505';
                errores.push({
                    fila: numFila,
                    carnet_id: cid,
                    razon: esUnico ? 'El carnet ya existe en la base de datos' : `Error de base de datos: ${dbErr.message}`,
                });
            }
        }

        const rechazados = errores.length;

        try {
            const filename = `importacion_${new Date().toISOString().slice(0, 10)}.xlsx`;
            const status   = rechazados === filas.length ? 'error' : 'success';
            await pool.query(
                `INSERT INTO upload_history (filename, type, status, imported, rejected, created_by)
                 VALUES ($1, 'excel', $2, $3, $4, $5)`,
                [filename, status, importados, rechazados, created_by]
            );
        } catch { /* no bloquear respuesta si falla el historial */ }

        res.json({ importados, rechazados, total: filas.length, errores });
    } catch (err) {
        next(err);
    }
};

const downloadTemplate = async (_req, res, next) => {
    try {
        // Usar cache en lugar de consultar la BD
        const phases = getAllPhases();
        const phaseFormulae = phases.map((p) => p.name).join(',');

        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('Estudiantes', { views: [{ state: 'frozen', ySplit: 1 }] });

        ws.columns = [
            { header: 'nombreCompleto *',      key: 'nombreCompleto',      width: 35 },
            { header: 'carnetId *',            key: 'carnetId',            width: 18 },
            { header: 'correoInstitucional *', key: 'correoInstitucional', width: 32 },
            { header: 'faseAcademica *',       key: 'faseAcademica',       width: 22 },
            { header: 'aprobado',              key: 'aprobado',            width: 12 },
        ];

        ws.getRow(1).eachCell((cell) => {
            cell.font      = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });
        ws.getRow(1).height = 24;

        if (phases.length >= 3) {
            ws.addRow(['María Alejandra López Sánchez', '2021-00123', 'malopez@miumg.edu.gt', phases[0].name, 'false']);
            ws.addRow(['Juan Carlos Pérez García',      '2019-00456', 'jcperez@miumg.edu.gt',  phases[1].name, 'false']);
            ws.addRow(['Ana Beatriz Morales Cifuentes', '2020-00789', 'abmorales@miumg.edu.gt', phases[2].name, 'true']);
        }

        ws.dataValidations.add('D2:D1048576', {
            type: 'list',
            allowBlank: false,
            formulae: [`"${phaseFormulae}"`],
            showErrorMessage: true,
            errorTitle: 'Fase inválida',
            error: `Debe ser: ${phaseFormulae}`,
        });

        const buffer = await wb.xlsx.writeBuffer();
        res.setHeader('Content-Disposition', 'attachment; filename="plantilla_estudiantes.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (err) {
        next(err);
    }
};

module.exports = { getAll, getById, create, bulkCreate, update, remove, downloadTemplate };
