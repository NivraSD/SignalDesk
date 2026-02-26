// Test what Firecrawl actually returns for article dates

const FIRECRAWL_API_KEY = 'fc-3048810124b640eb99293880a4ab25d0'
const FIRECRAWL_BASE_URL = 'https://api.firecrawl.dev/v2'

async function testFirecrawlDates() {
  console.log('\n🔍 Testing Firecrawl Date Handling\n')
  console.log('=' .repeat(60))

  const queries = ['xAI Grok 5', 'Microsoft Nebius', 'OpenAI']

  for (const query of queries) {
    console.log(`\n📋 Testing query: "${query}"`)
    console.log('-'.repeat(60))

    try {
      const response = await fetch(`${FIRECRAWL_BASE_URL}/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query,
          sources: ['web', 'news'],
          limit: 5,
          tbs: 'qdr:d', // Last 24 hours
          scrapeOptions: {
            formats: ['markdown'],
            onlyMainContent: true
          }
        })
      })

      if (!response.ok) {
        console.log(`❌ Search failed: ${response.status}`)
        continue
      }

      const data = await response.json()
      const webResults = data.data?.web || []
      const newsResults = data.data?.news || []
      const allResults = [...webResults, ...newsResults]

      console.log(`Found ${allResults.length} results`)

      allResults.slice(0, 5).forEach((result, i) => {
        console.log(`\n${i + 1}. ${result.title?.substring(0, 80)}`)
        console.log(`   URL: ${result.url?.substring(0, 80)}`)
        console.log(`   publishedTime: ${result.publishedTime || 'NOT PROVIDED'}`)
        console.log(`   publishDate: ${result.publishDate || 'NOT PROVIDED'}`)
        console.log(`   date: ${result.date || 'NOT PROVIDED'}`)
        console.log(`   score: ${result.score || 'N/A'}`)

        // Show ALL date-related fields
        const dateFields = Object.keys(result).filter(k =>
          k.toLowerCase().includes('date') ||
          k.toLowerCase().includes('time') ||
          k.toLowerCase().includes('published')
        )
        if (dateFields.length > 0) {
          console.log(`   All date fields: ${dateFields.join(', ')}`)
        }
      })

    } catch (err) {
      console.log(`❌ Error: ${err.message}`)
    }
  }

  console.log('\n' + '='.repeat(60))
}

testFirecrawlDates().catch(console.error)
