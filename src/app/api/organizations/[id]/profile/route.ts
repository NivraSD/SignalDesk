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
  { params }: { params: { id: string } }
) {
  try {
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
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await req.json()
    const { company_profile } = body

    if (!company_profile) {
      return NextResponse.json(
        { success: false, error: 'company_profile is required' },
        { status: 400 }
      )
    }

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
