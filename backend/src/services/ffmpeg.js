const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { PATHS } = require('../utils/storage');

function convert(inputPath, jobId) {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(PATHS.processed, `${jobId}.wav`);

    const args = [
      '-y',
      '-i', inputPath,
      '-ar', '16000',
      '-ac', '1',
      '-f', 'wav',
      outputPath,
    ];

    const proc = spawn('ffmpeg', args);

    proc.on('close', (code) => {
      if (code !== 0) {
        fs.rm(outputPath, { force: true }, () => {});
        return reject(new Error(`ffmpeg exited with code ${code}`));
      }
      console.log(`ffmpeg ok: ${path.basename(outputPath)}`);
      resolve(outputPath);
    });

    proc.on('error', (err) => {
      reject(new Error(`ffmpeg spawn error: ${err.message}`));
    });
  });
}

module.exports = { convert };
