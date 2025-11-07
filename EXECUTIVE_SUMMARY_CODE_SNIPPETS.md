# Executive Summary Generation - Exact Code Snippets & References

## Main Synthesis Function Location
**File:** `/Users/jonathanliebowitz/Desktop/signaldesk-v3/supabase/functions/mcp-executive-synthesis/index.ts`

---

## 1. EVENT PRIORITIZATION - THE 80/20 RULE

### Code Location: Lines 410-463

**Step 1: Separate org events from competitor events (Lines 414-427)**

```typescript
// CRITICAL: Separate org vs market events
const orgName = organization?.name?.toLowerCase() || '';
const eventsAboutOrg = allEvents.filter(e => {
  const entityLower = e.entity?.toLowerCase() || '';
  return entityLower.includes(orgName) ||
         entityLower === orgName ||
         (orgName === 'openai' && entityLower.includes('openai')) ||
         (orgName === 'tesla' && entityLower.includes('tesla'));
});
const eventsAboutOthers = allEvents.filter(e => {
  const entityLower = e.entity?.toLowerCase() || '';
  return !entityLower.includes(orgName) &&
         !(orgName === 'openai' && entityLower.includes('openai')) &&
         !(orgName === 'tesla' && entityLower.includes('tesla'));
});
```

**Step 2: Apply 80/20 weighting (Lines 446-454)**

```typescript
// PRIORITIZE competitor/market events HEAVILY - 80/20 rule
const maxEvents = 50; // Increase to get more context
const competitorEventCount = Math.min(40, eventsAboutOthers.length); // Up to 40 competitor events
const orgEventCount = Math.min(10, eventsAboutOrg.length); // Max 10 org events

const topEvents = [
  ...eventsAboutOthers.slice(0, competitorEventCount),
  ...eventsAboutOrg.slice(0, orgEventCount)
];

console.log(`🎯 Selected ${topEvents.length} events for synthesis:`);
console.log(`  - ${competitorEventCount} competitor/market events`);
console.log(`  - ${orgEventCount} org context events`);
```

**Result:**
- Out of 50 total events: 40 are competitor/market (80%), 10 are org (20%)
- Competitors are weighted 4x more heavily in the executive summary

---

## 2. DISCOVERY TARGETS - WHO TO TRACK

### Code Location: Lines 223-301

**Database-Driven Target Loading:**

```typescript
// CRITICAL FIX: Load targets from intelligence_targets table instead of old profile
// This ensures we see stakeholders like Donald Trump who are marked high priority
if (organization_id) {
  console.log(`🎯 Loading intelligence targets from database for org: ${organization_id}`);
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data: intelligenceTargets } = await supabase
    .from('intelligence_targets')
    .select('*')
    .eq('organization_id', organization_id)
    .eq('active', true);

  if (intelligenceTargets && intelligenceTargets.length > 0) {
    discoveryTargets = {
      competitors: intelligenceTargets.filter(t => t.type === 'competitor').map(t => t.name),
      stakeholders: intelligenceTargets.filter(t => t.type === 'stakeholder' || t.type === 'influencer').map(t => t.name),
      topics: intelligenceTargets.filter(t => t.type === 'topic' || t.type === 'keyword').map(t => t.name)
    };
    console.log('✅ Loaded from intelligence_targets:', {
      competitors: discoveryTargets.competitors.length,
      stakeholders: discoveryTargets.stakeholders.length,
      topics: discoveryTargets.topics.length,
      stakeholder_names: discoveryTargets.stakeholders
    });
  }
}
```

**Fallback to Profile Structure (Lines 248-268):**

```typescript
discoveryTargets = {
  competitors: [
    ...(profile?.competition?.direct_competitors || []),
    ...(profile?.competition?.indirect_competitors || []),
    ...(profile?.competition?.emerging_threats || [])
  ].filter(Boolean),
  stakeholders: [
    ...(profile?.stakeholders?.regulators || []),
    ...(profile?.stakeholders?.key_analysts || []),  // NEW field
    ...(profile?.stakeholders?.activists || []),     // NEW field
    ...(profile?.stakeholders?.major_investors || []),
    ...(profile?.stakeholders?.major_customers || [])
  ].filter(Boolean),
  topics: [
    ...(profile?.trending?.hot_topics || []),
    ...(profile?.trending?.emerging_technologies || []),
    ...(profile?.keywords || []),
    ...(profile?.monitoring_config?.keywords || [])
  ].filter(Boolean) || []
};
```

---

## 3. SYSTEM PROMPT - BEHAVIOR INSTRUCTIONS

### Code Location: Lines 707-752

**Full System Prompt:**

```typescript
system: `You are a senior PR strategist receiving ENRICHED INTELLIGENCE DATA for ${organization?.name || 'a major corporation'}.

WHAT YOU ARE RECEIVING:
This is NOT raw data. You are receiving the OUTPUT of our intelligence pipeline:
1. We monitored hundreds of news sources today
2. Our AI filtered them for PR relevance
3. Our enrichment AI extracted and categorized events, entities, quotes, and metrics
4. This enriched data is YOUR ONLY SOURCE - it contains everything we found today

THE ENRICHED DATA STRUCTURE:
- EVENTS: Pre-extracted, categorized developments with DATES (crisis, product, partnership, etc.)
- ENTITIES: Companies, people, and organizations mentioned
- QUOTES: Key statements from executives, analysts, and media
- METRICS: Financial figures, percentages, and data points
- ARTICLE SUMMARIES: Pre-analyzed articles with categories and relevance scores

**CRITICAL: RECENCY PRIORITIZATION**
Each event has a date stamp. Your executive_summary MUST prioritize by recency:
1. **HIGHEST PRIORITY**: Events from today, yesterday, or within last 7 days
2. **MEDIUM PRIORITY**: Events from 1-2 weeks ago (include only if strategically significant)
3. **LOW PRIORITY**: Events older than 2 weeks (only mention if major ongoing strategic impact)
4. **EXCLUDE**: Events older than 1 month should NOT appear in executive_summary unless they represent major strategic shifts still affecting today

**Example of GOOD recency handling:**
"Today's monitoring reveals [recent events]. This builds on [quick context from older events if relevant]."

**Example of BAD recency handling:**
"Warren Buffett's investment 5 months ago dominates the analysis..." [OLD NEWS - should be de-emphasized]

YOUR TASK:
You are the FINAL SYNTHESIS stage. Your job is to:
1. Synthesize the pre-analyzed events into a coherent PR strategy PRIORITIZING RECENT EVENTS
2. Connect the dots between different events to find patterns, weighing recent events more heavily
3. Identify which RECENT events matter most for ${organization?.name}'s PR strategy
4. Generate actionable PR recommendations based on THIS SPECIFIC DATA and its RECENCY

CRITICAL RULES:
- The events list IS your news - don't look for articles elsewhere
- Every event has a date - USE IT to prioritize recent developments
- If an event says "Google announced X (Today)" - that goes in executive_summary
- If an event says "Investment closed (5 months ago)" - that should NOT dominate executive_summary
- You MUST base your entire analysis on these events AND their dates
- Do NOT add outside knowledge - if it's not in the events, it didn't happen today
- Reference specific RECENT events to show your analysis is grounded in today's monitoring

Remember: You're not gathering intelligence - you're SYNTHESIZING already-gathered, already-enriched intelligence WITH RECENCY AWARENESS.`
```

---

## 4. USER PROMPT - ACTUAL DATA DELIVERY

### Code Location: Lines 530-640

**Prompt Header & Context:**

```typescript
prompt = `YOU ARE RECEIVING ENRICHED INTELLIGENCE DATA
This is the complete output from our monitoring and enrichment pipeline.
The events below are ALL from TODAY'S news monitoring - they are NOT hypothetical.

═══════════════════════════════════════════════════════════
🎯 CRITICAL: UNDERSTAND THE MONITORING CONTEXT
═══════════════════════════════════════════════════════════

ORGANIZATION CONTEXT:
- Organization: ${organization?.name}
- Industry: ${profile?.industry || organization?.industry || 'Unknown'}
- What ${organization?.name} Does: ${profile?.description || organization?.description || 'See discovery profile for details'}

${organization?.name}'s DIRECT COMPETITORS (companies in the SAME industry):
${discoveryTargets.competitors.slice(0, 10).join(', ')}

MONITORING TARGETS (entities we're tracking - may be outside our industry):
- Competitors: ${discoveryTargets.competitors.slice(0, 5).join(', ')}
- Stakeholders: ${discoveryTargets.stakeholders.slice(0, 5).join(', ')}

⚠️ CRITICAL DISTINCTION:
- When analyzing "competitive moves", focus on ${organization?.name}'s INDUSTRY COMPETITORS
- When analyzing "stakeholder dynamics", that's about the monitoring targets
- DO NOT confuse stakeholder/regulatory news with competitive moves unless it directly impacts ${organization?.industry}

**TODAY'S DATE:** ${new Date().toISOString().split('T')[0]}
```

**Article Summaries Section (Lines 557-563):**

```typescript
PRE-ANALYZED ARTICLES (${context.totalArticlesAnalyzed} articles processed by our AI):
${articleSummaries.map((article, i) => `
${i+1}. ${article.headline}
   Category: ${article.category} | Relevance: ${article.relevance}/100 | Sentiment: ${article.sentiment}
   Key Insight: ${article.key_insight}
   Entities: ${article.entities_mentioned.join(', ') || 'None identified'}
`).join('') || 'No enriched articles available'}
```

**Events List with Date Formatting (Lines 565-568):**

```typescript
PRE-EXTRACTED EVENTS (These ${topEvents.length} events are what our AI found - **SORTED BY RECENCY**):
${topEvents.map((e, i) =>
  `${i+1}. [${e.type?.toUpperCase()}] ${e.entity}: ${e.description} (${formatEventDate(e.date)})`
).join('\n')}
```

**Recency Rules (Lines 570-574):**

```typescript
⚠️ **CRITICAL RECENCY RULES:**
- PRIORITIZE events from last 7 days (Today, Yesterday, X days ago) in your executive_summary
- DE-EMPHASIZE events older than 2 weeks (X weeks ago, X months ago) unless they have ongoing strategic impact
- If an event is >1 month old (X months ago), ONLY include in executive_summary if it represents a major strategic shift
- The executive_summary should FOCUS on what's happening NOW, not historical context
```

**Synthesis Requirements (Lines 586-591):**

```typescript
SYNTHESIS REQUIREMENTS:
1. Your executive_summary MUST mention at least 10 different companies/entities from the events above
2. Reference events by describing them, not by number
3. Every claim must come from the events above - no external knowledge
4. Focus on the VARIETY of developments across different competitors
5. If major competitors are missing from the events, note this as an intelligence gap
```

**Content Categorization Rules (Lines 593-598):**

```typescript
⚠️ CRITICAL SYNTHESIS RULES:
- "competitive_moves" = Actions by ${organization?.name}'s INDUSTRY COMPETITORS (other ${organization?.industry} companies)
- "stakeholder_dynamics" = News about regulators/investors/analysts we're monitoring (may be outside our industry)
- DO NOT put regulatory news in "competitive_moves" unless it directly affects ${organization?.industry} competition
- Example: For a PR firm, SEC enforcement on broker-dealers goes in "stakeholder_dynamics", NOT "competitive_moves"
- Example: For a PR firm, Edelman winning a client is a "competitive_move", SEC updating disclosure rules is "stakeholder_dynamics"
```

---

## 5. JSON OUTPUT STRUCTURE

### Code Location: Lines 602-636

**Full Output Template:**

```typescript
Generate comprehensive PR intelligence synthesis as valid JSON:

{
  "synthesis": {
    "executive_summary": "A single string containing 2-3 paragraphs summarizing ONLY what we found in today's monitoring. Focus on ${organization?.industry} industry dynamics and what matters for ${organization?.name}'s strategic positioning. Use \\n\\n to separate paragraphs.",

    "competitive_moves": {
      "immediate_threats": ["Actions by OTHER ${organization?.industry} COMPANIES that threaten ${organization?.name}'s position - NOT regulatory news"],
      "opportunities": ["Weaknesses or gaps in OTHER ${organization?.industry} COMPANIES' positioning that ${organization?.name} can exploit"],
      "narrative_gaps": ["Stories in the ${organization?.industry} industry that competitors aren't telling but ${organization?.name} could own"]
    },

    "stakeholder_dynamics": {
      "key_movements": ["Actions by regulators, analysts, investors, or other monitoring targets - NOT direct competitors"],
      "influence_shifts": ["Changes in stakeholder influence that affect ${organization?.industry} landscape"],
      "engagement_opportunities": ["Specific monitoring targets (regulators, analysts, etc.) to engage and why"]
    },

    "media_landscape": {
      "trending_narratives": ["What stories are gaining traction in the media"],
      "sentiment_shifts": ["How coverage tone is changing for key players"],
      "journalist_interests": ["What reporters care about based on recent coverage"]
    },

    "pr_actions": {
      "immediate": ["Do this in next 24-48 hours"],
      "this_week": ["Actions for this week"],
      "strategic": ["Longer-term positioning plays"]
    },

    "risk_alerts": {
      "crisis_signals": ["Early warning signs of potential PR crises"],
      "reputation_threats": ["Emerging threats to ${organization?.name}'s reputation"],
      "mitigation_steps": ["Specific steps to prevent or prepare for risks"]
    }
  }
}
```

---

## 6. DATA STRUCTURE PREPARATION

### Code Location: Lines 67-183 in `prepareSynthesisContext()`

**Events Categorization:**

```typescript
events_by_category: {
  crisis: events.filter(e => e.type === 'crisis' || e.category === 'crisis'),
  partnerships: events.filter(e => e.type === 'partnership' || e.category === 'partnership'),
  product: events.filter(e => e.type === 'product' || e.category === 'product'),
  funding: events.filter(e => e.type === 'funding' || e.category === 'funding'),
  workforce: events.filter(e => e.type === 'workforce' || e.category === 'workforce'),
  regulatory: events.filter(e => e.type === 'regulatory' || e.category === 'regulatory'),
  other: events.filter(e => !['crisis','partnership','product','funding','workforce','regulatory'].includes(e.type))
},
```

**Entity Network:**

```typescript
entity_network: {
  key_companies: knowledge_graph?.entities?.companies || [],
  key_people: knowledge_graph?.entities?.people || [],
  relationships: knowledge_graph?.relationships || [],
  clusters: knowledge_graph?.clusters || []
},
```

**Priorities:**

```typescript
priorities: {
  immediate_actions: executive_summary?.immediate_actions || [],
  opportunities: executive_summary?.strategic_opportunities || [],
  threats: executive_summary?.competitive_threats || [],
  market_trends: executive_summary?.market_trends || []
},
```

---

## 7. DATE FORMATTING FOR RECENCY

### Code Location: Lines 504-528

**Date Formatter Function:**

```typescript
const formatEventDate = (dateStr: string | undefined) => {
  if (!dateStr) return 'Unknown date';

  // Handle relative dates from enrichment
  if (dateStr.includes('ago')) return dateStr; // Already formatted: "5 months ago"
  if (dateStr.toLowerCase().includes('today')) return 'Today';
  if (dateStr.toLowerCase().includes('yesterday')) return 'Yesterday';

  // Try to parse as date
  try {
    const eventDate = new Date(dateStr);
    const today = new Date();
    const diffMs = today.getTime() - eventDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  } catch (e) {
    return dateStr; // Return as-is if can't parse
  }
};
```

**Result:** Events are displayed with relative dates like "Today", "3 days ago", "2 weeks ago" to make recency obvious.

---

## 8. CLAUDE API CALL

### Code Location: Lines 695-760

**API Configuration:**

```typescript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true'
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',  // Back to Sonnet 4 - was working before
    max_tokens: 4000,
    temperature: 0.3,  // Lower temperature for more focused, strategic output
    system: `[SYSTEM PROMPT - see section 3 above]`,
    messages: [
      {
        role: 'user',
        content: prompt  // [USER PROMPT - see section 4 above]
      }
    ]
  })
});
```

**Temperature Setting:** 0.3 = very focused, deterministic output (good for structured analysis)

---

## 9. RESPONSE PARSING

### Code Location: Lines 777-920

**Extraction from Response:**

```typescript
const synthesisText = data.content?.[0]?.text || 'No synthesis generated';

// Parse the JSON response from Claude if it's in JSON format
let synthesis;
try {
  // Clean potential markdown formatting
  let cleanText = synthesisText.trim();

  // Remove markdown code blocks if present
  if (cleanText.includes('```json')) {
    const jsonMatch = cleanText.match(/```json\s*([\s\S]*?)```/);
    if (jsonMatch) {
      cleanText = jsonMatch[1].trim();
    }
  }

  // Fix common JSON formatting issues before parsing
  cleanText = cleanText.replace(/[""]/g, '"').replace(/['']/g, "'");

  const parsed = JSON.parse(cleanText);
  
  // Check if we got the structured response
  if (parsed.synthesis) {
    synthesis = parsed.synthesis;
    synthesisMetadata = parsed.metadata || {};
  } else {
    synthesis = parsed;
  }
```

---

## 10. DATABASE STORAGE

### Code Location: Lines 1051-1125

**Save to Executive Synthesis Table:**

```typescript
if (organization_id && organization?.name) {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { data: insertData, error: insertError } = await supabase
      .from('executive_synthesis')
      .insert({
        organization_id: organization_id,
        organization_name: organization.name,
        synthesis_data: result,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Failed to save synthesis to database:', insertError);
    } else {
      console.log('✅ Synthesis saved to database with ID:', insertData?.id);
    }
  }
}
```

**Also Save to Content Library (Memory Vault):**

```typescript
// ALSO save to content_library for Memory Vault searchability
const title = `Executive Synthesis - ${new Date().toLocaleDateString()}`;
const contentForLibrary = `${result.synthesis.executive_summary}\n\nKey Insights:\n${result.synthesis.top_insights.join('\n')}...`;

const { error: libraryError } = await supabase
  .from('content_library')
  .insert({
    organization_id: organization_id,
    title: title,
    content: contentForLibrary,
    content_type: 'executive-summary',
    metadata: {
      synthesis_id: insertData?.id,
      competitor_moves: result.synthesis.competitor_moves,
      opportunities: result.synthesis.opportunities,
      threats: result.synthesis.threats
    },
    folder: 'Executive Summaries',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
```

---

## SUMMARY OF KEY LOGIC

| Aspect | Details |
|--------|---------|
| **Competitor Weighting** | 80/20 rule: 40 competitor events vs 10 org events |
| **Recency Layers** | System prompt + user prompt + explicit rules |
| **Min Entities** | Must mention 10+ different companies |
| **Event Types** | Crisis, product, partnership, funding, regulatory, workforce, other |
| **Content Categories** | Competitive moves (industry only) vs stakeholder dynamics (broader) |
| **Source Requirement** | All claims must trace back to today's monitoring data |
| **External Knowledge** | Explicitly prohibited |
| **Model Used** | Claude Sonnet 4 (claude-sonnet-4-20250514) |
| **Temperature** | 0.3 (focused, deterministic) |
| **Max Tokens** | 4000 |
| **Storage** | Saved to `executive_synthesis` and `content_library` tables |

