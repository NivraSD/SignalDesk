import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Shared handler for both PUT and POST
async function handleUpdate(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({
        success: false,
        error: 'Content ID is required'
      }, { status: 400 })
    }

    console.log('📝 Updating content in Memory Vault:', body.id)

    // Update directly in content_library table
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    }

    if (body.content !== undefined) {
      updateData.content = body.content
    }

    if (body.title !== undefined) {
      updateData.title = body.title
    }

    if (body.folder !== undefined) {
      updateData.folder = body.folder
    }

    const { data, error } = await supabase
      .from('content_library')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single()

    if (error) {
      console.error('Supabase update error:', error)
      throw new Error(`Failed to update: ${error.message}`)
    }

    console.log('✅ Content updated successfully:', data.id)

    return NextResponse.json({
      success: true,
      message: 'Content updated in Memory Vault',
      data: data
    })

  } catch (error) {
    console.error('Memory vault update error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update Memory Vault'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  return handleUpdate(request)
}

export async function POST(request: NextRequest) {
  return handleUpdate(request)
}