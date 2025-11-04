// GEO Campaign Intelligence Layer
// Lightweight intelligence gathering for campaign builder (no orchestrator - called from frontend)
// Provides AI query ownership context for VECTOR campaigns

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.24.3'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GeoIntelligenceRequest {
  organization_id: string
  organization_name: string
  industry: string
  campaign_goal: string
  stakeholders?: any[]  // From campaign research
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      organization_id,
      organization_name,
      industry,
      campaign_goal,
      stakeholders = []
    } = await req.json() as GeoIntelligenceRequest

    console.log('🎯 GEO Campaign Intelligence:', {
      organization: organization_name,
      industry,
      goal: campaign_goal
    })

    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '',
    })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // STEP 1: Generate target queries using geo-query-discovery
    console.log('🔍 Discovering target AI queries...')
    const queryResponse = await fetch(
      `${supabaseUrl}/functions/v1/geo-query-discovery`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organization_id,
          organization_name,
          industry
        })
      }
    )

    if (!queryResponse.ok) {
      throw new Error('Query discovery failed')
    }

    const queryData = await queryResponse.json()
    const targetQueries = queryData.queries || []

    console.log(`✅ Discovered ${targetQueries.length} target queries`)

    // STEP 2: Analyze citation sources and content type recommendations
    console.log('📊 Analyzing AI citation patterns...')

    const systemPrompt = `You are a GEO (Generative Engine Optimization) strategist analyzing AI platform behavior.

## Your Task
Given an organization's campaign goal and target queries, provide intelligence on:
1. Which publications/domains AI platforms cite most for these queries
2. What content types have highest citation rates
3. Schema opportunities for direct AI optimization
4. How to map traditional comms tactics to AI query ownership

## AI Platform Citation Patterns

**ChatGPT (GPT-4o)**:
- Highly cited: TechCrunch, ArsTechnica, Verge, official docs, G2, Capterra
- Citation rate by content: Structured schemas 75%, Official docs 70%, Tier-1 media 65%, G2/reviews 60%, Blog posts 40%
- Queries: Product comparisons, how-to, best [category], features

**Claude (Anthropic)**:
- Highly cited: Academic papers, thoughtful analysis, official documentation
- Citation rate: Long-form analysis 65%, Technical docs 70%, Thoughtful essays 50%, News 45%
- Queries: Deep analysis, ethical considerations, technical implementation

**Perplexity**:
- Highly cited: Cited sources with authority signals, recent content, diverse perspectives
- Citation rate: Research papers 75%, News 70%, Official docs 65%, Analysis 55%
- Queries: Research-oriented, data-driven, comparative analysis

**Gemini (Google)**:
- Highly cited: Google-indexed content, structured data, authoritative domains
- Citation rate: Schemas 75%, High-authority sites 60%, Google News 55%
- Queries: Factual queries, definitions, broad comparisons

## Output Format
Return ONLY valid JSON matching this structure:

{
  "targetQueries": [
    {
      "query": "best CRM for enterprise",
      "priority": "high" | "medium" | "low",
      "platforms": ["ChatGPT", "Perplexity"],
      "currentVisibility": "none" | "low" | "medium" | "high",
      "intent": "transactional" | "commercial" | "informational"
    }
  ],
  "citationSources": [
    {
      "domain": "techcrunch.com",
      "citationRate": 80,
      "platforms": ["ChatGPT", "Perplexity"],
      "contentTypes": ["news", "analysis"],
      "rationale": "TechCrunch cited in 80% of enterprise software queries on ChatGPT"
    }
  ],
  "schemaOpportunities": [
    {
      "type": "Product",
      "priority": 1,
      "impactScore": 90,
      "targetQueries": ["best CRM", "CRM features"],
      "platforms": ["ChatGPT", "Gemini"],
      "rationale": "Product schema has 75% citation rate across all platforms"
    }
  ],
  "contentRecommendations": [
    {
      "tacticType": "media_pitch" | "thought_leadership" | "documentation" | "social_post",
      "priority": 1,
      "targetQueries": ["query1", "query2"],
      "citationImpact": "high" | "medium" | "low",
      "rationale": "Why this tactic type helps own target queries",
      "targetOutlets": ["outlet1", "outlet2"]
    }
  ],
  "queryOwnershipMap": {
    "media_coverage": {
      "targetQueries": ["query1", "query2"],
      "expectedImpact": "Description of impact",
      "timeline": "2-4 weeks"
    },
    "documentation": {
      "targetQueries": ["query3"],
      "expectedImpact": "Impact description",
      "timeline": "1-2 weeks"
    }
  }
}`

    const userPrompt = `Analyze AI query ownership opportunities for this campaign:

**Organization**: ${organization_name}
**Industry**: ${industry}
**Campaign Goal**: ${campaign_goal}

**Target Stakeholders** (human audiences we're trying to reach):
${stakeholders.length > 0 ? stakeholders.map((s: any) => `- ${s.name || s}`).join('\n') : 'Not yet identified'}

**Discovered AI Queries** (what people ask AI about ${organization_name}):
${targetQueries.slice(0, 20).map((q: any) =>
  `- "${q.query}" (${q.category || 'general'}, priority: ${q.priority || 'medium'})`
).join('\n')}

Generate GEO intelligence that:
1. Identifies which publications/domains to target based on AI citation patterns
2. Maps content types to query ownership potential
3. Prioritizes schema opportunities
4. Shows how traditional comms tactics drive AI visibility

Focus on actionable recommendations that can be integrated into a VECTOR campaign blueprint.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: userPrompt
      }]
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    // Extract JSON from response
    let geoIntelligence: any
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        geoIntelligence = JSON.parse(jsonMatch[0])
      } else {
        geoIntelligence = JSON.parse(responseText)
      }
    } catch (parseError) {
      console.error('Failed to parse GEO intelligence:', parseError)
      console.error('Raw response:', responseText.substring(0, 500))
      throw new Error('Failed to parse GEO intelligence from Claude response')
    }

    console.log('✅ GEO intelligence generated:', {
      targetQueries: geoIntelligence.targetQueries?.length || 0,
      citationSources: geoIntelligence.citationSources?.length || 0,
      schemaOpportunities: geoIntelligence.schemaOpportunities?.length || 0,
      contentRecommendations: geoIntelligence.contentRecommendations?.length || 0
    })

    return new Response(JSON.stringify({
      success: true,
      geoIntelligence,
      metadata: {
        discoveredQueries: targetQueries.length,
        generatedAt: new Date().toISOString()
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    })

  } catch (error) {
    console.error('❌ GEO Campaign Intelligence error:', error)
    return new Response(JSON.stringify({
      error: error.message,
      details: error.toString()
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    })
  }
})
