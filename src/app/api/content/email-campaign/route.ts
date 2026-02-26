import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Call the mcp-content edge function with the correct tool format
    const response = await fetch(`${SUPABASE_URL}/functions/v1/mcp-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({
        tool: 'generate_email_campaign',
        arguments: {
          campaignType: body.campaignType || 'announcement',
          subject: body.subject || body.title || 'Email Campaign',
          preheader: body.preheader || '',
          mainMessage: body.mainMessage || body.prompt || body.message || 'Generate email content',
          audience: body.audience || 'Subscribers',
          personalization: body.personalization !== false,
          includeImages: body.includeImages !== false
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Edge function returned ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      content: data.htmlContent || data.content || data,
      metadata: {
        subject: data.subject,
        campaignType: data.campaignType,
        estimatedReadTime: data.estimatedReadTime
      }
    })

  } catch (error) {
    console.error('Email campaign generation error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate email campaign'
    }, { status: 500 })
  }
}