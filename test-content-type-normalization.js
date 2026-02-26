const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://zskaxjtyuaqazydouifp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'
)

async function testNormalization() {
  console.log('🧪 Testing Content Type Normalization Fix\n')

  // Get the latest blueprint with case studies and white papers
  const { data: blueprint, error } = await supabase
    .from('campaign_blueprints')
    .select('id, session_id, blueprint_data, created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !blueprint) {
    console.error('❌ Could not fetch latest blueprint:', error)
    return
  }

  console.log(`📋 Latest Blueprint: ${blueprint.id}`)
  console.log(`   Session ID: ${blueprint.session_id}`)
  console.log(`   Created: ${blueprint.created_at}\n`)

  // Check what content types are defined in the blueprint
  console.log('📊 Content Types Defined in Blueprint:\n')

  const phases = ['phase1_awareness', 'phase2_consideration', 'phase3_conversion', 'phase4_advocacy']
  phases.forEach((phaseKey, idx) => {
    const phase = blueprint.blueprint_data.part3_tacticalOrchestration?.[phaseKey]
    if (phase?.pillar1_ownedActions) {
      console.log(`Phase ${idx + 1} (${phaseKey.split('_')[1]}):`)
      phase.pillar1_ownedActions.forEach((action, i) => {
        console.log(`  ${i + 1}. "${action.contentType}" for ${action.targetStakeholder}`)
      })
      console.log('')
    }
  })

  // Now check what content types are in the content_library after generation
  console.log('\n📦 Content Types in Memory Vault (content_library):\n')

  const { data: contentTypes } = await supabase
    .from('content_library')
    .select('content_type')
    .order('created_at', { ascending: false })
    .limit(50)

  if (contentTypes) {
    const typeCounts = {}
    contentTypes.forEach(item => {
      typeCounts[item.content_type] = (typeCounts[item.content_type] || 0) + 1
    })

    Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`)
      })
  }

  // Expected normalized types after fix
  console.log('\n✅ Expected Normalized Types:')
  console.log('  "Case study" → "case-study"')
  console.log('  "White paper" → "white-paper"')
  console.log('  "Social media post" → "social-post"')
  console.log('  "ROI calculator tool" → "thought-leadership" (temporary mapping)')

  // Check if we now have case-study and white-paper content
  const { data: caseStudies } = await supabase
    .from('content_library')
    .select('*')
    .eq('content_type', 'case-study')
    .limit(1)

  const { data: whitePapers } = await supabase
    .from('content_library')
    .select('*')
    .eq('content_type', 'white-paper')
    .limit(1)

  console.log('\n🔍 Verification Results:')
  console.log(`  Case Studies in DB: ${caseStudies?.length || 0} ${caseStudies?.length > 0 ? '✅' : '❌'}`)
  console.log(`  White Papers in DB: ${whitePapers?.length || 0} ${whitePapers?.length > 0 ? '✅' : '❌'}`)

  if (caseStudies?.length === 0 || whitePapers?.length === 0) {
    console.log('\n⚠️ Note: If counts are 0, you need to re-run campaign execution with the latest blueprint')
    console.log('   The fix will work on the NEXT campaign execution, not retroactively')
  }
}

testNormalization()
