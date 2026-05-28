'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Activity, Loader2, ChevronRight, ChevronLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface Project {
  id: string
  topic: string
  issue_area: string | null
  organization_id: string
  is_live: boolean
  updated_at: string
}

export default function ProjectsIndexPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('lp_scenarios')
        .select('id, topic, issue_area, organization_id, is_live, updated_at')
        .eq('is_live', true)
        .order('updated_at', { ascending: false })
      setProjects(data || [])
      setLoading(false)
    })()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-white mb-6"
        >
          <ChevronLeft className="w-4 h-4" /> Back to dashboard
        </button>
        <div className="flex items-center gap-3 mb-2">
          <Activity className="w-6 h-6 text-amber-500" />
          <h1 className="text-2xl font-bold">Projects</h1>
        </div>
        <p className="text-gray-500 text-sm mb-8">
          Each project is a stakeholder equilibrium surface. Click in to see health, ladders, and drift.
        </p>

        <div className="space-y-2">
          {projects.length === 0 ? (
            <div className="p-8 text-center text-gray-500 bg-gray-900/30 border border-gray-800 rounded-xl">
              No live projects yet. Promote a scenario to is_live=true to make it a project.
            </div>
          ) : (
            projects.map(p => (
              <button
                key={p.id}
                onClick={() => router.push(`/dashboard/projects/${p.id}`)}
                className="w-full text-left p-4 bg-gray-900/40 border border-gray-800/50 rounded-xl hover:bg-gray-900/70 hover:border-amber-700/30 transition-all flex items-center justify-between"
              >
                <div>
                  <div className="font-medium text-white">{p.topic}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {p.issue_area || 'general'} · updated {new Date(p.updated_at).toLocaleDateString()}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
