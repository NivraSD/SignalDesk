#!/usr/bin/env node

/**
 * Test script for Fireplexity integration
 * Tests caching, search strategies, and NIV integration
 */

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.gJ5X9LQqR3oGxRv4NCA7l-gDL3EQlFqG0OWU-oYRJE0'

async function testFireplexity() {
  console.log('🧪 Testing Fireplexity Integration...\n')

  const testQueries = [
    {
      name: 'Basic Search',
      query: 'What is happening with Tesla today?',
      module: 'intelligence',
      expected: 'Should return search results or cached data'
    },
    {
      name: 'Urgent Query',
      query: 'Breaking news about OpenAI crisis',
      module: 'intelligence',
      expected: 'Should trigger web_search strategy'
    },
    {
      name: 'Opportunity Search',
      query: 'Find PR opportunities in AI regulation',
      module: 'opportunities',
      expected: 'Should use hybrid_search strategy'
    },
    {
      name: 'Journalist Search',
      query: 'Who is writing about electric vehicles?',
      module: 'execute',
      expected: 'Should search for journalists'
    },
    {
      name: 'Cached Query',
      query: 'What is happening with Tesla today?', // Same as first
      module: 'intelligence',
      expected: 'Should return cached result'
    }
  ]

  for (const test of testQueries) {
    console.log(`\n📋 Test: ${test.name}`)
    console.log(`   Query: "${test.query}"`)
    console.log(`   Module: ${test.module}`)

    try {
      const startTime = Date.now()

      const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-fireplexity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          query: test.query,
          module: test.module,
          useCache: true,
          context: { organization: 'Tesla' }
        })
      })

      const elapsed = Date.now() - startTime

      if (!response.ok) {
        console.log(`   ❌ Failed: ${response.status} ${response.statusText}`)
        const error = await response.text()
        console.log(`   Error: ${error}`)
        continue
      }

      const data = await response.json()

      console.log(`   ✅ Success in ${elapsed}ms`)
      console.log(`   Strategy: ${data.strategy || 'unknown'}`)
      console.log(`   Cached: ${data.cached ? 'Yes' : 'No'}`)

      if (data.cached && data.cacheAge) {
        console.log(`   Cache Age: ${data.cacheAge} minutes`)
      }

      if (data.mock) {
        console.log(`   ⚠️  Using mock data (development mode)`)
      }

      if (data.summary) {
        console.log(`   Summary: ${data.summary.substring(0, 100)}...`)
      } else if (data.results?.length) {
        console.log(`   Results: ${data.results.length} items found`)
      } else if (data.message) {
        console.log(`   Message: ${data.message}`)
      }

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`)
    }
  }

  console.log('\n\n📊 Testing Usage Statistics...')

  try {
    // Get usage stats (this would normally be done through the service)
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    const { data, error } = await supabase
      .from('fireplexity_usage')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(5)

    if (error) {
      console.log(`   ⚠️  Could not fetch usage stats: ${error.message}`)
    } else if (data && data.length > 0) {
      console.log(`   Found ${data.length} recent usage entries:`)
      data.forEach(entry => {
        console.log(`   - ${entry.module}: ${entry.strategy} ($${entry.cost || 0})`)
      })
    } else {
      console.log('   No usage data yet')
    }
  } catch (error) {
    console.log(`   ⚠️  Stats check skipped: ${error.message}`)
  }

  console.log('\n✨ Fireplexity testing complete!')
}

// Run the test
testFireplexity().catch(console.error)