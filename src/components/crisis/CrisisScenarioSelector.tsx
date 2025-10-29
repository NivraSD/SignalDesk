'use client'

import React, { useEffect, useState } from 'react'
import { X, Shield, AlertTriangle, DollarSign, Flame, Scale, Users, Activity, Target, Loader } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { supabase } from '@/lib/supabase/client'

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
      const { data: planData, error: planError } = await supabase
        .from('content_library')
        .select('*')
        .eq('organization_id', organization.name)
        .eq('content_type', 'crisis-plan')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (planError || !planData) {
        console.error('Failed to load crisis plan:', planError)
        setScenarios([])
      } else {
        const plan = JSON.parse(planData.content)
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Select Crisis Scenario</h2>
            <p className="text-sm text-gray-400 mt-1">
              {loading ? 'Loading scenarios from crisis plan...' : `${scenarios.length} scenarios from your crisis plan`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <Loader className="w-8 h-8 text-blue-400 animate-spin mb-4" />
            <p className="text-gray-400">Loading crisis scenarios from your plan...</p>
            <p className="text-sm text-gray-500 mt-2">Retrieving pre-configured crisis scenarios</p>
          </div>
        ) : scenarios.length === 0 ? (
          <div className="p-12 text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">No scenarios found in crisis plan.</p>
            <p className="text-sm text-gray-500">Generate a crisis plan first to create scenarios.</p>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-2 gap-4">
            {scenarios.map((scenario, index) => {
              const Icon = ICON_MAP[scenario.icon] || AlertTriangle
              const severityColor =
                scenario.severity === 'critical' ? 'text-red-400' :
                scenario.severity === 'high' ? 'text-orange-400' :
                'text-yellow-400'

              return (
                <button
                  key={index}
                  onClick={() => onScenarioSelected(scenario.category, scenario.title)}
                  className="text-left p-6 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-xl transition-all group"
                >
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 rounded-full bg-gray-900 border-2 border-gray-700 flex items-center justify-center ${severityColor}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
                        {scenario.title}
                      </h3>
                      <p className="text-sm text-gray-400 mb-3">{scenario.description}</p>
                      <span className={`text-xs font-semibold uppercase px-2 py-1 rounded ${
                        scenario.severity === 'critical' ? 'bg-red-500/10 text-red-400' :
                        scenario.severity === 'high' ? 'bg-orange-500/10 text-orange-400' :
                        'bg-yellow-500/10 text-yellow-400'
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
