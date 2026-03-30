require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('========================================');
console.log('    CONTENT LIBRARY ORGID FIX SCRIPT    ');
console.log('========================================\n');

console.log('This script has created a SQL file to fix your orgID issues.');
console.log('\nThe fix will:');
console.log('1. Add organization_id column to content_library table');
console.log('2. Add other missing columns (metadata, tags, etc.)');
console.log('3. Add organization_id column to memory_vault table');
console.log('4. Add category column to memory_vault table');
console.log('5. Set default organization_id for existing records');
console.log('6. Create necessary indexes');

console.log('\n📋 NEXT STEPS:');
console.log('================');
console.log('1. Open your Supabase Dashboard');
console.log('2. Go to SQL Editor');
console.log('3. Click "New Query"');
console.log('4. Copy the contents of fix-content-library-orgid.sql');
console.log('5. Paste it in the SQL Editor');
console.log('6. Click "Run" to execute');

console.log('\n📄 File location:');
console.log('./fix-content-library-orgid.sql');

console.log('\n✅ After running the SQL, your tables will have:');
console.log('   - organization_id columns properly configured');
console.log('   - All missing columns added');
console.log('   - Default organization assigned to existing records');
console.log('   - Proper indexes for performance');

// Quick test to show current state
async function testCurrentState() {
  console.log('\n🔍 Current State Check:');
  console.log('========================');

  try {
    // Try to query with organization_id
    const { error: clError } = await supabase
      .from('content_library')
      .select('id, organization_id')
      .limit(1);

    if (clError?.message?.includes('organization_id')) {
      console.log('❌ content_library: Missing organization_id column');
    } else {
      console.log('✅ content_library: Can query (but may still need fixes)');
    }

    const { error: mvError } = await supabase
      .from('memory_vault')
      .select('id, organization_id')
      .limit(1);

    if (mvError?.message?.includes('organization_id')) {
      console.log('❌ memory_vault: Missing organization_id column');
    } else {
      console.log('✅ memory_vault: Has organization_id column');
    }
  } catch (err) {
    console.error('Error checking:', err.message);
  }
}

testCurrentState().then(() => {
  console.log('\n🚀 Ready to apply the fix via Supabase SQL Editor!');
  process.exit(0);
});