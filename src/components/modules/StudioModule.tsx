'use client'

import { useState, useEffect } from 'react'
import StudioContentTypeSidebar from '@/components/studio/StudioContentTypeSidebar'
import StudioWorkspace from '@/components/studio/StudioWorkspace'
import StudioNIVPanel from '@/components/studio/StudioNIVPanel'
import { useAppStore } from '@/stores/useAppStore'
import type { ContentItem } from '@/components/execute/ExecuteTabProduction'

interface StudioModuleProps {
  initialContent?: {
    id: string
    title: string
    content_type: string
    content: any
    folder?: string
    metadata?: any
  } | null
  onClearInitialContent?: () => void
}

export default function StudioModule({ initialContent, onClearInitialContent }: StudioModuleProps = {}) {
  const { organization } = useAppStore()
  const [selectedContentType, setSelectedContentType] = useState<string>('')
  const [workspaceContent, setWorkspaceContent] = useState<ContentItem | null>(null)
  const [generatedItems, setGeneratedItems] = useState<ContentItem[]>([])
  const [sourceFolder, setSourceFolder] = useState<string>('')

  // Load initial content from Memory Vault edit
  useEffect(() => {
    if (initialContent) {
      console.log('📂 Studio loading content from Memory Vault:', initialContent.title)
      const contentItem: ContentItem = {
        id: initialContent.id,
        type: initialContent.content_type,
        title: initialContent.title,
        content: initialContent.content,
        metadata: {
          ...initialContent.metadata,
          folder: initialContent.folder,
          sourceContentId: initialContent.id // Track original ID for updates
        },
        saved: true
      }
      setWorkspaceContent(contentItem)
      setSelectedContentType(initialContent.content_type)
      setSourceFolder(initialContent.folder || '')
      setGeneratedItems([contentItem])
    }
  }, [initialContent])

  // Clear state when organization changes (but not if editing existing content)
  useEffect(() => {
    if (organization && !initialContent) {
      setSelectedContentType('')
      setWorkspaceContent(null)
      setGeneratedItems([])
      setSourceFolder('')
    }
  }, [organization?.id])

  // Handle content type selection from sidebar
  const handleContentTypeSelect = (typeId: string) => {
    setSelectedContentType(typeId)
  }

  // Handle content generated from NIV panel
  const handleContentGenerated = (content: ContentItem) => {
    console.log('📝 Content generated, sending to workspace:', content)
    setWorkspaceContent(content)
    setGeneratedItems(prev => [...prev, content])
  }

  // Handle content saved
  const handleContentSaved = (content: ContentItem) => {
    console.log('💾 Content saved:', content)
    setGeneratedItems(prev =>
      prev.map(item => item.id === content.id ? { ...item, saved: true } : item)
    )
    if (workspaceContent?.id === content.id) {
      setWorkspaceContent({ ...workspaceContent, saved: true })
    }
  }

  return (
    <div
      className="h-full overflow-hidden"
      style={{
        display: 'grid',
        gridTemplateColumns: '260px 1fr',
        minHeight: 0
      }}
    >
      {/* Left Sidebar - Content Types (Light) */}
      <StudioContentTypeSidebar
        selectedContentType={selectedContentType}
        onContentTypeSelect={handleContentTypeSelect}
        generatedItems={generatedItems}
        onItemSelect={(item) => setWorkspaceContent(item)}
      />

      {/* Main Content Area */}
      <div className="flex flex-col h-full overflow-hidden bg-[var(--charcoal)]">
        {/* Content Grid - Workspace + NIV Floating Card */}
        <div className="flex-1 overflow-hidden grid grid-cols-3 gap-6 p-6">
          {/* Workspace - spans 2 columns */}
          <div className="col-span-2 overflow-hidden">
            <StudioWorkspace
              content={workspaceContent}
              contentType={selectedContentType}
              onContentSave={handleContentSaved}
              sourceFolder={sourceFolder}
            />
          </div>

          {/* NIV Panel - floating card in right column */}
          <div className="overflow-hidden">
            <StudioNIVPanel
              selectedContentType={selectedContentType}
              onContentGenerated={handleContentGenerated}
              onContentSave={handleContentSaved}
              workspaceContent={workspaceContent}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
