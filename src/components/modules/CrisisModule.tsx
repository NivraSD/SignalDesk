'use client'

import React, { useState, useEffect } from 'react'
import {
  Shield,
  AlertTriangle,
  Plus,
  Clock,
  Users,
  Phone,
  FileText,
  Play,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Settings,
  Zap,
  Send,
  Bot,
  Loader2,
  Activity,
  XCircle,
  RefreshCw,
  Edit3,
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

interface CrisisTeamMember {
  role: string
  title?: string
  name?: string
  contact?: string
  responsibilities?: string[]
}

interface EmergencyContact {
  name: string
  role: string
  phone?: string
  email?: string
}

interface CrisisPlan {
  industry?: string
  purpose?: string
  guidingPrinciples?: string[]
  scenarios?: CrisisScenario[]
  crisisTeam?: CrisisTeamMember[]
  emergencyContacts?: EmergencyContact[]
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
  const [selectedScenario, setSelectedScenario] = useState<CrisisScenario | null>(null)
  const [activeCrisis, setActiveCrisis] = useState<CrisisEvent | null>(null)
  const [showPlanGenerator, setShowPlanGenerator] = useState(false)
  const [showScenarioSelector, setShowScenarioSelector] = useState(false)
  const [showPlanViewer, setShowPlanViewer] = useState(false)
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false)
  const [elapsedTime, setElapsedTime] = useState('')

  // Dynamic tabs based on crisis state
  const [activeView, setActiveView] = useState<'scenarios' | 'plan' | 'communications' | 'dashboard' | 'timeline' | 'team' | 'protocol'>('scenarios')

  // Pre-drafted communications state
  const [preDraftedComms, setPreDraftedComms] = useState<PreDraftedComm[]>([])
  const [loadingComms, setLoadingComms] = useState(false)
  const [generatingComms, setGeneratingComms] = useState<string | null>(null)

  // Load crisis plan and check for active crisis
  useEffect(() => {
    if (organization) {
      loadCrisisPlan()
      loadActiveCrisis()
      loadPreDraftedComms()
    }
  }, [organization])

  // Load pre-drafted communications from Memory Vault
  const loadPreDraftedComms = async () => {
    if (!organization?.id) return

    setLoadingComms(true)
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
    } finally {
      setLoadingComms(false)
    }
  }

  // Get comms for a specific scenario
  const getCommsForScenario = (scenarioTitle: string) => {
    return preDraftedComms.filter(c => c.metadata?.scenario === scenarioTitle)
  }

  // Check if scenario has pre-drafted comms
  const scenarioHasComms = (scenarioTitle: string) => {
    return preDraftedComms.some(c => c.metadata?.scenario === scenarioTitle)
  }

  // Generate communications for a specific scenario
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
    } catch (err: any) {
      console.error('Error generating communications:', err)
    } finally {
      setGeneratingComms(null)
    }
  }

  // Update elapsed time for active crisis
  useEffect(() => {
    if (activeCrisis && activeCrisis.status === 'active') {
      const interval = setInterval(() => {
        setElapsedTime(calculateElapsedTime(activeCrisis.started_at))
      }, 60000)
      setElapsedTime(calculateElapsedTime(activeCrisis.started_at))
      return () => clearInterval(interval)
    }
  }, [activeCrisis])

  // Switch to dashboard when crisis becomes active
  useEffect(() => {
    if (activeCrisis) {
      setActiveView('dashboard')
    }
  }, [activeCrisis])

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

        if (parsedPlan.scenarios?.length > 0) {
          setSelectedScenario(parsedPlan.scenarios[0])
        }
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
        setSelectedScenario(matchedScenario || null)
        setShowScenarioSelector(false)
        setActiveView('protocol') // Switch to protocol view
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
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString()
        })
        .eq('id', activeCrisis.id)

      if (!error) {
        setActiveCrisis(null)
        setShowDeactivateConfirm(false)
        setActiveView('scenarios')
      }
    } catch (err) {
      console.error('Error deactivating crisis:', err)
    }
  }

  // Generate default timeline for scenarios
  const getScenarioTimeline = (scenario: CrisisScenario) => {
    return scenario.timeline || [
      { phase: 'Immediate (0-1 hour)', action: 'Assemble crisis response team', detail: 'Notify CEO, Legal, CISO, PR. Establish war room and communication channel.' },
      { phase: 'Hour 1-2', action: 'Assess scope and verify facts', detail: 'Work with relevant teams to determine extent and timeline of incident.' },
      { phase: 'Hour 2-4', action: 'Prepare initial holding statement', detail: 'Draft acknowledgment statement. Do not speculate on details not yet confirmed.' },
      { phase: 'Hour 4-8', action: 'Notify regulatory bodies', detail: 'File required notifications with relevant authorities (varies by jurisdiction).' },
      { phase: 'Hour 8-24', action: 'Stakeholder notification', detail: 'Direct outreach to affected parties with clear information and next steps.' },
      { phase: 'Day 2-7', action: 'Ongoing communications', detail: 'Regular updates to stakeholders. Monitor media and social sentiment.' }
    ]
  }

  // Define tabs based on crisis state
  const getTabs = () => {
    if (activeCrisis) {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: Activity },
        { id: 'protocol', label: 'Response Protocol', icon: Target },
        { id: 'timeline', label: 'Timeline', icon: Clock },
        { id: 'team', label: 'Team & Tasks', icon: Users },
        { id: 'communications', label: 'Communications', icon: MessageSquare },
        { id: 'plan', label: 'Crisis Plan', icon: FileText }
      ]
    }
    return [
      { id: 'scenarios', label: 'Scenarios', icon: Target },
      { id: 'communications', label: 'Communications', icon: MessageSquare },
      { id: 'plan', label: 'Crisis Plan', icon: FileText }
    ]
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--charcoal)]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--burnt-orange)] mx-auto mb-4" />
          <p className="text-[var(--grey-400)]">Loading crisis module...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full h-full overflow-hidden">
      {/* Crisis Status Bar */}
      <div
        className={`px-6 py-3 flex items-center justify-between ${
          activeCrisis?.status === 'active'
            ? 'bg-red-600'
            : activeCrisis?.status === 'monitoring'
            ? 'bg-amber-500'
            : 'bg-emerald-500'
        }`}
      >
        <div className="flex items-center gap-3">
          <Shield className={`w-5 h-5 text-white ${activeCrisis?.status === 'active' ? 'animate-pulse' : ''}`} />
          <span className="text-white font-medium text-sm" style={{ fontFamily: 'var(--font-display)' }}>
            {activeCrisis?.status === 'active'
              ? `ACTIVE CRISIS: ${activeCrisis.title} • ${elapsedTime}`
              : activeCrisis?.status === 'monitoring'
              ? `MONITORING: ${activeCrisis.title}`
              : 'PLANNING MODE: No active crisis. Prepare and plan your response strategies.'}
          </span>
        </div>
        <div className="flex gap-3">
          {activeCrisis ? (
            <button
              onClick={() => setShowDeactivateConfirm(true)}
              className="px-4 py-1.5 bg-white rounded-md text-red-600 text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Resolve Crisis
            </button>
          ) : (
            <button
              onClick={() => setShowScenarioSelector(true)}
              className="px-4 py-1.5 bg-white rounded-md text-red-600 text-sm font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              Activate Crisis Mode
            </button>
          )}
        </div>
      </div>

      {/* Command Center View */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[var(--charcoal)]">
        {/* Navigation Tabs */}
        <div className="px-6 border-b border-[var(--grey-800)] shrink-0">
          <div className="flex space-x-1">
            {getTabs().map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as any)}
                className={`px-4 py-3 font-medium transition-colors flex items-center space-x-2 border-b-2 ${
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

        {/* Tab Content */}
        <div className="flex-1 overflow-auto">
          {/* SCENARIOS TAB - Show scenario cards with response protocols */}
          {activeView === 'scenarios' && (
            <div className="h-full p-6">
              {!hasCrisisPlan ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-[var(--grey-800)] rounded-full flex items-center justify-center mb-4">
                    <Shield className="w-8 h-8 text-[var(--grey-500)]" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                    No Crisis Plan Generated
                  </h3>
                  <p className="text-sm text-[var(--grey-400)] max-w-md mb-6">
                    Generate a crisis management plan to prepare response protocols for potential scenarios.
                  </p>
                  <button
                    onClick={() => setShowPlanGenerator(true)}
                    className="px-6 py-3 bg-[var(--burnt-orange)] text-white rounded-lg font-medium hover:brightness-110 transition-all flex items-center gap-2"
                  >
                    <Zap className="w-5 h-5" />
                    Generate Crisis Plan
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-6">
                  {/* Scenario List */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                        Prepared Scenarios
                      </h2>
                      <span className="text-sm text-[var(--grey-500)]">{crisisPlan?.scenarios?.length || 0} scenarios</span>
                    </div>
                    <div className="space-y-2">
                      {crisisPlan?.scenarios?.map((scenario, idx) => {
                        const hasComms = scenarioHasComms(scenario.title)
                        const commsCount = getCommsForScenario(scenario.title).length

                        return (
                          <button
                            key={idx}
                            onClick={() => setSelectedScenario(scenario)}
                            className={`w-full text-left p-4 rounded-lg border transition-all ${
                              selectedScenario?.title === scenario.title
                                ? 'border-[var(--burnt-orange)] bg-[var(--burnt-orange)]/10'
                                : 'border-[var(--grey-800)] bg-[var(--grey-900)] hover:border-[var(--grey-700)]'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white" style={{ fontFamily: 'var(--font-display)' }}>
                                  {scenario.title}
                                </p>
                                <p className="text-xs text-[var(--grey-500)] mt-1 line-clamp-2">
                                  {scenario.description}
                                </p>
                              </div>
                              {hasComms ? (
                                <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium shrink-0">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>{commsCount}</span>
                                </div>
                              ) : (
                                <div className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full text-xs font-medium shrink-0">
                                  No comms
                                </div>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Scenario Response Protocol */}
                  <div className="col-span-2">
                    {selectedScenario ? (
                      <div className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl p-6">
                        <div className="mb-6">
                          <p className="text-xs text-[var(--burnt-orange)] uppercase tracking-wider mb-2">
                            SCENARIO RESPONSE PROTOCOL
                          </p>
                          <h2 className="text-xl font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                            {selectedScenario.title}
                          </h2>
                          <p className="text-sm text-[var(--grey-400)] mt-1">
                            {selectedScenario.description}
                          </p>
                        </div>

                        {/* Timeline */}
                        <div className="relative pl-6 mb-8">
                          <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-[var(--grey-700)]" />
                          {getScenarioTimeline(selectedScenario).map((item, idx) => (
                            <div key={idx} className="relative mb-4 last:mb-0">
                              <div className="absolute -left-4 top-3 w-3 h-3 bg-[var(--burnt-orange)] rounded-full border-2 border-[var(--grey-900)]" />
                              <div className="bg-[var(--grey-800)]/50 rounded-lg p-4">
                                <p className="text-xs text-[var(--burnt-orange)] uppercase tracking-wider mb-1">
                                  {item.phase}
                                </p>
                                <p className="text-white font-medium text-sm mb-1">
                                  {item.action}
                                </p>
                                <p className="text-xs text-[var(--grey-400)]">
                                  {item.detail}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Pre-drafted Communications */}
                        <div className="border-t border-[var(--grey-800)] pt-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                              Pre-drafted Communications
                            </h3>
                            {!scenarioHasComms(selectedScenario.title) && (
                              <button
                                onClick={() => generateCommsForScenario(selectedScenario)}
                                disabled={!!generatingComms}
                                className="px-4 py-2 bg-[var(--burnt-orange)] hover:brightness-110 disabled:opacity-50 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all"
                              >
                                {generatingComms === selectedScenario.title ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <Zap className="w-4 h-4" />
                                    Generate All Comms
                                  </>
                                )}
                              </button>
                            )}
                          </div>

                          {scenarioHasComms(selectedScenario.title) ? (
                            <div className="grid grid-cols-2 gap-3">
                              {getCommsForScenario(selectedScenario.title).map((comm) => {
                                const stakeholderIcons: Record<string, string> = {
                                  customers: '👥',
                                  employees: '💼',
                                  investors: '💰',
                                  media: '📰',
                                  regulators: '⚖️',
                                  partners: '🤝'
                                }
                                const stakeholder = comm.metadata?.stakeholder || 'general'

                                return (
                                  <div
                                    key={comm.id}
                                    className="p-4 bg-[var(--grey-800)]/50 border border-[var(--grey-700)] rounded-lg hover:border-[var(--burnt-orange)] transition-colors group"
                                  >
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-lg">{stakeholderIcons[stakeholder] || '📄'}</span>
                                        <div>
                                          <p className="text-xs text-[var(--burnt-orange)] uppercase">
                                            {stakeholder}
                                          </p>
                                          <p className="text-sm text-white font-medium">
                                            {comm.metadata?.channel || 'Communication'}
                                          </p>
                                        </div>
                                      </div>
                                      {onOpenInStudio && (
                                        <button
                                          onClick={() => onOpenInStudio({
                                            id: comm.id,
                                            title: comm.title,
                                            content: comm.content
                                          })}
                                          className="p-1.5 text-[var(--grey-500)] hover:text-[var(--burnt-orange)] opacity-0 group-hover:opacity-100 transition-all"
                                          title="Edit in Studio"
                                        >
                                          <FileText className="w-4 h-4" />
                                        </button>
                                      )}
                                    </div>
                                    <p className="text-xs text-[var(--grey-400)] line-clamp-2">
                                      {comm.content.substring(0, 120)}...
                                    </p>
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            <div className="text-center py-8 bg-[var(--grey-800)]/30 rounded-lg border border-[var(--grey-700)]">
                              <MessageSquare className="w-10 h-10 text-[var(--grey-600)] mx-auto mb-3" />
                              <p className="text-sm text-[var(--grey-400)]">No communications drafted yet</p>
                              <p className="text-xs text-[var(--grey-500)]">
                                Click "Generate All Comms" to create templates
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-[var(--grey-500)]">Select a scenario to view its response protocol</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PROTOCOL TAB - Active crisis scenario response */}
          {activeView === 'protocol' && activeCrisis && (
            <div className="h-full p-6">
              <div className="max-w-4xl mx-auto">
                <div className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl p-6">
                  <div className="mb-6">
                    <p className="text-xs text-red-400 uppercase tracking-wider mb-2">
                      ACTIVE RESPONSE PROTOCOL
                    </p>
                    <h2 className="text-xl font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                      {activeCrisis.title}
                    </h2>
                    <p className="text-sm text-[var(--grey-400)] mt-1">
                      {selectedScenario?.description || 'Crisis response in progress'}
                    </p>
                  </div>

                  {/* Timeline */}
                  {selectedScenario && (
                    <div className="relative pl-6 mb-8">
                      <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-[var(--grey-700)]" />
                      {getScenarioTimeline(selectedScenario).map((item, idx) => (
                        <div key={idx} className="relative mb-4 last:mb-0">
                          <div className="absolute -left-4 top-3 w-3 h-3 bg-[var(--burnt-orange)] rounded-full border-2 border-[var(--grey-900)]" />
                          <div className="bg-[var(--grey-800)]/50 rounded-lg p-4">
                            <p className="text-xs text-[var(--burnt-orange)] uppercase tracking-wider mb-1">
                              {item.phase}
                            </p>
                            <p className="text-white font-medium text-sm mb-1">
                              {item.action}
                            </p>
                            <p className="text-xs text-[var(--grey-400)]">
                              {item.detail}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pre-drafted Communications */}
                  {selectedScenario && (
                    <div className="border-t border-[var(--grey-800)] pt-6">
                      <h3 className="text-white font-semibold mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                        Pre-drafted Communications
                      </h3>
                      {scenarioHasComms(selectedScenario.title) ? (
                        <div className="grid grid-cols-2 gap-3">
                          {getCommsForScenario(selectedScenario.title).map((comm) => {
                            const stakeholderIcons: Record<string, string> = {
                              customers: '👥',
                              employees: '💼',
                              investors: '💰',
                              media: '📰',
                              regulators: '⚖️',
                              partners: '🤝'
                            }
                            const stakeholder = comm.metadata?.stakeholder || 'general'

                            return (
                              <div
                                key={comm.id}
                                className="p-4 bg-[var(--grey-800)]/50 border border-[var(--grey-700)] rounded-lg hover:border-[var(--burnt-orange)] transition-colors group"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">{stakeholderIcons[stakeholder] || '📄'}</span>
                                    <div>
                                      <p className="text-xs text-[var(--burnt-orange)] uppercase">
                                        {stakeholder}
                                      </p>
                                      <p className="text-sm text-white font-medium">
                                        {comm.metadata?.channel || 'Communication'}
                                      </p>
                                    </div>
                                  </div>
                                  {onOpenInStudio && (
                                    <button
                                      onClick={() => onOpenInStudio({
                                        id: comm.id,
                                        title: comm.title,
                                        content: comm.content
                                      })}
                                      className="p-1.5 text-[var(--grey-500)] hover:text-[var(--burnt-orange)] opacity-0 group-hover:opacity-100 transition-all"
                                      title="Edit in Studio"
                                    >
                                      <FileText className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                                <p className="text-xs text-[var(--grey-400)] line-clamp-2">
                                  {comm.content.substring(0, 120)}...
                                </p>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-[var(--grey-800)]/30 rounded-lg border border-[var(--grey-700)]">
                          <MessageSquare className="w-10 h-10 text-[var(--grey-600)] mx-auto mb-3" />
                          <p className="text-sm text-[var(--grey-400)]">No pre-drafted communications for this scenario</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* DASHBOARD TAB - Only when crisis is active */}
          {activeView === 'dashboard' && activeCrisis && (
            <div className="h-full grid grid-cols-3 gap-6 p-6">
              {/* Left Column: AI Assistant */}
              <div className="space-y-6">
                <CrisisAIAssistant crisis={activeCrisis} onUpdate={loadActiveCrisis} />
              </div>

              {/* Center Column: Key Metrics & Timeline Preview */}
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>Quick Stats</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[var(--grey-800)]/50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-white">{activeCrisis.team_status ? Object.keys(activeCrisis.team_status).length : 0}</div>
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

                {/* Recent Timeline */}
                <div className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>Recent Activity</h3>
                    <button
                      onClick={() => setActiveView('timeline')}
                      className="text-sm text-[var(--burnt-orange)] hover:brightness-110 flex items-center space-x-1"
                    >
                      <span>View All</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {(activeCrisis.timeline || []).slice(-5).reverse().map((event: any, idx: number) => (
                      <div key={idx} className="flex items-start space-x-3 text-sm">
                        <div className="w-2 h-2 bg-[var(--burnt-orange)] rounded-full mt-2" />
                        <div className="flex-1">
                          <div className="text-[var(--grey-300)]">{event.content}</div>
                          <div className="text-xs text-[var(--grey-500)] mt-1">
                            {event.time ? new Date(event.time).toLocaleTimeString() : 'Unknown time'} • {event.actor || 'System'}
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!activeCrisis.timeline || activeCrisis.timeline.length === 0) && (
                      <div className="text-center py-8 text-[var(--grey-500)]">No activity yet</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Social Signals & Sentiment */}
              <div className="space-y-6">
                {/* Social Signals */}
                <div className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>Social Signals</h3>
                  <div className="space-y-3">
                    {(activeCrisis.social_signals || []).slice(-3).map((signal: any, idx: number) => (
                      <div key={idx} className="p-3 bg-[var(--grey-800)]/50 rounded-lg">
                        <div className="text-sm text-[var(--grey-300)]">{signal.summary || signal.content?.substring(0, 100)}</div>
                        <div className="text-xs text-[var(--grey-500)] mt-2">{signal.platform}</div>
                      </div>
                    ))}
                    {(!activeCrisis.social_signals || activeCrisis.social_signals.length === 0) && (
                      <div className="text-center py-8 text-[var(--grey-500)]">No signals detected</div>
                    )}
                  </div>
                </div>

                {/* Stakeholder Sentiment */}
                <div className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>Stakeholder Sentiment</h3>
                  <div className="space-y-3">
                    {Object.entries(activeCrisis.stakeholder_sentiment || {}).map(([group, score]) => (
                      <div key={group}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-[var(--grey-400)] capitalize">{group}</span>
                          <span className={(score as number) > 50 ? 'text-emerald-400' : (score as number) > 30 ? 'text-amber-400' : 'text-red-400'}>
                            {score as number}%
                          </span>
                        </div>
                        <div className="h-2 bg-[var(--grey-800)] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              (score as number) > 50 ? 'bg-emerald-500' : (score as number) > 30 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    {Object.keys(activeCrisis.stakeholder_sentiment || {}).length === 0 && (
                      <div className="text-center py-8 text-[var(--grey-500)]">No sentiment data</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TIMELINE TAB */}
          {activeView === 'timeline' && activeCrisis && (
            <CrisisTimeline crisis={activeCrisis} onUpdate={loadActiveCrisis} />
          )}

          {/* TEAM TAB */}
          {activeView === 'team' && activeCrisis && (
            <CrisisTeamManager crisis={activeCrisis} onUpdate={loadActiveCrisis} />
          )}

          {/* COMMUNICATIONS TAB */}
          {activeView === 'communications' && (
            activeCrisis ? (
              <CrisisCommunications
                crisis={activeCrisis}
                onUpdate={loadActiveCrisis}
                onOpenInStudio={onOpenInStudio}
              />
            ) : (
              <div className="h-full p-6">
                <div className="max-w-4xl mx-auto">
                  <h2 className="text-xl font-bold text-white mb-6" style={{ fontFamily: 'var(--font-display)' }}>
                    Pre-drafted Communications
                  </h2>
                  {loadingComms ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-[var(--burnt-orange)]" />
                    </div>
                  ) : preDraftedComms.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {preDraftedComms.map((comm) => {
                        const stakeholderIcons: Record<string, string> = {
                          customers: '👥',
                          employees: '💼',
                          investors: '💰',
                          media: '📰',
                          regulators: '⚖️',
                          partners: '🤝'
                        }
                        const stakeholder = comm.metadata?.stakeholder || 'general'

                        return (
                          <div
                            key={comm.id}
                            className="p-4 bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-lg hover:border-[var(--burnt-orange)] transition-colors group"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{stakeholderIcons[stakeholder] || '📄'}</span>
                                <div>
                                  <p className="text-xs text-[var(--burnt-orange)] uppercase">
                                    {comm.metadata?.scenario || 'General'}
                                  </p>
                                  <p className="text-sm text-white font-medium capitalize">
                                    {stakeholder} • {comm.metadata?.channel || 'Communication'}
                                  </p>
                                </div>
                              </div>
                              {onOpenInStudio && (
                                <button
                                  onClick={() => onOpenInStudio({
                                    id: comm.id,
                                    title: comm.title,
                                    content: comm.content
                                  })}
                                  className="p-1.5 text-[var(--grey-500)] hover:text-[var(--burnt-orange)] opacity-0 group-hover:opacity-100 transition-all"
                                  title="Edit in Studio"
                                >
                                  <FileText className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            <p className="text-xs text-[var(--grey-400)] line-clamp-2">
                              {comm.content.substring(0, 150)}...
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-[var(--grey-900)] rounded-xl border border-[var(--grey-800)]">
                      <MessageSquare className="w-12 h-12 text-[var(--grey-600)] mx-auto mb-4" />
                      <p className="text-[var(--grey-400)] mb-2">No pre-drafted communications yet</p>
                      <p className="text-sm text-[var(--grey-500)]">
                        Generate communications from the Scenarios tab
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          )}

          {/* PLAN TAB */}
          {activeView === 'plan' && (
            <div className="h-full p-6">
              <div className="max-w-4xl mx-auto">
                {hasCrisisPlan ? (
                  <div className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                          Crisis Management Plan
                        </h2>
                        <p className="text-sm text-[var(--grey-400)] mt-1">
                          {crisisPlan?.industry} • Generated {crisisPlan?.generatedDate || 'Recently'}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowPlanViewer(true)}
                          className="px-4 py-2 bg-[var(--grey-800)] hover:bg-[var(--grey-700)] text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                          View Full Plan
                        </button>
                        <button
                          onClick={() => setShowPlanGenerator(true)}
                          className="px-4 py-2 bg-[var(--burnt-orange)] hover:brightness-110 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Regenerate
                        </button>
                      </div>
                    </div>

                    {/* Plan Summary */}
                    <div className="grid grid-cols-3 gap-6 mb-6">
                      <div className="bg-[var(--grey-800)]/50 rounded-lg p-4">
                        <div className="text-3xl font-bold text-[var(--burnt-orange)]">{crisisPlan?.scenarios?.length || 0}</div>
                        <div className="text-sm text-[var(--grey-400)]">Scenarios</div>
                      </div>
                      <div className="bg-[var(--grey-800)]/50 rounded-lg p-4">
                        <div className="text-3xl font-bold text-[var(--burnt-orange)]">{crisisPlan?.crisisTeam?.length || 0}</div>
                        <div className="text-sm text-[var(--grey-400)]">Team Members</div>
                      </div>
                      <div className="bg-[var(--grey-800)]/50 rounded-lg p-4">
                        <div className="text-3xl font-bold text-[var(--burnt-orange)]">{preDraftedComms.length}</div>
                        <div className="text-sm text-[var(--grey-400)]">Pre-drafted Comms</div>
                      </div>
                    </div>

                    {/* Purpose */}
                    {crisisPlan?.purpose && (
                      <div className="mb-6">
                        <h3 className="text-sm font-semibold text-[var(--grey-400)] uppercase tracking-wider mb-2">Purpose</h3>
                        <p className="text-[var(--grey-300)]">{crisisPlan.purpose}</p>
                      </div>
                    )}

                    {/* Guiding Principles */}
                    {crisisPlan?.guidingPrinciples && crisisPlan.guidingPrinciples.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-[var(--grey-400)] uppercase tracking-wider mb-2">Guiding Principles</h3>
                        <ul className="space-y-2">
                          {crisisPlan.guidingPrinciples.map((principle, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-[var(--grey-300)]">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                              <span>{principle}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-[var(--grey-900)] rounded-xl border border-[var(--grey-800)]">
                    <Shield className="w-16 h-16 text-[var(--grey-600)] mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                      No Crisis Plan Generated
                    </h3>
                    <p className="text-sm text-[var(--grey-400)] max-w-md mx-auto mb-6">
                      Generate a comprehensive crisis management plan tailored to your organization.
                    </p>
                    <button
                      onClick={() => setShowPlanGenerator(true)}
                      className="px-6 py-3 bg-[var(--burnt-orange)] text-white rounded-lg font-medium hover:brightness-110 transition-all flex items-center gap-2 mx-auto"
                    >
                      <Zap className="w-5 h-5" />
                      Generate Crisis Plan
                    </button>
                  </div>
                )}
              </div>
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

      {showPlanViewer && (
        <CrisisPlanViewer onClose={() => setShowPlanViewer(false)} />
      )}

      {/* Deactivate Confirmation Dialog */}
      {showDeactivateConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[var(--charcoal)] border border-zinc-800 rounded-xl p-8 max-w-md">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>Resolve Crisis?</h3>
                <p className="text-[var(--grey-400)]">
                  This will mark the crisis as resolved and archive all data. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeactivateConfirm(false)}
                className="flex-1 px-4 py-2 bg-[var(--grey-700)] hover:bg-[var(--grey-600)] text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deactivateCrisis}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                Resolve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
