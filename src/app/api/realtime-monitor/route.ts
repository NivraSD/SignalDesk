import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.json()
    const {
      organization_id,
      organization_name,
      time_window = '6hours',
      route_to_opportunities = false, // Default to false for real-time (faster)
      route_to_crisis = true,
      route_to_predictions = true,
      use_firecrawl_observer = false // Use firecrawl-observer if enabled
    } = body

    if (!organization_id && !organization_name) {
      return NextResponse.json({ success: false, error: 'Organization ID or name required' }, { status: 400 })
    }

    console.log('🚀 Real-Time Monitor Starting:', {
      organization: organization_name || organization_id,
      time_window: time_window,
      source: use_firecrawl_observer ? 'firecrawl-observer' : 'niv-fireplexity',
      timestamp: new Date().toISOString()
    })

    // Call the simplified real-time-alert-router
    // This routes search results directly to detectors in parallel
    const { data, error } = await supabase.functions.invoke('real-time-alert-router', {
      body: {
        organization_name: organization_name || organization_id,
        organization_id: organization_id, // Pass UUID for database operations
        time_window: time_window,
        route_to_opportunities: route_to_opportunities,
        route_to_crisis: route_to_crisis,
        route_to_predictions: route_to_predictions,
        use_firecrawl_observer: use_firecrawl_observer
      }
    })

    if (error) {
      console.error('Real-time intelligence orchestrator error:', error)
      return NextResponse.json({
        success: false,
        error: error.message || 'Real-time intelligence orchestrator failed',
        execution_time_ms: Date.now() - startTime
      }, { status: 500 })
    }

    const executionTime = Date.now() - startTime

    console.log('✅ Real-Time Monitor Complete:', {
      total_time: `${(executionTime / 1000).toFixed(1)}s`,
      articles: data.articles_analyzed || 0,
      detectors_running: data.detectors_running || 0,
      message: data.message || 'Processing in background'
    })

    // Return the data from the edge function
    // Detectors are running in background and saving to database
    return NextResponse.json({
      success: true,
      ...data,
      execution_time_ms: executionTime,
      // Set counts to 0 since detectors are running in background
      opportunities_count: 0,
      crises_count: 0,
      predictions_count: 0
    })

  } catch (error: any) {
    console.error('❌ Real-time monitor API error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      execution_time_ms: Date.now() - startTime
    }, { status: 500 })
  }
}
