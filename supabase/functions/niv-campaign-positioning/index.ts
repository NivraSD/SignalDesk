import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PositioningRequest {
  researchData: any
  campaignGoal: string
  refinementRequest?: string
}

interface PositioningOption {
  id: number
  name: string
  tagline: string
  description: string
  rationale: string
  targetAudiences: string[]
  keyMessages: string[]
  differentiators: string[]
  risks: string[]
  opportunities: string[]
  confidenceScore: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { researchData, campaignGoal, refinementRequest } = await req.json() as PositioningRequest

    console.log('Positioning Generator:', {
      goal: campaignGoal.substring(0, 50),
      hasRefinement: !!refinementRequest,
      hasResearchData: !!researchData,
      researchKeys: researchData ? Object.keys(researchData) : [],
      stakeholdersCount: researchData?.stakeholders?.length || 0
    })

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '',
    })

    // Build context from research
    const researchContext = buildResearchContext(researchData)

    const systemPrompt = `You are an expert strategic communications advisor specializing in campaign positioning.

Your task is to analyze comprehensive research data and generate 3 distinct, strategically sound positioning options for a campaign.

Each positioning option should:
1. Be grounded in the research findings
2. Address specific opportunities or threats identified
3. Differentiate from competitors
4. Resonate with key stakeholder groups
5. Be executable and measurable

Output ONLY valid JSON matching this exact structure:
{
  "options": [
    {
      "id": 1,
      "name": "Positioning Name (2-4 words)",
      "tagline": "Compelling 1-sentence tagline",
      "description": "2-3 sentence description of the positioning",
      "rationale": "Why this positioning works based on research findings",
      "targetAudiences": ["audience1", "audience2", "audience3"],
      "keyMessages": ["message1", "message2", "message3"],
      "differentiators": ["diff1", "diff2", "diff3"],
      "risks": ["risk1", "risk2"],
      "opportunities": ["opp1", "opp2", "opp3"],
      "confidenceScore": 85
    }
  ],
  "recommendation": "Brief explanation of which option is recommended and why"
}`

    const userPrompt = `# Campaign Goal
${campaignGoal}

# Research Findings

${researchContext}

${refinementRequest ? `\n# Refinement Request\n${refinementRequest}\n` : ''}

Based on this research, generate 3 distinct positioning options that would effectively achieve the campaign goal. Each should take a different strategic approach (e.g., defensive vs offensive, innovation-focused vs trust-focused, etc.).

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

    // Parse the JSON response
    let positioning
    try {
      // Extract JSON from response (handles markdown code blocks)
      let jsonText = content.text.trim()
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```json\n?|\n?```/g, '')
      }
      positioning = JSON.parse(jsonText)
    } catch (e) {
      console.error('JSON parse error:', e)
      console.error('Raw response:', content.text)
      throw new Error('Failed to parse positioning options')
    }

    return new Response(
      JSON.stringify(positioning),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Positioning generator error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

function buildResearchContext(research: any): string {
  let context = ''

  // Stakeholders (from CampaignIntelligenceBrief)
  if (research.stakeholders && research.stakeholders.length > 0) {
    context += `## Stakeholder Intelligence\n`
    context += `**Key Stakeholder Groups:** ${research.stakeholders.map((s: any) => s.name).join(', ')}\n\n`

    research.stakeholders.forEach((s: any) => {
      context += `**${s.name}** (${s.size?.toLocaleString()} people)\n`
      if (s.psychology) {
        context += `- Values: ${s.psychology.values?.join(', ')}\n`
        context += `- Fears: ${s.psychology.fears?.join(', ')}\n`
        context += `- Aspirations: ${s.psychology.aspirations?.join(', ')}\n`
      }
      if (s.currentPerceptions) {
        context += `- Current Perception: ${s.currentPerceptions.ofOrganization}\n`
      }
      context += `\n`
    })
  }

  // Narrative Landscape
  if (research.narrativeLandscape) {
    context += `## Narrative Landscape\n`

    if (research.narrativeLandscape.dominantNarratives?.length > 0) {
      context += `**Dominant Narratives:**\n`
      research.narrativeLandscape.dominantNarratives.slice(0, 5).forEach((n: any) => {
        context += `- ${n.narrative} (${n.source})\n`
      })
      context += `\n`
    }

    if (research.narrativeLandscape.narrativeVacuums?.length > 0) {
      context += `**Narrative Opportunities:**\n`
      research.narrativeLandscape.narrativeVacuums.forEach((v: any) => {
        context += `- ${v.opportunity}: ${v.rationale}\n`
      })
      context += `\n`
    }

    if (research.narrativeLandscape.competitivePositioning?.length > 0) {
      context += `**Competitive Landscape:**\n`
      research.narrativeLandscape.competitivePositioning.forEach((c: any) => {
        context += `- ${c.competitor}: ${c.positioning}\n`
      })
      context += `\n`
    }
  }

  // Channel Intelligence
  if (research.channelIntelligence) {
    context += `## Channel Intelligence\n`

    if (research.channelIntelligence.journalists?.length > 0) {
      context += `**Key Journalists:** ${research.channelIntelligence.journalists.slice(0, 5).map((j: any) => `${j.name} (${j.outlet})`).join(', ')}\n\n`
    }

    if (research.channelIntelligence.publications?.length > 0) {
      context += `**Key Publications:** ${research.channelIntelligence.publications.map((p: any) => p.name).join(', ')}\n\n`
    }
  }

  // Historical Insights
  if (research.historicalInsights) {
    context += `## Historical Insights\n`

    if (research.historicalInsights.successfulCampaigns?.length > 0) {
      context += `**Successful Campaign Patterns:**\n`
      research.historicalInsights.successfulCampaigns.slice(0, 3).forEach((c: any) => {
        context += `- ${c.campaign}: ${c.approach}\n`
      })
      context += `\n`
    }

    if (research.historicalInsights.patternRecommendations?.length > 0) {
      context += `**Pattern Recommendations:**\n`
      research.historicalInsights.patternRecommendations.forEach((p: any) => {
        context += `- ${p.pattern}: ${p.rationale}\n`
      })
      context += `\n`
    }

    if (research.historicalInsights.riskFactors?.length > 0) {
      context += `**Risk Factors to Avoid:**\n`
      research.historicalInsights.riskFactors.forEach((r: any) => {
        context += `- ${r.risk}: ${r.mitigation}\n`
      })
      context += `\n`
    }
  }

  // Key Insights
  if (research.keyInsights?.length > 0) {
    context += `## Key Strategic Insights\n`
    research.keyInsights.forEach((i: any) => {
      context += `- [${i.significance.toUpperCase()}] ${i.insight}\n`
      context += `  Action: ${i.actionImplication}\n\n`
    })
  }

  return context || '## No research data available\n'
}
