import React, { useState } from 'react'
import {
  Target, AlertTriangle, Clock, TrendingUp, Lightbulb, ChevronRight,
  AlertCircle, Megaphone, Users, Briefcase, Edit3, Share2, UserPlus,
  BarChart, Zap, Play, CheckCircle
} from 'lucide-react'

interface Opportunity {
  id: string
  title: string
  description: string

  // Execution fields
  category: string
  execution_type?: 'manual' | 'assisted' | 'autonomous'

  // Timing
  urgency: string
  time_window: string
  expires_at?: string
  score: number

  // Creative fields
  campaign_name?: string
  creative_approach?: string

  // Playbook for one-click execution
  playbook?: {
    template_id?: string
    key_messages?: string[]
    target_audience?: string
    channels?: string[]
    assets_needed?: string[]
    campaign_name?: string
    creative_approach?: string
  }

  // Action items
  action_items?: Array<{
    step: number
    action: string
    owner: string
    deadline: string
  }>

  // Measurement
  success_metrics?: string[]
  expected_impact?: string

  // Context
  trigger_event?: string
  competitor_context?: string
  confidence?: number

  // Organization
  organization_name?: string
  organization_id?: string

  // Metadata
  status?: string
  created_at?: string

  // Legacy data field
  data?: {
    organization_name?: string
    execution_type?: string
    campaign_name?: string
    creative_approach?: string
    playbook?: any
    action_items?: any[]
    success_metrics?: string[]
    expected_impact?: string
    trigger_event?: string
    competitor_context?: string
    confidence?: number
  }
}

interface OpportunitiesDisplayProps {
  opportunities: Opportunity[]
  onExecute?: (opportunity: Opportunity) => void
}

export default function OpportunitiesDisplay({ opportunities, onExecute }: OpportunitiesDisplayProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (!opportunities || opportunities.length === 0) {
    return (
      <div className="bg-gray-900/50 rounded-lg p-8 text-center">
        <Target className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">No opportunities detected yet</p>
        <p className="text-gray-500 text-sm mt-2">Run the intelligence pipeline to discover PR opportunities</p>
      </div>
    )
  }

  // Sort opportunities by urgency and score
  const sortedOpportunities = [...opportunities].sort((a, b) => {
    const urgencyOrder = { high: 3, critical: 3, medium: 2, low: 1 }
    const urgencyDiff = (urgencyOrder[b.urgency?.toLowerCase()] || 0) - (urgencyOrder[a.urgency?.toLowerCase()] || 0)
    if (urgencyDiff !== 0) return urgencyDiff
    return b.score - a.score
  })

  const getUrgencyColor = (urgency: string) => {
    switch (urgency?.toLowerCase()) {
      case 'high':
      case 'critical':
        return 'text-red-400 bg-red-900/20 border-red-700'
      case 'medium':
        return 'text-yellow-400 bg-yellow-900/20 border-yellow-700'
      default:
        return 'text-green-400 bg-green-900/20 border-green-700'
    }
  }

  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, any> = {
      'PRESS_RELEASE': Megaphone,
      'SOCIAL_CAMPAIGN': Share2,
      'EXECUTIVE_OUTREACH': Users,
      'CRISIS_RESPONSE': AlertTriangle,
      'CONTENT_CREATION': Edit3,
      'PARTNERSHIP_PLAY': Briefcase,
      'TALENT_MOVE': UserPlus,
      'MARKET_POSITION': BarChart,
      'STRATEGIC': Target,
      'COMPETITIVE': TrendingUp,
      'VIRAL': Zap,
      'CASCADE': BarChart
    }
    return iconMap[category?.toUpperCase()] || Lightbulb
  }

  const getExecutionBadge = (type?: string) => {
    switch (type) {
      case 'autonomous':
        return (
          <span className="text-xs px-2 py-1 bg-purple-900/30 text-purple-400 rounded-full border border-purple-700">
            🤖 One-Click
          </span>
        )
      case 'assisted':
        return (
          <span className="text-xs px-2 py-1 bg-blue-900/30 text-blue-400 rounded-full border border-blue-700">
            👥 Assisted
          </span>
        )
      default:
        return (
          <span className="text-xs px-2 py-1 bg-gray-900/30 text-gray-400 rounded-full border border-gray-700">
            ✋ Manual
          </span>
        )
    }
  }

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const handleExecute = (opp: Opportunity) => {
    if (onExecute) {
      onExecute(opp)
    } else {
      console.log('Execute opportunity:', opp)
      alert(`Executing: ${opp.title}\n\nThis would trigger the one-click execution workflow.`)
    }
  }

  // Get data from either direct fields or nested data object
  const getData = (opp: Opportunity) => {
    return {
      execution_type: opp.execution_type || opp.data?.execution_type,
      playbook: opp.playbook || opp.data?.playbook,
      action_items: opp.action_items || opp.data?.action_items,
      success_metrics: opp.success_metrics || opp.data?.success_metrics,
      expected_impact: opp.expected_impact || opp.data?.expected_impact,
      trigger_event: opp.trigger_event || opp.data?.trigger_event,
      competitor_context: opp.competitor_context || opp.data?.competitor_context,
      confidence: opp.confidence || opp.data?.confidence,
      organization_name: opp.organization_name || opp.data?.organization_name
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-cyan-400 flex items-center">
          <Target className="w-6 h-6 mr-2" />
          Executable Opportunities ({opportunities.length})
        </h2>
        <div className="text-sm text-gray-400">
          Click any opportunity to see execution details
        </div>
      </div>

      {sortedOpportunities.map((opp) => {
        const Icon = getCategoryIcon(opp.category)
        const isExpanded = expandedId === opp.id
        const data = getData(opp)

        return (
          <div
            key={opp.id}
            className="bg-gray-900/50 rounded-lg border border-gray-800 hover:border-cyan-700 transition-all duration-200"
          >
            {/* Header - Always visible */}
            <div
              className="p-4 cursor-pointer"
              onClick={() => toggleExpanded(opp.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-white font-semibold text-base">{opp.title}</h3>
                    {getExecutionBadge(data.execution_type)}
                  </div>

                  <p className="text-gray-300 text-sm mb-3">{opp.description}</p>

                  {/* Creative Campaign Fields */}
                  {(opp.campaign_name || opp.data?.campaign_name || data.playbook?.campaign_name) && (
                    <div className="mb-3 p-2 bg-purple-900/20 border border-purple-800 rounded">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-purple-400 font-semibold">🎯 Campaign:</span>
                        <span className="text-purple-300">
                          {opp.campaign_name || opp.data?.campaign_name || data.playbook?.campaign_name}
                        </span>
                      </div>
                      {(opp.creative_approach || opp.data?.creative_approach || data.playbook?.creative_approach) && (
                        <div className="mt-1 text-xs text-gray-400">
                          <span className="text-purple-400">Strategy:</span> {opp.creative_approach || opp.data?.creative_approach || data.playbook?.creative_approach}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs">
                    <span className={`px-2 py-1 rounded font-medium ${getUrgencyColor(opp.urgency)}`}>
                      {opp.urgency?.toUpperCase()}
                    </span>
                    <span className="text-gray-400 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {opp.time_window}
                    </span>
                    <span className="text-gray-500">
                      Score: {opp.score}
                    </span>
                    {data.confidence && (
                      <span className="text-gray-500">
                        Confidence: {data.confidence}%
                      </span>
                    )}
                    {data.organization_name && (
                      <span className="text-gray-500">
                        {data.organization_name}
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight
                  className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                />
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="px-4 pb-4 border-t border-gray-800 mt-2 pt-4 space-y-4">
                {/* Trigger & Context */}
                {(data.trigger_event || data.competitor_context) && (
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <h4 className="text-sm font-semibold text-cyan-400 mb-2">Context</h4>
                    {data.trigger_event && (
                      <p className="text-xs text-gray-300 mb-1">
                        <span className="text-gray-500">Trigger:</span> {data.trigger_event}
                      </p>
                    )}
                    {data.competitor_context && (
                      <p className="text-xs text-gray-300">
                        <span className="text-gray-500">Competitor:</span> {data.competitor_context}
                      </p>
                    )}
                  </div>
                )}

                {/* Playbook */}
                {data.playbook && (
                  <div className="bg-blue-900/10 rounded-lg p-3 border border-blue-800">
                    <h4 className="text-sm font-semibold text-blue-400 mb-2">Execution Playbook</h4>

                    {data.playbook.key_messages && data.playbook.key_messages.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs text-gray-400 mb-1">Key Messages:</p>
                        <ul className="space-y-1">
                          {data.playbook.key_messages.map((msg: string, i: number) => (
                            <li key={i} className="text-xs text-gray-300 flex items-start">
                              <span className="text-blue-400 mr-1">•</span>
                              {msg}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {data.playbook.target_audience && (
                        <div>
                          <span className="text-gray-400">Audience:</span>
                          <span className="text-gray-300 ml-1">{data.playbook.target_audience}</span>
                        </div>
                      )}
                      {data.playbook.channels && (
                        <div>
                          <span className="text-gray-400">Channels:</span>
                          <span className="text-gray-300 ml-1">{data.playbook.channels.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Items */}
                {data.action_items && data.action_items.length > 0 && (
                  <div className="bg-green-900/10 rounded-lg p-3 border border-green-800">
                    <h4 className="text-sm font-semibold text-green-400 mb-2">Action Items</h4>
                    <div className="space-y-2">
                      {data.action_items.map((item: any, i: number) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-green-400 text-xs mt-0.5">
                            {item.step || i + 1}.
                          </span>
                          <div className="flex-1">
                            <p className="text-xs text-gray-300">{item.action}</p>
                            <div className="flex gap-3 mt-1 text-xs text-gray-500">
                              <span>Owner: {item.owner}</span>
                              {item.deadline && (
                                <span>Due: {new Date(item.deadline).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Success Metrics & Impact */}
                <div className="grid grid-cols-2 gap-3">
                  {data.success_metrics && data.success_metrics.length > 0 && (
                    <div className="bg-purple-900/10 rounded-lg p-3 border border-purple-800">
                      <h4 className="text-xs font-semibold text-purple-400 mb-1">Success Metrics</h4>
                      <ul className="space-y-1">
                        {data.success_metrics.map((metric: string, i: number) => (
                          <li key={i} className="text-xs text-gray-300 flex items-start">
                            <CheckCircle className="w-3 h-3 text-purple-400 mr-1 mt-0.5" />
                            {metric}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {data.expected_impact && (
                    <div className="bg-cyan-900/10 rounded-lg p-3 border border-cyan-800">
                      <h4 className="text-xs font-semibold text-cyan-400 mb-1">Expected Impact</h4>
                      <p className="text-xs text-gray-300">{data.expected_impact}</p>
                    </div>
                  )}
                </div>

                {/* Execute Button */}
                {data.execution_type === 'autonomous' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleExecute(opp)
                    }}
                    className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold rounded-lg hover:from-cyan-500 hover:to-blue-500 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Execute One-Click Workflow
                  </button>
                )}

                {data.execution_type === 'assisted' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleExecute(opp)
                    }}
                    className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-500 hover:to-purple-500 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    Start Assisted Workflow
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}