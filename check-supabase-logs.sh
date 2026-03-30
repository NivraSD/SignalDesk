#!/bin/bash
# Check recent logs for real-time-intelligence-orchestrator-v2

echo "Fetching recent logs for real-time-intelligence-orchestrator-v2..."
echo ""

# Get logs from Supabase dashboard API
curl -s "https://api.supabase.com/v1/projects/zskaxjtyuaqazydouifp/functions/real-time-intelligence-orchestrator-v2/logs" \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" | jq .
