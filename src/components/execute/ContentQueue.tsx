'use client'

import React, { useState, useEffect } from 'react'
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Plus,
  Zap,
  BarChart3,
  Loader2,
  FileText,
  Hash,
  Mail,
  Image as ImageIcon,
  Video,
  Presentation,
  MessageSquare,
  Target,
  TrendingUp
} from 'lucide-react'
import type { NivStrategicFramework } from '@/types/niv-strategic-framework'

// Queue item type
export interface QueueItem {
  id: string
  content: string
  type?: string  // press-release, social-post, email, etc.
  priority: 'immediate' | 'high' | 'medium' | 'low'
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  source: 'framework' | 'opportunity' | 'manual'
  deadline?: string
  assignedTo?: string
  metadata?: {
    framework?: NivStrategicFramework
    opportunity?: any
    playbook?: any
    audience?: string[]
    channels?: string[]
    keyMessages?: string[]
  }
  progress?: number
  createdAt: number
  completedAt?: number
  error?: string
}

interface ContentQueueProps {
  framework?: NivStrategicFramework
  opportunity?: any
  onItemSelect?: (item: QueueItem) => void
  onBulkGenerate?: (items: QueueItem[]) => void
  onQueueUpdate?: (items: QueueItem[]) => void
  className?: string
}

// Content type mapping
const CONTENT_TYPE_INFO: Record<string, { icon: any, color: string, label: string }> = {
  'press-release': { icon: FileText, color: 'text-blue-400', label: 'Press Release' },
  'social-post': { icon: Hash, color: 'text-purple-400', label: 'Social Post' },
  'email': { icon: Mail, color: 'text-green-400', label: 'Email Campaign' },
  'image': { icon: ImageIcon, color: 'text-orange-400', label: 'Image' },
  'video': { icon: Video, color: 'text-red-400', label: 'Video' },
  'presentation': { icon: Presentation, color: 'text-indigo-400', label: 'Presentation' },
  'thought-leadership': { icon: MessageSquare, color: 'text-teal-400', label: 'Thought Leadership' }
}

// Priority colors
const PRIORITY_CONFIG = {
  immediate: { color: 'bg-red-500', label: 'IMMEDIATE', textColor: 'text-red-400' },
  high: { color: 'bg-orange-500', label: 'HIGH', textColor: 'text-orange-400' },
  medium: { color: 'bg-yellow-500', label: 'MEDIUM', textColor: 'text-yellow-400' },
  low: { color: 'bg-gray-500', label: 'LOW', textColor: 'text-gray-400' }
}

export default function ContentQueue({
  framework,
  opportunity,
  onItemSelect,
  onBulkGenerate,
  onQueueUpdate,
  className = ''
}: ContentQueueProps) {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([])
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [isProcessing, setIsProcessing] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  // Populate from framework content needs
  useEffect(() => {
    if (framework?.strategy?.content_needs) {
      const { priority_content, supporting_content } = framework.strategy.content_needs

      // Create queue items from priority content
      const priorityItems: QueueItem[] = (priority_content || []).map((content, idx) => {
        // Try to detect content type from the string
        const type = detectContentType(content)

        return {
          id: `framework-priority-${Date.now()}-${idx}`,
          content,
          type,
          priority: 'high' as const,
          status: 'pending' as const,
          source: 'framework' as const,
          metadata: {
            framework,
            audience: framework.strategy.target_audience,
            keyMessages: framework.strategy.key_messages
          },
          createdAt: Date.now()
        }
      })

      // Create queue items from supporting content
      const supportingItems: QueueItem[] = (supporting_content || []).map((content, idx) => {
        const type = detectContentType(content)

        return {
          id: `framework-supporting-${Date.now()}-${idx}`,
          content,
          type,
          priority: 'medium' as const,
          status: 'pending' as const,
          source: 'framework' as const,
          metadata: {
            framework,
            audience: framework.strategy.target_audience,
            keyMessages: framework.strategy.key_messages
          },
          createdAt: Date.now()
        }
      })

      const newItems = [...priorityItems, ...supportingItems]
      setQueueItems(prev => {
        // Avoid duplicates
        const existingIds = new Set(prev.map(item => item.content))
        const uniqueNewItems = newItems.filter(item => !existingIds.has(item.content))
        return [...prev, ...uniqueNewItems]
      })

      // Notify parent
      if (onQueueUpdate) {
        onQueueUpdate(newItems)
      }
    }
  }, [framework])

  // Populate from opportunity playbook
  useEffect(() => {
    if (opportunity?.playbook) {
      const { assets_needed, channels, key_messages, target_audience } = opportunity.playbook

      // Create queue items from assets needed
      const opportunityItems: QueueItem[] = (assets_needed || []).map((asset: string, idx: number) => {
        const type = detectContentType(asset)

        return {
          id: `opportunity-${Date.now()}-${idx}`,
          content: asset,
          type,
          priority: opportunity.urgency || 'high',
          status: 'pending' as const,
          source: 'opportunity' as const,
          deadline: opportunity.time_window,
          metadata: {
            opportunity,
            playbook: opportunity.playbook,
            channels,
            keyMessages: key_messages,
            audience: [target_audience]
          },
          createdAt: Date.now()
        }
      })

      setQueueItems(prev => {
        // Avoid duplicates
        const existingIds = new Set(prev.map(item => item.content))
        const uniqueNewItems = opportunityItems.filter(item => !existingIds.has(item.content))
        return [...prev, ...uniqueNewItems]
      })

      // Notify parent
      if (onQueueUpdate) {
        onQueueUpdate(opportunityItems)
      }
    }
  }, [opportunity])

  // Detect content type from string
  const detectContentType = (content: string): string => {
    const lower = content.toLowerCase()

    if (lower.includes('press') || lower.includes('release') || lower.includes('announcement')) {
      return 'press-release'
    }
    if (lower.includes('social') || lower.includes('twitter') || lower.includes('linkedin') || lower.includes('post')) {
      return 'social-post'
    }
    if (lower.includes('email') || lower.includes('newsletter') || lower.includes('campaign')) {
      return 'email'
    }
    if (lower.includes('image') || lower.includes('graphic') || lower.includes('visual')) {
      return 'image'
    }
    if (lower.includes('video') || lower.includes('animation')) {
      return 'video'
    }
    if (lower.includes('presentation') || lower.includes('deck') || lower.includes('slides')) {
      return 'presentation'
    }
    if (lower.includes('thought') || lower.includes('article') || lower.includes('blog')) {
      return 'thought-leadership'
    }

    return 'press-release' // default
  }

  // Handle item click
  const handleItemClick = (item: QueueItem) => {
    if (onItemSelect) {
      onItemSelect(item)
    }

    // Mark as in progress
    setQueueItems(prev => prev.map(qi =>
      qi.id === item.id ? { ...qi, status: 'in_progress' as const } : qi
    ))
  }

  // Handle bulk selection
  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  // Handle bulk generate
  const handleBulkGenerate = async () => {
    const itemsToGenerate = queueItems.filter(item =>
      selectedItems.has(item.id) && item.status === 'pending'
    )

    if (itemsToGenerate.length === 0) {
      return
    }

    setIsProcessing(true)

    try {
      if (onBulkGenerate) {
        await onBulkGenerate(itemsToGenerate)
      }

      // Mark items as in progress
      setQueueItems(prev => prev.map(item =>
        selectedItems.has(item.id)
          ? { ...item, status: 'in_progress' as const, progress: 0 }
          : item
      ))

      // Clear selection
      setSelectedItems(new Set())

      // Simulate progress (in real app, this would be updated by actual generation)
      itemsToGenerate.forEach((item, idx) => {
        setTimeout(() => {
          setQueueItems(prev => prev.map(qi =>
            qi.id === item.id
              ? { ...qi, progress: 100, status: 'completed' as const, completedAt: Date.now() }
              : qi
          ))
        }, (idx + 1) * 2000)
      })
    } finally {
      setTimeout(() => setIsProcessing(false), itemsToGenerate.length * 2000)
    }
  }

  // Add manual item
  const handleAddManualItem = (content: string, type: string, priority: 'high' | 'medium' | 'low') => {
    const newItem: QueueItem = {
      id: `manual-${Date.now()}`,
      content,
      type,
      priority,
      status: 'pending',
      source: 'manual',
      createdAt: Date.now()
    }

    setQueueItems(prev => [...prev, newItem])
    setShowAddModal(false)

    if (onQueueUpdate) {
      onQueueUpdate([...queueItems, newItem])
    }
  }

  // Calculate statistics
  const stats = {
    total: queueItems.length,
    pending: queueItems.filter(i => i.status === 'pending').length,
    inProgress: queueItems.filter(i => i.status === 'in_progress').length,
    completed: queueItems.filter(i => i.status === 'completed').length,
    failed: queueItems.filter(i => i.status === 'failed').length
  }

  // Group items by status
  const priorityItems = queueItems.filter(i => i.priority === 'high' || i.priority === 'immediate')
  const inProgressItems = queueItems.filter(i => i.status === 'in_progress')
  const completedItems = queueItems.filter(i => i.status === 'completed')

  return (
    <div className={`content-queue flex flex-col h-full bg-gray-900 border-l border-gray-800 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-3">Content Queue</h3>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-gray-800 rounded-lg p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Pending</span>
              <span className="text-sm font-bold text-yellow-400">{stats.pending}</span>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Completed</span>
              <span className="text-sm font-bold text-green-400">{stats.completed}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-md flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Manual
          </button>
          <button
            onClick={handleBulkGenerate}
            disabled={selectedItems.size === 0 || isProcessing}
            className="flex-1 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-700 disabled:opacity-50 text-black text-sm rounded-md flex items-center justify-center gap-1.5 transition-colors font-medium"
          >
            {isProcessing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5" />
            )}
            Bulk Generate
          </button>
        </div>

        {selectedItems.size > 0 && (
          <div className="mt-2 text-xs text-gray-400">
            {selectedItems.size} items selected
          </div>
        )}
      </div>

      {/* Queue Sections */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Priority Section */}
        {priorityItems.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-orange-400" />
              <h4 className="text-sm font-medium text-white">Priority</h4>
              <span className="text-xs text-gray-500">({priorityItems.length})</span>
            </div>
            <div className="space-y-2">
              {priorityItems.map(item => (
                <QueueItemCard
                  key={item.id}
                  item={item}
                  selected={selectedItems.has(item.id)}
                  onSelect={() => toggleItemSelection(item.id)}
                  onClick={() => handleItemClick(item)}
                />
              ))}
            </div>
          </div>
        )}

        {/* In Progress Section */}
        {inProgressItems.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <h4 className="text-sm font-medium text-white">In Progress</h4>
              <span className="text-xs text-gray-500">({inProgressItems.length})</span>
            </div>
            <div className="space-y-2">
              {inProgressItems.map(item => (
                <QueueItemCard
                  key={item.id}
                  item={item}
                  selected={selectedItems.has(item.id)}
                  onSelect={() => toggleItemSelection(item.id)}
                  onClick={() => handleItemClick(item)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Completed Section */}
        {completedItems.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <h4 className="text-sm font-medium text-white">Completed</h4>
              <span className="text-xs text-gray-500">({completedItems.length})</span>
            </div>
            <div className="space-y-2">
              {completedItems.map(item => (
                <QueueItemCard
                  key={item.id}
                  item={item}
                  selected={selectedItems.has(item.id)}
                  onSelect={() => toggleItemSelection(item.id)}
                  onClick={() => handleItemClick(item)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {queueItems.length === 0 && (
          <div className="text-center py-8">
            <Target className="w-8 h-8 text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No content in queue</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-3 text-xs text-yellow-500 hover:text-yellow-400"
            >
              Add your first item
            </button>
          </div>
        )}
      </div>

      {/* Progress Overview */}
      {stats.total > 0 && (
        <div className="p-4 border-t border-gray-800">
          <button className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-md flex items-center justify-center gap-2 transition-colors">
            <BarChart3 className="w-4 h-4" />
            View Progress Report
          </button>
        </div>
      )}

      {/* Add Manual Item Modal (simplified) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-white mb-4">Add Content to Queue</h3>
            <input
              type="text"
              placeholder="Content description..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm mb-3"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddManualItem(
                    (e.target as HTMLInputElement).value,
                    'press-release',
                    'medium'
                  )
                }
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAddManualItem('New content item', 'press-release', 'medium')}
                className="flex-1 px-3 py-2 bg-yellow-500 hover:bg-yellow-400 text-black text-sm rounded-md font-medium"
              >
                Add to Queue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Queue Item Card Component
function QueueItemCard({
  item,
  selected,
  onSelect,
  onClick
}: {
  item: QueueItem
  selected: boolean
  onSelect: () => void
  onClick: () => void
}) {
  const typeInfo = item.type ? CONTENT_TYPE_INFO[item.type] : null
  const priorityInfo = PRIORITY_CONFIG[item.priority]
  const Icon = typeInfo?.icon || FileText

  return (
    <div
      className={`bg-gray-800 border rounded-lg p-3 cursor-pointer transition-all ${
        selected ? 'border-yellow-500' : 'border-gray-700 hover:border-gray-600'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => {
            e.stopPropagation()
            onSelect()
          }}
          className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-700 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-0"
          onClick={(e) => e.stopPropagation()}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Icon className={`w-3.5 h-3.5 ${typeInfo?.color || 'text-gray-400'}`} />
            <span className={`text-xs font-medium ${priorityInfo.textColor}`}>
              {priorityInfo.label}
            </span>
            {item.source === 'framework' && (
              <span className="text-xs text-purple-400">Framework</span>
            )}
            {item.source === 'opportunity' && (
              <span className="text-xs text-blue-400">Opportunity</span>
            )}
          </div>

          <p className="text-sm text-white line-clamp-2">{item.content}</p>

          {item.deadline && (
            <div className="flex items-center gap-1 mt-2">
              <Clock className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-500">{item.deadline}</span>
            </div>
          )}

          {item.progress !== undefined && item.status === 'in_progress' && (
            <div className="mt-2">
              <div className="bg-gray-700 rounded-full h-1 overflow-hidden">
                <div
                  className="bg-yellow-500 h-full transition-all duration-500"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 mt-1">{item.progress}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}