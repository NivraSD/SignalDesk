'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import StudioContentTypeSidebar from '@/components/studio/StudioContentTypeSidebar'
import StudioWorkspace from '@/components/studio/StudioWorkspace'
import StudioNIVPanel from '@/components/studio/StudioNIVPanel'
import { useAppStore } from '@/stores/useAppStore'
import { supabase } from '@/lib/supabase/client'
import type { ContentItem } from '@/components/execute/ExecuteTabProduction'

function StudioContent() {
  const searchParams = useSearchParams()
  const { organization } = useAppStore()
  const [selectedContentType, setSelectedContentType] = useState<string>('')
  const [workspaceContent, setWorkspaceContent] = useState<ContentItem | null>(null)
  const [generatedItems, setGeneratedItems] = useState<ContentItem[]>([])
  const [loadingContent, setLoadingContent] = useState(false)
  const [sourceFolder, setSourceFolder] = useState<string>('')

  // Load content from URL params if provided (from Memory Vault Edit)
  useEffect(() => {
    const contentId = searchParams.get('contentId')
    const folder = searchParams.get('folder')
    const type = searchParams.get('type')

    if (contentId && organization?.id) {
      loadContentFromDatabase(contentId, folder || '', type || '')
    }
  }, [searchParams, organization?.id])

  // Load content from content_library by ID
  const loadContentFromDatabase = async (contentId: string, folder: string, type: string) => {
    setLoadingContent(true)
    try {
      console.log('📂 Loading content from Memory Vault:', contentId)

      const { data, error } = await supabase
        .from('content_library')
        .select('*')
        .eq('id', contentId)
        .single()

      if (error) {
        console.error('Failed to load content:', error)
        return
      }

      if (data) {
        // Convert database record to ContentItem format
        const contentItem: ContentItem = {
          id: data.id,
          type: data.content_type,
          title: data.title,
          content: data.content,
          metadata: {
            ...data.metadata,
            folder: data.folder,
            sourceContentId: data.id // Track original ID for updates
          },
          saved: true
        }

        setWorkspaceContent(contentItem)
        setSelectedContentType(data.content_type)
        setSourceFolder(data.folder || folder)
        setGeneratedItems([contentItem])

        console.log('✅ Content loaded from Memory Vault:', data.title)
      }
    } catch (error) {
      console.error('Error loading content:', error)
    } finally {
      setLoadingContent(false)
    }
  }

  // Clear state when organization changes (but not if editing existing content)
  useEffect(() => {
    const contentId = searchParams.get('contentId')
    if (organization && !contentId) {
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

  // Handle content saved - now supports saving back to original folder
  const handleContentSaved = (content: ContentItem) => {
    console.log('💾 Content saved:', content)
    setGeneratedItems(prev =>
      prev.map(item => item.id === content.id ? { ...item, saved: true } : item)
    )
    if (workspaceContent?.id === content.id) {
      setWorkspaceContent({ ...workspaceContent, saved: true })
    }
  }

  if (loadingContent) {
    return (
      <DashboardLayout showSidebar={false}>
        <div className="flex h-full items-center justify-center bg-[var(--charcoal)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--burnt-orange)] mx-auto mb-4"></div>
            <p className="text-[var(--grey-400)]">Loading content...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout showSidebar={false}>
      <div
        className="h-full overflow-hidden"
        style={{
          display: 'grid',
          gridTemplateColumns: '260px 1fr 460px',
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

        {/* Center - Workspace (Dark) */}
        <div className="overflow-hidden p-6 bg-[var(--charcoal)]">
          <StudioWorkspace
            content={workspaceContent}
            contentType={selectedContentType}
            onContentSave={handleContentSaved}
            sourceFolder={sourceFolder}
          />
        </div>

        {/* Right - NIV Panel (Dark) */}
        <div className="overflow-hidden p-6 bg-[var(--charcoal)] border-l border-zinc-800">
          <StudioNIVPanel
            selectedContentType={selectedContentType}
            onContentGenerated={handleContentGenerated}
            onContentSave={handleContentSaved}
          />
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function StudioPage() {
  return (
    <Suspense fallback={
      <DashboardLayout showSidebar={false}>
        <div className="flex h-full items-center justify-center bg-[var(--charcoal)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--burnt-orange)] mx-auto mb-4"></div>
            <p className="text-[var(--grey-400)]">Loading Studio...</p>
          </div>
        </div>
      </DashboardLayout>
    }>
      <StudioContent />
    </Suspense>
  )
}
