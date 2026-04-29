const express = require('express');
const path = require('path');
const jobManager = require('../services/jobManager');
const { generateDocx, generatePdf } = require('../services/outputGenerator');
const { PATHS } = require('../utils/storage');

const router = express.Router();

function requireDone(req, res) {
  const job = jobManager.get(req.params.id);
  if (!job) { res.status(404).json({ error: 'job not found' }); return null; }
  if (job.status !== 'done') { res.status(409).json({ error: `job status: ${job.status}` }); return null; }
  return job;
}

router.get('/:id/txt', (req, res) => {
  const job = requireDone(req, res);
  if (!job) return;

  const txtPath = path.join(PATHS.transcripts, `${job.id}.txt`);
  const filename = `${path.parse(job.originalName).name}.txt`;
  res.download(txtPath, filename);
});

router.get('/:id/docx', async (req, res) => {
  const job = requireDone(req, res);
  if (!job) return;

  try {
    const docxPath = await generateDocx(job);
    const filename = `${path.parse(job.originalName).name}.docx`;
    res.download(docxPath, filename);
  } catch (err) {
    console.error(`docx error [${job.id}]: ${err.message}`);
    res.status(500).json({ error: 'failed to generate docx' });
  }
});

router.get('/:id/pdf', async (req, res) => {
  const job = requireDone(req, res);
  if (!job) return;

  try {
    const outPath = await generatePdf(job);
    const filename = `${path.parse(job.originalName).name}.pdf`;
    res.download(outPath, filename);
  } catch (err) {
    console.error(`pdf error [${job.id}]: ${err.message}`);
    res.status(500).json({ error: 'failed to generate pdf' });
  }
});

module.exports = router;
