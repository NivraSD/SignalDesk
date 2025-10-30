'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface PRBrief {
  campaignGoal: string
  organization: string
  industry: string
  positioning: string
  timeline: {
    launch_date: string
    duration: string
    urgency: 'immediate' | 'high' | 'medium' | 'low'
  }
  targetMedia: {
    tier1_outlets: Array<{
      outlet: string
      journalist: string
      beat: string
      recent_coverage: string
      pitch_angle: string
    }>
    tier2_outlets: string[]
    regional_media: string[]
  }
  messaging: {
    core_narrative: string
    key_messages: string[]
    proof_points: string[]
    hooks: string[]
    objection_handling: string[]
  }
  contentRequirements: Array<{
    type: string
    purpose: string
    targetAudience: string
    priority: 'high' | 'medium' | 'low'
    keyPoints: string[]
    specifications: {
      format: string
      length: string
      tone: string
    }
  }>
  researchInsights: {
    competitive_landscape: string[]
    narrative_opportunities: string[]
    timing_considerations: string[]
    risk_factors: string[]
  }
}

interface PRBriefPresentationProps {
  brief: PRBrief
  onRefine?: (request: string) => void
  onExport?: () => void
  onExecute?: () => void
  isRefining?: boolean
}

export function PRBriefPresentation({
  brief,
  onRefine,
  onExport,
  onExecute,
  isRefining = false
}: PRBriefPresentationProps) {
  const [activeSection, setActiveSection] = useState<string>('overview')

  const sections = [
    { id: 'overview', label: 'Overview', icon: '🎯' },
    { id: 'media', label: 'Target Media', icon: '📰' },
    { id: 'messaging', label: 'Messaging', icon: '💬' },
    { id: 'content', label: 'Content Plan', icon: '📝' },
    { id: 'insights', label: 'Insights', icon: '💡' }
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-400/10'
      case 'medium': return 'text-yellow-400 bg-yellow-400/10'
      case 'low': return 'text-blue-400 bg-blue-400/10'
      default: return 'text-gray-400 bg-gray-400/10'
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'immediate': return 'text-red-400 bg-red-400/10'
      case 'high': return 'text-orange-400 bg-orange-400/10'
      case 'medium': return 'text-yellow-400 bg-yellow-400/10'
      case 'low': return 'text-green-400 bg-green-400/10'
      default: return 'text-gray-400 bg-gray-400/10'
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-800/50 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-white mb-2">
              📰 PR Campaign Brief
            </h2>
            <p className="text-xl text-gray-300 mb-4">{brief.campaignGoal}</p>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-400">
                <span className="text-gray-500">Organization:</span> {brief.organization}
              </span>
              <span className="text-gray-400">
                <span className="text-gray-500">Industry:</span> {brief.industry}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(brief.timeline.urgency)}`}>
                {brief.timeline.urgency.toUpperCase()} URGENCY
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {onExport && (
              <button
                onClick={onExport}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white rounded-lg text-sm transition-colors"
              >
                📥 Export
              </button>
            )}
            {onExecute && (
              <button
                onClick={onExecute}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg font-medium text-sm transition-all"
              >
                🚀 Execute Campaign
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
              activeSection === section.id
                ? 'bg-blue-600 text-white'
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
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
        className="space-y-6"
      >
        {/* Overview */}
        {activeSection === 'overview' && (
          <div className="space-y-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Campaign Overview</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-400">Positioning</label>
                  <p className="text-white mt-1">{brief.positioning}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Timeline</label>
                  <div className="mt-1 space-y-1">
                    <p className="text-white">Launch Date: {brief.timeline.launch_date}</p>
                    <p className="text-gray-400">Duration: {brief.timeline.duration}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Target Media */}
        {activeSection === 'media' && (
          <div className="space-y-4">
            {/* Tier 1 Outlets */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                🎯 Tier 1 Media Targets ({brief.targetMedia.tier1_outlets.length})
              </h3>
              <div className="space-y-4">
                {brief.targetMedia.tier1_outlets.map((outlet, idx) => (
                  <div key={idx} className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-lg font-semibold text-white">{outlet.outlet}</h4>
                        <p className="text-sm text-gray-400">{outlet.journalist} • {outlet.beat}</p>
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div>
                        <span className="text-xs font-medium text-gray-500">Pitch Angle:</span>
                        <p className="text-sm text-gray-300 mt-1">{outlet.pitch_angle}</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500">Recent Coverage:</span>
                        <p className="text-sm text-gray-400 mt-1">{outlet.recent_coverage}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tier 2 Outlets */}
            {brief.targetMedia.tier2_outlets.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">
                  📊 Tier 2 Outlets ({brief.targetMedia.tier2_outlets.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {brief.targetMedia.tier2_outlets.map((outlet, idx) => (
                    <span key={idx} className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-full text-sm text-gray-300">
                      {outlet}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Regional Media */}
            {brief.targetMedia.regional_media.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">
                  🌍 Regional Media ({brief.targetMedia.regional_media.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {brief.targetMedia.regional_media.map((outlet, idx) => (
                    <span key={idx} className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-full text-sm text-gray-300">
                      {outlet}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Messaging */}
        {activeSection === 'messaging' && (
          <div className="space-y-4">
            {/* Core Narrative */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Core Narrative</h3>
              <p className="text-gray-300 leading-relaxed">{brief.messaging.core_narrative}</p>
            </div>

            {/* Key Messages */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Key Messages</h3>
              <ul className="space-y-2">
                {brief.messaging.key_messages.map((message, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span className="text-gray-300">{message}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Proof Points */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Proof Points</h3>
              <ul className="space-y-2">
                {brief.messaging.proof_points.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-1">✓</span>
                    <span className="text-gray-300">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* News Hooks */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">News Hooks</h3>
              <ul className="space-y-2">
                {brief.messaging.hooks.map((hook, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-yellow-400 mt-1">🔗</span>
                    <span className="text-gray-300">{hook}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Objection Handling */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Objection Handling</h3>
              <ul className="space-y-2">
                {brief.messaging.objection_handling.map((objection, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-orange-400 mt-1">⚠️</span>
                    <span className="text-gray-300">{objection}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Content Requirements */}
        {activeSection === 'content' && (
          <div className="space-y-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                Content Deliverables ({brief.contentRequirements.length} pieces)
              </h3>
              <div className="space-y-4">
                {brief.contentRequirements.map((content, idx) => (
                  <div key={idx} className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-semibold text-white capitalize">
                            {content.type.replace(/-/g, ' ')}
                          </h4>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(content.priority)}`}>
                            {content.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">{content.purpose}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">Target Audience:</span>
                        <span className="text-gray-300 ml-2">{content.targetAudience}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Format:</span>
                        <span className="text-gray-300 ml-2">{content.specifications.format}</span>
                        <span className="text-gray-500 ml-4">Length:</span>
                        <span className="text-gray-300 ml-2">{content.specifications.length}</span>
                        <span className="text-gray-500 ml-4">Tone:</span>
                        <span className="text-gray-300 ml-2">{content.specifications.tone}</span>
                      </div>
                      {content.keyPoints.length > 0 && (
                        <div>
                          <span className="text-gray-500">Key Points:</span>
                          <ul className="mt-1 ml-4 space-y-1">
                            {content.keyPoints.map((point, pidx) => (
                              <li key={pidx} className="text-gray-400 text-xs flex items-start gap-1">
                                <span>•</span>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Research Insights */}
        {activeSection === 'insights' && (
          <div className="space-y-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Competitive Landscape</h3>
              <ul className="space-y-2">
                {brief.researchInsights.competitive_landscape.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">🎯</span>
                    <span className="text-gray-300">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Narrative Opportunities</h3>
              <ul className="space-y-2">
                {brief.researchInsights.narrative_opportunities.map((opportunity, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-1">💡</span>
                    <span className="text-gray-300">{opportunity}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Timing Considerations</h3>
              <ul className="space-y-2">
                {brief.researchInsights.timing_considerations.map((timing, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-yellow-400 mt-1">⏰</span>
                    <span className="text-gray-300">{timing}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Risk Factors</h3>
              <ul className="space-y-2">
                {brief.researchInsights.risk_factors.map((risk, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">⚠️</span>
                    <span className="text-gray-300">{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
