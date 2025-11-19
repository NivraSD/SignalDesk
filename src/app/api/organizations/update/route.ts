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

    // Update organization - store url, industry, size at top level for consistency
    const updateData = {
      name: name.trim(),
      url: domain.trim(),       // Top-level column
      industry: industry?.trim() || null,  // Top-level column
      size: size || null,        // Top-level column
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

    // Update content_library (MemoryVault) with org context so playbooks stay synced
    try {
      const orgContextContent = {
        organization_name: data.name,
        industry: data.industry,
        url: data.url,
        size: data.size,
        company_profile: data.company_profile,
        updated_at: new Date().toISOString()
      }

      // Save/update as special 'org-profile' type in content_library
      // This ensures playbooks have access to latest org context
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
            last_updated: new Date().toISOString()
          },
          folder: 'Organization',
          status: 'saved',
          salience_score: 1.0,
          last_accessed_at: new Date().toISOString()
        }, {
          onConflict: 'organization_id,content_type',
          // Use unique constraint on (organization_id, content_type) to ensure only one org-profile per org
        })

      console.log('✅ Updated org context in MemoryVault (content_library)')
    } catch (mvError: any) {
      console.error('⚠️ Failed to update MemoryVault org context (non-blocking):', mvError.message)
    }

    // Return with description from profile
    const flatOrg = {
      ...data,
      description: data.company_profile?.description
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
