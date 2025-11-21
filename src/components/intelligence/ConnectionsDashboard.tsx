'use client'

import { useState, useEffect } from 'react'
import { ConnectionService } from '@/lib/services/connectionService'
import type {
  ConnectionSignal,
  EntityConnection,
  EntityNetworkActivity,
  StrongConnection
} from '@/lib/types/connections'

interface ConnectionsDashboardProps {
  organizationId: string
  organizationName: string
  industry?: string
}

export function ConnectionsDashboard({
  organizationId,
  organizationName,
  industry
}: ConnectionsDashboardProps) {
  const [signals, setSignals] = useState<ConnectionSignal[]>([])
  const [connections, setConnections] = useState<EntityConnection[]>([])
  const [strongConnections, setStrongConnections] = useState<StrongConnection[]>([])
  const [networkActivity, setNetworkActivity] = useState<EntityNetworkActivity[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSignal, setSelectedSignal] = useState<ConnectionSignal | null>(null)
  const [filter, setFilter] = useState<'all' | 'high_impact' | 'emerging'>('all')

  useEffect(() => {
    loadConnectionData()
  }, [organizationId])

  async function loadConnectionData() {
    setLoading(true)
    try {
      const [signalsData, connectionsData, strongConnsData, networkData, statsData] = await Promise.all([
        ConnectionService.getConnectionSignals(organizationId),
        ConnectionService.getEntityConnections(organizationId, 50),
        ConnectionService.getStrongConnections(organizationId),
        ConnectionService.getEntityNetworkActivity(organizationId),
        ConnectionService.getConnectionStats(organizationId)
      ])

      setSignals(signalsData)
      setConnections(connectionsData)
      setStrongConnections(strongConnsData)
      setNetworkActivity(networkData)
      setStats(statsData)
    } catch (error) {
      console.error('Failed to load connection data:', error)
    } finally {
      setLoading(false)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Connection Intelligence</h2>
        <p className="text-gray-600">
          Industry-aware detection of relationships and patterns between entities
          {industry && <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">{industry}</span>}
        </p>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Connection Signals</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{stats.totalSignals}</div>
            <div className="mt-2 text-sm text-red-600">{stats.signalsNeedingAttention} need attention</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Entity Connections</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{stats.totalConnections}</div>
            <div className="mt-2 text-sm text-green-600">{stats.strongConnections} strong connections</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Avg Signal Strength</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{Math.round(stats.avgSignalStrength)}</div>
            <div className="mt-2 text-sm text-gray-600">out of 100</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">High Impact Signals</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{stats.highImpactSignals}</div>
            <div className="mt-2 text-sm text-orange-600">Require immediate review</div>
          </div>
        </div>
      )}

      {/* Connection Signals */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Connection Signals</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('high_impact')}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  filter === 'high_impact'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                High Impact
              </button>
              <button
                onClick={() => setFilter('emerging')}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  filter === 'emerging'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Emerging
              </button>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredSignals.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No connection signals detected yet. Run the monitoring pipeline to detect patterns.
            </div>
          ) : (
            filteredSignals.map((signal) => (
              <div
                key={signal.id}
                className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setSelectedSignal(signal)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-lg font-medium text-gray-900">{signal.signal_title}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        signal.client_impact_level === 'critical' ? 'bg-red-100 text-red-800' :
                        signal.client_impact_level === 'high' ? 'bg-orange-100 text-orange-800' :
                        signal.client_impact_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {signal.client_impact_level}
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        {signal.signal_maturity}
                      </span>
                    </div>

                    <p className="text-gray-600 mb-3">{signal.signal_description}</p>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">Primary:</span> {signal.primary_entity_name}
                      </div>
                      {signal.related_entities.length > 0 && (
                        <div className="text-sm text-gray-500">
                          <span className="font-medium">Related:</span> {signal.related_entities.map(e => e.name).join(', ')}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Strength:</span>
                        <span className="ml-2 font-medium text-gray-900">{Math.round(signal.strength_score)}/100</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Confidence:</span>
                        <span className="ml-2 font-medium text-gray-900">{Math.round(signal.confidence_score)}/100</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Pattern:</span>
                        <span className="ml-2 font-medium text-gray-900">{signal.signal_type.replace(/_/g, ' ')}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Mentions:</span>
                        <span className="ml-2 font-medium text-gray-900">{signal.pattern_data.mention_count}</span>
                      </div>
                    </div>
                  </div>

                  <div className="ml-4">
                    {!signal.prediction_generated && (
                      <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                        Generate Prediction
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Entity Network Activity */}
      {networkActivity.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Entity Network Activity</h3>
          </div>

          <div className="divide-y divide-gray-200">
            {networkActivity.map((entity) => (
              <div key={entity.entity_name} className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-medium text-gray-900">{entity.entity_name}</h4>
                  <span className="text-sm text-gray-500">
                    {entity.total_connections} connections
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Avg Strength</div>
                    <div className="font-medium text-gray-900">{Math.round(entity.avg_connection_strength)}/100</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Strong Connections</div>
                    <div className="font-medium text-gray-900">{entity.strong_connections}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Connection Types</div>
                    <div className="font-medium text-gray-900">{entity.connection_types.join(', ')}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Signal Detail Modal */}
      {selectedSignal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedSignal.signal_title}</h3>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      selectedSignal.client_impact_level === 'critical' ? 'bg-red-100 text-red-800' :
                      selectedSignal.client_impact_level === 'high' ? 'bg-orange-100 text-orange-800' :
                      selectedSignal.client_impact_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedSignal.client_impact_level} impact
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                      {selectedSignal.signal_maturity}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSignal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                <p className="text-gray-600">{selectedSignal.signal_description}</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Entities Involved</h4>
                <div className="space-y-2">
                  <div className="p-3 bg-blue-50 rounded">
                    <span className="font-medium text-blue-900">Primary: </span>
                    <span className="text-blue-700">{selectedSignal.primary_entity_name}</span>
                  </div>
                  {selectedSignal.related_entities.map((entity, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded">
                      <span className="font-medium text-gray-900">Related: </span>
                      <span className="text-gray-700">{entity.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Pattern Details</h4>
                <div className="bg-gray-50 rounded p-4 space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Pattern Type:</span>
                      <span className="ml-2 font-medium">{selectedSignal.pattern_data.pattern_type.replace(/_/g, ' ')}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Mention Count:</span>
                      <span className="ml-2 font-medium">{selectedSignal.pattern_data.mention_count}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Strength:</span>
                      <span className="ml-2 font-medium">{Math.round(selectedSignal.strength_score)}/100</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Confidence:</span>
                      <span className="ml-2 font-medium">{Math.round(selectedSignal.confidence_score)}/100</span>
                    </div>
                  </div>

                  {selectedSignal.pattern_data.triggers_matched && (
                    <div className="mt-3">
                      <div className="text-sm text-gray-500 mb-2">Triggers Matched:</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedSignal.pattern_data.triggers_matched.map((trigger, idx) => (
                          <span key={idx} className="px-2 py-1 bg-white text-gray-700 rounded text-xs border border-gray-200">
                            {trigger.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setSelectedSignal(null)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                >
                  Close
                </button>
                {!selectedSignal.prediction_generated && (
                  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    Generate Prediction
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
