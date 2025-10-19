#!/usr/bin/env node

/**
 * SignalDesk Deployment Verification Script
 * Tests the connection between frontend and backend
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const BACKEND_URL = 'https://signaldesk-production.up.railway.app/api';
const CONFIG_FILE = path.join(__dirname, 'src/config/api.js');
const ENV_FILE = path.join(__dirname, '.env.production');

console.log('🔍 SignalDesk Deployment Verification');
console.log('=====================================\n');

// Check 1: Verify configuration files
console.log('📋 Checking configuration files...');

// Check api.js
if (fs.existsSync(CONFIG_FILE)) {
    const apiConfig = fs.readFileSync(CONFIG_FILE, 'utf8');
    if (apiConfig.includes(BACKEND_URL)) {
        console.log('✅ src/config/api.js is correctly configured');
    } else {
        console.log('⚠️  src/config/api.js may need updating');
    }
} else {
    console.log('❌ src/config/api.js not found');
}

// Check .env.production
if (fs.existsSync(ENV_FILE)) {
    const envConfig = fs.readFileSync(ENV_FILE, 'utf8');
    if (envConfig.includes(BACKEND_URL)) {
        console.log('✅ .env.production is correctly configured');
    } else {
        console.log('⚠️  .env.production may need updating');
    }
} else {
    console.log('❌ .env.production not found');
}

// Check vercel.json
const vercelConfig = path.join(__dirname, 'vercel.json');
if (fs.existsSync(vercelConfig)) {
    const vercel = JSON.parse(fs.readFileSync(vercelConfig, 'utf8'));
    if (vercel.env && vercel.env.REACT_APP_API_URL === BACKEND_URL) {
        console.log('✅ vercel.json is correctly configured');
    } else {
        console.log('⚠️  vercel.json may need updating');
    }
} else {
    console.log('❌ vercel.json not found');
}

console.log('\n📡 Testing backend connection...');

// Check 2: Test backend health endpoint
const testBackend = () => {
    return new Promise((resolve, reject) => {
        https.get(`${BACKEND_URL}/health`, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log('✅ Backend is healthy and responding');
                    try {
                        const parsed = JSON.parse(data);
                        console.log(`   Status: ${parsed.status || 'OK'}`);
                        if (parsed.database) {
                            console.log(`   Database: ${parsed.database}`);
                        }
                    } catch (e) {
                        console.log(`   Response: ${data}`);
                    }
                    resolve(true);
                } else {
                    console.log(`⚠️  Backend returned status code: ${res.statusCode}`);
                    console.log(`   Response: ${data}`);
                    resolve(false);
                }
            });
        }).on('error', (err) => {
            console.log('❌ Failed to connect to backend');
            console.log(`   Error: ${err.message}`);
            reject(err);
        });
    });
};

// Run the backend test
testBackend().then((success) => {
    console.log('\n=====================================');
    console.log('📊 Verification Summary:');
    console.log('=====================================');
    
    if (success) {
        console.log('✅ Frontend is properly configured to connect to Railway backend');
        console.log('\n🚀 Next Steps:');
        console.log('1. Deploy to Vercel: vercel --prod');
        console.log('2. Set environment variables in Vercel Dashboard');
        console.log('3. Test at: https://your-vercel-url/test-backend-connection.html');
    } else {
        console.log('⚠️  Some issues detected. Please review the output above.');
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Ensure Railway backend is deployed and running');
        console.log('2. Check Railway logs for any errors');
        console.log('3. Verify CORS settings on the backend');
    }
    
    console.log('\n📝 Configuration Details:');
    console.log(`   Backend URL: ${BACKEND_URL}`);
    console.log(`   Frontend Dir: ${__dirname}`);
    
}).catch((error) => {
    console.log('\n❌ Verification failed with error:', error.message);
    process.exit(1);
});