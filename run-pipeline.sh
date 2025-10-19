#!/bin/bash

# Run Intelligence Pipeline for OpenAI
echo "🚀 Running Intelligence Pipeline for OpenAI..."

curl -X POST https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-orchestrator-v2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.gJ5X9LQqR3oGxRv4NCA7l-gDL3EQlFqG0OWU-oYRJE0" \
  -d '{
    "organization_id": "OpenAI",
    "organization_name": "OpenAI",
    "industry": "Artificial Intelligence",
    "run_full_pipeline": true
  }'

echo ""
echo "✅ Pipeline complete! Check your opportunities in the UI."