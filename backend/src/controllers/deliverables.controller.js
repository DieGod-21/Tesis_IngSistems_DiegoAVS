const pool = require('../db/pool');
const { ESTADOS } = require('../constants');
const { validatePhaseName } = require('../utils/phases');

const ESTADOS_VALIDOS = ESTADOS.entregable;

const TEMPLATE_RETURNING  = `id, nombre, descripcion, fase_academica, orden, created_by, created_at, updated_at`;
const DELIVERABLE_RETURNING = `id, project_id, template_id, fecha_limite, estado, created_at, updated_at`;

const getTemplates = async (req, res, next) => {
  try {
    const { fase_academica } = req.query;

    if (fase_academica) {
      const err = await validatePhaseName(fase_academica);
      if (err) return res.status(400).json({ error: err });
    }

    let query = `SELECT ${TEMPLATE_RETURNING} FROM deliverable_templates WHERE 1=1`;
    const params = [];
    if (fase_academica) { params.push(fase_academica); query += ` AND fase_academica = $${params.length}`; }
    query += ' ORDER BY orden ASC';

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

const getTemplateById = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${TEMPLATE_RETURNING} FROM deliverable_templates WHERE id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Plantilla no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

const createTemplate = async (req, res, next) => {
  try {
    const { nombre, descripcion, fase_academica, orden } = req.body;

    if (!nombre?.trim() || !fase_academica || orden == null) {
      return res.status(400).json({ error: 'nombre, fase_academica y orden son requeridos' });
    }
    const phaseErr = await validatePhaseName(fase_academica);
    if (phaseErr) return res.status(400).json({ error: phaseErr });
    if (!Number.isInteger(Number(orden)) || Number(orden) < 1) {
      return res.status(400).json({ error: 'orden debe ser un número entero positivo' });
    }

    const created_by = req.user.user_id;

    const { rows } = await pool.query(
      `INSERT INTO deliverable_templates (id, nombre, descripcion, fase_academica, orden, created_by, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING ${TEMPLATE_RETURNING}`,
      [nombre.trim(), descripcion?.trim(), fase_academica, Number(orden), created_by]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

const getByProject = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT pd.${DELIVERABLE_RETURNING.split(', ').join(', pd.')},
              dt.nombre AS nombre_entregable, dt.descripcion AS descripcion_entregable
       FROM project_deliverables pd
       JOIN deliverable_templates dt ON dt.id = pd.template_id
       WHERE pd.project_id = $1
       ORDER BY dt.orden ASC`,
      [req.params.project_id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

const getDeliverableById = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT pd.id, pd.project_id, pd.template_id, pd.fecha_limite, pd.estado,
              pd.created_at, pd.updated_at, dt.nombre AS nombre_entregable
       FROM project_deliverables pd
       JOIN deliverable_templates dt ON dt.id = pd.template_id
       WHERE pd.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Entregable no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

const createDeliverable = async (req, res, next) => {
  try {
    const { project_id, template_id, fecha_limite, estado = 'pendiente' } = req.body;

    if (!project_id || !template_id || !fecha_limite) {
      return res.status(400).json({ error: 'project_id, template_id y fecha_limite son requeridos' });
    }
    if (!ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({ error: `estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}` });
    }

    const { rows } = await pool.query(
      `INSERT INTO project_deliverables (id, project_id, template_id, fecha_limite, estado, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
       RETURNING ${DELIVERABLE_RETURNING}`,
      [project_id, template_id, fecha_limite, estado]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

const updateDeliverable = async (req, res, next) => {
  try {
    const { fecha_limite, estado } = req.body;

    if (estado && !ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({ error: `estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}` });
    }

    const { rows } = await pool.query(
      `UPDATE project_deliverables SET
         fecha_limite = COALESCE($1, fecha_limite),
         estado       = COALESCE($2, estado),
         updated_at   = NOW()
       WHERE id = $3
       RETURNING ${DELIVERABLE_RETURNING}`,
      [fecha_limite, estado, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Entregable no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

module.exports = { getTemplates, getTemplateById, createTemplate, getByProject, getDeliverableById, createDeliverable, updateDeliverable };
