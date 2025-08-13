// Content Generation API - Main endpoint that ContentGenerator uses
const aiGenerate = require('./ai-generate.js');

module.exports = function handler(req, res) {
  // Pass through to the AI generation handler
  return aiGenerate(req, res);
};