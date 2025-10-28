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
      recent_news = []
    } = await req.json()

    if (!organization_id || !organization_name) {
      throw new Error('organization_id and organization_name required')
    }

    console.log('🔍 GEO Query Discovery Starting:', {
      organization_name,
      industry,
      competitors: competitors.length,
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

    const orgIndustry = industry || org?.industry || 'technology'
    const orgCompetitors = competitors.length > 0 ? competitors : (org?.competitors || [])
    const orgDescription = org?.description || ''

    console.log(`📊 Organization: ${organization_name}`)
    console.log(`🏭 Industry: ${orgIndustry}`)
    console.log(`🏢 Competitors: ${orgCompetitors.length}`)

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

    // Get GEO Intelligence Registry patterns for this industry (fallback)
    const industryPatterns = getIndustryPatterns(orgIndustry)
    console.log(`📚 Found ${industryPatterns.length} industry patterns`)

    // Use Claude to generate intelligent, contextual queries
    const anthropic = new Anthropic({
      apiKey: Deno.env.get('ANTHROPIC_API_KEY')
    })

    const prompt = buildQueryDiscoveryPrompt({
      organizationName: organization_name,
      industry: orgIndustry,
      competitors: orgCompetitors,
      description: orgDescription,
      recentNews: recent_news,
      industryPatterns,
      geoTargets
    })

    console.log('🤖 Calling Claude for query generation...')

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

    // Parse Claude's response to extract queries
    const queries = parseQueryResponse(responseText)
    console.log(`✅ Generated ${queries.length} test queries`)

    // Categorize and prioritize queries
    const categorizedQueries = categorizeQueries(queries)

    return new Response(
      JSON.stringify({
        success: true,
        organization_name,
        industry: orgIndustry,
        total_queries: queries.length,
        queries: categorizedQueries,
        geo_targets_used: !!geoTargets,
        geo_targets_summary: geoTargets ? {
          service_lines: geoTargets.service_lines?.length || 0,
          geographic_focus: geoTargets.geographic_focus?.length || 0,
          priority_queries: geoTargets.priority_queries?.length || 0,
          industry_verticals: geoTargets.industry_verticals?.length || 0
        } : null,
        industry_patterns_used: !geoTargets ? industryPatterns.length : 0,
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

  // Build GEO targets section if available
  let geoTargetsSection = ''
  if (context.geoTargets) {
    geoTargetsSection = `
🎯 ORGANIZATION-SPECIFIC GEO TARGETS (HIGH PRIORITY):
This organization has configured specific GEO optimization goals. PRIORITIZE these when generating queries:

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
${context.geoTargets.geo_competitors?.length > 0 ? `**GEO Competitors (for benchmarking)**:
${context.geoTargets.geo_competitors.map((c: string) => `- ${c}`).join('\n')}
` : ''}
${context.geoTargets.positioning_goals && Object.keys(context.geoTargets.positioning_goals).length > 0 ? `**Positioning Goals**:
${Object.entries(context.geoTargets.positioning_goals).map(([key, value]) => `- ${key}: "${value}"`).join('\n')}
` : ''}

INSTRUCTIONS FOR GEO TARGETS:
1. Include ALL priority_queries exactly as specified
2. Generate additional queries that combine service_lines + geographic_focus
3. Generate queries about service_lines + industry_verticals
4. Include comparison queries against geo_competitors
5. Ensure queries align with positioning_goals
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
${industryPrioritiesSection}
${geoTargetsSection}
${!context.geoTargets ? `INDUSTRY QUERY PATTERNS (FALLBACK - No GEO Targets Configured):
${context.industryPatterns.map(p => `- ${p}`).join('\n')}` : ''}

TASK:
Generate 25-30 diverse test queries that someone might ask an AI about this organization or its industry.

**IMPORTANT**: Use the industry priorities above to frame queries around what this industry ACTUALLY cares about. For example:
- Retail/Ecommerce: Focus on price, quality, reviews, shipping
- Finance: Focus on security, fees, returns, trust
- Professional Services: Focus on expertise, credentials, case studies
- Technology: Focus on features, integrations, ease of use

Mix query types:

1. **Comparison Queries** (30%): "best X", "X vs Y", "top X platforms"
2. **Competitive Queries** (25%): "alternatives to X", "X or Y", "is X better than Y"
3. **Transactional Queries** (20%): "buy X", "X pricing", "X discount"
4. **Informational Queries** (15%): "how to X", "what is X", "X features"
5. **Research Queries** (10%): "X reviews", "is X good", "X pros and cons"

REQUIREMENTS:
- Use natural language (how real people search)
- Include competitor names in some queries
- Mix broad and specific queries
- Include both brand name and category queries
- Consider current trends and user intent
- Make queries testable (AI can answer them)

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
