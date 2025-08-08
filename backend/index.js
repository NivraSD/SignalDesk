// SignalDesk Backend Entry Point
// This file ensures server.js is always used

console.log('🚀 SignalDesk Backend Starting...');
console.log('📍 Loading server.js with all routes...');
console.log('⏰ Start time:', new Date().toISOString());

// Load the main server with all routes
require('./server.js');

// This ensures Railway uses server.js which has:
// - All API routes
// - Claude diagnostics
// - Campaign Intelligence
// - Opportunity Engine
// - Media List Builder