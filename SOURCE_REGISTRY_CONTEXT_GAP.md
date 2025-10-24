# Source Registry Context Gap - Critical Intelligence Loss

## The Core Problem

**MCP-discovery has rich source data but only gives Claude counts, not content.**

This creates a fundamental disconnect: Claude generates monitoring strategies without knowing what tools it actually has available.

## Current State (What Claude Sees)

**File:** `supabase/functions/mcp-discovery/index.ts:300-310`

```typescript
const analysisPrompt = `
You are creating a COMPREHENSIVE intelligence monitoring profile for ${organization_name}.

WHAT WE ALREADY HAVE:
- Industry: ${industryData.industry} ${industryData.subCategory ? `(${industryData.subCategory})` : ''}
- Competitors from registry: ${industryData.competitors.slice(0, 10).join(', ')}
- Sources available:
  - Competitive sources: ${sourcesData.competitive.length}    // ❌ Just "15"
  - Media sources: ${sourcesData.media.length}                // ❌ Just "42"
  - Regulatory sources: ${sourcesData.regulatory.length}      // ❌ Just "8"
  - Market sources: ${sourcesData.market.length}              // ❌ Just "12"
```

Claude sees: **"15 competitive sources available"**
Claude doesn't know: **WHICH sources, what they cover, their priorities, or how to optimize for them**

## What Data Is Actually Available

**File:** `supabase/functions/mcp-discovery/index.ts:226-234`

```typescript
const extractSourceDetails = (sourceList: any[]) => {
  if (!Array.isArray(sourceList)) return [];
  return sourceList.map(s => ({
    name: s.name,              // "TechCrunch", "The Verge", "Reuters"
    url: s.url,                // RSS feed or website URL
    priority: s.priority || 'medium',  // "critical", "high", "medium"
    type: s.type || 'rss',     // "rss", "scrape", "api"
    focus: s.focus || 'general' // "product_launches", "M&A", "regulatory"
  }));
};
```

**This rich data exists but isn't being used!**

## Real-World Example: Social Media Company

### Scenario: Creating profile for Hootsuite

**What Claude currently sees:**
```
- Industry: Social Media Management & Marketing Technology
- Sources available:
  - Competitive sources: 15
  - Media sources: 42
```

**What Claude generates (blind):**
```json
{
  "keywords": [
    "social media management",
    "content scheduling",
    "social media analytics",
    "Hootsuite",
    "Buffer",
    "Sprout Social"
  ]
}
```

**The Problem:**
- TechCrunch focuses on **startup funding and product launches**
- The Verge focuses on **consumer tech products and reviews**
- Social Media Today focuses on **marketing strategies and platform updates**
- AdWeek focuses on **advertising campaigns and agency news**

But Claude generated generic "social media management" keywords without knowing:
1. TechCrunch would find "Hootsuite raises $50M Series C"
2. The Verge would find "Hootsuite launches AI-powered scheduler"
3. Social Media Today would find "How brands use Hootsuite for Instagram"
4. AdWeek would find "Hootsuite partners with WPP agencies"

**Result:** Keywords are too generic and don't align with what sources actually publish!

## What Claude SHOULD See

### Proposed Enhanced Prompt

```typescript
const analysisPrompt = `
You are creating a COMPREHENSIVE intelligence monitoring profile for ${organization_name}.

WHAT WE ALREADY HAVE:
- Industry: ${industryData.industry} ${industryData.subCategory ? `(${industryData.subCategory})` : ''}
- Competitors from registry: ${industryData.competitors.slice(0, 10).join(', ')}

AVAILABLE INTELLIGENCE SOURCES (these are our eyes and ears):

COMPETITIVE INTELLIGENCE SOURCES (${sourcesData.competitive.length}):
${formatSourcesForClaude(sourcesData.competitive.slice(0, 20))}

MEDIA SOURCES (${sourcesData.media.length}):
${formatSourcesForClaude(sourcesData.media.slice(0, 20))}

REGULATORY SOURCES (${sourcesData.regulatory.length}):
${formatSourcesForClaude(sourcesData.regulatory.slice(0, 10))}

MARKET ANALYSIS SOURCES (${sourcesData.market.length}):
${formatSourcesForClaude(sourcesData.market.slice(0, 10))}

CRITICAL CONTEXT:
- Priority sources (must monitor): ${sourcesData.source_priorities.critical.join(', ')}
- High-priority sources: ${sourcesData.source_priorities.high.slice(0, 10).join(', ')}

YOUR TASK:
Generate keywords and monitoring strategies that are OPTIMIZED for these specific sources.

For example:
- If TechCrunch is a source, include keywords like "raises", "Series [A-D]", "launches product"
- If The Verge is a source, include product names and "review", "hands-on", "first look"
- If Reuters is a source, include corporate action terms like "merger", "acquisition", "quarterly earnings"
- If industry-specific publications are available, use their terminology and focus areas

Generate keywords that will ACTUALLY MATCH what these sources publish, not generic terms.
`;

function formatSourcesForClaude(sources: any[]): string {
  return sources.map(s =>
    `  • ${s.name} [${s.priority}] - ${s.focus} (${s.type})`
  ).join('\n');
}
```

**Example output Claude would see:**
```
COMPETITIVE INTELLIGENCE SOURCES (15):
  • TechCrunch [critical] - startup_funding, product_launches (rss)
  • The Verge [high] - consumer_tech, product_reviews (rss)
  • The Information [critical] - enterprise_tech, inside_scoops (scrape)
  • Protocol [high] - tech_policy, platform_power (rss)
  • Social Media Today [medium] - marketing_strategies, platform_updates (rss)
  ...

MEDIA SOURCES (42):
  • Reuters [critical] - breaking_news, corporate_actions (api)
  • Bloomberg [critical] - financial_markets, executive_moves (rss)
  • Wall Street Journal [critical] - business_strategy, M&A (scrape)
  • AdWeek [high] - advertising_campaigns, agency_news (rss)
  ...
```

## How This Changes Keyword Generation

### Before (No Source Context)
```json
{
  "keywords": [
    "social media management",
    "content scheduling",
    "analytics dashboard",
    "social media marketing"
  ]
}
```

### After (With Source Context)
```json
{
  "keywords": [
    // Optimized for TechCrunch (startup_funding, product_launches)
    "Hootsuite raises",
    "Hootsuite Series",
    "Hootsuite launches",
    "Hootsuite unveils",

    // Optimized for The Verge (consumer_tech, product_reviews)
    "Hootsuite review",
    "Hootsuite hands-on",
    "Hootsuite AI features",
    "Hootsuite mobile app",

    // Optimized for Social Media Today (marketing_strategies, platform_updates)
    "Hootsuite for Instagram",
    "Hootsuite social listening",
    "brands use Hootsuite",

    // Optimized for Bloomberg/Reuters (financial, corporate)
    "Hootsuite quarterly earnings",
    "Hootsuite acquires",
    "Hootsuite valuation",
    "Hootsuite CEO"
  ],

  "source_optimization": {
    "TechCrunch": {
      "priority_keywords": ["raises", "launches", "announces", "unveils"],
      "content_patterns": ["Hootsuite [announces|launches]", "startup funding", "Series [A-D]"]
    },
    "The Verge": {
      "priority_keywords": ["review", "hands-on", "features", "AI"],
      "content_patterns": ["Hootsuite's new", "review of", "first look"]
    },
    "Reuters": {
      "priority_keywords": ["earnings", "revenue", "acquires", "merger"],
      "content_patterns": ["Hootsuite [Inc|Corp]", "quarterly", "fiscal"]
    }
  }
}
```

## Semantic Understanding WITH Source Context

The combination would be powerful:

1. **Claude understands the organization semantically:**
   - "Hootsuite is a social media management platform for scheduling and analytics"

2. **Claude understands what sources cover:**
   - TechCrunch = tech startup news, funding, product launches
   - The Verge = consumer tech, product reviews, features
   - Bloomberg = financial news, earnings, M&A

3. **Claude generates source-optimized keywords:**
   - For TechCrunch: "Hootsuite launches AI-powered", "Hootsuite raises Series"
   - For The Verge: "Hootsuite review", "Hootsuite new features"
   - For Bloomberg: "Hootsuite earnings", "Hootsuite acquires"

4. **Relevance scoring becomes smarter:**
   ```typescript
   // Instead of just checking if "Hootsuite" appears
   if (article.source === "TechCrunch" &&
       text.includes("launches") &&
       text.includes(orgName)) {
     score += 80; // High value: TechCrunch covering our product launch
   }

   // vs. generic match
   if (text.includes(orgName)) {
     score += 20; // Low value: just mentioned
   }
   ```

## Implementation Plan

### Step 1: Enhanced Prompt (Immediate)
```typescript
// supabase/functions/mcp-discovery/index.ts:300

function formatSourcesForClaude(sources: any[], limit: number = 20): string {
  return sources.slice(0, limit).map(s =>
    `  • ${s.name} [${s.priority}] - Focus: ${s.focus} (Type: ${s.type})`
  ).join('\n');
}

const analysisPrompt = `
You are creating a COMPREHENSIVE intelligence monitoring profile for ${organization_name}.

WHAT WE ALREADY HAVE:
- Industry: ${industryData.industry}
- Competitors: ${industryData.competitors.slice(0, 10).join(', ')}

AVAILABLE INTELLIGENCE SOURCES (our monitoring infrastructure):

📰 COMPETITIVE INTELLIGENCE SOURCES (${sourcesData.competitive.length} sources):
${formatSourcesForClaude(sourcesData.competitive, 20)}

📺 MEDIA SOURCES (${sourcesData.media.length} sources):
${formatSourcesForClaude(sourcesData.media, 20)}

⚖️ REGULATORY SOURCES (${sourcesData.regulatory.length} sources):
${formatSourcesForClaude(sourcesData.regulatory, 10)}

📊 MARKET SOURCES (${sourcesData.market.length} sources):
${formatSourcesForClaude(sourcesData.market, 10)}

🎯 PRIORITY SOURCES (monitor these first):
Critical: ${sourcesData.source_priorities.critical.join(', ')}
High: ${sourcesData.source_priorities.high.slice(0, 10).join(', ')}

IMPORTANT INSTRUCTIONS:
1. Generate keywords that MATCH what these specific sources actually publish
2. Consider each source's focus area when creating monitoring queries
3. For critical sources, ensure we have optimized keywords for their content type
4. Create source-specific content patterns (e.g., "TechCrunch style: 'Company X launches Y'")

Examples:
- For sources focused on "startup_funding": use keywords like "raises", "Series A/B/C", "valuation", "investors"
- For sources focused on "product_launches": use keywords like "launches", "unveils", "announces", "debuts", "releases"
- For sources focused on "financial_markets": use keywords like "earnings", "revenue", "quarterly", "guidance", "profit"
- For sources focused on "regulatory": use keywords like "investigation", "settlement", "compliance", "fine", "violation"

YOUR OUTPUT SHOULD OPTIMIZE FOR THE SOURCES WE ACTUALLY HAVE.
...
`;
```

### Step 2: Source-Aware Keyword Expansion (Next)
```typescript
// New function: expandKeywordsForSources
function expandKeywordsForSources(
  baseKeywords: string[],
  sourcesData: any
): any {
  const sourceOptimized = {};

  // For each critical source, generate optimized variations
  sourcesData.source_priorities.critical.forEach(sourceName => {
    const source = findSource(sourceName, sourcesData);
    if (!source) return;

    sourceOptimized[sourceName] = {
      keywords: baseKeywords.map(kw =>
        adaptKeywordForSource(kw, source.focus)
      ),
      patterns: generatePatternsForSource(source),
      priority: 'critical'
    };
  });

  return sourceOptimized;
}

function adaptKeywordForSource(keyword: string, focus: string): string[] {
  const variations = [keyword];

  if (focus === 'startup_funding') {
    variations.push(`${keyword} raises`, `${keyword} Series`, `${keyword} funding`);
  } else if (focus === 'product_launches') {
    variations.push(`${keyword} launches`, `${keyword} unveils`, `${keyword} announces`);
  } else if (focus === 'financial_markets') {
    variations.push(`${keyword} earnings`, `${keyword} revenue`, `${keyword} quarterly`);
  }
  // ... more focus areas

  return variations;
}
```

### Step 3: Source-Context Relevance Scoring (Later)
```typescript
// In monitor-stage-2-relevance/index.ts

// Add source context to scoring
const sourceContext = profile?.sources?.find(s => s.name === article.source);

if (sourceContext) {
  // Boost score if article matches source's typical coverage
  if (sourceContext.focus === 'product_launches' && hasProductLaunch) {
    score += 30; // This source is KNOWN for product launch coverage
    factors.push('SOURCE_EXPERTISE_MATCH');
  }

  if (sourceContext.priority === 'critical') {
    score += 20; // Critical sources get priority
    factors.push('CRITICAL_SOURCE');
  }
}
```

## Expected Impact

### Before
- Generic keywords: "social media management", "content scheduling"
- Source-agnostic matching: looks for exact phrases everywhere
- Miss rate: ~40% of relevant articles (different terminology)

### After
- Source-optimized keywords: TechCrunch gets "launches", Bloomberg gets "earnings"
- Source-aware matching: knows what each publication typically covers
- Miss rate: ~15% (optimized for actual source vocabulary)

## Why This Matters

**The system currently generates intelligence profiles in a vacuum.**

It's like:
- Building a car without knowing what roads exist
- Creating a fishing net without knowing what fish swim in your waters
- Writing a search query without knowing what search engine you're using

**With source context, Claude can:**
1. Generate keywords that match source vocabulary
2. Create monitoring strategies aligned with source coverage
3. Prioritize content patterns based on source specialties
4. Understand which sources to weight more heavily for different intelligence types

## Code Locations to Update

1. **Main prompt enhancement**: `supabase/functions/mcp-discovery/index.ts:300-395`
2. **Source formatting utility**: New function `formatSourcesForClaude()`
3. **Keyword expansion**: `supabase/functions/mcp-discovery/index.ts:809-818`
4. **Relevance scoring**: `supabase/functions/monitor-stage-2-relevance/index.ts:296-450`

## Next Steps

1. ✅ Document the problem (this file)
2. Update the Claude prompt to include source details
3. Add source-aware keyword expansion
4. Enhance relevance scoring with source context
5. Test with real sources and measure improvement in article relevance
