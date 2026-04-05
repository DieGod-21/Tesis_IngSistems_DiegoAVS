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

module.exports = { getRecent };
