'use client'

import { useState, useEffect, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import {
  BarChart3,
  Users,
  Database,
  Activity,
  RefreshCw,
  Play,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  FileText,
  Globe,
  Loader2,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Settings,
  LogOut,
  Home,
  Newspaper,
  UserPlus,
  UserMinus,
  Eye,
  Filter,
  Zap,
  Target,
  Link2,
  Rss,
  Search,
  Layers,
  Brain,
  Sparkles
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/AuthProvider'
import { isPlatformAdmin } from '@/lib/admin/config'
import { Logo } from '@/components/ui/Logo'

type AdminView = 'overview' | 'pipeline' | 'scraping' | 'users' | 'sources' | 'intelligence' | 'learning'

// Helper to format dates in Eastern Time
const formatDateET = (dateStr: string, options?: Intl.DateTimeFormatOptions) => {
  // Supabase returns timestamps in UTC without 'Z' suffix - add it to ensure proper parsing
  const utcDateStr = dateStr.includes('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z'
  const date = new Date(utcDateStr)
  return date.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    ...options
  })
}

const formatTimeET = (dateStr: string) => {
  return formatDateET(dateStr, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

const formatDateOnlyET = (dateStr: string) => {
  return formatDateET(dateStr, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })
}

const formatFullDateET = (dateStr: string) => {
  return formatDateET(dateStr, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

interface Stats {
  totalUsers: number
  totalOrgs: number
  totalArticles: number
  processedArticles: number
  activeSources: number
  recentSignups: any[]
  recentScrapeRuns: any[]
  articlesLast24h: number
  articlesLast7d: number
  // Queue stats
  queuePending: number
  queueProcessing: number
  queueCompleted: number
  queueFailed: number
  queueMetadataOnly: number
  // Embedding stats
  articlesEmbedded: number
  articlesAwaitingEmbed: number
  targetsEmbedded: number
  totalTargets: number
  totalMatches: number
  recentEmbedJobs: any[]
}

export default function AdminDashboard() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [activeView, setActiveView] = useState<AdminView>('overview')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [triggeringScrape, setTriggeringScrape] = useState<string | null>(null)

  // Detailed view states
  const [scrapeRuns, setScrapeRuns] = useState<any[]>([])
  const [sources, setSources] = useState<any[]>([])
  const [rawArticles, setRawArticles] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [orgs, setOrgs] = useState<any[]>([])
  const [pipelineRuns, setPipelineRuns] = useState<any[]>([])
  const [intelligenceStats, setIntelligenceStats] = useState<any[]>([])
  const [learningData, setLearningData] = useState<any>(null)

  // Check admin access
  useEffect(() => {
    if (user && !isPlatformAdmin(user.email)) {
      router.push('/dashboard')
    }
  }, [user, router])

  // Load stats
  useEffect(() => {
    if (user && isPlatformAdmin(user.email)) {
      loadStats()
    }
  }, [user])

  async function loadStats() {
    setLoading(true)
    try {
      const [
        usersResult,
        orgsResult,
        rawArticlesResult,
        processedResult,
        sourcesResult,
        scrapeRunsResult,
        articles24hResult,
        articles7dResult,
        // Queue status counts
        queuePendingResult,
        queueProcessingResult,
        queueCompletedResult,
        queueFailedResult,
        queueMetadataOnlyResult,
        // Embedding stats
        articlesEmbeddedResult,
        articlesAwaitingEmbedResult,
        targetsEmbeddedResult,
        totalTargetsResult,
        totalMatchesResult,
        recentEmbedJobsResult
      ] = await Promise.all([
        supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('organizations').select('id', { count: 'exact', head: true }),
        supabase.from('raw_articles').select('id', { count: 'exact', head: true }),
        supabase.from('processed_articles').select('id', { count: 'exact', head: true }),
        supabase.from('source_registry').select('id,source_name,source_url,source_type,monitor_method,tier,reliability_score,last_successful_scrape,active').eq('active', true),
        supabase.from('batch_scrape_runs').select('id,run_type,status,started_at,completed_at,articles_discovered,articles_new,duration_seconds,error_summary').order('started_at', { ascending: false }).limit(10),
        supabase.from('raw_articles').select('id', { count: 'exact', head: true }).gte('scraped_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('raw_articles').select('id', { count: 'exact', head: true }).gte('scraped_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        // Queue status queries
        supabase.from('raw_articles').select('id', { count: 'exact', head: true }).eq('scrape_status', 'pending'),
        supabase.from('raw_articles').select('id', { count: 'exact', head: true }).eq('scrape_status', 'processing'),
        supabase.from('raw_articles').select('id', { count: 'exact', head: true }).eq('scrape_status', 'completed'),
        supabase.from('raw_articles').select('id', { count: 'exact', head: true }).eq('scrape_status', 'failed'),
        supabase.from('raw_articles').select('id', { count: 'exact', head: true }).eq('scrape_status', 'metadata_only'),
        // Embedding stats
        supabase.from('raw_articles').select('id', { count: 'exact', head: true }).not('embedded_at', 'is', null),
        supabase.from('raw_articles').select('id', { count: 'exact', head: true }).is('embedded_at', null).eq('scrape_status', 'completed'),
        supabase.from('intelligence_targets').select('id', { count: 'exact', head: true }).not('embedded_at', 'is', null),
        supabase.from('intelligence_targets').select('id', { count: 'exact', head: true }),
        supabase.from('target_article_matches').select('id', { count: 'exact', head: true }),
        supabase.from('embedding_jobs').select('id,job_type,status,items_processed,items_total,completed_at').order('completed_at', { ascending: false }).limit(5)
      ])

      // Get recent signups (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const { data: recentSignups } = await supabase
        .from('user_profiles')
        .select('*')
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: false })

      setStats({
        totalUsers: usersResult.count || 0,
        totalOrgs: orgsResult.count || 0,
        totalArticles: rawArticlesResult.count || 0,
        processedArticles: processedResult.count || 0,
        activeSources: sourcesResult.data?.length || 0,
        recentSignups: recentSignups || [],
        recentScrapeRuns: scrapeRunsResult.data || [],
        articlesLast24h: articles24hResult.count || 0,
        articlesLast7d: articles7dResult.count || 0,
        // Queue stats
        queuePending: queuePendingResult.count || 0,
        queueProcessing: queueProcessingResult.count || 0,
        queueCompleted: queueCompletedResult.count || 0,
        queueFailed: queueFailedResult.count || 0,
        queueMetadataOnly: queueMetadataOnlyResult.count || 0,
        // Embedding stats
        articlesEmbedded: articlesEmbeddedResult.count || 0,
        articlesAwaitingEmbed: articlesAwaitingEmbedResult.count || 0,
        targetsEmbedded: targetsEmbeddedResult.count || 0,
        totalTargets: totalTargetsResult.count || 0,
        totalMatches: totalMatchesResult.count || 0,
        recentEmbedJobs: recentEmbedJobsResult.data || [],
      })

      // Also load detailed data
      setScrapeRuns(scrapeRunsResult.data || [])
      setSources(sourcesResult.data || [])
      setUsers(usersResult.data || [])
      setOrgs(orgsResult.data || [])

    } catch (error) {
      console.error('Failed to load admin stats:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadRawArticles() {
    const { data } = await supabase
      .from('raw_articles')
      .select('id,title,url,source_name,scraped_at,scrape_status,processed')
      .order('scraped_at', { ascending: false })
      .limit(100)
    setRawArticles(data || [])
  }

  async function loadAllScrapeRuns() {
    const { data } = await supabase
      .from('batch_scrape_runs')
      .select('id,run_type,status,started_at,completed_at,articles_discovered,articles_new,duration_seconds,error_summary')
      .order('started_at', { ascending: false })
      .limit(50)
    setScrapeRuns(data || [])
  }

  async function loadAllSources() {
    const { data } = await supabase
      .from('source_registry')
      .select('id,source_name,source_url,source_type,monitor_method,tier,reliability_score,last_successful_scrape,active,industries')
      .order('tier', { ascending: true })
    setSources(data || [])
  }

  async function loadAllUsers() {
    const { data } = await supabase
      .from('user_profiles')
      .select('id,email,full_name,created_at')
      .order('created_at', { ascending: false })
    setUsers(data || [])
  }

  async function loadAllOrgs() {
    const { data } = await supabase
      .from('organizations')
      .select('id,name,industry,created_at')
      .order('created_at', { ascending: false })
    setOrgs(data || [])
  }

  async function loadLearningData() {
    try {
      const [
        predictionsResult,
        accuracyMetricsResult,
        amplificationResult,
        cascadePatternsResult,
        cascadeAlertsResult
      ] = await Promise.all([
        // Recent predictions from signal_outcomes
        supabase
          .from('signal_outcomes')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50),
        // Accuracy metrics per target
        supabase
          .from('signal_accuracy_metrics')
          .select('*')
          .order('total_predictions', { ascending: false })
          .limit(20),
        // Entity amplification (high scores)
        supabase
          .from('entity_signal_amplification')
          .select('*')
          .gte('amplification_score', 30)
          .order('amplification_score', { ascending: false })
          .limit(20),
        // Cascade patterns
        supabase
          .from('cascade_patterns')
          .select('*')
          .eq('is_active', true)
          .order('confidence', { ascending: false }),
        // Recent cascade alerts (signals with type cascade_alert)
        supabase
          .from('signals')
          .select('*')
          .eq('signal_type', 'cascade_alert')
          .order('created_at', { ascending: false })
          .limit(10)
      ])

      // Calculate summary stats
      const predictions = predictionsResult.data || []
      const totalPredictions = predictions.length
      const validatedPredictions = predictions.filter(p => p.was_accurate !== null)
      const accuratePredictions = predictions.filter(p => p.was_accurate === true)
      const inaccuratePredictions = predictions.filter(p => p.was_accurate === false)
      const overallAccuracy = validatedPredictions.length > 0
        ? (accuratePredictions.length / validatedPredictions.length * 100).toFixed(1)
        : null

      setLearningData({
        predictions,
        accuracyMetrics: accuracyMetricsResult.data || [],
        amplification: amplificationResult.data || [],
        cascadePatterns: cascadePatternsResult.data || [],
        cascadeAlerts: cascadeAlertsResult.data || [],
        summary: {
          totalPredictions,
          pendingValidation: predictions.filter(p => p.was_accurate === null).length,
          validated: validatedPredictions.length,
          accurate: accuratePredictions.length,
          inaccurate: inaccuratePredictions.length,
          inconclusive: 0, // Not used in current schema
          overallAccuracy
        }
      })
    } catch (error) {
      console.error('Failed to load learning data:', error)
      setLearningData({ predictions: [], accuracyMetrics: [], amplification: [], cascadePatterns: [], cascadeAlerts: [], summary: {} })
    }
  }

  async function loadPipelineRuns() {
    // Load all pipeline-related runs: discovery, worker, embedding, matching
    const [scrapeRunsResult, embeddingJobsResult, pipelineRunsResult] = await Promise.all([
      supabase
        .from('batch_scrape_runs')
        .select('id,run_type,status,started_at,completed_at,articles_discovered,articles_new,articles_processed,duration_seconds,error_summary,error_message,sources_successful,sources_failed')
        .order('started_at', { ascending: false })
        .limit(100),
      supabase
        .from('embedding_jobs')
        .select('id,job_type,status,items_processed,items_total,started_at,completed_at,error_message')
        .order('started_at', { ascending: false })
        .limit(50),
      supabase
        .from('pipeline_runs')
        .select('id,run_type,status,started_at,completed_at,duration_seconds,metadata')
        .order('started_at', { ascending: false })
        .limit(50)
    ])

    // Combine all runs into a unified timeline
    const allRuns: any[] = []

    // Add batch_scrape_runs - categorize by run_type
    for (const run of scrapeRunsResult.data || []) {
      const runType = run.run_type || 'unknown'

      // Determine the stage type based on run_type
      let type = 'discovery'
      let subtype = runType.replace('_discovery', '').replace('firecrawl_', '')

      if (runType === 'worker' || runType.includes('worker')) {
        type = 'worker'
        subtype = 'content'
      } else if (runType === 'matching' || runType.includes('match')) {
        type = 'matching'
        subtype = 'signals'
      } else if (runType.includes('discovery') || ['rss', 'sitemap', 'cse', 'firecrawl', 'fireplexity'].includes(runType)) {
        type = 'discovery'
        // Clean up subtype for discovery runs
        if (runType === 'firecrawl_discovery') subtype = 'firecrawl'
        else if (runType === 'rss_discovery') subtype = 'rss'
        else if (runType === 'sitemap_discovery') subtype = 'sitemap'
        else if (runType === 'cse_discovery') subtype = 'cse'
        else subtype = runType.replace('_discovery', '')
      }

      allRuns.push({
        id: run.id,
        type,
        subtype,
        status: run.status,
        started_at: run.started_at,
        completed_at: run.completed_at,
        duration_seconds: run.duration_seconds,
        details: {
          articles_discovered: run.articles_discovered || 0,
          articles_new: run.articles_new || 0,
          articles_processed: run.articles_processed || 0,
          sources_successful: run.sources_successful || 0,
          sources_failed: run.sources_failed || 0,
          status: run.status
        },
        error: run.error_summary ? JSON.stringify(run.error_summary).substring(0, 200) : (run.error_message || undefined)
      })
    }

    // Add embedding jobs
    for (const job of embeddingJobsResult.data || []) {
      const durationSeconds = job.started_at && job.completed_at
        ? Math.round((new Date(job.completed_at).getTime() - new Date(job.started_at).getTime()) / 1000)
        : 0
      allRuns.push({
        id: job.id,
        type: 'embedding',
        subtype: job.job_type || 'articles',
        status: job.status,
        started_at: job.started_at,
        completed_at: job.completed_at,
        duration_seconds: durationSeconds,
        details: {
          items_processed: job.items_processed || 0,
          items_total: job.items_total || 0,
          status: job.status
        },
        error: job.error_message
      })
    }

    // Add pipeline_runs (worker, matching, etc.)
    for (const run of pipelineRunsResult.data || []) {
      // Skip if it's a duplicate type we already have
      if (run.run_type === 'unified_pipeline') continue
      allRuns.push({
        id: run.id,
        type: run.run_type?.includes('worker') ? 'worker' :
              run.run_type?.includes('match') ? 'matching' :
              run.run_type?.includes('embed') ? 'embedding' : 'other',
        subtype: run.run_type,
        status: run.status,
        started_at: run.started_at,
        completed_at: run.completed_at,
        duration_seconds: run.duration_seconds,
        details: run.metadata || {},
        error: run.metadata?.error
      })
    }

    // Sort by start time descending
    allRuns.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())

    // Group runs that started within 15 minutes of each other as a "pipeline run"
    const grouped: any[] = []
    let currentGroup: any = null

    for (const run of allRuns) {
      const runTime = new Date(run.started_at).getTime()

      if (!currentGroup || runTime < currentGroup.startTime - 15 * 60 * 1000) {
        // Start a new group
        if (currentGroup) {
          grouped.push(currentGroup)
        }
        currentGroup = {
          id: run.id,
          started_at: run.started_at,
          startTime: runTime,
          status: 'completed',
          duration_seconds: 0,
          metadata: { stages: [] }
        }
      }

      // Add this run as a stage
      const stage = {
        stage: run.type,
        subtype: run.subtype,
        success: run.status === 'completed' || run.status === 'partial',
        duration_ms: (run.duration_seconds || 0) * 1000,
        details: run.details,
        error: run.error
      }

      currentGroup.metadata.stages.push(stage)
      currentGroup.duration_seconds += run.duration_seconds || 0

      if (run.status === 'failed') {
        currentGroup.status = 'partial'
      }
      if (run.status === 'running') {
        currentGroup.status = 'running'
      }
    }

    if (currentGroup) {
      grouped.push(currentGroup)
    }

    setPipelineRuns(grouped)
  }

  async function loadIntelligenceStats() {
    // Get all organizations with their intelligence stats
    const { data: organizations } = await supabase
      .from('organizations')
      .select('id, name')
      .order('name')

    if (!organizations) {
      setIntelligenceStats([])
      return
    }

    // Get stats for each organization
    const statsPromises = organizations.map(async (org) => {
      const [
        factsResult,
        factsLast7dResult,
        targetsResult,
        targetsWithContextResult,
        patternSignalsResult,
        connectionSignalsResult,
        recentFactsResult
      ] = await Promise.all([
        // Total facts
        supabase
          .from('target_intelligence_facts')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', org.id),
        // Facts in last 7 days
        supabase
          .from('target_intelligence_facts')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', org.id)
          .gte('extracted_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        // Total active targets
        supabase
          .from('intelligence_targets')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', org.id)
          .eq('is_active', true),
        // Targets with fact_count > 0
        supabase
          .from('intelligence_targets')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', org.id)
          .eq('is_active', true)
          .gt('fact_count', 0),
        // Pattern signals (signal_type = 'pattern' from analyze-target-patterns)
        supabase
          .from('signals')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', org.id)
          .eq('signal_type', 'pattern')
          .eq('status', 'active'),
        // Connection signals
        supabase
          .from('signals')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', org.id)
          .eq('signal_type', 'connection')
          .eq('status', 'active'),
        // Recent facts (last 5)
        supabase
          .from('target_intelligence_facts')
          .select('id, fact_type, fact_summary, extracted_at, article_source')
          .eq('organization_id', org.id)
          .order('extracted_at', { ascending: false })
          .limit(5)
      ])

      return {
        id: org.id,
        name: org.name,
        totalFacts: factsResult.count || 0,
        factsLast7d: factsLast7dResult.count || 0,
        totalTargets: targetsResult.count || 0,
        targetsWithFacts: targetsWithContextResult.count || 0,
        patternSignals: patternSignalsResult.count || 0,
        connectionSignals: connectionSignalsResult.count || 0,
        recentFacts: recentFactsResult.data || []
      }
    })

    const allStats = await Promise.all(statsPromises)
    // Sort by total facts descending
    allStats.sort((a, b) => b.totalFacts - a.totalFacts)
    setIntelligenceStats(allStats)
  }

  async function triggerScrape(type: string) {
    setTriggeringScrape(type)
    try {
      if (type === 'pipeline') {
        // Run all discovery functions in parallel instead of the orchestrator
        // This avoids timeout issues
        const results = await Promise.allSettled([
          supabase.functions.invoke('batch-scraper-v5-orchestrator-rss', { body: {} }),
          supabase.functions.invoke('batch-scraper-v5-orchestrator-sitemap', { body: {} }),
          supabase.functions.invoke('batch-scraper-v5-orchestrator-cse', { body: {} }),
          supabase.functions.invoke('batch-scraper-v5-orchestrator-fireplexity', { body: {} })
        ])

        const failures = results.filter(r => r.status === 'rejected')
        if (failures.length === results.length) {
          throw new Error('All discovery functions failed')
        }

        // Refresh stats after triggering
        setTimeout(loadStats, 3000)
        return
      }

      let functionName: string
      let body: any = { triggered_by: user?.email || 'admin' }

      if (type === 'worker') {
        functionName = 'batch-scraper-v5-worker'
        body = { batch_size: 50 }
      } else if (type === 'worker-drain') {
        functionName = 'parallel-scraper-launcher'
        body = { workers: 3, batch_size: 10, drain_queue: true }
      } else if (type === 'embed') {
        functionName = 'batch-embed-articles'
        body = { batch_size: 100, max_batches: 5, hours_back: 48 }
      } else if (type === 'match') {
        functionName = 'batch-match-signals'
        body = { hours_back: 48 }
      } else if (type === 'facts') {
        functionName = 'extract-target-facts'
        body = { max_matches: 100 }
      } else if (type === 'patterns') {
        functionName = 'analyze-target-patterns'
        body = { min_facts: 2, max_targets: 50 }
      } else if (type === 'connections') {
        functionName = 'detect-cross-target-connections'
        body = { min_facts: 2, max_targets: 30 }
      } else {
        functionName = `batch-scraper-v5-orchestrator-${type}`
      }

      const { data, error } = await supabase.functions.invoke(functionName, { body })

      if (error) throw error

      // Refresh stats after triggering
      setTimeout(loadStats, 2000)
    } catch (error) {
      console.error('Failed to trigger scrape:', error)
      alert(`Failed to trigger: ${error}`)
    } finally {
      setTriggeringScrape(null)
    }
  }

  // Auth guard
  if (!user || !isPlatformAdmin(user.email)) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#c75d3a] animate-spin mx-auto mb-4" />
          <p className="text-[#757575]">Checking access...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Top Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo size="sm" />
            <span className="text-[#757575]">/</span>
            <span className="text-white font-medium">Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-[#9e9e9e] hover:text-white transition-colors text-sm"
            >
              <Home className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={signOut}
              className="flex items-center gap-2 text-[#9e9e9e] hover:text-white transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="flex pt-14">
        {/* Sidebar */}
        <aside className="fixed left-0 top-14 bottom-0 w-56 bg-[#0d0d0d] border-r border-[#1a1a1a] p-4 flex flex-col">
          <nav className="space-y-1">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'pipeline', label: 'Pipeline', icon: Activity },
              { id: 'intelligence', label: 'Intelligence', icon: Target },
              { id: 'learning', label: 'Learning', icon: Brain },
              { id: 'scraping', label: 'Scraping', icon: Database },
              { id: 'users', label: 'Users & Orgs', icon: Users },
              { id: 'sources', label: 'Sources', icon: Globe },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id as AdminView)
                  if (item.id === 'pipeline') {
                    loadPipelineRuns()
                  } else if (item.id === 'intelligence') {
                    loadIntelligenceStats()
                  } else if (item.id === 'learning') {
                    loadLearningData()
                  } else if (item.id === 'scraping') {
                    loadAllScrapeRuns()
                    loadRawArticles()
                  } else if (item.id === 'users') {
                    loadAllUsers()
                    loadAllOrgs()
                  } else if (item.id === 'sources') {
                    loadAllSources()
                  }
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeView === item.id
                    ? 'bg-[#c75d3a]/10 text-[#c75d3a]'
                    : 'text-[#9e9e9e] hover:text-white hover:bg-[#1a1a1a]'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Quick Actions */}
          <div className="mt-8 pt-8 border-t border-[#1a1a1a] flex-1 overflow-y-auto pb-16">
            <div className="text-[#757575] text-xs font-semibold uppercase tracking-wider mb-3">Quick Actions</div>
            <div className="space-y-2">
              <button
                onClick={() => triggerScrape('pipeline')}
                disabled={!!triggeringScrape}
                className="w-full flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[#c75d3a] to-[#e07b5a] hover:from-[#d66c4a] hover:to-[#f08a6a] rounded-lg text-sm text-white font-medium transition-colors disabled:opacity-50"
              >
                {triggeringScrape === 'pipeline' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                Run All Discovery
              </button>
              <div className="border-t border-[#2e2e2e] my-2" />
              <button
                onClick={() => triggerScrape('rss')}
                disabled={!!triggeringScrape}
                className="w-full flex items-center gap-2 px-3 py-2 bg-[#1a1a1a] hover:bg-[#2e2e2e] rounded-lg text-sm text-[#bdbdbd] transition-colors disabled:opacity-50"
              >
                {triggeringScrape === 'rss' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Run RSS Scrape
              </button>
              <button
                onClick={() => triggerScrape('sitemap')}
                disabled={!!triggeringScrape}
                className="w-full flex items-center gap-2 px-3 py-2 bg-[#1a1a1a] hover:bg-[#2e2e2e] rounded-lg text-sm text-[#bdbdbd] transition-colors disabled:opacity-50"
              >
                {triggeringScrape === 'sitemap' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Run Sitemap Scrape
              </button>
              <button
                onClick={() => triggerScrape('fireplexity')}
                disabled={!!triggeringScrape}
                className="w-full flex items-center gap-2 px-3 py-2 bg-[#1a1a1a] hover:bg-[#2e2e2e] rounded-lg text-sm text-[#bdbdbd] transition-colors disabled:opacity-50"
              >
                {triggeringScrape === 'fireplexity' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Run Fireplexity
              </button>
              <button
                onClick={() => triggerScrape('cse')}
                disabled={!!triggeringScrape}
                className="w-full flex items-center gap-2 px-3 py-2 bg-[#1a1a1a] hover:bg-[#2e2e2e] rounded-lg text-sm text-[#bdbdbd] transition-colors disabled:opacity-50"
              >
                {triggeringScrape === 'cse' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Run CSE
              </button>
              <div className="border-t border-[#2e2e2e] my-2" />
              <button
                onClick={() => triggerScrape('worker')}
                disabled={!!triggeringScrape}
                className="w-full flex items-center gap-2 px-3 py-2 bg-[#c75d3a]/20 hover:bg-[#c75d3a]/30 rounded-lg text-sm text-[#c75d3a] transition-colors disabled:opacity-50"
              >
                {triggeringScrape === 'worker' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Activity className="w-4 h-4" />
                )}
                Process Queue
              </button>
              <button
                onClick={() => triggerScrape('worker-drain')}
                disabled={!!triggeringScrape}
                className="w-full flex items-center gap-2 px-3 py-2 bg-orange-500/20 hover:bg-orange-500/30 rounded-lg text-sm text-orange-400 transition-colors disabled:opacity-50"
              >
                {triggeringScrape === 'worker-drain' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                Parallel Drain (3x ~2min)
              </button>
              <button
                onClick={() => triggerScrape('embed')}
                disabled={!!triggeringScrape}
                className="w-full flex items-center gap-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-sm text-blue-400 transition-colors disabled:opacity-50"
              >
                {triggeringScrape === 'embed' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                Run Embeddings
              </button>
              <button
                onClick={() => triggerScrape('match')}
                disabled={!!triggeringScrape}
                className="w-full flex items-center gap-2 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-sm text-purple-400 transition-colors disabled:opacity-50"
              >
                {triggeringScrape === 'match' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Link2 className="w-4 h-4" />
                )}
                Run Matching
              </button>
            </div>
          </div>

          {/* Fixed bottom refresh button */}
          <div className="pt-4 border-t border-[#1a1a1a] bg-[#0d0d0d]">
            <button
              onClick={loadStats}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#c75d3a] hover:bg-[#e07b5a] rounded-lg text-sm text-white transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh Data
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="ml-56 flex-1 p-8">
          {activeView === 'overview' && (
            <OverviewView stats={stats} loading={loading} />
          )}
          {activeView === 'pipeline' && (
            <PipelineView
              pipelineRuns={pipelineRuns}
              onRefresh={loadPipelineRuns}
              triggerPipeline={() => triggerScrape('pipeline')}
              isTriggering={triggeringScrape === 'pipeline'}
            />
          )}
          {activeView === 'scraping' && (
            <ScrapingView
              scrapeRuns={scrapeRuns}
              rawArticles={rawArticles}
              stats={stats}
              onRefresh={() => { loadAllScrapeRuns(); loadRawArticles(); loadStats(); }}
            />
          )}
          {activeView === 'users' && (
            <UsersView users={users} orgs={orgs} onRefresh={() => { loadAllUsers(); loadAllOrgs() }} />
          )}
          {activeView === 'sources' && (
            <SourcesView sources={sources} onRefresh={loadAllSources} />
          )}
          {activeView === 'intelligence' && (
            <IntelligenceView
              stats={intelligenceStats}
              onRefresh={loadIntelligenceStats}
              onTrigger={triggerScrape}
              isTriggering={triggeringScrape}
            />
          )}
          {activeView === 'learning' && (
            <LearningView
              data={learningData}
              onRefresh={loadLearningData}
            />
          )}
        </main>
      </div>
    </div>
  )
}

// ============================================================================
// OVERVIEW VIEW
// ============================================================================
function OverviewView({ stats, loading }: { stats: Stats | null; loading: boolean }) {
  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[#c75d3a] animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl text-white font-semibold mb-2">Admin Overview</h1>
        <p className="text-[#757575]">Platform metrics and recent activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Total Users"
          value={stats.totalUsers}
          icon={Users}
          trend={stats.recentSignups.length > 0 ? `+${stats.recentSignups.length} this month` : undefined}
          trendUp={true}
        />
        <StatCard
          label="Organizations"
          value={stats.totalOrgs}
          icon={Globe}
        />
        <StatCard
          label="Total Articles"
          value={stats.totalArticles.toLocaleString()}
          icon={FileText}
          subValue={`${stats.processedArticles.toLocaleString()} processed`}
        />
        <StatCard
          label="Active Sources"
          value={stats.activeSources}
          icon={Database}
        />
      </div>

      {/* Article Activity */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#c75d3a]" />
            Article Velocity
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-3xl text-white font-bold">{stats.articlesLast24h}</div>
              <div className="text-[#757575] text-sm">Last 24 hours</div>
            </div>
            <div>
              <div className="text-3xl text-white font-bold">{stats.articlesLast7d}</div>
              <div className="text-[#757575] text-sm">Last 7 days</div>
            </div>
          </div>
        </div>

        <div className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] p-6">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#c75d3a]" />
            Recent Scrape Runs
          </h3>
          <div className="space-y-2">
            {stats.recentScrapeRuns.slice(0, 3).map((run: any) => (
              <div key={run.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {run.status === 'completed' ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : run.status === 'failed' ? (
                    <XCircle className="w-4 h-4 text-red-400" />
                  ) : (
                    <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
                  )}
                  <span className="text-[#bdbdbd]">{run.run_type}</span>
                </div>
                <span className="text-[#757575]">
                  {formatFullDateET(run.started_at)} ET
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Embedding Stats */}
      <div className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] p-6">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#c75d3a]" />
          Embedding Pipeline
        </h3>
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl text-white font-bold">{stats.articlesEmbedded.toLocaleString()}</div>
            <div className="text-[#757575] text-xs">Articles Embedded</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${stats.articlesAwaitingEmbed > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
              {stats.articlesAwaitingEmbed}
            </div>
            <div className="text-[#757575] text-xs">Awaiting Embed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl text-white font-bold">{stats.targetsEmbedded}</div>
            <div className="text-[#757575] text-xs">Targets Embedded</div>
          </div>
          <div className="text-center">
            <div className="text-2xl text-white font-bold">{stats.totalTargets}</div>
            <div className="text-[#757575] text-xs">Total Targets</div>
          </div>
          <div className="text-center">
            <div className="text-2xl text-white font-bold">{stats.totalMatches.toLocaleString()}</div>
            <div className="text-[#757575] text-xs">Total Matches</div>
          </div>
        </div>

        {/* Embedding completion bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[#757575]">Article Embedding Progress</span>
            <span className="text-[#9e9e9e]">
              {stats.totalArticles > 0
                ? Math.round((stats.articlesEmbedded / stats.totalArticles) * 100)
                : 0}%
            </span>
          </div>
          <div className="w-full h-2 bg-[#3d3d3d] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#c75d3a] rounded-full transition-all"
              style={{
                width: `${stats.totalArticles > 0 ? (stats.articlesEmbedded / stats.totalArticles) * 100 : 0}%`
              }}
            />
          </div>
        </div>

        {/* Target embedding progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[#757575]">Target Embedding Progress</span>
            <span className="text-[#9e9e9e]">
              {stats.totalTargets > 0
                ? Math.round((stats.targetsEmbedded / stats.totalTargets) * 100)
                : 0}%
            </span>
          </div>
          <div className="w-full h-2 bg-[#3d3d3d] rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{
                width: `${stats.totalTargets > 0 ? (stats.targetsEmbedded / stats.totalTargets) * 100 : 0}%`
              }}
            />
          </div>
        </div>

        {/* Recent embedding jobs */}
        {stats.recentEmbedJobs.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#2e2e2e]">
            <div className="text-[#757575] text-xs font-semibold uppercase mb-2">Recent Embedding Jobs</div>
            <div className="space-y-2">
              {stats.recentEmbedJobs.slice(0, 3).map((job: any) => (
                <div key={job.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {job.status === 'completed' ? (
                      <CheckCircle className="w-3 h-3 text-green-400" />
                    ) : (
                      <Loader2 className="w-3 h-3 text-yellow-400 animate-spin" />
                    )}
                    <span className="text-[#9e9e9e]">{job.job_type}</span>
                    <span className="text-[#757575]">
                      {job.items_processed}/{job.items_total} items
                    </span>
                  </div>
                  <span className="text-[#757575]">
                    {job.completed_at ? `${formatTimeET(job.completed_at)} ET` : 'Running...'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Signups */}
      <div className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] p-6">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-[#c75d3a]" />
          Recent Signups (Last 30 Days)
        </h3>
        {stats.recentSignups.length === 0 ? (
          <p className="text-[#757575] text-sm">No signups in the last 30 days</p>
        ) : (
          <div className="space-y-3">
            {stats.recentSignups.slice(0, 10).map((user: any) => (
              <div key={user.id} className="flex items-center justify-between py-2 border-b border-[#2e2e2e] last:border-0">
                <div>
                  <div className="text-white text-sm">{user.email}</div>
                  <div className="text-[#757575] text-xs">{user.full_name || 'No name'}</div>
                </div>
                <div className="text-[#757575] text-xs">
                  {formatFullDateET(user.created_at)} ET
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendUp,
  subValue
}: {
  label: string
  value: string | number
  icon: any
  trend?: string
  trendUp?: boolean
  subValue?: string
}) {
  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[#757575] text-sm">{label}</span>
        <Icon className="w-4 h-4 text-[#c75d3a]" />
      </div>
      <div className="text-2xl text-white font-bold">{value}</div>
      {subValue && <div className="text-[#757575] text-xs mt-1">{subValue}</div>}
      {trend && (
        <div className={`flex items-center gap-1 mt-2 text-xs ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
          {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {trend}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// PIPELINE VIEW
// ============================================================================
function PipelineView({
  pipelineRuns,
  onRefresh,
  triggerPipeline,
  isTriggering
}: {
  pipelineRuns: any[]
  onRefresh: () => void
  triggerPipeline: () => void
  isTriggering: boolean
}) {
  const [expandedRun, setExpandedRun] = useState<string | null>(null)

  const getStageIcon = (stageName: string, subtype?: string) => {
    // Check subtype first for discovery stages
    if (stageName === 'discovery') {
      switch (subtype) {
        case 'rss': return Rss
        case 'sitemap': return Layers
        case 'cse': return Search
        case 'firecrawl': return Globe
        case 'fireplexity': return Globe
        default: return Rss
      }
    }
    switch (stageName) {
      case 'worker': return Activity
      case 'metadata': return FileText
      case 'embedding': return Zap
      case 'matching': return Target
      case 'facts': return FileText
      case 'patterns': return TrendingUp
      case 'connections': return Link2
      case 'cleanup': return Filter
      default: return Layers
    }
  }

  const getStageColor = (stageName: string) => {
    switch (stageName) {
      case 'discovery': return 'text-blue-400 bg-blue-500/10'
      case 'worker': return 'text-orange-400 bg-orange-500/10'
      case 'metadata': return 'text-cyan-400 bg-cyan-500/10'
      case 'embedding': return 'text-purple-400 bg-purple-500/10'
      case 'matching': return 'text-green-400 bg-green-500/10'
      case 'facts': return 'text-yellow-400 bg-yellow-500/10'
      case 'patterns': return 'text-pink-400 bg-pink-500/10'
      case 'connections': return 'text-indigo-400 bg-indigo-500/10'
      case 'cleanup': return 'text-gray-400 bg-gray-500/10'
      default: return 'text-gray-400 bg-gray-500/10'
    }
  }

  const getStageName = (stage: string, subtype?: string) => {
    // Map stage+subtype to human-readable names
    const stageNames: Record<string, string> = {
      'discovery:rss': 'RSS Discovery',
      'discovery:sitemap': 'Sitemap Discovery',
      'discovery:cse': 'CSE Discovery',
      'discovery:firecrawl': 'Firecrawl Discovery',
      'discovery:fireplexity': 'Firecrawl Discovery',
      'worker:content': 'Content Extraction',
      'embedding:articles': 'Article Embedding',
      'embedding:targets': 'Target Embedding',
      'matching:signals': 'Signal Matching',
      'facts:extraction': 'Fact Extraction',
      'patterns:analysis': 'Pattern Analysis',
      'connections:detection': 'Connection Detection',
      'cleanup:articles': 'Article Cleanup'
    }

    const key = subtype ? `${stage}:${subtype}` : stage
    if (stageNames[key]) return stageNames[key]
    if (subtype) return subtype.charAt(0).toUpperCase() + subtype.slice(1)
    return stage.charAt(0).toUpperCase() + stage.slice(1)
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${Math.round(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-white font-semibold mb-2">Pipeline Runs</h1>
          <p className="text-[#757575]">Monitor unified pipeline execution with all stages</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#2e2e2e] rounded-lg text-sm text-[#bdbdbd] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={triggerPipeline}
            disabled={isTriggering}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#c75d3a] to-[#e07b5a] hover:from-[#d66c4a] hover:to-[#f08a6a] rounded-lg text-sm text-white font-medium transition-colors disabled:opacity-50"
          >
            {isTriggering ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Run Pipeline
          </button>
        </div>
      </div>

      {/* Pipeline Schedule Info */}
      <div className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] p-4">
        <div className="flex items-center gap-3 text-sm">
          <Clock className="w-4 h-4 text-[#c75d3a]" />
          <span className="text-[#9e9e9e]">Scheduled runs:</span>
          <span className="text-white">4x daily at 12am, 6am, 12pm, 6pm EST</span>
          <span className="text-[#757575]">(5, 11, 17, 23 UTC)</span>
        </div>
      </div>

      {/* Pipeline Runs List */}
      <div className="space-y-4">
        {pipelineRuns.length === 0 ? (
          <div className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] p-12 text-center">
            <Layers className="w-12 h-12 text-[#3d3d3d] mx-auto mb-4" />
            <p className="text-[#757575]">No pipeline runs yet</p>
            <p className="text-[#5a5a5a] text-sm mt-1">Run the pipeline manually or wait for the scheduled run</p>
          </div>
        ) : (
          pipelineRuns.map((run) => {
            const isExpanded = expandedRun === run.id
            const stages = run.metadata?.stages || []
            const successfulStages = stages.filter((s: any) => s.success).length
            const totalStages = stages.length

            return (
              <div
                key={run.id}
                className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] overflow-hidden"
              >
                {/* Run Header */}
                <button
                  onClick={() => setExpandedRun(isExpanded ? null : run.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-[#212121] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Status Icon */}
                    <div className={`p-2 rounded-lg ${
                      run.status === 'completed' ? 'bg-green-500/10' :
                      run.status === 'partial' ? 'bg-yellow-500/10' :
                      run.status === 'failed' ? 'bg-red-500/10' :
                      'bg-blue-500/10'
                    }`}>
                      {run.status === 'completed' ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : run.status === 'partial' ? (
                        <AlertTriangle className="w-5 h-5 text-yellow-400" />
                      ) : run.status === 'failed' ? (
                        <XCircle className="w-5 h-5 text-red-400" />
                      ) : (
                        <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                      )}
                    </div>

                    {/* Run Info */}
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">
                          {formatDateOnlyET(run.started_at)}
                        </span>
                        <span className="text-[#757575]">
                          {formatTimeET(run.started_at)}
                        </span>
                        <span className="text-[#5a5a5a] text-xs">ET</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          run.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                          run.status === 'partial' ? 'bg-yellow-500/10 text-yellow-400' :
                          run.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                          'bg-blue-500/10 text-blue-400'
                        }`}>
                          {run.status}
                        </span>
                        <span className="text-[#757575] text-xs">
                          {successfulStages}/{totalStages} stages
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Duration */}
                    <div className="text-right">
                      <div className="text-white font-medium">{run.duration_seconds}s</div>
                      <div className="text-[#757575] text-xs">duration</div>
                    </div>

                    {/* Expand/Collapse */}
                    <ChevronDown className={`w-5 h-5 text-[#757575] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Expanded Stage Details */}
                {isExpanded && stages.length > 0 && (
                  <div className="border-t border-[#2e2e2e] p-4 space-y-3">
                    {stages.map((stage: any, index: number) => {
                      const StageIcon = getStageIcon(stage.stage, stage.subtype)
                      const stageColor = getStageColor(stage.stage)

                      return (
                        <div
                          key={index}
                          className="flex items-start gap-4 p-3 bg-[#0d0d0d] rounded-lg"
                        >
                          {/* Stage Icon */}
                          <div className={`p-2 rounded-lg ${stageColor.split(' ')[1]}`}>
                            <StageIcon className={`w-4 h-4 ${stageColor.split(' ')[0]}`} />
                          </div>

                          {/* Stage Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">{getStageName(stage.stage, stage.subtype)}</span>
                              {stage.success ? (
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-400" />
                              )}
                              <span className="text-[#757575] text-xs">
                                {formatDuration(stage.duration_ms)}
                              </span>
                            </div>

                            {/* Stage Details */}
                            {stage.details && (
                              <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                {Object.entries(stage.details).map(([key, value]) => {
                                  // Skip nested objects and status (shown separately)
                                  if (typeof value === 'object' && value !== null) return null
                                  if (key === 'status') return null
                                  return (
                                    <div key={key} className="flex items-center gap-1">
                                      <span className="text-[#757575]">{key.replace(/_/g, ' ')}:</span>
                                      <span className="text-[#9e9e9e]">
                                        {typeof value === 'number' ? value.toLocaleString() : String(value)}
                                      </span>
                                    </div>
                                  )
                                })}
                              </div>
                            )}

                            {/* Error Message */}
                            {stage.error && (
                              <div className="mt-2 text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded truncate">
                                {stage.error}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ============================================================================
// SCRAPING VIEW
// ============================================================================
function ScrapingView({
  scrapeRuns,
  rawArticles,
  stats,
  onRefresh
}: {
  scrapeRuns: any[]
  rawArticles: any[]
  stats: Stats | null
  onRefresh: () => void
}) {
  const [activeTab, setActiveTab] = useState<'runs' | 'articles' | 'sources'>('runs')
  const [sourceStats, setSourceStats] = useState<any[]>([])
  const [loadingSourceStats, setLoadingSourceStats] = useState(false)

  // Load source stats when switching to sources tab
  async function loadSourceStats() {
    setLoadingSourceStats(true)
    try {
      // Get all articles with their source and status
      const { data } = await supabase
        .from('raw_articles')
        .select('source_name, scrape_status')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days

      if (data) {
        // Aggregate by source
        const sourceMap = new Map<string, { source: string, completed: number, failed: number, pending: number, total: number }>()

        for (const article of data) {
          const source = article.source_name || 'Unknown'

          if (!sourceMap.has(source)) {
            sourceMap.set(source, { source, completed: 0, failed: 0, pending: 0, total: 0 })
          }

          const stats = sourceMap.get(source)!
          stats.total++
          if (article.scrape_status === 'completed' || article.scrape_status === 'metadata_only') {
            stats.completed++
          } else if (article.scrape_status === 'failed') {
            stats.failed++
          } else {
            stats.pending++
          }
        }

        // Convert to array and sort by total desc
        const sourceArray = Array.from(sourceMap.values())
          .sort((a, b) => b.total - a.total)

        setSourceStats(sourceArray)
      }
    } catch (error) {
      console.error('Failed to load source stats:', error)
    } finally {
      setLoadingSourceStats(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-white font-semibold mb-2">Scraping</h1>
          <p className="text-[#757575]">Monitor scrape runs and view collected articles</p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#2e2e2e] rounded-lg text-sm text-[#bdbdbd] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Queue Summary */}
      {stats && (
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-[#757575]">Pending:</span>
            <span className={stats.queuePending > 0 ? 'text-yellow-400 font-medium' : 'text-green-400'}>{stats.queuePending}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#757575]">Completed:</span>
            <span className="text-green-400 font-medium">{stats.queueCompleted.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#757575]">Failed:</span>
            <span className="text-red-400 font-medium">{stats.queueFailed}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#2e2e2e]">
        <button
          onClick={() => setActiveTab('runs')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'runs'
              ? 'text-[#c75d3a] border-[#c75d3a]'
              : 'text-[#757575] border-transparent hover:text-white'
          }`}
        >
          Runs
        </button>
        <button
          onClick={() => setActiveTab('articles')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'articles'
              ? 'text-[#c75d3a] border-[#c75d3a]'
              : 'text-[#757575] border-transparent hover:text-white'
          }`}
        >
          Articles
        </button>
        <button
          onClick={() => { setActiveTab('sources'); if (sourceStats.length === 0) loadSourceStats(); }}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'sources'
              ? 'text-[#c75d3a] border-[#c75d3a]'
              : 'text-[#757575] border-transparent hover:text-white'
          }`}
        >
          Sources
        </button>
      </div>

      {activeTab === 'runs' && (
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2e2e2e]">
                <th className="text-left p-4 text-[#757575] text-xs font-semibold uppercase">Date</th>
                <th className="text-right p-4 text-[#757575] text-xs font-semibold uppercase">Time</th>
                <th className="text-center p-4 text-[#757575] text-xs font-semibold uppercase">Type</th>
                <th className="text-right p-4 text-[#757575] text-xs font-semibold uppercase">New</th>
                <th className="text-center p-4 text-[#757575] text-xs font-semibold uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {scrapeRuns.map(run => (
                <tr key={run.id} className="border-b border-[#2e2e2e] last:border-0 hover:bg-[#212121]">
                  <td className="p-4 text-[#9e9e9e] text-sm">
                    {formatFullDateET(run.started_at)} ET
                  </td>
                  <td className="p-4 text-right text-[#757575] text-sm">
                    {run.duration_seconds ? `${run.duration_seconds}s` : '-'}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      run.run_type === 'rss' ? 'bg-blue-500/10 text-blue-400' :
                      run.run_type === 'sitemap' ? 'bg-purple-500/10 text-purple-400' :
                      run.run_type === 'fireplexity' ? 'bg-orange-500/10 text-orange-400' :
                      run.run_type === 'cse' ? 'bg-green-500/10 text-green-400' :
                      'bg-[#3d3d3d] text-[#9e9e9e]'
                    }`}>
                      {run.run_type?.toUpperCase() || 'UNKNOWN'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <span className="text-white text-sm font-medium">{run.articles_new || 0}</span>
                  </td>
                  <td className="p-4 text-center">
                    {run.status === 'completed' ? (
                      <CheckCircle className="w-4 h-4 text-green-400 inline" />
                    ) : run.status === 'failed' ? (
                      <XCircle className="w-4 h-4 text-red-400 inline" />
                    ) : (
                      <Loader2 className="w-4 h-4 text-yellow-400 animate-spin inline" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'articles' && (
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2e2e2e]">
                <th className="text-left p-4 text-[#757575] text-xs font-semibold uppercase">Title</th>
                <th className="text-left p-4 text-[#757575] text-xs font-semibold uppercase">Source</th>
                <th className="text-left p-4 text-[#757575] text-xs font-semibold uppercase">Scraped</th>
                <th className="text-left p-4 text-[#757575] text-xs font-semibold uppercase">Processed</th>
                <th className="text-left p-4 text-[#757575] text-xs font-semibold uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rawArticles.slice(0, 50).map(article => (
                <tr key={article.id} className="border-b border-[#2e2e2e] last:border-0 hover:bg-[#212121]">
                  <td className="p-4">
                    <div className="text-white text-sm line-clamp-1 max-w-md">{article.title}</div>
                  </td>
                  <td className="p-4 text-[#9e9e9e] text-sm">{article.source_name}</td>
                  <td className="p-4 text-[#757575] text-xs">
                    {formatFullDateET(article.scraped_at)} ET
                  </td>
                  <td className="p-4">
                    {article.processed ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <Clock className="w-4 h-4 text-[#757575]" />
                    )}
                  </td>
                  <td className="p-4">
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#c75d3a] hover:text-[#e07b5a] transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'sources' && (
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] overflow-hidden">
          <div className="p-4 border-b border-[#2e2e2e] flex items-center justify-between">
            <span className="text-[#757575] text-sm">Last 7 days • {sourceStats.length} sources</span>
            <button
              onClick={loadSourceStats}
              disabled={loadingSourceStats}
              className="text-xs text-[#c75d3a] hover:text-[#e07b5a] transition-colors disabled:opacity-50"
            >
              {loadingSourceStats ? 'Loading...' : 'Refresh'}
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2e2e2e]">
                <th className="text-left p-4 text-[#757575] text-xs font-semibold uppercase">Source</th>
                <th className="text-right p-4 text-[#757575] text-xs font-semibold uppercase">Total</th>
                <th className="text-right p-4 text-[#757575] text-xs font-semibold uppercase">Completed</th>
                <th className="text-right p-4 text-[#757575] text-xs font-semibold uppercase">Failed</th>
                <th className="text-right p-4 text-[#757575] text-xs font-semibold uppercase">Pending</th>
                <th className="text-right p-4 text-[#757575] text-xs font-semibold uppercase">Success %</th>
              </tr>
            </thead>
            <tbody>
              {loadingSourceStats ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#757575]">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading source stats...
                  </td>
                </tr>
              ) : sourceStats.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#757575]">
                    No source data found
                  </td>
                </tr>
              ) : (
                sourceStats.map(source => {
                  const successRate = source.total > 0 ? Math.round((source.completed / source.total) * 100) : 0
                  return (
                    <tr key={source.source} className="border-b border-[#2e2e2e] last:border-0 hover:bg-[#212121]">
                      <td className="p-4">
                        <div className="text-white text-sm">{source.source}</div>
                      </td>
                      <td className="p-4 text-right text-[#9e9e9e] text-sm font-medium">{source.total}</td>
                      <td className="p-4 text-right text-green-400 text-sm">{source.completed}</td>
                      <td className="p-4 text-right text-red-400 text-sm">{source.failed}</td>
                      <td className="p-4 text-right text-yellow-400 text-sm">{source.pending}</td>
                      <td className="p-4 text-right">
                        <span className={`text-sm font-medium ${
                          successRate >= 80 ? 'text-green-400' :
                          successRate >= 50 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {successRate}%
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// USERS VIEW
// ============================================================================
function UsersView({
  users,
  orgs,
  onRefresh
}: {
  users: any[]
  orgs: any[]
  onRefresh: () => void
}) {
  const [activeTab, setActiveTab] = useState<'users' | 'orgs'>('users')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-white font-semibold mb-2">Users & Organizations</h1>
          <p className="text-[#757575]">Manage platform users and their organizations</p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#2e2e2e] rounded-lg text-sm text-[#bdbdbd] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#2e2e2e]">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'users'
              ? 'text-[#c75d3a] border-[#c75d3a]'
              : 'text-[#757575] border-transparent hover:text-white'
          }`}
        >
          Users ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('orgs')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'orgs'
              ? 'text-[#c75d3a] border-[#c75d3a]'
              : 'text-[#757575] border-transparent hover:text-white'
          }`}
        >
          Organizations ({orgs.length})
        </button>
      </div>

      {activeTab === 'users' ? (
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2e2e2e]">
                <th className="text-left p-4 text-[#757575] text-xs font-semibold uppercase">Email</th>
                <th className="text-left p-4 text-[#757575] text-xs font-semibold uppercase">Name</th>
                <th className="text-left p-4 text-[#757575] text-xs font-semibold uppercase">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b border-[#2e2e2e] last:border-0 hover:bg-[#212121]">
                  <td className="p-4 text-white text-sm">{user.email}</td>
                  <td className="p-4 text-[#9e9e9e] text-sm">{user.full_name || '-'}</td>
                  <td className="p-4 text-[#757575] text-sm">
                    {formatFullDateET(user.created_at)} ET
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2e2e2e]">
                <th className="text-left p-4 text-[#757575] text-xs font-semibold uppercase">Name</th>
                <th className="text-left p-4 text-[#757575] text-xs font-semibold uppercase">Industry</th>
                <th className="text-left p-4 text-[#757575] text-xs font-semibold uppercase">Created</th>
              </tr>
            </thead>
            <tbody>
              {orgs.map(org => (
                <tr key={org.id} className="border-b border-[#2e2e2e] last:border-0 hover:bg-[#212121]">
                  <td className="p-4 text-white text-sm">{org.name}</td>
                  <td className="p-4 text-[#9e9e9e] text-sm">{org.industry || '-'}</td>
                  <td className="p-4 text-[#757575] text-sm">
                    {formatFullDateET(org.created_at)} ET
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// SOURCES VIEW
// ============================================================================
function SourcesView({
  sources,
  onRefresh
}: {
  sources: any[]
  onRefresh: () => void
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-white font-semibold mb-2">Sources</h1>
          <p className="text-[#757575]">Manage news sources and monitoring configuration</p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#2e2e2e] rounded-lg text-sm text-[#bdbdbd] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2e2e2e]">
              <th className="text-left p-4 text-[#757575] text-xs font-semibold uppercase">Source</th>
              <th className="text-left p-4 text-[#757575] text-xs font-semibold uppercase">Type</th>
              <th className="text-left p-4 text-[#757575] text-xs font-semibold uppercase">Method</th>
              <th className="text-left p-4 text-[#757575] text-xs font-semibold uppercase">Tier</th>
              <th className="text-left p-4 text-[#757575] text-xs font-semibold uppercase">Reliability</th>
              <th className="text-left p-4 text-[#757575] text-xs font-semibold uppercase">Last Scrape</th>
              <th className="text-left p-4 text-[#757575] text-xs font-semibold uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {sources.map(source => (
              <tr key={source.id} className="border-b border-[#2e2e2e] last:border-0 hover:bg-[#212121]">
                <td className="p-4">
                  <div className="text-white text-sm">{source.source_name}</div>
                  <a
                    href={source.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#757575] text-xs hover:text-[#c75d3a] transition-colors"
                  >
                    {source.source_url}
                  </a>
                </td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-[#2e2e2e] rounded text-xs text-[#9e9e9e]">
                    {source.source_type}
                  </span>
                </td>
                <td className="p-4 text-[#9e9e9e] text-sm">{source.monitor_method}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    source.tier === 1 ? 'bg-[#c75d3a]/10 text-[#c75d3a]' :
                    source.tier === 2 ? 'bg-blue-500/10 text-blue-400' :
                    'bg-[#3d3d3d] text-[#9e9e9e]'
                  }`}>
                    Tier {source.tier}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-[#3d3d3d] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#c75d3a] rounded-full"
                        style={{ width: `${source.reliability_score || 50}%` }}
                      />
                    </div>
                    <span className="text-[#757575] text-xs">{source.reliability_score || 50}%</span>
                  </div>
                </td>
                <td className="p-4 text-[#757575] text-xs">
                  {source.last_successful_scrape
                    ? `${formatFullDateET(source.last_successful_scrape)} ET`
                    : 'Never'
                  }
                </td>
                <td className="p-4">
                  {source.active ? (
                    <span className="inline-flex items-center gap-1 text-green-400 text-xs">
                      <CheckCircle className="w-3 h-3" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[#757575] text-xs">
                      <XCircle className="w-3 h-3" /> Inactive
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ============================================================================
// INTELLIGENCE VIEW
// ============================================================================
function IntelligenceView({
  stats,
  onRefresh,
  onTrigger,
  isTriggering
}: {
  stats: any[]
  onRefresh: () => void
  onTrigger: (type: string) => void
  isTriggering: string | null
}) {
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null)

  // Calculate totals
  const totals = stats.reduce((acc, org) => ({
    facts: acc.facts + org.totalFacts,
    factsLast7d: acc.factsLast7d + org.factsLast7d,
    targets: acc.targets + org.totalTargets,
    targetsWithFacts: acc.targetsWithFacts + org.targetsWithFacts,
    patterns: acc.patterns + org.patternSignals,
    connections: acc.connections + org.connectionSignals
  }), { facts: 0, factsLast7d: 0, targets: 0, targetsWithFacts: 0, patterns: 0, connections: 0 })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-white font-semibold mb-2">Target Intelligence</h1>
          <p className="text-[#757575]">Fact extraction, pattern analysis, and connection detection by organization</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#2e2e2e] rounded-lg text-sm text-[#bdbdbd] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-6 gap-4">
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] p-4">
          <div className="text-[#757575] text-xs uppercase mb-1">Total Facts</div>
          <div className="text-2xl text-white font-bold">{totals.facts.toLocaleString()}</div>
          <div className="text-green-400 text-xs mt-1">+{totals.factsLast7d} last 7d</div>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] p-4">
          <div className="text-[#757575] text-xs uppercase mb-1">Active Targets</div>
          <div className="text-2xl text-white font-bold">{totals.targets}</div>
          <div className="text-[#757575] text-xs mt-1">{totals.targetsWithFacts} with facts</div>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] p-4">
          <div className="text-[#757575] text-xs uppercase mb-1">Pattern Signals</div>
          <div className="text-2xl text-pink-400 font-bold">{totals.patterns}</div>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] p-4">
          <div className="text-[#757575] text-xs uppercase mb-1">Connections</div>
          <div className="text-2xl text-indigo-400 font-bold">{totals.connections}</div>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] p-4 col-span-2">
          <div className="text-[#757575] text-xs uppercase mb-2">Trigger Functions</div>
          <div className="flex gap-2">
            <button
              onClick={() => onTrigger('facts')}
              disabled={!!isTriggering}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 rounded text-xs text-yellow-400 transition-colors disabled:opacity-50"
            >
              {isTriggering === 'facts' ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
              Extract Facts
            </button>
            <button
              onClick={() => onTrigger('patterns')}
              disabled={!!isTriggering}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-pink-500/20 hover:bg-pink-500/30 rounded text-xs text-pink-400 transition-colors disabled:opacity-50"
            >
              {isTriggering === 'patterns' ? <Loader2 className="w-3 h-3 animate-spin" /> : <TrendingUp className="w-3 h-3" />}
              Analyze Patterns
            </button>
            <button
              onClick={() => onTrigger('connections')}
              disabled={!!isTriggering}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 rounded text-xs text-indigo-400 transition-colors disabled:opacity-50"
            >
              {isTriggering === 'connections' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Link2 className="w-3 h-3" />}
              Detect Connections
            </button>
          </div>
        </div>
      </div>

      {/* Per-Organization Table */}
      <div className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2e2e2e]">
              <th className="text-left p-4 text-[#757575] text-xs font-semibold uppercase">Organization</th>
              <th className="text-right p-4 text-[#757575] text-xs font-semibold uppercase">Facts</th>
              <th className="text-right p-4 text-[#757575] text-xs font-semibold uppercase">Last 7d</th>
              <th className="text-right p-4 text-[#757575] text-xs font-semibold uppercase">Targets</th>
              <th className="text-right p-4 text-[#757575] text-xs font-semibold uppercase">With Facts</th>
              <th className="text-right p-4 text-[#757575] text-xs font-semibold uppercase">Patterns</th>
              <th className="text-right p-4 text-[#757575] text-xs font-semibold uppercase">Connections</th>
              <th className="text-center p-4 text-[#757575] text-xs font-semibold uppercase"></th>
            </tr>
          </thead>
          <tbody>
            {stats.map(org => (
              <>
                <tr
                  key={org.id}
                  className="border-b border-[#2e2e2e] hover:bg-[#212121] cursor-pointer"
                  onClick={() => setExpandedOrg(expandedOrg === org.id ? null : org.id)}
                >
                  <td className="p-4">
                    <div className="text-white font-medium">{org.name}</div>
                  </td>
                  <td className="p-4 text-right">
                    <span className="text-white font-medium">{org.totalFacts}</span>
                  </td>
                  <td className="p-4 text-right">
                    <span className={org.factsLast7d > 0 ? 'text-green-400' : 'text-[#757575]'}>
                      {org.factsLast7d > 0 ? `+${org.factsLast7d}` : '0'}
                    </span>
                  </td>
                  <td className="p-4 text-right text-[#9e9e9e]">{org.totalTargets}</td>
                  <td className="p-4 text-right">
                    <span className={org.targetsWithFacts > 0 ? 'text-blue-400' : 'text-[#757575]'}>
                      {org.targetsWithFacts}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <span className={org.patternSignals > 0 ? 'text-pink-400 font-medium' : 'text-[#757575]'}>
                      {org.patternSignals}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <span className={org.connectionSignals > 0 ? 'text-indigo-400 font-medium' : 'text-[#757575]'}>
                      {org.connectionSignals}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <ChevronDown className={`w-4 h-4 text-[#757575] transition-transform ${expandedOrg === org.id ? 'rotate-180' : ''}`} />
                  </td>
                </tr>
                {expandedOrg === org.id && org.recentFacts.length > 0 && (
                  <tr key={`${org.id}-details`}>
                    <td colSpan={8} className="p-0">
                      <div className="bg-[#0d0d0d] p-4 border-b border-[#2e2e2e]">
                        <div className="text-[#757575] text-xs uppercase mb-3">Recent Facts Extracted</div>
                        <div className="space-y-2">
                          {org.recentFacts.map((fact: any) => (
                            <div key={fact.id} className="flex items-start gap-3 text-sm">
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                fact.fact_type === 'expansion' ? 'bg-green-500/10 text-green-400' :
                                fact.fact_type === 'partnership' ? 'bg-blue-500/10 text-blue-400' :
                                fact.fact_type === 'acquisition' ? 'bg-purple-500/10 text-purple-400' :
                                fact.fact_type === 'leadership_change' ? 'bg-orange-500/10 text-orange-400' :
                                fact.fact_type === 'financial' ? 'bg-yellow-500/10 text-yellow-400' :
                                fact.fact_type === 'crisis' ? 'bg-red-500/10 text-red-400' :
                                'bg-[#3d3d3d] text-[#9e9e9e]'
                              }`}>
                                {fact.fact_type}
                              </span>
                              <span className="text-[#bdbdbd] flex-1">{fact.fact_summary}</span>
                              <span className="text-[#757575] text-xs whitespace-nowrap">
                                {formatFullDateET(fact.extracted_at)} ET
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>

        {stats.length === 0 && (
          <div className="p-12 text-center">
            <Target className="w-12 h-12 text-[#3d3d3d] mx-auto mb-4" />
            <p className="text-[#757575]">No intelligence data yet</p>
            <p className="text-[#5a5a5a] text-sm mt-1">Run the fact extraction function to populate data</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// LEARNING VIEW - Prediction tracking, accuracy, and pattern learning
// ============================================================================
function LearningView({
  data,
  onRefresh
}: {
  data: any
  onRefresh: () => void
}) {
  const [activeTab, setActiveTab] = useState<'predictions' | 'accuracy' | 'amplification' | 'cascades'>('predictions')
  const [expandedPredictions, setExpandedPredictions] = useState<Set<string>>(new Set())

  const togglePrediction = (id: string) => {
    setExpandedPredictions(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Brain className="w-12 h-12 text-[#3d3d3d] mx-auto mb-4" />
          <p className="text-[#757575]">Loading learning system data...</p>
          <button
            onClick={onRefresh}
            className="mt-4 px-4 py-2 bg-[#c75d3a] hover:bg-[#d66c4a] rounded-lg text-sm text-white transition-colors"
          >
            Load Data
          </button>
        </div>
      </div>
    )
  }

  const { predictions, accuracyMetrics, amplification, cascadePatterns, cascadeAlerts, summary } = data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-white font-semibold mb-2 flex items-center gap-3">
            Intelligence Learning System
            <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded">
              Beta
            </span>
          </h1>
          <p className="text-[#757575]">Track prediction accuracy, cross-org patterns, and cascade detection</p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#2e2e2e] rounded-lg text-sm text-[#bdbdbd] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-6 gap-4">
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] p-4">
          <div className="text-[#757575] text-xs uppercase mb-1">Total Predictions</div>
          <div className="text-2xl text-white font-bold">{summary.totalPredictions || 0}</div>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] p-4">
          <div className="text-[#757575] text-xs uppercase mb-1">Pending Validation</div>
          <div className="text-2xl text-yellow-400 font-bold">{summary.pendingValidation || 0}</div>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] p-4">
          <div className="text-[#757575] text-xs uppercase mb-1">Validated</div>
          <div className="text-2xl text-blue-400 font-bold">{summary.validated || 0}</div>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] p-4">
          <div className="text-[#757575] text-xs uppercase mb-1">Accurate</div>
          <div className="text-2xl text-green-400 font-bold">{summary.accurate || 0}</div>
        </div>
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] p-4">
          <div className="text-[#757575] text-xs uppercase mb-1">Inaccurate</div>
          <div className="text-2xl text-red-400 font-bold">{summary.inaccurate || 0}</div>
        </div>
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#2e2e2e] rounded-xl border border-[#3d3d3d] p-4">
          <div className="text-[#757575] text-xs uppercase mb-1">Overall Accuracy</div>
          <div className="text-2xl font-bold">
            {summary.overallAccuracy ? (
              <span className={parseFloat(summary.overallAccuracy) >= 60 ? 'text-green-400' : parseFloat(summary.overallAccuracy) >= 40 ? 'text-yellow-400' : 'text-red-400'}>
                {summary.overallAccuracy}%
              </span>
            ) : (
              <span className="text-[#5a5a5a]">--</span>
            )}
          </div>
          <div className="text-[#5a5a5a] text-xs mt-1">Target: &gt;60%</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#2e2e2e] pb-2">
        {[
          { id: 'predictions', label: 'Predictions', count: predictions.length },
          { id: 'accuracy', label: 'Accuracy by Target', count: accuracyMetrics.length },
          { id: 'amplification', label: 'Cross-Org Amplification', count: amplification.length },
          { id: 'cascades', label: 'Cascade Patterns', count: cascadePatterns.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-[#c75d3a] text-white'
                : 'bg-[#1a1a1a] text-[#9e9e9e] hover:text-white hover:bg-[#2e2e2e]'
            }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded ${activeTab === tab.id ? 'bg-white/20' : 'bg-[#3d3d3d]'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'predictions' && (
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2e2e2e]">
                <th className="text-left p-4 text-[#757575] text-xs font-semibold uppercase">Prediction</th>
                <th className="text-center p-4 text-[#757575] text-xs font-semibold uppercase">Confidence</th>
                <th className="text-center p-4 text-[#757575] text-xs font-semibold uppercase">Timeframe</th>
                <th className="text-center p-4 text-[#757575] text-xs font-semibold uppercase">Status</th>
                <th className="text-left p-4 text-[#757575] text-xs font-semibold uppercase">Created</th>
              </tr>
            </thead>
            <tbody>
              {predictions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <Sparkles className="w-12 h-12 text-[#3d3d3d] mx-auto mb-4" />
                    <p className="text-[#757575]">No predictions generated yet</p>
                    <p className="text-[#5a5a5a] text-sm mt-1">Predictions are created from signals automatically</p>
                  </td>
                </tr>
              ) : predictions.map((p: any) => {
                const isExpanded = expandedPredictions.has(p.id)
                return (
                  <Fragment key={p.id}>
                    <tr
                      className="border-b border-[#2e2e2e] hover:bg-[#212121] cursor-pointer"
                      onClick={() => togglePrediction(p.id)}
                    >
                      <td className="p-4">
                        <div className="flex items-start gap-2">
                          <ChevronRight className={`w-4 h-4 text-[#757575] mt-0.5 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          <div>
                            <div className={`text-white text-sm font-medium mb-1 ${isExpanded ? '' : 'line-clamp-1'}`}>{p.predicted_outcome}</div>
                            {!isExpanded && (
                              <div className="text-[#757575] text-xs line-clamp-1">
                                {p.prediction_reasoning?.slice(0, 100) || 'N/A'}...
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`font-medium ${
                          p.predicted_confidence >= 0.7 ? 'text-green-400' :
                          p.predicted_confidence >= 0.5 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {Math.round((p.predicted_confidence || 0) * 100)}%
                        </span>
                      </td>
                      <td className="p-4 text-center text-[#9e9e9e] text-sm">
                        {p.predicted_timeframe_days || '?'} days
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          p.was_accurate === true ? 'bg-green-500/20 text-green-400' :
                          p.was_accurate === false ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {p.was_accurate === true ? 'accurate' : p.was_accurate === false ? 'inaccurate' : 'pending'}
                        </span>
                      </td>
                      <td className="p-4 text-[#757575] text-sm whitespace-nowrap">
                        {formatFullDateET(p.predicted_at || p.created_at)} ET
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-[#141414]">
                        <td colSpan={5} className="p-4 border-b border-[#2e2e2e]">
                          <div className="pl-6 space-y-3">
                            <div>
                              <div className="text-[#757575] text-xs uppercase tracking-wider mb-1">Reasoning</div>
                              <div className="text-[#bdbdbd] text-sm">{p.prediction_reasoning || 'N/A'}</div>
                            </div>
                            {p.prediction_evidence && (
                              <div>
                                <div className="text-[#757575] text-xs uppercase tracking-wider mb-1">Evidence</div>
                                <div className="text-[#9e9e9e] text-xs font-mono bg-[#1a1a1a] p-2 rounded max-h-32 overflow-y-auto">
                                  {typeof p.prediction_evidence === 'string'
                                    ? p.prediction_evidence
                                    : JSON.stringify(p.prediction_evidence, null, 2)}
                                </div>
                              </div>
                            )}
                            <div className="flex gap-6 text-xs">
                              <div>
                                <span className="text-[#757575]">Target: </span>
                                <span className="text-[#bdbdbd]">{p.target_id ? 'Linked' : 'None'}</span>
                              </div>
                              <div>
                                <span className="text-[#757575]">Expires: </span>
                                <span className="text-[#bdbdbd]">{p.prediction_expires_at ? formatFullDateET(p.prediction_expires_at) : 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'accuracy' && (
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2e2e2e]">
                <th className="text-left p-4 text-[#757575] text-xs font-semibold uppercase">Target</th>
                <th className="text-center p-4 text-[#757575] text-xs font-semibold uppercase">Total</th>
                <th className="text-center p-4 text-[#757575] text-xs font-semibold uppercase">Accurate</th>
                <th className="text-center p-4 text-[#757575] text-xs font-semibold uppercase">Accuracy Rate</th>
                <th className="text-center p-4 text-[#757575] text-xs font-semibold uppercase">Avg Confidence</th>
                <th className="text-center p-4 text-[#757575] text-xs font-semibold uppercase">Calibration</th>
              </tr>
            </thead>
            <tbody>
              {accuracyMetrics.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <Target className="w-12 h-12 text-[#3d3d3d] mx-auto mb-4" />
                    <p className="text-[#757575]">No accuracy metrics yet</p>
                    <p className="text-[#5a5a5a] text-sm mt-1">Metrics populate as predictions are validated</p>
                  </td>
                </tr>
              ) : accuracyMetrics.map((m: any) => {
                const calibrationError = m.avg_confidence && m.accuracy_rate
                  ? Math.abs(m.avg_confidence - m.accuracy_rate)
                  : null
                return (
                  <tr key={m.id} className="border-b border-[#2e2e2e] hover:bg-[#212121]">
                    <td className="p-4">
                      <div className="text-white text-sm font-medium">{m.target_name || 'Unknown'}</div>
                      <div className="text-[#757575] text-xs">{m.target_type || ''}</div>
                    </td>
                    <td className="p-4 text-center text-white font-medium">{m.total_predictions || 0}</td>
                    <td className="p-4 text-center text-green-400">{m.accurate_predictions || 0}</td>
                    <td className="p-4 text-center">
                      <span className={`font-bold ${
                        (m.accuracy_rate || 0) >= 0.6 ? 'text-green-400' :
                        (m.accuracy_rate || 0) >= 0.4 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {Math.round((m.accuracy_rate || 0) * 100)}%
                      </span>
                    </td>
                    <td className="p-4 text-center text-[#9e9e9e]">
                      {Math.round((m.avg_confidence || 0) * 100)}%
                    </td>
                    <td className="p-4 text-center">
                      {calibrationError !== null ? (
                        <span className={`${calibrationError <= 0.1 ? 'text-green-400' : calibrationError <= 0.2 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {calibrationError <= 0.1 ? 'Good' : calibrationError <= 0.2 ? 'Fair' : 'Poor'}
                        </span>
                      ) : (
                        <span className="text-[#5a5a5a]">--</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'amplification' && (
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] overflow-hidden">
          <div className="p-4 border-b border-[#2e2e2e]">
            <p className="text-[#9e9e9e] text-sm">
              Entities appearing in signals across multiple organizations. High amplification = significant market-wide trend.
            </p>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2e2e2e]">
                <th className="text-left p-4 text-[#757575] text-xs font-semibold uppercase">Entity</th>
                <th className="text-center p-4 text-[#757575] text-xs font-semibold uppercase">Signal Count</th>
                <th className="text-center p-4 text-[#757575] text-xs font-semibold uppercase">Orgs</th>
                <th className="text-center p-4 text-[#757575] text-xs font-semibold uppercase">Industries</th>
                <th className="text-center p-4 text-[#757575] text-xs font-semibold uppercase">Velocity</th>
                <th className="text-center p-4 text-[#757575] text-xs font-semibold uppercase">Amplification</th>
              </tr>
            </thead>
            <tbody>
              {amplification.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <Globe className="w-12 h-12 text-[#3d3d3d] mx-auto mb-4" />
                    <p className="text-[#757575]">No cross-org amplification detected</p>
                    <p className="text-[#5a5a5a] text-sm mt-1">This tracks entities appearing across multiple organizations</p>
                  </td>
                </tr>
              ) : amplification.map((a: any) => (
                <tr key={a.id} className="border-b border-[#2e2e2e] hover:bg-[#212121]">
                  <td className="p-4">
                    <div className="text-white text-sm font-medium">{a.entity_name}</div>
                    <div className="text-[#757575] text-xs">{a.entity_type || 'entity'}</div>
                  </td>
                  <td className="p-4 text-center text-white">{a.signal_count || 0}</td>
                  <td className="p-4 text-center text-blue-400 font-medium">{a.organization_count || 0}</td>
                  <td className="p-4 text-center text-[#9e9e9e]">{a.industry_count || 0}</td>
                  <td className="p-4 text-center text-[#9e9e9e]">
                    {(a.velocity || 0).toFixed(1)}/day
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 h-2 bg-[#2e2e2e] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            a.amplification_score >= 70 ? 'bg-red-500' :
                            a.amplification_score >= 50 ? 'bg-orange-500' :
                            'bg-yellow-500'
                          }`}
                          style={{ width: `${Math.min(a.amplification_score, 100)}%` }}
                        />
                      </div>
                      <span className={`font-bold text-sm ${
                        a.amplification_score >= 70 ? 'text-red-400' :
                        a.amplification_score >= 50 ? 'text-orange-400' :
                        'text-yellow-400'
                      }`}>
                        {Math.round(a.amplification_score)}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'cascades' && (
        <div className="space-y-6">
          {/* Cascade Patterns */}
          <div className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] overflow-hidden">
            <div className="p-4 border-b border-[#2e2e2e]">
              <h3 className="text-white font-medium">Active Cascade Patterns</h3>
              <p className="text-[#757575] text-sm mt-1">Learned temporal sequences that predict follow-on events</p>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2e2e2e]">
                  <th className="text-left p-4 text-[#757575] text-xs font-semibold uppercase">Pattern</th>
                  <th className="text-center p-4 text-[#757575] text-xs font-semibold uppercase">Times Observed</th>
                  <th className="text-center p-4 text-[#757575] text-xs font-semibold uppercase">Accuracy</th>
                  <th className="text-center p-4 text-[#757575] text-xs font-semibold uppercase">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {cascadePatterns.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center">
                      <p className="text-[#757575]">No cascade patterns active</p>
                    </td>
                  </tr>
                ) : cascadePatterns.map((p: any) => (
                  <tr key={p.id} className="border-b border-[#2e2e2e] hover:bg-[#212121]">
                    <td className="p-4">
                      <div className="text-white text-sm font-medium">{p.pattern_name}</div>
                      <div className="text-[#757575] text-xs line-clamp-1">{p.pattern_description}</div>
                    </td>
                    <td className="p-4 text-center text-white">{p.times_observed || 0}</td>
                    <td className="p-4 text-center">
                      <span className={`font-medium ${
                        (p.accuracy_rate || 0) >= 0.6 ? 'text-green-400' :
                        (p.accuracy_rate || 0) >= 0.4 ? 'text-yellow-400' :
                        'text-[#757575]'
                      }`}>
                        {Math.round((p.accuracy_rate || 0) * 100)}%
                      </span>
                    </td>
                    <td className="p-4 text-center text-[#9e9e9e]">
                      {Math.round((p.confidence || 0) * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Recent Cascade Alerts */}
          <div className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] overflow-hidden">
            <div className="p-4 border-b border-[#2e2e2e]">
              <h3 className="text-white font-medium">Recent Cascade Alerts</h3>
              <p className="text-[#757575] text-sm mt-1">Signals triggered by cascade pattern matching</p>
            </div>
            {cascadeAlerts.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-[#757575]">No cascade alerts generated yet</p>
              </div>
            ) : (
              <div className="divide-y divide-[#2e2e2e]">
                {cascadeAlerts.map((alert: any) => (
                  <div key={alert.id} className="p-4 hover:bg-[#212121]">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-white font-medium text-sm">{alert.title}</div>
                        <div className="text-[#757575] text-sm mt-1 line-clamp-2">{alert.description}</div>
                      </div>
                      <span className="text-[#757575] text-xs whitespace-nowrap ml-4">
                        {formatFullDateET(alert.created_at)} ET
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
