#!/bin/bash

SUPABASE_URL="https://zskaxjtyuaqazydouifp.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0"

echo "🧪 Testing Critical Edge Functions for V7 Pipeline"
echo "=================================================="

# Test intelligence-collection-v1
echo -e "\n1️⃣ Testing intelligence-collection-v1..."
curl -s -X POST "$SUPABASE_URL/functions/v1/intelligence-collection-v1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -d '{
    "organization": {"name": "TestCorp", "industry": "tech"},
    "entities": {"competitors": ["CompA"], "media_outlets": ["TechCrunch"]}
  }' \
  --max-time 10 | jq -r '.success // .error // "TIMEOUT or NOT FOUND"' | sed 's/^/Status: /'

# Test intelligence-synthesis-v4
echo -e "\n2️⃣ Testing intelligence-synthesis-v4..."
curl -s -X POST "$SUPABASE_URL/functions/v1/intelligence-synthesis-v4" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -d '{
    "intelligence": {"entity_actions": {"all": []}, "topic_trends": {"all": []}},
    "organization": {"name": "TestCorp"}
  }' \
  --max-time 10 | jq -r '.success // .error // "TIMEOUT or NOT FOUND"' | sed 's/^/Status: /'

# Test intelligence-discovery-v3
echo -e "\n3️⃣ Testing intelligence-discovery-v3..."
curl -s -X POST "$SUPABASE_URL/functions/v1/intelligence-discovery-v3" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -d '{"organization": {"name": "TestCorp"}}' \
  --max-time 10 | jq -r '.success // .error // "TIMEOUT or NOT FOUND"' | sed 's/^/Status: /'

# Test intelligence-gathering-v3
echo -e "\n4️⃣ Testing intelligence-gathering-v3..."
curl -s -X POST "$SUPABASE_URL/functions/v1/intelligence-gathering-v3" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -d '{"entities": {"competitors": ["CompA"]}}' \
  --max-time 10 | jq -r '.success // .error // "TIMEOUT or NOT FOUND"' | sed 's/^/Status: /'

# Test mcp-bridge (should NOT be used)
echo -e "\n❌ Testing mcp-bridge (should NOT work in production)..."
curl -s -X POST "$SUPABASE_URL/functions/v1/mcp-bridge" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -d '{"test": true}' \
  --max-time 5 | jq -r '.error // "Still active (BAD!)"' | sed 's/^/Status: /'

echo -e "\n=================================================="
echo "✅ Test Complete"
