const { getAllPhases, refreshCache } = require('../utils/phaseCache');

const getAll = (_req, res) => {
    res.json(getAllPhases());
};

/** Endpoint opcional: recarga el cache sin reiniciar el servidor. */
const refresh = async (_req, res, next) => {
    try {
        await refreshCache();
        res.json({ message: 'Cache de fases académicas actualizado', total: getAllPhases().length });
    } catch (err) {
        next(err);
    }
};

module.exports = { getAll, refresh };
