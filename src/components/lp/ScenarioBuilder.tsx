'use client'

import { useState, useEffect, useMemo } from 'react'
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
  Lightbulb,
  Scale,
  Zap,
  Globe2,
  ArrowRightLeft,
  Database,
  Search,
  Plus,
  X,
  Check,
  Landmark,
  Newspaper,
  TreePine,
  GraduationCap,
  Factory
} from 'lucide-react'
import { ENTITY_DATABASE, formatEntityName } from './entityDatabase'

// Types matching the backend
type TriggerSource = 'internal' | 'external'

type ScenarioType =
  // Internal actions
  | 'product_launch'
  | 'merger_acquisition'
  | 'market_entry'
  | 'policy_change'
  | 'crisis_response'
  | 'competitive_response'
  | 'leadership_change'
  | 'strategic_initiative'
  | 'expansion'
  // External triggers
  | 'regulatory_change'
  | 'market_disruption'
  | 'geopolitical_event'
  | 'stakeholder_move'
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
  trigger_source?: TriggerSource
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
    trigger_source_actor?: string
    trigger_description?: string
    impact_hypothesis?: string[]
    probability?: 'confirmed' | 'likely' | 'possible' | 'speculative'
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
  // External trigger types
  regulatory_change: {
    label: 'New Regulation',
    icon: Scale,
    description: 'New legislation, regulatory ruling, or compliance mandate'
  },
  market_disruption: {
    label: 'Market Disruption',
    icon: Zap,
    description: 'Technology shift, economic event, new entrant, or industry change'
  },
  geopolitical_event: {
    label: 'Geopolitical Event',
    icon: Globe2,
    description: 'Trade policy, sanctions, tariffs, or political development'
  },
  stakeholder_move: {
    label: 'Stakeholder Move',
    icon: ArrowRightLeft,
    description: 'Key customer, partner, investor, or supplier takes action'
  },
  custom: {
    label: 'Custom',
    icon: Lightbulb,
    description: 'Any scenario not covered by other categories'
  }
}

const EXTERNAL_TRIGGER_TYPES: ScenarioType[] = [
  'regulatory_change', 'market_disruption', 'geopolitical_event', 'stakeholder_move'
]

const INTERNAL_ACTION_TYPES: ScenarioType[] = [
  'product_launch', 'merger_acquisition', 'market_entry', 'policy_change',
  'crisis_response', 'competitive_response', 'leadership_change', 'strategic_initiative', 'expansion'
]

// Icon resolver for entity database groups
function getGroupIcon(iconName: string) {
  switch (iconName) {
    case 'landmark': return Landmark
    case 'newspaper': return Newspaper
    case 'lightbulb': return Lightbulb
    case 'scale': return Scale
    case 'tree': return TreePine
    case 'graduation': return GraduationCap
    case 'building': return Factory
    default: return Database
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
  const [scenarioMode, setScenarioMode] = useState<'internal' | 'external'>('internal')
  const [selectedExternalType, setSelectedExternalType] = useState<ScenarioType | null>(null)

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

  // Research context from PA seed (passed on submit)
  const [paResearchContext, setPaResearchContext] = useState<any>(null)

  // Entity database browser state
  const [showEntityBrowser, setShowEntityBrowser] = useState(false)
  const [entitySearch, setEntitySearch] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  // Existing scenarios
  const [existingScenarios, setExistingScenarios] = useState<ExistingScenario[]>([])
  const [loadingScenarios, setLoadingScenarios] = useState(false)

  // Check for pre-populated seed from Public Affairs simulation
  // Just populate the form — don't auto-submit, let user review and click start
  useEffect(() => {
    try {
      const seedStr = sessionStorage.getItem('pa_simulation_seed')
      if (seedStr) {
        sessionStorage.removeItem('pa_simulation_seed')
        const seed = JSON.parse(seedStr)
        const description = seed.action?.what
          ? seed.action.what + (seed.action.rationale?.[0] ? ` — ${seed.action.rationale[0]}` : '')
          : ''

        if (description) {
          setInitialDescription(description)
          // PA research reports are external events ("If X happens"), not internal actions
          setScenarioMode('external')
          if (seed.type) setDetectedType(seed.type as ScenarioType)
          // Store research context for when user submits
          if (seed.research_context) {
            setPaResearchContext(seed.research_context)
          }
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
          initial_description: initialDescription.trim(),
          ...(selectedExternalType ? { scenario_type_hint: selectedExternalType } : {}),
          ...(paResearchContext ? { research_context: paResearchContext } : {})
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
    setSelectedExternalType(null)
  }

  // Add entity to stakeholder_seed (uses 'ecosystem' as default category for DB entities)
  const addEntityToStakeholders = (name: string, category: string = 'ecosystem') => {
    if (!scenario) return
    const seed = { ...(scenario.stakeholder_seed || {}) }
    // Map entity database groups to stakeholder categories
    const catKey = mapGroupToCategory(category)
    if (!seed[catKey]) seed[catKey] = []
    if (!(seed[catKey] as string[]).includes(name)) {
      seed[catKey] = [...(seed[catKey] as string[]), name]
    }
    setScenario({ ...scenario, stakeholder_seed: seed })
  }

  const removeEntityFromStakeholders = (name: string) => {
    if (!scenario) return
    const seed = { ...(scenario.stakeholder_seed || {}) }
    for (const key of Object.keys(seed)) {
      seed[key as StakeholderCategory] = (seed[key as StakeholderCategory] as string[]).filter(e => e !== name)
      if ((seed[key as StakeholderCategory] as string[]).length === 0) delete seed[key as StakeholderCategory]
    }
    setScenario({ ...scenario, stakeholder_seed: seed })
  }

  const addCategoryToStakeholders = (entities: string[], groupKey: string) => {
    if (!scenario) return
    const seed = { ...(scenario.stakeholder_seed || {}) }
    const catKey = mapGroupToCategory(groupKey)
    const existing = new Set((seed[catKey] as string[]) || [])
    for (const name of entities) existing.add(name)
    seed[catKey] = Array.from(existing)
    setScenario({ ...scenario, stakeholder_seed: seed })
  }

  // Map entity database group names to StakeholderCategory
  function mapGroupToCategory(group: string): StakeholderCategory {
    if (group.includes('journalist') || group.includes('media_outlet')) return 'media'
    if (group.includes('government') || group.includes('congress') || group.includes('regulator')) return 'regulators'
    if (group.includes('advocacy') || group.includes('environmental')) return 'ecosystem'
    if (group.includes('think_tank') || group.includes('academic')) return 'analysts'
    if (group.includes('executive') || group.includes('influencer')) return 'ecosystem'
    if (group.includes('finance') || group.includes('venture')) return 'investors'
    return 'ecosystem'
  }

  // All stakeholder names currently in the scenario (for highlighting)
  const allStakeholderNames = useMemo(() => {
    const names = new Set<string>()
    if (scenario?.stakeholder_seed) {
      for (const entities of Object.values(scenario.stakeholder_seed)) {
        for (const e of (entities as string[])) names.add(e)
      }
    }
    return names
  }, [scenario?.stakeholder_seed])

  // Filtered entity database based on search
  const filteredEntityDB = useMemo(() => {
    if (!entitySearch.trim()) return ENTITY_DATABASE
    const q = entitySearch.toLowerCase()
    const result: typeof ENTITY_DATABASE = {}
    for (const [groupKey, group] of Object.entries(ENTITY_DATABASE)) {
      const filteredCats: Record<string, string[]> = {}
      for (const [catKey, entities] of Object.entries(group.categories)) {
        const matches = entities.filter(e => e.toLowerCase().includes(q))
        if (matches.length > 0) filteredCats[catKey] = matches
      }
      if (Object.keys(filteredCats).length > 0) {
        result[groupKey] = { ...group, categories: filteredCats }
      }
    }
    return result
  }, [entitySearch])

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
          <h2 className="font-semibold" style={{ fontSize: '1.125rem', color: 'var(--charcoal)' }}>LP Scenario Builder</h2>
          <p className="text-sm text-gray-500">
            Model internal actions or external triggers for LP simulation
          </p>
        </div>
      </div>

      {/* Org context */}
      <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
        <Building2 className="w-4 h-4" />
        <span>Org: <strong className="text-[var(--charcoal)]">{organization?.name || 'None selected'}</strong></span>
      </div>


      {/* New scenario input */}
      {!scenario && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          {/* Scenario mode tabs */}
          <div className="flex gap-1 p-0.5 bg-gray-100 rounded-lg">
            <button
              onClick={() => setScenarioMode('internal')}
              className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                scenarioMode === 'internal'
                  ? 'bg-white text-[var(--charcoal)] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <Rocket className="w-3 h-3" />
                We are doing...
              </span>
            </button>
            <button
              onClick={() => setScenarioMode('external')}
              className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                scenarioMode === 'external'
                  ? 'bg-white text-[var(--charcoal)] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <Zap className="w-3 h-3" />
                If X happens...
              </span>
            </button>
          </div>

          {/* Quick type selector for external triggers */}
          {scenarioMode === 'external' && (
            <div className="grid grid-cols-2 gap-1.5">
              {EXTERNAL_TRIGGER_TYPES.map(type => {
                const info = TYPE_INFO[type]
                const Icon = info.icon
                return (
                  <button
                    key={type}
                    onClick={() => setSelectedExternalType(selectedExternalType === type ? null : type)}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-left transition-colors ${
                      selectedExternalType === type
                        ? 'border-[var(--burnt-orange)] bg-[var(--burnt-orange)]/5'
                        : 'border-gray-150 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${selectedExternalType === type ? 'text-[var(--burnt-orange)]' : 'text-gray-400'}`} />
                    <div>
                      <p className="text-xs font-medium text-[var(--charcoal)]">{info.label}</p>
                      <p className="text-[10px] text-gray-400 leading-tight">{info.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          <textarea
            value={initialDescription}
            onChange={e => setInitialDescription(e.target.value)}
            placeholder={scenarioMode === 'external'
              ? "Describe the external event or trigger... e.g.,\n• 'New EU AI Act compliance requirements take effect'\n• 'Major competitor just got acquired by a tech giant'\n• 'New tariffs on imports from key supplier countries'\n• 'Our largest customer is evaluating switching to a competitor'"
              : "Describe what your org is doing... e.g.,\n• 'We're hiring a former Google VP as our new CTO'\n• 'We're expanding into Southeast Asia'\n• 'We're announcing a strategic pivot toward enterprise AI'\n• 'We need to respond to a competitor's acquisition'"
            }
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
                {scenarioMode === 'external' ? 'Analyze Impact' : 'Start Building'}
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
                  {scenario.trigger_source === 'external' && (
                    <span className="px-1.5 py-0.5 text-[10px] rounded bg-blue-100 text-blue-700">
                      External Trigger
                    </span>
                  )}
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
          {nextQuestion && phase === 'probing' && !loading && (
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
                  disabled={!userResponse.trim()}
                  className="px-3 py-1.5 bg-[var(--burnt-orange)] hover:bg-[var(--terracotta)] disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3 h-3" />
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Loading state during probing */}
          {loading && phase === 'probing' && (
            <div className="bg-[var(--burnt-orange)]/5 rounded-xl border border-[var(--burnt-orange)]/20 p-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-[var(--burnt-orange)]" />
                <p className="text-sm text-[var(--charcoal)]">
                  Finalizing scenario and identifying stakeholders...
                </p>
              </div>
            </div>
          )}

          {/* Scenario details */}
          <div className="space-y-2">
            <Section
              id="action"
              icon={scenario.trigger_source === 'external' ? Zap : Target}
              title={scenario.trigger_source === 'external' ? 'External Trigger' : 'Action'}
              badge={scenario.action?.what ? '✓' : undefined}
            >
              <div className="space-y-2 text-gray-600">
                {scenario.trigger_source === 'external' ? (
                  <>
                    <p><strong>Event:</strong> {scenario.action?.trigger_description || scenario.action?.what || 'Not defined'}</p>
                    {scenario.action?.trigger_source_actor && (
                      <p><strong>Source/Actor:</strong> {scenario.action.trigger_source_actor}</p>
                    )}
                    {scenario.action?.probability && (
                      <p><strong>Likelihood:</strong> <span className={`inline-block px-1.5 py-0.5 text-xs rounded ${
                        scenario.action.probability === 'confirmed' ? 'bg-green-100 text-green-700' :
                        scenario.action.probability === 'likely' ? 'bg-blue-100 text-blue-700' :
                        scenario.action.probability === 'possible' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{scenario.action.probability}</span></p>
                    )}
                    {(scenario.action?.impact_hypothesis?.length ?? 0) > 0 && (
                      <div>
                        <strong>Impact Hypothesis:</strong>
                        <ul className="list-disc list-inside ml-2">
                          {scenario.action!.impact_hypothesis!.map((h, i) => <li key={i}>{h}</li>)}
                        </ul>
                      </div>
                    )}
                    {(scenario.action?.rationale?.length ?? 0) > 0 && (
                      <div>
                        <strong>Response Options:</strong>
                        <ul className="list-disc list-inside ml-2">
                          {scenario.action!.rationale!.map((c, i) => <li key={i}>{c}</li>)}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <>
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
                  </>
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
              {/* Current stakeholders with remove buttons */}
              {Object.keys(scenario.stakeholder_seed || {}).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(scenario.stakeholder_seed || {}).map(([category, entities]) => (
                    <div key={category}>
                      <strong className="text-[var(--charcoal)] capitalize">{category}:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(entities as string[]).map((e, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded group">
                            {e}
                            <button
                              onClick={() => removeEntityFromStakeholders(e)}
                              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                              title="Remove"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 italic">No stakeholders yet — add from the entity database below</p>
              )}

              {/* Add from Entity Database button */}
              <button
                onClick={() => setShowEntityBrowser(!showEntityBrowser)}
                className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-[var(--burnt-orange)] hover:text-[var(--burnt-orange)] transition-colors"
              >
                <Database className="w-3.5 h-3.5" />
                {showEntityBrowser ? 'Hide Entity Database' : 'Add from Entity Database'}
              </button>

              {/* Entity Database Browser */}
              {showEntityBrowser && (
                <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
                  {/* Search */}
                  <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        type="text"
                        value={entitySearch}
                        onChange={e => setEntitySearch(e.target.value)}
                        placeholder="Search entities..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--burnt-orange)]"
                      />
                    </div>
                  </div>

                  {/* Groups */}
                  <div className="max-h-64 overflow-y-auto">
                    {Object.entries(filteredEntityDB).map(([groupKey, group]) => {
                      const GroupIcon = getGroupIcon(group.icon)
                      const isExpanded = expandedGroups.has(groupKey) || entitySearch.trim().length > 0
                      const totalInGroup = Object.values(group.categories).flat().length
                      const selectedInGroup = Object.values(group.categories).flat().filter(e => allStakeholderNames.has(e)).length

                      return (
                        <div key={groupKey} className="border-b border-gray-100 last:border-0">
                          <button
                            onClick={() => {
                              const next = new Set(expandedGroups)
                              if (next.has(groupKey)) next.delete(groupKey)
                              else next.add(groupKey)
                              setExpandedGroups(next)
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 transition-colors text-left"
                          >
                            {isExpanded ? <ChevronDown className="w-3 h-3 text-gray-400" /> : <ChevronRight className="w-3 h-3 text-gray-400" />}
                            <GroupIcon className="w-3.5 h-3.5 text-[var(--burnt-orange)]" />
                            <span className="text-xs font-medium text-gray-800 flex-1">{formatEntityName(groupKey)}</span>
                            {selectedInGroup > 0 && (
                              <span className="text-[10px] text-[var(--burnt-orange)]">{selectedInGroup}/{totalInGroup}</span>
                            )}
                          </button>

                          {isExpanded && (
                            <div className="pl-8 pr-3 pb-2 space-y-2">
                              {Object.entries(group.categories).map(([catKey, entities]) => {
                                const allSelected = entities.every(e => allStakeholderNames.has(e))
                                return (
                                  <div key={catKey}>
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                                        {formatEntityName(catKey)}
                                      </span>
                                      <button
                                        onClick={() => addCategoryToStakeholders(entities, groupKey)}
                                        className={`text-[10px] flex items-center gap-0.5 ${
                                          allSelected
                                            ? 'text-green-600'
                                            : 'text-[var(--burnt-orange)] hover:underline'
                                        }`}
                                        disabled={allSelected}
                                      >
                                        {allSelected ? (
                                          <><Check className="w-2.5 h-2.5" /> All added</>
                                        ) : (
                                          <><Plus className="w-2.5 h-2.5" /> Add all</>
                                        )}
                                      </button>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {entities.map(name => {
                                        const isSelected = allStakeholderNames.has(name)
                                        return (
                                          <button
                                            key={name}
                                            onClick={() => isSelected ? removeEntityFromStakeholders(name) : addEntityToStakeholders(name, groupKey)}
                                            className={`px-1.5 py-0.5 text-[11px] rounded transition-colors ${
                                              isSelected
                                                ? 'bg-[var(--burnt-orange)] text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                          >
                                            {name}
                                          </button>
                                        )
                                      })}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
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
                  <Users className="w-3 h-3" />
                  Select Entities &amp; Run
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
