const pool = require('../db/pool');
const ExcelJS = require('exceljs');
const { EMAIL_REGEX, FASES_VALIDAS } = require('../constants');

const STUDENT_COLS = `s.id, s.nombre_completo, s.carnet_id, s.correo_institucional,
                      s.fase_academica, s.semester_id, s.approved,
                      s.created_by, s.created_at, s.updated_at`;

// Mismas columnas sin prefijo de tabla — para RETURNING en INSERT/UPDATE
const STUDENT_RETURNING = `id, nombre_completo, carnet_id, correo_institucional,
                            fase_academica, semester_id, approved,
                            created_by, created_at, updated_at`;

const getAll = async (req, res, next) => {
  try {
    const { fase_academica, semester_id, approved } = req.query;

    if (fase_academica && !FASES_VALIDAS.includes(fase_academica)) {
      return res.status(400).json({ error: `fase_academica debe ser uno de: ${FASES_VALIDAS.join(', ')}` });
    }

    let query = `
      SELECT ${STUDENT_COLS}, sem.nombre AS semestre
      FROM students s
      LEFT JOIN semesters sem ON sem.id = s.semester_id
      WHERE 1=1
    `;
    const params = [];
    if (fase_academica) { params.push(fase_academica); query += ` AND s.fase_academica = $${params.length}`; }
    if (semester_id)    { params.push(semester_id);    query += ` AND s.semester_id = $${params.length}`; }
    if (approved !== undefined) { params.push(approved === 'true'); query += ` AND s.approved = $${params.length}`; }
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
      `SELECT ${STUDENT_COLS}, sem.nombre AS semestre
       FROM students s
       LEFT JOIN semesters sem ON sem.id = s.semester_id
       WHERE s.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Estudiante no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

const normalize = (str) => str?.trim().replace(/\s+/g, ' ') ?? '';

const create = async (req, res, next) => {
  try {
    const {
      nombre_completo,
      carnet_id,
      correo_institucional,
      fase_academica,
      semester_id,
      approved = false,
    } = req.body;

    const nc  = normalize(nombre_completo);
    const cid = normalize(carnet_id);
    const co  = normalize(correo_institucional);

    if (!nc || !cid || !co || !fase_academica || !semester_id) {
      return res.status(400).json({ error: 'nombre_completo, carnet_id, correo_institucional, fase_academica y semester_id son requeridos' });
    }
    if (nc.length > 150) {
      return res.status(400).json({ error: 'nombre_completo no puede exceder 150 caracteres' });
    }
    if (cid.length > 50) {
      return res.status(400).json({ error: 'carnet_id no puede exceder 50 caracteres' });
    }
    if (!EMAIL_REGEX.test(co)) {
      return res.status(400).json({ error: 'Formato de correo institucional inválido' });
    }
    if (co.length > 100) {
      return res.status(400).json({ error: 'correo_institucional no puede exceder 100 caracteres' });
    }
    if (!FASES_VALIDAS.includes(fase_academica)) {
      return res.status(400).json({ error: `fase_academica debe ser uno de: ${FASES_VALIDAS.join(', ')}` });
    }

    const created_by = req.user.user_id;

    const { rows } = await pool.query(
      `INSERT INTO students
         (id, nombre_completo, carnet_id, correo_institucional, fase_academica, semester_id, approved, created_by, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING ${STUDENT_RETURNING}`,
      [nc, cid, co, fase_academica, semester_id, approved, created_by]
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
    const { nombre_completo, correo_institucional, fase_academica, semester_id, approved } = req.body;

    if (correo_institucional && !EMAIL_REGEX.test(correo_institucional.trim())) {
      return res.status(400).json({ error: 'Formato de correo institucional inválido' });
    }
    if (fase_academica && !FASES_VALIDAS.includes(fase_academica)) {
      return res.status(400).json({ error: `fase_academica debe ser uno de: ${FASES_VALIDAS.join(', ')}` });
    }

    const { rows } = await pool.query(
      `UPDATE students SET
         nombre_completo      = COALESCE($1, nombre_completo),
         correo_institucional = COALESCE($2, correo_institucional),
         fase_academica       = COALESCE($3, fase_academica),
         semester_id          = COALESCE($4, semester_id),
         approved             = COALESCE($5, approved),
         updated_at           = NOW()
       WHERE id = $6
       RETURNING ${STUDENT_RETURNING}`,
      [nombre_completo?.trim(), correo_institucional?.trim(), fase_academica, semester_id, approved, id]
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

/**
 * bulkCreate — POST /api/students/bulk
 *
 * Recibe un array de filas y las inserta una por una.
 * Valida cada fila antes de insertarla.
 * Retorna un resumen: { importados, rechazados, errores[] }
 * donde cada error indica { fila, carnet_id, razon }.
 *
 * No hace rollback global: las filas válidas se insertan
 * aunque haya filas inválidas (comportamiento esperado para carga masiva).
 */
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

    // Rastrear carnets ya vistos en esta misma carga para detectar duplicados internos
    const carnetsCargaActual = new Set();

    let importados = 0;
    const errores = [];

    for (let i = 0; i < filas.length; i++) {
      const fila = filas[i];
      const numFila = i + 2; // fila 1 = encabezado en Excel

      const {
        nombre_completo,
        carnet_id,
        correo_institucional,
        fase_academica,
        semester_id,
        approved = false,
      } = fila;

      // ── Normalizar inputs ────────────────────────────────────────────
      const nc  = normalize(nombre_completo);
      const cid = normalize(carnet_id);
      const co  = normalize(correo_institucional);

      // ── Validaciones de la fila ──────────────────────────────────────
      if (!nc) {
        errores.push({ fila: numFila, carnet_id: cid || '', razon: 'nombre_completo es obligatorio' });
        continue;
      }
      if (nc.length > 150) {
        errores.push({ fila: numFila, carnet_id: cid, razon: 'nombre_completo excede 150 caracteres' });
        continue;
      }
      if (!cid) {
        errores.push({ fila: numFila, carnet_id: '', razon: 'carnet_id es obligatorio' });
        continue;
      }
      if (cid.length > 50) {
        errores.push({ fila: numFila, carnet_id: cid, razon: 'carnet_id excede 50 caracteres' });
        continue;
      }
      if (!co) {
        errores.push({ fila: numFila, carnet_id: cid, razon: 'correo_institucional es obligatorio' });
        continue;
      }
      if (co.length > 100) {
        errores.push({ fila: numFila, carnet_id: cid, razon: 'correo_institucional excede 100 caracteres' });
        continue;
      }
      if (!EMAIL_REGEX.test(co)) {
        errores.push({ fila: numFila, carnet_id: cid, razon: 'Formato de correo institucional inválido' });
        continue;
      }
      if (!fase_academica || !FASES_VALIDAS.includes(fase_academica)) {
        errores.push({ fila: numFila, carnet_id: cid, razon: `fase_academica debe ser: ${FASES_VALIDAS.join(', ')}` });
        continue;
      }
      if (!semester_id) {
        errores.push({ fila: numFila, carnet_id: cid, razon: 'semester_id es obligatorio' });
        continue;
      }

      // Duplicado dentro de la misma carga
      const carnetNorm = cid.toLowerCase();
      if (carnetsCargaActual.has(carnetNorm)) {
        errores.push({ fila: numFila, carnet_id: cid, razon: 'Carnet duplicado en esta carga' });
        continue;
      }
      carnetsCargaActual.add(carnetNorm);

      // ── Inserción en BD ──────────────────────────────────────────────
      try {
        await pool.query(
          `INSERT INTO students
             (id, nombre_completo, carnet_id, correo_institucional, fase_academica, semester_id, approved, created_by, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
          [nc, cid, co, fase_academica, semester_id, Boolean(approved), created_by]
        );
        importados++;
      } catch (dbErr) {
        // Constraint de unicidad u otro error de BD
        const esUnico = dbErr.code === '23505'; // unique_violation en PostgreSQL
        errores.push({
          fila: numFila,
          carnet_id: carnet_id.trim(),
          razon: esUnico ? 'El carnet ya existe en la base de datos' : `Error de base de datos: ${dbErr.message}`,
        });
      }
    }

    const rechazados = errores.length;

    // Guardar registro en historial de cargas (error no bloquea la respuesta)
    try {
      const filename = `importacion_${new Date().toISOString().slice(0, 10)}.xlsx`;
      const status   = rechazados === filas.length ? 'error' : 'success';
      await pool.query(
        `INSERT INTO upload_history (filename, type, status, imported, rejected, created_by)
         VALUES ($1, 'excel', $2, $3, $4, $5)`,
        [filename, status, importados, rechazados, created_by]
      );
    } catch { /* no bloquear respuesta si falla el historial */ }

    res.json({
      importados,
      rechazados,
      total: filas.length,
      errores,
    });
  } catch (err) {
    next(err);
  }
};

const downloadTemplate = async (_req, res, next) => {
  try {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Estudiantes', { views: [{ state: 'frozen', ySplit: 1 }] });

    ws.columns = [
      { header: 'nombreCompleto *',      key: 'nombreCompleto',      width: 35 },
      { header: 'carnetId *',            key: 'carnetId',            width: 18 },
      { header: 'correoInstitucional *', key: 'correoInstitucional', width: 32 },
      { header: 'faseAcademica *',       key: 'faseAcademica',       width: 22 },
      { header: 'aprobado',              key: 'aprobado',            width: 12 },
    ];

    // Estilo de encabezado
    ws.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    ws.getRow(1).height = 24;

    // Filas de ejemplo
    [
      ['María Alejandra López Sánchez', '2021-00123', 'malopez@miumg.edu.gt', 'anteproyecto', 'false'],
      ['Juan Carlos Pérez García',      '2019-00456', 'jcperez@miumg.edu.gt', 'tesis',        'false'],
      ['Ana Beatriz Morales Cifuentes', '2020-00789', 'abmorales@miumg.edu.gt','eps',          'true'],
    ].forEach((row) => ws.addRow(row));

    // Validación de lista en columna faseAcademica
    ws.dataValidations.add('D2:D1048576', {
      type: 'list',
      allowBlank: false,
      formulae: ['"anteproyecto,tesis,eps"'],
      showErrorMessage: true,
      errorTitle: 'Fase inválida',
      error: 'Debe ser: anteproyecto, tesis o eps',
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
