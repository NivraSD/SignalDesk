#!/bin/bash

echo "=== FORCING RAILWAY CACHE INVALIDATION ==="
echo "Timestamp: $(date)"

# Method 1: Using Railway CLI to force rebuild
echo "1. Attempting Railway CLI force rebuild..."
railway up --detach --service backend --environment production --force || echo "CLI method failed, continuing..."

# Method 2: Set environment variables to override build
echo "2. Setting Railway environment variables..."
railway variables set RAILWAY_DOCKERFILE_PATH="" --service backend --environment production || true
railway variables set NIXPACKS_NO_CACHE="true" --service backend --environment production || true
railway variables set RAILWAY_SKIP_DOCKER_BUILD_CACHE="true" --service backend --environment production || true
railway variables set FORCE_REBUILD="$(date +%s)" --service backend --environment production || true
railway variables set NIXPACKS_CONFIG_FILE="./nixpacks.toml" --service backend --environment production || true

# Method 3: Trigger deployment with cache bust
echo "3. Triggering new deployment..."
railway deploy --service backend --environment production || echo "Deploy command failed"

echo "=== CACHE INVALIDATION COMPLETE ==="
echo ""
echo "Additional manual steps if above doesn't work:"
echo "1. Go to Railway Dashboard"
echo "2. Navigate to your service settings"
echo "3. Under 'Build' section, change builder to 'Nixpacks'"
echo "4. Add these environment variables:"
echo "   - NIXPACKS_NO_CACHE=true"
echo "   - RAILWAY_DOCKERFILE_PATH= (empty value)"
echo "   - FORCE_COLOR=1"
echo "5. Click 'Redeploy' or trigger via GitHub push"