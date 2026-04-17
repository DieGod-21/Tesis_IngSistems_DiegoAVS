require('dotenv').config();
const { validate } = require('./config/env');
validate();

const pool = require('./db/pool');

const { loadCache } = require('./utils/phaseCache');
const app = require('./app');
const reminderJob = require('./jobs/reminderJob');
const PORT = process.env.PORT || 3000;

loadCache()
    .then(() => {
        const server = app.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
            console.log(`Swagger UI disponible en http://localhost:${PORT}/api-docs`);
            reminderJob.start();
        });

        // Graceful shutdown
        const shutdown = () => {
            console.log('[shutdown] Cerrando servidor...');
            server.close(async () => {
                await pool.end();
                console.log('[shutdown] Conexiones cerradas. Proceso finalizado.');
                process.exit(0);
            });
        };
        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);
    })
    .catch((err) => {
        console.error('[startup] Error cargando cache de fases:', err.message);
        process.exit(1);
    });
