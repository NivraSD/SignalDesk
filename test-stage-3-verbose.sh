#!/bin/bash
echo "🔍 Testing Stage 3 Regulatory with verbose output..."

curl -s -X POST https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-stage-3-regulatory \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0" \
  -d '{
    "organization": {
      "name": "TestCorp", 
      "industry": "technology"
    }
  }' | jq '.'
