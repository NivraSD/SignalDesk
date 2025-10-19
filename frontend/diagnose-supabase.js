#!/usr/bin/env node

const https = require('https');

console.log('🔍 Diagnosing Supabase Connection Issues');
console.log('=========================================\n');

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8';

// Decode JWT to check expiry
function decodeJWT(token) {
    try {
        const parts = token.split('.');
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        return payload;
    } catch (e) {
        return null;
    }
}

// Test HTTPS connection
function testConnection(url, options = {}) {
    return new Promise((resolve) => {
        const urlObj = new URL(url);
        const reqOptions = {
            hostname: urlObj.hostname,
            path: urlObj.pathname,
            method: options.method || 'GET',
            headers: options.headers || {},
            timeout: 5000
        };

        const req = https.request(reqOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    data: data
                });
            });
        });

        req.on('error', (err) => {
            resolve({ error: err.message });
        });

        req.on('timeout', () => {
            req.destroy();
            resolve({ error: 'Connection timeout' });
        });

        if (options.body) {
            req.write(options.body);
        }
        req.end();
    });
}

async function diagnose() {
    console.log('1. Checking JWT Token...');
    const decoded = decodeJWT(ANON_KEY);
    if (decoded) {
        const exp = new Date(decoded.exp * 1000);
        const now = new Date();
        console.log(`   ✓ Token decoded successfully`);
        console.log(`   - Project Ref: ${decoded.ref}`);
        console.log(`   - Role: ${decoded.role}`);
        console.log(`   - Expires: ${exp.toISOString()}`);
        if (exp < now) {
            console.log(`   ❌ TOKEN IS EXPIRED!`);
        } else {
            console.log(`   ✓ Token is valid`);
        }
    } else {
        console.log('   ❌ Failed to decode token');
    }

    console.log('\n2. Testing Supabase URL...');
    const healthCheck = await testConnection(`${SUPABASE_URL}/rest/v1/`);
    if (healthCheck.error) {
        console.log(`   ❌ Connection failed: ${healthCheck.error}`);
    } else {
        console.log(`   ✓ URL is reachable (Status: ${healthCheck.status})`);
    }

    console.log('\n3. Testing Database Connection...');
    const dbTest = await testConnection(`${SUPABASE_URL}/rest/v1/organizations?limit=1`, {
        headers: {
            'apikey': ANON_KEY,
            'Authorization': `Bearer ${ANON_KEY}`
        }
    });
    
    if (dbTest.error) {
        console.log(`   ❌ Database error: ${dbTest.error}`);
    } else if (dbTest.status === 401) {
        console.log(`   ❌ Authentication failed - API key invalid`);
    } else if (dbTest.status === 404) {
        console.log(`   ⚠️  Table 'organizations' not found`);
    } else if (dbTest.status === 200) {
        console.log(`   ✓ Database connection successful`);
    } else {
        console.log(`   ⚠️  Unexpected status: ${dbTest.status}`);
        console.log(`   Response: ${dbTest.data.substring(0, 200)}`);
    }

    console.log('\n4. Testing Edge Functions...');
    
    // Test Claude function
    const claudeTest = await testConnection(`${SUPABASE_URL}/functions/v1/claude-chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ANON_KEY}`
        },
        body: JSON.stringify({ prompt: 'test' })
    });
    
    if (claudeTest.error) {
        console.log(`   ❌ Claude function error: ${claudeTest.error}`);
    } else if (claudeTest.status === 404) {
        console.log(`   ❌ Claude function not deployed`);
    } else if (claudeTest.status === 401) {
        console.log(`   ❌ Claude function auth failed`);
    } else if (claudeTest.status === 200) {
        console.log(`   ✓ Claude function exists`);
    } else {
        console.log(`   ⚠️  Claude function status: ${claudeTest.status}`);
    }

    // Test Monitoring function
    const monitorTest = await testConnection(`${SUPABASE_URL}/functions/v1/monitor-intelligence`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ANON_KEY}`
        },
        body: JSON.stringify({ action: 'getStatus', organizationId: 'test' })
    });
    
    if (monitorTest.error) {
        console.log(`   ❌ Monitor function error: ${monitorTest.error}`);
    } else if (monitorTest.status === 404) {
        console.log(`   ❌ Monitor function not deployed`);
    } else if (monitorTest.status === 401) {
        console.log(`   ❌ Monitor function auth failed`);
    } else if (monitorTest.status === 200) {
        console.log(`   ✓ Monitor function exists`);
    } else {
        console.log(`   ⚠️  Monitor function status: ${monitorTest.status}`);
    }

    console.log('\n5. DIAGNOSIS SUMMARY:');
    console.log('=====================');
    
    if (healthCheck.error || dbTest.status === 401) {
        console.log('❌ CRITICAL: Your Supabase project or API key is invalid!');
        console.log('\nPOSSIBLE CAUSES:');
        console.log('1. The Supabase project no longer exists');
        console.log('2. The API key was regenerated');
        console.log('3. The project URL is incorrect');
        console.log('\nTO FIX:');
        console.log('1. Go to https://app.supabase.com/projects');
        console.log('2. Find your project or create a new one');
        console.log('3. Go to Settings > API');
        console.log('4. Copy the correct URL and anon key');
        console.log('5. Update your .env files');
    } else if (claudeTest.status === 404 || monitorTest.status === 404) {
        console.log('⚠️  Edge Functions not deployed');
        console.log('\nTO FIX:');
        console.log('1. Install Supabase CLI: brew install supabase/tap/supabase');
        console.log('2. Login: supabase login');
        console.log('3. Link project: supabase link --project-ref zskaxjtyuaqazydouifp');
        console.log('4. Deploy functions:');
        console.log('   supabase functions deploy claude-chat');
        console.log('   supabase functions deploy monitor-intelligence');
    } else if (dbTest.status === 404) {
        console.log('⚠️  Database tables missing');
        console.log('\nTO FIX:');
        console.log('1. Run the SQL setup script in Supabase dashboard');
        console.log('2. Or use: supabase db push');
    } else {
        console.log('✅ Everything should be working!');
    }
}

diagnose().catch(console.error);