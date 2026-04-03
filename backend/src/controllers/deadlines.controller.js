const pool = require('../db/pool');
const { FASES_VALIDAS } = require('../constants');

const DEADLINE_COLS = `id, titulo, descripcion, fecha, semester_id,
                       fase_academica, created_by, created_at, updated_at`;

const getAll = async (req, res, next) => {
  try {
    const { semester_id, fase_academica } = req.query;

    if (fase_academica && !FASES_VALIDAS.includes(fase_academica)) {
      return res.status(400).json({ error: `fase_academica debe ser uno de: ${FASES_VALIDAS.join(', ')}` });
    }

    let query = `SELECT ${DEADLINE_COLS} FROM academic_deadlines WHERE 1=1`;
    const params = [];
    if (semester_id)    { params.push(semester_id);    query += ` AND semester_id = $${params.length}`; }
    if (fase_academica) { params.push(fase_academica); query += ` AND fase_academica = $${params.length}`; }
    query += ' ORDER BY fecha ASC';

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${DEADLINE_COLS} FROM academic_deadlines WHERE id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Fecha límite no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { titulo, descripcion, fecha, semester_id, fase_academica } = req.body;

    if (!titulo?.trim() || !fecha || !semester_id) {
      return res.status(400).json({ error: 'titulo, fecha y semester_id son requeridos' });
    }
    if (fase_academica && !FASES_VALIDAS.includes(fase_academica)) {
      return res.status(400).json({ error: `fase_academica debe ser uno de: ${FASES_VALIDAS.join(', ')}` });
    }

    const created_by = req.user.user_id;

    const { rows } = await pool.query(
      `INSERT INTO academic_deadlines
         (id, titulo, descripcion, fecha, semester_id, fase_academica, created_by, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING ${DEADLINE_COLS}`,
      [titulo.trim(), descripcion?.trim(), fecha, semester_id, fase_academica, created_by]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { titulo, descripcion, fecha, fase_academica } = req.body;

    if (fase_academica && !FASES_VALIDAS.includes(fase_academica)) {
      return res.status(400).json({ error: `fase_academica debe ser uno de: ${FASES_VALIDAS.join(', ')}` });
    }

    const { rows } = await pool.query(
      `UPDATE academic_deadlines SET
         titulo         = COALESCE($1, titulo),
         descripcion    = COALESCE($2, descripcion),
         fecha          = COALESCE($3, fecha),
         fase_academica = COALESCE($4, fase_academica),
         updated_at     = NOW()
       WHERE id = $5
       RETURNING ${DEADLINE_COLS}`,
      [titulo?.trim(), descripcion?.trim(), fecha, fase_academica, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Fecha límite no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM academic_deadlines WHERE id = $1',
      [req.params.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Fecha límite no encontrada' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getById, create, update, remove };
