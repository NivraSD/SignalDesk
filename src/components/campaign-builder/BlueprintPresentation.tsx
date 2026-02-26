'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface BlueprintData {
  // PR Campaign Blueprint
  overview?: {
    campaignName?: string
    tagline?: string
    duration?: string
    budget?: string
    objective?: string
    pattern?: string
    complexity?: string
  }
  pressReleaseStrategy?: {
    primaryRelease?: any
    followUpReleases?: any[]
  }
  mediaTargeting?: {
    tier1Outlets?: any[]
    tier2Outlets?: string[]
    industryPublications?: string[]
  }
  spokespersonPositioning?: {
    primarySpokesperson?: string
    expertise?: string
    talkingPoints?: string[]
    mediaTraining?: string
  }
  keyMessages?: {
    primary?: string
    supporting?: string[]
    proofPoints?: string[]
  }
  timeline?: Record<string, string[]>
  successMetrics?: Record<string, string>
  risks?: any[]
  budget?: Record<string, string>

  // VECTOR Campaign Blueprint v2
  part1_goalFramework?: {
    primaryObjective?: string
    behavioralGoals?: any[]
    kpis?: string[]
    successCriteria?: string
    riskAssessment?: any[]
  }
  part2_stakeholderMapping?: {
    groups?: any[]
    stakeholderRelationships?: string
    priorityOrder?: string[]
  }
  // v2 structure with orchestration strategy
  part3_orchestrationStrategy?: {
    phases?: {
      phase1_awareness?: any
      phase2_consideration?: any
      phase3_conversion?: any
      phase4_advocacy?: any
    }
  }
  // Legacy v1 structure (backward compatibility)
  part3_sequentialStrategy?: {
    phase1_awareness?: any
    phase2_consideration?: any
    phase3_conversion?: any
    phase4_advocacy?: any
  }
  part4_counterNarrative?: {
    threatScenarios?: any[]
  }
  part5_executionRequirements?: {
    teamBandwidth?: any
    budgetConsiderations?: any
    adaptationStrategy?: any
  }
  part6_patternGuidance?: {
    selectedPattern?: any
  }
  // Legacy v1 structure (backward compatibility)
  part4_contentNeeds?: {
    contentPieces?: any[]
    executionSequence?: string
    dependencies?: string
    criticalPath?: string
  }
}

interface BlueprintPresentationProps {
  blueprint: BlueprintData
  blueprintType: 'PR_CAMPAIGN' | 'VECTOR_CAMPAIGN'
  onRefine?: (request: string) => void
  onExport?: () => void
  onExecute?: () => void
  isRefining?: boolean
}

export function BlueprintPresentation({
  blueprint,
  blueprintType,
  onRefine,
  onExport,
  onExecute,
  isRefining
}: BlueprintPresentationProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [refinementInput, setRefinementInput] = useState('')
  const [showRefinementInput, setShowRefinementInput] = useState(false)

  const handleRefineSubmit = () => {
    if (refinementInput.trim() && onRefine) {
      onRefine(refinementInput.trim())
      setRefinementInput('')
      setShowRefinementInput(false)
    }
  }

  // PR Campaign Sections
  const prSections = [
    {
      id: 'overview',
      title: 'Campaign Overview',
      icon: '📊',
      color: 'blue',
      render: () => (
        <div className="space-y-3">
          <p className="text-gray-300">{blueprint.overview?.objective || 'N/A'}</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-sm text-gray-400">Duration</p>
              <p className="text-white font-medium">{blueprint.overview?.duration || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Budget</p>
              <p className="text-white font-medium">{blueprint.overview?.budget || 'N/A'}</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'press',
      title: 'Press Release Strategy',
      icon: '📰',
      color: 'emerald',
      render: () => (
        <div className="space-y-4">
          {blueprint.pressReleaseStrategy?.primaryRelease && (
            <div>
              <p className="text-sm text-gray-400 mb-1">Primary Release</p>
              <p className="text-white font-medium">{blueprint.pressReleaseStrategy.primaryRelease.headline}</p>
              <p className="text-sm text-gray-300 mt-2">{blueprint.pressReleaseStrategy.primaryRelease.angle}</p>
              <p className="text-xs text-gray-400 mt-1">Timing: {blueprint.pressReleaseStrategy.primaryRelease.timing}</p>
            </div>
          )}
          {blueprint.pressReleaseStrategy?.followUpReleases && blueprint.pressReleaseStrategy.followUpReleases.length > 0 && (
            <div>
              <p className="text-sm text-gray-400 mb-2">Follow-Up Releases</p>
              {blueprint.pressReleaseStrategy.followUpReleases.map((fr: any, i: number) => (
                <div key={i} className="text-sm mb-2">
                  <span className="text-white">• {fr.headline}</span>
                  <span className="text-gray-400"> ({fr.timing})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    },
    {
      id: 'media',
      title: 'Media Targeting',
      icon: '🎯',
      color: 'purple',
      render: () => (
        <div className="space-y-3">
          {blueprint.mediaTargeting?.tier1Outlets && blueprint.mediaTargeting.tier1Outlets.length > 0 && (
            <div>
              <p className="text-sm text-gray-400 mb-2">Tier 1 Priority Outlets</p>
              {blueprint.mediaTargeting.tier1Outlets.map((outlet: any, i: number) => (
                <div key={i} className="mb-3 p-2 bg-zinc-800/50 rounded">
                  <p className="text-white font-medium">{outlet.outlet}</p>
                  <p className="text-xs text-gray-400">{outlet.journalist}</p>
                  <p className="text-sm text-gray-300 mt-1">{outlet.angle}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    },
    {
      id: 'messages',
      title: 'Key Messages',
      icon: '💬',
      color: 'amber',
      render: () => (
        <div className="space-y-3">
          {blueprint.keyMessages?.primary && (
            <div>
              <p className="text-sm text-gray-400">Primary Message</p>
              <p className="text-white font-medium">{blueprint.keyMessages.primary}</p>
            </div>
          )}
          {blueprint.keyMessages?.supporting && blueprint.keyMessages.supporting.length > 0 && (
            <div>
              <p className="text-sm text-gray-400 mb-1">Supporting Messages</p>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                {blueprint.keyMessages.supporting.map((msg: string, i: number) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )
    }
  ]

  // VECTOR Campaign Sections
  const vectorSections = [
    {
      id: 'overview',
      title: 'Campaign Overview',
      icon: '🎯',
      color: 'blue',
      render: () => (
        <div className="space-y-3">
          <p className="text-gray-300">{blueprint.overview?.objective || 'N/A'}</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-sm text-gray-400">Pattern</p>
              <p className="text-white font-medium">{blueprint.overview?.pattern || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Duration</p>
              <p className="text-white font-medium">{blueprint.overview?.duration || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Complexity</p>
              <p className="text-white font-medium">{blueprint.overview?.complexity || 'N/A'}</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'goals',
      title: 'Goal Framework',
      icon: '🎪',
      color: 'emerald',
      render: () => (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-400">Primary Objective</p>
            <p className="text-white">{blueprint.part1_goalFramework?.primaryObjective || 'N/A'}</p>
          </div>
          {blueprint.part1_goalFramework?.behavioralGoals && blueprint.part1_goalFramework.behavioralGoals.length > 0 && (
            <div>
              <p className="text-sm text-gray-400 mb-2">Behavioral Goals</p>
              {blueprint.part1_goalFramework.behavioralGoals.map((goal: any, i: number) => (
                <div key={i} className="mb-3 p-2 bg-zinc-800/50 rounded">
                  <p className="text-white font-medium">{goal.stakeholder}</p>
                  <p className="text-sm text-gray-300 mt-1">→ {goal.desiredBehavior}</p>
                  <p className="text-xs text-gray-400 mt-1">Metric: {goal.successMetric}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    },
    {
      id: 'stakeholders',
      title: 'Stakeholder Mapping',
      icon: '👥',
      color: 'purple',
      render: () => (
        <div className="space-y-3">
          {blueprint.part2_stakeholderMapping?.groups && blueprint.part2_stakeholderMapping.groups.map((group: any, i: number) => (
            <div key={i} className="p-3 bg-zinc-800/50 rounded">
              <p className="text-white font-semibold mb-2">{group.name}</p>
              <p className="text-xs text-gray-400 mb-2">Size: {group.size}</p>
              {group.psychologicalProfile && (
                <div className="text-sm space-y-1">
                  <p className="text-gray-300">
                    <span className="text-gray-400">Values:</span> {group.psychologicalProfile.values?.join(', ')}
                  </p>
                  <p className="text-gray-300">
                    <span className="text-gray-400">Fears:</span> {group.psychologicalProfile.fears?.join(', ')}
                  </p>
                </div>
              )}
              <div className="mt-2 text-xs">
                <p className="text-gray-400">Current → Target</p>
                <p className="text-gray-300">{group.currentPerception} → {group.targetPerception}</p>
              </div>
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'strategy',
      title: 'Orchestration Strategy',
      icon: '📅',
      color: 'amber',
      render: () => {
        const phases = [
          { key: 'phase1_awareness', label: 'Phase 1: Awareness' },
          { key: 'phase2_consideration', label: 'Phase 2: Consideration' },
          { key: 'phase3_conversion', label: 'Phase 3: Conversion' },
          { key: 'phase4_advocacy', label: 'Phase 4: Advocacy' }
        ]

        // v2 structure with orchestration strategy (preferred)
        const orchestrationData = blueprint.part3_orchestrationStrategy?.phases
        // v1 fallback
        const sequentialData = blueprint.part3_sequentialStrategy

        return (
          <div className="space-y-4">
            {phases.map((phase, i) => {
              // Try v2 first, then v1 fallback
              const phaseData = orchestrationData?.[phase.key] || sequentialData?.[phase.key]
              if (!phaseData) return null

              // Check if this is v2 structure (has pillars)
              const isV2 = phaseData.pillar1_ownedActions || phaseData.pillar2_relationshipOrchestration ||
                           phaseData.pillar3_eventOrchestration || phaseData.pillar4_mediaEngagement

              return (
                <div key={i} className="p-4 bg-zinc-800/50 rounded">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-white font-semibold">{phase.label}</p>
                    <span className="text-xs text-gray-400 px-2 py-1 bg-zinc-700/50 rounded">{phaseData.duration}</span>
                  </div>
                  <p className="text-sm text-gray-300 mb-3">{phaseData.objective}</p>

                  {isV2 ? (
                    // V2 Four-Pillar Rendering
                    <div className="space-y-4 mt-4">
                      {/* Pillar 1: Owned Actions */}
                      {phaseData.pillar1_ownedActions && (
                        <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded">
                          <p className="text-sm font-semibold text-blue-300 mb-2">🏢 Pillar 1: Owned Actions</p>

                          {/* Strategy Summary */}
                          {phaseData.pillar1_ownedActions.strategy && (
                            <p className="text-xs text-gray-300 mb-2">{phaseData.pillar1_ownedActions.strategy}</p>
                          )}
                          {phaseData.pillar1_ownedActions.channelStrategy && (
                            <p className="text-xs text-gray-400 mb-3">Channel: {phaseData.pillar1_ownedActions.channelStrategy}</p>
                          )}

                          {/* Content Needs (New Structure) */}
                          {phaseData.pillar1_ownedActions.contentNeeds && phaseData.pillar1_ownedActions.contentNeeds.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs text-blue-200 font-medium">Content Needs:</p>
                              {phaseData.pillar1_ownedActions.contentNeeds.map((content: any, idx: number) => (
                                <div key={idx} className="p-2 bg-zinc-900/50 rounded text-xs">
                                  <div className="flex items-start justify-between mb-1">
                                    <span className="font-mono text-blue-400 px-2 py-0.5 bg-blue-900/30 rounded">{content.contentType}</span>
                                    <span className="text-gray-500">{content.timing}</span>
                                  </div>
                                  <p className="text-white font-medium mt-1">{content.topic}</p>
                                  <p className="text-gray-400 text-[10px] mt-1">{content.purpose}</p>
                                  {content.keyMessages && content.keyMessages.length > 0 && (
                                    <div className="mt-2">
                                      <span className="text-gray-500">Messages:</span>
                                      <p className="text-gray-300 text-[10px] mt-0.5">{content.keyMessages.join(' • ')}</p>
                                    </div>
                                  )}
                                  {content.targetStakeholder && (
                                    <p className="text-purple-300 text-[10px] mt-1">Target: {content.targetStakeholder}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Legacy Structure (Fallback) */}
                          {phaseData.pillar1_ownedActions.organizationalVoice && phaseData.pillar1_ownedActions.organizationalVoice.length > 0 && (
                            <div className="space-y-2">
                              {phaseData.pillar1_ownedActions.organizationalVoice.map((action: any, idx: number) => (
                                <div key={idx} className="p-2 bg-zinc-900/50 rounded text-xs">
                                  <div className="flex items-start justify-between mb-1">
                                    <span className="font-mono text-blue-400 px-2 py-0.5 bg-blue-900/30 rounded">{action.contentType}</span>
                                    {action.isMock && <span className="text-amber-400 text-[10px] px-1.5 py-0.5 bg-amber-900/30 rounded">[MOCK]</span>}
                                  </div>
                                  <p className="text-gray-300 mt-1">{action.messageTheme}</p>
                                  <div className="mt-2 grid grid-cols-2 gap-2">
                                    <div>
                                      <span className="text-gray-500">SignalDesk:</span>
                                      <p className="text-emerald-300 text-[10px] mt-0.5">{action.signaldeskGenerates}</p>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">You Execute:</span>
                                      <p className="text-amber-300 text-[10px] mt-0.5">{action.userExecutes}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Pillar 2: Relationship Orchestration */}
                      {phaseData.pillar2_relationshipOrchestration && (
                        <div className="p-3 bg-purple-900/20 border border-purple-500/30 rounded">
                          <p className="text-sm font-semibold text-purple-300 mb-2">🤝 Pillar 2: Relationship Orchestration</p>

                          {/* Strategy Summary */}
                          {phaseData.pillar2_relationshipOrchestration.strategy && (
                            <p className="text-xs text-gray-300 mb-2">{phaseData.pillar2_relationshipOrchestration.strategy}</p>
                          )}
                          {phaseData.pillar2_relationshipOrchestration.primaryInfluencers && (
                            <p className="text-xs text-gray-400 mb-3">Targets: {Array.isArray(phaseData.pillar2_relationshipOrchestration.primaryInfluencers) ? phaseData.pillar2_relationshipOrchestration.primaryInfluencers.join(', ') : phaseData.pillar2_relationshipOrchestration.primaryInfluencers}</p>
                          )}

                          {/* Content Needs (New Structure) */}
                          {phaseData.pillar2_relationshipOrchestration.contentNeeds && phaseData.pillar2_relationshipOrchestration.contentNeeds.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs text-purple-200 font-medium">Content Needs:</p>
                              {phaseData.pillar2_relationshipOrchestration.contentNeeds.map((content: any, idx: number) => (
                                <div key={idx} className="p-2 bg-zinc-900/50 rounded text-xs">
                                  <div className="flex items-start justify-between mb-1">
                                    <span className="font-mono text-purple-400 px-2 py-0.5 bg-purple-900/30 rounded">{content.contentType}</span>
                                    <span className="text-gray-500">{content.timing}</span>
                                  </div>
                                  <p className="text-white font-medium mt-1">{content.topic}</p>
                                  <p className="text-gray-400 text-[10px] mt-1">{content.purpose}</p>
                                  {content.keyMessages && content.keyMessages.length > 0 && (
                                    <div className="mt-2">
                                      <span className="text-gray-500">Messages:</span>
                                      <p className="text-gray-300 text-[10px] mt-0.5">{content.keyMessages.join(' • ')}</p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Legacy Structure (Fallback) */}
                          {phaseData.pillar2_relationshipOrchestration.tier1Influencers && phaseData.pillar2_relationshipOrchestration.tier1Influencers.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs text-purple-200 font-medium">Tier 1 Influencers</p>
                              {phaseData.pillar2_relationshipOrchestration.tier1Influencers.map((rel: any, idx: number) => (
                                <div key={idx} className="p-2 bg-zinc-900/50 rounded text-xs">
                                  <div className="flex items-start justify-between mb-1">
                                    <p className="text-white font-medium">{rel.name || rel.category}</p>
                                    {rel.isMock && <span className="text-amber-400 text-[10px] px-1.5 py-0.5 bg-amber-900/30 rounded">[MOCK]</span>}
                                  </div>
                                  {rel.discoveryCriteria && <p className="text-gray-400 text-[10px] mb-1">Criteria: {rel.discoveryCriteria}</p>}
                                  <p className="text-gray-300 mt-1">Goal: {rel.influenceObjective}</p>
                                  {rel.contentToCreateForThem && rel.contentToCreateForThem.length > 0 && (
                                    <div className="mt-2">
                                      <span className="text-gray-500">Content for them:</span>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {rel.contentToCreateForThem.map((ct: any, i: number) => (
                                          <span key={i} className="text-[10px] px-1.5 py-0.5 bg-purple-900/30 text-purple-300 rounded font-mono">
                                            {ct.contentType}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          {phaseData.pillar2_relationshipOrchestration.tier2Amplifiers && phaseData.pillar2_relationshipOrchestration.tier2Amplifiers.length > 0 && (
                            <div className="space-y-2 mt-3">
                              <p className="text-xs text-purple-200 font-medium">Tier 2 Amplifiers</p>
                              <div className="flex flex-wrap gap-1">
                                {phaseData.pillar2_relationshipOrchestration.tier2Amplifiers.map((amp: any, idx: number) => (
                                  <span key={idx} className="text-xs px-2 py-1 bg-purple-900/30 text-purple-300 rounded">
                                    {amp.category || amp}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Pillar 3: Event Orchestration */}
                      {phaseData.pillar3_eventOrchestration && (
                        <div className="p-3 bg-amber-900/20 border border-amber-500/30 rounded">
                          <p className="text-sm font-semibold text-amber-300 mb-2">🎪 Pillar 3: Event Orchestration</p>

                          {/* Strategy Summary */}
                          {phaseData.pillar3_eventOrchestration.strategy && (
                            <p className="text-xs text-gray-300 mb-3">{phaseData.pillar3_eventOrchestration.strategy}</p>
                          )}

                          {/* Content Needs (New Structure) */}
                          {phaseData.pillar3_eventOrchestration.contentNeeds && phaseData.pillar3_eventOrchestration.contentNeeds.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs text-amber-200 font-medium">Content Needs:</p>
                              {phaseData.pillar3_eventOrchestration.contentNeeds.map((content: any, idx: number) => (
                                <div key={idx} className="p-2 bg-zinc-900/50 rounded text-xs">
                                  <div className="flex items-start justify-between mb-1">
                                    <span className="font-mono text-amber-400 px-2 py-0.5 bg-amber-900/30 rounded">{content.contentType}</span>
                                    <span className="text-gray-500">{content.timing}</span>
                                  </div>
                                  <p className="text-white font-medium mt-1">{content.topic}</p>
                                  <p className="text-gray-400 text-[10px] mt-1">{content.purpose}</p>
                                  {content.keyMessages && content.keyMessages.length > 0 && (
                                    <div className="mt-2">
                                      <span className="text-gray-500">Messages:</span>
                                      <p className="text-gray-300 text-[10px] mt-0.5">{content.keyMessages.join(' • ')}</p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Legacy Structure (Fallback) */}
                          {phaseData.pillar3_eventOrchestration.tier1Events && phaseData.pillar3_eventOrchestration.tier1Events.length > 0 && (
                            <div className="space-y-2">
                              {phaseData.pillar3_eventOrchestration.tier1Events.map((event: any, idx: number) => (
                                <div key={idx} className="p-2 bg-zinc-900/50 rounded text-xs">
                                  <div className="flex items-start justify-between mb-1">
                                    <p className="text-white font-medium">{event.eventName}</p>
                                    {event.isMock && <span className="text-amber-400 text-[10px] px-1.5 py-0.5 bg-amber-900/30 rounded">[MOCK]</span>}
                                  </div>
                                  {event.selectionCriteria && <p className="text-gray-400 text-[10px] mb-1">Criteria: {event.selectionCriteria}</p>}
                                  <p className="text-gray-300 mt-1">Objective: {event.objective}</p>
                                  {event.contentNeeds && (
                                    <div className="mt-2 space-y-1">
                                      {event.contentNeeds.preEvent && (
                                        <div><span className="text-gray-500">Pre-Event:</span> <span className="text-gray-300 text-[10px]">{event.contentNeeds.preEvent.join(', ')}</span></div>
                                      )}
                                      {event.contentNeeds.duringEvent && (
                                        <div><span className="text-gray-500">During:</span> <span className="text-gray-300 text-[10px]">{event.contentNeeds.duringEvent.join(', ')}</span></div>
                                      )}
                                      {event.contentNeeds.postEvent && (
                                        <div><span className="text-gray-500">Post-Event:</span> <span className="text-gray-300 text-[10px]">{event.contentNeeds.postEvent.join(', ')}</span></div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Pillar 4: Media Engagement */}
                      {phaseData.pillar4_mediaEngagement && (
                        <div className="p-3 bg-emerald-900/20 border border-emerald-500/30 rounded">
                          <p className="text-sm font-semibold text-emerald-300 mb-2">📰 Pillar 4: Media Engagement</p>

                          {/* Strategy Summary */}
                          {phaseData.pillar4_mediaEngagement.strategy && (
                            <p className="text-xs text-gray-300 mb-2">{phaseData.pillar4_mediaEngagement.strategy}</p>
                          )}
                          {phaseData.pillar4_mediaEngagement.journalist && (
                            <p className="text-xs text-gray-400 mb-3">Target: {phaseData.pillar4_mediaEngagement.journalist}</p>
                          )}

                          {/* Content Needs (New Structure) */}
                          {phaseData.pillar4_mediaEngagement.contentNeeds && phaseData.pillar4_mediaEngagement.contentNeeds.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs text-emerald-200 font-medium">Content Needs:</p>
                              {phaseData.pillar4_mediaEngagement.contentNeeds.map((content: any, idx: number) => (
                                <div key={idx} className="p-2 bg-zinc-900/50 rounded text-xs">
                                  <div className="flex items-start justify-between mb-1">
                                    <span className="font-mono text-emerald-400 px-2 py-0.5 bg-emerald-900/30 rounded">{content.contentType}</span>
                                    <span className="text-gray-500">{content.timing}</span>
                                  </div>
                                  <p className="text-white font-medium mt-1">{content.topic}</p>
                                  <p className="text-gray-400 text-[10px] mt-1">{content.purpose}</p>
                                  {content.keyMessages && content.keyMessages.length > 0 && (
                                    <div className="mt-2">
                                      <span className="text-gray-500">Messages:</span>
                                      <p className="text-gray-300 text-[10px] mt-0.5">{content.keyMessages.join(' • ')}</p>
                                    </div>
                                  )}
                                  {content.targetStakeholder && (
                                    <p className="text-purple-300 text-[10px] mt-1">Target: {content.targetStakeholder}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Legacy Structure (Fallback) */}
                          {phaseData.pillar4_mediaEngagement.outletStrategy && phaseData.pillar4_mediaEngagement.outletStrategy.length > 0 && (
                            <div className="space-y-2">
                              {phaseData.pillar4_mediaEngagement.outletStrategy.map((outlet: any, idx: number) => (
                                <div key={idx} className="p-2 bg-zinc-900/50 rounded text-xs">
                                  <div className="flex items-start justify-between mb-1">
                                    <p className="text-white font-medium">{outlet.outletName}</p>
                                    {outlet.isMock && <span className="text-amber-400 text-[10px] px-1.5 py-0.5 bg-amber-900/30 rounded">[MOCK]</span>}
                                  </div>
                                  {outlet.journalist && <p className="text-gray-400 text-[10px]">Contact: {outlet.journalist}</p>}
                                  <p className="text-gray-300 mt-1">Angle: {outlet.angle}</p>
                                  <div className="mt-2">
                                    <span className="text-gray-500">Message Layering:</span>
                                    <p className="text-emerald-300 text-[10px] mt-0.5">{outlet.messageLayering}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Convergence Strategy */}
                      {phaseData.convergenceStrategy && (
                        <div className="p-3 bg-emerald-900/20 border border-emerald-500/30 rounded">
                          <p className="text-xs text-gray-400 mb-2 font-semibold uppercase">Convergence Strategy</p>
                          {typeof phaseData.convergenceStrategy === 'string' ? (
                            <p className="text-sm text-emerald-300">{phaseData.convergenceStrategy}</p>
                          ) : (
                            <div className="space-y-1 text-xs">
                              {Object.entries(phaseData.convergenceStrategy).map(([key, value]: [string, any]) => (
                                <div key={key}>
                                  <span className="text-emerald-400 font-medium">{key}:</span>
                                  <span className="text-gray-300 ml-2">{value}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Target System State */}
                      {phaseData.targetSystemState && (
                        <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded">
                          <p className="text-xs text-gray-400 mb-1 font-semibold uppercase">Target System State</p>
                          <p className="text-sm text-blue-300">{phaseData.targetSystemState}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    // V1 Legacy Rendering (fallback)
                    <div>
                      {/* Stakeholder Focus */}
                      {phaseData.stakeholderFocus && phaseData.stakeholderFocus.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-400 mb-1">Stakeholder Focus:</p>
                          <div className="flex flex-wrap gap-1">
                            {phaseData.stakeholderFocus.map((sh: string, idx: number) => (
                              <span key={idx} className="text-xs px-2 py-1 bg-blue-600/20 border border-blue-500/30 text-blue-300 rounded">
                                {sh}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tactics */}
                      {phaseData.tactics && phaseData.tactics.length > 0 && (
                        <div className="space-y-3 mt-3 pt-3 border-t border-zinc-700/50">
                          <p className="text-xs text-gray-400 font-semibold uppercase">Tactics ({phaseData.tactics.length})</p>
                          {phaseData.tactics.map((tactic: any, idx: number) => (
                            <div key={idx} className="p-3 bg-zinc-900/50 border border-zinc-700/50 rounded">
                              <p className="text-sm text-white font-medium mb-2">
                                <span className="text-purple-400">→</span> {tactic.stakeholder}
                              </p>
                              <div className="space-y-2 text-xs">
                                <div>
                                  <span className="text-gray-500">Message:</span>
                                  <p className="text-gray-300 mt-1">{tactic.message}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Reach Strategy:</span>
                                  <p className="text-gray-300 mt-1">{tactic.reachStrategy}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Who Executes:</span>
                                  <p className="text-gray-300 mt-1">{tactic.whoExecutes}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Rationale:</span>
                                  <p className="text-gray-300 mt-1">{tactic.rationale}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Expected Outcome:</span>
                                  <p className="text-emerald-300 mt-1">{tactic.expectedOutcome}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Convergence Point */}
                      {phaseData.convergencePoint && (
                        <div className="mt-3 p-2 bg-emerald-900/20 border border-emerald-500/30 rounded">
                          <p className="text-xs text-gray-400 mb-1">Convergence Point:</p>
                          <p className="text-sm text-emerald-300">{phaseData.convergencePoint}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      }
    },
    {
      id: 'counter-narrative',
      title: 'Counter-Narrative Strategy',
      icon: '🛡️',
      color: 'red',
      render: () => (
        <div className="space-y-4">
          {blueprint.part4_counterNarrative?.threatScenarios && blueprint.part4_counterNarrative.threatScenarios.length > 0 && (
            <div className="space-y-3">
              {blueprint.part4_counterNarrative.threatScenarios.map((scenario: any, i: number) => (
                <div key={i} className="p-3 bg-red-900/20 border border-red-500/30 rounded">
                  <p className="text-white font-semibold mb-2">{scenario.threat}</p>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-gray-400">Likelihood:</span>
                      <span className={`ml-2 px-2 py-0.5 rounded ${
                        scenario.likelihood === 'High' ? 'bg-red-900/50 text-red-300' :
                        scenario.likelihood === 'Medium' ? 'bg-amber-900/50 text-amber-300' :
                        'bg-emerald-900/50 text-emerald-300'
                      }`}>
                        {scenario.likelihood}
                      </span>
                    </div>
                    {scenario.counterPlaybook && scenario.counterPlaybook.length > 0 && (
                      <div className="mt-2">
                        <p className="text-gray-400 mb-1">Counter Playbook:</p>
                        <div className="space-y-1">
                          {scenario.counterPlaybook.map((play: any, idx: number) => (
                            <div key={idx} className="p-2 bg-zinc-900/50 rounded">
                              <p className="text-gray-300 font-medium">{play.action}</p>
                              {play.responsibleParty && (
                                <p className="text-gray-500 text-[10px] mt-0.5">Responsible: {play.responsibleParty}</p>
                              )}
                              {play.contentNeeded && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {play.contentNeeded.map((ct: string, j: number) => (
                                    <span key={j} className="text-[10px] px-1.5 py-0.5 bg-red-900/30 text-red-300 rounded font-mono">
                                      {ct}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    },
    {
      id: 'execution-requirements',
      title: 'Execution Requirements',
      icon: '⚡',
      color: 'rose',
      render: () => (
        <div className="space-y-4">
          {/* Team Bandwidth */}
          {blueprint.part5_executionRequirements?.teamBandwidth && (
            <div className="p-3 bg-rose-900/20 border border-rose-500/30 rounded">
              <p className="text-sm font-semibold text-rose-300 mb-2">Team Bandwidth</p>
              <div className="space-y-2 text-xs">
                {blueprint.part5_executionRequirements.teamBandwidth.weeklyHours && (
                  <div>
                    <span className="text-gray-400">Weekly Hours:</span>
                    <span className="text-white ml-2">{blueprint.part5_executionRequirements.teamBandwidth.weeklyHours}</span>
                  </div>
                )}
                {blueprint.part5_executionRequirements.teamBandwidth.roles && blueprint.part5_executionRequirements.teamBandwidth.roles.length > 0 && (
                  <div>
                    <p className="text-gray-400 mb-1">Required Roles:</p>
                    <div className="flex flex-wrap gap-1">
                      {blueprint.part5_executionRequirements.teamBandwidth.roles.map((role: any, i: number) => (
                        <span key={i} className="px-2 py-1 bg-rose-900/30 text-rose-300 rounded">
                          {role.role} ({role.commitment})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Budget Considerations */}
          {blueprint.part5_executionRequirements?.budgetConsiderations && (
            <div className="p-3 bg-amber-900/20 border border-amber-500/30 rounded">
              <p className="text-sm font-semibold text-amber-300 mb-2">Budget Considerations</p>
              <div className="space-y-2 text-xs">
                {blueprint.part5_executionRequirements.budgetConsiderations.paidInitiatives && blueprint.part5_executionRequirements.budgetConsiderations.paidInitiatives.length > 0 && (
                  <div className="space-y-2">
                    {blueprint.part5_executionRequirements.budgetConsiderations.paidInitiatives.map((initiative: any, i: number) => (
                      <div key={i} className="p-2 bg-zinc-900/50 rounded">
                        <div className="flex items-start justify-between">
                          <p className="text-white font-medium">{initiative.initiative}</p>
                          <span className="text-amber-300 font-mono">{initiative.estimatedCost}</span>
                        </div>
                        <p className="text-gray-400 text-[10px] mt-1">{initiative.rationale}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Adaptation Strategy */}
          {blueprint.part5_executionRequirements?.adaptationStrategy && (
            <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded">
              <p className="text-sm font-semibold text-blue-300 mb-2">Adaptation Strategy</p>
              <div className="space-y-2 text-xs">
                {blueprint.part5_executionRequirements.adaptationStrategy.pivotScenarios && blueprint.part5_executionRequirements.adaptationStrategy.pivotScenarios.length > 0 && (
                  <div className="space-y-2">
                    {blueprint.part5_executionRequirements.adaptationStrategy.pivotScenarios.map((pivot: any, i: number) => (
                      <div key={i} className="p-2 bg-zinc-900/50 rounded">
                        <p className="text-white font-medium">{pivot.trigger}</p>
                        <p className="text-gray-300 mt-1">{pivot.pivotAction}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Legacy v1 Content Needs (Fallback) */}
          {blueprint.part4_contentNeeds?.contentPieces && blueprint.part4_contentNeeds.contentPieces.length > 0 && (
            <div>
              <p className="text-sm text-gray-400 mb-3 font-semibold uppercase">Content Pieces ({blueprint.part4_contentNeeds.contentPieces.length})</p>
              <div className="space-y-3">
                {blueprint.part4_contentNeeds.contentPieces.map((content: any, i: number) => (
                  <div key={i} className="p-3 bg-zinc-800/50 border border-zinc-700/50 rounded">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm font-mono text-blue-400 px-2 py-1 bg-blue-900/20 border border-blue-500/30 rounded">
                        {content.contentType}
                      </span>
                      <span className="text-xs text-gray-500">Phase {content.phase}</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-gray-500">Target:</span>
                        <p className="text-gray-300 mt-1">{content.targetStakeholder}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Core Message:</span>
                        <p className="text-gray-300 mt-1">{content.coreMessage}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Distribution:</span>
                        <p className="text-gray-300 mt-1">{content.distributionChannel}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Created By:</span>
                        <p className="text-gray-300 mt-1">{content.createdBy}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Rationale:</span>
                        <p className="text-gray-300 mt-1">{content.rationale}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Success Metric:</span>
                        <p className="text-emerald-300 mt-1">{content.successMetric}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Execution Sequence */}
          {blueprint.part4_contentNeeds?.executionSequence && (
            <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded">
              <p className="text-xs text-gray-400 mb-2 font-semibold uppercase">Execution Sequence</p>
              <p className="text-sm text-gray-300">{blueprint.part4_contentNeeds.executionSequence}</p>
            </div>
          )}

          {/* Dependencies */}
          {blueprint.part4_contentNeeds?.dependencies && (
            <div className="p-3 bg-amber-900/20 border border-amber-500/30 rounded">
              <p className="text-xs text-gray-400 mb-2 font-semibold uppercase">Dependencies</p>
              <p className="text-sm text-gray-300">{blueprint.part4_contentNeeds.dependencies}</p>
            </div>
          )}

          {/* Critical Path */}
          {blueprint.part4_contentNeeds?.criticalPath && (
            <div className="p-3 bg-emerald-900/20 border border-emerald-500/30 rounded">
              <p className="text-xs text-gray-400 mb-2 font-semibold uppercase">Critical Path</p>
              <p className="text-sm text-emerald-300">{blueprint.part4_contentNeeds.criticalPath}</p>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'pattern-guidance',
      title: 'Pattern Guidance',
      icon: '🎯',
      color: 'indigo',
      render: () => (
        <div className="space-y-4">
          {blueprint.part6_patternGuidance?.selectedPattern && (
            <div>
              <div className="p-3 bg-indigo-900/20 border border-indigo-500/30 rounded mb-3">
                <p className="text-sm font-semibold text-indigo-300 mb-1">Selected Pattern</p>
                <p className="text-2xl text-white font-bold">{blueprint.part6_patternGuidance.selectedPattern.pattern}</p>
                {blueprint.part6_patternGuidance.selectedPattern.definition && (
                  <p className="text-sm text-gray-300 mt-2">{blueprint.part6_patternGuidance.selectedPattern.definition}</p>
                )}
              </div>

              {/* Pattern Application */}
              {blueprint.part6_patternGuidance.selectedPattern.applicationToThisCampaign && (
                <div className="p-3 bg-zinc-800/50 rounded">
                  <p className="text-xs text-gray-400 mb-2 font-semibold uppercase">How This Pattern Applies</p>
                  <p className="text-sm text-gray-300">{blueprint.part6_patternGuidance.selectedPattern.applicationToThisCampaign}</p>
                </div>
              )}

              {/* Pillar Emphasis */}
              {blueprint.part6_patternGuidance.selectedPattern.pillarEmphasis && (
                <div className="p-3 bg-zinc-800/50 rounded">
                  <p className="text-xs text-gray-400 mb-2 font-semibold uppercase">Pillar Emphasis</p>
                  <div className="space-y-2 text-xs">
                    {blueprint.part6_patternGuidance.selectedPattern.pillarEmphasis.primary && (
                      <div>
                        <span className="text-emerald-400">Primary Focus:</span>
                        <span className="text-white ml-2">{blueprint.part6_patternGuidance.selectedPattern.pillarEmphasis.primary}</span>
                      </div>
                    )}
                    {blueprint.part6_patternGuidance.selectedPattern.pillarEmphasis.secondary && (
                      <div>
                        <span className="text-blue-400">Secondary Focus:</span>
                        <span className="text-white ml-2">{blueprint.part6_patternGuidance.selectedPattern.pillarEmphasis.secondary}</span>
                      </div>
                    )}
                    {blueprint.part6_patternGuidance.selectedPattern.pillarEmphasis.supporting && (
                      <div>
                        <span className="text-gray-400">Supporting:</span>
                        <span className="text-white ml-2">{blueprint.part6_patternGuidance.selectedPattern.pillarEmphasis.supporting?.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Success Indicators */}
              {blueprint.part6_patternGuidance.selectedPattern.successIndicators && blueprint.part6_patternGuidance.selectedPattern.successIndicators.length > 0 && (
                <div className="p-3 bg-emerald-900/20 border border-emerald-500/30 rounded">
                  <p className="text-xs text-gray-400 mb-2 font-semibold uppercase">Success Indicators</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                    {blueprint.part6_patternGuidance.selectedPattern.successIndicators.map((indicator: string, i: number) => (
                      <li key={i}>{indicator}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Risks */}
              {blueprint.part6_patternGuidance.selectedPattern.risks && blueprint.part6_patternGuidance.selectedPattern.risks.length > 0 && (
                <div className="p-3 bg-red-900/20 border border-red-500/30 rounded">
                  <p className="text-xs text-gray-400 mb-2 font-semibold uppercase">Pattern-Specific Risks</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                    {blueprint.part6_patternGuidance.selectedPattern.risks.map((risk: string, i: number) => (
                      <li key={i}>{risk}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )
    }
  ]

  const sections = blueprintType === 'PR_CAMPAIGN' ? prSections : vectorSections

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <div className="flex items-center justify-center gap-2">
          <svg className="w-6 h-6 text-emerald-500 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-3xl font-bold text-white">
            {blueprint.overview?.campaignName || `${blueprintType === 'PR_CAMPAIGN' ? 'PR' : 'VECTOR'} Campaign Blueprint`}
          </h2>
        </div>
        {blueprint.overview?.tagline && (
          <p className="text-lg text-gray-300 italic">{blueprint.overview.tagline}</p>
        )}
        <div className="inline-block px-3 py-1 bg-blue-600/20 border border-blue-500/50 rounded-full">
          <span className="text-sm text-blue-400 font-medium">
            {blueprintType === 'PR_CAMPAIGN' ? 'Traditional PR Campaign' : 'VECTOR Multi-Stakeholder Campaign'}
          </span>
        </div>
      </motion.div>

      {/* Blueprint Cards */}
      <div className="grid grid-cols-1 gap-4">
        {sections.map((section, i) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden hover:border-${section.color}-500/50 transition-all`}
          >
            <button
              onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
              className="w-full p-4 text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{section.icon}</span>
                  <h3 className="font-semibold text-white text-lg">{section.title}</h3>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${expandedSection === section.id ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {expandedSection === section.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-4 pb-4 border-t border-zinc-800"
              >
                <div className="pt-4">
                  {section.render()}
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Refinement Input */}
      {showRefinementInput && onRefine && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <textarea
            value={refinementInput}
            onChange={(e) => setRefinementInput(e.target.value)}
            placeholder="What sections would you like me to refine or improve?"
            className="w-full h-24 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
            disabled={isRefining}
          />
          <div className="flex gap-2">
            <button
              onClick={handleRefineSubmit}
              disabled={!refinementInput.trim() || isRefining}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isRefining ? 'Refining...' : 'Refine Blueprint'}
            </button>
            <button
              onClick={() => {
                setShowRefinementInput(false)
                setRefinementInput('')
              }}
              className="px-4 py-2 bg-zinc-800 text-white rounded-lg font-medium hover:bg-zinc-700 transition-all"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      {!showRefinementInput && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex items-center justify-between pt-4 border-t border-zinc-800"
        >
          <div className="flex gap-3">
            {onRefine && (
              <button
                onClick={() => setShowRefinementInput(true)}
                disabled={isRefining}
                className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Refine Blueprint
              </button>
            )}
            {onExport && (
              <button
                onClick={onExport}
                className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Blueprint
              </button>
            )}
          </div>

          {onExecute && (
            <button
              onClick={onExecute}
              disabled={isRefining}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              Begin Execution
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          )}
        </motion.div>
      )}

      {/* Loading State for Refinement */}
      {isRefining && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-2 py-4 text-blue-400"
        >
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Refining blueprint...
        </motion.div>
      )}
    </div>
  )
}
