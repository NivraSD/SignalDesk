// FORCE REDIRECT - This file should NOT be used directly
// Railway should be running backend/index.js per package.json
console.log('=====================================');
console.log('⚠️  WARNING: server.js is deprecated!');
console.log('📍 Redirecting to backend/index.js...');
console.log('⏰ Redirect time:', new Date().toISOString());
console.log('=====================================');

// Load the actual server
require('./backend/index.js');