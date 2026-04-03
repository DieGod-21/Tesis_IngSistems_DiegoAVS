const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const validateUUID = (...paramNames) => (req, res, next) => {
  for (const param of paramNames) {
    const value = req.params[param];
    if (value && !UUID_REGEX.test(value)) {
      return res.status(400).json({ error: `El parámetro '${param}' no es un UUID válido` });
    }
  }
  next();
};

module.exports = validateUUID;