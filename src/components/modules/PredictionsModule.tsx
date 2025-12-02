'use client'

import { useState, useEffect } from 'react'
import {
  TrendingUp,
  Target,
  AlertTriangle,
  Clock,
  CheckCircle,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Zap,
  BarChart3,
  Eye,
  Loader2,
  Lightbulb,
  X,
  Calendar
} from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { PredictionTargetService } from '@/lib/services/predictionTargetService'
import type { PredictionWithTarget } from '@/types/predictions'

interface PredictionStats {
  total: number
  pending: number
  confirmed: number
  invalidated: number
  highConfidence: number
}

export default function PredictionsModule() {
  const { organization } = useAppStore()
  const [predictions, setPredictions] = useState<PredictionWithTarget[]>([])
  const [stats, setStats] = useState<PredictionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPrediction, setSelectedPrediction] = useState<PredictionWithTarget | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterImpact, setFilterImpact] = useState<string>('all')

  useEffect(() => {
    if (organization?.id) {
      loadPredictions()
    }
  }, [organization?.id])

  const loadPredictions = async () => {
    setLoading(true)
    try {
      const data = await PredictionTargetService.getFilteredPredictions(organization!.id)
      setPredictions(data)

      // Calculate stats
      const stats: PredictionStats = {
        total: data.length,
        pending: data.filter(p => p.status === 'pending').length,
        confirmed: data.filter(p => p.status === 'confirmed').length,
        invalidated: data.filter(p => p.status === 'invalidated').length,
        highConfidence: data.filter(p => p.confidence_score >= 80).length
      }
      setStats(stats)
    } catch (error) {
      console.error('Failed to load predictions:', error)
    } finally {
      setLoading(false)
    }
  }

  const categories = ['all', 'market', 'competitor', 'regulatory', 'technology', 'trend']
  const impacts = ['all', 'critical', 'high', 'medium', 'low']

  const filteredPredictions = predictions.filter(pred => {
    if (filterCategory !== 'all' && pred.category !== filterCategory) return false
    if (filterImpact !== 'all' && pred.impact_level !== filterImpact) return false
    return true
  })

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'high': return 'bg-[var(--burnt-orange-muted)] text-[var(--burnt-orange)] border-[var(--burnt-orange)]/30'
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      default: return 'bg-[var(--grey-800)] text-[var(--grey-400)] border-[var(--grey-700)]'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'invalidated': return <X className="w-4 h-4 text-red-400" />
      case 'monitoring': return <Eye className="w-4 h-4 text-blue-400" />
      default: return <Clock className="w-4 h-4 text-[var(--grey-400)]" />
    }
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-[var(--grey-400)]'
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--charcoal)]">
        <div className="flex items-center gap-3 text-[var(--grey-400)]">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading Predictions...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-[var(--charcoal)]">
      {/* Header */}
      <div className="px-8 py-6 border-b border-[var(--grey-800)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div
              className="text-[0.65rem] uppercase tracking-[0.15em] text-[var(--burnt-orange)] flex items-center gap-2 mb-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <span className="w-1.5 h-1.5 bg-[var(--burnt-orange)] rounded-full" />
              Predictions
            </div>
            <h1
              className="text-[1.5rem] font-normal text-white"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Intelligence Predictions
            </h1>
            <p className="text-[var(--grey-400)] text-sm mt-1">
              AI-generated predictions based on signal analysis and pattern detection
            </p>
          </div>

          <button
            onClick={loadPredictions}
            className="px-4 py-2.5 bg-[var(--burnt-orange)] text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-[var(--burnt-orange-light)] transition-colors"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-5 gap-4 mt-6">
            <div className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl p-4">
              <div className="text-[0.7rem] uppercase tracking-wide text-[var(--grey-500)] mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Total Predictions
              </div>
              <div className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                {stats.total}
              </div>
            </div>

            <div className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl p-4">
              <div className="text-[0.7rem] uppercase tracking-wide text-[var(--grey-500)] mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Pending
              </div>
              <div className="text-2xl font-bold text-yellow-400" style={{ fontFamily: 'var(--font-display)' }}>
                {stats.pending}
              </div>
            </div>

            <div className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl p-4">
              <div className="text-[0.7rem] uppercase tracking-wide text-[var(--grey-500)] mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Confirmed
              </div>
              <div className="text-2xl font-bold text-green-400" style={{ fontFamily: 'var(--font-display)' }}>
                {stats.confirmed}
              </div>
            </div>

            <div className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl p-4">
              <div className="text-[0.7rem] uppercase tracking-wide text-[var(--grey-500)] mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Invalidated
              </div>
              <div className="text-2xl font-bold text-red-400" style={{ fontFamily: 'var(--font-display)' }}>
                {stats.invalidated}
              </div>
            </div>

            <div className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl p-4">
              <div className="text-[0.7rem] uppercase tracking-wide text-[var(--grey-500)] mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                High Confidence
              </div>
              <div className="text-2xl font-bold text-[var(--burnt-orange)]" style={{ fontFamily: 'var(--font-display)' }}>
                {stats.highConfidence}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="px-8 py-4 border-b border-[var(--grey-800)] flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-[0.75rem] text-[var(--grey-500)]" style={{ fontFamily: 'var(--font-display)' }}>
            Category:
          </span>
          <div className="flex gap-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 text-[0.75rem] rounded-md transition-colors ${
                  filterCategory === cat
                    ? 'bg-[var(--burnt-orange)] text-white'
                    : 'bg-[var(--grey-800)] text-[var(--grey-400)] hover:text-white'
                }`}
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="w-px h-6 bg-[var(--grey-700)]" />

        <div className="flex items-center gap-2">
          <span className="text-[0.75rem] text-[var(--grey-500)]" style={{ fontFamily: 'var(--font-display)' }}>
            Impact:
          </span>
          <div className="flex gap-1">
            {impacts.map(impact => (
              <button
                key={impact}
                onClick={() => setFilterImpact(impact)}
                className={`px-3 py-1.5 text-[0.75rem] rounded-md transition-colors ${
                  filterImpact === impact
                    ? 'bg-[var(--burnt-orange)] text-white'
                    : 'bg-[var(--grey-800)] text-[var(--grey-400)] hover:text-white'
                }`}
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {impact.charAt(0).toUpperCase() + impact.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {filteredPredictions.length === 0 ? (
          <div className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl p-12 text-center">
            <Lightbulb className="w-16 h-16 mx-auto mb-4 text-[var(--grey-600)]" />
            <h3
              className="text-lg font-medium text-white mb-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              No Predictions Yet
            </h3>
            <p className="text-[var(--grey-400)] text-sm mb-6 max-w-md mx-auto">
              Predictions are generated automatically from connection signals and pattern analysis. Run the intelligence pipeline to generate predictions.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPredictions.map((prediction) => (
              <div
                key={prediction.id}
                className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl p-5 hover:border-[var(--grey-700)] transition-colors cursor-pointer"
                onClick={() => setSelectedPrediction(prediction)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(prediction.status)}
                      <h4
                        className="text-[0.95rem] font-medium text-white"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        {prediction.title}
                      </h4>
                      <span className={`px-2 py-0.5 text-[0.65rem] rounded border ${getImpactColor(prediction.impact_level)}`}>
                        {prediction.impact_level.toUpperCase()}
                      </span>
                      <span className="px-2 py-0.5 text-[0.65rem] rounded bg-[var(--grey-800)] text-[var(--grey-400)] border border-[var(--grey-700)]">
                        {prediction.category}
                      </span>
                    </div>

                    <p className="text-[var(--grey-400)] text-sm mb-3 line-clamp-2">
                      {prediction.description}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-[var(--grey-500)]">
                      {prediction.target_name && (
                        <span className="flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5" />
                          {prediction.target_name}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {prediction.time_horizon}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 ml-4">
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getConfidenceColor(prediction.confidence_score)}`} style={{ fontFamily: 'var(--font-display)' }}>
                        {Math.round(prediction.confidence_score)}%
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

      {/* Prediction Detail Modal */}
      {selectedPrediction && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8">
          <div className="bg-[var(--grey-900)] rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[var(--grey-800)] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {getStatusIcon(selectedPrediction.status)}
                  <span className="text-[0.75rem] text-[var(--grey-400)] capitalize">{selectedPrediction.status}</span>
                  <span className={`px-2 py-0.5 text-[0.65rem] rounded border ${getImpactColor(selectedPrediction.impact_level)}`}>
                    {selectedPrediction.impact_level.toUpperCase()}
                  </span>
                </div>
                <h3
                  className="text-xl font-medium text-white"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {selectedPrediction.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPrediction(null)}
                className="p-2 hover:bg-[var(--grey-800)] rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[var(--grey-400)]" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <h4 className="text-[0.7rem] uppercase tracking-wide text-[var(--grey-500)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                  Description
                </h4>
                <p className="text-[var(--grey-300)]">{selectedPrediction.description}</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[var(--grey-800)] rounded-lg p-4">
                  <div className="text-[0.7rem] uppercase tracking-wide text-[var(--grey-500)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                    Confidence Score
                  </div>
                  <div className={`text-3xl font-bold ${getConfidenceColor(selectedPrediction.confidence_score)}`} style={{ fontFamily: 'var(--font-display)' }}>
                    {Math.round(selectedPrediction.confidence_score)}%
                  </div>
                </div>

                <div className="bg-[var(--grey-800)] rounded-lg p-4">
                  <div className="text-[0.7rem] uppercase tracking-wide text-[var(--grey-500)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                    Category
                  </div>
                  <div className="text-lg font-medium text-white capitalize" style={{ fontFamily: 'var(--font-display)' }}>
                    {selectedPrediction.category}
                  </div>
                </div>

                <div className="bg-[var(--grey-800)] rounded-lg p-4">
                  <div className="text-[0.7rem] uppercase tracking-wide text-[var(--grey-500)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                    Time Horizon
                  </div>
                  <div className="text-lg font-medium text-white" style={{ fontFamily: 'var(--font-display)' }}>
                    {selectedPrediction.time_horizon}
                  </div>
                </div>
              </div>

              {selectedPrediction.target_name && (
                <div>
                  <h4 className="text-[0.7rem] uppercase tracking-wide text-[var(--grey-500)] mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                    Related Target
                  </h4>
                  <div className="p-4 bg-[var(--grey-800)] rounded-lg border border-[var(--grey-700)]">
                    <div className="flex items-center gap-3">
                      <Target className="w-5 h-5 text-[var(--burnt-orange)]" />
                      <div>
                        <div className="font-medium text-white">{selectedPrediction.target_name}</div>
                        <div className="text-sm text-[var(--grey-400)] capitalize">{selectedPrediction.target_type}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedPrediction.supporting_evidence && (
                <div>
                  <h4 className="text-[0.7rem] uppercase tracking-wide text-[var(--grey-500)] mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                    Supporting Evidence
                  </h4>
                  <div className="bg-[var(--grey-800)] rounded-lg p-4">
                    <p className="text-[var(--grey-300)] text-sm">{selectedPrediction.supporting_evidence}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[var(--grey-800)] flex justify-end gap-3">
              <button
                onClick={() => setSelectedPrediction(null)}
                className="px-4 py-2 text-[var(--grey-400)] hover:text-white transition-colors"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Close
              </button>
              <button
                className="px-4 py-2 bg-[var(--burnt-orange)] text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-[var(--burnt-orange-light)] transition-colors"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <Zap className="w-4 h-4" />
                Create Opportunity
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
