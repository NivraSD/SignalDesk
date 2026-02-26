import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ScenarioPlannerRequest {
  enrichedData: any
  patternSelection: any
  campaignGoal: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      enrichedData,
      patternSelection,
      campaignGoal
    } = await req.json() as ScenarioPlannerRequest

    console.log('🎲 MCP Scenario Planner:', {
      pattern: patternSelection?.selectedPattern?.pattern,
      goal: campaignGoal.substring(0, 50)
    })

    const startTime = Date.now()

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '',
    })

    // Retry logic for JSON parsing issues
    let scenarioPlanning
    let attempts = 0
    const maxAttempts = 3

    while (attempts < maxAttempts) {
      attempts++
      try {
        console.log(`🔄 Attempt ${attempts}/${maxAttempts} to generate scenario planning...`)

    const systemPrompt = `You are a crisis scenario planner. Generate tactical response actions only.

## Your Task
Generate Part 4 (Scenario Planning) - 3-5 crisis scenarios with immediate responses.

## Key Principles
- NO strategy explanation (positioning doc has that)
- Focus on: trigger signals + immediate actions (0-24h)
- Keep it tactical: WHO does WHAT, WHEN

## Scenario Categories
1. competitive_attack - FUD campaigns, pricing wars
2. technical_failure - Outages, security breaches
3. stakeholder_defection - Key influencer switches, negative reviews`

    const pattern = patternSelection?.selectedPattern?.pattern || 'CHORUS'
    const riskFactors = patternSelection?.riskFactors || []
    const positioning = enrichedData?.positioning || {}
    const narrativeLandscape = enrichedData?.researchData?.narrativeLandscape || {}
    const competitors = narrativeLandscape?.competitors || []

    const userPrompt = `# Campaign Goal
${campaignGoal}

# SELECTED PATTERN: ${pattern}
**Pattern Risk Factors:**
${riskFactors.map((r: string) => `- ${r}`).join('\n')}

# POSITIONING (To Defend)
**${positioning?.name || 'Not specified'}**
**Key Messages:**
${(positioning?.keyMessages || []).map((m: string) => `- ${m}`).join('\n')}

**Differentiators:**
${(positioning?.differentiators || []).map((d: string) => `- ${d}`).join('\n')}

# COMPETITIVE LANDSCAPE
${competitors.map((c: any) => `
**${c.name || 'Competitor'}**
- Positioning: ${c.positioning || 'Unknown'}
- Strengths: ${(c.strengths || []).join(', ')}
- Weaknesses: ${(c.weaknesses || []).join(', ')}
`).join('\n')}

# NARRATIVE LANDSCAPE
${JSON.stringify(narrativeLandscape, null, 2)}

## Instructions

Generate 3 threat scenarios. Use this EXACT structure:

{
  "scenarios": [
    {
      "threat": "Brief threat title",
      "category": "competitive_attack",
      "triggerSignals": ["Signal 1", "Signal 2"],
      "severity": "high",
      "immediateActions": [
        {"action": "What to do", "owner": "Who", "timing": "When"}
      ]
    }
  ]
}

Categories: competitive_attack, technical_failure, stakeholder_defection

Generate 3 scenarios ONLY. Use the EXACT JSON structure above.

**CRITICAL: Your response must be ONLY valid JSON. No markdown, no explanations, just pure JSON.**
- Use double quotes for all strings
- Escape any quotes inside strings with backslash
- No trailing commas
- No comments
- Ensure all braces and brackets are properly closed`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000, // Reduced - simpler tactical structure
      temperature: 0.7,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    let jsonText = content.text.trim()

    // Remove markdown code blocks
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json\n?|\n?```/g, '').trim()
    }

    // Try to find JSON in response
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonText = jsonMatch[0]
    }

    // Fix common JSON issues
    jsonText = jsonText
      .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
      .replace(/'/g, '"') // Replace single quotes

    // Check if JSON is truncated
    const openBraces = (jsonText.match(/\{/g) || []).length
    const closeBraces = (jsonText.match(/\}/g) || []).length
    const openBrackets = (jsonText.match(/\[/g) || []).length
    const closeBrackets = (jsonText.match(/\]/g) || []).length

    if (openBraces !== closeBraces) {
      throw new Error(`JSON truncated: mismatched braces (${openBraces} vs ${closeBraces})`)
    }

    if (openBrackets !== closeBrackets) {
      throw new Error(`JSON truncated: mismatched brackets (${openBrackets} vs ${closeBrackets})`)
    }

        try {
          scenarioPlanning = JSON.parse(jsonText)
        } catch (parseError) {
          console.error('JSON parse error:', parseError.message)
          console.error('JSON text (first 500 chars):', jsonText.substring(0, 500))
          console.error('JSON text (last 500 chars):', jsonText.substring(jsonText.length - 500))
          throw new Error(`Failed to parse scenario planning: ${parseError.message}`)
        }

        // Validate structure
        if (!scenarioPlanning.scenarios || scenarioPlanning.scenarios.length === 0) {
          throw new Error('No scenarios generated')
        }

        // Success!
        console.log(`✅ Valid scenario planning generated on attempt ${attempts}`)
        break

      } catch (error) {
        console.warn(`⚠️ Attempt ${attempts} failed: ${error.message}`)
        if (attempts >= maxAttempts) {
          console.error('❌ All attempts failed. Last error:', error.message)
          throw new Error(`Failed to generate scenario planning after ${maxAttempts} attempts: ${error.message}`)
        }
        // Wait briefly before retry
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    const elapsedTime = Date.now() - startTime
    console.log(`✅ Scenario planning generated: ${scenarioPlanning.scenarios?.length || 0} scenarios (${elapsedTime}ms, ${attempts} attempts)`)

    return new Response(
      JSON.stringify(scenarioPlanning),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Scenario planner error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Failed to generate scenario planning'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
