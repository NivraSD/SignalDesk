// Memory Vault V2: Salience Decay Application
// Purpose: Apply time-based decay to content salience scores to prevent stale content from dominating retrieval
// Trigger: Cron (daily at 2 AM UTC) or on-demand
// Based on OpenMemory's memory decay concept

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface DecayRequest {
  dryRun?: boolean // If true, calculate but don't apply decay
  organizationId?: string // Optional: apply to specific org only
  contentType?: string // Optional: apply to specific content type
}

interface DecayResult {
  updated_count: number
  avg_decay: number
  min_salience: number
  max_salience: number
}

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { dryRun = false, organizationId, contentType } = await req.json() as DecayRequest

    console.log('⏰ Applying salience decay...')
    console.log(`   Mode: ${dryRun ? 'DRY RUN (preview only)' : 'LIVE'}`)
    if (organizationId) console.log(`   Org: ${organizationId}`)
    if (contentType) console.log(`   Type: ${contentType}`)

    // Apply decay to content_library
    const contentDecayResult = await applyContentLibraryDecay(
      supabase,
      dryRun,
      organizationId,
      contentType
    )

    // Apply decay to brand_assets
    const brandDecayResult = await applyBrandAssetsDecay(
      supabase,
      dryRun,
      organizationId
    )

    console.log('✅ Salience decay application complete')
    console.log(`   Content Library: ${contentDecayResult.updated_count} items updated`)
    console.log(`   Brand Assets: ${brandDecayResult.updated_count} items updated`)

    return new Response(
      JSON.stringify({
        success: true,
        dry_run: dryRun,
        content_library: contentDecayResult,
        brand_assets: brandDecayResult,
        total_updated: contentDecayResult.updated_count + brandDecayResult.updated_count,
        message: dryRun
          ? 'Dry run complete - no changes applied'
          : 'Salience decay applied successfully'
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ Salience decay error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Salience decay failed'
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

async function applyContentLibraryDecay(
  supabase: any,
  dryRun: boolean,
  organizationId?: string,
  contentType?: string
): Promise<DecayResult> {
  console.log('📚 Processing content_library decay...')

  if (dryRun) {
    // Preview: Calculate what decay would be applied
    let query = supabase
      .from('content_library')
      .select('id, salience_score, last_accessed_at, decay_rate, content_type')
      .eq('intelligence_status', 'complete')
      .gt('salience_score', 0.1)

    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }
    if (contentType) {
      query = query.eq('content_type', contentType)
    }

    const { data: items } = await query

    if (!items || items.length === 0) {
      return { updated_count: 0, avg_decay: 0, min_salience: 0, max_salience: 0 }
    }

    // Calculate preview decay
    const decayed = items.map(item => {
      const daysElapsed = (Date.now() - new Date(item.last_accessed_at).getTime()) / (86400 * 1000)
      const decayMultiplier = Math.pow(1 - item.decay_rate, daysElapsed)
      return Math.max(0.1, item.salience_score * decayMultiplier)
    })

    return {
      updated_count: items.length,
      avg_decay: decayed.reduce((sum, val) => sum + val, 0) / decayed.length,
      min_salience: Math.min(...decayed),
      max_salience: Math.max(...decayed)
    }
  }

  // Live: Apply decay using database function
  const { data, error } = await supabase.rpc('apply_salience_decay')

  if (error) {
    console.error('Error applying content decay:', error)
    throw error
  }

  // The function returns a single row with stats
  const result = data && data.length > 0 ? data[0] : {
    updated_count: 0,
    avg_decay: 0,
    min_salience: 0,
    max_salience: 0
  }

  return result
}

async function applyBrandAssetsDecay(
  supabase: any,
  dryRun: boolean,
  organizationId?: string
): Promise<DecayResult> {
  console.log('🎨 Processing brand_assets decay...')

  // Brand assets use a slower decay rate (0.002 = 0.2% daily)
  const BRAND_ASSET_DECAY_RATE = 0.002

  if (dryRun) {
    // Preview: Calculate what decay would be applied
    let query = supabase
      .from('brand_assets')
      .select('id, salience_score, last_accessed_at')
      .eq('status', 'active')
      .gt('salience_score', 0.1)

    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }

    const { data: items } = await query

    if (!items || items.length === 0) {
      return { updated_count: 0, avg_decay: 0, min_salience: 0, max_salience: 0 }
    }

    // Calculate preview decay
    const decayed = items.map(item => {
      const daysElapsed = (Date.now() - new Date(item.last_accessed_at).getTime()) / (86400 * 1000)
      const decayMultiplier = Math.pow(1 - BRAND_ASSET_DECAY_RATE, daysElapsed)
      return Math.max(0.1, item.salience_score * decayMultiplier)
    })

    return {
      updated_count: items.length,
      avg_decay: decayed.reduce((sum, val) => sum + val, 0) / decayed.length,
      min_salience: Math.min(...decayed),
      max_salience: Math.max(...decayed)
    }
  }

  // Live: Apply decay to brand assets
  let updateQuery = `
    UPDATE brand_assets
    SET salience_score = GREATEST(
      0.1,
      salience_score * POWER(
        1 - ${BRAND_ASSET_DECAY_RATE},
        EXTRACT(EPOCH FROM (NOW() - last_accessed_at)) / 86400.0
      )
    )
    WHERE status = 'active'
      AND salience_score > 0.1
  `

  if (organizationId) {
    updateQuery += ` AND organization_id = '${organizationId}'`
  }

  updateQuery += ' RETURNING salience_score'

  const { data, error } = await supabase.rpc('execute_sql', { sql: updateQuery })

  if (error) {
    // Fallback: Use individual updates if RPC not available
    let query = supabase
      .from('brand_assets')
      .select('id, salience_score, last_accessed_at')
      .eq('status', 'active')
      .gt('salience_score', 0.1)

    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }

    const { data: items } = await query

    if (!items || items.length === 0) {
      return { updated_count: 0, avg_decay: 0, min_salience: 0, max_salience: 0 }
    }

    // Update each item individually
    const updates = items.map(async (item) => {
      const daysElapsed = (Date.now() - new Date(item.last_accessed_at).getTime()) / (86400 * 1000)
      const decayMultiplier = Math.pow(1 - BRAND_ASSET_DECAY_RATE, daysElapsed)
      const newSalience = Math.max(0.1, item.salience_score * decayMultiplier)

      await supabase
        .from('brand_assets')
        .update({ salience_score: newSalience })
        .eq('id', item.id)

      return newSalience
    })

    const results = await Promise.all(updates)

    return {
      updated_count: results.length,
      avg_decay: results.reduce((sum, val) => sum + val, 0) / results.length,
      min_salience: Math.min(...results),
      max_salience: Math.max(...results)
    }
  }

  // Parse RPC result
  const saliences = data || []
  return {
    updated_count: saliences.length,
    avg_decay: saliences.length > 0
      ? saliences.reduce((sum: number, val: any) => sum + val.salience_score, 0) / saliences.length
      : 0,
    min_salience: saliences.length > 0
      ? Math.min(...saliences.map((s: any) => s.salience_score))
      : 0,
    max_salience: saliences.length > 0
      ? Math.max(...saliences.map((s: any) => s.salience_score))
      : 0
  }
}
