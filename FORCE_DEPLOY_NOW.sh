#!/bin/bash

echo "🚀 NUCLEAR FORCE DEPLOY FOR RAILWAY"
echo "===================================="

TIMESTAMP=$(date +"%Y%m%d-%H%M%S")

# Change multiple files to force detection
echo "// FORCE DEPLOY: $TIMESTAMP" >> backend/index.js
echo "# DEPLOY: $TIMESTAMP" >> backend/Dockerfile  
echo "$TIMESTAMP" > backend/.deploy-trigger
sed -i '' "s/1.0.0/1.0.$TIMESTAMP/" backend/package.json

# Commit everything
git add -A
git commit -m "FORCE DEPLOY: $TIMESTAMP - Niv routes MUST work"
git push

echo "✅ Pushed changes with timestamp: $TIMESTAMP"
echo "🔍 Check Railway dashboard - it MUST rebuild now"
echo ""
echo "After deployment, test with:"
echo "curl -X POST https://signaldesk-production.up.railway.app/api/niv/chat"