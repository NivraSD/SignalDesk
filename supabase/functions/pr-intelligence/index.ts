// PR Intelligence MCP - Real competitive intelligence for PR professionals
// Uses IntelligenceCore for unified intelligence gathering

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { intelligenceCore } from "../_shared/IntelligenceCore.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400'
}

const NEWS_API_KEY = Deno.env.get('NEWS_API_KEY') || '44466831285e41dfa4c1fb4bf6f1a92f'
const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY') || 'AIzaSyATXM5WoS8m0X56Q5HMuU_w5JrjgsOP2x4'

// Real competitor companies (not GitHub repos!)
const KNOWN_COMPETITORS = {
  'uber': ['Lyft', 'Grab', 'Didi Chuxing', 'Ola', 'Bolt', 'Careem', 'Gojek', 'Cabify'],
  'tesla': ['Rivian', 'Lucid Motors', 'NIO', 'BYD', 'Polestar', 'Fisker', 'Canoo', 'XPeng'],
  'microsoft': ['Google', 'Amazon', 'Apple', 'Salesforce', 'Oracle', 'IBM', 'SAP', 'Adobe'],
  'openai': ['Anthropic', 'Google DeepMind', 'Cohere', 'Inflection AI', 'Stability AI', 'Mistral AI', 'Aleph Alpha'],
  'netflix': ['Disney+', 'HBO Max', 'Amazon Prime Video', 'Hulu', 'Apple TV+', 'Paramount+', 'Peacock'],
  'airbnb': ['Booking.com', 'Vrbo', 'Expedia', 'Hotels.com', 'Agoda', 'TripAdvisor', 'Sonder'],
  'spotify': ['Apple Music', 'Amazon Music', 'YouTube Music', 'Tidal', 'Deezer', 'Pandora', 'SoundCloud'],
  'slack': ['Microsoft Teams', 'Discord', 'Zoom', 'Google Chat', 'Mattermost', 'Rocket.Chat', 'Element'],
  'zoom': ['Microsoft Teams', 'Google Meet', 'Cisco Webex', 'GoToMeeting', 'BlueJeans', 'RingCentral'],
  'stripe': ['PayPal', 'Square', 'Adyen', 'Checkout.com', 'Braintree', 'Authorize.Net', 'Worldpay'],
  'apple': ['Samsung', 'Google', 'Microsoft', 'Huawei', 'Xiaomi', 'OnePlus', 'OPPO', 'Sony'],
  'google': ['Microsoft', 'Apple', 'Amazon', 'Meta', 'Baidu', 'DuckDuckGo', 'Yandex'],
  'amazon': ['Walmart', 'Alibaba', 'eBay', 'Target', 'Shopify', 'Best Buy', 'Costco'],
  'facebook': ['Twitter', 'Instagram', 'TikTok', 'Snapchat', 'LinkedIn', 'Pinterest', 'Reddit'],
  'meta': ['TikTok', 'Twitter', 'Snapchat', 'Pinterest', 'LinkedIn', 'YouTube', 'Discord'],
  'twitter': ['Facebook', 'Instagram', 'TikTok', 'Mastodon', 'Threads', 'Bluesky', 'LinkedIn'],
  'linkedin': ['Indeed', 'Glassdoor', 'AngelList', 'Monster', 'ZipRecruiter', 'Dice', 'CareerBuilder'],
  'salesforce': ['HubSpot', 'Microsoft Dynamics', 'Oracle CRM', 'SAP', 'Zoho', 'Pipedrive', 'Monday.com'],
  'adobe': ['Canva', 'Figma', 'Sketch', 'Affinity', 'CorelDRAW', 'GIMP', 'Inkscape'],
  'shopify': ['WooCommerce', 'BigCommerce', 'Magento', 'Squarespace', 'Wix', 'Square Online', 'Etsy']
}

// Industry-based competitor mapping for fallback
function getIndustryCompetitors(industry: string): string[] {
  const industryMap: Record<string, string[]> = {
    'transportation': ['Uber', 'Lyft', 'Grab', 'Didi Chuxing', 'Ola', 'Bolt'],
    'automotive': ['Tesla', 'Rivian', 'Lucid Motors', 'NIO', 'BYD', 'Ford', 'GM'],
    'entertainment': ['Netflix', 'Disney+', 'HBO Max', 'Amazon Prime', 'Hulu', 'Apple TV+'],
    'streaming': ['Netflix', 'Disney+', 'HBO Max', 'Amazon Prime', 'Hulu', 'Paramount+'],
    'music': ['Spotify', 'Apple Music', 'Amazon Music', 'YouTube Music', 'Tidal', 'Deezer'],
    'ecommerce': ['Amazon', 'Alibaba', 'eBay', 'Shopify', 'Etsy', 'Walmart'],
    'social media': ['Facebook', 'Twitter', 'Instagram', 'TikTok', 'LinkedIn', 'Snapchat'],
    'technology': ['Apple', 'Google', 'Microsoft', 'Amazon', 'Meta', 'Samsung'],
    'fintech': ['Stripe', 'PayPal', 'Square', 'Adyen', 'Klarna', 'Affirm'],
    'ai': ['OpenAI', 'Anthropic', 'Google DeepMind', 'Cohere', 'Stability AI', 'Mistral AI'],
    'hospitality': ['Airbnb', 'Booking.com', 'Expedia', 'Hotels.com', 'Vrbo', 'TripAdvisor'],
    'food delivery': ['DoorDash', 'Uber Eats', 'Grubhub', 'Postmates', 'Deliveroo', 'Just Eat'],
    'cloud': ['AWS', 'Microsoft Azure', 'Google Cloud', 'IBM Cloud', 'Oracle Cloud', 'Alibaba Cloud'],
    'crm': ['Salesforce', 'HubSpot', 'Microsoft Dynamics', 'Oracle CRM', 'Zoho', 'Pipedrive']
  }
  
  // Try to find exact match
  const lowerIndustry = industry.toLowerCase()
  if (industryMap[lowerIndustry]) {
    return industryMap[lowerIndustry]
  }
  
  // Try partial match
  for (const [key, companies] of Object.entries(industryMap)) {
    if (lowerIndustry.includes(key) || key.includes(lowerIndustry)) {
      return companies
    }
  }
  
  // Default tech companies if no match
  return ['Google', 'Microsoft', 'Apple', 'Amazon', 'Meta']
}

async function findRealCompetitors(organization: string, industry?: string) {
  const competitors = []
  const orgLower = organization.toLowerCase()
  
  // Check if we have known competitors
  const knownList = KNOWN_COMPETITORS[orgLower] || []
  
  // Search NewsAPI for actual competitor mentions
  try {
    const searchQueries = [
      `"${organization}" competitors`,
      `"${organization}" versus OR vs`,
      `"${organization}" rival OR rivalry`,
      `companies like "${organization}"`,
      industry ? `${industry} companies` : null,
      industry ? `top ${industry} companies` : null,
      industry ? `leading ${industry} companies` : null
    ].filter(Boolean)
    
    for (const query of searchQueries) {
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=relevancy&pageSize=20`,
        { headers: { 'X-Api-Key': NEWS_API_KEY } }
      )
      
      if (response.ok) {
        const data = await response.json()
        
        for (const article of data.articles || []) {
          const fullText = `${article.title} ${article.description}`
          
          // More flexible patterns to find company names
          const patterns = [
            // Look for companies in lists like "X, Y and Z"
            new RegExp(`${organization}[,\\s]+([A-Z][\\w]+(?:\\s+[A-Z][\\w]+)?)(?:[,\\s]+and|[,\\s]+or)?`, 'g'),
            // Companies mentioned as competitors
            /compet(?:es?|itors?|ing)?\s+(?:with\s+)?([A-Z][\w]+(?:\s+[A-Z][\w]+)?)/gi,
            // Rivals pattern
            /rivals?\s+(?:like\s+)?([A-Z][\w]+(?:\s+[A-Z][\w]+)?)/gi,
            // Versus pattern
            /(?:versus|vs\.?)\s+([A-Z][\w]+(?:\s+[A-Z][\w]+)?)/gi,
            // Alternative pattern
            /alternatives?\s+(?:to\s+)?(?:like\s+)?([A-Z][\w]+(?:\s+[A-Z][\w]+)?)/gi,
            // "other companies like X, Y, Z"
            /companies\s+(?:like|such as)\s+([A-Z][\w]+(?:\s+[A-Z][\w]+)?)/gi,
            // Industry leaders pattern
            /(?:market|industry)\s+leaders?\s+(?:like|including)\s+([A-Z][\w]+(?:\s+[A-Z][\w]+)?)/gi
          ]
          
          for (const pattern of patterns) {
            let match
            while ((match = pattern.exec(fullText)) !== null) {
              const company = match[1]?.trim()
              // Better filtering: no GitHub repos, no generic words
              if (company && 
                  company !== organization && 
                  !company.includes('/') && 
                  !company.includes('github') &&
                  !company.includes('android') &&
                  !company.includes('ios') &&
                  company.length > 2 &&
                  company.length < 50 &&
                  /^[A-Z]/.test(company)) {
                
                if (!competitors.find(c => c.name === company)) {
                  competitors.push({
                    name: company,
                    source: article.source.name,
                    articleTitle: article.title,
                    articleUrl: article.url,
                    publishedAt: article.publishedAt,
                    relevance: 'discovered'
                  })
                }
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error searching for competitors:', error)
  }
  
  // Add known competitors with recent news
  for (const knownCompetitor of knownList) {
    try {
      const response = await fetch(
        `https://newsapi.org/v2/everything?q="${knownCompetitor}"&language=en&sortBy=publishedAt&pageSize=5`,
        { headers: { 'X-Api-Key': NEWS_API_KEY } }
      )
      
      if (response.ok) {
        const data = await response.json()
        const latestArticle = data.articles?.[0]
        
        competitors.push({
          name: knownCompetitor,
          source: 'Industry Knowledge',
          latestNews: latestArticle ? {
            title: latestArticle.title,
            url: latestArticle.url,
            publishedAt: latestArticle.publishedAt,
            source: latestArticle.source.name
          } : null,
          relevance: 'known'
        })
      }
    } catch (error) {
      // Still add the competitor even if news fetch fails
      competitors.push({
        name: knownCompetitor,
        source: 'Industry Knowledge',
        relevance: 'known'
      })
    }
  }
  
  // If no competitors found, try industry-based fallback
  if (competitors.length === 0 && industry) {
    const industryCompetitors = getIndustryCompetitors(industry)
    for (const company of industryCompetitors) {
      if (company.toLowerCase() !== orgLower) {
        competitors.push({
          name: company,
          source: 'Industry Analysis',
          relevance: 'industry'
        })
      }
    }
  }
  
  return competitors
}

async function getCompetitorIntelligence(competitor: any) {
  const intelligence = {
    name: competitor.name,
    recentMoves: [],
    executiveChanges: [],
    pressReleases: [],
    marketPosition: null
  }
  
  try {
    // Search for recent company moves
    const movesResponse = await fetch(
      `https://newsapi.org/v2/everything?q="${competitor.name}" AND (announces OR launches OR partnership OR acquisition)&language=en&sortBy=publishedAt&pageSize=10`,
      { headers: { 'X-Api-Key': NEWS_API_KEY } }
    )
    
    if (movesResponse.ok) {
      const data = await movesResponse.json()
      for (const article of data.articles || []) {
        intelligence.recentMoves.push({
          title: article.title,
          description: article.description,
          url: article.url,
          source: article.source.name,
          publishedAt: article.publishedAt,
          type: detectMoveType(article.title + ' ' + article.description)
        })
      }
    }
    
    // Search for executive changes
    const execResponse = await fetch(
      `https://newsapi.org/v2/everything?q="${competitor.name}" AND (CEO OR CFO OR CTO OR executive OR appoints OR hires)&language=en&sortBy=publishedAt&pageSize=5`,
      { headers: { 'X-Api-Key': NEWS_API_KEY } }
    )
    
    if (execResponse.ok) {
      const data = await execResponse.json()
      for (const article of data.articles || []) {
        if (article.title.match(/CEO|CFO|CTO|Chief|President|Executive/i)) {
          intelligence.executiveChanges.push({
            title: article.title,
            url: article.url,
            source: article.source.name,
            publishedAt: article.publishedAt
          })
        }
      }
    }
    
  } catch (error) {
    console.error(`Error getting intelligence for ${competitor.name}:`, error)
  }
  
  return intelligence
}

function detectMoveType(text: string): string {
  const lowerText = text.toLowerCase()
  if (lowerText.includes('acqui')) return 'acquisition'
  if (lowerText.includes('partner')) return 'partnership'
  if (lowerText.includes('launch')) return 'product_launch'
  if (lowerText.includes('expand') || lowerText.includes('expansion')) return 'expansion'
  if (lowerText.includes('invest') || lowerText.includes('funding')) return 'funding'
  if (lowerText.includes('hire') || lowerText.includes('appoint')) return 'hiring'
  return 'general'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Allow both authenticated and public access for now
    const authHeader = req.headers.get('Authorization')
    console.log(`🎯 PR Intelligence: Auth present: ${!!authHeader}`)
    
    const { method, params } = await req.json()
    console.log(`🎯 PR Intelligence: ${method} called`)
    
    let result = null
    
    switch (method) {
      case 'gather':
      case 'analyze': {
        const organization = params.organization || {}
        const orgName = organization.name || 'Company'
        
        // Use IntelligenceCore to get unified configuration
        const config = await intelligenceCore.getOrganizationConfig(organization)
        console.log(`Using IntelligenceCore config for ${orgName}:`, config.industry, config.competitors.length + ' competitors')
        
        // Gather intelligence from all sources
        const intelligence = await intelligenceCore.gatherIntelligence(config)
        
        // Also find additional competitors using our existing logic
        const additionalCompetitors = await findRealCompetitors(orgName, config.industry)
        
        // Merge competitors from IntelligenceCore and our search
        const allCompetitors = [
          ...config.competitors.map(name => ({ name, source: 'IntelligenceCore', relevance: 'high' })),
          ...additionalCompetitors.filter(c => !config.competitors.includes(c.name))
        ]
        
        // Get detailed intelligence for top competitors
        const insights = []
        for (const competitor of allCompetitors.slice(0, 15)) {
          const intel = await getCompetitorIntelligence(competitor)
          
          // Check if this competitor has mentions in the intelligence news
          const competitorMentions = intelligence.news.filter(article =>
            article.title?.includes(competitor.name) || article.description?.includes(competitor.name)
          )
          
          // Format as PR-useful insight
          insights.push({
            type: 'competitive',
            title: competitor.name,
            insight: intel.recentMoves.length > 0 
              ? `${competitor.name}: ${intel.recentMoves[0].title}`
              : competitorMentions.length > 0
                ? `${competitor.name}: ${competitorMentions[0].title}`
                : `${competitor.name} - Key player in ${config.industry}`,
            relevance: competitor.relevance === 'high' ? 'critical' : 'high',
            actionable: true,
            suggestedAction: generatePRAction(competitor.name, intel),
            source: competitor.source || 'Industry Intelligence',
            data: {
              companyName: competitor.name,
              latestNews: competitor.latestNews || intel.recentMoves[0] || competitorMentions[0],
              executiveChanges: intel.executiveChanges,
              moveType: intel.recentMoves[0]?.type,
              articleUrl: competitor.articleUrl || intel.recentMoves[0]?.url || competitorMentions[0]?.url,
              mentions: competitorMentions.length
            },
            timestamp: new Date().toISOString()
          })
        }
        
        // Add any alerts as high-priority insights
        if (intelligence.alerts?.length > 0) {
          for (const alert of intelligence.alerts.slice(0, 3)) {
            insights.unshift({
              type: 'alert',
              title: 'Critical Industry Alert',
              insight: alert.title,
              relevance: 'critical',
              actionable: true,
              suggestedAction: 'Immediate assessment and response strategy required',
              source: alert.source,
              data: {
                alertType: alert.type,
                severity: alert.severity,
                url: alert.url
              },
              timestamp: alert.timestamp
            })
          }
        }
        
        result = {
          insights,
          summary: {
            industry: config.industry,
            totalCompetitors: insights.filter(i => i.type === 'competitive').length,
            withRecentNews: insights.filter(i => i.data.latestNews).length,
            executiveChanges: insights.filter(i => i.data.executiveChanges?.length > 0).length,
            alerts: intelligence.alerts?.length || 0,
            opportunities: intelligence.opportunities?.length || 0
          },
          recommendations: generateStrategicRecommendations(orgName, insights),
          intelligenceConfig: {
            industry: config.industry,
            monitoringKeywords: config.keywords.slice(0, 10),
            topCompetitors: config.competitors.slice(0, 5)
          }
        }
        break
      }
      
      default:
        result = { message: `Method ${method} not implemented` }
    }
    
    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

function generatePRAction(competitorName: string, intel: any): string {
  if (intel.executiveChanges?.length > 0) {
    return `Monitor ${competitorName}'s new leadership direction and prepare competitive positioning`
  }
  if (intel.recentMoves?.some(m => m.type === 'product_launch')) {
    return `Analyze ${competitorName}'s new product and prepare differentiation messaging`
  }
  if (intel.recentMoves?.some(m => m.type === 'partnership')) {
    return `Evaluate partnership implications and identify similar opportunities`
  }
  if (intel.recentMoves?.some(m => m.type === 'acquisition')) {
    return `Assess market consolidation impact and adjust positioning`
  }
  return `Track ${competitorName}'s media presence and identify PR opportunities`
}

function generateStrategicRecommendations(organization: string, insights: any[]): string[] {
  const recommendations = []
  
  if (insights.filter(i => i.data.executiveChanges?.length > 0).length > 2) {
    recommendations.push('Industry seeing executive turnover - opportunity for thought leadership on stability')
  }
  
  if (insights.filter(i => i.data.moveType === 'partnership').length > 1) {
    recommendations.push('Competitors forming partnerships - evaluate strategic alliance opportunities')
  }
  
  if (insights.filter(i => i.data.moveType === 'product_launch').length > 0) {
    recommendations.push('Competitor product launches detected - prepare differentiation messaging')
  }
  
  if (insights.filter(i => i.relevance === 'high').length > 5) {
    recommendations.push('High competitive activity - increase PR cadence to maintain visibility')
  }
  
  recommendations.push(`Monitor top ${Math.min(3, insights.length)} competitors for rapid response opportunities`)
  
  return recommendations
}