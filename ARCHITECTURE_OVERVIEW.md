# SignalDesk V3 Architecture Overview
## NIV-Centric Strategic Orchestration Platform

---

## 🎯 Core Architecture Philosophy

### The Problem We're Solving
Traditional PR platforms force users to manually connect research, strategy, and execution. We're building an intelligent system where NIV acts as the strategic brain, automatically orchestrating from research to execution.

### Our Solution: Three-Layer Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    LAYER 1: INTELLIGENCE                  │
│                                                            │
│  NIV CHATBOT                                               │
│  ┌──────────────────────────────────────────────────┐     │
│  │ • Research: Gathers real-time intelligence        │     │
│  │ • Analysis: Identifies patterns and opportunities │     │
│  │ • Strategy: Creates comprehensive frameworks      │     │
│  │ • Orchestration: Prepares workflows for execution│     │
│  └──────────────────────────────────────────────────┘     │
│                           ↓                                │
└──────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────┐
│                    LAYER 2: PERSISTENCE                   │
│                                                            │
│  MEMORY VAULT                                              │
│  ┌──────────────────────────────────────────────────┐     │
│  │ • Stores: All strategies, research, campaigns     │     │
│  │ • Learns: Patterns from successful strategies     │     │
│  │ • Retrieves: Historical context for decisions    │     │
│  │ • Versions: Tracks strategy evolution            │     │
│  └──────────────────────────────────────────────────┘     │
│                           ↓                                │
└──────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────┐
│                    LAYER 3: EXECUTION                     │
│                                                            │
│  WORKFLOW COMPONENTS                                       │
│  ┌────────────┐  ┌────────────┐  ┌──────────────┐        │
│  │  Campaign  │  │  Content   │  │  Strategic   │        │
│  │Intelligence│  │ Generator  │  │  Planning    │        │
│  │            │  │            │  │              │        │
│  │ • Detailed │  │ • Press    │  │ • Timelines  │        │
│  │   briefs   │  │   releases │  │ • Milestones │        │
│  │ • Audience │  │ • Social   │  │ • Tasks      │        │
│  │   analysis │  │   posts    │  │ • Resources  │        │
│  │ • Channels │  │ • Emails   │  │ • Budgets    │        │
│  └────────────┘  └────────────┘  └──────────────┘        │
└──────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Architecture

### 1. User Request Flow
```
User Query → NIV Research → Gap Detection → Self-Query →
Strategy Generation → Memory Vault Save → Workflow Preparation
```

### 2. Strategy Execution Flow
```
Saved Strategy → User Selects Workflow → Component Receives Strategy →
Component Generates Output → Save to Memory Vault → User Reviews/Exports
```

### 3. Learning Flow
```
Completed Workflows → Pattern Analysis → Memory Vault Storage →
NIV Learns Patterns → Improved Future Strategies
```

---

## 🧩 Component Responsibilities

### NIV Chatbot (Strategic Brain)
**Purpose:** Research, analysis, and strategy generation

**Responsibilities:**
- Conduct real-time research using `niv-fireplexity`
- Identify information gaps and self-query
- Generate comprehensive strategic frameworks
- Prepare workflow configurations
- Save strategies to Memory Vault

**Does NOT:**
- Execute campaigns
- Generate content
- Create detailed project plans
- Post to platforms

### Memory Vault (Knowledge Persistence)
**Purpose:** Central storage and learning system

**Responsibilities:**
- Store all strategies, campaigns, content
- Enable search and retrieval
- Track version history
- Identify successful patterns
- Provide historical context

**Does NOT:**
- Generate new content
- Execute strategies
- Make strategic decisions

### Workflow Components (Specialized Execution)
**Purpose:** Convert strategies into actionable outputs

#### Campaign Intelligence
- Receives NIV strategy
- Creates detailed campaign briefs
- Identifies target audiences
- Selects optimal channels
- Defines success metrics

#### Content Generator
- Receives NIV strategy
- Creates press releases
- Generates social media posts
- Writes email templates
- Produces marketing copy

#### Strategic Planning
- Receives NIV strategy
- Creates project timelines
- Defines milestones
- Assigns resources
- Estimates budgets

---

## 🔌 Integration Points

### 1. NIV → Memory Vault
```typescript
// When NIV generates a strategy
const strategy = createStrategyFromResponse(...)
const strategyId = saveToMemoryVault(strategy)
```

### 2. NIV → Workflow Components
```typescript
// Via postMessage
window.postMessage({
  type: 'execute-workflow',
  workflow: 'campaignIntelligence',
  strategy: strategy
}, '*')
```

### 3. Components → Memory Vault
```typescript
// When component generates output
const campaign = generateCampaign(strategy)
saveToMemoryVault({
  type: 'campaign',
  parentStrategy: strategy.id,
  content: campaign
})
```

---

## 🚀 Implementation Phases

### Phase 1: Foundation ✅ COMPLETE
- Research/strategy separation in NIV
- Basic strategy structure
- LocalStorage persistence
- UI with workflow buttons

### Phase 2: Memory Vault 🚧 CURRENT
- Database schema
- CRUD operations
- Search functionality
- Version tracking

### Phase 3: Workflow Components
- Stub implementations
- Message listeners
- Basic output generation
- Memory Vault integration

### Phase 4: Orchestration
- Workflow engine
- Status tracking
- Progress monitoring
- Error handling

### Phase 5: Intelligence
- Gap detection
- Self-querying
- Context enrichment
- Pattern learning

### Phase 6: Polish
- End-to-end testing
- Performance optimization
- UI/UX refinement
- Documentation

---

## 🔑 Key Design Decisions

### 1. Why NIV Doesn't Execute
NIV focuses on strategy, not execution. This separation allows:
- Clear responsibilities
- Easier testing and debugging
- Modular component replacement
- Specialized optimization

### 2. Why Memory Vault is Central
All knowledge flows through Memory Vault:
- Single source of truth
- Historical context preservation
- Pattern recognition
- Version control

### 3. Why Message Passing
Using postMessage for component communication:
- Loose coupling
- Easy to add new components
- Clear data contracts
- Debugging transparency

### 4. Why Incremental Implementation
Building in phases allows:
- Working features at each step
- User feedback incorporation
- Risk mitigation
- Continuous improvement

---

## 📊 Success Metrics

### Technical Metrics
- Strategy generation: <30 seconds
- Memory Vault operations: <1 second
- Workflow execution: <60 seconds
- System uptime: 99.9%

### Quality Metrics
- Strategy completeness: >90%
- Research accuracy: >85%
- Workflow success rate: >80%
- User satisfaction: >4.5/5

### Business Metrics
- Time to campaign: 10x faster
- Strategy reuse: >50%
- Cost per campaign: 75% reduction
- User retention: >80%

---

## 🔮 Future Enhancements

### Near Term (3-6 months)
- AI-powered pattern recognition
- Automated workflow suggestions
- Real-time collaboration
- Advanced analytics

### Long Term (6-12 months)
- Multi-organization support
- Plugin architecture
- API for third-party tools
- Mobile applications

---

## 📚 Technical Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion
- Zustand (State Management)

### Backend
- Supabase (Database & Auth)
- Edge Functions (Deno)
- PostgreSQL
- Vector Embeddings

### AI/ML
- Claude (via Anthropic API)
- OpenAI GPT-4
- Custom embedding models

### Infrastructure
- Vercel (Frontend hosting)
- Supabase Cloud (Backend)
- GitHub Actions (CI/CD)

---

## 🎯 End Goal

Create a platform where users can go from "What should we do about X?" to a complete, executable PR strategy with all supporting materials in under 3 minutes, with each interaction making the system smarter for next time.