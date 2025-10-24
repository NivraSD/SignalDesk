#!/bin/bash

# Test the opportunity detection pipeline
# This simulates what happens when the intelligence pipeline runs

echo "🧪 Testing Opportunity Detection Pipeline V2"
echo "=============================================="
echo ""

SUPABASE_URL="https://zskaxjtyuaqazydouifp.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8"

# Sample enriched data with realistic events
PAYLOAD='{
  "organization_id": "test-org-123",
  "organization_name": "Tesla",
  "profile": {
    "name": "Tesla",
    "industry": "Electric Vehicles",
    "strengths": ["Innovation", "Brand Recognition", "Technology Leadership"]
  },
  "enriched_data": {
    "extracted_data": {
      "events": [
        {
          "type": "PRODUCT_LAUNCH",
          "entity": "Tesla",
          "description": "Tesla announces new Model 3 Highland variant with improved range and features",
          "date": "2025-10-20T00:00:00Z",
          "relevance_score": 95
        },
        {
          "type": "COMPETITIVE",
          "entity": "Ford",
          "description": "Ford recalls 50,000 EVs due to battery safety concerns",
          "date": "2025-10-19T00:00:00Z",
          "relevance_score": 85
        },
        {
          "type": "MARKET",
          "entity": "EV Market",
          "description": "EV sales surge 40% year-over-year in Q3",
          "date": "2025-10-18T00:00:00Z",
          "relevance_score": 80
        }
      ],
      "entities": [
        {"name": "Tesla", "type": "ORGANIZATION", "total_mentions": 45},
        {"name": "Ford", "type": "ORGANIZATION", "total_mentions": 12},
        {"name": "Elon Musk", "type": "PERSON", "total_mentions": 23}
      ],
      "topics": [
        {"name": "Electric Vehicles", "count": 30},
        {"name": "Battery Technology", "count": 15}
      ],
      "quotes": []
    }
  }
}'

echo "📤 Sending request to mcp-opportunity-detector..."
echo "Organization: Tesla"
echo "Events: 3"
echo ""

# Call the edge function
RESPONSE=$(curl -s -X POST \
  "${SUPABASE_URL}/functions/v1/mcp-opportunity-detector" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

# Check if response is valid JSON
if echo "$RESPONSE" | jq . >/dev/null 2>&1; then
  echo "✅ Received valid JSON response"
  echo ""

  # Extract key metrics
  SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
  V2_COUNT=$(echo "$RESPONSE" | jq -r '.metadata.total_v2 // 0')
  CONTENT_COUNT=$(echo "$RESPONSE" | jq -r '.metadata.total_content_items // 0')

  echo "📊 Results:"
  echo "  Success: $SUCCESS"
  echo "  V2 Opportunities: $V2_COUNT"
  echo "  Total Content Items: $CONTENT_COUNT"
  echo ""

  if [ "$V2_COUNT" -gt 0 ]; then
    echo "🎯 Sample V2 Opportunity:"
    echo "$RESPONSE" | jq '.opportunitiesV2[0] | {title, score, urgency, stakeholder_count: .execution_plan.stakeholder_campaigns | length}'
    echo ""
    echo "✅ Test PASSED - V2 opportunities generated successfully!"
  else
    echo "⚠️  No opportunities detected (this might be okay if the data is insufficient)"
  fi
else
  echo "❌ Test FAILED - Invalid response or error:"
  echo "$RESPONSE"
fi
