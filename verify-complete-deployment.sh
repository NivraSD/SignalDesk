#!/bin/bash

# SignalDesk Complete Deployment Verification Script
# Tests all components and integrations

echo "🔍 SignalDesk Deployment Verification"
echo "====================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get URLs from environment or use defaults
BACKEND_URL=${BACKEND_URL:-"https://signaldesk-production.up.railway.app"}
FRONTEND_URL=${FRONTEND_URL:-"https://signaldesk-frontend.vercel.app"}

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# Function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected=$3
    local method=${4:-GET}
    local data=${5:-}
    
    echo -n "Testing $name... "
    
    if [ "$method" = "POST" ]; then
        if [ -n "$data" ]; then
            response=$(curl -s -X POST "$url" -H "Content-Type: application/json" -d "$data" 2>/dev/null)
        else
            response=$(curl -s -X POST "$url" -H "Content-Type: application/json" 2>/dev/null)
        fi
    else
        response=$(curl -s "$url" 2>/dev/null)
    fi
    
    if echo "$response" | grep -q "$expected"; then
        echo -e "${GREEN}✅ PASSED${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        echo "   Expected: $expected"
        echo "   Got: ${response:0:100}..."
        ((TESTS_FAILED++))
        return 1
    fi
}

# 1. Backend Health Checks
echo -e "${BLUE}1. Backend API Tests${NC}"
echo "--------------------"

test_endpoint "Backend Health" \
    "$BACKEND_URL/api/health" \
    "status"

test_endpoint "Backend Version" \
    "$BACKEND_URL/api/version" \
    "version"

test_endpoint "Backend CORS" \
    "$BACKEND_URL/api/test" \
    "CORS"

echo ""

# 2. Claude Integration Tests
echo -e "${BLUE}2. Claude AI Integration${NC}"
echo "------------------------"

test_endpoint "Claude Health Check" \
    "$BACKEND_URL/api/ai/claude/health" \
    "status" \
    "POST"

test_endpoint "Claude Message API" \
    "$BACKEND_URL/api/ai/claude/message" \
    "response" \
    "POST" \
    '{"message":"Test"}'

echo ""

# 3. Database Connection Tests
echo -e "${BLUE}3. Database Tests${NC}"
echo "-----------------"

test_endpoint "Organizations Endpoint" \
    "$BACKEND_URL/api/organizations" \
    "organization"

test_endpoint "Projects Endpoint" \
    "$BACKEND_URL/api/projects" \
    "project"

echo ""

# 4. Monitoring Service Tests
echo -e "${BLUE}4. Monitoring Service${NC}"
echo "---------------------"

test_endpoint "Monitoring Status" \
    "$BACKEND_URL/api/monitoring/status" \
    "status"

test_endpoint "Intelligence Findings" \
    "$BACKEND_URL/api/monitoring/intelligence" \
    "findings"

echo ""

# 5. Frontend Tests
echo -e "${BLUE}5. Frontend Tests${NC}"
echo "-----------------"

test_endpoint "Frontend Loading" \
    "$FRONTEND_URL" \
    "<!DOCTYPE html"

test_endpoint "Frontend Manifest" \
    "$FRONTEND_URL/manifest.json" \
    "SignalDesk"

echo ""

# 6. Authentication Tests
echo -e "${BLUE}6. Authentication Tests${NC}"
echo "-----------------------"

test_endpoint "Auth Login Endpoint" \
    "$BACKEND_URL/api/auth/login" \
    "error" \
    "POST" \
    '{"email":"test@test.com","password":"test"}'

test_endpoint "Auth Status" \
    "$BACKEND_URL/api/auth/status" \
    "authenticated"

echo ""

# 7. Supabase Integration Tests
echo -e "${BLUE}7. Supabase Integration${NC}"
echo "-----------------------"

# Test if Supabase client is properly configured
echo -n "Testing Supabase configuration... "
if curl -s "$FRONTEND_URL" | grep -q "zskaxjtyuaqazydouifp.supabase.co"; then
    echo -e "${GREEN}✅ PASSED${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠️  WARNING - Supabase URL not found${NC}"
fi

echo ""

# 8. Performance Tests
echo -e "${BLUE}8. Performance Tests${NC}"
echo "--------------------"

echo -n "Testing backend response time... "
start_time=$(date +%s%N)
curl -s "$BACKEND_URL/api/health" > /dev/null
end_time=$(date +%s%N)
response_time=$(( (end_time - start_time) / 1000000 ))

if [ $response_time -lt 1000 ]; then
    echo -e "${GREEN}✅ PASSED (${response_time}ms)${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠️  SLOW (${response_time}ms)${NC}"
fi

echo ""

# 9. Security Headers Test
echo -e "${BLUE}9. Security Tests${NC}"
echo "-----------------"

echo -n "Testing security headers... "
headers=$(curl -sI "$BACKEND_URL/api/health")
if echo "$headers" | grep -q "X-Content-Type-Options"; then
    echo -e "${GREEN}✅ PASSED${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠️  WARNING - Security headers not configured${NC}"
fi

echo ""

# Summary
echo "====================================="
echo -e "${BLUE}Test Summary${NC}"
echo "====================================="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Deployment verified successfully.${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed. Please check the logs above.${NC}"
    echo ""
    echo "Troubleshooting tips:"
    echo "1. Check Railway logs: railway logs"
    echo "2. Check Vercel logs: vercel logs"
    echo "3. Verify environment variables are set correctly"
    echo "4. Ensure Claude API key is valid"
    echo "5. Check database connection string"
    exit 1
fi