#!/bin/bash

# Test real Fireplexity search with proper auth
echo "🔍 Testing real Fireplexity web search..."

# Call the edge function directly with curl
curl -X POST https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/niv-fireplexity \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.gJ5X9LQqR3oGxRv4NCA7l-gDL3EQlFqG0OWU-oYRJE0" \
  -d '{
    "query": "OpenAI GPT-5 latest developments 2025",
    "module": "intelligence",
    "useCache": false,
    "context": {
      "organization": "OpenAI"
    }
  }' | jq '.'

echo ""
echo "If successful, this will use the FIRECRAWL_API_KEY from Supabase secrets to do a real web search"