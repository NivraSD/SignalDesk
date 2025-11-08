'use client'

import React, { useState, useEffect } from 'react'
import {
  AlertTriangle,
  Clock,
  Users,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Activity,
  Shield,
  Zap,
  FileText,
  Phone,
  Mail,
  Send,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  Download,
  Bot,
  ChevronRight,
  AlertCircle,
  TrendingUp,
  Timer
} from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { supabase } from '@/lib/supabase/client'
import { fetchMemoryVaultContent } from '@/lib/memoryVaultAPI'
import CrisisHeader from '@/components/crisis/CrisisHeader'
import CrisisAIAssistant from '@/components/crisis/CrisisAIAssistant'
import CrisisTimeline from '@/components/crisis/CrisisTimeline'
import CrisisTeamManager from '@/components/crisis/CrisisTeamManager'
import CrisisCommunications from '@/components/crisis/CrisisCommunications'
import CrisisPlanGenerator from '@/components/crisis/CrisisPlanGenerator'
import CrisisScenarioSelector from '@/components/crisis/CrisisScenarioSelector'
import CrisisPlanViewer from '@/components/crisis/CrisisPlanViewer'

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
  duration_minutes?: number
  timeline: Array<{
    time: string
    type: string
    content: string
    actor: string
  }>
  decisions: Array<{
    time: string
    decision: string
    rationale: string
    actor: string
  }>
  communications: Array<{
    time: string
    stakeholder: string
    content: string
    status: string
  }>
  ai_interactions: Array<{
    time: string
    user_msg: string
    ai_response: string
  }>
  team_status: Record<string, {
    status: string
    role: string
    tasks?: string[]
    contact?: string
  }>
  tasks: Array<{
    id: string
    title: string
    assignee: string
    status: string
    deadline?: string
    completed_at?: string
  }>
  trigger_source?: string
  trigger_data?: any
  crisis_plan_id?: string
  social_signals: any[]
  media_coverage: any[]
  stakeholder_sentiment: Record<string, number>
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export default function CrisisCommandCenter() {
  const { organization } = useAppStore()
  const [activeView, setActiveView] = useState<'dashboard' | 'timeline' | 'team' | 'communications' | 'plan'>('dashboard')
  const [activeCrisis, setActiveCrisis] = useState<CrisisEvent | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPlanGenerator, setShowPlanGenerator] = useState(false)
  const [showPlanViewer, setShowPlanViewer] = useState(false)
  const [showScenarioSelector, setShowScenarioSelector] = useState(false)
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false)
  const [elapsedTime, setElapsedTime] = useState('')
  const [hasCrisisPlan, setHasCrisisPlan] = useState(false)
  const [potentialCrisisAlerts, setPotentialCrisisAlerts] = useState<any[]>([])
  const [hasActiveCrisisAlerts, setHasActiveCrisisAlerts] = useState(false)

  // Clear state when organization changes
  useEffect(() => {
    if (organization) {
      console.log(`🔄 CrisisCommandCenter: Organization changed to ${organization.name}, clearing state`)
      setActiveCrisis(null)
      setActiveView('dashboard')
      setLoading(false)
      setShowPlanGenerator(false)
      setShowPlanViewer(false)
      setShowScenarioSelector(false)
      setShowDeactivateConfirm(false)
      setElapsedTime('')
      setPotentialCrisisAlerts([])
      setHasActiveCrisisAlerts(false)
    }
  }, [organization?.id])

  // Load active crisis on mount and when org changes
  useEffect(() => {
    if (organization) {
      loadActiveCrisis()
      checkForCrisisPlan()
      checkForPotentialCrisis()
    }
  }, [organization])

  // Poll for potential crisis alerts every 30 seconds
  useEffect(() => {
    if (organization && !activeCrisis) {
      const interval = setInterval(() => {
        checkForPotentialCrisis()
      }, 30000) // Check every 30 seconds

      return () => clearInterval(interval)
    }
  }, [organization, activeCrisis])

  const checkForCrisisPlan = async () => {
    if (!organization) return

    try {
      const data = await fetchMemoryVaultContent({
        organization_id: organization.id,
        content_type: 'crisis-plan',
        limit: 1
      })

      setHasCrisisPlan(data.length > 0)
    } catch (err) {
      setHasCrisisPlan(false)
    }
  }

  const checkForPotentialCrisis = async () => {
    if (!organization) return

    try {
      const alerts: any[] = []
      const oneDayAgo = new Date()
      oneDayAgo.setHours(oneDayAgo.getHours() - 24)

      // METHOD 1: Check crisis_events table for 'monitoring' status crises (from real-time detection)
      const { data: monitoringCrises, error: crisisError } = await supabase
        .from('crisis_events')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('status', 'monitoring')
        .gte('started_at', oneDayAgo.toISOString())
        .order('started_at', { ascending: false })
        .limit(10)

      if (monitoringCrises && !crisisError) {
        // Convert monitoring crises to alert format for display
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
            signals: warningSignals
          })
        })
      }

      // METHOD 2: Also check intelligence briefs for critical alerts (legacy/alternative source)
      const { data: briefs, error: briefsError } = await supabase
        .from('real_time_intelligence_briefs')
        .select('critical_alerts, created_at')
        .eq('organization_id', organization.id)
        .gte('created_at', oneDayAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(5)

      if (briefs && !briefsError) {
        briefs.forEach(brief => {
          if (brief.critical_alerts && Array.isArray(brief.critical_alerts)) {
            brief.critical_alerts.forEach((alert: any) => {
              // Filter for critical/high severity and crisis-related alerts
              if (
                alert.severity === 'critical' ||
                (alert.severity === 'high' && (
                  alert.category?.toLowerCase().includes('crisis') ||
                  alert.title?.toLowerCase().includes('crisis') ||
                  alert.type?.toLowerCase().includes('crisis')
                ))
              ) {
                alerts.push({
                  ...alert,
                  detected_at: brief.created_at
                })
              }
            })
          }
        })
      }

      console.log(`🚨 Potential crisis alerts found: ${alerts.length}`)

      setPotentialCrisisAlerts(alerts)
      setHasActiveCrisisAlerts(alerts.length > 0)

      // Emit event for tab color indication
      if (alerts.length > 0) {
        window.dispatchEvent(new CustomEvent('crisisAlertsDetected', {
          detail: { alertCount: alerts.length }
        }))
      }
    } catch (err) {
      console.error('Error checking for potential crisis:', err)
    }
  }

  // Update elapsed time every minute
  useEffect(() => {
    if (activeCrisis && activeCrisis.status === 'active') {
      const interval = setInterval(() => {
        setElapsedTime(calculateElapsedTime(activeCrisis.started_at))
      }, 60000) // Update every minute

      // Initial update
      setElapsedTime(calculateElapsedTime(activeCrisis.started_at))

      return () => clearInterval(interval)
    }
  }, [activeCrisis])

  const loadActiveCrisis = async () => {
    if (!organization) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('crisis_events')
        .select('*')
        .eq('organization_id', organization.id)  // Use UUID instead of name
        .in('status', ['monitoring', 'active'])
        .order('started_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        // Table doesn't exist or RLS blocking - silently handle
        if (error.code === 'PGRST116' || error.message.includes('406')) {
          console.log('Crisis events table not available')
        } else {
          console.error('Error loading crisis:', error)
        }
      } else if (data) {
        setActiveCrisis(data)
      }
    } catch (err) {
      console.error('Error loading crisis:', err)
    } finally {
      setLoading(false)
    }
  }

  const calculateElapsedTime = (startedAt: string): string => {
    const start = new Date(startedAt)
    const now = new Date()
    const diffMs = now.getTime() - start.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 60) {
      return `${diffMins}m`
    } else if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60)
      const mins = diffMins % 60
      return `${hours}h ${mins}m`
    } else {
      const days = Math.floor(diffMins / 1440)
      const hours = Math.floor((diffMins % 1440) / 60)
      return `${days}d ${hours}h`
    }
  }

  const activateScenario = async (scenarioType: string, scenarioTitle: string) => {
    if (!organization) {
      console.error('No organization selected')
      return
    }

    console.log('🚨 Activating crisis scenario:', scenarioType, scenarioTitle)
    setLoading(true)

    try {
      const newCrisis = {
        organization_id: organization.id,  // Use UUID instead of name
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

      console.log('Inserting crisis event:', newCrisis)

      const { data, error } = await supabase
        .from('crisis_events')
        .insert(newCrisis)
        .select()
        .single()

      console.log('Crisis insert result:', { data, error })

      if (error) {
        console.error('❌ Crisis activation error:', error)
        alert(`Failed to activate crisis: ${error.message}`)
      } else if (data) {
        console.log('✅ Crisis activated successfully:', data)
        setActiveCrisis(data)
        setShowScenarioSelector(false)
      }
    } catch (err) {
      console.error('❌ Error activating crisis:', err)
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const deactivateCrisis = async () => {
    if (!activeCrisis) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('crisis_events')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString()
        })
        .eq('id', activeCrisis.id)
        .select()
        .single()

      if (data && !error) {
        setActiveCrisis(null)
        setShowDeactivateConfirm(false)
      } else {
        console.error('Failed to deactivate crisis:', error)
        alert('Failed to deactivate crisis')
      }
    } catch (err) {
      console.error('Error deactivating crisis:', err)
      alert('Error deactivating crisis')
    } finally {
      setLoading(false)
    }
  }

  const updateCrisisStatus = async (newStatus: 'monitoring' | 'active' | 'resolved') => {
    if (!activeCrisis) return

    const updates: any = { status: newStatus }

    if (newStatus === 'resolved') {
      updates.resolved_at = new Date().toISOString()
      setActiveCrisis(null)
    }

    const { data, error } = await supabase
      .from('crisis_events')
      .update(updates)
      .eq('id', activeCrisis.id)
      .select()
      .single()

    if (data && !error && newStatus !== 'resolved') {
      setActiveCrisis(data)
    }
  }

  const updateCrisisSeverity = async (newSeverity: 'low' | 'medium' | 'high' | 'critical') => {
    if (!activeCrisis) return

    const { data, error } = await supabase
      .from('crisis_events')
      .update({ severity: newSeverity })
      .eq('id', activeCrisis.id)
      .select()
      .single()

    if (data && !error) {
      setActiveCrisis(data)
    }
  }

  // Main crisis command center view - always visible
  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-800 bg-gray-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {activeCrisis ? (
              <>
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{activeCrisis.title}</h2>
                  <p className="text-sm text-gray-400">
                    {activeCrisis.severity.toUpperCase()} • {elapsedTime} • {activeCrisis.status.toUpperCase()}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Crisis Command Center</h2>
                  <p className="text-sm text-gray-400">
                    {hasCrisisPlan ? 'Crisis plan ready • All systems normal' : 'No active crisis detected'}
                  </p>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            {activeCrisis ? (
              <>
                <button
                  onClick={() => setShowPlanViewer(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>View Plan</span>
                </button>
                <button
                  onClick={() => setShowDeactivateConfirm(true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Deactivate</span>
                </button>
              </>
            ) : (
              <>
                {hasCrisisPlan && (
                  <button
                    onClick={() => setShowPlanViewer(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span>View Plan</span>
                  </button>
                )}
                <button
                  onClick={() => setShowPlanGenerator(true)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{hasCrisisPlan ? 'Update Plan' : 'Generate Plan'}</span>
                </button>
                <button
                  onClick={() => setShowScenarioSelector(true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Activate Crisis</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {!activeCrisis ? (
          /* Control Panel - Default View */
          <div className="flex-1 grid grid-cols-2 gap-6 p-6 overflow-auto">
            {/* Left: NIV Crisis Advisor */}
            <div className="flex flex-col min-h-0">
              <CrisisAIAssistant
                crisis={activeCrisis || {
                  id: 'preview',
                  organization_id: organization?.name || '',
                  ai_interactions: []
                }}
                onUpdate={loadActiveCrisis}
              />
            </div>

            {/* Right: Quick Actions & Status */}
            <div className="space-y-6">
              {/* Potential Crisis Alert Banner */}
              {potentialCrisisAlerts.length > 0 && (
                <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border-2 border-red-500/50 rounded-xl p-6 animate-pulse">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-500/20">
                      <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-red-400 mb-2">
                        ⚠️ Potential Crisis Detected
                      </h3>
                      <p className="text-sm text-gray-300 mb-3">
                        {potentialCrisisAlerts.length} critical {potentialCrisisAlerts.length === 1 ? 'alert' : 'alerts'} detected by Real-Time Intelligence Monitor
                      </p>
                      <div className="space-y-2 mb-4">
                        {potentialCrisisAlerts.slice(0, 2).map((alert, idx) => (
                          <div key={idx} className="bg-black/30 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <span className="text-red-400 text-xl flex-shrink-0">
                                {alert.severity === 'critical' ? '🔴' : '🟠'}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-semibold text-sm truncate">{alert.title}</p>
                                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{alert.summary}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                        {potentialCrisisAlerts.length > 2 && (
                          <p className="text-xs text-gray-400 text-center">
                            +{potentialCrisisAlerts.length - 2} more {potentialCrisisAlerts.length - 2 === 1 ? 'alert' : 'alerts'}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => setShowScenarioSelector(true)}
                        className="w-full px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-semibold"
                      >
                        <Shield className="w-4 h-4" />
                        Activate Crisis Response
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Card */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    hasCrisisPlan ? 'bg-green-500/10' : 'bg-yellow-500/10'
                  }`}>
                    {hasCrisisPlan ? (
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-yellow-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {hasCrisisPlan ? 'Crisis Plan Ready' : 'Setup Required'}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {hasCrisisPlan ? 'All systems operational' : 'Create a crisis plan to get started'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  {hasCrisisPlan && (
                    <button
                      onClick={() => setShowPlanViewer(true)}
                      className="w-full p-4 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/50 rounded-lg transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-400" />
                        <div>
                          <div className="font-semibold text-white">View Crisis Plan</div>
                          <div className="text-sm text-gray-400">Review scenarios & protocols</div>
                        </div>
                      </div>
                    </button>
                  )}
                  <button
                    onClick={() => setShowPlanGenerator(true)}
                    className="w-full p-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Plus className="w-5 h-5 text-green-400" />
                      <div>
                        <div className="font-semibold text-white">{hasCrisisPlan ? 'Update Plan' : 'Generate Plan'}</div>
                        <div className="text-sm text-gray-400">{hasCrisisPlan ? 'Refresh crisis plan' : 'Create your crisis plan'}</div>
                      </div>
                    </div>
                  </button>
                  {hasCrisisPlan && (
                    <button
                      onClick={() => setShowScenarioSelector(true)}
                      className="w-full p-4 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-600/50 rounded-lg transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Play className="w-5 h-5 text-yellow-400" />
                        <div>
                          <div className="font-semibold text-white">Practice Drill</div>
                          <div className="text-sm text-gray-400">Run a crisis simulation</div>
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Active Crisis Dashboard */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Navigation Tabs */}
            <div className="flex-shrink-0 px-6 border-b border-gray-800 bg-gray-900/50">
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
                        ? 'text-red-500 border-red-500'
                        : 'text-gray-400 border-transparent hover:text-gray-300'
                    }`}
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
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Quick Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-white">{activeCrisis.team_status ? Object.keys(activeCrisis.team_status).length : 0}</div>
                    <div className="text-sm text-gray-400">Team Active</div>
                  </div>
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-white">{activeCrisis.tasks.filter(t => t.status === 'completed').length}/{activeCrisis.tasks.length}</div>
                    <div className="text-sm text-gray-400">Tasks Done</div>
                  </div>
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-white">{activeCrisis.communications.length}</div>
                    <div className="text-sm text-gray-400">Comms Sent</div>
                  </div>
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-white">{activeCrisis.decisions.length}</div>
                    <div className="text-sm text-gray-400">Decisions</div>
                  </div>
                </div>
              </div>

              {/* Recent Timeline */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Recent Activity</h3>
                  <button
                    onClick={() => setActiveView('timeline')}
                    className="text-sm text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                  >
                    <span>View All</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  {activeCrisis.timeline.slice(-5).reverse().map((event, idx) => (
                    <div key={idx} className="flex items-start space-x-3 text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                      <div className="flex-1">
                        <div className="text-gray-300">{event.content}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(event.time).toLocaleTimeString()} • {event.actor}
                        </div>
                      </div>
                    </div>
                  ))}
                  {activeCrisis.timeline.length === 0 && (
                    <div className="text-center py-8 text-gray-500">No activity yet</div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Social Signals & Alerts */}
            <div className="space-y-6">
              {/* Social Signals */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Social Signals</h3>
                <div className="space-y-3">
                  {activeCrisis.social_signals.slice(-3).map((signal, idx) => (
                    <div key={idx} className="p-3 bg-gray-800/50 rounded-lg">
                      <div className="text-sm text-gray-300">{signal.summary || signal.content?.substring(0, 100)}</div>
                      <div className="text-xs text-gray-500 mt-2">{signal.platform}</div>
                    </div>
                  ))}
                  {activeCrisis.social_signals.length === 0 && (
                    <div className="text-center py-8 text-gray-500">No signals detected</div>
                  )}
                </div>
              </div>

              {/* Stakeholder Sentiment */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Stakeholder Sentiment</h3>
                <div className="space-y-3">
                  {Object.entries(activeCrisis.stakeholder_sentiment).map(([group, score]) => (
                    <div key={group}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400 capitalize">{group}</span>
                        <span className={score > 50 ? 'text-green-400' : score > 30 ? 'text-yellow-400' : 'text-red-400'}>
                          {score}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            score > 50 ? 'bg-green-500' : score > 30 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {Object.keys(activeCrisis.stakeholder_sentiment).length === 0 && (
                    <div className="text-center py-8 text-gray-500">No sentiment data</div>
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
              className="w-full p-8 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl transition-colors"
            >
              <FileText className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <div className="text-lg font-bold text-white mb-2">View Crisis Plan</div>
              <div className="text-sm text-gray-400">Click to open your crisis management plan</div>
            </button>
          </div>
        )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showPlanViewer && (
        <CrisisPlanViewer onClose={() => setShowPlanViewer(false)} />
      )}

      {showPlanGenerator && (
        <CrisisPlanGenerator
          onClose={() => setShowPlanGenerator(false)}
          onPlanGenerated={() => {
            setShowPlanGenerator(false)
            setShowPlanViewer(true)
            setHasCrisisPlan(true)
          }}
        />
      )}

      {showScenarioSelector && (
        <CrisisScenarioSelector
          onClose={() => setShowScenarioSelector(false)}
          onScenarioSelected={activateScenario}
        />
      )}

      {/* Deactivate Confirmation Dialog */}
      {showDeactivateConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 max-w-md">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Deactivate Crisis?</h3>
                <p className="text-gray-400">
                  This will mark the crisis as resolved and archive all data. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeactivateConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
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
