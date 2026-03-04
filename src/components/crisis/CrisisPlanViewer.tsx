'use client'

import React, { useState, useEffect } from 'react'
import { FileText, X as CloseIcon, Users, Shield, MessageSquare, AlertTriangle, CheckCircle, Package, Circle, ExternalLink, Pencil, Plus, Trash2, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAppStore } from '@/stores/useAppStore'
import { fetchMemoryVaultContent, saveToMemoryVault } from '@/lib/memoryVaultAPI'

interface CrisisPlanViewerProps {
  onClose: () => void
  plan?: any
  embedded?: boolean
}

interface DraftedComm {
  id: string
  scenario: string
  stakeholder: string
}

export default function CrisisPlanViewer({ onClose, plan: providedPlan, embedded = false }: CrisisPlanViewerProps) {
  const { organization } = useAppStore()
  const [plan, setPlan] = useState<any>(providedPlan)
  const [loading, setLoading] = useState(!providedPlan)
  const [activeTab, setActiveTab] = useState('overview')
  const [draftedComms, setDraftedComms] = useState<DraftedComm[]>([])

  // Edit state
  const [editingScenario, setEditingScenario] = useState<number | null>(null)
  const [editingTeamMember, setEditingTeamMember] = useState<number | null>(null)
  const [editingStakeholder, setEditingStakeholder] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    if (!providedPlan && organization) {
      loadPlan()
    }
  }, [organization, providedPlan])

  useEffect(() => {
    if (organization) {
      loadDraftedComms()
    }
  }, [organization])

  const loadDraftedComms = async () => {
    if (!organization?.id) return
    try {
      // Simple query - get content from Crisis folder
      const { data, error } = await supabase
        .from('content_library')
        .select('id, folder, metadata')
        .eq('organization_id', organization.id)
        .like('folder', 'Crisis/%')

      if (error) {
        console.error('Query error:', error)
      }

      if (data) {
        setDraftedComms(data.map(d => ({
          id: d.id,
          scenario: d.metadata?.scenario || d.folder?.split('/')[1] || '',
          stakeholder: d.metadata?.stakeholder || ''
        })))
      }
    } catch (err) {
      console.error('Failed to load drafted comms:', err)
    }
  }

  const getCommsForScenario = (scenarioTitle: string) => {
    return draftedComms.filter(c => c.scenario === scenarioTitle)
  }

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

  // Save plan to Memory Vault
  const savePlan = async () => {
    if (!organization?.id || !plan) return
    setSaving(true)
    try {
      await saveToMemoryVault({
        organization_id: organization.id,
        content_type: 'crisis-plan',
        title: `Crisis Management Plan - ${plan.industry || 'Updated'}`,
        content: JSON.stringify(plan),
        metadata: {
          industry: plan.industry,
          generatedDate: plan.generatedDate,
          lastModified: new Date().toISOString()
        }
      })
      setHasChanges(false)
    } catch (err) {
      console.error('Save plan error:', err)
    } finally {
      setSaving(false)
    }
  }

  // Update scenario
  const updateScenario = (idx: number, field: string, value: any) => {
    const newScenarios = [...(plan.scenarios || [])]
    newScenarios[idx] = { ...newScenarios[idx], [field]: value }
    setPlan({ ...plan, scenarios: newScenarios })
    setHasChanges(true)
  }

  // Delete scenario
  const deleteScenario = (idx: number) => {
    const newScenarios = plan.scenarios?.filter((_: any, i: number) => i !== idx) || []
    setPlan({ ...plan, scenarios: newScenarios })
    setHasChanges(true)
    setEditingScenario(null)
  }

  // Add new scenario
  const addScenario = () => {
    const newScenario = {
      title: 'New Scenario',
      description: '',
      likelihood: 'Medium',
      impact: 'Moderate',
      isUniversal: false
    }
    setPlan({ ...plan, scenarios: [...(plan.scenarios || []), newScenario] })
    setHasChanges(true)
    setEditingScenario((plan.scenarios?.length || 0))
  }

  // Update team member
  const updateTeamMember = (idx: number, field: string, value: any) => {
    const newTeam = [...(plan.crisisTeam || [])]
    newTeam[idx] = { ...newTeam[idx], [field]: value }
    setPlan({ ...plan, crisisTeam: newTeam })
    setHasChanges(true)
  }

  // Delete team member
  const deleteTeamMember = (idx: number) => {
    const newTeam = plan.crisisTeam?.filter((_: any, i: number) => i !== idx) || []
    setPlan({ ...plan, crisisTeam: newTeam })
    setHasChanges(true)
    setEditingTeamMember(null)
  }

  // Add new team member
  const addTeamMember = () => {
    const newMember = {
      role: 'New Role',
      title: '',
      name: '',
      contact: '',
      responsibilities: []
    }
    setPlan({ ...plan, crisisTeam: [...(plan.crisisTeam || []), newMember] })
    setHasChanges(true)
    setEditingTeamMember((plan.crisisTeam?.length || 0))
  }

  // Update stakeholder
  const updateStakeholder = (idx: number, field: string, value: any) => {
    const newStakeholders = [...(plan.stakeholders || [])]
    newStakeholders[idx] = { ...newStakeholders[idx], [field]: value }
    setPlan({ ...plan, stakeholders: newStakeholders })
    setHasChanges(true)
  }

  // Delete stakeholder
  const deleteStakeholder = (idx: number) => {
    const newStakeholders = plan.stakeholders?.filter((_: any, i: number) => i !== idx) || []
    setPlan({ ...plan, stakeholders: newStakeholders })
    setHasChanges(true)
    setEditingStakeholder(null)
  }

  // Add new stakeholder
  const addStakeholder = () => {
    const newStakeholder = {
      name: 'New Stakeholder',
      description: '',
      impactLevel: 'Medium',
      concerns: []
    }
    setPlan({ ...plan, stakeholders: [...(plan.stakeholders || []), newStakeholder] })
    setHasChanges(true)
    setEditingStakeholder((plan.stakeholders?.length || 0))
  }

  if (loading) {
    return embedded ? (
      <div className="h-full flex items-center justify-center">
        <div className="text-white">Loading crisis plan...</div>
      </div>
    ) : (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-[var(--charcoal)] border border-zinc-800 rounded-xl p-8">
          <div className="text-white">Loading crisis plan...</div>
        </div>
      </div>
    )
  }

  if (!plan) {
    const noPlanContent = (
      <div className="text-center">
        <FileText className="w-16 h-16 text-[var(--grey-500)] mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>No Crisis Plan Found</h3>
        <p className="text-[var(--grey-400)] mb-6">Generate a crisis plan to get started</p>
        {!embedded && (
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[var(--burnt-orange)] hover:brightness-110 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        )}
      </div>
    )

    return embedded ? (
      <div className="h-full flex items-center justify-center">
        {noPlanContent}
      </div>
    ) : (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
        <div className="bg-[var(--charcoal)] border border-zinc-800 rounded-xl p-8 max-w-md">
          {noPlanContent}
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: FileText },
    { id: 'scenarios', name: 'Scenarios', icon: AlertTriangle },
    { id: 'team', name: 'Crisis Team', icon: Users },
    { id: 'stakeholders', name: 'Stakeholders', icon: Shield },
    { id: 'inventory', name: 'Inventory', icon: Package }
  ]

  // Helper to find communication plan for a stakeholder
  const getCommPlanForStakeholder = (stakeholderName: string) => {
    return plan.communicationPlans?.find((c: any) =>
      c.stakeholder?.toLowerCase() === stakeholderName?.toLowerCase()
    )
  }

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'text-red-500 bg-red-500/10 border-red-500'
      case 'major': return 'text-[var(--burnt-orange)] bg-[var(--burnt-orange)]/10 border-[var(--burnt-orange)]'
      case 'moderate': return 'text-amber-500 bg-amber-500/10 border-amber-500'
      case 'minor': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500'
      default: return 'text-[var(--grey-500)] bg-[var(--grey-500)]/10 border-[var(--grey-500)]'
    }
  }

  const getLikelihoodColor = (likelihood: string) => {
    switch (likelihood?.toLowerCase()) {
      case 'high': return 'text-red-400'
      case 'medium': return 'text-amber-400'
      case 'low': return 'text-emerald-400'
      default: return 'text-[var(--grey-400)]'
    }
  }

  // Shared content for tabs and main content area
  const planContent = (
    <>
      {/* Tabs */}
      <div className="px-6 py-3 border-b border-zinc-800 flex gap-2 overflow-x-auto shrink-0">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[var(--burnt-orange)] text-white'
                  : 'bg-zinc-800 text-[var(--grey-400)] hover:text-white hover:bg-zinc-700'
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
              <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>Purpose of Plan</h3>
                <p className="text-[var(--grey-300)] leading-relaxed">{plan.purpose}</p>
              </div>
            )}

            {plan.guidingPrinciples && plan.guidingPrinciples.length > 0 && (
              <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>Guiding Principles</h3>
                <ul className="space-y-3">
                  {plan.guidingPrinciples.map((principle: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-[var(--burnt-orange)]/10 border border-[var(--burnt-orange)]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-[var(--burnt-orange)]">{idx + 1}</span>
                      </div>
                      <span className="text-[var(--grey-300)] leading-relaxed">{principle}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {plan.keyConcerns?.length > 0 && (
              <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>Key Concerns</h3>
                <div className="flex flex-wrap gap-2">
                  {plan.keyConcerns.map((concern: string, idx: number) => (
                    <span key={idx} className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-sm">
                      {concern}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {plan.existingProtocols && (
              <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>Existing Protocols</h3>
                <p className="text-[var(--grey-300)] whitespace-pre-wrap">{plan.existingProtocols}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'scenarios' && (
          <div className="space-y-4">
            {plan.scenarios?.map((scenario: any, idx: number) => (
              <div key={idx} className="bg-zinc-800 border border-zinc-700 rounded-xl p-6">
                {editingScenario === idx ? (
                  // Edit mode
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-[var(--grey-500)] mb-1 block">Title</label>
                      <input
                        type="text"
                        value={scenario.title}
                        onChange={(e) => updateScenario(idx, 'title', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[var(--grey-500)] mb-1 block">Description</label>
                      <textarea
                        value={scenario.description}
                        onChange={(e) => updateScenario(idx, 'description', e.target.value)}
                        rows={3}
                        className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-white resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-[var(--grey-500)] mb-1 block">Likelihood</label>
                        <select
                          value={scenario.likelihood}
                          onChange={(e) => updateScenario(idx, 'likelihood', e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-white"
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-[var(--grey-500)] mb-1 block">Impact</label>
                        <select
                          value={scenario.impact}
                          onChange={(e) => updateScenario(idx, 'impact', e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-white"
                        >
                          <option value="Minor">Minor</option>
                          <option value="Moderate">Moderate</option>
                          <option value="Major">Major</option>
                          <option value="Critical">Critical</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={scenario.isUniversal || false}
                        onChange={(e) => updateScenario(idx, 'isUniversal', e.target.checked)}
                        className="w-4 h-4"
                      />
                      <label className="text-sm text-[var(--grey-400)]">Universal scenario (applies to any crisis)</label>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => setEditingScenario(null)}
                        className="px-4 py-2 bg-[var(--burnt-orange)] hover:brightness-110 text-white rounded-lg text-sm"
                      >
                        Done
                      </button>
                      <button
                        onClick={() => deleteScenario(idx)}
                        className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>{scenario.title}</h3>
                        <p className="text-[var(--grey-300)] mb-3">{scenario.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {scenario.isUniversal && (
                          <span className="px-2 py-1 bg-[var(--burnt-orange)]/10 text-[var(--burnt-orange)] border border-[var(--burnt-orange)]/30 rounded text-xs">
                            Universal
                          </span>
                        )}
                        <button
                          onClick={() => setEditingScenario(idx)}
                          className="p-2 text-[var(--grey-400)] hover:text-white hover:bg-zinc-700 rounded-lg transition-colors"
                          title="Edit scenario"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[var(--grey-400)]">Likelihood:</span>
                        <span className={`text-sm font-semibold ${getLikelihoodColor(scenario.likelihood)}`}>
                          {scenario.likelihood}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[var(--grey-400)]">Impact:</span>
                        <span className={`text-xs px-2 py-1 rounded border ${getSeverityColor(scenario.impact)}`}>
                          {scenario.impact}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
            {/* Add new scenario button */}
            <button
              onClick={addScenario}
              className="w-full py-4 border-2 border-dashed border-zinc-700 hover:border-[var(--burnt-orange)] rounded-xl text-[var(--grey-400)] hover:text-[var(--burnt-orange)] transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" /> Add Scenario
            </button>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="space-y-4">
            {plan.crisisTeam?.map((member: any, idx: number) => (
              <div key={idx} className="bg-zinc-800 border border-zinc-700 rounded-xl p-6">
                {editingTeamMember === idx ? (
                  // Edit mode
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-[var(--grey-500)] mb-1 block">Role</label>
                        <input
                          type="text"
                          value={member.role}
                          onChange={(e) => updateTeamMember(idx, 'role', e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[var(--grey-500)] mb-1 block">Title</label>
                        <input
                          type="text"
                          value={member.title || ''}
                          onChange={(e) => updateTeamMember(idx, 'title', e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-[var(--grey-500)] mb-1 block">Name (assigned person)</label>
                        <input
                          type="text"
                          value={member.name || ''}
                          onChange={(e) => updateTeamMember(idx, 'name', e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-white"
                          placeholder="Enter name when assigned"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[var(--grey-500)] mb-1 block">Contact</label>
                        <input
                          type="text"
                          value={member.contact || ''}
                          onChange={(e) => updateTeamMember(idx, 'contact', e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-white"
                          placeholder="Email or phone"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-[var(--grey-500)] mb-1 block">Responsibilities (one per line)</label>
                      <textarea
                        value={(member.responsibilities || []).join('\n')}
                        onChange={(e) => updateTeamMember(idx, 'responsibilities', e.target.value.split('\n').filter(r => r.trim()))}
                        rows={4}
                        className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-white resize-none"
                        placeholder="Enter each responsibility on a new line"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => setEditingTeamMember(null)}
                        className="px-4 py-2 bg-[var(--burnt-orange)] hover:brightness-110 text-white rounded-lg text-sm"
                      >
                        Done
                      </button>
                      <button
                        onClick={() => deleteTeamMember(idx)}
                        className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>{member.role}</h3>
                        <p className="text-sm text-[var(--grey-400)]">{member.title}</p>
                        {member.name && (
                          <p className="text-sm text-[var(--burnt-orange)] mt-1">{member.name}</p>
                        )}
                        {member.contact && (
                          <p className="text-sm text-[var(--grey-500)] mt-1">{member.contact}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {member.name ? (
                          <CheckCircle className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-amber-400" />
                        )}
                        <button
                          onClick={() => setEditingTeamMember(idx)}
                          className="p-2 text-[var(--grey-400)] hover:text-white hover:bg-zinc-700 rounded-lg transition-colors"
                          title="Edit team member"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {member.responsibilities?.length > 0 && (
                      <div className="mt-4">
                        <div className="text-sm font-semibold text-[var(--grey-400)] mb-2">Responsibilities:</div>
                        <ul className="space-y-1">
                          {member.responsibilities.map((resp: string, ridx: number) => (
                            <li key={ridx} className="text-sm text-[var(--grey-300)] flex items-start gap-2">
                              <span className="text-[var(--burnt-orange)] mt-1">•</span>
                              <span>{resp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
            {/* Add new team member button */}
            <button
              onClick={addTeamMember}
              className="w-full py-4 border-2 border-dashed border-zinc-700 hover:border-[var(--burnt-orange)] rounded-xl text-[var(--grey-400)] hover:text-[var(--burnt-orange)] transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" /> Add Team Member
            </button>
          </div>
        )}

        {activeTab === 'stakeholders' && (
          <div className="space-y-4">
            {plan.stakeholders?.map((stakeholder: any, idx: number) => {
              const commPlan = getCommPlanForStakeholder(stakeholder.name)
              return (
                <div key={idx} className="bg-zinc-800 border border-zinc-700 rounded-xl p-6">
                  {editingStakeholder === idx ? (
                    // Edit mode
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-[var(--grey-500)] mb-1 block">Stakeholder Name</label>
                        <input
                          type="text"
                          value={stakeholder.name}
                          onChange={(e) => updateStakeholder(idx, 'name', e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[var(--grey-500)] mb-1 block">Description</label>
                        <textarea
                          value={stakeholder.description || ''}
                          onChange={(e) => updateStakeholder(idx, 'description', e.target.value)}
                          rows={2}
                          className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-white resize-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[var(--grey-500)] mb-1 block">Impact Level</label>
                        <select
                          value={stakeholder.impactLevel}
                          onChange={(e) => updateStakeholder(idx, 'impactLevel', e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-white"
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-[var(--grey-500)] mb-1 block">Primary Concerns (one per line)</label>
                        <textarea
                          value={(stakeholder.concerns || []).join('\n')}
                          onChange={(e) => updateStakeholder(idx, 'concerns', e.target.value.split('\n').filter(c => c.trim()))}
                          rows={3}
                          className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-3 py-2 text-white resize-none"
                          placeholder="Enter each concern on a new line"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          onClick={() => setEditingStakeholder(null)}
                          className="px-4 py-2 bg-[var(--burnt-orange)] hover:brightness-110 text-white rounded-lg text-sm"
                        >
                          Done
                        </button>
                        <button
                          onClick={() => deleteStakeholder(idx)}
                          className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>{stakeholder.name}</h3>
                          <p className="text-sm text-[var(--grey-400)]">{stakeholder.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded border ${
                            stakeholder.impactLevel === 'High' ? 'text-red-400 bg-red-500/10 border-red-500' :
                            stakeholder.impactLevel === 'Medium' ? 'text-amber-400 bg-amber-500/10 border-amber-500' :
                            'text-[var(--burnt-orange)] bg-[var(--burnt-orange)]/10 border-[var(--burnt-orange)]'
                          }`}>
                            {stakeholder.impactLevel} Impact
                          </span>
                          <button
                            onClick={() => setEditingStakeholder(idx)}
                            className="p-2 text-[var(--grey-400)] hover:text-white hover:bg-zinc-700 rounded-lg transition-colors"
                            title="Edit stakeholder"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Concerns */}
                      {stakeholder.concerns?.length > 0 && (
                        <div className="mt-4">
                          <div className="text-sm font-semibold text-[var(--grey-400)] mb-2">Primary Concerns:</div>
                          <div className="flex flex-wrap gap-2">
                            {stakeholder.concerns.map((concern: string, cidx: number) => (
                              <span key={cidx} className="px-2 py-1 bg-zinc-900 text-[var(--grey-300)] text-xs rounded">
                                {concern}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Communication Approach */}
                      {commPlan && (
                        <div className="mt-4 pt-4 border-t border-zinc-700">
                          <div className="text-sm font-semibold text-[var(--burnt-orange)] mb-3">Communication Approach</div>
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <div className="text-xs text-[var(--grey-500)]">Primary Channel</div>
                              <div className="text-sm text-white">{commPlan.primaryChannel}</div>
                            </div>
                            <div>
                              <div className="text-xs text-[var(--grey-500)]">Timing</div>
                              <div className="text-sm text-white">{commPlan.timing}</div>
                            </div>
                            <div>
                              <div className="text-xs text-[var(--grey-500)]">Spokesperson</div>
                              <div className="text-sm text-white">{commPlan.spokesperson}</div>
                            </div>
                            {commPlan.secondaryChannel && (
                              <div>
                                <div className="text-xs text-[var(--grey-500)]">Secondary Channel</div>
                                <div className="text-sm text-white">{commPlan.secondaryChannel}</div>
                              </div>
                            )}
                          </div>
                          {commPlan.keyMessages?.length > 0 && (
                            <div>
                              <div className="text-xs text-[var(--grey-500)] mb-2">Key Messages:</div>
                              <ul className="space-y-1">
                                {commPlan.keyMessages.slice(0, 3).map((message: string, midx: number) => (
                                  <li key={midx} className="text-xs text-[var(--grey-300)] flex items-start gap-2">
                                    <span className="text-[var(--burnt-orange)]">•</span>
                                    <span>{message}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
            {/* Add new stakeholder button */}
            <button
              onClick={addStakeholder}
              className="w-full py-4 border-2 border-dashed border-zinc-700 hover:border-[var(--burnt-orange)] rounded-xl text-[var(--grey-400)] hover:text-[var(--burnt-orange)] transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" /> Add Stakeholder
            </button>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-6">
            {/* Info banner */}
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-[var(--burnt-orange)] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-[var(--grey-300)]">
                  Draft communications are generated and managed in the <span className="text-[var(--burnt-orange)] font-medium">Communications tab</span> of the Crisis Command Center.
                </p>
                <p className="text-xs text-[var(--grey-500)] mt-1">
                  Materials are stored in Memory Vault under Crisis/[Scenario Name]
                </p>
              </div>
            </div>

            {/* Scenarios with draft status */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>Scenario Draft Status</h3>
              {plan.scenarios?.map((scenario: any, idx: number) => {
                const scenarioComms = getCommsForScenario(scenario.title)
                const stakeholderCount = plan.stakeholders?.length || 6
                const hasAllComms = scenarioComms.length >= stakeholderCount

                return (
                  <div key={idx} className="bg-zinc-800 border border-zinc-700 rounded-xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="text-white font-semibold">{scenario.title}</h4>
                        <p className="text-sm text-[var(--grey-400)] mt-1">{scenario.description}</p>
                      </div>
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                        hasAllComms
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : scenarioComms.length > 0
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-zinc-700 text-[var(--grey-400)] border border-zinc-600'
                      }`}>
                        {hasAllComms ? (
                          <><CheckCircle className="w-3.5 h-3.5" /> Complete</>
                        ) : scenarioComms.length > 0 ? (
                          <><Circle className="w-3.5 h-3.5" /> Partial ({scenarioComms.length}/{stakeholderCount})</>
                        ) : (
                          <><Circle className="w-3.5 h-3.5" /> Not Generated</>
                        )}
                      </div>
                    </div>

                    {/* Stakeholder breakdown */}
                    {scenarioComms.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-zinc-700">
                        <div className="text-xs text-[var(--grey-500)] mb-2">Drafted for:</div>
                        <div className="flex flex-wrap gap-2">
                          {scenarioComms.map((comm, cidx) => (
                            <span key={cidx} className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded border border-emerald-500/20">
                              {comm.stakeholder}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </>
  )

  // Embedded mode - renders inline without modal wrapper
  if (embedded) {
    return (
      <div className="h-full flex flex-col">
        {planContent}
      </div>
    )
  }

  // Modal mode - renders as overlay
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-[var(--charcoal)] border border-zinc-800 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--burnt-orange)] rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>Crisis Management Plan</h2>
                <p className="text-sm text-[var(--grey-400)]">
                  {plan.industry} • Generated {plan.generatedDate}
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
        </div>

        {planContent}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 flex justify-between items-center shrink-0">
          <div>
            {hasChanges && (
              <span className="text-sm text-amber-400">Unsaved changes</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {hasChanges && (
              <button
                onClick={savePlan}
                disabled={saving}
                className="px-6 py-2 bg-[var(--burnt-orange)] hover:brightness-110 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
