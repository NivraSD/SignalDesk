'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface SimilarCampaign {
  id: string
  title: string
  content: string
  metadata: {
    campaign_type: string
    pattern?: string
    positioning?: string
    industry?: string
    stakeholder_groups?: string[]
  }
  created_at: string
}

interface SimilarCampaignsProps {
  orgId: string
  industry?: string
  stakeholderGroups?: string[]
  goalCategory?: string
  onSelect?: (campaign: SimilarCampaign) => void
}

export function SimilarCampaigns({
  orgId,
  industry,
  stakeholderGroups = [],
  goalCategory,
  onSelect
}: SimilarCampaignsProps) {
  const [campaigns, setCampaigns] = useState<SimilarCampaign[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (orgId && (industry || stakeholderGroups.length > 0 || goalCategory)) {
      loadSimilarCampaigns()
    }
  }, [orgId, industry, stakeholderGroups, goalCategory])

  const loadSimilarCampaigns = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/campaign-memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'find-similar',
          orgId,
          industry,
          stakeholderGroups,
          goalCategory
        })
      })

      if (!response.ok) {
        throw new Error('Failed to load similar campaigns')
      }

      const data = await response.json()
      setCampaigns(data.similarCampaigns || [])

    } catch (err) {
      console.error('Similar campaigns error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load similar campaigns')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-4">Similar Campaigns</h3>
        <div className="flex justify-center py-8">
          <svg className="animate-spin h-6 w-6 text-blue-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-4">Similar Campaigns</h3>
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    )
  }

  if (campaigns.length === 0) {
    return (
      <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-4">Similar Campaigns</h3>
        <p className="text-gray-400 text-sm">No similar campaigns found</p>
        <p className="text-gray-500 text-xs mt-1">
          As you create more campaigns, we'll show relevant examples here
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg">
      <h3 className="text-lg font-semibold text-white mb-4">
        Similar Campaigns ({campaigns.length})
      </h3>
      <p className="text-sm text-gray-400 mb-4">
        Past campaigns with similar goals or audiences
      </p>

      <div className="space-y-3">
        {campaigns.map((campaign) => {
          const blueprintData = JSON.parse(campaign.content)
          const isVectorCampaign = campaign.metadata.campaign_type === 'VECTOR_CAMPAIGN'

          return (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer border border-transparent hover:border-blue-500/50"
              onClick={() => onSelect?.(campaign)}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-white text-sm">{campaign.title}</h4>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  isVectorCampaign
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {isVectorCampaign ? 'VECTOR' : 'PR'}
                </span>
              </div>

              <p className="text-xs text-gray-400 line-clamp-2 mb-2">
                {blueprintData.summary || 'Campaign blueprint'}
              </p>

              <div className="flex items-center gap-3 text-xs text-gray-500">
                {campaign.metadata.industry && (
                  <span>🏢 {campaign.metadata.industry}</span>
                )}
                {campaign.metadata.pattern && (
                  <span>🎯 {campaign.metadata.pattern}</span>
                )}
                {campaign.metadata.stakeholder_groups && campaign.metadata.stakeholder_groups.length > 0 && (
                  <span>👥 {campaign.metadata.stakeholder_groups.length}</span>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      <button
        onClick={() => {/* Could open full history modal */}}
        className="w-full mt-4 py-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
      >
        View all similar campaigns →
      </button>
    </div>
  )
}
