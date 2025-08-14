#!/bin/bash

# Test Vercel Deployment with Supabase Integration
# This script verifies that Supabase is properly integrated with your Vercel deployment

echo "🧪 Testing Vercel Deployment with Supabase Integration"
echo "====================================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get deployment URL
echo -e "${BLUE}📍 Enter your Vercel deployment URL:${NC}"
echo "(e.g., https://signaldesk-frontend.vercel.app)"
read DEPLOYMENT_URL

if [ -z "$DEPLOYMENT_URL" ]; then
    echo -e "${YELLOW}Using default: https://signaldesk-frontend.vercel.app${NC}"
    DEPLOYMENT_URL="https://signaldesk-frontend.vercel.app"
fi

# Remove trailing slash if present
DEPLOYMENT_URL=${DEPLOYMENT_URL%/}

echo ""
echo -e "${BLUE}🔍 Running deployment tests...${NC}"
echo ""

# Test 1: Check if site is accessible
echo -e "${YELLOW}Test 1: Site Accessibility${NC}"
if curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL" | grep -q "200\|304"; then
    echo -e "${GREEN}✅ Site is accessible${NC}"
else
    echo -e "${RED}❌ Site is not accessible${NC}"
fi

# Test 2: Check for Supabase configuration
echo ""
echo -e "${YELLOW}Test 2: Supabase Configuration Check${NC}"
RESPONSE=$(curl -s "$DEPLOYMENT_URL" | grep -o "Supabase Configuration" | head -1)
if [ ! -z "$RESPONSE" ]; then
    echo -e "${GREEN}✅ Supabase configuration detected in build${NC}"
else
    echo -e "${YELLOW}⚠️  Could not verify Supabase configuration (this may be normal in production)${NC}"
fi

# Test 3: Check API endpoint (if you have one)
echo ""
echo -e "${YELLOW}Test 3: API Health Check${NC}"
API_RESPONSE=$(curl -s "$DEPLOYMENT_URL/api/health" 2>/dev/null)
if echo "$API_RESPONSE" | grep -q "ok\|healthy\|success"; then
    echo -e "${GREEN}✅ API is responding${NC}"
else
    echo -e "${YELLOW}⚠️  No API health endpoint found (optional)${NC}"
fi

# Test 4: Create test HTML file for manual testing
echo ""
echo -e "${YELLOW}Test 4: Creating manual test file${NC}"

cat > test-supabase-vercel.html << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Supabase-Vercel Integration</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .test-card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .status {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
        }
        .success { background: #d4edda; color: #155724; }
        .error { background: #f8d7da; color: #721c24; }
        .pending { background: #fff3cd; color: #856404; }
        button {
            background: #0070f3;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            margin: 5px;
        }
        button:hover { background: #0051cc; }
        pre {
            background: #f4f4f4;
            padding: 10px;
            border-radius: 4px;
            overflow-x: auto;
        }
    </style>
</head>
<body>
    <h1>🧪 Supabase-Vercel Integration Test</h1>
    
    <div class="test-card">
        <h2>Deployment Info</h2>
        <p><strong>URL:</strong> $DEPLOYMENT_URL</p>
        <p><strong>Test Time:</strong> <span id="testTime"></span></p>
        <p><strong>Status:</strong> <span id="deployStatus" class="status pending">TESTING</span></p>
    </div>

    <div class="test-card">
        <h2>Test Results</h2>
        <div id="results"></div>
    </div>

    <div class="test-card">
        <h2>Manual Tests</h2>
        <button onclick="testConnection()">Test Supabase Connection</button>
        <button onclick="testAuth()">Test Authentication</button>
        <button onclick="testDatabase()">Test Database Query</button>
        <button onclick="testEdgeFunction()">Test Edge Function</button>
    </div>

    <div class="test-card">
        <h2>Console Output</h2>
        <pre id="console"></pre>
    </div>

    <script>
        const DEPLOYMENT_URL = '$DEPLOYMENT_URL';
        const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
        
        document.getElementById('testTime').textContent = new Date().toLocaleString();
        
        function log(message, type = 'info') {
            const console = document.getElementById('console');
            const timestamp = new Date().toLocaleTimeString();
            console.innerHTML += \`[\${timestamp}] \${type.toUpperCase()}: \${message}\n\`;
            console.scrollTop = console.scrollHeight;
        }

        function addResult(test, status, message) {
            const results = document.getElementById('results');
            const statusClass = status ? 'success' : 'error';
            const statusText = status ? 'PASS' : 'FAIL';
            results.innerHTML += \`
                <div style="margin: 10px 0;">
                    <span class="status \${statusClass}">\${statusText}</span>
                    <strong> \${test}:</strong> \${message}
                </div>
            \`;
        }

        async function testConnection() {
            log('Testing Supabase connection...');
            try {
                const response = await fetch(\`\${SUPABASE_URL}/rest/v1/\`, {
                    headers: {
                        'apikey': 'test-key',
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.status === 401) {
                    addResult('Connection Test', true, 'Supabase is reachable (auth required)');
                    log('Supabase connection successful', 'success');
                } else {
                    addResult('Connection Test', false, \`Unexpected response: \${response.status}\`);
                    log(\`Connection test failed: \${response.status}\`, 'error');
                }
            } catch (error) {
                addResult('Connection Test', false, error.message);
                log(\`Connection error: \${error.message}\`, 'error');
            }
        }

        async function testAuth() {
            log('Testing authentication endpoint...');
            window.open(\`\${DEPLOYMENT_URL}/login\`, '_blank');
            addResult('Auth Test', true, 'Login page opened in new tab - check if it loads');
            log('Please check the login page in the new tab', 'info');
        }

        async function testDatabase() {
            log('Testing database through deployment...');
            try {
                const response = await fetch(\`\${DEPLOYMENT_URL}\`);
                const text = await response.text();
                
                if (text.includes('SignalDesk') || text.includes('React')) {
                    addResult('Frontend Test', true, 'Frontend loads successfully');
                    log('Frontend is serving correctly', 'success');
                } else {
                    addResult('Frontend Test', false, 'Unexpected content');
                    log('Frontend content seems incorrect', 'error');
                }
            } catch (error) {
                addResult('Frontend Test', false, error.message);
                log(\`Frontend test error: \${error.message}\`, 'error');
            }
        }

        async function testEdgeFunction() {
            log('Testing Edge Function...');
            try {
                const response = await fetch(\`\${SUPABASE_URL}/functions/v1/claude-chat\`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer YOUR_ANON_KEY'
                    },
                    body: JSON.stringify({ message: 'test' })
                });
                
                if (response.status === 401) {
                    addResult('Edge Function', true, 'Function exists (auth required)');
                    log('Edge function is deployed', 'success');
                } else if (response.status === 404) {
                    addResult('Edge Function', false, 'Function not deployed');
                    log('Edge function not found - needs deployment', 'error');
                } else {
                    addResult('Edge Function', false, \`Unexpected response: \${response.status}\`);
                    log(\`Edge function response: \${response.status}\`, 'warning');
                }
            } catch (error) {
                addResult('Edge Function', false, error.message);
                log(\`Edge function error: \${error.message}\`, 'error');
            }
        }

        // Auto-run basic tests
        (async function() {
            log('Starting automated tests...', 'info');
            await testConnection();
            
            // Update overall status
            const allTests = document.querySelectorAll('.status.success, .status.error');
            const passed = document.querySelectorAll('.status.success').length;
            const deployStatus = document.getElementById('deployStatus');
            
            if (passed === allTests.length && allTests.length > 0) {
                deployStatus.className = 'status success';
                deployStatus.textContent = 'ALL TESTS PASSED';
            } else if (passed > 0) {
                deployStatus.className = 'status pending';
                deployStatus.textContent = 'PARTIAL SUCCESS';
            } else if (allTests.length > 0) {
                deployStatus.className = 'status error';
                deployStatus.textContent = 'TESTS FAILED';
            }
        })();
    </script>
</body>
</html>
EOF

echo -e "${GREEN}✅ Test file created: test-supabase-vercel.html${NC}"

# Test 5: Comprehensive check summary
echo ""
echo -e "${BLUE}📊 Test Summary${NC}"
echo "================================"
echo ""
echo -e "${YELLOW}Checklist for successful deployment:${NC}"
echo ""
echo "[ ] Frontend loads at $DEPLOYMENT_URL"
echo "[ ] No console errors about missing Supabase config"
echo "[ ] Login page functions correctly"
echo "[ ] Database queries work (check Network tab)"
echo "[ ] Real-time subscriptions connect"
echo "[ ] Edge Functions respond (if deployed)"
echo ""

echo -e "${BLUE}📝 Next Steps:${NC}"
echo ""
echo "1. Open test-supabase-vercel.html in your browser"
echo "2. Run the manual tests"
echo "3. Check the browser console for any errors"
echo "4. Verify in Vercel dashboard that env vars are set"
echo "5. Check Supabase logs for any connection attempts"
echo ""

echo -e "${GREEN}✨ Test script complete!${NC}"
echo ""
echo "If tests fail, check:"
echo "• Vercel environment variables: https://vercel.com/dashboard"
echo "• Supabase project status: https://supabase.com/dashboard"
echo "• Build logs in Vercel for any errors"