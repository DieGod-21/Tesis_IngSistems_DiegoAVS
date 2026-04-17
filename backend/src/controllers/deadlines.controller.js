const pool = require('../db/pool');
const { validatePhaseName } = require('../utils/phases');
const { parsePagination, paginatedResponse } = require('../lib/pagination');

const DEADLINE_COLS = `id, titulo, descripcion, fecha, semester_id,
                       fase_academica, created_by, created_at, updated_at`;

const getAll = async (req, res, next) => {
  try {
    const { semester_id, fase_academica } = req.query;
    const { page, limit, offset } = parsePagination(req.query);

    if (fase_academica) {
      const err = await validatePhaseName(fase_academica);
      if (err) return res.status(400).json({ error: err });
    }

    let where = '';
    const params = [];
    if (semester_id)    { params.push(semester_id);    where += ` AND semester_id = $${params.length}`; }
    if (fase_academica) { params.push(fase_academica); where += ` AND fase_academica = $${params.length}`; }

    params.push(limit, offset);
    const query = `SELECT count(*) OVER() AS total_count, ${DEADLINE_COLS}
                   FROM academic_deadlines WHERE 1=1 ${where}
                   ORDER BY fecha ASC
                   LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const { rows } = await pool.query(query, params);
    const total = rows.length > 0 ? Number(rows[0].total_count) : 0;
    const data = rows.map(({ total_count, ...rest }) => rest);
    res.json(paginatedResponse(data, total, { page, limit }));
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
    if (fase_academica) {
      const err = await validatePhaseName(fase_academica);
      if (err) return res.status(400).json({ error: err });
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

    if (fase_academica) {
      const err = await validatePhaseName(fase_academica);
      if (err) return res.status(400).json({ error: err });
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
