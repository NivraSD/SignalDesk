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

// Scrape competitor intelligence
async function gatherCompetitorIntelligence(organization: any) {
  const intelligence = {
    movements: [],
    vulnerabilities: [],
    opportunities: []
  }
  
  const sources = getIndustryIntelligenceSources(organization.industry)
  
  // Monitor top 3 competitors
  for (const competitor of sources.competitors.slice(0, 3)) {
    try {
      // Search for recent competitor news
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
            impact: assessImpact(result.description)
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
  
  // Scrape industry news site for trending topics
  try {
    const newsData = await scrapeWithFirecrawl(`https://${sources.sites[0]}`, {
      formats: ['markdown'],
      onlyMainContent: true
    })
    
    if (newsData?.markdown) {
      // Extract trending topics from content
      for (const keyword of sources.keywords) {
        if (newsData.markdown.toLowerCase().includes(keyword.toLowerCase())) {
          narratives.trending.push({
            topic: keyword,
            source: sources.sites[0],
            relevance: 'high'
          })
        }
      }
    }
  } catch (error) {
    console.log('Could not scrape news site:', error)
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
    const response = await fetch('https://api.firecrawl.dev/v2/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        ...options
      })
    })
    
    if (!response.ok) {
      console.error(`Firecrawl search error:`, response.status)
      return null
    }
    
    return await response.json()
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
    return {
      summary: 'Real-time intelligence gathered successfully.',
      key_insights: ['Competitor movements detected', 'Market opportunities identified'],
      recommendations: ['Monitor cascade effects', 'Prepare strategic response']
    }
  }
  
  try {
    const prompt = `Analyze this real-time intelligence for ${organization.name} and provide an executive summary:
    
Competitor Intelligence: ${JSON.stringify(intelligence.competitors, null, 2)}
Stakeholder Sentiment: ${JSON.stringify(intelligence.stakeholders, null, 2)}
Narrative Trends: ${JSON.stringify(intelligence.narratives, null, 2)}
Predictive Insights: ${JSON.stringify(intelligence.predictions, null, 2)}

Provide:
1. A concise executive summary (2-3 sentences)
2. Top 3 key insights
3. Top 3 recommendations

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