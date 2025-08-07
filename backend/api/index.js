// Vercel serverless function wrapper
// This file must be in the api directory for Vercel to recognize it
const app = require('../server');

// Export the Express app for Vercel
module.exports = app;