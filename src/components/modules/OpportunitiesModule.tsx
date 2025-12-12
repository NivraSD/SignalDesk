'use client'

import React, { useState, useEffect } from 'react'
import { Target, Zap, Clock, TrendingUp, AlertCircle, Play, ChevronRight, Sparkles, FileText, Image, Users, Share2, Palette, Megaphone, ExternalLink, Download, Check, Loader2, Eye } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase/client'
import { useAppStore } from '@/stores/useAppStore'

// V2 OPPORTUNITY STRUCTURE
interface ContentBrief {
  angle: string
  key_points: string[]
  tone: string
  length: string
  cta: string
}

interface ContentItem {
  type: string
  topic: string
  target?: string
  platform?: 'linkedin' | 'twitter' | 'instagram' | string
  brief: ContentBrief
  urgency: string
}

interface StakeholderCampaign {
  stakeholder_name: string
  stakeholder_priority: number
  lever_name: string
  lever_priority: number
  content_items: ContentItem[]
}

interface ExecutionPlan {
  stakeholder_campaigns: StakeholderCampaign[]
  execution_timeline: {
    immediate: string[]
    this_week: string[]
    this_month: string[]
    ongoing: string[]
  }
  success_metrics: any[]
}

interface MediaTargeting {
  primary_journalist_types: string[]
  target_industries: string[]
  target_outlets: string[]
  reasoning: string
  beat_keywords: string[]
}

interface StrategicContext {
  trigger_events: string[]
  market_dynamics: string
  why_now: string
  competitive_advantage: string
  time_window: string
  expected_impact: string
  risk_if_missed: string
  media_targeting?: MediaTargeting
}

interface Opportunity {
  id: string
  title: string
  description: string
  score: number
  urgency: 'high' | 'medium' | 'low'
  category: string
  version?: number
  strategic_context?: StrategicContext
  execution_plan?: ExecutionPlan
  organization_id?: string
  status?: string
  executed?: boolean
  presentation_url?: string
  auto_executable?: boolean
  data?: any
}

export default function OpportunitiesModule() {
  const { organization } = useAppStore()
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null)
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState<string | null>(null)
  const [clearing, setClearing] = useState(false)
  const [generationProgress, setGenerationProgress] = useState<{
    current?: string
    progress?: number
  }>({})
  const [generatedContent, setGeneratedContent] = useState<any[]>([])
  const [viewingContent, setViewingContent] = useState<any | null>(null)

  useEffect(() => {
    fetchOpportunities()

    // Subscribe to real-time changes on opportunities table
    if (organization?.id) {
      const channel = supabase
        .channel('opportunities-module-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'opportunities',
            filter: `organization_id=eq.${organization.id}`
          },
          (payload) => {
            console.log('🔔 OpportunitiesModule: Change detected', payload.eventType)
            fetchOpportunities()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [organization])

  // Fetch generated content when selecting an executed opportunity
  useEffect(() => {
    if (selectedOpp?.executed && selectedOpp.id) {
      fetchGeneratedContent(selectedOpp.id)
    } else {
      setGeneratedContent([])
    }
  }, [selectedOpp?.id])

  const fetchOpportunities = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .eq('organization_id', organization?.id || '7a2835cb-11ee-4512-acc3-b6caf8eb03ff')
        .in('status', ['active', 'executed']) // Include both active and executed
        .order('score', { ascending: false })

      if (error) throw error

      setOpportunities(data || [])
      console.log('Loaded', data?.length, 'opportunities from database')
    } catch (error) {
      console.error('Error fetching opportunities:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchGeneratedContent = async (opportunityId: string) => {
    try {
      console.log('📚 Fetching content for opportunity:', opportunityId)

      // Use API endpoint instead of direct Supabase client to bypass PostgREST cache
      const orgId = organization?.id || '7a2835cb-11ee-4512-acc3-b6caf8eb03ff'
      const response = await fetch(
        `/api/content-library/save?organization_id=${orgId}&blueprint_id=${opportunityId}&limit=100`
      )

      if (!response.ok) {
        console.error('Error fetching content:', response.status, response.statusText)
        return
      }

      const result = await response.json()
      const data = result.data || []

      // Filter out phase_strategy documents
      const filteredData = data.filter((item: any) => item.content_type !== 'phase_strategy')

      console.log(`📦 Loaded ${filteredData.length} content items`)
      setGeneratedContent(filteredData)
    } catch (error) {
      console.error('Error fetching generated content:', error)
    }
  }

  const clearOpportunities = async () => {
    try {
      setClearing(true)
      const { error } = await supabase
        .from('opportunities')
        .delete()
        .eq('organization_id', organization?.id || '7a2835cb-11ee-4512-acc3-b6caf8eb03ff')

      if (error) throw error

      setOpportunities([])
      setSelectedOpp(null)
    } catch (error) {
      console.error('Error clearing opportunities:', error)
    } finally {
      setClearing(false)
    }
  }

  // Helper function to create clean folder name from opportunity title
  const getOpportunityFolderName = (title: string): string => {
    // Remove "Opportunity: " prefix if it exists
    let cleanTitle = title.replace(/^Opportunity:\s*/i, '')
    return cleanTitle.trim()
  }

  const executeOpportunity = async (opp: Opportunity) => {
    console.log('🚀 Execute opportunity called:', opp)

    // Create clean folder name
    const folderName = getOpportunityFolderName(opp.title)
    console.log('📁 Using folder name:', folderName)

    if (!opp.version || opp.version !== 2 || !opp.execution_plan) {
      console.error('❌ Not a V2 opportunity or missing execution plan')
      return
    }

    console.log('✅ V2 opportunity detected - executing full plan:', {
      stakeholderCampaigns: opp.execution_plan.stakeholder_campaigns.length,
      totalContentItems: opp.execution_plan.stakeholder_campaigns.reduce((sum, c) => sum + c.content_items.length, 0)
    })

    setExecuting(opp.id)
    setGenerationProgress({ current: 'Preparing campaign execution...', progress: 10 })

    let progressInterval: NodeJS.Timeout | null = null

    try {
      // Save opportunity overview to Memory Vault
      const overviewContent = `# ${opp.title}

${opp.description}

## Strategic Context

**Why Now:** ${opp.strategic_context?.why_now || 'N/A'}

**Market Dynamics:** ${opp.strategic_context?.market_dynamics || 'N/A'}

**Time Window:** ${opp.strategic_context?.time_window || 'N/A'}

**Competitive Advantage:** ${opp.strategic_context?.competitive_advantage || 'N/A'}

**Expected Impact:** ${opp.strategic_context?.expected_impact || 'N/A'}

**Risk if Missed:** ${opp.strategic_context?.risk_if_missed || 'N/A'}

**Trigger Events:**
${opp.strategic_context?.trigger_events?.map(e => `- ${e}`).join('\n') || 'N/A'}

${opp.strategic_context?.media_targeting ? `## Media Targeting Strategy

**Why These Journalists Care:**
${opp.strategic_context.media_targeting.reasoning}

**Target Journalist Types:**
${opp.strategic_context.media_targeting.primary_journalist_types?.map(t => `- ${t}`).join('\n') || 'N/A'}

**Priority Outlets:**
${opp.strategic_context.media_targeting.target_outlets?.join(', ') || 'N/A'}

**Database Industries:**
${opp.strategic_context.media_targeting.target_industries?.join(', ') || 'N/A'}

**Beat Keywords:**
${opp.strategic_context.media_targeting.beat_keywords?.join(', ') || 'N/A'}
` : ''}
## Execution Plan

**Stakeholder Campaigns:**
${opp.execution_plan?.stakeholder_campaigns?.map(c => `
### ${c.stakeholder_name}
- **Objective:** ${c.objective || 'N/A'}
- **Key Messages:** ${c.key_messages?.join(', ') || 'N/A'}
- **Content Items:** ${c.content_items?.map(i => i.type).join(', ') || 'N/A'}
`).join('\n') || 'N/A'}

**Timeline:**
- **Immediate:** ${opp.execution_plan?.execution_timeline?.immediate?.join(', ') || 'N/A'}
- **This Week:** ${opp.execution_plan?.execution_timeline?.this_week?.join(', ') || 'N/A'}
- **This Month:** ${opp.execution_plan?.execution_timeline?.this_month?.join(', ') || 'N/A'}
- **Ongoing:** ${opp.execution_plan?.execution_timeline?.ongoing?.join(', ') || 'N/A'}

**Success Metrics:**
${opp.execution_plan?.success_metrics?.map((m: any) => `- ${JSON.stringify(m)}`).join('\n') || 'N/A'}

---
*Opportunity Score: ${opp.score} | Urgency: ${opp.urgency} | Category: ${opp.category}*`

      try {
        // Use API endpoint instead of direct Supabase client to bypass PostgREST cache issues
        const response = await fetch('/api/content-library/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: {
              type: 'strategy',
              title: `${folderName} - Overview`,
              content: overviewContent,
              organization_id: organization?.id,
              metadata: {
                opportunity_id: opp.id,
                urgency: opp.urgency,
                score: opp.score,
                is_overview: true,
                themes: [opp.category],
                topics: opp.strategic_context?.trigger_events || []
              }
            },
            folder: `Opportunities/${folderName}`
          })
        })

        if (response.ok) {
          console.log('✅ Saved opportunity overview to Memory Vault:', `Opportunities/${folderName}`)
        } else {
          const error = await response.json()
          console.error('❌ Failed to save overview:', error)
        }
      } catch (error) {
        console.error('❌ Failed to save overview:', error)
      }

      const generated: any[] = []

      // Build content requirements from execution plan
      const contentRequirements: {
        owned: Array<{ type: string; stakeholder: string; purpose: string; keyPoints: string[] }>
        media: Array<{ type: string; stakeholder: string; purpose: string; keyPoints: string[] }>
      } = {
        owned: [],
        media: []
      }

      for (const campaign of opp.execution_plan.stakeholder_campaigns) {
        for (const item of campaign.content_items) {
          // Skip invalid types
          if (item.type === 'webinar' || item.type === 'event' || item.type === 'partnership_outreach') {
            console.log(`⏭️ Skipping invalid type: ${item.type} (cannot generate)`)
            continue
          }

          const contentReq = {
            type: item.type,
            stakeholder: campaign.stakeholder_name,
            purpose: item.topic,
            keyPoints: item.brief?.key_points || [],
            platform: item.platform // Pass platform for social posts (twitter, linkedin, instagram)
          }

          if (item.type === 'press_release' || item.type === 'media_pitch' || item.type === 'media_list') {
            contentRequirements.media.push(contentReq)
          } else {
            contentRequirements.owned.push(contentReq)
          }
        }
      }

      console.log('📦 Campaign orchestration:', {
        ownedContent: contentRequirements.owned.length,
        mediaContent: contentRequirements.media.length
      })

      const totalPieces = contentRequirements.owned.length + contentRequirements.media.length

      setGenerationProgress({
        current: `Generating ${totalPieces} content pieces...`,
        progress: 20
      })

      // Start a progress simulator and real-time content polling
      let simulatedProgress = 20
      let lastContentCount = 0

      progressInterval = setInterval(async () => {
        // Poll for actual content from database using API endpoint
        try {
          const orgId = organization?.id || '7a2835cb-11ee-4512-acc3-b6caf8eb03ff'
          const pollResponse = await fetch(
            `/api/content-library/save?organization_id=${orgId}&blueprint_id=${opp.id}&limit=100`
          )

          let currentCount = 0
          if (pollResponse.ok) {
            const pollResult = await pollResponse.json()
            const polledContent = (pollResult.data || []).filter(
              (item: any) => item.content_type !== 'phase_strategy'
            )
            currentCount = polledContent.length
          }

          // If we have actual content, use real count
          if (currentCount > lastContentCount) {
            lastContentCount = currentCount
            const progressPercent = 20 + Math.floor((currentCount / totalPieces) * 60)
            setGenerationProgress({
              current: `Generated ${currentCount}/${totalPieces} content pieces`,
              progress: Math.min(progressPercent, 80)
            })

            // Refresh the displayed content
            if (selectedOpp?.id === opp.id) {
              await fetchGeneratedContent(opp.id)
            }
          } else if (simulatedProgress < 80) {
            // Otherwise simulate progress
            simulatedProgress += 2
            setGenerationProgress({
              current: `Generating content...`,
              progress: simulatedProgress
            })
          }
        } catch (error) {
          console.error('Error polling content:', error)
        }
      }, 3000) // Poll every 3 seconds

      // Call niv-content-intelligent-v2 with campaign_generation stage
      const { data: orchestrationResult, error: contentError } = await supabase.functions.invoke('niv-content-intelligent-v2', {
        body: {
          message: `Generate campaign content for ${opp.title}`,
          conversationHistory: [],
          organizationContext: {
            conversationId: `opp-${opp.id}-${Date.now()}`,
            organizationId: opp.organization_id || '7a2835cb-11ee-4512-acc3-b6caf8eb03ff',
            organizationName: opp.description || 'Organization'
          },
          stage: 'campaign_generation',
          campaignContext: {
            phase: 'execution',
            phaseNumber: 1,
            objective: opp.title,
            narrative: opp.description,
            keyMessages: opp.strategic_context?.trigger_events || [],
            contentRequirements,
            researchInsights: [opp.strategic_context?.why_now || ''],
            currentDate: new Date().toISOString().split('T')[0],
            campaignFolder: `Opportunities/${folderName}`,
            blueprintId: opp.id,
            positioning: opp.strategic_context?.competitive_advantage || '',
            targetStakeholders: opp.execution_plan.stakeholder_campaigns.map(c => c.stakeholder_name),
            campaignType: 'OPPORTUNITY_EXECUTION',
            timeline: opp.strategic_context?.time_window || 'Immediate'
          }
        }
      })

      // Clear the progress interval
      if (progressInterval) {
        clearInterval(progressInterval)
      }

      if (contentError) {
        console.error('Campaign orchestration failed:', contentError)
        throw new Error(`Campaign orchestration failed: ${contentError.message}`)
      }

      if (orchestrationResult) {
        console.log('✅ Campaign orchestration complete:', orchestrationResult)

        const generatedCount = orchestrationResult.generatedContent?.length || 0
        setGenerationProgress({
          current: `✅ Generated ${generatedCount}/${totalPieces} content pieces`,
          progress: 85
        })

        if (orchestrationResult.generatedContent && orchestrationResult.generatedContent.length > 0) {
          // Content is already saved to content_library by niv-content-intelligent-v2
          // Just fetch it to display
          console.log(`✅ ${orchestrationResult.generatedContent.length} pieces generated`)
          await fetchGeneratedContent(opp.id)
        }
      }

      // Generate Gamma presentation
      setGenerationProgress({ current: 'Finalizing Presentation...', progress: 90 })

      let presentationUrl = null
      try {
        const { data: gammaData, error: gammaError } = await supabase.functions.invoke('generate-opportunity-presentation', {
          body: {
            opportunity_id: opp.id,
            organization_id: opp.organization_id || '7a2835cb-11ee-4512-acc3-b6caf8eb03ff'
          }
        })

        if (!gammaError && gammaData?.generationId) {
          console.log('📊 Gamma started, polling...', gammaData.generationId)

          // Poll for completion - increased to 72 attempts (6 minutes)
          const maxAttempts = 72
          for (let i = 0; i < maxAttempts; i++) {
            setGenerationProgress({
              current: 'Finalizing Presentation...',
              progress: 90 + (i / maxAttempts) * 8 // 90-98%
            })

            await new Promise(resolve => setTimeout(resolve, 5000))

            const { data: statusData, error: statusError } = await supabase.functions.invoke('gamma-presentation', {
              body: {
                generationId: gammaData.generationId,
                capture: true,
                organization_id: opp.organization_id || '7a2835cb-11ee-4512-acc3-b6caf8eb03ff',
                campaign_id: opp.id,
                campaign_folder: `Opportunities/${folderName}`,  // Pass the folder path for capture
                title: opp.title
              }
            })

            if (!statusError && statusData?.status === 'completed' && statusData.gammaUrl) {
              presentationUrl = statusData.gammaUrl
              console.log('✅ Gamma completed:', presentationUrl)
              setGenerationProgress({ current: '✅ Presentation ready!', progress: 98 })
              break
            }

            if (statusData?.status === 'error') {
              console.error('Gamma generation error:', statusData)
              setGenerationProgress({ current: '⚠️ Presentation failed', progress: 90 })
              break
            }
          }

          // If we exhausted attempts, still save the URL for manual checking
          if (!presentationUrl) {
            console.warn('Gamma polling timed out - check Gamma dashboard manually')
            setGenerationProgress({ current: '⚠️ Still finalizing (check dashboard)', progress: 90 })
          }
        }
      } catch (gammaError) {
        console.error('Gamma generation failed:', gammaError)
        setGenerationProgress({ current: '⚠️ Presentation failed', progress: 90 })
      }

      // Final content fetch to ensure we have everything
      console.log('📦 Final content fetch...')
      await fetchGeneratedContent(opp.id)

      // Update database
      const { error: updateError } = await supabase
        .from('opportunities')
        .update({
          status: 'executed',
          executed: true,
          presentation_url: presentationUrl
        })
        .eq('id', opp.id)

      if (updateError) console.error('Error updating opportunity:', updateError)

      setOpportunities(prev =>
        prev.map(o => o.id === opp.id ? { ...o, executed: true, presentation_url: presentationUrl } : o)
      )

      if (selectedOpp?.id === opp.id) {
        setSelectedOpp({ ...opp, executed: true, presentation_url: presentationUrl })
      }

      setGenerationProgress({ current: '✅ Campaign execution complete!', progress: 100 })

      // One more content fetch after UI updates to ensure display
      setTimeout(() => fetchGeneratedContent(opp.id), 500)

    } catch (error: any) {
      console.error('❌ Execution error:', error)
      setGenerationProgress({ current: `❌ Error: ${error.message}`, progress: 0 })
    } finally {
      // Clean up progress interval
      if (progressInterval) {
        clearInterval(progressInterval)
      }

      setTimeout(() => {
        setExecuting(null)
        setGenerationProgress({})
      }, 3000)
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'text-red-400 bg-red-500/10 border-red-500/30'
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
      case 'low': return 'text-green-400 bg-green-500/10 border-green-500/30'
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-400'
    if (score >= 70) return 'text-yellow-400'
    if (score >= 50) return 'text-orange-400'
    return 'text-red-400'
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--grey-800)]">
        <div className="flex items-center justify-between">
          <div>
            <div
              className="text-[0.65rem] uppercase tracking-[0.15em] text-[var(--burnt-orange)] flex items-center gap-2 mb-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <Target className="w-3 h-3" />
              Opportunities
            </div>
            <div className="flex items-center gap-4">
              <h1
                className="text-[1.5rem] font-normal text-white"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                Opportunity Engine
              </h1>
              <span className="px-2 py-1 text-xs bg-[var(--burnt-orange-muted)] text-[var(--burnt-orange)] rounded-full">
                {opportunities.length} Active
              </span>
            </div>
            <p className="text-[var(--grey-400)] text-sm mt-1">
              Strategic opportunities detected from market signals and intelligence analysis
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearOpportunities}
              disabled={clearing || opportunities.length === 0}
              className="px-3 py-1 text-xs bg-[var(--grey-800)] hover:bg-[var(--grey-700)] text-[var(--grey-400)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {clearing ? 'Clearing...' : 'Clear All'}
            </button>
            <button
              onClick={fetchOpportunities}
              className="px-3 py-1 text-xs bg-[var(--burnt-orange-muted)] hover:bg-[var(--burnt-orange)]/30 text-[var(--burnt-orange)] rounded-lg transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Full Width */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[var(--burnt-orange)] animate-spin" />
            </div>
          ) : opportunities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[var(--grey-400)]">
              <Target className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-sm">No opportunities detected</p>
              <p className="text-xs mt-2">Run Intelligence Module to detect opportunities</p>
            </div>
          ) : (
            <div className="space-y-4">
              {opportunities.map((opp) => (
                <motion.div
                  key={opp.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-[var(--grey-900)] rounded-xl border transition-all ${
                    selectedOpp?.id === opp.id
                      ? 'border-[var(--burnt-orange)]/50'
                      : 'border-[var(--grey-800)]'
                  }`}
                >
                  {/* Opportunity Header - Always Visible */}
                  <div
                    className="p-5 cursor-pointer hover:bg-[var(--grey-800)]/30 transition-colors rounded-t-xl"
                    onClick={() => setSelectedOpp(selectedOpp?.id === opp.id ? null : opp)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 pr-4">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                            {opp.title}
                          </h3>
                          <span className={`px-2 py-0.5 text-xs rounded-full border ${getUrgencyColor(opp.urgency)}`}>
                            {opp.urgency.toUpperCase()}
                          </span>
                          {opp.executed && (
                            <span className="px-2 py-0.5 text-xs bg-[var(--burnt-orange-muted)] text-[var(--burnt-orange)] rounded border border-[var(--burnt-orange)]/30">
                              ✓ EXECUTED
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[var(--grey-400)] line-clamp-2">
                          {opp.description}
                        </p>
                        <div className="flex items-center gap-4 mt-3">
                          <span className="text-xs text-[var(--grey-500)]">{opp.category}</span>
                          {opp.version === 2 && opp.execution_plan && (
                            <span className="text-xs text-[var(--grey-500)]">
                              {opp.execution_plan.stakeholder_campaigns.reduce((sum, c) => sum + c.content_items.length, 0)} content items
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className={`text-3xl font-bold ${getScoreColor(opp.score)}`} style={{ fontFamily: 'var(--font-display)' }}>
                          {opp.score}
                        </div>
                        <ChevronRight className={`w-5 h-5 text-[var(--grey-500)] transition-transform ${selectedOpp?.id === opp.id ? 'rotate-90' : ''}`} />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {selectedOpp?.id === opp.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden border-t border-[var(--grey-800)]"
                      >
                        <div className="p-5">
                          {/* V2: Strategic Context */}
                          {opp.version === 2 && opp.strategic_context && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>Strategic Context</h3>

                  {/* Trigger Events */}
                  <div className="mb-4 p-4 bg-[var(--grey-800)] rounded-lg border border-[var(--grey-700)]">
                    <h4 className="text-sm font-semibold text-white mb-2 uppercase tracking-wide">Trigger Events</h4>
                    <ul className="space-y-1">
                      {opp.strategic_context.trigger_events.map((event, idx) => (
                        <li key={idx} className="text-sm text-[var(--grey-300)] flex items-start gap-2">
                          <ChevronRight className="w-3 h-3 text-[var(--burnt-orange)] mt-0.5 flex-shrink-0" />
                          <span>{event}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Why Now */}
                  <div className="mb-4 p-4 bg-[var(--grey-800)] rounded-lg border border-[var(--grey-700)]">
                    <h4 className="text-sm font-semibold text-white mb-2 uppercase tracking-wide">Why Now</h4>
                    <p className="text-sm text-[var(--grey-300)]">{opp.strategic_context.why_now}</p>
                  </div>

                  {/* Competitive Advantage */}
                  <div className="mb-4 p-4 bg-[var(--grey-800)] rounded-lg border border-[var(--grey-700)]">
                    <h4 className="text-sm font-semibold text-white mb-2 uppercase tracking-wide">Competitive Advantage</h4>
                    <p className="text-sm text-[var(--grey-300)]">{opp.strategic_context.competitive_advantage}</p>
                  </div>

                  {/* Expected Impact */}
                  <div className="mb-4 p-4 bg-[var(--grey-800)] rounded-lg border border-[var(--grey-700)]">
                    <h4 className="text-sm font-semibold text-white mb-2 uppercase tracking-wide">Expected Impact</h4>
                    <p className="text-sm text-[var(--grey-300)]">{opp.strategic_context.expected_impact}</p>
                  </div>

                  {/* Media Targeting */}
                  {opp.strategic_context.media_targeting && (
                    <div className="mb-4 p-4 bg-[var(--burnt-orange-muted)] rounded-lg border border-[var(--burnt-orange)]/30">
                      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2 uppercase tracking-wide">
                        <Users className="w-4 h-4 text-[var(--burnt-orange)]" />
                        Media Targeting Strategy
                      </h4>

                      {/* Reasoning */}
                      <div className="mb-3 p-3 bg-[var(--grey-900)] rounded border border-[var(--grey-800)]">
                        <p className="text-xs text-[var(--grey-400)] mb-1">Why these journalists care:</p>
                        <p className="text-sm text-[var(--grey-300)]">{opp.strategic_context.media_targeting.reasoning}</p>
                      </div>

                      {/* Journalist Types */}
                      <div className="mb-3">
                        <p className="text-xs text-[var(--grey-400)] mb-2">Target Journalist Types:</p>
                        <div className="flex flex-wrap gap-2">
                          {opp.strategic_context.media_targeting.primary_journalist_types.map((type, idx) => (
                            <span key={idx} className="px-2 py-1 text-xs bg-[var(--burnt-orange)]/20 text-[var(--burnt-orange)] rounded border border-[var(--burnt-orange)]/30">
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Target Outlets */}
                      {opp.strategic_context.media_targeting.target_outlets && opp.strategic_context.media_targeting.target_outlets.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-[var(--grey-400)] mb-2">Priority Outlets:</p>
                          <div className="flex flex-wrap gap-2">
                            {opp.strategic_context.media_targeting.target_outlets.slice(0, 6).map((outlet, idx) => (
                              <span key={idx} className="px-2 py-1 text-xs bg-[var(--grey-800)] text-[var(--grey-300)] rounded border border-[var(--grey-700)]">
                                {outlet}
                              </span>
                            ))}
                            {opp.strategic_context.media_targeting.target_outlets.length > 6 && (
                              <span className="px-2 py-1 text-xs bg-[var(--grey-800)] text-[var(--grey-400)] rounded border border-[var(--grey-700)]">
                                +{opp.strategic_context.media_targeting.target_outlets.length - 6} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Industries */}
                      {opp.strategic_context.media_targeting.target_industries && opp.strategic_context.media_targeting.target_industries.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-[var(--grey-400)] mb-2">Database Industries:</p>
                          <div className="flex flex-wrap gap-2">
                            {opp.strategic_context.media_targeting.target_industries.map((industry, idx) => (
                              <span key={idx} className="px-2 py-1 text-xs bg-[var(--grey-800)] text-[var(--grey-300)] rounded border border-[var(--grey-700)]">
                                {industry}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Beat Keywords */}
                      {opp.strategic_context.media_targeting.beat_keywords && opp.strategic_context.media_targeting.beat_keywords.length > 0 && (
                        <div>
                          <p className="text-xs text-[var(--grey-400)] mb-2">Beat Keywords:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {opp.strategic_context.media_targeting.beat_keywords.map((keyword, idx) => (
                              <span key={idx} className="px-2 py-0.5 text-xs bg-[var(--grey-800)] text-[var(--grey-400)] rounded border border-[var(--grey-700)]">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* V2: Execution Plan */}
              {opp.version === 2 && opp.execution_plan && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>Execution Plan</h3>

                  {/* Stakeholder Campaigns */}
                  {opp.execution_plan.stakeholder_campaigns.map((campaign, idx) => (
                    <div key={idx} className="mb-4 p-4 bg-[var(--grey-800)] rounded-lg border border-[var(--grey-700)]">
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="w-4 h-4 text-[var(--burnt-orange)]" />
                        <h4 className="text-sm font-semibold text-white">
                          {campaign.stakeholder_name}
                        </h4>
                        <span className="px-2 py-0.5 text-xs bg-[var(--burnt-orange-muted)] text-[var(--burnt-orange)] rounded">
                          Priority {campaign.stakeholder_priority}
                        </span>
                      </div>

                      <div className="text-xs text-[var(--grey-400)] mb-3">
                        Lever: {campaign.lever_name}
                      </div>

                      {/* Content Items */}
                      <div className="space-y-2">
                        {campaign.content_items.map((item, itemIdx) => (
                          <div key={itemIdx} className="p-3 bg-[var(--grey-900)] rounded border border-[var(--grey-800)]">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-white">{item.type}</span>
                                {item.platform && (
                                  <span className={`px-2 py-0.5 text-xs rounded ${
                                    item.platform === 'linkedin' ? 'bg-blue-500/20 text-blue-400' :
                                    item.platform === 'twitter' ? 'bg-sky-500/20 text-sky-400' :
                                    item.platform === 'instagram' ? 'bg-pink-500/20 text-pink-400' :
                                    'bg-[var(--grey-700)] text-[var(--grey-300)]'
                                  }`}>
                                    {item.platform}
                                  </span>
                                )}
                              </div>
                              <span className={`px-2 py-0.5 text-xs rounded ${
                                item.urgency === 'immediate' ? 'bg-[var(--burnt-orange-muted)] text-[var(--burnt-orange)]' :
                                item.urgency === 'this_week' ? 'bg-[var(--grey-700)] text-[var(--grey-300)]' :
                                'bg-[var(--grey-800)] text-[var(--grey-400)]'
                              }`}>
                                {item.urgency}
                              </span>
                            </div>
                            <div className="text-xs text-[var(--grey-400)] mb-2">{item.topic}</div>
                            <div className="text-xs text-[var(--grey-500)]">
                              {item.brief?.angle && `Angle: ${item.brief.angle}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Success Metrics */}
                  {opp.execution_plan.success_metrics && opp.execution_plan.success_metrics.length > 0 && (
                    <div className="p-4 bg-[var(--grey-800)] rounded-lg border border-[var(--grey-700)]">
                      <h4 className="text-sm font-semibold text-white mb-2 uppercase tracking-wide">Success Metrics</h4>
                      <ul className="space-y-1">
                        {opp.execution_plan.success_metrics.map((metric: any, idx) => (
                          <li key={idx} className="text-xs text-[var(--grey-400)]">
                            • {metric.metric}: {metric.target}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Generated Content Section */}
              {(opp.executed || (executing === opp.id)) && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>Generated Content</h3>
                    <span className="px-2 py-1 text-xs bg-[var(--burnt-orange-muted)] text-[var(--burnt-orange)] rounded">
                      {generatedContent.length} pieces
                    </span>
                  </div>
                  {generatedContent.length === 0 ? (
                    <div className="p-4 bg-[var(--grey-800)] rounded-lg border border-[var(--grey-700)] text-center">
                      <p className="text-sm text-[var(--grey-500)]">
                        {executing === opp.id ? 'Generating content...' : 'No content generated yet'}
                      </p>
                    </div>
                  ) : (
                  <div className="space-y-2">
                    {generatedContent.map((content, idx) => (
                      <div key={idx} className="p-4 bg-[var(--grey-800)] rounded-lg border border-[var(--grey-700)]">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-white mb-1">{content.title}</h4>
                            <div className="flex items-center gap-2 text-xs text-[var(--grey-400)] mb-1">
                              <span className="px-2 py-0.5 bg-[var(--burnt-orange-muted)] text-[var(--burnt-orange)] rounded">
                                {content.content_type}
                              </span>
                              {content.metadata?.stakeholder && (
                                <span className="text-[var(--grey-500)]">→ {content.metadata.stakeholder}</span>
                              )}
                              {content.metadata?.channel && (
                                <span className="px-2 py-0.5 bg-[var(--grey-700)] text-[var(--grey-400)] rounded">
                                  {content.metadata.channel}
                                </span>
                              )}
                            </div>
                            {content.metadata?.purpose && (
                              <p className="text-xs text-[var(--grey-500)] mt-1">{content.metadata.purpose}</p>
                            )}
                          </div>
                          <button
                            onClick={() => setViewingContent(content)}
                            className="px-3 py-1 text-xs bg-[var(--burnt-orange-muted)] text-[var(--burnt-orange)] rounded hover:bg-[var(--burnt-orange)]/30 transition-colors flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  )}
                </div>
              )}

              {/* Presentation Link */}
              {opp.executed && opp.presentation_url && (
                <div className="mb-6">
                  <a
                    href={opp.presentation_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[var(--burnt-orange)] text-white rounded-lg hover:bg-[var(--burnt-orange-light)] transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Gamma Presentation
                  </a>
                </div>
              )}

              {/* Execute Button */}
              {!opp.executed && opp.version === 2 && opp.execution_plan && (
                <div className="space-y-3">
                  <button
                    onClick={() => executeOpportunity(opp)}
                    disabled={executing === opp.id}
                    className="w-full py-3 bg-[var(--burnt-orange)] text-white font-semibold rounded-lg hover:bg-[var(--burnt-orange-light)] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {executing === opp.id ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {generationProgress.current || 'Executing...'}
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        Execute Campaign - Generate All Content
                      </>
                    )}
                  </button>
                  {executing === opp.id && generationProgress.progress !== undefined && (
                    <div className="mt-2">
                      <div className="w-full bg-[var(--grey-800)] rounded-full h-2">
                        <div
                          className="bg-[var(--burnt-orange)] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${generationProgress.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

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
              className="bg-[var(--grey-900)] rounded-xl border border-[var(--grey-800)] max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-[var(--grey-800)] flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">{viewingContent.title}</h3>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 bg-[var(--burnt-orange-muted)] text-[var(--burnt-orange)] rounded">
                      {viewingContent.content_type}
                    </span>
                    {viewingContent.metadata?.stakeholder && (
                      <span className="text-[var(--grey-400)]">Stakeholder: {viewingContent.metadata.stakeholder}</span>
                    )}
                    {viewingContent.metadata?.channel && (
                      <span className="px-2 py-0.5 bg-[var(--grey-800)] text-[var(--grey-400)] rounded capitalize">
                        {viewingContent.metadata.channel}
                      </span>
                    )}
                  </div>
                  {viewingContent.metadata?.purpose && (
                    <p className="text-xs text-[var(--grey-500)] mt-2">{viewingContent.metadata.purpose}</p>
                  )}
                </div>
                <button
                  onClick={() => setViewingContent(null)}
                  className="ml-4 p-2 text-[var(--grey-400)] hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="prose prose-invert max-w-none">
                  <div className="text-[var(--grey-300)] whitespace-pre-wrap font-mono text-sm leading-relaxed">
                    {viewingContent.content}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-[var(--grey-800)] flex items-center justify-between">
                <div className="text-xs text-[var(--grey-500)]">
                  {viewingContent.metadata?.generated_at && (
                    <span>Generated: {new Date(viewingContent.metadata.generated_at).toLocaleString()}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(viewingContent.content)
                      // Could add a toast notification here
                      console.log('Content copied to clipboard')
                    }}
                    className="px-3 py-1.5 text-xs bg-[var(--burnt-orange-muted)] text-[var(--burnt-orange)] rounded hover:bg-[var(--burnt-orange)]/30 transition-colors"
                  >
                    Copy Content
                  </button>
                  <button
                    onClick={() => setViewingContent(null)}
                    className="px-3 py-1.5 text-xs bg-[var(--grey-700)] text-[var(--grey-300)] rounded hover:bg-[var(--grey-600)] transition-colors"
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
