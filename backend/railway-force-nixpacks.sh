#!/bin/bash

echo "Forcing Railway to use Nixpacks..."

# Add cache-busting timestamp to package.json
TIMESTAMP=$(date +%s)
sed -i.bak "s/\"version\": \".*\"/\"version\": \"1.0.$TIMESTAMP\"/" package.json

# Commit and push
git add -A
git commit -m "FORCE NIXPACKS: Cache bust $TIMESTAMP - Railway using wrong builder"
git push origin main

echo "Pushed. Now in Railway Dashboard:"
echo "1. Go to Variables tab"
echo "2. Add: NIXPACKS_NO_CACHE=1"
echo "3. Add: RAILWAY_DOCKERFILE_PATH=NONE"
echo "4. Click Redeploy"
echo ""
echo "Or try: railway up --service [your-service-name]"