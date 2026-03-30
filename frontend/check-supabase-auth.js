const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAuth() {
    console.log('🔍 Testing Supabase Authentication\n');
    console.log('URL:', SUPABASE_URL);
    console.log('Key:', SUPABASE_ANON_KEY.substring(0, 50) + '...\n');

    // Test 1: Check current session
    console.log('1. Checking current session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
        console.error('❌ Session error:', sessionError.message);
    } else {
        console.log(session ? '✅ Active session found' : '⚠️  No active session');
    }

    // Test 2: Try to create a test user
    console.log('\n2. Attempting to create test user...');
    const testEmail = `test_${Date.now()}@signaldesk.com`;
    const testPassword = 'TestPassword123!';
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword
    });

    if (signUpError) {
        console.error('❌ Sign up error:', signUpError.message);
        console.error('   Code:', signUpError.code);
        console.error('   Status:', signUpError.status);
    } else {
        console.log('✅ Test user created successfully');
        console.log('   User ID:', signUpData.user?.id);
        console.log('   Email:', signUpData.user?.email);
        console.log('   Confirmed:', signUpData.user?.confirmed_at ? 'Yes' : 'No');
        
        // Try to sign in immediately
        console.log('\n3. Attempting to sign in with test user...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: testEmail,
            password: testPassword
        });

        if (signInError) {
            console.error('❌ Sign in error:', signInError.message);
        } else {
            console.log('✅ Sign in successful');
            console.log('   Session token:', signInData.session?.access_token?.substring(0, 30) + '...');
            
            // Clean up - sign out
            await supabase.auth.signOut();
            console.log('   Signed out successfully');
        }
    }

    // Test 4: Try with known demo credentials
    console.log('\n4. Testing with demo credentials...');
    const { data: demoData, error: demoError } = await supabase.auth.signInWithPassword({
        email: 'demo@signaldesk.com',
        password: 'DemoPassword123!'
    });

    if (demoError) {
        console.error('❌ Demo login failed:', demoError.message);
        if (demoError.message.includes('Invalid login credentials')) {
            console.log('   → Demo user does not exist. You may need to create it first.');
        }
    } else {
        console.log('✅ Demo login successful');
        await supabase.auth.signOut();
    }

    // Test 5: Check if anonymous auth is enabled
    console.log('\n5. Testing anonymous authentication...');
    const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
    
    if (anonError) {
        console.error('❌ Anonymous auth error:', anonError.message);
        if (anonError.message.includes('Anonymous sign-ins are disabled')) {
            console.log('   → Anonymous authentication is disabled in Supabase project settings');
        }
    } else {
        console.log('✅ Anonymous auth successful');
        console.log('   User ID:', anonData.user?.id);
        await supabase.auth.signOut();
    }

    console.log('\n✨ Test complete!');
    process.exit(0);
}

testAuth().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});