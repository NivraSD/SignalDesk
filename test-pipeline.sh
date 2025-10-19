#!/bin/bash

echo "Testing Intelligence Pipeline with Opportunity Detection..."
echo ""

# Call the intelligence orchestrator directly
curl -X POST https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-orchestrator-v2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8" \
  -d '{
    "organization_id": "tesla",
    "organization_name": "Tesla",
    "industry": "Electric Vehicles",
    "skip_enrichment": false,
    "skip_synthesis": false,
    "skip_opportunity_engine": false
  }' | python3 -m json.tool