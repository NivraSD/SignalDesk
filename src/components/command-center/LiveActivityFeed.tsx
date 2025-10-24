'use client'

import React, { useState, useEffect } from 'react'
import { Activity, Target, FileText, AlertCircle, TrendingUp, Users, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface ActivityItem {
  id: string
  type: 'opportunity' | 'intelligence' | 'campaign' | 'content' | 'alert'
  title: string
  description?: string
  timestamp: Date
  metadata?: any
}

interface LiveActivityFeedProps {
  organizationId: string
  onNavigate?: (tabId: string, context?: any) => void
}

export default function LiveActivityFeed({ organizationId, onNavigate }: LiveActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActivities()

    // Refresh every 30 seconds
    const interval = setInterval(loadActivities, 30000)
    return () => clearInterval(interval)
  }, [organizationId])

  const loadActivities = async () => {
    try {
      const items: ActivityItem[] = []

      // Load recent opportunities
      const { data: opportunities } = await supabase
        .from('opportunities')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(5)

      opportunities?.forEach(opp => {
        items.push({
          id: opp.id,
          type: 'opportunity',
          title: 'New opportunity detected',
          description: opp.title,
          timestamp: new Date(opp.created_at),
          metadata: { score: opp.score }
        })
      })

      // Load recent campaigns
      const { data: campaigns } = await supabase
        .from('campaign_builder_sessions')
        .select('*')
        .eq('organization_id', organizationId)
        .order('updated_at', { ascending: false })
        .limit(3)

      campaigns?.forEach(camp => {
        if (camp.updated_at !== camp.created_at) {
          items.push({
            id: camp.id,
            type: 'campaign',
            title: 'Campaign updated',
            description: camp.campaign_goal || 'Unnamed campaign',
            timestamp: new Date(camp.updated_at),
            metadata: { phase: camp.current_phase }
          })
        }
      })

      // TODO: Load intelligence scans and crisis alerts
      // Only show intelligence, opportunities, and crisis - NOT content

      // Sort all items by timestamp
      items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

      // Take top 15 items
      setActivities(items.slice(0, 15))

    } catch (error) {
      console.error('Failed to load activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return <Target className="w-4 h-4 text-purple-400" />
      case 'intelligence':
        return <TrendingUp className="w-4 h-4 text-blue-400" />
      case 'campaign':
        return <FileText className="w-4 h-4 text-green-400" />
      case 'content':
        return <FileText className="w-4 h-4 text-cyan-400" />
      case 'alert':
        return <AlertCircle className="w-4 h-4 text-orange-400" />
      default:
        return <Activity className="w-4 h-4 text-gray-400" />
    }
  }

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  if (loading) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 h-full">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-1/2" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-12 bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800/30 h-full flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-400" />
          Daily Intelligence Brief
        </h2>
        <p className="text-xs text-gray-400 mt-1">Real-time platform activity</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No recent activity</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="bg-gray-900/50 border border-gray-700 rounded-lg p-3 hover:border-purple-500/30 transition-colors cursor-pointer"
              onClick={() => {
                if (activity.type === 'opportunity') {
                  onNavigate?.('opportunities', { selectedId: activity.id })
                } else if (activity.type === 'campaign') {
                  onNavigate?.('campaigns', { selectedId: activity.id })
                }
              }}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-medium text-white truncate">
                      {activity.title}
                    </span>
                    <span className="text-xs text-gray-500 whitespace-nowrap flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                  {activity.description && (
                    <p className="text-xs text-gray-400 truncate mb-1">
                      {activity.description}
                    </p>
                  )}
                  {activity.metadata && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {activity.metadata.score && (
                        <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded">
                          Score: {activity.metadata.score}
                        </span>
                      )}
                      {activity.metadata.phase && (
                        <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded">
                          {activity.metadata.phase}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-xs text-gray-500 text-center">
          Auto-refreshes every 30 seconds
        </p>
      </div>
    </div>
  )
}
