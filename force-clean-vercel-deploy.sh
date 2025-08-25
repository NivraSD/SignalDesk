#!/bin/bash

echo "🔥 FORCING COMPLETELY CLEAN VERCEL DEPLOYMENT"
echo "============================================"

# 1. Clear Vercel cache
echo "1. Clearing Vercel cache..."
rm -rf .vercel/cache 2>/dev/null

# 2. Remove node_modules to force fresh install
echo "2. Removing node_modules..."
rm -rf node_modules 2>/dev/null

# 3. Clear npm cache
echo "3. Clearing npm cache..."
npm cache clean --force 2>/dev/null

# 4. Update package.json with timestamp to force rebuild
echo "4. Updating package.json with timestamp..."
TIMESTAMP=$(date +%s)
sed -i.bak "s/\"version\": \"[^\"]*\"/\"version\": \"0.3.1-$TIMESTAMP\"/" package.json

# 5. Commit changes
echo "5. Committing changes..."
git add package.json
git commit -m "FORCE CLEAN BUILD: Clear all caches, fresh dependencies - timestamp $TIMESTAMP

This deployment MUST include:
- IntelligenceOrchestratorV3
- opportunity-detector-v3
- No assess-opportunities-simple fallbacks
- Fresh stakeholder data flow
- Cache fixes for Mitsui/Netflix issue"

# 6. Push to trigger deployment
echo "6. Pushing to GitHub..."
git push origin main

# 7. Wait and verify deployment
echo "7. Waiting 60 seconds for deployment to start..."
sleep 60

# 8. Check if v3 is deployed
echo "8. Checking deployment..."
if curl -s https://signaldesk-nivra-sd.vercel.app/ | grep -q "opportunity-detector-v3"; then
    echo "✅ SUCCESS: V3 code detected in deployment!"
else
    echo "❌ FAILED: V3 code still not in deployment"
    echo "Manual intervention required - check Vercel dashboard"
fi

echo ""
echo "NEXT STEPS:"
echo "1. Go to https://vercel.com/nivra-sd/signaldesk"
echo "2. Check the deployment status"
echo "3. If failed, check build logs"
echo "4. May need to manually redeploy from Vercel dashboard"
