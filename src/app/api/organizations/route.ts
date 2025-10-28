import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

/**
 * GET /api/organizations
 * List all organizations or get a single organization by ID
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const id = searchParams.get('id')

    // If ID provided, get single organization
    if (id) {
      const { data: org, error } = await supabase
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

      // Flatten settings for easier access
      const flatOrg = {
        ...org,
        url: org.settings?.url,
        description: org.settings?.description
      }

      return NextResponse.json({
        success: true,
        organization: flatOrg
      })
    }

    // Otherwise, list all organizations
    const { data: organizations, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch organizations:', error)
      return NextResponse.json(
        { error: 'Failed to fetch organizations' },
        { status: 500 }
      )
    }

    // Flatten settings for easier access
    const flatOrgs = organizations?.map(org => ({
      ...org,
      url: org.settings?.url,
      description: org.settings?.description
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
 * Create a new organization
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, url, industry, description } = body

    if (!name || !url) {
      return NextResponse.json(
        { error: 'Name and URL are required' },
        { status: 400 }
      )
    }

    // Create organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name,
        industry,
        settings: {
          url,
          description,
          ...body
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

    console.log(`✅ Created organization: ${org.name} (${org.id})`)

    // Flatten settings for easier access
    const flatOrg = {
      ...org,
      url: org.settings?.url,
      description: org.settings?.description
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
 * Delete an organization
 */
export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    // Get org name for logging
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', id)
      .single()

    // Delete organization (cascade will handle related data)
    const { error } = await supabase
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

    console.log(`🗑️ Deleted organization: ${org?.name} (${id})`)

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
