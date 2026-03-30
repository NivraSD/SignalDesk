import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://zskaxjtyuaqazydouifp.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

/**
 * Generate embedding for content using Voyage AI voyage-3-large
 */
async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    // Prepare text: title + first 2000 chars of content for optimal embedding
    const truncatedText = text.substring(0, 2000)

    const { data, error } = await supabase.functions.invoke('generate-embeddings', {
      body: { text: truncatedText }
    })

    if (error) {
      console.error('❌ Embedding generation error:', error)
      return null
    }

    if (!data?.embedding) {
      console.error('❌ No embedding returned from function')
      return null
    }

    console.log(`✅ Generated ${data.dimensions}D embedding using ${data.model}`)
    return data.embedding
  } catch (err) {
    console.error('❌ Exception generating embedding:', err)
    return null
  }
}

/**
 * Generate content fingerprint for deduplication
 */
function generateFingerprint(content: string, title: string): string {
  // Simple fingerprint based on content hash
  const text = `${title}::${content}`.toLowerCase().replace(/\s+/g, ' ').trim()
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return `fp_${Math.abs(hash).toString(16)}`
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.json()
    const { content, metadata, folder, id: contentId } = body

    const org_id = content.organization_id || metadata?.organizationId
    console.log('💾 SAVE DEBUG:', {
      org_id,
      type: content.type,
      folder,
      title: content.title,
      updating: !!contentId
    })

    // Just log if org doesn't exist, but ALLOW the save anyway
    if (org_id) {
      const { data: orgExists } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('id', org_id)
        .maybeSingle()

      if (!orgExists) {
        console.warn('⚠️ WARNING: Saving content for org that may not exist:', org_id)
      }
    }

    // If ID provided, UPDATE existing content
    if (contentId) {
      // Prepare updated content for embedding
      const updateTitle = content.title || metadata?.title || `Content - ${new Date().toLocaleDateString()}`
      const updateContent = typeof content.content === 'string' ? content.content : JSON.stringify(content.content)

      // Regenerate embedding for updated content
      const textForEmbedding = `${updateTitle}\n\n${updateContent}`
      console.log(`🔮 Regenerating embedding for update: ${updateTitle.substring(0, 50)}...`)
      const embedding = await generateEmbedding(textForEmbedding)

      // Generate new fingerprint
      const fingerprint = generateFingerprint(updateContent, updateTitle)

      const { data: updatedContent, error: updateError } = await supabase
        .from('content_library')
        .update({
          title: updateTitle,
          content: updateContent,
          metadata: {
            ...metadata,
            ...content.metadata,
            framework_data: content.framework_data,
            opportunity_data: content.opportunity_data,
            generatedAt: content.timestamp || new Date().toISOString()
          },
          folder: folder || 'Unsorted',
          updated_at: new Date().toISOString(),
          last_accessed_at: new Date().toISOString(),
          // Update embedding fields
          embedding: embedding,
          embedding_model: embedding ? 'voyage-3-large' : null,
          embedding_updated_at: embedding ? new Date().toISOString() : null,
          fingerprint: fingerprint
        })
        .eq('id', contentId)
        .select()
        .single()

      if (updateError) {
        console.error('❌ Content update error:', updateError)
        return NextResponse.json({
          success: false,
          error: updateError.message || 'Failed to update content'
        }, { status: 500 })
      }

      const updateTime = Date.now() - startTime
      console.log(`✅ Content updated in ${updateTime}ms: ${updatedContent.id}${embedding ? ' (with embedding)' : ' (no embedding)'}`)

      // Update recent_work in company_profile (fire-and-forget)
      updateRecentWork(org_id, updateTitle, content.type || 'general', folder || '', contentId).catch((err) => {
        console.error('Failed to update recent_work:', err)
      })

      return NextResponse.json({
        success: true,
        id: updatedContent.id,
        message: 'Content updated in Memory Vault',
        location: 'content_library',
        hasEmbedding: !!embedding,
        fingerprint: fingerprint,
        saveTime: `${updateTime}ms`,
        data: updatedContent
      })
    }

    // Otherwise INSERT new content
    // Prepare title and content for embedding/fingerprint
    const contentTitle = content.title || metadata?.title || `Content - ${new Date().toLocaleDateString()}`
    const contentBody = typeof content.content === 'string' ? content.content : JSON.stringify(content.content)

    // Generate fingerprint for deduplication
    const fingerprint = generateFingerprint(contentBody, contentTitle)
    console.log(`🔑 Generated fingerprint: ${fingerprint}`)

    // Check for duplicate content using fingerprint (gracefully handle if column doesn't exist)
    try {
      const { data: existingContent, error: dupCheckError } = await supabase
        .from('content_library')
        .select('id, title')
        .eq('fingerprint', fingerprint)
        .eq('organization_id', content.organization_id || metadata?.organizationId)
        .maybeSingle()

      // Only return duplicate if we found one and no error
      if (!dupCheckError && existingContent) {
        console.log(`⚠️ Duplicate content detected: ${existingContent.id} - ${existingContent.title}`)
        return NextResponse.json({
          success: true,
          id: existingContent.id,
          message: 'Content already exists in Memory Vault',
          location: 'content_library',
          isDuplicate: true,
          data: existingContent
        })
      }
    } catch (dupError) {
      // Fingerprint column may not exist yet, continue with save
      console.warn('⚠️ Fingerprint check skipped:', dupError)
    }

    // Generate embedding for semantic search
    const textForEmbedding = `${contentTitle}\n\n${contentBody}`
    console.log(`🔮 Generating embedding for: ${contentTitle.substring(0, 50)}...`)
    const embedding = await generateEmbedding(textForEmbedding)

    // Build insert data - core fields that should always exist
    const insertData: Record<string, unknown> = {
      organization_id: content.organization_id || metadata?.organizationId || null,
      content_type: content.type || 'general',
      title: contentTitle,
      content: contentBody,
      metadata: {
        ...metadata,
        ...content.metadata,
        framework_data: content.framework_data,
        opportunity_data: content.opportunity_data,
        generatedAt: content.timestamp || new Date().toISOString(),
        fingerprint: fingerprint // Store in metadata as backup
      },
      tags: [content.type].filter(Boolean),
      status: 'saved',
      created_by: 'niv',
      folder: folder || 'Unsorted',
      last_accessed_at: new Date().toISOString()
    }

    // Add embedding fields if embedding was generated
    if (embedding) {
      insertData.embedding = embedding
      insertData.embedding_model = 'voyage-3-large'
      insertData.embedding_updated_at = new Date().toISOString()
      console.log(`✅ Generated ${Array.isArray(embedding) ? embedding.length : 0}D embedding`)
    } else {
      console.log(`⚠️ No embedding generated - semantic search will not be available for this content`)
    }

    // Add optional fields if they exist in schema
    insertData.intelligence_status = 'pending'
    insertData.salience_score = 1.0
    insertData.access_count = 0
    insertData.fingerprint = fingerprint

    // Try to insert with all fields
    let savedContent: Record<string, unknown> | null = null
    let saveError: { message?: string; code?: string } | null = null

    const { data: result, error: err } = await supabase
      .from('content_library')
      .insert(insertData)
      .select()
      .single()

    savedContent = result
    saveError = err

    // If fingerprint column doesn't exist, retry without it
    if (saveError?.message?.includes('fingerprint')) {
      console.warn('⚠️ Fingerprint column not found, retrying without it...')
      delete insertData.fingerprint
      const { data: retryResult, error: retryErr } = await supabase
        .from('content_library')
        .insert(insertData)
        .select()
        .single()
      savedContent = retryResult
      saveError = retryErr
    }

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
    const savedContentId = savedContent?.id as string
    console.log(`✅ Content saved in ${saveTime}ms: ${savedContentId}${embedding ? ' (with embedding)' : ' (no embedding)'}`)

    // CRITICAL: Queue background intelligence job (fire-and-forget)
    // This MUST NOT block the response
    if (savedContentId) {
      queueIntelligenceJob(savedContentId).catch((err) => {
        console.error('Failed to queue intelligence job:', err)
        // Don't fail the save if queueing fails
      })

      // Update recent_work in company_profile (fire-and-forget)
      updateRecentWork(org_id, contentTitle, content.type || 'general', folder || '', savedContentId).catch((err) => {
        console.error('Failed to update recent_work:', err)
        // Don't fail the save if recent_work update fails
      })
    }

    // Log performance metric
    logPerformanceMetric('save_time', saveTime).catch(() => {})

    // Return success IMMEDIATELY (target < 200ms total)
    return NextResponse.json({
      success: true,
      id: savedContentId,
      message: 'Content saved to Memory Vault',
      location: 'content_library',
      intelligenceStatus: 'pending',
      hasEmbedding: !!embedding,
      fingerprint: fingerprint,
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

// Update recent_work in company_profile
async function updateRecentWork(
  organizationId: string,
  contentTitle: string,
  contentType: string,
  folder: string,
  contentId: string
): Promise<void> {
  try {
    // Skip if no organization
    if (!organizationId) return

    // Determine what type of recent work this is
    const isOpportunity = folder?.toLowerCase().includes('opportunities')
    const isCampaign = folder?.toLowerCase().includes('campaign')
    const isOverview = contentTitle?.toLowerCase().includes('overview') || contentTitle?.toLowerCase().includes('blueprint')

    // Only track high-level items: opportunity overviews, campaign blueprints, or standalone content
    // Skip individual execution pieces (presentations, emails, social posts within campaigns/opportunities)
    if ((isOpportunity || isCampaign) && !isOverview) {
      console.log(`⏭️ Skipping recent_work update for execution piece: ${contentTitle}`)
      return
    }

    // Get current company_profile
    const { data: org, error: fetchError } = await supabase
      .from('organizations')
      .select('company_profile')
      .eq('id', organizationId)
      .single()

    if (fetchError || !org) {
      console.warn('⚠️ Could not fetch org for recent_work update:', fetchError?.message)
      return
    }

    const profile = org.company_profile || {}
    const recentWork = profile.recent_work || {
      opportunities: [],
      campaigns: [],
      content: []
    }

    const now = new Date().toISOString()

    // Build the work item
    const workItem = {
      id: contentId,
      title: contentTitle,
      type: contentType,
      created_at: now
    }

    if (isOpportunity && isOverview) {
      // Extract opportunity name from folder (e.g., "Opportunities/Ulta Beauty CFO Transition")
      const oppName = folder?.split('/')[1] || contentTitle
      const oppItem = {
        id: contentId,
        title: oppName,
        status: 'active',
        created_at: now,
        overview: contentTitle
      }
      // Add to front, remove duplicates by title, cap at 5
      recentWork.opportunities = [
        oppItem,
        ...recentWork.opportunities.filter((o: any) => o.title !== oppName)
      ].slice(0, 5)
      console.log(`📋 Added opportunity to recent_work: ${oppName}`)
    } else if (isCampaign && isOverview) {
      // Extract campaign name from folder
      const campaignName = folder?.split('/')[1] || contentTitle
      const campaignItem = {
        id: contentId,
        title: campaignName,
        status: 'active',
        created_at: now,
        blueprint: contentTitle
      }
      // Add to front, remove duplicates by title, cap at 3
      recentWork.campaigns = [
        campaignItem,
        ...recentWork.campaigns.filter((c: any) => c.title !== campaignName)
      ].slice(0, 3)
      console.log(`📋 Added campaign to recent_work: ${campaignName}`)
    } else if (!isOpportunity && !isCampaign) {
      // Standalone content (not part of opportunity/campaign)
      // Add to front, remove duplicates by id, cap at 10
      recentWork.content = [
        workItem,
        ...recentWork.content.filter((c: any) => c.id !== contentId)
      ].slice(0, 10)
      console.log(`📋 Added content to recent_work: ${contentTitle}`)
    }

    // Update last_updated
    recentWork.last_updated = now

    // Save back to company_profile
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        company_profile: {
          ...profile,
          recent_work: recentWork
        }
      })
      .eq('id', organizationId)

    if (updateError) {
      console.error('❌ Failed to update recent_work:', updateError)
    } else {
      console.log(`✅ recent_work updated for org ${organizationId}`)
    }
  } catch (error) {
    console.error('❌ Exception updating recent_work:', error)
    // Don't fail the save if recent_work update fails
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

// Boost salience when content is accessed
async function boostSalienceForAccess(contentIds: string[]): Promise<void> {
  try {
    // Use the database function to boost salience for each item
    // This is more efficient than individual updates
    for (const contentId of contentIds) {
      await supabase.rpc('boost_salience_on_access', {
        content_id: contentId,
        boost_amount: 0.05 // 5% boost
      })
    }

    console.log(`📈 Boosted salience for ${contentIds.length} items`)
  } catch (error) {
    // Don't fail if salience boost fails (not critical)
    console.warn('Failed to boost salience:', error)
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')
    const contentType = searchParams.get('type')
    const blueprintId = searchParams.get('blueprint_id')
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

    if (blueprintId) {
      query = query.eq('metadata->>blueprint_id', blueprintId)
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

    // Boost salience for accessed items (fire-and-forget, don't block response)
    if (data && data.length > 0) {
      boostSalienceForAccess(data.map(item => item.id)).catch(() => {})
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

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Content ID is required'
      }, { status: 400 })
    }

    const body = await request.json()
    const updates = body.updates || body

    const { data, error } = await supabase
      .from('content_library')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Content update error:', error)
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Content update error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update content'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Content ID is required'
      }, { status: 400 })
    }

    const { error } = await supabase
      .from('content_library')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Content delete error:', error)
      return NextResponse.json({
        success: false,
        error: error.message
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