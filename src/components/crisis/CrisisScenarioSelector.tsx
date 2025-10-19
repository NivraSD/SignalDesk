'use client'

import React from 'react'
import { X, Shield, AlertTriangle, DollarSign, Flame, Scale, Users, Activity } from 'lucide-react'

interface CrisisScenarioSelectorProps {
  onClose: () => void
  onScenarioSelected: (type: string, title: string) => void
}

const CRISIS_SCENARIOS = [
  {
    type: 'data_breach',
    title: 'Data Breach / Cybersecurity Incident',
    description: 'Customer data exposed, system compromise, ransomware attack',
    icon: Shield,
    severity: 'critical',
    color: 'text-red-400'
  },
  {
    type: 'product_recall',
    title: 'Product Recall / Safety Issue',
    description: 'Defective product, safety hazard, quality control failure',
    icon: AlertTriangle,
    severity: 'high',
    color: 'text-orange-400'
  },
  {
    type: 'executive_scandal',
    title: 'Executive Scandal / Misconduct',
    description: 'Leadership misconduct, ethical violation, internal investigation',
    icon: Users,
    severity: 'high',
    color: 'text-yellow-400'
  },
  {
    type: 'financial_crisis',
    title: 'Financial Crisis / Bankruptcy',
    description: 'Cash flow issues, bankruptcy filing, major financial loss',
    icon: DollarSign,
    severity: 'critical',
    color: 'text-red-400'
  },
  {
    type: 'environmental_incident',
    title: 'Environmental Incident / Pollution',
    description: 'Chemical spill, environmental damage, regulatory violation',
    icon: Flame,
    severity: 'high',
    color: 'text-green-400'
  },
  {
    type: 'legal_issues',
    title: 'Legal Action / Lawsuit',
    description: 'Major lawsuit, regulatory investigation, compliance issue',
    icon: Scale,
    severity: 'medium',
    color: 'text-blue-400'
  },
  {
    type: 'social_media_crisis',
    title: 'Social Media Crisis / Boycott',
    description: 'Viral negative content, organized boycott, reputation attack',
    icon: Activity,
    severity: 'medium',
    color: 'text-purple-400'
  }
]

export default function CrisisScenarioSelector({ onClose, onScenarioSelected }: CrisisScenarioSelectorProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Select Crisis Scenario</h2>
            <p className="text-sm text-gray-400 mt-1">Choose a scenario to activate or practice</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          {CRISIS_SCENARIOS.map((scenario) => {
            const Icon = scenario.icon
            return (
              <button
                key={scenario.type}
                onClick={() => onScenarioSelected(scenario.type, scenario.title)}
                className="text-left p-6 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-xl transition-all group"
              >
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 rounded-full bg-gray-900 border-2 border-gray-700 flex items-center justify-center ${scenario.color}`}>
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
      </div>
    </div>
  )
}
