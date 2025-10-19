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

    console.log('🎯 Tactical Phases 1-2:', {
      stakeholderCount: influenceStrategies?.influenceStrategies?.length || 0,
      pattern: patternGuidance?.selectedPattern?.pattern,
      goal: campaignGoal.substring(0, 50)
    })

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '',
    })

    const systemPrompt = `You are an expert in Four-Pillar campaign orchestration for VECTOR campaigns.

## Your Task
Generate Phase 1 (Awareness) and Phase 2 (Consideration) with all 4 pillars.

## Key Principles
- Generate STRUCTURED REQUESTS for content, not content itself
- Include psychological context for niv-content-intelligent-v2
- Use real data (journalists) when available
- Create 2-3 high-impact tactics per pillar (not 10)
- Show pillar convergence

Output ONLY valid JSON:
{
  "phase1_awareness": {
    "objective": "Phase goal",
    "duration": "Weeks 1-3",
    "stakeholderFocus": ["Primary stakeholders"],
    "messageTheme": "Core narrative",
    "pillar1_ownedActions": { /* structure */ },
    "pillar2_relationshipOrchestration": { /* structure */ },
    "pillar3_eventOrchestration": { /* structure */ },
    "pillar4_mediaEngagement": { /* structure */ },
    "convergenceStrategy": "How pillars amplify",
    "targetSystemState": "What stakeholders experience"
  },
  "phase2_consideration": { /* same structure */ }
}`

    const userPrompt = `# Campaign Goal
${campaignGoal}

# INFLUENCE STRATEGIES:
${JSON.stringify(influenceStrategies, null, 2)}

# PATTERN GUIDANCE:
${patternGuidance?.selectedPattern?.pattern || 'CHORUS'} - ${patternGuidance?.selectedPattern?.pillarEmphasis?.pillar2_relationships || 'Heavy on relationships'}

# REAL JOURNALISTS:
${JSON.stringify(researchData?.channelIntelligence?.journalists?.slice(0, 10) || [], null, 2)}

## Instructions

Generate Phase 1 (Awareness, Weeks 1-3) and Phase 2 (Consideration, Weeks 4-6).

For EACH phase, create all 4 pillars:

**Pillar 1: Owned Actions**
- 2-3 content pieces with full structure:
  - contentType, targetStakeholder, psychologicalLever
  - positioningMessage (from influence strategies)
  - messageFraming, requiredElements (toneOfVoice, keyPoints, proofPoints, callToAction)
  - timing, distributionChannels, successMetric

**Pillar 2: Relationship Orchestration**
- 2 tier1Influencers with:
  - stakeholderSegment, discoveryCriteria
  - engagementStrategy with contentToCreateForThem (1-2 pieces)
  - touchpointCadence, successMetric

**Pillar 3: Event Orchestration**
- 1-2 tier1Events with presenceStrategy and contentSignaldeskGenerates

**Pillar 4: Media Engagement**
- Use REAL journalist names from list above
- 1-2 storiesToPitch per phase with contentSignaldeskGenerates

Include convergenceStrategy showing how pillars work together.

Use touchpointStrategy from influence strategies for phase objectives and channels.

Output valid JSON for both phases.`

    const startTime = Date.now()

    // Retry logic for JSON parsing issues
    let phases
    let attempts = 0
    const maxAttempts = 2 // Reduced from 3 to avoid timeout

    while (attempts < maxAttempts) {
      attempts++
      try {
        console.log(`Attempt ${attempts}/${maxAttempts} to generate phases 1-2...`)

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
        if (!phases.phase1_awareness || !phases.phase2_consideration) {
          throw new Error('Missing required phases in response')
        }

        // Success!
        console.log(`✅ Valid JSON generated on attempt ${attempts}`)
        break

      } catch (error) {
        console.warn(`Attempt ${attempts} failed: ${error.message}`)
        if (attempts >= maxAttempts) {
          console.error('All attempts failed. Last error:', error.message)
          throw new Error(`Failed to parse phases 1-2 after ${maxAttempts} attempts: ${error.message}`)
        }
        // Wait briefly before retry
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    const elapsedTime = Date.now() - startTime
    console.log(`✅ Phases 1-2 complete in ${elapsedTime}ms (${attempts} attempts)`)

    return new Response(
      JSON.stringify({ orchestrationStrategy: phases }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Phases 1-2 error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
