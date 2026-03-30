# Fireplexity Root Cause Analysis

## **The Problem**

KARV (PR firm) monitoring returns irrelevant tech news (Nvidia, Meta, BBC) instead of PR industry news (Edelman, Weber Shandwick, FleishmanHillard).

**Despite having:**
- ✅ 10 PR firm competitors configured in `intelligence_targets`
- ✅ 3 PR industry stakeholders configured
- ✅ Proper industry: "Public Relations"
- ✅ Full company profile from mcp-discovery

**The monitoring finds:**
- ❌ 0 events about competitors
- ❌ 0 events about stakeholders
- ✅ 28 events about random tech companies (Nvidia, Meta, etc.)

---

## **Root Cause: AI Query Generation is BROKEN for PR Industry**

### The Code Path (niv-fireplexity-monitor-v2/index.ts:615-723)

```typescript
async function generateIntelligentQueries(profile, orgName, discoveryTargets, targetsByPriority) {
  const competitors = Array.from(discoveryTargets.competitors).slice(0, 10)
  const stakeholders = Array.from(discoveryTargets.stakeholders).slice(0, 5)

  const prompt = `You are a strategic intelligence analyst generating search queries for ${orgName}.

COMPANY CONTEXT:
Industry: ${profile.industry || 'Unknown'}  // = "Public Relations"

COMPETITORS TO MONITOR:
${competitors.join(', ')}  // = "Edelman, Weber Shandwick, FleishmanHillard, ..."

Generate 12 BROAD INDUSTRY QUERIES that will cast a wide net.

QUERY TYPES (all broad):

1. INDUSTRY NEWS (4 queries):
   - "${profile.industry || 'trading'} companies news"      // "Public Relations companies news" ← TOO BROAD
   - "commodity market developments"                         // ← WRONG INDUSTRY (for trading)
   - "${profile.industry || 'energy'} sector latest"        // "Public Relations sector latest" ← TOO GENERIC
   - "supply chain partnerships"                             // ← IRRELEVANT to PR

2. REGULATORY & LEGAL (4 queries):
   - "${profile.industry || 'energy'} company lawsuit"
   - "${profile.industry || 'trading'} investigation"
   - "${profile.industry || 'commodity'} violation"
   - "war crimes ${profile.industry || 'energy'}"            // ← COMPLETELY WRONG for PR

...
```

### **The Issue**

The AI prompt has HARDCODED EXAMPLES from a **trading/energy company** (Mitsui):
- "commodity market developments"
- "supply chain partnerships"
- "war crimes energy company"

For PR firms, these queries are **completely irrelevant**!

Even when AI substitutes the industry name, queries like:
- "Public Relations companies news" - Too generic, finds general PR industry coverage
- "Public Relations company lawsuit" - Finds lawsuits ABOUT PR firms, not BY competitors
- "war crimes Public Relations" - Makes no sense

### **What Fireplexity Actually Searches**

With these generic queries, Fireplexity/Firecrawl API:
1. Searches: "Public Relations companies news"
2. Finds: General business news mentioning "companies" and "news"
3. Returns: Whatever is trending (Nvidia AI deals, Meta antitrust, BBC)
4. Relevance filter sees "technology communications" and lets it through

---

## **Why the Fallback is Better**

The fallback function (lines 725-836) generates **competitor-specific queries**:

```typescript
// Add ALL competitor queries
allCompetitors.forEach(competitor => {
  queries.push(`${competitor} (announced OR launches OR unveils OR acquires OR partners)`)
  queries.push(`${competitor} (lawsuit OR investigation OR scandal OR regulatory OR violation)`)
})
```

This produces queries like:
- ✅ "Edelman (announced OR launches OR unveils OR acquires OR partners)"
- ✅ "Weber Shandwick (lawsuit OR investigation OR scandal)"
- ✅ "FleishmanHillard (announced OR launches OR unveils)"

These would actually find PR firm news!

---

## **Diagnosis: Why is AI Generation Being Used?**

The code tries AI first, falls back to static queries only if AI fails:

```typescript
let queries = await generateIntelligentQueries(...)  // AI approach (BROKEN)

if (queries.length === 0) {
  queries = generateRealtimeQueries(...)  // Fallback (WORKS)
}
```

**If AI returns ANY queries (even bad ones), fallback is never called!**

The AI prompt is bad, but it still returns 12 queries, so:
- ✅ AI succeeds technically (returns 12 queries)
- ❌ But queries are wrong for PR industry
- ❌ Fallback is never used

---

## **Additional Issues**

### 1. **Domain Restriction May Be Too Narrow**

Lines 958-971 restrict search to top 15 domains from company_profile:

```typescript
const topDomains = approvedDomains.slice(0, 15)
const siteRestrictions = topDomains.map(d => `site:${d}`).join(' OR ')
const domainRestrictedQuery = `(${siteRestrictions}) ${query}`
```

For KARV, these are likely:
- WSJ, Reuters, Bloomberg, FT, NYT (general business news)
- PR Newswire, Business Wire (press releases)
- **NOT** PR-specific outlets like PRWeek, Holmes Report, PRovoke

So even IF we had good queries, domain restriction might filter out PR industry news sources!

### 2. **Context Queries from Discovery**

Lines 745-759 check if profile has `monitoring_config.context_queries`:

```typescript
if (contextQueries && contextQueries.all && contextQueries.all.length > 0) {
  queries.push(...contextQueries.all)
}
```

Need to verify if mcp-discovery is generating PR-specific context queries or generic ones.

---

## **The Fix**

### Option 1: Disable AI Query Generation for Now
```typescript
// Force use of fallback (competitor-specific queries)
let queries: string[] = []

// Skip AI generation - use fallback directly
queries = generateRealtimeQueries(profile, orgName, recency_window, discoveryTargets, targetsByPriority, targetsWithContext)
```

### Option 2: Fix the AI Prompt to be Industry-Aware
The prompt needs to generate industry-specific query templates:

```typescript
const industryTemplates = {
  'Public Relations': {
    industry_news: [
      "PR agency acquisition",
      "communications firm expansion",
      "reputation management trends",
      "corporate communications news"
    ],
    regulatory: [
      "FTC advertising regulation",
      "PR ethics investigation",
      "lobbying disclosure"
    ],
    ...
  },
  'Trading': {
    industry_news: [
      "commodity market developments",
      "supply chain partnerships",
      ...
    ]
  }
}
```

### Option 3: Always Include Competitor-Specific Queries

Even if using AI, always add competitor queries:

```typescript
let queries = await generateIntelligentQueries(...)

// ALWAYS add competitor-specific queries regardless
const allCompetitors = Array.from(discoveryTargets.competitors)
allCompetitors.forEach(competitor => {
  queries.push(`${competitor} announced`)
  queries.push(`${competitor} acquisition`)
  queries.push(`${competitor} partnership`)
})
```

---

## **Recommended Immediate Fix**

**Bypass AI query generation and use competitor-specific fallback:**

```typescript
// Line 217 in niv-fireplexity-monitor-v2/index.ts
// BEFORE:
let queries = await generateIntelligentQueries(profile, orgName, discoveryTargets, targetsByPriority)

// AFTER:
console.log('   ⚠️ Skipping AI query generation - using competitor-specific queries')
let queries: string[] = []
```

This will force the fallback, which generates:
- Competitor-specific queries: "Edelman announced", "Weber Shandwick lawsuit"
- Industry-specific queries: "Public Relations (partnership OR acquisition)"
- Crisis detection: "Public Relations company (lawsuit OR investigation)"

These queries will actually find PR firm news instead of generic tech news.
