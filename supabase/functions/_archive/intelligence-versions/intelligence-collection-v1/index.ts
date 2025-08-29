// Intelligence Collection V1 - Fast data collection only (no analysis)
// Designed to complete within 30 seconds for Supabase Edge Function limits

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY') || 'fc-3048810124b640eb99293880a4ab25d0'

async function collectIntelligence(entities: any, organization: any, savedProfile: any, authHeader: string = '') {
  console.log('🚀 Fast Intelligence Collection starting...')
  console.log('📊 Using saved profile:', {
    competitors: savedProfile?.competitors?.length || 0,
    media: savedProfile?.media?.length || 0,
    keywords: savedProfile?.keywords?.length || 0
  })
  
  const startTime = Date.now()
  const timeout = 40000 // 40 seconds max (leaving buffer for response)
  
  // Merge saved profile with provided entities
  const enhancedEntities = {
    competitors: savedProfile?.competitors || entities?.competitors || [],
    regulators: savedProfile?.regulators || entities?.regulators || [],
    media: savedProfile?.media || entities?.media || [],
    investors: savedProfile?.investors || entities?.investors || [],
    analysts: savedProfile?.analysts || entities?.analysts || [],
    activists: savedProfile?.activists || entities?.activists || []
  }
  
  const intelligence = {
    raw_signals: [],
    metadata: {
      organization: organization.name,
      collected_at: new Date().toISOString(),
      sources: []
    }
  }
  
  // Create enriched organization object with competitors for monitoring functions
  const enrichedOrg = {
    ...organization,
    competitors: enhancedEntities.competitors,
    keywords: savedProfile?.keywords || [organization.name],
    industry: savedProfile?.industry || organization.industry || 'technology'
  }
  
  // Parallel collection from multiple sources
  const collectors = []
  
  // 1. RSS Collection (fast)
  collectors.push(collectRSS(enrichedOrg, timeout, authHeader))
  
  // 2. Firecrawl for top competitors (rate limited)
  if (enhancedEntities.competitors?.length > 0) {
    const topCompetitors = enhancedEntities.competitors.slice(0, 5)
    collectors.push(collectFirecrawl(topCompetitors, timeout, authHeader))
  }
  
  // 3. Yahoo Finance Intelligence
  collectors.push(collectYahooFinance(enrichedOrg, timeout, authHeader))
  
  // 4. Google News Intelligence
  collectors.push(collectGoogleNews(enrichedOrg, timeout, authHeader))
  
  // 5. Reddit Intelligence
  collectors.push(collectReddit(enrichedOrg, timeout, authHeader))
  
  // 6. Twitter/X Intelligence
  collectors.push(collectTwitter(enrichedOrg, timeout, authHeader))
  
  // 7. General monitoring check
  collectors.push(collectMonitoring(enrichedOrg, timeout, authHeader))
  
  // Wait for all collectors to complete or timeout individually
  const results = await Promise.allSettled(
    collectors.map(collector => 
      Promise.race([
        collector,
        new Promise((resolve) => setTimeout(() => resolve({ signals: [], source: 'timeout' }), Math.min(timeout, 15000)))
      ])
    )
  )
  
  // Merge results from Promise.allSettled
  results.forEach(result => {
    if (result.status === 'fulfilled' && result.value) {
      const data = result.value
      if (data.signals && Array.isArray(data.signals)) {
        intelligence.raw_signals.push(...data.signals)
      }
      if (data.source) {
        intelligence.metadata.sources.push(data.source)
      }
    }
  })
  
  const elapsed = Date.now() - startTime
  console.log(`✅ Collection completed in ${elapsed}ms with ${intelligence.raw_signals.length} signals`)
  
  return intelligence
}

async function collectRSS(organization: any, timeout: number, authHeader: string = '') {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), Math.min(timeout, 5000))
    
    const response = await fetch(
      `https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/source-registry?industry=${organization.industry || 'technology'}&limit=50`,
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

async function collectFirecrawl(competitors: any[], timeout: number, authHeader: string = '') {
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

async function collectMonitoring(organization: any, timeout: number, authHeader: string = '') {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), Math.min(timeout, 5000))
    
    const response = await fetch(
      'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/monitor-intelligence',
      {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader || `Bearer ${Deno.env.get('SUPABASE_ANON_KEY') || ''}`
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

async function collectYahooFinance(organization: any, timeout: number, authHeader: string = '') {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), Math.min(timeout, 8000))
    
    const response = await fetch(
      'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/yahoo-finance-intelligence',
      {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader || `Bearer ${Deno.env.get('SUPABASE_ANON_KEY') || ''}`
        },
        body: JSON.stringify({ 
          method: 'gather',
          params: {
            organization: organization
          }
        })
      }
    )
    
    clearTimeout(timeoutId)
    
    if (response.ok) {
      const data = await response.json()
      // Yahoo Finance returns nested data.data.articles
      const articles = data.data?.articles || data.articles || []
      const signals = articles.map(article => ({
        type: 'finance',
        title: article.title,
        content: article.description || article.summary,
        source: 'Yahoo Finance',
        url: article.link,
        published: article.published,
        raw: article
      })) || []
      
      return { signals, source: 'Yahoo Finance' }
    }
  } catch (error) {
    console.log('Yahoo Finance collection error:', error.message)
  }
  
  return { signals: [], source: 'Yahoo Finance (failed)' }
}

async function collectGoogleNews(organization: any, timeout: number, authHeader: string = '') {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), Math.min(timeout, 8000))
    
    const response = await fetch(
      'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/google-intelligence',
      {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader || `Bearer ${Deno.env.get('SUPABASE_ANON_KEY') || ''}`
        },
        body: JSON.stringify({ 
          query: organization.name,
          limit: 20
        })
      }
    )
    
    clearTimeout(timeoutId)
    
    if (response.ok) {
      const data = await response.json()
      // Google returns nested data.data.results
      const results = data.data?.results || data.results || []
      const signals = results.map(result => ({
        type: 'news',
        title: result.title,
        content: result.snippet || result.description,
        source: result.source,
        url: result.link,
        published: result.date,
        raw: result
      })) || []
      
      return { signals, source: 'Google News' }
    }
  } catch (error) {
    console.log('Google News collection error:', error.message)
  }
  
  return { signals: [], source: 'Google News (failed)' }
}

async function collectReddit(organization: any, timeout: number, authHeader: string = '') {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), Math.min(timeout, 8000))
    
    const response = await fetch(
      'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/reddit-intelligence',
      {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader || `Bearer ${Deno.env.get('SUPABASE_ANON_KEY') || ''}`
        },
        body: JSON.stringify({ 
          method: 'gather',
          params: {
            organization: organization,
            subreddits: ['business', 'technology', 'stocks'],
            limit: 30
          }
        })
      }
    )
    
    clearTimeout(timeoutId)
    
    if (response.ok) {
      const data = await response.json()
      // Reddit returns nested data.data.discussions
      const posts = data.data?.discussions || data.discussions || data.posts || []
      const signals = posts.map(post => ({
        type: 'social',
        title: post.title,
        content: post.text || post.selftext || post.body || '',
        source: `Reddit r/${post.subreddit}`,
        url: post.url,
        engagement: post.score || 0,
        raw: post
      })) || []
      
      return { signals, source: 'Reddit' }
    }
  } catch (error) {
    console.log('Reddit collection error:', error.message)
  }
  
  return { signals: [], source: 'Reddit (failed)' }
}

async function collectTwitter(organization: any, timeout: number, authHeader: string = '') {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), Math.min(timeout, 8000))
    
    const response = await fetch(
      'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/twitter-intelligence',
      {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader || `Bearer ${Deno.env.get('SUPABASE_ANON_KEY') || ''}`
        },
        body: JSON.stringify({ 
          method: 'gather',
          params: {
            organization: organization,
            limit: 30
          }
        })
      }
    )
    
    clearTimeout(timeoutId)
    
    if (response.ok) {
      const data = await response.json()
      // Twitter returns nested data.data.tweets  
      const tweets = data.data?.tweets || data.tweets || []
      const signals = tweets.map(tweet => ({
        type: 'social',
        title: `@${tweet.author}: ${tweet.text.substring(0, 100)}`,
        content: tweet.text,
        source: 'Twitter/X',
        url: tweet.url,
        engagement: tweet.metrics?.retweet_count + tweet.metrics?.like_count,
        raw: tweet
      })) || []
      
      return { signals, source: 'Twitter/X' }
    }
  } catch (error) {
    console.log('Twitter collection error:', error.message)
  }
  
  return { signals: [], source: 'Twitter/X (failed)' }
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
    
    // First, RETRIEVE the saved organization profile from database
    let savedProfile = null
    try {
      const getTargetsResponse = await fetch(
        'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-persistence',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.get('Authorization') || ''
          },
          body: JSON.stringify({
            action: 'getTargets',
            organization_name: organization.name
          })
        }
      )
      if (getTargetsResponse.ok) {
        const result = await getTargetsResponse.json()
        savedProfile = result.targets
        console.log('✅ Retrieved saved profile from database')
      }
    } catch (e) {
      console.log('Could not retrieve saved profile:', e)
    }
    
    const authHeader = req.headers.get('Authorization') || ''
    const intelligence = await collectIntelligence(entities, organization, savedProfile, authHeader)
    
    // Save collected intelligence to database
    if (intelligence.raw_signals.length > 0) {
      for (const signal of intelligence.raw_signals) {
        try {
          const persistResponse = await fetch(
            'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-persistence',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': req.headers.get('Authorization') || ''
              },
              body: JSON.stringify({
                action: 'save',
                organization_id: organization.id || organization.name,
                organization_name: organization.name,
                stage: 'collection',
                data_type: signal.type,
                content: signal,
                metadata: {
                  source: signal.source,
                  entity: signal.entity,
                  confidence: signal.confidence || 0.75
                }
              })
            }
          )
          if (!persistResponse.ok) {
            console.log('Failed to persist signal')
          }
        } catch (e) {
          console.log('Persist error:', e)
        }
      }
      console.log(`💾 Saved ${intelligence.raw_signals.length} signals to database`)
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        intelligence,
        statistics: {
          total_signals: intelligence.raw_signals.length,
          sources: intelligence.metadata.sources.length,
          timestamp: new Date().toISOString(),
          persisted: true
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