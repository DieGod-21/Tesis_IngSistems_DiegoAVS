const PG_ERRORS = {
  '22P02': { status: 400, message: 'ID con formato inválido' },
  '23505': { status: 409, message: 'Ya existe un registro con ese valor único' },
  '23503': { status: 409, message: 'El recurso relacionado no existe' },
  '23514': { status: 400, message: 'Valor fuera del rango permitido' },
  '23502': { status: 400, message: 'Falta un campo obligatorio' },
};

const errorHandler = (err, req, res, _next) => {
  const pg = PG_ERRORS[err.code];
  if (pg) {
    // Nunca exponer err.detail: puede contener nombres de columnas y valores de la DB
    return res.status(pg.status).json({ error: pg.message });
  }

  const status = err.status || 500;
  res.status(status).json({
    // En producción se oculta el mensaje real; en desarrollo se muestra para depuración
    error: process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : err.message,
  });
};

module.exports = errorHandler;
