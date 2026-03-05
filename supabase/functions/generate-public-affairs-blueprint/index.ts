import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      report_id,
      organization_id,
      organization_name,
      industry,
      trigger_event,
      research_data
    } = await req.json()

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
    if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not configured')

    const prompt = `You are advising ${organization_name} (${industry}) on their response to the following situation.

TRIGGERING EVENT:
${trigger_event.title}
${trigger_event.content}

SITUATION ASSESSMENT:
${JSON.stringify(research_data.situation_assessment, null, 2)}

STAKEHOLDER MAP:
${JSON.stringify(research_data.stakeholder_map, null, 2)}

IMPACT ANALYSIS:
${JSON.stringify(research_data.impact_analysis, null, 2)}

SOURCES & CONFIDENCE:
${JSON.stringify(research_data.sources_confidence, null, 2)}

Based on the above intelligence, produce the following in JSON format:

{
  "executive_summary": "3-5 paragraphs. What happened, why it matters for ${organization_name} specifically, and what they need to do. This is what the CEO reads. Every sentence counts. No hedging.",

  "scenario_tree": {
    "scenarios": [
      {
        "type": "base_case",
        "name": "Base Case",
        "probability": "~60%",
        "narrative": "What happens and in what sequence",
        "key_driver": "What makes this scenario happen",
        "indicators": ["Observable signals this is materializing"],
        "client_impact": "Specific implications for ${organization_name}",
        "decision_point": "When/where ${organization_name} would need to act"
      },
      {
        "type": "upside",
        "name": "Upside Scenario",
        "probability": "~20%",
        "narrative": "What would have to happen for favorable resolution",
        "key_driver": "...",
        "indicators": ["..."],
        "client_impact": "...",
        "decision_point": "..."
      },
      {
        "type": "downside",
        "name": "Downside Scenario",
        "probability": "~15%",
        "narrative": "Escalation path and what triggers it",
        "key_driver": "...",
        "indicators": ["..."],
        "client_impact": "...",
        "decision_point": "..."
      },
      {
        "type": "black_swan",
        "name": "Black Swan",
        "probability": "~5%",
        "narrative": "Low probability, high impact scenario most analysts would miss",
        "key_driver": "...",
        "indicators": ["..."],
        "client_impact": "...",
        "decision_point": "..."
      }
    ],
    "decision_points": "Key moments where trajectory could shift"
  },

  "recommendations": {
    "immediate": ["Specific actions for this week. Not vague guidance. 'Do X because Y' format."],
    "short_term": ["30-day positioning moves. Relationship management. Communication adjustments."],
    "medium_term": ["90-day strategic adjustments. Portfolio/exposure changes. New capabilities."],
    "decision_matrix": [
      {
        "condition": "If [specific indicator] crosses [threshold]",
        "action": "Then [specific action]"
      }
    ]
  },

  "monitoring_framework": {
    "indicators": [
      {
        "name": "Indicator name",
        "measures": "What it measures",
        "source": "Where to find it",
        "threshold": "What level triggers action",
        "action": "What to do when triggered"
      }
    ]
  }
}

CRITICAL: Scenarios must be genuinely distinct, not variations of the same outcome. The black swan should be something most analysts would miss. Probability estimates should sum to approximately 100%. Recommendations must be direct - 'Consider' and 'might want to' are NOT recommendations.

Return ONLY valid JSON. No markdown fencing.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Anthropic API error: ${response.status} ${errText}`)
    }

    const result = await response.json()
    const content = result.content?.[0]?.text || ''

    let blueprintData
    try {
      blueprintData = JSON.parse(content)
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        blueprintData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Failed to parse blueprint output as JSON')
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        blueprint_data: blueprintData,
        report_id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error in generate-public-affairs-blueprint:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
