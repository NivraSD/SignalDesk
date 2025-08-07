# SignalDesk Agent Directory

## Overview
SignalDesk employs a multi-agent architecture for comprehensive intelligence gathering, research, and opportunity identification. All agents are organized in `/backend/src/agents/`.

## Agent Files Organization

### 📁 Research & Analysis Agents (Markdown Format)
These agents are defined as markdown templates for use with Claude Code's agent system:

1. **`query-clarifier.md`** - Analyzes queries for clarity and specificity
2. **`research-brief-generator.md`** - Creates structured research plans
3. **`research-orchestrator.md`** - Coordinates multi-agent workflows
4. **`data-analyst.md`** - Quantitative analysis and metrics
5. **`report-generator.md`** - Synthesizes findings into reports
6. **`search-specialist.md`** - Advanced web research and verification
7. **`task-decomposition-expert.md`** - Breaks down complex goals

### 📁 Opportunity & Creative Agents (JavaScript Format)
These agents are implemented as JavaScript modules for direct integration:

1. **`opportunityCreativeAgent.js`** - Generates creative PR angles
2. **`topicMomentumAgents.js`** - Identifies trending topics and momentum

### 📁 Documentation
- **`ResearchAgents.md`** - Comprehensive documentation of all research agents
- **`AGENT_SUMMARY.md`** - This file

## Quick Reference

### When to Use Each Agent

| Agent | Use Case | Output |
|-------|----------|--------|
| **Query Clarifier** | Ambiguous or broad queries | Clarification questions or confirmation |
| **Research Brief Generator** | After query clarification | Structured research plan with keywords |
| **Research Orchestrator** | Complex multi-faceted research | Coordinated multi-agent results |
| **Data Analyst** | Metrics, trends, statistics | Quantitative insights with numbers |
| **Report Generator** | Final deliverables | Executive-ready reports |
| **Search Specialist** | Deep web research | Verified facts with sources |
| **Task Decomposition Expert** | Complex implementation planning | Hierarchical task breakdown |
| **Opportunity Creative** | PR angle generation | Creative concepts with scores |
| **Topic Momentum** | Trend identification | Momentum scores and insights |

## Agent Invocation Examples

### Using Markdown Agents (with Claude Code)
```javascript
// Deploy a research agent
const agent = await deployAgent('search-specialist');
const results = await agent.research({
  topic: 'competitor analysis',
  depth: 'comprehensive'
});
```

### Using JavaScript Agents (Direct Import)
```javascript
// Import and use opportunity agent
const { generateCreativeAngles } = require('./opportunityCreativeAgent');
const angles = await generateCreativeAngles(intelligenceData);
```

## Agent Capabilities Matrix

| Capability | Query | Brief | Orchestrator | Data | Report | Search | Decompose | Opportunity | Momentum |
|------------|-------|-------|--------------|------|---------|---------|-----------|-------------|----------|
| Research Planning | ✓ | ✓ | ✓ | | | | ✓ | | |
| Data Analysis | | | | ✓ | | ✓ | | | ✓ |
| Content Generation | | | | | ✓ | | | ✓ | |
| Web Search | | | | | | ✓ | | | |
| Workflow Design | | | ✓ | | | | ✓ | | |
| Trend Analysis | | | | ✓ | | ✓ | | | ✓ |
| Creative Ideation | | | | | | | | ✓ | |
| Task Planning | | ✓ | ✓ | | | | ✓ | | |

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
1. Create `agent-name.md` in `/backend/src/agents/`
2. Follow the YAML frontmatter format
3. Update `ResearchAgents.md` documentation
4. Test with Claude Code's agent system

### For Functional Agents (JavaScript):
1. Create `agentName.js` in `/backend/src/agents/`
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

*Last Updated: August 2025*
*Total Agents: 9 (7 Research + 2 Opportunity)*