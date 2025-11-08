'use client'

import { useState } from 'react'
import { ChevronRight, ChevronLeft, Check, Trophy, X as CloseIcon, Users, Tag, Calendar } from 'lucide-react'
import type { ProposalMetadata, ProposalType, ProposalOutcome, DealValueRange } from '@/types/content'

interface ProposalMetadataWizardProps {
  initialMetadata: Partial<ProposalMetadata>
  onComplete: (metadata: ProposalMetadata) => void
  onCancel: () => void
}

const INDUSTRIES = [
  'Financial Services',
  'Healthcare',
  'Technology',
  'Energy',
  'Manufacturing',
  'Retail',
  'Telecommunications',
  'Government',
  'Education',
  'Other'
]

const PROPOSAL_TYPES: Array<{ value: ProposalType; label: string; description: string }> = [
  { value: 'new_business', label: 'New Business', description: 'First-time client opportunity' },
  { value: 'renewal', label: 'Renewal', description: 'Existing client contract renewal' },
  { value: 'rfp_response', label: 'RFP Response', description: 'Formal RFP or RFI response' },
  { value: 'unsolicited_pitch', label: 'Unsolicited Pitch', description: 'Proactive business development' },
  { value: 'partnership', label: 'Partnership', description: 'Strategic partnership proposal' },
  { value: 'other', label: 'Other', description: 'Other proposal type' }
]

const DEAL_VALUE_RANGES: Array<{ value: DealValueRange; label: string }> = [
  { value: 'under_50k', label: 'Under $50K' },
  { value: '50k_100k', label: '$50K - $100K' },
  { value: '100k_250k', label: '$100K - $250K' },
  { value: '250k_500k', label: '$250K - $500K' },
  { value: '500k_1m', label: '$500K - $1M' },
  { value: '1m_5m', label: '$1M - $5M' },
  { value: '5m_plus', label: '$5M+' },
  { value: 'unknown', label: 'Unknown' }
]

const OUTCOMES: Array<{ value: ProposalOutcome; label: string; icon: string; description: string }> = [
  { value: 'won', label: 'Won', icon: '🎉', description: 'We secured the business' },
  { value: 'lost', label: 'Lost', icon: '📉', description: 'They chose a competitor' },
  { value: 'pending', label: 'Pending', icon: '⏳', description: 'Still waiting for decision' },
  { value: 'no_decision', label: 'No Decision', icon: '🚫', description: 'They didn't move forward' },
  { value: 'unknown', label: 'Unknown', icon: '❓', description: 'Outcome not tracked' }
]

export default function ProposalMetadataWizard({
  initialMetadata,
  onComplete,
  onCancel
}: ProposalMetadataWizardProps) {
  const [step, setStep] = useState(1)
  const [metadata, setMetadata] = useState<Partial<ProposalMetadata>>({
    ...initialMetadata,
    servicesOffered: initialMetadata.servicesOffered || [],
    keyDifferentiators: initialMetadata.keyDifferentiators || []
  })

  const [serviceInput, setServiceInput] = useState('')
  const [differentiatorInput, setDifferentiatorInput] = useState('')
  const [competitorInput, setCompetitorInput] = useState('')

  const totalSteps = 3

  const updateMetadata = (updates: Partial<ProposalMetadata>) => {
    setMetadata(prev => ({ ...prev, ...updates }))
  }

  const addService = () => {
    if (serviceInput.trim() && !metadata.servicesOffered?.includes(serviceInput.trim())) {
      updateMetadata({
        servicesOffered: [...(metadata.servicesOffered || []), serviceInput.trim()]
      })
      setServiceInput('')
    }
  }

  const removeService = (service: string) => {
    updateMetadata({
      servicesOffered: metadata.servicesOffered?.filter(s => s !== service)
    })
  }

  const addDifferentiator = () => {
    if (differentiatorInput.trim() && !metadata.keyDifferentiators?.includes(differentiatorInput.trim())) {
      updateMetadata({
        keyDifferentiators: [...(metadata.keyDifferentiators || []), differentiatorInput.trim()]
      })
      setDifferentiatorInput('')
    }
  }

  const removeDifferentiator = (diff: string) => {
    updateMetadata({
      keyDifferentiators: metadata.keyDifferentiators?.filter(d => d !== diff)
    })
  }

  const addCompetitor = () => {
    if (competitorInput.trim()) {
      const competitors = metadata.competitiveLandscape?.competitors || []
      if (!competitors.includes(competitorInput.trim())) {
        updateMetadata({
          competitiveLandscape: {
            ...metadata.competitiveLandscape,
            competitors: [...competitors, competitorInput.trim()]
          }
        })
        setCompetitorInput('')
      }
    }
  }

  const removeCompetitor = (competitor: string) => {
    updateMetadata({
      competitiveLandscape: {
        ...metadata.competitiveLandscape,
        competitors: metadata.competitiveLandscape?.competitors?.filter(c => c !== competitor)
      }
    })
  }

  const canProceed = () => {
    if (step === 1) {
      return metadata.industry && metadata.proposalType && (metadata.servicesOffered?.length || 0) > 0
    }
    if (step === 2) {
      return metadata.outcome
    }
    return true
  }

  const handleComplete = () => {
    if (!metadata.industry || !metadata.proposalType || !metadata.servicesOffered?.length) {
      return
    }

    onComplete(metadata as ProposalMetadata)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {step} of {totalSteps}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((step / totalSteps) * 100)}% Complete
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Basic Information */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Basic Information</h2>
              <p className="text-gray-600">Tell us about this proposal</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Name (Optional)
              </label>
              <input
                type="text"
                value={metadata.clientName || ''}
                onChange={(e) => updateMetadata({ clientName: e.target.value })}
                placeholder="e.g., Wells Fargo"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industry *
              </label>
              <select
                value={metadata.industry || ''}
                onChange={(e) => updateMetadata({ industry: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select industry...</option>
                {INDUSTRIES.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sector (Optional)
              </label>
              <input
                type="text"
                value={metadata.sector || ''}
                onChange={(e) => updateMetadata({ sector: e.target.value })}
                placeholder="e.g., Commercial Banking, Investment Banking"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proposal Type *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {PROPOSAL_TYPES.map(type => (
                  <button
                    key={type.value}
                    onClick={() => updateMetadata({ proposalType: type.value })}
                    className={`
                      p-3 border-2 rounded-lg text-left transition-all
                      ${metadata.proposalType === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="font-medium text-sm">{type.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{type.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Services Offered *
              </label>
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  value={serviceInput}
                  onChange={(e) => setServiceInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addService())}
                  placeholder="e.g., Threat Intelligence"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={addService}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {metadata.servicesOffered?.map(service => (
                  <span
                    key={service}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {service}
                    <button
                      onClick={() => removeService(service)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <CloseIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deal Value Range (Optional)
              </label>
              <select
                value={metadata.dealValueRange || ''}
                onChange={(e) => updateMetadata({ dealValueRange: e.target.value as DealValueRange })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select range...</option>
                {DEAL_VALUE_RANGES.map(range => (
                  <option key={range.value} value={range.value}>{range.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Step 2: Outcome & Learnings */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Outcome & Learnings</h2>
              <p className="text-gray-600">Help us learn from this proposal</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                What was the outcome? *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {OUTCOMES.map(outcome => (
                  <button
                    key={outcome.value}
                    onClick={() => updateMetadata({ outcome: outcome.value })}
                    className={`
                      p-4 border-2 rounded-lg text-left transition-all
                      ${metadata.outcome === outcome.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xl">{outcome.icon}</span>
                      <span className="font-medium">{outcome.label}</span>
                    </div>
                    <div className="text-xs text-gray-500">{outcome.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {(metadata.outcome === 'won' || metadata.outcome === 'lost') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Why did we {metadata.outcome === 'won' ? 'win' : 'lose'}?
                  <span className="text-gray-500 font-normal ml-1">(Optional but valuable)</span>
                </label>
                <textarea
                  value={metadata.outcomeNotes || ''}
                  onChange={(e) => updateMetadata({ outcomeNotes: e.target.value })}
                  placeholder="This helps NIV learn what works and recommend better approaches..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Who were we competing against? (Optional)
              </label>
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  value={competitorInput}
                  onChange={(e) => setCompetitorInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCompetitor())}
                  placeholder="e.g., Competitor name"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={addCompetitor}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {metadata.competitiveLandscape?.competitors?.map(competitor => (
                  <span
                    key={competitor}
                    className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                  >
                    {competitor}
                    <button
                      onClick={() => removeCompetitor(competitor)}
                      className="ml-2 text-red-600 hover:text-red-800"
                    >
                      <CloseIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {metadata.outcome && metadata.outcome !== 'unknown' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Outcome Date (Optional)
                </label>
                <input
                  type="date"
                  value={metadata.outcomeDate ? new Date(metadata.outcomeDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => updateMetadata({ outcomeDate: e.target.value ? new Date(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
          </div>
        )}

        {/* Step 3: Differentiators */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Key Differentiators</h2>
              <p className="text-gray-600">What made this proposal unique?</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Key Differentiators (Optional but valuable)
              </label>
              <p className="text-sm text-gray-500 mb-3">
                Unique value props, methodologies, or capabilities highlighted in this proposal
              </p>
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  value={differentiatorInput}
                  onChange={(e) => setDifferentiatorInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDifferentiator())}
                  placeholder="e.g., 24/7 monitoring, AI-powered threat detection"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={addDifferentiator}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {metadata.keyDifferentiators?.map(diff => (
                  <span
                    key={diff}
                    className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                  >
                    {diff}
                    <button
                      onClick={() => removeDifferentiator(diff)}
                      className="ml-2 text-purple-600 hover:text-purple-800"
                    >
                      <CloseIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team Members (Optional)
              </label>
              <input
                type="text"
                value={metadata.teamMembers?.join(', ') || ''}
                onChange={(e) => updateMetadata({
                  teamMembers: e.target.value.split(',').map(m => m.trim()).filter(Boolean)
                })}
                placeholder="e.g., John Doe, Jane Smith"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Comma-separated names</p>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Why this matters:</strong> This information helps NIV learn what works
                and recommend better approaches for future proposals.
              </p>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>

          <div className="flex space-x-3">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
            )}

            {step < totalSteps ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={!canProceed()}
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Check className="h-4 w-4" />
                <span>Complete</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
