// COPY AND PASTE THIS ENTIRE CODE INTO YOUR BROWSER CONSOLE ON SIGNALDESK:

(function() {
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const [url, options] = args;
        
        if (url.includes('intelligence-stage-1-competitors')) {
            console.log('🎯 INTERCEPTED REQUEST TO COMPETITOR STAGE:');
            console.log('URL:', url);
            console.log('Headers:', options?.headers);
            console.log('Body (raw):', options?.body);
            
            if (options?.body) {
                try {
                    const parsed = JSON.parse(options.body);
                    console.log('Body (parsed):', parsed);
                    console.log('Organization:', parsed.organization);
                    console.log('Organization name:', parsed.organization?.name);
                    
                    // Copy to clipboard for testing
                    navigator.clipboard.writeText(options.body).then(() => {
                        console.log('✅ Request body copied to clipboard!');
                        console.log('📋 PASTE THIS IN THE TEST PAGE:', options.body);
                    });
                } catch (e) {
                    console.error('Could not parse body:', e);
                }
            }
        }
        
        return originalFetch.apply(this, args).then(response => {
            if (url.includes('intelligence-stage-1-competitors')) {
                const clonedResponse = response.clone();
                clonedResponse.text().then(text => {
                    console.log('📥 RESPONSE:', response.status);
                    if (!response.ok) {
                        console.log('❌ ERROR RESPONSE:', text);
                        // Also copy error to clipboard for analysis
                        navigator.clipboard.writeText(text).then(() => {
                            console.log('📋 ERROR COPIED TO CLIPBOARD');
                        });
                    } else {
                        console.log('✅ SUCCESS RESPONSE (truncated):', text.substring(0, 500));
                    }
                });
            }
            return response;
        });
    };
    console.log('✅ Fetch interceptor installed! Now trigger the intelligence pipeline.');
    console.log('📝 The request body will be automatically copied to your clipboard.');
})();