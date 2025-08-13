#!/bin/bash

# Force Railway to use Nixpacks and break Docker cache

echo "==================================="
echo "FORCING RAILWAY TO USE NIXPACKS"
echo "==================================="

# Step 1: Remove all Docker-related files
echo "1. Removing all Docker files..."
find . -name "Dockerfile*" -delete 2>/dev/null
find . -name ".dockerignore" -delete 2>/dev/null
find . -name "docker-compose*" -delete 2>/dev/null

# Step 2: Clear any build caches
echo "2. Clearing build caches..."
rm -rf node_modules package-lock.json .npm

# Step 3: Update cache-busting file
echo "3. Creating cache buster..."
echo "CACHE_BUST_TIME=$(date +%s)" > .railway-deploy-trigger
echo "FORCE_NIXPACKS=true" >> .railway-deploy-trigger
echo "BUILD_ID=$(uuidgen || date +%s)" >> .railway-deploy-trigger

# Step 4: Commit changes
echo "4. Committing changes..."
git add -A
git commit -m "FORCE NIXPACKS: Remove Docker, break cache $(date +%s)"

# Step 5: Push to trigger deployment
echo "5. Pushing to trigger deployment..."
git push origin main

echo ""
echo "==================================="
echo "DEPLOYMENT TRIGGERED"
echo "==================================="
echo ""
echo "Now perform these steps in Railway Dashboard:"
echo ""
echo "1. Go to your Railway project"
echo "2. Navigate to Settings > Environment"
echo "3. Add these variables if not present:"
echo "   - NIXPACKS_NO_CACHE = 1"
echo "   - RAILWAY_DOCKERFILE_PATH = DOES_NOT_EXIST"
echo "   - FORCE_REBUILD = $(date +%s)"
echo ""
echo "4. If deployment still uses Docker:"
echo "   a. Go to Settings > Danger Zone"
echo "   b. Click 'Remove Service'"
echo "   c. Re-add the service"
echo "   d. Connect GitHub repo"
echo "   e. Deploy again"
echo ""
echo "==================================="