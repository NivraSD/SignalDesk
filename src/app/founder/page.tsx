'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Rocket,
  CheckSquare,
  Briefcase,
  ChevronRight,
  Loader2,
  ChevronDown,
  Circle,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/AuthProvider'
import StudioModule from '@/components/modules/StudioModule'

type FounderView = 'today' | 'launch' | 'workspace'

// Launch categories with checklist items
const LAUNCH_CHECKLIST: Record<string, { label: string; icon: string; items: string[] }> = {
  technical: {
    label: 'Technical',
    icon: '⚙️',
    items: [
      'Core product functionality complete',
      'Error handling and edge cases covered',
      'Performance optimization done',
      'Security audit completed',
      'Analytics and monitoring set up',
      'Backup and recovery tested'
    ]
  },
  testing: {
    label: 'Testing',
    icon: '🧪',
    items: [
      'Internal testing complete',
      'Beta user feedback collected',
      'Critical bugs fixed',
      'Load testing done',
      'Cross-browser/device testing',
      'User acceptance testing passed'
    ]
  },
  operational: {
    label: 'Operational',
    icon: '📋',
    items: [
      'Pricing finalized',
      'Payment processing set up',
      'Support system ready',
      'Documentation written',
      'Legal/Terms of Service done',
      'Onboarding flow tested'
    ]
  },
  outreach: {
    label: 'Outreach',
    icon: '📢',
    items: [
      'Launch announcement drafted',
      'Press/media list prepared',
      'Social media content ready',
      'Email list segmented',
      'Influencer/partner outreach done',
      'Community channels notified'
    ]
  },
  fundraising: {
    label: 'Fundraising',
    icon: '💰',
    items: [
      'Pitch deck finalized',
      'Financial projections ready',
      'Investor list compiled',
      'Data room prepared',
      'Demo/walkthrough polished',
      'Term sheet templates reviewed'
    ]
  }
}

interface ChecklistState {
  [category: string]: {
    [item: string]: boolean
  }
}

interface FounderContextData {
  company_name?: string
  company_description?: string
  industry?: string
  launch_date?: string
  current_focus?: string
  goals?: string[]
  challenges?: string[]
}

// Default founder context for NIV Platform
const DEFAULT_FOUNDER_CONTEXT: FounderContextData = {
  company_name: 'NIV Platform',
  company_description: 'AI-powered strategic communications and PR platform that helps organizations manage narrative, influence, and visibility through intelligent automation',
  industry: 'SaaS / AI / Communications',
  current_focus: 'Product launch and beta customer acquisition',
  goals: [
    'Launch beta version',
    'Acquire 10 pilot customers',
    'Build compelling case studies',
    'Secure seed funding'
  ],
  challenges: [
    'Solo founder bandwidth',
    'Market education on AI-powered PR',
    'Building credibility without team'
  ]
}

export default function FounderPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [activeView, setActiveView] = useState<FounderView>('today')
  const [checklistState, setChecklistState] = useState<ChecklistState>({})
  const [founderContext, setFounderContext] = useState<FounderContextData>(DEFAULT_FOUNDER_CONTEXT)
  const [loading, setLoading] = useState(true)

  // Load checklist state and founder context from database
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      loadChecklistState()
      loadFounderContext()
    }
  }, [user, authLoading])

  const loadChecklistState = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('founder_checklist')
        .select('*')
        .single()

      if (data?.state) {
        setChecklistState(data.state)
      } else {
        // Initialize empty state
        const initialState: ChecklistState = {}
        Object.keys(LAUNCH_CHECKLIST).forEach(cat => {
          initialState[cat] = {}
          LAUNCH_CHECKLIST[cat].items.forEach(item => {
            initialState[cat][item] = false
          })
        })
        setChecklistState(initialState)
      }
    } catch (error) {
      console.error('Error loading checklist:', error)
      // Initialize with empty state
      const initialState: ChecklistState = {}
      Object.keys(LAUNCH_CHECKLIST).forEach(cat => {
        initialState[cat] = {}
        LAUNCH_CHECKLIST[cat].items.forEach(item => {
          initialState[cat][item] = false
        })
      })
      setChecklistState(initialState)
    } finally {
      setLoading(false)
    }
  }

  const loadFounderContext = async () => {
    try {
      const { data, error } = await supabase
        .from('founder_context')
        .select('*')
        .single()

      if (data) {
        setFounderContext({
          company_name: data.company_name || DEFAULT_FOUNDER_CONTEXT.company_name,
          company_description: data.company_description || DEFAULT_FOUNDER_CONTEXT.company_description,
          industry: data.industry || DEFAULT_FOUNDER_CONTEXT.industry,
          launch_date: data.launch_date,
          current_focus: data.current_focus || DEFAULT_FOUNDER_CONTEXT.current_focus,
          goals: data.goals || DEFAULT_FOUNDER_CONTEXT.goals,
          challenges: data.challenges || DEFAULT_FOUNDER_CONTEXT.challenges
        })
      } else if (error?.code === 'PGRST116') {
        // No row found - create default context
        const { error: insertError } = await supabase
          .from('founder_context')
          .insert({
            user_id: user?.id,
            ...DEFAULT_FOUNDER_CONTEXT
          })

        if (insertError) {
          console.error('Error creating founder context:', insertError)
        }
      }
    } catch (error) {
      console.error('Error loading founder context:', error)
      // Use defaults
    }
  }

  const toggleChecklistItem = async (category: string, item: string) => {
    const newState = {
      ...checklistState,
      [category]: {
        ...checklistState[category],
        [item]: !checklistState[category]?.[item]
      }
    }
    setChecklistState(newState)

    // Persist to database
    await supabase
      .from('founder_checklist')
      .upsert({
        user_id: user?.id,
        state: newState,
        updated_at: new Date().toISOString()
      })
  }

  const getCategoryProgress = (category: string) => {
    const items = LAUNCH_CHECKLIST[category].items
    const completed = items.filter(item => checklistState[category]?.[item]).length
    return { completed, total: items.length, percent: Math.round((completed / items.length) * 100) }
  }

  const getOverallProgress = () => {
    let completed = 0
    let total = 0
    Object.keys(LAUNCH_CHECKLIST).forEach(cat => {
      const progress = getCategoryProgress(cat)
      completed += progress.completed
      total += progress.total
    })
    return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 }
  }

  // Navigation items
  const navItems: { id: FounderView; label: string; icon: React.ReactNode }[] = [
    { id: 'today', label: 'Today', icon: <Clock className="w-5 h-5" /> },
    { id: 'launch', label: 'Launch', icon: <Rocket className="w-5 h-5" /> },
    { id: 'workspace', label: 'Workspace', icon: <Briefcase className="w-5 h-5" /> },
  ]

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {/* Left Sidebar - Compact Navigation */}
      <div className="w-16 border-r border-gray-800/50 flex flex-col items-center py-4 bg-[#0f0f0f]">
        {/* Logo */}
        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center mb-8">
          <Rocket className="w-5 h-5" />
        </div>

        {/* Nav Icons */}
        <nav className="flex-1 flex flex-col gap-2">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all
                ${activeView === item.id
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-500 hover:text-white hover:bg-gray-800'}`}
              title={item.label}
            >
              {item.icon}
            </button>
          ))}
        </nav>

        {/* Back to Platform */}
        <button
          onClick={() => router.push('/platform')}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-600 hover:text-white hover:bg-gray-800 transition-all"
          title="Back to Platform"
        >
          <ChevronRight className="w-5 h-5 rotate-180" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {activeView === 'today' && (
          <TodayView
            checklistState={checklistState}
            founderContext={founderContext}
            onOpenLaunch={() => setActiveView('launch')}
            onOpenWorkspace={() => setActiveView('workspace')}
          />
        )}
        {activeView === 'launch' && (
          <LaunchView
            checklistState={checklistState}
            onToggleItem={toggleChecklistItem}
            getCategoryProgress={getCategoryProgress}
            getOverallProgress={getOverallProgress}
          />
        )}
        {activeView === 'workspace' && (
          <div className="h-full">
            <StudioModule />
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// TODAY VIEW - NIV-centric, what to do today
// =============================================================================
function TodayView({
  checklistState,
  founderContext,
  onOpenLaunch,
  onOpenWorkspace
}: {
  checklistState: ChecklistState
  founderContext: FounderContextData
  onOpenLaunch: () => void
  onOpenWorkspace: () => void
}) {
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([])
  const [chatLoading, setChatLoading] = useState(false)

  // Get incomplete high-priority items across categories
  const getTodayFocus = () => {
    const focus: Array<{ category: string; item: string }> = []

    // Priority order for categories
    const priorityOrder = ['technical', 'testing', 'operational', 'outreach', 'fundraising']

    for (const cat of priorityOrder) {
      const items = LAUNCH_CHECKLIST[cat].items
      for (const item of items) {
        if (!checklistState[cat]?.[item]) {
          focus.push({ category: cat, item })
          if (focus.length >= 3) break
        }
      }
      if (focus.length >= 3) break
    }

    return focus
  }

  const handleChatSubmit = async () => {
    if (!chatInput.trim() || chatLoading) return

    const userMessage = chatInput
    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setChatLoading(true)

    try {
      const response = await fetch('/api/niv/founder-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          context: {
            tasks: [],
            milestones: [],
            founderContext,
            checklistState,
            mode: 'founder'
          },
          history: chatMessages.slice(-10)
        })
      })

      const data = await response.json()
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response || data.message
      }])
    } catch (error) {
      console.error('Chat error:', error)
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }])
    } finally {
      setChatLoading(false)
    }
  }

  const todayFocus = getTodayFocus()
  const today = new Date()

  return (
    <div className="h-full flex">
      {/* Left side - Today's Focus */}
      <div className="w-1/2 border-r border-gray-800/50 p-8 overflow-auto">
        <div className="max-w-lg">
          {/* Header */}
          <h1 className="text-3xl font-bold text-white mb-1">
            Good {getTimeOfDay()}
          </h1>
          <p className="text-gray-500 mb-8">
            {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>

          {/* Today's Focus */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-400" />
              Focus Today
            </h2>
            <div className="space-y-3">
              {todayFocus.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p className="font-medium text-white">All caught up!</p>
                  <p className="text-sm">Your launch checklist is complete.</p>
                </div>
              ) : (
                todayFocus.map((item, i) => (
                  <div
                    key={i}
                    className="p-4 bg-gray-900/50 border border-gray-800/50 rounded-xl"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl">{LAUNCH_CHECKLIST[item.category].icon}</span>
                      <div>
                        <p className="font-medium text-white">{item.item}</p>
                        <p className="text-sm text-gray-500">{LAUNCH_CHECKLIST[item.category].label}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-3">
            <button
              onClick={onOpenLaunch}
              className="w-full p-4 bg-purple-600/20 border border-purple-500/30 rounded-xl text-left hover:bg-purple-600/30 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Rocket className="w-5 h-5 text-purple-400" />
                  <span className="font-medium text-white">View Launch Checklist</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500" />
              </div>
            </button>
            <button
              onClick={onOpenWorkspace}
              className="w-full p-4 bg-gray-800/50 border border-gray-700/50 rounded-xl text-left hover:bg-gray-800 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-gray-400" />
                  <span className="font-medium text-white">Open Workspace</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Right side - NIV Chat */}
      <div className="w-1/2 flex flex-col bg-[#0f0f0f]">
        {/* Header */}
        <div className="p-6 border-b border-gray-800/50">
          <h2 className="text-xl font-semibold text-white">NIV</h2>
          <p className="text-sm text-gray-500">What do you need help with?</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {chatMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <p className="text-gray-500 mb-6">
                I can help with content, research, planning, or anything else you need for launch.
              </p>
              <div className="space-y-2 w-full max-w-sm">
                <QuickPrompt
                  text="Draft an investor update email"
                  onClick={() => setChatInput('Draft an investor update email')}
                />
                <QuickPrompt
                  text="Help me prioritize this week"
                  onClick={() => setChatInput('Help me prioritize this week')}
                />
                <QuickPrompt
                  text="Create a launch announcement"
                  onClick={() => setChatInput('Create a launch announcement for social media')}
                />
              </div>
            </div>
          ) : (
            chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-100'
                }`}>
                  <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))
          )}
          {chatLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 rounded-2xl px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-800/50">
          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleChatSubmit()}
              placeholder="Ask NIV anything..."
              className="flex-1 bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={handleChatSubmit}
              disabled={chatLoading || !chatInput.trim()}
              className="px-4 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-xl transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// LAUNCH VIEW - Unified checklist by category
// =============================================================================
function LaunchView({
  checklistState,
  onToggleItem,
  getCategoryProgress,
  getOverallProgress
}: {
  checklistState: ChecklistState
  onToggleItem: (category: string, item: string) => void
  getCategoryProgress: (category: string) => { completed: number; total: number; percent: number }
  getOverallProgress: () => { completed: number; total: number; percent: number }
}) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(Object.keys(LAUNCH_CHECKLIST))
  )

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  const overall = getOverallProgress()

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-3xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Launch Checklist</h1>
          <p className="text-gray-500">Track your progress across all launch categories</p>
        </div>

        {/* Overall Progress */}
        <div className="mb-8 p-6 bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/20 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium text-white">Overall Progress</span>
            <span className="text-2xl font-bold text-white">{overall.percent}%</span>
          </div>
          <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
              style={{ width: `${overall.percent}%` }}
            />
          </div>
          <p className="text-sm text-gray-400 mt-2">
            {overall.completed} of {overall.total} items complete
          </p>
        </div>

        {/* Categories */}
        <div className="space-y-4">
          {Object.entries(LAUNCH_CHECKLIST).map(([categoryId, category]) => {
            const progress = getCategoryProgress(categoryId)
            const isExpanded = expandedCategories.has(categoryId)

            return (
              <div
                key={categoryId}
                className="bg-gray-900/50 border border-gray-800/50 rounded-xl overflow-hidden"
              >
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(categoryId)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{category.icon}</span>
                    <div className="text-left">
                      <h3 className="font-semibold text-white">{category.label}</h3>
                      <p className="text-sm text-gray-500">
                        {progress.completed}/{progress.total} complete
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Mini progress bar */}
                    <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full transition-all"
                        style={{ width: `${progress.percent}%` }}
                      />
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-500 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {/* Category Items */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-2">
                    {category.items.map((item, i) => {
                      const isChecked = checklistState[categoryId]?.[item] || false
                      return (
                        <button
                          key={i}
                          onClick={() => onToggleItem(categoryId, item)}
                          className={`w-full p-3 rounded-lg flex items-center gap-3 transition-all ${
                            isChecked
                              ? 'bg-green-500/10 border border-green-500/20'
                              : 'bg-gray-800/30 border border-transparent hover:border-gray-700'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            isChecked
                              ? 'bg-green-500 border-green-500'
                              : 'border-gray-600'
                          }`}>
                            {isChecked && <CheckCircle2 className="w-3 h-3 text-white" />}
                          </div>
                          <span className={`text-sm ${isChecked ? 'text-gray-400 line-through' : 'text-white'}`}>
                            {item}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

function QuickPrompt({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-3 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-purple-500/50 rounded-xl text-sm text-gray-300 hover:text-white transition-all"
    >
      {text}
    </button>
  )
}

function getTimeOfDay() {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}
