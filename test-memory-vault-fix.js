// Test Memory Vault with UUID fix

async function testMemoryVault() {
  console.log('🧪 Testing Memory Vault with UUID fix...')

  // Test 1: Load all strategies (wildcard)
  console.log('\n📊 Test 1: Load all strategies...')
  try {
    const response = await fetch('http://localhost:3000/api/supabase/functions/niv-memory-vault?action=recent&organizationId=', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    const data = await response.json()
    if (data.success) {
      console.log(`✅ Loaded ${data.data?.length || 0} strategies`)
      if (data.data?.length > 0) {
        console.log('Sample strategy:', {
          id: data.data[0].id,
          title: data.data[0].title,
          organization_id: data.data[0].organization_id
        })
      }
    } else {
      console.log('❌ Failed:', data.error)
    }
  } catch (error) {
    console.log('❌ Error:', error.message)
  }

  // Test 2: Save with default UUID
  console.log('\n📊 Test 2: Save strategy with default UUID...')
  const DEFAULT_ORG_UUID = '00000000-0000-0000-0000-000000000000'

  try {
    const response = await fetch('http://localhost:3000/api/supabase/functions/niv-memory-vault?action=save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        strategy: {
          title: 'Test Strategy - UUID Fix',
          strategy_objective: 'Test that UUID conversion works',
          organization_id: DEFAULT_ORG_UUID,
          research_sources: [],
          research_key_findings: ['UUID validation fixed'],
          strategy_approach: 'Direct UUID usage',
          status: 'draft'
        }
      })
    })

    const data = await response.json()
    if (data.success) {
      console.log('✅ Strategy saved with UUID:', data.data.id)
      console.log('Organization ID:', data.data.organization_id)
    } else {
      console.log('❌ Failed:', data.error)
    }
  } catch (error) {
    console.log('❌ Error:', error.message)
  }

  // Test 3: Save with legacy "1" (should be converted)
  console.log('\n📊 Test 3: Save with legacy "1" organizationId...')

  try {
    const response = await fetch('http://localhost:3000/api/supabase/functions/niv-memory-vault?action=save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        strategy: {
          title: 'Test Strategy - Legacy 1',
          strategy_objective: 'Test that "1" gets converted to UUID',
          organization_id: '1', // This should be converted by the hook
          research_sources: [],
          research_key_findings: ['Legacy ID conversion test'],
          strategy_approach: 'Auto-conversion',
          status: 'draft'
        }
      })
    })

    const data = await response.json()
    if (data.success) {
      console.log('✅ Strategy saved with converted UUID')
      console.log('Organization ID:', data.data.organization_id)
    } else {
      console.log('❌ Failed (expected if direct save):', data.error)
      console.log('Note: The hook should handle this conversion, not the edge function')
    }
  } catch (error) {
    console.log('❌ Error:', error.message)
  }

  console.log('\n✨ Memory Vault tests complete!')
  console.log('The Memory Vault UI should now show strategies when opened.')
}

testMemoryVault()