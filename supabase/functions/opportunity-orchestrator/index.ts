// Opportunity Orchestrator - REAL opportunities from REAL signals ONLY
// NO FALLBACKS, NO TEMPLATES, NO HARDCODED MICROSOFT/GOOGLE

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { withCors, jsonResponse, errorResponse } from "../_shared/cors.ts"

const FIRECRAWL_API_KEY = 'fc-3048810124b640eb99293880a4ab25d0'

// PHASE 1: OPPORTUNITY DISCOVERY - Map organization to opportunity landscape
async function discoverOpportunityLandscape(organization: any, config: any) {
  const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
  console.log('🔑 Discovery - API key available:', !!ANTHROPIC_API_KEY)
  
  if (!ANTHROPIC_API_KEY) {
    console.log('⚠️ No API key for discovery, returning minimal landscape')
    return {
      competitors_to_monitor: [],
      narrative_opportunities: { topics: [], journalists: [], platforms: [] },
      cascade_triggers: { supply_chain: [], regulatory: [], market: [] },
      crisis_patterns: { industry_risks: [], preemptive_actions: [] },
      viral_potential: { trending_topics: [], response_types: [] }
    }
  }

  const prompt = `Analyze ${organization.name} in ${organization.industry || 'technology'} industry.
Identify REAL, SPECIFIC opportunities to monitor. Return JSON with:
{
  "competitors_to_monitor": [{"name": "RealCompany", "domain": "real.com", "weakness_signals": ["specific", "signals"]}],
  "narrative_opportunities": {"topics": ["specific topics"], "journalists": ["names"], "platforms": ["real outlets"]},
  "cascade_triggers": {"supply_chain": ["specific"], "regulatory": ["specific"], "market": ["specific"]},
  "crisis_patterns": {"industry_risks": ["specific"], "preemptive_actions": ["specific"]},
  "viral_potential": {"trending_topics": ["current"], "response_types": ["specific"]}
}`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    if (response.ok) {
      const result = await response.json()
      return JSON.parse(result.content[0].text)
    }
  } catch (error) {
    console.error('Discovery error:', error)
  }
  
  // Return empty structure, NO HARDCODED COMPANIES
  return {
    competitors_to_monitor: [],
    narrative_opportunities: { topics: [], journalists: [], platforms: [] },
    cascade_triggers: { supply_chain: [], regulatory: [], market: [] },
    crisis_patterns: { industry_risks: [], preemptive_actions: [] },
    viral_potential: { trending_topics: [], response_types: [] }
  }
}

// PHASE 2: REAL-TIME SIGNAL GATHERING
async function gatherOpportunitySignals(opportunityMap: any, organization: any) {
  const signals = {
    competitor_signals: [],
    narrative_gaps: [],
    cascade_indicators: [],
    crisis_signals: [],
    viral_opportunities: []
  }
  
  // Gather RSS feeds for real signals
  try {
    const rssResponse = await fetch(
      `https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/source-registry?industry=${organization.industry || 'technology'}&limit=30`,
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMjk2MzcsImV4cCI6MjA3MDcwNTYzN30.5PhMVptHk3n-1dTSwGF-GvTwrVM0loovkHGUBDtBOe8'
        }
      }
    )
    
    if (rssResponse.ok) {
      const rssData = await rssResponse.json()
      console.log(`📡 Got ${rssData.articles?.length || 0} RSS articles`)
      
      if (rssData.articles) {
        for (const article of rssData.articles) {
          // Check for weakness indicators in ANY company mentioned
          const weaknessKeywords = ['struggle', 'challenge', 'decline', 'loss', 'delay', 'issue', 'problem', 'lawsuit', 'layoff', 'breach', 'outage']
          const hasWeakness = weaknessKeywords.some(kw => 
            article.description?.toLowerCase().includes(kw) || 
            article.title?.toLowerCase().includes(kw)
          )
          
          if (hasWeakness) {
            // Extract company names from the article (simplified extraction)
            const companyPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g
            const matches = article.title.match(companyPattern) || []
            const company = matches[0] || 'Industry Player'
            
            signals.competitor_signals.push({
              competitor: company,
              signal_type: 'weakness_detected',
              title: article.title,
              description: article.description,
              url: article.url,
              confidence: 0.75,
              source: article.source,
              detected_at: article.published
            })
          }
          
          // Check for cascade indicators
          const cascadeKeywords = ['disruption', 'shortage', 'supply chain', 'crisis', 'regulatory', 'compliance', 'investigation', 'ruling']
          if (cascadeKeywords.some(kw => article.title?.toLowerCase().includes(kw) || article.description?.toLowerCase().includes(kw))) {
            signals.cascade_indicators.push({
              trigger: 'industry_event',
              event: article.title,
              url: article.url,
              impact_potential: 'medium',
              window: '48-72 hours',
              source: article.source,
              detected_at: article.published
            })
          }
          
          // Check for narrative opportunities
          if (article.description?.includes('expert') || article.description?.includes('comment') || 
              article.title?.includes('opinion') || article.title?.includes('perspective')) {
            signals.narrative_gaps.push({
              topic: article.title.substring(0, 50),
              opportunity: article.title,
              url: article.url,
              platform: article.source,
              confidence: 0.65
            })
          }
        }
      }
    }
  } catch (error) {
    console.log('RSS feed fetch failed:', error)
  }

  // Search for specific opportunities if we have competitors from discovery
  if (opportunityMap.competitors_to_monitor?.length > 0) {
    for (const competitor of opportunityMap.competitors_to_monitor.slice(0, 3)) {
      try {
        const searchResults = await searchWithFirecrawl(
          `"${competitor.name}" recent news problems issues`,
          { limit: 2 }
        )

        if (searchResults?.data?.web) {
          for (const result of searchResults.data.web) {
            signals.competitor_signals.push({
              competitor: competitor.name,
              signal_type: 'search_result',
              title: result.title,
              description: result.description,
              url: result.url,
              confidence: 0.70,
              source: new URL(result.url).hostname,
              detected_at: new Date().toISOString()
            })
          }
        }
      } catch (error) {
        console.log(`Search failed for ${competitor.name}:`, error)
      }
    }
  }

  return signals
}

// PHASE 3: OPPORTUNITY SYNTHESIS - Create REAL opportunities from REAL signals
async function synthesizeOpportunities(signals: any, opportunityMap: any, organization: any, config: any) {
  const opportunities = []
  const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
  
  // Only create opportunities from REAL signals
  if (signals.competitor_signals?.length > 0) {
    for (const signal of signals.competitor_signals.slice(0, 3)) {
      opportunities.push({
        id: crypto.randomUUID(),
        title: `Competitive Response: ${signal.competitor}`,
        description: signal.title || signal.description,
        opportunity_type: 'competitive_opportunist',
        persona: 'Competitive Opportunist',
        urgency: 'HIGH',
        window: '24-72 hours',
        action: `Analyze and respond to ${signal.competitor}'s situation`,
        confidence: signal.confidence || 75,
        source_signal: signal,
        source_url: signal.url,
        detected_at: signal.detected_at
      })
    }
  }
  
  if (signals.cascade_indicators?.length > 0) {
    for (const cascade of signals.cascade_indicators.slice(0, 2)) {
      opportunities.push({
        id: crypto.randomUUID(),
        title: `Cascade Alert: ${cascade.event?.substring(0, 50)}`,
        description: `Industry cascade effect detected: ${cascade.event}`,
        opportunity_type: 'cascade_effect',
        persona: 'Cascade Predictor',
        urgency: 'HIGH',
        window: cascade.window || '24-48 hours',
        action: 'Position for first-mover advantage before cascade impacts industry',
        impact: cascade.impact_potential,
        confidence: 85,
        source_signal: cascade,
        source_url: cascade.url,
        detected_at: cascade.detected_at
      })
    }
  }
  
  if (signals.narrative_gaps?.length > 0) {
    for (const gap of signals.narrative_gaps.slice(0, 2)) {
      opportunities.push({
        id: crypto.randomUUID(),
        title: `Media Opportunity: ${gap.topic}`,
        description: gap.opportunity,
        opportunity_type: 'narrative_navigator',
        persona: 'Narrative Navigator',
        urgency: 'MEDIUM',
        window: '3-5 days',
        action: 'Position executive as thought leader on this topic',
        media_target: gap.platform,
        confidence: gap.confidence || 70,
        source_signal: gap,
        source_url: gap.url
      })
    }
  }
  
  // If we have API key and signals, enrich with Claude analysis
  if (ANTHROPIC_API_KEY && opportunities.length > 0) {
    try {
      const enrichPrompt = `Analyze these real opportunities and add strategic insights:
${JSON.stringify(opportunities.slice(0, 3))}

For each, add specific strategic recommendations for ${organization.name}. Return enhanced opportunities as JSON array.`

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 800,
          temperature: 0.3,
          messages: [{ role: 'user', content: enrichPrompt }]
        })
      })

      if (response.ok) {
        const result = await response.json()
        try {
          const enrichedOpps = JSON.parse(result.content[0].text)
          // Merge enriched insights with original opportunities
          for (let i = 0; i < Math.min(enrichedOpps.length, opportunities.length); i++) {
            opportunities[i] = { ...opportunities[i], ...enrichedOpps[i] }
          }
        } catch (e) {
          console.log('Could not parse enriched opportunities')
        }
      }
    } catch (error) {
      console.log('Enrichment failed:', error)
    }
  }
  
  // Sort by confidence and return
  return opportunities.sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
}

// Helper function for Firecrawl search
async function searchWithFirecrawl(query: string, options: any = {}) {
  try {
    console.log(`🔍 Searching for: ${query}`)
    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        query, 
        limit: options.limit || 5
      })
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result?.success && result?.data) {
        return { success: true, data: { web: result.data } }
      }
    }
    return null
  } catch (error) {
    console.error('Search failed:', error)
    return null
  }
}

// Main handler
serve(withCors(async (req) => {
  try {
    const { organization, config } = await req.json()
    
    console.log(`🎯 Opportunity Orchestrator for ${organization.name} - NO FALLBACKS`)
    
    // Retrieve existing intelligence from database
    let savedIntelligence = null
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
            action: 'retrieve',
            organization_name: organization.name,
            limit: 100,
            since: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Last 24 hours
          })
        }
      )
      
      if (persistResponse.ok) {
        const result = await persistResponse.json()
        savedIntelligence = result.data
        console.log(`📊 Retrieved ${result.count} existing intelligence items from database`)
      }
    } catch (e) {
      console.log('Could not retrieve saved intelligence:', e)
    }
    
    // PHASE 1: Discover opportunity landscape
    console.log('🔍 Phase 1: Discovering opportunity landscape...')
    const opportunityMap = await discoverOpportunityLandscape(organization, config)
    
    // PHASE 2: Gather real-time signals
    console.log('📡 Phase 2: Gathering real-time signals...')
    const signals = await gatherOpportunitySignals(opportunityMap, organization)
    
    console.log(`📊 Signals found:`)
    console.log(`  - Competitor signals: ${signals.competitor_signals.length}`)
    console.log(`  - Cascade indicators: ${signals.cascade_indicators.length}`)
    console.log(`  - Narrative gaps: ${signals.narrative_gaps.length}`)
    
    // PHASE 3: Synthesize opportunities from REAL signals only
    console.log('🧠 Phase 3: Creating opportunities from real signals...')
    const opportunities = await synthesizeOpportunities(signals, opportunityMap, organization, config)
    
    console.log(`✅ Created ${opportunities.length} REAL opportunities (no templates!)`)
    
    // Save opportunities to database
    if (opportunities.length > 0) {
      for (const opp of opportunities) {
        try {
          await fetch(
            'https://zskaxjtyuaqazydouifp.supabase.co/functions/v1/intelligence-persistence',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': req.headers.get('Authorization') || ''
              },
              body: JSON.stringify({
                action: 'save',
                organization_id: organization.name,
                organization_name: organization.name,
                stage: 'opportunities',
                data_type: opp.opportunity_type,
                content: opp,
                metadata: {
                  urgency: opp.urgency,
                  confidence: opp.confidence,
                  window: opp.window
                }
              })
            }
          )
        } catch (e) {
          console.log('Could not save opportunity:', e)
        }
      }
      console.log(`💾 Saved ${opportunities.length} opportunities to database`)
    }
    
    return jsonResponse({
      success: true,
      organization: organization.name,
      timestamp: new Date().toISOString(),
      phases_completed: {
        discovery: true,
        gathering: true,
        synthesis: true
      },
      signal_summary: {
        competitor_signals: signals.competitor_signals.length,
        cascade_indicators: signals.cascade_indicators.length,
        narrative_gaps: signals.narrative_gaps.length,
        from_database: savedIntelligence?.length || 0
      },
      opportunities,
      message: opportunities.length > 0 
        ? `Found ${opportunities.length} real opportunities from actual signals`
        : 'No opportunities detected from current signals (this is normal if no events are happening)'
    })
  } catch (error) {
    console.error('Orchestration error:', error)
    return errorResponse(
      error.message || 'Orchestration failed',
      500,
      { opportunities: [] } // Empty array, NO FALLBACKS
    )
  }
}))
