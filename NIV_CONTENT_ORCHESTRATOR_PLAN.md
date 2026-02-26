# NIV Content Orchestrator - Intelligent Edge Function Plan

## Executive Summary
Create a sophisticated edge function (`niv-content-orchestrator`) that intelligently orchestrates content generation, similar to how `niv-orchestrator-robust` handles strategic planning. This would move orchestration logic from the frontend to the backend, enabling much smarter content creation.

---

## 🎯 Core Capabilities

### 1. **Intent Recognition**
Unlike the current simple routing, the orchestrator would:
- Analyze user input to understand true intent
- Identify content needs even when not explicitly stated
- Detect multiple content requirements in a single request
- Understand context clues (urgency, audience, purpose)

### 2. **Context Aggregation**
Automatically pull in relevant context from:
- **Memory Vault** - Previous strategies and content
- **Intelligence Pipeline** - Current market insights
- **Opportunity Engine** - Active opportunities
- **Content Library** - Similar past content for consistency
- **Organization Profile** - Brand voice, guidelines, preferences

### 3. **Multi-Step Orchestration**
Execute complex content workflows:
```
User: "We need to respond to the competitor announcement"
    ↓
Orchestrator:
1. Searches intelligence for competitor details
2. Analyzes our positioning vs competitor
3. Generates press release
4. Creates social posts
5. Drafts internal memo
6. Prepares executive talking points
```

### 4. **Intelligent Routing**
Dynamically decide which services to call:
- **mcp-content** - For standard content generation
- **mcp-visual** - For images/videos
- **gamma-presentation** - For slide decks
- **niv-orchestrator-robust** - For strategic context
- **firecrawl/search** - For real-time information

---

## 🏗️ Architecture

### Edge Function: `niv-content-orchestrator`

```typescript
// Main orchestrator function
async function orchestrateContent(request: {
  prompt: string,
  conversation: Message[],
  contentType?: string,
  organization: Organization,
  framework?: Framework,
  opportunity?: Opportunity
}) {

  // Step 1: Analyze Intent
  const intent = await analyzeIntent(prompt, conversation)

  // Step 2: Gather Context
  const context = await gatherContext({
    intent,
    organization,
    framework,
    opportunity
  })

  // Step 3: Plan Content Strategy
  const contentPlan = await planContentStrategy({
    intent,
    context,
    requirements: extractRequirements(prompt)
  })

  // Step 4: Execute Content Generation
  const results = await executeContentPlan(contentPlan)

  // Step 5: Quality Assurance
  const finalContent = await qualityAssurance(results, context)

  return finalContent
}
```

---

## 🔄 Workflow Examples

### Example 1: Crisis Response
**User Input**: "Negative article just published about us on TechCrunch"

**Orchestrator Actions**:
1. **Fetch Article** → Calls Firecrawl to get article content
2. **Analyze Sentiment** → Understand key criticisms
3. **Check History** → Search Memory Vault for related issues
4. **Generate Response Set**:
   - Official statement (mcp-content)
   - CEO tweet thread (mcp-content)
   - Customer email (mcp-content)
   - Internal talking points (mcp-content)
   - Board update (gamma-presentation)
5. **Ensure Consistency** → All content aligned on messaging

### Example 2: Product Launch
**User Input**: "Create launch content for our new AI feature"

**Orchestrator Actions**:
1. **Gather Product Info** → Pull from Memory Vault
2. **Research Competition** → Search for similar launches
3. **Generate Content Suite**:
   - Press release
   - Blog post (technical + general audience)
   - Social posts (Twitter, LinkedIn, Instagram)
   - Email campaign
   - Sales deck (Gamma)
   - Demo video script
4. **Create Distribution Plan** → Timeline and channels

### Example 3: Thought Leadership
**User Input**: "Position our CEO as an AI thought leader"

**Orchestrator Actions**:
1. **Analyze Industry Trends** → Search current AI discussions
2. **Find Unique Angle** → What others aren't saying
3. **Generate Content**:
   - LinkedIn article series (3-part)
   - Twitter thread templates
   - Podcast talking points
   - Conference keynote outline
   - Op-ed for major publication

---

## 🧠 Intelligence Features

### 1. **Learning System**
- Track which content performs well
- Learn organization's preferred style
- Adapt based on feedback
- Improve suggestions over time

### 2. **Content Coherence**
- Ensure all pieces tell consistent story
- Maintain brand voice across formats
- Connect content to strategic objectives
- Reference previous content appropriately

### 3. **Timing Intelligence**
- Suggest optimal posting times
- Consider news cycles
- Avoid conflicts with other announcements
- Plan content sequences

### 4. **Audience Adaptation**
- Adjust tone for different audiences
- Vary complexity by platform
- Include relevant examples/references
- Optimize for engagement

---

## 🔌 Service Connections

### Required Edge Functions to Call:

1. **mcp-content** - Core content generation
2. **mcp-visual** - Images and graphics
3. **gamma-presentation** - Slide decks
4. **niv-orchestrator-robust** - Strategic framework
5. **niv-memory-vault** - Historical context
6. **opportunity-engine** - Active opportunities
7. **firecrawl-search** - Real-time information
8. **intelligence-pipeline** - Market insights

### New Edge Functions Needed:

1. **content-analyzer** - Analyze existing content
2. **brand-voice-engine** - Ensure consistency
3. **content-scheduler** - Plan distribution
4. **performance-tracker** - Track content success

---

## 📊 Implementation Phases

### Phase 1: Core Orchestration (Week 1-2)
- Intent analysis
- Basic multi-content generation
- Simple context gathering
- Connection to existing services

### Phase 2: Intelligence Layer (Week 3-4)
- Memory Vault integration
- Learning from past content
- Brand voice consistency
- Strategic alignment

### Phase 3: Advanced Features (Week 5-6)
- Multi-step workflows
- Performance tracking
- Distribution planning
- A/B testing suggestions

---

## 🎯 Success Metrics

1. **Quality Improvement**
   - Content requires fewer revisions
   - Better alignment with brand voice
   - Higher engagement rates

2. **Efficiency Gains**
   - Reduce time to create content suite by 70%
   - Generate multiple formats from single request
   - Automatic context inclusion

3. **Strategic Alignment**
   - All content supports business objectives
   - Consistent messaging across channels
   - Proactive content suggestions

---

## 💡 Key Differentiators

### Current Frontend Orchestrator:
- Simple if/else routing
- No context awareness
- Single content generation
- Manual everything

### New Edge Function Orchestrator:
- AI-powered intent understanding
- Automatic context aggregation
- Multi-content workflows
- Intelligent automation

---

## 🚀 Example API Call

```javascript
// Frontend would simply call:
const response = await fetch('/functions/v1/niv-content-orchestrator', {
  method: 'POST',
  body: JSON.stringify({
    prompt: "We just hit 1M users",
    organization_id: "tesla",
    mode: "comprehensive" // or "quick", "strategic"
  })
})

// Returns:
{
  contentSuite: {
    pressRelease: { ... },
    socialPosts: {
      twitter: [...],
      linkedin: [...]
    },
    blogPost: { ... },
    internalMemo: { ... },
    executiveTalkingPoints: { ... }
  },
  strategy: {
    messaging: "Focus on community growth and platform reliability",
    timing: "Release Tuesday 9am EST for maximum reach",
    distribution: ["PR wire", "Social media", "Email list"]
  },
  context: {
    relatedContent: [...],
    competitorActivity: [...],
    marketTrends: [...]
  }
}
```

---

## 🔐 Security & Performance

1. **Caching Strategy**
   - Cache organization preferences
   - Cache recent context queries
   - Reuse generated frameworks

2. **Rate Limiting**
   - Prevent abuse
   - Queue large requests
   - Progressive generation

3. **Access Control**
   - Organization-level permissions
   - Content approval workflows
   - Audit trails

---

## 📝 Next Steps

1. **Architecture Review** - Validate approach with requirements
2. **API Design** - Define all endpoints and data structures
3. **Service Mapping** - Ensure all required services exist
4. **Prototype** - Build MVP with core features
5. **Testing** - Validate with real use cases
6. **Deployment** - Gradual rollout with monitoring

---

## 🤔 Questions to Answer

1. Should this replace or supplement current frontend orchestrator?
2. How much autonomy should it have in decision making?
3. Should it be able to modify/improve user requests?
4. How do we handle partial failures in multi-step workflows?
5. What's the approval process for generated content suites?

---

*This orchestrator would transform content creation from a manual, piecemeal process to an intelligent, comprehensive content generation system that understands context, maintains consistency, and delivers strategic value.*