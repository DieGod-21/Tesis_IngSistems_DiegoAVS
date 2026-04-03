/**
 * app.js
 *
 * Instancia Express sin app.listen().
 * Exportada para ser usada por:
 *   - index.js (servidor real con app.listen)
 *   - tests con Supertest (sin puerto abierto)
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '1mb' }));

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'API — Proyectos de Graduación UMG',
    swaggerOptions: { persistAuthorization: true },
}));
app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

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

app.get('/', (_req, res) => {
    res.json({ message: 'Backend tesis_db funcionando correctamente', version: '1.0.0' });
});

app.use((req, res) => {
    res.status(404).json({ error: `Ruta ${req.method} ${req.path} no encontrada` });
});

app.use(errorHandler);

module.exports = app;
