const pool = require('../db/pool');
const { getAllPhases, getAllPhasesAdmin, refreshCache } = require('../utils/phaseCache');

/** GET /api/academic-phases — devuelve solo fases activas (para formularios de estudiantes). */
const getAll = (_req, res) => {
    res.json(getAllPhases());
};

/** GET /api/academic-phases/admin — devuelve todas las fases (activas e inactivas), solo admin. */
const getAllAdmin = (_req, res) => {
    res.json(getAllPhasesAdmin());
};

/** POST /api/academic-phases — crea una nueva fase académica. Solo admin. */
const create = async (req, res, next) => {
    try {
        const name        = (req.body.name ?? '').trim();
        const description = (req.body.description ?? '').trim();

        if (!name)        return res.status(400).json({ error: 'El campo name es obligatorio.' });
        if (!description) return res.status(400).json({ error: 'El campo description es obligatorio.' });

        // Verificar unicidad del nombre
        const dup = await pool.query('SELECT 1 FROM academic_phases WHERE name = $1', [name]);
        if (dup.rowCount > 0) {
            return res.status(409).json({ error: `Ya existe una fase con el nombre "${name}".` });
        }

        const { rows } = await pool.query(
            'INSERT INTO academic_phases (name, description) VALUES ($1, $2) RETURNING *',
            [name, description]
        );

        await refreshCache();
        res.status(201).json(rows[0]);
    } catch (err) {
        next(err);
    }
};

/** PUT /api/academic-phases/:id — actualiza nombre y descripción. Solo admin. */
const update = async (req, res, next) => {
    try {
        const id          = Number(req.params.id);
        const name        = (req.body.name ?? '').trim();
        const description = (req.body.description ?? '').trim();

        if (!name)        return res.status(400).json({ error: 'El campo name es obligatorio.' });
        if (!description) return res.status(400).json({ error: 'El campo description es obligatorio.' });

        // Verificar unicidad excluyendo el propio registro
        const dup = await pool.query(
            'SELECT 1 FROM academic_phases WHERE name = $1 AND id <> $2',
            [name, id]
        );
        if (dup.rowCount > 0) {
            return res.status(409).json({ error: `Ya existe otra fase con el nombre "${name}".` });
        }

        const { rows, rowCount } = await pool.query(
            'UPDATE academic_phases SET name = $1, description = $2 WHERE id = $3 RETURNING *',
            [name, description, id]
        );

        if (rowCount === 0) return res.status(404).json({ error: 'Fase académica no encontrada.' });

        await refreshCache();
        res.json(rows[0]);
    } catch (err) {
        next(err);
    }
};

/** PATCH /api/academic-phases/:id/toggle — activa o desactiva una fase. Solo admin. */
const toggle = async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        const { rows, rowCount } = await pool.query(
            'UPDATE academic_phases SET is_active = NOT is_active WHERE id = $1 RETURNING *',
            [id]
        );

        if (rowCount === 0) return res.status(404).json({ error: 'Fase académica no encontrada.' });

        await refreshCache();
        res.json(rows[0]);
    } catch (err) {
        next(err);
    }
};

/** POST /api/academic-phases/refresh — recarga el cache sin reiniciar el servidor. Solo admin. */
const refresh = async (_req, res, next) => {
    try {
        await refreshCache();
        res.json({ message: 'Cache de fases académicas actualizado', total: getAllPhases().length });
    } catch (err) {
        next(err);
    }
};

module.exports = { getAll, getAllAdmin, create, update, toggle, refresh };
