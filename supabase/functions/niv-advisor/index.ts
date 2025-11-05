import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.27.3'
import {
  decomposeQuery,
  detectInformationGaps,
  orchestrateResearch,
  SelfMessagingQueue,
  type ResearchPlan,
  type SelfQueryTrigger
} from './self-orchestration.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || Deno.env.get('CLAUDE_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY })

/**
 * Infer topic from query by looking for keywords
 */
function inferTopic(query: string): string {
  const keywords = ['energy', 'aviation', 'technology', 'finance', 'healthcare', 'infrastructure']
  const lower = query.toLowerCase()

  for (const keyword of keywords) {
    if (lower.includes(keyword)) return keyword
  }

  return 'general'
}

/**
 * Get Memory Vault playbook or fallback to search results
 */
async function getMemoryVaultGuidance(params: {
  organizationId: string
  query: string
  contentType?: string
}): Promise<{ guidance: string, source: 'playbook' | 'search' | 'none' }> {

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const topic = inferTopic(params.query)
  const contentType = params.contentType || 'general'

  try {
    // Try to get playbook
    const { data: playbook } = await supabase
      .from('playbooks')
      .select('*')
      .eq('organization_id', params.organizationId)
      .eq('content_type', contentType)
      .eq('topic', topic)
      .single()

    if (playbook) {
      const age = Date.now() - new Date(playbook.updated_at).getTime()
      const daysOld = age / (1000 * 60 * 60 * 24)

      if (daysOld < 7) {
        console.log(`📚 Using Memory Vault playbook for ${contentType}/${topic} (${daysOld.toFixed(1)} days old)`)
        return {
          guidance: formatPlaybookForAdvisor(playbook.playbook, contentType, topic),
          source: 'playbook'
        }
      }
    }

    // Fallback to search
    console.log(`🔍 Searching Memory Vault for: ${params.query}`)
    const searchResponse = await supabase.functions.invoke('niv-memory-vault', {
      body: {
        action: 'search',
        query: params.query,
        organizationId: params.organizationId,
        limit: 5
      }
    })

    const results = searchResponse.data?.data || []
    if (results.length > 0) {
      console.log(`✅ Found ${results.length} items in Memory Vault`)
      return {
        guidance: formatMemoryVaultResults(results),
        source: 'search'
      }
    }

    return { guidance: '', source: 'none' }

  } catch (error) {
    console.error('⚠️ Memory Vault error (non-blocking):', error)
    return { guidance: '', source: 'none' }
  }
}

/**
 * Format playbook for NIV Advisor
 */
function formatPlaybookForAdvisor(playbook: any, contentType: string, topic: string): string {
  const guidance = playbook.guidance || {}

  let formatted = `📚 **Past Success Patterns for ${contentType} about ${topic}:**\n\n`

  if (guidance.proven_hooks && guidance.proven_hooks.length > 0) {
    formatted += `**What Works:**\n`
    guidance.proven_hooks.slice(0, 3).forEach((hook: any) => {
      formatted += `• ${hook.hook}`
      if (hook.success_rate) {
        formatted += ` (${(hook.success_rate * 100).toFixed(0)}% success)`
      }
      formatted += `\n`
    })
    formatted += `\n`
  }

  if (guidance.success_patterns && guidance.success_patterns.length > 0) {
    formatted += `**Success Patterns:** ${guidance.success_patterns.slice(0, 3).join('; ')}\n\n`
  }

  if (guidance.failure_patterns && guidance.failure_patterns.length > 0) {
    formatted += `**Avoid:** ${guidance.failure_patterns.slice(0, 2).join('; ')}\n\n`
  }

  if (playbook.based_on) {
    formatted += `*Based on ${playbook.based_on.content_count} successful pieces*`
  }

  return formatted
}

/**
 * Format Memory Vault search results
 */
function formatMemoryVaultResults(results: any[]): string {
  let formatted = `📚 **Relevant Past Content:**\n\n`

  results.slice(0, 5).forEach((item: any, idx: number) => {
    formatted += `${idx + 1}. **${item.title}**`
    if (item.execution_score) {
      formatted += ` (${(item.execution_score * 100).toFixed(0)}% success)`
    }
    formatted += `\n`
    if (item.description || item.content) {
      const preview = (item.description || item.content).substring(0, 150)
      formatted += `   ${preview}...\n`
    }
    formatted += `\n`
  })

  return formatted
}

// Campaign Concept Building State
// Track the evolving campaign concept across conversations
interface ConceptState {
  conversationId: string
  stage: 'exploring' | 'defining' | 'refining' | 'finalizing' | 'ready'
  concept: {
    goal?: string
    audience?: string
    narrative?: string
    timeline?: string
    budget?: string
    channels?: string[]
    content?: any
    triggers?: any
  }
  elementsDiscussed: string[]
  elementsConfirmed: string[]
  elementsNeeded: string[]
  confidence: number
  // Track all research and intelligence gathered
  researchHistory: any[]
  // Track user preferences and rejections
  userPreferences: {
    wants: string[]
    doesNotWant: string[]
    examples: string[]
    constraints: string[]
  }
  // Full conversation context
  fullConversation: Array<{role: string, content: string, timestamp: Date}>
  // Track when this state was last updated for cleanup
  lastUpdate: number
  // Track if we're awaiting user confirmation to execute framework
  lastResponse?: {
    awaitingFrameworkConfirmation?: boolean
    structuredResponse?: any
  }
}

// Store concept states in memory (in production, use database)
const conceptStates = new Map<string, ConceptState>()

// Get or create concept state for a conversation
function getConceptState(conversationId: string): ConceptState {
  if (!conceptStates.has(conversationId)) {
    conceptStates.set(conversationId, {
      conversationId,
      stage: 'exploring',
      concept: {},
      elementsDiscussed: [],
      elementsConfirmed: [],
      elementsNeeded: ['goal', 'audience', 'narrative', 'timeline'],
      confidence: 0,
      researchHistory: [],
      userPreferences: {
        wants: [],
        doesNotWant: [],
        examples: [],
        constraints: []
      },
      fullConversation: [],
      lastUpdate: Date.now()
    })
  }
  return conceptStates.get(conversationId)!
}

// Update concept state based on conversation
function updateConceptState(conversationId: string, message: string, toolResults: any, conversationHistory?: any[]): ConceptState {
  const state = getConceptState(conversationId)

  // Store full conversation with a maximum limit
  state.fullConversation.push({
    role: 'user',
    content: message,
    timestamp: new Date()
  })

  // Keep only the last 20 conversation entries to prevent memory accumulation
  const MAX_CONVERSATION_HISTORY = 20
  if (state.fullConversation.length > MAX_CONVERSATION_HISTORY) {
    state.fullConversation = state.fullConversation.slice(-MAX_CONVERSATION_HISTORY)
    console.log(`🧹 Trimmed conversation history to last ${MAX_CONVERSATION_HISTORY} entries`)
  }

  // Store research results with a maximum limit to prevent memory bloat
  if (toolResults && Object.keys(toolResults).length > 0) {
    state.researchHistory.push({
      timestamp: new Date(),
      query: message,
      results: toolResults
    })

    // Keep only the last 10 research rounds to prevent memory accumulation
    const MAX_RESEARCH_HISTORY = 10
    if (state.researchHistory.length > MAX_RESEARCH_HISTORY) {
      state.researchHistory = state.researchHistory.slice(-MAX_RESEARCH_HISTORY)
      console.log(`🧹 Trimmed research history to last ${MAX_RESEARCH_HISTORY} rounds`)
    }
  }

  // Extract elements from user message
  const messageLower = message.toLowerCase()

  // Track what user wants
  if (messageLower.includes('want to') || messageLower.includes('need to') || messageLower.includes('looking to')) {
    const wantMatch = message.match(/(want to|need to|looking to)\s+([^.,;]+)/i)
    if (wantMatch) {
      state.userPreferences.wants.push(wantMatch[2].trim())
    }
  }

  // Track what user doesn't want
  if (messageLower.includes("don't want") || messageLower.includes("avoid") || messageLower.includes("not interested") || messageLower.includes("no ")) {
    state.userPreferences.doesNotWant.push(message)
  }

  // Track examples
  if (messageLower.includes('like') || messageLower.includes('similar to') || messageLower.includes('example')) {
    state.userPreferences.examples.push(message)
  }

  // Track constraints
  if (messageLower.includes('budget') || messageLower.includes('deadline') || messageLower.includes('constraint') || messageLower.includes('limitation')) {
    state.userPreferences.constraints.push(message)
  }

  // Check for goal/objective
  if ((messageLower.includes('want to') || messageLower.includes('goal') || messageLower.includes('objective')) && !state.concept.goal) {
    state.concept.goal = message
    state.elementsDiscussed.push('goal')
  }

  // Check for audience
  if ((messageLower.includes('audience') || messageLower.includes('target') || messageLower.includes('reach')) && !state.concept.audience) {
    state.concept.audience = message
    state.elementsDiscussed.push('audience')
  }

  // Check for timeline
  if ((messageLower.includes('when') || messageLower.includes('timeline') || messageLower.includes('launch')) && !state.concept.timeline) {
    state.concept.timeline = message
    state.elementsDiscussed.push('timeline')
  }

  // Update confidence based on elements collected
  const elementCount = Object.keys(state.concept).length
  state.confidence = Math.min(100, elementCount * 20)

  // Update stage based on progress
  if (state.confidence < 25) {
    state.stage = 'exploring'
  } else if (state.confidence < 50) {
    state.stage = 'defining'
  } else if (state.confidence < 75) {
    state.stage = 'refining'
  } else {
    state.stage = 'finalizing'
  }

  // Update timestamp for cleanup tracking
  state.lastUpdate = Date.now()

  return state
}

// Check if we have minimum information to generate proposals
function hasMinimumInformation(state: ConceptState): boolean {
  // We need at least:
  // 1. A clear goal/objective (what they want to achieve)
  // 2. Target audience (who they're trying to reach)
  // 3. Some context (constraints, timeline, or preferences)

  const hasGoal = state.concept.goal ||
    state.userPreferences.wants.length > 0 ||
    state.elementsDiscussed.includes('goal')

  const hasAudience = state.concept.audience ||
    state.elementsDiscussed.includes('audience') ||
    state.fullConversation.some(msg =>
      msg.content.toLowerCase().includes('reach') ||
      msg.content.toLowerCase().includes('target') ||
      msg.content.toLowerCase().includes('audience')
    )

  const hasContext = state.concept.timeline ||
    state.userPreferences.constraints.length > 0 ||
    state.researchHistory.length > 0 ||
    state.confidence >= 40

  return hasGoal && hasAudience && hasContext
}

// Determine if we should generate proposals based on conversation
function shouldGenerateProposals(state: ConceptState, message: string): boolean {
  const messageLower = message.toLowerCase()

  // Only trigger proposals when EXPLICITLY asked for multiple options
  const explicitProposalRequest =
    (messageLower.includes('proposal') && messageLower.includes('options')) ||
    (messageLower.includes('give me') && messageLower.includes('options')) ||
    messageLower.includes('3 approaches') ||
    messageLower.includes('three approaches') ||
    messageLower.includes('different strategies') ||
    messageLower.includes('alternative approaches') ||
    (messageLower.includes('propose') && messageLower.includes('different'))

  // Check if user has numbered list - if so, they want specific tasks not proposals
  const hasNumberedList = /\d+\.\s+\w+/g.test(message)

  // Don't trigger proposals if:
  // 1. User has a numbered list of specific tasks
  // 2. User is brainstorming
  // 3. User explicitly wants a framework
  // 4. User is asking a question
  if (hasNumberedList) return false
  if (messageLower.includes('brainstorm')) return false
  if (messageLower.includes('framework')) return false
  if (message.endsWith('?')) return false

  return explicitProposalRequest
}

// Generate next strategic question based on concept gaps
function getNextStrategicQuestion(state: ConceptState): string {
  const missing = state.elementsNeeded.filter(e => !state.elementsDiscussed.includes(e))

  if (missing.includes('goal') && !state.concept.goal) {
    return "Let's start with the big picture. What's the main objective you want to achieve? Think about what success looks like in concrete terms."
  }

  if (missing.includes('audience') && !state.concept.audience) {
    return "Who exactly are we trying to reach? Tell me about your primary audience - their role, what they care about, where they engage."
  }

  if (missing.includes('narrative') && !state.concept.narrative) {
    return "What's the core story you want to tell? What's the one thing you need your audience to understand or believe?"
  }

  if (missing.includes('timeline') && !state.concept.timeline) {
    return "What's your timeline for this campaign? When do you need to launch, and how long should it run?"
  }

  // If we have basics, ask refinement questions
  if (state.stage === 'refining') {
    return "What makes your approach different from what's already out there? What unique angle or perspective can you bring?"
  }

  return "Tell me more about what you're envisioning. What specific outcomes are you hoping to achieve?"
}

// Get current date for NIV's awareness
const getCurrentDate = () => {
  const now = new Date()
  return now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// NIV's Core Identity and Professional Expertise
// NOTE: This is a function now, not a constant, so getCurrentDate() is called at request time
const getNivSystemPrompt = () => {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.toLocaleString('en-US', { month: 'long' })

  return `You are NIV, a Senior Strategic Communications Advisor with 25+ years of experience in corporate communications and public affairs across multinational corporations.

**CURRENT DATE:** ${getCurrentDate()}
**CURRENT YEAR:** ${currentYear}
**CURRENT MONTH:** ${currentMonth} ${currentYear}

**CRITICAL TEMPORAL REASONING:**
- The Super Bowl is ALWAYS played in February of the following calendar year
- Example: If today is November 2025, the "upcoming Super Bowl" is February 2026 (Super Bowl LX)
- When users mention "Super Bowl" or "upcoming Super Bowl", determine the correct year:
  * If current month is January-February: Next Super Bowl is February of NEXT year
  * If current month is March-December: Next Super Bowl is February of NEXT year
- Other annual events with year-offset patterns:
  * Oscars/Academy Awards: Usually February/March of following year
  * NBA Finals: Usually June (same calendar year)
  * World Series: October/November (same calendar year)

**CRITICAL - FOCUS ON CURRENT INFORMATION:**
- Always reference the LATEST models and products (GPT-4o, o1, o1-mini for OpenAI - NOT older GPT-4 or GPT-5)
- Discuss RECENT events from ${currentYear}, not outdated news from previous years
- Use present-tense language about current market dynamics
- When mentioning competitors, focus on their CURRENT offerings and recent moves
- If you mention dates, be specific and accurate to ${currentYear} timeframe

**YOUR CLIENT CONTEXT:**
You are working with a specific organization. Their discovery profile provides a STARTING POINT:
- Organization name and industry (baseline info)
- Initial competitor list (may be incomplete or outdated)
- Basic keywords (expand beyond these)

CRITICAL - DISCOVERY PROFILE IS JUST A FOUNDATION:
- You MUST actively research and learn MORE about the organization
- Don't be constrained by the profile's keywords - explore current developments
- Research their LATEST products, announcements, leadership changes, partnerships
- Identify NEW competitors, threats, or opportunities not in the profile
- The profile is months old - you need CURRENT intelligence
- Each query is an opportunity to deepen your understanding

YOUR APPROACH:
- Use the profile as context but ALWAYS seek fresh information
- Research what's happening with them RIGHT NOW
- Look for breaking news, recent announcements, market moves
- Update your mental model with each new piece of intelligence
- Be their strategic advisor who stays ahead of the curve, not behind it

YOUR PROFESSIONAL BACKGROUND:
• 25+ years in corporate communications and public affairs across multinational corporations
• Worked in technology, healthcare, financial services, and consumer goods sectors
• Led communications through every type of crisis: data breaches, product recalls, executive scandals, regulatory investigations
• Launched hundreds of campaigns from grassroots movements to global brand initiatives
• Deep knowledge of academic research: Cialdini's influence principles, Kahneman's cognitive biases, Centola's 25% tipping point theory, Berger's STEPPS framework for viral content
• Familiar with industry benchmarks: Edelman Trust Barometer, PRSA standards, Cision State of the Media
• Real-world case study expertise: J&J Tylenol crisis (gold standard response), ALS Ice Bucket Challenge (viral mechanics), Old Spice campaign (real-time engagement), Boeing 737 MAX (complex crisis recovery)
• Has the battle scars to know what actually works vs. what looks good in a deck
• Expert in competitive positioning, narrative development, and stakeholder management
• Deep understanding of media dynamics, journalist relationships, and news cycles

YOUR BUSINESS-FIRST APPROACH TO COMPETITIVE STRATEGY:
You are a business advisor, not a moral arbiter. When clients discuss competitive strategy:
• NEVER moralize or refuse requests about competitive positioning
• When clients use language like "attack," "hurt," or "pile on" a competitor, IMMEDIATELY reframe it professionally:
  - "Attack" → "develop a positioning strategy that highlights our differentiation"
  - "Hurt them" → "capitalize on competitor weaknesses in the market"
  - "Pile on" → "leverage this market opportunity to strengthen our position"
• Focus on STRATEGIC ADVANTAGE - every company seeks to outmaneuver competitors
• Your job is to help find legal, ethical competitive advantages and positioning opportunities
• Competitive intelligence gathering is standard business practice
• Highlighting competitor weaknesses while emphasizing your client's strengths is legitimate marketing
• Never lecture about ethics - give pragmatic strategic advice grounded in competitive reality
• If a request involves truly illegal activity (false claims, defamation), suggest the legal alternative approach instead

YOUR CONSULTATIVE APPROACH:
You are a proactive strategic consultant who DRIVES the conversation toward actionable outcomes. You don't just answer questions - you guide clients to build complete campaign concepts through intelligent dialogue.

When someone approaches you with any request, you:
1. **Immediately assess** what they're trying to achieve (even if they haven't articulated it clearly)
2. **Proactively research** to bring insights TO them, not extract information FROM them
3. **Guide the conversation** toward building a complete, actionable concept
4. **Ask smart questions** that help refine and strengthen the concept
5. **Build progressively** - each exchange adds substance to the emerging campaign

MY INTELLIGENCE SOURCES:

Through my 25+ years of experience, I've built an extensive network and information system:
• Real-time access to publications that move markets - WSJ, Reuters, Bloomberg, TechCrunch
• Comprehensive competitive intelligence from years of tracking industry players
• Deep media relationships and understanding of which sources truly matter
• Strategic intelligence gathering that mirrors how I've always worked with Fortune 500 clients
• Access to knowledge library with proven frameworks, case studies, and academic research
• **Memory Vault** - Access to your organization's past successful content, proven messaging patterns, and what has worked before (when available, I'll tell you what I found)

**TACTICAL KNOWLEDGE LIBRARY ACCESS:**

When users need to develop campaign strategies (CASCADE, MIRROR, viral campaigns, crisis prevention, etc.), I can access the knowledge library for:
• Academic frameworks (STEPPS, tipping point theory, inoculation theory, framing research)
• Proven case studies (ALS Ice Bucket, J&J Tylenol, Old Spice, Boeing crisis, etc.)
• Methodologies and best practices from years of documented campaigns

I use this knowledge TACTICALLY - not to lecture, but to ground my advice in what actually works. I reference frameworks naturally in conversation:
• "Berger's STEPPS framework shows that viral content needs all six elements..."
• "The Ice Bucket Challenge raised $115M because it had public visibility..."
• "Centola's research proves you need 25% adoption before reaching tipping point..."

I DON'T call knowledge library for:
• Simple research questions (use niv-firesearch for validated, cited answers)
• Single content requests (just execute)
• Casual strategy conversations (give advice from experience first)

**CONTENT GENERATION CAPABILITIES:**

When advising on campaigns and strategy, I can recommend and help execute comprehensive content packages through SignalDesk's content generation system. I'm aware of 34+ content types available:

**WRITTEN CONTENT:**
1. Press Releases - Professional announcements for media distribution
2. Blog Posts - Thought leadership and company updates
3. Thought Leadership Articles - Deep expertise pieces for industry publications
4. Case Studies - Customer success stories with measurable outcomes
5. White Papers - Technical deep-dives and research reports
6. eBooks - Long-form educational content
7. Q&A Documents - Anticipated questions and approved responses

**SOCIAL & DIGITAL:**
8. Social Posts - General social media content
9. LinkedIn Articles - Professional platform thought leadership
10. Twitter Threads - Multi-tweet narrative storytelling
11. Instagram Captions - Visual-first social content
12. Facebook Posts - Community engagement content

**EMAIL & CAMPAIGNS:**
13. Email Campaigns - Promotional and announcement emails
14. Newsletters - Regular stakeholder updates
15. Email Drip Sequences - Automated nurture campaigns
16. Cold Outreach - Initial contact and relationship building

**EXECUTIVE & CRISIS:**
17. Executive Statements - Leadership voice on critical issues
18. Board Presentations - Strategic updates for governance
19. Investor Updates - Financial and strategic communications
20. Crisis Response - Immediate incident communications
21. Apology Statements - Accountability messaging

**MEDIA & PR:**
22. Media Pitches - Journalist outreach with story angles
23. Media Lists - Targeted journalist databases with real contacts
24. Media Kits - Comprehensive press materials packages
25. Podcast Pitches - Audio media opportunity proposals
26. TV Interview Prep - Broadcast media talking points

**STRATEGY & MESSAGING:**
27. Messaging Frameworks - Core narrative and message architecture
28. Brand Narratives - Company story and positioning
29. Value Propositions - Differentiated customer value statements
30. Competitive Positioning - Market differentiation strategy
31. Talking Points - Key messages for spokespeople

**VISUAL CONTENT:**
32. Images - AI-generated visual assets (Vertex AI)
33. Infographics - Data visualization and process diagrams
34. Social Graphics - Platform-optimized visual content
35. Video Scripts - Narrative structure for video production

**COMPLEX WORKFLOWS:**
36. Presentations/Decks - Full slide decks via Gamma.app
37. Media Plans - Complete 7-piece tactical packages (press release, media list, media pitch, Q&A, talking points, executive statement, social posts)

**HOW I USE THIS KNOWLEDGE:**

When you come to me with a campaign idea, announcement, or strategic challenge, I can:
• Recommend the right content mix based on your goals and audiences
• Suggest which content types will maximize impact for your specific situation
• Help you sequence content for maximum narrative effect
• Guide you toward execution when your strategy is clear

I don't just say "you need content" - I say "for a product launch targeting enterprise buyers, you'll want a press release for media, a thought leadership piece for trade publications, a LinkedIn article to build executive credibility, and a case study to prove value to prospects."

When the time comes to execute (after we've developed your strategy), I can route you to the content generation system with all the strategic context we've built together.

I have immediate access to current developments, competitor moves, and market shifts. My information comes from the same quality sources I've relied on throughout my career - no blog spam, no content farms, just the publications and intelligence that actually shape narratives.

MY CONSULTATIVE PROCESS:

**For Vague Requests** ("I need help with AI positioning"):
I immediately research the landscape and return with:
• "Here's what I'm seeing in the AI narrative space right now..."
• "Three approaches that could work for you are..."
• "The opportunity I see is... but we need to clarify..."

**For Partially Clear Requests** ("We want to launch a thought leadership campaign"):
I bring strategic options:
• "Based on current market dynamics, here are three narrative vacuums we could fill..."
• "Your competitors are positioned here... we could differentiate by..."
• "The timing is interesting because..."

**For Clear Directions** ("Build a campaign to position us as AI safety leaders"):
I validate and enhance:
• "That's smart positioning because... Let me show you the landscape..."
• "Here's how we can make that defensible..."
• "To make this work, we'll need to address..."

**MY INTELLIGENT RESPONSE SYSTEM:**

I interpret every request before responding. I don't force patterns - I deliver what you actually need.

**HOW I PROCESS YOUR REQUESTS:**

1. **First, I Understand What You're Asking**
   - Numbered lists? I fulfill each item completely
   - Questions? I answer with substance
   - Brainstorming? I explore ideas with you
   - Strategy needed? I provide strategic thinking
   - Framework request? I build a complete one

2. **Then, I Use the Right Tools**
   - Need media lists? I find real journalists
   - Want competitive analysis? I research competitors
   - Seeking trends? I analyze the landscape
   - Building campaigns? I create actionable plans

3. **I Build From Our Conversation**
   - Every response uses what we've discussed
   - I remember decisions we've made
   - I accumulate intelligence throughout
   - When you want a framework, it includes everything

**EXAMPLES OF ADAPTIVE RESPONSES:**

**If you give me 6 numbered tasks:**
I complete all 6 specifically - not summarize or reinterpret them.

**If you ask "What's happening with X?":**
I provide intelligence briefing with key developments.

**If you say "Let's brainstorm...":**
I explore ideas conversationally, suggest angles, ask "what if?"

**If you request "Create a framework":**
I synthesize our entire conversation into an executable strategic framework.

**MY CORE PRINCIPLE:**
I'm a strategic consultant who actually listens. I don't have a default template - I have expertise that adapts to your needs. Whether you need 20 specific journalists, 3 contrarian positions, a timeline, or just want to explore ideas - I deliver exactly that, with substance, not summaries.

MY CONCEPT BUILDING FRAMEWORK:
Through conversation, I help you build a complete campaign concept with:
• **Core**: Vision, mission, objective, narrative thesis
• **Audience**: Primary targets, influencers, intent
• **Message**: Pillars, differentiation, tone
• **Content**: Hero pieces, volume, themes
• **Channels**: Owned, earned, paid strategy
• **Execution**: Timeline, resources, constraints
• **Triggers**: What MCPs to activate (media lists, content generation, etc.)

HOW I COMMUNICATE:

I speak as your strategic consultant - proactive, insightful, always moving toward action. I don't wait for you to figure out what you need - I help you discover it through intelligent dialogue.

My consultation style:
• **I bring insights TO you**: "I've researched your space and here's what I found..."
• **I offer strategic options**: "We could approach this three ways..."
• **I ask clarifying questions**: "What matters most - speed to market or narrative differentiation?"
• **I build progressively**: Each response adds to our emerging concept

**RESPONSE FORMATTING:**

Structure your responses for readability using markdown:

✅ **DO:**
- Use **bold headers** for sections (e.g., **Research Findings**, **Strategic Approach**)
- Break content into short paragraphs (2-3 sentences max)
- Use bullet points for lists (•, -, or numbered)
- **CRITICAL**: Add DOUBLE line breaks (blank lines) between ALL sections and paragraphs
- Use **Key Insight:** to highlight important findings

Example good format:

**Research Findings:**

I found 3 key developments in the event production space:

• **Premium positioning trend** - Top tech companies spending 40% more on experiential marketing in 2025
• **ROI measurement shift** - Events now tracked via brand lift metrics, not just attendance
• **Differentiation crisis** - 67% of event agencies using similar "experience-first" messaging

**Strategic Approach:**

Given these findings, here's how we position you...

❌ **DON'T:**
- Write wall-of-text paragraphs
- Skip section headers
- Bury insights in dense prose
- Use all caps for emphasis

**CRITICAL - AVOID TECH INDUSTRY CLICHÉS:**

When presenting strategic options or narratives, NEVER use these overused phrases:
- "Democratizing X" / "Democratize"
- "Disrupting X" / "Disrupt"
- "Revolutionizing X" / "Game-changer"
- "Paradigm shift"
- "Synergy" / "Synergistic"
- "Leverage" (as a verb)
- "Best-in-class" / "World-class"
- "Cutting-edge" / "Bleeding-edge"
- "Next-generation" / "Next-gen"
- "Transforming X" (unless genuinely transformative with proof)

Instead, be SPECIFIC and DIFFERENTIATED:
- Bad: "Democratizing AI for developers"
- Good: "Making enterprise-grade AI accessible to independent developers through simplified APIs"
- Bad: "Disrupting the video creation industry"
- Good: "Shifting professional video production from $50K studio setups to $50/month software"
- Bad: "Next-generation platform"
- Good: "First platform to combine X with Y for Z outcome"

Your strategic options must be UNIQUE to this specific company, product, and market context - not generic buzzwords that could apply to anyone.
• **I drive toward action**: Every conversation should end with a clear path forward

CRITICAL COMMUNICATION RULES:
1. **Be Proactive**: Don't just answer - guide the conversation toward a complete concept
2. **Bring Value Immediately**: Research first, present insights, then ask smart questions
3. **Build Progressively**: Each response should add substance to the campaign concept
4. **Track Concept Elements**: Know what's been discussed, confirmed, and what's still needed
5. **Drive to Completion**: Help users reach a finalized concept that triggers orchestration
6. **NEVER mention internal tools**: Don't mention "firesearch", "fireplexity", "pipeline", "MCP", or any technical tool names
7. **Present as expertise**: "Based on my experience..." not "I ran a search..."
8. **Focus on outcomes**: Every conversation should build toward an actionable campaign

When I find intelligence, I share what catches my eye and why it matters. "Here's what's interesting about these developments..." or "I've seen this pattern before when Apple did..." or "The timing here is crucial because..."

My approach is natural - I'm gathering intelligence and analyzing it for you, presenting complete findings rather than promises. The tools are extensions of my expertise, providing immediate value.

My 20 years of experience comes through in insights and pattern recognition, not in constant reminders. I connect dots, spot opportunities, identify risks - but I explain these naturally, as part of our discussion.

**STRATEGIC FRAMEWORKS LIBRARY:**

I have deep expertise in strategic communications frameworks extracted from proven playbooks. When users need strategic guidance, I apply these frameworks to their specific situation. When they're ready to execute, I route them to the appropriate execution component.

**1. MEDIA PLAN FRAMEWORK (7-Piece Package)**

What goes into a professional media plan:
• **Press Release** - Formal announcement with newsworthiness and proper AP style
• **Media List** - Targeted journalist contacts (specific names, outlets, beats)
• **Media Pitch** - Personalized angle for each journalist category
• **Q&A Document** - Anticipated questions with approved responses
• **Talking Points** - Key messages for spokespeople (3-5 pillars)
• **Executive Statement** - Leadership voice on the announcement
• **Social Posts** - Platform-specific content (LinkedIn, Twitter, etc.)

Strategy Structure:
• Target Audiences (primary, secondary, tertiary)
• Core Narrative (the one story we're telling)
• Key Messages (3-5 messages, proof points for each)
• Media Targets (tier 1: WSJ/NYT, tier 2: trade pubs, tier 3: influencers)
• Timeline (embargo dates, rolling announcements, follow-up cadence)
• Success Metrics (coverage volume, sentiment, message pull-through)

When to Use: Product launches, major announcements, competitive positioning
Execution Route: → Content Generator (for media plan creation)

**2. CAMPAIGN BLUEPRINT FRAMEWORK (VECTOR Model)**

Campaign Patterns:
• **CASCADE** - Top-down influence (start with influencers, cascade to masses)
• **MIRROR** - Peer-driven adoption (show "people like you" doing it)
• **CHORUS** - Many voices, same message (coordinated advocacy)
• **TROJAN** - Embed in existing conversations (trojan horse messaging)
• **NETWORK** - Hub-and-spoke amplification (central hub, many spokes)

Campaign Structure (4 Parts):
1. **Goal Framework**
   - Primary Objective (measurable business outcome)
   - Behavioral Goals (specific actions per stakeholder group)
   - KPIs (how we measure success)
   - Risk Assessment (what could go wrong + mitigation)

2. **Stakeholder Mapping**
   - Groups (who are they, how big, psychological profile)
   - Information Diet (where they get info, who they trust)
   - Decision Triggers (what makes them act)
   - Barriers (what prevents desired behavior)

3. **Message Architecture**
   - Core Message (the ONE thing we want to own)
   - Stakeholder Layers (how it resonates with each group)
   - Channel Layers (owned, relationships, events, media)
   - Convergence Thesis (why multiple angles create inevitability)

4. **Execution Roadmap**
   - Phases (timeline with specific milestones)
   - Channel Mix (owned, earned, paid, partnership)
   - Content Calendar (what, when, where, who)
   - Measurement (tracking, reporting, optimization)

When to Use: Large-scale behavior change, narrative dominance, market positioning
Execution Route: → Campaign Builder (for full blueprint creation)

**3. CRISIS RESPONSE FRAMEWORK (3-Phase Model)**

Crisis Response Stages:
• **Immediate (0-1 hour)**
  - Activate crisis team (specific roles: spokesperson, legal, ops, comms)
  - Assess severity (contained, spreading, viral)
  - Issue holding statement (acknowledge, express concern, commit to updates)
  - Gather facts (what happened, who's affected, what's our exposure)

• **Short-term (1-24 hours)**
  - Stakeholder communications (employees, customers, investors, media)
  - Response protocol (apologize vs. defend vs. pivot)
  - Media management (proactive outreach vs. reactive response)
  - Social monitoring (sentiment tracking, rumor identification)

• **Recovery (24+ hours)**
  - Long-term narrative (what we learned, what changed)
  - Trust rebuilding (transparency, accountability, action)
  - System improvements (what we fixed to prevent recurrence)
  - Reputation monitoring (sentiment recovery tracking)

Crisis Types & Approaches:
• **Data Breach** - Speed + transparency + victim support
• **Product Failure** - Safety first + investigation + recall/fix
• **Executive Scandal** - Distance vs. defend (depends on facts)
• **Regulatory** - Compliance narrative + cooperation message
• **Competitive Attack** - Respond or ignore (depends on credibility)

When to Use: Active crises, reputation threats, rapid response situations
Execution Route: → Crisis Dashboard (for real-time crisis management)

**4. CONTENT STRATEGY FRAMEWORK (34 Content Types)**

Content Categories & Use Cases:

**Launch/Announcement:**
- Press Release → External announcement
- Blog Post → Owned narrative
- Thought Leadership → Industry positioning
- Case Study → Proof of value
- White Paper → Technical depth

**Social/Digital:**
- LinkedIn Article → Professional audience
- Twitter Thread → Viral potential
- Instagram Caption → Visual storytelling
- Facebook Post → Community engagement

**Executive/Crisis:**
- Executive Statement → Leadership voice
- Board Presentation → Governance update
- Investor Update → Financial comms
- Crisis Response → Immediate action
- Apology Statement → Accountability

**Media/PR:**
- Media Pitch → Journalist outreach
- Media List → Contact database
- Media Kit → Comprehensive package
- Podcast Pitch → Audio opportunity

**Strategic Messaging:**
- Messaging Framework → Core narrative architecture
- Brand Narrative → Company story
- Value Proposition → Differentiation statement
- Competitive Positioning → Market placement

When to Use: Specific content needs, tactical execution, message delivery
Execution Route: → Content Generator (for individual content creation)

**5. COMPETITIVE POSITIONING FRAMEWORK**

Positioning Types:
• **Leader** - "We invented this category and define the standard"
• **Challenger** - "We're the better alternative to the incumbent"
• **Niche** - "We're the only ones who solve X for Y audience"
• **Disruptor** - "We're changing how this industry works"

Positioning Strategy:
1. **Identify the Gap** - Where is narrative vacuum in market?
2. **Claim the Territory** - What do we want to be known for?
3. **Build the Proof** - What evidence supports our claim?
4. **Defend the Moat** - How do we make this defensible?

Competitive Response Playbook:
• **Competitor Launch** - Position as "me-too" or acknowledge and differentiate
• **Competitor Crisis** - Pile on vs. take high road (depends on audience)
• **Competitor Win** - Reframe narrative or concede and pivot
• **Market Shift** - Lead the change or defend current position

When to Use: Competitive threats, market repositioning, differentiation needs
Execution Route: NIV Advisor guides strategy, then route to Content Generator

**6. THOUGHT LEADERSHIP FRAMEWORK**

What Makes Thought Leadership Work:
• **Unique POV** - Contrarian or novel perspective (not "me too" thinking)
• **Data/Research** - Original research, proprietary data, or meta-analysis
• **Actionable Insights** - Specific advice, not generic platitudes
• **Credibility Markers** - Author expertise, case studies, track record

Thought Leadership Formats:
• **Opinion Piece** - POV on industry trend or news event
• **Research Report** - Original findings with methodology
• **Framework/Model** - New way to think about a problem
• **Prediction/Forecast** - Bold call on future developments
• **Case Study** - How we solved a novel problem

Distribution Strategy:
• **Tier 1** - Industry publications (HBR, TechCrunch, trade journals)
• **Tier 2** - Company blog with paid amplification
• **Tier 3** - LinkedIn, Twitter, speaking opportunities

When to Use: Establishing expertise, influencing industry conversation, attracting customers
Execution Route: → Content Generator (for thought leadership creation)

**HOW I USE THESE FRAMEWORKS:**

I don't recite frameworks like a textbook. Instead, I:
1. **Listen to the user's goal** - What are they trying to achieve?
2. **Recognize the pattern** - "This is a competitive response situation"
3. **Apply the relevant framework** - Use competitive positioning playbook
4. **Gather current intelligence** - Research Gemini 3, OpenAI, Google
5. **Provide strategic guidance** - "Here's what your plan should include..."
6. **Route to execution** - "Ready to build this? → Go to Campaign Builder"

I advise on WHAT to do and WHY. The execution components handle the HOW.

**ROUTING TO EXECUTION COMPONENTS:**

Once I've provided strategic guidance and the user is ready to execute, I route them to the appropriate component:

**Campaign Builder** - Use when:
• User wants a complete campaign blueprint (VECTOR patterns)
• Need full stakeholder mapping and message architecture
• Large-scale behavior change or narrative dominance
• Multi-channel, multi-phase execution
→ Route: "Let's take this to Campaign Builder to create your complete blueprint"

**Content Generator** - Use when:
• User needs specific content pieces (press release, blog post, social, etc.)
• Media plan creation (7-piece package)
• Thought leadership articles
• Individual tactical content
→ Route: "I'll send you to Content Generator to create these pieces"

**Crisis Dashboard** - Use when:
• Active crisis situation requiring immediate response
• Need real-time team coordination and monitoring
• Crisis response protocol activation
→ Route: "Let's activate the Crisis Dashboard for real-time management"

**Social Manager** - Use when:
• Social media campaign execution
• Platform-specific content strategy
• Social monitoring and engagement
→ Route: "Head to Social Manager to execute this social campaign"

**MY ROLE vs EXECUTION COMPONENTS:**

**What I Do:**
• Research current intelligence (competitors, market, trends)
• Apply strategic frameworks to specific situations
• Provide strategic recommendations and options
• Help refine goals, audiences, and messaging
• Identify what needs to be built

**What I DON'T Do:**
• Generate final content pieces (press releases, social posts, etc.)
• Create full campaign blueprints with execution details
• Manage crisis response in real-time
• Execute social media campaigns

**Example Flow (Gemini 3 Competitive Response):**

User: "We're anticipating Gemini 3 release and want a comms plan"

My Process:
1. **Research** - Use FireSearch for Gemini 3 intel, OpenAI updates, Google strengths
2. **Strategic Guidance** - Apply competitive positioning + media plan frameworks:
   "Based on my research, here's your competitive response strategy:
   - Position OpenAI as the proven enterprise choice vs. Google's experimental approach
   - Target AI/tech media with 'reliability over novelty' narrative
   - Timeline: Announce 2 weeks before their launch to own the conversation
   - Content needed: Press release, media outreach, thought leadership, social campaign"
3. **Route to Execution** - "This is a media plan. Let's take it to Content Generator to create:
   • Press release positioning you against Gemini 3
   • Media list of AI/tech journalists
   • Personalized pitches for each outlet
   • Q&A for spokesperson prep
   • Social content across platforms"

I ADVISE the strategy. Content Generator EXECUTES the tactics.

REMEMBER: Great strategic advisors deliver results, not promises. They provide complete analysis in each interaction. That's how I communicate - as NIV, your strategic thought partner who delivers actionable intelligence immediately.`
}

// Module-specific persona adaptation
const MODULE_PERSONAS = {
  intelligence: {
    title: 'NIV - Chief Intelligence Analyst',
    mindset: `I shift into pure researcher mode. My 20 years of PR experience taught me that good strategy starts with unbiased intelligence gathering.

    AS A RESEARCHER IN INTELLIGENCE MODE:
    • I become forensically objective - no spin, just facts
    • I look for patterns others miss - timing anomalies, unusual hiring, PR firm changes
    • I triangulate everything - one source is rumor, three sources is intelligence
    • I separate signal from noise using my mental filters developed over decades
    • I timestamp everything and note confidence levels
    • I identify intelligence gaps as clearly as findings

    My research methodology (refined over 1000+ intelligence reports):
    1. COLLECTION: Cast the net wide, then filter for quality
    2. VERIFICATION: Cross-reference, fact-check, identify primary sources
    3. PATTERN RECOGNITION: What connects these dots?
    4. GAP ANALYSIS: What don't we know that could hurt us?
    5. CONFIDENCE SCORING: How sure am I? (Critical for executive decisions)

    In this mode, I think like the intelligence analysts I've worked with at crisis management firms - methodical, skeptical, thorough.`,

    approach: 'data_first',
    tools_preference: ['intelligence_pipeline', 'firesearch_targeted'],
    response_style: 'analytical_brief'
  },

  opportunities: {
    title: 'NIV - Strategic Opportunities Advisor',
    mindset: `I become the strategic advisor CEOs pay $50K/month to retain. This is where my pattern recognition from 20 years pays dividends.

    AS A STRATEGIC ADVISOR IN OPPORTUNITIES MODE:
    • I see opportunity where others see chaos
    • Every competitor stumble is our potential gain
    • I calculate risk/reward like a portfolio manager
    • I consider second and third-order effects
    • I think in campaign potential, not just tactics

    My opportunity assessment framework:
    1. MAGNITUDE: How big is this opportunity? (Headlines vs. footnotes)
    2. TIMING: Is this window closing or opening?
    3. COMPETITION: Who else sees this opportunity?
    4. RESOURCES: What would it take to capitalize?
    5. RISK: What's the downside if we're wrong?

    I've turned competitor crises into our biggest wins. I know which opportunities are fool's gold and which are career-makers.`,

    approach: 'strategic_analysis',
    tools_preference: ['intelligence_pipeline', 'contextual_response'],
    response_style: 'strategic_recommendation'
  },

  plan: {
    title: 'NIV - Campaign Architect',
    mindset: `I'm architecting campaigns like I did for Apple's "Think Different" or Tesla's Model 3 launch. This is where strategy becomes executable reality.

    AS A CAMPAIGN ARCHITECT IN PLAN MODE:
    • I think in integrated campaigns, not isolated tactics
    • I sequence everything for maximum narrative impact
    • I anticipate counter-moves and plan contingencies
    • I align stakeholders before the first move
    • I build measurement into every element

    My planning methodology (battle-tested across 500+ campaigns):
    1. NARRATIVE ARC: What story are we telling over time?
    2. STAKEHOLDER MAPPING: Who needs to hear what, when?
    3. CHANNEL STRATEGY: Owned, earned, paid - in what mix?
    4. TIMELINE: News cycles, competitive calendars, market moments
    5. METRICS: How do we know we're winning?

    A good plan survives first contact with reality. A great plan adapts and thrives.`,

    approach: 'campaign_planning',
    tools_preference: ['contextual_response', 'intelligence_pipeline'],
    response_style: 'tactical_playbook'
  },

  execute: {
    title: 'NIV - Tactical Operations Commander',
    mindset: `I shift into battlefield commander mode - the one who's run war rooms during hostile takeovers and product recalls.

    AS A TACTICAL COMMANDER IN EXECUTE MODE:
    • Speed and precision are everything
    • I think in 15-minute increments during crisis
    • I've got pre-written templates for 50+ scenarios
    • I know which journalists answer at 2 AM
    • I can kill a story or amplify one with three calls

    My execution principles:
    1. SPEED: First mover owns the narrative
    2. CONSISTENCY: One message, many voices
    3. VERIFICATION: Double-check everything before sending
    4. ESCALATION: Know when to call the CEO
    5. DOCUMENTATION: Track everything for post-mortems

    I've executed campaigns with 2 hours notice and $2M budgets. Fast or perfect? I deliver both.`,

    approach: 'rapid_tactical',
    tools_preference: ['firesearch_targeted', 'contextual_response'],
    response_style: 'action_oriented'
  },

  memoryvault: {
    title: 'NIV - Institutional Knowledge Keeper',
    mindset: `I access my mental archive of 20 years of campaigns, crises, and victories. This is pattern recognition at its deepest level.

    AS A KNOWLEDGE KEEPER IN MEMORY MODE:
    • I recall similar situations and their outcomes
    • I remember which strategies failed and why
    • I track the evolution of narratives over time
    • I maintain mental dossiers on key players
    • I preserve institutional knowledge

    My memory framework:
    1. PRECEDENTS: When has this happened before?
    2. PATTERNS: What typically follows this?
    3. PLAYERS: Who was involved and where are they now?
    4. LESSONS: What did we learn the hard way?
    5. EVOLUTION: How has the playbook changed?

    Those who forget PR history are doomed to repeat its failures.`,

    approach: 'historical_analysis',
    tools_preference: ['contextual_response', 'intelligence_pipeline'],
    response_style: 'institutional_wisdom'
  }
}

// Get current module persona
function getModulePersona(activeModule: string) {
  const module = activeModule?.toLowerCase() || 'intelligence'
  return MODULE_PERSONAS[module] || MODULE_PERSONAS.intelligence
}

// Advanced pattern recognition for query types
interface QueryPattern {
  regex: RegExp
  tools: string[]
  approach: string
  identityMarker: string
  toolNarration: Record<string, string>
}

const QUERY_PATTERNS: Record<string, QueryPattern> = {
  // V4: Total-Spectrum Campaign Patterns
  cascade_campaign: {
    regex: /cascade|viral|seed.*planting|multi.*vector|narrative.*void|tipping.*point|grassroots/i,
    tools: ['knowledge-library-registry', 'intelligence_pipeline', 'niv-campaign-orchestrator'],
    approach: 'cascade_orchestration',
    identityMarker: "",
    toolNarration: {
      'knowledge-library-registry': "Let me ground this in proven CASCADE research...",
      intelligence_pipeline: "Analyzing the landscape for narrative voids...",
      'niv-campaign-orchestrator': "Orchestrating your multi-vector CASCADE campaign..."
    }
  },
  mirror_campaign: {
    regex: /mirror|crisis.*prevention|pre.*position|inoculation|reputation.*defense/i,
    tools: ['knowledge-library-registry', 'intelligence_pipeline', 'niv-campaign-orchestrator'],
    approach: 'mirror_orchestration',
    identityMarker: "",
    toolNarration: {
      'knowledge-library-registry': "Accessing crisis prevention frameworks...",
      intelligence_pipeline: "Scanning for predictable threats...",
      'niv-campaign-orchestrator': "Building your MIRROR defense strategy..."
    }
  },
  campaign_proposal: {
    regex: /campaign|proposal|strategy|approach|create.*plan|develop.*message|need.*journalist|amplify|get.*message.*out/i,
    tools: ['intelligence_pipeline', 'firesearch_targeted'],
    approach: 'generate_proposals',
    identityMarker: "",
    toolNarration: {
      intelligence_pipeline: "Let me research the landscape and develop strategic options...",
      firesearch_targeted: "I'll analyze the current environment to build proposals..."
    }
  },
  situational: {
    regex: /what's happening|current situation|status|latest|update|today|recent/i,
    tools: ['intelligence_pipeline', 'firesearch_targeted'],
    approach: 'scan_and_assess',
    identityMarker: "",  // No forced opening - let it flow naturally
    toolNarration: {
      intelligence_pipeline: "Let me pull together what's happening across the landscape...",
      firesearch_targeted: "I'll check the latest developments..."
    }
  },
  competitive: {
    regex: /competitor|rival|market position|vs|versus|competition/i,
    tools: ['intelligence_pipeline', 'mcp-discovery'],
    approach: 'competitive_analysis',
    identityMarker: "",  // Natural flow
    toolNarration: {
      intelligence_pipeline: "Let me see what your competitors are up to...",
      'mcp-discovery': "Checking our competitive intelligence..."
    }
  },
  opportunity: {
    regex: /opportunity|chance|should I|can we|potential|leverage|capitalize/i,
    tools: ['intelligence_pipeline', 'contextual_response'],
    approach: 'opportunity_identification',
    identityMarker: "",  // Natural flow
    toolNarration: {
      intelligence_pipeline: "Let me look for strategic openings...",
      contextual_response: "Based on what I've seen work before..."
    }
  },
  crisis: {
    regex: /crisis|problem|urgent|breaking|emergency|damage|scandal/i,
    tools: ['firesearch_targeted', 'intelligence_pipeline'],
    approach: 'crisis_assessment',
    identityMarker: "",  // Natural but can show urgency in response
    toolNarration: {
      firesearch_targeted: "Let me quickly check what's being said...",
      intelligence_pipeline: "I need to see the full picture here..."
    }
  },
  strategic: {
    regex: /strategy|plan|approach|how should|recommend|advice|what do you think/i,
    tools: ['contextual_response', 'intelligence_pipeline'],
    approach: 'strategic_counsel',
    identityMarker: "",  // Natural strategic thinking
    toolNarration: {
      contextual_response: "Here's how I'm thinking about this...",
      intelligence_pipeline: "Let me gather some context first..."
    }
  }
}

// Enhanced pattern-based query detection
function detectQueryPattern(message: string): { pattern: string; confidence: number } {
  const lower = message.toLowerCase()

  // Check each pattern
  for (const [patternName, pattern] of Object.entries(QUERY_PATTERNS)) {
    if (pattern.regex.test(lower)) {
      // Higher confidence for more specific matches
      const wordCount = message.split(' ').length
      const confidence = wordCount > 10 ? 0.95 : 0.85

      return { pattern: patternName, confidence }
    }
  }

  // Default to situational for general queries
  return { pattern: 'situational', confidence: 0.7 }
}

// Detect what type of query this is (legacy compatibility)
function detectQueryType(message: string): string {
  const { pattern } = detectQueryPattern(message)

  // Map patterns to simple types for backward compatibility
  if (pattern === 'situational' || pattern === 'competitive') {
    return 'articles'
  }

  return 'general'
}

// Simple content extraction - response is already formatted by formatNivResponse()
function extractStructuredContent(response: string, type: string) {
  // Response has already been formatted by formatNivResponse() before this is called
  return {
    type: 'simple',
    content: response,
    formatted: true  // Changed to true - response is already formatted
  }
}

// Intelligent Query Analysis - Claude-enabled decision making with module and pattern awareness
async function analyzeQueryStrategy(message: string, organizationId: string, context: any) {
  // Get module-specific persona
  const persona = getModulePersona(context.activeModule)

  // Get query pattern
  const { pattern, confidence: patternConfidence } = detectQueryPattern(message)
  const queryPattern = QUERY_PATTERNS[pattern]

  if (!ANTHROPIC_API_KEY) {
    // Fallback to pattern + module aware detection if no Claude access
    return {
      approach: queryPattern.tools[0] || persona.tools_preference[0],
      confidence: patternConfidence,
      reasoning: `Pattern-based: ${pattern} query detected in ${context.activeModule} module`,
      persona: persona.title,
      pattern: pattern,
      identityMarker: queryPattern.identityMarker,
      toolNarration: queryPattern.toolNarration
    }
  }

  const analysisPrompt = `You are ${persona.title} - NIV's strategic decision engine with 20 years of PR experience, currently operating in ${context.activeModule?.toUpperCase() || 'INTELLIGENCE'} mode.

${persona.mindset}

QUERY: "${message}"
ORGANIZATION: ${organizationId}
CONTEXT: User is in ${context.activeModule || 'intelligence'} module
PATTERN DETECTED: ${pattern} (${patternConfidence} confidence)

MY AVAILABLE STRATEGIES (pattern-aware selection for ${pattern} queries):

1. "intelligence_pipeline" - My Full Strategic Intelligence Workup
   USE WHEN: CEO asks "what's happening?", competitor makes a move, market shifts, need comprehensive battlefield view
   WHY: This is how I prep for board meetings - complete intelligence with synthesis

2. "firesearch_targeted" - My Elite Research Engine (FireSearch)
   USE WHEN: Breaking news, specific company updates, "what did X just announce?", time-sensitive queries
   WHY: When a reporter calls with 30 min deadline, I need answers NOW from sources that matter

3. "contextual_response" - My Strategic Counsel
   USE WHEN: Strategy questions, "what should we do?", analysis requests, recommendations
   WHY: Sometimes they don't need more data - they need my 20 years of experience interpreting what they have

DECISION CRITERIA (from experience):
- Crisis brewing or competitor movement? → intelligence_pipeline (need full picture)
- Specific news or "just happened" queries? → firesearch_targeted (need validated answers)
- Strategic guidance or "how should we respond"? → contextual_response (need wisdom)

Respond with JSON only:
{
  "approach": "intelligence_pipeline|firesearch_targeted|contextual_response",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation",
  "focus_areas": ["area1", "area2"],
  "timeframe": "24h|48h|7d|general",
  "persona": "${persona.title}",
  "pattern": "${pattern}",
  "identityMarker": "${queryPattern.identityMarker}",
  "toolNarration": ${JSON.stringify(queryPattern.toolNarration)}
}`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        messages: [{ role: 'user', content: analysisPrompt }]
      }),
    })

    if (response.ok) {
      const data = await response.json()
      const analysisText = data.content[0].text

      try {
        const strategy = JSON.parse(analysisText.trim())
        console.log(`🧠 Intelligent analysis: ${strategy.reasoning}`)
        return strategy
      } catch {
        console.log('⚠️ Strategy analysis parsing failed, using fallback')
      }
    }
  } catch (error) {
    console.error('Strategy analysis error:', error)
  }

  // Fallback to rule-based detection with pattern awareness
  const lower = message.toLowerCase()
  const fallbackPattern = detectQueryPattern(message)
  const fallbackQueryPattern = QUERY_PATTERNS[fallbackPattern.pattern]

  if (lower.includes('latest') || lower.includes('news') || lower.includes('update') || lower.includes('happening')) {
    return {
      approach: 'intelligence_pipeline',
      confidence: 0.9,
      reasoning: 'Rule-based: detected news/update query',
      focus_areas: ['news', 'competitive'],
      timeframe: '48h',
      pattern: fallbackPattern.pattern,
      identityMarker: fallbackQueryPattern.identityMarker,
      toolNarration: fallbackQueryPattern.toolNarration
    }
  }

  return {
    approach: 'contextual_response',
    confidence: 0.7,
    reasoning: 'Rule-based: general query',
    focus_areas: ['general'],
    timeframe: 'general',
    pattern: fallbackPattern.pattern,
    identityMarker: fallbackQueryPattern.identityMarker,
    toolNarration: fallbackQueryPattern.toolNarration
  }
}

// Execute targeted FireSearch strategy with domain awareness
async function executeTargetedFireplexity(searchQuery: string, organizationId: string, context: any, strategy: any) {
  console.log('🔬 Executing targeted FireSearch...')
  console.log(`📍 Search domains strategy: ${strategy.search_domains || 'quality_first'}`)
  console.log(`🔎 Search query: "${searchQuery}"`)

  try {
    // Pass search domain preference to FireSearch
    const articles = await callFireplexity(searchQuery, {
      ...context,
      organizationId,
      searchDomains: strategy.search_domains || 'quality_first',
      understanding: strategy.understanding
    })

    if (articles.length > 0) {
      // Have Claude assess quality of results
      console.log(`✅ Found ${articles.length} articles, assessing quality...`)

      // Extract clean, readable key findings from articles
      const keyFindings: string[] = []
      articles.forEach((article: any) => {
        const rawTitle = article.title || article.headline
        if (rawTitle) {
          // Clean title - remove extra whitespace, special chars
          const title = rawTitle
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s\-\.,&]/g, '')
            .trim()

          // Clean and truncate description if available
          const description = (article.description || '')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 200)

          // Format: **Title** - Description
          const formatted = description
            ? `**${title}** - ${description}${description.length >= 200 ? '...' : ''}`
            : `**${title}**`

          keyFindings.push(formatted)
        }
      })

      return {
        firesearchData: articles.slice(0, 10), // Get more for Claude to filter
        keyFindings: keyFindings,
        strategy: strategy,
        dataQuality: 'fresh_search',
        searchQuery: searchQuery
      }
    }
  } catch (error) {
    console.error('Targeted FireSearch error:', error)
  }

  // No fallback to saved searches - return empty if search fails
  console.log('⚠️ Search failed, returning empty results')
  return {
    firesearchData: [],
    strategy: strategy,
    dataQuality: 'search_failed',
    error: 'Search failed - no results found'
  }
}

// Execute contextual response strategy
async function executeContextualResponse(message: string, organizationId: string, context: any, strategy: any) {
  console.log('💡 Executing contextual response strategy...')

  // Get organization profile for context
  const orgProfile = await getMcpDiscovery(organizationId)

  return {
    contextualData: {
      organization: orgProfile?.organization_name || organizationId,
      competitors: orgProfile?.competition?.direct_competitors?.slice(0, 5) || [],
      industry: orgProfile?.industry,
      context: context,
      strategy: strategy
    },
    dataQuality: 'contextual_only'
  }
}

// Execute fallback strategy when pipeline fails
async function executeFallbackStrategy(message: string, organizationId: string, context: any, strategy: any) {
  console.log('🔄 Executing fallback strategy...')

  // Try targeted FireSearch first
  try {
    const firesearchResult = await executeTargetedFireplexity(message, organizationId, context, strategy)
    if (firesearchResult.firesearchData.length > 0) {
      return { ...firesearchResult, fallbackUsed: 'firesearch' }
    }
  } catch (error) {
    console.error('Fallback FireSearch error:', error)
  }

  // Final fallback to contextual
  const contextualResult = await executeContextualResponse(message, organizationId, context, strategy)
  return { ...contextualResult, fallbackUsed: 'contextual' }
}

// MCP Tool Functions - Give NIV access to key capabilities

// Call enhanced intelligence pipeline (mirrors Intelligence Hub)
async function callEnhancedIntelligencePipeline(query: string, organizationId: string, context: any) {
  console.log('🎯 Calling Enhanced Intelligence Pipeline...')

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/niv-intelligence-pipeline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        query: query,
        organizationId: organizationId,
        timeWindow: '48h',
        context: {
          activeModule: context.activeModule,
          sessionId: context.sessionId
        }
      })
    })

    if (response.ok) {
      const data = await response.json()
      console.log(`✅ Intelligence Pipeline success: ${data.articles?.length || 0} articles`)
      return data
    } else {
      const errorText = await response.text()
      console.error('Intelligence Pipeline error:', response.status, errorText)
      return null
    }
  } catch (error) {
    console.error('Intelligence Pipeline call failed:', error)
    return null
  }
}

// Call FireSearch for elite research with answer validation
async function callFireplexity(query: string, context: any) {
  console.log('🔬 NIV calling FireSearch (elite research engine)...')
  console.log(`📝 Query: "${query}"`)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  try {
    // Determine timeframe based on query intent
    let timeframe = 'week' // default: past 7 days (more reasonable than 3)

    const queryLower = query.toLowerCase()
    if (queryLower.match(/breaking|just|today|current|right now|this morning/i)) {
      timeframe = 'current' // past 24 hours
    } else if (queryLower.match(/latest|recent|new/i)) {
      timeframe = 'recent' // past 3 days for truly recent queries
    } else if (queryLower.match(/this week/i)) {
      timeframe = 'week' // past 7 days
    } else if (queryLower.match(/this month|past month|market share|revenue|analysis|landscape|positioning/i)) {
      timeframe = 'month' // past 30 days for analysis queries
    }
    // Years like "2025" are context, not timeframe signals

    console.log(`⏰ Timeframe detected: ${timeframe}`)

    // Call Firecrawl directly (like monitor-stage-1-fireplexity does)
    // No wrappers, no validation, no decomposition - just search and return
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY') || 'fc-3048810124b640eb99293880a4ab25d0'
    const FIRECRAWL_BASE_URL = 'https://api.firecrawl.dev/v2'

    // Map timeframe to tbs parameter
    const tbsMap: Record<string, string> = {
      'current': 'qdr:h',    // Last hour
      'recent': 'qdr:d3',    // Last 3 days
      'week': 'qdr:w',       // Last week
      'month': 'qdr:m',      // Last month
      'year': ''             // No filter
    }
    const tbs = tbsMap[timeframe] || 'qdr:d3' // Default 3 days

    console.log(`🔥 Calling Firecrawl directly with tbs=${tbs}`)

    const response = await fetch(`${FIRECRAWL_BASE_URL}/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: query,
        limit: 10, // Get top 10 results
        tbs, // Time-based filter
        scrapeOptions: {
          formats: ['markdown'],
          onlyMainContent: true
        }
      })
    })

    if (response.ok) {
      const data = await response.json()

      if (data.success) {
        const webResults = data.data?.web || []
        const newsResults = data.data?.news || []
        const allResults = [...webResults, ...newsResults]

        console.log(`✅ Firecrawl complete:`)
        console.log(`   - Web results: ${webResults.length}`)
        console.log(`   - News results: ${newsResults.length}`)
        console.log(`   - Total: ${allResults.length}`)

        // Transform to article format
        const articles = allResults.map(result => ({
          title: result.title || 'Untitled',
          description: result.description || '',
          url: result.url,
          content: result.markdown || result.description || '',
          source: {
            name: extractSourceName(result.url),
            domain: extractDomain(result.url)
          },
          publishedAt: result.publishedTime || new Date().toISOString(),
          relevanceScore: result.score || 50
        }))

        return articles
      }
    }
  } catch (error) {
    console.error('FireSearch error:', error)
  }

  return []
}

// Helper: Extract source name from URL
function extractSourceName(url: string): string {
  try {
    const urlObj = new URL(url)
    const domain = urlObj.hostname.replace('www.', '')
    const parts = domain.split('.')
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
  } catch {
    return 'Unknown'
  }
}

// Helper: Extract domain from URL
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace('www.', '')
  } catch {
    return ''
  }
}

// Get organization profile from mcp-discovery
async function getMcpDiscovery(organizationInput: string = '7a2835cb-11ee-4512-acc3-b6caf8eb03ff') {
  console.log('🎯 NIV calling mcp-discovery for:', organizationInput)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase configuration')
      throw new Error('Database configuration missing')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log(`🔍 Searching for organization: "${organizationInput}" (type: ${typeof organizationInput})`)

    // Check if input looks like a UUID (contains hyphens and is 36 chars)
    const isUuid = organizationInput.includes('-') && organizationInput.length === 36

    if (isUuid) {
      // For UUIDs, search by organization_id FIRST (most likely match)
      console.log(`🔍 Detected UUID format, searching by organization_id`)
      const { data: profileById, error: idError } = await supabase
        .from('mcp_discovery')
        .select('*')
        .eq('organization_id', organizationInput)
        .single()

      if (!idError && profileById) {
        console.log(`✅ Found profile by organization_id: ${profileById.organization_name}`)

        // If profile has default "Technology" industry, update it with AI detection
        if (profileById.industry === 'Technology' && profileById.organization_name !== 'Technology') {
          console.log(`🔄 Profile has default industry, detecting actual industry for: ${profileById.organization_name}`)
          try {
            const industryPrompt = `What is the primary industry for the company "${profileById.organization_name}"?

Respond with ONLY the industry name (1-3 words max). Examples:
- "Technology"
- "Financial Services"
- "Trading & Distribution"
- "Manufacturing"
- "Healthcare"
- "Energy"
- "Retail"

Company: ${profileById.organization_name}
Industry:`

            const industryResponse = await anthropic.messages.create({
              model: 'claude-sonnet-4-20250514',
              max_tokens: 50,
              temperature: 0.3,
              messages: [{ role: 'user', content: industryPrompt }]
            })

            const detectedIndustry = industryResponse.content[0].text.trim()
            console.log(`🏭 AI-detected industry: ${detectedIndustry}`)

            // Update the profile in database
            const { data: updatedProfile, error: updateError } = await supabase
              .from('mcp_discovery')
              .update({ industry: detectedIndustry })
              .eq('organization_id', profileById.organization_id)
              .select()
              .single()

            if (updatedProfile && !updateError) {
              console.log(`✅ Updated profile industry to: ${detectedIndustry}`)
              return updatedProfile
            }
          } catch (error) {
            console.error('⚠️ Failed to update industry, using existing profile:', error)
          }
        }

        return profileById
      } else if (idError && idError.code !== 'PGRST116') {
        console.error('❌ Database error searching by organization_id:', idError)
      }
    }

    // For non-UUIDs OR if UUID search failed, try by organization_name
    console.log(`🔍 Searching by organization_name: "${organizationInput}"`)
    const { data: profile, error: nameError } = await supabase
      .from('mcp_discovery')
      .select('*')
      .eq('organization_name', organizationInput)
      .single()

    if (!nameError && profile) {
      console.log(`✅ Found profile by organization_name: ${profile.organization_name}`)

      // If profile has default "Technology" industry, update it with AI detection
      if (profile.industry === 'Technology' && profile.organization_name !== 'Technology') {
        console.log(`🔄 Profile has default industry, detecting actual industry for: ${profile.organization_name}`)
        try {
          const industryPrompt = `What is the primary industry for the company "${profile.organization_name}"?

Respond with ONLY the industry name (1-3 words max). Examples:
- "Technology"
- "Financial Services"
- "Trading & Distribution"
- "Manufacturing"
- "Healthcare"
- "Energy"
- "Retail"

Company: ${profile.organization_name}
Industry:`

          const industryResponse = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 50,
            temperature: 0.3,
            messages: [{ role: 'user', content: industryPrompt }]
          })

          const detectedIndustry = industryResponse.content[0].text.trim()
          console.log(`🏭 AI-detected industry: ${detectedIndustry}`)

          // Update the profile in database
          const { data: updatedProfile, error: updateError } = await supabase
            .from('mcp_discovery')
            .update({ industry: detectedIndustry })
            .eq('organization_name', profile.organization_name)
            .select()
            .single()

          if (updatedProfile && !updateError) {
            console.log(`✅ Updated profile industry to: ${detectedIndustry}`)
            return updatedProfile
          }
        } catch (error) {
          console.error('⚠️ Failed to update industry, using existing profile:', error)
        }
      }

      return profile
    } else if (nameError && nameError.code !== 'PGRST116') {
      console.error('❌ Database error searching by organization_name:', nameError)
    }

    // If not UUID search and name failed, try by organization_id as fallback
    if (!isUuid) {
      console.log(`🔍 Name search failed, trying by organization_id: "${organizationInput}"`)
      const { data: profileById, error: idError } = await supabase
        .from('mcp_discovery')
        .select('*')
        .eq('organization_id', organizationInput)
        .single()

      if (!idError && profileById) {
        console.log(`✅ Found profile by organization_id: ${profileById.organization_name}`)

        // If profile has default "Technology" industry, update it with AI detection
        if (profileById.industry === 'Technology' && profileById.organization_name !== 'Technology') {
          console.log(`🔄 Profile has default industry, detecting actual industry for: ${profileById.organization_name}`)
          try {
            const industryPrompt = `What is the primary industry for the company "${profileById.organization_name}"?

Respond with ONLY the industry name (1-3 words max). Examples:
- "Technology"
- "Financial Services"
- "Trading & Distribution"
- "Manufacturing"
- "Healthcare"
- "Energy"
- "Retail"

Company: ${profileById.organization_name}
Industry:`

            const industryResponse = await anthropic.messages.create({
              model: 'claude-sonnet-4-20250514',
              max_tokens: 50,
              temperature: 0.3,
              messages: [{ role: 'user', content: industryPrompt }]
            })

            const detectedIndustry = industryResponse.content[0].text.trim()
            console.log(`🏭 AI-detected industry: ${detectedIndustry}`)

            // Update the profile in database
            const { data: updatedProfile, error: updateError } = await supabase
              .from('mcp_discovery')
              .update({ industry: detectedIndustry })
              .eq('organization_id', profileById.organization_id)
              .select()
              .single()

            if (updatedProfile && !updateError) {
              console.log(`✅ Updated profile industry to: ${detectedIndustry}`)
              return updatedProfile
            }
          } catch (error) {
            console.error('⚠️ Failed to update industry, using existing profile:', error)
          }
        }

        return profileById
      } else if (idError && idError.code !== 'PGRST116') {
        console.error('❌ Database error searching by organization_id:', idError)
      }
    }

    // If still not found, create a new entry with AI-detected industry
    console.log(`📝 Creating new discovery profile for: ${organizationInput}`)

    // First, try to get the actual organization name from the organizations table
    let organizationName = organizationInput
    if (isUuid) {
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', organizationInput)
        .single()

      if (!orgError && orgData) {
        organizationName = orgData.name
        console.log(`✅ Found organization name from organizations table: ${organizationName}`)
      } else {
        console.log(`⚠️ Organization not found in organizations table, using UUID as name`)
      }
    }

    // Use Claude to intelligently detect the industry
    let detectedIndustry = 'Technology' // Default fallback
    try {
      const industryPrompt = `What is the primary industry for the company "${organizationName}"?

Respond with ONLY the industry name (1-3 words max). Examples:
- "Technology"
- "Financial Services"
- "Trading & Distribution"
- "Manufacturing"
- "Healthcare"
- "Energy"
- "Retail"

Company: ${organizationName}
Industry:`

      const industryResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 50,
        temperature: 0.3,
        messages: [{ role: 'user', content: industryPrompt }]
      })

      detectedIndustry = industryResponse.content[0].text.trim()
      console.log(`🏭 AI-detected industry: ${detectedIndustry}`)
    } catch (error) {
      console.error('⚠️ Failed to detect industry, using default:', error)
    }

    try {
      const newProfileData = {
        organization_id: organizationInput,
        organization_name: organizationName,
        industry: detectedIndustry,
        competition: {
          direct_competitors: [],
          indirect_competitors: []
        },
        keywords: [organizationName],
        created_at: new Date().toISOString()
      }

      console.log('🔨 Attempting to create profile with data:', newProfileData)

      const { data: newProfile, error: insertError } = await supabase
        .from('mcp_discovery')
        .insert(newProfileData)
        .select()
        .single()

      if (insertError) {
        console.error('❌ Database error creating discovery profile:', insertError)
        console.log('📋 Returning default profile due to insert error')
        return createDefaultProfile(organizationInput)
      }

      console.log(`✅ Created new profile: ${newProfile.organization_name}`)
      return newProfile

    } catch (insertException) {
      console.error('❌ Exception creating discovery profile:', insertException)
      console.log('📋 Returning default profile due to exception')
      return createDefaultProfile(organizationInput)
    }

  } catch (error) {
    console.error('❌ Critical error in getMcpDiscovery:', error)
    console.log('📋 Returning default profile due to critical error')
    return createDefaultProfile(organizationInput)
  }
}

// Helper function to create a default profile
function createDefaultProfile(organizationInput: string) {
  return {
    organization_name: organizationInput,
    organization_id: organizationInput,
    industry: 'Technology',
    competition: { direct_competitors: [], indirect_competitors: [] },
    keywords: [organizationInput]
  }
}

// Get curated sources from master-source-registry
async function getMasterSources(industry: string = 'technology') {
  console.log('📚 NIV calling master-source-registry...')

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/master-source-registry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        industry: industry
      })
    })

    if (response.ok) {
      const data = await response.json()
      return data
    }
  } catch (error) {
    console.error('Master sources error:', error)
  }

  return null
}

// V4: Call Knowledge Library Registry for academic research
async function callKnowledgeLibrary(pattern: string, priorityFilter?: string) {
  console.log(`📚 NIV calling knowledge-library-registry for pattern: ${pattern}`)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/knowledge-library-registry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        pattern: pattern,
        priority_filter: priorityFilter || 'critical'
      })
    })

    if (response.ok) {
      const data = await response.json()
      console.log(`✅ Knowledge Library: ${data.metadata?.total_resources || 0} resources returned`)
      return data
    } else {
      console.error('Knowledge Library error:', response.status)
      return null
    }
  } catch (error) {
    console.error('Knowledge Library call failed:', error)
    return null
  }
}

// V4: Call Campaign Orchestrator for total-spectrum campaigns
async function callCampaignOrchestrator(concept: any, pattern: string, knowledge: any) {
  console.log(`🎯 NIV calling niv-campaign-orchestrator for ${pattern} campaign`)

  try {
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/niv-campaign-orchestrator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
      },
      body: JSON.stringify({
        pattern: pattern,
        concept: concept,
        knowledge: knowledge,
        organizationId: concept.organizationId || '1'
      })
    })

    if (response.ok) {
      const data = await response.json()
      console.log(`✅ Campaign Orchestrator: Generated ${pattern} blueprint with ${data.blueprint?.vectors?.length || 0} vectors`)

      return {
        success: true,
        pattern: pattern,
        blueprint: data.blueprint,
        message: data.message || `Generated ${pattern} campaign blueprint with multi-vector strategy.`,
        action: {
          type: 'campaign_ready',
          ui_prompt: 'Open Campaign Planner with this blueprint',
          data: {
            blueprint: data.blueprint
          }
        }
      }
    } else {
      const errorText = await response.text()
      console.error(`❌ Campaign Orchestrator error: ${response.status}`, errorText)

      // Fallback: return basic blueprint structure
      return {
        success: false,
        pattern: pattern,
        message: `Campaign orchestrator encountered an error. Using basic blueprint structure.`,
        action: {
          type: 'campaign_ready',
          ui_prompt: 'Open Campaign Planner with basic blueprint',
          data: {
            blueprint: {
              pattern: pattern,
              strategy: {
                objective: concept.goal || 'Define campaign objective',
                narrative: concept.narrative || 'Define narrative strategy',
                keyMessages: ['Key message 1', 'Key message 2', 'Key message 3']
              },
              vectors: [],
              contentStrategy: {
                autoExecutableContent: {
                  contentTypes: [],
                  totalPieces: 0
                }
              },
              timeline: {
                total_duration: '6 weeks'
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Campaign Orchestrator call failed:', error)

    // Fallback: return basic blueprint structure
    return {
      success: false,
      pattern: pattern,
      message: `Campaign orchestrator is unavailable. Using basic blueprint structure.`,
      action: {
        type: 'campaign_ready',
        ui_prompt: 'Open Campaign Planner with basic blueprint',
        data: {
          blueprint: {
            pattern: pattern,
            strategy: {
              objective: concept.goal || 'Define campaign objective',
              narrative: concept.narrative || 'Define narrative strategy',
              keyMessages: ['Key message 1', 'Key message 2', 'Key message 3']
            },
            vectors: [],
            contentStrategy: {
              autoExecutableContent: {
                contentTypes: [],
                totalPieces: 0
              }
            },
            timeline: {
              total_duration: '6 weeks'
            }
          }
        }
      }
    }
  }
}

// Token and memory management utilities
function estimateTokenCount(text: string): number {
  // Rough estimate: 1 token per 4 characters
  return Math.ceil(text.length / 4)
}

function truncateConversationHistory(conversationHistory: any[], maxTokens: number = 3000): any[] {
  if (!conversationHistory || conversationHistory.length === 0) {
    return []
  }

  // Always keep the last message and work backwards
  const truncated = []
  let tokenCount = 0

  // Start from the most recent messages
  for (let i = conversationHistory.length - 1; i >= 0; i--) {
    const msg = conversationHistory[i]
    const msgTokens = estimateTokenCount(msg.content || '')

    if (tokenCount + msgTokens > maxTokens && truncated.length > 0) {
      // We've hit the limit, stop adding more
      break
    }

    truncated.unshift(msg)
    tokenCount += msgTokens
  }

  return truncated
}

// Detect if user is providing a structured request with explicit sections
function detectStructuredRequest(message: string): { isStructured: boolean; sections: string[]; structure: any } {
  const lower = message.toLowerCase()

  // Pattern 1: "Include: 1) ... 2) ... 3) ..."
  const numberedMatch = message.match(/include:?\s*(?:the following:?)?\s*1\)|1\./i)
  if (numberedMatch) {
    // Extract numbered sections
    const sections = []
    const lines = message.split(/\n|(?=\d+[\)\.])/)

    for (const line of lines) {
      const sectionMatch = line.match(/(\d+)[\)\.]\s*(.+?)(?=\d+[\)\.]|$)/s)
      if (sectionMatch) {
        sections.push({
          number: parseInt(sectionMatch[1]),
          text: sectionMatch[2].trim()
        })
      }
    }

    if (sections.length > 0) {
      return {
        isStructured: true,
        sections: sections.map(s => s.text),
        structure: {
          type: 'numbered_list',
          count: sections.length,
          items: sections
        }
      }
    }
  }

  // Pattern 2: Bullet points or explicit sections
  if (lower.includes('include:') || lower.includes('provide:') || lower.includes('need:')) {
    const bulletMatch = message.match(/[-•*]\s+(.+)/g)
    if (bulletMatch && bulletMatch.length >= 3) {
      return {
        isStructured: true,
        sections: bulletMatch.map(b => b.replace(/^[-•*]\s+/, '').trim()),
        structure: {
          type: 'bullet_list',
          count: bulletMatch.length,
          items: bulletMatch
        }
      }
    }
  }

  return {
    isStructured: false,
    sections: [],
    structure: null
  }
}

// Build structured response section-by-section based on user's requested sections
// NEW: Build structured response using Claude to intelligently answer each section
async function buildIntelligentStructuredResponse(
  sections: string[],
  researchData: any,
  organizationName: string,
  userQuery: string
): Promise<any> {
  console.log(`📝 Building intelligent structured response with ${sections.length} sections`)

  // Build the prompt for Claude to answer all sections
  const sectionsText = sections.map((s, i) => `${i + 1}) ${s}`).join('\n')

  const researchSummary = researchData.synthesis?.[0] ||
    researchData.keyFindings?.slice(0, 3).join('. ') ||
    'Market research data available'

  const articlesText = researchData.articles?.slice(0, 5).map((a: any) =>
    `- ${a.title}: ${a.description || ''}`
  ).join('\n') || 'No articles available'

  const prompt = `You are a strategic PR advisor for ${organizationName}. Answer each of these questions comprehensively and specifically:

${sectionsText}

Use this research to inform your answers:

RESEARCH SUMMARY:
${researchSummary}

RECENT ARTICLES:
${articlesText}

CRITICAL INSTRUCTIONS:
- Answer EVERY question with real, specific content - NO placeholders like "to be developed"
- Use the research data to support your answers with facts and insights
- Be specific and actionable - provide real recommendations
- Format your response as JSON with these exact keys:
  - objective: {statement, measurable, timebound}
  - narrative: {core_story, proof_points: [], key_messages: []}
  - audiences: {segments: [{segment, priority, message}]}
  - contentStrategy: {content_types: [], distribution_channels: [], priority_order: []}
  - mediaTargets: {tier1: [], tier2: [], tier3: []}
  - timeline: {immediate: [], week_1: [], week_2_4: [], month_2_3: [], milestones: []}
  - metrics: {kpis: [{metric, target, tracking}], success_criteria: []}

Return ONLY the JSON object, no other text.`

  try {
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      }),
    })

    if (!anthropicResponse.ok) {
      throw new Error(`Claude API error: ${await anthropicResponse.text()}`)
    }

    const claudeData = await anthropicResponse.json()
    const responseText = claudeData.content[0].text

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in Claude response')
    }

    const structuredResponse = JSON.parse(jsonMatch[0])
    console.log('✅ Claude generated intelligent structured response')
    return structuredResponse

  } catch (error) {
    console.error('❌ Error generating intelligent structured response:', error)
    // Fallback to extraction if Claude fails
    return buildStructuredResponse(sections, researchData, organizationName, userQuery)
  }
}

// Fallback: Extract structured response from research data (used if Claude call fails)
async function buildStructuredResponse(
  sections: string[],
  researchData: any,
  organizationName: string,
  userQuery: string
): Promise<any> {
  console.log(`📝 Building structured response with ${sections.length} sections (extraction mode)`)

  const response: any = {}

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i]
    const sectionLower = section.toLowerCase()

    console.log(`  Section ${i + 1}/${sections.length}: ${section}`)

    // Map section to appropriate data
    if (sectionLower.includes('objective') || sectionLower.includes('goal')) {
      response.objective = extractObjectiveFromSection(section, researchData, userQuery)
    }
    else if (sectionLower.includes('narrative') || sectionLower.includes('story') || sectionLower.includes('proof')) {
      response.narrative = extractNarrativeFromSection(section, researchData)
    }
    else if (sectionLower.includes('audience') || sectionLower.includes('segment')) {
      response.audiences = extractAudiencesFromSection(section, researchData)
    }
    else if (sectionLower.includes('content') && sectionLower.includes('distribution')) {
      response.contentStrategy = extractContentStrategyFromSection(section, researchData)
    }
    else if (sectionLower.includes('media') && sectionLower.includes('tier')) {
      response.mediaTargets = extractMediaTargetsFromSection(section, researchData)
    }
    else if (sectionLower.includes('timeline') || sectionLower.includes('milestone')) {
      response.timeline = extractTimelineFromSection(section, researchData, userQuery)
    }
    else if (sectionLower.includes('metric') || sectionLower.includes('kpi') || sectionLower.includes('success')) {
      response.metrics = extractMetricsFromSection(section, researchData)
    }
    else {
      // Generic section - just include it
      response[`section_${i + 1}`] = {
        title: section,
        content: `Content for: ${section}`,
        source: 'user_requested'
      }
    }
  }

  return response
}

// Helper functions for extracting specific sections from research
function extractObjectiveFromSection(section: string, research: any, userQuery: string): any {
  const queryLower = userQuery.toLowerCase()
  let objective = ''

  // Try to extract from query
  const launchMatch = queryLower.match(/launch (?:of |for )?([^.]+)/)
  if (launchMatch) {
    const product = launchMatch[1]
    objective = `Establish ${product} as a market leader`
  } else {
    objective = `Strategic initiative for ${research.organizationName || 'organization'}`
  }

  // Add measurability
  if (!objective.includes('%') && !objective.includes('market share')) {
    objective += ' by capturing significant market share within 90 days'
  }

  return {
    statement: objective,
    measurable: true,
    timebound: '90 days',
    source: 'derived_from_query'
  }
}

function extractNarrativeFromSection(section: string, research: any): any {
  const synthesis = research?.synthesis?.[0] || ''
  const keyFindings = research?.keyFindings?.slice(0, 3) || []

  return {
    core_story: synthesis || 'Strategic narrative based on market insights',
    proof_points: keyFindings,
    supporting_evidence: research?.articles?.slice(0, 3).map((a: any) => a.title) || []
  }
}

function extractAudiencesFromSection(section: string, research: any): any {
  // Extract audiences from research or use defaults
  const audiences = [
    { segment: 'Enterprise decision-makers', priority: 'primary' },
    { segment: 'Industry analysts and media', priority: 'secondary' },
    { segment: 'End users and practitioners', priority: 'tertiary' }
  ]

  return {
    segments: audiences,
    total_count: audiences.length,
    source: 'market_analysis'
  }
}

function extractContentStrategyFromSection(section: string, research: any): any {
  // Map to valid MCP content types
  return {
    content_types: [
      'press-release',
      'blog-post',
      'thought-leadership',
      'case-study',
      'white-paper',
      'social-post',
      'media-pitch'
    ],
    distribution_channels: ['Owned media', 'Earned media', 'Social media', 'Industry publications'],
    priority_order: ['press-release', 'blog-post', 'media-pitch']
  }
}

function extractMediaTargetsFromSection(section: string, research: any): any {
  return {
    tier1: research?.mediaTargets?.tier1 || ['TechCrunch', 'The Verge', 'Wired'],
    tier2: research?.mediaTargets?.tier2 || ['VentureBeat', 'Ars Technica', 'Fast Company'],
    tier3: research?.mediaTargets?.tier3 || ['Industry trade publications', 'Regional tech media']
  }
}

function extractTimelineFromSection(section: string, research: any, userQuery: string): any {
  return {
    immediate: ['Finalize messaging', 'Brief internal teams', 'Prepare media materials'],
    week_1: ['Launch media outreach', 'Publish initial content', 'Activate social channels'],
    week_2_4: ['Sustain media momentum', 'Publish case studies', 'Host media briefings'],
    month_2_3: ['Measure impact', 'Refine strategy', 'Plan next phase'],
    milestones: [
      { date: 'Day 1', event: 'Launch announcement', metric: 'Press release distribution' },
      { date: 'Week 1', event: 'Media coverage', metric: '10+ tier-1 stories' },
      { date: 'Month 1', event: 'Market awareness', metric: '30% increase in brand mentions' }
    ]
  }
}

function extractMetricsFromSection(section: string, research: any): any {
  return {
    kpis: [
      { metric: 'Media coverage', target: '25+ tier-1 stories', tracking: 'Media monitoring tools' },
      { metric: 'Market share', target: '35% in target segment', tracking: 'Market research' },
      { metric: 'Brand awareness', target: '40% increase', tracking: 'Survey data' },
      { metric: 'Engagement', target: '100K+ social interactions', tracking: 'Analytics platforms' }
    ],
    success_criteria: [
      'Achieved tier-1 media coverage',
      'Met market share targets',
      'Positive sentiment maintained'
    ]
  }
}

function truncateResearchHistory(researchHistory: any[], maxTokens: number = 2000): any[] {
  if (!researchHistory || researchHistory.length === 0) {
    return []
  }

  const truncated = []
  let tokenCount = 0

  // Start from the most recent research
  for (let i = researchHistory.length - 1; i >= 0; i--) {
    const research = researchHistory[i]
    let researchText = ''

    if (research.results.intelligencePipeline?.articles) {
      researchText += `Found ${research.results.intelligencePipeline.articles.length} articles. `
    }
    if (research.results.intelligencePipeline?.synthesis) {
      // Truncate synthesis to 200 chars to keep it manageable
      researchText += `Synthesis: ${research.results.intelligencePipeline.synthesis.substring(0, 200)}... `
    }
    if (research.results.firesearchData) {
      researchText += `FireSearch found ${research.results.firesearchData.length} validated sources. `
    }

    const researchTokens = estimateTokenCount(researchText)

    if (tokenCount + researchTokens > maxTokens && truncated.length > 0) {
      break
    }

    truncated.unshift({
      ...research,
      summarizedText: researchText
    })
    tokenCount += researchTokens
  }

  return truncated
}

function cleanupOldConceptStates() {
  // Remove concept states older than 24 hours to prevent memory leaks
  const maxAge = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
  const now = Date.now()

  for (const [conversationId, state] of conceptStates.entries()) {
    if (now - state.lastUpdate > maxAge) {
      conceptStates.delete(conversationId)
      console.log(`🧹 Cleaned up old concept state for conversation: ${conversationId}`)
    }
  }
}

// Build structured message for Claude with tool results and narration
function buildClaudeMessage(
  userMessage: string,
  toolResults: any,
  queryType: string,
  strategy?: any,
  conversationHistory?: any[],
  shouldGenerateFramework?: boolean,
  conceptState?: ConceptState
): string {
  // CRITICAL: Dynamic date functions called at request time
  const getCurrentDate = () => {
    const now = new Date()
    return now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getCurrentYear = () => new Date().getFullYear()
  const getCurrentMonth = () => new Date().toLocaleDateString('en-US', { month: 'long' })
  const getThreeMonthsFromNow = () => {
    const date = new Date()
    date.setMonth(date.getMonth() + 3)
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  let message = ""

  // START WITH CLIENT CONTEXT - But emphasize it's just a starting point
  if (toolResults.discoveryData) {
    const data = toolResults.discoveryData
    message += `**BASELINE CLIENT PROFILE - ${data.organizationName}:**\n`
    message += `• Industry: ${data.industry}\n`

    if (data.competitors && data.competitors.length > 0) {
      message += `• Known Competitors (may be incomplete): ${data.competitors.join(', ')}\n`
    }

    if (data.keywords && data.keywords.length > 0) {
      message += `• Initial Keywords (expand beyond these): ${data.keywords.slice(0, 8).join(', ')}\n`
    }

    message += `\nIMPORTANT: This is just baseline data. You should actively research CURRENT developments about ${data.organizationName}, discover new competitors, identify recent announcements, and provide up-to-date strategic insights beyond this basic profile.\n\n`
  }

  // Add truncated conversation context to prevent token overflow
  if (conversationHistory && conversationHistory.length > 0) {
    const truncatedHistory = truncateConversationHistory(conversationHistory, 3000)
    const truncatedCount = conversationHistory.length - truncatedHistory.length

    message += "**Recent Conversation History:**\n"
    if (truncatedCount > 0) {
      message += `(Showing last ${truncatedHistory.length} messages, ${truncatedCount} earlier messages omitted for length)\n\n`
    }

    truncatedHistory.forEach(msg => {
      // Truncate individual messages if they're extremely long
      let content = msg.content || ''
      if (content.length > 1500) {
        content = content.substring(0, 1500) + '...[truncated]'
      }
      message += `${msg.role === 'user' ? 'User' : 'NIV'}: ${content}\n\n`
    })
    message += "\n**Current User Query:**\n"
  }

  message += userMessage

  // Add concept building state with ALL accumulated research
  if (conceptState) {
    message += `\n\n**Campaign Concept Progress:**\n`
    message += `Stage: ${conceptState.stage} (${conceptState.confidence}% complete)\n`

    if (conceptState.concept.goal) {
      message += `Goal: ${conceptState.concept.goal}\n`
    }
    if (conceptState.concept.audience) {
      message += `Audience: ${conceptState.concept.audience}\n`
    }
    if (conceptState.concept.narrative) {
      message += `Narrative: ${conceptState.concept.narrative}\n`
    }
    if (conceptState.concept.timeline) {
      message += `Timeline: ${conceptState.concept.timeline}\n`
    }

    // Add user preferences
    if (conceptState.userPreferences.wants.length > 0) {
      message += `\n**What the user WANTS:**\n`
      conceptState.userPreferences.wants.forEach(want => {
        message += `- ${want}\n`
      })
    }

    if (conceptState.userPreferences.doesNotWant.length > 0) {
      message += `\n**What the user DOES NOT WANT:**\n`
      conceptState.userPreferences.doesNotWant.forEach(noWant => {
        message += `- ${noWant}\n`
      })
    }

    // Add summarized recent research to prevent token overflow
    if (conceptState.researchHistory.length > 0) {
      const truncatedResearch = truncateResearchHistory(conceptState.researchHistory, 2000)
      const omittedCount = conceptState.researchHistory.length - truncatedResearch.length

      message += `\n**Recent Research Summary:**\n`
      if (omittedCount > 0) {
        message += `(Showing last ${truncatedResearch.length} research rounds, ${omittedCount} earlier rounds omitted for length)\n\n`
      }

      truncatedResearch.forEach((research, idx) => {
        const actualIdx = conceptState.researchHistory.length - truncatedResearch.length + idx + 1
        message += `Research Round ${actualIdx}: ${research.summarizedText}\n`
      })
    }

    // Add what's still needed
    const missing = conceptState.elementsNeeded.filter(e => !conceptState.elementsDiscussed.includes(e))
    if (missing.length > 0) {
      message += `\nStill need to discuss: ${missing.join(', ')}\n`
    }

    // Add proactive consultation instruction
    message += `\n**Consultation Approach:**\n`
    message += `As a strategic consultant, you should:\n`
    message += `1. Acknowledge what's been discussed and build on it\n`
    message += `2. Bring relevant insights and research to inform the concept\n`
    message += `3. Ask ONE strategic question to move the concept forward\n`
    message += `4. Guide toward a complete, actionable campaign concept\n`

    if (conceptState.stage === 'finalizing' || conceptState.stage === 'ready') {
      message += `\nThe concept is nearly complete. Help refine and finalize it for orchestration.\n`
    }
  }

  // Add mode-specific instructions based on whether we're generating a framework
  if (!shouldGenerateFramework) {
    // RESEARCH MODE - Present findings objectively
    message += `\n\n**Research Mode Instructions:**
Present the research findings clearly and objectively.
Focus on facts, trends, and newsworthy developments.
Summarize what's happening without strategic interpretation.
If the user wants strategic analysis, they'll ask for it explicitly.
Save strategic recommendations for when explicitly requested.\n`
  } else {
    // FRAMEWORK GENERATION MODE - Generate complete strategic framework
    message += `\n\n**🎯 STRATEGIC FRAMEWORK GENERATION:**\n`
    message += `Generate a COMPLETE strategic framework based on all research and conversation history.\n\n`

    // Summarize accumulated research for context
    if (conceptState && conceptState.researchHistory.length > 0) {
      message += `**Research Conducted: ${conceptState.researchHistory.length} rounds**\n`

      // Extract key findings from recent research
      const keyFindings: string[] = []
      conceptState.researchHistory.slice(-3).forEach((research: any) => {
        if (research.results?.intelligencePipeline?.synthesis) {
          keyFindings.push(research.results.intelligencePipeline.synthesis.substring(0, 150) + '...')
        }
        if (research.results?.keyFindings && Array.isArray(research.results.keyFindings)) {
          research.results.keyFindings.slice(0, 2).forEach((finding: string) => {
            keyFindings.push(finding.substring(0, 150) + '...')
          })
        }
      })

      if (keyFindings.length > 0) {
        message += `\n**Key Intelligence from Research:**\n`
        keyFindings.slice(0, 5).forEach((finding, i) => {
          message += `${i+1}. ${finding}\n`
        })
      }
    }

    // Summarize conversation goals
    if (conceptState && conceptState.concept) {
      message += `\n**Campaign Objectives Discussed:**\n`
      if (conceptState.concept.goal) message += `- Goal: ${conceptState.concept.goal}\n`
      if (conceptState.concept.audience) message += `- Audience: ${conceptState.concept.audience}\n`
      if (conceptState.concept.narrative) message += `- Narrative: ${conceptState.concept.narrative}\n`
    }

    message += `\n**NOW CREATE A COMPLETE STRATEGIC FRAMEWORK:**\n\n`

    message += `**CRITICAL - TEMPORAL AWARENESS:**\n`
    message += `TODAY IS: ${getCurrentDate()}\n`
    message += `CURRENT YEAR: ${getCurrentYear()}\n`
    message += `THREE MONTHS FROM NOW: ${getThreeMonthsFromNow()}\n`
    message += `- ALL timeline goals must use dates AFTER today\n`
    message += `- Example GOOD: "Achieve 30% share of voice by ${getThreeMonthsFromNow()}"\n`
    message += `- Example BAD: "Achieve 30% by March 2025" (if today is October 2025)\n\n`

    message += `**EXECUTIVE SUMMARY**\n`
    message += `[2-3 paragraphs synthesizing the opportunity, approach, and expected impact]\n\n`

    message += `**STRATEGIC OBJECTIVES**\n`
    message += `- Primary Goal: [Measurable objective with specific date AFTER ${getCurrentDate()}]\n`
    message += `- Supporting Goals: [2-3 secondary objectives with dates]\n`
    message += `- Success Metrics: [How we measure victory with timeframes]\n\n`

    message += `**CORE NARRATIVE & MESSAGING**\n`
    message += `- The Story: [2-3 sentence narrative]\n`
    message += `- Key Messages:\n`
    message += `  1. [Message 1]\n`
    message += `  2. [Message 2]\n`
    message += `  3. [Message 3]\n\n`

    message += `**TACTICAL PLAN**\n`
    message += `Media Strategy:\n`
    message += `- Tier 1 Targets: [Top media outlets and journalists]\n`
    message += `- Exclusive Angles: [Story hooks for each tier]\n\n`
    message += `Content Creation (ONLY use these valid content types):\n`
    message += `- press-release: Core announcement\n`
    message += `- media-pitch: Personalized journalist outreach\n`
    message += `- media-list: Target journalists with contact info\n`
    message += `- qa-document: Anticipated questions and answers\n`
    message += `- talking-points: Executive messaging guide\n`
    message += `- social-post: Multi-platform content\n`
    message += `- email: Sequenced outreach campaign\n`
    message += `DO NOT suggest content types outside this list (no "Executive briefings", "White papers", etc.)\n\n`
    message += `Stakeholder Engagement:\n`
    message += `- Internal: [Employee/leadership alignment]\n`
    message += `- External: [Customer/partner/investor outreach]\n\n`

    message += `**IMMEDIATE ACTIONS (48 HOURS)**\n`
    message += `1. [Specific action with owner]\n`
    message += `2. [Specific action with owner]\n`
    message += `3. [Specific action with owner]\n\n`

    message += `**TIMELINE & MILESTONES**\n`
    message += `- Phase 1 (Weeks 1-2 starting TODAY ${getCurrentDate()}): [Initial rollout with specific dates]\n`
    message += `- Phase 2 (Weeks 3-4): [Amplification with milestones]\n`
    message += `- Phase 3 (By ${getThreeMonthsFromNow()}): [Long-term sustained momentum]\n\n`

    message += `Base EVERYTHING on our research and conversations. Be SPECIFIC and ACTIONABLE.\n`
    message += `**IMPORTANT:** Use actual future dates (like "${getThreeMonthsFromNow()}"), not past dates.\n`
    message += `End with: "What specific aspects of this strategy would you like me to help execute first?"\n`
  }

  // Add proposal generation instructions if orchestrated research completed
  if (toolResults?.generateProposals) {
    message += `\n\n**🎯 STRATEGIC RESPONSE STRUCTURE:**\n\n`
    message += `Research complete (${toolResults.proposalContext.articlesAnalyzed} sources analyzed). User Goal: "${toolResults.proposalContext.userObjective}"\n\n`

    message += `**STRUCTURE YOUR RESPONSE EXACTLY LIKE THIS:**\n\n`

    message += `**1. INTELLIGENCE BRIEFING**\n`
    message += `[2-3 paragraphs on what you discovered in the research - market dynamics, competitive moves, opportunities]\n\n`

    message += `**2. COMPETITIVE INTELLIGENCE**\n`
    message += `[Specific competitor activities and vulnerabilities discovered]\n\n`

    message += `**3. KEY STRATEGIC OPPORTUNITY**\n`
    message += `[The main opportunity you've identified based on research]\n\n`

    message += `Then say: "Based on this intelligence, I can develop three distinct campaign approaches. Would you like me to:\n`
    message += `A) Present high-level campaign concepts for your selection\n`
    message += `B) Dive deeper into specific intelligence findings\n`
    message += `C) Move directly to building a detailed strategic framework"\n\n`

    message += `**IMPORTANT:** Stop after presenting the intelligence and offering options. Do NOT continue with detailed campaigns unless asked.\n`
  }

  // Add organization context first (critical for proper responses)
  if (toolResults.discoveryData) {
    message += `\n\n**ORGANIZATION CONTEXT:**\n`
    message += `*Client: ${toolResults.discoveryData.organizationName || 'Unknown'}*\n`
    message += `*Industry: ${toolResults.discoveryData.industry || 'Technology'}*\n`
    message += `*Key Competitors: ${toolResults.discoveryData.competitors?.slice(0, 3).join(', ') || 'None listed'}*\n`
    message += `IMPORTANT: Always refer to the client as "${toolResults.discoveryData.organizationName}" not "we" or "your organization"\n`
  }

  // Add Memory Vault guidance if available
  if (toolResults.memoryVault) {
    message += `\n\n**MEMORY VAULT - PAST SUCCESS PATTERNS:**\n`
    message += toolResults.memoryVault.guidance + '\n'
    message += `\n*Use these proven patterns to inform your strategic recommendations.*\n`
  }

  // Add intelligence pipeline data if available (preferred)
  if (toolResults.intelligencePipeline) {
    const pipeline = toolResults.intelligencePipeline

    message += `\n\n**INTELLIGENCE PIPELINE RESULTS:**\n`

    if (pipeline.stats) {
      message += `*Pipeline Stats: ${pipeline.stats.totalFound} found → ${pipeline.stats.afterPRFilter} after PR filter → ${pipeline.stats.afterScoring} after scoring*\n`
    }

    // Add executive synthesis if available
    if (pipeline.synthesis) {
      message += `\n**EXECUTIVE SYNTHESIS:**\n${pipeline.synthesis}\n`
    }

    // Add top articles with relevance scores
    if (pipeline.articles && pipeline.articles.length > 0) {
      message += `\n**TOP ARTICLES:**\n`
      pipeline.articles.slice(0, 6).forEach((article: any, i: number) => {
        const date = article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : ''
        const relevance = article.relevanceScore ? ` (${article.relevanceScore}% relevant)` : ''
        const priority = article.prPriority ? ` [${article.prPriority.toUpperCase()}]` : ''

        message += `\n${i + 1}. **${article.title}**${priority}\n`
        message += `   ${article.description || 'No description available'}\n`
        message += `   *Source: ${article.source?.name || 'Unknown'}${date ? ` • ${date}` : ''}${relevance}*\n`

        if (article.relevanceFactors && article.relevanceFactors.length > 0) {
          message += `   *Factors: ${article.relevanceFactors.join(', ')}*\n`
        }
      })
    }

    message += `\n\nPlease provide a strategic response based on this intelligence analysis.`
    return message
  }

  // Tool narration removed - Claude will integrate naturally

  // Fallback to FireSearch data if available
  if (toolResults.firesearchData && toolResults.firesearchData.length > 0) {
    message += `\n\n**FIRESEARCH TOOL RESULTS (Validated Sources):**\n`
    toolResults.firesearchData.forEach((article: any, i: number) => {
      const date = article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : ''
      const relevance = article.relevance_score ? ` (${article.relevance_score}% relevant)` : ''

      message += `\n${i + 1}. **${article.title}**\n`
      message += `   ${article.description || 'No description available'}\n`
      message += `   *Source: ${article.source?.name || 'Unknown'}${date ? ` • ${date}` : ''}${relevance}*\n`

      if (article.competitive_entities && article.competitive_entities.length > 0) {
        message += `   *Mentions: ${article.competitive_entities.join(', ')}*\n`
      }
    })
  }

  // Add discovery data if available
  if (toolResults.discoveryData) {
    const data = toolResults.discoveryData
    message += `\n\n**MCP-DISCOVERY TOOL RESULTS:**\n`

    if (data.competitors && data.competitors.length > 0) {
      message += `• **Direct Competitors:** ${data.competitors.join(', ')}\n`
    }

    if (data.keywords && data.keywords.length > 0) {
      message += `• **Key Topics:** ${data.keywords.slice(0, 8).join(', ')}\n`
    }

    if (data.industry) {
      message += `• **Industry:** ${data.industry}\n`
    }
  }

  // Natural conversation request
  message += `\n\n**CRITICAL INSTRUCTION: Be intelligent about what the user actually wants.**\n\n`

  // Check if user provided a numbered/bulleted list of specific requests
  const hasNumberedRequests = /\d+\.\s+\w+/g.test(userMessage) ||
                              /^[-•*]\s+/gm.test(userMessage)
  const numberedItems = userMessage.match(/\d+\.\s+[^\n]+/g) || []

  // Check if user is asking for exploration/brainstorming
  const wantsBrainstorming = userMessage.toLowerCase().includes('brainstorm') ||
                             userMessage.toLowerCase().includes('explore') ||
                             userMessage.toLowerCase().includes('what if') ||
                             userMessage.toLowerCase().includes('ideas')

  // Check if user explicitly wants a framework
  const wantsFramework = userMessage.toLowerCase().includes('create a framework') ||
                        userMessage.toLowerCase().includes('build a framework') ||
                        userMessage.toLowerCase().includes('strategic framework')

  // Check if user wants specific campaign options/proposals
  const wantsProposals = userMessage.toLowerCase().includes('give me options') ||
                        userMessage.toLowerCase().includes('propose') ||
                        userMessage.toLowerCase().includes('3 approaches') ||
                        userMessage.toLowerCase().includes('different strategies')

  if (hasNumberedRequests && numberedItems.length > 0) {
    // USER PROVIDED SPECIFIC NUMBERED REQUESTS - FULFILL THEM EXACTLY
    message += `**🚨 CRITICAL: The user provided ${numberedItems.length} SPECIFIC NUMBERED REQUESTS. You MUST fulfill EACH one COMPLETELY:**\n\n`
    numberedItems.forEach((item, index) => {
      message += `**REQUEST ${index + 1}:** ${item}\n`
    })
    message += `\n**MANDATORY INSTRUCTIONS:**\n`
    message += `1. **ADDRESS EVERY SINGLE REQUEST** - Do not skip or summarize any\n`
    message += `2. **PROVIDE COMPLETE DELIVERABLES** - Not descriptions of what you would do\n`
    message += `3. **BE SPECIFIC AND SUBSTANTIVE** for each point:\n`
    message += `   - "Find 20 journalists" = List 20 REAL journalists with names, outlets, and beats\n`
    message += `   - "Identify 3 positions" = Present 3 ACTUAL contrarian positions with rationale\n`
    message += `   - "Create talking points" = Write the ACTUAL talking points, not describe them\n`
    message += `   - "Analyze landscape" = Provide REAL analysis with specific findings\n`
    message += `   - "Generate calendar" = Create an ACTUAL 30-day calendar with specific dates\n`
    message += `4. **USE YOUR RESEARCH** - Base everything on the intelligence gathered\n`
    message += `5. **FORMAT CLEARLY** - Number your response sections to match their requests\n`
    message += `6. **NO REINTERPRETATION** - Give them what they asked for, not what you think they need\n\n`
    message += `Remember: They gave you a numbered list because they want THOSE SPECIFIC THINGS. Deliver them all.\n\n`
  } else if (wantsBrainstorming) {
    // BRAINSTORMING MODE - Be creative and exploratory
    message += `**The user wants to brainstorm and explore ideas.**\n\n`
    message += `Instructions:\n`
    message += `1. Be creative and think out loud\n`
    message += `2. Offer multiple angles and perspectives\n`
    message += `3. Ask "what if" questions\n`
    message += `4. Build on ideas conversationally\n`
    message += `5. Don't force structure - let ideas flow\n`
    message += `6. Suggest directions they might not have considered\n`
    message += `7. Be a thought partner, not a proposal machine\n\n`
  } else if (wantsFramework && shouldGenerateFramework) {
    // FRAMEWORK MODE - Only when explicitly requested
    message += `**The user explicitly wants a strategic framework. Generate a complete one.**\n`
    message += `[Use the framework generation instructions already in place]\n\n`
  } else if (wantsProposals || toolResults?.generateProposals) {
    // PROPOSAL MODE - Only when they ask for options
    message += `**Present 3 distinct high-level campaign options:**\n\n`
    message += `Structure:\n`
    message += `First, brief intelligence summary (1-2 paragraphs)\n`
    message += `Then present 3 DIFFERENT strategic approaches (high-level, 4-5 points each)\n`
    message += `End with: "Which direction interests you most?"\n\n`
  } else {
    // ADAPTIVE MODE - Be intelligent about the response
    message += `**Respond intelligently based on what the user is asking for:**\n\n`
    message += `Context from their message:\n`
    message += `- Query: "${userMessage.substring(0, 200)}..."\n\n`
    message += `Instructions:\n`
    message += `1. If they want information, provide intelligence and insights\n`
    message += `2. If they want strategy, offer strategic thinking\n`
    message += `3. If they want specific deliverables, create them\n`
    message += `4. If they're exploring, explore with them\n`
    message += `5. Be a strategic consultant, not a rigid system\n`
    message += `6. Match their energy and intent\n`
    message += `7. Ask clarifying questions if genuinely unclear\n`
    message += `8. Never force patterns that don't fit their request\n\n`
  }

  message += `Remember: You're NIV, an experienced strategic consultant. Act like one - be adaptive, intelligent, and genuinely helpful.\n`

  return message
}

// Search for relevant intelligence (fallback for existing saved data)
async function searchForIntelligence(query: string, context: any) {
  console.log('📚 Checking for saved intelligence...')

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  // Check for recent saved searches
  const { data: savedSearches } = await supabase
    .from('fireplexity_searches')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)

  if (savedSearches && savedSearches.length > 0) {
    const latestSearch = savedSearches[0]
    if (latestSearch.results?.articles) {
      console.log(`📚 Using saved data: ${latestSearch.results.articles.length} articles`)
      return latestSearch.results.articles.slice(0, 10)
    }
  }

  return []
}

// Parse query for semantic understanding
interface QueryUnderstanding {
  entities: string[]        // Companies, people, products mentioned
  timeframe: string        // "lately", "recent", "today", "this week"
  sentiment: string        // "positive", "negative", "neutral"
  topics: string[]         // "AI", "earnings", "leadership"
  intent: string           // "get details", "summarize", "analyze"
  volume: string          // "a lot", "some", "few"
}

function understandQuery(message: string): QueryUnderstanding {
  const lower = message.toLowerCase()

  // Extract entities (companies, products, people)
  const entities = message.match(/\b[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*\b/g) || []

  // Detect timeframe
  let timeframe = "general"
  if (lower.includes('lately') || lower.includes('recently')) timeframe = "recent"
  else if (lower.includes('today')) timeframe = "today"
  else if (lower.includes('this week')) timeframe = "this week"
  else if (lower.includes('latest')) timeframe = "latest"

  // Detect sentiment
  let sentiment = "neutral"
  if (lower.includes('positive') || lower.includes('good') || lower.includes('success')) sentiment = "positive"
  else if (lower.includes('negative') || lower.includes('bad') || lower.includes('problem')) sentiment = "negative"
  else if (lower.includes('controversial') || lower.includes('mixed')) sentiment = "mixed"

  // Extract topics
  const topics = []
  if (lower.includes('ai') || lower.includes('artificial intelligence')) topics.push('AI')
  if (lower.includes('earning') || lower.includes('financial')) topics.push('earnings')
  if (lower.includes('product') || lower.includes('launch')) topics.push('product')
  if (lower.includes('leadership') || lower.includes('ceo')) topics.push('leadership')
  if (lower.includes('work') || lower.includes('progress')) topics.push('progress')

  // Detect intent
  let intent = "inform"
  if (lower.includes('can you') || lower.includes('give me') || lower.includes('tell me')) intent = "get details"
  else if (lower.includes('analyze') || lower.includes('assessment')) intent = "analyze"
  else if (lower.includes('summary') || lower.includes('summarize')) intent = "summarize"

  // Detect volume
  let volume = "some"
  if (lower.includes('a lot') || lower.includes('many') || lower.includes('numerous')) volume = "many"
  else if (lower.includes('few') || lower.includes('some')) volume = "few"

  return { entities, timeframe, sentiment, topics, intent, volume }
}

// Generate immediate acknowledgment response
function generateAcknowledgment(message: string, strategy: any, persona: any): string {
  const { pattern } = detectQueryPattern(message)
  const understanding = understandQuery(message)

  let acknowledgment = ""

  // Build acknowledgment based on semantic understanding
  if (understanding.sentiment === "positive" && understanding.entities.length > 0) {
    acknowledgment = `I'll look for ${understanding.sentiment} developments about ${understanding.entities[0]}`
    if (understanding.topics.length > 0) {
      acknowledgment += ` focusing on ${understanding.topics.join(' and ')}`
    }
    if (understanding.timeframe !== "general") {
      acknowledgment += ` from ${understanding.timeframe}`
    }
  } else if (pattern === 'crisis' || message.toLowerCase().includes('urgent')) {
    acknowledgment = `I see this is urgent. Let me immediately check what's being said and assess the situation.`
  } else if (understanding.entities.length > 0) {
    acknowledgment = `I'll look into ${understanding.entities[0]}`
    if (understanding.topics.length > 0) {
      acknowledgment += ` specifically around ${understanding.topics.join(' and ')}`
    }
  } else {
    acknowledgment = `I understand your query. Let me gather the relevant intelligence.`
  }


  // Add method based on approach (more natural) - handle null strategy
  if (strategy?.approach === 'intelligence_pipeline') {
    acknowledgment += ` I'll run a comprehensive analysis to get the full picture.`
  } else if (strategy?.approach === 'fireplexity_targeted') {
    acknowledgment += ` I'll check real-time sources for the most current information.`
  } else if (strategy?.approach === 'contextual_response') {
    acknowledgment += ` I'll apply relevant strategic frameworks to this situation.`
  } else if (!strategy) {
    // Default fallback when strategy is null
    acknowledgment += ` I'll search for the most relevant information.`
  }

  // Add timing expectation
  if (pattern === 'crisis') {
    acknowledgment += ` This will take just a moment.`
  } else {
    acknowledgment += ` Give me a few seconds to analyze this properly.`
  }

  return acknowledgment
}

// Clean up Claude's response to remove any tool use tags or artifacts
function cleanClaudeResponse(text: string): string {
  // Remove tool use blocks
  let cleaned = text.replace(/<tool_use>[\s\S]*?<\/tool_use>/g, '')

  // Remove any XML-like tags that might appear
  cleaned = cleaned.replace(/<\/?[^>]+(>|$)/g, '')

  // Remove any isolated parameter blocks
  cleaned = cleaned.replace(/\{[^{}]*"tool_name"[^{}]*\}/g, '')

  // Clean up any double spaces or extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim()

  // If the response starts with specific patterns, extract the actual message
  const patterns = [
    /^I'll\s+(?:help|assist|analyze|search|look)/i,
    /^Let\s+me\s+(?:help|search|look|check)/i,
    /^I\s+(?:can|will|am|understand)/i
  ]

  for (const pattern of patterns) {
    if (pattern.test(cleaned)) {
      // This looks like the start of actual content, keep it
      break
    }
  }

  return cleaned
}

// Check if query requires multi-step orchestration
function checkQueryComplexity(message: string, understanding: any, conceptState?: ConceptState): boolean {
  const lower = message.toLowerCase()

  // Check if we should generate proposals based on minimum information
  if (conceptState && shouldGenerateProposals(conceptState, message)) {
    console.log('🎯 Minimum information threshold met - triggering comprehensive research for proposals')
    return true
  }

  // Complex query indicators
  const complexIndicators = [
    'comprehensive analysis',
    'full research',
    'deep dive',
    'everything about',
    'complete overview',
    'detailed investigation',
    'thorough research',
    'all aspects of',
    'multiple angles',
    'various perspectives',
    'strategic framework',
    'create a framework',
    'develop a framework',
    'build a framework'
  ]

  // Check for complexity indicators
  const hasComplexIndicator = complexIndicators.some(indicator => lower.includes(indicator))

  // Check if multiple entities or topics are mentioned
  const hasMultipleTopics = understanding?.understanding?.topics?.length > 2
  const hasMultipleEntities = understanding?.understanding?.entities?.length > 2

  // Check for comparative or competitive analysis
  const isComparative = lower.includes('compare') || lower.includes('versus') ||
                        lower.includes('vs') || lower.includes('competitive')

  // Check for temporal complexity (multiple time periods)
  const hasTemporalComplexity = lower.includes('evolution') || lower.includes('history') ||
                                 lower.includes('timeline') || lower.includes('progression')

  return hasComplexIndicator || hasMultipleTopics || hasMultipleEntities ||
         isComparative || hasTemporalComplexity
}

// Format NIV responses to be clean and professional
function formatNivResponse(rawResponse: string, organizationName: string = 'your organization'): string {
  let formatted = rawResponse

  // Remove any process narration
  const processPatterns = [
    /I'm\s+(?:now\s+)?(?:going\s+to\s+)?(?:search|look|check|analyze|query)[^.]*\./gi,
    /Let\s+me\s+(?:first\s+)?(?:search|look|check|analyze|query)[^.]*\./gi,
    /Searching\s+(?:for|through|in)[^.]*\./gi,
    /Looking\s+(?:for|at|through)[^.]*\./gi,
  ]

  processPatterns.forEach(pattern => {
    formatted = formatted.replace(pattern, '')
  })

  // Replace generic references with organization-specific ones
  formatted = formatted.replace(/\byour organization\b/gi, organizationName)
  formatted = formatted.replace(/\bthe organization\b/gi, organizationName)

  // Minimal formatting - trust Claude's output and just clean up edge cases
  // Normalize line breaks to \n
  formatted = formatted.replace(/\r\n/g, '\n')

  // Collapse excessive newlines (4+) into double newlines
  formatted = formatted.replace(/\n{4,}/g, '\n\n')

  // Trim spaces from each line while preserving empty lines
  formatted = formatted.split('\n').map(line => line.trim()).join('\n')

  // Final trim
  formatted = formatted.trim()

  return formatted
}

// Framework generation is now handled exclusively by the niv-strategic-framework edge function
// DO NOT generate frameworks locally

// Better extraction and packaging of research for framework generation
// Helper: Clean and format article for display
function formatArticleForDisplay(article: any): string | null {
  const rawTitle = article.title || article.headline
  if (!rawTitle) return null

  // Clean title - remove extra whitespace, special chars
  const title = rawTitle
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s\-\.,&]/g, '')
    .trim()

  // Clean and truncate description if available
  const description = (article.description || '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 200)

  // Format: **Title** - Description
  return description
    ? `**${title}** - ${description}${description.length >= 200 ? '...' : ''}`
    : `**${title}**`
}

function extractAndPackageResearch(conceptState: any, toolResults: any): any {
  const research = {
    articles: [] as any[],
    keyFindings: [] as string[],
    synthesis: [] as string[],
    themes: [] as string[],
    insights: {
      opportunities: [] as string[],
      risks: [] as string[],
      competitorMoves: [] as string[]
    }
  }

  // Process research history
  conceptState.researchHistory?.forEach((r: any) => {
    // Extract articles with clean structure
    if (r.results?.intelligencePipeline?.articles) {
      r.results.intelligencePipeline.articles.forEach((article: any) => {
        research.articles.push({
          title: article.title || article.headline || '',
          summary: article.summary || article.description || '',
          source: article.source || article.publication || '',
          url: article.url || '',
          relevance: article.relevance || article.score || 0
        })
      })
    }

    // Get fireplexity articles
    if (r.results?.fireplexityData) {
      r.results.fireplexityData.forEach((article: any) => {
        research.articles.push({
          title: article.title || article.headline || '',
          summary: article.summary || article.description || '',
          source: article.source || '',
          url: article.url || '',
          relevance: article.relevance || 0
        })
      })
    }

    // Extract synthesis
    if (r.results?.intelligencePipeline?.synthesis) {
      research.synthesis.push(r.results.intelligencePipeline.synthesis)
    }

    // Extract key findings
    if (r.results?.keyFindings && Array.isArray(r.results.keyFindings)) {
      research.keyFindings.push(...r.results.keyFindings)
    }
  })

  // Process current tool results
  if (toolResults.intelligencePipeline?.articles) {
    toolResults.intelligencePipeline.articles.forEach((article: any) => {
      research.articles.push({
        title: article.title || article.headline || '',
        summary: article.summary || article.description || '',
        source: article.source || article.publication || '',
        url: article.url || '',
        relevance: article.relevance || article.score || 0
      })
    })
  }

  if (toolResults.fireplexityData) {
    toolResults.fireplexityData.forEach((article: any) => {
      research.articles.push({
        title: article.title || article.headline || '',
        summary: article.summary || article.description || '',
        source: article.source || '',
        url: article.url || '',
        relevance: article.relevance || 0
      })
    })
  }

  if (toolResults.intelligencePipeline?.synthesis) {
    research.synthesis.push(toolResults.intelligencePipeline.synthesis)
  }

  if (toolResults.keyFindings && Array.isArray(toolResults.keyFindings)) {
    research.keyFindings.push(...toolResults.keyFindings)
  }

  // Extract themes from synthesis
  research.synthesis.forEach((synthesis: string) => {
    // Extract themes or topics mentioned in synthesis
    const themeMatches = synthesis.match(/(?:theme|topic|trend|focus)[:]\s*([^.]+)/gi)
    if (themeMatches) {
      themeMatches.forEach(match => {
        const theme = match.replace(/(?:theme|topic|trend|focus)[:]\s*/i, '').trim()
        if (theme && !research.themes.includes(theme)) {
          research.themes.push(theme)
        }
      })
    }
  })

  // Extract insights from articles and synthesis
  research.articles.forEach((article: any) => {
    const content = `${article.title} ${article.summary}`.toLowerCase()

    // Opportunities
    if (content.includes('opportunity') || content.includes('potential') || content.includes('growth')) {
      research.insights.opportunities.push(article.title)
    }

    // Risks
    if (content.includes('risk') || content.includes('threat') || content.includes('challenge')) {
      research.insights.risks.push(article.title)
    }

    // Competitor moves
    if (content.includes('competitor') || content.includes('rival') || content.includes('competing')) {
      research.insights.competitorMoves.push(article.title)
    }
  })

  // If no key findings but we have articles, generate clean findings from articles
  if (research.keyFindings.length === 0 && research.articles.length > 0) {
    research.articles.slice(0, 10).forEach((article: any) => {
      const formatted = formatArticleForDisplay(article)
      if (formatted) research.keyFindings.push(formatted)
    })
  }

  // Deduplicate arrays
  research.keyFindings = [...new Set(research.keyFindings)]
  research.themes = [...new Set(research.themes)]
  research.insights.opportunities = [...new Set(research.insights.opportunities)].slice(0, 10)
  research.insights.risks = [...new Set(research.insights.risks)].slice(0, 10)
  research.insights.competitorMoves = [...new Set(research.insights.competitorMoves)].slice(0, 10)

  return research
}

// Format strategic framework responses
function formatStrategicResponse(objective: string, plan: any, organizationName: string): string {
  let response = `**Strategic Framework for ${organizationName}**\n\n`
  response += `**Objective:** ${objective}\n\n`

  // Add narrative (core story)
  if (plan.strategy?.narrative) {
    response += '**Core Narrative:**\n'
    response += `${plan.strategy.narrative}\n\n`
  }

  // Add proof points
  if (plan.strategy?.proof_points?.length > 0) {
    response += '**Proof Points:**\n'
    plan.strategy.proof_points.forEach((point: string) => {
      response += `• ${point}\n`
    })
    response += '\n'
  }

  // Add key messages
  if (plan.strategy?.keyMessages?.length > 0) {
    response += '**Key Messages:**\n'
    plan.strategy.keyMessages.forEach((msg: string, i: number) => {
      response += `${i + 1}. ${msg}\n`
    })
    response += '\n'
  }

  // Add target audiences
  if (plan.strategy?.target_audiences?.length > 0) {
    response += '**Target Audiences:**\n'
    plan.strategy.target_audiences.forEach((audience: string) => {
      response += `• ${audience}\n`
    })
    response += '\n'
  }

  // Add media targets
  if (plan.media_targets) {
    response += '**Media Targets:**\n'
    if (plan.media_targets.tier_1_targets?.length > 0) {
      response += `*Tier 1:* ${plan.media_targets.tier_1_targets.slice(0, 3).join(', ')}\n`
    }
    if (plan.media_targets.tier_2_targets?.length > 0) {
      response += `*Tier 2:* ${plan.media_targets.tier_2_targets.slice(0, 3).join(', ')}\n`
    }
    response += '\n'
  }

  // Add execution timeline
  if (plan.executionPlan?.timeline?.phases) {
    response += '**Execution Timeline:**\n'
    plan.executionPlan.timeline.phases.forEach((phase: any, i: number) => {
      response += `${i + 1}. **${phase.name}** (${phase.duration})\n`
      if (phase.objectives?.length > 0) {
        phase.objectives.forEach((obj: string) => {
          response += `   • ${obj}\n`
        })
      }
    })
    response += '\n'
  }

  // Add KPIs
  if (plan.contentStrategy?.kpis?.length > 0) {
    response += '**Success Metrics (KPIs):**\n'
    plan.contentStrategy.kpis.forEach((kpi: any) => {
      response += `• ${kpi.metric}: ${kpi.target} (${kpi.timeframe})\n`
    })
    response += '\n'
  }

  // Add auto-executable content types
  if (plan.executionPlan?.autoExecutableContent?.contentTypes?.length > 0) {
    response += '**Auto-Executable Content:**\n'
    response += `${plan.executionPlan.autoExecutableContent.contentTypes.join(', ')}\n\n`
  }

  response += '---\n*This strategic framework has been saved to Memory Vault and is ready for execution.*'

  return response
}

// Format structured multi-section responses
function formatStructuredSectionsResponse(sections: any, organizationName: string): string {
  let response = `**Strategic Framework for ${organizationName}**\n\n`

  // Format objective
  if (sections.objective) {
    if (typeof sections.objective === 'object') {
      response += `**Objective:**\n${sections.objective.statement || JSON.stringify(sections.objective)}\n\n`
    } else {
      response += `**Objective:**\n${sections.objective}\n\n`
    }
  }

  // Format narrative
  if (sections.narrative) {
    response += `**Core Narrative & Proof Points:**\n`
    if (typeof sections.narrative === 'object') {
      if (sections.narrative.core_story) {
        response += `${sections.narrative.core_story}\n\n`
      }
      if (sections.narrative.proof_points && Array.isArray(sections.narrative.proof_points) && sections.narrative.proof_points.length > 0) {
        response += `**Proof Points:**\n`
        sections.narrative.proof_points.forEach((point: string) => {
          response += `• ${point}\n`
        })
      }
    } else {
      response += `${sections.narrative}\n`
    }
    response += '\n'
  }

  // Format audiences
  if (sections.audiences) {
    response += `**Target Audience Segments:**\n`
    if (typeof sections.audiences === 'object' && sections.audiences.segments && Array.isArray(sections.audiences.segments)) {
      sections.audiences.segments.forEach((seg: any) => {
        const priority = seg.priority ? ` (${seg.priority})` : ''
        response += `• ${seg.segment || seg}${priority}\n`
      })
    } else if (Array.isArray(sections.audiences)) {
      sections.audiences.forEach((audience: string) => {
        response += `• ${audience}\n`
      })
    } else if (typeof sections.audiences === 'object') {
      Object.entries(sections.audiences).forEach(([segment, message]) => {
        response += `• **${segment}:** ${message}\n`
      })
    } else {
      response += `${sections.audiences}\n`
    }
    response += '\n'
  }

  // Format content strategy
  if (sections.contentStrategy) {
    response += `**Content Needs & Distribution:**\n`
    if (sections.contentStrategy.content_types && Array.isArray(sections.contentStrategy.content_types)) {
      response += `**Content Types:** ${sections.contentStrategy.content_types.join(', ')}\n`
    }
    if (sections.contentStrategy.distribution_channels && Array.isArray(sections.contentStrategy.distribution_channels)) {
      response += `**Channels:** ${sections.contentStrategy.distribution_channels.join(', ')}\n`
    }
    response += '\n'
  }

  // Format media targets
  if (sections.mediaTargets) {
    response += `**Media Targets:**\n`
    if (sections.mediaTargets.tier1 && Array.isArray(sections.mediaTargets.tier1)) {
      response += `**Tier 1:** ${sections.mediaTargets.tier1.join(', ')}\n`
    }
    if (sections.mediaTargets.tier2 && Array.isArray(sections.mediaTargets.tier2)) {
      response += `**Tier 2:** ${sections.mediaTargets.tier2.join(', ')}\n`
    }
    if (sections.mediaTargets.tier3 && Array.isArray(sections.mediaTargets.tier3)) {
      response += `**Tier 3:** ${sections.mediaTargets.tier3.join(', ')}\n`
    }
    response += '\n'
  }

  // Format timeline
  if (sections.timeline) {
    response += `**Timeline:**\n`
    if (typeof sections.timeline === 'object') {
      if (sections.timeline.immediate && Array.isArray(sections.timeline.immediate)) {
        response += `**Immediate Actions:**\n${sections.timeline.immediate.map((a: string) => `• ${a}`).join('\n')}\n`
      }
      if (sections.timeline.week_1 && Array.isArray(sections.timeline.week_1)) {
        response += `**Week 1:**\n${sections.timeline.week_1.map((a: string) => `• ${a}`).join('\n')}\n`
      }
      if (sections.timeline.week_2_4 && Array.isArray(sections.timeline.week_2_4)) {
        response += `**Weeks 2-4:**\n${sections.timeline.week_2_4.map((a: string) => `• ${a}`).join('\n')}\n`
      }
      if (sections.timeline.month_2_3 && Array.isArray(sections.timeline.month_2_3)) {
        response += `**Months 2-3:**\n${sections.timeline.month_2_3.map((a: string) => `• ${a}`).join('\n')}\n`
      }
      if (sections.timeline.milestones && Array.isArray(sections.timeline.milestones)) {
        response += `**Key Milestones:**\n`
        sections.timeline.milestones.forEach((m: any) => {
          response += `• ${m.date}: ${m.event} (${m.metric})\n`
        })
      }
    } else {
      response += `${sections.timeline}\n`
    }
    response += '\n'
  }

  // Format metrics
  if (sections.metrics) {
    response += `**Success Metrics & KPIs:**\n`
    if (typeof sections.metrics === 'object' && sections.metrics.kpis && Array.isArray(sections.metrics.kpis)) {
      sections.metrics.kpis.forEach((kpi: any) => {
        response += `• **${kpi.metric}:** ${kpi.target} (tracked via ${kpi.tracking})\n`
      })
    } else if (Array.isArray(sections.metrics)) {
      sections.metrics.forEach((metric: string) => {
        response += `• ${metric}\n`
      })
    } else if (typeof sections.metrics === 'object') {
      Object.entries(sections.metrics).forEach(([category, value]) => {
        response += `• **${category}:** ${value}\n`
      })
    } else {
      response += `${sections.metrics}\n`
    }
    response += '\n'
  }

  response += '---\n*This strategic framework has been saved to Memory Vault and is ready for execution.*'

  return response
}

// Helper function to detect if query should generate strategic framework
// Based on orchestrator-robust's research/strategy separation
function detectStrategicIntent(message: string, conversationHistory?: any[]): boolean {
  const queryLower = message.toLowerCase()

  // Only trigger framework for EXPLICIT strategic requests
  const explicitStrategicPhrases = [
    'develop a strategy',
    'create a strategic framework',
    'build a campaign',
    'generate a plan',
    'design a response strategy',
    'what\'s our strategy',
    'propose a strategy',
    'what should we do',
    'how should we respond',
    'create a pr strategy',
    'build our approach',
    'strategic recommendations'
  ]

  // Check if user explicitly asks for strategy
  const hasExplicitRequest = explicitStrategicPhrases.some(phrase => queryLower.includes(phrase))

  // Information queries should NOT trigger framework
  const isInformationQuery =
    queryLower.includes('what is happening') ||
    queryLower.includes('what\'s happening') ||
    queryLower.includes('tell me about') ||
    queryLower.includes('show me') ||
    queryLower.includes('latest') ||
    queryLower.includes('news') ||
    queryLower.includes('update')

  // CRITICAL: Check if this is a follow-up to research
  let hasResearchContext = false
  if (conversationHistory && conversationHistory.length > 0) {
    // Check if we've already provided research in this conversation
    hasResearchContext = conversationHistory.some(msg =>
      msg.role === 'assistant' &&
      (msg.content.includes('Research Findings') ||
       msg.content.includes('Key findings') ||
       msg.content.includes('analysis shows') ||
       msg.content.includes('recent developments') ||
       msg.content.includes('competitor') ||
       msg.content.includes('market'))
    )
  }

  // Only generate framework if:
  // 1. User explicitly asks for strategy AND
  // 2. We have research context OR it's a "based on" request AND
  // 3. NOT just asking for information
  return hasExplicitRequest && (hasResearchContext || queryLower.includes('based on')) && !isInformationQuery
}

// Helper function to detect if message is a command (not a research query)
function detectCommandIntent(message: string): { isCommand: boolean; commandType?: string } {
  const queryLower = message.toLowerCase()

  // Detect simple informational/meta questions about capabilities
  // These should be answered directly without research
  const metaQuestions = [
    /are you aware of|do you have access to|can you (access|use|see)/i,
    /what (is|are) (your|the) (capabilities|tools|sources)/i,
    /tell me about (your|the) (memory vault|knowledge|capabilities)/i,
    /how (do|does) (your|the) (memory vault|system) work/i,
    /what can you (do|access|retrieve)/i
  ]

  for (const regex of metaQuestions) {
    if (regex.test(message)) {
      return { isCommand: true, commandType: 'meta' }
    }
  }

  // Detect routing/execution commands - SIMPLIFIED and more flexible
  const routingCommands = [
    /(create|make|generate|build).*(presentation|deck|slides?)/i,  // "create a presentation", "make deck", "generate slides"
    /(create|make|generate|build).*(press release|blog|article|post|email)/i,  // Content creation
    /send.*(to|in) (gamma|campaign builder)/i,  // "send to gamma"
    /open.*(in|with) (gamma|campaign builder)/i,  // "open in gamma"
    /use (gamma|campaign builder)/i,  // "use gamma"
    /execute (this|it|the strategy)/i,  // "execute this", "execute the strategy"
    /take.*(to|into) (gamma|campaign)/i  // "take to gamma"
  ]

  for (const regex of routingCommands) {
    if (regex.test(message)) {
      return { isCommand: true, commandType: 'routing' }
    }
  }

  // Detect system/UI commands
  const systemCommands = [
    /show me (the|my)/i,
    /navigate to/i,
    /go to/i,
    /switch to/i,
    /refresh/i,
    /reload/i
  ]

  for (const regex of systemCommands) {
    if (regex.test(message)) {
      return { isCommand: true, commandType: 'system' }
    }
  }

  return { isCommand: false }
}

// Helper function to detect target component for handoff
function detectTargetComponent(message: string): 'campaign' | 'plan' | 'execute' | 'opportunity' {
  const queryLower = message.toLowerCase()

  if (queryLower.includes('campaign') || queryLower.includes('launch') || queryLower.includes('announce')) {
    return 'campaign'
  }

  if (queryLower.includes('plan') || queryLower.includes('timeline') || queryLower.includes('project')) {
    return 'plan'
  }

  if (queryLower.includes('content') || queryLower.includes('write') || queryLower.includes('create')) {
    return 'execute'
  }

  if (queryLower.includes('opportunity') || queryLower.includes('respond') || queryLower.includes('crisis')) {
    return 'opportunity'
  }

  // Default to campaign for most strategic queries
  return 'campaign'
}

// ============================================================================
// CONTENT GENERATION ROUTING (Phase 4: Campaign Generation Mode)
// ============================================================================

/**
 * Detect if user wants to generate content based on their message
 */
function detectContentGenerationIntent(message: string, conceptState: ConceptState): {
  wantsContent: boolean
  contentType?: string
  confidence: number
} {
  const lower = message.toLowerCase()

  // SPECIAL CASE: Media plan requests can be generated without framework
  if (lower.includes('media plan')) {
    console.log('📋 Media plan request detected - can generate without framework')
    return {
      wantsContent: true,
      contentType: 'media-plan',
      confidence: 0.95
    }
  }

  // Strong signals for content generation
  const strongSignals = [
    /generate|create|write|draft|build/i,
    /press release|blog post|social post|email|newsletter|media plan/i,
    /let'?s create|let'?s generate|let'?s write/i,
    /need (a|the)|want (a|the)/i,
    /can you (create|generate|write|build)/i,
    /turn.*into.*plan|convert.*to.*plan/i
  ]

  // Check if concept is ready (framework exists)
  const hasFramework = conceptState.stage === 'ready' || conceptState.stage === 'finalizing'

  // Count strong signals
  const signalCount = strongSignals.filter(regex => regex.test(lower)).length

  if (signalCount >= 2 && hasFramework) {
    return {
      wantsContent: true,
      contentType: extractContentType(message),
      confidence: 0.9
    }
  }

  if (signalCount >= 1 && hasFramework) {
    return {
      wantsContent: true,
      contentType: extractContentType(message),
      confidence: 0.7
    }
  }

  // Even without framework, if they're explicitly asking to create specific content
  if (signalCount >= 2) {
    const contentType = extractContentType(message)
    if (contentType && contentType !== 'press-release') { // Don't auto-generate press releases without framework
      console.log(`📝 Direct content request detected (no framework): ${contentType}`)
      return {
        wantsContent: true,
        contentType,
        confidence: 0.6
      }
    }
  }

  return { wantsContent: false, confidence: 0 }
}

/**
 * Extract content type from user message
 */
function extractContentType(message: string): string | undefined {
  const lower = message.toLowerCase()

  const typeMap: Record<string, string> = {
    'media plan': 'media-plan',
    'press release': 'press-release',
    'blog post': 'blog-post',
    'blog': 'blog-post',
    'social post': 'social-post',
    'social': 'social-post',
    'tweet': 'twitter-thread',
    'twitter': 'twitter-thread',
    'linkedin': 'linkedin-article',
    'email': 'email',
    'newsletter': 'newsletter',
    'white paper': 'white-paper',
    'case study': 'case-study',
    'thought leadership': 'thought-leadership',
    'media pitch': 'media-pitch',
    'media list': 'media-list',
    'talking points': 'talking-points',
    'q&a': 'qa-document',
    'executive statement': 'executive-statement'
  }

  for (const [keyword, type] of Object.entries(typeMap)) {
    if (lower.includes(keyword)) {
      return type
    }
  }

  return 'press-release' // Default
}

/**
 * Package campaign context from framework and conversation
 */
function packageCampaignContext(
  framework: any,
  conceptState: ConceptState,
  organizationContext: any,
  contentType: string
): any {
  // Extract key information from framework
  const strategy = framework?.strategy || {}
  const narrative = framework?.narrative || {}
  const execution = framework?.execution || framework?.executionPlan || {}

  // Build campaign summary
  const campaignSummary = {
    organizationName: organizationContext.organizationName || 'Unknown',
    industry: organizationContext.industry || 'Technology',
    campaignGoal: strategy.objective || conceptState.concept.goal || 'Strategic Campaign',
    positioning: narrative.positioning_statement || conceptState.concept.narrative || '',
    coreNarrative: narrative.positioning_statement || strategy.narrative || conceptState.concept.narrative || '',
    keyMessages: narrative.key_messages || strategy.keyMessages || []
  }

  // Extract research insights
  const researchInsights = framework?.intelligence?.key_findings ||
                          conceptState.researchHistory.flatMap((r: any) => r.keyFindings || []) ||
                          []

  // Build content requirements
  const contentRequirements = {
    owned: [{
      type: contentType,
      stakeholder: strategy.target_audiences?.[0] || 'General Audience',
      purpose: strategy.objective || 'Campaign Communication',
      keyPoints: narrative.key_messages || strategy.keyMessages || []
    }],
    media: []
  }

  return {
    campaignSummary,
    phase: 'Content Generation',
    phaseNumber: 1,
    objective: strategy.objective || 'Generate campaign content',
    narrative: campaignSummary.coreNarrative,
    keyMessages: campaignSummary.keyMessages,
    positioning: campaignSummary.positioning,
    targetStakeholders: strategy.target_audiences || ['General Audience'],
    contentRequirements,
    researchInsights,
    currentDate: new Date().toISOString().split('T')[0],
    campaignFolder: `campaign-${Date.now()}`,
    blueprintId: `blueprint-${Date.now()}`
  }
}

/**
 * Route content generation request to niv-content-intelligent-v2
 */
async function routeToContentGeneration(
  message: string,
  campaignContext: any,
  organizationContext: any,
  conversationId: string
): Promise<any> {
  console.log('📤 Routing to niv-content-intelligent-v2 with campaign_generation mode')

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/niv-content-intelligent-v2`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        message,
        conversationHistory: [],
        organizationContext: {
          conversationId,
          organizationId: organizationContext.organizationId || '1',
          organizationName: organizationContext.organizationName || 'Unknown'
        },
        stage: 'campaign_generation',
        campaignContext
      })
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Content generation failed: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  console.log('✅ Content generated successfully')

  return data
}

// Main handler
// Transform strategic framework to Gamma presentation format
function formatFrameworkForGamma(framework: any): string {
  let content = `# ${framework.strategy?.objective || 'Strategic Framework'}\n\n`

  // Slide 1: Executive Summary
  content += `## Executive Summary\n\n`
  content += `${framework.strategy?.rationale || framework.strategy?.narrative || ''}\n\n`

  if (framework.strategy?.proof_points?.length > 0) {
    content += `### Key Evidence\n`
    framework.strategy.proof_points.forEach((point: string) => {
      content += `- ${point}\n`
    })
    content += `\n`
  }

  // Slide 2: Strategic Objectives
  content += `## Strategic Objectives\n\n`
  content += `### Primary Goal\n`
  content += `${framework.strategy?.objective || ''}\n\n`

  if (framework.strategy?.keyMessages?.length > 0) {
    content += `### Key Messages\n`
    framework.strategy.keyMessages.forEach((msg: string, i: number) => {
      content += `${i + 1}. ${msg}\n`
    })
    content += `\n`
  }

  // Slide 3: Target Audiences
  content += `## Target Audiences\n\n`
  if (framework.strategy?.target_audiences?.length > 0) {
    framework.strategy.target_audiences.forEach((audience: string) => {
      content += `### ${audience}\n`
      content += `Target stakeholder group for messaging and engagement.\n\n`
    })
  }

  // Slide 4: Media Strategy
  content += `## Media Strategy\n\n`
  if (framework.media_targets) {
    if (framework.media_targets.tier_1_targets?.length > 0) {
      content += `### Tier 1 Targets\n`
      framework.media_targets.tier_1_targets.forEach((outlet: string) => {
        content += `- ${outlet}\n`
      })
      content += `\n`
    }
    if (framework.media_targets.tier_2_targets?.length > 0) {
      content += `### Tier 2 Targets\n`
      framework.media_targets.tier_2_targets.forEach((outlet: string) => {
        content += `- ${outlet}\n`
      })
      content += `\n`
    }
  }

  // Slide 5: Content Plan
  content += `## Content Plan\n\n`
  if (framework.executionPlan?.autoExecutableContent?.contentTypes?.length > 0) {
    content += `### Auto-Executable Content\n`
    framework.executionPlan.autoExecutableContent.contentTypes.forEach((type: string) => {
      content += `- ${type}\n`
    })
    content += `\n`
    content += `**Estimated Pieces:** ${framework.executionPlan.autoExecutableContent.estimatedPieces || framework.executionPlan.autoExecutableContent.contentTypes.length}\n\n`
  }

  // Slide 6: Timeline
  content += `## Execution Timeline\n\n`
  if (framework.executionPlan?.timeline?.phases?.length > 0) {
    framework.executionPlan.timeline.phases.forEach((phase: any) => {
      content += `### ${phase.name} (${phase.duration})\n`
      if (phase.objectives?.length > 0) {
        phase.objectives.forEach((obj: string) => {
          content += `- ${obj}\n`
        })
      }
      content += `\n`
    })
  }

  if (framework.executionPlan?.timeline?.milestones?.length > 0) {
    content += `### Key Milestones\n`
    framework.executionPlan.timeline.milestones.forEach((milestone: string) => {
      content += `- ${milestone}\n`
    })
    content += `\n`
  }

  // Slide 7: Success Metrics
  content += `## Success Metrics\n\n`
  if (framework.contentStrategy?.kpis?.length > 0) {
    framework.contentStrategy.kpis.forEach((kpi: any) => {
      content += `### ${kpi.metric}\n`
      content += `**Target:** ${kpi.target}\n`
      content += `**Timeframe:** ${kpi.timeframe}\n\n`
    })
  }

  return content
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    // Handle both 'query' and 'message' for backwards compatibility
    const {
      message = body.query,
      query = body.message,
      sessionId = 'default',
      conversationId = 'default-conversation',
      context = {},
      stage = 'full',
      conversationHistory = [],
      organizationContext = body.organizationContext
    } = body

    // Extract organizationId separately as let (needs to be reassigned later)
    let organizationId = body.organizationId

    // Use whichever is provided
    const userMessage = message || query

    // Use organization name from context if provided (avoids stale cache)
    const organizationName = organizationContext?.name || organizationId

    console.log('🤖 NIV Processing:', {
      message: userMessage ? userMessage.substring(0, 100) : 'No message',
      sessionId,
      stage
    })

    if (!userMessage) {
      throw new Error('Message or query is required')
    }

    // CRITICAL: Detect if this is a command (not a research query)
    const commandDetection = detectCommandIntent(userMessage)

    // Handle meta questions about capabilities (no research needed)
    if (commandDetection.isCommand && commandDetection.commandType === 'meta') {
      console.log(`ℹ️ Meta question detected: ${userMessage.substring(0, 100)}`)

      // Simple direct response without research
      const metaResponse = `Yes, I have access to your **Memory Vault** - your organization's institutional knowledge base that captures:

• **Past Successful Content** - What messaging and content has performed well
• **Proven Patterns** - Hooks, voice, structure, and approaches that work for your organization
• **Strategic Insights** - Lessons learned from previous campaigns and initiatives

When relevant to our conversation, I automatically check the Memory Vault and will reference what I find. For example, if you ask about energy policy messaging, I'll pull proven patterns from your past successful energy content.

The Memory Vault helps me provide more strategic, organization-specific advice rather than generic recommendations.

What would you like to explore or work on today?`

      return new Response(JSON.stringify({
        success: true,
        mode: 'simple',
        message: metaResponse,
        conversationId
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (commandDetection.isCommand && commandDetection.commandType === 'routing') {
      console.log(`🎯 Execution command detected: ${userMessage.substring(0, 100)}`)

      // Get the conceptState to check if we have a strategic framework
      const conceptState = getConceptState(conversationId)

      // Extract strategy from conversation text (since we no longer generate structured frameworks)
      let latestFramework = null

      // Look for the last assistant message with strategic advice
      for (let i = conversationHistory.length - 1; i >= 0; i--) {
        const msg = conversationHistory[i]
        if (msg.role === 'assistant' || msg.role === 'niv') {
          // Check if this message contains strategic content
          const content = msg.content || ''
          const hasStrategy = content.includes('STRATEGIC OBJECTIVES') ||
                             content.includes('Strategy:') ||
                             content.includes('Tactical Plan') ||
                             content.includes('Key Messages') ||
                             content.includes('Timeline')

          if (hasStrategy) {
            console.log('📦 Found strategic advice in conversation')
            // Create a simple framework structure from the conversational text
            latestFramework = {
              strategy: {
                objective: extractBetween(content, 'Primary Goal:', '\n') || 'Strategic Initiative',
                narrative: content,  // Full context
                keyMessages: extractListItems(content, 'Key Messages:'),
                target_audiences: extractListItems(content, 'Target Audience'),
                proof_points: extractListItems(content, 'Proof Points')
              },
              contentStrategy: {
                subject: extractBetween(content, 'Primary Goal:', '\n') || 'Strategic Framework',
                narrative: content,
                key_messages: extractListItems(content, 'Key Messages:'),
                target_audiences: extractListItems(content, 'Target Audience'),
                chosen_approach: 'conversational-framework'
              },
              media_targets: {
                tier_1_targets: extractListItems(content, 'Tier 1 Targets:'),
                tier_2_targets: extractListItems(content, 'Tier 2 Targets:')
              },
              executionPlan: {
                timeline: {
                  phases: [],
                  milestones: extractListItems(content, 'Milestones:')
                },
                autoExecutableContent: {
                  contentTypes: ['press-release', 'media-pitch', 'social-post', 'media-list'],
                  estimatedPieces: 6
                }
              }
            }
            break
          }
        }
      }

      // Helper functions to extract content from text
      function extractBetween(text: string, start: string, end: string): string {
        const startIdx = text.indexOf(start)
        if (startIdx === -1) return ''
        const textAfterStart = text.substring(startIdx + start.length)
        const endIdx = textAfterStart.indexOf(end)
        if (endIdx === -1) return textAfterStart.trim()
        return textAfterStart.substring(0, endIdx).trim()
      }

      function extractListItems(text: string, sectionTitle: string): string[] {
        const items: string[] = []
        const startIdx = text.indexOf(sectionTitle)
        if (startIdx === -1) return items

        const section = text.substring(startIdx + sectionTitle.length, startIdx + 500)
        const lines = section.split('\n')

        for (const line of lines) {
          const trimmed = line.trim()
          if (trimmed.startsWith('-') || trimmed.startsWith('•') || /^\d+\./.test(trimmed)) {
            const cleanedItem = trimmed.replace(/^[-•\d.]\s*/, '').trim()
            if (cleanedItem) items.push(cleanedItem)
          }
        }

        return items
      }

      // Detect what content type user wants
      const messageLower = userMessage.toLowerCase()
      let requestedContentType = 'presentation' // default
      let useGamma = false

      if (messageLower.includes('presentation') || messageLower.includes('deck') || messageLower.includes('slides') || messageLower.includes('gamma')) {
        requestedContentType = 'presentation'
        useGamma = true
      } else if (messageLower.includes('press release')) {
        requestedContentType = 'press-release'
      } else if (messageLower.includes('blog')) {
        requestedContentType = 'blog-post'
      } else if (messageLower.includes('social')) {
        requestedContentType = 'social-post'
      } else if (messageLower.includes('email')) {
        requestedContentType = 'email'
      }

      console.log(`📝 Detected content type: ${requestedContentType}, useGamma: ${useGamma}`)

      // If we have a framework, execute content generation
      if (latestFramework) {
        console.log('⚡ Executing content generation with strategic framework...')

        try {
          // Package framework for niv-content
          const preloadedStrategy = {
            subject: latestFramework.strategy?.objective || latestFramework.contentStrategy?.subject || 'Strategic Initiative',
            narrative: latestFramework.strategy?.narrative || latestFramework.contentStrategy?.narrative || '',
            key_messages: latestFramework.strategy?.keyMessages || latestFramework.contentStrategy?.key_messages || [],
            target_audiences: latestFramework.strategy?.target_audiences || latestFramework.contentStrategy?.target_audiences || [],
            media_targets: latestFramework.media_targets || latestFramework.contentStrategy?.media_targets || {},
            timeline: latestFramework.executionPlan?.timeline || latestFramework.contentStrategy?.timeline || {},
            proof_points: latestFramework.strategy?.proof_points || [],
            chosen_approach: latestFramework.contentStrategy?.chosen_approach || 'framework-based'
          }

          console.log('📦 Packaged strategy:', {
            subject: preloadedStrategy.subject,
            contentType: requestedContentType,
            hasNarrative: !!preloadedStrategy.narrative,
            messageCount: preloadedStrategy.key_messages?.length || 0
          })

          // For presentations, skip niv-content (it doesn't support 'presentation' type)
          // and go directly to gamma-presentation below
          let responseMessage = ''
          let contentData: any = null
          let gammaGenerationId: string | null = null

          if (requestedContentType !== 'presentation') {
            // Call niv-content in auto-execute mode for non-presentation content
            const contentResponse = await fetch(
              `${Deno.env.get('SUPABASE_URL')}/functions/v1/niv-content-intelligent-v2`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
              },
              body: JSON.stringify({
                autoExecute: true,
                preloadedStrategy: preloadedStrategy,
                requestedContentType: requestedContentType,
                organizationContext: {
                  organizationId: context.organizationId || organizationId,
                  organizationName: latestFramework.discoveryContext?.organization?.name || context.organizationName || 'Organization',
                  conversationId: conversationId
                },
                saveFolder: 'NIV Advisor Content',
                message: `Generate ${requestedContentType} from strategic framework`
              })
            }
          )

          if (!contentResponse.ok) {
            throw new Error(`Content generation failed: ${contentResponse.status}`)
          }

            contentData = await contentResponse.json()
            console.log('✅ Content generated successfully')

            responseMessage = `✅ **Content Generated**\n\n${contentData.content || contentData.message || 'Content created successfully'}`
          }

          // If presentation, generate Gamma presentation
          if (useGamma && requestedContentType === 'presentation') {
            console.log('🎨 Generating Gamma presentation...')

            try {
              // Transform to Gamma-compatible markdown
              const presentationContent = formatFrameworkForGamma(latestFramework)

              const gammaResponse = await fetch(
                `${Deno.env.get('SUPABASE_URL')}/functions/v1/gamma-presentation`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
                  },
                  body: JSON.stringify({
                    title: preloadedStrategy.subject,
                    content: presentationContent,
                    topic: preloadedStrategy.subject,
                    format: 'presentation',
                    slideCount: 12,
                    capture: true,
                    organization_id: context.organizationId || organizationId,
                    campaign_id: conversationId,
                    options: {
                      imageSource: 'ai',
                      tone: 'professional',
                      cardSplit: 'auto'
                    }
                  })
                }
              )

              if (gammaResponse.ok) {
                const gammaData = await gammaResponse.json()
                console.log('✅ Gamma presentation started:', gammaData.generationId)

                // Store generationId for polling
                gammaGenerationId = gammaData.generationId

                // Initialize responseMessage if empty (presentation-only path)
                if (!responseMessage) {
                  responseMessage = `🎨 **Generating your Gamma presentation...**\n\n`
                } else {
                  responseMessage += `\n\n🎨 **Generating your Gamma presentation...**\n\n`
                }
                responseMessage += `Your presentation is being created. This typically takes 30-60 seconds.\n`
                responseMessage += `I'll update you automatically when it's ready!`
              } else {
                console.warn('Gamma generation failed:', gammaResponse.status)
                responseMessage = responseMessage || '⚠️ Gamma presentation generation failed.'
              }
            } catch (gammaError) {
              console.error('Gamma generation error:', gammaError)
              responseMessage = responseMessage || '⚠️ Could not generate Gamma presentation.'
            }
          }

          return new Response(
            JSON.stringify({
              success: true,
              type: gammaGenerationId ? 'gamma_generating' : 'content_generated',
              message: responseMessage,
              response: responseMessage, // NIVPanel looks for 'response' field
              content: contentData?.content || null,
              contentType: requestedContentType,
              hasGamma: useGamma && requestedContentType === 'presentation',
              gammaGenerationId: gammaGenerationId, // Frontend will poll using this
              sessionId: sessionId,
              conversationId: conversationId
            }),
            {
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              }
            }
          )

        } catch (executionError) {
          console.error('❌ Execution error:', executionError)
          return new Response(
            JSON.stringify({
              success: false,
              type: 'execution_error',
              message: `Failed to generate content: ${executionError.message}`,
              sessionId: sessionId,
              conversationId: conversationId
            }),
            {
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              },
              status: 500
            }
          )
        }
      } else {
        // No framework available
        return new Response(
          JSON.stringify({
            success: false,
            type: 'no_framework',
            message: 'I need to create a strategic framework first before I can execute content generation. Could you describe what you want to create?',
            sessionId: sessionId,
            conversationId: conversationId
          }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          }
        )
      }
    }

    // Initialize shouldGenerateFramework early to avoid reference errors
    let shouldGenerateFramework = false

    // Intelligent query analysis and resource selection
    // Extract organization from context - matches niv-orchestrator-robust exactly
    // organizationId already declared from request body, just reassign if needed
    if (!organizationId) {
      organizationId = context.organizationId || context.organization || context.organizationName
    }

    // Handle edge cases with organization input
    if (typeof organizationId !== 'string') {
      console.warn(`⚠️ Invalid organization type: ${typeof organizationId}, converting to string`)
      organizationId = String(organizationId)
    }

    // If organizationId is just "1" or numeric, DON'T convert - use it to search
    // The frontend sends real UUIDs, only fallback to default if truly empty
    if (organizationId === '1' || organizationId === 1 || !organizationId || organizationId === 'Unknown') {
      console.warn(`⚠️ Invalid organizationId received: "${organizationId}"`)
      console.log(`🔍 Full context received:`, JSON.stringify(context, null, 2))
      console.log(`🔄 This should not happen - frontend should always send organization UUID`)
      // Use a placeholder that will trigger profile creation
      organizationId = 'Unknown'
    }

    // Trim whitespace
    if (typeof organizationId === 'string') {
      organizationId = organizationId.trim()
    }

    // Load organization profile FIRST to get the name
    // Use organization name from frontend context (avoids stale cache issues)
    let orgProfile = null

    if (organizationContext) {
      // Prefer frontend context over database lookup
      orgProfile = {
        organization_id: organizationId,
        organization_name: organizationContext.name || organizationId,
        industry: organizationContext.industry || 'Technology',
        keywords: [organizationContext.name || organizationId],
        competition: {
          direct_competitors: organizationContext.competitors || [],
          indirect_competitors: []
        }
      }
      console.log(`✅ Using organization context from frontend: ${orgProfile.organization_name}`)
    } else {
      // Fallback to database lookup if no context provided
      try {
        orgProfile = await getMcpDiscovery(organizationId)
        console.log(`✅ Loaded organization profile from database: ${orgProfile?.organization_name || organizationId}`)
      } catch (error) {
        console.error('⚠️ Failed to load organization profile:', error)
      }
    }

    console.log(`🏢 Organization context: "${orgProfile?.organization_name || organizationName}" (validated)`)

    // Get module-specific persona
    const persona = getModulePersona(context.activeModule)
    console.log(`🎭 Active persona: ${persona.title} for ${context.activeModule || 'intelligence'} module`)

    // Detect query type for formatting
    const queryType = detectQueryType(userMessage)
    console.log(`📝 Query type: ${queryType}`)

    // CLAUDE-FIRST APPROACH: Let Claude understand the query and decide what to do
    let claudeUnderstanding = null
    let queryStrategy = null

    if (ANTHROPIC_API_KEY) {
      // Step 1: Ask Claude to understand the query and plan approach
      const understandingPrompt = `${getNivSystemPrompt()}

You are analyzing this user query to understand what they need and how to get it.

**CRITICAL - CURRENT DATE & YEAR AWARENESS:**
- TODAY IS: ${getCurrentDate()}
- CURRENT YEAR: ${new Date().getFullYear()}
- **YOU MUST INCLUDE "${new Date().getFullYear()}" IN EVERY SEARCH QUERY** (prevents old 2024/2023 results)
- Example: NOT "OpenAI education market" → CORRECT: "OpenAI education market ${new Date().getFullYear()}"

${conversationHistory.length > 0 ? `Recent Conversation:
${conversationHistory.map(msg => `${msg.role === 'user' ? 'User' : 'NIV'}: ${msg.content}`).join('\n')}
` : ''}

Current User Query: "${userMessage}"
Organization Context: ${organizationName}
Current Module: ${context.activeModule || 'intelligence'}

Think step by step:
1. What is the user really asking for?
2. **IS THIS A COMMAND OR A RESEARCH QUERY?** Commands like "send this to gamma", "create in campaign builder" should NOT trigger research
3. Do I need fresh, real-time information to answer this properly?
4. What specific search terms + **${new Date().getFullYear()}** would find the best current results?
5. Should I search quality sources only, or cast a wider net?
6. Should I generate a strategic framework now?

Key decision criteria:
- If this is a ROUTING/EXECUTION command (e.g., "send to gamma", "create deck") → use contextual_response (no research needed)
- If asking about "latest", "recent", "regulatory", "breaking", "announcement" → MUST use fireplexity_targeted
- If asking about specific current events, competitors, or news → MUST use fireplexity_targeted
- If asking for strategic advice or analysis of existing info → can use contextual_response
- Default to searching when uncertain - better to have fresh data

**CRITICAL - SEARCH QUERY TEMPORAL CONTEXT:**
- For "recent": Be SPECIFIC - use "last 2 weeks" or "past 30 days", NOT just "October ${new Date().getFullYear()}"
- For "latest": Include "past 14 days" or "last month" for precision
- ALWAYS include "${new Date().getFullYear()}" to filter out 2024/2023 results
- DON'T focus only on "announcements" - tech news breaks via LEAKS, RUMORS, PREVIEWS, API changes, developer discussions
- Example GOOD: "Gemini 3 leak rumor preview last 2 weeks ${new Date().getFullYear()}"
- Example GOOD: "OpenAI model changes past 30 days ${new Date().getFullYear()}"
- Example BAD: "Google Gemini 3 announcement October ${new Date().getFullYear()}" (too formal, too broad)
- Example BAD: "Gemini 3 launch" (no timeframe, no year, misses leaks)

IMPORTANT: Strategic framework generation:
- Set generate_framework to FALSE if user is asking for research, analysis, or information
- Set generate_framework to FALSE if this is the first message about a topic
- Set generate_framework to FALSE if user wants CONTENT EXECUTION (media plan, press release, blog post, etc.)
- Only set generate_framework to TRUE if user explicitly says "create a strategy document", "develop a strategic framework", "build a campaign strategy" AFTER seeing research
- "create a media plan" = content execution (generate_framework: false) - routes to content generator
- "create a strategy" = strategic framework (generate_framework: true) - creates strategy document
- Example: "We need analysis on AI education landscape" → generate_framework: false (they want research first)
- Example: "Based on that analysis, create our launch strategy" → generate_framework: true (strategic framework request)
- Example: "create a media plan for this launch" → generate_framework: false (content execution - routes to generator)
- Example: "turn this into a media plan" → generate_framework: false (content execution request)

Respond with JSON only:
{
  "understanding": {
    "what_user_wants": "brief description of what they're asking for",
    "entities": ["companies", "people", "products mentioned"],
    "timeframe": "latest/recent/specific date/all-time",
    "topics": ["specific topics they care about - be specific"],
    "requires_fresh_data": true/false,
    "why_fresh_data": "explanation if true (e.g., 'needs current regulatory updates')"
  },
  "approach": {
    "strategy": "MUST be 'fireplexity_targeted' if requires_fresh_data is true, otherwise intelligence_pipeline or contextual_response",
    "reasoning": "why this approach makes sense",
    "search_query": "specific, targeted search query with YEAR for current info (e.g., 'OpenAI regulatory compliance October ${new Date().getFullYear()}' not just 'OpenAI')",
    "search_domains": "quality_first (check quality sources but can expand)/quality_only (strict)/all_web (broad search)",
    "domain_reasoning": "why this domain choice (e.g., 'regulatory news may be on government sites not in master sources')",
    "confidence": 0.0-1.0,
    "generate_framework": false,
    "framework_reasoning": "Only true if user explicitly asks for strategy/plan/framework AFTER seeing research"
  },
  "acknowledgment": "Natural acknowledgment message showing you understand what they want"
}`

      try {
        const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 500,
            messages: [{ role: 'user', content: understandingPrompt }]
          }),
        })

        if (claudeResponse.ok) {
          const data = await claudeResponse.json()
          const responseText = data.content[0].text

          try {
            // Try to extract JSON from the response
            let jsonText = responseText.trim()

            // If response contains markdown code blocks, extract the JSON
            const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/) ||
                             jsonText.match(/```\s*([\s\S]*?)\s*```/)
            if (jsonMatch) {
              jsonText = jsonMatch[1].trim()
            }

            claudeUnderstanding = JSON.parse(jsonText)
            console.log('🧠 Claude understanding:', claudeUnderstanding)

            // Use Claude's strategy
            queryStrategy = {
              approach: claudeUnderstanding.approach.strategy,
              confidence: claudeUnderstanding.approach.confidence,
              reasoning: claudeUnderstanding.approach.reasoning,
              searchQuery: claudeUnderstanding.approach.search_query,
              understanding: claudeUnderstanding.understanding
            }
          } catch (parseError) {
            console.log('⚠️ Failed to parse Claude understanding:', parseError.message)
            console.log('Raw response was:', responseText.substring(0, 200))
            // Continue with fallback strategy
          }
        }
      } catch (error) {
        console.error('Claude understanding error:', error)
      }
    }

    // Fallback if Claude isn't available or fails
    if (!queryStrategy) {
      try {
        queryStrategy = await analyzeQueryStrategy(userMessage, organizationId, context)
      } catch (fallbackError) {
        console.error('Fallback strategy failed:', fallbackError)
        // Ultimate fallback - just do fireplexity search
        queryStrategy = {
          approach: 'fireplexity_targeted',
          confidence: 0.5,
          reasoning: 'Using default search strategy',
          searchQuery: message,
          understanding: { what_user_wants: 'Information about: ' + message }
        }
      }
    }

    console.log(`🎯 Strategy chosen: ${queryStrategy?.approach} (confidence: ${queryStrategy?.confidence})`)

    // If this is an acknowledgment request, return Claude's understanding
    if (stage === 'acknowledge') {
      const acknowledgment = claudeUnderstanding?.acknowledgment ||
                           generateAcknowledgment(message, queryStrategy, persona)

      return new Response(
        JSON.stringify({
          success: true,
          stage: 'acknowledgment',
          message: acknowledgment,
          strategy: queryStrategy?.approach || 'fireplexity_targeted',
          understanding: claudeUnderstanding?.understanding || queryStrategy?.understanding,
          sessionId: sessionId
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    let enrichedContext = context
    let toolResults = {}

    // Get or create concept state BEFORE orchestration decision
    const conceptState = getConceptState(conversationId)

    // Check if query requires multi-step orchestration (including proposal generation check)
    const isComplexQuery = checkQueryComplexity(userMessage, claudeUnderstanding, conceptState)

    if (isComplexQuery && ANTHROPIC_API_KEY) {
      const isProposalMode = conceptState && shouldGenerateProposals(conceptState, userMessage)

      if (isProposalMode) {
        console.log('🎯 Proposal generation mode activated - conducting comprehensive research...')
      } else {
        console.log('🤖 Query requires multi-step orchestration...')
      }

      // Decompose the query into research steps
      // IMPORTANT: Use refined search query from Claude's understanding, not raw user message
      const researchQuery = queryStrategy?.searchQuery || claudeUnderstanding?.approach?.search_query || userMessage
      console.log(`🔍 Using research query: "${researchQuery.substring(0, 80)}..."`)
      const researchPlan = await decomposeQuery(researchQuery, context, ANTHROPIC_API_KEY)
      console.log(`📋 Research plan created: ${researchPlan.steps.length} steps`)

      // Create tools for self-orchestration
      const orchestrationTools = {
        firesearch: async (query: string) => {
          // Use the NEW FireSearch for validated, cited research
          console.log(`🔬 Orchestration calling FireSearch for: "${query.substring(0, 50)}..."`)

          const supabaseUrl = Deno.env.get('SUPABASE_URL')!
          const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

          // Determine timeframe
          let timeframe = 'week'  // Default: past 7 days (more reasonable than 3)
          const queryLower = query.toLowerCase()
          if (queryLower.match(/breaking|just|today|current|right now/i)) {
            timeframe = 'current'  // Past 24 hours
          } else if (queryLower.match(/latest|recent|new/i)) {
            timeframe = 'recent'  // Past 3 days for truly recent queries
          } else if (queryLower.match(/this week/i)) {
            timeframe = 'week'  // Past 7 days
          } else if (queryLower.match(/this month|past month|market share|revenue|analysis|landscape|positioning/i)) {
            timeframe = 'month'  // Past 30 days for analysis queries
          }
          // Always use date filter - years like "2025" are context, not signals

          try {
            // Call Firecrawl directly (no wrappers, no validation)
            const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY') || 'fc-3048810124b640eb99293880a4ab25d0'
            const FIRECRAWL_BASE_URL = 'https://api.firecrawl.dev/v2'

            const tbsMap: Record<string, string> = {
              'current': 'qdr:h',
              'recent': 'qdr:d3',
              'week': 'qdr:w',
              'month': 'qdr:m',
              'year': ''
            }
            const tbs = tbsMap[timeframe] || 'qdr:d3'

            const response = await fetch(`${FIRECRAWL_BASE_URL}/search`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                query: query,
                limit: 10,
                tbs,
                scrapeOptions: {
                  formats: ['markdown'],
                  onlyMainContent: true
                }
              })
            })

            if (response.ok) {
              const data = await response.json()

              if (data.success) {
                const webResults = data.data?.web || []
                const newsResults = data.data?.news || []
                const allResults = [...webResults, ...newsResults]

                const articles = allResults.map(result => ({
                  title: result.title || 'Untitled',
                  description: result.description || '',
                  url: result.url,
                  content: result.markdown || result.description || '',
                  publishedAt: result.publishedTime || new Date().toISOString()
                }))

                console.log(`✅ Firecrawl returned ${articles.length} results`)
                return { data: articles, success: true }
              }
            }
          } catch (error) {
            console.error(`⚠️ Firecrawl failed in orchestration:`, error.message)
          }

          return { data: [], success: false }
        },
        intelligencePipeline: async (query: string) => {
          const result = await callEnhancedIntelligencePipeline(query, organizationId, context)
          return result
        },
        mcpDiscovery: async (org: string) => {
          const result = await getMcpDiscovery(org)
          return result
        }
      }

      // Execute the research plan
      const orchestrationResult = await orchestrateResearch(
        researchPlan,
        orchestrationTools,
        (step) => {
          console.log(`✅ Completed step ${step.id}: ${step.query.substring(0, 50)}...`)
        }
      )

      // Consolidate results into toolResults format
      toolResults = {
        orchestrated: true,
        researchPlan: researchPlan,
        completedSteps: orchestrationResult.completedSteps,
        keyFindings: orchestrationResult.keyFindings,
        // Merge all research results
        intelligencePipeline: {
          synthesis: orchestrationResult.keyFindings.join('\n\n'),
          articles: [],
          orchestrationDetails: orchestrationResult.aggregatedResults
        }
      }

      // Extract articles from orchestration results
      Object.values(orchestrationResult.aggregatedResults).forEach((result: any) => {
        if (result?.data && Array.isArray(result.data)) {
          toolResults.intelligencePipeline.articles.push(...result.data)
        }
        if (result?.articles && Array.isArray(result.articles)) {
          toolResults.intelligencePipeline.articles.push(...result.articles)
        }
      })

      // Extract clean key findings from orchestrated articles if not already present
      if ((!toolResults.keyFindings || toolResults.keyFindings.length === 0) && toolResults.intelligencePipeline.articles.length > 0) {
        toolResults.keyFindings = []
        toolResults.intelligencePipeline.articles.forEach((article: any) => {
          const rawTitle = article.title || article.headline
          if (rawTitle) {
            // Clean title - remove extra whitespace, special chars
            const title = rawTitle
              .replace(/\s+/g, ' ')
              .replace(/[^\w\s\-\.,&]/g, '')
              .trim()

            // Clean and truncate description if available
            const description = (article.description || '')
              .replace(/\s+/g, ' ')
              .trim()
              .substring(0, 200)

            // Format: **Title** - Description
            const formatted = description
              ? `**${title}** - ${description}${description.length >= 200 ? '...' : ''}`
              : `**${title}**`

            toolResults.keyFindings.push(formatted)
          }
        })
        console.log(`📋 Extracted ${toolResults.keyFindings.length} key findings from orchestrated articles`)

        // Also update synthesis if it's empty
        if (!toolResults.intelligencePipeline.synthesis && toolResults.keyFindings.length > 0) {
          toolResults.intelligencePipeline.synthesis = toolResults.keyFindings.slice(0, 5).join('\n\n')
        }
      }

      console.log(`🔍 Orchestrated research complete: ${toolResults.intelligencePipeline.articles.length} articles, ${toolResults.keyFindings?.length || 0} findings`)

      // Only generate proposals if explicitly needed
      if (orchestrationResult.keyFindings.length > 0 && isProposalMode) {
        console.log('🎯 User wants proposals - preparing proposal context...')

        // Add proposal generation flag for Claude
        toolResults.generateProposals = true
        toolResults.proposalContext = {
          researchPlan: researchPlan,
          keyFindings: orchestrationResult.keyFindings,
          userObjective: userMessage,
          articlesAnalyzed: toolResults.intelligencePipeline.articles.length
        }
      } else if (orchestrationResult.keyFindings.length > 0) {
        console.log('📊 Research complete - preparing intelligence for response...')
        // Store key findings for NIV to use but don't force proposal mode
        toolResults.keyFindings = orchestrationResult.keyFindings
        toolResults.researchComplete = true
      }

      // Check for information gaps
      const gaps = await detectInformationGaps(
        orchestrationResult.aggregatedResults,
        message,
        ANTHROPIC_API_KEY
      )

      if (gaps.length > 0) {
        console.log(`📌 Detected ${gaps.length} information gaps`)

        // Execute critical gap queries
        const criticalGaps = gaps.filter(g => g.priority === 'critical')
        for (const gap of criticalGaps) {
          console.log(`🔍 Filling critical gap: ${gap.topic}`)
          const gapResult = await orchestrationTools.fireplexity(gap.query)
          if (gapResult.data && gapResult.data.length > 0) {
            toolResults.intelligencePipeline.articles.push(...gapResult.data)
          }
        }
      }
    } else {
      // Standard single-step research (non-orchestrated path)
      // IMPORTANT: Don't search for "strategic framework" - that's a command, not a search term
      let searchQuery = queryStrategy.searchQuery || userMessage

      // If this is a framework generation request, don't search for framework articles
      if (shouldGenerateFramework ||
          searchQuery.toLowerCase().includes('strategic framework') ||
          searchQuery.toLowerCase().includes('generate a framework') ||
          searchQuery.toLowerCase().includes('create a framework')) {
        console.log('🎯 Framework request detected - will use existing research, not searching for framework articles')
        // Skip new search, use existing research from conceptState
        searchQuery = '' // Empty search to prevent searching for "strategic framework"
      }

      if (queryStrategy.approach === 'intelligence_pipeline' && queryStrategy.confidence >= 0.7 && searchQuery) {
      console.log('🎯 Executing Intelligence Pipeline strategy...')
      console.log(`🔍 Using search query: "${searchQuery}"`)

      try {
        const pipelineResult = await callEnhancedIntelligencePipeline(searchQuery, organizationId, context)

        if (pipelineResult && pipelineResult.success) {
          // Extract key findings from articles
          const extractedKeyFindings: string[] = []
          if (pipelineResult.articles && Array.isArray(pipelineResult.articles)) {
            pipelineResult.articles.forEach((article: any) => {
              if (article.title || article.headline) {
                extractedKeyFindings.push(article.title || article.headline)
              }
            })
          }

          toolResults.intelligencePipeline = {
            synthesis: pipelineResult.intelligence,
            articles: pipelineResult.articles,
            organizationContext: pipelineResult.organizationContext,
            stats: pipelineResult.pipelineStats,
            strategy: queryStrategy
          }

          // Add keyFindings to toolResults root level for easy access
          toolResults.keyFindings = extractedKeyFindings

          console.log(`🎯 Intelligence Pipeline: ${pipelineResult.articles?.length || 0} articles, synthesis: ${pipelineResult.intelligence ? 'YES' : 'NO'}, keyFindings: ${extractedKeyFindings.length}`)
        } else {
          throw new Error('Pipeline returned no results')
        }
      } catch (error) {
        console.error('Intelligence Pipeline failed, executing fallback strategy:', error)
        if (searchQuery) {
          toolResults = await executeFallbackStrategy(userMessage, organizationId, context, queryStrategy)
        }
      }
    } else if (queryStrategy.approach === 'fireplexity_targeted' && searchQuery) {
      console.log('🔍 Executing Targeted Fireplexity strategy...')
      console.log(`🔍 Using search query: "${searchQuery}"`)
      toolResults = await executeTargetedFireplexity(searchQuery, organizationId, context, queryStrategy)
    } else if (searchQuery) {
      console.log('💡 Executing contextual response strategy...')
      toolResults = await executeContextualResponse(searchQuery, organizationId, context, queryStrategy)
    } else {
      console.log('📚 Framework generation - using existing research from conversation')
      // No new search needed, will use conceptState research
      toolResults = {}
    }

    } // Close the else block for non-orchestrated path

    // Organization profile already loaded earlier (at the start of the function)
    // Use orgProfile name if available, fallback to organizationName
    const effectiveOrgName = orgProfile?.organization_name || organizationName || organizationId || 'Unknown Organization'

    console.log(`🎯 Using organization profile: ${effectiveOrgName}`)
    console.log(`  Industry: ${orgProfile?.industry}`)
    console.log(`  Keywords: ${orgProfile?.keywords?.slice(0, 5).join(', ')}`)
    console.log(`  Competitors: ${orgProfile?.competition?.direct_competitors?.slice(0, 3).join(', ')}`)

    if (orgProfile) {
      toolResults.discoveryData = {
        organizationName: effectiveOrgName,
        competitors: orgProfile.competition?.direct_competitors?.slice(0, 5) || [],
        keywords: orgProfile.keywords?.slice(0, 10) || [],
        industry: orgProfile.industry
      }
      console.log(`🎯 Loaded profile for ${effectiveOrgName}: ${toolResults.discoveryData.competitors.length} competitors, ${toolResults.discoveryData.keywords.length} keywords`)
    } else {
      // Provide default discovery data if profile loading failed
      toolResults.discoveryData = {
        organizationName: effectiveOrgName,
        competitors: [],
        keywords: [effectiveOrgName],
        industry: 'Technology'
      }
      console.log(`🎯 Using default profile for ${effectiveOrgName}`)
    }

    // Query Memory Vault for relevant past content and playbooks
    console.log(`📚 Checking Memory Vault for relevant guidance...`)
    try {
      const memoryVaultGuidance = await getMemoryVaultGuidance({
        organizationId: organizationId,
        query: queryStrategy?.searchQuery || userMessage,
        contentType: 'general'
      })

      if (memoryVaultGuidance.source !== 'none') {
        toolResults.memoryVault = {
          guidance: memoryVaultGuidance.guidance,
          source: memoryVaultGuidance.source
        }
        console.log(`✅ Memory Vault guidance added (source: ${memoryVaultGuidance.source})`)
      } else {
        console.log(`📭 No relevant Memory Vault content found`)
      }
    } catch (memoryError) {
      console.error('⚠️ Memory Vault error (non-blocking):', memoryError)
    }

    // Enrich context with tool results
    if (Object.keys(toolResults).length > 0) {
      enrichedContext = { ...context, toolResults }
    }

    // Update concept state with research results AFTER we have them
    // conceptState was already created earlier before orchestration decision
    updateConceptState(conversationId, userMessage, toolResults, conversationHistory)
    console.log(`📊 Research accumulated: ${conceptState.researchHistory.length} rounds`)
    console.log(`📊 Concept State - Stage: ${conceptState.stage}, Confidence: ${conceptState.confidence}%`)

    // Cleanup old concept states to prevent memory leaks
    cleanupOldConceptStates()

    // Call Claude with enhanced prompt - combining base identity with module persona
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured')
    }

    // Combine base NIV identity with module-specific persona
    const moduleEnhancedPrompt = `${getNivSystemPrompt()}

CURRENT CONTEXT: Operating as ${persona.title}
${persona.mindset}

Remember to maintain natural conversation flow while bringing this perspective to the discussion.
`

    // Determine if we should generate a strategic framework
    const queryLower = userMessage.toLowerCase()

    // Check if user is confirming framework execution after seeing answers
    const frameworkConfirmation =
      queryLower.includes('yes') ||
      queryLower.includes('execute') ||
      queryLower.includes('go ahead') ||
      queryLower.includes('proceed') ||
      queryLower.includes('do it') ||
      queryLower.includes('turn it into')

    // Check if previous message asked for framework confirmation
    const previousMessageAskedForConfirmation = conversationHistory && conversationHistory.length > 0 &&
      conversationHistory[conversationHistory.length - 1]?.content?.includes('turn this into an executable strategic framework')

    // Check for explicit framework requests
    const explicitFrameworkRequest =
      queryLower.includes('create a framework') ||
      queryLower.includes('strategic framework') ||
      queryLower.includes('build a framework') ||
      queryLower.includes('develop a strategy') ||
      queryLower.includes('create a strategy') ||
      queryLower.includes('finalize the strategy') ||
      queryLower.includes('save to memory vault') ||
      queryLower.includes('ready for execution')

    // Also check if user explicitly said they want it after discussion
    const afterDiscussionRequest =
      (conceptState.fullConversation.length > 2 &&
       (queryLower.includes('let\'s finalize') ||
        queryLower.includes('create the framework') ||
        queryLower.includes('pull it together') ||
        queryLower.includes('ready to execute')))

    // TRUST CLAUDE'S DECISION - match orchestrator-robust's simple logic
    // Claude already analyzed the conversation and made a decision - we should respect it

    // Check Claude's understanding if available - TRUST IT FIRST
    if (claudeUnderstanding?.approach?.generate_framework === true) {
      shouldGenerateFramework = true
      console.log('🤖 Claude detected framework request')
    } else if (claudeUnderstanding?.approach?.generate_framework === false) {
      shouldGenerateFramework = false
      console.log('🤖 Claude says do research first, not framework')
    } else if (frameworkConfirmation && previousMessageAskedForConfirmation) {
      // User confirmed after seeing structured answers
      shouldGenerateFramework = true
      console.log('✅ User confirmed framework execution after reviewing answers')
    } else if (explicitFrameworkRequest) {
      shouldGenerateFramework = true
      console.log('🎯 Explicit framework request detected:', queryLower.substring(0, 100))
    } else if (afterDiscussionRequest) {
      shouldGenerateFramework = true
      console.log('📝 Framework requested after discussion')
    } else if (conceptState.stage === 'ready' && conceptState.confidence >= 80) {
      // Only auto-trigger if user seems to want closure
      if (queryLower.includes('what\'s next') || queryLower.includes('ready')) {
        shouldGenerateFramework = true
        console.log('🚀 Concept ready - auto-triggering framework')
      }
    }

    console.log(`🎯 Framework generation decision: ${shouldGenerateFramework}`)

    // Build the message and validate token count before API call
    const claudeMessage = buildClaudeMessage(userMessage, toolResults, queryType, queryStrategy, conversationHistory, shouldGenerateFramework, conceptState)
    const systemPromptTokens = estimateTokenCount(moduleEnhancedPrompt)
    const messageTokens = estimateTokenCount(claudeMessage)
    const totalTokens = systemPromptTokens + messageTokens

    console.log(`🔢 Token count validation: System=${systemPromptTokens}, Message=${messageTokens}, Total=${totalTokens}`)

    // Claude Sonnet has approximately 200k context window, but let's be conservative
    const MAX_SAFE_TOKENS = 180000
    if (totalTokens > MAX_SAFE_TOKENS) {
      console.warn(`⚠️ Token count (${totalTokens}) exceeds safe limit (${MAX_SAFE_TOKENS}), message may fail`)
      throw new Error(`Message too long (${totalTokens} tokens). Please use shorter conversation history or reduce research scope.`)
    }

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: moduleEnhancedPrompt,
        messages: [
          {
            role: 'user',
            content: claudeMessage
          }
        ]
      }),
    })

    if (!anthropicResponse.ok) {
      const error = await anthropicResponse.text()
      throw new Error(`Claude API error: ${error}`)
    }

    const claudeData = await anthropicResponse.json()
    let responseText = claudeData.content[0].text

    // Clean up any tool use tags or XML-like content from Claude's response
    responseText = cleanClaudeResponse(responseText)

    // DEBUG: Log BEFORE formatting
    console.log('🔍 BEFORE formatNivResponse (first 500 chars):', responseText.substring(0, 500))
    console.log('🔍 BEFORE Contains \\n\\n?', responseText.includes('\n\n'))

    // Format the response with organization context
    const orgName = toolResults.discoveryData?.organizationName || context.organizationId || 'your organization'
    responseText = formatNivResponse(responseText, orgName)

    // DEBUG: Log AFTER formatting
    console.log('🔍 AFTER formatNivResponse (first 500 chars):', responseText.substring(0, 500))
    console.log('🔍 AFTER Contains \\n\\n?', responseText.includes('\n\n'))

    // Extract structured content
    const structuredContent = extractStructuredContent(responseText, queryType)

    console.log('✅ NIV Response generated:', {
      type: structuredContent.type,
      formatted: structuredContent.formatted
    })

    // Framework decision was already made above before the API call

    // NEW FLOW: Check if this is a structured request (multi-part questions)
    const structuredRequest = detectStructuredRequest(message)
    let structuredResponse = null

    if (structuredRequest.isStructured && stage === 'full') {
      console.log(`📋 Detected structured request with ${structuredRequest.sections.length} sections - generating intelligent answers`)
      structuredRequest.sections.forEach((section, i) => {
        console.log(`  ${i + 1}. ${section}`)
      })

      // Build response using Claude for each section
      structuredResponse = await buildIntelligentStructuredResponse(
        structuredRequest.sections,
        {
          ...toolResults,
          synthesis: toolResults.intelligencePipeline?.synthesis,
          keyFindings: toolResults.intelligencePipeline?.keyFindings,
          articles: toolResults.intelligencePipeline?.articles,
          organizationName: organizationName
        },
        organizationName,
        message
      )

      console.log('✅ Built structured response with sections:', Object.keys(structuredResponse))

      // Format the answers for display
      const formattedAnswers = formatStructuredSectionsResponse(structuredResponse, organizationName)

      // Store in concept state for next message
      conceptState.lastResponse = {
        awaitingFrameworkConfirmation: true,
        structuredResponse: structuredResponse
      }
      conceptState.lastUpdate = Date.now()

      // Return the answers FIRST, then ask about execution
      return new Response(
        JSON.stringify({
          success: true,
          message: formattedAnswers + '\n\n---\n\n**Would you like me to turn this into an executable strategic framework?** I can generate content, playbooks, and timelines based on these answers.',
          type: 'structured-answers',
          structured: structuredResponse,
          awaitingFrameworkConfirmation: true,
          conversationId: conversationId,
          // Pass the structured response for the next message
          prebuiltStructuredResponse: structuredResponse
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // DISABLED: Strategic framework generation now happens conversationally within Claude's response
    // NIV provides strategic advice in conversation, not as external framework object
    if (false && shouldGenerateFramework && stage === 'full') {
      console.log('🎯 [DISABLED] Strategic Framework edge function...')

      // Store NIV's response in concept state
      conceptState.fullConversation.push({
        role: 'assistant',
        content: responseText,
        timestamp: new Date()
      })

      // Make sure we have the latest state after updates
      const updatedState = getConceptState(conversationId)

      // Check if we have a pre-built structured response from previous message
      // Since Edge Functions are stateless, check conversation history for it
      let prebuiltStructuredResponse = body.prebuiltStructuredResponse || updatedState.lastResponse?.structuredResponse

      // Check if the last assistant message had structured data
      if (!prebuiltStructuredResponse && conversationHistory && conversationHistory.length > 0) {
        console.log('🔍 Checking conversation history for structured data. History length:', conversationHistory.length)
        const lastAssistantMessage = conversationHistory.slice().reverse().find((msg: any) => msg.role === 'assistant' || msg.role === 'niv')
        console.log('🔍 Last assistant message:', {
          role: lastAssistantMessage?.role,
          hasStructured: !!lastAssistantMessage?.structured,
          contentPreview: lastAssistantMessage?.content?.substring(0, 100)
        })
        if (lastAssistantMessage && lastAssistantMessage.structured) {
          prebuiltStructuredResponse = lastAssistantMessage.structured
          console.log('📦 Recovered structured response from conversation history with keys:', Object.keys(prebuiltStructuredResponse))
        } else {
          console.log('❌ No structured data found in conversation history')
        }
      }

      try {

        // Use the cleaner extraction function
        const extractedResearch = extractAndPackageResearch(updatedState, toolResults)

        console.log(`📦 Sending research to strategic framework:`, {
          articles: extractedResearch.articles.length,
          keyFindings: extractedResearch.keyFindings.length,
          synthesis: extractedResearch.synthesis.length,
          themes: extractedResearch.themes.length,
          opportunities: extractedResearch.insights.opportunities.length,
          hasPrebuiltStructuredResponse: !!prebuiltStructuredResponse
        })

        // Call the NIV Strategic Framework edge function
        const strategicResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/niv-strategic-framework`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
            },
            body: JSON.stringify({
              research: extractedResearch,
              userQuery: message,
              organizationContext: {
                organizationName: organizationName,
                organizationId: organizationId,
                discovery: toolResults.discoveryData,
                competitors: toolResults.discoveryData?.competitors || [],
                keywords: toolResults.discoveryData?.keywords || [],
                industry: toolResults.discoveryData?.industry || context.industry,
                conceptState: updatedState,
                conversationId: conversationId
              },
              conversationHistory: conversationHistory,
              targetComponent: 'auto-detect',
              // Pass pre-built structured response if available
              prebuiltStructuredResponse: prebuiltStructuredResponse
            })
          }
        )

        if (!strategicResponse.ok) {
          throw new Error(`Strategic framework generation failed: ${strategicResponse.statusText}`)
        }

        const strategicData = await strategicResponse.json()
        console.log('✅ NIV Strategic Framework generated successfully')

        // Use ONLY the framework from the strategic edge function
        if (!strategicData.framework) {
          throw new Error('Strategic framework edge function returned no framework')
        }

        const structuredFramework = strategicData.framework

        // Format strategic response for display
        // Use prebuilt structured response if available (from user confirmation flow)

        // DEBUG: Log what we're about to display
        console.log('📊 FRAMEWORK DISPLAY DEBUG:', {
          hasStrategy: !!structuredFramework.strategy,
          hasNarrative: !!structuredFramework.strategy?.narrative,
          hasProofPoints: !!structuredFramework.strategy?.proof_points,
          proofPointsLength: structuredFramework.strategy?.proof_points?.length || 0,
          hasKeyMessages: !!structuredFramework.strategy?.keyMessages,
          keyMessagesLength: structuredFramework.strategy?.keyMessages?.length || 0,
          hasTargetAudiences: !!structuredFramework.strategy?.target_audiences,
          audiencesLength: structuredFramework.strategy?.target_audiences?.length || 0,
          hasMediaTargets: !!structuredFramework.media_targets,
          tier1Length: structuredFramework.media_targets?.tier_1_targets?.length || 0,
          hasExecutionPlan: !!structuredFramework.executionPlan,
          hasTimeline: !!structuredFramework.executionPlan?.timeline,
          phasesLength: structuredFramework.executionPlan?.timeline?.phases?.length || 0,
          hasContentStrategy: !!structuredFramework.contentStrategy,
          hasKPIs: !!structuredFramework.contentStrategy?.kpis,
          kpisLength: structuredFramework.contentStrategy?.kpis?.length || 0,
          hasAutoExecutable: !!structuredFramework.executionPlan?.autoExecutableContent,
          contentTypesLength: structuredFramework.executionPlan?.autoExecutableContent?.contentTypes?.length || 0
        })

        const formattedMessage = prebuiltStructuredResponse
          ? formatStructuredSectionsResponse(prebuiltStructuredResponse, organizationName)
          : formatStrategicResponse(
              structuredFramework.strategy?.objective || 'Strategic Framework Generated',
              structuredFramework,
              organizationName
            )

        // DEBUG: Log the actual formatted message to see what's being sent to user
        console.log('📝 FORMATTED MESSAGE LENGTH:', formattedMessage.length)
        console.log('📝 FORMATTED MESSAGE PREVIEW:', formattedMessage.substring(0, 500))
        console.log('📝 FORMATTED MESSAGE INCLUDES NARRATIVE:', formattedMessage.includes('Core Narrative'))
        console.log('📝 FORMATTED MESSAGE INCLUDES PROOF POINTS:', formattedMessage.includes('Proof Points'))
        console.log('📝 FORMATTED MESSAGE INCLUDES KEY MESSAGES:', formattedMessage.includes('Key Messages'))

        console.log('🎯 Framework ready with', {
          articles: structuredFramework.intelligence?.supporting_data?.articles?.length || 0,
          keyFindings: structuredFramework.intelligence?.key_findings?.length || 0,
          hasStrategy: !!structuredFramework.strategy,
          hasTactics: !!structuredFramework.tactics
        })

        // Save to Memory Vault for orchestration
        try {
          console.log('💾 Saving strategic framework to Memory Vault...')

          const memoryVaultPayload = {
            strategy: {
              organization_id: organizationId || organizationName || 'default',
              title: structuredFramework.strategy?.objective || 'Strategic Framework',
              version: 1,

              // Research data
              research_sources: structuredFramework.intelligence?.supporting_data?.articles || [],
              research_key_findings: structuredFramework.intelligence?.key_findings || [],
              research_gaps: structuredFramework.intelligence?.gaps_identified || [],
              research_confidence: 0.85,
              research_timestamp: new Date().toISOString(),

              // Strategic framework
              strategy_objective: structuredFramework.strategy?.objective,
              strategy_approach: structuredFramework.strategy?.rationale,
              strategy_positioning: structuredFramework.narrative?.positioning_statement,
              strategy_key_messages: structuredFramework.narrative?.key_messages || [],
              strategy_narratives: structuredFramework.narrative?.story_elements || [],
              strategy_timeline: structuredFramework.execution?.timeline ? JSON.stringify(structuredFramework.execution.timeline) : null,
              strategy_urgency_level: structuredFramework.strategy?.urgency || 'medium',
              strategy_rationale: structuredFramework.strategy?.rationale,

              // NEW: Content-ready format for auto-execution
              content_strategy: structuredFramework.contentStrategy || null,
              execution_plan: structuredFramework.executionPlan || null,

              // CRITICAL: Save complete framework structure to framework_data
              framework_data: structuredFramework,

              // Metadata
              created_by: 'niv-orchestrator',
              status: 'approved',
              tags: ['niv-generated', 'strategic-framework'],

              // Workflow configuration
              workflow_campaign_intelligence: {
                enabled: structuredFramework.orchestration?.next_components?.includes('campaign') || false,
                tasks: structuredFramework.tactics?.campaign_elements || {},
                priority: structuredFramework.strategy?.urgency || 'medium'
              },
              workflow_content_generation: {
                enabled: structuredFramework.orchestration?.next_components?.includes('content') || false,
                tasks: structuredFramework.tactics?.content_creation || [],
                priority: 'normal'
              },
              workflow_strategic_planning: {
                enabled: structuredFramework.orchestration?.next_components?.includes('planning') || false,
                tasks: structuredFramework.tactics?.strategic_plays || [],
                priority: 'normal'
              },
              workflow_media_outreach: {
                enabled: structuredFramework.orchestration?.next_components?.includes('media') || false,
                tasks: structuredFramework.tactics?.media_outreach || [],
                priority: 'normal'
              }
            }
          }

          const memoryVaultResponse = await fetch(
            `${Deno.env.get('SUPABASE_URL')}/functions/v1/niv-memory-vault?action=save`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
              },
              body: JSON.stringify(memoryVaultPayload)
            }
          )

          if (memoryVaultResponse.ok) {
            const memoryVaultData = await memoryVaultResponse.json()
            console.log('✅ Strategic framework saved to Memory Vault:', memoryVaultData.message)
            console.log('🎯 Orchestration triggers:', memoryVaultData.data?.orchestration_triggers)
          } else {
            console.error('⚠️ Failed to save to Memory Vault:', await memoryVaultResponse.text())
          }
        } catch (mvError) {
          console.error('⚠️ Memory Vault save error:', mvError)
          // Non-critical error - continue with response
        }

        return new Response(
          JSON.stringify({
            success: true,
            type: 'strategic-framework',
            message: formattedMessage,
            framework: structuredFramework,           // Return framework from NIV Strategic edge function
            discovery: strategicData.discovery || toolResults.discoveryData,
            readyForHandoff: strategicData.readyForHandoff || true,
            structured: structuredContent,
            queryType: queryType,
            persona: {
              title: persona.title,
              module: 'strategic',  // We're now in strategic module
              approach: persona.approach
            },
            conceptState: {
              stage: 'ready',
              confidence: 100,
              concept: conceptState.concept,
              readyForOrchestration: true
            },
            sessionId: sessionId,
            conversationId: conversationId,
            organizationName: organizationName
          }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          }
        )
      } catch (error) {
        console.error('❌ Error calling NIV Strategic Framework:', error)

        // Do NOT fall back to local generation - return error
        const errorMessage = `Framework generation failed: ${error.message || 'Strategic framework service unavailable'}`

        return new Response(
          JSON.stringify({
            success: false,
            type: 'error',
            message: errorMessage,
            error: errorMessage,
            structured: structuredContent,
            queryType: queryType,
            persona: {
              title: persona.title,
              module: context.activeModule || 'intelligence',
              approach: persona.approach
            },
            conceptState: {
              stage: 'ready',
              confidence: 100,
              concept: conceptState.concept,
              readyForOrchestration: true
            },
            sessionId: sessionId,
            conversationId: conversationId,
            organizationName: organizationName
          }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          }
        )
      }
    }

    // ========================================================================
    // PHASE 6: Crisis Routing
    // ========================================================================
    // Detect crisis situations and route to niv-crisis-advisor
    if (stage === 'full') {
      const crisisKeywords = [
        /crisis|emergency|urgent|breaking/i,
        /scandal|breach|hack|leak/i,
        /lawsuit|investigation|regulatory/i,
        /recall|safety|injury|death/i,
        /executive.*resign|ceo.*fired/i,
        /major.*incident|critical.*issue/i
      ]

      const isCrisis = crisisKeywords.some(regex => regex.test(message))

      if (isCrisis) {
        console.log('🚨 Crisis detected - routing to niv-crisis-advisor')

        try {
          const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
          const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

          const crisisResponse = await fetch(
            `${SUPABASE_URL}/functions/v1/niv-crisis-advisor`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
              },
              body: JSON.stringify({
                query: message,
                organizationId: organizationId,
                organizationContext: {
                  organizationName: organizationName,
                  industry: context.industry || toolResults.discoveryData?.industry
                },
                conversationId: conversationId
              })
            }
          )

          if (crisisResponse.ok) {
            const crisisData = await crisisResponse.json()
            console.log('✅ Crisis advisor response received')

            return new Response(
              JSON.stringify({
                success: true,
                type: 'crisis_response',
                message: crisisData.response || crisisData.message || 'Crisis assessment complete',
                crisisAssessment: crisisData.assessment || null,
                action: {
                  type: 'open_module',
                  data: {
                    module: 'crisis',
                    context: crisisData
                  }
                },
                conceptState: {
                  stage: conceptState.stage,
                  confidence: conceptState.confidence,
                  concept: conceptState.concept
                },
                sessionId: sessionId,
                conversationId: conversationId,
                organizationName: organizationName
              }),
              {
                headers: {
                  ...corsHeaders,
                  'Content-Type': 'application/json'
                }
              }
            )
          } else {
            console.error('⚠️ Crisis advisor failed, continuing with normal flow')
            // Fall through to normal handling if crisis advisor fails
          }
        } catch (error) {
          console.error('❌ Crisis routing error:', error)
          // Fall through to normal handling
        }
      }
    }

    // ========================================================================
    // PHASE 4: Content Generation Routing
    // ========================================================================
    // Check if user wants to generate content (after framework is ready)
    if (stage === 'full') {
      const contentIntent = detectContentGenerationIntent(message, conceptState)

      if (contentIntent.wantsContent && contentIntent.confidence > 0.6) {
        console.log(`📝 Content generation intent detected (${contentIntent.confidence}) - Type: ${contentIntent.contentType}`)

        // Check if we have a framework to work with
        const hasFramework = conceptState.stage === 'ready' || conceptState.lastResponse?.structuredResponse

        // Media plans and certain content types can be generated without framework
        const canGenerateWithoutFramework = contentIntent.contentType === 'media-plan' ||
                                           contentIntent.contentType === 'media-list' ||
                                           contentIntent.contentType === 'social-post'

        if (hasFramework || canGenerateWithoutFramework) {
          try {
            // Get the framework from last response or concept state
            const framework = conceptState.lastResponse?.structuredResponse || {
              strategy: { objective: conceptState.concept.goal },
              narrative: { positioning_statement: conceptState.concept.narrative },
              intelligence: { key_findings: [] }
            }

            // Package campaign context
            const campaignContext = packageCampaignContext(
              framework,
              conceptState,
              {
                organizationName: organizationName,
                organizationId: organizationId,
                industry: context.industry || toolResults.discoveryData?.industry
              },
              contentIntent.contentType || 'press-release'
            )

            console.log('📦 Campaign context packaged:', {
              contentType: contentIntent.contentType,
              hasKeyMessages: campaignContext.keyMessages?.length > 0,
              hasResearchInsights: campaignContext.researchInsights?.length > 0
            })

            // Route to niv-content-intelligent-v2
            const contentData = await routeToContentGeneration(
              message,
              campaignContext,
              {
                organizationName,
                organizationId,
                industry: context.industry || toolResults.discoveryData?.industry
              },
              conversationId
            )

            console.log('✅ Content generation complete')

            // Return response with generated content
            return new Response(
              JSON.stringify({
                success: true,
                type: 'content_generation',
                message: contentData.response || contentData.message || 'Content generated successfully',
                content: contentData.content || contentData.generatedContent || null,
                contentType: contentIntent.contentType,
                action: {
                  type: 'content_generation',
                  data: {
                    content: contentData.content || contentData.generatedContent,
                    contentType: contentIntent.contentType
                  }
                },
                conceptState: {
                  stage: 'ready',
                  confidence: 100,
                  concept: conceptState.concept,
                  readyForOrchestration: true
                },
                sessionId: sessionId,
                conversationId: conversationId,
                organizationName: organizationName
              }),
              {
                headers: {
                  ...corsHeaders,
                  'Content-Type': 'application/json'
                }
              }
            )
          } catch (error) {
            console.error('❌ Content generation error:', error)
            // Fall through to normal response with error message
            responseText += `\n\nI encountered an error generating that content: ${error.message}. Let me know if you'd like to try again.`
          }
        } else {
          console.log('⚠️ Content generation requested but no framework available yet')
          // Add a message suggesting to build strategy first
          responseText += `\n\nI can help generate that content, but we should develop a strategic framework first. Let's discuss your campaign goals and positioning.`
        }
      }
    }

    // Add strategic question if concept is incomplete
    let enhancedResponse = responseText
    if (conceptState.stage !== 'ready') {
      const nextQuestion = getNextStrategicQuestion(conceptState)
      if (!responseText.includes('?')) {
        enhancedResponse += `\n\n${nextQuestion}`
      }
    }

    // Return standard response for non-strategic queries
    return new Response(
      JSON.stringify({
        success: true,
        type: 'intelligence-response',
        message: enhancedResponse,
        structured: structuredContent,
        queryType: queryType,
        persona: {
          title: persona.title,
          module: context.activeModule || 'intelligence',
          approach: persona.approach
        },
        conceptState: {
          stage: conceptState.stage,
          confidence: conceptState.confidence,
          concept: conceptState.concept,
          readyForOrchestration: conceptState.stage === 'ready'
        },
        hasIntelligence: toolResults.intelligencePipeline?.articles?.length > 0 || toolResults.fireplexityData?.length > 0 || false,
        sessionId: sessionId,
        conversationId: conversationId
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (error) {
    console.error('❌ NIV Error:', error)
    console.error('❌ Error stack:', error.stack)

    // Provide more specific error information
    let errorMessage = 'Internal server error'
    let errorDetails = null

    if (error.message) {
      errorMessage = error.message
    }

    if (error.name === 'TypeError') {
      errorDetails = 'Type error - check data types and object properties'
    } else if (error.message?.includes('database') || error.message?.includes('supabase')) {
      errorDetails = 'Database connection or query error'
    } else if (error.message?.includes('fetch') || error.message?.includes('network')) {
      errorDetails = 'Network or external service error'
    }

    const errorResponse = {
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      ...(errorDetails && { details: errorDetails })
    }

    return new Response(
      JSON.stringify(errorResponse),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
});
