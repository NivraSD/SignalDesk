'use client'

import React, { useEffect, useState } from 'react'
import { X as CloseIcon, Shield, AlertTriangle, DollarSign, Flame, Scale, Users, Activity, Target, Loader } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { supabase } from '@/lib/supabase/client'
import { fetchMemoryVaultContent } from '@/lib/memoryVaultAPI'

interface CrisisScenarioSelectorProps {
  onClose: () => void
  onScenarioSelected: (type: string, title: string) => void
}

interface IntelligentScenario {
  category: string
  title: string
  description: string
  trigger_signals: string[]
  severity: 'critical' | 'high' | 'medium'
  icon: string
  immediate_actions: Array<{
    action: string
    owner: string
    timing: string
  }>
}

const ICON_MAP: Record<string, any> = {
  'shield': Shield,
  'alert-triangle': AlertTriangle,
  'dollar-sign': DollarSign,
  'flame': Flame,
  'scale': Scale,
  'users': Users,
  'activity': Activity,
  'target': Target
}

export default function CrisisScenarioSelector({ onClose, onScenarioSelected }: CrisisScenarioSelectorProps) {
  const { organization } = useAppStore()
  const [scenarios, setScenarios] = useState<IntelligentScenario[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (organization?.id) {
      loadIntelligentScenarios()
    }
  }, [organization?.id])

  const loadIntelligentScenarios = async () => {
    if (!organization) return

    setLoading(true)
    try {
      console.log('🚨 Loading crisis scenarios from plan for', organization.name)

      // Load scenarios from the crisis plan instead of generating dynamically
      const planData = await fetchMemoryVaultContent({
        organization_id: organization.id,
        content_type: 'crisis-plan',
        limit: 1
      })

      if (!planData || planData.length === 0) {
        console.error('Failed to load crisis plan')
        setScenarios([])
      } else {
        const plan = JSON.parse(planData[0].content)
        console.log('✅ Loaded crisis plan with scenarios:', plan.scenarios?.length || 0)

        // Convert crisis plan scenarios to selector format
        const convertedScenarios = (plan.scenarios || []).map((scenario: any) => ({
          category: scenario.type || 'general',
          title: scenario.title,
          description: scenario.description,
          trigger_signals: scenario.triggerSignals || [],
          severity: mapImpactToSeverity(scenario.impact),
          icon: getIconForScenario(scenario),
          immediate_actions: scenario.immediateActions || []
        }))

        setScenarios(convertedScenarios)
      }
    } catch (err) {
      console.error('Error loading scenarios:', err)
      setScenarios([])
    } finally {
      setLoading(false)
    }
  }

  // Helper function to map impact levels to severity
  const mapImpactToSeverity = (impact: string): 'critical' | 'high' | 'medium' => {
    if (!impact) return 'medium'
    const impactLower = impact.toLowerCase()
    if (impactLower === 'critical' || impactLower === 'major') return 'critical'
    if (impactLower === 'moderate') return 'high'
    return 'medium'
  }

  // Helper function to get appropriate icon for scenario
  const getIconForScenario = (scenario: any): string => {
    const title = scenario.title?.toLowerCase() || ''
    const type = scenario.type?.toLowerCase() || ''

    if (title.includes('security') || title.includes('breach') || title.includes('cyber')) return 'shield'
    if (title.includes('financial') || title.includes('revenue')) return 'dollar-sign'
    if (title.includes('reputation') || title.includes('pr') || title.includes('media')) return 'activity'
    if (title.includes('legal') || title.includes('compliance') || title.includes('regulatory')) return 'scale'
    if (title.includes('employee') || title.includes('workforce') || title.includes('hr')) return 'users'
    if (title.includes('product') || title.includes('service') || title.includes('operational')) return 'target'
    if (type.includes('fire') || title.includes('fire')) return 'flame'

    return 'alert-triangle'
  }
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-[var(--charcoal)] border border-zinc-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[var(--charcoal)] border-b border-zinc-800 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--burnt-orange)] rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>Select Crisis Scenario</h2>
              <p className="text-sm text-[var(--grey-400)] mt-1">
                {loading ? 'Loading scenarios from crisis plan...' : `${scenarios.length} scenarios from your crisis plan`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--grey-400)] hover:text-white transition-colors"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <Loader className="w-8 h-8 text-[var(--burnt-orange)] animate-spin mb-4" />
            <p className="text-[var(--grey-400)]">Loading crisis scenarios from your plan...</p>
            <p className="text-sm text-[var(--grey-500)] mt-2">Retrieving pre-configured crisis scenarios</p>
          </div>
        ) : scenarios.length === 0 ? (
          <div className="p-12 text-center">
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <p className="text-[var(--grey-400)] mb-2">No scenarios found in crisis plan.</p>
            <p className="text-sm text-[var(--grey-500)]">Generate a crisis plan first to create scenarios.</p>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-2 gap-4">
            {scenarios.map((scenario, index) => {
              const Icon = ICON_MAP[scenario.icon] || AlertTriangle
              const severityColor =
                scenario.severity === 'critical' ? 'text-red-400' :
                scenario.severity === 'high' ? 'text-[var(--burnt-orange)]' :
                'text-amber-400'

              return (
                <button
                  key={index}
                  onClick={() => onScenarioSelected(scenario.category, scenario.title)}
                  className="text-left p-6 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-[var(--burnt-orange)] rounded-xl transition-all group"
                >
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 rounded-full bg-[var(--charcoal)] border-2 border-zinc-700 flex items-center justify-center ${severityColor}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white mb-1 group-hover:text-[var(--burnt-orange)] transition-colors" style={{ fontFamily: 'var(--font-display)' }}>
                        {scenario.title}
                      </h3>
                      <p className="text-sm text-[var(--grey-400)] mb-3">{scenario.description}</p>
                      <span className={`text-xs font-semibold uppercase px-2 py-1 rounded ${
                        scenario.severity === 'critical' ? 'bg-red-500/10 text-red-400' :
                        scenario.severity === 'high' ? 'bg-[var(--burnt-orange)]/10 text-[var(--burnt-orange)]' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>
                        {scenario.severity}
                      </span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
