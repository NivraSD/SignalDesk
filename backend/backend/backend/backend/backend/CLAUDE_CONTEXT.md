# SignalDesk Platform Context

## Overview
SignalDesk is an AI-powered strategic intelligence and PR opportunity platform that monitors competitors and market topics to identify actionable opportunities for organizations. The platform uses advanced AI agents to gather intelligence, analyze market positions, and recommend strategic communications opportunities. At its core is the **Opportunity Engine**, which transforms intelligence into actionable PR and strategic communication opportunities.

## Current Architecture

### Frontend (React)
- **Main Hub**: `StakeholderIntelligenceHub.js` - Branded as "Opportunity Engine" with four main tabs:
  - Intelligence Targets (competitor/topic selection)
  - Source Configuration (RSS feed setup)
  - Intelligence Dashboard (unified monitoring)
  - Opportunity Execution (strategic opportunity identification)
- **Key Components**:
  - `EnhancedAIStrategyAdvisor.js` - AI-powered competitor/topic selection with real-time discovery
  - `UnifiedIntelligenceDashboard.js` - Integrated competitor health and topic positioning view
  - `OpportunityExecution.js` - Strategic opportunity identification and execution planning
  - `EnhancedSourceConfigurator.js` - RSS feed and source management for targets

### Backend (Node.js/Express)
- **Database**: PostgreSQL with tables for:
  - `intelligence_targets` - Competitors and topics being monitored
  - `target_sources` - RSS feeds and news sources per target
  - `findings` - Raw intelligence data collected
  - `opportunities` - Identified PR/strategic opportunities
  - `intelligence_projects` - Research projects and analysis

### AI Agent System

#### Research Agents (MCP-based)
The platform uses a sophisticated multi-agent system for intelligence gathering:

1. **Query Clarifier Agent**
   - Analyzes research queries for clarity
   - Requests clarification when queries are ambiguous
   - Ensures actionable research questions

2. **Research Brief Generator Agent**
   - Transforms clarified queries into structured research briefs
   - Defines specific sub-questions and research parameters
   - Sets success criteria and scope

3. **Research Orchestrator Agent**
   - Manages the entire research workflow
   - Coordinates multiple specialized agents
   - Synthesizes findings across research threads

4. **Data Analyst Agent**
   - Quantitative analysis and statistical insights
   - Trend identification and metric evaluation
   - Data visualization recommendations

5. **Report Generator Agent**
   - Creates comprehensive final reports
   - Ensures proper citation and formatting
   - Transforms research into executive-ready documents

#### Intelligence Analysis (Claude API)
- **Competitor Analysis**: Health scoring based on financial signals, leadership changes, product momentum, partnerships
- **Topic Analysis**: Trend identification, key themes, sentiment analysis
- **Opportunity Identification**: Strategic PR opportunities based on market gaps

## Key Features

### 1. Intelligence Target Selection
- AI-powered discovery of relevant competitors and topics
- Industry-specific recommendations
- Real-time validation against news sources

### 2. Unified Intelligence Dashboard
**Two View Modes:**
- **Health Cards View**: 
  - Visual health scores (0-100) for each competitor
  - Financial, leadership, product, and partnership signals
  - Topic positioning strength indicators
  - Strategic insights (strengths, vulnerabilities, opportunities)
  
- **Matrix View**:
  - Competitor vs Topic grid visualization
  - Visual strength indicators (Strong/Moderate/Weak/None)
  - Quick competitive landscape overview

### 3. Opportunity Engine (OpportunityExecution.js)
The core value proposition of SignalDesk - transforms intelligence into action:

**Key Components:**
- **Client Reality Score (CRS)**: Comprehensive readiness assessment (0-100) evaluating:
  - Execution Velocity (0-25): Speed to market capability
  - Message Credibility (0-25): Authority and authenticity
  - Market Position (0-25): Current competitive standing
  - Resource Readiness (0-25): Budget, team, and C-suite alignment

- **Position Analysis**: Executive-ready modal with three focused sections:
  - Strengths: Organizational advantages and capabilities
  - Opportunities: Market gaps and strategic openings
  - Risks & Threats: Competitive threats and vulnerabilities

- **Opportunity Concept Generation**: 
  - AI-generated PR concepts based on intelligence findings
  - Narrative Vacuum Score (NVS): 1-100 scoring of market demand vs. competitor silence
  - Time sensitivity classification (immediate/this_week/this_month)
  - Risk assessment (safe/moderate/bold)
  - Target audience identification

- **Execution Planning**: 
  - Detailed campaign blueprints
  - Multi-channel approach recommendations
  - Resource requirements and timelines
  - Success metrics and KPIs

### 4. Source Configuration
- Custom RSS feed management per target
- AI-powered source discovery
- Real-time feed validation

## Data Flow

1. **Target Setup**: Organization selects competitors/topics via AI advisor
2. **Source Configuration**: RSS feeds configured for each target
3. **Intelligence Gathering**: Backend monitors feeds and collects relevant articles
4. **Analysis**: 
   - Raw data analyzed for competitor health signals
   - Topic trends and positioning assessed
   - Strategic opportunities identified
5. **Presentation**: 
   - Unified dashboard shows integrated intelligence
   - Opportunity execution provides actionable recommendations

## API Endpoints

### Intelligence Analysis
- `POST /api/intelligence/analysis/competitor` - Analyze competitor with health scoring
- `POST /api/intelligence/analysis/topic` - Analyze topic trends
- `GET /api/intelligence/analysis/unified/:organizationId` - Get integrated intelligence view

### Target Management
- `POST /api/intelligence/targets` - Create monitoring target
- `GET /api/intelligence/organizations/:organizationId/targets` - Get org targets

### Monitoring
- `GET /api/intelligence/monitor/status/:organizationId` - Monitoring status
- `POST /api/intelligence/monitor/start` - Start monitoring

## Technology Stack

### Frontend
- React with hooks and functional components
- Real-time updates via WebSocket (mock currently)
- Inline styling for component isolation
- Lucide React for consistent iconography

### Backend
- Node.js with Express
- PostgreSQL database
- Claude AI API integration
- RSS parsing with rss-parser
- JWT authentication

### AI/ML
- Claude API for natural language analysis
- MCP (Model Context Protocol) for research agents
- Custom prompting for strategic analysis

## Current State

The platform is fully functional with:
- ✅ AI-powered competitor/topic discovery
- ✅ Unified intelligence monitoring (health + positioning)
- ✅ Strategic opportunity identification
- ✅ Executive position analysis (Strengths, Opportunities, Risks/Threats)
- ✅ Multi-agent research system
- ✅ Source management and RSS monitoring

## Key Improvements from Previous Version

1. **Unified Intelligence**: No longer separates competitors and topics - shows integrated view of competitor positioning on user's topics
2. **Health Monitoring**: Comprehensive company health scoring based on multiple signals
3. **Simplified Executive Analysis**: Focused on just Strengths, Opportunities, and Risks/Threats
4. **Agent-Based Research**: Sophisticated multi-agent system for deep research capabilities
5. **Strategic Focus**: Shifted from pure monitoring to actionable intelligence

## Usage Flow

1. **Setup**: User enters company name → AI discovers relevant competitors and topics
2. **Configuration**: User reviews and edits targets → configures news sources
3. **Monitoring**: Platform continuously gathers intelligence from configured sources
4. **Analysis**: AI analyzes competitor health and topic positioning
5. **Action**: Strategic opportunities identified → execution plans generated

## Future Enhancements

- Real-time WebSocket implementation for live updates
- Advanced competitive intelligence agents
- Automated campaign execution
- Integration with PR distribution platforms
- Predictive opportunity scoring