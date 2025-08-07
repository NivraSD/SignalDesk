// Vercel serverless function entry point
// Uses the minimal server without monitoring services
const app = require('../server-minimal');

// Export for Vercel
module.exports = app;