import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ContentPieceRequest {
  id: string
  type: string
  targetStakeholder?: string
  phase?: string
  description?: string  // The actual description/purpose from the blueprint
  specs: {
    format: string
    length: string
    tone: string
    keyElements: string[]
  }
  priority: 'high' | 'medium' | 'low'
  // Social media fields (optional)
  platform?: string  // LinkedIn, Twitter, Instagram, etc.
  postOwner?: string  // CEO, brand account, marketing team, etc.
  postFormat?: string  // Single post, Thread, Carousel, etc.
}

// New interfaces for phase-campaign architecture
interface OwnedContentRequest {
  type: string
  stakeholder: string
  purpose: string
  keyPoints: string[]
  platform?: string
  postOwner?: string
  postFormat?: string
}

interface MediaEngagementRequest {
  type: string
  journalists: string[]
  story: string
  positioning: string
}

interface PhaseCampaign {
  phase: string
  phaseNumber: number
  objective: string
  narrative: string
  stakeholders: string[]
  ownedContent: OwnedContentRequest[]
  mediaEngagement: MediaEngagementRequest[]
  keyMessages: string[]
  timeline: string
}

interface ExecutorRequest {
  blueprintId: string
  blueprint: any
  campaignType: 'PR_CAMPAIGN' | 'VECTOR_CAMPAIGN'
  contentPieces?: string[]  // Specific piece IDs to generate, or all if not specified
  orgId: string
  organizationContext: {
    name: string
    industry: string
  }
  refinementRequest?: {
    pieceId: string
    feedback: string
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const {
      blueprintId: sessionId,
      blueprint,
      campaignType,
      contentPieces,
      orgId,
      organizationContext,
      refinementRequest
    } = await req.json() as ExecutorRequest

    console.log('Campaign Executor:', {
      sessionId,
      campaignType,
      piecesRequested: contentPieces?.length || 'all',
      hasRefinement: !!refinementRequest
    })

    // First, fetch session data to get research_data and positioning
    console.log('📊 Fetching session data for required fields...')
    const { data: sessionData, error: sessionError } = await supabaseClient
      .from('campaign_builder_sessions')
      .select('research_findings, selected_positioning, campaign_goal')
      .eq('id', sessionId)
      .maybeSingle()

    if (sessionError) {
      console.error('❌ Failed to fetch session data:', sessionError)
      throw new Error(`Failed to fetch session data: ${sessionError.message}`)
    }

    if (!sessionData) {
      console.error('❌ Session not found:', sessionId)
      throw new Error(`Session not found: ${sessionId}`)
    }

    // Extract positioning and research data
    const positioning = sessionData.selected_positioning?.name ||
                       sessionData.selected_positioning?.positioning ||
                       blueprint.part1_strategicFoundation?.positioning?.name ||
                       'Default Positioning'

    const research_data = sessionData.research_findings || {}

    console.log('✅ Session data retrieved:', {
      hasResearch: !!research_data,
      positioning: positioning
    })

    // Now ensure blueprint is saved to database with all required fields
    console.log('💾 Saving blueprint to campaign_blueprints table...')

    const { data: existingBlueprint, error: checkError } = await supabaseClient
      .from('campaign_blueprints')
      .select('id')
      .eq('session_id', sessionId)
      .maybeSingle()

    let blueprintId: string

    if (existingBlueprint) {
      blueprintId = existingBlueprint.id
      console.log(`✅ Blueprint already exists with ID: ${blueprintId}`)
    } else {
      // Save new blueprint with all required fields
      const { data: newBlueprint, error: insertError} = await supabaseClient
        .from('campaign_blueprints')
        .insert({
          session_id: sessionId,
          org_id: parseInt(orgId),
          campaign_type: campaignType,
          positioning: positioning,  // NOW INCLUDED
          research_data: research_data,  // NOW INCLUDED
          blueprint_data: blueprint,
          status: 'in_execution',  // Fixed: was 'executing', must be 'in_execution'
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (insertError) {
        console.error('❌ Failed to save blueprint:', insertError)
        throw new Error(`Failed to save blueprint: ${insertError.message}`)
      }

      blueprintId = newBlueprint.id
      console.log(`✅ Blueprint saved with ID: ${blueprintId}`)
    }

    // Attach research_data to blueprint for content generation context
    blueprint.research_data = research_data

    // Handle refinement request
    if (refinementRequest) {
      const refinedContent = await regenerateContentPiece(
        supabaseClient,
        blueprintId,
        blueprint,
        refinementRequest.pieceId,
        refinementRequest.feedback,
        organizationContext
      )

      return new Response(
        JSON.stringify({ content: [refinedContent] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // NEW: Use phase-campaign architecture for VECTOR campaigns
    if (campaignType === 'VECTOR_CAMPAIGN' && blueprint.part3_tacticalOrchestration) {
      console.log('🎯 Using phase-campaign orchestration architecture')

      // Create campaign folder
      const campaignFolderName = generateCampaignFolderName(
        sessionData.campaign_goal,
        blueprintId
      )
      const campaignFolder = `campaigns/${campaignFolderName}`

      console.log(`📁 Campaign folder: ${campaignFolder}`)

      // Save blueprint to Memory Vault with folder
      try {
        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/niv-campaign-memory?action=save-blueprint`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify({
            blueprintId,
            blueprint,
            campaignType,
            orgId,
            sessionData: {
              campaignGoal: sessionData.campaign_goal,
              researchFindings: research_data,
              selectedPositioning: sessionData.selected_positioning
            },
            folder: campaignFolder,
            metadata: {
              industry: organizationContext.industry,
              stakeholderGroups: blueprint.part1_strategicFoundation?.targetStakeholders?.map((s: any) => s.name) || [],
              timelineWeeks: blueprint.overview?.timeline_weeks || 12
            }
          })
        })
        console.log('✅ Blueprint saved to Memory Vault')
      } catch (memError) {
        console.error('⚠️ Memory Vault blueprint save failed (non-critical):', memError)
      }

      // NEW: Generate campaign summary for strategic context
      const campaignSummary = await generateCampaignSummary(
        blueprint,
        sessionData,
        positioning,
        organizationContext
      )

      // Extract phase campaigns
      const phaseCampaigns = extractPhaseCampaigns(blueprint, campaignType)

      console.log(`📊 Extracted ${phaseCampaigns.length} phase campaigns`)
      phaseCampaigns.forEach((pc, idx) => {
        console.log(`  ${idx + 1}. ${pc.phase}: ${pc.ownedContent.length} owned + ${pc.mediaEngagement.length} media`)
      })

      if (phaseCampaigns.length === 0) {
        throw new Error('No phase campaigns could be extracted from blueprint')
      }

      console.log(`\n🎨 Generating ${phaseCampaigns.length} phase campaigns IN PARALLEL...`)
      console.log(`   This will complete in ~20 seconds instead of ~80 seconds!`)

      // Generate ALL phases in parallel (4x speed boost!)
      const phasePromises = phaseCampaigns.map(async (phaseCampaign) => {
        console.log(`📍 Starting ${phaseCampaign.phase} phase...`)

        try {
          const response = await fetch(
            `${Deno.env.get('SUPABASE_URL')}/functions/v1/niv-content-intelligent-v2`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
              },
              body: JSON.stringify({
                message: `Generate coordinated ${phaseCampaign.phase} phase campaign`,
                organizationContext: {
                  organizationId: organizationContext.name,
                  organizationName: organizationContext.name,
                  industry: organizationContext.industry
                },
                stage: 'campaign_generation',
                campaignContext: {
                  blueprintId,
                  campaignType,
                  campaignFolder,
                  phase: phaseCampaign.phase,
                  phaseNumber: phaseCampaign.phaseNumber,
                  objective: phaseCampaign.objective,
                  narrative: phaseCampaign.narrative,
                  targetStakeholders: phaseCampaign.stakeholders,
                  positioning: positioning,
                  keyMessages: phaseCampaign.keyMessages,
                  researchInsights: research_data.keyInsights || [],
                  timeline: phaseCampaign.timeline,
                  currentDate: new Date().toISOString().split('T')[0],
                  contentRequirements: {
                    owned: phaseCampaign.ownedContent,
                    media: phaseCampaign.mediaEngagement
                  },
                  campaignSummary: campaignSummary || undefined
                }
              })
            }
          )

          if (response.ok) {
            const phaseResult = await response.json()
            console.log(`✅ ${phaseCampaign.phase} phase complete: ${phaseResult.generatedContent?.length || 0} pieces`)

            return {
              success: true,
              phase: phaseCampaign.phase,
              phaseNumber: phaseCampaign.phaseNumber,
              contentCount: phaseResult.generatedContent?.length || 0,
              folder: phaseResult.folder,
              generatedContent: phaseResult.generatedContent?.map((c: any) => ({
                ...c,
                phase: phaseCampaign.phase,
                phaseNumber: phaseCampaign.phaseNumber
              })) || []
            }
          } else {
            const errorText = await response.text()
            console.error(`❌ ${phaseCampaign.phase} phase failed:`, errorText)
            return {
              success: false,
              phase: phaseCampaign.phase,
              phaseNumber: phaseCampaign.phaseNumber,
              error: errorText,
              generatedContent: []
            }
          }
        } catch (error) {
          console.error(`❌ Error in ${phaseCampaign.phase} phase:`, error)
          return {
            success: false,
            phase: phaseCampaign.phase,
            phaseNumber: phaseCampaign.phaseNumber,
            error: error.message,
            generatedContent: []
          }
        }
      })

      // Wait for ALL phases to complete in parallel
      const results = await Promise.all(phasePromises)

      // Collect all content and results
      const allGeneratedContent: any[] = []
      const phaseResults: any[] = []

      results.forEach(result => {
        phaseResults.push({
          phase: result.phase,
          phaseNumber: result.phaseNumber,
          success: result.success,
          contentCount: result.contentCount,
          folder: result.folder,
          error: result.error
        })

        if (result.generatedContent) {
          allGeneratedContent.push(...result.generatedContent)
        }
      })

      console.log(`\n🎉 Campaign generation complete!`)
      console.log(`   Total phases: ${phaseCampaigns.length}`)
      console.log(`   Successful phases: ${phaseResults.filter(p => p.success).length}`)
      console.log(`   Total content pieces: ${allGeneratedContent.length}`)

      // Save to strategic planning
      try {
        await saveToStrategicCampaigns(
          supabaseClient,
          sessionId,
          blueprintId,
          blueprint,
          sessionData,
          campaignSummary,
          phaseCampaigns,
          phaseResults,
          allGeneratedContent,
          organizationContext,
          positioning,
          campaignFolder
        )
      } catch (saveError) {
        console.error('⚠️ Strategic campaigns save failed (non-critical):', saveError)
      }

      return new Response(
        JSON.stringify({
          success: true,
          architecture: 'phase-campaign',
          campaignFolder,
          phasesGenerated: phaseResults.filter(p => p.success).length,
          totalPhases: phaseCampaigns.length,
          totalContentPieces: allGeneratedContent.length,
          phaseResults,
          content: allGeneratedContent
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } else {
      // FALLBACK: Use old per-piece architecture for PR campaigns or legacy blueprints
      console.log('📝 Using legacy per-piece content generation')

      const contentInventory = extractContentInventory(blueprint, campaignType)

      // Filter to specific pieces if requested
      const piecesToGenerate = contentPieces
        ? contentInventory.filter(p => contentPieces.includes(p.id))
        : contentInventory

      console.log(`Generating ${piecesToGenerate.length} content pieces`)

      // Generate content pieces
      const generatedContent = await Promise.all(
        piecesToGenerate.map(piece =>
          generateContentPiece(
            supabaseClient,
            blueprintId,
            blueprint,
            piece,
            campaignType,
            organizationContext
          )
        )
      )

      // Save to campaign_content table
      const savedContent = await saveGeneratedContent(
        supabaseClient,
        blueprintId,
        orgId,
        generatedContent
      )

      return new Response(
        JSON.stringify({
          success: true,
          architecture: 'per-piece',
          contentGenerated: generatedContent.length,
          content: savedContent
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Campaign Executor error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

function extractContentInventory(blueprint: any, campaignType: string): ContentPieceRequest[] {
  const inventory: ContentPieceRequest[] = []

  if (campaignType === 'PR_CAMPAIGN') {
    // Extract from PR blueprint
    if (blueprint.pressReleaseStrategy?.primaryRelease) {
      inventory.push({
        id: 'press_release_primary',
        type: 'press_release',
        specs: {
          format: 'press_release',
          length: '500-700 words',
          tone: 'professional',
          keyElements: blueprint.pressReleaseStrategy.primaryRelease.hooks || []
        },
        priority: 'high'
      })
    }

    if (blueprint.pressReleaseStrategy?.followUpReleases) {
      blueprint.pressReleaseStrategy.followUpReleases.forEach((release: any, i: number) => {
        inventory.push({
          id: `press_release_followup_${i + 1}`,
          type: 'press_release',
          specs: {
            format: 'press_release',
            length: '400-600 words',
            tone: 'professional',
            keyElements: [release.headline, release.angle]
          },
          priority: 'medium'
        })
      })
    }

    // Media pitches
    if (blueprint.mediaTargeting?.tier1Outlets) {
      blueprint.mediaTargeting.tier1Outlets.slice(0, 5).forEach((outlet: any, i: number) => {
        inventory.push({
          id: `media_pitch_${i + 1}`,
          type: 'media_pitch',
          specs: {
            format: 'email_pitch',
            length: '200-300 words',
            tone: 'professional',
            keyElements: [outlet.angle, outlet.outlet]
          },
          priority: 'high'
        })
      })
    }

    // Social posts
    inventory.push({
      id: 'social_post_linkedin',
      type: 'social_post',
      specs: {
        format: 'linkedin',
        length: '150-200 words',
        tone: 'professional',
        keyElements: blueprint.keyMessages?.supporting || []
      },
      priority: 'medium'
    })

  } else if (campaignType === 'VECTOR_CAMPAIGN') {
    console.log('📊 Extracting from VECTOR blueprint...')
    console.log('  Blueprint keys:', Object.keys(blueprint))

    // Extract from V3 VECTOR blueprint (part3_tacticalOrchestration)
    if (blueprint.part3_tacticalOrchestration) {
      console.log('✅ Found part3_tacticalOrchestration')
      console.log('  Phase keys:', Object.keys(blueprint.part3_tacticalOrchestration))

      const phases = ['phase1_awareness', 'phase2_consideration', 'phase3_conversion', 'phase4_advocacy']
      const phaseNames: Record<string, string> = {
        phase1_awareness: 'awareness',
        phase2_consideration: 'consideration',
        phase3_conversion: 'conversion',
        phase4_advocacy: 'advocacy'
      }

      phases.forEach((phaseKey) => {
        const phaseData = blueprint.part3_tacticalOrchestration[phaseKey]
        if (!phaseData) {
          console.log(`⚠️ No data for ${phaseKey}`)
          return
        }

        console.log(`\n📍 Processing ${phaseKey}:`)
        console.log(`  Keys in phase:`, Object.keys(phaseData))

        const phaseName = phaseNames[phaseKey]
        let contentCounter = 0

        // PILLAR 1: Owned Actions (Signaldesk Auto-Execute)
        // Includes: blog posts, LinkedIn articles, Twitter/X threads, social media posts
        // Excludes: video content, podcasts, and other formats we can't auto-generate
        const UNSUPPORTED_CONTENT_TYPES = [
          'video', 'podcast', 'webinar', 'infographic', 'interactive',
          'video testimonial', 'social media video'
        ]

        if (phaseData.pillar1_ownedActions && Array.isArray(phaseData.pillar1_ownedActions)) {
          console.log(`  ✓ Found ${phaseData.pillar1_ownedActions.length} owned actions in pillar1`)
          phaseData.pillar1_ownedActions.forEach((action: any, idx: number) => {
            const contentType = (action.contentType || 'owned_content').toLowerCase()

            // Skip unsupported content types
            if (UNSUPPORTED_CONTENT_TYPES.some(unsupported => contentType.includes(unsupported))) {
              console.log(`    ⏭️  Skipping ${action.contentType} - video/multimedia not supported`)
              return
            }

            contentCounter++
            const isSocialMedia = action.platform || action.postOwner || action.postFormat
            console.log(`    - Action ${idx}: ${action.contentType || 'owned_content'} for ${action.targetStakeholder || 'General'}${isSocialMedia ? ` [Social: ${action.platform || 'N/A'} by ${action.postOwner || 'N/A'}]` : ''}`)

            const piece: ContentPieceRequest = {
              id: `${phaseKey}_p1_${idx}`,
              type: action.contentType || 'owned_content',
              targetStakeholder: action.targetStakeholder || 'General Audience',
              phase: phaseName,
              description: action.description || action.purpose || action.objective,  // Include the actual purpose from blueprint
              specs: {
                format: action.contentType || 'article',
                length: '500-800 words',
                tone: 'strategic',
                keyElements: action.keyPoints || []
              },
              priority: idx === 0 ? 'high' : 'medium'
            }

            // Add social media fields if present
            if (action.platform) piece.platform = action.platform
            if (action.postOwner) piece.postOwner = action.postOwner
            if (action.postFormat) piece.postFormat = action.postFormat

            inventory.push(piece)
          })
        } else {
          console.log(`  ⚠️ No pillar1_ownedActions or not an array`)
        }

        // PILLAR 4: Media Engagement (Signaldesk Auto-Execute)
        // Includes: media pitches, press materials
        if (phaseData.pillar4_mediaEngagement && Array.isArray(phaseData.pillar4_mediaEngagement)) {
          console.log(`  ✓ Found ${phaseData.pillar4_mediaEngagement.length} media engagements in pillar4`)
          phaseData.pillar4_mediaEngagement.forEach((media: any, idx: number) => {
            contentCounter++
            console.log(`    - Media ${idx}: pitch for ${media.journalists?.join?.(', ') || 'Media'}`)
            inventory.push({
              id: `${phaseKey}_p4_${idx}`,
              type: 'media_pitch',
              targetStakeholder: media.journalists?.map((j: any) => j.name || j).join(', ') || 'Media',
              phase: phaseName,
              specs: {
                format: 'email_pitch',
                length: '250-350 words',
                tone: 'professional',
                keyElements: [media.story, media.positioningMessage].filter(Boolean)
              },
              priority: 'high'
            })
          })
        } else {
          console.log(`  ⚠️ No pillar4_mediaEngagement or not an array`)
        }

        console.log(`  Total content pieces extracted from ${phaseKey}: ${contentCounter}`)

        // NOTE: Pillar 2 (Relationship Orchestration) and Pillar 3 (Event Orchestration)
        // require USER execution, so we don't auto-generate content for those
      })

      console.log(`\n📦 Total content pieces extracted from V3 structure: ${inventory.length}`)
    } else {
      console.log('❌ No part3_tacticalOrchestration found in blueprint')
    }

    // FALLBACK: Support old blueprint structures if they exist
    if (blueprint.part4_tacticalExecution?.contentRequirements) {
      blueprint.part4_tacticalExecution.contentRequirements.forEach((req: any, i: number) => {
        inventory.push({
          id: `vector_content_${i + 1}`,
          type: req.type || 'content_piece',
          targetStakeholder: req.stakeholder,
          phase: req.phase,
          specs: {
            format: req.type || 'article',
            length: req.specifications || '500-700 words',
            tone: 'strategic',
            keyElements: []
          },
          priority: i < 5 ? 'high' : 'medium'
        })
      })
    }

    if (blueprint.part2_stakeholderMapping?.groups) {
      blueprint.part2_stakeholderMapping.groups.slice(0, 3).forEach((group: any) => {
        inventory.push({
          id: `awareness_${group.name.toLowerCase().replace(/\s+/g, '_')}`,
          type: 'awareness_content',
          targetStakeholder: group.name,
          phase: 'awareness',
          specs: {
            format: 'blog_post',
            length: '600-800 words',
            tone: 'educational',
            keyElements: group.psychologicalProfile?.values || []
          },
          priority: 'high'
        })
      })
    }
  }

  return inventory
}

// Helper: Normalize content type names from blueprint to MCP routing format
function normalizeContentType(rawType: string): string {
  const normalized = rawType
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')  // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, '')  // Remove non-alphanumeric except hyphens

  // Map common variations to standard types
  const typeMap: Record<string, string> = {
    'case-study': 'case-study',
    'white-paper': 'white-paper',
    'whitepaper': 'white-paper',
    'social-media-post': 'social-post',
    'social-post': 'social-post',
    'blog-post': 'blog-post',
    'blogpost': 'blog-post',
    'media-pitch': 'media-pitch',
    'press-release': 'press-release',
    'thought-leadership': 'thought-leadership',
    'executive-statement': 'executive-statement',
    'executive-brief': 'executive-brief',
    'qa-document': 'qa-document',
    'talking-points': 'talking-points',
    'email-campaign': 'email-campaign',
    'roi-calculator-tool': 'thought-leadership',  // Map ROI calculator to thought-leadership for now
    'roi-calculator': 'thought-leadership',
    'calculator': 'thought-leadership'
  }

  const mappedType = typeMap[normalized]
  if (mappedType) {
    console.log(`  🔄 Normalized "${rawType}" → "${mappedType}"`)
    return mappedType
  }

  console.log(`  ⚠️ Unknown content type "${rawType}", using normalized: "${normalized}"`)
  return normalized
}

// NEW: Extract phase campaigns for coordinated multi-type orchestration
function extractPhaseCampaigns(blueprint: any, campaignType: string): PhaseCampaign[] {
  const phaseCampaigns: PhaseCampaign[] = []

  if (campaignType !== 'VECTOR_CAMPAIGN') {
    console.log('⚠️ Phase campaigns only supported for VECTOR campaigns')
    return phaseCampaigns
  }

  if (!blueprint.part3_tacticalOrchestration) {
    console.log('❌ No part3_tacticalOrchestration found in blueprint')
    return phaseCampaigns
  }

  console.log('📊 Extracting phase campaigns from Blueprint V3...')

  const phases = ['phase1_awareness', 'phase2_consideration', 'phase3_conversion', 'phase4_advocacy']
  const phaseNames: Record<string, string> = {
    phase1_awareness: 'awareness',
    phase2_consideration: 'consideration',
    phase3_conversion: 'conversion',
    phase4_advocacy: 'advocacy'
  }

  const UNSUPPORTED_CONTENT_TYPES = [
    'video', 'podcast', 'webinar', 'infographic', 'interactive',
    'video testimonial', 'social media video'
  ]

  phases.forEach((phaseKey, index) => {
    const phaseData = blueprint.part3_tacticalOrchestration[phaseKey]
    if (!phaseData) {
      console.log(`⚠️ No data for ${phaseKey}`)
      return
    }

    const phaseName = phaseNames[phaseKey]
    const phaseNumber = index + 1

    console.log(`\n📍 Extracting ${phaseKey} campaign:`)

    // Extract owned content (Pillar 1)
    const ownedContent: OwnedContentRequest[] = []
    if (phaseData.pillar1_ownedActions && Array.isArray(phaseData.pillar1_ownedActions)) {
      phaseData.pillar1_ownedActions.forEach((action: any) => {
        const rawContentType = action.contentType || 'blog-post'
        const contentType = rawContentType.toLowerCase()

        // Skip unsupported content types
        if (UNSUPPORTED_CONTENT_TYPES.some(unsupported => contentType.includes(unsupported))) {
          console.log(`  ⏭️ Skipping ${rawContentType} - video/multimedia not supported`)
          return
        }

        // Normalize content type to match MCP routing
        const normalizedType = normalizeContentType(rawContentType)

        ownedContent.push({
          type: normalizedType,  // Use normalized type
          stakeholder: action.targetStakeholder || 'General Audience',
          purpose: action.description || action.purpose || action.objective || `${rawContentType} for ${action.targetStakeholder}`,
          keyPoints: action.keyPoints || [],
          platform: action.platform,
          postOwner: action.postOwner,
          postFormat: action.postFormat
        })

        console.log(`  ✓ Owned: ${rawContentType} → ${normalizedType} for ${action.targetStakeholder}`)
      })
    }

    // Extract media engagement (Pillar 4)
    const mediaEngagement: MediaEngagementRequest[] = []
    if (phaseData.pillar4_mediaEngagement && Array.isArray(phaseData.pillar4_mediaEngagement)) {
      phaseData.pillar4_mediaEngagement.forEach((media: any) => {
        const journalists = Array.isArray(media.journalists)
          ? media.journalists.map((j: any) => (typeof j === 'string' ? j : j.name || 'Unknown'))
          : []

        mediaEngagement.push({
          type: media.contentType || 'media-pitch',
          journalists: journalists,
          story: media.story || media.angle || 'Media story',
          positioning: media.positioningMessage || media.positioning || ''
        })

        console.log(`  ✓ Media: pitch for ${journalists.slice(0, 2).join(', ')}`)
      })
    }

    // Extract stakeholders
    const stakeholders: string[] = []
    if (ownedContent.length > 0) {
      ownedContent.forEach(c => {
        if (c.stakeholder && !stakeholders.includes(c.stakeholder)) {
          stakeholders.push(c.stakeholder)
        }
      })
    }

    // Build phase campaign
    if (ownedContent.length > 0 || mediaEngagement.length > 0) {
      phaseCampaigns.push({
        phase: phaseName,
        phaseNumber: phaseNumber,
        objective: phaseData.objective || `${phaseName} phase objective`,
        narrative: phaseData.convergencePoint || phaseData.narrative || '',
        stakeholders: stakeholders,
        ownedContent: ownedContent,
        mediaEngagement: mediaEngagement,
        keyMessages: phaseData.keyMessages || [],
        timeline: `Week ${index * 3 + 1}-${(index + 1) * 3}`
      })

      console.log(`  ✅ Phase campaign created: ${ownedContent.length} owned + ${mediaEngagement.length} media = ${ownedContent.length + mediaEngagement.length} total pieces`)
    }
  })

  console.log(`\n📦 Total phase campaigns extracted: ${phaseCampaigns.length}`)
  return phaseCampaigns
}

// Helper function to generate campaign folder name
function generateCampaignFolderName(campaignGoal: string, blueprintId: string): string {
  const slug = campaignGoal
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)

  const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '')
  const shortId = blueprintId.split('-')[0] || blueprintId.substring(0, 8)

  return `${slug}-${timestamp}-${shortId}`
}

// NEW: Generate campaign summary from blueprint using Claude
async function generateCampaignSummary(
  blueprint: any,
  sessionData: any,
  positioning: string,
  organizationContext: any
): Promise<any> {
  console.log('📋 Generating campaign summary from blueprint...')

  const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
  if (!ANTHROPIC_API_KEY) {
    console.warn('⚠️ No Anthropic API key, skipping campaign summary generation')
    return null
  }

  // Extract key information from blueprint
  const campaignGoal = sessionData.campaign_goal || blueprint.part1_strategicFoundation?.campaignGoal || 'Campaign Goal'
  const industry = organizationContext.industry || 'Technology'
  const organizationName = organizationContext.name || 'Organization'

  // Extract stakeholders
  const stakeholders = blueprint.part1_strategicFoundation?.targetStakeholders?.map((s: any) => s.name) || []

  // Extract research insights
  const researchInsights = sessionData.research_findings?.keyInsights || []

  // Extract phase objectives and narratives
  const phases = ['phase1_awareness', 'phase2_consideration', 'phase3_conversion', 'phase4_advocacy']
  const phaseData = phases.map(phaseKey => {
    const phase = blueprint.part3_tacticalOrchestration?.[phaseKey]
    if (!phase) return null
    return {
      phase: phaseKey.split('_')[1],
      objective: phase.objective || '',
      narrative: phase.convergencePoint || phase.narrative || '',
      keyMessages: phase.keyMessages || []
    }
  }).filter(Boolean)

  const summaryPrompt = `You are a senior strategic campaign consultant. Analyze this campaign blueprint and create a concise, strategically-rich campaign summary that will serve as the "one source of truth" for content generation.

BLUEPRINT DATA:

**Campaign Goal:** ${campaignGoal}

**Organization:** ${organizationName}
**Industry:** ${industry}
**Positioning:** ${positioning}

**Target Stakeholders:** ${stakeholders.join(', ')}

**Research Insights:**
${researchInsights.slice(0, 5).map((insight: string) => `- ${insight}`).join('\n')}

**Phase Details:**
${phaseData.map((p: any) => `
**${p.phase.toUpperCase()} Phase:**
- Objective: ${p.objective}
- Narrative: ${p.narrative}
- Key Messages: ${p.keyMessages.slice(0, 3).join('; ')}
`).join('\n')}

YOUR TASK:

Create a campaign summary with the following structure (return ONLY valid JSON):

{
  "campaignGoal": "One-sentence campaign goal",
  "organizationName": "${organizationName}",
  "industry": "${industry}",
  "positioning": "Brief positioning statement (1-2 sentences)",
  "coreNarrative": "The overarching campaign narrative that connects all phases (2-3 sentences max, strategically rich)",
  "keyMessages": ["3-5 key messages that should appear across all content"],
  "researchInsights": ["Top 3-5 most compelling research insights"],
  "stakeholders": ["List of stakeholder groups"],
  "phases": [
    {
      "phase": "awareness",
      "phaseNumber": 1,
      "objective": "Phase-specific objective",
      "narrative": "Phase-specific narrative (1-2 sentences)",
      "keyMessages": ["2-3 phase-specific key messages"]
    }
    // ... repeat for each phase
  ]
}

**REQUIREMENTS:**
1. Be concise but strategically rich - every word should add value
2. The coreNarrative should be compelling and distinctive, not generic
3. Extract only the MOST important research insights (max 5)
4. Key messages should be specific, differentiated, and actionable
5. Avoid tech clichés like "revolutionary," "game-changing," "disrupting," etc.
6. Return ONLY the JSON object, nothing else`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        temperature: 0.7,
        messages: [{
          role: 'user',
          content: summaryPrompt
        }]
      })
    })

    if (!response.ok) {
      console.error('❌ Failed to generate campaign summary:', response.status)
      return null
    }

    const data = await response.json()
    const summaryText = data.content[0].text.trim()

    // Parse JSON from response
    const jsonMatch = summaryText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('❌ No JSON found in campaign summary response')
      return null
    }

    const campaignSummary = JSON.parse(jsonMatch[0])

    console.log('✅ Campaign summary generated successfully')
    console.log(`   Core Narrative: ${campaignSummary.coreNarrative?.substring(0, 100)}...`)
    console.log(`   Key Messages: ${campaignSummary.keyMessages?.length || 0}`)
    console.log(`   Phases: ${campaignSummary.phases?.length || 0}`)

    return campaignSummary
  } catch (error) {
    console.error('❌ Error generating campaign summary:', error)
    return null
  }
}

// NEW: Save organized campaign to strategic_campaigns table
async function saveToStrategicCampaigns(
  supabase: any,
  sessionId: string,
  blueprintId: string,
  blueprint: any,
  sessionData: any,
  campaignSummary: any,
  phaseCampaigns: any[],
  phaseResults: any[],
  allGeneratedContent: any[],
  organizationContext: any,
  positioning: string,
  campaignFolder: string
) {
  console.log('💎 Saving to strategic_campaigns table...')

  const campaignName = sessionData.campaign_goal?.substring(0, 100) || 'Campaign'

  // Get org UUID (not name)
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', organizationContext.name)
    .maybeSingle()

  if (!org) {
    console.warn('⚠️ Organization not found, skipping strategic_campaigns save')
    return
  }

  // Build organized phase data
  const phases = phaseCampaigns.map((pc, idx) => {
    const phaseResult = phaseResults[idx]
    const phaseContent = allGeneratedContent
      .filter(c => c.phase === pc.phase)
      .map(c => ({
        id: crypto.randomUUID(),
        type: c.type,
        stakeholder: c.stakeholder,
        brief: c.brief || '',
        content: c.content,
        status: 'draft',
        folder: phaseResult?.folder || '',
        generatedAt: new Date().toISOString()
      }))

    return {
      phase: pc.phase,
      phaseNumber: pc.phaseNumber,
      startDate: new Date(Date.now() + (idx * 21 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
      endDate: new Date(Date.now() + ((idx + 1) * 21 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
      status: idx === 0 ? 'in-progress' : 'planned',
      objective: pc.objective,
      narrative: pc.narrative,
      keyMessages: pc.keyMessages,
      content: phaseContent
    }
  })

  const { error } = await supabase.from('strategic_campaigns').insert({
    organization_id: org.id,
    blueprint_id: sessionId,
    campaign_name: campaignName,
    campaign_goal: sessionData.campaign_goal,
    industry: organizationContext.industry,
    positioning: positioning,
    core_narrative: campaignSummary?.coreNarrative || '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + (12 * 7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
    blueprint: blueprint,
    phases: phases,
    campaign_summary: campaignSummary,
    research_insights: campaignSummary?.researchInsights || [],
    key_messages: campaignSummary?.keyMessages || [],
    target_stakeholders: blueprint.part1_strategicFoundation?.targetStakeholders?.map((s: any) => s.name) || [],
    architecture: 'VECTOR_CAMPAIGN',
    status: 'in-progress',
    total_content_pieces: allGeneratedContent.length,
    phases_completed: 0
  })

  if (error) {
    console.error('❌ Failed to save to strategic_campaigns:', error)
  } else {
    console.log('✅ Saved to strategic_campaigns table')
  }
}

async function generateContentPiece(
  supabase: any,
  blueprintId: string,
  blueprint: any,
  piece: ContentPieceRequest,
  campaignType: string,
  organizationContext: any
): Promise<any> {
  console.log(`Generating: ${piece.type} (${piece.id})`)

  // Build context for content generation
  const context = buildGenerationContext(blueprint, piece, campaignType, organizationContext)

  // Call content generator
  const contentRequest = buildContentRequest(piece, context)
  const requestBody = {
    message: contentRequest,  // niv-content-intelligent-v2 expects 'message', not 'userRequest'
    organizationContext: {
      organizationId: organizationContext.name,
      organizationName: organizationContext.name,
      conversationId: `${blueprintId}-${piece.id}`
    },
    stage: 'full',
    campaignContext: {
      blueprintId,
      campaignType,
      phase: piece.phase,
      stakeholder: piece.targetStakeholder
    }
  }

  console.log(`  📝 Request preview (first 300 chars): ${contentRequest.substring(0, 300)}...`)

  const response = await fetch(
    `${Deno.env.get('SUPABASE_URL')}/functions/v1/niv-content-intelligent-v2`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify(requestBody)
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`❌ Content generation failed for ${piece.id}`)
    console.error(`   Status: ${response.status}`)
    console.error(`   Error response: ${errorText.substring(0, 500)}`)
    throw new Error(`Failed to generate ${piece.type}: ${response.status} - ${errorText}`)
  }

  const contentData = await response.json()

  return {
    id: piece.id,
    type: piece.type,
    targetStakeholder: piece.targetStakeholder,
    phase: piece.phase,
    content: contentData.response || contentData.content || '',
    metadata: {
      specs: piece.specs,
      priority: piece.priority,
      // Include social media attribution if present
      ...(piece.platform && { platform: piece.platform }),
      ...(piece.postOwner && { postOwner: piece.postOwner }),
      ...(piece.postFormat && { postFormat: piece.postFormat })
    },
    generationContext: context
  }
}

async function regenerateContentPiece(
  supabase: any,
  blueprintId: string,
  blueprint: any,
  pieceId: string,
  feedback: string,
  organizationContext: any
): Promise<any> {
  console.log(`Regenerating: ${pieceId} with feedback: ${feedback.substring(0, 50)}...`)

  // Load existing content
  const { data: existing } = await supabase
    .from('campaign_content')
    .select('*')
    .eq('id', pieceId)
    .single()

  if (!existing) {
    throw new Error('Content piece not found')
  }

  // Regenerate with feedback
  const response = await fetch(
    `${Deno.env.get('SUPABASE_URL')}/functions/v1/niv-content-intelligent-v2`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify({
        message: `Revise this ${existing.content_type}: ${existing.content_data}\n\nFeedback: ${feedback}`,
        organizationContext: {
          organizationId: organizationContext.name,
          organizationName: organizationContext.name,
          conversationId: `${blueprintId}-${pieceId}`
        },
        stage: 'full'
      })
    }
  )

  const contentData = await response.json()

  // Update in database
  await supabase
    .from('campaign_content')
    .update({
      content_data: contentData.response || contentData.content,
      updated_at: new Date().toISOString()
    })
    .eq('id', pieceId)

  return {
    id: pieceId,
    content: contentData.response || contentData.content,
    updated: true
  }
}

function buildGenerationContext(
  blueprint: any,
  piece: ContentPieceRequest,
  campaignType: string,
  organizationContext: any
): any {
  // Get research data from session (passed through from executor)
  const research = (blueprint as any).research_data || {}

  const context: any = {
    organization: organizationContext,
    campaignGoal: blueprint.part1_strategicFoundation?.campaignGoal ||
                  blueprint.overview?.objective ||
                  blueprint.part1_goalFramework?.primaryObjective,
    positioning: blueprint.part1_strategicFoundation?.positioning || blueprint.positioning,
    research: research,  // Include research findings
    specs: piece.specs
  }

  if (campaignType === 'VECTOR_CAMPAIGN') {
    // V3 VECTOR context
    if (blueprint.part1_strategicFoundation?.targetStakeholders) {
      const stakeholder = blueprint.part1_strategicFoundation.targetStakeholders.find(
        (s: any) => s.name === piece.targetStakeholder
      )
      if (stakeholder) {
        context.stakeholderProfile = stakeholder
      }
    }

    // Add psychological influence strategies if available
    if (piece.targetStakeholder && blueprint.part2_psychologicalInfluence?.influenceStrategies) {
      const influenceStrategy = blueprint.part2_psychologicalInfluence.influenceStrategies.find(
        (s: any) => s.stakeholder === piece.targetStakeholder
      )
      if (influenceStrategy) {
        context.psychologicalStrategy = influenceStrategy
      }
    }

    // Add phase-specific tactical context
    if (piece.phase && blueprint.part3_tacticalOrchestration) {
      const phaseKey = `phase${getPhaseNumber(piece.phase)}_${piece.phase.toLowerCase()}`
      const phaseData = blueprint.part3_tacticalOrchestration[phaseKey]
      if (phaseData) {
        context.phaseStrategy = phaseData
      }
    }

    // FALLBACK: Support old structures
    if (piece.targetStakeholder && blueprint.part2_stakeholderMapping?.groups) {
      const stakeholder = blueprint.part2_stakeholderMapping.groups.find(
        (g: any) => g.name === piece.targetStakeholder
      )
      if (stakeholder) {
        context.stakeholderProfile = stakeholder
      }
    }

    if (piece.phase && blueprint.part3_sequentialStrategy) {
      const phaseKey = `phase${getPhaseNumber(piece.phase)}_${piece.phase}`
      const phaseData = blueprint.part3_sequentialStrategy[phaseKey]
      if (phaseData) {
        context.phaseStrategy = phaseData
      }
    }
  } else if (campaignType === 'PR_CAMPAIGN') {
    // Add PR context
    context.keyMessages = blueprint.keyMessages
    context.spokespersonPositioning = blueprint.spokespersonPositioning
  }

  return context
}

function getPhaseNumber(phase: string): number {
  const phaseMap: any = {
    'awareness': 1,
    'consideration': 2,
    'conversion': 3,
    'advocacy': 4
  }
  return phaseMap[phase] || 1
}

function buildContentRequest(piece: ContentPieceRequest, context: any): string {
  // Get current date for temporal context
  const currentDate = new Date().toISOString().split('T')[0]

  let request = `**CURRENT DATE:** ${currentDate}

Generate a ${piece.type}`

  if (piece.targetStakeholder) {
    request += ` for ${piece.targetStakeholder}`
  }

  if (piece.phase) {
    request += ` (${piece.phase} phase)`
  }

  // Add social media attribution if present
  if (piece.platform || piece.postOwner || piece.postFormat) {
    request += `\n\n🎯 Social Media Attribution:`
    if (piece.platform) request += `\n- Platform: ${piece.platform}`
    if (piece.postOwner) request += `\n- Post Owner: ${piece.postOwner} (the person/account who will post this)`
    if (piece.postFormat) request += `\n- Format: ${piece.postFormat}`
    request += `\n\nIMPORTANT: Tailor the content for ${piece.platform || 'social media'} with appropriate voice for ${piece.postOwner || 'the poster'}.`
  }

  request += `\n\n## Campaign Context\n`
  request += `Organization: ${context.organization.name}\n`
  request += `Industry: ${context.organization.industry}\n`
  request += `Campaign Goal: ${context.campaignGoal}`

  // Add positioning if available
  if (context.positioning) {
    request += `\nPositioning: ${context.positioning.name || context.positioning}`
  }

  // Add stakeholder profile with more detail
  if (context.stakeholderProfile) {
    request += `\n\n## Target Stakeholder: ${piece.targetStakeholder}`
    if (context.stakeholderProfile.psychologicalProfile?.values) {
      request += `\n- Core Values: ${context.stakeholderProfile.psychologicalProfile.values.join(', ')}`
    }
    if (context.stakeholderProfile.currentPerception) {
      request += `\n- Current Perception: ${context.stakeholderProfile.currentPerception}`
    }
    if (context.stakeholderProfile.targetPerception) {
      request += `\n- Target Perception Shift: ${context.stakeholderProfile.targetPerception}`
    }
  }

  // Add phase strategy with more context
  if (context.phaseStrategy) {
    request += `\n\n## ${piece.phase?.toUpperCase()} Phase Strategy`
    if (context.phaseStrategy.objective) {
      request += `\n- Objective: ${context.phaseStrategy.objective}`
    }
    if (context.phaseStrategy.convergencePoint) {
      request += `\n- Narrative Convergence: ${context.phaseStrategy.convergencePoint}`
    }
    if (context.phaseStrategy.keyMessages) {
      request += `\n- Phase Messages: ${context.phaseStrategy.keyMessages.join('; ')}`
    }
  }

  // Add psychological influence strategy if available
  if (context.psychologicalStrategy) {
    request += `\n\n## Psychological Influence Strategy`
    if (context.psychologicalStrategy.triggers) {
      request += `\n- Psychological Triggers: ${context.psychologicalStrategy.triggers.join(', ')}`
    }
    if (context.psychologicalStrategy.technique) {
      request += `\n- Influence Technique: ${context.psychologicalStrategy.technique}`
    }
  }

  // Add research synthesis if available
  if (context.research) {
    request += `\n\n## Research Insights`
    if (context.research.keyInsights) {
      request += `\n- Key Market Insights: ${context.research.keyInsights.slice(0, 3).join('; ')}`
    }
  }

  // Add key messages
  if (context.keyMessages) {
    request += `\n\n## Key Messages`
    request += `\n- Primary: ${context.keyMessages.primary}`
    if (context.keyMessages.supporting) {
      request += `\n- Supporting: ${context.keyMessages.supporting.join(', ')}`
    }
  }

  // Content specifications
  request += `\n\n## Content Specifications`
  request += `\nFormat: ${piece.specs.format}`
  request += `\nLength: ${piece.specs.length}`
  request += `\nTone: ${piece.specs.tone}`

  if (piece.specs.keyElements.length > 0) {
    request += `\nKey Elements to Include: ${piece.specs.keyElements.join(', ')}`
  }

  // Add action description if available from piece metadata
  if (piece.description) {
    request += `\n\n## Content Purpose\n${piece.description}`
  }

  return request
}

async function saveGeneratedContent(
  supabase: any,
  blueprintId: string,
  orgId: string,
  generatedContent: any[]
): Promise<any[]> {
  console.log('💾 Saving generated content to database...')
  console.log(`   Pieces to save: ${generatedContent.length}`)
  console.log(`   Blueprint ID: ${blueprintId}`)
  console.log(`   Org ID: ${orgId} (type: ${typeof orgId})`)

  const records = generatedContent.map(content => ({
    blueprint_id: blueprintId,
    org_id: parseInt(orgId), // Convert to number
    content_type: content.type,
    target_stakeholder: content.targetStakeholder,
    phase: content.phase,
    content_data: content.content,
    metadata: content.metadata,
    generation_context: content.generationContext,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }))

  console.log(`   First record preview:`, JSON.stringify(records[0]).substring(0, 300))

  const { data, error } = await supabase
    .from('campaign_content')
    .insert(records)
    .select()

  if (error) {
    console.error('❌ Failed to save content to campaign_content table')
    console.error('   Error code:', error.code)
    console.error('   Error message:', error.message)
    console.error('   Error details:', error.details)
    console.error('   Error hint:', error.hint)
    throw new Error(`Failed to save generated content: ${error.message}`)
  }

  console.log(`✅ Successfully saved ${data.length} pieces to campaign_content table`)

  // Save to Memory Vault for each content piece
  for (const content of generatedContent) {
    try {
      await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/niv-campaign-memory?action=save-content`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify({
            orgId,
            blueprintId,
            contentType: content.type,
            type: content.type,
            title: `${content.type} - ${content.targetStakeholder || 'General'}`,
            content: content.content,
            targetStakeholder: content.targetStakeholder,
            phase: content.phase,
            generationContext: content.generationContext,
            campaignType: content.generationContext?.campaignType
          })
        }
      )
      console.log(`✨ Content saved to Memory Vault: ${content.type}`)
    } catch (memoryError) {
      console.error('Memory Vault save failed (non-critical):', memoryError)
    }
  }

  return data
}
