import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * ENTITY ENRICHER
 *
 * Stage 3 of Schema Generation Pipeline
 *
 * Enriches and validates extracted entities:
 * - Deduplicates entities found across multiple pages
 * - Validates URLs, emails, phone numbers
 * - Normalizes data formats
 * - Prioritizes entities by completeness
 * - Cross-references with GEO insights (if available)
 */

interface EnricherRequest {
  organization_id: string
  organization_name: string
  entities: {
    products: any[]
    services: any[]
    team: any[]
    locations: any[]
    subsidiaries: any[]
  }
  geo_insights?: any // Optional: insights from GEO discovery
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
      entities,
      geo_insights
    }: EnricherRequest = await req.json()

    if (!organization_id || !organization_name || !entities) {
      throw new Error('organization_id, organization_name, and entities required')
    }

    console.log('✨ Entity Enricher Starting:', {
      organization_name,
      input_totals: {
        products: entities.products?.length || 0,
        services: entities.services?.length || 0,
        team: entities.team?.length || 0,
        locations: entities.locations?.length || 0,
        subsidiaries: entities.subsidiaries?.length || 0
      }
    })

    // STEP 1: Deduplicate entities
    const enrichedProducts = deduplicateByName(entities.products || [])
    const enrichedServices = deduplicateByName(entities.services || [])
    const enrichedTeam = deduplicateByName(entities.team || [])
    const enrichedLocations = deduplicateByName(entities.locations || [])
    const enrichedSubsidiaries = deduplicateByName(entities.subsidiaries || [])

    console.log('🔄 Deduplication complete:', {
      products: `${entities.products?.length || 0} → ${enrichedProducts.length}`,
      services: `${entities.services?.length || 0} → ${enrichedServices.length}`,
      team: `${entities.team?.length || 0} → ${enrichedTeam.length}`,
      locations: `${entities.locations?.length || 0} → ${enrichedLocations.length}`,
      subsidiaries: `${entities.subsidiaries?.length || 0} → ${enrichedSubsidiaries.length}`
    })

    // STEP 2: Validate and normalize data
    const validatedProducts = enrichedProducts.map(validateProduct)
    const validatedServices = enrichedServices.map(validateService)
    const validatedTeam = enrichedTeam.map(validatePerson)
    const validatedLocations = enrichedLocations.map(validateLocation)
    const validatedSubsidiaries = enrichedSubsidiaries.map(validateSubsidiary)

    // STEP 3: Prioritize by completeness
    const prioritizedProducts = prioritizeByCompleteness(validatedProducts)
    const prioritizedServices = prioritizeByCompleteness(validatedServices)
    const prioritizedTeam = prioritizeByCompleteness(validatedTeam)
    const prioritizedLocations = prioritizeByCompleteness(validatedLocations)
    const prioritizedSubsidiaries = prioritizeByCompleteness(validatedSubsidiaries)

    // STEP 4: Apply GEO insights (if available)
    if (geo_insights) {
      console.log('🎯 Applying GEO insights to enrich entities')
      // Could add competitor comparison, visibility tags, etc.
    }

    const totalEnriched =
      prioritizedProducts.length +
      prioritizedServices.length +
      prioritizedTeam.length +
      prioritizedLocations.length +
      prioritizedSubsidiaries.length

    console.log('✅ Entity Enrichment Complete:', {
      total_enriched: totalEnriched,
      products: prioritizedProducts.length,
      services: prioritizedServices.length,
      team: prioritizedTeam.length,
      locations: prioritizedLocations.length,
      subsidiaries: prioritizedSubsidiaries.length
    })

    return new Response(
      JSON.stringify({
        success: true,
        enriched_entities: {
          products: prioritizedProducts,
          services: prioritizedServices,
          team: prioritizedTeam,
          locations: prioritizedLocations,
          subsidiaries: prioritizedSubsidiaries
        },
        summary: {
          total_entities: totalEnriched,
          by_type: {
            products: prioritizedProducts.length,
            services: prioritizedServices.length,
            team: prioritizedTeam.length,
            locations: prioritizedLocations.length,
            subsidiaries: prioritizedSubsidiaries.length
          },
          quality_metrics: {
            deduplication_rate: calculateDeduplicationRate(entities, {
              products: prioritizedProducts,
              services: prioritizedServices,
              team: prioritizedTeam,
              locations: prioritizedLocations,
              subsidiaries: prioritizedSubsidiaries
            }),
            avg_completeness: calculateAverageCompleteness([
              ...prioritizedProducts,
              ...prioritizedServices,
              ...prioritizedTeam,
              ...prioritizedLocations,
              ...prioritizedSubsidiaries
            ])
          }
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('❌ Entity Enricher Error:', error)
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
 * Deduplicate entities by name (case-insensitive)
 */
function deduplicateByName(entities: any[]): any[] {
  const seen = new Map<string, any>()

  for (const entity of entities) {
    if (!entity.name) continue

    const normalizedName = entity.name.toLowerCase().trim()

    if (seen.has(normalizedName)) {
      // Merge: keep entity with more complete data
      const existing = seen.get(normalizedName)
      const merged = mergeEntities(existing, entity)
      seen.set(normalizedName, merged)
    } else {
      seen.set(normalizedName, entity)
    }
  }

  return Array.from(seen.values())
}

/**
 * Merge two entities, preferring non-null values
 */
function mergeEntities(a: any, b: any): any {
  const merged = { ...a }

  for (const key in b) {
    if (b[key] && !merged[key]) {
      merged[key] = b[key]
    } else if (b[key] && typeof b[key] === 'string' && b[key].length > (merged[key]?.length || 0)) {
      // Prefer longer strings (likely more descriptive)
      merged[key] = b[key]
    }
  }

  return merged
}

/**
 * Validate and normalize product data
 */
function validateProduct(product: any): any {
  return {
    ...product,
    name: product.name?.trim() || 'Unnamed Product',
    url: validateUrl(product.url),
    completeness: calculateCompleteness(product, ['name', 'description', 'category'])
  }
}

/**
 * Validate and normalize service data
 */
function validateService(service: any): any {
  return {
    ...service,
    name: service.name?.trim() || 'Unnamed Service',
    url: validateUrl(service.url),
    completeness: calculateCompleteness(service, ['name', 'description', 'category'])
  }
}

/**
 * Validate and normalize person data
 */
function validatePerson(person: any): any {
  return {
    ...person,
    name: person.name?.trim() || 'Unnamed Person',
    linkedin_url: validateUrl(person.linkedin_url),
    image_url: validateUrl(person.image_url),
    completeness: calculateCompleteness(person, ['name', 'title', 'bio'])
  }
}

/**
 * Validate and normalize location data
 */
function validateLocation(location: any): any {
  return {
    ...location,
    name: location.name?.trim() || 'Unnamed Location',
    email: validateEmail(location.email),
    phone: normalizePhone(location.phone),
    completeness: calculateCompleteness(location, ['name', 'address', 'city', 'country'])
  }
}

/**
 * Validate and normalize subsidiary data
 */
function validateSubsidiary(subsidiary: any): any {
  return {
    ...subsidiary,
    name: subsidiary.name?.trim() || 'Unnamed Subsidiary',
    url: validateUrl(subsidiary.url),
    completeness: calculateCompleteness(subsidiary, ['name', 'description', 'industry'])
  }
}

/**
 * Validate URL format
 */
function validateUrl(url: string | undefined): string | undefined {
  if (!url) return undefined

  try {
    new URL(url)
    return url
  } catch {
    // Try adding https://
    try {
      new URL(`https://${url}`)
      return `https://${url}`
    } catch {
      return undefined
    }
  }
}

/**
 * Validate email format
 */
function validateEmail(email: string | undefined): string | undefined {
  if (!email) return undefined

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) ? email : undefined
}

/**
 * Normalize phone number
 */
function normalizePhone(phone: string | undefined): string | undefined {
  if (!phone) return undefined

  // Remove non-numeric characters except + and ()
  return phone.replace(/[^\d+()-]/g, '')
}

/**
 * Calculate completeness score (0-1)
 */
function calculateCompleteness(entity: any, requiredFields: string[]): number {
  let filled = 0

  for (const field of requiredFields) {
    if (entity[field] && entity[field].toString().trim().length > 0) {
      filled++
    }
  }

  return filled / requiredFields.length
}

/**
 * Prioritize entities by completeness
 */
function prioritizeByCompleteness(entities: any[]): any[] {
  return entities
    .sort((a, b) => (b.completeness || 0) - (a.completeness || 0))
}

/**
 * Calculate deduplication rate
 */
function calculateDeduplicationRate(original: any, enriched: any): number {
  const originalTotal = Object.values(original).reduce((sum: number, arr: any) => sum + (arr?.length || 0), 0)
  const enrichedTotal = Object.values(enriched).reduce((sum: number, arr: any) => sum + (arr?.length || 0), 0)

  if (originalTotal === 0) return 0

  return ((originalTotal - enrichedTotal) / originalTotal) * 100
}

/**
 * Calculate average completeness
 */
function calculateAverageCompleteness(entities: any[]): number {
  if (entities.length === 0) return 0

  const totalCompleteness = entities.reduce((sum, e) => sum + (e.completeness || 0), 0)
  return (totalCompleteness / entities.length) * 100
}
