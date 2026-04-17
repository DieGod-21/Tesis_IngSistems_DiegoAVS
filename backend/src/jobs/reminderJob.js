/**
 * reminderJob.js
 *
 * Daily background job that creates in-app notifications for events
 * with reminders enabled whose date matches "today + recordatorio_tiempo days".
 *
 * Runs at 08:00 every day using a self-scheduling setTimeout (no external deps).
 * Recipients: all active users with admin or asesor role.
 */

const pool = require('../db/pool');

async function runReminders() {
  console.log('[reminderJob] Checking upcoming events…');
  const client = await pool.connect();

  try {
    // Find events whose reminder fires today:
    //   fecha_inicio - recordatorio_tiempo days = today  (in UTC)
    const { rows: events } = await client.query(`
      SELECT id, titulo, fecha_inicio, recordatorio_tiempo
      FROM   events
      WHERE  recordatorio = true
        AND  (fecha_inicio::date - recordatorio_tiempo * INTERVAL '1 day')::date = CURRENT_DATE
    `);

    if (!events.length) {
      console.log('[reminderJob] No reminders to send today.');
      return;
    }

    let created = 0;

    for (const ev of events) {
      const fechaStr = new Date(ev.fecha_inicio).toLocaleDateString('es-GT', {
        day: 'numeric', month: 'long', year: 'numeric',
      });
      const dias = ev.recordatorio_tiempo;
      const titulo  = `Recordatorio: ${ev.titulo}`;
      const mensaje = dias === 1
        ? `Tienes un evento mañana: "${ev.titulo}" (${fechaStr})`
        : `Tienes un evento en ${dias} días: "${ev.titulo}" (${fechaStr})`;

      // Batch insert: una sola query por evento en vez de N queries por usuario
      const { rowCount } = await client.query(`
        INSERT INTO notifications (id, user_id, titulo, mensaje, event_id, created_at)
        SELECT gen_random_uuid(), u.id, $1, $2, $3, NOW()
        FROM (
          SELECT DISTINCT u.id
          FROM   users u
          JOIN   user_roles ur ON ur.user_id = u.id
          JOIN   roles r       ON r.id = ur.role_id
          WHERE  r.nombre IN ('admin', 'asesor')
            AND  u.estado = 'activo'
        ) u
        WHERE NOT EXISTS (
          SELECT 1 FROM notifications n
          WHERE n.user_id  = u.id
            AND n.event_id = $3
            AND n.created_at::date = CURRENT_DATE
        )
      `, [titulo, mensaje, ev.id]);

      created += rowCount;
    }

    console.log(`[reminderJob] Created ${created} notification(s).`);
  } catch (err) {
    console.error('[reminderJob] Error:', err.message);
  } finally {
    client.release();
  }
}

/**
 * Schedules the next run at 08:00 local server time.
 * Self-reschedules after each execution.
 */
function scheduleNextRun() {
  const now   = new Date();
  const next  = new Date(now);
  next.setHours(8, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1); // already past 8 AM today

  const delay = next.getTime() - now.getTime();
  console.log(`[reminderJob] Next run at ${next.toLocaleString('es-GT')} (in ${Math.round(delay / 60000)} min)`);

  setTimeout(async () => {
    await runReminders();
    scheduleNextRun(); // reschedule for tomorrow
  }, delay);
}

function start() {
  scheduleNextRun();
}

module.exports = { start, runReminders };
