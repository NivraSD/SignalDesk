import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

/**
 * GET /api/organizations/[id]/profile
 * Get company profile for an organization
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const { id } = params

    const { data, error } = await supabase
      .from('organizations')
      .select('id, name, company_profile')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Failed to get company profile:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      organization: data
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
 * PUT /api/organizations/[id]/profile
 * Update company profile for an organization
 */
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const { id } = params
    const body = await req.json()
    const { company_profile: newProfile } = body

    if (!newProfile) {
      return NextResponse.json(
        { success: false, error: 'company_profile is required' },
        { status: 400 }
      )
    }

    // First fetch existing profile to preserve data
    const { data: currentOrg } = await supabase
      .from('organizations')
      .select('company_profile')
      .eq('id', id)
      .single()

    const existing = currentOrg?.company_profile || {}

    // Defensive merge - preserve existing data if new value is empty
    const updatedCompanyProfile = {
      ...existing,
      leadership: newProfile.leadership?.length > 0 ? newProfile.leadership : existing.leadership || [],
      headquarters: Object.keys(newProfile.headquarters || {}).length > 0 ? newProfile.headquarters : existing.headquarters || {},
      company_size: Object.keys(newProfile.company_size || {}).length > 0 ? newProfile.company_size : existing.company_size || {},
      founded: newProfile.founded || existing.founded || '',
      parent_company: newProfile.parent_company || existing.parent_company || '',
      product_lines: newProfile.product_lines?.length > 0 ? newProfile.product_lines : existing.product_lines || [],
      key_markets: newProfile.key_markets?.length > 0 ? newProfile.key_markets : existing.key_markets || [],
      business_model: newProfile.business_model || existing.business_model || '',
      strategic_goals: newProfile.strategic_goals?.length > 0 ? newProfile.strategic_goals : existing.strategic_goals || []
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
