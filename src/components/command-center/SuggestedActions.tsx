'use client'

import React, { useState, useEffect } from 'react'
import { Zap, ArrowRight, Target, FileText, TrendingUp, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface SuggestedAction {
  id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  category: 'opportunity' | 'campaign' | 'intelligence' | 'alert'
  ctaText: string
  ctaAction: () => void
  icon: React.ReactNode
  metadata?: any
}

interface SuggestedActionsProps {
  organizationId: string
  onNavigate?: (tabId: string, context?: any) => void
}

export default function SuggestedActions({ organizationId, onNavigate }: SuggestedActionsProps) {
  const [actions, setActions] = useState<SuggestedAction[]>([])
  const [loading, setLoading] = useState(true)
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    generateSuggestions()
  }, [organizationId])

  const generateSuggestions = async () => {
    try {
      const suggestions: SuggestedAction[] = []

      // 1. Check for high-value opportunities
      const { data: opportunities } = await supabase
        .from('opportunities')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('score', 80)
        .order('score', { ascending: false })
        .limit(3)

      opportunities?.forEach((opp, idx) => {
        // Check expiration
        let urgency = 'medium'
        let expirationNote = ''
        if (opp.strategic_context?.expiration_date) {
          const expiration = new Date(opp.strategic_context.expiration_date)
          const hoursUntilExpiration = (expiration.getTime() - new Date().getTime()) / (1000 * 60 * 60)
          if (hoursUntilExpiration > 0 && hoursUntilExpiration < 24) {
            urgency = 'high'
            expirationNote = ` (expires in ${Math.round(hoursUntilExpiration)}h)`
          }
        }

        if (idx === 0 || urgency === 'high') {
          suggestions.push({
            id: `opp-${opp.id}`,
            title: `Execute ${opp.title}`,
            description: `High-value ${opp.category || 'competitive'} opportunity (Score: ${opp.score})${expirationNote}`,
            priority: urgency as 'high' | 'medium',
            category: 'opportunity',
            ctaText: 'Open & Execute',
            ctaAction: () => {
              onNavigate?.('opportunities', { selectedOpportunityId: opp.id, autoExecute: true })
            },
            icon: <Target className="w-5 h-5" />
          })
        }
      })

      // 2. Check for pending opportunities (not yet executed)
      const { data: pendingOpps } = await supabase
        .from('opportunities')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('executed', false)
        .gte('score', 70)

      if (pendingOpps && pendingOpps.length >= 2) {
        const expiringCount = pendingOpps.filter(opp => {
          if (!opp.strategic_context?.expiration_date) return false
          const expiration = new Date(opp.strategic_context.expiration_date)
          const hoursUntilExpiration = (expiration.getTime() - new Date().getTime()) / (1000 * 60 * 60)
          return hoursUntilExpiration > 0 && hoursUntilExpiration < 48
        }).length

        if (expiringCount > 0) {
          suggestions.push({
            id: 'review-pending',
            title: 'Review pending opportunities',
            description: `${expiringCount} opportunities expire within 48 hours`,
            priority: 'high',
            category: 'opportunity',
            ctaText: 'Open Opportunities',
            ctaAction: () => {
              onNavigate?.('opportunities')
            },
            icon: <AlertCircle className="w-5 h-5" />
          })
        }
      }

      // 3. Check for in-progress campaigns
      const { data: campaigns } = await supabase
        .from('campaign_builder_sessions')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'in_progress')
        .order('updated_at', { ascending: false })

      campaigns?.forEach((campaign, idx) => {
        if (idx === 0) {
          const phase = campaign.current_phase || 'unknown'
          let nextStep = 'Continue campaign'
          if (phase.includes('research')) nextStep = 'Move to blueprint phase'
          else if (phase.includes('blueprint')) nextStep = 'Start execution'
          else if (phase.includes('execution')) nextStep = 'Review content'

          suggestions.push({
            id: `campaign-${campaign.id}`,
            title: `Continue ${campaign.campaign_goal || 'campaign'}`,
            description: `Currently in ${phase} phase - ${nextStep}`,
            priority: 'medium',
            category: 'campaign',
            ctaText: 'Resume Campaign Builder',
            ctaAction: () => {
              onNavigate?.('campaign-builder', { sessionId: campaign.id })
            },
            icon: <FileText className="w-5 h-5" />
          })
        }
      })

      // 4. Check if intelligence scan is needed (no recent opportunities)
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

      const { data: recentOpps } = await supabase
        .from('opportunities')
        .select('created_at')
        .eq('organization_id', organizationId)
        .gte('created_at', oneWeekAgo.toISOString())

      if (!recentOpps || recentOpps.length === 0) {
        suggestions.push({
          id: 'run-intelligence',
          title: 'Run intelligence scan',
          description: 'No opportunities detected in the last 7 days - scan for new opportunities',
          priority: 'medium',
          category: 'intelligence',
          ctaText: 'Start Intelligence Scan',
          ctaAction: () => {
            onNavigate?.('intelligence')
          },
          icon: <TrendingUp className="w-5 h-5" />
        })
      }

      // Sort by priority
      suggestions.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 }
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      })

      // Take top 5
      setActions(suggestions.slice(0, 5))

    } catch (error) {
      console.error('Failed to generate suggestions:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-500/50 bg-red-900/20'
      case 'medium':
        return 'border-yellow-500/50 bg-yellow-900/20'
      case 'low':
        return 'border-blue-500/50 bg-blue-900/20'
      default:
        return 'border-gray-700 bg-gray-800/50'
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-1/3" />
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-20 bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div
        className="flex items-center justify-between mb-3 cursor-pointer group"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          Suggested Actions
        </h3>
        <button className="text-gray-400 hover:text-white transition-colors">
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {!isCollapsed && (
        <>
          {actions.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">All caught up! No urgent actions needed.</p>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {actions.map((action) => (
            <div
              key={action.id}
              className={`flex-shrink-0 w-80 border rounded-lg p-3 hover:border-purple-500/50 transition-all ${getPriorityColor(action.priority)}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-900/50 rounded-lg flex items-center justify-center text-purple-400">
                  {action.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-white truncate">{action.title}</h4>
                    {action.priority === 'high' && (
                      <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-xs font-medium rounded whitespace-nowrap">
                        High
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mb-2 line-clamp-2">{action.description}</p>
                  <button
                    onClick={action.ctaAction}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-medium rounded hover:from-purple-700 hover:to-pink-700 transition-all"
                  >
                    {action.ctaText}
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
        </>
      )}
    </div>
  )
}
