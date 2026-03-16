'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAppStore } from '@/stores/useAppStore'
import { useAuth } from '@/components/auth/AuthProvider'
import {
  Zap,
  ChevronLeft,
  Users,
  Crosshair,
  Loader2
} from 'lucide-react'

import SimulationList from '@/components/lp/SimulationList'
import ScenarioBuilder from '@/components/lp/ScenarioBuilder'
import SimulationRunner from '@/components/lp/SimulationRunner'
import SimulationViewer from '@/components/lp/SimulationViewer'
import EntityProfileTester from '@/components/lp/EntityProfileTester'
type LPView = 'list' | 'scenario' | 'runner' | 'viewer' | 'entities'

export default function LPPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--burnt-orange)]" />
      </div>
    }>
      <LPPageInner />
    </Suspense>
  )
}

function LPPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const organization = useAppStore(s => s.organization)
  const [activeView, setActiveView] = useState<LPView>('list')
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null)
  const [selectedSimulationId, setSelectedSimulationId] = useState<string | null>(null)

  // Handle ?from=pa&view=scenario URL params
  useEffect(() => {
    const fromPA = searchParams.get('from') === 'pa'
    const view = searchParams.get('view') as LPView | null
    if (fromPA && view === 'scenario') {
      setActiveView('scenario')
    }
  }, [searchParams])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--burnt-orange)]" />
      </div>
    )
  }

  if (!user) {
    router.push('/auth/login')
    return null
  }

  const navItems: { id: LPView; label: string; icon: React.ReactNode }[] = [
    { id: 'list', label: 'Simulations', icon: <Zap className="w-4 h-4" /> },
    { id: 'scenario', label: 'Scenario Builder', icon: <Crosshair className="w-4 h-4" /> },
    { id: 'entities', label: 'Entity Profiles', icon: <Users className="w-4 h-4" /> },
  ]

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
                <Zap className="w-5 h-5 text-[var(--burnt-orange)]" />
                <h1 className="font-semibold" style={{ fontSize: '1.125rem', color: 'var(--charcoal)' }}>LP Simulation Engine</h1>
              </div>
            </div>

            <nav className="flex items-center gap-1">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5
                    ${activeView === item.id
                      ? 'bg-[var(--burnt-orange)] text-white'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {activeView === 'list' && (
          <SimulationList
            onSelect={(id) => {
              setSelectedSimulationId(id)
              setActiveView('viewer')
            }}
            onNewSimulation={() => setActiveView('scenario')}
          />
        )}

        {activeView === 'scenario' && (
          <ScenarioBuilder
            onRunSimulation={(scenarioId) => {
              setSelectedScenarioId(scenarioId)
              setActiveView('runner')
            }}
          />
        )}

        {activeView === 'runner' && selectedScenarioId && organization?.id && (
          <SimulationRunner
            scenarioId={selectedScenarioId}
            organizationId={organization.id}
            onComplete={(simId) => {
              setSelectedSimulationId(simId)
              setActiveView('viewer')
            }}
            onCancel={() => setActiveView('list')}
          />
        )}

        {activeView === 'viewer' && selectedSimulationId && (
          <SimulationViewer
            simulationId={selectedSimulationId}
            onBack={() => setActiveView('list')}
          />
        )}

        {activeView === 'entities' && (
          <EntityProfileTester />
        )}

      </div>
    </div>
  )
}
