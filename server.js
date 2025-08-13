// Railway entry point - redirects to the full server
console.log('🚀 Railway is running server.js from root');
console.log('📍 Current directory:', __dirname);
console.log('📍 Redirecting to backend/index.js (full server with all routes)...');
console.log('🔄 Deployment timestamp:', new Date().toISOString());

// Load the actual server
require('./backend/index.js');
