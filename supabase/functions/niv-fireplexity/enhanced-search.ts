// Enhanced search strategies based on search-specialist agent expertise

export interface SearchStrategy {
  queries: string[]           // Multiple query variations
  domains?: string[]          // Specific domains to target
  timeframe?: string         // Date range (e.g., "after:2024-09-01") - deprecated
  tbs?: string              // Firecrawl time-based search parameter (qdr:h, qdr:d, qdr:w, etc.)
  mustInclude?: string[]     // Terms that must appear
  mustExclude?: string[]     // Terms to exclude
}

// Generate multiple query variations for better coverage
export function generateQueryVariations(baseQuery: string): string[] {
  const queryLower = baseQuery.toLowerCase()
  const variations: string[] = [baseQuery]

  // Detect entities (companies, people, products)
  const entities = baseQuery.match(/\b[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*\b/g) || []

  // Partnership/Collaboration queries
  if (queryLower.includes('collaboration') || queryLower.includes('partnership')) {
    const [company1, company2] = entities.slice(0, 2)
    if (company1 && company2) {
      variations.push(
        `"${company1}" "${company2}" partnership deal agreement`,
        `${company1} ${company2} collaboration announcement news`,
        `${company1} teams up with ${company2}`,
        `${company1} ${company2} joint venture strategic alliance`,
        `"${company1} and ${company2}" partnership 2024 2025`
      )
    }
  }

  // Competition queries
  if (queryLower.includes('vs') || queryLower.includes('versus') || queryLower.includes('competitor')) {
    const [company1, company2] = entities.slice(0, 2)
    if (company1 && company2) {
      variations.push(
        `${company1} vs ${company2} comparison`,
        `${company1} versus ${company2} market share`,
        `${company1} ${company2} competitive analysis`,
        `"${company1}" "competes with" "${company2}"`
      )
    }
  }

  // News/Update queries - ENHANCED for AI companies
  if (queryLower.includes('news') || queryLower.includes('latest') || queryLower.includes('update') ||
      queryLower.includes('recent') || queryLower.includes('development')) {
    entities.forEach(entity => {
      variations.push(
        `"${entity}" latest news announcement 2024 2025`,
        `${entity} breaking news recent developments`,
        `"${entity}" recent updates 2024 2025`,
        `${entity} announcement october november december 2024`,
        `"${entity}" new product release 2024 2025`
      )

      // Special handling for AI companies - add model release variations
      if (queryLower.match(/openai|anthropic|google|deepmind|meta/i)) {
        variations.push(
          `${entity} new model release 2024`,
          `${entity} latest AI model announcement`,
          `"${entity}" GPT Sonnet Claude Gemini version`,
          `${entity} model launch october november 2024`,
          `${entity} AI capabilities update 2024`
        )
      }
    })
  }

  // AI/Tech specific queries - ENHANCED with model names
  if (queryLower.includes('ai') || queryLower.includes('artificial intelligence')) {
    if (queryLower.includes('regulation')) {
      variations.push(
        'AI regulation "EU AI Act" "Biden executive order"',
        'artificial intelligence policy FTC "safety guidelines"',
        'AI governance compliance "regulatory framework"',
        'chatbot regulation "conversational AI" safety'
      )
    }

    if (entities.length > 0) {
      entities.forEach(entity => {
        variations.push(
          `"${entity}" AI strategy artificial intelligence`,
          `${entity} machine learning LLM chatbot`,
          `"${entity}" generative AI deployment`
        )

        // Add model-specific variations based on company
        const entityLower = entity.toLowerCase()
        if (entityLower.includes('openai')) {
          variations.push(
            'OpenAI GPT-5 GPT-4.5 o1 o3 announcement',
            'OpenAI Sora video model release',
            '"OpenAI" latest model "GPT-5" announcement'
          )
        }
        if (entityLower.includes('anthropic')) {
          variations.push(
            'Anthropic Claude Sonnet 4 3.7 4.5 Opus release',
            '"Anthropic" "Claude 4" "Sonnet 4" announcement',
            'Anthropic new Claude model 2024 2025'
          )
        }
        if (entityLower.includes('google') || entityLower.includes('deepmind')) {
          variations.push(
            'Google Gemini 2.0 Ultra Pro announcement',
            'DeepMind AI model release breakthrough',
            '"Google" "Gemini 2" launch announcement'
          )
        }
        if (entityLower.includes('meta')) {
          variations.push(
            'Meta Llama 4 Llama-4 announcement release',
            '"Meta AI" latest model launch'
          )
        }
      })
    }
  }

  // Product/Launch queries - enhanced for version numbers
  if (queryLower.includes('launch') || queryLower.includes('release') || queryLower.includes('announce')) {
    entities.forEach(entity => {
      variations.push(
        `"${entity}" product launch announcement`,
        `${entity} releases new feature update`,
        `"${entity} announces" product service`,
        `"${entity}" available now download`,
        `"${entity}" official launch release`
      )
    })
  }

  // Detect version numbers (like "Sora 2", "GPT-4", "o1") - CRITICAL for finding new product versions
  const versionPattern = /([A-Z][a-zA-Z]+)\s*(\d+|o\d+|v\d+)/i
  const versionMatch = baseQuery.match(versionPattern)
  if (versionMatch) {
    const [_, productName, version] = versionMatch
    variations.push(
      `"${productName} ${version}" launch announcement`,
      `"${productName} ${version}" release available`,
      `"${productName} ${version}" official announcement`,
      `"${productName}" version ${version} launch`,
      `${productName} ${version} features capabilities`,
      `${productName} ${version} news update`,
      `"${productName} ${version}" availability pricing`,
      `introducing ${productName} ${version}`
    )
  }

  // Financial/Investment queries
  if (queryLower.includes('funding') || queryLower.includes('investment') || queryLower.includes('valuation')) {
    entities.forEach(entity => {
      variations.push(
        `"${entity}" funding round investment Series`,
        `${entity} valuation billion million raised`,
        `"${entity}" investors venture capital`
      )
    })
  }

  // CRITICAL: AI company developments - catch queries without perfect entity detection
  const aiCompanies = ['openai', 'anthropic', 'google', 'deepmind', 'meta', 'microsoft', 'amazon']
  const matchedCompany = aiCompanies.find(company => queryLower.includes(company))

  if (matchedCompany && (queryLower.includes('development') || queryLower.includes('recent') ||
      queryLower.includes('latest') || queryLower.includes('news') || queryLower.includes('announcement'))) {
    const companyCapitalized = matchedCompany.charAt(0).toUpperCase() + matchedCompany.slice(1)

    variations.push(
      `${companyCapitalized} announcement 2024 2025`,
      `${companyCapitalized} model release october november december 2024`,
      `"${companyCapitalized}" product launch 2024`,
      `${companyCapitalized} latest AI announcement`,
      `${companyCapitalized} new model capabilities 2024`
    )

    // Company-specific model searches
    if (matchedCompany === 'openai') {
      variations.push(
        'OpenAI GPT-5 o3 Sora 2.0 announcement 2024',
        '"OpenAI" ChatGPT update october november 2024'
      )
    }
    if (matchedCompany === 'anthropic') {
      variations.push(
        'Anthropic Claude Sonnet 4 3.7 4.5 5 announcement 2024',
        '"Anthropic" Claude Opus 4 release 2024'
      )
    }
  }

  return [...new Set(variations)] // Remove duplicates
}

// Helper function to determine time range from query
function extractTimeRange(queryLower: string): string | null {
  // Explicit time ranges (highest priority)
  if (queryLower.includes('past hour') || queryLower.includes('last hour') || queryLower.includes('within the hour')) {
    return 'qdr:h'  // Past hour
  }
  if (queryLower.includes('today') || queryLower.includes('past 24 hour') || queryLower.includes('last 24 hour') ||
      queryLower.includes('past day') || queryLower.includes('yesterday')) {
    return 'qdr:d'  // Past 24 hours
  }
  if (queryLower.includes('past 3 day') || queryLower.includes('last 3 day') || queryLower.includes('few days')) {
    return 'qdr:d3'  // Past 3 days
  }
  if (queryLower.includes('this week') || queryLower.includes('past week') || queryLower.includes('last week') ||
      queryLower.includes('past 7 day') || queryLower.includes('last 7 day')) {
    return 'qdr:w'  // Past week
  }
  if (queryLower.includes('past 2 week') || queryLower.includes('last 2 week') || queryLower.includes('fortnight')) {
    return 'qdr:w2'  // Past 2 weeks
  }
  if (queryLower.includes('this month') || queryLower.includes('past month') || queryLower.includes('last month') ||
      queryLower.includes('past 30 day') || queryLower.includes('last 30 day')) {
    return 'qdr:m'  // Past month
  }
  if (queryLower.includes('past 3 month') || queryLower.includes('last 3 month') || queryLower.includes('quarter') ||
      queryLower.includes('last quarter')) {
    return 'qdr:m3'  // Past 3 months
  }
  if (queryLower.includes('past 6 month') || queryLower.includes('last 6 month') || queryLower.includes('half year')) {
    return 'qdr:m6'  // Past 6 months
  }
  if (queryLower.includes('this year') || queryLower.includes('past year') || queryLower.includes('last year')) {
    return 'qdr:y'  // Past year
  }

  // Contextual keywords (lower priority)
  if (queryLower.includes('breaking')) {
    return 'qdr:h'  // Breaking news = past hour
  }
  if (queryLower.includes('recent') || queryLower.includes('recently')) {
    return 'qdr:m3'  // Recent = past 3 months (comprehensive for AI/tech developments)
  }
  if (queryLower.includes('latest')) {
    return 'qdr:m'  // Latest = past month (catch all recent announcements)
  }
  if (queryLower.includes('current')) {
    return 'qdr:m'  // Current = past month
  }
  if (queryLower.includes('launch') || queryLower.includes('announce') || queryLower.includes('release')) {
    return 'qdr:m3'  // Product launches - search 3 months back (AI products launch infrequently)
  }
  if (queryLower.includes('news') || queryLower.includes('announcement') || queryLower.includes('update')) {
    return 'qdr:m'  // News/announcements = past month for comprehensive coverage
  }
  if (queryLower.includes('development') || queryLower.includes('developments')) {
    return 'qdr:m3'  // Developments = past 3 months (captures major strategic shifts)
  }

  // Default for most queries - search past month for good coverage without noise
  return 'qdr:m'  // Past month as intelligent default (was too restrictive at 2 weeks)
}

// Create a comprehensive search strategy
export function createSearchStrategy(query: string, context?: any, orgDomains?: string[]): SearchStrategy {
  const queries = generateQueryVariations(query)
  const queryLower = query.toLowerCase()

  const strategy: SearchStrategy = {
    queries,
    mustInclude: [],
    mustExclude: [],
    tbs: extractTimeRange(queryLower)  // Use helper function for time range
  }

  // Use organization-specific trusted domains if provided
  if (orgDomains && orgDomains.length > 0) {
    strategy.domains = orgDomains
  } else {
    // Target specific domains for certain types of queries
    if (queryLower.includes('regulation') || queryLower.includes('policy')) {
      strategy.domains = [
        'reuters.com',
        'bloomberg.com',
        'ft.com',
        'wsj.com',
        'techcrunch.com',
        'theverge.com',
        'arstechnica.com',
        'gov',
        'europa.eu'
      ]
    } else if (queryLower.includes('partnership') || queryLower.includes('collaboration')) {
      strategy.domains = [
        'reuters.com',
        'bloomberg.com',
        'techcrunch.com',
        'theverge.com',
        'businesswire.com',
        'prnewswire.com',
        'cnbc.com',
        'ft.com'
      ]
    }
  }

  // Exclude noise
  strategy.mustExclude = [
    'reddit.com',
    'quora.com',
    'stackoverflow.com',
    'facebook.com',
    'instagram.com'
  ]

  return strategy
}

// Format query for Firecrawl search
export function formatSearchQuery(strategy: SearchStrategy, index: number = 0): string {
  let query = strategy.queries[Math.min(index, strategy.queries.length - 1)]

  // Add time filter if present
  if (strategy.timeframe) {
    query = `${query} ${strategy.timeframe}`
  }

  // Add must-include terms
  if (strategy.mustInclude && strategy.mustInclude.length > 0) {
    query += ' ' + strategy.mustInclude.map(term => `"${term}"`).join(' ')
  }

  // Note: Firecrawl doesn't support negative keywords in query, handle in filtering

  return query
}

// Score result relevance with more sophisticated algorithm
export function scoreRelevance(
  title: string,
  description: string,
  content: string,
  url: string,
  query: string,
  strategy: SearchStrategy,
  sourceType?: 'web' | 'news' | 'images'
): number {
  const text = `${title} ${description} ${content}`.toLowerCase()
  const queryLower = query.toLowerCase()
  let score = 0

  // Check for exact query match (highest weight)
  if (text.includes(queryLower)) {
    score += 0.5
  }

  // Check for all query terms
  const queryTerms = queryLower.split(/\s+/).filter(t => t.length > 2)
  const matchedTerms = queryTerms.filter(term => text.includes(term))
  score += (matchedTerms.length / queryTerms.length) * 0.3

  // Title matches are most important
  const titleLower = title.toLowerCase()
  queryTerms.forEach(term => {
    if (titleLower.includes(term)) {
      score += 0.15
    }
  })

  // Domain authority bonus
  const trustedDomains = [
    'reuters.com', 'bloomberg.com', 'ft.com', 'wsj.com',
    'techcrunch.com', 'theverge.com', 'cnbc.com', 'bbc.com',
    'nytimes.com', 'washingtonpost.com', 'forbes.com'
  ]

  if (trustedDomains.some(domain => url.includes(domain))) {
    score += 0.2
  }

  // News source bonus for news queries
  if (sourceType === 'news') {
    score += 0.15 // Prioritize news results when available

    // Extra bonus for news keywords in query
    if (queryLower.includes('news') || queryLower.includes('latest') ||
        queryLower.includes('announcement') || queryLower.includes('partnership')) {
      score += 0.1
    }
  }

  // Recency bonus (if URL contains recent date - 2024/2025)
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1 // 1-12

  const datePatterns = [
    new RegExp(`${currentYear}-(\\d{2})-(\\d{2})`), // 2024-XX-XX or 2025-XX-XX
    new RegExp(`${currentYear}/(\\d{2})/(\\d{2})`), // 2024/XX/XX or 2025/XX/XX
    new RegExp(`${currentYear}-${currentMonth.toString().padStart(2, '0')}`), // Current year-month
    /202[4-5]-\d{2}-\d{2}/, // Any 2024 or 2025 date
    /202[4-5]\/\d{2}\/\d{2}/ // Any 2024 or 2025 date with slashes
  ]

  if (datePatterns.some(pattern => url.match(pattern))) {
    score += 0.15 // Increased bonus for recent dated content
  }

  // Check for must-include terms
  if (strategy.mustInclude) {
    const hasAllMustInclude = strategy.mustInclude.every(term =>
      text.includes(term.toLowerCase())
    )
    if (!hasAllMustInclude) {
      score *= 0.5 // Penalize if missing required terms
    }
  }

  // Length and quality indicators
  const wordCount = content.split(/\s+/).length
  if (wordCount > 200 && wordCount < 5000) {
    score += 0.05 // Good article length
  }

  return Math.min(score, 1.0)
}