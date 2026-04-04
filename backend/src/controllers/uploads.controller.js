const pool = require('../db/pool');

const getRecent = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, filename, type, status, imported, rejected, created_at
       FROM upload_history
       ORDER BY created_at DESC
       LIMIT 10`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

module.exports = { getRecent };
