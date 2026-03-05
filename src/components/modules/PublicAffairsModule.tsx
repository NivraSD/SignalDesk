'use client'

import React, { useState, useEffect } from 'react'
import {
  Shield, Clock, ChevronRight, Loader2, Sparkles, FileText,
  MonitorPlay, ArrowLeft, AlertTriangle, Users, Target,
  TrendingUp, Eye, Map, BarChart3, Download, Trash2, Copy, Check
} from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase/client'
import { useAppStore } from '@/stores/useAppStore'
import { PublicAffairsService, type PublicAffairsReport } from '@/lib/services/publicAffairsService'

const URGENCY_COLORS = {
  flash: 'bg-red-500/20 text-red-400 border-red-500/30',
  standard: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  deep_dive: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  research_pending: { label: 'Pending', color: 'text-[var(--grey-500)]' },
  research_in_progress: { label: 'Researching...', color: 'text-amber-400' },
  research_complete: { label: 'Research Complete', color: 'text-blue-400' },
  blueprint_in_progress: { label: 'Generating Blueprint...', color: 'text-amber-400' },
  blueprint_complete: { label: 'Blueprint Ready', color: 'text-emerald-400' },
  presentation_in_progress: { label: 'Generating Deck...', color: 'text-amber-400' },
  complete: { label: 'Complete', color: 'text-emerald-400' },
  failed: { label: 'Failed', color: 'text-red-400' }
}

export default function PublicAffairsModule() {
  const { organization } = useAppStore()
  const [reports, setReports] = useState<PublicAffairsReport[]>([])
  const [selectedReport, setSelectedReport] = useState<PublicAffairsReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [generatingBlueprint, setGeneratingBlueprint] = useState(false)
  const [generatingPresentation, setGeneratingPresentation] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (organization?.id) {
      fetchReports()

      // Real-time subscription
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
          (payload) => {
            console.log('Public Affairs realtime update:', payload.eventType)
            fetchReports()
          }
        )
        .subscribe()

      // Poll every 4s as fallback while any report is processing
      const pollInterval = setInterval(() => {
        fetchReports()
      }, 4000)

      return () => {
        supabase.removeChannel(channel)
        clearInterval(pollInterval)
      }
    }
  }, [organization?.id])

  // Auto-refresh selected report when reports list updates
  useEffect(() => {
    if (selectedReport) {
      const updated = reports.find(r => r.id === selectedReport.id)
      if (updated && updated.status !== selectedReport.status) {
        console.log(`📋 Report status changed: ${selectedReport.status} → ${updated.status}`)
        setSelectedReport(updated)
      } else if (updated && JSON.stringify(updated.research_data) !== JSON.stringify(selectedReport.research_data)) {
        console.log('📋 Report research data updated')
        setSelectedReport(updated)
      } else if (updated && JSON.stringify(updated.blueprint_data) !== JSON.stringify(selectedReport.blueprint_data)) {
        console.log('📋 Report blueprint data updated')
        setSelectedReport(updated)
      }
    }
  }, [reports])

  const fetchReports = async () => {
    if (!organization?.id) return
    try {
      const data = await PublicAffairsService.getReports(organization.id)
      setReports(data)
      // Only set loading false on first load
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
      console.error('Blueprint generation error:', err)
      setError(err.message || 'Failed to generate blueprint')
    } finally {
      setGeneratingBlueprint(false)
    }
  }

  const handleGeneratePresentation = async () => {
    if (!selectedReport || !organization) return
    setGeneratingPresentation(true)
    setError(null)

    try {
      const result = await PublicAffairsService.generatePresentation(
        selectedReport.id,
        organization.id
      )
      console.log('Presentation result:', result)
      await fetchReports()
    } catch (err: any) {
      console.error('Presentation generation error:', err)
      setError(err.message || 'Failed to generate presentation')
    } finally {
      setGeneratingPresentation(false)
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

  const handleDeleteReport = async (reportId: string) => {
    try {
      await PublicAffairsService.deleteReport(reportId)
      if (selectedReport?.id === reportId) setSelectedReport(null)
      await fetchReports()
    } catch (err) {
      console.error('Error deleting report:', err)
    }
  }

  // Detail view
  if (selectedReport) {
    return (
      <div className="flex-1 overflow-y-auto p-8">
        <ReportDetailView
          report={selectedReport}
          organizationId={organization?.id || ''}
          onBack={() => setSelectedReport(null)}
          onGenerateBlueprint={handleGenerateBlueprint}
          onGeneratePresentation={handleGeneratePresentation}
          onDownload={handleDownload}
          generatingBlueprint={generatingBlueprint}
          generatingPresentation={generatingPresentation}
          error={error}
        />
      </div>
    )
  }

  // List view
  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
              Public Affairs Intelligence
            </h1>
            <p className="text-[var(--grey-400)] text-sm mt-1">
              Strategic intelligence reports generated from news developments
            </p>
          </div>
          <div className="text-sm text-[var(--grey-500)]">
            {reports.length} report{reports.length !== 1 ? 's' : ''}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--grey-500)]" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-20">
            <Shield className="w-12 h-12 mx-auto mb-4 text-[var(--grey-600)]" />
            <p className="text-[var(--grey-400)] mb-2">No public affairs reports yet</p>
            <p className="text-[var(--grey-500)] text-sm">
              Generate reports from news developments in your Intelligence Brief
            </p>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  )
}

// Report Card Component
function ReportCard({
  report,
  onClick,
  onDelete
}: {
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
              <span className="text-[var(--grey-500)]">
                {report.trigger_event.source}
              </span>
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
  onDownload,
  generatingBlueprint,
  generatingPresentation,
  error
}: {
  report: PublicAffairsReport
  organizationId: string
  onBack: () => void
  onGenerateBlueprint: () => void
  onGeneratePresentation: () => void
  onDownload: (content: string, filename: string) => void
  generatingBlueprint: boolean
  generatingPresentation: boolean
  error: string | null
}) {
  const [copied, setCopied] = useState(false)
  const hasResearch = !!report.research_data
  const hasBlueprint = !!report.blueprint_data
  const hasPresentation = !!report.presentation_url
  const isProcessing = report.status.includes('in_progress')

  const safeFilename = report.title.replace(/[^a-zA-Z0-9\s-]/g, '').trim()

  const handleCopyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back button + header */}
      <button onClick={onBack} className="flex items-center gap-2 text-[var(--grey-400)] hover:text-white transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back to reports</span>
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            {report.title}
          </h1>
          <p className="text-[var(--grey-400)] text-sm">
            {new Date(report.created_at).toLocaleDateString()} | {report.urgency} | {report.trigger_event.source || 'Intelligence Pipeline'}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Processing indicator */}
      {isProcessing && (
        <div className="mb-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
          <span className="text-amber-400 text-sm font-medium">
            {STATUS_LABELS[report.status]?.label || 'Processing...'}
          </span>
        </div>
      )}

      {/* Action Buttons Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        {/* Generate Blueprint */}
        {hasResearch && !hasBlueprint && (
          <button
            onClick={onGenerateBlueprint}
            disabled={generatingBlueprint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            {generatingBlueprint ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating Blueprint...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Generate Blueprint</>
            )}
          </button>
        )}

        {/* Generate Presentation */}
        {hasResearch && (
          <button
            onClick={onGeneratePresentation}
            disabled={generatingPresentation}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 ${
              hasBlueprint
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-[var(--grey-800)] text-[var(--grey-300)] hover:bg-[var(--grey-700)] border border-[var(--grey-700)]'
            }`}
          >
            {generatingPresentation ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating Presentation...</>
            ) : (
              <><MonitorPlay className="w-4 h-4" /> Generate Presentation</>
            )}
          </button>
        )}

        {/* View Presentation */}
        {hasPresentation && (
          <a
            href={report.presentation_url!}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-all"
          >
            <MonitorPlay className="w-4 h-4" /> View Presentation
          </a>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Export buttons */}
        {hasResearch && (
          <>
            <button
              onClick={() => handleCopyToClipboard(PublicAffairsService.compileFullReport(report))}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-[var(--grey-800)] text-[var(--grey-300)] hover:bg-[var(--grey-700)] border border-[var(--grey-700)] transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={() => onDownload(PublicAffairsService.compileFullReport(report), `${safeFilename}.md`)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-[var(--grey-800)] text-[var(--grey-300)] hover:bg-[var(--grey-700)] border border-[var(--grey-700)] transition-all"
            >
              <Download className="w-4 h-4" />
              Download .md
            </button>
          </>
        )}
      </div>

      {/* Trigger Event */}
      <Section title="Trigger Event" icon={AlertTriangle}>
        <p className="text-[var(--grey-200)] text-sm leading-relaxed">
          {report.trigger_event.content}
        </p>
        {report.trigger_event.url && (
          <a href={report.trigger_event.url} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:text-cyan-300 mt-2 inline-block">
            Source: {report.trigger_event.source || report.trigger_event.url}
          </a>
        )}
      </Section>

      {/* Research Sections */}
      {!hasResearch && !isProcessing && (
        <div className="text-center py-12 text-[var(--grey-500)]">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />
          <p>Research is being generated...</p>
        </div>
      )}

      {report.research_data?.situation_assessment && (
        <Section title="Situation Assessment" icon={Eye}>
          <ResearchContent data={report.research_data.situation_assessment} />
        </Section>
      )}

      {report.research_data?.stakeholder_map && (
        <Section title="Stakeholder Map" icon={Users}>
          <StakeholderContent data={report.research_data.stakeholder_map} />
        </Section>
      )}

      {report.research_data?.impact_analysis && (
        <Section title="Impact Analysis" icon={Target}>
          <ResearchContent data={report.research_data.impact_analysis} />
        </Section>
      )}

      {report.research_data?.sources_confidence && (
        <Section title="Sources & Confidence" icon={BarChart3}>
          <ResearchContent data={report.research_data.sources_confidence} />
        </Section>
      )}

      {/* Blueprint Sections */}
      {report.blueprint_data?.executive_summary && (
        <Section title="Executive Summary" icon={FileText}>
          <p className="text-[var(--grey-200)] leading-relaxed whitespace-pre-wrap" style={{ fontFamily: 'var(--font-serif)' }}>
            {report.blueprint_data.executive_summary}
          </p>
        </Section>
      )}

      {report.blueprint_data?.scenario_tree && (
        <Section title="Scenario Tree" icon={TrendingUp}>
          <ScenarioContent data={report.blueprint_data.scenario_tree} />
        </Section>
      )}

      {report.blueprint_data?.recommendations && (
        <Section title="Recommendations" icon={Target}>
          <RecommendationsContent data={report.blueprint_data.recommendations} />
        </Section>
      )}

      {report.blueprint_data?.monitoring_framework && (
        <Section title="Monitoring Framework" icon={Map}>
          <ResearchContent data={report.blueprint_data.monitoring_framework} />
        </Section>
      )}
    </div>
  )
}

// Reusable Section wrapper
function Section({ title, icon: Icon, children }: {
  title: string
  icon: any
  children: React.ReactNode
}) {
  return (
    <div className="mb-6 bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-[var(--grey-800)]">
        <Icon className="w-4 h-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)' }}>
          {title}
        </h3>
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  )
}

// Generic research content renderer — FIX: subheadings now white
function ResearchContent({ data }: { data: any }) {
  if (typeof data === 'string') {
    return <p className="text-[var(--grey-200)] text-sm leading-relaxed whitespace-pre-wrap">{data}</p>
  }

  return (
    <div className="space-y-4">
      {Object.entries(data).map(([key, value]) => {
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

        if (typeof value === 'string') {
          return (
            <div key={key}>
              <h4 className="text-sm uppercase tracking-wider text-[var(--grey-200)] mb-2 font-semibold" style={{ fontFamily: 'var(--font-display)' }}>{label}</h4>
              <p className="text-[var(--grey-200)] text-sm leading-relaxed whitespace-pre-wrap">{value}</p>
            </div>
          )
        }

        if (Array.isArray(value)) {
          return (
            <div key={key}>
              <h4 className="text-sm uppercase tracking-wider text-[var(--grey-200)] mb-2 font-semibold" style={{ fontFamily: 'var(--font-display)' }}>{label}</h4>
              <ul className="space-y-1">
                {value.map((item, i) => (
                  <li key={i} className="text-[var(--grey-200)] text-sm">
                    {typeof item === 'string' ? `- ${item}` : (
                      <div className="bg-[var(--grey-800)] rounded p-3">
                        {Object.entries(item).map(([k, v]) => (
                          <div key={k}>
                            <span className="text-[var(--grey-300)] text-xs font-semibold">{k.replace(/_/g, ' ')}:</span>{' '}
                            <span className="text-[var(--grey-200)] text-sm">{String(v)}</span>
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
              <h4 className="text-sm uppercase tracking-wider text-[var(--grey-200)] mb-2 font-semibold" style={{ fontFamily: 'var(--font-display)' }}>{label}</h4>
              <ResearchContent data={value} />
            </div>
          )
        }

        return null
      })}
    </div>
  )
}

// Stakeholder-specific renderer
function StakeholderContent({ data }: { data: any }) {
  const stakeholders = data.stakeholders || (Array.isArray(data) ? data : [])

  if (stakeholders.length === 0) {
    return <ResearchContent data={data} />
  }

  return (
    <div className="space-y-4">
      {data.summary && (
        <p className="text-[var(--grey-200)] text-sm leading-relaxed mb-4">{data.summary}</p>
      )}
      <div className="grid gap-3">
        {stakeholders.map((s: any, i: number) => (
          <div key={i} className="bg-[var(--grey-800)] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-white font-medium text-sm">{s.name || s.entity}</h4>
              {s.relationship && (
                <span className="text-xs px-2 py-0.5 rounded bg-slate-500/20 text-slate-400 border border-slate-500/30">
                  {s.relationship}
                </span>
              )}
            </div>
            {s.position && <p className="text-[var(--grey-300)] text-sm mb-1"><span className="text-[var(--grey-300)] text-xs font-semibold">Position:</span> {s.position}</p>}
            {s.incentive && <p className="text-[var(--grey-300)] text-sm mb-1"><span className="text-[var(--grey-300)] text-xs font-semibold">Incentive:</span> {s.incentive}</p>}
            {s.constraints && <p className="text-[var(--grey-300)] text-sm mb-1"><span className="text-[var(--grey-300)] text-xs font-semibold">Constraints:</span> {s.constraints}</p>}
            {s.likely_next_move && <p className="text-[var(--grey-300)] text-sm"><span className="text-[var(--grey-300)] text-xs font-semibold">Likely Next Move:</span> {s.likely_next_move}</p>}
          </div>
        ))}
      </div>
      {data.alignment_opportunities && (
        <div>
          <h4 className="text-sm uppercase tracking-wider text-[var(--grey-200)] mb-2 font-semibold">Alignment Opportunities</h4>
          <p className="text-[var(--grey-200)] text-sm">{typeof data.alignment_opportunities === 'string' ? data.alignment_opportunities : JSON.stringify(data.alignment_opportunities)}</p>
        </div>
      )}
      {data.risks && (
        <div>
          <h4 className="text-sm uppercase tracking-wider text-[var(--grey-200)] mb-2 font-semibold">Risks</h4>
          <p className="text-[var(--grey-200)] text-sm">{typeof data.risks === 'string' ? data.risks : JSON.stringify(data.risks)}</p>
        </div>
      )}
    </div>
  )
}

// Scenario tree renderer
function ScenarioContent({ data }: { data: any }) {
  const scenarios = data.scenarios || [data.base_case, data.upside, data.downside, data.black_swan].filter(Boolean)

  if (scenarios.length === 0) {
    return <ResearchContent data={data} />
  }

  const scenarioColors: Record<string, string> = {
    'base_case': 'border-blue-500/30 bg-blue-500/5',
    'base': 'border-blue-500/30 bg-blue-500/5',
    'upside': 'border-emerald-500/30 bg-emerald-500/5',
    'downside': 'border-amber-500/30 bg-amber-500/5',
    'black_swan': 'border-red-500/30 bg-red-500/5'
  }

  return (
    <div className="space-y-4">
      {data.decision_points && (
        <p className="text-[var(--grey-300)] text-sm mb-2">{typeof data.decision_points === 'string' ? data.decision_points : JSON.stringify(data.decision_points)}</p>
      )}
      {scenarios.map((s: any, i: number) => {
        const type = s.type || s.scenario_type || ['base_case', 'upside', 'downside', 'black_swan'][i] || 'base'
        const colorClass = scenarioColors[type] || 'border-[var(--grey-700)] bg-[var(--grey-800)]'

        return (
          <div key={i} className={`rounded-lg p-4 border ${colorClass}`}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-white font-medium text-sm">
                {s.name || s.label || type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
              </h4>
              {s.probability && (
                <span className="text-xs font-mono text-[var(--grey-400)]">{s.probability}</span>
              )}
            </div>
            {s.narrative && <p className="text-[var(--grey-200)] text-sm mb-2">{s.narrative}</p>}
            {s.key_driver && <p className="text-[var(--grey-300)] text-sm"><span className="text-[var(--grey-300)] text-xs font-semibold">Key Driver:</span> {s.key_driver}</p>}
            {s.indicators && (
              <p className="text-[var(--grey-300)] text-sm">
                <span className="text-[var(--grey-300)] text-xs font-semibold">Indicators:</span>{' '}
                {Array.isArray(s.indicators) ? s.indicators.join(', ') : s.indicators}
              </p>
            )}
            {s.client_impact && <p className="text-[var(--grey-300)] text-sm"><span className="text-[var(--grey-300)] text-xs font-semibold">Impact:</span> {s.client_impact}</p>}
          </div>
        )
      })}
    </div>
  )
}

// Recommendations renderer
function RecommendationsContent({ data }: { data: any }) {
  if (typeof data === 'string') {
    return <p className="text-[var(--grey-200)] text-sm leading-relaxed whitespace-pre-wrap">{data}</p>
  }

  const timeframes = [
    { key: 'immediate', label: 'Immediate (This Week)', color: 'border-red-500/30' },
    { key: 'short_term', label: 'Short-Term (30 Days)', color: 'border-amber-500/30' },
    { key: 'medium_term', label: 'Medium-Term (90 Days)', color: 'border-blue-500/30' }
  ]

  return (
    <div className="space-y-4">
      {timeframes.map(({ key, label, color }) => {
        const items = data[key]
        if (!items) return null

        return (
          <div key={key} className={`rounded-lg p-4 border ${color} bg-[var(--grey-800)]`}>
            <h4 className="text-white font-medium text-sm mb-2">{label}</h4>
            {Array.isArray(items) ? (
              <ul className="space-y-1.5">
                {items.map((item: string, i: number) => (
                  <li key={i} className="text-[var(--grey-200)] text-sm flex items-start gap-2">
                    <span className="text-[var(--grey-500)] mt-0.5">-</span>
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[var(--grey-200)] text-sm whitespace-pre-wrap">{items}</p>
            )}
          </div>
        )
      })}

      {data.decision_matrix && (
        <div className="rounded-lg p-4 border border-purple-500/30 bg-[var(--grey-800)]">
          <h4 className="text-white font-medium text-sm mb-2">Decision Matrix</h4>
          {Array.isArray(data.decision_matrix) ? (
            <div className="space-y-2">
              {data.decision_matrix.map((d: any, i: number) => (
                <div key={i} className="text-sm">
                  <span className="text-[var(--grey-400)]">If</span>{' '}
                  <span className="text-amber-400">{d.condition || d.if}</span>{' '}
                  <span className="text-[var(--grey-400)]">then</span>{' '}
                  <span className="text-emerald-400">{d.action || d.then}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[var(--grey-200)] text-sm whitespace-pre-wrap">{typeof data.decision_matrix === 'string' ? data.decision_matrix : JSON.stringify(data.decision_matrix, null, 2)}</p>
          )}
        </div>
      )}
    </div>
  )
}
