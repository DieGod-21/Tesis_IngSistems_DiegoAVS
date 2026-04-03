const pool    = require('../db/pool');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { EMAIL_REGEX } = require('../constants');

const login = async (req, res, next) => {
  try {
    const { correo_electronico, contrasena } = req.body;

    if (!correo_electronico?.trim() || !contrasena) {
      return res.status(400).json({ error: 'correo_electronico y contrasena son requeridos' });
    }
    if (!EMAIL_REGEX.test(correo_electronico.trim())) {
      return res.status(400).json({ error: 'Formato de correo electrónico inválido' });
    }

    const { rows } = await pool.query(
      `SELECT u.id, u.contrasena_hash, u.estado,
              array_agg(r.nombre) FILTER (WHERE r.nombre IS NOT NULL) AS roles
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r       ON r.id = ur.role_id
       WHERE u.correo_electronico = $1
       GROUP BY u.id`,
      [correo_electronico.trim()]
    );

    // Mismo mensaje para usuario inexistente y contraseña incorrecta
    // → evita enumeración de usuarios
    const user = rows[0];
    const passwordOk = user && await bcrypt.compare(contrasena, user.contrasena_hash);

    if (!passwordOk) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (user.estado !== 'activo') {
      return res.status(403).json({ error: 'Cuenta no disponible' });
    }

    const token = jwt.sign(
      { user_id: user.id, roles: user.roles ?? [] },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    res.json({ token });
  } catch (err) {
    next(err);
  }
};

module.exports = { login };
