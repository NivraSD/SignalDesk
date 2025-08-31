#!/bin/bash

echo "Testing Claude Analysis Storage..."

SUPABASE_URL="https://zskaxjtyuaqazydouifp.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0"
REQUEST_ID="test-$(date +%s)"

# Store a test Claude analysis
echo "Storing test analysis..."
curl -s -X POST \
  "${SUPABASE_URL}/functions/v1/claude-analysis-storage" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -d "{
    \"action\": \"store\",
    \"organization_name\": \"TestOrg\",
    \"stage_name\": \"competitive\",
    \"request_id\": \"${REQUEST_ID}\",
    \"claude_analysis\": {
      \"executive_summary\": \"Test Claude analysis\",
      \"insights\": [\"Rich insight 1\", \"Rich insight 2\"],
      \"opportunities\": [\"Opportunity 1\", \"Opportunity 2\"],
      \"metadata\": {
        \"model\": \"claude-sonnet-4\",
        \"duration\": 5000
      }
    }
  }" | python3 -m json.tool

echo ""
echo "Retrieving test analysis..."
curl -s -X POST \
  "${SUPABASE_URL}/functions/v1/claude-analysis-storage" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -d "{
    \"action\": \"retrieve\",
    \"organization_name\": \"TestOrg\",
    \"request_id\": \"${REQUEST_ID}\"
  }" | python3 -m json.tool

