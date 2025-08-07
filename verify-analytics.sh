#!/bin/bash

echo "🔍 Verifying Monitoring Analytics Integration..."

# Check if files exist
echo "✓ Checking frontend files..."
if [ -f ~/Desktop/SignalDesk/frontend/src/components/Monitoring/MonitoringAnalytics.js ]; then
    echo "  ✓ MonitoringAnalytics.js exists"
else
    echo "  ✗ MonitoringAnalytics.js missing"
fi

if [ -f ~/Desktop/SignalDesk/frontend/src/components/Monitoring/MonitoringAnalytics.css ]; then
    echo "  ✓ MonitoringAnalytics.css exists"
else
    echo "  ✗ MonitoringAnalytics.css missing"
fi

echo "✓ Checking backend files..."
if [ -f ~/Desktop/SignalDesk/backend/src/controllers/analyticsController.js ]; then
    echo "  ✓ analyticsController.js exists"
else
    echo "  ✗ analyticsController.js missing"
fi

# Check if imports are added
echo "✓ Checking imports..."
if grep -q "import MonitoringAnalytics" ~/Desktop/SignalDesk/frontend/src/components/Monitoring/AISentimentMonitor.js; then
    echo "  ✓ MonitoringAnalytics import added"
else
    echo "  ✗ MonitoringAnalytics import missing"
fi

# Check if analytics tab is added
if grep -q "analytics" ~/Desktop/SignalDesk/frontend/src/components/Monitoring/AISentimentMonitor.js; then
    echo "  ✓ Analytics tab added"
else
    echo "  ✗ Analytics tab missing"
fi

# Check if routes are added
echo "✓ Checking routes..."
if grep -q "analyticsController" ~/Desktop/SignalDesk/backend/src/routes/monitoringRoutes.js; then
    echo "  ✓ Analytics routes added"
else
    echo "  ✗ Analytics routes missing"
fi

echo ""
echo "🎉 Analytics integration complete!"
echo ""
echo "Next steps:"
echo "1. Restart your backend server: cd ~/Desktop/SignalDesk/backend && npm run dev"
echo "2. Restart your frontend: cd ~/Desktop/SignalDesk/frontend && npm start"
echo "3. Navigate to AI Monitoring and click the 'Analytics' tab"
