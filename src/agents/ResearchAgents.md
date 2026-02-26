# SignalDesk Research & Data Agents

## Overview

This document consolidates all research and data gathering agents used in the SignalDesk platform. These agents work together to provide comprehensive intelligence gathering, analysis, and opportunity identification.

## Agent Architecture

### 1. Query Clarifier Agent

**Purpose**: Analyzes research queries for clarity and determines if user clarification is needed before proceeding with research.

**When to Use**:

- At the beginning of research workflows
- When queries are ambiguous or too broad
- To ensure queries are specific and actionable

**Example Usage**:

```javascript
// Query: "Tell me about AI"
// Response: Requests clarification - "Which aspect of AI? (e.g., AI in healthcare, AI ethics, AI market trends)"

// Query: "Compare sorting algorithms by time complexity"
// Response: Query is clear, proceed with research
```

### 2. Research Brief Generator Agent

**Purpose**: Transforms clarified queries into structured, actionable research briefs with specific questions, keywords, and success criteria.

**When to Use**:

- After query clarification
- To create structured research plans
- To break down complex questions into sub-questions

**Output Structure**:

```javascript
{
  mainQuestion: "Impact of AI on healthcare diagnostics",
  subQuestions: [
    "Current AI applications in medical imaging",
    "Accuracy improvements over traditional methods",
    "Regulatory challenges and approvals",
    "Cost-benefit analysis for hospitals"
  ],
  keywords: ["AI diagnostics", "medical imaging AI", "FDA AI approval"],
  sourcePreferences: ["peer-reviewed journals", "industry reports", "regulatory filings"],
  successCriteria: "Comprehensive overview with quantitative data and case studies"
}
```

### 3. Research Orchestrator Agent

**Purpose**: Manages the entire research workflow, coordinating multiple specialized agents working in sequence.

**Workflow Management**:

1. Receives research brief
2. Delegates to specialized agents
3. Synthesizes findings across research threads
4. Ensures comprehensive coverage

**Example Orchestration**:

```javascript
// Research Topic: "Quantum computing impact on cryptography"
// Orchestrator Actions:
// 1. Deploy data analyst for market size/growth data
// 2. Use general researcher for technical implications
// 3. Employ report generator for final synthesis
```

### 4. Data Analyst Agent

**Purpose**: Provides quantitative analysis, statistical insights, and data-driven research.

**Specializations**:

- Trend analysis and pattern identification
- Statistical comparisons and benchmarking
- Market data and financial metrics
- Performance metrics evaluation
- Data visualization recommendations

**Example Applications**:

```javascript
// EV Market Analysis
{
  task: "Analyze electric vehicle sales trends",
  outputs: {
    salesGrowth: "45% CAGR 2019-2024",
    marketLeaders: ["Tesla: 23%", "BYD: 17%", "Volkswagen: 8%"],
    regionAnalysis: "China 52%, Europe 23%, North America 18%",
    projections: "Expected to reach $1.7T by 2030"
  }
}

// Cloud Provider Benchmarks
{
  task: "Compare cloud provider performance",
  outputs: {
    latency: { AWS: "12ms", Azure: "15ms", GCP: "11ms" },
    uptime: { AWS: "99.99%", Azure: "99.95%", GCP: "99.97%" },
    pricing: "Detailed cost comparison matrix",
    recommendations: "Best for specific use cases"
  }
}
```

### 5. Report Generator Agent

**Purpose**: Transforms synthesized research findings into comprehensive, well-structured final reports.

**Report Components**:

- Executive summary
- Methodology overview
- Key findings with citations
- Data visualizations
- Conclusions and recommendations
- Proper citation formatting

**Output Format**:

```markdown
# [Research Topic] - Comprehensive Report

## Executive Summary

- Key finding 1 with impact
- Key finding 2 with implications
- Primary recommendation

## Methodology

- Data sources used
- Analysis approach
- Limitations acknowledged

## Findings

### Section 1: [Topic Area]

- Detailed analysis with citations
- Supporting data and charts
- Expert opinions quoted

## Recommendations

1. Immediate actions (0-30 days)
2. Short-term initiatives (1-3 months)
3. Long-term strategy (6-12 months)

## References

[1] Source citation in APA format
[2] Additional references
```

### 6. Search Specialist Agent

**Purpose**: Expert web researcher using advanced search techniques and synthesis. Masters search operators, result filtering, and multi-source verification.

**Specializations**:

- Advanced search query formulation with operators
- Domain-specific searching and filtering
- Result quality evaluation and ranking
- Information synthesis across sources
- Fact verification and cross-referencing
- Historical and trend analysis

**Search Strategies**:

```javascript
// Query Optimization
{
  exactMatch: '"specific phrase"',  // Use quotes for exact matches
  exclusions: '-irrelevant -spam',    // Exclude terms with minus
  timeframe: 'after:2024-01-01',      // Target specific dates
  domains: 'site:reuters.com OR site:bloomberg.com'  // Specific sources
}

// Domain Filtering
{
  allowedDomains: ['reuters.com', 'bloomberg.com', 'wsj.com'],
  blockedDomains: ['unreliablesource.com'],
  academicFocus: ['scholar.google.com', 'arxiv.org']
}
```

**Example Usage**:

```javascript
// Competitive Intelligence Research
async function deepCompetitorResearch(competitor) {
  const searchSpecialist = await deployAgent('search-specialist');
  
  const findings = await searchSpecialist.research({
    queries: [
      `"${competitor}" product launch 2024`,
      `"${competitor}" financial results -advertisement`,
      `"${competitor}" leadership changes CEO CTO`
    ],
    allowedDomains: trustedBusinessSources,
    verificationLevel: 'high',
    crossReference: true
  });
  
  return findings.synthesized;
}
```

### 7. Task Decomposition Expert Agent

**Purpose**: Breaks down complex user goals into actionable tasks and identifies the optimal combination of tools, agents, and workflows.

### 8. Research Optimizer Agent (Orchestration Layer)

**Purpose**: Coordinates, evaluates, and optimizes the performance of multiple research agents working on complex investigations. Acts as the master orchestrator for the Opportunity Engine.

**Core Capabilities**:

- Goal analysis and requirement extraction
- Hierarchical task decomposition
- Resource and tool identification
- Workflow architecture design
- Implementation roadmap creation
- Optimization recommendations

**Decomposition Framework**:

```javascript
// Complex Goal Breakdown
{
  primaryObjective: "Build automated PR monitoring system",
  decomposition: {
    phase1_setup: [
      "Define monitoring scope and keywords",
      "Configure data sources and APIs",
      "Set up database schemas"
    ],
    phase2_collection: [
      "Implement RSS feed parsers",
      "Create web scraping modules",
      "Build API integrations"
    ],
    phase3_analysis: [
      "Deploy sentiment analysis",
      "Implement pattern detection",
      "Create scoring algorithms"
    ],
    phase4_reporting: [
      "Design dashboard UI",
      "Build alert system",
      "Create export functionality"
    ]
  },
  dependencies: {
    "phase2": ["phase1"],
    "phase3": ["phase2"],
    "phase4": ["phase2", "phase3"]
  },
  toolsRequired: [
    "Parser libraries",
    "NLP models",
    "Database ORM",
    "Frontend framework"
  ]
}
```

**Workflow Architecture Example**:

```javascript
// Research System Implementation
async function planResearchSystem(requirements) {
  const decomposer = await deployAgent('task-decomposition-expert');
  
  const plan = await decomposer.analyze({
    goal: requirements.objective,
    constraints: requirements.constraints,
    timeline: requirements.deadline,
    resources: requirements.availableTools
  });
  
  return {
    tasks: plan.atomicTasks,
    workflow: plan.executionStrategy,
    milestones: plan.checkpoints,
    risks: plan.mitigationStrategies
  };
}
```

## Integration with SignalDesk

### Intelligence Analysis Workflow

```javascript
// 1. Competitor Health Analysis
async function analyzeCompetitorHealth(competitor) {
  // Deploy data analyst for financial metrics
  const financialData = await dataAnalystAgent.analyze({
    type: "financial",
    target: competitor,
    metrics: ["revenue", "growth", "profitability"],
  });

  // Use general researcher for leadership/product news
  const qualitativeData = await researchAgent.gather({
    topics: ["leadership changes", "product launches", "partnerships"],
    target: competitor,
  });

  // Synthesize into health score
  return calculateHealthScore(financialData, qualitativeData);
}

// 2. Topic Trend Analysis
async function analyzeTopicTrends(topic) {
  // Query clarifier ensures topic is specific
  const clarifiedTopic = await queryClarifier.clarify(topic);

  // Research brief generator creates structured plan
  const researchBrief = await briefGenerator.create(clarifiedTopic);

  // Orchestrator manages multi-agent research
  const findings = await researchOrchestrator.execute(researchBrief);

  // Report generator creates final analysis
  return reportGenerator.generateTopicAnalysis(findings);
}
```

### Opportunity Identification Flow

```javascript
// 3. Strategic Opportunity Discovery
async function identifyOpportunities(organization, competitors, topics) {
  // Comprehensive competitive analysis
  const competitiveIntel = await Promise.all(
    competitors.map((c) => analyzeCompetitorHealth(c))
  );

  // Topic positioning analysis
  const topicAnalysis = await Promise.all(
    topics.map((t) => analyzeTopicTrends(t))
  );

  // Identify gaps and opportunities
  const opportunities = identifyStrategicGaps(
    organization,
    competitiveIntel,
    topicAnalysis
  );

  // Generate opportunity concepts with NVS scores
  return opportunities.map((opp) => ({
    ...opp,
    nvsScore: calculateNarrativeVacuum(opp),
    executionPlan: generateExecutionStrategy(opp),
  }));
}
```

## Agent Prompting Templates

### Query Clarifier Prompt

```
Analyze this research query for clarity and specificity:
Query: [USER_QUERY]

Determine if clarification is needed. If yes, suggest 2-3 clarifying questions.
If no, confirm the query is actionable and specific enough for research.
```

### Research Brief Generator Prompt

```
Transform this clarified query into a structured research brief:
Query: [CLARIFIED_QUERY]

Include:
- 3-5 specific sub-questions
- 5-10 relevant keywords
- Preferred source types
- Success criteria
- Research scope boundaries
```

### Data Analyst Prompt

```
Perform quantitative analysis on:
Topic: [RESEARCH_TOPIC]

Focus on:
- Statistical trends and patterns
- Numerical comparisons
- Market metrics and benchmarks
- Data quality assessment
- Visualization recommendations

Provide specific numbers, percentages, and growth rates where available.
```

### Report Generator Prompt

```
Create a comprehensive report from these research findings:
[RESEARCH_FINDINGS]

Structure:
- Executive summary (3-5 bullets)
- Key findings with evidence
- Data visualization descriptions
- Strategic implications
- Actionable recommendations
- Proper citations

Tone: Professional, concise, executive-ready
```

### Search Specialist Prompt

```
Conduct comprehensive web research on:
Topic: [RESEARCH_TOPIC]

Use advanced search techniques:
- Formulate 3-5 query variations
- Apply domain filtering for quality
- Verify facts across multiple sources
- Track contradictions and consensus

Provide:
- Methodology and queries used
- Curated findings with URLs
- Credibility assessment
- Synthesized insights
- Gaps identified
```

### Task Decomposition Expert Prompt

```
Analyze and decompose this complex goal:
Goal: [USER_OBJECTIVE]

Provide:
1. Goal analysis with success criteria
2. Hierarchical task breakdown
3. Required resources and tools
4. Optimal workflow with dependencies
5. Implementation timeline
6. Risk mitigation strategies

Focus on actionable, practical recommendations.
```

## Best Practices

### 1. Agent Selection

- Use **Query Clarifier** for all new research requests
- Deploy **Data Analyst** for metrics-heavy research
- Leverage **Research Orchestrator** for complex, multi-faceted topics
- Apply **Report Generator** for final deliverables
- Use **Search Specialist** for deep web research and fact-checking
- Deploy **Task Decomposition Expert** for complex implementation planning

### 2. Parallel Processing

```javascript
// Efficient multi-agent deployment
const [competitorData, marketData, trendData] = await Promise.all([
  dataAnalyst.analyzeCompetitors(competitors),
  dataAnalyst.analyzeMarket(industry),
  researcher.analyzeTrends(topics),
]);
```

### 3. Error Handling

```javascript
try {
  const research = await orchestrator.execute(brief);
  if (!research.complete) {
    // Fallback to simplified analysis
    return basicAnalysis(brief);
  }
  return research;
} catch (error) {
  console.error("Research failed:", error);
  return cachedInsights || defaultAnalysis;
}
```

### 4. Quality Assurance

- Always validate data analyst outputs for accuracy
- Cross-reference findings across multiple agents
- Maintain citation trails for all insights
- Regular calibration of scoring algorithms

## Performance Optimization

### Caching Strategy

```javascript
const researchCache = new Map();

async function getCachedOrResearch(query) {
  const cacheKey = generateCacheKey(query);

  if (researchCache.has(cacheKey)) {
    const cached = researchCache.get(cacheKey);
    if (Date.now() - cached.timestamp < 3600000) {
      // 1 hour
      return cached.data;
    }
  }

  const fresh = await researchOrchestrator.execute(query);
  researchCache.set(cacheKey, { data: fresh, timestamp: Date.now() });
  return fresh;
}
```

### Batch Processing

```javascript
// Process multiple research requests efficiently
async function batchResearch(requests) {
  // Group by type for efficient agent utilization
  const grouped = groupRequestsByType(requests);

  // Process each group with appropriate agent
  const results = await Promise.all(
    Object.entries(grouped).map(([type, reqs]) => processWithAgent(type, reqs))
  );

  return flattenAndOrganize(results);
}
```

## Monitoring & Metrics

### Agent Performance Tracking

```javascript
const agentMetrics = {
  queryComplexity: 0 - 10, // Average query complexity handled
  responseTime: "seconds", // Average completion time
  accuracyScore: 0 - 100, // Validated accuracy of outputs
  utilizationRate: "percent", // How often agent is used
  errorRate: "percent", // Failure rate
};
```

### Quality Metrics

- Research depth score
- Source diversity index
- Citation quality rating
- Insight novelty score
- Actionability rating

## Complete Agent Roster

### Research & Analysis Agents
1. **Query Clarifier** - Query refinement and clarity assessment
2. **Research Brief Generator** - Structured research plan creation
3. **Research Orchestrator** - Multi-agent workflow coordination
4. **Data Analyst** - Quantitative analysis and metrics
5. **Report Generator** - Final report synthesis and formatting
6. **Search Specialist** - Advanced web research and verification
7. **Task Decomposition Expert** - Complex task breakdown and planning

### Opportunity & Creative Agents (separate files)
- **Opportunity Creative Agent** (`opportunityCreativeAgent.js`)
- **Topic Momentum Agents** (`topicMomentumAgents.js`)

## Future Enhancements

### Planned Agent Capabilities

1. **Industry-Specific Agents**: Specialized agents for healthcare, finance, tech
2. **Real-time Monitoring Agent**: Continuous intelligence gathering
3. **Predictive Analysis Agent**: Forecast trends and opportunities
4. **Multi-language Research Agent**: Global intelligence gathering
5. **Visual Analysis Agent**: Image and infographic interpretation

### Integration Roadmap

- Direct API connections to premium data sources
- Real-time collaboration features
- Advanced NLP for sentiment analysis
- Machine learning for pattern recognition
- Automated alert systems for critical insights
