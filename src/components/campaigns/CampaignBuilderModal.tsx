'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, ChevronRight, Loader2, Check, Info } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface CampaignBuilderModalProps {
  isOpen: boolean
  onClose: () => void
  organizationId?: string
  organizationName?: string
}

type WizardStep = 'intent' | 'research' | 'positioning' | 'blueprint' | 'presentation' | 'execute'

const WIZARD_STEPS: { id: WizardStep; label: string; number: number }[] = [
  { id: 'intent', label: 'Intent', number: 1 },
  { id: 'research', label: 'Research', number: 2 },
  { id: 'positioning', label: 'Positioning', number: 3 },
  { id: 'blueprint', label: 'Blueprint', number: 4 },
  { id: 'presentation', label: 'Presentation', number: 5 },
  { id: 'execute', label: 'Execute', number: 6 }
]

const EXAMPLE_GOALS = [
  {
    title: 'Product Launch',
    description: 'Launch our new AI platform and establish thought leadership'
  },
  {
    title: 'Crisis Response',
    description: 'Address negative press and rebuild stakeholder trust'
  },
  {
    title: 'Funding Round',
    description: 'Build excitement and credibility ahead of Series B'
  },
  {
    title: 'Market Entry',
    description: 'Establish presence in European market with local partners'
  }
]

export default function CampaignBuilderModal({
  isOpen,
  onClose,
  organizationId,
  organizationName
}: CampaignBuilderModalProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<WizardStep>('intent')
  const [campaignObjective, setCampaignObjective] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showExamples, setShowExamples] = useState(true)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('intent')
      setCampaignObjective('')
      setIsProcessing(false)
      setShowExamples(true)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isProcessing) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, isProcessing, onClose])

  const handleExampleClick = (example: typeof EXAMPLE_GOALS[0]) => {
    setCampaignObjective(example.description)
    setShowExamples(false)
  }

  const handleStartBuilding = async () => {
    if (campaignObjective.trim().length < 10) return

    setIsProcessing(true)

    // Navigate to the full campaign builder page with the objective
    // The campaign builder will handle the full flow and Execute will go to Planning
    router.push(`/campaign-builder?objective=${encodeURIComponent(campaignObjective)}&org_id=${organizationId}`)
  }

  const currentStepIndex = WIZARD_STEPS.findIndex(s => s.id === currentStep)

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) onClose()
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-3xl max-h-[90vh] bg-[var(--grey-100)] rounded-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b bg-white" style={{ borderColor: 'var(--grey-200)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h2
                className="text-xl font-semibold"
                style={{ color: 'var(--charcoal)', fontFamily: 'var(--font-display)' }}
              >
                Campaign Builder
              </h2>
              <p className="text-sm mt-0.5" style={{ color: 'var(--grey-500)' }}>
                Create a new strategic campaign
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="p-2 rounded-lg hover:bg-[var(--grey-100)] transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" style={{ color: 'var(--grey-500)' }} />
            </button>
          </div>
        </div>

        {/* Steps Progress */}
        <div className="px-6 py-4 bg-white border-b" style={{ borderColor: 'var(--grey-200)' }}>
          <div className="flex items-center justify-between">
            {WIZARD_STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                      index <= currentStepIndex
                        ? 'bg-[var(--burnt-orange)] text-white'
                        : 'bg-[var(--grey-200)] text-[var(--grey-500)]'
                    }`}
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {index < currentStepIndex ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium hidden sm:block ${
                      index <= currentStepIndex ? 'text-[var(--charcoal)]' : 'text-[var(--grey-400)]'
                    }`}
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {step.label}
                  </span>
                </div>
                {index < WIZARD_STEPS.length - 1 && (
                  <div
                    className={`w-8 h-0.5 mx-2 ${
                      index < currentStepIndex ? 'bg-[var(--burnt-orange)]' : 'bg-[var(--grey-200)]'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentStep === 'intent' && (
            <div className="space-y-6">
              <div>
                <h3
                  className="text-lg font-semibold mb-1"
                  style={{ color: 'var(--charcoal)', fontFamily: 'var(--font-display)' }}
                >
                  Define Your Campaign Goal
                </h3>
                <p className="text-sm" style={{ color: 'var(--grey-500)' }}>
                  Describe what you want to achieve with this campaign
                </p>
              </div>

              {/* Campaign Objective Input */}
              <div className="bg-white rounded-xl p-5" style={{ border: '1px solid var(--grey-200)' }}>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--charcoal)', fontFamily: 'var(--font-display)' }}
                >
                  Campaign Objective
                </label>
                <textarea
                  value={campaignObjective}
                  onChange={(e) => setCampaignObjective(e.target.value)}
                  onFocus={() => setShowExamples(false)}
                  placeholder="Describe your campaign objective... (e.g., 'Establish thought leadership in AI enterprise solutions ahead of Q4 earnings')"
                  className="w-full h-28 px-4 py-3 rounded-lg border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)] focus:border-transparent"
                  style={{
                    borderColor: 'var(--grey-300)',
                    color: 'var(--charcoal)',
                    background: 'var(--white)'
                  }}
                  disabled={isProcessing}
                />
                <div className="flex items-center justify-between mt-2">
                  <div className="text-xs" style={{ color: 'var(--grey-400)' }}>
                    {campaignObjective.length < 10 && campaignObjective.length > 0 && (
                      <span style={{ color: 'var(--warning)' }}>
                        Add a bit more detail ({10 - campaignObjective.length} characters needed)
                      </span>
                    )}
                    {campaignObjective.length >= 10 && (
                      <span style={{ color: 'var(--success)' }}>
                        Looking good!
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Example Goals */}
              {showExamples && !isProcessing && (
                <div className="space-y-3">
                  <p className="text-sm text-center" style={{ color: 'var(--grey-500)' }}>
                    Or try one of these examples:
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {EXAMPLE_GOALS.map((example, i) => (
                      <button
                        key={i}
                        onClick={() => handleExampleClick(example)}
                        className="text-left p-4 bg-white rounded-xl border transition-all hover:border-[var(--burnt-orange)] hover:shadow-sm group"
                        style={{ borderColor: 'var(--grey-200)' }}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4
                              className="font-medium mb-1 group-hover:text-[var(--burnt-orange)] transition-colors"
                              style={{ color: 'var(--charcoal)', fontFamily: 'var(--font-display)' }}
                            >
                              {example.title}
                            </h4>
                            <p className="text-xs" style={{ color: 'var(--grey-500)' }}>
                              {example.description}
                            </p>
                          </div>
                          <ChevronRight
                            className="w-4 h-4 flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ color: 'var(--burnt-orange)' }}
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Pipeline Info */}
              <div
                className="rounded-xl p-5"
                style={{ background: 'var(--charcoal)', color: 'var(--white)' }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Info className="w-5 h-5" style={{ color: 'var(--burnt-orange)' }} />
                  <span
                    className="font-semibold"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Campaign Builder Pipeline
                  </span>
                </div>
                <p className="text-sm mb-4" style={{ color: 'var(--grey-400)' }}>
                  The 6-stage campaign process:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { num: 1, text: 'Intent Capture - Define your campaign goal' },
                    { num: 2, text: 'Research - Intelligence gathering, competitive landscape' },
                    { num: 3, text: 'Positioning - PR, Vector, or GEO-Vector approach' },
                    { num: 4, text: 'Blueprint - Multi-stage campaign generation' },
                    { num: 5, text: 'Presentation - Visual strategy presentation' },
                    { num: 6, text: 'Execute - Activate campaign in Planning tab' }
                  ].map((item) => (
                    <div key={item.num} className="flex items-start gap-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                          item.num === 1 ? 'bg-[var(--burnt-orange)]' : 'bg-[var(--burnt-orange)]/50'
                        }`}
                      >
                        {item.num}
                      </div>
                      <span className="text-xs" style={{ color: 'var(--grey-300)' }}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 border-t bg-white flex items-center justify-between"
          style={{ borderColor: 'var(--grey-200)' }}
        >
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors hover:bg-[var(--grey-50)] disabled:opacity-50"
            style={{
              borderColor: 'var(--grey-300)',
              color: 'var(--grey-600)',
              fontFamily: 'var(--font-display)'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleStartBuilding}
            disabled={campaignObjective.trim().length < 10 || isProcessing}
            className="px-5 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'var(--burnt-orange)',
              color: 'var(--white)',
              fontFamily: 'var(--font-display)'
            }}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Continue to Research
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
