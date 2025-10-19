 Complete Blueprint Architecture with Registries

  ENRICHMENT LAYER (NO AI - Data Preparation)
  niv-blueprint-enrichment
  ├─ Calls journalist-registry
  │   → Query by industry/beat from research
  │   → Get tier1 journalists with outlet metadata
  │   → Gap analysis (if not enough, trigger Firecrawl scrape)
  │   → Returns: enriched journalist list with influence scores
  │
  ├─ Calls knowledge-library-registry
  │   → Query by selected pattern (CASCADE/MIRROR/etc)
  │   → Get academic foundations, case studies, methodologies
  │   → Returns: research-backed strategies for this pattern
  │
  ├─ Calls master-source-registry (if needed for channels)
  │   → Get RSS feeds, publications by industry
  │
  ├─ Firecrawl enrichment (optional, if gaps detected)
  │   → Scrape journalist LinkedIn/recent articles
  │   → Scrape event pages for details
  │   → Scrape competitor press releases
  │
  └─ Data structuring
      → Organize stakeholders by phase (awareness → advocacy)
      → Map channels to stakeholders
      → Structure influence levers from research psychology
      → Prepare pattern-specific guidance from knowledge library
      → Returns: enriched_blueprint_data

  AI GENERATION LAYER (Parallel)
  ├─ mcp-pattern-selector (~7s)
  │   → Input: Campaign goal + historical insights + knowledge library patterns
  │   → Output: Selected pattern + rationale + alternative
  │
  ├─ mcp-influence-mapper (~25s)
  │   → Input: Stakeholders (with psychology) + positioning + pattern
  │   → Output: Part 2 - Influence strategies per stakeholder
  │
  ├─ mcp-tactical-generator (~40s)
  │   → Input: Influence strategies + enriched journalists + pattern guidance + knowledge library tactics
  │   → Output: Part 3 - All 4 phases × 4 pillars
  │   → Uses REAL journalist names from registry
  │   → Uses pattern-specific tactics from knowledge library
  │
  └─ mcp-scenario-planner (~12s)
      → Input: Campaign goal + competitive landscape + pattern
      → Output: Part 4 - Threat scenarios + response playbooks

  ASSEMBLY LAYER (NO AI - Compilation)
  niv-blueprint-compiler
  ├─ Assembles Part 1 (positioning + pattern + stakeholders)
  ├─ Part 2 from influence mapper
  ├─ Part 3 from tactical generator
  ├─ Part 4 from scenario planner
  ├─ Calculates Part 5 (count content from Part 3, apply formulas)
  ├─ Generates Part 6 (week-by-week template from Part 3)
  └─ Returns: Complete 6-part blueprint

  TOTAL TIME: ~47 seconds (parallel) + ~2s (assembly) = ~49 seconds

  Key Advantages of Using Registries

  journalist-registry:
  - Already has tier1/tier2 journalists with metadata
  - Has gap detection built-in
  - Can trigger Firecrawl if gaps found
  - Provides influence scores and outlet metadata
  - Part 3 Pillar 4 gets REAL names, not generic "tech journalists"

  knowledge-library-registry:
  - Has CASCADE/MIRROR/CHORUS/TROJAN/NETWORK research
  - Academic foundations for each pattern
  - Case studies to inform tactics
  - Methodologies and tools
  - Part 3 tactics are research-backed, not invented

  Firecrawl integration:
  - Enriches journalist profiles (scrape their recent work)
  - Gets event details (speakers, agenda, attendance)
  - Scrapes competitor intelligence (press releases, blogs)
  - Fills gaps identified by registries

  This is the REAL intelligence pipeline pattern - enrichment uses existing tools/registries, AI does focused generation, assembly
  compiles.

  Should I implement this architecture?
