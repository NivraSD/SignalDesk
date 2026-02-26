# NIV Strategic Framework Orchestration Roadmap
## Making Strategic Frameworks Actionable & Orchestratable

**Goal:** Transform NIV's strategic framework from a chat message into a structured, saveable format that orchestrates downstream execution.

---

## 🎯 Core Requirements

1. **Strategic Framework as Structured Data** - Not just text, but actionable JSON
2. **Memory Vault Integration** - Auto-save frameworks with folder structure
3. **Downstream Handoff** - Pass framework to execution components
4. **Orchestration Triggers** - Button/interface to launch execution

---

## 📋 Strategic Framework Structure (Inspired by MCP Executive Synthesis)

```typescript
interface NivStrategicFramework {
  id: string
  sessionId: string
  organizationId: string
  created_at: Date

  // Core Strategy (from NIV's research & analysis)
  strategy: {
    executive_summary: string  // 2-3 paragraph overview
    objective: string          // Primary goal
    narrative: string          // Core story/positioning
    rationale: string          // Why this approach
    urgency: 'immediate' | 'high' | 'medium' | 'low'
  }

  // Tactical Breakdown (for downstream components)
  tactics: {
    campaign_elements: {
      media_outreach: string[]      // For PR component
      content_creation: string[]    // For content generator
      stakeholder_engagement: string[] // For comms planning
    }

    immediate_actions: string[]     // Next 24-48 hours
    week_one_priorities: string[]   // This week
    strategic_plays: string[]       // Longer-term
  }

  // Intelligence Context (from research)
  intelligence: {
    key_findings: string[]
    competitor_moves: string[]
    market_opportunities: string[]
    risk_factors: string[]
    supporting_data: {
      articles: any[]
      quotes: any[]
      metrics: any[]
    }
  }

  // Full Discovery Profile (critical for context)
  discovery: {
    organizationName: string
    industry: string
    competitors: string[]
    keywords: string[]
    stakeholders: {
      executives: string[]
      investors: string[]
      regulators: string[]
    }
    market_position: string
    recent_events: any[]
    monitoring_priorities: string[]
  }

  // Complete Conversation History (for understanding evolution)
  conversationContext: {
    originalQuery: string                    // What user originally asked
    conversationHistory: Array<{
      role: 'user' | 'assistant'
      content: string
      timestamp: Date
    }>
    researchSteps: Array<{                  // How we got here
      query: string
      findings: string[]
      sources: number
    }>
    userPreferences: {                      // What user wants/doesn't want
      wants: string[]
      doesNotWant: string[]
      constraints: string[]
      examples: string[]
    }
  }

  // Orchestration Instructions
  orchestration: {
    components_to_activate: string[]  // ['media-list', 'content-gen', 'timeline']
    workflow_type: string             // 'crisis' | 'launch' | 'thought-leadership'
    priority: 'urgent' | 'high' | 'normal'
    dependencies: string[]
  }
}
```

---

## 🛠 Implementation Plan

### **Step 1: Enhance NIV to Generate Structured Frameworks**

**Location:** `/supabase/functions/niv-orchestrator-robust/index.ts`

**Changes:**
1. When `shouldGenerateFramework = true`, generate structured JSON (not just formatted text)
2. Include all research context in the framework
3. Return framework as both:
   - Formatted message for chat display
   - Structured data for saving/orchestration

```typescript
// In NIV response when framework generated
return {
  success: true,
  type: 'strategic-framework',
  message: formattedMessage,        // For display in chat
  framework: structuredFramework,   // For saving/orchestration
  readyForHandoff: true
}
```

### **Step 2: Auto-Save Framework to Memory Vault**

**Location:** `/src/components/niv/NivCanvasComponent.tsx`

**Flow:**
1. Detect when response type is 'strategic-framework'
2. Auto-save to Memory Vault using existing `saveStrategy` function
3. Create folder structure in Memory Vault:
   ```
   /frameworks/
     /[organization]/
       /[date]-[framework-id]/
         - framework.json          // Complete strategic framework
         - discovery-profile.json   // Full org context from MCP Discovery
         - conversation-history.json // Complete chat history
         - research-data.json       // All articles, findings, sources
         - orchestration-plan.json  // Execution instructions
   ```

**Why This Context Matters:**
- **Discovery Profile:** Downstream components need to know who the client is, their competitors, industry position
- **Conversation History:** Shows how the strategy evolved, what was rejected, what was refined
- **Research Data:** Raw intelligence that supports strategic decisions
- **User Preferences:** Critical for content tone, messaging boundaries, what to avoid

### **Step 3: Add Orchestration UI**

**Location:** `/src/components/niv/NivCanvasComponent.tsx`

**UI Elements:**
```tsx
// When framework is generated, show:
<div className="framework-actions">
  <button onClick={saveToMemoryVault}>💾 Save Framework</button>
  <button onClick={launchOrchestration}>🚀 Execute Campaign</button>
  <button onClick={viewComponents}>📋 View Execution Plan</button>
</div>
```

### **Step 4: Memory Vault as Orchestrator**

**New Edge Function:** `/supabase/functions/memory-vault-orchestrator/index.ts`

**Responsibilities:**
1. Receive framework from NIV
2. Create execution plan
3. Dispatch to downstream components
4. Track execution status

```typescript
async function orchestrateFramework(framework: NivStrategicFramework) {
  // 1. Parse framework and identify required components
  const components = framework.orchestration.components_to_activate

  // 2. Create execution plan
  const executionPlan = {
    frameworkId: framework.id,
    steps: components.map(comp => ({
      component: comp,
      status: 'pending',
      input: extractComponentInput(framework, comp)
    }))
  }

  // 3. Dispatch to components via postMessage or API
  for (const step of executionPlan.steps) {
    await dispatchToComponent(step.component, step.input)
  }

  return executionPlan
}
```

### **Step 5: Downstream Component Integration**

**Components to Update:**
- Campaign Intelligence
- Content Generator
- Strategic Planning
- Media List Builder

**Each component needs:**
1. Listener for framework handoff
2. Parser for their specific section
3. Execution logic
4. Status reporting back to Memory Vault

---

## 📅 Implementation Timeline

### **Week 1: Framework Structure & Generation**
- [ ] Update NIV to generate structured frameworks
- [ ] Add framework type definitions
- [ ] Test framework generation with real queries

### **Week 2: Memory Vault Integration**
- [ ] Auto-save frameworks to Memory Vault
- [ ] Create folder structure
- [ ] Build orchestration edge function

### **Week 3: UI & Orchestration**
- [ ] Add orchestration buttons to NIV chat
- [ ] Create execution plan viewer
- [ ] Implement component dispatch

### **Week 4: Downstream Integration**
- [ ] Update each component to receive frameworks
- [ ] Test end-to-end orchestration
- [ ] Polish and error handling

---

## 🎯 Success Criteria

1. **Framework Generation:** NIV generates structured, actionable frameworks
2. **Persistence:** All frameworks auto-save to Memory Vault
3. **Orchestration:** One-click launch of downstream execution
4. **Tracking:** Full visibility into execution status
5. **Results:** Downstream components produce deliverables from framework

---

## 💡 Key Design Decisions

1. **Framework = Blueprint:** The framework is the single source of truth for campaign execution
2. **Memory Vault = Orchestrator:** Memory Vault manages execution, not NIV
3. **Components = Executors:** Each component is responsible for its specific deliverable
4. **Status = Trackable:** Every step is tracked and reportable

---

## 🚀 Next Immediate Steps

1. **Modify NIV framework generation** to output structured JSON
2. **Update frontend** to detect and save frameworks
3. **Create simple orchestration UI** with execute button
4. **Test with one downstream component** (start with Media List)

This approach keeps the framework display clean in chat while enabling full orchestration capabilities behind the scenes.