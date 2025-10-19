#!/bin/bash

echo "🔧 Testing SignalDesk Login and Claude Integration"
echo "=================================================="
echo ""

API_URL="https://signaldesk-production.up.railway.app/api"

# Test 1: Backend Health
echo "1. Testing Backend Health..."
curl -s https://signaldesk-production.up.railway.app/ | python3 -c "import sys, json; data=json.load(sys.stdin); print('✅ Backend is running!' if data.get('status')=='operational' else '❌ Backend issue')"
echo ""

# Test 2: Login
echo "2. Testing Login with demo@signaldesk.com..."
LOGIN_RESPONSE=$(curl -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@signaldesk.com","password":"Demo123"}' \
  -s)

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    echo "✅ Login successful!"
    TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")
    echo "Token obtained: ${TOKEN:0:20}..."
    echo ""
    
    # Test 3: Test a Claude endpoint
    echo "3. Testing Crisis Management with Claude..."
    CRISIS_RESPONSE=$(curl -X POST $API_URL/crisis/generate-plan \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d '{"situation":"Product recall needed","severity":"high"}' \
      -s)
    
    if echo "$CRISIS_RESPONSE" | grep -q "error"; then
        echo "❌ Crisis endpoint error:"
        echo "$CRISIS_RESPONSE" | python3 -m json.tool
    else
        echo "✅ Crisis response received!"
        # Check if it's mock data or real Claude
        if echo "$CRISIS_RESPONSE" | grep -qi "mock\|sample\|placeholder"; then
            echo "⚠️  Response appears to be MOCK DATA (not Claude)"
        else
            echo "🎉 Response appears to be from CLAUDE AI!"
        fi
        echo ""
        echo "Response preview:"
        echo "$CRISIS_RESPONSE" | python3 -m json.tool | head -20
    fi
else
    echo "❌ Login failed!"
    echo "$LOGIN_RESPONSE" | python3 -m json.tool
    echo ""
    echo "⚠️  To fix login, run this SQL in your Railway PostgreSQL:"
    echo ""
    echo "INSERT INTO users (name, email, password_hash, created_at, updated_at)"
    echo "VALUES ('Demo User', 'demo@signaldesk.com',"
    echo "        '\$2a\$10\$76FMC6IpkWV6gkQaGuOmEOMw7UibAur06xJs5j6EhzV8FcUtLKSL6',"
    echo "        NOW(), NOW())"
    echo "ON CONFLICT (email) DO UPDATE SET"
    echo "  password_hash = '\$2a\$10\$76FMC6IpkWV6gkQaGuOmEOMw7UibAur06xJs5j6EhzV8FcUtLKSL6';"
fi