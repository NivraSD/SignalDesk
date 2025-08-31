#!/bin/bash

echo "🔍 Testing Synthesis Stage with Debug Output"
echo "==========================================="
echo ""

AUTH="Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8"
BASE_URL="https://zskaxjtyuaqazydouifp.supabase.co/functions/v1"

# Create minimal test data
TEST_DATA=$(cat <<'JSON'
{
  "organization": {
    "name": "OpenAI",
    "industry": "AI/ML"
  },
  "previousResults": {
    "competitive": {
      "data": {
        "competitors": {
          "direct": [
            {"name": "Anthropic", "threat_level": "high", "recent_moves": ["Released Claude 3"]}
          ]
        }
      }
    }
  }
}
JSON
)

echo "Calling synthesis stage..."
echo ""

# Call with verbose output
RESPONSE=$(curl -v -X POST "$BASE_URL/intelligence-stage-5-synthesis" \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -d "$TEST_DATA" \
  --max-time 35 2>&1)

echo "$RESPONSE"
echo ""
echo "Extracting JSON response..."
echo "$RESPONSE" | grep -A 1000 '"success"' | jq '.' 2>/dev/null || echo "Could not parse JSON"

echo ""
echo "Check Supabase logs at:"
echo "https://supabase.com/dashboard/project/zskaxjtyuaqazydouifp/functions/intelligence-stage-5-synthesis/logs"