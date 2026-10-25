'use client'

import { useState, useEffect, useRef } from 'react'
import StudioContentTypeSidebar from '@/components/studio/StudioContentTypeSidebar'
import StudioWorkspace, { type StudioWorkspaceRef } from '@/components/studio/StudioWorkspace'
import StudioAdvisor from '@/components/studio/StudioAdvisor'
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
  const workspaceRef = useRef<StudioWorkspaceRef>(null)
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
      className="h-full w-full flex-1 overflow-hidden"
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
        <div
          className="flex-1 overflow-hidden gap-6 pl-6 py-6 pr-6"
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 460px'
          }}
        >
          {/* Workspace */}
          <div className="overflow-hidden">
            <StudioWorkspace
              ref={workspaceRef}
              content={workspaceContent}
              contentType={selectedContentType}
              onContentSave={handleContentSaved}
              sourceFolder={sourceFolder}
            />
          </div>

          {/* NIV Panel - floating card in right column */}
          <div className="overflow-hidden">
            <StudioAdvisor
              organizationId={organization?.id}
              workspaceContent={workspaceContent}
              workspaceRef={workspaceRef}
              onNewContent={handleContentGenerated}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
