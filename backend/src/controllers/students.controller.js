const pool = require('../db/pool');
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

    if (!nombre_completo?.trim() || !carnet_id?.trim() || !correo_institucional?.trim() || !fase_academica || !semester_id) {
      return res.status(400).json({ error: 'nombre_completo, carnet_id, correo_institucional, fase_academica y semester_id son requeridos' });
    }
    if (!EMAIL_REGEX.test(correo_institucional.trim())) {
      return res.status(400).json({ error: 'Formato de correo institucional inválido' });
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
      [nombre_completo.trim(), carnet_id.trim(), correo_institucional.trim(), fase_academica, semester_id, approved, created_by]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
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

      // ── Validaciones de la fila ──────────────────────────────────────
      if (!nombre_completo?.trim()) {
        errores.push({ fila: numFila, carnet_id: carnet_id ?? '', razon: 'nombre_completo es obligatorio' });
        continue;
      }
      if (!carnet_id?.trim()) {
        errores.push({ fila: numFila, carnet_id: '', razon: 'carnet_id es obligatorio' });
        continue;
      }
      if (!correo_institucional?.trim()) {
        errores.push({ fila: numFila, carnet_id: carnet_id.trim(), razon: 'correo_institucional es obligatorio' });
        continue;
      }
      if (!EMAIL_REGEX.test(correo_institucional.trim())) {
        errores.push({ fila: numFila, carnet_id: carnet_id.trim(), razon: 'Formato de correo institucional inválido' });
        continue;
      }
      if (!fase_academica || !FASES_VALIDAS.includes(fase_academica)) {
        errores.push({ fila: numFila, carnet_id: carnet_id.trim(), razon: `fase_academica debe ser: ${FASES_VALIDAS.join(', ')}` });
        continue;
      }
      if (!semester_id) {
        errores.push({ fila: numFila, carnet_id: carnet_id.trim(), razon: 'semester_id es obligatorio' });
        continue;
      }

      // Duplicado dentro de la misma carga
      const carnetNorm = carnet_id.trim().toLowerCase();
      if (carnetsCargaActual.has(carnetNorm)) {
        errores.push({ fila: numFila, carnet_id: carnet_id.trim(), razon: 'Carnet duplicado en esta carga' });
        continue;
      }
      carnetsCargaActual.add(carnetNorm);

      // ── Inserción en BD ──────────────────────────────────────────────
      try {
        await pool.query(
          `INSERT INTO students
             (id, nombre_completo, carnet_id, correo_institucional, fase_academica, semester_id, approved, created_by, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
          [
            nombre_completo.trim(),
            carnet_id.trim(),
            correo_institucional.trim(),
            fase_academica,
            semester_id,
            Boolean(approved),
            created_by,
          ]
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

module.exports = { getAll, getById, create, bulkCreate, update, remove };
