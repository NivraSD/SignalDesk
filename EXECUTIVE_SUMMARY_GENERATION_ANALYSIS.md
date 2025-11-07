# Executive Summary Generation Code Analysis

## Overview
The executive summary generation logic is implemented across multiple Supabase functions and follows a sophisticated pipeline that extracts, organizes, and synthesizes intelligence data into actionable PR insights.

## Key Files

### 1. Main Synthesis Engine: `mcp-executive-synthesis/index.ts`
**File Path:** `/Users/jonathanliebowitz/Desktop/signaldesk-v3/supabase/functions/mcp-executive-synthesis/index.ts`

This is the primary function that generates executive summaries with comprehensive logic for event prioritization and synthesis.

---

## Architecture: Event Flow & Prioritization

### Stage 1: Data Preparation (`prepareSynthesisContext()`)

The function structures enriched data into a coherent context with the following hierarchy:

```
1. EVENTS BY CATEGORY
   - crisis, partnerships, product, funding, workforce, regulatory, other
   - Organized by event type for pattern recognition

2. ENTITY RELATIONSHIPS
   - Key companies, key people, relationships, clusters
   - From knowledge graph analysis

3. PRIORITIZED INSIGHTS
   - immediate_actions
   - strategic_opportunities
   - competitive_threats
   - market_trends

4. SUPPORTING EVIDENCE
   - Quotes
   - Metrics
   - Topic clusters

5. METADATA
   - Total events count
   - Total entities count
   - Deep analysis count
   - Articles processed count
```

**Key Code (Lines 67-183):**
```typescript
const structuredContext = {
  events_by_category: {
    crisis: events.filter(e => e.type === 'crisis'),
    partnerships: events.filter(e => e.type === 'partnership'),
    product: events.filter(e => e.type === 'product'),
    funding: events.filter(e => e.type === 'funding'),
    workforce: events.filter(e => e.type === 'workforce'),
    regulatory: events.filter(e => e.type === 'regulatory'),
    other: events.filter(...)
  },
  entity_network: {
    key_companies: knowledge_graph?.entities?.companies || [],
    key_people: knowledge_graph?.entities?.people || [],
    relationships: knowledge_graph?.relationships || [],
    clusters: knowledge_graph?.clusters || []
  },
  priorities: {
    immediate_actions: executive_summary?.immediate_actions || [],
    opportunities: executive_summary?.strategic_opportunities || [],
    threats: executive_summary?.competitive_threats || [],
    market_trends: executive_summary?.market_trends || []
  },
  evidence: {
    quotes: organized_intelligence?.quotes || extracted_data?.quotes || [],
    metrics: organized_intelligence?.metrics || extracted_data?.metrics || [],
    topic_clusters: organized_intelligence?.topic_clusters || []
  }
};
```

---

### Stage 2: Event Filtering & Weighting (The "80/20 Rule")

**Location:** Lines 410-463 in `synthesizeExecutiveIntelligence()`

This is where CRITICAL prioritization logic separates competitor/market events from org-internal events:

#### Logic: Competitor vs Organization Event Separation

```typescript
const allEvents = context.strategicInsights.events || [];
const orgName = organization?.name?.toLowerCase() || '';

// SEPARATE: Events about the organization vs events about others
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

#### Weighting: 80/20 Rule Implementation

**Lines 446-454: EXPLICIT 80/20 COMPETITOR WEIGHTING**

```typescript
// PRIORITIZE competitor/market events HEAVILY - 80/20 rule
const maxEvents = 50; // Total events for synthesis
const competitorEventCount = Math.min(40, eventsAboutOthers.length); // UP TO 40 competitor events
const orgEventCount = Math.min(10, eventsAboutOrg.length); // MAX 10 org events

const topEvents = [
  ...eventsAboutOthers.slice(0, competitorEventCount),  // 40 competitor events
  ...eventsAboutOrg.slice(0, orgEventCount)              // 10 org events
];
```

**This means:**
- 40 out of 50 events are competitor/market events = 80%
- 10 out of 50 events are org events = 20%
- Competitors are prioritized 4x more heavily than the org's own news

---

### Stage 3: Intelligence Target Loading

**Lines 223-301: Loading Discovery Targets from Database**

```typescript
// Load targets from intelligence_targets table
if (organization_id) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: intelligenceTargets } = await supabase
    .from('intelligence_targets')
    .select('*')
    .eq('organization_id', organization_id)
    .eq('active', true);

  if (intelligenceTargets && intelligenceTargets.length > 0) {
    discoveryTargets = {
      competitors: intelligenceTargets
        .filter(t => t.type === 'competitor')
        .map(t => t.name),
      stakeholders: intelligenceTargets
        .filter(t => t.type === 'stakeholder' || t.type === 'influencer')
        .map(t => t.name),
      topics: intelligenceTargets
        .filter(t => t.type === 'topic' || t.type === 'keyword')
        .map(t => t.name)
    };
  }
}
```

**Key sources used:**
1. `intelligence_targets` table (primary)
2. Fallback to profile structure if no database records
3. Includes competitors, stakeholders (regulators, analysts, activists, investors, customers), topics

---

## The Generation Prompts

### User Prompt (Data-Focused)

**Location: Lines 530-640**

The user prompt provides Claude with the actual data and synthesis requirements:

```
YOU ARE RECEIVING ENRICHED INTELLIGENCE DATA
This is the complete output from our monitoring and enrichment pipeline.
The events below are ALL from TODAY'S news monitoring - they are NOT hypothetical.
```

**Key Components:**

#### 1. ORGANIZATION CONTEXT (Lines 538-548)
```
- Organization: [org name]
- Industry: [industry]
- Competitors (companies in the SAME industry): [list]
- Monitoring Targets: Competitors, Stakeholders
```

#### 2. PRE-ANALYZED ARTICLES (Lines 557-563)
Provides 20+ article summaries with:
- Headline
- Category (pr_category)
- Relevance score (0-100)
- Sentiment (positive/negative/neutral)
- Key insight
- Entities mentioned

#### 3. PRE-EXTRACTED EVENTS (Lines 565-568)
**SORTED BY RECENCY** - includes:
- Event type: [CRISIS/PRODUCT/PARTNERSHIP/FUNDING/REGULATORY/WORKFORCE/OTHER]
- Entity (company/person)
- Description
- Date (formatted as "Today", "Yesterday", "X days ago", "X months ago")

**All events are pre-sorted, with most recent first.**

#### 4. CRITICAL RECENCY RULES (Lines 570-574)
```
⚠️ **CRITICAL RECENCY RULES:**
- PRIORITIZE events from last 7 days (Today, Yesterday, X days ago) in your executive_summary
- DE-EMPHASIZE events older than 2 weeks (X weeks ago, X months ago) unless ongoing strategic impact
- If an event is >1 month old (X months ago), ONLY include if it represents major strategic shift
- The executive_summary should FOCUS on what's happening NOW, not historical context
```

#### 5. SYNTHESIS REQUIREMENTS (Lines 586-591)
```
1. Your executive_summary MUST mention at least 10 different companies/entities
2. Reference events by describing them, not by number
3. Every claim must come from the events above - no external knowledge
4. Focus on the VARIETY of developments across different competitors
5. If major competitors are missing from the events, note this as intelligence gap
```

#### 6. CRITICAL SYNTHESIS RULES (Lines 593-598)
**Distinctions between content types:**
```
- "competitive_moves" = Actions by the org's INDUSTRY COMPETITORS (NOT regulatory)
- "stakeholder_dynamics" = News about regulators/investors/analysts (may be outside industry)
- DO NOT confuse stakeholder/regulatory news with competitive moves
```

**Examples:**
- SEC enforcement on broker-dealers → "stakeholder_dynamics" (not competitive)
- PR firm wins a client → "competitive_move"
- SEC updates disclosure rules → "stakeholder_dynamics"

---

### System Prompt (Behavior & Instructions)

**Location: Lines 707-752**

The system prompt instructs Claude on how to synthesize:

```
You are a senior PR strategist receiving ENRICHED INTELLIGENCE DATA for [organization].

WHAT YOU ARE RECEIVING:
This is NOT raw data. You are receiving the OUTPUT of our intelligence pipeline:
1. We monitored hundreds of news sources today
2. Our AI filtered them for PR relevance
3. Our enrichment AI extracted and categorized events
4. This enriched data is YOUR ONLY SOURCE

THE ENRICHED DATA STRUCTURE:
- EVENTS: Pre-extracted, categorized developments with DATES
- ENTITIES: Companies, people, organizations
- QUOTES: Key statements
- METRICS: Financial figures, percentages, data
- ARTICLE SUMMARIES: Pre-analyzed with categories and relevance scores
```

#### CRITICAL: RECENCY PRIORITIZATION (Lines 723-734)

```
**CRITICAL: RECENCY PRIORITIZATION**
Each event has a date stamp. Your executive_summary MUST prioritize by recency:

1. **HIGHEST PRIORITY**: Events from today, yesterday, or within last 7 days
2. **MEDIUM PRIORITY**: Events from 1-2 weeks ago (include only if strategically significant)
3. **LOW PRIORITY**: Events older than 2 weeks (only mention if major ongoing strategic impact)
4. **EXCLUDE**: Events older than 1 month should NOT appear unless major strategic shifts

**Example of GOOD recency handling:**
"Today's monitoring reveals [recent events]. This builds on [quick context from older events if relevant]."

**Example of BAD recency handling:**
"Warren Buffett's investment 5 months ago dominates the analysis..." [OLD NEWS - should be de-emphasized]
```

#### TASK & CRITICAL RULES (Lines 736-751)

```
YOUR TASK:
You are the FINAL SYNTHESIS stage. Your job is to:
1. Synthesize the pre-analyzed events into coherent PR strategy PRIORITIZING RECENT EVENTS
2. Connect dots between events, weighing recent events more heavily
3. Identify which RECENT events matter most for the org's PR strategy
4. Generate actionable PR recommendations based on THIS SPECIFIC DATA and its RECENCY

CRITICAL RULES:
- The events list IS your news - don't look for articles elsewhere
- Every event has a date - USE IT to prioritize recent developments
- If an event says "Google announced X (Today)" - that goes in executive_summary
- If an event says "Investment closed (5 months ago)" - should NOT dominate executive_summary
- You MUST base entire analysis on these events AND their dates
- Do NOT add outside knowledge
- Reference specific RECENT events to show analysis is grounded in today's monitoring
```

---

## JSON Output Structure

**Location: Lines 602-636**

Claude must return JSON with this structure:

```json
{
  "synthesis": {
    "executive_summary": "2-3 paragraphs summarizing ONLY today's monitoring findings",
    
    "competitive_moves": {
      "immediate_threats": ["Actions by OTHER industry COMPANIES that threaten position"],
      "opportunities": ["Weaknesses in OTHER industry COMPANIES' positioning"],
      "narrative_gaps": ["Stories competitors aren't telling but org could own"]
    },
    
    "stakeholder_dynamics": {
      "key_movements": ["Actions by regulators, analysts, investors (NOT direct competitors)"],
      "influence_shifts": ["Changes affecting industry landscape"],
      "engagement_opportunities": ["Specific targets to engage and why"]
    },
    
    "media_landscape": {
      "trending_narratives": ["Stories gaining traction"],
      "sentiment_shifts": ["Coverage tone changes for key players"],
      "journalist_interests": ["What reporters care about"]
    },
    
    "pr_actions": {
      "immediate": ["Do this in next 24-48 hours"],
      "this_week": ["Actions for this week"],
      "strategic": ["Longer-term positioning plays"]
    },
    
    "risk_alerts": {
      "crisis_signals": ["Early warning signs"],
      "reputation_threats": ["Threats to reputation"],
      "mitigation_steps": ["Prevent/prepare for risks"]
    }
  }
}
```

---

## Secondary Synthesis Functions

### 2. GEO Executive Synthesis: `geo-executive-synthesis/index.ts`

**Purpose:** Synthesizes AI/LLM visibility performance across platforms

**Key Difference:** Uses different prompt structure focused on GEO (Generative Experience Optimization)

**Prompt Building (Lines 321-431):**
- Analyzes performance by platform (Claude, Gemini, ChatGPT, Perplexity)
- Compares mention rates and rankings
- Identifies critical visibility gaps
- Recommends schema changes
- Only recommends MISSING fields from current schema

---

### 3. Goal-Aligned Synthesis: `claude-intelligence-synthesizer/index.ts`

**Purpose:** Synthesizes MCP data aligned with organization's strategic goals

**Key Features:**
- Maps stakeholder sentiment to strategic goals
- Identifies coalition opportunities
- Forecasts impact on objectives
- Allocates resources across goals

**Synthesis Functions:**
- `synthesizeCompetitorIntelligence()` - 3 most important competitor movements
- `synthesizeStakeholderIntelligence()` - Stakeholder mapping and engagement
- `synthesizeNarrativeIntelligence()` - Narrative alignment with goals
- `synthesizePredictiveIntelligence()` - Forecast impact on goals
- `generateExecutiveSummary()` - Overall strategic summary

---

## Data Extraction Layer: `monitoring-stage-2-enrichment/index.ts`

**Purpose:** Deep Claude analysis of full-content articles

**Key Prompt Elements (Lines 148-232):**

```
DISCOVERY TARGETS:
- Organization: [name]
- Competitors: [list]
- Stakeholders: [list]
- Priority Topics: [list]

EXTRACTION FOCUS:
- Competitor activities and vulnerabilities
- Regulatory changes and stakeholder positions
- Market shifts and opportunities
- Crisis indicators
- Strategic positioning opportunities

CRITICAL: For EVENTS, the "entity" field MUST be the company the event is ABOUT.
Example: If Google announces a product, entity="Google", type="product"
Example: If Microsoft acquires a startup, entity="Microsoft", type="acquisition"
```

**Extracted Data Structure:**
```json
{
  "events": [
    {
      "type": "crisis|product|partnership|funding|regulatory|workforce|acquisition|other",
      "entity": "Company or Person name (who this event is about)",
      "description": "What happened",
      "category": "competitive|strategic|market|regulatory",
      "date": "Date if mentioned"
    }
  ],
  "entities": ["Names array"],
  "quotes": [{"text": "...", "source": "...", "context": "..."}],
  "metrics": [{"type": "...", "value": "...", "context": "..."}],
  "insights": ["Strategic implications"],
  "discovery_matches": {
    "competitors": [],
    "stakeholders": [],
    "topics": []
  }
}
```

---

## Key Logic Decisions & Prioritization

### 1. Competitor vs Organization News Weighting
- **Ratio:** 80/20 (40 competitor events vs 10 org events)
- **Logic:** `eventsAboutOthers` separated from `eventsAboutOrg`
- **Reasoning:** Competitive intelligence is 4x more important than org's own news

### 2. Recency Prioritization Layers
1. **System Prompt Level:** Tells Claude how to weight dates
2. **User Prompt Level:** Lists all events sorted by date (most recent first)
3. **Template Instructions:** Explicit rules for what age of events to include

### 3. Content Categorization
- **Competitive Moves:** Actions by industry competitors only (not regulators)
- **Stakeholder Dynamics:** Actions by regulators, analysts, investors (outside industry OK)
- **Clear Boundaries:** Example given for PR firm (client win = competitive, SEC ruling = stakeholder)

### 4. Variety Requirement
- Must mention at least 10 different companies/entities
- Must show coverage variety across competitors
- Must note intelligence gaps if major competitors missing

### 5. Source-Based Synthesis
- All claims must trace back to extracted events/articles
- No external knowledge allowed
- Every insight must be from today's monitoring
- References by description, not number

---

## Summary: The Generation Process

1. **EXTRACT:** Monitoring stage extracts events from articles with entity, type, date
2. **ORGANIZE:** Structure by category (crisis, product, partnership, etc.)
3. **FILTER:** Separate competitor events (80%) from org events (20%)
4. **ENRICH:** Add quotes, metrics, insights, stakeholder data
5. **PRIORITIZE:** Sort by recency (today/yesterday/days ago first)
6. **SYNTHESIZE:** Claude creates PR strategy using:
   - System prompt (behavior rules, recency prioritization)
   - User prompt (actual data: articles, events, context)
   - Pre-constructed JSON structure (what output should contain)
7. **OUTPUT:** JSON with executive summary, competitive moves, stakeholder dynamics, actions, risks

The system heavily emphasizes:
- **Recency:** Recent events weighted 4x more in synthesis instructions
- **Competitor Focus:** 80% of data is competitor/market news (vs 20% org news)
- **Variety:** Must cover 10+ companies to ensure broad competitive perspective
- **Sourcing:** Every claim traceable to actual monitoring data
