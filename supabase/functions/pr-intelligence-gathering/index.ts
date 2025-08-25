// PR-Focused Intelligence Gathering
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

const FIRECRAWL_API_KEY = 'fc-3048810124b640eb99293880a4ab25d0'

interface PRIntelligence {
  media_opportunities: any[]
  competitor_moves: any[]
  trending_narratives: any[]
  crisis_signals: any[]
  journalist_activity: any[]
}

async function gatherPRIntelligence(organization: any, competitors: string[]): Promise<PRIntelligence> {
  console.log('🎯 Gathering PR-focused intelligence for:', organization.name)
  
  const intelligence: PRIntelligence = {
    media_opportunities: [],
    competitor_moves: [],
    trending_narratives: [],
    crisis_signals: [],
    journalist_activity: []
  }
  
  // 1. Search for competitor press coverage (last 48 hours)
  for (const competitor of competitors.slice(0, 5)) {
    try {
      console.log(`📰 Searching for ${competitor} press coverage...`)
      
      const searchQuery = `"${competitor}" announcement OR launches OR announces OR unveils site:techcrunch.com OR site:reuters.com OR site:bloomberg.com OR site:wsj.com`
      
      const response = await fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: searchQuery,
          limit: 10
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          for (const result of data.data) {
            // Extract journalist name from article if possible
            const journalistMatch = result.markdown?.match(/By\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/);
            const journalist = journalistMatch ? journalistMatch[1] : null;
            
            // Categorize the intelligence
            const isAnnouncement = /announce|launch|unveil|introduce|debut/i.test(result.title);
            const isFunding = /funding|raises|series|investment|valuation/i.test(result.title);
            const isProduct = /product|feature|release|update|version/i.test(result.title);
            
            if (isAnnouncement || isFunding || isProduct) {
              intelligence.competitor_moves.push({
                competitor,
                type: isFunding ? 'funding' : isProduct ? 'product' : 'announcement',
                headline: result.title,
                url: result.url,
                publication: new URL(result.url).hostname.replace('www.', ''),
                journalist,
                timestamp: new Date().toISOString(),
                pr_angle: generatePRAngle(competitor, result.title, organization.name),
                response_urgency: 'high'
              })
            }
            
            // Track journalist activity
            if (journalist) {
              intelligence.journalist_activity.push({
                name: journalist,
                publication: new URL(result.url).hostname.replace('www.', ''),
                recent_article: result.title,
                topic: competitor,
                url: result.url,
                pitch_angle: `Similar story for ${organization.name}`
              })
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error searching ${competitor}:`, error)
    }
    
    // Add delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  // 2. Search for trending industry topics
  const trendingSearches = [
    `"${organization.industry}" trends 2024 2025`,
    `"${organization.industry}" innovation disruption`,
    `"${organization.industry}" challenges problems`
  ]
  
  for (const searchQuery of trendingSearches) {
    try {
      console.log(`🔥 Searching trending: ${searchQuery}`)
      
      const response = await fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: searchQuery,
          limit: 5
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          for (const result of data.data) {
            // Extract key topics from title and description
            const topics = extractTopics(result.title + ' ' + result.description)
            
            intelligence.trending_narratives.push({
              narrative: result.title,
              topics,
              url: result.url,
              source: new URL(result.url).hostname.replace('www.', ''),
              opportunity: `Position ${organization.name} as thought leader on ${topics[0]}`,
              action: 'Develop unique perspective and pitch to media'
            })
          }
        }
      }
    } catch (error) {
      console.error('Trending search error:', error)
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  // 3. Identify media opportunities
  const mediaOpportunities = [
    ...intelligence.competitor_moves.map(move => ({
      type: 'competitive_response',
      headline: `Respond to ${move.competitor}'s ${move.type}`,
      angle: move.pr_angle,
      urgency: 'high',
      action: `Draft response highlighting ${organization.name}'s advantages`,
      contacts: move.journalist ? [move.journalist] : [],
      deadline: '48 hours'
    })),
    ...intelligence.trending_narratives.slice(0, 3).map(narrative => ({
      type: 'thought_leadership',
      headline: `Lead conversation on ${narrative.topics[0]}`,
      angle: narrative.opportunity,
      urgency: 'medium',
      action: narrative.action,
      contacts: [],
      deadline: '1 week'
    }))
  ]
  
  intelligence.media_opportunities = mediaOpportunities
  
  // 4. Check for crisis signals
  const crisisKeywords = ['controversy', 'scandal', 'lawsuit', 'breach', 'leak', 'complaint', 'investigation']
  const crisisSignals = intelligence.competitor_moves.filter(move => 
    crisisKeywords.some(keyword => move.headline.toLowerCase().includes(keyword))
  )
  
  if (crisisSignals.length > 0) {
    intelligence.crisis_signals = crisisSignals.map(signal => ({
      type: 'competitor_crisis',
      entity: signal.competitor,
      issue: signal.headline,
      opportunity: 'Position as industry leader while competitor struggles',
      action: 'Prepare statements emphasizing our strengths in this area'
    }))
  }
  
  return intelligence
}

function generatePRAngle(competitor: string, theirAction: string, ourCompany: string): string {
  if (theirAction.includes('funding') || theirAction.includes('raises')) {
    return `${ourCompany} achieves growth through efficiency, not just capital`
  }
  if (theirAction.includes('product') || theirAction.includes('launch')) {
    return `${ourCompany}'s established solution vs ${competitor}'s unproven offering`
  }
  if (theirAction.includes('partnership')) {
    return `${ourCompany}'s ecosystem advantage`
  }
  return `${ourCompany}'s differentiated approach to the market`
}

function extractTopics(text: string): string[] {
  const topics = []
  
  // Technology topics
  const techTopics = ['AI', 'machine learning', 'automation', 'blockchain', 'cloud', 'cybersecurity', 'data', 'digital transformation']
  techTopics.forEach(topic => {
    if (text.toLowerCase().includes(topic.toLowerCase())) {
      topics.push(topic)
    }
  })
  
  // Business topics  
  const bizTopics = ['sustainability', 'innovation', 'growth', 'efficiency', 'customer experience', 'supply chain', 'remote work']
  bizTopics.forEach(topic => {
    if (text.toLowerCase().includes(topic.toLowerCase())) {
      topics.push(topic)
    }
  })
  
  return topics.slice(0, 3)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { organization, competitors } = await req.json()
    
    const intelligence = await gatherPRIntelligence(
      organization,
      competitors || []
    )
    
    console.log('✅ PR Intelligence gathered:', {
      media_opportunities: intelligence.media_opportunities.length,
      competitor_moves: intelligence.competitor_moves.length,
      trending_narratives: intelligence.trending_narratives.length,
      journalist_activity: intelligence.journalist_activity.length,
      crisis_signals: intelligence.crisis_signals.length
    })
    
    return new Response(
      JSON.stringify({
        success: true,
        ...intelligence,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('PR Intelligence error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        media_opportunities: [],
        competitor_moves: [],
        trending_narratives: [],
        journalist_activity: [],
        crisis_signals: []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})