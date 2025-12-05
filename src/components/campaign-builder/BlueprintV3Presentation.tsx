'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface BlueprintV3Data {
  // NEW backend structure
  part1_goalFramework?: {
    primaryObjective?: string
    behavioralGoals?: string[]
    kpis?: any[]
    successCriteria?: string
    riskAssessment?: any[]
  }
  part2_stakeholderMapping?: {
    groups?: any[]
    stakeholderRelationships?: string
    priorityOrder?: string[]
  }
  part5_executionRequirements?: {
    teamBandwidth?: any
    budgetRequirements?: any
    toolsAndPlatforms?: any
    weeklyExecutionRhythm?: any
    systemLevelSuccessMetrics?: any
  }
  overview?: {
    campaignName?: string
    pattern?: string
    patternRationale?: string
    duration?: string
    complexity?: string
  }
  messageArchitecture?: {
    coreMessage?: string
    messageRationale?: string
  }
  // OLD frontend structure (kept for backwards compat)
  part1_strategicFoundation?: {
    campaignGoal?: string
    positioning?: {
      name?: string
      tagline?: string
      description?: string
      keyMessages?: string[]
      differentiators?: string[]
      targetAudiences?: string[]
    }
    selectedPattern?: {
      pattern?: string
      rationale?: string
      confidence?: number
      pillarEmphasis?: Record<string, string>
      keyMechanics?: string[]
    }
    alternativePattern?: {
      pattern?: string
      rationale?: string
      confidence?: number
    }
    campaignTimeline?: {
      totalDuration?: string
      phase1?: string
      phase2?: string
      phase3?: string
      phase4?: string
    }
    targetStakeholders?: Array<{
      name?: string
      role?: string
      influenceLevel?: string
      primaryFear?: string
      primaryAspiration?: string
    }>
  }
  part2_psychologicalInfluence?: {
    influenceStrategies?: Array<{
      stakeholder?: string
      psychologicalProfile?: {
        primaryFear?: string
        primaryAspiration?: string
        decisionTrigger?: string
      }
      positioningAlignment?: {
        coreMessage?: string
        keyMessagesForThisStakeholder?: string[]
        differentiatorsThatResonate?: string[]
      }
      influenceLevers?: Array<{
        lever?: string
        positioningMessage?: string
        approach?: string
        channels?: string[]
        trustedVoices?: string[]
        psychologicalMechanism?: string
      }>
      touchpointStrategy?: {
        phase1_awareness?: {
          objective?: string
          channels?: string[]
          messageFraming?: string
          decisionTriggerActivation?: string
        }
        phase2_consideration?: {
          objective?: string
          channels?: string[]
          messageFraming?: string
          decisionTriggerActivation?: string
        }
        phase3_conversion?: {
          objective?: string
          channels?: string[]
          messageFraming?: string
          decisionTriggerActivation?: string
        }
        phase4_advocacy?: {
          objective?: string
          channels?: string[]
          messageFraming?: string
          decisionTriggerActivation?: string
        }
      }
    }>
  }
  // NEW: Stakeholder Orchestration structure (multi-channel approach)
  part3_stakeholderOrchestration?: {
    stakeholderOrchestrationPlans?: Array<{
      stakeholder?: {
        name?: string
        priority?: number
        psychologicalProfile?: {
          primaryFear?: string
          primaryAspiration?: string
          decisionTrigger?: string
        }
      }
      influenceLevers?: Array<{
        leverName?: string
        leverType?: string
        priority?: number
        objective?: string
        campaign?: {
          leverName?: string
          leverType?: string
          objective?: string
          mediaPitches?: Array<{
            who?: string  // Journalist name
            outlet?: string
            beat?: string
            what?: string  // Story angle
            when?: string
          }>
          socialPosts?: Array<{
            who?: string  // Person posting
            platform?: string
            what?: string  // Post topic
            keyMessages?: string[]
            when?: string
          }>
          thoughtLeadership?: Array<{
            who?: string  // Author
            what?: string  // Article title
            where?: string  // Publication
            keyPoints?: string[]
            when?: string
          }>
          additionalTactics?: Array<{
            type?: string
            who?: string
            what?: string
            where?: string
            when?: string
            estimatedEffort?: string
            resources?: string[]
          }>
        }
        completionCriteria?: string[]
      }>
    }>
  }
  // OLD: Phase-based tactical orchestration (kept for backwards compatibility)
  part3_tacticalOrchestration?: {
    phase1_awareness?: PhaseData
    phase2_consideration?: PhaseData
    phase3_conversion?: PhaseData
    phase4_advocacy?: PhaseData
  }
  part4_resourceRequirements?: {
    status?: string
    message?: string
    totalContentPieces?: number
    totalHours?: number
    totalBudget?: number
    teamPlanning?: {
      recommendedTeamSize?: number
      weeklyBandwidth?: string
      teamComposition?: Array<{
        role?: string
        count?: number
        allocation?: string
      }>
    }
  }
  part5_executionRoadmap?: {
    weeklyPlan?: Array<{
      week?: number
      phase?: string
      milestones?: string[]
      contentDue?: string[]
      successCriteria?: string[]
    }>
    integrationInstructions?: {
      autoExecuteReady?: boolean
    }
  }
  part6_contentInventory?: {
    status?: string
    message?: string
    summary?: {
      totalSignaldeskActions?: number
      totalOrganizationActions?: number
      autoExecutableCount?: number
      userRequiredCount?: number
    }
    signaldeskActions?: {
      description?: string
      count?: number
      items?: any[]
    }
    organizationActions?: {
      description?: string
      count?: number
      items?: any[]
    }
  }
  metadata?: {
    generatedAt?: string
    campaignGoal?: string
    pattern?: string
    stakeholderCount?: number
    journalistCount?: number
    totalContentPieces?: number
    estimatedHours?: number
    estimatedBudget?: number
    performance?: {
      totalTime?: string
      enrichmentTime?: string
      patternSelectionTime?: string
      influenceMappingTime?: string
      tacticalGenerationTime?: string
      assemblyTime?: string
    }
  }
}

interface PhaseData {
  weeks?: string
  pillar1_ownedActions?: Array<{
    contentType?: string
    targetStakeholder?: string
    positioningMessage?: string
    psychologicalLever?: string
    timing?: string
    channels?: string[]
    keyPoints?: string[]
    executionOwner?: string
  }>
  pillar2_relationshipOrchestration?: Array<{
    who?: string
    action?: string
    timing?: string
    goal?: string
    executionOwner?: string
  }>
  pillar3_eventOrchestration?: Array<{
    event?: string
    action?: string
    timing?: string
    goal?: string
    executionOwner?: string
  }>
  pillar4_mediaEngagement?: Array<{
    story?: string
    journalists?: Array<{
      name?: string
      outlet?: string
      beat?: string
    }>
    timing?: string
    positioningMessage?: string
    executionOwner?: string
  }>
}

interface BlueprintV3PresentationProps {
  blueprint: BlueprintV3Data
  onRefine?: (request: string) => void
  onExport?: () => void
  onExecute?: () => void
  isRefining?: boolean
}

export function BlueprintV3Presentation({
  blueprint,
  onRefine,
  onExport,
  onExecute,
  isRefining
}: BlueprintV3PresentationProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('overview')
  const [refinementInput, setRefinementInput] = useState('')
  const [showRefinementInput, setShowRefinementInput] = useState(false)

  const handleRefineSubmit = () => {
    if (refinementInput.trim() && onRefine) {
      onRefine(refinementInput.trim())
      setRefinementInput('')
      setShowRefinementInput(false)
    }
  }

  const sections = [
    {
      id: 'overview',
      title: 'Strategic Foundation',
      icon: '🎯',
      color: 'blue',
      render: () => (
        <div className="space-y-4">
          {/* NEW: Overview Section */}
          {blueprint.overview && (
            <div className="p-4 rounded" style={{ background: 'var(--burnt-orange-muted)', border: '1px solid var(--burnt-orange)' }}>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--burnt-orange)', fontFamily: 'var(--font-display)' }}>{blueprint.overview.campaignName}</h3>
              {blueprint.overview.pattern && (
                <div className="mb-2">
                  <span className="text-sm" style={{ color: 'var(--grey-400)' }}>Pattern: </span>
                  <span className="font-semibold" style={{ color: 'var(--burnt-orange)' }}>{blueprint.overview.pattern}</span>
                </div>
              )}
              {blueprint.overview.patternRationale && (
                <p className="text-sm mb-2" style={{ color: 'var(--grey-300)' }}>{blueprint.overview.patternRationale}</p>
              )}
              {blueprint.overview.duration && (
                <div>
                  <span className="text-sm" style={{ color: 'var(--grey-400)' }}>Duration: </span>
                  <span className="text-white">{blueprint.overview.duration}</span>
                </div>
              )}
            </div>
          )}

          {/* GEO Intelligence Summary (for GEO-VECTOR campaigns) */}
          {blueprint.geoIntelligence && (
            <div className="p-4 rounded" style={{ background: 'var(--grey-800)', border: '1px solid var(--grey-700)' }}>
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--burnt-orange)', fontFamily: 'var(--font-display)' }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--burnt-orange)', color: 'var(--white)' }}>AI</div>
                <span>AI Query Ownership Strategy</span>
              </h3>

              {blueprint.geoIntelligence.synthesis?.gapAnalysis && (
                <p className="text-sm mb-3" style={{ color: 'var(--grey-300)' }}>
                  {blueprint.geoIntelligence.synthesis.gapAnalysis}
                </p>
              )}

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="p-2 rounded" style={{ background: 'var(--grey-900)' }}>
                  <p className="text-xs" style={{ color: 'var(--grey-400)' }}>Target Queries</p>
                  <p className="text-xl font-bold text-white">
                    {blueprint.geoIntelligence.targetQueries?.length || 0}
                  </p>
                </div>
                <div className="p-2 rounded" style={{ background: 'var(--grey-900)' }}>
                  <p className="text-xs" style={{ color: 'var(--grey-400)' }}>Schema Opportunities</p>
                  <p className="text-xl font-bold" style={{ color: 'var(--burnt-orange)' }}>
                    {blueprint.geoIntelligence.synthesis?.schemaOpportunities?.length || 0}
                  </p>
                </div>
              </div>

              {blueprint.geoIntelligence.synthesis?.priorityActions && blueprint.geoIntelligence.synthesis.priorityActions.length > 0 && (
                <div>
                  <p className="text-xs mb-2" style={{ color: 'var(--grey-400)' }}>Top Priority Actions:</p>
                  <ul className="space-y-1">
                    {blueprint.geoIntelligence.synthesis.priorityActions.slice(0, 3).map((action: string, i: number) => (
                      <li key={i} className="text-xs flex items-start gap-2" style={{ color: 'var(--grey-300)' }}>
                        <span style={{ color: 'var(--burnt-orange)' }}>{i + 1}.</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* NEW: Goal Framework */}
          {blueprint.part1_goalFramework && (
            <div>
              <p className="text-sm text-[var(--grey-400)] mb-2">Primary Objective</p>
              <p className="text-white mb-3">{blueprint.part1_goalFramework.primaryObjective}</p>

              {blueprint.part1_goalFramework.behavioralGoals && blueprint.part1_goalFramework.behavioralGoals.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm text-[var(--grey-400)] mb-1">Behavioral Goals</p>
                  <div className="space-y-2">
                    {blueprint.part1_goalFramework.behavioralGoals.map((goal: any, i: number) => (
                      <div key={i} className="p-2 bg-[var(--grey-900)] rounded text-sm">
                        {typeof goal === 'string' ? (
                          <p className="text-[var(--grey-300)]">{goal}</p>
                        ) : (
                          <>
                            <div className="flex items-start justify-between mb-1">
                              <p className="text-white font-medium">{goal.stakeholder}</p>
                              {goal.successMetric && (
                                <span className="text-xs text-[var(--burnt-orange)]">{goal.successMetric}</span>
                              )}
                            </div>
                            {goal.desiredBehavior && (
                              <p className="text-[var(--grey-300)] text-xs mb-1">Target: {goal.desiredBehavior}</p>
                            )}
                            {goal.currentState && (
                              <p className="text-[var(--grey-500)] text-xs">Current: {goal.currentState}</p>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {blueprint.part1_goalFramework.successCriteria && (
                <div className="p-3 bg-[var(--burnt-orange-muted)] border border-[var(--burnt-orange)] rounded">
                  <p className="text-sm text-[var(--burnt-orange)] mb-1">Success Criteria</p>
                  <p className="text-sm text-[var(--grey-300)]">{blueprint.part1_goalFramework.successCriteria}</p>
                </div>
              )}
            </div>
          )}

          {/* Message Architecture */}
          {blueprint.messageArchitecture?.coreMessage && (
            <div className="p-3 bg-[var(--grey-800)] border border-[var(--grey-700)] rounded">
              <p className="text-sm text-[var(--burnt-orange)] mb-1">Core Message</p>
              <p className="text-white">{blueprint.messageArchitecture.coreMessage}</p>
              {blueprint.messageArchitecture.messageRationale && (
                <p className="text-xs text-[var(--grey-400)] mt-2 italic">{blueprint.messageArchitecture.messageRationale}</p>
              )}
            </div>
          )}

          {/* OLD: Campaign Goal */}
          {blueprint.part1_strategicFoundation?.campaignGoal && (
            <div>
              <p className="text-sm text-[var(--grey-400)] mb-1">Campaign Goal</p>
              <p className="text-white">{blueprint.part1_strategicFoundation.campaignGoal}</p>
            </div>
          )}

          {/* Positioning */}
          {blueprint.part1_strategicFoundation?.positioning && (
            <div className="p-3 bg-[var(--burnt-orange-muted)] border border-[var(--burnt-orange)] rounded">
              <p className="text-lg font-semibold text-[var(--burnt-orange)] mb-2">
                {blueprint.part1_strategicFoundation.positioning.name}
              </p>
              {blueprint.part1_strategicFoundation.positioning.tagline && (
                <p className="text-sm text-[var(--grey-300)] italic mb-2">
                  {blueprint.part1_strategicFoundation.positioning.tagline}
                </p>
              )}
              {blueprint.part1_strategicFoundation.positioning.description && (
                <p className="text-sm text-[var(--grey-300)] mb-3">
                  {blueprint.part1_strategicFoundation.positioning.description}
                </p>
              )}

              {/* Key Messages */}
              {blueprint.part1_strategicFoundation.positioning.keyMessages &&
               blueprint.part1_strategicFoundation.positioning.keyMessages.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-[var(--burnt-orange)] font-medium mb-1">Key Messages:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-[var(--grey-300)]">
                    {blueprint.part1_strategicFoundation.positioning.keyMessages.map((msg, i) => (
                      <li key={i}>{msg}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Differentiators */}
              {blueprint.part1_strategicFoundation.positioning.differentiators &&
               blueprint.part1_strategicFoundation.positioning.differentiators.length > 0 && (
                <div>
                  <p className="text-xs text-[var(--burnt-orange)] font-medium mb-1">Differentiators:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-[var(--grey-300)]">
                    {blueprint.part1_strategicFoundation.positioning.differentiators.map((diff, i) => (
                      <li key={i}>{diff}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Selected Pattern */}
          {blueprint.part1_strategicFoundation?.selectedPattern && (
            <div className="p-3 bg-[var(--burnt-orange-muted)] border border-[var(--burnt-orange)] rounded">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-xs text-[var(--burnt-orange)] mb-1">Selected Pattern</p>
                  <p className="text-2xl font-bold text-[var(--burnt-orange)]">
                    {blueprint.part1_strategicFoundation.selectedPattern.pattern}
                  </p>
                </div>
                {blueprint.part1_strategicFoundation.selectedPattern.confidence && (
                  <span className="px-2 py-1 bg-emerald-900/50 text-[var(--burnt-orange)] rounded text-sm">
                    {Math.round(blueprint.part1_strategicFoundation.selectedPattern.confidence * 100)}% confidence
                  </span>
                )}
              </div>
              {blueprint.part1_strategicFoundation.selectedPattern.rationale && (
                <p className="text-sm text-[var(--grey-300)] mb-3">
                  {blueprint.part1_strategicFoundation.selectedPattern.rationale}
                </p>
              )}
              {blueprint.part1_strategicFoundation.selectedPattern.keyMechanics &&
               blueprint.part1_strategicFoundation.selectedPattern.keyMechanics.length > 0 && (
                <div>
                  <p className="text-xs text-[var(--burnt-orange)] font-medium mb-1">Key Mechanics:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-[var(--grey-300)]">
                    {blueprint.part1_strategicFoundation.selectedPattern.keyMechanics.map((mech, i) => (
                      <li key={i}>{mech}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Target Stakeholders */}
          {blueprint.part1_strategicFoundation?.targetStakeholders &&
           blueprint.part1_strategicFoundation.targetStakeholders.length > 0 && (
            <div>
              <p className="text-sm text-[var(--grey-400)] mb-2">Target Stakeholders ({blueprint.part1_strategicFoundation.targetStakeholders.length})</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {blueprint.part1_strategicFoundation.targetStakeholders.map((stakeholder, i) => (
                  <div key={i} className="p-2 bg-zinc-800/50 rounded text-sm">
                    <p className="text-white font-medium">{stakeholder.name}</p>
                    <p className="text-xs text-[var(--grey-400)]">{stakeholder.role}</p>
                    {stakeholder.primaryFear && (
                      <p className="text-xs text-red-300 mt-1">Fear: {stakeholder.primaryFear}</p>
                    )}
                    {stakeholder.primaryAspiration && (
                      <p className="text-xs text-[var(--burnt-orange)] mt-1">Aspiration: {stakeholder.primaryAspiration}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          {blueprint.part1_strategicFoundation?.campaignTimeline && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="p-2 bg-zinc-800/50 rounded text-center">
                <p className="text-xs text-[var(--grey-400)]">Phase 1</p>
                <p className="text-sm text-[var(--burnt-orange)] font-medium">Awareness</p>
                <p className="text-xs text-[var(--grey-500)]">Weeks 1-3</p>
              </div>
              <div className="p-2 bg-zinc-800/50 rounded text-center">
                <p className="text-xs text-[var(--grey-400)]">Phase 2</p>
                <p className="text-sm text-[var(--burnt-orange)] font-medium">Consideration</p>
                <p className="text-xs text-[var(--grey-500)]">Weeks 4-6</p>
              </div>
              <div className="p-2 bg-zinc-800/50 rounded text-center">
                <p className="text-xs text-[var(--grey-400)]">Phase 3</p>
                <p className="text-sm text-[var(--burnt-orange)] font-medium">Conversion</p>
                <p className="text-xs text-[var(--grey-500)]">Weeks 7-9</p>
              </div>
              <div className="p-2 bg-zinc-800/50 rounded text-center">
                <p className="text-xs text-[var(--grey-400)]">Phase 4</p>
                <p className="text-sm text-[var(--burnt-orange)] font-medium">Advocacy</p>
                <p className="text-xs text-[var(--grey-500)]">Weeks 10-12</p>
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'tactical',
      title: blueprint.part3_stakeholderOrchestration ? 'Stakeholder Orchestration' : 'Four-Pillar Tactical Orchestration',
      icon: '📅',
      color: 'amber',
      render: () => {
        // NEW STRUCTURE: Stakeholder Orchestration
        if (blueprint.part3_stakeholderOrchestration?.stakeholderOrchestrationPlans) {
          return (
            <div className="space-y-6">
              {blueprint.part3_stakeholderOrchestration.stakeholderOrchestrationPlans.map((plan, i) => (
                <div key={i} className="p-4 bg-[var(--grey-800)] border border-[var(--grey-700)] rounded">
                  {/* Stakeholder Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-semibold text-[var(--burnt-orange)]">{plan.stakeholder?.name}</p>
                        <span className="px-2 py-0.5 bg-purple-900/50 text-[var(--burnt-orange)] text-xs rounded">
                          Priority {plan.stakeholder?.priority}
                        </span>
                      </div>
                      {plan.stakeholder?.psychologicalProfile && (
                        <div className="mt-2 text-xs space-y-1">
                          {plan.stakeholder.psychologicalProfile.primaryFear && (
                            <p className="text-red-300">Fear: {plan.stakeholder.psychologicalProfile.primaryFear}</p>
                          )}
                          {plan.stakeholder.psychologicalProfile.primaryAspiration && (
                            <p className="text-[var(--burnt-orange)]">Aspiration: {plan.stakeholder.psychologicalProfile.primaryAspiration}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Influence Levers - Multi-Channel Campaigns */}
                  {plan.influenceLevers && plan.influenceLevers.length > 0 && (
                    <div className="space-y-4">
                      {plan.influenceLevers.map((lever, j) => {
                        const campaign = lever.campaign
                        if (!campaign) return null

                        return (
                          <div key={j} className="pl-4 border-l-2 border-purple-500/30">
                            {/* Lever Header */}
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold text-[var(--burnt-orange)]">{lever.leverName}</p>
                                  <span className="px-2 py-0.5 bg-purple-900/30 text-[var(--burnt-orange)] text-xs rounded">
                                    {lever.leverType}
                                  </span>
                                </div>
                                <p className="text-xs text-[var(--grey-400)] mt-1">{lever.objective}</p>
                              </div>
                              <span className="px-2 py-0.5 bg-purple-900/50 text-[var(--burnt-orange)] text-xs rounded">
                                Priority {lever.priority}
                              </span>
                            </div>

                            <div className="space-y-3">
                              {/* Media Pitches */}
                              {campaign.mediaPitches && campaign.mediaPitches.length > 0 && (
                                <div className="bg-emerald-900/10 border border-emerald-500/20 rounded p-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[var(--burnt-orange)]">📰</span>
                                    <p className="text-sm font-semibold text-[var(--burnt-orange)]">Media Pitches</p>
                                    <span className="text-xs text-[var(--grey-500)]">({campaign.mediaPitches.length})</span>
                                  </div>
                                  <div className="space-y-2">
                                    {campaign.mediaPitches.map((pitch, k) => (
                                      <div key={k} className="bg-zinc-900/30 rounded p-2 text-xs">
                                        <div className="grid grid-cols-3 gap-2 mb-1">
                                          <div>
                                            <p className="text-[var(--grey-500)]">WHO</p>
                                            <p className="text-[var(--burnt-orange)] font-medium">{pitch.who}</p>
                                          </div>
                                          <div>
                                            <p className="text-[var(--grey-500)]">WHERE</p>
                                            <p className="text-[var(--burnt-orange)]">{pitch.outlet}</p>
                                          </div>
                                          <div>
                                            <p className="text-[var(--grey-500)]">WHEN</p>
                                            <p className="text-[var(--burnt-orange)]">{pitch.when}</p>
                                          </div>
                                        </div>
                                        <p className="text-[var(--grey-500)]">WHAT</p>
                                        <p className="text-white">{pitch.what}</p>
                                        {pitch.beat && (
                                          <p className="text-gray-600 text-[10px] mt-1">Beat: {pitch.beat}</p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Social Posts */}
                              {campaign.socialPosts && campaign.socialPosts.length > 0 && (
                                <div className="bg-blue-900/10 border border-blue-500/20 rounded p-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[var(--burnt-orange)]">📱</span>
                                    <p className="text-sm font-semibold text-[var(--burnt-orange)]">Social Media</p>
                                    <span className="text-xs text-[var(--grey-500)]">({campaign.socialPosts.length})</span>
                                  </div>
                                  <div className="space-y-2">
                                    {campaign.socialPosts.map((post, k) => (
                                      <div key={k} className="bg-zinc-900/30 rounded p-2 text-xs">
                                        <div className="grid grid-cols-3 gap-2 mb-1">
                                          <div>
                                            <p className="text-[var(--grey-500)]">WHO</p>
                                            <p className="text-[var(--burnt-orange)] font-medium">{post.who}</p>
                                          </div>
                                          <div>
                                            <p className="text-[var(--grey-500)]">WHERE</p>
                                            <p className="text-[var(--burnt-orange)]">{post.platform}</p>
                                          </div>
                                          <div>
                                            <p className="text-[var(--grey-500)]">WHEN</p>
                                            <p className="text-[var(--burnt-orange)]">{post.when}</p>
                                          </div>
                                        </div>
                                        <p className="text-[var(--grey-500)]">WHAT</p>
                                        <p className="text-white mb-1">{post.what}</p>
                                        {post.keyMessages && post.keyMessages.length > 0 && (
                                          <ul className="list-disc list-inside text-[var(--grey-400)] space-y-0.5">
                                            {post.keyMessages.map((msg, m) => (
                                              <li key={m}>{msg}</li>
                                            ))}
                                          </ul>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Thought Leadership */}
                              {campaign.thoughtLeadership && campaign.thoughtLeadership.length > 0 && (
                                <div className="bg-purple-900/10 border border-purple-500/20 rounded p-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[var(--burnt-orange)]">✍️</span>
                                    <p className="text-sm font-semibold text-[var(--burnt-orange)]">Thought Leadership</p>
                                    <span className="text-xs text-[var(--grey-500)]">({campaign.thoughtLeadership.length})</span>
                                  </div>
                                  <div className="space-y-2">
                                    {campaign.thoughtLeadership.map((article, k) => (
                                      <div key={k} className="bg-zinc-900/30 rounded p-2 text-xs">
                                        <div className="grid grid-cols-3 gap-2 mb-1">
                                          <div>
                                            <p className="text-[var(--grey-500)]">WHO</p>
                                            <p className="text-[var(--burnt-orange)] font-medium">{article.who}</p>
                                          </div>
                                          <div>
                                            <p className="text-[var(--grey-500)]">WHERE</p>
                                            <p className="text-[var(--burnt-orange)]">{article.where}</p>
                                          </div>
                                          <div>
                                            <p className="text-[var(--grey-500)]">WHEN</p>
                                            <p className="text-[var(--burnt-orange)]">{article.when}</p>
                                          </div>
                                        </div>
                                        <p className="text-[var(--grey-500)]">WHAT</p>
                                        <p className="text-white mb-1">{article.what}</p>
                                        {article.keyPoints && article.keyPoints.length > 0 && (
                                          <ul className="list-disc list-inside text-[var(--grey-400)] space-y-0.5">
                                            {article.keyPoints.map((point, m) => (
                                              <li key={m}>{point}</li>
                                            ))}
                                          </ul>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Additional Tactics (User Must Execute) */}
                              {campaign.additionalTactics && campaign.additionalTactics.length > 0 && (
                                <div className="bg-amber-900/10 border border-amber-500/20 rounded p-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[var(--burnt-orange)]">👤</span>
                                    <p className="text-sm font-semibold text-[var(--burnt-orange)]">User Must Execute</p>
                                    <span className="text-xs text-[var(--grey-500)]">({campaign.additionalTactics.length})</span>
                                  </div>
                                  <div className="space-y-2">
                                    {campaign.additionalTactics.map((tactic, k) => (
                                      <div key={k} className="bg-zinc-900/30 rounded p-2 text-xs">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="px-2 py-0.5 bg-amber-900/40 text-[var(--burnt-orange)] rounded">
                                            {tactic.type}
                                          </span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 mb-1">
                                          <div>
                                            <p className="text-[var(--grey-500)]">WHO</p>
                                            <p className="text-[var(--burnt-orange)] font-medium">{tactic.who}</p>
                                          </div>
                                          <div>
                                            <p className="text-[var(--grey-500)]">WHERE</p>
                                            <p className="text-[var(--burnt-orange)]">{tactic.where}</p>
                                          </div>
                                          <div>
                                            <p className="text-[var(--grey-500)]">WHEN</p>
                                            <p className="text-[var(--burnt-orange)]">{tactic.when}</p>
                                          </div>
                                        </div>
                                        <p className="text-[var(--grey-500)]">WHAT</p>
                                        <p className="text-white mb-1">{tactic.what}</p>
                                        {tactic.estimatedEffort && (
                                          <p className="text-gray-600 text-[10px]">Effort: {tactic.estimatedEffort}</p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Completion Criteria */}
                            {lever.completionCriteria && lever.completionCriteria.length > 0 && (
                              <div className="mt-3 p-2 bg-zinc-900/30 rounded">
                                <p className="text-xs text-[var(--grey-500)] font-semibold mb-1">Completion Criteria:</p>
                                <ul className="list-disc list-inside text-xs text-[var(--grey-400)] space-y-0.5">
                                  {lever.completionCriteria.map((criteria, k) => (
                                    <li key={k}>{criteria}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        }

        // OLD STRUCTURE: Phase-based Tactical Orchestration
        const phases = [
          { key: 'phase1_awareness', label: 'Phase 1: Awareness', weeks: 'Weeks 1-3', color: 'blue' },
          { key: 'phase2_consideration', label: 'Phase 2: Consideration', weeks: 'Weeks 4-6', color: 'purple' },
          { key: 'phase3_conversion', label: 'Phase 3: Conversion', weeks: 'Weeks 7-9', color: 'amber' },
          { key: 'phase4_advocacy', label: 'Phase 4: Advocacy', weeks: 'Weeks 10-12', color: 'emerald' }
        ]

        return (
          <div className="space-y-6">
            {phases.map((phase, i) => {
              const phaseData = blueprint.part3_tacticalOrchestration?.[phase.key as keyof typeof blueprint.part3_tacticalOrchestration]
              if (!phaseData) return null

              return (
                <div key={i} className={`p-4 bg-${phase.color}-900/20 border border-${phase.color}-500/30 rounded`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className={`text-lg font-semibold text-${phase.color}-300`}>{phase.label}</p>
                      <p className="text-xs text-[var(--grey-400)]">{phase.weeks}</p>
                    </div>
                  </div>

                  {/* Pillar 1: Owned Actions */}
                  {phaseData.pillar1_ownedActions && phaseData.pillar1_ownedActions.length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[var(--burnt-orange)]">🏢</span>
                        <p className="text-sm font-semibold text-[var(--burnt-orange)]">Pillar 1: Owned Actions</p>
                        <span className="text-xs px-2 py-0.5 bg-emerald-900/30 text-[var(--burnt-orange)] rounded">
                          Signaldesk Auto-Execute
                        </span>
                      </div>
                      <div className="space-y-2">
                        {phaseData.pillar1_ownedActions.map((action: any, j) => {
                          const isSocialMedia = action.platform || action.postOwner || action.postFormat
                          return (
                            <div key={j} className={`p-3 rounded ${isSocialMedia ? 'bg-[var(--burnt-orange-muted)] border border-[var(--burnt-orange)]' : 'bg-[var(--grey-900)]'}`}>
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-mono px-2 py-0.5 rounded ${isSocialMedia ? 'text-[var(--burnt-orange)] bg-blue-900/50' : 'text-[var(--burnt-orange)] bg-blue-900/30'}`}>
                                    {action.contentType}
                                  </span>
                                  {isSocialMedia && (
                                    <span className="text-xs px-2 py-0.5 bg-purple-900/40 text-[var(--burnt-orange)] rounded border border-purple-500/30 flex items-center gap-1">
                                      <span>📱</span>
                                      Social Media
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-[var(--grey-500)]">{action.timing}</span>
                              </div>
                              <p className="text-sm text-white mb-1">For: {action.targetStakeholder}</p>
                              <p className="text-xs text-[var(--grey-400)] mb-2">{action.psychologicalLever}</p>

                              {/* Social Media Details */}
                              {isSocialMedia && (
                                <div className="mb-2 p-2 bg-blue-900/20 rounded border border-blue-500/20">
                                  <div className="flex flex-wrap gap-2 text-xs">
                                    {action.platform && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-[var(--burnt-orange)] font-medium">Platform:</span>
                                        <span className="text-[var(--burnt-orange)]">{action.platform}</span>
                                      </div>
                                    )}
                                    {action.postOwner && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-[var(--burnt-orange)] font-medium">Posted by:</span>
                                        <span className="text-[var(--burnt-orange)]">{action.postOwner}</span>
                                      </div>
                                    )}
                                    {action.postFormat && (
                                      <div className="flex items-center gap-1">
                                        <span className="text-[var(--burnt-orange)] font-medium">Format:</span>
                                        <span className="text-[var(--burnt-orange)]">{action.postFormat}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {action.keyPoints && action.keyPoints.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs text-[var(--burnt-orange)] mb-1">Key Points:</p>
                                  <ul className="list-disc list-inside space-y-0.5">
                                    {action.keyPoints.map((point, k) => (
                                      <li key={k} className="text-xs text-[var(--grey-300)]">{point}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {action.channels && action.channels.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {action.channels.map((channel, k) => (
                                    <span key={k} className="text-xs px-1.5 py-0.5 bg-zinc-800 text-[var(--grey-400)] rounded">
                                      {channel}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Pillar 2: Relationship Orchestration */}
                  {phaseData.pillar2_relationshipOrchestration && phaseData.pillar2_relationshipOrchestration.length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[var(--burnt-orange)]">🤝</span>
                        <p className="text-sm font-semibold text-[var(--burnt-orange)]">Pillar 2: Relationship Orchestration</p>
                        <span className="text-xs px-2 py-0.5 bg-amber-900/30 text-[var(--burnt-orange)] rounded">
                          User Action Required
                        </span>
                      </div>
                      <div className="space-y-2">
                        {phaseData.pillar2_relationshipOrchestration.map((action, j) => (
                          <div key={j} className="p-3 bg-[var(--grey-900)] rounded">
                            <div className="flex items-start justify-between mb-1">
                              <p className="text-sm text-white font-medium">{action.who}</p>
                              <span className="text-xs text-[var(--grey-500)]">{action.timing}</span>
                            </div>
                            <p className="text-xs text-[var(--grey-300)] mb-1">Action: {action.action}</p>
                            <p className="text-xs text-[var(--burnt-orange)]">Goal: {action.goal}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pillar 3: Event Orchestration */}
                  {phaseData.pillar3_eventOrchestration && phaseData.pillar3_eventOrchestration.length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[var(--burnt-orange)]">🎪</span>
                        <p className="text-sm font-semibold text-[var(--burnt-orange)]">Pillar 3: Event Orchestration</p>
                        <span className="text-xs px-2 py-0.5 bg-amber-900/30 text-[var(--burnt-orange)] rounded">
                          User Action Required
                        </span>
                      </div>
                      <div className="space-y-2">
                        {phaseData.pillar3_eventOrchestration.map((action, j) => (
                          <div key={j} className="p-3 bg-[var(--grey-900)] rounded">
                            <div className="flex items-start justify-between mb-1">
                              <p className="text-sm text-white font-medium">{action.event}</p>
                              <span className="text-xs text-[var(--grey-500)]">{action.timing}</span>
                            </div>
                            <p className="text-xs text-[var(--grey-300)] mb-1">Action: {action.action}</p>
                            <p className="text-xs text-[var(--burnt-orange)]">Goal: {action.goal}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pillar 4: Media Engagement */}
                  {phaseData.pillar4_mediaEngagement && phaseData.pillar4_mediaEngagement.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[var(--burnt-orange)]">📰</span>
                        <p className="text-sm font-semibold text-[var(--burnt-orange)]">Pillar 4: Media Engagement</p>
                        <span className="text-xs px-2 py-0.5 bg-emerald-900/30 text-[var(--burnt-orange)] rounded">
                          Signaldesk Auto-Execute
                        </span>
                      </div>
                      <div className="space-y-2">
                        {phaseData.pillar4_mediaEngagement.map((action, j) => (
                          <div key={j} className="p-3 bg-[var(--grey-900)] rounded">
                            <div className="flex items-start justify-between mb-2">
                              <p className="text-sm text-white font-medium">{action.story}</p>
                              <span className="text-xs text-[var(--grey-500)]">{action.timing}</span>
                            </div>
                            {action.journalists && action.journalists.length > 0 && (
                              <div className="mb-2">
                                <p className="text-xs text-[var(--burnt-orange)] mb-1">Target Journalists:</p>
                                <div className="space-y-1">
                                  {action.journalists.map((journalist, k) => (
                                    <div key={k} className="text-xs">
                                      <span className="text-white">{journalist.name}</span>
                                      <span className="text-[var(--grey-400)]"> ({journalist.outlet})</span>
                                      {journalist.beat && (
                                        <span className="text-[var(--grey-500)]"> - {journalist.beat}</span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {action.positioningMessage && (
                              <p className="text-xs text-[var(--grey-400)] italic">{action.positioningMessage}</p>
                            )}
                          </div>
                        ))}
                      </div>
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
      id: 'execution',
      title: 'Execution Inventory',
      icon: '⚡',
      color: 'emerald',
      render: () => {
        // NEW STRUCTURE: Build execution inventory from stakeholder orchestration
        if (blueprint.part3_stakeholderOrchestration?.stakeholderOrchestrationPlans) {
          // Group stakeholders by priority
          const priorityGroups: Record<number, any[]> = {}

          blueprint.part3_stakeholderOrchestration.stakeholderOrchestrationPlans.forEach((plan: any) => {
            const priority = plan.stakeholder?.priority || 4
            if (!priorityGroups[priority]) {
              priorityGroups[priority] = []
            }
            priorityGroups[priority].push(plan)
          })

          const priorityLabels: Record<number, { label: string; color: string; description: string }> = {
            1: { label: 'Stage 1: Launch', color: 'red', description: 'Must-have content for launch success' },
            2: { label: 'Stage 2: Amplify', color: 'amber', description: 'High-impact amplification content' },
            3: { label: 'Stage 3: Engage', color: 'blue', description: 'Ongoing engagement content' },
            4: { label: 'Stage 4: Sustain', color: 'gray', description: 'Long-term presence building' }
          }

          return (
            <div className="space-y-6">
              <div className="p-3 bg-[var(--burnt-orange-muted)] border border-[var(--burnt-orange)] rounded">
                <p className="text-sm text-[var(--burnt-orange)]">
                  This execution inventory shows all content organized by campaign stage.
                  Click "View Materials" below to see and execute these items.
                </p>
              </div>

              {[1, 2, 3, 4].map(priorityLevel => {
                const stakeholdersAtPriority = priorityGroups[priorityLevel]
                if (!stakeholdersAtPriority || stakeholdersAtPriority.length === 0) return null

                const { label, color, description } = priorityLabels[priorityLevel]

                return (
                  <div key={priorityLevel} className={`p-4 bg-${color}-900/20 border border-${color}-500/30 rounded`}>
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <p className={`text-lg font-semibold text-${color}-300`}>{label}</p>
                        <span className="text-xs text-[var(--grey-500)]">{stakeholdersAtPriority.length} stakeholder(s)</span>
                      </div>
                      <p className="text-xs text-[var(--grey-400)]">{description}</p>
                    </div>

                    <div className="space-y-4">
                      {stakeholdersAtPriority.map((plan: any, i: number) => {
                        // Count total content items for this stakeholder
                        let totalItems = 0
                        const contentCounts = {
                          mediaPitches: 0,
                          socialPosts: 0,
                          thoughtLeadership: 0,
                          additionalTactics: 0
                        }

                        plan.influenceLevers?.forEach((lever: any) => {
                          if (lever.campaign) {
                            contentCounts.mediaPitches += lever.campaign.mediaPitches?.length || 0
                            contentCounts.socialPosts += lever.campaign.socialPosts?.length || 0
                            contentCounts.thoughtLeadership += lever.campaign.thoughtLeadership?.length || 0
                            contentCounts.additionalTactics += lever.campaign.additionalTactics?.length || 0
                          }
                        })

                        totalItems = Object.values(contentCounts).reduce((sum, count) => sum + count, 0)

                        return (
                          <div key={i} className="p-3 bg-[var(--grey-900)] border border-zinc-800 rounded">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <p className="text-white font-semibold">{plan.stakeholder?.name}</p>
                                {plan.stakeholder?.psychologicalProfile?.primaryAspiration && (
                                  <p className="text-xs text-[var(--grey-400)] mt-1">
                                    Goal: {plan.stakeholder.psychologicalProfile.primaryAspiration}
                                  </p>
                                )}
                              </div>
                              <span className="text-xs px-2 py-1 bg-zinc-800 text-[var(--grey-400)] rounded">
                                {totalItems} items
                              </span>
                            </div>

                            {/* Content breakdown */}
                            <div className="grid grid-cols-2 gap-2">
                              {contentCounts.mediaPitches > 0 && (
                                <div className="p-2 bg-emerald-900/10 border border-emerald-500/20 rounded">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[var(--burnt-orange)]">📰</span>
                                    <div>
                                      <p className="text-xs text-[var(--burnt-orange)] font-medium">Media Pitches</p>
                                      <p className="text-xs text-[var(--grey-500)]">{contentCounts.mediaPitches} pitches</p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {contentCounts.socialPosts > 0 && (
                                <div className="p-2 bg-blue-900/10 border border-blue-500/20 rounded">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[var(--burnt-orange)]">📱</span>
                                    <div>
                                      <p className="text-xs text-[var(--burnt-orange)] font-medium">Social Posts</p>
                                      <p className="text-xs text-[var(--grey-500)]">{contentCounts.socialPosts} posts</p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {contentCounts.thoughtLeadership > 0 && (
                                <div className="p-2 bg-purple-900/10 border border-purple-500/20 rounded">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[var(--burnt-orange)]">✍️</span>
                                    <div>
                                      <p className="text-xs text-[var(--burnt-orange)] font-medium">Thought Leadership</p>
                                      <p className="text-xs text-[var(--grey-500)]">{contentCounts.thoughtLeadership} articles</p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {contentCounts.additionalTactics > 0 && (
                                <div className="p-2 bg-amber-900/10 border border-amber-500/20 rounded">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[var(--burnt-orange)]">👤</span>
                                    <div>
                                      <p className="text-xs text-[var(--burnt-orange)] font-medium">User Actions</p>
                                      <p className="text-xs text-[var(--grey-500)]">{contentCounts.additionalTactics} items</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        }

        // FALLBACK: Old content inventory format
        return (
          <div className="space-y-4">
            {blueprint.part6_contentInventory?.summary && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-[var(--burnt-orange-muted)] border border-[var(--burnt-orange)] rounded">
                  <p className="text-sm text-[var(--grey-400)] mb-1">Signaldesk Auto-Execute</p>
                  <p className="text-2xl font-bold text-[var(--burnt-orange)]">
                    {blueprint.part6_contentInventory.summary.totalSignaldeskActions || 0}
                  </p>
                  <p className="text-xs text-[var(--grey-500)]">actions</p>
                </div>
                <div className="p-3 bg-amber-900/20 border border-amber-500/30 rounded">
                  <p className="text-sm text-[var(--grey-400)] mb-1">User Action Required</p>
                  <p className="text-2xl font-bold text-[var(--burnt-orange)]">
                    {blueprint.part6_contentInventory.summary.totalOrganizationActions || 0}
                  </p>
                  <p className="text-xs text-[var(--grey-500)]">actions</p>
                </div>
              </div>
            )}
          </div>
        )
      }
    }
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <div className="flex items-center justify-center gap-2">
          <svg className="w-6 h-6 animate-pulse" style={{ color: 'var(--burnt-orange)' }} fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
            {blueprint.overview?.campaignName || blueprint.part1_strategicFoundation?.positioning?.name || 'VECTOR Campaign Blueprint'}
          </h2>
        </div>
        {(blueprint.messageArchitecture?.coreMessage || blueprint.part1_strategicFoundation?.positioning?.tagline) && (
          <p className="text-lg italic" style={{ color: 'var(--grey-300)' }}>
            {blueprint.messageArchitecture?.coreMessage || blueprint.part1_strategicFoundation.positioning.tagline}
          </p>
        )}
        <div className="flex items-center justify-center gap-3">
          <div className="inline-block px-3 py-1 rounded-full" style={{ background: 'var(--burnt-orange-muted)', border: '1px solid var(--burnt-orange)' }}>
            <span className="text-sm font-medium" style={{ color: 'var(--burnt-orange)' }}>
              {blueprint.metadata?.pattern || 'VECTOR'} Pattern
            </span>
          </div>
          {blueprint.metadata?.performance?.totalTime && (
            <div className="inline-block px-3 py-1 rounded-full" style={{ background: 'var(--grey-800)', border: '1px solid var(--grey-700)' }}>
              <span className="text-sm font-medium" style={{ color: 'var(--grey-300)' }}>
                Generated in {blueprint.metadata.performance.totalTime}
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Blueprint Sections */}
      <div className="grid grid-cols-1 gap-4">
        {sections.map((section, i) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-lg overflow-hidden transition-all"
            style={{ background: 'var(--grey-900)', border: '1px solid var(--grey-800)' }}
          >
            <button
              onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
              className="w-full p-4 text-left hover:brightness-110 transition-colors"
              style={{ background: 'var(--grey-900)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'var(--burnt-orange)', color: 'var(--white)' }}>{i + 1}</div>
                  <h3 className="font-semibold text-white text-lg" style={{ fontFamily: 'var(--font-display)' }}>{section.title}</h3>
                </div>
                <svg
                  className={`w-5 h-5 transition-transform ${expandedSection === section.id ? 'rotate-180' : ''}`}
                  style={{ color: 'var(--grey-400)' }}
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
                className="px-4 pb-4"
                style={{ borderTop: '1px solid var(--grey-800)' }}
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
            className="w-full h-24 rounded-lg px-4 py-3 text-white resize-none focus:outline-none transition-colors"
            style={{ background: 'var(--grey-900)', border: '1px solid var(--grey-800)', color: 'var(--white)' }}
            disabled={isRefining}
          />
          <div className="flex gap-2">
            <button
              onClick={handleRefineSubmit}
              disabled={!refinementInput.trim() || isRefining}
              className="px-4 py-2 text-white rounded-lg font-medium hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{ background: 'var(--burnt-orange)', fontFamily: 'var(--font-display)' }}
            >
              {isRefining ? 'Refining...' : 'Refine Blueprint'}
            </button>
            <button
              onClick={() => {
                setShowRefinementInput(false)
                setRefinementInput('')
              }}
              className="px-4 py-2 text-white rounded-lg font-medium hover:brightness-110 transition-all"
              style={{ background: 'var(--grey-800)', fontFamily: 'var(--font-display)' }}
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
          transition={{ delay: 0.6 }}
          className="flex items-center justify-between pt-4"
          style={{ borderTop: '1px solid var(--grey-800)' }}
        >
          <div className="flex gap-3">
            {onRefine && (
              <button
                onClick={() => setShowRefinementInput(true)}
                disabled={isRefining}
                className="flex items-center gap-2 px-4 py-2 transition-colors hover:text-white"
                style={{ color: 'var(--grey-400)', fontFamily: 'var(--font-display)' }}
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
                className="flex items-center gap-2 px-4 py-2 transition-colors hover:text-white"
                style={{ color: 'var(--grey-400)', fontFamily: 'var(--font-display)' }}
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
              className="px-6 py-3 text-white rounded-lg font-medium hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              style={{ background: 'var(--burnt-orange)', fontFamily: 'var(--font-display)' }}
            >
              View Materials
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          )}
        </motion.div>
      )}

      {/* Loading State */}
      {isRefining && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-2 py-4"
          style={{ color: 'var(--burnt-orange)' }}
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
