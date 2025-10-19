'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/stores/useAppStore'

interface Campaign {
  id: string
  title: string
  content: string
  metadata: {
    campaign_type: string
    pattern?: string
    positioning?: string
    industry?: string
    stakeholder_groups?: string[]
    timeline_weeks?: number
    goal_category?: string
  }
  tags: string[]
  created_at: string
}

interface CampaignHistoryProps {
  onSelect?: (campaign: Campaign) => void
}

export function CampaignHistory({ onSelect }: CampaignHistoryProps) {
  const { organization } = useAppStore()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'PR_CAMPAIGN' | 'VECTOR_CAMPAIGN'>('all')
  const [filterPattern, setFilterPattern] = useState<string>('all')

  useEffect(() => {
    if (organization) {
      loadCampaigns()
    }
  }, [organization, filterType, filterPattern])

  const loadCampaigns = async () => {
    if (!organization) return

    setIsLoading(true)
    setError(null)

    try {
      const params: any = {
        action: 'search-campaigns',
        orgId: organization.id,
        limit: 50
      }

      if (filterType !== 'all') {
        params.campaignType = filterType
      }

      if (filterPattern !== 'all') {
        params.pattern = filterPattern
      }

      if (searchQuery) {
        params.query = searchQuery
      }

      const response = await fetch('/api/campaign-memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      })

      if (!response.ok) {
        throw new Error('Failed to load campaigns')
      }

      const data = await response.json()
      setCampaigns(data.campaigns || [])

    } catch (err) {
      console.error('Campaign loading error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load campaigns')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    loadCampaigns()
  }

  const patterns = ['all', 'CASCADE', 'MIRROR', 'CHORUS', 'TROJAN', 'NETWORK']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Campaign History</h2>
        <p className="text-gray-400">Browse and reuse past campaign blueprints</p>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search campaigns..."
            className="flex-1 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            Search
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Type:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="all">All</option>
              <option value="PR_CAMPAIGN">PR Campaign</option>
              <option value="VECTOR_CAMPAIGN">VECTOR Campaign</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Pattern:</label>
            <select
              value={filterPattern}
              onChange={(e) => setFilterPattern(e.target.value)}
              className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded text-white text-sm focus:outline-none focus:border-blue-500"
              disabled={filterType === 'PR_CAMPAIGN'}
            >
              {patterns.map(pattern => (
                <option key={pattern} value={pattern}>
                  {pattern === 'all' ? 'All Patterns' : pattern}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      )}

      {/* Campaign List */}
      {!isLoading && campaigns.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">No campaigns found</p>
          <p className="text-sm text-gray-500 mt-2">Create your first campaign to get started</p>
        </div>
      )}

      <div className="grid gap-4">
        {campaigns.map((campaign) => {
          const blueprintData = JSON.parse(campaign.content)
          const isVectorCampaign = campaign.metadata.campaign_type === 'VECTOR_CAMPAIGN'

          return (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-blue-500 transition-all cursor-pointer"
              onClick={() => onSelect?.(campaign)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">{campaign.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {blueprintData.summary || 'Campaign blueprint'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    isVectorCampaign
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {isVectorCampaign ? 'VECTOR' : 'PR'}
                  </span>
                  {campaign.metadata.pattern && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">
                      {campaign.metadata.pattern}
                    </span>
                  )}
                </div>
              </div>

              {/* Metadata */}
              <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                {campaign.metadata.industry && (
                  <div className="flex items-center gap-1">
                    <span>🏢</span>
                    <span>{campaign.metadata.industry}</span>
                  </div>
                )}
                {campaign.metadata.stakeholder_groups && campaign.metadata.stakeholder_groups.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span>👥</span>
                    <span>{campaign.metadata.stakeholder_groups.length} stakeholder groups</span>
                  </div>
                )}
                {campaign.metadata.timeline_weeks && (
                  <div className="flex items-center gap-1">
                    <span>📅</span>
                    <span>{campaign.metadata.timeline_weeks} weeks</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <span>🕒</span>
                  <span>{new Date(campaign.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Tags */}
              {campaign.tags && campaign.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {campaign.tags.slice(0, 5).map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 text-xs bg-zinc-800 text-gray-400 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
