#!/bin/bash

echo "🧹 Forcing clean Vercel deployment..."

# Add timestamp to package.json to force cache bust
TIMESTAMP=$(date +%s)
cat package.json | sed "s/\"version\": \"0.3.1\"/\"version\": \"0.3.1-$TIMESTAMP\"/" > package.json.tmp
mv package.json.tmp package.json

# Commit with clear message
git add package.json
git commit -m "FORCE CLEAN DEPLOY: Bust Vercel cache - includes all v3 updates and opportunity-detector-v3"

# Push to trigger deployment
git push origin main

echo "✅ Pushed clean deployment trigger"
echo "🔍 This deployment includes:"
echo "  - opportunity-detector-v3 Edge Function"
echo "  - IntelligenceOrchestratorV3"
echo "  - All stakeholder monitoring"
echo "  - Cache fixes for Mitsui/Netflix issue"
echo "  - No fallback opportunities"
