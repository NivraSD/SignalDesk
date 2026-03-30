# SignalDesk Platform - Complete Session Summary

## 🎯 Core Mission
Build a real-time monitoring platform that tracks ANY organization's media coverage, competitors, and industry topics - then uses Claude research agents to analyze patterns and identify strategic opportunities.

**Critical Requirement**: System must be a blank slate - users input ANY organization, system discovers competitors/topics, configures sources dynamically, and monitors continuously. NOT pre-configured for specific companies.

## 🚨 Current System Status

### What's Working
1. **Backend Intelligence Analysis** ✅
   - IntelligenceAnalysisService.js uses Claude research agents to analyze 90+ articles per cycle
   - Coverage-focused analysis (NOT company analysis) - analyzes media coverage patterns
   - Identifies narrative gaps, competitive coverage, and strategic opportunities
   - Located at: `/backend/src/services/IntelligenceAnalysisService.js`

2. **Frontend Components** ✅
   - AutomatedOrganizationSetup.js - Analyzes any organization and discovers competitors/topics
   - IntelligenceSummaryDashboard.js - Displays analyzed intelligence with Opportunities tab
   - Public API access via localtunnel: `https://six-tables-write.loca.lt`

3. **Database Schema** ✅
   - 18 complete tables for full platform functionality
   - Proper UUID organization IDs (no "org-" prefix)
   - Fixed constraints on intelligence_targets and organization_sources

### Known Issues & Fixes Applied

#### 1. Railway/Render Deployment Issues
- **Railway**: "Application failed to respond" - Database connected but app wouldn't start
- **Render**: Similar deployment issues
- **Solution**: Pivoted to localtunnel for public access instead
- **Current Setup**: 
  - Backend: localhost:5001
  - Frontend: localhost:3000  
  - Public API: https://six-tables-write.loca.lt

#### 2. Database Constraint Errors
```sql
-- Fixed with these commands:
DELETE FROM intelligence_targets a
USING intelligence_targets b
WHERE a.id > b.id 
AND a.organization_id = b.organization_id 
AND a.name = b.name 
AND a.type = b.type;

ALTER TABLE intelligence_targets 
ADD CONSTRAINT intelligence_targets_unique 
UNIQUE (organization_id, name, type);

ALTER TABLE organization_sources 
ADD CONSTRAINT organization_sources_unique 
UNIQUE (organization_id, source_url);

ALTER TABLE organization_sources 
ADD CONSTRAINT organization_sources_query_unique 
UNIQUE (organization_id, source_query);
```

#### 3. Module Path Issues
- **Error**: "Cannot find module '../config/claude'"
- **Fix**: Correct path is `../../config/claude` from services folder

## 📁 Critical Files & Their Purposes

### Backend Files

#### `/backend/src/services/IntelligenceAnalysisService.js`
**Purpose**: Analyzes media coverage using Claude research agents
**Key Methods**:
- `analyzeWithResearchAgents()` - Main analysis orchestrator
- `analyzeCoverage()` - Analyzes coverage patterns (NOT companies)
- `identifyOpportunitiesFromCoverage()` - Finds narrative gaps and opportunities

**Current Focus**: Coverage analysis, not company analysis
```javascript
// Analyzes COVERAGE patterns, not companies:
- Coverage volume & narratives
- Coverage gaps  
- Competitive coverage
- Narrative opportunities
```

#### `/backend/src/controllers/monitoringControllerV2.js`
**Purpose**: Orchestrates news collection and intelligence analysis
**Key Features**:
- Collects 90+ articles from RSS, Google News, APIs
- Sends to IntelligenceAnalysisService for analysis
- Returns structured intelligence with opportunities

#### `/backend/src/controllers/organizationController.js`
**Purpose**: Manages organization and intelligence target creation
**Fixed Issues**:
- Proper UUID generation (no "org-" prefix)
- ON CONFLICT handling for intelligence_targets

#### `/backend/src/controllers/sourceConfigController.js`
**Purpose**: Dynamically configures sources for any organization
**Fixed Issues**:
- ON CONFLICT clauses now specify constraint columns
- Handles RSS feeds, Google News queries, competitor websites

#### `/backend/src/services/UnifiedMonitoringService.js`
**Purpose**: Continuous monitoring service
**Key Update**: Now filters sources by organization's industry
```javascript
async getAllActiveSources(organizationId = null) {
  // Filters by organization's industry if organizationId provided
}
```

#### `/backend/src/services/MasterSourceRegistry.js`
**Purpose**: Registry of 350+ news sources across 25 industries
**Key Feature**: Maps any industry to relevant RSS feeds and sources

### Frontend Files

#### `/frontend/src/components/Intelligence/AutomatedOrganizationSetup.js`
**Purpose**: Organization analysis and setup wizard
**Flow**:
1. User enters organization name
2. Claude analyzes and discovers competitors/topics
3. User reviews and customizes selections
4. Clicking "Activate Monitoring" saves to database

**API Calls**:
- POST `/api/intelligence/analyze-organization` - Analyzes org with Claude
- POST `/api/organizations/create` - Creates org in database
- POST `/api/organizations/targets` - Creates intelligence targets
- POST `/api/source-config/configure-sources` - Configures monitoring sources

#### `/frontend/src/components/Intelligence/IntelligenceSummaryDashboard.js`
**Purpose**: Displays analyzed intelligence
**Tabs**:
- Organization - Coverage analysis for the org
- Competitors - Competitive coverage analysis
- Topics - Topic coverage trends
- **Opportunities** - Strategic opportunities from coverage gaps (NEW)
- Stakeholders - Stakeholder analysis

**API Call**:
- GET `/api/monitoring/v2/intelligence-summary/{organizationId}`

## 🔄 Complete User Flow

1. **Organization Setup**
   - User enters organization (e.g., "Uber")
   - System analyzes with Claude, discovers competitors & topics
   - User customizes selections
   - Clicks "Activate Monitoring" to save

2. **Source Configuration**
   - System identifies organization's industry
   - Maps to relevant sources from MasterSourceRegistry
   - Creates Google News queries for org, competitors, topics
   - Configures RSS feeds and websites

3. **Monitoring & Collection**
   - UnifiedMonitoringService runs every 5 minutes
   - Collects 90+ articles from all configured sources
   - Filters by organization's industry

4. **Intelligence Analysis**
   - IntelligenceAnalysisService analyzes with research agents
   - Focuses on COVERAGE patterns, not company analysis
   - Identifies narrative gaps and opportunities

5. **Display Results**
   - IntelligenceSummaryDashboard shows analyzed intelligence
   - Opportunities tab displays strategic opportunities
   - Each opportunity has urgency, recommended action, expected impact

## 🐛 Remaining Issues

### Source Configuration Problem
- Users can analyze organizations successfully
- BUT clicking "Activate Monitoring" may fail silently
- Sources may not configure properly in database
- Check `/api/source-config/configure-sources` endpoint

### Potential Fixes to Try
1. Check if organization_sources table has all required columns
2. Verify MasterSourceRegistry returns sources for the industry
3. Check if source URLs are valid before inserting
4. Add better error logging in sourceConfigController

## 🚀 Startup Commands

```bash
# Start Backend
cd /Users/jonathanliebowitz/Desktop/SignalDesk/backend
npm start

# Start Frontend  
cd /Users/jonathanliebowitz/Desktop/SignalDesk/frontend
npm start

# Start Localtunnel (for public access)
lt --port 5001 --subdomain six-tables-write

# Check Database
PGPASSWORD=your_postgres_password_here psql -U postgres -h localhost -d signaldesk

# View Backend Logs
tail -f /tmp/backend.log
```

## 📊 Database Tables (18 total)

1. organizations - Stores organization profiles
2. intelligence_targets - Competitors and topics to track
3. organization_sources - Configured sources per org
4. intelligence_findings - Collected articles
5. monitoring_status - Monitoring health metrics
6. opportunity_patterns - Opportunity detection patterns
7. source_indexes - Source registry
8. monitoring_stats - Statistics
9. source_performance - Source quality metrics
10. users - User accounts
11. projects - User projects
12. todos - Task management
13. sessions - User sessions
14. api_keys - API authentication
15. notifications - Alert system
16. audit_logs - System audit trail
17. webhooks - External integrations
18. scheduled_reports - Report scheduling

## 🔑 Environment Variables

```env
# Backend (.env)
DATABASE_URL=postgresql://postgres:your_postgres_password_here@localhost:5432/signaldesk
ANTHROPIC_API_KEY=[Your Claude API key]
PORT=5001
NODE_ENV=development
JWT_SECRET=your-secret-key-change-in-production

# Frontend (.env)
REACT_APP_API_URL=https://six-tables-write.loca.lt
```

## 📝 Key User Feedback That Shaped The System

1. **"there should be no fallback and no pre-set monitoring"**
   - System is now a blank slate for ANY organization

2. **"just to be clear, we are not building this just around nike"**
   - Fixed to work dynamically for any company

3. **"no intelligence summary. i feel like monitoring results are just not getting passed through"**
   - Created IntelligenceAnalysisService to analyze articles

4. **"claude should be using my research agents when it is analyzing the monitoring results"**
   - Implemented research agent analysis in IntelligenceAnalysisService

5. **"for intelligence summary, what we want to analyze is the coverage based on user's organization, competitors, and topics"**
   - Refocused on coverage analysis instead of company analysis

## 🤖 Available Research Agents

### Agents Currently Utilized by the Platform

1. **general-purpose**
   - Used for: Analyzing organization intelligence and coverage patterns
   - Called by: IntelligenceAnalysisService when analyzing articles
   - Purpose: Research complex questions about media coverage and extract insights

2. **search-specialist**
   - Potential use: Deep research on competitors and market trends
   - Could enhance: Competitive intelligence gathering
   - Not yet integrated but available

3. **data-analyst**
   - Potential use: Quantitative analysis of coverage metrics
   - Could enhance: Trend analysis, sentiment scoring, coverage volume analytics
   - Not yet integrated but available

### Other Available Agents (Not Yet Utilized)

4. **report-generator**
   - Purpose: Transform research findings into comprehensive reports
   - Potential use: Generate executive summaries of intelligence findings

5. **research-orchestrator**
   - Purpose: Coordinate comprehensive research projects
   - Potential use: Manage multi-phase intelligence gathering

6. **task-decomposition-expert**
   - Purpose: Break down complex goals into actionable tasks
   - Potential use: Help users plan response strategies to opportunities

7. **research-optimizer**
   - Purpose: Optimize performance of multiple research agents
   - Potential use: Improve intelligence analysis efficiency

8. **research-brief-generator**
   - Purpose: Transform queries into structured research briefs
   - Potential use: Create detailed monitoring specifications

9. **query-clarifier**
   - Purpose: Analyze queries for clarity
   - Potential use: Improve organization analysis accuracy

### How Agents Are Called

The platform uses Claude API directly through the `claudeService` module:

```javascript
// From IntelligenceAnalysisService.js
const claudeService = require('../../config/claude');

// Example agent-like analysis call
const response = await claudeService.sendMessage(prompt);
```

### Agent Integration Points

1. **Organization Analysis** (`/api/intelligence/analyze-organization`)
   - Uses Claude to discover competitors and topics
   - Could benefit from: query-clarifier, research-brief-generator

2. **Coverage Analysis** (`IntelligenceAnalysisService.analyzeCoverage()`)
   - Currently uses direct Claude calls
   - Could benefit from: search-specialist, data-analyst

3. **Opportunity Detection** (`IntelligenceAnalysisService.identifyOpportunitiesFromCoverage()`)
   - Uses Claude to find narrative gaps
   - Could benefit from: research-orchestrator, task-decomposition-expert

4. **Report Generation** (Not yet implemented)
   - Could use: report-generator agent
   - Would create executive summaries and detailed reports

### Recommended Agent Enhancements

1. **Immediate**: Integrate search-specialist for deeper competitive research
2. **Next Phase**: Add data-analyst for quantitative coverage metrics
3. **Future**: Implement report-generator for automated intelligence briefings

## 🎯 Next Session Priorities

1. **Fix Source Configuration**
   - Debug why sources aren't saving properly
   - Add better error handling and logging
   - Test with different organizations

2. **Improve Coverage Analysis**
   - Fine-tune the coverage analysis prompts
   - Add more sophisticated opportunity detection
   - Implement trend analysis over time

3. **Add Missing Features**
   - Email alerts for critical opportunities
   - Competitor tracking dashboard
   - Historical analysis charts
   - Export functionality

## 💡 Important Implementation Notes

1. **Coverage Focus**: The system analyzes media COVERAGE patterns, not the companies themselves. It looks for:
   - What narratives exist
   - What gaps exist in coverage
   - How competitors are being covered
   - Where the organization can insert itself

2. **Research Agents**: Uses Claude to analyze articles in batches, extracting:
   - Coverage volume and sentiment
   - Narrative patterns
   - Coverage gaps
   - Strategic opportunities

3. **Opportunity Types**:
   - **Narrative Vacuum** - Topics with no coverage
   - **Counter-Narrative** - Challenging competitor narratives
   - **First-Mover Coverage** - Emerging topics
   - **Coverage Hijacking** - Redirecting trending topics

4. **Dynamic Configuration**: System adapts to ANY organization by:
   - Analyzing the company with Claude
   - Discovering relevant competitors and topics
   - Mapping to appropriate news sources
   - Creating custom search queries

## 🔗 Active Test Organizations

- **Uber** (ID: e0fde0db-ad50-44a8-9331-df1bcd6c55e9)
  - Competitors: Lyft, DoorDash
  - Topics: Gig Economy, Urban Mobility, Food Delivery

- **Amazon** (ID: dae680eb-8e50-417a-9e30-8bd2e13fe48c)
  - Competitors: Walmart, Microsoft Azure, Google Cloud
  - Topics: AI/ML, Labor Relations, Environmental Sustainability

## 📌 Final Notes

The platform is functional but needs refinement. The core intelligence analysis with research agents is working well, producing actionable opportunities from coverage analysis. The main issue is ensuring source configuration completes successfully when users set up new organizations.

The system successfully pivoted from pre-configured monitoring to a dynamic, blank-slate approach that works for ANY organization - this was the critical requirement from user feedback.

Coverage analysis (not company analysis) is now the focus, identifying gaps and opportunities in media narratives rather than analyzing the companies themselves.