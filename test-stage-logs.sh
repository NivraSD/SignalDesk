#!/bin/bash

echo "🔍 Checking Stage 1 Logs..."
echo ""

# Call Stage 1 and capture response
RESPONSE=$(curl -s -X POST https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-stage-1-competitors \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0" \
  -H "Content-Type: application/json" \
  -d '{"organization": {"name": "Debug Test", "industry": "Technology"}}')

echo "Response metadata:"
echo "$RESPONSE" | jq '.data.metadata // .error // "No data"'

echo ""
echo "Claude enhanced?"
echo "$RESPONSE" | jq '.data.metadata.claude_enhanced // false'

echo ""
echo "Has competitors?"
echo "$RESPONSE" | jq '.data.competitors // "No competitors"' | head -c 200

echo ""
echo "Success?"
echo "$RESPONSE" | jq '.success // false'