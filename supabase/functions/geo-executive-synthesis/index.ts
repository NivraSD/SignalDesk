import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.27.3'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * GEO EXECUTIVE SYNTHESIS V2
 *
 * Aggregates meta-analysis from all AI platforms and generates executive insights
 *
 * Input: Platform meta-analyses (competitive intelligence from Claude/Gemini/ChatGPT/Perplexity)
 * Output: Executive synthesis with competitive patterns, source intelligence, recommendations
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 })
  }

  try {
    const {
      organization_id,
      organization_name,
      industry,
      query_scenarios,
      platform_analyses
    } = await req.json()

    if (!organization_id || !organization_name || !platform_analyses) {
      throw new Error('organization_id, organization_name, and platform_analyses required')
    }

    console.log('📊 GEO Executive Synthesis V2 Starting:', {
      organization: organization_name,
      industry: industry || 'Not specified',
      scenarios: query_scenarios?.length || 0,
      platforms: Object.keys(platform_analyses),
      timestamp: new Date().toISOString()
    })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // STEP 1: Aggregate competitive intelligence across platforms
    console.log('🔍 Step 1/3: Aggregating competitive intelligence...')
    const competitiveIntel = aggregateCompetitiveIntelligence(platform_analyses, organization_name)

    console.log('📈 Competitive Intelligence:', {
      total_competitors_mentioned: competitiveIntel.all_competitors.size,
      most_mentioned: competitiveIntel.competitor_frequency.slice(0, 5).map(c => c.name),
      platforms_analyzed: competitiveIntel.platforms_analyzed
    })

    // STEP 2: Aggregate source intelligence (which publications cited)
    console.log('📰 Step 2/3: Aggregating source intelligence...')
    const sourceIntel = aggregateSourceIntelligence(platform_analyses)

    console.log('📚 Source Intelligence:', {
      total_sources: sourceIntel.all_sources.size,
      top_sources: sourceIntel.source_frequency.slice(0, 5).map(s => s.domain)
    })

    // STEP 3: Generate synthesis with Claude
    console.log('🤖 Step 3/3: Generating executive synthesis...')

    const synthesisPrompt = buildSynthesisPrompt({
      organization_name,
      industry,
      query_scenarios,
      competitive_intel: competitiveIntel,
      source_intel: sourceIntel,
      platform_analyses
    })

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) {
      throw new Error('ANTHROPIC_API_KEY not configured')
    }

    const anthropic = new Anthropic({ apiKey: anthropicKey })

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      temperature: 0.7,
      messages: [{
        role: 'user',
        content: synthesisPrompt
      }]
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    console.log('📝 Synthesis generated:', responseText.length, 'chars')

    // Parse synthesis
    const synthesis = parseSynthesis(responseText)

    console.log('✅ Synthesis complete:', {
      has_executive_summary: !!synthesis.executive_summary,
      key_findings: synthesis.key_findings?.length || 0,
      recommendations: synthesis.strategic_actions?.length || 0
    })

    return new Response(
      JSON.stringify({
        success: true,
        synthesis,
        competitive_intel: {
          top_competitors: competitiveIntel.competitor_frequency.slice(0, 10),
          total_competitors: competitiveIntel.all_competitors.size,
          platforms_analyzed: competitiveIntel.platforms_analyzed
        },
        source_intel: {
          top_sources: sourceIntel.source_frequency.slice(0, 10),
          total_sources: sourceIntel.all_sources.size
        },
        meta: {
          scenarios_analyzed: query_scenarios?.length || 0,
          platforms_analyzed: Object.keys(platform_analyses).length,
          generated_at: new Date().toISOString()
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('❌ Synthesis error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

/**
 * Aggregate competitive intelligence from all platform meta-analyses
 */
function aggregateCompetitiveIntelligence(platform_analyses: any, target_org: string) {
  const all_competitors = new Set<string>()
  const competitor_mentions: Record<string, { count: number, platforms: string[], reasons: string[] }> = {}
  const success_factors = new Set<string>()
  let platforms_analyzed = 0

  for (const [platform, analysis] of Object.entries(platform_analyses)) {
    const meta = (analysis as any).meta_analysis
    if (!meta) continue

    platforms_analyzed++

    // Extract query results
    if (meta.query_results && Array.isArray(meta.query_results)) {
      for (const result of meta.query_results) {
        if (result.organizations_mentioned && Array.isArray(result.organizations_mentioned)) {
          for (const org of result.organizations_mentioned) {
            if (org && org !== target_org) {
              all_competitors.add(org)
              if (!competitor_mentions[org]) {
                competitor_mentions[org] = { count: 0, platforms: [], reasons: [] }
              }
              competitor_mentions[org].count++
              if (!competitor_mentions[org].platforms.includes(platform)) {
                competitor_mentions[org].platforms.push(platform)
              }
              if (result.why_these_appeared) {
                competitor_mentions[org].reasons.push(result.why_these_appeared)
              }
            }
          }
        }
      }
    }

    // Extract competitive intelligence
    if (meta.competitive_intelligence) {
      if (meta.competitive_intelligence.success_factors) {
        success_factors.add(meta.competitive_intelligence.success_factors)
      }
      if (meta.competitive_intelligence.dominant_competitors && Array.isArray(meta.competitive_intelligence.dominant_competitors)) {
        for (const comp of meta.competitive_intelligence.dominant_competitors) {
          if (comp && comp !== target_org) {
            all_competitors.add(comp)
          }
        }
      }
    }
  }

  // Sort competitors by frequency
  const competitor_frequency = Object.entries(competitor_mentions)
    .map(([name, data]) => ({
      name,
      mentions: data.count,
      platforms: data.platforms,
      reasons: [...new Set(data.reasons)]
    }))
    .sort((a, b) => b.mentions - a.mentions)

  return {
    all_competitors,
    competitor_mentions,
    competitor_frequency,
    success_factors: Array.from(success_factors),
    platforms_analyzed
  }
}

/**
 * Aggregate source intelligence (which publications cited)
 */
function aggregateSourceIntelligence(platform_analyses: any) {
  const all_sources = new Set<string>()
  const source_mentions: Record<string, { count: number, platforms: string[] }> = {}

  for (const [platform, analysis] of Object.entries(platform_analyses)) {
    const meta = (analysis as any).meta_analysis
    const sources = (analysis as any).sources || []

    // From meta_analysis
    if (meta?.source_intelligence?.most_cited_sources && Array.isArray(meta.source_intelligence.most_cited_sources)) {
      for (const source of meta.source_intelligence.most_cited_sources) {
        if (source) {
          all_sources.add(source)
          if (!source_mentions[source]) {
            source_mentions[source] = { count: 0, platforms: [] }
          }
          source_mentions[source].count++
          if (!source_mentions[source].platforms.includes(platform)) {
            source_mentions[source].platforms.push(platform)
          }
        }
      }
    }

    // From query results
    if (meta?.query_results && Array.isArray(meta.query_results)) {
      for (const result of meta.query_results) {
        if (result.sources_cited && Array.isArray(result.sources_cited)) {
          for (const source of result.sources_cited) {
            if (source) {
              all_sources.add(source)
              if (!source_mentions[source]) {
                source_mentions[source] = { count: 0, platforms: [] }
              }
              source_mentions[source].count++
              if (!source_mentions[source].platforms.includes(platform)) {
                source_mentions[source].platforms.push(platform)
              }
            }
          }
        }
      }
    }

    // From platform-specific sources (Gemini grounding, Perplexity citations)
    if (sources && Array.isArray(sources)) {
      for (const source of sources) {
        const domain = source.url ? new URL(source.url).hostname : source
        if (domain) {
          all_sources.add(domain)
          if (!source_mentions[domain]) {
            source_mentions[domain] = { count: 0, platforms: [] }
          }
          source_mentions[domain].count++
          if (!source_mentions[domain].platforms.includes(platform)) {
            source_mentions[domain].platforms.push(platform)
          }
        }
      }
    }
  }

  const source_frequency = Object.entries(source_mentions)
    .map(([domain, data]) => ({
      domain,
      mentions: data.count,
      platforms: data.platforms
    }))
    .sort((a, b) => b.mentions - a.mentions)

  return {
    all_sources,
    source_mentions,
    source_frequency
  }
}

/**
 * Build synthesis prompt for Claude
 */
function buildSynthesisPrompt(context: {
  organization_name: string
  industry: string | undefined
  query_scenarios: any[]
  competitive_intel: any
  source_intel: any
  platform_analyses: any
}): string {
  const topCompetitors = context.competitive_intel.competitor_frequency.slice(0, 10)
    .map((c: any) => `- ${c.name}: ${c.mentions} mentions across ${c.platforms.join(', ')}`)
    .join('\n')

  const topSources = context.source_intel.source_frequency.slice(0, 10)
    .map((s: any) => `- ${s.domain}: Cited by ${s.platforms.join(', ')}`)
    .join('\n')

  const scenarioList = context.query_scenarios?.map((q: any, idx: number) =>
    `${idx + 1}. "${q.query}" (${q.intent}, ${q.priority})`
  ).join('\n') || 'N/A'

  return `You are analyzing GEO (Generative Engine Optimization) results for ${context.organization_name}${context.industry ? `, a ${context.industry} company` : ''}.

We tested ${context.query_scenarios?.length || 0} query scenarios across 4 AI platforms (Claude, Gemini, ChatGPT, Perplexity) and collected competitive intelligence.

## QUERY SCENARIOS TESTED:
${scenarioList}

## COMPETITIVE INTELLIGENCE (Who AI Platforms Recommend):

**Top Competitors Mentioned Across Platforms:**
${topCompetitors || 'No competitors identified'}

**Total Unique Competitors:** ${context.competitive_intel.all_competitors.size}
**Platforms Analyzed:** ${context.competitive_intel.platforms_analyzed}/4

## SOURCE INTELLIGENCE (What Publications AI Platforms Cite):

**Top Sources Cited:**
${topSources || 'No sources identified'}

**Total Unique Sources:** ${context.source_intel.all_sources.size}

## RAW PLATFORM META-ANALYSES:

${Object.entries(context.platform_analyses).map(([platform, data]: [string, any]) => {
  const meta = data.meta_analysis
  if (!meta) return `**${platform}**: No meta-analysis available`

  return `**${platform}**:
- Overall Visibility: ${meta.overall_visibility || 'N/A'}
- Visibility Summary: ${meta.visibility_summary || 'N/A'}
- Query Results: ${meta.query_results?.length || 0} analyzed
- Recommendations: ${meta.recommendations?.length || 0} provided`
}).join('\n\n')}

---

YOUR TASK:
Generate an executive synthesis in JSON format that helps ${context.organization_name} understand:
1. **Why competitors appear** (patterns across platforms)
2. **What sources matter** (where to get PR coverage)
3. **What ${context.organization_name} needs** to gain AI visibility

Output ONLY valid JSON in this format:

{
  "executive_summary": "2-3 paragraph executive summary highlighting key findings and strategic implications",

  "key_findings": [
    {
      "title": "Brief finding title",
      "insight": "What this means for ${context.organization_name}",
      "evidence": "Data/pattern supporting this (e.g., 'Accenture mentioned by 3/4 platforms due to comprehensive schema')",
      "priority": "critical|high|medium"
    }
  ],

  "competitive_analysis": {
    "dominant_players": [
      {
        "name": "Competitor name",
        "visibility": "Why they appear (schema, PR, content)",
        "platforms": ["Which platforms mention them"]
      }
    ],
    "success_patterns": "What makes competitors successful in AI visibility (schema types, PR coverage, content patterns)",
    "gaps_for_target": "Specific gaps ${context.organization_name} has compared to successful competitors"
  },

  "source_strategy": {
    "priority_publications": [
      {
        "name": "Publication/domain",
        "reasoning": "Why AI platforms trust this source",
        "action": "How ${context.organization_name} should approach coverage"
      }
    ],
    "coverage_strategy": "Overall strategy for gaining authoritative source citations"
  },

  "strategic_actions": [
    {
      "priority": "critical|high|medium",
      "category": "schema|content|pr|technical",
      "action": "Specific action to take",
      "reasoning": "Why this matters based on competitive analysis",
      "expected_impact": "How this improves AI visibility",
      "timeline": "immediate|short-term|medium-term"
    }
  ]
}

Be specific. Use actual competitor names, publication names, and concrete patterns from the data.`
}

/**
 * Parse synthesis response
 */
function parseSynthesis(responseText: string): any {
  try {
    // Try to extract JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }

    // Fallback: return as text
    return {
      executive_summary: responseText,
      key_findings: [],
      competitive_analysis: {},
      source_strategy: {},
      strategic_actions: []
    }
  } catch (error) {
    console.error('Error parsing synthesis:', error)
    return {
      executive_summary: responseText,
      key_findings: [],
      competitive_analysis: {},
      source_strategy: {},
      strategic_actions: []
    }
  }
}
