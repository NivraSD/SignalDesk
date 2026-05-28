'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Radio,
  Bell,
  AlertCircle,
  Calendar,
  Building2,
} from 'lucide-react'

type Scenario = {
  id: string
  topic: string
  issue_area: string | null
  is_live: boolean
  organization_id: string
  source_report_id: string | null
  last_event_at: string | null
  created_at: string
  events_feed: any[]
  org_name: string
  parent_org_name: string | null
  parent_org_id: string | null
  entity_count: number
  conditions_open: number
  conditions_triggered: number
}

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

const ISSUE_AREA_COLORS: Record<string, string> = {
  middle_east: 'bg-amber-50 text-amber-700 border-amber-200',
  ai: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  critical_minerals: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  defense_production: 'bg-rose-50 text-rose-700 border-rose-200',
  chips: 'bg-sky-50 text-sky-700 border-sky-200',
}

export default function ScenariosIndexPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError(null)

        // 1. Live scenarios
        const { data: scns, error: sErr } = await supabase
          .from('lp_scenarios')
          .select('id, topic, issue_area, is_live, organization_id, source_report_id, last_event_at, created_at, events_feed')
          .eq('is_live', true)
          .order('last_event_at', { ascending: false, nullsFirst: false })
        if (sErr) throw sErr
        const scenarioRows = scns || []
        if (scenarioRows.length === 0) {
          if (!cancelled) { setScenarios([]); setLoading(false) }
          return
        }

        // 2. Org names (and parent org names)
        const orgIds = Array.from(new Set(scenarioRows.map(s => s.organization_id)))
        const { data: orgs } = await supabase
          .from('organizations')
          .select('id, name, parent_organization_id')
          .in('id', orgIds)
        const orgsById = new Map((orgs || []).map((o: any) => [o.id, o]))

        const parentIds = Array.from(new Set(
          (orgs || []).map((o: any) => o.parent_organization_id).filter(Boolean),
        )) as string[]
        let parentsById = new Map<string, any>()
        if (parentIds.length > 0) {
          const { data: parents } = await supabase
            .from('organizations')
            .select('id, name')
            .in('id', parentIds)
          parentsById = new Map((parents || []).map((p: any) => [p.id, p]))
        }

        // 3. Per-scenario counts (entities + watch conditions)
        const scenarioIds = scenarioRows.map(s => s.id)

        const { data: ents } = await supabase
          .from('lp_entity_profiles')
          .select('scenario_id')
          .in('scenario_id', scenarioIds)
        const entityCount = new Map<string, number>()
        for (const e of ents || []) {
          entityCount.set(e.scenario_id, (entityCount.get(e.scenario_id) || 0) + 1)
        }

        const { data: conds } = await supabase
          .from('lp_watch_conditions')
          .select('scenario_id, status')
          .in('scenario_id', scenarioIds)
        const openCount = new Map<string, number>()
        const trigCount = new Map<string, number>()
        for (const c of conds || []) {
          if (c.status === 'triggered') {
            trigCount.set(c.scenario_id, (trigCount.get(c.scenario_id) || 0) + 1)
          } else if (c.status === 'active') {
            openCount.set(c.scenario_id, (openCount.get(c.scenario_id) || 0) + 1)
          }
        }

        const enriched: Scenario[] = scenarioRows.map((s: any) => {
          const org = orgsById.get(s.organization_id)
          const parentOrg = org?.parent_organization_id ? parentsById.get(org.parent_organization_id) : null
          return {
            ...s,
            events_feed: Array.isArray(s.events_feed) ? s.events_feed : [],
            org_name: org?.name || '(unknown org)',
            parent_org_name: parentOrg?.name || null,
            parent_org_id: org?.parent_organization_id || null,
            entity_count: entityCount.get(s.id) || 0,
            conditions_open: openCount.get(s.id) || 0,
            conditions_triggered: trigCount.get(s.id) || 0,
          }
        })

        if (!cancelled) setScenarios(enriched)
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load scenarios')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Top Nav */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-[var(--burnt-orange)]" />
                <h1 className="font-semibold text-lg text-[var(--charcoal)]">Live Scenarios</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--burnt-orange)]" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-4">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        ) : scenarios.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Radio className="w-10 h-10 mx-auto mb-4 text-gray-300" />
            <p className="font-medium">No live scenarios yet</p>
            <p className="text-sm mt-1">
              Promote a PA research report from a project to create one.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {scenarios.map(s => (
              <button
                key={s.id}
                onClick={() => router.push(`/dashboard/scenarios/${s.id}`)}
                className="text-left bg-white border border-gray-200 rounded-lg p-5 hover:border-[var(--burnt-orange)] hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      {s.issue_area && (
                        <span className={`text-xs px-2 py-0.5 rounded border ${ISSUE_AREA_COLORS[s.issue_area] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                          {s.issue_area.replace(/_/g, ' ')}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live
                      </span>
                    </div>
                    <h2 className="font-semibold text-[var(--charcoal)] mb-1 line-clamp-2">
                      {s.topic || '(untitled scenario)'}
                    </h2>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>
                        {s.parent_org_name && (
                          <>
                            <span className="text-gray-400">{s.parent_org_name}</span>
                            <span className="mx-1 text-gray-300">›</span>
                          </>
                        )}
                        <span>{s.org_name}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span><strong className="text-gray-700">{s.entity_count}</strong> stakeholders</span>
                      <span>·</span>
                      <span><strong className="text-gray-700">{s.events_feed?.length || 0}</strong> events</span>
                      <span>·</span>
                      <span>
                        <strong className="text-gray-700">{s.conditions_open}</strong> open
                        {s.conditions_triggered > 0 && (
                          <span className="ml-1 text-rose-600 font-medium inline-flex items-center gap-0.5">
                            <Bell className="w-3 h-3" />
                            {s.conditions_triggered} triggered
                          </span>
                        )}
                      </span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {timeAgo(s.last_event_at || s.created_at)}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[var(--burnt-orange)] transition-colors flex-shrink-0 mt-1" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
