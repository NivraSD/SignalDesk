import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PRBlueprintRequest {
  researchData: any
  campaignGoal: string
  selectedPositioning: any
  refinementRequest?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { researchData, campaignGoal, selectedPositioning, refinementRequest } = await req.json() as PRBlueprintRequest

    console.log('PR Blueprint Generator:', {
      goal: campaignGoal.substring(0, 50),
      positioning: selectedPositioning?.name,
      hasRefinement: !!refinementRequest
    })

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '',
    })

    const systemPrompt = `You are an expert PR strategist creating comprehensive campaign blueprints.

Create a detailed PR Campaign blueprint that is immediately actionable and grounded in research.

Output ONLY valid JSON matching this exact structure:
{
  "overview": {
    "campaignName": "Compelling campaign name",
    "tagline": "Brief tagline",
    "duration": "6-8 weeks",
    "budget": "$50,000-$100,000",
    "objective": "Clear, measurable objective"
  },
  "pressReleaseStrategy": {
    "primaryRelease": {
      "headline": "Attention-grabbing headline",
      "angle": "News angle",
      "timing": "When to release",
      "hooks": ["hook1", "hook2", "hook3"]
    },
    "followUpReleases": [
      {
        "headline": "Second release headline",
        "timing": "Week 2-3",
        "angle": "Different angle"
      }
    ]
  },
  "mediaTargeting": {
    "tier1Outlets": [
      {
        "outlet": "Outlet name",
        "journalist": "Name or beat",
        "angle": "Why this outlet",
        "timing": "When to pitch"
      }
    ],
    "tier2Outlets": ["outlet1", "outlet2"],
    "industryPublications": ["pub1", "pub2"]
  },
  "spokespersonPositioning": {
    "primarySpokesperson": "Role/title",
    "expertise": "Key expertise areas",
    "talkingPoints": ["point1", "point2", "point3"],
    "mediaTraining": "Recommended training focus"
  },
  "keyMessages": {
    "primary": "Main message",
    "supporting": ["support1", "support2", "support3"],
    "proofPoints": ["proof1", "proof2"]
  },
  "timeline": {
    "week1": ["task1", "task2"],
    "week2": ["task1", "task2"],
    "week3": ["task1", "task2"],
    "week4": ["task1", "task2"]
  },
  "successMetrics": {
    "tier1Placements": "Target number",
    "totalPlacements": "Target number",
    "socialReach": "Target reach",
    "websiteTraffic": "Target increase"
  },
  "risks": [
    {
      "risk": "Risk description",
      "mitigation": "How to mitigate"
    }
  ],
  "budget": {
    "distribution": "$50k",
    "mediaMonitoring": "$10k",
    "other": "$5k"
  }
}`

    const userPrompt = `# Campaign Goal
${campaignGoal}

# Selected Positioning
**${selectedPositioning?.name || 'Not specified'}**
${selectedPositioning?.description || ''}

# Research Context
${buildResearchSummary(researchData)}

${refinementRequest ? `\n# Refinement Request\n${refinementRequest}\n` : ''}

Create a comprehensive PR Campaign blueprint that achieves the campaign goal using the selected positioning and leveraging the research insights.

Focus on practical, actionable tactics with specific outlets, journalists, and timelines based on the research.

Output valid JSON only.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
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

    let blueprint
    try {
      let jsonText = content.text.trim()
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```json\n?|\n?```/g, '')
      }
      blueprint = JSON.parse(jsonText)
    } catch (e) {
      console.error('JSON parse error:', e)
      console.error('Raw response:', content.text)
      throw new Error('Failed to parse PR blueprint')
    }

    return new Response(
      JSON.stringify(blueprint),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('PR Blueprint error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

function buildResearchSummary(research: any): string {
  let summary = ''

  if (research?.organizationContext) {
    summary += `**Organization:** ${research.organizationContext.summary?.substring(0, 200) || 'N/A'}\n\n`
  }

  if (research?.stakeholderIntelligence) {
    summary += `**Key Stakeholders:** ${research.stakeholderIntelligence.summary?.substring(0, 200) || 'N/A'}\n\n`
  }

  if (research?.narrativeEnvironment) {
    summary += `**Narrative Environment:** ${research.narrativeEnvironment.summary?.substring(0, 200) || 'N/A'}\n\n`
  }

  if (research?.channelIntelligence?.outlets) {
    const outlets = research.channelIntelligence.outlets.slice(0, 5).map((o: any) => o.name || o).join(', ')
    summary += `**Key Media Outlets:** ${outlets}\n\n`
  }

  if (research?.competitiveMovements) {
    summary += `**Competitive Landscape:** ${research.competitiveMovements.summary?.substring(0, 200) || 'N/A'}\n\n`
  }

  return summary
}
