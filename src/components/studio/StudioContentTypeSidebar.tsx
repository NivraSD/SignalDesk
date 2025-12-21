'use client'

import { useState } from 'react'
import {
  FileText,
  Hash,
  Mail,
  Briefcase,
  AlertTriangle,
  Mic,
  BookOpen,
  MessageSquare,
  Users,
  Image as ImageIcon,
  Video,
  Presentation,
  Megaphone,
  TrendingUp,
  FileCheck,
  Newspaper,
  Tv,
  ChevronRight,
  ChevronDown,
  Library,
  Sparkles,
  X
} from 'lucide-react'
import type { ContentItem } from '@/components/execute/ExecuteTabProduction'
import ContentLibraryWithFolders from '@/components/execute/ContentLibraryWithFolders'
import ContentPrompts from '@/components/execute/ContentPrompts'
import { useAppStore } from '@/stores/useAppStore'

// Content types organized by category
const CONTENT_TYPES = [
  // Written Content
  { id: 'press-release', label: 'Press Release', icon: FileText, category: 'Written' },
  { id: 'blog-post', label: 'Blog Post', icon: BookOpen, category: 'Written' },
  { id: 'thought-leadership', label: 'Thought Leadership', icon: TrendingUp, category: 'Written' },
  { id: 'case-study', label: 'Case Study', icon: FileCheck, category: 'Written' },
  { id: 'white-paper', label: 'White Paper', icon: FileText, category: 'Written' },
  { id: 'qa-document', label: 'Q&A Document', icon: MessageSquare, category: 'Written' },

  // Social & Digital
  { id: 'social-post', label: 'Social Media Post', icon: Hash, category: 'Social' },
  { id: 'linkedin-article', label: 'LinkedIn Article', icon: Briefcase, category: 'Social' },
  { id: 'twitter-thread', label: 'Twitter Thread', icon: Hash, category: 'Social' },
  { id: 'instagram', label: 'Instagram', icon: ImageIcon, category: 'Social' },
  { id: 'facebook-post', label: 'Facebook Post', icon: Hash, category: 'Social' },

  // Email & Campaigns
  { id: 'email', label: 'Email Campaign', icon: Mail, category: 'Email' },
  { id: 'newsletter', label: 'Newsletter', icon: Newspaper, category: 'Email' },
  { id: 'drip-sequence', label: 'Email Drip Sequence', icon: Mail, category: 'Email' },
  { id: 'cold-outreach', label: 'Cold Outreach', icon: Mail, category: 'Email' },

  // Executive & Crisis
  { id: 'executive-statement', label: 'Executive Statement', icon: Briefcase, category: 'Executive' },
  { id: 'board-presentation', label: 'Board Presentation', icon: Presentation, category: 'Executive' },
  { id: 'investor-update', label: 'Investor Update', icon: TrendingUp, category: 'Executive' },
  { id: 'crisis-response', label: 'Crisis Response', icon: AlertTriangle, category: 'Executive' },
  { id: 'apology-statement', label: 'Apology Statement', icon: MessageSquare, category: 'Executive' },

  // Media & PR
  { id: 'media-pitch', label: 'Media Pitch', icon: Megaphone, category: 'Media' },
  { id: 'media-list', label: 'Media List', icon: Users, category: 'Media' },
  { id: 'media-kit', label: 'Media Kit', icon: Briefcase, category: 'Media' },
  { id: 'podcast-pitch', label: 'Podcast Pitch', icon: Mic, category: 'Media' },
  { id: 'tv-interview-prep', label: 'TV Interview Prep', icon: Tv, category: 'Media' },

  // Strategy & Messaging
  { id: 'media-plan', label: 'Media Plan', icon: FileCheck, category: 'Strategy' },
  { id: 'proposal', label: 'Proposal', icon: FileText, category: 'Strategy' },
  { id: 'messaging', label: 'Messaging Framework', icon: MessageSquare, category: 'Strategy' },
  { id: 'brand-narrative', label: 'Brand Narrative', icon: BookOpen, category: 'Strategy' },
  { id: 'value-proposition', label: 'Value Proposition', icon: TrendingUp, category: 'Strategy' },
  { id: 'competitive-positioning', label: 'Competitive Positioning', icon: TrendingUp, category: 'Strategy' },

  // Visual Content
  { id: 'image', label: 'Image', icon: ImageIcon, category: 'Visual' },
  { id: 'infographic', label: 'Infographic', icon: ImageIcon, category: 'Visual' },
  { id: 'social-graphics', label: 'Social Graphics', icon: ImageIcon, category: 'Visual' },
  { id: 'presentation', label: 'Presentation', icon: Presentation, category: 'Visual' },
  { id: 'video', label: 'Video (Veo)', icon: Video, category: 'Visual' }
]

interface StudioContentTypeSidebarProps {
  selectedContentType: string
  onContentTypeSelect: (typeId: string) => void
  generatedItems: ContentItem[]
  onItemSelect: (item: ContentItem) => void
}

export default function StudioContentTypeSidebar({
  selectedContentType,
  onContentTypeSelect,
  generatedItems,
  onItemSelect
}: StudioContentTypeSidebarProps) {
  const { organization } = useAppStore()
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [showLibrary, setShowLibrary] = useState(false)
  const [showPrompts, setShowPrompts] = useState(false)

  // Group content types by category
  const groupedContentTypes = CONTENT_TYPES.reduce((acc, type) => {
    if (!acc[type.category]) {
      acc[type.category] = []
    }
    acc[type.category].push(type)
    return acc
  }, {} as Record<string, typeof CONTENT_TYPES>)

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      return newSet
    })
  }

  return (
    <>
      {/* Sidebar */}
      <div className="bg-white border-r border-[var(--grey-200)] flex flex-col overflow-hidden">
        {/* Header with Library/Prompts toggles */}
        <div className="p-4 border-b border-[var(--grey-200)]">
          <div className="flex items-center justify-between mb-3">
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--grey-500)', fontFamily: 'var(--font-display)' }}
            >
              Content Types
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPrompts(!showPrompts)}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                showPrompts
                  ? 'bg-[var(--burnt-orange-muted)] text-[var(--burnt-orange)] border border-[var(--burnt-orange)]'
                  : 'bg-[var(--grey-100)] text-[var(--grey-600)] hover:bg-[var(--grey-200)]'
              }`}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Prompts
            </button>
            <button
              onClick={() => setShowLibrary(!showLibrary)}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                showLibrary
                  ? 'bg-[var(--burnt-orange-muted)] text-[var(--burnt-orange)] border border-[var(--burnt-orange)]'
                  : 'bg-[var(--grey-100)] text-[var(--grey-600)] hover:bg-[var(--grey-200)]'
              }`}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <Library className="w-3.5 h-3.5" />
              Library
            </button>
          </div>
        </div>

        {/* Content Types List */}
        <div className="flex-1 overflow-y-auto p-3">
          {Object.entries(groupedContentTypes).map(([category, types]) => (
            <div key={category} className="mb-1">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full px-2 py-2 flex items-center justify-between hover:bg-[var(--grey-100)] rounded-md transition-colors"
              >
                <span
                  className="text-xs font-medium uppercase tracking-wide"
                  style={{ color: 'var(--grey-500)', fontFamily: 'var(--font-display)' }}
                >
                  {category}
                </span>
                {expandedCategories.has(category) ? (
                  <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--grey-400)' }} />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--grey-400)' }} />
                )}
              </button>

              {/* Category Items */}
              {expandedCategories.has(category) && (
                <div className="mt-1 space-y-0.5">
                  {types.map(type => {
                    const Icon = type.icon
                    const isSelected = selectedContentType === type.id

                    return (
                      <button
                        key={type.id}
                        onClick={() => onContentTypeSelect(type.id)}
                        className={`w-full px-3 py-2.5 rounded-md text-left transition-all flex items-center gap-2.5 ${
                          isSelected
                            ? 'bg-[var(--burnt-orange-muted)] text-[var(--burnt-orange)]'
                            : 'hover:bg-[var(--grey-100)] text-[var(--grey-600)] hover:text-[var(--charcoal)]'
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" style={{ opacity: 0.7 }} />
                        <span className="text-sm">{type.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Recent Generated Items */}
        {generatedItems.length > 0 && (
          <div className="border-t border-[var(--grey-200)] p-3">
            <span
              className="text-xs font-medium uppercase tracking-wide block mb-2 px-2"
              style={{ color: 'var(--grey-500)', fontFamily: 'var(--font-display)' }}
            >
              Recent ({generatedItems.length})
            </span>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {generatedItems.slice(-5).reverse().map(item => (
                <button
                  key={item.id}
                  onClick={() => onItemSelect(item)}
                  className="w-full px-3 py-2 rounded-md text-left hover:bg-[var(--grey-100)] text-sm text-[var(--grey-600)] truncate flex items-center gap-2"
                >
                  <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{item.title || item.type}</span>
                  {item.saved && (
                    <span className="ml-auto text-xs text-[var(--success)]">saved</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Library Slide-out Panel */}
      {showLibrary && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowLibrary(false)} />
          <div className="relative w-[420px] ml-72 h-full bg-white border-r border-[var(--grey-200)] shadow-xl flex flex-col animate-slide-up">
            <div className="p-4 border-b border-[var(--grey-200)] flex items-center justify-between">
              <h3
                className="text-lg font-medium"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--charcoal)' }}
              >
                Content Library
              </h3>
              <button
                onClick={() => setShowLibrary(false)}
                className="p-2 hover:bg-[var(--grey-100)] rounded-lg transition-colors"
              >
                <X className="w-5 h-5" style={{ color: 'var(--grey-500)' }} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ContentLibraryWithFolders
                organization={organization}
                onContentSelect={(item: any) => {
                  onItemSelect(item as ContentItem)
                  setShowLibrary(false)
                }}
                className="h-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Prompts Slide-out Panel */}
      {showPrompts && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowPrompts(false)} />
          <div className="relative w-[600px] ml-72 h-full bg-white border-r border-[var(--grey-200)] shadow-xl flex flex-col animate-slide-up">
            <div className="p-4 border-b border-[var(--grey-200)] flex items-center justify-between">
              <h3
                className="text-lg font-medium flex items-center gap-2"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--charcoal)' }}
              >
                <Sparkles className="w-5 h-5" style={{ color: 'var(--burnt-orange)' }} />
                Content Prompts
              </h3>
              <button
                onClick={() => setShowPrompts(false)}
                className="p-2 hover:bg-[var(--grey-100)] rounded-lg transition-colors"
              >
                <X className="w-5 h-5" style={{ color: 'var(--grey-500)' }} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ContentPrompts />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
