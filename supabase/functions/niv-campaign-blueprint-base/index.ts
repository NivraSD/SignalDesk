import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BlueprintBaseRequest {
  researchData: any
  campaignGoal: string
  selectedPositioning: any
  organizationContext: {
    name: string
    industry: string
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { researchData, campaignGoal, selectedPositioning, organizationContext } = await req.json() as BlueprintBaseRequest

    console.log('📋 Blueprint Base Generator:', {
      goal: campaignGoal.substring(0, 50),
      positioning: selectedPositioning?.name,
      org: organizationContext.name
    })

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '',
    })

    const systemPrompt = `You are an expert VECTOR campaign strategist generating the foundation of a sophisticated influence operation.

Your task: Generate Parts 1-2 of the blueprint (Goal Framework + Stakeholder Mapping) plus Message Architecture.

## Critical Requirements:
1. **Behavioral Goals**: Specific actions we want each stakeholder to take
2. **Psychological Profiles**: Values, fears, aspirations, decision drivers
3. **Information Diet**: Where they get info, who they trust
4. **Message Architecture**: How the SAME core theme appears different across stakeholders and channels

## Message Architecture Structure:
Create a message architecture that shows:
- Core strategic message (the one thing we want to own)
- How it layers across different stakeholders (what resonates with each)
- How it appears through different channels (owned, relationships, events, media)
- Why this creates convergence (multiple independent sources saying similar things)

Output ONLY valid JSON.`

    const userPrompt = `# Campaign Goal
${campaignGoal}

# Selected Positioning
**${selectedPositioning?.name || 'Not specified'}**
${selectedPositioning?.description || ''}
${selectedPositioning?.rationale || ''}

# Target Audiences
${selectedPositioning?.targetAudiences?.join(', ') || 'Not specified'}

# Research Intelligence
${buildResearchContext(researchData)}

# Organization Context
- Name: ${organizationContext.name}
- Industry: ${organizationContext.industry}

## Generate Blueprint Foundation

Create parts 1-2 plus message architecture:

\`\`\`json
{
  "overview": {
    "campaignName": "Compelling campaign name",
    "pattern": "CASCADE|MIRROR|CHORUS|TROJAN|NETWORK",
    "patternRationale": "Why this pattern fits the stakeholders and goal",
    "duration": "12 weeks",
    "complexity": "High",
    "objective": "Specific behavioral objective"
  },

  "part1_goalFramework": {
    "primaryObjective": "Measurable objective tied to business outcome",
    "behavioralGoals": [
      {
        "stakeholder": "Specific stakeholder group",
        "desiredBehavior": "Exact action we want (adopt tool, cite research, attend event, etc)",
        "currentState": "Where they are now",
        "successMetric": "How we measure this behavior change"
      }
    ],
    "kpis": ["Specific KPI 1", "Specific KPI 2", "Specific KPI 3"],
    "successCriteria": "What complete success looks like",
    "riskAssessment": [
      {
        "risk": "Specific risk",
        "probability": "High|Medium|Low",
        "impact": "What happens if this occurs",
        "mitigation": "How we prevent/handle this"
      }
    ]
  },

  "part2_stakeholderMapping": {
    "groups": [
      {
        "name": "Specific stakeholder group name",
        "size": "Estimated size",
        "psychologicalProfile": {
          "values": ["value1", "value2"],
          "fears": ["fear1", "fear2"],
          "aspirations": ["aspiration1"],
          "decisionDrivers": ["What makes them act", "What they optimize for"]
        },
        "informationDiet": {
          "primarySources": ["Where they get info"],
          "trustedVoices": ["Who they listen to"],
          "consumptionHabits": "How they consume information"
        },
        "decisionTriggers": ["What makes them take action"],
        "currentPerception": "How they currently see the topic/category",
        "targetPerception": "How we want them to see it",
        "barriers": ["What prevents them from desired behavior"]
      }
    ],
    "stakeholderRelationships": "How groups influence each other (who listens to who)",
    "priorityOrder": ["group1", "group2", "group3"]
  },

  "messageArchitecture": {
    "coreMessage": "The ONE strategic message we own",
    "messageRationale": "Why this message creates system-level change",

    "stakeholderLayers": [
      {
        "stakeholder": "Stakeholder group name",
        "messageVariation": "How core message resonates with THIS group",
        "psychologicalHook": "What value/fear/aspiration this taps into",
        "proofPoints": ["What evidence matters to them"]
      }
    ],

    "channelLayers": {
      "ownedContent": "How message appears in our blog posts, LinkedIn, etc",
      "relationshipContent": "How message appears when influencers share (more authentic)",
      "eventContent": "How message appears at conferences (more authoritative)",
      "mediaContent": "How message appears in press coverage (third-party validation)"
    },

    "convergenceThesis": "Why encountering this message from 4 different angles (owned, relationships, events, media) creates perception of inevitability and truth"
  }
}
\`\`\`

Generate comprehensive foundation with deep psychological insight and message architecture.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 6000,
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

    let blueprintBase
    try {
      let jsonText = content.text.trim()
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```json\n?|\n?```/g, '')
      }
      blueprintBase = JSON.parse(jsonText)
    } catch (e) {
      console.error('JSON parse error:', e)
      console.error('Raw response:', content.text)
      throw new Error('Failed to parse blueprint base')
    }

    console.log('✅ Blueprint base generated successfully')

    return new Response(
      JSON.stringify(blueprintBase),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Blueprint base error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

function buildResearchContext(research: any): string {
  let context = ''

  // Stakeholders
  if (research?.stakeholders && research.stakeholders.length > 0) {
    context += `## Stakeholders (${research.stakeholders.length} groups identified)\n`
    research.stakeholders.slice(0, 3).forEach((s: any) => {
      context += `**${s.name}**: ${s.size?.toLocaleString() || 'N/A'} people\n`
      if (s.psychology) {
        context += `- Values: ${s.psychology.values?.join(', ')}\n`
        context += `- Fears: ${s.psychology.fears?.join(', ')}\n`
      }
    })
    context += `\n`
  }

  // Narratives
  if (research?.narrativeLandscape?.dominantNarratives) {
    context += `## Current Narratives\n`
    research.narrativeLandscape.dominantNarratives.slice(0, 3).forEach((n: any) => {
      context += `- ${n.narrative}\n`
    })
    context += `\n`
  }

  return context || '## Limited research data available\n'
}
