// GEO Campaign Intelligence Layer V2
// Campaign-specific intelligence gathering using meta-analysis approach
// Provides competitive intelligence and source strategy for VECTOR campaigns

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.27.3'
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
  stakeholders?: any[]
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

    console.log('🎯 GEO Campaign Intelligence V2:', {
      organization: organization_name,
      industry,
      goal: campaign_goal
    })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // STEP 1: Generate campaign-specific query scenarios
    console.log('📋 Step 1/3: Generating campaign-specific queries...')
    const queryScenarios = buildCampaignQueries(campaign_goal, organization_name, industry)

    console.log(`✅ Built ${queryScenarios.length} campaign-specific scenarios`)

    // STEP 2: Build meta-analysis prompt for campaign context
    const metaAnalysisPrompt = buildCampaignMetaAnalysisPrompt({
      organizationName: organization_name,
      industry,
      campaignGoal: campaign_goal,
      queries: queryScenarios
    })

    // STEP 3: Test all 4 platforms in parallel with meta-analysis
    // Each platform gets 25 seconds max to avoid overall timeout
    console.log('🚀 Step 2/3: Testing all 4 platforms with campaign meta-analysis...')

    const PLATFORM_TIMEOUT = 25000 // 25 seconds per platform

    const fetchWithTimeout = async (url: string, body: any, platformName: string) => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), PLATFORM_TIMEOUT)

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body),
          signal: controller.signal
        })
        clearTimeout(timeoutId)
        if (res.ok) {
          return await res.json()
        }
        console.log(`⚠️ ${platformName} returned non-OK status: ${res.status}`)
        return null
      } catch (err: any) {
        clearTimeout(timeoutId)
        if (err.name === 'AbortError') {
          console.log(`⏱️ ${platformName} timed out after ${PLATFORM_TIMEOUT / 1000}s`)
        } else {
          console.log(`❌ ${platformName} error:`, err.message)
        }
        return null
      }
    }

    const requestBody = {
      organization_id,
      organization_name,
      meta_analysis_prompt: metaAnalysisPrompt
    }

    const [claudeData, geminiData, perplexityData, chatgptData] = await Promise.all([
      fetchWithTimeout(`${supabaseUrl}/functions/v1/geo-test-claude`, requestBody, 'Claude'),
      fetchWithTimeout(`${supabaseUrl}/functions/v1/geo-test-gemini`, requestBody, 'Gemini'),
      fetchWithTimeout(`${supabaseUrl}/functions/v1/geo-test-perplexity`, requestBody, 'Perplexity'),
      fetchWithTimeout(`${supabaseUrl}/functions/v1/geo-test-chatgpt`, requestBody, 'ChatGPT')
    ])

    console.log('✅ Platform testing complete:', {
      claude: claudeData?.success,
      gemini: geminiData?.success,
      perplexity: perplexityData?.success,
      chatgpt: chatgptData?.success
    })

    // STEP 4: Aggregate competitive intelligence
    console.log('🔍 Step 3/3: Aggregating campaign intelligence...')

    const competitiveIntel = aggregateCompetitors({
      claude: claudeData?.meta_analysis,
      gemini: geminiData?.meta_analysis,
      perplexity: perplexityData?.meta_analysis,
      chatgpt: chatgptData?.meta_analysis
    }, organization_name)

    const sourceIntel = aggregateSources({
      claude: { meta_analysis: claudeData?.meta_analysis, sources: [] },
      gemini: { meta_analysis: geminiData?.meta_analysis, sources: geminiData?.sources || [] },
      perplexity: { meta_analysis: perplexityData?.meta_analysis, sources: perplexityData?.sources || [] },
      chatgpt: { meta_analysis: chatgptData?.meta_analysis, sources: [] }
    })

    console.log('📊 Intelligence gathered:', {
      competitors: competitiveIntel.all_competitors.size,
      top_competitor: competitiveIntel.competitor_frequency[0]?.name,
      sources: sourceIntel.all_sources.size,
      top_source: sourceIntel.source_frequency[0]?.domain
    })

    // Return campaign-specific intelligence
    return new Response(
      JSON.stringify({
        success: true,
        campaign_intelligence: {
          targetQueries: queryScenarios,
          competitiveIntelligence: {
            dominant_players: competitiveIntel.competitor_frequency.slice(0, 10),
            total_competitors: competitiveIntel.all_competitors.size,
            success_patterns: competitiveIntel.success_factors.join('; ')
          },
          sourceStrategy: {
            priority_sources: sourceIntel.source_frequency.slice(0, 10),
            total_sources: sourceIntel.all_sources.size
          },
          platformAnalyses: {
            claude: claudeData?.meta_analysis,
            gemini: geminiData?.meta_analysis,
            perplexity: perplexityData?.meta_analysis,
            chatgpt: chatgptData?.meta_analysis
          }
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('❌ Campaign intelligence error:', error)
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
 * Build campaign-specific query scenarios (NOT generic industry queries)
 */
function buildCampaignQueries(campaignGoal: string, orgName: string, industry: string): any[] {
  // Extract key concepts from campaign goal
  const goal = campaignGoal.toLowerCase()
  const scenarios: any[] = []

  // Scenario 1-3: Direct goal alignment (HIGHEST VALUE)
  scenarios.push(
    { query: `${campaignGoal} leaders`, intent: 'comparison', priority: 'critical' },
    { query: `best ${campaignGoal} companies`, intent: 'comparison', priority: 'critical' },
    { query: `${campaignGoal} experts`, intent: 'informational', priority: 'high' }
  )

  // Scenario 4-6: Problem/solution queries
  if (goal.includes('increase') || goal.includes('drive') || goal.includes('improve')) {
    const target = goal.split('increase ')[1] || goal.split('drive ')[1] || goal.split('improve ')[1] || 'results'
    scenarios.push(
      { query: `how to ${target.trim()}`, intent: 'informational', priority: 'high' },
      { query: `${target.trim()} best practices`, intent: 'informational', priority: 'high' }
    )
  } else {
    scenarios.push(
      { query: `${industry} ${campaignGoal}`, intent: 'informational', priority: 'high' },
      { query: `${campaignGoal} strategies`, intent: 'informational', priority: 'high' }
    )
  }

  // Scenario 7-8: Thought leadership queries
  scenarios.push(
    { query: `${campaignGoal} thought leaders`, intent: 'informational', priority: 'medium' },
    { query: `${campaignGoal} trends ${new Date().getFullYear()}`, intent: 'informational', priority: 'medium' }
  )

  // Scenario 9-10: Competitive/alternative queries
  scenarios.push(
    { query: `top ${industry} companies for ${campaignGoal}`, intent: 'comparison', priority: 'medium' },
    { query: `${campaignGoal} solutions comparison`, intent: 'comparison', priority: 'medium' }
  )

  return scenarios.slice(0, 10)
}

/**
 * Build campaign-specific meta-analysis prompt
 */
function buildCampaignMetaAnalysisPrompt(context: {
  organizationName: string
  industry: string
  campaignGoal: string
  queries: any[]
}): string {
  const queryList = context.queries.map((q, idx) =>
    `${idx + 1}. "${q.query}" (${q.intent}, priority: ${q.priority})`
  ).join('\n')

  return `You are conducting a GEO (Generative Engine Optimization) analysis for a SPECIFIC CAMPAIGN.

**Campaign Context:**
- Organization: ${context.organizationName}
- Industry: ${context.industry}
- Campaign Goal: ${context.campaignGoal}

**Your Task:**
Simulate what happens when potential clients search for solutions related to this campaign goal. For each query scenario, analyze which organizations AI platforms would recommend and why.

**Query Scenarios (Campaign-Specific):**
${queryList}

Please provide your analysis in valid JSON format (no markdown, just JSON):

{
  "overall_visibility": "high|medium|low|none",
  "visibility_summary": "2-3 sentence assessment of ${context.organizationName}'s visibility for THIS CAMPAIGN GOAL",

  "query_results": [
    {
      "query": "the query text",
      "organizations_mentioned": ["Org1", "Org2", "Org3"],
      "target_mentioned": true/false,
      "target_rank": 1-10 or null,
      "why_these_appeared": "What makes these organizations appear for THIS campaign goal (thought leadership, case studies, schema)",
      "sources_cited": ["domain1.com", "domain2.com"],
      "what_target_needs": "Specific gap ${context.organizationName} should address for THIS campaign goal"
    }
  ],

  "competitive_intelligence": {
    "dominant_competitors": ["Organizations that appear most for THIS campaign goal"],
    "success_factors": "What makes organizations succeed at THIS campaign goal in AI visibility (content types, sources, positioning)",
    "campaign_patterns": "Common characteristics of orgs winning THIS campaign goal queries"
  },

  "recommendations": [
    {
      "priority": "critical|high|medium",
      "category": "schema|content|pr|technical",
      "action": "Specific action for THIS campaign goal",
      "reasoning": "Why this helps win these specific campaign queries",
      "expected_impact": "How this improves visibility for THIS campaign"
    }
  ],

  "source_intelligence": {
    "most_cited_sources": ["Publications cited for THIS campaign goal"],
    "why_these_sources": "What makes these sources authoritative for THIS topic",
    "coverage_strategy": "Where ${context.organizationName} should get featured for THIS campaign"
  }
}

CRITICAL: Focus on THIS specific campaign goal. Don't give generic industry advice - tell us who wins for THESE specific queries and why.`
}

/**
 * Aggregate competitor mentions across platforms
 */
function aggregateCompetitors(platforms: any, targetOrg: string) {
  const all_competitors = new Set<string>()
  const competitor_mentions: Record<string, { count: number, platforms: string[], reasons: string[] }> = {}
  const success_factors = new Set<string>()

  for (const [platform, meta] of Object.entries(platforms)) {
    if (!meta) continue

    if (meta.query_results && Array.isArray(meta.query_results)) {
      for (const result of meta.query_results) {
        if (result.organizations_mentioned && Array.isArray(result.organizations_mentioned)) {
          for (const org of result.organizations_mentioned) {
            if (org && org !== targetOrg) {
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

    if (meta.competitive_intelligence?.success_factors) {
      success_factors.add(meta.competitive_intelligence.success_factors)
    }
  }

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
    competitor_frequency,
    success_factors: Array.from(success_factors)
  }
}

/**
 * Aggregate source citations across platforms
 */
function aggregateSources(platforms: any) {
  const all_sources = new Set<string>()
  const source_mentions: Record<string, { count: number, platforms: string[] }> = {}

  for (const [platform, data] of Object.entries(platforms)) {
    const meta = (data as any).meta_analysis
    const sources = (data as any).sources || []

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
    source_frequency
  }
}
