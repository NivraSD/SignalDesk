#!/bin/bash

# Railway Force Rebuild Script
# This script forces Railway to completely rebuild without using any cache

echo "========================================="
echo "Railway Force Rebuild Script"
echo "========================================="

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Get the current directory
CURRENT_DIR=$(pwd)
BACKEND_DIR="$CURRENT_DIR/backend"

# Check if we're in the right directory
if [[ "$CURRENT_DIR" == */SignalDesk ]]; then
    cd backend
elif [[ "$CURRENT_DIR" == */SignalDesk/backend ]]; then
    echo "Already in backend directory"
else
    echo "Error: Please run this script from the SignalDesk or SignalDesk/backend directory"
    exit 1
fi

echo ""
echo "Step 1: Backing up current Dockerfile (if exists)..."
if [ -f "Dockerfile" ]; then
    mv Dockerfile "Dockerfile.backup.$(date +%Y%m%d_%H%M%S)"
    echo "Dockerfile backed up"
fi

echo ""
echo "Step 2: Creating .railway-ignore file to bypass Docker..."
cat > .railway-ignore << 'EOF'
Dockerfile
Dockerfile.*
EOF
echo ".railway-ignore file created"

echo ""
echo "Step 3: Creating trigger file to force rebuild..."
echo "REBUILD_TRIGGER=$(date +%s)" > .rebuild-trigger
echo "Trigger file created with timestamp: $(date +%s)"

echo ""
echo "Step 4: Updating nixpacks.toml with timestamp..."
sed -i.bak "1s/^/# Force rebuild at $(date)\n/" nixpacks.toml
echo "nixpacks.toml updated"

echo ""
echo "Step 5: Committing changes..."
git add -A
git commit -m "Force Railway rebuild - bypass Docker cache $(date +%Y%m%d_%H%M%S)"

echo ""
echo "Step 6: Pushing to trigger deployment..."
git push

echo ""
echo "========================================="
echo "Deployment triggered!"
echo "========================================="
echo ""
echo "Monitor the deployment at:"
echo "https://railway.app/dashboard"
echo ""
echo "Or use: railway logs"
echo ""
echo "To check deployment status: railway status"
echo ""

# Optional: Open Railway dashboard
read -p "Open Railway dashboard in browser? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    railway open
fi