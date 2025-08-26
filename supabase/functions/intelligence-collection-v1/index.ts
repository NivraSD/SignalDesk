// Intelligence Collection V1 - Fast data collection only (no analysis)
// Designed to complete within 30 seconds for Supabase Edge Function limits

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY') || 'fc-3048810124b640eb99293880a4ab25d0'

async function collectIntelligence(entities: any, organization: any) {
  console.log('🚀 Fast Intelligence Collection starting...')
  
  const startTime = Date.now()
  const timeout = 25000 // 25 seconds max (leaving buffer for response)
  
  const intelligence = {
    raw_signals: [],
    metadata: {
      organization: organization.name,
      collected_at: new Date().toISOString(),
      sources: []
    }
  }
  
  // Parallel collection from multiple sources
  const collectors = []
  
  // 1. RSS Collection (fast)
  collectors.push(collectRSS(organization, timeout))
  
  // 2. Firecrawl for top 3 competitors only (rate limited)
  if (entities.competitors?.length > 0) {
    const topCompetitors = entities.competitors.slice(0, 3)
    collectors.push(collectFirecrawl(topCompetitors, timeout))
  }
  
  // 3. Quick monitoring check
  collectors.push(collectMonitoring(organization, timeout))
  
  // Wait for all with timeout
  const results = await Promise.race([
    Promise.all(collectors),
    new Promise((resolve) => setTimeout(() => resolve([]), timeout))
  ])
  
  // Merge results
  if (Array.isArray(results)) {
    results.forEach(result => {
      if (result?.signals) {
        intelligence.raw_signals.push(...result.signals)
      }
      if (result?.source) {
        intelligence.metadata.sources.push(result.source)
      }
    })
  }
  
  const elapsed = Date.now() - startTime
  console.log(`✅ Collection completed in ${elapsed}ms with ${intelligence.raw_signals.length} signals`)
  
  return intelligence
}

async function collectRSS(organization: any, timeout: number) {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), Math.min(timeout, 5000))
    
    const response = await fetch(
      `https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/source-registry?industry=${organization.industry || 'technology'}&limit=20`,
      { 
        signal: controller.signal,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'
        } 
      }
    )
    
    clearTimeout(timeoutId)
    
    if (response.ok) {
      const data = await response.json()
      const signals = data.articles?.map(article => ({
        type: 'rss',
        title: article.title,
        content: article.content || article.description,
        source: article.source,
        url: article.link,
        published: article.published,
        raw: article
      })) || []
      
      return { signals, source: 'RSS feeds' }
    }
  } catch (error) {
    console.log('RSS collection error:', error.message)
  }
  
  return { signals: [], source: 'RSS feeds (failed)' }
}

async function collectFirecrawl(competitors: any[], timeout: number) {
  const signals = []
  const startTime = Date.now()
  
  for (const competitor of competitors) {
    if (Date.now() - startTime > timeout * 0.7) break // Use only 70% of timeout
    
    const competitorName = competitor.name || competitor
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: `"${competitorName}" latest news 2024 2025`,
          limit: 5
        })
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          data.data.forEach(result => {
            signals.push({
              type: 'firecrawl',
              entity: competitorName,
              entity_type: 'competitor',
              title: result.title,
              content: result.description,
              source: new URL(result.url).hostname,
              url: result.url,
              raw: result
            })
          })
        }
      }
      
      // Rate limit delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
    } catch (error) {
      console.log(`Firecrawl error for ${competitorName}:`, error.message)
    }
  }
  
  return { signals, source: `Firecrawl (${competitors.length} competitors)` }
}

async function collectMonitoring(organization: any, timeout: number) {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), Math.min(timeout, 5000))
    
    const response = await fetch(
      'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/monitoring-intelligence-v3',
      {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'
        },
        body: JSON.stringify({ 
          organization_id: organization.id || organization.name,
          time_window: '24h'
        })
      }
    )
    
    clearTimeout(timeoutId)
    
    if (response.ok) {
      const data = await response.json()
      const signals = data.findings?.map(finding => ({
        type: 'monitoring',
        title: finding.title,
        content: finding.description,
        source: finding.source,
        entity: finding.entity,
        impact: finding.impact_level,
        raw: finding
      })) || []
      
      return { signals, source: 'Monitoring system' }
    }
  } catch (error) {
    console.log('Monitoring collection error:', error.message)
  }
  
  return { signals: [], source: 'Monitoring (failed)' }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { entities, organization } = await req.json()
    
    if (!organization) {
      throw new Error('Organization required')
    }
    
    const intelligence = await collectIntelligence(entities, organization)
    
    return new Response(
      JSON.stringify({
        success: true,
        intelligence,
        statistics: {
          total_signals: intelligence.raw_signals.length,
          sources: intelligence.metadata.sources.length,
          timestamp: new Date().toISOString()
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Collection error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        intelligence: { raw_signals: [], metadata: {} }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})