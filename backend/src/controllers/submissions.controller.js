const pool = require('../db/pool');

const SUBMISSION_RETURNING = `id, project_deliverable_id, submitted_by, numero_version,
                               url_archivo, comentario_entrega, es_final, submitted_at`;

const OBSERVATION_RETURNING = `id, submission_id, advisor_id, contenido, requiere_correccion, created_at`;

const getByDeliverable = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT sub.id, sub.project_deliverable_id, sub.numero_version,
              sub.url_archivo, sub.comentario_entrega, sub.es_final, sub.submitted_at,
              u.nombre_completo AS enviado_por_nombre
       FROM submissions sub
       JOIN users u ON u.id = sub.submitted_by
       WHERE sub.project_deliverable_id = $1
       ORDER BY sub.numero_version DESC`,
      [req.params.deliverable_id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT sub.id, sub.project_deliverable_id, sub.numero_version,
              sub.url_archivo, sub.comentario_entrega, sub.es_final, sub.submitted_at,
              u.nombre_completo AS enviado_por_nombre
       FROM submissions sub
       JOIN users u ON u.id = sub.submitted_by
       WHERE sub.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Entrega no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { project_deliverable_id, url_archivo, comentario_entrega, es_final = false } = req.body;

    if (!project_deliverable_id || !url_archivo?.trim()) {
      return res.status(400).json({ error: 'project_deliverable_id y url_archivo son requeridos' });
    }

    // submitted_by viene del token — el usuario solo puede enviar como sí mismo
    const submitted_by = req.user.user_id;

    const { rows: vRows } = await pool.query(
      'SELECT COALESCE(MAX(numero_version), 0) + 1 AS next_version FROM submissions WHERE project_deliverable_id = $1',
      [project_deliverable_id]
    );
    const numero_version = vRows[0].next_version;

    const { rows } = await pool.query(
      `INSERT INTO submissions
         (id, project_deliverable_id, submitted_by, numero_version, url_archivo, comentario_entrega, es_final, submitted_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW())
       RETURNING ${SUBMISSION_RETURNING}`,
      [project_deliverable_id, submitted_by, numero_version, url_archivo.trim(), comentario_entrega?.trim(), es_final]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

const getObservations = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT ao.id, ao.submission_id, ao.contenido, ao.requiere_correccion, ao.created_at,
              u.nombre_completo AS asesor_nombre
       FROM advisor_observations ao
       JOIN users u ON u.id = ao.advisor_id
       WHERE ao.submission_id = $1
       ORDER BY ao.created_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

const createObservation = async (req, res, next) => {
  try {
    const { contenido, requiere_correccion = false } = req.body;

    if (!contenido?.trim()) {
      return res.status(400).json({ error: 'contenido es requerido' });
    }

    // advisor_id viene del token
    const advisor_id = req.user.user_id;

    const { rows } = await pool.query(
      `INSERT INTO advisor_observations (id, submission_id, advisor_id, contenido, requiere_correccion, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW())
       RETURNING ${OBSERVATION_RETURNING}`,
      [req.params.id, advisor_id, contenido.trim(), requiere_correccion]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

module.exports = { getByDeliverable, getById, create, getObservations, createObservation };
