// Memory Vault V2: Brand Context Cache
// Purpose: Ultra-fast brand guidelines/template lookup for content generators
// Performance Target: < 1ms (cached), never block content generation

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zskaxjtyuaqazydouifp.supabase.co'

function getSupabaseClient() {
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SUPABASE_SERVICE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
}

interface BrandContext {
  guidelines?: {
    id: string
    extracted_guidelines: any
    brand_voice_profile: any
    usage_instructions: string
  }
  template?: {
    id: string
    template_structure: any
    usage_instructions: string
  }
}

// Layer 1: In-memory cache (instant, per-process)
const brandContextCache = new Map<string, BrandContext | null>()

// Cache TTL: 5 minutes
const CACHE_TTL = 5 * 60 * 1000

// Track cache expiry times
const cacheExpiry = new Map<string, number>()

/**
 * Get brand context for content generation
 * CRITICAL: This must be FAST and NEVER block
 *
 * Performance:
 * - Cache hit: < 1ms
 * - Cache miss: < 20ms (with timeout)
 * - Error/timeout: Return null, continue without guidelines
 *
 * @param organizationId - Organization ID
 * @param contentType - Content type (press-release, social-post, etc)
 * @returns Brand context or null
 */
export async function getBrandContext(
  organizationId: string,
  contentType: string
): Promise<BrandContext | null> {
  const startTime = Date.now()
  const cacheKey = `${organizationId}:${contentType}`

  try {
    // Layer 1: Check in-memory cache
    const cached = brandContextCache.get(cacheKey)
    const expiry = cacheExpiry.get(cacheKey)

    if (cached !== undefined && expiry && expiry > Date.now()) {
      const duration = Date.now() - startTime
      logPerformance('brand_context_cache_hit', duration)
      return cached
    }

    // Cache miss: Query database (with strict timeout)
    const result = await queryBrandContext(organizationId, contentType)

    // Cache the result (even if null)
    brandContextCache.set(cacheKey, result)
    cacheExpiry.set(cacheKey, Date.now() + CACHE_TTL)

    // Auto-cleanup old cache entries
    scheduleCleanup()

    const duration = Date.now() - startTime
    logPerformance('brand_context_cache_miss', duration)

    return result
  } catch (error) {
    console.error('Brand context lookup failed, continuing without:', error)

    // CRITICAL: Cache null result to prevent repeated failures
    brandContextCache.set(cacheKey, null)
    cacheExpiry.set(cacheKey, Date.now() + CACHE_TTL)

    logPerformance('brand_context_error', Date.now() - startTime)

    return null
  }
}

/**
 * Query brand context from database with timeout
 * CRITICAL: Must timeout fast (20ms) and return null
 */
async function queryBrandContext(
  organizationId: string,
  contentType: string
): Promise<BrandContext | null> {
  const supabase = getSupabaseClient()
  try {
    // Race against timeout
    const result = await Promise.race([
      // Query database
      (async () => {
        const { data, error } = await supabase
          .from('brand_assets')
          .select('id, asset_type, extracted_guidelines, brand_voice_profile, template_structure, usage_instructions')
          .eq('organization_id', organizationId)
          .eq('status', 'active')
          .or(`asset_type.eq.guidelines-brand,asset_type.eq.template-${contentType}`)
          .limit(2)

        if (error) throw error

        return data || []
      })(),

      // Timeout after 20ms
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 20)
      )
    ])

    // Parse results
    const guidelines = result.find((item: any) => item.asset_type === 'guidelines-brand')
    const template = result.find((item: any) => item.asset_type === `template-${contentType}`)

    if (!guidelines && !template) {
      return null
    }

    // Boost salience for accessed assets (fire-and-forget, don't block)
    const assetIds = [guidelines?.id, template?.id].filter(Boolean) as string[]
    if (assetIds.length > 0) {
      boostBrandAssetSalience(assetIds).catch(() => {})
    }

    return {
      guidelines: guidelines ? {
        id: guidelines.id,
        extracted_guidelines: guidelines.extracted_guidelines,
        brand_voice_profile: guidelines.brand_voice_profile,
        usage_instructions: guidelines.usage_instructions
      } : undefined,
      template: template ? {
        id: template.id,
        template_structure: template.template_structure,
        usage_instructions: template.usage_instructions
      } : undefined
    }
  } catch (error) {
    // Timeout or database error
    if (error.message === 'timeout') {
      console.warn(`Brand context query timeout for org ${organizationId}`)
    }
    return null
  }
}

/**
 * Warm cache for an organization
 * Used by background jobs to pre-populate cache
 */
export async function warmBrandContextCache(
  organizationId: string,
  contentTypes: string[] = ['press-release', 'social-post', 'blog-post']
): Promise<void> {
  console.log(`🔥 Warming brand context cache for org: ${organizationId}`)

  const promises = contentTypes.map(type =>
    getBrandContext(organizationId, type).catch(() => null)
  )

  await Promise.all(promises)

  console.log(`✅ Cache warmed for org ${organizationId}`)
}

/**
 * Invalidate cache for an organization
 * Call this when brand assets are updated
 */
export function invalidateBrandContextCache(organizationId: string): void {
  const keys = Array.from(brandContextCache.keys())

  const orgKeys = keys.filter(key => key.startsWith(`${organizationId}:`))

  orgKeys.forEach(key => {
    brandContextCache.delete(key)
    cacheExpiry.delete(key)
  })

  console.log(`🗑️ Invalidated ${orgKeys.length} cache entries for org ${organizationId}`)
}

/**
 * Get cache statistics (for monitoring)
 */
export function getCacheStats(): {
  size: number
  keys: string[]
  hitRate?: number
} {
  return {
    size: brandContextCache.size,
    keys: Array.from(brandContextCache.keys())
  }
}

/**
 * Cleanup expired cache entries
 */
let cleanupScheduled = false

function scheduleCleanup() {
  if (cleanupScheduled) return

  cleanupScheduled = true

  setTimeout(() => {
    const now = Date.now()
    const expiredKeys: string[] = []

    cacheExpiry.forEach((expiry, key) => {
      if (expiry < now) {
        expiredKeys.push(key)
      }
    })

    expiredKeys.forEach(key => {
      brandContextCache.delete(key)
      cacheExpiry.delete(key)
    })

    if (expiredKeys.length > 0) {
      console.log(`🧹 Cleaned up ${expiredKeys.length} expired cache entries`)
    }

    cleanupScheduled = false
  }, 60000) // Run every minute
}

/**
 * Log performance metrics
 */
function logPerformance(metricType: string, duration: number): void {
  // Only log if duration is concerning
  if (duration > 10) {
    console.warn(`⚠️ Brand context lookup took ${duration}ms (${metricType})`)
  }

  // TODO: Send to monitoring system
}

/**
 * Sync version: Get from cache only (no DB query)
 * Use this for content generation where you want ZERO latency
 */
export function getBrandContextSync(
  organizationId: string,
  contentType: string
): BrandContext | null {
  const cacheKey = `${organizationId}:${contentType}`
  const cached = brandContextCache.get(cacheKey)
  const expiry = cacheExpiry.get(cacheKey)

  if (cached !== undefined && expiry && expiry > Date.now()) {
    return cached
  }

  // Not cached: fire-and-forget warm for next time
  warmBrandContextCache(organizationId, [contentType]).catch(() => {})

  return null
}

/**
 * Boost salience for brand assets when accessed
 * Fire-and-forget, never blocks
 */
async function boostBrandAssetSalience(assetIds: string[]): Promise<void> {
  const supabase = getSupabaseClient()
  try {
    // Boost salience by 0.05 (5%) and increment access_count
    await supabase
      .from('brand_assets')
      .update({
        last_accessed_at: new Date().toISOString()
      })
      .in('id', assetIds)

    // Note: We use a simple update here because brand_assets doesn't have
    // the boost_salience_on_access function. The actual salience boost
    // will be calculated during the next decay cycle based on last_accessed_at.
  } catch (error) {
    // Silently fail - this is not critical
  }
}
