import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TacticalGeneratorRequest {
  enrichedData: any
  patternSelection: any
  influenceStrategies: any
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
      influenceStrategies,
      campaignGoal
    } = await req.json() as TacticalGeneratorRequest

    console.log('🎯 MCP Tactical Generator:', {
      stakeholderCount: influenceStrategies?.influenceStrategies?.length || 0,
      pattern: patternSelection?.selectedPattern?.pattern,
      journalistCount: enrichedData?.journalists?.tier1?.length || 0,
      goal: campaignGoal.substring(0, 50)
    })

    const startTime = Date.now()

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '',
    })

    // Retry logic for JSON parsing issues
    let tacticalOrchestration
    let attempts = 0
    const maxAttempts = 3

    while (attempts < maxAttempts) {
      attempts++
      try {
        console.log(`🔄 Attempt ${attempts}/${maxAttempts} to generate tactical orchestration...`)

    const systemPrompt = `You are a tactical campaign planner. Generate executable actions only.

## Your Task
Generate Part 3 (Four-Pillar Tactical Orchestration) - ALL 4 PHASES × 4 PILLARS.

## Key Principles
- NO strategy explanation (research already has that)
- NO positioning rationale (positioning doc already has that)
- ONLY tactical actions: WHO does WHAT, WHEN, WHERE
- Use REAL journalist names from enriched data
- Keep it concise - 1 action per pillar per phase

## The 4 Pillars (Tactical Actions Only)

**Pillar 1: Owned Actions (Include Social Media)**
- Content type (blog post, case study, social post, etc.)
- For social media: platform, post owner (CEO, brand account, team member), format (single post, thread, carousel)
- Target stakeholder, timing, channels
- NO prose - just the what/who/when/where

**Pillar 2: Relationship Orchestration**
- Who to engage, how to approach, what to give them
- NO strategy - just the action

**Pillar 3: Event Orchestration**
- Event type/name, what to present, timing
- NO explanation - just the tactic

**Pillar 4: Media Engagement**
- Story angle, REAL journalist names (from enriched data), timing
- NO pitch copy - just who to pitch what when

## The 4 Phases

**Phase 1: Awareness (Weeks 1-3)**
- Objective: Create awareness and establish positioning
- Focus: Broad reach, pattern establishment, credibility signals

**Phase 2: Consideration (Weeks 4-6)**
- Objective: Deepen understanding and build preference
- Focus: Proof points, differentiation, stakeholder engagement

**Phase 3: Conversion (Weeks 7-9)**
- Objective: Remove friction and activate decision triggers
- Focus: Decision support, ROI evidence, risk mitigation

**Phase 4: Advocacy (Weeks 10-12)**
- Objective: Turn customers into advocates
- Focus: Success stories, reference programs, community building

Output ONLY valid JSON (NO PROSE):
{
  "phase1_awareness": {
    "weeks": "1-3",
    "pillar1_ownedActions": [
      {
        "contentType": "Case study",
        "targetStakeholder": "IT Directors",
        "positioningMessage": "Enterprise reliability meets velocity",
        "psychologicalLever": "Fear: system downtime",
        "timing": "Week 1",
        "channels": ["TechCrunch", "Company blog"],
        "keyPoints": ["Point 1", "Point 2"],
        "executionOwner": "signaldesk",
        // For social media content, add these fields:
        "platform": "LinkedIn",  // optional: LinkedIn, Twitter, Instagram
        "postOwner": "CEO",  // optional: CEO, brand account, marketing team
        "postFormat": "Single post"  // optional: single post, thread, carousel
      }
    ],
    "pillar2_relationshipOrchestration": [
      {
        "who": "Top 3 Gartner analysts covering DevOps",
        "action": "Send custom research brief on AI in DevOps",
        "timing": "Week 2",
        "goal": "Get quote for PR",
        "executionOwner": "organization"
      }
    ],
    "pillar3_eventOrchestration": [
      {
        "event": "AWS re:Invent",
        "action": "Speaking slot on AI-powered DevOps",
        "timing": "Week 3",
        "goal": "Generate 50+ qualified leads",
        "executionOwner": "organization"
      }
    ],
    "pillar4_mediaEngagement": [
      {
        "story": "How AI is transforming enterprise DevOps",
        "journalists": [
          {"name": "Sarah Frier", "outlet": "Bloomberg", "beat": "Enterprise tech"},
          {"name": "Mike Isaac", "outlet": "NYT", "beat": "Tech industry"}
        ],
        "timing": "Week 1",
        "positioningMessage": "Enterprise reliability meets velocity",
        "executionOwner": "signaldesk"
      }
    ]
  },
  "phase2_consideration": { /* same structure as phase1 */ },
  "phase3_conversion": { /* same structure as phase1 */ },
  "phase4_advocacy": { /* same structure as phase1 */ }
}`

    const pattern = patternSelection?.selectedPattern?.pattern || 'CHORUS'
    const pillarEmphasis = patternSelection?.selectedPattern?.pillarEmphasis || {}
    const positioning = enrichedData?.positioning || {}
    const journalists = enrichedData?.journalists || {}
    const knowledgeLibrary = enrichedData?.knowledgeLibrary || {}
    const strategies = influenceStrategies?.influenceStrategies || []

    const userPrompt = `# Campaign Goal
${campaignGoal}

# SELECTED PATTERN: ${pattern}
**Pillar Emphasis:**
${JSON.stringify(pillarEmphasis, null, 2)}

**Key Mechanics:**
${(patternSelection?.selectedPattern?.keyMechanics || []).join('\n')}

# POSITIONING
**${positioning?.name || 'Not specified'}**
**Key Messages:**
${(positioning?.keyMessages || []).map((m: string) => `- ${m}`).join('\n')}

**Differentiators:**
${(positioning?.differentiators || []).map((d: string) => `- ${d}`).join('\n')}

# INFLUENCE STRATEGIES (Per Stakeholder)
${strategies.slice(0, 5).map((s: any) => `
**${s.stakeholder}**
- Primary Fear: ${s.psychologicalProfile?.primaryFear}
- Primary Aspiration: ${s.psychologicalProfile?.primaryAspiration}
- Core Message: ${s.positioningAlignment?.coreMessage}
- Phase 1 Objective: ${s.touchpointStrategy?.phase1_awareness?.objective}
- Phase 2 Objective: ${s.touchpointStrategy?.phase2_consideration?.objective}
- Phase 3 Objective: ${s.touchpointStrategy?.phase3_conversion?.objective}
- Phase 4 Objective: ${s.touchpointStrategy?.phase4_advocacy?.objective}
`).join('\n')}

# ENRICHED JOURNALISTS (USE REAL NAMES)
**Tier 1 Journalists:**
${(journalists.tier1 || []).slice(0, 15).map((j: any) => `
- ${j.name} (${j.outlet}) - ${j.beat || 'General coverage'}${j.influence_score ? ` [Score: ${j.influence_score}]` : ''}
`).join('\n')}

# PATTERN-SPECIFIC TACTICS (From Knowledge Library)
${JSON.stringify(knowledgeLibrary.pattern_specific?.slice(0, 5) || [], null, 2)}

# METHODOLOGIES
${JSON.stringify(knowledgeLibrary.methodologies?.slice(0, 3) || [], null, 2)}

## Instructions

Generate ALL 4 PHASES × 4 PILLARS. Each pillar: 1 tactical action only.

### For EACH Phase:

**Pillar 1 (Owned):** contentType, targetStakeholder, positioningMessage, psychologicalLever, timing, channels, keyPoints (2 points), executionOwner: "signaldesk"
  - Include AT LEAST ONE social media post per phase
  - For social posts: add platform (LinkedIn/Twitter/Instagram), postOwner (CEO/brand account/marketing team), postFormat (Single post/Thread/Carousel)
**Pillar 2 (Relationships):** who, action, timing, goal, executionOwner: "organization"
**Pillar 3 (Events):** event, action, timing, goal, executionOwner: "organization"
**Pillar 4 (Media):** story, journalists (REAL NAMES from enriched data), timing, positioningMessage, executionOwner: "signaldesk"

### Execution Ownership:
- **"signaldesk"** = Platform can auto-generate (content, pitches, posts)
- **"organization"** = User must execute (event attendance, analyst calls, relationship building)

### Phase Focus:
- **Phase 1 (Weeks 1-3):** Awareness - broad reach
- **Phase 2 (Weeks 4-6):** Consideration - proof points
- **Phase 3 (Weeks 7-9):** Conversion - decision support
- **Phase 4 (Weeks 10-12):** Advocacy - success stories

Output ALL 4 PHASES in valid JSON. NO explanatory prose.

**CRITICAL: Your response must be ONLY valid JSON. No markdown, no explanations, just pure JSON.**
- Use double quotes for all strings
- Escape any quotes inside strings with backslash
- No trailing commas
- No comments
- Ensure all braces and brackets are properly closed`

    // Define phase schema (reused for all 4 phases)
    const phaseSchema = {
      type: 'object',
      properties: {
        weeks: { type: 'string' },
        pillar1_ownedActions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              contentType: { type: 'string' },
              targetStakeholder: { type: 'string' },
              positioningMessage: { type: 'string' },
              psychologicalLever: { type: 'string' },
              timing: { type: 'string' },
              channels: { type: 'array', items: { type: 'string' } },
              keyPoints: { type: 'array', items: { type: 'string' } },
              executionOwner: { type: 'string', enum: ['signaldesk', 'organization'] },
              // Optional social media fields
              platform: { type: 'string', enum: ['LinkedIn', 'Twitter', 'Instagram', 'Facebook', 'TikTok'] },
              postOwner: { type: 'string' },  // CEO, brand account, marketing team, etc.
              postFormat: { type: 'string', enum: ['Single post', 'Thread', 'Carousel', 'Video', 'Story'] }
            },
            required: ['contentType', 'targetStakeholder', 'positioningMessage', 'psychologicalLever', 'timing', 'channels', 'keyPoints', 'executionOwner']
          }
        },
        pillar2_relationshipOrchestration: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              who: { type: 'string' },
              action: { type: 'string' },
              timing: { type: 'string' },
              goal: { type: 'string' },
              executionOwner: { type: 'string', enum: ['signaldesk', 'organization'] }
            },
            required: ['who', 'action', 'timing', 'goal', 'executionOwner']
          }
        },
        pillar3_eventOrchestration: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              event: { type: 'string' },
              action: { type: 'string' },
              timing: { type: 'string' },
              goal: { type: 'string' },
              executionOwner: { type: 'string', enum: ['signaldesk', 'organization'] }
            },
            required: ['event', 'action', 'timing', 'goal', 'executionOwner']
          }
        },
        pillar4_mediaEngagement: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              story: { type: 'string' },
              journalists: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    outlet: { type: 'string' },
                    beat: { type: 'string' }
                  },
                  required: ['name', 'outlet', 'beat']
                }
              },
              timing: { type: 'string' },
              positioningMessage: { type: 'string' },
              executionOwner: { type: 'string', enum: ['signaldesk', 'organization'] }
            },
            required: ['story', 'journalists', 'timing', 'positioningMessage', 'executionOwner']
          }
        }
      },
      required: ['weeks', 'pillar1_ownedActions', 'pillar2_relationshipOrchestration', 'pillar3_eventOrchestration', 'pillar4_mediaEngagement']
    }

    // Use tool calling to force valid JSON schema
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      temperature: 0.3,
      system: systemPrompt,
      tools: [{
        name: 'generate_tactical_orchestration',
        description: 'Generate 4-phase × 4-pillar tactical campaign orchestration',
        input_schema: {
          type: 'object',
          properties: {
            phase1_awareness: phaseSchema,
            phase2_consideration: phaseSchema,
            phase3_conversion: phaseSchema,
            phase4_advocacy: phaseSchema
          },
          required: ['phase1_awareness', 'phase2_consideration', 'phase3_conversion', 'phase4_advocacy']
        }
      }],
      tool_choice: { type: 'tool', name: 'generate_tactical_orchestration' },
      messages: [{ role: 'user', content: userPrompt }]
    })

    // Extract tool call result (guaranteed valid JSON from Claude)
    const content = message.content.find((block: any) => block.type === 'tool_use')

    if (!content || content.type !== 'tool_use') {
      throw new Error('No tool use response from Claude')
    }

    // Tool use returns already-parsed JSON object - no parsing needed!
    tacticalOrchestration = content.input

    console.log('✅ Tool use returned valid tactical orchestration:', {
      phase1: !!tacticalOrchestration.phase1_awareness,
      phase2: !!tacticalOrchestration.phase2_consideration,
      phase3: !!tacticalOrchestration.phase3_conversion,
      phase4: !!tacticalOrchestration.phase4_advocacy
    })

    // Validate all 4 phases exist
    if (!tacticalOrchestration.phase1_awareness ||
        !tacticalOrchestration.phase2_consideration ||
        !tacticalOrchestration.phase3_conversion ||
        !tacticalOrchestration.phase4_advocacy) {
      throw new Error('Missing required phases in tactical orchestration')
    }

        // Success!
        console.log(`✅ Valid tactical orchestration generated on attempt ${attempts}`)
        break

      } catch (error) {
        console.warn(`⚠️ Attempt ${attempts} failed: ${error.message}`)
        if (attempts >= maxAttempts) {
          console.error('❌ All attempts failed. Last error:', error.message)
          throw new Error(`Failed to generate tactical orchestration after ${maxAttempts} attempts: ${error.message}`)
        }
        // Wait briefly before retry
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    const elapsedTime = Date.now() - startTime
    console.log(`✅ Tactical orchestration generated: 4 phases × 4 pillars (${elapsedTime}ms, ${attempts} attempts)`)

    return new Response(
      JSON.stringify({ orchestrationStrategy: tacticalOrchestration }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Tactical generator error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Failed to generate tactical orchestration'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
