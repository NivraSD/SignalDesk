import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.json()
    const { content, metadata, folder } = body

    console.log('💾 Saving content:', { type: content.type, hasContent: !!content.content, folder })

    // CRITICAL: Save immediately (target < 100ms)
    const { data: savedContent, error: saveError } = await supabase
      .from('content_library')
      .insert({
        organization_id: content.organization_id || metadata?.organizationId || null,
        content_type: content.type || 'general',
        title: content.title || metadata?.title || `Content - ${new Date().toLocaleDateString()}`,
        content: typeof content.content === 'string' ? content.content : JSON.stringify(content.content),
        metadata: {
          ...metadata,
          ...content.metadata,
          framework_data: content.framework_data,
          opportunity_data: content.opportunity_data,
          generatedAt: content.timestamp || new Date().toISOString()
        },
        tags: [content.type].filter(Boolean),
        status: 'saved',
        intelligence_status: 'pending', // NEW: Will be processed async
        created_by: 'niv',
        folder: folder || 'Unsorted' // Default to Unsorted until intelligence assigns better folder
      })
      .select()
      .single()

    if (saveError) {
      console.error('❌ Content library save error:', saveError)

      // If table doesn't exist, return helpful error with SQL to create it
      if (saveError.message?.includes('relation') || saveError.message?.includes('does not exist')) {
        return NextResponse.json({
          success: false,
          error: 'Content library table does not exist. Please create it in Supabase SQL editor.',
          createTableSQL: `
            CREATE TABLE IF NOT EXISTS content_library (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              organization_id UUID,
              content_type VARCHAR(100),
              title VARCHAR(500),
              content TEXT,
              metadata JSONB,
              tags TEXT[],
              status VARCHAR(50) DEFAULT 'draft',
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              created_by VARCHAR(100) DEFAULT 'niv'
            );

            ALTER TABLE content_library ENABLE ROW LEVEL SECURITY;

            CREATE POLICY "Enable all operations" ON content_library
              FOR ALL USING (true);

            GRANT ALL ON content_library TO anon, authenticated, service_role;
          `
        }, { status: 400 })
      }

      // For other errors, just return the error
      return NextResponse.json({
        success: false,
        error: saveError.message || 'Failed to save content',
        details: saveError
      }, { status: 500 })
    }

    const saveTime = Date.now() - startTime
    console.log(`✅ Content saved in ${saveTime}ms: ${savedContent.id}`)

    // CRITICAL: Queue background intelligence job (fire-and-forget)
    // This MUST NOT block the response
    queueIntelligenceJob(savedContent.id).catch((err) => {
      console.error('Failed to queue intelligence job:', err)
      // Don't fail the save if queueing fails
    })

    // Log performance metric
    logPerformanceMetric('save_time', saveTime).catch(() => {})

    // Return success IMMEDIATELY (target < 200ms total)
    return NextResponse.json({
      success: true,
      id: savedContent.id,
      message: 'Content saved to Content Library',
      location: 'content_library',
      intelligenceStatus: 'pending',
      saveTime: `${saveTime}ms`,
      data: savedContent
    })

  } catch (error) {
    console.error('❌ Content save error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save content',
      details: error
    }, { status: 500 })
  }
}

// Queue background intelligence job
async function queueIntelligenceJob(contentId: string): Promise<void> {
  try {
    await supabase
      .from('job_queue')
      .insert({
        job_type: 'analyze-content',
        payload: { contentId },
        priority: 5, // Medium priority
        status: 'pending'
      })

    console.log(`📋 Queued intelligence job for content: ${contentId}`)
  } catch (error) {
    console.error('Failed to queue job:', error)
    throw error
  }
}

// Log performance metrics for monitoring
async function logPerformanceMetric(
  metricType: string,
  metricValue: number
): Promise<void> {
  try {
    await supabase
      .from('performance_metrics')
      .insert({
        metric_type: metricType,
        metric_value: metricValue,
        metadata: {},
        created_at: new Date().toISOString()
      })
  } catch (error) {
    // Don't log errors for metrics (not critical)
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')
    const contentType = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabase
      .from('content_library')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }

    if (contentType) {
      query = query.eq('content_type', contentType)
    }

    const { data, error } = await query

    if (error) {
      console.error('Content fetch error:', error)
      // Return empty array instead of failing
      return NextResponse.json({
        success: true,
        data: [],
        location: 'content_library',
        message: 'Content library not yet initialized'
      })
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      location: 'content_library'
    })

  } catch (error) {
    console.error('Content library fetch error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch content'
    }, { status: 500 })
  }
}