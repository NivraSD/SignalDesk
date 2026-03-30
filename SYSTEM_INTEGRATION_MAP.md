# SignalDesk System Integration Map
## Making All Parts Work Together

### Current Problem
The system has powerful components that don't know about each other:
- Edge Functions don't use MasterSourceRegistry
- MCPs don't access industryKeywordDatabase  
- Intelligence Hub doesn't query source_indexes
- No central orchestration

### Available Resources (Currently Disconnected)

#### 1. Data Sources
- **MasterSourceRegistry** (`/src/services/MasterSourceRegistry.js`)
  - 25 industries with RSS feeds, Google News queries, websites
  - Technology, Finance, Healthcare, Energy, Retail, etc.
  - Each industry has 10-20 RSS feeds, keywords, and sites

- **source_indexes table** (PostgreSQL)
  - Pre-populated with all industry sources
  - Contains entity_data and index_data
  - Ready to query but unused

#### 2. Intelligence Assets  
- **industryKeywordDatabase** (`/frontend/src/services/industryKeywordDatabase.js`)
  - Keywords per industry
  - Major players/competitors per industry
  - Trending topics per industry

- **competitorIntelligenceService** 
  - Maps organizations to industries
  - Identifies competitors
  - Currently returns mock data

#### 3. Edge Functions (Currently Mock)
- **pr-intelligence** - Returns fake competitors
- **news-intelligence** - Partially working but doesn't use industry data
- **media-intelligence** - Returns empty arrays
- **opportunities-intelligence** - Returns mock data

#### 4. Frontend Services
- **intelligenceGatheringService** - Calls MCPs but gets mock data
- **IntelligenceHub/IntelligenceCommand** - Displays whatever it gets

### THE FIX: Unified Intelligence Pipeline

```
Organization Input (from Onboarding)
    ↓
Industry Identification 
    ↓
Pull from MasterSourceRegistry + industryKeywordDatabase
    ↓
Edge Functions use REAL sources
    ↓
Actual data gathering from RSS/News/APIs
    ↓
Analysis and pattern detection
    ↓
Intelligence Hub displays REAL intelligence
```

### Implementation Steps

#### Step 1: Create Central Intelligence Config
```javascript
// /supabase/functions/_shared/intelligenceConfig.ts
export class IntelligenceConfig {
  static async getOrganizationIntelligence(org: Organization) {
    // 1. Identify industry
    const industry = this.identifyIndustry(org);
    
    // 2. Get sources from database
    const sources = await this.getIndustrySources(industry);
    
    // 3. Get competitors from database
    const competitors = await this.getIndustryCompetitors(industry);
    
    // 4. Get keywords from database
    const keywords = await this.getIndustryKeywords(industry);
    
    return {
      industry,
      sources,
      competitors,
      keywords,
      monitoring: {
        rss_feeds: sources.rss,
        news_queries: sources.google_news,
        websites: sources.websites
      }
    };
  }
}
```

#### Step 2: Update Each Edge Function
```typescript
// Example: pr-intelligence
import { IntelligenceConfig } from '../_shared/intelligenceConfig';

serve(async (req) => {
  const { organization } = await req.json();
  
  // Get REAL data based on organization
  const config = await IntelligenceConfig.getOrganizationIntelligence(organization);
  
  // Use REAL sources to gather intelligence
  const competitorData = await gatherFromSources(config.sources, config.competitors);
  
  // Return REAL analysis
  return new Response(JSON.stringify({
    success: true,
    data: {
      competitors: competitorData,
      industry: config.industry,
      insights: analyzeCompetitors(competitorData)
    }
  }));
});
```

#### Step 3: Standard Intelligence Formula (Same for Every Organization)

1. **Onboarding captures**:
   - Organization name
   - Industry selection
   - Key stakeholders

2. **System automatically determines**:
   - Industry sources (from MasterSourceRegistry)
   - Competitors (from industryKeywordDatabase)
   - Keywords to monitor
   - RSS feeds to watch
   - News queries to run

3. **Every hour, system**:
   - Fetches from all RSS feeds for that industry
   - Runs Google News queries
   - Analyzes competitor mentions
   - Detects opportunities
   - Updates Intelligence Hub

4. **Intelligence Hub shows**:
   - Real competitor movements
   - Actual industry news
   - True trending topics
   - Genuine opportunities
   - Real-time alerts

### Database Schema Needed

```sql
-- Already exists but needs to be used
SELECT * FROM source_indexes WHERE entity_type = 'industry' AND entity_name = 'technology';

-- Need to add
CREATE TABLE organization_intelligence (
  id SERIAL PRIMARY KEY,
  organization_id UUID,
  industry VARCHAR(100),
  competitors JSONB,
  keywords JSONB,
  sources JSONB,
  last_updated TIMESTAMP
);
```

### Files That Need Updates

1. **Edge Functions** (all of them):
   - `/supabase/functions/pr-intelligence/index.ts`
   - `/supabase/functions/news-intelligence/index.ts`
   - `/supabase/functions/media-intelligence/index.ts`
   - `/supabase/functions/opportunities-intelligence/index.ts`

2. **Shared Config** (create new):
   - `/supabase/functions/_shared/intelligenceConfig.ts`
   - `/supabase/functions/_shared/sourceRegistry.ts`

3. **Frontend** (update to expect real data):
   - `/frontend/src/services/intelligenceGatheringService.js`
   - `/frontend/src/components/Modules/IntelligenceCommand.js`

### Expected Outcome

When a user onboards with "OpenAI" in "AI" industry:
1. System identifies them as Technology industry
2. Pulls Technology sources from MasterSourceRegistry
3. Identifies competitors: Google, Microsoft, Anthropic, Meta
4. Monitors 20 RSS feeds, 14 keywords, 6 websites
5. Every refresh shows REAL news about AI, competitors, opportunities
6. Intelligence Hub displays actionable insights, not mock data

### This fixes:
- ✅ Parts not knowing about each other
- ✅ Mock data everywhere
- ✅ No real intelligence generation
- ✅ Disconnected systems
- ✅ No formulaic process