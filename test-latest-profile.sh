#!/bin/bash

echo "🔍 Testing getLatestProfile action..."

curl -X POST \
  'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-persistence' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8' \
  -d '{
    "action": "getLatestProfile"
  }' \
  -w "\n\nHTTP Status: %{http_code}\n" | jq '.'