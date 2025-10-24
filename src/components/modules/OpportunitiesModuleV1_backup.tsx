'use client'

import React, { useState, useEffect } from 'react'
import { Target, Zap, Clock, TrendingUp, AlertCircle, Play, ChevronRight, Sparkles, FileText, Image, Users, Share2, Palette, Megaphone } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase/client'
import { useAppStore } from '@/stores/useAppStore'

interface Opportunity {
  id: string
  title: string
  description: string
  score: number
  urgency: 'high' | 'medium' | 'low'
  time_window: string
  category: string
  trigger_event: string
  campaign_name?: string  // Creative field from orchestrator-v2
  creative_approach?: string  // Creative field from orchestrator-v2
  data?: any  // Additional data that may contain creative fields
  recommended_action: {
    what: {
      primary_action: string
      specific_tasks: string[]
      deliverables: string[]
    }
    who: {
      owner: string
      team: string[]
    }
    when: {
      start_immediately: boolean
      ideal_launch: string
      duration: string
    }
    where: {
      channels: string[]
      platforms: string[]
    }
  }
  execution_status?: 'ready' | 'generating' | 'complete'
  generated_content?: {
    press_release?: string
    social_posts?: any[]
    visuals?: string[]
    media_list?: any[]
  }
}

export default function OpportunitiesModule() {
  // Get opportunities from the store (these have creative fields from orchestrator-v2)
  const storeOpportunities = useAppStore((state) => state.opportunities)
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null)
  const [executing, setExecuting] = useState<string | null>(null)
  const [generationProgress, setGenerationProgress] = useState<Record<string, string>>({})
  const [clearing, setClearing] = useState(false)

  // Use opportunities from the store which have creative fields from orchestrator-v2
  useEffect(() => {
    if (storeOpportunities && storeOpportunities.length > 0) {
      console.log('✅ Using enhanced opportunities from store/pipeline:', storeOpportunities.length)
      // Map store opportunities to the expected format
      const mappedOpps = storeOpportunities.map((opp: any) => ({
        ...opp,
        // Ensure all required fields are present
        id: opp.id || opp.opportunity_id || Math.random().toString(),
        execution_status: opp.execution_status || 'ready',
        recommended_action: opp.recommended_action || opp.data?.recommended_action,
        // Add creative fields from orchestrator-v2
        campaign_name: opp.campaign_name || opp.data?.campaign_name,
        creative_approach: opp.creative_approach || opp.data?.creative_approach
      }))
      setOpportunities(mappedOpps)
    } else {
      // Fallback to fetching from database if store is empty
      fetchOpportunities()
    }
  }, [storeOpportunities])

  const fetchOpportunities = async () => {
    try {
      // Use API route with service role key
      const response = await fetch('/api/opportunities')
      const result = await response.json()

      if (!response.ok) {
        console.error('Error fetching opportunities:', result.error)
        return
      }

      if (result.opportunities) {
        console.log(`Loaded ${result.opportunities.length} opportunities from database`)
        setOpportunities(result.opportunities)
      }
    } catch (err) {
      console.error('Failed to fetch opportunities:', err)
    }
  }

  const clearOpportunities = async () => {
    if (!confirm('Clear all opportunities? This cannot be undone.')) return

    setClearing(true)
    try {
      const response = await fetch('/api/opportunities', {
        method: 'DELETE'
      })

      if (response.ok) {
        setOpportunities([])
        setSelectedOpp(null)
        console.log('Cleared all opportunities')
      } else {
        console.error('Failed to clear opportunities')
      }
    } catch (err) {
      console.error('Error clearing opportunities:', err)
    } finally {
      setClearing(false)
    }
  }

  const executeOpportunity = async (opp: Opportunity) => {
    setExecuting(opp.id)
    setGenerationProgress({})

    try {
      // Step 1: Strategic Plan (2 sec)
      setGenerationProgress(prev => ({ ...prev, strategy: 'Generating strategic plan...' }))
      const strategyResponse = await fetch('/api/generate-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunity: opp })
      })
      const strategy = await strategyResponse.json()
      setGenerationProgress(prev => ({ ...prev, strategy: '✓ Strategic plan complete' }))

      // Step 2: Written Content (10 sec)
      setGenerationProgress(prev => ({ ...prev, content: 'Creating written content...' }))
      const contentResponse = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          opportunity: opp,
          strategy,
          types: ['press_release', 'blog_post', 'social_posts', 'email_pitches']
        })
      })
      const content = await contentResponse.json()
      setGenerationProgress(prev => ({ ...prev, content: '✓ Written content ready' }))

      // Step 3: Visual Content (15 sec)
      setGenerationProgress(prev => ({ ...prev, visuals: 'Generating visuals with DALL-E 3...' }))
      const visualResponse = await fetch('/api/generate-visuals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          opportunity: opp,
          content,
          types: ['hero_image', 'infographic', 'social_graphics']
        })
      })
      const visuals = await visualResponse.json()
      setGenerationProgress(prev => ({ ...prev, visuals: '✓ Visual content created' }))

      // Step 4: Media Strategy (5 sec)
      setGenerationProgress(prev => ({ ...prev, media: 'Building media list...' }))
      const mediaResponse = await fetch('/api/generate-media-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunity: opp })
      })
      const mediaStrategy = await mediaResponse.json()
      setGenerationProgress(prev => ({ ...prev, media: '✓ Media strategy complete' }))

      // Step 5: Social Campaign (3 sec)
      setGenerationProgress(prev => ({ ...prev, social: 'Creating social campaign...' }))
      const socialResponse = await fetch('/api/generate-social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          opportunity: opp,
          content,
          visuals
        })
      })
      const socialCampaign = await socialResponse.json()
      setGenerationProgress(prev => ({ ...prev, social: '✓ Social campaign ready' }))

      // Update opportunity with generated content
      const updatedOpp = {
        ...opp,
        execution_status: 'complete' as const,
        generated_content: {
          ...strategy,
          ...content,
          visuals: visuals.images,
          media_list: mediaStrategy.journalists,
          social_campaign: socialCampaign
        }
      }

      setOpportunities(prev => 
        prev.map(o => o.id === opp.id ? updatedOpp : o)
      )
      setSelectedOpp(updatedOpp)
      
      // Save to database
      await supabase
        .from('campaigns')
        .insert({
          opportunity_id: opp.id,
          organization_id: '1',
          title: opp.title,
          status: 'ready',
          content: updatedOpp.generated_content
        })

    } catch (error) {
      console.error('Execution error:', error)
    } finally {
      setExecuting(null)
      setTimeout(() => setGenerationProgress({}), 3000)
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
            <h2 className="text-lg font-semibold text-white">Opportunity Engine</h2>
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

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Opportunities List */}
        <div className="w-2/5 border-r border-gray-800 overflow-y-auto">
          <div className="p-4 space-y-3">
            {opportunities.map((opp) => (
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
                {/* Opportunity Card Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-white line-clamp-2 flex-1">
                        {opp.title}
                      </h3>
                      {/* Social Media Indicator */}
                      {(opp.data?.source === 'social_media' || opp.data?.context?.source_platforms) && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-400">
                          <Share2 className="w-3 h-3" />
                          <span>Social</span>
                        </div>
                      )}
                    </div>
                    {/* Show creative campaign name if available */}
                    {(opp.campaign_name || opp.data?.campaign_name) && (
                      <div className="flex items-center gap-1 mb-1">
                        <Megaphone className="w-3 h-3 text-purple-400" />
                        <span className="text-xs text-purple-400 font-medium">
                          {opp.campaign_name || opp.data?.campaign_name}
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 line-clamp-2">
                      {opp.description}
                    </p>
                  </div>
                  <div className={`text-2xl font-bold ${getScoreColor(opp.score)}`}>
                    {opp.score}
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex items-center gap-3 mt-3">
                  <span className={`px-2 py-0.5 text-xs rounded-full border ${getUrgencyColor(opp.urgency)}`}>
                    {opp.urgency.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {opp.time_window}
                  </span>
                  <span className="text-xs text-gray-500">
                    {opp.category}
                  </span>
                </div>

                {/* Quick Execute Button */}
                {opp.urgency === 'high' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      executeOpportunity(opp)
                    }}
                    disabled={executing === opp.id}
                    className="mt-3 w-full px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {executing === opp.id ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Generating Campaign...
                      </>
                    ) : (
                      <>
                        <Zap className="w-3 h-3" />
                        Execute Now
                      </>
                    )}
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Selected Opportunity Details */}
        <div className="flex-1 overflow-y-auto">
          {selectedOpp ? (
            <div className="p-6">
              {/* Detail Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">{selectedOpp.title}</h2>
                <p className="text-gray-400">{selectedOpp.description}</p>
                
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-gray-300">Score: </span>
                    <span className={`text-lg font-bold ${getScoreColor(selectedOpp.score)}`}>
                      {selectedOpp.score}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-400" />
                    <span className="text-sm text-gray-300">Urgency: </span>
                    <span className={`px-2 py-0.5 text-xs rounded-full border ${getUrgencyColor(selectedOpp.urgency)}`}>
                      {selectedOpp.urgency.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-gray-300">Window: </span>
                    <span className="text-sm text-blue-400">{selectedOpp.time_window}</span>
                  </div>
                </div>
              </div>

              {/* Trigger Event */}
              <div className="mb-6 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Trigger Event</h3>
                <p className="text-sm text-gray-400">{selectedOpp.trigger_event}</p>
              </div>

              {/* Social Signals - Only show for social opportunities */}
              {(selectedOpp.data?.source === 'social_media' || selectedOpp.data?.context?.source_platforms) && (
                <div className="mb-6 p-4 bg-blue-900/10 rounded-lg border border-blue-500/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Share2 className="w-4 h-4 text-blue-400" />
                    <h3 className="text-sm font-semibold text-blue-400">Social Media Signals</h3>
                  </div>

                  {selectedOpp.data?.context?.source_platforms && (
                    <div className="mb-3">
                      <span className="text-xs text-gray-500">Platforms:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedOpp.data.context.source_platforms.map((platform: string, idx: number) => (
                          <span key={idx} className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded border border-blue-500/30">
                            {platform}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedOpp.data?.context?.social_signals && (
                    <div className="space-y-2">
                      <span className="text-xs text-gray-500">
                        {selectedOpp.data.context.social_signals.length} signals detected
                      </span>
                      <div className="max-h-40 overflow-y-auto space-y-2">
                        {selectedOpp.data.context.social_signals.slice(0, 3).map((signal: any, idx: number) => (
                          <div key={idx} className="p-2 bg-gray-900/50 rounded border border-gray-800 text-xs">
                            <div className="text-gray-400 mb-1">{signal.content?.substring(0, 100)}...</div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <span>{signal.platform}</span>
                              {signal.engagement && <span>• {signal.engagement} engagement</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Recommended Action */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Recommended Action Plan</h3>
                
                {/* What */}
                <div className="mb-4 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
                  <h4 className="text-sm font-semibold text-purple-400 mb-2">What to Do</h4>
                  <p className="text-sm text-white mb-2">{selectedOpp.recommended_action?.what?.primary_action || selectedOpp.data?.recommended_action?.what?.primary_action || 'No action defined'}</p>
                  <div className="space-y-1">
                    {(selectedOpp.recommended_action?.what?.specific_tasks || selectedOpp.data?.recommended_action?.what?.specific_tasks || []).map((task, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <ChevronRight className="w-3 h-3 text-gray-500 mt-0.5" />
                        <span className="text-xs text-gray-400">{task}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Who */}
                <div className="mb-4 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
                  <h4 className="text-sm font-semibold text-blue-400 mb-2">Who Should Execute</h4>
                  <p className="text-sm text-white mb-1">Owner: {selectedOpp.recommended_action?.who?.owner || selectedOpp.data?.recommended_action?.who?.owner || 'Not assigned'}</p>
                  <p className="text-xs text-gray-400">Team: {(selectedOpp.recommended_action?.who?.team || selectedOpp.data?.recommended_action?.who?.team || []).join(', ')}</p>
                </div>

                {/* When */}
                <div className="mb-4 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
                  <h4 className="text-sm font-semibold text-green-400 mb-2">When to Execute</h4>
                  <p className="text-sm text-white">
                    {(selectedOpp.recommended_action?.when?.start_immediately || selectedOpp.data?.recommended_action?.when?.start_immediately) ?
                      '⚡ Start Immediately' :
                      `Ideal Launch: ${selectedOpp.recommended_action?.when?.ideal_launch || selectedOpp.data?.recommended_action?.when?.ideal_launch || 'TBD'}`
                    }
                  </p>
                  <p className="text-xs text-gray-400">Duration: {selectedOpp.recommended_action?.when?.duration || selectedOpp.data?.recommended_action?.when?.duration || 'TBD'}</p>
                </div>

                {/* Where */}
                <div className="mb-6 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
                  <h4 className="text-sm font-semibold text-orange-400 mb-2">Where to Execute</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs text-gray-500">Channels:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(selectedOpp.recommended_action?.where?.channels || selectedOpp.data?.recommended_action?.where?.channels || []).map((channel, idx) => (
                          <span key={idx} className="px-2 py-0.5 text-xs bg-gray-800 text-gray-300 rounded">
                            {channel}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Creative Campaign Section - Moved to bottom */}
              {(selectedOpp.campaign_name || selectedOpp.data?.campaign_name ||
                selectedOpp.creative_approach || selectedOpp.data?.creative_approach) && (
                <div className="mb-6 p-4 bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-lg border border-purple-500/30">
                  <div className="flex items-center gap-2 mb-3">
                    <Palette className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-semibold text-purple-300">Creative Campaign Strategy</h3>
                    <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded-full">AI Generated</span>
                  </div>

                  {(selectedOpp.campaign_name || selectedOpp.data?.campaign_name) && (
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Megaphone className="w-3 h-3 text-pink-400" />
                        <span className="text-xs text-gray-400">Campaign Name</span>
                      </div>
                      <p className="text-sm text-white font-medium">
                        {selectedOpp.campaign_name || selectedOpp.data?.campaign_name}
                      </p>
                    </div>
                  )}

                  {(selectedOpp.creative_approach || selectedOpp.data?.creative_approach) && (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-3 h-3 text-yellow-400" />
                        <span className="text-xs text-gray-400">Creative Approach</span>
                      </div>
                      <p className="text-sm text-gray-300">
                        {selectedOpp.creative_approach || selectedOpp.data?.creative_approach}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* One-Click Execution */}
              <div className="mb-6">
                <button
                  onClick={() => executeOpportunity(selectedOpp)}
                  disabled={executing === selectedOpp.id || selectedOpp.execution_status === 'complete'}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {executing === selectedOpp.id ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating Complete Campaign (35 seconds)...
                    </>
                  ) : selectedOpp.execution_status === 'complete' ? (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Campaign Ready - View Results
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Execute Opportunity - Generate Full Campaign
                    </>
                  )}
                </button>
              </div>

              {/* Generation Progress */}
              {Object.keys(generationProgress).length > 0 && (
                <div className="mb-6 p-4 bg-gray-900/50 rounded-lg border border-purple-500/30">
                  <h4 className="text-sm font-semibold text-purple-400 mb-3">Generation Progress</h4>
                  <div className="space-y-2">
                    {Object.entries(generationProgress).map(([key, status]) => (
                      <div key={key} className="flex items-center gap-2">
                        {status.includes('✓') ? (
                          <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-xs text-white">✓</span>
                          </div>
                        ) : (
                          <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        )}
                        <span className="text-xs text-gray-300">{status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Generated Content Preview */}
              {selectedOpp.generated_content && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Generated Campaign Assets</h3>
                  
                  {/* Content Types */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800">
                      <FileText className="w-5 h-5 text-blue-400 mb-2" />
                      <h4 className="text-sm font-semibold text-white mb-1">Press Release</h4>
                      <p className="text-xs text-gray-400">Ready for distribution</p>
                    </div>
                    <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800">
                      <Image className="w-5 h-5 text-green-400 mb-2" />
                      <h4 className="text-sm font-semibold text-white mb-1">Visual Content</h4>
                      <p className="text-xs text-gray-400">3 images generated</p>
                    </div>
                    <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800">
                      <Users className="w-5 h-5 text-purple-400 mb-2" />
                      <h4 className="text-sm font-semibold text-white mb-1">Media List</h4>
                      <p className="text-xs text-gray-400">25 journalists identified</p>
                    </div>
                    <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800">
                      <Share2 className="w-5 h-5 text-pink-400 mb-2" />
                      <h4 className="text-sm font-semibold text-white mb-1">Social Campaign</h4>
                      <p className="text-xs text-gray-400">5 platforms ready</p>
                    </div>
                  </div>

                  {/* Export Actions */}
                  <div className="flex gap-3">
                    <button className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors">
                      View Full Campaign
                    </button>
                    <button className="flex-1 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 text-sm rounded-lg transition-colors">
                      Export All Assets
                    </button>
                  </div>
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
    </div>
  )
}