#!/bin/bash

echo "🔍 Monitoring Railway deployment..."
echo "Waiting for server to switch from server.js to index.js"
echo "Press Ctrl+C to stop"
echo ""

while true; do
    RESPONSE=$(curl -s https://signaldesk-production.up.railway.app/)
    
    if echo "$RESPONSE" | grep -q "serverFile"; then
        echo "✅ NEW SERVER DETECTED! index.js is now running"
        echo "$RESPONSE" | python3 -m json.tool | head -20
        
        echo ""
        echo "Testing endpoints..."
        
        # Test Media endpoint
        echo "Testing /api/media/search-journalists..."
        curl -X POST https://signaldesk-production.up.railway.app/api/media/search-journalists \
            -H "Content-Type: application/json" \
            -d '{"query":"test"}' 2>/dev/null | python3 -c "import sys, json; d=json.loads(sys.stdin.read()); print('Success!' if d.get('success') else 'Failed')"
        
        # Test Crisis endpoint
        echo "Testing /api/crisis/generate-plan..."
        curl -X POST https://signaldesk-production.up.railway.app/api/crisis/generate-plan \
            -H "Content-Type: application/json" \
            -d '{"situation":"test"}' 2>/dev/null | python3 -c "import sys, json; d=json.loads(sys.stdin.read()); print('Success!' if d.get('success') else 'Failed')"
        
        break
    else
        TIMESTAMP=$(date +"%H:%M:%S")
        echo "[$TIMESTAMP] Still running old server.js... waiting..."
    fi
    
    sleep 10
done

echo ""
echo "🎉 Deployment complete! All endpoints should now be working."