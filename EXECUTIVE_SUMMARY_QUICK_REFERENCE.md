# Executive Summary Generation - Quick Reference

## File Location
`/Users/jonathanliebowitz/Desktop/signaldesk-v3/supabase/functions/mcp-executive-synthesis/index.ts`

## Quick Facts

### 1. What Gets Included in Executive Summary
- **80% of content** = Competitor & market events
- **20% of content** = Organization's own news
- **Minimum entities** = 10 different companies/people must be mentioned
- **Focus** = What's happening NOW (today/yesterday/days ago)
- **Recency rule** = Max 50 events total (40 competitor, 10 org)

### 2. How Competitor News is Prioritized vs Other News

**The 80/20 Rule (Lines 446-454):**
```
Total events selected: 50
- 40 events from eventsAboutOthers (competitors/market) = 80%
- 10 events from eventsAboutOrg (org's news) = 20%
```

**Result:** Competitor news is 4x more heavily weighted in the synthesis.

### 3. Recency Prioritization Rules

**System Prompt Level (Lines 723-734):**
1. HIGHEST: Today, yesterday, within 7 days
2. MEDIUM: 1-2 weeks ago (only if strategically significant)
3. LOW: Older than 2 weeks (only if major impact)
4. EXCLUDE: Older than 1 month (unless major strategic shift)

**User Prompt Level (Lines 570-574):**
- All 50 events are pre-sorted by date (most recent first)
- Dates formatted as: "Today", "3 days ago", "2 weeks ago"
- Claude instructed to PRIORITIZE recent events in summary

### 4. Who Gets Tracked (Discovery Targets)

**Source 1: intelligence_targets table** (Primary - Lines 223-245)
- Type: 'competitor' → Competitors list
- Type: 'stakeholder' or 'influencer' → Stakeholders list
- Type: 'topic' or 'keyword' → Topics list

**Source 2: Organization profile** (Fallback - Lines 248-268)
- Competitors: direct_competitors, indirect_competitors, emerging_threats
- Stakeholders: regulators, key_analysts, activists, major_investors, major_customers
- Topics: hot_topics, emerging_technologies, keywords, monitoring_config.keywords

### 5. Critical Content Categorization

**Competitive Moves:**
- Actions by industry competitors ONLY
- Do NOT include regulatory news here
- Example: PR firm wins new client = COMPETITIVE

**Stakeholder Dynamics:**
- Actions by regulators, analysts, investors
- May be outside the org's industry
- Example: SEC enforcement, analyst ratings = STAKEHOLDER

**Clear Boundary:** 
Events are NOT competitive just because regulators are involved. Only actual competitor actions count as "competitive_moves."

### 6. The Two-Prompt System

**System Prompt (Lines 707-752):**
- Role: Senior PR strategist
- Behavior: PRIORITIZE RECENT EVENTS
- Rules: Source only from provided data, no external knowledge
- Temperature: 0.3 (focused, deterministic)

**User Prompt (Lines 530-640):**
- Data: 20+ article summaries with relevance scores
- Data: 50 events (pre-sorted by recency)
- Data: 10+ quotes, metrics, key insights
- Instructions: Must cite from provided data only
- Requirements: 10+ entities, variety focus, cite actual events

### 7. JSON Output Structure

**Must Include:**
```json
{
  "synthesis": {
    "executive_summary": "2-3 paragraphs, today's findings only",
    "competitive_moves": {
      "immediate_threats": [],
      "opportunities": [],
      "narrative_gaps": []
    },
    "stakeholder_dynamics": {
      "key_movements": [],
      "influence_shifts": [],
      "engagement_opportunities": []
    },
    "media_landscape": {
      "trending_narratives": [],
      "sentiment_shifts": [],
      "journalist_interests": []
    },
    "pr_actions": {
      "immediate": [],
      "this_week": [],
      "strategic": []
    },
    "risk_alerts": {
      "crisis_signals": [],
      "reputation_threats": [],
      "mitigation_steps": []
    }
  }
}
```

### 8. Key Prompting Techniques Used

1. **Recency Emphasis:** Mentioned 5+ times in prompts
2. **Boundary Examples:** PR firm use case given twice
3. **Negative Examples:** "Warren Buffett investment 5 months ago dominates" = BAD
4. **Source Control:** "Your ONLY source", "events list IS your news"
5. **Structured Output:** Exact JSON structure provided
6. **Variety Requirement:** "MUST mention 10+ different companies"
7. **Gap Detection:** "Note if major competitors missing"

### 9. Data Flow

```
1. EXTRACT (monitoring-stage-2-enrichment)
   - Claude analyzes full articles
   - Pulls events with entity, type, date

2. ORGANIZE (prepareSynthesisContext)
   - Groups by event type (crisis, product, etc.)
   - Builds entity relationships
   - Creates evidence structures

3. FILTER (80/20 Weighting)
   - Separates org vs competitor events
   - Selects 40 competitor, 10 org

4. ENRICH (API Call Preparation)
   - Formats event dates as relative ("3 days ago")
   - Prepares article summaries with relevance
   - Creates discovery target lists

5. SYNTHESIZE (Claude Call)
   - System prompt sets behavior
   - User prompt delivers data + requirements
   - JSON schema defines output structure

6. STORE (Database Save)
   - Saves to executive_synthesis table
   - Also saves to content_library for Memory Vault
```

### 10. What NOT to Include

- External knowledge beyond provided articles
- Speculation or prediction not grounded in data
- Events older than 1 month (unless major shift)
- Regulatory news in "competitive_moves"
- Competitor news in "stakeholder_dynamics"
- Organization's own news dominating the analysis

## Critical Insight

**The system is designed to answer:** "What should this org pay attention to RIGHT NOW based on what happened today?"

Not: "What's the complete historical context?"

This is achieved through:
1. **Temporal Weighting:** Recent events 4x more prominent in instructions
2. **Content Weighting:** Competitor news 4x more voluminous (80/20 rule)
3. **Explicit Rules:** Multiple mentions of "focus on NOW", "today's monitoring"
4. **Format Control:** Pre-sorted events, relative dates, variety requirement

## Files Generated

1. **EXECUTIVE_SUMMARY_GENERATION_ANALYSIS.md** - Complete architecture & logic
2. **EXECUTIVE_SUMMARY_CODE_SNIPPETS.md** - Exact code locations & snippets
3. **EXECUTIVE_SUMMARY_QUICK_REFERENCE.md** - This file (quick lookup)

## All in One Place

Main file: `/Users/jonathanliebowitz/Desktop/signaldesk-v3/supabase/functions/mcp-executive-synthesis/index.ts`

Key functions:
- `prepareSynthesisContext()` - Lines 67-183
- `synthesizeExecutiveIntelligence()` - Lines 208-1160
- Event prioritization (80/20) - Lines 410-463
- Discovery targets loading - Lines 223-301
- System prompt - Lines 707-752
- User prompt - Lines 530-640
- JSON output template - Lines 602-636
- API call - Lines 695-760
- Response parsing - Lines 777-920
- Database storage - Lines 1051-1125
