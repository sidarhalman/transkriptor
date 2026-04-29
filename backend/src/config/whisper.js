const path = require('path');

const WHISPER_BINARY = process.env.WHISPER_BINARY || 'whisper-cli';
const WHISPER_MODEL = process.env.WHISPER_MODEL ||
  path.resolve(__dirname, '../../../whisper/models/ggml-base.en.bin');

module.exports = { WHISPER_BINARY, WHISPER_MODEL };
