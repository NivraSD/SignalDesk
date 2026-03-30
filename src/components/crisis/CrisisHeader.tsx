'use client'

import React from 'react'
import { AlertTriangle, Clock, Activity, CheckCircle2, Pause, RotateCcw } from 'lucide-react'

interface CrisisHeaderProps {
  crisis: any
  elapsedTime: string
  onStatusChange: (status: 'monitoring' | 'active' | 'resolved') => void
  onSeverityChange: (severity: 'low' | 'medium' | 'high' | 'critical') => void
}

export default function CrisisHeader({
  crisis,
  elapsedTime,
  onStatusChange,
  onSeverityChange
}: CrisisHeaderProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500 bg-red-500/10 border-red-500'
      case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500'
      case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500'
      case 'low': return 'text-blue-500 bg-blue-500/10 border-blue-500'
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-red-500 bg-red-500/10 border-red-500'
      case 'monitoring': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500'
      case 'resolved': return 'text-green-500 bg-green-500/10 border-green-500'
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500'
    }
  }

  return (
    <div className="px-6 py-4 border-b border-gray-800 bg-gradient-to-r from-red-900/20 to-gray-900/50">
      <div className="flex items-center justify-between">
        {/* Left: Crisis Info */}
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getSeverityColor(crisis.severity)}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-bold text-white">{crisis.title}</h2>
              {/* Status Badge */}
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(crisis.status)}`}>
                {crisis.status.toUpperCase()}
              </span>
              {/* Severity Badge */}
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(crisis.severity)}`}>
                {crisis.severity.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center space-x-4 mt-1">
              <span className="text-sm text-gray-400">Type: {crisis.crisis_type.replace(/_/g, ' ')}</span>
              {crisis.trigger_source && (
                <span className="text-sm text-gray-400">• Triggered by: {crisis.trigger_source}</span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Timer & Controls */}
        <div className="flex items-center space-x-6">
          {/* Crisis Timer */}
          <div className="text-right">
            <div className="text-sm text-gray-400 mb-1">Time Elapsed</div>
            <div className={`text-2xl font-mono font-bold ${
              crisis.status === 'active' ? 'text-red-500' : 'text-gray-400'
            }`}>
              {elapsedTime || '0m'}
            </div>
          </div>

          {/* Status Controls */}
          <div className="flex items-center space-x-2">
            {crisis.status === 'monitoring' && (
              <button
                onClick={() => onStatusChange('active')}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <Activity className="w-4 h-4" />
                <span>Activate</span>
              </button>
            )}
            {crisis.status === 'active' && (
              <>
                <button
                  onClick={() => onStatusChange('monitoring')}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Pause className="w-4 h-4" />
                  <span>Pause</span>
                </button>
                <button
                  onClick={() => onStatusChange('resolved')}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Resolve</span>
                </button>
              </>
            )}
            {crisis.status === 'resolved' && (
              <div className="flex items-center space-x-2 text-green-500">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-semibold">Crisis Resolved</span>
              </div>
            )}
          </div>

          {/* Severity Adjuster */}
          <div className="flex flex-col space-y-1">
            <div className="text-xs text-gray-400 mb-1">Severity</div>
            <div className="flex space-x-1">
              {(['low', 'medium', 'high', 'critical'] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => onSeverityChange(sev)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    crisis.severity === sev
                      ? getSeverityColor(sev)
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {sev[0].toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
