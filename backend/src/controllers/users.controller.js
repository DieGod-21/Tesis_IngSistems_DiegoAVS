const pool   = require('../db/pool');
const bcrypt = require('bcryptjs');
const { EMAIL_REGEX, ESTADOS, PASSWORD_REGEX } = require('../constants');
const { parsePagination, paginatedResponse } = require('../lib/pagination');

const ESTADOS_VALIDOS = ESTADOS.usuario;

// Columnas seguras para devolver al cliente (nunca contrasena_hash)
const SAFE_COLUMNS = `u.id, u.nombre_completo, u.correo_electronico, u.estado, u.created_at`;

const getAll = async (req, res, next) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { rows } = await pool.query(
      `SELECT count(*) OVER() AS total_count, ${SAFE_COLUMNS}, array_agg(r.nombre) AS roles
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r       ON r.id = ur.role_id
       GROUP BY u.id
       ORDER BY u.nombre_completo
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
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
      `SELECT ${SAFE_COLUMNS}, array_agg(r.nombre) AS roles
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r       ON r.id = ur.role_id
       WHERE u.id = $1
       GROUP BY u.id`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const {
      nombre_completo,
      correo_electronico,
      contrasena,          // plain text — nunca aceptar contrasena_hash del cliente
      estado = 'activo',
    } = req.body;

    if (!nombre_completo?.trim() || !correo_electronico?.trim() || !contrasena) {
      return res.status(400).json({ error: 'nombre_completo, correo_electronico y contrasena son requeridos' });
    }
    if (!EMAIL_REGEX.test(correo_electronico.trim())) {
      return res.status(400).json({ error: 'Formato de correo electrónico inválido' });
    }
    if (typeof contrasena !== 'string' || !PASSWORD_REGEX.test(contrasena)) {
      return res.status(400).json({ error: 'La contraseña debe tener mínimo 8 caracteres, 1 mayúscula, 1 minúscula y 1 número' });
    }
    if (!ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({ error: `estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}` });
    }

    const contrasena_hash = await bcrypt.hash(contrasena, 12);

    const { rows } = await pool.query(
      `INSERT INTO users (id, nombre_completo, correo_electronico, contrasena_hash, estado, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
       RETURNING id, nombre_completo, correo_electronico, estado, created_at`,
      [nombre_completo.trim(), correo_electronico.trim(), contrasena_hash, estado]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre_completo, correo_electronico, estado } = req.body;

    if (correo_electronico && !EMAIL_REGEX.test(correo_electronico.trim())) {
      return res.status(400).json({ error: 'Formato de correo electrónico inválido' });
    }
    if (estado && !ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({ error: `estado debe ser uno de: ${ESTADOS_VALIDOS.join(', ')}` });
    }

    const { rows } = await pool.query(
      `UPDATE users SET
         nombre_completo    = COALESCE($1, nombre_completo),
         correo_electronico = COALESCE($2, correo_electronico),
         estado             = COALESCE($3, estado),
         updated_at         = NOW()
       WHERE id = $4
       RETURNING id, nombre_completo, correo_electronico, estado, updated_at`,
      [nombre_completo?.trim(), correo_electronico?.trim(), estado, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${SAFE_COLUMNS}, array_agg(r.nombre) AS roles
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r       ON r.id = ur.role_id
       WHERE u.id = $1
       GROUP BY u.id`,
      [req.user.user_id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'current_password y new_password son requeridos' });
    }
    if (!PASSWORD_REGEX.test(new_password)) {
      return res.status(400).json({ error: 'La contraseña debe tener mínimo 8 caracteres, 1 mayúscula, 1 minúscula y 1 número' });
    }

    const { rows } = await pool.query(
      'SELECT contrasena_hash FROM users WHERE id = $1',
      [req.user.user_id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });

    const valid = await bcrypt.compare(current_password, rows[0].contrasena_hash);
    if (!valid) return res.status(401).json({ error: 'Contraseña actual incorrecta' });

    const hash = await bcrypt.hash(new_password, 12);
    await pool.query(
      'UPDATE users SET contrasena_hash = $1, updated_at = NOW() WHERE id = $2',
      [hash, req.user.user_id]
    );

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getById, create, update, remove, getMe, changePassword };
