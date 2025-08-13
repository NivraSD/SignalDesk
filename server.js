// Railway entry point - redirects to the full server
const path = require('path');
console.log('🚀 Railway is running server.js from root');
console.log('📍 Current directory:', __dirname);
console.log('📍 Redirecting to backend/index.js (full server with all routes)...');
console.log('🔄 Deployment timestamp:', new Date().toISOString());

// Ensure we can find the backend directory
const backendPath = path.join(__dirname, 'backend', 'index.js');
console.log('📍 Looking for backend at:', backendPath);

// Check if the backend file exists
const fs = require('fs');
if (!fs.existsSync(backendPath)) {
  console.error('❌ Backend file not found at:', backendPath);
  console.log('📂 Available files in current directory:');
  fs.readdirSync(__dirname).forEach(file => {
    console.log('   -', file);
  });
  process.exit(1);
}

// Load the actual server
require(backendPath);
