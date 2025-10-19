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

    console.log('⚙️ Generating Part 5: Execution Requirements')

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '',
    })

    const systemPrompt = `You are an expert in campaign operations and resource planning.

Generate Part 5: Execution Requirements covering team, budget, and adaptation.

This includes:
- Team bandwidth requirements
- Budget considerations
- Leading indicators and checkpoints
- Pivot scenarios

Output ONLY valid JSON.`

    const userPrompt = `# Resource Estimates
Team Size: ${extractedData.forExecution.estimatedTeamSize}
Budget: ${extractedData.forExecution.estimatedBudget}
Time: ${extractedData.forExecution.timeCommitment}

Generate Part 5 using this structure:

\`\`\`json
{
  "part5_executionRequirements": {
    "teamBandwidth": {
      "minimumViable": {
        "roles": [
          "Role: Description (X hrs/week)"
        ],
        "totalCommitment": "Total hours/week"
      },
      "optimal": {
        "roles": [
          "Role: Description (X hrs/week)"
        ],
        "totalCommitment": "Total hours/week"
      }
    },
    "budgetConsiderations": {
      "coreCampaign": {
        "description": "What's included",
        "estimatedCost": "$X-Y"
      },
      "optionalPaidAmplification": {
        "useCases": ["Use case 1"],
        "estimatedBudget": "$X-Y"
      },
      "eventCosts": {
        "tier1Events": "$X-Y",
        "virtualEvents": "$X-Y"
      }
    },
    "adaptationStrategy": {
      "leadingIndicators": [
        {
          "checkpoint": "Week X",
          "metric": "What to measure",
          "target": "Target value",
          "ifMiss": "Action if below target"
        }
      ],
      "pivotScenarios": [
        {
          "trigger": "Condition",
          "action": "What to do"
        }
      ]
    }
  }
}
\`\`\`

Generate complete Part 5.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    let part5
    try {
      let jsonText = content.text.trim()
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```json\n?|\n?```/g, '')
      }
      part5 = JSON.parse(jsonText)
    } catch (e) {
      console.error('JSON parse error:', e)
      throw new Error('Failed to parse Part 5')
    }

    console.log('✅ Part 5 generated successfully')

    return new Response(
      JSON.stringify(part5),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Part 5 generation error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
