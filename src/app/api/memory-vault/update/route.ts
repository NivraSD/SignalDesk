import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-memory-vault`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({
        action: 'update',
        id: body.id,
        content: body.content,
        metadata: {
          ...body.metadata,
          updatedAt: new Date().toISOString()
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Edge function returned ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json({
      success: true,
      message: 'Content updated in Memory Vault'
    })

  } catch (error) {
    console.error('Memory vault update error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update Memory Vault'
    }, { status: 500 })
  }
}