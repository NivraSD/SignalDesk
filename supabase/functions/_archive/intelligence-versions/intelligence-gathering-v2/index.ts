// Intelligence Gathering V2 - Entity & Topic Focused
// Orchestrates entity tracking and trend monitoring MCPs

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

async function callEdgeFunction(functionName: string, payload: any) {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify(payload)
    })
    
    if (!response.ok) {
      console.error(`${functionName} failed with status ${response.status}`)
      return { success: false, error: `HTTP ${response.status}` }
    }
    
    return await response.json()
  } catch (error) {
    console.error(`${functionName} error:`, error)
    return { success: false, error: error.message }
  }
}

async function gatherIntelligence(monitoringTargets: any, organization: any) {
  console.log(`🔍 Gathering intelligence for ${organization.name}`)
  
  const results = {
    success: true,
    organization: organization.name,
    timestamp: new Date().toISOString(),
    raw_intelligence: {},
    statistics: {
      entities_tracked: 0,
      entity_actions: 0,
      topics_monitored: 0,
      trend_points: 0,
      critical_items: 0
    }
  }
  
  try {
    // Extract entities and topics from monitoring targets
    const entities = monitoringTargets.entities_to_monitor || {}
    const topics = monitoringTargets.topics_to_track || []
    
    // Count entities
    results.statistics.entities_tracked = Object.values(entities).reduce((acc: number, arr: any) => acc + (arr?.length || 0), 0)
    results.statistics.topics_monitored = topics.length
    
    // Parallel calls to all intelligence MCPs
    const [entityNews, trends] = await Promise.all([
      // Track entity actions
      callEdgeFunction('entity-news-intelligence', { entities, organization }),
      
      // Monitor trends
      callEdgeFunction('trends-intelligence', { 
        topics: topics.map((t: any) => typeof t === 'string' ? t : t.topic),
        organization 
      })
    ])
    
    // Process entity news
    if (entityNews.success) {
      results.raw_intelligence['entity-actions'] = entityNews.intelligence
      results.statistics.entity_actions = entityNews.intelligence?.total_actions || 0
      results.statistics.critical_items = entityNews.intelligence?.by_relevance?.critical || 0
      
      console.log(`📰 Tracked ${results.statistics.entity_actions} entity actions`)
    }
    
    // Process trends
    if (trends.success) {
      results.raw_intelligence['trends'] = trends.intelligence
      results.statistics.trend_points = trends.intelligence?.metadata?.data_points || 0
      
      console.log(`📈 Analyzed ${results.statistics.trend_points} trend data points`)
    }
    
    // Add summary
    results.raw_intelligence['summary'] = {
      key_movements: entityNews.intelligence?.key_movements || [],
      hot_topics: trends.intelligence?.summary?.hot_topics || [],
      opportunities: trends.intelligence?.implications?.opportunities || [],
      risks: trends.intelligence?.implications?.risks || [],
      requires_attention: results.statistics.critical_items > 0
    }
    
  } catch (error) {
    console.error('Gathering error:', error)
    results.success = false
    results.error = error.message
  }
  
  return results
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { monitoring_targets, organization } = await req.json()
    
    if (!monitoring_targets || !organization?.name) {
      throw new Error('Monitoring targets and organization are required')
    }
    
    console.log(`📊 Gathering intelligence for ${organization.name}`)
    console.log(`🎯 Tracking ${Object.keys(monitoring_targets.entities_to_monitor || {}).length} entity categories`)
    console.log(`📈 Monitoring ${(monitoring_targets.topics_to_track || []).length} topics`)
    
    const result = await gatherIntelligence(monitoring_targets, organization)
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Request error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  }
})