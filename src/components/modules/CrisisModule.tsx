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
  const [activeView, setActiveView] = useState<'dashboard' | 'protocol' | 'timeline' | 'team' | 'communications' | 'plan' | 'alerts'>('dashboard')

  // Pre-drafted communications
  const [preDraftedComms, setPreDraftedComms] = useState<PreDraftedComm[]>([])
  const [generatingComms, setGeneratingComms] = useState<string | null>(null)

  // Detected crisis alerts (not yet activated)
  const [potentialCrisisAlerts, setPotentialCrisisAlerts] = useState<any[]>([])

  useEffect(() => {
    if (organization) {
      loadCrisisPlan()
      loadActiveCrisis()
      loadPreDraftedComms()
      checkForPotentialCrisis()
    }
  }, [organization])

  // Poll for potential crisis alerts every 30 seconds
  useEffect(() => {
    if (organization && !activeCrisis) {
      const interval = setInterval(() => {
        checkForPotentialCrisis()
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [organization, activeCrisis])

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
      // Simple query - get content from Crisis folder
      const { data, error } = await supabase
        .from('content_library')
        .select('id, title, content, folder, metadata')
        .eq('organization_id', organization.id)
        .like('folder', 'Crisis/%')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Query error:', error)
      }

      if (data) {
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

  // Check for potential crisis alerts (monitoring status)
  const checkForPotentialCrisis = async () => {
    if (!organization) return

    try {
      const alerts: any[] = []
      const oneDayAgo = new Date()
      oneDayAgo.setHours(oneDayAgo.getHours() - 24)

      // Check crisis_events table for 'monitoring' status
      const { data: monitoringCrises, error: crisisError } = await supabase
        .from('crisis_events')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('status', 'monitoring')
        .gte('started_at', oneDayAgo.toISOString())
        .order('started_at', { ascending: false })
        .limit(10)

      if (monitoringCrises && !crisisError) {
        monitoringCrises.forEach(crisis => {
          const warningSignals = crisis.trigger_data?.warning_signals || []
          alerts.push({
            severity: crisis.severity,
            title: crisis.title,
            summary: crisis.description || `${warningSignals.join(', ')}`,
            category: 'crisis',
            type: 'crisis_detection',
            detected_at: crisis.started_at,
            crisis_id: crisis.id,
            risk_level: crisis.trigger_data?.risk_level || 0,
            signals: warningSignals,
            trigger_data: crisis.trigger_data
          })
        })
      }

      setPotentialCrisisAlerts(alerts)
    } catch (err) {
      console.error('Error checking for potential crisis:', err)
    }
  }

  // Classify scenario type based on alert content
  const classifyScenarioType = (alert: any): { type: string; label: string } => {
    const content = `${alert.title || ''} ${alert.summary || ''} ${(alert.signals || alert.warning_signals || []).join(' ')}`.toLowerCase()

    if (content.includes('data breach') || content.includes('cyber') || content.includes('hack') || content.includes('security incident')) {
      return { type: 'data_breach', label: 'Data Breach / Cyber Attack' }
    }
    if (content.includes('lawsuit') || content.includes('litigation') || content.includes('legal') || content.includes('regulatory')) {
      return { type: 'legal', label: 'Legal / Regulatory Issue' }
    }
    if (content.includes('product recall') || content.includes('defect') || content.includes('safety')) {
      return { type: 'product_recall', label: 'Product Safety / Recall' }
    }
    if (content.includes('executive') || content.includes('ceo') || content.includes('leadership') || content.includes('misconduct')) {
      return { type: 'leadership', label: 'Leadership / Executive Crisis' }
    }
    if (content.includes('financial') || content.includes('earnings') || content.includes('fraud') || content.includes('accounting')) {
      return { type: 'financial', label: 'Financial Crisis' }
    }
    if (content.includes('environmental') || content.includes('pollution') || content.includes('climate') || content.includes('spill')) {
      return { type: 'environmental', label: 'Environmental Issue' }
    }
    if (content.includes('layoff') || content.includes('workforce') || content.includes('employee') || content.includes('workplace')) {
      return { type: 'workforce', label: 'Workforce / HR Crisis' }
    }
    if (content.includes('supply chain') || content.includes('supplier') || content.includes('shortage')) {
      return { type: 'supply_chain', label: 'Supply Chain Disruption' }
    }
    if (content.includes('reputation') || content.includes('social media') || content.includes('viral') || content.includes('backlash')) {
      return { type: 'reputation', label: 'Reputation Crisis' }
    }
    return { type: 'other', label: 'General Crisis Alert' }
  }

  // Activate crisis from a specific detected alert
  const activateCrisisFromAlert = async (alert: any) => {
    if (!organization) return

    const scenarioType = classifyScenarioType(alert)
    const articles = alert.trigger_data?.articles || []

    setLoading(true)
    try {
      // Update existing crisis_event from 'monitoring' to 'active'
      if (alert.crisis_id) {
        const { data, error } = await supabase
          .from('crisis_events')
          .update({
            status: 'active',
            crisis_type: scenarioType.type,
            timeline: [{
              time: new Date().toISOString(),
              event_type: 'activation',
              content: `Crisis mode activated from detected alert: ${alert.title}`,
              actor: 'user'
            }]
          })
          .eq('id', alert.crisis_id)
          .select()
          .single()

        if (!error && data) {
          setActiveCrisis(data)
          setPotentialCrisisAlerts(prev => prev.filter(a => a.crisis_id !== alert.crisis_id))
          setActiveView('dashboard')
          return
        }
      }

      // Create new crisis event if no existing one
      const newCrisis = {
        organization_id: organization.id,
        crisis_type: scenarioType.type,
        severity: alert.severity === 'critical' ? 'high' : 'medium',
        status: 'active',
        title: alert.title || scenarioType.label,
        description: alert.summary,
        started_at: new Date().toISOString(),
        trigger_source: 'detected_alert',
        trigger_data: {
          original_alert: alert,
          articles: articles,
          risk_level: alert.risk_level,
          warning_signals: alert.signals || []
        },
        timeline: [{
          time: new Date().toISOString(),
          event_type: 'activation',
          content: `Crisis mode activated from detected alert`,
          actor: 'user'
        }],
        decisions: [],
        communications: [],
        ai_interactions: [],
        team_status: {},
        tasks: [],
        social_signals: [],
        media_coverage: articles.map((a: any) => ({ title: a.title, url: a.url, source: 'detected' })),
        stakeholder_sentiment: {},
        metadata: { scenario_type: scenarioType }
      }

      const { data, error } = await supabase
        .from('crisis_events')
        .insert(newCrisis)
        .select()
        .single()

      if (!error && data) {
        setActiveCrisis(data)
        setPotentialCrisisAlerts(prev => prev.filter(a => a !== alert))
        setActiveView('dashboard')
      }
    } catch (err) {
      console.error('Error activating crisis from alert:', err)
    } finally {
      setLoading(false)
    }
  }

  // Dismiss an alert
  const dismissAlert = async (alert: any) => {
    if (alert.crisis_id) {
      await supabase
        .from('crisis_events')
        .update({ status: 'resolved', resolved_at: new Date().toISOString() })
        .eq('id', alert.crisis_id)
    }
    setPotentialCrisisAlerts(prev => prev.filter(a => a !== alert))
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

  // Tabs - always the same, never changes
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'protocol', label: 'Response Protocol', icon: Target },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'team', label: 'Team & Tasks', icon: Users },
    { id: 'communications', label: 'Communications', icon: MessageSquare },
    { id: 'plan', label: 'Crisis Plan', icon: FileText }
  ]

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
            {tabs.map((tab) => (
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
          {/* DASHBOARD - Always same layout */}
          {activeView === 'dashboard' && (
            <div className="h-full grid grid-cols-3 gap-6 p-6">
              <div className="space-y-6">
                <CrisisAIAssistant crisis={activeCrisis} onUpdate={loadActiveCrisis} />
              </div>
              <div className="space-y-6">
                <div className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>Quick Stats</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[var(--grey-800)]/50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-white">{Object.keys(activeCrisis?.team_status || {}).length}</div>
                      <div className="text-sm text-[var(--grey-400)]">Team Active</div>
                    </div>
                    <div className="bg-[var(--grey-800)]/50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-white">{activeCrisis?.tasks?.filter((t: any) => t.status === 'completed').length || 0}/{activeCrisis?.tasks?.length || 0}</div>
                      <div className="text-sm text-[var(--grey-400)]">Tasks Done</div>
                    </div>
                    <div className="bg-[var(--grey-800)]/50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-white">{activeCrisis?.communications?.length || 0}</div>
                      <div className="text-sm text-[var(--grey-400)]">Comms Sent</div>
                    </div>
                    <div className="bg-[var(--grey-800)]/50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-white">{activeCrisis?.decisions?.length || 0}</div>
                      <div className="text-sm text-[var(--grey-400)]">Decisions</div>
                    </div>
                  </div>
                </div>
                <div className={`bg-[var(--grey-900)] border ${potentialCrisisAlerts.length > 0 ? 'border-red-500/50' : 'border-[var(--grey-800)]'} rounded-xl p-6`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {potentialCrisisAlerts.length > 0 && (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-red-500/20">
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>Recent Activity</h3>
                        {potentialCrisisAlerts.length > 0 && (
                          <p className="text-xs text-red-400">{potentialCrisisAlerts.length} alert{potentialCrisisAlerts.length !== 1 ? 's' : ''} detected</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveView(potentialCrisisAlerts.length > 0 ? 'alerts' : 'timeline')}
                      className="text-sm text-[var(--burnt-orange)] flex items-center"
                    >
                      View All <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {/* Show detected alerts first if any */}
                    {potentialCrisisAlerts.length > 0 ? (
                      <>
                        {potentialCrisisAlerts.slice(0, 3).map((alert, idx) => {
                          const scenarioType = classifyScenarioType(alert)
                          const articles = alert.trigger_data?.articles || []
                          const riskLevel = alert.risk_level || 0

                          return (
                            <div key={idx} className="bg-[var(--grey-800)]/50 rounded-lg p-3 border border-[var(--grey-700)]">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm ${alert.severity === 'critical' ? 'text-red-500' : 'text-orange-500'}`}>
                                    {alert.severity === 'critical' ? '🔴' : '🟠'}
                                  </span>
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--grey-700)] text-[var(--grey-300)]">
                                    {scenarioType.label}
                                  </span>
                                  <span className="text-xs text-[var(--grey-500)]">Risk: {riskLevel}/10</span>
                                </div>
                                <button onClick={() => dismissAlert(alert)} className="text-[var(--grey-500)] hover:text-[var(--grey-300)] text-xs">
                                  Dismiss
                                </button>
                              </div>
                              <h4 className="text-white font-semibold text-sm mb-1">{alert.title}</h4>
                              <p className="text-xs text-[var(--grey-400)] mb-2 line-clamp-2">{alert.summary}</p>
                              {articles.length > 0 && (
                                <div className="mb-2 space-y-1">
                                  {articles.slice(0, 2).map((article: any, aIdx: number) => (
                                    <div key={aIdx} className="bg-[var(--grey-900)]/50 p-2 rounded">
                                      {article.crisis_signal && (
                                        <p className="text-xs text-red-400 mb-1">⚠️ {article.crisis_signal}</p>
                                      )}
                                      <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline truncate block">
                                        {article.title || article.url}
                                      </a>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-[var(--grey-500)]">
                                  {alert.detected_at ? new Date(alert.detected_at).toLocaleString() : 'Recently'}
                                </span>
                                <button
                                  onClick={() => activateCrisisFromAlert(alert)}
                                  className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded flex items-center gap-1"
                                >
                                  <Shield className="w-3 h-3" />
                                  Activate
                                </button>
                              </div>
                            </div>
                          )
                        })}
                        {potentialCrisisAlerts.length > 3 && (
                          <button onClick={() => setActiveView('alerts')} className="w-full text-center text-sm text-[var(--grey-400)] hover:text-[var(--grey-300)]">
                            View {potentialCrisisAlerts.length - 3} more alert{potentialCrisisAlerts.length - 3 !== 1 ? 's' : ''}
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        {(activeCrisis?.timeline || []).slice(-5).reverse().map((event: any, idx: number) => (
                          <div key={idx} className="flex items-start space-x-3 text-sm">
                            <div className="w-2 h-2 bg-[var(--burnt-orange)] rounded-full mt-2" />
                            <div>
                              <div className="text-[var(--grey-300)]">{event.content}</div>
                              <div className="text-xs text-[var(--grey-500)]">{event.time ? new Date(event.time).toLocaleTimeString() : ''}</div>
                            </div>
                          </div>
                        ))}
                        {(!activeCrisis?.timeline?.length) && <div className="text-center py-8 text-[var(--grey-500)]">No activity yet</div>}
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>Social Signals</h3>
                  {(activeCrisis?.social_signals?.length || 0) > 0 ? (
                    activeCrisis?.social_signals?.slice(-3).map((s: any, i: number) => (
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
                  {Object.keys(activeCrisis?.stakeholder_sentiment || {}).length > 0 ? (
                    Object.entries(activeCrisis?.stakeholder_sentiment || {}).map(([group, score]) => (
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
          )}

          {/* RESPONSE PROTOCOL - Shows scenario when crisis active, otherwise empty state */}
          {activeView === 'protocol' && (
            activeCrisis && activeScenario ? (
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
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Target className="w-16 h-16 text-[var(--grey-600)] mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>No Active Response Protocol</h3>
                  <p className="text-[var(--grey-400)] mb-6">Activate a crisis scenario to see the response protocol.</p>
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

          {/* TIMELINE */}
          {activeView === 'timeline' && (
            <CrisisTimeline crisis={activeCrisis} onUpdate={loadActiveCrisis} />
          )}

          {/* TEAM */}
          {activeView === 'team' && (
            <CrisisTeamManager crisis={activeCrisis} onUpdate={loadActiveCrisis} />
          )}

          {/* COMMUNICATIONS */}
          {activeView === 'communications' && (
            <CrisisCommunications crisis={activeCrisis} onUpdate={loadActiveCrisis} onOpenInStudio={onOpenInStudio} />
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

          {/* ALERTS VIEW - All detected crisis alerts */}
          {activeView === 'alerts' && (
            <div className="h-full p-6">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>Detected Crisis Alerts</h2>
                    <p className="text-sm text-[var(--grey-400)]">{potentialCrisisAlerts.length} alert{potentialCrisisAlerts.length !== 1 ? 's' : ''} requiring attention</p>
                  </div>
                  <button
                    onClick={() => setActiveView('dashboard')}
                    className="px-4 py-2 bg-[var(--grey-700)] hover:bg-[var(--grey-600)] text-white rounded-lg text-sm"
                  >
                    Back to Dashboard
                  </button>
                </div>

                {potentialCrisisAlerts.length === 0 ? (
                  <div className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl p-12 text-center">
                    <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-white mb-2">No Active Alerts</h3>
                    <p className="text-[var(--grey-400)]">No potential crisis situations detected in the last 24 hours.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {potentialCrisisAlerts.map((alert, idx) => {
                      const scenarioType = classifyScenarioType(alert)
                      const articles = alert.trigger_data?.articles || []
                      const riskLevel = alert.risk_level || 0
                      const signals = alert.signals || alert.trigger_data?.warning_signals || []

                      return (
                        <div key={idx} className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl p-6">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                alert.severity === 'critical' ? 'bg-red-500/20' :
                                alert.severity === 'high' ? 'bg-orange-500/20' : 'bg-amber-500/20'
                              }`}>
                                <AlertTriangle className={`w-6 h-6 ${
                                  alert.severity === 'critical' ? 'text-red-400' :
                                  alert.severity === 'high' ? 'text-orange-400' : 'text-amber-400'
                                }`} />
                              </div>
                              <div>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  alert.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                                  alert.severity === 'high' ? 'bg-orange-500/20 text-orange-400' : 'bg-amber-500/20 text-amber-400'
                                }`}>
                                  {scenarioType.label}
                                </span>
                                <h3 className="text-lg font-semibold text-white mt-1">{alert.title}</h3>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="text-xs text-[var(--grey-500)]">Risk Level</div>
                                <div className={`text-2xl font-bold ${
                                  riskLevel >= 7 ? 'text-red-400' : riskLevel >= 4 ? 'text-orange-400' : 'text-amber-400'
                                }`}>{riskLevel}/10</div>
                              </div>
                            </div>
                          </div>

                          {/* Summary */}
                          <p className="text-[var(--grey-300)] mb-4">{alert.summary}</p>

                          {/* Warning Signals */}
                          {signals.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium text-[var(--grey-400)] mb-2">Warning Signals</h4>
                              <div className="flex flex-wrap gap-2">
                                {signals.map((signal: string, sIdx: number) => (
                                  <span key={sIdx} className="px-3 py-1 bg-[var(--grey-800)] text-[var(--grey-300)] rounded-full text-xs">
                                    {signal}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Source Articles with Crisis Signals */}
                          {articles.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium text-[var(--grey-400)] mb-2">Source Articles & Crisis Signals</h4>
                              <div className="space-y-2">
                                {articles.map((article: any, aIdx: number) => (
                                  <div
                                    key={aIdx}
                                    className="p-3 bg-[var(--grey-800)]/50 rounded-lg hover:bg-[var(--grey-800)] group"
                                  >
                                    {article.crisis_signal && (
                                      <p className="text-sm text-red-400 mb-2 flex items-start gap-2">
                                        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                        <span>{article.crisis_signal}</span>
                                      </p>
                                    )}
                                    <a
                                      href={article.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2"
                                    >
                                      <FileText className="w-4 h-4 text-[var(--grey-500)] group-hover:text-blue-400" />
                                      <span className="text-sm text-blue-400 hover:underline flex-1">{article.title || article.url}</span>
                                      <ChevronRight className="w-4 h-4 text-[var(--grey-500)]" />
                                    </a>
                                    {article.source && (
                                      <p className="text-xs text-[var(--grey-500)] mt-1 ml-6">Source: {article.source}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Footer */}
                          <div className="flex items-center justify-between pt-4 border-t border-[var(--grey-800)]">
                            <span className="text-sm text-[var(--grey-500)]">
                              Detected: {alert.detected_at ? new Date(alert.detected_at).toLocaleString() : 'Recently'}
                            </span>
                            <div className="flex gap-3">
                              <button
                                onClick={() => dismissAlert(alert)}
                                className="px-4 py-2 bg-[var(--grey-700)] hover:bg-[var(--grey-600)] text-white rounded-lg text-sm"
                              >
                                Dismiss
                              </button>
                              <button
                                onClick={() => activateCrisisFromAlert(alert)}
                                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                              >
                                <Shield className="w-4 h-4" />
                                Activate Crisis Mode
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
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
