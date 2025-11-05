// API route to select content types for GEO-VECTOR campaigns
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { objective, industry, constraints, current_presence } = body

    console.log('🎯 GEO Content Selector API:', {
      objective,
      industry,
      time_available: constraints?.time_per_week
    })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase.functions.invoke('niv-geo-content-selector', {
      body: {
        objective,
        industry,
        constraints,
        current_presence
      }
    })

    if (error) {
      console.error('❌ Content selector error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to select content types' },
        { status: 500 }
      )
    }

    console.log('✅ Content types selected:', {
      automated: data.automated?.length,
      user_assisted: data.user_assisted?.length
    })

    return NextResponse.json(data)

  } catch (error: any) {
    console.error('❌ API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
