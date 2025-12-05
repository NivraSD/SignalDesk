'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { IntentCapture } from './IntentCapture'
import { ResearchPresentation } from './ResearchPresentation'
import { BlueprintPresentation } from './BlueprintPresentation'
import { BlueprintV3Presentation } from './BlueprintV3Presentation'
import { PRBriefPresentation } from './PRBriefPresentation'
import { GeoVectorBlueprintPresentation } from './GeoVectorBlueprintPresentation'
import { ExecutionManager } from './ExecutionManager'
import { useAppStore } from '@/stores/useAppStore'
import { CampaignBuilderService } from '@/lib/services/campaignBuilderService'
import { supabase } from '@/lib/supabase/client'
import { saveToMemoryVault } from '@/lib/memoryVaultAPI'

type CampaignStage = 'intent' | 'research' | 'positioning' | 'approach' | 'blueprint' | 'execution'

interface SessionState {
  sessionId: string
  stage: CampaignStage
  campaignGoal?: string
  researchData?: any
  positioningOptions?: any[]
  selectedPositioning?: any
  selectedApproach?: 'PR_CAMPAIGN' | 'VECTOR_CAMPAIGN' | 'GEO_VECTOR_CAMPAIGN'
  blueprint?: any
}

interface CampaignBuilderWizardProps {
  initialObjective?: string
  onViewInPlanner?: (planData: { blueprint: any; sessionId: string; campaignType: string }) => void
}

export function CampaignBuilderWizard({ initialObjective, onViewInPlanner }: CampaignBuilderWizardProps = {}) {
  const { organization } = useAppStore()
  const [session, setSession] = useState<SessionState | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversationHistory, setConversationHistory] = useState<any[]>([])

  // Research pipeline progress tracking
  const [researchProgress, setResearchProgress] = useState<{
    currentStage: string
    stages: {
      discovery: 'pending' | 'running' | 'completed' | 'failed'
      'intelligence-gathering': 'pending' | 'running' | 'completed' | 'failed'
      synthesis: 'pending' | 'running' | 'completed' | 'failed'
      saving: 'pending' | 'running' | 'completed' | 'failed'
    }
  }>({
    currentStage: '',
    stages: {
      discovery: 'pending',
      'intelligence-gathering': 'pending',
      synthesis: 'pending',
      saving: 'pending'
    }
  })

  // Blueprint generation progress tracking
  const [blueprintProgress, setBlueprintProgress] = useState<{
    currentStage: string
    stages: {
      base: 'pending' | 'running' | 'completed' | 'failed'
      orchestration: 'pending' | 'running' | 'completed' | 'failed'
      execution: 'pending' | 'running' | 'completed' | 'failed'
      merging: 'pending' | 'running' | 'completed' | 'failed'
    }
  }>({
    currentStage: '',
    stages: {
      base: 'pending',
      orchestration: 'pending',
      execution: 'pending',
      merging: 'pending'
    }
  })

  // Content generation progress tracking
  const [contentProgress, setContentProgress] = useState<{
    current: number
    total: number
    currentPiece: string
  }>({
    current: 0,
    total: 0,
    currentPiece: ''
  })

  // Load saved session from localStorage AFTER organization loads
  // CRITICAL: Session storage is now org-scoped to prevent data leakage between organizations
  useEffect(() => {
    const loadSavedSession = async () => {
      // CRITICAL: Wait for organization to load before loading session
      if (!organization?.id) {
        console.log('⏳ Waiting for organization to load before loading saved session...')
        setSession(null) // Clear any existing session when no org
        return
      }

      // Use org-scoped storage key
      const storageKey = `campaignBuilderSessionId_${organization.id}`
      const savedSessionId = localStorage.getItem(storageKey)

      // Also clean up old non-scoped key if it exists
      const oldKey = localStorage.getItem('campaignBuilderSessionId')
      if (oldKey) {
        console.log('🧹 Cleaning up old non-scoped campaignBuilderSessionId')
        localStorage.removeItem('campaignBuilderSessionId')
      }

      if (savedSessionId && !session) {
        console.log('📂 Found saved sessionId for org:', organization.name, savedSessionId)
        try {
          const data = await CampaignBuilderService.getSession(savedSessionId)

          // Validate session belongs to this organization
          if (data && data.blueprint) {
            // STRICT CHECK: Session MUST have matching org_id
            // Reject sessions without org_id or with different org_id
            if (!data.org_id || data.org_id !== organization.id) {
              console.warn('⚠️ Session org mismatch or missing - session org:', data.org_id, 'current org:', organization.id)
              localStorage.removeItem(storageKey)
              setSession(null)
              return
            }

            console.log('✅ Loaded session from database:', {
              sessionId: data.id,
              stage: data.current_stage,
              hasBlueprint: !!data.blueprint,
              approach: data.selected_approach,
              organization: organization.name
            })

            // Reconstruct session state from database
            setSession({
              sessionId: data.id,
              stage: data.current_stage || 'blueprint',
              campaignGoal: data.campaign_goal,
              conversationHistory: data.conversation_history || [],
              researchFindings: data.research_findings,
              selectedPositioning: data.selected_positioning,
              selectedApproach: data.selected_approach || 'VECTOR_CAMPAIGN',
              blueprint: data.blueprint
            })
          } else {
            console.warn('⚠️ Session not found or incomplete, clearing localStorage')
            localStorage.removeItem(storageKey)
            setSession(null)
          }
        } catch (err) {
          console.error('❌ Failed to load saved session:', err)
          localStorage.removeItem(storageKey)
          setSession(null)
        }
      } else if (!savedSessionId) {
        // No saved session for this org, ensure we start fresh
        setSession(null)
      }
    }

    loadSavedSession()
  }, [organization?.id]) // Re-run when organization changes

  // Debug organization
  useEffect(() => {
    console.log('🏢 Campaign Builder Organization:', organization)
    if (!organization) {
      console.warn('⚠️ No organization selected - button clicks will be blocked')
    }
  }, [organization])

  // Auto-submit initial objective if provided from modal
  useEffect(() => {
    if (initialObjective && organization && !session && !isLoading) {
      console.log('🚀 Auto-submitting initial objective from modal:', initialObjective)
      handleGoalSubmit(initialObjective)
    }
  }, [initialObjective, organization, session, isLoading])

  // No polling needed - research runs in frontend!

  // Stage indicators for progress tracking
  const stages = [
    { id: 'intent', label: 'Goal', number: 1 },
    { id: 'research', label: 'Research', number: 2 },
    { id: 'positioning', label: 'Positioning', number: 3 },
    { id: 'approach', label: 'Approach', number: 4 },
    { id: 'blueprint', label: 'Blueprint', number: 5 },
    { id: 'execution', label: 'Execute', number: 6 }
  ]

  const getCurrentStageIndex = () => {
    if (!session) return 0
    return stages.findIndex(s => s.id === session.stage)
  }

  // Handle clicking on a stage tab to navigate back
  const handleStageClick = (stageId: string, stageIndex: number) => {
    if (!session) return

    const currentIndex = getCurrentStageIndex()

    // Only allow going back to completed stages
    if (stageIndex >= currentIndex) return

    // Update session stage to the clicked stage
    setSession(prev => ({
      ...prev!,
      stage: stageId as CampaignStage
    }))
  }

  // Helper to determine current stage from progress object
  const getCurrentProgressStage = (progress: any): string => {
    if (progress.merging === 'running') return 'merging'
    if (progress.execution === 'running') return 'execution'
    if (progress.orchestration === 'running') return 'orchestration'
    if (progress.base === 'running') return 'base'
    if (progress.merging === 'completed') return 'complete'
    return 'base'
  }

  // Call orchestrator API
  const callOrchestrator = async (message: string) => {
    const orgId = organization?.id || '1' // Default to '1' if no org selected

    console.log('📞 Calling orchestrator:', {
      orgId,
      hasOrg: !!organization,
      sessionId: session?.sessionId,
      messageLength: message.length
    })

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/campaign-builder-orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session?.sessionId,
          orgId,
          message,
          campaignGoal: session?.campaignGoal,
          currentStage: session?.stage
        })
      })

      if (!response.ok) {
        throw new Error('Orchestrator request failed')
      }

      const data = await response.json()
      console.log('✅ Orchestrator response:', data)
      return data

    } catch (err) {
      console.error('❌ Orchestrator error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  // Handle initial goal submission - run research directly
  const handleGoalSubmit = async (goal: string) => {
    console.log('🎯 handleGoalSubmit called with:', goal)

    if (!organization) {
      setError('No organization selected')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Create session first
      const newSession = await CampaignBuilderService.createSession(
        organization.id,
        goal,
        undefined // userId
      )

      console.log('✅ Session created:', newSession.id)

      // Set session in research mode
      setSession({
        sessionId: newSession.id,
        stage: 'research',
        campaignGoal: goal
      })

      // Start research pipeline with progress tracking
      console.log('🚀 Starting research pipeline...')

      const result = await CampaignBuilderService.startResearchPipeline(
        newSession.id,
        goal,
        organization.id,
        organization.name,
        organization.industry || 'Technology',
        (stage, status, data) => {
          console.log(`📊 Pipeline stage ${stage}: ${status}`, data ? '(with data)' : '')

          setResearchProgress(prev => ({
            currentStage: stage,
            stages: {
              ...prev.stages,
              [stage]: status
            }
          }))
        }
      )

      console.log('✅ Research pipeline complete!', result)

      // Update session with research data
      setSession(prev => ({
        ...prev!,
        researchData: result.intelligenceBrief
      }))

      setConversationHistory([
        { role: 'user', content: goal, stage: 'intent' },
        {
          role: 'assistant',
          content: 'Research complete! Review the findings below.',
          stage: 'research',
          data: result.intelligenceBrief
        }
      ])

    } catch (err: any) {
      console.error('❌ Research failed:', err)
      setError(err.message || 'Research pipeline failed')
      // Reset to intent stage on error
      setSession(prev => prev ? { ...prev, stage: 'intent' } : null)
    } finally {
      setIsLoading(false)
    }
  }

  // Positioning generation progress tracking (simulated)
  const [positioningProgress, setPositioningProgress] = useState<{
    stage: 'analysis' | 'framing' | 'generation' | 'complete'
  }>({
    stage: 'analysis'
  })

  // Handle research confirmation - generate positioning options directly
  const handleResearchConfirm = async () => {
    console.log('✅ Research confirmed, generating positioning options...')

    if (!session || !session.researchData) {
      setError('No research data available')
      return
    }

    setIsLoading(true)
    setError(null)

    // Simulate progress through positioning stages
    setPositioningProgress({ stage: 'analysis' })

    // After 10 seconds, move to framing stage
    const framingTimeout = setTimeout(() => {
      setPositioningProgress({ stage: 'framing' })
    }, 10000)

    // After 25 seconds, move to generation stage
    const generationTimeout = setTimeout(() => {
      setPositioningProgress({ stage: 'generation' })
    }, 25000)

    try {
      console.log('📊 Calling positioning with research data:', {
        hasResearchData: !!session.researchData,
        stakeholdersCount: session.researchData?.stakeholders?.length || 0,
        hasNarratives: !!session.researchData?.narrativeLandscape,
        hasChannels: !!session.researchData?.channelIntelligence,
        campaignGoal: session.campaignGoal
      })

      // Use Next.js API route proxy to avoid CORS issues
      const response = await fetch('/api/generate-positioning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          researchData: session.researchData,
          campaignGoal: session.campaignGoal
        })
      })

      // Clear timeouts in case API completes early
      clearTimeout(framingTimeout)
      clearTimeout(generationTimeout)
      setPositioningProgress({ stage: 'complete' })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Positioning generation failed: ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ Positioning options generated:', data)

      // Update session stage and positioning options
      setSession(prev => ({
        ...prev!,
        stage: 'positioning',
        positioningOptions: data.options
      }))

      setConversationHistory(prev => [
        ...prev,
        { role: 'user', content: 'Proceed to positioning', stage: 'research' },
        { role: 'assistant', content: 'Positioning options generated', stage: 'positioning', data: data }
      ])
    } catch (err: any) {
      console.error('❌ Failed to generate positioning:', err)
      setError(err.message || 'Failed to generate positioning options')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle research refinement - run additional targeted research
  const handleResearchRefine = async (refinementRequest: string) => {
    if (!organization || !session) return

    console.log('🔍 Research refinement requested:', refinementRequest)
    setIsLoading(true)
    setError(null)

    try {
      // For now, re-run the full research pipeline with the refinement context
      // In future, could parse the request and run only targeted searches
      const result = await CampaignBuilderService.startResearchPipeline(
        session.sessionId,
        `${session.campaignGoal}\n\nAdditional focus: ${refinementRequest}`,
        organization.id,
        organization.name,
        organization.industry || 'Technology',
        (stage, status, data) => {
          console.log(`📊 Refinement stage ${stage}: ${status}`)
          setResearchProgress(prev => ({
            currentStage: stage,
            stages: {
              ...prev.stages,
              [stage]: status
            }
          }))
        }
      )

      console.log('✅ Refinement complete!', result)

      // Update session with refined research data
      setSession(prev => ({
        ...prev!,
        researchData: result.intelligenceBrief
      }))

      setConversationHistory(prev => [
        ...prev,
        { role: 'user', content: refinementRequest, stage: 'research' },
        {
          role: 'assistant',
          content: 'Research refined with additional focus areas.',
          stage: 'research',
          data: result.intelligenceBrief
        }
      ])

    } catch (err: any) {
      console.error('❌ Refinement failed:', err)
      setError(err.message || 'Research refinement failed')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle positioning selection
  const handlePositioningSelect = async (positioning: any) => {
    console.log('🎨 Positioning selected:', positioning.name)

    if (!session) return

    // Show loading state
    setIsLoading(true)

    // Save positioning selection to database
    try {
      await CampaignBuilderService.updateSession(session.sessionId, {
        currentStage: 'approach',
        selectedPositioning: positioning
      })

      console.log('✅ Positioning saved to database')
    } catch (err) {
      console.error('❌ Failed to save positioning:', err)
      // Continue anyway - we have it in state
    }

    // Move to approach selection stage
    setSession(prev => ({
      ...prev!,
      stage: 'approach',
      selectedPositioning: positioning
    }))

    setConversationHistory(prev => [
      ...prev,
      {
        role: 'user',
        content: `Selected positioning: ${positioning.name}`,
        stage: 'positioning'
      },
      {
        role: 'assistant',
        content: 'Great choice! Now choose your campaign approach.',
        stage: 'approach'
      }
    ])

    // Clear loading state
    setIsLoading(false)
  }

  // Handle approach selection (PR vs VECTOR vs GEO-VECTOR)
  const handleApproachSelect = async (approach: 'PR' | 'VECTOR' | 'GEO_VECTOR') => {
    console.log(`⚡ Approach selected: ${approach}`)

    if (!session || !session.researchData || !session.selectedPositioning) {
      setError('Missing research data or positioning selection')
      return
    }

    const selectedApproach = approach === 'PR' ? 'PR_CAMPAIGN' :
                             approach === 'VECTOR' ? 'VECTOR_CAMPAIGN' :
                             'GEO_VECTOR_CAMPAIGN'

    // Save approach selection to database
    try {
      await CampaignBuilderService.updateSession(session.sessionId, {
        currentStage: 'blueprint',
        selectedApproach
      })
      console.log('✅ Approach saved to database')
    } catch (err) {
      console.error('❌ Failed to save approach:', err)
      // Continue anyway - we have it in state
    }

    // Update session and move to blueprint stage
    setSession(prev => ({
      ...prev!,
      stage: 'blueprint',
      selectedApproach
    }))

    setConversationHistory(prev => [
      ...prev,
      {
        role: 'user',
        content: `Selected ${approach} campaign approach`,
        stage: 'approach'
      },
      {
        role: 'assistant',
        content: 'Generating your campaign blueprint...',
        stage: 'blueprint'
      }
    ])

    // Trigger blueprint generation automatically
    handleBlueprintGenerate(selectedApproach)
  }

  // Handle blueprint generation - call backend orchestrator
  const handleBlueprintGenerate = async (approachType?: 'PR_CAMPAIGN' | 'VECTOR_CAMPAIGN' | 'GEO_VECTOR_CAMPAIGN') => {
    if (!session || !organization) return

    const approach = approachType || session.selectedApproach
    if (!approach) {
      setError('No campaign approach selected')
      return
    }

    console.log(`📋 Generating ${approach} blueprint via backend orchestrator...`)

    setIsLoading(true)
    setError(null)

    // Set initial progress state
    setBlueprintProgress({
      currentStage: 'base',
      stages: {
        base: 'running',
        orchestration: 'pending',
        execution: 'pending',
        merging: 'pending'
      }
    })

    // Simulate realistic progress through stages (better UX than database polling)
    const progressSimulation = {
      timeouts: [] as NodeJS.Timeout[]
    }

    // After 10s, mark base complete and start orchestration
    progressSimulation.timeouts.push(setTimeout(() => {
      setBlueprintProgress(prev => ({
        ...prev,
        currentStage: 'orchestration',
        stages: { ...prev.stages, base: 'completed', orchestration: 'running' }
      }))
    }, 10000))

    // After 30s, mark orchestration complete and start execution
    progressSimulation.timeouts.push(setTimeout(() => {
      setBlueprintProgress(prev => ({
        ...prev,
        currentStage: 'execution',
        stages: { ...prev.stages, orchestration: 'completed', execution: 'running' }
      }))
    }, 30000))

    // After 50s, mark execution complete and start merging
    progressSimulation.timeouts.push(setTimeout(() => {
      setBlueprintProgress(prev => ({
        ...prev,
        currentStage: 'merging',
        stages: { ...prev.stages, execution: 'completed', merging: 'running' }
      }))
    }, 50000))

    try {
      const startTime = Date.now()

      // PR campaigns have simple brief generation (no polling needed)
      if (approach === 'PR_CAMPAIGN') {
        console.log('📰 Generating PR campaign brief...')

        const response = await fetch('/api/generate-blueprint', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sessionId: session.sessionId,
            blueprintType: approach,
            researchData: session.researchData,
            selectedPositioning: session.selectedPositioning,
            campaignGoal: session.campaignGoal,
            organizationContext: {
              name: organization.name,
              industry: organization.industry || 'Technology'
            }
          })
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `PR brief generation failed: ${response.status}`)
        }

        const result = await response.json()
        console.log('✅ PR brief generated:', result)

        // Clear progress simulation timeouts
        progressSimulation.timeouts.forEach(clearTimeout)

        // Mark all stages as complete
        setBlueprintProgress({
          currentStage: 'complete',
          stages: {
            base: 'completed',
            orchestration: 'completed',
            execution: 'completed',
            merging: 'completed'
          }
        })

        console.log('✅ PR brief generated in', Date.now() - startTime, 'ms')

        setSession(prev => ({
          ...prev!,
          blueprint: result.brief
        }))

        setConversationHistory(prev => [
          ...prev,
          {
            role: 'assistant',
            content: 'PR campaign brief generated successfully!',
            stage: 'blueprint',
            data: result.brief
          }
        ])

        setIsLoading(false)
        return
      }

      // GEO-VECTOR campaigns: VECTOR campaign augmented with AI query ownership
      if (approach === 'GEO_VECTOR_CAMPAIGN') {
        console.log('🎯 Generating GEO-VECTOR campaign (VECTOR + AI query ownership)...')

        // STEP 1: Run standard research pipeline (same as VECTOR)
        console.log('📊 Step 1: Running research pipeline...')
        setConversationHistory(prev => [
          ...prev,
          {
            role: 'assistant',
            content: 'Starting research pipeline to gather intelligence on your organization, stakeholders, and competitive landscape...',
            stage: 'research'
          }
        ])

        const researchData = await CampaignBuilderService.startResearchPipeline(
          session.sessionId,
          session.campaignGoal,
          organization.id,
          organization.name,
          organization.industry || 'Technology',
          (stage, status, data) => {
            console.log(`📊 Research stage: ${stage} - ${status}`)
            if (status === 'completed' && data) {
              setSession(prev => ({
                ...prev!,
                researchData: data
              }))
            }
          }
        )

        console.log('✅ Research pipeline completed')

        // STEP 2: Generate GEO intelligence (competitive landscape + outlets + schema)
        console.log('🎯 Step 2: Generating campaign intelligence (competitive landscape, outlets, schema)...')
        setConversationHistory(prev => [
          ...prev,
          {
            role: 'assistant',
            content: '🔍 Analyzing competitive landscape and AI platform visibility for this campaign goal...',
            stage: 'geo_intelligence'
          }
        ])

        // Call new campaign intelligence endpoint
        console.log('🔍 Calling niv-geo-campaign-intelligence with campaign goal...')
        const intelligenceResponse = await fetch('/api/geo/intelligence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organization_id: organization.id,
            organization_name: organization.name,
            industry: organization.industry || 'Technology',
            campaign_goal: session.campaignGoal,
            stakeholders: researchData?.intelligenceBrief?.stakeholders || []
          })
        })

        if (!intelligenceResponse.ok) {
          throw new Error('Failed to generate campaign intelligence')
        }

        const intelligenceData = await intelligenceResponse.json()
        console.log('📊 Campaign intelligence received:', intelligenceData)

        if (!intelligenceData.success || !intelligenceData.campaign_intelligence) {
          throw new Error('No campaign intelligence returned')
        }

        const campaignIntelligence = intelligenceData.campaign_intelligence

        console.log('✅ Campaign intelligence complete:', {
          targetQueries: campaignIntelligence.targetQueries?.length || 0,
          dominantPlayers: campaignIntelligence.competitiveIntelligence?.dominant_players?.length || 0,
          prioritySources: campaignIntelligence.sourceStrategy?.priority_sources?.length || 0,
          totalCompetitors: campaignIntelligence.competitiveIntelligence?.total_competitors || 0,
          totalSources: campaignIntelligence.sourceStrategy?.total_sources || 0
        })

        // STEP 3: Generate VECTOR blueprint with campaign intelligence
        console.log('📋 Step 3: Generating VECTOR blueprint with campaign intelligence...')
        setConversationHistory(prev => [
          ...prev,
          {
            role: 'assistant',
            content: '📋 Generating campaign blueprint with competitive landscape and source strategy...',
            stage: 'blueprint'
          }
        ])

        // Use VECTOR orchestrator with campaign intelligence
        const response = await fetch('/api/generate-blueprint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: session.sessionId,
            blueprintType: 'VECTOR_CAMPAIGN',
            researchData: researchData,
            selectedPositioning: session.selectedPositioning,
            campaignGoal: session.campaignGoal,
            organizationContext: {
              name: organization.name,
              industry: organization.industry || 'Technology'
            },
            campaign_intelligence: campaignIntelligence  // NEW: Rich competitive intelligence
          })
        })

        if (!response.ok) {
          throw new Error('Failed to generate GEO-VECTOR blueprint')
        }

        const partialResult = await response.json()
        console.log('✅ Blueprint base generated:', partialResult)

        // STEP 4: Poll for stakeholder orchestration completion (same as VECTOR)
        console.log('📊 Step 4: Waiting for stakeholder orchestration to complete...')
        setConversationHistory(prev => [
          ...prev,
          {
            role: 'assistant',
            content: '🎯 GEO Step 5/6: Orchestrating multi-stakeholder tactical actions (this takes 60-90 seconds)...',
            stage: 'blueprint'
          }
        ])

        let orchestrationComplete = false
        let attempts = 0
        const maxAttempts = 120 // 120 * 2s = 4 minutes

        while (!orchestrationComplete && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000))

          const data = await CampaignBuilderService.getSession(session.sessionId)

          console.log(`📊 Polling attempt ${attempts + 1}/${maxAttempts}:`, {
            hasData: !!data,
            hasPart3: !!data?.part3_stakeholderorchestration,
            hasPlans: !!data?.part3_stakeholderorchestration?.stakeholderOrchestrationPlans
          })

          if (data?.part3_stakeholderorchestration?.stakeholderOrchestrationPlans) {
            orchestrationComplete = true
            console.log('✅ Stakeholder orchestration complete with GEO augmentation!')
          }

          attempts++
        }

        if (!orchestrationComplete) {
          throw new Error('Stakeholder orchestration timed out after 4 minutes')
        }

        // STEP 5: Finalize blueprint
        console.log('⚙️ Step 5: Finalizing GEO-VECTOR blueprint...')
        setConversationHistory(prev => [
          ...prev,
          {
            role: 'assistant',
            content: '✨ GEO Step 6/6: Finalizing blueprint with GEO augmentation (schema recommendations + content tactics)...',
            stage: 'blueprint'
          }
        ])

        console.log('📦 Campaign intelligence being sent to finalizer:', {
          hasCampaignIntelligence: !!campaignIntelligence,
          targetQueries: campaignIntelligence?.targetQueries?.length || 0,
          dominantPlayers: campaignIntelligence?.competitiveIntelligence?.dominant_players?.length || 0,
          prioritySources: campaignIntelligence?.sourceStrategy?.priority_sources?.length || 0
        })

        const finalizeResponse = await fetch('/api/finalize-blueprint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: session.sessionId,
            blueprintBase: partialResult.blueprintBase,
            organizationContext: {
              name: organization.name,
              industry: organization.industry || 'Technology'
            },
            campaign_intelligence: campaignIntelligence  // Pass campaign intelligence to finalizer
          })
        })

        if (!finalizeResponse.ok) {
          throw new Error('Blueprint finalization failed')
        }

        const result = await finalizeResponse.json()
        console.log('✅ GEO-VECTOR blueprint completed:', result)
        console.log('📊 GEO-VECTOR result structure:', {
          hasPart3: !!result.part3_stakeholderOrchestration,
          planCount: result.part3_stakeholderOrchestration?.stakeholderOrchestrationPlans?.length || 0,
          keys: Object.keys(result),
          part3Keys: result.part3_stakeholderOrchestration ? Object.keys(result.part3_stakeholderOrchestration) : []
        })

        // Save blueprint to database
        try {
          await CampaignBuilderService.updateSession(session.sessionId, {
            blueprint: result
          })
          console.log('✅ GEO-VECTOR blueprint saved to database')
        } catch (err) {
          console.error('❌ Failed to save blueprint to database:', err)
        }

        // Clear progress simulation timeouts
        progressSimulation.timeouts.forEach(clearTimeout)

        // Mark all stages as complete
        setBlueprintProgress({
          currentStage: 'complete',
          stages: {
            base: 'completed',
            orchestration: 'completed',
            execution: 'completed',
            merging: 'completed'
          }
        })

        console.log('✅ GEO-VECTOR blueprint completed in', Date.now() - startTime, 'ms')

        console.log('💾 Setting session.blueprint for GEO-VECTOR')
        setSession(prev => ({
          ...prev!,
          blueprint: result
        }))

        // Save blueprint to Memory Vault with clean campaign name
        const campaignName = session.campaignGoal
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
          .replace(/[^a-zA-Z0-9 ]/g, '')
          .slice(0, 50) // Max 50 chars

        try {
          // Create clean campaign overview for Memory Vault
          const campaignOverview = {
            title: campaignName,
            type: 'GEO-VECTOR Campaign',
            goal: session.campaignGoal,
            positioning: session.selectedPositioning,

            campaignIntelligence: {
              targetQueries: result.campaign_intelligence?.targetQueries?.slice(0, 5) || [],
              competitiveIntelligence: result.campaign_intelligence?.competitiveIntelligence || {},
              sourceStrategy: result.campaign_intelligence?.sourceStrategy || {}
            },

            stakeholders: result.part1_stakeholderIdentification?.stakeholderProfiles?.map((s: any) => ({
              name: s.name,
              priority: s.priority,
              role: s.role
            })) || [],

            executionItems: result.part3_stakeholderOrchestration?.stakeholderOrchestrationPlans?.length || 0,

            timeline: {
              created: new Date().toISOString(),
              sessionId: session.sessionId
            }
          }

          await saveToMemoryVault({
            organization_id: organization.id,
            type: 'campaign',
            title: campaignName,
            content: campaignOverview,
            folder: `Campaigns`,
            metadata: {
              campaign_type: 'GEO_VECTOR',
              session_id: session.sessionId,
              created_via: 'campaign_builder',
              has_geo_intelligence: true,
              execution_items_count: campaignOverview.executionItems
            }
          })
          console.log('✅ Blueprint saved to Memory Vault:', campaignName)
        } catch (err) {
          console.warn('Failed to save to Memory Vault:', err)
        }

        setConversationHistory(prev => [
          ...prev,
          {
            role: 'assistant',
            content: 'GEO-VECTOR campaign blueprint generated! Your tactics now include AI query ownership guidance showing which queries each action will help you own.',
            stage: 'blueprint',
            data: result
          }
        ])

        setIsLoading(false)
        return
      }

      // VECTOR campaigns use complex orchestration with polling
      // STEP 1: Start blueprint generation (returns partial result)
      console.log('📋 Step 1: Starting VECTOR blueprint base generation...')

      const response = await fetch('/api/generate-blueprint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: session.sessionId,
          blueprintType: approach,
          researchData: session.researchData,
          selectedPositioning: session.selectedPositioning,
          campaignGoal: session.campaignGoal,
          organizationContext: {
            name: organization.name,
            industry: organization.industry || 'Technology'
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Blueprint generation failed: ${response.status}`)
      }

      const partialResult = await response.json()
      console.log('✅ Blueprint base generated:', partialResult)

      // STEP 2: Poll database for stakeholder orchestration completion
      console.log('📊 Step 2: Waiting for stakeholder orchestration to complete...')

      let orchestrationComplete = false
      let attempts = 0
      const maxAttempts = 120 // 120 * 2s = 4 minutes

      while (!orchestrationComplete && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000))

        const data = await CampaignBuilderService.getSession(session.sessionId)

        // Debug logging
        console.log(`📊 Polling attempt ${attempts + 1}/${maxAttempts}:`, {
          hasData: !!data,
          hasPart3: !!data?.part3_stakeholderorchestration,
          hasPlans: !!data?.part3_stakeholderorchestration?.stakeholderOrchestrationPlans,
          plansCount: data?.part3_stakeholderorchestration?.stakeholderOrchestrationPlans?.length
        })

        if (data?.part3_stakeholderorchestration?.stakeholderOrchestrationPlans) {
          orchestrationComplete = true
          console.log('✅ Stakeholder orchestration complete!')
        }

        attempts++
      }

      if (!orchestrationComplete) {
        throw new Error('Stakeholder orchestration timed out after 4 minutes')
      }

      // STEP 3: Finalize blueprint (execution + merging)
      console.log('⚙️ Step 3: Finalizing blueprint...')

      const finalizeResponse = await fetch('/api/finalize-blueprint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: session.sessionId,
          blueprintBase: partialResult.blueprintBase,
          organizationContext: {
            name: organization.name,
            industry: organization.industry || 'Technology'
          }
        })
      })

      if (!finalizeResponse.ok) {
        const errorData = await finalizeResponse.json().catch(() => ({}))
        throw new Error(errorData.error || `Blueprint finalization failed: ${finalizeResponse.status}`)
      }

      const result = await finalizeResponse.json()
      console.log('✅ Complete blueprint generated:', result)
      console.log('📊 VECTOR Blueprint structure:', {
        hasOverview: !!result.overview,
        hasPart1: !!result.part1_goalFramework,
        hasPart2: !!result.part2_stakeholderMapping,
        hasPart3: !!result.part3_stakeholderOrchestration,
        hasPart5: !!result.part5_executionRequirements,
        part3Plans: result.part3_stakeholderOrchestration?.stakeholderOrchestrationPlans?.length || 0,
        keys: Object.keys(result),
        part3Keys: result.part3_stakeholderOrchestration ? Object.keys(result.part3_stakeholderOrchestration) : []
      })

      // Save blueprint to database
      try {
        await CampaignBuilderService.updateSession(session.sessionId, {
          blueprint: result
        })
        console.log('✅ Blueprint saved to database')
      } catch (err) {
        console.error('❌ Failed to save blueprint to database:', err)
        // Continue anyway - we have it in state
      }

      // Clear progress simulation timeouts
      progressSimulation.timeouts.forEach(clearTimeout)

      // Mark all stages as complete
      setBlueprintProgress({
        currentStage: 'complete',
        stages: {
          base: 'completed',
          orchestration: 'completed',
          execution: 'completed',
          merging: 'completed'
        }
      })

      console.log('✅ Complete blueprint generated in', Date.now() - startTime, 'ms')

      // Save blueprint to Memory Vault with clean campaign name
      const campaignName = session.campaignGoal
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .slice(0, 50) // Max 50 chars

      try {
        // Create clean campaign overview for Memory Vault
        const campaignOverview = {
          title: campaignName,
          type: 'VECTOR Campaign',
          goal: session.campaignGoal,
          positioning: session.selectedPositioning,

          stakeholders: result.part1_stakeholderIdentification?.stakeholderProfiles?.map((s: any) => ({
            name: s.name,
            priority: s.priority,
            role: s.role,
            goals: s.goals
          })) || [],

          executionItems: result.part3_stakeholderOrchestration?.stakeholderOrchestrationPlans?.length || 0,

          keyMessages: result.part2_strategicGoals?.keyMessages?.slice(0, 5) || [],

          timeline: {
            created: new Date().toISOString(),
            sessionId: session.sessionId
          }
        }

        await saveToMemoryVault({
          organization_id: organization.id,
          type: 'campaign',
          title: campaignName,
          content: campaignOverview,
          folder: `Campaigns`,
          metadata: {
            campaign_type: 'VECTOR',
            session_id: session.sessionId,
            created_via: 'campaign_builder',
            has_geo_intelligence: false,
            execution_items_count: campaignOverview.executionItems
          }
        })
        console.log('✅ VECTOR Blueprint saved to Memory Vault:', campaignName)
      } catch (err) {
        console.warn('Failed to save VECTOR blueprint to Memory Vault:', err)
      }

      console.log('💾 Setting session.blueprint for VECTOR')
      setSession(prev => ({
        ...prev!,
        blueprint: result
      }))

      setConversationHistory(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Blueprint generated successfully!',
          stage: 'blueprint',
          data: result
        }
      ])

      setIsLoading(false)
    } catch (err: any) {
      console.error('❌ Failed to generate blueprint:', err)
      setError(err.message || 'Failed to generate campaign blueprint')

      // Clear progress simulation timeouts
      progressSimulation.timeouts.forEach(clearTimeout)

      // Mark as failed
      setBlueprintProgress(prev => ({
        ...prev,
        stages: {
          base: 'failed',
          orchestration: 'failed',
          execution: 'failed',
          merging: 'failed'
        }
      }))

      // Reset to approach stage on error
      setSession(prev => prev ? { ...prev, stage: 'approach' } : null)
      setIsLoading(false)
    }
  }

  // Handle blueprint refinement
  const handleBlueprintRefine = async (refinementRequest: string) => {
    const response = await callOrchestrator(refinementRequest)

    if (response && response.data) {
      setSession(prev => ({
        ...prev!,
        blueprint: response.data
      }))

      setConversationHistory(prev => [
        ...prev,
        { role: 'user', content: refinementRequest, stage: 'blueprint' },
        { role: 'assistant', content: response.message, stage: response.stage, data: response.data }
      ])
    }
  }

  // Handle blueprint export
  const handleBlueprintExport = () => {
    if (!session?.blueprint) return

    const blueprintText = JSON.stringify(session.blueprint, null, 2)
    const blob = new Blob([blueprintText], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${session.blueprint.overview?.campaignName || 'campaign'}-blueprint.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Handle execution start - send to Strategic Planning tab
  const handleExecutionStart = async () => {
    console.log('🚀 Sending to Strategic Planning tab...')

    if (!session || !session.blueprint) {
      console.error('❌ No blueprint available')
      setError('No blueprint available')
      return
    }

    if (!organization) {
      setError('No organization selected')
      return
    }

    // Store sessionId in localStorage so we can return to this exact campaign
    // CRITICAL: Use org-scoped key to prevent data leakage between organizations
    const storageKey = `campaignBuilderSessionId_${organization.id}`
    localStorage.setItem(storageKey, session.sessionId)
    console.log('💾 Saved sessionId to localStorage for org:', organization.name, session.sessionId)

    console.log('📊 Blueprint structure:', {
      hasPart3: !!session.blueprint?.part3_stakeholderOrchestration,
      planCount: session.blueprint?.part3_stakeholderOrchestration?.stakeholderOrchestrationPlans?.length || 0,
      hasCampaignIntelligence: !!(session.blueprint as any)?.campaign_intelligence,
      blueprintKeys: Object.keys(session.blueprint || {})
    })

    // Prepare plan data
    const planData = {
      blueprint: session.blueprint,
      sessionId: session.sessionId,
      orgId: organization.id,
      campaignType: session.selectedApproach || 'VECTOR_CAMPAIGN'
    }

    // If onViewInPlanner callback is provided (when embedded in CampaignsModule), use it
    if (onViewInPlanner) {
      console.log('✅ Using onViewInPlanner callback to switch to Planner view')
      onViewInPlanner(planData)
      return
    }

    // Fallback: Store in sessionStorage and redirect (for standalone page usage)
    sessionStorage.setItem('pendingPlanData', JSON.stringify(planData))

    // VERIFY it was saved
    const verification = sessionStorage.getItem('pendingPlanData')
    console.log('✅ Blueprint stored for Strategic Planning module')
    console.log('📋 Stored data verification:', {
      wasStored: !!verification,
      dataSize: verification ? verification.length : 0,
      sessionId: planData.sessionId,
      orgId: planData.orgId,
      campaignType: planData.campaignType,
      hasBlueprint: !!planData.blueprint
    })
    console.log('🔄 Navigating to dashboard with window.location.href...')

    // Navigate to dashboard where InfiniteCanvas will pick up the pending plan data
    window.location.href = '/dashboard?openPlan=true'
  }

  // Estimate content pieces from blueprint structure
  const estimateContentPieces = (blueprint: any, campaignType: string): number => {
    if (campaignType === 'PR_CAMPAIGN') {
      let count = 0
      if (blueprint.pressReleaseStrategy?.primaryRelease) count++
      if (blueprint.pressReleaseStrategy?.followUpReleases) {
        count += blueprint.pressReleaseStrategy.followUpReleases.length
      }
      if (blueprint.mediaTargeting?.tier1Outlets) {
        count += Math.min(blueprint.mediaTargeting.tier1Outlets.length, 5)
      }
      count++ // LinkedIn post
      return count
    } else if (campaignType === 'VECTOR_CAMPAIGN') {
      let count = 0
      // Count from V3 structure
      if (blueprint.part3_tacticalOrchestration) {
        const phases = ['phase1_awareness', 'phase2_consideration', 'phase3_conversion', 'phase4_advocacy']
        phases.forEach(phase => {
          const phaseData = blueprint.part3_tacticalOrchestration[phase]
          if (phaseData) {
            if (phaseData.pillar1_ownedActions) count += phaseData.pillar1_ownedActions.length
            if (phaseData.pillar4_mediaEngagement) count += phaseData.pillar4_mediaEngagement.length
          }
        })
      }
      // Fallback: estimate if we can't determine
      return count > 0 ? count : 8
    }
    return 5 // Default estimate
  }

  // Render current stage
  const renderStage = () => {
    if (!session) {
      return (
        <IntentCapture
          onSubmit={handleGoalSubmit}
          isLoading={isLoading}
        />
      )
    }

    switch (session.stage) {
      case 'intent':
        return (
          <IntentCapture
            onSubmit={handleGoalSubmit}
            isLoading={isLoading}
          />
        )

      case 'research':
        if (session.researchData) {
          return (
            <ResearchPresentation
              research={session.researchData}
              onProceed={handleResearchConfirm}
              onRefine={handleResearchRefine}
              isRefining={isLoading}
              isProceeding={isLoading && session.stage === 'research'}
            />
          )
        } else if (isLoading) {
          // Show real-time progress during research
          return (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-lg p-8">
                <h2 className="text-2xl font-bold text-white mb-6 text-center" style={{ fontFamily: 'var(--font-display)' }}>
                  Conducting Campaign Research
                </h2>
                <p className="text-[var(--grey-400)] text-center mb-8">
                  Running comprehensive research pipeline across multiple dimensions...
                </p>

                {/* Research Pipeline Progress */}
                <div className="space-y-4">
                  {/* Discovery */}
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                      researchProgress.stages.discovery === 'completed' ? 'bg-[var(--burnt-orange)]' :
                      researchProgress.stages.discovery === 'running' ? 'bg-[var(--burnt-orange)] animate-pulse' :
                      researchProgress.stages.discovery === 'failed' ? 'bg-red-600' :
                      'bg-[var(--grey-700)]'
                    }`}>
                      {researchProgress.stages.discovery === 'completed' ? '✓' :
                       researchProgress.stages.discovery === 'running' ? '⋯' :
                       researchProgress.stages.discovery === 'failed' ? '✗' : '○'}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-white">Organization Discovery</div>
                      <div className="text-sm text-[var(--grey-400)]">Creating organization profile</div>
                    </div>
                  </div>

                  {/* Intelligence Gathering */}
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                      researchProgress.stages['intelligence-gathering'] === 'completed' ? 'bg-[var(--burnt-orange)]' :
                      researchProgress.stages['intelligence-gathering'] === 'running' ? 'bg-[var(--burnt-orange)] animate-pulse' :
                      researchProgress.stages['intelligence-gathering'] === 'failed' ? 'bg-red-600' :
                      'bg-[var(--grey-700)]'
                    }`}>
                      {researchProgress.stages['intelligence-gathering'] === 'completed' ? '✓' :
                       researchProgress.stages['intelligence-gathering'] === 'running' ? '⋯' :
                       researchProgress.stages['intelligence-gathering'] === 'failed' ? '✗' : '○'}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-white">Intelligence Gathering</div>
                      <div className="text-sm text-[var(--grey-400)]">Stakeholders • Narratives • Channels • Historical Patterns</div>
                    </div>
                  </div>

                  {/* Synthesis */}
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                      researchProgress.stages.synthesis === 'completed' ? 'bg-[var(--burnt-orange)]' :
                      researchProgress.stages.synthesis === 'running' ? 'bg-[var(--burnt-orange)] animate-pulse' :
                      researchProgress.stages.synthesis === 'failed' ? 'bg-red-600' :
                      'bg-[var(--grey-700)]'
                    }`}>
                      {researchProgress.stages.synthesis === 'completed' ? '✓' :
                       researchProgress.stages.synthesis === 'running' ? '⋯' :
                       researchProgress.stages.synthesis === 'failed' ? '✗' : '○'}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-white">Intelligence Synthesis</div>
                      <div className="text-sm text-[var(--grey-400)]">Generating Campaign Intelligence Brief</div>
                    </div>
                  </div>

                  {/* Saving */}
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                      researchProgress.stages.saving === 'completed' ? 'bg-[var(--burnt-orange)]' :
                      researchProgress.stages.saving === 'running' ? 'bg-[var(--burnt-orange)] animate-pulse' :
                      researchProgress.stages.saving === 'failed' ? 'bg-red-600' :
                      'bg-[var(--grey-700)]'
                    }`}>
                      {researchProgress.stages.saving === 'completed' ? '✓' :
                       researchProgress.stages.saving === 'running' ? '⋯' :
                       researchProgress.stages.saving === 'failed' ? '✗' : '○'}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-white">Saving Results</div>
                      <div className="text-sm text-[var(--grey-400)]">Storing research findings</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-center text-sm text-[var(--grey-500)]">
                  {researchProgress.currentStage && (
                    <p>Currently running: <span className="text-[var(--burnt-orange)]">{researchProgress.currentStage}</span></p>
                  )}
                </div>
              </div>
            </div>
          )
        } else {
          return null
        }

      case 'positioning':
        if (isLoading) {
          return (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-lg p-8">
                <h3 className="text-xl font-semibold text-white text-center mb-6" style={{ fontFamily: 'var(--font-display)' }}>Generating Positioning Options</h3>

                <div className="space-y-4">
                  {/* Analysis Stage */}
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                      positioningProgress.stage === 'complete' || positioningProgress.stage === 'framing' || positioningProgress.stage === 'generation'
                        ? 'bg-[var(--burnt-orange)]'
                        : positioningProgress.stage === 'analysis'
                        ? 'bg-[var(--burnt-orange)] animate-pulse'
                        : 'bg-[var(--grey-700)]'
                    }`}>
                      {positioningProgress.stage === 'complete' || positioningProgress.stage === 'framing' || positioningProgress.stage === 'generation' ? '✓' : positioningProgress.stage === 'analysis' ? '⋯' : '○'}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-white">Analyzing Research Data</div>
                      <div className="text-sm text-[var(--grey-400)]">Processing stakeholder insights and market dynamics</div>
                    </div>
                  </div>

                  {/* Strategic Framing */}
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                      positioningProgress.stage === 'complete' || positioningProgress.stage === 'generation'
                        ? 'bg-[var(--burnt-orange)]'
                        : positioningProgress.stage === 'framing'
                        ? 'bg-[var(--burnt-orange)] animate-pulse'
                        : 'bg-[var(--grey-700)]'
                    }`}>
                      {positioningProgress.stage === 'complete' || positioningProgress.stage === 'generation' ? '✓' : positioningProgress.stage === 'framing' ? '⋯' : '○'}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-white">Strategic Framing</div>
                      <div className="text-sm text-[var(--grey-400)]">Developing positioning angles and narratives</div>
                    </div>
                  </div>

                  {/* Option Generation */}
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                      positioningProgress.stage === 'complete'
                        ? 'bg-[var(--burnt-orange)]'
                        : positioningProgress.stage === 'generation'
                        ? 'bg-[var(--burnt-orange)] animate-pulse'
                        : 'bg-[var(--grey-700)]'
                    }`}>
                      {positioningProgress.stage === 'complete' ? '✓' : positioningProgress.stage === 'generation' ? '⋯' : '○'}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-white">Creating Options</div>
                      <div className="text-sm text-[var(--grey-400)]">Generating 3-4 distinct positioning strategies</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-center text-sm text-[var(--grey-500)]">
                  <p>Currently: <span className="text-[var(--burnt-orange)]">
                    {positioningProgress.stage === 'analysis' ? 'Analyzing research data' :
                     positioningProgress.stage === 'framing' ? 'Strategic framing' :
                     positioningProgress.stage === 'generation' ? 'Creating options' : 'Complete'}
                  </span></p>
                  <p className="mt-2">Expected time: ~30-45 seconds</p>
                </div>
              </div>
            </div>
          )
        }

        if (!session.positioningOptions || session.positioningOptions.length === 0) {
          return (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="bg-[var(--grey-900)] border border-red-500/50 rounded-lg p-8 text-center">
                <p className="text-red-400">No positioning options available. Please try again.</p>
              </div>
            </div>
          )
        }

        return (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>Select Your Positioning</h2>
              <p className="text-[var(--grey-400)]">
                Based on the research, choose the positioning that best aligns with your campaign goals.
              </p>
            </div>

            <div className="space-y-4">
              {session.positioningOptions.map((option: any) => (
                <button
                  key={option.id}
                  onClick={() => handlePositioningSelect(option)}
                  disabled={isLoading}
                  className="w-full p-6 bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-lg hover:border-[var(--burnt-orange)] transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed group relative"
                >
                  {/* Loading Spinner Overlay */}
                  {isLoading && (
                    <div className="absolute inset-0 bg-[var(--grey-900)]/90 rounded-lg flex items-center justify-center">
                      <div className="animate-spin h-8 w-8 border-4 border-[var(--burnt-orange)] border-t-transparent rounded-full"></div>
                    </div>
                  )}

                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white group-hover:text-[var(--burnt-orange)] transition-colors">
                        {option.name}
                      </h3>
                      <p className="text-sm italic text-[var(--grey-300)] mt-1">{option.tagline}</p>
                    </div>
                    <div className="ml-4 px-3 py-1 bg-[var(--burnt-orange-muted)] border border-[var(--burnt-orange)]/50 rounded-full">
                      <span className="text-sm font-semibold text-[var(--burnt-orange)]">{option.confidenceScore}% Confidence</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-[var(--grey-400)] mb-4">{option.description}</p>

                  {/* Rationale */}
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-white uppercase mb-1">Why This Works</h4>
                    <p className="text-sm text-[var(--grey-300)]">{option.rationale}</p>
                  </div>

                  {/* Grid Layout for Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Target Audiences */}
                    {option.targetAudiences && option.targetAudiences.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-white uppercase mb-2">Target Audiences</h4>
                        <ul className="space-y-1">
                          {option.targetAudiences.map((audience: string, idx: number) => (
                            <li key={idx} className="text-sm text-[var(--grey-300)] flex items-start">
                              <span className="text-[var(--burnt-orange)] mr-2">•</span>
                              <span>{audience}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Key Messages */}
                    {option.keyMessages && option.keyMessages.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-white uppercase mb-2">Key Messages</h4>
                        <ul className="space-y-1">
                          {option.keyMessages.map((message: string, idx: number) => (
                            <li key={idx} className="text-sm text-[var(--grey-300)] flex items-start">
                              <span className="text-[var(--burnt-orange)] mr-2">•</span>
                              <span>{message}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Differentiators */}
                    {option.differentiators && option.differentiators.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-white uppercase mb-2">Differentiators</h4>
                        <ul className="space-y-1">
                          {option.differentiators.map((diff: string, idx: number) => (
                            <li key={idx} className="text-sm text-[var(--grey-300)] flex items-start">
                              <span className="text-[var(--burnt-orange)] mr-2">•</span>
                              <span>{diff}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Opportunities */}
                    {option.opportunities && option.opportunities.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-white uppercase mb-2">Opportunities</h4>
                        <ul className="space-y-1">
                          {option.opportunities.map((opp: string, idx: number) => (
                            <li key={idx} className="text-sm text-[var(--grey-300)] flex items-start">
                              <span className="text-[var(--burnt-orange)] mr-2">•</span>
                              <span>{opp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Risks */}
                  {option.risks && option.risks.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[var(--grey-800)]">
                      <h4 className="text-xs font-semibold text-white uppercase mb-2">Potential Risks</h4>
                      <ul className="space-y-1">
                        {option.risks.map((risk: string, idx: number) => (
                          <li key={idx} className="text-sm text-[var(--grey-400)] flex items-start">
                            <span className="text-yellow-500 mr-2">⚠</span>
                            <span>{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )

      case 'approach':
        return (
          <div className="max-w-5xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-white text-center" style={{ fontFamily: 'var(--font-display)' }}>Choose Your Campaign Type</h2>
            <p className="text-[var(--grey-400)] text-center">
              Select between traditional PR, advanced VECTOR orchestration, or AI-optimized GEO-VECTOR campaigns.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => handleApproachSelect('PR')}
                disabled={isLoading}
                className="p-6 bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-lg hover:border-[var(--burnt-orange)] transition-all text-left disabled:opacity-50"
              >
                <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>PR Campaign</h3>
                <p className="text-sm text-[var(--grey-400)] mb-4">Traditional media approach</p>
                <ul className="text-sm text-[var(--grey-300)] space-y-1">
                  <li>• Press releases</li>
                  <li>• Media outreach</li>
                  <li>• Event-based awareness</li>
                  <li>• Standard tactics</li>
                </ul>
              </button>

              <button
                onClick={() => handleApproachSelect('VECTOR')}
                disabled={isLoading}
                className="p-6 bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-lg hover:border-[var(--burnt-orange)] transition-all text-left disabled:opacity-50"
              >
                <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>VECTOR Campaign</h3>
                <p className="text-sm text-[var(--grey-400)] mb-4">Human influence orchestration</p>
                <ul className="text-sm text-[var(--grey-300)] space-y-1">
                  <li>• Multi-stakeholder mapping</li>
                  <li>• Psychological profiling</li>
                  <li>• Sequential strategy</li>
                  <li>• Coordinated execution</li>
                </ul>
              </button>

              <button
                onClick={() => handleApproachSelect('GEO_VECTOR')}
                disabled={isLoading}
                className="p-6 bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-lg hover:border-[var(--burnt-orange)] transition-all text-left disabled:opacity-50"
              >
                <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>GEO-VECTOR</h3>
                <p className="text-sm text-[var(--grey-400)] mb-4">AI platform optimization</p>
                <ul className="text-sm text-[var(--grey-300)] space-y-1">
                  <li>• ChatGPT, Claude, Perplexity</li>
                  <li>• Schema optimization (75%)</li>
                  <li>• Industry-adaptive content</li>
                  <li>• 8-12 week execution</li>
                </ul>
              </button>
            </div>
          </div>
        )

      case 'blueprint':
        if (session.blueprint) {
          // Use BlueprintV3Presentation for both VECTOR and GEO-VECTOR campaigns
          // (GEO-VECTOR uses VECTOR structure with GEO augmentation)
          if (session.selectedApproach === 'VECTOR_CAMPAIGN' || session.selectedApproach === 'GEO_VECTOR_CAMPAIGN') {
            return (
              <BlueprintV3Presentation
                blueprint={session.blueprint}
                onRefine={handleBlueprintRefine}
                onExport={handleBlueprintExport}
                onExecute={handleExecutionStart}
                isRefining={isLoading}
              />
            )
          }

          // Use PRBriefPresentation for PR campaigns
          if (session.selectedApproach === 'PR_CAMPAIGN') {
            return (
              <PRBriefPresentation
                brief={session.blueprint}
                onRefine={handleBlueprintRefine}
                onExport={handleBlueprintExport}
                onExecute={handleExecutionStart}
                isRefining={isLoading}
              />
            )
          }

          // Fallback for legacy PR campaigns
          return (
            <BlueprintPresentation
              blueprint={session.blueprint}
              blueprintType={session.selectedApproach || 'PR_CAMPAIGN'}
              onRefine={handleBlueprintRefine}
              onExport={handleBlueprintExport}
              onExecute={handleExecutionStart}
              isRefining={isLoading}
            />
          )
        } else if (isLoading) {
          // Show real-time progress during blueprint generation
          return (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-lg p-8">
                <h2 className="text-2xl font-bold text-white mb-6 text-center" style={{ fontFamily: 'var(--font-display)' }}>
                  Generating Campaign Blueprint
                </h2>
                <p className="text-[var(--grey-400)] text-center mb-8">
                  Creating your {session.selectedApproach === 'PR_CAMPAIGN' ? 'PR Campaign' :
                                session.selectedApproach === 'GEO_VECTOR_CAMPAIGN' ? 'GEO-VECTOR' :
                                'VECTOR Campaign'} blueprint across multiple stages...
                </p>

                {/* Blueprint Generation Progress */}
                {session.selectedApproach === 'GEO_VECTOR_CAMPAIGN' ? (
                  /* GEO-VECTOR Progress - 6 stages */
                  <div className="space-y-3">
                    {[
                      { key: 'geo_query', title: 'Query Discovery', desc: 'Identifying target AI queries for brand ownership' },
                      { key: 'geo_platform', title: 'Platform Testing', desc: 'Testing across ChatGPT, Claude, Perplexity, Gemini (20 tests)' },
                      { key: 'geo_synthesis', title: 'GEO Synthesis', desc: 'Analyzing citation patterns and generating recommendations' },
                      { key: 'blueprint_base', title: 'Blueprint Base', desc: 'Creating VECTOR framework (stakeholders + goals)' },
                      { key: 'orchestration', title: 'Orchestration', desc: 'Multi-stakeholder tactical planning (60-90s)' },
                      { key: 'finalization', title: 'Finalization', desc: 'Merging GEO insights with VECTOR blueprint' }
                    ].map((stage, idx) => {
                      const isCompleted = idx < (conversationHistory.filter(m => m.role === 'assistant' && m.content.includes('GEO Step')).length)
                      const isRunning = idx === (conversationHistory.filter(m => m.role === 'assistant' && m.content.includes('GEO Step')).length)
                      return (
                        <div key={stage.key} className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                            isCompleted ? 'bg-[var(--burnt-orange)]' :
                            isRunning ? 'bg-[var(--burnt-orange)] animate-pulse' :
                            'bg-[var(--grey-700)]'
                          }`}>
                            {isCompleted ? '✓' : isRunning ? '⋯' : idx + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-white text-sm">{stage.title}</div>
                            <div className="text-xs text-[var(--grey-400)]">{stage.desc}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  /* Regular VECTOR Progress - 4 stages */
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                        blueprintProgress.stages.base === 'completed' ? 'bg-[var(--burnt-orange)]' :
                        blueprintProgress.stages.base === 'running' ? 'bg-[var(--burnt-orange)] animate-pulse' :
                        blueprintProgress.stages.base === 'failed' ? 'bg-red-600' :
                        'bg-[var(--grey-700)]'
                      }`}>
                        {blueprintProgress.stages.base === 'completed' ? '✓' :
                         blueprintProgress.stages.base === 'running' ? '⋯' :
                         blueprintProgress.stages.base === 'failed' ? '✗' : '1'}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-white">Blueprint Foundation</div>
                        <div className="text-sm text-[var(--grey-400)]">Overview • Goal Framework • Stakeholder Mapping</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                        blueprintProgress.stages.orchestration === 'completed' ? 'bg-[var(--burnt-orange)]' :
                        blueprintProgress.stages.orchestration === 'running' ? 'bg-[var(--burnt-orange)] animate-pulse' :
                        blueprintProgress.stages.orchestration === 'failed' ? 'bg-red-600' :
                        'bg-[var(--grey-700)]'
                      }`}>
                        {blueprintProgress.stages.orchestration === 'completed' ? '✓' :
                         blueprintProgress.stages.orchestration === 'running' ? '⋯' :
                         blueprintProgress.stages.orchestration === 'failed' ? '✗' : '2'}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-white">Stakeholder Orchestration</div>
                        <div className="text-sm text-[var(--grey-400)]">Four-Pillar Strategy • Influence Levers</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                        blueprintProgress.stages.execution === 'completed' ? 'bg-[var(--burnt-orange)]' :
                        blueprintProgress.stages.execution === 'running' ? 'bg-[var(--burnt-orange)] animate-pulse' :
                        blueprintProgress.stages.execution === 'failed' ? 'bg-red-600' :
                        'bg-[var(--grey-700)]'
                      }`}>
                        {blueprintProgress.stages.execution === 'completed' ? '✓' :
                         blueprintProgress.stages.execution === 'running' ? '⋯' :
                         blueprintProgress.stages.execution === 'failed' ? '✗' : '3'}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-white">Execution Requirements</div>
                        <div className="text-sm text-[var(--grey-400)]">Timeline • Resources • Dependencies</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                        blueprintProgress.stages.merging === 'completed' ? 'bg-[var(--burnt-orange)]' :
                        blueprintProgress.stages.merging === 'running' ? 'bg-[var(--burnt-orange)] animate-pulse' :
                        blueprintProgress.stages.merging === 'failed' ? 'bg-red-600' :
                        'bg-[var(--grey-700)]'
                      }`}>
                        {blueprintProgress.stages.merging === 'completed' ? '✓' :
                         blueprintProgress.stages.merging === 'running' ? '⋯' :
                         blueprintProgress.stages.merging === 'failed' ? '✗' : '4'}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-white">Finalizing Blueprint</div>
                        <div className="text-sm text-[var(--grey-400)]">Merging all components</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6 text-center text-sm text-[var(--grey-500)]">
                  {session.selectedApproach === 'GEO_VECTOR_CAMPAIGN' ? (
                    <p className="mt-2">Expected time: ~2-4 minutes (GEO testing takes longer)</p>
                  ) : (
                    <>
                      {blueprintProgress.currentStage && (
                        <p>Currently running: <span className="text-[var(--burnt-orange)]">{blueprintProgress.currentStage}</span></p>
                      )}
                      <p className="mt-2">Expected time: ~60-90 seconds</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        } else {
          return null
        }

      case 'execution':
        // Show loading during content generation with progress
        if (isLoading) {
          const progressPercentage = contentProgress.total > 0
            ? (contentProgress.current / contentProgress.total) * 100
            : 0

          return (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-lg p-8">
                <h2 className="text-2xl font-bold text-white mb-6 text-center" style={{ fontFamily: 'var(--font-display)' }}>
                  Generating Campaign Content
                </h2>
                <p className="text-[var(--grey-400)] text-center mb-8">
                  Creating all content pieces from your {session?.selectedApproach === 'PR_CAMPAIGN' ? 'PR' :
                                                               session?.selectedApproach === 'GEO_VECTOR_CAMPAIGN' ? 'GEO-VECTOR' :
                                                               'VECTOR'} blueprint...
                </p>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[var(--grey-400)]">Progress</span>
                    <span className="text-sm text-[var(--grey-400)]">
                      {contentProgress.current} / {contentProgress.total} pieces
                    </span>
                  </div>
                  <div className="h-3 bg-[var(--grey-800)] rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-500"
                      style={{ width: `${progressPercentage}%`, background: 'var(--burnt-orange)' }}
                    />
                  </div>
                  <p className="text-sm text-[var(--burnt-orange)] mt-2 text-center animate-pulse">
                    {contentProgress.currentPiece}
                  </p>
                </div>

                {/* Stages */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[var(--burnt-orange)] flex items-center justify-center animate-pulse text-white text-sm">
                      ⋯
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-white">Content Generation</div>
                      <div className="text-sm text-[var(--grey-400)]">Using NIV Content Intelligence v2</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[var(--grey-700)] flex items-center justify-center text-[var(--grey-500)] text-sm">
                      2
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-[var(--grey-500)]">Saving to Memory Vault</div>
                      <div className="text-sm text-[var(--grey-600)]">Pending content generation...</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-center text-sm text-[var(--grey-500)]">
                  <p>Expected time: ~{Math.ceil(contentProgress.total * 2.5)}-{Math.ceil(contentProgress.total * 4)} seconds</p>
                </div>
              </div>
            </div>
          )
        }

        // Show generated content with Memory Vault link
        const executionMessage = conversationHistory.find(h => h.stage === 'execution' && h.role === 'assistant')
        if (executionMessage && executionMessage.data) {
          return (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-[var(--burnt-orange)] flex items-center justify-center mx-auto text-white text-2xl">✓</div>
                <h2 className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>Content Generation Complete!</h2>
                <p className="text-[var(--grey-400)]">{executionMessage.content}</p>
                <p className="text-sm text-[var(--grey-500)]">
                  All content has been saved to your Memory Vault
                </p>
              </div>

              {/* Quick Preview */}
              <div className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>Generated Content Preview</h3>
                <div className="space-y-2">
                  {executionMessage.data.map((content: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-[var(--burnt-orange)]" />
                      <span className="text-[var(--grey-300)]">{content.content_type}</span>
                      {content.target_stakeholder && (
                        <span className="text-[var(--grey-500)]">→ {content.target_stakeholder}</span>
                      )}
                      {content.phase && (
                        <span className="text-xs px-2 py-0.5 rounded bg-[var(--burnt-orange-muted)] border border-[var(--burnt-orange)]/20 text-[var(--burnt-orange)]">
                          {content.phase}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <a
                  href="/memory-vault"
                  className="w-full px-6 py-4 text-white rounded-lg font-semibold hover:brightness-110 transition-all text-center flex items-center justify-center gap-2"
                  style={{ background: 'var(--burnt-orange)', fontFamily: 'var(--font-display)' }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  Open Memory Vault to View & Edit Content
                </a>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      const allContent = executionMessage.data
                        .map((c: any) => `${c.content_type}\n\n${c.content_data}`)
                        .join('\n\n---\n\n')
                      const blob = new Blob([allContent], { type: 'text/plain' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = 'campaign-content.txt'
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                      URL.revokeObjectURL(url)
                    }}
                    className="px-4 py-3 bg-[var(--grey-800)] text-white rounded-lg font-medium hover:bg-[var(--grey-700)] transition-all flex items-center justify-center gap-2"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export as Text
                  </button>

                  <button
                    onClick={() => {
                      // Start a new campaign
                      setSession(null)
                      setConversationHistory([])
                      setError(null)
                    }}
                    className="px-4 py-3 bg-[var(--grey-800)] text-white rounded-lg font-medium hover:bg-[var(--grey-700)] transition-all flex items-center justify-center gap-2"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Campaign
                  </button>
                </div>
              </div>
            </div>
          )
        }

        // Fallback if no content yet
        return (
          <div className="max-w-3xl mx-auto space-y-6 text-center py-20">
            <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>Campaign Execution</h2>
            <p className="text-[var(--grey-400)]">Content generation in progress...</p>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="bg-[var(--charcoal)] py-8 px-4">
      {/* Progress Indicator */}
      <div className="max-w-5xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          {stages.map((stage, index) => {
            const currentIndex = getCurrentStageIndex()
            const isActive = index === currentIndex
            const isComplete = index < currentIndex
            const isClickable = isComplete && session // Can only click on completed stages

            return (
              <div key={stage.id} className="flex items-center">
                <button
                  onClick={() => isClickable && handleStageClick(stage.id, index)}
                  disabled={!isClickable}
                  className={`flex flex-col items-center ${isClickable ? 'cursor-pointer' : 'cursor-default'} group`}
                >
                  <motion.div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      isComplete
                        ? 'bg-[var(--burnt-orange)] group-hover:brightness-110 group-hover:ring-2 group-hover:ring-[var(--burnt-orange-muted)]'
                        : isActive
                        ? 'bg-[var(--burnt-orange)] ring-2 ring-[var(--burnt-orange-muted)]'
                        : 'bg-[var(--grey-800)] text-[var(--grey-500)]'
                    }`}
                    style={{
                      color: isComplete || isActive ? 'var(--white)' : 'var(--grey-500)',
                      fontFamily: 'var(--font-display)'
                    }}
                    animate={isActive ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {isComplete ? '✓' : stage.number}
                  </motion.div>
                  <span
                    className={`text-xs mt-1.5 ${isActive ? 'text-white font-medium' : isComplete ? 'text-[var(--burnt-orange)] group-hover:brightness-110' : 'text-[var(--grey-500)]'}`}
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {stage.label}
                  </span>
                  {isClickable && (
                    <span className="text-[10px] text-[var(--grey-600)] group-hover:text-[var(--grey-400)] mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      (click to review)
                    </span>
                  )}
                </button>
                {index < stages.length - 1 && (
                  <div className={`h-0.5 w-8 md:w-16 mx-2 ${isComplete ? 'bg-[var(--burnt-orange)]' : 'bg-[var(--grey-800)]'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg"
        >
          <p className="text-red-400">{error}</p>
        </motion.div>
      )}

      {/* Stage Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={session?.stage || 'intent'}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderStage()}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
