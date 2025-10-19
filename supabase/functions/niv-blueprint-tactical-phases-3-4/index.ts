import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TacticalPhasesRequest {
  influenceStrategies: any
  patternGuidance: any
  researchData: any
  campaignGoal: string
  orgId: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      influenceStrategies,
      patternGuidance,
      researchData,
      campaignGoal,
      orgId
    } = await req.json() as TacticalPhasesRequest

    console.log('🎯 Tactical Phases 3-4:', {
      stakeholderCount: influenceStrategies?.influenceStrategies?.length || 0,
      pattern: patternGuidance?.selectedPattern?.pattern,
      goal: campaignGoal.substring(0, 50)
    })

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '',
    })

    const systemPrompt = `You are an expert in Four-Pillar campaign orchestration for VECTOR campaigns.

## Your Task
Generate Phase 3 (Conversion) and Phase 4 (Advocacy) with all 4 pillars.

## Key Principles
- Generate STRUCTURED REQUESTS for content, not content itself
- Include psychological context for niv-content-intelligent-v2
- Use real data (journalists) when available
- Create 2-3 high-impact tactics per pillar (not 10)
- Show pillar convergence
- Phase 3: Activate decision triggers, remove friction
- Phase 4: Turn customers into advocates

Output ONLY valid JSON:
{
  "phase3_conversion": {
    "objective": "Phase goal",
    "duration": "Weeks 7-9",
    "stakeholderFocus": ["Primary stakeholders"],
    "messageTheme": "Core narrative",
    "pillar1_ownedActions": { /* structure */ },
    "pillar2_relationshipOrchestration": { /* structure */ },
    "pillar3_eventOrchestration": { /* structure */ },
    "pillar4_mediaEngagement": { /* structure */ },
    "convergenceStrategy": "How pillars amplify",
    "targetSystemState": "What stakeholders experience"
  },
  "phase4_advocacy": { /* same structure */ }
}`

    const userPrompt = `# Campaign Goal
${campaignGoal}

# INFLUENCE STRATEGIES:
${JSON.stringify(influenceStrategies, null, 2)}

# PATTERN GUIDANCE:
${patternGuidance?.selectedPattern?.pattern || 'CHORUS'} - ${patternGuidance?.selectedPattern?.pillarEmphasis?.pillar4_media || 'Heavy on media'}

# REAL JOURNALISTS:
${JSON.stringify(researchData?.channelIntelligence?.journalists?.slice(0, 10) || [], null, 2)}

## Instructions

Generate Phase 3 (Conversion, Weeks 7-9) and Phase 4 (Advocacy, Weeks 10-12).

For EACH phase, create all 4 pillars:

**Pillar 1: Owned Actions**
- 2-3 content pieces with full structure:
  - contentType, targetStakeholder, psychologicalLever
  - positioningMessage (from influence strategies)
  - messageFraming, requiredElements (toneOfVoice, keyPoints, proofPoints, callToAction)
  - timing, distributionChannels, successMetric

**Phase 3 Focus:** Remove friction, provide decision support, activate triggers
**Phase 4 Focus:** Success stories, advocacy enablement, reference programs

**Pillar 2: Relationship Orchestration**
- Phase 3: Turn influencers into advocates for your solution
- Phase 4: Enable them to become reference advocates
- 1-2 tier1Influencers per phase

**Pillar 3: Event Orchestration**
- Phase 3: Customer showcase opportunities
- Phase 4: Speaking opportunities, customer advisory boards
- 1-2 events per phase

**Pillar 4: Media Engagement**
- Phase 3: Success story pitches, customer announcements
- Phase 4: Industry leadership positioning, trend analysis
- Use REAL journalist names from list above
- 1-2 storiesToPitch per phase

Include convergenceStrategy showing how pillars work together.

Use touchpointStrategy from influence strategies (phase3_conversion, phase4_advocacy).

Output valid JSON for both phases.`

    const startTime = Date.now()

    // Retry logic for JSON parsing issues
    let phases
    let attempts = 0
    const maxAttempts = 2 // Reduced from 3 to avoid timeout

    while (attempts < maxAttempts) {
      attempts++
      try {
        console.log(`Attempt ${attempts}/${maxAttempts} to generate phases 3-4...`)

        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 3000, // Reduced from 4000 to improve speed
          temperature: 0.7,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }]
        })

        // Parse and validate
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
          .replace(/'/g, '"') // Replace single quotes with double quotes

        phases = JSON.parse(jsonText)

        // Validate structure
        if (!phases.phase3_conversion || !phases.phase4_advocacy) {
          throw new Error('Missing required phases in response')
        }

        // Success!
        console.log(`✅ Valid JSON generated on attempt ${attempts}`)
        break

      } catch (error) {
        console.warn(`Attempt ${attempts} failed: ${error.message}`)
        if (attempts >= maxAttempts) {
          console.error('All attempts failed. Last error:', error.message)
          throw new Error(`Failed to parse phases 3-4 after ${maxAttempts} attempts: ${error.message}`)
        }
        // Wait briefly before retry
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    const elapsedTime = Date.now() - startTime
    console.log(`✅ Phases 3-4 complete in ${elapsedTime}ms (${attempts} attempts)`)

    return new Response(
      JSON.stringify({ orchestrationStrategy: phases }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Phases 3-4 error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
