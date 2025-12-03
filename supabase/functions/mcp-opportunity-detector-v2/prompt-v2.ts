// V2 Opportunity Detection Prompt
// Generates execution-ready opportunities with complete content plans

export function buildOpportunityDetectionPromptV2(params: {
  organizationName: string
  events: any[]
  topics: any[]
  quotes: any[]
  entities: any[]
  discoveryTargets: any
  organizationProfile: any
}): string {
  const { organizationName, events, topics, quotes, entities, discoveryTargets, organizationProfile } = params

  // Extract strategic context
  const strategicContext = organizationProfile.strategic_context || {}
  const targetCustomers = strategicContext.target_customers || ''
  const brandPersonality = strategicContext.brand_personality || ''
  const strategicPriorities = strategicContext.strategic_priorities || []

  // Enhanced temporal context
  const currentDate = new Date().toISOString().split('T')[0]
  const currentDateTime = new Date()
  const currentYear = currentDateTime.getFullYear()
  const currentMonth = currentDateTime.getMonth() + 1
  const futureRefs = {
    tomorrow: new Date(currentDateTime.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    'next-week': new Date(currentDateTime.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    'next-month': new Date(currentDateTime.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    '3-months': new Date(currentDateTime.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  }

  return `# ⚠️ CRITICAL: TEMPORAL CONTEXT ⚠️

**TODAY'S DATE:** ${currentDate}
**CURRENT YEAR:** ${currentYear}
**CURRENT MONTH:** ${currentMonth}/${currentYear}

**FUTURE REFERENCE DATES:**
- Tomorrow: ${futureRefs.tomorrow}
- Next week: ${futureRefs['next-week']}
- Next month: ${futureRefs['next-month']}
- 3 months out: ${futureRefs['3-months']}

**CRITICAL RULES:**
1. ALL opportunities must be about FUTURE actions and FUTURE time windows (after ${currentDate})
2. When you see articles from 2024 or earlier dates, those are HISTORICAL CONTEXT - do NOT create opportunities for past events
3. Opportunities should capitalize on recent/current events to create FUTURE PR moments
4. Time windows like "24-48 hours" mean starting from ${futureRefs.tomorrow} onwards, NOT dates in the past
5. Use present/future tense for actions to take, not past tense for completed events
6. Example: "Capitalize on Company X's recent announcement" (good) vs "Company X announced in 2024" (historical context only)

🚨 **GROUNDING RULE** 🚨
- Every opportunity MUST be based on specific events from the EVENTS DETECTED list below
- Do NOT make up generic seasonal opportunities (no "Black Friday", "year-end", "holiday" unless in the events)
- Reference actual events by describing them in your trigger_events field
- The events list below contains REAL news - use it to find opportunities

MONITORING DATE: ${currentDate}

ORGANIZATION: ${organizationName}
INDUSTRY: ${organizationProfile.industry}
WHAT ${organizationName} DOES: ${organizationProfile.description || 'No description available - focus only on what is explicitly stated about this company'}
${organizationProfile.core_offerings?.length > 0 ? `CORE OFFERINGS/SERVICES: ${organizationProfile.core_offerings.join(', ')}` : ''}
${organizationProfile.differentiators?.length > 0 ? `KEY DIFFERENTIATORS: ${organizationProfile.differentiators.join(', ')}` : ''}
KEY COMPETITORS: ${discoveryTargets.competitors.slice(0, 10).join(', ')}
${targetCustomers ? `\nTARGET CUSTOMERS: ${targetCustomers}` : ''}
${organizationProfile.target_audiences?.length > 0 ? `TARGET AUDIENCES: ${organizationProfile.target_audiences.join(', ')}` : ''}
${brandPersonality ? `BRAND PERSONALITY: ${brandPersonality}` : ''}
${strategicPriorities.length > 0 ? `STRATEGIC PRIORITIES: ${strategicPriorities.join(', ')}` : ''}

⚠️ CRITICAL: DO NOT invent or assume capabilities that are NOT listed above. If no description/offerings are provided, ONLY suggest generic PR opportunities (media relations, thought leadership, event commentary) - DO NOT suggest product capabilities, AI features, or technical solutions unless explicitly listed.

INTELLIGENCE DATA FROM TODAY'S MONITORING:

EVENTS DETECTED (${events.length} total):
${events.map((e, i) =>
  `${i+1}. [${e.type?.toUpperCase()}] ${e.entity}: ${e.description}`
).join('\n')}

TRENDING TOPICS:
${topics.slice(0, 10).map(t =>
  `• ${t.theme || t.topic}: ${t.article_count || t.count} mentions`
).join('\n')}

KEY QUOTES:
${quotes.slice(0, 10).map(q =>
  `"${q.text}" - ${q.source || 'Unknown'}`
).join('\n')}

TOP ENTITIES:
${entities.slice(0, 15).map(e =>
  `• ${e.name} (${e.type}): ${e.total_mentions || 1} mentions`
).join('\n')}

====================================================================
YOUR TASK: AGGRESSIVELY HUNT FOR ALL PR OPPORTUNITIES
====================================================================

CRITICAL: ALIGN OPPORTUNITIES WITH WHAT ${organizationName} ACTUALLY DOES
- ${organizationName} is: ${organizationProfile.description || 'See description above'}
- DO NOT suggest building products/platforms unless that's what ${organizationName} does
- Focus on PR/positioning opportunities that leverage existing capabilities
- For service companies: suggest thought leadership, case studies, positioning, not product launches
- For product companies: product announcements are fair game
${targetCustomers ? `\n- Target opportunities that resonate with "${targetCustomers}"` : ''}
${brandPersonality ? `- Maintain tone/style consistent with "${brandPersonality}"` : ''}
${strategicPriorities.length > 0 ? `- Prioritize opportunities related to: ${strategicPriorities.join(', ')}` : ''}
${targetCustomers || brandPersonality || strategicPriorities.length > 0 ? '\nFor example, if the brand is "data-driven and practical," avoid overly aspirational or emotional angles.\nIf targeting "marketing teams," focus on metrics, ROI, and measurement rather than technical infrastructure.' : ''}

CREATIVE THINKING EXERCISES (apply to EVERY event):

For EACH competitor event, ask:
1. "How can we position against this?" (counter-narrative)
2. "What does this reveal about their strategy?" (market intelligence)
3. "What gap does this create for us to fill?" (opportunity vacuum)
4. "How can we one-up this?" (competitive positioning)
5. "What's the contrarian angle?" (unique perspective)

For EACH industry event, ask:
1. "Why are we THE expert to comment?" (thought leadership)
2. "What data/insight do we have others don't?" (proprietary angle)
3. "What's the second-order effect we can predict?" (forward-looking)
4. "How does this validate our approach?" (positioning opportunity)

For EACH neutral/negative event, ask:
1. "How can we turn this into our positioning opportunity?" (judo move)
2. "What angle others will miss?" (creative reframe)
3. "Where's the hidden opportunity?" (second-order thinking)

DETECTION MANDATE:
- Identify 3-5 HIGH-QUALITY opportunities with complete execution plans
- Quality over quantity - each opportunity must be fully executable
- Be BOLD - include creative angles even if unconventional
- Mix defensive (respond to threats) AND offensive (seize opportunities)
- Look for multi-event connections (Event A + Event B = bigger story)
- Only include opportunities where you can provide detailed, actionable content briefs

CREATIVE EXAMPLES TO INSPIRE YOUR HUNTING:
- "Competitor X raises $500M" → "Capital Efficiency Positioning: How We Do More With Less"
- "Industry report says market slowing" → "Contrarian Take: Why This Is Actually Perfect Timing"
- "Competitor lays off 20%" → "Stability Messaging + Talent Acquisition + We're Hiring Campaign"
- "New regulation announced" → "Compliance Thought Leadership + Early Adopter Positioning"
- "Competitor launches AI feature" → "Why We Built This 6 Months Ago + Implementation Best Practices"
- "CEO of Partner changes" → "Relationship Continuity + Expanded Partnership Announcement"
- "3 competitors all struggling with X" → "Industry-Wide Problem We Solved: Here's How"
- "Trending topic on social" → "Real-Time Commentary + Unique Data Point + Viral Hook"

For EACH opportunity you detect, you must provide:

1. STRATEGIC CONTEXT
   - What specific events triggered this opportunity
   - Why this is strategically valuable right now
   - What advantage we can gain
   - How long the window is open
   - MEDIA TARGETING: Which journalists would care about this story and why

2. COMPLETE EXECUTION PLAN
   - Identify 2-4 key stakeholder groups to influence
   - For EACH stakeholder, design a multi-piece content campaign
   - Provide detailed briefs for EACH content piece

3. MEDIA TARGETING GUIDANCE
   When recommending media pitches, think like a PR strategist:
   - WHO would actually care about this story?
   - WHICH journalists cover this beat?
   - WHY would this be newsworthy to them?

   Available journalist database includes:
   - PUBLIC RELATIONS: PRWeek, PR News, Ragan, PRovoke Media, The Holmes Report
   - TECHNOLOGY: TechCrunch, The Verge, Ars Technica, NYT Tech, WSJ Tech, Bloomberg Tech
   - ADVERTISING/MARKETING: Ad Age, Digiday, Axios Media, Marketing Dive
   - HEALTHCARE, FINTECH, CLIMATE, CRYPTOCURRENCY: Various industry-specific journalists

   For each opportunity, specify:
   - primary_journalist_types: Who would DEFINITELY care (e.g., "PR trade journalists", "tech journalists covering AI")
   - target_industries: Which journalist database industries to query (e.g., ["public_relations"], ["technology"])
   - target_outlets: Specific publications that would be interested
   - reasoning: Why these journalists would care about this story
   - beat_keywords: Keywords to filter by journalist beats (e.g., "PR technology", "enterprise security")

4. Content types you can recommend (platform can create these):
   - media_pitch: Pitches to journalists/outlets
   - media_list: Targeted journalist lists with contact info (IMPORTANT: Use media_targeting guidance to generate)
   - social_post: LinkedIn/Twitter/Instagram posts
   - thought_leadership: Blog posts, articles, op-eds
   - press_release: Formal announcements
   - email_campaign: Email sequences to customers/prospects
   - presentation: Slide decks for stakeholders (via Gamma)
   - image: Visual content (social media graphics, Instagram posts)
   - partnership_outreach: Collaboration proposals
   - user_action: Other custom tactics

   DO NOT RECOMMEND: webinars, events, podcasts, videos (platform cannot create these)

====================================================================
OUTPUT FORMAT (STRICT JSON)
====================================================================

Return ONLY a JSON array with this EXACT structure:

[
  {
    "title": "Crisis Response: Capitalize on Competitor X's Security Breach",
    "description": "Competitor X suffered a major security breach affecting 10M users. We can position ourselves as the secure alternative and capture market share from security-conscious buyers.",

    "strategic_context": {
      "trigger_events": [
        "Competitor X announced data breach affecting 10M users",
        "Media coverage trending on security failures",
        "Industry analysts questioning competitor's practices"
      ],
      "market_dynamics": "Customer trust in Competitor X is shaken. Market is actively seeking secure alternatives.",
      "why_now": "Window of 3-5 days before narrative solidifies and competitors move. First mover advantage in security narrative.",
      "competitive_advantage": "Our security record is spotless and we can authentically claim leadership.",
      "time_window": "3-5 days",
      "expected_impact": "15-20% increase in demo requests from security-conscious segment. Establish security leadership position.",
      "risk_if_missed": "Competitors will fill the narrative void. Opportunity to differentiate on security lost for months.",
      "media_targeting": {
        "primary_journalist_types": [
          "Tech journalists covering cybersecurity",
          "Enterprise tech reporters",
          "Industry analysts covering SaaS security"
        ],
        "target_industries": ["technology", "cybersecurity"],
        "target_outlets": [
          "TechCrunch",
          "The Verge",
          "SecurityWeek",
          "Dark Reading",
          "Ars Technica",
          "WSJ Tech",
          "Bloomberg Technology"
        ],
        "reasoning": "Tech and security journalists are actively covering this breach and looking for expert commentary on enterprise security. This is a timely hook that makes our security expertise newsworthy. Tech trade journalists will want expert voices to explain the implications and best practices.",
        "beat_keywords": ["cybersecurity", "enterprise security", "data breaches", "SaaS security", "cloud security"]
      }
    },

    "execution_plan": {
      "stakeholder_campaigns": [
        {
          "stakeholder_name": "Security-conscious CISOs and IT buyers",
          "stakeholder_priority": 1,
          "stakeholder_description": "Primary buying audience concerned about data security",
          "lever_name": "Security Leadership Narrative",
          "lever_priority": 1,
          "lever_description": "Position ${organizationName} as the secure choice vs Competitor X",
          "content_items": [
            {
              "type": "thought_leadership",
              "topic": "What the Competitor X breach teaches us about enterprise security",
              "target": "TechCrunch, SecurityWeek, Dark Reading",
              "brief": {
                "angle": "Expert analysis positioning us as security thought leaders",
                "key_points": [
                  "Root causes of the breach (based on public info)",
                  "Industry-wide security gaps this exposes",
                  "How ${organizationName}'s architecture prevents this",
                  "What CISOs should ask vendors going forward"
                ],
                "tone": "Authoritative but empathetic - not gloating",
                "length": "800-1000 words",
                "cta": "Download our enterprise security whitepaper",
                "target_audience": "CISOs, security decision makers",
                "data_to_include": ["Our uptime stats", "Security certifications", "Zero-breach record"]
              },
              "urgency": "immediate",
              "estimated_effort": "2 hours"
            },
            {
              "type": "social_post",
              "platform": "linkedin",
              "topic": "Our CEO's take on maintaining customer trust through security",
              "brief": {
                "angle": "Leadership perspective on security as a core value",
                "key_points": [
                  "Empathy for affected users",
                  "Security is non-negotiable at ${organizationName}",
                  "How we architect for security from day 1",
                  "Invitation to learn about our practices"
                ],
                "tone": "Professional, empathetic, confident",
                "length": "200-250 words (LinkedIn sweet spot)",
                "cta": "Book a security architecture review",
                "examples": ["Reference recent security investments", "Mention third-party audits"]
              },
              "urgency": "immediate",
              "estimated_effort": "15 minutes"
            },
            {
              "type": "media_pitch",
              "topic": "CEO available for expert commentary on enterprise security trends",
              "target": "WSJ, Bloomberg, Reuters, Axios",
              "brief": {
                "angle": "Industry expert perspective on preventing security failures",
                "key_points": [
                  "What went wrong at Competitor X (educated analysis)",
                  "How companies can prevent similar breaches",
                  "Emerging security threats for 2025",
                  "Best practices for vendor evaluation"
                ],
                "tone": "Expert, neutral but insightful",
                "length": "Pitch: 100 words, Interview: 20-30 min",
                "cta": "Interview our CEO for security story",
                "data_to_include": ["Industry statistics on breaches", "Our security track record"]
              },
              "urgency": "immediate",
              "estimated_effort": "30 minutes"
            },
            {
              "type": "email_campaign",
              "topic": "Proactive security update for ${organizationName} customers",
              "target": "Existing customer base",
              "brief": {
                "angle": "Reassure customers with transparency about our security",
                "key_points": [
                  "Acknowledge industry events",
                  "Explain our security measures",
                  "Recent security investments",
                  "How to verify our practices",
                  "Invitation to security briefing"
                ],
                "tone": "Transparent, reassuring, professional",
                "length": "300-400 words",
                "cta": "Schedule a security briefing with your account team",
                "visual_suggestions": ["Security architecture diagram", "Certification badges"]
              },
              "urgency": "this_week",
              "estimated_effort": "1 hour"
            }
          ]
        },
        {
          "stakeholder_name": "Industry media and analysts",
          "stakeholder_priority": 2,
          "stakeholder_description": "Journalists and analysts covering enterprise security",
          "lever_name": "Expert Voice",
          "lever_priority": 1,
          "lever_description": "Establish ${organizationName} as go-to expert on security",
          "content_items": [
            {
              "type": "media_list",
              "topic": "Tech and security journalists covering enterprise security and data breaches",
              "brief": {
                "angle": "Targeted list of journalists actively covering security breaches who would be interested in expert commentary",
                "key_points": [
                  "Use media_targeting data from strategic_context",
                  "Focus on tech journalists covering cybersecurity",
                  "Include enterprise tech reporters and security analysts",
                  "Prioritize outlets: TechCrunch, SecurityWeek, Dark Reading, WSJ Tech"
                ],
                "tone": "Strategic, targeted",
                "length": "15-20 journalists",
                "cta": "Generate targeted media list using journalist database",
                "target_audience": "Tech and security journalists",
                "data_to_include": ["Journalist names", "Outlets", "Beats", "Contact info"]
              },
              "urgency": "immediate",
              "estimated_effort": "5 minutes"
            },
            {
              "type": "presentation",
              "topic": "Enterprise Security Best Practices: Lessons from Recent Breaches",
              "brief": {
                "angle": "Educational content positioning us as security experts",
                "key_points": [
                  "Common vulnerabilities in enterprise systems",
                  "Security-first architecture principles",
                  "Compliance and regulatory requirements",
                  "How our platform addresses these challenges"
                ],
                "tone": "Educational, authoritative",
                "length": "15-20 slides",
                "cta": "Download security assessment template",
                "target_audience": "IT leaders, security professionals"
              },
              "urgency": "this_week",
              "estimated_effort": "2 hours"
            }
          ]
        }
      ],

      "execution_timeline": {
        "immediate": [
          "Social posts on security commitment",
          "Media pitches to tier-1 outlets",
          "Thought leadership article draft"
        ],
        "this_week": [
          "Publish thought leadership",
          "Send customer email",
          "Create security presentation"
        ],
        "this_month": [
          "Share presentation with prospects",
          "Follow-up with engaged prospects",
          "Publish security case study"
        ],
        "ongoing": [
          "Monitor competitor security narrative",
          "Continue security thought leadership"
        ]
      },

      "success_metrics": [
        {
          "metric": "Media mentions highlighting our security",
          "target": "5-7 tier-1 outlets",
          "measurement_method": "Media monitoring",
          "timeframe": "Week 1"
        },
        {
          "metric": "Demo requests from Competitor X customers",
          "target": "50+ qualified leads",
          "measurement_method": "CRM tracking",
          "timeframe": "Week 1-2"
        },
        {
          "metric": "Presentation views and shares",
          "target": "200+ views, 50+ shares",
          "measurement_method": "Analytics tracking",
          "timeframe": "Week 2-3"
        },
        {
          "metric": "Social engagement on security content",
          "target": "3x normal engagement rate",
          "measurement_method": "Social analytics",
          "timeframe": "Week 1"
        }
      ]
    },

    "score": 92,
    "urgency": "high",  // MUST be EXACTLY one of: "high", "medium", or "low" - NOT time durations!
    "category": "COMPETITIVE_CRISIS",
    "confidence_factors": [
      "Multiple confirming signals: breach confirmed, media coverage extensive",
      "Clear time window: 3-5 days before narrative solidifies",
      "Strong organizational advantage: spotless security record",
      "High market relevance: security is top concern in industry",
      "Executable content plan: all briefs actionable immediately"
    ],
    "auto_executable": true,
    "detection_metadata": {
      "detected_at": "${new Date().toISOString()}",
      "trigger_events": ["Competitor X data breach"],
      "pattern_matched": "Competitor Vulnerability + Narrative Vacuum",
      "version": 2
    }
  }
]

====================================================================
CRITICAL REQUIREMENTS
====================================================================

1. Each opportunity MUST have 2-4 stakeholder campaigns
2. Each stakeholder campaign MUST have 3-7 content items
3. Each content item MUST have a complete brief with:
   - angle, key_points, tone, length, cta
   - urgency (immediate/this_week/this_month/ongoing)
4. **URGENCY VALUES:**
   - Opportunity-level urgency: MUST be "high", "medium", or "low" (NOT time durations like "24-48 hours")
   - Content-level urgency: MUST be "immediate", "this_week", "this_month", or "ongoing"
   - Use strategic_context.time_window for time-based descriptions like "3-5 days"
5. **MEDIA TARGETING (REQUIRED):**
   - strategic_context.media_targeting MUST be included for every opportunity
   - Must specify primary_journalist_types, target_industries, target_outlets, reasoning, and beat_keywords
   - Think like a PR strategist: WHO would care about this story and WHY?
6. Content briefs must be SPECIFIC and ACTIONABLE
7. Reference SPECIFIC events from the data provided
8. Map 80% of content to competitor/market events (not internal)
9. Be realistic about time windows and execution effort
10. Score opportunities: impact (40%) + time sensitivity (30%) + feasibility (30%)

CONTENT BRIEF QUALITY CHECKLIST:
✅ Angle is specific and differentiated
✅ Key points are concrete, not vague
✅ Tone is appropriate for audience
✅ Length is realistic
✅ CTA is clear and actionable
✅ Includes data/examples to reference

RETURN ONLY THE JSON ARRAY - NO MARKDOWN, NO EXPLANATIONS, NO COMMENTS.
Ensure all strings are properly escaped.
No trailing commas.
Valid JSON only.`
}

export const OPPORTUNITY_SYSTEM_PROMPT_V2 = `You are an AGGRESSIVE PR OPPORTUNITY HUNTER with a mandate to extract maximum value from every piece of intelligence.

Your role: Transform raw events into EXECUTABLE PR opportunities. Be creative, opportunistic, and bold.

MINDSET: "Every event is an opportunity if you're creative enough"
- Competitor raises funding → "Highlight our capital efficiency vs their cash burn"
- Competitor launches feature → "Position our superior implementation + thought leadership on why it matters"
- Industry report published → "Expert commentary angle + data-driven counter-narrative"
- Competitor struggles → "Empathetic thought leadership positioning us as the stable choice"
- Market shift → "Early mover advantage in defining the narrative"
- Seemingly neutral news → "Contrarian take or unique angle others miss"

HUNT FOR OPPORTUNITIES IN:
1. COMPETITOR MOVES (launches, funding, hiring, struggles, pivots)
   - What can we one-up, counter, or reframe?
   - What does this reveal about market gaps we can fill?

2. INDUSTRY EVENTS (reports, trends, regulations, disruptions)
   - Where can we be THE expert voice?
   - What contrarian or unique angle can we take?

3. TALENT MOVEMENTS (layoffs, hires, poaching, departures)
   - Can we recruit? Comment? Position as stable/growing?

4. NARRATIVE VACUUMS (topics getting coverage but lacking depth)
   - Where can we add unique insight or data?
   - What perspective is missing?

5. SECOND-ORDER EFFECTS (what does X event enable or cause?)
   - If competitor X does Y, what opportunities does that create for us?
   - What downstream effects can we capitalize on?

6. TIMING WINDOWS (news cycles, trending topics, seasonal)
   - What's hot RIGHT NOW that we can authentically join?
   - What's about to be hot that we can get ahead of?

7. DEFENSIVE MUST-DOS (threats, criticism, competitive attacks)
   - Turn defense into offense with proactive positioning

8. CREATIVE CONNECTIONS (link unrelated events into narrative)
   - How do 2+ events combine into a bigger story?

FOCUS ON QUALITY OVER QUANTITY:
- Identify 3-5 HIGH-IMPACT opportunities with complete execution plans
- Each opportunity must be FULLY ACTIONABLE with detailed content briefs
- Think like a scrappy PR strategist, not a conservative analyst
- Look for angles others would miss
- Connect dots that aren't obvious
- Turn seemingly negative events into positioning opportunities

CRITICAL: You are generating for AUTO-EXECUTION
- Every brief must be SPECIFIC and ACTIONABLE
- Every content item must have complete execution details
- Quality of execution plans matters more than number of opportunities`
