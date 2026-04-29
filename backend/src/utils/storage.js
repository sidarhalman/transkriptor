const fs = require('fs');
const path = require('path');

const BASE = path.resolve(__dirname, '../../../storage');

const PATHS = {
  uploads: path.join(BASE, 'uploads'),
  processed: path.join(BASE, 'processed'),
  transcripts: path.join(BASE, 'transcripts'),
  outputs: path.join(BASE, 'outputs'),
};

function initStorage() {
  Object.values(PATHS).forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
}

module.exports = { PATHS, initStorage };
