// Test Firecrawl v2 API with all the fixes we implemented

const FIRECRAWL_API_KEY = 'fc-3048810124b640eb99293880a4ab25d0'

async function testFirecrawlV2Fixed() {
  console.log('🔍 Testing Firecrawl v2 API with complete fixes...\n')

  // Test queries that should find Microsoft-Anthropic and other current news
  const testCases = [
    {
      query: 'Microsoft Anthropic Office 365 partnership',
      description: 'Microsoft-Anthropic partnership news',
      expectedDomains: ['reuters.com', 'techcrunch.com', 'bloomberg.com']
    },
    {
      query: 'AI regulation chatbot safety guidelines latest',
      description: 'Latest AI regulation news',
      expectedDomains: ['reuters.com', 'ft.com', 'theverge.com']
    },
    {
      query: 'OpenAI latest news announcements',
      description: 'OpenAI recent updates',
      expectedDomains: ['techcrunch.com', 'theverge.com', 'reuters.com']
    }
  ]

  for (const testCase of testCases) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`📝 Test: ${testCase.description}`)
    console.log(`Query: "${testCase.query}"`)
    console.log('─'.repeat(60))

    try {
      const response = await fetch('https://api.firecrawl.dev/v2/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: testCase.query,
          sources: ['web', 'news'], // NEW: Multi-source search
          limit: 10,
          tbs: 'qdr:w', // Past week for recent news
          scrapeOptions: {
            formats: ['markdown'],
            onlyMainContent: true, // NEW: Filter out navigation
            maxAge: 86400000 // NEW: 24 hours for fresh content
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

      // NEW: Parse multi-source response structure
      const webResults = data.data?.web || []
      const newsResults = data.data?.news || []
      const allResults = [...webResults, ...newsResults]

      console.log(`\n✅ Results found:`)
      console.log(`   - Web results: ${webResults.length}`)
      console.log(`   - News results: ${newsResults.length}`)
      console.log(`   - Total: ${allResults.length}`)

      if (allResults.length > 0) {
        console.log('\nTop Results:')

        // Check news results first
        if (newsResults.length > 0) {
          console.log('\n📰 NEWS SOURCES:')
          newsResults.slice(0, 3).forEach((result, i) => {
            console.log(`${i + 1}. ${result.title || 'No title'}`)
            console.log(`   URL: ${result.url}`)
            console.log(`   Type: NEWS`)

            // Check for expected domains
            const domain = new URL(result.url).hostname.replace('www.', '')
            if (testCase.expectedDomains.some(d => domain.includes(d))) {
              console.log(`   ✅ From trusted news source: ${domain}`)
            }

            // Check for key terms
            const content = (result.markdown || '').toLowerCase()
            if (testCase.query.toLowerCase().includes('microsoft') && content.includes('anthropic')) {
              console.log('   ⭐ FOUND: Microsoft-Anthropic mention!')
            }
          })
        }

        // Then show web results
        if (webResults.length > 0) {
          console.log('\n🌐 WEB SOURCES:')
          webResults.slice(0, 3).forEach((result, i) => {
            console.log(`${i + 1}. ${result.title || 'No title'}`)
            console.log(`   URL: ${result.url}`)
            console.log(`   Type: WEB`)
          })
        }

        // Check for data quality
        console.log('\n📊 Data Quality Check:')
        const hasNavigation = allResults.some(r =>
          (r.markdown || '').includes('Sign in') ||
          (r.markdown || '').includes('Menu') ||
          (r.markdown || '').includes('Cookie')
        )
        console.log(`   Navigation garbage: ${hasNavigation ? '❌ Found' : '✅ Clean'}`)

        const freshContent = allResults.filter(r => {
          const content = (r.markdown || '').toLowerCase()
          return content.includes('2024') || content.includes('2025') ||
                 content.includes('today') || content.includes('yesterday')
        })
        console.log(`   Fresh content: ${freshContent.length}/${allResults.length} results`)
      } else {
        console.log('❌ No results found!')
      }

    } catch (error) {
      console.log(`❌ Error: ${error.message}`)
    }
  }

  // Final verification
  console.log(`\n\n${'='.repeat(60)}`)
  console.log('📋 IMPLEMENTATION CHECKLIST:')
  console.log('✅ sources: ["web", "news"] parameter added')
  console.log('✅ maxAge: 86400000 for fresh content')
  console.log('✅ onlyMainContent: true to filter navigation')
  console.log('✅ Multi-source response parsing (data.web, data.news)')
  console.log('✅ Time-based filtering with tbs parameter')
  console.log(`\n✨ All critical fixes have been implemented!`)
}

testFirecrawlV2Fixed()