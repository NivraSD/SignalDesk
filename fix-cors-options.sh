#!/bin/bash

# Fix CORS OPTIONS handling in all edge functions
echo "Fixing CORS OPTIONS handling in all edge functions..."

# List of functions with incorrect OPTIONS handling
functions=(
  "claude-analysis-storage"
  "claude-discovery"
  "intelligence-orchestrator-v2"
  "intelligence-orchestrator"
  "mcp-analytics"
  "mcp-bridge"
  "mcp-campaigns"
  "mcp-content"
  "mcp-crisis"
  "mcp-discovery"
  "mcp-entities"
  "mcp-executive-synthesis"
  "mcp-intelligence"
  "mcp-media"
  "mcp-memory"
  "mcp-monitor"
  "mcp-narratives"
  "mcp-opportunity-detector"
  "mcp-orchestrator"
  "mcp-regulatory"
  "mcp-relationships"
  "mcp-scraper"
  "mcp-social"
  "mcp-stakeholder-groups"
  "monitor-stage-2-relevance"
  "niv-orchestrator-robust"
)

for func in "${functions[@]}"; do
  file="supabase/functions/$func/index.ts"
  if [ -f "$file" ]; then
    echo "Fixing $func..."
    # Use sed to replace the incorrect OPTIONS response
    sed -i '' "s/return new Response('ok', { headers: corsHeaders });/return new Response(null, { status: 204, headers: corsHeaders });/g" "$file"
  fi
done

echo "✅ Fixed CORS OPTIONS handling in all functions"
echo ""
echo "Functions to redeploy:"
for func in "${functions[@]}"; do
  echo "  - $func"
done