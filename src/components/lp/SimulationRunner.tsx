'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  Play,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Zap,
  Users,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Check,
  Search,
  Plus,
  X
} from 'lucide-react'
import { ENTITY_DATABASE, formatEntityName } from './entityDatabase'

interface SimulationRunnerProps {
  scenarioId: string
  organizationId: string
  onComplete?: (simulationId: string) => void
  onCancel?: () => void
}

interface SimulationProgress {
  id: string
  status: string
  rounds_completed: number
  stabilization_score: number
  entities: any[]
  error?: string | null
  created_at: string
  completed_at?: string | null
}


export default function SimulationRunner({
  scenarioId,
  organizationId,
  onComplete,
  onCancel
}: SimulationRunnerProps) {
  const [state, setState] = useState<'idle' | 'selecting' | 'starting' | 'running' | 'complete' | 'failed'>('selecting')
  const [simulationId, setSimulationId] = useState<string | null>(null)
  const [progress, setProgress] = useState<SimulationProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)
  const invokeRef = useRef(false)

  // Entity selection state — the user's custom list
  const [selectedEntities, setSelectedEntities] = useState<Map<string, { name: string; hasProfile: boolean }>>(new Map())
  const [loadingEntities, setLoadingEntities] = useState(false)

  // All built profiles (global, not org-scoped)
  const [globalProfiles, setGlobalProfiles] = useState<Set<string>>(new Set())

  // Intelligence targets for this org
  const [intelTargets, setIntelTargets] = useState<{ name: string; type: string }[]>([])

  // Search
  const [browserSearch, setBrowserSearch] = useState('')
  const [expandedBrowserGroups, setExpandedBrowserGroups] = useState<Set<string>>(new Set())

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // Load intel targets + global profiles when entering selection
  useEffect(() => {
    if (state !== 'selecting') return

    const load = async () => {
      setLoadingEntities(true)

      const [profilesRes, targetsRes] = await Promise.all([
        supabase
          .from('lp_entity_profiles')
          .select('entity_name'),
        supabase
          .from('intelligence_targets')
          .select('name, type')
          .eq('organization_id', organizationId)
          .eq('active', true)
      ])

      const profileNames = new Set((profilesRes.data || []).map(p => p.entity_name.toLowerCase()))
      setGlobalProfiles(profileNames)

      const targets = (targetsRes.data || []) as { name: string; type: string }[]
      setIntelTargets(targets)

      // Pre-select intel targets that have built profiles
      const preselected = new Map<string, { name: string; hasProfile: boolean }>()
      for (const t of targets) {
        const has = profileNames.has(t.name.toLowerCase())
        if (has) {
          preselected.set(t.name.toLowerCase(), { name: t.name, hasProfile: true })
        }
      }
      setSelectedEntities(preselected)
      setLoadingEntities(false)
    }

    load()
  }, [state, organizationId])

  // Add entity to the simulation list
  const addEntity = useCallback((name: string) => {
    const key = name.toLowerCase()
    if (selectedEntities.has(key)) return
    setSelectedEntities(prev => {
      const next = new Map(prev)
      next.set(key, { name, hasProfile: globalProfiles.has(key) })
      return next
    })
  }, [selectedEntities, globalProfiles])

  // Remove entity from the simulation list
  const removeEntity = useCallback((name: string) => {
    setSelectedEntities(prev => {
      const next = new Map(prev)
      next.delete(name.toLowerCase())
      return next
    })
  }, [])

  // Filtered Entity Database entries based on search
  const filteredDatabase = useMemo(() => {
    if (!browserSearch.trim()) return ENTITY_DATABASE
    const q = browserSearch.toLowerCase()
    const filtered: typeof ENTITY_DATABASE = {}
    for (const [groupKey, group] of Object.entries(ENTITY_DATABASE)) {
      const filteredCategories: Record<string, string[]> = {}
      for (const [catKey, entities] of Object.entries(group.categories)) {
        const matches = entities.filter(e => e.toLowerCase().includes(q))
        if (matches.length > 0) filteredCategories[catKey] = matches
      }
      if (Object.keys(filteredCategories).length > 0) {
        filtered[groupKey] = { ...group, categories: filteredCategories }
      }
    }
    return filtered
  }, [browserSearch])

  // Cancelled ref for aborting the round loop
  const cancelledRef = useRef(false)

  // Client-driven simulation: setup → run rounds one at a time
  const startSimulation = async () => {
    if (invokeRef.current) return
    invokeRef.current = true
    cancelledRef.current = false

    setState('starting')
    setError(null)
    startTimeRef.current = Date.now()

    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 1000)

    const entityNames = Array.from(selectedEntities.values()).map(e => e.name)
    console.log(`[LP] Launching simulation with ${entityNames.length} entities:`, entityNames)

    try {
      // Step 1: Setup — create simulation, identify entities
      const { data: setup, error: setupError } = await supabase.functions.invoke('lp-simulation-orchestrator', {
        body: {
          scenario_id: scenarioId,
          organization_id: organizationId,
          entity_names: entityNames
        }
      })

      if (setupError || !setup?.simulation_id) {
        throw new Error(setupError?.message || setup?.error || 'Setup failed')
      }

      const { simulation_id, scenario, entities, config, phases } = setup
      setSimulationId(simulation_id)
      setProgress({
        id: simulation_id,
        status: 'running',
        rounds_completed: 0,
        stabilization_score: 0,
        entities,
        created_at: new Date().toISOString()
      })
      setState('running')

      console.log(`[LP] Setup complete: ${simulation_id}, ${entities.length} entities, ${phases.length} phases`)

      // Step 2: Run rounds one at a time
      let allResponses: any[] = []
      let lastAnalysis: any = null
      const entityMemory: Record<string, any> = {}

      for (let round = 1; round <= config.max_rounds; round++) {
        if (cancelledRef.current) break

        const phase = phases[round - 1]
        if (!phase) break

        console.log(`[LP] Starting Round ${round}/${config.max_rounds}: ${phase.name}`)

        const priorResponses = allResponses.filter(r => r.round_number === round - 1)

        let roundResult: any = null
        let roundError: any = null

        try {
          const res = await supabase.functions.invoke('lp-run-simulation-round', {
            body: {
              simulation_id,
              round_number: round,
              phase,
              scenario,
              entities,
              prior_responses: priorResponses,
              themes_so_far: lastAnalysis?.themes?.map((t: any) => t.theme) || [],
              dominant_narratives: lastAnalysis?.themes
                ?.filter((t: any) => t.momentum === 'rising')
                ?.map((t: any) => t.theme) || [],
              gaps_identified: lastAnalysis?.gaps?.map((g: any) => g.description) || [],
              entity_memory: entityMemory
            }
          })
          roundResult = res.data
          roundError = res.error
          console.log(`[LP] Round ${round} response:`, { hasData: !!roundResult, error: roundError?.message, dataKeys: roundResult ? Object.keys(roundResult) : [] })
        } catch (invokeErr: any) {
          // Gateway timeout — round may still be running on the server
          // Poll DB to see if it completed
          console.warn(`[LP] Round ${round} invoke error (likely gateway timeout):`, invokeErr.message)

          // Wait a bit then check if the round was saved to DB
          await new Promise(r => setTimeout(r, 5000))
          const { data: savedRound } = await supabase
            .from('lp_simulation_rounds')
            .select('entity_responses, cross_analysis')
            .eq('simulation_id', simulation_id)
            .eq('round_number', round)
            .single()

          if (savedRound) {
            console.log(`[LP] Round ${round} completed on server despite gateway timeout`)
            roundResult = {
              responses: savedRound.entity_responses,
              analysis: savedRound.cross_analysis
            }
          } else {
            // Wait more and retry once
            await new Promise(r => setTimeout(r, 10000))
            const { data: retryRound } = await supabase
              .from('lp_simulation_rounds')
              .select('entity_responses, cross_analysis')
              .eq('simulation_id', simulation_id)
              .eq('round_number', round)
              .single()

            if (retryRound) {
              console.log(`[LP] Round ${round} completed on server (found on retry)`)
              roundResult = {
                responses: retryRound.entity_responses,
                analysis: retryRound.cross_analysis
              }
            } else {
              roundError = { message: `Round ${round} timed out and no result found in DB` }
            }
          }
        }

        if (roundError || !roundResult) {
          console.error(`[LP] Round ${round} failed:`, roundError?.message)
          // Don't fail the whole simulation — mark what we have
          if (round > 1) {
            await supabase.from('lp_simulations').update({
              status: 'max_rounds_reached',
              completed_at: new Date().toISOString(),
              error: `Round ${round} failed: ${roundError?.message || 'unknown'}`
            }).eq('id', simulation_id)
            setState('complete')
          } else {
            throw new Error(`Round 1 failed: ${roundError?.message || 'unknown'}`)
          }
          break
        }

        // Accumulate responses
        allResponses.push(...(roundResult.responses || []))
        lastAnalysis = roundResult.analysis

        // Build entity memory for next round
        for (const entity of entities) {
          const entityResponses = allResponses.filter((r: any) => r.entity_id === entity.entity_id)
          const entityName = entityResponses[0]?.entity_name || ''
          entityMemory[entity.entity_id] = {
            entity_id: entity.entity_id,
            positions_taken: entityResponses.map((r: any) => ({ round: r.round_number, position: r.position_summary })),
            entities_referenced: [...new Set(entityResponses.flatMap((r: any) => r.entities_referenced || []))],
            themes_championed: [...new Set(entityResponses.flatMap((r: any) => r.themes_championed || []))],
            attacks_received: allResponses
              .filter((r: any) => r.entity_id !== entity.entity_id && r.response_decision === 'counter' &&
                (r.entities_referenced || []).some((ref: string) => ref === entity.entity_id || ref.toLowerCase() === entityName.toLowerCase()))
              .map((r: any) => ({ from: r.entity_name, round: r.round_number, attack: r.position_summary })),
            credibility_trajectory: 'stable'
          }
        }

        // Update UI progress
        setProgress(prev => prev ? {
          ...prev,
          rounds_completed: round,
          stabilization_score: lastAnalysis?.stabilization_score || 0
        } : null)

        console.log(`[LP] Round ${round} complete — stabilization: ${(lastAnalysis?.stabilization_score || 0).toFixed(2)}`)

        // Check stabilization (after min rounds)
        if (round >= (config.min_rounds || 2) && lastAnalysis?.stabilization_score >= (config.stabilization_threshold || 0.8)) {
          console.log(`[LP] Stabilized at round ${round}`)
          await supabase.from('lp_simulations').update({
            status: 'stabilized',
            rounds_completed: round,
            stabilization_score: lastAnalysis.stabilization_score,
            dominant_narratives: lastAnalysis.themes?.filter((t: any) => t.momentum === 'rising').map((t: any) => t.theme) || [],
            key_coalitions: lastAnalysis.coalitions || [],
            gaps_identified: lastAnalysis.gaps?.map((g: any) => g.description) || [],
            completed_at: new Date().toISOString()
          }).eq('id', simulation_id)
          setState('complete')
          break
        }

        // If last round, mark max_rounds_reached
        if (round === config.max_rounds) {
          await supabase.from('lp_simulations').update({
            status: 'max_rounds_reached',
            rounds_completed: round,
            stabilization_score: lastAnalysis?.stabilization_score || 0,
            dominant_narratives: lastAnalysis?.themes?.filter((t: any) => t.momentum === 'rising').map((t: any) => t.theme) || [],
            key_coalitions: lastAnalysis?.coalitions || [],
            gaps_identified: lastAnalysis?.gaps?.map((g: any) => g.description) || [],
            completed_at: new Date().toISOString()
          }).eq('id', simulation_id)
          setState('complete')
        }
      }

      // Try fulcrum identification as a bonus (fire-and-forget, non-blocking)
      if (state === 'complete' || !cancelledRef.current) {
        try {
          const { data: fulcrumResult } = await supabase.functions.invoke('lp-identify-fulcrums', {
            body: { simulation_id }
          })
          if (fulcrumResult?.fulcrums) {
            await supabase.from('lp_simulations').update({ fulcrums: fulcrumResult.fulcrums }).eq('id', simulation_id)
          }
        } catch (_) {
          // Fulcrums are optional — don't fail the simulation
        }
      }

    } catch (err: any) {
      console.error('[LP] Simulation error:', err.message)
      setState('failed')
      setError(err.message || 'Simulation failed')
    } finally {
      if (timerRef.current) clearInterval(timerRef.current)
      invokeRef.current = false
    }
  }

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`
  }

  // Idle state — show "Run Simulation" button
  if (state === 'idle') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-[var(--burnt-orange)]/10 flex items-center justify-center mx-auto">
          <Zap className="w-6 h-6 text-[var(--burnt-orange)]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--charcoal)]">Run LP Simulation</h3>
          <p className="text-xs text-gray-500 mt-1">
            Simulate stakeholder responses across multiple rounds until positions stabilize.
            This typically takes 2-4 minutes.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setState('selecting')}
            className="px-4 py-2 bg-[var(--burnt-orange)] hover:bg-[var(--terracotta)] text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            Start Simulation
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    )
  }

  // Selecting entities state
  if (state === 'selecting') {
    const selectedList = Array.from(selectedEntities.values())

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[var(--burnt-orange)]" />
          <h3 className="text-sm font-semibold text-[var(--charcoal)]">Build Your Entity List</h3>
          <span className={`px-1.5 py-0.5 text-[10px] rounded font-medium ${
            selectedList.length > 8 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {selectedList.length}/8
          </span>
        </div>

        {loadingEntities ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--burnt-orange)]" />
            <span className="ml-2 text-xs text-gray-500">Loading...</span>
          </div>
        ) : (
          <>
            {/* Selected entities list */}
            {selectedList.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-gray-50 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Your Simulation List</span>
                  <button
                    onClick={() => setSelectedEntities(new Map())}
                    className="text-[10px] text-gray-400 hover:text-red-500"
                  >
                    Clear all
                  </button>
                </div>
                <div className="divide-y divide-gray-100 max-h-[200px] overflow-y-auto">
                  {selectedList.map(({ name, hasProfile }) => (
                    <div key={name} className="flex items-center gap-2.5 px-3 py-2">
                      <span className="text-sm text-[var(--charcoal)] flex-1">{name}</span>
                      {hasProfile && (
                        <span className="px-1.5 py-0.5 text-[10px] rounded bg-green-100 text-green-700">profile</span>
                      )}
                      <button
                        onClick={() => removeEntity(name)}
                        className="p-0.5 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Intelligence targets — quick-add */}
            {intelTargets.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-600">Intelligence Targets</span>
                  <button
                    onClick={() => intelTargets.forEach(t => addEntity(t.name))}
                    className="text-[10px] text-[var(--burnt-orange)] hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="w-2.5 h-2.5" /> Add all
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {intelTargets.map(t => {
                    const inList = selectedEntities.has(t.name.toLowerCase())
                    const hasProfile = globalProfiles.has(t.name.toLowerCase())
                    return (
                      <button
                        key={t.name}
                        onClick={() => inList ? removeEntity(t.name) : addEntity(t.name)}
                        className={`px-2.5 py-1 text-[11px] rounded-full border transition-all ${
                          inList
                            ? 'bg-[var(--burnt-orange)] border-[var(--burnt-orange)] text-white'
                            : hasProfile
                            ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-[var(--burnt-orange)]'
                        }`}
                      >
                        {inList ? <Check className="w-2.5 h-2.5 inline mr-0.5" /> : <Plus className="w-2.5 h-2.5 inline mr-0.5" />}
                        {t.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Entity Database browser — search + browse */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={browserSearch}
                    onChange={(e) => setBrowserSearch(e.target.value)}
                    placeholder="Search entity database..."
                    className="flex-1 bg-transparent text-sm text-[var(--charcoal)] placeholder:text-gray-400 outline-none"
                  />
                  {browserSearch && (
                    <button onClick={() => setBrowserSearch('')} className="text-gray-400 hover:text-gray-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-100">
                {Object.entries(filteredDatabase).map(([groupKey, group]) => {
                  const isExpanded = expandedBrowserGroups.has(groupKey)
                  return (
                    <div key={groupKey}>
                      <button
                        onClick={() => {
                          const next = new Set(expandedBrowserGroups)
                          if (next.has(groupKey)) next.delete(groupKey)
                          else next.add(groupKey)
                          setExpandedBrowserGroups(next)
                        }}
                        className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                      >
                        <span className="text-xs font-semibold text-gray-700">{formatEntityName(groupKey)}</span>
                        {isExpanded
                          ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                          : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                        }
                      </button>
                      {isExpanded && (
                        <div className="px-3 pb-3 space-y-3">
                          {Object.entries(group.categories).map(([catKey, catEntities]) => (
                            <div key={catKey}>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                                  {formatEntityName(catKey)}
                                </span>
                                <button
                                  onClick={() => catEntities.forEach(name => addEntity(name))}
                                  className="text-[10px] text-[var(--burnt-orange)] hover:underline flex items-center gap-0.5"
                                >
                                  <Plus className="w-2.5 h-2.5" /> Add all
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {catEntities.map(name => {
                                  const inList = selectedEntities.has(name.toLowerCase())
                                  const hasProfile = globalProfiles.has(name.toLowerCase())
                                  return (
                                    <button
                                      key={name}
                                      onClick={() => inList ? removeEntity(name) : addEntity(name)}
                                      className={`px-2 py-0.5 text-[11px] rounded-full border transition-all ${
                                        inList
                                          ? 'bg-[var(--burnt-orange)] border-[var(--burnt-orange)] text-white'
                                          : hasProfile
                                          ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                                          : 'bg-white border-gray-200 text-gray-600 hover:border-[var(--burnt-orange)]'
                                      }`}
                                    >
                                      {inList && <Check className="w-2.5 h-2.5 inline mr-0.5" />}
                                      {name}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
                {Object.keys(filteredDatabase).length === 0 && (
                  <div className="px-3 py-4 text-center text-xs text-gray-400">
                    No entities match &ldquo;{browserSearch}&rdquo;
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  setState('idle')
                  setSelectedEntities(new Map())
                }}
                className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Back
              </button>
              <div className="flex items-center gap-2">
                {selectedList.length > 8 && (
                  <span className="text-[10px] text-amber-600">Max 8 entities</span>
                )}
                <button
                  onClick={startSimulation}
                  disabled={selectedList.length === 0 || selectedList.length > 8}
                  className="px-4 py-2 bg-[var(--burnt-orange)] hover:bg-[var(--terracotta)] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Run with {selectedList.length} {selectedList.length === 1 ? 'Entity' : 'Entities'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  // Starting / Running state
  if (state === 'starting' || state === 'running') {
    const roundsCompleted = progress?.rounds_completed || 0
    const entityCount = progress?.entities?.length || 0
    const stabScore = progress?.stabilization_score || 0

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--burnt-orange)]/10 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-[var(--burnt-orange)] animate-spin" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-[var(--charcoal)]">
              {state === 'starting' ? 'Initializing Simulation...' : 'Simulation Running'}
            </h3>
            <p className="text-xs text-gray-500">
              {state === 'starting'
                ? 'Setting up entities and loading profiles...'
                : `Round ${roundsCompleted} — watching for stabilization`}
            </p>
          </div>
          <span className="text-xs text-gray-400 font-mono">{formatElapsed(elapsed)}</span>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--burnt-orange)] transition-all duration-500 rounded-full"
              style={{ width: `${Math.max(5, roundsCompleted * 20)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-gray-400">
            <span>Round {roundsCompleted}</span>
            <span>Stabilization: {(stabScore * 100).toFixed(0)}%</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <BarChart3 className="w-4 h-4 text-gray-400 mx-auto mb-1" />
            <p className="text-lg font-semibold text-[var(--charcoal)]">{roundsCompleted}</p>
            <p className="text-[10px] text-gray-400">Rounds</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <Users className="w-4 h-4 text-gray-400 mx-auto mb-1" />
            <p className="text-lg font-semibold text-[var(--charcoal)]">{entityCount}</p>
            <p className="text-[10px] text-gray-400">Entities</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <Clock className="w-4 h-4 text-gray-400 mx-auto mb-1" />
            <p className="text-lg font-semibold text-[var(--charcoal)]">{formatElapsed(elapsed)}</p>
            <p className="text-[10px] text-gray-400">Elapsed</p>
          </div>
        </div>

        {/* Animated dots + cancel */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400">Simulating stakeholder responses</span>
            <span className="animate-pulse">.</span>
            <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>.</span>
            <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>.</span>
          </div>
          <button
            onClick={async () => {
              cancelledRef.current = true
              const targetId = simulationId || progress?.id
              if (targetId) {
                await supabase
                  .from('lp_simulations')
                  .update({ status: 'failed', error: 'Cancelled by user', completed_at: new Date().toISOString() })
                  .eq('id', targetId)
              }
              if (timerRef.current) clearInterval(timerRef.current)
              setState('failed')
              setError('Cancelled by user')
            }}
            className="px-3 py-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // Complete state
  if (state === 'complete' && progress) {
    return (
      <div className="bg-white rounded-xl border border-green-200 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-green-800">Simulation Complete</h3>
            <p className="text-xs text-green-600">
              {progress.status === 'stabilized'
                ? `Positions stabilized after ${progress.rounds_completed} rounds`
                : `Completed ${progress.rounds_completed} rounds (max reached)`}
            </p>
          </div>
          <span className="text-xs text-gray-400 font-mono">{formatElapsed(elapsed)}</span>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-[10px] text-green-600 uppercase tracking-wide">Stabilization</p>
            <p className="text-lg font-semibold text-green-800">
              {(progress.stabilization_score * 100).toFixed(0)}%
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-[10px] text-green-600 uppercase tracking-wide">Rounds</p>
            <p className="text-lg font-semibold text-green-800">{progress.rounds_completed}</p>
          </div>
        </div>

        <button
          onClick={() => simulationId && onComplete?.(simulationId)}
          className="w-full px-4 py-2.5 bg-[var(--burnt-orange)] hover:bg-[var(--terracotta)] text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <BarChart3 className="w-4 h-4" />
          View Results
        </button>
      </div>
    )
  }

  // Failed state
  return (
    <div className="bg-white rounded-xl border border-red-200 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
          <XCircle className="w-5 h-5 text-red-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-800">Simulation Failed</h3>
          <p className="text-xs text-red-600 mt-0.5">{error || 'Unknown error'}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            setState('idle')
            setError(null)
            setSimulationId(null)
            setProgress(null)
            setElapsed(0)
            setSelectedEntities(new Map())
          }}
          className="flex-1 px-4 py-2 bg-[var(--burnt-orange)] hover:bg-[var(--terracotta)] text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}
