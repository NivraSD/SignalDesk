'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Database, Search, Sparkles, Upload, FileText, Image,
  Brain, Tag, Clock, Folder, TrendingUp, Activity,
  Filter, X, ChevronRight, ChevronDown, Download, Trash2, Eye,
  BarChart3, Zap, CheckCircle, AlertCircle, Loader, Edit,
  FolderPlus, MoreVertical, Move, Copy, FolderOpen, File, ExternalLink, Target
} from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { createClient } from '@supabase/supabase-js'
import {
  fetchMemoryVaultContent,
  updateMemoryVaultContent,
  deleteMemoryVaultContent,
  saveToMemoryVault
} from '@/lib/memoryVaultAPI'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type TabType = 'library' | 'assets' | 'analytics'

interface ContentItem {
  id: string
  title: string
  content_type: string
  content: any
  folder?: string
  themes?: string[]
  topics?: string[]
  entities?: any
  intelligence_status: 'pending' | 'processing' | 'complete' | 'failed'
  content_signature?: string
  created_at: string
  organization_id: string
  // Presentation metadata (Gamma URLs, download links)
  metadata?: {
    gamma_id?: string
    gamma_url?: string
    gamma_edit_url?: string
    pptx_url?: string
    slide_count?: number
    format?: string
    slides?: any[]
    campaign_presentation_id?: string
    opportunity_id?: string
    blueprint_id?: string
    source?: string
    has_full_content?: boolean
    [key: string]: any  // Allow other metadata fields
  }
  // Execution tracking
  executed?: boolean
  executed_at?: string
  result?: {
    type: 'media_response' | 'engagement' | 'pickup' | 'other'
    value?: string | number
    notes?: string
  }
  feedback?: string
}

interface BrandAsset {
  id: string
  name: string
  asset_type: string
  status: 'uploading' | 'analyzing' | 'active' | 'failed'
  file_url?: string
  extracted_guidelines?: any
  brand_voice_profile?: any
  usage_count: number
  created_at: string
  folder?: string
}

interface AnalyticsData {
  // Content Overview
  totalContent: number
  executedContent: number
  executionRate: number

  // Activity Over Time
  activityToday: number
  activityThisWeek: number
  activityThisMonth: number

  // Performance Metrics
  performanceByType: Array<{
    type: string
    executed: number
    results: Array<{
      label: string
      value: string | number
      notes?: string
    }>
  }>

  // Recent Activity
  recentExecutions: Array<{
    id: string
    title: string
    content_type: string
    executed_at: string
    result?: any
    folder?: string
  }>

  // Campaign Attribution
  attribution?: {
    totalCoverage: number
    highConfidenceMatches: number
    totalReach: number
    avgConfidence: number
    sentimentBreakdown: {
      positive: number
      neutral: number
      negative: number
    }
    topOutlets: Array<{
      outlet: string
      count: number
      reach: number
    }>
    timeline: Array<{
      date: string
      outlet: string
      type: string
      confidence: number
      reach: number
      title: string
      url: string
      sentiment: string
      match_type: string
    }>
    verifiedCount: number
    pendingVerification: number
  }
}

interface FolderNode {
  name: string
  path: string
  children: FolderNode[]
  items: ContentItem[]
  expanded: boolean
}

// Smart folder templates
const FOLDER_TEMPLATES = [
  { name: 'Opportunities', icon: '🎯', color: 'text-blue-400' },
  { name: 'Campaigns', icon: '📢', color: 'text-purple-400' },
  { name: 'Media Plans', icon: '📰', color: 'text-cyan-400' },
  { name: 'Strategies', icon: '💡', color: 'text-green-400' },
  { name: 'Press Releases', icon: '📝', color: 'text-orange-400' },
  { name: 'Social Content', icon: '💬', color: 'text-pink-400' },
  { name: 'Research', icon: '🔬', color: 'text-yellow-400' },
  { name: 'Proposals', icon: '📋', color: 'text-emerald-400' },
  { name: 'Schemas', icon: '🏗️', color: 'text-indigo-400' }
]

export default function MemoryVaultModule() {
  const { organization } = useAppStore()
  const [activeTab, setActiveTab] = useState<TabType>('library')
  const [searchQuery, setSearchQuery] = useState('')

  // Content Library State
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null)
  const [loadingContent, setLoadingContent] = useState(false)
  const [folderTree, setFolderTree] = useState<FolderNode[]>([])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']))
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: ContentItem } | null>(null)
  const [showMoveDialog, setShowMoveDialog] = useState(false)
  const [itemToMove, setItemToMove] = useState<ContentItem | null>(null)
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderParent, setNewFolderParent] = useState<string>('')
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [itemToExport, setItemToExport] = useState<ContentItem | null>(null)
  const [exportMode, setExportMode] = useState<'basic' | 'attach'>('basic')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [mergingTemplate, setMergingTemplate] = useState(false)

  // Brand Assets State
  const [brandAssets, setBrandAssets] = useState<BrandAsset[]>([])
  const [selectedAsset, setSelectedAsset] = useState<BrandAsset | null>(null)
  const [uploadingAsset, setUploadingAsset] = useState(false)
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Upload dialog state (for Content Library uploads)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploadTargetFolder, setUploadTargetFolder] = useState<string>('Proposals')

  // Analytics State
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalContent: 0,
    executedContent: 0,
    executionRate: 0,
    activityToday: 0,
    activityThisWeek: 0,
    activityThisMonth: 0,
    performanceByType: [],
    recentExecutions: []
  })
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)

  // Execution tracking state
  const [editingResultFor, setEditingResultFor] = useState<string | null>(null)
  const [executingAction, setExecutingAction] = useState(false)

  // Build folder tree from flat list
  const buildFolderTree = (items: ContentItem[]): FolderNode[] => {
    const tree: FolderNode[] = []
    const folderMap = new Map<string, FolderNode>()

    // Create root folders
    FOLDER_TEMPLATES.forEach(template => {
      const node: FolderNode = {
        name: template.name,
        path: template.name,
        children: [],
        items: [],
        expanded: expandedFolders.has(template.name)
      }
      folderMap.set(template.name, node)
      tree.push(node)
    })

    // Add uncategorized folder
    const uncategorized: FolderNode = {
      name: 'Uncategorized',
      path: 'Uncategorized',
      children: [],
      items: [],
      expanded: expandedFolders.has('Uncategorized')
    }
    folderMap.set('Uncategorized', uncategorized)
    tree.push(uncategorized)

    // Distribute items into folders
    items.forEach(item => {
      if (!item.folder || item.folder === '') {
        uncategorized.items.push(item)
      } else {
        // Find matching template folder or create custom
        const folderParts = item.folder.split('/')
        const rootFolder = folderParts[0]

        let targetNode = folderMap.get(rootFolder)
        if (!targetNode) {
          // Create custom folder
          targetNode = {
            name: rootFolder,
            path: rootFolder,
            children: [],
            items: [],
            expanded: expandedFolders.has(rootFolder)
          }
          folderMap.set(rootFolder, targetNode)
          tree.push(targetNode)
        }

        // Handle nested folders
        if (folderParts.length > 1) {
          let currentNode = targetNode
          for (let i = 1; i < folderParts.length; i++) {
            const part = folderParts[i]
            let childNode = currentNode.children.find(c => c.name === part)
            if (!childNode) {
              childNode = {
                name: part,
                path: folderParts.slice(0, i + 1).join('/'),
                children: [],
                items: [],
                expanded: expandedFolders.has(folderParts.slice(0, i + 1).join('/'))
              }
              currentNode.children.push(childNode)
            }
            currentNode = childNode
          }
          currentNode.items.push(item)
        } else {
          targetNode.items.push(item)
        }
      }
    })

    // Sort tree: template folders first, then custom, then uncategorized
    return tree.sort((a, b) => {
      const aIsTemplate = FOLDER_TEMPLATES.some(t => t.name === a.name)
      const bIsTemplate = FOLDER_TEMPLATES.some(t => t.name === b.name)
      if (aIsTemplate && !bIsTemplate) return -1
      if (!aIsTemplate && bIsTemplate) return 1
      if (a.name === 'Uncategorized') return 1
      if (b.name === 'Uncategorized') return -1
      return a.name.localeCompare(b.name)
    })
  }

  // Fetch Content Library
  const fetchContent = async () => {
    if (!organization?.id) return

    setLoadingContent(true)
    try {
      // CRITICAL FIX: Use API endpoint instead of direct Supabase client to bypass PostgREST cache
      const response = await fetch(`/api/content-library/save?organization_id=${organization.id}&limit=500`)

      if (!response.ok) {
        console.error('❌ MEMORY VAULT FETCH ERROR:', response.status, response.statusText)
        setContentItems([])
        setFolderTree(buildFolderTree([]))
        return
      }

      const result = await response.json()
      const data = result.data || []

      console.log('📦 MEMORY VAULT FETCHED:', data.length, 'items')
      console.log('📦 SCHEMAS FOUND:', data.filter((d: any) => d.content_type === 'schema').length)
      console.log('📦 FOLDER BREAKDOWN:', data.reduce((acc: Record<string, number>, d: any) => {
        acc[d.folder || 'NO_FOLDER'] = (acc[d.folder || 'NO_FOLDER'] || 0) + 1
        return acc
      }, {} as Record<string, number>))

      setContentItems(data)
      setFolderTree(buildFolderTree(data))
    } catch (error) {
      console.error('Error fetching content:', error)
      setContentItems([])
      setFolderTree(buildFolderTree([]))
    } finally {
      setLoadingContent(false)
    }
  }

  // Fetch Brand Assets
  const fetchBrandAssets = async () => {
    if (!organization?.id) return

    try {
      const { data, error } = await supabase
        .from('brand_assets')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching brand assets:', error)
        // Set empty array if table doesn't exist yet or has RLS issues
        setBrandAssets([])
        return
      }

      console.log('✅ Fetched brand assets:', data?.length || 0)
      setBrandAssets(data || [])
    } catch (error) {
      console.error('❌ Unexpected error fetching brand assets:', error)
      setBrandAssets([])
    }
  }

  // Fetch Analytics - Campaign Performance Focus
  const fetchAnalytics = async () => {
    if (!organization?.id) return

    setLoadingAnalytics(true)
    try {
      const now = new Date()
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      // Fetch all content via API
      const contentData = await fetchMemoryVaultContent({
        organization_id: organization.id,
        limit: 1000
      })

      let executedCount = 0
      let activityToday = 0
      let activityThisWeek = 0
      let activityThisMonth = 0

      // Track performance by type
      const performanceMap = new Map<string, {
        executed: number
        results: Array<{ label: string; value: string | number; notes?: string }>
      }>()

      contentData?.forEach(item => {
        if (item.executed) {
          executedCount++

          // Count activity by time period
          if (item.executed_at) {
            const executedDate = new Date(item.executed_at)
            if (executedDate >= oneDayAgo) activityToday++
            if (executedDate >= oneWeekAgo) activityThisWeek++
            if (executedDate >= oneMonthAgo) activityThisMonth++
          }

          // Track performance by content type
          const typeKey = item.content_type
          if (!performanceMap.has(typeKey)) {
            performanceMap.set(typeKey, { executed: 0, results: [] })
          }
          const perf = performanceMap.get(typeKey)!
          perf.executed++

          // Add result if it exists
          if (item.result?.value) {
            perf.results.push({
              label: item.title,
              value: item.result.value,
              notes: item.result.notes
            })
          }
        }
      })

      // Convert performance map to array
      const performanceByType = Array.from(performanceMap.entries()).map(([type, data]) => ({
        type,
        executed: data.executed,
        results: data.results
      }))

      // Get recent executions with folder info (filter client-side from contentData)
      const recentExecutions = contentData
        .filter((item: any) => item.executed)
        .sort((a: any, b: any) => {
          const dateA = a.executed_at ? new Date(a.executed_at).getTime() : 0
          const dateB = b.executed_at ? new Date(b.executed_at).getTime() : 0
          return dateB - dateA
        })
        .slice(0, 10)

      const executionRate = contentData?.length
        ? (executedCount / contentData.length) * 100
        : 0

      // Fetch campaign attribution data
      let attributionData = undefined
      try {
        console.log('📊 Fetching campaign attribution data for org:', organization.id)
        const { data: attributionResponse, error: attrError } = await supabase.functions.invoke(
          'campaign-performance-get',
          {
            body: {
              organizationId: organization.id
            }
          }
        )

        console.log('📊 Attribution response:', attributionResponse)
        console.log('📊 Attribution error:', attrError)

        if (!attrError && attributionResponse?.metrics) {
          const metrics = attributionResponse.metrics
          attributionData = {
            totalCoverage: metrics.total_coverage || 0,
            highConfidenceMatches: metrics.high_confidence_matches || 0,
            totalReach: metrics.total_reach || 0,
            avgConfidence: metrics.avg_confidence || 0,
            sentimentBreakdown: metrics.sentiment_breakdown || { positive: 0, neutral: 0, negative: 0 },
            topOutlets: metrics.top_outlets || [],
            timeline: metrics.timeline || [],
            verifiedCount: metrics.verified_count || 0,
            pendingVerification: metrics.pending_verification || 0
          }
          console.log('✅ Attribution data loaded:', attributionData)
        } else {
          // Initialize with empty data to show the section
          attributionData = {
            totalCoverage: 0,
            highConfidenceMatches: 0,
            totalReach: 0,
            avgConfidence: 0,
            sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
            topOutlets: [],
            timeline: [],
            verifiedCount: 0,
            pendingVerification: 0
          }
          console.log('📊 Initialized empty attribution data')
        }
      } catch (attrError) {
        console.error('❌ Error fetching campaign attribution:', attrError)
        // Initialize with empty data even on error
        attributionData = {
          totalCoverage: 0,
          highConfidenceMatches: 0,
          totalReach: 0,
          avgConfidence: 0,
          sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
          topOutlets: [],
          timeline: [],
          verifiedCount: 0,
          pendingVerification: 0
        }
      }

      setAnalytics({
        totalContent: contentData?.length || 0,
        executedContent: executedCount,
        executionRate: Math.round(executionRate),
        activityToday,
        activityThisWeek,
        activityThisMonth,
        performanceByType,
        recentExecutions: recentExecutions || [],
        attribution: attributionData
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoadingAnalytics(false)
    }
  }

  // Get content-type specific result field configuration
  const getResultFieldForType = (contentType: string): { label: string; placeholder: string; resultType: string } => {
    const resultFields: Record<string, { label: string; placeholder: string; resultType: string }> = {
      'media-pitch': { label: 'Response', placeholder: 'e.g., Replied, No response, Meeting scheduled', resultType: 'media_response' },
      'thought-leadership': { label: 'Engagement', placeholder: 'e.g., Views, Shares, Comments', resultType: 'engagement' },
      'social-post': { label: 'Engagement', placeholder: 'e.g., Likes, Comments, Shares', resultType: 'engagement' },
      'press-release': { label: 'Media Pickup', placeholder: 'e.g., Number of outlets, Coverage quality', resultType: 'pickup' },
      'user-action': { label: 'Result', placeholder: 'Enter result or outcome', resultType: 'other' }
    }
    return resultFields[contentType] || { label: 'Result', placeholder: 'Enter result', resultType: 'other' }
  }

  // Handle marking content as executed/not executed
  const handleToggleExecuted = async (item: ContentItem, executed: boolean) => {
    setExecutingAction(true)
    try {
      await updateMemoryVaultContent(item.id, {
        executed,
        executed_at: executed ? new Date().toISOString() : null
      } as any)

      // Update local state
      setContentItems(prev => {
        const updated = prev.map(i =>
          i.id === item.id ? { ...i, executed, executed_at: executed ? new Date().toISOString() : undefined } : i
        )
        setFolderTree(buildFolderTree(updated))
        return updated
      })

      if (selectedContent?.id === item.id) {
        setSelectedContent({ ...item, executed, executed_at: executed ? new Date().toISOString() : undefined })
      }
    } catch (error) {
      console.error('Error toggling execution status:', error)
      alert('Failed to update execution status')
    } finally {
      setExecutingAction(false)
    }
  }

  // Handle updating result data
  const handleUpdateResult = async (item: ContentItem, resultValue: string, resultNotes: string) => {
    setExecutingAction(true)
    try {
      const resultField = getResultFieldForType(item.content_type)
      const resultData = {
        type: resultField.resultType as 'media_response' | 'engagement' | 'pickup' | 'other',
        value: resultValue,
        notes: resultNotes
      }

      await updateMemoryVaultContent(item.id, { result: resultData } as any)

      // Update local state
      setContentItems(prev => {
        const updated = prev.map(i =>
          i.id === item.id ? { ...i, result: resultData } : i
        )
        setFolderTree(buildFolderTree(updated))
        return updated
      })

      if (selectedContent?.id === item.id) {
        setSelectedContent({ ...item, result: resultData })
      }

      setEditingResultFor(null)
    } catch (error) {
      console.error('Error updating result:', error)
      alert('Failed to update result')
    } finally {
      setExecutingAction(false)
    }
  }

  // Handle updating feedback
  const handleUpdateFeedback = async (item: ContentItem, feedback: string) => {
    setExecutingAction(true)
    try {
      const { error } = await supabase
        .from('content_library')
        .update({ feedback })
        .eq('id', item.id)

      if (error) throw error

      // Update local state
      setContentItems(prev => {
        const updated = prev.map(i =>
          i.id === item.id ? { ...i, feedback } : i
        )
        setFolderTree(buildFolderTree(updated))
        return updated
      })

      if (selectedContent?.id === item.id) {
        setSelectedContent({ ...item, feedback })
      }
    } catch (error) {
      console.error('Error updating feedback:', error)
      alert('Failed to update feedback')
    } finally {
      setExecutingAction(false)
    }
  }

  // Subscribe to real-time updates
  useEffect(() => {
    if (!organization?.id) return

    const contentChannel = supabase
      .channel('content-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'content_library',
          filter: `organization_id=eq.${organization.id}`
        },
        (payload) => {
          console.log('🔄 Content updated:', payload.new)
          setContentItems(prev => {
            const updated = prev.map(item => item.id === payload.new.id ? payload.new as ContentItem : item)
            setFolderTree(buildFolderTree(updated))
            return updated
          })
        }
      )
      .subscribe()

    const assetChannel = supabase
      .channel('asset-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'brand_assets',
          filter: `organization_id=eq.${organization.id}`
        },
        (payload) => {
          console.log('🔄 Asset updated:', payload.new)
          fetchBrandAssets()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(contentChannel)
      supabase.removeChannel(assetChannel)
    }
  }, [organization?.id])

  // Initial data fetch
  useEffect(() => {
    if (organization?.id) {
      fetchContent()
      fetchBrandAssets()
      fetchAnalytics()
    }
  }, [organization?.id, activeTab])

  // Rebuild tree when expanded folders change
  useEffect(() => {
    setFolderTree(buildFolderTree(contentItems))
  }, [expandedFolders, contentItems])

  // Auto-refresh analytics
  useEffect(() => {
    if (activeTab === 'analytics') {
      const interval = setInterval(fetchAnalytics, 5000)
      return () => clearInterval(interval)
    }
  }, [activeTab, organization?.id])

  // Delete brand asset
  const handleDeleteAsset = async (id: string) => {
    if (!confirm('Delete this brand asset? This cannot be undone.')) return

    try {
      const asset = brandAssets.find(a => a.id === id)
      if (!asset) return

      // Delete from storage if file_path exists
      if (asset.file_url) {
        const fileName = asset.file_url.split('/brand-assets/').pop()
        if (fileName) {
          await supabase.storage
            .from('brand-assets')
            .remove([fileName])
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('brand_assets')
        .delete()
        .eq('id', id)

      if (error) throw error

      setBrandAssets(prev => prev.filter(a => a.id !== id))
      if (selectedAsset?.id === id) setSelectedAsset(null)

      console.log('✅ Asset deleted:', id)
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete asset')
    }
  }

  // Handle file upload - context aware (Brand Assets or Content Library)
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !organization?.id) return

    // If on Brand Assets tab, upload to brand_assets table
    if (activeTab === 'assets') {
      await handleBrandAssetUpload(file)
    } else if (activeTab === 'library') {
      // If on Content Library tab, show folder selection dialog
      setShowUploadDialog(true)
    }
  }

  // Upload to brand_assets table
  const handleBrandAssetUpload = async (file: File) => {
    setUploadingAsset(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('organizationId', organization!.id)

      let assetType = 'document'
      if (file.type.includes('pdf')) assetType = 'guidelines-brand'
      else if (file.name.match(/\.(docx|pptx)$/)) assetType = 'template-' + (file.name.includes('ppt') ? 'presentation' : 'document')
      else if (file.type.startsWith('image/')) assetType = 'logo'

      formData.append('assetType', assetType)
      formData.append('name', file.name)
      if (currentFolder) {
        formData.append('folder', currentFolder)
      }

      console.log('📤 Uploading to brand assets:', file.name, assetType)

      const response = await fetch('/api/brand-assets/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()
      console.log('✅ Upload success:', result)

      await fetchBrandAssets()
    } catch (error) {
      console.error('Upload error:', error)
      alert(`Failed to upload: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setUploadingAsset(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Upload to content_library table
  const handleContentLibraryUpload = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file || !organization?.id) return

    setUploadingAsset(true)
    setShowUploadDialog(false)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('organizationId', organization.id)
      formData.append('folder', uploadTargetFolder)
      formData.append('title', file.name)

      console.log('📤 Uploading to content library:', file.name, 'folder:', uploadTargetFolder)

      const response = await fetch('/api/content-library/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()
      console.log('✅ Upload success:', result)

      await fetchContent()
    } catch (error) {
      console.error('Upload error:', error)
      alert(`Failed to upload: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setUploadingAsset(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Create folder for brand assets (just stores the folder name for upload selection)
  const handleCreateBrandFolder = () => {
    if (!newFolderName.trim()) return

    // The folder will be created when the first asset is uploaded to it
    // For now, just set it as the current folder
    setCurrentFolder(newFolderName.trim())
    setNewFolderName('')
    setShowNewFolderDialog(false)
  }

  // Delete content
  const handleDeleteContent = async (id: string) => {
    if (!confirm('Delete this content?')) return

    try {
      const { error } = await supabase
        .from('content_library')
        .delete()
        .eq('id', id)

      if (error) throw error
      const updated = contentItems.filter(item => item.id !== id)
      setContentItems(updated)
      setFolderTree(buildFolderTree(updated))
      if (selectedContent?.id === id) setSelectedContent(null)
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete content')
    }
  }

  // Move content to folder
  const handleMoveToFolder = async (item: ContentItem, newFolder: string) => {
    try {
      const { error } = await supabase
        .from('content_library')
        .update({ folder: newFolder })
        .eq('id', item.id)

      if (error) throw error

      const updated = contentItems.map(i => i.id === item.id ? { ...i, folder: newFolder } : i)
      setContentItems(updated)
      setFolderTree(buildFolderTree(updated))
      setShowMoveDialog(false)
      setItemToMove(null)
    } catch (error) {
      console.error('Move error:', error)
      alert('Failed to move content')
    }
  }

  // Open in workspace
  const handleOpenInWorkspace = (item: ContentItem) => {
    // Dispatch event to open in workspace
    const event = new CustomEvent('addComponentToCanvas', {
      detail: { moduleId: 'workspace', action: 'window' }
    })
    window.dispatchEvent(event)

    setTimeout(() => {
      const contentEvent = new CustomEvent('openInWorkspace', {
        detail: {
          id: item.id,
          type: item.content_type,
          title: item.title,
          content: typeof item.content === 'string' ? item.content : JSON.stringify(item.content, null, 2),
          metadata: { folder: item.folder }
        }
      })
      window.dispatchEvent(contentEvent)
    }, 300)
  }

  // Export content - NEW: Word, PowerPoint, Google Docs/Slides
  const handleExport = async (item: ContentItem, format: 'word' | 'powerpoint' | 'google-docs' | 'google-slides') => {
    try {
      setMergingTemplate(true)

      const textContent = typeof item.content === 'string' ? item.content : JSON.stringify(item.content, null, 2)

      if (format === 'word') {
        // Generate Word document via API
        console.log('Generating Word document...')
        const response = await fetch('/api/content-library/export-to-word', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentId: item.id,
            title: item.title,
            content: textContent
          })
        })

        if (!response.ok) throw new Error('Failed to generate Word document')

        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${item.title.replace(/[^a-z0-9]/gi, '_')}.docx`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        console.log('✅ Word document exported')
      } else if (format === 'powerpoint') {
        // Use Gamma to generate PowerPoint
        console.log('Generating PowerPoint via Gamma...')
        const response = await fetch('/api/gamma/generate-presentation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: item.title,
            content: textContent,
            organizationId: selectedOrganization
          })
        })

        if (!response.ok) throw new Error('Failed to generate presentation')

        const result = await response.json()

        // Trigger PPTX download if available
        if (result.pptx_url) {
          const a = document.createElement('a')
          a.href = result.pptx_url
          a.download = `${item.title.replace(/[^a-z0-9]/gi, '_')}.pptx`
          a.target = '_blank'
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
        }

        // Also open Gamma editor
        if (result.gamma_url) {
          window.open(result.gamma_url, '_blank')
        }

        console.log('✅ PowerPoint generated via Gamma')
      } else if (format === 'google-docs') {
        // Export to Google Docs
        console.log('Exporting to Google Docs...')

        // Copy content to clipboard
        await navigator.clipboard.writeText(textContent)

        // Open Google Docs
        const googleDocsUrl = `https://docs.google.com/document/create?title=${encodeURIComponent(item.title)}`
        window.open(googleDocsUrl, '_blank')

        alert('✅ Content copied to clipboard! Paste it into your new Google Doc.')
        console.log('✅ Opened Google Docs with content in clipboard')
      } else if (format === 'google-slides') {
        // Export to Google Slides
        console.log('Exporting to Google Slides...')

        // Copy content to clipboard
        await navigator.clipboard.writeText(textContent)

        // Open Google Slides
        const googleSlidesUrl = `https://docs.google.com/presentation/create?title=${encodeURIComponent(item.title)}`
        window.open(googleSlidesUrl, '_blank')

        alert('✅ Content copied to clipboard! Paste it into your new Google Slides presentation.')
        console.log('✅ Opened Google Slides with content in clipboard')
      }

      setMergingTemplate(false)
    } catch (error) {
      console.error('Export error:', error)
      alert(`Failed to export: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setMergingTemplate(false)
    }
  }

  // Attach content to template (no placeholders)
  const handleAttachToTemplate = async (item: ContentItem, templateId: string) => {
    if (!templateId) {
      alert('Please select a template')
      return
    }

    setMergingTemplate(true)
    try {
      const response = await fetch('/api/content-library/attach-to-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contentId: item.id,
          templateId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Attach failed')
      }

      // Download the file
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url

      const contentDisposition = response.headers.get('Content-Disposition')
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `${item.title.replace(/[^a-z0-9]/gi, '_')}_attached.docx`

      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      console.log(`✅ Attached to template: ${filename}`)

      // Update template usage count
      const asset = brandAssets.find(a => a.id === templateId)
      if (asset) {
        await supabase
          .from('brand_assets')
          .update({
            usage_count: (asset.usage_count || 0) + 1,
            last_used_at: new Date().toISOString()
          })
          .eq('id', templateId)

        await fetchBrandAssets()
      }
    } catch (error) {
      console.error('❌ Template attach error:', error)
      alert(`Failed to attach to template: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setMergingTemplate(false)
    }
  }

  // Merge content with template
  const handleMergeTemplate = async (item: ContentItem, templateId: string) => {
    if (!templateId) {
      alert('Please select a template')
      return
    }

    setMergingTemplate(true)
    try {
      const response = await fetch('/api/content-library/merge-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contentId: item.id,
          templateId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Merge failed')
      }

      // Download the merged file
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url

      // Get filename from response headers or use default
      const contentDisposition = response.headers.get('Content-Disposition')
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `${item.title.replace(/[^a-z0-9]/gi, '_')}_merged.txt`

      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      console.log(`✅ Merged with template: ${filename}`)

      // Update template usage count
      const asset = brandAssets.find(a => a.id === templateId)
      if (asset) {
        await supabase
          .from('brand_assets')
          .update({
            usage_count: (asset.usage_count || 0) + 1,
            last_used_at: new Date().toISOString()
          })
          .eq('id', templateId)

        await fetchBrandAssets()
      }
    } catch (error) {
      console.error('❌ Template merge error:', error)
      alert(`Failed to merge template: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setMergingTemplate(false)
    }
  }

  // Create new folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      alert('Please enter a folder name')
      return
    }

    const folderPath = newFolderParent
      ? `${newFolderParent}/${newFolderName.trim()}`
      : newFolderName.trim()

    // Create a placeholder item to initialize the folder
    try {
      const { error } = await supabase
        .from('content_library')
        .insert({
          title: `.folder_${newFolderName.trim()}`,
          content_type: 'folder-marker',
          content: '',
          folder: folderPath,
          organization_id: organization?.id,
          intelligence_status: 'complete'
        })

      if (error) throw error

      await fetchContent()
      setShowNewFolderDialog(false)
      setNewFolderName('')
      setNewFolderParent('')
    } catch (error) {
      console.error('Error creating folder:', error)
      alert('Failed to create folder')
    }
  }

  // Toggle folder expansion
  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-pink-500">
                <Database className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Memory Vault V2</h2>
                <p className="text-xs text-gray-400">Intelligent Content & Brand Management</p>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.svg"
              />

              {/* Folder Creation Dialog */}
              {showNewFolderDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-gray-900 rounded-lg p-6 w-96 border border-gray-800">
                    <h3 className="text-lg font-semibold text-white mb-4">Create New Folder</h3>
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleCreateBrandFolder()}
                      placeholder="Folder name (e.g., Photos, Templates)"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 mb-4"
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => {
                          setShowNewFolderDialog(false)
                          setNewFolderName('')
                        }}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateBrandFolder}
                        disabled={!newFolderName.trim()}
                        className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg transition-colors disabled:opacity-50"
                      >
                        Create Folder
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload to Content Library Dialog */}
              {showUploadDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-gray-900 rounded-lg p-6 w-96 border border-gray-800">
                    <h3 className="text-lg font-semibold text-white mb-4">Upload to Content Library</h3>
                    <p className="text-sm text-gray-400 mb-4">
                      Select which folder to upload to:
                    </p>
                    <select
                      value={uploadTargetFolder}
                      onChange={(e) => setUploadTargetFolder(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500 mb-4"
                    >
                      {FOLDER_TEMPLATES.map(template => (
                        <option key={template.name} value={template.name}>
                          {template.icon} {template.name}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => {
                          setShowUploadDialog(false)
                          if (fileInputRef.current) fileInputRef.current.value = ''
                        }}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleContentLibraryUpload}
                        className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg transition-colors"
                      >
                        Upload
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAsset}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-lg transition-colors border border-orange-500/20 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {uploadingAsset ? 'Uploading...' : 'Upload Asset'}
              </button>
              <button
                onClick={fetchContent}
                className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                title="Refresh"
              >
                <Activity className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('library')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'library'
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-gray-300'
              }`}
            >
              <FileText className="w-4 h-4" />
              Content Library
              <span className="px-2 py-0.5 rounded-full bg-gray-900 text-xs">
                {contentItems.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('assets')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'assets'
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-gray-300'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Brand Assets
              <span className="px-2 py-0.5 rounded-full bg-gray-900 text-xs">
                {brandAssets.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'analytics'
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-gray-300'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'library' && (
          <ContentLibraryTab
            folderTree={folderTree}
            selectedContent={selectedContent}
            onSelectContent={setSelectedContent}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onToggleFolder={toggleFolder}
            onDeleteContent={handleDeleteContent}
            onMoveContent={(item) => {
              setItemToMove(item)
              setShowMoveDialog(true)
            }}
            onOpenInWorkspace={handleOpenInWorkspace}
            onExport={(item) => {
              setItemToExport(item)
              setShowExportDialog(true)
            }}
            onCreateFolder={() => setShowNewFolderDialog(true)}
            loading={loadingContent}
            onContextMenu={(e, item) => {
              e.preventDefault()
              setContextMenu({ x: e.clientX, y: e.clientY, item })
            }}
            onToggleExecuted={handleToggleExecuted}
            onUpdateResult={handleUpdateResult}
            onUpdateFeedback={handleUpdateFeedback}
            editingResultFor={editingResultFor}
            setEditingResultFor={setEditingResultFor}
            executingAction={executingAction}
            getResultFieldForType={getResultFieldForType}
          />
        )}

        {activeTab === 'assets' && (
          <BrandAssetsTab
            assets={brandAssets}
            selectedAsset={selectedAsset}
            onSelectAsset={setSelectedAsset}
            onUpload={() => fileInputRef.current?.click()}
            onDelete={handleDeleteAsset}
            uploading={uploadingAsset}
            currentFolder={currentFolder}
            onFolderChange={setCurrentFolder}
            onCreateFolder={() => setShowNewFolderDialog(true)}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab
            data={analytics}
            loading={loadingAnalytics}
            onRefresh={fetchAnalytics}
          />
        )}
      </div>

      {/* Move Dialog */}
      {showMoveDialog && itemToMove && (
        <MoveDialog
          item={itemToMove}
          folderTree={folderTree}
          onMove={handleMoveToFolder}
          onClose={() => {
            setShowMoveDialog(false)
            setItemToMove(null)
          }}
        />
      )}

      {/* New Folder Dialog */}
      {showNewFolderDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-96 border border-gray-800">
            <h3 className="text-lg font-bold mb-4 text-white">Create New Folder</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Folder Name</label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Enter folder name"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Quick Create</label>
                <div className="grid grid-cols-2 gap-2">
                  {FOLDER_TEMPLATES.map(template => (
                    <button
                      key={template.name}
                      onClick={() => setNewFolderName(template.name)}
                      className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-left transition-colors flex items-center gap-2"
                    >
                      <span className="text-lg">{template.icon}</span>
                      <span className={`text-sm ${template.color}`}>{template.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <button
                onClick={() => {
                  setShowNewFolderDialog(false)
                  setNewFolderName('')
                }}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg transition-colors disabled:opacity-50 border border-orange-500/30"
              >
                Create Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-1 min-w-[180px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseLeave={() => setContextMenu(null)}
        >
          <button
            onClick={() => {
              handleOpenInWorkspace(contextMenu.item)
              setContextMenu(null)
            }}
            className="w-full px-4 py-2 hover:bg-gray-800 text-left flex items-center gap-2 text-sm text-gray-300"
          >
            <Edit className="w-4 h-4" />
            Open in Workspace
          </button>
          <button
            onClick={() => {
              setItemToMove(contextMenu.item)
              setShowMoveDialog(true)
              setContextMenu(null)
            }}
            className="w-full px-4 py-2 hover:bg-gray-800 text-left flex items-center gap-2 text-sm text-gray-300"
          >
            <Move className="w-4 h-4" />
            Move to Folder
          </button>
          <button
            onClick={() => {
              setItemToExport(contextMenu.item)
              setShowExportDialog(true)
              setContextMenu(null)
            }}
            className="w-full px-4 py-2 hover:bg-gray-800 text-left flex items-center gap-2 text-sm text-gray-300"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <div className="border-t border-gray-800 my-1" />
          <button
            onClick={() => {
              handleDeleteContent(contextMenu.item.id)
              setContextMenu(null)
            }}
            className="w-full px-4 py-2 hover:bg-red-500/10 text-left flex items-center gap-2 text-sm text-red-400"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}

      {/* Export Dialog */}
      {showExportDialog && itemToExport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-[480px] max-h-[80vh] overflow-y-auto border border-gray-800">
            <h3 className="text-lg font-bold mb-2 text-white">Export Content</h3>
            <p className="text-sm text-gray-400 mb-4">Exporting: {itemToExport.title}</p>

            {/* Mode Tabs */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => setExportMode('basic')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  exportMode === 'basic'
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800'
                }`}
              >
                Basic Export
              </button>
              <button
                onClick={() => setExportMode('attach')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  exportMode === 'attach'
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800'
                }`}
              >
                Use Template
              </button>
            </div>

            {/* Basic Export Options - NEW: Word, PowerPoint, Google Docs/Slides */}
            {exportMode === 'basic' && (
              <div className="space-y-2 mb-6">
                <button
                  onClick={async () => {
                    await handleExport(itemToExport, 'word')
                    setShowExportDialog(false)
                    setItemToExport(null)
                    setExportMode('basic')
                  }}
                  disabled={mergingTemplate}
                  className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="font-medium text-white">📄 Microsoft Word (.docx)</div>
                  <div className="text-xs text-gray-400">Download as formatted Word document</div>
                </button>
                <button
                  onClick={async () => {
                    await handleExport(itemToExport, 'powerpoint')
                    setShowExportDialog(false)
                    setItemToExport(null)
                    setExportMode('basic')
                  }}
                  disabled={mergingTemplate}
                  className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="font-medium text-white">📊 PowerPoint (.pptx)</div>
                  <div className="text-xs text-gray-400">Generate presentation via Gamma</div>
                </button>
                <button
                  onClick={async () => {
                    await handleExport(itemToExport, 'google-docs')
                    setShowExportDialog(false)
                    setItemToExport(null)
                    setExportMode('basic')
                  }}
                  disabled={mergingTemplate}
                  className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="font-medium text-white">📝 Google Docs</div>
                  <div className="text-xs text-gray-400">Open in Google Docs (content copied to clipboard)</div>
                </button>
                <button
                  onClick={async () => {
                    await handleExport(itemToExport, 'google-slides')
                    setShowExportDialog(false)
                    setItemToExport(null)
                    setExportMode('basic')
                  }}
                  disabled={mergingTemplate}
                  className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="font-medium text-white">🎤 Google Slides</div>
                  <div className="text-xs text-gray-400">Open in Google Slides (content copied to clipboard)</div>
                </button>
              </div>
            )}

            {/* Use Template - Attach to existing templates */}
            {exportMode === 'attach' && (
              <div className="space-y-4 mb-6">
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-xs text-green-300">
                    <strong>Use Template:</strong> Appends your content to your branded template (letterhead, presentation, etc.). Your content will be added to the end of the document for easy editing.
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Select Brand Template</label>
                  {brandAssets.filter(a => a.asset_type.startsWith('template-')).length === 0 ? (
                    <div className="text-center py-8 bg-gray-800/30 rounded-lg border border-gray-800">
                      <FileText className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                      <p className="text-gray-500 text-sm mb-2">No templates available</p>
                      <p className="text-xs text-gray-600">Upload .docx or .pptx templates to Brand Assets</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-800 rounded-lg p-2">
                      {brandAssets
                        .filter(a => a.asset_type.startsWith('template-') && a.status === 'active')
                        .map(template => (
                          <button
                            key={template.id}
                            onClick={() => setSelectedTemplateId(template.id)}
                            className={`w-full px-3 py-2 rounded-lg transition-all text-left ${
                              selectedTemplateId === template.id
                                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                : 'bg-gray-800/50 hover:bg-gray-800 text-gray-300 border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <FileText className="w-4 h-4" />
                              <span className="font-medium text-sm">{template.name}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {template.asset_type} • Used {template.usage_count}x
                            </div>
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={async () => {
                    await handleAttachToTemplate(itemToExport, selectedTemplateId)
                    setShowExportDialog(false)
                    setItemToExport(null)
                    setSelectedTemplateId('')
                    setExportMode('basic')
                  }}
                  disabled={!selectedTemplateId || mergingTemplate}
                  className="w-full px-4 py-3 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-orange-500/30 font-medium"
                >
                  {mergingTemplate ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader className="w-4 h-4 animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    'Download with Template'
                  )}
                </button>
              </div>
            )}

            <button
              onClick={() => {
                setShowExportDialog(false)
                setItemToExport(null)
                setSelectedTemplateId('')
                setExportMode('basic')
              }}
              className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Content Library Tab Component
function ContentLibraryTab({
  folderTree,
  selectedContent,
  onSelectContent,
  searchQuery,
  onSearchChange,
  onToggleFolder,
  onDeleteContent,
  onMoveContent,
  onOpenInWorkspace,
  onExport,
  onCreateFolder,
  loading,
  onContextMenu,
  onToggleExecuted,
  onUpdateResult,
  onUpdateFeedback,
  editingResultFor,
  setEditingResultFor,
  executingAction,
  getResultFieldForType
}: {
  folderTree: FolderNode[]
  selectedContent: ContentItem | null
  onSelectContent: (item: ContentItem | null) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  onToggleFolder: (path: string) => void
  onDeleteContent: (id: string) => void
  onMoveContent: (item: ContentItem) => void
  onOpenInWorkspace: (item: ContentItem) => void
  onExport: (item: ContentItem) => void
  onCreateFolder: () => void
  loading: boolean
  onContextMenu: (e: React.MouseEvent, item: ContentItem) => void
  onToggleExecuted: (item: ContentItem, executed: boolean) => Promise<void>
  onUpdateResult: (item: ContentItem, resultValue: string, resultNotes: string) => Promise<void>
  onUpdateFeedback: (item: ContentItem, feedback: string) => Promise<void>
  editingResultFor: string | null
  setEditingResultFor: (id: string | null) => void
  executingAction: boolean
  getResultFieldForType: (contentType: string) => { label: string; placeholder: string; resultType: string }
}) {
  // Local state for result form
  const [resultValue, setResultValue] = useState('')
  const [resultNotes, setResultNotes] = useState('')
  const [feedbackText, setFeedbackText] = useState('')

  // Reset form when selected content changes
  useEffect(() => {
    if (selectedContent) {
      setResultValue(selectedContent.result?.value?.toString() || '')
      setResultNotes(selectedContent.result?.notes || '')
      setFeedbackText(selectedContent.feedback || '')
    }
  }, [selectedContent?.id])

  // Filter items by search
  const filterItems = (items: ContentItem[]): ContentItem[] => {
    if (!searchQuery) return items
    return items.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.themes?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.topics?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }

  const renderFolderNode = (node: FolderNode, depth: number = 0) => {
    const template = FOLDER_TEMPLATES.find(t => t.name === node.name)
    const filteredItems = filterItems(node.items)
    const hasVisibleItems = filteredItems.length > 0
    const hasVisibleChildren = node.children.some(child =>
      filterItems(child.items).length > 0 || child.children.length > 0
    )

    if (!hasVisibleItems && !hasVisibleChildren && searchQuery) return null

    return (
      <div key={node.path}>
        {/* Folder Header */}
        <button
          onClick={() => onToggleFolder(node.path)}
          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-800/50 rounded-lg transition-colors group"
          style={{ paddingLeft: `${depth * 12 + 12}px` }}
        >
          <ChevronRight
            className={`w-4 h-4 text-gray-500 transition-transform ${
              node.expanded ? 'rotate-90' : ''
            }`}
          />
          {node.expanded ? (
            <FolderOpen className={`w-4 h-4 ${template?.color || 'text-gray-400'}`} />
          ) : (
            <Folder className={`w-4 h-4 ${template?.color || 'text-gray-400'}`} />
          )}
          <span className="flex-1 text-left text-sm font-medium text-gray-300">
            {template?.icon && <span className="mr-1">{template.icon}</span>}
            {node.name}
          </span>
          <span className="text-xs text-gray-500">
            {node.items.length + node.children.reduce((sum, c) => sum + c.items.length, 0)}
          </span>
        </button>

        {/* Folder Contents */}
        {node.expanded && (
          <div>
            {/* Child folders */}
            {node.children.map(child => renderFolderNode(child, depth + 1))}

            {/* Files */}
            {filteredItems.map(item => (
              <button
                key={item.id}
                onClick={() => onSelectContent(item)}
                onContextMenu={(e) => onContextMenu(e, item)}
                className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-800/50 rounded-lg transition-colors group ${
                  selectedContent?.id === item.id ? 'bg-orange-500/10 border-l-2 border-orange-500' : ''
                }`}
                style={{ paddingLeft: `${(depth + 1) * 12 + 24}px` }}
              >
                <File className="w-3.5 h-3.5 text-gray-500" />
                <span className="flex-1 text-left text-sm text-gray-300 truncate">
                  {item.title}
                </span>
                <StatusBadge status={item.intelligence_status} size="xs" />
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-full flex">
      {/* Folder Tree Sidebar */}
      <div className="w-80 border-r border-gray-800 bg-gray-900/30 flex flex-col">
        {/* Search & Actions */}
        <div className="p-3 border-b border-gray-800 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search content..."
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500"
            />
          </div>
          <button
            onClick={onCreateFolder}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-lg transition-colors border border-orange-500/20 text-sm font-medium"
          >
            <FolderPlus className="w-4 h-4" />
            New Folder
          </button>
        </div>

        {/* Folder Tree */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader className="w-5 h-5 animate-spin text-gray-500" />
            </div>
          ) : (
            <div className="space-y-1">
              {folderTree.map(node => renderFolderNode(node, 0))}
            </div>
          )}
        </div>
      </div>

      {/* Detail View */}
      <div className="flex-1 overflow-y-auto">
        {selectedContent ? (
          <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedContent.title}</h2>
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(selectedContent.created_at).toLocaleString()}
                    </span>
                    <span className="px-2 py-1 bg-gray-800 rounded text-xs font-medium">
                      {selectedContent.content_type}
                    </span>
                    {selectedContent.folder && (
                      <span className="flex items-center gap-1 text-xs">
                        <Folder className="w-3.5 h-3.5" />
                        {selectedContent.folder}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {/* File Preview/Download Button */}
                  {selectedContent.file_url && (
                    <a
                      href={selectedContent.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg transition-colors border border-cyan-500/20"
                      title="View/Download File"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="text-sm font-medium">View File</span>
                    </a>
                  )}

                  {/* Gamma Presentation Buttons */}
                  {(selectedContent.content_type === 'presentation' || selectedContent.content_type === 'presentation_outline') && selectedContent.metadata?.gamma_url && (
                    <a
                      href={selectedContent.metadata.gamma_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg transition-colors border border-purple-500/20"
                      title="View Gamma Presentation"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span className="text-sm font-medium">View Gamma</span>
                    </a>
                  )}
                  {(selectedContent.content_type === 'presentation' || selectedContent.content_type === 'presentation_outline') && selectedContent.metadata?.pptx_url && (
                    <a
                      href={selectedContent.metadata.pptx_url}
                      download
                      className="flex items-center gap-2 px-3 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-lg transition-colors border border-orange-500/20"
                      title="Download PPTX"
                    >
                      <Download className="w-4 h-4" />
                      <span className="text-sm font-medium">Download PPTX</span>
                    </a>
                  )}
                  <button
                    onClick={() => onOpenInWorkspace(selectedContent)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors border border-blue-500/20"
                    title="Open in Workspace"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="text-sm font-medium">Edit</span>
                  </button>
                  <button
                    onClick={() => onExport(selectedContent)}
                    className="flex items-center gap-2 px-3 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors border border-green-500/20"
                    title="Export"
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-sm font-medium">Export</span>
                  </button>
                  <button
                    onClick={() => onMoveContent(selectedContent)}
                    className="p-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg transition-colors"
                    title="Move to Folder"
                  >
                    <Move className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteContent(selectedContent.id)}
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <StatusBadge status={selectedContent.intelligence_status} size="lg" />
            </div>

            {/* Execution Tracking Section */}
            <div className="mb-6 p-4 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <h3 className="font-semibold text-emerald-400 mb-4 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Execution Tracking
                {selectedContent.executed && (
                  <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                    ✓ Complete
                  </span>
                )}
              </h3>

              {/* Action Buttons */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => onOpenInWorkspace(selectedContent)}
                  className="px-3 py-1 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  View Content
                </button>
                {!selectedContent.executed && (
                  <button
                    onClick={() => onToggleExecuted(selectedContent, true)}
                    disabled={executingAction}
                    className="px-3 py-1 rounded text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Mark as Complete
                  </button>
                )}
                {selectedContent.executed && (
                  <button
                    onClick={() => setEditingResultFor(editingResultFor === selectedContent.id ? null : selectedContent.id)}
                    className="px-3 py-1 rounded text-xs font-medium bg-purple-600 text-white hover:bg-purple-700"
                  >
                    {editingResultFor === selectedContent.id ? 'Hide Result' : 'Result'}
                  </button>
                )}
              </div>

              {/* Result Form (collapsible) */}
              {selectedContent.executed && editingResultFor === selectedContent.id && (
                <div className="space-y-3 p-3 bg-gray-900/50 rounded-lg border border-gray-800">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">
                      {getResultFieldForType(selectedContent.content_type).label}
                    </label>
                    <input
                      type="text"
                      value={resultValue}
                      onChange={(e) => setResultValue(e.target.value)}
                      placeholder={getResultFieldForType(selectedContent.content_type).placeholder}
                      className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Notes</label>
                    <textarea
                      value={resultNotes}
                      onChange={(e) => setResultNotes(e.target.value)}
                      placeholder="Additional context or details..."
                      className="w-full px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 min-h-[60px]"
                    />
                  </div>
                  <button
                    onClick={() => onUpdateResult(selectedContent, resultValue, resultNotes)}
                    disabled={executingAction}
                    className="w-full px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-medium disabled:opacity-50"
                  >
                    {executingAction ? 'Saving...' : 'Save Result'}
                  </button>
                </div>
              )}

              {/* Feedback Section */}
              <div className="mt-4">
                <label className="text-xs text-gray-400 mb-1 block">Additional Feedback</label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  onBlur={() => {
                    if (feedbackText !== selectedContent.feedback) {
                      onUpdateFeedback(selectedContent, feedbackText)
                    }
                  }}
                  placeholder="Share your thoughts on this content's performance or usage..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 min-h-[80px]"
                />
                <p className="text-xs text-gray-500 mt-1">Auto-saves when you click away</p>
              </div>

              {/* Current Status Display */}
              {selectedContent.result && (
                <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <p className="text-xs text-purple-300 mb-1 font-medium">Current Result:</p>
                  <p className="text-sm text-white">{selectedContent.result.value}</p>
                  {selectedContent.result.notes && (
                    <p className="text-xs text-gray-400 mt-1">{selectedContent.result.notes}</p>
                  )}
                </div>
              )}
            </div>

            {/* Intelligence Section */}
            {selectedContent.intelligence_status === 'complete' && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                {selectedContent.themes && selectedContent.themes.length > 0 && (
                  <div className="p-4 bg-gradient-to-br from-blue-500/5 to-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Brain className="w-4 h-4 text-blue-400" />
                      <h3 className="font-semibold text-blue-400">Themes</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedContent.themes.map((theme, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-sm border border-blue-500/30"
                        >
                          {theme}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedContent.topics && selectedContent.topics.length > 0 && (
                  <div className="p-4 bg-gradient-to-br from-purple-500/5 to-purple-500/10 border border-purple-500/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Tag className="w-4 h-4 text-purple-400" />
                      <h3 className="font-semibold text-purple-400">Topics</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedContent.topics.map((topic, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-sm border border-purple-500/30"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedContent.entities && Object.keys(selectedContent.entities).length > 0 && (
                  <div className="col-span-2 p-4 bg-gradient-to-br from-green-500/5 to-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-green-400" />
                      <h3 className="font-semibold text-green-400">Entities</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {Object.entries(selectedContent.entities).map(([key, value]) => (
                        <div key={key}>
                          <div className="text-xs text-gray-500 mb-1 capitalize">{key}</div>
                          <div className="text-sm text-gray-300">
                            {Array.isArray(value) ? value.join(', ') : String(value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* File Metadata */}
            {selectedContent.file_url && selectedContent.metadata && (
              <div className="mb-6 p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-lg">
                <h3 className="font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  File Information
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {selectedContent.metadata.fileName && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">File Name</div>
                      <div className="text-gray-300">{selectedContent.metadata.fileName}</div>
                    </div>
                  )}
                  {selectedContent.metadata.fileSize && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">File Size</div>
                      <div className="text-gray-300">
                        {(selectedContent.metadata.fileSize / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  )}
                  {selectedContent.metadata.mimeType && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Type</div>
                      <div className="text-gray-300">{selectedContent.metadata.mimeType}</div>
                    </div>
                  )}
                  {selectedContent.metadata.uploadedAt && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Uploaded</div>
                      <div className="text-gray-300">
                        {new Date(selectedContent.metadata.uploadedAt).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Content */}
            <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
              <h3 className="font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Content
              </h3>
              <div className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
                {selectedContent.content_type === 'image' && selectedContent.metadata?.imageUrl ? (
                  <div className="space-y-3">
                    <img
                      src={selectedContent.metadata.imageUrl}
                      alt={selectedContent.metadata.prompt || selectedContent.title}
                      className="max-w-full h-auto rounded-lg border border-gray-700"
                    />
                    {selectedContent.metadata.prompt && (
                      <div className="text-xs text-gray-500 italic">
                        Prompt: {selectedContent.metadata.prompt}
                      </div>
                    )}
                  </div>
                ) : (
                  typeof selectedContent.content === 'string'
                    ? selectedContent.content
                    : JSON.stringify(selectedContent.content, null, 2)
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Select a file to view details</p>
              <p className="text-sm text-gray-600 mt-1">Or right-click for actions</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Move Dialog Component
function MoveDialog({
  item,
  folderTree,
  onMove,
  onClose
}: {
  item: ContentItem
  folderTree: FolderNode[]
  onMove: (item: ContentItem, folder: string) => void
  onClose: () => void
}) {
  const [selectedPath, setSelectedPath] = useState<string>('')

  const renderFolderOption = (node: FolderNode, depth: number = 0) => (
    <div key={node.path}>
      <button
        onClick={() => setSelectedPath(node.path)}
        className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-800/50 rounded-lg transition-colors text-left ${
          selectedPath === node.path ? 'bg-orange-500/20 text-orange-400' : 'text-gray-300'
        }`}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
      >
        <Folder className="w-4 h-4" />
        <span className="text-sm">{node.name}</span>
      </button>
      {node.children.map(child => renderFolderOption(child, depth + 1))}
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-[480px] max-h-[600px] border border-gray-800 flex flex-col">
        <h3 className="text-lg font-bold mb-2 text-white">Move to Folder</h3>
        <p className="text-sm text-gray-400 mb-4">Moving: {item.title}</p>

        <div className="flex-1 overflow-y-auto border border-gray-800 rounded-lg p-2 mb-4">
          {folderTree.map(node => renderFolderOption(node, 0))}
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={() => onMove(item, selectedPath)}
            disabled={!selectedPath}
            className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg transition-colors disabled:opacity-50 border border-orange-500/30"
          >
            Move Here
          </button>
        </div>
      </div>
    </div>
  )
}

// Brand Assets Tab Component
function BrandAssetsTab({
  assets,
  selectedAsset,
  onSelectAsset,
  onUpload,
  onDelete,
  uploading,
  currentFolder,
  onFolderChange,
  onCreateFolder
}: {
  assets: BrandAsset[]
  selectedAsset: BrandAsset | null
  onSelectAsset: (asset: BrandAsset | null) => void
  onUpload: () => void
  onDelete: (id: string) => void
  uploading: boolean
  currentFolder: string | null
  onFolderChange: (folder: string | null) => void
  onCreateFolder: () => void
}) {
  // Get unique folders from assets
  const folders = Array.from(new Set(assets.map(a => a.folder).filter(Boolean))) as string[]

  // Filter assets by current folder
  const filteredAssets = currentFolder
    ? assets.filter(a => a.folder === currentFolder)
    : assets.filter(a => !a.folder) // Root level assets
  return (
    <div className="h-full flex">
      <div className="w-80 border-r border-gray-800 bg-gray-900/30 overflow-y-auto p-4">
        {/* Folder Navigation */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-400">Folders</h3>
            <button
              onClick={onCreateFolder}
              className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-colors"
              title="New Folder"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1">
            <button
              onClick={() => onFolderChange(null)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm flex items-center gap-2 ${
                currentFolder === null
                  ? 'bg-orange-500/20 text-orange-400'
                  : 'text-gray-400 hover:bg-gray-800/50'
              }`}
            >
              <Folder className="w-4 h-4" />
              <span>All Assets</span>
            </button>
            {folders.map(folder => (
              <button
                key={folder}
                onClick={() => onFolderChange(folder)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm flex items-center gap-2 ${
                  currentFolder === folder
                    ? 'bg-orange-500/20 text-orange-400'
                    : 'text-gray-400 hover:bg-gray-800/50'
                }`}
              >
                <Folder className="w-4 h-4" />
                <span>{folder}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Assets List */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">
            {currentFolder || 'Root'} Assets
          </h3>
          {filteredAssets.length === 0 ? (
            <div className="text-center py-8">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-gray-600" />
              <p className="text-gray-500 text-sm mb-4">
                {currentFolder ? `No assets in ${currentFolder}` : 'No assets in root'}
              </p>
              <button
                onClick={onUpload}
                disabled={uploading}
                className="px-4 py-2 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors text-sm disabled:opacity-50"
              >
                Upload Asset
              </button>
            </div>
          ) : (
            filteredAssets.map(asset => (
              <button
                key={asset.id}
                onClick={() => onSelectAsset(asset)}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  selectedAsset?.id === asset.id
                    ? 'bg-orange-500/20 border border-orange-500/30'
                    : 'bg-gray-800/30 hover:bg-gray-800/50 border border-transparent'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    {asset.asset_type.startsWith('template') && <FileText className="w-4 h-4 text-blue-400" />}
                    {asset.asset_type.startsWith('guidelines') && <Brain className="w-4 h-4 text-purple-400" />}
                    {asset.asset_type === 'logo' && <Image className="w-4 h-4 text-green-400" />}
                    <h4 className="font-medium text-sm text-white line-clamp-1">
                      {asset.name}
                    </h4>
                  </div>
                  <StatusBadge status={asset.status} size="sm" />
                </div>
                <p className="text-xs text-gray-500">
                  {asset.asset_type} • Used {asset.usage_count}x
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {selectedAsset ? (
          <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-6">
              <div className="flex items-start justify-between mb-2">
                <h2 className="text-2xl font-bold text-white">{selectedAsset.name}</h2>
                <button
                  onClick={() => onDelete(selectedAsset.id)}
                  className="flex items-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/20"
                  title="Delete Asset"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Delete</span>
                </button>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span className="px-2 py-0.5 bg-gray-800 rounded">
                  {selectedAsset.asset_type}
                </span>
                <span>Used {selectedAsset.usage_count} times</span>
                <span>{new Date(selectedAsset.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {selectedAsset.status === 'active' && (
              <>
                {selectedAsset.brand_voice_profile && (
                  <div className="mb-6 p-4 bg-gradient-to-br from-purple-500/5 to-purple-500/10 border border-purple-500/20 rounded-lg">
                    <h3 className="font-semibold text-purple-400 mb-3">Brand Voice Profile</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(selectedAsset.brand_voice_profile).map(([key, value]) => (
                        <div key={key}>
                          <div className="text-xs text-gray-500 mb-1 capitalize">
                            {key.replace(/_/g, ' ')}
                          </div>
                          <div className="text-sm text-gray-300">{String(value)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedAsset.extracted_guidelines && (
                  <div className="p-4 bg-gradient-to-br from-blue-500/5 to-blue-500/10 border border-blue-500/20 rounded-lg">
                    <h3 className="font-semibold text-blue-400 mb-3">Extracted Guidelines</h3>
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                      {JSON.stringify(selectedAsset.extracted_guidelines, null, 2)}
                    </pre>
                  </div>
                )}
              </>
            )}

            {selectedAsset.status === 'analyzing' && (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <Loader className="w-8 h-8 mx-auto mb-2 animate-spin text-orange-500" />
                  <p className="text-gray-400">Analyzing asset with Claude...</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Select an asset to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Analytics Tab Component - Campaign Performance Focus
function AnalyticsTab({
  data,
  loading,
  onRefresh
}: {
  data: AnalyticsData
  loading: boolean
  onRefresh: () => void
}) {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Campaign Performance</h2>
            <p className="text-sm text-gray-400 mt-1">Track execution and results across your content</p>
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <Activity className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Executed Content Overview */}
        <div className="p-6 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-lg mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-emerald-400 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Content Execution
            </h3>
            <span className="text-sm text-gray-400">
              {data.executionRate}% completion rate
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-end gap-3 mb-2">
                <span className="text-4xl font-bold text-white">{data.executedContent}</span>
                <span className="text-2xl text-gray-400 pb-1">/ {data.totalContent}</span>
              </div>
              <p className="text-sm text-gray-400">pieces executed</p>
            </div>
            <div className="w-32 h-32 relative">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-800"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - data.executionRate / 100)}`}
                  className="text-emerald-500 transition-all duration-500"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{data.executionRate}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Campaign Attribution - NEW */}
        {data.attribution && (
          <div className="p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-blue-400 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Campaign Attribution
              </h3>
              <span className="text-sm text-gray-400">
                AI-powered media tracking
              </span>
            </div>

            {data.attribution.totalCoverage === 0 ? (
              <div className="text-center py-8">
                <Target className="w-16 h-16 mx-auto mb-4 text-gray-600 opacity-50" />
                <h3 className="text-lg font-medium text-gray-400 mb-2">No Attributions Yet</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  Campaign attribution tracking is ready. When you export content and media coverage is detected,
                  AI-powered attribution will appear here automatically.
                </p>
              </div>
            ) : (
              <>
            {/* Top-level metrics */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
                <div className="text-sm text-gray-400 mb-1">Total Coverage</div>
                <div className="text-3xl font-bold text-white">{data.attribution.totalCoverage}</div>
                <div className="text-xs text-blue-300 mt-1">
                  {data.attribution.highConfidenceMatches} high confidence
                </div>
              </div>
              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
                <div className="text-sm text-gray-400 mb-1">Total Reach</div>
                <div className="text-3xl font-bold text-white">
                  {(data.attribution.totalReach / 1000000).toFixed(1)}M
                </div>
                <div className="text-xs text-purple-300 mt-1">estimated audience</div>
              </div>
              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
                <div className="text-sm text-gray-400 mb-1">Avg Confidence</div>
                <div className="text-3xl font-bold text-white">
                  {(data.attribution.avgConfidence * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-emerald-300 mt-1">match accuracy</div>
              </div>
              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
                <div className="text-sm text-gray-400 mb-1">Verification</div>
                <div className="text-3xl font-bold text-white">{data.attribution.verifiedCount}</div>
                <div className="text-xs text-orange-300 mt-1">
                  {data.attribution.pendingVerification} pending
                </div>
              </div>
            </div>

            {/* Sentiment Breakdown */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-400 mb-3">Sentiment Analysis</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-emerald-400">Positive</span>
                    <span className="text-lg font-bold text-white">
                      {data.attribution.sentimentBreakdown.positive}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {((data.attribution.sentimentBreakdown.positive / data.attribution.totalCoverage) * 100).toFixed(0)}% of total
                  </div>
                </div>
                <div className="bg-gray-500/10 border border-gray-500/30 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Neutral</span>
                    <span className="text-lg font-bold text-white">
                      {data.attribution.sentimentBreakdown.neutral}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {((data.attribution.sentimentBreakdown.neutral / data.attribution.totalCoverage) * 100).toFixed(0)}% of total
                  </div>
                </div>
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-red-400">Negative</span>
                    <span className="text-lg font-bold text-white">
                      {data.attribution.sentimentBreakdown.negative}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {((data.attribution.sentimentBreakdown.negative / data.attribution.totalCoverage) * 100).toFixed(0)}% of total
                  </div>
                </div>
              </div>
            </div>

            {/* Top Outlets */}
            {data.attribution.topOutlets.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-400 mb-3">Top Outlets</h4>
                <div className="space-y-2">
                  {data.attribution.topOutlets.slice(0, 5).map((outlet, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-900/50 rounded-lg p-3 border border-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-sm font-bold">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-medium text-white">{outlet.outlet}</div>
                          <div className="text-xs text-gray-500">
                            {(outlet.reach / 1000).toFixed(0)}K reach
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-white">{outlet.count}</div>
                        <div className="text-xs text-gray-500">mentions</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Attribution Timeline */}
            {data.attribution.timeline.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-3">Recent Attributions</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {data.attribution.timeline.slice(0, 10).map((item, idx) => (
                    <div key={idx} className="bg-gray-900/50 rounded-lg p-3 border border-gray-800 hover:bg-gray-800/50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-white hover:text-blue-400 text-sm transition-colors"
                          >
                            {item.title}
                          </a>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded">
                              {item.outlet}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              item.match_type === 'exact_phrase'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : item.match_type === 'semantic'
                                ? 'bg-purple-500/20 text-purple-300'
                                : 'bg-orange-500/20 text-orange-300'
                            }`}>
                              {item.match_type === 'exact_phrase' ? 'Exact Match' :
                               item.match_type === 'semantic' ? 'Semantic Match' : 'Contextual Match'}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              item.sentiment === 'positive'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : item.sentiment === 'negative'
                                ? 'bg-red-500/20 text-red-300'
                                : 'bg-gray-500/20 text-gray-300'
                            }`}>
                              {item.sentiment}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(item.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-white">
                            {(item.confidence * 100).toFixed(0)}%
                          </div>
                          <div className="text-xs text-gray-500">confidence</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            </>
            )}
          </div>
        )}

        {/* Activity Over Time */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <h4 className="text-sm font-medium text-gray-400">Last 24 Hours</h4>
            </div>
            <div className="text-3xl font-bold text-white">{data.activityToday}</div>
            <p className="text-xs text-gray-500 mt-1">pieces executed</p>
          </div>
          <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <h4 className="text-sm font-medium text-gray-400">Last 7 Days</h4>
            </div>
            <div className="text-3xl font-bold text-white">{data.activityThisWeek}</div>
            <p className="text-xs text-gray-500 mt-1">pieces executed</p>
          </div>
          <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-orange-400" />
              <h4 className="text-sm font-medium text-gray-400">Last 30 Days</h4>
            </div>
            <div className="text-3xl font-bold text-white">{data.activityThisMonth}</div>
            <p className="text-xs text-gray-500 mt-1">pieces executed</p>
          </div>
        </div>

        {/* Content Performance */}
        {data.performanceByType.length > 0 && (
          <div className="p-6 bg-gray-900/50 border border-gray-800 rounded-lg mb-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Content Performance
            </h3>
            <div className="space-y-4">
              {data.performanceByType.map(perf => (
                <div key={perf.type} className="border-l-2 border-purple-500/30 pl-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white capitalize">{perf.type.replace(/-/g, ' ')}</h4>
                    <span className="text-sm text-gray-400">{perf.executed} executed</span>
                  </div>
                  {perf.results.length > 0 ? (
                    <div className="space-y-1.5">
                      {perf.results.slice(0, 3).map((result, idx) => (
                        <div key={idx} className="text-sm bg-gray-800/50 rounded px-3 py-2">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300 text-xs truncate flex-1">{result.label}</span>
                            <span className="text-purple-300 font-medium ml-2">{result.value}</span>
                          </div>
                          {result.notes && (
                            <div className="text-xs text-gray-500 mt-1">{result.notes}</div>
                          )}
                        </div>
                      ))}
                      {perf.results.length > 3 && (
                        <div className="text-xs text-gray-500 text-center py-1">
                          +{perf.results.length - 3} more results
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No results recorded yet</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {data.recentExecutions.length > 0 && (
          <div className="p-6 bg-gray-900/50 border border-gray-800 rounded-lg">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-400" />
              Recent Activity
            </h3>
            <div className="space-y-2">
              {data.recentExecutions.map(item => (
                <div key={item.id} className="p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-medium text-white text-sm">{item.title}</div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs px-2 py-0.5 bg-gray-700 rounded text-gray-300 capitalize">
                          {item.content_type.replace(/-/g, ' ')}
                        </span>
                        {item.folder && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Folder className="w-3 h-3" />
                            {item.folder.split('/').pop()}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {new Date(item.executed_at).toLocaleDateString()}
                        </span>
                      </div>
                      {item.result?.value && (
                        <div className="text-xs text-purple-300 mt-1.5 bg-purple-500/10 px-2 py-1 rounded inline-block">
                          Result: {item.result.value}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {data.executedContent === 0 && (
          <div className="text-center py-12">
            <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-600 opacity-50" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">No Content Executed Yet</h3>
            <p className="text-sm text-gray-500">Mark content as complete to start tracking campaign performance</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Metric Card Component
function MetricCard({
  title,
  value,
  status,
  target,
  icon
}: {
  title: string
  value: string | number
  status: 'success' | 'warning' | 'error'
  target: string
  icon: React.ReactNode
}) {
  const colors = {
    success: 'from-green-500/10 to-green-500/5 border-green-500/20',
    warning: 'from-yellow-500/10 to-yellow-500/5 border-yellow-500/20',
    error: 'from-red-500/10 to-red-500/5 border-red-500/20'
  }

  const iconColors = {
    success: 'text-green-400',
    warning: 'text-yellow-400',
    error: 'text-red-400'
  }

  return (
    <div className={`p-4 bg-gradient-to-br ${colors[status]} border rounded-lg`}>
      <div className="flex items-start justify-between mb-2">
        <div className={iconColors[status]}>{icon}</div>
        {status === 'success' ? (
          <CheckCircle className="w-4 h-4 text-green-400" />
        ) : status === 'warning' ? (
          <AlertCircle className="w-4 h-4 text-yellow-400" />
        ) : (
          <AlertCircle className="w-4 h-4 text-red-400" />
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-gray-400">{title}</div>
      <div className="text-xs text-gray-500 mt-1">Target: {target}</div>
    </div>
  )
}

// Status Badge Component
function StatusBadge({ status, size = 'sm' }: { status: string; size?: 'xs' | 'sm' | 'lg' }) {
  const config: Record<string, { color: string; label: string; icon?: React.ReactNode }> = {
    complete: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Complete', icon: <CheckCircle className="w-3 h-3" /> },
    active: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Active', icon: <CheckCircle className="w-3 h-3" /> },
    pending: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Pending', icon: <Clock className="w-3 h-3" /> },
    processing: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Processing', icon: <Loader className="w-3 h-3 animate-spin" /> },
    analyzing: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Analyzing', icon: <Loader className="w-3 h-3 animate-spin" /> },
    failed: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Failed', icon: <AlertCircle className="w-3 h-3" /> },
    uploading: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Uploading', icon: <Upload className="w-3 h-3" /> }
  }

  const { color, label, icon } = config[status] || config.pending

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    lg: 'text-sm px-3 py-1'
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium border ${color} ${sizeClasses[size]}`}>
      {size !== 'xs' && icon}
      {label}
    </span>
  )
}
