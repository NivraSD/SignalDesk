const { createClient } = require('@supabase/supabase-js');

// IMPORTANT: You need the SERVICE ROLE KEY for this to work
// Get it from: https://supabase.com/dashboard/project/zskaxjtyuaqazydouifp/settings/api
// Look for "service_role" under "Project API keys"

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';

// Replace this with your SERVICE ROLE KEY (not the anon key)
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'YOUR_SERVICE_ROLE_KEY_HERE';

if (SUPABASE_SERVICE_KEY === 'YOUR_SERVICE_ROLE_KEY_HERE') {
    console.error('❌ Please set your Supabase SERVICE ROLE KEY');
    console.log('\n1. Go to: https://supabase.com/dashboard/project/zskaxjtyuaqazydouifp/settings/api');
    console.log('2. Copy the "service_role" key (starts with eyJ...)');
    console.log('3. Run: SUPABASE_SERVICE_KEY="your_key_here" node create-confirmed-user.js\n');
    process.exit(1);
}

// Create admin client with service role key
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function createConfirmedUser() {
    console.log('🔧 Creating confirmed demo user...\n');

    const email = 'demo@signaldesk.com';
    const password = 'DemoPassword123!';

    try {
        // First, try to delete existing user
        console.log('Checking for existing user...');
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email === email);
        
        if (existingUser) {
            console.log('Found existing user, deleting...');
            const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
            if (deleteError) {
                console.error('Warning: Could not delete existing user:', deleteError.message);
            } else {
                console.log('✅ Existing user deleted');
            }
        }

        // Create new user with admin API (auto-confirms email)
        console.log('\nCreating new confirmed user...');
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true, // This auto-confirms the email!
            user_metadata: {
                full_name: 'Demo User',
                created_via: 'admin_script'
            }
        });

        if (createError) {
            console.error('❌ Error creating user:', createError.message);
            return;
        }

        console.log('✅ User created successfully!');
        console.log('   Email:', newUser.user.email);
        console.log('   ID:', newUser.user.id);
        console.log('   Confirmed:', newUser.user.email_confirmed_at ? 'Yes ✅' : 'No ❌');

        // Test sign in with regular client
        console.log('\n📝 Testing login with created user...');
        const regularClient = createClient(SUPABASE_URL, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8');
        
        const { data: signInData, error: signInError } = await regularClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (signInError) {
            console.error('❌ Login test failed:', signInError.message);
        } else {
            console.log('✅ Login successful!');
            console.log('   Session created:', signInData.session ? 'Yes' : 'No');
            
            // Sign out
            await regularClient.auth.signOut();
        }

        console.log('\n✨ Demo user ready!');
        console.log('   Email: demo@signaldesk.com');
        console.log('   Password: DemoPassword123!');

    } catch (err) {
        console.error('❌ Fatal error:', err);
    }
}

createConfirmedUser();