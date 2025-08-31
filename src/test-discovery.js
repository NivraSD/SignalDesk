// Test script to verify discovery pipeline with company names
// Run this in browser console or Node.js

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8';

async function testDiscoveryPipeline(companyName) {
    console.log(`\n🚀 Testing discovery pipeline for: "${companyName}"`);
    console.log('=' .repeat(60));

    try {
        // Step 1: Call intelligence-discovery-v3
        console.log('\n📡 Step 1: Calling intelligence-discovery-v3...');
        const discoveryPayload = {
            organization: {
                name: companyName,
                id: companyName.toLowerCase().replace(/\s+/g, '-'),
                industry: 'Technology',
                created_at: new Date().toISOString()
            },
            config: {
                useCache: false,
                comprehensive: true
            }
        };
        
        console.log('Request payload:', JSON.stringify(discoveryPayload, null, 2));
        
        const discoveryResponse = await fetch(`${SUPABASE_URL}/functions/v1/intelligence-discovery-v3`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_KEY}`
            },
            body: JSON.stringify(discoveryPayload)
        });

        const discoveryResult = await discoveryResponse.json();
        console.log('Discovery response:', discoveryResult);

        if (!discoveryResponse.ok) {
            throw new Error(`Discovery failed: ${discoveryResult.error || discoveryResponse.status}`);
        }

        const requestId = discoveryResult.request_id;
        console.log(`✅ Got request_id: ${requestId}`);

        // Step 2: Call organization-discovery
        console.log('\n🤖 Step 2: Calling organization-discovery for Claude analysis...');
        const analysisPayload = {
            organization_name: companyName,
            request_id: requestId
        };
        
        console.log('Analysis payload:', JSON.stringify(analysisPayload, null, 2));
        
        const analysisResponse = await fetch(`${SUPABASE_URL}/functions/v1/organization-discovery`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_KEY}`
            },
            body: JSON.stringify(analysisPayload)
        });

        const analysisResult = await analysisResponse.json();
        console.log('Analysis response:', analysisResult);

        if (analysisResponse.ok) {
            console.log(`\n✅ SUCCESS! Company "${companyName}" fully initialized`);
            console.log('Request ID:', requestId);
            
            // Check what was actually used
            if (analysisResult.organization_name) {
                console.log('Organization name used:', analysisResult.organization_name);
            }
            
            return {
                success: true,
                companyName,
                requestId,
                discoveryData: discoveryResult,
                analysisData: analysisResult
            };
        } else {
            throw new Error(`Analysis failed: ${analysisResult.error || 'Unknown error'}`);
        }

    } catch (error) {
        console.error(`\n❌ ERROR:`, error.message);
        return {
            success: false,
            companyName,
            error: error.message
        };
    }
}

// Test with different company names
async function runTests() {
    console.log('🧪 Starting Discovery Pipeline Tests');
    console.log('=' .repeat(60));
    
    const testCases = [
        'Tesla',
        'Microsoft Corporation',
        'Apple Inc.',
        'Toyota Motor Corporation',
        'Amazon Web Services'
    ];
    
    const results = [];
    
    for (const company of testCases) {
        const result = await testDiscoveryPipeline(company);
        results.push(result);
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Summary
    console.log('\n' + '=' .repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('=' .repeat(60));
    
    results.forEach(result => {
        const status = result.success ? '✅' : '❌';
        const message = result.success 
            ? `Request ID: ${result.requestId}`
            : `Error: ${result.error}`;
        console.log(`${status} ${result.companyName}: ${message}`);
    });
    
    const successCount = results.filter(r => r.success).length;
    console.log(`\nTotal: ${successCount}/${results.length} successful`);
}

// Export for use in browser console or Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testDiscoveryPipeline, runTests };
} else if (typeof window !== 'undefined') {
    window.testDiscoveryPipeline = testDiscoveryPipeline;
    window.runTests = runTests;
    console.log('Test functions loaded. Run:');
    console.log('  testDiscoveryPipeline("Your Company Name")');
    console.log('  runTests()');
}