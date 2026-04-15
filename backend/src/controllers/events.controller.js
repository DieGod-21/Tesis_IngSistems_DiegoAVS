const pool = require('../db/pool');
const { TIPOS } = require('../constants');
const { validatePhaseName } = require('../utils/phases');

const TIPOS_VALIDOS = TIPOS.evento;

const EVENT_COLS = `id, titulo, tipo, fecha_inicio, fecha_fin, ubicacion,
                    project_id, semester_id, fase_academica, descripcion,
                    recordatorio, recordatorio_tiempo,
                    created_by, created_at, updated_at`;

const getAll = async (req, res, next) => {
  try {
    const { tipo, semester_id, fase_academica } = req.query;

    if (tipo && !TIPOS_VALIDOS.includes(tipo)) {
      return res.status(400).json({ error: `tipo debe ser uno de: ${TIPOS_VALIDOS.join(', ')}` });
    }
    if (fase_academica) {
      const err = await validatePhaseName(fase_academica);
      if (err) return res.status(400).json({ error: err });
    }

    let query = `SELECT ${EVENT_COLS} FROM events WHERE 1=1`;
    const params = [];
    if (tipo)           { params.push(tipo);           query += ` AND tipo = $${params.length}`; }
    if (semester_id)    { params.push(semester_id);    query += ` AND semester_id = $${params.length}`; }
    if (fase_academica) { params.push(fase_academica); query += ` AND fase_academica = $${params.length}`; }
    query += ' ORDER BY fecha_inicio ASC';

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${EVENT_COLS} FROM events WHERE id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Evento no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { titulo, tipo, fecha_inicio, fecha_fin, ubicacion, project_id, semester_id, fase_academica, descripcion, recordatorio, recordatorio_tiempo } = req.body;

    if (!titulo?.trim() || !tipo || !fecha_inicio) {
      return res.status(400).json({ error: 'titulo, tipo y fecha_inicio son requeridos' });
    }
    if (!TIPOS_VALIDOS.includes(tipo)) {
      return res.status(400).json({ error: `tipo debe ser uno de: ${TIPOS_VALIDOS.join(', ')}` });
    }
    if (fase_academica) {
      const err = await validatePhaseName(fase_academica);
      if (err) return res.status(400).json({ error: err });
    }
    if (fecha_fin && new Date(fecha_fin) <= new Date(fecha_inicio)) {
      return res.status(400).json({ error: 'fecha_fin debe ser posterior a fecha_inicio' });
    }

    const created_by = req.user.user_id;
    const rec       = recordatorio        === true || recordatorio === 'true';
    const recTiempo = parseInt(recordatorio_tiempo ?? '1', 10) || 1;

    // Auto-resolve semester if not provided
    let resolvedSemesterId = semester_id;
    if (!resolvedSemesterId) {
      const { rows: sem } = await pool.query(
        'SELECT id FROM semesters ORDER BY anio DESC, numero DESC LIMIT 1'
      );
      if (!sem.length) return res.status(400).json({ error: 'No existe ningún semestre registrado' });
      resolvedSemesterId = sem[0].id;
    }

    const { rows } = await pool.query(
      `INSERT INTO events
         (id, titulo, tipo, fecha_inicio, fecha_fin, ubicacion, project_id, semester_id,
          fase_academica, descripcion, recordatorio, recordatorio_tiempo,
          created_by, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
       RETURNING ${EVENT_COLS}`,
      [titulo.trim(), tipo, fecha_inicio, fecha_fin, ubicacion?.trim(), project_id, resolvedSemesterId,
       fase_academica, descripcion?.trim(), rec, recTiempo, created_by]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { titulo, tipo, fecha_inicio, fecha_fin, ubicacion, descripcion, recordatorio, recordatorio_tiempo } = req.body;

    if (tipo && !TIPOS_VALIDOS.includes(tipo)) {
      return res.status(400).json({ error: `tipo debe ser uno de: ${TIPOS_VALIDOS.join(', ')}` });
    }
    if (fecha_fin && fecha_inicio && new Date(fecha_fin) <= new Date(fecha_inicio)) {
      return res.status(400).json({ error: 'fecha_fin debe ser posterior a fecha_inicio' });
    }

    const rec       = recordatorio === undefined ? undefined : (recordatorio === true || recordatorio === 'true');
    const recTiempo = recordatorio_tiempo !== undefined ? (parseInt(recordatorio_tiempo, 10) || 1) : undefined;

    const { rows } = await pool.query(
      `UPDATE events SET
         titulo             = COALESCE($1, titulo),
         tipo               = COALESCE($2, tipo),
         fecha_inicio       = COALESCE($3, fecha_inicio),
         fecha_fin          = COALESCE($4, fecha_fin),
         ubicacion          = COALESCE($5, ubicacion),
         descripcion        = COALESCE($6, descripcion),
         recordatorio       = COALESCE($7, recordatorio),
         recordatorio_tiempo= COALESCE($8, recordatorio_tiempo),
         updated_at         = NOW()
       WHERE id = $9
       RETURNING ${EVENT_COLS}`,
      [titulo?.trim(), tipo, fecha_inicio, fecha_fin, ubicacion?.trim(), descripcion?.trim(),
       rec, recTiempo, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Evento no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM events WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Evento no encontrado' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getById, create, update, remove };
