'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  Wrench,
  MessageSquare,
  Plus,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Play,
  Clock,
  CheckCircle2,
  Target,
  Sparkles,
  BarChart3,
  Users,
  FileText,
  Share2,
  Eye,
  Copy,
  Download,
  X,
  CalendarPlus,
  Check,
  TrendingUp
} from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { CampaignBuilderWizard } from '@/components/campaign-builder/CampaignBuilderWizard'
import { supabase } from '@/lib/supabase/client'
import { upsertMemoryVaultContent, updateMemoryVaultContent } from '@/lib/memoryVaultAPI'
import { BlueprintV3Presentation } from '@/components/campaign-builder/BlueprintV3Presentation'
import { PRBriefPresentation } from '@/components/campaign-builder/PRBriefPresentation'
import { GeoVectorBlueprintPresentation } from '@/components/campaign-builder/GeoVectorBlueprintPresentation'

// Storage keys are scoped by organization to prevent data leakage
const getCampaignsStorageKey = (orgId: string) => `signaldesk_active_campaigns_${orgId}`
const getCalendarItemsStorageKey = (orgId: string) => `signaldesk_calendar_items_${orgId}`
const CONTENT_ITEMS_STORAGE_PREFIX = 'signaldesk_content_items_'

interface Campaign {
  id: string
  name: string
  phase: string
  progress: number
  status: 'ready' | 'active' | 'completed' | 'planned'
  blueprint?: any
  sessionId?: string
  campaignType?: string
  startDate?: string
  endDate?: string
  createdAt?: string
}

type SidebarView = 'planner' | 'builder' | 'active'

interface PlanData {
  blueprint: any
  sessionId: string
  orgId?: string
  campaignType: string
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
  status: 'pending' | 'generating' | 'generated' | 'published'
  generatedContent?: string
  generatedAt?: string
  // Execution tracking - persisted to Memory Vault
  memoryVaultId?: string  // Links to content_library entry
  executed?: boolean
  executedAt?: string
  result?: {
    type: 'media_response' | 'engagement' | 'pickup' | 'other'
    value?: string
    notes?: string
  }
}

// Result field configuration by content type
const RESULT_FIELDS: Record<string, { label: string; placeholder: string; resultType: string }> = {
  'media_pitch': { label: 'Response', placeholder: 'e.g., Replied, No response, Meeting scheduled', resultType: 'media_response' },
  'thought_leadership': { label: 'Engagement', placeholder: 'e.g., Views, Shares, Comments', resultType: 'engagement' },
  'social_post': { label: 'Engagement', placeholder: 'e.g., Likes, Comments, Shares', resultType: 'engagement' },
  'press_release': { label: 'Media Pickup', placeholder: 'e.g., Number of outlets, Coverage quality', resultType: 'pickup' },
  'user_action': { label: 'Result', placeholder: 'Enter result or outcome', resultType: 'other' }
}

interface CalendarItem {
  id: string
  type: 'campaign_content' | 'campaign_milestone' | 'manual_event'
  title: string
  description?: string
  scheduledDate?: string
  dueDate?: string
  sourceType: 'campaign_builder' | 'studio' | 'niv_advisor' | 'manual'
  sourceId?: string
  campaignId?: string
  contentItemId?: string
  contentItem?: ContentItem
  status: 'scheduled' | 'in_progress' | 'completed' | 'skipped'
  completedAt?: string
  result?: {
    type: 'media_response' | 'engagement' | 'pickup' | 'other'
    value?: string
    notes?: string
  }
  createdAt: string
}

type CalendarView = 'month' | 'week' | 'list'

export default function CampaignsModule() {
  const { organization } = useAppStore()
  const [activeView, setActiveView] = useState<SidebarView>('planner')
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [campaignViewMode, setCampaignViewMode] = useState<'execution' | 'blueprint' | 'progress'>('execution')
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [expandedPriorities, setExpandedPriorities] = useState<Set<number>>(new Set([1]))
  const [generating, setGenerating] = useState<Set<string>>(new Set())
  const [viewingContent, setViewingContent] = useState<ContentItem | null>(null)
  const [copied, setCopied] = useState(false)

  // Calendar state
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([])
  const [calendarView, setCalendarView] = useState<CalendarView>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [addToCalendarItem, setAddToCalendarItem] = useState<ContentItem | null>(null)
  const [addToCalendarDate, setAddToCalendarDate] = useState('')
  const [showManualEventModal, setShowManualEventModal] = useState(false)
  const [manualEventTitle, setManualEventTitle] = useState('')
  const [manualEventDescription, setManualEventDescription] = useState('')
  const [manualEventDate, setManualEventDate] = useState('')
  const [editingResultItem, setEditingResultItem] = useState<CalendarItem | null>(null)
  const [resultType, setResultType] = useState<'media_response' | 'engagement' | 'pickup' | 'other'>('other')

  // Progress tab result tracking state
  const [editingProgressResult, setEditingProgressResult] = useState<string | null>(null) // ContentItem ID
  const [progressResultValue, setProgressResultValue] = useState('')
  const [progressResultNotes, setProgressResultNotes] = useState('')
  const [savingProgress, setSavingProgress] = useState(false)
  const [resultValue, setResultValue] = useState('')
  const [resultNotes, setResultNotes] = useState('')

  // Load campaigns from localStorage on mount and when organization changes
  useEffect(() => {
    if (!organization?.id) {
      setCampaigns([])
      setCalendarItems([])
      return
    }

    const savedCampaigns = localStorage.getItem(getCampaignsStorageKey(organization.id))
    if (savedCampaigns) {
      try {
        const parsed = JSON.parse(savedCampaigns)
        setCampaigns(parsed)
        console.log('📋 Loaded campaigns from localStorage:', parsed.length)
      } catch (e) {
        console.error('Failed to parse saved campaigns:', e)
        setCampaigns([])
      }
    } else {
      setCampaigns([])
    }

    const savedCalendarItems = localStorage.getItem(getCalendarItemsStorageKey(organization.id))
    if (savedCalendarItems) {
      try {
        const parsed = JSON.parse(savedCalendarItems)
        setCalendarItems(parsed)
        console.log('📅 Loaded calendar items from localStorage:', parsed.length)
      } catch (e) {
        console.error('Failed to parse saved calendar items:', e)
        setCalendarItems([])
      }
    } else {
      setCalendarItems([])
    }
  }, [organization?.id])

  // Save campaigns to localStorage whenever they change
  useEffect(() => {
    if (!organization?.id) return
    if (campaigns.length > 0) {
      localStorage.setItem(getCampaignsStorageKey(organization.id), JSON.stringify(campaigns))
      console.log('💾 Saved campaigns to localStorage:', campaigns.length)
    }
  }, [campaigns, organization?.id])

  // Save calendar items to localStorage
  useEffect(() => {
    if (!organization?.id) return
    localStorage.setItem(getCalendarItemsStorageKey(organization.id), JSON.stringify(calendarItems))
    console.log('📅 Saved calendar items to localStorage:', calendarItems.length)
  }, [calendarItems, organization?.id])

  // Parse blueprint into content items when a campaign is selected
  // Also load any saved content from localStorage
  // Handles both VECTOR/GEO-VECTOR (stakeholderOrchestrationPlans) and PR (contentRequirements) campaigns
  useEffect(() => {
    const blueprint = selectedCampaign?.blueprint
    const isVectorCampaign = blueprint?.part3_stakeholderOrchestration?.stakeholderOrchestrationPlans
    const isPRCampaign = blueprint?.contentRequirements || blueprint?.targetMedia

    if (isVectorCampaign || isPRCampaign) {
      // Use appropriate parser based on campaign type
      const freshItems = isVectorCampaign
        ? parseBlueprint(blueprint, selectedCampaign.id)
        : parsePRBlueprint(blueprint, selectedCampaign.id)

      // Try to load saved content items for this campaign
      const savedKey = `${CONTENT_ITEMS_STORAGE_PREFIX}${selectedCampaign.id}`
      const savedItemsStr = localStorage.getItem(savedKey)

      if (savedItemsStr) {
        try {
          const savedItems: ContentItem[] = JSON.parse(savedItemsStr)
          // Merge saved content with fresh structure
          const mergedItems = freshItems.map(freshItem => {
            const savedItem = savedItems.find(s => s.id === freshItem.id)
            if (savedItem && savedItem.generatedContent) {
              return {
                ...freshItem,
                status: savedItem.status,
                generatedContent: savedItem.generatedContent,
                generatedAt: savedItem.generatedAt,
                executed: savedItem.executed,
                executedAt: savedItem.executedAt,
                result: savedItem.result
              }
            }
            return freshItem
          })
          console.log('📦 Loaded saved content items:', savedItems.filter(i => i.generatedContent).length, 'generated')
          setContentItems(mergedItems)
        } catch (e) {
          console.error('Failed to parse saved content items:', e)
          setContentItems(freshItems)
        }
      } else {
        setContentItems(freshItems)
      }
    } else {
      setContentItems([])
    }
  }, [selectedCampaign])

  // Save content items to localStorage when they change
  useEffect(() => {
    if (selectedCampaign && contentItems.length > 0) {
      const hasGeneratedContent = contentItems.some(i => i.generatedContent)
      if (hasGeneratedContent) {
        const savedKey = `${CONTENT_ITEMS_STORAGE_PREFIX}${selectedCampaign.id}`
        localStorage.setItem(savedKey, JSON.stringify(contentItems))
        console.log('💾 Saved content items to localStorage:', contentItems.filter(i => i.generatedContent).length, 'generated')
      }
    }
  }, [contentItems, selectedCampaign])

  // Update campaign progress when content items change
  useEffect(() => {
    if (selectedCampaign && contentItems.length > 0) {
      const generated = contentItems.filter(i => i.status === 'generated' || i.status === 'published').length
      const progress = Math.round((generated / contentItems.length) * 100)

      if (progress !== selectedCampaign.progress) {
        setCampaigns(prev => prev.map(c =>
          c.id === selectedCampaign.id ? { ...c, progress } : c
        ))
        setSelectedCampaign(prev => prev ? { ...prev, progress } : null)
      }
    }
  }, [contentItems, selectedCampaign])

  const parseBlueprint = (blueprint: any, campaignId?: string): ContentItem[] => {
    const items: ContentItem[] = []
    let itemId = 0
    // Use campaign ID in item IDs to prevent cross-campaign content contamination
    const idPrefix = campaignId ? `${campaignId}-` : ''

    const plans = blueprint.part3_stakeholderOrchestration?.stakeholderOrchestrationPlans || []

    plans.forEach((plan: any) => {
      const stakeholderName = plan.stakeholder?.name || 'Unknown Stakeholder'
      const stakeholderPriority = plan.stakeholder?.priority || 4

      plan.influenceLevers?.forEach((lever: any) => {
        const campaign = lever.campaign

        campaign?.mediaPitches?.forEach((pitch: any) => {
          items.push({
            id: `${idPrefix}item-${++itemId}`,
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

        campaign?.socialPosts?.forEach((post: any) => {
          items.push({
            id: `${idPrefix}item-${++itemId}`,
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

        campaign?.thoughtLeadership?.forEach((article: any) => {
          items.push({
            id: `${idPrefix}item-${++itemId}`,
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

        campaign?.additionalTactics?.forEach((tactic: any) => {
          items.push({
            id: `${idPrefix}item-${++itemId}`,
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

  // Parse PR campaign blueprint into content items
  const parsePRBlueprint = (blueprint: any, campaignId?: string): ContentItem[] => {
    const items: ContentItem[] = []
    let itemId = 0
    const idPrefix = campaignId ? `${campaignId}-` : ''

    // PR campaigns have contentRequirements array
    const contentRequirements = blueprint.contentRequirements || []

    contentRequirements.forEach((req: any, index: number) => {
      // Map PR content types to our content types
      const typeMapping: Record<string, string> = {
        'press_release': 'media_pitch',
        'media_pitch': 'media_pitch',
        'social_post': 'social_post',
        'thought_leadership': 'thought_leadership',
        'blog_post': 'thought_leadership',
        'executive_statement': 'thought_leadership'
      }

      const contentType = typeMapping[req.type?.toLowerCase()] || 'thought_leadership'
      const priority = req.priority === 'high' ? 1 : req.priority === 'medium' ? 2 : 3

      items.push({
        id: `${idPrefix}item-${++itemId}`,
        type: contentType,
        stakeholder: req.targetAudience || 'General',
        stakeholderPriority: priority,
        leverName: req.type || 'Content',
        leverPriority: priority,
        topic: req.purpose || req.type,
        target: req.targetAudience || '',
        details: {
          keyPoints: req.keyPoints || [],
          specifications: req.specifications || {},
          format: req.specifications?.format,
          tone: req.specifications?.tone
        },
        status: 'pending'
      })
    })

    // Also add media pitches from targetMedia.tier1_outlets
    const tier1Outlets = blueprint.targetMedia?.tier1_outlets || []
    tier1Outlets.forEach((outlet: any) => {
      items.push({
        id: `${idPrefix}item-${++itemId}`,
        type: 'media_pitch',
        stakeholder: 'Media',
        stakeholderPriority: 1,
        leverName: 'Tier 1 Media',
        leverPriority: 1,
        topic: outlet.pitch_angle || `Pitch to ${outlet.outlet}`,
        target: `${outlet.journalist} (${outlet.outlet})`,
        details: {
          outlet: outlet.outlet,
          journalist: outlet.journalist,
          beat: outlet.beat,
          recent_coverage: outlet.recent_coverage,
          pitch_angle: outlet.pitch_angle
        },
        status: 'pending'
      })
    })

    return items
  }

  const activeCampaigns = campaigns.filter(c => c.status === 'active' || c.status === 'ready')

  // Helper function to get clean campaign folder name (like Opportunity Engine)
  const getCampaignFolderName = (name: string): string => {
    return name.trim().replace(/[/\\:*?"<>|]/g, '-')
  }

  // Stage labels for folder names
  const stageLabels: Record<number, string> = {
    1: 'Stage 1 - Launch',
    2: 'Stage 2 - Amplify',
    3: 'Stage 3 - Engage',
    4: 'Stage 4 - Sustain'
  }

  // Save campaign blueprint to Memory Vault (like Opportunity Engine saves overview)
  const saveCampaignToMemoryVault = async (campaign: Campaign) => {
    if (!organization?.id || !campaign.blueprint) return

    const folderName = getCampaignFolderName(campaign.name)
    console.log('📁 Saving campaign to Memory Vault folder:', `Campaigns/${folderName}`)

    // Build blueprint overview content
    const blueprint = campaign.blueprint
    const overviewContent = `# ${campaign.name}

## Campaign Overview
**Type:** ${campaign.campaignType || 'Campaign'}
**Created:** ${campaign.createdAt || new Date().toISOString()}

${blueprint.overview?.strategicRationale ? `## Strategic Rationale
${blueprint.overview.strategicRationale}` : ''}

${blueprint.part1_positioning ? `## Positioning
**Core Position:** ${blueprint.part1_positioning.whyThisWorks || ''}

### Target Audiences
${blueprint.part1_positioning.targetAudiences?.map((a: string) => `- ${a}`).join('\n') || 'N/A'}

### Key Messages
${blueprint.part1_positioning.keyMessages?.map((m: string) => `- ${m}`).join('\n') || 'N/A'}

### Differentiators
${blueprint.part1_positioning.differentiators?.map((d: string) => `- ${d}`).join('\n') || 'N/A'}
` : ''}

## Execution Inventory
${blueprint.part3_stakeholderOrchestration?.stakeholderOrchestrationPlans?.map((plan: any) => `
### ${plan.stakeholder?.name || 'Stakeholder'}
- **Priority:** ${plan.stakeholder?.priority || 'N/A'}
- **Content Items:** ${plan.influenceLevers?.reduce((sum: number, l: any) =>
    sum + (l.campaign?.mediaPitches?.length || 0) +
    (l.campaign?.socialPosts?.length || 0) +
    (l.campaign?.thoughtLeadership?.length || 0), 0) || 0}
`).join('\n') || 'N/A'}

---
*Campaign ID: ${campaign.id}*`

    try {
      const response = await fetch('/api/content-library/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: {
            type: 'campaign_blueprint',
            title: `${folderName} - Blueprint`,
            content: overviewContent,
            organization_id: organization.id,
            metadata: {
              campaign_id: campaign.id,
              campaign_type: campaign.campaignType,
              is_blueprint: true
            }
          },
          folder: `Campaigns/${folderName}`
        })
      })

      if (response.ok) {
        console.log('✅ Saved campaign blueprint to Memory Vault:', `Campaigns/${folderName}`)
      } else {
        const error = await response.json()
        console.error('❌ Failed to save blueprint:', error)
      }
    } catch (error) {
      console.error('❌ Failed to save blueprint to Memory Vault:', error)
    }
  }

  // Handler for when user clicks "View in Strategic Planning" from Campaign Builder
  const handleViewInActiveCampaigns = async (planData: PlanData) => {
    console.log('📋 CampaignsModule: Received plan data, creating new campaign', {
      sessionId: planData.sessionId,
      campaignType: planData.campaignType,
      hasBlueprint: !!planData.blueprint
    })

    const newCampaign: Campaign = {
      id: planData.sessionId,
      name: planData.blueprint?.overview?.campaignName || 'New Campaign',
      phase: 'Ready to Execute',
      progress: 0,
      status: 'ready',
      blueprint: planData.blueprint,
      sessionId: planData.sessionId,
      campaignType: planData.campaignType,
      createdAt: new Date().toISOString()
    }

    setCampaigns(prev => [newCampaign, ...prev])
    setSelectedCampaign(newCampaign)
    setActiveView('active')

    // Save blueprint to Memory Vault (like Opportunity Engine)
    await saveCampaignToMemoryVault(newCampaign)
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

  // Generate content using niv-content-intelligent-v2
  // Matches the pattern used in StrategicPlanningModuleV3Complete and OpportunitiesModule
  const handleGenerate = async (item: ContentItem) => {
    console.log('🚀 handleGenerate called', {
      itemId: item.id,
      topic: item.topic,
      type: item.type,
      hasSelectedCampaign: !!selectedCampaign,
      hasOrganization: !!organization,
      organizationId: organization?.id
    })

    if (!selectedCampaign || !organization) {
      console.error('❌ handleGenerate early return - missing:', {
        selectedCampaign: !!selectedCampaign,
        organization: !!organization
      })
      return
    }

    setGenerating(prev => new Set(prev).add(item.id))
    setContentItems(prev => prev.map(i =>
      i.id === item.id ? { ...i, status: 'generating' as const } : i
    ))

    try {
      // Build campaignSummary from blueprint - following StrategicPlanningModule pattern
      const blueprint = selectedCampaign.blueprint
      const campaignSummary = {
        organizationName: organization.name || 'Unknown',
        industry: organization.industry || 'Unknown',
        campaignGoal: blueprint?.part1_goalFramework?.primaryObjective || item.topic,
        positioning: blueprint?.part2_strategicPositioning?.primaryPositioning || '',
        coreNarrative: blueprint?.overview?.campaignName || '',
        keyMessages: blueprint?.part2_strategicPositioning?.keyMessages || [],
        targetStakeholders: [item.stakeholder]
      }

      // Build content requirements based on item type - following NIV's expected structure
      let ownedContent: Array<{ type: string; stakeholder: string; purpose: string; keyPoints: string[] }> = []
      let mediaContent: Array<{ type: string; stakeholder: string; purpose: string; keyPoints: string[] }> = []

      if (item.type === 'media_pitch') {
        // Media pitch goes in media array
        mediaContent = [{
          type: 'media_pitch',
          stakeholder: item.stakeholder,
          purpose: item.topic,
          keyPoints: item.details.keyMessages || item.details.keyPoints || []
        }]
      } else if (item.type === 'social_post') {
        ownedContent = [{
          type: 'social_post',
          stakeholder: item.stakeholder,
          purpose: item.topic,
          keyPoints: item.details.keyMessages || item.details.keyPoints || []
        }]
      } else if (item.type === 'thought_leadership') {
        ownedContent = [{
          type: 'thought_leadership',
          stakeholder: item.stakeholder,
          purpose: item.topic,
          keyPoints: item.details.keyMessages || item.details.keyPoints || []
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

      console.log('📤 Calling NIV with campaign_generation mode:', {
        ownedContent: ownedContent.length,
        mediaContent: mediaContent.length,
        campaignSummary
      })

      const { data: result, error } = await supabase.functions.invoke('niv-content-intelligent-v2', {
        body: {
          message: `Generate ${item.type} content for: ${item.topic}`,
          conversationHistory: [],
          organizationContext: {
            conversationId: `campaign-${selectedCampaign.id}-${item.id}`,
            organizationId: organization.id,
            organizationName: organization.name
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
            currentDate: new Date().toISOString().split('T')[0],
            campaignFolder: `campaign-${selectedCampaign.id}`,
            blueprintId: selectedCampaign.id
          }
        }
      })

      if (error) {
        console.error('Content generation failed:', error)
        throw error
      }

      console.log('📥 NIV response:', result)

      // Extract content from the response - handle multiple response formats
      let generatedContent = ''
      if (result?.generatedContent && Array.isArray(result.generatedContent) && result.generatedContent.length > 0) {
        // Primary format: generatedContent array
        generatedContent = result.generatedContent[0].content || JSON.stringify(result.generatedContent[0], null, 2)
      } else if (result?.response) {
        generatedContent = result.response
      } else if (typeof result === 'string') {
        generatedContent = result
      } else if (result) {
        generatedContent = JSON.stringify(result, null, 2)
      }

      console.log('✅ Content generated for:', item.topic, '- Length:', generatedContent.length)

      // Update local state
      setContentItems(prev => prev.map(i =>
        i.id === item.id ? {
          ...i,
          status: 'generated' as const,
          generatedContent,
          generatedAt: new Date().toISOString()
        } : i
      ))

      // Save to Memory Vault for persistence (like Opportunity Engine)
      const campaignName = selectedCampaign.blueprint?.overview?.campaignName || 'Untitled Campaign'
      const folderName = getCampaignFolderName(campaignName)
      const stage = item.leverPriority || item.stakeholderPriority || 4
      const stageFolderName = stageLabels[stage] || `Stage ${stage}`

      try {
        // Use direct API call like Opportunity Engine for reliability
        const response = await fetch('/api/content-library/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: {
              type: item.type,
              title: item.topic,
              content: generatedContent,
              organization_id: organization.id,
              metadata: {
                campaign_id: selectedCampaign.id,
                campaign_name: campaignName,
                stakeholder: item.stakeholder,
                stage: stage,
                stage_name: stageFolderName,
                lever_name: item.leverName,
                target: item.target,
                details: item.details
              }
            },
            folder: `Campaigns/${folderName}/${stageFolderName}`
          })
        })

        if (response.ok) {
          const savedData = await response.json()
          console.log('💾 Saved to Memory Vault:', `Campaigns/${folderName}/${stageFolderName}/${item.topic}`, 'ID:', savedData.id)

          // Store the Memory Vault ID on the content item for result tracking
          if (savedData.id) {
            setContentItems(prev => prev.map(i =>
              i.id === item.id ? { ...i, memoryVaultId: savedData.id } : i
            ))
          }
        } else {
          const error = await response.json()
          console.error('❌ Failed to save to Memory Vault:', error)
        }
      } catch (mvError) {
        console.error('❌ Failed to save to Memory Vault:', mvError)
        // Don't fail the generation if Memory Vault save fails
      }
    } catch (error) {
      console.error('Generation error:', error)
      setContentItems(prev => prev.map(i =>
        i.id === item.id ? { ...i, status: 'pending' as const } : i
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
    // Filter to only pending items that can be generated
    const pendingItems = items.filter(item =>
      item.status === 'pending' && item.type !== 'user_action'
    )

    if (pendingItems.length === 0) return

    console.log(`🚀 Batch generating ${pendingItems.length} items in parallel`)

    // Generate all items in parallel for faster execution
    await Promise.all(pendingItems.map(item => handleGenerate(item)))
  }

  // Generate all items for a specific stage (max ~30 at a time)
  const handleBatchGenerateByStage = async (stage: number) => {
    const stageItems = contentItems.filter(item =>
      (item.leverPriority || item.stakeholderPriority) === stage &&
      item.status === 'pending' &&
      item.type !== 'user_action'
    )

    if (stageItems.length === 0) {
      console.log(`No pending items for stage ${stage}`)
      return
    }

    // Limit to ~30 items to avoid overwhelming the API
    const MAX_PARALLEL = 30
    const itemsToGenerate = stageItems.slice(0, MAX_PARALLEL)

    console.log(`🚀 Generating ${itemsToGenerate.length} items for ${stageLabels[stage]} (max ${MAX_PARALLEL})`)

    if (stageItems.length > MAX_PARALLEL) {
      console.log(`⚠️ ${stageItems.length - MAX_PARALLEL} items remaining - run again after this batch completes`)
    }

    await Promise.all(itemsToGenerate.map(item => handleGenerate(item)))

    console.log(`✅ Batch generation complete`)
  }

  const handleCopyContent = async (content: string) => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadContent = (item: ContentItem) => {
    if (!item.generatedContent) return
    const blob = new Blob([item.generatedContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${item.type}-${item.topic.substring(0, 30)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Get result field configuration for content type
  const getResultFieldForType = (contentType: string) => {
    return RESULT_FIELDS[contentType] || RESULT_FIELDS['user_action']
  }

  // Mark content as complete and persist to Memory Vault
  const handleMarkComplete = async (item: ContentItem) => {
    const executedAt = new Date().toISOString()

    // Update local state immediately
    setContentItems(prev => prev.map(i =>
      i.id === item.id ? {
        ...i,
        executed: true,
        executedAt
      } : i
    ))

    // Persist to Memory Vault if we have the ID
    if (item.memoryVaultId) {
      try {
        await updateMemoryVaultContent(item.memoryVaultId, {
          executed: true,
          executed_at: executedAt
        } as any)
        console.log('✅ Marked complete in Memory Vault:', item.memoryVaultId)
      } catch (error) {
        console.error('❌ Failed to persist completion to Memory Vault:', error)
      }
    }
  }

  // Update result data and persist to Memory Vault
  const handleUpdateProgressResult = async (item: ContentItem) => {
    setSavingProgress(true)

    const resultField = getResultFieldForType(item.type)
    const resultData = {
      type: resultField.resultType as 'media_response' | 'engagement' | 'pickup' | 'other',
      value: progressResultValue,
      notes: progressResultNotes
    }

    // Update local state
    setContentItems(prev => prev.map(i =>
      i.id === item.id ? { ...i, result: resultData } : i
    ))

    // Persist to Memory Vault if we have the ID
    if (item.memoryVaultId) {
      try {
        await updateMemoryVaultContent(item.memoryVaultId, { result: resultData } as any)
        console.log('✅ Updated result in Memory Vault:', item.memoryVaultId)
      } catch (error) {
        console.error('❌ Failed to persist result to Memory Vault:', error)
      }
    }

    // Reset form state
    setEditingProgressResult(null)
    setProgressResultValue('')
    setProgressResultNotes('')
    setSavingProgress(false)
  }

  // Calendar functions
  const handleAddToCalendar = (item: ContentItem) => {
    setAddToCalendarItem(item)
    setAddToCalendarDate(new Date().toISOString().split('T')[0])
  }

  const confirmAddToCalendar = () => {
    if (!addToCalendarItem || !selectedCampaign) return

    const newCalendarItem: CalendarItem = {
      id: `cal-${Date.now()}`,
      type: 'campaign_content',
      title: addToCalendarItem.topic,
      description: addToCalendarItem.target,
      scheduledDate: addToCalendarDate || undefined,
      sourceType: 'campaign_builder',
      sourceId: selectedCampaign.sessionId,
      campaignId: selectedCampaign.id,
      contentItemId: addToCalendarItem.id,
      contentItem: addToCalendarItem,
      status: 'scheduled',
      createdAt: new Date().toISOString()
    }

    setCalendarItems(prev => [...prev, newCalendarItem])
    setAddToCalendarItem(null)
    setAddToCalendarDate('')
  }

  const handleCreateManualEvent = () => {
    if (!manualEventTitle) return

    const newCalendarItem: CalendarItem = {
      id: `cal-${Date.now()}`,
      type: 'manual_event',
      title: manualEventTitle,
      description: manualEventDescription,
      scheduledDate: manualEventDate || undefined,
      sourceType: 'manual',
      status: 'scheduled',
      createdAt: new Date().toISOString()
    }

    setCalendarItems(prev => [...prev, newCalendarItem])
    setShowManualEventModal(false)
    setManualEventTitle('')
    setManualEventDescription('')
    setManualEventDate('')
  }

  const handleToggleComplete = (calItem: CalendarItem) => {
    console.log('🔄 handleToggleComplete called', { itemId: calItem.id, currentStatus: calItem.status })
    const isCompletingNow = calItem.status !== 'completed'

    setCalendarItems(prev => {
      const updated = prev.map(item =>
        item.id === calItem.id
          ? {
              ...item,
              status: item.status === 'completed' ? 'scheduled' as const : 'completed' as const,
              completedAt: item.status === 'completed' ? undefined : new Date().toISOString()
            }
          : item
      )
      console.log('✅ Calendar items updated:', updated.find(i => i.id === calItem.id)?.status)
      return updated
    })

    // If marking as complete (not uncompleting), automatically open results modal
    if (isCompletingNow) {
      // Use updated item with completed status
      const updatedItem: CalendarItem = {
        ...calItem,
        status: 'completed',
        completedAt: new Date().toISOString()
      }
      setTimeout(() => {
        handleOpenResultModal(updatedItem)
      }, 100)
    }
  }

  const handleOpenResultModal = (calItem: CalendarItem) => {
    setEditingResultItem(calItem)
    setResultType(calItem.result?.type || 'other')
    setResultValue(calItem.result?.value || '')
    setResultNotes(calItem.result?.notes || '')
  }

  const handleSaveResult = async () => {
    if (!editingResultItem) return

    const updatedResult = {
      type: resultType,
      value: resultValue,
      notes: resultNotes
    }

    // Update local state
    setCalendarItems(prev => prev.map(item =>
      item.id === editingResultItem.id
        ? {
            ...item,
            result: updatedResult
          }
        : item
    ))

    // If this is campaign content, also save to content_library for playbook synthesis
    // Note: This is optional - don't block the UI if it fails
    if (editingResultItem.type === 'campaign_content' && editingResultItem.contentItem && organization) {
      try {
        // Save execution result to content_library for playbook system
        const insertData = {
          organization_id: organization.id,
          content_type: editingResultItem.contentItem.type || 'general',
          title: editingResultItem.title || 'Untitled',
          content: editingResultItem.contentItem.generatedContent || 'No content',
          topic: editingResultItem.contentItem.details?.topic || 'general',
          execution_score: resultType === 'pickup' ? 0.9 :
                          resultType === 'media_response' ? 0.8 :
                          resultType === 'engagement' ? 0.7 : 0.5,
          executed: true,
          executed_at: editingResultItem.completedAt || new Date().toISOString(),
          feedback: resultNotes || null,
          metadata: {
            result_type: resultType,
            result_value: resultValue,
            source: 'campaign_builder',
            campaign_id: editingResultItem.campaignId,
            stakeholder: editingResultItem.contentItem.stakeholder,
            target: editingResultItem.contentItem.target
          }
        }

        console.log('📤 Saving to content_library:', insertData)

        const { error } = await supabase
          .from('content_library')
          .insert(insertData)

        if (error) {
          // Log the full error for debugging but don't block UI
          console.warn('Content library save skipped (non-blocking):', error.message || JSON.stringify(error))
        } else {
          console.log('✅ Result saved to content_library for playbook synthesis')
        }
      } catch (err) {
        // Non-blocking - just log and continue
        console.warn('Content library save error (non-blocking):', err)
      }
    }

    setEditingResultItem(null)
    setResultType('other')
    setResultValue('')
    setResultNotes('')
  }

  const getContentTypeInfo = (type: ContentItem['type']) => {
    switch (type) {
      case 'media_pitch':
        return { label: 'Media Pitch', icon: FileText, color: 'burnt-orange' }
      case 'social_post':
        return { label: 'Social Post', icon: Share2, color: 'burnt-orange' }
      case 'thought_leadership':
        return { label: 'Thought Leadership', icon: FileText, color: 'burnt-orange' }
      case 'user_action':
        return { label: 'Action Required', icon: Users, color: 'grey-500' }
    }
  }

  const priorityLabels: Record<number, { label: string; description: string }> = {
    1: { label: 'Stage 1: Launch', description: 'Must-have content for launch success' },
    2: { label: 'Stage 2: Amplify', description: 'High-impact amplification content' },
    3: { label: 'Stage 3: Engage', description: 'Ongoing engagement content' },
    4: { label: 'Stage 4: Sustain', description: 'Long-term presence building' }
  }

  // Group items by stage (leverPriority), not by stakeholder priority
  // This ensures all stakeholders have tasks in each stage
  const itemsByPriority = contentItems.reduce((acc, item) => {
    // Use leverPriority for stage grouping (what content is produced when)
    // Fall back to stakeholderPriority for backwards compatibility
    const stage = item.leverPriority || item.stakeholderPriority || 4
    if (!acc[stage]) acc[stage] = []
    acc[stage].push(item)
    return acc
  }, {} as Record<number, ContentItem[]>)

  const totalItems = contentItems.length
  const generatedItems = contentItems.filter(i => i.status === 'generated' || i.status === 'published').length
  const progressPercent = totalItems > 0 ? Math.round((generatedItems / totalItems) * 100) : 0

  // Calendar view helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startDayOfWeek = firstDay.getDay()

    const days: (Date | null)[] = []
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }
    return days
  }

  const getItemsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return calendarItems.filter(item => item.scheduledDate === dateStr)
  }

  const calendarDays = useMemo(() => getDaysInMonth(currentDate), [currentDate])

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1))
      return newDate
    })
  }

  const calendarStats = useMemo(() => {
    const total = calendarItems.length
    const completed = calendarItems.filter(i => i.status === 'completed').length
    const scheduled = calendarItems.filter(i => i.scheduledDate).length
    const withResults = calendarItems.filter(i => i.result).length
    return { total, completed, scheduled, withResults }
  }, [calendarItems])

  const sidebarItems = [
    { id: 'planner' as SidebarView, label: 'Calendar', icon: Calendar, badge: calendarStats.scheduled },
    { id: 'builder' as SidebarView, label: 'Campaign Builder', icon: Wrench },
    { id: 'active' as SidebarView, label: 'Active Campaigns', icon: MessageSquare, badge: activeCampaigns.length }
  ]

  return (
    <div className="flex w-full h-full overflow-hidden bg-[var(--grey-100)]">
      {/* Sidebar */}
      <div className="w-[260px] bg-white border-r border-[var(--grey-200)] flex flex-col flex-shrink-0">
        <div className="px-5 py-4 border-b border-[var(--grey-200)]">
          <div
            className="text-[0.65rem] uppercase tracking-wider mb-1"
            style={{ color: 'var(--burnt-orange)', fontFamily: 'var(--font-display)' }}
          >
            Strategy
          </div>
          <div
            className="text-lg font-semibold"
            style={{ color: 'var(--charcoal)', fontFamily: 'var(--font-display)' }}
          >
            Campaigns
          </div>
        </div>

        <div className="flex-1 py-3">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full px-5 py-3 flex items-center gap-3 text-sm transition-colors ${
                activeView === item.id
                  ? 'bg-[var(--grey-100)] text-[var(--charcoal)] font-medium'
                  : 'text-[var(--grey-600)] hover:bg-[var(--grey-50)] hover:text-[var(--charcoal)]'
              }`}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className="ml-auto px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ background: 'var(--burnt-orange-muted)', color: 'var(--burnt-orange)' }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 overflow-y-auto ${activeView === 'builder' || activeView === 'active' ? 'bg-[var(--charcoal)]' : ''}`}>

        {/* CALENDAR VIEW */}
        {activeView === 'planner' && (
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div
                  className="text-[0.65rem] uppercase tracking-[0.15em] text-[var(--burnt-orange)] flex items-center gap-2 mb-2"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  <Calendar className="w-3 h-3" />
                  Campaigns
                </div>
                <h1
                  className="text-[1.5rem] font-normal"
                  style={{ color: 'var(--charcoal)', fontFamily: 'var(--font-serif)' }}
                >
                  Campaign Calendar
                </h1>
                <p className="text-[var(--grey-500)] text-sm mt-1">
                  {calendarStats.completed} of {calendarStats.total} items completed
                </p>
              </div>
              <button
                onClick={() => setShowManualEventModal(true)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors hover:brightness-110 flex items-center gap-2"
                style={{ background: 'var(--burnt-orange)', fontFamily: 'var(--font-display)' }}
              >
                <Plus className="w-4 h-4" />
                Add Event
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-[var(--grey-200)] p-4">
                <div className="text-2xl font-bold" style={{ color: 'var(--charcoal)' }}>{calendarStats.total}</div>
                <div className="text-xs" style={{ color: 'var(--grey-500)' }}>Total Items</div>
              </div>
              <div className="bg-white rounded-xl border border-[var(--grey-200)] p-4">
                <div className="text-2xl font-bold" style={{ color: 'var(--burnt-orange)' }}>{calendarStats.scheduled}</div>
                <div className="text-xs" style={{ color: 'var(--grey-500)' }}>Scheduled</div>
              </div>
              <div className="bg-white rounded-xl border border-[var(--grey-200)] p-4">
                <div className="text-2xl font-bold" style={{ color: '#22c55e' }}>{calendarStats.completed}</div>
                <div className="text-xs" style={{ color: 'var(--grey-500)' }}>Completed</div>
              </div>
              <div className="bg-white rounded-xl border border-[var(--grey-200)] p-4">
                <div className="text-2xl font-bold" style={{ color: '#8b5cf6' }}>{calendarStats.withResults}</div>
                <div className="text-xs" style={{ color: 'var(--grey-500)' }}>With Results</div>
              </div>
            </div>

            {/* Calendar Navigation */}
            <div className="bg-white rounded-xl border border-[var(--grey-200)] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-[var(--grey-200)]">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 rounded-lg hover:bg-[var(--grey-100)] transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" style={{ color: 'var(--grey-500)' }} />
                </button>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--charcoal)', fontFamily: 'var(--font-display)' }}>
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 rounded-lg hover:bg-[var(--grey-100)] transition-colors"
                >
                  <ChevronRight className="w-5 h-5" style={{ color: 'var(--grey-500)' }} />
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div
                    key={day}
                    className="p-3 text-center text-xs font-medium border-b border-[var(--grey-200)]"
                    style={{ color: 'var(--grey-500)' }}
                  >
                    {day}
                  </div>
                ))}
                {calendarDays.map((day, index) => {
                  const items = day ? getItemsForDate(day) : []
                  const isToday = day && day.toDateString() === new Date().toDateString()

                  return (
                    <div
                      key={index}
                      className={`min-h-[100px] p-2 border-b border-r border-[var(--grey-200)] ${
                        day ? 'bg-white' : 'bg-[var(--grey-50)]'
                      }`}
                    >
                      {day && (
                        <>
                          <div
                            className={`text-sm font-medium mb-1 ${isToday ? 'w-6 h-6 rounded-full flex items-center justify-center text-white' : ''}`}
                            style={{
                              color: isToday ? 'white' : 'var(--charcoal)',
                              background: isToday ? 'var(--burnt-orange)' : undefined
                            }}
                          >
                            {day.getDate()}
                          </div>
                          <div className="space-y-1">
                            {items.slice(0, 3).map(item => (
                              <div
                                key={item.id}
                                className={`text-[0.65rem] p-1 rounded truncate cursor-pointer transition-colors ${
                                  item.status === 'completed' ? 'line-through opacity-60' : ''
                                }`}
                                style={{
                                  background: item.type === 'manual_event' ? 'var(--grey-200)' : 'var(--burnt-orange-muted)',
                                  color: item.type === 'manual_event' ? 'var(--grey-600)' : 'var(--burnt-orange)'
                                }}
                                onClick={() => handleOpenResultModal(item)}
                              >
                                {item.title.substring(0, 20)}
                              </div>
                            ))}
                            {items.length > 3 && (
                              <div className="text-[0.6rem]" style={{ color: 'var(--grey-500)' }}>
                                +{items.length - 3} more
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* List View of All Items */}
            <div className="mt-6 bg-white rounded-xl border border-[var(--grey-200)] p-4">
              <h3 className="font-semibold mb-4" style={{ color: 'var(--charcoal)', fontFamily: 'var(--font-display)' }}>
                All Calendar Items
              </h3>
              {calendarItems.length > 0 ? (
                <div className="space-y-2">
                  {calendarItems.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-[var(--grey-200)] hover:border-[var(--burnt-orange)] transition-colors"
                    >
                      <button
                        onClick={() => handleToggleComplete(item)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          item.status === 'completed'
                            ? 'bg-[#22c55e] border-[#22c55e]'
                            : 'border-[var(--grey-300)] hover:border-[var(--burnt-orange)]'
                        }`}
                      >
                        {item.status === 'completed' && <Check className="w-3 h-3 text-white" />}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className={`text-sm font-medium ${item.status === 'completed' ? 'line-through opacity-60' : ''}`} style={{ color: 'var(--charcoal)' }}>
                            {item.title}
                          </div>
                          {item.contentItem?.type && (
                            <span
                              className="px-2 py-0.5 rounded text-[0.6rem] font-medium uppercase"
                              style={{
                                background: item.contentItem.type === 'media_pitch' ? 'rgba(59, 130, 246, 0.1)' :
                                           item.contentItem.type === 'social_post' ? 'rgba(139, 92, 246, 0.1)' :
                                           item.contentItem.type === 'thought_leadership' ? 'rgba(236, 72, 153, 0.1)' :
                                           'var(--grey-100)',
                                color: item.contentItem.type === 'media_pitch' ? '#3b82f6' :
                                       item.contentItem.type === 'social_post' ? '#8b5cf6' :
                                       item.contentItem.type === 'thought_leadership' ? '#ec4899' :
                                       'var(--grey-500)'
                              }}
                            >
                              {item.contentItem.type.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--grey-500)' }}>
                          {item.scheduledDate || 'Unscheduled'} • {item.type === 'manual_event' ? 'Manual Event' : item.contentItem?.stakeholder || 'Campaign'}
                        </div>
                      </div>
                      {item.status === 'completed' && (
                        <button
                          onClick={() => handleOpenResultModal(item)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                          style={{
                            background: item.result ? 'rgba(139, 92, 246, 0.1)' : 'var(--grey-100)',
                            color: item.result ? '#8b5cf6' : 'var(--grey-500)'
                          }}
                        >
                          <TrendingUp className="w-3 h-3" />
                          {item.result ? 'Edit Result' : 'Add Result'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--grey-400)' }} />
                  <p className="text-sm" style={{ color: 'var(--grey-500)' }}>
                    No items in your calendar yet. Add events manually or from your campaigns.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* BUILDER - Campaign Builder Wizard */}
        {activeView === 'builder' && (
          <CampaignBuilderWizard onViewInPlanner={handleViewInActiveCampaigns} />
        )}

        {/* ACTIVE CAMPAIGNS */}
        {activeView === 'active' && (
          <>
            {selectedCampaign ? (
              <div className="h-full flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-[var(--grey-800)]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setSelectedCampaign(null)}
                        className="text-[var(--grey-400)] hover:text-white transition-colors"
                      >
                        <ChevronRight className="w-5 h-5 rotate-180" />
                      </button>
                      <div>
                        <h2
                          className="text-xl font-semibold"
                          style={{ color: 'var(--white)', fontFamily: 'var(--font-display)' }}
                        >
                          {selectedCampaign.name}
                        </h2>
                        <p className="text-sm" style={{ color: 'var(--grey-500)' }}>
                          {selectedCampaign.blueprint?.part1_goalFramework?.primaryObjective || 'Strategic Execution Plan'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-2xl font-bold" style={{ color: 'var(--burnt-orange)' }}>
                          {progressPercent}%
                        </div>
                        <div className="text-xs" style={{ color: 'var(--grey-500)' }}>
                          {generatedItems} of {totalItems} items
                        </div>
                      </div>
                      {/* Removed Start Execution button - generate stage by stage instead */}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        background: selectedCampaign.status === 'ready' ? 'var(--burnt-orange-muted)' : 'rgba(34, 197, 94, 0.2)',
                        color: selectedCampaign.status === 'ready' ? 'var(--burnt-orange)' : '#22c55e'
                      }}
                    >
                      {selectedCampaign.status === 'ready' ? 'Ready to Execute' : 'In Progress'}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--grey-500)' }}>
                      {selectedCampaign.campaignType === 'VECTOR_CAMPAIGN' ? 'Vector Campaign' :
                       selectedCampaign.campaignType === 'PR_CAMPAIGN' ? 'PR Campaign' : 'Campaign'}
                    </span>
                  </div>
                </div>

                {/* View Mode Tabs */}
                <div className="px-6 pt-4 flex gap-2 border-b border-[var(--grey-800)]">
                  <button
                    onClick={() => setCampaignViewMode('execution')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
                      campaignViewMode === 'execution'
                        ? 'bg-[var(--burnt-orange-muted)] text-[var(--burnt-orange)] border border-[var(--burnt-orange)] border-b-0'
                        : 'bg-[var(--grey-800)] text-[var(--grey-400)] hover:bg-[var(--grey-700)]'
                    }`}
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    <Target className="w-4 h-4" />
                    Execution
                  </button>
                  <button
                    onClick={() => setCampaignViewMode('blueprint')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
                      campaignViewMode === 'blueprint'
                        ? 'bg-[var(--burnt-orange-muted)] text-[var(--burnt-orange)] border border-[var(--burnt-orange)] border-b-0'
                        : 'bg-[var(--grey-800)] text-[var(--grey-400)] hover:bg-[var(--grey-700)]'
                    }`}
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    <FileText className="w-4 h-4" />
                    Blueprint
                  </button>
                  <button
                    onClick={() => setCampaignViewMode('progress')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
                      campaignViewMode === 'progress'
                        ? 'bg-[var(--burnt-orange-muted)] text-[var(--burnt-orange)] border border-[var(--burnt-orange)] border-b-0'
                        : 'bg-[var(--grey-800)] text-[var(--grey-400)] hover:bg-[var(--grey-700)]'
                    }`}
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    <BarChart3 className="w-4 h-4" />
                    Progress
                  </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6">
                  {/* Execution View */}
                  {campaignViewMode === 'execution' && (
                    contentItems.length > 0 ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4].map(priority => {
                        const items = itemsByPriority[priority] || []
                        if (items.length === 0) return null

                        const isExpanded = expandedPriorities.has(priority)
                        const { label, description } = priorityLabels[priority]

                        const stakeholderGroups = items.reduce((acc, item) => {
                          if (!acc[item.stakeholder]) acc[item.stakeholder] = []
                          acc[item.stakeholder].push(item)
                          return acc
                        }, {} as Record<string, ContentItem[]>)

                        return (
                          <div
                            key={priority}
                            className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl overflow-hidden"
                          >
                            <button
                              onClick={() => togglePriority(priority)}
                              className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                {isExpanded ? (
                                  <ChevronDown className="w-5 h-5" style={{ color: 'var(--grey-500)' }} />
                                ) : (
                                  <ChevronRight className="w-5 h-5" style={{ color: 'var(--grey-500)' }} />
                                )}
                                <div className="text-left">
                                  <p className="font-semibold" style={{ color: 'var(--burnt-orange)', fontFamily: 'var(--font-display)' }}>
                                    {label}
                                  </p>
                                  <p className="text-sm" style={{ color: 'var(--grey-500)' }}>{description}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right mr-2">
                                  <p className="text-xl font-bold" style={{ color: 'var(--white)' }}>{items.length}</p>
                                  <p className="text-xs" style={{ color: 'var(--grey-600)' }}>items</p>
                                </div>
                                {/* Generate Stage button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleBatchGenerateByStage(priority)
                                  }}
                                  disabled={items.filter(i => i.status === 'pending' && i.type !== 'user_action').length === 0}
                                  className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                  style={{ background: 'var(--burnt-orange)', fontFamily: 'var(--font-display)' }}
                                >
                                  <Sparkles className="w-4 h-4" />
                                  Generate Stage ({items.filter(i => i.status === 'pending' && i.type !== 'user_action').length})
                                </button>
                              </div>
                            </button>

                            {isExpanded && (
                              <div className="p-4 pt-0 space-y-4">
                                {Object.entries(stakeholderGroups).map(([stakeholder, stakeholderItems]) => (
                                  <div key={stakeholder} className="bg-[var(--grey-800)]/50 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                      <h4 className="font-semibold" style={{ color: 'var(--white)', fontFamily: 'var(--font-display)' }}>
                                        {stakeholder}
                                      </h4>
                                      <button
                                        onClick={() => handleBatchGenerate(stakeholderItems)}
                                        className="text-xs px-3 py-1.5 rounded-lg font-medium text-white transition-colors hover:brightness-110"
                                        style={{ background: 'var(--burnt-orange)' }}
                                      >
                                        Generate All ({stakeholderItems.filter(i => i.status === 'pending' && i.type !== 'user_action').length})
                                      </button>
                                    </div>

                                    <div className="space-y-2">
                                      {stakeholderItems.map(item => {
                                        const typeInfo = getContentTypeInfo(item.type)
                                        const IconComponent = typeInfo.icon
                                        const isInCalendar = calendarItems.some(ci => ci.contentItemId === item.id)

                                        return (
                                          <div
                                            key={item.id}
                                            className="p-3 bg-[var(--grey-900)] border border-[var(--grey-700)] rounded-lg"
                                          >
                                            <div className="flex items-start justify-between gap-3">
                                              <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                  <IconComponent className="w-4 h-4" style={{ color: `var(--${typeInfo.color})` }} />
                                                  <span className="text-xs font-medium" style={{ color: `var(--${typeInfo.color})` }}>
                                                    {typeInfo.label}
                                                  </span>
                                                  {item.status === 'generating' || generating.has(item.id) ? (
                                                    <Sparkles className="w-4 h-4 animate-pulse" style={{ color: 'var(--burnt-orange)' }} />
                                                  ) : item.status === 'generated' ? (
                                                    <CheckCircle2 className="w-4 h-4" style={{ color: '#22c55e' }} />
                                                  ) : (
                                                    <Clock className="w-4 h-4" style={{ color: 'var(--grey-500)' }} />
                                                  )}
                                                  {isInCalendar && (
                                                    <span className="text-[0.6rem] px-1.5 py-0.5 rounded" style={{ background: 'var(--grey-700)', color: 'var(--grey-400)' }}>
                                                      In Calendar
                                                    </span>
                                                  )}
                                                </div>
                                                <p className="text-sm font-medium mb-1" style={{ color: 'var(--white)' }}>
                                                  {item.topic}
                                                </p>
                                                {item.target && (
                                                  <p className="text-xs" style={{ color: 'var(--grey-500)' }}>{item.target}</p>
                                                )}
                                              </div>
                                              <div className="flex items-center gap-2">
                                                {!isInCalendar && (
                                                  <button
                                                    onClick={() => handleAddToCalendar(item)}
                                                    className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
                                                    title="Add to Calendar"
                                                  >
                                                    <CalendarPlus className="w-4 h-4" style={{ color: 'var(--grey-500)' }} />
                                                  </button>
                                                )}
                                                {item.type !== 'user_action' && item.status === 'pending' && (
                                                  <button
                                                    onClick={() => handleGenerate(item)}
                                                    disabled={generating.has(item.id)}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    style={{ background: 'var(--burnt-orange)' }}
                                                  >
                                                    {generating.has(item.id) ? 'Generating...' : 'Generate'}
                                                  </button>
                                                )}
                                                {item.status === 'generated' && (
                                                  <button
                                                    onClick={() => setViewingContent(item)}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                                                    style={{ background: 'var(--burnt-orange-muted)', color: 'var(--burnt-orange)' }}
                                                  >
                                                    <Eye className="w-3 h-3" />
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
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : null
                  )}

                  {/* Blueprint View */}
                  {campaignViewMode === 'blueprint' && selectedCampaign?.blueprint && (
                    <div className="bg-[var(--grey-900)] rounded-xl border border-[var(--grey-800)] p-6">
                      {selectedCampaign.blueprint.contentRequirements ? (
                        // PR Campaign
                        <PRBriefPresentation
                          brief={selectedCampaign.blueprint}
                          onRefine={() => {}}
                          onExport={() => {}}
                          onExecute={() => {}}
                          isRefining={false}
                        />
                      ) : (selectedCampaign.blueprint as any).threeTierTacticalPlan ? (
                        // GEO-VECTOR Campaign
                        <GeoVectorBlueprintPresentation
                          blueprint={selectedCampaign.blueprint as any}
                          onRefine={() => {}}
                          onExport={() => {}}
                          onExecute={() => {}}
                          isRefining={false}
                        />
                      ) : (
                        // VECTOR Campaign
                        <BlueprintV3Presentation
                          blueprint={selectedCampaign.blueprint}
                          blueprintType="VECTOR_CAMPAIGN"
                          onRefine={() => {}}
                          onExport={() => {}}
                          onExecute={() => {}}
                          isRefining={false}
                        />
                      )}
                    </div>
                  )}

                  {/* Progress View */}
                  {campaignViewMode === 'progress' && (
                    <div className="space-y-6">
                      <div className="bg-[var(--grey-900)] rounded-xl border border-[var(--grey-800)] p-6">
                        <h3 className="text-xl font-bold text-white mb-6" style={{ fontFamily: 'var(--font-display)' }}>
                          Campaign Progress
                        </h3>

                        {/* Overall Progress - Two bars: Generated and Completed */}
                        <div className="mb-8 space-y-4">
                          {/* Completed (Executed) Progress - This is the primary metric */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-white">Actual Completion</span>
                              <span className="text-2xl font-bold" style={{ color: '#22c55e' }}>
                                {Math.round((contentItems.filter(i => i.executed).length / Math.max(contentItems.length, 1)) * 100)}%
                              </span>
                            </div>
                            <div className="h-4 bg-[var(--grey-800)] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  background: '#22c55e',
                                  width: `${(contentItems.filter(i => i.executed).length / Math.max(contentItems.length, 1)) * 100}%`
                                }}
                              />
                            </div>
                            <div className="flex justify-between mt-2 text-xs">
                              <span style={{ color: '#22c55e' }}>{contentItems.filter(i => i.executed).length} completed</span>
                              <span className="text-[var(--grey-500)]">{contentItems.length} total items</span>
                            </div>
                          </div>

                          {/* Generated Progress - Secondary metric */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-[var(--grey-400)]">Content Generated</span>
                              <span className="text-lg font-medium" style={{ color: 'var(--burnt-orange)' }}>
                                {contentItems.filter(i => i.status === 'generated' || i.status === 'published').length}/{contentItems.length}
                              </span>
                            </div>
                            <div className="h-2 bg-[var(--grey-800)] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  background: 'var(--burnt-orange)',
                                  width: `${(contentItems.filter(i => i.status === 'generated' || i.status === 'published').length / Math.max(contentItems.length, 1)) * 100}%`
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Progress by Stage */}
                        <h4 className="text-sm font-semibold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                          Progress by Stage
                        </h4>
                        <div className="space-y-4">
                          {[1, 2, 3, 4].map(stage => {
                            const stageItems = contentItems.filter(i =>
                              (i.leverPriority || i.stakeholderPriority) === stage
                            )
                            if (stageItems.length === 0) return null

                            const generated = stageItems.filter(i => i.status === 'generated' || i.status === 'published').length
                            const completed = stageItems.filter(i => i.executed).length
                            const completedPercent = Math.round((completed / stageItems.length) * 100)
                            const stageLabel = stageLabels[stage] || `Stage ${stage}`

                            return (
                              <div key={stage} className="bg-[var(--grey-800)]/50 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="font-medium" style={{ color: 'var(--burnt-orange)', fontFamily: 'var(--font-display)' }}>
                                    {stageLabel}
                                  </span>
                                  <div className="flex items-center gap-4 text-sm">
                                    <span className="text-[var(--grey-400)]">
                                      <span style={{ color: 'var(--burnt-orange)' }}>{generated}</span> generated
                                    </span>
                                    <span className="text-[var(--grey-400)]">
                                      <span style={{ color: '#22c55e' }}>{completed}</span>/{stageItems.length} completed
                                    </span>
                                  </div>
                                </div>
                                <div className="h-2 bg-[var(--grey-700)] rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                      background: completedPercent === 100 ? '#22c55e' : completedPercent > 0 ? '#22c55e' : 'var(--grey-600)',
                                      width: `${completedPercent}%`
                                    }}
                                  />
                                </div>

                                {/* Show items in this stage */}
                                <div className="mt-4 space-y-2">
                                  {stageItems.map(item => {
                                    const typeInfo = getContentTypeInfo(item.type)
                                    const IconComponent = typeInfo.icon

                                    return (
                                      <div
                                        key={item.id}
                                        className="flex items-center justify-between p-3 bg-[var(--grey-900)] rounded-lg border border-[var(--grey-700)]"
                                      >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                          <IconComponent className="w-4 h-4 flex-shrink-0" style={{ color: typeInfo.color }} />
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm text-white truncate">{item.topic}</p>
                                            <p className="text-xs text-[var(--grey-500)]">{item.stakeholder}</p>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                          {/* Status badge */}
                                          {item.executed ? (
                                            <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400 flex items-center gap-1">
                                              <Check className="w-3 h-3" />
                                              Completed
                                            </span>
                                          ) : item.status === 'generated' || item.status === 'published' ? (
                                            <span className="px-2 py-1 text-xs rounded-full bg-[var(--burnt-orange-muted)] text-[var(--burnt-orange)]">
                                              Generated
                                            </span>
                                          ) : (
                                            <span className="px-2 py-1 text-xs rounded-full bg-[var(--grey-700)] text-[var(--grey-400)]">
                                              Pending
                                            </span>
                                          )}

                                          {/* Mark as completed button - only show for generated items */}
                                          {(item.status === 'generated' || item.status === 'published') && !item.executed && (
                                            <button
                                              onClick={() => handleMarkComplete(item)}
                                              className="px-3 py-1 text-xs rounded-lg font-medium transition-colors hover:brightness-110"
                                              style={{ background: '#22c55e', color: 'white' }}
                                            >
                                              Mark Complete
                                            </button>
                                          )}

                                          {/* Track results button - show for completed items */}
                                          {item.executed && (
                                            <button
                                              onClick={() => {
                                                if (editingProgressResult === item.id) {
                                                  setEditingProgressResult(null)
                                                  setProgressResultValue('')
                                                  setProgressResultNotes('')
                                                } else {
                                                  setEditingProgressResult(item.id)
                                                  setProgressResultValue(item.result?.value || '')
                                                  setProgressResultNotes(item.result?.notes || '')
                                                }
                                              }}
                                              className="px-3 py-1 text-xs rounded-lg font-medium border transition-colors hover:bg-white/5"
                                              style={{ borderColor: 'var(--grey-600)', color: 'var(--grey-300)' }}
                                            >
                                              {editingProgressResult === item.id ? 'Cancel' : (item.result?.notes || item.result?.value ? 'Edit Results' : 'Track Results')}
                                            </button>
                                          )}
                                        </div>

                                        {/* Inline Result Form - shown when editing */}
                                        {editingProgressResult === item.id && (
                                          <div
                                            className="mt-3 p-4 rounded-lg border space-y-3"
                                            style={{ background: 'var(--charcoal)', borderColor: 'var(--grey-700)' }}
                                          >
                                            <div>
                                              <label
                                                className="text-xs mb-1.5 block"
                                                style={{ color: 'var(--grey-400)', fontFamily: 'var(--font-display)' }}
                                              >
                                                {getResultFieldForType(item.type).label}
                                              </label>
                                              <input
                                                type="text"
                                                value={progressResultValue}
                                                onChange={(e) => setProgressResultValue(e.target.value)}
                                                placeholder={getResultFieldForType(item.type).placeholder}
                                                className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                                                style={{
                                                  background: 'var(--grey-800)',
                                                  borderColor: 'var(--grey-700)',
                                                  color: 'var(--white)'
                                                }}
                                              />
                                            </div>
                                            <div>
                                              <label
                                                className="text-xs mb-1.5 block"
                                                style={{ color: 'var(--grey-400)', fontFamily: 'var(--font-display)' }}
                                              >
                                                Notes
                                              </label>
                                              <textarea
                                                value={progressResultNotes}
                                                onChange={(e) => setProgressResultNotes(e.target.value)}
                                                placeholder="Additional context or details..."
                                                className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 min-h-[60px]"
                                                style={{
                                                  background: 'var(--grey-800)',
                                                  borderColor: 'var(--grey-700)',
                                                  color: 'var(--white)'
                                                }}
                                              />
                                            </div>
                                            <button
                                              onClick={() => handleUpdateProgressResult(item)}
                                              disabled={savingProgress}
                                              className="w-full px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                                              style={{
                                                background: 'var(--burnt-orange)',
                                                color: 'var(--white)',
                                                fontFamily: 'var(--font-display)'
                                              }}
                                            >
                                              {savingProgress ? 'Saving...' : 'Save Result'}
                                            </button>
                                          </div>
                                        )}

                                        {/* Show saved result summary */}
                                        {item.result && !editingProgressResult && (item.result.value || item.result.notes) && (
                                          <div
                                            className="mt-2 p-2 rounded-lg text-xs"
                                            style={{ background: 'var(--burnt-orange-muted)', color: 'var(--burnt-orange)' }}
                                          >
                                            {item.result.value && <span className="font-medium">{item.result.value}</span>}
                                            {item.result.value && item.result.notes && <span className="mx-1">•</span>}
                                            {item.result.notes && <span style={{ color: 'var(--grey-300)' }}>{item.result.notes}</span>}
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
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
            ) : (
              <div className="p-8">
                <div className="mb-8">
                  <div
                    className="text-[0.65rem] uppercase tracking-[0.15em] text-[var(--burnt-orange)] flex items-center gap-2 mb-2"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    <MessageSquare className="w-3 h-3" />
                    Campaigns
                  </div>
                  <h1
                    className="text-[1.5rem] font-normal text-white"
                    style={{ fontFamily: 'var(--font-serif)' }}
                  >
                    Active Campaigns
                  </h1>
                  <p className="text-[var(--grey-400)] text-sm mt-1">
                    View and manage your campaigns
                  </p>
                </div>

                {campaigns.length > 0 ? (
                  <div className="space-y-4">
                    {campaigns.map((campaign) => (
                      <div
                        key={campaign.id}
                        onClick={() => setSelectedCampaign(campaign)}
                        className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 cursor-pointer transition-all hover:border-[var(--burnt-orange)]"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3
                                className="text-lg font-semibold text-white"
                                style={{ fontFamily: 'var(--font-display)' }}
                              >
                                {campaign.name}
                              </h3>
                              <span
                                className="px-2 py-0.5 rounded-full text-[0.65rem] font-medium"
                                style={{
                                  background: campaign.status === 'ready' ? 'var(--burnt-orange-muted)' : 'rgba(34, 197, 94, 0.2)',
                                  color: campaign.status === 'ready' ? 'var(--burnt-orange)' : '#22c55e'
                                }}
                              >
                                {campaign.status === 'ready' ? 'Ready' : campaign.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400">
                              {campaign.phase}
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        </div>
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ background: 'var(--burnt-orange)', width: `${campaign.progress}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-8">
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                        style={{ background: 'var(--burnt-orange-muted)' }}
                      >
                        <MessageSquare className="w-8 h-8" style={{ color: 'var(--burnt-orange)' }} />
                      </div>
                      <h2
                        className="text-lg font-semibold mb-2 text-white"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        No Active Campaigns
                      </h2>
                      <p className="text-sm max-w-md mb-6 text-gray-400">
                        Create a campaign using the Campaign Builder to get started with strategic execution.
                      </p>
                      <button
                        onClick={() => setActiveView('builder')}
                        className="px-6 py-2.5 rounded-lg text-sm font-medium text-white transition-colors hover:brightness-110 flex items-center gap-2"
                        style={{ background: 'var(--burnt-orange)', fontFamily: 'var(--font-display)' }}
                      >
                        <Plus className="w-4 h-4" />
                        Create Campaign
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Add to Calendar Modal */}
      <AnimatePresence>
        {addToCalendarItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
            onClick={() => setAddToCalendarItem(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-[var(--grey-200)]">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--charcoal)', fontFamily: 'var(--font-display)' }}>
                  Add to Calendar
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--charcoal)' }}>Item</label>
                  <p className="text-sm" style={{ color: 'var(--grey-600)' }}>{addToCalendarItem.topic}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--charcoal)' }}>Scheduled Date (optional)</label>
                  <input
                    type="date"
                    value={addToCalendarDate}
                    onChange={(e) => setAddToCalendarDate(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--grey-300)] rounded-lg text-sm"
                    style={{ color: 'var(--charcoal)' }}
                  />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-[var(--grey-200)] flex justify-end gap-3">
                <button
                  onClick={() => setAddToCalendarItem(null)}
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ color: 'var(--grey-600)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAddToCalendar}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                  style={{ background: 'var(--burnt-orange)' }}
                >
                  Add to Calendar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Event Modal */}
      <AnimatePresence>
        {showManualEventModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
            onClick={() => setShowManualEventModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-[var(--grey-200)]">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--charcoal)', fontFamily: 'var(--font-display)' }}>
                  Create Event
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--charcoal)' }}>Title *</label>
                  <input
                    type="text"
                    value={manualEventTitle}
                    onChange={(e) => setManualEventTitle(e.target.value)}
                    placeholder="e.g., Press release deadline"
                    className="w-full px-3 py-2 border border-[var(--grey-300)] rounded-lg text-sm"
                    style={{ color: 'var(--charcoal)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--charcoal)' }}>Description</label>
                  <textarea
                    value={manualEventDescription}
                    onChange={(e) => setManualEventDescription(e.target.value)}
                    placeholder="Optional details..."
                    rows={3}
                    className="w-full px-3 py-2 border border-[var(--grey-300)] rounded-lg text-sm resize-none"
                    style={{ color: 'var(--charcoal)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--charcoal)' }}>Date (optional)</label>
                  <input
                    type="date"
                    value={manualEventDate}
                    onChange={(e) => setManualEventDate(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--grey-300)] rounded-lg text-sm"
                    style={{ color: 'var(--charcoal)' }}
                  />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-[var(--grey-200)] flex justify-end gap-3">
                <button
                  onClick={() => setShowManualEventModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ color: 'var(--grey-600)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateManualEvent}
                  disabled={!manualEventTitle}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                  style={{ background: 'var(--burnt-orange)' }}
                >
                  Create Event
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Modal */}
      <AnimatePresence>
        {editingResultItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
            onClick={() => setEditingResultItem(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-[var(--grey-200)]">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--charcoal)', fontFamily: 'var(--font-display)' }}>
                  Track Results
                </h3>
                <p className="text-sm mt-1" style={{ color: 'var(--grey-500)' }}>{editingResultItem.title}</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleComplete(editingResultItem)}
                    className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                      editingResultItem.status === 'completed'
                        ? 'bg-[#22c55e] border-[#22c55e]'
                        : 'border-[var(--grey-300)] hover:border-[var(--burnt-orange)]'
                    }`}
                  >
                    {editingResultItem.status === 'completed' && <Check className="w-4 h-4 text-white" />}
                  </button>
                  <span className="text-sm" style={{ color: 'var(--charcoal)' }}>
                    {editingResultItem.status === 'completed' ? 'Completed' : 'Mark as Complete'}
                  </span>
                </div>

                {editingResultItem.status === 'completed' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--charcoal)' }}>Result Type</label>
                      <select
                        value={resultType}
                        onChange={(e) => setResultType(e.target.value as any)}
                        className="w-full px-3 py-2 border border-[var(--grey-300)] rounded-lg text-sm"
                        style={{ color: 'var(--charcoal)' }}
                      >
                        <option value="media_response">Media Response</option>
                        <option value="engagement">Engagement</option>
                        <option value="pickup">Pickup/Coverage</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--charcoal)' }}>
                        Result Value
                        <span className="font-normal text-xs ml-1" style={{ color: 'var(--grey-500)' }}>
                          (e.g., impressions, response rate)
                        </span>
                      </label>
                      <input
                        type="text"
                        value={resultValue}
                        onChange={(e) => setResultValue(e.target.value)}
                        placeholder="e.g., 50K impressions, 3 replies"
                        className="w-full px-3 py-2 border border-[var(--grey-300)] rounded-lg text-sm"
                        style={{ color: 'var(--charcoal)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--charcoal)' }}>Notes</label>
                      <textarea
                        value={resultNotes}
                        onChange={(e) => setResultNotes(e.target.value)}
                        placeholder="Additional context or learnings..."
                        rows={3}
                        className="w-full px-3 py-2 border border-[var(--grey-300)] rounded-lg text-sm resize-none"
                        style={{ color: 'var(--charcoal)' }}
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="px-6 py-4 border-t border-[var(--grey-200)] flex justify-end gap-3">
                <button
                  onClick={() => setEditingResultItem(null)}
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ color: 'var(--grey-600)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveResult}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                  style={{ background: 'var(--burnt-orange)' }}
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Viewer Modal */}
      <AnimatePresence>
        {viewingContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
            onClick={() => setViewingContent(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--grey-900)] rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-[var(--grey-800)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-[var(--grey-800)] flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {(() => {
                      const typeInfo = getContentTypeInfo(viewingContent.type)
                      const IconComponent = typeInfo.icon
                      return (
                        <>
                          <IconComponent className="w-5 h-5" style={{ color: 'var(--burnt-orange)' }} />
                          <span
                            className="px-2 py-0.5 rounded text-xs font-medium"
                            style={{ background: 'var(--burnt-orange-muted)', color: 'var(--burnt-orange)' }}
                          >
                            {typeInfo.label}
                          </span>
                        </>
                      )
                    })()}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">{viewingContent.topic}</h3>
                  <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--grey-500)' }}>
                    <span>Stakeholder: {viewingContent.stakeholder}</span>
                    {viewingContent.target && <span>Target: {viewingContent.target}</span>}
                  </div>
                </div>
                <button
                  onClick={() => setViewingContent(null)}
                  className="ml-4 p-2 text-[var(--grey-400)] hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 py-4 border-b border-[var(--grey-800)]">
                <h4 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--grey-500)' }}>
                  Strategic Context
                </h4>
                <div className="bg-[var(--grey-800)]/50 rounded-lg p-4 text-sm space-y-2">
                  {viewingContent.type === 'media_pitch' && (
                    <>
                      <p><span style={{ color: 'var(--grey-500)' }}>Journalist:</span> <span className="text-white">{viewingContent.details.who}</span></p>
                      <p><span style={{ color: 'var(--grey-500)' }}>Outlet:</span> <span className="text-white">{viewingContent.details.outlet}</span></p>
                      <p><span style={{ color: 'var(--grey-500)' }}>Beat:</span> <span className="text-white">{viewingContent.details.beat}</span></p>
                      <p><span style={{ color: 'var(--grey-500)' }}>Timing:</span> <span className="text-white">{viewingContent.details.when}</span></p>
                    </>
                  )}
                  {viewingContent.type === 'social_post' && (
                    <>
                      <p><span style={{ color: 'var(--grey-500)' }}>Posted by:</span> <span className="text-white">{viewingContent.details.who}</span></p>
                      <p><span style={{ color: 'var(--grey-500)' }}>Platform:</span> <span className="text-white">{viewingContent.details.platform}</span></p>
                      <p><span style={{ color: 'var(--grey-500)' }}>Timing:</span> <span className="text-white">{viewingContent.details.when}</span></p>
                    </>
                  )}
                  {viewingContent.type === 'thought_leadership' && (
                    <>
                      <p><span style={{ color: 'var(--grey-500)' }}>Author:</span> <span className="text-white">{viewingContent.details.who}</span></p>
                      <p><span style={{ color: 'var(--grey-500)' }}>Publication:</span> <span className="text-white">{viewingContent.details.where}</span></p>
                      <p><span style={{ color: 'var(--grey-500)' }}>Timing:</span> <span className="text-white">{viewingContent.details.when}</span></p>
                    </>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4">
                <h4 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--grey-500)' }}>
                  Generated Content
                </h4>
                <div className="bg-[var(--grey-800)]/50 rounded-lg p-4">
                  <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed" style={{ color: 'var(--grey-300)' }}>
                    {viewingContent.generatedContent || 'No content generated yet.'}
                  </pre>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-[var(--grey-800)] flex items-center justify-between">
                <div className="text-xs" style={{ color: 'var(--grey-500)' }}>
                  {viewingContent.generatedAt && (
                    <span>Generated: {new Date(viewingContent.generatedAt).toLocaleString()}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => viewingContent.generatedContent && handleCopyContent(viewingContent.generatedContent)}
                    className="px-3 py-1.5 text-xs rounded-lg font-medium transition-colors flex items-center gap-1"
                    style={{ background: 'var(--grey-800)', color: 'var(--grey-300)' }}
                  >
                    {copied ? <><CheckCircle2 className="w-3 h-3" style={{ color: '#22c55e' }} />Copied!</> : <><Copy className="w-3 h-3" />Copy</>}
                  </button>
                  <button
                    onClick={() => handleDownloadContent(viewingContent)}
                    className="px-3 py-1.5 text-xs rounded-lg font-medium transition-colors flex items-center gap-1"
                    style={{ background: 'var(--grey-800)', color: 'var(--grey-300)' }}
                  >
                    <Download className="w-3 h-3" />Download
                  </button>
                  <button
                    onClick={() => setViewingContent(null)}
                    className="px-3 py-1.5 text-xs rounded-lg font-medium text-white transition-colors hover:brightness-110"
                    style={{ background: 'var(--burnt-orange)' }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
