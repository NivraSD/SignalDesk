'use client'

import React from 'react'
import { Target, Sparkles, Play, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import type { OrchestrationSession } from '@/types/content'

interface FrameworkBannerProps {
  session: OrchestrationSession
  onGenerateAll: () => void
  isGenerating: boolean
}

export default function FrameworkBanner({ session, onGenerateAll, isGenerating }: FrameworkBannerProps) {
  const progress = session.progress
  const progressPercentage = progress.total > 0
    ? Math.round((progress.completed / progress.total) * 100)
    : 0

  return (
    <div className="framework-banner bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-b border-gray-700 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Target className="w-5 h-5 text-purple-400" />
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-200">Active Framework</h3>
            <p className="text-xs text-gray-400 mt-0.5 max-w-md truncate">
              {session.objective}
            </p>
          </div>

          {/* Progress Indicators */}
          <div className="flex items-center gap-6 ml-8">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm">
                <span className="text-green-400 font-medium">{progress.completed}</span>
                <span className="text-gray-400"> completed</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-400" />
              <span className="text-sm">
                <span className="text-yellow-400 font-medium">{progress.inProgress}</span>
                <span className="text-gray-400"> in progress</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-gray-400" />
              <span className="text-sm">
                <span className="text-gray-300 font-medium">
                  {progress.total - progress.completed - progress.inProgress}
                </span>
                <span className="text-gray-400"> pending</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Progress Bar */}
          <div className="w-32">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">Progress</span>
              <span className="text-xs text-gray-300">{progressPercentage}%</span>
            </div>
            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Generate All Button */}
          <button
            onClick={onGenerateAll}
            disabled={isGenerating || progressPercentage === 100}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isGenerating || progressPercentage === 100
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
            }`}
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating...
              </>
            ) : progressPercentage === 100 ? (
              <>
                <CheckCircle className="w-4 h-4" />
                All Complete
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate All Priority
              </>
            )}
          </button>

          {/* View All Button */}
          <button className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm">
            View All
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="flex gap-4 mt-3 pt-3 border-t border-gray-700/50">
        <div className="text-xs text-gray-400">
          <span className="font-medium text-gray-300">Narrative:</span> {session.narrative?.substring(0, 100)}...
        </div>
        <div className="text-xs text-gray-400">
          <span className="font-medium text-gray-300">Proof Points:</span> {session.proofPoints?.length || 0}
        </div>
      </div>
    </div>
  )
}