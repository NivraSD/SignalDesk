# SignalDesk Project Structure

## Overview
SignalDesk is a comprehensive PR and communications intelligence platform that monitors 352+ sources across 25 industries, detects opportunities in real-time, and provides strategic insights for organizations.

---

## 🎯 Backend Structure (`/backend`)

### Core Server Files
```
backend/
├── server.js                    # Main Express server (port 5001)
├── package.json                 # Dependencies and scripts
├── .env                        # Environment variables (API keys, DB credentials)
└── start-unified-monitoring.js  # Launches continuous monitoring service
```

### `/src` Directory Structure

#### `/src/config`
```
config/
├── db.js                       # PostgreSQL connection pool
├── claude.js                   # Claude AI service configuration
├── claude-backup.js            # Backup Claude configuration
└── campaignTypeConfigs.js      # Campaign type definitions
```

#### `/src/controllers`
Core business logic controllers:
```
controllers/
├── monitoringControllerV2.js   # Main monitoring & opportunity detection
├── intelligenceMonitoringController.js  # Intelligence gathering & RSS feeds
├── organizationAnalysisController.js    # Organization analysis with Claude
├── stakeholderIntelligenceController.js # Stakeholder management
├── opportunitiesController.js           # Opportunity management
├── campaignIntelligenceController.js    # Campaign intelligence
├── mediaController.js                   # Media management
├── assistantController.js               # AI assistant integration
├── crisisController.js                  # Crisis management
├── contentController.js                 # Content generation
└── simplifiedMonitoringController.js    # Simplified monitoring endpoints
```

#### `/src/services`
Business logic and data processing services:
```
services/
├── MasterSourceRegistry.js      # 352+ sources across 25 industries
├── UnifiedMonitoringService.js  # Continuous monitoring engine
├── NewsRoundupService.js        # News aggregation and roundup
├── SourceDiscoveryService.js    # Dynamic source discovery
├── OpportunityDetectionService.js       # Opportunity pattern detection
├── MonitoringDiagnosticService.js       # System diagnostics
├── StrategicMonitoringCoordinator.js    # Strategic monitoring orchestration
├── IntelligentIndexingAgent.js          # Content indexing
├── sentimentEngine.js                   # Sentiment analysis
├── mediaSearchService.js                # Media search functionality
└── intelligenceIndexer.js               # Intelligence data indexing
```

#### `/src/routes`
API endpoint definitions:
```
routes/
├── monitoringRoutesV2.js        # /api/monitoring/v2/* endpoints
├── intelligenceRoutes.js        # /api/intelligence/* endpoints
├── stakeholderIntelligenceRoutes.js    # /api/stakeholder-intelligence/*
├── opportunitiesRoutes.js              # /api/opportunities/*
├── sourceIndexRoutes.js                # /api/source-index/*
├── assistantRoutes.js                  # /api/assistant/*
├── campaignRoutes.js                   # /api/campaigns/*
├── contentRoutes.js                    # /api/content/*
├── crisisRoutes.js                     # /api/crisis/*
├── mediaRoutes.js                      # /api/media/*
└── proxy.js                            # /api/proxy/* (external API proxy)
```

#### `/src/middleware`
```
middleware/
├── auth.js                     # JWT authentication middleware
└── authMiddleware.js           # Authorization checks
```

#### `/src/agents`
AI-powered agents for various tasks:
```
agents/
├── OpportunityEngineOrchestration.js   # Opportunity detection orchestration
├── topicMomentumAgents.js              # Topic trend analysis
└── [other agent implementations]
```

#### `/src/utils`
Utility functions and helpers:
```
utils/
├── ensureIntelligenceTargets.js # Target configuration utilities
├── generateNewsRoundup.js       # News roundup generation
└── [other utility functions]
```

### `/scripts`
Automation and setup scripts:
```
scripts/
├── populate-source-indexes.js   # Populates DB with all 352+ sources
├── seedIntelligenceDB.js        # Seeds initial intelligence data
└── run-opportunity-migration.js # Database migrations
```

### `/test-files`
Testing scripts:
```
├── test-intelligence-system.js  # Intelligence system tests
├── test-opportunities.js        # Opportunity detection tests
├── test-monitoring-endpoint.js  # API endpoint tests
└── [other test files]
```

---

## 🎨 Frontend Structure (`/frontend`)

### Core React App Files
```
frontend/
├── src/
│   ├── index.js               # React app entry point
│   ├── App.js                 # Main app component with routing
│   ├── App.css                # Global styles
│   └── index.css              # Base styles
├── public/
│   ├── index.html             # HTML template
│   └── [static assets]
└── package.json               # Dependencies and scripts
```

### `/src/components` Directory Structure

#### Intelligence Components
```
components/Intelligence/
├── IntelligenceSummaryDashboard.js     # Main intelligence dashboard
├── IntelligenceConfiguration.js        # Configure monitoring targets
├── OpportunityDetection.js             # Real-time opportunity detection
├── OpportunityDashboard.js             # Opportunity management
├── OpportunityExecution.js             # Execute on opportunities
└── [other intelligence components]
```

#### Stakeholder Intelligence Components
```
components/StakeholderIntelligence/
├── StakeholderIntelligenceHub.js       # Main hub (Opportunity Engine)
├── PRStrategyAdvisor.js                # PR strategy recommendations
├── PRMonitoringDashboard.js            # PR monitoring interface
├── AgenticMonitoring.js                # Agent-based monitoring
├── StakeholderAIAdvisor.js             # AI-powered stakeholder insights
├── SmartStakeholderBuilder.js          # Stakeholder profile builder
└── [other stakeholder components]
```

#### Opportunity Discovery Components
```
components/OpportunityDiscovery/
├── OpportunityDiscoveryDashboard.js    # Opportunity discovery interface
├── AutomatedOpportunityDiscovery.js    # Automated discovery system
└── [opportunity-related components]
```

#### Campaign Components
```
components/Campaign/
├── CampaignIntelligence.js             # Campaign intelligence dashboard
├── CampaignAssistant.js                # AI campaign assistant
├── CompetitorAnalysis.js               # Competitor tracking
├── InfluencerIdentification.js         # Influencer discovery
├── ContentOptimizer.js                 # Content optimization
└── PredictiveAnalytics.js              # Predictive insights
```

#### Layout Components
```
components/Layout/
├── Layout.js                   # Main layout wrapper
├── Navigation.js               # Navigation menu
├── Header.js                   # Header component
└── Footer.js                   # Footer component
```

#### Other Components
```
components/
├── Login.js                    # Authentication
├── Dashboard.js                # Main dashboard
├── Projects.js                 # Project management
├── ProjectManagement.js        # Advanced project features
├── MediaAssets.js              # Media management
├── CrisisManagement.js         # Crisis response
├── AgenticScanning.js          # Agent-based scanning
└── [other components]
```

### `/src/services`
Frontend service layer:
```
services/
├── apiService.js                       # API communication layer
├── narrativeVacuumService.js           # Narrative opportunity detection
├── prDetectionService.js               # PR opportunity detection
├── unifiedIntelligenceService.js       # Unified intelligence management
├── stakeholderService.js               # Stakeholder data management
├── intelligenceService.js              # Intelligence data service
├── opportunityService.js               # Opportunity management
└── [other services]
```

### `/src/context`
React Context providers:
```
context/
├── AuthContext.js              # Authentication state
├── IntelligenceContext.js      # Intelligence data state
└── [other contexts]
```

### `/src/utils`
Utility functions:
```
utils/
├── debugDataFlow.js            # Data flow debugging
└── [other utilities]
```

### `/src/hooks`
Custom React hooks:
```
hooks/
├── useIntelligence.js          # Intelligence data hook
├── useAuth.js                  # Authentication hook
└── [other custom hooks]
```

---

## 🗄️ Database Structure (PostgreSQL)

### Core Tables
```sql
-- Organization & Configuration
organizations                   # Organization profiles
intelligence_targets            # Monitoring targets per organization
source_indexes                  # 352+ sources across 25 industries (master registry)

-- Intelligence & Monitoring
intelligence_findings           # Collected articles and content
monitoring_status              # Real-time monitoring status
news_articles                  # Archived news articles

-- Opportunities
opportunity_queue              # Detected opportunities (123+ active)
opportunity_patterns           # Opportunity detection patterns
opportunity_history            # Historical opportunity data
opportunity_feedback           # User feedback on opportunities
intelligence_opportunities     # Processed opportunities

-- Stakeholders & Campaigns
stakeholders                   # Stakeholder profiles
stakeholder_groups             # Stakeholder groupings
campaigns                      # Campaign management
campaign_analytics             # Campaign performance

-- System
monitoring_configs             # User monitoring configurations
users                         # User accounts
projects                      # User projects
```

---

## 🔄 Data Flow Architecture

### 1. Source Collection Pipeline
```
MasterSourceRegistry (352+ sources)
    ↓
UnifiedMonitoringService (every 5 minutes)
    ↓
Parallel RSS/API fetching (15s timeout, 20+ concurrent)
    ↓
intelligence_findings table (2000+ articles/day)
```

### 2. Opportunity Detection Pipeline
```
intelligence_findings (articles)
    ↓
Pattern Detection (4 patterns: Competitor Stumble, Narrative Vacuum, Cascade Event, Market Movement)
    ↓
Scoring & Confidence (0-100 score, urgency levels)
    ↓
opportunity_queue table
    ↓
Frontend OpportunityDetection component
```

### 3. Intelligence Analysis Pipeline
```
Organization Configuration
    ↓
Intelligence Targets (competitors, topics, keywords)
    ↓
NewsRoundupService (categorization)
    ↓
Claude AI Analysis
    ↓
IntelligenceSummaryDashboard
```

---

## 🚀 Key Features

### Monitoring System
- **352+ sources** across 25 industries
- **154 RSS feeds** actively monitored
- **192 Google News queries**
- **15-second timeout** per feed (was 3-5s)
- **Parallel processing** (20+ concurrent fetches)
- **5-minute refresh cycle**

### Industries Covered
1. Technology
2. Finance
3. Healthcare
4. Energy
5. Manufacturing
6. Retail
7. Real Estate
8. Transportation
9. Media
10. Telecommunications
11. Agriculture
12. Education
13. Government
14. Defense
15. Aerospace
16. Automotive
17. Biotechnology
18. Construction
19. Entertainment
20. Food & Beverage
21. Insurance
22. Legal
23. Logistics
24. Mining
25. Pharmaceuticals
26. Sports & Fitness

### Opportunity Patterns
1. **Competitor Stumble** - Detect competitor issues/failures
2. **Narrative Vacuum** - Identify thought leadership gaps
3. **Cascade Event** - Track market-shifting events
4. **Market Movement** - Monitor growth/partnership signals

---

## 🔐 Authentication

- **Demo Credentials**:
  - Email: `demo@signaldesk.com`
  - Password: `password`
- **JWT-based authentication**
- **24-hour token expiry**

---

## 📡 API Endpoints

### Public Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/verify` - Verify token

### Protected Endpoints (require auth)
- `/api/monitoring/v2/*` - Monitoring operations
- `/api/intelligence/*` - Intelligence data
- `/api/opportunities/*` - Opportunity management
- `/api/stakeholder-intelligence/*` - Stakeholder operations
- `/api/campaigns/*` - Campaign management
- `/api/assistant/*` - AI assistant
- `/api/content/*` - Content generation
- `/api/media/*` - Media management

---

## 🛠️ Technology Stack

### Backend
- **Node.js** (v24.4.0)
- **Express.js** - Web framework
- **PostgreSQL** - Primary database
- **Claude AI** (Sonnet 3.5) - Intelligence analysis
- **RSS Parser** - Feed parsing
- **Axios** - HTTP client
- **JWT** - Authentication
- **Bcrypt** - Password hashing

### Frontend
- **React** (v18+)
- **React Router** - Routing
- **Lucide React** - Icons
- **Recharts** - Data visualization
- **Context API** - State management

---

## 📝 Configuration Files

### Backend
- `.env` - Environment variables
- `package.json` - Dependencies
- `MONITORING_SYSTEM_WORKING.md` - System documentation

### Frontend
- `package.json` - Dependencies
- `.env` - API endpoints

---

## 🔄 Running the System

### Backend
```bash
cd backend
npm install
npm start  # Runs on port 5001
```

### Unified Monitoring Service
```bash
cd backend
node start-unified-monitoring.js  # Continuous monitoring
```

### Frontend
```bash
cd frontend
npm install
npm start  # Runs on port 3000
```

### Database Setup
```bash
cd backend
node scripts/populate-source-indexes.js  # Populate all sources
```

---

## 📊 System Statistics

- **Total Sources**: 352+
- **RSS Feeds**: 154
- **Google News Queries**: 192
- **Industries Covered**: 25
- **Refresh Cycle**: 5 minutes
- **Articles Processed**: 2000+/day
- **Opportunities Detected**: 100+/day
- **Database Tables**: 20+
- **API Endpoints**: 50+

---

## 🎯 Key Improvements Made

1. **100% Source Utilization** - All 352+ sources now active (was ~9)
2. **Removed Executive Summary** - Direct data access
3. **Increased Timeouts** - 15s (was 3-5s)
4. **Parallel Processing** - 20+ concurrent fetches
5. **Continuous Monitoring** - 5-minute cycles
6. **Real Opportunity Detection** - Pattern-based, not keyword-restricted
7. **Unified Service** - Single monitoring engine for all sources

---

*Last Updated: August 2025*