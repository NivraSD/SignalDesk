'use client'

import React, { useState, useEffect } from 'react'
import { MessageSquare, Send, Check, X as CloseIcon, Edit2, Sparkles, Loader2, Copy, Eye, FileText, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAppStore } from '@/stores/useAppStore'

interface PreDraftedComm {
  id: string
  title: string
  content: string
  metadata: {
    scenario: string
    stakeholder: string
    tone: string
    channel: string
  }
}

interface CrisisCommunicationsProps {
  crisis: any | null
  onUpdate: () => void
  onOpenInStudio?: (content: { id: string; title: string; content: string }) => void
}

export default function CrisisCommunications({ crisis, onUpdate, onOpenInStudio }: CrisisCommunicationsProps) {
  const { organization } = useAppStore()
  const [selectedStakeholder, setSelectedStakeholder] = useState<string | null>(null)
  const [draftMessage, setDraftMessage] = useState('')
  const [generating, setGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [preDraftedComms, setPreDraftedComms] = useState<PreDraftedComm[]>([])
  const [loadingPreDrafts, setLoadingPreDrafts] = useState(false)
  const [selectedPreDraft, setSelectedPreDraft] = useState<PreDraftedComm | null>(null)

  // Handle null crisis
  const communications = crisis?.communications || []

  // Load pre-drafted communications from Memory Vault
  useEffect(() => {
    const loadPreDraftedComms = async () => {
      if (!organization?.id) return

      setLoadingPreDrafts(true)
      try {
        const { data, error } = await supabase
          .from('content_library')
          .select('id, title, content, metadata')
          .eq('organization_id', organization.id)
          .eq('type', 'crisis-communication')
          .contains('tags', ['pre-drafted'])
          .order('created_at', { ascending: false })

        if (!error && data) {
          setPreDraftedComms(data.map(d => ({
            id: d.id,
            title: d.title,
            content: d.content,
            metadata: d.metadata || {}
          })))
          console.log(`📋 Loaded ${data.length} pre-drafted communications`)
        }
      } catch (err) {
        console.error('Failed to load pre-drafted communications:', err)
      } finally {
        setLoadingPreDrafts(false)
      }
    }

    loadPreDraftedComms()
  }, [organization?.id])

  const stakeholderGroups = [
    { id: 'customers', name: 'Customers', icon: '👥', color: 'bg-[var(--burnt-orange)]' },
    { id: 'employees', name: 'Employees', icon: '💼', color: 'bg-amber-500' },
    { id: 'investors', name: 'Investors', icon: '💰', color: 'bg-emerald-500' },
    { id: 'media', name: 'Media', icon: '📰', color: 'bg-red-500' },
    { id: 'regulators', name: 'Regulators', icon: '⚖️', color: 'bg-yellow-500' },
    { id: 'partners', name: 'Partners', icon: '🤝', color: 'bg-cyan-500' }
  ]

  const generateDraft = async () => {
    if (!selectedStakeholder || !crisis) return

    setGenerating(true)
    try {
      const { data, error } = await supabase.functions.invoke('mcp-crisis', {
        body: {
          tool: 'create_stakeholder_messaging',
          arguments: {
            coreMessage: `Crisis situation: ${crisis.title}. Type: ${crisis.crisis_type}. Severity: ${crisis.severity}.`,
            stakeholderGroups: [
              {
                group: selectedStakeholder,
                concerns: ['Immediate impact', 'Resolution timeline', 'Company response'],
                channel: 'email'
              }
            ],
            tone: crisis.severity === 'critical' ? 'apologetic' : 'transparent'
          }
        }
      })

      if (error) {
        console.error('Failed to generate message:', error)
        return
      }

      const generatedMessage = data.stakeholderMessages?.[selectedStakeholder]?.message || ''
      setDraftMessage(generatedMessage)
    } catch (err) {
      console.error('Generate draft error:', err)
    } finally {
      setGenerating(false)
    }
  }

  const saveDraft = async (status: 'draft' | 'approved' | 'sent') => {
    if (!selectedStakeholder || !draftMessage || !crisis) return

    const newComm = {
      id: Date.now(),
      stakeholder: selectedStakeholder,
      message: draftMessage,
      status,
      createdAt: new Date().toISOString(),
      sentAt: status === 'sent' ? new Date().toISOString() : null
    }

    const updatedComms = [...communications, newComm]

    const { error } = await supabase
      .from('crisis_events')
      .update({ communications: updatedComms })
      .eq('id', crisis.id)

    if (!error) {
      setDraftMessage('')
      setSelectedStakeholder(null)
      onUpdate()
    }
  }

  const updateCommStatus = async (commId: number, status: string) => {
    if (!crisis) return
    const updatedComms = communications.map((c: any) =>
      c.id === commId
        ? { ...c, status, sentAt: status === 'sent' ? new Date().toISOString() : c.sentAt }
        : c
    )

    const { error } = await supabase
      .from('crisis_events')
      .update({ communications: updatedComms })
      .eq('id', crisis.id)

    if (!error) onUpdate()
  }

  const deleteComm = async (commId: number) => {
    if (!crisis) return
    const updatedComms = communications.filter((c: any) => c.id !== commId)

    const { error } = await supabase
      .from('crisis_events')
      .update({ communications: updatedComms })
      .eq('id', crisis.id)

    if (!error) onUpdate()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500'
      case 'approved': return 'text-[var(--burnt-orange)] bg-[var(--burnt-orange)]/10 border-[var(--burnt-orange)]'
      case 'draft': return 'text-[var(--grey-500)] bg-[var(--grey-500)]/10 border-[var(--grey-500)]'
      default: return 'text-[var(--grey-500)] bg-[var(--grey-500)]/10 border-[var(--grey-500)]'
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="h-full p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Draft New Message */}
        <div className="bg-[var(--charcoal)] border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <MessageSquare className="w-6 h-6 text-[var(--burnt-orange)]" />
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>Draft Communication</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[var(--grey-400)] mb-2">Select Stakeholder Group</label>
              <div className="grid grid-cols-3 gap-3">
                {stakeholderGroups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => setSelectedStakeholder(group.id)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedStakeholder === group.id
                        ? `${group.color} border-white text-white`
                        : 'bg-zinc-800 border-zinc-700 text-[var(--grey-400)] hover:border-zinc-600'
                    }`}
                  >
                    <div className="text-2xl mb-1">{group.icon}</div>
                    <div className="text-sm font-semibold">{group.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {selectedStakeholder && (
              <>
                {/* Pre-drafted Communications Section */}
                {preDraftedComms.filter(c => c.metadata?.stakeholder === selectedStakeholder).length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm text-[var(--grey-400)] mb-2">
                      <FileText className="w-4 h-4 inline mr-1" />
                      Pre-Drafted Templates (from Memory Vault)
                    </label>
                    <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                      {preDraftedComms
                        .filter(c => c.metadata?.stakeholder === selectedStakeholder)
                        .map((comm) => (
                          <div
                            key={comm.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                              selectedPreDraft?.id === comm.id
                                ? 'border-[var(--burnt-orange)] bg-[var(--burnt-orange)]/10'
                                : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                            }`}
                            onClick={() => {
                              setSelectedPreDraft(comm)
                              setDraftMessage(comm.content)
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-medium text-white">{comm.metadata?.scenario || 'Crisis Communication'}</div>
                                <div className="text-xs text-[var(--grey-500)]">
                                  {comm.metadata?.channel || 'Email'} • {comm.metadata?.tone || 'Professional'} tone
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {onOpenInStudio && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onOpenInStudio({
                                        id: comm.id,
                                        title: comm.title,
                                        content: comm.content
                                      })
                                    }}
                                    className="text-[var(--grey-500)] hover:text-[var(--burnt-orange)] transition-colors"
                                    title="Edit in Studio"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    copyToClipboard(comm.content)
                                  }}
                                  className="text-[var(--grey-500)] hover:text-[var(--burnt-orange)] transition-colors"
                                  title="Copy to clipboard"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                    {selectedPreDraft && (
                      <div className="mt-2 text-xs text-[var(--grey-500)]">
                        Selected template loaded. Edit below or use as-is.
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-[var(--grey-400)]">Message Content</label>
                    <button
                      onClick={generateDraft}
                      disabled={generating}
                      className="px-3 py-1 bg-[var(--burnt-orange)] hover:brightness-110 disabled:opacity-50 text-white rounded text-xs flex items-center gap-2"
                    >
                      {generating ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" />
                          Generate New with AI
                        </>
                      )}
                    </button>
                  </div>
                  <textarea
                    value={draftMessage}
                    onChange={(e) => setDraftMessage(e.target.value)}
                    className="w-full bg-zinc-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)] h-48"
                    placeholder="Enter your message here or select a pre-drafted template above..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => saveDraft('draft')}
                    disabled={!draftMessage}
                    className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white rounded transition-colors"
                  >
                    Save as Draft
                  </button>
                  <button
                    onClick={() => saveDraft('approved')}
                    disabled={!draftMessage}
                    className="px-4 py-2 bg-[var(--burnt-orange)] hover:brightness-110 disabled:opacity-50 text-white rounded transition-colors"
                  >
                    Approve & Save
                  </button>
                  <button
                    onClick={() => saveDraft('sent')}
                    disabled={!draftMessage}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded transition-colors flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Mark as Sent
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Saved Communications */}
        <div className="bg-[var(--charcoal)] border border-zinc-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>Communication History</h2>

          <div className="space-y-4">
            {communications.map((comm: any) => {
              const group = stakeholderGroups.find(g => g.id === comm.stakeholder)
              return (
                <div key={comm.id} className="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${group?.color} rounded-full flex items-center justify-center text-xl`}>
                        {group?.icon}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{group?.name}</div>
                        <div className="text-xs text-[var(--grey-500)]">
                          {new Date(comm.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(comm.status)}`}>
                        {comm.status}
                      </span>
                      <button
                        onClick={() => copyToClipboard(comm.message)}
                        className="text-[var(--grey-500)] hover:text-[var(--burnt-orange)] transition-colors"
                        title="Copy to clipboard"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteComm(comm.id)}
                        className="text-[var(--grey-500)] hover:text-red-400 transition-colors"
                      >
                        <CloseIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-zinc-900 rounded p-3 mb-3">
                    <div className="text-sm text-[var(--grey-300)] whitespace-pre-wrap">{comm.message}</div>
                  </div>

                  {comm.status !== 'sent' && (
                    <div className="flex gap-2">
                      {comm.status === 'draft' && (
                        <button
                          onClick={() => updateCommStatus(comm.id, 'approved')}
                          className="px-3 py-1 bg-[var(--burnt-orange)] hover:brightness-110 text-white rounded text-xs flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => updateCommStatus(comm.id, 'sent')}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                        Mark as Sent
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {communications.length === 0 && (
            <div className="text-center py-12 text-[var(--grey-500)]">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No communications yet</p>
              <p className="text-xs mt-1">Select a stakeholder group above to draft a message</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
