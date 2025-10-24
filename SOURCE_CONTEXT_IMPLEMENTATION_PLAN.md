# Source Context Implementation Plan - Make Claude Source-Aware

## Executive Summary

**Current State:** Claude creates profiles blind - it generates keywords without knowing what sources exist or what they cover.

**Goal:** Give Claude full source registry context so it generates source-optimized monitoring strategies.

**Impact:**
- Better keyword matching (aligned with actual source vocabulary)
- Higher article relevance (40% → 85%+ relevant articles)
- Source-specific optimization (TechCrunch vs. Bloomberg require different keywords)

## What Data Is Available (But Not Being Used)

### From master-source-registry

**Per Source:**
```typescript
{
  name: 'TechCrunch',
  url: 'https://techcrunch.com/feed/',
  type: 'rss',
  priority: 'critical'
}
```

**Per Category (competitive, media, regulatory, etc.):**
```typescript
{
  rss: [ /* source objects */ ],
  search_queries: [
    'tech startup funding',
    'tech acquisition',
    'tech product launch'
  ],
  track_urls: [ /* URLs to monitor */ ],
  key_journalists: [ '@karaswisher', '@waltmossberg', ... ],
  podcasts: [ 'All-In Podcast', 'The Vergecast', ... ]
}
```

**This rich metadata exists but Claude never sees it!**

## Implementation - 3 Phases

### Phase 1: Enhanced Prompt (Immediate - 30 min)

**File:** `supabase/functions/mcp-discovery/index.ts`

**Add helper function at top of file:**

```typescript
// Add after imports, before other functions (~line 25)

/**
 * Format sources for Claude with full context
 * Shows: name, priority, and includes search query examples
 */
function formatSourcesForClaude(
  sources: any[],
  searchQueries: string[] = [],
  limit: number = 15
): string {
  if (!sources || sources.length === 0) {
    return '  (No sources in this category)';
  }

  const sourcesList = sources.slice(0, limit).map(s =>
    `  • ${s.name} [${s.priority}] - ${s.type.toUpperCase()} feed`
  ).join('\n');

  let result = sourcesList;

  // Add typical search queries if available
  if (searchQueries && searchQueries.length > 0) {
    result += `\n  Typical coverage: ${searchQueries.slice(0, 3).join(', ')}`;
  }

  return result;
}

/**
 * Extract category metadata (search queries, journalists, etc.)
 */
function extractCategoryMetadata(categoryData: any): any {
  return {
    searchQueries: categoryData.search_queries || [],
    trackUrls: categoryData.track_urls || [],
    keyJournalists: categoryData.key_journalists || [],
    podcasts: categoryData.podcasts || [],
    agencies: categoryData.agencies || [],
    complianceAreas: categoryData.compliance_areas || []
  };
}
```

**Update `gatherSourcesData()` to extract richer data (~line 199):**

```typescript
async function gatherSourcesData(industry: string) {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/master-source-registry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({ industry })
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sources: ${response.status}`);
    }

    const responseData = await response.json();
    const sources = responseData.data || responseData;

    console.log('Master-source-registry response:', {
      hasData: !!responseData.data,
      totalSources: responseData.total_sources,
      categories: Object.keys(sources || {})
    });

    // Extract detailed source information including priorities
    const extractSourceDetails = (sourceList: any[]) => {
      if (!Array.isArray(sourceList)) return [];
      return sourceList.map(s => ({
        name: s.name,
        url: s.url,
        priority: s.priority || 'medium',
        type: s.type || 'rss',
        focus: s.focus || 'general'
      }));
    };

    // NEW: Extract metadata for each category
    const competitiveMetadata = extractCategoryMetadata(sources.competitive || {});
    const mediaMetadata = extractCategoryMetadata(sources.media || {});
    const regulatoryMetadata = extractCategoryMetadata(sources.regulatory || {});
    const marketMetadata = extractCategoryMetadata(sources.market || {});

    // ... rest of existing code for source priorities ...

    return {
      competitive: extractSourceDetails(sources.competitive?.rss || []),
      media: extractSourceDetails(sources.media?.rss || []),
      regulatory: extractSourceDetails(sources.regulatory?.rss || []),
      market: extractSourceDetails(sources.market?.rss || []),
      forward: extractSourceDetails(sources.forward?.rss || []),
      specialized: extractSourceDetails(sources.specialized?.rss || []),

      // NEW: Include category metadata
      competitiveMetadata,
      mediaMetadata,
      regulatoryMetadata,
      marketMetadata,

      // ... existing source_priorities and key_outlets code ...

      hasSources: Object.values(sources).some(s => Array.isArray(s) && s.length > 0)
    };
  } catch (error) {
    console.error('Failed to get sources:', error);
    // ... existing error return ...
  }
}
```

**Replace the prompt in `analyzeAndEnhanceProfile()` (~line 300):**

```typescript
async function analyzeAndEnhanceProfile(
  organization_name: string,
  industryData: any,
  sourcesData: any,
  industry_hint?: string
) {
  const analysisPrompt = `
You are creating a COMPREHENSIVE intelligence monitoring profile for ${organization_name}.

CONTEXT:
- Industry: ${industryData.industry} ${industryData.subCategory ? `(${industryData.subCategory})` : ''}
- Known Competitors: ${industryData.competitors.slice(0, 10).join(', ')}

═══════════════════════════════════════════════════════════
🔍 AVAILABLE INTELLIGENCE SOURCES (Your Monitoring Tools)
═══════════════════════════════════════════════════════════

These are the ACTUAL RSS feeds, publications, and sources you have access to.
Your keywords and monitoring strategies MUST be optimized for these specific sources.

📰 COMPETITIVE INTELLIGENCE SOURCES (${sourcesData.competitive.length} feeds):
${formatSourcesForClaude(sourcesData.competitive, sourcesData.competitiveMetadata?.searchQueries, 20)}

📺 MEDIA SOURCES (${sourcesData.media.length} feeds):
${formatSourcesForClaude(sourcesData.media, sourcesData.mediaMetadata?.searchQueries, 20)}

⚖️ REGULATORY SOURCES (${sourcesData.regulatory.length} feeds):
${formatSourcesForClaude(sourcesData.regulatory, sourcesData.regulatoryMetadata?.searchQueries, 10)}

📊 MARKET ANALYSIS SOURCES (${sourcesData.market.length} feeds):
${formatSourcesForClaude(sourcesData.market, sourcesData.marketMetadata?.searchQueries, 10)}

🎯 CRITICAL PRIORITY SOURCES (Monitor these first):
${sourcesData.source_priorities.critical.slice(0, 15).join(', ')}

${sourcesData.competitiveMetadata?.keyJournalists?.length > 0 ? `
👤 KEY JOURNALISTS TO TRACK:
${sourcesData.competitiveMetadata.keyJournalists.slice(0, 10).join(', ')}
` : ''}

${sourcesData.regulatoryMetadata?.agencies?.length > 0 ? `
🏛️ REGULATORY AGENCIES:
${sourcesData.regulatoryMetadata.agencies.join(', ')}
` : ''}

═══════════════════════════════════════════════════════════
📋 YOUR MISSION
═══════════════════════════════════════════════════════════

Generate a monitoring profile with keywords that will ACTUALLY MATCH articles from these specific sources.

CRITICAL INSTRUCTIONS:

1. STUDY THE SOURCES ABOVE
   - Look at what each publication covers
   - Note the search queries that work for each category
   - Understand priority levels (critical = check first)

2. OPTIMIZE FOR SOURCE VOCABULARY
   Examples based on actual sources:

   ✅ For TechCrunch (covers: startup funding, product launches):
      Keywords: "${organization_name} raises", "${organization_name} Series",
                "${organization_name} launches", "${organization_name} unveils"

   ✅ For The Verge (covers: consumer tech, product reviews):
      Keywords: "${organization_name} review", "${organization_name} hands-on",
                "${organization_name} first look", "${organization_name} features"

   ✅ For Bloomberg/Reuters (covers: financial news, corporate):
      Keywords: "${organization_name} earnings", "${organization_name} revenue",
                "${organization_name} quarterly", "${organization_name} CEO"

   ✅ For Healthcare Dive (if relevant):
      Keywords: "FDA approves", "clinical trial", "patient outcomes"

   ❌ BAD (generic, won't match):
      Keywords: "company news", "business update", "market information"

3. CREATE SOURCE-SPECIFIC MONITORING
   - Critical sources get more keyword variations
   - Match the language each publication uses
   - Consider what makes headlines in each outlet

4. USE CATEGORY SEARCH PATTERNS
   The "Typical coverage" examples show what language these sources use.
   Mirror that language in your keywords.

═══════════════════════════════════════════════════════════

NOW, provide your COMPREHENSIVE profile in this JSON format:

{
  "industry": "Primary industry classification",
  "sub_industry": "Specific sub-industry or niche",
  "description": "2-3 sentences about the organization and its market position",

  "competition": {
    "direct_competitors": ["List 10-15 SPECIFIC company names"],
    "indirect_competitors": ["5-10 companies that could become competitors"],
    "emerging_threats": ["3-5 startups or new entrants"],
    "competitive_dynamics": "Key competitive factors"
  },

  "stakeholders": {
    "regulators": ["SPECIFIC regulatory bodies (e.g., SEC, FDA, EPA)"],
    "major_customers": ["Key customer segments"],
    "major_investors": ["Institutional investors, VCs"],
    "partners": ["Key suppliers, distributors"],
    "critics": ["Activist groups, analysts"],
    "influencers": ["Industry analysts, thought leaders, journalists"]
  },

  "market": {
    "market_size": "Current market size and growth rate",
    "key_metrics": ["3-5 metrics that matter"],
    "market_drivers": ["What drives growth"],
    "market_barriers": ["What limits growth"],
    "geographic_focus": ["Key geographic markets"]
  },

  "trending": {
    "hot_topics": ["5-7 current hot topics"],
    "emerging_technologies": ["Technologies disrupting the industry"],
    "regulatory_changes": ["Recent/upcoming regulatory changes"],
    "market_shifts": ["Recent changes in market dynamics"],
    "social_issues": ["ESG or social topics"]
  },

  "forward_looking": {
    "technology_disruptions": ["Technologies that could disrupt"],
    "regulatory_horizon": ["Upcoming regulations"],
    "market_evolution": ["How the market might evolve"],
    "emerging_risks": ["Future risks"],
    "opportunity_areas": ["Growth opportunities"]
  },

  "monitoring_config": {
    "keywords": [
      "20-30 SPECIFIC keywords optimized for the sources above",
      "Use action verbs that match source headlines: 'launches', 'raises', 'unveils', 'announces'",
      "Include product-specific terms for consumer tech sources",
      "Include financial terms for business sources",
      "Include regulatory terms for compliance sources"
    ],

    "source_optimized_keywords": {
      "TechCrunch_style": ["List keywords that match TechCrunch headlines"],
      "Bloomberg_style": ["List keywords that match Bloomberg headlines"],
      "The_Verge_style": ["List keywords that match The Verge headlines"]
    },

    "crisis_indicators": ["Warning signs of problems"],
    "opportunity_indicators": ["Signs of opportunities"],
    "categories": ["Key news categories"],
    "priority_entities": ["Most important entities to track"],

    "search_queries": {
      "competitor_queries": ["Specific search queries per competitor"],
      "regulatory_queries": ["Queries for regulatory monitoring"],
      "crisis_queries": ["Queries to detect crises early"],
      "opportunity_queries": ["Queries to find opportunities"]
    },

    "content_patterns": {
      "high_value_patterns": ["Patterns indicating important news"],
      "noise_patterns": ["Patterns to filter out"],
      "crisis_patterns": ["Patterns indicating problems"],
      "opportunity_patterns": ["Patterns indicating opportunities"]
    },

    "competitor_priorities": {
      "Top_Competitor_Name": ["What specific aspects to monitor"]
    }
  }
}

${industry_hint ? `\nIndustry context: ${industry_hint}` : ''}
${industryData.competitors.length > 0 ? `\nKnown competitors: ${industryData.competitors.join(', ')}` : ''}

REMEMBER: Your keywords must match what these sources actually publish, not what you think they should publish.
BE SPECIFIC with names. Real companies, real regulators, real people.
`;

  // ... rest of existing function ...
```

### Phase 2: Source-Aware Keyword Expansion (Next - 1 hour)

**File:** `supabase/functions/mcp-discovery/index.ts`

**Add after `analyzeAndEnhanceProfile()` (~line 613):**

```typescript
/**
 * Expand keywords based on source characteristics
 * Different sources require different keyword styles
 */
function expandKeywordsForSources(
  baseKeywords: string[],
  organizationName: string,
  sourcesData: any
): any {
  const expanded = {
    all: [...baseKeywords],
    bySourceType: {},
    byPriority: {
      critical: [],
      high: [],
      medium: []
    }
  };

  // Source-type specific expansions
  const sourceTypePatterns = {
    startup_tech: ['raises', 'Series', 'funding', 'launches', 'announces', 'unveils'],
    consumer_tech: ['review', 'hands-on', 'first look', 'features', 'vs', 'comparison'],
    financial_news: ['earnings', 'revenue', 'quarterly', 'Q1', 'Q2', 'Q3', 'Q4', 'guidance'],
    regulatory: ['investigation', 'settlement', 'fine', 'compliance', 'violation', 'approval'],
    market_analysis: ['market share', 'growth', 'forecast', 'trends', 'outlook']
  };

  // Categorize sources and generate appropriate keywords
  const allSources = [
    ...sourcesData.competitive,
    ...sourcesData.media,
    ...sourcesData.regulatory,
    ...sourcesData.market
  ];

  allSources.forEach(source => {
    const sourceKeywords = [];

    // Determine source type from name
    let sourceType = 'general';
    if (['TechCrunch', 'VentureBeat', 'Crunchbase'].includes(source.name)) {
      sourceType = 'startup_tech';
    } else if (['The Verge', 'Engadget', 'Ars Technica'].includes(source.name)) {
      sourceType = 'consumer_tech';
    } else if (['Bloomberg', 'Reuters', 'Wall Street Journal'].includes(source.name)) {
      sourceType = 'financial_news';
    } else if (source.name.includes('Regulatory') || source.name.includes('SEC') || source.name.includes('FDA')) {
      sourceType = 'regulatory';
    }

    // Generate keywords for this source type
    const patterns = sourceTypePatterns[sourceType] || [];
    patterns.forEach(pattern => {
      sourceKeywords.push(`${organizationName} ${pattern}`);
    });

    // Also add base keywords
    sourceKeywords.push(...baseKeywords);

    // Store by source name and priority
    expanded.bySourceType[source.name] = [...new Set(sourceKeywords)];
    expanded.byPriority[source.priority].push(...sourceKeywords);
  });

  // Deduplicate priority keywords
  Object.keys(expanded.byPriority).forEach(priority => {
    expanded.byPriority[priority] = [...new Set(expanded.byPriority[priority])];
  });

  return expanded;
}
```

**Update the return statement in `analyzeAndEnhanceProfile()` to use expansion:**

```typescript
// Around line 580, before the return statement:

// NEW: Expand keywords for sources
const baseKeywords = enhancedData.monitoring_config?.keywords || [];
const expandedKeywords = expandKeywordsForSources(
  baseKeywords,
  organization_name,
  sourcesData
);

// Merge with existing data and add enhanced monitoring config
return {
  ...enhancedData,
  competition: {
    ...enhancedData.competition,
    direct_competitors: [...new Set([
      ...industryData.competitors.slice(0, 10),
      ...(enhancedData.competition.direct_competitors || [])
    ])].slice(0, 15)
  },

  // Enhanced monitoring configuration
  monitoring_config: {
    ...enhancedData.monitoring_config,
    keywords: expandedKeywords.all,  // NEW: Use expanded keywords
    keywords_by_source: expandedKeywords.bySourceType,  // NEW
    keywords_by_priority: expandedKeywords.byPriority,  // NEW
    search_queries: generateSearchQueries(enhancedData.competition.direct_competitors || []),
    content_patterns: generateContentPatterns(),
    competitor_priorities: generateCompetitorPriorities(),
    source_priorities: sourcesData.source_priorities,
    key_outlets: sourcesData.key_outlets
  },

  // ... rest of existing return
};
```

### Phase 3: Source-Context Relevance Scoring (Later - 2 hours)

**File:** `supabase/functions/monitor-stage-2-relevance/index.ts`

**Update scoring logic (~line 296) to consider source context:**

```typescript
// Around line 296, in the article scoring loop:

const scoredArticles = articles.map(article => {
  const text = `${article.title || ''} ${article.description || ''} ${article.content || ''}`.toLowerCase();
  const titleText = (article.title || '').toLowerCase();

  let score = 0;
  const factors = [];
  const entities_found = [];
  let category = 'general';
  let intelligence_type = 'none';

  // NEW: Get source context
  const articleSource = article.source || article.feed_name || 'unknown';
  const sourceProfile = findSourceProfile(articleSource, profile);

  // NEW: Source-aware scoring boost
  if (sourceProfile) {
    // Check if article uses this source's typical patterns
    const sourceKeywords = profile?.monitoring_config?.keywords_by_source?.[articleSource] || [];
    const matchedSourceKeywords = sourceKeywords.filter(kw =>
      text.includes(kw.toLowerCase())
    );

    if (matchedSourceKeywords.length > 0) {
      score += 25 * matchedSourceKeywords.length;
      factors.push(`SOURCE_OPTIMIZED: ${articleSource} (${matchedSourceKeywords.length} matches)`);
    }

    // Critical sources get priority
    if (sourceProfile.priority === 'critical') {
      score += 20;
      factors.push('CRITICAL_SOURCE');
    }
  }

  // ... rest of existing scoring logic ...
});

// Helper function to find source profile
function findSourceProfile(sourceName: string, profile: any): any {
  if (!profile?.sources) return null;

  const allSources = [
    ...(profile.sources.competitive || []),
    ...(profile.sources.media || []),
    ...(profile.sources.regulatory || []),
    ...(profile.sources.market || [])
  ];

  return allSources.find(s =>
    s.name.toLowerCase() === sourceName.toLowerCase() ||
    sourceName.toLowerCase().includes(s.name.toLowerCase())
  );
}
```

## Testing Plan

### Test 1: Verify Enhanced Prompt
```bash
# Create a test profile and check logs
curl -X POST https://[SUPABASE_URL]/functions/v1/mcp-discovery \
  -H "Authorization: Bearer [KEY]" \
  -H "Content-Type: application/json" \
  -d '{"organization": "Hootsuite", "industry_hint": "Social Media Management"}'

# Check logs for:
# - "📰 COMPETITIVE INTELLIGENCE SOURCES" section
# - Actual source names like "TechCrunch [critical]"
# - "Typical coverage: tech startup funding, tech acquisition"
```

### Test 2: Verify Keyword Quality
```typescript
// Check that keywords include source-specific patterns
{
  "keywords": [
    "Hootsuite launches",    // TechCrunch style
    "Hootsuite review",      // The Verge style
    "Hootsuite earnings",    // Bloomberg style
    // NOT just: "Hootsuite", "social media management"
  ]
}
```

### Test 3: Measure Article Relevance Improvement
```bash
# Before: Check how many articles are marked relevant
# After: Re-run and compare relevant article count

# Expected improvement: 40% relevant → 70-85% relevant
```

## Success Metrics

- [ ] Claude's prompt includes full source list (names, priorities)
- [ ] Claude's prompt includes search query examples
- [ ] Generated keywords match source vocabulary patterns
- [ ] Article relevance score improves by 30-50%
- [ ] Critical sources are weighted appropriately
- [ ] Keywords are source-specific, not generic

## Rollback Plan

If issues occur:
1. Revert to simple prompt (just counts)
2. Keep expanded keyword function for manual testing
3. Source-context scoring can be disabled independently

## Timeline

- **Phase 1** (Enhanced Prompt): 30 minutes
  - Update `formatSourcesForClaude()`
  - Update `analyzeAndEnhanceProfile()` prompt
  - Test with single organization

- **Phase 2** (Keyword Expansion): 1 hour
  - Add `expandKeywordsForSources()`
  - Update return statement
  - Test keyword quality

- **Phase 3** (Relevance Scoring): 2 hours
  - Update scoring logic
  - Add `findSourceProfile()`
  - Test relevance improvement

**Total: ~3.5 hours for full implementation**
