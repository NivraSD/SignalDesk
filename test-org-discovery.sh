#!/bin/bash

echo "🔍 Testing organization-discovery edge function..."

curl -X POST \
  'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/organization-discovery' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8' \
  -d '{
    "organizationName": "OpenAI",
    "url": "https://openai.com"
  }' \
  -w "\n\nHTTP Status: %{http_code}\n"