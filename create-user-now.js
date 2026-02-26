const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zskaxjtyuaqazydouifp.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.l0pV2gqVZlSAYXr8R9RqLZ-RbjCfTD5Wz-Bqn9x6Mcc';

// Create Supabase client with service key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  console.log('Creating admin user...');
  
  try {
    // Create the auth user
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'admin@signaldesk.com',
      password: 'admin123',
      email_confirm: true
    });

    if (error) {
      console.error('Error creating user:', error);
      return;
    }

    console.log('✅ User created successfully!');
    console.log('Email: admin@signaldesk.com');
    console.log('Password: admin123');
    console.log('User ID:', data.user.id);
    
    // Create user profile
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: data.user.id,
        email: 'admin@signaldesk.com',
        name: 'Admin User',
        organization_id: 'demo-org',
        role: 'admin'
      });
    
    if (profileError) {
      console.log('Note: Profile table may not exist or have different structure');
    } else {
      console.log('✅ User profile created!');
    }
    
    console.log('\n🎉 YOU CAN NOW LOGIN WITH:');
    console.log('Email: admin@signaldesk.com');
    console.log('Password: admin123');
    
  } catch (err) {
    console.error('Failed:', err);
  }
  
  process.exit(0);
}

createAdminUser();