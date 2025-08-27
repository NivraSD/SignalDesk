#!/bin/bash

SUPABASE_URL="https://zskaxjtyuaqazydouifp.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0"

echo "🔍 Testing Edge Functions Directly"
echo "===================================="

# Test 1: Simple health check
echo -e "\n📡 Test 1: Testing intelligence-persistence function..."
curl -i -X POST "$SUPABASE_URL/functions/v1/intelligence-persistence" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "apikey: $SUPABASE_KEY" \
  -d '{"action": "test"}' \
  --max-time 10 2>&1 | head -20

# Test 2: Test Stage 1 with minimal data
echo -e "\n📡 Test 2: Testing Stage 1 with minimal data..."
RESPONSE=$(curl -s -X POST "$SUPABASE_URL/functions/v1/intelligence-stage-1-competitors" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "apikey: $SUPABASE_KEY" \
  -d '{
    "organization": {
      "name": "TestCompany",
      "industry": "technology"
    },
    "competitors": ["Competitor1"]
  }' \
  --max-time 15)

# Check if response is JSON or HTML
if echo "$RESPONSE" | head -1 | grep -q "^{"; then
  echo "✅ Got JSON response:"
  echo "$RESPONSE" | jq '.' 2>/dev/null | head -20
else
  echo "❌ Got non-JSON response (likely HTML):"
  echo "$RESPONSE" | head -5
  echo ""
  echo "Checking response headers..."
  curl -I -X POST "$SUPABASE_URL/functions/v1/intelligence-stage-1-competitors" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "apikey: $SUPABASE_KEY" 2>&1 | grep -E "HTTP|content-type|location"
fi

# Test 3: Check if functions are deployed
echo -e "\n📡 Test 3: Checking function deployment status..."
supabase functions list 2>/dev/null | grep -E "intelligence-stage-1|intelligence-persistence" | head -5

echo -e "\n===================================="
echo "Troubleshooting Guide:"
echo "----------------------"
echo "If getting HTML responses:"
echo "1. Functions may need redeployment:"
echo "   supabase functions deploy intelligence-stage-1-competitors --no-verify-jwt"
echo "   supabase functions deploy intelligence-persistence --no-verify-jwt"
echo ""
echo "2. Check Supabase dashboard:"
echo "   - Go to Functions section"
echo "   - Check if functions show as 'Active'"
echo "   - Look at function logs for errors"
echo ""
echo "3. Verify API keys:"
echo "   - Ensure SUPABASE_SERVICE_ROLE_KEY is set in edge function secrets"
echo "   - Check if anon key is still valid"