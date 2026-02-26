'use client'

import React, { useState, useEffect } from 'react'
import { Zap, Target, Brain, Users, TrendingUp, AlertTriangle, Sparkles, Save, Network, Shield, MessageSquare, Info, FileText, BookOpen, ChevronRight, Lightbulb, Share2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAppStore } from '@/stores/useAppStore'
import NIVPanel from '@/components/niv/NIVPanel'

interface CampaignObjective {
  objective: string
  targetAudience: string[]
  currentPosition: string
  desiredPosition: string
  timeline: string
  teamCapacity: string
  competitorActions: string
  differentiation: string
  psychology: string[]
}

interface PatternRecommendation {
  pattern: 'cascade' | 'void' | 'mirror' | 'trojan' | 'network' | 'chorus'
  patternName: string
  confidence: number
  rationale: {
    why_this_pattern: string
    why_not_traditional: string
    competitive_advantage: string
  }
  strategic_approach: {
    core_thesis: string
    invisibility_principle: string
    convergence_point: string
  }
  comparison: {
    traditional_cost: string
    traditional_timeline: string
    traditional_success_rate: string
    ai_powered_cost: string
    ai_powered_timeline: string
    ai_powered_success_rate: string
  }
}

interface CampaignBlueprint {
  campaign_name: string
  pattern_type: string
  phases: Phase[]
  auto_executable_count: number
  semi_auto_count: number
  manual_count: number
  total_effort: string
  estimated_cost: string
}

interface Phase {
  phase_number: number
  phase_name: string
  duration: string
  objective: string
  tactics: Tactic[]
}

interface Tactic {
  tactic_name: string
  execution_type: 'auto' | 'semi' | 'manual'
  description: string
  effort: string
}

// V4 Blueprint interfaces from NIV
interface V4Blueprint {
  pattern: string
  strategy?: {
    objective?: string
    narrative?: string
    keyMessages?: string[]
  }
  vectors?: Array<{
    stakeholder_group: string
    message?: string
    channels?: string[]
  }>
  timeline?: {
    total_duration?: string
    convergence_date?: string
  }
  contentStrategy?: {
    autoExecutableContent?: {
      contentTypes?: string[]
      totalPieces?: number
    }
  }
  executionPlan?: {
    phases?: Array<{
      phase: string
      duration: string
      activities: string[]
    }>
  }
}

interface StrategicCampaignPlannerProps {
  nivBlueprint?: V4Blueprint | null
}

export default function StrategicCampaignPlanner({ nivBlueprint }: StrategicCampaignPlannerProps) {
  const { organization } = useAppStore()
  const currentOrgId = organization?.id

  const [activeTab, setActiveTab] = useState<'capabilities' | 'builder' | 'prompts'>('capabilities')
  const [step, setStep] = useState<'intake' | 'analysis' | 'blueprint' | 'execution'>('intake')
  const [v4Mode, setV4Mode] = useState(false)
  const [v4BlueprintData, setV4BlueprintData] = useState<V4Blueprint | null>(null)
  const [objective, setObjective] = useState<CampaignObjective>({
    objective: '',
    targetAudience: [],
    currentPosition: '',
    desiredPosition: '',
    timeline: '3-months',
    teamCapacity: '2-people-10hrs',
    competitorActions: '',
    differentiation: '',
    psychology: []
  })
  const [recommendation, setRecommendation] = useState<PatternRecommendation | null>(null)
  const [blueprint, setBlueprint] = useState<CampaignBlueprint | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [generatingBlueprint, setGeneratingBlueprint] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generatingContent, setGeneratingContent] = useState(false)
  const [contentProgress, setContentProgress] = useState({ current: 0, total: 0 })

  // When NIV blueprint is provided, switch to V4 mode
  useEffect(() => {
    if (nivBlueprint) {
      console.log('NIV V4 Blueprint received:', nivBlueprint)
      setV4BlueprintData(nivBlueprint)
      setV4Mode(true)
      setStep('blueprint')
    }
  }, [nivBlueprint])

  const audienceOptions = [
    'Media/Journalists',
    'Industry Analysts',
    'Community/Grassroots',
    'Policymakers/Regulators',
    'Business Decision-Makers',
    'Creative Professionals',
    'Technical Communities',
    'General Public'
  ]

  const psychologyOptions = [
    'Skeptical of corporate messaging',
    'Trust peer discovery over announcements',
    'Seek safety after crises',
    'Learn through experience',
    'Follow influencer recommendations',
    'Value authenticity over polish',
    'Filter out traditional marketing',
    'Respond to scarcity/exclusivity'
  ]

  const handleAnalyze = async () => {
    setAnalyzing(true)

    try {
      // Call Claude to analyze objective and recommend pattern
      const response = await fetch('/api/claude-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Analyze this PR objective and recommend a psychological influence pattern:

OBJECTIVE: ${objective.objective}

TARGET AUDIENCE: ${objective.targetAudience.join(', ')}
CURRENT POSITION: ${objective.currentPosition}
DESIRED POSITION: ${objective.desiredPosition}
TIMELINE: ${objective.timeline}
TEAM CAPACITY: ${objective.teamCapacity}
COMPETITOR ACTIONS: ${objective.competitorActions}
DIFFERENTIATION: ${objective.differentiation}
PSYCHOLOGY: ${objective.psychology.join(', ')}

Available PR patterns (NOT marketing):
1. CASCADE - Plant seeds in niche communities that converge into organic discovery (psychology: discovery beats announcement)
2. VOID - Strategic silence when competitors/media expect response, curiosity peaks, then perfectly-timed reveal (psychology: absence > presence)
3. MIRROR - Pre-position as safe choice before predictable crisis/event (psychology: safety-seeking after turbulence)
4. TROJAN - Hide messaging in desired experience (contests, tools, resources they want) (psychology: learning through participation)
5. NETWORK - Map influence networks, penetrate at accessible nodes, message travels upward (psychology: indirect trust > direct pitch)

Focus on:
- PR/communications domain (NOT business strategy)
- Psychological influence (NOT marketing tactics)
- Media/journalist/analyst relationships (NOT customer acquisition)
- Multi-layered orchestration (visible track + invisible track)
- Narrative ownership (NOT product promotion)

Return JSON with:
{
  "pattern": "cascade|void|mirror|trojan|network",
  "patternName": "CASCADE Pattern" | "VOID Strategy" etc,
  "confidence": 0-100,
  "rationale": {
    "why_this_pattern": "Explain psychological trigger and why it works for THIS audience",
    "why_not_traditional": "Why traditional PR (press releases, pitches, announcements) won't work",
    "competitive_advantage": "How this creates narrative ownership competitors can't replicate"
  },
  "strategic_approach": {
    "core_thesis": "One sentence psychological thesis (e.g., 'Make them discover you as their champion')",
    "invisibility_principle": "How the campaign stays invisible/organic (not marketing)",
    "convergence_point": "When/how pattern reveals itself (media coverage, analyst mentions, community realization)"
  },
  "comparison": {
    "traditional_cost": "$100K+",
    "traditional_timeline": "6+ months",
    "traditional_success_rate": "20%",
    "ai_powered_cost": "$25K-40K",
    "ai_powered_timeline": "5-8 weeks",
    "ai_powered_success_rate": "60-75%"
  }
}`
          }],
          system: `You are an expert in psychological PR influence patterns. NOT marketing. NOT business strategy. Focus on:

- Media/press relationships and narrative control
- Grassroots influence and organic discovery
- Psychological triggers (trust, curiosity, safety-seeking, discovery)
- Multi-layered orchestration (what media sees vs. what actually drives narrative)
- Indirect influence networks (journalists trust analysts who read researchers)

Traditional PR: broadcast message, hope it sticks
Psychological PR: engineer pattern where they discover/trust you organically

Be sophisticated. Be PR-specific. Think influence networks, not marketing funnels.`,
          max_tokens: 2000,
          temperature: 0.7
        })
      })

      const data = await response.json()

      if (data.content) {
        // Extract JSON from response
        const jsonMatch = data.content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const recommendationData = JSON.parse(jsonMatch[0])
          setRecommendation(recommendationData)
          setStep('analysis')
        }
      }
    } catch (error) {
      console.error('Analysis error:', error)
      alert('Failed to analyze objective. Please try again.')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleGenerateBlueprint = async () => {
    if (!recommendation) return

    setGeneratingBlueprint(true)

    try {
      // Call niv-campaign-orchestrator to generate V4 blueprint
      const response = await fetch('/api/niv-campaign-orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pattern: recommendation.pattern,
          concept: {
            goal: objective.objective,
            audience: objective.targetAudience.join(', '),
            timeline: objective.timeline,
            organizationId: currentOrgId || '1'
          },
          knowledge: {
            strategic_approach: recommendation.strategic_approach,
            vectors: recommendation.vectors || [],
            content_triggers: recommendation.content_triggers || []
          },
          organizationId: currentOrgId || '1'
        })
      })

      const data = await response.json()

      if (data.blueprint) {
        setBlueprint(data.blueprint)
        setV4BlueprintData(data.blueprint)
        setV4Mode(true)
        setStep('blueprint')
      } else if (data.content) {
        // Fallback: parse old Claude-direct format
        const jsonMatch = data.content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const blueprintData = JSON.parse(jsonMatch[0])
          setBlueprint(blueprintData)
          setStep('blueprint')
        }
      }
    } catch (error) {
      console.error('Blueprint generation error:', error)

      // Fallback to old Claude-direct approach if campaign orchestrator fails
      try {
        console.log('Falling back to Claude-direct...')
        const fallbackResponse = await fetch('/api/claude-direct', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{
              role: 'user',
              content: `Generate a detailed ${recommendation.pattern.toUpperCase()} PR campaign blueprint:

OBJECTIVE: ${objective.objective}
TARGET: ${objective.targetAudience.join(', ')}
TIMELINE: ${objective.timeline}
PATTERN: ${recommendation.pattern.toUpperCase()}

STRATEGIC THESIS:
${recommendation.strategic_approach.core_thesis}

INVISIBILITY PRINCIPLE:
${recommendation.strategic_approach.invisibility_principle}

CONVERGENCE POINT:
${recommendation.strategic_approach.convergence_point}

Generate 4-6 week phased campaign focused on PR/media influence:

Phase structure for ${recommendation.pattern.toUpperCase()}:
${recommendation.pattern === 'cascade' ? `
- Phase 1-2: SEED - Plant in niche communities/forums (invisible)
- Phase 3-4: CONVERGENCE - Monitor pattern emergence, amplify organically
- Phase 5-6: REVELATION - Media covers "discovery", position as organic movement
` : recommendation.pattern === 'void' ? `
- Phase 1-2: MONITOR - Track competitor actions, expectation windows
- Phase 3-4: SILENCE - Strategic void, monitor speculation velocity
- Phase 5-6: ENTRY - Perfectly-timed reveal when curiosity peaks
` : recommendation.pattern === 'mirror' ? `
- Phase 1-2: PREDICT - Analyze crisis patterns, pre-position safety message
- Phase 3-4: POSITION - Establish credentials, third-party validation
- Phase 5-6: MIRROR - Crisis hits, you're the safe alternative
` : recommendation.pattern === 'trojan' ? `
- Phase 1-2: DESIGN - Create desired experience (contest, tool, resource)
- Phase 3-4: ENGAGE - Launch, participation embeds messaging
- Phase 5-6: HARVEST - Media covers participation, message is learned organically
` : `
- Phase 1-2: MAP - Identify influence network nodes (who influences who)
- Phase 3-4: PENETRATE - Access entry points (researchers, bloggers)
- Phase 5-6: ASCEND - Message travels up network to target (analysts, media)
`}

For each tactic, classify as:
- AUTO: SignalDesk generates (thought leadership articles, media pitches, social posts, press releases, media lists, talking points)
- SEMI: We generate template, you customize/execute (journalist outreach emails, partnership proposals, event scripts)
- MANUAL: You must do directly (meetings, calls, relationship-building, offline networking)

Focus on PR tactics:
- Media outreach (pitching, relationship-building)
- Community seeding (forums, Reddit, Discord - organic)
- Analyst positioning (research briefs, whitepapers)
- Thought leadership (bylines, contributed articles)
- Media list building (journalist identification)
- Crisis monitoring (if relevant)

NOT marketing tactics (ads, conversion optimization, lead gen)

Return JSON with:
{
  "campaign_name": "Creative PR-focused name (e.g., 'Creative Champion Discovery', 'Strategic Silence Initiative')",
  "pattern_type": "${recommendation.pattern}",
  "phases": [
    {
      "phase_number": 1,
      "phase_name": "Week 1-2: Phase Name",
      "duration": "2 weeks",
      "objective": "Specific PR goal (e.g., 'Seed in 15 creator forums', 'Pre-position safety narrative')",
      "tactics": [
        {
          "tactic_name": "Specific PR tactic (e.g., 'Community-specific thought leadership', 'Media list: AI safety reporters')",
          "execution_type": "auto|semi|manual",
          "description": "What this PR tactic achieves",
          "effort": "X hours"
        }
      ]
    }
  ],
  "auto_executable_count": 12,
  "semi_auto_count": 5,
  "manual_count": 8,
  "total_effort": "80 hours over 6 weeks",
  "estimated_cost": "$25K-$40K"
}`
          }],
          system: `You are an expert PR campaign architect specializing in psychological influence patterns. NOT marketing campaigns.

Focus on:
- Media/journalist relationships and outreach
- Organic community influence (seed planting, grassroots)
- Analyst/influencer positioning
- Narrative control and timing
- Multi-track orchestration (visible PR track + invisible influence track)

Auto-executable PR content types:
- Thought leadership articles
- Press releases
- Media pitches
- Media lists (journalist identification)
- Talking points / messaging docs
- Social posts (PR amplification, not marketing)
- Case studies (for media/analyst consumption)

Semi-auto PR tactics:
- Journalist outreach email templates
- Partnership/collaboration proposals
- Event speaking scripts
- Media interview prep
- Crisis response frameworks

Manual PR actions:
- Relationship-building calls/meetings
- Media interviews (execution)
- Conference networking
- Crisis response (real-time)
- Negotiating exclusives

Think PR campaigns. Think narrative ownership. NOT marketing funnels.`,
            max_tokens: 3000,
            temperature: 0.7
          })
        })

        const fallbackData = await fallbackResponse.json()

        if (fallbackData.content) {
          const jsonMatch = fallbackData.content.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const blueprintData = JSON.parse(jsonMatch[0])
            setBlueprint(blueprintData)
            setStep('blueprint')
          }
        }
      } catch (fallbackError) {
        console.error('Fallback blueprint generation also failed:', fallbackError)
        alert('Failed to generate blueprint. Please try again.')
      }
    } finally {
      setGeneratingBlueprint(false)
    }
  }

  const handleSaveCampaign = async () => {
    if (!blueprint || !recommendation || !currentOrgId) {
      alert('Missing campaign data or organization')
      return
    }

    setSaving(true)

    try {
      // Calculate campaign stats
      const totalPhases = blueprint.phases?.length || 0
      const autoContent = blueprint.phases?.reduce((sum, phase) =>
        sum + phase.tactics.filter(t => t.execution_type === 'auto').length, 0
      ) || 0

      // Save to Supabase campaigns table
      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          organization_id: currentOrgId,
          campaign_name: blueprint.campaign_name,
          campaign_description: objective.objective,
          objective: objective,
          pattern_recommendation: recommendation,
          blueprint: blueprint,
          status: 'draft',
          total_phases: totalPhases,
          content_total: autoContent,
          tags: [recommendation.pattern, ...objective.targetAudience],
          folder: `Campaigns/${recommendation.pattern.toUpperCase()}`
        })
        .select()
        .single()

      if (error) throw error

      console.log('Campaign saved:', data)

      // Show success notification
      const event = new CustomEvent('showNotification', {
        detail: {
          message: `Campaign "${blueprint.campaign_name}" saved successfully`,
          type: 'success'
        }
      })
      window.dispatchEvent(event)

      // Also save to Memory Vault for content library
      await fetch('/api/memory-vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: currentOrgId,
          content_type: 'campaign',
          content: {
            campaign_id: data.id,
            campaign_name: blueprint.campaign_name,
            pattern: recommendation.pattern,
            objective: objective,
            recommendation: recommendation,
            blueprint: blueprint
          },
          metadata: {
            folder: `Campaigns/${recommendation.pattern.toUpperCase()}`,
            campaign_name: blueprint.campaign_name,
            pattern: recommendation.pattern,
            auto_executable_count: autoContent
          },
          tags: [recommendation.pattern, 'campaign', ...objective.targetAudience]
        })
      })

    } catch (error) {
      console.error('Save campaign error:', error)
      alert('Failed to save campaign. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateAllContent = async () => {
    if (!blueprint || !recommendation || !currentOrgId) {
      alert('Missing campaign data or organization')
      return
    }

    setGeneratingContent(true)

    try {
      // Extract all auto-executable tactics from blueprint
      const autoTactics: Array<{phase: string, tactic: Tactic}> = []

      if (blueprint.phases && Array.isArray(blueprint.phases)) {
        blueprint.phases.forEach(phase => {
          phase.tactics
            .filter(t => t.execution_type === 'auto')
            .forEach(tactic => {
              autoTactics.push({ phase: phase.phase_name, tactic })
            })
        })
      }

      if (autoTactics.length === 0) {
        alert('No auto-executable content found in blueprint')
        return
      }

      setContentProgress({ current: 0, total: autoTactics.length })

      // Create folder for this campaign
      const folderName = blueprint.campaign_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .substring(0, 50)
      const campaignFolder = `campaigns/${recommendation.pattern}/${folderName}`

      console.log(`🚀 Generating ${autoTactics.length} content pieces for campaign: ${blueprint.campaign_name}`)

      // Transform campaign data into strategy format niv-content-intelligent-v2 expects
      const transformedStrategy = {
        subject: blueprint.campaign_name,
        narrative: recommendation.strategic_approach.core_thesis,
        key_messages: [
          recommendation.rationale.why_this_pattern,
          recommendation.strategic_approach.invisibility_principle,
          recommendation.strategic_approach.convergence_point
        ],
        target_audiences: objective.targetAudience,
        media_targets: {
          tier_1_targets: objective.targetAudience.slice(0, 2),
          tier_2_targets: objective.targetAudience.slice(2, 4),
          tier_3_targets: objective.targetAudience.slice(4)
        },
        timeline: {
          immediate: blueprint.phases?.slice(0, 2).map(p => p.objective) || [],
          short_term: blueprint.phases?.slice(2, 4).map(p => p.objective) || [],
          long_term: blueprint.phases?.slice(4).map(p => p.objective) || []
        },
        chosen_approach: recommendation.pattern,

        // Pass full campaign context
        fullCampaign: {
          pattern: recommendation.pattern,
          objective: objective,
          recommendation: recommendation,
          blueprint: blueprint
        },

        proof_points: [objective.differentiation],
        rationale: recommendation.rationale.competitive_advantage
      }

      const generatedContent: any[] = []
      const errors: any[] = []

      // Generate each piece of content
      for (let i = 0; i < autoTactics.length; i++) {
        const { phase, tactic } = autoTactics[i]
        setContentProgress({ current: i + 1, total: autoTactics.length })

        try {
          console.log(`📝 Generating ${tactic.tactic_name}...`)

          // Map tactic name to content type
          const contentType = mapTacticToContentType(tactic.tactic_name)

          const response = await fetch('/api/supabase/functions/niv-content-intelligent-v2', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: `Generate ${tactic.tactic_name}: ${tactic.description}`,
              conversationHistory: [],
              organizationContext: {
                conversationId: `campaign-${Date.now()}-${contentType}`,
                organizationId: currentOrgId,
                organizationName: organization?.name || 'Organization'
              },

              preloadedStrategy: transformedStrategy,
              requestedContentType: contentType,
              autoExecute: true,
              saveFolder: campaignFolder,

              // Add campaign-specific context
              campaignContext: {
                phase: phase,
                pattern: recommendation.pattern,
                tacticDescription: tactic.description
              }
            })
          })

          const result = await response.json()

          if (result.success && result.content) {
            generatedContent.push({
              type: contentType,
              tactic: tactic.tactic_name,
              phase: phase,
              content: result.content
            })
            console.log(`✅ ${tactic.tactic_name} generated`)
          } else {
            throw new Error(result.error || 'Generation failed')
          }

        } catch (error: any) {
          console.error(`❌ Error generating ${tactic.tactic_name}:`, error)
          errors.push({
            tactic: tactic.tactic_name,
            error: error.message
          })
        }
      }

      console.log(`✅ Content generation complete: ${generatedContent.length}/${autoTactics.length} pieces generated`)

      // Show success notification
      const event = new CustomEvent('showNotification', {
        detail: {
          message: `Generated ${generatedContent.length} content pieces for ${blueprint.campaign_name}`,
          type: 'success'
        }
      })
      window.dispatchEvent(event)

      // Alert with summary
      alert(`Content Generation Complete!\n\n✅ ${generatedContent.length} pieces generated\n${errors.length > 0 ? `❌ ${errors.length} errors` : ''}\n\nContent saved to: ${campaignFolder}`)

    } catch (error) {
      console.error('Content generation error:', error)
      alert('Failed to generate content. Please try again.')
    } finally {
      setGeneratingContent(false)
      setContentProgress({ current: 0, total: 0 })
    }
  }

  // Map tactic names to content types
  const mapTacticToContentType = (tacticName: string): string => {
    const lower = tacticName.toLowerCase()

    if (lower.includes('press release')) return 'press-release'
    if (lower.includes('thought leadership') || lower.includes('blog') || lower.includes('article')) return 'thought-leadership'
    if (lower.includes('case study')) return 'case-study'
    if (lower.includes('media pitch') || lower.includes('pitch')) return 'media-pitch'
    if (lower.includes('media list') || lower.includes('journalist')) return 'media-list'
    if (lower.includes('social') || lower.includes('post')) return 'social-post'
    if (lower.includes('white paper')) return 'white-paper'
    if (lower.includes('infographic')) return 'infographic'
    if (lower.includes('talking points') || lower.includes('messaging')) return 'talking-points'
    if (lower.includes('email') || lower.includes('template')) return 'email-template'

    // Default to thought leadership
    return 'thought-leadership'
  }

  const getPatternIcon = (pattern: string) => {
    const patternLower = pattern.toLowerCase()
    switch (patternLower) {
      case 'cascade': return <TrendingUp className="w-6 h-6" />
      case 'void': return <AlertTriangle className="w-6 h-6" />
      case 'mirror': return <Target className="w-6 h-6" />
      case 'trojan': return <Sparkles className="w-6 h-6" />
      case 'network': return <Users className="w-6 h-6" />
      case 'chorus': return <MessageSquare className="w-6 h-6" />
      default: return <Zap className="w-6 h-6" />
    }
  }

  const handleExecuteV4Campaign = async () => {
    if (!v4BlueprintData || !currentOrgId) {
      alert('Missing campaign data or organization')
      return
    }

    setGeneratingContent(true)

    try {
      const totalPieces = v4BlueprintData.contentStrategy?.autoExecutableContent?.totalPieces || 0

      if (totalPieces === 0) {
        alert('No auto-executable content found in V4 blueprint')
        return
      }

      setContentProgress({ current: 0, total: totalPieces })

      // Call campaign-execution-orchestrator
      const response = await fetch('/api/supabase/functions/campaign-execution-orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blueprint: v4BlueprintData,
          organizationId: currentOrgId,
          organizationName: organization?.name || 'Organization',
          autoExecute: true
        })
      })

      if (!response.ok) {
        throw new Error(`Campaign execution error: ${response.status}`)
      }

      const result = await response.json()

      console.log('Campaign execution result:', result)

      // Extract results from response
      const successCount = result.execution?.content_pieces || result.execution?.content_generated || 0
      const savedCount = result.execution?.saved_to_vault || 0
      const failureCount = result.execution?.failures?.length || 0
      const totalGenerated = successCount + failureCount

      // Show success notification
      const event = new CustomEvent('showNotification', {
        detail: {
          message: `V4 Campaign completed - ${savedCount} pieces saved to Memory Vault`,
          type: successCount === totalGenerated ? 'success' : 'warning'
        }
      })
      window.dispatchEvent(event)

      // Build success message
      let message = `✅ V4 Campaign Execution Complete!\n\n`
      message += `Generated ${successCount} content pieces across ${v4BlueprintData.vectors?.length || 0} vectors using parallel orchestration.\n`
      message += `💾 ${savedCount} pieces saved to Memory Vault.\n\n`

      if (failureCount > 0) {
        message += `⚠️ ${failureCount} pieces failed to generate.\n\n`
      }

      message += `Open Memory Vault to view and edit your campaign content!`

      alert(message)

      // Automatically open Strategic Planning module with blueprint data
      console.log('📋 Opening Strategic Planning with execution inventory')
      const planEvent = new CustomEvent('addComponentToCanvas', {
        detail: {
          moduleId: 'plan',
          action: 'open',
          data: {
            blueprint: v4BlueprintData,
            sessionId: result.execution?.session_id || `session-${Date.now()}`,
            orgId: currentOrgId
          }
        }
      })
      window.dispatchEvent(planEvent)

    } catch (error) {
      console.error('V4 Campaign execution error:', error)
      alert('Failed to execute V4 campaign. Please try again.')
    } finally {
      setGeneratingContent(false)
      setContentProgress({ current: 0, total: 0 })
    }
  }

  return (
    <div className="flex h-full bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      {/* NIV Panel Sidebar - 45% width */}
      <div className="w-[45%] border-r border-purple-500/30 flex flex-col">
        <NIVPanel
          embedded={true}
          onCampaignGenerated={(blueprint) => {
            console.log('Campaign generated from embedded NIV:', blueprint)
            setV4BlueprintData(blueprint)
            setV4Mode(true)
            setStep('blueprint')
          }}
          onOpportunityDetected={(opportunities) => {
            console.log('Opportunities detected:', opportunities)
          }}
        />
      </div>

      {/* Main Campaign Planner Content - 60% width */}
      <div className="flex-1 flex flex-col">
        {/* Tab Navigation */}
        <div className="border-b border-gray-700 px-8 pt-6 pb-4 bg-gray-900/50">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold">Campaign Planner</h2>
          </div>

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
              onClick={() => setActiveTab('builder')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'builder'
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
              }`}
            >
              <FileText className="w-4 h-4" />
              Campaign Builder
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

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* NIV Capabilities Tab */}
          {activeTab === 'capabilities' && (
            <div className="max-w-4xl space-y-6">
              <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl p-6 border border-purple-500/20">
                <h3 className="text-2xl font-bold mb-4 text-purple-400">NIV V4: Your Campaign Strategy Engine</h3>
                <p className="text-gray-300 mb-6">
                  NIV V4 is your AI-powered campaign orchestration platform that transforms strategic objectives
                  into multi-vector campaign blueprints with auto-executable content strategies.
                </p>
              </div>

              <div className="grid gap-6">
                {/* V4 Campaign Patterns */}
                <div className="bg-gray-800/50 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Zap className="w-6 h-6 text-yellow-400" />
                    <h4 className="text-lg font-semibold">V4 Campaign Patterns</h4>
                  </div>
                  <ul className="space-y-3 text-gray-300">
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                      <span><strong>CASCADE:</strong> Viral spread campaigns that start with influence nodes and cascade outward</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                      <span><strong>MIRROR:</strong> Stakeholder-specific messaging that reflects their values and priorities</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                      <span><strong>CHORUS:</strong> Coordinated multi-channel campaigns with synchronized messaging</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                      <span><strong>TROJAN:</strong> Indirect influence through third-party validators and proxies</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                      <span><strong>NETWORK:</strong> Community-driven campaigns that leverage network effects</span>
                    </li>
                  </ul>
                </div>

                {/* Multi-Vector Strategy */}
                <div className="bg-gray-800/50 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Target className="w-6 h-6 text-purple-400" />
                    <h4 className="text-lg font-semibold">Multi-Vector Campaign Architecture</h4>
                  </div>
                  <ul className="space-y-3 text-gray-300">
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                      <span><strong>Stakeholder Vectors:</strong> Each campaign targets multiple stakeholder groups with tailored messaging</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                      <span><strong>Auto-Executable Content:</strong> Generates ready-to-publish content for each vector and channel</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                      <span><strong>Phased Execution:</strong> Provides day-by-day execution plans with milestones and success metrics</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                      <span><strong>Total-Spectrum Coverage:</strong> Coordinates across earned, owned, social, and paid media</span>
                    </li>
                  </ul>
                </div>

                {/* How to Use NIV V4 */}
                <div className="bg-gray-800/50 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Lightbulb className="w-6 h-6 text-yellow-400" />
                    <h4 className="text-lg font-semibold">How to Use NIV V4 Effectively</h4>
                  </div>
                  <div className="space-y-4 text-gray-300">
                    <div>
                      <h5 className="font-semibold text-yellow-400 mb-2">1. Chat with NIV (Left Sidebar)</h5>
                      <p>Tell NIV about your campaign goals in natural language. Be specific about objectives, audience, and timeline. NIV will recommend the best V4 pattern and generate a complete blueprint.</p>
                    </div>
                    <div>
                      <h5 className="font-semibold text-yellow-400 mb-2">2. Use Campaign Builder (This Tab)</h5>
                      <p>Fill out the structured form to define your objective, audience, and constraints. NIV will analyze your inputs and generate a pattern-based campaign blueprint.</p>
                    </div>
                    <div>
                      <h5 className="font-semibold text-yellow-400 mb-2">3. Review & Execute Blueprint</h5>
                      <p>NIV will show you the complete campaign blueprint with vectors, content strategy, and execution plan. Click "Execute V4 Campaign" to auto-generate all content pieces.</p>
                    </div>
                    <div>
                      <h5 className="font-semibold text-yellow-400 mb-2">4. Find Content in Memory Vault</h5>
                      <p>All generated content is stored in Memory Vault, organized by campaign, vector, and content type. Export and publish as needed.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Campaign Builder Tab */}
          {activeTab === 'builder' && (
            <div className="max-w-6xl mx-auto">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <Brain className="w-8 h-8 text-cyan-400" />
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    {v4Mode ? 'NIV V4 Campaign Blueprint' : 'Strategic Campaign Planner'}
                  </h1>
                </div>
                <p className="text-gray-400">
                  {v4Mode ? 'Multi-vector total-spectrum communications campaign' : 'AI-powered psychological influence campaigns for PR professionals'}
                </p>
              </div>

        {/* V4 Blueprint View */}
        {v4Mode && v4BlueprintData && (
          <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-xl rounded-lg border border-purple-500/30 p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              {getPatternIcon(v4BlueprintData.pattern)}
              <div>
                <h2 className="text-2xl font-bold text-purple-400">{v4BlueprintData.pattern.toUpperCase()} Pattern</h2>
                <p className="text-gray-400">Multi-Vector Campaign Blueprint</p>
              </div>
            </div>

            {/* Strategy Overview */}
            {v4BlueprintData.strategy && (
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold mb-3 text-purple-400">Strategic Narrative</h3>
                <div className="space-y-3 text-gray-300">
                  {v4BlueprintData.strategy.objective && (
                    <p><span className="font-medium text-white">Objective:</span> {v4BlueprintData.strategy.objective}</p>
                  )}
                  {v4BlueprintData.strategy.narrative && (
                    <p><span className="font-medium text-white">Narrative:</span> {v4BlueprintData.strategy.narrative}</p>
                  )}
                  {v4BlueprintData.strategy.keyMessages && v4BlueprintData.strategy.keyMessages.length > 0 && (
                    <div>
                      <span className="font-medium text-white">Key Messages:</span>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        {v4BlueprintData.strategy.keyMessages.map((msg, i) => (
                          <li key={i}>{msg}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Vectors */}
            {v4BlueprintData.vectors && v4BlueprintData.vectors.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  Stakeholder Vectors ({v4BlueprintData.vectors.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {v4BlueprintData.vectors.map((vector, idx) => (
                    <div key={idx} className="bg-gray-800/50 rounded-lg p-4 border border-purple-500/20">
                      <h4 className="font-semibold text-purple-300 mb-2">{vector.stakeholder_group}</h4>
                      {vector.message && (
                        <p className="text-sm text-gray-400 mb-2">{vector.message}</p>
                      )}
                      {vector.channels && vector.channels.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {vector.channels.map((channel, i) => (
                            <span key={i} className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded">
                              {channel}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline */}
            {v4BlueprintData.timeline && (
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold mb-2 text-cyan-400">Timeline</h3>
                <div className="grid grid-cols-2 gap-4 text-gray-300">
                  {v4BlueprintData.timeline.total_duration && (
                    <p><span className="font-medium text-white">Duration:</span> {v4BlueprintData.timeline.total_duration}</p>
                  )}
                  {v4BlueprintData.timeline.convergence_date && (
                    <p><span className="font-medium text-white">Convergence:</span> {v4BlueprintData.timeline.convergence_date}</p>
                  )}
                </div>
              </div>
            )}

            {/* Content Strategy */}
            {v4BlueprintData.contentStrategy?.autoExecutableContent && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold mb-3 text-green-400">Auto-Executable Content</h3>
                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-3xl font-bold text-green-400">
                      {v4BlueprintData.contentStrategy.autoExecutableContent.totalPieces || 0}
                    </div>
                    <div className="text-sm text-gray-400">Total Pieces</div>
                  </div>
                  {v4BlueprintData.contentStrategy.autoExecutableContent.contentTypes && (
                    <div className="flex-1">
                      <div className="text-sm text-gray-400 mb-2">Content Types:</div>
                      <div className="flex flex-wrap gap-2">
                        {v4BlueprintData.contentStrategy.autoExecutableContent.contentTypes.map((type, i) => (
                          <span key={i} className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded">
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Execution Plan Phases */}
            {v4BlueprintData.executionPlan?.phases && v4BlueprintData.executionPlan.phases.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-4">Execution Phases</h3>
                <div className="space-y-3">
                  {v4BlueprintData.executionPlan.phases.map((phase, idx) => (
                    <div key={idx} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-cyan-400">{phase.phase}</h4>
                        <span className="text-sm text-gray-400">{phase.duration}</span>
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                        {phase.activities.map((activity, i) => (
                          <li key={i}>{activity}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleExecuteV4Campaign}
                disabled={generatingContent}
                className="flex-1 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2"
              >
                {generatingContent ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Executing Campaign...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Execute V4 Campaign ({v4BlueprintData.contentStrategy?.autoExecutableContent?.totalPieces || 0} pieces)
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Progress Steps - Only show in non-V4 mode */}
        {!v4Mode && (
        <div className="flex items-center gap-4 mb-8">
          <div className={`flex items-center gap-2 ${step === 'intake' ? 'text-cyan-400' : step !== 'intake' ? 'text-green-400' : 'text-gray-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'intake' ? 'border-cyan-400 bg-cyan-400/20' : step !== 'intake' ? 'border-green-400 bg-green-400/20' : 'border-gray-600'}`}>
              1
            </div>
            <span className="font-medium">Objective</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-700"></div>
          <div className={`flex items-center gap-2 ${step === 'analysis' ? 'text-cyan-400' : step === 'blueprint' || step === 'execution' ? 'text-green-400' : 'text-gray-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'analysis' ? 'border-cyan-400 bg-cyan-400/20' : step === 'blueprint' || step === 'execution' ? 'border-green-400 bg-green-400/20' : 'border-gray-600'}`}>
              2
            </div>
            <span className="font-medium">Analysis</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-700"></div>
          <div className={`flex items-center gap-2 ${step === 'blueprint' || step === 'execution' ? 'text-cyan-400' : 'text-gray-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 'blueprint' || step === 'execution' ? 'border-cyan-400 bg-cyan-400/20' : 'border-gray-600'}`}>
              3
            </div>
            <span className="font-medium">Blueprint</span>
          </div>
        </div>
        )}

        {/* Step 1: Objective Intake */}
        {step === 'intake' && (
          <div className="bg-gray-900/50 backdrop-blur-xl rounded-lg border border-cyan-500/30 p-8">
            <h2 className="text-2xl font-bold mb-6">What's Your PR Objective?</h2>

            <div className="space-y-6">
              {/* Main Objective */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  PR/Communications Goal
                </label>
                <textarea
                  value={objective.objective}
                  onChange={(e) => setObjective({ ...objective, objective: e.target.value })}
                  placeholder="e.g., Make creative community see us as their champion"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  rows={3}
                />
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Target Audience (select all that apply)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {audienceOptions.map((option) => (
                    <label key={option} className="flex items-center gap-2 p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors">
                      <input
                        type="checkbox"
                        checked={objective.targetAudience.includes(option)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setObjective({ ...objective, targetAudience: [...objective.targetAudience, option] })
                          } else {
                            setObjective({ ...objective, targetAudience: objective.targetAudience.filter(a => a !== option) })
                          }
                        }}
                        className="w-4 h-4 text-cyan-400 bg-gray-700 border-gray-600 rounded focus:ring-cyan-400"
                      />
                      <span className="text-sm text-gray-300">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Current vs Desired Position */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Current Position
                  </label>
                  <input
                    type="text"
                    value={objective.currentPosition}
                    onChange={(e) => setObjective({ ...objective, currentPosition: e.target.value })}
                    placeholder="e.g., Unknown in creative space"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Desired Position
                  </label>
                  <input
                    type="text"
                    value={objective.desiredPosition}
                    onChange={(e) => setObjective({ ...objective, desiredPosition: e.target.value })}
                    placeholder="e.g., Creative community champion"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                </div>
              </div>

              {/* Timeline & Capacity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Timeline
                  </label>
                  <select
                    value={objective.timeline}
                    onChange={(e) => setObjective({ ...objective, timeline: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  >
                    <option value="6-weeks">6 weeks</option>
                    <option value="3-months">3 months</option>
                    <option value="6-months">6 months</option>
                    <option value="12-months">12 months</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Team Capacity
                  </label>
                  <select
                    value={objective.teamCapacity}
                    onChange={(e) => setObjective({ ...objective, teamCapacity: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  >
                    <option value="1-person-5hrs">1 person, 5 hrs/week</option>
                    <option value="2-people-10hrs">2 people, 10 hrs/week</option>
                    <option value="3-people-20hrs">3 people, 20 hrs/week</option>
                    <option value="full-team-40hrs">Full team, 40+ hrs/week</option>
                  </select>
                </div>
              </div>

              {/* Competitive Context */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  What Are Competitors Doing?
                </label>
                <textarea
                  value={objective.competitorActions}
                  onChange={(e) => setObjective({ ...objective, competitorActions: e.target.value })}
                  placeholder="e.g., Traditional press releases, conference sponsorships, influencer campaigns"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Your Unique Differentiation
                </label>
                <textarea
                  value={objective.differentiation}
                  onChange={(e) => setObjective({ ...objective, differentiation: e.target.value })}
                  placeholder="e.g., Best image quality, Free tier, Technical depth"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  rows={2}
                />
              </div>

              {/* Psychology */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Target Audience Psychology (select all that apply)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {psychologyOptions.map((option) => (
                    <label key={option} className="flex items-center gap-2 p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors">
                      <input
                        type="checkbox"
                        checked={objective.psychology.includes(option)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setObjective({ ...objective, psychology: [...objective.psychology, option] })
                          } else {
                            setObjective({ ...objective, psychology: objective.psychology.filter(p => p !== option) })
                          }
                        }}
                        className="w-4 h-4 text-cyan-400 bg-gray-700 border-gray-600 rounded focus:ring-cyan-400"
                      />
                      <span className="text-sm text-gray-300">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Analyze Button */}
              <button
                onClick={handleAnalyze}
                disabled={!objective.objective || objective.targetAudience.length === 0 || analyzing}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2"
              >
                {analyzing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Analyzing Strategy...
                  </>
                ) : (
                  <>
                    <Brain className="w-5 h-5" />
                    Analyze Strategic Options
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Pattern Recommendation */}
        {step === 'analysis' && recommendation && (
          <div className="bg-gray-900/50 backdrop-blur-xl rounded-lg border border-cyan-500/30 p-8">
            <div className="flex items-center gap-3 mb-6">
              {getPatternIcon(recommendation.pattern)}
              <div>
                <h2 className="text-2xl font-bold">{recommendation.patternName}</h2>
                <p className="text-gray-400">Confidence: {recommendation.confidence}%</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Strategic Approach */}
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3 text-cyan-400">Strategic Approach</h3>
                <div className="space-y-3 text-gray-300">
                  <p><span className="font-medium text-white">Core Thesis:</span> {recommendation.strategic_approach.core_thesis}</p>
                  <p><span className="font-medium text-white">Invisibility Principle:</span> {recommendation.strategic_approach.invisibility_principle}</p>
                  <p><span className="font-medium text-white">Convergence Point:</span> {recommendation.strategic_approach.convergence_point}</p>
                </div>
              </div>

              {/* Rationale */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-white mb-2">✓ Why This Pattern Works</h4>
                  <p className="text-gray-400">{recommendation.rationale.why_this_pattern}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">✗ Why Traditional PR Fails</h4>
                  <p className="text-gray-400">{recommendation.rationale.why_not_traditional}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">⚡ Competitive Advantage</h4>
                  <p className="text-gray-400">{recommendation.rationale.competitive_advantage}</p>
                </div>
              </div>

              {/* Comparison */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <h4 className="font-semibold text-red-400 mb-3">Traditional Approach</h4>
                  <div className="space-y-2 text-sm text-gray-300">
                    <p>Cost: {recommendation.comparison.traditional_cost}</p>
                    <p>Timeline: {recommendation.comparison.traditional_timeline}</p>
                    <p>Success Rate: {recommendation.comparison.traditional_success_rate}</p>
                  </div>
                </div>
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <h4 className="font-semibold text-green-400 mb-3">AI-Powered {recommendation.patternName}</h4>
                  <div className="space-y-2 text-sm text-gray-300">
                    <p>Cost: {recommendation.comparison.ai_powered_cost}</p>
                    <p>Timeline: {recommendation.comparison.ai_powered_timeline}</p>
                    <p>Success Rate: {recommendation.comparison.ai_powered_success_rate}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => setStep('intake')}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold text-white transition-colors"
                >
                  ← Back to Objective
                </button>
                <button
                  onClick={handleGenerateBlueprint}
                  disabled={generatingBlueprint}
                  className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-gray-700 disabled:to-gray-700 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2"
                >
                  {generatingBlueprint ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Generating Blueprint...
                    </>
                  ) : (
                    <>
                      Generate Campaign Blueprint
                      <Zap className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Campaign Blueprint */}
        {step === 'blueprint' && blueprint && recommendation && (
          <div className="bg-gray-900/50 backdrop-blur-xl rounded-lg border border-cyan-500/30 p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Campaign: {blueprint.campaign_name}</h2>
              <p className="text-gray-400">{recommendation.patternName} • {blueprint.total_effort} • {blueprint.estimated_cost}</p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-400">{blueprint.auto_executable_count}</div>
                <div className="text-sm text-gray-400">Auto-Executable</div>
                <div className="text-xs text-gray-500 mt-1">SignalDesk generates</div>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="text-2xl font-bold text-yellow-400">{blueprint.semi_auto_count}</div>
                <div className="text-sm text-gray-400">Semi-Auto</div>
                <div className="text-xs text-gray-500 mt-1">We generate, you execute</div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-400">{blueprint.manual_count}</div>
                <div className="text-sm text-gray-400">Manual Actions</div>
                <div className="text-xs text-gray-500 mt-1">You must do</div>
              </div>
            </div>

            {/* Phases */}
            {blueprint.phases && blueprint.phases.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Campaign Phases</h3>
              {blueprint.phases.map((phase) => (
                <div key={phase.phase_number} className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-cyan-400">{phase.phase_name}</h4>
                      <p className="text-sm text-gray-400">{phase.duration} • {phase.objective}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {phase.tactics.map((tactic, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-gray-900/50 rounded-lg">
                        <div className={`px-2 py-1 rounded text-xs font-semibold ${
                          tactic.execution_type === 'auto' ? 'bg-green-500/20 text-green-400' :
                          tactic.execution_type === 'semi' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {tactic.execution_type.toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-white">{tactic.tactic_name}</div>
                          <div className="text-sm text-gray-400 mt-1">{tactic.description}</div>
                          <div className="text-xs text-gray-500 mt-1">Effort: {tactic.effort}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setStep('analysis')}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold text-white transition-colors"
              >
                ← Back to Analysis
              </button>
              <button
                onClick={handleGenerateAllContent}
                disabled={generatingContent}
                className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2"
              >
                {generatingContent ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Generating {contentProgress.current}/{contentProgress.total}...
                  </>
                ) : (
                  <>
                    Generate All Content ({blueprint.auto_executable_count} pieces)
                    <Sparkles className="w-5 h-5" />
                  </>
                )}
              </button>
              <button
                onClick={handleSaveCampaign}
                disabled={saving}
                className="py-3 px-6 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-colors flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Campaign
                  </>
                )}
              </button>
            </div>
          </div>
        )}
            </div>
          )}

          {/* Prompt Library Tab */}
          {activeTab === 'prompts' && (
            <div className="max-w-4xl space-y-6">
              <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl p-6 border border-cyan-500/20">
                <h3 className="text-2xl font-bold mb-4 text-cyan-400">Campaign Prompt Library</h3>
                <p className="text-gray-300 mb-4">
                  Pre-built prompts optimized for NIV V4 campaign generation. Use these in the NIV chat sidebar to quickly generate specific types of campaigns.
                </p>
              </div>

              {/* Pattern-Based Prompts */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-white">Campaign Pattern Prompts</h4>

                {/* CASCADE Pattern */}
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-purple-500/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <h5 className="font-semibold text-yellow-400">CASCADE - Viral Launch Campaign</h5>
                      </div>
                      <p className="text-sm text-gray-400 mb-3">
                        Create a viral spread campaign starting with key influencers
                      </p>
                      <div className="bg-gray-900/50 rounded p-3 text-sm text-gray-300 font-mono">
                        "Create a CASCADE campaign to launch [product/service] targeting [audience]. We want to start with [influencer category] and cascade outward to [broader audience]. Timeline: [X weeks]. Budget: [constraint]."
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const promptText = "Create a CASCADE campaign to launch [product/service] targeting [audience]. We want to start with [influencer category] and cascade outward to [broader audience]. Timeline: [X weeks]. Budget: [constraint]."
                        navigator.clipboard.writeText(promptText)
                        alert('Prompt copied! Edit the brackets and paste into NIV chat.')
                      }}
                      className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded text-sm transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                {/* MIRROR Pattern */}
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-purple-500/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-blue-400" />
                        <h5 className="font-semibold text-blue-400">MIRROR - Multi-Stakeholder Campaign</h5>
                      </div>
                      <p className="text-sm text-gray-400 mb-3">
                        Create tailored messaging for different stakeholder groups
                      </p>
                      <div className="bg-gray-900/50 rounded p-3 text-sm text-gray-300 font-mono">
                        "Create a MIRROR campaign for [objective] with different messages for: [stakeholder group 1], [stakeholder group 2], [stakeholder group 3]. Each group should see messaging that reflects their specific values and priorities. Timeline: [X weeks]."
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const promptText = "Create a MIRROR campaign for [objective] with different messages for: [stakeholder group 1], [stakeholder group 2], [stakeholder group 3]. Each group should see messaging that reflects their specific values and priorities. Timeline: [X weeks]."
                        navigator.clipboard.writeText(promptText)
                        alert('Prompt copied! Edit the brackets and paste into NIV chat.')
                      }}
                      className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded text-sm transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                {/* CHORUS Pattern */}
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-purple-500/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Share2 className="w-4 h-4 text-green-400" />
                        <h5 className="font-semibold text-green-400">CHORUS - Coordinated Multi-Channel</h5>
                      </div>
                      <p className="text-sm text-gray-400 mb-3">
                        Orchestrate synchronized messaging across all channels
                      </p>
                      <div className="bg-gray-900/50 rounded p-3 text-sm text-gray-300 font-mono">
                        "Create a CHORUS campaign to [objective] with synchronized messaging across earned media, owned channels, social media, and paid advertising. All channels should reinforce the same [core message] but adapted to each medium. Launch date: [date]."
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const promptText = "Create a CHORUS campaign to [objective] with synchronized messaging across earned media, owned channels, social media, and paid advertising. All channels should reinforce the same [core message] but adapted to each medium. Launch date: [date]."
                        navigator.clipboard.writeText(promptText)
                        alert('Prompt copied! Edit the brackets and paste into NIV chat.')
                      }}
                      className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded text-sm transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                {/* TROJAN Pattern */}
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-purple-500/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-orange-400" />
                        <h5 className="font-semibold text-orange-400">TROJAN - Third-Party Validation</h5>
                      </div>
                      <p className="text-sm text-gray-400 mb-3">
                        Build credibility through independent validators and proxies
                      </p>
                      <div className="bg-gray-900/50 rounded p-3 text-sm text-gray-300 font-mono">
                        "Create a TROJAN campaign to establish [positioning] by leveraging third-party validators: [analyst firms], [industry experts], [customer advocates]. We want [target audience] to hear our message from trusted independent sources rather than directly from us."
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const promptText = "Create a TROJAN campaign to establish [positioning] by leveraging third-party validators: [analyst firms], [industry experts], [customer advocates]. We want [target audience] to hear our message from trusted independent sources rather than directly from us."
                        navigator.clipboard.writeText(promptText)
                        alert('Prompt copied! Edit the brackets and paste into NIV chat.')
                      }}
                      className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded text-sm transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                {/* NETWORK Pattern */}
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-purple-500/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-pink-400" />
                        <h5 className="font-semibold text-pink-400">NETWORK - Community-Driven Growth</h5>
                      </div>
                      <p className="text-sm text-gray-400 mb-3">
                        Activate community networks and peer-to-peer advocacy
                      </p>
                      <div className="bg-gray-900/50 rounded p-3 text-sm text-gray-300 font-mono">
                        "Create a NETWORK campaign to grow [community/movement] by activating peer-to-peer advocacy. Focus on [community type] and create content that members will naturally share within their networks. Goal: [X members/engagement metric] in [timeline]."
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const promptText = "Create a NETWORK campaign to grow [community/movement] by activating peer-to-peer advocacy. Focus on [community type] and create content that members will naturally share within their networks. Goal: [X members/engagement metric] in [timeline]."
                        navigator.clipboard.writeText(promptText)
                        alert('Prompt copied! Edit the brackets and paste into NIV chat.')
                      }}
                      className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded text-sm transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>

              {/* Scenario-Based Prompts */}
              <div className="space-y-4 mt-8">
                <h4 className="text-lg font-semibold text-white">Scenario-Based Prompts</h4>

                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <h5 className="font-semibold text-cyan-400 mb-2">🚀 Product Launch</h5>
                  <div className="bg-gray-900/50 rounded p-3 text-sm text-gray-300 font-mono">
                    "We're launching [product] in [X weeks]. Target audience: [audience]. Key differentiator: [unique value]. Recommend the best campaign pattern and create a complete blueprint with auto-executable content."
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <h5 className="font-semibold text-cyan-400 mb-2">🎯 Thought Leadership</h5>
                  <div className="bg-gray-900/50 rounded p-3 text-sm text-gray-300 font-mono">
                    "Position [executive name/company] as the thought leader in [topic/industry]. Target: [media tier]. Timeline: [X months]. We have [existing assets: research, data, POV]. Create a multi-vector campaign to build authority."
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <h5 className="font-semibold text-cyan-400 mb-2">⚡ Crisis Response</h5>
                  <div className="bg-gray-900/50 rounded p-3 text-sm text-gray-300 font-mono">
                    "We're facing [crisis situation]. Key stakeholders: [list]. Immediate goals: [stabilize/counter narrative/rebuild trust]. Create a rapid response campaign with messaging for each stakeholder group."
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <h5 className="font-semibold text-cyan-400 mb-2">🏆 Competitive Positioning</h5>
                  <div className="bg-gray-900/50 rounded p-3 text-sm text-gray-300 font-mono">
                    "Differentiate us from [competitor] in the [market category]. Our advantages: [list]. Target: [decision-makers]. Create a campaign that positions us as [desired positioning] without directly attacking competitors."
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-6 border border-purple-500/20 mt-8">
                <h4 className="text-lg font-semibold text-purple-400 mb-3">💡 Tips for Effective Prompts</h4>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span><strong>Be specific:</strong> Include concrete objectives, audience, timeline, and constraints</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span><strong>Provide context:</strong> Share industry, competitors, and any relevant background</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span><strong>State success metrics:</strong> Define what success looks like (reach, engagement, conversions)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span><strong>Mention constraints:</strong> Budget, team capacity, approval requirements, brand guidelines</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
