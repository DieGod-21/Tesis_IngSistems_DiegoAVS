/**
 * Verifica que el usuario autenticado tenga al menos uno de los roles permitidos.
 * Debe usarse después del middleware authenticate.
 *
 * Uso: authorize('admin', 'asesor')
 */
const authorize = (...allowedRoles) => (req, res, next) => {
  const userRoles = req.user?.roles ?? [];
  const hasRole = allowedRoles.some((role) => userRoles.includes(role));

  if (!hasRole) {
    return res.status(403).json({ error: 'No tienes permisos para esta operación' });
  }

  next();
};

module.exports = authorize;
