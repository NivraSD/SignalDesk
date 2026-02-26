import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, metadata } = body

    // Save to niv_strategies table via memory vault
    const strategyData = {
      organization_id: content.organization_id || '00000000-0000-0000-0000-000000000000',
      title: content.title || `${content.type} - ${new Date().toLocaleDateString()}`,
      strategy_objective: content.type,
      strategy_approach: JSON.stringify(content.content),
      framework_data: content.framework_data,
      workflow_content_generation: content.workflow_content_generation,
      status: 'draft',
      tags: [content.type],
      created_by: 'niv'
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-memory-vault`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({
        action: 'save',
        strategy: strategyData
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Memory vault error:', errorText)
      throw new Error(`Edge function returned ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json({
      success: true,
      id: data.data?.id || data.id,
      message: 'Content saved to Memory Vault'
    })

  } catch (error) {
    console.error('Memory vault save error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save to Memory Vault'
    }, { status: 500 })
  }
}