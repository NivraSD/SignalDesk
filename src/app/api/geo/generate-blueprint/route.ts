// API route to generate GEO-VECTOR blueprint
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      campaignGoal,
      objective,
      selectedContentTypes,
      constraints,
      organizationName,
      industry,
      session_id,
      organization_id
    } = body

    console.log('📋 GEO Blueprint Generator API:', {
      objective,
      organization: organizationName,
      automated_count: selectedContentTypes.automated?.length,
      user_assisted_count: selectedContentTypes.user_assisted?.length
    })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase.functions.invoke('niv-geo-vector-orchestrator', {
      body: {
        campaignGoal,
        objective,
        selectedContentTypes,
        constraints,
        organizationName,
        industry,
        session_id,
        organization_id
      }
    })

    if (error) {
      console.error('❌ Blueprint generator error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to generate blueprint' },
        { status: 500 }
      )
    }

    console.log('✅ GEO-VECTOR blueprint generated:', {
      success: data.success,
      automated_actions: data.blueprint?.threeTierTacticalPlan?.automated?.length,
      user_assisted_actions: data.blueprint?.threeTierTacticalPlan?.userAssisted?.length
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
