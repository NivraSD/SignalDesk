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
  XCircle
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
}

export default function CrisisModule() {
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
  const [activeView, setActiveView] = useState<'dashboard' | 'timeline' | 'team' | 'communications' | 'plan'>('dashboard')

  // NIV Chat state
  const [chatMessage, setChatMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([])
  const [chatLoading, setChatLoading] = useState(false)

  // Load crisis plan and check for active crisis
  useEffect(() => {
    if (organization) {
      loadCrisisPlan()
      loadActiveCrisis()
    }
  }, [organization])

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

        // Auto-select first scenario
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
      // No active crisis found
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
        metadata: {}
      }

      const { data, error } = await supabase
        .from('crisis_events')
        .insert(newCrisis)
        .select()
        .single()

      if (data && !error) {
        setActiveCrisis(data)
        setShowScenarioSelector(false)
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
      }
    } catch (err) {
      console.error('Error deactivating crisis:', err)
    }
  }

  const sendChatMessage = async () => {
    if (!chatMessage.trim() || chatLoading || !organization) return

    const userMessage = chatMessage.trim()
    setChatMessage('')
    setChatLoading(true)

    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }])

    try {
      const { data, error } = await supabase.functions.invoke('niv-crisis-consultant', {
        body: {
          message: userMessage,
          organization_name: organization.name,
          conversation_history: chatHistory,
          crisis: activeCrisis,
          crisis_plan: crisisPlan
        }
      })

      if (data?.response) {
        setChatHistory(prev => [...prev, { role: 'assistant', content: data.response }])
      }
    } catch (err) {
      console.error('Chat error:', err)
    } finally {
      setChatLoading(false)
    }
  }

  const quickActions = [
    'Review this plan',
    'Draft new templates',
    'Suggest improvements'
  ]

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

      {/* Main Content - Show Command Center when crisis active, Planning view otherwise */}
      {activeCrisis ? (
        /* ACTIVE CRISIS - Command Center View */
        <div className="flex-1 flex flex-col overflow-hidden bg-[var(--charcoal)]">
          {/* Navigation Tabs */}
          <div className="px-6 border-b border-[var(--grey-800)] shrink-0">
            <div className="flex space-x-1">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: Activity },
                { id: 'timeline', label: 'Timeline', icon: Clock },
                { id: 'team', label: 'Team & Tasks', icon: Users },
                { id: 'communications', label: 'Communications', icon: MessageSquare },
                { id: 'plan', label: 'Crisis Plan', icon: FileText }
              ].map((tab) => (
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
            {activeView === 'dashboard' && (
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
                              {new Date(event.time).toLocaleTimeString()} • {event.actor}
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

            {activeView === 'timeline' && (
              <CrisisTimeline crisis={activeCrisis} onUpdate={loadActiveCrisis} />
            )}

            {activeView === 'team' && (
              <CrisisTeamManager crisis={activeCrisis} onUpdate={loadActiveCrisis} />
            )}

            {activeView === 'communications' && (
              <CrisisCommunications crisis={activeCrisis} onUpdate={loadActiveCrisis} />
            )}

            {activeView === 'plan' && (
              <div className="h-full p-6">
                <button
                  onClick={() => setShowPlanViewer(true)}
                  className="w-full p-8 bg-[var(--grey-800)] hover:bg-[var(--grey-700)] border border-[var(--grey-700)] rounded-xl transition-colors"
                >
                  <FileText className="w-12 h-12 text-[var(--burnt-orange)] mx-auto mb-4" />
                  <div className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>View Crisis Plan</div>
                  <div className="text-sm text-[var(--grey-400)]">Click to open your crisis management plan</div>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* PLANNING MODE - Original 3-Column Layout */
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - White Background */}
          <div className="w-[280px] bg-white border-r border-[var(--grey-200)] flex flex-col shrink-0">
          {/* Crisis Plan Header */}
          <div className="p-5 border-b border-[var(--grey-200)] shrink-0">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[var(--burnt-orange)] rounded-lg flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-[var(--charcoal)] leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
                  Crisis Management Plan
                </h3>
                <p className="text-xs text-[var(--grey-500)] mt-1">
                  {crisisPlan?.industry || organization?.industry || 'Industry'} • {hasCrisisPlan ? 'Ready' : 'Not Generated'}
                </p>
                {crisisPlan?.generatedDate && (
                  <p className="text-xs text-[var(--grey-400)] mt-1">
                    Updated {new Date(crisisPlan.generatedDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto">
            {/* Scenarios List */}
            {hasCrisisPlan && crisisPlan?.scenarios && (
              <div className="p-4">
                <p className="text-xs uppercase tracking-wider text-[var(--grey-500)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                  Prepared Scenarios
                </p>
                <p className="text-xs text-[var(--grey-400)] mb-3">
                  Select a scenario to view response protocol
                </p>

                <div className="space-y-2">
                  {crisisPlan.scenarios.map((scenario, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedScenario(scenario)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedScenario?.title === scenario.title
                          ? 'border-red-500 bg-red-50'
                          : 'border-[var(--grey-200)] hover:border-[var(--burnt-orange)]'
                      }`}
                    >
                      <p className="text-sm font-medium text-[var(--charcoal)]" style={{ fontFamily: 'var(--font-display)' }}>
                        {scenario.title}
                      </p>
                      <p className="text-xs text-[var(--grey-500)] mt-1">
                        {scenario.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Response Team */}
            {hasCrisisPlan && crisisPlan?.crisisTeam && crisisPlan.crisisTeam.length > 0 && (
              <div className="p-4 border-t border-[var(--grey-200)]">
                <p className="text-xs uppercase tracking-wider text-[var(--grey-500)] mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                  Response Team
                </p>
                <div className="space-y-2">
                  {crisisPlan.crisisTeam.slice(0, 3).map((member, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                        style={{ background: idx === 0 ? 'var(--burnt-orange)' : 'var(--grey-400)' }}
                      >
                        {member.name ? member.name.split(' ').map(n => n[0]).join('') : '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--grey-600)] truncate">
                          {member.name || 'Unassigned'}
                        </p>
                        <p className="text-xs text-[var(--grey-400)] truncate">
                          {member.role}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-3 py-2 bg-[var(--grey-200)] rounded-md text-[var(--grey-600)] text-xs font-medium hover:bg-[var(--grey-300)] transition-colors">
                  Manage Team
                </button>
              </div>
            )}

            {/* Emergency Contacts */}
            {hasCrisisPlan && crisisPlan?.emergencyContacts && crisisPlan.emergencyContacts.length > 0 && (
              <div className="p-4 border-t border-[var(--grey-200)]">
                <p className="text-xs uppercase tracking-wider text-[var(--grey-500)] mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                  Emergency Contacts
                </p>
                <div className="space-y-1">
                  {crisisPlan.emergencyContacts.map((contact, idx) => (
                    <p key={idx} className="text-xs text-[var(--grey-600)]">
                      {contact.role}: {contact.phone || contact.email || 'No contact'}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons - Fixed at bottom */}
          <div className="p-4 border-t border-[var(--grey-200)] shrink-0 space-y-2">
            {hasCrisisPlan && (
              <button
                onClick={() => setShowPlanViewer(true)}
                className="w-full py-3 bg-[var(--grey-100)] text-[var(--charcoal)] border border-[var(--grey-300)] rounded-lg text-sm font-medium hover:bg-[var(--grey-200)] transition-all flex items-center justify-center gap-2"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <FileText className="w-4 h-4" />
                View Full Plan
              </button>
            )}
            <button
              onClick={() => setShowPlanGenerator(true)}
              className="w-full py-3 bg-[var(--burnt-orange)] text-white rounded-lg text-sm font-medium hover:brightness-110 transition-all flex items-center justify-center gap-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <Plus className="w-4 h-4" />
              {hasCrisisPlan ? 'Update Plan' : 'Generate New Plan'}
            </button>
          </div>
        </div>

        {/* Center - Scenario Response Protocol */}
        <div className="flex-1 bg-[var(--charcoal)] overflow-y-auto p-6">
          {selectedScenario ? (
            <>
              {/* Scenario Header */}
              <div className="mb-6">
                <p className="text-xs text-[var(--burnt-orange)] uppercase tracking-wider mb-2">
                  SCENARIO RESPONSE PROTOCOL
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                      {selectedScenario.title} Response
                    </h2>
                    <p className="text-sm text-[var(--grey-400)] mt-1">
                      Part of Crisis Management Plan • {selectedScenario.description}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-[var(--grey-800)] text-[var(--grey-300)] rounded-md text-sm font-medium hover:bg-[var(--grey-700)] transition-colors">
                      Edit Plan
                    </button>
                    <button
                      onClick={() => setShowScenarioSelector(true)}
                      className="px-4 py-2 bg-[var(--burnt-orange)] text-white rounded-md text-sm font-medium hover:brightness-110 transition-all"
                    >
                      Run Drill
                    </button>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="relative pl-6">
                {/* Timeline line */}
                <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-[var(--grey-700)]" />

                {getScenarioTimeline(selectedScenario).map((item, idx) => (
                  <div key={idx} className="relative mb-4">
                    {/* Timeline dot */}
                    <div className="absolute -left-4 top-4 w-3 h-3 bg-[var(--burnt-orange)] rounded-full border-2 border-[var(--charcoal)]" />

                    <div className="bg-[var(--grey-900)] rounded-lg p-4">
                      <p className="text-xs text-[var(--burnt-orange)] uppercase tracking-wider mb-2">
                        {item.phase}
                      </p>
                      <p className="text-white font-medium mb-1">
                        {item.action}
                      </p>
                      <p className="text-sm text-[var(--grey-400)]">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pre-drafted Communications */}
              <div className="mt-8 pt-6 border-t border-[var(--grey-800)]">
                <h3 className="text-white font-semibold mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                  Pre-drafted Communications
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { type: 'HOLDING STATEMENT', title: 'Initial Response' },
                    { type: 'EMAIL', title: 'Customer Notification' },
                    { type: 'INTERNAL', title: 'Employee Memo' }
                  ].map((template, idx) => (
                    <button
                      key={idx}
                      className="p-4 bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-lg text-left hover:border-[var(--burnt-orange)] transition-colors"
                    >
                      <p className="text-xs text-[var(--burnt-orange)] mb-1">{template.type}</p>
                      <p className="text-sm text-white">{template.title}</p>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : !hasCrisisPlan ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-[var(--grey-800)] rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-[var(--grey-500)]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                No Crisis Plan Generated
              </h3>
              <p className="text-sm text-[var(--grey-400)] max-w-md mb-6">
                Generate a crisis management plan to prepare response protocols for potential scenarios specific to your organization.
              </p>
              <button
                onClick={() => setShowPlanGenerator(true)}
                className="px-6 py-3 bg-[var(--burnt-orange)] text-white rounded-lg font-medium hover:brightness-110 transition-all flex items-center gap-2"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <Zap className="w-5 h-5" />
                Generate Crisis Plan
              </button>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                <p className="text-[var(--grey-400)]">Select a scenario from the sidebar to view its response protocol</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - NIV Crisis Advisor */}
        <div className="w-80 bg-[var(--charcoal)] border-l border-[var(--grey-800)] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-[var(--grey-800)]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center relative">
                <span className="text-xs font-bold text-[var(--charcoal)]" style={{ fontFamily: 'var(--font-display)' }}>NIV</span>
                <div className="absolute top-0 right-0 w-0 h-0 border-l-[8px] border-l-transparent border-t-[8px] border-t-[var(--burnt-orange)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                  NIV Crisis Advisor
                </p>
                <p className="text-xs text-[var(--grey-500)]">Available 24/7</p>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatHistory.length === 0 ? (
              <div className="flex gap-3">
                <div className="w-7 h-7 bg-[var(--burnt-orange)] rounded-md flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div className="bg-[var(--grey-900)] rounded-xl p-3">
                  <p className="text-sm text-[var(--grey-200)]">
                    I can help you prepare for potential crises. Would you like me to:
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {quickActions.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={() => setChatMessage(action)}
                        className="px-3 py-1.5 bg-[var(--grey-800)] border border-[var(--grey-700)] rounded-full text-xs text-[var(--grey-300)] hover:bg-[var(--grey-700)] transition-colors"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 bg-[var(--burnt-orange)] rounded-md flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-xl p-3 ${
                    msg.role === 'user'
                      ? 'bg-[var(--burnt-orange)] text-white'
                      : 'bg-[var(--grey-900)] text-[var(--grey-200)]'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
            {chatLoading && (
              <div className="flex gap-3">
                <div className="w-7 h-7 bg-[var(--burnt-orange)] rounded-md flex items-center justify-center flex-shrink-0">
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                </div>
                <div className="bg-[var(--grey-900)] rounded-xl p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-[var(--grey-500)] rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-[var(--grey-500)] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-[var(--grey-500)] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-[var(--grey-800)]">
            <div className="flex gap-2 bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-lg p-2 pl-4">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                placeholder="Ask about crisis planning..."
                className="flex-1 bg-transparent text-sm text-white placeholder-[var(--grey-500)] outline-none"
                disabled={chatLoading}
              />
              <button
                onClick={sendChatMessage}
                disabled={!chatMessage.trim() || chatLoading}
                className="w-9 h-9 bg-[var(--burnt-orange)] rounded-lg flex items-center justify-center text-white hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Modals */}
      {showPlanGenerator && (
        <CrisisPlanGenerator
          onClose={() => setShowPlanGenerator(false)}
          onPlanGenerated={() => {
            setShowPlanGenerator(false)
            loadCrisisPlan()
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
                <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>Deactivate Crisis?</h3>
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
                {loading ? 'Deactivating...' : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
