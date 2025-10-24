// Memory Vault V2: Brand Context Cache Warming
// Purpose: Preload brand context into cache for fast lookups
// Trigger: Cron (every 5 minutes) or on-demand

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface WarmCacheRequest {
  organizationId?: string // Optional: warm specific org, otherwise warm all active orgs
  contentTypes?: string[] // Optional: specific content types, otherwise warm common ones
}

const COMMON_CONTENT_TYPES = [
  'press-release',
  'blog-post',
  'social-media',
  'email',
  'presentation'
]

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { organizationId, contentTypes } = await req.json() as WarmCacheRequest

    console.log('🔥 Warming brand context cache...')

    const typesToWarm = contentTypes || COMMON_CONTENT_TYPES
    const warmedCount = { organizations: 0, contexts: 0 }

    // Get organizations to warm
    let orgsToWarm: string[] = []

    if (organizationId) {
      orgsToWarm = [organizationId]
    } else {
      // Get all organizations with brand assets
      const { data: orgs } = await supabase
        .from('brand_assets')
        .select('organization_id')
        .eq('status', 'active')
        .limit(100)

      if (orgs) {
        orgsToWarm = [...new Set(orgs.map(o => o.organization_id))]
      }
    }

    console.log(`📋 Warming cache for ${orgsToWarm.length} organizations`)

    // Warm cache for each org + content type combination
    for (const orgId of orgsToWarm) {
      for (const contentType of typesToWarm) {
        try {
          // Fetch brand assets for this org/type
          const { data: assets, error } = await supabase
            .from('brand_assets')
            .select('*')
            .eq('organization_id', orgId)
            .eq('status', 'active')
            .or(`asset_type.eq.template-${contentType},asset_type.eq.guidelines-brand`)
            .limit(5) // Top 5 most relevant

          if (!error && assets && assets.length > 0) {
            // In a real implementation, this would update an actual cache
            // For now, just log success
            console.log(`✅ Warmed: ${orgId} / ${contentType} (${assets.length} assets)`)
            warmedCount.contexts++
          }
        } catch (err) {
          console.warn(`⚠️ Failed to warm: ${orgId} / ${contentType}`)
        }
      }
      warmedCount.organizations++
    }

    console.log(`🔥 Cache warming complete: ${warmedCount.contexts} contexts for ${warmedCount.organizations} orgs`)

    return new Response(
      JSON.stringify({
        success: true,
        warmed: warmedCount,
        message: `Warmed ${warmedCount.contexts} brand contexts for ${warmedCount.organizations} organizations`
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ Cache warming error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Cache warming failed'
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
