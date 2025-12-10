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

  return `MONITORING DATE: ${new Date().toISOString().split('T')[0]}

ORGANIZATION: ${organizationName}
INDUSTRY: ${organizationProfile.industry}
KEY COMPETITORS: ${discoveryTargets.competitors.slice(0, 10).join(', ')}

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
- "Major industry shift in your space" → "Expert Commentary from the organization's actual expertise areas"
- "CEO of Partner changes" → "Relationship Continuity + Expanded Partnership Announcement"
- "3 competitors all struggling with X" → "Industry-Wide Problem We Solved: Here's How"
- "Trending topic on social" → "Real-Time Commentary + Unique Data Point + Viral Hook"

🚨 **FORBIDDEN POSITIONING** 🚨
DO NOT position the organization as having expertise or capabilities they don't have:
- If they are NOT an AI/ML company (not listed in core_offerings), do NOT suggest AI thought leadership
- If they are NOT a technology company, do NOT suggest technology infrastructure claims
- If they are a SERVICE company (agency, consulting, etc.), focus on: client work, case studies, industry insight, methodology
- If they are a PRODUCT company, focus on: product features, user outcomes, roadmap
- NEVER claim the organization "built" or "has" technology/AI unless it's explicitly in their profile
- For marketing/advertising agencies: focus on creative, strategy, platform expertise, campaign results - NOT technical infrastructure

For EACH opportunity you detect, you must provide:

1. STRATEGIC CONTEXT
   - What specific events triggered this opportunity
   - Why this is strategically valuable right now
   - What advantage we can gain
   - How long the window is open

2. COMPLETE EXECUTION PLAN
   - Identify 2-4 key stakeholder groups to influence
   - For EACH stakeholder, design a multi-piece content campaign
   - Provide detailed briefs for EACH content piece

3. Content types you can recommend (platform can create these):
   - media_pitch: Pitches to journalists/outlets
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
      "risk_if_missed": "Competitors will fill the narrative void. Opportunity to differentiate on security lost for months."
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
5. Content briefs must be SPECIFIC and ACTIONABLE
6. Reference SPECIFIC events from the data provided
7. Map 80% of content to competitor/market events (not internal)
8. Be realistic about time windows and execution effort
9. Score opportunities: impact (40%) + time sensitivity (30%) + feasibility (30%)

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
