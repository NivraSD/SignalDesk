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
      console.log('🚨 Loading intelligent crisis scenarios for', organization.name)

      const { data, error } = await supabase.functions.invoke('mcp-crisis-scenario-generator', {
        body: {
          organization_id: organization.id,
          organization_name: organization.name
        }
      })

      if (error) {
        console.error('Failed to load scenarios:', error)
        // Fall back to empty array
        setScenarios([])
      } else {
        console.log('✅ Loaded scenarios:', data.scenarios?.length || 0)
        setScenarios(data.scenarios || [])
      }
    } catch (err) {
      console.error('Error loading scenarios:', err)
      setScenarios([])
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Select Crisis Scenario</h2>
            <p className="text-sm text-gray-400 mt-1">
              {loading ? 'Analyzing intelligence data...' : `${scenarios.length} scenarios based on your organization's intelligence`}
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
            <p className="text-gray-400">Generating intelligent crisis scenarios...</p>
            <p className="text-sm text-gray-500 mt-2">Analyzing competitors, stakeholders, and strategic topics</p>
          </div>
        ) : scenarios.length === 0 ? (
          <div className="p-12 text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <p className="text-gray-400">No scenarios could be generated. Try running intelligence first.</p>
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
