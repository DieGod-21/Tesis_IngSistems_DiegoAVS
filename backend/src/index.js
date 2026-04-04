require('dotenv').config();
const { validate } = require('./config/env');
validate();

require('./db/pool');

const { loadCache } = require('./utils/phaseCache');
const app = require('./app');
const PORT = process.env.PORT || 3000;

loadCache()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
            console.log(`Swagger UI disponible en http://localhost:${PORT}/api-docs`);
        });
    })
    .catch((err) => {
        console.error('[startup] Error cargando cache de fases:', err.message);
        process.exit(1);
    });
