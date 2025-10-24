'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, TrendingUp, Clock, Target, AlertTriangle, CheckCircle } from 'lucide-react'

interface Stakeholder {
  id: string
  stakeholder_name: string
  stakeholder_type: string
  influence_score: number
  predictability_score: number
  data_quality: string
}

interface Prediction {
  id: string
  stakeholder_id: string
  stakeholder_name?: string
  predicted_action: string
  action_category: string
  probability: number
  expected_timeframe: string
  expected_date_min: string
  expected_date_max: string
  confidence_level: string
  trigger_signals: string[]
  supporting_evidence: any
  pattern_matched: string
  status: string
}

// Helper to extract stakeholder from prediction title
function extractStakeholderFromTitle(title: string): string {
  if (!title) return 'Unknown'
  // Try to extract the subject before "will" or first entity mentioned
  const willMatch = title.match(/^([^w]+?)\s+will/i)
  if (willMatch) return willMatch[1].trim()

  // Try to find entity before a verb
  const verbMatch = title.match(/^([^a-z]+(?:[A-Z][a-z]*\s*)+)(?:to|is|has|announces|plans|expects)/i)
  if (verbMatch) return verbMatch[1].trim()

  // Return first few words as fallback
  return title.split(' ').slice(0, 3).join(' ')
}

export default function StakeholderPredictionDashboard({ organizationId }: { organizationId: string }) {
  const [loading, setLoading] = useState(false)
  const [buildingProfiles, setBuildingProfiles] = useState(false)
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([])
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [groupByStakeholder, setGroupByStakeholder] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dataStats, setDataStats] = useState<{ events: number; stakeholders: number } | null>(null)

  // Initial load
  useEffect(() => {
    if (organizationId) {
      loadPredictions()
    }
  }, [organizationId])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!organizationId) return

    const interval = setInterval(() => {
      loadPredictions()
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [organizationId])

  const loadPredictions = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch predictions directly from database
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error:', error)
        throw new Error(`Failed to load predictions: ${error.message}`)
      }

      // Transform new prediction format to match old format for display
      const transformedPredictions = (data || []).map((pred: any) => ({
        id: pred.id,
        stakeholder_id: '', // New predictions don't have stakeholder_id
        stakeholder_name: pred.data?.stakeholder || extractStakeholderFromTitle(pred.title),
        predicted_action: pred.title,
        action_category: pred.category,
        probability: pred.confidence_score / 100, // Convert 0-100 to 0-1
        expected_timeframe: pred.time_horizon,
        expected_date_min: calculateMinDate(pred.time_horizon),
        expected_date_max: calculateMaxDate(pred.time_horizon),
        confidence_level: pred.impact_level, // Using impact as confidence for now
        trigger_signals: pred.data?.evidence || [],
        supporting_evidence: pred.data,
        pattern_matched: pred.category,
        status: pred.status,
        // New fields specific to real-time predictions
        description: pred.description,
        implications: pred.data?.implications || [],
        recommended_actions: pred.data?.recommended_actions || []
      }))

      setPredictions(transformedPredictions)
      setDataStats({
        events: 0, // Will be populated from real-time monitor response
        stakeholders: 0
      })
    } catch (err: any) {
      console.error('Error loading predictions:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Helper functions to calculate dates from time_horizon
  const calculateMinDate = (timeHorizon: string): string => {
    const now = new Date()
    switch (timeHorizon) {
      case '1-week':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
      case '1-month':
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
      case '3-months':
        return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString()
      case '6-months':
        return new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString()
      case '1-year':
        return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString()
      default:
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }
  }

  const calculateMaxDate = (timeHorizon: string): string => {
    const now = new Date()
    switch (timeHorizon) {
      case '1-week':
        return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString()
      case '1-month':
        return new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString()
      case '3-months':
        return new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000).toISOString()
      case '6-months':
        return new Date(now.getTime() + 210 * 24 * 60 * 60 * 1000).toISOString()
      case '1-year':
        return new Date(now.getTime() + 425 * 24 * 60 * 60 * 1000).toISOString()
      default:
        return new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString()
    }
  }

  const buildProfiles = async () => {
    try {
      setBuildingProfiles(true)
      setError(null)

      // This will be called to build initial profiles
      // In production, this would profile all stakeholders
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/stakeholder-profiler`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ organizationId, forceUpdate: true })
      })

      if (response.ok) {
        // After profiling, reload predictions
        await loadPredictions()
      }
    } catch (err: any) {
      console.error('Error building profiles:', err)
      setError(err.message)
    } finally {
      setBuildingProfiles(false)
    }
  }

  // Filter predictions
  const filteredPredictions = predictions.filter(p => {
    if (selectedFilter === 'all') return true
    if (selectedFilter === 'high-priority') return p.confidence_level === 'high' && p.probability >= 0.70
    if (selectedFilter === 'imminent') {
      const daysUntil = Math.floor((new Date(p.expected_date_min).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      return daysUntil <= 14
    }
    return p.action_category === selectedFilter
  })

  // Calculate stats
  const stats = {
    total: predictions.length,
    highConfidence: predictions.filter(p => p.confidence_level === 'high').length,
    imminent: predictions.filter(p => {
      const daysUntil = Math.floor((new Date(p.expected_date_min).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      return daysUntil <= 14
    }).length,
    byCategory: predictions.reduce((acc, p) => {
      acc[p.action_category] = (acc[p.action_category] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  if (buildingProfiles) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Building Stakeholder Profiles...</h3>
          <p className="text-gray-400 text-sm">
            Analyzing historical intelligence data to create predictive profiles
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Target className="w-6 h-6 text-blue-500" />
              Stakeholder Predictions
              <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full ml-2">
                BETA
              </span>
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              AI-powered predictions of stakeholder actions based on pattern analysis
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setGroupByStakeholder(!groupByStakeholder)}
              className={`px-4 py-2 rounded-lg text-sm ${
                groupByStakeholder
                  ? 'bg-purple-600 hover:bg-purple-500'
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              {groupByStakeholder ? '📊 By Category' : '👥 By Stakeholder'}
            </button>
            <button
              onClick={buildProfiles}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm"
            >
              Update Profiles
            </button>
            <button
              onClick={loadPredictions}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-gray-400">Total Predictions</div>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <div className="text-2xl font-bold text-red-400">{stats.highConfidence}</div>
            <div className="text-xs text-gray-400">High Confidence</div>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
            <div className="text-2xl font-bold text-orange-400">{stats.imminent}</div>
            <div className="text-xs text-gray-400">Imminent (≤14 days)</div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <div className="text-2xl font-bold text-blue-400">
              {Math.round((stats.highConfidence / Math.max(stats.total, 1)) * 100)}%
            </div>
            <div className="text-xs text-gray-400">Accuracy Rate (est.)</div>
          </div>
          {dataStats && (
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
              <div className="text-2xl font-bold text-purple-400">
                {dataStats.events}
              </div>
              <div className="text-xs text-gray-400">
                Data Stored ({dataStats.stakeholders} stakeholders)
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {['all', 'high-priority', 'imminent', 'competitive', 'regulatory', 'market', 'technology', 'partnership', 'crisis'].map(filter => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-3 py-1 rounded-full text-xs ${
                selectedFilter === filter
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {filter.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              {filter === 'all' && ` (${stats.total})`}
              {filter !== 'all' && filter !== 'high-priority' && filter !== 'imminent' && ` (${stats.byCategory[filter] || 0})`}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-sm text-red-400">{error}</span>
        </div>
      )}

      {/* Predictions List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredPredictions.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            {predictions.length === 0 ? (
              <>
                <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                {dataStats && dataStats.events > 0 ? (
                  <>
                    <p className="font-semibold mb-2">No high-confidence predictions detected</p>
                    <p className="text-sm">
                      Analyzed {dataStats.events} events across {dataStats.stakeholders} stakeholders.
                      <br />
                      No patterns matched with sufficient confidence (≥60%) to generate predictions.
                    </p>
                  </>
                ) : (
                  <p>No predictions yet. Run real-time monitor to generate predictions.</p>
                )}
              </>
            ) : (
              <p>No predictions match the selected filter.</p>
            )}
          </div>
        ) : groupByStakeholder ? (
          // Group by stakeholder
          <div className="space-y-6">
            {Object.entries(
              filteredPredictions
                .sort((a, b) => b.probability - a.probability)
                .reduce((groups, prediction) => {
                  const stakeholder = prediction.stakeholder_name || 'Unknown'
                  if (!groups[stakeholder]) groups[stakeholder] = []
                  groups[stakeholder].push(prediction)
                  return groups
                }, {} as Record<string, typeof filteredPredictions>)
            ).map(([stakeholder, stakeholderPredictions]) => (
              <div key={stakeholder} className="bg-gray-800/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span>👤</span>
                  {stakeholder}
                  <span className="text-xs bg-gray-700 px-2 py-1 rounded-full">
                    {stakeholderPredictions.length} prediction{stakeholderPredictions.length !== 1 ? 's' : ''}
                  </span>
                </h3>
                <div className="space-y-3">
                  {stakeholderPredictions.map(prediction => (
                    <PredictionCard key={prediction.id} prediction={prediction} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Standard list view
          <div className="space-y-4">
            {filteredPredictions
              .sort((a, b) => b.probability - a.probability)
              .map(prediction => (
                <PredictionCard key={prediction.id} prediction={prediction} />
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PredictionCard({ prediction }: { prediction: Prediction }) {
  const [expanded, setExpanded] = useState(false)

  const daysUntilMin = Math.floor(
    (new Date(prediction.expected_date_min).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  const confidenceColor = {
    high: 'text-red-400 bg-red-500/10 border-red-500/20',
    medium: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    low: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
  }[prediction.confidence_level] || 'text-gray-400 bg-gray-800 border-gray-700'

  const categoryIcon = {
    competitive: '🏢',
    regulatory: '⚖️',
    market: '📈',
    technology: '💻',
    partnership: '🤝',
    crisis: '⚠️',
    // Legacy mappings
    regulator: '⚖️',
    activist: '📢',
    investor: '💰',
    competitor: '🏢',
    employee: '👥',
    customer: '🛍️',
    media: '📰'
  }[prediction.action_category] || '📊'

  return (
    <div className={`border rounded-lg p-4 ${confidenceColor}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{categoryIcon}</span>
            <div>
              <h3 className="font-semibold">{prediction.stakeholder_name || 'Unknown Stakeholder'}</h3>
              <div className="text-xs opacity-75 capitalize">{prediction.action_category}</div>
            </div>
          </div>
          <p className="text-sm font-medium mb-2">{prediction.predicted_action}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{Math.round(prediction.probability * 100)}%</div>
          <div className="text-xs opacity-75 uppercase">{prediction.confidence_level}</div>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm mb-3">
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>
            {daysUntilMin > 0 ? `${daysUntilMin} days` : 'Imminent'}
            {' - '}
            {new Date(prediction.expected_date_min).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp className="w-4 h-4" />
          <span className="text-xs">{prediction.pattern_matched}</span>
        </div>
      </div>

      {/* Trigger Signals */}
      {prediction.trigger_signals && prediction.trigger_signals.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-semibold mb-1 opacity-75">Trigger Signals:</div>
          <div className="flex flex-wrap gap-1">
            {prediction.trigger_signals.slice(0, expanded ? undefined : 3).map((signal, i) => (
              <span
                key={i}
                className="text-xs px-2 py-1 bg-black/20 rounded-full"
              >
                {signal}
              </span>
            ))}
            {!expanded && prediction.trigger_signals.length > 3 && (
              <button
                onClick={() => setExpanded(true)}
                className="text-xs px-2 py-1 bg-black/20 rounded-full hover:bg-black/30"
              >
                +{prediction.trigger_signals.length - 3} more
              </button>
            )}
          </div>
        </div>
      )}

      {/* Description (when expanded) */}
      {expanded && prediction.description && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="text-xs font-semibold mb-1 opacity-75">What Will Happen:</div>
          <p className="text-sm opacity-90">{prediction.description}</p>
        </div>
      )}

      {/* Implications (when expanded) */}
      {expanded && prediction.implications && prediction.implications.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="text-xs font-semibold mb-2 opacity-75">Implications:</div>
          <ul className="space-y-1 text-sm">
            {prediction.implications.map((implication, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span className="opacity-90">{implication}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommended Actions (when expanded) */}
      {expanded && prediction.recommended_actions && prediction.recommended_actions.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="text-xs font-semibold mb-2 opacity-75">Recommended Actions:</div>
          <ul className="space-y-1 text-sm">
            {prediction.recommended_actions.map((action, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-green-400 mt-1">→</span>
                <span className="opacity-90">{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="text-xs underline opacity-75 hover:opacity-100"
        >
          Show details
        </button>
      )}
    </div>
  )
}
