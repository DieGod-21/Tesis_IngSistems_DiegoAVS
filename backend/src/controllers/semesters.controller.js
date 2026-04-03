const pool = require('../db/pool');

const getAll = async (_req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM semesters ORDER BY anio DESC, numero DESC');
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM semesters WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Semestre no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { nombre, anio, numero } = req.body;

    if (!nombre?.trim() || anio == null || numero == null) {
      return res.status(400).json({ error: 'nombre, anio y numero son requeridos' });
    }
    if (!Number.isInteger(Number(anio)) || Number(anio) < 2000 || Number(anio) > 2100) {
      return res.status(400).json({ error: 'anio debe ser un año válido entre 2000 y 2100' });
    }
    if (![1, 2].includes(Number(numero))) {
      return res.status(400).json({ error: 'numero debe ser 1 o 2' });
    }

    const { rows } = await pool.query(
      `INSERT INTO semesters (id, nombre, anio, numero, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW()) RETURNING *`,
      [nombre.trim(), Number(anio), Number(numero)]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { nombre, anio, numero } = req.body;

    if (anio != null && (!Number.isInteger(Number(anio)) || Number(anio) < 2000 || Number(anio) > 2100)) {
      return res.status(400).json({ error: 'anio debe ser un año válido entre 2000 y 2100' });
    }
    if (numero != null && ![1, 2].includes(Number(numero))) {
      return res.status(400).json({ error: 'numero debe ser 1 o 2' });
    }

    const { rows } = await pool.query(
      `UPDATE semesters SET
         nombre     = COALESCE($1, nombre),
         anio       = COALESCE($2, anio),
         numero     = COALESCE($3, numero),
         updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [nombre?.trim(), anio != null ? Number(anio) : null, numero != null ? Number(numero) : null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Semestre no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getById, create, update };