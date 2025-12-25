import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

/**
 * GET /api/organizations/profile?id={uuid}
 * Get company profile for an organization
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const id = searchParams.get('id')

    console.log('📂 [GET] Loading company profile for org:', id)

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    // Fetch organization directly with service role key
    const { data: org, error } = await supabase
      .from('organizations')
      .select('id, name, company_profile')
      .eq('id', id)
      .single()

    if (error) {
      console.error('📂 [GET] Failed to get organization:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    if (!org) {
      console.log('📂 [GET] Organization not found:', id)
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      )
    }

    console.log('📂 [GET] Raw company_profile from DB:', {
      hasCompanyProfile: !!org.company_profile,
      keys: org.company_profile ? Object.keys(org.company_profile) : [],
      leadership: org.company_profile?.leadership?.length || 0,
      product_lines: org.company_profile?.product_lines?.length || 0,
      key_markets: org.company_profile?.key_markets?.length || 0,
      strategic_goals: org.company_profile?.strategic_goals?.length || 0,
      business_model: org.company_profile?.business_model || 'not set'
    })

    // Extract simple profile fields from company_profile
    // These are the fields the UI needs for the Company Profile tab
    const simpleProfile = {
      leadership: org.company_profile?.leadership || [],
      headquarters: org.company_profile?.headquarters || {},
      company_size: org.company_profile?.company_size || {},
      founded: org.company_profile?.founded || '',
      parent_company: org.company_profile?.parent_company || '',
      product_lines: org.company_profile?.product_lines || [],
      key_markets: org.company_profile?.key_markets || [],
      business_model: org.company_profile?.business_model || '',
      strategic_goals: org.company_profile?.strategic_goals || [],
      // Brand Voice settings
      brand_voice: org.company_profile?.brand_voice || null,
      // Company Context (for richer content generation)
      company_context: org.company_profile?.company_context || null
    }

    console.log('📂 [GET] Returning simpleProfile:', {
      leadership: simpleProfile.leadership.length,
      product_lines: simpleProfile.product_lines.length,
      key_markets: simpleProfile.key_markets.length,
      strategic_goals: simpleProfile.strategic_goals.length,
      business_model: simpleProfile.business_model || 'not set'
    })

    return NextResponse.json({
      success: true,
      organization: {
        id: org.id,
        name: org.name,
        company_profile: simpleProfile
      }
    })
  } catch (error: any) {
    console.error('Get company profile error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/organizations/profile?id={uuid}
 * Update company profile for an organization
 */
export async function PUT(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const id = searchParams.get('id')

    console.log('📂 [PUT] Saving company profile for org:', id)

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const { company_profile: newProfile } = body

    console.log('📂 [PUT] Incoming profile data:', {
      leadership: newProfile?.leadership?.length || 0,
      product_lines: newProfile?.product_lines?.length || 0,
      key_markets: newProfile?.key_markets?.length || 0,
      strategic_goals: newProfile?.strategic_goals?.length || 0,
      business_model: newProfile?.business_model || 'not set'
    })

    if (!newProfile) {
      console.error('📂 [PUT] No company_profile in request body')
      return NextResponse.json(
        { success: false, error: 'company_profile is required' },
        { status: 400 }
      )
    }

    // First fetch the current company_profile to preserve intelligence data
    const { data: currentOrg, error: fetchError } = await supabase
      .from('organizations')
      .select('company_profile')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('📂 [PUT] Failed to fetch current org:', fetchError)
    }

    console.log('📂 [PUT] Current company_profile keys:', currentOrg?.company_profile ? Object.keys(currentOrg.company_profile) : [])

    // Merge the new profile fields at the top level, preserving all other fields
    // This updates leadership, headquarters, etc. without touching intelligence_context, monitoring_config, etc.
    // IMPORTANT: Preserve existing data if new value is empty (defensive merge)
    const existing = currentOrg?.company_profile || {}

    const updatedCompanyProfile = {
      ...existing,
      // Flat UI fields for CompanyProfileTab - only update if new value has content
      leadership: newProfile.leadership?.length > 0 ? newProfile.leadership : existing.leadership || [],
      headquarters: Object.keys(newProfile.headquarters || {}).length > 0 ? newProfile.headquarters : existing.headquarters || {},
      company_size: Object.keys(newProfile.company_size || {}).length > 0 ? newProfile.company_size : existing.company_size || {},
      founded: newProfile.founded || existing.founded || '',
      parent_company: newProfile.parent_company || existing.parent_company || '',
      product_lines: newProfile.product_lines?.length > 0 ? newProfile.product_lines : existing.product_lines || [],
      key_markets: newProfile.key_markets?.length > 0 ? newProfile.key_markets : existing.key_markets || [],
      business_model: newProfile.business_model || existing.business_model || '',
      strategic_goals: newProfile.strategic_goals?.length > 0 ? newProfile.strategic_goals : existing.strategic_goals || [],
      // Brand Voice settings - update if provided
      brand_voice: newProfile.brand_voice || existing.brand_voice || null,
      // Company Context (founder story, topics to discuss, etc.) - update if provided
      company_context: newProfile.company_context || existing.company_context || null,
      // Also update nested intelligence fields if they exist (for backward compatibility)
      ...(existing.market && {
        market: {
          ...existing.market,
          key_markets: newProfile.key_markets?.length ? newProfile.key_markets : existing.market.key_markets
        }
      })
    }

    console.log('📂 [PUT] Merged profile to save:', {
      leadership: updatedCompanyProfile.leadership?.length || 0,
      product_lines: updatedCompanyProfile.product_lines?.length || 0,
      key_markets: updatedCompanyProfile.key_markets?.length || 0,
      strategic_goals: updatedCompanyProfile.strategic_goals?.length || 0,
      business_model: updatedCompanyProfile.business_model || 'not set'
    })

    // Update using service role key to bypass any schema cache issues
    const { data, error } = await supabase
      .from('organizations')
      .update({ company_profile: updatedCompanyProfile })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('📂 [PUT] Failed to update company profile:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    console.log('📂 [PUT] Successfully saved company profile. Returned data has company_profile:', !!data?.company_profile)

    return NextResponse.json({
      success: true,
      organization: data
    })
  } catch (error: any) {
    console.error('Update company profile error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
