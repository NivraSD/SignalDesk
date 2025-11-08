'use client'

import React, { useState, useEffect } from 'react'
import { FileText, X as CloseIcon, Users, Shield, MessageSquare, AlertTriangle, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAppStore } from '@/stores/useAppStore'
import { fetchMemoryVaultContent } from '@/lib/memoryVaultAPI'

interface CrisisPlanViewerProps {
  onClose: () => void
  plan?: any
}

export default function CrisisPlanViewer({ onClose, plan: providedPlan }: CrisisPlanViewerProps) {
  const { organization } = useAppStore()
  const [plan, setPlan] = useState<any>(providedPlan)
  const [loading, setLoading] = useState(!providedPlan)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (!providedPlan && organization) {
      loadPlan()
    }
  }, [organization, providedPlan])

  const loadPlan = async () => {
    setLoading(true)
    try {
      // Get the most recent crisis plan for this organization
      const data = await fetchMemoryVaultContent({
        organization_id: organization?.id || '',
        content_type: 'crisis-plan',
        limit: 1
      })

      if (data.length > 0) {
        const parsedPlan = JSON.parse(data[0].content)
        console.log('📋 Crisis Plan loaded:', {
          hasPurpose: !!parsedPlan.purpose,
          hasGuidingPrinciples: !!parsedPlan.guidingPrinciples,
          guidingPrinciplesCount: parsedPlan.guidingPrinciples?.length || 0,
          hasScenarios: !!parsedPlan.scenarios,
          scenariosCount: parsedPlan.scenarios?.length || 0,
          keys: Object.keys(parsedPlan)
        })
        setPlan(parsedPlan)
      }
    } catch (err) {
      console.error('Load plan error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
          <div className="text-white">Loading crisis plan...</div>
        </div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 max-w-md">
          <div className="text-center">
            <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Crisis Plan Found</h3>
            <p className="text-gray-400 mb-6">Generate a crisis plan to get started</p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: FileText },
    { id: 'scenarios', name: 'Scenarios', icon: AlertTriangle },
    { id: 'team', name: 'Crisis Team', icon: Users },
    { id: 'stakeholders', name: 'Stakeholders', icon: Shield },
    { id: 'communications', name: 'Communications', icon: MessageSquare }
  ]

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'text-red-500 bg-red-500/10 border-red-500'
      case 'major': return 'text-orange-500 bg-orange-500/10 border-orange-500'
      case 'moderate': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500'
      case 'minor': return 'text-blue-500 bg-blue-500/10 border-blue-500'
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500'
    }
  }

  const getLikelihoodColor = (likelihood: string) => {
    switch (likelihood?.toLowerCase()) {
      case 'high': return 'text-red-400'
      case 'medium': return 'text-yellow-400'
      case 'low': return 'text-green-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Crisis Management Plan</h2>
                <p className="text-sm text-gray-400">
                  {plan.industry} • Generated {plan.generatedDate}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <CloseIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 py-3 border-b border-gray-800 flex gap-2 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.name}</span>
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {plan.purpose && (
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Purpose of Plan</h3>
                  <p className="text-gray-300 leading-relaxed">{plan.purpose}</p>
                </div>
              )}

              {plan.guidingPrinciples && plan.guidingPrinciples.length > 0 && (
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Guiding Principles</h3>
                  <ul className="space-y-3">
                    {plan.guidingPrinciples.map((principle: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-purple-400">{idx + 1}</span>
                        </div>
                        <span className="text-gray-300 leading-relaxed">{principle}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {plan.keyConcerns?.length > 0 && (
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Key Concerns</h3>
                  <div className="flex flex-wrap gap-2">
                    {plan.keyConcerns.map((concern: string, idx: number) => (
                      <span key={idx} className="px-3 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded-full text-sm">
                        {concern}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {plan.existingProtocols && (
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Existing Protocols</h3>
                  <p className="text-gray-300 whitespace-pre-wrap">{plan.existingProtocols}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'scenarios' && (
            <div className="space-y-4">
              {plan.scenarios?.map((scenario: any, idx: number) => (
                <div key={idx} className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-2">{scenario.title}</h3>
                      <p className="text-gray-300 mb-3">{scenario.description}</p>
                    </div>
                    {scenario.isUniversal && (
                      <span className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded text-xs">
                        Universal
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">Likelihood:</span>
                      <span className={`text-sm font-semibold ${getLikelihoodColor(scenario.likelihood)}`}>
                        {scenario.likelihood}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">Impact:</span>
                      <span className={`text-xs px-2 py-1 rounded border ${getSeverityColor(scenario.impact)}`}>
                        {scenario.impact}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'team' && (
            <div className="space-y-4">
              {plan.crisisTeam?.map((member: any, idx: number) => (
                <div key={idx} className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-white">{member.role}</h3>
                      <p className="text-sm text-gray-400">{member.title}</p>
                      {member.name && (
                        <p className="text-sm text-purple-400 mt-1">{member.name}</p>
                      )}
                      {member.contact && (
                        <p className="text-sm text-gray-500 mt-1">{member.contact}</p>
                      )}
                    </div>
                    {member.name ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    )}
                  </div>
                  {member.responsibilities?.length > 0 && (
                    <div className="mt-4">
                      <div className="text-sm font-semibold text-gray-400 mb-2">Responsibilities:</div>
                      <ul className="space-y-1">
                        {member.responsibilities.map((resp: string, ridx: number) => (
                          <li key={ridx} className="text-sm text-gray-300 flex items-start gap-2">
                            <span className="text-purple-400 mt-1">•</span>
                            <span>{resp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'stakeholders' && (
            <div className="space-y-4">
              {plan.stakeholders?.map((stakeholder: any, idx: number) => (
                <div key={idx} className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-white">{stakeholder.name}</h3>
                      <p className="text-sm text-gray-400">{stakeholder.description}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded border ${
                      stakeholder.impactLevel === 'High' ? 'text-red-400 bg-red-500/10 border-red-500' :
                      stakeholder.impactLevel === 'Medium' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500' :
                      'text-blue-400 bg-blue-500/10 border-blue-500'
                    }`}>
                      {stakeholder.impactLevel} Impact
                    </span>
                  </div>
                  {stakeholder.concerns?.length > 0 && (
                    <div className="mt-4">
                      <div className="text-sm font-semibold text-gray-400 mb-2">Primary Concerns:</div>
                      <div className="flex flex-wrap gap-2">
                        {stakeholder.concerns.map((concern: string, cidx: number) => (
                          <span key={cidx} className="px-2 py-1 bg-gray-900 text-gray-300 text-xs rounded">
                            {concern}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'communications' && (
            <div className="space-y-4">
              {plan.communicationPlans?.map((comm: any, idx: number) => (
                <div key={idx} className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">{comm.stakeholder}</h3>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Primary Channel</div>
                      <div className="text-sm text-white">{comm.primaryChannel}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Secondary Channel</div>
                      <div className="text-sm text-white">{comm.secondaryChannel}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Timing</div>
                      <div className="text-sm text-white">{comm.timing}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Spokesperson</div>
                      <div className="text-sm text-white">{comm.spokesperson}</div>
                    </div>
                  </div>

                  {comm.keyMessages?.length > 0 && (
                    <div>
                      <div className="text-sm font-semibold text-gray-400 mb-2">Key Messages:</div>
                      <ul className="space-y-2">
                        {comm.keyMessages.map((message: string, midx: number) => (
                          <li key={midx} className="text-sm text-gray-300 flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                            <span>{message}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
