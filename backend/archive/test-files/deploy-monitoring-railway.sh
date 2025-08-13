#!/bin/bash

# Deploy Monitoring Service to Railway
echo "🚂 Deploying Monitoring Service to Railway"
echo "=========================================="

cd monitoring-service

# Create package.json if needed
cat > package.json << 'EOF'
{
  "name": "signaldesk-monitoring",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "node-cron": "^3.0.3",
    "pg": "^8.11.3",
    "rss-parser": "^3.13.0",
    "axios": "^1.5.0"
  }
}
EOF

echo "📦 Installing dependencies..."
npm install

echo "🚀 Deploying to Railway..."
railway init --name signaldesk-monitoring
railway link
railway up

echo "✅ Monitoring service deployed!"
echo "It will run continuously, gathering intelligence 24/7"