#!/bin/bash

# Nuclear option - Complete Railway service reset

echo "================================================"
echo "RAILWAY NUCLEAR RESET - COMPLETE SERVICE REBUILD"
echo "================================================"
echo ""
echo "WARNING: This will delete and recreate your Railway service!"
echo "Make sure you have backed up your environment variables!"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 1
fi

# Step 1: Export current environment variables
echo "Step 1: Backing up environment variables..."
railway variables export > railway-backup-$(date +%Y%m%d-%H%M%S).env
echo "Variables backed up to railway-backup-*.env"

# Step 2: Get current service details
echo "Step 2: Getting service information..."
SERVICE_ID=$(railway status --json | jq -r '.serviceId')
PROJECT_ID=$(railway status --json | jq -r '.projectId')

echo "Service ID: $SERVICE_ID"
echo "Project ID: $PROJECT_ID"

# Step 3: Delete the current service
echo "Step 3: Deleting current service..."
read -p "Confirm deletion of service $SERVICE_ID? (yes/no): " confirm_delete

if [ "$confirm_delete" == "yes" ]; then
    railway service delete --yes
    echo "Service deleted."
else
    echo "Skipping service deletion."
fi

# Step 4: Create new service
echo "Step 4: Creating new service..."
railway service create signaldesk-backend

# Step 5: Link to GitHub repo
echo "Step 5: Linking to repository..."
echo "Please go to Railway dashboard and:"
echo "1. Connect your GitHub repository"
echo "2. Set the root directory to: backend/backend/backend/backend"
echo "3. Ensure 'Auto Deploy' is enabled"
echo ""
read -p "Press Enter when you've connected the repository..."

# Step 6: Import environment variables
echo "Step 6: Importing environment variables..."
echo "Choose a backup file to restore from:"
ls -la railway-backup-*.env
read -p "Enter filename: " backup_file

if [ -f "$backup_file" ]; then
    railway variables import < "$backup_file"
    echo "Variables imported."
else
    echo "File not found. Please manually set environment variables."
fi

# Step 7: Set Nixpacks-specific variables
echo "Step 7: Forcing Nixpacks configuration..."
railway variables set NIXPACKS_BUILD_CMD=""
railway variables set NIXPACKS_INSTALL_CMD="npm ci --production"
railway variables set RAILWAY_USE_NIXPACKS=true
railway variables set DISABLE_DOCKER_BUILDS=true
railway variables set NO_CACHE=true
railway variables set FORCE_CLEAN_BUILD=$(date +%s)

# Step 8: Deploy
echo "Step 8: Deploying with Nixpacks..."
railway up --nixpacks

echo ""
echo "================================================"
echo "NUCLEAR RESET COMPLETE"
echo "================================================"
echo ""
echo "Your service has been completely rebuilt."
echo "Monitor deployment with: railway logs --build"
echo ""
echo "If issues persist, contact Railway support and request:"
echo "1. Manual cache clearing for project ID: $PROJECT_ID"
echo "2. Force Nixpacks builder for all deployments"
echo "3. Disable Docker build caching permanently"
echo ""