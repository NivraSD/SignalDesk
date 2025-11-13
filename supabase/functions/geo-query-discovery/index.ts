import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.27.3'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * GEO QUERY DISCOVERY
 *
 * Claude-powered intelligent query generation for GEO testing.
 * Similar to mcp-discovery but focused on generating test queries instead of sources.
 *
 * Flow:
 * 1. Get organization context (industry, competitors, recent news)
 * 2. Reference GEOIntelligenceRegistry patterns for industry
 * 3. Use Claude to generate contextual, high-value test queries
 * 4. Prioritize by intent (transactional > competitive > informational)
 * 5. Return 20-30 prioritized queries for testing
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const {
      organization_id,
      organization_name,
      industry,
      competitors = [],
      recent_news = [],
      mcp_profile = null,  // NEW: Accept MCP discovery data from onboarding
      campaign_goal = null,  // NEW: Campaign-specific context
      positioning = null,     // NEW: Selected positioning strategy
      stakeholders = []       // NEW: Target stakeholders from research
    } = await req.json()

    if (!organization_id || !organization_name) {
      throw new Error('organization_id and organization_name required')
    }

    console.log('🔍 GEO Query Discovery Starting:', {
      organization_name,
      industry,
      competitors: competitors.length,
      has_mcp_profile: !!mcp_profile,
      timestamp: new Date().toISOString()
    })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get full organization profile
    const { data: org } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organization_id)
      .single()

    const orgIndustry = industry || org?.industry || mcp_profile?.industry || 'technology'
    const orgCompetitors = competitors.length > 0 ? competitors : (org?.competitors || mcp_profile?.competition?.direct_competitors || [])
    const orgDescription = org?.description || mcp_profile?.description || ''

    // Extract service lines/business lines from MCP profile
    const serviceLines = mcp_profile?.service_lines || mcp_profile?.products_services?.map((p: any) => p.name || p) || []

    console.log(`📊 Organization: ${organization_name}`)
    console.log(`🏭 Industry: ${orgIndustry}`)
    console.log(`🏢 Competitors: ${orgCompetitors.length}`)
    console.log(`🎯 Service Lines from MCP: ${serviceLines.length}`)

    // Get organization-specific GEO targets (if configured)
    const { data: geoTargets } = await supabase
      .from('geo_targets')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('active', true)
      .single()

    if (geoTargets) {
      console.log(`🎯 Using organization-specific GEO targets`)
      console.log(`   - Service Lines: ${geoTargets.service_lines?.length || 0}`)
      console.log(`   - Geographic Focus: ${geoTargets.geographic_focus?.length || 0}`)
      console.log(`   - Priority Queries: ${geoTargets.priority_queries?.length || 0}`)
    } else {
      console.log(`📚 No GEO targets configured, using industry patterns`)
    }

    // Build 10 query scenarios from templates (NO Claude call for query generation)
    console.log('📋 Building query scenarios from templates...')

    const queryScenarios = buildQueryScenarios({
      organizationName: organization_name,
      industry: orgIndustry,
      competitors: orgCompetitors,
      serviceLines: geoTargets?.service_lines || serviceLines || [],
      geoTargets
    })

    console.log(`✅ Built ${queryScenarios.length} query scenarios`)

    // Build meta-analysis prompt directly
    const metaAnalysisPrompt = buildMetaAnalysisPrompt({
      organizationName: organization_name,
      industry: orgIndustry,
      website: org?.website,
      queries: queryScenarios,
      description: orgDescription,
      competitors: orgCompetitors
    })

    console.log('✅ Built meta-analysis prompt')

    return new Response(
      JSON.stringify({
        success: true,
        organization_name,
        industry: orgIndustry,
        query_scenarios: queryScenarios,  // 10 scenario templates
        meta_analysis_prompt: metaAnalysisPrompt,  // Single comprehensive prompt for all platforms
        geo_targets_used: !!geoTargets,
        geo_targets_summary: geoTargets ? {
          service_lines: geoTargets.service_lines?.length || 0,
          geographic_focus: geoTargets.geographic_focus?.length || 0,
          priority_queries: geoTargets.priority_queries?.length || 0,
          industry_verticals: geoTargets.industry_verticals?.length || 0
        } : null,
        generated_at: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error: any) {
    console.error('❌ GEO Query Discovery Error:', error)
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
 * Get industry-specific query patterns from GEOIntelligenceRegistry
 */
function getIndustryPatterns(industry: string): string[] {
  const patterns: Record<string, string[]> = {
    technology: [
      'best [category] software',
      'alternatives to [competitor]',
      '[product] vs [competitor]',
      '[product] pricing',
      '[product] reviews',
      'how to [task] with [software]'
    ],
    saas: [
      'best [category] software',
      'alternatives to [competitor]',
      '[product] pricing',
      '[product] features',
      '[category] software comparison'
    ],
    finance: [
      'best [service]',
      '[service] comparison',
      'how to choose [service]',
      '[product] fees',
      '[product] vs [competitor]'
    ],
    healthcare: [
      'best [specialty] near me',
      '[service] cost',
      'how to find [specialist]',
      '[provider] reviews'
    ],
    ecommerce: [
      'buy [product]',
      '[product] reviews',
      'best [category] brands',
      '[brand] vs [competitor]',
      'where to buy [product]'
    ],
    fashion: [
      'sustainable fashion brands',
      'affordable luxury fashion',
      'best [category] brands',
      '[brand] vs [competitor]',
      'ethical clothing alternatives',
      'where to buy [style] clothing'
    ],
    retail: [
      'best places to buy [product]',
      '[brand] reviews',
      '[brand] vs [competitor]',
      'affordable [category] brands'
    ],
    media: [
      'best [content_type] platforms',
      '[platform] vs [competitor]',
      'how to [action] on [platform]',
      '[platform] pricing'
    ],
    education: [
      'best [course_type] courses',
      '[platform] reviews',
      '[platform] vs [competitor]',
      'how to learn [skill]'
    ],
    default: [
      'best [category]',
      '[company] reviews',
      '[company] vs [competitor]'
    ]
  }

  const normalizedIndustry = industry.toLowerCase().replace(/[^a-z]/g, '')
  return patterns[normalizedIndustry] || patterns.default
}

/**
 * Build 10 query scenarios from templates (NO Claude API call)
 */
function buildQueryScenarios(context: {
  organizationName: string
  industry: string
  competitors: string[]
  serviceLines: string[]
  geoTargets?: any
}): Array<{ query: string, intent: string, priority: string }> {
  const scenarios: Array<{ query: string, intent: string, priority: string }> = []
  const industry = context.industry.toLowerCase()
  const serviceLines = context.serviceLines.length > 0 ? context.serviceLines : [industry + ' services']
  const competitors = context.competitors.slice(0, 3)

  // Scenario 1-3: Discovery/Superlative queries (HIGHEST VALUE)
  scenarios.push(
    { query: `best ${serviceLines[0]} companies`, intent: 'comparison', priority: 'critical' },
    { query: `top ${industry} firms`, intent: 'comparison', priority: 'critical' },
    { query: `leading ${serviceLines[0]} providers`, intent: 'comparison', priority: 'high' }
  )

  // Scenario 4-5: Industry-specific superlatives
  if (serviceLines.length > 1) {
    scenarios.push({ query: `top rated ${serviceLines[1]} companies`, intent: 'comparison', priority: 'high' })
  }
  scenarios.push({ query: `largest ${industry} companies`, intent: 'comparison', priority: 'high' })

  // Scenario 6-7: Solution-seeking queries
  scenarios.push(
    { query: `who provides ${serviceLines[0]}`, intent: 'informational', priority: 'medium' },
    { query: `${industry} companies in North America`, intent: 'informational', priority: 'medium' }
  )

  // Scenario 8-10: Competitive queries (if competitors available)
  if (competitors.length > 0) {
    scenarios.push(
      { query: `${context.organizationName} vs ${competitors[0]}`, intent: 'competitive', priority: 'high' },
      { query: `alternatives to ${competitors[0]}`, intent: 'competitive', priority: 'medium' }
    )
    if (competitors.length > 1) {
      scenarios.push({ query: `${competitors[0]} vs ${competitors[1]}`, intent: 'competitive', priority: 'medium' })
    }
  }

  // Fill remaining slots with more discovery queries
  while (scenarios.length < 10) {
    scenarios.push({
      query: `industry leading ${serviceLines[scenarios.length % serviceLines.length]} companies`,
      intent: 'comparison',
      priority: 'medium'
    })
  }

  return scenarios.slice(0, 10)
}

/**
 * Get industry-specific priorities for query generation
 */
function getIndustryPriorities(industry: string): {
  primary_concerns: string[]
  positioning_focus: string[]
  query_framing: { comparison: string[], expertise: string[], transactional: string[] }
} | null {
  const priorities: Record<string, any> = {
    technology: {
      primary_concerns: ['features', 'integration', 'ease of use', 'pricing', 'support'],
      positioning_focus: ['innovation', 'reliability', 'technical excellence'],
      query_framing: {
        comparison: ['best for {use_case}', 'vs competitor features'],
        expertise: ['how to', 'tutorial', 'best practices'],
        transactional: ['pricing plans', 'free trial']
      }
    },
    finance: {
      primary_concerns: ['security', 'compliance', 'fees', 'returns', 'transparency'],
      positioning_focus: ['trust', 'expertise', 'track record', 'regulatory compliance'],
      query_framing: {
        comparison: ['best for {investor_type}', 'vs competitor fees', 'top rated'],
        expertise: ['investment philosophy', 'credentials', 'compliance'],
        transactional: ['minimum investment', 'account types']
      }
    },
    professional_services: {
      primary_concerns: ['expertise', 'credentials', 'experience', 'client results'],
      positioning_focus: ['thought leadership', 'specialization', 'track record'],
      query_framing: {
        comparison: ['best firm for {industry}', 'top consultants', 'vs competitor expertise'],
        expertise: ['{specialty} experience', 'case studies', 'industry insights'],
        transactional: ['consultation', 'pricing']
      }
    },
    ecommerce: {
      primary_concerns: ['price', 'quality', 'shipping', 'reviews', 'return policy'],
      positioning_focus: ['value', 'customer experience', 'fast delivery'],
      query_framing: {
        comparison: ['best under ${price}', 'vs competitor quality', 'with free shipping'],
        expertise: ['buying guide', 'how to choose'],
        transactional: ['buy', 'on sale', 'discount code']
      }
    },
    saas: {
      primary_concerns: ['features', 'pricing', 'integrations', 'support', 'ease of use'],
      positioning_focus: ['innovation', 'reliability', 'customer success'],
      query_framing: {
        comparison: ['best for {use_case}', 'vs alternatives', 'comparison'],
        expertise: ['how to', 'tutorials', 'documentation'],
        transactional: ['pricing', 'plans', 'trial']
      }
    }
  }

  const normalized = industry.toLowerCase().replace(/[^a-z]/g, '')
  return priorities[normalized] || priorities.technology
}

/**
 * Build prompt for Claude to generate intelligent queries
 */
function buildQueryDiscoveryPrompt(context: {
  organizationName: string
  industry: string
  competitors: string[]
  description: string
  recentNews: string[]
  industryPatterns: string[]
  geoTargets?: any
  serviceLines?: string[]  // NEW
  mcpProfile?: any  // NEW
  campaignGoal?: string | null  // NEW: Campaign-specific
  positioning?: any | null  // NEW: Campaign-specific
  stakeholders?: any[]  // NEW: Campaign-specific
}): string {
  const currentDate = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
  const currentYear = new Date().getFullYear()

  // Get industry-specific priorities
  const industryPriorities = getIndustryPriorities(context.industry)
  let industryPrioritiesSection = ''
  if (industryPriorities) {
    industryPrioritiesSection = `
📊 INDUSTRY-SPECIFIC PRIORITIES (${context.industry.toUpperCase()}):
This industry cares most about: ${industryPriorities.primary_concerns.join(', ')}
Positioning should focus on: ${industryPriorities.positioning_focus.join(', ')}

Query Generation Guidelines for ${context.industry}:
- Comparison queries: ${industryPriorities.query_framing.comparison.join(', ')}
- Expertise queries: ${industryPriorities.query_framing.expertise.join(', ')}
- Transactional queries: ${industryPriorities.query_framing.transactional.join(', ')}
`
  }

  // Build MCP-based business context (NEW - prioritize over GEO targets if available)
  let mcpContextSection = ''
  if (context.mcpProfile || context.serviceLines?.length > 0) {
    const services = context.serviceLines || []
    const productCategories = context.mcpProfile?.products_services?.map((p: any) => p.category || p.type).filter((c: string) => c) || []

    mcpContextSection = `
🔍 BUSINESS INTELLIGENCE FROM MCP DISCOVERY (PRIMARY SOURCE):
The following was automatically discovered about this organization's business:

${services.length > 0 ? `**Service Lines/Products** (USE THESE FOR CATEGORY QUERIES):
${services.map((s: string) => `- ${s}`).join('\n')}
` : ''}
${productCategories.length > 0 ? `**Product Categories**:
${[...new Set(productCategories)].map((c: string) => `- ${c}`).join('\n')}
` : ''}
${context.mcpProfile?.target_customers?.length > 0 ? `**Target Customers**:
${context.mcpProfile.target_customers.map((t: string) => `- ${t}`).join('\n')}
` : ''}
${context.mcpProfile?.key_differentiators?.length > 0 ? `**Key Differentiators**:
${context.mcpProfile.key_differentiators.map((d: string) => `- ${d}`).join('\n')}
` : ''}

**CRITICAL QUERY GENERATION RULES**:
1. Use SERVICE LINES and PRODUCT CATEGORIES for generic queries (NOT the company name)
2. Example GOOD queries: "best CRM software", "enterprise project management tools"
3. Example BAD queries: "best ${context.organizationName} software" (too easy to find!)
4. Only use company name for competitive queries: "${context.organizationName} vs Competitor"
`
  }

  // Build campaign-specific context if provided (HIGHEST PRIORITY)
  let campaignContextSection = ''
  if (context.campaignGoal || context.positioning) {
    campaignContextSection = `
🎯 CAMPAIGN-SPECIFIC CONTEXT (PRIMARY FOCUS):
This query discovery is for a SPECIFIC CAMPAIGN, not general GEO monitoring:

**Campaign Goal**: ${context.campaignGoal || 'N/A'}
${context.positioning ? `**Selected Positioning**: ${context.positioning.name || context.positioning.theme}
${context.positioning.description ? `**Positioning Description**: ${context.positioning.description}` : ''}
${context.positioning.target_psychographics ? `**Target Psychology**: ${JSON.stringify(context.positioning.target_psychographics)}` : ''}` : ''}
${context.stakeholders && context.stakeholders.length > 0 ? `**Target Stakeholders**: ${context.stakeholders.map((s: any) => s.name || s.title || s).slice(0, 5).join(', ')}` : ''}

**CRITICAL**: Generate queries that are DIRECTLY RELATED to this campaign goal and positioning.
- Queries should reflect what someone interested in "${context.campaignGoal}" would search for
- Align with the positioning strategy: "${context.positioning?.name || context.positioning?.theme}"
- Focus on queries where the campaign tactics will help gain AI visibility
- These are NOT generic organizational queries - they must serve THIS SPECIFIC CAMPAIGN
`
  }

  // Build GEO targets section if available (lower priority than campaign context)
  let geoTargetsSection = ''
  if (context.geoTargets && !mcpContextSection && !campaignContextSection) {
    geoTargetsSection = `
🎯 ORGANIZATION-SPECIFIC GEO TARGETS:
This organization has configured specific GEO optimization goals:

${context.geoTargets.service_lines?.length > 0 ? `**Service Lines/Specializations**:
${context.geoTargets.service_lines.map((s: string) => `- ${s}`).join('\n')}
` : ''}
${context.geoTargets.geographic_focus?.length > 0 ? `**Geographic Focus Areas**:
${context.geoTargets.geographic_focus.map((g: string) => `- ${g}`).join('\n')}
` : ''}
${context.geoTargets.industry_verticals?.length > 0 ? `**Industry Verticals Served**:
${context.geoTargets.industry_verticals.map((i: string) => `- ${i}`).join('\n')}
` : ''}
${context.geoTargets.priority_queries?.length > 0 ? `**Priority Queries (MUST INCLUDE)**:
${context.geoTargets.priority_queries.map((q: string) => `- "${q}"`).join('\n')}
` : ''}
`
  }

  return `You are a GEO (Generative Experience Optimization) expert. Your task is to generate high-value test queries that will reveal how AI platforms (Claude, ChatGPT, Gemini, Perplexity) respond to questions about this organization.

CURRENT DATE: ${currentDate}
CURRENT YEAR: ${currentYear}

IMPORTANT: Generate queries that are relevant for ${currentYear}. Do NOT reference 2024 or past years. Use "current", "latest", "${currentYear}", or no year at all.

ORGANIZATION CONTEXT:
- Name: ${context.organizationName}
- Industry: ${context.industry}
- Description: ${context.description || 'N/A'}
- Competitors: ${context.competitors.slice(0, 5).join(', ') || 'N/A'}
- Recent News: ${context.recentNews.slice(0, 3).join(', ') || 'N/A'}
${campaignContextSection}
${industryPrioritiesSection}
${mcpContextSection}
${geoTargetsSection}
${!context.geoTargets && !mcpContextSection && !campaignContextSection ? `INDUSTRY QUERY PATTERNS (FALLBACK):
${context.industryPatterns.map(p => `- ${p}`).join('\n')}` : ''}

TASK:
${campaignContextSection ? `Generate 25-30 queries SPECIFICALLY RELATED to the campaign goal and positioning above. These queries should represent what people would search for when they're interested in the campaign's focus area.` : `Generate 25-30 diverse test queries that real customers would use when researching solutions in this industry.`}

**CRITICAL RULES FOR QUERY GENERATION**:

1. **DO NOT include "${context.organizationName}" in generic queries** - this makes it too easy to find!
   ✅ GOOD: "best CRM for enterprise", "project management software comparison"
   ❌ BAD: "best ${context.organizationName} CRM", "${context.organizationName} features"

2. **ONLY use company name for competitive queries**:
   ✅ GOOD: "${context.organizationName} vs Salesforce", "alternatives to ${context.organizationName}"

3. **Focus on CATEGORIES and USE CASES**, not brand names:
   - Use service lines/product categories from MCP discovery above
   - Think like a customer who doesn't know ${context.organizationName} yet
   - Example: If they sell "AI writing tools", generate queries about "AI writing tools", not "${context.organizationName} writing"

**🎯 PRIMARY FOCUS: DISCOVERY & SUPERLATIVE QUERIES**
These are the HIGHEST VALUE queries - people discovering options without a vendor in mind yet.

**QUERY TEMPLATES TO USE** (Follow these patterns):

**Discovery/Superlative Templates** (50% of queries - MOST IMPORTANT):
- "best {industry/service_line} companies"
- "top {industry/service_line} firms"
- "leading {service_line} providers"
- "largest {industry} companies"
- "top rated {service_line}"
- "#1 {industry} company"
- "industry leading {service_line}"
- "best {service_line} in {region}"
- "top {industry} companies ${currentYear}"

**Solution-Seeking Templates** (30% of queries):
- "who provides {service_line}"
- "best {service_line} for {use_case}"
- "{industry} companies in {region}"
- "how to choose {service_line} provider"
- "what companies offer {service_line}"

**Comparison Templates** (20% of queries):
- "${context.organizationName} vs {competitor}"
- "{competitor} vs {competitor2}"
- "alternatives to {competitor}"
- "companies like {competitor}"

**EXAMPLES FOR THIS ORGANIZATION**:
${context.serviceLines?.length > 0 ? `
Using service lines: ${context.serviceLines.slice(0, 3).join(', ')}

Good queries:
- "best ${context.serviceLines[0].toLowerCase()} companies"
- "top ${context.serviceLines[0].toLowerCase()} firms"
- "leading ${context.industry.toLowerCase()} providers"
- "largest ${context.industry.toLowerCase()} companies"
` : ''}
**AVOID these patterns** - too specific, low volume:
❌ "how to optimize ${context.industry} operations"
❌ "strategies for improving ${context.industry} efficiency"
❌ "${context.organizationName} ${context.serviceLines?.[0]}" (except in vs queries)

REQUIREMENTS:
- Use natural language (how real people actually search)
- Focus on customer problems and use cases
- Mix broad category queries with specific feature queries
- Include competitor names (but NOT ${context.organizationName} except in vs queries)
- Make queries testable by AIs with current knowledge

OUTPUT FORMAT:
Return queries as a JSON array with this structure:
[
  {
    "query": "the actual query text",
    "intent": "comparison|competitive|transactional|informational|research",
    "priority": "critical|high|medium",
    "reasoning": "why this query matters"
  }
]

Generate the queries now:`
}

/**
 * Parse Claude's response to extract queries
 */
function parseQueryResponse(response: string): Array<{
  query: string
  intent: string
  priority: string
  reasoning?: string
}> {
  try {
    // Try to find JSON in the response
    const jsonMatch = response.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const queries = JSON.parse(jsonMatch[0])
      return queries.map((q: any) => ({
        query: q.query || q.text || q.pattern || '',
        intent: q.intent || 'informational',
        priority: q.priority || 'medium',
        reasoning: q.reasoning || ''
      })).filter((q: any) => q.query.length > 0)
    }

    // Fallback: parse line by line
    const lines = response.split('\n')
    const queries: any[] = []

    for (const line of lines) {
      // Look for patterns like "- query text" or "1. query text"
      const match = line.match(/^[\d\-\*\•]\s*(.+)/)
      if (match) {
        const queryText = match[1].trim()
        if (queryText.length > 5) {
          queries.push({
            query: queryText,
            intent: inferIntent(queryText),
            priority: 'medium',
            reasoning: ''
          })
        }
      }
    }

    return queries.slice(0, 30)
  } catch (error) {
    console.error('Error parsing query response:', error)
    return []
  }
}

/**
 * Infer query intent from text
 */
function inferIntent(query: string): string {
  const lowerQuery = query.toLowerCase()

  if (lowerQuery.includes('vs') || lowerQuery.includes('compare') || lowerQuery.includes('best')) {
    return 'comparison'
  }
  if (lowerQuery.includes('alternative') || lowerQuery.includes('instead of') || lowerQuery.includes('or')) {
    return 'competitive'
  }
  if (lowerQuery.includes('buy') || lowerQuery.includes('price') || lowerQuery.includes('cost')) {
    return 'transactional'
  }
  if (lowerQuery.includes('review') || lowerQuery.includes('good') || lowerQuery.includes('worth')) {
    return 'research'
  }
  if (lowerQuery.includes('how') || lowerQuery.includes('what') || lowerQuery.includes('why')) {
    return 'informational'
  }

  return 'informational'
}

/**
 * Categorize and prioritize queries
 */
function categorizeQueries(queries: any[]): {
  critical: any[]
  high: any[]
  medium: any[]
  by_intent: Record<string, any[]>
} {
  const categorized = {
    critical: queries.filter(q => q.priority === 'critical'),
    high: queries.filter(q => q.priority === 'high'),
    medium: queries.filter(q => q.priority === 'medium'),
    by_intent: {
      comparison: queries.filter(q => q.intent === 'comparison'),
      competitive: queries.filter(q => q.intent === 'competitive'),
      transactional: queries.filter(q => q.intent === 'transactional'),
      informational: queries.filter(q => q.intent === 'informational'),
      research: queries.filter(q => q.intent === 'research')
    }
  }

  return categorized
}

/**
 * Build comprehensive meta-analysis prompt for AI platforms
 */
function buildMetaAnalysisPrompt(context: {
  organizationName: string
  industry: string
  website: string | undefined
  queries: any[]
  description: string
  competitors: string[]
}): string {
  const queryList = context.queries.map((q, idx) =>
    `${idx + 1}. "${q.query}" (${q.intent || 'informational'}, priority: ${q.priority || 'medium'})`
  ).join('\n')

  return `You are conducting a GEO (Generative Engine Optimization) visibility analysis for ${context.organizationName}, ${context.industry ? `a ${context.industry} company` : 'an organization'}.

CONTEXT:
- Organization: ${context.organizationName}
- Industry: ${context.industry || 'Not specified'}
${context.website ? `- Website: ${context.website}` : ''}
${context.description ? `- Description: ${context.description}` : ''}
${context.competitors.length > 0 ? `- Competitors: ${context.competitors.slice(0, 5).join(', ')}` : ''}

YOUR TASK:
Simulate what happens when potential clients search for services in this space. For each query scenario below, analyze ${context.organizationName}'s visibility and competitive positioning.

QUERY SCENARIOS TO ANALYZE:
${queryList}

Please provide your analysis in valid JSON format (no markdown, just JSON):

{
  "overall_visibility": "high|medium|low|none",
  "visibility_summary": "2-3 sentence assessment of ${context.organizationName}'s overall presence across these query types",

  "query_results": [
    {
      "query": "the query text",
      "organizations_mentioned": ["Org1", "Org2", "Org3"],
      "target_mentioned": true/false,
      "target_rank": 1-10 or null,
      "why_these_appeared": "Brief explanation of what made these organizations appear",
      "sources_cited": ["domain1.com", "domain2.com"],
      "what_target_needs": "Specific gap ${context.organizationName} should address"
    }
  ],

  "competitive_intelligence": {
    "dominant_competitors": ["Top 3-5 organizations that appear most frequently"],
    "success_factors": "What makes certain organizations appear consistently (schema, content, authority signals)",
    "industry_patterns": "Common characteristics of high-visibility firms in this space"
  },

  "recommendations": [
    {
      "priority": "critical|high|medium",
      "category": "schema|content|pr|technical",
      "action": "Specific action ${context.organizationName} should take",
      "reasoning": "Why this matters based on competitive analysis",
      "expected_impact": "How this would improve visibility"
    }
  ],

  "source_intelligence": {
    "most_cited_sources": ["Publications/sites you reference most"],
    "why_these_sources": "What makes these sources authoritative to you",
    "coverage_strategy": "Where ${context.organizationName} should get featured to improve visibility"
  }
}

CRITICAL: Be honest about ${context.organizationName}'s current visibility. If they don't appear, say so. Base recommendations on real competitive gaps you observe.`
}
