'use client'

import React, { useState, useEffect } from 'react'
import {
  Shield,
  AlertTriangle,
  Clock,
  Users,
  FileText,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Zap,
  Loader2,
  Activity,
  RefreshCw,
  Target
} from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { supabase } from '@/lib/supabase/client'
import { fetchMemoryVaultContent } from '@/lib/memoryVaultAPI'
import CrisisPlanGenerator from '@/components/crisis/CrisisPlanGenerator'
import CrisisScenarioSelector from '@/components/crisis/CrisisScenarioSelector'
import CrisisAIAssistant from '@/components/crisis/CrisisAIAssistant'
import CrisisTimeline from '@/components/crisis/CrisisTimeline'
import CrisisTeamManager from '@/components/crisis/CrisisTeamManager'
import CrisisCommunications from '@/components/crisis/CrisisCommunications'
import CrisisPlanViewer from '@/components/crisis/CrisisPlanViewer'

interface CrisisScenario {
  title: string
  description: string
  likelihood?: string
  impact?: string
  timeline?: Array<{
    phase: string
    action: string
    detail: string
  }>
}

interface CrisisPlan {
  industry?: string
  purpose?: string
  guidingPrinciples?: string[]
  scenarios?: CrisisScenario[]
  crisisTeam?: any[]
  emergencyContacts?: any[]
  communicationPlans?: any[]
  stakeholders?: any[]
  generatedDate?: string
}

interface CrisisEvent {
  id: string
  organization_id: string
  crisis_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'monitoring' | 'active' | 'resolved'
  title: string
  description?: string
  started_at: string
  resolved_at?: string
  timeline?: any[]
  tasks?: any[]
  communications?: any[]
  decisions?: any[]
  team_status?: Record<string, any>
  social_signals?: any[]
  stakeholder_sentiment?: Record<string, number>
  metadata?: { scenario?: CrisisScenario }
}

interface CrisisModuleProps {
  onOpenInStudio?: (content: { id: string; title: string; content: string }) => void
}

interface PreDraftedComm {
  id: string
  title: string
  content: string
  metadata: {
    scenario: string
    stakeholder: string
    tone: string
    channel: string
  }
}

export default function CrisisModule({ onOpenInStudio }: CrisisModuleProps) {
  const { organization } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [hasCrisisPlan, setHasCrisisPlan] = useState(false)
  const [crisisPlan, setCrisisPlan] = useState<CrisisPlan | null>(null)
  const [activeCrisis, setActiveCrisis] = useState<CrisisEvent | null>(null)
  const [showPlanGenerator, setShowPlanGenerator] = useState(false)
  const [showScenarioSelector, setShowScenarioSelector] = useState(false)
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false)
  const [elapsedTime, setElapsedTime] = useState('')

  // Tabs - same tabs always, Response Protocol only when crisis active
  const [activeView, setActiveView] = useState<'dashboard' | 'protocol' | 'timeline' | 'team' | 'communications' | 'plan'>('dashboard')

  // Pre-drafted communications
  const [preDraftedComms, setPreDraftedComms] = useState<PreDraftedComm[]>([])
  const [generatingComms, setGeneratingComms] = useState<string | null>(null)

  useEffect(() => {
    if (organization) {
      loadCrisisPlan()
      loadActiveCrisis()
      loadPreDraftedComms()
    }
  }, [organization])

  useEffect(() => {
    if (activeCrisis && activeCrisis.status === 'active') {
      const interval = setInterval(() => {
        setElapsedTime(calculateElapsedTime(activeCrisis.started_at))
      }, 60000)
      setElapsedTime(calculateElapsedTime(activeCrisis.started_at))
      return () => clearInterval(interval)
    }
  }, [activeCrisis])

  const loadPreDraftedComms = async () => {
    if (!organization?.id) return
    try {
      const { data, error } = await supabase
        .from('content_library')
        .select('id, title, content, metadata')
        .eq('organization_id', organization.id)
        .eq('type', 'crisis-communication')
        .contains('tags', ['pre-drafted'])
        .order('created_at', { ascending: false })

      if (!error && data) {
        setPreDraftedComms(data.map(d => ({
          id: d.id,
          title: d.title,
          content: d.content,
          metadata: d.metadata || {}
        })))
      }
    } catch (err) {
      console.error('Failed to load pre-drafted communications:', err)
    }
  }

  const getCommsForScenario = (scenarioTitle: string) => {
    return preDraftedComms.filter(c => c.metadata?.scenario === scenarioTitle)
  }

  const scenarioHasComms = (scenarioTitle: string) => {
    return preDraftedComms.some(c => c.metadata?.scenario === scenarioTitle)
  }

  const generateCommsForScenario = async (scenario: CrisisScenario) => {
    if (!organization || generatingComms) return
    setGeneratingComms(scenario.title)
    try {
      const { data, error } = await supabase.functions.invoke('mcp-crisis', {
        body: {
          action: 'generate_scenario_comms',
          scenario: scenario,
          organization_id: organization.id,
          organization_name: organization.name,
          industry: crisisPlan?.industry || organization.industry
        }
      })
      if (!error && data?.communications) {
        await loadPreDraftedComms()
      }
    } catch (err) {
      console.error('Error generating communications:', err)
    } finally {
      setGeneratingComms(null)
    }
  }

  const loadCrisisPlan = async () => {
    if (!organization) return
    setLoading(true)
    try {
      const data = await fetchMemoryVaultContent({
        organization_id: organization.id,
        content_type: 'crisis-plan',
        limit: 1
      })
      if (data.length > 0) {
        const parsedPlan = JSON.parse(data[0].content)
        setCrisisPlan(parsedPlan)
        setHasCrisisPlan(true)
      } else {
        setHasCrisisPlan(false)
        setCrisisPlan(null)
      }
    } catch (err) {
      console.error('Error loading crisis plan:', err)
      setHasCrisisPlan(false)
    } finally {
      setLoading(false)
    }
  }

  const loadActiveCrisis = async () => {
    if (!organization) return
    try {
      const { data, error } = await supabase
        .from('crisis_events')
        .select('*')
        .eq('organization_id', organization.id)
        .in('status', ['monitoring', 'active'])
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (data && !error) {
        setActiveCrisis(data)
      } else {
        setActiveCrisis(null)
      }
    } catch (err) {
      console.warn('Crisis check error:', err)
    }
  }

  const calculateElapsedTime = (startedAt: string): string => {
    const start = new Date(startedAt)
    const now = new Date()
    const diffMs = now.getTime() - start.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 60) return `${diffMins}m`
    if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60)
      const mins = diffMins % 60
      return `${hours}h ${mins}m`
    }
    const days = Math.floor(diffMins / 1440)
    const hours = Math.floor((diffMins % 1440) / 60)
    return `${days}d ${hours}h`
  }

  const activateScenario = async (scenarioType: string, scenarioTitle: string) => {
    if (!organization) return
    try {
      const matchedScenario = crisisPlan?.scenarios?.find(s => s.title === scenarioTitle)
      const newCrisis = {
        organization_id: organization.id,
        crisis_type: scenarioType,
        severity: 'medium',
        status: 'active',
        title: scenarioTitle,
        started_at: new Date().toISOString(),
        trigger_source: 'manual',
        timeline: [],
        decisions: [],
        communications: [],
        ai_interactions: [],
        team_status: {},
        tasks: [],
        social_signals: [],
        media_coverage: [],
        stakeholder_sentiment: {},
        metadata: { scenario: matchedScenario }
      }

      const { data, error } = await supabase
        .from('crisis_events')
        .insert(newCrisis)
        .select()
        .single()

      if (data && !error) {
        setActiveCrisis(data)
        setShowScenarioSelector(false)
        setActiveView('protocol')
      }
    } catch (err) {
      console.error('Error activating crisis:', err)
    }
  }

  const deactivateCrisis = async () => {
    if (!activeCrisis) return
    try {
      const { error } = await supabase
        .from('crisis_events')
        .update({ status: 'resolved', resolved_at: new Date().toISOString() })
        .eq('id', activeCrisis.id)

      if (!error) {
        setActiveCrisis(null)
        setShowDeactivateConfirm(false)
        setActiveView('dashboard')
      }
    } catch (err) {
      console.error('Error deactivating crisis:', err)
    }
  }

  const getScenarioTimeline = (scenario: CrisisScenario) => {
    return scenario.timeline || [
      { phase: 'Immediate (0-1 hour)', action: 'Assemble crisis response team', detail: 'Notify CEO, Legal, CISO, PR. Establish war room.' },
      { phase: 'Hour 1-2', action: 'Assess scope and verify facts', detail: 'Determine extent and timeline of incident.' },
      { phase: 'Hour 2-4', action: 'Prepare initial holding statement', detail: 'Draft acknowledgment. Do not speculate.' },
      { phase: 'Hour 4-8', action: 'Notify regulatory bodies', detail: 'File required notifications.' },
      { phase: 'Hour 8-24', action: 'Stakeholder notification', detail: 'Direct outreach to affected parties.' },
      { phase: 'Day 2-7', action: 'Ongoing communications', detail: 'Regular updates. Monitor sentiment.' }
    ]
  }

  // Get tabs - Response Protocol only shows when crisis is active
  const getTabs = () => {
    const baseTabs = [
      { id: 'dashboard', label: 'Dashboard', icon: Activity },
    ]

    if (activeCrisis) {
      baseTabs.push({ id: 'protocol', label: 'Response Protocol', icon: Target })
    }

    baseTabs.push(
      { id: 'timeline', label: 'Timeline', icon: Clock },
      { id: 'team', label: 'Team & Tasks', icon: Users },
      { id: 'communications', label: 'Communications', icon: MessageSquare },
      { id: 'plan', label: 'Crisis Plan', icon: FileText }
    )

    return baseTabs
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--charcoal)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--burnt-orange)]" />
      </div>
    )
  }

  const activeScenario = activeCrisis?.metadata?.scenario

  return (
    <div className="flex flex-col w-full h-full overflow-hidden">
      {/* Status Bar */}
      <div className={`px-6 py-3 flex items-center justify-between ${
        activeCrisis?.status === 'active' ? 'bg-red-600' :
        activeCrisis?.status === 'monitoring' ? 'bg-amber-500' : 'bg-emerald-500'
      }`}>
        <div className="flex items-center gap-3">
          <Shield className={`w-5 h-5 text-white ${activeCrisis?.status === 'active' ? 'animate-pulse' : ''}`} />
          <span className="text-white font-medium text-sm" style={{ fontFamily: 'var(--font-display)' }}>
            {activeCrisis?.status === 'active'
              ? `ACTIVE CRISIS: ${activeCrisis.title} • ${elapsedTime}`
              : activeCrisis?.status === 'monitoring'
              ? `MONITORING: ${activeCrisis.title}`
              : 'NO ACTIVE CRISIS'}
          </span>
        </div>
        <div className="flex gap-3">
          {activeCrisis ? (
            <button
              onClick={() => setShowDeactivateConfirm(true)}
              className="px-4 py-1.5 bg-white rounded-md text-red-600 text-sm font-medium hover:bg-gray-100"
            >
              Resolve Crisis
            </button>
          ) : (
            <button
              onClick={() => setShowScenarioSelector(true)}
              className="px-4 py-1.5 bg-white rounded-md text-red-600 text-sm font-medium hover:bg-gray-100 flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              Activate Crisis Mode
            </button>
          )}
        </div>
      </div>

      {/* Command Center */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[var(--charcoal)]">
        {/* Tabs */}
        <div className="px-6 border-b border-[var(--grey-800)] shrink-0">
          <div className="flex space-x-1">
            {getTabs().map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as any)}
                className={`px-4 py-3 font-medium flex items-center space-x-2 border-b-2 transition-colors ${
                  activeView === tab.id
                    ? 'text-[var(--burnt-orange)] border-[var(--burnt-orange)]'
                    : 'text-[var(--grey-400)] border-transparent hover:text-[var(--grey-300)]'
                }`}
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {/* DASHBOARD */}
          {activeView === 'dashboard' && (
            activeCrisis ? (
              <div className="h-full grid grid-cols-3 gap-6 p-6">
                <div className="space-y-6">
                  <CrisisAIAssistant crisis={activeCrisis} onUpdate={loadActiveCrisis} />
                </div>
                <div className="space-y-6">
                  <div className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>Quick Stats</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[var(--grey-800)]/50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-white">{Object.keys(activeCrisis.team_status || {}).length}</div>
                        <div className="text-sm text-[var(--grey-400)]">Team Active</div>
                      </div>
                      <div className="bg-[var(--grey-800)]/50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-white">{activeCrisis.tasks?.filter((t: any) => t.status === 'completed').length || 0}/{activeCrisis.tasks?.length || 0}</div>
                        <div className="text-sm text-[var(--grey-400)]">Tasks Done</div>
                      </div>
                      <div className="bg-[var(--grey-800)]/50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-white">{activeCrisis.communications?.length || 0}</div>
                        <div className="text-sm text-[var(--grey-400)]">Comms Sent</div>
                      </div>
                      <div className="bg-[var(--grey-800)]/50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-white">{activeCrisis.decisions?.length || 0}</div>
                        <div className="text-sm text-[var(--grey-400)]">Decisions</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>Recent Activity</h3>
                      <button onClick={() => setActiveView('timeline')} className="text-sm text-[var(--burnt-orange)] flex items-center">
                        View All <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      {(activeCrisis.timeline || []).slice(-5).reverse().map((event: any, idx: number) => (
                        <div key={idx} className="flex items-start space-x-3 text-sm">
                          <div className="w-2 h-2 bg-[var(--burnt-orange)] rounded-full mt-2" />
                          <div>
                            <div className="text-[var(--grey-300)]">{event.content}</div>
                            <div className="text-xs text-[var(--grey-500)]">{event.time ? new Date(event.time).toLocaleTimeString() : ''}</div>
                          </div>
                        </div>
                      ))}
                      {(!activeCrisis.timeline?.length) && <div className="text-center py-8 text-[var(--grey-500)]">No activity yet</div>}
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>Social Signals</h3>
                    {(activeCrisis.social_signals?.length || 0) > 0 ? (
                      activeCrisis.social_signals?.slice(-3).map((s: any, i: number) => (
                        <div key={i} className="p-3 bg-[var(--grey-800)]/50 rounded-lg mb-2">
                          <div className="text-sm text-[var(--grey-300)]">{s.summary || s.content?.substring(0, 100)}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-[var(--grey-500)]">No signals detected</div>
                    )}
                  </div>
                  <div className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>Stakeholder Sentiment</h3>
                    {Object.keys(activeCrisis.stakeholder_sentiment || {}).length > 0 ? (
                      Object.entries(activeCrisis.stakeholder_sentiment || {}).map(([group, score]) => (
                        <div key={group} className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-[var(--grey-400)] capitalize">{group}</span>
                            <span className={(score as number) > 50 ? 'text-emerald-400' : 'text-red-400'}>{score as number}%</span>
                          </div>
                          <div className="h-2 bg-[var(--grey-800)] rounded-full">
                            <div className={`h-full rounded-full ${(score as number) > 50 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${score}%` }} />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-[var(--grey-500)]">No sentiment data</div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Shield className="w-16 h-16 text-[var(--grey-600)] mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>No Active Crisis</h3>
                  <p className="text-[var(--grey-400)] mb-6">Your organization is operating normally.</p>
                  <button
                    onClick={() => setShowScenarioSelector(true)}
                    className="px-6 py-3 bg-[var(--burnt-orange)] text-white rounded-lg font-medium hover:brightness-110 flex items-center gap-2 mx-auto"
                  >
                    <AlertTriangle className="w-5 h-5" />
                    Activate Crisis Mode
                  </button>
                </div>
              </div>
            )
          )}

          {/* RESPONSE PROTOCOL - Only when crisis is active */}
          {activeView === 'protocol' && activeCrisis && activeScenario && (
            <div className="h-full p-6">
              <div className="max-w-4xl mx-auto bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl p-6">
                <div className="mb-6">
                  <p className="text-xs text-red-400 uppercase tracking-wider mb-2">ACTIVE RESPONSE PROTOCOL</p>
                  <h2 className="text-xl font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>{activeScenario.title}</h2>
                  <p className="text-sm text-[var(--grey-400)] mt-1">{activeScenario.description}</p>
                </div>

                {/* Timeline */}
                <div className="relative pl-6 mb-8">
                  <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-[var(--grey-700)]" />
                  {getScenarioTimeline(activeScenario).map((item, idx) => (
                    <div key={idx} className="relative mb-4">
                      <div className="absolute -left-4 top-3 w-3 h-3 bg-[var(--burnt-orange)] rounded-full border-2 border-[var(--grey-900)]" />
                      <div className="bg-[var(--grey-800)]/50 rounded-lg p-4">
                        <p className="text-xs text-[var(--burnt-orange)] uppercase mb-1">{item.phase}</p>
                        <p className="text-white font-medium text-sm mb-1">{item.action}</p>
                        <p className="text-xs text-[var(--grey-400)]">{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pre-drafted Comms */}
                <div className="border-t border-[var(--grey-800)] pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Pre-drafted Communications</h3>
                    {!scenarioHasComms(activeScenario.title) && (
                      <button
                        onClick={() => generateCommsForScenario(activeScenario)}
                        disabled={!!generatingComms}
                        className="px-4 py-2 bg-[var(--burnt-orange)] text-white rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
                      >
                        {generatingComms ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                        {generatingComms ? 'Generating...' : 'Generate All Comms'}
                      </button>
                    )}
                  </div>
                  {scenarioHasComms(activeScenario.title) ? (
                    <div className="grid grid-cols-2 gap-3">
                      {getCommsForScenario(activeScenario.title).map((comm) => (
                        <div key={comm.id} className="p-4 bg-[var(--grey-800)]/50 border border-[var(--grey-700)] rounded-lg group hover:border-[var(--burnt-orange)]">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">
                              {comm.metadata?.stakeholder === 'customers' ? '👥' :
                               comm.metadata?.stakeholder === 'employees' ? '💼' :
                               comm.metadata?.stakeholder === 'investors' ? '💰' :
                               comm.metadata?.stakeholder === 'media' ? '📰' :
                               comm.metadata?.stakeholder === 'regulators' ? '⚖️' : '🤝'}
                            </span>
                            <div>
                              <p className="text-xs text-[var(--burnt-orange)] uppercase">{comm.metadata?.stakeholder}</p>
                              <p className="text-sm text-white">{comm.metadata?.channel}</p>
                            </div>
                            {onOpenInStudio && (
                              <button
                                onClick={() => onOpenInStudio({ id: comm.id, title: comm.title, content: comm.content })}
                                className="ml-auto p-1.5 text-[var(--grey-500)] hover:text-[var(--burnt-orange)] opacity-0 group-hover:opacity-100"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-[var(--grey-400)] line-clamp-2">{comm.content.substring(0, 120)}...</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-[var(--grey-800)]/30 rounded-lg">
                      <MessageSquare className="w-10 h-10 text-[var(--grey-600)] mx-auto mb-3" />
                      <p className="text-sm text-[var(--grey-400)]">No pre-drafted communications for this scenario</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TIMELINE */}
          {activeView === 'timeline' && (
            activeCrisis ? (
              <CrisisTimeline crisis={activeCrisis} onUpdate={loadActiveCrisis} />
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-[var(--grey-500)]">No active crisis to show timeline</p>
              </div>
            )
          )}

          {/* TEAM */}
          {activeView === 'team' && (
            activeCrisis ? (
              <CrisisTeamManager crisis={activeCrisis} onUpdate={loadActiveCrisis} />
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-[var(--grey-500)]">No active crisis to manage team</p>
              </div>
            )
          )}

          {/* COMMUNICATIONS */}
          {activeView === 'communications' && (
            activeCrisis ? (
              <CrisisCommunications crisis={activeCrisis} onUpdate={loadActiveCrisis} onOpenInStudio={onOpenInStudio} />
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-[var(--grey-500)]">No active crisis. Activate crisis mode to access communications.</p>
              </div>
            )
          )}

          {/* CRISIS PLAN - Full viewer with edit/regenerate */}
          {activeView === 'plan' && (
            <div className="h-full">
              {hasCrisisPlan ? (
                <div className="h-full flex flex-col">
                  {/* Header with actions */}
                  <div className="px-6 py-4 border-b border-[var(--grey-800)] flex items-center justify-between shrink-0">
                    <div>
                      <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>Crisis Management Plan</h2>
                      <p className="text-sm text-[var(--grey-400)]">{crisisPlan?.industry} • Generated {crisisPlan?.generatedDate || 'Recently'}</p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowPlanGenerator(true)}
                        className="px-4 py-2 bg-[var(--burnt-orange)] hover:brightness-110 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Regenerate Plan
                      </button>
                    </div>
                  </div>
                  {/* Plan content - use CrisisPlanViewer inline */}
                  <div className="flex-1 overflow-auto">
                    <CrisisPlanViewer onClose={() => setActiveView('dashboard')} embedded />
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Shield className="w-16 h-16 text-[var(--grey-600)] mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>No Crisis Plan</h3>
                    <p className="text-[var(--grey-400)] mb-6">Generate a crisis management plan for your organization.</p>
                    <button
                      onClick={() => setShowPlanGenerator(true)}
                      className="px-6 py-3 bg-[var(--burnt-orange)] text-white rounded-lg font-medium hover:brightness-110 flex items-center gap-2 mx-auto"
                    >
                      <Zap className="w-5 h-5" />
                      Generate Crisis Plan
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showPlanGenerator && (
        <CrisisPlanGenerator
          onClose={() => setShowPlanGenerator(false)}
          onPlanGenerated={() => {
            setShowPlanGenerator(false)
            loadCrisisPlan()
            loadPreDraftedComms()
          }}
        />
      )}

      {showScenarioSelector && (
        <CrisisScenarioSelector
          onClose={() => setShowScenarioSelector(false)}
          onScenarioSelected={activateScenario}
        />
      )}

      {showDeactivateConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[var(--charcoal)] border border-zinc-800 rounded-xl p-8 max-w-md">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>Resolve Crisis?</h3>
                <p className="text-[var(--grey-400)]">This will mark the crisis as resolved and archive all data.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDeactivateConfirm(false)} className="flex-1 px-4 py-2 bg-[var(--grey-700)] text-white rounded-lg">Cancel</button>
              <button onClick={deactivateCrisis} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg">Resolve</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
