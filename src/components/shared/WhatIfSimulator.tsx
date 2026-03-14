'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  Zap,
  Loader2,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Target,
  ArrowRight,
  X,
  Sparkles
} from 'lucide-react'

interface WhatIfProps {
  // Pre-fill the prompt (e.g. from an opportunity or signal)
  initialPrompt?: string
  // Additional context to send (opportunity data, signal text, etc.)
  context?: string
  // Entities to analyze (if not provided, AI will pick relevant ones)
  entityNames?: string[]
  // Org ID for org-specific context
  organizationId?: string
  // Compact mode for embedding in cards
  compact?: boolean
  // Called when user wants to run full simulation from here
  onRunFullSimulation?: (prompt: string) => void
}

interface Scenario {
  name: string
  likelihood: string
  likelihood_pct: number
  summary: string
  entity_reactions: {
    entity: string
    reaction: string
    sentiment: 'positive' | 'negative' | 'neutral'
    impact: 'high' | 'medium' | 'low'
  }[]
  cascade_effects: string[]
  recommended_actions: string[]
}

interface ScenarioResult {
  scenarios: Scenario[]
  overall_assessment: string
  key_variable: string
  meta: {
    model: string
    duration_seconds: number
    entities_used: number
  }
}

const SENTIMENT_COLORS = {
  positive: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: TrendingUp },
  negative: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: TrendingDown },
  neutral: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', icon: Minus }
}

const LIKELIHOOD_COLORS: Record<string, string> = {
  high: 'bg-green-100 text-green-800',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-gray-100 text-gray-600'
}

const SCENARIO_ACCENTS = [
  { bg: 'bg-green-50', border: 'border-green-200', header: 'bg-green-100', text: 'text-green-800' },
  { bg: 'bg-blue-50', border: 'border-blue-200', header: 'bg-blue-100', text: 'text-blue-800' },
  { bg: 'bg-red-50', border: 'border-red-200', header: 'bg-red-100', text: 'text-red-800' }
]

export default function WhatIfSimulator({
  initialPrompt = '',
  context,
  entityNames,
  organizationId,
  compact = false,
  onRunFullSimulation
}: WhatIfProps) {
  const [prompt, setPrompt] = useState(initialPrompt)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScenarioResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expandedScenario, setExpandedScenario] = useState<number>(1) // Default expand "Most Likely"
  const inputRef = useRef<HTMLInputElement>(null)

  const runScenario = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('quick-scenario', {
        body: {
          prompt: prompt.trim(),
          entity_names: entityNames,
          context,
          organization_id: organizationId
        }
      })

      if (invokeError) throw invokeError
      if (!data?.success) throw new Error(data?.error || 'Failed to generate scenarios')

      setResult(data as ScenarioResult)
      setExpandedScenario(1) // Expand "Most Likely" by default
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setResult(null)
    setError(null)
    setPrompt(initialPrompt)
    inputRef.current?.focus()
  }

  // Compact input-only mode (for embedding in cards)
  if (compact && !result && !loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runScenario()}
            placeholder="What would happen if..."
            className="w-full pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--burnt-orange)]/30 focus:border-[var(--burnt-orange)] outline-none"
          />
          <Zap className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
        </div>
        <button
          onClick={runScenario}
          disabled={!prompt.trim()}
          className="px-3 py-2 bg-[var(--burnt-orange)] hover:bg-[var(--terracotta)] disabled:opacity-40 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
        >
          <Sparkles className="w-3 h-3" />
          Analyze
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Input */}
      {!result && !loading && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--burnt-orange)]/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-[var(--burnt-orange)]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--charcoal)]">Quick Scenario Analysis</h3>
              <p className="text-[11px] text-gray-400">Instant 3-scenario analysis with entity reactions</p>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runScenario()}
              placeholder="What would happen if..."
              className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--burnt-orange)]/30 focus:border-[var(--burnt-orange)] outline-none"
              autoFocus
            />
            <button
              onClick={runScenario}
              disabled={!prompt.trim()}
              className="px-4 py-2.5 bg-[var(--burnt-orange)] hover:bg-[var(--terracotta)] disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Analyze
            </button>
          </div>
          {entityNames && entityNames.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[10px] text-gray-400">Analyzing:</span>
              {entityNames.slice(0, 6).map(name => (
                <span key={name} className="px-1.5 py-0.5 text-[10px] rounded bg-gray-100 text-gray-600">{name}</span>
              ))}
              {entityNames.length > 6 && (
                <span className="text-[10px] text-gray-400">+{entityNames.length - 6} more</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--burnt-orange)] mx-auto" />
          <div>
            <p className="text-sm font-medium text-[var(--charcoal)]">Analyzing scenarios...</p>
            <p className="text-xs text-gray-400 mt-1">Evaluating entity reactions and cascade effects</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 rounded-xl border border-red-200 p-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={reset} className="text-xs text-red-500 hover:underline mt-1">Try again</button>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-3">
          {/* Header */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-[var(--burnt-orange)]" />
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Scenario Analysis</span>
                  <span className="text-[10px] text-gray-300">{result.meta.duration_seconds}s</span>
                </div>
                <p className="text-sm text-[var(--charcoal)] font-medium">{result.overall_assessment}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <Target className="w-3 h-3 text-[var(--burnt-orange)]" />
                  <span className="text-xs text-gray-500"><span className="font-medium">Key variable:</span> {result.key_variable}</span>
                </div>
              </div>
              <button
                onClick={reset}
                className="p-1.5 text-gray-300 hover:text-gray-500 transition-colors"
                title="New analysis"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scenarios */}
          {result.scenarios.map((scenario, idx) => {
            const accent = SCENARIO_ACCENTS[idx] || SCENARIO_ACCENTS[0]
            const isExpanded = expandedScenario === idx

            return (
              <div key={idx} className={`rounded-xl border ${accent.border} overflow-hidden`}>
                {/* Scenario header */}
                <button
                  onClick={() => setExpandedScenario(isExpanded ? -1 : idx)}
                  className={`w-full px-4 py-3 flex items-center justify-between ${accent.header} transition-colors`}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded
                      ? <ChevronDown className={`w-4 h-4 ${accent.text}`} />
                      : <ChevronRight className={`w-4 h-4 ${accent.text}`} />
                    }
                    <span className={`text-sm font-semibold ${accent.text}`}>{scenario.name}</span>
                    <span className={`px-2 py-0.5 text-[10px] rounded-full font-medium ${LIKELIHOOD_COLORS[scenario.likelihood] || 'bg-gray-100 text-gray-600'}`}>
                      {scenario.likelihood_pct}% likely
                    </span>
                  </div>
                </button>

                {/* Scenario body */}
                {isExpanded && (
                  <div className={`${accent.bg} p-4 space-y-4`}>
                    {/* Summary */}
                    <p className="text-sm text-gray-700">{scenario.summary}</p>

                    {/* Entity reactions */}
                    {scenario.entity_reactions && scenario.entity_reactions.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Entity Reactions</h4>
                        <div className="space-y-1.5">
                          {scenario.entity_reactions.map((er, i) => {
                            const colors = SENTIMENT_COLORS[er.sentiment] || SENTIMENT_COLORS.neutral
                            const SentimentIcon = colors.icon
                            return (
                              <div key={i} className={`flex items-start gap-2 px-3 py-2 rounded-lg ${colors.bg} border ${colors.border}`}>
                                <SentimentIcon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${colors.text}`} />
                                <div className="flex-1 min-w-0">
                                  <span className={`text-xs font-semibold ${colors.text}`}>{er.entity}</span>
                                  <p className="text-xs text-gray-600 mt-0.5">{er.reaction}</p>
                                </div>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
                                  er.impact === 'high' ? 'bg-red-100 text-red-700' :
                                  er.impact === 'medium' ? 'bg-amber-100 text-amber-700' :
                                  'bg-gray-100 text-gray-500'
                                }`}>
                                  {er.impact}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Cascade effects */}
                    {scenario.cascade_effects && scenario.cascade_effects.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Cascade Effects</h4>
                        <div className="space-y-1">
                          {scenario.cascade_effects.map((effect, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <ArrowRight className="w-3 h-3 mt-0.5 text-gray-400 shrink-0" />
                              <span className="text-xs text-gray-600">{effect}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    {scenario.recommended_actions && scenario.recommended_actions.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Recommended Actions</h4>
                        <div className="space-y-1">
                          {scenario.recommended_actions.map((action, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <CheckCircle className="w-3 h-3 mt-0.5 text-green-500 shrink-0" />
                              <span className="text-xs text-gray-700 font-medium">{action}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {/* Footer actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={reset}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Ask another question
            </button>
            {onRunFullSimulation && (
              <button
                onClick={() => onRunFullSimulation(prompt)}
                className="text-xs text-[var(--burnt-orange)] hover:underline flex items-center gap-1"
              >
                Run full simulation <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
