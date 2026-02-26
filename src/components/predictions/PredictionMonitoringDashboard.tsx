'use client'

import { useEffect, useState } from 'react'
import { Activity, Eye, CheckCircle, Clock, TrendingUp, AlertCircle, Play } from 'lucide-react'

interface MonitoringStats {
  total_predictions: number
  active: number
  watching: number
  signals_detected: number
  outcome_imminent: number
  validated_today: number
  expired_today: number
  overall_accuracy: number
}

interface TargetAccuracy {
  target_id: string
  target_name: string
  target_type: string
  total_predictions: number
  validated_count: number
  successful_count: number
  accuracy_percentage: number
}

export default function PredictionMonitoringDashboard({ organizationId }: { organizationId: string }) {
  const [stats, setStats] = useState<MonitoringStats | null>(null)
  const [targetAccuracy, setTargetAccuracy] = useState<TargetAccuracy[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (organizationId) {
      loadMonitoringData()
    }
  }, [organizationId])

  const loadMonitoringData = async () => {
    try {
      setLoading(true)
      setError(null)

      const { supabase } = await import('@/lib/supabase/client')

      // Get monitoring stats
      const { data: predictions } = await supabase
        .from('predictions_with_monitoring')
        .select('*')
        .eq('organization_id', organizationId)

      if (predictions) {
        const stats: MonitoringStats = {
          total_predictions: predictions.length,
          active: predictions.filter(p => p.status === 'active').length,
          watching: predictions.filter(p => p.monitoring_status === 'watching').length,
          signals_detected: predictions.filter(p => p.monitoring_status === 'signals_detected').length,
          outcome_imminent: predictions.filter(p => p.monitoring_status === 'outcome_imminent').length,
          validated_today: predictions.filter(p => {
            if (!p.validated_at) return false
            const today = new Date().toDateString()
            return new Date(p.validated_at).toDateString() === today
          }).length,
          expired_today: predictions.filter(p => {
            if (p.status !== 'expired') return false
            const today = new Date().toDateString()
            return new Date(p.updated_at).toDateString() === today
          }).length,
          overall_accuracy: predictions.filter(p => p.status === 'validated').length > 0
            ? (predictions.filter(p => p.outcome_occurred === true).length /
               predictions.filter(p => p.status === 'validated').length) * 100
            : 0
        }
        setStats(stats)
      }

      // Get target accuracy
      const { data: accuracy } = await supabase
        .from('target_accuracy_summary')
        .select('*')
        .eq('organization_id', organizationId)
        .order('accuracy_percentage', { ascending: false })

      if (accuracy) {
        setTargetAccuracy(accuracy)
      }

    } catch (err: any) {
      console.error('Failed to load monitoring data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const runMonitor = async () => {
    try {
      setRunning(true)
      setError(null)

      const { supabase } = await import('@/lib/supabase/client')

      console.log('🔍 Running prediction monitor...')
      const { data, error } = await supabase.functions.invoke('prediction-monitor')

      if (error) {
        throw new Error(error.message)
      }

      console.log('✅ Monitor complete:', data)

      // Reload data
      await loadMonitoringData()

    } catch (err: any) {
      console.error('Monitor failed:', err)
      setError(err.message)
    } finally {
      setRunning(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-500" />
            Prediction Monitoring
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Track prediction outcomes and accuracy metrics
          </p>
        </div>
        <button
          onClick={runMonitor}
          disabled={running}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 rounded-lg flex items-center gap-2"
        >
          <Play className="w-4 h-4" />
          {running ? 'Running...' : 'Run Monitor Now'}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-sm text-red-400">{error}</span>
        </div>
      )}

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-white">{stats.active}</div>
            <div className="text-xs text-gray-400">Active Predictions</div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-400">{stats.watching}</div>
            <div className="text-xs text-gray-400">Watching</div>
          </div>

          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-400">{stats.signals_detected}</div>
            <div className="text-xs text-gray-400">Signals Detected</div>
          </div>

          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-400">{stats.outcome_imminent}</div>
            <div className="text-xs text-gray-400">Imminent</div>
          </div>

          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">{stats.validated_today}</div>
            <div className="text-xs text-gray-400">Validated Today</div>
          </div>

          <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-400">{stats.expired_today}</div>
            <div className="text-xs text-gray-400">Expired Today</div>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 col-span-2">
            <div className="text-2xl font-bold text-purple-400">
              {stats.overall_accuracy.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-400">Overall Accuracy</div>
          </div>
        </div>
      )}

      {/* Target Accuracy Table */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-500" />
          Target Accuracy
        </h3>
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Target</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Type</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Total</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Validated</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Successful</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {targetAccuracy.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No validation data yet. Validate some predictions to see accuracy metrics.
                  </td>
                </tr>
              ) : (
                targetAccuracy.map((target) => (
                  <tr key={target.target_id} className="border-t border-gray-700 hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-white font-medium">{target.target_name}</td>
                    <td className="px-4 py-3 text-gray-400 capitalize">{target.target_type}</td>
                    <td className="px-4 py-3 text-center text-gray-300">{target.total_predictions}</td>
                    <td className="px-4 py-3 text-center text-gray-300">{target.validated_count}</td>
                    <td className="px-4 py-3 text-center text-gray-300">{target.successful_count}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${
                        target.accuracy_percentage >= 80 ? 'text-green-400' :
                        target.accuracy_percentage >= 60 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {target.accuracy_percentage.toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <h4 className="font-semibold text-blue-400 mb-2">How Monitoring Works</h4>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• <strong>Watching:</strong> Actively monitoring for outcome evidence</li>
          <li>• <strong>Signals Detected:</strong> Found 3+ supporting signals, confidence increasing</li>
          <li>• <strong>Imminent:</strong> Outcome expected soon based on signals</li>
          <li>• Click "Run Monitor Now" to manually check all active predictions</li>
          <li>• Or validate predictions manually using the buttons in the predictions dashboard</li>
        </ul>
      </div>
    </div>
  )
}
