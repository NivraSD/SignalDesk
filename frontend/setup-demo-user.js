const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function setupDemoUser() {
    console.log('🔧 Setting up demo user...\n');

    const email = 'demo@signaldesk.com';
    const password = 'DemoPassword123!';

    // Try to sign up the demo user
    console.log('Creating demo user...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: 'Demo User',
                role: 'demo'
            }
        }
    });

    if (signUpError) {
        if (signUpError.message.includes('already registered')) {
            console.log('⚠️  Demo user already exists, trying to sign in...');
        } else {
            console.error('❌ Sign up error:', signUpError.message);
            return;
        }
    } else {
        console.log('✅ Demo user created successfully!');
        console.log('   User ID:', signUpData.user?.id);
    }

    // Test sign in
    console.log('\nTesting demo user login...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (signInError) {
        console.error('❌ Demo login failed:', signInError.message);
        console.log('\nIf login fails, the user might exist with a different password.');
    } else {
        console.log('✅ Demo login successful!');
        console.log('   Session created:', signInData.session ? 'Yes' : 'No');
        
        // Sign out
        await supabase.auth.signOut();
        console.log('   Signed out successfully');
    }

    console.log('\n✨ Demo credentials:');
    console.log('   Email: demo@signaldesk.com');
    console.log('   Password: DemoPassword123!');
    console.log('\nYou can now use these credentials to log in!');
    
    process.exit(0);
}

setupDemoUser().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});