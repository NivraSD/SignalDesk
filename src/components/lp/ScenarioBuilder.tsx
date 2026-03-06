'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAppStore } from '@/stores/useAppStore'
import {
  Sparkles,
  Loader2,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Send,
  RefreshCw,
  FileText,
  Users,
  Target,
  Clock,
  AlertTriangle,
  Play,
  Building2,
  Rocket,
  Handshake,
  Globe,
  FileEdit,
  Shield,
  Swords,
  UserPlus,
  Compass,
  MapPin,
  Lightbulb
} from 'lucide-react'

// Types matching the backend
type ScenarioType =
  | 'product_launch'
  | 'merger_acquisition'
  | 'market_entry'
  | 'policy_change'
  | 'crisis_response'
  | 'competitive_response'
  | 'leadership_change'
  | 'strategic_initiative'
  | 'expansion'
  | 'custom'

type StakeholderCategory =
  | 'competitors'
  | 'regulators'
  | 'customers'
  | 'ecosystem'
  | 'media'
  | 'analysts'
  | 'investors'
  | 'employees'

interface LPScenario {
  scenario_id: string
  type: ScenarioType
  org_id: string
  created_at: string
  action: {
    what: string
    rationale?: string[]
    claims?: string[]
    details?: string[]
    terms?: string
    changes?: string[]
    incident?: string
    competitor_action?: string
    capabilities?: string[]
  }
  distribution?: {
    initial?: string
    phases?: { audience: string; timing: string }[]
    exclusions?: string[]
  }
  timing: {
    date?: string
    context?: string[]
    window_rationale?: string
    urgency?: 'immediate' | 'short_term' | 'medium_term' | 'long_term'
  }
  known_vulnerabilities: string[]
  stakeholder_seed: {
    [key in StakeholderCategory]?: string[]
  }
  aspect_mapping: {
    [aspect: string]: string[]
  }
  _dialogue_state?: {
    phase: 'initial' | 'probing' | 'stakeholders' | 'complete'
    questions_asked: string[]
    aspects_identified: string[]
    confidence: number
  }
}

interface ScenarioBuilderResponse {
  success: boolean
  scenario: Partial<LPScenario>
  phase: 'initial' | 'probing' | 'stakeholders' | 'complete'
  next_question?: string
  question_options?: string[]
  detected_type?: ScenarioType
  confidence?: number
  ready_for_simulation?: boolean
  suggestions?: {
    stakeholders?: { category: StakeholderCategory; entities: string[] }[]
    aspects?: string[]
    vulnerabilities?: string[]
  }
  error?: string
}

interface ExistingScenario {
  id: string
  type: string
  status: string
  created_at: string
  scenario_data: LPScenario
}

const TYPE_INFO: Record<ScenarioType, { label: string; icon: any; description: string }> = {
  product_launch: {
    label: 'Product Launch',
    icon: Rocket,
    description: 'New product, feature, or technology announcement'
  },
  merger_acquisition: {
    label: 'M&A / Deal',
    icon: Handshake,
    description: 'Merger, acquisition, investment, or partnership'
  },
  market_entry: {
    label: 'Market Entry',
    icon: Globe,
    description: 'Entering a new geographic or product market'
  },
  policy_change: {
    label: 'Policy Change',
    icon: FileEdit,
    description: 'Changes to company policy, pricing, or terms'
  },
  crisis_response: {
    label: 'Crisis Response',
    icon: Shield,
    description: 'Responding to a crisis or negative situation'
  },
  competitive_response: {
    label: 'Competitive Response',
    icon: Swords,
    description: 'Responding to a competitor action'
  },
  leadership_change: {
    label: 'Leadership Change',
    icon: UserPlus,
    description: 'New hire, executive departure, promotion, or restructuring'
  },
  strategic_initiative: {
    label: 'Strategic Initiative',
    icon: Compass,
    description: 'Major strategic move, pivot, political action, or organizational shift'
  },
  expansion: {
    label: 'Expansion',
    icon: MapPin,
    description: 'Geographic expansion, new office, facility, or team scale-up'
  },
  custom: {
    label: 'Custom',
    icon: Lightbulb,
    description: 'Any scenario not covered by other categories'
  }
}

interface ScenarioBuilderProps {
  onRunSimulation?: (scenarioId: string) => void
}

export default function ScenarioBuilder({ onRunSimulation }: ScenarioBuilderProps) {
  const organization = useAppStore(s => s.organization)

  // Form state
  const [initialDescription, setInitialDescription] = useState('')
  const [userResponse, setUserResponse] = useState('')

  // Current scenario state
  const [scenario, setScenario] = useState<Partial<LPScenario> | null>(null)
  const [phase, setPhase] = useState<'initial' | 'probing' | 'stakeholders' | 'complete'>('initial')
  const [nextQuestion, setNextQuestion] = useState<string | null>(null)
  const [detectedType, setDetectedType] = useState<ScenarioType | null>(null)
  const [confidence, setConfidence] = useState<number>(0)
  const [suggestions, setSuggestions] = useState<ScenarioBuilderResponse['suggestions'] | null>(null)

  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['action', 'stakeholders']))

  // Existing scenarios
  const [existingScenarios, setExistingScenarios] = useState<ExistingScenario[]>([])
  const [loadingScenarios, setLoadingScenarios] = useState(false)

  // Check for pre-populated seed from Public Affairs simulation
  useEffect(() => {
    try {
      const seedStr = sessionStorage.getItem('pa_simulation_seed')
      if (seedStr) {
        sessionStorage.removeItem('pa_simulation_seed')
        const seed = JSON.parse(seedStr)
        // Pre-populate the initial description with the scenario action
        if (seed.action?.what) {
          setInitialDescription(seed.action.what + (seed.action.rationale?.[0] ? ` — ${seed.action.rationale[0]}` : ''))
        }
        if (seed.type) {
          setDetectedType(seed.type as ScenarioType)
        }
        // Pre-populate stakeholder seed if available
        if (seed.stakeholder_seed) {
          setScenario(prev => ({
            ...prev,
            type: (seed.type || 'policy_change') as ScenarioType,
            action: { what: seed.action?.what || '' },
            stakeholder_seed: seed.stakeholder_seed,
          }))
          setSuggestions({
            stakeholders: Object.entries(seed.stakeholder_seed).map(([category, entities]) => ({
              category: category as StakeholderCategory,
              entities: entities as string[]
            }))
          })
        }
      }
    } catch (err) {
      console.error('Error loading PA simulation seed:', err)
    }
  }, [])

  // Load existing scenarios
  useEffect(() => {
    if (!organization?.id) {
      setExistingScenarios([])
      return
    }

    const loadScenarios = async () => {
      setLoadingScenarios(true)
      try {
        const { data, error } = await supabase
          .from('lp_scenarios')
          .select('id, type, status, created_at, scenario_data')
          .eq('organization_id', organization.id)
          .order('created_at', { ascending: false })
          .limit(10)

        if (data && !error) {
          setExistingScenarios(data)
        }
      } catch (err) {
        console.error('Failed to load scenarios:', err)
      } finally {
        setLoadingScenarios(false)
      }
    }

    loadScenarios()
  }, [organization?.id])

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(section)) next.delete(section)
      else next.add(section)
      return next
    })
  }

  // Start new scenario
  const startScenario = async () => {
    if (!initialDescription.trim() || !organization?.id) return

    setLoading(true)
    setError(null)

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('lp-scenario-builder', {
        body: {
          organization_id: organization.id,
          initial_description: initialDescription.trim()
        }
      })

      if (invokeError) throw invokeError

      const response = data as ScenarioBuilderResponse

      if (!response.success) {
        setError(response.error || 'Failed to start scenario')
        return
      }

      setScenario(response.scenario)
      setPhase(response.phase)
      setNextQuestion(response.next_question || null)
      setDetectedType(response.detected_type || null)
      setConfidence(response.confidence || 0)
      setSuggestions(response.suggestions || null)
      setInitialDescription('')

      // Refresh scenarios list
      const { data: refreshed } = await supabase
        .from('lp_scenarios')
        .select('id, type, status, created_at, scenario_data')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(10)
      if (refreshed) setExistingScenarios(refreshed)

    } catch (err: any) {
      setError(err.message || 'Failed to start scenario')
    } finally {
      setLoading(false)
    }
  }

  // Continue dialogue
  const continueDialogue = async () => {
    if (!userResponse.trim() || !scenario?.scenario_id || !organization?.id) return

    setLoading(true)
    setError(null)

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('lp-scenario-builder', {
        body: {
          organization_id: organization.id,
          scenario_id: scenario.scenario_id,
          user_response: userResponse.trim()
        }
      })

      if (invokeError) throw invokeError

      const response = data as ScenarioBuilderResponse

      if (!response.success) {
        setError(response.error || 'Failed to continue dialogue')
        return
      }

      setScenario(response.scenario)
      setPhase(response.phase)
      setNextQuestion(response.next_question || null)
      setConfidence(response.confidence || scenario._dialogue_state?.confidence || 0)
      setSuggestions(response.suggestions || null)
      setUserResponse('')

      // If complete, refresh scenarios list
      if (response.phase === 'complete') {
        const { data: refreshed } = await supabase
          .from('lp_scenarios')
          .select('id, type, status, created_at, scenario_data')
          .eq('organization_id', organization.id)
          .order('created_at', { ascending: false })
          .limit(10)
        if (refreshed) setExistingScenarios(refreshed)
      }

    } catch (err: any) {
      setError(err.message || 'Failed to continue dialogue')
    } finally {
      setLoading(false)
    }
  }

  // Load existing scenario
  const loadScenario = (existing: ExistingScenario) => {
    setScenario(existing.scenario_data)
    setPhase(existing.scenario_data._dialogue_state?.phase || 'complete')
    setDetectedType(existing.type as ScenarioType)
    setConfidence(existing.scenario_data._dialogue_state?.confidence || 0.85)
    setSuggestions({
      stakeholders: Object.entries(existing.scenario_data.stakeholder_seed || {}).map(([cat, entities]) => ({
        category: cat as StakeholderCategory,
        entities: entities as string[]
      })),
      aspects: existing.scenario_data._dialogue_state?.aspects_identified || []
    })
    setNextQuestion(null)
    setError(null)
  }

  // Reset to start new
  const resetBuilder = () => {
    setScenario(null)
    setPhase('initial')
    setNextQuestion(null)
    setDetectedType(null)
    setConfidence(0)
    setSuggestions(null)
    setError(null)
    setUserResponse('')
    setInitialDescription('')
  }

  const Section = ({ id, icon: Icon, title, children, badge }: {
    id: string
    icon: any
    title: string
    children: React.ReactNode
    badge?: string
  }) => {
    const expanded = expandedSections.has(id)
    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
        >
          <Icon className="w-4 h-4 text-[var(--burnt-orange)]" />
          <span className="text-sm font-medium text-[var(--charcoal)] flex-1">{title}</span>
          {badge && (
            <span className="px-1.5 py-0.5 text-[10px] rounded bg-[var(--burnt-orange)] text-white">{badge}</span>
          )}
          {expanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
        </button>
        {expanded && (
          <div className="px-3 py-2 bg-white text-sm">
            {children}
          </div>
        )}
      </div>
    )
  }

  const TypeIcon = detectedType ? TYPE_INFO[detectedType]?.icon : FileText

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Sparkles className="w-6 h-6 text-[var(--burnt-orange)]" />
        <div>
          <h2 className="text-lg font-semibold text-[var(--charcoal)]">LP Scenario Builder</h2>
          <p className="text-sm text-gray-500">
            Build structured scenarios for Liminal Propagation simulation
          </p>
        </div>
      </div>

      {/* Org context */}
      <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
        <Building2 className="w-4 h-4" />
        <span>Org: <strong className="text-[var(--charcoal)]">{organization?.name || 'None selected'}</strong></span>
        {existingScenarios.length > 0 && (
          <span className="ml-auto text-xs text-gray-400">{existingScenarios.length} scenarios</span>
        )}
      </div>

      {/* Existing scenarios */}
      {existingScenarios.length > 0 && !scenario && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[var(--burnt-orange)]" />
            <h3 className="text-sm font-semibold text-[var(--charcoal)]">Recent Scenarios</h3>
            {loadingScenarios && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
          </div>
          <div className="space-y-1.5">
            {existingScenarios.slice(0, 5).map(s => {
              const TypeIcon = TYPE_INFO[s.type as ScenarioType]?.icon || FileText
              return (
                <button
                  key={s.id}
                  onClick={() => loadScenario(s)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors text-left"
                >
                  <TypeIcon className="w-4 h-4 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--charcoal)] truncate">
                      {s.scenario_data.action?.what?.substring(0, 60) || 'Untitled scenario'}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {TYPE_INFO[s.type as ScenarioType]?.label} · {s.status} · {new Date(s.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {s.status === 'ready' && (
                    <span className="px-1.5 py-0.5 text-[10px] rounded bg-green-100 text-green-700">Ready</span>
                  )}
                  {s.status === 'building' && (
                    <span className="px-1.5 py-0.5 text-[10px] rounded bg-yellow-100 text-yellow-700">In progress</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* New scenario input */}
      {!scenario && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--burnt-orange)]" />
            <h3 className="text-sm font-semibold text-[var(--charcoal)]">New Scenario</h3>
          </div>
          <textarea
            value={initialDescription}
            onChange={e => setInitialDescription(e.target.value)}
            placeholder="Describe your scenario... e.g., 'We're hiring a former Google VP as our new CTO', 'We're expanding into Southeast Asia with a new Singapore office', 'We're announcing a strategic pivot toward enterprise AI', or 'We need to respond to a competitor's acquisition'"
            rows={4}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)] focus:border-transparent resize-none"
          />
          <button
            onClick={startScenario}
            disabled={loading || !initialDescription.trim() || !organization?.id}
            className="w-full px-4 py-2 bg-[var(--burnt-orange)] hover:bg-[var(--terracotta)] disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing scenario...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Start Building
              </>
            )}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-700">Error</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Active scenario */}
      {scenario && (
        <div className="space-y-4">
          {/* Scenario header */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-start gap-3">
              <TypeIcon className="w-5 h-5 text-[var(--burnt-orange)] mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[var(--charcoal)]">
                    {detectedType ? TYPE_INFO[detectedType].label : 'Scenario'}
                  </h3>
                  {confidence > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] rounded bg-gray-100 text-gray-600">
                      {(confidence * 100).toFixed(0)}% confidence
                    </span>
                  )}
                  {phase === 'complete' && (
                    <span className="px-1.5 py-0.5 text-[10px] rounded bg-green-100 text-green-700">
                      Ready for simulation
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {scenario.action?.what?.substring(0, 100)}
                  {(scenario.action?.what?.length || 0) > 100 ? '...' : ''}
                </p>
              </div>
              <button
                onClick={resetBuilder}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                title="Start new scenario"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Progress indicator */}
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--burnt-orange)] transition-all duration-300"
                  style={{
                    width: phase === 'initial' ? '10%' :
                      phase === 'probing' ? `${Math.min(80, 20 + (scenario._dialogue_state?.questions_asked?.length || 0) * 10)}%` :
                        phase === 'stakeholders' ? '90%' : '100%'
                  }}
                />
              </div>
              <span className="text-[10px] text-gray-400 capitalize">{phase}</span>
            </div>
          </div>

          {/* Probing question */}
          {nextQuestion && phase === 'probing' && (
            <div className="bg-[var(--burnt-orange)]/5 rounded-xl border border-[var(--burnt-orange)]/20 p-4 space-y-3">
              <p className="text-sm text-[var(--charcoal)]">{nextQuestion}</p>
              <div className="flex gap-2">
                <textarea
                  value={userResponse}
                  onChange={e => setUserResponse(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && e.metaKey) continueDialogue()
                  }}
                  placeholder="Your response..."
                  rows={3}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)] focus:border-transparent resize-none"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400">⌘+Enter to submit</span>
                <button
                  onClick={continueDialogue}
                  disabled={loading || !userResponse.trim()}
                  className="px-3 py-1.5 bg-[var(--burnt-orange)] hover:bg-[var(--terracotta)] disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                >
                  {loading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Send className="w-3 h-3" />
                  )}
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Scenario details */}
          <div className="space-y-2">
            <Section id="action" icon={Target} title="Action" badge={scenario.action?.what ? '✓' : undefined}>
              <div className="space-y-2 text-gray-600">
                <p><strong>What:</strong> {scenario.action?.what || 'Not defined'}</p>
                {(scenario.action?.rationale?.length ?? 0) > 0 && (
                  <div>
                    <strong>Rationale:</strong>
                    <ul className="list-disc list-inside ml-2">
                      {scenario.action!.rationale!.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                )}
                {(scenario.action?.claims?.length ?? 0) > 0 && (
                  <div>
                    <strong>Claims:</strong>
                    <ul className="list-disc list-inside ml-2">
                      {scenario.action!.claims!.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                )}
                {(scenario.action?.details?.length ?? 0) > 0 && (
                  <div>
                    <strong>Details:</strong>
                    <ul className="list-disc list-inside ml-2">
                      {scenario.action!.details!.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                )}
                {(scenario.action?.capabilities?.length ?? 0) > 0 && !(scenario.action?.rationale?.length) && (
                  <div>
                    <strong>Capabilities:</strong>
                    <ul className="list-disc list-inside ml-2">
                      {scenario.action!.capabilities!.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </Section>

            <Section id="timing" icon={Clock} title="Timing" badge={scenario.timing?.context?.length ? '✓' : undefined}>
              <div className="space-y-1 text-gray-600">
                {scenario.timing?.date && <p><strong>Date:</strong> {scenario.timing.date}</p>}
                {scenario.timing?.urgency && <p><strong>Urgency:</strong> {scenario.timing.urgency}</p>}
                {scenario.timing?.context && scenario.timing.context.length > 0 && (
                  <div>
                    <strong>Context:</strong>
                    <ul className="list-disc list-inside ml-2">
                      {scenario.timing.context.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                )}
                {scenario.timing?.window_rationale && (
                  <p><strong>Rationale:</strong> {scenario.timing.window_rationale}</p>
                )}
              </div>
            </Section>

            <Section
              id="vulnerabilities"
              icon={AlertTriangle}
              title="Known Vulnerabilities"
              badge={scenario.known_vulnerabilities?.length ? `${scenario.known_vulnerabilities.length}` : undefined}
            >
              {scenario.known_vulnerabilities && scenario.known_vulnerabilities.length > 0 ? (
                <ul className="list-disc list-inside text-gray-600">
                  {scenario.known_vulnerabilities.map((v, i) => <li key={i}>{v}</li>)}
                </ul>
              ) : (
                <p className="text-gray-400 italic">None identified yet</p>
              )}
            </Section>

            <Section
              id="stakeholders"
              icon={Users}
              title="Stakeholders"
              badge={Object.keys(scenario.stakeholder_seed || {}).length ? `${Object.values(scenario.stakeholder_seed || {}).flat().length}` : undefined}
            >
              {Object.keys(scenario.stakeholder_seed || {}).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(scenario.stakeholder_seed || {}).map(([category, entities]) => (
                    <div key={category}>
                      <strong className="text-[var(--charcoal)] capitalize">{category}:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(entities as string[]).map((e, i) => (
                          <span key={i} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                            {e}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 italic">Will be inferred when probing completes</p>
              )}
            </Section>

            {/* Aspects */}
            {scenario._dialogue_state?.aspects_identified && scenario._dialogue_state.aspects_identified.length > 0 && (
              <Section id="aspects" icon={Target} title="Identified Aspects" badge={`${scenario._dialogue_state.aspects_identified.length}`}>
                <div className="flex flex-wrap gap-1">
                  {scenario._dialogue_state.aspects_identified.map((a, i) => (
                    <span key={i} className="px-2 py-0.5 text-xs bg-[var(--burnt-orange)]/10 text-[var(--burnt-orange)] rounded">
                      {a}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {/* Aspect mapping */}
            {scenario.aspect_mapping && Object.keys(scenario.aspect_mapping).length > 0 && (
              <Section id="aspect_mapping" icon={Target} title="Aspect → Stakeholder Mapping">
                <div className="space-y-2 text-sm">
                  {Object.entries(scenario.aspect_mapping).map(([aspect, stakeholders]) => (
                    <div key={aspect} className="flex items-start gap-2">
                      <span className="px-2 py-0.5 text-xs bg-[var(--burnt-orange)]/10 text-[var(--burnt-orange)] rounded shrink-0">
                        {aspect}
                      </span>
                      <span className="text-gray-400">→</span>
                      <div className="flex flex-wrap gap-1">
                        {(stakeholders as string[]).map((s, i) => (
                          <span key={i} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>

          {/* Ready for simulation */}
          {phase === 'complete' && (
            <div className="bg-green-50 rounded-xl border border-green-200 p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-green-800">Scenario Ready</h4>
                  <p className="text-xs text-green-600 mt-0.5">
                    This scenario is ready for LP simulation. {Object.values(scenario.stakeholder_seed || {}).flat().length} stakeholders identified.
                  </p>
                </div>
                <button
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                  onClick={() => {
                    if (scenario.scenario_id && onRunSimulation) {
                      onRunSimulation(scenario.scenario_id)
                    }
                  }}
                >
                  <Play className="w-3 h-3" />
                  Run Simulation
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
