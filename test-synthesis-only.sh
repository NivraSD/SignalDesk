#!/bin/bash

echo "🧩 Testing Synthesis Stage with Mock Data"
echo "=========================================="

AUTH="Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8"
BASE_URL="https://zskaxjtyuaqazydouifp.supabase.co/functions/v1"

# Create mock data from previous stages
MOCK_DATA=$(cat <<'JSON'
{
  "organization": {"name": "TestCorp", "industry": "technology"},
  "previousResults": {
    "competitive": {
      "data": {
        "competitors": {
          "direct": [
            {"name": "CompetitorA", "threat_level": "high"}
          ]
        }
      }
    },
    "media": {
      "data": {
        "media_coverage": ["Tech news coverage", "Industry report"]
      }
    },
    "regulatory": {
      "data": {
        "issues": ["Data privacy", "Compliance"]
      }
    },
    "trends": {
      "data": {
        "current_trends": [
          {"trend": "AI adoption", "direction": "increasing"}
        ]
      }
    }
  }
}
JSON
)

echo "Sending request to synthesis stage..."
echo ""

RESPONSE=$(curl -s -X POST "$BASE_URL/intelligence-stage-5-synthesis" \
  -H "Content-Type: application/json" \
  -H "$AUTH" \
  -d "$MOCK_DATA")

echo "Response received:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

echo ""
echo "Checking for tabs structure:"
echo "$RESPONSE" | jq '{
  has_tabs: (.tabs != null),
  tab_keys: (.tabs | keys // []),
  has_opportunities: (.opportunities != null),
  opportunity_count: (.opportunities | length // 0),
  has_executive_tab: (.tabs.executive != null),
  has_competitive_tab: (.tabs.competitive != null)
}' 2>/dev/null || echo "Could not parse tabs"