require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initStorage } = require('./utils/storage');
const uploadRouter = require('./routes/upload');
const jobsRouter = require('./routes/jobs');
const outputRouter = require('./routes/output');

const app = express();
const PORT = process.env.PORT || 3001;

initStorage();

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/upload', uploadRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/output', outputRouter);

app.listen(PORT, () => {
  console.log(`backend running on http://localhost:${PORT}`);
});
