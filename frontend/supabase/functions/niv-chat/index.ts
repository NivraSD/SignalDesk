// Niv PR Strategist Chat Edge Function for Supabase
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Niv's personality and expertise
const NIV_SYSTEM_PROMPT = `You are Niv, SignalDesk's AI PR Strategist. You are an expert in PR strategy with deep knowledge of:
- Narrative Vacuum Score (NVS) methodology for identifying PR opportunities
- Media relations and journalist engagement
- Crisis communication and reputation management
- Content strategy and messaging frameworks
- Competitive intelligence and market positioning

Your personality:
- Direct and strategic in your advice
- Data-driven but understand the art of storytelling
- Proactive in identifying opportunities
- Always thinking about the media angle
- Focused on measurable PR outcomes

When analyzing situations, you use the NVS framework which considers:
1. Media Demand - How much media attention exists for this topic
2. Competitor Absence - Gaps in competitor messaging
3. Client Strength - Your ability to own the narrative
4. Time Decay - Urgency and timing factors
5. Market Saturation - How crowded the narrative space is

Provide actionable, strategic advice that helps PR professionals win.`

// Strategic Planning handler
async function handleStrategicPlanning(req: Request) {
  const { url, method } = req
  const urlPath = new URL(url).pathname
  
  if (method === 'POST' && (urlPath.includes('/generate-plan') || urlPath.includes('/strategic-planning'))) {
    const { objective, context, constraints, timeline } = await req.json()
    
    if (!objective) {
      return new Response(
        JSON.stringify({ success: false, error: 'Objective is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not configured')
    }

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
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
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
      
      let strategicPlan
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        strategicPlan = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content)
      } catch (parseError) {
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
            { phase: 'Execution', duration: '8 weeks', tasks: ['Implementation', 'Monitoring'] }
          ],
          success_metrics: ['Media mentions', 'Engagement rate', 'Share of voice'],
          risk_mitigation: [
            { risk: 'Timeline delays', strategy: 'Buffer time and parallel execution' },
            { risk: 'Resource constraints', strategy: 'Prioritization and alternatives' }
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

      return new Response(
        JSON.stringify({ success: true, data: planData }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (error) {
      console.error('Strategic planning error:', error)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to generate strategic plan' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  }

  // Handle other strategic planning endpoints with mock responses
  if (method === 'POST' && urlPath.includes('/gather-evidence')) {
    const { topic } = await req.json()
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          topic,
          evidence: {
            market_analysis: 'Growing market with 15% YoY growth',
            competitor_insights: 'Key gaps in competitor messaging',
            trend_analysis: 'AI and automation trends accelerating'
          },
          gathered_at: new Date().toISOString()
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  if (method === 'POST' && urlPath.includes('/execute-campaign')) {
    const { planId } = await req.json()
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: `exec-${Date.now()}`,
          planId,
          status: 'pending',
          tasks: [
            { id: 'task-1', name: 'Content Creation', status: 'pending', assignee: 'Content Generator' },
            { id: 'task-2', name: 'Media Outreach', status: 'pending', assignee: 'Media Intelligence' }
          ]
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ error: 'Not Found' }),
    { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = req
    const urlPath = new URL(url).pathname

    // Handle Strategic Planning endpoints
    if (urlPath.includes('/strategic-planning')) {
      return await handleStrategicPlanning(req)
    }

    // Handle regular Niv chat
    const { message, conversationId, mode = 'chat', context = {} } = await req.json()

    if (!message) {
      throw new Error('Message is required')
    }

    // Get Anthropic API key from environment
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not configured')
    }

    // Build the prompt based on mode
    let systemPrompt = NIV_SYSTEM_PROMPT
    let userPrompt = message

    if (mode === 'analysis') {
      systemPrompt += `\n\nYou are currently in ANALYSIS MODE. Provide detailed strategic analysis using the NVS framework. Structure your response with clear sections and scores.`
    } else if (mode === 'opportunity') {
      systemPrompt += `\n\nYou are currently in OPPORTUNITY IDENTIFICATION MODE. Focus on finding and scoring PR opportunities. Be specific about timing, angles, and execution strategies.`
    } else if (mode === 'campaign') {
      systemPrompt += `\n\nYou are currently in CAMPAIGN PLANNING MODE. Help design comprehensive PR campaigns with timelines, tactics, and success metrics.`
    }

    // Add context if provided
    if (context && Object.keys(context).length > 0) {
      userPrompt = `Context: ${JSON.stringify(context)}\n\nUser Question: ${message}`
    }

    // Call Anthropic Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229', // Using Sonnet for better strategic thinking
        max_tokens: 2000,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Claude API error: ${error}`)
    }

    const data = await response.json()
    
    // Extract the response text
    const responseText = data.content?.[0]?.text || ''

    // Parse NVS scores if present in response
    let nvsAnalysis = null
    if (mode === 'analysis' || mode === 'opportunity') {
      // Try to extract NVS scores from the response
      const scorePattern = /(?:Media Demand|Competitor Absence|Client Strength|Time Decay|Market Saturation):\s*(\d+)/gi
      const matches = responseText.matchAll(scorePattern)
      const scores = {}
      
      for (const match of matches) {
        const metric = match[0].split(':')[0].trim()
        const score = parseInt(match[1])
        scores[metric.toLowerCase().replace(' ', '_')] = score
      }
      
      if (Object.keys(scores).length > 0) {
        nvsAnalysis = {
          scores,
          overall: Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length)
        }
      }
    }

    // Store conversation in Supabase if conversationId provided
    if (conversationId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      
      // This would store conversation history - implement based on your needs
      console.log('Storing conversation:', conversationId)
    }

    return new Response(
      JSON.stringify({
        response: responseText,
        nvsAnalysis,
        mode,
        conversationId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in niv-chat function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})