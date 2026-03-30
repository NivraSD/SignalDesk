import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.27.3'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * GEO SYNTHESIS
 *
 * Analyzes GEO test results and generates actionable recommendations for campaign tactics.
 * Similar to geo-intelligence-monitor synthesis, but campaign-focused.
 *
 * Outputs:
 * - Gap analysis: Which queries you own vs don't own
 * - Schema opportunities: Specific schema markup to add (auto-executable)
 * - Content recommendations: Content that will help own target queries
 * - Priority actions: Ordered by impact
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const {
      organization_id,
      organization_name,
      campaign_goal,
      positioning,
      queries,
      results,
      citationSources,
      ownedQueries,
      unownedQueries
    } = await req.json()

    console.log('🧠 GEO Synthesis Starting:', {
      organization_name,
      campaign_goal,
      totalQueries: queries?.length || 0,
      ownedQueries: ownedQueries?.length || 0,
      unownedQueries: unownedQueries?.length || 0,
      citationSources: citationSources?.length || 0
    })

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY')
    })

    // Build synthesis prompt
    const prompt = `You are a GEO (Generative Experience Optimization) strategist analyzing AI platform test results for a campaign.

# CAMPAIGN CONTEXT
Organization: ${organization_name}
Campaign Goal: ${campaign_goal}
Positioning: ${positioning?.name || 'N/A'}

# TEST RESULTS SUMMARY
Total Queries Tested: ${queries?.length || 0}
Queries WHERE YOU'RE MENTIONED: ${ownedQueries?.length || 0}
Queries WHERE YOU'RE NOT MENTIONED: ${unownedQueries?.length || 0}

## Queries You OWN (currently mentioned):
${ownedQueries?.map((q: string) => `- "${q}"`).join('\n') || 'None'}

## Queries You DON'T OWN (not mentioned - OPPORTUNITY):
${unownedQueries?.map((q: string) => `- "${q}"`).join('\n') || 'None'}

## Citation Sources (publications AI platforms trust):
${citationSources?.slice(0, 15).map((c: any) => `- ${c.title} (${c.url})`).join('\n') || 'None found'}

# YOUR TASK
Generate actionable recommendations for this SPECIFIC CAMPAIGN to help own the unowned queries.

Return JSON with:
{
  "gapAnalysis": "Brief analysis of what's missing (2-3 sentences)",
  "schemaOpportunities": [
    {
      "title": "Add FAQ schema for [query]",
      "description": "What to add",
      "query": "Which query this helps own",
      "schemaType": "FAQPage" | "HowTo" | "Product" | "Organization",
      "implementation": "Specific JSON-LD code to add",
      "expectedImpact": "Why this will help",
      "priority": 1-3,
      "autoExecutable": true
    }
  ],
  "contentRecommendations": [
    {
      "title": "Write blog post about [topic]",
      "description": "What to create",
      "contentType": "blog_post" | "case_study" | "whitepaper" | "press_release",
      "targetQueries": ["query1", "query2"],
      "keyPoints": ["point 1", "point 2", "point 3"],
      "expectedImpact": "How this helps own queries",
      "priority": 1-3,
      "tacticalMapping": "Which campaign tactic this supports"
    }
  ],
  "priorityActions": [
    "Ordered list of 3-5 most impactful actions to take first"
  ]
}

IMPORTANT:
1. Schema opportunities should be SPECIFIC and AUTO-EXECUTABLE (include actual JSON-LD code)
2. Content recommendations should map to SPECIFIC CAMPAIGN TACTICS (media pitches, thought leadership, etc)
3. Focus on UNOWNED queries - those are the opportunities
4. Prioritize actions that will have FASTEST impact on AI visibility
5. All recommendations should serve the campaign goal: "${campaign_goal}"

Return ONLY valid JSON, no markdown.`

    console.log('🤖 Calling Claude for synthesis...')

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      temperature: 0.3,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    const textContent = message.content.find((block: any) => block.type === 'text')
    if (!textContent) {
      throw new Error('No text response from Claude')
    }

    // Parse JSON response
    let synthesis
    try {
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/)
      synthesis = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(textContent.text)
    } catch (parseError) {
      console.error('Failed to parse synthesis JSON:', textContent.text)
      throw new Error('Failed to parse synthesis response')
    }

    console.log('✅ GEO Synthesis Complete:', {
      gapAnalysis: synthesis.gapAnalysis?.substring(0, 50),
      schemaOpportunities: synthesis.schemaOpportunities?.length || 0,
      contentRecommendations: synthesis.contentRecommendations?.length || 0,
      priorityActions: synthesis.priorityActions?.length || 0
    })

    return new Response(
      JSON.stringify({ synthesis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ GEO Synthesis Error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        synthesis: {
          gapAnalysis: 'Synthesis failed - using basic analysis',
          schemaOpportunities: [],
          contentRecommendations: [],
          priorityActions: []
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
