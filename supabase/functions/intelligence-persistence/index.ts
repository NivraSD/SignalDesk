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
      case 'saveStageData':
        return await handleSaveStageData(body)
      case 'getStageData':
        return await handleGetStageData(body)
      case 'saveTargets':
        return await handleSaveTargets(body)
      case 'getTargets':
        return await handleGetTargets(body)
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
  const { organization_name, profile } = data
  
  if (!organization_name || !profile) {
    throw new Error('Missing organization_name or profile')
  }
  
  console.log(`💾 Saving profile for: ${organization_name}`)
  
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
  
  // Create stage data record
  const stageRecord = {
    organization_name,
    stage_name: stage,
    stage_data: stage_data || data.content || data.data,
    metadata: {
      ...metadata,
      savedAt: new Date().toISOString()
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