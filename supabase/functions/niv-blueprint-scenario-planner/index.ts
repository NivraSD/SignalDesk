import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ScenarioPlannerRequest {
  campaignGoal: string
  researchData: any
  selectedPositioning: any
  influenceStrategies: any
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
      selectedPositioning,
      influenceStrategies,
      orgId
    } = await req.json() as ScenarioPlannerRequest

    console.log('🎯 Scenario Planner:', {
      goal: campaignGoal.substring(0, 50),
      stakeholderCount: influenceStrategies?.influenceStrategies?.length || 0,
      competitorCount: researchData?.competitiveLandscape?.competitors?.length || 0
    })

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '',
    })

    const systemPrompt = `You are an expert in crisis communication and counter-narrative strategy for B2B campaigns.

## Your Task
Generate threat scenarios and response playbooks for VECTOR campaigns.

## Key Principles
1. **Anticipate, Don't React**: Identify threats before they happen
2. **Stakeholder-Specific**: Different stakeholders react differently to same threat
3. **Speed is Critical**: Pre-written responses enable rapid deployment
4. **Evidence-Based**: Counter with proof, not defensiveness
5. **Redirect to Positioning**: Use threats as opportunities to reinforce positioning

## Threat Categories
- **Competitive Attacks**: Competitor FUD, feature comparisons, pricing attacks
- **Technical Failures**: Outages, bugs, security incidents
- **Market Shifts**: New entrant, technology obsolescence, regulatory changes
- **Stakeholder Defection**: Key influencer/customer switches to competitor
- **Social/Reputation**: Negative social media, employee reviews, thought leader criticism

## Response Playbook Structure
For each scenario:
- **Threat description**: What happens
- **Stakeholder impact**: Which stakeholders are affected, how they react
- **Response timeline**: Immediate (0-2h), Short-term (2-24h), Medium-term (1-7d)
- **Counter-narrative**: Core message that redirects to positioning
- **Evidence required**: Proof points, data, testimonials needed
- **Channel strategy**: Where to deploy response (owned, relationships, media)
- **Escalation triggers**: When to activate CEO, PR agency, legal

Output ONLY valid JSON:
{
  "threatScenarios": [{
    "scenarioId": "scenario-1",
    "category": "Competitive Attack",
    "threatDescription": "Competitor launches 'Why customers leave [OurProduct]' campaign",
    "likelihood": "Medium",
    "potentialImpact": "High",
    "affectedStakeholders": [{
      "stakeholder": "Enterprise IT Directors",
      "psychologicalTrigger": "Loss aversion activated",
      "likelyReaction": "Pause evaluations, request competitive analysis"
    }],
    "responsePlaybook": {
      "immediate_0to2h": {
        "action": "Activate social listening, pull customer success data",
        "messageTheme": "Let data speak",
        "channels": ["Twitter", "LinkedIn"]
      },
      "shortTerm_2to24h": {
        "action": "Deploy customer testimonials, publish retention data",
        "counterNarrative": "Our 98% retention rate tells the real story",
        "evidenceNeeded": ["Retention metrics", "G2 reviews", "Customer quotes"],
        "channels": ["Blog", "Email to prospects", "Media statement"]
      },
      "mediumTerm_1to7d": {
        "action": "Influencer activation, customer webinar, analyst briefing",
        "positioningReinforcement": "Reliability + Velocity positioning",
        "contentToCreate": ["Customer case study", "Analyst validation", "Comparison guide"]
      }
    },
    "escalationTriggers": [
      "Media inquiry from Tier 1 outlet",
      "C-level prospect raises concern",
      "3+ social posts from verified accounts"
    ],
    "preApprovedResponses": {
      "socialMedia": "Template for quick deployment",
      "mediaStatement": "Pre-approved holding statement",
      "customerEmail": "Reassurance message to existing customers"
    }
  }]
}`

    const userPrompt = `# Campaign Goal
${campaignGoal}

# POSITIONING (Our Core Message)
${JSON.stringify(selectedPositioning, null, 2)}

# STAKEHOLDER PSYCHOLOGY (Fears/Triggers)
${JSON.stringify(influenceStrategies?.influenceStrategies?.map((s: any) => ({
  stakeholder: s.stakeholder,
  primaryFear: s.psychologicalProfile?.primaryFear,
  decisionTrigger: s.psychologicalProfile?.decisionTrigger
})) || [], null, 2)}

# COMPETITIVE LANDSCAPE
${JSON.stringify(researchData?.competitiveLandscape?.competitors?.slice(0, 3) || [], null, 2)}

# KNOWN VULNERABILITIES
${JSON.stringify(researchData?.internalChallenges || 'None identified', null, 2)}

## Instructions

Generate 3-5 threat scenarios across different categories:
1. At least 1 competitive attack scenario
2. At least 1 technical/operational scenario
3. At least 1 stakeholder defection scenario

For EACH scenario:
1. **Assess likelihood** (High/Medium/Low) based on competitive landscape
2. **Map stakeholder impact** - which psychological triggers are activated
3. **Create response playbook** with immediate, short-term, and medium-term actions
4. **Define counter-narrative** that redirects to our positioning
5. **Specify evidence** needed to back up response
6. **Set escalation triggers** for when to involve leadership

Focus on scenarios that:
- Directly threaten stakeholder confidence
- Attack our positioning differentiators
- Activate stakeholder fears identified in research

Pre-write actual response templates where possible.

Output valid JSON with 3-5 complete scenarios.`

    const startTime = Date.now()

    // Retry logic for JSON parsing
    let scenarios
    let attempts = 0
    const maxAttempts = 3

    while (attempts < maxAttempts) {
      attempts++
      try {
        console.log(`Attempt ${attempts}/${maxAttempts} to generate scenarios...`)

        const message = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 3500,
          temperature: 0.7,
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

        scenarios = JSON.parse(jsonText)

        // Validate structure
        if (!scenarios.threatScenarios || scenarios.threatScenarios.length < 3) {
          throw new Error('Need at least 3 threat scenarios')
        }

        console.log(`✅ Valid scenarios generated on attempt ${attempts}`)
        break

      } catch (error) {
        console.warn(`Attempt ${attempts} failed: ${error.message}`)
        if (attempts >= maxAttempts) {
          console.error('All attempts failed. Last error:', error.message)
          throw new Error(`Failed to generate scenarios after ${maxAttempts} attempts: ${error.message}`)
        }
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    const elapsedTime = Date.now() - startTime
    console.log(`✅ Scenario planning complete: ${scenarios.threatScenarios.length} scenarios in ${elapsedTime}ms`)

    return new Response(
      JSON.stringify(scenarios),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Scenario planner error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
