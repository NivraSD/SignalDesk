# Knowledge Library Registry - Integration Guide

## Overview

The **KnowledgeLibraryRegistry** is structured identically to your MasterSourceRegistry, making integration seamless. Instead of RSS feeds and media sources, it aggregates academic research, case studies, industry reports, and methodologies that support your CASCADE, MIRROR, CHORUS, and other advanced PR strategies.

## Architecture

```
KnowledgeLibraryRegistry
├── TIER1_KNOWLEDGE (Always included - foundational research)
│   ├── foundational_psychology
│   ├── network_science
│   ├── trust_credibility
│   ├── framing_narrative
│   └── behavioral_economics
│
├── INDUSTRY_INTELLIGENCE (Consultancy reports & benchmarks)
│   ├── pr_communications
│   ├── consultancy_insights
│   └── media_consumption
│
├── PATTERN_KNOWLEDGE (Strategy-specific research)
│   ├── CASCADE
│   │   ├── academic_foundations
│   │   ├── case_studies
│   │   ├── methodologies
│   │   └── timing_research
│   ├── MIRROR
│   │   ├── academic_foundations
│   │   ├── case_studies
│   │   ├── early_warning_systems
│   │   └── recovery_frameworks
│   ├── CHORUS
│   │   ├── academic_foundations
│   │   ├── case_studies
│   │   └── ethical_frameworks
│   └── TROJAN
│       └── academic_foundations
│
├── EMERGING_RESEARCH (Latest trends)
│   ├── ai_communications
│   └── platform_evolution
│
└── TOOLS_METHODOLOGIES (Practical implementation)
    ├── network_analysis
    ├── sentiment_analysis
    └── research_databases
```

## Integration with Your Existing System

### 1. Deployment (Same as MasterSourceRegistry)

```bash
# Deploy to Supabase Edge Functions
supabase functions deploy knowledge-library-registry

# Test the function
curl -X POST 'https://your-project.supabase.co/functions/v1/knowledge-library-registry' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"pattern": "CASCADE"}'
```

### 2. Client-Side Integration

Add to your existing API calls alongside MasterSourceRegistry:

```typescript
// In your research component
const fetchKnowledgeResources = async (pattern: string) => {
  const { data, error } = await supabase.functions.invoke('knowledge-library-registry', {
    body: { 
      pattern: pattern,  // 'CASCADE', 'MIRROR', 'CHORUS', etc.
      priority_filter: 'critical',  // Optional: 'critical', 'high', 'medium', 'low'
      research_area: 'network_science'  // Optional: specific area
    }
  });

  if (error) throw error;
  return data;
};
```

### 3. Enhanced Research Agent Integration

#### Update Your NIV-Fireplexity Agent

```typescript
// Add knowledge library context to research queries
const enhancedResearch = async (query: string, pattern: string) => {
  // Step 1: Get relevant knowledge resources
  const knowledge = await fetchKnowledgeResources(pattern);
  
  // Step 2: Build context for AI agent
  const researchContext = `
You are researching: ${query}

RELEVANT ACADEMIC FOUNDATIONS:
${knowledge.data.foundational.map(k => `
- ${k.title} by ${k.author}
  Key concepts: ${k.key_concepts?.join(', ')}
  Application: ${k.application.join(', ')}
`).join('\n')}

RELEVANT CASE STUDIES:
${knowledge.data.pattern_specific
  .filter(k => k.type === 'case_study')
  .map(k => `
- ${k.title}
  Tags: ${k.tags.join(', ')}
  Key concepts: ${k.key_concepts?.join(', ')}
  Metrics: ${JSON.stringify(k.metrics || {})}
`).join('\n')}

Use this academic grounding to inform your research and recommendations.
`;

  // Step 3: Execute research with enhanced context
  return await executeResearchWithContext(query, researchContext);
};
```

#### Update Your NIV-Strategic-Framework Agent

```typescript
// Enhance strategy generation with knowledge
const generateStrategyWithKnowledge = async (brief: string, pattern: string) => {
  const knowledge = await fetchKnowledgeResources(pattern);
  
  const strategyPrompt = `
Generate a ${pattern} strategy for: ${brief}

APPLY THESE PROVEN FRAMEWORKS:
${knowledge.data.pattern_specific
  .filter(k => k.type === 'academic_paper' || k.type === 'book')
  .map(k => `
Framework: ${k.title}
Key Concepts: ${k.key_concepts?.join(', ')}
`).join('\n')}

LEARN FROM THESE CASE STUDIES:
${knowledge.data.pattern_specific
  .filter(k => k.type === 'case_study')
  .map(k => `
Case: ${k.title}
What Worked: ${k.key_concepts?.slice(0, 3).join(', ')}
Metrics: ${k.metrics ? `${Object.entries(k.metrics).map(([k,v]) => `${k}: ${v}`).join(', ')}` : 'N/A'}
`).join('\n')}

Generate strategy that applies these proven principles.
`;

  return await generateStrategy(strategyPrompt);
};
```

### 4. Real-World Usage Examples

#### Example 1: CASCADE Campaign Research

```typescript
// User wants to launch viral campaign
const cascadeKnowledge = await fetchKnowledgeResources('CASCADE');

// Returns structured knowledge including:
// - Cialdini's influence principles
// - Damon Centola's 25% tipping point research
// - ALS Ice Bucket Challenge case study
// - Old Spice viral campaign analysis
// - Network analysis methodologies
// - Timing optimization research

// Your agent now has academic grounding to:
// 1. Apply 25% tipping point strategy
// 2. Reference successful viral mechanics
// 3. Use proven influence principles
// 4. Recommend optimal timing based on research
```

#### Example 2: MIRROR Crisis Prevention

```typescript
// User facing potential crisis
const mirrorKnowledge = await fetchKnowledgeResources('MIRROR');

// Returns:
// - Crisis Communication Theory (Coombs)
// - Inoculation Theory (McGuire)
// - Tylenol crisis case study
// - Boeing 737 MAX lessons
// - Early warning methodologies
// - Reputation repair frameworks

// Your agent can:
// 1. Apply SCCT framework to categorize crisis
// 2. Use inoculation theory for prevention
// 3. Learn from Tylenol's gold standard response
// 4. Avoid Boeing's mistakes
// 5. Implement early warning systems
```

#### Example 3: Multi-Pattern Research

```typescript
// Complex campaign needing multiple patterns
const allKnowledge = await Promise.all([
  fetchKnowledgeResources('CASCADE'),
  fetchKnowledgeResources('MIRROR'),
  fetchKnowledgeResources('CHORUS')
]);

// Combine insights from:
// - CASCADE viral mechanics
// - MIRROR crisis prevention
// - CHORUS authentic engagement
// - Cross-pattern case studies
```

## Query Parameters

### Available Patterns
- `CASCADE` - Multi-phase viral campaigns
- `MIRROR` - Crisis prediction and management
- `CHORUS` - Social media influence campaigns
- `TROJAN` - Indirect persuasion
- `null` - Returns all foundational knowledge

### Priority Filters
- `critical` - Must-read foundational research
- `high` - Important supporting research
- `medium` - Supplementary research
- `low` - Nice-to-have context

### Research Areas
- `foundational_psychology`
- `network_science`
- `trust_credibility`
- `framing_narrative`
- `behavioral_economics`
- `pr_communications`
- `consultancy_insights`
- `media_consumption`

## Response Structure

```json
{
  "success": true,
  "pattern": "CASCADE",
  "data": {
    "foundational": [
      {
        "title": "Influence: The Psychology of Persuasion",
        "author": "Robert Cialdini",
        "type": "book",
        "url": "https://www.influenceatwork.com/",
        "priority": "critical",
        "tags": ["persuasion", "social_proof", "authority"],
        "application": ["CASCADE", "CHORUS", "general_strategy"],
        "key_concepts": [
          "Six principles of influence",
          "Social proof mechanics",
          "Authority establishment"
        ]
      }
    ],
    "pattern_specific": [
      {
        "title": "ALS Ice Bucket Challenge Analysis",
        "type": "case_study",
        "priority": "critical",
        "tags": ["viral_campaign", "grassroots", "social_media"],
        "key_concepts": [
          "Challenge mechanics",
          "Celebrity amplification",
          "Nomination chain"
        ],
        "metrics": {
          "reach": "17M participants",
          "raised": "$115M",
          "duration": "8 weeks"
        }
      }
    ],
    "industry_intelligence": [...],
    "emerging": [...],
    "tools": [...]
  },
  "metadata": {
    "total_resources": 147,
    "patterns_available": ["CASCADE", "MIRROR", "CHORUS", "TROJAN"],
    "research_areas": ["foundational_psychology", "network_science", ...],
    "last_updated": "2025-10-10T...",
    "update_schedule": {
      "tier1": "Annual review",
      "industry_intelligence": "Quarterly",
      "emerging_research": "Monthly"
    }
  }
}
```

## Advanced Use Cases

### 1. Research Agent Enhancement

```typescript
// Before: Generic research
agent.research("How to make content go viral?");

// After: Knowledge-grounded research
const knowledge = await fetchKnowledgeResources('CASCADE');
agent.researchWithContext(
  "How to make content go viral?",
  knowledge.data.foundational,  // Academic principles
  knowledge.data.pattern_specific  // Proven case studies
);

// Agent now references:
// - Jonah Berger's STEPPS framework
// - Damon Centola's 25% tipping point
// - Ice Bucket Challenge mechanics
// - Optimal timing research
```

### 2. Strategy Validation

```typescript
// Validate strategy against proven frameworks
const validateStrategy = async (strategy: object, pattern: string) => {
  const knowledge = await fetchKnowledgeResources(pattern);
  
  // Check if strategy incorporates:
  return {
    uses_proven_principles: checkAgainstFrameworks(
      strategy, 
      knowledge.data.foundational
    ),
    learns_from_cases: compareToSuccessfulCases(
      strategy,
      knowledge.data.pattern_specific
    ),
    avoids_failures: checkAgainstFailures(
      strategy,
      knowledge.data.pattern_specific.filter(k => k.outcomes?.failure)
    )
  };
};
```

### 3. Dynamic Learning System

```typescript
// Agent learns from knowledge base
const trainAgent = async (pattern: string) => {
  const knowledge = await fetchKnowledgeResources(pattern);
  
  // Build training dataset
  const trainingData = {
    principles: knowledge.data.foundational.map(k => ({
      concept: k.title,
      application: k.key_concepts,
      when_to_use: k.application
    })),
    
    success_patterns: knowledge.data.pattern_specific
      .filter(k => k.type === 'case_study' && k.metrics)
      .map(k => ({
        case: k.title,
        what_worked: k.key_concepts,
        metrics: k.metrics,
        tags: k.tags
      })),
    
    methodologies: knowledge.data.pattern_specific
      .filter(k => k.type === 'methodology')
      .map(k => ({
        method: k.title,
        tools: k.tools,
        steps: k.key_concepts
      }))
  };
  
  return updateAgentKnowledge(trainingData);
};
```

### 4. Citation and Attribution

```typescript
// Generate properly cited recommendations
const generateCitedStrategy = async (brief: string, pattern: string) => {
  const knowledge = await fetchKnowledgeResources(pattern);
  
  const strategy = await generateStrategy(brief, pattern);
  
  // Add citations
  const citedStrategy = {
    ...strategy,
    academic_basis: knowledge.data.foundational.map(k => ({
      principle: k.title,
      author: k.author,
      url: k.url,
      applied_in: findApplicationInStrategy(strategy, k.key_concepts)
    })),
    case_study_evidence: knowledge.data.pattern_specific
      .filter(k => k.type === 'case_study')
      .map(k => ({
        case: k.title,
        relevant_because: k.tags.filter(tag => 
          strategy.tags?.includes(tag)
        ),
        metrics: k.metrics
      }))
  };
  
  return citedStrategy;
};
```

## Maintaining the Knowledge Base

### Quarterly Updates Checklist

```typescript
// Add new research
const updateKnowledge = {
  Q1_2026: {
    add: [
      {
        title: "New CASCADE Research",
        type: "academic_paper",
        priority: "high",
        // ... full structure
      }
    ],
    update: [
      {
        title: "Edelman Trust Barometer",
        // Update with latest annual data
      }
    ]
  }
};
```

### Monitoring New Research

```typescript
// Set up Google Scholar alerts for:
const scholarAlerts = [
  'information cascades',
  'viral marketing',
  'crisis communication',
  'network effects',
  'social proof',
  'influence campaigns',
  'reputation management'
];

// SSRN email alerts for:
const ssrnAlerts = [
  'Communications',
  'Marketing',
  'Social Networks',
  'Behavioral Economics'
];
```

## Benefits Over External Search

### Why Built-In Knowledge Library?

1. **Curated Quality**: Only proven, peer-reviewed research
2. **Pattern-Optimized**: Organized by your specific strategies
3. **Instant Access**: No API rate limits or search time
4. **Cost-Effective**: No per-query costs
5. **Context-Aware**: Pre-filtered for PR/communications
6. **Case Study Database**: Detailed metrics and outcomes
7. **Methodology Library**: Step-by-step implementation guides
8. **Citation Ready**: Proper attribution built-in

### When to Use External Search

- Current events (past 30 days)
- Competitor monitoring
- Real-time trending topics
- Specific organization research
- Recent regulatory changes

### When to Use Knowledge Library

- Strategy development
- Framework selection
- Case study analysis
- Methodology guidance
- Academic grounding
- Pattern validation
- Agent training
- Citation requirements

## Example: Full Research Workflow

```typescript
const comprehensiveResearch = async (query: string, context: object) => {
  // Step 1: Get academic foundation from knowledge library
  const knowledge = await fetchKnowledgeResources(context.pattern);
  
  // Step 2: Get real-time competitive intelligence
  const competitive = await fetchMasterSourceRegistry(context.industry);
  
  // Step 3: Web search for current events
  const current = await webSearch(`${query} ${new Date().getFullYear()}`);
  
  // Step 4: Combine all sources
  return {
    academic_foundation: knowledge.data.foundational,
    proven_strategies: knowledge.data.pattern_specific,
    industry_benchmarks: knowledge.data.industry_intelligence,
    competitive_landscape: competitive.data,
    current_trends: current,
    
    recommendation: synthesizeRecommendation({
      academic: knowledge,
      competitive: competitive,
      current: current
    })
  };
};
```

## Next Steps

1. **Deploy the function** to your Supabase project
2. **Test the API** with sample queries
3. **Integrate with NIV agents** using examples above
4. **Set up update schedule** for quarterly reviews
5. **Train your agents** on the knowledge base
6. **Monitor usage** and expand as needed

## Support

For questions or issues:
- Check the response structure matches your expectations
- Verify pattern names match: 'CASCADE', 'MIRROR', 'CHORUS'
- Ensure priority filters use: 'critical', 'high', 'medium', 'low'
- Review the metadata for available patterns and areas

---

**Your research agents now have access to 147+ curated academic papers, case studies, industry reports, and methodologies - all structured specifically for CASCADE, MIRROR, CHORUS, and other advanced PR strategies.**