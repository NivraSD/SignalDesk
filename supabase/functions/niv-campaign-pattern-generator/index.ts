import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PatternRequest {
  pattern: string
  patternRationale: string
  orchestrationStrategy: any
  selectedPositioning: any
  campaignDuration: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { pattern, patternRationale, orchestrationStrategy, selectedPositioning, campaignDuration } = await req.json() as PatternRequest

    console.log('🎭 Pattern Generator:', {
      pattern,
      phases: Object.keys(orchestrationStrategy.phases || {}).length
    })

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '',
    })

    const systemPrompt = `You are an expert in VECTOR campaign patterns - the different ways to orchestrate influence operations.

## Your Task
Generate Part 6: Pattern-Specific Guidance showing how to emphasize pillars and time activities based on the campaign pattern.

## The 5 VECTOR Patterns

**CASCADE**: Authority flows down from top influencers to broader audience
- Pillar emphasis: Relationships (80%) → Owned (20%)
- Start with Tier 0 mega-influencers, let message cascade naturally
- Owned content supports what influencers say (not vice versa)

**MIRROR**: Create parallel narratives that converge from different angles
- Pillar emphasis: Media (40%) + Relationships (40%) + Owned (20%)
- Multiple independent-seeming sources tell same story simultaneously
- Coordinate timing so stakeholder sees 3+ sources same week

**CHORUS**: Many smaller voices create groundswell that attracts attention
- Pillar emphasis: Owned (50%) + Relationships (30%) + Events (20%)
- Flood channels with consistent message from many angles
- Volume and consistency create perception of momentum

**TROJAN**: Enter through accepted narrative, shift to real message later
- Pillar emphasis: Owned (60%) + Media (30%)
- Phase 1-2: Own accepted narrative stakeholders already trust
- Phase 3-4: Gradually introduce new positioning using earned trust

**NETWORK**: Interconnected ecosystem of mutual reinforcement
- Pillar emphasis: Relationships (50%) + Events (30%) + Media (20%)
- Build dense web where everyone cites everyone else
- Focus on creating peer validation loops

Output ONLY valid JSON.`

    const userPrompt = `# Campaign Pattern
**${pattern}**

${patternRationale}

# Campaign Duration
${campaignDuration}

# Core Messages (FROM POSITIONING)
${selectedPositioning.keyMessages?.join('\n- ') || 'N/A'}

# Differentiators (FROM POSITIONING)
${selectedPositioning.differentiators?.join('\n- ') || 'N/A'}

## Generate Part 6: Pattern-Specific Guidance

Create detailed guidance for executing the ${pattern} pattern:

\`\`\`json
{
  "part6_patternGuidance": {
    "pattern": "${pattern}",
    "philosophy": "Brief explanation of how ${pattern} creates system-level change",

    "pillarEmphasis": {
      "pillar1_owned": {
        "importance": "High|Medium|Low",
        "percentageOfEffort": 30,
        "role": "How Pillar 1 serves the pattern",
        "executionPriorities": [
          "Priority 1: Specific guidance for owned content in this pattern",
          "Priority 2: What type of owned content works best"
        ]
      },
      "pillar2_relationships": {
        "importance": "High|Medium|Low",
        "percentageOfEffort": 40,
        "role": "How Pillar 2 serves the pattern",
        "executionPriorities": [
          "Priority 1: Specific guidance for relationship orchestration",
          "Priority 2: What type of influencers to prioritize"
        ]
      },
      "pillar3_events": {
        "importance": "High|Medium|Low",
        "percentageOfEffort": 15,
        "role": "How Pillar 3 serves the pattern",
        "executionPriorities": [
          "Priority 1: Specific guidance for event strategy",
          "Priority 2: When events matter most"
        ]
      },
      "pillar4_media": {
        "importance": "High|Medium|Low",
        "percentageOfEffort": 15,
        "role": "How Pillar 4 serves the pattern",
        "executionPriorities": [
          "Priority 1: Specific guidance for media strategy",
          "Priority 2: What media coverage amplifies this pattern"
        ]
      }
    },

    "timingStrategy": {
      "phase1_awareness": {
        "pillarActivation": "Which pillars to activate heavily in Phase 1",
        "rationale": "Why this timing serves the pattern",
        "criticalMilestones": [
          "Milestone 1 that must be achieved in Phase 1",
          "Milestone 2 specific to this pattern"
        ]
      },
      "phase2_consideration": {
        "pillarActivation": "Which pillars to activate heavily in Phase 2",
        "rationale": "Why this timing serves the pattern",
        "criticalMilestones": [
          "Milestone specific to Phase 2 for this pattern"
        ]
      },
      "phase3_conversion": {
        "pillarActivation": "Which pillars to activate heavily in Phase 3",
        "rationale": "Why this timing serves the pattern",
        "criticalMilestones": [
          "Milestone specific to Phase 3"
        ]
      },
      "phase4_advocacy": {
        "pillarActivation": "Which pillars to activate heavily in Phase 4",
        "rationale": "Why this timing serves the pattern",
        "criticalMilestones": [
          "Milestone specific to Phase 4"
        ]
      }
    },

    "coordinationStrategy": {
      "howPillarsReinforce": "Pattern-specific explanation of cross-pillar amplification",
      "criticalSequences": [
        {
          "sequence": "Action A → Action B → Action C",
          "why": "Why this sequence matters for this pattern",
          "example": "Concrete example: Influencer shares research (Pillar 2) → We publish case study referencing their share (Pillar 1) → Media picks up 'trend' story (Pillar 4)"
        }
      ],
      "coordinationCadence": "How often to synchronize pillar activities (daily, weekly, phase-based)"
    },

    "patternSpecificTactics": {
      "uniqueApproaches": [
        {
          "tactic": "Pattern-specific tactic name",
          "description": "What this tactic is",
          "whyItWorksForPattern": "Why this specifically serves ${pattern}",
          "implementation": "How to execute this tactic",
          "example": "Concrete example from similar campaign"
        }
      ],
      "avoidCommonMistakes": [
        {
          "mistake": "Common error in executing ${pattern}",
          "why": "Why this breaks the pattern",
          "instead": "What to do instead"
        }
      ]
    },

    "stakeholderJourney": {
      "idealPath": "How stakeholder experiences ${pattern} pattern from their perspective",
      "touchpointSequence": [
        {
          "touchpoint": "First encounter (which pillar)",
          "stakeholderThinking": "What they think: 'Interesting idea, seems credible'",
          "systemState": "What pattern has achieved: Single exposure, no validation yet"
        },
        {
          "touchpoint": "Second encounter (different pillar)",
          "stakeholderThinking": "What they think: 'I'm seeing this from multiple places, must be real'",
          "systemState": "What pattern has achieved: Convergence beginning, validation building"
        },
        {
          "touchpoint": "Third+ encounters",
          "stakeholderThinking": "What they think: 'Everyone is talking about this, I should act'",
          "systemState": "What pattern has achieved: Narrative inevitability, behavior change triggered"
        }
      ]
    },

    "successIndicators": {
      "earlySignals": [
        "Signal 1: Early indicator pattern is working (Week 2-4)",
        "Signal 2: Another early indicator"
      ],
      "midCampaignSignals": [
        "Signal 1: Mid-campaign indicator pattern is scaling (Week 6-8)",
        "Signal 2: Another mid-stage indicator"
      ],
      "systemStateAchieved": [
        "Signal 1: Pattern has achieved system-level change (Week 10-12)",
        "Signal 2: Final state indicator"
      ]
    },

    "adaptationForPattern": {
      "ifNotWorking": [
        {
          "scenario": "Pattern-specific failure mode",
          "diagnosis": "Why ${pattern} might not be working",
          "fixes": [
            "Adaptation 1 specific to this pattern",
            "Adaptation 2"
          ]
        }
      ],
      "scalingOpportunities": [
        {
          "opportunity": "How to amplify ${pattern} if working well",
          "implementation": "How to execute amplification"
        }
      ]
    }
  }
}
\`\`\`

**CRITICAL REQUIREMENTS:**
1. Provide pillar emphasis percentages specific to ${pattern}
2. Show timing strategy across all 4 phases
3. Explain coordination strategy (how pillars reinforce each other)
4. Include pattern-specific tactics unique to ${pattern}
5. Map stakeholder journey from their perspective
6. Define success indicators at early, mid, and late stages
7. Provide adaptation guidance specific to this pattern

Generate comprehensive pattern guidance for ${pattern}.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 5000,
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

    let patternGuidance
    try {
      let jsonText = content.text.trim()
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```json\n?|\n?```/g, '')
      }
      patternGuidance = JSON.parse(jsonText)
    } catch (e) {
      console.error('JSON parse error:', e)
      console.error('Raw response:', content.text.substring(0, 500))
      throw new Error('Failed to parse pattern guidance')
    }

    console.log('✅ Pattern guidance generated successfully')

    return new Response(
      JSON.stringify(patternGuidance),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Pattern generator error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
