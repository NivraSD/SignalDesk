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
  Minus,
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

interface IntelTarget {
  id: string
  name: string
  type: string
  priority: string
  active: boolean
}

interface LPProfile {
  id: string
  entity_name: string
  entity_type: string
  target_id: string | null
  confidence_score: number
  data_tier: string
  expires_at: string
}

interface SelectableEntity {
  targetId: string
  name: string
  type: string
  priority: string
  profileId: string | null
  profileReady: boolean
  profileExpired: boolean
  selected: boolean
}

export default function SimulationRunner({
  scenarioId,
  organizationId,
  onComplete,
  onCancel
}: SimulationRunnerProps) {
  const [state, setState] = useState<'idle' | 'selecting' | 'starting' | 'running' | 'complete' | 'failed'>('idle')
  const [simulationId, setSimulationId] = useState<string | null>(null)
  const [progress, setProgress] = useState<SimulationProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)
  const invokeRef = useRef(false)

  // Entity selection state
  const [entities, setEntities] = useState<SelectableEntity[]>([])
  const [loadingEntities, setLoadingEntities] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  // Entity Database browser state
  const [showBrowser, setShowBrowser] = useState(false)
  const [browserSearch, setBrowserSearch] = useState('')
  const [expandedBrowserGroups, setExpandedBrowserGroups] = useState<Set<string>>(new Set())
  const [globalProfiles, setGlobalProfiles] = useState<Set<string>>(new Set())

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // Load entities from scenario stakeholder_seed, cross-referenced with LP profiles
  useEffect(() => {
    if (state !== 'selecting') return

    const loadEntities = async () => {
      setLoadingEntities(true)

      // Load scenario, all LP profiles, and intel targets in parallel
      const [scenarioRes, profilesRes, targetsRes] = await Promise.all([
        supabase
          .from('lp_scenarios')
          .select('scenario_data')
          .eq('id', scenarioId)
          .single(),
        supabase
          .from('lp_entity_profiles')
          .select('id, entity_name, entity_type, target_id, confidence_score, data_tier, expires_at'),
        supabase
          .from('intelligence_targets')
          .select('id, name, type, priority, active')
          .eq('organization_id', organizationId)
          .eq('active', true)
      ])

      const profiles: LPProfile[] = profilesRes.data || []
      const targets: IntelTarget[] = targetsRes.data || []

      // Build profile lookup by name (case-insensitive)
      const profileByName = new Map<string, LPProfile>()
      for (const p of profiles) {
        if (!profileByName.has(p.entity_name.toLowerCase())) {
          profileByName.set(p.entity_name.toLowerCase(), p)
        }
      }

      // Store global profiles set for the browser
      setGlobalProfiles(new Set(profiles.map(p => p.entity_name.toLowerCase())))

      // Build target lookup by name
      const targetByName = new Map<string, IntelTarget>()
      for (const t of targets) {
        targetByName.set(t.name.toLowerCase(), t)
      }

      // Extract stakeholder names from scenario
      const scenarioData = scenarioRes.data?.scenario_data || {}
      const stakeholderSeed = scenarioData.stakeholder_seed || {}
      const stakeholderEntities: SelectableEntity[] = []
      const seenNames = new Set<string>()

      // Primary: entities from scenario stakeholder_seed (grouped by category)
      if (typeof stakeholderSeed === 'object' && !Array.isArray(stakeholderSeed)) {
        for (const [category, names] of Object.entries(stakeholderSeed)) {
          if (Array.isArray(names)) {
            for (const name of names) {
              if (!name || seenNames.has(name.toLowerCase())) continue
              seenNames.add(name.toLowerCase())
              const profile = profileByName.get(name.toLowerCase()) || null
              const target = targetByName.get(name.toLowerCase())
              stakeholderEntities.push({
                targetId: target?.id || name,
                name,
                type: category,
                priority: target?.priority || 'medium',
                profileId: profile?.id || null,
                profileReady: !!profile,
                profileExpired: false,
                selected: true
              })
            }
          }
        }
      }

      // If no stakeholders from scenario, fall back to intel targets
      if (stakeholderEntities.length === 0) {
        for (const t of targets) {
          const profile = profileByName.get(t.name.toLowerCase()) || null
          stakeholderEntities.push({
            targetId: t.id,
            name: t.name,
            type: t.type || 'stakeholder',
            priority: t.priority || 'medium',
            profileId: profile?.id || null,
            profileReady: !!profile,
            profileExpired: false,
            selected: true
          })
        }
      }

      console.log(`[LP] Loaded ${stakeholderEntities.length} entities from scenario, ${stakeholderEntities.filter(e => e.profileReady).length} have profiles`)
      setEntities(stakeholderEntities)
      setLoadingEntities(false)
    }

    loadEntities()
  }, [state, scenarioId, organizationId])

  // Group entities by type
  const groupedEntities = useMemo(() => {
    const groups = new Map<string, SelectableEntity[]>()
    for (const e of entities) {
      const group = groups.get(e.type) || []
      group.push(e)
      groups.set(e.type, group)
    }
    return groups
  }, [entities])

  const selectedCount = entities.filter(e => e.selected).length

  const toggleEntity = (targetId: string) => {
    setEntities(prev => prev.map(e =>
      e.targetId === targetId ? { ...e, selected: !e.selected } : e
    ))
  }

  const toggleGroup = (type: string) => {
    const groupEntities = groupedEntities.get(type) || []
    const allSelected = groupEntities.every(e => e.selected)
    setEntities(prev => prev.map(e =>
      e.type === type ? { ...e, selected: !allSelected } : e
    ))
  }

  const toggleGroupCollapse = (type: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  // Add entity from the Entity Database browser
  const addEntityFromDatabase = useCallback((name: string, category: string) => {
    // Check if already in list
    if (entities.some(e => e.name.toLowerCase() === name.toLowerCase())) {
      // If already there, just make sure it's selected
      setEntities(prev => prev.map(e =>
        e.name.toLowerCase() === name.toLowerCase() ? { ...e, selected: true } : e
      ))
      return
    }

    const hasProfile = globalProfiles.has(name.toLowerCase())
    setEntities(prev => [...prev, {
      targetId: name, // Use name as ID for non-target entities
      name,
      type: category,
      priority: 'medium',
      profileId: hasProfile ? 'global' : null, // Mark as having a global profile
      profileReady: hasProfile,
      profileExpired: false,
      selected: true
    }])
  }, [entities, globalProfiles])

  // Remove entity from list
  const removeEntity = useCallback((targetId: string) => {
    setEntities(prev => prev.filter(e => e.targetId !== targetId))
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
          .single()
        if (res.data) {
          data = res.data
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

    // Collect selected entity profile IDs (for those that have profiles)
    const selected = entities.filter(e => e.selected)
    const profileIds = selected.filter(e => e.profileId).map(e => e.profileId!)
    console.log(`[LP] Launching simulation with ${selected.length} selected, ${profileIds.length} have profile IDs`, selected.map(e => `${e.name} (${e.profileId ? 'has profile' : 'NO profile'})`))

    // Fire-and-forget: the edge function takes 2-4 minutes but the gateway
    // times out at ~60s. The orchestrator writes progress to DB as it goes.
    supabase.functions.invoke('lp-simulation-orchestrator', {
      body: {
        scenario_id: scenarioId,
        organization_id: organizationId,
        ...(profileIds.length > 0 ? { entity_ids: profileIds } : {})
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

  const PRIORITY_COLORS: Record<string, string> = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-gray-100 text-gray-600'
  }

  const TYPE_LABELS: Record<string, string> = {
    competitor: 'Competitors',
    regulator: 'Regulators',
    reporter: 'Reporters',
    journalist: 'Journalists',
    analyst: 'Analysts',
    stakeholder: 'Stakeholders',
    influencer: 'Influencers',
    customer: 'Customers',
    partner: 'Partners',
    topic: 'Topics',
    keyword: 'Keywords'
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
    const entityNameSet = new Set(entities.map(e => e.name.toLowerCase()))

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[var(--burnt-orange)]" />
            <h3 className="text-sm font-semibold text-[var(--charcoal)]">Select Simulation Entities</h3>
            <span className="px-1.5 py-0.5 text-[10px] rounded bg-gray-100 text-gray-600 font-medium">
              {selectedCount} selected
            </span>
          </div>
          <button
            onClick={() => setShowBrowser(!showBrowser)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 bg-[var(--burnt-orange)]/5 border-[var(--burnt-orange)]/20 text-[var(--burnt-orange)] hover:bg-[var(--burnt-orange)]/10"
          >
            <Plus className="w-3.5 h-3.5" />
            {showBrowser ? 'Hide Database' : 'Add from Database'}
          </button>
        </div>
        <p className="text-xs text-gray-500">
          Choose which entities to include. Entities with existing profiles simulate faster.
        </p>

        {/* Entity Database Browser */}
        {showBrowser && (
          <div className="border border-[var(--burnt-orange)]/20 rounded-lg overflow-hidden bg-[var(--burnt-orange)]/[0.02]">
            <div className="px-3 py-2 bg-[var(--burnt-orange)]/5 border-b border-[var(--burnt-orange)]/10">
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-[var(--burnt-orange)]" />
                <input
                  type="text"
                  value={browserSearch}
                  onChange={(e) => setBrowserSearch(e.target.value)}
                  placeholder="Search entities..."
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
                                onClick={() => catEntities.forEach(name => addEntityFromDatabase(name, catKey))}
                                className="text-[10px] text-[var(--burnt-orange)] hover:underline flex items-center gap-0.5"
                              >
                                <Plus className="w-2.5 h-2.5" /> Add all
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {catEntities.map(name => {
                                const inList = entityNameSet.has(name.toLowerCase())
                                const hasProfile = globalProfiles.has(name.toLowerCase())
                                return (
                                  <button
                                    key={name}
                                    onClick={() => addEntityFromDatabase(name, catKey)}
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
                  No entities match "{browserSearch}"
                </div>
              )}
            </div>
          </div>
        )}

        {loadingEntities ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--burnt-orange)]" />
            <span className="ml-2 text-xs text-gray-500">Loading targets...</span>
          </div>
        ) : entities.length === 0 ? (
          <div className="text-center py-6 space-y-2">
            <p className="text-sm text-gray-500">No entities selected yet.</p>
            <p className="text-xs text-gray-400">
              Use "Add from Database" above to browse and add entities, or run with auto-detection.
            </p>
            <button
              onClick={startSimulation}
              className="mt-3 px-4 py-2 bg-[var(--burnt-orange)] hover:bg-[var(--terracotta)] text-white rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Run with Auto-Detection
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {Array.from(groupedEntities.entries()).map(([type, group]) => {
                const allSelected = group.every(e => e.selected)
                const someSelected = group.some(e => e.selected)
                const collapsed = collapsedGroups.has(type)

                return (
                  <div key={type} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Group header */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50">
                      <button
                        onClick={() => toggleGroupCollapse(type)}
                        className="p-0.5 text-gray-400 hover:text-gray-600"
                      >
                        {collapsed
                          ? <ChevronRight className="w-3.5 h-3.5" />
                          : <ChevronDown className="w-3.5 h-3.5" />
                        }
                      </button>
                      <button
                        onClick={() => toggleGroup(type)}
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          allSelected
                            ? 'bg-[var(--burnt-orange)] border-[var(--burnt-orange)]'
                            : someSelected
                            ? 'bg-[var(--burnt-orange)]/30 border-[var(--burnt-orange)]'
                            : 'border-gray-300'
                        }`}
                      >
                        {allSelected && <Check className="w-3 h-3 text-white" />}
                        {someSelected && !allSelected && <Minus className="w-3 h-3 text-white" />}
                      </button>
                      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        {TYPE_LABELS[type] || formatEntityName(type)}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {group.filter(e => e.selected).length}/{group.length}
                      </span>
                    </div>

                    {/* Entity rows */}
                    {!collapsed && (
                      <div className="divide-y divide-gray-100">
                        {group.map(entity => (
                          <div
                            key={entity.targetId}
                            className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors"
                          >
                            <label className="flex items-center gap-2.5 flex-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={entity.selected}
                                onChange={() => toggleEntity(entity.targetId)}
                                className="sr-only"
                              />
                              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                entity.selected
                                  ? 'bg-[var(--burnt-orange)] border-[var(--burnt-orange)]'
                                  : 'border-gray-300'
                              }`}>
                                {entity.selected && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <span className="text-sm text-[var(--charcoal)] flex-1">{entity.name}</span>
                            </label>
                            {entity.profileReady ? (
                              <span className="px-1.5 py-0.5 text-[10px] rounded bg-green-100 text-green-700">
                                profile ready
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 text-[10px] rounded bg-gray-100 text-gray-500">
                                no profile
                              </span>
                            )}
                            <button
                              onClick={() => removeEntity(entity.targetId)}
                              className="p-0.5 text-gray-300 hover:text-red-500 transition-colors"
                              title="Remove from list"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  setState('idle')
                  setEntities([])
                  setShowBrowser(false)
                }}
                className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Back
              </button>
              <button
                onClick={startSimulation}
                disabled={selectedCount === 0}
                className="px-4 py-2 bg-[var(--burnt-orange)] hover:bg-[var(--terracotta)] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Run with {selectedCount} {selectedCount === 1 ? 'Entity' : 'Entities'}
              </button>
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
                : `Round ${roundsCompleted} of up to 6 — watching for stabilization`}
            </p>
          </div>
          <span className="text-xs text-gray-400 font-mono">{formatElapsed(elapsed)}</span>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--burnt-orange)] transition-all duration-500 rounded-full"
              style={{ width: `${Math.max(5, (roundsCompleted / 6) * 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-gray-400">
            <span>Round {roundsCompleted}/6</span>
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

        {/* Animated dots */}
        <div className="flex items-center justify-center gap-1 py-2">
          <span className="text-xs text-gray-400">Simulating stakeholder responses</span>
          <span className="animate-pulse">.</span>
          <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>.</span>
          <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>.</span>
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
            setEntities([])
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
