const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { WHISPER_BINARY, WHISPER_MODEL } = require('../config/whisper');
const { PATHS } = require('../utils/storage');

function transcribe(wavPath, jobId) {
  return new Promise((resolve, reject) => {
    const outputBase = path.join(PATHS.transcripts, jobId);

    const args = [
      '-m', WHISPER_MODEL,
      '-f', wavPath,
      '-l', 'en',
      '--no-timestamps',
      '-t', '4',
      '-otxt',
      '-of', outputBase,
    ];

    const proc = spawn(WHISPER_BINARY, args);

    proc.stderr.on('data', (chunk) => {
      const line = chunk.toString().trim();
      if (line.startsWith('whisper_print_timings') || line.includes('progress')) {
        console.log(`whisper [${jobId}]: ${line}`);
      }
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`whisper exited with code ${code}`));
      }

      const txtPath = `${outputBase}.txt`;
      fs.readFile(txtPath, 'utf8', (err, data) => {
        if (err) return reject(new Error(`transcript file not found: ${err.message}`));
        const text = data.trim();
        console.log(`whisper ok [${jobId}]: ${text.length} chars`);
        resolve({ text, txtPath });
      });
    });

    proc.on('error', (err) => {
      reject(new Error(`whisper spawn error: ${err.message}`));
    });
  });
}

module.exports = { transcribe };
