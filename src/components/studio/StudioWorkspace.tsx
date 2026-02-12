'use client'

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import {
  FileText,
  Save,
  Copy,
  Check,
  RefreshCw,
  Download,
  ExternalLink,
  Sparkles,
  Palette
} from 'lucide-react'
import type { ContentItem } from '@/components/execute/ExecuteTabProduction'
import { useAppStore } from '@/stores/useAppStore'

interface StudioWorkspaceProps {
  content: ContentItem | null
  contentType: string
  onContentSave: (content: ContentItem) => void
  sourceFolder?: string // Folder to save back to (from Memory Vault Edit)
}

export interface StudioWorkspaceRef {
  focusEditor: () => void
}

const StudioWorkspace = forwardRef<StudioWorkspaceRef, StudioWorkspaceProps>(({
  content,
  contentType,
  onContentSave,
  sourceFolder
}, ref) => {
  const { organization } = useAppStore()
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editableContent, setEditableContent] = useState('')
  const [editableTitle, setEditableTitle] = useState('')
  const [isDirty, setIsDirty] = useState(false) // Track if content has been edited
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Expose focus method to parent
  useImperativeHandle(ref, () => ({
    focusEditor: () => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }))

  // Update editable content and title when content prop changes
  useEffect(() => {
    if (content) {
      if (typeof content.content === 'string') {
        setEditableContent(content.content)
      } else if (content.content?.text) {
        setEditableContent(content.content.text)
      } else if (typeof content.content === 'object') {
        setEditableContent(JSON.stringify(content.content, null, 2))
      }
      setEditableTitle(content.title || '')
      setIsDirty(false) // Reset dirty state when new content loads
    }
  }, [content])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editableContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleSave = async () => {
    if (!content) return

    setSaving(true)
    try {
      // Check if this is an update to existing content (from Memory Vault Edit)
      const sourceContentId = content.metadata?.sourceContentId
      const isUpdate = !!sourceContentId

      // Resolve title: use edited title, or fall back to content title, or extract from body
      const resolvedTitle = editableTitle.trim() || content.title || (() => {
        const text = editableContent
        const heading = text.match(/^#\s+(.+)$/m)
        if (heading) return heading[1].trim()
        const first = text.split('\n').find((l: string) => l.trim().length > 0)
        return first ? first.trim().slice(0, 120) : `${content.type} - ${new Date().toLocaleDateString()}`
      })()

      if (isUpdate) {
        // Update existing content in Memory Vault
        console.log('📝 Updating existing content:', sourceContentId)
        const response = await fetch('/api/memory-vault/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: sourceContentId,
            content: editableContent,
            title: resolvedTitle,
            folder: sourceFolder || content.metadata?.folder
          })
        })

        const result = await response.json()
        if (result.success) {
          console.log('✅ Content updated in Memory Vault')
          setIsDirty(false) // Reset dirty state after successful save
          onContentSave({ ...content, saved: true })
        } else {
          throw new Error(result.error || 'Update failed')
        }
      } else {
        // Create new content
        const response = await fetch('/api/content-library/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: {
              type: content.type,
              title: resolvedTitle,
              content: editableContent,
              organization_id: organization?.id,
              timestamp: new Date().toISOString(),
              folder: sourceFolder // Use sourceFolder if provided
            },
            metadata: content.metadata
          })
        })

        const result = await response.json()
        if (result.success) {
          setIsDirty(false) // Reset dirty state after successful save
          onContentSave({ ...content, saved: true })
        }
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save content: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  // Get content type display name
  const getContentTypeLabel = (type: string) => {
    return type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  // Check if content is visual (image, video, presentation)
  const isVisualContent = content?.type === 'image' ||
    content?.type === 'video' ||
    content?.type === 'presentation' ||
    content?.metadata?.type === 'image' ||
    content?.metadata?.type === 'video' ||
    content?.metadata?.type === 'presentation'

  // Extract URL for visual content
  const getVisualUrl = () => {
    if (!content) return null
    return content.content?.url ||
      content.content?.imageUrl ||
      content.content?.videoUrl ||
      content.content?.presentationUrl ||
      content.metadata?.url ||
      content.metadata?.imageUrl ||
      null
  }

  return (
    <div className="bg-[var(--charcoal)] border border-zinc-800 rounded-xl flex flex-col overflow-hidden h-full">
      {/* Toolbar */}
      <div className="border-b border-zinc-800 px-5 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex-shrink-0">
              <div
                className="text-[0.65rem] uppercase tracking-[0.15em] text-[var(--burnt-orange)] flex items-center gap-2 mb-1"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <Palette className="w-3 h-3" />
                Studio
              </div>
              <h2 className="text-[1.25rem] font-normal text-white" style={{ fontFamily: 'var(--font-serif)' }}>
                Content Studio
              </h2>
            </div>
            {content && (
              <>
                <span className="text-zinc-600 flex-shrink-0">|</span>
                <span
                  className="px-2.5 py-1 rounded text-xs font-medium uppercase tracking-wide flex-shrink-0"
                  style={{
                    background: 'var(--burnt-orange-muted)',
                    color: 'var(--burnt-orange)',
                    fontFamily: 'var(--font-display)'
                  }}
                >
                  {getContentTypeLabel(content.type)}
                </span>
                <input
                  type="text"
                  value={editableTitle}
                  onChange={(e) => {
                    setEditableTitle(e.target.value)
                    setIsDirty(true) // Mark as dirty when title is edited
                  }}
                  className="bg-transparent border-none text-white text-sm font-medium focus:outline-none min-w-0 flex-1 truncate"
                  style={{ fontFamily: 'var(--font-display)' }}
                  placeholder="Enter title..."
                />
              </>
            )}
          </div>

          {content && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 text-xs font-medium rounded-md border transition-colors flex items-center gap-1.5"
                style={{
                  background: 'transparent',
                  borderColor: 'var(--grey-700)',
                  color: 'var(--grey-400)',
                  fontFamily: 'var(--font-display)'
                }}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || (content.saved && !isDirty)}
                className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 disabled:opacity-50"
                style={{
                  background: (content.saved && !isDirty) ? 'var(--grey-800)' : 'var(--burnt-orange)',
                  color: 'var(--white)',
                  fontFamily: 'var(--font-display)'
                }}
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Saving...' : (content.saved && !isDirty) ? 'Saved' : isDirty ? 'Save Changes' : 'Save'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-y-auto p-8">
        {!content ? (
          // Empty State
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center mb-6"
              style={{ background: 'var(--grey-800)' }}
            >
              <Sparkles className="w-8 h-8" style={{ color: 'var(--burnt-orange)' }} />
            </div>
            <h3
              className="text-xl font-medium mb-3"
              style={{ color: 'var(--white)', fontFamily: 'var(--font-display)' }}
            >
              {contentType ? `Ready to create ${getContentTypeLabel(contentType)}` : 'Welcome to Studio'}
            </h3>
            <p className="text-sm max-w-lg mb-6" style={{ color: 'var(--grey-400)', lineHeight: '1.6' }}>
              {contentType
                ? 'Use the NIV panel on the right to generate content. Your content will appear here for editing.'
                : 'Create any type of content with AI assistance. Press releases, social posts, media pitches, presentations — NIV helps you craft professional content in seconds.'
              }
            </p>
            {!contentType && (
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-6 text-xs" style={{ color: 'var(--grey-500)' }}>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[0.65rem] font-semibold" style={{ background: 'var(--burnt-orange)', color: 'var(--white)' }}>1</span>
                    <span>Select content type</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[0.65rem] font-semibold" style={{ background: 'var(--grey-700)', color: 'var(--grey-400)' }}>2</span>
                    <span>Chat with NIV</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[0.65rem] font-semibold" style={{ background: 'var(--grey-700)', color: 'var(--grey-400)' }}>3</span>
                    <span>Edit & save</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : isVisualContent ? (
          // Visual Content Display
          <div className="max-w-3xl mx-auto">
            <div
              className="rounded-xl overflow-hidden border"
              style={{ borderColor: 'var(--grey-800)', background: 'var(--grey-900)' }}
            >
              {/* Visual Content Header */}
              <div
                className="px-5 py-4 border-b flex items-center justify-between"
                style={{ borderColor: 'var(--grey-800)' }}
              >
                <span
                  className="text-xs font-medium uppercase tracking-wider"
                  style={{ color: 'var(--burnt-orange)', fontFamily: 'var(--font-display)' }}
                >
                  Generated {content.type}
                </span>
              </div>

              {/* Visual Content Body */}
              <div className="p-6">
                {content.type === 'image' || content.metadata?.type === 'image' ? (
                  <img
                    src={getVisualUrl() || ''}
                    alt="Generated image"
                    className="w-full rounded-lg"
                  />
                ) : content.type === 'video' || content.metadata?.type === 'video' ? (
                  <video
                    src={getVisualUrl() || ''}
                    controls
                    className="w-full rounded-lg"
                  />
                ) : content.type === 'presentation' || content.metadata?.type === 'presentation' ? (
                  <div className="text-center py-8">
                    <a
                      href={getVisualUrl() || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium transition-colors"
                      style={{ background: 'var(--burnt-orange)', fontFamily: 'var(--font-display)' }}
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Presentation
                    </a>
                    {content.metadata?.pptx_url && (
                      <a
                        href={content.metadata.pptx_url}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium transition-colors ml-3"
                        style={{ background: 'var(--grey-700)', fontFamily: 'var(--font-display)' }}
                      >
                        <Download className="w-4 h-4" />
                        Download PPTX
                      </a>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          // Text Content Display
          <div className="max-w-3xl mx-auto">
            <div
              className="rounded-xl overflow-hidden border"
              style={{ borderColor: 'var(--grey-800)', background: 'var(--charcoal)' }}
            >
              {/* Content Header */}
              <div
                className="px-5 py-4 border-b flex items-center justify-between"
                style={{ borderColor: 'var(--grey-800)' }}
              >
                <span
                  className="text-xs font-medium uppercase tracking-wider"
                  style={{ color: 'var(--burnt-orange)', fontFamily: 'var(--font-display)' }}
                >
                  Draft
                </span>
                <span className="text-xs" style={{ color: 'var(--grey-500)' }}>
                  {new Date().toLocaleTimeString()}
                </span>
              </div>

              {/* Content Body - Editable */}
              <div className="p-6">
                <textarea
                  ref={textareaRef}
                  value={editableContent}
                  onChange={(e) => {
                    setEditableContent(e.target.value)
                    setIsDirty(true) // Mark as dirty when user edits
                  }}
                  className="w-full min-h-[400px] bg-transparent border-none resize-none focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)] focus:ring-offset-2 focus:ring-offset-[var(--charcoal)] rounded-lg"
                  style={{
                    color: 'var(--grey-200)',
                    fontSize: '0.95rem',
                    lineHeight: '1.8',
                    fontFamily: 'var(--font-body)'
                  }}
                  placeholder="Content will appear here..."
                />
              </div>

              {/* Content Actions */}
              <div
                className="px-5 py-4 border-t flex items-center gap-2"
                style={{ borderColor: 'var(--grey-800)' }}
              >
                <button
                  onClick={handleSave}
                  disabled={saving || (content.saved && !isDirty)}
                  className="px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  style={{
                    background: (content.saved && !isDirty) ? 'var(--grey-700)' : 'var(--burnt-orange)',
                    color: 'var(--white)',
                    fontFamily: 'var(--font-display)'
                  }}
                >
                  <Save className="w-4 h-4" />
                  {isDirty ? 'Save Changes' : 'Save to Vault'}
                </button>
                <button
                  onClick={() => textareaRef.current?.focus()}
                  className="px-4 py-2 text-sm font-medium rounded-md border transition-colors flex items-center gap-1.5"
                  style={{
                    background: 'transparent',
                    borderColor: 'var(--grey-700)',
                    color: 'var(--grey-300)',
                    fontFamily: 'var(--font-display)'
                  }}
                >
                  <FileText className="w-4 h-4" />
                  Manual Edit
                </button>
                <button
                  className="px-4 py-2 text-sm font-medium rounded-md border transition-colors flex items-center gap-1.5"
                  style={{
                    background: 'transparent',
                    borderColor: 'var(--grey-700)',
                    color: 'var(--grey-300)',
                    fontFamily: 'var(--font-display)'
                  }}
                >
                  <RefreshCw className="w-4 h-4" />
                  Regenerate
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

StudioWorkspace.displayName = 'StudioWorkspace'

export default StudioWorkspace
