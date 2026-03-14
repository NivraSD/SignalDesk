'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Shield, Clock, ChevronRight, Loader2, Sparkles, FileText,
  MonitorPlay, ArrowLeft, AlertTriangle, Users, Target,
  TrendingUp, Eye, Map, BarChart3, Download, Trash2, Copy, Check,
  Radar, Play, Lightbulb, Globe, BookOpen, Plus, X, Search, Send, Brain,
  FileDown, ArrowUp
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase/client'
import { useAppStore } from '@/stores/useAppStore'
import { PublicAffairsService, type PublicAffairsReport } from '@/lib/services/publicAffairsService'
import { IntelligenceService } from '@/lib/services/intelligenceService'
import IntelligenceAnalystChat from './IntelligenceAnalystChat'

const URGENCY_COLORS = {
  flash: 'bg-red-500/20 text-red-400 border-red-500/30',
  standard: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  deep_dive: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  research_pending: { label: 'Pending', color: 'text-[var(--grey-500)]' },
  research_in_progress: { label: 'Gathering Intelligence...', color: 'text-amber-400' },
  intelligence_complete: { label: 'Intelligence Ready', color: 'text-emerald-400' },
  research_complete: { label: 'Research Complete', color: 'text-blue-400' },
  blueprint_in_progress: { label: 'Generating Strategy...', color: 'text-amber-400' },
  blueprint_complete: { label: 'Strategy Ready', color: 'text-emerald-400' },
  strategy_in_progress: { label: 'Generating Strategy...', color: 'text-amber-400' },
  strategy_complete: { label: 'Strategy Ready', color: 'text-emerald-400' },
  presentation_in_progress: { label: 'Generating Deck...', color: 'text-amber-400' },
  complete: { label: 'Complete', color: 'text-emerald-400' },
  failed: { label: 'Failed', color: 'text-red-400' }
}

/** Detect new geopolitical intelligence format */
function isNewFormat(data: any): boolean {
  return !!data?.situation_assessment?.current_situation || !!data?.scenario_analysis || !!data?.geopolitical_context || !!data?.contextual_analysis
}

export default function PublicAffairsModule() {
  const router = useRouter()
  const { organization } = useAppStore()
  const [reports, setReports] = useState<PublicAffairsReport[]>([])
  const [selectedReport, setSelectedReport] = useState<PublicAffairsReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [generatingBlueprint, setGeneratingBlueprint] = useState(false)
  const [generatingPresentation, setGeneratingPresentation] = useState(false)
  const [generatingOnePager, setGeneratingOnePager] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showNewResearch, setShowNewResearch] = useState(false)
  const [newTopic, setNewTopic] = useState('')
  const [focusAreas, setFocusAreas] = useState<string[]>([])
  const [focusInput, setFocusInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [synthesis, setSynthesis] = useState<any>(null)
  const [generatingSynthesisReport, setGeneratingSynthesisReport] = useState<number | null>(null)
  const [showChat, setShowChat] = useState(true)

  useEffect(() => {
    if (organization?.id) {
      fetchReports()
      IntelligenceService.getLatestSynthesis(organization.id).then(s => setSynthesis(s)).catch(() => {})

      const channel = supabase
        .channel('public-affairs-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'public_affairs_reports',
            filter: `organization_id=eq.${organization.id}`
          },
          () => { fetchReports() }
        )
        .subscribe()

      const pollInterval = setInterval(() => { fetchReports() }, 4000)

      return () => {
        supabase.removeChannel(channel)
        clearInterval(pollInterval)
      }
    }
  }, [organization?.id])

  useEffect(() => {
    if (selectedReport) {
      const updated = reports.find(r => r.id === selectedReport.id)
      if (updated && (
        updated.status !== selectedReport.status ||
        JSON.stringify(updated.research_data) !== JSON.stringify(selectedReport.research_data) ||
        JSON.stringify(updated.blueprint_data) !== JSON.stringify(selectedReport.blueprint_data)
      )) {
        setSelectedReport(updated)
      }
    }
  }, [reports])

  const fetchReports = async () => {
    if (!organization?.id) return
    try {
      const data = await PublicAffairsService.getReports(organization.id)
      setReports(data)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching public affairs reports:', err)
      setLoading(false)
    }
  }

  const handleGenerateBlueprint = async () => {
    if (!selectedReport || !organization) return
    setGeneratingBlueprint(true)
    setError(null)
    try {
      await PublicAffairsService.generateBlueprint(
        selectedReport.id,
        organization.id,
        organization.name,
        organization.industry || 'General'
      )
      await fetchReports()
    } catch (err: any) {
      setError(err.message || 'Failed to generate strategy')
    } finally {
      setGeneratingBlueprint(false)
    }
  }

  const handleGeneratePresentation = async () => {
    if (!selectedReport || !organization) return
    setGeneratingPresentation(true)
    setError(null)
    try {
      await PublicAffairsService.generatePresentation(selectedReport.id, organization.id)
      await fetchReports()
    } catch (err: any) {
      setError(err.message || 'Failed to generate presentation')
    } finally {
      setGeneratingPresentation(false)
    }
  }

  const handleGenerateOnePager = async () => {
    if (!selectedReport || !organization) return
    setGeneratingOnePager(true)
    setError(null)
    try {
      await PublicAffairsService.generateOnePager(selectedReport.id, organization.id, organization.name)
      await fetchReports()
    } catch (err: any) {
      setError(err.message || 'Failed to generate one-pager')
    } finally {
      setGeneratingOnePager(false)
    }
  }

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleExportBrief = (report: PublicAffairsReport) => {
    const html = PublicAffairsService.compileHtmlBrief(report)
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const w = window.open(url, '_blank')
    // Clean up after a delay
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  }

  const handleDeleteReport = async (reportId: string) => {
    try {
      await PublicAffairsService.deleteReport(reportId)
      if (selectedReport?.id === reportId) setSelectedReport(null)
      await fetchReports()
    } catch (err) {
      console.error('Error deleting report:', err)
    }
  }

  const handleSubmitTopic = async () => {
    if (!organization?.id || !newTopic.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const report = await PublicAffairsService.createFromTopic(
        organization.id,
        newTopic.trim(),
        focusAreas.length > 0 ? focusAreas : undefined
      )
      // Fire off research in background
      PublicAffairsService.startResearch(
        report.id,
        organization.id,
        organization.name,
        organization.industry || 'General'
      ).catch(err => console.error('Research pipeline error:', err))

      // Reset form and navigate to report
      setNewTopic('')
      setFocusAreas([])
      setFocusInput('')
      setShowNewResearch(false)
      await fetchReports()
      setSelectedReport(report)
    } catch (err: any) {
      setError(err.message || 'Failed to create research')
    } finally {
      setSubmitting(false)
    }
  }

  const handleGenerateFromSynthesis = async (dev: any, index: number) => {
    if (!organization?.id) return
    setGeneratingSynthesisReport(index)
    setError(null)
    try {
      const article = {
        title: dev.event || dev.headline || dev.title,
        content: dev.impact || dev.pr_implication || dev.details || dev.description,
        source: dev.source,
        url: dev.url,
        published_at: dev.published_at || new Date().toISOString()
      }
      const report = await PublicAffairsService.createFromArticle(organization.id, article)
      PublicAffairsService.startResearch(
        report.id, organization.id, organization.name, organization.industry || 'General'
      ).catch(err => console.error('Research pipeline error:', err))
      await fetchReports()
      setSelectedReport(report)
    } catch (err: any) {
      setError(err.message || 'Failed to generate report')
    } finally {
      setGeneratingSynthesisReport(null)
    }
  }

  const addFocusArea = () => {
    const trimmed = focusInput.trim()
    if (trimmed && !focusAreas.includes(trimmed)) {
      setFocusAreas([...focusAreas, trimmed])
      setFocusInput('')
    }
  }

  if (selectedReport) {
    return (
      <div className="flex-1 overflow-y-auto p-8">
        <ReportDetailView
          report={selectedReport}
          organizationId={organization?.id || ''}
          onBack={() => setSelectedReport(null)}
          onGenerateBlueprint={handleGenerateBlueprint}
          onGeneratePresentation={handleGeneratePresentation}
          onGenerateOnePager={handleGenerateOnePager}
          onDownload={handleDownload}
          onExportBrief={handleExportBrief}
          generatingBlueprint={generatingBlueprint}
          generatingPresentation={generatingPresentation}
          generatingOnePager={generatingOnePager}
          error={error}
        />
      </div>
    )
  }

  const handleChatReportCreated = async (report: any) => {
    await fetchReports()
    setSelectedReport(report)
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Main content area */}
      <div className={`flex-1 overflow-y-auto p-8 ${showChat ? 'pr-0' : ''}`}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-bold text-white" style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem' }}>
                Geopolitical Intelligence
              </h1>
              <p className="text-[var(--grey-400)] text-sm mt-1">
                Deep intelligence memos generated from developing situations
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowChat(!showChat)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  backgroundColor: showChat ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)',
                  color: showChat ? '#60a5fa' : '#71717a',
                  border: `1px solid ${showChat ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.08)'}`,
                }}
              >
                <Brain className="w-4 h-4" />
                {showChat ? 'Hide Analyst' : 'Analyst'}
              </button>
              <button
                onClick={() => setShowNewResearch(!showNewResearch)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  backgroundColor: showNewResearch ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)',
                  color: showNewResearch ? '#f87171' : '#60a5fa',
                  border: `1px solid ${showNewResearch ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.3)'}`,
                }}
              >
                {showNewResearch ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {showNewResearch ? 'Cancel' : 'New Research'}
              </button>
            </div>
          </div>

        {/* New Research Form */}
        {showNewResearch && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 rounded-lg border"
            style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(59,130,246,0.2)' }}
          >
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: '#e4e4e7', fontFamily: 'var(--font-display)' }}>
              Commission Intelligence Research
            </h3>

            {/* Topic input */}
            <div className="mb-4">
              <label className="block text-xs font-medium mb-2" style={{ color: '#a1a1aa' }}>
                Topic or Situation
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && newTopic.trim() && handleSubmitTopic()}
                  placeholder="e.g. US-China semiconductor export controls, EU AI Act enforcement, OPEC+ production cuts..."
                  className="flex-1 px-4 py-3 rounded-lg text-sm bg-[var(--grey-900)] text-white border border-[var(--grey-700)] focus:border-blue-500/50 focus:outline-none placeholder:text-[var(--grey-600)]"
                />
              </div>
            </div>

            {/* Focus areas */}
            <div className="mb-4">
              <label className="block text-xs font-medium mb-2" style={{ color: '#a1a1aa' }}>
                Key Areas to Cover <span style={{ color: '#52525b' }}>(optional)</span>
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={focusInput}
                  onChange={(e) => setFocusInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); addFocusArea() }
                  }}
                  placeholder="e.g. Supply chain impact, Regulatory timeline, Competitive positioning..."
                  className="flex-1 px-3 py-2 rounded-lg text-sm bg-[var(--grey-900)] text-white border border-[var(--grey-700)] focus:border-blue-500/50 focus:outline-none placeholder:text-[var(--grey-600)]"
                />
                <button
                  onClick={addFocusArea}
                  disabled={!focusInput.trim()}
                  className="px-3 py-2 rounded-lg text-sm bg-[var(--grey-800)] text-[var(--grey-300)] hover:bg-[var(--grey-700)] border border-[var(--grey-700)] transition-all disabled:opacity-30"
                >
                  Add
                </button>
              </div>
              {focusAreas.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {focusAreas.map((area, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs"
                      style={{ backgroundColor: 'rgba(59,130,246,0.1)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.2)' }}
                    >
                      {area}
                      <button
                        onClick={() => setFocusAreas(focusAreas.filter((_, j) => j !== i))}
                        className="hover:text-white transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmitTopic}
              disabled={!newTopic.trim() || submitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
              style={{ backgroundColor: '#2563eb', color: '#fff' }}
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Commissioning Research...</>
              ) : (
                <><Search className="w-4 h-4" /> Research This Topic</>
              )}
            </button>
          </motion.div>
        )}

        {/* Key Developments from Latest Intelligence */}
        {synthesis && !showNewResearch && (() => {
          // Match Hub's data extraction: try all possible nesting paths
          const raw = synthesis?.synthesis_data || synthesis
          const synthData = raw?.synthesis || raw
          const developments = synthData?.key_developments || []
          if (developments.length === 0) return null
          return (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-[var(--burnt-orange)]" />
                <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#a1a1aa', fontFamily: 'var(--font-display)' }}>
                  Key Developments
                </h3>
              </div>
              <div className="space-y-3">
                {developments.map((dev: any, i: number) => {
                  const implication = dev.pr_implication || dev.impact || dev.details
                  return (
                    <div key={i} className="bg-[var(--grey-800)] rounded-lg p-4">
                      <div className="flex items-start gap-3 mb-2">
                        {dev.category && (
                          <span className="px-2 py-1 text-xs rounded bg-[var(--burnt-orange-muted)] text-[var(--burnt-orange)]">
                            {dev.category.replace(/_/g, ' ')}
                          </span>
                        )}
                        {dev.recency && (
                          <span className={`px-2 py-1 text-xs rounded ${
                            dev.recency === 'today'
                              ? 'bg-green-900/30 text-green-400'
                              : dev.recency === 'this_week'
                              ? 'bg-blue-900/30 text-blue-400'
                              : 'bg-[var(--grey-700)] text-[var(--grey-400)]'
                          }`}>
                            {dev.recency === 'today' ? 'Today' : dev.recency === 'this_week' ? 'This Week' : dev.recency}
                          </span>
                        )}
                        {dev.entity && (
                          <span className="px-2 py-1 text-xs rounded bg-[var(--grey-700)] text-[var(--grey-300)]">
                            {dev.entity}
                          </span>
                        )}
                      </div>
                      <h4 className="text-white font-medium mb-2">{dev.event || dev.headline || dev.title}</h4>
                      {implication && (
                        <div className="mb-2">
                          <span className="text-[var(--burnt-orange)] text-xs font-medium uppercase tracking-wide">PR Implication:</span>
                          <p className="text-[var(--grey-300)] text-sm mt-1">{implication}</p>
                        </div>
                      )}
                      {dev.source && (
                        <div className="mt-3 pt-2 border-t border-[var(--grey-700)] text-xs text-[var(--grey-500)]">
                          Source:{' '}
                          {dev.url && dev.url.startsWith('http') ? (
                            <a href={dev.url} target="_blank" rel="noopener noreferrer" className="text-[var(--burnt-orange)] hover:underline">
                              {dev.source}
                            </a>
                          ) : dev.source}
                        </div>
                      )}
                      {/* PA Research Button */}
                      <div className="mt-3 pt-3 border-t border-[var(--grey-700)]">
                        <button
                          onClick={() => handleGenerateFromSynthesis(dev, i)}
                          disabled={generatingSynthesisReport === i}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                            generatingSynthesisReport === i
                              ? 'bg-[var(--grey-700)] text-[var(--grey-400)] cursor-wait'
                              : 'bg-slate-500/20 text-slate-300 border border-slate-500/30 hover:bg-slate-500/30 hover:border-slate-500/50'
                          }`}
                        >
                          {generatingSynthesisReport === i ? (
                            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating Report...</>
                          ) : (
                            <><Shield className="w-3.5 h-3.5" /> Research &amp; Analyze</>
                          )}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* Research Reports Section */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--grey-500)]" />
          </div>
        ) : reports.length === 0 && !showNewResearch ? (
          <div className="text-center py-20">
            <Globe className="w-12 h-12 mx-auto mb-4 text-[var(--grey-600)]" />
            <p className="text-[var(--grey-400)] mb-2">No intelligence reports yet</p>
            <p className="text-[var(--grey-500)] text-sm mb-6">
              Commission research on any geopolitical topic or situation
            </p>
            <button
              onClick={() => setShowNewResearch(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium"
              style={{ backgroundColor: '#2563eb', color: '#fff' }}
            >
              <Plus className="w-4 h-4" /> New Research
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-[var(--grey-400)]" />
              <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#a1a1aa', fontFamily: 'var(--font-display)' }}>
                Research Reports
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--grey-800)] text-[var(--grey-400)]">
                {reports.length}
              </span>
            </div>
            <div className="space-y-3">
              {reports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onClick={() => setSelectedReport(report)}
                  onDelete={() => handleDeleteReport(report.id)}
                />
              ))}
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Chat Panel */}
      {showChat && (
        <div
          className="w-[380px] shrink-0 border-l flex flex-col"
          style={{ borderColor: 'var(--grey-800)', backgroundColor: 'rgba(0,0,0,0.2)' }}
        >
          <IntelligenceAnalystChat onReportCreated={handleChatReportCreated} />
        </div>
      )}
    </div>
  )
}

// Report Card Component
function ReportCard({ report, onClick, onDelete }: {
  report: PublicAffairsReport
  onClick: () => void
  onDelete: () => void
}) {
  const statusInfo = STATUS_LABELS[report.status] || STATUS_LABELS.research_pending
  const urgencyColor = URGENCY_COLORS[report.urgency] || URGENCY_COLORS.standard

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-lg p-5 hover:border-[var(--grey-600)] transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-slate-400 shrink-0" />
            <h3 className="text-white font-medium truncate">{report.title}</h3>
          </div>
          <p className="text-[var(--grey-400)] text-sm line-clamp-2 mb-3">
            {report.trigger_event.content?.substring(0, 200)}
          </p>
          <div className="flex items-center gap-3 text-xs">
            <span className={`px-2 py-0.5 rounded border ${urgencyColor}`}>
              {report.urgency}
            </span>
            <span className={statusInfo.color}>
              {report.status.includes('in_progress') && <Loader2 className="w-3 h-3 animate-spin inline mr-1" />}
              {statusInfo.label}
            </span>
            <span className="text-[var(--grey-500)]">
              <Clock className="w-3 h-3 inline mr-1" />
              {new Date(report.created_at).toLocaleDateString()}
            </span>
            {report.trigger_event.source && (
              <span className="text-[var(--grey-500)]">{report.trigger_event.source}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-red-500/20 text-[var(--grey-500)] hover:text-red-400 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <ChevronRight className="w-5 h-5 text-[var(--grey-500)]" />
        </div>
      </div>
    </motion.div>
  )
}

// Report Detail View
function ReportDetailView({
  report,
  organizationId,
  onBack,
  onGenerateBlueprint,
  onGeneratePresentation,
  onGenerateOnePager,
  onDownload,
  onExportBrief,
  generatingBlueprint,
  generatingPresentation,
  generatingOnePager,
  error
}: {
  report: PublicAffairsReport
  organizationId: string
  onBack: () => void
  onGenerateBlueprint: () => void
  onGeneratePresentation: () => void
  onGenerateOnePager: () => void
  onDownload: (content: string, filename: string) => void
  onExportBrief: (report: PublicAffairsReport) => void
  generatingBlueprint: boolean
  generatingPresentation: boolean
  generatingOnePager: boolean
  error: string | null
}) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [monitorSuccess, setMonitorSuccess] = useState(false)
  const hasResearch = !!report.research_data
  const hasBlueprint = !!report.blueprint_data
  const hasPresentation = !!report.presentation_url
  const isProcessing = report.status.includes('in_progress')
  const isIntelligenceComplete = report.status === 'research_complete' || report.status === 'blueprint_complete' || report.status === 'complete'
  const useNew = isNewFormat(report.research_data)
  const safeFilename = report.title.replace(/[^a-zA-Z0-9\s-]/g, '').trim()

  const handleCopyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Action: Monitor — create tracked narrative
  const handleMonitor = async () => {
    try {
      await supabase.from('tracked_narratives').insert({
        organization_id: report.organization_id,
        title: report.title,
        summary: report.research_data?.executive_summary?.substring(0, 500) || report.trigger_event.content?.substring(0, 500),
        status: 'emerging',
        trajectory: 'growing',
        first_detected_at: new Date().toISOString(),
        last_updated_at: new Date().toISOString(),
        mention_count: 1,
        related_entities: {
          stakeholders: report.research_data?.stakeholder_analysis?.stakeholders?.map((s: any) => s.name) || [],
          topics: [report.trigger_event.title]
        }
      })
      setMonitorSuccess(true)
      setTimeout(() => setMonitorSuccess(false), 3000)
    } catch (err) {
      console.error('Error creating tracked narrative:', err)
    }
  }

  // Action: Simulate — seed scenario builder
  const handleSimulate = () => {
    const stakeholders = report.research_data?.stakeholder_analysis?.stakeholders || []
    const grouped: Record<string, string[]> = {}
    stakeholders.forEach((s: any) => {
      const type = s.type || 'ecosystem'
      const category = type === 'government' ? 'regulators' : type === 'corporate' ? 'competitors' : type
      if (!grouped[category]) grouped[category] = []
      grouped[category].push(s.name)
    })

    // Build condensed research context for grounded simulation
    const rd = report.research_data
    const researchContext: Record<string, any> = {}
    if (rd?.executive_summary) {
      researchContext.executive_summary = rd.executive_summary.substring(0, 1000)
    }
    if (rd?.situation_assessment) {
      researchContext.situation = {
        current: rd.situation_assessment.current_situation?.substring(0, 500),
        key_developments: rd.situation_assessment.key_developments?.slice(0, 5)?.map((d: any) =>
          typeof d === 'string' ? d : `${d.title || d.headline || ''}: ${d.summary || d.description || d.content || ''}`
        ),
        key_actors: rd.situation_assessment.key_actors?.slice(0, 8)?.map((a: any) =>
          typeof a === 'string' ? a : `${a.name || ''} (${a.role || a.type || ''}): ${a.position || a.stance || a.description || ''}`
        )
      }
    }
    if (rd?.stakeholder_analysis) {
      researchContext.stakeholder_positions = rd.stakeholder_analysis.stakeholders?.slice(0, 10)?.map((s: any) => ({
        name: s.name, type: s.type, position: s.position || s.stance,
        interest: s.interest || s.motivation, influence: s.influence
      }))
      if (rd.stakeholder_analysis.pressure_points) {
        researchContext.pressure_points = rd.stakeholder_analysis.pressure_points.substring(0, 500)
      }
    }
    if (rd?.impact_assessment) {
      researchContext.impact = {
        direct: rd.impact_assessment.direct_impacts?.substring(0, 500),
        second_order: rd.impact_assessment.second_order_effects?.substring(0, 500)
      }
    }
    if (rd?.scenario_analysis?.scenarios) {
      researchContext.existing_scenarios = rd.scenario_analysis.scenarios.slice(0, 3).map((s: any) => ({
        name: s.name || s.title, probability: s.probability || s.likelihood,
        description: (s.description || s.summary || '').substring(0, 200)
      }))
    }

    const scenarioSeed = {
      action: {
        what: report.trigger_event.title,
        rationale: [rd?.executive_summary?.substring(0, 200) || '']
      },
      stakeholder_seed: grouped,
      research_context: researchContext
    }
    sessionStorage.setItem('pa_simulation_seed', JSON.stringify(scenarioSeed))
    router.push('/lp?view=scenario&from=pa')
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back button */}
      <button onClick={onBack} className="flex items-center gap-2 text-[var(--grey-400)] hover:text-white transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back to reports</span>
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)', fontSize: '1.375rem', lineHeight: '1.3' }}>
          {report.title}
        </h1>
        <p className="text-[var(--grey-400)] text-sm">
          {new Date(report.created_at).toLocaleDateString()} | {report.urgency} | {report.trigger_event.source || 'Intelligence Pipeline'}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {isProcessing && (
        <div className="mb-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
          <span className="text-amber-400 text-sm font-medium">
            {STATUS_LABELS[report.status]?.label || 'Processing...'}
          </span>
        </div>
      )}

      {/* Action bar + Export */}
      {hasResearch && (
        <div id="report-top" className="mb-6 space-y-3">
          {/* Action buttons row */}
          {isIntelligenceComplete && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider mr-1" style={{ color: '#71717a' }}>Actions</span>
              <button
                onClick={handleMonitor}
                disabled={monitorSuccess}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-60"
                style={{
                  backgroundColor: monitorSuccess ? 'rgba(34,197,94,0.1)' : 'rgba(59,130,246,0.1)',
                  color: monitorSuccess ? '#4ade80' : '#60a5fa',
                  border: `1px solid ${monitorSuccess ? 'rgba(34,197,94,0.3)' : 'rgba(59,130,246,0.3)'}`
                }}
              >
                {monitorSuccess ? <Check className="w-3.5 h-3.5" /> : <Radar className="w-3.5 h-3.5" />}
                {monitorSuccess ? 'Tracking' : 'Monitor'}
              </button>
              <button
                onClick={handleSimulate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{ backgroundColor: 'rgba(168,85,247,0.1)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.3)' }}
              >
                <Play className="w-3.5 h-3.5" /> Simulate
              </button>
              <button
                onClick={onGenerateBlueprint}
                disabled={generatingBlueprint || hasBlueprint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-60"
                style={{
                  backgroundColor: hasBlueprint ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                  color: hasBlueprint ? '#4ade80' : '#fbbf24',
                  border: `1px solid ${hasBlueprint ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`
                }}
              >
                {generatingBlueprint ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : hasBlueprint ? <Check className="w-3.5 h-3.5" /> : <Lightbulb className="w-3.5 h-3.5" />}
                {hasBlueprint ? 'Strategy Ready' : generatingBlueprint ? 'Generating...' : 'Strategize'}
              </button>
              <button
                onClick={() => {
                  if (report.one_pager_data) {
                    document.getElementById('one-pager-section')?.scrollIntoView({ behavior: 'smooth' })
                  } else {
                    onGenerateOnePager()
                  }
                }}
                disabled={generatingOnePager}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-60"
                style={{
                  backgroundColor: report.one_pager_data ? 'rgba(34,197,94,0.1)' : 'rgba(6,182,212,0.1)',
                  color: report.one_pager_data ? '#4ade80' : '#22d3ee',
                  border: `1px solid ${report.one_pager_data ? 'rgba(34,197,94,0.3)' : 'rgba(6,182,212,0.3)'}`,
                  cursor: report.one_pager_data ? 'pointer' : undefined
                }}
              >
                {generatingOnePager ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : report.one_pager_data ? <Check className="w-3.5 h-3.5" /> : <FileDown className="w-3.5 h-3.5" />}
                {report.one_pager_data ? '1-Pager Ready — View' : generatingOnePager ? 'Generating...' : '1-Pager'}
              </button>
              <button
                onClick={onGeneratePresentation}
                disabled={generatingPresentation}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                style={{ backgroundColor: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)' }}
              >
                {generatingPresentation ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MonitorPlay className="w-3.5 h-3.5" />}
                {generatingPresentation ? 'Generating...' : 'Presentation'}
              </button>
            </div>
          )}
          {/* Export row */}
          <div className="flex items-center gap-2">
            <div className="flex-1" />
            <button
              onClick={() => onExportBrief(report)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)' }}
            >
              <BookOpen className="w-3.5 h-3.5" /> Export Brief
            </button>
            <button
              onClick={() => handleCopyToClipboard(PublicAffairsService.compileFullReport(report))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-[var(--grey-800)] text-[var(--grey-300)] hover:bg-[var(--grey-700)] border border-[var(--grey-700)] transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={() => onDownload(PublicAffairsService.compileFullReport(report), `${safeFilename}.md`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-[var(--grey-800)] text-[var(--grey-300)] hover:bg-[var(--grey-700)] border border-[var(--grey-700)] transition-all"
            >
              <Download className="w-3.5 h-3.5" /> .md
            </button>
            {hasPresentation && (
              <a
                href={report.presentation_url!}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-emerald-600 text-white hover:bg-emerald-700 transition-all"
              >
                <MonitorPlay className="w-3.5 h-3.5" /> View Deck
              </a>
            )}
          </div>
        </div>
      )}

      {/* Trigger Event */}
      <MemoSection title="Trigger Event" icon={AlertTriangle}>
        <p className="leading-relaxed whitespace-pre-wrap" style={{ color: '#d4d4d8', fontSize: '0.9375rem', lineHeight: '1.75' }}>
          {report.trigger_event.content}
        </p>
        {report.trigger_event.url && (
          <a href={report.trigger_event.url} target="_blank" rel="noopener noreferrer" className="text-xs mt-2 inline-block" style={{ color: '#67e8f9' }}>
            Source: {report.trigger_event.source || report.trigger_event.url}
          </a>
        )}
      </MemoSection>

      {/* No research yet */}
      {!hasResearch && !isProcessing && (
        <div className="text-center py-12 text-[var(--grey-500)]">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />
          <p>Intelligence is being generated...</p>
        </div>
      )}

      {/* ===================== NEW FORMAT RENDERING ===================== */}
      {useNew && hasResearch && (
        <>
          {/* Executive Summary */}
          {report.research_data?.executive_summary && (
            <MemoSection title="Executive Summary" icon={FileText}>
              <ProseBlock text={report.research_data.executive_summary} />
            </MemoSection>
          )}

          {/* Situation Assessment */}
          {report.research_data?.situation_assessment && (
            <MemoSection title="Situation Assessment" icon={Eye}>
              <div className="space-y-5">
                {report.research_data.situation_assessment.current_situation && (
                  <div>
                    <SubHeading>Current Situation</SubHeading>
                    <ProseBlock text={report.research_data.situation_assessment.current_situation} />
                  </div>
                )}
                {report.research_data.situation_assessment.historical_context && (
                  <div>
                    <SubHeading>Historical Context</SubHeading>
                    <ProseBlock text={report.research_data.situation_assessment.historical_context} />
                  </div>
                )}
                {report.research_data.situation_assessment.key_developments?.length > 0 && (
                  <div>
                    <SubHeading>Key Developments</SubHeading>
                    <div className="space-y-2">
                      {report.research_data.situation_assessment.key_developments.map((d: any, i: number) => (
                        <div key={i} className="flex gap-3 p-3 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                          <span className="text-xs font-mono shrink-0 mt-0.5" style={{ color: '#a1a1aa' }}>{d.date}</span>
                          <div>
                            <p className="text-sm font-medium" style={{ color: '#e4e4e7' }}>{d.event}</p>
                            <p className="text-sm mt-1" style={{ color: '#a1a1aa' }}>{d.significance}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {report.research_data.situation_assessment.key_actors?.length > 0 && (
                  <div>
                    <SubHeading>Key Actors</SubHeading>
                    <div className="grid gap-2">
                      {report.research_data.situation_assessment.key_actors.map((a: any, i: number) => (
                        <div key={i} className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium" style={{ color: '#e4e4e7' }}>{a.name}</span>
                            <span className="text-xs" style={{ color: '#71717a' }}>{a.role}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ml-auto ${
                              a.influence_level === 'high' ? 'bg-red-500/20 text-red-400' :
                              a.influence_level === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                              'bg-slate-500/20 text-slate-400'
                            }`}>{a.influence_level}</span>
                          </div>
                          <p className="text-xs" style={{ color: '#a1a1aa', lineHeight: '1.5' }}>{a.position}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </MemoSection>
          )}

          {/* Contextual Analysis — adaptive section titles based on event type */}
          {(() => {
            const ctx = report.research_data?.contextual_analysis || report.research_data?.geopolitical_context
            if (!ctx) return null
            const et = report.research_data?.event_type || 'geopolitical'
            const labels: Record<string, { title: string, sub1: string, sub2: string, sub3: string }> = {
              geopolitical: { title: 'Geopolitical Context', sub1: 'Regional Dynamics', sub2: 'International Implications', sub3: 'Power Balance Analysis' },
              corporate: { title: 'Industry & Competitive Analysis', sub1: 'Competitive Landscape', sub2: 'Governance & Talent Implications', sub3: 'Regulatory Exposure' },
              regulatory: { title: 'Regulatory & Policy Analysis', sub1: 'Regulatory Landscape', sub2: 'Industry Response', sub3: 'Political Dynamics' },
              economic: { title: 'Market & Economic Analysis', sub1: 'Market Dynamics', sub2: 'Supply Chain & Trade Implications', sub3: 'Policy Responses' },
            }
            const l = labels[et] || labels.geopolitical
            // Support both old field names (regional_dynamics etc) and new (primary_analysis etc)
            const f1 = ctx.primary_analysis || ctx.regional_dynamics
            const f2 = ctx.secondary_analysis || ctx.international_implications
            const f3 = ctx.power_dynamics || ctx.power_balance_analysis
            return (
              <MemoSection title={l.title} icon={Globe}>
                <div className="space-y-5">
                  {f1 && <div><SubHeading>{l.sub1}</SubHeading><ProseBlock text={f1} /></div>}
                  {f2 && <div><SubHeading>{l.sub2}</SubHeading><ProseBlock text={f2} /></div>}
                  {f3 && <div><SubHeading>{l.sub3}</SubHeading><ProseBlock text={f3} /></div>}
                </div>
              </MemoSection>
            )
          })()}

          {/* Stakeholder Analysis */}
          {report.research_data?.stakeholder_analysis && (
            <MemoSection title="Stakeholder Analysis" icon={Users}>
              <div className="space-y-4">
                {report.research_data.stakeholder_analysis.stakeholders?.map((s: any, i: number) => (
                  <div key={i} className="p-4 rounded-lg border" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.08)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium" style={{ color: '#f4f4f5' }}>{s.name}</h4>
                      <div className="flex items-center gap-2">
                        {s.type && <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(100,116,139,0.2)', color: '#94a3b8' }}>{s.type}</span>}
                        {s.relationship_to_client && (
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            s.relationship_to_client === 'ally' ? 'bg-emerald-500/20 text-emerald-400' :
                            s.relationship_to_client === 'adversary' ? 'bg-red-500/20 text-red-400' :
                            'bg-slate-500/20 text-slate-400'
                          }`}>{s.relationship_to_client}</span>
                        )}
                      </div>
                    </div>
                    {s.position && <p className="text-sm mb-1" style={{ color: '#d4d4d8' }}><span style={{ color: '#71717a', fontSize: '0.75rem', fontWeight: 600 }}>Position:</span> {s.position}</p>}
                    {s.motivations && <p className="text-sm mb-1" style={{ color: '#d4d4d8' }}><span style={{ color: '#71717a', fontSize: '0.75rem', fontWeight: 600 }}>Motivations:</span> {s.motivations}</p>}
                    {s.constraints && <p className="text-sm mb-1" style={{ color: '#d4d4d8' }}><span style={{ color: '#71717a', fontSize: '0.75rem', fontWeight: 600 }}>Constraints:</span> {s.constraints}</p>}
                    {s.likely_moves && <p className="text-sm" style={{ color: '#d4d4d8' }}><span style={{ color: '#71717a', fontSize: '0.75rem', fontWeight: 600 }}>Likely Moves:</span> {s.likely_moves}</p>}
                  </div>
                ))}
                {report.research_data.stakeholder_analysis.alignment_map && (
                  <div>
                    <SubHeading>Alignment Map</SubHeading>
                    <ProseBlock text={report.research_data.stakeholder_analysis.alignment_map} />
                  </div>
                )}
                {report.research_data.stakeholder_analysis.pressure_points && (
                  <div>
                    <SubHeading>Pressure Points</SubHeading>
                    <ProseBlock text={report.research_data.stakeholder_analysis.pressure_points} />
                  </div>
                )}
              </div>
            </MemoSection>
          )}

          {/* Scenario Analysis with likelihood bars */}
          {report.research_data?.scenario_analysis && (
            <MemoSection title="Scenario Analysis" icon={TrendingUp}>
              <div className="grid gap-4 md:grid-cols-3">
                {report.research_data.scenario_analysis.scenarios?.map((s: any, i: number) => {
                  const likelihood = parseInt(s.likelihood) || 0
                  const barColor = i === 0 ? '#22c55e' : i === 1 ? '#f59e0b' : '#ef4444'
                  const borderColor = i === 0 ? 'rgba(34,197,94,0.3)' : i === 1 ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'
                  const bgColor = i === 0 ? 'rgba(34,197,94,0.05)' : i === 1 ? 'rgba(245,158,11,0.05)' : 'rgba(239,68,68,0.05)'

                  return (
                    <div key={i} className="rounded-lg p-4 border" style={{ borderColor, backgroundColor: bgColor }}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold" style={{ color: '#f4f4f5' }}>{s.name}</h4>
                        <span className="text-lg font-bold font-mono" style={{ color: barColor }}>{s.likelihood}</span>
                      </div>
                      {/* Likelihood bar */}
                      <div className="w-full h-2 rounded-full mb-3" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${likelihood}%`, backgroundColor: barColor }} />
                      </div>
                      <p className="text-sm leading-relaxed mb-3" style={{ color: '#a1a1aa' }}>
                        {typeof s.narrative === 'string' ? s.narrative.substring(0, 300) + (s.narrative.length > 300 ? '...' : '') : ''}
                      </p>
                      {s.key_drivers && (
                        <p className="text-xs" style={{ color: '#71717a' }}>
                          <span style={{ fontWeight: 600 }}>Drivers:</span> {Array.isArray(s.key_drivers) ? s.key_drivers.join(', ').substring(0, 150) : typeof s.key_drivers === 'string' ? s.key_drivers.substring(0, 150) : ''}
                        </p>
                      )}
                      {s.leading_indicators && Array.isArray(s.leading_indicators) && (
                        <div className="mt-2">
                          <span className="text-xs font-semibold" style={{ color: '#71717a' }}>Watch for:</span>
                          <ul className="mt-1">
                            {s.leading_indicators.slice(0, 3).map((ind: string, j: number) => (
                              <li key={j} className="text-xs" style={{ color: '#a1a1aa' }}>- {ind}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              {/* Expanded scenario narratives */}
              <div className="mt-6 space-y-4">
                {report.research_data.scenario_analysis.scenarios?.map((s: any, i: number) => (
                  s.narrative && s.narrative.length > 300 ? (
                    <details key={`detail-${i}`} className="group">
                      <summary className="cursor-pointer text-sm font-medium py-2" style={{ color: '#d4d4d8' }}>
                        Full narrative: {s.name}
                      </summary>
                      <div className="pl-4 pb-2">
                        <ProseBlock text={s.narrative} />
                        {s.timeline && <p className="text-sm mt-2" style={{ color: '#a1a1aa' }}><span style={{ fontWeight: 600, color: '#71717a' }}>Timeline:</span> {s.timeline}</p>}
                        {s.client_impact && <p className="text-sm mt-1" style={{ color: '#a1a1aa' }}><span style={{ fontWeight: 600, color: '#71717a' }}>Client Impact:</span> {s.client_impact}</p>}
                      </div>
                    </details>
                  ) : null
                ))}
              </div>
              {report.research_data.scenario_analysis.key_variables && (
                <div className="mt-4">
                  <SubHeading>Key Variables</SubHeading>
                  <ProseBlock text={report.research_data.scenario_analysis.key_variables} />
                </div>
              )}
              {report.research_data.scenario_analysis.wildcards && (
                <div className="mt-4">
                  <SubHeading>Wildcards</SubHeading>
                  <ProseBlock text={report.research_data.scenario_analysis.wildcards} />
                </div>
              )}
            </MemoSection>
          )}

          {/* Impact Assessment */}
          {report.research_data?.impact_assessment && (
            <MemoSection title="Impact Assessment" icon={Target}>
              <div className="space-y-5">
                {report.research_data.impact_assessment.direct_impacts && (
                  <div>
                    <SubHeading>Direct Impacts</SubHeading>
                    <ProseBlock text={report.research_data.impact_assessment.direct_impacts} />
                  </div>
                )}
                {report.research_data.impact_assessment.second_order_effects && (
                  <div>
                    <SubHeading>Second-Order Effects</SubHeading>
                    <ProseBlock text={report.research_data.impact_assessment.second_order_effects} />
                  </div>
                )}
                {report.research_data.impact_assessment.timeline_of_effects && (
                  <div>
                    <SubHeading>Timeline of Effects</SubHeading>
                    <ProseBlock text={report.research_data.impact_assessment.timeline_of_effects} />
                  </div>
                )}
                {report.research_data.impact_assessment.risk_matrix?.length > 0 && (
                  <div>
                    <SubHeading>Risk Matrix</SubHeading>
                    <div className="space-y-2">
                      {report.research_data.impact_assessment.risk_matrix.map((r: any, i: number) => {
                        const severityStyle = r.severity === 'critical'
                          ? { badge: 'bg-red-500/20 text-red-400', border: '#ef4444' }
                          : r.severity === 'high'
                          ? { badge: 'bg-orange-500/20 text-orange-400', border: '#f97316' }
                          : r.severity === 'medium'
                          ? { badge: 'bg-yellow-500/20 text-yellow-400', border: '#eab308' }
                          : { badge: 'bg-slate-500/20 text-slate-400', border: '#64748b' }
                        return (
                        <div key={i} className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderLeft: `3px solid ${severityStyle.border}` }}>
                          <div className="flex items-center gap-3 mb-1">
                            <span className={`text-xs px-2 py-0.5 rounded font-semibold ${severityStyle.badge}`}>{r.severity}</span>
                            <span className="text-xs ml-auto" style={{ color: '#71717a' }}>Likelihood: {r.likelihood}</span>
                          </div>
                          <p className="text-sm mb-1" style={{ color: '#e4e4e7' }}>{r.risk}</p>
                          <p className="text-xs" style={{ color: '#a1a1aa' }}>{r.mitigation}</p>
                        </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </MemoSection>
          )}

          {/* Sources & Confidence */}
          {report.research_data?.sources_and_confidence && (
            <MemoSection title="Sources & Confidence" icon={BarChart3}>
              <div className="space-y-4">
                {report.research_data.sources_and_confidence.confidence_level && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold uppercase" style={{ color: '#71717a' }}>Confidence:</span>
                    <span className={`text-sm font-bold px-3 py-1 rounded ${
                      report.research_data.sources_and_confidence.confidence_level === 'high' ? 'bg-emerald-500/20 text-emerald-400' :
                      report.research_data.sources_and_confidence.confidence_level === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>{report.research_data.sources_and_confidence.confidence_level.toUpperCase()}</span>
                  </div>
                )}
                {report.research_data.sources_and_confidence.confidence_justification && (
                  <ProseBlock text={report.research_data.sources_and_confidence.confidence_justification} />
                )}
                {report.research_data.sources_and_confidence.intelligence_gaps?.length > 0 && (
                  <div>
                    <SubHeading>Intelligence Gaps</SubHeading>
                    <ul className="space-y-1">
                      {report.research_data.sources_and_confidence.intelligence_gaps.map((g: string, i: number) => (
                        <li key={i} className="text-sm" style={{ color: '#a1a1aa' }}>- {g}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {report.research_data.sources_and_confidence.collection_priorities?.length > 0 && (
                  <div>
                    <SubHeading>Collection Priorities</SubHeading>
                    <ul className="space-y-1">
                      {report.research_data.sources_and_confidence.collection_priorities.map((p: string, i: number) => (
                        <li key={i} className="text-sm" style={{ color: '#a1a1aa' }}>- {p}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </MemoSection>
          )}

          {/* Actions are now in the top action bar */}

          {/* One-Pager (shown after 1-Pager action) */}
          {report.one_pager_data && (
            <div id="one-pager-section">
              <OnePagerSection data={report.one_pager_data} title={report.title} />
            </div>
          )}

          {/* Blueprint sections (shown after Strategize action) */}
          {report.blueprint_data?.recommendations && (
            <MemoSection title="Strategic Recommendations" icon={Sparkles}>
              <RecommendationsContent data={report.blueprint_data.recommendations} />
            </MemoSection>
          )}

          {report.blueprint_data?.monitoring_framework && (
            <MemoSection title="Monitoring Framework" icon={Map}>
              <ResearchContent data={report.blueprint_data.monitoring_framework} />
            </MemoSection>
          )}
        </>
      )}

      {/* ===================== LEGACY FORMAT RENDERING ===================== */}
      {!useNew && hasResearch && (
        <>
          {report.blueprint_data?.executive_summary && (
            <MemoSection title="Executive Summary" icon={FileText}>
              <ProseBlock text={report.blueprint_data.executive_summary} />
            </MemoSection>
          )}

          {report.research_data?.situation_assessment && (
            <MemoSection title="Situation Assessment" icon={Eye}>
              <ResearchContent data={report.research_data.situation_assessment} />
            </MemoSection>
          )}

          {report.research_data?.stakeholder_map && (
            <MemoSection title="Stakeholder Map" icon={Users}>
              <StakeholderContent data={report.research_data.stakeholder_map} />
            </MemoSection>
          )}

          {report.research_data?.impact_analysis && (
            <MemoSection title="Impact Analysis" icon={Target}>
              <ResearchContent data={report.research_data.impact_analysis} />
            </MemoSection>
          )}

          {report.research_data?.sources_confidence && (
            <MemoSection title="Sources & Confidence" icon={BarChart3}>
              <ResearchContent data={report.research_data.sources_confidence} />
            </MemoSection>
          )}

          {/* Actions are now in the top action bar */}

          {/* One-Pager (legacy format) */}
          {report.one_pager_data && (
            <OnePagerSection data={report.one_pager_data} title={report.title} />
          )}

          {report.blueprint_data?.scenario_tree && (
            <MemoSection title="Scenario Tree" icon={TrendingUp}>
              <ScenarioContent data={report.blueprint_data.scenario_tree} />
            </MemoSection>
          )}

          {report.blueprint_data?.recommendations && (
            <MemoSection title="Recommendations" icon={Target}>
              <RecommendationsContent data={report.blueprint_data.recommendations} />
            </MemoSection>
          )}

          {report.blueprint_data?.monitoring_framework && (
            <MemoSection title="Monitoring Framework" icon={Map}>
              <ResearchContent data={report.blueprint_data.monitoring_framework} />
            </MemoSection>
          )}
        </>
      )}

      {/* Back to top */}
      {hasResearch && (
        <div className="flex justify-center mt-10 mb-4">
          <button
            onClick={() => document.getElementById('report-top')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#71717a', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <ArrowUp className="w-3.5 h-3.5" /> Back to top
          </button>
        </div>
      )}
    </div>
  )
}

// =================== SHARED COMPONENTS ===================

function ProseBlock({ text }: { text: string }) {
  // Convert **bold** markdown to <strong> and split paragraphs
  const paragraphs = text.split(/\n\n+/)
  return (
    <div className="space-y-3" style={{ color: '#d4d4d8', fontSize: '0.9375rem', lineHeight: '1.8' }}>
      {paragraphs.map((p, i) => (
        <p key={i} dangerouslySetInnerHTML={{
          __html: p.trim()
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#f4f4f5">$1</strong>')
            .replace(/\n/g, '<br />')
        }} />
      ))}
    </div>
  )
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-xs uppercase tracking-wider mb-2 font-semibold" style={{ color: '#a1a1aa', fontFamily: 'var(--font-display)' }}>
      {children}
    </h4>
  )
}

function MemoSection({ title, icon: Icon, children }: {
  title: string
  icon: any
  children: React.ReactNode
}) {
  return (
    <div className="mb-8 bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <Icon className="w-4 h-4" style={{ color: '#71717a' }} />
        <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#f4f4f5', fontFamily: 'var(--font-display)' }}>
          {title}
        </h3>
      </div>
      <div className="px-6 py-5">
        {children}
      </div>
    </div>
  )
}

// Generic research content renderer
function ResearchContent({ data }: { data: any }) {
  if (typeof data === 'string') {
    return <ProseBlock text={data} />
  }

  return (
    <div className="space-y-4">
      {Object.entries(data).map(([key, value]) => {
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

        if (typeof value === 'string') {
          return (
            <div key={key}>
              <SubHeading>{label}</SubHeading>
              <ProseBlock text={value} />
            </div>
          )
        }

        if (Array.isArray(value)) {
          return (
            <div key={key}>
              <SubHeading>{label}</SubHeading>
              <ul className="space-y-1">
                {value.map((item, i) => (
                  <li key={i} className="text-sm" style={{ color: '#d4d4d8' }}>
                    {typeof item === 'string' ? `- ${item}` : (
                      <div className="p-3 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                        {Object.entries(item).map(([k, v]) => (
                          <div key={k}>
                            <span className="text-xs font-semibold" style={{ color: '#71717a' }}>{k.replace(/_/g, ' ')}:</span>{' '}
                            <span className="text-sm" style={{ color: '#d4d4d8' }}>{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )
        }

        if (typeof value === 'object' && value !== null) {
          return (
            <div key={key}>
              <SubHeading>{label}</SubHeading>
              <ResearchContent data={value} />
            </div>
          )
        }

        return null
      })}
    </div>
  )
}

// Stakeholder renderer (legacy)
function StakeholderContent({ data }: { data: any }) {
  const stakeholders = data.stakeholders || (Array.isArray(data) ? data : [])

  if (stakeholders.length === 0) {
    return <ResearchContent data={data} />
  }

  return (
    <div className="space-y-4">
      {data.summary && <ProseBlock text={data.summary} />}
      <div className="grid gap-3">
        {stakeholders.map((s: any, i: number) => (
          <div key={i} className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium" style={{ color: '#f4f4f5' }}>{s.name || s.entity}</h4>
              {s.relationship && (
                <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(100,116,139,0.2)', color: '#94a3b8' }}>
                  {s.relationship}
                </span>
              )}
            </div>
            {s.position && <p className="text-sm mb-1" style={{ color: '#d4d4d8' }}><span style={{ color: '#71717a', fontSize: '0.75rem', fontWeight: 600 }}>Position:</span> {s.position}</p>}
            {s.incentive && <p className="text-sm mb-1" style={{ color: '#d4d4d8' }}><span style={{ color: '#71717a', fontSize: '0.75rem', fontWeight: 600 }}>Incentive:</span> {s.incentive}</p>}
            {s.constraints && <p className="text-sm mb-1" style={{ color: '#d4d4d8' }}><span style={{ color: '#71717a', fontSize: '0.75rem', fontWeight: 600 }}>Constraints:</span> {s.constraints}</p>}
            {s.likely_next_move && <p className="text-sm" style={{ color: '#d4d4d8' }}><span style={{ color: '#71717a', fontSize: '0.75rem', fontWeight: 600 }}>Likely Next Move:</span> {s.likely_next_move}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

// Scenario tree renderer (legacy)
function ScenarioContent({ data }: { data: any }) {
  const scenarios = data.scenarios || [data.base_case, data.upside, data.downside, data.black_swan].filter(Boolean)

  if (scenarios.length === 0) {
    return <ResearchContent data={data} />
  }

  return (
    <div className="space-y-4">
      {scenarios.map((s: any, i: number) => {
        const borderColor = i === 0 ? 'rgba(59,130,246,0.3)' : i === 1 ? 'rgba(34,197,94,0.3)' : i === 2 ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'
        const bgColor = i === 0 ? 'rgba(59,130,246,0.05)' : i === 1 ? 'rgba(34,197,94,0.05)' : i === 2 ? 'rgba(245,158,11,0.05)' : 'rgba(239,68,68,0.05)'

        return (
          <div key={i} className="rounded-lg p-4 border" style={{ borderColor, backgroundColor: bgColor }}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium" style={{ color: '#f4f4f5' }}>
                {s.name || s.label || `Scenario ${i + 1}`}
              </h4>
              {s.probability && <span className="text-xs font-mono" style={{ color: '#a1a1aa' }}>{s.probability}</span>}
            </div>
            {s.narrative && <p className="text-sm mb-2" style={{ color: '#d4d4d8' }}>{s.narrative}</p>}
            {s.key_driver && <p className="text-sm" style={{ color: '#a1a1aa' }}><span style={{ fontWeight: 600, color: '#71717a', fontSize: '0.75rem' }}>Key Driver:</span> {s.key_driver}</p>}
            {s.client_impact && <p className="text-sm" style={{ color: '#a1a1aa' }}><span style={{ fontWeight: 600, color: '#71717a', fontSize: '0.75rem' }}>Impact:</span> {s.client_impact}</p>}
          </div>
        )
      })}
    </div>
  )
}

// Recommendations renderer
function RecommendationsContent({ data }: { data: any }) {
  if (typeof data === 'string') {
    return <ProseBlock text={data} />
  }

  const timeframes = [
    { key: 'immediate', label: 'Immediate (This Week)', borderColor: 'rgba(239,68,68,0.3)' },
    { key: 'short_term', label: 'Short-Term (30 Days)', borderColor: 'rgba(245,158,11,0.3)' },
    { key: 'medium_term', label: 'Medium-Term (90 Days)', borderColor: 'rgba(59,130,246,0.3)' }
  ]

  return (
    <div className="space-y-4">
      {timeframes.map(({ key, label, borderColor }) => {
        const items = data[key]
        if (!items) return null

        return (
          <div key={key} className="rounded-lg p-4 border" style={{ borderColor, backgroundColor: 'rgba(255,255,255,0.02)' }}>
            <h4 className="text-sm font-medium mb-2" style={{ color: '#f4f4f5' }}>{label}</h4>
            {Array.isArray(items) ? (
              <ul className="space-y-1.5">
                {items.map((item: string, i: number) => (
                  <li key={i} className="text-sm flex items-start gap-2" style={{ color: '#d4d4d8' }}>
                    <span style={{ color: '#71717a' }}>-</span>
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <ProseBlock text={items} />
            )}
          </div>
        )
      })}

      {data.decision_matrix && (
        <div className="rounded-lg p-4 border" style={{ borderColor: 'rgba(168,85,247,0.3)', backgroundColor: 'rgba(168,85,247,0.05)' }}>
          <h4 className="text-sm font-medium mb-2" style={{ color: '#f4f4f5' }}>Decision Matrix</h4>
          {Array.isArray(data.decision_matrix) ? (
            <div className="space-y-2">
              {data.decision_matrix.map((d: any, i: number) => (
                <div key={i} className="text-sm">
                  <span style={{ color: '#71717a' }}>If</span>{' '}
                  <span style={{ color: '#fbbf24' }}>{d.condition || d.if}</span>{' '}
                  <span style={{ color: '#71717a' }}>then</span>{' '}
                  <span style={{ color: '#4ade80' }}>{d.action || d.then}</span>
                </div>
              ))}
            </div>
          ) : (
            <ProseBlock text={typeof data.decision_matrix === 'string' ? data.decision_matrix : JSON.stringify(data.decision_matrix, null, 2)} />
          )}
        </div>
      )}
    </div>
  )
}

// One-Pager Section — condensed executive summary card
function OnePagerSection({ data, title }: { data: any; title: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    let text = `${data.headline}\n\n`
    text += `BOTTOM LINE: ${data.bottom_line}\n\n`
    if (data.key_facts?.length) {
      text += `KEY FACTS:\n${data.key_facts.map((f: string) => `• ${f}`).join('\n')}\n\n`
    }
    if (data.stakeholder_snapshot?.length) {
      text += `STAKEHOLDERS:\n${data.stakeholder_snapshot.map((s: any) => `• ${s.name}: ${s.position}`).join('\n')}\n\n`
    }
    if (data.scenarios?.length) {
      text += `SCENARIOS:\n${data.scenarios.map((s: any) => `• ${s.label} (${s.probability}): ${s.description}`).join('\n')}\n\n`
    }
    if (data.recommended_actions?.length) {
      text += `RECOMMENDED ACTIONS:\n${data.recommended_actions.map((a: string) => `• ${a}`).join('\n')}\n\n`
    }
    if (data.watch_indicators?.length) {
      text += `WATCH INDICATORS:\n${data.watch_indicators.map((w: string) => `• ${w}`).join('\n')}\n`
    }
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mb-8 bg-[var(--grey-900)] border border-cyan-500/20 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b" style={{ borderColor: 'rgba(6,182,212,0.15)' }}>
        <div className="flex items-center gap-2">
          <FileDown className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#f4f4f5', fontFamily: 'var(--font-display)' }}>
            Executive One-Pager
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(6,182,212,0.15)', color: '#22d3ee' }}>
            {data.confidence_level} Confidence
          </span>
          <button
            onClick={() => {
              const html = PublicAffairsService.compileOnePagerHtml(data, title)
              const blob = new Blob([html], { type: 'text/html' })
              const url = URL.createObjectURL(blob)
              window.open(url, '_blank')
              setTimeout(() => URL.revokeObjectURL(url), 5000)
            }}
            className="text-xs flex items-center gap-1 px-2 py-1 rounded hover:bg-[var(--grey-800)] transition-colors"
            style={{ color: '#22d3ee' }}
          >
            <BookOpen className="w-3 h-3" /> Export
          </button>
          <button
            onClick={handleCopy}
            className="text-xs flex items-center gap-1 px-2 py-1 rounded hover:bg-[var(--grey-800)] transition-colors"
            style={{ color: copied ? '#4ade80' : '#a1a1aa' }}
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* Headline */}
        <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
          {data.headline}
        </h2>

        {/* Bottom Line */}
        <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(6,182,212,0.08)', borderLeft: '3px solid #22d3ee' }}>
          <p className="text-xs uppercase tracking-wider mb-1 font-semibold" style={{ color: '#22d3ee' }}>Bottom Line</p>
          <p className="text-sm leading-relaxed" style={{ color: '#e4e4e7' }}>{data.bottom_line}</p>
        </div>

        {/* Key Facts + Stakeholders — 2 column */}
        <div className="grid grid-cols-2 gap-5">
          {/* Key Facts */}
          {data.key_facts?.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider mb-2 font-semibold" style={{ color: '#a1a1aa' }}>Key Facts</p>
              <div className="space-y-2">
                {data.key_facts.map((fact: string, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                    <p className="text-sm" style={{ color: '#d4d4d8' }}>{fact}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stakeholder Snapshot */}
          {data.stakeholder_snapshot?.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider mb-2 font-semibold" style={{ color: '#a1a1aa' }}>Stakeholder Snapshot</p>
              <div className="space-y-2">
                {data.stakeholder_snapshot.map((s: any, i: number) => (
                  <div key={i} className="p-2.5 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                    <p className="text-sm font-medium text-white">{s.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#a1a1aa' }}>{s.position}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Scenarios */}
        {data.scenarios?.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-wider mb-2 font-semibold" style={{ color: '#a1a1aa' }}>Scenarios</p>
            <div className="grid grid-cols-3 gap-3">
              {data.scenarios.map((s: any, i: number) => {
                const colors = [
                  { bg: 'rgba(6,182,212,0.08)', border: 'rgba(6,182,212,0.3)', label: '#22d3ee' },
                  { bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.3)', label: '#4ade80' },
                  { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.3)', label: '#f87171' },
                ]
                const c = colors[i] || colors[0]
                return (
                  <div key={i} className="p-3 rounded-lg border" style={{ backgroundColor: c.bg, borderColor: c.border }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold" style={{ color: c.label }}>{s.label}</span>
                      <span className="text-xs font-mono" style={{ color: '#71717a' }}>{s.probability}</span>
                    </div>
                    <p className="text-xs" style={{ color: '#d4d4d8' }}>{s.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Actions + Watch Indicators — 2 column */}
        <div className="grid grid-cols-2 gap-5">
          {data.recommended_actions?.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider mb-2 font-semibold" style={{ color: '#a1a1aa' }}>Recommended Actions</p>
              <div className="space-y-1.5">
                {data.recommended_actions.map((action: string, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-xs mt-0.5" style={{ color: '#22d3ee' }}>{i + 1}.</span>
                    <p className="text-sm" style={{ color: '#d4d4d8' }}>{action}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.watch_indicators?.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider mb-2 font-semibold" style={{ color: '#a1a1aa' }}>Watch Indicators</p>
              <div className="space-y-1.5">
                {data.watch_indicators.map((indicator: string, i: number) => (
                  <div key={i} className="flex items-start gap-2">
                    <Eye className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: '#fbbf24' }} />
                    <p className="text-sm" style={{ color: '#d4d4d8' }}>{indicator}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
