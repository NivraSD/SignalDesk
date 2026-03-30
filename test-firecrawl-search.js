// Test Firecrawl search API directly to see what results we get

const FIRECRAWL_API_KEY = 'fc-3048810124b640eb99293880a4ab25d0'

async function testFirecrawlSearch() {
  console.log('🔍 Testing Firecrawl search API directly...\n')

  // Test queries that should find the Microsoft-Anthropic news
  const queries = [
    'Microsoft Anthropic Office 365',
    'Microsoft using Anthropic AI',
    'Microsoft shifts from OpenAI to Anthropic',
    '"Microsoft" "Anthropic" partnership 2024',
    'site:reuters.com Microsoft Anthropic'
  ]

  for (const query of queries) {
    console.log(`\n📝 Testing query: "${query}"`)
    console.log('─'.repeat(60))

    try {
      const response = await fetch('https://api.firecrawl.dev/v2/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: query,
          limit: 10,
          scrapeOptions: {
            formats: ['markdown']
          }
        })
      })

      if (!response.ok) {
        console.log(`❌ Search failed: ${response.status}`)
        const error = await response.text()
        console.log('Error:', error)
        continue
      }

      const data = await response.json()

      // Debug: Show the actual response structure
      console.log('Response structure:', Object.keys(data))
      console.log('data.data type:', typeof data.data, Array.isArray(data.data) ? 'array' : 'not array')

      // Try different possible result locations
      let results = []
      if (Array.isArray(data.data)) {
        results = data.data
      } else if (data.data && Array.isArray(data.data.results)) {
        results = data.data.results
      } else if (data.results) {
        results = data.results
      }

      console.log(`✅ Found ${results.length} results`)

      // If still no results, show full response
      if (results.length === 0) {
        console.log('Full response:', JSON.stringify(data, null, 2).substring(0, 500))
      }

      if (results.length > 0) {
        console.log('\nTop 5 Results:')
        results.slice(0, 5).forEach((result, i) => {
          console.log(`\n${i + 1}. URL: ${result.url}`)

          // Try to extract title from markdown
          let title = 'No title'
          if (result.markdown) {
            const lines = result.markdown.split('\n')
            for (const line of lines) {
              const trimmed = line.trim()
              if (trimmed.length > 10 && trimmed.length < 200 && !trimmed.startsWith('http')) {
                title = trimmed.substring(0, 100)
                break
              }
            }
          }
          console.log(`   Title: ${title}`)

          // Check if this is the Reuters article we're looking for
          if (result.url.includes('reuters.com') &&
              (result.url.includes('microsoft') || result.url.includes('anthropic'))) {
            console.log('   ⭐ POTENTIAL MATCH: Reuters article about Microsoft/Anthropic')
          }

          // Check content for key terms
          const content = (result.markdown || '').toLowerCase()
          const hasRelevantContent =
            content.includes('microsoft') &&
            content.includes('anthropic') &&
            (content.includes('office') || content.includes('365'))

          if (hasRelevantContent) {
            console.log('   ✨ CONTENT MATCH: Contains Microsoft, Anthropic, and Office/365')
          }
        })
      } else {
        console.log('No results found - this might be the problem!')
      }

    } catch (error) {
      console.log(`❌ Error: ${error.message}`)
    }
  }

  // Also test if we can access the specific Reuters URL directly
  console.log('\n\n' + '='.repeat(60))
  console.log('📰 Testing direct access to Reuters article...')
  console.log('URL: https://www.reuters.com/business/microsoft-use-some-ai-anthropic-shift-openai-information-reports-2025-09-09/')

  try {
    const response = await fetch('https://api.firecrawl.dev/v2/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: 'https://www.reuters.com/business/microsoft-use-some-ai-anthropic-shift-openai-information-reports-2025-09-09/',
        formats: ['markdown'],
        onlyMainContent: true
      })
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success && data.data) {
        console.log('✅ Successfully scraped Reuters article!')
        const content = data.data.markdown || ''
        console.log(`Content length: ${content.length} characters`)

        // Extract first few lines
        const preview = content.substring(0, 500)
        console.log('\nContent preview:')
        console.log(preview)
      }
    } else {
      console.log('❌ Failed to scrape Reuters article:', response.status)
    }
  } catch (error) {
    console.log('❌ Scraping error:', error.message)
  }
}

testFirecrawlSearch()