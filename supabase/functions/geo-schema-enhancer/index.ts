import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.27.3'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * GEO SCHEMA ENHANCER
 *
 * Stage 7 of Schema Generation Pipeline
 *
 * Takes a basic schema and enhances it for GEO optimization:
 * - Adds FAQPage with compelling Q&A
 * - Adds awards and achievements
 * - Enhances descriptions to be more compelling
 * - Adds industry keywords
 * - Optimizes for AI discovery
 *
 * Uses Claude to analyze the organization's positive coverage and entities
 * to generate genuinely valuable enhancements.
 */

interface EnhancerRequest {
  organization_id: string
  organization_name: string
  industry?: string
  base_schema: any // The basic schema from schema-graph-generator
  coverage_articles?: any[] // Positive coverage for context
  entities?: any // Entity data for context
  discovery_insights?: string // Research from mcp-discovery
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
      base_schema,
      coverage_articles = [],
      entities = {},
      discovery_insights = null
    }: EnhancerRequest = await req.json()

    if (!organization_id || !organization_name || !base_schema) {
      throw new Error('organization_id, organization_name, and base_schema required')
    }

    console.log('✨ GEO Schema Enhancer Starting:', {
      organization_name,
      industry,
      has_coverage: coverage_articles.length > 0,
      has_entities: Object.keys(entities).length > 0,
      has_discovery: !!discovery_insights
    })

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured')
    }

    const anthropic = new Anthropic({ apiKey: anthropicApiKey })

    // Build context from coverage, entities, and discovery research
    const context = buildContext(organization_name, industry, coverage_articles, entities, discovery_insights)

    console.log('🔍 Generating GEO enhancements with Claude...')

    // Use Claude to generate FAQs, awards, and enhanced descriptions
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514', // Use Sonnet 4 for quality
      max_tokens: 8192,
      messages: [{
        role: 'user',
        content: `You are a GEO (Generative Engine Optimization) expert enhancing a schema.org graph for ${organization_name}.

<context>
${context}
</context>

<current_schema>
${JSON.stringify(base_schema, null, 2)}
</current_schema>

Your task is to enhance this schema for maximum AI discoverability by adding:

1. **FAQPage Schema**: 5-7 compelling questions and answers that:
   - Address common searches related to the organization's services
   - Showcase achievements and differentiators
   - Include relevant keywords naturally
   - Are genuinely helpful (not just marketing fluff)

2. **Awards & Achievements**: If coverage mentions any awards, recognition, or achievements:
   - Add them as Award schema objects
   - Be specific about what was won and when

3. **Enhanced Descriptions**: Improve existing descriptions to be:
   - More compelling and specific
   - Include concrete achievements/numbers when possible
   - Optimized for common search queries
   - Still accurate (don't invent facts)

4. **Keywords & Topics**: Add:
   - Industry-specific keywords
   - Service/product categories
   - Expertise areas

Return a JSON object with this structure:

{
  "faq_page": {
    "@type": "FAQPage",
    "@id": "url#faqpage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Question text",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Answer text"
        }
      }
    ]
  },
  "awards": [
    {
      "@type": "Award",
      "name": "Award name",
      "description": "What it's for",
      "dateReceived": "2024-01-01"
    }
  ],
  "enhanced_descriptions": {
    "organization": "Enhanced main org description",
    "services": {
      "service-0": "Enhanced description for first service",
      "service-1": "Enhanced description for second service"
    }
  },
  "keywords": ["keyword1", "keyword2", "keyword3"]
}

Guidelines:
- Only include FAQs that genuinely add value
- Only add awards if mentioned in coverage
- Keep descriptions factual - enhance clarity, don't invent
- Focus on what makes the organization unique
- Return valid JSON only, no additional text`
      }]
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}'

    // Clean markdown code blocks if present (Claude sometimes wraps JSON in ```json...```)
    let cleanedResponse = responseText.trim()
    if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    }

    // Parse the JSON response
    let enhancements
    try {
      enhancements = JSON.parse(cleanedResponse)
    } catch (parseError) {
      console.error('Failed to parse Claude response:', parseError)
      console.error('Response was:', responseText)
      throw new Error('Failed to parse enhancement results')
    }

    console.log('✅ Enhancements generated:', {
      faq_questions: enhancements.faq_page?.mainEntity?.length || 0,
      awards: enhancements.awards?.length || 0,
      keywords: enhancements.keywords?.length || 0,
      enhanced_descriptions: Object.keys(enhancements.enhanced_descriptions || {}).length
    })

    // Apply enhancements to schema
    const enhancedSchema = applyEnhancements(base_schema, enhancements)

    console.log('✨ Schema enhancement complete')

    return new Response(
      JSON.stringify({
        success: true,
        enhanced_schema: enhancedSchema,
        enhancements_applied: {
          faq_page: !!enhancements.faq_page,
          awards_count: enhancements.awards?.length || 0,
          keywords_count: enhancements.keywords?.length || 0,
          descriptions_enhanced: Object.keys(enhancements.enhanced_descriptions || {}).length
        },
        summary: {
          original_entity_count: base_schema['@graph']?.length || 0,
          enhanced_entity_count: enhancedSchema['@graph']?.length || 0,
          faq_questions_added: enhancements.faq_page?.mainEntity?.length || 0
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('❌ GEO Schema Enhancer Error:', error)
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
 * Build context string from coverage, entities, and discovery research
 */
function buildContext(
  organizationName: string,
  industry: string | undefined,
  coverage: any[],
  entities: any,
  discoveryInsights: string | null
): string {
  let context = `Organization: ${organizationName}\n`

  if (industry) {
    context += `Industry: ${industry}\n`
  }

  context += `\n`

  // Add discovery research insights (revenue, rankings, peers, etc.)
  if (discoveryInsights) {
    context += `\n## Research Insights (Use these facts to enhance descriptions and add context):\n${discoveryInsights}\n\n`
  }

  // Add entities summary
  if (entities.services && entities.services.length > 0) {
    context += `\nServices (${entities.services.length}):\n`
    entities.services.slice(0, 5).forEach((s: any) => {
      context += `- ${s.name}: ${s.description || 'N/A'}\n`
    })
  }

  if (entities.products && entities.products.length > 0) {
    context += `\nProducts (${entities.products.length}):\n`
    entities.products.slice(0, 5).forEach((p: any) => {
      context += `- ${p.name}: ${p.description || 'N/A'}\n`
    })
  }

  // Add positive coverage
  if (coverage && coverage.length > 0) {
    context += `\nPositive Coverage:\n`
    coverage.forEach((article: any) => {
      context += `- ${article.title || article.headline}: ${article.url}\n`
      if (article.excerpt || article.description) {
        context += `  "${article.excerpt || article.description}"\n`
      }
    })
  }

  return context
}

/**
 * Apply enhancements to base schema
 */
function applyEnhancements(baseSchema: any, enhancements: any): any {
  const enhanced = JSON.parse(JSON.stringify(baseSchema)) // Deep clone

  if (!enhanced['@graph']) {
    enhanced['@graph'] = []
  }

  const graph = enhanced['@graph']
  const organizationNode = graph.find((node: any) => node['@type'] === 'Organization' && !node.parentOrganization)

  // 1. Add FAQPage to graph
  if (enhancements.faq_page && enhancements.faq_page.mainEntity?.length > 0) {
    graph.push(enhancements.faq_page)

    // Link from organization
    if (organizationNode) {
      if (!organizationNode.mainEntity) {
        organizationNode.mainEntity = []
      }
      organizationNode.mainEntity.push({
        '@id': enhancements.faq_page['@id']
      })
    }
  }

  // 2. Add awards to organization node
  if (enhancements.awards && enhancements.awards.length > 0 && organizationNode) {
    organizationNode.award = enhancements.awards
  }

  // 3. Add keywords to organization node
  if (enhancements.keywords && enhancements.keywords.length > 0 && organizationNode) {
    organizationNode.knowsAbout = enhancements.keywords
  }

  // 4. Enhance descriptions
  if (enhancements.enhanced_descriptions) {
    // Enhance organization description
    if (enhancements.enhanced_descriptions.organization && organizationNode) {
      organizationNode.description = enhancements.enhanced_descriptions.organization
    }

    // Enhance service descriptions
    if (enhancements.enhanced_descriptions.services) {
      Object.keys(enhancements.enhanced_descriptions.services).forEach((serviceId) => {
        const serviceNode = graph.find((node: any) => node['@id']?.includes(serviceId))
        if (serviceNode) {
          serviceNode.description = enhancements.enhanced_descriptions.services[serviceId]
        }
      })
    }
  }

  return enhanced
}
