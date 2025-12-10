'use client'

import React, { useState, useEffect } from 'react'
import { MessageSquare, Loader2, Copy, FileText, ExternalLink, Zap, ChevronDown, ChevronUp, CheckCircle, Circle, FolderOpen } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAppStore } from '@/stores/useAppStore'
import { fetchMemoryVaultContent } from '@/lib/memoryVaultAPI'

interface PreDraftedComm {
  id: string
  title: string
  content: string
  folder?: string
  metadata: {
    scenario?: string
    stakeholder?: string
    tone?: string
    channel?: string
  }
}

interface Scenario {
  title: string
  description: string
  likelihood?: string
  impact?: string
}

interface CrisisCommunicationsProps {
  crisis: any | null
  onUpdate: () => void
  onOpenInStudio?: (content: { id: string; title: string; content: string }) => void
}

export default function CrisisCommunications({ crisis, onUpdate, onOpenInStudio }: CrisisCommunicationsProps) {
  const { organization } = useAppStore()
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [preDraftedComms, setPreDraftedComms] = useState<PreDraftedComm[]>([])
  const [loadingScenarios, setLoadingScenarios] = useState(true)
  const [loadingComms, setLoadingComms] = useState(true)
  const [generatingFor, setGeneratingFor] = useState<string | null>(null)
  const [generationProgress, setGenerationProgress] = useState<string>('')
  const [expandedScenario, setExpandedScenario] = useState<string | null>(null)
  const [selectedComm, setSelectedComm] = useState<PreDraftedComm | null>(null)

  const stakeholders = ['Customers', 'Employees', 'Investors', 'Media', 'Regulators', 'Partners']

  // Load crisis plan scenarios
  useEffect(() => {
    const loadScenarios = async () => {
      if (!organization?.id) return
      setLoadingScenarios(true)
      try {
        const data = await fetchMemoryVaultContent({
          organization_id: organization.id,
          content_type: 'crisis-plan',
          limit: 1
        })
        if (data.length > 0) {
          const plan = JSON.parse(data[0].content)
          setScenarios(plan.scenarios || [])
          // Auto-expand first scenario
          if (plan.scenarios?.length > 0) {
            setExpandedScenario(plan.scenarios[0].title)
          }
        }
      } catch (err) {
        console.error('Failed to load scenarios:', err)
      } finally {
        setLoadingScenarios(false)
      }
    }
    loadScenarios()
  }, [organization?.id])

  // Load pre-drafted communications from Crisis folder
  useEffect(() => {
    loadPreDraftedComms()
  }, [organization?.id])

  const loadPreDraftedComms = async () => {
    if (!organization?.id) return
    setLoadingComms(true)
    console.log('📂 Loading crisis comms for org:', organization.id)
    try {
      // Simple query - just get content from Crisis folder
      const { data, error } = await supabase
        .from('content_library')
        .select('id, title, content, folder, metadata')
        .eq('organization_id', organization.id)
        .like('folder', 'Crisis/%')
        .order('created_at', { ascending: false })

      console.log('📂 Crisis comms query result:', { dataCount: data?.length || 0, error, orgId: organization.id })

      if (error) {
        console.error('Query error:', error)
      }

      if (data) {
        console.log('📂 Crisis comms loaded:', data.map(d => ({ title: d.title, folder: d.folder })))
        setPreDraftedComms(data.map(d => ({
          id: d.id,
          title: d.title,
          content: d.content,
          folder: d.folder,
          metadata: d.metadata || {}
        })))
      }
    } catch (err) {
      console.error('Failed to load pre-drafted communications:', err)
    } finally {
      setLoadingComms(false)
    }
  }

  const getCommsForScenario = (scenarioTitle: string) => {
    // Match by folder path OR metadata scenario
    const folderName = scenarioTitle.replace(/[^a-zA-Z0-9\s]/g, '').trim()
    const matches = preDraftedComms.filter(c =>
      c.folder?.includes(folderName) ||
      c.metadata?.scenario === scenarioTitle
    )
    console.log('📂 getCommsForScenario:', { scenarioTitle, folderName, totalComms: preDraftedComms.length, matches: matches.length })
    return matches
  }

  // Generate holding statements using mcp-crisis (crisis communications expert)
  const generateCommsForScenario = async (scenario: Scenario) => {
    if (!organization || generatingFor) return
    setGeneratingFor(scenario.title)
    setGenerationProgress('Starting generation...')

    try {
      console.log(`🚀 Generating crisis holding statements for scenario: ${scenario.title}`)
      setGenerationProgress(`Generating ${stakeholders.length} stakeholder holding statements...`)

      // Call mcp-crisis which generates proper holding statements
      const { data: result, error } = await supabase.functions.invoke('mcp-crisis', {
        body: {
          action: 'generate_scenario_comms',
          scenario: scenario,
          organization_id: organization.id,
          organization_name: organization.name,
          industry: organization.industry || 'general'
        }
      })

      if (error) {
        console.error('Generation error:', error)
        throw error
      }

      console.log('✅ Generation complete:', result)
      setGenerationProgress('Generation complete! Loading content...')

      // Reload to show new content
      await loadPreDraftedComms()

    } catch (err) {
      console.error('Error generating communications:', err)
      setGenerationProgress('Generation failed. Please try again.')
    } finally {
      setGeneratingFor(null)
      setTimeout(() => setGenerationProgress(''), 3000)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getStakeholderIcon = (stakeholder: string) => {
    const lower = (stakeholder || '').toLowerCase()
    if (lower.includes('customer')) return '👥'
    if (lower.includes('employee')) return '💼'
    if (lower.includes('investor')) return '💰'
    if (lower.includes('media')) return '📰'
    if (lower.includes('regulator')) return '⚖️'
    if (lower.includes('partner')) return '🤝'
    return '📄'
  }

  if (loadingScenarios) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--burnt-orange)]" />
      </div>
    )
  }

  if (scenarios.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="w-16 h-16 text-[var(--grey-600)] mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>No Crisis Plan</h3>
          <p className="text-[var(--grey-400)]">Generate a crisis plan first to access communications.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex">
      {/* Left Panel - Scenarios */}
      <div className="w-1/2 border-r border-[var(--grey-800)] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>Scenario Materials</h2>
        </div>

        {generationProgress && (
          <div className="mb-4 p-3 bg-[var(--burnt-orange)]/10 border border-[var(--burnt-orange)]/30 rounded-lg">
            <p className="text-sm text-[var(--burnt-orange)] flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {generationProgress}
            </p>
          </div>
        )}

        <div className="space-y-4">
          {scenarios.map((scenario, idx) => {
            const scenarioComms = getCommsForScenario(scenario.title)
            const isExpanded = expandedScenario === scenario.title
            const hasComms = scenarioComms.length > 0
            const isGenerating = generatingFor === scenario.title

            return (
              <div key={idx} className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl overflow-hidden">
                {/* Scenario Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-[var(--grey-800)]/30 transition-colors"
                  onClick={() => setExpandedScenario(isExpanded ? null : scenario.title)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-semibold">{scenario.title}</h3>
                        {hasComms ? (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            {scenarioComms.length} drafts
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-zinc-700 text-[var(--grey-400)] text-xs rounded-full">
                            <Circle className="w-3 h-3" />
                            No drafts
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[var(--grey-400)] mt-1 line-clamp-2">{scenario.description}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      {!hasComms && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            generateCommsForScenario(scenario)
                          }}
                          disabled={isGenerating}
                          className="px-3 py-1.5 bg-[var(--burnt-orange)] text-white rounded-lg text-xs font-medium flex items-center gap-1.5 hover:brightness-110 disabled:opacity-50"
                        >
                          {isGenerating ? (
                            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</>
                          ) : (
                            <><Zap className="w-3.5 h-3.5" /> Generate</>
                          )}
                        </button>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-[var(--grey-400)]" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-[var(--grey-400)]" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-[var(--grey-800)] p-4 bg-[var(--grey-900)]/50">
                    {hasComms ? (
                      <div className="grid grid-cols-2 gap-2">
                        {scenarioComms.map((comm) => (
                          <button
                            key={comm.id}
                            onClick={() => setSelectedComm(comm)}
                            className={`p-3 rounded-lg border text-left transition-all ${
                              selectedComm?.id === comm.id
                                ? 'border-[var(--burnt-orange)] bg-[var(--burnt-orange)]/10'
                                : 'border-[var(--grey-700)] bg-[var(--grey-800)]/50 hover:border-[var(--grey-600)]'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{getStakeholderIcon(comm.metadata?.stakeholder || comm.title)}</span>
                              <div>
                                <p className="text-sm text-white font-medium">{comm.metadata?.stakeholder || comm.title}</p>
                                <p className="text-xs text-[var(--grey-500)]">{comm.metadata?.channel || 'Email'}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <MessageSquare className="w-10 h-10 text-[var(--grey-600)] mx-auto mb-3" />
                        <p className="text-sm text-[var(--grey-400)] mb-3">No materials generated yet</p>
                        <button
                          onClick={() => generateCommsForScenario(scenario)}
                          disabled={isGenerating}
                          className="px-4 py-2 bg-[var(--burnt-orange)] text-white rounded-lg text-sm font-medium flex items-center gap-2 mx-auto hover:brightness-110 disabled:opacity-50"
                        >
                          {isGenerating ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                          ) : (
                            <><Zap className="w-4 h-4" /> Generate All Materials</>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Folder info */}
                    {hasComms && (
                      <div className="mt-3 pt-3 border-t border-[var(--grey-800)] flex items-center gap-2 text-xs text-[var(--grey-500)]">
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>Stored in Memory Vault: Crisis/{scenario.title.replace(/[^a-zA-Z0-9\s]/g, '').trim()}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Right Panel - Selected Communication Preview */}
      <div className="w-1/2 overflow-y-auto p-6">
        {selectedComm ? (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getStakeholderIcon(selectedComm.metadata?.stakeholder || selectedComm.title)}</span>
                <div>
                  <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                    {selectedComm.metadata?.stakeholder || selectedComm.title}
                  </h3>
                  <p className="text-sm text-[var(--grey-400)]">
                    {selectedComm.metadata?.scenario || selectedComm.folder} • {selectedComm.metadata?.channel || 'Email'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(selectedComm.content)}
                  className="p-2 text-[var(--grey-400)] hover:text-white transition-colors"
                  title="Copy to clipboard"
                >
                  <Copy className="w-5 h-5" />
                </button>
                {onOpenInStudio && (
                  <button
                    onClick={() => onOpenInStudio({
                      id: selectedComm.id,
                      title: selectedComm.title,
                      content: selectedComm.content
                    })}
                    className="px-3 py-1.5 bg-[var(--burnt-orange)] text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:brightness-110"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Edit in Studio
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl p-6 overflow-y-auto">
              <div className="prose prose-invert max-w-none">
                <div className="text-[var(--grey-300)] whitespace-pre-wrap leading-relaxed">
                  {selectedComm.content}
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="mt-4 flex items-center gap-4 text-xs text-[var(--grey-500)]">
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                {selectedComm.content.split(/\s+/).length} words
              </span>
              <span>Tone: {selectedComm.metadata?.tone || 'Professional'}</span>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <FileText className="w-16 h-16 text-[var(--grey-600)] mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>Select a Communication</h3>
              <p className="text-[var(--grey-400)]">Choose a scenario and select a communication to preview</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
