# Monitor-Stage-1 Analysis: Why It's OpenAI-Focused

## Current Architecture

### monitor-stage-1 (RSS-Based Approach)
**What it does:**
1. Fetches 15 competitors from discovery (✅ Working)
2. Pulls from **RSS feeds only** (TechCrunch, VentureBeat, etc.)
3. Collects ~100 articles in 127s
4. **Problem**: RSS feeds are GENERAL tech news, not targeted searches

**Why it's OpenAI-focused:**
- RSS feeds like TechCrunch publish what's NEWSWORTHY
- OpenAI is getting lots of press coverage right now (Sora 2 launch, etc.)
- Competitors like Anthropic/Meta AI get LESS media coverage
- RSS doesn't let us TARGET specific companies/topics

**Code Evidence** (lines 491-609):
```typescript
// PHASE 1: RSS FEEDS (PRIORITIZED)
const allRssSources = [
  "TechCrunch RSS",
  "VentureBeat RSS",
  "Google News RSS",
  // ... etc
]

// It just fetches WHATEVER is in these feeds
// No targeted search for competitors
```

## Available Better Options

### Option 1: mcp-firecrawl with `search_and_scrape`
**Location**: `/supabase/functions/mcp-firecrawl/index.ts`

**Capabilities**:
```typescript
{
  name: 'search_and_scrape',
  description: 'Search for content and scrape results',
  inputSchema: {
    query: string,      // ✅ Can search "Anthropic Claude 3.5"
    limit: number,      // ✅ Control how many results
    scrapeResults: boolean  // ✅ Get full content
  }
}
```

**Advantages**:
- **Targeted searches** for each competitor
- Search "Anthropic funding", "Meta AI announcements", "Google DeepMind research"
- Gets RECENT results (not just RSS)
- Can scrape full articles for deep content

**Disadvantages**:
- API costs (Firecrawl charges per search + scrape)
- Slower than RSS (but more targeted)
- Rate limits

### Option 2: niv-fireplexity (Hybrid Search)
**Location**: `/supabase/functions/niv-fireplexity/index.ts`

**What it does**:
- Combines **search** (finding articles) + **scraping** (getting content)
- Uses Firecrawl's search API
- Returns structured results

**Use case**: When you need both discovery AND content

### Option 3: Hybrid Approach (Recommended)
**Combine RSS + Targeted Searches**

```typescript
// PHASE 1: RSS Feeds (fast, broad coverage)
const rssArticles = await fetchAllRSSFeeds() // 100 articles in 60s

// PHASE 2: Competitor-Targeted Searches (fill gaps)
const competitorSearches = [
  { query: "Anthropic Claude", limit: 5 },
  { query: "Meta AI Llama", limit: 5 },
  { query: "Google DeepMind Gemini", limit: 5 },
  { query: "Microsoft Copilot", limit: 5 },
  { query: "xAI Grok", limit: 5 }
]

const searchPromises = competitorSearches.map(search =>
  supabase.functions.invoke('mcp-firecrawl', {
    body: {
      method: 'tools/call',
      params: {
        name: 'search_and_scrape',
        arguments: search
      }
    }
  })
)

const searchResults = await Promise.all(searchPromises)
// Adds ~25 targeted competitor articles in ~30s

// RESULT: 100 RSS + 25 targeted = 125 articles with better coverage
```

## Recommended Implementation Plan

### Phase 1: Add Targeted Competitor Searches (Quick Win)
**Edit**: `monitor-stage-1/index.ts`

**After line 609** (after RSS phase completes):
```typescript
// ==================== PHASE 2.5: COMPETITOR TARGETED SEARCHES ====================
console.log('\n🎯 PHASE 2.5: TARGETED COMPETITOR SEARCHES');
console.log('='.repeat(50));

// Only do this if we have competitors and limited competitor coverage
const competitorArticles = articlesMap.size;
const competitorCoverage = Array.from(entityCoverage.entries())
  .filter(([entity]) => competitors.includes(entity))
  .reduce((sum, [_, count]) => sum + count, 0);

console.log(`📊 Current competitor coverage: ${competitorCoverage} mentions across ${competitorArticles} articles`);

if (competitorCoverage < 20 || competitorArticles < 50) {
  console.log('⚠️ Limited competitor coverage, adding targeted searches...');

  // Search for top 5 competitors
  const topCompetitors = competitors.slice(0, 5);
  const searchPromises = topCompetitors.map(async (competitor) => {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/mcp-firecrawl`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          method: 'tools/call',
          params: {
            name: 'search_and_scrape',
            arguments: {
              query: `${competitor} news last 24 hours`,
              limit: 5,
              scrapeResults: false  // Just get headlines for speed
            }
          }
        })
      });

      if (!response.ok) {
        console.log(`   ❌ Search failed for ${competitor}`);
        return [];
      }

      const data = await response.json();
      const results = JSON.parse(data.content[0].text);
      console.log(`   ✅ ${competitor}: ${results.articles?.length || 0} articles`);

      return results.articles || [];
    } catch (err) {
      console.log(`   ❌ Error searching ${competitor}: ${err.message}`);
      return [];
    }
  });

  const searchResults = await Promise.all(searchPromises);

  // Add articles from search results
  searchResults.flat().forEach((article: any) => {
    if (article.url && !articlesMap.has(article.url)) {
      const normalizedTitle = normalizeTitle(article.title);
      if (!titleMap.has(normalizedTitle)) {
        articlesMap.set(article.url, {
          ...article,
          source_tier: 'high',
          source_category: 'competitive',
          source_type: 'targeted_search',
          relevance_score: 85  // High relevance since it's targeted
        });
        titleMap.set(normalizedTitle, article.url);
      }
    }
  });

  console.log(`✅ Added ${searchResults.flat().length} articles from targeted searches`);
} else {
  console.log('✅ Good competitor coverage, skipping targeted searches');
}

console.log(`\n📊 Final article count: ${articlesMap.size} total articles`);
```

**Benefits**:
- Guarantees competitor coverage
- Only runs when needed (coverage < threshold)
- Adds 5-25 targeted articles in ~30s
- Doesn't slow down pipeline if RSS already has good coverage

### Phase 2: Replace RSS with Hybrid (Long-term)
**Create**: `monitor-stage-1-hybrid/index.ts`

**Architecture**:
1. **Quick RSS scan** (30s) - Get breaking news
2. **Targeted searches** (parallel, 30s) - Fill competitor gaps
3. **Intelligence-based prioritization** - Focus on what matters

**Total time**: 60-70s (vs current 127s)
**Better coverage**: Guaranteed competitor representation

## Comparison Table

| Approach | Speed | Competitor Coverage | Cost | Recency |
|----------|-------|---------------------|------|---------|
| **Current (RSS only)** | 127s | 🔴 Poor (OpenAI-biased) | Free | Mixed |
| **Firecrawl only** | 90s | 🟢 Excellent | 💰💰 High | ✅ 24h |
| **Hybrid (Recommended)** | 70s | 🟢 Excellent | 💰 Low | ✅ 24h |

## Implementation Priority

### IMMEDIATE (Next 30 min)
✅ Add Phase 2.5 targeted searches to monitor-stage-1
- Simple code addition after line 609
- Only searches when coverage is poor
- Minimal API costs (5 searches max)

### SHORT-TERM (Next sprint)
⏳ Create monitor-stage-1-hybrid
- Redesign from ground up
- Use mcp-firecrawl as primary source
- RSS as backup/supplemental

### LONG-TERM (Future)
⏳ Intelligent source selection
- Learn which sources provide best competitor coverage
- Adapt searches based on trending topics
- Real-time cost optimization

## Summary

**Root Cause**: monitor-stage-1 uses generic RSS feeds that happen to be covering OpenAI heavily right now.

**Solution**: Add targeted competitor searches using mcp-firecrawl's `search_and_scrape` tool.

**Impact**:
- Better competitor coverage (currently 0-10%, target 30-40%)
- More actionable intelligence
- Minimal cost (5 searches per run)
- Small time increase (30s)
