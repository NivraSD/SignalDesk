'use client'

import { useState, useEffect } from 'react'
import {
  Zap,
  Clock,
  Target,
  ChevronRight,
  RefreshCw,
  Loader2,
  X,
  Calendar,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Building2
} from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { supabase } from '@/lib/supabase/client'

interface Cascade {
  id: string
  organization_id: string
  signal_id: string | null
  target_id: string | null
  predicted_outcome: string
  predicted_timeframe_days: number
  predicted_confidence: number
  prediction_reasoning: string
  prediction_evidence: any
  prediction_expires_at: string | null
  validation_status: 'pending' | 'validated' | 'expired'
  outcome_occurred: boolean | null
  created_at: string

  // Joined data
  intelligence_targets?: {
    name: string
    target_type: string
  }
}

interface CascadeStats {
  total: number
  pending: number
  validated: number
  expired: number
  avgConfidence: number
}

export default function CascadesModule() {
  const { organization } = useAppStore()

  const [cascades, setCascades] = useState<Cascade[]>([])
  const [stats, setStats] = useState<CascadeStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCascade, setSelectedCascade] = useState<Cascade | null>(null)
  const [filter, setFilter] = useState<'all' | 'high_confidence' | 'imminent'>('all')

  useEffect(() => {
    if (organization?.id) {
      loadCascades()
    }
  }, [organization?.id])

  const loadCascades = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('signal_outcomes')
        .select(`
          *,
          intelligence_targets(name, target_type)
        `)
        .eq('organization_id', organization!.id)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      setCascades(data || [])
      calculateStats(data || [])
    } catch (error) {
      console.error('Failed to load cascades:', error)
      setCascades([])
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (data: Cascade[]) => {
    const stats: CascadeStats = {
      total: data.length,
      pending: data.filter(c => c.validation_status === 'pending' || !c.validation_status).length,
      validated: data.filter(c => c.validation_status === 'validated').length,
      expired: data.filter(c => c.validation_status === 'expired').length,
      avgConfidence: data.length > 0
        ? Math.round(data.reduce((sum, c) => sum + (c.predicted_confidence || 0), 0) / data.length * 100)
        : 0
    }
    setStats(stats)
  }

  const filteredCascades = cascades.filter(cascade => {
    if (filter === 'high_confidence') {
      return cascade.predicted_confidence >= 0.7
    }
    if (filter === 'imminent') {
      return cascade.predicted_timeframe_days <= 30
    }
    return true
  })

  const getConfidenceColor = (confidence: number) => {
    const pct = confidence * 100
    if (pct >= 70) return 'text-green-400'
    if (pct >= 50) return 'text-yellow-400'
    return 'text-[var(--grey-400)]'
  }

  const getTimeframeColor = (days: number) => {
    if (days <= 14) return 'text-red-400 bg-red-500/20 border-red-500/30'
    if (days <= 30) return 'text-[var(--burnt-orange)] bg-[var(--burnt-orange-muted)] border-[var(--burnt-orange)]/30'
    if (days <= 60) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'
    return 'text-[var(--grey-400)] bg-[var(--grey-800)] border-[var(--grey-700)]'
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formatExpiryDate = (dateStr: string | null) => {
    if (!dateStr) return 'No expiry'
    const date = new Date(dateStr)
    const now = new Date()
    const daysLeft = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (daysLeft < 0) return 'Expired'
    if (daysLeft === 0) return 'Today'
    if (daysLeft === 1) return 'Tomorrow'
    return `${daysLeft} days left`
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--charcoal)]">
        <div className="flex items-center gap-3 text-[var(--grey-400)]">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading Cascades...</span>
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
              Intelligence Cascades
            </div>
            <h1
              className="text-[1.5rem] font-normal text-white"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Forward-Looking Predictions
            </h1>
            <p className="text-[var(--grey-400)] text-sm mt-1">
              AI-generated predictions with specific timeframes and validation criteria
            </p>
          </div>

          <button
            onClick={loadCascades}
            className="px-4 py-2.5 bg-[var(--burnt-orange)] text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-[var(--burnt-orange-light)] transition-colors"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Stats Row */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl p-4">
              <div className="text-[0.7rem] uppercase tracking-wide text-[var(--grey-500)] mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Active Predictions
              </div>
              <div className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                {stats.pending}
              </div>
            </div>

            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
              <div className="text-[0.7rem] uppercase tracking-wide text-green-400 mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Validated
              </div>
              <div className="text-2xl font-bold text-green-400" style={{ fontFamily: 'var(--font-display)' }}>
                {stats.validated}
              </div>
            </div>

            <div className="bg-[var(--grey-800)] border border-[var(--grey-700)] rounded-xl p-4">
              <div className="text-[0.7rem] uppercase tracking-wide text-[var(--grey-500)] mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Expired
              </div>
              <div className="text-2xl font-bold text-[var(--grey-400)]" style={{ fontFamily: 'var(--font-display)' }}>
                {stats.expired}
              </div>
            </div>

            <div className="bg-[var(--burnt-orange-muted)] border border-[var(--burnt-orange)]/20 rounded-xl p-4">
              <div className="text-[0.7rem] uppercase tracking-wide text-[var(--burnt-orange)] mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Avg Confidence
              </div>
              <div className="text-2xl font-bold text-[var(--burnt-orange)]" style={{ fontFamily: 'var(--font-display)' }}>
                {stats.avgConfidence}%
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="px-8 py-4 border-b border-[var(--grey-800)] flex items-center gap-4">
        <span className="text-[0.75rem] text-[var(--grey-500)]" style={{ fontFamily: 'var(--font-display)' }}>
          Filter:
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-[0.75rem] rounded-md transition-colors ${
              filter === 'all'
                ? 'bg-[var(--burnt-orange)] text-white'
                : 'bg-[var(--grey-800)] text-[var(--grey-400)] hover:text-white'
            }`}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            All
          </button>
          <button
            onClick={() => setFilter('high_confidence')}
            className={`px-3 py-1.5 text-[0.75rem] rounded-md transition-colors flex items-center gap-1.5 ${
              filter === 'high_confidence'
                ? 'bg-[var(--burnt-orange)] text-white'
                : 'bg-[var(--grey-800)] text-[var(--grey-400)] hover:text-white'
            }`}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            High Confidence
          </button>
          <button
            onClick={() => setFilter('imminent')}
            className={`px-3 py-1.5 text-[0.75rem] rounded-md transition-colors flex items-center gap-1.5 ${
              filter === 'imminent'
                ? 'bg-[var(--burnt-orange)] text-white'
                : 'bg-[var(--grey-800)] text-[var(--grey-400)] hover:text-white'
            }`}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Imminent (≤30 days)
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        {filteredCascades.length === 0 ? (
          <div className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl p-12 text-center">
            <Zap className="w-16 h-16 mx-auto mb-4 text-[var(--grey-600)]" />
            <h3
              className="text-lg font-medium text-white mb-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              No Predictions Yet
            </h3>
            <p className="text-[var(--grey-400)] text-sm mb-6 max-w-md mx-auto">
              Predictions are generated from intelligence signals during the daily pipeline.
              They will appear here with specific outcomes and timeframes.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCascades.map((cascade) => (
              <div
                key={cascade.id}
                className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl p-5 hover:border-[var(--grey-700)] transition-colors cursor-pointer"
                onClick={() => setSelectedCascade(cascade)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {/* Timeframe Badge */}
                      <span className={`px-2.5 py-1 text-[0.7rem] rounded border flex items-center gap-1.5 ${getTimeframeColor(cascade.predicted_timeframe_days)}`}>
                        <Clock className="w-3.5 h-3.5" />
                        {cascade.predicted_timeframe_days} days
                      </span>

                      {/* Expiry indicator */}
                      {cascade.prediction_expires_at && (
                        <span className="text-[0.7rem] text-[var(--grey-500)]">
                          {formatExpiryDate(cascade.prediction_expires_at)}
                        </span>
                      )}

                      {/* Target Badge */}
                      {cascade.intelligence_targets?.name && (
                        <span className="px-2 py-0.5 text-[0.65rem] rounded bg-[var(--grey-800)] text-[var(--grey-400)] border border-[var(--grey-700)] flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {cascade.intelligence_targets.name}
                        </span>
                      )}
                    </div>

                    <h4
                      className="text-[0.95rem] font-medium text-white mb-2 leading-snug"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {cascade.predicted_outcome}
                    </h4>

                    <p className="text-[var(--grey-400)] text-sm mb-3 line-clamp-2">
                      {cascade.prediction_reasoning}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-[var(--grey-500)]">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(cascade.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 ml-4">
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getConfidenceColor(cascade.predicted_confidence)}`} style={{ fontFamily: 'var(--font-display)' }}>
                        {Math.round(cascade.predicted_confidence * 100)}%
                      </div>
                      <div className="text-[0.65rem] text-[var(--grey-500)]">Confidence</div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-[var(--grey-500)]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedCascade && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8">
          <div className="bg-[var(--grey-900)] rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[var(--grey-800)]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 text-[0.7rem] rounded border flex items-center gap-1.5 ${getTimeframeColor(selectedCascade.predicted_timeframe_days)}`}>
                    <Clock className="w-3.5 h-3.5" />
                    {selectedCascade.predicted_timeframe_days} day window
                  </span>
                  <span className={`px-2.5 py-1 text-[0.7rem] rounded border font-medium ${getConfidenceColor(selectedCascade.predicted_confidence)} bg-opacity-20`}>
                    {Math.round(selectedCascade.predicted_confidence * 100)}% confidence
                  </span>
                </div>
                <button
                  onClick={() => setSelectedCascade(null)}
                  className="p-2 hover:bg-[var(--grey-800)] rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-[var(--grey-400)]" />
                </button>
              </div>
              <h3
                className="text-xl font-medium text-white leading-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {selectedCascade.predicted_outcome}
              </h3>
              <div className="flex items-center gap-3 mt-2 text-sm text-[var(--grey-500)]">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Generated {formatDate(selectedCascade.created_at)}
                </span>
                {selectedCascade.intelligence_targets?.name && (
                  <span className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    {selectedCascade.intelligence_targets.name}
                  </span>
                )}
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Reasoning */}
              <div>
                <h4 className="text-[0.7rem] uppercase tracking-wide text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                  Why We Predict This
                </h4>
                <p className="text-[var(--grey-200)] leading-relaxed">{selectedCascade.prediction_reasoning}</p>
              </div>

              {/* Verification Criteria */}
              {selectedCascade.prediction_evidence?.verification_criteria && (
                <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <h4 className="text-[0.7rem] uppercase tracking-wide text-white mb-2 flex items-center gap-1.5" style={{ fontFamily: 'var(--font-display)' }}>
                    <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                    How We'd Confirm This
                  </h4>
                  <ul className="space-y-1.5">
                    {selectedCascade.prediction_evidence.verification_criteria.map((criteria: string, idx: number) => (
                      <li key={idx} className="text-green-300 text-sm flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        {criteria}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Refutation Criteria */}
              {selectedCascade.prediction_evidence?.refutation_criteria && (
                <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                  <h4 className="text-[0.7rem] uppercase tracking-wide text-white mb-2 flex items-center gap-1.5" style={{ fontFamily: 'var(--font-display)' }}>
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    What Would Disprove This
                  </h4>
                  <ul className="space-y-1.5">
                    {selectedCascade.prediction_evidence.refutation_criteria.map((criteria: string, idx: number) => (
                      <li key={idx} className="text-red-300 text-sm flex items-start gap-2">
                        <span className="text-red-500 mt-1">•</span>
                        {criteria}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Original Signal */}
              {selectedCascade.prediction_evidence?.original_signal_title && (
                <div>
                  <h4 className="text-[0.7rem] uppercase tracking-wide text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                    Based On
                  </h4>
                  <p className="text-[var(--grey-400)] text-sm italic">
                    "{selectedCascade.prediction_evidence.original_signal_title}"
                  </p>
                </div>
              )}

              {/* Timing Details */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-[var(--grey-800)] rounded-lg p-3">
                  <div className="text-[0.65rem] uppercase tracking-wide text-[var(--grey-500)] mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                    Expected Within
                  </div>
                  <div className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                    {selectedCascade.predicted_timeframe_days} days
                  </div>
                </div>
                <div className="bg-[var(--grey-800)] rounded-lg p-3">
                  <div className="text-[0.65rem] uppercase tracking-wide text-[var(--grey-500)] mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                    Expires
                  </div>
                  <div className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                    {selectedCascade.prediction_expires_at
                      ? formatDate(selectedCascade.prediction_expires_at)
                      : 'N/A'
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[var(--grey-800)] flex justify-end">
              <button
                onClick={() => setSelectedCascade(null)}
                className="px-4 py-2 text-[var(--grey-400)] hover:text-white transition-colors text-sm"
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
