import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { generateDefaultFramework } from './default-framework.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || Deno.env.get('CLAUDE_API_KEY')

console.log("NIV Strategic Framework Generator starting...")
console.log(`🔑 API Key Status: ${ANTHROPIC_API_KEY ? 'Found' : 'NOT FOUND'}`)
console.log(`🔑 Key length: ${ANTHROPIC_API_KEY ? ANTHROPIC_API_KEY.length : 0}`)

// Strategic Framework Generation System Prompt
const STRATEGIC_FRAMEWORK_PROMPT = `You are NIV's Strategic Framework Generator. Your job is to create COMPLETE strategic frameworks ready for immediate execution.

REQUIRED STRUCTURE - ALL FIELDS MUST BE POPULATED:

{
  "strategy": {
    "objective": "Clear, specific, measurable goal (never use TBD)",
    "narrative": "Complete core narrative/story (2-3 paragraphs minimum)",
    "proof_points": ["Specific evidence point 1", "Data point 2", "Example 3"],
    "rationale": "Why this strategy works (detailed explanation)",
    "keyMessages": ["Key message 1", "Key message 2", "Key message 3"],
    "target_audiences": ["Specific audience 1", "Specific audience 2", "Specific audience 3"]
  },

  "media_targets": {
    "tier_1_targets": ["Top tier outlet 1", "Top tier outlet 2", "Top tier outlet 3"],
    "tier_2_targets": ["Secondary outlet 1", "Secondary outlet 2"],
    "tier_3_targets": ["Supporting outlet 1", "Supporting outlet 2"]
  },

  "timeline_execution": {
    "immediate": ["Immediate action 1", "Immediate action 2"],
    "short_term": ["Week 1-2 action 1", "Week 1-2 action 2"],
    "long_term": ["Month 1-3 milestone 1", "Month 1-3 milestone 2"]
  },

  "content_needs": {
    "priority_content": [
      "Press release announcing [specific thing]",
      "Thought leadership article on [specific topic]",
      "Case study demonstrating [specific outcome]",
      "Media pitch for [specific angle]",
      "Social media posts highlighting [specific benefit]"
    ]
  },

  "contentStrategy": {
    "subject": "What this framework is about (clear title)",
    "narrative": "Complete story (same as strategy.narrative)",
    "target_audiences": ["Same as strategy.target_audiences"],
    "key_messages": ["Same as strategy.keyMessages"],
    "media_targets": {
      "tier_1_targets": ["Same as media_targets.tier_1_targets"],
      "tier_2_targets": ["Same as media_targets.tier_2_targets"]
    },
    "timeline": "Execution timeline with specific dates/phases",
    "chosen_approach": "Strategic approach name",
    "kpis": [
      {"metric": "Media coverage", "target": "15+ tier 1 articles", "timeframe": "Q1"},
      {"metric": "Engagement", "target": "50k+ impressions", "timeframe": "Month 1"}
    ]
  },

  "executionPlan": {
    "autoExecutableContent": {
      "contentTypes": ["press-release", "thought-leadership", "case-study", "media-pitch", "media-list", "social-post"],
      "description": "Content pieces that will be auto-generated from this framework",
      "estimatedPieces": 6
    },
    "timeline": {
      "phases": [
        {"name": "Launch Phase", "duration": "Week 1-2", "objectives": ["Obj 1", "Obj 2"]},
        {"name": "Growth Phase", "duration": "Week 3-4", "objectives": ["Obj 1", "Obj 2"]}
      ],
      "milestones": ["Milestone 1", "Milestone 2", "Milestone 3"]
    }
  },

  "orchestration": {
    "components_to_activate": ["content_generation"],
    "workflow_type": "execution",
    "priority": "high"
  }
}

CRITICAL RULES:
1. NEVER use "TBD", "To be determined", or leave fields empty
2. Fill ALL fields with specific, actionable content
3. contentStrategy must duplicate key data from strategy section for content generator compatibility
4. autoExecutableContent.contentTypes must include at least 6 valid content type IDs: press-release, thought-leadership, case-study, media-pitch, media-list, social-post
5. Provide specific numbers, dates, and targets - not vague goals
6. Output ONLY valid JSON, no text before or after`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const {
      research,
      userQuery,
      organizationContext,
      conversationHistory,
      targetComponent
    } = await req.json()

    if (!research || !userQuery) {
      return new Response(
        JSON.stringify({ error: 'Research and user query are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log(`🎯 Generating strategic framework for: ${userQuery.substring(0, 100)}...`)
    console.log(`🏢 Organization: ${organizationContext?.organizationName || 'Unknown'}`)
    console.log(`🎯 Target component: ${targetComponent || 'auto-detect'}`)
    console.log(`📊 Research data received:`, {
      articles: research?.articles?.length || 0,
      synthesis: research?.synthesis?.length || 0,
      keyFindings: research?.keyFindings?.length || 0
    })

    // Log actual content samples
    if (research?.articles?.length > 0) {
      console.log(`📰 Sample article titles:`)
      research.articles.slice(0, 3).forEach((article: any, idx: number) => {
        console.log(`  ${idx + 1}. ${article.title || article.headline || 'Untitled'}`)
      })
    }

    if (research?.keyFindings?.length > 0) {
      console.log(`🔍 Sample key findings:`)
      research.keyFindings.slice(0, 3).forEach((finding: string, idx: number) => {
        console.log(`  ${idx + 1}. ${finding.substring(0, 100)}...`)
      })
    }

    if (research?.synthesis?.length > 0) {
      console.log(`📝 Synthesis preview: ${research.synthesis[0].substring(0, 200)}...`)
    }

    // Generate Discovery Context
    const discoveryContext = await generateDiscoveryContext(
      organizationContext,
      research,
      conversationHistory
    )

    // Generate Strategic Framework
    const framework = await generateStrategicFramework(
      research,
      userQuery,
      discoveryContext,
      targetComponent,
      conversationHistory
    )

    // Validate and enhance framework
    const validatedFramework = validateAndEnhanceFramework(framework, discoveryContext)

    console.log(`✅ Strategic framework generated successfully`)
    console.log(`📋 Objective: ${validatedFramework.strategy?.objective}`)
    console.log(`🎯 Target: ${validatedFramework.handoff?.targetComponent || validatedFramework.orchestration?.components_to_activate?.[0]}`)
    console.log(`📊 Framework contains:`, {
      articles: validatedFramework.intelligence?.supporting_data?.articles?.length || 0,
      keyFindings: validatedFramework.intelligence?.key_findings?.length || 0,
      synthesis: Array.isArray(validatedFramework.strategy?.rationale) ? validatedFramework.strategy.rationale.length : 1,
      hasIntelligence: !!validatedFramework.intelligence,
      hasStrategy: !!validatedFramework.strategy,
      hasTactics: !!validatedFramework.tactics,
      hasContentStrategy: !!validatedFramework.contentStrategy,
      hasExecutionPlan: !!validatedFramework.executionPlan,
      contentTypes: validatedFramework.executionPlan?.autoExecutableContent?.contentTypes?.length || 0
    })

    return new Response(
      JSON.stringify({
        success: true,
        framework: validatedFramework,
        discovery: discoveryContext,
        readyForHandoff: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Strategic Framework Generation error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

// Generate Discovery Context from research and organization data
async function generateDiscoveryContext(
  organizationContext: any,
  research: any,
  conversationHistory: any[]
): Promise<any> {
  console.log('📋 Generating discovery context...')

  // Extract user preferences from conversation history
  const extractedPreferences = extractUserPreferencesFromConversation(conversationHistory)

  // Extract organization profile
  const organization = {
    id: organizationContext?.organizationId || 'default',
    name: organizationContext?.organizationName || 'Organization',
    industry: organizationContext?.industry || 'technology',
    positioning: organizationContext?.positioning || 'Industry leader',
    strengths: organizationContext?.strengths || [],
    vulnerabilities: organizationContext?.vulnerabilities || [],
    currentNarratives: organizationContext?.narratives || []
  }

  // Extract competitive landscape from research
  const competitors = extractCompetitors(research)

  // Extract market environment
  const market = extractMarketEnvironment(research)

  // Build strategic assets
  const assets = {
    narratives: organization.currentNarratives,
    keyMessages: organizationContext?.keyMessages || [],
    channels: organizationContext?.channels || [],
    stakeholders: organizationContext?.stakeholders || [],
    mediaRelationships: []
  }

  // Extract history and patterns
  const history = {
    recentCampaigns: [],
    successPatterns: [],
    lessonsLearned: []
  }

  // Session context with full conversation history - merge extracted preferences with provided ones
  const session = {
    conversationId: organizationContext?.conversationId || generateId(),
    userIntent: extractUserIntent(conversationHistory),
    previousDecisions: extractDecisions(conversationHistory),
    constraints: extractConstraints(conversationHistory),
    conversationHistory: conversationHistory || [],
    userPreferences: {
      wants: [
        ...(organizationContext?.conceptState?.userPreferences?.wants || []),
        ...extractedPreferences.wants
      ],
      doesNotWant: [
        ...(organizationContext?.conceptState?.userPreferences?.doesNotWant || []),
        ...extractedPreferences.doesNotWant
      ],
      constraints: [
        ...(organizationContext?.conceptState?.userPreferences?.constraints || []),
        ...extractedPreferences.constraints
      ],
      examples: [
        ...(organizationContext?.conceptState?.userPreferences?.examples || []),
        ...extractedPreferences.examples
      ]
    },
    timestamp: new Date().toISOString()
  }

  return {
    organization,
    competitors,
    market,
    assets,
    history,
    session
  }
}

// Extract user preferences from conversation history
function extractUserPreferencesFromConversation(conversationHistory: any[]): any {
  const preferences = {
    wants: [] as string[],
    doesNotWant: [] as string[],
    constraints: [] as string[],
    examples: [] as string[]
  }

  if (!conversationHistory || conversationHistory.length === 0) {
    return preferences
  }

  conversationHistory.forEach((msg: any) => {
    const content = msg.content?.toLowerCase() || ''

    // Extract wants
    if (content.includes('i want') || content.includes('we need') || content.includes('looking for')) {
      const wantMatch = content.match(/(?:i want|we need|looking for)\s+([^.!?]+)/i)
      if (wantMatch) {
        preferences.wants.push(wantMatch[1].trim())
      }
    }

    // Extract doesn't wants
    if (content.includes("don't want") || content.includes('avoid') || content.includes('not interested')) {
      const dontWantMatch = content.match(/(?:don't want|avoid|not interested in)\s+([^.!?]+)/i)
      if (dontWantMatch) {
        preferences.doesNotWant.push(dontWantMatch[1].trim())
      }
    }

    // Extract constraints
    if (content.includes('must') || content.includes('requirement') || content.includes('constraint')) {
      const constraintMatch = content.match(/(?:must|requirement is|constraint is)\s+([^.!?]+)/i)
      if (constraintMatch) {
        preferences.constraints.push(constraintMatch[1].trim())
      }
    }

    // Extract examples
    if (content.includes('for example') || content.includes('like') || content.includes('such as')) {
      const exampleMatch = content.match(/(?:for example|like|such as)\s+([^.!?]+)/i)
      if (exampleMatch) {
        preferences.examples.push(exampleMatch[1].trim())
      }
    }
  })

  // Deduplicate
  preferences.wants = [...new Set(preferences.wants)]
  preferences.doesNotWant = [...new Set(preferences.doesNotWant)]
  preferences.constraints = [...new Set(preferences.constraints)]
  preferences.examples = [...new Set(preferences.examples)]

  return preferences
}

// Generate Strategic Framework using Claude
async function generateStrategicFramework(
  research: any,
  userQuery: string,
  discoveryContext: any,
  targetComponent?: string,
  conversationHistory?: any[]
): Promise<any> {
  console.log('🧠 Generating strategic framework with Claude...')

  if (!ANTHROPIC_API_KEY) {
    // Return a structured default framework
    return generateDefaultFramework(userQuery, discoveryContext, targetComponent, research)
  }

  // Build conversation context
  let conversationContext = ''
  if (conversationHistory && conversationHistory.length > 0) {
    conversationContext = '\n\nFULL CONVERSATION HISTORY:\n'
    conversationHistory.forEach((msg: any, idx: number) => {
      const role = msg.role === 'user' ? 'USER' : 'ASSISTANT'
      conversationContext += `\n${role} (Message ${idx + 1}): ${msg.content || msg.message || ''}`
    })
    conversationContext += '\n\n'
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: STRATEGIC_FRAMEWORK_PROMPT,
        messages: [{
          role: 'user',
          content: `Create a strategic framework based on this request and research.
${conversationContext}
LATEST USER REQUEST: ${userQuery}

ORGANIZATION: ${discoveryContext?.organization?.name || 'Unknown'} (${discoveryContext?.organization?.industry || 'Technology'})

KEY FINDINGS:
${research?.keyFindings?.slice(0, 5).map((f: string) => `- ${f}`).join('\n') || 'No key findings'}

SYNTHESIS:
${research?.synthesis?.[0] || 'No synthesis provided'}

OPPORTUNITIES:
${research?.insights?.opportunities?.slice(0, 3).map((o: string) => `- ${o}`).join('\n') || 'Market opportunities identified in research'}

CRITICAL FRAMEWORK GENERATION INSTRUCTIONS:

1. UNDERSTAND THE USER'S ACTUAL GOAL:
   - Read the ENTIRE conversation to understand what campaign they want
   - Identify the specific problem they're trying to solve
   - Note any constraints or things they explicitly don't want

2. CREATE A REAL STRATEGY (not a summary):
   - The objective should be MEASURABLE and TIME-BOUND
   - Example: "Achieve 30% share of voice in EdTech media by March 2025"
   - NOT: "Enhance our position in the market"

3. DESIGN EXECUTABLE TACTICS:
   - Media Outreach: Name specific publications (e.g., "TechCrunch exclusive on Study Mode launch")
   - Content: Specific pieces (e.g., "Data report: 2M students using ChatGPT for homework")
   - Stakeholder: Named targets (e.g., "Brief top 10 university CTOs at EDUCAUSE conference")

4. EXTRACT REAL INTELLIGENCE:
   - Pull ACTUAL findings from the research articles
   - Quote specific competitor moves mentioned in articles
   - Identify concrete opportunities from the data

5. CREATE ORCHESTRATION THAT WORKS:
   - If it's a media campaign → activate "media" component
   - If it needs content → activate "content" component
   - If it's strategic planning → activate "planning" component

Generate the strategic framework using the EXACT structure from the system prompt. Follow all CRITICAL RULES:
- Fill ALL fields with specific, actionable content
- NEVER use "TBD" or leave fields empty
- Include 6 content types in executionPlan.autoExecutableContent.contentTypes
- Duplicate key strategy data into contentStrategy for content generator compatibility
- Output ONLY valid JSON matching the system prompt structure`
        }]
      })
    })

    if (!response.ok) {
      console.error('Claude API error:', response.status)
      return generateDefaultFramework(userQuery, discoveryContext, targetComponent, research)
    }

    const data = await response.json()
    const content = data.content[0].text

    // Parse Claude's response
    try {
      const framework = JSON.parse(content)
      return framework
    } catch (parseError) {
      // Extract JSON from response if wrapped in text
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      throw parseError
    }

  } catch (error) {
    console.error('Framework generation error:', error)
    return generateDefaultFramework(userQuery, discoveryContext, targetComponent, research)
  }
}


// Validate and enhance the generated framework
function validateAndEnhanceFramework(framework: any, discoveryContext: any): any {
  // Ensure all required fields are present
  if (!framework.discoveryContext) {
    framework.discoveryContext = discoveryContext
  }

  // Validate strategy section
  if (!framework.strategy?.objective) {
    framework.strategy = {
      ...framework.strategy,
      objective: 'Strategic objective to be defined',
      rationale: 'Based on market analysis and opportunities'
    }
  }

  // Ensure metrics exist
  if (!framework.strategy.successMetrics || framework.strategy.successMetrics.length === 0) {
    framework.strategy.successMetrics = [
      {
        id: 'default-1',
        name: 'Campaign Success',
        target: 'To be defined',
        unit: 'TBD',
        trackingMethod: 'TBD'
      }
    ]
  }

  // Validate narrative
  if (!framework.narrative?.coreStory) {
    framework.narrative = {
      ...framework.narrative,
      coreStory: 'Core narrative to be developed',
      supportingMessages: []
    }
  }

  // Ensure tactics section exists with proper structure
  if (!framework.tactics) {
    framework.tactics = {
      campaign_elements: {
        media_outreach: [],
        content_creation: [],
        stakeholder_engagement: []
      },
      immediate_actions: [],
      week_one_priorities: [],
      strategic_plays: []
    }
  }

  // Validate execution
  if (!framework.execution?.timeline?.phases || framework.execution.timeline.phases.length === 0) {
    framework.execution = {
      ...framework.execution,
      timeline: {
        phases: [
          {
            id: 'default-phase',
            name: 'Execution Phase',
            startDate: getDateOffset(0),
            endDate: getDateOffset(30),
            objectives: ['Execute strategy'],
            deliverables: ['To be defined']
          }
        ],
        milestones: [],
        dependencies: []
      }
    }
  }

  // Validate handoff
  if (!framework.handoff?.targetComponent) {
    framework.handoff = {
      ...framework.handoff,
      targetComponent: framework.orchestration?.next_components?.[0] || 'campaign',
      executionType: 'strategic-initiative',
      priority: 'normal',
      specialInstructions: [],
      expectedOutcomes: []
    }
  }

  // Validate orchestration section
  if (!framework.orchestration) {
    framework.orchestration = {
      next_components: ['campaign'],
      workflow_type: 'planning',
      dependencies: [],
      success_criteria: []
    }
  } else {
    if (!framework.orchestration.next_components) framework.orchestration.next_components = ['campaign']
    if (!framework.orchestration.workflow_type) framework.orchestration.workflow_type = 'planning'
    if (!framework.orchestration.dependencies) framework.orchestration.dependencies = []
    if (!framework.orchestration.success_criteria) framework.orchestration.success_criteria = []
  }

  // Validate intelligence section - CRITICAL for framework structure
  if (!framework.intelligence) {
    framework.intelligence = {
      key_findings: [],
      competitor_moves: [],
      market_opportunities: [],
      risk_factors: [],
      supporting_data: {
        articles: [],
        quotes: [],
        metrics: []
      }
    }
  } else {
    // Ensure supporting_data exists with proper structure
    if (!framework.intelligence.supporting_data) {
      framework.intelligence.supporting_data = {
        articles: [],
        quotes: [],
        metrics: []
      }
    }
    // Ensure arrays exist
    if (!framework.intelligence.key_findings) framework.intelligence.key_findings = []
    if (!framework.intelligence.supporting_data.articles) framework.intelligence.supporting_data.articles = []
  }

  return framework
}

// Helper functions
function extractCompetitors(research: any): any {
  const competitors = research?.competitors || research?.competitorData || []

  return {
    direct: competitors.filter((c: any) => c.type === 'direct' || !c.type).slice(0, 5),
    indirect: competitors.filter((c: any) => c.type === 'indirect').slice(0, 3),
    emerging: competitors.filter((c: any) => c.type === 'emerging').slice(0, 3)
  }
}

function extractMarketEnvironment(research: any): any {
  return {
    trends: research?.trends || [],
    opportunities: research?.opportunities || [],
    threats: research?.threats || [],
    regulatory: research?.regulatory || []
  }
}

function extractUserIntent(history: any[]): string {
  if (!history || history.length === 0) return 'General strategic planning'

  const lastMessage = history[history.length - 1]
  return lastMessage?.content?.substring(0, 200) || 'Strategic planning'
}

function extractDecisions(history: any[]): any[] {
  return []
}

function extractConstraints(history: any[]): any[] {
  return []
}

function extractObjectiveFromQuery(query: string): string {
  const queryLower = query.toLowerCase()

  if (queryLower.includes('launch')) return 'Successfully launch new product/initiative'
  if (queryLower.includes('crisis')) return 'Manage crisis and protect reputation'
  if (queryLower.includes('compete')) return 'Strengthen competitive position'
  if (queryLower.includes('announce')) return 'Generate maximum impact from announcement'
  if (queryLower.includes('respond')) return 'Craft effective response strategy'

  return 'Achieve strategic communication objectives'
}

function determineTimeHorizon(query: string): 'immediate' | 'short-term' | 'long-term' {
  const queryLower = query.toLowerCase()

  if (queryLower.includes('urgent') || queryLower.includes('immediately') || queryLower.includes('now')) {
    return 'immediate'
  }
  if (queryLower.includes('quarter') || queryLower.includes('month')) {
    return 'short-term'
  }
  if (queryLower.includes('year') || queryLower.includes('long')) {
    return 'long-term'
  }

  return 'short-term'
}

function detectTargetComponent(query: string): 'campaign' | 'plan' | 'execute' | 'opportunity' {
  const queryLower = query.toLowerCase()

  if (queryLower.includes('campaign') || queryLower.includes('launch') || queryLower.includes('announce')) {
    return 'campaign'
  }
  if (queryLower.includes('plan') || queryLower.includes('timeline') || queryLower.includes('project')) {
    return 'plan'
  }
  if (queryLower.includes('content') || queryLower.includes('write') || queryLower.includes('create')) {
    return 'execute'
  }
  if (queryLower.includes('opportunity') || queryLower.includes('respond')) {
    return 'opportunity'
  }

  return 'campaign'
}

function detectExecutionType(query: string): string {
  const queryLower = query.toLowerCase()

  if (queryLower.includes('product launch')) return 'product-launch'
  if (queryLower.includes('crisis')) return 'crisis-response'
  if (queryLower.includes('announcement')) return 'announcement'
  if (queryLower.includes('competitive')) return 'competitive-response'
  if (queryLower.includes('thought leadership')) return 'thought-leadership'

  return 'strategic-initiative'
}

function detectPriority(query: string): 'urgent' | 'high' | 'normal' | 'low' {
  const queryLower = query.toLowerCase()

  if (queryLower.includes('urgent') || queryLower.includes('asap') || queryLower.includes('immediately')) {
    return 'urgent'
  }
  if (queryLower.includes('important') || queryLower.includes('priority') || queryLower.includes('critical')) {
    return 'high'
  }

  return 'normal'
}

function getDateOffset(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}