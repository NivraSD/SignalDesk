import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * GET /api/organizations/geo-targets
 * Fetch GEO targets for an organization
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'organization_id required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('geo_targets')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('active', true)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching GEO targets:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      geo_targets: data || null
    })
  } catch (error: any) {
    console.error('GET /api/organizations/geo-targets error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/organizations/geo-targets
 * Create or update GEO targets for an organization
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      organization_id,
      service_lines = [],
      geographic_focus = [],
      industry_verticals = [],
      priority_queries = [],
      geo_competitors = [],
      query_types = ['comparison', 'competitive', 'transactional'],
      target_platforms = ['claude', 'gemini', 'chatgpt', 'perplexity'],
      positioning_goals = {},
      negative_keywords = [],
      active = true
    } = body

    if (!organization_id) {
      return NextResponse.json(
        { success: false, error: 'organization_id required' },
        { status: 400 }
      )
    }

    // Check if GEO targets already exist for this org
    const { data: existing } = await supabase
      .from('geo_targets')
      .select('id')
      .eq('organization_id', organization_id)
      .eq('active', true)
      .single()

    let result

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('geo_targets')
        .update({
          service_lines,
          geographic_focus,
          industry_verticals,
          priority_queries,
          geo_competitors,
          query_types,
          target_platforms,
          positioning_goals,
          negative_keywords,
          active,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating GEO targets:', error)
        return NextResponse.json(
          { success: false, error: error.message, details: error },
          { status: 500 }
        )
      }

      result = data
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('geo_targets')
        .insert({
          organization_id,
          service_lines,
          geographic_focus,
          industry_verticals,
          priority_queries,
          geo_competitors,
          query_types,
          target_platforms,
          positioning_goals,
          negative_keywords,
          active
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating GEO targets:', error)
        return NextResponse.json(
          { success: false, error: error.message, details: error },
          { status: 500 }
        )
      }

      result = data
    }

    return NextResponse.json({
      success: true,
      geo_targets: result
    })
  } catch (error: any) {
    console.error('POST /api/organizations/geo-targets error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/organizations/geo-targets
 * Update specific fields in GEO targets
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('geo_targets')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating GEO targets:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      geo_targets: data
    })
  } catch (error: any) {
    console.error('PUT /api/organizations/geo-targets error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/organizations/geo-targets
 * Soft delete (set active=false) GEO targets
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('geo_targets')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Error deleting GEO targets:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE /api/organizations/geo-targets error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
