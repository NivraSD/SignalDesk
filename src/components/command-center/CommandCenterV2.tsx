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
    <div className="flex h-full bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 overflow-hidden">
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
  )
}
