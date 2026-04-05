const pool = require('../db/pool');
const ExcelJS = require('exceljs');
const { EMAIL_REGEX } = require('../constants');
const { getPhaseById, getPhaseByName, getAllPhases } = require('../utils/phaseCache');

// ─── Helpers ─────────────────────────────────────────────────────────────────

const normalize = (str) => str?.trim().replace(/\s+/g, ' ').replace(/\*/g, '').trim() ?? '';

/**
 * Convierte el campo "approved" al booleano correspondiente.
 * Acepta: "aprobado" | "desaprobado" | "true" | "false" | boolean.
 */
function parseApproved(val) {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') {
        const v = val.trim().toLowerCase();
        if (v === 'aprobado' || v === 'true') return true;
    }
    return false;
}

/**
 * Convierte errores de PostgreSQL y de validación propia en mensajes comprensibles
 * para el usuario final (no técnico).
 */
function friendlyError(err) {
    // Errores de BD (pg)
    if (err.code) {
        if (err.code === '23505') {
            if (err.constraint?.includes('carnet')) return 'El carnet ya está registrado en la base de datos';
            if (err.constraint?.includes('correo')) return 'El correo institucional ya está en uso';
            return 'Registro duplicado';
        }
        if (err.code === '23514') {
            if (err.constraint?.includes('correo_institucional'))
                return 'Correo inválido: debe terminar en @miumg.edu.gt o @umg.edu.gt';
            return `Valor fuera de rango permitido (${err.constraint})`;
        }
        if (err.code === '23502') return 'Campo obligatorio vacío';
        if (err.code === '23503') return 'Referencia inválida (fase o semestre no existe)';
        return `Error de base de datos: ${err.message}`;
    }
    return err.message ?? 'Error desconocido';
}

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

        // Semestre por defecto: el más reciente del sistema
        const { rows: semRows } = await pool.query(
            'SELECT id, nombre FROM semesters ORDER BY anio DESC, numero DESC LIMIT 1'
        );
        if (!semRows.length) {
            return res.status(400).json({
                error: 'No existe ningún semestre en el sistema. Crea al menos un semestre antes de importar estudiantes.',
            });
        }
        const defaultSemesterId = semRows[0].id;

        const allPhases   = getAllPhases();
        const phaseByName = new Map(allPhases.map((p) => [p.name.toLowerCase(), p]));

        const carnetsCargaActual = new Set();
        let importados = 0;
        const errores  = [];

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            for (let i = 0; i < filas.length; i++) {
                const fila    = filas[i];
                const numFila = i + 2;

                // Acepta formato nuevo (full_name / phase) y legado (nombre_completo / fase_academica)
                const {
                    full_name,
                    nombre_completo,
                    carnet_id,
                    phase,
                    fase_academica,
                    academic_phase_id,
                    email,
                    correo_institucional,
                    semester_id,
                    approved: rawApproved = false,
                } = fila;

                const nc  = normalize(full_name ?? nombre_completo);
                const cid = normalize(carnet_id);
                const co  = normalize(email ?? correo_institucional);

                // Ignorar filas completamente vacías
                if (!nc && !cid) continue;

                // Validaciones
                if (!nc)  { errores.push({ fila: numFila, carnet_id: cid || '', razon: 'Nombre completo es obligatorio' }); continue; }
                if (nc.length > 150) { errores.push({ fila: numFila, carnet_id: cid, razon: 'Nombre completo excede 150 caracteres' }); continue; }
                if (!cid) { errores.push({ fila: numFila, carnet_id: '', razon: 'Carnet ID es obligatorio' }); continue; }
                if (cid.length > 50) { errores.push({ fila: numFila, carnet_id: cid, razon: 'Carnet ID excede 50 caracteres' }); continue; }
                if (co && !EMAIL_REGEX.test(co)) { errores.push({ fila: numFila, carnet_id: cid, razon: 'Formato de correo inválido' }); continue; }

                // Resolución de fase desde cache
                let phaseId   = null;
                let phaseName = null;

                if (academic_phase_id != null) {
                    const p = getPhaseById(academic_phase_id);
                    if (!p) { errores.push({ fila: numFila, carnet_id: cid, razon: `academic_phase_id ${academic_phase_id} no existe` }); continue; }
                    phaseId = p.id; phaseName = p.name;
                } else {
                    const phaseKey = normalize(phase ?? fase_academica).toLowerCase();
                    if (!phaseKey) { errores.push({ fila: numFila, carnet_id: cid, razon: 'Fase académica es obligatoria' }); continue; }
                    const p = phaseByName.get(phaseKey);
                    if (!p) { errores.push({ fila: numFila, carnet_id: cid, razon: `Fase académica inválida: "${phaseKey}"` }); continue; }
                    phaseId = p.id; phaseName = p.name;
                }

                // Duplicado en esta carga
                const carnetNorm = cid.toLowerCase();
                if (carnetsCargaActual.has(carnetNorm)) {
                    errores.push({ fila: numFila, carnet_id: cid, razon: 'Carnet duplicado en esta carga' }); continue;
                }
                carnetsCargaActual.add(carnetNorm);

                const approvedBool = parseApproved(rawApproved);
                const sp = `sp_${i}`;
                await client.query(`SAVEPOINT ${sp}`);
                try {
                    await client.query(
                        `INSERT INTO students
                           (id, nombre_completo, carnet_id, correo_institucional,
                            fase_academica, semester_id, approved, created_by,
                            academic_phase_id, created_at, updated_at)
                         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
                        [nc, cid, co || null, phaseName, semester_id ?? defaultSemesterId, approvedBool, created_by, phaseId]
                    );
                    await client.query(`RELEASE SAVEPOINT ${sp}`);
                    importados++;
                } catch (dbErr) {
                    await client.query(`ROLLBACK TO SAVEPOINT ${sp}`);
                    await client.query(`RELEASE SAVEPOINT ${sp}`);
                    errores.push({ fila: numFila, carnet_id: cid, razon: friendlyError(dbErr) });
                }
            }

            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }

        const rechazados = errores.length;

        try {
            const filename   = `importacion_${new Date().toISOString().slice(0, 10)}.xlsx`;
            const status     = importados === 0 ? 'error' : 'success';
            const rechazados = errores.length;
            await pool.query(
                `INSERT INTO upload_history
                   (filename, type, status, imported, rejected, total_rows, errors, created_by)
                 VALUES ($1, 'excel', $2, $3, $4, $5, $6::jsonb, $7)`,
                [filename, status, importados, rechazados, filas.length, JSON.stringify(errores), created_by]
            );
        } catch { /* no bloquear respuesta si falla el historial */ }

        res.json({ importados, rechazados, total: filas.length, errores });
    } catch (err) {
        next(err);
    }
};

const downloadTemplate = async (_req, res, next) => {
    try {
        const phases = getAllPhases();
        const phaseFormulae = phases.map((p) => p.name).join(',');

        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('Students', { views: [{ state: 'frozen', ySplit: 1 }] });

        ws.columns = [
            { header: 'Full Name *',       key: 'fullName',       width: 35 },
            { header: 'Carnet ID *',       key: 'carnetId',       width: 18 },
            { header: 'Email (optional)',  key: 'email',          width: 30 },
            { header: 'Academic Phase *',  key: 'academicPhase',  width: 22 },
            { header: 'Status *',          key: 'status',         width: 14 },
        ];

        ws.getRow(1).eachCell((cell) => {
            cell.font      = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });
        ws.getRow(1).height = 24;

        if (phases.length >= 3) {
            ws.addRow(['María Alejandra López Sánchez', '2021-00123', 'maria.lopez@miumg.edu.gt', phases[0].name, 'desaprobado']);
            ws.addRow(['Juan Carlos Pérez García',      '2019-00456', '',                         phases[1].name, 'desaprobado']);
            ws.addRow(['Ana Beatriz Morales Cifuentes', '2020-00789', 'ana.morales@umg.edu.gt',   phases[2].name, 'aprobado']);
        } else if (phases.length > 0) {
            ws.addRow(['María Alejandra López Sánchez', '2021-00123', '', phases[0].name, 'desaprobado']);
        }

        ws.dataValidations.add('D2:D1048576', {
            type: 'list',
            allowBlank: false,
            formulae: [`"${phaseFormulae}"`],
            showErrorMessage: true,
            errorTitle: 'Fase inválida',
            error: `Debe ser: ${phaseFormulae}`,
        });

        ws.dataValidations.add('E2:E1048576', {
            type: 'list',
            allowBlank: false,
            formulae: ['"aprobado,desaprobado"'],
            showErrorMessage: true,
            errorTitle: 'Valor inválido',
            error: 'Solo se acepta "aprobado" o "desaprobado"',
        });

        // ── Hoja 2: Valid Phases ──────────────────────────────────────
        const wsPhases = wb.addWorksheet('Valid Phases');
        wsPhases.columns = [
            { header: 'Value (Academic Phase)', key: 'value', width: 25 },
            { header: 'Full Name',              key: 'name',  width: 40 },
        ];
        wsPhases.getRow(1).eachCell((c) => {
            c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
        });
        phases.forEach((p) => wsPhases.addRow([p.name, p.description || p.name]));

        const buffer = await wb.xlsx.writeBuffer();
        res.setHeader('Content-Disposition', 'attachment; filename="plantilla_estudiantes.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (err) {
        next(err);
    }
};

module.exports = { getAll, getById, create, bulkCreate, update, remove, downloadTemplate };
