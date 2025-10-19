#!/bin/bash

echo "🚀 Testing Complete Intelligence Pipeline (Following Architecture)"
echo "=================================================================="
echo ""

SUPABASE_URL="https://zskaxjtyuaqazydouifp.supabase.co"
SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

# Step 1: Discovery - Generate Profile
echo "📋 Step 1: Discovery (mcp-discovery)"
echo "-------------------------------------"
PROFILE_RESPONSE=$(curl -s -X POST "$SUPABASE_URL/functions/v1/mcp-discovery" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  --data '{
    "tool": "create_organization_profile",
    "arguments": {
      "organization_name": "Tesla",
      "industry_hint": "Electric Vehicles"
    }
  }')

# Extract profile from response
PROFILE=$(echo "$PROFILE_RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if 'profile' in data:
    print(json.dumps(data['profile']))
    sys.stderr.write('✅ Profile generated successfully\n')
else:
    print('{}')
    sys.stderr.write('❌ Failed to generate profile\n')
" 2>&1 >/tmp/profile.json)
echo "$PROFILE"

# Step 2: Monitor Stage 1 - Collect Articles
echo ""
echo "📰 Step 2: Monitor Stage 1 (Article Collection)"
echo "------------------------------------------------"
MONITOR_RESPONSE=$(curl -s -X POST "$SUPABASE_URL/functions/v1/monitor-stage-1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  --data "{\"profile\": $(cat /tmp/profile.json)}")

# Save monitoring data
echo "$MONITOR_RESPONSE" > /tmp/monitor.json
ARTICLE_COUNT=$(echo "$MONITOR_RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
articles = data.get('articles', [])
print(len(articles))
if articles:
    sys.stderr.write(f'✅ Collected {len(articles)} articles\n')
    sys.stderr.write(f'   First: {articles[0].get(\"title\", \"Unknown\")[:60]}...\n')
else:
    sys.stderr.write('❌ No articles collected\n')
" 2>&1)
echo "$ARTICLE_COUNT"

# Step 3: Orchestrator V2 - Full Pipeline
echo ""
echo "🎯 Step 3: Intelligence Orchestrator V2 (Full Pipeline)"
echo "-------------------------------------------------------"

# Prepare orchestrator payload with monitoring_data
ORCHESTRATOR_PAYLOAD=$(python3 -c "
import json

# Load profile
with open('/tmp/profile.json', 'r') as f:
    profile = json.load(f)

# Load monitor data
with open('/tmp/monitor.json', 'r') as f:
    monitor_data = json.load(f)

# Create orchestrator payload following architecture
payload = {
    'organization': {
        'id': 'test-' + profile.get('organization_name', 'org').lower(),
        'name': profile.get('organization_name', 'Unknown'),
        'industry': profile.get('industry', 'Unknown')
    },
    'profile': profile,
    'monitoring_data': {
        'findings': monitor_data.get('articles', []),
        'total_articles': monitor_data.get('total_articles', len(monitor_data.get('articles', []))),
        'metadata': monitor_data.get('metadata', {})
    },
    'articles_limit': 100
}

print(json.dumps(payload))
")

# Call orchestrator
ORCHESTRATOR_RESPONSE=$(curl -s -X POST "$SUPABASE_URL/functions/v1/intelligence-orchestrator-v2" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  --data "$ORCHESTRATOR_PAYLOAD")

# Parse and display results
echo "$ORCHESTRATOR_RESPONSE" | python3 -c "
import sys, json

try:
    data = json.load(sys.stdin)
    
    if data.get('success'):
        print('✅ PIPELINE SUCCESS!')
        print('')
        
        # Check synthesis
        synthesis = data.get('executive_synthesis', {})
        if synthesis.get('competitive_dynamics'):
            print('📊 Executive Synthesis: ✓')
            print(f'   - Competitive Dynamics: {bool(synthesis.get(\"competitive_dynamics\"))}')
            print(f'   - Stakeholder Intelligence: {bool(synthesis.get(\"stakeholder_intelligence\"))}')
            print(f'   - Trending Narratives: {bool(synthesis.get(\"trending_narratives\"))}')
        else:
            print('📊 Executive Synthesis: ✗ (Empty or error)')
        
        # Check opportunities
        opportunities = data.get('opportunities', [])
        if opportunities:
            print(f'💡 Opportunities Generated: {len(opportunities)}')
            for i, opp in enumerate(opportunities[:3]):
                print(f'   {i+1}. {opp.get(\"title\", \"Untitled\")}')
        else:
            print('💡 Opportunities: None generated')
            
        # Check enriched data
        enriched = data.get('enriched_data', {})
        if enriched:
            extracted = enriched.get('extracted_data', {})
            events = extracted.get('events', {})
            entities = extracted.get('entities', {})
            
            event_count = sum(len(v) if isinstance(v, list) else 0 for v in events.values())
            entity_count = sum(len(v) if isinstance(v, list) else 0 for v in entities.values())
            
            print(f'📈 Enrichment Stats:')
            print(f'   - Events Extracted: {event_count}')
            print(f'   - Entities Found: {entity_count}')
            print(f'   - Topics: {len(extracted.get(\"topics\", {}).get(\"trending\", []))}')
    else:
        print('❌ PIPELINE FAILED!')
        print(f'Error: {data.get(\"error\", \"Unknown error\")}')
        if 'details' in data:
            print('Details:', json.dumps(data['details'], indent=2))
            
except Exception as e:
    print(f'❌ Failed to parse response: {e}')
    print('Raw response:', sys.stdin.read()[:500])
"

echo ""
echo "=================================================================="
echo "Pipeline test complete!"