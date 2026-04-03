require('dotenv').config();
const { validate } = require('./config/env');
validate();

require('./db/pool');

const app = require('./app');
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log(`Swagger UI disponible en http://localhost:${PORT}/api-docs`);
});
