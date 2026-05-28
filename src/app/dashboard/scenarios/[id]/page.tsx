'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import {
  ChevronLeft,
  Loader2,
  Radio,
  Bell,
  AlertCircle,
  Building2,
  Activity,
  Calendar,
  Target,
  Users,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
} from 'lucide-react'

// =============================================================================
// TYPES
// =============================================================================
interface ScenarioEvent {
  id: string
  ts: string
  source: string | null
  summary: string
  auto_tags?: string[]
  entities_referenced?: string[]
}

interface Scenario {
  id: string
  topic: string
  issue_area: string | null
  is_live: boolean
  organization_id: string
  status: string | null
  scenario_data: any
  events_feed: ScenarioEvent[]
  last_event_at: string | null
  created_at: string
}

interface Entity {
  id: string
  entity_name: string
  entity_type: string | null
  category: string | null
  position: string | null
  influence_weight: string | null
  current_situation: string | null
  likely_next_move: string | null
}

interface WatchCondition {
  id: string
  condition_text: string | null
  condition_context: string | null
  target_entity: string | null
  status: string | null
  confidence: number | null
  impact_level: string | null
  effort_level: string | null
  triggered_at: string | null
}

interface Simulation {
  id: string
  status: string | null
  rounds_completed: number | null
  stabilization_score: number | null
  dominant_narratives: any
  created_at: string
  completed_at: string | null
}

// =============================================================================
// CONSTANTS
// =============================================================================
const ISSUE_AREA_COLORS: Record<string, string> = {
  middle_east: 'bg-amber-50 text-amber-700 border-amber-200',
  ai: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  critical_minerals: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  defense_production: 'bg-rose-50 text-rose-700 border-rose-200',
  chips: 'bg-sky-50 text-sky-700 border-sky-200',
}

const CATEGORY_LABELS: Record<string, string> = {
  regulator: 'Regulators',
  legislative: 'Legislative',
  executive: 'Executive',
  judicial: 'Judicial',
  private: 'Private sector',
  civil: 'Civil society',
  press: 'Media',
}

// Position relative to the scenario's goal (here: reopening).
const POSITION_META: Record<string, { label: string; cls: string; Icon: any }> = {
  in_favor: { label: 'In favor', cls: 'text-emerald-700 bg-emerald-50 border-emerald-200', Icon: TrendingUp },
  neutral: { label: 'Neutral', cls: 'text-gray-600 bg-gray-50 border-gray-200', Icon: Minus },
  against: { label: 'Against', cls: 'text-rose-700 bg-rose-50 border-rose-200', Icon: TrendingDown },
}

const INFLUENCE_RANK: Record<string, number> = { very_high: 4, high: 3, medium: 2, low: 1, very_low: 0 }
const influenceStars = (w: string | null) => '★'.repeat(INFLUENCE_RANK[w || ''] ?? 1) || '★'

function timeAgo(ts: string | null): string {
  if (!ts) return 'never'
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(ts).toLocaleDateString()
}

// =============================================================================
// PAGE
// =============================================================================
export default function ScenarioWorkspacePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [orgName, setOrgName] = useState<string>('')
  const [entities, setEntities] = useState<Entity[]>([])
  const [conditions, setConditions] = useState<WatchCondition[]>([])
  const [simulations, setSimulations] = useState<Simulation[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const { data: scn, error: sErr } = await supabase
          .from('lp_scenarios')
          .select('id, topic, issue_area, is_live, organization_id, status, scenario_data, events_feed, last_event_at, created_at')
          .eq('id', id)
          .single()
        if (sErr) throw sErr
        if (!scn) throw new Error('Scenario not found')

        const [{ data: org }, { data: ents }, { data: conds }, { data: sims }] = await Promise.all([
          supabase.from('organizations').select('name').eq('id', scn.organization_id).single(),
          supabase.from('lp_entity_profiles')
            .select('id, entity_name, entity_type, category, position, influence_weight, current_situation, likely_next_move')
            .eq('scenario_id', id),
          supabase.from('lp_watch_conditions')
            .select('id, condition_text, condition_context, target_entity, status, confidence, impact_level, effort_level, triggered_at')
            .eq('scenario_id', id),
          supabase.from('lp_simulations')
            .select('id, status, rounds_completed, stabilization_score, dominant_narratives, created_at, completed_at')
            .eq('scenario_id', id)
            .order('created_at', { ascending: false }),
        ])

        if (cancelled) return
        setScenario({ ...scn, events_feed: Array.isArray(scn.events_feed) ? scn.events_feed : [] })
        setOrgName(org?.name || '(unknown org)')
        setEntities(ents || [])
        setConditions(conds || [])
        setSimulations(sims || [])
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load scenario')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  const events = useMemo(
    () => [...(scenario?.events_feed || [])].sort((a, b) => (b.ts || '').localeCompare(a.ts || '')),
    [scenario],
  )
  const triggered = conditions.filter(c => c.status === 'triggered')
  const openConditions = conditions.filter(c => c.status === 'active')

  const groupedEntities = useMemo(() => {
    const groups: Record<string, Entity[]> = {}
    for (const e of entities) {
      const k = e.category || 'other'
      ;(groups[k] ||= []).push(e)
    }
    for (const k of Object.keys(groups)) {
      groups[k].sort((a, b) => (INFLUENCE_RANK[b.influence_weight || ''] ?? 0) - (INFLUENCE_RANK[a.influence_weight || ''] ?? 0))
    }
    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length)
  }, [entities])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--burnt-orange)]" />
      </div>
    )
  }
  if (error || !scenario) {
    return (
      <div className="min-h-screen bg-[#fafafa] p-8">
        <div className="max-w-2xl mx-auto flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-4">
          <AlertCircle className="w-5 h-5" />
          <span>{error || 'Scenario not found'}</span>
        </div>
      </div>
    )
  }

  const foundingSummary = scenario.scenario_data?.founding_summary as string | undefined

  return (
    <div className="min-h-screen bg-[#fafafa] pb-16">
      {/* Top bar */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => router.push('/dashboard/scenarios')}
                className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                title="Back to scenarios"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <Radio className="w-5 h-5 text-[var(--burnt-orange)] shrink-0" />
              <h1 className="font-semibold text-[var(--charcoal)] truncate">{scenario.topic}</h1>
            </div>
            <button
              onClick={() => router.push(`/dashboard/projects/${scenario.id}`)}
              className="shrink-0 text-xs px-3 py-1.5 text-gray-600 hover:text-[var(--charcoal)] border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-1.5"
            >
              <Activity className="w-3.5 h-3.5" /> Equilibrium view
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Meta + founding thesis */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {scenario.issue_area && (
              <span className={`text-xs px-2 py-0.5 rounded border ${ISSUE_AREA_COLORS[scenario.issue_area] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                {scenario.issue_area.replace(/_/g, ' ')}
              </span>
            )}
            {scenario.is_live && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <Building2 className="w-3.5 h-3.5" /> {orgName}
            </span>
          </div>
          {foundingSummary ? (
            <>
              <div className="text-[0.65rem] uppercase tracking-wider text-[var(--burnt-orange)] font-semibold mb-1">Founding thesis</div>
              <p className="text-sm text-gray-700 leading-relaxed">{foundingSummary}</p>
            </>
          ) : (
            <p className="text-sm text-gray-500 italic">No founding summary recorded for this scenario.</p>
          )}
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat icon={Users} label="Stakeholders" value={entities.length} />
          <Stat icon={Calendar} label="Events" value={events.length} sub={`updated ${timeAgo(scenario.last_event_at || scenario.created_at)}`} />
          <Stat icon={Target} label="Watch conditions" value={conditions.length} sub={`${openConditions.length} open · ${triggered.length} triggered`} alert={triggered.length > 0} />
          <Stat icon={Zap} label="Simulations" value={simulations.length} />
        </div>

        {/* Events feed */}
        <Section title="Events feed" count={events.length}>
          {events.length === 0 ? (
            <Empty>No events recorded yet.</Empty>
          ) : (
            <ol className="relative border-l border-gray-200 ml-2 space-y-4">
              {events.map(ev => (
                <li key={ev.id} className="ml-4">
                  <div className="absolute -left-[5px] w-2.5 h-2.5 rounded-full bg-[var(--burnt-orange)] mt-1.5" />
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs text-gray-400">{new Date(ev.ts).toLocaleString()}</span>
                    {ev.source && (
                      <span className="text-[0.65rem] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                        {ev.source.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 leading-snug">{ev.summary}</p>
                  {ev.auto_tags && ev.auto_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {ev.auto_tags.map((t, i) => (
                        <span key={i} className="text-[0.65rem] px-1.5 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-100">{t}</span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          )}
        </Section>

        {/* Watch conditions */}
        <Section title="Watch conditions" count={conditions.length}>
          {conditions.length === 0 ? (
            <Empty>No watch conditions defined.</Empty>
          ) : (
            <div className="space-y-2">
              {[...triggered, ...openConditions, ...conditions.filter(c => c.status !== 'triggered' && c.status !== 'active')].map(c => {
                const isTrig = c.status === 'triggered'
                return (
                  <div key={c.id} className={`p-3 rounded-lg border ${isTrig ? 'bg-rose-50 border-rose-200' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800">{c.condition_text || '(no condition text)'}</p>
                        {c.target_entity && <p className="text-xs text-gray-500 mt-0.5">Target: {c.target_entity}</p>}
                      </div>
                      <span className={`shrink-0 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border ${isTrig ? 'text-rose-700 bg-rose-100 border-rose-300' : 'text-gray-600 bg-gray-50 border-gray-200'}`}>
                        {isTrig && <Bell className="w-3 h-3" />}
                        {c.status || 'unknown'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      {c.confidence != null && <span>confidence {Math.round(c.confidence * 100)}%</span>}
                      {c.impact_level && <span>· impact {c.impact_level}</span>}
                      {c.effort_level && <span>· effort {c.effort_level}</span>}
                      {isTrig && c.triggered_at && <span>· triggered {timeAgo(c.triggered_at)}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Section>

        {/* Stakeholders */}
        <Section title="Stakeholders" count={entities.length}>
          {entities.length === 0 ? (
            <Empty>No stakeholders modeled for this scenario.</Empty>
          ) : (
            <div className="space-y-5">
              {groupedEntities.map(([cat, list]) => (
                <div key={cat}>
                  <div className="text-[0.65rem] uppercase tracking-wider text-gray-400 font-semibold mb-2">
                    {CATEGORY_LABELS[cat] || cat} · {list.length}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {list.map(e => {
                      const pos = POSITION_META[e.position || ''] || POSITION_META.neutral
                      return (
                        <div key={e.id} className="p-3 bg-white border border-gray-200 rounded-lg">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span className="font-medium text-sm text-[var(--charcoal)]">{e.entity_name}</span>
                            <span className={`shrink-0 inline-flex items-center gap-1 text-[0.65rem] px-1.5 py-0.5 rounded border ${pos.cls}`}>
                              <pos.Icon className="w-3 h-3" /> {pos.label}
                            </span>
                          </div>
                          <div className="text-[0.7rem] text-amber-600 mb-1" title={`influence: ${e.influence_weight || 'unknown'}`}>
                            {influenceStars(e.influence_weight)}
                          </div>
                          {e.current_situation && (
                            <p className="text-xs text-gray-600 leading-snug line-clamp-3">{e.current_situation}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Simulations */}
        {simulations.length > 0 && (
          <Section title="Simulations" count={simulations.length}>
            <div className="space-y-2">
              {simulations.map(s => (
                <div key={s.id} className="p-3 bg-white border border-gray-200 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-800">
                      {s.status || 'unknown'} · {s.rounds_completed ?? 0} rounds
                    </div>
                    <div className="text-xs text-gray-500">{new Date(s.created_at).toLocaleString()}</div>
                  </div>
                  {s.stabilization_score != null && (
                    <span className="text-xs text-gray-600">
                      stabilization {Math.round(s.stabilization_score * 100)}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// SMALL COMPONENTS
// =============================================================================
function Stat({ icon: Icon, label, value, sub, alert }: { icon: any; label: string; value: number; sub?: string; alert?: boolean }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <div className={`text-2xl font-semibold ${alert ? 'text-rose-600' : 'text-[var(--charcoal)]'}`}>{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
    </div>
  )
}

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-semibold text-[var(--charcoal)] uppercase tracking-wider">{title}</h2>
        {count != null && <span className="text-xs text-gray-400">{count}</span>}
      </div>
      {children}
    </div>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="text-sm text-gray-500 bg-white border border-gray-200 rounded-lg p-6 text-center">{children}</div>
}
