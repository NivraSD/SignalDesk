'use client'

import { useState, useEffect } from 'react'
import {
  Network,
  Users,
  TrendingUp,
  AlertTriangle,
  Search,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Zap,
  ExternalLink,
  Loader2,
  Link2,
  Eye,
  X
} from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { ConnectionService } from '@/lib/services/connectionService'
import type {
  ConnectionSignal,
  EntityConnection,
  StrongConnection
} from '@/lib/types/connections'

interface ConnectionStats {
  totalSignals: number
  totalConnections: number
  strongConnections: number
  highImpactSignals: number
  avgSignalStrength: number
}

export default function ConnectionsModule() {
  const { organization } = useAppStore()
  const [signals, setSignals] = useState<ConnectionSignal[]>([])
  const [connections, setConnections] = useState<EntityConnection[]>([])
  const [stats, setStats] = useState<ConnectionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSignal, setSelectedSignal] = useState<ConnectionSignal | null>(null)
  const [filter, setFilter] = useState<'all' | 'high_impact' | 'emerging'>('all')
  const [isScanning, setIsScanning] = useState(false)

  useEffect(() => {
    if (organization?.id) {
      loadConnectionData()
    }
  }, [organization?.id])

  const loadConnectionData = async () => {
    setLoading(true)
    try {
      const [signalsData, connectionsData, statsData] = await Promise.all([
        ConnectionService.getConnectionSignals(organization!.id),
        ConnectionService.getEntityConnections(organization!.id, 50),
        ConnectionService.getConnectionStats(organization!.id)
      ])

      setSignals(signalsData)
      setConnections(connectionsData)
      setStats(statsData)
    } catch (error) {
      console.error('Failed to load connection data:', error)
    } finally {
      setLoading(false)
    }
  }

  const runConnectionScan = async () => {
    setIsScanning(true)
    try {
      // Reload connection data after scan
      await loadConnectionData()
    } catch (error) {
      console.error('Connection scan failed:', error)
    } finally {
      setIsScanning(false)
    }
  }

  const filteredSignals = signals.filter(signal => {
    if (filter === 'high_impact') {
      return signal.client_impact_level === 'high' || signal.client_impact_level === 'critical'
    }
    if (filter === 'emerging') {
      return signal.signal_maturity === 'emerging'
    }
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

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--charcoal)]">
        <div className="flex items-center gap-3 text-[var(--grey-400)]">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading Connections...</span>
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
              Connection Intelligence
            </div>
            <h1
              className="text-[1.5rem] font-normal text-white"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Entity Connections & Relationships
            </h1>
            <p className="text-[var(--grey-400)] text-sm mt-1">
              Discover patterns and relationships between entities in your industry
            </p>
          </div>

          <button
            onClick={runConnectionScan}
            disabled={isScanning}
            className="px-4 py-2.5 bg-[var(--burnt-orange)] text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-[var(--burnt-orange-light)] transition-colors disabled:opacity-50"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Refresh Connections
              </>
            )}
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-5 gap-4 mt-6">
            <div className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl p-4">
              <div className="text-[0.7rem] uppercase tracking-wide text-[var(--grey-500)] mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Connection Signals
              </div>
              <div className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                {stats.totalSignals}
              </div>
            </div>

            <div className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl p-4">
              <div className="text-[0.7rem] uppercase tracking-wide text-[var(--grey-500)] mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Entity Links
              </div>
              <div className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                {stats.totalConnections}
              </div>
            </div>

            <div className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl p-4">
              <div className="text-[0.7rem] uppercase tracking-wide text-[var(--grey-500)] mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Strong Links
              </div>
              <div className="text-2xl font-bold text-green-400" style={{ fontFamily: 'var(--font-display)' }}>
                {stats.strongConnections}
              </div>
            </div>

            <div className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl p-4">
              <div className="text-[0.7rem] uppercase tracking-wide text-[var(--grey-500)] mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                High Impact
              </div>
              <div className="text-2xl font-bold text-[var(--burnt-orange)]" style={{ fontFamily: 'var(--font-display)' }}>
                {stats.highImpactSignals}
              </div>
            </div>

            <div className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl p-4">
              <div className="text-[0.7rem] uppercase tracking-wide text-[var(--grey-500)] mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Avg Strength
              </div>
              <div className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                {Math.round(stats.avgSignalStrength)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="px-8 py-4 border-b border-[var(--grey-800)] flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[0.75rem] text-[var(--grey-500)]" style={{ fontFamily: 'var(--font-display)' }}>
            Filter:
          </span>
          <div className="flex gap-1">
            {(['all', 'high_impact', 'emerging'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-[0.75rem] rounded-md transition-colors ${
                  filter === f
                    ? 'bg-[var(--burnt-orange)] text-white'
                    : 'bg-[var(--grey-800)] text-[var(--grey-400)] hover:text-white'
                }`}
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {f === 'all' ? 'All' : f === 'high_impact' ? 'High Impact' : 'Emerging'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {filteredSignals.length === 0 ? (
          <div className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl p-12 text-center">
            <Network className="w-16 h-16 mx-auto mb-4 text-[var(--grey-600)]" />
            <h3
              className="text-lg font-medium text-white mb-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              No Connection Signals Detected
            </h3>
            <p className="text-[var(--grey-400)] text-sm mb-6 max-w-md mx-auto">
              Connection signals are detected during the intelligence pipeline. Run the pipeline from the Hub to discover entity relationships.
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
                      <Link2 className="w-4 h-4 text-[var(--burnt-orange)]" />
                      <h4
                        className="text-[0.95rem] font-medium text-white"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        {signal.signal_title}
                      </h4>
                      <span className={`px-2 py-0.5 text-[0.65rem] rounded border ${getImpactColor(signal.client_impact_level)}`}>
                        {signal.client_impact_level.toUpperCase()}
                      </span>
                      <span className="px-2 py-0.5 text-[0.65rem] rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        {signal.signal_maturity}
                      </span>
                    </div>

                    <p className="text-[var(--grey-400)] text-sm mb-3 line-clamp-2">
                      {signal.signal_description}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-[var(--grey-500)]">
                      <span>
                        <strong className="text-[var(--grey-300)]">Primary:</strong> {signal.primary_entity_name}
                      </span>
                      {signal.related_entities.length > 0 && (
                        <span>
                          <strong className="text-[var(--grey-300)]">Related:</strong> {signal.related_entities.map(e => e.name).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 ml-4">
                    <div className="text-right">
                      <div className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                        {Math.round(signal.strength_score)}
                      </div>
                      <div className="text-[0.65rem] text-[var(--grey-500)]">Strength</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                        {Math.round(signal.confidence_score)}
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

      {/* Signal Detail Modal */}
      {selectedSignal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8">
          <div className="bg-[var(--grey-900)] rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[var(--grey-800)] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 text-[0.65rem] rounded border ${getImpactColor(selectedSignal.client_impact_level)}`}>
                    {selectedSignal.client_impact_level.toUpperCase()} IMPACT
                  </span>
                  <span className="px-2 py-0.5 text-[0.65rem] rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    {selectedSignal.signal_maturity}
                  </span>
                </div>
                <h3
                  className="text-xl font-medium text-white"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {selectedSignal.signal_title}
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
              <div>
                <h4 className="text-[0.7rem] uppercase tracking-wide text-[var(--grey-500)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                  Description
                </h4>
                <p className="text-[var(--grey-300)]">{selectedSignal.signal_description}</p>
              </div>

              <div>
                <h4 className="text-[0.7rem] uppercase tracking-wide text-[var(--grey-500)] mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                  Entities Involved
                </h4>
                <div className="space-y-2">
                  <div className="p-3 bg-[var(--burnt-orange-muted)] rounded-lg border border-[var(--burnt-orange)]/30">
                    <span className="text-[0.75rem] font-medium text-[var(--burnt-orange)]">Primary: </span>
                    <span className="text-white">{selectedSignal.primary_entity_name}</span>
                  </div>
                  {selectedSignal.related_entities.map((entity, idx) => (
                    <div key={idx} className="p-3 bg-[var(--grey-800)] rounded-lg border border-[var(--grey-700)]">
                      <span className="text-[0.75rem] font-medium text-[var(--grey-400)]">Related: </span>
                      <span className="text-[var(--grey-200)]">{entity.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-[0.7rem] uppercase tracking-wide text-[var(--grey-500)] mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                  Pattern Details
                </h4>
                <div className="bg-[var(--grey-800)] rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[0.75rem] text-[var(--grey-500)]">Pattern Type:</span>
                      <span className="ml-2 font-medium text-white">
                        {selectedSignal.pattern_data.pattern_type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[0.75rem] text-[var(--grey-500)]">Mentions:</span>
                      <span className="ml-2 font-medium text-white">{selectedSignal.pattern_data.mention_count}</span>
                    </div>
                    <div>
                      <span className="text-[0.75rem] text-[var(--grey-500)]">Strength:</span>
                      <span className="ml-2 font-medium text-white">{Math.round(selectedSignal.strength_score)}/100</span>
                    </div>
                    <div>
                      <span className="text-[0.75rem] text-[var(--grey-500)]">Confidence:</span>
                      <span className="ml-2 font-medium text-white">{Math.round(selectedSignal.confidence_score)}/100</span>
                    </div>
                  </div>

                  {selectedSignal.pattern_data.triggers_matched && (
                    <div className="pt-3 border-t border-[var(--grey-700)]">
                      <div className="text-[0.75rem] text-[var(--grey-500)] mb-2">Triggers Matched:</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedSignal.pattern_data.triggers_matched.map((trigger, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 text-[0.7rem] bg-[var(--grey-900)] text-[var(--grey-300)] rounded border border-[var(--grey-700)]"
                          >
                            {trigger.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[var(--grey-800)] flex justify-end gap-3">
              <button
                onClick={() => setSelectedSignal(null)}
                className="px-4 py-2 text-[var(--grey-400)] hover:text-white transition-colors"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Close
              </button>
              {!selectedSignal.prediction_generated && (
                <button
                  className="px-4 py-2 bg-[var(--burnt-orange)] text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-[var(--burnt-orange-light)] transition-colors"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  <Zap className="w-4 h-4" />
                  Generate Prediction
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
