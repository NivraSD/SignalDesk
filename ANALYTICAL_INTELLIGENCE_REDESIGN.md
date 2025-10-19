# Analytical Intelligence Hub Redesign

## Current Problem
The existing tab structure is oriented around strategic recommendations:
- Executive Overview (telling companies what to do)
- Competition (competitive strategy)
- Sentiment (market sentiment analysis)
- Risks (risk mitigation)
- Strategy (strategic planning)

This doesn't align with the goal of providing "hardcore analysis" of what IS happening.

## New Analytical Intelligence Structure

### Core Principle
Present WHAT IS HAPPENING, not what companies should do. Focus on data, patterns, and insights extracted from real sources.

### Proposed Tab Structure

#### 1. **Market Activity** 🌐
**Purpose:** Real-time view of what's happening in the market right now
**Content:**
- Latest news articles (last 7 days)
- Recent press releases
- Breaking announcements
- Market movements
- Industry events

**Data Sources:** NewsAPI, PR Intelligence, Google News, RSS Feeds

#### 2. **Competitor Intelligence** ⚔️
**Purpose:** Specific actions and movements by competitors
**Content:**
- Competitor press releases
- Product launches
- Leadership changes
- Hiring trends (from job postings)
- Partnership announcements
- Technology adoptions

**Data Sources:** Scraper (competitor websites), NewsAPI (competitor mentions), Google

#### 3. **Social Pulse** 💬
**Purpose:** What people are actually saying about the organization and industry
**Content:**
- Reddit discussions and sentiment
- Twitter/X mentions and engagement
- Social media trends
- Community feedback
- Public opinion shifts

**Data Sources:** Reddit Intelligence, Twitter Intelligence

#### 4. **Industry Signals** 📊
**Purpose:** Patterns and indicators in the broader industry
**Content:**
- Hiring trends across industry
- Investment patterns
- Technology adoption rates
- Regulatory changes
- Supply chain indicators
- Economic indicators

**Data Sources:** Industry RSS feeds, Google, Scraper (industry sites)

#### 5. **Media Coverage** 📰
**Purpose:** How the organization and competitors are being covered
**Content:**
- Press coverage analysis
- Blog mentions
- Video content (YouTube, etc.)
- Podcast mentions
- Coverage sentiment
- Share of voice vs competitors

**Data Sources:** NewsAPI, Google, RSS Feeds, PR Intelligence

## Data Display Format

### Each Tab Should Include:

1. **Summary Statistics**
   - Total data points collected
   - Time range of data
   - Source breakdown
   - Freshness indicator

2. **Key Findings**
   - Top 3-5 most important discoveries
   - Sorted by relevance/recency
   - Clear source attribution

3. **Detailed Analysis**
   - Categorized findings
   - Timeline view where applicable
   - Comparative analysis (vs competitors)
   - Trend indicators

4. **Raw Data Access**
   - Expandable sections with source data
   - Links to original sources
   - Timestamps for all data

## Intelligence Synthesis Requirements

### What the Synthesizer Should Produce:

```javascript
{
  "market_activity": {
    "summary": "152 market events analyzed from 7 sources",
    "key_findings": [
      {
        "finding": "Toyota announces $3B investment in US battery production",
        "source": "Reuters",
        "timestamp": "2024-01-15T10:30:00Z",
        "relevance": "high",
        "category": "investment"
      }
    ],
    "timeline": [...],
    "statistics": {
      "total_articles": 152,
      "sources": 7,
      "time_range": "7_days"
    }
  },
  "competitor_intelligence": {
    "competitors_tracked": ["Honda", "Nissan", "GM"],
    "movements": [...],
    "comparative_analysis": {...}
  },
  "social_pulse": {
    "sentiment_breakdown": {
      "positive": 45,
      "neutral": 89,
      "negative": 23
    },
    "trending_topics": [...],
    "engagement_metrics": {...}
  },
  "industry_signals": {
    "indicators": [...],
    "trends": [...],
    "patterns": [...]
  },
  "media_coverage": {
    "coverage_volume": 234,
    "share_of_voice": 0.34,
    "sentiment_trend": "improving",
    "top_narratives": [...]
  }
}
```

## Implementation Steps

1. **Update Claude Synthesizer (V5)**
   - Remove all strategic recommendations
   - Focus on categorizing and analyzing raw data
   - Output structured analytical insights

2. **Update Frontend Tabs**
   - Replace existing 5 tabs with new analytical tabs
   - Update IntelligenceDisplayV2.js component
   - Create new rendering logic for analytical data

3. **Update Data Formatter**
   - Transform synthesized data into tab-specific content
   - Ensure each tab has unique, relevant information
   - Add statistics and metadata

4. **Enhance Data Collection**
   - Ensure all sources are contributing data
   - Add time boundaries (7-day window)
   - Improve source attribution

## Success Metrics

- Each tab shows unique, relevant content (no duplication)
- All data is time-stamped and source-attributed
- No strategic recommendations or "what to do" advice
- Rich, diverse intelligence from multiple sources
- Quantitative metrics visible for each section
- Users can drill down to see raw data

## Visual Design Principles

1. **Data-First**: Numbers, counts, and metrics prominently displayed
2. **Source Attribution**: Every piece of info shows where it came from
3. **Temporal Context**: Clear indication of when things happened
4. **Comparative Views**: Show how metrics compare to competitors/baseline
5. **Drill-Down Capability**: Start with summary, allow expansion to details