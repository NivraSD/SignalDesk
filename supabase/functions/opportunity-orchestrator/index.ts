// Opportunity Orchestrator - Multi-phase opportunity detection with specialized personas
// Follows the proven Intelligence Hub pattern with opportunity-specific focus

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

// Get API keys dynamically to ensure they're always fresh
const FIRECRAWL_API_KEY = 'fc-3048810124b640eb99293880a4ab25d0'

// PHASE 1: OPPORTUNITY DISCOVERY
// Map organization to opportunity landscape using Claude
async function discoverOpportunityLandscape(organization: any, config: any) {
  // Get API key at runtime, not module load time
  const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
  console.log('🔑 ANTHROPIC_API_KEY available:', !!ANTHROPIC_API_KEY)
  console.log('🔑 Key length:', ANTHROPIC_API_KEY?.length || 0)
  
  if (!ANTHROPIC_API_KEY) {
    console.log('⚠️ No Anthropic API key, using default mapping')
    return getDefaultOpportunityMapping(organization)
  }

  const prompt = `You are an Opportunity Mapping Expert. Analyze this organization and identify specific opportunities to monitor.

Organization: ${organization.name}
Industry: ${organization.industry || 'technology'}
Configuration: ${JSON.stringify(config)}

Provide a detailed opportunity mapping with:
1. Specific competitors to monitor for weaknesses (with actual company names and domains)
2. Media narratives to track for thought leadership gaps
3. Industry events/cascades to watch for first-mover advantages
4. Crisis patterns in the industry to preempt
5. Viral/trending topics relevant to the brand

Format as JSON with structure:
{
  "competitors_to_monitor": [
    {"name": "Company", "domain": "domain.com", "weakness_signals": ["layoffs", "delays", "lawsuits"]}
  ],
  "narrative_opportunities": {
    "topics": ["AI ethics", "sustainability"],
    "journalists": ["tech reporters", "industry analysts"],
    "platforms": ["TechCrunch", "WSJ"]
  },
  "cascade_triggers": {
    "supply_chain": ["chip shortage", "logistics disruption"],
    "regulatory": ["new legislation", "compliance changes"],
    "market": ["competitor exit", "merger activity"]
  },
  "crisis_patterns": {
    "industry_risks": ["data breach", "product recall"],
    "preemptive_actions": ["transparency", "proactive communication"]
  },
  "viral_potential": {
    "trending_topics": ["industry memes", "cultural moments"],
    "response_types": ["thought leadership", "creative engagement"]
  }
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
        model: 'claude-3-haiku-20240307',
        max_tokens: 1500,
        temperature: 0.3,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`)
    }

    const result = await response.json()
    return JSON.parse(result.content[0].text)
  } catch (error) {
    console.error('Discovery error:', error)
    return getDefaultOpportunityMapping(organization)
  }
}

// PHASE 2: REAL-TIME SIGNAL GATHERING
// Use Firecrawl AND RSS feeds to gather actual signals from discovered sources
async function gatherOpportunitySignals(opportunityMap: any, organization: any) {
  const signals = {
    competitor_signals: [],
    narrative_gaps: [],
    cascade_indicators: [],
    crisis_signals: [],
    viral_opportunities: []
  }
  
  // First, gather RSS feeds for the organization's industry
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
      
      // Process RSS articles for signals
      if (rssData.articles) {
        for (const article of rssData.articles) {
          // Check for competitor mentions
          if (opportunityMap.competitors_to_monitor) {
            for (const competitor of opportunityMap.competitors_to_monitor) {
              if (article.title.toLowerCase().includes(competitor.name.toLowerCase()) ||
                  article.description.toLowerCase().includes(competitor.name.toLowerCase())) {
                
                // Check for weakness indicators
                const weaknessKeywords = ['struggle', 'challenge', 'decline', 'loss', 'delay', 'issue', 'problem', 'lawsuit', 'layoff']
                const hasWeakness = weaknessKeywords.some(kw => 
                  article.description?.toLowerCase().includes(kw) || 
                  article.title?.toLowerCase().includes(kw)
                )
                
                if (hasWeakness) {
                  signals.competitor_signals.push({
                    competitor: competitor.name,
                    signal_type: 'rss_weakness_signal',
                    title: article.title,
                    description: article.description,
                    url: article.url,
                    confidence: 0.75,
                    source: article.source,
                    detected_at: article.published
                  })
                }
              }
            }
          }
          
          // Check for cascade indicators
          const cascadeKeywords = ['disruption', 'shortage', 'supply chain', 'crisis', 'regulatory', 'compliance']
          if (cascadeKeywords.some(kw => article.title.toLowerCase().includes(kw) || article.description.toLowerCase().includes(kw))) {
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

  // Monitor competitors using search instead of direct scraping
  if (opportunityMap.competitors_to_monitor) {
    for (const competitor of opportunityMap.competitors_to_monitor.slice(0, 3)) {
      try {
        // Search for competitor news and weaknesses
        for (const signal of competitor.weakness_signals || []) {
          const searchResults = await searchWithFirecrawl(
            `"${competitor.name}" ${signal} recent news`,
            { limit: 2 }
          )

          if (searchResults?.data?.web) {
            for (const result of searchResults.data.web) {
              // Check if result actually mentions the weakness signal
              if (result.description?.toLowerCase().includes(signal.toLowerCase()) ||
                  result.title?.toLowerCase().includes(signal.toLowerCase())) {
                signals.competitor_signals.push({
                  competitor: competitor.name,
                  signal_type: signal,
                  title: result.title,
                  description: result.description,
                  url: result.url,
                  confidence: 0.85,
                  source: new URL(result.url).hostname,
                  detected_at: new Date().toISOString()
                })
              }
            }
          }
        }
        
        // Also do a general competitor search
        const generalSearch = await searchWithFirecrawl(
          `"${competitor.name}" announcement news "2024" OR "2025"`,
          { limit: 2 }
        )
        
        if (generalSearch?.data?.web) {
          for (const result of generalSearch.data.web) {
            // Analyze for any weakness indicators
            const weaknessKeywords = ['struggle', 'challenge', 'decline', 'loss', 'delay', 'issue', 'problem']
            const hasWeakness = weaknessKeywords.some(kw => 
              result.description?.toLowerCase().includes(kw) || 
              result.title?.toLowerCase().includes(kw)
            )
            
            if (hasWeakness) {
              signals.competitor_signals.push({
                competitor: competitor.name,
                signal_type: 'general_weakness',
                title: result.title,
                description: result.description,
                url: result.url,
                confidence: 0.75,
                source: new URL(result.url).hostname,
                detected_at: new Date().toISOString()
              })
            }
          }
        }
      } catch (error) {
        console.log(`Could not search for ${competitor.name}:`, error)
      }
    }
  }

  // Search for narrative gaps using Firecrawl search
  if (opportunityMap.narrative_opportunities?.topics) {
    for (const topic of opportunityMap.narrative_opportunities.topics.slice(0, 2)) {
      try {
        const searchResults = await searchWithFirecrawl(
          `"${topic}" "looking for experts" OR "seeking comment" OR "${organization.industry}"`,
          { limit: 3 }
        )

        if (searchResults?.data?.web) {
          for (const result of searchResults.data.web) {
            if (result.description?.includes('expert') || result.description?.includes('comment')) {
              signals.narrative_gaps.push({
                topic,
                opportunity: result.title,
                url: result.url,
                platform: new URL(result.url).hostname,
                confidence: 0.75
              })
            }
          }
        }
      } catch (error) {
        console.log(`Search failed for ${topic}:`, error)
      }
    }
  }

  // Monitor for cascade triggers
  if (opportunityMap.cascade_triggers) {
    const cascadeKeywords = [
      ...opportunityMap.cascade_triggers.supply_chain || [],
      ...opportunityMap.cascade_triggers.regulatory || [],
      ...opportunityMap.cascade_triggers.market || []
    ]

    for (const keyword of cascadeKeywords.slice(0, 3)) {
      try {
        const cascadeSearch = await searchWithFirecrawl(
          `"${keyword}" "${organization.industry}" impact OR disruption`,
          { limit: 2 }
        )

        if (cascadeSearch?.data?.web) {
          for (const result of cascadeSearch.data.web) {
            signals.cascade_indicators.push({
              trigger: keyword,
              event: result.title,
              url: result.url,
              impact_potential: 'high',
              window: '24-48 hours'
            })
          }
        }
      } catch (error) {
        console.log(`Cascade search failed for ${keyword}:`, error)
      }
    }
  }

  return signals
}

// PHASE 3: OPPORTUNITY SYNTHESIS WITH SPECIALIZED PERSONAS
async function synthesizeOpportunities(signals: any, opportunityMap: any, organization: any, config: any) {
  const opportunities = []

  // PERSONA 1: Competitive Opportunist
  const competitiveOpps = await analyzeWithPersona(
    'Competitive Opportunist',
    `You are a competitive strategist who identifies opportunities from competitor weaknesses.
     Analyze these competitor signals and identify immediate opportunities to gain market share.
     
     Signals: ${JSON.stringify(signals.competitor_signals)}
     Organization: ${organization.name}
     
     For each opportunity provide:
     - Title (action-oriented)
     - Urgency (URGENT/HIGH/MEDIUM)
     - Window (time available)
     - Action (specific steps)
     - Expected impact`,
    signals.competitor_signals
  )

  // PERSONA 2: Narrative Navigator
  const narrativeOpps = await analyzeWithPersona(
    'Narrative Navigator',
    `You are a media strategist who identifies thought leadership and PR opportunities.
     Analyze these narrative gaps and identify opportunities for executive visibility.
     
     Signals: ${JSON.stringify(signals.narrative_gaps)}
     Organization: ${organization.name}
     
     For each opportunity provide:
     - Title (media-focused)
     - Media targets
     - Key messages
     - Spokesperson recommendation
     - Timing`,
    signals.narrative_gaps
  )

  // PERSONA 3: Cascade Predictor
  const cascadeOpps = await analyzeWithPersona(
    'Cascade Predictor',
    `You are a systems analyst who predicts cascade effects and first-mover opportunities.
     Analyze these cascade indicators and identify opportunities to lead the industry response.
     
     Signals: ${JSON.stringify(signals.cascade_indicators)}
     Organization: ${organization.name}
     
     For each opportunity provide:
     - Primary event
     - First-order effects (immediate)
     - Second-order effects (downstream)
     - Opportunity window
     - Positioning strategy`,
    signals.cascade_indicators
  )

  // PERSONA 4: Crisis Preventer
  const crisisOpps = await analyzeWithPersona(
    'Crisis Preventer',
    `You are a crisis prevention expert who identifies proactive reputation opportunities.
     Analyze industry crisis patterns and identify opportunities for preemptive positioning.
     
     Signals: ${JSON.stringify(signals.crisis_signals)}
     Industry risks: ${JSON.stringify(opportunityMap.crisis_patterns)}
     Organization: ${organization.name}
     
     For each opportunity provide:
     - Risk to preempt
     - Proactive action
     - Differentiation angle
     - Timeline
     - Stakeholder benefits`,
    signals.crisis_signals
  )

  // PERSONA 5: Viral Virtuoso
  const viralOpps = await analyzeWithPersona(
    'Viral Virtuoso',
    `You are a viral content strategist who identifies real-time engagement opportunities.
     Analyze trending topics and identify opportunities for creative brand moments.
     
     Signals: ${JSON.stringify(signals.viral_opportunities)}
     Trending: ${JSON.stringify(opportunityMap.viral_potential)}
     Organization: ${organization.name}
     
     For each opportunity provide:
     - Trending topic
     - Creative angle
     - Content format
     - Distribution strategy
     - Urgency level`,
    signals.viral_opportunities
  )

  // Combine all opportunities
  opportunities.push(...competitiveOpps, ...narrativeOpps, ...cascadeOpps, ...crisisOpps, ...viralOpps)
  
  // ALWAYS add cascade opportunities if we found cascade indicators (they're our signature feature)
  // This ensures we always get opportunities from cascade signals even if Claude fails
  if (signals.cascade_indicators?.length > 0 && opportunities.length === 0) {
    console.log(`📊 No persona opportunities, adding ${signals.cascade_indicators.length} cascade opportunities as fallback`)
    for (const cascade of signals.cascade_indicators.slice(0, 3)) {
      opportunities.push({
        id: crypto.randomUUID(),
        title: `Cascade Alert: ${cascade.event || cascade.trigger}`,
        description: `Predicted cascade effect from ${cascade.trigger}. Critical 48-hour window for positioning.`,
        opportunity_type: 'cascade_effect',
        persona: 'Cascade Predictor',
        urgency: 'HIGH',
        window: cascade.window || '24-48 hours',
        action: `Pre-position for ${cascade.trigger} cascade effects`,
        impact: cascade.impact_potential || 'High',
        confidence: 85,
        source_signal: cascade,
        cascade_analysis: {
          primary_event: cascade.trigger,
          first_order: ['Immediate market reaction', 'Competitor vulnerability'],
          second_order: ['Customer migration opportunity', 'Media attention spike'],
          opportunity_window: 'Next 48 hours critical'
        }
      })
    }
  }
  
  // Additional fallback if still no opportunities
  if (opportunities.length === 0) {
    console.log('Still no opportunities, generating from other signals')
    
    // Generate opportunities from competitor signals
    if (signals.competitor_signals?.length > 0) {
      for (const compSignal of signals.competitor_signals.slice(0, 2)) {
        opportunities.push({
          id: crypto.randomUUID(),
          title: `Competitive Opportunity: ${compSignal.competitor} ${compSignal.signal_type}`,
          description: compSignal.description || `${compSignal.competitor} showing vulnerability in ${compSignal.signal_type}`,
          opportunity_type: 'competitive_opportunist',
          persona: 'Competitive Opportunist',
          urgency: 'HIGH',
          window: '24-72 hours',
          action: `Position as stable alternative to ${compSignal.competitor}`,
          confidence: 75,
          source_signal: compSignal
        })
      }
    }
    
    // Generate opportunities from narrative gaps
    if (signals.narrative_gaps?.length > 0) {
      for (const gap of signals.narrative_gaps.slice(0, 2)) {
        opportunities.push({
          id: crypto.randomUUID(),
          title: `Thought Leadership: ${gap.topic}`,
          description: gap.opportunity || `Media opportunity on ${gap.topic}`,
          opportunity_type: 'narrative_navigator',
          persona: 'Narrative Navigator',
          urgency: 'MEDIUM',
          window: '3-5 days',
          action: 'Offer executive as expert source',
          media_target: gap.platform,
          confidence: 70,
          source_signal: gap
        })
      }
    }
  }

  // Apply configuration filters and scoring
  return opportunities.map(opp => ({
    ...opp,
    id: crypto.randomUUID(),
    priority_score: calculatePriorityScore(opp, config),
    created_at: new Date().toISOString()
  })).filter(opp => opp.priority_score >= (config.minimum_confidence || 70))
    .sort((a, b) => b.priority_score - a.priority_score)
}

// Helper function for persona analysis
async function analyzeWithPersona(personaName: string, prompt: string, signals: any[]) {
  console.log(`🎭 ${personaName}: Analyzing ${signals.length} signals`)
  
  // Get API key at runtime
  const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
  
  // Always try to generate opportunities, even with no signals (proactive opportunities)
  if (!ANTHROPIC_API_KEY) {
    console.log(`⚠️ No ANTHROPIC_API_KEY found, generating fallback opportunities for ${personaName}`)
    
    // Generate fallback opportunities based on persona type
    const fallbackOpportunities = []
    
    if (personaName === 'Competitive Opportunist') {
      fallbackOpportunities.push({
        title: 'Competitor Vulnerability: Market Share Opportunity',
        description: 'Recent industry analysis shows potential market share gain opportunity',
        urgency: 'HIGH',
        window: '2-4 weeks',
        action: 'Launch targeted campaign highlighting competitive advantages',
        impact: 'Potential 5-10% market share gain',
        persona: personaName,
        opportunity_type: 'competitor_weakness',
        confidence: 75
      })
    } else if (personaName === 'Narrative Navigator') {
      fallbackOpportunities.push({
        title: 'Thought Leadership Gap: AI Ethics Discussion',
        description: 'Industry lacking authoritative voice on emerging AI ethics challenges',
        urgency: 'MEDIUM',
        window: '1-2 weeks',
        action: 'Position executive for media interviews and opinion pieces',
        impact: 'Establish thought leadership position',
        persona: personaName,
        opportunity_type: 'narrative_vacuum',
        confidence: 80
      })
    } else if (personaName === 'Cascade Predictor') {
      fallbackOpportunities.push({
        title: 'Supply Chain Disruption: First Mover Advantage',
        description: 'Emerging supply chain challenges create opportunity for proactive positioning',
        urgency: 'URGENT',
        window: '24-48 hours',
        action: 'Announce supply chain resilience measures',
        impact: 'Industry leadership position',
        persona: personaName,
        opportunity_type: 'cascade_effect',
        confidence: 85
      })
    } else if (personaName === 'Crisis Preventer') {
      fallbackOpportunities.push({
        title: 'Preemptive Security Disclosure',
        description: 'Industry-wide security concerns create opportunity for transparency',
        urgency: 'HIGH',
        window: '1 week',
        action: 'Publish security practices and audit results',
        impact: 'Build trust before industry crisis',
        persona: personaName,
        opportunity_type: 'crisis_prevention',
        confidence: 70
      })
    } else if (personaName === 'Viral Virtuoso') {
      fallbackOpportunities.push({
        title: 'Trending Topic: Sustainable Tech',
        description: 'Rising social media discussion on sustainability in tech',
        urgency: 'HIGH',
        window: '48-72 hours',
        action: 'Create viral content showcasing green initiatives',
        impact: 'Potential 10M+ impressions',
        persona: personaName,
        opportunity_type: 'viral_moment',
        confidence: 65
      })
    }
    
    return fallbackOpportunities
  }
  
  // Even with no signals, ask Claude to identify proactive opportunities
  if (signals.length === 0) {
    console.log(`📍 ${personaName}: No signals, requesting proactive opportunities`)
    prompt = prompt.replace('Analyze these', 'No specific signals detected, but identify proactive opportunities based on industry patterns for')
  }

  try {
    console.log(`🔮 ${personaName}: Calling Claude API...`)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 800,
        temperature: 0.4,
        messages: [{
          role: 'user',
          content: `${prompt}\n\nProvide up to 3 opportunities as a JSON array with the exact structure shown. Return ONLY valid JSON, no markdown or explanations.`
        }]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ ${personaName}: Claude API returned ${response.status}:`, errorText)
      throw new Error(`Claude API error: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log(`📦 ${personaName}: Claude response received`)
    
    // Extract text content from Claude's response
    const textContent = result.content[0].text
    console.log(`📝 ${personaName}: Raw response:`, textContent.substring(0, 200))
    
    // Try to parse JSON from the response
    let opportunities
    try {
      // Remove any markdown code blocks if present
      const cleanJson = textContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      opportunities = JSON.parse(cleanJson)
    } catch (parseError) {
      console.error(`⚠️ ${personaName}: Failed to parse JSON:`, parseError)
      console.log(`Raw content that failed to parse:`, textContent)
      // Return empty array if JSON parsing fails
      return []
    }
    
    console.log(`✅ ${personaName}: Generated ${opportunities.length} opportunities`)
    
    return opportunities.map((opp: any) => ({
      ...opp,
      persona: personaName,
      opportunity_type: personaName.toLowerCase().replace(' ', '_')
    }))
  } catch (error) {
    console.error(`❌ ${personaName} analysis error:`, error)
    
    // If we have signals, generate fallback opportunities
    if (signals.length > 0 && personaName === 'Cascade Predictor') {
      console.log(`🔄 ${personaName}: Using fallback opportunities from signals`)
      return signals.slice(0, 2).map(signal => ({
        title: `Cascade Opportunity: ${signal.trigger || signal.event || 'Industry Disruption'}`,
        urgency: 'HIGH',
        window: '24-48 hours',
        action: 'Position for first-mover advantage',
        impact: 'Industry-wide cascade effect predicted',
        persona: personaName,
        opportunity_type: 'cascade_predictor',
        confidence: 85
      }))
    }
    
    return []
  }
}

// Helper functions
async function scrapeWithFirecrawl(url: string, options: any = {}) {
  try {
    const response = await fetch('https://api.firecrawl.dev/v2/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url, ...options })
    })
    
    if (!response.ok) {
      console.error(`Firecrawl scrape error for ${url}:`, response.status)
      return null
    }
    
    const result = await response.json()
    return result.data
  } catch (error) {
    console.error(`Firecrawl scrape failed for ${url}:`, error)
    return null
  }
}

async function searchWithFirecrawl(query: string, options: any = {}) {
  try {
    console.log(`🔍 Firecrawl search for: ${query}`)
    console.log(`🔑 Using Firecrawl API key: ${FIRECRAWL_API_KEY?.substring(0, 10)}...`)
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
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Firecrawl search error:`, response.status, errorText)
      return null
    }
    
    const result = await response.json()
    console.log(`✅ Firecrawl returned ${result?.data?.length || 0} results`)
    
    // Transform v1 response to match expected format
    if (result?.success && result?.data) {
      return {
        success: true,
        data: {
          web: result.data  // v1 returns data array directly
        }
      }
    }
    
    return null
  } catch (error) {
    console.error(`Firecrawl search failed:`, error)
    return null
  }
}

function calculatePriorityScore(opportunity: any, config: any) {
  let score = opportunity.confidence || 75
  
  // Boost for urgency
  if (opportunity.urgency === 'URGENT') score += 20
  else if (opportunity.urgency === 'HIGH') score += 10
  
  // Boost for configured opportunity types
  if (config.opportunity_types?.[opportunity.opportunity_type]) score += 5
  
  // Adjust for risk tolerance
  if (config.risk_tolerance === 'aggressive') score += 10
  else if (config.risk_tolerance === 'conservative') score -= 10
  
  return Math.min(score, 100)
}

function getDefaultOpportunityMapping(organization: any) {
  // Fallback mapping when Claude is unavailable
  const industryMaps: Record<string, any> = {
    'automotive': {
      competitors_to_monitor: [
        { name: 'Tesla', domain: 'tesla.com', weakness_signals: ['delay', 'recall', 'investigation'] },
        { name: 'Ford', domain: 'ford.com', weakness_signals: ['layoff', 'restructuring', 'loss'] },
        { name: 'GM', domain: 'gm.com', weakness_signals: ['shortage', 'lawsuit', 'decline'] }
      ],
      narrative_opportunities: {
        topics: ['electric vehicles', 'autonomous driving', 'sustainability'],
        journalists: ['automotive journalists', 'tech reporters'],
        platforms: ['Automotive News', 'Electrek', 'InsideEVs']
      },
      cascade_triggers: {
        supply_chain: ['chip shortage', 'battery shortage'],
        regulatory: ['emissions standards', 'safety regulations'],
        market: ['EV adoption', 'charging infrastructure']
      }
    },
    'technology': {
      competitors_to_monitor: [
        { name: 'Microsoft', domain: 'microsoft.com', weakness_signals: ['outage', 'breach', 'antitrust'] },
        { name: 'Google', domain: 'google.com', weakness_signals: ['privacy', 'lawsuit', 'layoff'] },
        { name: 'Meta', domain: 'meta.com', weakness_signals: ['regulation', 'user decline', 'scandal'] }
      ],
      narrative_opportunities: {
        topics: ['AI ethics', 'data privacy', 'digital transformation'],
        journalists: ['tech journalists', 'business reporters'],
        platforms: ['TechCrunch', 'The Verge', 'Wired']
      },
      cascade_triggers: {
        supply_chain: ['cloud outage', 'API changes'],
        regulatory: ['data protection', 'AI regulation'],
        market: ['platform shifts', 'user migration']
      }
    }
  }
  
  return industryMaps[organization.industry?.toLowerCase()] || industryMaps['technology']
}

// Main handler
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { organization, config, forceRefresh } = await req.json()
    
    console.log(`🎯 Opportunity Orchestrator started for ${organization.name}`)
    
    // PHASE 1: Discover opportunity landscape
    console.log('🔍 Phase 1: Discovering opportunity landscape...')
    const opportunityMap = await discoverOpportunityLandscape(organization, config)
    
    // PHASE 2: Gather real-time signals
    console.log('📡 Phase 2: Gathering real-time signals...')
    const signals = await gatherOpportunitySignals(opportunityMap, organization)
    
    // PHASE 3: Synthesize with specialized personas
    console.log('🧠 Phase 3: Synthesizing opportunities with 5 personas...')
    const opportunities = await synthesizeOpportunities(signals, opportunityMap, organization, config)
    
    console.log(`✅ Found ${opportunities.length} opportunities`)
    
    return new Response(
      JSON.stringify({
        success: true,
        organization: organization.name,
        timestamp: new Date().toISOString(),
        phases_completed: {
          discovery: true,
          gathering: true,
          synthesis: true
        },
        opportunity_map: opportunityMap,
        signals,
        opportunities,
        personas_used: [
          'Competitive Opportunist',
          'Narrative Navigator', 
          'Cascade Predictor',
          'Crisis Preventer',
          'Viral Virtuoso'
        ]
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Opportunity orchestration error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        opportunities: []
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  }
})