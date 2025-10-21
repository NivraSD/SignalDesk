import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InfluenceMapperRequest {
  enrichedData: any
  patternSelection: any
  campaignGoal: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { enrichedData, patternSelection, campaignGoal } = await req.json() as InfluenceMapperRequest

    console.log('🧠 MCP Influence Mapper:', {
      stakeholderCount: enrichedData?.influenceLeverTemplates?.length || 0,
      pattern: patternSelection?.selectedPattern?.pattern,
      goal: campaignGoal.substring(0, 50)
    })

    const startTime = Date.now()

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '',
    })

    // Retry logic for JSON parsing issues
    let influenceStrategies
    let attempts = 0
    const maxAttempts = 3

    while (attempts < maxAttempts) {
      attempts++
      try {
        console.log(`🔄 Attempt ${attempts}/${maxAttempts} to generate influence strategies...`)

    const systemPrompt = `You are an expert in psychological influence strategy for B2B campaigns.

## Your Task
Generate Part 2 (Psychological Influence Strategy) of the VECTOR blueprint.

**CRITICAL: You MUST generate influence strategies for EVERY stakeholder provided in the user prompt. If you receive 4 stakeholders, you MUST return 4 complete strategies. An empty array is NOT acceptable.**

## Core Principle
**Positioning tells us WHAT to say. Psychology tells us HOW to say it to each stakeholder.**

## Key Responsibilities
1. For each stakeholder, map their psychology (fears, aspirations, decision triggers) to influence levers
2. Align positioning messages with psychological triggers
3. Create 4-phase touchpoint strategies (awareness → consideration → conversion → advocacy)
4. Specify channels from their actual information diet
5. Design influence levers that are psychologically grounded

Output ONLY valid JSON:
{
  "influenceStrategies": [
    {
      "stakeholder": "Stakeholder name",
      "psychologicalProfile": {
        "primaryFear": "Their main concern",
        "primaryAspiration": "What they want to achieve",
        "decisionTrigger": "What makes them act"
      },
      "positioningAlignment": {
        "coreMessage": "Main positioning message adapted for this stakeholder",
        "keyMessagesForThisStakeholder": ["Message 1", "Message 2"],
        "differentiatorsThatResonate": ["Differentiator 1"]
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
          "messageFraming": "How to frame positioning",
          "decisionTriggerActivation": "How to activate triggers"
        },
        "phase2_consideration": {
          "objective": "What we want them to do",
          "channels": ["Where they evaluate"],
          "messageFraming": "Deeper positioning messages",
          "decisionTriggerActivation": "Build evidence"
        },
        "phase3_conversion": {
          "objective": "Remove friction to action",
          "channels": ["Where they decide"],
          "messageFraming": "Final positioning proof",
          "decisionTriggerActivation": "Activate decision trigger"
        },
        "phase4_advocacy": {
          "objective": "Turn them into advocates",
          "channels": ["Where they share"],
          "messageFraming": "Success story positioning",
          "decisionTriggerActivation": "Give them social proof to share"
        }
      }
    }
  ]
}`

    const positioning = enrichedData?.positioning || {}
    const leverTemplates = enrichedData?.influenceLeverTemplates || []
    const pattern = patternSelection?.selectedPattern?.pattern || 'CHORUS'
    const pillarEmphasis = patternSelection?.selectedPattern?.pillarEmphasis || {}

    // DEBUG: Log what we're receiving
    console.log('🔍 DEBUG - Received data:', {
      hasEnrichedData: !!enrichedData,
      hasPositioning: !!positioning,
      leverTemplatesCount: leverTemplates.length,
      leverTemplatesSample: leverTemplates.slice(0, 2),
      enrichedDataKeys: Object.keys(enrichedData || {}),
      researchDataStakeholders: enrichedData?.researchData?.stakeholders?.length || 0
    })

    if (leverTemplates.length === 0) {
      console.error('❌ CRITICAL: No influenceLeverTemplates found!')
      console.error('EnrichedData structure:', JSON.stringify(enrichedData, null, 2).substring(0, 1000))
      throw new Error('No stakeholder data to generate influence strategies from')
    }

    // Enrich stakeholders with default channels if empty
    const enrichedStakeholders = leverTemplates.map((lt: any) => {
      if (!lt.channels || lt.channels.length === 0) {
        // Generate reasonable default channels based on stakeholder type
        const stakeholderLower = (lt.stakeholder || '').toLowerCase()
        let defaultChannels = ['LinkedIn', 'Industry publications', 'Email newsletters', 'Trade conferences']

        if (stakeholderLower.includes('developer') || stakeholderLower.includes('engineer')) {
          defaultChannels = ['GitHub', 'Stack Overflow', 'Hacker News', 'Dev.to', 'Tech blogs']
        } else if (stakeholderLower.includes('executive') || stakeholderLower.includes('cto') || stakeholderLower.includes('ceo')) {
          defaultChannels = ['LinkedIn', 'WSJ', 'Harvard Business Review', 'Industry conferences', 'Board meetings']
        } else if (stakeholderLower.includes('marketing') || stakeholderLower.includes('creative')) {
          defaultChannels = ['LinkedIn', 'Marketing Week', 'AdAge', 'Twitter/X', 'Industry events']
        }

        console.log(`⚠️ No channels for "${lt.stakeholder}", using defaults:`, defaultChannels)
        return { ...lt, channels: defaultChannels }
      }
      return lt
    })

    const topStakeholders = enrichedStakeholders

    console.log('📊 Stakeholders being sent to Claude:', {
      count: topStakeholders.length,
      stakeholders: topStakeholders.map((s: any) => ({
        name: s.stakeholder,
        hasChannels: s.channels?.length > 0,
        channelCount: s.channels?.length || 0
      }))
    })

    const userPrompt = `# Campaign Goal
${campaignGoal}

# SELECTED POSITIONING
**${positioning?.name || 'Not specified'}**
${positioning?.description || ''}

**Key Messages:**
${(positioning?.keyMessages || []).map((m: string) => `- ${m}`).join('\n')}

**Differentiators:**
${(positioning?.differentiators || []).map((d: string) => `- ${d}`).join('\n')}

**Opportunities:**
${(positioning?.opportunities || []).map((o: string) => `- ${o}`).join('\n')}

# SELECTED PATTERN: ${pattern}
**Pillar Emphasis:**
${JSON.stringify(pillarEmphasis, null, 2)}

# STAKEHOLDERS WITH PSYCHOLOGY
${topStakeholders.map((lt: any) => `
**${lt.stakeholder}**
- Primary Fear: ${lt.primaryFear}
- Primary Aspiration: ${lt.primaryAspiration}
- Decision Triggers: ${(lt.decisionTriggers || []).join(', ')}
- Channels: ${(lt.channels || []).join(', ')}
`).join('\n')}

# KNOWLEDGE LIBRARY FOUNDATIONS
${JSON.stringify(enrichedData?.knowledgeLibrary?.foundational?.slice(0, 3) || [], null, 2)}

## Instructions

**YOU MUST GENERATE STRATEGIES FOR ALL STAKEHOLDERS LISTED ABOVE. NO EXCEPTIONS.**

For EACH stakeholder above (you should have ${topStakeholders.length} strategies in your output), generate their complete influence strategy:

1. **Analyze their psychology:**
   - What is their PRIMARY fear from the list?
   - What is their PRIMARY aspiration?
   - What are their DECISION TRIGGERS?

2. **Map positioning to psychology:**
   - Which positioning KEY MESSAGES address their fear?
   - Which positioning KEY MESSAGES speak to their aspiration?
   - Which positioning DIFFERENTIATORS provide proof they need?

3. **Create 4 influence levers:**
   - **Fear mitigation lever**: How to use positioning to address their fear
   - **Aspiration activation lever**: How to use positioning to activate aspiration
   - **Social proof lever**: How to use positioning + their trusted voices
   - **Authority lever**: How to establish credibility using positioning differentiators

4. **Design 4-phase touchpoint strategy:**
   - Use THEIR actual channels (from the list above)
   - Frame positioning messages for THEIR psychology
   - Activate THEIR specific decision triggers
   - Show progression: awareness → consideration → conversion → advocacy

5. **Be specific:**
   - Reference exact positioning messages by name
   - Use their exact channels
   - Explain WHY each approach works psychologically

**REMINDER: You MUST output ${topStakeholders.length} complete influence strategies. Your influenceStrategies array MUST have ${topStakeholders.length} items. Do NOT return an empty array.**

Output comprehensive influence strategies for ALL ${topStakeholders.length} stakeholders in valid JSON format.

**CRITICAL: Your response must be ONLY valid JSON. No markdown, no explanations, just pure JSON.**
- Use double quotes for all strings
- Escape any quotes inside strings with backslash
- No trailing commas
- No comments
- Ensure all braces and brackets are properly closed`

    console.log('📝 Prompt preview (first 1000 chars):', userPrompt.substring(0, 1000))
    console.log('📝 STAKEHOLDERS section:', userPrompt.substring(
      userPrompt.indexOf('# STAKEHOLDERS WITH PSYCHOLOGY'),
      userPrompt.indexOf('# STAKEHOLDERS WITH PSYCHOLOGY') + 800
    ))

    // Use tool calling to force valid JSON schema
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 16000, // Increased from 4000 to handle 4 complete stakeholder strategies
      temperature: 0.3,
      system: systemPrompt,
      tools: [{
        name: 'generate_influence_strategies',
        description: 'Generate psychological influence strategies for campaign stakeholders',
        input_schema: {
          type: 'object',
          properties: {
            influenceStrategies: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  stakeholder: { type: 'string' },
                  psychologicalProfile: {
                    type: 'object',
                    properties: {
                      primaryFear: { type: 'string' },
                      primaryAspiration: { type: 'string' },
                      decisionTrigger: { type: 'string' }
                    },
                    required: ['primaryFear', 'primaryAspiration', 'decisionTrigger']
                  },
                  positioningAlignment: {
                    type: 'object',
                    properties: {
                      coreMessage: { type: 'string' },
                      keyMessagesForThisStakeholder: { type: 'array', items: { type: 'string' } },
                      differentiatorsThatResonate: { type: 'array', items: { type: 'string' } }
                    },
                    required: ['coreMessage', 'keyMessagesForThisStakeholder', 'differentiatorsThatResonate']
                  },
                  influenceLevers: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        lever: { type: 'string' },
                        positioningMessage: { type: 'string' },
                        approach: { type: 'string' },
                        channels: { type: 'array', items: { type: 'string' } },
                        trustedVoices: { type: 'array', items: { type: 'string' } },
                        psychologicalMechanism: { type: 'string' }
                      },
                      required: ['lever', 'positioningMessage', 'approach', 'channels', 'trustedVoices', 'psychologicalMechanism']
                    }
                  },
                  touchpointStrategy: {
                    type: 'object',
                    properties: {
                      phase1_awareness: {
                        type: 'object',
                        properties: {
                          objective: { type: 'string' },
                          channels: { type: 'array', items: { type: 'string' } },
                          messageFraming: { type: 'string' },
                          decisionTriggerActivation: { type: 'string' }
                        },
                        required: ['objective', 'channels', 'messageFraming', 'decisionTriggerActivation']
                      },
                      phase2_consideration: {
                        type: 'object',
                        properties: {
                          objective: { type: 'string' },
                          channels: { type: 'array', items: { type: 'string' } },
                          messageFraming: { type: 'string' },
                          decisionTriggerActivation: { type: 'string' }
                        },
                        required: ['objective', 'channels', 'messageFraming', 'decisionTriggerActivation']
                      },
                      phase3_conversion: {
                        type: 'object',
                        properties: {
                          objective: { type: 'string' },
                          channels: { type: 'array', items: { type: 'string' } },
                          messageFraming: { type: 'string' },
                          decisionTriggerActivation: { type: 'string' }
                        },
                        required: ['objective', 'channels', 'messageFraming', 'decisionTriggerActivation']
                      },
                      phase4_advocacy: {
                        type: 'object',
                        properties: {
                          objective: { type: 'string' },
                          channels: { type: 'array', items: { type: 'string' } },
                          messageFraming: { type: 'string' },
                          decisionTriggerActivation: { type: 'string' }
                        },
                        required: ['objective', 'channels', 'messageFraming', 'decisionTriggerActivation']
                      }
                    },
                    required: ['phase1_awareness', 'phase2_consideration', 'phase3_conversion', 'phase4_advocacy']
                  }
                },
                required: ['stakeholder', 'psychologicalProfile', 'positioningAlignment', 'influenceLevers', 'touchpointStrategy']
              }
            }
          },
          required: ['influenceStrategies']
        }
      }],
      tool_choice: { type: 'tool', name: 'generate_influence_strategies' },
      messages: [{ role: 'user', content: userPrompt }]
    })

    // Extract tool call result (guaranteed valid JSON from Claude)
    const content = message.content.find((block: any) => block.type === 'tool_use')

    if (!content || content.type !== 'tool_use') {
      throw new Error('No tool use response from Claude')
    }

    // Tool use returns already-parsed JSON object - no parsing needed!
    influenceStrategies = content.input

    console.log('✅ Tool use returned valid structured data:', {
      stakeholderCount: influenceStrategies.influenceStrategies?.length || 0
    })

        // Validate structure
        if (!influenceStrategies.influenceStrategies || influenceStrategies.influenceStrategies.length === 0) {
          throw new Error('No influence strategies generated')
        }

        // Success!
        console.log(`✅ Valid influence strategies generated on attempt ${attempts}`)
        break

      } catch (error) {
        console.warn(`⚠️ Attempt ${attempts} failed: ${error.message}`)
        if (attempts >= maxAttempts) {
          console.error('❌ All attempts failed. Last error:', error.message)
          throw new Error(`Failed to generate influence strategies after ${maxAttempts} attempts: ${error.message}`)
        }
        // Wait briefly before retry
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    const elapsedTime = Date.now() - startTime
    console.log(`✅ Influence strategies generated: ${influenceStrategies.influenceStrategies?.length || 0} stakeholders (${elapsedTime}ms, ${attempts} attempts)`)

    return new Response(
      JSON.stringify(influenceStrategies),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Influence mapper error:', error)
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
