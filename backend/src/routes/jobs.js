const express = require('express');
const jobManager = require('../services/jobManager');

const router = express.Router();

router.get('/', (_req, res) => {
  res.json(jobManager.list());
});

router.get('/:id', (req, res) => {
  const job = jobManager.get(req.params.id);
  if (!job) return res.status(404).json({ error: 'job not found' });
  res.json(job);
});

module.exports = router;
