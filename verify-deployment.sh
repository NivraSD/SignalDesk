#!/bin/bash

echo "🔍 Verifying Vercel Deployment..."
echo "================================"

URL="https://signaldesk-nivra-sd.vercel.app"

# Check deployment headers
echo "📡 Checking deployment ID..."
curl -I $URL 2>/dev/null | grep -E "x-vercel-deployment-url|x-vercel-id" | head -2

echo ""
echo "🔍 Checking for v3 indicators in deployed code..."

# Create a test HTML that loads the app and checks for v3
cat > test-deployment-check.html << 'HTML'
<!DOCTYPE html>
<html>
<head>
    <title>Deployment Check</title>
</head>
<body>
    <h1>Checking Deployment...</h1>
    <div id="results"></div>
    <script>
        async function checkDeployment() {
            const results = document.getElementById('results');
            
            // Check if the page loads
            try {
                const response = await fetch('https://signaldesk-nivra-sd.vercel.app/');
                const html = await response.text();
                
                // Look for v3 indicators
                const hasV3 = html.includes('IntelligenceOrchestratorV3') || 
                              html.includes('opportunity-detector-v3');
                
                if (hasV3) {
                    results.innerHTML = '<p style="color: green;">✅ V3 code detected in deployment!</p>';
                } else {
                    results.innerHTML = '<p style="color: red;">❌ V3 code NOT found in deployment</p>';
                }
                
                // Check bundle size (new code should be larger)
                const scriptTags = html.match(/<script[^>]*src="([^"]*)"[^>]*>/g) || [];
                results.innerHTML += `<p>Found ${scriptTags.length} script bundles</p>`;
                
            } catch (error) {
                results.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
            }
        }
        
        checkDeployment();
    </script>
</body>
</html>
HTML

echo "✅ Created test-deployment-check.html"
echo ""
echo "📊 Checking Edge Functions..."

# Check if v3 Edge Functions are accessible
echo "Testing opportunity-detector-v3..."
curl -X OPTIONS "https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/opportunity-detector-v3" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8" \
  -o /dev/null -s -w "HTTP Status: %{http_code}\n"

echo ""
echo "📦 Recent Git commits:"
git log --oneline -5

echo ""
echo "================================"
echo "🎯 To fully verify:"
echo "1. Wait 2-3 minutes for Vercel to build"
echo "2. Visit $URL"
echo "3. Open browser console"
echo "4. Create new org (e.g., 'Test Corp')"
echo "5. Check console for 'opportunity-detector-v3' calls"