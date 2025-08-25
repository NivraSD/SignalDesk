#!/bin/bash

echo "🚨 EMERGENCY DEPLOYMENT - FORCE NEW BUILD"
echo "========================================="

# 1. Clear any local build artifacts
echo "1. Clearing local artifacts..."
rm -rf build/ .vercel/cache/ node_modules/.cache/

# 2. Make a VISIBLE change that MUST deploy
echo "2. Adding deployment timestamp to App.js..."
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
HASH=$(git rev-parse --short HEAD)

# Add a console.log that will be VISIBLE in the browser
sed -i.bak '1s/^/console.log("🚨 DEPLOYMENT: '"$TIMESTAMP"' | COMMIT: '"$HASH"' | NO FALLBACKS - V3 ONLY");\n/' src/App.js

# 3. Commit with clear message
echo "3. Committing..."
git add -A
git commit -m "🚨 EMERGENCY DEPLOY: $TIMESTAMP

THIS BUILD MUST NOT HAVE assess-opportunities-simple
- Deployment timestamp: $TIMESTAMP
- Commit hash: $HASH
- V3 ONLY - NO FALLBACKS"

# 4. Push
echo "4. Pushing to GitHub..."
git push origin main

# 5. FORCE Vercel deployment
echo "5. Forcing Vercel deployment..."
vercel --prod --force

echo ""
echo "DEPLOYMENT INITIATED"
echo "===================="
echo "Check console at https://signaldesk-nivra-sd.vercel.app/"
echo "Should show: 🚨 DEPLOYMENT: $TIMESTAMP"
