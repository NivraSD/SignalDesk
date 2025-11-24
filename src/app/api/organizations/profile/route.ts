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
      console.error('Failed to get organization:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    if (!org) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      )
    }

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
      strategic_goals: org.company_profile?.strategic_goals || []
    }

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

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const { company_profile: newProfile } = body

    if (!newProfile) {
      return NextResponse.json(
        { success: false, error: 'company_profile is required' },
        { status: 400 }
      )
    }

    console.log('Updating company profile for org:', id)

    // First fetch the current company_profile to preserve intelligence data
    const { data: currentOrg } = await supabase
      .from('organizations')
      .select('company_profile')
      .eq('id', id)
      .single()

    // Merge the new profile fields at the top level, preserving all other fields
    // This updates leadership, headquarters, etc. without touching intelligence_context, monitoring_config, etc.
    const updatedCompanyProfile = {
      ...(currentOrg?.company_profile || {}),
      leadership: newProfile.leadership,
      headquarters: newProfile.headquarters,
      company_size: newProfile.company_size,
      founded: newProfile.founded,
      parent_company: newProfile.parent_company,
      product_lines: newProfile.product_lines,
      key_markets: newProfile.key_markets,
      business_model: newProfile.business_model,
      strategic_goals: newProfile.strategic_goals
    }

    // Update using service role key to bypass any schema cache issues
    const { data, error } = await supabase
      .from('organizations')
      .update({ company_profile: updatedCompanyProfile })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Failed to update company profile:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    console.log('Successfully updated company profile')

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
