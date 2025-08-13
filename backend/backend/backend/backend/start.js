#!/usr/bin/env node

// Failsafe start script to ensure server.js is always used
console.log('🚀 SignalDesk Backend Starting...');
console.log('📍 Using server.js (full route configuration)');
console.log('⏰ Time:', new Date().toISOString());

// Load and start server.js
require('./server.js');