// Opportunity Engine V2 - Transform Intelligence into ACTION
// Core platform feature: Not just reports, but PLAYBOOKS

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { withCors, jsonResponse, errorResponse } from "../_shared/cors.ts"

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Opportunity Personas - Each analyst creates different opportunity types
const OPPORTUNITY_PERSONAS = {
  // From Marcus Chen (PR Strategist)
  'pr_opportunist': {
    name: 'Marcus Chen',
    focuses_on: 'competitor_weaknesses_and_narratives', 
    actions: ['narrative_hijacking', 'crisis_response', 'pr_positioning', 'media_blitz'],
    urgency_bias: 'HIGH', // PR moves fast
    confidence_threshold: 70
  },
  
  // From Victoria Chen (Power Broker)
  'power_player': {
    name: 'Victoria Chen',
    focuses_on: 'stakeholder_shifts_and_power_dynamics',
    actions: ['executive_engagement', 'investor_relations', 'partnership_plays', 'talent_poaching'],
    urgency_bias: 'MEDIUM', // Relationship building takes time
    confidence_threshold: 75
  },
  
  // From Sarah Kim (Trend Hunter)
  'viral_architect': {
    name: 'Sarah Kim',
    focuses_on: 'trending_topics_and_viral_potential',
    actions: ['content_creation', 'media_hijacking', 'viral_campaigns', 'influencer_engagement'],
    urgency_bias: 'CRITICAL', // Trends die fast
    confidence_threshold: 65
  },
  
  // From Helena Cross (Cascade Predictor)
  'cascade_surfer': {
    name: 'Helena Cross',
    focuses_on: 'weak_signals_and_cascade_effects',
    actions: ['preemptive_positioning', 'supply_chain_pivots', 'regulatory_preparation', 'crisis_prevention'],
    urgency_bias: 'HIGH', // Must act before cascade
    confidence_threshold: 60 // Lower threshold for weak signals
  },
  
  // From Market Analyst
  'market_mover': {
    name: 'Market Analyst',
    focuses_on: 'economic_indicators_and_market_shifts',
    actions: ['pricing_strategy', 'market_entry', 'competitive_positioning', 'product_pivots'],
    urgency_bias: 'MEDIUM',
    confidence_threshold: 80
  }
}

// Enhanced Opportunity Structure
interface EnhancedOpportunity {
  // Core identification
  id: string
  title: string
  description: string
  
  // Classification
  opportunity_type: 'competitive' | 'narrative' | 'cascade' | 'market' | 'stakeholder'
  persona: string // Which analyst spotted this
  persona_name: string // Human name
  
  // Timing (CRITICAL for action) - Note: CRITICAL maps to HIGH in database
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  time_window: string // "24-48 hours", "1 week", etc
  expires_at: string // ISO date when opportunity closes
  
  // Specific action items (THE PLAYBOOK)
  action_items: Array<{
    step: number
    action: string
    owner: string // CEO, CMO, CTO, etc
    deadline: string // ISO date
    success_metric: string // How we know it worked
  }>
  
  // Intelligence source (traceability)
  source_insights: {
    from_synthesis: string[] // Which synthesis sections drove this
    from_events: Array<{type: string, title: string}> // Specific events
    from_entities: string[] // Companies/people involved
    from_trends: string[] // Trending topics leveraged
  }
  
  // Expected impact (THE WHY)
  expected_impact: {
    revenue: string // "+$2M opportunity" or "Prevent -$5M loss"
    reputation: string // "Position as AI leader" 
    competitive_advantage: string // "6-month head start"
    risk_mitigation: string // "Avoid supply chain disruption"
  }
  
  // Confidence and risks
  confidence: number // 0-100
  confidence_factors: string[] // Why we believe this will work
  risks: string[] // What could go wrong
  
  // Metadata
  status: 'new' | 'reviewed' | 'in_progress' | 'completed' | 'expired'
  created_at: string
  organization: string
}

// Helper function to map categories to personas
function mapCategoryToPersona(category: string): string {
  const categoryMap = {
    'COMPETITIVE': 'pr_opportunist',
    'STRATEGIC': 'power_player',
    'VIRAL': 'viral_architect',
    'CASCADE': 'cascade_surfer',
    'IMMEDIATE': 'pr_opportunist',
    'TALENT': 'power_player',
    'REGULATORY': 'market_mover',
    'DEFENSIVE': 'pr_opportunist'
  };
  return categoryMap[category?.toUpperCase()] || 'pr_opportunist';
}

// PHASE 1: Extract Opportunities from Executive Synthesis
function extractOpportunitiesFromSynthesis(synthesis: any): any[] {
  const opportunities = []
  
  // Extract from competitive dynamics (Marcus Chen)
  if (synthesis.competitive_dynamics?.key_competitor_moves) {
    for (const move of synthesis.competitive_dynamics.key_competitor_moves) {
      if (move.response_required) {
        opportunities.push({
          type: 'competitive',
          persona: 'pr_opportunist',
          raw_insight: move,
          source_section: 'competitive_dynamics'
        })
      }
    }
  }
  
  // Extract from stakeholder intelligence (Victoria Chen)
  if (synthesis.stakeholder_intelligence?.power_shifts) {
    for (const shift of synthesis.stakeholder_intelligence.power_shifts) {
      if (shift.opportunity) {
        opportunities.push({
          type: 'stakeholder',
          persona: 'power_player',
          raw_insight: shift,
          source_section: 'stakeholder_intelligence'
        })
      }
    }
  }
  
  // Extract from trending narratives (Sarah Kim)
  if (synthesis.trending_narratives?.viral_potential) {
    for (const trend of synthesis.trending_narratives.viral_potential) {
      if (trend.insertion_point) {
        opportunities.push({
          type: 'narrative',
          persona: 'viral_architect',
          raw_insight: trend,
          source_section: 'trending_narratives'
        })
      }
    }
  }
  
  // Extract from cascade detection (Helena Cross)
  if (synthesis.cascade_detection?.weak_signals) {
    for (const signal of synthesis.cascade_detection.weak_signals) {
      if (signal.preparation_needed) {
        opportunities.push({
          type: 'cascade',
          persona: 'cascade_surfer',
          raw_insight: signal,
          source_section: 'cascade_detection'
        })
      }
    }
  }
  
  // Extract from market signals
  if (synthesis.market_signals?.industry_movements) {
    for (const movement of synthesis.market_signals.industry_movements) {
      if (movement.strategic_response) {
        opportunities.push({
          type: 'market',
          persona: 'market_mover',
          raw_insight: movement,
          source_section: 'market_signals'
        })
      }
    }
  }
  
  // Also grab the pre-identified opportunities
  if (synthesis.immediate_opportunities) {
    for (const opp of synthesis.immediate_opportunities) {
      opportunities.push({
        type: 'immediate',
        persona: 'pr_opportunist', // Default to PR for immediate
        raw_insight: opp,
        source_section: 'immediate_opportunities'
      })
    }
  }
  
  return opportunities
}

// PHASE 2: Score and Prioritize Opportunities
function scoreOpportunity(opp: any, enrichedData: any): number {
  let score = 50 // Base score
  
  const persona = OPPORTUNITY_PERSONAS[opp.persona]
  
  // Urgency multiplier
  const urgencyMultipliers = {
    'CRITICAL': 2.0,
    'HIGH': 1.5,
    'MEDIUM': 1.0,
    'LOW': 0.5
  }
  
  // Calculate urgency based on persona bias and timing
  let urgency = persona.urgency_bias
  if (opp.raw_insight.window?.includes('24') || opp.raw_insight.window?.includes('48')) {
    urgency = 'CRITICAL'
  }
  
  score *= urgencyMultipliers[urgency]
  
  // Confidence adjustment
  const confidence = opp.raw_insight.confidence || persona.confidence_threshold
  score *= (confidence / 100)
  
  // Source quality bonus
  if (opp.source_section === 'immediate_opportunities') score += 20
  if (opp.source_section === 'critical_threats') score += 15
  if (opp.type === 'cascade') score += 10 // Cascade opportunities are rare and valuable
  
  // Entity relevance bonus (mentioned important companies)
  const mentionedEntities = enrichedData?.extracted_data?.entities?.companies || []
  if (mentionedEntities.length > 5) score += 10
  
  // Event richness bonus
  const totalEvents = Object.values(enrichedData?.extracted_data?.events || {})
    .reduce((sum: number, events: any) => sum + (Array.isArray(events) ? events.length : 0), 0)
  if (totalEvents > 10) score += 15
  
  return Math.min(100, Math.round(score))
}

// PHASE 3: Transform into Actionable Opportunities with Claude
async function transformToActionableOpportunity(
  rawOpp: any, 
  organization: any,
  enrichedData: any,
  index: number
): Promise<EnhancedOpportunity> {
  const persona = OPPORTUNITY_PERSONAS[rawOpp.persona]
  const now = new Date()
  
  // Calculate expiration based on window
  const expirationHours = {
    'CRITICAL': 24,
    'HIGH': 72,
    'MEDIUM': 168, // 1 week
    'LOW': 336 // 2 weeks
  }
  
  const urgency = persona.urgency_bias
  const expiresAt = new Date(now.getTime() + expirationHours[urgency] * 60 * 60 * 1000)
  
  // Frontend-aligned opportunity structure
  const opportunity: any = {
    // Core fields expected by frontend
    id: `${crypto.randomUUID()}-${Date.now()}`,
    title: rawOpp.raw_insight.title || `${rawOpp.type} Opportunity`,
    description: rawOpp.raw_insight.description || rawOpp.raw_insight.action || 
                 rawOpp.raw_insight.response_required || 'Strategic opportunity identified',
    
    // Frontend expects these exact field names
    score: rawOpp.score || 75,
    urgency: urgency.toLowerCase() as 'high' | 'medium' | 'low',
    time_window: rawOpp.raw_insight.window || `${expirationHours[urgency]} hours`,
    category: rawOpp.type?.toUpperCase() || 'GENERAL',
    trigger_event: rawOpp.raw_insight.trigger || rawOpp.raw_insight.description?.substring(0, 100) || 'Market signal detected',
    
    // Frontend expects this exact structure for recommended_action
    recommended_action: {
      what: {
        primary_action: rawOpp.raw_insight.pr_angle || rawOpp.raw_insight.action || 'Take strategic action',
        specific_tasks: [
          'Analyze the opportunity in detail',
          'Develop response strategy',
          'Execute PR campaign',
          'Monitor results'
        ],
        deliverables: [
          'Press release',
          'Social media content',
          'Executive briefing',
          'Media outreach plan'
        ]
      },
      who: {
        owner: persona.primary_owner || 'CMO',
        team: persona.collaborators || ['PR Team', 'Marketing', 'Strategy']
      },
      when: {
        start_immediately: urgency === 'CRITICAL' || urgency === 'HIGH',
        ideal_launch: rawOpp.raw_insight.window || '48 hours',
        duration: '1-2 weeks'
      },
      where: {
        channels: ['Press', 'Social Media', 'Direct Outreach', 'Internal'],
        platforms: ['Twitter', 'LinkedIn', 'Media Outlets', 'Industry Publications']
      }
    },
    
    // Keep additional fields for backend use
    opportunity_type: rawOpp.type,
    persona: rawOpp.persona,
    persona_name: persona.name,
    expires_at: expiresAt.toISOString(),
    
    source_insights: {
      from_synthesis: [rawOpp.source_section],
      from_events: [],
      from_entities: [],
      from_trends: []
    },
    
    confidence: rawOpp.raw_insight.confidence || persona.confidence_threshold,
    confidence_factors: [],
    risks: [],
    
    status: 'new',
    created_at: now.toISOString(),
    organization: organization.name
  }
  
  // Extract relevant events and entities
  if (enrichedData?.extracted_data?.events) {
    const allEvents = Object.entries(enrichedData.extracted_data.events)
      .flatMap(([type, events]: [string, any]) => 
        (Array.isArray(events) ? events : []).map((e: any) => ({type, title: e.title}))
      )
      .slice(0, 3)
    opportunity.source_insights.from_events = allEvents
  }
  
  if (enrichedData?.extracted_data?.entities?.companies) {
    opportunity.source_insights.from_entities = enrichedData.extracted_data.entities.companies.slice(0, 5)
  }
  
  if (enrichedData?.extracted_data?.topics?.trending) {
    opportunity.source_insights.from_trends = enrichedData.extracted_data.topics.trending
      .slice(0, 3)
      .map((t: any) => t.topic || t)
  }
  
  // If we have Claude API, enhance with specific action items
  if (ANTHROPIC_API_KEY && index < 5) { // Limit Claude calls to top 5
    try {
      const prompt = `You are ${persona.name}, creating an actionable playbook for ${organization.name}.

Context: ${JSON.stringify(rawOpp.raw_insight)}
Organization: ${organization.name} in ${organization.industry || 'technology'}
Opportunity Type: ${rawOpp.type}
Window: ${opportunity.time_window}

Create a specific action plan with 3-5 concrete steps. Return ONLY valid JSON:
{
  "title": "Specific, catchy opportunity title",
  "action_items": [
    {
      "step": 1,
      "action": "Specific action to take",
      "owner": "CEO/CMO/CTO/etc",
      "deadline": "In X hours/days",
      "success_metric": "How we measure success"
    }
  ],
  "expected_impact": {
    "revenue": "Specific estimate or range",
    "reputation": "Specific positioning gain",
    "competitive_advantage": "Specific advantage gained",
    "risk_mitigation": "Specific risk avoided"
  },
  "confidence_factors": ["Why this will work #1", "Why #2"],
  "risks": ["What could go wrong #1", "Risk #2"]
}`

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 800,
          temperature: 0.4,
          messages: [{ role: 'user', content: prompt }]
        })
      })

      if (response.ok) {
        const result = await response.json()
        try {
          // Claude might return JSON wrapped in markdown code blocks
          let claudeResponse = result.content[0].text
          
          // Remove markdown code block wrapper if present
          claudeResponse = claudeResponse.replace(/^```json\n?/, '').replace(/\n?```$/, '')
          // Also handle case where it's just ```
          claudeResponse = claudeResponse.replace(/^```\n?/, '').replace(/\n?```$/, '')
          
          const enhancement = JSON.parse(claudeResponse)
          
          // Merge Claude's enhancements
          if (enhancement.title) opportunity.title = enhancement.title
          if (enhancement.action_items) {
            opportunity.action_items = enhancement.action_items.map((item: any, i: number) => ({
              ...item,
              step: item.step || i + 1,
              deadline: calculateDeadline(item.deadline || opportunity.window)
            }))
          }
          if (enhancement.expected_impact) {
            opportunity.expected_impact = enhancement.expected_impact
          }
          if (enhancement.confidence_factors) {
            opportunity.confidence_factors = enhancement.confidence_factors
          }
          if (enhancement.risks) {
            opportunity.risks = enhancement.risks
          }
          
        } catch (e) {
          console.log('Could not parse Claude enhancement for opportunity', e)
        }
      }
    } catch (error) {
      console.error('Claude enhancement failed:', error)
    }
  }
  
  // Fallback action items if Claude didn't provide any
  if (opportunity.action_items.length === 0) {
    opportunity.action_items = generateFallbackActions(rawOpp, persona, organization)
  }
  
  return opportunity
}

// Helper: Generate fallback action items
function generateFallbackActions(rawOpp: any, persona: any, organization: any): any[] {
  const actions = []
  const baseDeadline = new Date()
  
  // Generate persona-specific actions
  for (let i = 0; i < Math.min(3, persona.actions.length); i++) {
    const deadline = new Date(baseDeadline.getTime() + (i + 1) * 24 * 60 * 60 * 1000)
    actions.push({
      step: i + 1,
      action: `${persona.actions[i]}: ${rawOpp.raw_insight.action || rawOpp.raw_insight.response_required || 'Take action'}`,
      owner: i === 0 ? 'CEO' : i === 1 ? 'CMO' : 'COO',
      deadline: deadline.toISOString(),
      success_metric: `${persona.actions[i]} completed successfully`
    })
  }
  
  return actions
}

// Helper: Calculate deadline from string
function calculateDeadline(deadlineStr: string): string {
  const now = new Date()
  let hours = 48 // Default
  
  if (deadlineStr.includes('24')) hours = 24
  else if (deadlineStr.includes('48')) hours = 48
  else if (deadlineStr.includes('72')) hours = 72
  else if (deadlineStr.includes('week')) hours = 168
  else if (deadlineStr.includes('day')) {
    const days = parseInt(deadlineStr.match(/\d+/)?.[0] || '2')
    hours = days * 24
  }
  
  return new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString()
}

// PHASE 4: Store Opportunities in Database
async function storeOpportunities(opportunities: EnhancedOpportunity[]): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.log('⚠️ Cannot store opportunities - missing Supabase credentials')
    return
  }
  
  try {
    // Create Supabase client for direct database access
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.7')
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    // Prepare opportunities for insertion
    const opportunitiesToInsert = opportunities.map(opp => ({
      // Match actual database schema columns
      organization_id: organization_id || opp.organization || '1',
      title: opp.title,
      description: opp.description,
      score: opp.confidence || 75,
      urgency: opp.urgency.toLowerCase() === 'critical' ? 'high' : opp.urgency.toLowerCase(),
      time_window: opp.time_window,
      category: opp.opportunity_type?.toUpperCase() || 'GENERAL',
      expires_at: opp.expires_at,
      status: opp.status || 'active',
      // Store all enhanced data in the JSONB data column
      data: {
        organization_name: organization_name || orgData.name || 'Unknown',
        opportunity_id: opp.id,
        persona: opp.persona,
        persona_name: opp.persona_name,
        action_items: opp.action_items || [],
        source_insights: opp.source_insights || {},
        expected_impact: opp.expected_impact || {},
        confidence_factors: opp.confidence_factors || [],
        risks: opp.risks || [],
        priority_score: Math.round(opp.confidence * 0.8 + (opp.urgency === 'CRITICAL' ? 20 : opp.urgency === 'HIGH' ? 15 : 10)),
        raw_data: opp
      }
    }))
    
    // Insert opportunities into the database
    const { data, error } = await supabase
      .from('opportunities')
      .insert(opportunitiesToInsert)
    
    if (error) {
      console.error('Error storing opportunities:', error)
      // Continue anyway - don't fail the whole request
    } else {
      console.log(`✅ Stored ${opportunities.length} opportunities in database`)
    }
    
    // Also store in intelligence_persistence for backwards compatibility
    for (const opp of opportunities) {
      await fetch(
        `${SUPABASE_URL}/functions/v1/intelligence-persistence`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
          },
          body: JSON.stringify({
            action: 'save',
            organization_name: opp.organization,
            stage: 'opportunity_engine',
            data_type: 'opportunity',
            content: opp,
            metadata: {
              opportunity_id: opp.id,
              urgency: opp.urgency,
              expires_at: opp.expires_at,
              confidence: opp.confidence,
              persona: opp.persona,
              status: opp.status
            }
          })
        }
      ).catch(err => console.warn('Failed to store in intelligence_persistence:', err))
    }
  } catch (error) {
    console.error('Failed to store opportunities:', error)
    // Don't throw - continue with response even if storage fails
  }
}

// Main handler
serve(withCors(async (req) => {
  try {
    const requestData = await req.json()
    const { 
      organization,
      organization_name,
      organization_id, 
      enriched_data,
      executive_synthesis,
      competitive_moves,
      cascade_risks,
      viral_topics,
      power_shifts,
      intelligence_synthesis, // Alternative name for executive_synthesis
      detected_opportunities, // NEW: Pre-detected opportunities from MCP-Opportunity-Detector
      config = {}
    } = requestData
    
    // Use either executive_synthesis or intelligence_synthesis
    const synthesis = executive_synthesis || intelligence_synthesis || {}
    
    // Create organization object if not provided
    const orgData = organization || { 
      name: organization_name || 'Unknown',
      id: organization_id || '1'
    };
    
    console.log(`🎯 Opportunity Engine V2 for ${orgData.name} - TURNING INTELLIGENCE INTO ACTION`)
    console.log('📊 Input data:', {
      has_synthesis: !!synthesis,
      has_enriched_data: !!enriched_data,
      synthesis_sections: Object.keys(synthesis),
      total_events: Object.values(enriched_data?.extracted_data?.events || {})
        .reduce((sum: number, events: any) => sum + (Array.isArray(events) ? events.length : 0), 0)
    })
    
    // STEP 1: Use detected opportunities if available, otherwise extract from synthesis
    let rawOpportunities = [];
    if (detected_opportunities && detected_opportunities.length > 0) {
      console.log(`📡 Using ${detected_opportunities.length} pre-detected opportunities from MCP-Opportunity-Detector`);
      // Transform detected opportunities to match our format
      rawOpportunities = detected_opportunities.map(opp => ({
        type: opp.category?.toLowerCase() || 'general',
        persona: mapCategoryToPersona(opp.category),
        raw_insight: {
          title: opp.title,
          description: opp.description,
          trigger: opp.trigger_event,
          urgency: opp.urgency,
          window: opp.time_window,
          pr_angle: opp.pr_angle,
          confidence_factors: opp.confidence_factors,
          pattern: opp.pattern_matched,
          signal_strength: opp.signal_strength
        },
        source_section: 'signal_detection',
        score: opp.score || 75
      }));
    } else {
      // Fallback to synthesis extraction
      rawOpportunities = extractOpportunitiesFromSynthesis(synthesis);
      console.log(`📋 Extracted ${rawOpportunities.length} raw opportunities from synthesis`);
    }
    
    // STEP 2: Score and prioritize
    const scoredOpportunities = rawOpportunities.map(opp => ({
      ...opp,
      score: scoreOpportunity(opp, enriched_data)
    })).sort((a, b) => b.score - a.score)
    
    console.log(`🎯 Scored opportunities:`, scoredOpportunities.slice(0, 5).map(o => ({
      type: o.type,
      score: o.score,
      persona: o.persona
    })))
    
    // STEP 3: Transform top opportunities into actionable playbooks
    // Orchestrator filters detector's 15-20 opportunities down to best 5-7
    const maxOpportunities = config.max_opportunities || 7  // Focus on quality over quantity
    const minConfidence = config.min_confidence || 70      // Higher bar for final selection
    
    // Apply intelligent filtering - diversity + quality
    const filteredOpportunities = scoredOpportunities.filter(opp => opp.score >= minConfidence);
    
    // Ensure diversity - don't take all opportunities from same category
    const categoryCount = new Map();
    const topOpportunities = [];
    
    for (const opp of filteredOpportunities) {
      const category = opp.type;
      const count = categoryCount.get(category) || 0;
      
      // Max 2 opportunities per category for diversity
      if (count < 2) {
        topOpportunities.push(opp);
        categoryCount.set(category, count + 1);
      }
      
      if (topOpportunities.length >= maxOpportunities) break;
    }
    
    console.log(`🎯 Filtered ${scoredOpportunities.length} opportunities down to ${topOpportunities.length} actionable ones`);
    
    const actionableOpportunities: EnhancedOpportunity[] = []
    
    for (let i = 0; i < topOpportunities.length; i++) {
      const actionableOpp = await transformToActionableOpportunity(
        topOpportunities[i],
        orgData, // Use orgData instead of undefined organization
        enriched_data,
        i
      )
      actionableOpportunities.push(actionableOpp)
    }
    
    console.log(`✅ Created ${actionableOpportunities.length} high-quality actionable opportunities (target: 5-7)`)
    
    // STEP 4: Store opportunities in database
    await storeOpportunities(actionableOpportunities)
    
    // STEP 5: Transform opportunities for frontend compatibility
    const frontendOpportunities = actionableOpportunities.map(opp => ({
      // Core fields the frontend expects
      id: opp.id,
      title: opp.title,
      description: opp.description,
      score: opp.confidence, // Map confidence to score
      urgency: (opp.urgency.toLowerCase() === 'critical' ? 'high' : opp.urgency.toLowerCase()) as 'high' | 'medium' | 'low',
      time_window: opp.time_window,
      category: opp.opportunity_type.toUpperCase(), // Map opportunity_type to category
      trigger_event: opp.source_insights?.from_events?.[0]?.title || 'Market signal detected',
      
      // Transform action_items to recommended_action structure
      recommended_action: {
        what: {
          primary_action: opp.action_items?.[0]?.action || opp.description,
          specific_tasks: opp.action_items?.map(item => item.action) || [],
          deliverables: opp.action_items?.map(item => item.success_metric) || []
        },
        who: {
          owner: opp.action_items?.[0]?.owner || 'CEO',
          team: [...new Set(opp.action_items?.map(item => item.owner) || ['CEO'])]
        },
        when: {
          start_immediately: opp.urgency === 'CRITICAL' || opp.urgency === 'HIGH',
          ideal_launch: opp.action_items?.[0]?.deadline || opp.expires_at,
          duration: opp.time_window
        },
        where: {
          channels: ['PR', 'Social Media', 'Direct Outreach'],
          platforms: ['LinkedIn', 'Twitter', 'Industry Publications']
        }
      },
      
      // Keep enhanced fields for backend use
      _enhanced: {
        persona: opp.persona,
        persona_name: opp.persona_name,
        expected_impact: opp.expected_impact,
        confidence_factors: opp.confidence_factors,
        risks: opp.risks,
        source_insights: opp.source_insights
      }
    }));
    
    // STEP 6: Return structured response
    const response = {
      success: true,
      organization: orgData.name,
      opportunities: frontendOpportunities, // Use transformed opportunities
      summary: {
        total: actionableOpportunities.length,
        critical: actionableOpportunities.filter(o => o.urgency === 'CRITICAL').length,
        high: actionableOpportunities.filter(o => o.urgency === 'HIGH').length,
        by_type: {
          competitive: actionableOpportunities.filter(o => o.opportunity_type === 'competitive').length,
          narrative: actionableOpportunities.filter(o => o.opportunity_type === 'narrative').length,
          cascade: actionableOpportunities.filter(o => o.opportunity_type === 'cascade').length,
          market: actionableOpportunities.filter(o => o.opportunity_type === 'market').length,
          stakeholder: actionableOpportunities.filter(o => o.opportunity_type === 'stakeholder').length,
        },
        by_persona: Object.keys(OPPORTUNITY_PERSONAS).reduce((acc, persona) => {
          acc[persona] = actionableOpportunities.filter(o => o.persona === persona).length
          return acc
        }, {} as Record<string, number>)
      },
      metadata: {
        generated_at: new Date().toISOString(),
        synthesis_sections_used: Object.keys(synthesis),
        total_events_analyzed: Object.values(enriched_data?.extracted_data?.events || {})
          .reduce((sum: number, events: any) => sum + (Array.isArray(events) ? events.length : 0), 0),
        config_used: config
      }
    }
    
    return jsonResponse(response)

  } catch (error: any) {
    console.error('Opportunity Engine error:', error)
    return errorResponse(error.message || 'Failed to generate opportunities', 500)
  }
}))
