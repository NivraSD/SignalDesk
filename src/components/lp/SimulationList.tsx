'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAppStore } from '@/stores/useAppStore'
import {
  Loader2,
  Zap,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  Trash2,
  Play,
  FileText
} from 'lucide-react'

interface SimulationListProps {
  onSelect: (simulationId: string) => void
  onNewSimulation: () => void
  onRunSimulation?: (scenarioId: string) => void
}

interface PendingScenario {
  id: string
  type: string
  scenario_data: any
  status: string
  created_at: string
}

interface SimulationSummary {
  id: string
  scenario_id: string
  status: string
  rounds_completed: number
  stabilization_score: number
  dominant_narratives: string[]
  fulcrums: any[]
  entities: any[]
  created_at: string
  completed_at: string | null
  error: string | null
  scenario?: {
    type: string
    action: { what: string; rationale?: string[] }
    stakeholder_seed?: any[]
  } | null
}

const STATUS_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  initializing: { icon: Clock, color: 'bg-gray-100 text-gray-600', label: 'Initializing' },
  running: { icon: Loader2, color: 'bg-blue-100 text-blue-700', label: 'Running' },
  analyzing: { icon: Loader2, color: 'bg-blue-100 text-blue-700', label: 'Analyzing' },
  stabilized: { icon: CheckCircle, color: 'bg-green-100 text-green-700', label: 'Stabilized' },
  max_rounds_reached: { icon: AlertTriangle, color: 'bg-amber-100 text-amber-700', label: 'Max Rounds' },
  failed: { icon: XCircle, color: 'bg-red-100 text-red-700', label: 'Failed' }
}

export default function SimulationList({ onSelect, onNewSimulation, onRunSimulation }: SimulationListProps) {
  const organization = useAppStore(s => s.organization)
  const [simulations, setSimulations] = useState<SimulationSummary[]>([])
  const [pendingScenarios, setPendingScenarios] = useState<PendingScenario[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deletingScenario, setDeletingScenario] = useState<string | null>(null)

  const deleteScenario = async (e: React.MouseEvent, scenarioId: string) => {
    e.stopPropagation()
    if (!confirm('Delete this scenario?')) return
    setDeletingScenario(scenarioId)
    try {
      await supabase.from('lp_scenarios').delete().eq('id', scenarioId)
      setPendingScenarios(prev => prev.filter(s => s.id !== scenarioId))
    } catch (err) {
      console.error('Delete scenario failed:', err)
    } finally {
      setDeletingScenario(null)
    }
  }

  const deleteSimulation = async (e: React.MouseEvent, simId: string) => {
    e.stopPropagation()
    if (!confirm('Delete this simulation?')) return
    setDeleting(simId)
    try {
      // Delete rounds first (FK dependency)
      await supabase.from('lp_simulation_rounds').delete().eq('simulation_id', simId)
      await supabase.from('lp_simulations').delete().eq('id', simId)
      setSimulations(prev => prev.filter(s => s.id !== simId))
    } catch (err) {
      console.error('Delete failed:', err)
    } finally {
      setDeleting(null)
    }
  }

  useEffect(() => {
    if (!organization?.id) {
      setSimulations([])
      setLoading(false)
      return
    }

    const load = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('lp_simulations')
        .select('id, scenario_id, status, rounds_completed, stabilization_score, dominant_narratives, fulcrums, entities, created_at, completed_at, error')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (data && !error) {
        // Fetch scenario details for each simulation
        const scenarioIds = [...new Set(data.map(s => s.scenario_id).filter(Boolean))]
        if (scenarioIds.length > 0) {
          const { data: scenarios } = await supabase
            .from('lp_scenarios')
            .select('id, type, scenario_data')
            .in('id', scenarioIds)

          const scenarioMap = new Map((scenarios || []).map(s => [s.id, s]))
          for (const sim of data) {
            const sc = scenarioMap.get(sim.scenario_id)
            ;(sim as any).scenario = sc ? { type: sc.type, action: sc.scenario_data?.action, stakeholder_seed: sc.scenario_data?.stakeholder_seed } : null
          }
        }
        setSimulations(data as SimulationSummary[])

        // Find pending scenarios (ready but no simulation yet)
        const simulatedScenarioIds = new Set(data.map(s => s.scenario_id))
        const { data: readyScenarios } = await supabase
          .from('lp_scenarios')
          .select('id, type, scenario_data, status, created_at')
          .eq('organization_id', organization.id)
          .eq('status', 'ready')
          .order('created_at', { ascending: false })
          .limit(10)

        if (readyScenarios) {
          const pending = readyScenarios.filter(s => !simulatedScenarioIds.has(s.id))
          setPendingScenarios(pending)
        }
      }
      setLoading(false)
    }
    load()
  }, [organization?.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--burnt-orange)]" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="w-6 h-6 text-[var(--burnt-orange)]" />
          <div>
            <h2 className="font-semibold" style={{ fontSize: '1.125rem', color: 'var(--charcoal)' }}>Simulations</h2>
            <p className="text-sm text-gray-500">
              LP simulation results and history
            </p>
          </div>
        </div>
        <button
          onClick={onNewSimulation}
          className="px-3 py-1.5 bg-[var(--burnt-orange)] hover:bg-[var(--terracotta)] text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          New Simulation
        </button>
      </div>

      {/* Empty state */}
      {simulations.length === 0 && pendingScenarios.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
            <Zap className="w-6 h-6 text-gray-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--charcoal)]">No Simulations Yet</h3>
            <p className="text-xs text-gray-500 mt-1">
              Build a scenario first, then run a simulation to see how stakeholders react.
            </p>
          </div>
          <button
            onClick={onNewSimulation}
            className="px-4 py-2 bg-[var(--burnt-orange)] hover:bg-[var(--terracotta)] text-white rounded-lg text-sm font-medium transition-colors"
          >
            Go to Scenario Builder
          </button>
        </div>
      )}

      {/* Pending scenarios (ready but not yet simulated) */}
      {pendingScenarios.length > 0 && onRunSimulation && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 px-1">
            Ready to Simulate
          </h3>
          {pendingScenarios.map(sc => (
            <div
              key={sc.id}
              className="bg-amber-50 rounded-xl border border-amber-200 p-4 flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-[var(--charcoal)] truncate">
                  {sc.scenario_data?.action?.what || 'Untitled Scenario'}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="px-2 py-0.5 text-[10px] rounded font-medium bg-amber-100 text-amber-700">
                    Pending
                  </span>
                  {sc.type && (
                    <span className="px-2 py-0.5 text-[10px] rounded bg-gray-100 text-gray-500">
                      {sc.type.replace(/_/g, ' ')}
                    </span>
                  )}
                  <span className="text-[10px] text-gray-400">
                    {new Date(sc.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => deleteScenario(e, sc.id)}
                disabled={deletingScenario === sc.id}
                className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Delete scenario"
              >
                {deletingScenario === sc.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => onRunSimulation(sc.id)}
                className="px-3 py-1.5 bg-[var(--burnt-orange)] hover:bg-[var(--terracotta)] text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <Play className="w-3 h-3" />
                Run
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Simulation list */}
      {simulations.length > 0 && (
        <div className="space-y-2">
          {simulations.map(sim => {
            const statusConf = STATUS_CONFIG[sim.status] || STATUS_CONFIG.failed
            const StatusIcon = statusConf.icon
            const entityCount = sim.entities?.length || 0
            const fulcrumCount = sim.fulcrums?.length || 0

            return (
              <button
                key={sim.id}
                onClick={() => onSelect(sim.id)}
                className="w-full bg-white rounded-xl border border-gray-200 hover:border-gray-300 p-4 text-left transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Scenario title */}
                    <h3 className="text-sm font-semibold text-[var(--charcoal)] mb-1 truncate">
                      {sim.scenario?.action?.what || sim.scenario?.action?.trigger_description || 'Untitled Scenario'}
                    </h3>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 text-[10px] rounded font-medium ${statusConf.color}`}>
                        {statusConf.label}
                      </span>
                      {sim.scenario?.type && (
                        <span className="px-2 py-0.5 text-[10px] rounded bg-gray-100 text-gray-500">
                          {sim.scenario.type.replace(/_/g, ' ')}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {sim.rounds_completed} round{sim.rounds_completed !== 1 ? 's' : ''}
                      </span>
                      {entityCount > 0 && (
                        <span className="text-xs text-gray-400">· {entityCount} entities</span>
                      )}
                      {fulcrumCount > 0 && (
                        <span className="text-xs text-[var(--burnt-orange)]">· {fulcrumCount} fulcrum{fulcrumCount !== 1 ? 's' : ''}</span>
                      )}
                    </div>

                    {/* Dominant narratives preview */}
                    {sim.dominant_narratives?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {sim.dominant_narratives.slice(0, 3).map((n, i) => (
                          <span key={i} className="px-1.5 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded">
                            {n}
                          </span>
                        ))}
                        {sim.dominant_narratives.length > 3 && (
                          <span className="text-[10px] text-gray-400">+{sim.dominant_narratives.length - 3} more</span>
                        )}
                      </div>
                    )}

                    <p className="text-[10px] text-gray-400 mt-1">
                      {new Date(sim.created_at).toLocaleString()}
                      {sim.stabilization_score > 0 && ` · ${(sim.stabilization_score * 100).toFixed(0)}% stabilization`}
                    </p>
                  </div>
                  <button
                    onClick={(e) => deleteSimulation(e, sim.id)}
                    disabled={deleting === sim.id}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete simulation"
                  >
                    {deleting === sim.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
