// Check what data is in niv_strategies
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://zskaxjtyuaqazydouifp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'

const supabase = createClient(supabaseUrl, supabaseKey)

const openaiOrgId = '7a2835cb-11ee-4512-acc3-b6caf8eb03ff'

async function checkNIVStrategies() {
  console.log('🔍 Checking niv_strategies data for OpenAI...\n')

  const { data, error } = await supabase
    .from('niv_strategies')
    .select('*')
    .eq('organization_id', openaiOrgId)
    .order('created_at', { ascending: false })
    .limit(2)

  if (error) {
    console.log('❌ Error:', error.message)
    return
  }

  if (!data || data.length === 0) {
    console.log('❌ No strategies found for OpenAI')
    return
  }

  console.log(`✅ Found ${data.length} strategies\n`)

  const strategy = data[0]
  console.log('Latest strategy:')
  console.log(`  Title: ${strategy.title}`)
  console.log(`  Created: ${strategy.created_at}`)
  console.log(`  Has research_sources: ${!!strategy.research_sources}`)
  console.log(`  Has stakeholders: ${!!strategy.stakeholders}`)
  console.log(`  Has competitors: ${!!strategy.competitors}`)
  console.log(`  Has key_findings: ${!!strategy.research_key_findings}`)

  // Check what fields might have stakeholder info
  if (strategy.stakeholders) {
    console.log(`\n  📊 Stakeholders data type: ${typeof strategy.stakeholders}`)
    if (Array.isArray(strategy.stakeholders)) {
      console.log(`  Stakeholders count: ${strategy.stakeholders.length}`)
      if (strategy.stakeholders.length > 0) {
        console.log(`  Sample stakeholder:`, strategy.stakeholders[0])
      }
    } else {
      console.log(`  Stakeholders:`, JSON.stringify(strategy.stakeholders).substring(0, 200))
    }
  }

  if (strategy.competitors) {
    console.log(`\n  🏢 Competitors data type: ${typeof strategy.competitors}`)
    if (Array.isArray(strategy.competitors)) {
      console.log(`  Competitors count: ${strategy.competitors.length}`)
      if (strategy.competitors.length > 0) {
        console.log(`  Sample competitor:`, strategy.competitors[0])
      }
    }
  }

  console.log('\n  All columns:', Object.keys(strategy))
}

checkNIVStrategies().catch(console.error)
