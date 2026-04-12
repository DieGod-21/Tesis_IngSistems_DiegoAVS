const pool = require('../db/pool');

const NOTIF_COLS = 'id, user_id, titulo, mensaje, leida, event_id, created_at';

/** GET /api/notifications — returns notifications for the authenticated user */
const getAll = async (req, res, next) => {
  try {
    const user_id = req.user.user_id;
    const { rows } = await pool.query(
      `SELECT ${NOTIF_COLS}
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [user_id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

/** GET /api/notifications/unread-count */
const unreadCount = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM notifications
       WHERE user_id = $1 AND leida = false`,
      [req.user.user_id]
    );
    res.json({ count: rows[0].count });
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/notifications/:id/read */
const markRead = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `UPDATE notifications
       SET leida = true
       WHERE id = $1 AND user_id = $2
       RETURNING ${NOTIF_COLS}`,
      [req.params.id, req.user.user_id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Notificación no encontrada' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/notifications/read-all */
const markAllRead = async (req, res, next) => {
  try {
    await pool.query(
      `UPDATE notifications SET leida = true WHERE user_id = $1 AND leida = false`,
      [req.user.user_id]
    );
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, unreadCount, markRead, markAllRead };
