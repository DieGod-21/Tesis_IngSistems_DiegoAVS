const pool = require('../db/pool');

const getRecent = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT uh.id,
              uh.filename,
              uh.type,
              uh.status,
              uh.imported,
              uh.rejected,
              uh.total_rows,
              uh.errors,
              uh.created_at,
              u.correo_electronico AS uploaded_by
       FROM upload_history uh
       LEFT JOIN users u ON u.id = uh.created_by
       ORDER BY uh.created_at DESC
       LIMIT 20`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

const deleteUpload = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { rowCount } = await pool.query(
            'DELETE FROM upload_history WHERE id = $1',
            [id]
        );
        if (rowCount === 0) return res.status(404).json({ error: 'Registro no encontrado' });
        res.json({ message: 'Registro eliminado' });
    } catch (err) {
        next(err);
    }
};

module.exports = { getRecent, deleteUpload };
