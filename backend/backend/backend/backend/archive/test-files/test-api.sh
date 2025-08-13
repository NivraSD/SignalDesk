#\!/bin/bash

echo "Testing SignalDesk Backend API..."
echo "================================"

# Test health check
echo -e "\n1. Testing Health Check..."
curl -s http://localhost:5001/health | jq '.'

# Test login
echo -e "\n2. Testing Login..."
TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@signaldesk.com","password":"password"}' | jq -r '.token')
echo "Token received: ${TOKEN:0:20}..."

# Test auth verify
echo -e "\n3. Testing Auth Verify..."
curl -s http://localhost:5001/api/auth/verify \
  -H "Authorization: Bearer $TOKEN" | jq '.user'

# Test monitoring status
echo -e "\n4. Testing Monitoring Status..."
curl -s http://localhost:5001/api/intelligence/monitor/status/org-demo-123 | jq '.'

# Test get targets
echo -e "\n5. Testing Get Targets..."
curl -s http://localhost:5001/api/intelligence/organizations/org-demo-123/targets | jq '.[0]'

echo -e "\n✅ All tests complete\!"
