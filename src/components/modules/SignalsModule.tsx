'use client'

import { useState, useEffect } from 'react'
import {
  Activity,
  TrendingUp,
  TrendingDown,
  MessageCircle,
  Share2,
  Heart,
  RefreshCw,
  Search,
  ChevronRight,
  ExternalLink,
  Loader2,
  Twitter,
  Linkedin,
  Globe,
  Hash,
  Users,
  BarChart3,
  X
} from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface SocialSignal {
  id: string
  organization_id: string
  platform: 'twitter' | 'linkedin' | 'reddit' | 'news'
  content: string
  author: string
  author_followers?: number
  engagement: {
    likes: number
    shares: number
    comments: number
  }
  sentiment: 'positive' | 'negative' | 'neutral'
  topics: string[]
  entities: string[]
  url?: string
  published_at: string
  relevance_score: number
}

interface SignalStats {
  totalSignals: number
  positiveSignals: number
  negativeSignals: number
  topPlatform: string
  avgEngagement: number
  trendingTopics: string[]
}

export default function SignalsModule() {
  const { organization } = useAppStore()
  const [signals, setSignals] = useState<SocialSignal[]>([])
  const [stats, setStats] = useState<SignalStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSignal, setSelectedSignal] = useState<SocialSignal | null>(null)
  const [filterPlatform, setFilterPlatform] = useState<string>('all')
  const [filterSentiment, setFilterSentiment] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    if (organization?.id) {
      loadSignals()
    }
  }, [organization?.id])

  const loadSignals = async () => {
    setLoading(true)
    try {
      // Load social signals from database
      const { data: signalsData, error } = await supabase
        .from('social_signals')
        .select('*')
        .eq('organization_id', organization?.id)
        .order('published_at', { ascending: false })
        .limit(100)

      if (!error && signalsData) {
        setSignals(signalsData)

        // Calculate stats
        const platformCounts: Record<string, number> = {}
        let totalEngagement = 0
        const topicCounts: Record<string, number> = {}

        signalsData.forEach(signal => {
          platformCounts[signal.platform] = (platformCounts[signal.platform] || 0) + 1
          totalEngagement += (signal.engagement?.likes || 0) + (signal.engagement?.shares || 0) + (signal.engagement?.comments || 0)
          signal.topics?.forEach((topic: string) => {
            topicCounts[topic] = (topicCounts[topic] || 0) + 1
          })
        })

        const topPlatform = Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
        const trendingTopics = Object.entries(topicCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([topic]) => topic)

        setStats({
          totalSignals: signalsData.length,
          positiveSignals: signalsData.filter(s => s.sentiment === 'positive').length,
          negativeSignals: signalsData.filter(s => s.sentiment === 'negative').length,
          topPlatform,
          avgEngagement: Math.round(totalEngagement / (signalsData.length || 1)),
          trendingTopics
        })
      }
    } catch (error) {
      console.error('Failed to load signals:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshSignals = async () => {
    setIsRefreshing(true)
    try {
      // Call social listening function
      const { data, error } = await supabase.functions.invoke('social-listening', {
        body: {
          organization_id: organization?.id,
          organization_name: organization?.name
        }
      })

      if (!error) {
        await loadSignals()
      }
    } catch (error) {
      console.error('Signal refresh failed:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const platforms = ['all', 'twitter', 'linkedin', 'reddit', 'news']
  const sentiments = ['all', 'positive', 'neutral', 'negative']

  const filteredSignals = signals.filter(signal => {
    if (filterPlatform !== 'all' && signal.platform !== filterPlatform) return false
    if (filterSentiment !== 'all' && signal.sentiment !== filterSentiment) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesContent = signal.content.toLowerCase().includes(query)
      const matchesAuthor = signal.author.toLowerCase().includes(query)
      const matchesTopics = signal.topics?.some(t => t.toLowerCase().includes(query))
      if (!matchesContent && !matchesAuthor && !matchesTopics) return false
    }
    return true
  })

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitter': return <Twitter className="w-4 h-4" />
      case 'linkedin': return <Linkedin className="w-4 h-4" />
      case 'reddit': return <MessageCircle className="w-4 h-4" />
      default: return <Globe className="w-4 h-4" />
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'negative': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-[var(--grey-800)] text-[var(--grey-400)] border-[var(--grey-700)]'
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--charcoal)]">
        <div className="flex items-center gap-3 text-[var(--grey-400)]">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading Signals...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-[var(--charcoal)]">
      {/* Header */}
      <div className="px-8 py-6 border-b border-[var(--grey-800)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div
              className="text-[0.65rem] uppercase tracking-[0.15em] text-[var(--burnt-orange)] flex items-center gap-2 mb-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <span className="w-1.5 h-1.5 bg-[var(--burnt-orange)] rounded-full" />
              Social Intelligence
            </div>
            <h1
              className="text-[1.5rem] font-normal text-white"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Signals & Social Listening
            </h1>
            <p className="text-[var(--grey-400)] text-sm mt-1">
              Monitor mentions, sentiment, and trending conversations across platforms
            </p>
          </div>

          <button
            onClick={refreshSignals}
            disabled={isRefreshing}
            className="px-4 py-2.5 bg-[var(--burnt-orange)] text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-[var(--burnt-orange-light)] transition-colors disabled:opacity-50"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {isRefreshing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Refresh Signals
              </>
            )}
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-5 gap-4 mt-6">
            <div className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl p-4">
              <div className="text-[0.7rem] uppercase tracking-wide text-[var(--grey-500)] mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Total Signals
              </div>
              <div className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                {stats.totalSignals}
              </div>
            </div>

            <div className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl p-4">
              <div className="text-[0.7rem] uppercase tracking-wide text-[var(--grey-500)] mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Positive
              </div>
              <div className="text-2xl font-bold text-green-400" style={{ fontFamily: 'var(--font-display)' }}>
                {stats.positiveSignals}
              </div>
            </div>

            <div className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl p-4">
              <div className="text-[0.7rem] uppercase tracking-wide text-[var(--grey-500)] mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Negative
              </div>
              <div className="text-2xl font-bold text-red-400" style={{ fontFamily: 'var(--font-display)' }}>
                {stats.negativeSignals}
              </div>
            </div>

            <div className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl p-4">
              <div className="text-[0.7rem] uppercase tracking-wide text-[var(--grey-500)] mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Top Platform
              </div>
              <div className="text-2xl font-bold text-white capitalize" style={{ fontFamily: 'var(--font-display)' }}>
                {stats.topPlatform}
              </div>
            </div>

            <div className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl p-4">
              <div className="text-[0.7rem] uppercase tracking-wide text-[var(--grey-500)] mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Avg Engagement
              </div>
              <div className="text-2xl font-bold text-[var(--burnt-orange)]" style={{ fontFamily: 'var(--font-display)' }}>
                {formatNumber(stats.avgEngagement)}
              </div>
            </div>
          </div>
        )}

        {/* Trending Topics */}
        {stats?.trendingTopics && stats.trendingTopics.length > 0 && (
          <div className="mt-4">
            <div className="text-[0.7rem] uppercase tracking-wide text-[var(--grey-500)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Trending Topics
            </div>
            <div className="flex flex-wrap gap-2">
              {stats.trendingTopics.map((topic, idx) => (
                <button
                  key={idx}
                  onClick={() => setSearchQuery(topic)}
                  className="px-3 py-1.5 text-[0.75rem] bg-[var(--grey-800)] text-[var(--grey-300)] rounded-lg border border-[var(--grey-700)] hover:border-[var(--burnt-orange)] hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <Hash className="w-3 h-3" />
                  {topic}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filters & Search */}
      <div className="px-8 py-4 border-b border-[var(--grey-800)] flex items-center gap-6">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--grey-500)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search signals..."
            className="w-full pl-10 pr-4 py-2 bg-[var(--grey-800)] border border-[var(--grey-700)] rounded-lg text-white text-sm placeholder:text-[var(--grey-500)] focus:outline-none focus:border-[var(--burnt-orange)]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[0.75rem] text-[var(--grey-500)]" style={{ fontFamily: 'var(--font-display)' }}>
            Platform:
          </span>
          <div className="flex gap-1">
            {platforms.map(platform => (
              <button
                key={platform}
                onClick={() => setFilterPlatform(platform)}
                className={`px-3 py-1.5 text-[0.75rem] rounded-md transition-colors flex items-center gap-1.5 ${
                  filterPlatform === platform
                    ? 'bg-[var(--burnt-orange)] text-white'
                    : 'bg-[var(--grey-800)] text-[var(--grey-400)] hover:text-white'
                }`}
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {platform !== 'all' && getPlatformIcon(platform)}
                {platform.charAt(0).toUpperCase() + platform.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="w-px h-6 bg-[var(--grey-700)]" />

        <div className="flex items-center gap-2">
          <span className="text-[0.75rem] text-[var(--grey-500)]" style={{ fontFamily: 'var(--font-display)' }}>
            Sentiment:
          </span>
          <div className="flex gap-1">
            {sentiments.map(sentiment => (
              <button
                key={sentiment}
                onClick={() => setFilterSentiment(sentiment)}
                className={`px-3 py-1.5 text-[0.75rem] rounded-md transition-colors ${
                  filterSentiment === sentiment
                    ? 'bg-[var(--burnt-orange)] text-white'
                    : 'bg-[var(--grey-800)] text-[var(--grey-400)] hover:text-white'
                }`}
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {filteredSignals.length === 0 ? (
          <div className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl p-12 text-center">
            <Activity className="w-16 h-16 mx-auto mb-4 text-[var(--grey-600)]" />
            <h3
              className="text-lg font-medium text-white mb-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              No Signals Found
            </h3>
            <p className="text-[var(--grey-400)] text-sm mb-6 max-w-md mx-auto">
              {searchQuery
                ? 'No signals match your search criteria. Try adjusting your filters.'
                : 'Run a signal scan to discover mentions and conversations about your organization.'}
            </p>
            {!searchQuery && (
              <button
                onClick={refreshSignals}
                disabled={isRefreshing}
                className="px-5 py-2.5 bg-[var(--burnt-orange)] text-white rounded-lg text-sm font-medium inline-flex items-center gap-2 hover:bg-[var(--burnt-orange-light)] transition-colors"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <Activity className="w-4 h-4" />
                Start Signal Scan
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSignals.map((signal) => (
              <div
                key={signal.id}
                className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl p-5 hover:border-[var(--grey-700)] transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-[var(--grey-800)] flex items-center justify-center text-[var(--grey-400)]">
                        {getPlatformIcon(signal.platform)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white text-sm">{signal.author}</span>
                          {signal.author_followers && (
                            <span className="text-[0.7rem] text-[var(--grey-500)] flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {formatNumber(signal.author_followers)}
                            </span>
                          )}
                        </div>
                        <div className="text-[0.7rem] text-[var(--grey-500)]">
                          {new Date(signal.published_at).toLocaleDateString()} • {signal.platform}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 text-[0.65rem] rounded border ${getSentimentColor(signal.sentiment)}`}>
                        {signal.sentiment}
                      </span>
                    </div>

                    <p className="text-[var(--grey-300)] text-sm mb-3 line-clamp-3">
                      {signal.content}
                    </p>

                    {/* Topics */}
                    {signal.topics && signal.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {signal.topics.slice(0, 5).map((topic, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 text-[0.65rem] bg-[var(--grey-800)] text-[var(--grey-400)] rounded"
                          >
                            #{topic}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Engagement */}
                    <div className="flex items-center gap-4 text-sm text-[var(--grey-500)]">
                      <span className="flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5" />
                        {formatNumber(signal.engagement?.likes || 0)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Share2 className="w-3.5 h-3.5" />
                        {formatNumber(signal.engagement?.shares || 0)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5" />
                        {formatNumber(signal.engagement?.comments || 0)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 ml-4">
                    <div className="text-right">
                      <div className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                        {Math.round(signal.relevance_score * 100)}
                      </div>
                      <div className="text-[0.65rem] text-[var(--grey-500)]">Relevance</div>
                    </div>
                    {signal.url && (
                      <a
                        href={signal.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-[var(--grey-800)] rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 text-[var(--grey-500)]" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
