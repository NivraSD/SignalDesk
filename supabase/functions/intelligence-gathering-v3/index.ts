// Intelligence Gathering V3 - Streamlined Entity Action Tracking
// Gathers actual intelligence using Firecrawl API and RSS feeds

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

const FIRECRAWL_API_KEY = 'fc-3048810124b640eb99293880a4ab25d0'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'

console.log('🔑 Gathering V3 - Starting Edge Function with Firecrawl and RSS')

async function fetchWithTimeout(url: string, options: any = {}, timeoutMs: number = 5000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

// Search using Firecrawl API
async function searchWithFirecrawl(query: string, limit: number = 5) {
  try {
    // Add timestamp to force fresh results
    const timestampedQuery = `${query} ${new Date().toISOString().split('T')[0]} -site:archive.org`
    console.log(`🔥 Firecrawl search: ${timestampedQuery}`)
    
    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        query: timestampedQuery, 
        limit,
        pageOptions: {
          onlyMainContent: true
        }
      })
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log(`✅ Firecrawl returned ${result?.data?.length || 0} results`)
      return result?.data || []
    }
  } catch (error) {
    console.error('Firecrawl search failed:', error)
  }
  return []
}

// Fetch RSS feeds from source-registry
async function fetchRSSFeeds(industry: string, limit: number = 20) {
  try {
    console.log(`📡 Fetching RSS feeds for industry: ${industry}`)
    const response = await fetch(
      `https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/source-registry?industry=${industry}&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    if (response.ok) {
      const data = await response.json()
      console.log(`✅ Got ${data.articles?.length || 0} RSS articles`)
      return data.articles || []
    }
  } catch (error) {
    console.error('RSS feed fetch failed:', error)
  }
  return []
}

// Track specific entity actions using Firecrawl and RSS
async function gatherEntityActions(entities: any, organization: any) {
  console.log('🔍 Gathering entity actions for:', Object.keys(entities))
  const actions = []
  const actionKeywords = [
    // Business actions
    'announced', 'launched', 'acquired', 'raised', 'partnered',
    'filed', 'released', 'appointed', 'expanded', 'cut',
    // Legal/regulatory
    'sued', 'investigated', 'fined', 'approved', 'rejected', 'sanctioned',
    // Activist actions
    'protested', 'boycott', 'petition', 'campaign', 'targeted', 'criticized',
    // Geopolitical
    'banned', 'restricted', 'tariff', 'embargo', 'threatened', 'tensions',
    // Personnel/thought leadership
    'said', 'warned', 'predicted', 'argued', 'testified', 'tweeted'
  ]
  
  // FIRST: Get RSS feeds for the industry
  const rssArticles = await fetchRSSFeeds(organization?.industry || 'technology', 30)
  console.log(`📰 Processing ${rssArticles.length} RSS articles`)
  
  // Process RSS articles for entity mentions - PRIORITIZE STAKEHOLDER MENTIONS
  for (const article of rssArticles.slice(0, 20)) { // Process more articles for better coverage
    let articleAdded = false
    
    // Check if article mentions any specific stakeholder entities
    for (const [entityType, entityList] of Object.entries(entities)) {
      if (!Array.isArray(entityList)) continue
      
      for (const entity of entityList) {
        const entityName = entity.name?.toLowerCase()
        if (!entityName) continue
        
        if (article.title?.toLowerCase().includes(entityName) || 
            article.description?.toLowerCase().includes(entityName)) {
          
          const actionType = actionKeywords.find(keyword => 
            article.title?.toLowerCase().includes(keyword.toLowerCase()) ||
            article.description?.toLowerCase().includes(keyword.toLowerCase())
          ) || 'activity'
          
          actions.push({
            entity: entity.name,
            entity_type: entityType,
            action: actionType,
            headline: article.title,
            source: article.source,
            timestamp: article.published,
            importance: entity.importance || 'high',
            data_source: 'rss',
            url: article.url,
            stakeholder_category: entityType // Mark as stakeholder intelligence
          })
          articleAdded = true
          
          console.log(`✅ Found ${entityType} mention: ${entity.name} in ${article.title}`)
        }
      }
    }
    
    // Only add as general industry if it's ACTUALLY relevant to the organization's industry
    if (!articleAdded && organization?.industry) {
      const industryKeywords = {
        'retail': ['fashion', 'clothing', 'apparel', 'retail', 'shopping', 'store', 'brand'],
        'technology': ['tech', 'software', 'AI', 'cloud', 'digital', 'platform', 'startup'],
        'finance': ['banking', 'finance', 'investment', 'trading', 'fintech', 'payment'],
        'healthcare': ['health', 'medical', 'pharma', 'biotech', 'hospital', 'treatment']
      }
      
      const relevantKeywords = industryKeywords[organization.industry] || industryKeywords['technology']
      const isRelevant = relevantKeywords.some(kw => 
        article.title?.toLowerCase().includes(kw.toLowerCase()) ||
        article.description?.toLowerCase().includes(kw.toLowerCase())
      )
      
      if (isRelevant) {
        const actionType = actionKeywords.find(keyword => 
          article.title?.toLowerCase().includes(keyword.toLowerCase()) ||
          article.description?.toLowerCase().includes(keyword.toLowerCase())
        ) || 'industry_trend'
        
        actions.push({
          entity: `${organization.industry} Industry`,
          entity_type: 'market',
          action: actionType,
          headline: article.title,
          source: article.source,
          timestamp: article.published,
          importance: 'medium',
          data_source: 'rss',
          url: article.url
        })
      }
    }
  }
  
  // SECOND: Use Firecrawl for targeted searches on key entities
  for (const [entityType, entityList] of Object.entries(entities)) {
    if (!Array.isArray(entityList)) continue
    
    console.log(`🎯 Processing ${entityType} with Firecrawl:`, entityList.length, 'entities')
    
    // Process top entities with Firecrawl for deeper intelligence
    const entitiesToProcess = entityType === 'competitors' ? 3 : 
                             entityType === 'activists' ? 2 : 
                             entityType === 'geopolitical' ? 2 : 1
    
    for (const entity of entityList.slice(0, entitiesToProcess)) {
      try {
        const entityName = entity.name
        console.log(`  🔥 Firecrawl search for ${entityType}: ${entityName}`)
        
        // Build targeted search based on entity type
        let searchQuery = ''
        const currentYear = new Date().getFullYear()
        
        if (entityType === 'competitors') {
          searchQuery = `"${entityName}" (announcement OR product OR earnings OR strategy) ${currentYear}`
        } else if (entityType === 'regulators') {
          searchQuery = `"${entityName}" (regulation OR policy OR investigation OR ruling) ${currentYear}`
        } else if (entityType === 'activists') {
          searchQuery = `"${entityName}" (campaign OR protest OR report OR demands) ${currentYear}`
        } else if (entityType === 'media') {
          searchQuery = `"${entityName}" (article OR investigation OR report) ${currentYear}`
        } else if (entityType === 'investors') {
          searchQuery = `"${entityName}" (investment OR portfolio OR ESG OR activism) ${currentYear}`
        } else {
          searchQuery = `"${entityName}" news ${currentYear}`
        }
        
        const searchResults = await searchWithFirecrawl(searchQuery, 5)
        
        for (const result of searchResults) {
          if (result.title && result.url) {
            const actionType = actionKeywords.find(keyword => 
              result.title?.toLowerCase().includes(keyword.toLowerCase()) ||
              result.description?.toLowerCase().includes(keyword.toLowerCase())
            ) || 'activity'
            
            actions.push({
              entity: entityName,
              entity_type: entityType,
              action: actionType,
              headline: result.title,
              source: new URL(result.url).hostname,
              timestamp: new Date().toISOString(),
              importance: entity.importance || 'high',
              data_source: 'firecrawl',
              url: result.url
            })
          }
        }
      } catch (error) {
        console.log(`Error with Firecrawl for ${entity.name}: ${error.message}`)
      }
    }
  }
  
  // Sort by timestamp (newest first) and remove duplicates
  const uniqueActions = Array.from(
    new Map(actions.map(a => [`${a.entity}-${a.headline}`, a])).values()
  )
  
  return uniqueActions.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
}

// Monitor trending topics
async function gatherTopicTrends(topics: any[]) {
  const trends = []
  
  // Process more topics for diverse coverage
  for (const topic of topics.slice(0, 10)) { // Process up to 10 topics for broader coverage
    try {
      // Recent events only - last 24 hours with timestamp
      const searchQuery = `"${topic.name}" when:1d`
      const timestamp = Date.now()
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(searchQuery)}&hl=en-US&gl=US&ceid=US:en&t=${timestamp}`
      
      const response = await fetchWithTimeout(url, {}, 3000)
      if (response.ok) {
        const xmlText = await response.text()
        const items = xmlText.match(/<item>[\s\S]*?<\/item>/gi) || []
        const articleCount = items.length
        
        // Get sample headlines
        const headlines = []
        for (const item of items.slice(0, 3)) {
          const title = item.match(/<title>(.*?)<\/title>/)?.[1] || ''
          if (title) {
            headlines.push(title.replace(/<!\\[CDATA\\[|\\]\\]>/g, '').replace(/&amp;/g, '&'))
          }
        }
        
        trends.push({
          topic: topic.name,
          category: topic.category || 'general',
          urgency: topic.urgency || 'medium',
          momentum: articleCount > 20 ? 'accelerating' : articleCount > 10 ? 'growing' : 'steady',
          article_count: articleCount,
          sample_headlines: headlines
        })
      }
    } catch (error) {
      console.log(`Error fetching trend for ${topic.name}: ${error.message}`)
    }
  }
  
  return trends
}

async function gatherIntelligence(discovery: any, organization: any) {
  console.log(`📡 V3 Gathering: Collecting intelligence for ${organization.name}`)
  console.log('📋 Discovery entities:', Object.keys(discovery.entities || {}))
  console.log('📋 Discovery topics count:', discovery.topics?.length || 0)
  
  try {
    // Parallel gathering
    const [entityActions, topicTrends] = await Promise.all([
      gatherEntityActions(discovery.entities || {}, organization),
      gatherTopicTrends(discovery.topics || [])
    ])
    
    console.log(`✅ Gathered ${entityActions.length} actions and ${topicTrends.length} trends`)
    
    // Organize by importance
    const criticalActions = entityActions.filter(a => a.importance === 'critical')
    const highPriorityActions = entityActions.filter(a => a.importance === 'high')
    const hotTopics = topicTrends.filter(t => t.momentum === 'accelerating')
    
    return {
      success: true,
      organization: organization.name,
      timestamp: new Date().toISOString(),
      intelligence: {
        entity_actions: {
          all: entityActions,
          critical: criticalActions,
          high_priority: highPriorityActions,
          by_entity_type: groupBy(entityActions, 'entity_type'),
          total_count: entityActions.length
        },
        topic_trends: {
          all: topicTrends,
          hot_topics: hotTopics,
          by_category: groupBy(topicTrends, 'category'),
          total_monitored: topicTrends.length
        },
        summary: {
          requires_attention: criticalActions.length > 0,
          key_movements: [...criticalActions, ...highPriorityActions].slice(0, 5),
          trending_topics: hotTopics.map(t => t.topic),
          total_intelligence_points: entityActions.length + topicTrends.length
        }
      },
      statistics: {
        entities_tracked: Object.values(discovery.entities || {}).reduce((acc: number, arr: any) => acc + arr.length, 0),
        actions_captured: entityActions.length,
        topics_monitored: topicTrends.length,
        critical_items: criticalActions.length
      }
    }
  } catch (error) {
    console.error('Gathering error:', error)
    return {
      success: false,
      error: error.message,
      intelligence: {
        entity_actions: { all: [], critical: [], high_priority: [], by_entity_type: {}, total_count: 0 },
        topic_trends: { all: [], hot_topics: [], by_category: {}, total_monitored: 0 },
        summary: { requires_attention: false, key_movements: [], trending_topics: [], total_intelligence_points: 0 }
      }
    }
  }
}

function groupBy(array: any[], key: string) {
  return array.reduce((result, item) => {
    const group = item[key]
    if (!result[group]) result[group] = []
    result[group].push(item)
    return result
  }, {})
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { discovery, organization } = await req.json()
    
    console.log('📋 Gathering V3 - Processing for:', organization?.name)
    console.log('📋 Discovery data received:', {
      hasEntities: !!discovery?.entities,
      hasTopics: !!discovery?.topics,
      entityTypes: discovery?.entities ? Object.keys(discovery.entities) : []
    })
    
    if (!discovery || !organization?.name) {
      throw new Error('Discovery data and organization are required')
    }
    
    const result = await gatherIntelligence(discovery, organization)
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('❌ Gathering V3 Request error:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    })
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