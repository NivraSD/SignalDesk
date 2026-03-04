import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Content ID is required'
      }, { status: 400 })
    }

    console.log('Deleting content:', id)

    const { error: deleteError } = await supabase
      .from('content_library')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Content delete error:', deleteError)
      return NextResponse.json({
        success: false,
        error: deleteError.message || 'Failed to delete content'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Content deleted successfully'
    })

  } catch (error) {
    console.error('Content delete error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete content'
    }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, folder } = body

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Content ID is required'
      }, { status: 400 })
    }

    console.log('Updating content folder:', id, folder)

    const { error: updateError } = await supabase
      .from('content_library')
      .update({ folder })
      .eq('id', id)

    if (updateError) {
      console.error('Content update error:', updateError)
      return NextResponse.json({
        success: false,
        error: updateError.message || 'Failed to update content'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Content updated successfully'
    })

  } catch (error) {
    console.error('Content update error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update content'
    }, { status: 500 })
  }
}
