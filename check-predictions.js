import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
)

// Check predictions table
const { data, error } = await supabase
  .from('predictions')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(10)

if (error) {
  console.error('❌ Error:', error)
} else if (!data || data.length === 0) {
  console.log('📭 No predictions found')
} else {
  console.log(`✅ Found ${data.length} predictions:\n`)
  data.forEach((pred, idx) => {
    console.log(`${idx + 1}. ${pred.title}`)
    console.log(`   Category: ${pred.category}, Confidence: ${pred.confidence_score}%, Impact: ${pred.impact_level}`)
    console.log(`   Org: ${pred.organization_id}`)
    console.log('')
  })
}
