import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CounterNarrativeRequest {
  orchestrationStrategy: any // Output from orchestration generator
  researchData: any
  campaignGoal: string
  selectedPositioning: any
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { orchestrationStrategy, researchData, campaignGoal, selectedPositioning } = await req.json() as CounterNarrativeRequest

    console.log('🛡️ Counter-Narrative Generator:', {
      stakeholders: researchData?.stakeholders?.length || 0,
      phases: Object.keys(orchestrationStrategy.phases || {}).length,
      narratives: researchData?.narrativeLandscape?.dominantNarratives?.length || 0
    })

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '',
    })

    const systemPrompt = `You are an expert in VECTOR campaign defense and counter-narrative strategy.

## Your Task
Generate Part 4: Counter-Narrative Defense Strategy showing how to activate all 4 pillars in response to threats.

## Core Philosophy
Counter-narratives aren't just rebuttals - they're offensive plays using the same Four-Pillar orchestration:
- Owned Actions: Rapid response content across all channels
- Relationship Orchestration: Activate influencers and stakeholders to validate truth
- Event Orchestration: Create or hijack events to control narrative
- Media Engagement: Provide journalists with counter-story backed by data

## Critical Requirements

**For EACH threat scenario:**

1. **Threat Identification**:
   - Specific attack narrative or crisis scenario
   - Why this threatens campaign objectives
   - Early warning signals to detect it

2. **Four-Pillar Response Playbook**:
   - **Pillar 1 (Owned)**: What content to create, where to publish, timing
   - **Pillar 2 (Relationships)**: Which influencers to activate, what to ask them
   - **Pillar 3 (Events)**: Event opportunities to seize narrative control
   - **Pillar 4 (Media)**: Journalists to brief, counter-story angles, supporting data

3. **Response Timeline**:
   - Hour 0-6: Immediate actions
   - Hour 6-24: Momentum building
   - Day 2-7: Narrative ownership

4. **Success Metrics**:
   - What "winning" the narrative battle looks like
   - How to measure narrative shift
   - When to shift from defense to offense

5. **Content SignalDesk Generates**:
   - Crisis response templates (blog posts, statements, FAQs)
   - Influencer talking points
   - Media briefing documents
   - Social media response threads

## Threat Categories to Cover
1. **Direct Attacks**: Competitor or critic directly challenges our narrative
2. **Credibility Challenges**: Someone questions our authority or data
3. **Narrative Hijacking**: Adjacent story threatens to overshadow our message
4. **Stakeholder Defection**: Key influencer or partner publicly distances themselves
5. **Policy/Regulatory Threats**: Regulation could undermine campaign positioning

Output ONLY valid JSON.`

    // Build threat context from research
    const narrativeLandscape = researchData?.narrativeLandscape || {}
    const competitorNarratives = narrativeLandscape.competitorStrategies || []
    const vulnerabilities = narrativeLandscape.narrativeVoids || []

    const threatContext = `## Current Narrative Landscape

${competitorNarratives.length > 0 ? `**Competitor Narratives:**
${competitorNarratives.slice(0, 5).map((comp: any) =>
  `- ${comp.competitor || 'Unknown'}: ${comp.narrative || comp.positioning || 'N/A'}`
).join('\n')}
` : ''}

${vulnerabilities.length > 0 ? `**Potential Vulnerabilities:**
${vulnerabilities.slice(0, 5).map((v: any) =>
  `- ${v.void || v.gap || v.name || 'N/A'}`
).join('\n')}
` : ''}

${narrativeLandscape.dominantNarratives ? `**Dominant Industry Narratives:**
${narrativeLandscape.dominantNarratives.slice(0, 5).map((n: any) =>
  `- ${n.narrative || n.theme || 'N/A'}`
).join('\n')}
` : ''}`

    const userPrompt = `# Campaign Goal
${campaignGoal}

# Our Positioning & Key Messages (USE THESE)
${JSON.stringify(selectedPositioning, null, 2)}

# Stakeholder Groups (USE THEIR PSYCHOLOGY)
${researchData.stakeholders?.map((s: any) => `
## ${s.name}
- Biases to leverage: ${s.psychology?.biases?.join(', ') || 'None'}
- Fears that make them vulnerable to threats: ${s.psychology?.fears?.join(', ') || 'None'}
`).join('\n') || 'N/A'}

# Four-Pillar Orchestration Summary
${Object.keys(orchestrationStrategy.phases || {}).map((phase) => {
  const phaseData = orchestrationStrategy.phases[phase]
  return `**${phase}**: ${phaseData.messageTheme || phaseData.objective || 'N/A'}`
}).join('\n')}

${threatContext}

## Generate Part 4: Counter-Narrative Defense Strategy

**CRITICAL: You already have stakeholder fears and biases from research. Map these to threat scenarios.**

Create defensive playbooks for 3-4 threat scenarios (not 5 - keep it focused):

\`\`\`json
{
  "part4_counterNarrativeStrategy": {
    "defensivePosture": "Brief summary of overall defensive strategy aligned with campaign pattern",

    "threatScenarios": [
      {
        "threat": "Specific threat name",
        "description": "What this threat looks like in practice",
        "probability": "High|Medium|Low",
        "impact": "High|Medium|Low",
        "category": "Direct Attack|Credibility Challenge|Narrative Hijacking|Stakeholder Defection|Policy Threat",

        "earlyWarningSignals": [
          "Signal 1: What to monitor (social sentiment, media coverage, etc)",
          "Signal 2: Threshold that triggers response"
        ],

        "responsePlaybook": {
          "pillar1_ownedResponse": {
            "contentToCreate": [
              {
                "contentType": "blog-post|statement|faq|twitter-thread",
                "topic": "Specific response topic",
                "coreMessage": "What this communicates",
                "timing": "Within 6 hours",
                "signaldeskGenerates": "Full response content with fact-checks",
                "userExecutes": "Publish + amplify across channels"
              }
            ],
            "distributionStrategy": "Where and how to distribute response"
          },

          "pillar2_relationshipActivation": {
            "influencersToActivate": [
              {
                "stakeholderType": "Which stakeholder group to mobilize",
                "why": "Why they have credibility in this scenario",
                "ask": "Specific action we want them to take",
                "signaldeskGenerates": "Talking points + supporting data",
                "timing": "Hour 6-12"
              }
            ]
          },

          "pillar3_eventResponse": {
            "opportunities": [
              {
                "tactic": "Host emergency webinar|Hijack competitor event|Create press conference",
                "timing": "Day 2-3",
                "objective": "Control narrative in authority setting",
                "signaldeskGenerates": "Event script + Q&A prep"
              }
            ]
          },

          "pillar4_mediaStrategy": {
            "journalistsToBrief": [
              {
                "journalist": "Name from registry OR [MOCK] criteria",
                "outlet": "Publication",
                "why": "Why they're receptive to counter-story",
                "counterAngle": "Story angle that invalidates threat",
                "signaldeskGenerates": "Media briefing doc + exclusive data",
                "timing": "Hour 12-24"
              }
            ],
            "proactiveStories": [
              {
                "angle": "Positive story to shift narrative",
                "supportingData": "What evidence we provide",
                "outlets": ["Target publications"]
              }
            ]
          }
        },

        "responseTimeline": {
          "hour0to6": [
            "Immediate action 1",
            "Immediate action 2"
          ],
          "hour6to24": [
            "Momentum action 1",
            "Momentum action 2"
          ],
          "day2to7": [
            "Narrative ownership action 1",
            "Narrative ownership action 2"
          ]
        },

        "successMetrics": {
          "narrativeShift": "How we measure perception change (sentiment analysis, media tone)",
          "stakeholderResponse": "What stakeholder behavior indicates success",
          "whenToDeescalate": "Signals that threat is neutralized"
        },

        "contentSignaldeskGenerates": [
          "crisis-response-template: Full blog post addressing threat",
          "influencer-talking-points: 10 key messages for advocates",
          "media-briefing-doc: Counter-narrative with citations",
          "social-response-thread: Twitter/LinkedIn templates",
          "faq-document: Addressing all objections"
        ]
      }
      // Repeat structure for 4 more threat scenarios
    ],

    "monitoringProtocol": {
      "dailyMonitoring": [
        "Social media mentions (brand + key terms)",
        "Media coverage sentiment tracking",
        "Competitor announcement monitoring",
        "Policy/regulatory news scanning"
      ],
      "escalationTriggers": [
        "Trigger 1: When to activate Tier 1 response",
        "Trigger 2: When to activate executive team"
      ],
      "responseTeam": [
        "Role 1: Communications lead (monitoring + approval)",
        "Role 2: Content creator (rapid response execution)",
        "Role 3: Influencer liaison (stakeholder activation)"
      ]
    },

    "preemptiveDefense": {
      "narrativeArmor": [
        "Pillar 1: Maintain consistent owned content cadence (harder to hijack)",
        "Pillar 2: Deepen influencer relationships before crisis (loyal advocates)",
        "Pillar 3: Establish authority at key events (credibility bank)",
        "Pillar 4: Become journalist's go-to source (control media narrative)"
      ],
      "vulnerabilityMitigation": [
        {
          "vulnerability": "Specific weak point in positioning",
          "mitigation": "Proactive content to address before it's attacked"
        }
      ]
    }
  }
}
\`\`\`

**CRITICAL REQUIREMENTS:**
1. Generate 3-4 threat scenarios (use stakeholder FEARS from research as threats)
2. Each threat includes HIGH-LEVEL four-pillar response (not detailed playbooks)
3. Focus on strategic response, not tactical details (NIV Content generates tactics on-demand)
4. Show response timeline (key phases, not hour-by-hour)
5. Include success metrics
6. Keep it concise - this is strategic guidance, not detailed execution

Generate STRATEGIC counter-narrative framework. Detailed response content generated later by NIV Content.`

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 3000, // Reduced - just map research fears to threat scenarios
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

    let counterNarrative
    try {
      let jsonText = content.text.trim()
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```json\n?|\n?```/g, '')
      }
      counterNarrative = JSON.parse(jsonText)
    } catch (e) {
      console.error('JSON parse error:', e)
      console.error('Raw response:', content.text.substring(0, 500))
      throw new Error('Failed to parse counter-narrative strategy')
    }

    console.log('✅ Counter-narrative strategy generated successfully')

    return new Response(
      JSON.stringify(counterNarrative),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Counter-narrative generator error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
