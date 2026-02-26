import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

// Types
interface OrchestratorRequest {
  sessionId?: string
  orgId: string
  userId?: string
  message: string
  campaignGoal?: string
  currentStage?: CampaignStage
}

type CampaignStage = 'intent' | 'research' | 'positioning' | 'approach' | 'blueprint' | 'execution'

interface SessionState {
  id: string
  orgId: string
  userId?: string
  currentStage: CampaignStage
  status: 'active' | 'completed' | 'abandoned'
  campaignGoal: string
  researchFindings?: any
  selectedPositioning?: any
  selectedApproach?: 'PR_CAMPAIGN' | 'VECTOR_CAMPAIGN'
  blueprint?: any
  conversationHistory: ConversationMessage[]
  createdAt: string
  updatedAt: string
}

interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  stage: CampaignStage
}

interface OrchestratorResponse {
  sessionId: string
  stage: CampaignStage
  message: string
  data?: any
  options?: any[]
  requiresInput: boolean
  completed?: boolean
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { sessionId, orgId, userId, message, campaignGoal, currentStage } = await req.json() as OrchestratorRequest

    console.log('Orchestrator Request:', { sessionId, orgId, stage: currentStage, messageLength: message.length })

    // Load or create session
    let session = sessionId ? await loadSession(supabaseClient, sessionId) : null

    if (!session) {
      // New session - start with intent capture
      session = await createSession(supabaseClient, orgId, userId, campaignGoal || message)
    }

    // Add user message to conversation history
    session.conversationHistory.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      stage: session.currentStage
    })

    // Route to appropriate stage handler
    let response: OrchestratorResponse

    switch (session.currentStage) {
      case 'intent':
        response = await handleIntentStage(supabaseClient, session, message)
        break
      case 'research':
        response = await handleResearchStage(supabaseClient, session, message)
        break
      case 'positioning':
        response = await handlePositioningStage(supabaseClient, session, message)
        break
      case 'approach':
        response = await handleApproachStage(supabaseClient, session, message)
        break
      case 'blueprint':
        response = await handleBlueprintStage(supabaseClient, session, message)
        break
      case 'execution':
        response = await handleExecutionStage(supabaseClient, session, message)
        break
      default:
        throw new Error(`Unknown stage: ${session.currentStage}`)
    }

    // Add assistant response to conversation history
    session.conversationHistory.push({
      role: 'assistant',
      content: response.message,
      timestamp: new Date().toISOString(),
      stage: response.stage
    })

    // Update session in database
    await updateSession(supabaseClient, session, response.stage, response.data)

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Orchestrator error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

// =====================================================
// Session Management
// =====================================================

async function loadSession(supabase: any, sessionId: string): Promise<SessionState | null> {
  const { data, error } = await supabase
    .from('campaign_builder_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (error || !data) {
    console.error('Session load error:', error)
    return null
  }

  return {
    id: data.id,
    orgId: data.org_id,
    userId: data.user_id,
    currentStage: data.current_stage,
    status: data.status,
    campaignGoal: data.campaign_goal,
    researchFindings: data.research_findings,
    selectedPositioning: data.selected_positioning,
    selectedApproach: data.selected_approach,
    blueprint: data.blueprint,
    conversationHistory: data.conversation_history || [],
    createdAt: data.created_at,
    updatedAt: data.updated_at
  }
}

async function createSession(
  supabase: any,
  orgId: string,
  userId: string | undefined,
  campaignGoal: string
): Promise<SessionState> {
  const session: Partial<SessionState> = {
    orgId,
    userId,
    currentStage: 'intent',
    status: 'active',
    campaignGoal,
    conversationHistory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('campaign_builder_sessions')
    .insert({
      org_id: session.orgId,
      user_id: session.userId,
      current_stage: session.currentStage,
      status: session.status,
      campaign_goal: session.campaignGoal,
      conversation_history: session.conversationHistory,
      created_at: session.createdAt,
      updated_at: session.updatedAt
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create session: ${error.message}`)
  }

  return {
    ...session,
    id: data.id
  } as SessionState
}

async function updateSession(
  supabase: any,
  session: SessionState,
  newStage: CampaignStage,
  stageData?: any
): Promise<void> {
  const updates: any = {
    current_stage: newStage,
    conversation_history: session.conversationHistory,
    updated_at: new Date().toISOString()
  }

  // Update stage-specific data
  if (newStage === 'research' && stageData) {
    updates.research_findings = stageData
  } else if (newStage === 'positioning' && stageData) {
    updates.selected_positioning = stageData
  } else if (newStage === 'approach' && stageData) {
    updates.selected_approach = stageData
  } else if (newStage === 'blueprint' && stageData) {
    updates.blueprint = stageData
  }

  if (newStage === 'execution') {
    updates.status = 'completed'
    updates.completed_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('campaign_builder_sessions')
    .update(updates)
    .eq('id', session.id)

  if (error) {
    console.error('Session update error:', error)
    throw new Error(`Failed to update session: ${error.message}`)
  }
}

// =====================================================
// Stage Handlers
// =====================================================

async function handleIntentStage(
  supabase: any,
  session: SessionState,
  message: string
): Promise<OrchestratorResponse> {
  // Intent stage: Clarify campaign goal and gather initial context

  // Check if we have enough information to proceed to research
  const hasGoal = session.campaignGoal && session.campaignGoal.length > 20
  const conversationDepth = session.conversationHistory.filter(m => m.stage === 'intent').length

  // If we have a goal and NO research has been started yet, TRIGGER RESEARCH
  if (hasGoal && !session.researchFindings && conversationDepth <= 2) {
    console.log('🚀 Triggering async research via separate function call...')

    // Call research function asynchronously (fire and forget)
    fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/niv-campaign-builder-research`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify({
        sessionId: session.id,
        campaignGoal: session.campaignGoal,
        orgId: session.orgId
      })
    }).catch(error => {
      console.error('Failed to trigger research:', error)
    })

    // Return immediately - frontend will poll for results
    return {
      sessionId: session.id,
      stage: 'research',
      message: `Great! I'm conducting comprehensive research for your campaign: "${session.campaignGoal}"\n\nI'm analyzing:\n\n1. **Organization Context** - Your competitive landscape\n2. **Stakeholder Intelligence** - Target audience psychology\n3. **Narrative Environment** - Current conversations and trends\n4. **Channel Intelligence** - Media landscape mapping\n5. **Historical Patterns** - What has worked before\n\n*Research in progress - this will take about 2-3 minutes...*`,
      requiresInput: false,
      data: { status: 'processing' }
    }
  }

  // If goal is clear after refinement, move to research
  if (hasGoal && conversationDepth >= 2) {
    return {
      sessionId: session.id,
      stage: 'research',
      message: `Great! I have a clear understanding of your campaign goal: "${session.campaignGoal}"\n\nI'm now going to conduct comprehensive research across 6 dimensions:\n\n1. **Organization Context** - Your brand, reputation, competitive landscape\n2. **Stakeholder Intelligence** - Key audiences and their psychology\n3. **Narrative Environment** - Current conversations and trends\n4. **Channel Intelligence** - Media landscape and outlet mapping\n5. **Historical Patterns** - What has worked before\n6. **Competitive Movements** - What competitors are doing\n\nThis will take about 30-60 seconds. Shall I proceed?`,
      requiresInput: true,
      data: null
    }
  }

  // Need more clarification - use simple refinement logic
  const clarifyingQuestions = [
    "Could you tell me more about what success looks like for this campaign?",
    "Who are the key audiences you're trying to reach?",
    "What's the timeline you're working with?",
    "Are there any specific challenges or constraints I should know about?"
  ]

  const nextQuestion = clarifyingQuestions[Math.min(conversationDepth, clarifyingQuestions.length - 1)]

  return {
    sessionId: session.id,
    stage: 'intent',
    message: `I'm helping you develop a campaign strategy. ${nextQuestion}`,
    requiresInput: true,
    data: null
  }
}

// Extracted research pipeline function
async function runResearchPipeline(session: SessionState): Promise<OrchestratorResponse> {
  // Follow Enhanced MCP Architecture pattern: Direct MCP tool calls, then synthesis
  console.log('🚀 Starting research pipeline...')

  try {
    const orgContext = {
      name: 'OpenAI', // TODO: Get from session
      industry: 'Artificial Intelligence' // TODO: Get from session
    }

    // STEP 1: Organization Discovery (baseline - always run first)
    console.log('📋 Step 1: Organization discovery...')
    const discoveryResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/mcp-discovery`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify({
          organization: orgContext.name,
          industry_hint: orgContext.industry
        })
      }
    )

    if (!discoveryResponse.ok) {
      throw new Error(`Discovery failed: ${discoveryResponse.status}`)
    }

    const discoveryData = await discoveryResponse.json()
    console.log('✅ Organization profile created')

    // STEP 2: Parallel MCP tool calls based on campaign needs
    console.log('🔍 Step 2: Gathering intelligence across dimensions...')

    const researchCalls = await Promise.allSettled([
      // Stakeholder Intelligence: Recent stakeholder activity
      fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/niv-fireplexity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify({
          query: `${orgContext.name} ${orgContext.industry} stakeholders customers target audience`,
          searchMode: 'focused',
          organizationId: orgContext.name,
          context: { tbs: 'qdr:w' } // Past week
        })
      }).then(r => r.json()).then(d => ({ type: 'stakeholder', data: d })),

      // Narrative Environment: Current discourse
      fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/niv-fireplexity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify({
          query: `${orgContext.industry} trends narrative discourse 2025`,
          searchMode: 'focused',
          organizationId: orgContext.name,
          context: { tbs: 'qdr:w' } // Past week
        })
      }).then(r => r.json()).then(d => ({ type: 'narrative', data: d })),

      // Channel Intelligence: Journalists and sources
      fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/journalist-registry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify({
          industry: orgContext.industry,
          tier: 'tier1',
          count: 20
        })
      }).then(r => r.json()).then(d => ({ type: 'channel', data: d })),

      // Historical Patterns: Successful campaigns
      fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/knowledge-library-registry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify({
          pattern: 'CASCADE', // Request CASCADE pattern knowledge
          research_area: 'case_studies',
          tags: [orgContext.industry, 'successful_campaigns', 'pr_campaigns']
        })
      }).then(r => r.json()).then(d => ({ type: 'historical', data: d }))
    ])

    // Collect results
    const gatheredData: any = {
      discovery: discoveryData,
      stakeholder: [],
      narrative: [],
      channel: [],
      historical: []
    }

    researchCalls.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        const { type, data } = result.value as any
        gatheredData[type] = data
      } else {
        console.warn(`Research call ${idx} failed:`, result.reason)
      }
    })

    console.log('✅ Intelligence gathered')

    // STEP 3: Synthesize into CampaignIntelligenceBrief
    console.log('🧪 Step 3: Synthesizing intelligence brief...')
    const synthesisResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/niv-campaign-research-synthesis`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify({
          compiledResearch: gatheredData,
          campaignGoal: session.campaignGoal,
          organizationContext: orgContext
        })
      }
    )

    if (!synthesisResponse.ok) {
      throw new Error(`Synthesis failed: ${synthesisResponse.status}`)
    }

    const synthesisData = await synthesisResponse.json()
    const intelligenceBrief = synthesisData.campaignIntelligenceBrief

    console.log('✅ Research pipeline complete')

    // Format research findings for presentation
    const formattedFindings = formatResearchFindings(intelligenceBrief)

    return {
      sessionId: session.id,
      stage: 'research', // ← Return 'research' stage so frontend shows ResearchPresentation
      message: formattedFindings,
      data: intelligenceBrief,
      requiresInput: true
    }
  } catch (error) {
    console.error('Research pipeline error:', error)

    // Return a graceful error message to user
    return {
      sessionId: session.id,
      stage: 'intent',
      message: `I encountered an issue during research: ${error.message}\n\nFor now, let me help you proceed manually. Based on your campaign goal: "${session.campaignGoal}"\n\nWhat specific aspects would you like to focus on? (e.g., target audiences, competitive landscape, messaging strategy)`,
      requiresInput: true,
      data: null
    }
  }
}

async function handleResearchStage(
  supabase: any,
  session: SessionState,
  message: string
): Promise<OrchestratorResponse> {
  // Check if this is a status check poll
  if (message.toLowerCase().includes('check research status')) {
    // IMPORTANT: Reload session from database to get fresh research_findings
    // The async research function may have completed and saved results
    const freshSession = await loadSession(supabase, session.id)

    if (freshSession?.researchFindings) {
      // Research is complete - format and return
      const formattedFindings = formatResearchFindings(freshSession.researchFindings)

      return {
        sessionId: session.id,
        stage: 'research',
        message: formattedFindings,
        data: freshSession.researchFindings,
        requiresInput: true
      }
    } else {
      // Still processing
      return {
        sessionId: session.id,
        stage: 'research',
        message: 'Research in progress...',
        data: { status: 'processing' },
        requiresInput: false
      }
    }
  }

  // Check if user is requesting refinement or confirming to start research
  const isConfirmation = message.toLowerCase().includes('yes') ||
                        message.toLowerCase().includes('proceed') ||
                        message.toLowerCase().includes('go ahead')

  if (isConfirmation && !session.researchFindings) {
    return await runResearchPipeline(session)
  }

  // User wants to refine research
  if (session.researchFindings) {
    console.log('Refining research based on user input...')

    const researchResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/niv-campaign-research-orchestrator`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify({
          organizationId: session.orgId,
          campaignGoal: session.campaignGoal,
          organizationContext: {
            name: 'OpenAI', // TODO: Get from session
            industry: 'Artificial Intelligence' // TODO: Get from session
          },
          refinementRequest: message
        })
      }
    )

    const researchData = await researchResponse.json()

    // Extract the campaignIntelligenceBrief from the response
    const intelligenceBrief = researchData.campaignIntelligenceBrief || researchData

    const formattedFindings = formatResearchFindings(intelligenceBrief)

    return {
      sessionId: session.id,
      stage: 'positioning',
      message: `Here's the updated research based on your input:\n\n${formattedFindings}`,
      data: intelligenceBrief,
      requiresInput: true
    }
  }

  // Shouldn't get here but handle gracefully
  return {
    sessionId: session.id,
    stage: 'research',
    message: 'Let me know when you\'re ready to proceed with the research.',
    requiresInput: true,
    data: null
  }
}

async function handlePositioningStage(
  supabase: any,
  session: SessionState,
  message: string
): Promise<OrchestratorResponse> {
  // Present positioning options based on research

  if (!session.selectedPositioning) {
    // Call AI positioning generator
    console.log('Calling niv-campaign-positioning...')

    const positioningResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/niv-campaign-positioning`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify({
          researchData: session.researchFindings,
          campaignGoal: session.campaignGoal
        })
      }
    )

    if (!positioningResponse.ok) {
      throw new Error('Positioning generation failed')
    }

    const positioningData = await positioningResponse.json()
    const positioningOptions = positioningData.options

    // Format options for display
    const optionsText = positioningOptions.map((opt: any) =>
      `**${opt.id}. ${opt.name}**\n_${opt.tagline}_\n\n${opt.description}\n\n**Why this works:** ${opt.rationale}\n\n**Target Audiences:** ${opt.targetAudiences.join(', ')}\n\n**Key Differentiators:** ${opt.differentiators.join(', ')}\n\n**Confidence Score:** ${opt.confidenceScore}/100`
    ).join('\n\n---\n\n')

    return {
      sessionId: session.id,
      stage: 'positioning',
      message: `Based on the research, I've generated three strategic positioning options for your campaign:\n\n${optionsText}\n\n---\n\n**Recommendation:** ${positioningData.recommendation}\n\nWhich positioning resonates most with your goals? (Reply with the number 1-3, or ask me to refine/explain any option)`,
      options: positioningOptions,
      requiresInput: true,
      data: positioningData
    }
  }

  // User has selected positioning or requesting refinement
  const selectedNumber = parseInt(message)

  if (selectedNumber >= 1 && selectedNumber <= 3) {
    const selected = {
      id: selectedNumber,
      userInput: message
    }

    return {
      sessionId: session.id,
      stage: 'approach',
      message: `Excellent choice! Now let's determine the right approach for executing this positioning.\n\nI can create two types of campaigns:\n\n**1. PR Campaign (Traditional)**\n• Press releases and media outreach\n• Spokesperson positioning\n• Event-based awareness building\n• Standard media relations tactics\n• Simpler execution, narrower reach\n\n**2. VECTOR Campaign (Advanced)**\n• Multi-stakeholder orchestration\n• Deep psychological mapping\n• Sequential engagement strategy\n• Coordinated multi-channel execution\n• Comprehensive influence architecture\n\nWhich approach would you like? (Reply with "PR" or "VECTOR", or ask questions about either)`,
      data: selected,
      requiresInput: true
    }
  }

  // User wants clarification or refinement - regenerate positioning with their feedback
  console.log('Refining positioning options based on user input...')

  const positioningResponse = await fetch(
    `${Deno.env.get('SUPABASE_URL')}/functions/v1/niv-campaign-positioning`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify({
        researchData: session.researchFindings,
        campaignGoal: session.campaignGoal,
        refinementRequest: message
      })
    }
  )

  if (!positioningResponse.ok) {
    throw new Error('Positioning refinement failed')
  }

  const positioningData = await positioningResponse.json()
  const positioningOptions = positioningData.options

  // Format options for display
  const optionsText = positioningOptions.map((opt: any) =>
    `**${opt.id}. ${opt.name}**\n_${opt.tagline}_\n\n${opt.description}\n\n**Why this works:** ${opt.rationale}\n\n**Target Audiences:** ${opt.targetAudiences.join(', ')}\n\n**Key Differentiators:** ${opt.differentiators.join(', ')}\n\n**Confidence Score:** ${opt.confidenceScore}/100`
  ).join('\n\n---\n\n')

  return {
    sessionId: session.id,
    stage: 'positioning',
    message: `I've refined the positioning options based on your feedback:\n\n${optionsText}\n\n---\n\n**Recommendation:** ${positioningData.recommendation}\n\nWhich positioning resonates most with your goals? (Reply with the number 1-3, or ask for further refinements)`,
    options: positioningOptions,
    requiresInput: true,
    data: positioningData
  }
}

async function handleApproachStage(
  supabase: any,
  session: SessionState,
  message: string
): Promise<OrchestratorResponse> {
  // User selects PR Campaign or VECTOR Campaign

  const messageLower = message.toLowerCase()

  if (messageLower.includes('pr') && !messageLower.includes('vector')) {
    return {
      sessionId: session.id,
      stage: 'blueprint',
      message: `Perfect! I'll create a **PR Campaign** blueprint for you.\n\nThis will include:\n• Press release strategy\n• Media targeting and outreach plan\n• Spokesperson positioning\n• Key messages and talking points\n• Timeline and milestones\n\nGenerating your blueprint now... (30 seconds)`,
      data: 'PR_CAMPAIGN',
      requiresInput: false
    }
  }

  if (messageLower.includes('vector')) {
    return {
      sessionId: session.id,
      stage: 'blueprint',
      message: `Excellent! I'll create a comprehensive **VECTOR Campaign** blueprint.\n\nThis will include:\n\n**Part 1: Campaign Goal & Success Framework**\n• Objectives and KPIs\n• Success metrics\n• Risk assessment\n\n**Part 2: Stakeholder Mapping**\n• Deep psychological profiles\n• Information diet analysis\n• Decision triggers and barriers\n• Current perceptions\n\n**Part 3: Sequential Communications Strategy**\n• Phase-by-phase approach (Awareness → Consideration → Conversion → Advocacy)\n• Group-specific messaging\n• Channel orchestration\n• Engagement sustainability\n\n**Part 4: Tactical Execution Plan**\n• Content requirements\n• Timeline and dependencies\n• Resource allocation\n• Measurement framework\n\nGenerating your comprehensive blueprint now... (45-60 seconds)`,
      data: 'VECTOR_CAMPAIGN',
      requiresInput: false
    }
  }

  // User has questions
  return {
    sessionId: session.id,
    stage: 'approach',
    message: `I can help you decide between PR Campaign and VECTOR Campaign approaches. What questions do you have?`,
    requiresInput: true,
    data: null
  }
}

async function handleBlueprintStage(
  supabase: any,
  session: SessionState,
  message: string
): Promise<OrchestratorResponse> {
  // Generate and present blueprint

  // Check if this is a status check poll
  if (message.toLowerCase().includes('check blueprint status')) {
    // Reload session from database to get fresh blueprint
    const freshSession = await loadSession(supabase, session.id)

    if (freshSession?.blueprint) {
      // Blueprint is complete - format and return
      const formattedBlueprint = formatBlueprint(freshSession.blueprint, freshSession.selectedApproach || 'PR_CAMPAIGN')

      return {
        sessionId: session.id,
        stage: 'blueprint',
        message: `Your ${freshSession.selectedApproach === 'PR_CAMPAIGN' ? 'PR Campaign' : 'VECTOR Campaign'} blueprint is ready!\n\n${formattedBlueprint}\n\n---\n\nYou can now:\n• Request refinements to any section\n• Export the blueprint\n• Begin execution\n\nWhat would you like to do?`,
        data: freshSession.blueprint,
        requiresInput: true,
        completed: true
      }
    } else {
      // Still processing
      return {
        sessionId: session.id,
        stage: 'blueprint',
        message: 'Blueprint generation in progress...',
        data: { status: 'processing' },
        requiresInput: false
      }
    }
  }

  const isRefinement = session.blueprint && message.toLowerCase().includes('refine')

  if (!session.blueprint || isRefinement) {
    const blueprintType = session.selectedApproach || 'PR_CAMPAIGN'

    // Trigger async blueprint generation (fire and forget)
    if (blueprintType === 'VECTOR_CAMPAIGN') {
      console.log('🚀 Triggering async VECTOR blueprint generation...')

      fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/niv-blueprint-orchestrator-v3`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify({
          sessionId: session.id,
          researchData: session.researchFindings,
          selectedPositioning: session.selectedPositioning,
          campaignGoal: session.campaignGoal,
          orgId: session.orgId
        })
      }).catch(error => {
        console.error('Failed to trigger blueprint generation:', error)
      })

      // Return immediately - frontend will poll for results
      return {
        sessionId: session.id,
        stage: 'blueprint',
        message: `Excellent! I'm now generating your comprehensive **VECTOR Campaign** blueprint.\n\nThis will include:\n\n**Part 1: Campaign Goal & Success Framework**\n• Objectives and KPIs\n• Success metrics\n• Risk assessment\n\n**Part 2: Stakeholder Mapping**\n• Deep psychological profiles\n• Information diet analysis\n• Decision triggers and barriers\n\n**Part 3: Tactical Orchestration**\n• Four-pillar execution strategy\n• Phase-by-phase approach\n• Channel orchestration\n\n**Part 4: Pattern Guidance**\n• CASCADE, CONVERGENCE, or SIEGE pattern\n• Strategic recommendations\n\n*Generation in progress - this will take about 90-110 seconds...*`,
        requiresInput: false,
        data: { status: 'processing' }
      }
    } else {
      // PR campaigns use single function
      const edgeFunction = 'niv-campaign-pr-blueprint'
      console.log(`Calling ${edgeFunction}...`)

      const blueprintResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/${edgeFunction}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify({
            researchData: session.researchFindings,
            campaignGoal: session.campaignGoal,
            selectedPositioning: session.selectedPositioning,
            refinementRequest: isRefinement ? message : undefined
          })
        }
      )

      if (!blueprintResponse.ok) {
        throw new Error('Blueprint generation failed')
      }

      const blueprintData = await blueprintResponse.json()
    }

    // Save to Memory Vault
    try {
      await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/niv-campaign-memory?action=save-blueprint`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify({
            blueprintId: session.id,
            blueprint: blueprintData,
            campaignType: blueprintType,
            orgId: session.orgId,
            sessionData: {
              campaignGoal: session.campaignGoal,
              researchFindings: session.researchFindings,
              selectedPositioning: session.selectedPositioning
            },
            metadata: {
              pattern: blueprintData.overview?.pattern,
              timelineWeeks: estimateTimelineWeeks(blueprintData)
            }
          })
        }
      )
      console.log('✨ Blueprint saved to Memory Vault')
    } catch (memoryError) {
      console.error('Memory Vault save failed (non-critical):', memoryError)
    }

    // Format blueprint for display
    const formattedBlueprint = formatBlueprint(blueprintData, blueprintType)

    return {
      sessionId: session.id,
      stage: 'execution',
      message: `Your ${blueprintType === 'PR_CAMPAIGN' ? 'PR Campaign' : 'VECTOR Campaign'} blueprint is ready!\n\n${formattedBlueprint}\n\n---\n\nYou can now:\n• Request refinements to any section\n• Export the blueprint\n• Begin execution\n• Go back to change positioning or approach\n\nWhat would you like to do?`,
      data: blueprintData,
      requiresInput: true,
      completed: true
    }
  }

  // User wants to refine - trigger regeneration
  return {
    sessionId: session.id,
    stage: 'blueprint',
    message: `I can refine any aspect of the blueprint. What would you like me to adjust?`,
    requiresInput: true,
    data: null
  }
}

async function handleExecutionStage(
  supabase: any,
  session: SessionState,
  message: string
): Promise<OrchestratorResponse> {
  // Execution stage - user can export, execute, or refine

  return {
    sessionId: session.id,
    stage: 'execution',
    message: `Your campaign blueprint is complete and ready for execution. You can:\n\n• Export blueprint as PDF\n• Begin creating content\n• Set up monitoring\n• Refine any section\n• Start a new campaign\n\nWhat would you like to do?`,
    requiresInput: true,
    completed: true,
    data: null
  }
}

// =====================================================
// Helper Functions
// =====================================================

function formatResearchFindings(research: any): string {
  const stakeholderCount = research.stakeholders?.length || 0
  const narrativeCount = research.narrativeLandscape?.dominantNarratives?.length || 0
  const journalistCount = research.channelIntelligence?.journalists?.length || 0
  const competitorCount = research.competitiveMovements?.length || 0

  return `# Campaign Research Complete

I've analyzed your campaign across 6 key dimensions:

## 1. Organization Context
**Industry:** ${research.organizationProfile?.industry || 'N/A'}
**Competitors Identified:** ${research.organizationProfile?.competitors?.length || 0}
**Key Stakeholders:** ${research.organizationProfile?.stakeholders?.length || 0}

## 2. Stakeholder Intelligence
Analyzed **${stakeholderCount} stakeholder groups** including:
${research.stakeholders?.slice(0, 3).map((s: any) => `• ${s.name} - ${s.currentPerceptions?.ofOrganization || 'Profiled'}`).join('\n') || '• Analysis complete'}

## 3. Narrative Environment
Found **${narrativeCount} dominant narratives** in your industry:
${research.narrativeLandscape?.dominantNarratives?.slice(0, 3).map((n: string) => `• ${n}`).join('\n') || '• Analysis complete'}

## 4. Channel Intelligence
**Journalists:** ${journalistCount} tier-1 contacts identified
**Sources:** ${research.channelIntelligence?.sources?.length || 0} industry outlets mapped
**Channels Mapped:** LinkedIn, Twitter, Industry Publications

## 5. Historical Patterns
${research.historicalInsights?.patternRecommendations?.slice(0, 3).map((p: string) => `• ${p}`).join('\n') || '• Analysis complete'}

## 6. Competitive Movements
Tracked **${competitorCount} competitors** with recent activity
${research.competitiveMovements?.slice(0, 2).map((c: any) => `• ${c.competitor}: ${c.recentMoves?.length || 0} recent moves`).join('\n') || '• Analysis complete'}

---

**Processing Time:** ${research.metadata?.processingTime ? `${(research.metadata.processingTime / 1000).toFixed(1)}s` : 'N/A'}

Based on this research, I'll now present positioning options. Would you like me to proceed, or would you like to refine any area of research first?`
}

function formatBlueprint(blueprint: any, blueprintType: string): string {
  if (blueprintType === 'PR_CAMPAIGN') {
    return formatPRBlueprint(blueprint)
  } else {
    return formatVECTORBlueprint(blueprint)
  }
}

function formatPRBlueprint(blueprint: any): string {
  const b = blueprint

  let formatted = `# ${b.overview?.campaignName || 'PR Campaign Blueprint'}\n\n`
  formatted += `_${b.overview?.tagline || ''}_\n\n`
  formatted += `**Duration:** ${b.overview?.duration || 'N/A'} | **Budget:** ${b.overview?.budget || 'N/A'}\n\n`
  formatted += `**Objective:** ${b.overview?.objective || 'N/A'}\n\n`
  formatted += `---\n\n`

  // Press Release Strategy
  formatted += `## Press Release Strategy\n\n`
  if (b.pressReleaseStrategy?.primaryRelease) {
    const pr = b.pressReleaseStrategy.primaryRelease
    formatted += `### Primary Release\n`
    formatted += `**Headline:** ${pr.headline || 'N/A'}\n\n`
    formatted += `**Angle:** ${pr.angle || 'N/A'}\n\n`
    formatted += `**Timing:** ${pr.timing || 'N/A'}\n\n`
    formatted += `**Key Hooks:**\n${(pr.hooks || []).map((h: string) => `• ${h}`).join('\n')}\n\n`
  }

  if (b.pressReleaseStrategy?.followUpReleases?.length > 0) {
    formatted += `### Follow-Up Releases\n`
    b.pressReleaseStrategy.followUpReleases.forEach((fr: any) => {
      formatted += `• **${fr.headline}** (${fr.timing}): ${fr.angle}\n`
    })
    formatted += `\n`
  }

  // Media Targeting
  formatted += `## Media Targeting\n\n`
  if (b.mediaTargeting?.tier1Outlets?.length > 0) {
    formatted += `### Tier 1 Outlets (Priority)\n`
    b.mediaTargeting.tier1Outlets.forEach((outlet: any) => {
      formatted += `• **${outlet.outlet}** - ${outlet.journalist || 'N/A'}\n  _${outlet.angle}_\n  Timing: ${outlet.timing}\n\n`
    })
  }

  if (b.mediaTargeting?.tier2Outlets?.length > 0) {
    formatted += `### Tier 2 Outlets\n${b.mediaTargeting.tier2Outlets.map((o: string) => `• ${o}`).join('\n')}\n\n`
  }

  // Spokesperson
  formatted += `## Spokesperson Positioning\n\n`
  if (b.spokespersonPositioning) {
    const sp = b.spokespersonPositioning
    formatted += `**Role:** ${sp.primarySpokesperson || 'N/A'}\n\n`
    formatted += `**Expertise:** ${sp.expertise || 'N/A'}\n\n`
    formatted += `**Talking Points:**\n${(sp.talkingPoints || []).map((p: string) => `• ${p}`).join('\n')}\n\n`
  }

  // Key Messages
  formatted += `## Key Messages\n\n`
  if (b.keyMessages) {
    formatted += `**Primary Message:** ${b.keyMessages.primary || 'N/A'}\n\n`
    if (b.keyMessages.supporting?.length > 0) {
      formatted += `**Supporting Messages:**\n${b.keyMessages.supporting.map((m: string) => `• ${m}`).join('\n')}\n\n`
    }
    if (b.keyMessages.proofPoints?.length > 0) {
      formatted += `**Proof Points:**\n${b.keyMessages.proofPoints.map((p: string) => `• ${p}`).join('\n')}\n\n`
    }
  }

  // Timeline
  formatted += `## Timeline\n\n`
  if (b.timeline) {
    Object.entries(b.timeline).forEach(([week, tasks]: [string, any]) => {
      formatted += `**${week.replace(/([A-Z])/g, ' $1').trim()}:**\n${(Array.isArray(tasks) ? tasks : [tasks]).map((t: string) => `• ${t}`).join('\n')}\n\n`
    })
  }

  // Success Metrics
  formatted += `## Success Metrics\n\n`
  if (b.successMetrics) {
    Object.entries(b.successMetrics).forEach(([key, value]: [string, any]) => {
      const label = key.replace(/([A-Z])/g, ' $1').trim()
      formatted += `• **${label}:** ${value}\n`
    })
    formatted += `\n`
  }

  return formatted
}

function estimateTimelineWeeks(blueprint: any): number {
  const duration = blueprint.overview?.duration || ''
  const weekMatch = duration.match(/(\d+)/)
  return weekMatch ? parseInt(weekMatch[1]) : 8
}

function formatVECTORBlueprint(blueprint: any): string {
  const b = blueprint

  let formatted = `# ${b.overview?.campaignName || 'VECTOR Campaign Blueprint'}\n\n`
  formatted += `**Pattern:** ${b.overview?.pattern || 'N/A'} | **Duration:** ${b.overview?.duration || 'N/A'} | **Complexity:** ${b.overview?.complexity || 'N/A'}\n\n`
  formatted += `**Objective:** ${b.overview?.objective || 'N/A'}\n\n`
  formatted += `---\n\n`

  // Part 1: Goal Framework
  formatted += `## Part 1: Campaign Goal & Success Framework\n\n`
  if (b.part1_goalFramework) {
    const gf = b.part1_goalFramework
    formatted += `**Primary Objective:** ${gf.primaryObjective || 'N/A'}\n\n`

    if (gf.behavioralGoals?.length > 0) {
      formatted += `### Behavioral Goals\n`
      gf.behavioralGoals.forEach((goal: any) => {
        formatted += `**${goal.stakeholder}**\n`
        formatted += `• Desired Behavior: ${goal.desiredBehavior}\n`
        formatted += `• Current State: ${goal.currentState}\n`
        formatted += `• Success Metric: ${goal.successMetric}\n\n`
      })
    }

    if (gf.kpis?.length > 0) {
      formatted += `**KPIs:** ${gf.kpis.join(', ')}\n\n`
    }

    if (gf.riskAssessment?.length > 0) {
      formatted += `### Risk Assessment\n`
      gf.riskAssessment.forEach((risk: any) => {
        formatted += `• **${risk.risk}** (${risk.probability})\n  Mitigation: ${risk.mitigation}\n\n`
      })
    }
  }

  // Part 2: Stakeholder Mapping
  formatted += `## Part 2: Stakeholder Mapping\n\n`
  if (b.part2_stakeholderMapping?.groups?.length > 0) {
    b.part2_stakeholderMapping.groups.forEach((group: any) => {
      formatted += `### ${group.name}\n`
      formatted += `**Size:** ${group.size || 'N/A'}\n\n`

      if (group.psychologicalProfile) {
        const pp = group.psychologicalProfile
        formatted += `**Psychological Profile:**\n`
        formatted += `• Values: ${(pp.values || []).join(', ')}\n`
        formatted += `• Fears: ${(pp.fears || []).join(', ')}\n`
        formatted += `• Aspirations: ${(pp.aspirations || []).join(', ')}\n`
        formatted += `• Decision Drivers: ${(pp.decisionDrivers || []).join(', ')}\n\n`
      }

      if (group.informationDiet) {
        formatted += `**Information Diet:**\n`
        formatted += `• Sources: ${(group.informationDiet.primarySources || []).join(', ')}\n`
        formatted += `• Trusted Voices: ${(group.informationDiet.trustedVoices || []).join(', ')}\n\n`
      }

      formatted += `**Current → Target Perception:** ${group.currentPerception || 'N/A'} → ${group.targetPerception || 'N/A'}\n\n`
    })
  }

  // Part 3: Sequential Strategy
  formatted += `## Part 3: Sequential Communications Strategy\n\n`
  const phases = ['phase1_awareness', 'phase2_consideration', 'phase3_conversion', 'phase4_advocacy']
  const phaseLabels = ['Phase 1: Awareness', 'Phase 2: Consideration', 'Phase 3: Conversion', 'Phase 4: Advocacy']

  phases.forEach((phaseKey, idx) => {
    const phase = b.part3_sequentialStrategy?.[phaseKey]
    if (phase) {
      formatted += `### ${phaseLabels[idx]}\n`
      formatted += `**Objective:** ${phase.objective || 'N/A'}\n`
      formatted += `**Duration:** ${phase.duration || 'N/A'}\n\n`

      if (phase.tactics?.length > 0) {
        formatted += `**Tactics:**\n`
        phase.tactics.forEach((tactic: any) => {
          formatted += `• **${tactic.stakeholder}:** ${tactic.message}\n`
          formatted += `  Channels: ${(tactic.channels || []).join(', ')}\n`
          formatted += `  Content: ${(tactic.content || []).join(', ')}\n`
          formatted += `  Expected Outcome: ${tactic.expectedOutcome}\n\n`
        })
      }

      formatted += `**Convergence Point:** ${phase.convergencePoint || 'N/A'}\n\n`
    }
  })

  // Part 4: Tactical Execution
  formatted += `## Part 4: Tactical Execution Plan\n\n`
  if (b.part4_tacticalExecution) {
    const te = b.part4_tacticalExecution

    if (te.contentRequirements?.length > 0) {
      formatted += `### Content Requirements\n`
      te.contentRequirements.forEach((req: any) => {
        formatted += `• **${req.type}** (${req.quantity}) - ${req.stakeholder} - ${req.phase}\n`
        formatted += `  ${req.specifications}\n\n`
      })
    }

    if (te.resourceAllocation) {
      formatted += `### Resource Allocation\n`
      Object.entries(te.resourceAllocation).forEach(([key, value]: [string, any]) => {
        const label = key.replace(/([A-Z])/g, ' $1').trim()
        formatted += `• **${label}:** ${value}\n`
      })
      formatted += `\n`
    }

    if (te.measurement) {
      formatted += `### Measurement Framework\n`
      formatted += `• **Real-time:** ${(te.measurement.realtime || []).join(', ')}\n`
      formatted += `• **Weekly:** ${(te.measurement.weekly || []).join(', ')}\n`
      formatted += `• **Overall:** ${(te.measurement.overall || []).join(', ')}\n\n`
    }
  }

  return formatted
}
