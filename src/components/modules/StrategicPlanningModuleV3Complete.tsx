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
  type: 'media_pitch' | 'social_post' | 'thought_leadership' | 'user_action'
  stakeholder: string
  stakeholderPriority: number
  leverName: string
  leverPriority: number
  topic: string
  target?: string
  details: any
  status: 'pending' | 'generating' | 'generated' | 'published' | 'failed'
  generatedContent?: string
  generationError?: string
  generatedAt?: Date
}

interface StrategicPlanningModuleV3Props {
  blueprint: BlueprintData
  sessionId: string
  orgId: string
}

type ViewMode = 'execution' | 'planning' | 'blueprint' | 'progress'

export default function StrategicPlanningModuleV3Complete({
  blueprint: initialBlueprint,
  sessionId: initialSessionId,
  orgId: initialOrgId
}: StrategicPlanningModuleV3Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('execution')
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [expandedPriorities, setExpandedPriorities] = useState<Set<number>>(new Set([1]))
  const [expandedStakeholders, setExpandedStakeholders] = useState<Set<string>>(new Set())
  const [generating, setGenerating] = useState<Set<string>>(new Set())
  const [viewingItem, setViewingItem] = useState<ContentItem | null>(null)
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

  // Load available campaigns on mount
  useEffect(() => {
    loadAvailableCampaigns()
  }, [initialOrgId])

  const loadAvailableCampaigns = async () => {
    const { data, error } = await supabase
      .from('campaign_builder_sessions')
      .select('id, campaign_goal, created_at, blueprint')
      .eq('org_id', initialOrgId)
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
    // Try to load existing items from database
    const { data: existingItems, error: loadError } = await supabase
      .from('campaign_execution_items')
      .select('*')
      .eq('session_id', sessionId)

    if (loadError) {
      console.error('Error loading items:', loadError)
      setError('Failed to load execution items')
      setLoading(false)
      return
    }

    if (existingItems && existingItems.length > 0) {
      // Convert database items to ContentItem format
      const items = existingItems.map(dbItem => ({
        id: dbItem.id,
        type: dbItem.content_type as ContentItem['type'],
        stakeholder: dbItem.stakeholder_name,
        stakeholderPriority: dbItem.stakeholder_priority,
        leverName: dbItem.lever_name,
        leverPriority: dbItem.lever_priority,
        topic: dbItem.topic,
        target: dbItem.target,
        details: dbItem.details,
        status: dbItem.status as ContentItem['status'],
        generatedContent: dbItem.generated_content,
        generationError: dbItem.generation_error,
        generatedAt: dbItem.generated_at ? new Date(dbItem.generated_at) : undefined
      }))
      setContentItems(items)
      setLoading(false)
    } else {
      // Parse blueprint and save to database
      await initializeItemsFromBlueprint()
    }
  }

  const initializeItemsFromBlueprint = async () => {
    const items = parseBlueprint(blueprint)

    // Double-check that items don't already exist before inserting
    const { data: existingCheck } = await supabase
      .from('campaign_execution_items')
      .select('id')
      .eq('session_id', sessionId)
      .limit(1)

    if (existingCheck && existingCheck.length > 0) {
      console.log('⚠️ Items already exist, skipping initialization')
      // Items were created by another request, reload them
      const { data: existing } = await supabase
        .from('campaign_execution_items')
        .select('*')
        .eq('session_id', sessionId)

      if (existing) {
        const items = existing.map(dbItem => ({
          id: dbItem.id,
          type: dbItem.content_type as ContentItem['type'],
          stakeholder: dbItem.stakeholder_name,
          stakeholderPriority: dbItem.stakeholder_priority,
          leverName: dbItem.lever_name,
          leverPriority: dbItem.lever_priority,
          topic: dbItem.topic,
          target: dbItem.target,
          details: dbItem.details,
          status: dbItem.status as ContentItem['status'],
          generatedContent: dbItem.generated_content,
          generationError: dbItem.generation_error,
          generatedAt: dbItem.generated_at ? new Date(dbItem.generated_at) : undefined
        }))
        setContentItems(items)
      }
      setLoading(false)
      return
    }

    // Save to database
    const dbItems = items.map(item => ({
      id: item.id,
      session_id: sessionId,
      organization_id: orgId,
      stakeholder_name: item.stakeholder,
      stakeholder_priority: item.stakeholderPriority,
      lever_name: item.leverName,
      lever_priority: item.leverPriority,
      content_type: item.type,
      topic: item.topic,
      target: item.target,
      details: item.details,
      status: item.status
    }))

    const { error: insertError } = await supabase
      .from('campaign_execution_items')
      .insert(dbItems)

    if (insertError) {
      console.error('Error saving items:', insertError)
      setError('Failed to initialize execution items')
    }

    setContentItems(items)
    setLoading(false)
  }

  const parseBlueprint = (blueprint: BlueprintData): ContentItem[] => {
    const items: ContentItem[] = []
    const plans = blueprint.part3_stakeholderOrchestration?.stakeholderOrchestrationPlans || []

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
            type: 'user_action',
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
        phases: [] // Could add phase-specific info if needed
      }

      // Build content requirement based on NIV's expected structure
      let ownedContent = []
      let mediaContent = []

      if (item.type === 'media_pitch') {
        // Media pitch goes in media array with specific structure
        mediaContent = [{
          type: 'media_pitch',
          story: item.topic,  // NIV expects 'story' not 'purpose'
          journalists: [item.details.who],  // NIV expects array of journalists
          outlet: item.details.outlet,
          beat: item.details.beat,
          keyPoints: item.details.keyMessages || []
        }]
      } else if (item.type === 'social_post') {
        // Social post goes in owned array
        ownedContent = [{
          type: 'social_post',
          stakeholder: item.stakeholder,
          purpose: item.topic,
          keyPoints: item.details.keyMessages || [],
          platform: item.details.platform,
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

      // Save to campaign_execution_items
      await supabase
        .from('campaign_execution_items')
        .update({
          status: 'generated',
          generated_content: generatedContent,
          generated_at: new Date().toISOString()
        })
        .eq('id', item.id)

      // Also save to Memory Vault (content_library)
      await supabase
        .from('content_library')
        .insert({
          organization_id: orgId,
          session_id: sessionId,
          content_type: item.type,
          title: item.topic,
          content: generatedContent,
          metadata: {
            stakeholder: item.stakeholder,
            stakeholder_priority: item.stakeholderPriority,
            lever_name: item.leverName,
            lever_priority: item.leverPriority,
            target: item.target,
            blueprint_item_id: item.id
          },
          tags: ['campaign', `priority-${item.stakeholderPriority}`, item.stakeholder],
          status: 'draft',
          folder_path: `campaigns/${sessionId}/${item.stakeholder}`
        })

    } catch (error: any) {
      console.error('Generation error:', error)

      setContentItems(prev => prev.map(i =>
        i.id === item.id
          ? { ...i, status: 'failed' as const, generationError: error.message }
          : i
      ))

      // Save error to database
      await supabase
        .from('campaign_execution_items')
        .update({
          status: 'failed',
          generation_error: error.message
        })
        .eq('id', item.id)
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

          // Save to campaign_execution_items
          await supabase
            .from('campaign_execution_items')
            .update({
              status: 'generated',
              generated_content: generatedContent,
              generated_at: new Date().toISOString()
            })
            .eq('id', item.id)

          // Also save to Memory Vault (content_library)
          await supabase
            .from('content_library')
            .insert({
              organization_id: orgId,
              session_id: sessionId,
              content_type: item.type,
              title: item.topic,
              content: generatedContent,
              metadata: {
                stakeholder: item.stakeholder,
                stakeholder_priority: item.stakeholderPriority,
                lever_name: item.leverName,
                lever_priority: item.leverPriority,
                target: item.target,
                blueprint_item_id: item.id
              },
              tags: ['campaign', `priority-${item.stakeholderPriority}`, item.stakeholder],
              status: 'draft',
              folder_path: `campaigns/${sessionId}/${item.stakeholder}`
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
      .from('campaign_execution_items')
      .update({ generated_content: content })
      .eq('id', itemId)
  }

  const handlePublish = async (itemId: string) => {
    setContentItems(prev => prev.map(i =>
      i.id === itemId ? { ...i, status: 'published' as const } : i
    ))

    await supabase
      .from('campaign_execution_items')
      .update({
        status: 'published',
        published_at: new Date().toISOString()
      })
      .eq('id', itemId)

    setViewingItem(null)
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
      user_action: { label: 'User Action Required', icon: '👤', color: 'amber' }
    }
    return types[type]
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
              onClick={() => setViewMode('planning')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'planning'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
              Planning
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
                                        className={`p-3 bg-${typeInfo.color}-900/10 border border-${typeInfo.color}-500/20 rounded`}
                                      >
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                              <span className="text-lg">{typeInfo.icon}</span>
                                              <span className={`text-xs font-medium text-${typeInfo.color}-300`}>
                                                {typeInfo.label}
                                              </span>
                                              {getStatusIcon(isGenerating ? 'generating' : item.status)}
                                            </div>
                                            <p className="text-sm text-white font-medium mb-1">{item.topic}</p>
                                            {item.target && (
                                              <p className="text-xs text-gray-400">{item.target}</p>
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
            </div>
          )}

          {/* Planning View - Grouped by Stakeholder */}
          {viewMode === 'planning' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Planning by Stakeholder</h2>

              {/* Simple stakeholder grouping */}
              {Object.entries(itemsByStakeholder).map(([stakeholder, stakeholderItems]) => {
                const pendingItems = stakeholderItems.filter(i => i.status === 'pending' && i.type !== 'user_action')

                return (
                  <div key={stakeholder} className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Target className="w-5 h-5 text-emerald-400" />
                        <span>{stakeholder}</span>
                        <span className="text-sm text-gray-400 font-normal">({stakeholderItems.length} content items)</span>
                      </h3>
                      {pendingItems.length > 0 && (
                        <button
                          onClick={() => handleBatchGenerate(pendingItems)}
                          className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors font-medium"
                        >
                          Generate All ({pendingItems.length})
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      {stakeholderItems.map(item => {
                                const typeInfo = getContentTypeLabel(item.type)
                                const isGenerating = generating.has(item.id)

                                return (
                                  <div
                                    key={item.id}
                                    className={`p-3 bg-${typeInfo.color}-900/10 border border-${typeInfo.color}-500/20 rounded`}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="text-lg">{typeInfo.icon}</span>
                                          <span className={`text-xs font-medium text-${typeInfo.color}-300`}>
                                            {typeInfo.label}
                                          </span>
                                          {getStatusIcon(isGenerating ? 'generating' : item.status)}
                                        </div>
                                        <p className="text-sm text-white font-medium mb-1">{item.topic}</p>
                                        {item.target && (
                                          <p className="text-xs text-gray-400">{item.target}</p>
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
                  </div>
                )
              })}
            </div>
          )}

          {/* Blueprint View */}
          {viewMode === 'blueprint' && blueprint && (
            <BlueprintV3Presentation
              blueprint={blueprint}
              blueprintType="VECTOR_CAMPAIGN"
              onRefine={() => {}}
              onExport={() => {}}
              onExecute={() => {}}
              isRefining={false}
            />
          )}

          {/* Progress View */}
          {viewMode === 'progress' && (
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">Campaign Progress</h3>
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

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-gray-900/50 rounded p-4">
                    <p className="text-sm text-gray-400 mb-1">Total Items</p>
                    <p className="text-3xl font-bold text-white">{totalItems}</p>
                  </div>
                  <div className="bg-gray-900/50 rounded p-4">
                    <p className="text-sm text-gray-400 mb-1">Generated</p>
                    <p className="text-3xl font-bold text-emerald-400">{generatedItems}</p>
                  </div>
                  <div className="bg-gray-900/50 rounded p-4">
                    <p className="text-sm text-gray-400 mb-1">Pending</p>
                    <p className="text-3xl font-bold text-amber-400">{contentItems.filter(i => i.status === 'pending').length}</p>
                  </div>
                  <div className="bg-gray-900/50 rounded p-4">
                    <p className="text-sm text-gray-400 mb-1">Generating</p>
                    <p className="text-3xl font-bold text-blue-400">{generating.size}</p>
                  </div>
                </div>
              </div>

              {/* Progress by Priority */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">Progress by Priority</h3>
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(priority => {
                    const stakeholderGroups = itemsByPriorityAndStakeholder[priority]
                    if (!stakeholderGroups) return null

                    const items = Object.values(stakeholderGroups).flat()
                    if (items.length === 0) return null

                    const generated = items.filter(i => i.status === 'generated' || i.status === 'published').length
                    const percent = Math.round((generated / items.length) * 100)
                    const color = priorityColors[priority]

                    return (
                      <div key={priority}>
                        <div className="flex justify-between text-sm mb-2">
                          <span className={`text-${color}-300`}>Priority {priority}</span>
                          <span className="text-white font-semibold">{generated}/{items.length}</span>
                        </div>
                        <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-${color}-500 transition-all duration-500`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
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
