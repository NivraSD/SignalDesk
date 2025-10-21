import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PatternSelectorRequest {
  campaignGoal: string
  researchData: any
  historicalInsights?: any
  orgId: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      campaignGoal,
      researchData,
      historicalInsights,
      orgId
    } = await req.json() as PatternSelectorRequest

    console.log('🎯 Pattern Selector:', {
      goal: campaignGoal.substring(0, 50),
      stakeholderCount: researchData?.stakeholders?.length || 0,
      hasHistoricalData: !!historicalInsights
    })

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '',
    })

    const systemPrompt = `You are an expert in VECTOR campaign pattern selection.

## Available Patterns

**CASCADE**
- Linear progression: Awareness → Consideration → Conversion → Advocacy
- Best for: New product launches, unknown brands entering established markets
- Pillar emphasis: Owned (Heavy), Relationships (Medium), Events (Medium), Media (Heavy)
- Timeline: 12+ weeks
- Risk: Lower (methodical, proven)

**MIRROR**
- Stakeholder segments targeted in parallel with tailored messaging
- Best for: Multi-stakeholder enterprise sales, complex buying committees
- Pillar emphasis: Owned (Heavy), Relationships (Heavy), Events (Medium), Media (Medium)
- Timeline: 8-12 weeks
- Risk: Medium (complex coordination)

**CHORUS**
- Multiple independent voices (media, influencers, customers) converge
- Best for: Crowded markets where credibility is key, competitive displacement
- Pillar emphasis: Owned (Medium), Relationships (Heavy), Events (Medium), Media (Heavy)
- Timeline: 10-14 weeks
- Risk: Medium (coordination complexity)

**TROJAN**
- Enter via adjacent use case, expand once inside
- Best for: Overcoming gatekeepers, displacing incumbents
- Pillar emphasis: Owned (Heavy), Relationships (Heavy), Events (Light), Media (Light)
- Timeline: 12-16 weeks
- Risk: Higher (requires patience, strong relationships)

**NETWORK**
- Create peer-to-peer advocacy network, viral spread
- Best for: Developer tools, bottom-up adoption, community-driven products
- Pillar emphasis: Owned (Medium), Relationships (Heavy), Events (Heavy), Media (Light)
- Timeline: 12-20 weeks (slow build, exponential growth)
- Risk: Higher (requires strong community foundation)

## Selection Criteria

1. **Market Position**: Unknown brand? → CASCADE. Known brand? → CHORUS/MIRROR
2. **Stakeholder Complexity**: Multiple buying committee members? → MIRROR
3. **Competitive Intensity**: Crowded market? → CHORUS (need multiple voices)
4. **Gatekeepers**: Strong incumbent resistance? → TROJAN
5. **Adoption Model**: Bottom-up/community? → NETWORK
6. **Timeline**: Urgent launch? → CASCADE/MIRROR (8-12 weeks). Patient growth? → TROJAN/NETWORK (12-20 weeks)
7. **Resources**: Limited budget? → NETWORK/TROJAN (relationship heavy). Strong media budget? → CASCADE/CHORUS

Output ONLY valid JSON:
{
  "selectedPattern": {
    "pattern": "CHORUS",
    "rationale": "Why this pattern fits the campaign goal and context",
    "confidence": "High|Medium|Low",
    "pillarEmphasis": {
      "pillar1_owned": "Heavy|Medium|Light",
      "pillar2_relationships": "Heavy|Medium|Light",
      "pillar3_events": "Heavy|Medium|Light",
      "pillar4_media": "Heavy|Medium|Light"
    },
    "estimatedTimeline": "10-14 weeks",
    "keySuccessFactors": ["Factor 1", "Factor 2", "Factor 3"],
    "potentialRisks": ["Risk 1", "Risk 2"]
  },
  "alternativePattern": {
    "pattern": "MIRROR",
    "rationale": "Why this could also work",
    "whenToConsider": "If X condition changes"
  }
}`

    const userPrompt = `# Campaign Goal
${campaignGoal}

# Stakeholder Context
${JSON.stringify(researchData?.stakeholders?.map((s: any) => ({
  name: s.name,
  role: s.role,
  decisionPower: s.decisionPower,
  psychology: s.psychology
})) || [], null, 2)}

# Market Context
- Competitor Count: ${researchData?.competitiveLandscape?.competitors?.length || 'Unknown'}
- Market Maturity: ${researchData?.competitiveLandscape?.marketMaturity || 'Unknown'}
- Brand Recognition: ${researchData?.brandPosition || 'Unknown'}

# Historical Insights
${historicalInsights ? JSON.stringify(historicalInsights, null, 2) : 'No historical data available'}

## Your Task

Analyze the campaign goal, stakeholder complexity, market position, and context.

Select the optimal VECTOR pattern using the decision criteria above.

Consider:
1. How many stakeholders need simultaneous targeting? (MIRROR if multiple)
2. Is this a new/unknown brand? (CASCADE if yes)
3. Is credibility the main challenge? (CHORUS if yes)
4. Are there strong gatekeepers blocking access? (TROJAN if yes)
5. Is bottom-up adoption the model? (NETWORK if yes)

Provide clear rationale and an alternative pattern.

Output valid JSON.`

    const startTime = Date.now()

    // Retry logic for JSON parsing issues
    let patternSelection
    let attempts = 0
    const maxAttempts = 3

    while (attempts < maxAttempts) {
      attempts++
      try {
        console.log(`Attempt ${attempts}/${maxAttempts} to select pattern...`)

        const message = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1500,
          temperature: 0.5, // Lower temperature for more consistent selection
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

        patternSelection = JSON.parse(jsonText)

        // Validate structure
        if (!patternSelection.selectedPattern?.pattern) {
          throw new Error('Missing required pattern selection')
        }

        // Success!
        console.log(`✅ Valid pattern selected on attempt ${attempts}`)
        break

      } catch (error) {
        console.warn(`Attempt ${attempts} failed: ${error.message}`)
        if (attempts >= maxAttempts) {
          console.error('All attempts failed. Last error:', error.message)
          throw new Error(`Failed to select pattern after ${maxAttempts} attempts: ${error.message}`)
        }
        // Wait briefly before retry
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    const elapsedTime = Date.now() - startTime
    console.log(`✅ Pattern selected: ${patternSelection.selectedPattern.pattern} in ${elapsedTime}ms (${attempts} attempts)`)

    return new Response(
      JSON.stringify(patternSelection),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Pattern selector error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
