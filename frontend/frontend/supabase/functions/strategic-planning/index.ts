import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const { url, method } = req
    const urlPath = new URL(url).pathname.replace('/strategic-planning', '')
    
    // Route handling
    if (method === 'POST' && (urlPath === '/generate-plan' || urlPath === '' || urlPath === '/')) {
      return await generatePlan(req, supabaseClient)
    }
    
    if (method === 'POST' && urlPath === '/execute-campaign') {
      return await executeCampaign(req, supabaseClient)
    }
    
    if (method === 'POST' && urlPath === '/gather-evidence') {
      return await gatherEvidence(req, supabaseClient)
    }
    
    if (method === 'PUT' && urlPath.startsWith('/update-plan/')) {
      return await updatePlan(req, supabaseClient)
    }
    
    if (method === 'GET' && urlPath.startsWith('/plan-status/')) {
      return await getPlanStatus(req, supabaseClient)
    }

    return new Response(
      JSON.stringify({ error: 'Not Found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Strategic Planning function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function generatePlan(req: Request, supabaseClient: any) {
  const { objective, context, constraints, timeline } = await req.json()
  
  if (!objective) {
    return new Response(
      JSON.stringify({ success: false, error: 'Objective is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Niv's Strategic Planning Prompt - 20 Years of PR Experience
  const prompt = `I'm Niv, and I've been doing strategic PR for 20 years. Let me create a strategic plan that actually works.

THE SITUATION:
Objective: ${objective}
${context ? `Context: ${context}` : ''}
${constraints ? `Constraints: ${constraints}` : ''}
${timeline ? `Timeline: ${timeline}` : ''}

As a senior PR strategist, I need to think through this strategically:

1. EXECUTIVE SUMMARY: What's the real story here? What's the narrative that gets coverage and moves business metrics? (2-3 sentences that a CEO would understand)

2. STRATEGIC PILLARS: What are the 3-4 strategic approaches that will actually drive results?
For each pillar:
- Strategic rationale (why this matters)
- Tactical execution (specific actions)
- Media angle (how this gets coverage)
- Timeline and dependencies
- MCP assignment (Content Generator, Media Intelligence, Opportunity Engine, Analytics, Crisis Command)
- Success indicators

3. MEDIA STRATEGY: 
- Tier 1 targets and exclusive angles
- Tier 2 amplification strategy
- Content calendar and messaging
- Journalist relationship mapping

4. EXECUTION ROADMAP:
- Phase 1: Foundation (research, messaging, asset creation)
- Phase 2: Launch (media outreach, content distribution)
- Phase 3: Amplification (coverage follow-up, stakeholder engagement)
- Phase 4: Measurement (impact analysis, optimization)

5. RISK MITIGATION:
- What could go wrong and how to prevent it
- Crisis preparedness
- Competitive response planning

6. SUCCESS METRICS:
- Coverage quality over quantity
- Message penetration
- Stakeholder engagement
- Business impact

Think like you're presenting to a board that expects ROI. Be specific, actionable, and strategic.

Return as JSON with keys: executive_summary, strategic_pillars, media_strategy, execution_roadmap, risk_mitigation, success_metrics`

  try {
    // Use Claude via Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 5000,
        temperature: 0.8,
        system: `You are Niv, a Senior PR Strategist with 20 years of agency experience. You create strategic plans that actually work - not corporate fluff, but actionable strategies that get coverage and drive business results. Think strategically, write naturally, and focus on what actually matters in PR.`,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`)
    }

    const claudeResult = await response.json()
    const content = claudeResult.content[0].text
    
    // Parse Claude's response
    let strategicPlan
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      strategicPlan = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content)
    } catch (parseError) {
      // Strategic fallback with Niv's expertise
      strategicPlan = {
        executive_summary: `Based on my 20 years of PR experience, this objective requires a multi-faceted approach focusing on strategic positioning, targeted media relations, and measurable outcomes. The key is finding the narrative angle that resonates with both media and stakeholders while driving business impact.`,
        strategic_pillars: [
          {
            title: 'Narrative Foundation',
            description: 'Establish core messaging that journalists actually want to cover',
            rationale: 'Without a compelling story, even perfect execution fails',
            actions: ['Research unique angles competitors are missing', 'Develop data-driven story hooks', 'Create journalist-specific value propositions'],
            media_angle: 'Exclusive insights and industry analysis',
            timeline: '2-3 weeks',
            mcp: 'Content Generator + Analytics',
            success_indicators: ['Message testing scores', 'Journalist interest responses']
          },
          {
            title: 'Relationship Activation',
            description: 'Strategic media outreach with personalized approaches',
            rationale: 'Coverage comes from relationships, not spray-and-pray pitching',
            actions: ['Map journalist beats and interests', 'Craft tier-specific messaging', 'Execute embargo and exclusive strategies'],
            media_angle: 'Tier 1 exclusives, then strategic amplification',
            timeline: '4-6 weeks',
            mcp: 'Media Intelligence',
            success_indicators: ['Response rates', 'Coverage quality scores']
          }
        ],
        media_strategy: {
          tier_1_approach: 'Exclusive access and insights for top-tier journalists',
          tier_2_amplification: 'Broader story distribution with regional angles',
          content_calendar: 'Strategic content release aligned with news cycles',
          relationship_mapping: 'Journalist preference and beat analysis'
        },
        execution_roadmap: [
          { phase: 'Strategic Foundation', duration: '2 weeks', focus: 'Research, messaging, asset creation', deliverables: ['Messaging framework', 'Content assets', 'Media target list'] },
          { phase: 'Media Engagement', duration: '4 weeks', focus: 'Outreach execution and relationship building', deliverables: ['Coverage secured', 'Relationships strengthened', 'Message penetration'] },
          { phase: 'Amplification & Optimization', duration: '2 weeks', focus: 'Coverage amplification and strategy refinement', deliverables: ['Impact analysis', 'Strategy optimization', 'Next phase planning'] }
        ],
        success_metrics: [
          'Coverage quality score (tier weighting)',
          'Message penetration rate',
          'Stakeholder engagement metrics',
          'Share of voice vs competitors',
          'Business impact correlation'
        ],
        risk_mitigation: [
          { risk: 'News cycle disruption', strategy: 'Flexible timing with holding strategies and alternative angles ready' },
          { risk: 'Competitive counter-narratives', strategy: 'Proactive monitoring and rapid response capabilities' },
          { risk: 'Message dilution', strategy: 'Clear core narrative with consistent reinforcement across all touchpoints' }
        ]
      }
    }

    const planData = {
      ...strategicPlan,
      objective,
      context,
      constraints,
      timeline,
      created_at: new Date().toISOString(),
      status: 'draft',
      id: `plan-${Date.now()}`
    }

    // Store plan in Supabase (if you have a strategic_plans table)
    // await supabaseClient.from('strategic_plans').insert(planData)

    return new Response(
      JSON.stringify({ success: true, data: planData }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Generate plan error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to generate strategic plan' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function executeCampaign(req: Request, supabaseClient: any) {
  const { planId, pillarIndex, executionType } = await req.json()
  
  const executionPlan = {
    id: `exec-${Date.now()}`,
    planId,
    pillarIndex,
    executionType,
    status: 'pending',
    tasks: [
      {
        id: 'task-1',
        name: 'Content Creation',
        status: 'pending',
        assignee: 'Content Generator MCP'
      },
      {
        id: 'task-2', 
        name: 'Media Outreach',
        status: 'pending',
        assignee: 'Media Intelligence MCP'
      },
      {
        id: 'task-3',
        name: 'Performance Monitoring',
        status: 'pending',
        assignee: 'Analytics MCP'
      }
    ],
    created_at: new Date().toISOString()
  }

  return new Response(
    JSON.stringify({ success: true, data: executionPlan }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function gatherEvidence(req: Request, supabaseClient: any) {
  const { topic, sources = ['market', 'competitors', 'trends'] } = await req.json()
  
  if (!topic) {
    return new Response(
      JSON.stringify({ success: false, error: 'Topic is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Mock evidence gathering - in production would integrate with MCPs
  const evidence = {
    market_analysis: {
      size: '$50B market opportunity',
      growth_rate: '15% YoY',
      key_players: ['Company A', 'Company B', 'Company C']
    },
    competitor_insights: {
      strengths: ['Brand recognition', 'Distribution network'],
      weaknesses: ['Innovation gap', 'Customer service'],
      opportunities: ['Digital transformation', 'New markets']
    },
    trend_analysis: {
      emerging: ['AI integration', 'Sustainability focus'],
      declining: ['Traditional methods', 'Legacy systems'],
      stable: ['Core services', 'Customer base']
    },
    recommendations: [
      'Focus on digital transformation initiatives',
      'Leverage AI for competitive advantage',
      'Expand into emerging markets'
    ]
  }

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        topic,
        sources,
        evidence,
        gathered_at: new Date().toISOString()
      }
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function updatePlan(req: Request, supabaseClient: any) {
  const url = new URL(req.url)
  const planId = url.pathname.split('/').pop()
  const updates = await req.json()

  const updatedPlan = {
    id: planId,
    ...updates,
    updated_at: new Date().toISOString(),
    status: 'updated'
  }

  return new Response(
    JSON.stringify({ success: true, data: updatedPlan }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getPlanStatus(req: Request, supabaseClient: any) {
  const url = new URL(req.url)
  const planId = url.pathname.split('/').pop()

  // Mock status - would query database in production
  const status = {
    id: planId,
    status: 'in_progress',
    completion: 65,
    active_campaigns: 2,
    completed_tasks: 8,
    total_tasks: 12,
    last_activity: new Date().toISOString()
  }

  return new Response(
    JSON.stringify({ success: true, data: status }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}