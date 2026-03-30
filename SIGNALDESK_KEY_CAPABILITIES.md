# SignalDesk V3 - Key Capabilities Overview

## What Is SignalDesk?

An AI-powered strategic communications platform that transforms raw intelligence into actionable strategies and executable content. It goes beyond telling organizations what's happening—it tells them **what to do about it**.

---

## 1. Campaign Builder & VECTOR Campaigns

**Purpose**: Create sophisticated influence campaigns from research to execution.

### How It Works:
1. **Research Phase** → Web research via Firecrawl, competitive intelligence gathering
2. **Positioning** → AI generates 3-5 strategic positioning options
3. **Campaign Type Selection**:
   - **Traditional PR**: Press releases, media pitches, social content
   - **GEO-VECTOR**: AI-optimized campaigns for search visibility
4. **Execution** → Generates all content pieces automatically

### GEO-VECTOR Campaigns:
- Target AI search platforms (Claude, Gemini, ChatGPT, Perplexity)
- Generate Schema.org markup for better AI crawling
- Create FAQ content that AI platforms will surface
- Track brand visibility across AI platforms

---

## 2. NIV Advisor (AI Consultant)

**Purpose**: A conversational AI with "25 years of virtual PR experience" that advises, researches, and routes to specialized functions.

### Key Capabilities:
- **Research Route** → Deep market research via `niv-fireplexity`
- **Content Route** → 34+ content types with platform-specific formatting
- **Crisis Route** → Specialized crisis planning and real-time guidance

### Content Generation (40+ Types):
- Press releases (strict AP format)
- Social posts (platform-specific: Twitter 280 chars, LinkedIn 150-300 words)
- Media pitches, case studies, white papers
- Executive statements, crisis responses
- Complete media plans (7 components: press release, media pitch, media list, Q&A, talking points, social posts, email campaign)

---

## 3. Intelligence Pipeline

**Purpose**: Automated discovery and analysis of relevant news and opportunities.

### Pipeline Flow:
```
Discovery → Article Collection → Relevance Scoring → Event Extraction → Executive Synthesis → Opportunity Detection
```

### Key Outputs:
- **Executive Synthesis**: 5 expert personas analyze intelligence
  - PR Strategist (competitive moves)
  - Power Broker (stakeholder dynamics)
  - Trend Hunter (viral potential)
  - Market Analyst (industry signals)
  - Cascade Predictor (weak signals, future risks)

- **Opportunities**: 8-10 actionable opportunities per run with execution plans

---

## 4. Target Intelligence System V2

**Purpose**: Build persistent "dossiers" on competitors, stakeholders, and topics that accumulate knowledge over time.

### Four-Layer Architecture:
1. **Signal Matching** → Match articles to intelligence targets via embeddings
2. **Fact Extraction** → Extract structured facts from matched articles
3. **Pattern Analysis** → Detect trajectories, anomalies, trends
4. **Connection Detection** → Find relationships between targets

### What It Tracks:
- Expansion/contraction patterns
- Partnerships and acquisitions
- Leadership changes
- Financial moves
- Legal/regulatory actions
- Crisis events

### Signal Types Generated:
- **Patterns**: trajectory, anomaly, trend, shift, milestone
- **Connections**: shared_relationship, market_convergence, competitive_clash

---

## 5. GEO Intelligence Monitor

**Purpose**: Test brand visibility across AI platforms (Claude, Gemini, ChatGPT, Perplexity).

### How It Works:
1. Claude generates 25-30 contextual search queries based on your industry
2. **Single "meta-analysis" prompt** sent to each AI platform (1 call per platform, not 5)
3. Each platform analyzes all queries at once and returns structured JSON:
   - `query_results` - Per-query visibility analysis
   - `competitive_intelligence` - Who's winning and why
   - `source_intelligence` - Which publications are being cited
   - `recommendations` - Actionable improvements
4. Extracts citation sources (especially from Perplexity with `return_citations: true`)
5. Generates actionable signals with recommendations

### Per-Query Analysis Returns:
- `target_mentioned` - Was your brand mentioned?
- `target_rank` - Position in response (1st, 2nd, 3rd...)
- `organizations_mentioned` - Who else was mentioned
- `why_these_appeared` - Why competitors are winning
- `what_target_needs` - What you need to improve visibility

### Signal Types:
- `ai_visibility` → Brand mentioned positively (rank ≤3 = high priority)
- `visibility_gap` → Brand not mentioned in relevant queries
- `competitive_intelligence` → Who's dominating and why
- `source_intelligence` → Which publications AI platforms cite
- `recommendation` → Specific actions to improve

### Efficiency:
- **Old approach**: 20 API calls (5 queries × 4 platforms)
- **New approach**: 4 API calls (1 meta-analysis per platform)
- Cost: ~$0.15-0.25 per full analysis

---

## 6. Crisis Command Center

**Purpose**: Real-time crisis management with AI advisor.

### Features:
- **Crisis Dashboard**: Real-time crisis management interface
- **Crisis Timeline**: Event tracking with timestamps
- **AI Crisis Advisor**: Conversational AI for real-time guidance
- **Automatic Detection**: Real-time monitor routes critical alerts to Crisis Center

### Crisis Scenarios Supported:
- Data Breach / Cybersecurity
- Product Recall / Safety
- Executive Scandal
- Financial Crisis
- Environmental Incident
- Legal Action
- Social Media Crisis / Boycott

---

## 7. Memory Vault V2 (Content Intelligence)

**Purpose**: Intelligent content management that learns what works and surfaces proven patterns.

### Key Features:

**Playbook System**:
- Pre-synthesizes successful content patterns into compact guides
- Contains proven hooks, brand voice, structure, success/failure patterns
- 90% reduction in context tokens (5,000 → 300-500)

**Salience Scoring**:
- Content naturally decays in relevance over time (0.5%/day)
- Gets boosted when accessed (+5%)
- Popular/successful content stays relevant longer

**Composite Retrieval**:
```
score = 40% similarity + 20% salience + 10% recency + 20% execution_success + 10% relationship
```

**Voyage AI Embeddings**: 1024-dimensional semantic search across all content

---

## 8. Opportunity Engine V2

**Purpose**: Transform intelligence into execution-ready opportunities.

### Opportunity Structure:
```json
{
  "title": "...",
  "urgency": "CRITICAL/HIGH/MEDIUM/LOW",
  "score": 0-100,
  "strategic_context": {
    "trigger_events": [...],
    "why_now": "...",
    "competitive_advantage": "...",
    "risk_if_missed": "..."
  },
  "execution_plan": {
    "stakeholder_campaigns": [...],
    "execution_timeline": {
      "immediate": [...],
      "this_week": [...],
      "this_month": [...]
    }
  }
}
```

### Real-Time Execution:
- Click "Execute" → Content generates with live progress bar
- Content appears as generated (polled every 3 seconds)
- Gamma presentations with extended 120s timeout

---

## 9. Campaign Attribution System

**Purpose**: Track campaign performance by fingerprinting content and attributing discovered coverage.

### The Learning Loop:
1. **Export Content** → Fingerprint created (key phrases + semantic embeddings)
2. **Monitor Intelligence** → New articles checked against fingerprints
3. **Attribution Match**:
   - Level 1: Exact phrase (95% confidence)
   - Level 2: Semantic similarity (75-85%)
   - Level 3: Contextual AI analysis (65-75%)
4. **Record Outcome** → Extract learnings, boost successful strategies

---

## 10. Schema.org Generation

**Purpose**: Generate structured data markup for better AI crawling.

### Pipeline:
1. **Firecrawl Map** → Discovers real pages on website
2. **Entity Extraction** → Claude extracts services, products, people, locations
3. **Schema Generation** → Creates @graph with typed entities
4. **GEO Enhancement** → Adds FAQs (6-8 questions), keywords (20+), awards

---

## Visual Content Generation

- **Imagen 3** (Google Vertex AI): Professional image generation
- **Veo 3 Fast** (Google Vertex AI): Video creation (up to 10 seconds)
- **Gamma AI**: AI-designed slide decks (50/day limit)

---

## Performance Summary

| Operation | Time |
|-----------|------|
| NIV Research | 10-20s |
| NIV Framework | 30-60s |
| Intelligence Pipeline | 40-60s |
| Executive Synthesis | 15-25s |
| Opportunity Detection | 8-12s |
| GEO Monitor | ~60-80s |
| Image Generation | 10-20s |
| Video Generation | 15-25s |
| Presentation | 60-120s |

---

## Technical Stack

- **Frontend**: Next.js 14 on Vercel
- **Backend**: Supabase Edge Functions (Deno)
- **Database**: PostgreSQL (Supabase)
- **AI Providers**: Anthropic (Claude), Google Vertex AI, OpenAI, Perplexity
- **67+ Edge Functions** deployed

---

## Core Differentiator

Traditional intelligence: "FTC announced investigation" (reactive)

SignalDesk: "FTC likely to announce investigation in 14-21 days with 78% confidence. Here's the content to get ahead of it." (proactive)

The platform transforms intelligence from a **cost center** into a **revenue generator**.
