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

  // Poll for simulation progress
  useEffect(() => {
    if (state !== 'starting' && state !== 'running') return

    const poll = async () => {
      let data: SimulationProgress | null = null

      if (simulationId) {
        const res = await supabase
          .from('lp_simulations')
          .select('id, status, rounds_completed, stabilization_score, entities, error, created_at, completed_at')
          .eq('id', simulationId)
          .single()
        data = res.data
      } else {
        const res = await supabase
          .from('lp_simulations')
          .select('id, status, rounds_completed, stabilization_score, entities, error, created_at, completed_at')
          .eq('scenario_id', scenarioId)
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false })
          .limit(1)
        if (res.data?.[0]) {
          data = res.data[0]
          setSimulationId(res.data.id)
        }
      }

      if (!data) return
      setProgress(data)

      if (data.status === 'stabilized' || data.status === 'max_rounds_reached') {
        setState('complete')
        if (!simulationId) setSimulationId(data.id)
        if (pollRef.current) clearInterval(pollRef.current)
        if (timerRef.current) clearInterval(timerRef.current)
      } else if (data.status === 'failed') {
        setState('failed')
        setError(data.error || 'Simulation failed')
        if (pollRef.current) clearInterval(pollRef.current)
        if (timerRef.current) clearInterval(timerRef.current)
      } else if (data.status === 'running' || data.status === 'analyzing') {
        setState('running')
        // If running for more than 6 minutes, assume it died
        const createdAt = new Date(data.created_at).getTime()
        if (Date.now() - createdAt > 6 * 60 * 1000) {
          await supabase
            .from('lp_simulations')
            .update({ status: 'failed', error: 'Timed out', completed_at: new Date().toISOString() })
            .eq('id', data.id)
          setState('failed')
          setError('Simulation timed out after 6 minutes')
          if (pollRef.current) clearInterval(pollRef.current)
          if (timerRef.current) clearInterval(timerRef.current)
        }
      }
    }

    const timeout = setTimeout(poll, 2000)
    pollRef.current = setInterval(poll, 3000)
    return () => {
      clearTimeout(timeout)
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [simulationId, state, scenarioId, organizationId])

  const startSimulation = async () => {
    if (invokeRef.current) return
    invokeRef.current = true

    setState('starting')
    setError(null)
    startTimeRef.current = Date.now()

    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 1000)

    // Collect selected entity names
    const entityNames = Array.from(selectedEntities.values()).map(e => e.name)
    console.log(`[LP] Launching simulation with ${entityNames.length} entities:`, entityNames)

    // Fire-and-forget: the edge function takes 2-4 minutes but the gateway
    // times out at ~60s. The orchestrator writes progress to DB as it goes.
    supabase.functions.invoke('lp-simulation-orchestrator', {
      body: {
        scenario_id: scenarioId,
        organization_id: organizationId,
        entity_names: entityNames
      }
    }).then(({ data, error: invokeError }) => {
      if (!invokeError && data?.simulation_id) {
        setSimulationId(data.simulation_id)
      }
    }).catch(() => {
      // Expected: gateway timeout. Polling handles everything.
    }).finally(() => {
      invokeRef.current = false
    })
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
                : `Round ${roundsCompleted} of up to 5 — watching for stabilization`}
            </p>
          </div>
          <span className="text-xs text-gray-400 font-mono">{formatElapsed(elapsed)}</span>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--burnt-orange)] transition-all duration-500 rounded-full"
              style={{ width: `${Math.max(5, (roundsCompleted / 5) * 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-gray-400">
            <span>Round {roundsCompleted}/5</span>
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
              // Mark simulation as failed/cancelled in DB
              const targetId = simulationId || progress?.id
              if (targetId) {
                await supabase
                  .from('lp_simulations')
                  .update({ status: 'failed', error: 'Cancelled by user', completed_at: new Date().toISOString() })
                  .eq('id', targetId)
              }
              if (pollRef.current) clearInterval(pollRef.current)
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
