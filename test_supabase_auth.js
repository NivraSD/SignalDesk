/**
 * Supabase Authentication Test Script
 * Tests authentication directly against your Supabase instance
 */

const https = require('https');

// Configuration
const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'YOUR_ANON_KEY_HERE';

// Test credentials
const TEST_EMAIL = 'admin@signaldesk.com';
const TEST_PASSWORD = 'admin123';

/**
 * Make HTTPS request to Supabase
 */
function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let body = '';
            
            res.on('data', (chunk) => {
                body += chunk;
            });
            
            res.on('end', () => {
                const response = {
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: body
                };
                
                try {
                    response.data = JSON.parse(body);
                } catch (e) {
                    response.data = body;
                }
                
                resolve(response);
            });
        });
        
        req.on('error', reject);
        
        if (data) {
            req.write(data);
        }
        
        req.end();
    });
}

/**
 * Test 1: Check Supabase health
 */
async function testHealth() {
    console.log('\n=== TEST 1: Checking Supabase Health ===');
    
    try {
        const url = new URL(`${SUPABASE_URL}/auth/v1/health`);
        const options = {
            hostname: url.hostname,
            path: url.pathname,
            method: 'GET',
            headers: {
                'apikey': SUPABASE_ANON_KEY
            }
        };
        
        const response = await makeRequest(options);
        console.log(`Status: ${response.statusCode}`);
        console.log('Response:', response.data);
        
        return response.statusCode === 200;
    } catch (error) {
        console.error('Health check failed:', error.message);
        return false;
    }
}

/**
 * Test 2: Attempt password-based authentication
 */
async function testPasswordAuth() {
    console.log('\n=== TEST 2: Testing Password Authentication ===');
    console.log(`Email: ${TEST_EMAIL}`);
    console.log(`Password: ${TEST_PASSWORD}`);
    
    try {
        const url = new URL(`${SUPABASE_URL}/auth/v1/token?grant_type=password`);
        const data = JSON.stringify({
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
            gotrue_meta_security: {}
        });
        
        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length,
                'apikey': SUPABASE_ANON_KEY
            }
        };
        
        const response = await makeRequest(options, data);
        console.log(`Status: ${response.statusCode}`);
        
        if (response.statusCode === 200) {
            console.log('SUCCESS! Authentication worked!');
            console.log('Access Token:', response.data.access_token ? 'Present' : 'Missing');
            console.log('Refresh Token:', response.data.refresh_token ? 'Present' : 'Missing');
            console.log('User ID:', response.data.user?.id);
            console.log('User Email:', response.data.user?.email);
        } else {
            console.log('FAILED! Error details:');
            console.log(JSON.stringify(response.data, null, 2));
        }
        
        return response;
    } catch (error) {
        console.error('Authentication test failed:', error.message);
        console.error('Stack:', error.stack);
        return null;
    }
}

/**
 * Test 3: Try signup to check if auth endpoints work
 */
async function testSignup() {
    console.log('\n=== TEST 3: Testing Signup Endpoint ===');
    
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    console.log(`Test Email: ${testEmail}`);
    console.log(`Test Password: ${testPassword}`);
    
    try {
        const url = new URL(`${SUPABASE_URL}/auth/v1/signup`);
        const data = JSON.stringify({
            email: testEmail,
            password: testPassword,
            gotrue_meta_security: {}
        });
        
        const options = {
            hostname: url.hostname,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length,
                'apikey': SUPABASE_ANON_KEY
            }
        };
        
        const response = await makeRequest(options, data);
        console.log(`Status: ${response.statusCode}`);
        
        if (response.statusCode === 200 || response.statusCode === 201) {
            console.log('Signup endpoint is working!');
            console.log('User created:', response.data.user?.email);
        } else {
            console.log('Signup failed with error:');
            console.log(JSON.stringify(response.data, null, 2));
        }
        
        return response;
    } catch (error) {
        console.error('Signup test failed:', error.message);
        return null;
    }
}

/**
 * Test 4: Direct database connection test (if we had direct access)
 */
function printDatabaseInstructions() {
    console.log('\n=== DATABASE FIX INSTRUCTIONS ===');
    console.log('1. Go to your Supabase dashboard: https://app.supabase.com');
    console.log('2. Navigate to the SQL Editor');
    console.log('3. Run the fix_auth_schema.sql script created in this directory');
    console.log('4. Run each section one by one and check for errors');
    console.log('5. Pay special attention to:');
    console.log('   - Section 1: Diagnostic results');
    console.log('   - Section 2: Extension installation');
    console.log('   - Section 3-4: Permission and function creation');
    console.log('   - Section 11: Final verification');
    console.log('\nIf the standard fixes don\'t work:');
    console.log('6. Uncomment Section 12 (Emergency Reset) and run it');
    console.log('   WARNING: This will delete all existing users!');
}

/**
 * Main test runner
 */
async function runTests() {
    console.log('========================================');
    console.log('Supabase Authentication Diagnostic Tool');
    console.log('========================================');
    console.log(`Supabase URL: ${SUPABASE_URL}`);
    console.log(`Anon Key: ${SUPABASE_ANON_KEY === 'YOUR_ANON_KEY_HERE' ? 'NOT SET - Please update!' : 'Set'}`);
    
    if (SUPABASE_ANON_KEY === 'YOUR_ANON_KEY_HERE') {
        console.log('\n!!! ERROR: Please set your Supabase anon key in this script or as SUPABASE_ANON_KEY environment variable');
        console.log('You can find it in your Supabase dashboard under Settings > API');
        return;
    }
    
    // Run tests
    const healthOk = await testHealth();
    
    if (!healthOk) {
        console.log('\n!!! Auth service health check failed. There might be a service issue.');
    }
    
    const authResponse = await testPasswordAuth();
    
    if (!authResponse || authResponse.statusCode !== 200) {
        console.log('\n=== DIAGNOSIS ===');
        
        if (authResponse?.statusCode === 500 && authResponse?.data?.msg === 'Database error querying schema') {
            console.log('The "Database error querying schema" indicates a problem with the auth schema structure.');
            console.log('This is typically caused by:');
            console.log('1. Missing or corrupted auth schema tables');
            console.log('2. Missing required PostgreSQL extensions');
            console.log('3. Incorrect permissions on auth schema objects');
            console.log('4. Missing or corrupted auth functions');
            
            // Try signup to see if it's just login that's broken
            await testSignup();
        } else if (authResponse?.statusCode === 400) {
            console.log('Bad request - check if the credentials format is correct');
        } else if (authResponse?.statusCode === 401) {
            console.log('Unauthorized - credentials are wrong but auth is working');
        }
        
        printDatabaseInstructions();
    } else {
        console.log('\n=== SUCCESS ===');
        console.log('Authentication is working correctly!');
        console.log('You can now use these credentials in your application.');
    }
    
    console.log('\n========================================');
    console.log('Test completed');
    console.log('========================================');
}

// Run the tests
runTests().catch(console.error);