import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { extractedData } = await req.json()

    console.log('🎯 Generating Part 1: Goal Framework')

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '',
    })

    const systemPrompt = `You are an expert in campaign strategy and goal setting.

Generate Part 1: Campaign Goal & Success Framework.

This includes:
- Primary objective (measurable)
- Behavioral goals for each stakeholder
- KPIs and success criteria
- Risk assessment

Output ONLY valid JSON.`

    const userPrompt = `# Campaign Goal
${extractedData.forGoal.campaignGoal}

# Suggested KPIs
${extractedData.forGoal.kpiSuggestions.join('\n')}

Generate Part 1 using this structure:

\`\`\`json
{
  "part1_goalFramework": {
    "primaryObjective": "Measurable objective from campaign goal",
    "behavioralGoals": [
      {
        "stakeholder": "Stakeholder name",
        "desiredBehavior": "What they should do",
        "currentState": "Where they are now",
        "successMetric": "How to measure"
      }
    ],
    "kpis": ["kpi1", "kpi2", "kpi3", "kpi4", "kpi5"],
    "successCriteria": "What complete success looks like",
    "riskAssessment": [
      {
        "risk": "Potential risk",
        "probability": "High/Medium/Low",
        "impact": "If it occurs",
        "mitigation": "How to prevent/handle"
      }
    ]
  }
}
\`\`\`

Generate complete Part 1.`

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    let part1
    try {
      let jsonText = content.text.trim()
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```json\n?|\n?```/g, '')
      }
      part1 = JSON.parse(jsonText)
    } catch (e) {
      console.error('JSON parse error:', e)
      throw new Error('Failed to parse Part 1')
    }

    console.log('✅ Part 1 generated successfully')

    return new Response(
      JSON.stringify(part1),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Part 1 generation error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
