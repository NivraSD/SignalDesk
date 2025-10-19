'use client'

import React from 'react'
import { NivStrategicFramework } from '@/types/niv-strategic'
import { Clock, Target, TrendingUp, AlertCircle, Users, Calendar, CheckCircle, ArrowRight } from 'lucide-react'

interface NivStrategicDisplayProps {
  output: NivStrategicFramework | null
  onSendToCampaign?: (framework: NivStrategicFramework) => void
  onSendToPlan?: (framework: NivStrategicFramework) => void
  onSendToExecute?: (framework: NivStrategicFramework) => void
  onRefineStrategy?: (framework: NivStrategicFramework) => void
}

export default function NivStrategicDisplay({
  output,
  onSendToCampaign,
  onSendToPlan,
  onSendToExecute,
  onRefineStrategy
}: NivStrategicDisplayProps) {
  if (!output) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-500">
        <Target className="w-12 h-12 mb-4 text-gray-400" />
        <p className="text-lg font-medium">No Strategic Framework Available</p>
        <p className="text-sm mt-2">Ask NIV to develop a strategy to get started</p>
      </div>
    )
  }

  return (
    <div className="niv-strategic-display space-y-6">
      {/* Executive Summary Card */}
      <div className="executive-summary bg-gradient-to-r from-purple-600 to-purple-400 text-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-2">{output.strategy.objective}</h2>
        <p className="text-purple-100 mb-4">{output.strategy.rationale}</p>
        <div className="flex flex-wrap gap-2">
          {output.strategy.successMetrics.map((metric) => (
            <div key={metric.id} className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-sm">
              <span className="font-medium">{metric.name}:</span> {metric.target} {metric.unit}
            </div>
          ))}
        </div>
      </div>

      {/* Strategic Narrative Section */}
      <div className="narrative-section bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          Core Narrative
        </h3>
        <div className="story-card bg-purple-50 border-l-4 border-purple-600 p-4 rounded mb-4">
          <p className="text-gray-800 italic">{output.narrative.coreStory}</p>
        </div>
        <div className="messages space-y-2">
          {output.narrative.supportingMessages.map((msg) => (
            <div key={msg.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded">
              <div className="flex-shrink-0 w-1 h-full bg-purple-400 rounded"></div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">{msg.text}</p>
                <div className="flex gap-4 mt-2 text-sm text-gray-600">
                  <span>Audience: {msg.audience.join(', ')}</span>
                  <span>Priority: {msg.priority}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Execution Timeline */}
      <div className="timeline-section bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-600" />
          Execution Plan
        </h3>

        {/* Timeline Phases */}
        <div className="phases grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {output.execution.timeline.phases.map((phase, index) => (
            <div key={phase.id} className="relative">
              <div className="phase-card border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{phase.name}</h4>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                    Phase {index + 1}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {phase.startDate} → {phase.endDate}
                </p>
                <ul className="text-sm space-y-1">
                  {phase.objectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {index < output.execution.timeline.phases.length - 1 && (
                <ArrowRight className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-400 hidden md:block" />
              )}
            </div>
          ))}
        </div>

        {/* Channel Strategy */}
        <div className="channels">
          <h4 className="font-medium mb-3">Channel Strategy</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="text-sm font-medium text-gray-600 mb-2">Primary Channels</h5>
              {output.execution.channels.primary.map((channel) => (
                <div key={channel.channel} className="mb-2 p-3 bg-purple-50 rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{channel.channel}</p>
                      <p className="text-xs text-gray-600">{channel.purpose}</p>
                    </div>
                    <span className="text-xs bg-white px-2 py-1 rounded">{channel.frequency}</span>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <h5 className="text-sm font-medium text-gray-600 mb-2">Secondary Channels</h5>
              {output.execution.channels.secondary.map((channel) => (
                <div key={channel.channel} className="mb-2 p-3 bg-gray-50 rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{channel.channel}</p>
                      <p className="text-xs text-gray-600">{channel.purpose}</p>
                    </div>
                    <span className="text-xs bg-white px-2 py-1 rounded">{channel.frequency}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Intelligence Context */}
      <div className="intelligence-support bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-purple-600" />
          Supporting Intelligence
        </h3>
        <div className="intel-grid grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Competitor Moves */}
          <div className="competitor-moves">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Competitor Activity</h4>
            {output.intelligence.competitorMoves.slice(0, 3).map((move) => (
              <div key={move.competitorId} className="mb-2 p-2 bg-gray-50 rounded text-sm">
                <p className="font-medium">{move.competitorName}</p>
                <p className="text-xs text-gray-600">{move.action}</p>
                <span className={`text-xs px-1 py-0.5 rounded mt-1 inline-block ${
                  move.significance === 'major' ? 'bg-red-100 text-red-700' :
                  move.significance === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {move.significance}
                </span>
              </div>
            ))}
          </div>

          {/* Market Signals */}
          <div className="market-signals">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Market Signals</h4>
            {output.intelligence.marketSignals.map((signal, i) => (
              <div key={i} className="mb-2 p-2 bg-gray-50 rounded text-sm">
                <p className="font-medium">{signal.signal}</p>
                <p className="text-xs text-gray-600">Source: {signal.source}</p>
                {signal.actionRequired && (
                  <span className="text-xs bg-orange-100 text-orange-700 px-1 py-0.5 rounded mt-1 inline-block">
                    Action Required
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Opportunity Windows */}
          <div className="opportunity-windows">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Opportunities</h4>
            {output.intelligence.opportunities.map((opp, i) => (
              <div key={i} className="mb-2 p-2 bg-green-50 rounded text-sm">
                <p className="font-medium">{opp.opportunity}</p>
                <p className="text-xs text-gray-600">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {opp.openDate} - {opp.closeDate}
                </p>
                <p className="text-xs text-green-700 mt-1">{opp.potentialReturn}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Risks Section */}
      {output.strategy.risks && output.strategy.risks.length > 0 && (
        <div className="risks-section bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            Risk Assessment
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {output.strategy.risks.map((risk) => (
              <div key={risk.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-medium text-sm">{risk.description}</p>
                  <div className="flex gap-1">
                    <span className={`text-xs px-2 py-1 rounded ${
                      risk.probability === 'high' ? 'bg-red-100 text-red-700' :
                      risk.probability === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {risk.probability} prob
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      risk.impact === 'critical' ? 'bg-red-100 text-red-700' :
                      risk.impact === 'major' ? 'bg-orange-100 text-orange-700' :
                      risk.impact === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {risk.impact} impact
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-600">
                  <strong>Mitigation:</strong> {risk.mitigation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="action-bar flex flex-wrap gap-3 pt-4 border-t">
        <button
          onClick={() => onSendToCampaign?.(output)}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
        >
          <Users className="w-4 h-4" />
          Generate Campaign
        </button>
        <button
          onClick={() => onSendToPlan?.(output)}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Calendar className="w-4 h-4" />
          Create Project Plan
        </button>
        <button
          onClick={() => onSendToExecute?.(output)}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          Build Content
        </button>
        <button
          onClick={() => onRefineStrategy?.(output)}
          className="px-6 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
        >
          Refine Strategy
        </button>

        {/* Handoff Status Indicator */}
        <div className="ml-auto flex items-center gap-2 text-sm">
          <span className="text-gray-600">Target Component:</span>
          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
            {output.handoff.targetComponent}
          </span>
          <span className={`px-3 py-1 rounded-full font-medium ${
            output.handoff.priority === 'urgent' ? 'bg-red-100 text-red-700' :
            output.handoff.priority === 'high' ? 'bg-orange-100 text-orange-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {output.handoff.priority} priority
          </span>
        </div>
      </div>
    </div>
  )
}