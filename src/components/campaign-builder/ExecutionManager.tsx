'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ContentPiece {
  id: string
  type: string
  targetStakeholder?: string
  phase?: string
  content?: string
  status: 'pending' | 'generating' | 'completed' | 'error'
  metadata?: any
}

interface ExecutionManagerProps {
  blueprintId: string
  blueprint: any
  campaignType: 'PR_CAMPAIGN' | 'VECTOR_CAMPAIGN'
  orgId: string
  organizationContext: {
    name: string
    industry: string
  }
  onComplete?: () => void
}

export function ExecutionManager({
  blueprintId,
  blueprint,
  campaignType,
  orgId,
  organizationContext,
  onComplete
}: ExecutionManagerProps) {
  const [contentPieces, setContentPieces] = useState<ContentPiece[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedPiece, setSelectedPiece] = useState<ContentPiece | null>(null)
  const [refinementInput, setRefinementInput] = useState('')
  const [showRefinementInput, setShowRefinementInput] = useState(false)
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 })

  // Close modal on escape key and manage body scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showRefinementInput) {
        setShowRefinementInput(false)
        setRefinementInput('')
      }
    }

    if (showRefinementInput) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleEscape)
    }

    return () => {
      // Restore body scroll when modal closes
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleEscape)
    }
  }, [showRefinementInput])

  useEffect(() => {
    console.log('🎬 ExecutionManager mounted')
    console.log('📋 Blueprint:', blueprint)
    console.log('🏷️  Campaign type:', campaignType)

    try {
      // Log blueprint structure for debugging
      if (blueprint) {
        console.log('🔍 Blueprint keys:', Object.keys(blueprint))

        // Check for different blueprint versions
        if (blueprint.part3_tacticalOrchestration) {
          console.log('✓ Found V3 structure: part3_tacticalOrchestration')
          console.log('  - Keys:', Object.keys(blueprint.part3_tacticalOrchestration))
        }
        if (blueprint.part3_orchestrationStrategy) {
          console.log('✓ Found V2 structure: part3_orchestrationStrategy')
          console.log('  - Has phases:', !!blueprint.part3_orchestrationStrategy.phases)
        }
        if (blueprint.part4_tacticalExecution) {
          console.log('✓ Found V1 structure: part4_tacticalExecution')
        }
        if (blueprint.pressReleaseStrategy) {
          console.log('✓ Found PR Campaign structure')
        }
      }

      console.log('🔄 About to call extractContentInventory...')

      // Extract content inventory from blueprint
      const inventory = extractContentInventory(blueprint, campaignType)

      console.log('📦 Content inventory extracted:', inventory.length, 'pieces')

      if (inventory.length === 0) {
        console.warn('⚠️ No content pieces found in blueprint!')
        console.warn('   Blueprint structure may not match expected format')
      } else {
        console.log('   Piece types:', [...new Set(inventory.map(p => p.type))])
      }

      console.log('💾 Setting content pieces state...')
      setContentPieces(inventory)
      console.log('✅ Content pieces state set successfully')

    } catch (error) {
      console.error('❌ ERROR in ExecutionManager useEffect:', error)
      console.error('   Error message:', error instanceof Error ? error.message : String(error))
      console.error('   Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      console.error('   Blueprint object:', JSON.stringify(blueprint).substring(0, 500))
    }
  }, [blueprint, campaignType])

  const extractContentInventory = (bp: any, type: string): ContentPiece[] => {
    const pieces: ContentPiece[] = []

    if (type === 'PR_CAMPAIGN') {
      if (bp.pressReleaseStrategy?.primaryRelease) {
        pieces.push({
          id: 'press_release_primary',
          type: 'Press Release (Primary)',
          status: 'pending',
          metadata: { priority: 'high' }
        })
      }

      if (bp.pressReleaseStrategy?.followUpReleases) {
        bp.pressReleaseStrategy.followUpReleases.forEach((_: any, i: number) => {
          pieces.push({
            id: `press_release_followup_${i + 1}`,
            type: `Press Release (Follow-up ${i + 1})`,
            status: 'pending',
            metadata: { priority: 'medium' }
          })
        })
      }

      if (bp.mediaTargeting?.tier1Outlets) {
        bp.mediaTargeting.tier1Outlets.slice(0, 5).forEach((outlet: any, i: number) => {
          pieces.push({
            id: `media_pitch_${i + 1}`,
            type: `Media Pitch - ${outlet.outlet}`,
            status: 'pending',
            metadata: { priority: 'high', outlet: outlet.outlet }
          })
        })
      }

      pieces.push({
        id: 'social_post_linkedin',
        type: 'LinkedIn Post',
        status: 'pending',
        metadata: { priority: 'medium' }
      })

    } else if (type === 'VECTOR_CAMPAIGN') {
      // Check for V3 structure first (Blueprint V3)
      const v3TacticalOrchestration = bp.part3_tacticalOrchestration

      if (v3TacticalOrchestration) {
        // BLUEPRINT V3 STRUCTURE - Extract from part3_tacticalOrchestration
        const phaseKeys = ['phase1_awareness', 'phase2_consideration', 'phase3_conversion', 'phase4_advocacy']
        const phaseNames: Record<string, string> = {
          phase1_awareness: 'awareness',
          phase2_consideration: 'consideration',
          phase3_conversion: 'conversion',
          phase4_advocacy: 'advocacy'
        }

        phaseKeys.forEach((phaseKey) => {
          const phaseData = v3TacticalOrchestration[phaseKey]
          if (!phaseData) return

          const phaseName = phaseNames[phaseKey]

          // Pillar 1: Owned Actions (Signaldesk auto-generates)
          if (phaseData.pillar1_ownedActions && Array.isArray(phaseData.pillar1_ownedActions)) {
            phaseData.pillar1_ownedActions.forEach((action: any, idx: number) => {
              pieces.push({
                id: `${phaseKey}_p1_${idx}`,
                type: action.contentType || 'Owned Content',
                targetStakeholder: action.targetStakeholder || 'General Audience',
                phase: phaseName,
                status: 'pending',
                metadata: {
                  priority: idx === 0 ? 'high' : 'medium',
                  pillar: 'Owned Actions',
                  positioningMessage: action.positioningMessage,
                  keyPoints: action.keyPoints,
                  timing: action.timing,
                  executionOwner: action.executionOwner || 'signaldesk',
                  // Social media fields
                  platform: action.platform,
                  postOwner: action.postOwner,
                  postFormat: action.postFormat
                }
              })
            })
          }

          // Pillar 4: Media Engagement (Signaldesk auto-generates)
          if (phaseData.pillar4_mediaEngagement && Array.isArray(phaseData.pillar4_mediaEngagement)) {
            phaseData.pillar4_mediaEngagement.forEach((media: any, idx: number) => {
              pieces.push({
                id: `${phaseKey}_p4_${idx}`,
                type: 'Media Pitch',
                targetStakeholder: media.journalists?.join(', ') || 'Media',
                phase: phaseName,
                status: 'pending',
                metadata: {
                  priority: 'high',
                  pillar: 'Media Engagement',
                  story: media.story,
                  positioningMessage: media.positioningMessage,
                  timing: media.timing,
                  executionOwner: media.executionOwner || 'signaldesk'
                }
              })
            })
          }

          // Pillar 2 & 3 are user-required, so we don't auto-generate those
        })

      } else {
        // Check for V2 structure (Four-Pillar Orchestration)
        const orchestrationPhases = bp.part3_orchestrationStrategy?.phases

        if (orchestrationPhases) {
        // V2 STRUCTURE - Extract from Four Pillars
        const phaseKeys = ['phase1_awareness', 'phase2_consideration', 'phase3_conversion', 'phase4_advocacy']
        const phaseNames: Record<string, string> = {
          phase1_awareness: 'Phase 1',
          phase2_consideration: 'Phase 2',
          phase3_conversion: 'Phase 3',
          phase4_advocacy: 'Phase 4'
        }

        phaseKeys.forEach((phaseKey) => {
          const phaseData = orchestrationPhases[phaseKey]
          if (!phaseData) return

          const phaseName = phaseNames[phaseKey]
          let contentCounter = 0

          // Extract from Pillar 1: Owned Actions
          if (phaseData.pillar1_ownedActions?.organizationalVoice) {
            phaseData.pillar1_ownedActions.organizationalVoice.forEach((voice: any) => {
              if (voice.contentNeeds && Array.isArray(voice.contentNeeds)) {
                voice.contentNeeds.forEach((content: any, idx: number) => {
                  contentCounter++
                  pieces.push({
                    id: `${phaseKey}_owned_${contentCounter}`,
                    type: content.contentType || 'Content Piece',
                    targetStakeholder: content.targetStakeholder || 'General Audience',
                    phase: phaseName,
                    status: 'pending',
                    metadata: {
                      priority: idx === 0 ? 'high' : 'medium',
                      pillar: 'Owned Actions',
                      topic: content.topic,
                      coreMessage: content.coreMessage,
                      timing: content.timing,
                      signaldeskGenerates: content.signaldesk_generates || content.signaldeskGenerates,
                      userExecutes: content.user_executes || content.userExecutes
                    }
                  })
                })
              }
            })
          }

          // Extract from Pillar 2: Relationship Orchestration
          if (phaseData.pillar2_relationshipOrchestration) {
            const tier1 = phaseData.pillar2_relationshipOrchestration.tier1Influencers ||
                          phaseData.pillar2_relationshipOrchestration.tier1_influencers || []

            tier1.forEach((influencer: any) => {
              const contentToCreate = influencer.engagement_strategy?.content_to_create_for_them ||
                                     influencer.engagementStrategy?.contentToCreateForThem ||
                                     influencer.contentToCreateForThem || []

              contentToCreate.forEach((content: any, idx: number) => {
                contentCounter++
                pieces.push({
                  id: `${phaseKey}_relationship_${contentCounter}`,
                  type: content.contentType || 'Relationship Content',
                  targetStakeholder: influencer.stakeholder_segment || influencer.name || 'Influencer',
                  phase: phaseName,
                  status: 'pending',
                  metadata: {
                    priority: idx === 0 ? 'high' : 'medium',
                    pillar: 'Relationship Orchestration',
                    topic: content.topic,
                    why: content.why,
                    timing: content.timing,
                    signaldeskGenerates: content.signaldesk_generates || content.signaldeskGenerates,
                    userExecutes: content.user_executes || content.userExecutes
                  }
                })
              })
            })
          }

          // Extract from Pillar 3: Event Orchestration
          if (phaseData.pillar3_eventOrchestration) {
            const events = phaseData.pillar3_eventOrchestration.tier1Events ||
                          phaseData.pillar3_eventOrchestration.tier1_events || []

            events.forEach((event: any) => {
              const eventContent = event.content_signaldesk_generates ||
                                  event.contentSignaldeskGenerates ||
                                  event.presence_strategy?.content_signaldesk_generates || []

              eventContent.forEach((contentType: string, idx: number) => {
                contentCounter++
                // Parse format like "panel-proposal: Session description"
                const [type, description] = contentType.split(':').map((s: string) => s.trim())

                pieces.push({
                  id: `${phaseKey}_event_${contentCounter}`,
                  type: type || contentType,
                  targetStakeholder: event.attendance || 'Event Attendees',
                  phase: phaseName,
                  status: 'pending',
                  metadata: {
                    priority: idx === 0 ? 'high' : 'medium',
                    pillar: 'Event Orchestration',
                    eventName: event.eventName || event.event,
                    description: description,
                    timing: event.date
                  }
                })
              })
            })
          }

          // Extract from Pillar 4: Media Engagement
          if (phaseData.pillar4_mediaEngagement?.outletStrategy) {
            phaseData.pillar4_mediaEngagement.outletStrategy.forEach((outlet: any) => {
              const storiesToPitch = outlet.stories_to_pitch || outlet.storiesToPitch || []

              storiesToPitch.forEach((story: any, storyIdx: number) => {
                const contentToGenerate = story.content_signaldesk_generates ||
                                         story.contentSignaldeskGenerates || {}

                // Each type of content in the media-pitch package
                Object.entries(contentToGenerate).forEach(([contentType, description], idx) => {
                  contentCounter++
                  pieces.push({
                    id: `${phaseKey}_media_${contentCounter}`,
                    type: contentType,
                    targetStakeholder: outlet.outlet_tier || outlet.outletTier || 'Media',
                    phase: phaseName,
                    status: 'pending',
                    metadata: {
                      priority: storyIdx === 0 && idx === 0 ? 'high' : 'medium',
                      pillar: 'Media Engagement',
                      storyAngle: story.story_angle || story.storyAngle,
                      outlets: story.outlets,
                      timing: story.timing,
                      description: description
                    }
                  })
                })
              })
            })
          }
        })

      } else {
        // V1 FALLBACK - Old structure
        if (bp.part4_tacticalExecution?.contentRequirements) {
          bp.part4_tacticalExecution.contentRequirements.forEach((req: any, i: number) => {
            pieces.push({
              id: `vector_content_${i + 1}`,
              type: req.type || 'Content Piece',
              targetStakeholder: req.stakeholder,
              phase: req.phase,
              status: 'pending',
              metadata: { priority: i < 5 ? 'high' : 'medium' }
            })
          })
        }

        if (bp.part4_contentNeeds?.contentPieces) {
          bp.part4_contentNeeds.contentPieces.forEach((content: any, i: number) => {
            pieces.push({
              id: `content_${i + 1}`,
              type: content.contentType || 'Content Piece',
              targetStakeholder: content.targetStakeholder,
              phase: content.phase,
              status: 'pending',
              metadata: {
                priority: i < 5 ? 'high' : 'medium',
                coreMessage: content.coreMessage,
                distributionChannel: content.distributionChannel
              }
            })
          })
        }

        if (bp.part2_stakeholderMapping?.groups) {
          bp.part2_stakeholderMapping.groups.slice(0, 3).forEach((group: any) => {
            pieces.push({
              id: `awareness_${group.name.toLowerCase().replace(/\s+/g, '_')}`,
              type: 'Awareness Content',
              targetStakeholder: group.name,
              phase: 'Phase 1',
              status: 'pending',
              metadata: { priority: 'high' }
            })
          })
        }
      }
    }

    return pieces
  }

  const generateAllContent = async () => {
    console.log('🚀 generateAllContent called!')
    console.log('📦 Content pieces to generate:', contentPieces.length)
    console.log('🏢 Organization context:', organizationContext)
    console.log('📋 Blueprint ID:', blueprintId)

    try {
      setIsGenerating(true)
      setGenerationProgress({ current: 0, total: contentPieces.length })

      console.log('🌐 About to call /api/campaign-executor...')
      console.log('📋 Request body:', {
        blueprintId,
        hasBlueprint: !!blueprint,
        campaignType,
        orgId,
        organizationContext
      })

      const response = await fetch('/api/campaign-executor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blueprintId,
          blueprint,
          campaignType,
          orgId,
          organizationContext
        })
      })

      console.log('📡 Response received:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API error response:', errorText)
        throw new Error(`Content generation failed: ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ Content generation response:', data)

      // Update content pieces with generated content
      setContentPieces(prev => prev.map(piece => {
        const generated = data.content?.find((c: any) =>
          c.metadata?.originalId === piece.id ||
          c.content_type.includes(piece.id)
        )
        if (generated) {
          return {
            ...piece,
            content: generated.content_data,
            status: 'completed' as const
          }
        }
        return piece
      }))

      if (onComplete) {
        onComplete()
      }

    } catch (error) {
      console.error('Generation error:', error)
      setContentPieces(prev => prev.map(p => ({ ...p, status: 'error' as const })))
    } finally {
      setIsGenerating(false)
    }
  }

  const generateSinglePiece = async (pieceId: string) => {
    setContentPieces(prev => prev.map(p =>
      p.id === pieceId ? { ...p, status: 'generating' as const } : p
    ))

    try {
      const response = await fetch('/api/campaign-executor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blueprintId,
          blueprint,
          campaignType,
          contentPieces: [pieceId],
          orgId,
          organizationContext
        })
      })

      if (!response.ok) {
        throw new Error('Content generation failed')
      }

      const data = await response.json()
      const generated = data.content?.[0]

      if (generated) {
        setContentPieces(prev => prev.map(p =>
          p.id === pieceId ? { ...p, content: generated.content_data, status: 'completed' as const } : p
        ))
      }

    } catch (error) {
      console.error('Generation error:', error)
      setContentPieces(prev => prev.map(p =>
        p.id === pieceId ? { ...p, status: 'error' as const } : p
      ))
    }
  }

  const refineContent = async (pieceId: string, feedback: string) => {
    try {
      const response = await fetch('/api/campaign-executor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blueprintId,
          blueprint,
          campaignType,
          orgId,
          organizationContext,
          refinementRequest: {
            pieceId,
            feedback
          }
        })
      })

      if (!response.ok) {
        throw new Error('Refinement failed')
      }

      const data = await response.json()
      const refined = data.content?.[0]

      if (refined) {
        setContentPieces(prev => prev.map(p =>
          p.id === pieceId ? { ...p, content: refined.content } : p
        ))
        setShowRefinementInput(false)
        setRefinementInput('')
      }

    } catch (error) {
      console.error('Refinement error:', error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-500/10 border-red-500/20'
      case 'medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      case 'low': return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20'
    }
  }

  const getPlatformInfo = (platform: string | undefined) => {
    if (!platform) return null

    const platforms: Record<string, { color: string; icon: string }> = {
      'LinkedIn': { color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', icon: '💼' },
      'Twitter': { color: 'text-sky-400 bg-sky-500/10 border-sky-500/20', icon: '🐦' },
      'Instagram': { color: 'text-pink-400 bg-pink-500/10 border-pink-500/20', icon: '📸' },
      'Facebook': { color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', icon: '👥' },
      'TikTok': { color: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20', icon: '🎵' }
    }
    return platforms[platform] || { color: 'text-gray-400 bg-gray-500/10 border-gray-500/20', icon: '📱' }
  }

  const completedCount = contentPieces.filter(p => p.status === 'completed').length
  const totalCount = contentPieces.length
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  // Debug render state
  console.log('🔍 ExecutionManager render state:', {
    contentPiecesCount: contentPieces.length,
    completedCount,
    totalCount,
    isGenerating,
    buttonDisabled: isGenerating || completedCount === totalCount,
    hasBlueprint: !!blueprint,
    hasBlueprintId: !!blueprintId
  })

  console.log('🎨 ABOUT TO RENDER - contentPieces.length:', contentPieces.length)

  // If no content pieces, show empty state
  if (contentPieces.length === 0) {
    console.log('⚠️ SHOWING EMPTY STATE because contentPieces.length === 0')
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h2 className="text-3xl font-bold text-white">Content Execution</h2>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-white mb-2">No Content Pieces Found</h3>
            <p className="text-gray-400 mb-4">
              The blueprint doesn't contain any auto-generated content pieces.
            </p>
            <div className="text-sm text-gray-500 text-left max-w-xl mx-auto space-y-2">
              <p className="font-semibold text-gray-400">Expected blueprint structure:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>V3: <code className="text-blue-400">part3_tacticalOrchestration</code> with pillar1_ownedActions and pillar4_mediaEngagement</li>
                <li>V2: <code className="text-blue-400">part3_orchestrationStrategy.phases</code> with four pillars</li>
                <li>V1: <code className="text-blue-400">part4_tacticalExecution.contentRequirements</code></li>
              </ul>
              <p className="mt-4 text-amber-500">
                Check browser console for blueprint structure details
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  console.log('🎨 RENDERING ExecutionManager UI with', contentPieces.length, 'pieces')

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <h2 className="text-3xl font-bold text-white">Content Execution</h2>
        <p className="text-gray-400">
          Generate campaign content from your {campaignType === 'PR_CAMPAIGN' ? 'PR' : 'VECTOR'} blueprint
        </p>
      </motion.div>

      {/* Progress Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-white font-medium">Content Generation Progress</span>
          <span className="text-gray-400">{completedCount} / {totalCount}</span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-600 to-purple-600"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => {
              console.log('🔵 BUTTON CLICKED!')
              console.log('isGenerating:', isGenerating)
              console.log('completedCount:', completedCount)
              console.log('totalCount:', totalCount)
              generateAllContent()
            }}
            disabled={isGenerating || completedCount === totalCount}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating All...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate All Content
              </>
            )}
          </button>
        </div>

        {completedCount === totalCount && totalCount > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export All Content
          </motion.button>
        )}
      </div>

      {/* Content Pieces */}
      <div className="grid grid-cols-1 gap-4">
        {contentPieces.map((piece, i) => (
          <motion.div
            key={piece.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden hover:border-zinc-700 transition-all"
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="font-semibold text-white">{piece.type}</h3>
                    <span className={`text-xs px-2 py-1 rounded border ${getPriorityColor(piece.metadata?.priority)}`}>
                      {piece.metadata?.priority || 'medium'}
                    </span>
                    {piece.phase && (
                      <span className="text-xs px-2 py-1 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400">
                        {piece.phase}
                      </span>
                    )}
                    {piece.metadata?.platform && getPlatformInfo(piece.metadata.platform) && (
                      <span className={`text-xs px-2 py-1 rounded border ${getPlatformInfo(piece.metadata.platform)?.color} flex items-center gap-1`}>
                        <span>{getPlatformInfo(piece.metadata.platform)?.icon}</span>
                        {piece.metadata.platform}
                      </span>
                    )}
                  </div>
                  {piece.targetStakeholder && (
                    <p className="text-sm text-gray-400">Target: {piece.targetStakeholder}</p>
                  )}
                  {piece.metadata?.postOwner && (
                    <p className="text-sm text-gray-400">Posted by: {piece.metadata.postOwner}</p>
                  )}
                  {piece.metadata?.postFormat && (
                    <p className="text-sm text-gray-400">Format: {piece.metadata.postFormat}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {piece.status === 'pending' && (
                    <button
                      onClick={() => generateSinglePiece(piece.id)}
                      className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-all"
                    >
                      Generate
                    </button>
                  )}
                  {piece.status === 'generating' && (
                    <svg className="animate-spin h-5 w-5 text-blue-500" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  {piece.status === 'completed' && (
                    <svg className="w-6 h-6 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {piece.status === 'error' && (
                    <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
              </div>

              {piece.content && (
                <div className="mt-3 pt-3 border-t border-zinc-800">
                  <button
                    onClick={() => setSelectedPiece(selectedPiece?.id === piece.id ? null : piece)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Preview</span>
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform ${selectedPiece?.id === piece.id ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  <AnimatePresence>
                    {selectedPiece?.id === piece.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-3 space-y-3"
                      >
                        <div className="p-3 bg-zinc-800/50 rounded text-sm text-gray-300 max-h-64 overflow-y-auto whitespace-pre-wrap">
                          {piece.content}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setShowRefinementInput(true)
                              setSelectedPiece(piece)
                            }}
                            className="text-sm px-3 py-1 bg-zinc-800 text-white rounded hover:bg-zinc-700 transition-all"
                          >
                            Refine
                          </button>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(piece.content || '')
                            }}
                            className="text-sm px-3 py-1 bg-zinc-800 text-white rounded hover:bg-zinc-700 transition-all"
                          >
                            Copy
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Refinement Modal */}
      <AnimatePresence mode="wait">
        {showRefinementInput && selectedPiece && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 pointer-events-auto"
            onClick={() => {
              setShowRefinementInput(false)
              setRefinementInput('')
            }}
            style={{ pointerEvents: 'auto' }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 max-w-2xl w-full pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4">Refine Content</h3>
              <textarea
                value={refinementInput}
                onChange={(e) => setRefinementInput(e.target.value)}
                placeholder="What would you like to change about this content?"
                className="w-full h-32 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (refinementInput.trim() && selectedPiece) {
                      refineContent(selectedPiece.id, refinementInput)
                    }
                  }}
                  disabled={!refinementInput.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all"
                >
                  Refine Content
                </button>
                <button
                  onClick={() => {
                    setShowRefinementInput(false)
                    setRefinementInput('')
                  }}
                  className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
