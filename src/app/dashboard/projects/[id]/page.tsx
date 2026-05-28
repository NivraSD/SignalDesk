'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  X,
  Edit3,
  Save,
  AlertCircle,
  Shield,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  Zap,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

// =============================================================================
// TYPES
// =============================================================================
type StakeholderType = 'government' | 'corporate' | 'community' | 'media' | 'civil_society' | 'financial' | 'international' | 'regulator'

interface LadderRung {
  level: number
  label: string
  description: string
  indicators: string[]
  typical_response: string
}

interface StrategyMove {
  action: string
  rationale: string
  channel: string
  owner: string
  timeframe: string
  priority: number
}

interface Strategy {
  objective: string
  moves: StrategyMove[]
  drafted_at?: string
  model?: string
}

interface Stakeholder {
  id: string
  asset_id: string
  stakeholder_name: string
  stakeholder_type: StakeholderType | null
  stakeholder_role: string | null
  influence_weight: number
  equilibrium_state: string | null
  ladder: LadderRung[]
  current_level: number
  current_level_reasoning: string | null
  current_level_updated_at: string | null
  current_level_evidence: Array<{ type: string; id: string; label: string }>
  strategy: Strategy | null
  strategy_updated_at: string | null
  updated_at: string
}

type ProjectTab = 'overview' | 'stakeholders' | 'strategy'

interface Asset {
  id: string
  topic: string
  issue_area: string | null
  scenario_data: any
  organization_id: string
}

// =============================================================================
// CONSTANTS
// =============================================================================
const LEVEL_META: Record<number, { label: string; bg: string; ring: string; text: string; dot: string }> = {
  0: { label: 'At equilibrium', bg: 'bg-green-900/30', ring: 'ring-green-700/40', text: 'text-green-300', dot: 'bg-green-500' },
  1: { label: 'Mild', bg: 'bg-yellow-900/30', ring: 'ring-yellow-700/40', text: 'text-yellow-300', dot: 'bg-yellow-500' },
  2: { label: 'Grumbling', bg: 'bg-orange-900/30', ring: 'ring-orange-700/40', text: 'text-orange-300', dot: 'bg-orange-500' },
  3: { label: 'Resistance', bg: 'bg-red-900/30', ring: 'ring-red-700/40', text: 'text-red-300', dot: 'bg-red-500' },
  4: { label: 'Deal-breaker', bg: 'bg-red-900/60', ring: 'ring-red-500/60', text: 'text-red-200', dot: 'bg-red-600' },
}

const TYPE_META: Record<string, { label: string; color: string }> = {
  government: { label: 'Government', color: 'text-blue-300' },
  corporate: { label: 'Corporate', color: 'text-purple-300' },
  community: { label: 'Community', color: 'text-emerald-300' },
  media: { label: 'Media', color: 'text-pink-300' },
  civil_society: { label: 'Civil society', color: 'text-cyan-300' },
  financial: { label: 'Financial', color: 'text-amber-300' },
  international: { label: 'International', color: 'text-indigo-300' },
  regulator: { label: 'Regulator', color: 'text-rose-300' },
}

// =============================================================================
// PAGE
// =============================================================================
export default function ProjectPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [asset, setAsset] = useState<Asset | null>(null)
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([])
  const [conditions, setConditions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Stakeholder | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [evaluating, setEvaluating] = useState(false)
  const [lastEvalAt, setLastEvalAt] = useState<string | null>(null)
  const [tab, setTab] = useState<ProjectTab>('overview')
  const [draftingStrategyId, setDraftingStrategyId] = useState<string | null>(null)

  useEffect(() => { load() }, [id])

  async function load() {
    setLoading(true)
    const [{ data: a }, { data: s }, { data: c }] = await Promise.all([
      supabase.from('lp_scenarios').select('*').eq('id', id).single(),
      supabase.from('stakeholder_equilibrium').select('*').eq('asset_id', id).order('influence_weight', { ascending: false }),
      supabase.from('lp_watch_conditions').select('id, condition_text, target_entity, status, confidence, impact_level, triggered_at').eq('scenario_id', id),
    ])
    setAsset(a)
    setStakeholders(s || [])
    setConditions(c || [])
    const latest = (s || []).reduce((max: string | null, x: Stakeholder) => {
      if (!x.current_level_updated_at) return max
      return !max || x.current_level_updated_at > max ? x.current_level_updated_at : max
    }, null)
    setLastEvalAt(latest)
    setLoading(false)
  }

  // Drifted stakeholders (off equilibrium), ranked by influence × drift = the gaps to work.
  const priorities = useMemo(
    () => stakeholders
      .filter(s => s.current_level >= 1)
      .sort((a, b) => (b.current_level * b.influence_weight) - (a.current_level * a.influence_weight)),
    [stakeholders],
  )
  const triggeredConditions = useMemo(() => conditions.filter(c => c.status === 'triggered'), [conditions])

  async function handleDraftStrategy(stakeholder_id: string) {
    setDraftingStrategyId(stakeholder_id)
    try {
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/draft-strategy`
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ stakeholder_id }),
      })
      if (!resp.ok) throw new Error((await resp.text()).substring(0, 200))
      await load()
    } catch (e: any) {
      alert(`Strategy draft failed: ${e.message}`)
    } finally {
      setDraftingStrategyId(null)
    }
  }

  // Aggregate health: weighted average inverted (0 = perfect, 1 = worst)
  const healthScore = useMemo(() => {
    if (stakeholders.length === 0) return 1.0
    let total = 0, weighted = 0
    for (const s of stakeholders) {
      total += s.influence_weight
      weighted += s.current_level * s.influence_weight
    }
    if (total === 0) return 1.0
    return 1 - (weighted / (total * 4))  // 1 = perfect equilibrium, 0 = everyone at L4
  }, [stakeholders])

  const healthLabel = healthScore > 0.85 ? 'Healthy' : healthScore > 0.65 ? 'Stable' : healthScore > 0.45 ? 'Strained' : healthScore > 0.25 ? 'Drifting' : 'Critical'
  const healthColor = healthScore > 0.85 ? 'text-green-400' : healthScore > 0.65 ? 'text-yellow-300' : healthScore > 0.45 ? 'text-orange-400' : healthScore > 0.25 ? 'text-red-400' : 'text-red-500'

  // Grouped by type
  const grouped = useMemo(() => {
    const groups: Record<string, Stakeholder[]> = {}
    for (const s of stakeholders) {
      const k = s.stakeholder_type || 'other'
      if (!groups[k]) groups[k] = []
      groups[k].push(s)
    }
    return Object.entries(groups).sort()
  }, [stakeholders])

  async function handleEvaluate(stakeholder_ids?: string[]) {
    setEvaluating(true)
    try {
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/evaluate-equilibrium`
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          asset_id: id,
          stakeholder_ids,
          lookback_days: 14,
        }),
      })
      if (!resp.ok) {
        const t = await resp.text()
        throw new Error(t.substring(0, 200))
      }
      await load()
    } catch (e: any) {
      alert(`Evaluation failed: ${e.message}`)
    } finally {
      setEvaluating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )
  }

  if (!asset) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div>Asset not found.</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Top bar */}
      <div className="border-b border-gray-800/60 px-8 py-5 flex items-center justify-between bg-[#0c0c0c]">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard/projects')}
            className="text-gray-500 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="text-xs uppercase tracking-wider text-amber-400 mb-0.5">Project</div>
            <h1 className="text-xl font-bold text-white">{asset.topic}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/dashboard/scenarios/${asset.id}`)}
            className="text-xs px-3 py-1.5 text-gray-400 hover:text-white border border-gray-700 rounded-lg hover:bg-gray-800 flex items-center gap-1.5"
          >
            <ExternalLink className="w-3 h-3" /> Scenario workspace
          </button>
        </div>
      </div>

      {/* Health bar */}
      <div className="px-8 py-6 bg-gradient-to-b from-[#0a0a0a] to-transparent">
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">Project health</div>
            <div className="flex items-baseline gap-3">
              <span className={`text-3xl font-bold ${healthColor}`}>{healthLabel}</span>
              <span className="text-sm text-gray-500">
                {Math.round(healthScore * 100)}% equilibrium · {stakeholders.length} stakeholders tracked
              </span>
            </div>
            {lastEvalAt && (
              <div className="text-xs text-gray-600 mt-1">
                Last evaluated {new Date(lastEvalAt).toLocaleString()}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add stakeholder
            </button>
            <button
              onClick={() => handleEvaluate()}
              disabled={evaluating || stakeholders.length === 0}
              className="px-3 py-2 text-sm bg-amber-600/20 border border-amber-500/30 rounded-lg hover:bg-amber-600/30 disabled:opacity-40 flex items-center gap-1.5"
            >
              {evaluating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Evaluating…</>
              ) : (
                <><Activity className="w-4 h-4" /> Re-evaluate all</>
              )}
            </button>
          </div>
        </div>

        {/* Level distribution bar */}
        <div className="flex h-2 rounded overflow-hidden">
          {[0, 1, 2, 3, 4].map(level => {
            const count = stakeholders.filter(s => s.current_level === level).length
            const totalWeight = stakeholders.reduce((a, s) => a + s.influence_weight, 0) || 1
            const weight = stakeholders.filter(s => s.current_level === level).reduce((a, s) => a + s.influence_weight, 0)
            const pct = (weight / totalWeight) * 100
            if (pct === 0) return null
            return (
              <div
                key={level}
                className={LEVEL_META[level].dot}
                style={{ width: `${pct}%` }}
                title={`${LEVEL_META[level].label}: ${count} stakeholder${count === 1 ? '' : 's'}`}
              />
            )
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-8 border-b border-gray-800/60">
        <div className="flex items-center gap-1">
          {([['overview', 'Overview'], ['stakeholders', 'Stakeholders'], ['strategy', 'Strategy']] as [ProjectTab, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === key ? 'border-amber-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {label}
              {key === 'strategy' && priorities.length > 0 && (
                <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-amber-600/20 text-amber-300">{priorities.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <OverviewTab
          asset={asset}
          stakeholders={stakeholders}
          priorities={priorities}
          triggeredConditions={triggeredConditions}
          conditionsCount={conditions.length}
          healthScore={healthScore}
          healthLabel={healthLabel}
          healthColor={healthColor}
          onOpenStakeholder={setSelected}
          onGoStrategy={() => setTab('strategy')}
          onGoStakeholders={() => setTab('stakeholders')}
        />
      )}

      {/* STAKEHOLDERS */}
      {tab === 'stakeholders' && (
        <div className="px-8 py-6 pb-12">
          {stakeholders.length === 0 ? (
            <div className="p-12 bg-gray-900/30 border border-gray-800 rounded-xl text-center">
              <Shield className="w-12 h-12 mx-auto mb-3 text-gray-700" />
              <p className="text-gray-400 mb-1">No stakeholders modeled yet.</p>
              <p className="text-sm text-gray-600 mb-4">Add stakeholders to start mapping equilibrium and tracking drift.</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add first stakeholder
              </button>
            </div>
          ) : (
            grouped.map(([type, list]) => (
              <div key={type} className="mb-8">
                <div className={`text-xs font-semibold uppercase tracking-wider mb-3 ${TYPE_META[type]?.color || 'text-gray-400'}`}>
                  {TYPE_META[type]?.label || type} · {list.length}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {list.map(s => (
                    <StakeholderCard
                      key={s.id}
                      stakeholder={s}
                      onClick={() => setSelected(s)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* STRATEGY */}
      {tab === 'strategy' && (
        <StrategyTab
          priorities={priorities}
          totalTracked={stakeholders.length}
          onDraft={handleDraftStrategy}
          draftingId={draftingStrategyId}
          onOpenStakeholder={setSelected}
        />
      )}

      {/* Drawer */}
      {selected && (
        <StakeholderDrawer
          stakeholder={selected}
          onClose={() => setSelected(null)}
          onEvaluate={() => handleEvaluate([selected.id])}
          onUpdated={() => load()}
          evaluating={evaluating}
        />
      )}

      {/* Add modal */}
      {showAddModal && (
        <AddStakeholderModal
          asset_id={asset.id}
          existingNames={stakeholders.map(s => s.stakeholder_name)}
          onClose={() => setShowAddModal(false)}
          onCreated={() => { setShowAddModal(false); load() }}
        />
      )}
    </div>
  )
}

// =============================================================================
// STAKEHOLDER CARD
// =============================================================================
function StakeholderCard({ stakeholder, onClick }: { stakeholder: Stakeholder; onClick: () => void }) {
  const meta = LEVEL_META[stakeholder.current_level] || LEVEL_META[0]
  const rung = stakeholder.ladder?.find(r => r.level === stakeholder.current_level)
  return (
    <button
      onClick={onClick}
      className={`text-left p-4 bg-gray-900/50 border border-gray-800/60 rounded-xl hover:border-gray-700 transition-all ring-1 ${meta.ring}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-white truncate">{stakeholder.stakeholder_name}</div>
          {stakeholder.stakeholder_role && (
            <div className="text-xs text-gray-500 truncate">{stakeholder.stakeholder_role}</div>
          )}
        </div>
        <div className={`shrink-0 w-7 h-7 rounded-lg ${meta.bg} ${meta.text} flex items-center justify-center text-xs font-bold`}>
          L{stakeholder.current_level}
        </div>
      </div>
      <div className={`text-xs ${meta.text} mb-2 font-medium`}>
        {meta.label}
        {rung && stakeholder.current_level > 0 && ` · ${rung.label}`}
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <span>Influence: {'★'.repeat(Math.ceil(stakeholder.influence_weight / 2))}</span>
        <span className="text-gray-700">·</span>
        <span>{stakeholder.ladder?.length || 0}-rung ladder</span>
      </div>
    </button>
  )
}

// =============================================================================
// DRAWER
// =============================================================================
function StakeholderDrawer({
  stakeholder, onClose, onEvaluate, onUpdated, evaluating,
}: {
  stakeholder: Stakeholder
  onClose: () => void
  onEvaluate: () => void
  onUpdated: () => void
  evaluating: boolean
}) {
  const [editingEq, setEditingEq] = useState(false)
  const [eqDraft, setEqDraft] = useState(stakeholder.equilibrium_state || '')
  const [editingLadder, setEditingLadder] = useState(false)
  const [ladderDraft, setLadderDraft] = useState<LadderRung[]>(stakeholder.ladder || [])
  const [redrafting, setRedrafting] = useState(false)

  const meta = LEVEL_META[stakeholder.current_level] || LEVEL_META[0]

  async function saveEquilibrium() {
    const { error } = await supabase
      .from('stakeholder_equilibrium')
      .update({ equilibrium_state: eqDraft })
      .eq('id', stakeholder.id)
    if (error) { alert(error.message); return }
    setEditingEq(false)
    onUpdated()
  }

  async function saveLadder() {
    const { error } = await supabase
      .from('stakeholder_equilibrium')
      .update({ ladder: ladderDraft })
      .eq('id', stakeholder.id)
    if (error) { alert(error.message); return }
    setEditingLadder(false)
    onUpdated()
  }

  async function redraftFromAI() {
    setRedrafting(true)
    try {
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/draft-equilibrium`
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          asset_id: stakeholder.asset_id,
          stakeholder_name: stakeholder.stakeholder_name,
          stakeholder_type: stakeholder.stakeholder_type,
          stakeholder_role: stakeholder.stakeholder_role,
          influence_weight: stakeholder.influence_weight,
        }),
      })
      if (!resp.ok) {
        const t = await resp.text()
        throw new Error(t.substring(0, 200))
      }
      onUpdated()
    } catch (e: any) {
      alert(`Redraft failed: ${e.message}`)
    } finally {
      setRedrafting(false)
    }
  }

  return (
    <div className="fixed inset-y-0 right-0 w-[680px] bg-[#0e0e0e] border-l border-gray-800 shadow-2xl overflow-auto z-50">
      <div className="sticky top-0 bg-[#0e0e0e] border-b border-gray-800 px-6 py-4 flex items-start justify-between z-10">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold text-white">{stakeholder.stakeholder_name}</h2>
          <div className="text-xs text-gray-500 mt-0.5">
            {TYPE_META[stakeholder.stakeholder_type || '']?.label || 'stakeholder'} · {stakeholder.stakeholder_role || '(no role)'} · Influence {stakeholder.influence_weight}/10
          </div>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white ml-3">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Current level */}
      <div className={`px-6 py-5 ${meta.bg} border-b border-gray-800/50`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-lg ${meta.dot} text-white flex items-center justify-center text-base font-bold`}>
                L{stakeholder.current_level}
              </div>
              <div>
                <div className={`text-sm font-semibold ${meta.text}`}>{meta.label}</div>
                <div className="text-xs text-gray-400">
                  {stakeholder.current_level_updated_at
                    ? `Updated ${new Date(stakeholder.current_level_updated_at).toLocaleString()}`
                    : 'Never evaluated'}
                </div>
              </div>
            </div>
            {stakeholder.current_level_reasoning && (
              <p className="text-sm text-gray-200 leading-relaxed mt-2">
                {stakeholder.current_level_reasoning}
              </p>
            )}
            {(stakeholder.current_level_evidence || []).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {stakeholder.current_level_evidence.map((e, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 bg-gray-900 border border-gray-700 rounded text-gray-300" title={e.label}>
                    {e.id} · {e.label.length > 40 ? e.label.substring(0, 40) + '…' : e.label}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={onEvaluate}
            disabled={evaluating}
            className="px-3 py-1.5 text-sm bg-amber-600/30 border border-amber-500/40 rounded-lg hover:bg-amber-600/50 disabled:opacity-50 flex items-center gap-1.5 shrink-0"
          >
            {evaluating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Evaluating…</>
            ) : (
              <><RefreshCw className="w-4 h-4" /> Re-evaluate</>
            )}
          </button>
        </div>
      </div>

      {/* Equilibrium state */}
      <div className="px-6 py-5 border-b border-gray-800/40">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-amber-300 uppercase tracking-wider">Equilibrium state</h3>
          <div className="flex items-center gap-2">
            {!editingEq ? (
              <button
                onClick={() => { setEqDraft(stakeholder.equilibrium_state || ''); setEditingEq(true) }}
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" /> Edit
              </button>
            ) : (
              <>
                <button onClick={saveEquilibrium} className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1">
                  <Save className="w-3 h-3" /> Save
                </button>
                <button onClick={() => setEditingEq(false)} className="text-xs text-gray-500 hover:text-white">
                  Cancel
                </button>
              </>
            )}
            <button
              onClick={redraftFromAI}
              disabled={redrafting}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 disabled:opacity-50"
              title="Re-draft from AI (overwrites equilibrium + ladder)"
            >
              {redrafting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              Re-draft
            </button>
          </div>
        </div>
        {editingEq ? (
          <textarea
            value={eqDraft}
            onChange={(e) => setEqDraft(e.target.value)}
            rows={6}
            className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-sm text-gray-200"
          />
        ) : stakeholder.equilibrium_state ? (
          <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
            {stakeholder.equilibrium_state}
          </p>
        ) : (
          <p className="text-sm text-gray-500 italic">No equilibrium defined yet. Click Re-draft to generate.</p>
        )}
      </div>

      {/* Ladder */}
      <div className="px-6 py-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-amber-300 uppercase tracking-wider">Escalation ladder</h3>
          {!editingLadder ? (
            <button
              onClick={() => { setLadderDraft(stakeholder.ladder || []); setEditingLadder(true) }}
              className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
            >
              <Edit3 className="w-3 h-3" /> Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={saveLadder} className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1">
                <Save className="w-3 h-3" /> Save
              </button>
              <button onClick={() => setEditingLadder(false)} className="text-xs text-gray-500 hover:text-white">
                Cancel
              </button>
            </div>
          )}
        </div>
        <div className="space-y-2">
          {(editingLadder ? ladderDraft : stakeholder.ladder || []).map((rung, idx) => {
            const rungMeta = LEVEL_META[rung.level] || LEVEL_META[0]
            const isCurrent = rung.level === stakeholder.current_level
            return (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${isCurrent ? `${rungMeta.bg} border-amber-500/40` : 'bg-gray-900/40 border-gray-800/50'}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`shrink-0 w-8 h-8 rounded ${rungMeta.dot} text-white flex items-center justify-center text-xs font-bold`}>
                    L{rung.level}
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingLadder ? (
                      <>
                        <input
                          value={rung.label}
                          onChange={(e) => {
                            const next = [...ladderDraft]
                            next[idx] = { ...rung, label: e.target.value }
                            setLadderDraft(next)
                          }}
                          className="w-full bg-gray-950 border border-gray-700 rounded px-2 py-1 text-sm text-white mb-2 font-medium"
                          placeholder="Label"
                        />
                        <textarea
                          value={rung.description}
                          onChange={(e) => {
                            const next = [...ladderDraft]
                            next[idx] = { ...rung, description: e.target.value }
                            setLadderDraft(next)
                          }}
                          rows={2}
                          className="w-full bg-gray-950 border border-gray-700 rounded px-2 py-1 text-sm text-gray-300 mb-2"
                          placeholder="Description"
                        />
                        <textarea
                          value={(rung.indicators || []).join('\n')}
                          onChange={(e) => {
                            const next = [...ladderDraft]
                            next[idx] = { ...rung, indicators: e.target.value.split('\n').filter(Boolean) }
                            setLadderDraft(next)
                          }}
                          rows={3}
                          className="w-full bg-gray-950 border border-gray-700 rounded px-2 py-1 text-xs text-gray-400"
                          placeholder="Indicators (one per line)"
                        />
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm font-semibold ${rungMeta.text}`}>{rung.label}</span>
                          <span className="text-xs text-gray-500 italic">→ {rung.typical_response}</span>
                        </div>
                        <p className="text-sm text-gray-300 leading-snug">{rung.description}</p>
                        {rung.indicators && rung.indicators.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {rung.indicators.map((ind, i) => (
                              <li key={i} className="text-xs text-gray-400 flex items-start gap-1.5">
                                <span className="text-gray-600 mt-0.5">•</span>
                                <span>{ind}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          {(stakeholder.ladder || []).length === 0 && !editingLadder && (
            <p className="text-sm text-gray-500 italic">No ladder defined. Click Re-draft above to generate.</p>
          )}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// ADD STAKEHOLDER MODAL
// =============================================================================
function AddStakeholderModal({
  asset_id, existingNames, onClose, onCreated,
}: {
  asset_id: string
  existingNames: string[]
  onClose: () => void
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [type, setType] = useState<StakeholderType>('government')
  const [role, setRole] = useState('')
  const [influence, setInfluence] = useState(5)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!name.trim()) return
    if (existingNames.includes(name.trim())) {
      setError('A stakeholder with that name already exists on this project.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/draft-equilibrium`
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          asset_id,
          stakeholder_name: name.trim(),
          stakeholder_type: type,
          stakeholder_role: role.trim() || undefined,
          influence_weight: influence,
        }),
      })
      if (!resp.ok) {
        const t = await resp.text()
        throw new Error(t.substring(0, 200))
      }
      onCreated()
    } catch (e: any) {
      setError(e.message || 'Failed to create')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f0f0f] border border-gray-800 rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Add stakeholder</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs uppercase text-gray-500 mb-1 block">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. President Mulino, FQM, Donoso community"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs uppercase text-gray-500 mb-1 block">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as StakeholderType)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
              >
                {Object.entries(TYPE_META).map(([k, m]) => (
                  <option key={k} value={k}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase text-gray-500 mb-1 block">Influence (1-10)</label>
              <input
                type="number"
                min={1} max={10}
                value={influence}
                onChange={(e) => setInfluence(Math.max(1, Math.min(10, parseInt(e.target.value) || 5)))}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-xs uppercase text-gray-500 mb-1 block">Role (optional)</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. President of Panama, Operator, Royalty holder"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
            />
          </div>
          {error && <div className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded p-2">{error}</div>}
        </div>
        <div className="p-5 border-t border-gray-800 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 text-sm text-gray-400 hover:text-white">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || submitting}
            className="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Drafting equilibrium…</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Add & draft</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// OVERVIEW TAB — tracking at a glance: drift distribution, priorities, alerts
// =============================================================================
const THREAT_META: Record<string, { dot: string; text: string; bd: string; bg: string }> = {
  critical: { dot: 'bg-red-500', text: 'text-red-300', bd: 'border-red-800/50', bg: 'bg-red-950/40' },
  high: { dot: 'bg-orange-500', text: 'text-orange-300', bd: 'border-orange-800/40', bg: 'bg-orange-950/30' },
  medium: { dot: 'bg-amber-500', text: 'text-amber-300', bd: 'border-amber-800/40', bg: 'bg-amber-950/20' },
}
const FREEZE_START = Date.parse('2023-11-28T00:00:00Z')
const DECISION_DEADLINE = Date.parse('2026-06-01T00:00:00Z')
const pad2 = (n: number) => String(Math.max(0, n)).padStart(2, '0')

function OverviewTab({
  asset, stakeholders, priorities, triggeredConditions, conditionsCount, healthScore, healthLabel, healthColor, onOpenStakeholder, onGoStrategy, onGoStakeholders,
}: {
  asset: any
  stakeholders: Stakeholder[]
  priorities: Stakeholder[]
  triggeredConditions: any[]
  conditionsCount: number
  healthScore: number
  healthLabel: string
  healthColor: string
  onOpenStakeholder: (s: Stakeholder) => void
  onGoStrategy: () => void
  onGoStakeholders: () => void
}) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [])

  const daysFrozen = Math.floor((now - FREEZE_START) / 86400000)
  const ms = DECISION_DEADLINE - now
  const dd = Math.floor(ms / 86400000)
  const hh = Math.floor((ms % 86400000) / 3600000)
  const mm = Math.floor((ms % 3600000) / 60000)
  const ss = Math.floor((ms % 60000) / 1000)
  const decisionPassed = ms <= 0

  const events = useMemo(
    () => [...(asset?.events_feed || [])].sort((a: any, b: any) => (b.ts || '').localeCompare(a.ts || '')),
    [asset],
  )
  const ago = (ts: string) => {
    const d = Math.floor((now - Date.parse(ts)) / 86400000)
    if (d <= 0) return 'today'
    if (d < 30) return `${d}d ago`
    const mo = Math.floor(d / 30)
    return mo < 12 ? `${mo}mo ago` : `${Math.floor(mo / 12)}y ago`
  }

  const moves = useMemo(() => priorities
    .filter(s => s.strategy)
    .flatMap(s => (s.strategy!.moves || []).map(m => ({ ...m, who: s.stakeholder_name, level: s.current_level })))
    .sort((a, b) => (a.priority - b.priority) || (b.level - a.level))
    .slice(0, 6), [priorities])

  const withStrategy = priorities.filter(s => s.strategy).length

  // Threat level derives from the SAME equilibrium health shown in the top bar,
  // so the banner and the health readout never contradict each other.
  const sevKey = triggeredConditions.length > 0 || healthScore <= 0.35 ? 'critical'
    : healthScore <= 0.55 ? 'severe'
    : healthScore <= 0.70 ? 'elevated'
    : 'guarded'
  const SEV = {
    critical: { label: 'CRITICAL', text: 'text-red-400', dot: 'bg-red-500', border: 'border-red-800/50', from: 'from-red-950/70', glow: 'rgba(239,68,68,.22)' },
    severe: { label: 'SEVERE', text: 'text-red-400', dot: 'bg-red-500', border: 'border-red-800/50', from: 'from-red-950/55', glow: 'rgba(239,68,68,.16)' },
    elevated: { label: 'ELEVATED', text: 'text-orange-400', dot: 'bg-orange-500', border: 'border-orange-800/50', from: 'from-orange-950/45', glow: 'rgba(249,115,22,.16)' },
    guarded: { label: 'GUARDED', text: 'text-amber-400', dot: 'bg-amber-500', border: 'border-amber-800/50', from: 'from-amber-950/40', glow: 'rgba(245,158,11,.14)' },
  }[sevKey]

  return (
    <div className="pb-16">
      <style>{`
        @keyframes wr-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes wr-glow { 0%,100%{box-shadow:0 0 0 0 rgba(0,0,0,0)} 50%{box-shadow:0 0 28px 1px var(--wr-glow,rgba(239,68,68,.22))} }
        @keyframes wr-in { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        @keyframes wr-scan { 0%{top:-10%} 100%{top:110%} }
      `}</style>

      {/* ── CRISIS BANNER ───────────────────────────────────────── */}
      <div className="px-8 pt-6">
        <div className={`relative overflow-hidden rounded-2xl border ${SEV.border} bg-gradient-to-br ${SEV.from} via-[#160a0a] to-[#0a0a0a] p-6`} style={{ animation: 'wr-glow 3.2s ease-in-out infinite', ['--wr-glow' as any]: SEV.glow }}>
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 26px)' }} />
          <div className="relative flex flex-wrap items-center justify-between gap-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2.5 h-2.5 rounded-full ${SEV.dot}`} style={{ animation: 'wr-pulse 1.1s infinite' }} />
                <span className={`text-[0.7rem] font-bold tracking-[0.25em] ${SEV.text}`}>THREAT LEVEL — {SEV.label} · ASSET FROZEN</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white leading-none tracking-tight">COBRE PANAMÁ</h2>
              <p className="text-sm text-red-200/70 mt-2 max-w-2xl">
                Mine shut by Supreme Court ruling. State slow-walking reopening behind an audit. $20B arbitration leverage under pressure. <span className="text-white font-semibold">Decision window is OPEN — and closing.</span>
              </p>
            </div>
            <div className="flex items-center gap-5 shrink-0">
              <div className="text-center">
                <div className="text-4xl font-black text-white tabular-nums leading-none">{daysFrozen}</div>
                <div className="text-[0.55rem] uppercase tracking-[0.2em] text-gray-500 mt-1.5">days frozen</div>
              </div>
              <div className="h-14 w-px bg-red-800/40" />
              <div className="text-center">
                <div className="text-[0.55rem] uppercase tracking-[0.2em] text-red-400 mb-1.5">{decisionPassed ? 'Mulino decision' : 'Mulino decision in'}</div>
                {decisionPassed ? (
                  <div className="text-2xl font-black text-amber-300">AWAITING</div>
                ) : (
                  <div className="flex items-end gap-1.5 justify-center">
                    {([['D', dd], ['H', hh], ['M', mm], ['S', ss]] as [string, number][]).map(([lbl, val]) => (
                      <div key={lbl} className="px-2 py-1 rounded-md bg-black/40 border border-red-900/50 min-w-[2.6rem]">
                        <div className="text-xl font-black text-white tabular-nums leading-none">{lbl === 'D' ? val : pad2(val)}</div>
                        <div className="text-[0.5rem] uppercase tracking-widest text-red-500/70 mt-0.5">{lbl}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── STAKES STRIP ────────────────────────────────────────── */}
      <div className="px-8 mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StakeTile label="At risk — arbitration" value="$20B" sub="ICC claim · leverage" tone="red" />
        <StakeTile label="Copper locked on site" value="70kt" sub="~38Mt stockpile" tone="amber" />
        <StakeTile label="Of Panama GDP" value="~5%" sub="$1.7B lost to date" tone="amber" />
        <button onClick={onGoStakeholders} className="text-left">
          <StakeTile label="Equilibrium integrity" value={`${Math.round(healthScore * 100)}%`} sub={healthLabel} tone={healthScore > 0.65 ? 'green' : healthScore > 0.45 ? 'amber' : 'red'} valueClass={healthColor} />
        </button>
      </div>

      {/* ── MAIN GRID: live intel + threat board ────────────────── */}
      <div className="px-8 mt-6 grid lg:grid-cols-[1.35fr,1fr] gap-5">
        {/* LIVE GROUND INTEL */}
        <div className="relative overflow-hidden rounded-2xl border border-gray-800/70 bg-[#0c0c0c]">
          <div className="absolute left-0 right-0 h-16 pointer-events-none opacity-30" style={{ background: 'linear-gradient(180deg,rgba(245,158,11,.12),transparent)', animation: 'wr-scan 6s linear infinite' }} />
          <div className="relative px-5 py-3.5 border-b border-gray-800/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" style={{ animation: 'wr-pulse 1.4s infinite' }} />
              <span className="text-xs font-bold tracking-[0.2em] text-amber-400">LIVE GROUND INTEL</span>
            </div>
            <span className="text-[0.65rem] text-gray-600">{events.length} signals</span>
          </div>
          <div className="relative max-h-[460px] overflow-y-auto divide-y divide-gray-800/50">
            {events.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-600">No intel yet.</div>
            ) : events.map((ev: any, i: number) => {
              const t = THREAT_META[ev.threat] || THREAT_META.medium
              return (
                <div key={ev.id || i} className="px-5 py-3.5" style={{ animation: 'wr-in .4s ease both', animationDelay: `${Math.min(i * 40, 400)}ms` }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} style={ev.threat === 'critical' ? { animation: 'wr-pulse 1s infinite' } : undefined} />
                    <span className={`text-[0.6rem] font-bold uppercase tracking-[0.15em] ${t.text}`}>{ev.source || 'intel'}</span>
                    <span className="text-[0.6rem] text-gray-600 ml-auto">{ago(ev.ts)}</span>
                  </div>
                  <p className="text-sm text-gray-200 leading-snug">{ev.summary}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {(Array.isArray(ev.auto_tags) ? ev.auto_tags : (ev.auto_tags?.topics || [])).slice(0, 4).map((tg: string, k: number) => (
                      <span key={k} className="text-[0.6rem] px-1.5 py-0.5 rounded bg-gray-900 text-gray-500 border border-gray-800">{tg}</span>
                    ))}
                    {ev.url && (
                      <a href={ev.url} target="_blank" rel="noopener noreferrer" className="text-[0.6rem] text-amber-500/80 hover:text-amber-400 inline-flex items-center gap-0.5 ml-auto">
                        source <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* THREAT BOARD */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-800/70 bg-[#0c0c0c] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-800/70 flex items-center justify-between">
              <span className="text-xs font-bold tracking-[0.2em] text-gray-300">STAKEHOLDER THREAT BOARD</span>
              <span className="text-[0.65rem] text-amber-400 font-semibold">{priorities.length} off-equilibrium / {stakeholders.length}</span>
            </div>
            <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-800/50">
              {priorities.length === 0 ? (
                <div className="p-6 text-sm text-green-300">All tracked stakeholders at equilibrium.</div>
              ) : priorities.slice(0, 8).map(s => {
                const meta = LEVEL_META[s.current_level]
                return (
                  <button key={s.id} onClick={() => onOpenStakeholder(s)} className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-gray-900/60">
                    <div className={`shrink-0 w-7 h-7 rounded ${meta.bg} ${meta.text} flex items-center justify-center text-xs font-bold ${s.current_level >= 4 ? '' : ''}`} style={s.current_level >= 4 ? { animation: 'wr-pulse 1.3s infinite' } : undefined}>L{s.current_level}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{s.stakeholder_name}</div>
                      <div className="text-[0.65rem] text-gray-500 truncate">{meta.label} · inf {s.influence_weight}/10</div>
                    </div>
                    <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${s.strategy ? 'bg-green-500' : 'bg-gray-700'}`} title={s.strategy ? 'strategy ready' : 'no strategy'} />
                  </button>
                )
              })}
            </div>
          </div>

          {triggeredConditions.length > 0 && (
            <div className="rounded-2xl border border-red-800/50 bg-red-950/30 overflow-hidden">
              <div className="px-5 py-3 border-b border-red-800/40 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                <span className="text-xs font-bold tracking-[0.2em] text-red-300">TRIGGERED ALERTS · {triggeredConditions.length}</span>
              </div>
              <div className="divide-y divide-red-900/40">
                {triggeredConditions.map(c => (
                  <div key={c.id} className="px-4 py-2.5">
                    <p className="text-sm text-gray-200 leading-snug">{c.condition_text}</p>
                    {c.target_entity && <p className="text-[0.65rem] text-red-400/70 mt-0.5">{c.target_entity}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── PATH FORWARD — ACTIVE PROTOCOL ──────────────────────── */}
      <div className="px-8 mt-6">
        <div className="rounded-2xl border border-amber-800/40 bg-gradient-to-br from-amber-950/20 to-[#0a0a0a] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-amber-800/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold tracking-[0.2em] text-amber-300">PATH FORWARD — ACTIVE PROTOCOL</span>
            </div>
            <button onClick={onGoStrategy} className="text-[0.7rem] text-amber-400 hover:text-amber-300 flex items-center gap-1">
              Full strategy ({withStrategy}/{priorities.length}) <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="p-5">
            {moves.length === 0 ? (
              <div className="text-sm text-gray-500">
                No protocol drafted yet. <button onClick={onGoStrategy} className="text-amber-400 hover:text-amber-300">Generate the path forward →</button>
              </div>
            ) : (
              <ol className="space-y-2.5">
                {moves.map((m, i) => (
                  <li key={i} className="flex items-start gap-3" style={{ animation: 'wr-in .4s ease both', animationDelay: `${i * 50}ms` }}>
                    <span className="shrink-0 w-6 h-6 rounded-full bg-amber-600/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-100 leading-snug">{m.action}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="text-[0.6rem] px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-300/90 border border-amber-900/50">{m.who}</span>
                        {m.timeframe && <span className="text-[0.6rem] px-1.5 py-0.5 rounded bg-gray-900 text-gray-400 border border-gray-800">{m.timeframe}</span>}
                        {m.owner && <span className="text-[0.6rem] px-1.5 py-0.5 rounded bg-gray-900 text-gray-400 border border-gray-800">{m.owner}</span>}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StakeTile({ label, value, sub, tone, valueClass }: { label: string; value: string; sub: string; tone: 'red' | 'amber' | 'green'; valueClass?: string }) {
  const ring = tone === 'red' ? 'border-red-800/40' : tone === 'green' ? 'border-green-800/40' : 'border-amber-800/40'
  const val = valueClass || (tone === 'red' ? 'text-red-300' : tone === 'green' ? 'text-green-300' : 'text-amber-300')
  return (
    <div className={`p-4 rounded-xl bg-[#0c0c0c] border ${ring}`}>
      <div className="text-[0.6rem] uppercase tracking-[0.15em] text-gray-500 mb-1">{label}</div>
      <div className={`text-2xl font-black ${val} leading-none`}>{value}</div>
      <div className="text-[0.65rem] text-gray-600 mt-1">{sub}</div>
    </div>
  )
}

// =============================================================================
// STRATEGY TAB — the play to close each gap, drifted stakeholders first
// =============================================================================
function StrategyTab({
  priorities, totalTracked, onDraft, draftingId, onOpenStakeholder,
}: {
  priorities: Stakeholder[]
  totalTracked: number
  onDraft: (id: string) => void
  draftingId: string | null
  onOpenStakeholder: (s: Stakeholder) => void
}) {
  return (
    <div className="px-8 py-6 pb-12">
      <p className="text-sm text-gray-500 mb-5 max-w-2xl">
        Strategy for the stakeholders currently off equilibrium (L1+), ranked by influence × drift. Each plan is the set of moves to pull them back toward their equilibrium state.
      </p>

      {priorities.length === 0 ? (
        <div className="p-8 bg-green-900/20 border border-green-800/40 rounded-xl text-center">
          <Shield className="w-10 h-10 mx-auto mb-3 text-green-700" />
          <p className="text-green-300 mb-1">No gaps to address.</p>
          <p className="text-sm text-gray-500">
            {totalTracked === 0 ? 'No stakeholders modeled yet.' : 'All tracked stakeholders are at equilibrium.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {priorities.map(s => {
            const meta = LEVEL_META[s.current_level]
            const drafting = draftingId === s.id
            const strat = s.strategy
            return (
              <div key={s.id} className="bg-gray-900/40 border border-gray-800/60 rounded-xl overflow-hidden">
                {/* header */}
                <div className="px-5 py-4 flex items-start justify-between gap-4 border-b border-gray-800/50">
                  <button onClick={() => onOpenStakeholder(s)} className="flex items-start gap-3 text-left min-w-0">
                    <div className={`shrink-0 w-9 h-9 rounded-lg ${meta.bg} ${meta.text} flex items-center justify-center text-sm font-bold`}>L{s.current_level}</div>
                    <div className="min-w-0">
                      <div className="font-semibold text-white truncate">{s.stakeholder_name}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {s.stakeholder_role || TYPE_META[s.stakeholder_type || '']?.label || 'stakeholder'} · {meta.label} · influence {s.influence_weight}/10
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => onDraft(s.id)}
                    disabled={drafting}
                    className="shrink-0 px-3 py-1.5 text-sm bg-amber-600/20 border border-amber-500/30 rounded-lg hover:bg-amber-600/30 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {drafting ? <><Loader2 className="w-4 h-4 animate-spin" /> Drafting…</>
                      : strat ? <><RefreshCw className="w-4 h-4" /> Re-draft</>
                      : <><Sparkles className="w-4 h-4" /> Draft strategy</>}
                  </button>
                </div>

                {/* body */}
                <div className="px-5 py-4">
                  {strat ? (
                    <>
                      <div className="mb-3">
                        <div className="text-[0.65rem] uppercase tracking-wider text-amber-300 font-semibold mb-1">Objective</div>
                        <p className="text-sm text-gray-200">{strat.objective}</p>
                      </div>
                      <div className="space-y-2">
                        {strat.moves.map((m, i) => (
                          <div key={i} className="p-3 bg-gray-950/60 border border-gray-800/50 rounded-lg">
                            <div className="flex items-start gap-2">
                              <span className="shrink-0 w-5 h-5 rounded bg-amber-600/30 text-amber-200 text-xs font-bold flex items-center justify-center mt-0.5">{m.priority}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-100">{m.action}</p>
                                {m.rationale && <p className="text-xs text-gray-500 mt-1">{m.rationale}</p>}
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {m.timeframe && <span className="text-[0.65rem] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">{m.timeframe}</span>}
                                  {m.owner && <span className="text-[0.65rem] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">{m.owner}</span>}
                                  {m.channel && <span className="text-[0.65rem] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">{m.channel}</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {strat.drafted_at && (
                        <div className="text-xs text-gray-600 mt-3">Drafted {new Date(strat.drafted_at).toLocaleString()}{strat.model ? ` · ${strat.model}` : ''}</div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      No strategy yet. {s.current_level_reasoning ? `Current read: ${s.current_level_reasoning}` : ''} Click <span className="text-amber-400">Draft strategy</span> to generate the plan to close this gap.
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
