// Intelligence Gathering V3 - Streamlined Entity Action Tracking
// Gathers actual intelligence about entity movements and trends

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

console.log('🔑 Gathering V3 - Starting Edge Function')

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

// Track specific entity actions in news
async function gatherEntityActions(entities: any) {
  console.log('🔍 Gathering entity actions for:', Object.keys(entities))
  const actions = []
  const actionKeywords = [
    'announced', 'launched', 'acquired', 'raised', 'partnered',
    'filed', 'released', 'appointed', 'expanded', 'cut',
    'sued', 'investigated', 'fined', 'approved', 'rejected'
  ]
  
  // Gather actions for each entity type
  for (const [entityType, entityList] of Object.entries(entities)) {
    if (!Array.isArray(entityList)) continue
    
    console.log(`🎯 Processing ${entityType}:`, entityList.length, 'entities')
    
    for (const entity of entityList.slice(0, 3)) { // Limit to top 3 per category for speed
      try {
        const entityName = entity.name
        console.log(`  🔍 Searching for actions by: ${entityName}`)
        const searchQuery = `"${entityName}" (${actionKeywords.join(' OR ')}) when:7d`
        const url = `https://news.google.com/rss/search?q=${encodeURIComponent(searchQuery)}&hl=en-US&gl=US&ceid=US:en`
        
        const response = await fetchWithTimeout(url, {}, 3000)
        if (response.ok) {
          const xmlText = await response.text()
          const items = xmlText.match(/<item>[\s\S]*?<\/item>/gi) || []
          
          for (const item of items.slice(0, 5)) { // Top 5 actions per entity
            const title = item.match(/<title>(.*?)<\/title>/)?.[1] || ''
            const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''
            const source = item.match(/<source.*?>(.*?)<\/source>/)?.[1] || 'Unknown'
            
            if (title) {
              // Determine action type
              const actionType = actionKeywords.find(keyword => 
                title.toLowerCase().includes(keyword.toLowerCase())
              ) || 'mentioned'
              
              actions.push({
                entity: entityName,
                entity_type: entityType,
                action: actionType,
                headline: title.replace(/<!\\[CDATA\\[|\\]\\]>/g, '').replace(/&amp;/g, '&'),
                source: source.replace(/<!\\[CDATA\\[|\\]\\]>/g, ''),
                timestamp: pubDate,
                importance: entity.importance || 'medium'
              })
            }
          }
        }
      } catch (error) {
        console.log(`Error fetching actions for ${entity.name}: ${error.message}`)
      }
    }
  }
  
  return actions
}

// Monitor trending topics
async function gatherTopicTrends(topics: any[]) {
  const trends = []
  
  for (const topic of topics.slice(0, 5)) { // Top 5 topics
    try {
      const searchQuery = `"${topic.name}" when:7d`
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(searchQuery)}&hl=en-US&gl=US&ceid=US:en`
      
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
  
  try {
    // Parallel gathering
    const [entityActions, topicTrends] = await Promise.all([
      gatherEntityActions(discovery.entities || {}),
      gatherTopicTrends(discovery.topics || [])
    ])
    
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