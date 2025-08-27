#!/bin/bash

# Test Stage 4 directly with proper Supabase service role key
echo "🎯 Testing Stage 4 (Trends) - Simplified Claude-only version"
echo "================================================"

# Use the service role key for testing
SUPABASE_URL="https://zskaxjtyuaqazydouifp.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTc3OTkyOCwiZXhwIjoyMDUxMzU1OTI4fQ.QKKcrXmIcK7lKOTQP6lfulQGTIMYLgNFqSMbctZ7gzI"

# Test data
TEST_DATA='{
  "organization": {
    "name": "test-org",
    "industry": "Technology",
    "market_position": "Emerging leader",
    "competitors": ["Competitor1", "Competitor2"],
    "differentiators": ["AI-powered", "Real-time analytics"]
  },
  "previousResults": {
    "stage1": {
      "competitive_landscape": {
        "main_competitors": ["Competitor1", "Competitor2"],
        "market_share": {"test-org": 15, "Competitor1": 35, "Competitor2": 25}
      }
    },
    "stage2": {
      "media_coverage": {
        "sentiment": "positive",
        "trending_topics": ["AI innovation", "Market expansion"]
      }
    },
    "stage3": {
      "regulatory_landscape": {
        "compliance_status": "compliant",
        "upcoming_regulations": ["Data Privacy Act 2025"]
      }
    }
  }
}'

echo "📊 Sending request to Stage 4..."
START_TIME=$(date +%s)

# Make the request with timeout
response=$(curl -X POST "$SUPABASE_URL/functions/v1/intelligence-stage-4-trends" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "$TEST_DATA" \
  --max-time 30 \
  -s -w "\nHTTP_STATUS:%{http_code}")

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# Extract HTTP status
HTTP_STATUS=$(echo "$response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
BODY=$(echo "$response" | sed 's/HTTP_STATUS:.*//')

echo "⏱️  Response time: ${DURATION} seconds"
echo "📡 HTTP Status: $HTTP_STATUS"
echo ""

if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ SUCCESS! Stage 4 completed without timeout"
  echo ""
  echo "Response:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
  
  # Check if it has Claude analysis
  if echo "$BODY" | grep -q "claude_enhanced"; then
    echo ""
    echo "✨ Claude analysis confirmed in response!"
  fi
else
  echo "❌ Failed with status $HTTP_STATUS"
  echo "Response body:"
  echo "$BODY"
fi

echo ""
echo "================================================"
echo "Test complete. The simplified Stage 4 should complete in under 10 seconds."