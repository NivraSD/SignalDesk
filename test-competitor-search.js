// Test Firecrawl search with time filters for competitor news

const FIRECRAWL_API_KEY = 'fc-3048810124b640eb99293880a4ab25d0'

async function testCompetitorSearch() {
  console.log('🔍 Testing Firecrawl competitor search with time filters...\n')

  // Test different time-based searches
  const searches = [
    {
      query: 'OpenAI latest news',
      tbs: 'qdr:d',  // Past 24 hours
      description: 'OpenAI news from past 24 hours'
    },
    {
      query: 'Anthropic Claude AI announcements',
      tbs: 'qdr:w',  // Past week
      description: 'Anthropic news from past week'
    },
    {
      query: 'Microsoft AI news',
      tbs: 'qdr:d',  // Past 24 hours
      description: 'Microsoft AI news from past 24 hours'
    },
    {
      query: 'Google Gemini latest updates',
      tbs: 'qdr:w',
      description: 'Google Gemini updates from past week'
    }
  ]

  for (const search of searches) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`📝 ${search.description}`)
    console.log(`Query: "${search.query}"`)
    console.log(`Time filter: ${search.tbs}`)
    console.log('─'.repeat(60))

    try {
      const response = await fetch('https://api.firecrawl.dev/v2/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: search.query,
          limit: 5,
          tbs: search.tbs,  // Add time-based search parameter
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
      const results = data.data?.web || data.data || []

      console.log(`\n✅ Found ${results.length} results`)

      if (results.length > 0) {
        console.log('\nResults:')
        results.forEach((result, i) => {
          console.log(`\n${i + 1}. ${result.title || 'No title'}`)
          console.log(`   URL: ${result.url}`)
          console.log(`   Description: ${(result.description || '').substring(0, 150)}...`)

          // Check if markdown contains actual content
          if (result.markdown) {
            const wordCount = result.markdown.split(/\s+/).length
            console.log(`   Content: ${wordCount} words`)

            // Extract date if present in content
            const datePatterns = [
              /(\d{1,2})\s+hours?\s+ago/i,
              /today/i,
              /yesterday/i,
              /(\d{4}-\d{2}-\d{2})/
            ]

            for (const pattern of datePatterns) {
              const match = result.markdown.match(pattern)
              if (match) {
                console.log(`   📅 Date indicator found: "${match[0]}"`)
                break
              }
            }
          }
        })
      } else {
        console.log('No results found - time filter might be too restrictive')
      }

    } catch (error) {
      console.log(`❌ Error: ${error.message}`)
    }
  }

  // Also test WITHOUT time filter to compare
  console.log(`\n\n${'='.repeat(60)}`)
  console.log('📊 COMPARISON: Same search WITHOUT time filter')
  console.log('─'.repeat(60))

  try {
    const response = await fetch('https://api.firecrawl.dev/v2/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: 'OpenAI latest news',
        limit: 5,
        // NO tbs parameter - should get all results
        scrapeOptions: {
          formats: ['markdown']
        }
      })
    })

    if (response.ok) {
      const data = await response.json()
      const results = data.data?.web || []
      console.log(`\n✅ Without time filter: ${results.length} results`)

      if (results.length > 0) {
        console.log('\nFirst 3 results:')
        results.slice(0, 3).forEach((result, i) => {
          console.log(`${i + 1}. ${result.title || 'No title'}`)
        })
      }
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`)
  }
}

testCompetitorSearch()