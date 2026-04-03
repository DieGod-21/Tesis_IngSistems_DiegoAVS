const pool = require('../db/pool');
const { ESTADOS, TIPOS } = require('../constants');

const TIPOS_VALIDOS   = TIPOS.evaluacion;
const ESTADOS_VALIDOS = ESTADOS.evaluacion;

const EVALUATION_RETURNING = `id, project_id, rubric_id, evaluado_por, tipo, estado,
                               nota_final, retroalimentacion, fecha, created_at, updated_at`;

const getByProject = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT e.id, e.project_id, e.rubric_id, e.tipo, e.estado,
              e.nota_final, e.retroalimentacion, e.fecha, e.created_at,
              u.nombre_completo AS evaluador_nombre, r.nombre AS rubrica_nombre
       FROM evaluations e
       JOIN users u              ON u.id = e.evaluado_por
       JOIN evaluation_rubrics r ON r.id = e.rubric_id
       WHERE e.project_id = $1
       ORDER BY e.fecha DESC`,
      [req.params.project_id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const [{ rows: evalRows }, { rows: scoreRows }] = await Promise.all([
      pool.query(
        `SELECT e.id, e.project_id, e.rubric_id, e.tipo, e.estado,
                e.nota_final, e.retroalimentacion, e.fecha, e.created_at,
                u.nombre_completo AS evaluador_nombre, r.nombre AS rubrica_nombre
         FROM evaluations e
         JOIN users u              ON u.id = e.evaluado_por
         JOIN evaluation_rubrics r ON r.id = e.rubric_id
         WHERE e.id = $1`,
        [req.params.id]
      ),
      pool.query(
        `SELECT es.id, es.evaluation_id, es.puntaje, rc.nombre AS criterio, rc.peso
         FROM evaluation_scores es
         JOIN rubric_criteria rc ON rc.id = es.criterion_id
         WHERE es.evaluation_id = $1`,
        [req.params.id]
      ),
    ]);
    if (!evalRows.length) return res.status(404).json({ error: 'Evaluación no encontrada' });
    res.json({ ...evalRows[0], scores: scoreRows });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { project_id, rubric_id, tipo, estado = 'borrador', nota_final, retroalimentacion, fecha } = req.body;

    if (!project_id || !rubric_id || !tipo) {
      return res.status(400).json({ error: 'project_id, rubric_id y tipo son requeridos' });
    }
    if (!TIPOS_VALIDOS.includes(tipo)) {
      return res.status(400).json({ error: `tipo debe ser uno de: ${TIPOS_VALIDOS.join(', ')}` });
    }
    if (!ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({ error: `estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}` });
    }
    if (nota_final != null && (isNaN(Number(nota_final)) || Number(nota_final) < 0 || Number(nota_final) > 100)) {
      return res.status(400).json({ error: 'nota_final debe ser un número entre 0 y 100' });
    }

    // evaluado_por viene del token — quien crea la evaluación es el evaluador
    const evaluado_por = req.user.user_id;

    const { rows } = await pool.query(
      `INSERT INTO evaluations
         (id, project_id, rubric_id, evaluado_por, tipo, estado, nota_final, retroalimentacion, fecha, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING ${EVALUATION_RETURNING}`,
      [project_id, rubric_id, evaluado_por, tipo, estado, nota_final, retroalimentacion?.trim(), fecha]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { estado, nota_final, retroalimentacion, fecha } = req.body;

    if (estado && !ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({ error: `estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}` });
    }
    if (nota_final != null && (isNaN(Number(nota_final)) || Number(nota_final) < 0 || Number(nota_final) > 100)) {
      return res.status(400).json({ error: 'nota_final debe ser un número entre 0 y 100' });
    }

    const { rows } = await pool.query(
      `UPDATE evaluations SET
         estado            = COALESCE($1, estado),
         nota_final        = COALESCE($2, nota_final),
         retroalimentacion = COALESCE($3, retroalimentacion),
         fecha             = COALESCE($4, fecha),
         updated_at        = NOW()
       WHERE id = $5
       RETURNING ${EVALUATION_RETURNING}`,
      [estado, nota_final, retroalimentacion?.trim(), fecha, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Evaluación no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

module.exports = { getByProject, getById, create, update };
