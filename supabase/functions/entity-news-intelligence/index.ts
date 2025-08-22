// Entity News Intelligence - Tracks NEWS about SPECIFIC ENTITIES
// Focuses on "WHO did WHAT" not general topics

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

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

// Track specific entities in news
async function trackEntityActions(entities: any) {
  const entityNews = []
  
  // Process each entity category
  for (const [category, entityList] of Object.entries(entities)) {
    if (!Array.isArray(entityList)) continue
    
    for (const entity of entityList.slice(0, 10)) {
      const entityName = typeof entity === 'string' ? entity : entity.name
      if (!entityName) continue
      
      try {
        // Search for entity + action words
        const actionWords = ['announced', 'launched', 'filed', 'acquired', 'raised', 'partnered', 
                           'revealed', 'reported', 'stated', 'warned', 'sued', 'investigated']
        
        // Google News RSS for entity actions
        const searchQuery = `"${entityName}" (${actionWords.join(' OR ')})`
        const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(searchQuery)}&hl=en-US&gl=US&ceid=US:en`
        
        const response = await fetchWithTimeout(rssUrl, {}, 3000)
        
        if (response.ok) {
          const xmlText = await response.text()
          const items = xmlText.match(/<item>([\s\S]*?)<\/item>/gi) || []
          
          for (const item of items.slice(0, 3)) {
            const title = item.match(/<title>(.*?)<\/title>/)?.[1] || ''
            const link = item.match(/<link>(.*?)<\/link>/)?.[1] || ''
            const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''
            const source = item.match(/<source.*?>(.*?)<\/source>/)?.[1] || 'Unknown'
            
            if (title && link) {
              // Extract the action from the title
              let detectedAction = 'mentioned'
              for (const action of actionWords) {
                if (title.toLowerCase().includes(action)) {
                  detectedAction = action
                  break
                }
              }
              
              entityNews.push({
                entity: entityName,
                entity_type: category,
                action: detectedAction,
                headline: title.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&amp;/g, '&'),
                source: source.replace(/<!\[CDATA\[|\]\]>/g, ''),
                url: link,
                timestamp: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
                pr_relevance: calculatePRRelevance(category, detectedAction)
              })
            }
          }
        }
      } catch (error) {
        console.log(`Error tracking ${entityName}: ${error.message}`)
      }
    }
  }
  
  return entityNews
}

// Calculate PR relevance of entity actions
function calculatePRRelevance(entityType: string, action: string) {
  const relevanceMatrix = {
    competitors: {
      'announced': 'high',
      'launched': 'high',
      'acquired': 'high',
      'sued': 'critical',
      'warned': 'medium',
      'partnered': 'high',
      'filed': 'medium',
      'default': 'medium'
    },
    regulators: {
      'announced': 'critical',
      'filed': 'critical',
      'investigated': 'critical',
      'warned': 'high',
      'stated': 'high',
      'sued': 'critical',
      'default': 'high'
    },
    journalists: {
      'reported': 'high',
      'revealed': 'high',
      'stated': 'medium',
      'warned': 'high',
      'default': 'medium'
    },
    activists: {
      'launched': 'high',
      'warned': 'high',
      'sued': 'critical',
      'announced': 'high',
      'default': 'medium'
    },
    executives: {
      'announced': 'high',
      'stated': 'medium',
      'warned': 'high',
      'revealed': 'high',
      'default': 'medium'
    }
  }
  
  const typeRelevance = relevanceMatrix[entityType] || relevanceMatrix.competitors
  return typeRelevance[action] || typeRelevance.default || 'medium'
}

// Analyze entity actions for PR impact
function analyzeEntityActions(entityNews: any[], organization: any) {
  // Group by entity type
  const byType = {}
  const byRelevance = { critical: [], high: [], medium: [], low: [] }
  
  for (const news of entityNews) {
    // Group by type
    if (!byType[news.entity_type]) {
      byType[news.entity_type] = []
    }
    byType[news.entity_type].push(news)
    
    // Group by relevance
    byRelevance[news.pr_relevance]?.push(news)
  }
  
  // Extract key movements
  const keyMovements = []
  
  // Critical items first
  for (const item of byRelevance.critical || []) {
    keyMovements.push({
      entity: item.entity,
      type: item.entity_type,
      action: `${item.entity} ${item.action}`,
      headline: item.headline,
      pr_impact: 'Requires immediate attention',
      source: item.source,
      timestamp: item.timestamp
    })
  }
  
  // High relevance items
  for (const item of (byRelevance.high || []).slice(0, 5)) {
    keyMovements.push({
      entity: item.entity,
      type: item.entity_type,
      action: `${item.entity} ${item.action}`,
      headline: item.headline,
      pr_impact: 'Monitor closely',
      source: item.source,
      timestamp: item.timestamp
    })
  }
  
  return {
    total_actions: entityNews.length,
    by_entity_type: Object.keys(byType).map(type => ({
      type,
      count: byType[type].length,
      entities: [...new Set(byType[type].map(n => n.entity))]
    })),
    by_relevance: {
      critical: byRelevance.critical?.length || 0,
      high: byRelevance.high?.length || 0,
      medium: byRelevance.medium?.length || 0,
      low: byRelevance.low?.length || 0
    },
    key_movements: keyMovements,
    all_actions: entityNews
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { entities, organization } = await req.json()
    
    if (!entities) {
      throw new Error('Entities are required for tracking')
    }
    
    console.log(`🎯 Tracking entity actions for ${organization?.name || 'organization'}`)
    console.log(`📊 Entity categories:`, Object.keys(entities))
    
    // Track entity actions
    const entityNews = await trackEntityActions(entities)
    
    // Analyze for PR impact
    const analysis = analyzeEntityActions(entityNews, organization)
    
    return new Response(
      JSON.stringify({
        success: true,
        intelligence: analysis,
        message: `Tracked ${analysis.total_actions} entity actions`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Entity tracking error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        intelligence: {
          total_actions: 0,
          by_entity_type: [],
          by_relevance: {},
          key_movements: [],
          all_actions: []
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  }
})