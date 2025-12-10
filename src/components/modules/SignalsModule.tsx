'use client'

import { useState, useEffect } from 'react'
import {
  TrendingUp,
  Link2,
  Lightbulb,
  Sparkles,
  Target,
  AlertTriangle,
  Clock,
  CheckCircle,
  ChevronRight,
  RefreshCw,
  Eye,
  Loader2,
  X,
  ThumbsUp,
  ThumbsDown,
  Filter,
  Calendar,
  Building2,
  Zap
} from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { supabase } from '@/lib/supabase/client'

// Signal types from unified schema
type SignalType = 'movement' | 'connection' | 'predictive' | 'opportunity'
type SignalUrgency = 'immediate' | 'near_term' | 'monitoring'
type FeedbackStatus = 'accurate' | 'inaccurate' | 'pending'
type OutcomeValue = 'high_value' | 'some_value' | 'no_value' | 'pending'

interface Signal {
  id: string
  organization_id: string
  signal_type: SignalType
  title: string
  description: string

  // Target context
  target_id?: string
  target_name?: string
  target_type?: string

  // Scoring
  confidence_score: number
  urgency: SignalUrgency
  impact_level: 'critical' | 'high' | 'medium' | 'low'

  // Evidence
  evidence: {
    sources: string[]
    article_ids?: string[]
    supporting_data?: any
    timeline?: Array<{date: string, event: string}>
  }

  // Analysis
  analysis: {
    key_insight: string
    business_implications: string[]
    recommended_actions: string[]
    time_horizon?: string
  }

  // Outcome tracking
  user_feedback: FeedbackStatus
  outcome_value: OutcomeValue
  outcome_notes?: string

  // Metadata
  detected_at: string
  expires_at?: string
  status: 'active' | 'actioned' | 'dismissed' | 'expired'

  created_at: string
  updated_at: string
}

interface SignalStats {
  total: number
  byType: Record<SignalType, number>
  byUrgency: Record<SignalUrgency, number>
  accuracyRate: number
  actionedCount: number
}

const SIGNAL_ICONS: Record<SignalType, typeof TrendingUp> = {
  movement: TrendingUp,
  connection: Link2,
  predictive: Sparkles,
  opportunity: Lightbulb
}

const SIGNAL_COLORS: Record<SignalType, string> = {
  movement: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
  connection: 'text-purple-400 bg-purple-500/20 border-purple-500/30',
  predictive: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
  opportunity: 'text-green-400 bg-green-500/20 border-green-500/30'
}

const URGENCY_COLORS: Record<SignalUrgency, string> = {
  immediate: 'bg-red-500/20 text-red-400 border-red-500/30',
  near_term: 'bg-[var(--burnt-orange-muted)] text-[var(--burnt-orange)] border-[var(--burnt-orange)]/30',
  monitoring: 'bg-[var(--grey-800)] text-[var(--grey-400)] border-[var(--grey-700)]'
}

const URGENCY_LABELS: Record<SignalUrgency, string> = {
  immediate: 'Immediate',
  near_term: 'Near Term',
  monitoring: 'Monitoring'
}

export default function SignalsModule() {
  const { organization } = useAppStore()

  const [signals, setSignals] = useState<Signal[]>([])
  const [stats, setStats] = useState<SignalStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null)

  // Filters
  const [filterType, setFilterType] = useState<SignalType | 'all'>('all')
  const [filterUrgency, setFilterUrgency] = useState<SignalUrgency | 'all'>('all')
  const [filterTarget, setFilterTarget] = useState<string>('all')

  // Available targets for filter dropdown
  const [targets, setTargets] = useState<Array<{id: string, name: string, type: string}>>([])

  useEffect(() => {
    if (organization?.id) {
      loadSignals()
      loadTargets()
    }
  }, [organization?.id])

  const loadSignals = async () => {
    setLoading(true)
    try {
      // First try the new unified signals table
      const { data: signalsData, error: signalsError } = await supabase
        .from('signals')
        .select('*')
        .eq('organization_id', organization!.id)
        .eq('status', 'active')
        .order('detected_at', { ascending: false })

      if (signalsError) {
        // Fallback to predictions + connection_signals if new table doesn't exist yet
        console.log('Signals table not available, falling back to predictions + connections')
        await loadLegacySignals()
        return
      }

      setSignals(signalsData || [])
      calculateStats(signalsData || [])
    } catch (error) {
      console.error('Failed to load signals:', error)
      // Try legacy fallback
      await loadLegacySignals()
    } finally {
      setLoading(false)
    }
  }

  const loadLegacySignals = async () => {
    try {
      // Load predictions and convert to unified format
      const { data: predictions } = await supabase
        .from('predictions')
        .select('*')
        .eq('organization_id', organization!.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(50)

      // Load connection signals and convert
      const { data: connections } = await supabase
        .from('connection_signals')
        .select('*')
        .eq('organization_id', organization!.id)
        .order('created_at', { ascending: false })
        .limit(50)

      const unifiedSignals: Signal[] = [
        ...(predictions || []).map(convertPredictionToSignal),
        ...(connections || []).map(convertConnectionToSignal)
      ].sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime())

      setSignals(unifiedSignals)
      calculateStats(unifiedSignals)
    } catch (error) {
      console.error('Failed to load legacy signals:', error)
      setSignals([])
    }
  }

  const convertPredictionToSignal = (pred: any): Signal => ({
    id: pred.id,
    organization_id: pred.organization_id,
    signal_type: 'predictive',
    title: pred.title,
    description: pred.description,
    target_id: pred.target_id,
    target_name: pred.target_name,
    target_type: pred.target_type,
    confidence_score: pred.confidence_score || 70,
    urgency: pred.impact_level === 'critical' ? 'immediate' :
             pred.impact_level === 'high' ? 'near_term' : 'monitoring',
    impact_level: pred.impact_level || 'medium',
    evidence: {
      sources: [],
      supporting_data: pred.supporting_evidence ? { text: pred.supporting_evidence } : undefined
    },
    analysis: {
      key_insight: pred.description,
      business_implications: pred.data?.implications || [],
      recommended_actions: pred.data?.recommended_actions || [],
      time_horizon: pred.time_horizon
    },
    user_feedback: 'pending',
    outcome_value: 'pending',
    detected_at: pred.created_at,
    status: 'active',
    created_at: pred.created_at,
    updated_at: pred.updated_at
  })

  const convertConnectionToSignal = (conn: any): Signal => ({
    id: conn.id,
    organization_id: conn.organization_id,
    signal_type: 'connection',
    title: conn.signal_title,
    description: conn.signal_description,
    target_name: conn.primary_entity_name,
    target_type: 'entity',
    confidence_score: conn.confidence_score || 70,
    urgency: conn.client_impact_level === 'critical' ? 'immediate' :
             conn.client_impact_level === 'high' ? 'near_term' : 'monitoring',
    impact_level: conn.client_impact_level || 'medium',
    evidence: {
      sources: conn.related_entities?.map((e: any) => e.name) || [],
      supporting_data: conn.pattern_data
    },
    analysis: {
      key_insight: conn.industry_relevance || conn.signal_description,
      business_implications: [],
      recommended_actions: []
    },
    user_feedback: 'pending',
    outcome_value: 'pending',
    detected_at: conn.signal_detected_date || conn.created_at,
    status: 'active',
    created_at: conn.created_at,
    updated_at: conn.updated_at
  })

  const loadTargets = async () => {
    try {
      const { data } = await supabase
        .from('intelligence_targets')
        .select('id, name, target_type')
        .eq('organization_id', organization!.id)
        .eq('is_active', true)

      setTargets(data?.map(t => ({ id: t.id, name: t.name, type: t.target_type })) || [])
    } catch (error) {
      // If intelligence_targets doesn't exist, use unique targets from signals
      const uniqueTargets = new Map<string, {id: string, name: string, type: string}>()
      signals.forEach(s => {
        if (s.target_name && s.target_id) {
          uniqueTargets.set(s.target_id, {
            id: s.target_id,
            name: s.target_name,
            type: s.target_type || 'unknown'
          })
        }
      })
      setTargets(Array.from(uniqueTargets.values()))
    }
  }

  const calculateStats = (signalData: Signal[]) => {
    const stats: SignalStats = {
      total: signalData.length,
      byType: {
        movement: signalData.filter(s => s.signal_type === 'movement').length,
        connection: signalData.filter(s => s.signal_type === 'connection').length,
        predictive: signalData.filter(s => s.signal_type === 'predictive').length,
        opportunity: signalData.filter(s => s.signal_type === 'opportunity').length
      },
      byUrgency: {
        immediate: signalData.filter(s => s.urgency === 'immediate').length,
        near_term: signalData.filter(s => s.urgency === 'near_term').length,
        monitoring: signalData.filter(s => s.urgency === 'monitoring').length
      },
      accuracyRate: calculateAccuracyRate(signalData),
      actionedCount: signalData.filter(s => s.status === 'actioned').length
    }
    setStats(stats)
  }

  const calculateAccuracyRate = (signalData: Signal[]): number => {
    const reviewed = signalData.filter(s => s.user_feedback !== 'pending')
    if (reviewed.length === 0) return 0
    const accurate = reviewed.filter(s => s.user_feedback === 'accurate').length
    return Math.round((accurate / reviewed.length) * 100)
  }

  const filteredSignals = signals.filter(signal => {
    if (filterType !== 'all' && signal.signal_type !== filterType) return false
    if (filterUrgency !== 'all' && signal.urgency !== filterUrgency) return false
    if (filterTarget !== 'all' && signal.target_id !== filterTarget) return false
    return true
  })

  const handleFeedback = async (signalId: string, feedback: FeedbackStatus) => {
    try {
      await supabase
        .from('signals')
        .update({ user_feedback: feedback, updated_at: new Date().toISOString() })
        .eq('id', signalId)

      // Update local state
      setSignals(prev => prev.map(s =>
        s.id === signalId ? { ...s, user_feedback: feedback } : s
      ))

      if (selectedSignal?.id === signalId) {
        setSelectedSignal({ ...selectedSignal, user_feedback: feedback })
      }
    } catch (error) {
      console.error('Failed to update feedback:', error)
    }
  }

  const handleAction = async (signalId: string, action: 'actioned' | 'dismissed') => {
    try {
      await supabase
        .from('signals')
        .update({ status: action, updated_at: new Date().toISOString() })
        .eq('id', signalId)

      // Remove from active list
      setSignals(prev => prev.filter(s => s.id !== signalId))
      setSelectedSignal(null)
    } catch (error) {
      console.error('Failed to update signal action:', error)
    }
  }

  const getSignalIcon = (type: SignalType) => {
    const Icon = SIGNAL_ICONS[type]
    return <Icon className="w-4 h-4" />
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-[var(--grey-400)]'
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--charcoal)]">
        <div className="flex items-center gap-3 text-[var(--grey-400)]">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading Signals...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[var(--charcoal)] overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b border-[var(--grey-800)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div
              className="text-[0.65rem] uppercase tracking-[0.15em] text-[var(--burnt-orange)] flex items-center gap-2 mb-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <span className="w-1.5 h-1.5 bg-[var(--burnt-orange)] rounded-full" />
              Intelligence Signals
            </div>
            <h1
              className="text-[1.5rem] font-normal text-white"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Market & Competitive Signals
            </h1>
            <p className="text-[var(--grey-400)] text-sm mt-1">
              AI-detected patterns, connections, and opportunities across your intelligence targets
            </p>
          </div>

          <button
            onClick={loadSignals}
            className="px-4 py-2.5 bg-[var(--burnt-orange)] text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-[var(--burnt-orange-light)] transition-colors"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Stats Row */}
        {stats && (
          <div className="grid grid-cols-6 gap-4 mt-6">
            {/* Urgency Stats */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <div className="text-[0.7rem] uppercase tracking-wide text-red-400 mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Immediate
              </div>
              <div className="text-2xl font-bold text-red-400" style={{ fontFamily: 'var(--font-display)' }}>
                {stats.byUrgency.immediate}
              </div>
            </div>

            <div className="bg-[var(--burnt-orange-muted)] border border-[var(--burnt-orange)]/20 rounded-xl p-4">
              <div className="text-[0.7rem] uppercase tracking-wide text-[var(--burnt-orange)] mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Near Term
              </div>
              <div className="text-2xl font-bold text-[var(--burnt-orange)]" style={{ fontFamily: 'var(--font-display)' }}>
                {stats.byUrgency.near_term}
              </div>
            </div>

            <div className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl p-4">
              <div className="text-[0.7rem] uppercase tracking-wide text-[var(--grey-500)] mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Monitoring
              </div>
              <div className="text-2xl font-bold text-[var(--grey-400)]" style={{ fontFamily: 'var(--font-display)' }}>
                {stats.byUrgency.monitoring}
              </div>
            </div>

            <div className="w-px bg-[var(--grey-700)]" />

            {/* Type Stats */}
            <div className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl p-4">
              <div className="text-[0.7rem] uppercase tracking-wide text-[var(--grey-500)] mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Total Signals
              </div>
              <div className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                {stats.total}
              </div>
            </div>

            <div className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl p-4">
              <div className="text-[0.7rem] uppercase tracking-wide text-[var(--grey-500)] mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Accuracy Rate
              </div>
              <div className="text-2xl font-bold text-green-400" style={{ fontFamily: 'var(--font-display)' }}>
                {stats.accuracyRate}%
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="px-8 py-4 border-b border-[var(--grey-800)] flex items-center gap-6">
        {/* Type Filter */}
        <div className="flex items-center gap-2">
          <span className="text-[0.75rem] text-[var(--grey-500)]" style={{ fontFamily: 'var(--font-display)' }}>
            Type:
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 text-[0.75rem] rounded-md transition-colors ${
                filterType === 'all'
                  ? 'bg-[var(--burnt-orange)] text-white'
                  : 'bg-[var(--grey-800)] text-[var(--grey-400)] hover:text-white'
              }`}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              All
            </button>
            {(['movement', 'connection', 'predictive', 'opportunity'] as SignalType[]).map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 text-[0.75rem] rounded-md transition-colors flex items-center gap-1.5 ${
                  filterType === type
                    ? 'bg-[var(--burnt-orange)] text-white'
                    : 'bg-[var(--grey-800)] text-[var(--grey-400)] hover:text-white'
                }`}
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {getSignalIcon(type)}
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="w-px h-6 bg-[var(--grey-700)]" />

        {/* Urgency Filter */}
        <div className="flex items-center gap-2">
          <span className="text-[0.75rem] text-[var(--grey-500)]" style={{ fontFamily: 'var(--font-display)' }}>
            Urgency:
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setFilterUrgency('all')}
              className={`px-3 py-1.5 text-[0.75rem] rounded-md transition-colors ${
                filterUrgency === 'all'
                  ? 'bg-[var(--burnt-orange)] text-white'
                  : 'bg-[var(--grey-800)] text-[var(--grey-400)] hover:text-white'
              }`}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              All
            </button>
            {(['immediate', 'near_term', 'monitoring'] as SignalUrgency[]).map(urgency => (
              <button
                key={urgency}
                onClick={() => setFilterUrgency(urgency)}
                className={`px-3 py-1.5 text-[0.75rem] rounded-md transition-colors ${
                  filterUrgency === urgency
                    ? 'bg-[var(--burnt-orange)] text-white'
                    : 'bg-[var(--grey-800)] text-[var(--grey-400)] hover:text-white'
                }`}
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {URGENCY_LABELS[urgency]}
              </button>
            ))}
          </div>
        </div>

        {/* Target Filter (if targets exist) */}
        {targets.length > 0 && (
          <>
            <div className="w-px h-6 bg-[var(--grey-700)]" />
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-[var(--grey-500)]" />
              <select
                value={filterTarget}
                onChange={(e) => setFilterTarget(e.target.value)}
                className="bg-[var(--grey-800)] text-[var(--grey-300)] text-[0.75rem] rounded-md px-3 py-1.5 border border-[var(--grey-700)] focus:outline-none focus:border-[var(--burnt-orange)]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <option value="all">All Targets</option>
                {targets.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        {filteredSignals.length === 0 ? (
          <div className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl p-12 text-center">
            <Zap className="w-16 h-16 mx-auto mb-4 text-[var(--grey-600)]" />
            <h3
              className="text-lg font-medium text-white mb-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              No Active Signals
            </h3>
            <p className="text-[var(--grey-400)] text-sm mb-6 max-w-md mx-auto">
              Signals are detected during the daily intelligence pipeline. Run the pipeline from the Hub to generate new signals from your intelligence targets.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSignals.map((signal) => (
              <div
                key={signal.id}
                className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl p-5 hover:border-[var(--grey-700)] transition-colors cursor-pointer"
                onClick={() => setSelectedSignal(signal)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {/* Signal Type Badge */}
                      <span className={`px-2 py-1 text-[0.65rem] rounded border flex items-center gap-1.5 ${SIGNAL_COLORS[signal.signal_type]}`}>
                        {getSignalIcon(signal.signal_type)}
                        {signal.signal_type.toUpperCase()}
                      </span>

                      {/* Urgency Badge */}
                      <span className={`px-2 py-0.5 text-[0.65rem] rounded border ${URGENCY_COLORS[signal.urgency]}`}>
                        {URGENCY_LABELS[signal.urgency]}
                      </span>

                      {/* Target Badge */}
                      {signal.target_name && (
                        <span className="px-2 py-0.5 text-[0.65rem] rounded bg-[var(--grey-800)] text-[var(--grey-400)] border border-[var(--grey-700)] flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {signal.target_name}
                        </span>
                      )}
                    </div>

                    <h4
                      className="text-[0.95rem] font-medium text-white mb-2"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {signal.title}
                    </h4>

                    <p className="text-[var(--grey-400)] text-sm mb-3 line-clamp-2">
                      {signal.description}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-[var(--grey-500)]">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(signal.detected_at)}
                      </span>
                      {signal.analysis.time_horizon && (
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {signal.analysis.time_horizon}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 ml-4">
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getConfidenceColor(signal.confidence_score)}`} style={{ fontFamily: 'var(--font-display)' }}>
                        {Math.round(signal.confidence_score)}%
                      </div>
                      <div className="text-[0.65rem] text-[var(--grey-500)]">Confidence</div>
                    </div>

                    {/* Feedback indicator */}
                    {signal.user_feedback !== 'pending' && (
                      <div className={`p-1.5 rounded ${signal.user_feedback === 'accurate' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                        {signal.user_feedback === 'accurate' ? (
                          <ThumbsUp className="w-4 h-4 text-green-400" />
                        ) : (
                          <ThumbsDown className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                    )}

                    <ChevronRight className="w-5 h-5 text-[var(--grey-500)]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Signal Detail Modal */}
      {selectedSignal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8">
          <div className="bg-[var(--grey-900)] rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[var(--grey-800)] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 text-[0.65rem] rounded border flex items-center gap-1.5 ${SIGNAL_COLORS[selectedSignal.signal_type]}`}>
                    {getSignalIcon(selectedSignal.signal_type)}
                    {selectedSignal.signal_type.toUpperCase()}
                  </span>
                  <span className={`px-2 py-0.5 text-[0.65rem] rounded border ${URGENCY_COLORS[selectedSignal.urgency]}`}>
                    {URGENCY_LABELS[selectedSignal.urgency]}
                  </span>
                  {selectedSignal.target_name && (
                    <span className="px-2 py-0.5 text-[0.65rem] rounded bg-[var(--grey-800)] text-[var(--grey-400)] border border-[var(--grey-700)] flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {selectedSignal.target_name}
                    </span>
                  )}
                </div>
                <h3
                  className="text-xl font-medium text-white"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {selectedSignal.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSignal(null)}
                className="p-2 hover:bg-[var(--grey-800)] rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[var(--grey-400)]" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Description */}
              <div>
                <h4 className="text-[0.7rem] uppercase tracking-wide text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                  Description
                </h4>
                <p className="text-white">{selectedSignal.description}</p>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[var(--grey-800)] rounded-lg p-4">
                  <div className="text-[0.7rem] uppercase tracking-wide text-[var(--grey-500)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                    Confidence Score
                  </div>
                  <div className={`text-3xl font-bold ${getConfidenceColor(selectedSignal.confidence_score)}`} style={{ fontFamily: 'var(--font-display)' }}>
                    {Math.round(selectedSignal.confidence_score)}%
                  </div>
                </div>

                <div className="bg-[var(--grey-800)] rounded-lg p-4">
                  <div className="text-[0.7rem] uppercase tracking-wide text-[var(--grey-500)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                    Detected
                  </div>
                  <div className="text-lg font-medium text-white" style={{ fontFamily: 'var(--font-display)' }}>
                    {formatDate(selectedSignal.detected_at)}
                  </div>
                </div>

                {selectedSignal.analysis.time_horizon && (
                  <div className="bg-[var(--grey-800)] rounded-lg p-4">
                    <div className="text-[0.7rem] uppercase tracking-wide text-[var(--grey-500)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                      Time Horizon
                    </div>
                    <div className="text-lg font-medium text-white" style={{ fontFamily: 'var(--font-display)' }}>
                      {selectedSignal.analysis.time_horizon}
                    </div>
                  </div>
                )}
              </div>

              {/* Key Insight */}
              {selectedSignal.analysis.key_insight && (
                <div>
                  <h4 className="text-[0.7rem] uppercase tracking-wide text-white mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                    Key Insight
                  </h4>
                  <div className="p-4 bg-[var(--burnt-orange-muted)] rounded-lg border border-[var(--burnt-orange)]/30">
                    <p className="text-white">{selectedSignal.analysis.key_insight}</p>
                  </div>
                </div>
              )}

              {/* Business Implications */}
              {selectedSignal.analysis.business_implications && selectedSignal.analysis.business_implications.length > 0 && (
                <div>
                  <h4 className="text-[0.7rem] uppercase tracking-wide text-white mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                    Business Implications
                  </h4>
                  <ul className="space-y-2">
                    {selectedSignal.analysis.business_implications.map((imp, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-[var(--grey-300)]">
                        <AlertTriangle className="w-4 h-4 text-[var(--burnt-orange)] mt-0.5 flex-shrink-0" />
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommended Actions */}
              {selectedSignal.analysis.recommended_actions && selectedSignal.analysis.recommended_actions.length > 0 && (
                <div>
                  <h4 className="text-[0.7rem] uppercase tracking-wide text-white mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                    Recommended Actions
                  </h4>
                  <ul className="space-y-2">
                    {selectedSignal.analysis.recommended_actions.map((action, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-[var(--grey-300)]">
                        <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Evidence Sources */}
              {selectedSignal.evidence.sources && selectedSignal.evidence.sources.length > 0 && (
                <div>
                  <h4 className="text-[0.7rem] uppercase tracking-wide text-white mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                    Evidence Sources
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedSignal.evidence.sources.map((source, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 text-[0.75rem] bg-[var(--grey-800)] text-[var(--grey-300)] rounded-lg border border-[var(--grey-700)]"
                      >
                        {source}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback Section */}
              <div className="pt-4 border-t border-[var(--grey-700)]">
                <h4 className="text-[0.7rem] uppercase tracking-wide text-white mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                  Was this signal accurate?
                </h4>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleFeedback(selectedSignal.id, 'accurate')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      selectedSignal.user_feedback === 'accurate'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-[var(--grey-800)] text-[var(--grey-400)] hover:text-green-400 border border-[var(--grey-700)]'
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    Accurate
                  </button>
                  <button
                    onClick={() => handleFeedback(selectedSignal.id, 'inaccurate')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      selectedSignal.user_feedback === 'inaccurate'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-[var(--grey-800)] text-[var(--grey-400)] hover:text-red-400 border border-[var(--grey-700)]'
                    }`}
                  >
                    <ThumbsDown className="w-4 h-4" />
                    Not Accurate
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[var(--grey-800)] flex justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => handleAction(selectedSignal.id, 'actioned')}
                  className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-green-500/30 transition-colors border border-green-500/30"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark Actioned
                </button>
                <button
                  onClick={() => handleAction(selectedSignal.id, 'dismissed')}
                  className="px-4 py-2 bg-[var(--grey-800)] text-[var(--grey-400)] rounded-lg text-sm font-medium flex items-center gap-2 hover:text-white transition-colors border border-[var(--grey-700)]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  <X className="w-4 h-4" />
                  Dismiss
                </button>
              </div>
              <button
                onClick={() => setSelectedSignal(null)}
                className="px-4 py-2 text-[var(--grey-400)] hover:text-white transition-colors"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
