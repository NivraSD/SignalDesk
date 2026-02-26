import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * GET /api/organizations
 * List all organizations or get a single organization by ID
 * FILTERED BY USER - only returns orgs the authenticated user belongs to
 */
export async function GET(req: NextRequest) {
  try {
    let supabase
    try {
      supabase = await createClient()
    } catch (clientError: any) {
      console.error('Failed to create Supabase client:', clientError)
      return NextResponse.json(
        { error: 'Failed to initialize database connection', details: clientError.message },
        { status: 500 }
      )
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = req.nextUrl.searchParams
    const id = searchParams.get('id')

    // Use service client for queries (still need it for some operations)
    let serviceClient
    try {
      serviceClient = createServiceClient()
    } catch (serviceError: any) {
      console.error('Failed to create service client:', serviceError)
      return NextResponse.json(
        { error: 'Failed to initialize service connection', details: serviceError.message },
        { status: 500 }
      )
    }

    // If ID provided, get single organization (check user has access)
    if (id) {
      // Check if user belongs to this org
      const { data: orgUser } = await serviceClient
        .from('org_users')
        .select('*')
        .eq('organization_id', id)
        .eq('user_id', user.id)
        .single()

      if (!orgUser) {
        return NextResponse.json(
          { error: 'Organization not found or access denied' },
          { status: 403 }
        )
      }

      const { data: org, error } = await serviceClient
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Failed to fetch organization:', error)
        return NextResponse.json(
          { error: 'Failed to fetch organization' },
          { status: 500 }
        )
      }

      // Return org with description from profile
      const flatOrg = {
        ...org,
        description: org.company_profile?.description
      }

      return NextResponse.json({
        success: true,
        organization: flatOrg
      })
    }

    // Otherwise, list organizations the user has access to
    const { data: userOrgs, error: userOrgsError } = await serviceClient
      .from('org_users')
      .select('organization_id')
      .eq('user_id', user.id)

    if (userOrgsError) {
      console.error('Failed to fetch user organizations:', userOrgsError)
      return NextResponse.json(
        { error: 'Failed to fetch organizations' },
        { status: 500 }
      )
    }

    const orgIds = userOrgs?.map(uo => uo.organization_id) || []

    if (orgIds.length === 0) {
      // User has no organizations yet
      return NextResponse.json({
        success: true,
        organizations: []
      })
    }

    const { data: organizations, error } = await serviceClient
      .from('organizations')
      .select('*')
      .in('id', orgIds)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch organizations:', error)
      return NextResponse.json(
        { error: 'Failed to fetch organizations' },
        { status: 500 }
      )
    }

    // Return orgs with description from profile
    const flatOrgs = organizations?.map(org => ({
      ...org,
      description: org.company_profile?.description
    })) || []

    return NextResponse.json({
      success: true,
      organizations: flatOrgs
    })
  } catch (error: any) {
    console.error('Organizations API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/organizations
 * Create a new organization and auto-assign creator as owner
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { name, url, industry, description } = body

    if (!name || !url) {
      return NextResponse.json(
        { error: 'Name and URL are required' },
        { status: 400 }
      )
    }

    const serviceClient = createServiceClient()

    // CRITICAL FIX: Generate UUID for id field (table has no default)
    const orgId = crypto.randomUUID()

    // Create organization - store basic fields at top level, detailed profile in JSONB
    const { data: org, error: orgError } = await serviceClient
      .from('organizations')
      .insert({
        id: orgId,
        name,
        url,           // Top-level for easy querying
        industry,      // Top-level for easy querying
        size: body.size, // Top-level for easy querying
        company_profile: {
          description,
          created_by: user.id,
          created_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (orgError) {
      console.error('Failed to create organization:', orgError)
      return NextResponse.json(
        {
          success: false,
          error: orgError.message || 'Failed to create organization',
          details: orgError
        },
        { status: 500 }
      )
    }

    if (!org) {
      console.error('No organization returned from insert')
      return NextResponse.json(
        {
          success: false,
          error: 'No organization data returned'
        },
        { status: 500 }
      )
    }

    // Auto-assign creator as owner
    const { error: orgUserError } = await serviceClient
      .from('org_users')
      .insert({
        organization_id: org.id,
        user_id: user.id,
        role: 'owner'
      })

    if (orgUserError) {
      console.error('CRITICAL: Failed to assign user to organization:', orgUserError)
      // This is CRITICAL - without this, user can't access the org
      // Delete the org we just created and fail the request
      await serviceClient
        .from('organizations')
        .delete()
        .eq('id', org.id)

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to assign user permissions to organization',
          details: orgUserError
        },
        { status: 500 }
      )
    }

    console.log(`✅ Created organization: ${org.name} (${org.id}) for user ${user.email}`)

    // Trigger self-target creation for org story aggregation (non-blocking)
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (supabaseUrl && supabaseServiceKey) {
        // Fire-and-forget: don't await, let it run in background
        fetch(`${supabaseUrl}/functions/v1/create-org-self-target`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({
            organization_id: org.id,
            run_initial_search: true
          })
        }).then(res => {
          console.log(`   Self-target creation triggered: ${res.status}`)
        }).catch(err => {
          console.warn(`   Self-target creation failed (non-critical): ${err.message}`)
        })
      }
    } catch (selfTargetError: any) {
      // Non-critical: log but don't fail the org creation
      console.warn(`   Self-target creation skipped: ${selfTargetError.message}`)
    }

    // Return org with description from profile
    const flatOrg = {
      ...org,
      description: org.company_profile?.description
    }

    return NextResponse.json({
      success: true,
      organization: flatOrg
    })
  } catch (error: any) {
    console.error('Create organization error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
        details: error.toString()
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/organizations?id={uuid}
 * Delete an organization (only owners can delete)
 */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = req.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const serviceClient = createServiceClient()

    // Check if user is owner of this org
    const { data: orgUser } = await serviceClient
      .from('org_users')
      .select('role')
      .eq('organization_id', id)
      .eq('user_id', user.id)
      .single()

    if (!orgUser || orgUser.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only organization owners can delete organizations' },
        { status: 403 }
      )
    }

    // Get org name for logging
    const { data: org } = await serviceClient
      .from('organizations')
      .select('name')
      .eq('id', id)
      .single()

    // Delete organization (cascade will handle related data)
    const { error } = await serviceClient
      .from('organizations')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Failed to delete organization:', error)
      return NextResponse.json(
        { error: 'Failed to delete organization' },
        { status: 500 }
      )
    }

    console.log(`🗑️ Deleted organization: ${org?.name} (${id}) by user ${user.email}`)

    return NextResponse.json({
      success: true,
      message: 'Organization deleted successfully'
    })
  } catch (error: any) {
    console.error('Delete organization error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
