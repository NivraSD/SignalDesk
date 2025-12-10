'use client'

import React, { useState, useEffect } from 'react'
import { FileText, X as CloseIcon, Users, Shield, MessageSquare, AlertTriangle, CheckCircle, Package, Circle, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAppStore } from '@/stores/useAppStore'
import { fetchMemoryVaultContent } from '@/lib/memoryVaultAPI'

interface CrisisPlanViewerProps {
  onClose: () => void
  plan?: any
  embedded?: boolean
}

interface DraftedComm {
  id: string
  scenario: string
  stakeholder: string
}

export default function CrisisPlanViewer({ onClose, plan: providedPlan, embedded = false }: CrisisPlanViewerProps) {
  const { organization } = useAppStore()
  const [plan, setPlan] = useState<any>(providedPlan)
  const [loading, setLoading] = useState(!providedPlan)
  const [activeTab, setActiveTab] = useState('overview')
  const [draftedComms, setDraftedComms] = useState<DraftedComm[]>([])

  useEffect(() => {
    if (!providedPlan && organization) {
      loadPlan()
    }
  }, [organization, providedPlan])

  useEffect(() => {
    if (organization) {
      loadDraftedComms()
    }
  }, [organization])

  const loadDraftedComms = async () => {
    if (!organization?.id) return
    try {
      const { data, error } = await supabase
        .from('content_library')
        .select('id, metadata')
        .eq('organization_id', organization.id)
        .eq('content_type', 'crisis-communication')
        .contains('tags', ['pre-drafted'])

      if (!error && data) {
        setDraftedComms(data.map(d => ({
          id: d.id,
          scenario: d.metadata?.scenario || '',
          stakeholder: d.metadata?.stakeholder || ''
        })))
      }
    } catch (err) {
      console.error('Failed to load drafted comms:', err)
    }
  }

  const getCommsForScenario = (scenarioTitle: string) => {
    return draftedComms.filter(c => c.scenario === scenarioTitle)
  }

  const loadPlan = async () => {
    setLoading(true)
    try {
      // Get the most recent crisis plan for this organization
      const data = await fetchMemoryVaultContent({
        organization_id: organization?.id || '',
        content_type: 'crisis-plan',
        limit: 1
      })

      if (data.length > 0) {
        const parsedPlan = JSON.parse(data[0].content)
        console.log('📋 Crisis Plan loaded:', {
          hasPurpose: !!parsedPlan.purpose,
          hasGuidingPrinciples: !!parsedPlan.guidingPrinciples,
          guidingPrinciplesCount: parsedPlan.guidingPrinciples?.length || 0,
          hasScenarios: !!parsedPlan.scenarios,
          scenariosCount: parsedPlan.scenarios?.length || 0,
          keys: Object.keys(parsedPlan)
        })
        setPlan(parsedPlan)
      }
    } catch (err) {
      console.error('Load plan error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return embedded ? (
      <div className="h-full flex items-center justify-center">
        <div className="text-white">Loading crisis plan...</div>
      </div>
    ) : (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-[var(--charcoal)] border border-zinc-800 rounded-xl p-8">
          <div className="text-white">Loading crisis plan...</div>
        </div>
      </div>
    )
  }

  if (!plan) {
    const noPlanContent = (
      <div className="text-center">
        <FileText className="w-16 h-16 text-[var(--grey-500)] mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>No Crisis Plan Found</h3>
        <p className="text-[var(--grey-400)] mb-6">Generate a crisis plan to get started</p>
        {!embedded && (
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[var(--burnt-orange)] hover:brightness-110 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        )}
      </div>
    )

    return embedded ? (
      <div className="h-full flex items-center justify-center">
        {noPlanContent}
      </div>
    ) : (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
        <div className="bg-[var(--charcoal)] border border-zinc-800 rounded-xl p-8 max-w-md">
          {noPlanContent}
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: FileText },
    { id: 'scenarios', name: 'Scenarios', icon: AlertTriangle },
    { id: 'team', name: 'Crisis Team', icon: Users },
    { id: 'stakeholders', name: 'Stakeholders', icon: Shield },
    { id: 'inventory', name: 'Inventory', icon: Package }
  ]

  // Helper to find communication plan for a stakeholder
  const getCommPlanForStakeholder = (stakeholderName: string) => {
    return plan.communicationPlans?.find((c: any) =>
      c.stakeholder?.toLowerCase() === stakeholderName?.toLowerCase()
    )
  }

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'text-red-500 bg-red-500/10 border-red-500'
      case 'major': return 'text-[var(--burnt-orange)] bg-[var(--burnt-orange)]/10 border-[var(--burnt-orange)]'
      case 'moderate': return 'text-amber-500 bg-amber-500/10 border-amber-500'
      case 'minor': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500'
      default: return 'text-[var(--grey-500)] bg-[var(--grey-500)]/10 border-[var(--grey-500)]'
    }
  }

  const getLikelihoodColor = (likelihood: string) => {
    switch (likelihood?.toLowerCase()) {
      case 'high': return 'text-red-400'
      case 'medium': return 'text-amber-400'
      case 'low': return 'text-emerald-400'
      default: return 'text-[var(--grey-400)]'
    }
  }

  // Shared content for tabs and main content area
  const planContent = (
    <>
      {/* Tabs */}
      <div className="px-6 py-3 border-b border-zinc-800 flex gap-2 overflow-x-auto shrink-0">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[var(--burnt-orange)] text-white'
                  : 'bg-zinc-800 text-[var(--grey-400)] hover:text-white hover:bg-zinc-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.name}</span>
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {plan.purpose && (
              <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>Purpose of Plan</h3>
                <p className="text-[var(--grey-300)] leading-relaxed">{plan.purpose}</p>
              </div>
            )}

            {plan.guidingPrinciples && plan.guidingPrinciples.length > 0 && (
              <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>Guiding Principles</h3>
                <ul className="space-y-3">
                  {plan.guidingPrinciples.map((principle: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-[var(--burnt-orange)]/10 border border-[var(--burnt-orange)]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-[var(--burnt-orange)]">{idx + 1}</span>
                      </div>
                      <span className="text-[var(--grey-300)] leading-relaxed">{principle}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {plan.keyConcerns?.length > 0 && (
              <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>Key Concerns</h3>
                <div className="flex flex-wrap gap-2">
                  {plan.keyConcerns.map((concern: string, idx: number) => (
                    <span key={idx} className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-sm">
                      {concern}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {plan.existingProtocols && (
              <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>Existing Protocols</h3>
                <p className="text-[var(--grey-300)] whitespace-pre-wrap">{plan.existingProtocols}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'scenarios' && (
          <div className="space-y-4">
            {plan.scenarios?.map((scenario: any, idx: number) => (
              <div key={idx} className="bg-zinc-800 border border-zinc-700 rounded-xl p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>{scenario.title}</h3>
                    <p className="text-[var(--grey-300)] mb-3">{scenario.description}</p>
                  </div>
                  {scenario.isUniversal && (
                    <span className="px-2 py-1 bg-[var(--burnt-orange)]/10 text-[var(--burnt-orange)] border border-[var(--burnt-orange)]/30 rounded text-xs">
                      Universal
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[var(--grey-400)]">Likelihood:</span>
                    <span className={`text-sm font-semibold ${getLikelihoodColor(scenario.likelihood)}`}>
                      {scenario.likelihood}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[var(--grey-400)]">Impact:</span>
                    <span className={`text-xs px-2 py-1 rounded border ${getSeverityColor(scenario.impact)}`}>
                      {scenario.impact}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'team' && (
          <div className="space-y-4">
            {plan.crisisTeam?.map((member: any, idx: number) => (
              <div key={idx} className="bg-zinc-800 border border-zinc-700 rounded-xl p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>{member.role}</h3>
                    <p className="text-sm text-[var(--grey-400)]">{member.title}</p>
                    {member.name && (
                      <p className="text-sm text-[var(--burnt-orange)] mt-1">{member.name}</p>
                    )}
                    {member.contact && (
                      <p className="text-sm text-[var(--grey-500)] mt-1">{member.contact}</p>
                    )}
                  </div>
                  {member.name ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  )}
                </div>
                {member.responsibilities?.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm font-semibold text-[var(--grey-400)] mb-2">Responsibilities:</div>
                    <ul className="space-y-1">
                      {member.responsibilities.map((resp: string, ridx: number) => (
                        <li key={ridx} className="text-sm text-[var(--grey-300)] flex items-start gap-2">
                          <span className="text-[var(--burnt-orange)] mt-1">•</span>
                          <span>{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'stakeholders' && (
          <div className="space-y-4">
            {plan.stakeholders?.map((stakeholder: any, idx: number) => {
              const commPlan = getCommPlanForStakeholder(stakeholder.name)
              return (
                <div key={idx} className="bg-zinc-800 border border-zinc-700 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>{stakeholder.name}</h3>
                      <p className="text-sm text-[var(--grey-400)]">{stakeholder.description}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded border ${
                      stakeholder.impactLevel === 'High' ? 'text-red-400 bg-red-500/10 border-red-500' :
                      stakeholder.impactLevel === 'Medium' ? 'text-amber-400 bg-amber-500/10 border-amber-500' :
                      'text-[var(--burnt-orange)] bg-[var(--burnt-orange)]/10 border-[var(--burnt-orange)]'
                    }`}>
                      {stakeholder.impactLevel} Impact
                    </span>
                  </div>

                  {/* Concerns */}
                  {stakeholder.concerns?.length > 0 && (
                    <div className="mt-4">
                      <div className="text-sm font-semibold text-[var(--grey-400)] mb-2">Primary Concerns:</div>
                      <div className="flex flex-wrap gap-2">
                        {stakeholder.concerns.map((concern: string, cidx: number) => (
                          <span key={cidx} className="px-2 py-1 bg-zinc-900 text-[var(--grey-300)] text-xs rounded">
                            {concern}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Communication Approach */}
                  {commPlan && (
                    <div className="mt-4 pt-4 border-t border-zinc-700">
                      <div className="text-sm font-semibold text-[var(--burnt-orange)] mb-3">Communication Approach</div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <div className="text-xs text-[var(--grey-500)]">Primary Channel</div>
                          <div className="text-sm text-white">{commPlan.primaryChannel}</div>
                        </div>
                        <div>
                          <div className="text-xs text-[var(--grey-500)]">Timing</div>
                          <div className="text-sm text-white">{commPlan.timing}</div>
                        </div>
                        <div>
                          <div className="text-xs text-[var(--grey-500)]">Spokesperson</div>
                          <div className="text-sm text-white">{commPlan.spokesperson}</div>
                        </div>
                        {commPlan.secondaryChannel && (
                          <div>
                            <div className="text-xs text-[var(--grey-500)]">Secondary Channel</div>
                            <div className="text-sm text-white">{commPlan.secondaryChannel}</div>
                          </div>
                        )}
                      </div>
                      {commPlan.keyMessages?.length > 0 && (
                        <div>
                          <div className="text-xs text-[var(--grey-500)] mb-2">Key Messages:</div>
                          <ul className="space-y-1">
                            {commPlan.keyMessages.slice(0, 3).map((message: string, midx: number) => (
                              <li key={midx} className="text-xs text-[var(--grey-300)] flex items-start gap-2">
                                <span className="text-[var(--burnt-orange)]">•</span>
                                <span>{message}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-6">
            {/* Info banner */}
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-[var(--burnt-orange)] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-[var(--grey-300)]">
                  Draft communications are generated and managed in the <span className="text-[var(--burnt-orange)] font-medium">Communications tab</span> of the Crisis Command Center.
                </p>
                <p className="text-xs text-[var(--grey-500)] mt-1">
                  Materials are stored in Memory Vault under Crisis/[Scenario Name]
                </p>
              </div>
            </div>

            {/* Scenarios with draft status */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>Scenario Draft Status</h3>
              {plan.scenarios?.map((scenario: any, idx: number) => {
                const scenarioComms = getCommsForScenario(scenario.title)
                const stakeholderCount = plan.stakeholders?.length || 6
                const hasAllComms = scenarioComms.length >= stakeholderCount

                return (
                  <div key={idx} className="bg-zinc-800 border border-zinc-700 rounded-xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="text-white font-semibold">{scenario.title}</h4>
                        <p className="text-sm text-[var(--grey-400)] mt-1">{scenario.description}</p>
                      </div>
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                        hasAllComms
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : scenarioComms.length > 0
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-zinc-700 text-[var(--grey-400)] border border-zinc-600'
                      }`}>
                        {hasAllComms ? (
                          <><CheckCircle className="w-3.5 h-3.5" /> Complete</>
                        ) : scenarioComms.length > 0 ? (
                          <><Circle className="w-3.5 h-3.5" /> Partial ({scenarioComms.length}/{stakeholderCount})</>
                        ) : (
                          <><Circle className="w-3.5 h-3.5" /> Not Generated</>
                        )}
                      </div>
                    </div>

                    {/* Stakeholder breakdown */}
                    {scenarioComms.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-zinc-700">
                        <div className="text-xs text-[var(--grey-500)] mb-2">Drafted for:</div>
                        <div className="flex flex-wrap gap-2">
                          {scenarioComms.map((comm, cidx) => (
                            <span key={cidx} className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded border border-emerald-500/20">
                              {comm.stakeholder}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </>
  )

  // Embedded mode - renders inline without modal wrapper
  if (embedded) {
    return (
      <div className="h-full flex flex-col">
        {planContent}
      </div>
    )
  }

  // Modal mode - renders as overlay
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-[var(--charcoal)] border border-zinc-800 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--burnt-orange)] rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>Crisis Management Plan</h2>
                <p className="text-sm text-[var(--grey-400)]">
                  {plan.industry} • Generated {plan.generatedDate}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-[var(--grey-400)] hover:text-white transition-colors"
            >
              <CloseIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {planContent}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
