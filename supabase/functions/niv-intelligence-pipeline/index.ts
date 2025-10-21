import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

// Enhanced NIV Intelligence Pipeline
// Mirrors the proven Intelligence Hub pipeline architecture
// Discovery → Sources → PR Filtering → Relevance Scoring → Extraction → Intelligence

console.log("NIV Intelligence Pipeline starting...")

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { query, organizationId, timeWindow = '48h', context = {} } = await req.json()

    if (!query) {
      throw new Error('Query is required')
    }

    console.log(`🎯 NIV Intelligence Pipeline for: ${organizationId}`)
    console.log(`📋 Query: "${query.substring(0, 100)}..."`)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // STEP 1: DISCOVERY - Get organization profile (like Intelligence Hub)
    console.log('🔍 STEP 1: Discovery - Loading organization profile...')
    const { data: orgProfile } = await supabase
      .from('mcp_discovery')
      .select('*')
      .eq('organization_id', organizationId)
      .single()

    if (!orgProfile) {
      throw new Error(`Organization profile not found for: ${organizationId}`)
    }

    console.log(`✅ Profile loaded: ${orgProfile.competition?.direct_competitors?.length || 0} competitors, ${orgProfile.keywords?.length || 0} keywords`)

    // STEP 2: SOURCE SELECTION - Get quality sources from master-source-registry
    console.log('📰 STEP 2: Source Selection - Getting quality sources...')
    const qualitySources = await getMasterSourceRegistry(orgProfile.industry || 'technology')

    // STEP 3: INTELLIGENT SEARCH - Use enhanced fireplexity with quality sources
    console.log('🔍 STEP 3: Intelligent Search - Enhanced fireplexity with pipeline lessons...')
    const searchResults = await enhancedFireplexitySearch({
      query,
      organizationId,
      orgProfile,
      qualitySources,
      timeWindow
    })

    // STEP 4: PR FILTERING - Apply monitor-stage-1 PR priority logic
    console.log('🎯 STEP 4: PR Filtering - Applying PR priority scoring...')
    const prFilteredArticles = applyPRFiltering(searchResults, orgProfile)

    // STEP 5: RELEVANCE SCORING - Apply monitor-stage-2 relevance scoring
    console.log('📊 STEP 5: Relevance Scoring - Advanced scoring algorithm...')
    const scoredArticles = applyRelevanceScoring(prFilteredArticles, orgProfile, query)

    // STEP 6: INTELLIGENCE SYNTHESIS - Like executive synthesis
    console.log('🧠 STEP 6: Intelligence Synthesis - Creating executive summary...')
    const intelligence = await synthesizeIntelligence({
      articles: scoredArticles.slice(0, 10), // Top 10 articles
      query,
      orgProfile,
      timeWindow
    })

    return new Response(
      JSON.stringify({
        success: true,
        intelligence,
        articles: scoredArticles.slice(0, 8), // Return top 8 for display
        organizationContext: {
          name: orgProfile.organization_name,
          competitors: orgProfile.competition?.direct_competitors?.slice(0, 5) || [],
          industry: orgProfile.industry
        },
        pipelineStats: {
          totalFound: searchResults.length,
          afterPRFilter: prFilteredArticles.length,
          afterScoring: scoredArticles.length,
          timeWindow
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ NIV Intelligence Pipeline Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        fallback: 'Using basic search mode'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Get quality sources from master-source-registry
async function getMasterSourceRegistry(industry: string) {
  console.log(`📚 Getting quality sources for industry: ${industry}`)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/master-source-registry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ industry })
    })

    if (response.ok) {
      const data = await response.json()
      console.log(`✅ Loaded ${data.sources?.length || 0} quality sources`)
      return data.sources || []
    }
  } catch (error) {
    console.error('Master source registry error:', error)
  }

  return []
}

// Enhanced fireplexity search with pipeline lessons
async function enhancedFireplexitySearch({ query, organizationId, orgProfile, qualitySources, timeWindow }) {
  console.log('🔍 Enhanced Fireplexity Search with pipeline architecture...')

  // Build enhanced query with competitor context (like monitor-stage-1)
  const competitors = orgProfile.competition?.direct_competitors?.slice(0, 5) || []
  const keywords = orgProfile.keywords?.slice(0, 8) || []

  const enhancedQuery = buildEnhancedQuery(query, competitors, keywords, timeWindow)
  console.log(`📝 Enhanced query: "${enhancedQuery.substring(0, 150)}..."`)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/niv-fireplexity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        query: enhancedQuery,
        organizationId,
        timeWindow,
        useCache: false,
        qualitySources: qualitySources.slice(0, 20), // Use top 20 quality sources
        extractionMode: 'enhanced' // Signal enhanced extraction
      })
    })

    if (response.ok) {
      const data = await response.json()
      console.log(`📊 Fireplexity returned ${data.articles?.length || 0} articles`)
      return data.articles || []
    }
  } catch (error) {
    console.error('Enhanced fireplexity error:', error)
  }

  return []
}

// Build enhanced query like monitor-stage-1
function buildEnhancedQuery(originalQuery: string, competitors: string[], keywords: string[], timeWindow: string): string {
  const timeKeywords = {
    '24h': 'today breaking news latest',
    '48h': 'latest news yesterday today recent',
    '7d': 'this week latest recent news',
    'realtime': 'breaking now urgent latest'
  }

  let enhanced = `${originalQuery} ${timeKeywords[timeWindow] || timeKeywords['48h']}`

  // Add competitor context for competitive intelligence
  if (competitors.length > 0) {
    enhanced += ` ${competitors.slice(0, 3).join(' ')}`
  }

  // Add strategic keywords for relevance
  if (keywords.length > 0) {
    enhanced += ` ${keywords.slice(0, 5).join(' ')}`
  }

  return enhanced
}

// Apply PR filtering logic from monitor-stage-1
function applyPRFiltering(articles: any[], orgProfile: any): any[] {
  console.log(`🎯 Applying PR filtering to ${articles.length} articles...`)

  const orgName = orgProfile.organization_name.toLowerCase()
  const competitors = [
    ...(orgProfile.competition?.direct_competitors || []),
    ...(orgProfile.competition?.indirect_competitors || [])
  ].map(c => c.toLowerCase())

  const filtered = articles.filter(article => {
    const text = `${article.title || ''} ${article.description || ''}`.toLowerCase()

    // PRIORITY 1: Organization crisis/opportunity (highest priority)
    const orgInTitle = article.title?.toLowerCase().includes(orgName)
    const hasCrisis = /crisis|scandal|breach|lawsuit|investigation|failure/.test(text)
    const hasOpportunity = /launch|partnership|acquisition|funding|breakthrough/.test(text)

    if (orgInTitle && (hasCrisis || hasOpportunity)) {
      article.prPriority = 'critical'
      return true
    }

    // PRIORITY 2: Direct competitor major events
    const competitorInTitle = competitors.some(comp => article.title?.toLowerCase().includes(comp))
    const majorEvent = /launch|acquire|partnership|ipo|ceo|lawsuit/.test(text)

    if (competitorInTitle && majorEvent) {
      article.prPriority = 'high'
      return true
    }

    // PRIORITY 3: Industry trends with multiple entities
    const entityMatches = competitors.filter(comp => text.includes(comp)).length
    const industryRelevant = orgProfile.keywords?.some(keyword =>
      text.includes(keyword.toLowerCase())
    )

    if (entityMatches >= 2 || (entityMatches >= 1 && industryRelevant)) {
      article.prPriority = 'medium'
      return true
    }

    // PRIORITY 4: General industry relevance
    if (industryRelevant) {
      article.prPriority = 'low'
      return true
    }

    return false
  })

  console.log(`✅ PR filtering: ${articles.length} → ${filtered.length} articles`)
  return filtered
}

// Apply relevance scoring from monitor-stage-2-relevance
function applyRelevanceScoring(articles: any[], orgProfile: any, originalQuery: string): any[] {
  console.log(`📊 Applying relevance scoring to ${articles.length} articles...`)

  const scoredArticles = articles.map(article => {
    let score = 0
    const factors = []
    const text = `${article.title || ''} ${article.description || ''} ${article.content || ''}`.toLowerCase()

    // Organization mentions (highest weight)
    const orgMentions = (text.match(new RegExp(orgProfile.organization_name.toLowerCase(), 'gi')) || []).length
    if (orgMentions > 0) {
      const orgScore = Math.min(orgMentions * 25, 50)
      score += orgScore
      factors.push(`ORG:${orgMentions}`)
    }

    // Competitor mentions
    const competitors = [
      ...(orgProfile.competition?.direct_competitors || []),
      ...(orgProfile.competition?.indirect_competitors || [])
    ]

    const competitorMentions = competitors.filter(comp =>
      text.includes(comp.toLowerCase())
    )

    if (competitorMentions.length > 0) {
      score += Math.min(competitorMentions.length * 15, 45)
      factors.push(`COMP:${competitorMentions.length}`)
    }

    // Keyword relevance
    const keywords = orgProfile.keywords || []
    const keywordMatches = keywords.filter(keyword =>
      text.includes(keyword.toLowerCase())
    )

    if (keywordMatches.length > 0) {
      score += Math.min(keywordMatches.length * 8, 32)
      factors.push(`KW:${keywordMatches.length}`)
    }

    // Event type detection (from monitor-stage-2)
    const eventTypes = detectEventTypes(text)
    if (eventTypes.length > 0) {
      score += eventTypes.length * 10
      factors.push(`EVENT:${eventTypes.join(',')}`)
    }

    // Query relevance
    const queryWords = originalQuery.toLowerCase().split(' ')
    const queryMatches = queryWords.filter(word =>
      word.length > 3 && text.includes(word)
    )

    if (queryMatches.length > 0) {
      score += queryMatches.length * 5
      factors.push(`QUERY:${queryMatches.length}`)
    }

    // Time bonus (recency)
    const articleAge = article.publishedAt ?
      (new Date().getTime() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60) : 48

    if (articleAge < 6) {
      score += 20
      factors.push('BREAKING')
    } else if (articleAge < 24) {
      score += 10
      factors.push('RECENT')
    }

    // PR Priority bonus
    const priorityBonus = {
      'critical': 25,
      'high': 15,
      'medium': 10,
      'low': 5
    }

    if (article.prPriority) {
      score += priorityBonus[article.prPriority] || 0
      factors.push(`PR:${article.prPriority}`)
    }

    return {
      ...article,
      relevanceScore: Math.min(score, 100),
      relevanceFactors: factors
    }
  })

  // Sort by relevance score
  const sorted = scoredArticles.sort((a, b) => b.relevanceScore - a.relevanceScore)

  console.log(`✅ Relevance scoring complete. Top score: ${sorted[0]?.relevanceScore || 0}`)
  return sorted
}

// Detect event types like monitor-stage-2-relevance
function detectEventTypes(text: string): string[] {
  const eventPatterns = {
    'product_launch': /launch|unveil|introduce|debut|release|announce/i,
    'financial': /earnings|revenue|profit|loss|quarterly|ipo|funding|investment/i,
    'partnership': /partner|collaborate|alliance|joint venture|agreement/i,
    'acquisition': /acquire|merger|buyout|purchase|takeover/i,
    'legal': /lawsuit|litigation|settlement|court|ruling|investigation/i,
    'leadership': /ceo|executive|appoint|resign|hire|fire|departure/i,
    'crisis': /recall|breach|scandal|crisis|emergency|failure/i,
    'expansion': /expand|growth|new market|international|global/i,
    'innovation': /breakthrough|innovation|patent|research|development/i,
    'regulatory': /regulation|compliance|fda|sec|ftc|approval/i
  }

  const detected = []
  for (const [type, pattern] of Object.entries(eventPatterns)) {
    if (pattern.test(text)) {
      detected.push(type)
    }
  }

  return detected
}

// Synthesize intelligence like executive synthesis
async function synthesizeIntelligence({ articles, query, orgProfile, timeWindow }) {
  console.log('🧠 Synthesizing intelligence with Claude...')

  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured')
  }

  const synthesisPrompt = `You are an expert intelligence analyst synthesizing information for ${orgProfile.organization_name}.

QUERY: "${query}"
TIME WINDOW: ${timeWindow}
ORGANIZATION: ${orgProfile.organization_name}
COMPETITORS: ${orgProfile.competition?.direct_competitors?.slice(0, 5).join(', ') || 'None listed'}
INDUSTRY: ${orgProfile.industry || 'Technology'}

ARTICLES TO ANALYZE:
${articles.map((article, i) =>
  `${i + 1}. **${article.title}** (Score: ${article.relevanceScore}, Priority: ${article.prPriority})
     ${article.description || 'No description'}
     Factors: ${article.relevanceFactors?.join(', ') || 'None'}
     Source: ${article.source?.name || 'Unknown'}`
).join('\n\n')}

Please provide a strategic intelligence synthesis in this format:

**Executive Summary**
[2-3 sentences summarizing the key intelligence]

**Key Developments**
• [Most important development with strategic implications]
• [Second most important development]
• [Third most important development]

**Competitive Intelligence**
• [Competitor actions and implications]
• [Market positioning changes]

**Strategic Recommendations**
• [Immediate action item]
• [Strategic positioning recommendation]
• [Monitoring recommendation]

Focus on actionable intelligence that helps with PR strategy and competitive positioning.`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        messages: [{ role: 'user', content: synthesisPrompt }]
      }),
    })

    if (response.ok) {
      const data = await response.json()
      console.log('✅ Intelligence synthesis complete')
      return data.content[0].text
    }
  } catch (error) {
    console.error('Intelligence synthesis error:', error)
  }

  return `Intelligence synthesis unavailable. Found ${articles.length} relevant articles about "${query}" in the last ${timeWindow}.`
}