const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
  console.log('🔍 Checking real_time_intelligence_briefs table schema...\n')

  try {
    // Try to query the table structure by doing a select with limit 0
    const { data, error } = await supabase
      .from('real_time_intelligence_briefs')
      .select('*')
      .limit(1)

    if (error) {
      console.error('❌ Error querying table:', error.message)
      return
    }

    if (data && data.length > 0) {
      console.log('✅ Table exists with columns:')
      console.log(Object.keys(data[0]).join(', '))
      console.log('\n📊 Sample record:')
      console.log(JSON.stringify(data[0], null, 2))
    } else {
      console.log('⚠️ Table exists but is empty')
      console.log('\nLet me try to insert a test record to see what columns are expected...')

      const { data: insertData, error: insertError } = await supabase
        .from('real_time_intelligence_briefs')
        .insert({
          organization_id: '7a2835cb-11ee-4512-acc3-b6caf8eb03ff',
          time_window: '6hours',
          breaking_summary: 'Test summary',
          critical_alerts: [],
          watch_list: [],
          articles_analyzed: 0,
          new_articles_count: 0,
          opportunities_count: 0,
          crises_count: 0,
          crisis_risk_level: 0,
          top_articles: [],
          synthesis_data: {},
          execution_time_ms: 0
        })
        .select()
        .single()

      if (insertError) {
        console.error('❌ Insert error:', insertError.message)
        console.log('\nThis tells us what columns are missing or incorrect')
      } else {
        console.log('✅ Test insert successful!')
        console.log('Columns:', Object.keys(insertData))

        // Clean up test record
        await supabase
          .from('real_time_intelligence_briefs')
          .delete()
          .eq('id', insertData.id)
        console.log('🗑️ Test record cleaned up')
      }
    }
  } catch (err) {
    console.error('❌ Error:', err.message)
  }
}

checkSchema()
