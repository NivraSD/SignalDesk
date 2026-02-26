const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function checkSchema() {
  console.log('Checking content_library table structure...')
  
  // Try to query the table to see its structure
  const { data, error } = await supabase
    .from('content_library')
    .select('*')
    .limit(1)
  
  if (error) {
    console.error('Error querying table:', error)
    return
  }
  
  console.log('Sample row structure:', data[0] ? Object.keys(data[0]) : 'No data')
  
  // Check if folder column exists
  if (data[0]) {
    console.log('Has folder column:', 'folder' in data[0])
    console.log('Folder value:', data[0].folder)
  }
}

checkSchema()
