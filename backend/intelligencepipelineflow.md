# Intelligence Pipeline Flow Documentation
**Last Updated: August 28, 2025**
**Status: PRODUCTION READY - Supabase-Only Architecture**

## Overview
The SignalDesk Intelligence Pipeline is a 6-stage AI-powered system that collects, analyzes, and synthesizes comprehensive intelligence about organizations. It utilizes multiple monitoring systems, Claude AI analysis, and generates actionable PR opportunities.

## Architecture
- **Backend**: Supabase Edge Functions (100% serverless)
- **Frontend**: React app deployed on Vercel
- **Database**: Supabase PostgreSQL
- **AI**: Claude 3 Haiku for analysis
- **Monitoring**: RSS, Firecrawl, Yahoo Finance, News APIs

## Pipeline Stages

### Stage 1: Organization Data Extraction
**Edge Functions**: 
- `intelligence-discovery-v3` - Discovers entities and stakeholders
- `intelligence-collection-v1` - Collects signals from monitoring systems

**Data Collection**:
- RSS Feeds: 50 articles from Master Source Registry
- Firecrawl: Top 5 competitors analyzed
- Monitoring System: Real-time intelligence findings
- Timeout: 40 seconds for collection

**Output**: 50-100+ signals with organization profile

### Stage 2: Competitive Intelligence Analysis
**Edge Function**: `intelligence-stage-1-competitors`

**Analysis**:
- Direct competitors with threat levels
- Indirect and emerging competitors
- Market positioning and battle cards
- Disruption threats assessment
- Claude AI provides strategic insights

**Output**: Competitive landscape with actionable intelligence

### Stage 3: Stakeholder Analysis
**Edge Function**: `intelligence-stage-2-media`

**Analysis**:
- Media sentiment and coverage gaps
- Journalist relationships
- Influencer mapping
- Stakeholder power/interest matrix

**Output**: Media landscape and engagement strategies

### Stage 4: Media Landscape Mapping
**Edge Function**: `intelligence-stage-2-media` (shared)

**Analysis**:
- Coverage analysis by outlet
- Narrative themes and trends
- Media opportunities identification
- Content gap analysis

**Output**: Media strategy recommendations

### Stage 5: Regulatory Environment
**Edge Function**: `intelligence-stage-3-regulatory`

**Analysis**:
- Current regulatory landscape
- Compliance requirements
- Upcoming regulatory changes
- Risk assessment

**Output**: Regulatory compliance roadmap

### Stage 6: Market Trends & Strategic Synthesis
**Edge Function**: `intelligence-stage-5-synthesis`

**Synthesis**:
- Pattern recognition across all stages
- Cascade effect predictions
- Elite strategic insights
- Executive summary generation
- **Consolidated opportunities with prioritization**

**Output**: 
- Strategic recommendations
- Action matrix (urgent/important)
- **4-8 prioritized PR opportunities**
- Executive dashboard

## Data Flow

```
User selects organization
    ↓
Frontend (MultiStageIntelligence.js)
    ↓
Stage 1: Discovery + Collection (40s)
    ├── RSS: 50 articles
    ├── Firecrawl: 5 competitors
    └── Monitoring: Real-time findings
    ↓
Stage 2: Competitive Analysis (15s)
    └── Claude AI analysis
    ↓
Stage 3: Stakeholder Mapping (15s)
    └── Claude AI analysis
    ↓
Stage 4: Media Landscape (15s)
    └── Claude AI analysis
    ↓
Stage 5: Regulatory Analysis (15s)
    └── Claude AI analysis
    ↓
Stage 6: Synthesis (20s)
    ├── Pattern recognition
    ├── Opportunity generation
    └── Strategic recommendations
    ↓
Save to Supabase
    ↓
Display in UI with opportunities
```

## Timing & Performance

**Total Pipeline Duration**: 2-3 minutes
- Stage delays: 3 seconds between stages
- Claude AI processing: 10-30 seconds per stage
- Monitoring collection: 40 seconds max
- Individual collectors timeout: 15 seconds

**Data Volume**:
- Signals collected: 50-100+ per run
- Opportunities generated: 4-8 per run
- Data sources: 10+ integrated APIs

## Key Components

### Frontend
- **MultiStageIntelligence.js**: Orchestrates pipeline execution
  - Prevents parallel execution with `runningRef`
  - 5-minute cache expiration for fresh runs
  - Extracts opportunities from `consolidated_opportunities.prioritized_list`

- **intelligenceOrchestratorV4.js**: Handles stage communication
  - Calls edge functions sequentially
  - Manages stage transitions
  - Collects and passes results between stages

- **OpportunityEngine.js**: Displays opportunities
  - Loads from Supabase (not localStorage)
  - Extracts from synthesis stage
  - Real-time opportunity updates

### Edge Functions (Supabase)
All functions include:
- Claude AI integration (ANTHROPIC_API_KEY)
- Error handling and timeouts
- CORS headers
- Result persistence to Supabase

### Monitoring Systems
1. **RSS Feed Aggregator** (`source-registry`)
   - Industry-specific feeds
   - 50 article limit per request
   
2. **Firecrawl API**
   - Competitor website analysis
   - 5 competitors per run
   
3. **Monitoring Intelligence**
   - Real-time event detection
   - Priority-based findings

## Opportunity Generation

Opportunities are generated at multiple stages and consolidated in synthesis:

1. **Stage-level opportunities**: Each stage can generate specific opportunities
2. **Synthesis consolidation**: All opportunities are prioritized and ranked
3. **Structure**:
```javascript
{
  opportunity: "Description",
  source_stage: "stage_name",
  type: "narrative|competitive|regulatory|trend",
  urgency: "high|medium|low",
  confidence: 85,
  pr_angle: "Specific PR approach",
  quick_summary: "Brief summary"
}
```

## Cache & Persistence

- **Supabase-only**: No localStorage for intelligence data
- **Cache expiration**: 5 minutes for analysis data
- **Organization profiles**: Stored in `intelligence_targets` table
- **Stage results**: Stored in `intelligence_findings` table
- **Opportunities**: Extracted from synthesis stage

## Recent Fixes (August 28, 2025)

1. **Monitoring Collection**:
   - Increased RSS limit: 20 → 50 articles
   - More competitors analyzed: 3 → 5
   - Extended timeout: 25s → 40s
   - Result: 50-100+ signals (was 20)

2. **Pipeline Execution**:
   - Fixed parallel execution issues
   - Added proper stage delays (3s)
   - Prevented duplicate runs with `runningRef`
   - Reduced useEffect dependencies

3. **Opportunity Display**:
   - Fixed extraction from synthesis stage
   - Updated OpportunityEngine for Supabase
   - Proper opportunity mapping in UI

4. **Claude AI Integration**:
   - Verified API keys configured
   - Proper delays for AI processing
   - All stages now call Claude

## Environment Variables

### Supabase Secrets (Configured):
- ANTHROPIC_API_KEY ✅
- CLAUDE_API_KEY ✅
- FIRECRAWL_API_KEY ✅
- NEWS_API_KEY ✅
- REDDIT_CLIENT_ID ✅
- REDDIT_CLIENT_SECRET ✅
- TWITTER_BEARER_TOKEN ✅

### Frontend (.env):
```
REACT_APP_SUPABASE_URL=https://zskaxjtyuaqazydouifp.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbG...
```

## Deployment

### Frontend (Vercel)
- Repository: NivraSD/SignalDesk
- Deploy from: Root directory
- Auto-deploy on push to main
- URL: https://signaldesk.vercel.app

### Edge Functions (Supabase)
```bash
# Deploy individual function
supabase functions deploy [function-name]

# Deploy all functions
supabase functions deploy --all
```

## Testing

### Test Pipeline Locally
1. Open `/test-pipeline-live.html` in browser
2. Enter organization name
3. Click "Run Full Pipeline"
4. Monitor stage progress
5. View opportunities in output

### Verify Deployment
1. Check Vercel: https://signaldesk.vercel.app
2. Select/create organization
3. Watch Intelligence Hub progress
4. Verify opportunities display

## Troubleshooting

### Pipeline runs too fast (< 1 minute)
- Check if Claude AI is being called
- Verify edge function timeouts
- Check stage delays (should be 3s)

### Only 20 signals collected
- Verify RSS limit is 50
- Check Firecrawl competitor count
- Ensure monitoring timeout is 40s

### No opportunities showing
- Check synthesis stage output
- Verify `consolidated_opportunities.prioritized_list`
- Check OpportunityEngine loads from Supabase

### Parallel execution issues
- Verify `runningRef` guard in place
- Check useEffect dependencies
- Ensure single stage runs at a time

## Success Metrics

✅ **Working Pipeline**:
- Duration: 2-3 minutes
- Signals: 50-100+
- Opportunities: 4-8
- All 6 stages complete
- Claude AI analysis at each stage
- Opportunities display in UI

## Future Enhancements

1. **Additional Monitoring**:
   - LinkedIn integration
   - Google News API
   - Industry-specific databases

2. **Advanced Analytics**:
   - Sentiment analysis
   - Trend prediction
   - Competitive scoring

3. **Automation**:
   - Scheduled pipeline runs
   - Alert system for opportunities
   - Automated report generation