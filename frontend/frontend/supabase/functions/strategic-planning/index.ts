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

  // Call Claude API for strategic planning
  const prompt = `As Niv, SignalDesk's expert PR Strategist, create a comprehensive strategic plan:

OBJECTIVE: ${objective}

${context ? `CONTEXT: ${context}` : ''}
${constraints ? `CONSTRAINTS: ${constraints}` : ''}
${timeline ? `TIMELINE: ${timeline}` : ''}

Create a structured strategic plan with these sections:
1. Executive Summary (2-3 sentences)
2. Strategic Pillars (3-4 key focus areas with specific actions and MCP assignments)
3. Evidence & Research Needs (specific data/insights required)
4. Implementation Phases (clear milestones with timelines)
5. Success Metrics (measurable PR KPIs)
6. Risk Mitigation (top 3 risks and strategies)

For each strategic pillar, specify:
- Title and description
- Specific actions to take
- Timeline for completion
- Which MCP (SignalDesk service) will execute it
- Expected outcomes

Available MCPs: Content Generator, Media Intelligence, Crisis Command, Analytics, Opportunity Engine

Return as JSON with keys: executive_summary, strategic_pillars, evidence_needs, implementation_phases, success_metrics, risk_mitigation`

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
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
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
      // Fallback structure
      strategicPlan = {
        executive_summary: content.substring(0, 200) + '...',
        strategic_pillars: [
          {
            title: 'Strategic Execution',
            description: 'Execute the strategic plan objectives',
            actions: ['Define action items', 'Assign responsibilities', 'Set timelines'],
            timeline: '30 days',
            mcp: 'Content Generator'
          }
        ],
        evidence_needs: ['Market analysis', 'Competitor research', 'Media landscape'],
        implementation_phases: [
          { phase: 'Planning', duration: '2 weeks', tasks: ['Research', 'Strategy formation'] },
          { phase: 'Execution', duration: '8 weeks', tasks: ['Implementation', 'Monitoring'] },
          { phase: 'Evaluation', duration: '2 weeks', tasks: ['Analysis', 'Optimization'] }
        ],
        success_metrics: ['Media mentions', 'Engagement rate', 'Share of voice'],
        risk_mitigation: [
          { risk: 'Timeline delays', strategy: 'Buffer time and parallel execution' },
          { risk: 'Resource constraints', strategy: 'Prioritization and alternative solutions' },
          { risk: 'Stakeholder alignment', strategy: 'Regular communication and feedback' }
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