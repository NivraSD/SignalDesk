import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, name, domain, industry, size } = body

    console.log('📝 Update request:', { id, name, domain, industry, size })

    if (!id) {
      return NextResponse.json(
        { error: 'Organization ID required' },
        { status: 400 }
      )
    }

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Organization name is required' },
        { status: 400 }
      )
    }

    if (!domain || !domain.trim()) {
      return NextResponse.json(
        { error: 'Domain/website URL is required' },
        { status: 400 }
      )
    }

    console.log('🔑 Creating Supabase client...')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // First, get current organization to preserve existing settings
    console.log('📖 Fetching current organization...')
    const { data: currentOrg, error: fetchError } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('❌ Error fetching current organization:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch organization', details: fetchError.message },
        { status: 500 }
      )
    }

    console.log('✅ Current org settings:', currentOrg?.settings)

    // Update organization with URL in settings JSONB field
    const updateData = {
      name: name.trim(),
      industry: industry?.trim() || null,
      size: size || null,
      settings: {
        ...(currentOrg?.settings || {}),
        url: domain.trim()
      },
      updated_at: new Date().toISOString()
    }

    console.log('💾 Updating with data:', updateData)

    const { data, error } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ Database error updating organization:', error)
      return NextResponse.json(
        { error: 'Failed to update organization', details: error.message, code: error.code },
        { status: 500 }
      )
    }

    console.log('✅ Organization updated successfully')

    // Flatten settings for easier access
    const flatOrg = {
      ...data,
      url: data.settings?.url,
      description: data.settings?.description
    }

    return NextResponse.json({
      success: true,
      organization: flatOrg
    })
  } catch (error: any) {
    console.error('Error in update organization API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
