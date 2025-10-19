const fs = require('fs');
const path = require('path');

// Read SQL file
const sqlFile = fs.readdirSync('supabase/migrations')
  .filter(f => f.includes('journalist_registry'))
  .sort()
  .reverse()[0];

if (!sqlFile) {
  console.error('❌ journalist_registry migration file not found');
  process.exit(1);
}

const sql = fs.readFileSync(`supabase/migrations/${sqlFile}`, 'utf8');

console.log('📝 Creating journalist_registry table...');
console.log('SQL File:', sqlFile);
console.log('\n' + sql);
console.log('\n\n⚠️  Please run this SQL manually in Supabase SQL Editor:');
console.log('👉 https://supabase.com/dashboard/project/zskaxjtyuaqazydouifp/sql/new');
console.log('\n✅ Or use: npx supabase db push (and answer Y when prompted)');
