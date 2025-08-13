#!/bin/bash

# Railway CLI deployment script to force Nixpacks

echo "======================================"
echo "Railway CLI Nixpacks Force Deployment"
echo "======================================"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Login to Railway (if needed)
echo "Checking Railway authentication..."
railway whoami || railway login

# Set environment variables to force Nixpacks
echo "Setting environment variables..."
railway variables set NIXPACKS_NO_CACHE=1
railway variables set RAILWAY_DOCKERFILE_PATH=DOES_NOT_EXIST
railway variables set FORCE_NIXPACKS=true
railway variables set CACHE_BUSTER=$(date +%s)
railway variables set BUILD_PACK=nixpacks
railway variables set DISABLE_DOCKER=true

# Remove Docker-related variables if they exist
echo "Removing Docker-related variables..."
railway variables delete DOCKER_BUILDKIT 2>/dev/null || true
railway variables delete DOCKER_BUILD_CACHE 2>/dev/null || true
railway variables delete DOCKERFILE_PATH 2>/dev/null || true

# Deploy with explicit Nixpacks flag
echo "Deploying with Nixpacks..."
railway up --nixpacks --no-cache

echo ""
echo "======================================"
echo "Deployment initiated with Nixpacks"
echo "======================================"
echo ""
echo "Monitor the deployment with:"
echo "  railway logs --build"
echo ""
echo "Check for Nixpacks confirmation:"
echo "  railway logs --build | grep -i nixpacks"
echo ""