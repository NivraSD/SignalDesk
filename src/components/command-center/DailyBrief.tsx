'use client'

import React, { useState, useEffect } from 'react'
import { Flame, TrendingUp, Target, Zap, AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface DailyBriefProps {
  organizationId: string
  onNavigate?: (tabId: string, context?: any) => void
}

interface BriefData {
  urgent: {
    count: number
    items: Array<{
      title: string
      score: number
      expiresIn?: string
    }>
  }
  trending: {
    narratives: string[]
    journalists: number
  }
  opportunities: {
    total: number
    highUrgency: number
  }
  campaigns: {
    active: number
    topCampaign?: {
      title: string
      progress: string
    }
  }
  monitoring: {
    sentiment: number
    alerts: number
  }
}

export default function DailyBrief({ organizationId, onNavigate }: DailyBriefProps) {
  const [data, setData] = useState<BriefData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    loadBriefData()

    // Subscribe to real-time changes on opportunities table
    const channel = supabase
      .channel('daily-brief-opportunities')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'opportunities',
          filter: `organization_id=eq.${organizationId}`
        },
        () => {
          console.log('📊 DailyBrief: Opportunities changed, refreshing...')
          loadBriefData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [organizationId])

  const loadBriefData = async () => {
    try {
      // Load opportunities
      const { data: opportunities, error: oppError } = await supabase
        .from('opportunities')
        .select('*')
        .eq('organization_id', organizationId)
        .order('score', { ascending: false })

      if (oppError) {
        console.error('Error loading opportunities:', oppError)
      }

      // Calculate urgency (opportunities with near expiration or high scores)
      const now = new Date()
      const urgent = opportunities?.filter(opp => {
        if (opp.strategic_context?.expiration_date) {
          const expiration = new Date(opp.strategic_context.expiration_date)
          const hoursUntilExpiration = (expiration.getTime() - now.getTime()) / (1000 * 60 * 60)
          return hoursUntilExpiration > 0 && hoursUntilExpiration < 48
        }
        return opp.score >= 85
      }) || []

      const highUrgency = opportunities?.filter(opp => opp.score >= 80).length || 0

      // Load campaigns (check for campaigns table or campaign_builder_sessions)
      const { data: campaigns, error: campError } = await supabase
        .from('campaign_builder_sessions')
        .select('*')
        .eq('organization_id', organizationId)
        .order('updated_at', { ascending: false })

      if (campError) {
        console.warn('Campaign builder sessions not available:', campError.message)
      }

      const activeCampaigns = campaigns?.filter(c => c.status === 'in_progress' || c.status === 'active') || []

      setData({
        urgent: {
          count: urgent.length,
          items: urgent.slice(0, 3).map(opp => {
            let expiresIn = ''
            if (opp.strategic_context?.expiration_date) {
              const expiration = new Date(opp.strategic_context.expiration_date)
              const hours = Math.round((expiration.getTime() - now.getTime()) / (1000 * 60 * 60))
              expiresIn = `${hours}h`
            }
            return {
              title: opp.title,
              score: opp.score,
              expiresIn
            }
          })
        },
        trending: {
          narratives: ['AI Safety', 'Regulatory Tech', 'Infrastructure'], // TODO: Pull from monitoring data
          journalists: 0 // TODO: Pull from monitoring data
        },
        opportunities: {
          total: opportunities?.length || 0,
          highUrgency
        },
        campaigns: {
          active: activeCampaigns.length,
          topCampaign: activeCampaigns[0] ? {
            title: activeCampaigns[0].campaign_goal || 'Unnamed Campaign',
            progress: activeCampaigns[0].current_phase || 'Planning'
          } : undefined
        },
        monitoring: {
          sentiment: 72, // TODO: Pull from monitoring data
          alerts: 0 // TODO: Pull from real-time monitoring
        }
      })

    } catch (error) {
      console.error('Failed to load brief data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 h-full">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-1/3" />
          <div className="space-y-3">
            <div className="h-4 bg-gray-700 rounded" />
            <div className="h-4 bg-gray-700 rounded w-5/6" />
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 h-full flex items-center justify-center">
        <p className="text-gray-400">Unable to load intelligence brief</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 h-full">
      <div
        className="flex items-center justify-between mb-6 cursor-pointer group"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          📊 Daily Intelligence Brief
        </h2>
        <button className="text-gray-400 hover:text-white transition-colors">
          {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="space-y-5">
        {/* URGENT Section */}
        <div className="bg-gradient-to-r from-red-900/20 to-orange-900/20 border border-red-500/30 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Flame className="w-4 h-4" />
            Urgent (Next 48h)
          </h3>
          {data.urgent.count === 0 ? (
            <p className="text-sm text-gray-400">No urgent items</p>
          ) : (
            <div className="space-y-2">
              {data.urgent.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-gray-200">{item.title}</span>
                  <div className="flex items-center gap-2">
                    {item.expiresIn && (
                      <span className="text-xs text-orange-400 font-medium">{item.expiresIn}</span>
                    )}
                    <span className="text-xs text-gray-500">Score: {item.score}</span>
                  </div>
                </div>
              ))}
              {data.urgent.count > 3 && (
                <button
                  onClick={() => onNavigate?.('opportunities')}
                  className="text-xs text-purple-400 hover:text-purple-300 font-medium"
                >
                  +{data.urgent.count - 3} more urgent items →
                </button>
              )}
            </div>
          )}
        </div>

        {/* OPPORTUNITIES Section */}
        <div>
          <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wide mb-2 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Opportunities
          </h3>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Total Active</span>
              <span className="text-white font-medium">{data.opportunities.total}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">High Priority</span>
              <span className="text-orange-400 font-medium">{data.opportunities.highUrgency}</span>
            </div>
            <button
              onClick={() => onNavigate?.('opportunities')}
              className="text-xs text-purple-400 hover:text-purple-300 font-medium mt-2"
            >
              View All Opportunities →
            </button>
          </div>
        </div>

        {/* ACTIVE CAMPAIGNS Section */}
        <div>
          <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wide mb-2 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Active Campaigns
          </h3>
          {data.campaigns.active === 0 ? (
            <p className="text-sm text-gray-400">No active campaigns</p>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Running</span>
                <span className="text-white font-medium">{data.campaigns.active}</span>
              </div>
              {data.campaigns.topCampaign && (
                <div className="mt-2 p-2 bg-gray-900/50 rounded border border-gray-700">
                  <div className="text-sm text-white font-medium">{data.campaigns.topCampaign.title}</div>
                  <div className="text-xs text-gray-400 mt-1">Phase: {data.campaigns.topCampaign.progress}</div>
                </div>
              )}
              <button
                onClick={() => onNavigate?.('campaigns')}
                className="text-xs text-purple-400 hover:text-purple-300 font-medium mt-2"
              >
                View All Campaigns →
              </button>
            </div>
          )}
        </div>

        {/* MONITORING Section */}
        <div>
          <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wide mb-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Monitoring Status
          </h3>
          <div className="space-y-1.5">
            {data.monitoring.alerts === 0 ? (
              <div className="flex items-center gap-2 text-sm text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span>No crisis alerts</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-orange-400">
                <AlertTriangle className="w-4 h-4" />
                <span>{data.monitoring.alerts} alerts active</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Sentiment</span>
              <span className="text-green-400 font-medium">{data.monitoring.sentiment}% positive</span>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  )
}
