const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
)

async function checkDates() {
  const { data } = await supabase
    .from('fireplexity_monitoring')
    .select('results, executed_at')
    .eq('organization_id', 'OpenAI')
    .order('executed_at', { ascending: false })
    .limit(1)
    .single()

  console.log('Record executed at:', data.executed_at)
  console.log('\nChecking article dates:\n')

  const now = new Date()
  const cutoff24h = new Date(now - 24 * 60 * 60 * 1000)

  console.log('Current time:', now.toISOString())
  console.log('24h cutoff:', cutoff24h.toISOString())
  console.log()

  data.results.slice(0, 10).forEach((result, idx) => {
    const published = result.published || result.date || result.published_at
    const pubDate = published ? new Date(published) : null

    console.log(`${idx + 1}. ${result.title?.substring(0, 60)}`)
    console.log(`   Published field: ${published || 'MISSING'}`)
    if (pubDate) {
      console.log(`   Parsed date: ${pubDate.toISOString()}`)
      console.log(`   Within 24h: ${pubDate > cutoff24h}`)
    }
    console.log()
  })
}

checkDates()
