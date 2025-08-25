// Real-time Intelligence Hub - Powered by Firecrawl + MasterSourceRegistry
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

const FIRECRAWL_API_KEY = 'fc-3048810124b640eb99293880a4ab25d0'
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

// Get industry-specific sources from MasterSourceRegistry
function getIndustryIntelligenceSources(industry: string) {
  const sources: Record<string, any> = {
    'automotive': {
      competitors: ['Tesla', 'Ford', 'GM', 'Rivian', 'Lucid'],
      sites: ['autonews.com', 'electrek.co', 'greencarreports.com', 'insideevs.com'],
      keywords: ['electric vehicles', 'autonomous driving', 'automotive chips', 'EV charging']
    },
    'technology': {
      competitors: ['Microsoft', 'Apple', 'Google', 'Meta', 'Amazon'],
      sites: ['techcrunch.com', 'theverge.com', 'arstechnica.com', 'wired.com'],
      keywords: ['AI', 'cloud computing', 'cybersecurity', 'machine learning']
    },
    'finance': {
      competitors: ['JPMorgan', 'Goldman Sachs', 'Morgan Stanley', 'Bank of America'],
      sites: ['bloomberg.com', 'ft.com', 'wsj.com', 'reuters.com'],
      keywords: ['interest rates', 'fintech', 'cryptocurrency', 'banking regulation']
    },
    'healthcare': {
      competitors: ['J&J', 'Pfizer', 'Merck', 'AbbVie', 'Roche'],
      sites: ['statnews.com', 'fiercepharma.com', 'modernhealthcare.com'],
      keywords: ['FDA approval', 'clinical trials', 'drug pricing', 'biotech']
    },
    'retail': {
      competitors: ['Amazon', 'Walmart', 'Target', 'Costco'],
      sites: ['retaildive.com', 'chainstoreage.com', 'retailwire.com'],
      keywords: ['e-commerce', 'supply chain', 'consumer spending', 'omnichannel']
    },
    'sports': {
      competitors: ['Nike', 'Adidas', 'Under Armour', 'Puma', 'New Balance'],
      sites: ['espn.com', 'theathletic.com', 'sportico.com', 'hypebeast.com'],
      keywords: ['athlete sponsorship', 'sports apparel', 'sneaker release', 'sports marketing']
    }
  }
  
  return sources[industry?.toLowerCase()] || sources['technology']
}

// Scrape competitor intelligence from Firecrawl AND RSS feeds
async function gatherCompetitorIntelligence(organization: any) {
  const intelligence = {
    movements: [],
    vulnerabilities: [],
    opportunities: []
  }
  
  // First, gather RSS feeds for the organization's industry
  try {
    const rssResponse = await fetch(
      `https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/source-registry?industry=${organization.industry || 'technology'}&limit=30`,
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'
        }
      }
    )
    
    if (rssResponse.ok) {
      const rssData = await rssResponse.json()
      console.log(`📡 Got ${rssData.articles?.length || 0} RSS articles for intelligence`)
      
      // Process RSS articles for intelligence
      if (rssData.articles) {
        for (const article of rssData.articles) {
          // Categorize the intelligence
          const movementKeywords = ['launch', 'announce', 'release', 'introduce', 'unveil', 'partner', 'acquisition', 'merger']
          const vulnerabilityKeywords = ['layoff', 'lawsuit', 'investigation', 'recall', 'outage', 'breach', 'decline', 'loss']
          
          if (movementKeywords.some(kw => article.title.toLowerCase().includes(kw))) {
            intelligence.movements.push({
              competitor: 'Industry',
              type: 'rss_movement',
              title: article.title,
              description: article.description,
              url: article.url,
              impact: 'medium',
              detected_at: article.published,
              source: article.source
            })
          } else if (vulnerabilityKeywords.some(kw => article.title.toLowerCase().includes(kw) || article.description.toLowerCase().includes(kw))) {
            intelligence.vulnerabilities.push({
              competitor: 'Industry',
              issue: article.title,
              description: article.description,
              url: article.url,
              opportunity: 'Market opportunity identified',
              confidence: 0.7,
              source: article.source
            })
          }
        }
      }
    }
  } catch (error) {
    console.log('RSS feed fetch failed:', error)
  }
  
  const sources = getIndustryIntelligenceSources(organization.industry)
  
  // Monitor top 3 competitors with multiple search strategies
  for (const competitor of sources.competitors.slice(0, 3)) {
    try {
      // Strategy 1: Search for recent announcements
      const searchResults = await searchWithFirecrawl(
        `"${competitor}" announcement OR "${competitor}" launches OR "${competitor}" partnership`,
        { limit: 3 }
      )
      
      if (searchResults?.data?.web) {
        for (const result of searchResults.data.web) {
          intelligence.movements.push({
            competitor,
            type: detectMovementType(result.title),
            title: result.title,
            description: result.description,
            url: result.url,
            impact: assessImpact(result.description),
            detected_at: new Date().toISOString()
          })
        }
      }
      
      // Strategy 2: Search for vulnerabilities
      const vulnerabilitySearch = await searchWithFirecrawl(
        `"${competitor}" (layoffs OR lawsuit OR investigation OR recall OR outage)`,
        { limit: 2 }
      )
      
      if (vulnerabilitySearch?.data?.web) {
        for (const result of vulnerabilitySearch.data.web) {
          intelligence.vulnerabilities.push({
            competitor,
            issue: result.title,
            description: result.description,
            url: result.url,
            opportunity: `Position as stable alternative to ${competitor}`,
            confidence: 0.8
          })
        }
      }
      
      // Strategy 3: Look for market opportunities
      const opportunitySearch = await searchWithFirecrawl(
        `"${competitor}" (customers OR market share OR growth OR expansion)`,
        { limit: 2 }
      )
      
      if (opportunitySearch?.data?.web) {
        for (const result of opportunitySearch.data.web) {
          intelligence.opportunities.push({
            competitor,
            opportunity: result.title,
            description: result.description,
            url: result.url,
            action: 'Analyze for competitive positioning'
          })
        }
      }
    } catch (error) {
      console.log(`Could not search for ${competitor}:`, error)
    }
  }
  
  return intelligence
}

// Gather stakeholder intelligence
async function gatherStakeholderIntelligence(organization: any) {
  const stakeholders = {
    investors: [],
    regulators: [],
    media: [],
    customers: []
  }
  
  try {
    // Search for investor sentiment
    const investorSearch = await searchWithFirecrawl(
      `"${organization.name}" investors OR "${organization.name}" shareholders`,
      { limit: 2 }
    )
    
    if (investorSearch?.data?.web) {
      stakeholders.investors = investorSearch.data.web.map((r: any) => ({
        title: r.title,
        sentiment: analyzeSentiment(r.description),
        url: r.url
      }))
    }
    
    // Search for regulatory news
    const regulatorySearch = await searchWithFirecrawl(
      `"${organization.industry}" regulation OR compliance OR "new rules"`,
      { limit: 2 }
    )
    
    if (regulatorySearch?.data?.web) {
      stakeholders.regulators = regulatorySearch.data.web.map((r: any) => ({
        title: r.title,
        impact: 'medium',
        url: r.url
      }))
    }
  } catch (error) {
    console.error('Stakeholder search error:', error)
  }
  
  return stakeholders
}

// Gather narrative intelligence
async function gatherNarrativeIntelligence(organization: any) {
  const narratives = {
    trending: [],
    opportunities: [],
    risks: []
  }
  
  const sources = getIndustryIntelligenceSources(organization.industry)
  
  // Search for trending topics instead of scraping sites directly
  for (const keyword of sources.keywords.slice(0, 3)) { // Check top 3 keywords
    try {
      // Search for recent news about each keyword
      const trendingSearch = await searchWithFirecrawl(
        `"${keyword}" "${organization.industry}" news "2024" OR "2025"`,
        { limit: 2 }
      )
      
      if (trendingSearch?.data?.web) {
        for (const result of trendingSearch.data.web) {
          narratives.trending.push({
            topic: keyword,
            title: result.title,
            description: result.description,
            source: new URL(result.url).hostname,
            url: result.url,
            relevance: 'high',
            detected_at: new Date().toISOString()
          })
        }
      }
    } catch (error) {
      console.log(`Could not search for trending topic ${keyword}:`, error)
    }
  }
  
  // Also search for breaking industry news
  try {
    const breakingNews = await searchWithFirecrawl(
      `"${organization.industry}" breaking news OR trending OR "hot topic"`,
      { limit: 3 }
    )
    
    if (breakingNews?.data?.web) {
      for (const result of breakingNews.data.web) {
        // Extract main topic from title
        const topic = result.title.split(':')[0] || result.title.substring(0, 50)
        
        narratives.trending.push({
          topic: topic,
          title: result.title,
          description: result.description,
          source: new URL(result.url).hostname,
          url: result.url,
          relevance: 'high',
          detected_at: new Date().toISOString()
        })
      }
    }
  } catch (error) {
    console.log('Could not search for breaking news:', error)
  }
  
  // Search for narrative opportunities
  const narrativeSearch = await searchWithFirecrawl(
    `"${organization.industry}" "thought leadership" OR "expert opinion" OR "industry perspective"`,
    { limit: 3 }
  )
  
  if (narrativeSearch?.data?.web) {
    narratives.opportunities = narrativeSearch.data.web.map((r: any) => ({
      title: r.title,
      type: 'thought_leadership',
      url: r.url
    }))
  }
  
  return narratives
}

// Gather predictive intelligence (cascade detection)
async function gatherPredictiveIntelligence(organization: any) {
  const predictions = {
    cascades: [],
    emerging_risks: [],
    opportunities: []
  }
  
  // Search for cascade indicators
  const cascadeSearch = await searchWithFirecrawl(
    `"${organization.industry}" "supply chain" OR "disruption" OR "shortage" OR "crisis"`,
    { limit: 3 }
  )
  
  if (cascadeSearch?.data?.web) {
    for (const result of cascadeSearch.data.web) {
      if (result.description?.includes('supply chain') || 
          result.description?.includes('disruption')) {
        predictions.cascades.push({
          event: result.title,
          probability: 0.7,
          impact: 'high',
          timeline: '1-2 weeks',
          url: result.url
        })
      }
    }
  }
  
  return predictions
}

// Helper functions
async function scrapeWithFirecrawl(url: string, options: any = {}) {
  try {
    const response = await fetch('https://api.firecrawl.dev/v2/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url,
        ...options
      })
    })
    
    if (!response.ok) {
      console.error(`Firecrawl scrape error for ${url}:`, response.status)
      return null
    }
    
    const result = await response.json()
    return result.data
  } catch (error) {
    console.error(`Firecrawl scrape failed for ${url}:`, error)
    return null
  }
}

async function searchWithFirecrawl(query: string, options: any = {}) {
  try {
    console.log(`🔍 Firecrawl search for: ${query}`)
    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        limit: options.limit || 5
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Firecrawl search error:`, response.status, errorText)
      return null
    }
    
    const result = await response.json()
    console.log(`✅ Firecrawl returned ${result?.data?.length || 0} results`)
    
    // Transform v1 response to match expected format
    if (result?.success && result?.data) {
      return {
        success: true,
        data: {
          web: result.data  // v1 returns data array directly
        }
      }
    }
    
    return null
  } catch (error) {
    console.error(`Firecrawl search failed:`, error)
    return null
  }
}

function detectMovementType(title: string) {
  const lower = title.toLowerCase()
  if (lower.includes('launch') || lower.includes('announce')) return 'product_launch'
  if (lower.includes('partner') || lower.includes('deal')) return 'partnership'
  if (lower.includes('acquire') || lower.includes('merger')) return 'acquisition'
  if (lower.includes('expand') || lower.includes('growth')) return 'expansion'
  return 'strategic'
}

function assessImpact(description: string) {
  const lower = description.toLowerCase()
  if (lower.includes('major') || lower.includes('significant') || lower.includes('billion')) return 'high'
  if (lower.includes('minor') || lower.includes('small')) return 'low'
  return 'medium'
}

function analyzeSentiment(text: string) {
  const lower = text.toLowerCase()
  if (lower.includes('positive') || lower.includes('strong') || lower.includes('growth')) return 'positive'
  if (lower.includes('concern') || lower.includes('risk') || lower.includes('decline')) return 'negative'
  return 'neutral'
}

// Generate executive summary using Claude
async function generateExecutiveSummary(intelligence: any, organization: any) {
  if (!ANTHROPIC_API_KEY) {
    // Enhanced fallback summary based on actual data
    const insights = []
    const recommendations = []
    
    if (intelligence.competitors?.movements?.length > 0) {
      insights.push(`${intelligence.competitors.movements.length} competitor movements detected`)
      recommendations.push('Analyze competitor strategies for positioning opportunities')
    }
    if (intelligence.competitors?.vulnerabilities?.length > 0) {
      insights.push(`${intelligence.competitors.vulnerabilities.length} competitor vulnerabilities identified`)
      recommendations.push('Position as stable alternative to vulnerable competitors')
    }
    if (intelligence.narratives?.trending?.length > 0) {
      insights.push(`${intelligence.narratives.trending.length} trending topics relevant to ${organization.industry}`)
      recommendations.push('Develop thought leadership on trending topics')
    }
    if (intelligence.predictions?.cascades?.length > 0) {
      insights.push('Cascade effects predicted in next 48 hours')
      recommendations.push('Prepare for first-mover advantage on cascade opportunities')
    }
    
    return {
      summary: `Real-time intelligence gathered for ${organization.name}. ${insights.length} critical insights identified requiring immediate attention.`,
      key_insights: insights.slice(0, 3),
      recommendations: recommendations.slice(0, 3)
    }
  }
  
  try {
    const prompt = `You are an Executive Intelligence Analyst. Analyze this real-time intelligence for ${organization.name} and provide strategic insights.

Organization: ${organization.name}
Industry: ${organization.industry || 'technology'}

COMPETITOR INTELLIGENCE:
${JSON.stringify(intelligence.competitors, null, 2)}

STAKEHOLDER SENTIMENT:
${JSON.stringify(intelligence.stakeholders, null, 2)}

NARRATIVE LANDSCAPE:
${JSON.stringify(intelligence.narratives, null, 2)}

PREDICTIVE ANALYSIS:
${JSON.stringify(intelligence.predictions, null, 2)}

Provide a strategic executive briefing with:
1. Executive Summary (2-3 impactful sentences focusing on immediate opportunities and risks)
2. Top 3 Key Insights (specific, actionable intelligence findings)
3. Top 3 Strategic Recommendations (concrete actions with timing)

Focus on:
- Competitive advantages to exploit
- Time-sensitive opportunities
- Cascade effects to leverage
- Narrative gaps to fill
- Stakeholder concerns to address

Format as JSON with keys: summary, key_insights, recommendations`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`)
    }

    const result = await response.json()
    return JSON.parse(result.content[0].text)
  } catch (error) {
    console.error('Executive summary generation error:', error)
    return {
      summary: 'Real-time intelligence gathered from web sources.',
      key_insights: intelligence.competitors.movements.slice(0, 3).map((m: any) => m.title),
      recommendations: ['Monitor competitor activities', 'Capitalize on market opportunities', 'Prepare for cascade effects']
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { organization, timeframe } = await req.json()
    
    console.log(`🔍 Gathering real-time intelligence for ${organization.name}`)
    
    // Gather intelligence from multiple sources in parallel
    const [competitors, stakeholders, narratives, predictions] = await Promise.all([
      gatherCompetitorIntelligence(organization),
      gatherStakeholderIntelligence(organization),
      gatherNarrativeIntelligence(organization),
      gatherPredictiveIntelligence(organization)
    ])
    
    const intelligence = {
      competitors,
      stakeholders,
      narratives,
      predictions
    }
    
    // Generate executive summary
    const executiveSummary = await generateExecutiveSummary(intelligence, organization)
    
    return new Response(
      JSON.stringify({
        success: true,
        organization: organization.name,
        timestamp: new Date().toISOString(),
        timeframe,
        intelligence,
        executive_summary: executiveSummary,
        sources: {
          firecrawl: 'active',
          master_registry: 'active',
          real_time: true
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Intelligence gathering error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  }
})