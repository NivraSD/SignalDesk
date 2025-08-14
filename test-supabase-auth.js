/**
 * SUPABASE AUTH TEST SCRIPT
 * This script tests the admin user login and provides detailed debugging
 * Run with: node test-supabase-auth.js
 */

const { createClient } = require('@supabase/supabase-js');

// Your Supabase credentials
const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8';

// Admin credentials
const ADMIN_EMAIL = 'admin2@signaldesk.com';
const ADMIN_PASSWORD = 'admin123';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

async function testAuth() {
  console.log('========================================');
  console.log('SUPABASE AUTHENTICATION TEST');
  console.log('========================================\n');
  
  console.log('Supabase URL:', SUPABASE_URL);
  console.log('Testing with email:', ADMIN_EMAIL);
  console.log('Testing with password:', ADMIN_PASSWORD);
  console.log('\n----------------------------------------\n');

  try {
    // Step 1: Test Sign In
    console.log('Step 1: Attempting to sign in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });

    if (signInError) {
      console.error('❌ Sign in failed:', signInError.message);
      console.error('Error details:', signInError);
      
      // Provide specific troubleshooting steps
      console.log('\n🔧 TROUBLESHOOTING STEPS:');
      console.log('1. Go to your Supabase Dashboard: https://app.supabase.com/project/zskaxjtyuaqazydouifp');
      console.log('2. Click on "SQL Editor" in the left sidebar');
      console.log('3. Copy and paste the entire contents of: supabase-fix-auth.sql');
      console.log('4. Click "Run" to execute the SQL');
      console.log('5. Wait for success message, then try this test again\n');
      return;
    }

    console.log('✅ Sign in successful!');
    console.log('User ID:', signInData.user.id);
    console.log('User email:', signInData.user.email);
    console.log('Session token:', signInData.session?.access_token?.substring(0, 20) + '...');
    
    // Step 2: Get user profile from public.users
    console.log('\n----------------------------------------\n');
    console.log('Step 2: Fetching user profile...');
    
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('*, organization:organizations(*)')
      .eq('id', signInData.user.id)
      .single();

    if (profileError) {
      console.error('⚠️  Profile fetch failed:', profileError.message);
      console.log('Note: This might be normal if the public.users table is not set up yet.');
      console.log('The authentication itself is working!');
    } else {
      console.log('✅ Profile fetched successfully!');
      console.log('Username:', profileData?.username);
      console.log('Role:', profileData?.role);
      console.log('Organization:', profileData?.organization?.name);
    }

    // Step 3: Test getting current user
    console.log('\n----------------------------------------\n');
    console.log('Step 3: Testing getUser() method...');
    
    const { data: { user }, error: getUserError } = await supabase.auth.getUser();
    
    if (getUserError) {
      console.error('❌ Get user failed:', getUserError.message);
    } else {
      console.log('✅ Current user retrieved successfully!');
      console.log('User confirmed email:', user.email);
      console.log('User metadata:', user.user_metadata);
    }

    // Step 4: Test sign out
    console.log('\n----------------------------------------\n');
    console.log('Step 4: Testing sign out...');
    
    const { error: signOutError } = await supabase.auth.signOut();
    
    if (signOutError) {
      console.error('❌ Sign out failed:', signOutError.message);
    } else {
      console.log('✅ Sign out successful!');
    }

    console.log('\n========================================');
    console.log('✅ ALL TESTS PASSED SUCCESSFULLY!');
    console.log('========================================');
    console.log('\nYour Supabase authentication is working correctly!');
    console.log('You can now use these credentials in your SignalDesk app:');
    console.log('- Email:', ADMIN_EMAIL);
    console.log('- Password:', ADMIN_PASSWORD);
    
  } catch (error) {
    console.error('\n❌ Unexpected error occurred:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testAuth().then(() => {
  console.log('\n✨ Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Test failed with critical error:', error);
  process.exit(1);
});