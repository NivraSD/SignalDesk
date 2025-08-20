#!/bin/bash

echo "🎯 Testing SignalDesk Real Competitor Intelligence"
echo "=================================================="
echo ""

# Test multiple companies
companies=("Uber:transportation" "Tesla:automotive" "Netflix:entertainment" "Spotify:music" "OpenAI:ai")

for company_industry in "${companies[@]}"; do
    IFS=':' read -r company industry <<< "$company_industry"
    
    echo "Testing $company ($industry)..."
    echo "----------------------------"
    
    # Call the MCP bridge
    response=$(curl -s -X POST https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/mcp-bridge \
        -H "Content-Type: application/json" \
        -d "{
            \"server\": \"intelligence\",
            \"method\": \"gather\",
            \"params\": {
                \"organization\": {
                    \"name\": \"$company\",
                    \"industry\": \"$industry\"
                }
            },
            \"organizationId\": \"test-123\"
        }")
    
    # Extract competitor names
    competitors=$(echo "$response" | jq -r '.result.insights[].title' 2>/dev/null | head -5)
    total=$(echo "$response" | jq -r '.result.summary.totalCompetitors' 2>/dev/null)
    
    if [ -n "$competitors" ]; then
        echo "✅ Found $total competitors:"
        echo "$competitors" | while read -r comp; do
            # Check if it's a GitHub repo (bad)
            if [[ "$comp" == *"/"* ]] || [[ "$comp" == *"-android"* ]]; then
                echo "   ❌ $comp (GitHub repo - BAD!)"
            else
                echo "   ✅ $comp (Real company - GOOD!)"
            fi
        done
    else
        echo "❌ No competitors found"
    fi
    
    echo ""
done

echo "=================================================="
echo "Summary: PR Intelligence should return real companies,"
echo "not GitHub repositories!"