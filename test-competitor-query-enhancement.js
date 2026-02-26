// Test how NIV enhances competitor queries with organization context

// Simulate the enhanceQueryWithContext function
function enhanceQueryWithContext(query, context) {
  const queryLower = query.toLowerCase()
  let enhancedQuery = query

  // Add organization name if not present
  if (!queryLower.includes(context.organizationName.toLowerCase())) {
    // Replace first-person references
    if (queryLower.includes('we') || queryLower.includes('our') || queryLower.includes('us')) {
      enhancedQuery = enhancedQuery.replace(/\b(we|our|us)\b/gi, context.organizationName)
    }
  }

  // Enhanced competitor detection - more patterns
  const competitorPatterns = [
    'competitor',
    'competitors',
    'rival',
    'rivals',
    'versus',
    'vs',
    'compared',
    'competition',
    'competing'
  ]

  const hasCompetitorIntent = competitorPatterns.some(pattern => queryLower.includes(pattern))

  if (hasCompetitorIntent) {
    // For "competitor news", we need to list actual competitor names
    const topCompetitors = context.directCompetitors.slice(0, 5)

    // Build a more effective search query
    if (queryLower.includes('competitor news')) {
      // Replace "competitor" with actual names for better search
      enhancedQuery = enhancedQuery.replace(/competitor(s)?/gi, '')
      enhancedQuery = `${topCompetitors.join(' OR ')} ${enhancedQuery.replace(/\s+/g, ' ').trim()}`
    } else if (!topCompetitors.some(comp => queryLower.includes(comp.toLowerCase()))) {
      // Add competitors if not already mentioned
      enhancedQuery += ` (${topCompetitors.join(' OR ')})`
    }
  }

  // Also check for industry news requests
  if (queryLower.includes('industry news') || queryLower.includes('market news')) {
    // Add both organization and competitors for comprehensive coverage
    const allEntities = [context.organizationName, ...context.directCompetitors.slice(0, 3)]
    enhancedQuery = `${allEntities.join(' OR ')} ${enhancedQuery}`
  }

  return enhancedQuery
}

// Test with OpenAI context
const openAIContext = {
  organizationName: 'OpenAI',
  directCompetitors: ['Anthropic', 'Google DeepMind', 'Microsoft AI', 'Meta AI', 'xAI'],
  indirectCompetitors: ['Amazon', 'Apple', 'Nvidia']
}

// Test cases
const testQueries = [
  'competitor news from last 24 hours',
  'what are our competitors doing',
  'latest announcements from rivals',
  'industry news this week',
  'Microsoft vs OpenAI comparison',
  'competitive landscape updates',
  'market news about AI companies',
  'what is Anthropic announcing'
]

console.log('TESTING QUERY ENHANCEMENT FOR NIV')
console.log('=' .repeat(60))
console.log(`Organization: ${openAIContext.organizationName}`)
console.log(`Competitors: ${openAIContext.directCompetitors.join(', ')}`)
console.log('=' .repeat(60))

testQueries.forEach(query => {
  const enhanced = enhanceQueryWithContext(query, openAIContext)
  console.log('\nOriginal:', query)
  console.log('Enhanced:', enhanced)

  if (enhanced === query) {
    console.log('⚠️  NO CHANGE - Query not enhanced!')
  } else {
    console.log('✅ Query successfully enhanced with competitor context')
  }
})

// Show what the ideal search query should be
console.log('\n' + '=' .repeat(60))
console.log('IDEAL SEARCH QUERY EXAMPLES:')
console.log('=' .repeat(60))
console.log('\nFor "competitor news from last 24 hours":')
console.log('Should become: "Anthropic OR Google DeepMind OR Microsoft AI OR Meta AI OR xAI news from last 24 hours"')

console.log('\nFor "what are our competitors doing":')
console.log('Should become: "what are OpenAI competitors doing (Anthropic OR Google DeepMind OR Microsoft AI OR Meta AI OR xAI)"')

console.log('\nThis ensures Firecrawl searches for ACTUAL company names, not the word "competitor"!')