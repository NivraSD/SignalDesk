import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InfluenceMapperRequest {
  researchData: any // CampaignIntelligenceBrief
  selectedPositioning: any
  campaignGoal: string
  orgId: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { researchData, selectedPositioning, campaignGoal, orgId } = await req.json() as InfluenceMapperRequest

    console.log('🧠 Influence Mapper:', {
      stakeholderCount: researchData?.stakeholders?.length || 0,
      positioning: selectedPositioning?.name,
      goal: campaignGoal.substring(0, 50)
    })

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '',
    })

    const systemPrompt = `You are an expert in psychological influence strategy for B2B campaigns.

## Your Task
Convert stakeholder psychology + campaign positioning into actionable influence strategies.

## Core Principle
**Positioning tells us WHAT to say. Psychology tells us HOW to say it to each stakeholder.**

## Key Responsibilities
1. For each stakeholder, map their psychology (fears, aspirations, decision triggers) to influence levers
2. Align positioning messages with psychological triggers
3. Identify which positioning differentiators address which stakeholder fears
4. Map positioning opportunities to tactical moments
5. Determine optimal channels based on information diet

## Critical Requirements
- Use stakeholder psychology to adapt positioning messages
- Match positioning differentiators to stakeholder concerns
- Create influence levers that are psychologically grounded
- Specify channels from their actual information diet
- Map decision triggers to tactical timing

Output ONLY valid JSON matching this structure:

{
  "influenceStrategies": [
    {
      "stakeholder": "Stakeholder group name",
      "psychologicalProfile": {
        "primaryFear": "Their main concern",
        "primaryAspiration": "What they want to achieve",
        "decisionTrigger": "What makes them act"
      },
      "positioningAlignment": {
        "coreMessage": "Main positioning message adapted for this stakeholder",
        "keyMessagesForThisStakeholder": [
          "Positioning message 1 (addresses fear/aspiration)",
          "Positioning message 2 (provides proof)"
        ],
        "differentiatorsThatResonateHere": [
          "Positioning differentiator that matters to this stakeholder"
        ],
        "opportunitiesForThisStakeholder": [
          "Positioning opportunity relevant to this group"
        ]
      },
      "influenceLevers": [
        {
          "lever": "Fear mitigation | Aspiration activation | Social proof | Authority",
          "positioningMessage": "Which positioning message to use",
          "approach": "How to present this message",
          "channels": ["Channels from their information diet"],
          "trustedVoices": ["Who they listen to"],
          "psychologicalMechanism": "Why this works for them"
        }
      ],
      "touchpointStrategy": {
        "phase1_awareness": {
          "objective": "What we want them to think/feel",
          "channels": ["Specific channels they use"],
          "messageFraming": "How to frame positioning for their psychology",
          "decisionTriggerActivation": "How to activate their decision triggers"
        },
        "phase2_consideration": {
          "objective": "What we want them to do",
          "channels": ["Where they evaluate options"],
          "messageFraming": "Deeper positioning messages",
          "decisionTriggerActivation": "Build evidence for decision"
        },
        "phase3_conversion": {
          "objective": "Remove friction to action",
          "channels": ["Where they make decisions"],
          "messageFraming": "Final positioning proof",
          "decisionTriggerActivation": "Activate decision trigger"
        },
        "phase4_advocacy": {
          "objective": "Turn them into advocates",
          "channels": ["Where they share recommendations"],
          "messageFraming": "Success story positioning",
          "decisionTriggerActivation": "Give them social proof to share"
        }
      }
    }
  ]
}`

    const userPrompt = `# Campaign Goal
${campaignGoal}

# Selected Positioning
**${selectedPositioning?.name || 'Not specified'}**
${selectedPositioning?.description || ''}

**Key Messages:**
${selectedPositioning?.keyMessages?.join('\n') || 'None'}

**Differentiators:**
${selectedPositioning?.differentiators?.join('\n') || 'None'}

**Target Audiences:**
${selectedPositioning?.targetAudiences?.join(', ') || 'None'}

**Opportunities:**
${selectedPositioning?.opportunities?.join('\n') || 'None'}

# STAKEHOLDERS WITH PSYCHOLOGY (from research):
${JSON.stringify(researchData?.stakeholders || [], null, 2)}

# NARRATIVE LANDSCAPE (context):
${JSON.stringify(researchData?.narrativeLandscape || {}, null, 2)}

# CHANNEL INTELLIGENCE (where they consume info):
${JSON.stringify(researchData?.channelIntelligence?.byStakeholder || [], null, 2)}

## Instructions

For EACH stakeholder group above:

1. **Analyze their psychology:**
   - What is their PRIMARY fear? (extract from psychology.fears)
   - What is their PRIMARY aspiration? (extract from psychology.aspirations)
   - What is their DECISION TRIGGER? (extract from decisionTriggers)

2. **Map positioning to psychology:**
   - Which positioning KEY MESSAGES address their fear?
   - Which positioning KEY MESSAGES speak to their aspiration?
   - Which positioning DIFFERENTIATORS provide proof/credibility they need?
   - Which positioning OPPORTUNITIES are relevant to this stakeholder?

3. **Create influence levers:**
   - Fear mitigation lever: How to use positioning to address their fear
   - Aspiration activation lever: How to use positioning to activate aspiration
   - Social proof lever: How to use positioning + their trusted voices
   - Authority lever: How to establish credibility using positioning differentiators

4. **Design touchpoint strategy for 4 phases:**
   - Use THEIR actual channels (from channelIntelligence.byStakeholder)
   - Frame positioning messages for THEIR psychology
   - Activate THEIR specific decision triggers
   - Show progression: awareness → consideration → conversion → advocacy

5. **Be specific:**
   - Use exact channel names from their informationDiet/channelIntelligence
   - Reference specific positioning messages by name
   - Explain WHY each approach works psychologically
   - Map to their actual decision journey from research

Output comprehensive influence strategies for ALL stakeholders in valid JSON format.`

    const startTime = Date.now()

    // Retry logic for JSON parsing issues
    let influenceStrategies
    let attempts = 0
    const maxAttempts = 2 // Reduced from 3 to avoid timeout

    while (attempts < maxAttempts) {
      attempts++
      try {
        console.log(`Attempt ${attempts}/${maxAttempts} to generate influence strategies...`)

        const message = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 3500, // Reduced from 4096 to improve speed
          temperature: 0.7,
          system: systemPrompt,
          messages: [{
            role: 'user',
            content: userPrompt
          }]
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

        // Check if JSON is truncated (unterminated strings)
        const openBraces = (jsonText.match(/\{/g) || []).length
        const closeBraces = (jsonText.match(/\}/g) || []).length
        if (openBraces !== closeBraces) {
          throw new Error(`JSON truncated: ${openBraces} opening braces but ${closeBraces} closing braces`)
        }

        influenceStrategies = JSON.parse(jsonText)

        // Validate structure
        if (!influenceStrategies.influenceStrategies || influenceStrategies.influenceStrategies.length === 0) {
          throw new Error('No influence strategies generated')
        }

        // Success!
        console.log(`✅ Valid influence strategies generated on attempt ${attempts}`)
        break

      } catch (error) {
        console.warn(`Attempt ${attempts} failed: ${error.message}`)
        if (attempts >= maxAttempts) {
          console.error('All attempts failed. Last error:', error.message)
          throw new Error(`Failed to generate influence strategies after ${maxAttempts} attempts: ${error.message}`)
        }
        // Wait briefly before retry
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    const elapsedTime = Date.now() - startTime

    console.log('📊 Influence strategies generated:', {
      stakeholderCount: influenceStrategies.influenceStrategies?.length || 0,
      totalLevers: influenceStrategies.influenceStrategies?.reduce((sum: number, s: any) =>
        sum + (s.influenceLevers?.length || 0), 0) || 0,
      elapsedTime: `${elapsedTime}ms`
    })

    return new Response(
      JSON.stringify(influenceStrategies),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Influence Mapper error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Failed to generate influence strategies'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
