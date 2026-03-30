# Firecrawl Website Scraping - Comprehensive Fix Plan

## Problem Summary

We need to scrape organization websites to extract entities for Schema.org generation. Current issues:
1. ❌ URL guessing produces 404s (8/10 pages failed for Mitsui)
2. ❌ Search endpoint misused (wrong response format: `data.web` not `data[]`)
3. ❌ Orchestrator CORS errors (function crashing before sending headers)

## Root Cause Analysis

**Using the wrong tool for the job:**
- Search endpoint is for web search queries, NOT site discovery
- We should use the **Map endpoint** which is specifically designed to discover all pages on a website

## Correct Firecrawl Approach

### Endpoint Choice Matrix

| Task | Correct Endpoint | Notes |
|------|-----------------|-------|
| Discover all pages on a site | `/v2/map` | Returns sitemap + discovered URLs |
| Search the web | `/v2/search` | Returns `{data: {web: [], news: []}}` |
| Scrape a known URL | `/v2/scrape` | Returns markdown/html content |
| Batch scrape multiple URLs | `/v2/batch/scrape` | Async, requires polling |

### API Response Formats (from working code + docs)

**Map Response:**
```typescript
{
  success: true,
  links: [
    { url: "https://example.com/page", title: "...", description: "..." }
  ]
}
```

**Search Response:**
```typescript
{
  success: true,
  data: {
    web: [{ url, title, description, markdown, metadata }],
    news: [{ url, title, snippet, date }],
    images: [{ url, imageUrl }]
  }
}
```

**Scrape Response:**
```typescript
{
  success: true,
  data: {
    markdown: "...",
    html: "...",
    metadata: {
      title: "...",
      statusCode: 200,
      error: null
    }
  }
}
```

## Implementation Plan

### Phase 1: Fix website-entity-scraper

**Step 1: Use Map Endpoint for Discovery**
```typescript
// Discover pages on the domain
const mapResponse = await fetch('https://api.firecrawl.dev/v2/map', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${firecrawlApiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: website_url,
    search: "about OR products OR services OR team OR contact", // Filter for relevant pages
    limit: 20, // Max pages to discover
    includeSubdomains: false,
    ignoreSitemap: false // Use sitemap if available
  })
})

const mapData = await mapResponse.json()
if (mapData.success && mapData.links) {
  pagesToScrape = mapData.links.map(link => link.url)
  console.log(`✅ Discovered ${pagesToScrape.length} pages via map`)
}
```

**Step 2: Scrape Discovered Pages**
```typescript
// Scrape in parallel (already correct)
const scrapePromises = pagesToScrape.map(async (pageUrl) => {
  const response = await fetch('https://api.firecrawl.dev/v2/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${firecrawlApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: pageUrl,
      formats: ['markdown'],
      onlyMainContent: true
    })
  })

  const data = await response.json()

  // Skip 404s
  if (data.data?.metadata?.statusCode === 404) {
    return null
  }

  return {
    url: pageUrl,
    title: data.data?.metadata?.title || '',
    markdown: data.data?.markdown || '',
    metadata: data.data?.metadata || {}
  }
})
```

### Phase 2: Fix Orchestrator CORS Errors

**Issue:** Function crashing before sending CORS headers

**Root Cause:** Search endpoint failure caused unhandled exception in website-entity-scraper

**Fix:**
1. ✅ Already added try-catch around search
2. ✅ Already added CORS headers to error responses in orchestrator
3. **NEW:** Switch from search to map endpoint (eliminates the error)

### Phase 3: Reference Implementations

**Working Examples in Codebase:**

1. **mcp-firecrawl/index.ts** (lines 360-385)
   - Correctly uses search endpoint
   - Properly accesses `searchData.data` (without iterating)

2. **niv-fireplexity/index.ts** (lines 246-249)
   - **CRITICAL PATTERN:**
     ```typescript
     const webResults = searchData.data?.web || []
     const newsResults = searchData.data?.news || []
     // NOT: for (const result of searchData.data)
     ```

## Testing Strategy

### Test 1: Map Endpoint Discovery
```bash
curl -X POST 'https://api.firecrawl.dev/v2/map' \
  -H 'Authorization: Bearer fc-3048810124b640eb99293880a4ab25d0' \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://www.mitsui.com",
    "search": "about OR products OR services",
    "limit": 10
  }'
```

**Expected:** List of actual pages (no 404s)

### Test 2: Full Pipeline
1. Map discovers 10-15 pages
2. Scrape filters out 404s (should be 0 with map)
3. Entity extraction gets meaningful content (not 404 pages)
4. Schema generation succeeds

## Rollout Plan

1. **Immediate:** Fix website-entity-scraper to use map endpoint
2. **Deploy:** Push and deploy website-entity-scraper
3. **Test:** Run schema generation for Mitsui
4. **Verify:** Check logs for:
   - Pages discovered via map
   - No 404 errors
   - Meaningful entity extraction
   - Schema generation success

## Success Criteria

- ✅ 0 HTTP 404 errors
- ✅ 10+ pages discovered per organization
- ✅ 5+ entities extracted (not 2)
- ✅ No CORS errors in orchestrator
- ✅ Complete schema generated with meaningful data

## Next Actions

1. Implement map endpoint in website-entity-scraper
2. Remove URL guessing logic entirely
3. Remove search endpoint logic (wrong tool)
4. Deploy and test
5. Document the correct Firecrawl patterns for future reference
