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

    console.log('👥 Generating Part 2: Stakeholder Mapping')

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '',
    })

    const systemPrompt = `You are an expert in stakeholder psychology and behavioral analysis.

Generate Part 2: Stakeholder Mapping with deep psychological profiles.

This includes:
- Stakeholder groups with psychology
- Information diet and decision triggers
- Current → target perceptions
- Stakeholder relationships and priority order

Output ONLY valid JSON.`

    const userPrompt = `# Stakeholders from Research
${JSON.stringify(extractedData.forStakeholders.stakeholders, null, 2)}

Generate Part 2 using this structure:

\`\`\`json
{
  "part2_stakeholderMapping": {
    "groups": [
      {
        "name": "Stakeholder name",
        "size": "Size estimate",
        "psychologicalProfile": {
          "values": ["value1", "value2"],
          "fears": ["fear1", "fear2"],
          "aspirations": ["aspiration1"],
          "decisionDrivers": ["driver1", "driver2"]
        },
        "informationDiet": {
          "primarySources": ["source1", "source2"],
          "trustedVoices": ["voice1"],
          "consumptionHabits": "How they consume info"
        },
        "decisionTriggers": ["trigger1", "trigger2"],
        "currentPerception": "Current view of org",
        "targetPerception": "Target view",
        "barriers": ["barrier1"]
      }
    ],
    "stakeholderRelationships": "How groups influence each other",
    "priorityOrder": ["group1", "group2", "group3"]
  }
}
\`\`\`

Generate complete Part 2 with all stakeholder groups.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    let part2
    try {
      let jsonText = content.text.trim()
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```json\n?|\n?```/g, '')
      }
      part2 = JSON.parse(jsonText)
    } catch (e) {
      console.error('JSON parse error:', e)
      throw new Error('Failed to parse Part 2')
    }

    console.log('✅ Part 2 generated successfully')

    return new Response(
      JSON.stringify(part2),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Part 2 generation error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
