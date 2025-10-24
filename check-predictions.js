import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Check predictions table
const { data, error } = await supabase
  .from('predictions')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(5)

console.log('Recent predictions:')
console.log(JSON.stringify(data, null, 2))
if (error) console.error('Error:', error)
