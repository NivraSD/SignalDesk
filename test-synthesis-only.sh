#!/bin/bash

echo "🧪 Testing ONLY Executive Synthesis (lightweight test)"
echo "====================================================="
echo ""

# This tests ONLY the synthesis function with minimal data
# Won't trigger the full pipeline that crashes VS

SUPABASE_URL="https://zskaxjtyuaqazydouifp.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8"

echo "Testing if Executive Synthesis can use Anthropic API..."
echo ""

# Minimal test payload - just enough to trigger synthesis
curl -X POST "$SUPABASE_URL/functions/v1/mcp-executive-synthesis" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ANON_KEY" \
  -d '{
    "tool": "synthesize_executive_intelligence",
    "arguments": {
      "enriched_data": {
        "extracted_data": {
          "events": {
            "funding": [{"title": "Test funding event", "amount": "$10M"}]
          },
          "entities": {
            "companies": ["TestCorp", "CompetitorX", "PartnerY"],
            "executives": ["John CEO", "Jane CTO"]
          },
          "topics": {
            "trending": [{"topic": "AI regulation", "mentions": 5}]
          }
        },
        "statistics": {
          "total_events": 1,
          "total_entities": 5,
          "total_topics": 1
        }
      },
      "organization": {
        "name": "TestOrg",
        "industry": "Technology"
      },
      "analysis_depth": "competitive_stakeholder",
      "synthesis_focus": ["competitive_dynamics", "stakeholder_intelligence"]
    }
  }' 2>/dev/null | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'error' in data:
        print('❌ SYNTHESIS FAILED:', data.get('error', 'Unknown error'))
        if 'API' in str(data.get('error', '')):
            print('   → Likely API key issue')
    elif data.get('success'):
        synthesis = data.get('synthesis', {})
        if synthesis.get('competitive_dynamics'):
            print('✅ SYNTHESIS WORKING! Claude API is functional')
            print('   → Found competitive dynamics data')
        else:
            print('⚠️  Synthesis returned but empty')
    else:
        print('❓ Unexpected response:', str(data)[:100])
except Exception as e:
    print('❌ Failed to parse response:', str(e))
    print('   Raw output:', sys.stdin.read()[:200])
"

echo ""
echo "====================================================="
echo "This test ONLY checks if synthesis can reach Claude API"
echo "It won't crash VS because it's a single lightweight call"