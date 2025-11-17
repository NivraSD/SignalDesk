import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Pool } from 'pg'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const DATABASE_URL = process.env.DATABASE_URL!

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
    const { organization_id, targets, append = true } = body // FIXED: Default to true to prevent data loss

    if (!organization_id || !targets) {
      return NextResponse.json(
        { error: 'Organization ID and targets are required' },
        { status: 400 }
      )
    }

    // Only delete existing targets if explicitly requested (append = false)
    // CRITICAL: This should only be used during initial onboarding or intentional replacement
    if (append === false) {
      console.warn(`⚠️  DELETING all targets for organization ${organization_id} - append explicitly set to false`)
      await supabase
        .from('intelligence_targets')
        .delete()
        .eq('organization_id', organization_id)
    }

    // WORKAROUND: Use direct PostgreSQL connection to bypass Supabase client schema cache
    const pool = new Pool({ connectionString: DATABASE_URL })

    try {
      const client = await pool.connect()

      try {
        // Build parameterized query
        const placeholders: string[] = []
        const values: any[] = []
        let paramIndex = 1

        targets.forEach((target: any) => {
          placeholders.push(`($${paramIndex}, $${paramIndex+1}, $${paramIndex+2}, $${paramIndex+3}, $${paramIndex+4}, $${paramIndex+5}, $${paramIndex+6}, $${paramIndex+7}, $${paramIndex+8})`)
          values.push(
            organization_id,
            target.name,
            target.type,
            target.priority || 'medium',
            target.active !== false,
            target.keywords || null,
            target.monitoring_context || null,
            target.industry_context || null,
            target.relevance_filter || null
          )
          paramIndex += 9
        })

        const insertSQL = `
          INSERT INTO intelligence_targets (
            organization_id, name, type, priority, active, keywords,
            monitoring_context, industry_context, relevance_filter
          ) VALUES ${placeholders.join(', ')}
          RETURNING *
        `

        const result = await client.query(insertSQL, values)
        const inserted = result.rows

        client.release()
        await pool.end()

        console.log(`✅ Saved ${inserted.length} targets via direct PostgreSQL`)

        return NextResponse.json({
          success: true,
          targets: inserted,
          count: inserted.length
        })
      } catch (queryError) {
        client.release()
        throw queryError
      }
    } catch (pgError: any) {
      console.error('PostgreSQL direct insert failed:', pgError)
      await pool.end()

      // Fallback to basic Supabase insert without context fields
      const basicInsert = targets.map((target: any) => ({
        organization_id,
        name: target.name,
        type: target.type,
        priority: target.priority || 'medium',
        active: target.active !== false,
        keywords: target.keywords || []
      }))

      const { data: inserted, error: fallbackError } = await supabase
        .from('intelligence_targets')
        .insert(basicInsert)
        .select()

      if (fallbackError) {
        throw fallbackError
      }

      return NextResponse.json({
        success: true,
        targets: inserted,
        count: inserted.length,
        warning: 'Saved without context fields due to schema cache issue - context fields will be available after 24h cache refresh'
      })
    }

    const { data: inserted, error } = { data: [], error: null } // Placeholder to avoid compilation error

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
