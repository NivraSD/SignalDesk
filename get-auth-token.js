// Paste this in your browser console while on SignalDesk to get the auth token

// Method 1: Check localStorage for Supabase auth
const supabaseAuth = localStorage.getItem('supabase.auth.token');
if (supabaseAuth) {
    console.log('Found Supabase auth token in localStorage:');
    try {
        const parsed = JSON.parse(supabaseAuth);
        console.log('Access Token:', parsed.access_token);
        navigator.clipboard.writeText(parsed.access_token);
        console.log('✅ Token copied to clipboard!');
    } catch (e) {
        console.log('Raw token:', supabaseAuth);
        navigator.clipboard.writeText(supabaseAuth);
        console.log('✅ Raw token copied to clipboard!');
    }
}

// Method 2: Check for any Supabase-related items
const allKeys = Object.keys(localStorage);
const supabaseKeys = allKeys.filter(key => key.toLowerCase().includes('supabase'));
console.log('Supabase-related localStorage keys:', supabaseKeys);

supabaseKeys.forEach(key => {
    const value = localStorage.getItem(key);
    console.log(`${key}:`, value ? value.substring(0, 100) + '...' : 'empty');
});

// Method 3: Check sessionStorage
const sessionKeys = Object.keys(sessionStorage);
const supabaseSessionKeys = sessionKeys.filter(key => key.toLowerCase().includes('supabase'));
if (supabaseSessionKeys.length > 0) {
    console.log('Supabase in sessionStorage:', supabaseSessionKeys);
}

// Method 4: Try to find the Supabase client in window or React
if (window._supabase) {
    console.log('Found Supabase client in window._supabase');
}

// Method 5: Extract from React DevTools (if available)
if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('React DevTools detected - check Components tab for Supabase context');
}

console.log('\n📝 Instructions:');
console.log('1. The auth token (if found) has been copied to your clipboard');
console.log('2. Paste it into the diagnostic tool');
console.log('3. If no token found, you may need to log in first');