'use client'

import React, { useState } from 'react'
import {
  Info,
  BookOpen,
  Search,
  ChevronRight,
  Target,
  Lightbulb,
  Copy,
  Check,
  Zap,
  TrendingUp,
  Users,
  FileText,
  Shield,
  Rocket
} from 'lucide-react'

interface PromptTemplate {
  id: string
  title: string
  prompt: string
  description?: string
  category: string
  icon?: React.ReactNode
  tags?: string[]
}

export default function NIVResourcesPanel() {
  const [activeTab, setActiveTab] = useState<'capabilities' | 'prompts'>('capabilities')
  const [activePromptCategory, setActivePromptCategory] = useState('quick-wins')
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

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
      description: 'Generate complete campaign framework'
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
          <h2 className="text-xl font-bold mb-4">NIV Resources</h2>

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
      </div>
    </div>
  )
}
