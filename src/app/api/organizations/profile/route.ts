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

    // Use RPC to bypass any schema cache issues
    const { data, error } = await supabase.rpc('get_company_profile', {
      org_id: id
    })

    if (error) {
      console.error('Failed to get company profile via RPC:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // RPC returns array of rows
    const organization = data && data.length > 0 ? data[0] : null

    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      organization
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
    const { company_profile } = body

    if (!company_profile) {
      return NextResponse.json(
        { success: false, error: 'company_profile is required' },
        { status: 400 }
      )
    }

    console.log('Updating company profile for org:', id)

    // Update using service role key to bypass any schema cache issues
    const { data, error } = await supabase
      .from('organizations')
      .update({ company_profile })
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

    // CRITICAL: Sync org profile to MemoryVault (content_library)
    // This ensures NIV Content and playbooks always have latest company context
    try {
      const orgContextContent = {
        organization_name: data.name,
        industry: data.industry,
        url: data.url,
        size: data.size,
        company_profile: data.company_profile,
        updated_at: new Date().toISOString()
      }

      await supabase
        .from('content_library')
        .upsert({
          organization_id: id,
          content_type: 'org-profile',
          title: `${data.name} - Organization Profile`,
          content: JSON.stringify(orgContextContent),
          metadata: {
            industry: data.industry,
            url: data.url,
            size: data.size,
            company_profile: data.company_profile,
            last_updated: new Date().toISOString()
          },
          folder: 'Organization',
          status: 'saved',
          salience_score: 1.0,
          last_accessed_at: new Date().toISOString()
        }, {
          onConflict: 'organization_id,content_type'
        })

      console.log('✅ Synced company profile to MemoryVault')
    } catch (mvError: any) {
      console.error('⚠️ Failed to sync to MemoryVault (non-blocking):', mvError.message)
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
