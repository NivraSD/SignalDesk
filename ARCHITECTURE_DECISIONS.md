# SignalDesk Architecture Decisions

A record of the key challenges faced building this platform and the solutions we developed.

---

## 1. News Monitoring Pipeline

### Challenge
Ensure we're only getting fresh, relevant news - filtering out junk and stale content - then synthesizing it through the lens of a PR strategist for actionable intelligence.

### Solutions

1. **Multi-stage filtering pipeline**
   - `monitor-stage-2-relevance`: Filters articles for actual relevance before expensive processing
   - `monitoring-stage-2-enrichment`: Enriches surviving articles with full content, metadata
   - Why: Fail fast. Don't waste Claude tokens on garbage articles.

2. **Voyage embeddings for semantic matching**
   - Articles and targets both embedded in same vector space
   - Similarity matching finds conceptually relevant content, not just keyword matches
   - Why: "Nike competitor moves" should match articles about Adidas even if "Nike" isn't mentioned

3. **MCP Executive Synthesis (`mcp-executive-synthesis`)**
   - Synthesizes matched articles through PR strategist lens
   - Generates briefs with strategic implications, not just summaries
   - Why: Executives need "what does this mean for us" not "what happened"

4. **Structured data flow between edge functions**
   - Each function has clear inputs/outputs
   - JSON schemas for passing data between stages
   - Why: Debuggability. Can inspect data at any pipeline stage.

5. **Opportunity Detection (`mcp-opportunity-detector-v2`)**
   - Identifies actionable opportunities from news flow
   - Connects news to potential business actions
   - Why: News monitoring without action items is just reading

---

## 2. Target Intelligence & Prediction System

### Challenge
We're scraping and embedding massive amounts of news. Multiple organizations are tracking overlapping entities (competitors, industries, people). This creates a unique dataset: the same events seen from different organizational perspectives. How do we extract value from this aggregate intelligence?

### The Unique Position
- Org A tracks "Nike" as a competitor
- Org B tracks "Nike" as a partner
- Org C tracks "Athletic Apparel" as an industry
- We see Nike news through ALL these lenses simultaneously
- This cross-org view reveals patterns no single org could see

### Solutions

1. **Fact Extraction (`extract-target-facts`)**
   - Pull structured facts from matched articles
   - Build dossiers over time, not one-shot analysis
   - Why: Intelligence compounds. Day 1 fact + Day 30 fact = pattern

2. **Pattern Detection (`analyze-target-patterns`)**
   - Analyze accumulated context to find trajectories, anomalies, shifts
   - Compare current activity to baseline
   - Why: "Unusual activity" requires knowing what "usual" looks like

3. **Connection Detection (`detect-cross-target-connections`)**
   - Find relationships BETWEEN targets
   - Shared entities, geographic overlap, timing correlations
   - Why: The interesting intel is often in the connections

4. **Prediction Generation (`generate-outcome-predictions`)**
   - Turn patterns into testable predictions
   - "Based on X signals, we predict Y within Z days"
   - Why: Predictions force specificity. Vague insights are useless.

5. **Prediction Validation (learning loop)**
   - Track whether predictions came true
   - Feed accuracy back into the system
   - Why: A system that can't learn from mistakes will keep making them

### The Insight
**Multi-tenant intelligence is more valuable than single-tenant.**

Each org sees their slice. We see the whole picture:
- Same company tracked by 5 orgs = 5x the signal
- Cross-industry patterns invisible to any single org
- Aggregate data creates prediction power no individual org could build

This is the moat: not just scraping news, but aggregating perspectives.

---

## 3. Article Scraping & Discovery

### Challenge
Get the most stories. No single discovery method captures everything. Had to experiment to find what actually works.

### Solutions (Each an Experiment)

1. **RSS Feeds (`batch-scraper-v5-orchestrator-rss`)**
   - Direct from source, real-time updates
   - Pro: Fast, reliable, structured
   - Con: Not all sources have RSS, limited to subscribed feeds

2. **Google News Sitemaps (`batch-scraper-v5-orchestrator-sitemap`)**
   - Crawl news sitemaps (especially for major outlets like WSJ)
   - Pro: Comprehensive for major publications
   - Con: Some sites block, freshness varies

3. **Fireplexity Search (`batch-scraper-v5-orchestrator-fireplexity`)**
   - AI-powered news search
   - Pro: Finds stories RSS might miss
   - Con: API costs, rate limits

4. **Custom Search Engine (`batch-scraper-v5-orchestrator-cse`)**
   - Google CSE for targeted queries
   - Pro: Highly targeted discovery
   - Con: Query limits, cost per search

5. **NewsAPI (`newsapi-wsj-importer`)**
   - Third-party news aggregation API
   - Pro: Easy integration, broad coverage
   - Con: Can return stale articles (required date filtering fix)

### What Testing Revealed
- No single source is sufficient
- RSS + Sitemap = core coverage
- Fireplexity/CSE = gap filling for specific needs
- NewsAPI = supplementary, but needs freshness guards
- Parallel execution (`parallel-scraper-launcher`) = 3x throughput

### The Principle
**Don't guess. Test.** Each discovery method was a hypothesis. Data showed which ones earned their place in the pipeline.

---

## 4. Fair Processing Across Organizations

### Challenge
When processing matches globally, orgs with high-similarity scores dominated the queue, starving other orgs of processing time.

### Solutions

1. **Parallel per-org processing (`parallel-fact-extractor`)**
   - Launches `extract-target-facts` for EACH org simultaneously
   - Each org gets its own processing allocation
   - Why: Fair distribution beats global optimization. Every customer matters.

2. **Round-robin in single-function mode**
   - When running sequentially, fetch N matches per org instead of top N globally
   - Why: Backup approach when parallel isn't feasible

---

## 5. Freshness & Deduplication

### Challenge
Old articles were polluting the "last 24 hours" pool. NewsAPI and other sources returned stale content.

### Solutions

1. **Date filtering at ingestion**
   - `newsapi-wsj-importer`: 7-day filter on articles before insertion
   - Sitemap orchestrator: 48-hour filter on discovered URLs
   - Why: Filter early. Don't let bad data into the system.

2. **Multiple timestamp fields**
   - `published_at`: When article was actually published
   - `created_at`: When we discovered it
   - `scraped_at`: When we fetched full content
   - `matched_at`: When it matched a target
   - Why: Different questions need different timestamps

3. **Article selector filtering (`article-selector-v5`)**
   - Filters by `published_at` for rolling windows
   - Removed `scraped_at` fallback that was incorrectly filtering fresh matches
   - Why: Defense in depth. Even if bad data gets in, filter it out before synthesis.

---

## 7. Parallel Content Orchestration (1-Click Creation)

### Challenge
Users need multiple content types created simultaneously - a campaign might need a press release, social posts, talking points, and email copy all at once. Sequential creation is too slow and loses coherence across pieces.

### Solutions

1. **Campaign & Opportunity orchestrators**
   - Single trigger launches parallel content generation
   - Each content type generated simultaneously, not sequentially
   - Why: "Create campaign materials" should take 30 seconds, not 5 minutes

2. **MCP Architecture as "Skills"**
   - Each MCP server = a specialized capability (synthesis, content creation, analysis)
   - Orchestrator invokes multiple MCPs in parallel
   - Why: Same concept as Claude Skills - modular, composable AI capabilities
   - Hindsight: We were building skills before "skills" existed as a concept

3. **Shared context across parallel generations**
   - All content pieces receive same company profile, campaign brief, source material
   - Ensures consistency: press release and tweets tell the same story
   - Why: Parallel doesn't mean disconnected

4. **Content type templates (`niv-content-intelligent-v2`)**
   - Each content type has structure, tone, length expectations
   - Same underlying engine, different output formats
   - Why: Don't rebuild for each content type. Parameterize.

### The Insight
**MCP was our skills system before skills existed.** We needed:
- Modular capabilities that could be composed
- Parallel execution for speed
- Shared context for coherence

The MCP server pattern gave us all three.

---

## 8. Context-Aware AI (The "Niv" System)

### Challenge
Generic AI outputs are useless. Every function needs to know WHO it's working for, WHAT they've been working on, and WHAT they've created before. Without this, every interaction starts from zero.

### Solutions

1. **Company Profile passed to every function**
   - Every edge function receives the organization's profile
   - Contains: industry, key competitors, strategic priorities, tone preferences
   - Why: "Write a press release" means nothing without knowing the company

2. **Chat history for continuity (`niv-content-intelligent-v2`, `niv-advisor`)**
   - Last 30 exchanges passed to content/advisory functions
   - AI sees what user asked before, what was created, what feedback was given
   - Why: "Make it shorter" only works if you know what "it" refers to

3. **Memory Vault for long-term recall**
   - Past work stored and queryable
   - Functions can search: "Have we written about this topic before?"
   - Why: Don't recreate. Reference and build on past work.

4. **Accumulated context on intelligence targets**
   - `accumulated_context` JSONB field on each target
   - Tracks: fact history, sentiment trends, relationship map, activity patterns
   - Why: Pattern detection requires memory. "This is unusual" needs a baseline.

### The Principle
**AI without memory is just autocomplete.** Every function should know:
- Who am I working for? (company profile)
- What have we been doing? (chat history)
- What have we done before? (memory vault)
- What do we know about this subject? (accumulated context)

---

## 9. Playbook Intelligence System (Token Optimization)

### Challenge
NIV Content was analyzing 5,000+ tokens of raw content in real-time for every request. Expensive, slow, inconsistent. No way to capture and reuse "what works."

### Solutions

1. **Pre-synthesized playbooks**
   - Analyze patterns from successful past content
   - Distill into compact guides: proven hooks, structures, what works/fails
   - ~300-500 tokens instead of ~5,000 tokens
   - **90% reduction in context usage**

2. **Content type + topic organization**
   - Playbooks keyed by `content_type` + `topic`
   - "media-pitch about energy" → specific playbook
   - Minimum 3 pieces to generate, 7-day freshness

3. **Async generation**
   - Playbook creation doesn't block content generation
   - Falls back gracefully if no playbook exists yet

### The Principle
**Don't re-analyze what you've already learned.** Turn raw content into distilled wisdom, then serve the wisdom.

---

## 10. AI as Consultant, Not Generator

### Challenge
Users expected AI to just "make content." But good PR requires strategy first - understanding the real need, presenting an approach, getting buy-in, THEN executing.

### Solutions

1. **Consultant state machine**
   - `analyzing` → `presenting_strategy` → `awaiting_approval` → `executing` → `complete`
   - AI presents strategy BEFORE generating content
   - User must approve before execution begins

2. **NIV Advisor persona**
   - 25-year veteran corporate communications expert
   - Business-first approach, no moralizing
   - Routes to specialized functions based on intent

3. **Intelligent routing**
   - Content generation → `niv-content-intelligent-v2`
   - Crisis management → `niv-crisis-advisor`
   - Research → `niv-fireplexity`

### The Principle
**Strategy before execution.** AI should act like a senior consultant: understand, recommend, get approval, then deliver.

---

## 11. GEO Intelligence (AI Platform Visibility)

### Challenge
Traditional SEO doesn't capture AI visibility. When someone asks Claude/ChatGPT/Perplexity "who are the best X providers," does your brand get mentioned?

### Solutions

1. **Multi-platform testing**
   - Test brand visibility across Claude, Gemini, ChatGPT, Perplexity
   - AI-generated contextual queries (not static templates)
   - Track who gets recommended and why

2. **Citation tracking**
   - Extract sources from AI responses (Gemini search grounding, Perplexity citations)
   - Know which publications AI platforms cite for competitor coverage
   - PR intelligence: which outlets matter for AI visibility

3. **Actionable signals**
   - `visibility_gap`: Brand not mentioned → create content targeting that query
   - `competitor_update`: Competitor mentioned over you → review their positioning
   - Specific recommendations, not just analytics

### The Principle
**Visibility has shifted.** SEO was "be found on Google." GEO is "be recommended by AI." Different game, different strategy.

---

## 12. Evolution Through Deprecation

### Challenge
Early systems solved immediate problems but better approaches emerged. How do you evolve without breaking everything?

### What Got Deprecated (and Why)
- **Stakeholder Prediction System** → **Target Intelligence System V2**
  - One-shot predictions → dossier-based intelligence accumulation
  - Better: build knowledge over time, not predict from snapshots

- **Connection Intelligence System** → **Target Intelligence V2**
  - Industry-aware detection → cross-org pattern detection
  - Better: aggregate view reveals more than single-org view

### The Principle
**Build to replace.** V1 teaches you what V2 should be. Document what you learned, then deprecate cleanly.

---

## Key Principles

1. **Context is everything** - Pass company profile, chat history, and memory to every function
2. **Multi-tenant is the moat** - Aggregate perspectives reveal what no single org can see
3. **Fail fast, filter early** - Don't process what you'll discard later
4. **Fair distribution** - Every org/customer gets processing, not just the "best" matches
5. **Debuggable pipelines** - Clear stages with inspectable intermediate state
6. **Strategic lens** - Output should be actionable, not just informative
7. **Defense in depth** - Multiple filtering layers catch what earlier ones miss
8. **AI needs memory** - Without history, every interaction starts from zero
9. **Predictions force clarity** - Vague insights are useless; testable predictions create accountability
10. **Don't guess, test** - Each approach is a hypothesis; data reveals what works
11. **Strategy before execution** - AI should recommend, get approval, then deliver
12. **Build to replace** - V1 teaches you what V2 should be; deprecate cleanly
13. **Distill, don't re-analyze** - Turn patterns into playbooks; serve wisdom, not raw data

