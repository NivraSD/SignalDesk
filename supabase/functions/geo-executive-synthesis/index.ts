import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.27.3'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * GEO EXECUTIVE SYNTHESIS
 *
 * Transforms raw GEO monitoring results into executive-level insights
 * Similar to how executive-synthesis analyzes PR intelligence
 *
 * Input: Raw GEO test results (queries + AI responses)
 * Output: Executive synthesis with actionable recommendations
 */

interface GEOTestResult {
  query: string
  intent: string
  priority: string
  platform: 'claude' | 'gemini' | 'chatgpt' | 'perplexity'
  response: string
  brand_mentioned: boolean
  rank?: number
  context_quality?: 'strong' | 'medium' | 'weak'
  competitors_mentioned?: string[]
  sources?: any[] // Sources cited by AI platforms (from Gemini/Perplexity)
  source_domains?: string[] // Domain names of cited sources
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const {
      organization_id,
      organization_name,
      industry,
      geo_results, // Raw results from geo-intelligence-monitor
      geo_targets // User's GEO targets if available
    } = await req.json()

    if (!organization_id || !organization_name || !geo_results) {
      throw new Error('organization_id, organization_name, and geo_results required')
    }

    if (!Array.isArray(geo_results) || geo_results.length === 0) {
      console.log('⚠️  No GEO results provided, returning empty synthesis')
      return new Response(
        JSON.stringify({
          success: true,
          synthesis: {
            overview: 'No GEO testing results available yet. Run GEO testing first to generate insights.',
            visibility_score: 0,
            critical_issues: [],
            opportunities: [],
            recommendations: []
          },
          summary: {
            total_queries: 0,
            claude_mentions: 0,
            gemini_mentions: 0,
            perplexity_mentions: 0,
            chatgpt_mentions: 0,
            critical_signals: 0
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('📊 GEO Executive Synthesis Starting:', {
      organization: organization_name,
      industry,
      results_count: geo_results.length,
      timestamp: new Date().toISOString()
    })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Analyze results
    const analysis = analyzeGEOResults(geo_results, organization_name)

    console.log('📈 Analysis Complete:', {
      total_queries: analysis.total_queries,
      mention_rate: analysis.mention_rate,
      critical_gaps: analysis.critical_gaps.length,
      opportunities: analysis.opportunities.length
    })

    // Check for schema in TWO places:
    // 1. Memory Vault (stored but may not be deployed)
    // 2. Live website (actually deployed and visible to AI)

    let currentSchema: any = null
    let hasSchemaInMemoryVault = false
    let hasSchemaOnWebsite = false
    let websiteUrl: string | null = null

    // Get organization's website URL
    try {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('website')
        .eq('id', organization_id)
        .single()

      websiteUrl = orgData?.website || null
      console.log('🌐 Organization website:', websiteUrl || 'Not set')
    } catch (error) {
      console.error('Error fetching organization website:', error)
    }

    // 1. Check Memory Vault for schema
    try {
      const { data: schemaData } = await supabase
        .from('content_library')
        .select('content')
        .eq('organization_id', organization_id)
        .eq('content_type', 'schema')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (schemaData) {
        currentSchema = typeof schemaData.content === 'string'
          ? JSON.parse(schemaData.content)
          : schemaData.content
        hasSchemaInMemoryVault = true
        console.log('✅ Schema found in Memory Vault:', {
          type: currentSchema['@type'],
          fields: Object.keys(currentSchema).filter(k => !k.startsWith('@')).length
        })
      } else {
        console.log('⚠️  No schema in Memory Vault')
      }
    } catch (error) {
      console.error('Error fetching schema from Memory Vault:', error)
    }

    // 2. Check if schema is actually deployed on website
    if (websiteUrl) {
      try {
        console.log('🔍 Checking for live schema deployment on', websiteUrl)
        const response = await fetch(websiteUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GEO-Monitor/1.0)' }
        })

        if (response.ok) {
          const html = await response.text()

          // Look for JSON-LD schema markup
          const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)

          if (jsonLdMatch && jsonLdMatch.length > 0) {
            hasSchemaOnWebsite = true
            console.log('✅ Schema.org JSON-LD found on live website:', jsonLdMatch.length, 'blocks')

            // Try to parse first schema block to get type
            try {
              const firstBlock = jsonLdMatch[0].replace(/<script[^>]*>/, '').replace(/<\/script>/, '').trim()
              const parsed = JSON.parse(firstBlock)
              const schemaType = parsed['@type'] || (Array.isArray(parsed['@graph']) ? parsed['@graph'][0]?.['@type'] : 'Unknown')
              console.log('   Schema type on website:', schemaType)
            } catch (e) {
              console.log('   Could not parse schema block')
            }
          } else {
            console.log('❌ No Schema.org JSON-LD found on live website')
          }
        } else {
          console.log('⚠️  Could not fetch website (HTTP', response.status, ')')
        }
      } catch (error) {
        console.error('Error checking live website for schema:', error.message)
      }
    }

    const hasSchema = hasSchemaInMemoryVault || hasSchemaOnWebsite
    console.log('📊 Schema Status:', {
      inMemoryVault: hasSchemaInMemoryVault,
      onWebsite: hasSchemaOnWebsite,
      overall: hasSchema ? 'Schema exists' : 'No schema found'
    })

    // Use Claude to generate executive-level insights
    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY')
    })

    const prompt = buildSynthesisPrompt({
      organizationName: organization_name,
      industry,
      analysis,
      geoTargets: geo_targets,
      currentSchema,
      hasSchema,
      hasSchemaInMemoryVault,
      hasSchemaOnWebsite,
      websiteUrl
    })

    console.log('🤖 Calling Claude for executive synthesis...')

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      temperature: 0.7,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : ''

    // Parse Claude's synthesis
    const synthesis = parseSynthesisResponse(responseText)

    console.log('✅ Synthesis Generated:', {
      key_findings: synthesis.key_findings?.length || 0,
      schema_recommendations: synthesis.schema_recommendations?.length || 0,
      strategic_actions: synthesis.strategic_actions?.length || 0,
      has_competitive_analysis: !!synthesis.competitive_analysis,
      has_source_strategy: !!synthesis.source_strategy
    })

    // Save schema recommendations to database
    if (synthesis.schema_recommendations && synthesis.schema_recommendations.length > 0) {
      console.log(`💾 Saving ${synthesis.schema_recommendations.length} schema recommendations to database...`)

      for (const rec of synthesis.schema_recommendations) {
        try {
          const { error } = await supabase
            .from('schema_recommendations')
            .insert({
              organization_id,
              schema_type: rec.schema_type || 'Organization',
              recommendation_type: rec.type || 'optimize_existing',
              priority: rec.priority || 'medium',
              source_platform: rec.platform || 'all',
              title: rec.title,
              description: rec.description,
              reasoning: rec.reasoning,
              expected_impact: rec.expected_impact,
              changes: rec.changes || {},
              auto_executable: rec.auto_executable || false,
              status: 'pending'
            })

          if (error) {
            console.error('Error saving recommendation:', error)
          } else {
            console.log(`  ✓ Saved: ${rec.title}`)
          }
        } catch (err) {
          console.error('Error saving recommendation:', err)
        }
      }
    }

    // Build summary metrics for UI display
    const summary = {
      total_queries: analysis.total_queries,
      claude_mentions: analysis.mentions_by_platform.claude || 0,
      gemini_mentions: analysis.mentions_by_platform.gemini || 0,
      perplexity_mentions: analysis.mentions_by_platform.perplexity || 0,
      chatgpt_mentions: analysis.mentions_by_platform.chatgpt || 0,
      critical_signals: analysis.critical_gaps.length
    }

    // Extract top cited sources for easy access
    const topCitedSources = Object.entries(analysis.top_domains)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 10)
      .map(([domain, count]) => ({
        domain,
        citation_count: count,
        recommendation: `Target ${domain} for PR coverage to improve AI visibility`
      }))

    return new Response(
      JSON.stringify({
        success: true,
        synthesis: {
          ...synthesis,
          raw_analysis: analysis,
          organization_name,
          industry,
          generated_at: new Date().toISOString(),
          cited_sources: topCitedSources // Add top sources for UI display
        },
        summary  // Add summary for UI display
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error: any) {
    console.error('❌ GEO Executive Synthesis Error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

/**
 * Analyze raw GEO results to extract key metrics and patterns
 */
function analyzeGEOResults(results: GEOTestResult[], organizationName: string) {
  const platforms = ['claude', 'gemini', 'chatgpt', 'perplexity']

  const analysis = {
    total_queries: results.length,
    queries_by_platform: {} as Record<string, number>,
    mentions_by_platform: {} as Record<string, number>,
    mention_rate: 0,
    avg_rank: 0,
    critical_gaps: [] as any[],
    opportunities: [] as any[],
    competitor_analysis: {} as Record<string, number>,
    cited_sources: [] as any[], // Track all sources cited by AI platforms
    top_domains: {} as Record<string, number> // Domain frequency
  }

  // Initialize platform counters
  platforms.forEach(p => {
    analysis.queries_by_platform[p] = 0
    analysis.mentions_by_platform[p] = 0
  })

  let totalMentions = 0
  let totalRanks = 0
  let rankedMentions = 0

  // Analyze each result
  results.forEach(result => {
    const platform = result.platform
    analysis.queries_by_platform[platform] = (analysis.queries_by_platform[platform] || 0) + 1

    if (result.brand_mentioned) {
      totalMentions++
      analysis.mentions_by_platform[platform] = (analysis.mentions_by_platform[platform] || 0) + 1

      if (result.rank) {
        totalRanks += result.rank
        rankedMentions++
      }
    } else {
      // Track visibility gaps
      if (result.priority === 'critical' || result.priority === 'high') {
        analysis.critical_gaps.push({
          query: result.query,
          platform: result.platform,
          intent: result.intent,
          priority: result.priority,
          competitors_mentioned: result.competitors_mentioned || []
        })
      }
    }

    // Track competitor mentions
    if (result.competitors_mentioned && result.competitors_mentioned.length > 0) {
      result.competitors_mentioned.forEach(competitor => {
        analysis.competitor_analysis[competitor] = (analysis.competitor_analysis[competitor] || 0) + 1
      })
    }

    // Identify opportunities
    if (!result.brand_mentioned && result.context_quality === 'strong') {
      analysis.opportunities.push({
        query: result.query,
        platform: result.platform,
        intent: result.intent,
        why: 'Strong context but no brand mention - opportunity to optimize'
      })
    }

    // Collect cited sources (from Gemini and Perplexity)
    if (result.sources && result.sources.length > 0) {
      result.sources.forEach(source => {
        analysis.cited_sources.push({
          ...source,
          platform: result.platform,
          query: result.query,
          brand_mentioned: result.brand_mentioned
        })
      })
    }

    // Track domain frequency
    if (result.source_domains && result.source_domains.length > 0) {
      result.source_domains.forEach(domain => {
        analysis.top_domains[domain] = (analysis.top_domains[domain] || 0) + 1
      })
    }
  })

  analysis.mention_rate = analysis.total_queries > 0
    ? Math.round((totalMentions / analysis.total_queries) * 100)
    : 0

  analysis.avg_rank = rankedMentions > 0
    ? Math.round(totalRanks / rankedMentions * 10) / 10
    : 0

  return analysis
}

/**
 * Build prompt for Claude to generate executive synthesis
 */
function buildSynthesisPrompt(context: {
  organizationName: string
  industry?: string
  analysis: any
  geoTargets?: any
  currentSchema?: any
  hasSchema?: boolean
  hasSchemaInMemoryVault?: boolean
  hasSchemaOnWebsite?: boolean
  websiteUrl?: string | null
}): string {
  const currentDate = new Date().toISOString().split('T')[0]

  // Build schema status context (informational, not prescriptive)
  let schemaStatusMessage = ''
  if (context.hasSchemaOnWebsite) {
    schemaStatusMessage = `✅ SCHEMA DEPLOYED ON WEBSITE: ${context.websiteUrl}
Type: ${context.currentSchema?.['@type'] || 'Detected'}
Status: Live and accessible to AI platforms`
  } else if (context.hasSchemaInMemoryVault && !context.hasSchemaOnWebsite) {
    schemaStatusMessage = `⚠️ SCHEMA IN MEMORY VAULT BUT NOT DEPLOYED
Type: ${context.currentSchema?.['@type'] || 'Not set'}
Website: ${context.websiteUrl || 'Not configured'}
Status: Created but not yet live (deployment needed)`
  } else if (!context.websiteUrl) {
    schemaStatusMessage = `⚠️ NO WEBSITE CONFIGURED
Status: Cannot verify schema deployment`
  } else {
    schemaStatusMessage = `❌ NO SCHEMA DETECTED
Website: ${context.websiteUrl}
Status: No Schema.org markup found`
  }

  return `You are a GEO (Generative Experience Optimization) strategist analyzing AI visibility for ${context.organizationName}.

CURRENT DATE: ${currentDate}

ORGANIZATION: ${context.organizationName}
INDUSTRY: ${context.industry || 'Not specified'}
WEBSITE: ${context.websiteUrl || 'Not configured'}

SCHEMA.ORG STATUS:
${schemaStatusMessage}

YOUR MISSION:
You are conducting COMPETITIVE INTELLIGENCE analysis for GEO optimization. Your job is to:
1. **Analyze who IS appearing** - What makes successful organizations show up?
2. **Identify strategic patterns** - What sources, content types, and schema elements work?
3. **Recommend optimizations** - Specific, actionable schema and content improvements
4. **Guide overall strategy** - Not just "what to do" but "why it works"

CRITICAL: This is about LEARNING FROM THE DATA, not making assumptions.
- If competitors are appearing, analyze WHAT THEY'RE DOING that works
- If org has 0% visibility, analyze what WOULD work based on successful competitors
- Schema recommendations should be based on patterns you observe in successful appearances

GEO PERFORMANCE ANALYSIS:
- Total Queries Tested: ${context.analysis.total_queries}
- Overall Mention Rate: ${context.analysis.mention_rate}%
- Average Rank When Mentioned: ${context.analysis.avg_rank}
- Critical Visibility Gaps: ${context.analysis.critical_gaps.length}
- Opportunities Identified: ${context.analysis.opportunities.length}

PLATFORM BREAKDOWN:
${Object.entries(context.analysis.queries_by_platform).map(([platform, count]) => {
  const mentions = context.analysis.mentions_by_platform[platform] || 0
  const rate = count > 0 ? Math.round((mentions / (count as number)) * 100) : 0
  return `- ${platform.toUpperCase()}: ${mentions}/${count} queries (${rate}% mention rate)`
}).join('\n')}

CRITICAL GAPS (High-priority queries where brand was NOT mentioned):
${context.analysis.critical_gaps.slice(0, 5).map((gap: any) =>
  `- "${gap.query}" (${gap.platform}) - Competitors mentioned: ${gap.competitors_mentioned.join(', ') || 'none'}`
).join('\n')}

═══════════════════════════════════════════════════════════
🎯 COMPETITIVE INTELLIGENCE: WHO'S WINNING AND WHY
═══════════════════════════════════════════════════════════

ORGANIZATIONS APPEARING IN AI RESPONSES:
${Object.entries(context.analysis.competitor_analysis).length > 0
  ? Object.entries(context.analysis.competitor_analysis)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 10)
      .map(([comp, count], idx) => `${idx + 1}. ${comp}: ${count} mentions across platforms`)
      .join('\n')
  : 'No competitor organizations mentioned (indicates queries may be too broad or industry has low AI visibility)'}

CRITICAL QUESTION: Why are THESE organizations appearing?
- What content are they publishing that AI platforms cite?
- What schema markup are they likely using?
- What authoritative sources cover them?
- How can ${context.organizationName} replicate their success?

═══════════════════════════════════════════════════════════
📚 SOURCE INTELLIGENCE: WHERE AI GETS ITS INFORMATION
═══════════════════════════════════════════════════════════

AI PLATFORMS CITED THESE SOURCES (from Gemini & Perplexity):
${Object.entries(context.analysis.top_domains).length > 0
  ? Object.entries(context.analysis.top_domains)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 20)
      .map(([domain, count], idx) => `${idx + 1}. ${domain} - cited ${count} times`)
      .join('\n')
  : 'No source data available (only Claude/ChatGPT tested, which don\'t provide citations)'}

STRATEGIC INSIGHT:
${Object.entries(context.analysis.top_domains).length > 0 ? `
These ${Object.keys(context.analysis.top_domains).length} sources are the AUTHORITY LAYER that AI platforms trust.
Getting cited by these publications = Direct AI visibility improvement.

TOP 5 TARGET PUBLICATIONS FOR PR/CONTENT:
${Object.entries(context.analysis.top_domains)
  .sort((a, b) => (b[1] as number) - (a[1] as number))
  .slice(0, 5)
  .map(([domain, count], idx) => `${idx + 1}. ${domain} (${count} citations)`)
  .join('\n')}
` : 'Need to test Gemini/Perplexity to identify which sources AI platforms trust in this industry.'}

${context.geoTargets ? `
ORGANIZATION'S GEO TARGETS:
- Service Lines: ${context.geoTargets.service_lines?.join(', ') || 'Not specified'}
- Geographic Focus: ${context.geoTargets.geographic_focus?.join(', ') || 'Not specified'}
- Priority Queries: ${context.geoTargets.priority_queries?.slice(0, 3).join(', ') || 'None configured'}
` : ''}

═══════════════════════════════════════════════════════════
📋 YOUR ANALYSIS TASK
═══════════════════════════════════════════════════════════

Analyze this GEO intelligence data and provide STRATEGIC, DATA-DRIVEN recommendations.

Structure your response as JSON:

{
  "executive_summary": "2-3 paragraphs analyzing: (1) Current visibility performance, (2) Competitive positioning based on who's appearing, (3) Strategic opportunities based on source/competitor analysis",

  "key_findings": [
    "Data-driven insight 1 with specific metrics",
    "Pattern observation 2 explaining WHY certain orgs appear",
    "Strategic gap 3 with competitive intelligence",
    "Source analysis 4 identifying key publications to target"
  ],

  "competitive_analysis": {
    "who_is_winning": "Which organizations dominate AI visibility and why",
    "success_patterns": "Common traits of appearing organizations (content, sources, likely schema)",
    "gaps_to_exploit": "Where ${context.organizationName} can differentiate"
  },

  "source_strategy": {
    "priority_publications": ["Top 3-5 publications AI platforms cite most"],
    "coverage_approach": "How to get cited by these sources",
    "content_types": "What content formats work (based on source analysis)"
  },

  "schema_recommendations": [
    {
      "title": "Specific schema optimization",
      "schema_type": "Organization|Product|FAQPage|Service|etc",
      "type": "add_field|update_field|add_structured_data|deploy_schema",
      "priority": "critical|high|medium",
      "reasoning": "Why this specific change based on competitive/source analysis",
      "expected_impact": "What AI visibility improvement to expect",
      "implementation": "Exact technical steps to implement",
      "example": "Code example if applicable",
      "auto_executable": false
    }
  ],

  "strategic_actions": [
    {
      "category": "pr|content|schema|technical|partnerships",
      "action": "Specific action with clear outcome",
      "priority": "critical|high|medium",
      "timeline": "immediate|this_week|this_month",
      "expected_impact": "Measurable improvement",
      "based_on": "Which data point drove this recommendation"
    }
  ]
}

═══════════════════════════════════════════════════════════
🎯 RECOMMENDATION PRINCIPLES
═══════════════════════════════════════════════════════════

1. **DATA-DRIVEN**: Base recommendations on competitive/source analysis, not generic advice
2. **SPECIFIC**: "Add FAQPage schema with these 10 questions" not "implement schema"
3. **STRATEGIC**: Explain WHY based on what successful competitors are doing
4. **ACTIONABLE**: Provide exact implementation steps, code examples where useful
5. **PRIORITIZED**: Critical (do now) > High (this week) > Medium (this month)

SCHEMA RECOMMENDATIONS APPROACH:
- Current status: ${schemaStatusMessage}
- Make schema recommendations REGARDLESS of current deployment status
- Focus on OPTIMIZATION and ENHANCEMENT, not just "implement schema"
- Analyze what schema elements successful competitors likely have
- Recommend specific fields, structured data types, content updates
- If schema exists: Recommend enhancements, additions, optimizations
- If no schema: Recommend implementation as part of integrated strategy
- Always explain the competitive/strategic reasoning

EXAMPLE GOOD SCHEMA RECOMMENDATION:
{
  "title": "Add Service schema for each practice area",
  "reasoning": "Analysis shows competitors appearing for service-specific queries likely have Service schema. ${context.organizationName}'s competitors X and Y dominate 'PR consulting services' queries.",
  "implementation": "Create Service schema for each service line with provider, areaServed, and offers properties",
  "expected_impact": "Improve visibility for service-specific queries where competitors currently dominate"
}

EXAMPLE BAD SCHEMA RECOMMENDATION:
{
  "title": "Implement Schema.org markup",
  "reasoning": "Schema helps with SEO",
  "implementation": "Add schema to website"
}

Generate your strategic analysis and recommendations now:`
}

/**
 * Parse Claude's synthesis response
 */
function parseSynthesisResponse(response: string): any {
  try {
    // Log the raw response to debug
    console.log('📝 Raw Claude response length:', response.length)
    console.log('📝 First 500 chars:', response.substring(0, 500))

    // Try to find JSON in response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      console.log('✅ Parsed synthesis:', {
        has_executive_summary: !!parsed.executive_summary,
        key_findings_count: parsed.key_findings?.length || 0,
        has_competitive_analysis: !!parsed.competitive_analysis,
        has_source_strategy: !!parsed.source_strategy,
        schema_recommendations_count: parsed.schema_recommendations?.length || 0,
        strategic_actions_count: parsed.strategic_actions?.length || 0
      })
      return parsed
    }

    console.warn('⚠️ No JSON found in response, using fallback structure')
    // Fallback: return NEW structure
    return {
      executive_summary: response.substring(0, 500),
      key_findings: [],
      competitive_analysis: {
        who_is_winning: 'Unable to parse response',
        success_patterns: '',
        gaps_to_exploit: ''
      },
      source_strategy: {
        priority_publications: [],
        coverage_approach: '',
        content_types: ''
      },
      schema_recommendations: [],
      strategic_actions: []
    }
  } catch (error) {
    console.error('❌ Error parsing synthesis response:', error)
    console.error('Response that failed to parse:', response.substring(0, 1000))
    return {
      executive_summary: 'Error parsing synthesis',
      key_findings: [],
      competitive_analysis: {},
      source_strategy: {},
      schema_recommendations: [],
      strategic_actions: [],
      parse_error: error.message
    }
  }
}
