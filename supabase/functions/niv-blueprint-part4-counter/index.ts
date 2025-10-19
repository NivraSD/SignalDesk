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

    console.log('🛡️ Generating Part 4: Counter-Narrative Strategy')

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '',
    })

    const systemPrompt = `You are an expert in crisis management and defensive PR strategy.

Generate Part 4: Counter-Narrative Strategy for potential threats.

This includes:
- Threat scenarios with early warning signs
- Response playbooks across 4 pillars
- SLA and activation protocols

Keep responses HIGH-LEVEL, not detailed content.

Output ONLY valid JSON.`

    const userPrompt = `# Identified Threats
${JSON.stringify(extractedData.forCounterNarrative.threats, null, 2)}

# Competitors to Monitor
${extractedData.forCounterNarrative.competitors.join(', ')}

Generate Part 4 using this structure:

\`\`\`json
{
  "part4_counterNarrative": {
    "threatScenarios": [
      {
        "threat": "Threat description",
        "earlyWarning": "How to detect it early",
        "responseSLA": "Response timeline",
        "responsePlaybook": {
          "pillar1Owned": {
            "contentType": "response-type",
            "topic": "What to address",
            "keyMessages": ["message1"]
          },
          "pillar2Relationships": {
            "activation": "Who to activate",
            "contentType": "support-content"
          },
          "pillar4Media": {
            "action": "Proactive or reactive",
            "contentType": "media-response"
          }
        }
      }
    ]
  }
}
\`\`\`

Generate 2-3 threat scenarios with playbooks.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    let part4
    try {
      let jsonText = content.text.trim()
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```json\n?|\n?```/g, '')
      }
      part4 = JSON.parse(jsonText)
    } catch (e) {
      console.error('JSON parse error:', e)
      throw new Error('Failed to parse Part 4')
    }

    console.log('✅ Part 4 generated successfully')

    return new Response(
      JSON.stringify(part4),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Part 4 generation error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
