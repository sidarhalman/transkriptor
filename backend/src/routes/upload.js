const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { PATHS } = require('../utils/storage');
const jobManager = require('../services/jobManager');

const router = express.Router();

const ALLOWED_MIME = new Set([
  'audio/mpeg',
  'audio/mp4',
  'audio/x-m4a',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
  'video/mp4',
]);

const ALLOWED_EXT = new Set(['.mp3', '.mp4', '.m4a', '.wav', '.ogg']);

const storage = multer.diskStorage({
  destination: PATHS.uploads,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_MIME.has(file.mimetype) || ALLOWED_EXT.has(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`unsupported file type: ${file.originalname}`));
    }
  },
});

router.post('/', upload.single('audio'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no file uploaded' });

  const jobId = path.parse(req.file.filename).name;
  jobManager.create(jobId, req.file.originalname, req.file.path);
  console.log(`upload ok: ${req.file.filename} (${req.file.size} bytes)`);

  res.json({ jobId });

  jobManager.run(jobId);
});

router.use((err, _req, res, _next) => {
  console.error(`upload error: ${err.message}`);
  res.status(400).json({ error: err.message });
});

module.exports = router;
