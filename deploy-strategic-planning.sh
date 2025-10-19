#!/bin/bash

echo "Deploying Strategic Planning Edge Function..."

# Deploy using curl directly to Supabase
curl -X POST "https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/strategic-planning" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8" \
  -H "Content-Type: application/json" \
  -d '{
    "objective": "Test deployment",
    "context": "Testing if the function is working",
    "constraints": "None",
    "timeline": "Immediate"
  }'

echo -e "\n\nIf you see a response above, the function is working!"