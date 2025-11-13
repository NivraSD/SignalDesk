import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.27.3'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * ENTITY EXTRACTOR
 *
 * Stage 2 of Schema Generation Pipeline
 *
 * Uses Claude to extract structured entities from scraped website text.
 * Fast, reliable, and gives us full control over extraction quality.
 *
 * Extracts:
 * - Products & Services
 * - Team members & Leadership
 * - Locations & Offices
 * - Subsidiaries & Business units
 */

interface ExtractorRequest {
  organization_id: string
  organization_name: string
  scraped_pages: Array<{
    url: string
    title: string
    markdown: string
  }>
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    })
  }

  try {
    const {
      organization_id,
      organization_name,
      scraped_pages
    }: ExtractorRequest = await req.json()

    if (!organization_id || !organization_name || !scraped_pages) {
      throw new Error('organization_id, organization_name, and scraped_pages required')
    }

    console.log('🔍 Entity Extractor Starting:', {
      organization_name,
      pages_count: scraped_pages.length
    })

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured')
    }

    const anthropic = new Anthropic({ apiKey: anthropicApiKey })

    // Combine all page content
    const combinedContent = scraped_pages
      .map(page => {
        const pageContent = `# ${page.title || page.url}\n\n${page.markdown}`
        console.log(`   - Page: ${page.url} → ${page.markdown?.length || 0} chars`)
        return pageContent
      })
      .join('\n\n---\n\n')

    console.log(`📄 Processing ${combinedContent.length} characters of text from ${scraped_pages.length} pages`)

    if (combinedContent.length < 500) {
      console.warn(`⚠️  WARNING: Very little content (${combinedContent.length} chars) - extraction will likely fail`)
      console.log(`First 500 chars of content:`, combinedContent.substring(0, 500))
    }

    // Extract entities using Claude with structured output
    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022', // Fast and cheap
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `You are analyzing website content for ${organization_name}. Extract structured information about the organization.

<website_content>
${combinedContent}
</website_content>

Extract and return a JSON object with the following structure:

{
  "products": [
    {
      "name": "Product name",
      "description": "What it does",
      "category": "Product category",
      "url": "Product page URL if mentioned"
    }
  ],
  "services": [
    {
      "name": "Service name",
      "description": "What it provides",
      "category": "Service category",
      "service_type": "Type of service"
    }
  ],
  "team": [
    {
      "name": "Person name",
      "title": "Job title",
      "role": "Role/responsibility",
      "bio": "Brief bio if available",
      "linkedin_url": "LinkedIn URL if mentioned",
      "image_url": "Photo URL if available"
    }
  ],
  "locations": [
    {
      "name": "Location name",
      "type": "headquarters|office|store|facility",
      "address": "Full address",
      "city": "City",
      "state": "State/Province",
      "country": "Country",
      "postal_code": "Postal code",
      "phone": "Phone number",
      "email": "Email"
    }
  ],
  "subsidiaries": [
    {
      "name": "Subsidiary name",
      "description": "What they do",
      "type": "subsidiary|division|business_unit",
      "industry": "Industry",
      "url": "Website URL"
    }
  ]
}

Guidelines:
- Only extract information explicitly mentioned in the content
- Be thorough but accurate - don't invent information
- For team members, prioritize leadership and executives
- Include as much detail as available for each entity
- Return valid JSON only, no additional text`
      }]
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}'

    // Extract JSON from response (Claude sometimes adds explanatory text before/after JSON)
    let jsonText = responseText
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonText = jsonMatch[0]
    }

    // Parse the JSON response
    let entities
    try {
      entities = JSON.parse(jsonText)
    } catch (parseError) {
      console.error('Failed to parse Claude response:', parseError)
      console.error('Response was:', responseText)
      console.error('Extracted JSON:', jsonText)
      throw new Error('Failed to parse entity extraction results')
    }

    // Count totals
    const totalEntities =
      (entities.products?.length || 0) +
      (entities.services?.length || 0) +
      (entities.team?.length || 0) +
      (entities.locations?.length || 0) +
      (entities.subsidiaries?.length || 0)

    console.log('✅ Entity Extraction Complete:', {
      total_entities: totalEntities,
      products: entities.products?.length || 0,
      services: entities.services?.length || 0,
      team: entities.team?.length || 0,
      locations: entities.locations?.length || 0,
      subsidiaries: entities.subsidiaries?.length || 0
    })

    return new Response(
      JSON.stringify({
        success: true,
        entities: {
          products: entities.products || [],
          services: entities.services || [],
          team: entities.team || [],
          locations: entities.locations || [],
          subsidiaries: entities.subsidiaries || []
        },
        summary: {
          total_entities: totalEntities,
          by_type: {
            products: entities.products?.length || 0,
            services: entities.services?.length || 0,
            team: entities.team?.length || 0,
            locations: entities.locations?.length || 0,
            subsidiaries: entities.subsidiaries?.length || 0
          }
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('❌ Entity Extractor Error:', error)
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
