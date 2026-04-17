/**
 * app.js
 *
 * Instancia Express sin app.listen().
 * Exportada para ser usada por:
 *   - index.js (servidor real con app.listen)
 *   - tests con Supertest (sin puerto abierto)
 */

require('dotenv').config();
const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const compression = require('compression');
const swaggerUi   = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(compression());
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json({ limit: '1mb' }));

// Swagger UI — solo en desarrollo
if (process.env.NODE_ENV !== 'production') {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        customSiteTitle: 'API — Proyectos de Graduación UMG',
        swaggerOptions: { persistAuthorization: true },
    }));
    app.get('/api-docs.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });
}

// Rutas
app.use('/api/auth',        require('./routes/auth.routes'));
app.use('/api/users',       require('./routes/users.routes'));
app.use('/api/students',    require('./routes/students.routes'));
app.use('/api/projects',    require('./routes/projects.routes'));
app.use('/api/semesters',   require('./routes/semesters.routes'));
app.use('/api/deliverables',require('./routes/deliverables.routes'));
app.use('/api/submissions', require('./routes/submissions.routes'));
app.use('/api/evaluations', require('./routes/evaluations.routes'));
app.use('/api/events',      require('./routes/events.routes'));
app.use('/api/deadlines',   require('./routes/deadlines.routes'));
app.use('/api/uploads',         require('./routes/uploads.routes'));
app.use('/api/academic-phases', require('./routes/academic_phases.routes'));
app.use('/api/notifications',   require('./routes/notifications.routes'));

app.get('/', (_req, res) => {
    res.json({ message: 'Backend tesis_db funcionando correctamente', version: '1.0.0' });
});

// Health check — útil para Docker / balanceadores de carga
app.get('/health', async (_req, res) => {
    const pool = require('./db/pool');
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'ok', db: 'connected' });
    } catch {
        res.status(503).json({ status: 'error', db: 'disconnected' });
    }
});

app.use((req, res) => {
    res.status(404).json({ error: `Ruta ${req.method} ${req.path} no encontrada` });
});

app.use(errorHandler);

module.exports = app;
