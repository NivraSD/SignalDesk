'use client'

import React, { useState, useEffect } from 'react'
import {
  Target,
  ChevronDown,
  ChevronRight,
  BarChart3,
  AlertCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { ContentViewerModal } from '@/components/execution/ContentViewerModal'
import { buildGenerationContext } from '@/lib/memoryVaultIntegration'
import { BlueprintV3Presentation } from '@/components/campaign-builder/BlueprintV3Presentation'
import { PRBriefPresentation } from '@/components/campaign-builder/PRBriefPresentation'
import { GeoVectorBlueprintPresentation } from '@/components/campaign-builder/GeoVectorBlueprintPresentation'
import { useAppStore } from '@/stores/useAppStore'

interface BlueprintData {
  overview?: {
    campaignName?: string
    pattern?: string
    duration?: string
  }
  part1_goalFramework?: {
    primaryObjective?: string
    behavioralGoals?: any[]
  }
  part3_stakeholderOrchestration?: {
    stakeholderOrchestrationPlans?: StakeholderOrchestrationPlan[]
  }
  // PR Campaign fields
  contentRequirements?: any[]
  campaignGoal?: string
  targetMedia?: any
  messaging?: any
}

interface StakeholderOrchestrationPlan {
  stakeholder?: {
    name: string
    priority: number
    psychologicalProfile?: any
  }
  influenceLevers?: InfluenceLever[]
}

interface InfluenceLever {
  leverName: string
  leverType: string
  priority: number
  objective: string
  campaign?: {
    mediaPitches?: any[]
    socialPosts?: any[]
    thoughtLeadership?: any[]
    additionalTactics?: any[]
  }
}

interface ContentItem {
  id: string
  type: 'media_pitch' | 'social_post' | 'thought_leadership' | 'user_action' | 'press_release' | 'geo_schema_update'
  stakeholder: string
  stakeholderPriority: number
  leverName: string
  leverPriority: number
  topic: string
  target?: string
  details: any
  status: 'pending' | 'generating' | 'generated' | 'published' | 'failed' | 'executing'
  generatedContent?: string
  generationError?: string
  generatedAt?: Date
  // Execution tracking
  executed?: boolean
  executedAt?: Date
  result?: {
    type: 'media_response' | 'engagement' | 'pickup' | 'other'
    value?: string | number
    notes?: string
  }
}

interface StrategicPlanningModuleV3Props {
  blueprint: BlueprintData
  sessionId: string
  orgId: string
}

type ViewMode = 'execution' | 'blueprint' | 'progress'

export default function StrategicPlanningModuleV3Complete({
  blueprint: initialBlueprint,
  sessionId: initialSessionId,
  orgId: initialOrgId
}: StrategicPlanningModuleV3Props) {
  const { organization } = useAppStore()
  const [viewMode, setViewMode] = useState<ViewMode>('execution')
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [expandedPriorities, setExpandedPriorities] = useState<Set<number>>(new Set([1]))
  const [expandedStakeholders, setExpandedStakeholders] = useState<Set<string>>(new Set())
  const [generating, setGenerating] = useState<Set<string>>(new Set())
  const [viewingItem, setViewingItem] = useState<ContentItem | null>(null)
  const [editingResultFor, setEditingResultFor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Support for multiple campaigns
  const [availableCampaigns, setAvailableCampaigns] = useState<any[]>([])
  const [currentSessionId, setCurrentSessionId] = useState(initialSessionId)
  const [currentBlueprint, setCurrentBlueprint] = useState(initialBlueprint)
  const [currentOrgId, setCurrentOrgId] = useState(initialOrgId)

  // Use current values (may be different from initial if user switched campaigns)
  const sessionId = currentSessionId
  const blueprint = currentBlueprint
  const orgId = currentOrgId

  // Update orgId when organization changes in global store
  // BUT: Don't auto-switch if we just loaded from Campaign Builder with a specific orgId
  useEffect(() => {
    if (organization?.id && organization.id !== currentOrgId) {
      // Only auto-switch if this looks like a user-initiated org change (not initial load)
      // Check if we have existing content - if so, this is a real switch
      if (contentItems.length > 0) {
        console.log(`🔄 Strategic Planning: Organization changed from ${currentOrgId} to ${organization.id}, clearing and reloading`)
        setCurrentOrgId(organization.id)

        // Clear all campaign-specific state
        setCurrentBlueprint(null as any)
        setCurrentSessionId('')
        setContentItems([])
        setAvailableCampaigns([])
        setError(null)
        setLoading(false)
        setViewMode('execution')
        setExpandedPriorities(new Set([1]))
        setExpandedStakeholders(new Set())
        setGenerating(new Set())
        setViewingItem(null)
        setEditingResultFor(null)

        // Will trigger campaign reload via the existing useEffect on currentOrgId
      } else {
        console.log(`ℹ️ Strategic Planning: Organization in store (${organization.id}) differs from campaign org (${currentOrgId}), but no content loaded yet - using campaign org`)
      }
    }
  }, [organization?.id, contentItems.length])

  // Load available campaigns on mount and when orgId changes
  useEffect(() => {
    loadAvailableCampaigns()
  }, [currentOrgId])

  const loadAvailableCampaigns = async () => {
    const { data, error } = await supabase
      .from('campaign_builder_sessions')
      .select('id, campaign_goal, created_at, blueprint')
      .eq('org_id', currentOrgId)
      .not('blueprint', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10)

    if (!error && data) {
      setAvailableCampaigns(data)
    }
  }

  const handleCampaignSwitch = async (newSessionId: string) => {
    const campaign = availableCampaigns.find(c => c.id === newSessionId)
    if (campaign) {
      setCurrentSessionId(newSessionId)
      setCurrentBlueprint(campaign.blueprint)
      // OrgId stays the same
    }
  }

  // Load items from database or parse blueprint
  // Reload whenever sessionId changes or component mounts
  // NOTE: We don't include blueprint in dependencies to prevent duplicate initialization
  useEffect(() => {
    console.log('📋 Loading execution items for session:', sessionId)
    setLoading(true)
    setError(null)
    loadOrInitializeItems()
  }, [sessionId])

  const loadOrInitializeItems = async () => {
    // Try to load existing items from strategic_planning_items table
    const { data: existingItems, error: loadError } = await supabase
      .from('strategic_planning_items')
      .select('*')
      .eq('session_id', sessionId)
      .eq('organization_id', orgId)

    if (loadError) {
      console.error('Error loading items:', loadError)
      setError('Failed to load execution items')
      setLoading(false)
      return
    }

    if (existingItems && existingItems.length > 0) {
      console.log(`📋 Loaded ${existingItems.length} existing items from database`)
      // Convert database items to ContentItem format
      const items = existingItems.map(dbItem => ({
        id: dbItem.id,
        type: dbItem.content_type as ContentItem['type'],
        stakeholder: dbItem.stakeholder,
        stakeholderPriority: dbItem.stakeholder_priority,
        leverName: dbItem.lever_name,
        leverPriority: dbItem.lever_priority,
        topic: dbItem.title,
        target: dbItem.target_audience,
        details: dbItem.details,
        status: dbItem.status as ContentItem['status'],
        generatedContent: dbItem.generated_content,
        generationError: dbItem.generation_error,
        generatedAt: dbItem.generated_at ? new Date(dbItem.generated_at) : undefined,
        executed: dbItem.executed || false,
        executedAt: dbItem.executed_at ? new Date(dbItem.executed_at) : undefined,
        result: dbItem.execution_result
      }))
      setContentItems(items)
      setLoading(false)
    } else {
      // Parse blueprint and save to database
      await initializeItemsFromBlueprint()
    }
  }

  const initializeItemsFromBlueprint = async () => {
    // Guard against null blueprint
    if (!blueprint) {
      console.log('⚠️ Blueprint is null, cannot initialize items')
      setLoading(false)
      return
    }

    const items = parseBlueprint(blueprint)

    // Save all items to strategic_planning_items table immediately
    // This ensures persistence across page reloads/crashes
    console.log(`💾 Saving ${items.length} items to strategic_planning_items table...`)

    const dbItems = items.map(item => ({
      session_id: sessionId,
      organization_id: orgId,
      campaign_type: campaignType,
      content_type: item.type,
      title: item.topic,
      description: item.details?.what || item.details?.description || '',
      stakeholder: item.stakeholder,
      stakeholder_priority: item.stakeholderPriority,
      lever_name: item.leverName,
      lever_priority: item.leverPriority,
      target_audience: item.target,
      status: 'pending',
      details: item.details,
      metadata: {}
    }))

    const { error: insertError } = await supabase
      .from('strategic_planning_items')
      .insert(dbItems)

    if (insertError) {
      console.error('❌ Failed to save items:', insertError)
      setError('Failed to save execution items')
      setLoading(false)
      return
    }

    console.log(`✅ Saved ${items.length} items to strategic_planning_items table`)

    setContentItems(items)
    setLoading(false)
  }

  // Helper function to update item in database
  const updateItemInDatabase = async (itemId: string, updates: any) => {
    const { error } = await supabase
      .from('strategic_planning_items')
      .update(updates)
      .eq('id', itemId)

    if (error) {
      console.error('Failed to update item in database:', error)
    }
  }

  const parseBlueprint = (blueprint: BlueprintData | null): ContentItem[] => {
    if (!blueprint) {
      console.log('⚠️ parseBlueprint: blueprint is null')
      return []
    }

    console.log('📊 parseBlueprint: blueprint structure:', {
      hasPart3: !!blueprint.part3_stakeholderOrchestration,
      hasContentRequirements: !!blueprint.contentRequirements,
      hasGeoIntelligence: !!(blueprint as any).geoIntelligence,
      keys: Object.keys(blueprint)
    })

    const items: ContentItem[] = []

    // NOTE: Old GEO-VECTOR structure (threeTierTacticalPlan) is deprecated
    // GEO-VECTOR now uses VECTOR structure (part3_stakeholderOrchestration) with GEO augmentation
    // The VECTOR parsing logic below handles both VECTOR and GEO-VECTOR campaigns

    // Check if this is a PR campaign (has contentRequirements)
    if (blueprint.contentRequirements && Array.isArray(blueprint.contentRequirements)) {
      console.log('✓ Parsing PR campaign blueprint with contentRequirements')
      blueprint.contentRequirements.forEach((req: any, index: number) => {
        items.push({
          id: crypto.randomUUID(),
          type: req.type === 'press-release' ? 'press_release' :
                req.type === 'media-pitch' ? 'media_pitch' :
                req.type === 'social-post' ? 'social_post' :
                req.type === 'qa-document' ? 'user_action' :
                req.type === 'talking-points' ? 'user_action' : 'content',
          stakeholder: req.targetAudience || 'General Audience',
          stakeholderPriority: req.priority === 'high' ? 1 : req.priority === 'medium' ? 2 : 3,
          leverName: req.purpose || 'PR Campaign',
          leverPriority: req.priority === 'high' ? 1 : req.priority === 'medium' ? 2 : 3,
          topic: req.type.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          target: req.type === 'social-post' && req.specifications?.platform
            ? `${req.targetAudience} on ${req.specifications.platform}`
            : req.targetAudience,
          details: {
            purpose: req.purpose,
            keyPoints: req.keyPoints,
            specifications: req.specifications,
            priority: req.priority,
            platform: req.specifications?.platform, // Extract platform for social posts
            format: req.specifications?.format,
            tone: req.specifications?.tone
          },
          status: 'pending'
        })
      })
      return items
    }

    // VECTOR campaign parsing (original logic)
    const plans = blueprint.part3_stakeholderOrchestration?.stakeholderOrchestrationPlans || []

    console.log('✓ Parsing VECTOR/GEO-VECTOR campaign:', {
      planCount: plans.length,
      hasGeoIntelligence: !!(blueprint as any).geoIntelligence
    })

    plans.forEach(plan => {
      const stakeholderName = plan.stakeholder?.name || 'Unknown Stakeholder'
      const stakeholderPriority = plan.stakeholder?.priority || 4

      plan.influenceLevers?.forEach(lever => {
        const campaign = lever.campaign

        // Media Pitches
        campaign?.mediaPitches?.forEach((pitch, index) => {
          items.push({
            id: crypto.randomUUID(),
            type: 'media_pitch',
            stakeholder: stakeholderName,
            stakeholderPriority,
            leverName: lever.leverName,
            leverPriority: lever.priority,
            topic: pitch.what,
            target: `${pitch.who} (${pitch.outlet})`,
            details: pitch,
            status: 'pending'
          })
        })

        // Social Posts
        campaign?.socialPosts?.forEach((post, index) => {
          items.push({
            id: crypto.randomUUID(),
            type: 'social_post',
            stakeholder: stakeholderName,
            stakeholderPriority,
            leverName: lever.leverName,
            leverPriority: lever.priority,
            topic: post.what,
            target: `${post.who} on ${post.platform}`,
            details: post,
            status: 'pending'
          })
        })

        // Thought Leadership
        campaign?.thoughtLeadership?.forEach((article, index) => {
          items.push({
            id: crypto.randomUUID(),
            type: 'thought_leadership',
            stakeholder: stakeholderName,
            stakeholderPriority,
            leverName: lever.leverName,
            leverPriority: lever.priority,
            topic: article.what,
            target: `${article.who} in ${article.where}`,
            details: article,
            status: 'pending'
          })
        })

        // Additional Tactics
        campaign?.additionalTactics?.forEach((tactic, index) => {
          items.push({
            id: crypto.randomUUID(),
            type: tactic.type === 'geo_schema_update' ? 'geo_schema_update' : 'user_action',
            stakeholder: stakeholderName,
            stakeholderPriority,
            leverName: lever.leverName,
            leverPriority: lever.priority,
            topic: tactic.what,
            target: `${tactic.who} at ${tactic.where}`,
            details: tactic,
            status: 'pending'
          })
        })
      })
    })

    // GEO-VECTOR AUGMENTATION: Parse schema opportunities and content recommendations
    const geoIntelligence = (blueprint as any).geoIntelligence
    if (geoIntelligence?.synthesis) {
      console.log('✅ Parsing GEO intelligence:', {
        schemaOpportunities: geoIntelligence.synthesis.schemaOpportunities?.length || 0,
        contentRecommendations: geoIntelligence.synthesis.contentRecommendations?.length || 0
      })

      // Add Schema Opportunities as executable tactics
      geoIntelligence.synthesis.schemaOpportunities?.forEach((schema: any) => {
        const schemaPriority = schema.priority || 1
        items.push({
          id: crypto.randomUUID(),
          type: 'geo_schema_update',
          stakeholder: 'AI Platforms',
          stakeholderPriority: schemaPriority, // Use schema priority for proper folder organization
          leverName: 'GEO: AI Query Ownership',
          leverPriority: schemaPriority,
          topic: schema.title || `${schema.schemaType} Schema`,
          target: schema.query || 'Target AI queries',
          details: {
            schemaType: schema.schemaType,
            implementation: schema.implementation,
            expectedImpact: schema.expectedImpact,
            query: schema.query,
            autoExecutable: schema.autoExecutable !== false,
            description: schema.description,
            priority: schema.priority || 1,
            schemaData: schema
          },
          status: 'pending'
        })
      })

      // Add Content Recommendations as content creation tactics
      geoIntelligence.synthesis.contentRecommendations?.forEach((content: any) => {
        // Map content type to tactical type
        let tacticalType: ContentItem['type'] = 'thought_leadership'
        if (content.contentType === 'blog_post') tacticalType = 'thought_leadership'
        else if (content.contentType === 'case_study') tacticalType = 'thought_leadership'
        else if (content.contentType === 'whitepaper') tacticalType = 'thought_leadership'
        else if (content.contentType === 'press_release') tacticalType = 'press_release'
        else if (content.tacticalMapping?.toLowerCase().includes('media')) tacticalType = 'media_pitch'
        else if (content.tacticalMapping?.toLowerCase().includes('social')) tacticalType = 'social_post'

        const contentPriority = content.priority || 2
        items.push({
          id: crypto.randomUUID(),
          type: tacticalType,
          stakeholder: 'AI Platforms',
          stakeholderPriority: contentPriority, // Use content priority for proper folder organization
          leverName: 'GEO: AI Query Ownership',
          leverPriority: contentPriority,
          topic: content.title || content.description,
          target: content.targetQueries?.join(', ') || 'AI visibility',
          details: {
            contentType: content.contentType,
            keyPoints: content.keyPoints,
            targetQueries: content.targetQueries,
            expectedImpact: content.expectedImpact,
            tacticalMapping: content.tacticalMapping,
            description: content.description,
            priority: content.priority || 2
          },
          status: 'pending'
        })
      })

      console.log('✅ GEO tactics added:', {
        totalItems: items.length,
        schemaItems: items.filter(i => i.type === 'geo_schema_update').length,
        geoContentItems: items.filter(i => i.stakeholder === 'AI Platforms' && i.type !== 'geo_schema_update').length
      })
    }

    return items
  }

  const mapContentTypeToNIV = (type: ContentItem['type']): string => {
    switch (type) {
      case 'media_pitch':
        return 'media_pitch'
      case 'social_post':
        return 'social_post'
      case 'thought_leadership':
        return 'thought_leadership'
      default:
        return 'content'
    }
  }

  const buildGenerationRequest = (item: ContentItem, context: any): string => {
    const { orgProfile, campaignContext } = context

    // Build extremely clear instructions for NIV
    let request = `# CONTENT GENERATION FROM APPROVED BLUEPRINT\n\n`

    request += `## YOUR TASK\n`
    request += `You are executing a content item from an approved campaign blueprint. This is NOT a planning discussion - the strategy has been finalized. Your job is to GENERATE the actual ${item.type.replace('_', ' ')} content immediately.\n\n`

    request += `## WHAT TO DO\n`
    request += `1. Read all the context below\n`
    request += `2. Generate the complete, production-ready ${item.type.replace('_', ' ')}\n`
    request += `3. Return ONLY the generated content - no templates, no meta-commentary, no "here's how I would approach this"\n\n`

    request += `## CONTENT SPECIFICATIONS\n`
    request += `- Content Type: ${item.type.replace('_', ' ')}\n`
    request += `- Target Stakeholder: ${item.stakeholder}\n`
    request += `- Topic: ${item.topic}\n`
    if (item.target) {
      request += `- Specific Target: ${item.target}\n`
    }
    request += `- Lever Priority: Priority ${item.leverPriority} (${item.leverPriority === 1 ? 'Fear Mitigation' : item.leverPriority === 2 ? 'Aspiration Activation' : item.leverPriority === 3 ? 'Social Proof' : 'Authority'})\n`
    request += `- Lever Name: ${item.leverName}\n\n`

    request += `## ORGANIZATION CONTEXT\n`
    request += `- Organization: ${orgProfile?.name || 'Unknown'}\n`
    request += `- Industry: ${orgProfile?.industry || 'Unknown'}\n\n`

    if (campaignContext?.campaignGoal) {
      request += `## CAMPAIGN GOAL\n${campaignContext.campaignGoal}\n\n`
    }

    // Add type-specific details and instructions
    if (item.type === 'media_pitch') {
      request += `## TARGET DETAILS\n`
      request += `- Journalist: ${item.details.who}\n`
      request += `- Outlet: ${item.details.outlet}\n`
      request += `- Beat: ${item.details.beat}\n\n`
      request += `## EXPECTED OUTPUT\n`
      request += `Write a complete, personalized media pitch email to ${item.details.who} at ${item.details.outlet}. Include:\n`
      request += `- Compelling subject line\n`
      request += `- Personalized opening that shows you know their work\n`
      request += `- Clear news hook related to the topic\n`
      request += `- Why this matters to their audience\n`
      request += `- Specific offer (interview, exclusive data, etc.)\n`
      request += `- Professional closing with call to action\n\n`
      request += `Write the ACTUAL pitch email, not a template. Be specific and compelling.\n`
    } else if (item.type === 'social_post') {
      request += `## TARGET DETAILS\n`
      request += `- Posted by: ${item.details.who}\n`
      request += `- Platform: ${item.details.platform}\n`
      if (item.details.keyMessages) {
        request += `- Key Points:\n${item.details.keyMessages.map((m: string) => `  - ${m}`).join('\n')}\n`
      }
      request += `\n## EXPECTED OUTPUT\n`
      request += `Write the complete social media post for ${item.details.platform}. Make it platform-appropriate, engaging, and authentic to ${item.details.who}'s voice.\n`
    } else if (item.type === 'thought_leadership') {
      request += `## TARGET DETAILS\n`
      request += `- Author: ${item.details.who}\n`
      request += `- Publication: ${item.details.where}\n`
      if (item.details.keyPoints) {
        request += `- Key Points:\n${item.details.keyPoints.map((p: string) => `  - ${p}`).join('\n')}\n`
      }
      request += `\n## EXPECTED OUTPUT\n`
      request += `Write the complete thought leadership article for ${item.details.where}. Include headline, compelling narrative, and professional conclusion.\n`
    }

    request += `\n---\n\n`
    request += `NOW GENERATE THE CONTENT. Do not ask questions. Do not provide a template. Write the actual, production-ready ${item.type.replace('_', ' ')}.\n`

    return request
  }

  const handleGenerate = async (item: ContentItem) => {
    setGenerating(prev => new Set(prev).add(item.id))
    setContentItems(prev => prev.map(i =>
      i.id === item.id ? { ...i, status: 'generating' as const } : i
    ))

    try {
      // Get context from MemoryVault
      const context = await buildGenerationContext(sessionId, orgId, item.type)

      // Build request
      const request = buildGenerationRequest(item, context)

      // Use campaign_generation stage for direct content generation
      console.log('📤 Calling NIV with campaign_generation mode')

      // Build campaignSummary from blueprint - handle both VECTOR and PR campaigns
      let campaignSummary: any

      // Check if this is a PR campaign (has contentRequirements field)
      if (blueprint.contentRequirements) {
        console.log('📰 Building campaign context from PR brief')
        campaignSummary = {
          organizationName: context.orgProfile?.name || blueprint.organization || 'Unknown',
          industry: context.orgProfile?.industry || blueprint.industry || 'Unknown',
          campaignGoal: blueprint.campaignGoal || '',
          positioning: blueprint.positioning || '',
          coreNarrative: blueprint.messaging?.core_narrative || '',
          keyMessages: blueprint.messaging?.key_messages || [],
          proofPoints: blueprint.messaging?.proof_points || [],
          hooks: blueprint.messaging?.hooks || [],
          targetMedia: blueprint.targetMedia || {},
          researchInsights: [
            ...(blueprint.researchInsights?.competitive_landscape || []),
            ...(blueprint.researchInsights?.narrative_opportunities || [])
          ],
          phases: [] // PR campaigns don't have phases
        }
      } else {
        // VECTOR campaign
        console.log('📊 Building campaign context from VECTOR blueprint')
        campaignSummary = {
          organizationName: context.orgProfile?.name || 'Unknown',
          industry: context.orgProfile?.industry || 'Unknown',
          campaignGoal: blueprint.part1_goalFramework?.primaryObjective || blueprint.part1_strategicFoundation?.campaignGoal || '',
          positioning: blueprint.messageArchitecture?.coreMessage || blueprint.part1_strategicFoundation?.positioning?.tagline || '',
          coreNarrative: blueprint.messageArchitecture?.messageRationale || blueprint.part1_strategicFoundation?.positioning?.description || '',
          keyMessages: blueprint.part2_stakeholderMapping?.segments?.find(
            (seg: any) => seg.stakeholder === item.stakeholder
          )?.keyMessagesForThisStakeholder || blueprint.part1_strategicFoundation?.positioning?.keyMessages || [],
          researchInsights: context.researchInsights || [],
          phases: [] // Could add phase-specific info if needed
        }
      }

      // Build content requirement based on NIV's expected structure
      let ownedContent = []
      let mediaContent = []

      if (item.type === 'media_pitch') {
        // Media pitch goes in media array with specific structure
        // For PR campaigns, we need to use targetMedia from the brief
        if (blueprint.contentRequirements && blueprint.targetMedia) {
          // PR Campaign: Extract from targetMedia tier1_outlets
          const tier1Outlets = blueprint.targetMedia.tier1_outlets || []
          mediaContent = [{
            type: 'media_pitch',
            story: item.details.purpose || item.topic,
            journalists: tier1Outlets.map((outlet: any) => outlet.journalist).filter(Boolean),
            outlets: tier1Outlets.map((outlet: any) => outlet.outlet).filter(Boolean),
            beats: tier1Outlets.map((outlet: any) => outlet.beat).filter(Boolean),
            pitch_angles: tier1Outlets.map((outlet: any) => outlet.pitch_angle).filter(Boolean),
            keyPoints: item.details.keyPoints || []
          }]
        } else {
          // VECTOR Campaign: Use item details
          mediaContent = [{
            type: 'media_pitch',
            story: item.topic,
            journalists: [item.details.who],
            outlet: item.details.outlet,
            beat: item.details.beat,
            keyPoints: item.details.keyMessages || []
          }]
        }
      } else if (item.type === 'social_post') {
        // Social post goes in owned array
        ownedContent = [{
          type: 'social_post',
          stakeholder: item.stakeholder,
          purpose: item.details.purpose || item.topic,
          keyPoints: item.details.keyPoints || item.details.keyMessages || [],
          platform: item.details.platform || item.details.specifications?.platform || 'LinkedIn',
          format: item.details.format || item.details.specifications?.format,
          tone: item.details.tone || item.details.specifications?.tone,
          who: item.details.who
        }]
      } else if (item.type === 'thought_leadership') {
        // Thought leadership goes in owned array
        ownedContent = [{
          type: 'thought_leadership',
          stakeholder: item.stakeholder,
          purpose: item.topic,
          keyPoints: item.details.keyPoints || [],
          who: item.details.who,
          where: item.details.where
        }]
      } else {
        // Default for other owned content
        ownedContent = [{
          type: item.type,
          stakeholder: item.stakeholder,
          purpose: item.topic,
          keyPoints: item.details.keyMessages || item.details.keyPoints || []
        }]
      }

      const { data: genData, error: genError } = await supabase.functions.invoke('niv-content-intelligent-v2', {
        body: {
          message: request,
          conversationHistory: [],
          organizationContext: {
            conversationId: `plan-${sessionId}`,
            organizationId: orgId,
            organizationName: context.orgProfile?.name || 'Unknown'
          },
          stage: 'campaign_generation',
          campaignContext: {
            campaignSummary: campaignSummary,
            phase: item.leverName,
            phaseNumber: item.leverPriority,
            objective: item.topic,
            narrative: campaignSummary.coreNarrative,
            keyMessages: campaignSummary.keyMessages,
            positioning: campaignSummary.positioning,
            targetStakeholders: [item.stakeholder],
            contentRequirements: {
              owned: ownedContent,
              media: mediaContent
            },
            researchInsights: campaignSummary.researchInsights,
            currentDate: new Date().toISOString().split('T')[0],
            campaignFolder: `campaign-${sessionId}`,
            blueprintId: sessionId
          }
        }
      })

      if (genError) throw genError

      console.log('📥 NIV campaign generation response:', genData)

      // Extract content from NIV's campaign generation response
      const generatedContent = genData?.generatedContent?.[0]?.content ||
                               genData?.content ||
                               genData?.allGeneratedContent?.[0]?.content ||
                               JSON.stringify(genData)

      // Update item
      const updatedItem = {
        ...item,
        status: 'generated' as const,
        generatedContent,
        generatedAt: new Date()
      }

      setContentItems(prev => prev.map(i =>
        i.id === item.id ? updatedItem : i
      ))

      // Update in strategic_planning_items table
      await updateItemInDatabase(item.id, {
        status: 'generated',
        generated_content: generatedContent,
        generated_at: new Date().toISOString()
      })

      console.log('✅ Content generated and saved to strategic_planning_items')

    } catch (error: any) {
      console.error('Generation error:', error)

      // Update database with failure
      await updateItemInDatabase(item.id, {
        status: 'failed',
        generation_error: error.message
      })

      setContentItems(prev => prev.map(i =>
        i.id === item.id
          ? { ...i, status: 'failed' as const, generationError: error.message }
          : i
      ))
    } finally {
      setGenerating(prev => {
        const newSet = new Set(prev)
        newSet.delete(item.id)
        return newSet
      })
    }
  }

  const handleBatchGenerate = async (items: ContentItem[]) => {
    // Filter to pending non-action items
    const itemsToGenerate = items.filter(
      item => item.status === 'pending' && item.type !== 'user_action'
    )

    // Mark all as generating
    setGenerating(prev => {
      const next = new Set(prev)
      itemsToGenerate.forEach(item => next.add(item.id))
      return next
    })
    setContentItems(prev => prev.map(i =>
      itemsToGenerate.find(gen => gen.id === i.id)
        ? { ...i, status: 'generating' as const }
        : i
    ))

    // Generate all in parallel
    const results = await Promise.allSettled(
      itemsToGenerate.map(async item => {
        try {
          const context = await buildGenerationContext(sessionId, orgId, item.type)
          const request = buildGenerationRequest(item, context)

          // Use campaign_generation stage for direct content generation
          // Build campaignSummary from blueprint - this is what NIV actually wants
          const campaignSummary = {
            organizationName: context.orgProfile?.name || 'Unknown',
            industry: context.orgProfile?.industry || 'Unknown',
            campaignGoal: blueprint.part1_goalFramework?.primaryObjective || blueprint.part1_strategicFoundation?.campaignGoal || '',
            positioning: blueprint.messageArchitecture?.coreMessage || blueprint.part1_strategicFoundation?.positioning?.tagline || '',
            coreNarrative: blueprint.messageArchitecture?.messageRationale || blueprint.part1_strategicFoundation?.positioning?.description || '',
            keyMessages: blueprint.part2_stakeholderMapping?.segments?.find(
              (seg: any) => seg.stakeholder === item.stakeholder
            )?.keyMessagesForThisStakeholder || blueprint.part1_strategicFoundation?.positioning?.keyMessages || [],
            researchInsights: context.researchInsights || [],
            phases: []
          }

          // Build content requirement based on NIV's expected structure
          let ownedContent = []
          let mediaContent = []

          if (item.type === 'media_pitch') {
            mediaContent = [{
              type: 'media_pitch',
              story: item.topic,
              journalists: [item.details.who],
              outlet: item.details.outlet,
              beat: item.details.beat,
              keyPoints: item.details.keyMessages || []
            }]
          } else if (item.type === 'social_post') {
            ownedContent = [{
              type: 'social_post',
              stakeholder: item.stakeholder,
              purpose: item.topic,
              keyPoints: item.details.keyMessages || [],
              platform: item.details.platform,
              who: item.details.who
            }]
          } else if (item.type === 'thought_leadership') {
            ownedContent = [{
              type: 'thought_leadership',
              stakeholder: item.stakeholder,
              purpose: item.topic,
              keyPoints: item.details.keyPoints || [],
              who: item.details.who,
              where: item.details.where
            }]
          } else {
            ownedContent = [{
              type: item.type,
              stakeholder: item.stakeholder,
              purpose: item.topic,
              keyPoints: item.details.keyMessages || item.details.keyPoints || []
            }]
          }

          const { data: genData, error: genError } = await supabase.functions.invoke('niv-content-intelligent-v2', {
            body: {
              message: request,
              conversationHistory: [],
              organizationContext: {
                conversationId: `plan-${sessionId}-batch`,
                organizationId: orgId,
                organizationName: context.orgProfile?.name || 'Unknown'
              },
              stage: 'campaign_generation',
              campaignContext: {
                campaignSummary: campaignSummary,
                phase: item.leverName,
                phaseNumber: item.leverPriority,
                objective: item.topic,
                narrative: campaignSummary.coreNarrative,
                keyMessages: campaignSummary.keyMessages,
                positioning: campaignSummary.positioning,
                targetStakeholders: [item.stakeholder],
                contentRequirements: {
                  owned: ownedContent,
                  media: mediaContent
                },
                researchInsights: campaignSummary.researchInsights,
                currentDate: new Date().toISOString().split('T')[0],
                campaignFolder: `campaign-${sessionId}`,
                blueprintId: sessionId
              }
            }
          })

          if (genError) throw genError

          const generatedContent = genData?.generatedContent?.[0]?.content ||
                                   genData?.content ||
                                   genData?.allGeneratedContent?.[0]?.content ||
                                   JSON.stringify(genData)

          // Update item with content
          setContentItems(prev => prev.map(i =>
            i.id === item.id
              ? { ...i, status: 'generated' as const, generatedContent, generatedAt: new Date() }
              : i
          ))

          // Get campaign name for folder structure
          const campaignName = blueprint?.overview?.campaignName || 'Untitled Campaign'

          // Upsert into content_library (handles both insert and update)
          await supabase
            .from('content_library')
            .upsert({
              id: item.id,
              session_id: sessionId,
              organization_id: orgId,
              content_type: item.type,
              title: item.topic,
              content: generatedContent,
              status: 'draft',
              folder: `Campaigns/${campaignName}/Priority ${item.stakeholderPriority}/${item.stakeholder}`,
              metadata: {
                stakeholder: item.stakeholder,
                stakeholder_priority: item.stakeholderPriority,
                lever_name: item.leverName,
                lever_priority: item.leverPriority,
                target: item.target,
                details: item.details
              },
              tags: ['campaign', `priority-${item.stakeholderPriority}`, item.stakeholder],
              intelligence_status: 'draft',
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            })

          return { item, success: true }
        } catch (error: any) {
          console.error('Generation error:', error)
          setContentItems(prev => prev.map(i =>
            i.id === item.id
              ? { ...i, status: 'failed' as const, generationError: error.message }
              : i
          ))
          return { item, success: false, error: error.message }
        } finally {
          setGenerating(prev => {
            const next = new Set(prev)
            next.delete(item.id)
            return next
          })
        }
      })
    )

    const succeeded = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length

    console.log(`✅ Batch generation complete: ${succeeded} succeeded, ${failed} failed`)
  }

  const handleUpdateContent = async (itemId: string, content: string) => {
    setContentItems(prev => prev.map(i =>
      i.id === itemId ? { ...i, generatedContent: content } : i
    ))

    await supabase
      .from('content_library')
      .update({ content })
      .eq('id', itemId)
  }

  const handlePublish = async (itemId: string) => {
    setContentItems(prev => prev.map(i =>
      i.id === itemId ? { ...i, status: 'published' as const } : i
    ))

    await supabase
      .from('content_library')
      .update({
        status: 'published'
      })
      .eq('id', itemId)

    setViewingItem(null)
  }

  const handleExecuteSchema = async (item: ContentItem) => {
    if (item.type !== 'geo_schema_update') return
    if (!organization) return

    console.log('⚡ Executing GEO schema update:', item.topic)

    // Mark as executing
    setContentItems(prev => prev.map(i =>
      i.id === item.id ? { ...i, status: 'executing' as const } : i
    ))

    try {
      // Call geo-schema-updater with the schema opportunity data
      const { data, error } = await supabase.functions.invoke('geo-schema-updater', {
        body: {
          organization_id: organization.id,
          recommendation: item.details.schemaData || {
            title: item.topic,
            description: item.details.what,
            schemaType: item.details.schemaData?.schemaType || 'Organization',
            implementation: item.details.schemaData?.implementation || '{}',
            query: item.details.schemaData?.query || '',
            expectedImpact: item.details.schemaData?.expectedImpact || 'Improved AI visibility',
            priority: item.details.schemaData?.priority || 1,
            autoExecutable: true
          }
        }
      })

      if (error) {
        throw error
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to execute schema update')
      }

      console.log('✅ Schema update executed successfully:', data)

      // Update database
      await updateItemInDatabase(item.id, {
        status: 'generated',
        generated_content: `Schema updated successfully: ${data.message || 'Schema markup added'}`,
        generated_at: new Date().toISOString(),
        executed: true,
        executed_at: new Date().toISOString(),
        execution_result: data
      })

      // Mark as generated (schema executed)
      setContentItems(prev => prev.map(i =>
        i.id === item.id
          ? {
              ...i,
              status: 'generated' as const,
              generatedContent: `Schema updated successfully: ${data.message || 'Schema markup added'}`,
              generatedAt: new Date(),
              executed: true,
              executedAt: new Date()
            }
          : i
      ))

    } catch (error: any) {
      console.error('❌ Schema execution failed:', error)

      // Update database
      await updateItemInDatabase(item.id, {
        status: 'failed',
        generation_error: error.message || 'Schema execution failed'
      })

      // Mark as failed
      setContentItems(prev => prev.map(i =>
        i.id === item.id
          ? { ...i, status: 'failed' as const, generationError: error.message || 'Schema execution failed' }
          : i
      ))
    }
  }

  const togglePriority = (priority: number) => {
    const newExpanded = new Set(expandedPriorities)
    if (newExpanded.has(priority)) {
      newExpanded.delete(priority)
    } else {
      newExpanded.add(priority)
    }
    setExpandedPriorities(newExpanded)
  }

  const toggleStakeholder = (stakeholder: string) => {
    const newExpanded = new Set(expandedStakeholders)
    if (newExpanded.has(stakeholder)) {
      newExpanded.delete(stakeholder)
    } else {
      newExpanded.add(stakeholder)
    }
    setExpandedStakeholders(newExpanded)
  }

  const handleToggleExecuted = async (itemId: string, executed: boolean) => {
    setContentItems(prev => prev.map(i =>
      i.id === itemId ? { ...i, executed, executedAt: executed ? new Date() : undefined } : i
    ))

    const updateData = {
      executed,
      executed_at: executed ? new Date().toISOString() : null
    }

    // Update content_library
    await supabase
      .from('content_library')
      .update(updateData)
      .eq('id', itemId)
  }

  const handleUpdateResult = async (itemId: string, resultValue: string, resultNotes: string) => {
    const item = contentItems.find(i => i.id === itemId)
    if (!item) return

    const resultField = getResultFieldForType(item.type)

    setContentItems(prev => prev.map(i =>
      i.id === itemId ? { ...i, result: { type: resultField.resultType as any, value: resultValue, notes: resultNotes } } : i
    ))

    const resultData = {
      result: { type: resultField.resultType, value: resultValue, notes: resultNotes }
    }

    // Update content_library
    await supabase
      .from('content_library')
      .update(resultData)
      .eq('id', itemId)
  }

  const getStatusIcon = (status: ContentItem['status']) => {
    const icons = {
      pending: <div className="w-2 h-2 rounded-full bg-gray-400" />,
      generating: <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />,
      generated: <div className="w-2 h-2 rounded-full bg-emerald-400" />,
      published: <div className="w-2 h-2 rounded-full bg-green-500" />,
      failed: <div className="w-2 h-2 rounded-full bg-red-400" />
    }
    return icons[status]
  }

  const getContentTypeLabel = (type: ContentItem['type']) => {
    const types = {
      media_pitch: { label: 'Media Pitch', icon: '📰', color: 'emerald' },
      social_post: { label: 'Social Post', icon: '📱', color: 'blue' },
      thought_leadership: { label: 'Thought Leadership', icon: '✍️', color: 'purple' },
      press_release: { label: 'Press Release', icon: '📄', color: 'cyan' },
      geo_schema_update: { label: 'GEO Schema Update', icon: '🤖', color: 'purple' },
      user_action: { label: 'User Action Required', icon: '👤', color: 'amber' }
    }
    return types[type]
  }

  const getResultFieldForType = (type: ContentItem['type']): { label: string; placeholder: string; resultType: string } => {
    const resultFields = {
      media_pitch: { label: 'Response', placeholder: 'e.g., Replied, No response, Meeting scheduled', resultType: 'media_response' },
      thought_leadership: { label: 'Engagement', placeholder: 'e.g., Views, Shares, Comments', resultType: 'engagement' },
      social_post: { label: 'Engagement', placeholder: 'e.g., Likes, Comments, Shares', resultType: 'engagement' },
      press_release: { label: 'Media Pickup', placeholder: 'e.g., Number of outlets, Coverage quality', resultType: 'pickup' },
      user_action: { label: 'Result', placeholder: 'Enter result or outcome', resultType: 'other' }
    }
    return resultFields[type] || { label: 'Result', placeholder: 'Enter result', resultType: 'other' }
  }

  const priorityColors: Record<number, string> = {
    1: 'red',
    2: 'amber',
    3: 'blue',
    4: 'gray'
  }

  // Group items by LEVER priority → stakeholder → content
  // This groups ALL stakeholders' Priority 1 levers together, then Priority 2s, etc.
  const itemsByPriorityAndStakeholder = contentItems.reduce((acc, item) => {
    const priority = item.leverPriority  // Use LEVER priority, not stakeholder priority
    const stakeholder = item.stakeholder

    if (!acc[priority]) acc[priority] = {}
    if (!acc[priority][stakeholder]) acc[priority][stakeholder] = []

    acc[priority][stakeholder].push(item)
    return acc
  }, {} as Record<number, Record<string, ContentItem[]>>)

  const itemsByStakeholder = contentItems.reduce((acc, item) => {
    if (!acc[item.stakeholder]) acc[item.stakeholder] = []
    acc[item.stakeholder].push(item)
    return acc
  }, {} as Record<string, ContentItem[]>)

  // Calculate progress
  const totalItems = contentItems.length
  const generatedItems = contentItems.filter(i => i.status === 'generated' || i.status === 'published').length
  const progressPercent = totalItems > 0 ? Math.round((generatedItems / totalItems) * 100) : 0

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-white">Loading execution plan...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-white font-semibold mb-2">Error</p>
          <p className="text-gray-400 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!blueprint || !sessionId) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <Target className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-white font-semibold mb-2">No Campaign Selected</p>
          <p className="text-gray-400 text-sm">
            {availableCampaigns.length > 0
              ? 'Select a campaign from the dropdown above or create a new one in Campaign Builder'
              : 'Create a campaign in Campaign Builder to get started'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="h-full flex flex-col bg-gray-900">
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          {/* Campaign Selector */}
          {availableCampaigns.length > 1 && (
            <div className="mb-4">
              <label className="text-xs text-gray-400 mb-2 block">Campaign</label>
              <select
                value={sessionId}
                onChange={(e) => handleCampaignSwitch(e.target.value)}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 hover:border-gray-600 focus:outline-none focus:border-emerald-500 transition-colors"
              >
                {availableCampaigns.map(campaign => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.blueprint?.overview?.campaignName || campaign.campaign_goal || 'Untitled Campaign'}
                    {' - '}
                    {new Date(campaign.created_at).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {blueprint.overview?.campaignName || 'Strategic Execution Plan'}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {blueprint.part1_goalFramework?.primaryObjective}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-3xl font-bold text-emerald-400">
                  {progressPercent}%
                </div>
                <div className="text-xs text-gray-400">
                  {generatedItems} of {totalItems} items
                </div>
              </div>
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('execution')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'execution'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <Target className="w-4 h-4" />
              Execution
            </button>
            <button
              onClick={() => setViewMode('blueprint')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'blueprint'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Blueprint
            </button>
            <button
              onClick={() => setViewMode('progress')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'progress'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Progress
            </button>
          </div>
        </div>

        {/* Content Area - Execution View */}
        <div className="flex-1 overflow-y-auto p-6">
          {viewMode === 'execution' && (
            <div className="space-y-6">
              {/* Detect campaign type for execution view */}
              {(blueprint as any).threeTierTacticalPlan ? (
                // GEO-VECTOR Campaign - organize by tier (Automated vs User-Assisted)
                <>
                  <h2 className="text-2xl font-bold text-white mb-6">GEO-VECTOR Execution</h2>
                  <p className="text-gray-400 mb-6">
                    AI Platform Visibility Campaign. Automated actions can be batch-executed with one click. User-assisted actions require your involvement.
                  </p>

                  {/* Group by Tier: Automated, then User-Assisted */}
                  {['automated', 'user_assisted'].map(tier => {
                    const tierItems = contentItems.filter(item => item.details?.tier === tier)
                    if (tierItems.length === 0) return null

                    const tierLabel = tier === 'automated' ? 'Automated Content' : 'User-Assisted Content'
                    const tierColor = tier === 'automated' ? 'emerald' : 'blue'
                    const tierIcon = tier === 'automated' ? '🤖' : '👤'
                    const tierDescription = tier === 'automated'
                      ? 'SignalDesk generates and can auto-publish these content types'
                      : 'SignalDesk provides content drafts, you execute and publish'

                    const pendingItems = tierItems.filter(i => i.status === 'pending' && i.type !== 'user_action')

                    return (
                      <div key={tier} className={`bg-gray-800 border border-${tierColor}-500/30 rounded-lg overflow-hidden`}>
                        {/* Tier Header */}
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">{tierIcon}</span>
                              <div>
                                <h3 className={`text-xl font-bold text-${tierColor}-300`}>
                                  {tierLabel}
                                </h3>
                                <p className="text-sm text-gray-400 mt-1">
                                  {tierDescription}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              {pendingItems.length > 0 && tier === 'automated' && (
                                <button
                                  onClick={() => handleBatchGenerate(pendingItems)}
                                  className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors font-medium flex items-center gap-2"
                                >
                                  <span>⚡</span>
                                  Auto-Execute All ({pendingItems.length})
                                </button>
                              )}
                              <span className="text-sm text-gray-400">
                                {tierItems.filter(i => i.status === 'generated' || i.status === 'published').length} / {tierItems.length} generated
                              </span>
                            </div>
                          </div>

                          {/* Items within this tier */}
                          <div className="space-y-2">
                            {tierItems.map(item => {
                              const typeInfo = getContentTypeLabel(item.type)
                              const isGenerating = generating.has(item.id)

                              return (
                                <div
                                  key={item.id}
                                  className={`p-3 bg-${tierColor}-900/10 border border-${tierColor}-500/20 rounded`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-lg">{typeInfo?.icon}</span>
                                        <span className={`text-xs font-medium text-${tierColor}-300`}>
                                          {item.topic}
                                        </span>
                                        {getStatusIcon(isGenerating ? 'generating' : item.status)}
                                      </div>
                                      {item.target && (
                                        <p className="text-xs text-gray-400">{item.target}</p>
                                      )}
                                      {item.details?.success_metric && (
                                        <p className="text-xs text-gray-500 mt-1">
                                          Success: {item.details.success_metric}
                                        </p>
                                      )}

                                      {/* AI Query Impact (GEO-VECTOR campaigns) */}
                                      {item.details?.aiQueryImpact && (
                                        <div className="mt-2 pt-2 border-t border-gray-700">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-semibold text-purple-400">🤖 AI Query Ownership</span>
                                            <span className={`text-xs px-2 py-0.5 rounded ${
                                              item.details.aiQueryImpact.citationProbability === 'high'
                                                ? 'bg-emerald-500/20 text-emerald-400'
                                                : item.details.aiQueryImpact.citationProbability === 'medium'
                                                ? 'bg-amber-500/20 text-amber-400'
                                                : 'bg-gray-500/20 text-gray-400'
                                            }`}>
                                              {item.details.aiQueryImpact.citationProbability} probability
                                            </span>
                                          </div>
                                          <div className="flex flex-wrap gap-1 mb-1">
                                            {item.details.aiQueryImpact.targetQueries?.slice(0, 3).map((query: string, idx: number) => (
                                              <span key={idx} className="text-xs px-2 py-0.5 bg-purple-900/30 text-purple-300 rounded border border-purple-500/30">
                                                "{query}"
                                              </span>
                                            ))}
                                          </div>
                                          <p className="text-xs text-gray-500">
                                            {item.details.aiQueryImpact.platforms?.join(', ')} • {item.details.aiQueryImpact.timeline}
                                          </p>
                                        </div>
                                      )}

                                      {item.status === 'failed' && item.generationError && (
                                        <p className="text-xs text-red-400 mt-1">Error: {item.generationError}</p>
                                      )}
                                    </div>
                                    <div className="flex gap-2">
                                      {item.type === 'geo_schema_update' && item.status === 'pending' && (
                                        <button
                                          onClick={() => handleExecuteSchema(item)}
                                          className="px-3 py-1 rounded text-xs font-medium bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-1"
                                        >
                                          <span>⚡</span>
                                          Execute Schema
                                        </button>
                                      )}
                                      {item.type === 'geo_schema_update' && item.status === 'executing' && (
                                        <div className="px-3 py-1 rounded text-xs font-medium bg-purple-900/30 text-purple-400">
                                          Executing...
                                        </div>
                                      )}
                                      {item.type !== 'user_action' && item.type !== 'geo_schema_update' && item.status === 'pending' && (
                                        <button
                                          onClick={() => handleGenerate(item)}
                                          disabled={isGenerating}
                                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                            isGenerating
                                              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                          }`}
                                        >
                                          {isGenerating ? 'Generating...' : 'Generate'}
                                        </button>
                                      )}
                                      {(item.status === 'generated' || item.status === 'published') && (
                                        <button
                                          onClick={() => setViewingItem(item)}
                                          className="px-3 py-1 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-700"
                                        >
                                          View
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </>
              ) : (
                // PR/VECTOR Campaign - organize by priority
                <>
                  <h2 className="text-2xl font-bold text-white mb-6">Campaign Execution</h2>
                  <p className="text-gray-400 mb-6">
                    Content organized by influence lever priority. Execute Priority 1 levers first for maximum impact.
                  </p>

                  {/* Group by Priority, then Stakeholder */}
                  {[1, 2, 3, 4].map(priority => {
                const stakeholderGroups = itemsByPriorityAndStakeholder[priority]
                if (!stakeholderGroups || Object.keys(stakeholderGroups).length === 0) return null

                const priorityColor = priorityColors[priority] || 'gray'
                const isPriorityExpanded = expandedPriorities.has(priority)
                const allItems = Object.values(stakeholderGroups).flat()
                const pendingItems = allItems.filter(i => i.status === 'pending' && i.type !== 'user_action')

                return (
                  <div key={priority} className={`bg-gray-800 border border-${priorityColor}-500/30 rounded-lg overflow-hidden`}>
                    {/* Priority Header */}
                    <div className="p-6 flex items-center justify-between">
                      <button
                        onClick={() => togglePriority(priority)}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                      >
                        {isPriorityExpanded ? (
                          <ChevronDown className={`w-5 h-5 text-${priorityColor}-400`} />
                        ) : (
                          <ChevronRight className={`w-5 h-5 text-${priorityColor}-400`} />
                        )}
                        <h3 className={`text-xl font-bold text-${priorityColor}-300`}>
                          Priority {priority}
                        </h3>
                        <span className="text-sm text-gray-400">
                          ({allItems.length} items across {Object.keys(stakeholderGroups).length} stakeholders)
                        </span>
                      </button>
                      <div className="flex items-center gap-4">
                        {pendingItems.length > 0 && (
                          <button
                            onClick={() => handleBatchGenerate(pendingItems)}
                            className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors font-medium"
                          >
                            Generate All Priority {priority} ({pendingItems.length})
                          </button>
                        )}
                        <span className="text-sm text-gray-400">
                          {allItems.filter(i => i.status === 'generated' || i.status === 'published').length} / {allItems.length} generated
                        </span>
                      </div>
                    </div>

                    {/* Stakeholders within this priority */}
                    {isPriorityExpanded && (
                      <div className="border-t border-gray-700">
                        {Object.entries(stakeholderGroups).map(([stakeholder, items]) => {
                          const isStakeholderExpanded = expandedStakeholders.has(`${priority}-${stakeholder}`)

                          return (
                            <div key={stakeholder} className="border-b border-gray-700 last:border-b-0">
                              {/* Stakeholder Header */}
                              <button
                                onClick={() => toggleStakeholder(`${priority}-${stakeholder}`)}
                                className="w-full p-4 pl-12 flex items-center justify-between hover:bg-gray-750 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  {isStakeholderExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                  )}
                                  <span className="text-white font-semibold">{stakeholder}</span>
                                  <span className="text-sm text-gray-400">({items.length} items)</span>
                                </div>
                              </button>

                              {/* Content Items */}
                              {isStakeholderExpanded && (
                                <div className="pl-16 pr-4 pb-4 space-y-2">
                                  {items.map(item => {
                                    const typeInfo = getContentTypeLabel(item.type)
                                    const isGenerating = generating.has(item.id)

                                    return (
                                      <div
                                        key={item.id}
                                        className={`p-3 bg-${typeInfo?.color || 'gray'}-900/10 border border-${typeInfo?.color || 'gray'}-500/20 rounded`}
                                      >
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                              <span className="text-lg">{typeInfo?.icon}</span>
                                              <span className={`text-xs font-medium text-${typeInfo?.color || 'gray'}-300`}>
                                                {typeInfo?.label}
                                              </span>
                                              {getStatusIcon(isGenerating ? 'generating' : item.status)}
                                            </div>
                                            <p className="text-sm text-white font-medium mb-1">{item.topic}</p>
                                            {item.target && (
                                              <p className="text-xs text-gray-400">{item.target}</p>
                                            )}

                                            {/* AI Query Impact (GEO-VECTOR campaigns) */}
                                            {item.details?.aiQueryImpact && (
                                              <div className="mt-2 pt-2 border-t border-gray-700">
                                                <div className="flex items-center gap-2 mb-1">
                                                  <span className="text-xs font-semibold text-purple-400">🤖 AI Query Ownership</span>
                                                  <span className={`text-xs px-2 py-0.5 rounded ${
                                                    item.details.aiQueryImpact.citationProbability === 'high'
                                                      ? 'bg-emerald-500/20 text-emerald-400'
                                                      : item.details.aiQueryImpact.citationProbability === 'medium'
                                                      ? 'bg-amber-500/20 text-amber-400'
                                                      : 'bg-gray-500/20 text-gray-400'
                                                  }`}>
                                                    {item.details.aiQueryImpact.citationProbability} probability
                                                  </span>
                                                </div>
                                                <div className="flex flex-wrap gap-1 mb-1">
                                                  {item.details.aiQueryImpact.targetQueries?.slice(0, 3).map((query: string, idx: number) => (
                                                    <span key={idx} className="text-xs px-2 py-0.5 bg-purple-900/30 text-purple-300 rounded border border-purple-500/30">
                                                      "{query}"
                                                    </span>
                                                  ))}
                                                </div>
                                                <p className="text-xs text-gray-500">
                                                  {item.details.aiQueryImpact.platforms?.join(', ')} • {item.details.aiQueryImpact.timeline}
                                                </p>
                                              </div>
                                            )}

                                            {item.status === 'failed' && item.generationError && (
                                              <p className="text-xs text-red-400 mt-1">Error: {item.generationError}</p>
                                            )}
                                          </div>
                                          <div className="flex gap-2">
                                            {item.type !== 'user_action' && item.status === 'pending' && (
                                              <button
                                                onClick={() => handleGenerate(item)}
                                                disabled={isGenerating}
                                                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                                  isGenerating
                                                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                                }`}
                                              >
                                                {isGenerating ? 'Generating...' : 'Generate'}
                                              </button>
                                            )}
                                            {item.status === 'generating' && (
                                              <div className="px-3 py-1 rounded text-xs font-medium bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                                                Generating...
                                              </div>
                                            )}
                                            {(item.status === 'generated' || item.status === 'published') && (
                                              <button
                                                onClick={() => setViewingItem(item)}
                                                className="px-3 py-1 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-700"
                                              >
                                                View
                                              </button>
                                            )}
                                            {item.status === 'failed' && (
                                              <button
                                                onClick={() => handleGenerate(item)}
                                                className="px-3 py-1 rounded text-xs font-medium bg-amber-600 text-white hover:bg-amber-700"
                                              >
                                                Retry
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
                </>
              )}
            </div>
          )}

          {/* Blueprint View */}
          {viewMode === 'blueprint' && blueprint && (
            <>
              {blueprint.contentRequirements ? (
                // PR Campaign
                <PRBriefPresentation
                  brief={blueprint}
                  onRefine={() => {}}
                  onExport={() => {}}
                  onExecute={() => {}}
                  isRefining={false}
                />
              ) : (blueprint as any).threeTierTacticalPlan ? (
                // GEO-VECTOR Campaign
                <GeoVectorBlueprintPresentation
                  blueprint={blueprint as any}
                  onRefine={() => {}}
                  onExport={() => {}}
                  onExecute={() => {}}
                  isRefining={false}
                />
              ) : (
                // VECTOR Campaign
                <BlueprintV3Presentation
                  blueprint={blueprint}
                  blueprintType="VECTOR_CAMPAIGN"
                  onRefine={() => {}}
                  onExport={() => {}}
                  onExecute={() => {}}
                  isRefining={false}
                />
              )}
            </>
          )}

          {/* Progress View */}
          {viewMode === 'progress' && (
            <div className="space-y-6">
              {/* Campaign Status by Priority */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-2xl font-bold text-white mb-6">Campaign Status</h3>

                {[1, 2, 3, 4].map(priority => {
                  const stakeholderGroups = itemsByPriorityAndStakeholder[priority]
                  if (!stakeholderGroups) return null

                  const items = Object.values(stakeholderGroups).flat()
                  if (items.length === 0) return null

                  const color = priorityColors[priority]
                  const executed = items.filter(i => i.executed).length

                  return (
                    <div key={priority} className="mb-6 last:mb-0">
                      <button
                        onClick={() => togglePriority(priority)}
                        className="w-full flex items-center justify-between p-4 bg-gray-900/50 rounded-lg hover:bg-gray-900/70 transition-colors mb-3"
                      >
                        <div className="flex items-center gap-3">
                          <ChevronRight className={`w-5 h-5 text-${color}-400 transition-transform ${expandedPriorities.has(priority) ? 'rotate-90' : ''}`} />
                          <span className={`text-lg font-bold text-${color}-300`}>Priority {priority}</span>
                          <span className="text-sm text-gray-400">({items.length} items)</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-400">
                            Executed: <span className="text-white font-semibold">{executed}/{items.length}</span>
                          </span>
                        </div>
                      </button>

                      {expandedPriorities.has(priority) && (
                        <div className="space-y-3 ml-4">
                          {items.map(item => {
                            const typeInfo = getContentTypeLabel(item.type)
                            const resultField = getResultFieldForType(item.type)
                            const isEditingResult = editingResultFor === item.id

                            return (
                              <div
                                key={item.id}
                                className={`p-4 bg-${typeInfo?.color || 'gray'}-900/10 border border-${typeInfo?.color || 'gray'}-500/20 rounded-lg`}
                              >
                                <div className="space-y-3">
                                  {/* Content info */}
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-lg">{typeInfo?.icon}</span>
                                      <span className={`text-xs font-medium text-${typeInfo?.color || 'gray'}-300`}>
                                        {typeInfo?.label}
                                      </span>
                                      {getStatusIcon(item.status)}
                                      {item.executed && (
                                        <span className="ml-auto text-xs px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                          ✓ Complete
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-white font-medium">{item.topic}</p>
                                    {item.target && (
                                      <p className="text-xs text-gray-400 mt-1">{item.target}</p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">
                                      {item.stakeholder} • {item.leverName}
                                    </p>
                                  </div>

                                  {/* Result form - show when editing */}
                                  {isEditingResult && (
                                    <div className="space-y-2 pt-2 border-t border-gray-700">
                                      <label className="block text-xs font-medium text-gray-400">
                                        {resultField.label}
                                      </label>
                                      <input
                                        type="text"
                                        placeholder={resultField.placeholder}
                                        defaultValue={item.result?.value || ''}
                                        onBlur={(e) => handleUpdateResult(item.id, e.target.value, item.result?.notes || '')}
                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                      />
                                      <textarea
                                        placeholder="Additional notes (optional)"
                                        defaultValue={item.result?.notes || ''}
                                        onBlur={(e) => handleUpdateResult(item.id, item.result?.value || '', e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                                        rows={2}
                                      />
                                      {item.executedAt && (
                                        <p className="text-xs text-gray-500">
                                          Executed: {new Date(item.executedAt).toLocaleDateString()}
                                        </p>
                                      )}
                                      <button
                                        onClick={() => setEditingResultFor(null)}
                                        className="px-3 py-1 rounded text-xs font-medium bg-gray-600 text-white hover:bg-gray-700"
                                      >
                                        Done
                                      </button>
                                    </div>
                                  )}

                                  {/* Action buttons */}
                                  <div className="flex gap-2">
                                    {(item.status === 'generated' || item.status === 'published') && (
                                      <button
                                        onClick={() => setViewingItem(item)}
                                        className="px-3 py-1 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-700"
                                      >
                                        View Content
                                      </button>
                                    )}
                                    {!item.executed && (
                                      <button
                                        onClick={() => handleToggleExecuted(item.id, true)}
                                        className="px-3 py-1 rounded text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700"
                                      >
                                        Mark as Complete
                                      </button>
                                    )}
                                    {item.executed && (
                                      <button
                                        onClick={() => setEditingResultFor(isEditingResult ? null : item.id)}
                                        className="px-3 py-1 rounded text-xs font-medium bg-purple-600 text-white hover:bg-purple-700"
                                      >
                                        {isEditingResult ? 'Hide Result' : 'Result'}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Campaign Content Stats */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">Campaign Content</h3>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Overall Completion</span>
                    <span className="text-white font-semibold">{progressPercent}%</span>
                  </div>
                  <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="bg-gray-900/50 rounded p-4">
                    <p className="text-sm text-gray-400 mb-1">Total Items</p>
                    <p className="text-3xl font-bold text-white">{totalItems}</p>
                  </div>
                  <div className="bg-gray-900/50 rounded p-4">
                    <p className="text-sm text-gray-400 mb-1">Generated</p>
                    <p className="text-3xl font-bold text-emerald-400">{generatedItems}</p>
                  </div>
                  <div className="bg-gray-900/50 rounded p-4">
                    <p className="text-sm text-gray-400 mb-1">Executed</p>
                    <p className="text-3xl font-bold text-blue-400">{contentItems.filter(i => i.executed).length}</p>
                  </div>
                  <div className="bg-gray-900/50 rounded p-4">
                    <p className="text-sm text-gray-400 mb-1">Pending</p>
                    <p className="text-3xl font-bold text-amber-400">{contentItems.filter(i => i.status === 'pending').length}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content Viewer Modal */}
      {viewingItem && (
        <ContentViewerModal
          item={viewingItem}
          onClose={() => setViewingItem(null)}
          onUpdate={handleUpdateContent}
          onPublish={handlePublish}
        />
      )}
    </>
  )
}
