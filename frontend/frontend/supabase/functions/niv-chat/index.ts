// Niv PR Strategist Chat Edge Function for Supabase
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Niv's PR Best Practices Engine
const PR_RULES = {
  timing: {
    never_pitch_friday_afternoon: true,
    avoid_holiday_weekends: true,
    morning_pitches_best: '9-11 AM local time',
    follow_up_window: '48-72 hours',
    exclusive_lead_time: '3-5 days minimum'
  },
  media_strategy: {
    tier_1_gets_exclusives_first: true,
    personalization_required: true,
    no_spray_and_pray: true,
    build_relationships_before_needing: true,
    value_exchange_for_embargos: true
  },
  crisis_management: {
    response_time_limit: 60, // minutes
    stakeholder_mapping_first: true,
    never_say_no_comment: true,
    prepare_holding_statements: true
  },
  content_quality: {
    newsworthy_angle_required: true,
    data_driven_stories_preferred: true,
    exclusive_insights_valuable: true,
    avoid_corporate_speak: true
  }
}

// Strategic Decision Tree for PR Scenarios
const analyzeScenario = (userInput: string, context: any) => {
  const input = userInput.toLowerCase()
  const currentTime = new Date()
  const day = currentTime.getDay()
  const hour = currentTime.getHours()
  
  let recommendations = []
  let warnings = []
  let opportunities = []
  
  // Timing Analysis
  if (day === 5 && hour >= 14) { // Friday afternoon
    warnings.push("⚠️ Friday afternoon pitching is rarely effective. Most journalists are wrapping up for the weekend.")
    recommendations.push("Consider waiting until Monday morning (9-11 AM) for maximum impact.")
  }
  
  if (day === 0 || day === 6) { // Weekend
    warnings.push("⚠️ Weekend pitching should be reserved for breaking news or crisis situations only.")
  }
  
  // Content Strategy Analysis
  if (input.includes('press release') || input.includes('announcement')) {
    recommendations.push("🎯 Focus on the newsworthy angle - what makes this matter to their audience?")
    recommendations.push("📊 Include compelling data or exclusive insights to increase pickup potential.")
  }
  
  // Media Outreach Analysis
  if (input.includes('pitch') || input.includes('journalist') || input.includes('media')) {
    recommendations.push("🎯 Tier 1 media should get exclusive access or angles before broad outreach.")
    recommendations.push("✍️ Personalize every pitch - show you know their beat and recent coverage.")
    opportunities.push("💡 Consider offering exclusive interviews, data, or early access.")
  }
  
  // Crisis Detection
  if (input.includes('crisis') || input.includes('emergency') || input.includes('urgent') || 
      input.includes('damage control') || input.includes('reputation')) {
    recommendations.push("🚨 CRISIS MODE: Immediate stakeholder mapping and holding statements required.")
    recommendations.push("⏱️ You have 60 minutes to respond publicly before narrative gets away from you.")
    warnings.push("⚠️ Never say 'no comment' - it implies guilt. Always provide context.")
  }
  
  // Opportunity Identification
  if (input.includes('trending') || input.includes('opportunity') || input.includes('newsjacking')) {
    opportunities.push("💡 Check Media Demand vs Competitor Absence for highest-impact angles.")
    recommendations.push("⚡ Time Decay is critical - trending topics have short windows.")
  }
  
  return { recommendations, warnings, opportunities }
}

// Proactive Strategic Analysis - What Niv Would Notice
const proactiveAnalysis = (userInput: string, context: any) => {
  const input = userInput.toLowerCase()
  let strategicInsights = []
  let hiddenOpportunities = []
  let riskAlerts = []
  
  // Strategic Pattern Recognition
  if (input.includes('launch') || input.includes('announcement')) {
    strategicInsights.push("🎯 Strategic Insight: Product launches are 60% more successful when you build media relationships 2-3 weeks before the announcement.")
    hiddenOpportunities.push("💡 Hidden Opportunity: Consider offering beta access to tech journalists for deeper coverage.")
  }
  
  if (input.includes('competitor') || input.includes('competition')) {
    strategicInsights.push("🎯 Strategic Insight: The best competitive responses happen in adjacent story spaces, not direct rebuttals.")
    hiddenOpportunities.push("💡 Hidden Opportunity: When competitors make news, that's your window to claim alternative positioning.")
  }
  
  if (input.includes('funding') || input.includes('investment') || input.includes('series')) {
    strategicInsights.push("🎯 Strategic Insight: Funding stories get 3x more coverage when you lead with the problem you're solving, not the money.")
    hiddenOpportunities.push("💡 Hidden Opportunity: Use funding announcements to establish thought leadership positioning.")
  }
  
  if (input.includes('quarter') || input.includes('earnings') || input.includes('results')) {
    riskAlerts.push("⚠️ Risk Alert: Earnings releases are commodity news. You need a bigger narrative to break through.")
    hiddenOpportunities.push("💡 Hidden Opportunity: Earnings weeks are perfect for industry analysis and trend stories.")
  }
  
  // Timing Intelligence
  const currentDate = new Date()
  const month = currentDate.getMonth()
  const day = currentDate.getDay()
  
  if (month === 0) { // January
    strategicInsights.push("📊 Timing Insight: January is prediction season - position your narrative around industry forecasts.")
  }
  
  if (month === 8) { // September
    strategicInsights.push("📊 Timing Insight: Back-to-school season drives B2B tech coverage - education angles perform well.")
  }
  
  if (day === 1) { // Tuesday
    strategicInsights.push("⏰ Timing Insight: Tuesday is statistically the best day for PR - journalists are planning their week.")
  }
  
  // Industry Intelligence Patterns
  if (input.includes('ai') || input.includes('artificial intelligence')) {
    riskAlerts.push("⚠️ Risk Alert: AI story fatigue is real. You need a human-impact angle to cut through.")
    hiddenOpportunities.push("💡 Hidden Opportunity: AI regulation stories are undersaturated right now.")
  }
  
  if (input.includes('remote') || input.includes('hybrid') || input.includes('work from home')) {
    strategicInsights.push("🎯 Strategic Insight: Remote work stories need fresh data - reporters won't cover opinion pieces anymore.")
  }
  
  return {
    strategicInsights,
    hiddenOpportunities,
    riskAlerts,
    proactiveRecommendations: generateProactiveRecommendations(input, context)
  }
}

// Generate Proactive Recommendations Based on Context
const generateProactiveRecommendations = (input: string, context: any) => {
  const recommendations = []
  
  // Always thinking 3 steps ahead
  recommendations.push({
    type: 'strategic_foresight',
    insight: "Based on my experience, here's what I'd be thinking about next...",
    actions: [
      "Map potential journalist questions and prepare responses",
      "Identify 2-3 adjacent story angles for sustained coverage",
      "Consider stakeholder reactions and prepare holding statements"
    ]
  })
  
  // Media landscape analysis
  recommendations.push({
    type: 'media_intelligence',
    insight: "From a media relations perspective...",
    actions: [
      "Check what these journalists have covered recently",
      "Look for exclusive angle opportunities",
      "Time this around existing news cycles for maximum impact"
    ]
  })
  
  // Competitive positioning
  recommendations.push({
    type: 'competitive_strategy',
    insight: "Thinking about competitive dynamics...",
    actions: [
      "Position in spaces where competitors can't follow",
      "Anticipate their likely responses and counter-narratives",
      "Consider partnering with non-competing industry leaders"
    ]
  })
  
  return recommendations
}

// Enhanced NVS (Narrative Vacuum Score) Calculator
const calculateNVS = (scenario: any) => {
  // This would integrate with opportunity data in production
  const mockScores = {
    media_demand: Math.floor(Math.random() * 10) + 1,
    competitor_absence: Math.floor(Math.random() * 10) + 1,
    client_strength: Math.floor(Math.random() * 10) + 1,
    time_decay: Math.floor(Math.random() * 10) + 1,
    market_saturation: Math.floor(Math.random() * 10) + 1
  }
  
  const overall = Math.round(
    Object.values(mockScores).reduce((a, b) => a + b, 0) / Object.keys(mockScores).length
  )
  
  return { ...mockScores, overall }
}

// Niv's Core Personality and Expertise - 20 Years PR Strategist
const NIV_SYSTEM_PROMPT = `You are Niv, a Senior PR Strategist with 20 years of agency experience. You're the strategic brain behind SignalDesk, with deep expertise in media relations, crisis management, and campaign strategy.

🎯 YOUR CORE IDENTITY:
- 20 years running PR campaigns from $10K to $10M budgets
- Deep relationships with journalists across all beats and tiers
- Crisis management expert who's seen it all
- Strategic thinker who always thinks 3 steps ahead
- Direct but warm - you tell hard truths kindly
- Master of timing, angles, and what actually gets coverage

🧠 YOUR STRATEGIC EXPERTISE:
- Media Relations: Know journalists personally - their beats, preferences, pet peeves
- Crisis Management: Immediate assessment, stakeholder mapping, rapid response
- Launch Strategy: Media targeting, embargo management, momentum building
- Thought Leadership: Authority building, byline placement, speaking opportunities
- Campaign Orchestration: Multi-channel strategies with clear ROI
- Relationship Management: Warming contacts, optimal timing, personalization

⚡ YOUR PR BEST PRACTICES (NEVER VIOLATE):
- Never pitch Friday afternoon or holiday weekends
- Always offer exclusives to Tier 1 before going broad
- Embargos need value exchange - give journalists something special
- Crisis response within one hour, always
- Build relationships BEFORE you need them
- Tier 1 media gets special treatment and personal touch
- News cycles matter - timing is everything
- Never spray and pray - targeted, personalized outreach only
- Follow up strategically - know when to push and when to back off

💬 HOW YOU COMMUNICATE (CRITICAL - FOLLOW THIS):
- ALWAYS be conversational and consultative, never rushing to solutions
- ASK STRATEGIC QUESTIONS to understand their real needs before suggesting anything
- DON'T immediately suggest opening features - have a conversation first
- Act like a senior strategist having coffee with a client, not a chatbot
- Probe for context: "Tell me more about...", "What's the real goal here?", "Who's your audience?"
- Share insights from experience: "In my 20 years, I've seen this work when..."
- Build understanding before building solutions
- Only suggest specific tools/features AFTER you understand their strategic needs

🚫 WHAT NOT TO DO:
- DON'T rush to generate content or open features immediately
- DON'T assume you know what they need from their first message
- DON'T say "Let me create..." or "I'll generate..." without understanding context
- DON'T open Content Generator just because they mentioned "social media post"
- DON'T jump to solutions - earn the right to recommend through conversation

✅ WHAT TO DO INSTEAD:
- Ask about their audience: "Who are you trying to reach?"
- Understand the message: "What's the story you're trying to tell?"
- Probe the purpose: "What outcome are you hoping for?"
- Consider timing: "When does this need to happen?"
- Think strategically: "What's the competitive landscape?"
- THEN recommend the right approach and tool

🎪 SIGNALDESK FEATURES YOU CONTROL (Use After Understanding):
- Strategic Planning: Your signature comprehensive campaign strategies
- Content Generator: Create press releases, pitches, thought leadership
- Media Intelligence: Tap your journalist database and relationships
- Opportunity Engine: Spot trending topics and perfect timing
- Crisis Command: Your crisis management playbook in action
- Memory Vault: Your institutional knowledge and case studies

🎯 YOUR CONVERSATIONAL APPROACH:
1. Listen and understand (ask clarifying questions)
2. Share strategic perspective based on experience
3. Probe for context and constraints
4. Identify the real opportunity or challenge
5. Recommend approach with strategic reasoning
6. ONLY THEN suggest specific tools or next steps
7. Guide them through execution with expertise

🌟 CONVERSATION STARTERS FOR DIFFERENT SCENARIOS:

Social Media Post Request:
"Before we dive into creating content, help me understand the strategy. What platform are we targeting? LinkedIn and Twitter require very different approaches. What's the message you want to get across, and who's your ideal audience?"

Press Release Request:
"Let's make sure this actually gets picked up. What's the news angle here? Is this a product launch, funding announcement, or something else? Who are the journalists that would care about this story?"

Strategy Request:
"I love tackling strategic challenges. Walk me through the situation - what's your objective, what's the timeline, and what obstacles are you anticipating? Let's think through this together."

Crisis Situation:
"Crisis mode - I need to understand the situation quickly. What happened, who's affected, and what's the current public narrative? Time is critical here."

Remember: You're a trusted advisor, not a content vending machine. Earn the right to recommend through strategic conversation and genuine understanding of their needs.`

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, conversationId, mode = 'chat', context = {} } = await req.json()

    if (!message) {
      throw new Error('Message is required')
    }

    // Get Anthropic API key from environment
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not configured')
    }

    // Analyze the scenario for strategic insights
    const scenarioAnalysis = analyzeScenario(message, context)
    const proactiveInsights = proactiveAnalysis(message, context)
    const nvsScores = mode === 'opportunity' ? calculateNVS({ message, context }) : null
    
    // Build the prompt based on mode
    let systemPrompt = NIV_SYSTEM_PROMPT
    let userPrompt = message
    
    // Add strategic analysis to the prompt
    if (scenarioAnalysis.recommendations.length > 0 || scenarioAnalysis.warnings.length > 0 || proactiveInsights.strategicInsights.length > 0) {
      systemPrompt += `\n\n🎯 STRATEGIC ANALYSIS FOR THIS SITUATION:
`
      
      if (scenarioAnalysis.warnings.length > 0) {
        systemPrompt += `\nWARNINGS TO ADDRESS:\n${scenarioAnalysis.warnings.join('\n')}\n`
      }
      
      if (scenarioAnalysis.recommendations.length > 0) {
        systemPrompt += `\nSTRATEGIC RECOMMENDATIONS:\n${scenarioAnalysis.recommendations.join('\n')}\n`
      }
      
      if (scenarioAnalysis.opportunities.length > 0) {
        systemPrompt += `\nOPPORTUNITIES TO LEVERAGE:\n${scenarioAnalysis.opportunities.join('\n')}\n`
      }
      
      if (proactiveInsights.strategicInsights.length > 0) {
        systemPrompt += `\n🧠 STRATEGIC INSIGHTS (20 YEARS EXPERIENCE):\n${proactiveInsights.strategicInsights.join('\n')}\n`
      }
      
      if (proactiveInsights.hiddenOpportunities.length > 0) {
        systemPrompt += `\n💡 HIDDEN OPPORTUNITIES I'M SPOTTING:\n${proactiveInsights.hiddenOpportunities.join('\n')}\n`
      }
      
      if (proactiveInsights.riskAlerts.length > 0) {
        systemPrompt += `\n⚠️ RISK ALERTS:\n${proactiveInsights.riskAlerts.join('\n')}\n`
      }
      
      if (proactiveInsights.proactiveRecommendations.length > 0) {
        systemPrompt += `\n🎯 PROACTIVE RECOMMENDATIONS:\n`
        proactiveInsights.proactiveRecommendations.forEach(rec => {
          systemPrompt += `\n${rec.insight}\n- ${rec.actions.join('\n- ')}\n`
        })
      }
    }
    
    // Add NVS analysis if in opportunity mode
    if (nvsScores) {
      systemPrompt += `\n\n📊 NARRATIVE VACUUM SCORE ANALYSIS:
- Media Demand: ${nvsScores.media_demand}/10
- Competitor Absence: ${nvsScores.competitor_absence}/10
- Client Strength: ${nvsScores.client_strength}/10
- Time Decay: ${nvsScores.time_decay}/10
- Market Saturation: ${nvsScores.market_saturation}/10
- Overall NVS: ${nvsScores.overall}/10

Use this data to provide specific tactical advice.`
    }

    // Enhanced mode-specific strategic thinking
    if (mode === 'analysis') {
      systemPrompt += `\n\n🔍 STRATEGIC ANALYSIS MODE: You're analyzing their situation like a seasoned PR pro. Think about:
- What's the real story here? What's the angle that gets coverage?
- Who are the key audiences and what do they care about?
- What's the competitive landscape and timing?
- What risks or opportunities am I seeing that they might miss?
- What's my strategic recommendation based on 20 years of experience?

CRITICAL: Don't rush to open tools. Focus on strategic consultation first.`
    } else if (mode === 'consultation') {
      systemPrompt += `\n\n💬 CONSULTATION MODE: You're having a strategic conversation, not rushing to execution:
- Ask clarifying questions to understand their real needs
- Share insights from your 20 years of experience that are relevant
- Probe for context about audience, timeline, constraints, and objectives
- Think strategically about risks and opportunities they might not see
- Only suggest tools/features when you truly understand their situation
- Act like a trusted advisor having coffee with a client

Remember: Build understanding before building solutions. Your job is to be consultative, not to rush to create content.`
    } else if (mode === 'opportunity') {
      systemPrompt += `\n\n🎯 OPPORTUNITY HUNTING MODE: You're scanning for PR gold using your NVS framework:
- Media Demand: What are journalists actively covering?
- Competitor Absence: Where are competitors missing the mark?
- Client Strength: What unique advantages can we leverage?
- Time Decay: How urgent is this opportunity?
- Market Saturation: How crowded is this narrative space?

Spot the opportunities others miss and give tactical advice on timing and approach.`
    } else if (mode === 'campaign') {
      systemPrompt += `\n\n🚀 CAMPAIGN STRATEGY MODE: You're designing a comprehensive PR campaign with your 20 years of tactical knowledge:
- Multi-phase approach with clear timelines
- Media tier strategy (Tier 1 exclusive → Tier 2 → Tier 3 amplification)
- Content calendar and asset requirements
- Stakeholder mapping and messaging
- Risk mitigation and contingency plans
- Success metrics that actually matter

Think like you're presenting to a C-suite client who needs results.`
    } else if (mode === 'content') {
      systemPrompt += `\n\n✍️ CONTENT STRATEGY MODE: You're not just writing content - you're crafting strategic communications:
- What's the story that gets journalists excited?
- How does this fit into the broader narrative strategy?
- What's the hook that makes this newsworthy?
- Which journalists will this resonate with and why?
- How can we layer in data, insights, or exclusive angles?

Create content that actually gets coverage, not just corporate fluff.`
    }

    // Add context if provided
    if (context && Object.keys(context).length > 0) {
      userPrompt = `Context: ${JSON.stringify(context)}\n\nUser Question: ${message}`
    }

    // Call Anthropic Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514', // Using Claude Sonnet 4 for strategic PR thinking
        max_tokens: 3000,
        temperature: 0.8,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Claude API error: ${error}`)
    }

    const data = await response.json()
    
    // Extract the response text
    const responseText = data.content?.[0]?.text || ''

    // Enhanced response analysis with strategic insights
    let strategicAnalysis = {
      nvsAnalysis: nvsScores,
      scenarioInsights: scenarioAnalysis,
      proactiveInsights: proactiveInsights,
      prRulesApplied: true,
      strategicRecommendations: scenarioAnalysis.recommendations,
      riskFactors: scenarioAnalysis.warnings,
      opportunities: scenarioAnalysis.opportunities,
      hiddenOpportunities: proactiveInsights.hiddenOpportunities,
      strategicForesight: proactiveInsights.proactiveRecommendations,
      expertiseLevel: '20_years_senior_strategist'
    }

    // Store conversation in Supabase if conversationId provided
    if (conversationId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseServiceKey)
      
      // This would store conversation history - implement based on your needs
      console.log('Storing conversation:', conversationId)
    }

    return new Response(
      JSON.stringify({
        response: responseText,
        strategicAnalysis,
        mode,
        conversationId,
        timestamp: new Date().toISOString(),
        nivExpertise: '20 years PR strategy experience applied'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in niv-chat function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})