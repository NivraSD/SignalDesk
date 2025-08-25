// Intelligence Gathering V3 - REAL data from RSS feeds and searches
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

const FIRECRAWL_API_KEY = 'fc-3048810124b640eb99293880a4ab25d0'

async function gatherRealIntelligence(entities: any, organization: any) {
  console.log('🔍 Gathering REAL intelligence for:', organization.name)
  console.log('📊 Entities to monitor:', JSON.stringify(entities, null, 2))
  console.log('📊 Entity counts:', {
    competitors: entities.competitors?.length || 0,
    regulators: entities.regulators?.length || 0,
    activists: entities.activists?.length || 0,
    media: entities.media?.length || 0,
    investors: entities.investors?.length || 0,
    analysts: entities.analysts?.length || 0
  })
  
  const intelligence = {
    entity_actions: { all: [], by_entity: {} },
    topic_trends: { all: [] }
  }
  
  // 1. Fetch RSS feeds for technology industry
  try {
    console.log('📡 Fetching RSS feeds...')
    const rssResponse = await fetch(
      `https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/source-registry?industry=${organization.industry || 'technology'}&limit=50`,
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'
        }
      }
    )
    
    if (rssResponse.ok) {
      const rssData = await rssResponse.json()
      console.log(`✅ Got ${rssData.articles?.length || 0} RSS articles`)
      
      if (rssData.articles) {
        // Process RSS articles for entity mentions
        for (const article of rssData.articles) {
          // Check if any monitored entity is mentioned
          const allEntities = [
            ...(entities.competitors || []),
            ...(entities.regulators || []),
            ...(entities.activists || []),
            ...(entities.media || []),
            ...(entities.investors || []),
            ...(entities.analysts || [])
          ]
          
          // Check relevance to any monitored entity or industry topics
          let matchedEntity = null
          let relevanceScore = 0
          
          for (const entity of allEntities) {
            const entityName = entity.name || entity
            const entityLower = entityName.toLowerCase()
            const titleLower = article.title?.toLowerCase() || ''
            const descLower = article.description?.toLowerCase() || ''
            
            // Direct entity mention = high relevance
            if (titleLower.includes(entityLower) || descLower.includes(entityLower)) {
              matchedEntity = entityName
              relevanceScore = 0.9
              break
            }
          }
          
          // If no direct entity match, check for industry relevance
          if (!matchedEntity && organization.industry) {
            const industryKeywords = {
              technology: ['tech', 'software', 'cloud', 'ai', 'data', 'digital', 'cyber'],
              retail: ['retail', 'ecommerce', 'store', 'shopping', 'consumer', 'supply chain'],
              finance: ['finance', 'banking', 'investment', 'fintech', 'trading', 'market']
            }
            
            const keywords = industryKeywords[organization.industry] || []
            const text = (article.title + ' ' + article.description).toLowerCase()
            
            for (const keyword of keywords) {
              if (text.includes(keyword)) {
                matchedEntity = 'Industry'
                relevanceScore = 0.5
                break
              }
            }
          }
          
          // Add to intelligence if relevant
          if (matchedEntity && relevanceScore > 0.4) {
            intelligence.entity_actions.all.push({
              entity: matchedEntity,
              type: matchedEntity === 'Industry' ? 'general' : getEntityType(matchedEntity, entities),
              action: article.title,
              description: article.description,
              source: article.source,
              url: article.url,
              timestamp: article.published || new Date().toISOString(),
              impact: relevanceScore > 0.7 ? 'high' : 'medium',
              relevance: relevanceScore
            })
            
            // Group by entity
            if (matchedEntity) {
              if (!intelligence.entity_actions.by_entity[matchedEntity]) {
                intelligence.entity_actions.by_entity[matchedEntity] = []
              }
              intelligence.entity_actions.by_entity[matchedEntity].push({
                action: article.title,
                source: article.source,
                url: article.url,
                timestamp: article.published
              })
            }
          }
          
          // Extract trending topics
          const trendingKeywords = ['AI', 'regulation', 'privacy', 'security', 'sustainability', 'innovation', 'disruption']
          for (const keyword of trendingKeywords) {
            if (article.title?.toLowerCase().includes(keyword.toLowerCase())) {
              const existing = intelligence.topic_trends.all.find(t => t.topic === keyword)
              if (existing) {
                existing.mentions++
                if (!existing.sources.includes(article.source)) {
                  existing.sources.push(article.source)
                }
              } else {
                intelligence.topic_trends.all.push({
                  topic: keyword,
                  trend: 'increasing',
                  mentions: 1,
                  sources: [article.source]
                })
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('RSS fetch error:', error)
  }
  
  // 2. Call monitoring intelligence to get stored findings
  try {
    console.log('📡 Fetching stored intelligence from monitoring...')
    const monitorResponse = await fetch(
      'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/monitor-intelligence',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU3Nzk5MjgsImV4cCI6MjA1MTM1NTkyOH0.MJgH4j8wXJhZgfvMOpViiCyxT-BlLCIIqVMJsE_lXG0'
        },
        body: JSON.stringify({
          action: 'getFindings',
          organizationId: organization.id || organization.name
        })
      }
    )
    
    if (monitorResponse.ok) {
      const monitorData = await monitorResponse.json()
      console.log(`✅ Got ${monitorData.findings?.length || 0} monitoring findings`)
      
      // Add monitoring findings to intelligence
      if (monitorData.findings) {
        for (const finding of monitorData.findings) {
          intelligence.entity_actions.all.push({
            entity: finding.entity || 'Monitored Entity',
            type: finding.type || 'monitoring',
            action: finding.title || finding.action,
            description: finding.description || finding.message,
            source: finding.source || 'Intelligence Monitoring',
            url: finding.url || '#',
            timestamp: finding.created_at || new Date().toISOString(),
            impact: finding.severity || 'medium',
            relevance: 0.8
          })
        }
      }
    }
  } catch (error) {
    console.error('Monitoring fetch error:', error)
  }
  
  // 3. Add delay to prevent rushing through data collection
  console.log('⏱️ Allowing data to process (2 second delay)...')
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // 3. Search for specific competitor news using Firecrawl
  if (entities.competitors?.length > 0 && FIRECRAWL_API_KEY) {
    console.log(`🔥 Firecrawl search for ${entities.competitors.length} competitors`)
    for (const competitor of entities.competitors.slice(0, 5)) {  // Increased from 3 to 5
      // Handle both string and object formats
      const competitorName = competitor.name || competitor
      try {
        console.log(`🔍 Searching for "${competitorName}" news with Firecrawl...`)
        
        // Add delay between searches to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query: `"${competitorName}" latest news announcements developments 2024 2025`,
            limit: 10  // Increased from 5 to 10
          })
        })
        
        console.log(`📡 Firecrawl response status: ${searchResponse.status}`)
        
        if (searchResponse.ok) {
          const searchData = await searchResponse.json()
          console.log(`📊 Firecrawl data:`, searchData)
          
          if (searchData.success && searchData.data) {
            for (const result of searchData.data) {
              intelligence.entity_actions.all.push({
                entity: competitorName,
                type: 'competitor',
                action: result.title,
                description: result.description,
                source: new URL(result.url).hostname,
                url: result.url,
                timestamp: new Date().toISOString(),
                impact: 'medium',
                relevance: 0.7
              })
            }
            console.log(`✅ Found ${searchData.data.length} results for ${competitorName}`)
          } else {
            console.log(`⚠️ No Firecrawl results for ${competitorName}`)
          }
        } else {
          // Log Firecrawl error
          const errorText = await searchResponse.text()
          console.error(`❌ Firecrawl API error (${searchResponse.status}):`, errorText)
        }
      } catch (error) {
        console.log(`Search failed for ${competitorName}:`, error)
      }
    }
  } else {
    console.log('⚠️ Skipping Firecrawl search:', {
      hasCompetitors: entities.competitors?.length > 0,
      hasApiKey: !!FIRECRAWL_API_KEY,
      apiKeyPreview: FIRECRAWL_API_KEY ? FIRECRAWL_API_KEY.substring(0, 10) + '...' : 'none'
    })
  }
  
  // Log what we actually gathered
  console.log('📊 Real intelligence gathered:', {
    total_actions: intelligence.entity_actions.all.length,
    by_source: {
      rss: intelligence.entity_actions.all.filter(a => a.source && !a.url?.includes('#')).length,
      firecrawl: intelligence.entity_actions.all.filter(a => a.url && !a.url.includes('#') && a.source).length,
    }
  })
  
  // NO FALLBACK DATA - Return only real intelligence
  // If no data found, frontend should show "No intelligence available" or refresh
  if (intelligence.entity_actions.all.length === 0) {
    console.log('⚠️ No real intelligence found - returning empty (no fallbacks)')
  }
  
  if (intelligence.topic_trends.all.length === 0) {
    console.log('⚠️ No trending topics found - returning empty (no fallbacks)')
  }
  
  return intelligence
}

function getEntityType(entityName: string, entities: any): string {
  // Check if entityName matches any competitor (handle both string and object formats)
  if (entities.competitors?.some((c: any) => (c.name || c) === entityName)) return 'competitor'
  if (entities.regulators?.some((r: any) => (r.name || r) === entityName)) return 'regulator'
  if (entities.activists?.some((a: any) => (a.name || a) === entityName)) return 'activist'
  if (entities.media?.some((m: any) => (m.name || m) === entityName)) return 'media'
  if (entities.investors?.some((i: any) => (i.name || i) === entityName)) return 'investor'
  if (entities.analysts?.some((a: any) => (a.name || a) === entityName)) return 'analyst'
  return 'other'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { entities, organization } = await req.json()
    
    console.log('📡 Intelligence Gathering V3 Request:', {
      organization: organization?.name,
      competitors: entities?.competitors?.length || 0,
      regulators: entities?.regulators?.length || 0,
      media: entities?.media?.length || 0
    })
    
    // Gather REAL intelligence
    const intelligence = await gatherRealIntelligence(entities, organization)
    
    console.log('✅ Gathered intelligence:', {
      actions: intelligence.entity_actions.all.length,
      trends: intelligence.topic_trends.all.length
    })
    
    return new Response(
      JSON.stringify({
        success: true,
        ...intelligence,
        statistics: {
          actions_captured: intelligence.entity_actions.all.length,
          topics_monitored: intelligence.topic_trends.all.length,
          entities_tracked: Object.keys(intelligence.entity_actions.by_entity).length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Gathering error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        entity_actions: { all: [] },
        topic_trends: { all: [] }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
