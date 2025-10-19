#!/bin/bash

echo "Testing FULL Intelligence Pipeline with Data Gathering..."
echo ""

# Configuration
SUPABASE_URL="https://zskaxjtyuaqazydouifp.supabase.co"
AUTH_HEADER="Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8"

echo "=== STEP 1: Data Gathering ==="
echo "Calling intelligence-gathering function..."

GATHERING_RESULT=$(curl -s -X POST ${SUPABASE_URL}/functions/v1/intelligence-gathering \
  -H "Content-Type: application/json" \
  -H "${AUTH_HEADER}" \
  -d '{
    "organization": {
      "name": "Tesla",
      "industry": "Electric Vehicles"
    }
  }')

echo "Gathering result:"
echo "$GATHERING_RESULT" | python3 -c "import sys, json; print(json.dumps(json.loads(sys.stdin.read()), indent=2))" || echo "$GATHERING_RESULT"

echo ""
echo "=== STEP 2: Process with Intelligence Orchestrator ==="
echo "Extracting raw intelligence and calling orchestrator..."

# Extract the raw intelligence from gathering result
MONITORING_DATA=$(echo "$GATHERING_RESULT" | python3 -c "
import sys, json
try:
    data = json.loads(sys.stdin.read())
    raw_intel = data.get('raw_intelligence', {})
    
    # Collect all articles from different sources
    all_articles = []
    
    # From news-intelligence
    if 'news-intelligence' in raw_intel:
        news_data = raw_intel['news-intelligence']
        if isinstance(news_data, dict) and 'articles' in news_data:
            all_articles.extend(news_data['articles'][:50])  # Limit to 50
        elif isinstance(news_data, list):
            all_articles.extend(news_data[:50])
    
    # From google-intelligence
    if 'google-intelligence' in raw_intel:
        google_data = raw_intel['google-intelligence']
        if isinstance(google_data, dict) and 'articles' in google_data:
            all_articles.extend(google_data['articles'][:30])
        elif isinstance(google_data, list):
            all_articles.extend(google_data[:30])
    
    # From yahoo-finance-intelligence
    if 'yahoo-finance-intelligence' in raw_intel:
        yahoo_data = raw_intel['yahoo-finance-intelligence']
        if isinstance(yahoo_data, dict) and 'articles' in yahoo_data:
            all_articles.extend(yahoo_data['articles'][:30])
    
    # Create monitoring data structure
    monitoring_data = {
        'findings': all_articles[:100],  # Limit to 100 total articles
        'total_found': len(all_articles),
        'sources_used': list(raw_intel.keys())
    }
    
    print(json.dumps(monitoring_data))
    
except Exception as e:
    # Fallback - create empty monitoring data
    print(json.dumps({'findings': [], 'total_found': 0, 'sources_used': []}))
")

echo "Monitoring data extracted: $(echo "$MONITORING_DATA" | python3 -c "import sys, json; data=json.loads(sys.stdin.read()); print(f\"{len(data.get('findings', []))} articles from {len(data.get('sources_used', []))} sources\")")"

echo ""
echo "Calling intelligence-orchestrator-v2 with monitoring data..."

curl -X POST ${SUPABASE_URL}/functions/v1/intelligence-orchestrator-v2 \
  -H "Content-Type: application/json" \
  -H "${AUTH_HEADER}" \
  -d "{
    \"organization_id\": \"tesla\",
    \"organization_name\": \"Tesla\",
    \"industry\": \"Electric Vehicles\",
    \"skip_enrichment\": false,
    \"skip_synthesis\": false,
    \"skip_opportunity_engine\": false,
    \"monitoring_data\": $MONITORING_DATA
  }" | python3 -m json.tool

echo ""
echo "=== Pipeline Test Complete ==="