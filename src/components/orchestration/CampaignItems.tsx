'use client'

import React, { useState } from 'react'
import {
  FolderOpen,
  FileText,
  Image,
  Mail,
  BarChart,
  Clock,
  ExternalLink,
  Plus,
  Grid,
  List
} from 'lucide-react'

interface CampaignItem {
  id: string
  type: 'content' | 'media' | 'intelligence' | 'asset'
  title: string
  format: string
  createdAt: Date
  createdBy: string
  preview?: string
}

interface CampaignItemsProps {
  strategyId: string
  items: CampaignItem[]
  onOpenItem?: (item: CampaignItem) => void
}

export function CampaignItems({ strategyId, items, onOpenItem }: CampaignItemsProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedType, setSelectedType] = useState<string>('all')

  // Group items by type
  const itemsByType = items.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = []
    acc[item.type].push(item)
    return acc
  }, {} as Record<string, CampaignItem[]>)

  const filteredItems = selectedType === 'all'
    ? items
    : itemsByType[selectedType] || []

  const typeConfig = {
    content: {
      label: 'Content',
      icon: <FileText className="w-4 h-4" />,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    media: {
      label: 'Media',
      icon: <Mail className="w-4 h-4" />,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10'
    },
    intelligence: {
      label: 'Intelligence',
      icon: <BarChart className="w-4 h-4" />,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10'
    },
    asset: {
      label: 'Assets',
      icon: <Image className="w-4 h-4" />,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10'
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold" style={{ color: '#ffaa00' }}>
          Campaign Items
        </h3>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-gray-700' : ''}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-gray-700' : ''}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Add Item Button */}
          <button className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm">
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      </div>

      {/* Type Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => setSelectedType('all')}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
            selectedType === 'all'
              ? 'bg-yellow-500/20 text-yellow-400'
              : 'bg-gray-800 hover:bg-gray-700'
          }`}
        >
          All ({items.length})
        </button>

        {Object.entries(itemsByType).map(([type, typeItems]) => {
          const config = typeConfig[type as keyof typeof typeConfig]
          return (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                selectedType === type
                  ? `${config.bgColor} ${config.color}`
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              {config.icon}
              {config.label} ({typeItems.length})
            </button>
          )
        })}
      </div>

      {/* Items Display */}
      {filteredItems.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filteredItems.map(item => (
              <ItemCard key={item.id} item={item} config={typeConfig} onOpen={onOpenItem} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredItems.map(item => (
              <ItemRow key={item.id} item={item} config={typeConfig} onOpen={onOpenItem} />
            ))}
          </div>
        )
      ) : (
        <div className="py-12 text-center text-gray-500">
          <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No items generated yet</p>
          <p className="text-xs mt-1">Execute workflows to generate campaign content</p>
        </div>
      )}
    </div>
  )
}

// Grid View Card
function ItemCard({
  item,
  config,
  onOpen
}: {
  item: CampaignItem
  config: any
  onOpen?: (item: CampaignItem) => void
}) {
  const typeConfig = config[item.type]

  return (
    <div
      onClick={() => onOpen?.(item)}
      className="p-4 bg-gray-800/50 hover:bg-gray-800 rounded-lg cursor-pointer transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${typeConfig.bgColor}`}>
          {typeConfig.icon}
        </div>
        <button className="p-1 hover:bg-gray-700 rounded">
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      <h4 className="font-medium text-sm mb-1 line-clamp-2">{item.title}</h4>

      {item.preview && (
        <p className="text-xs text-gray-400 line-clamp-2 mb-2">{item.preview}</p>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{item.format}</span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(item.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  )
}

// List View Row
function ItemRow({
  item,
  config,
  onOpen
}: {
  item: CampaignItem
  config: any
  onOpen?: (item: CampaignItem) => void
}) {
  const typeConfig = config[item.type]

  return (
    <div
      onClick={() => onOpen?.(item)}
      className="flex items-center gap-4 p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg cursor-pointer transition-all"
    >
      <div className={`p-2 rounded-lg ${typeConfig.bgColor}`}>
        {typeConfig.icon}
      </div>

      <div className="flex-1">
        <h4 className="font-medium text-sm">{item.title}</h4>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
          <span>{item.format}</span>
          <span>•</span>
          <span>{item.createdBy}</span>
          <span>•</span>
          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <button className="p-2 hover:bg-gray-700 rounded">
        <ExternalLink className="w-4 h-4" />
      </button>
    </div>
  )
}