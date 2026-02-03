'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Database, Search, Sparkles, Upload, FileText, Image,
  Brain, Tag, Clock, Folder, TrendingUp, Activity,
  Filter, X, ChevronRight, ChevronDown, Download, Trash2, Eye,
  BarChart3, Zap, CheckCircle, AlertCircle, Loader, Edit,
  FolderPlus, MoreVertical, Move, Copy, FolderOpen, File, ExternalLink, Target,
  ArrowLeft, Globe
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
  // Publishing
  published_at?: string | null
  unpublished_at?: string | null
  content_slug?: string | null
  vertical?: string | null
  canonical_url?: string | null
  author_name?: string | null
  author_title?: string | null
  meta_description?: string | null
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
  { name: 'Founder', icon: '🚀', color: 'text-amber-400' },
  { name: 'Opportunities', icon: '🎯', color: 'text-blue-400' },
  { name: 'Campaigns', icon: '📢', color: 'text-purple-400' },
  { name: 'Crisis', icon: '🚨', color: 'text-red-400' },
  { name: 'Media Plans', icon: '📰', color: 'text-cyan-400' },
  { name: 'Strategies', icon: '💡', color: 'text-green-400' },
  { name: 'Press Releases', icon: '📝', color: 'text-orange-400' },
  { name: 'Social Content', icon: '💬', color: 'text-pink-400' },
  { name: 'Research', icon: '🔬', color: 'text-yellow-400' },
  { name: 'Proposals', icon: '📋', color: 'text-emerald-400' },
  { name: 'Schemas', icon: '🏗️', color: 'text-indigo-400' }
]

interface MemoryVaultModuleProps {
  onOpenInStudio?: (item: ContentItem) => void
}

export default function MemoryVaultModule({ onOpenInStudio }: MemoryVaultModuleProps = {}) {
  const router = useRouter()
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

  // Title editing state
  const [editingTitle, setEditingTitle] = useState(false)
  const [editTitleValue, setEditTitleValue] = useState('')
  const [savingTitle, setSavingTitle] = useState(false)

  // Publish dialog state
  const [showPublishDialog, setShowPublishDialog] = useState(false)
  const [itemToPublish, setItemToPublish] = useState<ContentItem | null>(null)
  const [publishVertical, setPublishVertical] = useState('energy')
  const [publishAuthorName, setPublishAuthorName] = useState('')
  const [publishAuthorTitle, setPublishAuthorTitle] = useState('')
  const [publishMetaDesc, setPublishMetaDesc] = useState('')
  const [publishing, setPublishing] = useState(false)

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
      await updateMemoryVaultContent(item.id, { feedback } as any)

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
      await deleteMemoryVaultContent(id)
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
      await updateMemoryVaultContent(item.id, { folder: newFolder } as any)

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

  // Open in Studio for editing
  const handleOpenInWorkspace = (item: ContentItem) => {
    // Use callback if provided (stays within dashboard), otherwise navigate
    if (onOpenInStudio) {
      onOpenInStudio(item)
    } else {
      // Fallback: Navigate to Studio with content ID and folder for save-back capability
      const params = new URLSearchParams({
        contentId: item.id,
        folder: item.folder || '',
        type: item.content_type
      })
      router.push(`/studio?${params.toString()}`)
    }
  }

  // Publish content to media network
  const handleSaveTitle = async (item: ContentItem, newTitle: string) => {
    if (!newTitle.trim() || newTitle.trim() === item.title) {
      setEditingTitle(false)
      return
    }
    setSavingTitle(true)
    try {
      const res = await fetch('/api/content-library', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, title: newTitle.trim() })
      })
      if (res.ok) {
        // Update local state
        setContentItems(prev => prev.map(ci =>
          ci.id === item.id ? { ...ci, title: newTitle.trim() } : ci
        ))
        if (selectedContent?.id === item.id) {
          setSelectedContent({ ...selectedContent, title: newTitle.trim() })
        }
      }
    } catch (err) {
      console.error('Failed to save title:', err)
    } finally {
      setSavingTitle(false)
      setEditingTitle(false)
    }
  }

  const handlePublishContent = async () => {
    if (!itemToPublish) return
    setPublishing(true)
    try {
      const res = await fetch('/api/content-library/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: itemToPublish.id,
          vertical: publishVertical,
          authorName: publishAuthorName || undefined,
          authorTitle: publishAuthorTitle || undefined,
          metaDescription: publishMetaDesc || undefined,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)

      // Update local state so the button switches to "View Published"
      const updated = contentItems.map(i =>
        i.id === itemToPublish.id
          ? {
              ...i,
              published_at: new Date().toISOString(),
              unpublished_at: null,
              content_slug: data.slug,
              vertical: data.vertical,
              canonical_url: data.publishedUrl,
              author_name: publishAuthorName || null,
              author_title: publishAuthorTitle || null,
            }
          : i
      )
      setContentItems(updated)
      setFolderTree(buildFolderTree(updated))
      if (selectedContent?.id === itemToPublish.id) {
        setSelectedContent(updated.find(i => i.id === itemToPublish.id) || null)
      }

      setShowPublishDialog(false)
      setItemToPublish(null)
      setPublishAuthorName('')
      setPublishAuthorTitle('')
      setPublishMetaDesc('')
      window.open(data.publishedUrl, '_blank')
    } catch (error) {
      console.error('Publish error:', error)
      alert(`Failed to publish: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setPublishing(false)
    }
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
        // Use Gamma to generate PowerPoint via Supabase Edge Function
        console.log('Generating PowerPoint via Gamma...')

        // Start generation
        const { data: startResult, error: startError } = await supabase.functions.invoke('gamma-presentation', {
          body: {
            title: item.title,
            content: textContent,
            organization_id: organization?.id,
            capture: true, // Save to campaign_presentations and Memory Vault
            options: {
              numCards: 10,
              imageSource: 'ai'
            }
          }
        })

        if (startError) throw new Error(`Failed to start presentation generation: ${startError.message}`)
        if (!startResult?.generationId) throw new Error('No generation ID returned')

        console.log('📝 Generation started:', startResult.generationId)
        alert('Presentation generation started! This takes 30-60 seconds. You will be notified when complete.')

        // Poll for completion (Gamma takes 30-60 seconds)
        const pollInterval = 5000 // 5 seconds
        const maxAttempts = 24 // 2 minutes max
        let attempts = 0

        const pollForCompletion = async () => {
          attempts++
          console.log(`🔄 Polling attempt ${attempts}/${maxAttempts}...`)

          const { data: statusResult, error: statusError } = await supabase.functions.invoke('gamma-presentation', {
            body: {
              generationId: startResult.generationId,
              capture: true,
              organization_id: organization?.id
            }
          })

          if (statusError) {
            console.error('Status check error:', statusError)
            if (attempts < maxAttempts) {
              setTimeout(pollForCompletion, pollInterval)
            }
            return
          }

          if (statusResult?.status === 'completed') {
            console.log('✅ Presentation completed!')

            // Open Gamma URL if available
            if (statusResult.gammaUrl) {
              window.open(statusResult.gammaUrl, '_blank')
            }

            // Download PPTX if available
            if (statusResult.exportUrls?.pptx) {
              const a = document.createElement('a')
              a.href = statusResult.exportUrls.pptx
              a.download = `${item.title.replace(/[^a-z0-9]/gi, '_')}.pptx`
              a.target = '_blank'
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
            }

            alert('✅ Presentation ready! Opening in Gamma...')
          } else if (statusResult?.status === 'error') {
            console.error('Generation failed:', statusResult.message)
            alert(`Presentation generation failed: ${statusResult.message}`)
          } else if (attempts < maxAttempts) {
            // Still pending, keep polling
            setTimeout(pollForCompletion, pollInterval)
          } else {
            console.log('⏱️ Polling timed out - check Memory Vault later')
            alert('Generation is taking longer than expected. Check Memory Vault in a few minutes.')
          }
        }

        // Start polling after initial delay
        setTimeout(pollForCompletion, pollInterval)

        console.log('✅ PowerPoint generation initiated via Gamma')
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
      await saveToMemoryVault({
        title: `.folder_${newFolderName.trim()}`,
        type: 'folder-marker',
        content: '',
        folder: folderPath,
        organization_id: organization?.id,
        metadata: { intelligence_status: 'complete' }
      })

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
    <div
      className="h-full flex-1 overflow-hidden"
      style={{
        display: 'grid',
        gridTemplateColumns: '260px 1fr',
        minHeight: 0
      }}
    >
      {/* Vault Sidebar - White/Light */}
      <div
        className="flex flex-col border-r overflow-hidden"
        style={{
          background: 'var(--white)',
          borderColor: 'var(--grey-200)'
        }}
      >
        {/* Sidebar Header */}
        <div className="p-5 border-b" style={{ borderColor: 'var(--grey-200)' }}>
          <div
            className="text-[0.7rem] uppercase tracking-wider mb-1"
            style={{ color: 'var(--burnt-orange)', fontFamily: 'var(--font-display)' }}
          >
            Memory Vault
          </div>
          <div
            className="text-lg font-semibold"
            style={{ color: 'var(--charcoal)', fontFamily: 'var(--font-display)' }}
          >
            Folders
          </div>
        </div>

        {/* Tabs as Sidebar Sections */}
        <div className="flex-1 overflow-y-auto p-3">
          {/* Library/Assets/Analytics Tab Switcher */}
          <div className="space-y-1 mb-4">
            <button
              onClick={() => setActiveTab('library')}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors"
              style={{
                background: activeTab === 'library' ? 'var(--burnt-orange-muted)' : 'transparent',
                color: activeTab === 'library' ? 'var(--burnt-orange)' : 'var(--grey-600)',
                fontFamily: 'var(--font-body)'
              }}
            >
              <FileText className="w-4 h-4 opacity-70" />
              <span className="flex-1 text-left">Content Library</span>
              <span className="text-xs" style={{ color: 'var(--grey-400)' }}>
                {contentItems.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('assets')}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors"
              style={{
                background: activeTab === 'assets' ? 'var(--burnt-orange-muted)' : 'transparent',
                color: activeTab === 'assets' ? 'var(--burnt-orange)' : 'var(--grey-600)',
                fontFamily: 'var(--font-body)'
              }}
            >
              <Sparkles className="w-4 h-4 opacity-70" />
              <span className="flex-1 text-left">Brand Assets</span>
              <span className="text-xs" style={{ color: 'var(--grey-400)' }}>
                {brandAssets.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors"
              style={{
                background: activeTab === 'analytics' ? 'var(--burnt-orange-muted)' : 'transparent',
                color: activeTab === 'analytics' ? 'var(--burnt-orange)' : 'var(--grey-600)',
                fontFamily: 'var(--font-body)'
              }}
            >
              <BarChart3 className="w-4 h-4 opacity-70" />
              <span className="flex-1 text-left">Analytics</span>
            </button>
          </div>

          {/* Folder List (when Library tab is active) */}
          {activeTab === 'library' && (
            <>
              <div
                className="mt-4 pt-4 border-t"
                style={{ borderColor: 'var(--grey-200)' }}
              >
                <div
                  className="px-3 py-2 text-xs uppercase tracking-wider"
                  style={{ color: 'var(--grey-400)', fontFamily: 'var(--font-display)' }}
                >
                  Content Folders
                </div>
              </div>
              <div className="space-y-0.5">
                {/* All Items */}
                <button
                  onClick={() => {
                    setSelectedFolder(null)
                    setSelectedContent(null)
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors"
                  style={{
                    background: selectedFolder === null && !selectedContent ? 'var(--burnt-orange-muted)' : 'transparent',
                    color: selectedFolder === null && !selectedContent ? 'var(--burnt-orange)' : 'var(--grey-600)',
                    fontFamily: 'var(--font-body)'
                  }}
                >
                  <Folder className="w-4 h-4 opacity-70" />
                  <span className="flex-1 text-left">All Items</span>
                  <span className="text-xs" style={{ color: 'var(--grey-400)' }}>
                    {contentItems.length}
                  </span>
                </button>
                {/* Template Folders with Sub-folders */}
                {FOLDER_TEMPLATES.map((folder) => {
                  const folderItems = contentItems.filter(item =>
                    item.folder?.startsWith(folder.name)
                  )
                  const isExpanded = expandedFolders.has(folder.name)
                  const hasItems = folderItems.length > 0

                  // Group items by sub-folder (e.g., "Opportunities/My Opportunity" -> "My Opportunity")
                  const subFolders = new Map<string, ContentItem[]>()
                  const rootItems: ContentItem[] = []

                  folderItems.forEach(item => {
                    if (!item.folder) return
                    const parts = item.folder.split('/')
                    if (parts.length > 1) {
                      // Has sub-folder
                      const subFolderName = parts[1]
                      if (!subFolders.has(subFolderName)) {
                        subFolders.set(subFolderName, [])
                      }
                      subFolders.get(subFolderName)!.push(item)
                    } else {
                      // Direct in root folder
                      rootItems.push(item)
                    }
                  })

                  return (
                    <div key={folder.name}>
                      {/* Folder Header */}
                      <button
                        onClick={() => {
                          if (hasItems) {
                            setExpandedFolders(prev => {
                              const next = new Set(prev)
                              if (next.has(folder.name)) {
                                next.delete(folder.name)
                              } else {
                                next.add(folder.name)
                              }
                              return next
                            })
                          }
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-[var(--grey-100)]"
                        style={{
                          color: 'var(--grey-600)',
                          fontFamily: 'var(--font-body)'
                        }}
                      >
                        {/* Chevron */}
                        {hasItems ? (
                          <ChevronRight
                            className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            style={{ color: 'var(--grey-400)' }}
                          />
                        ) : (
                          <span className="w-3.5" />
                        )}
                        <span className="text-sm">{folder.icon}</span>
                        <span className="flex-1 text-left">{folder.name}</span>
                        <span className="text-xs" style={{ color: 'var(--grey-400)' }}>
                          {folderItems.length}
                        </span>
                      </button>

                      {/* Expanded Sub-folders and Items */}
                      {isExpanded && hasItems && (
                        <div className="ml-5 border-l border-[var(--grey-200)] pl-2 space-y-0.5 py-1">
                          {/* Sub-folders (e.g., individual opportunities) */}
                          {Array.from(subFolders.entries()).map(([subFolderName, items]) => {
                            const subFolderKey = `${folder.name}/${subFolderName}`
                            const isSubExpanded = expandedFolders.has(subFolderKey)

                            return (
                              <div key={subFolderKey}>
                                <button
                                  onClick={() => {
                                    setExpandedFolders(prev => {
                                      const next = new Set(prev)
                                      if (next.has(subFolderKey)) {
                                        next.delete(subFolderKey)
                                      } else {
                                        next.add(subFolderKey)
                                      }
                                      return next
                                    })
                                  }}
                                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors hover:bg-[var(--grey-100)]"
                                  style={{
                                    color: 'var(--grey-600)',
                                    fontFamily: 'var(--font-body)'
                                  }}
                                >
                                  <ChevronRight
                                    className={`w-3 h-3 transition-transform ${isSubExpanded ? 'rotate-90' : ''}`}
                                    style={{ color: 'var(--grey-400)' }}
                                  />
                                  <Folder className="w-3 h-3" style={{ color: 'var(--grey-400)' }} />
                                  <span className="flex-1 text-left truncate">{subFolderName}</span>
                                  <span className="text-[10px]" style={{ color: 'var(--grey-400)' }}>
                                    {items.length}
                                  </span>
                                </button>

                                {/* Items inside sub-folder */}
                                {isSubExpanded && (
                                  <div className="ml-4 border-l border-[var(--grey-200)] pl-2 space-y-0.5 py-1">
                                    {items.map(item => (
                                      <button
                                        key={item.id}
                                        onClick={() => {
                                          setSelectedContent(item)
                                          setSelectedFolder(subFolderKey)
                                        }}
                                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors hover:bg-[var(--grey-100)]"
                                        style={{
                                          background: selectedContent?.id === item.id ? 'var(--burnt-orange-muted)' : 'transparent',
                                          color: selectedContent?.id === item.id ? 'var(--burnt-orange)' : 'var(--grey-500)',
                                          fontFamily: 'var(--font-body)'
                                        }}
                                      >
                                        <FileText className="w-3 h-3 flex-shrink-0" />
                                        <span className="flex-1 text-left truncate">{item.title}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          })}

                          {/* Root items (items directly in folder, not in sub-folder) */}
                          {rootItems.map(item => (
                            <button
                              key={item.id}
                              onClick={() => {
                                setSelectedContent(item)
                                setSelectedFolder(folder.name)
                              }}
                              className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors hover:bg-[var(--grey-100)]"
                              style={{
                                background: selectedContent?.id === item.id ? 'var(--burnt-orange-muted)' : 'transparent',
                                color: selectedContent?.id === item.id ? 'var(--burnt-orange)' : 'var(--grey-500)',
                                fontFamily: 'var(--font-body)'
                              }}
                            >
                              <FileText className="w-3 h-3 flex-shrink-0" />
                              <span className="flex-1 text-left truncate">{item.title}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Content Area - Charcoal */}
      <div
        className="flex-1 flex flex-col overflow-hidden"
        style={{ background: 'var(--charcoal)' }}
      >
        {/* Header */}
        <div className="flex-shrink-0 p-6 border-b border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div
                className="text-[0.65rem] uppercase tracking-[0.15em] text-[var(--burnt-orange)] flex items-center gap-2 mb-2"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <Database className="w-3 h-3" />
                Vault
              </div>
              <h1
                className="text-[1.5rem] font-normal text-white"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                Memory Vault
              </h1>
              <p className="text-[var(--grey-400)] text-sm mt-1">
                Your organization's institutional knowledge that compounds over time
              </p>
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
                  <div className="bg-[var(--charcoal)] rounded-xl p-6 w-96 border border-zinc-800">
                    <h3 className="text-lg font-semibold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>Create New Folder</h3>
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleCreateBrandFolder()}
                      placeholder="Folder name (e.g., Photos, Templates)"
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-[var(--grey-500)] focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)] mb-4"
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => {
                          setShowNewFolderDialog(false)
                          setNewFolderName('')
                        }}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-[var(--grey-300)] rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateBrandFolder}
                        disabled={!newFolderName.trim()}
                        className="px-4 py-2 bg-[var(--burnt-orange)] hover:brightness-110 text-white rounded-lg transition-colors disabled:opacity-50"
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
                  <div className="bg-[var(--charcoal)] rounded-xl p-6 w-96 border border-zinc-800">
                    <h3 className="text-lg font-semibold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>Upload to Content Library</h3>
                    <p className="text-sm text-[var(--grey-400)] mb-4">
                      Select which folder to upload to:
                    </p>
                    <select
                      value={uploadTargetFolder}
                      onChange={(e) => setUploadTargetFolder(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)] mb-4"
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
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-[var(--grey-300)] rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleContentLibraryUpload}
                        className="px-4 py-2 bg-[var(--burnt-orange)] hover:brightness-110 text-white rounded-lg transition-colors"
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
                className="flex items-center gap-2 px-4 py-2 bg-[var(--burnt-orange)] hover:brightness-110 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {uploadingAsset ? 'Uploading...' : 'Upload'}
              </button>
              <button
                onClick={fetchContent}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                title="Refresh"
              >
                <Activity className="w-4 h-4 text-[var(--grey-400)]" />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          {activeTab === 'library' && (
            <div
              className="flex rounded-lg overflow-hidden shadow-lg max-w-2xl"
              style={{ background: 'var(--white)' }}
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search across all memories, campaigns, learnings..."
                className="flex-1 px-5 py-4 border-none outline-none text-sm"
                style={{
                  background: 'var(--white)',
                  color: 'var(--charcoal)',
                  fontFamily: 'var(--font-body)'
                }}
              />
              <button
                className="px-8 py-4 text-sm font-medium transition-colors"
                style={{
                  background: 'var(--burnt-orange)',
                  color: 'var(--white)',
                  fontFamily: 'var(--font-display)'
                }}
              >
                Search
              </button>
            </div>
          )}
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
            selectedFolder={selectedFolder}
            contentItems={contentItems}
            onPublishContent={(item) => {
              setItemToPublish(item)
              setPublishVertical('commodities')
              setPublishAuthorName('')
              setPublishAuthorTitle('')
              setPublishMetaDesc('')
              setShowPublishDialog(true)
            }}
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
          <div className="bg-[var(--charcoal)] rounded-xl p-6 w-96 border border-zinc-800">
            <h3 className="text-lg font-bold mb-4 text-white" style={{ fontFamily: 'var(--font-display)' }}>Create New Folder</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-[var(--grey-400)] mb-2 block">Folder Name</label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Enter folder name"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)]"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm text-[var(--grey-400)] mb-2 block">Quick Create</label>
                <div className="grid grid-cols-2 gap-2">
                  {FOLDER_TEMPLATES.map(template => (
                    <button
                      key={template.name}
                      onClick={() => setNewFolderName(template.name)}
                      className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-left transition-colors flex items-center gap-2"
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
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-[var(--grey-300)]"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="px-4 py-2 bg-[var(--burnt-orange)] hover:brightness-110 text-white rounded-lg transition-colors disabled:opacity-50"
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
          className="fixed z-50 bg-[var(--charcoal)] border border-zinc-800 rounded-lg shadow-xl py-1 min-w-[180px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseLeave={() => setContextMenu(null)}
        >
          <button
            onClick={() => {
              handleOpenInWorkspace(contextMenu.item)
              setContextMenu(null)
            }}
            className="w-full px-4 py-2 hover:bg-zinc-800 text-left flex items-center gap-2 text-sm text-[var(--grey-300)]"
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
            className="w-full px-4 py-2 hover:bg-zinc-800 text-left flex items-center gap-2 text-sm text-[var(--grey-300)]"
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
            className="w-full px-4 py-2 hover:bg-zinc-800 text-left flex items-center gap-2 text-sm text-[var(--grey-300)]"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <div className="border-t border-zinc-800 my-1" />
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
          <div className="bg-[var(--charcoal)] rounded-xl p-6 w-[480px] max-h-[80vh] overflow-y-auto border border-zinc-800">
            <h3 className="text-lg font-bold mb-2 text-white" style={{ fontFamily: 'var(--font-display)' }}>Export Content</h3>
            <p className="text-sm text-[var(--grey-400)] mb-4">Exporting: {itemToExport.title}</p>

            {/* Mode Tabs */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => setExportMode('basic')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  exportMode === 'basic'
                    ? 'bg-[var(--burnt-orange)]/20 text-[var(--burnt-orange)] border border-[var(--burnt-orange)]/30'
                    : 'bg-zinc-800/50 text-[var(--grey-400)] hover:bg-zinc-800'
                }`}
              >
                Basic Export
              </button>
              <button
                onClick={() => setExportMode('attach')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  exportMode === 'attach'
                    ? 'bg-[var(--burnt-orange)]/20 text-[var(--burnt-orange)] border border-[var(--burnt-orange)]/30'
                    : 'bg-zinc-800/50 text-[var(--grey-400)] hover:bg-zinc-800'
                }`}
              >
                Use Template
              </button>
            </div>

            {/* Export Options */}
            {exportMode === 'basic' && (
              <div className="space-y-2 mb-6">
                {/* Gamma Presentation Export Options */}
                {(itemToExport.content_type === 'presentation' || itemToExport.content_type === 'presentation_outline') && itemToExport.metadata?.gamma_url ? (
                  <>
                    {/* Download PPTX if available */}
                    {itemToExport.metadata?.pptx_url && (
                      <a
                        href={itemToExport.metadata.pptx_url}
                        download
                        onClick={() => {
                          setShowExportDialog(false)
                          setItemToExport(null)
                          setExportMode('basic')
                        }}
                        className="w-full px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-left block"
                      >
                        <div className="font-medium text-white">📊 PowerPoint (.pptx)</div>
                        <div className="text-xs text-[var(--grey-400)]">Download existing presentation</div>
                      </a>
                    )}
                    {/* Export to PDF via Gamma */}
                    <button
                      onClick={async () => {
                        try {
                          setMergingTemplate(true)
                          // Use Gamma's PDF export endpoint
                          const gammaId = itemToExport.metadata?.gamma_id
                          if (gammaId) {
                            const { data, error } = await supabase.functions.invoke('gamma-presentation', {
                              body: {
                                action: 'export',
                                gamma_id: gammaId,
                                format: 'pdf'
                              }
                            })
                            if (error) throw error
                            if (data?.exportUrl) {
                              window.open(data.exportUrl, '_blank')
                            } else {
                              // Fallback: open Gamma URL for manual PDF export
                              window.open(itemToExport.metadata?.gamma_url + '/export/pdf', '_blank')
                            }
                          } else {
                            // Fallback: open Gamma for export
                            window.open(itemToExport.metadata?.gamma_url, '_blank')
                            alert('Open the presentation in Gamma and use Export → PDF')
                          }
                        } catch (error) {
                          console.error('PDF export error:', error)
                          // Fallback
                          window.open(itemToExport.metadata?.gamma_url, '_blank')
                          alert('Open the presentation in Gamma and use Export → PDF')
                        } finally {
                          setMergingTemplate(false)
                          setShowExportDialog(false)
                          setItemToExport(null)
                          setExportMode('basic')
                        }
                      }}
                      disabled={mergingTemplate}
                      className="w-full px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="font-medium text-white">📕 PDF</div>
                      <div className="text-xs text-[var(--grey-400)]">Export presentation as PDF</div>
                    </button>
                    {/* Export to Google Slides */}
                    <button
                      onClick={async () => {
                        try {
                          setMergingTemplate(true)
                          const gammaId = itemToExport.metadata?.gamma_id
                          if (gammaId) {
                            const { data, error } = await supabase.functions.invoke('gamma-presentation', {
                              body: {
                                action: 'export',
                                gamma_id: gammaId,
                                format: 'google-slides'
                              }
                            })
                            if (error) throw error
                            if (data?.exportUrl) {
                              window.open(data.exportUrl, '_blank')
                            } else {
                              window.open(itemToExport.metadata?.gamma_url, '_blank')
                              alert('Open the presentation in Gamma and use Export → Google Slides')
                            }
                          } else {
                            window.open(itemToExport.metadata?.gamma_url, '_blank')
                            alert('Open the presentation in Gamma and use Export → Google Slides')
                          }
                        } catch (error) {
                          console.error('Google Slides export error:', error)
                          window.open(itemToExport.metadata?.gamma_url, '_blank')
                          alert('Open the presentation in Gamma and use Export → Google Slides')
                        } finally {
                          setMergingTemplate(false)
                          setShowExportDialog(false)
                          setItemToExport(null)
                          setExportMode('basic')
                        }
                      }}
                      disabled={mergingTemplate}
                      className="w-full px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="font-medium text-white">🎤 Google Slides</div>
                      <div className="text-xs text-[var(--grey-400)]">Export to Google Slides</div>
                    </button>
                  </>
                ) : itemToExport.content_type === 'image' && (itemToExport.metadata?.imageUrl || itemToExport.content?.imageUrl) ? (
                  <>
                    {/* Image Export Options */}
                    <button
                      onClick={async () => {
                        try {
                          const imageUrl = itemToExport.metadata?.imageUrl || itemToExport.content?.imageUrl
                          if (!imageUrl) {
                            alert('No image URL found')
                            return
                          }

                          // For base64 images, convert directly
                          if (imageUrl.startsWith('data:')) {
                            const a = document.createElement('a')
                            a.href = imageUrl
                            a.download = `${itemToExport.title?.replace(/[^a-z0-9]/gi, '_') || 'image'}.png`
                            document.body.appendChild(a)
                            a.click()
                            document.body.removeChild(a)
                          } else {
                            // For URL images, fetch and download
                            const response = await fetch(imageUrl)
                            const blob = await response.blob()
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = `${itemToExport.title?.replace(/[^a-z0-9]/gi, '_') || 'image'}.png`
                            document.body.appendChild(a)
                            a.click()
                            document.body.removeChild(a)
                            URL.revokeObjectURL(url)
                          }

                          setShowExportDialog(false)
                          setItemToExport(null)
                          setExportMode('basic')
                        } catch (error) {
                          console.error('Image export error:', error)
                          alert('Failed to export image')
                        }
                      }}
                      className="w-full px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-left"
                    >
                      <div className="font-medium text-white">🖼️ PNG Image (.png)</div>
                      <div className="text-xs text-[var(--grey-400)]">Download as PNG (original quality)</div>
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const imageUrl = itemToExport.metadata?.imageUrl || itemToExport.content?.imageUrl
                          if (!imageUrl) {
                            alert('No image URL found')
                            return
                          }

                          // Create canvas to convert to JPEG
                          const img = new window.Image()
                          img.crossOrigin = 'anonymous'

                          img.onload = () => {
                            const canvas = document.createElement('canvas')
                            canvas.width = img.width
                            canvas.height = img.height
                            const ctx = canvas.getContext('2d')
                            if (ctx) {
                              // Fill with white background for JPEG (no transparency)
                              ctx.fillStyle = '#FFFFFF'
                              ctx.fillRect(0, 0, canvas.width, canvas.height)
                              ctx.drawImage(img, 0, 0)

                              canvas.toBlob((blob) => {
                                if (blob) {
                                  const url = URL.createObjectURL(blob)
                                  const a = document.createElement('a')
                                  a.href = url
                                  a.download = `${itemToExport.title?.replace(/[^a-z0-9]/gi, '_') || 'image'}.jpg`
                                  document.body.appendChild(a)
                                  a.click()
                                  document.body.removeChild(a)
                                  URL.revokeObjectURL(url)
                                }
                              }, 'image/jpeg', 0.92)
                            }
                          }

                          img.onerror = () => {
                            alert('Failed to load image for conversion')
                          }

                          img.src = imageUrl

                          setShowExportDialog(false)
                          setItemToExport(null)
                          setExportMode('basic')
                        } catch (error) {
                          console.error('JPEG export error:', error)
                          alert('Failed to export as JPEG')
                        }
                      }}
                      className="w-full px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-left"
                    >
                      <div className="font-medium text-white">📷 JPEG Image (.jpg)</div>
                      <div className="text-xs text-[var(--grey-400)]">Download as JPEG (smaller file size)</div>
                    </button>
                  </>
                ) : (
                  <>
                    {/* Standard Export Options for non-Gamma content */}
                    <button
                      onClick={async () => {
                        await handleExport(itemToExport, 'word')
                        setShowExportDialog(false)
                        setItemToExport(null)
                        setExportMode('basic')
                      }}
                      disabled={mergingTemplate}
                      className="w-full px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="font-medium text-white">📄 Microsoft Word (.docx)</div>
                      <div className="text-xs text-[var(--grey-400)]">Download as formatted Word document</div>
                    </button>
                    <button
                      onClick={async () => {
                        await handleExport(itemToExport, 'powerpoint')
                        setShowExportDialog(false)
                        setItemToExport(null)
                        setExportMode('basic')
                      }}
                      disabled={mergingTemplate}
                      className="w-full px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="font-medium text-white">📊 PowerPoint (.pptx)</div>
                      <div className="text-xs text-[var(--grey-400)]">Generate presentation via Gamma</div>
                    </button>
                    <button
                      onClick={async () => {
                        await handleExport(itemToExport, 'google-docs')
                        setShowExportDialog(false)
                        setItemToExport(null)
                        setExportMode('basic')
                      }}
                      disabled={mergingTemplate}
                      className="w-full px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="font-medium text-white">📝 Google Docs</div>
                      <div className="text-xs text-[var(--grey-400)]">Open in Google Docs (content copied to clipboard)</div>
                    </button>
                    <button
                      onClick={async () => {
                        await handleExport(itemToExport, 'google-slides')
                        setShowExportDialog(false)
                        setItemToExport(null)
                        setExportMode('basic')
                      }}
                      disabled={mergingTemplate}
                      className="w-full px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="font-medium text-white">🎤 Google Slides</div>
                      <div className="text-xs text-[var(--grey-400)]">Open in Google Slides (content copied to clipboard)</div>
                    </button>
                    <button
                      onClick={() => {
                        // Export as formatted JSON (useful for schemas)
                        const content = typeof itemToExport.content === 'string'
                          ? itemToExport.content
                          : JSON.stringify(itemToExport.content, null, 2)

                        const blob = new Blob([content], { type: 'application/json' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `${itemToExport.title.replace(/[^a-z0-9]/gi, '_')}.json`
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                        URL.revokeObjectURL(url)

                        setShowExportDialog(false)
                        setItemToExport(null)
                        setExportMode('basic')
                      }}
                      disabled={mergingTemplate}
                      className="w-full px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="font-medium text-white">📋 JSON (.json)</div>
                      <div className="text-xs text-[var(--grey-400)]">Download formatted JSON (recommended for schemas)</div>
                    </button>
                  </>
                )}
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
                  <label className="text-sm text-[var(--grey-400)] mb-2 block">Select Brand Template</label>
                  {brandAssets.filter(a => a.asset_type.startsWith('template-')).length === 0 ? (
                    <div className="text-center py-8 bg-zinc-800/30 rounded-lg border border-zinc-800">
                      <FileText className="w-8 h-8 mx-auto mb-2 text-[var(--grey-600)]" />
                      <p className="text-[var(--grey-500)] text-sm mb-2">No templates available</p>
                      <p className="text-xs text-[var(--grey-600)]">Upload .docx or .pptx templates to Brand Assets</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto border border-zinc-800 rounded-lg p-2">
                      {brandAssets
                        .filter(a => a.asset_type.startsWith('template-') && a.status === 'active')
                        .map(template => (
                          <button
                            key={template.id}
                            onClick={() => setSelectedTemplateId(template.id)}
                            className={`w-full px-3 py-2 rounded-lg transition-all text-left ${
                              selectedTemplateId === template.id
                                ? 'bg-[var(--burnt-orange)]/20 text-[var(--burnt-orange)] border border-[var(--burnt-orange)]/30'
                                : 'bg-zinc-800/50 hover:bg-zinc-800 text-[var(--grey-300)] border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <FileText className="w-4 h-4" />
                              <span className="font-medium text-sm">{template.name}</span>
                            </div>
                            <div className="text-xs text-[var(--grey-500)]">
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
              className="w-full px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-[var(--grey-300)]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Publish Dialog */}
      {showPublishDialog && itemToPublish && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--charcoal)] rounded-xl p-6 w-[480px] max-h-[80vh] overflow-y-auto border border-zinc-800">
            <h3 className="text-lg font-bold mb-2 text-white" style={{ fontFamily: 'var(--font-display)' }}>
              Publish to Media Network
            </h3>
            <p className="text-sm text-[var(--grey-400)] mb-4">
              Publishing: {itemToPublish.title}
            </p>

            <div className="space-y-4">
              {/* Vertical selector */}
              <div>
                <label className="block text-xs font-medium text-[var(--grey-400)] mb-1 uppercase tracking-wider">
                  Vertical
                </label>
                <select
                  value={publishVertical}
                  onChange={e => setPublishVertical(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-[var(--burnt-orange)]"
                >
                  <option value="commodities">Commodities</option>
                  <option value="tech">Tech</option>
                  <option value="consulting">Consulting</option>
                  <option value="finance">Finance</option>
                </select>
              </div>

              {/* Slug preview */}
              <div>
                <label className="block text-xs font-medium text-[var(--grey-400)] mb-1 uppercase tracking-wider">
                  URL Preview
                </label>
                <div className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-[var(--grey-500)] text-sm font-mono truncate">
                  /{publishVertical}/{itemToPublish.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').slice(0, 60)}
                </div>
              </div>

              {/* Author name */}
              <div>
                <label className="block text-xs font-medium text-[var(--grey-400)] mb-1 uppercase tracking-wider">
                  Author Name <span className="text-[var(--grey-600)]">(optional)</span>
                </label>
                <input
                  type="text"
                  value={publishAuthorName}
                  onChange={e => setPublishAuthorName(e.target.value)}
                  placeholder="e.g. Jane Smith"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-[var(--burnt-orange)]"
                />
              </div>

              {/* Author title */}
              <div>
                <label className="block text-xs font-medium text-[var(--grey-400)] mb-1 uppercase tracking-wider">
                  Author Title <span className="text-[var(--grey-600)]">(optional)</span>
                </label>
                <input
                  type="text"
                  value={publishAuthorTitle}
                  onChange={e => setPublishAuthorTitle(e.target.value)}
                  placeholder="e.g. Head of Strategy"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-[var(--burnt-orange)]"
                />
              </div>

              {/* Meta description */}
              <div>
                <label className="block text-xs font-medium text-[var(--grey-400)] mb-1 uppercase tracking-wider">
                  Meta Description <span className="text-[var(--grey-600)]">(optional, for SEO)</span>
                </label>
                <textarea
                  value={publishMetaDesc}
                  onChange={e => setPublishMetaDesc(e.target.value)}
                  placeholder="Brief description for search engines..."
                  rows={2}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-[var(--burnt-orange)] resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handlePublishContent}
                disabled={publishing}
                className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{
                  background: 'var(--burnt-orange)',
                  color: 'var(--white)',
                  fontFamily: 'var(--font-display)'
                }}
              >
                {publishing ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4" />
                    Publish
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowPublishDialog(false)
                  setItemToPublish(null)
                }}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-[var(--grey-300)]"
              >
                Cancel
              </button>
            </div>
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
  getResultFieldForType,
  selectedFolder,
  contentItems,
  onPublishContent
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
  selectedFolder: string | null
  contentItems: ContentItem[]
  onPublishContent: (item: ContentItem) => void
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
          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-800/50 rounded-lg transition-colors group"
          style={{ paddingLeft: `${depth * 12 + 12}px` }}
        >
          <ChevronRight
            className={`w-4 h-4 text-[var(--grey-500)] transition-transform ${
              node.expanded ? 'rotate-90' : ''
            }`}
          />
          {node.expanded ? (
            <FolderOpen className={`w-4 h-4 ${template?.color || 'text-[var(--grey-400)]'}`} />
          ) : (
            <Folder className={`w-4 h-4 ${template?.color || 'text-[var(--grey-400)]'}`} />
          )}
          <span className="flex-1 text-left text-sm font-medium text-[var(--grey-300)]">
            {template?.icon && <span className="mr-1">{template.icon}</span>}
            {node.name}
          </span>
          <span className="text-xs text-[var(--grey-500)]">
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
                className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-800/50 rounded-lg transition-colors group ${
                  selectedContent?.id === item.id ? 'bg-[var(--burnt-orange)]/10 border-l-2 border-[var(--burnt-orange)]' : ''
                }`}
                style={{ paddingLeft: `${(depth + 1) * 12 + 24}px` }}
              >
                <File className="w-3.5 h-3.5 text-[var(--grey-500)]" />
                <span className="flex-1 text-left text-sm text-[var(--grey-300)] truncate">
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

  // Filter items by selected folder
  const filteredItems = contentItems.filter(item => {
    // First filter by search
    const matchesSearch = !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.themes?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.topics?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))

    if (!matchesSearch) return false

    // Then filter by folder
    if (!selectedFolder) return true
    return item.folder?.startsWith(selectedFolder)
  })

  return (
    <div className="h-full overflow-y-auto">
      {selectedContent ? (
          <div className="p-6">
            {/* Back Button */}
            <button
              onClick={() => onSelectContent(null)}
              className="flex items-center gap-2 mb-6 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--grey-800)]"
              style={{ color: 'var(--grey-400)' }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span style={{ fontFamily: 'var(--font-display)' }}>Back to {selectedFolder || 'All Items'}</span>
            </button>

            {/* Content Card */}
            <div
              className="rounded-xl border overflow-hidden"
              style={{ background: 'var(--grey-900)', borderColor: 'var(--grey-800)' }}
            >
              {/* Card Header */}
              <div
                className="px-6 py-5 border-b"
                style={{ borderColor: 'var(--grey-800)' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ background: 'var(--burnt-orange-muted)' }}
                      >
                        <FileText className="w-5 h-5" style={{ color: 'var(--burnt-orange)' }} />
                      </div>
                      <div>
                        {editingTitle ? (
                          <div className="flex items-center gap-2">
                            <input
                              autoFocus
                              value={editTitleValue}
                              onChange={e => setEditTitleValue(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleSaveTitle(selectedContent, editTitleValue)
                                if (e.key === 'Escape') setEditingTitle(false)
                              }}
                              onBlur={() => handleSaveTitle(selectedContent, editTitleValue)}
                              className="text-xl font-semibold bg-transparent border-b-2 outline-none w-full"
                              style={{ color: 'var(--white)', fontFamily: 'var(--font-display)', borderColor: 'var(--burnt-orange)' }}
                              disabled={savingTitle}
                            />
                            {savingTitle && <Loader className="w-4 h-4 animate-spin" style={{ color: 'var(--burnt-orange)' }} />}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <h2
                              className="text-xl font-semibold"
                              style={{ color: 'var(--white)', fontFamily: 'var(--font-display)' }}
                            >
                              {selectedContent.title}
                            </h2>
                            <button
                              onClick={() => { setEditTitleValue(selectedContent.title); setEditingTitle(true) }}
                              className="p-1 rounded hover:bg-white/10 transition-colors"
                              title="Edit title"
                            >
                              <Edit className="w-4 h-4" style={{ color: 'var(--grey-400)' }} />
                            </button>
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          <span
                            className="px-2 py-0.5 rounded text-xs font-medium capitalize"
                            style={{ background: 'var(--burnt-orange-muted)', color: 'var(--burnt-orange)' }}
                          >
                            {selectedContent.content_type.replace(/_/g, ' ')}
                          </span>
                          <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--grey-500)' }}>
                            <Clock className="w-3 h-3" />
                            {new Date(selectedContent.created_at).toLocaleDateString()}
                          </span>
                          {selectedContent.folder && (
                            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--grey-500)' }}>
                              <Folder className="w-3 h-3" />
                              {selectedContent.folder}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                  {/* File Preview/Download Button */}
                  {selectedContent.file_url && (
                    <a
                      href={selectedContent.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                      style={{
                        background: 'var(--burnt-orange)',
                        color: 'var(--white)',
                        fontFamily: 'var(--font-display)'
                      }}
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
                      className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                      style={{
                        background: 'var(--burnt-orange)',
                        color: 'var(--white)',
                        fontFamily: 'var(--font-display)'
                      }}
                      title="Open in Gamma"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span className="text-sm font-medium">Open in Gamma</span>
                    </a>
                  )}
                  {(selectedContent.content_type === 'presentation' || selectedContent.content_type === 'presentation_outline') && selectedContent.metadata?.pptx_url && (
                    <a
                      href={selectedContent.metadata.pptx_url}
                      download
                      className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors border"
                      style={{
                        background: 'var(--grey-800)',
                        borderColor: 'var(--grey-700)',
                        color: 'var(--grey-300)',
                        fontFamily: 'var(--font-display)'
                      }}
                      title="Download PPTX"
                    >
                      <Download className="w-4 h-4" />
                      <span className="text-sm font-medium">Download PPTX</span>
                    </a>
                  )}
                  {/* Publish Button - for thought-leadership and press-release content */}
                  {(selectedContent.content_type === 'thought-leadership' || selectedContent.content_type === 'press-release') && (
                    selectedContent.published_at && !selectedContent.unpublished_at ? (
                      <a
                        href={selectedContent.canonical_url || `/media/${selectedContent.vertical}/${selectedContent.content_slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                        style={{
                          background: 'var(--burnt-orange)',
                          color: 'var(--white)',
                          fontFamily: 'var(--font-display)'
                        }}
                        title="View Published Article"
                      >
                        <Globe className="w-4 h-4" />
                        <span className="text-sm font-medium">View Published</span>
                      </a>
                    ) : (
                      <button
                        onClick={() => onPublishContent(selectedContent)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                        style={{
                          background: 'var(--burnt-orange)',
                          color: 'var(--white)',
                          fontFamily: 'var(--font-display)'
                        }}
                        title="Publish to Media Network"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span className="text-sm font-medium">Publish</span>
                      </button>
                    )
                  )}
                  {/* Edit button - only show for non-gamma content */}
                  {!((selectedContent.content_type === 'presentation' || selectedContent.content_type === 'presentation_outline') && selectedContent.metadata?.gamma_url) && (
                    <button
                      onClick={() => onOpenInWorkspace(selectedContent)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors border"
                      style={{
                        background: 'var(--grey-800)',
                        borderColor: 'var(--grey-700)',
                        color: 'var(--grey-300)',
                        fontFamily: 'var(--font-display)'
                      }}
                      title="Open in Studio"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="text-sm font-medium">Edit</span>
                    </button>
                  )}
                  <button
                    onClick={() => onExport(selectedContent)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors border"
                    style={{
                      background: 'var(--grey-800)',
                      borderColor: 'var(--grey-700)',
                      color: 'var(--grey-300)',
                      fontFamily: 'var(--font-display)'
                    }}
                    title="Export"
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-sm font-medium">Export</span>
                  </button>
                  <button
                    onClick={() => onMoveContent(selectedContent)}
                    className="p-2 rounded-lg transition-colors border"
                    style={{
                      background: 'var(--grey-800)',
                      borderColor: 'var(--grey-700)',
                      color: 'var(--grey-400)'
                    }}
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
              </div>
              </div>

              {/* Card Body */}
              <div className="px-6 py-5">
                <StatusBadge status={selectedContent.intelligence_status} size="lg" />

            {/* Execution Tracking Section */}
            <div
              className="mb-6 rounded-xl border overflow-hidden"
              style={{ background: 'var(--grey-900)', borderColor: 'var(--grey-800)' }}
            >
              {/* Section Header */}
              <div
                className="px-5 py-4 border-b flex items-center justify-between"
                style={{ borderColor: 'var(--grey-800)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: 'var(--burnt-orange)' }}
                    />
                    <span
                      className="text-xs font-medium uppercase tracking-wider"
                      style={{ color: 'var(--burnt-orange)', fontFamily: 'var(--font-display)' }}
                    >
                      Execution Tracking
                    </span>
                  </div>
                  {selectedContent.executed && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--burnt-orange-muted)', color: 'var(--burnt-orange)' }}
                    >
                      ✓ Complete
                    </span>
                  )}
                </div>
              </div>

              {/* Section Body */}
              <div className="p-5">
                {/* Action Buttons */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => onOpenInWorkspace(selectedContent)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                    style={{
                      background: 'var(--burnt-orange)',
                      color: 'var(--white)',
                      fontFamily: 'var(--font-display)'
                    }}
                  >
                    <Eye className="w-3 h-3" />
                    View Content
                  </button>
                  {!selectedContent.executed && (
                    <button
                      onClick={() => onToggleExecuted(selectedContent, true)}
                      disabled={executingAction}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                      style={{
                        background: 'var(--grey-800)',
                        color: 'var(--grey-300)',
                        fontFamily: 'var(--font-display)'
                      }}
                    >
                      Mark as Complete
                    </button>
                  )}
                  {selectedContent.executed && (
                    <button
                      onClick={() => setEditingResultFor(editingResultFor === selectedContent.id ? null : selectedContent.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      style={{
                        background: 'var(--grey-800)',
                        color: 'var(--grey-300)',
                        fontFamily: 'var(--font-display)'
                      }}
                    >
                      {editingResultFor === selectedContent.id ? 'Hide Result' : 'Result'}
                    </button>
                  )}
                </div>

                {/* Result Form (collapsible) */}
                {selectedContent.executed && editingResultFor === selectedContent.id && (
                  <div
                    className="space-y-3 p-4 rounded-lg border mb-4"
                    style={{ background: 'var(--charcoal)', borderColor: 'var(--grey-800)' }}
                  >
                    <div>
                      <label
                        className="text-xs mb-1.5 block"
                        style={{ color: 'var(--grey-400)', fontFamily: 'var(--font-display)' }}
                      >
                        {getResultFieldForType(selectedContent.content_type).label}
                      </label>
                      <input
                        type="text"
                        value={resultValue}
                        onChange={(e) => setResultValue(e.target.value)}
                        placeholder={getResultFieldForType(selectedContent.content_type).placeholder}
                        className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
                        style={{
                          background: 'var(--grey-800)',
                          borderColor: 'var(--grey-700)',
                          color: 'var(--white)'
                        }}
                      />
                    </div>
                    <div>
                      <label
                        className="text-xs mb-1.5 block"
                        style={{ color: 'var(--grey-400)', fontFamily: 'var(--font-display)' }}
                      >
                        Notes
                      </label>
                      <textarea
                        value={resultNotes}
                        onChange={(e) => setResultNotes(e.target.value)}
                        placeholder="Additional context or details..."
                        className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 min-h-[60px]"
                        style={{
                          background: 'var(--grey-800)',
                          borderColor: 'var(--grey-700)',
                          color: 'var(--white)'
                        }}
                      />
                    </div>
                    <button
                      onClick={() => onUpdateResult(selectedContent, resultValue, resultNotes)}
                      disabled={executingAction}
                      className="w-full px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                      style={{
                        background: 'var(--burnt-orange)',
                        color: 'var(--white)',
                        fontFamily: 'var(--font-display)'
                      }}
                    >
                      {executingAction ? 'Saving...' : 'Save Result'}
                    </button>
                  </div>
                )}

                {/* Feedback Section */}
                <div>
                  <label
                    className="text-xs mb-1.5 block"
                    style={{ color: 'var(--grey-400)', fontFamily: 'var(--font-display)' }}
                  >
                    Additional Feedback
                  </label>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    onBlur={() => {
                      if (feedbackText !== selectedContent.feedback) {
                        onUpdateFeedback(selectedContent, feedbackText)
                      }
                    }}
                    placeholder="Share your thoughts on this content's performance or usage..."
                    className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 min-h-[80px]"
                    style={{
                      background: 'var(--grey-800)',
                      borderColor: 'var(--grey-700)',
                      color: 'var(--white)'
                    }}
                  />
                  <p className="text-xs mt-1.5" style={{ color: 'var(--grey-500)' }}>
                    Auto-saves when you click away
                  </p>
                </div>

                {/* Current Status Display */}
                {selectedContent.result && (
                  <div
                    className="mt-4 p-4 rounded-lg border"
                    style={{ background: 'var(--burnt-orange-muted)', borderColor: 'var(--burnt-orange)' }}
                  >
                    <p
                      className="text-xs mb-1 font-medium"
                      style={{ color: 'var(--burnt-orange)', fontFamily: 'var(--font-display)' }}
                    >
                      Current Result:
                    </p>
                    <p className="text-sm" style={{ color: 'var(--white)' }}>{selectedContent.result.value}</p>
                    {selectedContent.result.notes && (
                      <p className="text-xs mt-1" style={{ color: 'var(--grey-400)' }}>{selectedContent.result.notes}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Intelligence Section */}
            {selectedContent.intelligence_status === 'complete' && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                {selectedContent.themes && selectedContent.themes.length > 0 && (
                  <div
                    className="rounded-xl border overflow-hidden"
                    style={{ background: 'var(--grey-900)', borderColor: 'var(--grey-800)' }}
                  >
                    <div
                      className="px-4 py-3 border-b flex items-center gap-2"
                      style={{ borderColor: 'var(--grey-800)' }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: 'var(--burnt-orange)' }}
                      />
                      <Brain className="w-4 h-4" style={{ color: 'var(--burnt-orange)' }} />
                      <span
                        className="text-xs font-medium uppercase tracking-wider"
                        style={{ color: 'var(--burnt-orange)', fontFamily: 'var(--font-display)' }}
                      >
                        Themes
                      </span>
                    </div>
                    <div className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {selectedContent.themes.map((theme, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-lg text-sm"
                            style={{ background: 'var(--grey-800)', color: 'var(--grey-300)' }}
                          >
                            {theme}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {selectedContent.topics && selectedContent.topics.length > 0 && (
                  <div
                    className="rounded-xl border overflow-hidden"
                    style={{ background: 'var(--grey-900)', borderColor: 'var(--grey-800)' }}
                  >
                    <div
                      className="px-4 py-3 border-b flex items-center gap-2"
                      style={{ borderColor: 'var(--grey-800)' }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: 'var(--burnt-orange)' }}
                      />
                      <Tag className="w-4 h-4" style={{ color: 'var(--burnt-orange)' }} />
                      <span
                        className="text-xs font-medium uppercase tracking-wider"
                        style={{ color: 'var(--burnt-orange)', fontFamily: 'var(--font-display)' }}
                      >
                        Topics
                      </span>
                    </div>
                    <div className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {selectedContent.topics.map((topic, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-lg text-sm"
                            style={{ background: 'var(--grey-800)', color: 'var(--grey-300)' }}
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {selectedContent.entities && Object.keys(selectedContent.entities).length > 0 && (
                  <div
                    className="col-span-2 rounded-xl border overflow-hidden"
                    style={{ background: 'var(--grey-900)', borderColor: 'var(--grey-800)' }}
                  >
                    <div
                      className="px-4 py-3 border-b flex items-center gap-2"
                      style={{ borderColor: 'var(--grey-800)' }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: 'var(--burnt-orange)' }}
                      />
                      <Sparkles className="w-4 h-4" style={{ color: 'var(--burnt-orange)' }} />
                      <span
                        className="text-xs font-medium uppercase tracking-wider"
                        style={{ color: 'var(--burnt-orange)', fontFamily: 'var(--font-display)' }}
                      >
                        Entities
                      </span>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-3 gap-4">
                        {Object.entries(selectedContent.entities).map(([key, value]) => (
                          <div key={key}>
                            <div
                              className="text-xs mb-1 capitalize"
                              style={{ color: 'var(--grey-500)', fontFamily: 'var(--font-display)' }}
                            >
                              {key}
                            </div>
                            <div className="text-sm" style={{ color: 'var(--grey-300)' }}>
                              {Array.isArray(value) ? value.join(', ') : String(value)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* File Metadata */}
            {selectedContent.file_url && selectedContent.metadata && (
              <div
                className="mb-6 rounded-xl border overflow-hidden"
                style={{ background: 'var(--grey-900)', borderColor: 'var(--grey-800)' }}
              >
                <div
                  className="px-4 py-3 border-b flex items-center gap-2"
                  style={{ borderColor: 'var(--grey-800)' }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: 'var(--burnt-orange)' }}
                  />
                  <FileText className="w-4 h-4" style={{ color: 'var(--burnt-orange)' }} />
                  <span
                    className="text-xs font-medium uppercase tracking-wider"
                    style={{ color: 'var(--burnt-orange)', fontFamily: 'var(--font-display)' }}
                  >
                    File Information
                  </span>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedContent.metadata.fileName && (
                      <div>
                        <div
                          className="text-xs mb-1"
                          style={{ color: 'var(--grey-500)', fontFamily: 'var(--font-display)' }}
                        >
                          File Name
                        </div>
                        <div style={{ color: 'var(--grey-300)' }}>{selectedContent.metadata.fileName}</div>
                      </div>
                    )}
                    {selectedContent.metadata.fileSize && (
                      <div>
                        <div
                          className="text-xs mb-1"
                          style={{ color: 'var(--grey-500)', fontFamily: 'var(--font-display)' }}
                        >
                          File Size
                        </div>
                        <div style={{ color: 'var(--grey-300)' }}>
                          {(selectedContent.metadata.fileSize / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    )}
                    {selectedContent.metadata.mimeType && (
                      <div>
                        <div
                          className="text-xs mb-1"
                          style={{ color: 'var(--grey-500)', fontFamily: 'var(--font-display)' }}
                        >
                          Type
                        </div>
                        <div style={{ color: 'var(--grey-300)' }}>{selectedContent.metadata.mimeType}</div>
                      </div>
                    )}
                    {selectedContent.metadata.uploadedAt && (
                      <div>
                        <div
                          className="text-xs mb-1"
                          style={{ color: 'var(--grey-500)', fontFamily: 'var(--font-display)' }}
                        >
                          Uploaded
                        </div>
                        <div style={{ color: 'var(--grey-300)' }}>
                          {new Date(selectedContent.metadata.uploadedAt).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Content */}
            <div
              className="rounded-xl border overflow-hidden"
              style={{ background: 'var(--grey-900)', borderColor: 'var(--grey-800)' }}
            >
              <div
                className="px-4 py-3 border-b flex items-center gap-2"
                style={{ borderColor: 'var(--grey-800)' }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: 'var(--burnt-orange)' }}
                />
                <FileText className="w-4 h-4" style={{ color: 'var(--burnt-orange)' }} />
                <span
                  className="text-xs font-medium uppercase tracking-wider"
                  style={{ color: 'var(--burnt-orange)', fontFamily: 'var(--font-display)' }}
                >
                  Content
                </span>
              </div>
              <div className="p-5">
                <div
                  className="whitespace-pre-wrap text-sm leading-relaxed"
                  style={{ color: 'var(--grey-300)' }}
                >
                  {selectedContent.content_type === 'image' && selectedContent.metadata?.imageUrl ? (
                    <div className="space-y-3">
                      <img
                        src={selectedContent.metadata.imageUrl}
                        alt={selectedContent.metadata.prompt || selectedContent.title}
                        className="max-w-full h-auto rounded-lg border"
                        style={{ borderColor: 'var(--grey-800)' }}
                      />
                      {selectedContent.metadata.prompt && (
                        <div
                          className="text-xs italic"
                          style={{ color: 'var(--grey-500)' }}
                        >
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
            </div>
          </div>
        ) : (
          // Card Grid View
          <div className="p-6">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div
                  className="text-lg font-semibold"
                  style={{ color: 'var(--white)', fontFamily: 'var(--font-display)' }}
                >
                  {selectedFolder || 'All Items'}
                </div>
                <div
                  className="px-2 py-1 rounded text-xs font-medium"
                  style={{ background: 'var(--grey-800)', color: 'var(--grey-400)' }}
                >
                  {filteredItems.length} items
                </div>
              </div>
            </div>

            {filteredItems.length > 0 ? (
              <div
                className="grid gap-4"
                style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}
              >
                {filteredItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => onSelectContent(item)}
                    onContextMenu={(e) => onContextMenu(e, item)}
                    className="text-left p-5 rounded-xl border transition-all hover:border-[var(--burnt-orange)]"
                    style={{
                      background: 'var(--grey-900)',
                      borderColor: 'var(--grey-800)'
                    }}
                  >
                    {/* Card Icon */}
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                      style={{ background: 'var(--burnt-orange-muted)' }}
                    >
                      <FileText className="w-5 h-5" style={{ color: 'var(--burnt-orange)' }} />
                    </div>

                    {/* Card Title */}
                    <div
                      className="font-medium text-sm mb-1 line-clamp-2"
                      style={{ color: 'var(--white)', fontFamily: 'var(--font-display)' }}
                    >
                      {item.title}
                    </div>

                    {/* Card Description */}
                    <div
                      className="text-xs line-clamp-2 mb-3"
                      style={{ color: 'var(--grey-500)', lineHeight: '1.4' }}
                    >
                      {typeof item.content === 'string'
                        ? item.content.slice(0, 100) + (item.content.length > 100 ? '...' : '')
                        : item.content_type}
                    </div>

                    {/* Card Meta */}
                    <div
                      className="text-xs flex items-center gap-2"
                      style={{ color: 'var(--grey-600)' }}
                    >
                      <span className="capitalize">{item.content_type.replace(/_/g, ' ')}</span>
                      <span>·</span>
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-[var(--grey-500)]">
                <div className="text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">No content found</p>
                  <p className="text-sm text-[var(--grey-600)] mt-1">
                    {searchQuery ? 'Try a different search term' : 'This folder is empty'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
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
        className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-800/50 rounded-lg transition-colors text-left ${
          selectedPath === node.path ? 'bg-[var(--burnt-orange)]/20 text-[var(--burnt-orange)]' : 'text-[var(--grey-300)]'
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
      <div className="bg-[var(--charcoal)] rounded-xl p-6 w-[480px] max-h-[600px] border border-zinc-800 flex flex-col">
        <h3 className="text-lg font-bold mb-2 text-white" style={{ fontFamily: 'var(--font-display)' }}>Move to Folder</h3>
        <p className="text-sm text-[var(--grey-400)] mb-4">Moving: {item.title}</p>

        <div className="flex-1 overflow-y-auto border border-zinc-800 rounded-lg p-2 mb-4">
          {folderTree.map(node => renderFolderOption(node, 0))}
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-[var(--grey-300)]"
          >
            Cancel
          </button>
          <button
            onClick={() => onMove(item, selectedPath)}
            disabled={!selectedPath}
            className="px-4 py-2 bg-[var(--burnt-orange)]/20 hover:bg-[var(--burnt-orange)]/30 text-[var(--burnt-orange)] rounded-lg transition-colors disabled:opacity-50 border border-[var(--burnt-orange)]/30"
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
      <div className="w-80 border-r border-zinc-800 bg-[var(--charcoal)]/30 overflow-y-auto p-4">
        {/* Folder Navigation */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-[var(--grey-400)]">Folders</h3>
            <button
              onClick={onCreateFolder}
              className="p-1 hover:bg-zinc-800 rounded text-[var(--grey-400)] hover:text-white transition-colors"
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
                  ? 'bg-[var(--burnt-orange)]/20 text-[var(--burnt-orange)]'
                  : 'text-[var(--grey-400)] hover:bg-zinc-800/50'
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
                    ? 'bg-[var(--burnt-orange)]/20 text-[var(--burnt-orange)]'
                    : 'text-[var(--grey-400)] hover:bg-zinc-800/50'
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
          <h3 className="text-sm font-semibold text-[var(--grey-400)] mb-2">
            {currentFolder || 'Root'} Assets
          </h3>
          {filteredAssets.length === 0 ? (
            <div className="text-center py-8">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-[var(--grey-600)]" />
              <p className="text-[var(--grey-500)] text-sm mb-4">
                {currentFolder ? `No assets in ${currentFolder}` : 'No assets in root'}
              </p>
              <button
                onClick={onUpload}
                disabled={uploading}
                className="px-4 py-2 bg-[var(--burnt-orange)]/20 text-[var(--burnt-orange)] rounded-lg hover:bg-[var(--burnt-orange)]/30 transition-colors text-sm disabled:opacity-50"
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
                    ? 'bg-[var(--burnt-orange)]/20 border border-[var(--burnt-orange)]/30'
                    : 'bg-zinc-800/30 hover:bg-zinc-800/50 border border-transparent'
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
                <p className="text-xs text-[var(--grey-500)]">
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
              <div className="flex items-center gap-3 text-sm text-[var(--grey-400)]">
                <span className="px-2 py-0.5 bg-zinc-800 rounded">
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
                          <div className="text-xs text-[var(--grey-500)] mb-1 capitalize">
                            {key.replace(/_/g, ' ')}
                          </div>
                          <div className="text-sm text-[var(--grey-300)]">{String(value)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedAsset.extracted_guidelines && (
                  <div className="p-4 bg-gradient-to-br from-blue-500/5 to-blue-500/10 border border-blue-500/20 rounded-lg">
                    <h3 className="font-semibold text-blue-400 mb-3">Extracted Guidelines</h3>
                    <pre className="text-sm text-[var(--grey-300)] whitespace-pre-wrap">
                      {JSON.stringify(selectedAsset.extracted_guidelines, null, 2)}
                    </pre>
                  </div>
                )}
              </>
            )}

            {selectedAsset.status === 'analyzing' && (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <Loader className="w-8 h-8 mx-auto mb-2 animate-spin text-[var(--burnt-orange)]" />
                  <p className="text-[var(--grey-400)]">Analyzing asset with Claude...</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-[var(--grey-500)]">
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
            <p className="text-sm text-[var(--grey-400)] mt-1">Track execution and results across your content</p>
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50"
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
            <span className="text-sm text-[var(--grey-400)]">
              {data.executionRate}% completion rate
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-end gap-3 mb-2">
                <span className="text-4xl font-bold text-white">{data.executedContent}</span>
                <span className="text-2xl text-[var(--grey-400)] pb-1">/ {data.totalContent}</span>
              </div>
              <p className="text-sm text-[var(--grey-400)]">pieces executed</p>
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
                  className="text-zinc-800"
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
              <span className="text-sm text-[var(--grey-400)]">
                AI-powered media tracking
              </span>
            </div>

            {data.attribution.totalCoverage === 0 ? (
              <div className="text-center py-8">
                <Target className="w-16 h-16 mx-auto mb-4 text-[var(--grey-600)] opacity-50" />
                <h3 className="text-lg font-medium text-[var(--grey-400)] mb-2">No Attributions Yet</h3>
                <p className="text-sm text-[var(--grey-500)] max-w-md mx-auto">
                  Campaign attribution tracking is ready. When you export content and media coverage is detected,
                  AI-powered attribution will appear here automatically.
                </p>
              </div>
            ) : (
              <>
            {/* Top-level metrics */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-[var(--charcoal)]/50 p-4 rounded-lg border border-zinc-800">
                <div className="text-sm text-[var(--grey-400)] mb-1">Total Coverage</div>
                <div className="text-3xl font-bold text-white">{data.attribution.totalCoverage}</div>
                <div className="text-xs text-blue-300 mt-1">
                  {data.attribution.highConfidenceMatches} high confidence
                </div>
              </div>
              <div className="bg-[var(--charcoal)]/50 p-4 rounded-lg border border-zinc-800">
                <div className="text-sm text-[var(--grey-400)] mb-1">Total Reach</div>
                <div className="text-3xl font-bold text-white">
                  {(data.attribution.totalReach / 1000000).toFixed(1)}M
                </div>
                <div className="text-xs text-purple-300 mt-1">estimated audience</div>
              </div>
              <div className="bg-[var(--charcoal)]/50 p-4 rounded-lg border border-zinc-800">
                <div className="text-sm text-[var(--grey-400)] mb-1">Avg Confidence</div>
                <div className="text-3xl font-bold text-white">
                  {(data.attribution.avgConfidence * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-emerald-300 mt-1">match accuracy</div>
              </div>
              <div className="bg-[var(--charcoal)]/50 p-4 rounded-lg border border-zinc-800">
                <div className="text-sm text-[var(--grey-400)] mb-1">Verification</div>
                <div className="text-3xl font-bold text-white">{data.attribution.verifiedCount}</div>
                <div className="text-xs text-[var(--burnt-orange)] mt-1">
                  {data.attribution.pendingVerification} pending
                </div>
              </div>
            </div>

            {/* Sentiment Breakdown */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-[var(--grey-400)] mb-3">Sentiment Analysis</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-emerald-400">Positive</span>
                    <span className="text-lg font-bold text-white">
                      {data.attribution.sentimentBreakdown.positive}
                    </span>
                  </div>
                  <div className="text-xs text-[var(--grey-500)] mt-1">
                    {((data.attribution.sentimentBreakdown.positive / data.attribution.totalCoverage) * 100).toFixed(0)}% of total
                  </div>
                </div>
                <div className="bg-zinc-500/10 border border-zinc-500/30 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--grey-400)]">Neutral</span>
                    <span className="text-lg font-bold text-white">
                      {data.attribution.sentimentBreakdown.neutral}
                    </span>
                  </div>
                  <div className="text-xs text-[var(--grey-500)] mt-1">
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
                  <div className="text-xs text-[var(--grey-500)] mt-1">
                    {((data.attribution.sentimentBreakdown.negative / data.attribution.totalCoverage) * 100).toFixed(0)}% of total
                  </div>
                </div>
              </div>
            </div>

            {/* Top Outlets */}
            {data.attribution.topOutlets.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-[var(--grey-400)] mb-3">Top Outlets</h4>
                <div className="space-y-2">
                  {data.attribution.topOutlets.slice(0, 5).map((outlet, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-[var(--charcoal)]/50 rounded-lg p-3 border border-zinc-800">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-sm font-bold">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-medium text-white">{outlet.outlet}</div>
                          <div className="text-xs text-[var(--grey-500)]">
                            {(outlet.reach / 1000).toFixed(0)}K reach
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-white">{outlet.count}</div>
                        <div className="text-xs text-[var(--grey-500)]">mentions</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Attribution Timeline */}
            {data.attribution.timeline.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-[var(--grey-400)] mb-3">Recent Attributions</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {data.attribution.timeline.slice(0, 10).map((item, idx) => (
                    <div key={idx} className="bg-[var(--charcoal)]/50 rounded-lg p-3 border border-zinc-800 hover:bg-zinc-800/50 transition-colors">
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
                                : 'bg-[var(--burnt-orange)]/20 text-[var(--burnt-orange)]'
                            }`}>
                              {item.match_type === 'exact_phrase' ? 'Exact Match' :
                               item.match_type === 'semantic' ? 'Semantic Match' : 'Contextual Match'}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              item.sentiment === 'positive'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : item.sentiment === 'negative'
                                ? 'bg-red-500/20 text-red-300'
                                : 'bg-zinc-500/20 text-[var(--grey-300)]'
                            }`}>
                              {item.sentiment}
                            </span>
                            <span className="text-xs text-[var(--grey-500)]">
                              {new Date(item.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-white">
                            {(item.confidence * 100).toFixed(0)}%
                          </div>
                          <div className="text-xs text-[var(--grey-500)]">confidence</div>
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
          <div className="p-4 bg-[var(--charcoal)]/50 border border-zinc-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <h4 className="text-sm font-medium text-[var(--grey-400)]">Last 24 Hours</h4>
            </div>
            <div className="text-3xl font-bold text-white">{data.activityToday}</div>
            <p className="text-xs text-[var(--grey-500)] mt-1">pieces executed</p>
          </div>
          <div className="p-4 bg-[var(--charcoal)]/50 border border-zinc-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <h4 className="text-sm font-medium text-[var(--grey-400)]">Last 7 Days</h4>
            </div>
            <div className="text-3xl font-bold text-white">{data.activityThisWeek}</div>
            <p className="text-xs text-[var(--grey-500)] mt-1">pieces executed</p>
          </div>
          <div className="p-4 bg-[var(--charcoal)]/50 border border-zinc-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-[var(--burnt-orange)]" />
              <h4 className="text-sm font-medium text-[var(--grey-400)]">Last 30 Days</h4>
            </div>
            <div className="text-3xl font-bold text-white">{data.activityThisMonth}</div>
            <p className="text-xs text-[var(--grey-500)] mt-1">pieces executed</p>
          </div>
        </div>

        {/* Content Performance */}
        {data.performanceByType.length > 0 && (
          <div className="p-6 bg-[var(--charcoal)]/50 border border-zinc-800 rounded-lg mb-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Content Performance
            </h3>
            <div className="space-y-4">
              {data.performanceByType.map(perf => (
                <div key={perf.type} className="border-l-2 border-purple-500/30 pl-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white capitalize">{perf.type.replace(/-/g, ' ')}</h4>
                    <span className="text-sm text-[var(--grey-400)]">{perf.executed} executed</span>
                  </div>
                  {perf.results.length > 0 ? (
                    <div className="space-y-1.5">
                      {perf.results.slice(0, 3).map((result, idx) => (
                        <div key={idx} className="text-sm bg-zinc-800/50 rounded px-3 py-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[var(--grey-300)] text-xs truncate flex-1">{result.label}</span>
                            <span className="text-purple-300 font-medium ml-2">{result.value}</span>
                          </div>
                          {result.notes && (
                            <div className="text-xs text-[var(--grey-500)] mt-1">{result.notes}</div>
                          )}
                        </div>
                      ))}
                      {perf.results.length > 3 && (
                        <div className="text-xs text-[var(--grey-500)] text-center py-1">
                          +{perf.results.length - 3} more results
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-[var(--grey-500)]">No results recorded yet</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {data.recentExecutions.length > 0 && (
          <div className="p-6 bg-[var(--charcoal)]/50 border border-zinc-800 rounded-lg">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-[var(--burnt-orange)]" />
              Recent Activity
            </h3>
            <div className="space-y-2">
              {data.recentExecutions.map(item => (
                <div key={item.id} className="p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-medium text-white text-sm">{item.title}</div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs px-2 py-0.5 bg-zinc-700 rounded text-[var(--grey-300)] capitalize">
                          {item.content_type.replace(/-/g, ' ')}
                        </span>
                        {item.folder && (
                          <span className="text-xs text-[var(--grey-500)] flex items-center gap-1">
                            <Folder className="w-3 h-3" />
                            {item.folder.split('/').pop()}
                          </span>
                        )}
                        <span className="text-xs text-[var(--grey-500)]">
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
            <TrendingUp className="w-16 h-16 mx-auto mb-4 text-[var(--grey-600)] opacity-50" />
            <h3 className="text-lg font-medium text-[var(--grey-400)] mb-2">No Content Executed Yet</h3>
            <p className="text-sm text-[var(--grey-500)]">Mark content as complete to start tracking campaign performance</p>
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
      <div className="text-xs text-[var(--grey-400)]">{title}</div>
      <div className="text-xs text-[var(--grey-500)] mt-1">Target: {target}</div>
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
