'use client'

import { useState, useEffect } from 'react'
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
  ExternalLink,
  Settings,
  LogOut,
  Home,
  Newspaper,
  UserPlus,
  UserMinus,
  Eye,
  Filter
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/AuthProvider'
import { isPlatformAdmin } from '@/lib/admin/config'
import { Logo } from '@/components/ui/Logo'

type AdminView = 'overview' | 'scraping' | 'users' | 'sources'

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
        articles7dResult
      ] = await Promise.all([
        supabase.from('user_profiles').select('*', { count: 'exact' }),
        supabase.from('organizations').select('*', { count: 'exact' }),
        supabase.from('raw_articles').select('*', { count: 'exact' }),
        supabase.from('processed_articles').select('*', { count: 'exact' }),
        supabase.from('source_registry').select('*').eq('active', true),
        supabase.from('batch_scrape_runs').select('*').order('started_at', { ascending: false }).limit(10),
        supabase.from('raw_articles').select('*', { count: 'exact' }).gte('scraped_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('raw_articles').select('*', { count: 'exact' }).gte('scraped_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
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
      .select('*')
      .order('scraped_at', { ascending: false })
      .limit(100)
    setRawArticles(data || [])
  }

  async function loadAllScrapeRuns() {
    const { data } = await supabase
      .from('batch_scrape_runs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(50)
    setScrapeRuns(data || [])
  }

  async function loadAllSources() {
    const { data } = await supabase
      .from('source_registry')
      .select('*')
      .order('tier', { ascending: true })
    setSources(data || [])
  }

  async function loadAllUsers() {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })
    setUsers(data || [])
  }

  async function triggerScrape(type: string) {
    setTriggeringScrape(type)
    try {
      const functionName = type === 'all'
        ? 'batch-scraper-v5-orchestrator'
        : `batch-scraper-v5-orchestrator-${type}`

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { triggered_by: user?.email || 'admin' }
      })

      if (error) throw error

      // Refresh stats after triggering
      setTimeout(loadStats, 2000)
    } catch (error) {
      console.error('Failed to trigger scrape:', error)
      alert(`Failed to trigger scrape: ${error}`)
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
        <aside className="fixed left-0 top-14 bottom-0 w-56 bg-[#0d0d0d] border-r border-[#1a1a1a] p-4">
          <nav className="space-y-1">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'scraping', label: 'Scraping', icon: Database },
              { id: 'users', label: 'Users & Orgs', icon: Users },
              { id: 'sources', label: 'Sources', icon: Globe },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id as AdminView)
                  if (item.id === 'scraping') {
                    loadAllScrapeRuns()
                    loadRawArticles()
                  } else if (item.id === 'users') {
                    loadAllUsers()
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
          <div className="mt-8 pt-8 border-t border-[#1a1a1a]">
            <div className="text-[#757575] text-xs font-semibold uppercase tracking-wider mb-3">Quick Actions</div>
            <div className="space-y-2">
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
            </div>
          </div>

          <div className="absolute bottom-4 left-4 right-4">
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
          {activeView === 'scraping' && (
            <ScrapingView
              scrapeRuns={scrapeRuns}
              rawArticles={rawArticles}
              onRefresh={() => { loadAllScrapeRuns(); loadRawArticles(); }}
            />
          )}
          {activeView === 'users' && (
            <UsersView users={users} orgs={orgs} onRefresh={loadAllUsers} />
          )}
          {activeView === 'sources' && (
            <SourcesView sources={sources} onRefresh={loadAllSources} />
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
                  {new Date(run.started_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
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
                  {new Date(user.created_at).toLocaleDateString()} at{' '}
                  {new Date(user.created_at).toLocaleTimeString()}
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
// SCRAPING VIEW
// ============================================================================
function ScrapingView({
  scrapeRuns,
  rawArticles,
  onRefresh
}: {
  scrapeRuns: any[]
  rawArticles: any[]
  onRefresh: () => void
}) {
  const [activeTab, setActiveTab] = useState<'runs' | 'articles'>('runs')

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
          Scrape Runs
        </button>
        <button
          onClick={() => setActiveTab('articles')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'articles'
              ? 'text-[#c75d3a] border-[#c75d3a]'
              : 'text-[#757575] border-transparent hover:text-white'
          }`}
        >
          Raw Articles
        </button>
      </div>

      {activeTab === 'runs' ? (
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2e2e2e] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2e2e2e]">
                <th className="text-left p-4 text-[#757575] text-xs font-semibold uppercase">Status</th>
                <th className="text-left p-4 text-[#757575] text-xs font-semibold uppercase">Type</th>
                <th className="text-left p-4 text-[#757575] text-xs font-semibold uppercase">Started</th>
                <th className="text-left p-4 text-[#757575] text-xs font-semibold uppercase">Articles</th>
                <th className="text-left p-4 text-[#757575] text-xs font-semibold uppercase">Sources</th>
                <th className="text-left p-4 text-[#757575] text-xs font-semibold uppercase">Duration</th>
              </tr>
            </thead>
            <tbody>
              {scrapeRuns.map(run => (
                <tr key={run.id} className="border-b border-[#2e2e2e] last:border-0 hover:bg-[#212121]">
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${
                      run.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                      run.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                      run.status === 'running' ? 'bg-yellow-500/10 text-yellow-400' :
                      'bg-[#3d3d3d] text-[#9e9e9e]'
                    }`}>
                      {run.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                      {run.status === 'failed' && <XCircle className="w-3 h-3" />}
                      {run.status === 'running' && <Loader2 className="w-3 h-3 animate-spin" />}
                      {run.status}
                    </span>
                  </td>
                  <td className="p-4 text-[#bdbdbd] text-sm">{run.run_type}</td>
                  <td className="p-4 text-[#9e9e9e] text-sm">
                    {new Date(run.started_at).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span className="text-white text-sm">{run.articles_new || 0}</span>
                    <span className="text-[#757575] text-xs ml-1">new</span>
                    {run.articles_discovered > 0 && (
                      <span className="text-[#757575] text-xs ml-2">/ {run.articles_discovered} found</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="text-green-400 text-sm">{run.sources_successful || 0}</span>
                    <span className="text-[#757575] text-xs"> / </span>
                    <span className="text-red-400 text-sm">{run.sources_failed || 0}</span>
                  </td>
                  <td className="p-4 text-[#757575] text-sm">
                    {run.duration_seconds ? `${run.duration_seconds}s` : '-'}
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
                    {new Date(article.scraped_at).toLocaleDateString()}
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
                    {new Date(user.created_at).toLocaleDateString()}
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
                    {new Date(org.created_at).toLocaleDateString()}
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
                    ? new Date(source.last_successful_scrape).toLocaleDateString()
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
