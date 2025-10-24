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
  RefreshCw
} from 'lucide-react'
import { IntelligenceService } from '@/lib/services/intelligenceService'
import { supabase } from '@/lib/supabase/client'
import { useAppStore } from '@/stores/useAppStore'
import IntelligenceSynthesisDisplay from '@/components/IntelligenceSynthesisDisplay'

// Import the executive synthesis component if it exists
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
  const [activeTab, setActiveTab] = useState<'synthesis' | 'capabilities' | 'prompts' | 'social' | 'realtime'>('capabilities')
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
    { id: 'mcp-discovery', name: 'Discovery', status: 'pending', icon: Brain },
    { id: 'monitor-stage-1', name: 'PR Filtering', status: 'pending', icon: Activity },
    { id: 'monitor-stage-2-relevance', name: 'Relevance Scoring', status: 'pending', icon: Target },
    { id: 'monitoring-stage-2-enrichment', name: 'Entity Extraction', status: 'pending', icon: Users },
    { id: 'mcp-executive-synthesis', name: 'Executive Synthesis', status: 'pending', icon: Zap },
    { id: 'mcp-opportunity-detector', name: 'Opportunity Detection', status: 'pending', icon: AlertCircle }
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

        // Check if we have executive synthesis or synthesis
        const synthesisData = pipelineData?.synthesis || pipelineData?.executiveSynthesis
        console.log('🔍 synthesisData after OR:', synthesisData)
        if (synthesisData) {
          console.log('Executive Synthesis received:', synthesisData)
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
              onClick={() => setActiveTab('capabilities')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'capabilities'
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
              }`}
            >
              <Info className="w-4 h-4" />
              NIV Capabilities
            </button>
            <button
              onClick={() => setActiveTab('synthesis')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'synthesis'
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Executive Synthesis
            </button>
            <button
              onClick={() => setActiveTab('prompts')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'prompts'
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Prompt Library
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
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {/* NIV Capabilities Tab */}
        {activeTab === 'capabilities' && (
          <div className="p-6 overflow-y-auto h-full">
            <div className="max-w-4xl space-y-6">
              <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl p-6 border border-purple-500/20">
                <h3 className="text-2xl font-bold mb-4 text-purple-400">NIV: Your Strategic Intelligence Engine</h3>
                <p className="text-gray-300 mb-6">
                  NIV (Neural Intelligence Vault) is your AI-powered strategic orchestration platform that transforms
                  raw intelligence into actionable campaign strategies.
                </p>
              </div>

              <div className="grid gap-6">
                {/* Research Capabilities */}
                <div className="bg-gray-800/50 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Search className="w-6 h-6 text-blue-400" />
                    <h4 className="text-lg font-semibold">Research & Discovery</h4>
                  </div>
                  <ul className="space-y-3 text-gray-300">
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                      <span><strong>Multi-Source Intelligence:</strong> Aggregates data from news, social media, patents, research papers, and regulatory filings</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                      <span><strong>Competitive Monitoring:</strong> Tracks competitor moves, product launches, executive changes, and strategic shifts in real-time</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                      <span><strong>Trend Detection:</strong> Identifies emerging narratives and weak signals before they become mainstream</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                      <span><strong>Stakeholder Analysis:</strong> Maps influence networks and stakeholder positions on key issues</span>
                    </li>
                  </ul>
                </div>

                {/* Strategic Framework Generation */}
                <div className="bg-gray-800/50 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Target className="w-6 h-6 text-purple-400" />
                    <h4 className="text-lg font-semibold">Strategic Framework Generation</h4>
                  </div>
                  <ul className="space-y-3 text-gray-300">
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                      <span><strong>Campaign Blueprints:</strong> Creates comprehensive campaign strategies with objectives, narratives, and proof points</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                      <span><strong>Content Planning:</strong> Identifies content needs, themes, and distribution strategies</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                      <span><strong>Media Strategy:</strong> Targets specific journalists, publications, and influencers for maximum impact</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                      <span><strong>Timeline & Execution:</strong> Provides day-by-day action plans with milestones and success metrics</span>
                    </li>
                  </ul>
                </div>

                {/* How to Use NIV */}
                <div className="bg-gray-800/50 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Lightbulb className="w-6 h-6 text-yellow-400" />
                    <h4 className="text-lg font-semibold">How to Use NIV Effectively</h4>
                  </div>
                  <div className="space-y-4 text-gray-300">
                    <div>
                      <h5 className="font-semibold text-yellow-400 mb-2">1. Start with Clear Objectives</h5>
                      <p>Be specific about what you want to achieve. Instead of "help with PR", try "create a thought leadership campaign to position us as the AI safety leader".</p>
                    </div>
                    <div>
                      <h5 className="font-semibold text-yellow-400 mb-2">2. Provide Context</h5>
                      <p>Share your industry, competitors, and any constraints. NIV uses this to tailor strategies to your specific situation.</p>
                    </div>
                    <div>
                      <h5 className="font-semibold text-yellow-400 mb-2">3. Iterate and Refine</h5>
                      <p>Use follow-up messages to drill deeper into specific areas or adjust the strategy based on your feedback.</p>
                    </div>
                    <div>
                      <h5 className="font-semibold text-yellow-400 mb-2">4. Save to Memory Vault</h5>
                      <p>Generated frameworks are automatically saved for future reference and can be shared with your team.</p>
                    </div>
                  </div>
                </div>

                {/* Example Use Cases */}
                <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg p-6 border border-green-500/20">
                  <h4 className="text-lg font-semibold mb-4 text-green-400">Example Use Cases</h4>
                  <div className="grid gap-3">
                    <div className="bg-gray-900/50 rounded-lg p-4">
                      <p className="text-sm">
                        <strong className="text-blue-400">Product Launch:</strong> "We're launching a new AI assistant for healthcare in Q2. Create a strategic framework to position us as the most trusted solution for patient data privacy."
                      </p>
                    </div>
                    <div className="bg-gray-900/50 rounded-lg p-4">
                      <p className="text-sm">
                        <strong className="text-purple-400">Competitive Response:</strong> "Our competitor just announced a $100M funding round. Develop a response strategy that shifts focus to our customer success metrics."
                      </p>
                    </div>
                    <div className="bg-gray-900/50 rounded-lg p-4">
                      <p className="text-sm">
                        <strong className="text-orange-400">Thought Leadership:</strong> "Position our CEO as the leading voice on ethical AI in financial services. Create a 90-day campaign framework."
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Executive Synthesis Tab */}
        {activeTab === 'synthesis' && (
          <div className="p-6 overflow-y-auto h-full">
            <div className="max-w-4xl mx-auto">
              <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-bold mb-4 text-yellow-400">Executive Synthesis Engine</h3>
                <p className="text-gray-300 mb-6">
                  Transform complex intelligence into executive-ready insights. This powerful synthesis engine
                  analyzes multiple data sources to deliver actionable strategic recommendations.
                </p>
              </div>

              {/* Executive Synthesis Component */}
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
                          Retry Synthesis
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
                        <h4 className="text-lg font-semibold mb-2">Executive Synthesis</h4>
                        <p className="text-gray-400 mb-6">
                          {!organization ? 'Please select an organization first' : 'Run comprehensive synthesis to transform research into strategic insights'}
                        </p>
                        <button
                          onClick={runPipeline}
                          disabled={isRunning || !organization}
                          className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Start Synthesis Process
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <IntelligenceSynthesisDisplay synthesis={executiveSynthesis} />
              )}

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h5 className="font-semibold text-green-400 mb-2">What It Does</h5>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Aggregates intelligence from multiple sources</li>
                    <li>• Identifies patterns and strategic implications</li>
                    <li>• Generates actionable recommendations</li>
                    <li>• Prioritizes by impact and urgency</li>
                  </ul>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h5 className="font-semibold text-blue-400 mb-2">Best For</h5>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Weekly strategic briefings</li>
                    <li>• Major decision support</li>
                    <li>• Competitive intelligence reports</li>
                    <li>• Board and investor updates</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Prompt Library Tab */}
        {activeTab === 'prompts' && (
          <div className="flex h-full">
            {/* Category Sidebar */}
            <div className="w-64 bg-gray-800/50 p-4 border-r border-gray-800">
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search prompts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
              <div className="space-y-1">
                {promptCategories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setActivePromptCategory(category.id)}
                    className={`w-full px-3 py-2 rounded-lg text-left transition-colors flex items-center gap-2 ${
                      activePromptCategory === category.id
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'hover:bg-gray-700 text-gray-400'
                    }`}
                  >
                    <span className={category.color}>{category.icon}</span>
                    <span className="text-sm font-medium">{category.label}</span>
                    <span className="ml-auto text-xs bg-gray-700 px-2 py-1 rounded">
                      {prompts.filter(p => p.category === category.id).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Prompts Grid */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="grid gap-4">
                {filteredPrompts.map(prompt => (
                  <div
                    key={prompt.id}
                    className="bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800/70 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-200">{prompt.title}</h4>
                      <button
                        onClick={() => copyToClipboard(prompt.prompt, prompt.id)}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        {copiedPromptId === prompt.id ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {prompt.description && (
                      <p className="text-sm text-gray-400 mb-3">{prompt.description}</p>
                    )}
                    <div className="bg-gray-900/50 rounded-lg p-3">
                      <p className="text-sm text-gray-300 font-mono">{prompt.prompt}</p>
                    </div>
                  </div>
                ))}
              </div>
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
      </div>
    </div>
  )
}