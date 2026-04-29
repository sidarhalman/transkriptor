const ffmpeg = require('./ffmpeg');
const whisper = require('./whisper');

const jobs = new Map();

function create(jobId, originalName, uploadPath) {
  const job = {
    id: jobId,
    status: 'queued',
    originalName,
    uploadPath,
    processedPath: null,
    transcriptPath: null,
    text: null,
    error: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  jobs.set(jobId, job);
  return job;
}

function update(jobId, fields) {
  const job = jobs.get(jobId);
  if (!job) return;
  Object.assign(job, fields, { updatedAt: new Date().toISOString() });
}

function get(jobId) {
  return jobs.get(jobId) || null;
}

function list() {
  return Array.from(jobs.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function run(jobId) {
  try {
    update(jobId, { status: 'processing' });
    console.log(`job [${jobId}]: ffmpeg start`);

    const job = get(jobId);
    const processedPath = await ffmpeg.convert(job.uploadPath, jobId);
    update(jobId, { processedPath });
    console.log(`job [${jobId}]: whisper start`);

    const { text, txtPath } = await whisper.transcribe(processedPath, jobId);
    update(jobId, { status: 'done', text, transcriptPath: txtPath });
    console.log(`job [${jobId}]: done`);
  } catch (err) {
    update(jobId, { status: 'error', error: err.message });
    console.error(`job [${jobId}]: error — ${err.message}`);
  }
}

module.exports = { create, get, list, run };
