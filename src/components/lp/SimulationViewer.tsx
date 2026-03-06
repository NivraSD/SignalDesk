'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  Loader2,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Crosshair,
  Zap,
  BarChart3,
  MessageCircle,
  FileText,
  Eye,
  Shield,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Megaphone
} from 'lucide-react'

interface SimulationViewerProps {
  simulationId: string
  onBack?: () => void
}

interface Simulation {
  id: string
  scenario_id: string
  status: string
  rounds_completed: number
  stabilization_score: number
  dominant_narratives: string[]
  key_coalitions: any[]
  gaps_identified: string[]
  fulcrums: any[]
  entities: any[]
  created_at: string
  completed_at: string | null
  error: string | null
}

interface SimulationRound {
  id: string
  round_number: number
  entity_responses: any[]
  cross_analysis: any
  status: string
  started_at: string
  completed_at: string | null
}

const DECISION_COLORS: Record<string, string> = {
  respond: 'bg-blue-100 text-blue-700',
  counter: 'bg-red-100 text-red-700',
  amplify: 'bg-green-100 text-green-700',
  fill_gap: 'bg-purple-100 text-purple-700',
  differentiate: 'bg-amber-100 text-amber-700',
  build: 'bg-teal-100 text-teal-700',
  synthesize: 'bg-indigo-100 text-indigo-700',
  wait: 'bg-gray-100 text-gray-600',
  silent: 'bg-gray-50 text-gray-400'
}

const FULCRUM_COLORS: Record<string, string> = {
  validator_path: 'bg-blue-100 text-blue-700',
  unoccupied_position: 'bg-green-100 text-green-700',
  wedge_issue: 'bg-amber-100 text-amber-700',
  preemption: 'bg-red-100 text-red-700'
}

const FULCRUM_LABELS: Record<string, string> = {
  validator_path: 'Validator Path',
  unoccupied_position: 'Unoccupied Position',
  wedge_issue: 'Wedge Issue',
  preemption: 'Preemption'
}

const MOMENTUM_ICONS: Record<string, any> = {
  rising: TrendingUp,
  stable: Minus,
  falling: TrendingDown
}

export default function SimulationViewer({ simulationId, onBack }: SimulationViewerProps) {
  const [simulation, setSimulation] = useState<Simulation | null>(null)
  const [rounds, setRounds] = useState<SimulationRound[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedFulcrums, setExpandedFulcrums] = useState<Set<number>>(new Set())
  const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set())
  const [expandedEntities, setExpandedEntities] = useState<Set<string>>(new Set())
  const [watchConditions, setWatchConditions] = useState<any[]>([])
  const [processingOutput, setProcessingOutput] = useState(false)
  const [expandedPlaybooks, setExpandedPlaybooks] = useState<Set<string>>(new Set())

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [simRes, roundsRes] = await Promise.all([
        supabase
          .from('lp_simulations')
          .select('*')
          .eq('id', simulationId)
          .single(),
        supabase
          .from('lp_simulation_rounds')
          .select('*')
          .eq('simulation_id', simulationId)
          .order('round_number', { ascending: true })
      ])

      if (simRes.data) setSimulation(simRes.data)
      if (roundsRes.data) setRounds(roundsRes.data)
      setLoading(false)
    }
    load()
  }, [simulationId])

  // Load existing watch conditions + playbooks
  useEffect(() => {
    const loadWatchConditions = async () => {
      const { data } = await supabase
        .from('lp_watch_conditions')
        .select('*, lp_playbooks(*)')
        .eq('simulation_id', simulationId)
        .order('created_at', { ascending: true })
      if (data) setWatchConditions(data)
    }
    loadWatchConditions()
  }, [simulationId])

  // Build entity ID → name map from simulation.entities
  const entityMap = useMemo(() => {
    const map = new Map<string, string>()
    if (!simulation?.entities) return map
    for (const e of simulation.entities) {
      if (e.entity_id && e.entity_name) {
        map.set(e.entity_id, e.entity_name)
      }
    }
    return map
  }, [simulation?.entities])

  // Resolve UUID to name, falling back to the raw string
  const resolveEntity = (id: string): string => {
    if (!id) return 'Unknown'
    return entityMap.get(id) || id
  }

  // Resolve a list of entity IDs/names to display names
  const resolveEntities = (ids: string[]): string[] => {
    if (!ids) return []
    return ids.map(resolveEntity)
  }

  // Get the final round's cross_analysis
  const finalRound = rounds.length > 0 ? rounds[rounds.length - 1] : null
  const finalCrossAnalysis = finalRound?.cross_analysis

  // Gather evidence for a fulcrum from round data
  const getEvidenceForFulcrum = (fulcrum: any) => {
    const evidence: { roundNumber: number; entityName: string; summary: string; decision: string }[] = []
    const targetName = resolveEntity(fulcrum.target_entity || '')

    for (const round of rounds) {
      const responses = round.entity_responses || []
      const crossAnalysis = round.cross_analysis

      if (fulcrum.type === 'validator_path' && fulcrum.target_entity) {
        // Show target entity's responses across rounds
        const targetResp = responses.find((r: any) =>
          r.entity_id === fulcrum.target_entity || r.entity_name === targetName
        )
        if (targetResp) {
          evidence.push({
            roundNumber: round.round_number,
            entityName: targetResp.entity_name || resolveEntity(targetResp.entity_id),
            summary: targetResp.position_summary || targetResp.decision_rationale || '',
            decision: targetResp.response_decision || ''
          })
        }
        // Also show who cited them
        if (crossAnalysis?.influence_flows) {
          for (const flow of crossAnalysis.influence_flows) {
            if (flow.to === fulcrum.target_entity || flow.to_name === targetName) {
              evidence.push({
                roundNumber: round.round_number,
                entityName: `${resolveEntity(flow.from || flow.from_name)} cited ${targetName}`,
                summary: flow.mechanism || flow.description || '',
                decision: 'citation'
              })
            }
          }
        }
      } else if (fulcrum.type === 'wedge_issue') {
        // Show coalition members' diverging positions
        const coalitions = crossAnalysis?.coalitions || []
        for (const c of coalitions) {
          const members = c.members || []
          for (const memberId of members) {
            const resp = responses.find((r: any) =>
              r.entity_id === memberId || r.entity_name === memberId
            )
            if (resp) {
              evidence.push({
                roundNumber: round.round_number,
                entityName: resp.entity_name || resolveEntity(resp.entity_id),
                summary: resp.position_summary || '',
                decision: resp.response_decision || ''
              })
            }
          }
        }
      } else if (fulcrum.type === 'unoccupied_position') {
        // Show gap entries from cross_analysis
        const gaps = crossAnalysis?.gaps || []
        for (const gap of gaps) {
          if (gap.description?.toLowerCase().includes(fulcrum.description?.toLowerCase().slice(0, 30))) {
            evidence.push({
              roundNumber: round.round_number,
              entityName: 'Gap Analysis',
              summary: `${gap.description} (fillers: ${resolveEntities(gap.potential_fillers || []).join(', ')})`,
              decision: gap.strategic_value || ''
            })
          }
        }
      } else if (fulcrum.type === 'preemption' && fulcrum.target_entity) {
        // Show target entity's predicted reactions from latest round
        const targetResp = responses.find((r: any) =>
          r.entity_id === fulcrum.target_entity || r.entity_name === targetName
        )
        if (targetResp) {
          evidence.push({
            roundNumber: round.round_number,
            entityName: targetResp.entity_name || resolveEntity(targetResp.entity_id),
            summary: targetResp.position_summary || targetResp.decision_rationale || '',
            decision: targetResp.response_decision || ''
          })
        }
      }
    }

    // Deduplicate and limit
    const seen = new Set<string>()
    return evidence.filter(e => {
      const key = `${e.roundNumber}-${e.entityName}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }).slice(0, 12)
  }

  // Extract watch conditions from simulation
  const handleExtractWatchConditions = async () => {
    if (!simulation) return
    setProcessingOutput(true)
    try {
      const { data, error } = await supabase.functions.invoke('lp-output-processor', {
        body: { simulation_id: simulationId }
      })
      if (error) throw error
      // Reload watch conditions
      const { data: refreshed } = await supabase
        .from('lp_watch_conditions')
        .select('*, lp_playbooks(*)')
        .eq('simulation_id', simulationId)
        .order('created_at', { ascending: true })
      if (refreshed) setWatchConditions(refreshed)
      // Update simulation to reflect processed_at
      setSimulation(prev => prev ? { ...prev, processed_at: new Date().toISOString() } as any : prev)
    } catch (err: any) {
      console.error('Extract failed:', err)
    } finally {
      setProcessingOutput(false)
    }
  }

  const togglePlaybook = (id: string) => {
    setExpandedPlaybooks(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleFulcrum = (idx: number) => {
    setExpandedFulcrums(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const toggleRound = (roundNumber: number) => {
    setExpandedRounds(prev => {
      const next = new Set(prev)
      if (next.has(roundNumber)) next.delete(roundNumber)
      else next.add(roundNumber)
      return next
    })
  }

  const toggleEntity = (id: string) => {
    setExpandedEntities(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--burnt-orange)]" />
      </div>
    )
  }

  if (!simulation) {
    return (
      <div className="text-center py-12 text-gray-500 text-sm">
        Simulation not found.
        {onBack && (
          <button onClick={onBack} className="block mx-auto mt-3 text-[var(--burnt-orange)] hover:underline text-sm">
            Go back
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* ── REPORT HEADER ── */}
      <div className="flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="p-1.5 text-gray-400 hover:text-gray-600 rounded">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[var(--burnt-orange)]" />
            <h2 className="font-semibold" style={{ fontSize: '1.125rem', color: 'var(--charcoal)' }}>Simulation Report</h2>
            <span className={`px-2 py-0.5 text-[10px] rounded font-medium ${
              simulation.status === 'stabilized' ? 'bg-green-100 text-green-700' :
              simulation.status === 'max_rounds_reached' ? 'bg-amber-100 text-amber-700' :
              simulation.status === 'failed' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {simulation.status.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {simulation.rounds_completed} rounds · {simulation.entities?.length || 0} entities
            · Stabilization: {(simulation.stabilization_score * 100).toFixed(0)}%
            · {new Date(simulation.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* ── EXTRACT WATCH CONDITIONS BUTTON ── */}
      {['stabilized', 'max_rounds_reached'].includes(simulation.status) &&
       simulation.fulcrums?.length > 0 &&
       watchConditions.length === 0 && !(simulation as any).processed_at && (
        <button
          onClick={handleExtractWatchConditions}
          disabled={processingOutput}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-[var(--burnt-orange)]/30 hover:border-[var(--burnt-orange)]/60 hover:bg-[var(--burnt-orange)]/5 transition-all text-sm font-medium text-[var(--burnt-orange)] disabled:opacity-50"
        >
          {processingOutput ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Extracting watch conditions & playbooks...
            </>
          ) : (
            <>
              <Shield className="w-4 h-4" />
              Extract Watch Conditions & Playbooks
            </>
          )}
        </button>
      )}

      {/* Processed indicator */}
      {watchConditions.length > 0 && !processingOutput && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-100 text-xs text-green-700">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {watchConditions.length} watch condition{watchConditions.length !== 1 ? 's' : ''} extracted with playbooks
        </div>
      )}

      {/* ── KEY FINDINGS (FULCRUMS) ── */}
      {simulation.fulcrums && simulation.fulcrums.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Crosshair className="w-5 h-5 text-[var(--burnt-orange)]" />
            <h3 className="text-sm font-semibold text-[var(--charcoal)] uppercase tracking-wide">Key Findings</h3>
            <span className="px-1.5 py-0.5 text-[10px] rounded bg-[var(--burnt-orange)] text-white font-medium">
              {simulation.fulcrums.length}
            </span>
          </div>

          <div className="space-y-3">
            {simulation.fulcrums.map((f: any, i: number) => {
              const isExpanded = expandedFulcrums.has(i)
              const evidence = isExpanded ? getEvidenceForFulcrum(f) : []

              return (
                <div key={f.fulcrum_id || i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="p-4 space-y-3">
                    {/* Type + Description */}
                    <div className="flex items-start gap-2">
                      <span className={`px-2 py-0.5 text-[10px] rounded font-medium shrink-0 ${FULCRUM_COLORS[f.type] || 'bg-gray-100 text-gray-600'}`}>
                        {FULCRUM_LABELS[f.type] || f.type}
                      </span>
                      <p className="text-sm text-[var(--charcoal)] font-medium">{f.description}</p>
                    </div>

                    {/* Target entity — resolved to name */}
                    {f.target_entity && (
                      <p className="text-xs text-gray-500">
                        <strong>Target:</strong> {resolveEntity(f.target_entity)}
                      </p>
                    )}

                    {/* Rationale */}
                    <p className="text-xs text-gray-600">{f.rationale}</p>

                    {/* Effort/Impact/Confidence */}
                    <div className="flex items-center gap-3 text-xs">
                      <span className={`px-2 py-0.5 rounded ${
                        f.effort_level === 'low' ? 'bg-green-100 text-green-700' :
                        f.effort_level === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        Effort: {f.effort_level}
                      </span>
                      <span className={`px-2 py-0.5 rounded ${
                        f.impact_level === 'high' ? 'bg-green-100 text-green-700' :
                        f.impact_level === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        Impact: {f.impact_level}
                      </span>
                      <span className="text-gray-400">
                        Confidence: {(f.confidence * 100).toFixed(0)}%
                      </span>
                    </div>

                    {/* Cascade predictions */}
                    {f.cascade_prediction?.length > 0 && (
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Cascade Prediction</p>
                        <ul className="space-y-0.5">
                          {f.cascade_prediction.map((c: string, j: number) => (
                            <li key={j} className="text-xs text-gray-600 flex items-start gap-1.5">
                              <span className="text-[var(--burnt-orange)] mt-0.5">→</span>
                              {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Evidence toggle */}
                  <button
                    onClick={() => toggleFulcrum(i)}
                    className="w-full flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 border-t border-gray-100 transition-colors text-left"
                  >
                    <Eye className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-[11px] font-medium text-gray-500 flex-1">
                      {isExpanded ? 'Hide Evidence' : 'Show Evidence'}
                    </span>
                    {isExpanded
                      ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                      : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                    }
                  </button>

                  {/* Evidence content */}
                  {isExpanded && (
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 space-y-2">
                      {evidence.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">No matching evidence found in round data.</p>
                      ) : (
                        evidence.map((ev, j) => (
                          <div key={j} className="flex items-start gap-2 text-xs">
                            <span className="text-[10px] text-gray-400 font-mono shrink-0 mt-0.5">R{ev.roundNumber}</span>
                            <div className="flex-1">
                              <span className="font-medium text-[var(--charcoal)]">{ev.entityName}</span>
                              {ev.decision && ev.decision !== 'citation' && (
                                <span className={`ml-1.5 px-1 py-0.5 text-[9px] rounded ${DECISION_COLORS[ev.decision] || 'bg-gray-100 text-gray-600'}`}>
                                  {ev.decision.replace(/_/g, ' ')}
                                </span>
                              )}
                              {ev.summary && (
                                <p className="text-gray-500 mt-0.5">{ev.summary}</p>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── LANDSCAPE OVERVIEW ── */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-[var(--charcoal)] uppercase tracking-wide flex items-center gap-2">
          <Zap className="w-4 h-4 text-[var(--burnt-orange)]" />
          Landscape Overview
        </h3>

        {/* Dominant Narratives */}
        {simulation.dominant_narratives?.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Dominant Narratives</h4>
            <div className="flex flex-wrap gap-1.5">
              {simulation.dominant_narratives.map((n, i) => (
                <span key={i} className="px-2 py-1 text-xs bg-[var(--burnt-orange)]/10 text-[var(--burnt-orange)] rounded">
                  {n}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Coalitions — from final round's cross_analysis */}
        {finalCrossAnalysis?.coalitions?.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Coalitions</h4>
            <div className="space-y-3">
              {finalCrossAnalysis.coalitions.map((c: any, i: number) => (
                <div key={c.coalition_id || i} className="border border-gray-100 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[var(--burnt-orange)]" />
                    <span className="text-sm font-medium text-[var(--charcoal)]">{c.name}</span>
                    <span className={`px-1.5 py-0.5 text-[10px] rounded ${
                      c.stability === 'stable' ? 'bg-green-100 text-green-700' :
                      c.stability === 'forming' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {c.stability}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">{c.shared_position}</p>
                  <div className="flex flex-wrap gap-1">
                    {(c.members || []).map((m: string, j: number) => (
                      <span key={j} className="px-2 py-0.5 text-[10px] bg-gray-100 text-gray-700 rounded">
                        {resolveEntity(m)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gaps — from final round's cross_analysis */}
        {finalCrossAnalysis?.gaps?.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Strategic Gaps</h4>
            <div className="space-y-2">
              {finalCrossAnalysis.gaps.map((g: any, i: number) => (
                <div key={g.gap_id || i} className="border border-gray-100 rounded-lg p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className={`px-1.5 py-0.5 text-[10px] rounded font-medium shrink-0 ${
                      g.strategic_value === 'high' ? 'bg-green-100 text-green-700' :
                      g.strategic_value === 'medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {g.strategic_value} value
                    </span>
                    <p className="text-sm text-[var(--charcoal)]">{g.description}</p>
                  </div>
                  {g.potential_fillers?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <span className="text-[10px] text-gray-400 mr-1">Potential fillers:</span>
                      {g.potential_fillers.map((filler: string, j: number) => (
                        <span key={j} className="px-1.5 py-0.5 text-[10px] bg-purple-50 text-purple-700 rounded">
                          {resolveEntity(filler)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── INFLUENCE MAP ── */}
      {finalCrossAnalysis?.influence_rankings?.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-[var(--charcoal)] uppercase tracking-wide flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[var(--burnt-orange)]" />
            Influence Rankings
          </h3>
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            {(() => {
              const rankings = [...(finalCrossAnalysis.influence_rankings || [])].sort((a: any, b: any) => b.score - a.score)
              const maxScore = rankings[0]?.score || 1
              // Get final round entity responses for rationale
              const finalResponses = finalRound?.entity_responses || []
              // Check if entity is a fulcrum target
              const fulcrumTargets = new Map<string, string>()
              for (const f of (simulation.fulcrums || [])) {
                if (f.target_entity) fulcrumTargets.set(f.target_entity, f.type)
              }

              return rankings.map((r: any, i: number) => {
                // Find this entity's final-round response
                const entityResp = finalResponses.find((resp: any) =>
                  resp.entity_id === r.entity_id || resp.entity_name === r.entity_name
                )
                const fulcrumType = fulcrumTargets.get(r.entity_id) || fulcrumTargets.get(r.entity_name)

                // Build rationale pieces
                const rationale: string[] = []
                if (r.citations_received > 0) {
                  rationale.push(`Referenced by ${r.citations_received} other entit${r.citations_received === 1 ? 'y' : 'ies'}`)
                }
                if (r.frames_adopted > 0) {
                  rationale.push(`${r.frames_adopted} of their themes adopted by others`)
                }
                if (entityResp?.response_decision && !['silent', 'wait'].includes(entityResp.response_decision)) {
                  rationale.push(`Chose to ${entityResp.response_decision.replace(/_/g, ' ')}`)
                }
                if (r.citations_received === 0 && r.frames_adopted === 0) {
                  rationale.push(entityResp?.response_decision === 'silent' || entityResp?.response_decision === 'wait'
                    ? 'Stayed on sidelines this round'
                    : 'Active but not yet cited by others')
                }

                return (
                  <div key={r.entity_id || i} className="p-3 border border-gray-100 rounded-lg space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-5 text-right font-mono shrink-0">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-[var(--charcoal)]">
                            {r.entity_name || resolveEntity(r.entity_id)}
                          </span>
                          {fulcrumType && (
                            <span className={`px-1.5 py-0.5 text-[9px] rounded font-medium ${FULCRUM_COLORS[fulcrumType] || 'bg-gray-100 text-gray-600'}`}>
                              {FULCRUM_LABELS[fulcrumType] || fulcrumType}
                            </span>
                          )}
                          {entityResp?.response_decision && (
                            <span className={`px-1.5 py-0.5 text-[9px] rounded font-medium ${DECISION_COLORS[entityResp.response_decision] || 'bg-gray-100 text-gray-600'}`}>
                              {entityResp.response_decision.replace(/_/g, ' ')}
                            </span>
                          )}
                          <span className="ml-auto text-xs text-gray-500 shrink-0">{r.score?.toFixed(1)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[var(--burnt-orange)] rounded-full transition-all"
                            style={{ width: `${maxScore > 0 ? (r.score / maxScore) * 100 : 0}%` }}
                          />
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400">
                          <span>{r.citations_received || 0} citations</span>
                          <span>{r.frames_adopted || 0} frames adopted</span>
                        </div>
                      </div>
                    </div>
                    {/* Rationale */}
                    <p className="text-[11px] text-gray-500 ml-8">
                      {rationale.join(' · ')}
                    </p>
                    {/* Position summary from final round */}
                    {entityResp?.position_summary && (
                      <p className="text-xs text-gray-600 ml-8 italic">
                        "{entityResp.position_summary}"
                      </p>
                    )}
                    {/* Themes */}
                    {entityResp?.themes_championed?.length > 0 && (
                      <div className="flex flex-wrap gap-1 ml-8">
                        {entityResp.themes_championed.map((t: string, j: number) => (
                          <span key={j} className="px-1.5 py-0.5 text-[9px] bg-[var(--burnt-orange)]/10 text-[var(--burnt-orange)] rounded">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })
            })()}
          </div>
        </section>
      )}

      {/* ── WATCH CONDITIONS & PLAYBOOKS ── */}
      {watchConditions.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[var(--burnt-orange)]" />
            <h3 className="text-sm font-semibold text-[var(--charcoal)] uppercase tracking-wide">
              Watch Conditions & Playbooks
            </h3>
            <span className="px-1.5 py-0.5 text-[10px] rounded bg-[var(--burnt-orange)] text-white font-medium">
              {watchConditions.length}
            </span>
          </div>

          <div className="space-y-3">
            {watchConditions.map((wc: any) => {
              const playbook = wc.lp_playbooks?.[0]
              const isPlaybookExpanded = expandedPlaybooks.has(wc.id)

              return (
                <div key={wc.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="p-4 space-y-3">
                    {/* Fulcrum type badge + condition */}
                    <div className="flex items-start gap-2">
                      <span className={`px-2 py-0.5 text-[10px] rounded font-medium shrink-0 ${FULCRUM_COLORS[wc.fulcrum_type] || 'bg-gray-100 text-gray-600'}`}>
                        {FULCRUM_LABELS[wc.fulcrum_type] || wc.fulcrum_type}
                      </span>
                      <p className="text-sm text-[var(--charcoal)] font-medium">{wc.condition_text}</p>
                    </div>

                    {/* Context */}
                    {wc.condition_context && (
                      <p className="text-xs text-gray-600">{wc.condition_context}</p>
                    )}

                    {/* Target + confidence + status */}
                    <div className="flex items-center gap-3 text-xs flex-wrap">
                      {wc.target_entity && (
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                          Target: {wc.target_entity}
                        </span>
                      )}
                      {wc.confidence && (
                        <span className="text-gray-400">
                          Confidence: {(wc.confidence * 100).toFixed(0)}%
                        </span>
                      )}
                      {wc.effort_level && (
                        <span className={`px-2 py-0.5 rounded ${
                          wc.effort_level === 'low' ? 'bg-green-100 text-green-700' :
                          wc.effort_level === 'medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          Effort: {wc.effort_level}
                        </span>
                      )}
                      {wc.impact_level && (
                        <span className={`px-2 py-0.5 rounded ${
                          wc.impact_level === 'high' ? 'bg-green-100 text-green-700' :
                          wc.impact_level === 'medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          Impact: {wc.impact_level}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        wc.status === 'active' ? 'bg-blue-100 text-blue-700' :
                        wc.status === 'triggered' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {wc.status}
                      </span>
                    </div>
                  </div>

                  {/* Playbook toggle */}
                  {playbook && (
                    <>
                      <button
                        onClick={() => togglePlaybook(wc.id)}
                        className="w-full flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 border-t border-gray-100 transition-colors text-left"
                      >
                        <Megaphone className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-[11px] font-medium text-gray-500 flex-1">
                          {isPlaybookExpanded ? 'Hide Playbook' : 'View Playbook'}
                          <span className="ml-1.5 text-gray-400">— {playbook.title}</span>
                        </span>
                        {isPlaybookExpanded
                          ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                          : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                        }
                      </button>

                      {isPlaybookExpanded && (
                        <div className="px-4 py-4 bg-gray-50 border-t border-gray-100 space-y-4">
                          {/* Urgency + title */}
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-[10px] rounded font-medium ${
                              playbook.response_urgency === 'immediate' ? 'bg-red-100 text-red-700' :
                              playbook.response_urgency === 'hours' ? 'bg-amber-100 text-amber-700' :
                              playbook.response_urgency === 'days' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {playbook.response_urgency}
                            </span>
                            <h4 className="text-sm font-semibold text-[var(--charcoal)]">{playbook.title}</h4>
                          </div>

                          {/* Headline response */}
                          {playbook.headline_response && (
                            <div>
                              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Headline Response</p>
                              <p className="text-sm text-[var(--charcoal)] bg-white p-3 rounded-lg border border-gray-200 italic">
                                "{playbook.headline_response}"
                              </p>
                            </div>
                          )}

                          {/* Talking points */}
                          {playbook.talking_points?.length > 0 && (
                            <div>
                              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Talking Points</p>
                              <ul className="space-y-1">
                                {playbook.talking_points.map((tp: string, j: number) => (
                                  <li key={j} className="text-xs text-gray-700 flex items-start gap-1.5">
                                    <span className="text-[var(--burnt-orange)] mt-0.5 shrink-0">•</span>
                                    {tp}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Positioning */}
                          {playbook.positioning_statement && (
                            <div>
                              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Positioning</p>
                              <p className="text-xs text-gray-700">{playbook.positioning_statement}</p>
                            </div>
                          )}

                          {/* Media angle */}
                          {playbook.media_angle && (
                            <div>
                              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Media Angle</p>
                              <p className="text-xs text-gray-700">{playbook.media_angle}</p>
                            </div>
                          )}

                          {/* Social draft */}
                          {playbook.social_draft && (
                            <div>
                              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Social Draft</p>
                              <p className="text-xs text-[var(--charcoal)] bg-white p-3 rounded-lg border border-gray-200">
                                {playbook.social_draft}
                              </p>
                            </div>
                          )}

                          {/* Sequence notes */}
                          {playbook.sequence_notes && (
                            <div>
                              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Execution Sequence</p>
                              <p className="text-xs text-gray-600">{playbook.sequence_notes}</p>
                            </div>
                          )}

                          {/* Cascade predictions */}
                          {playbook.cascade_prediction?.length > 0 && (
                            <div>
                              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Cascade Prediction</p>
                              <ul className="space-y-0.5">
                                {playbook.cascade_prediction.map((c: string, j: number) => (
                                  <li key={j} className="text-xs text-gray-600 flex items-start gap-1.5">
                                    <span className="text-[var(--burnt-orange)] mt-0.5">→</span>
                                    {c}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── ROUND-BY-ROUND PROGRESSION ── */}
      {rounds.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-[var(--charcoal)] uppercase tracking-wide flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-[var(--burnt-orange)]" />
            Round-by-Round Progression
          </h3>

          <div className="space-y-2">
            {rounds.map(round => {
              const isExpanded = expandedRounds.has(round.round_number)
              const crossAnalysis = round.cross_analysis
              const stabScore = crossAnalysis?.stabilization_score

              return (
                <div key={round.round_number} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {/* Round header — clickable accordion */}
                  <button
                    onClick={() => toggleRound(round.round_number)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <span className="text-sm font-semibold text-[var(--burnt-orange)] w-16 shrink-0">
                      Round {round.round_number}
                    </span>
                    <div className="flex-1 flex items-center gap-2 overflow-hidden">
                      <span className="text-xs text-gray-500">
                        {(round.entity_responses || []).length} responses
                      </span>
                      {crossAnalysis?.themes?.length > 0 && (
                        <span className="text-xs text-gray-400">
                          · {crossAnalysis.themes.length} themes
                        </span>
                      )}
                      {stabScore != null && (
                        <span className="text-xs text-gray-400">
                          · stab: {(stabScore * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                    {isExpanded
                      ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                      : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                    }
                  </button>

                  {/* Expanded round content */}
                  {isExpanded && (
                    <div className="border-t border-gray-100">
                      {/* Entity Responses */}
                      <div className="p-4 space-y-2">
                        <h5 className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Entity Responses</h5>
                        {(round.entity_responses || []).length === 0 ? (
                          <p className="text-xs text-gray-400 italic">No entity responses.</p>
                        ) : (
                          round.entity_responses.map((resp: any) => {
                            const entityKey = `${round.round_number}-${resp.entity_id}`
                            const expanded = expandedEntities.has(entityKey)
                            return (
                              <div key={resp.entity_id} className="border border-gray-200 rounded-lg overflow-hidden">
                                <button
                                  onClick={() => toggleEntity(entityKey)}
                                  className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                                >
                                  <span className="text-sm font-medium text-[var(--charcoal)] flex-1">
                                    {resp.entity_name || resolveEntity(resp.entity_id)}
                                  </span>
                                  <span className={`px-1.5 py-0.5 text-[10px] rounded font-medium ${DECISION_COLORS[resp.response_decision] || 'bg-gray-100 text-gray-600'}`}>
                                    {resp.response_decision?.replace(/_/g, ' ')}
                                  </span>
                                  {expanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                                </button>
                                {expanded && (
                                  <div className="px-3 py-3 space-y-2 text-xs">
                                    <p className="text-gray-700">{resp.position_summary}</p>
                                    {resp.key_claims?.length > 0 && (
                                      <div>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Key Claims</p>
                                        <ul className="space-y-0.5">
                                          {resp.key_claims.map((c: string, idx: number) => (
                                            <li key={idx} className="text-gray-600 flex items-start gap-1.5">
                                              <span className="text-gray-300 mt-0.5">•</span>{c}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    {resp.decision_rationale && (
                                      <p className="text-gray-500 italic">
                                        <strong className="not-italic text-gray-600">Rationale:</strong> {resp.decision_rationale}
                                      </p>
                                    )}
                                    {resp.themes_championed?.length > 0 && (
                                      <div className="flex flex-wrap gap-1">
                                        {resp.themes_championed.map((t: string, idx: number) => (
                                          <span key={idx} className="px-1.5 py-0.5 text-[10px] bg-[var(--burnt-orange)]/10 text-[var(--burnt-orange)] rounded">
                                            {t}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })
                        )}
                      </div>

                      {/* Themes */}
                      {crossAnalysis?.themes?.length > 0 && (
                        <div className="px-4 pb-4 space-y-2">
                          <h5 className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Themes</h5>
                          {crossAnalysis.themes.map((theme: any, i: number) => {
                            const MomentumIcon = MOMENTUM_ICONS[theme.momentum] || Minus
                            return (
                              <div key={i} className="flex items-start gap-2 p-2 border border-gray-100 rounded-lg">
                                <MomentumIcon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                                  theme.momentum === 'rising' ? 'text-green-500' :
                                  theme.momentum === 'falling' ? 'text-red-500' :
                                  'text-gray-400'
                                }`} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-[var(--charcoal)]">{theme.theme}</p>
                                  <p className="text-[10px] text-gray-500">
                                    Owner: {theme.owner}
                                    {theme.adopters?.length > 0 && ` · Adopted by ${theme.adopters.join(', ')}`}
                                  </p>
                                </div>
                                <span className={`px-1.5 py-0.5 text-[9px] rounded shrink-0 ${
                                  theme.momentum === 'rising' ? 'bg-green-100 text-green-700' :
                                  theme.momentum === 'falling' ? 'bg-red-100 text-red-700' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  {theme.momentum}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
