# SignalDesk Opportunity Engine - Comprehensive Documentation

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Core Components](#core-components)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [Database Schema](#database-schema)
7. [API Endpoints](#api-endpoints)
8. [Data Flow](#data-flow)
9. [Pattern Detection System](#pattern-detection-system)
10. [Intelligence Monitoring](#intelligence-monitoring)
11. [Source Management](#source-management)
12. [Configuration Guide](#configuration-guide)
13. [Testing & Validation](#testing--validation)
14. [Troubleshooting](#troubleshooting)

---

## Overview

The SignalDesk Opportunity Engine is a sophisticated real-time intelligence monitoring and opportunity detection system that automatically identifies business opportunities through pattern recognition, stakeholder behavior prediction, and cascade effect analysis.

### Key Capabilities
- **Real-time Monitoring**: Continuous scanning of 50+ data sources
- **Pattern Detection**: AI-powered recognition of 15+ opportunity patterns
- **Stakeholder Prediction**: Behavioral analysis and action prediction
- **Cascade Intelligence**: Multi-order effect simulation
- **News Aggregation**: Comprehensive news roundup from 30+ sources
- **Source Indexing**: Intelligent discovery and categorization of sources

### System Philosophy
The engine operates on the principle that opportunities emerge from information asymmetry and timing advantages. By processing vast amounts of data and detecting patterns faster than human analysts, it provides actionable intelligence for strategic decision-making.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                          │
├─────────────────────────────────────────────────────────────────┤
│  React Components:                                              │
│  - OpportunityQueue.js      - Real-time opportunity display     │
│  - IntelligenceDashboard.js - Intelligence monitoring UI        │
│  - MonitoringConfig.js      - Configuration interface          │
│  - PatternLibrary.js        - Pattern management UI            │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                          │
├─────────────────────────────────────────────────────────────────┤
│  Express Routes:                                                │
│  - /api/opportunities/*     - Opportunity management            │
│  - /api/monitoring/v2/*     - Intelligence monitoring           │
│  - /api/ultimate-monitoring/* - Advanced analysis              │
│  - /api/intelligence/*      - Intelligence operations          │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Service Layer (Core Engine)                  │
├─────────────────────────────────────────────────────────────────┤
│  Core Services:                                                 │
│  - OpportunityDetectionService.js - Main detection engine       │
│  - UltimateMonitoringAgent.js    - Advanced monitoring         │
│  - IntelligentIndexingAgent.js   - Source indexing            │
│  - NewsRoundupService.js         - News aggregation           │
│  - SourceDiscoveryService.js     - Source discovery           │
│  - CascadeIntelligenceEngine     - Cascade simulation         │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Data Layer                               │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL Tables:                                             │
│  - opportunity_queue         - Detected opportunities           │
│  - opportunity_patterns      - Pattern definitions              │
│  - intelligence_targets      - Monitoring configuration         │
│  - source_indexes           - Indexed sources                  │
│  - stakeholder_profiles     - Stakeholder data                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. OpportunityDetectionService
**Location**: `/backend/src/services/OpportunityDetectionService.js`

The heart of the opportunity engine, responsible for:
- Continuous monitoring cycles
- Pattern matching and scoring
- Stakeholder action prediction
- Cascade effect analysis
- Opportunity prioritization

**Key Methods**:
```javascript
startMonitoring(organizationId, config)
scanForOpportunities(organizationId)
detectPatterns(signals)
predictStakeholderActions(signals, organizationId)
analyzeCascadeEffects(signals)
scoreOpportunities(opportunities, organizationId)
```

### 2. UltimateMonitoringAgent
**Location**: `/backend/src/services/UltimateMonitoringAgent.js`

Advanced monitoring capabilities:
- Multi-source data orchestration
- Real-time analysis pipeline
- Intelligence synthesis
- Alert generation

### 3. IntelligentIndexingAgent
**Location**: `/backend/src/services/IntelligentIndexingAgent.js`

Automated source discovery and indexing:
- Entity analysis
- Source discovery (10 categories)
- Quality scoring (0-10 scale)
- Tier assignment (Tier 1-4)
- JSONB storage optimization

### 4. NewsRoundupService
**Location**: `/backend/src/services/NewsRoundupService.js`

News aggregation and organization:
- 30+ news source integration
- Google News dynamic feeds
- Article categorization
- Relevance scoring
- Deduplication

### 5. CascadeIntelligenceEngine
**Location**: Embedded in `OpportunityDetectionService.js`

Cascade effect simulation:
- First, second, and third-order effects
- Opportunity window calculation
- Urgency assessment
- Action recommendations

---

## Backend Implementation

### Service Layer Architecture

#### OpportunityDetectionService Implementation
```javascript
class OpportunityDetectionService extends EventEmitter {
  constructor() {
    super();
    this.parser = new Parser();
    this.indexingAgent = new IntelligentIndexingAgent();
    this.monitoringInterval = null;
    this.patterns = null;
    this.stakeholderProfiles = new Map();
    this.cascadeSimulator = new CascadeIntelligenceEngine();
    this.isMonitoring = false;
    this.sourceIndexCache = new Map();
  }

  async scanForOpportunities(organizationId) {
    // 1. Gather signals from all sources
    const signals = await this.gatherSignals(organizationId);
    
    // 2. Detect patterns in signals
    const detectedPatterns = await this.detectPatterns(signals);
    
    // 3. Predict stakeholder actions
    const stakeholderPredictions = await this.predictStakeholderActions(signals, organizationId);
    
    // 4. Analyze cascade potential
    const cascadeOpportunities = await this.analyzeCascadeEffects(signals);
    
    // 5. Score and prioritize opportunities
    const opportunities = await this.scoreOpportunities([
      ...detectedPatterns,
      ...stakeholderPredictions,
      ...cascadeOpportunities
    ], organizationId);
    
    // 6. Store high-value opportunities
    await this.storeOpportunities(opportunities, organizationId);
    
    // 7. Emit events for real-time updates
    this.emit('opportunities-detected', {
      organizationId,
      count: opportunities.length,
      critical: opportunities.filter(o => o.urgency === 'critical').length
    });
    
    return opportunities;
  }
}
```

#### Signal Gathering Pipeline
```javascript
async gatherSignals(organizationId) {
  const signals = [];
  const config = await this.getMonitoringConfig(organizationId);
  
  // 0. FIRST CHECK FOR INDEXED SOURCES
  const indexedSources = await this.getIndexedSourcesForOrg(organizationId, config);
  if (indexedSources && indexedSources.length > 0) {
    const indexedSignals = await this.fetchSignalsFromIndexedSources(indexedSources, config.keywords || []);
    signals.push(...indexedSignals);
  }
  
  // 1. RSS Feed Monitoring
  const rssSignals = await this.fetchRSSSignals(config.keywords || []);
  signals.push(...rssSignals);
  
  // 2. News API Monitoring
  if (process.env.NEWS_API_KEY) {
    const newsSignals = await this.fetchNewsAPISignals(config.keywords || []);
    signals.push(...newsSignals);
  }
  
  // 3. Reddit Monitoring
  if (config.sources?.reddit) {
    const redditSignals = await this.fetchRedditSignals(config.keywords || []);
    signals.push(...redditSignals);
  }
  
  // 4. SEC EDGAR Monitoring
  if (config.sources?.regulatory) {
    const secSignals = await this.fetchSECSignals(organizationId);
    signals.push(...secSignals);
  }
  
  // 5. Patent Database Monitoring
  if (config.sources?.patents) {
    const patentSignals = await this.fetchPatentSignals(config.competitors || []);
    signals.push(...patentSignals);
  }
  
  return signals;
}
```

### Controller Layer

#### monitoringControllerV2.js
**Location**: `/backend/src/controllers/monitoringControllerV2.js`

Key endpoints implementation:
```javascript
// Intelligence Summary Generation
exports.getIntelligenceSummary = async (req, res) => {
  const { organizationId } = req.params;
  
  // Get configuration from database
  const { organization, competitors, topics } = await getOrganizationConfig(organizationId);
  
  // Generate comprehensive news roundup
  const config = {
    organization: organization,
    competitors: competitors,
    topics: topics,
    keywords: [
      organization?.name,
      ...competitors.map(c => c.name),
      ...topics.map(t => t.name)
    ].filter(Boolean)
  };
  
  const roundup = await newsRoundup.generateNewsRoundup(organizationId, config);
  
  // Format response for frontend
  const formattedResponse = {
    success: true,
    executiveSummary: {
      headline: roundup.summary?.keyHighlights[0]?.headline || "Today's News Roundup",
      keyPoints: roundup.summary?.keyHighlights.map(h => h.headline) || [],
      overallSentiment: 'neutral',
      totalArticles: roundup.summary?.totalArticles || 0,
      breakdown: roundup.summary?.breakdown
    },
    organizationIntelligence: {
      summary: `${roundup.sections.organizationNews.length} news articles`,
      articles: roundup.sections.organizationNews
    },
    competitiveIntelligence: {
      summary: `${roundup.sections.competitorNews.length} competitor articles`,
      articles: roundup.sections.competitorNews
    },
    topicIntelligence: {
      summary: `Industry and topic news coverage`,
      articles: roundup.sections.industryNews
    },
    topStories: roundup.sections.topStories,
    metadata: {
      organizationId,
      generated: roundup.generated,
      sources: roundup.sources,
      totalArticles: roundup.summary?.totalArticles || 0
    }
  };
  
  res.json(formattedResponse);
};
```

### Data Processing Pipeline

#### Pattern Detection Algorithm
```javascript
async calculatePatternMatch(signals, pattern) {
  let matchScore = 0;
  const triggers = pattern.signals?.triggers || [];
  const threshold = pattern.signals?.threshold || 0.6;
  
  for (const trigger of triggers) {
    const matchingSignals = signals.filter(s => 
      s.content?.toLowerCase().includes(trigger.toLowerCase()) ||
      s.title?.toLowerCase().includes(trigger.toLowerCase())
    );
    
    if (matchingSignals.length > 0) {
      matchScore += (1 / triggers.length);
    }
  }
  
  return matchScore >= threshold ? matchScore : 0;
}
```

#### Opportunity Scoring Algorithm
```javascript
async scoreOpportunities(opportunities, organizationId) {
  const scoredOpportunities = [];
  const readiness = await this.getOrganizationReadiness(organizationId);
  
  for (const opp of opportunities) {
    // Calculate dynamic score
    const baseScore = opp.score || (opp.confidence * 100) || 50;
    
    // Apply multipliers
    const timingMultiplier = this.getTimingMultiplier(opp.urgency);
    const readinessMultiplier = this.getReadinessMultiplier(readiness, opp.type);
    const competitiveMultiplier = await this.getCompetitiveMultiplier(opp);
    const cascadeMultiplier = opp.cascadePotential === 'high' ? 1.5 : 1.0;
    
    const finalScore = baseScore * timingMultiplier * readinessMultiplier * 
                      competitiveMultiplier * cascadeMultiplier;
    
    scoredOpportunities.push({
      ...opp,
      score: Math.min(100, finalScore),
      scoreBreakdown: {
        base: baseScore,
        timing: timingMultiplier,
        readiness: readinessMultiplier,
        competitive: competitiveMultiplier,
        cascade: cascadeMultiplier
      }
    });
  }
  
  return scoredOpportunities.sort((a, b) => b.score - a.score);
}
```

---

## Frontend Implementation

### Component Architecture

#### OpportunityQueue Component
**Location**: `/frontend/src/components/OpportunityQueue.js`

```javascript
import React, { useState, useEffect } from 'react';
import { Card, Badge, Progress, Timeline, Alert } from 'antd';

const OpportunityQueue = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  
  useEffect(() => {
    fetchOpportunities();
    const interval = setInterval(fetchOpportunities, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [filter]);
  
  const fetchOpportunities = async () => {
    try {
      const response = await fetch(`/api/opportunities/queue?filter=${filter}`);
      const data = await response.json();
      setOpportunities(data.opportunities);
    } catch (error) {
      console.error('Failed to fetch opportunities:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getUrgencyColor = (urgency) => {
    const colors = {
      critical: 'red',
      high: 'orange',
      medium: 'blue',
      low: 'green'
    };
    return colors[urgency] || 'default';
  };
  
  return (
    <div className="opportunity-queue">
      <div className="queue-header">
        <h2>Opportunity Queue</h2>
        <div className="queue-filters">
          <Badge count={opportunities.filter(o => o.urgency === 'critical').length} showZero>
            <Button onClick={() => setFilter('critical')}>Critical</Button>
          </Badge>
          <Badge count={opportunities.filter(o => o.urgency === 'high').length} showZero>
            <Button onClick={() => setFilter('high')}>High Priority</Button>
          </Badge>
        </div>
      </div>
      
      <div className="opportunities-list">
        {opportunities.map(opp => (
          <Card 
            key={opp.id}
            className={`opportunity-card urgency-${opp.urgency}`}
            extra={<Badge color={getUrgencyColor(opp.urgency)} text={opp.urgency} />}
          >
            <h3>{opp.title}</h3>
            <p>{opp.description}</p>
            
            <div className="opportunity-meta">
              <span>Score: {opp.score}/100</span>
              <span>Window: {opp.windowEnd}</span>
              <span>Pattern: {opp.patternName}</span>
            </div>
            
            <Progress percent={opp.confidence * 100} size="small" />
            
            {opp.recommendedActions && (
              <div className="recommended-actions">
                <h4>Recommended Actions:</h4>
                <ul>
                  {opp.recommendedActions.map((action, idx) => (
                    <li key={idx}>{action}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {opp.cascadePotential && (
              <Alert
                message={`Cascade Potential: ${opp.cascadePotential}`}
                type={opp.cascadePotential === 'high' ? 'warning' : 'info'}
                showIcon
              />
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
```

#### Intelligence Dashboard Component
**Location**: `/frontend/src/components/IntelligenceDashboard.js`

```javascript
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Timeline } from 'antd';

const IntelligenceDashboard = ({ organizationId }) => {
  const [intelligence, setIntelligence] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchIntelligence();
    const interval = setInterval(fetchIntelligence, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [organizationId]);
  
  const fetchIntelligence = async () => {
    try {
      const response = await fetch(`/api/monitoring/v2/intelligence-summary/${organizationId}`);
      const data = await response.json();
      setIntelligence(data);
    } catch (error) {
      console.error('Failed to fetch intelligence:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) return <Spin size="large" />;
  if (!intelligence) return <Alert message="No intelligence data available" type="info" />;
  
  return (
    <div className="intelligence-dashboard">
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Total Articles" 
              value={intelligence.metadata?.totalArticles || 0} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Sources Monitored" 
              value={intelligence.metadata?.sources?.total || 0} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Competitor News" 
              value={intelligence.competitiveIntelligence?.articles?.length || 0} 
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Overall Sentiment" 
              value={intelligence.executiveSummary?.overallSentiment || 'Neutral'} 
            />
          </Card>
        </Col>
      </Row>
      
      <Card title="Executive Summary" style={{ marginTop: 16 }}>
        <h3>{intelligence.executiveSummary?.headline}</h3>
        <ul>
          {intelligence.executiveSummary?.keyPoints?.map((point, idx) => (
            <li key={idx}>{point}</li>
          ))}
        </ul>
      </Card>
      
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="Top Stories">
            <Timeline>
              {intelligence.topStories?.map((story, idx) => (
                <Timeline.Item key={idx}>
                  <a href={story.link} target="_blank" rel="noopener noreferrer">
                    {story.title}
                  </a>
                  <br />
                  <small>{story.source} - {new Date(story.date).toLocaleDateString()}</small>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title="Competitor Intelligence">
            <Table
              dataSource={intelligence.competitiveIntelligence?.articles}
              columns={[
                {
                  title: 'Title',
                  dataIndex: 'title',
                  render: (text, record) => (
                    <a href={record.link} target="_blank" rel="noopener noreferrer">
                      {text.substring(0, 50)}...
                    </a>
                  )
                },
                {
                  title: 'Source',
                  dataIndex: 'source',
                  width: 150
                },
                {
                  title: 'Date',
                  dataIndex: 'date',
                  width: 100,
                  render: date => new Date(date).toLocaleDateString()
                }
              ]}
              size="small"
              pagination={{ pageSize: 5 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};
```

### State Management

#### Redux Store Structure
```javascript
// store/opportunitySlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchOpportunities = createAsyncThunk(
  'opportunities/fetch',
  async ({ organizationId, filter }) => {
    const response = await api.get(`/opportunities/queue`, {
      params: { organizationId, filter }
    });
    return response.data;
  }
);

const opportunitySlice = createSlice({
  name: 'opportunities',
  initialState: {
    queue: [],
    patterns: [],
    activeOpportunity: null,
    loading: false,
    error: null
  },
  reducers: {
    setActiveOpportunity: (state, action) => {
      state.activeOpportunity = action.payload;
    },
    updateOpportunityStatus: (state, action) => {
      const { id, status } = action.payload;
      const opp = state.queue.find(o => o.id === id);
      if (opp) opp.status = status;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOpportunities.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOpportunities.fulfilled, (state, action) => {
        state.loading = false;
        state.queue = action.payload.opportunities;
      })
      .addCase(fetchOpportunities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
});
```

---

## Database Schema

### Core Tables

#### opportunity_queue
```sql
CREATE TABLE opportunity_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id VARCHAR(255) NOT NULL,
  pattern_name VARCHAR(255),
  source_type VARCHAR(50),
  score DECIMAL(5,2),
  confidence DECIMAL(3,2),
  window_start TIMESTAMP,
  window_end TIMESTAMP,
  urgency VARCHAR(20) CHECK (urgency IN ('critical', 'high', 'medium', 'low')),
  title TEXT NOT NULL,
  description TEXT,
  key_points JSONB,
  recommended_actions JSONB,
  data JSONB,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_org_urgency (organization_id, urgency),
  INDEX idx_window (window_end),
  INDEX idx_score (score DESC)
);
```

#### opportunity_patterns
```sql
CREATE TABLE opportunity_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(100),
  description TEXT,
  signals JSONB, -- {triggers: [], threshold: 0.6}
  action_window VARCHAR(100),
  recommended_action TEXT,
  success_rate DECIMAL(3,2),
  examples JSONB,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Default patterns
INSERT INTO opportunity_patterns (name, type, description, signals, action_window, recommended_action) VALUES
('Competitor Weakness', 'competitive', 'Competitor facing challenges', 
 '{"triggers": ["lawsuit", "investigation", "layoff", "breach"], "threshold": 0.6}',
 '24-48 hours', 'Position as stable alternative'),
 
('Narrative Vacuum', 'thought_leadership', 'Topic trending with no clear expert',
 '{"triggers": ["debate", "controversy", "unclear", "questions"], "threshold": 0.5}',
 '3-5 days', 'Provide expert commentary'),
 
('Regulatory Change', 'regulatory', 'New regulations creating market opportunity',
 '{"triggers": ["regulation", "compliance", "requirement", "mandate"], "threshold": 0.7}',
 '1-2 weeks', 'Demonstrate compliance readiness'),
 
('Market Disruption', 'market', 'Significant market shift detected',
 '{"triggers": ["bankruptcy", "acquisition", "merger", "exit"], "threshold": 0.8}',
 '1-3 days', 'Capture market share'),
 
('Technology Shift', 'technical', 'New technology gaining adoption',
 '{"triggers": ["breakthrough", "innovation", "launch", "release"], "threshold": 0.6}',
 '1-2 weeks', 'Adopt or respond to technology');
```

#### intelligence_targets
```sql
CREATE TABLE intelligence_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) CHECK (type IN ('competitor', 'topic', 'person', 'keyword')),
  priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high')),
  keywords TEXT[],
  metadata JSONB,
  rss_feeds JSONB,
  api_endpoints JSONB,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_org_type (organization_id, type),
  INDEX idx_active (active)
);
```

#### source_indexes
```sql
CREATE TABLE source_indexes (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_name VARCHAR(255) NOT NULL,
  entity_data JSONB NOT NULL,
  index_data JSONB NOT NULL, -- Contains sources array with full source details
  statistics JSONB,
  quality_score DECIMAL(3,1),
  tier VARCHAR(10),
  last_validated TIMESTAMP,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_entity (entity_type, entity_name),
  INDEX idx_quality (quality_score DESC),
  INDEX idx_tier (tier)
);
```

#### stakeholder_profiles
```sql
CREATE TABLE stakeholder_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id VARCHAR(255) NOT NULL,
  stakeholder_type VARCHAR(100),
  name VARCHAR(255),
  sensitivity VARCHAR(20) CHECK (sensitivity IN ('low', 'medium', 'high')),
  typical_actions JSONB,
  trigger_patterns JSONB,
  historical_behavior JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### monitoring_configs
```sql
CREATE TABLE monitoring_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  organization_id VARCHAR(255),
  config_data JSONB NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## API Endpoints

### Opportunity Management

#### GET /api/opportunities/queue
Retrieve queued opportunities with filtering options.

**Query Parameters:**
- `organizationId` (required): Organization identifier
- `filter`: Filter by urgency (critical/high/medium/low/all)
- `status`: Filter by status (pending/in_progress/completed/dismissed)
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset

**Response:**
```json
{
  "opportunities": [
    {
      "id": "opp-123",
      "pattern_name": "Competitor Weakness",
      "title": "Major competitor facing regulatory investigation",
      "description": "Competitor X under FTC investigation for data practices",
      "score": 85.5,
      "confidence": 0.78,
      "urgency": "high",
      "window_start": "2025-01-15T10:00:00Z",
      "window_end": "2025-01-17T10:00:00Z",
      "recommended_actions": [
        "Emphasize data privacy compliance",
        "Prepare comparative messaging"
      ],
      "cascade_potential": "high",
      "supporting_signals": [...]
    }
  ],
  "total": 15,
  "critical_count": 3
}
```

#### POST /api/opportunities/analyze
Trigger immediate opportunity analysis.

**Request Body:**
```json
{
  "organizationId": "org-123",
  "timeframe": "24h",
  "focus": ["competitive", "regulatory", "market"]
}
```

#### PUT /api/opportunities/:id/status
Update opportunity status.

**Request Body:**
```json
{
  "status": "in_progress",
  "notes": "Team assigned to response"
}
```

### Intelligence Monitoring

#### GET /api/monitoring/v2/intelligence-summary/:organizationId
Get comprehensive intelligence summary with news roundup.

**Response:**
```json
{
  "success": true,
  "executiveSummary": {
    "headline": "Major industry development detected",
    "keyPoints": ["Point 1", "Point 2"],
    "overallSentiment": "positive",
    "totalArticles": 145,
    "breakdown": {
      "topStories": 5,
      "organization": 12,
      "competitors": 28,
      "industry": 45,
      "market": 20,
      "regulatory": 15,
      "technical": 20
    }
  },
  "organizationIntelligence": {
    "summary": "12 articles about your organization",
    "articles": [...]
  },
  "competitiveIntelligence": {
    "summary": "28 competitor articles",
    "articles": [...]
  },
  "topStories": [...],
  "metadata": {
    "generated": "2025-01-15T12:00:00Z",
    "sources": {
      "total": 45,
      "indexed": 32,
      "realtime": 13
    }
  }
}
```

#### POST /api/monitoring/v2/configure
Configure monitoring parameters.

**Request Body:**
```json
{
  "organizationId": "org-123",
  "competitors": [
    {"name": "Competitor A", "priority": "high"},
    {"name": "Competitor B", "priority": "medium"}
  ],
  "topics": [
    {"name": "AI Regulation", "priority": "high"},
    {"name": "Market Trends", "priority": "medium"}
  ],
  "keywords": ["industry", "innovation", "disruption"],
  "sources": {
    "rss": true,
    "news": true,
    "reddit": true,
    "regulatory": true,
    "patents": false
  }
}
```

### Source Management

#### POST /api/sources/index
Index sources for an entity.

**Request Body:**
```json
{
  "entityType": "company",
  "entityData": {
    "name": "TechCorp",
    "industry": "Technology",
    "website": "https://techcorp.com"
  },
  "options": {
    "depth": "comprehensive",
    "validateSources": true,
    "includeCompetitors": true
  }
}
```

#### GET /api/sources/indexed/:entityType/:entityName
Retrieve indexed sources for an entity.

---

## Data Flow

### Opportunity Detection Flow
```
1. Timer Trigger (every 5 minutes)
   ↓
2. Scan for Opportunities
   ↓
3. Gather Signals
   ├─ RSS Feeds
   ├─ News APIs
   ├─ Reddit
   ├─ SEC EDGAR
   └─ Patent Database
   ↓
4. Pattern Detection
   ├─ Pattern Matching
   ├─ Stakeholder Prediction
   └─ Cascade Analysis
   ↓
5. Opportunity Scoring
   ├─ Base Score Calculation
   ├─ Timing Multiplier
   ├─ Readiness Multiplier
   └─ Competitive Multiplier
   ↓
6. Store in Database
   ↓
7. Emit Real-time Events
   ↓
8. Update Frontend UI
```

### Intelligence Summary Flow
```
1. Frontend Request
   ↓
2. Get Organization Config
   ├─ Load from intelligence_targets
   ├─ Infer organization if missing
   └─ Build keyword lists
   ↓
3. Generate News Roundup
   ├─ Get Indexed Sources
   ├─ Fetch Major News Outlets
   ├─ Build Google News Feeds
   ├─ Get Industry Publications
   └─ Aggregate Social Feeds
   ↓
4. Fetch & Filter Articles
   ├─ Apply Keyword Matching
   ├─ Calculate Relevance
   └─ Deduplicate
   ↓
5. Categorize News
   ├─ Top Stories
   ├─ Organization News
   ├─ Competitor News
   ├─ Industry News
   └─ Market Trends
   ↓
6. Format Response
   ↓
7. Return to Frontend
```

---

## Pattern Detection System

### Pattern Categories

#### 1. Competitive Patterns
- **Competitor Weakness**: Vulnerabilities in competitor operations
- **Market Share Shift**: Changes in competitive landscape
- **Competitive Void**: Competitor exits or reduces presence

#### 2. Market Patterns
- **Supply Chain Disruption**: Interruptions affecting market
- **Demand Surge**: Sudden increase in market demand
- **Price Volatility**: Significant price movements

#### 3. Regulatory Patterns
- **Regulatory Change**: New laws or regulations
- **Compliance Gap**: Competitors facing compliance issues
- **Policy Shift**: Government policy changes

#### 4. Technology Patterns
- **Technology Breakthrough**: New innovations
- **Platform Shift**: Changes in dominant platforms
- **Security Incident**: Breaches or vulnerabilities

#### 5. Stakeholder Patterns
- **Activist Campaign**: Stakeholder activism
- **Investor Sentiment**: Changes in investor behavior
- **Customer Revolt**: Customer dissatisfaction trends

### Pattern Matching Algorithm
```javascript
class PatternMatcher {
  async matchPattern(signals, pattern) {
    const triggers = pattern.signals.triggers;
    const threshold = pattern.signals.threshold;
    
    // Count trigger matches
    let matchCount = 0;
    const matchedSignals = [];
    
    for (const signal of signals) {
      const text = `${signal.title} ${signal.content}`.toLowerCase();
      
      for (const trigger of triggers) {
        if (text.includes(trigger.toLowerCase())) {
          matchCount++;
          matchedSignals.push({
            signal,
            trigger,
            strength: this.calculateStrength(text, trigger)
          });
        }
      }
    }
    
    // Calculate match score
    const matchScore = matchCount / triggers.length;
    
    if (matchScore >= threshold) {
      return {
        matched: true,
        score: matchScore,
        confidence: this.calculateConfidence(matchedSignals),
        signals: matchedSignals
      };
    }
    
    return { matched: false };
  }
  
  calculateStrength(text, trigger) {
    // Calculate how prominently the trigger appears
    const index = text.indexOf(trigger.toLowerCase());
    const prominence = 1 - (index / text.length);
    const frequency = (text.match(new RegExp(trigger, 'gi')) || []).length;
    
    return (prominence + (frequency / 10)) / 2;
  }
  
  calculateConfidence(matchedSignals) {
    // Average strength of all matched signals
    const avgStrength = matchedSignals.reduce((sum, m) => sum + m.strength, 0) / matchedSignals.length;
    
    // Recency factor (more recent = higher confidence)
    const recencyScore = matchedSignals.reduce((sum, m) => {
      const age = Date.now() - new Date(m.signal.publishedAt);
      const daysSincePublish = age / (1000 * 60 * 60 * 24);
      return sum + Math.max(0, 1 - (daysSincePublish / 7));
    }, 0) / matchedSignals.length;
    
    return (avgStrength + recencyScore) / 2;
  }
}
```

---

## Intelligence Monitoring

### Multi-Agent Orchestration

The system uses multiple specialized agents working in concert:

#### 1. Query Clarifier Agent
- Analyzes research queries for clarity
- Identifies ambiguous terms
- Suggests query refinements

#### 2. Research Brief Generator
- Transforms queries into structured briefs
- Defines success criteria
- Identifies key sources

#### 3. Data Analyst Agent
- Performs quantitative analysis
- Identifies trends
- Creates comparisons

#### 4. Report Generator Agent
- Synthesizes findings
- Creates narratives
- Formats citations

### Source Quality Scoring

```javascript
class SourceQualityScorer {
  scoreSource(source) {
    const scores = {
      reliability: this.scoreReliability(source),
      relevance: this.scoreRelevance(source),
      timeliness: this.scoreTimeliness(source),
      authority: this.scoreAuthority(source),
      accessibility: this.scoreAccessibility(source)
    };
    
    // Weighted average
    const weights = {
      reliability: 0.3,
      relevance: 0.25,
      timeliness: 0.2,
      authority: 0.15,
      accessibility: 0.1
    };
    
    const overall = Object.keys(scores).reduce((sum, key) => {
      return sum + (scores[key] * weights[key]);
    }, 0);
    
    return {
      overall: Math.round(overall * 10) / 10,
      breakdown: scores,
      tier: this.assignTier(overall)
    };
  }
  
  assignTier(score) {
    if (score >= 8.5) return 'tier1';
    if (score >= 7.0) return 'tier2';
    if (score >= 5.5) return 'tier3';
    return 'tier4';
  }
}
```

---

## Source Management

### Source Discovery Categories

1. **Official Sources**
   - Company websites
   - Investor relations
   - Press releases

2. **News Sources**
   - Major news outlets
   - Industry publications
   - Local news

3. **Industry Sources**
   - Trade publications
   - Industry associations
   - Conference proceedings

4. **Regulatory Sources**
   - SEC filings
   - Government databases
   - Regulatory announcements

5. **Academic Sources**
   - Research papers
   - University publications
   - Think tanks

6. **Social Sources**
   - LinkedIn
   - Twitter/X
   - Reddit

7. **Financial Sources**
   - Stock exchanges
   - Financial analysts
   - Rating agencies

8. **Technical Sources**
   - Patent databases
   - Technical standards
   - Open source projects

9. **Competitive Sources**
   - Competitor websites
   - Industry benchmarks
   - Market research

10. **Stakeholder Sources**
    - Customer reviews
    - Employee feedback
    - Partner announcements

### RSS Feed Configuration

```javascript
const RSS_FEEDS = {
  majorNews: [
    { name: 'Reuters Business', url: 'https://feeds.reuters.com/reuters/businessNews' },
    { name: 'BBC Business', url: 'https://feeds.bbci.co.uk/news/business/rss.xml' },
    { name: 'WSJ Markets', url: 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml' },
    { name: 'Bloomberg', url: 'https://feeds.bloomberg.com/markets/news.rss' },
    { name: 'Financial Times', url: 'https://www.ft.com/?format=rss' },
    { name: 'Forbes', url: 'https://www.forbes.com/real-time/feed2/' },
    { name: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
    { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' }
  ],
  
  industrySpecific: {
    technology: [
      { name: 'Hacker News', url: 'https://hnrss.org/frontpage' },
      { name: 'Product Hunt', url: 'https://www.producthunt.com/feed' }
    ],
    finance: [
      { name: 'Zero Hedge', url: 'https://feeds.feedburner.com/zerohedge/feed' },
      { name: 'Seeking Alpha', url: 'https://seekingalpha.com/feed.xml' }
    ],
    retail: [
      { name: 'Retail Dive', url: 'https://www.retaildive.com/feeds/news/' },
      { name: 'Retail Wire', url: 'https://www.retailwire.com/rss/' }
    ]
  }
};
```

---

## Configuration Guide

### Initial Setup

1. **Database Configuration**
```bash
# Create database
createdb signaldesk

# Run migrations
psql -U postgres -d signaldesk -f create_opportunity_tables.sql
psql -U postgres -d signaldesk -f create_monitoring_tables.sql
psql -U postgres -d signaldesk -f create_source_indexes_table.sql
```

2. **Environment Variables**
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/signaldesk

# APIs
NEWS_API_KEY=your_news_api_key
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret

# Claude AI
ANTHROPIC_API_KEY=your_claude_api_key

# Monitoring
MONITORING_INTERVAL=300000  # 5 minutes in ms
MAX_OPPORTUNITIES_PER_SCAN=50
OPPORTUNITY_RETENTION_DAYS=30
```

3. **Organization Configuration**
```javascript
// Configure via API
POST /api/monitoring/v2/configure
{
  "organizationId": "org-123",
  "organization": {
    "name": "YourCompany",
    "industry": "Technology"
  },
  "competitors": [
    {"name": "Competitor1", "priority": "high"},
    {"name": "Competitor2", "priority": "medium"}
  ],
  "topics": [
    {"name": "AI Innovation", "priority": "high"},
    {"name": "Cybersecurity", "priority": "high"}
  ]
}
```

### Pattern Configuration

```sql
-- Add custom pattern
INSERT INTO opportunity_patterns (name, type, description, signals, action_window, recommended_action)
VALUES (
  'Custom Pattern Name',
  'custom_type',
  'Description of what this pattern detects',
  '{"triggers": ["keyword1", "keyword2"], "threshold": 0.7}',
  '2-3 days',
  'Recommended action when pattern detected'
);
```

### Monitoring Configuration

```javascript
// Start monitoring for organization
const opportunityService = new OpportunityDetectionService();

await opportunityService.startMonitoring('org-123', {
  intervalMinutes: 5,
  sources: {
    rss: true,
    news: true,
    reddit: true,
    regulatory: true,
    patents: false
  },
  alertThreshold: {
    critical: 90,
    high: 75,
    medium: 50
  }
});
```

---

## Testing & Validation

### Unit Tests

```javascript
// tests/opportunityDetection.test.js
describe('OpportunityDetectionService', () => {
  it('should detect competitor weakness pattern', async () => {
    const signals = [
      {
        title: 'Competitor X faces major lawsuit',
        content: 'Company sued for patent infringement',
        publishedAt: new Date()
      }
    ];
    
    const patterns = await service.detectPatterns(signals);
    
    expect(patterns).toHaveLength(1);
    expect(patterns[0].patternName).toBe('Competitor Weakness');
    expect(patterns[0].confidence).toBeGreaterThan(0.6);
  });
  
  it('should calculate cascade effects', async () => {
    const triggerEvent = {
      content: 'Major competitor declares bankruptcy'
    };
    
    const cascade = await service.analyzeCascadeEffects([triggerEvent]);
    
    expect(cascade).toHaveLength(1);
    expect(cascade[0].type).toBe('cascade');
    expect(cascade[0].firstOrderEffects).toContain('Market share redistribution');
  });
});
```

### Integration Tests

```javascript
// tests/integration/monitoring.test.js
describe('Intelligence Monitoring Integration', () => {
  it('should generate complete intelligence summary', async () => {
    const response = await request(app)
      .get('/api/monitoring/v2/intelligence-summary/org-test')
      .expect(200);
    
    expect(response.body).toHaveProperty('executiveSummary');
    expect(response.body).toHaveProperty('organizationIntelligence');
    expect(response.body).toHaveProperty('competitiveIntelligence');
    expect(response.body.metadata.sources.total).toBeGreaterThan(0);
  });
});
```

### Validation Scripts

```javascript
// scripts/validate-sources.js
async function validateSources() {
  const sources = await db.query('SELECT * FROM source_indexes WHERE active = true');
  
  for (const source of sources) {
    const indexData = JSON.parse(source.index_data);
    
    for (const src of indexData.sources) {
      try {
        const response = await fetch(src.url, { method: 'HEAD' });
        if (response.status !== 200) {
          console.log(`❌ Invalid source: ${src.name} - ${src.url}`);
        }
      } catch (error) {
        console.log(`❌ Unreachable source: ${src.name} - ${src.url}`);
      }
    }
  }
}
```

---

## Troubleshooting

### Common Issues

#### 1. No Opportunities Detected
**Symptoms**: Opportunity queue remains empty despite monitoring.

**Solutions**:
- Verify intelligence_targets configuration in database
- Check keyword matching is working (not using org IDs)
- Ensure RSS feeds are accessible
- Review pattern thresholds

```sql
-- Check configuration
SELECT * FROM intelligence_targets WHERE organization_id = 'your-org-id' AND active = true;

-- Check recent opportunities
SELECT * FROM opportunity_queue ORDER BY created_at DESC LIMIT 10;
```

#### 2. Intelligence Summary Empty
**Symptoms**: No articles in intelligence summary.

**Solutions**:
- Ensure organization name is not an ID (org-xxx)
- Verify competitors and topics have proper names
- Check RSS feed connectivity
- Review keyword generation logic

```javascript
// Debug keyword generation
console.log('Organization keywords:', orgKeywords);
console.log('Competitor keywords:', competitorKeywords);
console.log('Topic keywords:', topicKeywords);
```

#### 3. High False Positive Rate
**Symptoms**: Too many irrelevant opportunities.

**Solutions**:
- Adjust pattern thresholds
- Refine trigger keywords
- Implement negative keywords
- Adjust scoring multipliers

```sql
-- Increase pattern thresholds
UPDATE opportunity_patterns 
SET signals = jsonb_set(signals, '{threshold}', '0.8')
WHERE name = 'Pattern Name';
```

#### 4. Performance Issues
**Symptoms**: Slow response times, timeouts.

**Solutions**:
- Implement source caching
- Reduce monitoring frequency
- Optimize database queries
- Limit concurrent RSS fetches

```javascript
// Add caching
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function fetchWithCache(url) {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const data = await fetch(url);
  cache.set(url, { data, timestamp: Date.now() });
  return data;
}
```

### Debug Mode

Enable debug logging:
```javascript
// Enable debug mode
process.env.DEBUG = 'opportunity:*';

// Add debug logging
const debug = require('debug')('opportunity:detection');

debug('Scanning for opportunities', { organizationId, signalCount: signals.length });
```

### Health Checks

```javascript
// GET /api/health/opportunity-engine
app.get('/api/health/opportunity-engine', async (req, res) => {
  const health = {
    status: 'healthy',
    checks: {
      database: await checkDatabase(),
      rssFeeds: await checkRSSFeeds(),
      patterns: await checkPatterns(),
      monitoring: opportunityService.isMonitoring
    },
    metrics: {
      opportunitiesLast24h: await getOpportunityCount(24),
      averageScore: await getAverageScore(),
      criticalCount: await getCriticalCount()
    }
  };
  
  res.json(health);
});
```

---

## Performance Optimization

### Caching Strategy
```javascript
class CacheManager {
  constructor() {
    this.sourceCache = new LRU({ max: 500, ttl: 5 * 60 * 1000 });
    this.patternCache = new Map();
    this.signalCache = new Map();
  }
  
  async getOrFetch(key, fetchFn) {
    const cached = this.sourceCache.get(key);
    if (cached) return cached;
    
    const data = await fetchFn();
    this.sourceCache.set(key, data);
    return data;
  }
}
```

### Database Optimization
```sql
-- Add indexes for common queries
CREATE INDEX idx_opp_org_created ON opportunity_queue(organization_id, created_at DESC);
CREATE INDEX idx_opp_urgency_score ON opportunity_queue(urgency, score DESC);
CREATE INDEX idx_signals_published ON signals(published_at DESC);

-- Partition large tables
CREATE TABLE opportunity_queue_2025_q1 PARTITION OF opportunity_queue
FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');
```

### Parallel Processing
```javascript
async function processSignalsInParallel(signals, patterns) {
  const batchSize = 10;
  const results = [];
  
  for (let i = 0; i < signals.length; i += batchSize) {
    const batch = signals.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(signal => processSignal(signal, patterns))
    );
    results.push(...batchResults);
  }
  
  return results;
}
```

---

## Security Considerations

### API Security
```javascript
// Rate limiting
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/opportunities', limiter);

// Authentication middleware
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};
```

### Data Sanitization
```javascript
// Sanitize user input
const sanitizeConfig = (config) => {
  return {
    organizationId: validator.escape(config.organizationId),
    competitors: config.competitors?.map(c => ({
      name: validator.escape(c.name),
      priority: validator.isIn(c.priority, ['low', 'medium', 'high']) ? c.priority : 'medium'
    })),
    topics: config.topics?.map(t => ({
      name: validator.escape(t.name),
      priority: validator.isIn(t.priority, ['low', 'medium', 'high']) ? t.priority : 'medium'
    }))
  };
};
```

---

## Future Enhancements

### Planned Features

1. **Machine Learning Integration**
   - Pattern learning from historical data
   - Predictive opportunity scoring
   - Anomaly detection

2. **Advanced Visualizations**
   - Opportunity heat maps
   - Cascade effect diagrams
   - Competitive landscape visualization

3. **Automation Capabilities**
   - Automated response triggers
   - Workflow integration
   - Alert escalation

4. **Extended Data Sources**
   - Social media sentiment analysis
   - Podcast transcription monitoring
   - Video content analysis

5. **Collaboration Features**
   - Team assignments
   - Opportunity discussions
   - Action tracking

### Roadmap
- Q1 2025: ML pattern detection
- Q2 2025: Advanced visualizations
- Q3 2025: Automation framework
- Q4 2025: Extended sources

---

## Appendix

### Sample Configurations

#### Technology Company
```json
{
  "organization": {
    "name": "TechCorp",
    "industry": "Cloud Computing"
  },
  "competitors": [
    {"name": "AWS", "priority": "high"},
    {"name": "Microsoft Azure", "priority": "high"},
    {"name": "Google Cloud", "priority": "high"}
  ],
  "topics": [
    {"name": "Serverless Computing", "priority": "high"},
    {"name": "AI/ML Services", "priority": "high"},
    {"name": "Cloud Security", "priority": "medium"}
  ]
}
```

#### Retail Company
```json
{
  "organization": {
    "name": "RetailBrand",
    "industry": "E-commerce"
  },
  "competitors": [
    {"name": "Amazon", "priority": "high"},
    {"name": "Walmart", "priority": "high"},
    {"name": "Target", "priority": "medium"}
  ],
  "topics": [
    {"name": "Supply Chain Innovation", "priority": "high"},
    {"name": "Last Mile Delivery", "priority": "high"},
    {"name": "Sustainable Packaging", "priority": "medium"}
  ]
}
```

### Glossary

- **Cascade Effect**: Secondary and tertiary impacts of an initial event
- **Pattern**: Recurring signal combinations indicating opportunities
- **Signal**: Individual data point from monitoring sources
- **Stakeholder**: Entity with interest in organization outcomes
- **Urgency Window**: Time period for optimal action
- **Quality Score**: 0-10 rating of source reliability
- **Tier**: Classification of source importance (Tier 1-4)

---

## Support & Contact

For issues, questions, or contributions:
- GitHub: [SignalDesk Repository]
- Documentation: This document
- API Status: /api/health/opportunity-engine

---

*Last Updated: January 2025*
*Version: 2.0.0*