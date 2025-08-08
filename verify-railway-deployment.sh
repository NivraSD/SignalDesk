#!/bin/bash

# Railway backend URL
API_URL="https://signaldesk-api-production.up.railway.app"

echo "========================================="
echo "Railway Deployment Verification"
echo "========================================="
echo ""

# Test 1: Check if server is running
echo "1. Testing server health..."
health_response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$API_URL/api/health" 2>/dev/null)
http_status=$(echo "$health_response" | grep "HTTP_STATUS" | cut -d: -f2)

if [ "$http_status" = "200" ]; then
    echo "✅ Server is healthy (HTTP 200)"
else
    echo "❌ Server health check failed (HTTP $http_status)"
fi

# Test 2: Check root endpoint
echo ""
echo "2. Testing root endpoint..."
root_response=$(curl -s "$API_URL/" 2>/dev/null | head -100)

if echo "$root_response" | grep -q "SignalDesk Platform API"; then
    echo "✅ Using correct server.js (SignalDesk Platform API found)"
    echo "$root_response" | grep -E "(version|status|database|monitoring)" | head -5
else
    echo "❌ Still using old index.js or server not responding"
    echo "Response: $root_response" | head -3
fi

# Test 3: Check Node version from headers
echo ""
echo "3. Checking server headers..."
headers=$(curl -sI "$API_URL/" 2>/dev/null)
echo "$headers" | grep -E "(x-powered-by|server)" | head -3

# Test 4: Test API endpoints
echo ""
echo "4. Testing API endpoints..."

# Test Claude diagnostics
diag_response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/claude-diagnostics/config" 2>/dev/null)
if [ "$diag_response" = "200" ]; then
    echo "✅ Claude diagnostics endpoint: Working"
else
    echo "❌ Claude diagnostics endpoint: Failed (HTTP $diag_response)"
fi

# Test Campaign Intelligence
campaign_response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/api/campaigns/analyze" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer test" \
    -d '{"industry":"test"}' 2>/dev/null)
    
if [ "$campaign_response" = "200" ] || [ "$campaign_response" = "401" ] || [ "$campaign_response" = "403" ]; then
    echo "✅ Campaign Intelligence endpoint: Available (HTTP $campaign_response)"
else
    echo "❌ Campaign Intelligence endpoint: Not found (HTTP $campaign_response)"
fi

# Test Opportunity Engine
opportunity_response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/api/opportunity/analyze" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer test" \
    -d '{"industry":"test"}' 2>/dev/null)
    
if [ "$opportunity_response" = "200" ] || [ "$opportunity_response" = "401" ] || [ "$opportunity_response" = "403" ]; then
    echo "✅ Opportunity Engine endpoint: Available (HTTP $opportunity_response)"
else
    echo "❌ Opportunity Engine endpoint: Not found (HTTP $opportunity_response)"
fi

# Test Media List Builder
media_response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/api/media/discover" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer test" \
    -d '{"industry":"test"}' 2>/dev/null)
    
if [ "$media_response" = "200" ] || [ "$media_response" = "401" ] || [ "$media_response" = "403" ]; then
    echo "✅ Media List Builder endpoint: Available (HTTP $media_response)"
else
    echo "❌ Media List Builder endpoint: Not found (HTTP $media_response)"
fi

echo ""
echo "========================================="
echo "Deployment verification complete!"
echo "========================================="
echo ""
echo "Next steps if issues persist:"
echo "1. Check Railway logs at https://railway.app/dashboard"
echo "2. Verify environment variables are set correctly"
echo "3. Check if deployment is complete (may take 2-5 minutes)"
echo "4. If using old entry point, manually set start command in Railway"