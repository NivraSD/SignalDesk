'use client'

import { useState } from 'react'
import { CampaignBuilderWizard } from '@/components/campaign-builder/CampaignBuilderWizard'
import { CampaignHistory } from '@/components/campaign-builder/CampaignHistory'
import { useAppStore } from '@/stores/useAppStore'

export default function CampaignBuilderPage() {
  const { organization } = useAppStore()
  const [view, setView] = useState<'builder' | 'history'>('builder')

  return (
    <div className="flex flex-col h-screen bg-black overflow-hidden">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 border-b border-zinc-800 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Campaign Builder</h1>
              <p className="text-sm text-gray-400 mt-1">
                Create strategic PR and VECTOR campaigns with AI
              </p>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2 bg-zinc-900 rounded-lg p-1">
              <button
                onClick={() => setView('builder')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === 'builder'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                New Campaign
              </button>
              <button
                onClick={() => setView('history')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === 'history'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Campaign History
              </button>
            </div>
          </div>

          {/* Organization Context */}
          {organization && (
            <div className="mt-4 flex items-center gap-2 text-sm">
              <span className="text-gray-500">Organization:</span>
              <span className="text-white font-medium">{organization.name}</span>
              <span className="text-gray-600">•</span>
              <span className="text-gray-400">{organization.industry}</span>
            </div>
          )}
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {view === 'builder' ? (
            <CampaignBuilderWizard />
          ) : (
            <div className="p-8">
              <CampaignHistory
                onSelect={(campaign) => {
                  console.log('Selected campaign:', campaign)
                  // Could load campaign into builder
                  setView('builder')
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
