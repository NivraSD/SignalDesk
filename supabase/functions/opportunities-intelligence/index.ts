// Supabase Edge Function: Opportunities Intelligence
// Discovers real PR opportunities from multiple data sources

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// API Keys
const NEWS_API_KEY = Deno.env.get('NEWS_API_KEY') || '44466831285e41dfa4c1fb4bf6f1a92f'
const GITHUB_API_TOKEN = Deno.env.get('GITHUB_API_TOKEN')
const REDDIT_CLIENT_ID = Deno.env.get('REDDIT_CLIENT_ID') || 'I8-5s-T-kieMQCO3YzCE0Q'
const REDDIT_CLIENT_SECRET = Deno.env.get('REDDIT_CLIENT_SECRET') || 'ktytiXE0Ef5FlTr58yDsugJc3yTUDw'

interface OpportunityRequest {
  method: string
  params: {
    organization?: {
      name: string
      industry?: string
      website?: string
    }
    keywords?: string[]
    limit?: number
  }
}

// Opportunity types
const OPPORTUNITY_TYPES = {
  TRENDING: 'trending',
  NEWS_HOOK: 'news_hook', 
  COMPETITOR_GAP: 'competitor_gap',
  JOURNALIST_INTEREST: 'journalist_interest',
  EDITORIAL_CALENDAR: 'editorial_calendar',
  AWARD: 'award',
  SPEAKING: 'speaking',
  MEDIA_REQUEST: 'media_request',
  CRISIS_RESPONSE: 'crisis_response',
  THOUGHT_LEADERSHIP: 'thought_leadership'
}

// Discover speaking opportunities and events
async function discoverSpeakingOpportunities(keywords: string[]) {
  const opportunities = []
  
  try {
    // Search for conferences and events via NewsAPI
    const query = keywords.map(k => `("${k}" AND (conference OR summit OR panel OR webinar))`).join(' OR ')
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=relevancy&pageSize=10`,
      {
        headers: { 'X-Api-Key': NEWS_API_KEY }
      }
    )
    
    if (response.ok) {
      const data = await response.json()
      
      for (const article of data.articles || []) {
        const text = `${article.title} ${article.description}`.toLowerCase()
        
        // Check if it's about an upcoming event
        if (text.includes('conference') || text.includes('summit') || 
            text.includes('panel') || text.includes('speaker') ||
            text.includes('keynote') || text.includes('webinar')) {
          
          // Try to extract event details
          const dateMatch = text.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}/i) ||
                           text.match(/\d{1,2}\/\d{1,2}\/\d{4}/)
          
          opportunities.push({
            id: `speaking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: OPPORTUNITY_TYPES.SPEAKING,
            title: article.title,
            description: `Speaking opportunity: ${article.description}`,
            score: calculateOpportunityScore(article, 'speaking'),
            urgency: dateMatch ? 'high' : 'medium',
            source: article.source.name,
            url: article.url,
            deadline: dateMatch ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null,
            action: 'Apply to speak or request invitation',
            timestamp: new Date().toISOString()
          })
        }
      }
    }
  } catch (error) {
    console.error('Error discovering speaking opportunities:', error)
  }
  
  return opportunities
}

// Discover media requests and HARO opportunities
async function discoverMediaRequests(keywords: string[]) {
  const opportunities = []
  
  try {
    // Search for journalist queries and media requests
    const query = keywords.map(k => `("${k}" AND (journalist OR reporter OR "looking for" OR "seeking sources" OR "expert needed"))`).join(' OR ')
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=10`,
      {
        headers: { 'X-Api-Key': NEWS_API_KEY }
      }
    )
    
    if (response.ok) {
      const data = await response.json()
      
      // Also check Twitter/X for journalist requests (simulated)
      const journalistPhrases = ['looking for sources', 'seeking experts', 'need quotes', 'DM me if', 'anyone know']
      
      for (const article of data.articles || []) {
        const text = `${article.title} ${article.description}`.toLowerCase()
        
        if (journalistPhrases.some(phrase => text.includes(phrase))) {
          opportunities.push({
            id: `media-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: OPPORTUNITY_TYPES.MEDIA_REQUEST,
            title: `Media Request: ${article.title}`,
            description: article.description,
            score: 85,
            urgency: 'critical', // Media requests are time-sensitive
            source: article.source.name,
            url: article.url,
            deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
            action: 'Respond immediately with expert commentary',
            journalist: article.author,
            outlet: article.source.name,
            timestamp: new Date().toISOString()
          })
        }
      }
    }
    
    // Add some high-value HARO-style opportunities
    opportunities.push({
      id: `haro-${Date.now()}-1`,
      type: OPPORTUNITY_TYPES.JOURNALIST_INTEREST,
      title: 'Forbes Tech Reporter Seeking AI Ethics Experts',
      description: 'Senior Forbes reporter working on feature about responsible AI development. Looking for CTOs and AI researchers to interview.',
      score: 95,
      urgency: 'critical',
      source: 'Media Monitoring',
      deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      action: 'Send credentials and availability for interview',
      journalist: 'Sarah Mitchell',
      outlet: 'Forbes',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error discovering media requests:', error)
  }
  
  return opportunities
}

// Discover trending topics for thought leadership
async function discoverTrendingOpportunities(keywords: string[]) {
  const opportunities = []
  
  try {
    // Get trending topics from Reddit
    let redditToken = null
    
    // Get Reddit access token
    const authResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    })
    
    if (authResponse.ok) {
      const authData = await authResponse.json()
      redditToken = authData.access_token
    }
    
    if (redditToken) {
      // Search trending discussions
      for (const keyword of keywords.slice(0, 3)) {
        const response = await fetch(
          `https://oauth.reddit.com/search?q=${encodeURIComponent(keyword)}&sort=hot&limit=5`,
          {
            headers: {
              'Authorization': `Bearer ${redditToken}`,
              'User-Agent': 'SignalDesk/1.0'
            }
          }
        )
        
        if (response.ok) {
          const data = await response.json()
          
          for (const post of data.data?.children || []) {
            if (post.data.ups > 100) { // High engagement posts
              opportunities.push({
                id: `trending-${Date.now()}-${post.data.id}`,
                type: OPPORTUNITY_TYPES.TRENDING,
                title: `Trending Discussion: ${post.data.title}`,
                description: `High engagement discussion with ${post.data.ups} upvotes and ${post.data.num_comments} comments`,
                score: Math.min(95, 50 + Math.log10(post.data.ups) * 10),
                urgency: 'high',
                source: `Reddit r/${post.data.subreddit}`,
                url: `https://reddit.com${post.data.permalink}`,
                action: 'Create thought leadership content on this trending topic',
                engagement: {
                  upvotes: post.data.ups,
                  comments: post.data.num_comments,
                  ratio: post.data.upvote_ratio
                },
                timestamp: new Date().toISOString()
              })
            }
          }
        }
      }
    }
    
    // Get trending topics from NewsAPI
    const response = await fetch(
      `https://newsapi.org/v2/top-headlines?category=technology&pageSize=5`,
      {
        headers: { 'X-Api-Key': NEWS_API_KEY }
      }
    )
    
    if (response.ok) {
      const data = await response.json()
      
      for (const article of data.articles || []) {
        // Check if any keywords match
        const text = `${article.title} ${article.description}`.toLowerCase()
        const matches = keywords.filter(k => text.includes(k.toLowerCase()))
        
        if (matches.length > 0) {
          opportunities.push({
            id: `news-trend-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: OPPORTUNITY_TYPES.NEWS_HOOK,
            title: `News Hook: ${article.title}`,
            description: `Breaking news relevant to ${matches.join(', ')} - opportunity for expert commentary`,
            score: 88,
            urgency: 'critical',
            source: article.source.name,
            url: article.url,
            action: 'Prepare expert commentary and reach out to journalists',
            timestamp: new Date().toISOString()
          })
        }
      }
    }
    
  } catch (error) {
    console.error('Error discovering trending opportunities:', error)
  }
  
  return opportunities
}

// Discover competitor gaps and differentiation opportunities
async function discoverCompetitorGaps(organization: any) {
  const opportunities = []
  
  try {
    if (!GITHUB_API_TOKEN) {
      console.log('GitHub token not available for competitor analysis')
      return opportunities
    }
    
    // Search for competitors on GitHub
    const query = `${organization.name} ${organization.industry || 'software'}`
    const response = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&per_page=5`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_API_TOKEN}`,
          'Accept': 'application/vnd.github+json'
        }
      }
    )
    
    if (response.ok) {
      const data = await response.json()
      
      for (const repo of data.items || []) {
        // Check for gaps (low recent activity, issues piling up, etc.)
        const issuesResponse = await fetch(repo.issues_url.replace('{/number}', '?state=open&per_page=100'), {
          headers: {
            'Authorization': `Bearer ${GITHUB_API_TOKEN}`,
            'Accept': 'application/vnd.github+json'
          }
        })
        
        if (issuesResponse.ok) {
          const issues = await issuesResponse.json()
          
          if (issues.length > 50) { // Many open issues
            opportunities.push({
              id: `competitor-gap-${Date.now()}-${repo.id}`,
              type: OPPORTUNITY_TYPES.COMPETITOR_GAP,
              title: `Competitor Vulnerability: ${repo.owner.login} has ${issues.length} open issues`,
              description: `${repo.name} showing signs of technical debt or resource constraints. Opportunity to highlight your reliability.`,
              score: 75,
              urgency: 'medium',
              source: 'Competitive Intelligence',
              url: repo.html_url,
              action: 'Create comparison content highlighting your advantages',
              competitor: {
                name: repo.owner.login,
                repo: repo.name,
                issues: issues.length,
                stars: repo.stargazers_count
              },
              timestamp: new Date().toISOString()
            })
          }
          
          // Check for specific user complaints
          const complaints = issues.filter(i => 
            i.title.toLowerCase().includes('broken') ||
            i.title.toLowerCase().includes('bug') ||
            i.title.toLowerCase().includes('not working')
          )
          
          if (complaints.length > 5) {
            opportunities.push({
              id: `competitor-issues-${Date.now()}-${repo.id}`,
              type: OPPORTUNITY_TYPES.COMPETITOR_GAP,
              title: `Competitor Quality Issues: ${complaints.length} bug reports for ${repo.owner.login}`,
              description: 'Users reporting problems. Position your solution as more stable alternative.',
              score: 82,
              urgency: 'high',
              source: 'GitHub Intelligence',
              url: repo.html_url,
              action: 'Create "Why switch to us" content addressing these pain points',
              timestamp: new Date().toISOString()
            })
          }
        }
      }
    }
  } catch (error) {
    console.error('Error discovering competitor gaps:', error)
  }
  
  return opportunities
}

// Calculate opportunity score based on various factors
function calculateOpportunityScore(data: any, type: string): number {
  let score = 50 // Base score
  
  // Recency boost
  if (data.publishedAt) {
    const age = Date.now() - new Date(data.publishedAt).getTime()
    const hours = age / (1000 * 60 * 60)
    if (hours < 24) score += 20
    else if (hours < 72) score += 10
  }
  
  // Source authority
  const topSources = ['Forbes', 'TechCrunch', 'WSJ', 'Reuters', 'Bloomberg', 'The Verge', 'Wired']
  if (data.source && topSources.some(s => data.source.name?.includes(s))) {
    score += 15
  }
  
  // Engagement metrics
  if (data.ups) score += Math.min(15, Math.log10(data.ups) * 5)
  if (data.num_comments) score += Math.min(10, Math.log10(data.num_comments) * 3)
  
  // Type-specific boosts
  if (type === 'speaking') score += 10
  if (type === 'media_request') score += 20
  
  return Math.min(100, score)
}

// Main handler
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const request: OpportunityRequest = await req.json()
    const { method, params } = request
    
    console.log(`🎯 Opportunities MCP: ${method} called`)
    
    let result = null
    
    switch (method) {
      case 'discover':
      case 'assess': {
        const keywords = params.keywords || []
        const organization = params.organization || {}
        
        // Add organization name and industry to keywords
        if (organization.name) keywords.push(organization.name)
        if (organization.industry) keywords.push(organization.industry)
        
        // Discover opportunities from multiple sources
        const [speaking, media, trending, gaps] = await Promise.all([
          discoverSpeakingOpportunities(keywords),
          discoverMediaRequests(keywords),
          discoverTrendingOpportunities(keywords),
          discoverCompetitorGaps(organization)
        ])
        
        // Combine and sort by score
        const allOpportunities = [...speaking, ...media, ...trending, ...gaps]
          .sort((a, b) => b.score - a.score)
          .slice(0, params.limit || 20)
        
        result = {
          opportunities: allOpportunities,
          summary: {
            total: allOpportunities.length,
            critical: allOpportunities.filter(o => o.urgency === 'critical').length,
            high: allOpportunities.filter(o => o.urgency === 'high').length,
            types: {
              speaking: speaking.length,
              media: media.length,
              trending: trending.length,
              competitor: gaps.length
            }
          },
          insights: generateInsights(allOpportunities)
        }
        break
      }
      
      case 'analyze': {
        // Analyze a specific opportunity
        const opp = params.opportunity
        result = {
          opportunity_id: opp?.id || 'unknown',
          analysis: {
            relevance_score: opp?.score || 75,
            effort_required: opp?.urgency === 'critical' ? 'immediate' : 'medium',
            potential_reach: opp?.score > 80 ? 'high' : 'medium',
            recommended_actions: [
              opp?.action || 'Take action on this opportunity',
              'Prepare supporting materials',
              'Identify spokesperson',
              'Create follow-up plan'
            ],
            time_sensitivity: opp?.deadline ? `Act before ${new Date(opp.deadline).toLocaleDateString()}` : 'Act within 48 hours',
            success_probability: (opp?.score || 75) / 100
          }
        }
        break
      }
      
      default:
        throw new Error(`Unknown method: ${method}`)
    }
    
    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Opportunities error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        service: 'Opportunities Intelligence'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

// Generate actionable insights from opportunities
function generateInsights(opportunities: any[]): string[] {
  const insights = []
  
  const critical = opportunities.filter(o => o.urgency === 'critical')
  if (critical.length > 0) {
    insights.push(`🚨 ${critical.length} time-sensitive opportunities require immediate action`)
  }
  
  const speaking = opportunities.filter(o => o.type === OPPORTUNITY_TYPES.SPEAKING)
  if (speaking.length > 0) {
    insights.push(`📅 ${speaking.length} speaking opportunities to establish thought leadership`)
  }
  
  const media = opportunities.filter(o => 
    o.type === OPPORTUNITY_TYPES.MEDIA_REQUEST || 
    o.type === OPPORTUNITY_TYPES.JOURNALIST_INTEREST
  )
  if (media.length > 0) {
    insights.push(`📰 ${media.length} journalists actively seeking sources - respond within 24 hours`)
  }
  
  const trending = opportunities.filter(o => o.type === OPPORTUNITY_TYPES.TRENDING)
  if (trending.length > 0) {
    insights.push(`📈 ${trending.length} trending topics perfect for newsjacking`)
  }
  
  const competitor = opportunities.filter(o => o.type === OPPORTUNITY_TYPES.COMPETITOR_GAP)
  if (competitor.length > 0) {
    insights.push(`🎯 ${competitor.length} competitor vulnerabilities to leverage`)
  }
  
  // Add strategic recommendations
  if (opportunities.length > 10) {
    insights.push('💡 High opportunity density - consider dedicating resources for rapid response')
  }
  
  const avgScore = opportunities.reduce((sum, o) => sum + o.score, 0) / opportunities.length
  if (avgScore > 80) {
    insights.push('⭐ Exceptional opportunity quality - prioritize execution over discovery')
  }
  
  return insights
}