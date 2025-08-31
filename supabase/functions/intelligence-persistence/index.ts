// Intelligence Persistence Layer - Fixed version with proper data handling
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from "../_shared/cors.ts"

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Main handler
serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { action } = body
    
    console.log(`📊 Intelligence Persistence: ${action}`)
    
    switch (action) {
      case 'saveProfile':
        return await handleSaveProfile(body)
      case 'getProfile':
        return await handleGetProfile(body)
      case 'getLatestProfile':
        return await handleGetLatestProfile(body)
      case 'clearProfile':
        return await handleClearProfile()
      case 'saveStageData':
        return await handleSaveStageData(body)
      case 'getStageData':
        return await handleGetStageData(body)
      case 'saveTargets':
        return await handleSaveTargets(body)
      case 'getTargets':
        return await handleGetTargets(body)
      case 'retrieve':
        return await handleRetrieve(body)
      default:
        // Legacy support
        if (body.stage || body.data_type) {
          return await handleSaveStageData(body)
        }
        throw new Error(`Unknown action: ${action}`)
    }
  } catch (error) {
    console.error('❌ Persistence Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Save complete organization profile
async function handleSaveProfile(data: any) {
  const { organization_name } = data
  
  if (!organization_name) {
    throw new Error('Missing organization_name')
  }
  
  console.log(`💾 Saving profile for: ${organization_name}`)
  
  // Handle both formats: direct fields or nested profile object
  let profile = data.profile
  
  // If no profile object, construct it from direct fields
  if (!profile) {
    profile = {
      organization: {
        name: organization_name,
        industry: data.industry,
        description: data.metadata?.description,
        url: data.metadata?.url,
        business_model: data.metadata?.business_model,
        market_position: data.metadata?.market_position,
        headquarters: data.metadata?.headquarters,
        founded: data.metadata?.founded,
        employee_range: data.metadata?.employee_range,
        revenue_range: data.metadata?.revenue_range
      },
      competitors: data.competitors || [],
      stakeholders: {
        regulators: data.regulators || [],
        media: data.media || [],
        investors: data.investors || [],
        analysts: data.analysts || [],
        activists: data.activists || []
      },
      keywords: data.keywords || [],
      products: data.metadata?.products || [],
      executives: data.metadata?.executives || [],
      target_customers: data.metadata?.target_customers || [],
      recent_topics: data.metadata?.recent_topics || [],
      key_narratives: data.metadata?.key_narratives || [],
      vulnerabilities: data.metadata?.vulnerabilities || [],
      opportunities: data.metadata?.opportunities || []
    }
  }
  
  // Ensure profile has standard structure
  const standardProfile = {
    organization: profile.organization || {},
    competitors: profile.competitors || { direct: [], indirect: [], emerging: [] },
    stakeholders: profile.stakeholders || {},
    keywords: profile.keywords || [],
    products: profile.products || [],
    executives: profile.executives || [],
    metadata: {
      ...profile.metadata,
      ...data.metadata,
      savedAt: new Date().toISOString()
    }
  }
  
  // Save to organization_profiles table
  const { data: saved, error } = await supabase
    .from('organization_profiles')
    .upsert({
      organization_name,
      organization_id: standardProfile.organization.id || organization_name,
      profile_data: standardProfile,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'organization_name'
    })
    .select()
    .single()
  
  if (error) {
    console.error('Failed to save profile:', error)
    throw error
  }
  
  // Also save to intelligence_targets table
  try {
    const competitorsArray = Array.isArray(standardProfile.competitors) 
      ? standardProfile.competitors 
      : [
          ...(standardProfile.competitors.direct || []),
          ...(standardProfile.competitors.indirect || []),
          ...(standardProfile.competitors.emerging || [])
        ]
    
    const stakeholdersArray = [
      ...(standardProfile.stakeholders.regulators || []),
      ...(standardProfile.stakeholders.media || []),
      ...(standardProfile.stakeholders.investors || []),
      ...(standardProfile.stakeholders.analysts || []),
      ...(standardProfile.stakeholders.activists || [])
    ]
    
    await supabase
      .from('intelligence_targets')
      .upsert({
        organization_name,
        competitors: competitorsArray,
        stakeholders: stakeholdersArray,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'organization_name'
      })
    
    console.log('✅ Saved to intelligence_targets')
  } catch (targetsError) {
    console.error('Warning: Could not save to intelligence_targets:', targetsError)
    // Don't throw - this is a secondary operation
  }
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      profile: saved.profile_data,
      method: 'primary'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Get organization profile
async function handleGetProfile(data: any) {
  const { organization_name } = data
  
  if (!organization_name) {
    throw new Error('Missing organization_name')
  }
  
  console.log(`📖 Getting profile for: ${organization_name}`)
  
  const { data: profile, error } = await supabase
    .from('organization_profiles')
    .select('*')
    .eq('organization_name', organization_name)
    .single()
  
  if (error || !profile) {
    console.log('Profile not found in database')
    return new Response(
      JSON.stringify({ 
        success: false, 
        profile: null,
        message: 'Profile not found'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      profile: profile.profile_data
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Save stage-specific data
async function handleSaveStageData(data: any) {
  const { 
    organization_name,
    stage,
    stage_data,
    metadata
  } = data
  
  console.log(`💾 Saving stage data: ${stage} for ${organization_name}`)
  
  // Different TTL for different stages
  let ttlHours = 24 // Default 24 hours for intermediate stages
  
  // Synthesis gets longer retention for MemoryVault training
  if (stage === 'synthesis' || stage === 'final_synthesis') {
    ttlHours = 7 * 24 // 7 days for final synthesis
    console.log('📚 Synthesis stage - extending TTL to 7 days for MemoryVault')
  }
  
  // CLEANUP: Delete old stage data based on TTL
  const expirationTime = new Date(Date.now() - ttlHours * 60 * 60 * 1000).toISOString()
  
  const { error: deleteError } = await supabase
    .from('intelligence_stage_data')
    .delete()
    .eq('organization_name', organization_name)
    .eq('stage_name', stage)
    .lt('created_at', expirationTime)
  
  if (deleteError) {
    console.warn('Could not delete old stage data:', deleteError)
  } else {
    console.log(`🗑️ Cleaned up stage data older than ${ttlHours} hours`)
  }
  
  // Create stage data record with TTL metadata
  const stageRecord = {
    organization_name,
    stage_name: stage,
    stage_data: stage_data || data.content || data.data,
    metadata: {
      ...metadata,
      savedAt: new Date().toISOString(),
      ttlHours,
      expiresAt: new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString(),
      forMemoryVault: stage === 'synthesis' || stage === 'final_synthesis'
    },
    created_at: new Date().toISOString()
  }
  
  // Save to stage_data table
  const { data: saved, error } = await supabase
    .from('intelligence_stage_data')
    .insert(stageRecord)
    .select()
    .single()
  
  if (error) {
    console.error('Failed to save stage data:', error)
    throw error
  }
  
  return new Response(
    JSON.stringify({ 
      success: true,
      id: saved.id,
      method: 'primary'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Get stage-specific data
async function handleGetStageData(data: any) {
  const { 
    organization_name,
    stage,
    limit = 10
  } = data
  
  console.log(`📖 Getting stage data: ${stage} for ${organization_name}`)
  
  let query = supabase
    .from('intelligence_stage_data')
    .select('*')
  
  if (organization_name) {
    query = query.eq('organization_name', organization_name)
  }
  
  if (stage) {
    query = query.eq('stage_name', stage)
  }
  
  query = query
    .order('created_at', { ascending: false })
    .limit(limit)
  
  const { data: stageData, error } = await query
  
  if (error) {
    console.error('Failed to get stage data:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        data: [],
        error: error.message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  return new Response(
    JSON.stringify({ 
      success: true,
      data: stageData || [],
      count: stageData?.length || 0
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Save intelligence targets (competitors, stakeholders)
async function handleSaveTargets(data: any) {
  const { 
    organization_name,
    competitors,
    stakeholders
  } = data
  
  console.log(`💾 Saving targets for: ${organization_name}`)
  
  const targets = {
    organization_name,
    competitors: competitors || { direct: [], indirect: [], emerging: [] },
    stakeholders: stakeholders || {},
    updated_at: new Date().toISOString()
  }
  
  const { data: saved, error } = await supabase
    .from('intelligence_targets')
    .upsert(targets, {
      onConflict: 'organization_name'
    })
    .select()
    .single()
  
  if (error) {
    console.error('Failed to save targets:', error)
    throw error
  }
  
  return new Response(
    JSON.stringify({ 
      success: true,
      targets: saved,
      method: 'primary'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Get intelligence targets
async function handleGetTargets(data: any) {
  const { organization_name } = data
  
  console.log(`📖 Getting targets for: ${organization_name}`)
  
  const { data: targets, error } = await supabase
    .from('intelligence_targets')
    .select('*')
    .eq('organization_name', organization_name)
    .single()
  
  if (error || !targets) {
    return new Response(
      JSON.stringify({ 
        success: false,
        targets: null,
        message: 'Targets not found'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  return new Response(
    JSON.stringify({ 
      success: true,
      targets: {
        competitors: targets.competitors || { direct: [], indirect: [], emerging: [] },
        stakeholders: targets.stakeholders || {}
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Helper: Create tables if they don't exist
async function createProfileTableIfNeeded() {
  // Tables should be created via Supabase Dashboard SQL Editor
  // This function is kept for compatibility but doesn't create tables
  console.log('Note: Tables should be created via Supabase Dashboard if they do not exist')
}

async function createStageTableIfNeeded() {
  // Tables should be created via Supabase Dashboard SQL Editor
  // This function is kept for compatibility but doesn't create tables
  console.log('Note: Tables should be created via Supabase Dashboard if they do not exist')
}

async function createTargetsTableIfNeeded() {
  // Tables should be created via Supabase Dashboard SQL Editor
  // This function is kept for compatibility but doesn't create tables
  console.log('Note: Tables should be created via Supabase Dashboard if they do not exist')
}

// Handle retrieve action - get recent intelligence data
async function handleRetrieve(data: any) {
  const { 
    organization_name,
    limit = 100,
    since
  } = data
  
  console.log(`📖 Retrieving intelligence for: ${organization_name}`)
  
  // Retrieve from intelligence_findings table
  let query = supabase
    .from('intelligence_findings')
    .select('*')
    .eq('organization_name', organization_name)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (since) {
    query = query.gte('created_at', since)
  }
  
  const { data: findings, error: findingsError } = await query
  
  // Also get stage data
  let stageQuery = supabase
    .from('intelligence_stage_data')
    .select('*')
    .eq('organization_name', organization_name)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (since) {
    stageQuery = stageQuery.gte('created_at', since)
  }
  
  const { data: stageData, error: stageError } = await stageQuery
  
  // Combine results
  const allData = [
    ...(findings || []).map(f => ({ ...f, type: 'finding' })),
    ...(stageData || []).map(s => ({ ...s, type: 'stage_data' }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit)
  
  return new Response(
    JSON.stringify({ 
      success: true,
      data: allData,
      count: allData.length,
      has_findings: findings && findings.length > 0,
      has_stage_data: stageData && stageData.length > 0
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Get the latest organization profile (for RailwayV2)
async function handleGetLatestProfile(data: any) {
  console.log('📖 Getting latest organization profile')
  
  // If organization_name is provided, get that specific one
  if (data?.organization_name) {
    console.log(`📖 Looking for specific organization: ${data.organization_name}`)
    const { data: profile, error } = await supabase
      .from('organization_profiles')
      .select('*')
      .eq('organization_name', data.organization_name)
      .single()
    
    if (error || !profile) {
      console.log('Profile not found, returning null')
      return new Response(
        JSON.stringify({ 
          success: false,
          profile: null,
          organization_name: null,
          message: 'Profile not found'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    console.log('✅ Found specific profile:', profile.organization_name)
    return new Response(
      JSON.stringify({ 
        success: true,
        profile: profile.profile_data,
        organization_name: profile.organization_name
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
  
  // Otherwise get the most recent profile
  const { data: profiles, error } = await supabase
    .from('organization_profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
  
  if (error) {
    console.error('❌ Failed to get latest profile:', error)
    throw error
  }
  
  const profile = profiles?.[0]
  console.log('✅ Found latest profile:', profile ? profile.organization_name : 'none')
  
  return new Response(
    JSON.stringify({ 
      success: true,
      profile: profile?.profile_data || null,
      organization_name: profile?.organization_name || null
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Clear the current profile (for New Search)
async function handleClearProfile() {
  console.log('🗑️ Clearing current profile')
  
  // We don't actually delete, just return success
  // The new organization will overwrite when saved
  
  return new Response(
    JSON.stringify({ 
      success: true,
      message: 'Profile cleared - ready for new organization'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
