'use client'

import React from 'react'
import {
  Newspaper,
  AlertTriangle,
  MessageSquare,
  Mail,
  Shield,
  Sparkles,
  Zap,
  Target,
  TrendingUp,
  FileText,
  Loader2
} from 'lucide-react'
import type { ContentType } from '@/types/content'

interface QuickCreateButtonsProps {
  onQuickCreate: (type: ContentType) => void
  isGenerating: boolean
  framework?: any
}

interface QuickCreateOption {
  type: ContentType
  label: string
  icon: React.ReactNode
  description: string
  color: string
  priority: boolean
}

const QUICK_CREATE_OPTIONS: QuickCreateOption[] = [
  {
    type: 'press-release',
    label: 'Press Release',
    icon: <Newspaper className="w-4 h-4" />,
    description: 'Professional announcement',
    color: 'blue',
    priority: true
  },
  {
    type: 'crisis-response',
    label: 'Crisis Response',
    icon: <AlertTriangle className="w-4 h-4" />,
    description: 'Urgent situation response',
    color: 'red',
    priority: true
  },
  {
    type: 'social-post',
    label: 'Social Post',
    icon: <MessageSquare className="w-4 h-4" />,
    description: 'Social media content',
    color: 'purple',
    priority: true
  },
  {
    type: 'exec-statement',
    label: 'Executive Statement',
    icon: <Shield className="w-4 h-4" />,
    description: 'Leadership message',
    color: 'green',
    priority: false
  }
]

export default function QuickCreateButtons({ onQuickCreate, isGenerating, framework }: QuickCreateButtonsProps) {
  const priorityOptions = QUICK_CREATE_OPTIONS.filter(opt => opt.priority)
  const otherOptions = QUICK_CREATE_OPTIONS.filter(opt => !opt.priority)

  const getColorClasses = (color: string, isHover = false) => {
    const colors: Record<string, string> = {
      blue: isHover ? 'hover:bg-blue-600/20 hover:border-blue-500' : 'border-blue-600/30',
      red: isHover ? 'hover:bg-red-600/20 hover:border-red-500' : 'border-red-600/30',
      purple: isHover ? 'hover:bg-purple-600/20 hover:border-purple-500' : 'border-purple-600/30',
      green: isHover ? 'hover:bg-green-600/20 hover:border-green-500' : 'border-green-600/30'
    }
    return colors[color] || ''
  }

  const getIconColorClass = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'text-blue-400',
      red: 'text-red-400',
      purple: 'text-purple-400',
      green: 'text-green-400'
    }
    return colors[color] || 'text-gray-400'
  }

  return (
    <div className="space-y-4">
      {/* Quick Create Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-400">Quick Create</h3>
        {framework && (
          <div className="flex items-center gap-1 text-xs text-purple-400">
            <Target className="w-3 h-3" />
            Framework Active
          </div>
        )}
      </div>

      {/* Priority Quick Create Buttons */}
      <div className="grid grid-cols-2 gap-2">
        {priorityOptions.map(option => (
          <button
            key={option.type}
            onClick={() => onQuickCreate(option.type)}
            disabled={isGenerating}
            className={`group relative flex flex-col items-center gap-2 p-3 border rounded-lg transition-all ${
              getColorClasses(option.color)
            } ${getColorClasses(option.color, true)} ${
              isGenerating ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {/* Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 rounded-lg transition-opacity ${
              option.color === 'blue' ? 'from-blue-400 to-blue-600' :
              option.color === 'red' ? 'from-red-400 to-red-600' :
              option.color === 'purple' ? 'from-purple-400 to-purple-600' :
              'from-green-400 to-green-600'
            }`} />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center gap-1">
              <div className={`${getIconColorClass(option.color)}`}>
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  option.icon
                )}
              </div>
              <span className="text-sm font-medium">{option.label}</span>
              <span className="text-xs text-gray-500">{option.description}</span>
            </div>

            {/* Quick Generate Badge */}
            <div className="absolute top-1 right-1">
              <Zap className="w-3 h-3 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        ))}
      </div>

      {/* Secondary Options */}
      <div className="space-y-1">
        {otherOptions.map(option => (
          <button
            key={option.type}
            onClick={() => onQuickCreate(option.type)}
            disabled={isGenerating}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-700/50 transition-colors text-left ${
              isGenerating ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <div className={`${getIconColorClass(option.color)}`}>
              {option.icon}
            </div>
            <div className="flex-1">
              <span className="text-sm">{option.label}</span>
            </div>
            <Sparkles className="w-3 h-3 text-gray-500 opacity-0 hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>

      {/* Framework-Driven Suggestion */}
      {framework && (
        <div className="p-3 bg-purple-900/20 border border-purple-600/30 rounded-lg">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-purple-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-purple-300">AI Recommendation</p>
              <p className="text-xs text-gray-400 mt-1">
                Based on your framework: "{framework.strategy?.objective?.substring(0, 50)}..."
              </p>
              <button
                onClick={() => onQuickCreate('press-release')}
                disabled={isGenerating}
                className="mt-2 px-3 py-1 bg-purple-600/30 hover:bg-purple-600/50 rounded text-xs transition-colors"
              >
                Generate Recommended Content
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Create Option */}
      <button
        disabled={!framework || isGenerating}
        className={`w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg transition-all ${
          !framework || isGenerating
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:from-purple-700 hover:to-blue-700'
        }`}
      >
        <Target className="w-4 h-4" />
        <span className="text-sm font-medium">Generate All Priority Content</span>
      </button>

      {/* Info Text */}
      <p className="text-xs text-gray-500 text-center">
        Quick create uses AI to generate initial drafts based on your framework
      </p>
    </div>
  )
}