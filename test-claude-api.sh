#!/bin/bash

echo "Testing Claude Edge Function directly..."

curl -X POST https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/claude-intelligence-synthesizer-v2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8" \
  -d '{
    "intelligence_type": "competitor",
    "mcp_data": {"test": "data"},
    "organization": {"name": "TestOrg"},
    "goals": {"thought_leadership": true},
    "timeframe": "24h"
  }' | jq '.'