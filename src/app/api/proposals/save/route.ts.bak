import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { nanoid } from 'nanoid'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const {
      organizationId,
      title,
      clientName,
      industry,
      sector,
      proposalType,
      servicesOffered,
      dealValueRange,
      keyDifferentiators,
      outcome,
      outcomeDate,
      outcomeNotes,
      competitiveLandscape,
      filePath,
      fileType,
      fileSizeBytes,
      proposalSections,
      teamMembers,
      content
    } = data

    if (!organizationId || !title || !industry || !proposalType || !servicesOffered) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Build proposal metadata
    const proposalMetadata = {
      clientName,
      industry,
      sector,
      proposalType,
      servicesOffered,
      dealValueRange,
      keyDifferentiators: keyDifferentiators || [],
      outcome: outcome || 'unknown',
      outcomeDate,
      outcomeNotes,
      competitiveLandscape: competitiveLandscape || {},
      proposalSections: proposalSections || {},
      teamMembers: teamMembers || [],
      fileType,
      fileSizeBytes
    }

    // Build tags for easy filtering
    const tags = [
      industry,
      proposalType,
      outcome || 'unknown',
      ...(keyDifferentiators || [])
    ].filter(Boolean)

    // Insert into content_library (Memory Vault)
    const { data: proposal, error: insertError } = await supabase
      .from('content_library')
      .insert({
        id: nanoid(),
        organization_id: organizationId,
        title,
        content_type: 'proposal',
        content: content || outcomeNotes || `Proposal for ${clientName}`,
        folder: 'proposals',
        file_url: filePath,
        metadata: { proposalMetadata },
        tags,
        status: 'completed'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to save proposal' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      proposal
    })

  } catch (error) {
    console.error('Error saving proposal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch proposals
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch from content_library where folder='proposals'
    const { data: proposals, error } = await supabase
      .from('content_library')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('folder', 'proposals')
      .eq('content_type', 'proposal')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch proposals' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      proposals
    })

  } catch (error) {
    console.error('Error fetching proposals:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
