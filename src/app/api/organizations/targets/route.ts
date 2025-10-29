import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Debug: Check if service key is loaded
if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set!')
} else {
  console.log('✅ Service key loaded:', SUPABASE_SERVICE_KEY.substring(0, 20) + '...')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

/**
 * GET /api/organizations/targets?organization_id={uuid}
 * Get all targets for an organization
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const organization_id = searchParams.get('organization_id')

    if (!organization_id) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    console.log(`📥 Fetching targets for organization: ${organization_id}`)

    const { data: targets, error } = await supabase
      .from('intelligence_targets')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch targets:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      return NextResponse.json(
        { error: `Failed to fetch targets: ${error.message}`, details: error },
        { status: 500 }
      )
    }

    console.log(`✅ Found ${targets?.length || 0} targets`)

    return NextResponse.json({
      success: true,
      targets: targets || [],
      total: (targets || []).length
    })
  } catch (error: any) {
    console.error('Get targets error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/organizations/targets
 * Save targets for an organization (batch create/update)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { organization_id, targets, append = false } = body

    if (!organization_id || !targets) {
      return NextResponse.json(
        { error: 'Organization ID and targets are required' },
        { status: 400 }
      )
    }

    // Only delete existing targets if not in append mode (for onboarding)
    if (!append) {
      await supabase
        .from('intelligence_targets')
        .delete()
        .eq('organization_id', organization_id)
    }

    // Prepare targets for insertion
    const targetsToInsert = targets.map((target: any) => ({
      organization_id,
      name: target.name,
      type: target.type,
      category: target.category || (target.type === 'stakeholder' ? target.stakeholderType : undefined),
      priority: target.priority || 'medium',
      active: target.active !== false,
      keywords: target.keywords || [],
      metadata: target.metadata || {}
    }))

    const { data: inserted, error } = await supabase
      .from('intelligence_targets')
      .insert(targetsToInsert)
      .select()

    if (error) {
      console.error('Failed to save targets:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      return NextResponse.json(
        {
          error: `Failed to save targets: ${error.message}`,
          details: error,
          hint: error.hint,
          code: error.code
        },
        { status: 500 }
      )
    }

    console.log(`✅ Saved ${inserted.length} targets for organization ${organization_id}`)

    return NextResponse.json({
      success: true,
      targets: inserted,
      count: inserted.length
    })
  } catch (error: any) {
    console.error('Save targets error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/organizations/targets
 * Update a single target
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Target ID is required' },
        { status: 400 }
      )
    }

    const { data: updated, error } = await supabase
      .from('intelligence_targets')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Failed to update target:', error)
      return NextResponse.json(
        { error: 'Failed to update target' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      target: updated
    })
  } catch (error: any) {
    console.error('Update target error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/organizations/targets?id={uuid}
 * Delete (deactivate) a target
 */
export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Target ID is required' },
        { status: 400 }
      )
    }

    // Soft delete - set active = false
    const { error } = await supabase
      .from('intelligence_targets')
      .update({ active: false })
      .eq('id', id)

    if (error) {
      console.error('Failed to delete target:', error)
      return NextResponse.json(
        { error: 'Failed to delete target' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Target deleted successfully'
    })
  } catch (error: any) {
    console.error('Delete target error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
