import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.27.3'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

/**
 * SCHEMA ENHANCEMENT REGENERATOR
 *
 * Takes user-provided enhancements (awards, social profiles, testimonials, products page)
 * and regenerates the schema with this additional rich data.
 */

interface EnhancementRequest {
  organization_id: string
  current_schema: any
  enhancements: {
    awards_media?: string // Newline-separated awards/media mentions
    social_profiles?: {
      linkedin?: string
      twitter?: string
      facebook?: string
      instagram?: string
    }
    testimonials?: string // Newline-separated testimonials or URLs
    products_page?: string // URL to products/pricing page
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const {
      organization_id,
      current_schema,
      enhancements
    }: EnhancementRequest = await req.json()

    if (!organization_id || !current_schema || !enhancements) {
      throw new Error('organization_id, current_schema, and enhancements required')
    }

    console.log('🎯 Schema Enhancement Regenerator:', {
      organization_id,
      has_awards: !!enhancements.awards_media,
      has_social: !!enhancements.social_profiles,
      has_testimonials: !!enhancements.testimonials,
      has_products: !!enhancements.products_page
    })

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Scrape products page if provided
    let productsPageContent = null
    if (enhancements.products_page) {
      console.log('📄 Scraping products page:', enhancements.products_page)
      try {
        const scrapeResponse = await supabase.functions.invoke('website-entity-scraper', {
          body: {
            url: enhancements.products_page,
            organization_id
          }
        })

        if (scrapeResponse.data?.content) {
          productsPageContent = scrapeResponse.data.content
          console.log('✅ Products page scraped')
        }
      } catch (err) {
        console.warn('⚠️ Failed to scrape products page:', err)
      }
    }

    // Use Claude to regenerate schema with enhancements
    const anthropic = new Anthropic({ apiKey: anthropicApiKey })

    const prompt = `You are enhancing a schema.org graph with user-provided information.

<current_schema>
${JSON.stringify(current_schema, null, 2)}
</current_schema>

<user_enhancements>
${enhancements.awards_media ? `
AWARDS & MEDIA HIGHLIGHTS:
${enhancements.awards_media}
` : ''}

${enhancements.social_profiles ? `
SOCIAL MEDIA PROFILES:
- LinkedIn: ${enhancements.social_profiles.linkedin || 'Not provided'}
- Twitter/X: ${enhancements.social_profiles.twitter || 'Not provided'}
- Facebook: ${enhancements.social_profiles.facebook || 'Not provided'}
- Instagram: ${enhancements.social_profiles.instagram || 'Not provided'}
` : ''}

${enhancements.testimonials ? `
CUSTOMER TESTIMONIALS:
${enhancements.testimonials}
` : ''}

${productsPageContent ? `
PRODUCTS/PRICING PAGE CONTENT:
${productsPageContent.substring(0, 5000)}
` : ''}
</user_enhancements>

Your task is to enhance the existing schema with this new information:

1. **Awards**: Add to the Organization entity as an "award" property (array of strings)

2. **Social Profiles**: Add to Organization as "sameAs" property (array of URLs)
   - Only include URLs that were actually provided (not "Not provided")

3. **Testimonials**:
   - If testimonials contain URLs, add them as references
   - If testimonials are text quotes, create Review entities with schema.org Review type
   - Link reviews to the Organization

4. **Products/Pricing**:
   - Extract product names, descriptions, and pricing from the scraped content
   - Create or enhance existing Product entities
   - Add "offers" property with Offer type containing price, priceCurrency, availability

IMPORTANT RULES:
- Preserve ALL existing entities and structure from current_schema
- Only ADD new properties and entities
- Keep the @graph structure intact
- Return valid schema.org markup
- For pricing, use actual currency codes (USD, EUR, etc.)
- For availability, use schema.org vocabulary (https://schema.org/InStock, etc.)

Return the enhanced schema as valid JSON with @context and @graph structure.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    // Extract JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from Claude response')
    }

    const enhancedSchema = JSON.parse(jsonMatch[0])

    console.log('✅ Schema enhanced successfully')

    // Count enhancements
    const org = enhancedSchema['@graph']?.find((item: any) => item['@type'] === 'Organization')
    const stats = {
      awards_added: org?.award?.length || 0,
      social_profiles_added: org?.sameAs?.length || 0,
      reviews_added: enhancedSchema['@graph']?.filter((item: any) => item['@type'] === 'Review').length || 0,
      products_with_pricing: enhancedSchema['@graph']?.filter((item: any) =>
        item['@type'] === 'Product' && item.offers
      ).length || 0
    }

    return new Response(
      JSON.stringify({
        success: true,
        enhanced_schema: enhancedSchema,
        enhancements_applied: stats
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error: any) {
    console.error('❌ Enhancement error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Enhancement failed',
        details: error.toString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
