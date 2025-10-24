'use client'

import React, { useState, useEffect } from 'react'
import { Brain } from 'lucide-react'
import NIVPanel from '../niv/NIVPanel'
import LiveActivityFeed from './LiveActivityFeed'
import SuggestedActions from './SuggestedActions'
import { useAppStore } from '@/stores/useAppStore'

interface CommandCenterV2Props {
  onNavigateToTab?: (tabId: string, context?: any) => void
}

export default function CommandCenterV2({ onNavigateToTab }: CommandCenterV2Props) {
  const { organization } = useAppStore()

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-3 border-b border-gray-700 bg-gray-900/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">NIV Strategic Advisor</h1>
              <p className="text-sm text-gray-400">Platform-Aware Guidance & Intelligence</p>
            </div>
          </div>
          {organization && (
            <div className="text-right">
              <p className="text-sm font-medium text-white">{organization.name}</p>
              <p className="text-xs text-gray-400">{organization.industry || 'Technology'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left: NIV Chat (Main) - 2/3 width, full height */}
        <div className="flex-1 w-2/3 border-r border-gray-700 flex flex-col">
          <NIVPanel
            embedded={true}
            onCampaignGenerated={(blueprint) => {
              console.log('Campaign generated:', blueprint)
              onNavigateToTab?.('campaign-planner', { blueprint })
            }}
            onOpportunityDetected={(opportunities) => {
              console.log('Opportunities detected:', opportunities)
              onNavigateToTab?.('opportunities', { opportunities })
            }}
          />
        </div>

        {/* Right: Daily Intelligence Brief + Suggested Actions - 1/3 width, scrollable */}
        <div className="w-1/3 overflow-y-auto flex flex-col">
          <LiveActivityFeed
            organizationId={organization?.id || '1'}
            onNavigate={onNavigateToTab}
          />
          <div className="border-t border-gray-700">
            <SuggestedActions
              organizationId={organization?.id || '1'}
              onNavigate={onNavigateToTab}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
