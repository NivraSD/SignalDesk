'use client'

import React, { useState } from 'react'
import { X, Plus, Minus, Sparkles, Loader2, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAppStore } from '@/stores/useAppStore'

interface TeamMember {
  role: string
  title: string
  name: string
  contact: string
  responsibilities: string[]
}

interface EmergencyContact {
  name: string
  role: string
  phone: string
  email: string
}

interface PlanForm {
  industry: string
  companySize: string
  teamMembers: TeamMember[]
  keyConcerns: string[]
  existingProtocols: string
  additionalContext: string
  emergencyContacts: EmergencyContact[]
}

interface CrisisPlanGeneratorProps {
  onClose: () => void
  onPlanGenerated: (plan: any) => void
}

export default function CrisisPlanGenerator({ onClose, onPlanGenerated }: CrisisPlanGeneratorProps) {
  const { organization } = useAppStore()
  const [step, setStep] = useState(1)
  const [generating, setGenerating] = useState(false)
  const [planForm, setPlanForm] = useState<PlanForm>({
    industry: organization?.industry || '',
    companySize: 'medium',
    teamMembers: [
      {
        role: 'Crisis Response Leader',
        title: 'Chief Executive Officer or designated senior executive',
        name: '',
        contact: '',
        responsibilities: [
          'Overall crisis response authority and decision-making',
          'External stakeholder communications approval',
          'Resource allocation and strategic direction'
        ]
      },
      {
        role: 'Communications Director',
        title: 'Head of Communications/PR or senior communications executive',
        name: '',
        contact: '',
        responsibilities: [
          'Develop and implement communication strategies',
          'Media relations and press release coordination',
          'Message consistency across all channels'
        ]
      },
      {
        role: 'Operations Manager',
        title: 'Chief Operating Officer or senior operations executive',
        name: '',
        contact: '',
        responsibilities: [
          'Operational impact assessment and mitigation',
          'Business continuity plan activation',
          'Internal coordination and resource management'
        ]
      }
    ],
    keyConcerns: [],
    existingProtocols: '',
    additionalContext: '',
    emergencyContacts: []
  })

  const [newConcern, setNewConcern] = useState('')

  const addTeamMember = () => {
    setPlanForm(prev => ({
      ...prev,
      teamMembers: [...prev.teamMembers, {
        role: '',
        title: '',
        name: '',
        contact: '',
        responsibilities: []
      }]
    }))
  }

  const updateTeamMember = (index: number, field: keyof TeamMember, value: any) => {
    setPlanForm(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.map((member, i) =>
        i === index ? { ...member, [field]: value } : member
      )
    }))
  }

  const removeTeamMember = (index: number) => {
    setPlanForm(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.filter((_, i) => i !== index)
    }))
  }

  const addConcern = () => {
    if (newConcern.trim()) {
      setPlanForm(prev => ({
        ...prev,
        keyConcerns: [...prev.keyConcerns, newConcern.trim()]
      }))
      setNewConcern('')
    }
  }

  const removeConcern = (index: number) => {
    setPlanForm(prev => ({
      ...prev,
      keyConcerns: prev.keyConcerns.filter((_, i) => i !== index)
    }))
  }

  const addEmergencyContact = () => {
    setPlanForm(prev => ({
      ...prev,
      emergencyContacts: [...prev.emergencyContacts, {
        name: '',
        role: '',
        phone: '',
        email: ''
      }]
    }))
  }

  const updateEmergencyContact = (index: number, field: keyof EmergencyContact, value: string) => {
    setPlanForm(prev => ({
      ...prev,
      emergencyContacts: prev.emergencyContacts.map((contact, i) =>
        i === index ? { ...contact, [field]: value } : contact
      )
    }))
  }

  const removeEmergencyContact = (index: number) => {
    setPlanForm(prev => ({
      ...prev,
      emergencyContacts: prev.emergencyContacts.filter((_, i) => i !== index)
    }))
  }

  const generatePlan = async () => {
    if (!organization) {
      alert('Please select an organization first')
      return
    }

    setGenerating(true)
    try {
      console.log('🚀 Generating crisis plan with:', planForm)

      // Call mcp-crisis edge function
      const { data, error } = await supabase.functions.invoke('mcp-crisis', {
        body: {
          action: 'generate_plan',
          industry: planForm.industry,
          company_size: planForm.companySize,
          team_members: planForm.teamMembers.filter(m => m.name),
          key_concerns: planForm.keyConcerns,
          existing_protocols: planForm.existingProtocols,
          additional_context: planForm.additionalContext,
          emergency_contacts: planForm.emergencyContacts.filter(c => c.name),
          organization_id: organization.name
        }
      })

      if (error) {
        console.error('❌ Plan generation error:', error)
        alert(`Failed to generate plan: ${error.message}`)
        return
      }

      if (!data || !data.plan) {
        console.error('❌ No plan data returned:', data)
        alert('Failed to generate plan: No data returned')
        return
      }

      console.log('✅ Plan generated successfully:', data.plan)

      // Save to content_library
      const { error: saveError } = await supabase
        .from('content_library')
        .insert({
          organization_id: organization.name,
          content_type: 'crisis-plan',
          title: `Crisis Management Plan - ${planForm.industry}`,
          content: JSON.stringify(data.plan, null, 2),
          tags: ['crisis-plan', planForm.industry, 'comprehensive'],
          status: 'draft',
          metadata: {
            generated_at: new Date().toISOString(),
            industry: planForm.industry,
            company_size: planForm.companySize,
            team_members_count: planForm.teamMembers.filter(m => m.name).length,
            scenarios_count: data.plan.scenarios?.length || 0,
            source: 'crisis-plan-generator'
          }
        })

      if (saveError) {
        console.error('⚠️ Failed to save to content_library:', saveError)
      } else {
        console.log('✅ Plan saved to content_library')
      }

      onPlanGenerated(data.plan)
      onClose()
    } catch (err: any) {
      console.error('Plan generation error:', err)
      alert(`Failed to generate plan: ${err.message}`)
    } finally {
      setGenerating(false)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Industry</label>
                  <input
                    type="text"
                    value={planForm.industry}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, industry: e.target.value }))}
                    className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Technology, Healthcare, Finance"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Company Size</label>
                  <select
                    value={planForm.companySize}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, companySize: e.target.value }))}
                    className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="small">Small (1-50 employees)</option>
                    <option value="medium">Medium (51-500 employees)</option>
                    <option value="large">Large (501+ employees)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Key Concerns</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newConcern}
                      onChange={(e) => setNewConcern(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addConcern()}
                      className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g., Data security, Brand reputation"
                    />
                    <button
                      onClick={addConcern}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {planForm.keyConcerns.map((concern, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-gray-800 px-3 py-1 rounded-full">
                        <span className="text-sm text-gray-300">{concern}</span>
                        <button onClick={() => removeConcern(idx)} className="text-gray-500 hover:text-red-400">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Existing Protocols (Optional)</label>
                  <textarea
                    value={planForm.existingProtocols}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, existingProtocols: e.target.value }))}
                    className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 h-24"
                    placeholder="Describe any existing crisis management protocols..."
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Additional Context (Optional)</label>
                  <textarea
                    value={planForm.additionalContext}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, additionalContext: e.target.value }))}
                    className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 h-24"
                    placeholder="Any other relevant information..."
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Crisis Team</h3>
              <button
                onClick={addTeamMember}
                className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Member
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {planForm.teamMembers.map((member, idx) => (
                <div key={idx} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-sm font-semibold text-purple-400">{member.role || 'New Team Member'}</div>
                    <button
                      onClick={() => removeTeamMember(idx)}
                      className="text-gray-500 hover:text-red-400"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <input
                      type="text"
                      value={member.role}
                      onChange={(e) => updateTeamMember(idx, 'role', e.target.value)}
                      className="w-full bg-gray-900 text-white px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Role"
                    />
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) => updateTeamMember(idx, 'name', e.target.value)}
                      className="w-full bg-gray-900 text-white px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Name"
                    />
                    <input
                      type="text"
                      value={member.contact}
                      onChange={(e) => updateTeamMember(idx, 'contact', e.target.value)}
                      className="w-full bg-gray-900 text-white px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Contact (phone/email)"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Emergency Contacts</h3>
              <button
                onClick={addEmergencyContact}
                className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Contact
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {planForm.emergencyContacts.map((contact, idx) => (
                <div key={idx} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-sm font-semibold text-purple-400">{contact.name || 'New Contact'}</div>
                    <button
                      onClick={() => removeEmergencyContact(idx)}
                      className="text-gray-500 hover:text-red-400"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={contact.name}
                      onChange={(e) => updateEmergencyContact(idx, 'name', e.target.value)}
                      className="bg-gray-900 text-white px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Name"
                    />
                    <input
                      type="text"
                      value={contact.role}
                      onChange={(e) => updateEmergencyContact(idx, 'role', e.target.value)}
                      className="bg-gray-900 text-white px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Role"
                    />
                    <input
                      type="text"
                      value={contact.phone}
                      onChange={(e) => updateEmergencyContact(idx, 'phone', e.target.value)}
                      className="bg-gray-900 text-white px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Phone"
                    />
                    <input
                      type="email"
                      value={contact.email}
                      onChange={(e) => updateEmergencyContact(idx, 'email', e.target.value)}
                      className="bg-gray-900 text-white px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Email"
                    />
                  </div>
                </div>
              ))}

              {planForm.emergencyContacts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No emergency contacts added yet</p>
                  <p className="text-xs mt-1">Click "Add Contact" to get started</p>
                </div>
              )}
            </div>
          </div>
        )
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Generate Crisis Plan</h2>
                <p className="text-sm text-gray-400">Step {step} of 3</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-3 border-b border-gray-800">
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  s <= step ? 'bg-purple-500' : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderStep()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="px-4 py-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Back
          </button>

          <div className="flex gap-3">
            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors font-semibold"
              >
                Next
              </button>
            ) : (
              <button
                onClick={generatePlan}
                disabled={generating || !planForm.industry}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-semibold flex items-center gap-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Plan
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
