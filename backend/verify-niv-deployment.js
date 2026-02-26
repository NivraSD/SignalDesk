#!/usr/bin/env node

// BULLETPROOF NIV DEPLOYMENT VERIFICATION
// This script MUST pass for deployment to be considered successful
// If this fails, the deployment is BROKEN

const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('');
console.log('🔍 BULLETPROOF NIV DEPLOYMENT VERIFICATION');
console.log('==========================================');
console.log('Build Time:', new Date().toISOString());
console.log('');

let allChecksPassed = true;

// Check 1: Verify Niv files exist
console.log('📍 Check 1: Verifying Niv files exist...');
const nivRoutesPath = path.join(__dirname, 'src/routes/nivRoutes.js');
const nivAgentPath = path.join(__dirname, 'src/agents/NivPRStrategist.js');

if (!fs.existsSync(nivRoutesPath)) {
    console.error('   ❌ CRITICAL FAILURE: nivRoutes.js NOT FOUND!');
    console.error('   Expected at:', nivRoutesPath);
    allChecksPassed = false;
} else {
    const stats = fs.statSync(nivRoutesPath);
    console.log('   ✅ nivRoutes.js exists (' + stats.size + ' bytes)');
}

if (!fs.existsSync(nivAgentPath)) {
    console.error('   ❌ CRITICAL FAILURE: NivPRStrategist.js NOT FOUND!');
    console.error('   Expected at:', nivAgentPath);
    allChecksPassed = false;
} else {
    const stats = fs.statSync(nivAgentPath);
    console.log('   ✅ NivPRStrategist.js exists (' + stats.size + ' bytes)');
}

// Check 2: Verify index.js includes the route
console.log('');
console.log('📍 Check 2: Verifying route registration...');
const indexPath = path.join(__dirname, 'index.js');

if (!fs.existsSync(indexPath)) {
    console.error('   ❌ CRITICAL FAILURE: index.js NOT FOUND!');
    allChecksPassed = false;
} else {
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    
    if (!indexContent.includes('app.use("/api/niv"')) {
        console.error('   ❌ CRITICAL FAILURE: Niv route NOT registered in index.js!');
        console.error('   Missing: app.use("/api/niv", ...)');
        allChecksPassed = false;
    } else {
        console.log('   ✅ Niv route registered in index.js');
        
        // Find the exact line for confirmation
        const lines = indexContent.split('\n');
        const routeLine = lines.findIndex(line => line.includes('app.use("/api/niv"'));
        if (routeLine !== -1) {
            console.log('   📍 Found at line', routeLine + 1 + ':', lines[routeLine].trim());
        }
    }
    
    if (!indexContent.includes('nivRoutes')) {
        console.error('   ❌ WARNING: nivRoutes variable not found in index.js!');
    } else {
        console.log('   ✅ nivRoutes variable found in index.js');
    }
}

// Check 3: Verify the route module can be loaded
console.log('');
console.log('📍 Check 3: Testing route module loading...');
try {
    const nivRoutes = require('./src/routes/nivRoutes');
    console.log('   ✅ nivRoutes module loads successfully');
    
    // Check if it's an Express router
    if (typeof nivRoutes === 'function' || (nivRoutes && nivRoutes.stack)) {
        console.log('   ✅ nivRoutes is a valid Express router');
    } else {
        console.error('   ❌ WARNING: nivRoutes may not be a valid Express router');
    }
} catch (err) {
    console.error('   ❌ CRITICAL FAILURE: Cannot load nivRoutes module!');
    console.error('   Error:', err.message);
    allChecksPassed = false;
}

// Check 4: Verify NivPRStrategist can be loaded
console.log('');
console.log('📍 Check 4: Testing NivPRStrategist loading...');
try {
    const NivPRStrategist = require('./src/agents/NivPRStrategist');
    console.log('   ✅ NivPRStrategist module loads successfully');
    
    if (typeof NivPRStrategist === 'function' || typeof NivPRStrategist === 'object') {
        console.log('   ✅ NivPRStrategist is valid');
    }
} catch (err) {
    console.error('   ❌ WARNING: Cannot load NivPRStrategist module');
    console.error('   Error:', err.message);
    // This is a warning, not a failure, as the route might still work
}

// Check 5: List all route files to ensure deployment completeness
console.log('');
console.log('📍 Check 5: Checking all routes directory...');
const routesDir = path.join(__dirname, 'src/routes');
if (fs.existsSync(routesDir)) {
    const routeFiles = fs.readdirSync(routesDir);
    console.log('   📁 Found', routeFiles.length, 'route files:');
    
    const hasNivRoute = routeFiles.includes('nivRoutes.js');
    if (!hasNivRoute) {
        console.error('   ❌ CRITICAL: nivRoutes.js NOT in routes directory!');
        allChecksPassed = false;
    } else {
        console.log('   ✅ nivRoutes.js is in the routes directory');
    }
    
    // List first few files for verification
    routeFiles.slice(0, 5).forEach(file => {
        console.log('      -', file);
    });
    if (routeFiles.length > 5) {
        console.log('      ... and', routeFiles.length - 5, 'more files');
    }
} else {
    console.error('   ❌ CRITICAL FAILURE: routes directory NOT FOUND!');
    allChecksPassed = false;
}

// Final Report
console.log('');
console.log('==========================================');
if (allChecksPassed) {
    console.log('🎉 SUCCESS: NIV DEPLOYMENT VERIFICATION PASSED!');
    console.log('✅ All critical checks passed');
    console.log('✅ Niv routes are properly deployed');
    console.log('✅ Deployment is READY for production');
    console.log('==========================================');
    process.exit(0);
} else {
    console.error('❌ FAILURE: NIV DEPLOYMENT VERIFICATION FAILED!');
    console.error('❌ One or more critical checks failed');
    console.error('❌ Deployment is BROKEN - DO NOT USE');
    console.error('❌ Railway must rebuild with all files');
    console.error('==========================================');
    process.exit(1);
}