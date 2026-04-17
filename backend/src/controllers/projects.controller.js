const pool = require('../db/pool');
const { ESTADOS } = require('../constants');
const { validatePhaseName } = require('../utils/phases');
const { parsePagination, paginatedResponse } = require('../lib/pagination');

const ESTADOS_VALIDOS = ESTADOS.proyecto;

const PROJECT_RETURNING = `id, titulo, descripcion, fase_academica, estado,
                            semester_id, es_grupal, created_by, created_at, updated_at`;

const getAll = async (req, res, next) => {
  try {
    const { estado, fase_academica, semester_id } = req.query;
    const { page, limit, offset } = parsePagination(req.query);

    if (estado && !ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({ error: `estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}` });
    }
    if (fase_academica) {
      const err = await validatePhaseName(fase_academica);
      if (err) return res.status(400).json({ error: err });
    }

    let where = '';
    const params = [];
    if (estado)         { params.push(estado);         where += ` AND p.estado = $${params.length}`; }
    if (fase_academica) { params.push(fase_academica); where += ` AND p.fase_academica = $${params.length}`; }
    if (semester_id)    { params.push(semester_id);    where += ` AND p.semester_id = $${params.length}`; }

    params.push(limit, offset);
    const query = `
      SELECT count(*) OVER() AS total_count,
             p.id, p.titulo, p.descripcion, p.fase_academica, p.estado,
             p.semester_id, p.es_grupal, p.created_at, sem.nombre AS semestre,
             array_agg(DISTINCT s.nombre_completo) FILTER (WHERE s.id IS NOT NULL) AS estudiantes,
             array_agg(DISTINCT u.nombre_completo) FILTER (WHERE u.id IS NOT NULL) AS asesores
      FROM projects p
      LEFT JOIN semesters sem       ON sem.id = p.semester_id
      LEFT JOIN project_students ps ON ps.project_id = p.id
      LEFT JOIN students s          ON s.id = ps.student_id
      LEFT JOIN project_advisors pa ON pa.project_id = p.id AND pa.activo = TRUE
      LEFT JOIN users u             ON u.id = pa.advisor_id
      WHERE 1=1 ${where}
      GROUP BY p.id, sem.nombre
      ORDER BY p.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

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
      `SELECT p.id, p.titulo, p.descripcion, p.fase_academica, p.estado,
              p.semester_id, p.es_grupal, p.created_at, sem.nombre AS semestre,
              array_agg(DISTINCT jsonb_build_object('id', s.id, 'nombre', s.nombre_completo, 'carnet', s.carnet_id, 'rol', ps.rol_en_proyecto))
                FILTER (WHERE s.id IS NOT NULL) AS estudiantes,
              array_agg(DISTINCT jsonb_build_object('id', u.id, 'nombre', u.nombre_completo, 'rol', pa.rol_asesor))
                FILTER (WHERE u.id IS NOT NULL AND pa.activo = TRUE) AS asesores
       FROM projects p
       LEFT JOIN semesters sem       ON sem.id = p.semester_id
       LEFT JOIN project_students ps ON ps.project_id = p.id
       LEFT JOIN students s          ON s.id = ps.student_id
       LEFT JOIN project_advisors pa ON pa.project_id = p.id
       LEFT JOIN users u             ON u.id = pa.advisor_id
       WHERE p.id = $1
       GROUP BY p.id, sem.nombre`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Proyecto no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

const getByStudent = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.id, p.titulo, p.descripcion, p.fase_academica, p.estado,
              p.semester_id, p.es_grupal, p.created_at, sem.nombre AS semestre,
              ps.rol_en_proyecto
       FROM projects p
       JOIN project_students ps    ON ps.project_id = p.id
       LEFT JOIN semesters sem     ON sem.id = p.semester_id
       WHERE ps.student_id = $1
       ORDER BY p.created_at DESC`,
      [req.params.student_id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const {
      titulo,
      descripcion,
      fase_academica,
      estado = 'activo',
      semester_id,
      es_grupal = false,
    } = req.body;

    if (!titulo?.trim() || !fase_academica || !semester_id) {
      return res.status(400).json({ error: 'titulo, fase_academica y semester_id son requeridos' });
    }
    const phaseErr = await validatePhaseName(fase_academica);
    if (phaseErr) return res.status(400).json({ error: phaseErr });
    if (!ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({ error: `estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}` });
    }

    const created_by = req.user.user_id;

    const { rows } = await pool.query(
      `INSERT INTO projects
         (id, titulo, descripcion, fase_academica, estado, semester_id, es_grupal, created_by, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING ${PROJECT_RETURNING}`,
      [titulo.trim(), descripcion?.trim(), fase_academica, estado, semester_id, es_grupal, created_by]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, fase_academica, estado, semester_id, es_grupal } = req.body;

    if (fase_academica) {
      const err = await validatePhaseName(fase_academica);
      if (err) return res.status(400).json({ error: err });
    }
    if (estado && !ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({ error: `estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}` });
    }

    const { rows } = await pool.query(
      `UPDATE projects SET
         titulo         = COALESCE($1, titulo),
         descripcion    = COALESCE($2, descripcion),
         fase_academica = COALESCE($3, fase_academica),
         estado         = COALESCE($4, estado),
         semester_id    = COALESCE($5, semester_id),
         es_grupal      = COALESCE($6, es_grupal),
         updated_at     = NOW()
       WHERE id = $7
       RETURNING ${PROJECT_RETURNING}`,
      [titulo?.trim(), descripcion?.trim(), fase_academica, estado, semester_id, es_grupal, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Proyecto no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getById, getByStudent, create, update };