#!/bin/bash

# Monitor Railway deployment after git push

echo "=========================================="
echo "Monitoring Railway Deployment"
echo "=========================================="
echo "Time: $(date)"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

RAILWAY_URL="https://signaldesk-production.up.railway.app"

echo "Waiting for Railway to detect and deploy changes..."
echo "This typically takes 1-3 minutes"
echo ""

# Function to test endpoint
test_endpoint() {
    local url=$1
    local name=$2
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ $name is responding (HTTP $response)${NC}"
        return 0
    elif [ "$response" = "502" ]; then
        echo -e "${YELLOW}⏳ $name returning 502 (deployment in progress)${NC}"
        return 1
    else
        echo -e "${RED}❌ $name returned HTTP $response${NC}"
        return 1
    fi
}

# Monitor deployment
max_attempts=60  # 5 minutes (5 seconds * 60)
attempt=0

while [ $attempt -lt $max_attempts ]; do
    echo -e "\n${YELLOW}Attempt $((attempt + 1))/$max_attempts${NC}"
    
    # Test health endpoint
    if test_endpoint "$RAILWAY_URL/api/health" "Health endpoint"; then
        echo -e "\n${GREEN}🎉 Deployment successful!${NC}"
        
        # Test login endpoint
        echo -e "\nTesting login endpoint..."
        login_response=$(curl -s -X POST "$RAILWAY_URL/api/auth/login" \
            -H "Content-Type: application/json" \
            -d '{"email":"demo@signaldesk.com","password":"Demo123"}')
        
        if echo "$login_response" | grep -q "token"; then
            echo -e "${GREEN}✅ Login endpoint working!${NC}"
            echo "Response: $(echo "$login_response" | head -c 100)..."
            
            # Extract token for further testing
            token=$(echo "$login_response" | grep -o '"token":"[^"]*' | sed 's/"token":"//')
            
            if [ ! -z "$token" ]; then
                echo -e "\n${GREEN}✅ Token generated successfully${NC}"
            fi
        else
            echo -e "${RED}❌ Login endpoint not working properly${NC}"
            echo "Response: $login_response"
        fi
        
        break
    fi
    
    sleep 5
    attempt=$((attempt + 1))
done

if [ $attempt -eq $max_attempts ]; then
    echo -e "\n${RED}❌ Deployment did not complete within 5 minutes${NC}"
    echo "Check Railway dashboard for deployment status"
    echo "Run: railway logs"
fi

echo -e "\n=========================================="
echo "Deployment Check Complete"
echo "=========================================="${NC}