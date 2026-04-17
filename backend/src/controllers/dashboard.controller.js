const pool = require('../db/pool');

/**
 * GET /api/dashboard/summary
 *
 * Devuelve KPIs agregados del sistema en una sola consulta.
 * Evita que el frontend descargue todos los estudiantes para calcular conteos.
 */
const getSummary = async (_req, res, next) => {
    try {
        const { rows } = await pool.query(`
            WITH totals AS (
                SELECT
                    count(*)::int                                   AS total,
                    count(*) FILTER (WHERE approved)::int           AS approved,
                    count(*) FILTER (WHERE NOT approved)::int       AS pending,
                    CASE WHEN count(*) > 0
                         THEN round(count(*) FILTER (WHERE approved) * 100.0 / count(*))::int
                         ELSE 0
                    END                                             AS completion_pct
                FROM students
            ),
            phases AS (
                SELECT
                    ap.id          AS phase_id,
                    ap.name        AS phase_name,
                    ap.description AS phase_description,
                    count(s.id)::int AS count
                FROM students s
                INNER JOIN academic_phases ap ON ap.id = s.academic_phase_id
                GROUP BY ap.id, ap.name, ap.description
                ORDER BY ap.id
            )
            SELECT
                t.total,
                t.approved,
                t.pending,
                t.completion_pct,
                coalesce(
                    (SELECT json_agg(row_to_json(p)) FROM phases p),
                    '[]'::json
                ) AS by_phase
            FROM totals t
        `);

        const summary = rows[0];

        res.json({
            total:         summary.total,
            approved:      summary.approved,
            pending:       summary.pending,
            completionPct: summary.completion_pct,
            byPhase:       summary.by_phase,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/dashboard/recent-students
 *
 * Devuelve los N estudiantes mas recientemente actualizados.
 * Query param: limit (default 5, max 20).
 */
const getRecentStudents = async (req, res, next) => {
    try {
        const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 5));

        const { rows } = await pool.query(`
            SELECT s.id, s.nombre_completo, s.carnet_id, s.approved,
                   s.updated_at,
                   ap.name        AS phase_name,
                   ap.description AS phase_description
            FROM students s
            INNER JOIN academic_phases ap ON ap.id = s.academic_phase_id
            ORDER BY s.updated_at DESC
            LIMIT $1
        `, [limit]);

        res.json(rows);
    } catch (err) {
        next(err);
    }
};

module.exports = { getSummary, getRecentStudents };
