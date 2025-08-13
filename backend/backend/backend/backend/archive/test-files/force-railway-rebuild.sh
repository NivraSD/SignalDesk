#!/bin/bash

# Force Railway to rebuild by modifying a critical file
echo "🔄 FORCING RAILWAY REBUILD"
echo "========================="
echo ""

# Add a timestamp comment to package.json to force rebuild
TIMESTAMP=$(date +%s)
echo "Adding rebuild timestamp to package.json..."

# Read current package.json
cd backend
if [ -f package.json ]; then
  # Add or update the rebuild timestamp in package.json
  if grep -q '"rebuild_timestamp"' package.json; then
    # Update existing timestamp
    sed -i.bak "s/\"rebuild_timestamp\": \"[0-9]*\"/\"rebuild_timestamp\": \"$TIMESTAMP\"/" package.json
  else
    # Add new timestamp field
    sed -i.bak "s/\"version\": \"1.0.0\"/\"version\": \"1.0.0\",\n  \"rebuild_timestamp\": \"$TIMESTAMP\"/" package.json
  fi
  
  # Remove backup file
  rm -f package.json.bak
  
  echo "✅ Modified package.json with timestamp: $TIMESTAMP"
else
  echo "❌ package.json not found!"
  exit 1
fi

# Also update server.js to force nixpacks to rebuild
echo "" >> server.js
echo "// REBUILD TRIGGER: $TIMESTAMP" >> server.js
echo "✅ Added rebuild trigger to server.js"

# Go back to root
cd ..

# Commit and push
echo ""
echo "📦 Committing changes..."
git add backend/package.json backend/server.js
git commit -m "🔨 FORCE RAILWAY REBUILD - Timestamp: $TIMESTAMP

- Modified package.json to trigger nixpacks cache invalidation
- Added rebuild marker to server.js
- This should force Railway to rebuild from scratch"

echo ""
echo "🚀 Pushing to GitHub..."
git push origin main

echo ""
echo "✅ REBUILD TRIGGERED"
echo ""
echo "Railway should now be forced to rebuild because:"
echo "1. package.json changed (nixpacks dependency file)"
echo "2. server.js changed (entry point file)"
echo ""
echo "Wait 3-5 minutes then run: ./verify-railway-deployment.sh"
echo ""
echo "If this doesn't work, you MUST:"
echo "1. Go to https://railway.app/dashboard"
echo "2. Click on your backend service"
echo "3. Click Settings → Redeploy"
echo "4. Or delete the service and recreate it"