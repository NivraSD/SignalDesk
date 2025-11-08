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
  platform?: string
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

interface StrategicContext {
  trigger_events: string[]
  market_dynamics: string
  why_now: string
  competitive_advantage: string
  time_window: string
  expected_impact: string
  risk_if_missed: string
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
      const { data, error } = await supabase
        .from('content_library')
        .select('*')
        .eq('organization_id', organization?.id || '7a2835cb-11ee-4512-acc3-b6caf8eb03ff')
        .eq('metadata->>blueprint_id', opportunityId)
        .neq('content_type', 'phase_strategy') // Exclude strategy documents
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching content:', error)
        return
      }

      console.log(`📦 Loaded ${data?.length || 0} content items`)
      setGeneratedContent(data || [])
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
            keyPoints: item.brief?.key_points || []
          }

          if (item.type === 'press_release' || item.type === 'media_pitch') {
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
        // Poll for actual content from database
        try {
          const { data: polledContent } = await supabase
            .from('content_library')
            .select('id')
            .eq('organization_id', organization?.id || '7a2835cb-11ee-4512-acc3-b6caf8eb03ff')
            .eq('metadata->>blueprint_id', opp.id)
            .neq('content_type', 'phase_strategy')

          const currentCount = polledContent?.length || 0

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
              current: `Finalizing Presentation... (${i * 5}s / ${maxAttempts * 5}s)`,
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
      <div className="px-6 py-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Opportunity Engine V2</h2>
            <span className="px-2 py-1 text-xs bg-purple-500/20 text-purple-400 rounded-full">
              {opportunities.length} Active
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearOpportunities}
              disabled={clearing || opportunities.length === 0}
              className="px-3 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {clearing ? 'Clearing...' : 'Clear All'}
            </button>
            <button
              onClick={fetchOpportunities}
              className="px-3 py-1 text-xs bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Two Columns */}
      <div className="flex-1 overflow-hidden flex">
        {/* LEFT COLUMN: Opportunities List */}
        <div className="w-2/5 border-r border-gray-800 overflow-y-auto">
          <div className="p-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              </div>
            ) : opportunities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Target className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-sm">No opportunities detected</p>
                <p className="text-xs mt-2">Run Intelligence Module to detect opportunities</p>
              </div>
            ) : (
              opportunities.map((opp) => (
                <motion.div
                  key={opp.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 bg-gray-900/50 rounded-lg border cursor-pointer transition-all ${
                    selectedOpp?.id === opp.id
                      ? 'border-purple-500/50 bg-purple-500/5'
                      : 'border-gray-800 hover:border-gray-700'
                  }`}
                  onClick={() => setSelectedOpp(opp)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-white line-clamp-2 mb-1">
                        {opp.title}
                      </h3>
                      <p className="text-xs text-gray-400 line-clamp-2">
                        {opp.description}
                      </p>
                      {opp.version === 2 && opp.execution_plan && (
                        <div className="text-xs text-gray-500 mt-1">
                          {opp.execution_plan.stakeholder_campaigns.reduce((sum, c) => sum + c.content_items.length, 0)} content items
                        </div>
                      )}
                    </div>
                    <div className={`text-2xl font-bold ${getScoreColor(opp.score)}`}>
                      {opp.score}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-3">
                    <span className={`px-2 py-0.5 text-xs rounded-full border ${getUrgencyColor(opp.urgency)}`}>
                      {opp.urgency.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">{opp.category}</span>
                    {opp.executed && (
                      <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded border border-green-500/30">
                        ✓ EXECUTED
                      </span>
                    )}
                  </div>

                  {!opp.executed && opp.version === 2 && opp.execution_plan && (
                    <div className="mt-3 w-full">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          executeOpportunity(opp)
                        }}
                        disabled={executing === opp.id}
                        className="w-full px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {executing === opp.id ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            {generationProgress.current || 'Executing...'}
                          </>
                        ) : (
                          <>
                            <Zap className="w-3 h-3" />
                            Execute Campaign
                          </>
                        )}
                      </button>
                      {executing === opp.id && generationProgress.progress !== undefined && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-800 rounded-full h-1.5">
                            <div
                              className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${generationProgress.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Selected Opportunity Details */}
        <div className="flex-1 overflow-y-auto">
          {selectedOpp ? (
            <div className="p-6">
              {/* Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">{selectedOpp.title}</h2>
                <p className="text-gray-400 mb-4">{selectedOpp.description}</p>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-gray-300">Score: </span>
                    <span className={`text-lg font-bold ${getScoreColor(selectedOpp.score)}`}>
                      {selectedOpp.score}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-400" />
                    <span className={`px-2 py-0.5 text-xs rounded-full border ${getUrgencyColor(selectedOpp.urgency)}`}>
                      {selectedOpp.urgency.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-blue-400">
                      {selectedOpp.strategic_context?.time_window || 'TBD'}
                    </span>
                  </div>
                </div>
              </div>

              {/* V2: Strategic Context */}
              {selectedOpp.version === 2 && selectedOpp.strategic_context && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Strategic Context</h3>

                  {/* Trigger Events */}
                  <div className="mb-4 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
                    <h4 className="text-sm font-semibold text-purple-400 mb-2">Trigger Events</h4>
                    <ul className="space-y-1">
                      {selectedOpp.strategic_context.trigger_events.map((event, idx) => (
                        <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                          <ChevronRight className="w-3 h-3 text-gray-500 mt-0.5 flex-shrink-0" />
                          <span>{event}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Why Now */}
                  <div className="mb-4 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
                    <h4 className="text-sm font-semibold text-blue-400 mb-2">Why Now</h4>
                    <p className="text-sm text-gray-300">{selectedOpp.strategic_context.why_now}</p>
                  </div>

                  {/* Competitive Advantage */}
                  <div className="mb-4 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
                    <h4 className="text-sm font-semibold text-green-400 mb-2">Competitive Advantage</h4>
                    <p className="text-sm text-gray-300">{selectedOpp.strategic_context.competitive_advantage}</p>
                  </div>

                  {/* Expected Impact */}
                  <div className="mb-4 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
                    <h4 className="text-sm font-semibold text-orange-400 mb-2">Expected Impact</h4>
                    <p className="text-sm text-gray-300">{selectedOpp.strategic_context.expected_impact}</p>
                  </div>
                </div>
              )}

              {/* V2: Execution Plan */}
              {selectedOpp.version === 2 && selectedOpp.execution_plan && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Execution Plan</h3>

                  {/* Stakeholder Campaigns */}
                  {selectedOpp.execution_plan.stakeholder_campaigns.map((campaign, idx) => (
                    <div key={idx} className="mb-4 p-4 bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-lg border border-purple-500/30">
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="w-4 h-4 text-purple-400" />
                        <h4 className="text-sm font-semibold text-purple-300">
                          {campaign.stakeholder_name}
                        </h4>
                        <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded">
                          Priority {campaign.stakeholder_priority}
                        </span>
                      </div>

                      <div className="text-xs text-gray-400 mb-3">
                        Lever: {campaign.lever_name}
                      </div>

                      {/* Content Items */}
                      <div className="space-y-2">
                        {campaign.content_items.map((item, itemIdx) => (
                          <div key={itemIdx} className="p-3 bg-gray-900/50 rounded border border-gray-800">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-white">{item.type}</span>
                              <span className={`px-2 py-0.5 text-xs rounded ${
                                item.urgency === 'immediate' ? 'bg-red-500/20 text-red-400' :
                                item.urgency === 'this_week' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-green-500/20 text-green-400'
                              }`}>
                                {item.urgency}
                              </span>
                            </div>
                            <div className="text-xs text-gray-400 mb-2">{item.topic}</div>
                            <div className="text-xs text-gray-500">
                              {item.brief?.angle && `Angle: ${item.brief.angle}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Success Metrics */}
                  {selectedOpp.execution_plan.success_metrics && selectedOpp.execution_plan.success_metrics.length > 0 && (
                    <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800">
                      <h4 className="text-sm font-semibold text-green-400 mb-2">Success Metrics</h4>
                      <ul className="space-y-1">
                        {selectedOpp.execution_plan.success_metrics.map((metric: any, idx) => (
                          <li key={idx} className="text-xs text-gray-400">
                            • {metric.metric}: {metric.target}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Generated Content Section */}
              {(selectedOpp.executed || (executing === selectedOpp.id)) && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Generated Content</h3>
                    <span className="px-2 py-1 text-xs bg-purple-500/20 text-purple-400 rounded">
                      {generatedContent.length} pieces
                    </span>
                  </div>
                  {generatedContent.length === 0 ? (
                    <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800 text-center">
                      <p className="text-sm text-gray-500">
                        {executing === selectedOpp.id ? 'Generating content...' : 'No content generated yet'}
                      </p>
                    </div>
                  ) : (
                  <div className="space-y-2">
                    {generatedContent.map((content, idx) => (
                      <div key={idx} className="p-4 bg-gray-900/50 rounded-lg border border-gray-800">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-white mb-1">{content.title}</h4>
                            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded">
                                {content.content_type}
                              </span>
                              {content.metadata?.stakeholder && (
                                <span className="text-gray-500">→ {content.metadata.stakeholder}</span>
                              )}
                              {content.metadata?.channel && (
                                <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 rounded">
                                  {content.metadata.channel}
                                </span>
                              )}
                            </div>
                            {content.metadata?.purpose && (
                              <p className="text-xs text-gray-500 mt-1">{content.metadata.purpose}</p>
                            )}
                          </div>
                          <button
                            onClick={() => setViewingContent(content)}
                            className="px-3 py-1 text-xs bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 transition-colors flex items-center gap-1"
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
              {selectedOpp.executed && selectedOpp.presentation_url && (
                <div className="mb-6">
                  <a
                    href={selectedOpp.presentation_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Gamma Presentation
                  </a>
                </div>
              )}

              {/* Execute Button */}
              {!selectedOpp.executed && selectedOpp.version === 2 && selectedOpp.execution_plan && (
                <div className="space-y-3">
                  <button
                    onClick={() => executeOpportunity(selectedOpp)}
                    disabled={executing === selectedOpp.id}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {executing === selectedOpp.id ? (
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
                  {executing === selectedOpp.id && generationProgress.progress !== undefined && (
                    <div className="space-y-2">
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${generationProgress.progress}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-400 text-center">
                        {generationProgress.progress}% complete
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Target className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500">Select an opportunity to view details</p>
              </div>
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
              className="bg-gray-900 rounded-xl border border-gray-800 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-800 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">{viewingContent.title}</h3>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded">
                      {viewingContent.content_type}
                    </span>
                    {viewingContent.metadata?.stakeholder && (
                      <span className="text-gray-400">Stakeholder: {viewingContent.metadata.stakeholder}</span>
                    )}
                    {viewingContent.metadata?.channel && (
                      <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 rounded capitalize">
                        {viewingContent.metadata.channel}
                      </span>
                    )}
                  </div>
                  {viewingContent.metadata?.purpose && (
                    <p className="text-xs text-gray-500 mt-2">{viewingContent.metadata.purpose}</p>
                  )}
                </div>
                <button
                  onClick={() => setViewingContent(null)}
                  className="ml-4 p-2 text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="prose prose-invert max-w-none">
                  <div className="text-gray-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                    {viewingContent.content}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between">
                <div className="text-xs text-gray-500">
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
                    className="px-3 py-1.5 text-xs bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 transition-colors"
                  >
                    Copy Content
                  </button>
                  <button
                    onClick={() => setViewingContent(null)}
                    className="px-3 py-1.5 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
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
