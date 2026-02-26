# MASTER INTELLIGENCE GATHERING FLOW
## The Complete Process for Real Intelligence

### PHASE 1: INTELLIGENT DISCOVERY (Claude Analyzes)
**Purpose:** Understand what we're looking for before we search

1. **Input:** Organization name + industry hint
2. **Claude Analysis:** 
   - Identifies industry category/subcategory
   - Maps to MasterSourceRegistry categories
   - Identifies likely competitors
   - Generates search keywords
   - Determines relevant source types

**Output:** Intelligence Blueprint
```json
{
  "organization": "Mitsui & Co.",
  "primary_category": "conglomerate",
  "sub_categories": ["trading", "energy", "infrastructure", "chemicals"],
  "mapped_registry_categories": ["finance", "energy", "manufacturing", "transportation"],
  "competitors": ["Mitsubishi Corp", "Sumitomo Corp", "Itochu", "Marubeni"],
  "search_keywords": ["sogo shosha", "trading house", "commodity trading"],
  "source_priorities": {
    "scrape_targets": ["mitsui.com", "mitsubishicorp.com", "sumitomocorp.com"],
    "rss_categories": ["finance", "energy", "asia_business"],
    "api_queries": ["Mitsui acquisition", "Japanese trading house"]
  }
}
```

### PHASE 2: SOURCE MAPPING
**Purpose:** Map intelligence needs to actual available sources

1. **MasterSourceRegistry Lookup:**
   - Get RSS feeds for identified categories
   - Get websites for scraping
   - Get Google News topics

2. **API Configuration:**
   - NewsAPI queries
   - Google News RSS feeds
   - Other available APIs

3. **Scraping Targets:**
   - Organization website
   - ALL competitor websites
   - Industry news sites from registry

**Output:** Source Execution Plan
```json
{
  "rss_feeds": [
    "https://www.ft.com/rss/home",
    "https://asia.nikkei.com/rss",
    "https://feeds.bloomberg.com/markets/news.rss"
  ],
  "scrape_urls": [
    "https://www.mitsui.com",
    "https://www.mitsubishicorp.com",
    "https://www.sumitomocorp.com",
    "https://www.itochu.co.jp",
    "https://www.marubeni.com"
  ],
  "api_calls": {
    "newsapi": ["Mitsui", "sogo shosha", "Japanese trading"],
    "google_news": ["Mitsui & Co", "Japanese conglomerate"]
  }
}
```

### PHASE 3: PARALLEL DATA GATHERING
**Purpose:** Gather from ALL sources simultaneously

1. **Scraper Intelligence:**
   - Scrape organization website
   - Scrape ALL competitor websites
   - Extract: leadership, press, products, jobs, patterns

2. **RSS Intelligence:**
   - Fetch from MasterSourceRegistry feeds
   - Filter by relevance
   - Extract recent articles

3. **API Intelligence:**
   - NewsAPI search with keywords
   - Google News RSS
   - Industry-specific APIs

4. **Database Lookups:**
   - Check indexed_sources table
   - Pull pre-indexed intelligence
   - Get historical patterns

**Output:** Raw Intelligence Package
```json
{
  "scraper_data": {
    "mitsui": { "leadership": [...], "press": [...], "jobs": {...} },
    "mitsubishi": { "leadership": [...], "press": [...], "jobs": {...} },
    "sumitomo": { "leadership": [...], "press": [...], "jobs": {...} }
  },
  "news_data": {
    "articles": [...],
    "sources": ["FT", "Bloomberg", "Nikkei"],
    "total": 150
  },
  "rss_data": {
    "finance_feeds": [...],
    "energy_feeds": [...],
    "asia_feeds": [...]
  },
  "patterns": {
    "growth_signals": [...],
    "risk_indicators": [...],
    "opportunities": [...]
  }
}
```

### PHASE 4: INTELLIGENT SYNTHESIS (Claude)
**Purpose:** Turn raw data into actionable intelligence

1. **Input ALL Data:**
   - Complete scraper results (all websites)
   - All news articles
   - RSS feed content
   - Detected patterns

2. **Multi-Persona Analysis:**
   - Competitive Strategist
   - Stakeholder Psychologist
   - Risk Prophet
   - Opportunity Hunter

3. **Generate Intelligence:**
   - Executive Summary
   - Competitive Analysis (using ALL competitor data)
   - Stakeholder Insights
   - Strategic Predictions
   - Actionable Recommendations

**Output:** Complete Intelligence Report

---

## IMPLEMENTATION CHECKLIST

### Current Problems:
- ❌ No initial Claude discovery phase
- ❌ Only scraping ONE website (not competitors)
- ❌ Not using MasterSourceRegistry
- ❌ News searches not finding relevant content
- ❌ Categories/subcategories mismatch
- ❌ No parallel gathering

### Required Fixes:
1. **Create Discovery Edge Function** - Claude analyzes org first
2. **Create Source Mapper** - Maps discovery to actual sources
3. **Fix Scraper** - Scrape multiple URLs from registry
4. **Fix News Gathering** - Use discovered keywords
5. **Create Orchestrator** - Manages the complete flow

### Edge Functions Needed:
1. `intelligent-discovery` - Phase 1
2. `source-mapper` - Phase 2  
3. `multi-scraper` - Enhanced scraper for multiple sites
4. `intelligence-orchestrator` - Manages complete flow

### Key Integration Points:
- MasterSourceRegistry.js - Source of truth for RSS/websites
- indexed_sources table - Pre-indexed intelligence
- scraper-intelligence - Website scraping
- news-intelligence - News gathering
- claude-intelligence-synthesizer-v2 - Final synthesis

---

## EXAMPLE FLOW FOR "MITSUI & CO."

1. **Discovery:**
   - Claude identifies: Japanese trading conglomerate
   - Maps to: finance + energy + manufacturing + transportation
   - Finds competitors: Mitsubishi, Sumitomo, Itochu, Marubeni

2. **Source Mapping:**
   - RSS: FT, Bloomberg, Nikkei Asia, Reuters Japan
   - Scrape: mitsui.com + 4 competitor sites
   - APIs: Search "sogo shosha", "Japanese trading house"

3. **Gathering:**
   - Scrapes 5 websites (not just 1!)
   - Pulls 50+ articles from RSS feeds
   - Gets 20+ news articles from APIs
   - Total data points: 200+

4. **Synthesis:**
   - Claude analyzes ALL data
   - Generates unique insights per tab
   - Provides actionable recommendations

This is what we SHOULD be doing!