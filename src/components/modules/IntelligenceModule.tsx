'use client'

import React, { useState, useEffect } from 'react'
import {
  Brain,
  Sparkles,
  BookOpen,
  Zap,
  Target,
  Shield,
  Rocket,
  Copy,
  Check,
  Info,
  ChevronRight,
  Search,
  TrendingUp,
  Users,
  FileText,
  AlertTriangle,
  Lightbulb,
  Activity,
  AlertCircle,
  Loader2,
  Share2,
  Twitter,
  MessageCircle,
  Linkedin,
  Instagram,
  Hash,
  ExternalLink,
  RefreshCw,
  Globe,
  Settings
} from 'lucide-react'
import { IntelligenceService } from '@/lib/services/intelligenceService'
import { supabase } from '@/lib/supabase/client'
import { useAppStore } from '@/stores/useAppStore'
import IntelligenceSynthesisDisplay from '@/components/IntelligenceSynthesisDisplay'
import StakeholderPredictionDashboard from '@/components/predictions/StakeholderPredictionDashboard'
import SchemaViewer from '@/components/schema/SchemaViewer'

// Import the executive report component if it exists
// import ExecutiveSynthesisDisplay from '../intelligence/ExecutiveSynthesisDisplay'

interface PromptTemplate {
  id: string
  title: string
  prompt: string
  description?: string
  category: string
  icon?: React.ReactNode
  tags?: string[]
}

interface PipelineStage {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  duration?: string
  startTime?: number
  icon: React.ComponentType<any>
}

export default function IntelligenceModule() {
  const { organization } = useAppStore()
  const [activeTab, setActiveTab] = useState<'synthesis' | 'social' | 'realtime' | 'predictions' | 'geo'>('synthesis')
  const [activePromptCategory, setActivePromptCategory] = useState('quick-wins')
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [currentStage, setCurrentStage] = useState(0)
  const [executiveSynthesis, setExecutiveSynthesis] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [useRealPipeline] = useState(true) // Always use real pipeline

  // Social Intelligence state
  const [socialSignals, setSocialSignals] = useState<any[]>([])
  const [socialLoading, setSocialLoading] = useState(false)
  const [socialTimeRange, setSocialTimeRange] = useState<'1h' | '24h' | '7d'>('24h')
  const [socialPlatforms, setSocialPlatforms] = useState<string[]>(['twitter', 'reddit']) // Start with direct APIs only
  const [socialSentiment, setSocialSentiment] = useState<any>(null)

  // Real-Time Monitor state
  const [realtimeLoading, setRealtimeLoading] = useState(false)
  const [realtimeResults, setRealtimeResults] = useState<any>(null)
  const [realtimeAlerts, setRealtimeAlerts] = useState<any[]>([])
  const [routeToOpportunities, setRouteToOpportunities] = useState(true)
  const [routeToCrisis, setRouteToCrisis] = useState(true)

  // GEO Monitor state
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoResults, setGeoResults] = useState<any>(null)
  const [geoSignals, setGeoSignals] = useState<any[]>([])
  const [geoError, setGeoError] = useState<string | null>(null)
  const [schemaData, setSchemaData] = useState<any>(null)
  const [schemaLoading, setSchemaLoading] = useState(false)
  const [schemaExtracting, setSchemaExtracting] = useState(false)
  const [showSchemaViewer, setShowSchemaViewer] = useState(false)

  // Prompt categories with icons
  const promptCategories = [
    { id: 'quick-wins', label: 'Quick Wins', icon: <Zap className="w-4 h-4" />, color: 'text-yellow-400' },
    { id: 'research', label: 'Research & Discovery', icon: <Search className="w-4 h-4" />, color: 'text-blue-400' },
    { id: 'strategy', label: 'Strategic Planning', icon: <Target className="w-4 h-4" />, color: 'text-purple-400' },
    { id: 'campaign', label: 'Campaign Development', icon: <Rocket className="w-4 h-4" />, color: 'text-green-400' },
    { id: 'competitive', label: 'Competitive Intelligence', icon: <TrendingUp className="w-4 h-4" />, color: 'text-orange-400' },
    { id: 'crisis', label: 'Crisis Management', icon: <Shield className="w-4 h-4" />, color: 'text-red-400' },
    { id: 'content', label: 'Content & Media', icon: <FileText className="w-4 h-4" />, color: 'text-indigo-400' },
    { id: 'stakeholder', label: 'Stakeholder Analysis', icon: <Users className="w-4 h-4" />, color: 'text-pink-400' },
  ]

  // Expanded prompt library with NIV-specific prompts
  const prompts: PromptTemplate[] = [
    // Quick Wins
    {
      id: 'current-events',
      title: "What's Happening Right Now?",
      prompt: "Show me all significant developments with [COMPETITOR NAME] in the last 48 hours. Include executive moves, product announcements, media coverage, and social signals. Rank by potential impact on our business.",
      category: 'quick-wins',
      description: 'Get immediate intelligence on competitor activities'
    },
    {
      id: 'pr-opportunities',
      title: 'Find PR Opportunities Today',
      prompt: "Discover 5 PR opportunities I can act on this week for [INDUSTRY]. Focus on trending topics, news hooks, and speaking opportunities. Include suggested angles and relevant journalists for each.",
      category: 'quick-wins',
      description: 'Identify actionable PR opportunities'
    },
    {
      id: 'narrative-vacuum',
      title: 'Narrative Vacuum Finder',
      prompt: "What conversations in [INDUSTRY] have no clear leader? Show me topics with high interest but low authority presence where we could establish thought leadership within 2 weeks.",
      category: 'quick-wins',
      description: 'Find unclaimed thought leadership territories'
    },

    // Research & Discovery
    {
      id: 'market-research',
      title: 'Deep Market Research',
      prompt: "Conduct comprehensive research on [TOPIC/MARKET]. Include: 1) Current market dynamics and size, 2) Key players and their positions, 3) Emerging trends and technologies, 4) Regulatory landscape, 5) Customer sentiment and needs, 6) Opportunities and threats. Provide data sources and confidence levels.",
      category: 'research',
      description: 'Comprehensive market intelligence gathering'
    },
    {
      id: 'stakeholder-mapping',
      title: 'Stakeholder Ecosystem Mapping',
      prompt: "Map the complete stakeholder ecosystem around [TOPIC/COMPANY]. Identify: 1) Direct stakeholders and their interests, 2) Indirect influencers, 3) Power dynamics and alliances, 4) Communication channels they use, 5) Key concerns and priorities. Create an influence/interest matrix.",
      category: 'research',
      description: 'Understand your stakeholder landscape'
    },
    {
      id: 'trend-analysis',
      title: 'Emerging Trend Analysis',
      prompt: "Analyze emerging trends in [INDUSTRY] that will matter in 6-12 months. Look for: 1) Weak signals in academic research, 2) Patent filings and R&D investments, 3) Regulatory proposals, 4) Social sentiment shifts, 5) Technology convergence points. Rate each by likelihood and potential impact.",
      category: 'research',
      description: 'Identify future opportunities and threats'
    },

    // Strategic Planning
    {
      id: 'campaign-framework',
      title: 'Strategic Campaign Framework',
      prompt: "Create a comprehensive strategic framework for [OBJECTIVE]. Include: 1) Clear measurable objective, 2) Core narrative and proof points, 3) Target audience segments and messages, 4) Content needs and distribution strategy, 5) Media targets by tier, 6) Timeline with immediate actions and milestones, 7) Success metrics and KPIs.",
      category: 'strategy',
      description: 'Generate complete campaign framework',
      icon: <Sparkles className="w-4 h-4 text-yellow-400" />
    },
    {
      id: 'market-entry',
      title: 'Market Entry Strategy',
      prompt: "Develop market entry strategy for [NEW MARKET/PRODUCT]. Analyze: 1) Market readiness and competitive landscape, 2) Regulatory and cultural factors, 3) Potential partners and channels, 4) Differentiation strategy, 5) Launch timeline and milestones, 6) Investment requirements, 7) Risk factors and mitigation. Provide Go/No-Go recommendation.",
      category: 'strategy',
      description: 'Plan market or product entry'
    },
    {
      id: 'positioning-strategy',
      title: 'Positioning Strategy Development',
      prompt: "Create positioning strategy for [COMPANY/PRODUCT] against [COMPETITORS]. Define: 1) Current perception analysis, 2) Desired positioning and why it's ownable, 3) Proof points and differentiators, 4) Key messages by audience, 5) Narrative transformation path, 6) Competitive response scenarios. Include perception change metrics.",
      category: 'strategy',
      description: 'Define unique market position'
    },

    // Campaign Development
    {
      id: 'thought-leadership',
      title: 'Thought Leadership Campaign',
      prompt: "Build thought leadership campaign for [TOPIC/EXECUTIVE]. Design: 1) Unique angle based on expertise, 2) Content pillar topics for 6 months, 3) Target media and speaking opportunities, 4) Influencer engagement strategy, 5) Social media activation plan, 6) Measurement framework. Include editorial calendar.",
      category: 'campaign',
      description: 'Establish thought leadership presence'
    },
    {
      id: 'product-launch',
      title: 'Product Launch Intelligence',
      prompt: "Prepare intelligence-driven launch for [PRODUCT] on [DATE]. Analyze: 1) Competitive launch successes/failures, 2) Optimal timing and news cycles, 3) Media opportunities and conflicts, 4) Anticipated competitive responses, 5) Differentiation messages, 6) Crisis scenarios. Create day-by-day execution plan.",
      category: 'campaign',
      description: 'Intelligence-backed product launch'
    },
    {
      id: 'advocacy-campaign',
      title: 'Advocacy Campaign Builder',
      prompt: "Design advocacy campaign for [ISSUE/POLICY]. Include: 1) Stakeholder mapping and positions, 2) Coalition building opportunities, 3) Message framework by audience, 4) Grassroots activation strategy, 5) Media and influencer targets, 6) Legislative/regulatory timeline, 7) Opposition research and counters.",
      category: 'campaign',
      description: 'Build support for issues or policies'
    },

    // Competitive Intelligence
    {
      id: 'competitor-analysis',
      title: 'Deep Competitor Analysis',
      prompt: "Analyze [COMPETITOR] comprehensively. Research: 1) Recent strategic moves and investments, 2) Leadership changes and implications, 3) Product/service developments, 4) Market positioning and messaging, 5) Customer sentiment and reviews, 6) Financial performance indicators, 7) Predicted next moves. Include exploitable weaknesses.",
      category: 'competitive',
      description: 'Complete competitor intelligence'
    },
    {
      id: 'competitive-response',
      title: 'Competitive Response Strategy',
      prompt: "[COMPETITOR] just announced [ACTION]. Develop response: 1) Impact assessment on our business, 2) Response options (ignore/match/counter/leapfrog), 3) Messaging strategy for each option, 4) Timeline and resource requirements, 5) Predicted counter-responses, 6) Long-term implications. Recommend optimal response.",
      category: 'competitive',
      description: 'Respond to competitive threats'
    },
    {
      id: 'market-share',
      title: 'Market Share Analysis',
      prompt: "Analyze market share dynamics in [MARKET]. Show: 1) Current share distribution and trends, 2) Share of voice vs share of market, 3) Customer flow between competitors, 4) Factors driving share changes, 5) Vulnerable competitor positions, 6) Opportunities to gain share. Include 90-day share capture plan.",
      category: 'competitive',
      description: 'Understand and capture market share'
    },

    // Crisis Management
    {
      id: 'crisis-response',
      title: 'Crisis Response Protocol',
      prompt: "URGENT: [CRISIS DESCRIPTION]. Execute: 1) Immediate impact assessment, 2) Stakeholder concern mapping, 3) Holding statement for immediate release, 4) Scenario-based response strategies, 5) Media monitoring and response plan, 6) Internal communication strategy, 7) Recovery timeline. Need plan in 15 minutes.",
      category: 'crisis',
      description: 'Immediate crisis response planning'
    },
    {
      id: 'reputation-defense',
      title: 'Reputation Defense Strategy',
      prompt: "Under attack about [ISSUE]. Defend: 1) Track attack origin and amplification, 2) Measure sentiment velocity, 3) Identify narrative weaknesses, 4) Find validators and allies, 5) Create counter-narrative, 6) Generate proof points, 7) Build response timeline. Include escalation triggers.",
      category: 'crisis',
      description: 'Defend against reputation attacks'
    },
    {
      id: 'issue-management',
      title: 'Issue Management Plan',
      prompt: "[ISSUE] is gaining attention. Manage: 1) Trajectory prediction and peak timing, 2) Stakeholder impact analysis, 3) Response strategy options, 4) Preventive actions available, 5) Communication framework, 6) Monitoring triggers, 7) Long-term resolution path. Rate urgency level.",
      category: 'crisis',
      description: 'Manage emerging issues proactively'
    },

    // Content & Media
    {
      id: 'content-strategy',
      title: 'Content Strategy Development',
      prompt: "Create content strategy for [OBJECTIVE]. Design: 1) Content pillars and themes, 2) Format mix (articles/videos/podcasts), 3) Distribution channels and cadence, 4) SEO and discovery strategy, 5) Engagement tactics, 6) Repurposing plan, 7) Performance metrics. Include 3-month editorial calendar.",
      category: 'content',
      description: 'Comprehensive content strategy'
    },
    {
      id: 'media-outreach',
      title: 'Media Outreach Optimizer',
      prompt: "Pitch [STORY] to media. Find: 1) 20 relevant journalists with recent coverage, 2) Personalized angles for each, 3) Optimal outreach timing, 4) Supporting materials needed, 5) Follow-up strategy, 6) Exclusive vs broad distribution strategy. Generate email templates.",
      category: 'content',
      description: 'Optimize media outreach success'
    },
    {
      id: 'executive-communications',
      title: 'Executive Communications Package',
      prompt: "Prepare [EXECUTIVE] for [EVENT/ANNOUNCEMENT]. Create: 1) Key messages and proof points, 2) Anticipated questions and answers, 3) Bridging statements, 4) Personal anecdotes and examples, 5) Industry context and data, 6) Competitive positioning, 7) Call-to-action. Include speech notes.",
      category: 'content',
      description: 'Prepare executive communications'
    },

    // Stakeholder Analysis
    {
      id: 'stakeholder-sentiment',
      title: 'Stakeholder Sentiment Analysis',
      prompt: "Analyze how [STAKEHOLDER GROUP] views [COMPANY/TOPIC]. Research: 1) Current sentiment and drivers, 2) Key concerns and priorities, 3) Information sources they trust, 4) Influence networks, 5) Historical positions, 6) Engagement opportunities. Create engagement strategy.",
      category: 'stakeholder',
      description: 'Understand stakeholder perspectives'
    },
    {
      id: 'coalition-building',
      title: 'Coalition Building Strategy',
      prompt: "Build coalition for [OBJECTIVE]. Identify: 1) Potential allies and their motivations, 2) Opposition and their concerns, 3) Neutral parties who could be swayed, 4) Common ground opportunities, 5) Deal breakers to avoid, 6) Engagement sequence and tactics. Create alliance map.",
      category: 'stakeholder',
      description: 'Build strategic alliances'
    },
    {
      id: 'investor-intelligence',
      title: 'Investor Intelligence Brief',
      prompt: "Prepare investor intelligence for [COMPANY/EVENT]. Analyze: 1) Investor concerns and priorities, 2) Peer company performance, 3) Analyst perspectives and ratings, 4) Market trends affecting valuation, 5) Risk factors to address, 6) Growth story elements. Create investor deck outline.",
      category: 'stakeholder',
      description: 'Understand investor perspectives'
    }
  ]

  const copyToClipboard = (prompt: string, id: string) => {
    navigator.clipboard.writeText(prompt)
    setCopiedPromptId(id)
    setTimeout(() => setCopiedPromptId(null), 2000)
  }

  const pipelineStages: PipelineStage[] = [
    { id: 'mcp-discovery', name: 'Preparing Targets', status: 'pending', icon: Brain },
    { id: 'monitor-stage-2-relevance', name: 'Organizing Results', status: 'pending', icon: Target },
    { id: 'monitoring-stage-2-enrichment', name: 'Synthesizing', status: 'pending', icon: Users },
    { id: 'mcp-executive-synthesis', name: 'Structuring Opportunities', status: 'pending', icon: Zap },
    { id: 'mcp-opportunity-detector', name: 'Finalizing', status: 'pending', icon: AlertCircle }
  ]

  const [stages, setStages] = useState(pipelineStages)

  const getPipelineStages = () => stages

  const updateStageStatus = (stageId: string, status: 'pending' | 'running' | 'completed' | 'failed') => {
    setStages(prev => prev.map(stage => {
      if (stage.id === stageId) {
        const now = Date.now()
        let updates: Partial<PipelineStage> = { status }

        if (status === 'running') {
          updates.startTime = now
        } else if ((status === 'completed' || status === 'failed') && stage.startTime) {
          const duration = Math.round((now - stage.startTime) / 1000)
          updates.duration = `${duration}s`
        }

        return { ...stage, ...updates }
      }
      return stage
    }))
  }

  // Fetch social intelligence
  const fetchSocialIntelligence = async () => {
    if (!organization) return

    setSocialLoading(true)
    try {
      const response = await fetch('/api/social-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organization.name,
          time_range: socialTimeRange,
          platforms: socialPlatforms
        })
      })

      const data = await response.json()

      if (data.success) {
        setSocialSignals(data.signals || [])
        setSocialSentiment(data.sentiment_analysis)
      }
    } catch (error) {
      console.error('Social intelligence fetch error:', error)
    } finally {
      setSocialLoading(false)
    }
  }

  const runRealtimeMonitor = async () => {
    if (!organization) return

    setRealtimeLoading(true)
    setRealtimeResults(null)
    setRealtimeAlerts([])

    try {
      // Call through API route which properly saves to real_time_intelligence_briefs with UUID
      const response = await fetch('/api/realtime-monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_name: organization.name,
          organization_id: organization.id, // Pass UUID directly
          time_window: '6hours',
          route_to_opportunities: routeToOpportunities,
          route_to_crisis: routeToCrisis,
          route_to_predictions: true // ALWAYS route to predictions - it should always analyze
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Real-time monitor error response:', errorText)
        throw new Error(`Real-time monitor failed: ${response.status} - ${errorText.substring(0, 200)}`)
      }

      const data = await response.json()
      console.log('Real-time monitor response:', data)

      if (!data.success) {
        throw new Error('Real-time monitor returned unsuccessful response')
      }

      setRealtimeResults(data)
      setRealtimeAlerts(data.alerts || [])

      // Log confirmation
      console.log('✅ Real-time monitor complete')
      console.log(`   - ${data.articles_analyzed} articles analyzed and sent to detectors`)
      console.log(`   - Detectors running in background (saving to database)`)
      console.log(`   - Results available in Predictions, Opportunities, and Crisis modules`)
    } catch (error) {
      console.error('Real-time monitor error:', error)
      setError(error instanceof Error ? error.message : 'Real-time monitor failed')
    } finally {
      setRealtimeLoading(false)
    }
  }

  const runGeoMonitor = async () => {
    if (!organization) return

    setGeoLoading(true)
    setGeoError(null)
    setGeoResults(null)

    try {
      console.log('🌍 Starting GEO Intelligence Monitor for', organization.name)

      // STEP 1: Generate strategic GEO queries
      console.log('📋 Step 1/3: Generating GEO queries...')
      const { data: queryData, error: queryError } = await supabase.functions.invoke('geo-query-discovery', {
        body: {
          organization_id: organization.id,
          organization_name: organization.name,
          industry: organization.industry
        }
      })

      if (queryError) {
        console.error('Query generation error:', queryError)
        throw new Error(`Failed to generate GEO queries: ${queryError.message}`)
      }

      if (!queryData?.success) {
        console.error('Query generation failed:', queryData)
        throw new Error(queryData?.error || 'Failed to generate GEO queries')
      }

      // Extract queries from categorized response
      const categorizedQueries = queryData.queries
      let queries: any[] = []

      // Flatten categorized structure into single array
      if (categorizedQueries) {
        if (Array.isArray(categorizedQueries)) {
          // Already a flat array
          queries = categorizedQueries
        } else if (typeof categorizedQueries === 'object') {
          // Categorized object - flatten by priority
          queries = [
            ...(categorizedQueries.critical || []),
            ...(categorizedQueries.high || []),
            ...(categorizedQueries.medium || [])
          ]
        }
      }

      if (!Array.isArray(queries) || queries.length === 0) {
        console.error('Categorized queries:', categorizedQueries)
        throw new Error('No queries generated or invalid format')
      }

      console.log(`✅ Generated ${queries.length} queries`)

      // STEP 2: Test all 4 platforms with MULTI-BATCH approach
      // Call each platform twice with 5 queries each = 10 queries per platform
      // Batch 1: queries 0-4, Batch 2: queries 5-9
      console.log('🚀 Step 2/3: Testing all 4 platforms in 2 batches (10 queries total per platform)...')

      // Batch 1: First 5 queries on all platforms
      console.log('   Batch 1/2: Testing queries 1-5 on all platforms...')
      const [claudeBatch1, geminiBatch1, perplexityBatch1, chatgptBatch1] = await Promise.all([
        supabase.functions.invoke('geo-test-claude', {
          body: {
            organization_id: organization.id,
            organization_name: organization.name,
            queries: queries.slice(0, 5)
          }
        }),
        supabase.functions.invoke('geo-test-gemini', {
          body: {
            organization_id: organization.id,
            organization_name: organization.name,
            queries: queries.slice(0, 5)
          }
        }),
        supabase.functions.invoke('geo-test-perplexity', {
          body: {
            organization_id: organization.id,
            organization_name: organization.name,
            queries: queries.slice(0, 5)
          }
        }),
        supabase.functions.invoke('geo-test-chatgpt', {
          body: {
            organization_id: organization.id,
            organization_name: organization.name,
            queries: queries.slice(0, 5)
          }
        })
      ])

      console.log('   ✓ Batch 1/2 complete')

      // Batch 2: Next 5 queries on all platforms
      console.log('   Batch 2/2: Testing queries 6-10 on all platforms...')
      const [claudeBatch2, geminiBatch2, perplexityBatch2, chatgptBatch2] = await Promise.all([
        supabase.functions.invoke('geo-test-claude', {
          body: {
            organization_id: organization.id,
            organization_name: organization.name,
            queries: queries.slice(5, 10)
          }
        }),
        supabase.functions.invoke('geo-test-gemini', {
          body: {
            organization_id: organization.id,
            organization_name: organization.name,
            queries: queries.slice(5, 10)
          }
        }),
        supabase.functions.invoke('geo-test-perplexity', {
          body: {
            organization_id: organization.id,
            organization_name: organization.name,
            queries: queries.slice(5, 10)
          }
        }),
        supabase.functions.invoke('geo-test-chatgpt', {
          body: {
            organization_id: organization.id,
            organization_name: organization.name,
            queries: queries.slice(5, 10)
          }
        })
      ])

      console.log('   ✓ Batch 2/2 complete')

      // Check for errors in platform tests
      if (claudeBatch1.error) console.warn('Claude batch 1 error:', claudeBatch1.error)
      if (claudeBatch2.error) console.warn('Claude batch 2 error:', claudeBatch2.error)
      if (geminiBatch1.error) console.warn('Gemini batch 1 error:', geminiBatch1.error)
      if (geminiBatch2.error) console.warn('Gemini batch 2 error:', geminiBatch2.error)
      if (perplexityBatch1.error) console.warn('Perplexity batch 1 error:', perplexityBatch1.error)
      if (perplexityBatch2.error) console.warn('Perplexity batch 2 error:', perplexityBatch2.error)
      if (chatgptBatch1.error) console.warn('ChatGPT batch 1 error:', chatgptBatch1.error)
      if (chatgptBatch2.error) console.warn('ChatGPT batch 2 error:', chatgptBatch2.error)

      // Combine all platform results from both batches
      const allSignals = [
        ...(claudeBatch1.data?.signals || []),
        ...(claudeBatch2.data?.signals || []),
        ...(geminiBatch1.data?.signals || []),
        ...(geminiBatch2.data?.signals || []),
        ...(perplexityBatch1.data?.signals || []),
        ...(perplexityBatch2.data?.signals || []),
        ...(chatgptBatch1.data?.signals || []),
        ...(chatgptBatch2.data?.signals || [])
      ]

      console.log(`✅ Collected ${allSignals.length} signals from 4 platforms (2 batches each)`)

      // Transform signals to format expected by synthesis function
      const transformedResults = allSignals.map(signal => ({
        query: signal.data?.query || '',
        intent: signal.data?.intent || 'informational',
        priority: signal.priority || 'medium',
        platform: signal.platform,
        response: signal.data?.context || signal.data?.response || '',
        brand_mentioned: signal.data?.mentioned || false,
        rank: signal.data?.position || undefined,
        context_quality: signal.data?.context_quality || 'medium',
        competitors_mentioned: signal.data?.competitors_mentioned || []
      }))

      // STEP 3: Generate executive synthesis
      console.log('📊 Step 3/3: Generating executive synthesis...')
      const { data: synthesisData, error: synthesisError } = await supabase.functions.invoke('geo-executive-synthesis', {
        body: {
          organization_id: organization.id,
          organization_name: organization.name,
          geo_results: transformedResults
        }
      })

      if (synthesisError) {
        console.warn('Synthesis error (non-blocking):', synthesisError)
      }

      console.log('✅ GEO monitor complete:', {
        total_signals: allSignals.length,
        queries_tested: queries.length,
        platforms: '4 platforms (parallel)'
      })

      // Calculate platform-specific mention counts from signals
      const claudeMentions = allSignals.filter(s =>
        s.platform === 'claude' && s.type === 'ai_visibility'
      ).length
      const geminiMentions = allSignals.filter(s =>
        s.platform === 'gemini' && s.type === 'ai_visibility'
      ).length
      const perplexityMentions = allSignals.filter(s =>
        s.platform === 'perplexity' && s.type === 'ai_visibility'
      ).length
      const chatgptMentions = allSignals.filter(s =>
        s.platform === 'chatgpt' && s.type === 'ai_visibility'
      ).length
      const criticalSignals = allSignals.filter(s =>
        s.priority === 'critical'
      ).length

      // Construct final results object with UI-compatible summary
      const monitorData = {
        success: true,
        summary: {
          total_queries: queries.length,
          total_signals: allSignals.length,
          claude_mentions: claudeMentions,
          gemini_mentions: geminiMentions,
          perplexity_mentions: perplexityMentions,
          chatgpt_mentions: chatgptMentions,
          critical_signals: criticalSignals,
          platforms_tested: 4
        },
        queries: queries,
        signals: allSignals,
        synthesis: synthesisData?.synthesis || null
      }

      console.log('📊 Platform breakdown:', {
        claude: claudeMentions,
        gemini: geminiMentions,
        perplexity: perplexityMentions,
        chatgpt: chatgptMentions,
        critical: criticalSignals
      })

      setGeoResults(monitorData)

      // Load GEO signals from database
      await loadGeoSignals()
    } catch (error) {
      console.error('GEO monitor error:', error)
      setGeoError(error instanceof Error ? error.message : 'GEO monitor failed')
    } finally {
      setGeoLoading(false)
    }
  }

  const loadGeoSignals = async () => {
    if (!organization) return

    try {
      const { data, error } = await supabase
        .from('geo_intelligence')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      setGeoSignals(data || [])
    } catch (error) {
      console.error('Error loading GEO signals:', error)
    }
  }

  const executeSchemaRecommendation = async (recommendation: any) => {
    if (!organization) return

    console.log('⚡ Executing schema recommendation:', recommendation.title)

    try {
      // Call the geo-schema-updater edge function to actually apply the changes
      const { data, error } = await supabase.functions.invoke('geo-schema-updater', {
        body: {
          organization_id: organization.id,
          recommendation
        }
      })

      if (error) {
        throw error
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to execute recommendation')
      }

      console.log('✅ Schema updated:', data)

      // Show success message
      alert(`✅ Schema updated successfully!\n\nChanged: ${data.change_applied.field}\nFrom: ${JSON.stringify(data.change_applied.before)}\nTo: ${JSON.stringify(data.change_applied.after)}`)

      // Remove the executed recommendation from the UI
      if (geoResults?.synthesis?.recommendations) {
        const updatedRecommendations = geoResults.synthesis.recommendations.filter(
          (r: any) => r.title !== recommendation.title
        )
        setGeoResults({
          ...geoResults,
          synthesis: {
            ...geoResults.synthesis,
            recommendations: updatedRecommendations
          }
        })
      }

    } catch (error: any) {
      console.error('Error executing recommendation:', error)
      alert(`Failed to execute recommendation: ${error.message || 'Unknown error'}`)
    }
  }

  const loadSchema = async () => {
    if (!organization) return

    setSchemaLoading(true)
    try {
      const response = await fetch(`/api/schema/extract?organization_id=${organization.id}`)
      const data = await response.json()

      if (data.success) {
        setSchemaData(data)
      }
    } catch (error) {
      console.error('Error loading schema:', error)
    } finally {
      setSchemaLoading(false)
    }
  }

  const extractSchema = async () => {
    if (!organization) return

    setSchemaExtracting(true)
    try {
      // Use url field from organizations table (domain is an alias)
      const orgUrl = organization.url || organization.domain

      console.log('🔍 Organization data:', {
        id: organization.id,
        name: organization.name,
        url: organization.url,
        domain: organization.domain,
        orgUrl
      })

      if (!orgUrl) {
        alert('Please set your organization domain/website in settings first')
        setSchemaExtracting(false)
        return
      }

      console.log('🔍 Extracting schema from', orgUrl)

      const response = await fetch('/api/schema/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organization_id: organization.id,
          organization_url: orgUrl,
          organization_name: organization.name,
          industry: organization.industry,
          extract_competitors: false
        })
      })

      if (!response.ok) {
        throw new Error('Schema extraction failed')
      }

      const result = await response.json()
      console.log('✅ Schema extracted:', result)

      // Reload schema data
      await loadSchema()

      alert(`Schema ${result.organization_schema.source === 'extracted' ? 'extracted' : 'generated'} successfully!`)
    } catch (error) {
      console.error('Error extracting schema:', error)
      alert('Failed to extract schema. Check console for details.')
    } finally {
      setSchemaExtracting(false)
    }
  }

  const updateSchema = async (updatedSchema: any) => {
    if (!organization) return

    try {
      console.log('💾 Updating schema...', updatedSchema)

      // Update schema in Memory Vault via Supabase
      const { error } = await supabase
        .from('content_library')
        .update({
          content: updatedSchema.content,
          metadata: {
            ...updatedSchema.metadata,
            version: (updatedSchema.metadata?.version || 1) + 1,
            last_updated: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', updatedSchema.id)

      if (error) throw error

      console.log('✅ Schema updated successfully')

      // Reload schema data
      await loadSchema()

      alert('Schema updated successfully!')
    } catch (error) {
      console.error('Error updating schema:', error)
      alert('Failed to update schema. Check console for details.')
    }
  }

  // Clear synthesis when organization changes
  useEffect(() => {
    if (organization?.id) {
      console.log(`🔄 Organization changed to ${organization.name}, loading latest synthesis`)
      // Reset running state
      setError(null)
      setIsRunning(false)
      setCurrentStage(0)
      setSocialSignals([])
      setRealtimeResults(null)
      setRealtimeAlerts([])
      setGeoResults(null)
      setGeoError(null)

      // Load schema data
      loadSchema()

      // Load latest synthesis from database
      IntelligenceService.getLatestSynthesis(organization.id).then(synthesis => {
        if (synthesis) {
          console.log('✅ Loaded previous synthesis:', synthesis)
          // The synthesis table stores the full synthesis object in the 'synthesis_data' column
          setExecutiveSynthesis(synthesis.synthesis_data || synthesis)
        } else {
          console.log('No previous synthesis found')
          setExecutiveSynthesis(null)
        }
      }).catch(error => {
        console.error('Failed to load synthesis:', error)
        setExecutiveSynthesis(null)
      })

      // Load GEO signals
      loadGeoSignals()
    }
  }, [organization?.id])

  // Auto-fetch when tab opens or filters change
  useEffect(() => {
    if (activeTab === 'social') {
      fetchSocialIntelligence()
    }
  }, [activeTab, socialTimeRange, socialPlatforms, organization])

  // Platform icon helper
  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'twitter': return <Twitter className="w-4 h-4" />
      case 'reddit': return <MessageCircle className="w-4 h-4" />
      case 'linkedin': return <Linkedin className="w-4 h-4" />
      case 'instagram': return <Instagram className="w-4 h-4" />
      case 'tiktok': return <Hash className="w-4 h-4" />
      default: return <Share2 className="w-4 h-4" />
    }
  }

  const runPipeline = async () => {
    if (!organization) {
      setError('Please select an organization first')
      return
    }

    setIsRunning(true)
    setCurrentStage(0)
    setError(null)
    setExecutiveSynthesis(null)
    // Reset all stages to pending
    setStages(pipelineStages.map(s => ({ ...s, status: 'pending' })))

    if (useRealPipeline) {
      try {
        // Call the real pipeline with organization details and progress callback
        const pipelineData = await IntelligenceService.startPipeline(
          organization.id,
          organization.name,
          organization.industry,
          (stage, status, data) => {
            console.log(`Pipeline stage ${stage}: ${status}`, data)
            updateStageStatus(stage, status)

            // Update current stage index for visual tracking
            const stageIndex = pipelineStages.findIndex(s => s.id === stage)
            if (stageIndex !== -1 && status === 'running') {
              setCurrentStage(stageIndex)
            }
          }
        )

        console.log('Full pipeline response:', pipelineData)
        console.log('🔍 pipelineData.synthesis:', pipelineData?.synthesis)
        console.log('🔍 pipelineData.executiveSynthesis:', pipelineData?.executiveSynthesis)
        console.log('🔍 pipelineData keys:', pipelineData ? Object.keys(pipelineData) : 'null')

        // Check if we have executive report or synthesis
        const synthesisData = pipelineData?.synthesis || pipelineData?.executiveSynthesis
        console.log('🔍 synthesisData after OR:', synthesisData)
        if (synthesisData) {
          console.log('Executive Report received:', synthesisData)
          setExecutiveSynthesis(synthesisData)

          // Mark all stages as complete
          setStages(prev => prev.map(stage => ({ ...stage, status: 'completed' })))
        } else {
          setError('No synthesis data received from pipeline')
        }
      } catch (err: any) {
        console.error('Pipeline error:', err)
        setError(err.message || 'Pipeline failed. Please try again.')

        // Mark current stage as failed
        const failedStage = stages[currentStage]
        if (failedStage) {
          updateStageStatus(failedStage.id, 'failed')
        }
      } finally {
        setIsRunning(false)
      }
    }
  }

  const filteredPrompts = prompts.filter(prompt => {
    const matchesCategory = prompt.category === activePromptCategory
    const matchesSearch = !searchQuery ||
      prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.description?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header with Tabs */}
      <div className="border-b border-gray-800">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold">Intelligence Hub</h2>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('synthesis')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'synthesis'
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Executive Report
            </button>
            <button
              onClick={() => setActiveTab('social')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'social'
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
              }`}
            >
              <Share2 className="w-4 h-4" />
              Social Intelligence
            </button>
            <button
              onClick={() => setActiveTab('realtime')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'realtime'
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
              }`}
            >
              <Activity className="w-4 h-4" />
              Real-Time Monitor
            </button>
            <button
              onClick={() => setActiveTab('predictions')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'predictions'
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              Predictions
            </button>
            <button
              onClick={() => setActiveTab('geo')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'geo'
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
              }`}
            >
              <Globe className="w-4 h-4" />
              GEO Monitor
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {/* Executive Report Tab */}
        {activeTab === 'synthesis' && (
          <div className="p-6 overflow-y-auto h-full">
            <div className="max-w-4xl mx-auto">
              {/* Start Report Button - Always visible at top */}
              <div className="mb-6 flex justify-between items-center">
                <h3 className="text-xl font-bold text-yellow-400">Executive Report</h3>
                <button
                  onClick={runPipeline}
                  disabled={isRunning || !organization}
                  className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {executiveSynthesis ? 'Generate New Report' : 'Generate Report'}
                </button>
              </div>

              {/* Executive Report Component */}
              {!executiveSynthesis ? (
                <div className="bg-gray-800/30 rounded-lg p-8 border-2 border-dashed border-gray-700">
                  <div className="text-center">
                    {error ? (
                      <>
                        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
                        <h4 className="text-lg font-semibold mb-2 text-red-400">Error</h4>
                        <p className="text-gray-400 mb-6">{error}</p>
                        <button
                          onClick={() => { setError(null); runPipeline(); }}
                          disabled={isRunning || !organization}
                          className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Retry Report Generation
                        </button>
                      </>
                    ) : isRunning ? (
                      <>
                        <Loader2 className="w-12 h-12 mx-auto mb-4 text-yellow-400 animate-spin" />
                        <h4 className="text-lg font-semibold mb-2">Running Intelligence Pipeline</h4>
                        <p className="text-gray-400 mb-6">
                          {getPipelineStages()[currentStage]?.name || 'Initializing...'}
                        </p>
                        <div className="space-y-2 mt-6">
                          {getPipelineStages().map((stage, idx) => (
                            <div key={stage.id} className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                stage.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                stage.status === 'running' ? 'bg-yellow-500/20 text-yellow-400' :
                                stage.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                                'bg-gray-700 text-gray-500'
                              }`}>
                                {stage.status === 'completed' ? <Check className="w-4 h-4" /> :
                                 stage.status === 'running' ? <Loader2 className="w-4 h-4 animate-spin" /> :
                                 stage.status === 'failed' ? <AlertCircle className="w-4 h-4" /> :
                                 <span className="text-xs">{idx + 1}</span>}
                              </div>
                              <span className={`text-sm ${
                                stage.status === 'running' ? 'text-yellow-400' :
                                stage.status === 'completed' ? 'text-green-400' :
                                stage.status === 'failed' ? 'text-red-400' :
                                'text-gray-500'
                              }`}>
                                {stage.name}
                                {stage.duration && <span className="ml-2 text-xs text-gray-500">({stage.duration})</span>}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
                        <p className="text-gray-400">
                          {!organization ? 'Please select an organization first' : 'Click "Generate Report" above to transform research into strategic insights'}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <IntelligenceSynthesisDisplay synthesis={executiveSynthesis} />
              )}
            </div>
          </div>
        )}

        {/* Social Intelligence Tab */}
        {activeTab === 'social' && (
          <div className="p-6 overflow-y-auto h-full">
            <div className="max-w-6xl mx-auto">
              {/* Header with controls */}
              <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
                      <Share2 className="w-6 h-6" />
                      Social Intelligence
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">
                      Real-time social media monitoring across all major platforms
                    </p>
                  </div>
                  <button
                    onClick={fetchSocialIntelligence}
                    disabled={socialLoading}
                    className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${socialLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>

                {/* Filters */}
                <div className="flex gap-4 flex-wrap">
                  {/* Time Range */}
                  <div className="flex gap-2">
                    <span className="text-gray-400 text-sm">Time:</span>
                    {(['1h', '24h', '7d'] as const).map(range => (
                      <button
                        key={range}
                        onClick={() => setSocialTimeRange(range)}
                        className={`px-3 py-1 rounded text-sm transition-colors ${
                          socialTimeRange === range
                            ? 'bg-cyan-500/20 text-cyan-400'
                            : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        }`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>

                  {/* Platforms */}
                  <div className="flex gap-2 items-center">
                    <span className="text-gray-400 text-sm">Platforms:</span>
                    {['twitter', 'reddit', 'linkedin', 'instagram', 'tiktok'].map(platform => (
                      <button
                        key={platform}
                        onClick={() => {
                          setSocialPlatforms(prev =>
                            prev.includes(platform)
                              ? prev.filter(p => p !== platform)
                              : [...prev, platform]
                          )
                        }}
                        className={`px-3 py-1 rounded text-sm transition-colors flex items-center gap-1 ${
                          socialPlatforms.includes(platform)
                            ? 'bg-cyan-500/20 text-cyan-400'
                            : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        }`}
                      >
                        {getPlatformIcon(platform)}
                        {platform}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sentiment Summary */}
                {socialSentiment && (
                  <div className="mt-4 p-4 bg-gray-900/50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="text-sm text-gray-400 mb-2">Overall Sentiment</div>
                        <div className="text-2xl font-bold capitalize">{socialSentiment.overall}</div>
                      </div>
                      <div className="flex gap-4">
                        <div className="text-center">
                          <div className="text-green-400 text-xl font-bold">{socialSentiment.positive_percentage}%</div>
                          <div className="text-xs text-gray-400">Positive</div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-400 text-xl font-bold">{socialSentiment.neutral_percentage}%</div>
                          <div className="text-xs text-gray-400">Neutral</div>
                        </div>
                        <div className="text-center">
                          <div className="text-red-400 text-xl font-bold">{socialSentiment.negative_percentage}%</div>
                          <div className="text-xs text-gray-400">Negative</div>
                        </div>
                      </div>
                    </div>
                    {socialSentiment.summary && (
                      <p className="text-gray-300 text-sm mt-3">{socialSentiment.summary}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Loading State */}
              {socialLoading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                  <span className="ml-3 text-gray-400">Fetching social intelligence...</span>
                </div>
              )}

              {/* Signals Grid */}
              {!socialLoading && socialSignals.length > 0 && (
                <div className="grid gap-4">
                  {socialSignals.map((signal, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800 transition-colors border border-gray-700"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getPlatformIcon(signal.platform)}
                          <span className="font-medium text-cyan-400 capitalize">{signal.platform}</span>
                          {signal.author && (
                            <span className="text-gray-400 text-sm">@{signal.author}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {signal.engagement > 0 && (
                            <span className="text-gray-400 text-sm">{signal.engagement} engagements</span>
                          )}
                          <a
                            href={signal.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:text-cyan-300"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>

                      <p className="text-gray-300 text-sm mb-2 line-clamp-3">{signal.content}</p>

                      {signal.metrics && (
                        <div className="flex gap-4 text-xs text-gray-400 mt-2">
                          {signal.metrics.likes > 0 && <span>❤️ {signal.metrics.likes}</span>}
                          {signal.metrics.retweets > 0 && <span>🔁 {signal.metrics.retweets}</span>}
                          {signal.metrics.replies > 0 && <span>💬 {signal.metrics.replies}</span>}
                          {signal.metrics.score > 0 && <span>⬆️ {signal.metrics.score}</span>}
                          {signal.metrics.comments > 0 && <span>💬 {signal.metrics.comments}</span>}
                        </div>
                      )}

                      <div className="text-xs text-gray-500 mt-2">
                        {new Date(signal.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!socialLoading && socialSignals.length === 0 && (
                <div className="text-center py-12">
                  <Share2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No social signals found for the selected filters.</p>
                  <p className="text-gray-500 text-sm mt-2">Try adjusting the time range or platforms.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Real-Time Monitor Tab */}
        {activeTab === 'realtime' && (
          <div className="p-6 overflow-y-auto h-full">
            <div className="max-w-6xl mx-auto">
              {/* Header */}
              <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-orange-400 flex items-center gap-2">
                      <Activity className="w-6 h-6" />
                      Real-Time Breaking News Monitor
                    </h3>
                    <p className="text-gray-300 mt-2">
                      Continuously monitor breaking news and detect crisis/opportunity alerts in real-time
                    </p>
                  </div>
                  <button
                    onClick={runRealtimeMonitor}
                    disabled={realtimeLoading || !organization}
                    className={`px-6 py-3 rounded-lg transition-all flex items-center gap-2 font-medium ${
                      realtimeLoading
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-orange-500 hover:bg-orange-600 text-white'
                    }`}
                  >
                    {realtimeLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Running Monitor...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-5 h-5" />
                        Run Monitor
                      </>
                    )}
                  </button>
                </div>

                {/* Settings */}
                <div className="space-y-3 pt-4 border-t border-gray-700">
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={routeToOpportunities}
                      onChange={(e) => setRouteToOpportunities(e.target.checked)}
                      className="rounded"
                    />
                    Route high-priority alerts to Opportunity Engine
                    <span className="text-xs text-gray-500">
                      (Critical & High severity alerts generate opportunities)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={routeToCrisis}
                      onChange={(e) => setRouteToCrisis(e.target.checked)}
                      className="rounded"
                    />
                    Route crisis alerts to Crisis Command Center
                    <span className="text-xs text-gray-500">
                      (Critical alerts create active crisis events)
                    </span>
                  </label>
                </div>
              </div>

              {/* Results Summary */}
              {realtimeResults && !realtimeLoading && (
                <>
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                      <div className="text-blue-400 text-3xl font-bold">{realtimeResults.articles_analyzed || 0}</div>
                      <div className="text-gray-400 text-sm mt-1">Articles Analyzed</div>
                    </div>
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                      <div className="text-orange-400 text-3xl font-bold">{realtimeResults.alerts?.length || 0}</div>
                      <div className="text-gray-400 text-sm mt-1">Critical Alerts</div>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                      <div className="text-green-400 text-3xl font-bold">{realtimeResults.opportunities_count || 0}</div>
                      <div className="text-gray-400 text-sm mt-1">Opportunities</div>
                    </div>
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                      <div className="text-purple-400 text-3xl font-bold">{(realtimeResults.execution_time_ms / 1000).toFixed(1)}s</div>
                      <div className="text-gray-400 text-sm mt-1">Execution Time</div>
                    </div>
                  </div>

                  {/* Breaking Summary */}
                  {realtimeResults.breaking_summary && (
                    <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-lg p-6 mb-6">
                      <h4 className="text-lg font-semibold text-orange-400 mb-3 flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Breaking News Summary
                      </h4>
                      <p className="text-gray-200 leading-relaxed">{realtimeResults.breaking_summary}</p>
                    </div>
                  )}
                </>
              )}

              {/* Loading State */}
              {realtimeLoading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
                  <span className="ml-3 text-gray-400">Scanning breaking news sources...</span>
                </div>
              )}

              {/* Critical Alerts */}
              {!realtimeLoading && realtimeAlerts.length > 0 && (
                <div className="space-y-4 mb-6">
                  <h4 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    Critical Alerts ({realtimeAlerts.length})
                  </h4>
                  {realtimeAlerts.map((alert, idx) => {
                    const severityColors = {
                      critical: 'bg-red-500/10 border-red-500/30',
                      high: 'bg-orange-500/10 border-orange-500/30',
                      medium: 'bg-yellow-500/10 border-yellow-500/30',
                      low: 'bg-blue-500/10 border-blue-500/30'
                    }
                    const severityIcons = {
                      critical: '🔴',
                      high: '🟠',
                      medium: '🟡',
                      low: '🔵'
                    }

                    return (
                      <div
                        key={idx}
                        className={`rounded-lg p-5 border ${severityColors[alert.severity as keyof typeof severityColors] || severityColors.medium}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{severityIcons[alert.severity as keyof typeof severityIcons] || '⚪'}</span>
                            <div>
                              <h5 className="text-white font-semibold text-lg">{alert.title}</h5>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs px-2 py-1 rounded bg-gray-900/50 uppercase font-bold text-gray-300">
                                  {alert.severity}
                                </span>
                                {alert.category && (
                                  <span className="text-xs px-2 py-1 rounded bg-gray-800/50 text-gray-400">
                                    {alert.category}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <p className="text-gray-300 mb-4 leading-relaxed">{alert.summary}</p>

                        {alert.action && (
                          <div className="bg-gray-900/50 rounded p-3 mb-3">
                            <div className="text-sm font-medium text-gray-400 mb-1">Recommended Action:</div>
                            <div className="text-white">{alert.action}</div>
                          </div>
                        )}

                        {alert.timeline && (
                          <div className="flex items-center gap-2 mb-3 text-sm">
                            <span className="text-gray-400">Timeline:</span>
                            <span className="text-orange-400 font-medium">{alert.timeline}</span>
                          </div>
                        )}

                        {alert.sources && alert.sources.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {alert.sources.map((url: string, i: number) => (
                              <a
                                key={i}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-gray-900/30 px-3 py-1 rounded"
                              >
                                Source {i + 1}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Watch List */}
              {!realtimeLoading && realtimeResults?.watch_list && realtimeResults.watch_list.length > 0 && (
                <div className="bg-gray-800/30 rounded-lg p-5 mb-6">
                  <h4 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
                    👀 Watch List ({realtimeResults.watch_list.length})
                  </h4>
                  <div className="space-y-3">
                    {realtimeResults.watch_list.map((item: any, idx: number) => (
                      <div key={idx} className="bg-gray-800/50 rounded p-4 border border-gray-700">
                        <div className="font-medium text-white mb-1">{item.item}</div>
                        <div className="text-sm text-gray-400 mb-2">Why: {item.why}</div>
                        <div className="text-xs text-gray-500">Next check: {item.next_check}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!realtimeLoading && !realtimeResults && (
                <div className="text-center py-12">
                  <Activity className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Click "Run Monitor" to scan for breaking news and alerts</p>
                  <p className="text-gray-500 text-sm mt-2">Monitors {organization?.name || 'your organization'} across news sources</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Predictions Tab */}
        {activeTab === 'predictions' && (
          <div className="p-6 overflow-y-auto h-full">
            <div className="max-w-6xl mx-auto">
              {/* Import and render the Predictions component */}
              {organization?.id && (
                <div className="h-full">
                  <StakeholderPredictionDashboard organizationId={organization.id} />
                </div>
              )}
              {!organization && (
                <div className="text-center py-12">
                  <AlertTriangle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Please select an organization to view predictions</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* GEO Monitor Tab */}
        {activeTab === 'geo' && (
          <div className="p-6 overflow-y-auto h-full">
            <div className="max-w-6xl mx-auto">
              {/* Header */}
              <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-green-400 flex items-center gap-2">
                      <Globe className="w-6 h-6" />
                      GEO Intelligence Monitor
                    </h3>
                    <p className="text-gray-300 mt-2">
                      Test AI visibility across Claude, Gemini, and ChatGPT. Extract competitor schemas and get actionable GEO recommendations.
                    </p>
                  </div>
                  <button
                    onClick={runGeoMonitor}
                    disabled={geoLoading || !organization}
                    className={`px-6 py-3 rounded-lg transition-all flex items-center gap-2 font-medium ${
                      geoLoading
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    {geoLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Running Monitor...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-5 h-5" />
                        Run GEO Monitor
                      </>
                    )}
                  </button>
                </div>

                {/* Info box */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-gray-300">
                      <p className="font-medium text-blue-400 mb-1">What is GEO?</p>
                      <p>Generative Experience Optimization (GEO) tests how AI platforms like Claude, Gemini, and ChatGPT respond to queries about your brand. It monitors competitor schemas and provides recommendations to improve your AI visibility.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Schema Status Card */}
              <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-bold text-purple-400 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Schema.org Markup
                    </h4>
                    <p className="text-sm text-gray-400 mt-1">
                      {schemaData?.has_schema
                        ? `Schema extracted from your website (${schemaData.schema?.intelligence?.fields?.length || 0} fields)`
                        : 'No schema found - extract or generate one to optimize AI visibility'
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {schemaData?.has_schema && (
                      <button
                        onClick={() => setShowSchemaViewer(!showSchemaViewer)}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-all flex items-center gap-2 text-sm font-medium"
                      >
                        <FileText className="w-4 h-4" />
                        {showSchemaViewer ? 'Hide Details' : 'View Details'}
                      </button>
                    )}
                    <button
                      onClick={() => setShowSettings(true)}
                      className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400 rounded-lg transition-all flex items-center gap-2 text-sm font-medium"
                    >
                      <Settings className="w-4 h-4" />
                      {schemaData?.has_schema ? 'Update in Settings' : 'Configure in Settings'}
                    </button>
                  </div>
                </div>

                {schemaData?.has_schema && schemaData.schema && (
                  <div className="mt-4 space-y-3">
                    <div className="bg-gray-900/50 rounded-lg p-4">
                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Schema Type</div>
                          <div className="text-sm text-white font-medium">{schemaData.schema.metadata?.schema_type || 'Organization'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Source</div>
                          <div className="text-sm text-white font-medium capitalize">{schemaData.schema.intelligence?.source || 'extracted'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Last Updated</div>
                          <div className="text-sm text-white font-medium">
                            {schemaData.schema.updated_at
                              ? new Date(schemaData.schema.updated_at).toLocaleDateString()
                              : 'N/A'
                            }
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-2">Fields ({schemaData.schema.intelligence?.fields?.length || 0})</div>
                        <div className="flex flex-wrap gap-2">
                          {schemaData.schema.intelligence?.fields?.slice(0, 8).map((field: string, idx: number) => (
                            <span key={idx} className="text-xs px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded text-purple-300">
                              {field}
                            </span>
                          ))}
                          {(schemaData.schema.intelligence?.fields?.length || 0) > 8 && (
                            <span className="text-xs px-2 py-1 text-gray-500">
                              +{schemaData.schema.intelligence.fields.length - 8} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {!schemaData?.has_schema && !schemaLoading && (
                  <div className="mt-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-gray-300">
                        <p className="font-medium text-yellow-400 mb-1">No Schema Found</p>
                        <p>Click "Configure in Settings" to extract schema.org markup from your website. If none exists, we'll generate a basic Organization schema from your profile.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Schema Viewer */}
              {showSchemaViewer && schemaData?.has_schema && schemaData.schema && (
                <div className="mb-6">
                  <SchemaViewer
                    schema={schemaData.schema}
                    competitorSchemas={schemaData.competitor_schemas || []}
                    onUpdate={updateSchema}
                    readonly={false}
                  />
                </div>
              )}

              {/* Results Summary */}
              {geoResults && !geoLoading && (
                <div className="grid grid-cols-6 gap-3 mb-6">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <div className="text-blue-400 text-3xl font-bold">{geoResults.summary?.total_queries || 0}</div>
                    <div className="text-gray-400 text-sm mt-1">Queries Tested</div>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                    <div className="text-green-400 text-3xl font-bold">{geoResults.summary?.claude_mentions || 0}</div>
                    <div className="text-gray-400 text-sm mt-1">Claude</div>
                  </div>
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                    <div className="text-purple-400 text-3xl font-bold">{geoResults.summary?.gemini_mentions || 0}</div>
                    <div className="text-gray-400 text-sm mt-1">Gemini</div>
                  </div>
                  <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
                    <div className="text-cyan-400 text-3xl font-bold">{geoResults.summary?.perplexity_mentions || 0}</div>
                    <div className="text-gray-400 text-sm mt-1">Perplexity</div>
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                    <div className="text-yellow-400 text-3xl font-bold">{geoResults.summary?.chatgpt_mentions || 0}</div>
                    <div className="text-gray-400 text-sm mt-1">ChatGPT</div>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <div className="text-red-400 text-3xl font-bold">{geoResults.summary?.critical_signals || 0}</div>
                    <div className="text-gray-400 text-sm mt-1">Critical</div>
                  </div>
                </div>
              )}

              {/* Executive Synthesis */}
              {geoResults?.synthesis && !geoLoading && (
                <div className="mb-6 space-y-4">
                  {/* Executive Summary */}
                  <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-6">
                    <div className="flex items-start gap-3 mb-3">
                      <TrendingUp className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="text-xl font-bold text-purple-400 mb-2">Executive Summary</h4>
                        <p className="text-gray-300 text-base leading-relaxed">{geoResults.synthesis.executive_summary}</p>
                      </div>
                    </div>
                  </div>

                  {/* Key Findings */}
                  {geoResults.synthesis.key_findings && geoResults.synthesis.key_findings.length > 0 && (
                    <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-6">
                      <h4 className="text-lg font-bold text-blue-400 mb-4 flex items-center gap-2">
                        <Lightbulb className="w-5 h-5" />
                        Key Findings
                      </h4>
                      <ul className="space-y-3">
                        {geoResults.synthesis.key_findings.map((finding: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-3">
                            <span className="text-blue-400 font-bold mt-1">•</span>
                            <span className="text-gray-300">{finding}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Critical Actions */}
                  {geoResults.synthesis.critical_actions && geoResults.synthesis.critical_actions.length > 0 && (
                    <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-6">
                      <h4 className="text-lg font-bold text-orange-400 mb-4 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        Critical Actions
                      </h4>
                      <div className="space-y-4">
                        {geoResults.synthesis.critical_actions.map((action: any, idx: number) => {
                          const priorityColors = {
                            critical: 'border-red-500/30 bg-red-500/10',
                            high: 'border-orange-500/30 bg-orange-500/10',
                            medium: 'border-yellow-500/30 bg-yellow-500/10'
                          }
                          return (
                            <div key={idx} className={`rounded-lg p-4 border ${priorityColors[action.priority as keyof typeof priorityColors] || priorityColors.medium}`}>
                              <div className="flex items-start justify-between mb-2">
                                <h5 className="text-white font-semibold">{action.action}</h5>
                                <span className="text-xs px-2 py-1 rounded bg-gray-900/50 uppercase font-bold">
                                  {action.priority}
                                </span>
                              </div>
                              <p className="text-sm text-gray-400 mb-2">{action.expected_impact}</p>
                              {action.platform && (
                                <div className="text-xs text-gray-500">Platform: {action.platform}</div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Schema Recommendations */}
                  {geoResults.synthesis.recommendations && geoResults.synthesis.recommendations.length > 0 && (
                    <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-6">
                      <h4 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Schema Recommendations ({geoResults.synthesis.recommendations.length})
                      </h4>
                      <div className="space-y-4">
                        {geoResults.synthesis.recommendations.slice(0, 5).map((rec: any, idx: number) => (
                          <div key={idx} className="bg-gray-900/50 border border-gray-700/30 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h5 className="text-white font-semibold flex items-center gap-2">
                                  {rec.title}
                                  {rec.auto_executable && (
                                    <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400 font-bold">
                                      ⚡ Auto-Execute
                                    </span>
                                  )}
                                </h5>
                                <div className="flex items-center gap-2 mt-1 text-xs">
                                  <span className="text-gray-400">Schema: {rec.schema_type}</span>
                                  <span className="text-gray-600">•</span>
                                  <span className="text-gray-400">Priority: {rec.priority}</span>
                                  {rec.platform && (
                                    <>
                                      <span className="text-gray-600">•</span>
                                      <span className="text-gray-400">Platform: {rec.platform}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              {rec.auto_executable && (
                                <button
                                  onClick={() => executeSchemaRecommendation(rec)}
                                  className="ml-4 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded text-green-400 text-sm font-medium transition-colors flex items-center gap-2"
                                >
                                  <Zap className="w-4 h-4" />
                                  Execute
                                </button>
                              )}
                            </div>
                            <p className="text-sm text-gray-300 mb-2">{rec.description}</p>
                            {rec.reasoning && (
                              <p className="text-sm text-gray-400 italic mb-2">Reasoning: {rec.reasoning}</p>
                            )}
                            {rec.expected_impact && (
                              <p className="text-sm text-green-400 italic">Impact: {rec.expected_impact}</p>
                            )}
                          </div>
                        ))}
                        {geoResults.synthesis.recommendations.length > 5 && (
                          <p className="text-sm text-gray-500 text-center">
                            + {geoResults.synthesis.recommendations.length - 5} more recommendations
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Loading State */}
              {geoLoading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-green-400" />
                  <span className="ml-3 text-gray-400">Testing AI visibility...</span>
                </div>
              )}

              {/* Error State */}
              {geoError && !geoLoading && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-red-400 font-semibold mb-1">Error Running GEO Monitor</h4>
                      <p className="text-gray-300 text-sm">{geoError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* GEO Signals */}
              {!geoLoading && geoSignals.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-green-400" />
                    Intelligence Signals ({geoSignals.length})
                  </h4>

                  {geoSignals.map((signal, idx) => {
                    const priorityColors = {
                      critical: 'bg-red-500/10 border-red-500/30',
                      high: 'bg-orange-500/10 border-orange-500/30',
                      medium: 'bg-yellow-500/10 border-yellow-500/30',
                      low: 'bg-blue-500/10 border-blue-500/30'
                    }

                    const platformIcons: Record<string, string> = {
                      claude: '🤖',
                      gemini: '🌟',
                      chatgpt: '💬',
                      perplexity: '🔮',
                      firecrawl: '🔥'
                    }

                    const signalTypeLabels: Record<string, string> = {
                      ai_visibility: 'AI Visibility',
                      visibility_gap: 'Visibility Gap',
                      competitor_update: 'Competitor Schema',
                      schema_gap: 'Schema Gap',
                      performance_drop: 'Performance Drop',
                      new_opportunity: 'New Opportunity'
                    }

                    return (
                      <div
                        key={signal.id}
                        className={`rounded-lg p-5 border ${priorityColors[signal.priority as keyof typeof priorityColors] || priorityColors.medium}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{platformIcons[signal.platform] || '🌐'}</span>
                            <div>
                              <h5 className="text-white font-semibold flex items-center gap-2">
                                {signalTypeLabels[signal.signal_type] || signal.signal_type}
                                <span className="text-xs px-2 py-1 rounded bg-gray-900/50 uppercase font-bold text-gray-300">
                                  {signal.priority}
                                </span>
                              </h5>
                              <div className="text-sm text-gray-400 mt-1 capitalize">
                                Platform: {signal.platform}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(signal.created_at).toLocaleDateString()}
                          </div>
                        </div>

                        {/* Signal Data */}
                        {signal.data && (
                          <div className="bg-gray-900/50 rounded p-3 mb-3">
                            <div className="text-sm space-y-1">
                              {signal.data.query && (
                                <div>
                                  <span className="text-gray-400">Query:</span>{' '}
                                  <span className="text-white">{signal.data.query}</span>
                                </div>
                              )}
                              {signal.data.mentioned !== undefined && (
                                <div>
                                  <span className="text-gray-400">Mentioned:</span>{' '}
                                  <span className={signal.data.mentioned ? 'text-green-400' : 'text-red-400'}>
                                    {signal.data.mentioned ? 'Yes' : 'No'}
                                  </span>
                                  {signal.data.position && (
                                    <span className="text-gray-400 ml-2">(Position: {signal.data.position})</span>
                                  )}
                                </div>
                              )}
                              {signal.data.context && (
                                <div>
                                  <span className="text-gray-400">Context:</span>{' '}
                                  <span className="text-gray-300 text-xs italic">"{signal.data.context}"</span>
                                </div>
                              )}
                              {signal.data.schemas_found && (
                                <div>
                                  <span className="text-gray-400">Schemas Found:</span>{' '}
                                  <span className="text-white">{signal.data.schemas_found}</span>
                                </div>
                              )}
                              {signal.data.schema_types && signal.data.schema_types.length > 0 && (
                                <div>
                                  <span className="text-gray-400">Schema Types:</span>{' '}
                                  <span className="text-white">{signal.data.schema_types.join(', ')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Recommendation */}
                        {signal.recommendation && signal.recommendation.action && (
                          <div className="bg-green-500/10 rounded p-3">
                            <div className="flex items-start gap-2">
                              <Lightbulb className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                              <div className="text-sm">
                                <div className="font-medium text-green-400 mb-1">
                                  Recommendation: {signal.recommendation.action}
                                </div>
                                {signal.recommendation.reasoning && (
                                  <div className="text-gray-300">{signal.recommendation.reasoning}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Empty State */}
              {!geoLoading && !geoError && geoSignals.length === 0 && (
                <div className="text-center py-12">
                  <Globe className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Click "Run GEO Monitor" to test AI visibility</p>
                  <p className="text-gray-500 text-sm mt-2">
                    Tests Claude, Gemini, and ChatGPT visibility for {organization?.name || 'your organization'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}