# SignalDesk Agent Directory

## Overview

SignalDesk employs a multi-agent architecture for comprehensive intelligence gathering, research, and opportunity identification. All agents are organized in `/backend/src/agents/` with subdirectories for better organization:

- `research/` - Research and analysis agents
- `opportunity/` - Opportunity and creative agents
- `monitoring/` - Monitoring and orchestration agents
- `intelligence/` - Intelligence gathering agents
- `utility/` - Utility and workflow management agents
- `strategic/` - Strategic planning and risk management agents

## Agent Files Organization

### 📁 Research & Analysis Agents (`/research/`)

These agents are defined as markdown templates for use with Claude Code's agent system:

1. **`research/query-clarifier.md`** - Analyzes queries for clarity and specificity
2. **`research/research-brief-generator.md`** - Creates structured research plans
3. **`research/research-orchestrator.md`** - Coordinates multi-agent workflows
4. **`research/research-optimizer.md`** - Optimizes research agent performance and coordination
5. **`research/data-analyst.md`** - Quantitative analysis and metrics
6. **`research/report-generator.md`** - Synthesizes findings into reports
7. **`research/search-specialist.md`** - Advanced web research and verification
8. **`research/task-decomposition-expert.md`** - Breaks down complex goals

### 📁 Opportunity & Creative Agents (`/opportunity/`)

These agents handle opportunity identification and creative content:

1. **`opportunity/opportunityCreativeAgent.js`** - Generates creative PR angles
2. **`opportunity/topicMomentumAgents.js`** - Identifies trending topics and momentum
3. **`opportunity/OpportunityEngineOrchestration.js`** - Orchestrates opportunity discovery workflow
4. **`opportunity/content-marketer.md`** - Creates and optimizes marketing content

### 📁 Monitoring Agents (`/monitoring/`)

These agents handle monitoring and orchestration:

1. **`monitoring/IntelligentIndexingAgent.js`** - Intelligent content indexing and categorization
2. **`monitoring/UltimateMonitoringAgent.js`** - Comprehensive monitoring orchestration
3. **`monitoring/intelligentMonitoringAgent.js`** - Frontend monitoring coordination

### 📁 Intelligence Agents (`/intelligence/`)

These agents handle intelligence gathering and analysis:

1. **`intelligence/SourceDiscoveryAgent.js`** - Discovers and validates new data sources
2. **`intelligence/WebIntelligenceAgent.js`** - Web-based intelligence gathering

### 📁 Utility Agents (`/utility/`)

These agents handle workflow management and utility tasks:

1. **`utility/agent-router.md`** - Routes tasks to appropriate specialized agents
2. **`utility/file-organizer.md`** - Manages and organizes file structures

### 📁 Strategic Agents (`/strategic/`)

These agents handle strategic planning and risk management:

1. **`strategic/risk-manager.md`** - Identifies, assesses, and mitigates risks

### 📁 Documentation

- **`ResearchAgents.md`** - Comprehensive documentation of all research agents
- **`AGENT_SUMMARY.md`** - This file

## Quick Reference

### When to Use Each Agent

| Agent                                 | Use Case                        | Output                                  |
| ------------------------------------- | ------------------------------- | --------------------------------------- |
| **Query Clarifier**                   | Ambiguous or broad queries      | Clarification questions or confirmation |
| **Research Brief Generator**          | After query clarification       | Structured research plan with keywords  |
| **Research Orchestrator**             | Complex multi-faceted research  | Coordinated multi-agent results         |
| **Research Optimizer**                | Optimize research workflows     | Performance improvements and insights   |
| **Data Analyst**                      | Metrics, trends, statistics     | Quantitative insights with numbers      |
| **Report Generator**                  | Final deliverables              | Executive-ready reports                 |
| **Search Specialist**                 | Deep web research               | Verified facts with sources             |
| **Task Decomposition Expert**         | Complex implementation planning | Hierarchical task breakdown             |
| **Opportunity Creative**              | PR angle generation             | Creative concepts with scores           |
| **Topic Momentum**                    | Trend identification            | Momentum scores and insights            |
| **Opportunity Engine Orchestration**  | Full opportunity workflow       | End-to-end opportunity pipeline         |
| **Content Marketer**                  | Marketing content creation      | SEO-optimized marketing materials       |
| **Intelligent Indexing**              | Content categorization          | Indexed and categorized data            |
| **Ultimate Monitoring**               | Comprehensive monitoring        | Full monitoring dashboard               |
| **Intelligent Monitoring (Frontend)** | UI monitoring coordination      | Real-time monitoring updates            |
| **Source Discovery**                  | Find new data sources           | Validated source recommendations        |
| **Web Intelligence**                  | Web data extraction             | Structured web intelligence             |
| **Agent Router**                      | Task routing and delegation     | Agent selection recommendations         |
| **File Organizer**                    | File system management          | Organized file structure                |
| **Risk Manager**                      | Risk assessment and mitigation  | Risk analysis and strategies            |

## Agent Invocation Examples

### Using Markdown Agents (with Claude Code)

```javascript
// Deploy a research agent
const agent = await deployAgent("search-specialist");
const results = await agent.research({
  topic: "competitor analysis",
  depth: "comprehensive",
});
```

### Using JavaScript Agents (Direct Import)

```javascript
// Import and use opportunity agent
const {
  generateCreativeAngles,
} = require("./opportunity/opportunityCreativeAgent");
const angles = await generateCreativeAngles(intelligenceData);
```

## Agent Capabilities Matrix

| Capability           | Query | Brief | Orchestrator | Optimizer | Data | Report | Search | Decompose | Opportunity | Momentum | Indexing | Monitoring |
| -------------------- | ----- | ----- | ------------ | --------- | ---- | ------ | ------ | --------- | ----------- | -------- | -------- | ---------- |
| Research Planning    | ✓     | ✓     | ✓            | ✓         |      |        |        | ✓         |             |          |          |            |
| Data Analysis        |       |       |              |           | ✓    |        | ✓      |           |             | ✓        | ✓        | ✓          |
| Content Generation   |       |       |              |           |      | ✓      |        |           | ✓           |          |          |            |
| Web Search           |       |       |              |           |      |        | ✓      |           |             |          |          | ✓          |
| Workflow Design      |       |       | ✓            | ✓         |      |        |        | ✓         | ✓           |          |          |            |
| Trend Analysis       |       |       |              |           | ✓    |        | ✓      |           |             | ✓        |          | ✓          |
| Creative Ideation    |       |       |              |           |      |        |        |           | ✓           |          |          |            |
| Task Planning        |       | ✓     | ✓            | ✓         |      |        |        | ✓         |             |          |          |            |
| Real-time Monitoring |       |       |              |           |      |        |        |           |             |          |          | ✓          |
| Source Discovery     |       |       |              |           |      |        | ✓      |           |             |          | ✓        |            |

## Integration Points

### 1. Intelligence Pipeline

```
Query → Clarifier → Brief Generator → Orchestrator → [Specialist Agents] → Report Generator
```

### 2. Opportunity Discovery

```
Intelligence Data → Topic Momentum → Opportunity Creative → Execution Plan
```

### 3. Research Workflow

```
User Request → Task Decomposition → Agent Selection → Parallel Execution → Synthesis
```

## Adding New Agents

### For Research Agents (Markdown):

1. Create `agent-name.md` in `/backend/src/agents/research/`
2. Follow the YAML frontmatter format
3. Update `ResearchAgents.md` documentation
4. Test with Claude Code's agent system

### For Functional Agents (JavaScript):

1. Create `agentName.js` in the appropriate subdirectory:
   - `/backend/src/agents/opportunity/` for opportunity agents
   - `/backend/src/agents/monitoring/` for monitoring agents
   - `/backend/src/agents/intelligence/` for intelligence agents
   - `/backend/src/agents/utility/` for utility and workflow agents
   - `/backend/src/agents/strategic/` for strategic and risk management agents
2. Export functions for integration
3. Add documentation to this summary
4. Import and use in application code

## Performance Considerations

- **Parallel Execution**: Deploy multiple agents concurrently when possible
- **Caching**: Implement result caching for repeated queries
- **Error Handling**: Each agent should have fallback strategies
- **Monitoring**: Track agent performance metrics

## Future Roadmap

- [ ] Industry-specific research agents
- [ ] Real-time monitoring agents
- [ ] Predictive analysis agents
- [ ] Multi-language support
- [ ] Visual analysis capabilities

---

_Last Updated: August 2025_
_Total Agents: 20 (8 Research + 4 Opportunity/Creative + 5 Monitoring/Intelligence + 2 Utility + 1 Strategic)_
