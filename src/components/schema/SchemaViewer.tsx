'use client'

import React, { useState } from 'react'
import {
  FileText,
  Edit3,
  Check,
  X,
  Copy,
  Download,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  TrendingUp
} from 'lucide-react'

interface SchemaViewerProps {
  schema: any
  competitorSchemas?: any[]
  onUpdate?: (updatedSchema: any) => void
  readonly?: boolean
}

export default function SchemaViewer({
  schema,
  competitorSchemas = [],
  onUpdate,
  readonly = false
}: SchemaViewerProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(JSON.stringify(schema.content, null, 2))
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['main']))
  const [showComparison, setShowComparison] = useState(false)
  const [selectedCompetitor, setSelectedCompetitor] = useState<number>(0)

  const schemaContent = schema.content
  const fields = Object.keys(schemaContent).filter(k => !k.startsWith('@'))

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const handleSave = () => {
    try {
      const parsed = JSON.parse(editedContent)
      if (onUpdate) {
        onUpdate({ ...schema, content: parsed })
      }
      setIsEditing(false)
    } catch (error) {
      alert('Invalid JSON. Please check your syntax.')
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(schemaContent, null, 2))
    alert('Schema copied to clipboard!')
  }

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(schemaContent, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `schema-${schemaContent['@type']}-${Date.now()}.json`
    a.click()
  }

  const compareFields = () => {
    if (competitorSchemas.length === 0) return { missing: [], extra: [], common: [] }

    const compSchema = competitorSchemas[selectedCompetitor]
    if (!compSchema) return { missing: [], extra: [], common: [] }

    const ourFields = new Set(Object.keys(schemaContent).filter(k => !k.startsWith('@')))
    const theirFields = new Set(Object.keys(compSchema.content).filter(k => !k.startsWith('@')))

    const missing = Array.from(theirFields).filter(f => !ourFields.has(f))
    const extra = Array.from(ourFields).filter(f => !theirFields.has(f))
    const common = Array.from(ourFields).filter(f => theirFields.has(f))

    return { missing, extra, common }
  }

  const comparison = showComparison && competitorSchemas.length > 0 ? compareFields() : null

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-bold text-white">
            {schemaContent['@type']} Schema
          </h3>
          <span className="text-xs px-2 py-1 rounded bg-purple-500/10 border border-purple-500/20 text-purple-300">
            {fields.length} fields
          </span>
        </div>

        <div className="flex items-center gap-2">
          {competitorSchemas.length > 0 && (
            <button
              onClick={() => setShowComparison(!showComparison)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
                showComparison
                  ? 'bg-blue-500/20 border border-blue-500/30 text-blue-400'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              {showComparison ? 'Hide' : 'Compare'}
            </button>
          )}

          <button
            onClick={handleCopy}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Copy
          </button>

          <button
            onClick={handleDownload}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </button>

          {!readonly && (
            <>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400 rounded text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 rounded text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      setEditedContent(JSON.stringify(schema.content, null, 2))
                    }}
                    className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Comparison View */}
      {showComparison && competitorSchemas.length > 0 && comparison && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-blue-400">Competitor Comparison</h4>
            <select
              value={selectedCompetitor}
              onChange={(e) => setSelectedCompetitor(parseInt(e.target.value))}
              className="px-3 py-1 bg-gray-800 border border-gray-700 rounded text-sm text-white"
            >
              {competitorSchemas.map((comp, idx) => (
                <option key={idx} value={idx}>
                  {comp.metadata?.competitor_url ? new URL(comp.metadata.competitor_url).hostname : `Competitor ${idx + 1}`}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-red-400 font-medium mb-2">Missing Fields ({comparison.missing.length})</div>
              <div className="space-y-1">
                {comparison.missing.length === 0 ? (
                  <div className="text-xs text-gray-500">None</div>
                ) : (
                  comparison.missing.map((field, idx) => (
                    <div key={idx} className="text-xs px-2 py-1 bg-red-500/10 border border-red-500/20 rounded text-red-300">
                      {field}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <div className="text-xs text-green-400 font-medium mb-2">Common Fields ({comparison.common.length})</div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {comparison.common.map((field, idx) => (
                  <div key={idx} className="text-xs px-2 py-1 bg-green-500/10 border border-green-500/20 rounded text-green-300">
                    {field}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs text-blue-400 font-medium mb-2">Extra Fields ({comparison.extra.length})</div>
              <div className="space-y-1">
                {comparison.extra.length === 0 ? (
                  <div className="text-xs text-gray-500">None</div>
                ) : (
                  comparison.extra.map((field, idx) => (
                    <div key={idx} className="text-xs px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-blue-300">
                      {field}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {comparison.missing.length > 0 && (
            <div className="mt-4 bg-yellow-500/10 border border-yellow-500/20 rounded p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-gray-300">
                  <p className="font-medium text-yellow-400 mb-1">Optimization Opportunity</p>
                  <p>Your competitors have {comparison.missing.length} field{comparison.missing.length !== 1 ? 's' : ''} that you're missing. Consider adding them to improve AI visibility.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Schema Content */}
      <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg overflow-hidden">
        {isEditing ? (
          <div className="p-4">
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full h-96 bg-gray-800 border border-gray-700 rounded p-4 text-sm font-mono text-white"
              spellCheck={false}
            />
          </div>
        ) : (
          <div className="divide-y divide-gray-700/50">
            {/* Context and Type */}
            <div className="p-4 bg-gray-800/30">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">@context</div>
                  <div className="text-sm text-gray-300 font-mono">{schemaContent['@context']}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">@type</div>
                  <div className="text-sm text-purple-400 font-mono font-bold">{schemaContent['@type']}</div>
                </div>
              </div>
            </div>

            {/* Fields */}
            <div className="p-4">
              <button
                onClick={() => toggleSection('main')}
                className="flex items-center justify-between w-full mb-3 hover:bg-gray-800/30 rounded p-2 transition-colors"
              >
                <span className="text-sm font-medium text-gray-300">Fields ({fields.length})</span>
                {expandedSections.has('main') ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {expandedSections.has('main') && (
                <div className="space-y-3">
                  {fields.map((field) => {
                    const value = schemaContent[field]
                    const isObject = typeof value === 'object' && value !== null
                    const isHighlighted = comparison?.missing.includes(field)
                      ? 'border-l-4 border-l-red-500/50 bg-red-500/5'
                      : comparison?.extra.includes(field)
                      ? 'border-l-4 border-l-blue-500/50 bg-blue-500/5'
                      : ''

                    return (
                      <div key={field} className={`bg-gray-800/30 rounded-lg p-3 ${isHighlighted}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="text-sm font-medium text-white font-mono">{field}</div>
                          <div className="text-xs px-2 py-0.5 bg-gray-700 rounded text-gray-400">
                            {Array.isArray(value) ? 'array' : typeof value}
                          </div>
                        </div>
                        <div className="text-sm text-gray-300 font-mono break-all">
                          {isObject ? (
                            <pre className="text-xs overflow-x-auto">{JSON.stringify(value, null, 2)}</pre>
                          ) : (
                            String(value)
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Performance Metrics (if available) */}
      {schema.intelligence?.platforms && (
        <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-4">
          <h4 className="text-sm font-bold text-gray-300 mb-3">Platform Performance</h4>
          <div className="grid grid-cols-4 gap-3">
            {Object.entries(schema.intelligence.platforms).map(([platform, perf]: [string, any]) => (
              <div key={platform} className="bg-gray-800/30 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1 capitalize">{platform}</div>
                <div className={`text-lg font-bold ${perf.mentioned ? 'text-green-400' : 'text-red-400'}`}>
                  {perf.mentioned ? '✓' : '✗'}
                </div>
                {perf.rank && (
                  <div className="text-xs text-gray-400 mt-1">Rank: {perf.rank}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
