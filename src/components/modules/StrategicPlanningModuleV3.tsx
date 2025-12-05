'use client'

import React, { useState, useEffect } from 'react'
import {
  Calendar,
  Target,
  TrendingUp,
  PlayCircle,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Download,
  Filter,
  BarChart3
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface BlueprintData {
  overview?: {
    campaignName?: string
    pattern?: string
    duration?: string
  }
  part1_goalFramework?: {
    primaryObjective?: string
    behavioralGoals?: any[]
  }
  part3_stakeholderOrchestration?: {
    stakeholderOrchestrationPlans?: StakeholderOrchestrationPlan[]
  }
}

interface StakeholderOrchestrationPlan {
  stakeholder?: {
    name: string
    priority: number
    psychologicalProfile?: {
      primaryFear?: string
      primaryAspiration?: string
      decisionTrigger?: string
    }
  }
  influenceLevers?: InfluenceLever[]
}

interface InfluenceLever {
  leverName: string
  leverType: string
  priority: number
  objective: string
  campaign?: {
    mediaPitches?: MediaPitch[]
    socialPosts?: SocialPost[]
    thoughtLeadership?: ThoughtLeadership[]
    additionalTactics?: AdditionalTactic[]
  }
  completionCriteria?: string[]
}

interface MediaPitch {
  who: string
  outlet: string
  beat: string
  what: string
  when: string
}

interface SocialPost {
  who: string
  platform: string
  what: string
  keyMessages: string[]
  when: string
}

interface ThoughtLeadership {
  who: string
  what: string
  where: string
  keyPoints: string[]
  when: string
}

interface AdditionalTactic {
  type: string
  who: string
  what: string
  where: string
  when: string
}

interface ContentItem {
  id: string
  type: 'media_pitch' | 'social_post' | 'thought_leadership' | 'user_action'
  stakeholder: string
  stakeholderPriority: number
  leverName: string
  leverPriority: number
  topic: string
  target?: string
  details: any
  status: 'pending' | 'generating' | 'generated' | 'published'
  generatedContent?: string
  generatedAt?: Date
}

interface StrategicPlanningModuleV3Props {
  blueprint: BlueprintData
  sessionId?: string
  orgId?: string
  onExecute?: (items: ContentItem[]) => void
}

type ViewMode = 'priority' | 'stakeholder' | 'content-type' | 'progress'

export default function StrategicPlanningModuleV3({
  blueprint,
  sessionId,
  orgId,
  onExecute
}: StrategicPlanningModuleV3Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('priority')
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [expandedPriorities, setExpandedPriorities] = useState<Set<number>>(new Set([1]))
  const [expandedStakeholders, setExpandedStakeholders] = useState<Set<string>>(new Set())
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [generating, setGenerating] = useState<Set<string>>(new Set())

  // Parse blueprint into content items on mount
  useEffect(() => {
    if (blueprint?.part3_stakeholderOrchestration?.stakeholderOrchestrationPlans) {
      const items = parseBlueprint(blueprint)
      setContentItems(items)
    }
  }, [blueprint])

  const parseBlueprint = (blueprint: BlueprintData): ContentItem[] => {
    const items: ContentItem[] = []
    let itemId = 0

    const plans = blueprint.part3_stakeholderOrchestration?.stakeholderOrchestrationPlans || []

    plans.forEach(plan => {
      const stakeholderName = plan.stakeholder?.name || 'Unknown Stakeholder'
      const stakeholderPriority = plan.stakeholder?.priority || 4

      plan.influenceLevers?.forEach(lever => {
        const campaign = lever.campaign

        // Media Pitches
        campaign?.mediaPitches?.forEach(pitch => {
          items.push({
            id: `item-${++itemId}`,
            type: 'media_pitch',
            stakeholder: stakeholderName,
            stakeholderPriority,
            leverName: lever.leverName,
            leverPriority: lever.priority,
            topic: pitch.what,
            target: `${pitch.who} (${pitch.outlet})`,
            details: pitch,
            status: 'pending'
          })
        })

        // Social Posts
        campaign?.socialPosts?.forEach(post => {
          items.push({
            id: `item-${++itemId}`,
            type: 'social_post',
            stakeholder: stakeholderName,
            stakeholderPriority,
            leverName: lever.leverName,
            leverPriority: lever.priority,
            topic: post.what,
            target: `${post.who} on ${post.platform}`,
            details: post,
            status: 'pending'
          })
        })

        // Thought Leadership
        campaign?.thoughtLeadership?.forEach(article => {
          items.push({
            id: `item-${++itemId}`,
            type: 'thought_leadership',
            stakeholder: stakeholderName,
            stakeholderPriority,
            leverName: lever.leverName,
            leverPriority: lever.priority,
            topic: article.what,
            target: `${article.who} in ${article.where}`,
            details: article,
            status: 'pending'
          })
        })

        // Additional Tactics (user must execute)
        campaign?.additionalTactics?.forEach(tactic => {
          items.push({
            id: `item-${++itemId}`,
            type: 'user_action',
            stakeholder: stakeholderName,
            stakeholderPriority,
            leverName: lever.leverName,
            leverPriority: lever.priority,
            topic: tactic.what,
            target: `${tactic.who} at ${tactic.where}`,
            details: tactic,
            status: 'pending'
          })
        })
      })
    })

    return items
  }

  const togglePriority = (priority: number) => {
    const newExpanded = new Set(expandedPriorities)
    if (newExpanded.has(priority)) {
      newExpanded.delete(priority)
    } else {
      newExpanded.add(priority)
    }
    setExpandedPriorities(newExpanded)
  }

  const toggleStakeholder = (stakeholder: string) => {
    const newExpanded = new Set(expandedStakeholders)
    if (newExpanded.has(stakeholder)) {
      newExpanded.delete(stakeholder)
    } else {
      newExpanded.add(stakeholder)
    }
    setExpandedStakeholders(newExpanded)
  }

  const handleGenerate = async (item: ContentItem) => {
    setGenerating(prev => new Set(prev).add(item.id))

    try {
      // TODO: Call nivContentIntelligentV2 to generate content
      const supabase = createClient()

      // Simulate for now
      await new Promise(resolve => setTimeout(resolve, 2000))

      setContentItems(prev => prev.map(i =>
        i.id === item.id
          ? { ...i, status: 'generated' as const, generatedAt: new Date() }
          : i
      ))
    } catch (error) {
      console.error('Generation error:', error)
    } finally {
      setGenerating(prev => {
        const newSet = new Set(prev)
        newSet.delete(item.id)
        return newSet
      })
    }
  }

  const handleBatchGenerate = async (items: ContentItem[]) => {
    // Generate all items in sequence
    for (const item of items) {
      await handleGenerate(item)
    }
  }

  const getStatusIcon = (status: ContentItem['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-400" />
      case 'generating':
        return <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
      case 'generated':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />
      case 'published':
        return <CheckCircle className="w-4 h-4 text-green-500" />
    }
  }

  const getContentTypeLabel = (type: ContentItem['type']) => {
    switch (type) {
      case 'media_pitch':
        return { label: 'Media Pitch', icon: '📰', color: 'emerald' }
      case 'social_post':
        return { label: 'Social Post', icon: '📱', color: 'blue' }
      case 'thought_leadership':
        return { label: 'Thought Leadership', icon: '✍️', color: 'purple' }
      case 'user_action':
        return { label: 'User Action Required', icon: '👤', color: 'amber' }
    }
  }

  const priorityLabels: Record<number, { label: string; color: string; description: string }> = {
    1: { label: 'Stage 1: Launch', color: 'red', description: 'Must-have content for launch success' },
    2: { label: 'Stage 2: Amplify', color: 'amber', description: 'High-impact amplification content' },
    3: { label: 'Stage 3: Engage', color: 'blue', description: 'Ongoing engagement content' },
    4: { label: 'Stage 4: Sustain', color: 'gray', description: 'Long-term presence building' }
  }

  // Group items by priority
  const itemsByPriority = contentItems.reduce((acc, item) => {
    const priority = item.stakeholderPriority
    if (!acc[priority]) acc[priority] = []
    acc[priority].push(item)
    return acc
  }, {} as Record<number, ContentItem[]>)

  // Group items by stakeholder
  const itemsByStakeholder = contentItems.reduce((acc, item) => {
    if (!acc[item.stakeholder]) acc[item.stakeholder] = []
    acc[item.stakeholder].push(item)
    return acc
  }, {} as Record<string, ContentItem[]>)

  // Calculate progress
  const totalItems = contentItems.length
  const generatedItems = contentItems.filter(i => i.status === 'generated' || i.status === 'published').length
  const progressPercent = totalItems > 0 ? Math.round((generatedItems / totalItems) * 100) : 0

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {blueprint.overview?.campaignName || 'Strategic Execution Plan'}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {blueprint.part1_goalFramework?.primaryObjective}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-3xl font-bold text-emerald-400">
                {progressPercent}%
              </div>
              <div className="text-xs text-gray-400">
                {generatedItems} of {totalItems} items
              </div>
            </div>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('priority')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'priority'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <Target className="w-4 h-4" />
            By Priority
          </button>
          <button
            onClick={() => setViewMode('stakeholder')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'stakeholder'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <Target className="w-4 h-4" />
            By Stakeholder
          </button>
          <button
            onClick={() => setViewMode('progress')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'progress'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Progress
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {viewMode === 'priority' && (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(priority => {
              const items = itemsByPriority[priority] || []
              if (items.length === 0) return null

              const isExpanded = expandedPriorities.has(priority)
              const { label, color, description } = priorityLabels[priority]

              // Group by stakeholder within this priority
              const stakeholderGroups = items.reduce((acc, item) => {
                if (!acc[item.stakeholder]) acc[item.stakeholder] = []
                acc[item.stakeholder].push(item)
                return acc
              }, {} as Record<string, ContentItem[]>)

              return (
                <div key={priority} className={`bg-${color}-900/20 border border-${color}-500/30 rounded-lg overflow-hidden`}>
                  <button
                    onClick={() => togglePriority(priority)}
                    className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                      <div className="text-left">
                        <p className={`text-lg font-semibold text-${color}-300`}>{label}</p>
                        <p className="text-sm text-gray-400">{description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-white">{items.length}</p>
                        <p className="text-xs text-gray-500">items</p>
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-4 pt-0 space-y-4">
                      {Object.entries(stakeholderGroups).map(([stakeholder, stakeholderItems]) => (
                        <div key={stakeholder} className="bg-gray-800/50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-white font-semibold">{stakeholder}</h4>
                            <button
                              onClick={() => handleBatchGenerate(stakeholderItems.filter(i => i.status === 'pending'))}
                              className="text-xs px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
                            >
                              Generate All ({stakeholderItems.filter(i => i.status === 'pending').length})
                            </button>
                          </div>

                          <div className="space-y-2">
                            {stakeholderItems.map(item => {
                              const typeInfo = getContentTypeLabel(item.type)
                              return (
                                <div
                                  key={item.id}
                                  className={`p-3 bg-${typeInfo.color}-900/10 border border-${typeInfo.color}-500/20 rounded`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-lg">{typeInfo.icon}</span>
                                        <span className={`text-xs font-medium text-${typeInfo.color}-300`}>
                                          {typeInfo.label}
                                        </span>
                                        {getStatusIcon(generating.has(item.id) ? 'generating' : item.status)}
                                      </div>
                                      <p className="text-sm text-white font-medium mb-1">{item.topic}</p>
                                      {item.target && (
                                        <p className="text-xs text-gray-400">{item.target}</p>
                                      )}
                                    </div>
                                    {item.type !== 'user_action' && item.status === 'pending' && (
                                      <button
                                        onClick={() => handleGenerate(item)}
                                        disabled={generating.has(item.id)}
                                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                          generating.has(item.id)
                                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                        }`}
                                      >
                                        {generating.has(item.id) ? 'Generating...' : 'Generate'}
                                      </button>
                                    )}
                                    {item.status === 'generated' && (
                                      <button className="px-3 py-1 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-700">
                                        View
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {viewMode === 'stakeholder' && (
          <div className="space-y-4">
            {Object.entries(itemsByStakeholder).map(([stakeholder, items]) => {
              const isExpanded = expandedStakeholders.has(stakeholder)
              const stakeholderPriority = items[0]?.stakeholderPriority || 4
              const priorityInfo = priorityLabels[stakeholderPriority]

              return (
                <div key={stakeholder} className={`bg-${priorityInfo.color}-900/20 border border-${priorityInfo.color}-500/30 rounded-lg overflow-hidden`}>
                  <button
                    onClick={() => toggleStakeholder(stakeholder)}
                    className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                      <div className="text-left">
                        <p className="text-lg font-semibold text-white">{stakeholder}</p>
                        <p className="text-sm text-gray-400">{priorityInfo.label}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">{items.length}</p>
                      <p className="text-xs text-gray-500">items</p>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-4 pt-0 space-y-2">
                      {items.map(item => {
                        const typeInfo = getContentTypeLabel(item.type)
                        return (
                          <div
                            key={item.id}
                            className={`p-3 bg-${typeInfo.color}-900/10 border border-${typeInfo.color}-500/20 rounded`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-lg">{typeInfo.icon}</span>
                                  <span className={`text-xs font-medium text-${typeInfo.color}-300`}>
                                    {typeInfo.label}
                                  </span>
                                  {getStatusIcon(generating.has(item.id) ? 'generating' : item.status)}
                                </div>
                                <p className="text-sm text-white font-medium mb-1">{item.topic}</p>
                                {item.target && (
                                  <p className="text-xs text-gray-400">{item.target}</p>
                                )}
                              </div>
                              {item.type !== 'user_action' && item.status === 'pending' && (
                                <button
                                  onClick={() => handleGenerate(item)}
                                  disabled={generating.has(item.id)}
                                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                    generating.has(item.id)
                                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                  }`}
                                >
                                  {generating.has(item.id) ? 'Generating...' : 'Generate'}
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {viewMode === 'progress' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Campaign Progress</h3>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Overall Completion</span>
                  <span className="text-white font-semibold">{progressPercent}%</span>
                </div>
                <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-gray-900/50 rounded p-4">
                  <p className="text-sm text-gray-400 mb-1">Total Items</p>
                  <p className="text-3xl font-bold text-white">{totalItems}</p>
                </div>
                <div className="bg-gray-900/50 rounded p-4">
                  <p className="text-sm text-gray-400 mb-1">Generated</p>
                  <p className="text-3xl font-bold text-emerald-400">{generatedItems}</p>
                </div>
                <div className="bg-gray-900/50 rounded p-4">
                  <p className="text-sm text-gray-400 mb-1">Pending</p>
                  <p className="text-3xl font-bold text-amber-400">{totalItems - generatedItems}</p>
                </div>
                <div className="bg-gray-900/50 rounded p-4">
                  <p className="text-sm text-gray-400 mb-1">Generating</p>
                  <p className="text-3xl font-bold text-blue-400">{generating.size}</p>
                </div>
              </div>
            </div>

            {/* Progress by Priority */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">Progress by Priority</h3>
              <div className="space-y-4">
                {[1, 2, 3, 4].map(priority => {
                  const items = itemsByPriority[priority] || []
                  if (items.length === 0) return null

                  const generated = items.filter(i => i.status === 'generated' || i.status === 'published').length
                  const percent = Math.round((generated / items.length) * 100)
                  const { label, color } = priorityLabels[priority]

                  return (
                    <div key={priority}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className={`text-${color}-300`}>{label}</span>
                        <span className="text-white font-semibold">{generated}/{items.length}</span>
                      </div>
                      <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-${color}-500 transition-all duration-500`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
