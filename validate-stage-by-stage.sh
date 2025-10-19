#!/bin/bash

# STAGE-BY-STAGE VALIDATION SCRIPT
# Run each test individually to isolate issues

echo "🚀 STAGE-BY-STAGE PIPELINE VALIDATION"
echo "======================================"

echo ""
echo "1️⃣ Testing Monitor Stage 1 (Article Collection)..."
node test-monitor-stage-1-validation.js
if [ $? -ne 0 ]; then
    echo "❌ Stage 1 failed - check article collection"
    exit 1
fi

echo ""
echo "2️⃣ Testing Relevance + Firecrawl (Content Extraction)..."
node test-relevance-real.js
if [ $? -ne 0 ]; then
    echo "❌ Stage 2 failed - check Firecrawl extraction"
    exit 1
fi

echo ""
echo "3️⃣ Running comprehensive pipeline test..."
node test-pipeline-comprehensive.js
if [ $? -ne 0 ]; then
    echo "❌ Comprehensive test failed"
    exit 1
fi

echo ""
echo "4️⃣ Checking final opportunity quality..."
node check-opportunities-content.js

echo ""
echo "✅ ALL TESTS COMPLETE"
echo "Check the output files for detailed analysis:"
echo "  - monitor-output.json"
echo "  - relevance-output-real.json" 
echo "  - comprehensive-test-results.json"