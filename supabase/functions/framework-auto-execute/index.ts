import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VOYAGE_API_KEY = Deno.env.get('VOYAGE_API_KEY')

// Helper: Generate embedding using Voyage AI
async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!VOYAGE_API_KEY) return null
  try {
    const response = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VOYAGE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'voyage-3-large',
        input: text.substring(0, 8000),
        input_type: 'document'
      })
    })
    if (!response.ok) return null
    const data = await response.json()
    return data.data[0].embedding
  } catch (error) {
    console.error('❌ Embedding error:', error)
    return null
  }
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { framework, organizationId, userId } = await req.json()

    if (!framework) {
      throw new Error('Framework is required')
    }

    console.log('🚀 Auto-executing framework:', framework.strategy?.objective)

    // Debug: Log framework structure
    console.log('Framework keys:', Object.keys(framework))
    console.log('Has executionPlan:', !!framework.executionPlan)
    console.log('Has contentStrategy:', !!framework.contentStrategy)
    console.log('Has content_needs:', !!framework.content_needs)

    // Get content types to auto-generate
    // Try new structure first, then fall back to old structure
    let contentTypes = framework.executionPlan?.autoExecutableContent?.contentTypes ||
                      framework.content_needs?.priority_content ||
                      []

    // If contentTypes is array of strings (old format), extract content type names
    if (contentTypes.length > 0 && typeof contentTypes[0] === 'string') {
      // Parse content types from priority content descriptions
      const parsedTypes: string[] = []
      contentTypes.forEach((desc: string) => {
        const lower = desc.toLowerCase()
        if (lower.includes('press release')) parsedTypes.push('press-release')
        if (lower.includes('thought leadership') || lower.includes('blog')) parsedTypes.push('thought-leadership')
        if (lower.includes('case study')) parsedTypes.push('case-study')
        if (lower.includes('media pitch')) parsedTypes.push('media-pitch')
        if (lower.includes('media list') || lower.includes('journalist')) parsedTypes.push('media-list')
        if (lower.includes('social media')) parsedTypes.push('social-post')
        if (lower.includes('white paper')) parsedTypes.push('white-paper')
        if (lower.includes('infographic')) parsedTypes.push('infographic')
      })
      contentTypes = [...new Set(parsedTypes)]
    }

    // Replace blog-post with thought-leadership
    contentTypes = contentTypes.map((type: string) =>
      type === 'blog-post' ? 'thought-leadership' : type
    )

    // Remove duplicates
    contentTypes = [...new Set(contentTypes)]

    // If still no content types, use defaults
    if (contentTypes.length === 0) {
      console.log('⚠️ No content types found, using defaults')
      contentTypes = ['press-release', 'thought-leadership', 'case-study', 'media-pitch', 'media-list', 'social-post']
    }

    console.log(`📦 Auto-generating ${contentTypes.length} content types:`, contentTypes)

    // Create folder name from framework title
    const folderName = framework.strategy?.objective
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .substring(0, 50) || `framework-${Date.now()}`

    const frameworkFolder = `strategic-frameworks/${folderName}`

    // Save framework first to the folder
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    const frameworkTitle = `${framework.strategy?.objective} - Framework`
    const frameworkContent = JSON.stringify(framework, null, 2)
    const text = `${frameworkTitle}\n\n${frameworkContent}`.substring(0, 8000)
    const embedding = await generateEmbedding(text)

    await supabase.from('content_library').insert({
      organization_id: organizationId,
      content_type: 'strategic-framework',
      title: frameworkTitle,
      content: frameworkContent,
      folder: frameworkFolder,
      metadata: {
        frameworkId: framework.id,
        workflowType: framework.orchestration?.workflow_type,
        createdFrom: 'niv-orchestrator-robust',
        hasStrategicRecommendations: framework.executionPlan?.strategicRecommendations?.campaigns?.length > 0
      },
      status: 'approved',
      tags: ['strategic-framework', framework.orchestration?.workflow_type || 'general'],
      embedding,
      embedding_model: 'voyage-3-large',
      embedding_updated_at: embedding ? new Date().toISOString() : null
    })

    console.log(`💾 Framework saved to ${frameworkFolder}`)

    // Transform framework data into the format niv-content-intelligent-v2 expects
    // It needs: subject, narrative, key_messages, target_audiences, media_targets, timeline, chosen_approach
    const transformedStrategy = {
      subject: framework.strategy?.objective || framework.full_strategy?.subject || 'Strategic Initiative',
      narrative: framework.strategy?.narrative || framework.full_strategy?.narrative || framework.narrative || '',
      // Try both camelCase and snake_case for key_messages
      key_messages: framework.strategy?.keyMessages || framework.strategy?.key_messages || framework.proof_points || [],
      target_audiences: framework.strategy?.target_audiences || framework.full_strategy?.target_audiences || ['Industry stakeholders', 'Media', 'General public'],
      media_targets: framework.media_targets || framework.full_strategy?.media_targets || {
        tier_1_targets: ['Industry publications'],
        tier_2_targets: ['Tech media'],
        tier_3_targets: ['General news']
      },
      timeline: framework.timeline_execution || framework.full_strategy?.timeline || {
        immediate: ['Launch content campaign'],
        short_term: ['Build momentum'],
        long_term: ['Maintain presence']
      },
      chosen_approach: framework.orchestration?.workflow_type || 'strategic-framework',

      // Pass through ENTIRE framework for maximum context
      fullFramework: framework,
      contentStrategy: framework.contentStrategy,
      executionPlan: framework.executionPlan,

      // Also pass through specific fields that content generator expects
      proof_points: framework.strategy?.proof_points || framework.proof_points || [],
      rationale: framework.strategy?.rationale
    }

    console.log('📋 Transformed strategy for content generation:', {
      subject: transformedStrategy.subject,
      hasNarrative: !!transformedStrategy.narrative,
      keyMessagesCount: transformedStrategy.key_messages?.length || 0,
      audiencesCount: transformedStrategy.target_audiences?.length || 0
    })

    // Generate all content pieces
    const generatedContent: any[] = []
    const errors: any[] = []

    for (const contentType of contentTypes) {
      try {
        console.log(`📝 Generating ${contentType}...`)

        // Call content generator for each type
        const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-content-intelligent-v2`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
          },
          body: JSON.stringify({
            conversationId: `auto-exec-${Date.now()}-${contentType}`,
            message: `Generate a ${contentType}`,
            organizationId: organizationId,
            userId: userId,

            // Pre-populate the strategy in the format niv-content expects
            preloadedStrategy: transformedStrategy,
            requestedContentType: contentType,
            autoExecute: true,

            // Tell it where to save
            saveFolder: frameworkFolder
          })
        })

        const result = await response.json()

        if (result.success && result.content) {
          generatedContent.push({
            type: contentType,
            content: result.content
          })
          console.log(`✅ ${contentType} generated`)
        } else {
          throw new Error(result.error || 'Generation failed')
        }

      } catch (error) {
        console.error(`❌ Error generating ${contentType}:`, error)
        errors.push({
          type: contentType,
          error: error.message
        })
      }
    }

    // DISABLED: Playbooks are not a recognized content type and confuse users
    // const strategicCampaigns = framework.executionPlan?.strategicRecommendations?.campaigns || []
    const strategicCampaigns: any[] = []

    console.log(`✅ Auto-execution complete: ${generatedContent.length}/${contentTypes.length} pieces generated`)

    return new Response(JSON.stringify({
      success: true,
      message: `Campaign executed: ${generatedContent.length} pieces generated, ${strategicCampaigns.length} playbooks created`,
      contentGenerated: generatedContent,
      playbooksCreated: strategicCampaigns.length,
      errors: errors.length > 0 ? errors : undefined,
      folder: frameworkFolder,
      frameworkId: framework.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('Auto-execute error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// Generate playbook markdown
function generatePlaybookMarkdown(campaign: any, folderPath: string): string {
  return `# ${campaign?.title || 'Untitled Campaign'}

## Overview
${campaign?.description || 'No description provided'}

## Why This Works
${campaign?.rationale || 'Strategic rationale to be determined'}

## Execution Timeline
${campaign?.timeline || 'Timeline to be determined'}

## Steps
${campaign?.executionSteps?.map((step: string, i: number) => `${i + 1}. ${step}`).join('\n') || 'No execution steps defined'}

## Resources Required
${campaign?.resources_needed?.map((r: string) => `- ${r}`).join('\n') || 'Resources to be determined'}

## Success Metrics
${campaign?.success_metrics?.map((m: string) => `- ${m}`).join('\n') || 'Metrics to be defined'}

## Platform Support

### Auto-Generated Assets
${campaign?.platform_support?.generatable_assets?.map((a: string) => `- ${a}`).join('\n') || 'No auto-generated assets defined'}

### Templates Provided
${campaign?.platform_support?.templates_provided?.map((t: string) => `- ${t}`).join('\n') || 'No templates defined'}

### Research Provided
${campaign?.platform_support?.research_provided ? 'Yes - Media lists and journalist contacts available' : 'No'}

---
**Generated by SignalDesk Strategic Framework**
Folder: \`${folderPath}\`
`
}
