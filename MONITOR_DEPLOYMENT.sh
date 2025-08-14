#!/bin/bash

# Monitor Vercel-Supabase Deployment Health
# Continuous monitoring script for your deployment

echo "🔍 Deployment Health Monitor"
echo "============================"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
VERCEL_URL="${1:-https://signaldesk-frontend.vercel.app}"
SUPABASE_URL="https://zskaxjtyuaqazydouifp.supabase.co"
CHECK_INTERVAL=30  # seconds

echo -e "${BLUE}Monitoring:${NC}"
echo "  Vercel: $VERCEL_URL"
echo "  Supabase: $SUPABASE_URL"
echo "  Check interval: ${CHECK_INTERVAL}s"
echo ""
echo "Press Ctrl+C to stop monitoring"
echo ""

# Function to check service status
check_service() {
    local url=$1
    local name=$2
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    
    if [ "$response" == "200" ] || [ "$response" == "304" ] || [ "$response" == "401" ]; then
        echo -e "${GREEN}✅${NC} $name is UP (HTTP $response)"
        return 0
    else
        echo -e "${RED}❌${NC} $name is DOWN (HTTP $response)"
        return 1
    fi
}

# Function to check Supabase database
check_database() {
    response=$(curl -s -X GET \
        "${SUPABASE_URL}/rest/v1/organizations?select=id&limit=1" \
        -H "apikey: test" \
        -H "Content-Type: application/json" 2>/dev/null \
        -w "\n%{http_code}")
    
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" == "401" ]; then
        echo -e "${GREEN}✅${NC} Database API is responding (auth required)"
        return 0
    elif [ "$http_code" == "200" ]; then
        echo -e "${GREEN}✅${NC} Database API is accessible"
        return 0
    else
        echo -e "${RED}❌${NC} Database API issue (HTTP $http_code)"
        return 1
    fi
}

# Function to check Edge Functions
check_edge_functions() {
    local functions=("claude-chat" "monitor-intelligence" "niv-chat")
    local all_good=true
    
    for func in "${functions[@]}"; do
        response=$(curl -s -o /dev/null -w "%{http_code}" \
            "${SUPABASE_URL}/functions/v1/$func" \
            -X POST \
            -H "Content-Type: application/json" \
            2>/dev/null)
        
        if [ "$response" == "401" ] || [ "$response" == "400" ]; then
            echo -e "  ${GREEN}✓${NC} $func deployed"
        elif [ "$response" == "404" ]; then
            echo -e "  ${YELLOW}⚠${NC} $func not found"
            all_good=false
        else
            echo -e "  ${RED}✗${NC} $func error ($response)"
            all_good=false
        fi
    done
    
    return $([ "$all_good" = true ] && echo 0 || echo 1)
}

# Main monitoring loop
iteration=0
failures=0
max_failures=3

while true; do
    clear
    iteration=$((iteration + 1))
    
    echo "🔍 Deployment Health Monitor"
    echo "============================"
    echo -e "${BLUE}Check #$iteration${NC} - $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    
    # Check Vercel Frontend
    echo -e "${YELLOW}Frontend Status:${NC}"
    if check_service "$VERCEL_URL" "Vercel Frontend"; then
        frontend_status="UP"
    else
        frontend_status="DOWN"
        failures=$((failures + 1))
    fi
    echo ""
    
    # Check Supabase API
    echo -e "${YELLOW}Supabase Status:${NC}"
    if check_service "$SUPABASE_URL" "Supabase API"; then
        supabase_status="UP"
    else
        supabase_status="DOWN"
        failures=$((failures + 1))
    fi
    
    # Check Database
    check_database
    echo ""
    
    # Check Edge Functions
    echo -e "${YELLOW}Edge Functions:${NC}"
    check_edge_functions
    echo ""
    
    # Overall Health
    echo -e "${YELLOW}Overall Health:${NC}"
    if [ "$frontend_status" == "UP" ] && [ "$supabase_status" == "UP" ]; then
        echo -e "${GREEN}✅ All systems operational${NC}"
        failures=0
    else
        echo -e "${RED}⚠️  Some systems are down${NC}"
        
        if [ $failures -ge $max_failures ]; then
            echo ""
            echo -e "${RED}🚨 ALERT: Services have been down for $failures checks!${NC}"
            echo "Consider checking:"
            echo "  • Vercel build logs"
            echo "  • Supabase service status"
            echo "  • Environment variables configuration"
        fi
    fi
    
    # Stats
    echo ""
    echo -e "${BLUE}Statistics:${NC}"
    echo "  Checks performed: $iteration"
    echo "  Consecutive failures: $failures"
    echo "  Next check in: ${CHECK_INTERVAL}s"
    echo ""
    echo "Press Ctrl+C to stop monitoring"
    
    # Wait for next check
    sleep $CHECK_INTERVAL
done