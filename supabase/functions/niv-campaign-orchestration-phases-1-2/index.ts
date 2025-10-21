import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OrchestrationRequest {
  blueprintBase?: any // Optional - output from base generator
  researchData: any
  campaignGoal: string
  selectedPositioning: any
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { blueprintBase, researchData, campaignGoal, selectedPositioning } = await req.json() as OrchestrationRequest

    console.log('🎯 Orchestration Generator (Phases 1-2):', {
      pattern: blueprintBase?.overview?.pattern || 'Not provided',
      stakeholders: blueprintBase?.part2_stakeholderMapping?.groups?.length || researchData?.stakeholders?.length || 0,
      journalists: researchData?.channelIntelligence?.journalists?.length || 0
    })

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '',
    })

    const systemPrompt = `You are an expert in VECTOR campaign orchestration - sophisticated multi-channel influence operations.

## Your Task
Generate Part 3A: HIGH-LEVEL Strategic Framework for PHASES 1-2 ONLY (Awareness, Consideration).

This includes:
1. Strategic framework (objectives, psychology, narrative approach)
2. Simple content needs (basic topic + purpose, NOT detailed specifications)

## Core Philosophy
VECTOR campaigns engineer system states where narratives become inevitable:
- Create convergence: Multiple independent-seeming sources reinforce same theme
- Own narrative voids: Become authority on topics about to explode
- Engineer discovery: People conclude on their own rather than being told

## Four Pillars
1. **OWNED ACTIONS**: Content creation (blog posts, LinkedIn articles, Twitter threads)
2. **RELATIONSHIP ORCHESTRATION**: Influencer and analyst engagement
3. **EVENT ORCHESTRATION**: Conference presence and speaking opportunities
4. **MEDIA ENGAGEMENT**: Journalist outreach and media coverage

## IMPORTANT: Keep It Strategic, Not Tactical
Do NOT generate detailed 200-token specifications for each piece.
NIV Content V2 is SMART - it just needs simple directions + strategic context.

Output ONLY valid JSON.`

    // Extract FULL intelligence from research (don't summarize - pass it all)
    const stakeholders = researchData?.stakeholders || []
    const narrativeLandscape = researchData?.narrativeLandscape || {}
    const channelIntelligence = researchData?.channelIntelligence || {}
    const historicalInsights = researchData?.historicalInsights || {}

    console.log('📊 Intelligence available:', {
      stakeholders: stakeholders.length,
      narrativeVacuums: narrativeLandscape.narrativeVacuums?.length || 0,
      journalists: channelIntelligence.journalists?.length || 0,
      historicalPatterns: historicalInsights.patternRecommendations?.length || 0
    })

    const userPrompt = `# Campaign Goal
${campaignGoal}

# Selected Positioning (USE THESE MESSAGES)
${JSON.stringify(selectedPositioning, null, 2)}

# Stakeholder Intelligence (USE THIS PSYCHOLOGY)
${stakeholders.map((s: any) => `
## ${s.name} (${s.size?.toLocaleString() || 'Unknown size'})

**Psychology (ADDRESS THESE):**
- Values: ${s.psychology?.values?.join(', ') || 'Not specified'}
- Fears: ${s.psychology?.fears?.join(', ') || 'Not specified'} ← CRITICAL: Address in messaging
- Aspirations: ${s.psychology?.aspirations?.join(', ') || 'Not specified'} ← CRITICAL: Trigger these
- Biases: ${s.psychology?.biases?.join(', ') || 'Not specified'} ← Leverage these

**Information Diet (WHERE/WHEN TO REACH THEM):**
- Primary Sources: ${s.informationDiet?.primarySources?.join(', ') || 'Not specified'}
- Trusted Voices: ${s.informationDiet?.trustedVoices?.join(', ') || 'Not specified'} ← Use for validation
- Consumption Patterns: ${s.informationDiet?.consumptionPatterns || 'Not specified'}
- Share Drivers: ${s.informationDiet?.shareDrivers?.join(', ') || 'Not specified'} ← Content must match these

**Current State:**
- Perception of Organization: ${s.currentPerceptions?.ofOrganization || 'Unknown'}
- Journey Stage: ${s.decisionJourney?.currentStage || 'Unknown'}
- Movement Triggers: ${s.decisionJourney?.movementTriggers?.join(', ') || 'Not specified'} ← Use these to advance them
- Validation Needs: ${s.decisionJourney?.validationNeeds?.join(', ') || 'Not specified'} ← Provide these
- Social Proof Needs: ${s.decisionJourney?.socialProofRequirements?.join(', ') || 'Not specified'}

**Influence Pathways (PILLAR 2 TARGETS):**
- Direct Influencers: ${s.influencePathways?.directInfluencers?.join(', ') || 'None'}
- Peer Networks: ${s.influencePathways?.peerNetworks?.join(', ') || 'None'}
- Authority Figures: ${s.influencePathways?.authorityFigures?.join(', ') || 'None'}
`).join('\n')}

# Narrative Landscape (USE THIS POSITIONING)
${narrativeLandscape.dominantNarratives?.length > 0 ? `
**Dominant Narratives to Counter:**
${narrativeLandscape.dominantNarratives.map((n: any) =>
  `- "${n.narrative}" (${n.source}) - Resonance: ${n.resonance}
  → Counter with positioning message: "${selectedPositioning?.keyMessages?.[0] || 'TBD'}"`
).join('\n')}
` : ''}

${narrativeLandscape.narrativeVacuums?.length > 0 ? `
**Narrative Vacuums to Own:**
${narrativeLandscape.narrativeVacuums.map((v: any) =>
  `- ${v.opportunity}: ${v.rationale} (Potential: ${v.potential})`
).join('\n')}
` : ''}

${narrativeLandscape.competitivePositioning?.length > 0 ? `
**Competitive Differentiation:**
${narrativeLandscape.competitivePositioning.map((c: any) =>
  `- ${c.competitor}: "${c.positioning}"
  Strengths: ${c.strengths?.join(', ')}
  Vulnerabilities: ${c.vulnerabilities?.join(', ')} ← Our opportunity to differentiate`
).join('\n')}
` : ''}

# Channel Intelligence (USE THESE SPECIFICS)
${channelIntelligence.byStakeholder?.map((cs: any) => `
## ${cs.stakeholder} Channels
${cs.channels?.map((ch: any) =>
  `- ${ch.name} (${ch.type}): ${ch.trustLevel} trust, ${ch.reach} reach, ${ch.engagement} engagement`
).join('\n')}
- Optimal Timing: ${cs.optimalTiming}
- Content Preferences: ${cs.contentPreferences?.join(', ')}
- Amplification Opportunities: ${cs.amplificationOpportunities?.join(', ')}
`).join('\n')}

${channelIntelligence.journalists?.length > 0 ? `
**Available Journalists (USE REAL NAMES):**
${channelIntelligence.journalists.slice(0, 10).map((j: any) =>
  `- ${j.name} (${j.outlet} - ${j.beat}) - Tier ${j.tier} - ${j.relevance}`
).join('\n')}
` : ''}

# Historical Intelligence (FOLLOW THESE PATTERNS)
${historicalInsights.patternRecommendations?.length > 0 ? `
**Recommended Patterns:**
${historicalInsights.patternRecommendations.map((p: any) =>
  `- ${p.pattern}: ${p.rationale}
  Implementation: ${p.implementation}`
).join('\n')}
` : ''}

${historicalInsights.riskFactors?.length > 0 ? `
**Risks to Avoid:**
${historicalInsights.riskFactors.map((r: any) =>
  `- ${r.risk}: ${r.mitigation}`
).join('\n')}
` : ''}

## Generate Part 3A: HIGH-LEVEL Strategic Framework (Phases 1-2 ONLY)

Create HIGH-LEVEL strategic framework for ONLY the first 2 phases: Awareness and Consideration.

CRITICAL: Use intelligence to create strategic guidance, NOT detailed content specs.

**Strategic Framework Structure:**
\`\`\`json
{
  "part3_orchestrationStrategy": {
    "phases": {
      "phase1_awareness": {
        "objective": "Move [stakeholder] from [current state] to [target state]",
        "duration": "Weeks 1-3",
        "stakeholderFocus": ["Primary stakeholders from research"],
        "messageTheme": "ONE core narrative that owns a narrative vacuum",

        "psychologicalStrategy": {
          "primaryFear": "Specific fear from stakeholder psychology",
          "fearMitigation": "How positioning message addresses this fear",
          "aspirationTrigger": "Which aspiration this phase activates",
          "biasToLeverage": "Which cognitive bias we're using"
        },

        "narrativeApproach": {
          "counterNarrative": "Which dominant narrative we're countering",
          "vacuumToOwn": "Which narrative vacuum we're claiming",
          "positioningAlignment": "Which positioning message this validates",
          "competitiveDifferentiation": "How this distinguishes from competitor X"
        },

        "pillar1_ownedActions": {
          "strategy": "CEO establishes augmentation narrative via thought leadership",
          "channelStrategy": "LinkedIn (90% reach, high trust, optimal: Tue 8-10am)",
          "messageThemes": ["Theme 1", "Theme 2", "Theme 3"],
          "cadence": "2-3x per week",
          "contentNeeds": [
            {
              "contentType": "blog-post",
              "topic": "Why we built for teams, not soloists",
              "purpose": "Establish augmentation narrative",
              "keyMessages": ["Teams 10x productive", "Preserves creativity"],
              "targetStakeholder": "Enterprise CTOs",
              "timing": "Week 1"
            },
            {
              "contentType": "linkedin-article",
              "topic": "Augmentation vs automation decision",
              "purpose": "Reinforce narrative with framework",
              "keyMessages": ["Augmentation preserves control"],
              "targetStakeholder": "Creative Directors",
              "timing": "Week 2"
            }
          ]
        },

        "pillar2_relationshipOrchestration": {
          "strategy": "Brief analysts with data to gain authority validation",
          "primaryInfluencers": ["Industry Analysts", "CTO influencers"],
          "contentNeeds": [
            {
              "contentType": "white-paper",
              "topic": "Enterprise AI adoption maturity model",
              "purpose": "Analyst briefing document",
              "keyMessages": ["5-stage framework"],
              "targetStakeholder": "Industry Analysts",
              "timing": "Week 1"
            }
          ]
        },

        "pillar3_eventOrchestration": {
          "strategy": "Legitimize through authority presence at conferences",
          "contentNeeds": [
            {
              "contentType": "talking-points",
              "topic": "Panel discussion prep",
              "purpose": "Event speaking preparation",
              "keyMessages": ["Augmentation narrative"],
              "timing": "Week 2"
            }
          ]
        },

        "pillar4_mediaEngagement": {
          "strategy": "Secure tier 1 validation through data stories",
          "journalist": "Real journalist name from research",
          "contentNeeds": [
            {
              "contentType": "media-pitch",
              "topic": "Exclusive survey data story",
              "purpose": "Secure media coverage",
              "keyMessages": ["Data validates narrative"],
              "targetStakeholder": "Tech journalists",
              "timing": "Week 3"
            }
          ]
        },

        "convergenceStrategy": {
          "week1": "CEO seeds + analysts briefed",
          "week2": "Analyst mentions begin",
          "week3": "Media validates",
          "systemState": "Stakeholder encounters from 4 sources = inevitability"
        }
      },

      "phase2_consideration": {
        // Same structure, different focus
      }
    }
  }
}
\`\`\`

**INSTRUCTIONS:**
1. **Use intelligence** from research for specific strategies
2. **Keep contentNeeds SIMPLE** - just contentType, topic, purpose, keyMessages, timing
3. **NO detailed 200-token specs** - NIV Content V2 is smart enough to generate from this
4. **Show convergence** - how pillars reinforce each other
5. **2-4 content needs per pillar** - not 10+

Generate HIGH-LEVEL strategic framework only.`

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000, // High-level framework only (2 phases × 4 pillars × ~250 tokens)
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

    let orchestration
    try {
      let jsonText = content.text.trim()
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```json\n?|\n?```/g, '')
      }
      orchestration = JSON.parse(jsonText)
    } catch (e) {
      console.error('JSON parse error:', e)
      console.error('Raw response:', content.text.substring(0, 500))
      throw new Error('Failed to parse orchestration strategy')
    }

    console.log('✅ Orchestration strategy generated successfully')

    return new Response(
      JSON.stringify(orchestration),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Orchestration generator error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
