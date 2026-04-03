require('dotenv').config();
const { validate } = require('./config/env');
validate();

const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

require('./db/pool');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '1mb' }));

app.use('/api/users',        require('./routes/users.routes'));
app.use('/api/students',     require('./routes/students.routes'));
app.use('/api/projects',     require('./routes/projects.routes'));
app.use('/api/semesters',    require('./routes/semesters.routes'));
app.use('/api/deliverables', require('./routes/deliverables.routes'));
app.use('/api/submissions',  require('./routes/submissions.routes'));
app.use('/api/evaluations',  require('./routes/evaluations.routes'));
app.use('/api/events',       require('./routes/events.routes'));
app.use('/api/deadlines',    require('./routes/deadlines.routes'));

app.get('/', (req, res) => {
  res.json({ message: 'Backend tesis_db funcionando correctamente', version: '1.0.0' });
});

app.use((req, res) => {
  res.status(404).json({ error: `Ruta ${req.method} ${req.path} no encontrada` });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});