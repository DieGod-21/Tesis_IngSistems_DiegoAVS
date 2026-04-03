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

module.exports = { getAll, getById, create, update, remove };
