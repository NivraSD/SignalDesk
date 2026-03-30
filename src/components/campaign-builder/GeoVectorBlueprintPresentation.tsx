'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface GeoVectorBlueprint {
  type: 'geo_vector'
  strategicFoundation: {
    primaryObjective: string
    targetQueries: string[]
    aiPlatformPriorities: {
      [platform: string]: {
        importance: string
        rationale: string
        optimization_focus: string
      }
    }
    successMetrics: string[]
  }
  geoSourceAnalysis: {
    sourceImportance: {
      [source: string]: {
        priority: string
        opportunity_score: number
        reasoning: string
        [key: string]: any
      }
    }
  }
  threeTierTacticalPlan: {
    automated: Array<{
      content_type: string
      priority: number
      timeline: string
      what_signaldesk_does: string
      user_action: string
      deliverables: any
      citation_rate: number
      time_to_impact: string
      execution_method: string
      success_metric: string
    }>
    userAssisted: Array<{
      content_type: string
      priority: number
      timeline: string
      what_signaldesk_does: string[]
      user_action: string[]
      deliverables: any
      citation_rate: number
      time_to_impact: string
      time_estimate: string
      success_metric: string
    }>
  }
  executionRoadmap: {
    [week: string]: {
      automated: string[]
      user_assisted: string[]
    }
  }
  resourceRequirements: {
    automated_content: {
      count: number
      effort: string
      user_time: string
    }
    user_assisted_content: {
      count: number
      effort: string
      breakdown: Array<{
        type: string
        time: string
      }>
    }
    total_timeline: string
    expected_impact: string
    budget_required: string
    tools_needed: string[]
  }
}

interface GeoVectorBlueprintPresentationProps {
  blueprint: GeoVectorBlueprint
  onRefine?: (request: string) => void
  onExport?: () => void
  onExecute?: () => void
  isRefining?: boolean
}

export function GeoVectorBlueprintPresentation({
  blueprint,
  onRefine,
  onExport,
  onExecute,
  isRefining = false
}: GeoVectorBlueprintPresentationProps) {
  const [activeSection, setActiveSection] = useState<string>('overview')
  const [activeTier, setActiveTier] = useState<'automated' | 'user_assisted'>('automated')

  const sections = [
    { id: 'overview', label: 'Overview', icon: '🎯' },
    { id: 'platforms', label: 'AI Platforms', icon: '🤖' },
    { id: 'sources', label: 'Source Analysis', icon: '📊' },
    { id: 'tactical', label: 'Tactical Plan', icon: '⚡' },
    { id: 'roadmap', label: 'Roadmap', icon: '📅' },
    { id: 'resources', label: 'Resources', icon: '💼' }
  ]

  const getPriorityColor = (priority: number) => {
    if (priority === 1) return 'text-red-400 bg-red-400/10'
    if (priority <= 3) return 'text-yellow-400 bg-yellow-400/10'
    return 'text-blue-400 bg-blue-400/10'
  }

  const getImportanceColor = (importance: string) => {
    switch (importance.toLowerCase()) {
      case 'critical': return 'text-red-400 bg-red-400/10'
      case 'high': return 'text-orange-400 bg-orange-400/10'
      case 'medium': return 'text-yellow-400 bg-yellow-400/10'
      case 'low': return 'text-green-400 bg-green-400/10'
      default: return 'text-gray-400 bg-gray-400/10'
    }
  }

  const getCitationColor = (rate: number) => {
    if (rate >= 70) return 'text-emerald-400'
    if (rate >= 50) return 'text-yellow-400'
    return 'text-gray-400'
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-900/20 to-blue-900/20 border border-emerald-500/30 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              🤖 GEO-VECTOR Campaign Blueprint
            </h1>
            <p className="text-gray-400">
              AI Platform Optimization • {blueprint.resourceRequirements.total_timeline}
            </p>
          </div>
          <div className="flex gap-2">
            {onExport && (
              <button
                onClick={onExport}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm font-medium text-white transition-colors"
              >
                📤 Export
              </button>
            )}
            {onExecute && (
              <button
                onClick={onExecute}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-bold text-white transition-colors"
              >
                🚀 Start Execution
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-zinc-900/50 rounded-lg p-4">
            <div className="text-2xl font-bold text-emerald-400">
              {blueprint.threeTierTacticalPlan.automated.length}
            </div>
            <div className="text-sm text-gray-400">Automated Actions</div>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-400">
              {blueprint.threeTierTacticalPlan.userAssisted.length}
            </div>
            <div className="text-sm text-gray-400">User-Assisted</div>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-400">
              {blueprint.strategicFoundation.targetQueries.length}
            </div>
            <div className="text-sm text-gray-400">Target Queries</div>
          </div>
          <div className="bg-zinc-900/50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-400">
              {Object.keys(blueprint.executionRoadmap).length}
            </div>
            <div className="text-sm text-gray-400">Weeks Planned</div>
          </div>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeSection === section.id
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
            }`}
          >
            {section.icon} {section.label}
          </button>
        ))}
      </div>

      {/* Content Sections */}
      <motion.div
        key={activeSection}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeSection === 'overview' && (
          <div className="space-y-6">
            {/* Objective */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Primary Objective</h2>
              <div className="text-lg text-gray-300 mb-4">
                {blueprint.strategicFoundation.primaryObjective.replace('_', ' ').toUpperCase()}
              </div>
              <div className="text-sm text-emerald-400 font-medium">
                Expected Impact: {blueprint.resourceRequirements.expected_impact}
              </div>
            </div>

            {/* Target Queries */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Target Queries</h2>
              <p className="text-sm text-gray-400 mb-4">
                These queries will be optimized for AI platform citations:
              </p>
              <div className="space-y-2">
                {blueprint.strategicFoundation.targetQueries.map((query, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-500">•</span>
                    <span className="text-gray-300">&quot;{query}&quot;</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Success Metrics */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Success Metrics</h2>
              <div className="space-y-2">
                {blueprint.strategicFoundation.successMetrics.map((metric, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-500">✓</span>
                    <span className="text-gray-300">{metric}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'platforms' && (
          <div className="space-y-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">AI Platform Priorities</h2>
              <div className="space-y-4">
                {Object.entries(blueprint.strategicFoundation.aiPlatformPriorities).map(([platform, data]) => (
                  <div key={platform} className="border border-zinc-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-white capitalize">{platform}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getImportanceColor(data.importance)}`}>
                        {data.importance}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">{data.rationale}</p>
                    <div className="text-sm text-emerald-400">
                      <strong>Focus:</strong> {data.optimization_focus}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'sources' && (
          <div className="space-y-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Source Opportunity Analysis</h2>
              <div className="space-y-4">
                {Object.entries(blueprint.geoSourceAnalysis.sourceImportance).map(([source, data]) => (
                  <div key={source} className="border border-zinc-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-white capitalize">{source.replace('_', ' ')}</h3>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getImportanceColor(data.priority)}`}>
                          {data.priority}
                        </span>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-emerald-400">{data.opportunity_score}</div>
                          <div className="text-xs text-gray-500">score</div>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400">{data.reasoning}</p>
                    {data.missing_schemas && (
                      <div className="mt-3 text-sm">
                        <span className="text-gray-500">Missing schemas:</span>{' '}
                        <span className="text-yellow-400">{data.missing_schemas.join(', ')}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'tactical' && (
          <div className="space-y-6">
            {/* Tier Tabs */}
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTier('automated')}
                className={`flex-1 px-6 py-4 rounded-lg font-medium transition-colors ${
                  activeTier === 'automated'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                }`}
              >
                <div className="text-2xl mb-1">⚡</div>
                <div className="font-bold">Automated</div>
                <div className="text-sm opacity-75">SignalDesk Generates & Deploys</div>
              </button>
              <button
                onClick={() => setActiveTier('user_assisted')}
                className={`flex-1 px-6 py-4 rounded-lg font-medium transition-colors ${
                  activeTier === 'user_assisted'
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                }`}
              >
                <div className="text-2xl mb-1">🤝</div>
                <div className="font-bold">User-Assisted</div>
                <div className="text-sm opacity-75">You Execute with Our Content</div>
              </button>
            </div>

            {/* Automated Actions */}
            {activeTier === 'automated' && (
              <div className="space-y-4">
                {blueprint.threeTierTacticalPlan.automated
                  .sort((a, b) => a.priority - b.priority)
                  .map((action, idx) => (
                    <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${getPriorityColor(action.priority)}`}>
                              Priority {action.priority}
                            </span>
                            <span className="text-sm text-gray-500">{action.timeline}</span>
                          </div>
                          <h3 className="text-lg font-bold text-white mb-1">
                            {action.content_type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                          </h3>
                          <div className={`text-sm font-medium ${getCitationColor(action.citation_rate)}`}>
                            {action.citation_rate}% AI Citation Rate • Impact in {action.time_to_impact}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <div className="text-sm font-semibold text-emerald-400 mb-2">✨ SignalDesk Provides:</div>
                          <p className="text-sm text-gray-300">{action.what_signaldesk_does}</p>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-blue-400 mb-2">👤 You Do:</div>
                          <p className="text-sm text-gray-300">{action.user_action}</p>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-zinc-800">
                        <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Success Metric</div>
                        <div className="text-sm text-gray-400">{action.success_metric}</div>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* User-Assisted Actions */}
            {activeTier === 'user_assisted' && (
              <div className="space-y-4">
                {blueprint.threeTierTacticalPlan.userAssisted
                  .sort((a, b) => a.priority - b.priority)
                  .map((action, idx) => (
                    <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${getPriorityColor(action.priority)}`}>
                              Priority {action.priority}
                            </span>
                            <span className="text-sm text-gray-500">{action.timeline}</span>
                            <span className="text-sm text-yellow-400">⏱ {action.time_estimate}</span>
                          </div>
                          <h3 className="text-lg font-bold text-white mb-1">
                            {action.content_type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                          </h3>
                          <div className={`text-sm font-medium ${getCitationColor(action.citation_rate)}`}>
                            {action.citation_rate}% AI Citation Rate • Impact in {action.time_to_impact}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <div className="text-sm font-semibold text-emerald-400 mb-2">✨ SignalDesk Provides:</div>
                          <ul className="text-sm text-gray-300 space-y-1">
                            {action.what_signaldesk_does.map((item, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-emerald-500">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-blue-400 mb-2">👤 You Execute:</div>
                          <ul className="text-sm text-gray-300 space-y-1">
                            {action.user_action.map((item, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-blue-500">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-zinc-800">
                        <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Success Metric</div>
                        <div className="text-sm text-gray-400">{action.success_metric}</div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {activeSection === 'roadmap' && (
          <div className="space-y-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">12-Week Execution Roadmap</h2>
              <div className="space-y-4">
                {Object.entries(blueprint.executionRoadmap)
                  .sort((a, b) => {
                    const weekA = parseInt(a[0].replace('week', ''))
                    const weekB = parseInt(b[0].replace('week', ''))
                    return weekA - weekB
                  })
                  .map(([week, tasks]) => (
                    <div key={week} className="border border-zinc-800 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-white mb-3 capitalize">
                        {week.replace('week', 'Week ')}
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium text-emerald-400 mb-2">⚡ Automated:</div>
                          {tasks.automated && tasks.automated.length > 0 ? (
                            <ul className="text-sm text-gray-300 space-y-1">
                              {tasks.automated.map((task, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-emerald-500">•</span>
                                  <span>{task}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-gray-500 italic">No automated tasks</p>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-blue-400 mb-2">🤝 User-Assisted:</div>
                          {tasks.user_assisted && tasks.user_assisted.length > 0 ? (
                            <ul className="text-sm text-gray-300 space-y-1">
                              {tasks.user_assisted.map((task, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-blue-500">•</span>
                                  <span>{task}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-gray-500 italic">No user tasks</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'resources' && (
          <div className="space-y-6">
            {/* Time Investment */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Time Investment</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm font-medium text-emerald-400 mb-2">Automated Content</div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {blueprint.resourceRequirements.automated_content.count} types
                  </div>
                  <p className="text-sm text-gray-400">{blueprint.resourceRequirements.automated_content.user_time}</p>
                </div>
                <div>
                  <div className="text-sm font-medium text-blue-400 mb-2">User-Assisted Content</div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {blueprint.resourceRequirements.user_assisted_content.count} types
                  </div>
                  <p className="text-sm text-gray-400">{blueprint.resourceRequirements.user_assisted_content.effort}</p>
                </div>
              </div>

              {blueprint.resourceRequirements.user_assisted_content.breakdown && (
                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <div className="text-sm font-semibold text-gray-400 mb-3">Breakdown:</div>
                  <div className="space-y-2">
                    {blueprint.resourceRequirements.user_assisted_content.breakdown.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-300">{item.type}</span>
                        <span className="text-yellow-400">{item.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tools Needed */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4">Tools & Access Needed</h2>
              <div className="grid grid-cols-2 gap-3">
                {blueprint.resourceRequirements.tools_needed.map((tool, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="text-emerald-500">✓</span>
                    <span>{tool}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Expected Impact */}
            <div className="bg-gradient-to-r from-emerald-900/20 to-blue-900/20 border border-emerald-500/30 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-2">Expected Impact</h2>
              <div className="text-2xl font-bold text-emerald-400 mb-2">
                {blueprint.resourceRequirements.expected_impact}
              </div>
              <div className="text-sm text-gray-400">
                Timeline: {blueprint.resourceRequirements.total_timeline} • Budget: {blueprint.resourceRequirements.budget_required}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
