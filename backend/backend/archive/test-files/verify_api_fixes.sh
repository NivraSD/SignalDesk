#!/bin/bash
echo "Verifying API endpoints (should NOT have /api/api)..."
echo "===================================================="

for file in CampaignIntelligence.js ContentGenerator.js CrisisCommandCenter.js; do
    echo -e "\n=== $file ==="
    echo "API calls found:"
    grep -n "api\." "$file" | grep -E "(get|post|put|delete)" | grep -v "// " | head -10
    
    echo -e "\nChecking for double /api:"
    if grep -q "api\.[a-z]*('/api/" "$file"; then
        echo "❌ Found double /api prefix!"
        grep -n "api\.[a-z]*('/api/" "$file" | head -5
    else
        echo "✅ No double /api prefix found"
    fi
done
