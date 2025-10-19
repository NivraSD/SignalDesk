#!/bin/bash

# Wait for Railway deployment and test
echo "⏳ Waiting for Railway deployment..."
echo "This usually takes 2-5 minutes on first build"
echo ""

URL="https://signaldesk-production.up.railway.app/api/health"
MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    ATTEMPT=$((ATTEMPT + 1))
    echo -n "Attempt $ATTEMPT/$MAX_ATTEMPTS: "
    
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" $URL)
    
    if [ "$STATUS" = "200" ]; then
        echo "✅ Server is ready!"
        break
    else
        echo "Status $STATUS - waiting 10 seconds..."
        sleep 10
    fi
done

if [ "$STATUS" = "200" ]; then
    echo ""
    echo "🎉 Railway backend is live!"
    echo "Running full test suite..."
    echo ""
    node /Users/jonathanliebowitz/Desktop/SignalDesk/test-railway-backend.js
else
    echo ""
    echo "❌ Server didn't start after 5 minutes"
    echo "Check Railway logs at:"
    echo "https://railway.app/project/2485c0f8-21e1-428e-a456-ceb145feef66"
fi