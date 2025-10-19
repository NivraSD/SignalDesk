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
        tool: 'generate_social_posts',
        arguments: {
          message: body.prompt || body.message || 'Generate social media content',
          platforms: body.platforms || ['twitter', 'linkedin'],
          variations: 1,
          includeHashtags: true,
          includeEmojis: false
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Edge function returned ${response.status}`)
    }

    const data = await response.json()

    // Extract the social posts from the response
    const posts = data.posts || {}

    // Get the first variation of each platform
    const versions = Object.entries(posts).map(([platform, variations]: [string, any]) => ({
      platform,
      content: Array.isArray(variations) ? variations[0] : variations
    }))

    // Return consistent format with versions array
    return NextResponse.json({
      success: true,
      content: versions.length === 1 ? versions[0].content : {
        type: 'multi-platform',
        versions: versions
      }
    })

  } catch (error) {
    console.error('Social post generation error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate social post'
    }, { status: 500 })
  }
}