# Niv-First Architecture Specification

## SignalDesk Platform Evolution

---

## Executive Summary

This document outlines the architectural transformation of SignalDesk from a feature-centric platform to a **Niv-first orchestration system**. The new architecture positions Niv as the primary interface for strategic PR work, with features appearing as inline strategic overviews during conversation, while maintaining dedicated workspaces for detailed execution.

---

## 1. Niv as Primary Interface with Inline Feature Integration

### Core Concept

Niv operates as the strategic command center, with features manifesting as **strategic overviews** within the conversation flow rather than full implementations. This maintains momentum while providing strategic context.

### 1.1 Inline Feature Manifestation

When Niv invokes a feature during conversation, it appears as a **strategic card** rather than the full feature:

```javascript
// Example: User asks about media outreach
User: "Who should we contact about the product launch?"

// Niv creates strategic overview card, NOT full media list
NivResponse: {
  type: "strategic-overview",
  feature: "media-intelligence",
  display: {
    title: "Media Outreach Strategy",
    summary: {
      total_journalists: 47,
      tier_1_targets: 12,
      optimal_timing: "Tuesday-Thursday, 9-11am",
      key_angles: ["Innovation", "Market disruption", "Customer value"]
    },
    insights: [
      "Jennifer Chen at TechCrunch covered competitors last week",
      "Bloomberg seeking enterprise tech stories this quarter",
      "Avoid Fridays - 70% lower response rate"
    ],
    recommended_action: "Focus on Tier 1 with exclusive angles",
    workspace_link: "Open full Media Workspace →"
  }
}
```

### 1.2 Strategic Overview Principles

Each inline feature card follows these principles:

1. **High-Level Intelligence**: Shows what matters strategically, not every detail
2. **Actionable Insights**: 3-5 key insights that drive decisions
3. **Clear Next Steps**: What to do now vs. what can wait
4. **Workspace Gateway**: Always includes path to full feature workspace
5. **Context Preservation**: Maintains conversation flow without disruption

### 1.3 Feature Card Types

#### Content Generation Strategic Card

```
📝 Content Strategy Overview
━━━━━━━━━━━━━━━━━━━━━━━━━
Recommended: Executive Blog Post
Angle: Thought leadership on industry transformation
Length: 800-1000 words
Key Messages: 3 identified from conversation
SEO Opportunity: "digital transformation 2025" (high volume, low competition)

[Generate with Niv] [Open Content Workspace →]
```

#### Campaign Planning Strategic Card

```
🎯 Campaign Architecture
━━━━━━━━━━━━━━━━━━━━━━━━━
Timeline: 6 weeks optimal (compress to 4 weeks possible with trade-offs)
Resources Needed: $75K budget, 3 team members
Critical Path: Content creation → Media outreach → Launch event
Risk Factors: Competitor announcement likely in Week 3
Success Probability: 78% based on similar campaigns

[Build Detailed Plan] [Open Campaign Workspace →]
```

#### Opportunity Analysis Strategic Card

```
⚡ Opportunity Assessment
━━━━━━━━━━━━━━━━━━━━━━━━━
Type: Competitor Weakness
Window: 24-48 hours
Impact Score: 85/100
Required Resources: 2 hours effort, existing content
Cascade Effects: Media attention → Customer inquiries → Sales momentum
Risk Level: Low (defensive move)

[Execute Opportunity] [Open Opportunity Engine →]
```

### 1.4 Inline Interaction Patterns

Users can interact with strategic cards without leaving Niv:

```javascript
// Quick actions that modify strategy
const InlineActions = {
  adjust: "Niv, make this more aggressive",
  expand: "Show me Tier 2 journalists as well",
  pivot: "What if we focused on security instead?",
  execute: "Proceed with this strategy",
};

// Niv updates the strategic card in place
// Full workspace only needed for detailed execution
```

---

## 2. Active Workflows as Living Artifacts

### Core Concept

The Active Workflows panel transforms from a simple task list into a **living inventory** of all artifacts Niv is orchestrating across the platform.

### 2.1 Workflow Architecture

```javascript
const ActiveWorkflow = {
  id: "workflow-2024-001",
  name: "Q2 Product Launch",
  status: "executing",
  progress: 65,

  // Living artifacts created/managed by Niv
  artifacts: [
    {
      type: "media-list",
      name: "Tech Journalist Outreach",
      status: "ready",
      items_count: 47,
      last_modified: "Niv, 2 mins ago",
      workspace: "media-intelligence",
    },
    {
      type: "content-calendar",
      name: "30-Day Content Plan",
      status: "in-progress",
      items_count: 24,
      completion: 40,
      workspace: "content-generator",
    },
    {
      type: "campaign-timeline",
      name: "Launch Roadmap",
      status: "on-track",
      milestones: 8,
      next_milestone: "2 days",
      workspace: "campaign-planner",
    },
  ],

  // Niv's orchestration metadata
  orchestration: {
    created_by: "Niv",
    strategy: "Aggressive market capture",
    next_actions: [
      "Review media list",
      "Approve blog post",
      "Schedule briefing",
    ],
    risk_alerts: ["Competitor event on Week 3"],
    optimization_suggestions: [
      "Accelerate content by 3 days for better timing",
    ],
  },
};
```

### 2.2 Workflow Lifecycle

#### Creation Phase

- User describes objective to Niv
- Niv creates workflow container
- Niv generates initial artifacts
- All artifacts appear in Active Workflows

#### Execution Phase

- Artifacts update in real-time
- Status changes reflect progress
- Niv adds new artifacts as needed
- Users can click any artifact to open workspace

#### Completion Phase

- Workflow moves to Memory Vault
- Becomes searchable knowledge
- Patterns extracted for future use
- Success metrics captured

### 2.3 Visual Representation

```
Active Workflows
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┌─ 🚨 Crisis Response ──────── 85% ─┐
│ ├─ 📰 Media List (47 contacts)    │
│ ├─ 📝 Statements (3 ready)        │
│ └─ 📊 Monitoring (active)         │
│ ⚡ Niv: "Response window closing"  │
└────────────────────────────────────┘

┌─ 🚀 Product Launch ──────── 45% ──┐
│ ├─ 📋 Campaign Plan (6 weeks)     │
│ ├─ 📝 Content (12/24 complete)    │
│ ├─ 📰 Media Targets (pending)     │
│ └─ 📊 Success Metrics (defined)   │
│ 💡 Niv: "On track for March 1"    │
└────────────────────────────────────┘
```

### 2.4 Workflow Intelligence

Each workflow carries intelligence:

```javascript
const WorkflowIntelligence = {
  // Niv learns from each workflow
  patterns: {
    typical_duration: "6 weeks",
    common_bottlenecks: ["content approval", "executive availability"],
    success_factors: ["early media engagement", "clear messaging"],
  },

  // Applied to current workflow
  predictions: {
    completion_probability: 0.78,
    risk_factors: ["competitor activity", "resource constraints"],
    optimization_opportunities: [
      "parallel content creation",
      "pre-brief executives",
    ],
  },

  // Proactive guidance
  alerts: {
    timing: "Media embargo lifts in 48 hours",
    conflicts: "CEO traveling during launch week",
    opportunities: "TechCrunch requesting exclusive",
  },
};
```

---

## 3. New Workspace Architecture

### Core Concept

Workspaces are **execution environments** where users perform detailed work on artifacts created or managed by Niv. Each workspace follows a consistent pattern: primary work area with contextual Niv assistance.

### 3.1 Workspace Design Pattern

```javascript
const WorkspacePattern = {
  layout: {
    primary: "70% - Interactive work area",
    assistant: "30% - Niv contextual panel",
  },

  components: {
    header: {
      back_navigation: "Return to Niv conversation",
      context_breadcrumb: "Part of: [Workflow Name]",
      status: "Last modified by Niv",
      actions: ["Share", "Export", "Archive"],
    },

    mainArea: {
      purpose: "Full feature functionality",
      interaction: "Direct manipulation",
      updates: "Real-time sync with Niv",
    },

    nivPanel: {
      mode: "Contextual assistance",
      capabilities: "Feature-specific intelligence",
      interaction: "Natural language requests",
    },
  },
};
```

### 3.2 Workspace Types

#### Media Intelligence Workspace

**Purpose**: Manage journalist relationships and media outreach

**Main Area**:

- Journalist database with filters
- Relationship scoring
- Outreach history
- Response tracking

**Niv Panel**:

- "Jennifer Chen just tweeted about your industry"
- "Add 3 Bloomberg journalists for financial angle"
- "Optimal send time is Tuesday 10am"
- "This journalist prefers exclusives"

#### Content Creation Workspace

**Purpose**: Create and edit all PR content

**Main Area**:

- Rich text editor
- Version control
- Template library
- SEO optimization tools

**Niv Panel**:

- "This headline increased CTR by 40% last time"
- "Add data point about market growth"
- "Tone is too promotional for WSJ"
- "Generate alternative opening paragraph"

#### Campaign Planning Workspace

**Purpose**: Design and manage campaign timelines

**Main Area**:

- Gantt chart
- Resource allocation
- Budget tracking
- Milestone management

**Niv Panel**:

- "Critical path at risk due to content delays"
- "Similar campaign took 20% longer"
- "Move launch to avoid competitor event"
- "Add crisis contingency planning"

#### Analytics Workspace

**Purpose**: Track and analyze PR performance

**Main Area**:

- Performance dashboards
- Sentiment analysis
- Competitive benchmarking
- ROI calculations

**Niv Panel**:

- "Unusual spike in mentions yesterday"
- "Sentiment declining in European markets"
- "You're outperforming industry average by 30%"
- "Predict next month's coverage"

### 3.3 Workspace Intelligence Features

#### Contextual Awareness

```javascript
// Niv knows why user is in workspace
const Context = {
  workflow: "Product Launch",
  stage: "Media Outreach",
  deadline: "3 days",
  priority: "Tier 1 journalists",
};

// Assistance is filtered through this context
Niv: "Focus on these 5 journalists first given your timeline";
```

#### Proactive Suggestions

```javascript
// Niv monitors work and suggests improvements
const Suggestions = {
  timing: "Send now - journalist online",
  enhancement: "Add customer quote here",
  warning: "This conflicts with embargo",
  opportunity: "Similar content went viral",
};
```

#### Seamless Handoffs

```javascript
// Moving between Niv and workspaces
const Handoff = {
  fromNiv: {
    action: "Open Media Workspace",
    context: "All conversation context transferred",
    focus: "Highlighted relevant items",
  },

  toNiv: {
    action: "Return to conversation",
    updates: "Changes reflected in chat",
    continuation: "Niv aware of all modifications",
  },
};
```

### 3.4 Workspace Access Patterns

#### Pattern 1: Niv-Initiated

1. User conversing with Niv
2. Niv creates/modifies artifact
3. User clicks to open workspace
4. Deep work in focused environment
5. Return to Niv with updates

#### Pattern 2: Direct Access

1. User opens workspace directly
2. Begins work manually
3. Asks Niv for assistance
4. Niv provides contextual help
5. Continues in workspace

#### Pattern 3: Parallel Work

1. Team member in workspace
2. Another with Niv conversation
3. Both see real-time updates
4. Niv coordinates between users
5. Unified view of progress

---

## 4. Integration Architecture

### 4.1 Data Flow

```javascript
const DataArchitecture = {
  // Single source of truth
  database: "Shared PostgreSQL",

  // Three views of same data
  views: {
    niv: "Strategic/conversational view",
    workspace: "Detailed/execution view",
    workflow: "Progress/inventory view",
  },

  // Real-time synchronization
  sync: {
    method: "WebSocket",
    frequency: "Real-time",
    conflicts: "Last-write-wins with versioning",
  },
};
```

### 4.2 State Management

```javascript
const StateManagement = {
  // Global state
  platform: {
    user: "Current user context",
    organization: "Company settings",
    workflows: "All active workflows",
  },

  // Niv state
  conversation: {
    messages: "Chat history",
    context: "Current focus",
    artifacts: "Created items",
  },

  // Workspace state
  workspace: {
    feature: "Active feature",
    data: "Feature-specific data",
    modifications: "Unsaved changes",
  },
};
```

### 4.3 Navigation Flow

```
     ┌──────────────┐
     │     Niv      │◄──────┐
     │ (Strategic)  │       │
     └──────┬───────┘       │
            │               │
     Creates/Shows          │ Returns with
      Strategic Card        │  Context
            │               │
            ▼               │
     ┌──────────────┐       │
     │   Strategic  │       │
     │   Overview   │       │
     │    (Card)    │       │
     └──────┬───────┘       │
            │               │
      User Clicks           │
     "Open Workspace"       │
            │               │
            ▼               │
     ┌──────────────┐       │
     │  Workspace   │───────┘
     │ (Execution)  │
     └──────────────┘
```

---

## 5. Implementation Phases

### Phase 1: Foundation (Weeks 1-2)

- Implement strategic card system
- Create workspace navigation
- Establish data synchronization

### Phase 2: Intelligence (Weeks 3-4)

- Add Niv contextual assistance
- Implement workflow tracking
- Create pattern recognition

### Phase 3: Polish (Weeks 5-6)

- Optimize transitions
- Add proactive suggestions
- Refine user experience

---

## 6. Success Metrics

### User Efficiency

- Time from idea to execution: -50%
- Context switches: -70%
- Task completion rate: +40%

### User Satisfaction

- Niv conversation engagement: Track usage patterns
- Workspace productivity: Measure task completion
- Feature adoption: Monitor which patterns users prefer

### Business Impact

- Campaign launch time: -30%
- PR opportunity capture: +60%
- Strategic alignment: Measurable improvement

---

## Conclusion

This architecture positions Niv as the strategic orchestrator while maintaining the detailed execution capabilities users need. By showing strategic overviews inline and providing dedicated workspaces for detailed work, we balance the power of conversational AI with the control of traditional interfaces.

The result is a platform that thinks strategically, executes precisely, and adapts to how each user prefers to work.

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SignalDesk - Niv-First Architecture</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0a0f;
            color: #e0e0e0;
            height: 100vh;
            overflow: hidden;
        }

        .app-container {
            display: flex;
            height: 100vh;
            position: relative;
        }

        /* Niv Command Center - Primary Interface */
        .niv-center {
            flex: 1;
            display: flex;
            flex-direction: column;
            background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1e 100%);
            position: relative;
            overflow: hidden;
        }

        /* Niv Header with Mode Switcher */
        .niv-header {
            padding: 20px 30px;
            background: rgba(15, 15, 30, 0.8);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(139, 92, 246, 0.2);
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: relative;
            z-index: 10;
        }

        .niv-title {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .niv-avatar {
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, #8b5cf6, #6366f1);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            box-shadow: 0 4px 20px rgba(139, 92, 246, 0.3);
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }

        .niv-status {
            display: flex;
            flex-direction: column;
        }

        .niv-name {
            font-size: 20px;
            font-weight: 600;
            color: #fff;
        }

        .niv-mode {
            font-size: 12px;
            color: #8b5cf6;
            display: flex;
            align-items: center;
            gap: 5px;
            margin-top: 2px;
        }

        .mode-indicator {
            width: 8px;
            height: 8px;
            background: #10b981;
            border-radius: 50%;
            animation: blink 2s infinite;
        }

        @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        /* Mode Switcher */
        .mode-switcher {
            display: flex;
            gap: 10px;
            background: rgba(30, 30, 45, 0.6);
            padding: 6px;
            border-radius: 12px;
        }

        .mode-btn {
            padding: 8px 16px;
            background: transparent;
            color: #9ca3af;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 13px;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .mode-btn.active {
            background: rgba(139, 92, 246, 0.2);
            color: #8b5cf6;
        }

        .mode-btn:hover {
            background: rgba(139, 92, 246, 0.1);
        }

        /* Workflow Progress Bar */
        .workflow-progress {
            height: 3px;
            background: rgba(30, 30, 45, 0.5);
            position: relative;
            overflow: hidden;
        }

        .progress-bar {
            height: 100%;
            background: linear-gradient(90deg, #8b5cf6, #6366f1);
            width: 0%;
            animation: progress 3s ease-out forwards;
        }

        @keyframes progress {
            to { width: 65%; }
        }

        /* Main Conversation Area */
        .niv-conversation {
            flex: 1;
            padding: 30px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        /* Dynamic Work Cards */
        .work-card {
            background: rgba(30, 30, 45, 0.4);
            border: 1px solid rgba(139, 92, 246, 0.2);
            border-radius: 16px;
            padding: 20px;
            animation: slideIn 0.5s ease-out;
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .work-card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }

        .work-type {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            color: #8b5cf6;
        }

        .work-status {
            padding: 4px 12px;
            background: rgba(16, 185, 129, 0.1);
            color: #10b981;
            border-radius: 20px;
            font-size: 12px;
        }

        /* Inline Content Generation */
        .inline-generator {
            background: rgba(99, 102, 241, 0.05);
            border: 1px solid rgba(99, 102, 241, 0.2);
            border-radius: 12px;
            padding: 20px;
            margin-top: 15px;
        }

        .generator-tabs {
            display: flex;
            gap: 15px;
            margin-bottom: 20px;
            border-bottom: 1px solid rgba(99, 102, 241, 0.1);
        }

        .gen-tab {
            padding: 10px 5px;
            background: transparent;
            border: none;
            color: #9ca3af;
            cursor: pointer;
            position: relative;
            transition: color 0.3s;
        }

        .gen-tab.active {
            color: #6366f1;
        }

        .gen-tab.active::after {
            content: '';
            position: absolute;
            bottom: -1px;
            left: 0;
            right: 0;
            height: 2px;
            background: #6366f1;
        }

        .content-area {
            background: rgba(15, 15, 30, 0.5);
            border-radius: 8px;
            padding: 15px;
            min-height: 150px;
            color: #e0e0e0;
            font-size: 14px;
            line-height: 1.6;
        }

        /* Smart Actions */
        .smart-actions {
            display: flex;
            gap: 10px;
            margin-top: 15px;
        }

        .smart-action {
            padding: 10px 20px;
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(99, 102, 241, 0.1));
            border: 1px solid rgba(139, 92, 246, 0.3);
            color: #fff;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s;
            font-size: 14px;
        }

        .smart-action:hover {
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(99, 102, 241, 0.2));
            transform: translateY(-2px);
            box-shadow: 0 4px 20px rgba(139, 92, 246, 0.2);
        }

        /* Niv Input Area */
        .niv-input-area {
            padding: 20px 30px;
            background: rgba(15, 15, 30, 0.8);
            backdrop-filter: blur(10px);
            border-top: 1px solid rgba(139, 92, 246, 0.2);
        }

        .input-wrapper {
            display: flex;
            gap: 15px;
            align-items: center;
        }

        .niv-input {
            flex: 1;
            background: rgba(30, 30, 45, 0.6);
            border: 1px solid rgba(139, 92, 246, 0.2);
            border-radius: 12px;
            padding: 15px 20px;
            color: #fff;
            font-size: 15px;
            transition: all 0.3s;
        }

        .niv-input:focus {
            outline: none;
            border-color: #8b5cf6;
            background: rgba(30, 30, 45, 0.8);
            box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }

        .send-btn {
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, #8b5cf6, #6366f1);
            border: none;
            border-radius: 12px;
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
        }

        .send-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4);
        }

        /* Right Panel - Niv's Workspace */
        .workspace-panel {
            width: 320px;
            background: rgba(15, 15, 25, 0.95);
            border-left: 1px solid rgba(139, 92, 246, 0.1);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .workspace-header {
            padding: 20px;
            border-bottom: 1px solid rgba(139, 92, 246, 0.1);
        }

        .workspace-title {
            font-size: 16px;
            color: #fff;
            margin-bottom: 5px;
        }

        .workspace-subtitle {
            font-size: 12px;
            color: #6b7280;
        }

        /* Active Workflows */
        .active-workflows {
            padding: 20px;
            flex: 1;
            overflow-y: auto;
        }

        .workflow-item {
            background: rgba(30, 30, 45, 0.4);
            border: 1px solid rgba(139, 92, 246, 0.1);
            border-radius: 12px;
            padding: 15px;
            margin-bottom: 15px;
            cursor: pointer;
            transition: all 0.3s;
        }

        .workflow-item:hover {
            background: rgba(30, 30, 45, 0.6);
            border-color: rgba(139, 92, 246, 0.3);
        }

        .workflow-name {
            font-size: 14px;
            color: #fff;
            margin-bottom: 8px;
        }

        .workflow-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .workflow-time {
            font-size: 11px;
            color: #6b7280;
        }

        .workflow-badge {
            padding: 3px 8px;
            background: rgba(139, 92, 246, 0.2);
            color: #8b5cf6;
            border-radius: 10px;
            font-size: 11px;
        }

        /* Quick Access Tools */
        .quick-tools {
            padding: 20px;
            border-top: 1px solid rgba(139, 92, 246, 0.1);
        }

        .tools-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-top: 15px;
        }

        .tool-btn {
            aspect-ratio: 1;
            background: rgba(30, 30, 45, 0.4);
            border: 1px solid rgba(139, 92, 246, 0.1);
            border-radius: 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s;
        }

        .tool-btn:hover {
            background: rgba(139, 92, 246, 0.1);
            border-color: rgba(139, 92, 246, 0.3);
            transform: translateY(-2px);
        }

        .tool-icon {
            font-size: 20px;
            margin-bottom: 5px;
        }

        .tool-label {
            font-size: 10px;
            color: #9ca3af;
        }

        /* Floating Context Menu */
        .context-menu {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(15, 15, 30, 0.98);
            border: 1px solid rgba(139, 92, 246, 0.3);
            border-radius: 16px;
            padding: 20px;
            min-width: 300px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
            display: none;
            animation: fadeIn 0.3s ease-out;
        }

        .context-menu.show {
            display: block;
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translate(-50%, -45%);
            }
            to {
                opacity: 1;
                transform: translate(-50%, -50%);
            }
        }

        /* Message Bubbles */
        .message {
            max-width: 70%;
            animation: messageSlide 0.3s ease-out;
        }

        @keyframes messageSlide {
            from {
                opacity: 0;
                transform: translateX(-20px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        .niv-message {
            align-self: flex-start;
        }

        .user-message {
            align-self: flex-end;
        }

        .message-content {
            padding: 15px 20px;
            border-radius: 16px;
            font-size: 14px;
            line-height: 1.6;
        }

        .niv-message .message-content {
            background: rgba(139, 92, 246, 0.1);
            border: 1px solid rgba(139, 92, 246, 0.2);
            color: #e0e0e0;
        }

        .user-message .message-content {
            background: linear-gradient(135deg, #8b5cf6, #6366f1);
            color: white;
        }

        /* Scrollbar Styling */
        ::-webkit-scrollbar {
            width: 8px;
        }

        ::-webkit-scrollbar-track {
            background: rgba(30, 30, 45, 0.3);
        }

        ::-webkit-scrollbar-thumb {
            background: rgba(139, 92, 246, 0.3);
            border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: rgba(139, 92, 246, 0.5);
        }
    </style>

</head>
<body>
    <div class="app-container">
        <!-- Niv Command Center - Primary Interface -->
        <div class="niv-center">
            <!-- Niv Header -->
            <div class="niv-header">
                <div class="niv-title">
                    <div class="niv-avatar">🧠</div>
                    <div class="niv-status">
                        <div class="niv-name">Niv</div>
                        <div class="niv-mode">
                            <span class="mode-indicator"></span>
                            <span>Orchestration Mode • Crisis Response Active</span>
                        </div>
                    </div>
                </div>
                
                <div class="mode-switcher">
                    <button class="mode-btn">
                        <span>💬</span>
                        <span>Chat</span>
                    </button>
                    <button class="mode-btn">
                        <span>✨</span>
                        <span>Create</span>
                    </button>
                    <button class="mode-btn active">
                        <span>🎯</span>
                        <span>Orchestrate</span>
                    </button>
                    <button class="mode-btn">
                        <span>📊</span>
                        <span>Monitor</span>
                    </button>
                </div>
            </div>

            <!-- Workflow Progress -->
            <div class="workflow-progress">
                <div class="progress-bar"></div>
            </div>

            <!-- Main Conversation Area -->
            <div class="niv-conversation">
                <!-- User Message -->
                <div class="message user-message">
                    <div class="message-content">
                        Our competitor just announced a major data breach. We need to respond strategically without appearing opportunistic.
                    </div>
                </div>

                <!-- Niv Response -->
                <div class="message niv-message">
                    <div class="message-content">
                        I've seen this exact scenario 12 times. We have a 4-6 hour window to position ourselves correctly. Let me orchestrate our response:
                    </div>
                </div>

                <!-- Dynamic Work Card - Analysis -->
                <div class="work-card">
                    <div class="work-card-header">
                        <div class="work-type">
                            <span>🔍</span>
                            <span>Cascade Analysis</span>
                        </div>
                        <div class="work-status">Completed</div>
                    </div>
                    <div style="color: #e0e0e0; font-size: 14px; line-height: 1.6;">
                        <strong>Immediate Effects (Next 24h):</strong><br>
                        • Media will seek industry expert comments<br>
                        • Customers will question data security industry-wide<br>
                        • Regulatory scrutiny will increase<br><br>

                        <strong>Opportunity Window:</strong> Position as thought leader on data security best practices without mentioning competitor directly.
                    </div>
                </div>

                <!-- Dynamic Work Card - Content Generation -->
                <div class="work-card">
                    <div class="work-card-header">
                        <div class="work-type">
                            <span>📝</span>
                            <span>Strategic Content Generation</span>
                        </div>
                        <div class="work-status">In Progress</div>
                    </div>

                    <div class="inline-generator">
                        <div class="generator-tabs">
                            <button class="gen-tab active">Blog Post</button>
                            <button class="gen-tab">Executive Statement</button>
                            <button class="gen-tab">Media Talking Points</button>
                        </div>

                        <div class="content-area">
                            <strong>5 Essential Data Security Practices Every Company Should Implement Today</strong><br><br>

                            In today's digital landscape, data security isn't just an IT concern—it's a fundamental business imperative. Here are the non-negotiable practices we've implemented that every organization should consider...

                            <br><br>
                            <em style="color: #8b5cf6;">[Niv is generating content that positions you as the responsible leader without appearing opportunistic...]</em>
                        </div>

                        <div class="smart-actions">
                            <button class="smart-action">Enhance with Data</button>
                            <button class="smart-action">Add Expert Quotes</button>
                            <button class="smart-action">Optimize for SEO</button>
                        </div>
                    </div>
                </div>

                <!-- Dynamic Work Card - Media Strategy -->
                <div class="work-card">
                    <div class="work-card-header">
                        <div class="work-type">
                            <span>📰</span>
                            <span>Media Outreach Plan</span>
                        </div>
                        <div class="work-status">Ready</div>
                    </div>
                    <div style="color: #e0e0e0; font-size: 14px; line-height: 1.6;">
                        <strong>Tier 1 Targets (Reach out immediately):</strong><br>
                        • Jennifer Chen @ TechCrunch - Covered your security article last month<br>
                        • Michael Torres @ WSJ - Looking for industry perspectives<br>
                        • Sarah Kim @ Wired - Just tweeted about the breach<br><br>

                        <strong>Angle:</strong> Offer your CTO as expert on "Building Resilient Data Infrastructure"
                    </div>

                    <div class="smart-actions">
                        <button class="smart-action">Generate Pitches</button>
                        <button class="smart-action">Send via Platform</button>
                    </div>
                </div>

                <!-- Niv Strategic Guidance -->
                <div class="message niv-message">
                    <div class="message-content">
                        <strong>⚡ Critical Next Steps:</strong><br><br>
                        1. <strong>Next 30 mins:</strong> Approve and publish the blog post<br>
                        2. <strong>Next hour:</strong> Brief your CTO with talking points<br>
                        3. <strong>Next 2 hours:</strong> Send media pitches to Tier 1 journalists<br><br>

                        I'm monitoring competitor mentions and will alert you if the narrative shifts. Want me to draft internal comms for your team as well?
                    </div>
                </div>
            </div>

            <!-- Niv Input Area -->
            <div class="niv-input-area">
                <div class="input-wrapper">
                    <input type="text" class="niv-input" placeholder="Tell Niv what you need... (try: 'also prepare for investor questions')">
                    <button class="send-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>

        <!-- Right Panel - Niv's Workspace -->
        <div class="workspace-panel">
            <div class="workspace-header">
                <div class="workspace-title">Active Workflows</div>
                <div class="workspace-subtitle">Niv is managing 3 parallel workstreams</div>
            </div>

            <div class="active-workflows">
                <div class="workflow-item">
                    <div class="workflow-name">🚨 Crisis Response: Data Security</div>
                    <div class="workflow-meta">
                        <span class="workflow-time">Started 5 mins ago</span>
                        <span class="workflow-badge">65% Complete</span>
                    </div>
                </div>

                <div class="workflow-item">
                    <div class="workflow-name">📊 Q3 Campaign Planning</div>
                    <div class="workflow-meta">
                        <span class="workflow-time">2 hours ago</span>
                        <span class="workflow-badge">Paused</span>
                    </div>
                </div>

                <div class="workflow-item">
                    <div class="workflow-name">🎯 Product Launch Prep</div>
                    <div class="workflow-meta">
                        <span class="workflow-time">Yesterday</span>
                        <span class="workflow-badge">Scheduled</span>
                    </div>
                </div>
            </div>

            <div class="quick-tools">
                <div class="workspace-title" style="font-size: 14px;">Quick Access</div>
                <div class="tools-grid">
                    <div class="tool-btn">
                        <span class="tool-icon">📝</span>
                        <span class="tool-label">Content</span>
                    </div>
                    <div class="tool-btn">
                        <span class="tool-icon">📰</span>
                        <span class="tool-label">Media</span>
                    </div>
                    <div class="tool-btn">
                        <span class="tool-icon">⚡</span>
                        <span class="tool-label">Opportunities</span>
                    </div>
                    <div class="tool-btn">
                        <span class="tool-icon">📊</span>
                        <span class="tool-label">Analytics</span>
                    </div>
                    <div class="tool-btn">
                        <span class="tool-icon">👥</span>
                        <span class="tool-label">Stakeholders</span>
                    </div>
                    <div class="tool-btn">
                        <span class="tool-icon">🧠</span>
                        <span class="tool-label">Memory</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Simulate real-time updates
        setTimeout(() => {
            const progressBar = document.querySelector('.progress-bar');
            progressBar.style.width = '85%';
        }, 3000);

        // Input focus behavior
        const input = document.querySelector('.niv-input');
        input.addEventListener('focus', () => {
            input.placeholder = "Niv is listening...";
        });

        input.addEventListener('blur', () => {
            input.placeholder = "Tell Niv what you need... (try: 'also prepare for investor questions')";
        });

        // Mode switcher interaction
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');

                const modeText = this.querySelector('span:last-child').textContent;
                document.querySelector('.niv-mode span:last-child').textContent =
                    `${modeText} Mode • Ready`;
            });
        });

        // Workflow item interactions
        document.querySelectorAll('.workflow-item').forEach(item => {
            item.addEventListener('click', function() {
                const name = this.querySelector('.workflow-name').textContent;
                const input = document.querySelector('.niv-input');
                input.value = `Switch to workflow: ${name}`;
                input.focus();
            });
        });

        // Smart action interactions
        document.querySelectorAll('.smart-action').forEach(btn => {
            btn.addEventListener('click', function() {
                this.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1))';
                this.style.borderColor = 'rgba(16, 185, 129, 0.5)';
                this.textContent = '✓ ' + this.textContent;
                this.disabled = true;
            });
        });

        // Tool button interactions
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const label = this.querySelector('.tool-label').textContent;
                const input = document.querySelector('.niv-input');
                input.value = `Open ${label} in current workflow`;
                input.focus();
            });
        });
    </script>

</body>
</html>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Media Workspace - SignalDesk</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0a0f;
            color: #e0e0e0;
            height: 100vh;
            overflow: hidden;
        }

        .workspace-container {
            display: flex;
            height: 100vh;
        }

        /* Main Workspace Area */
        .main-workspace {
            flex: 1;
            display: flex;
            flex-direction: column;
            background: #0f0f1e;
        }

        /* Workspace Header */
        .workspace-header {
            padding: 20px 30px;
            background: rgba(15, 15, 30, 0.9);
            border-bottom: 1px solid rgba(139, 92, 246, 0.2);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .workspace-title {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .back-btn {
            padding: 8px 16px;
            background: rgba(30, 30, 45, 0.6);
            border: 1px solid rgba(139, 92, 246, 0.2);
            color: #8b5cf6;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s;
        }

        .back-btn:hover {
            background: rgba(139, 92, 246, 0.1);
        }

        .workspace-name {
            font-size: 20px;
            font-weight: 600;
            color: #fff;
        }

        .workspace-meta {
            font-size: 13px;
            color: #6b7280;
        }

        .workspace-actions {
            display: flex;
            gap: 10px;
        }

        .action-btn {
            padding: 8px 16px;
            background: rgba(30, 30, 45, 0.6);
            border: 1px solid rgba(139, 92, 246, 0.2);
            color: #e0e0e0;
            border-radius: 8px;
            cursor: pointer;
            font-size: 13px;
            transition: all 0.3s;
        }

        .action-btn.primary {
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(99, 102, 241, 0.2));
            color: #fff;
        }

        .action-btn:hover {
            background: rgba(139, 92, 246, 0.2);
            transform: translateY(-1px);
        }

        /* Tabs */
        .workspace-tabs {
            padding: 0 30px;
            background: rgba(15, 15, 30, 0.5);
            border-bottom: 1px solid rgba(139, 92, 246, 0.1);
            display: flex;
            gap: 30px;
        }

        .tab {
            padding: 15px 5px;
            color: #6b7280;
            cursor: pointer;
            position: relative;
            transition: color 0.3s;
            font-size: 14px;
        }

        .tab.active {
            color: #8b5cf6;
        }

        .tab.active::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: #8b5cf6;
        }

        .tab-badge {
            display: inline-block;
            padding: 2px 6px;
            background: rgba(139, 92, 246, 0.2);
            color: #8b5cf6;
            border-radius: 10px;
            font-size: 11px;
            margin-left: 5px;
        }

        /* Content Area */
        .workspace-content {
            flex: 1;
            padding: 30px;
            overflow-y: auto;
        }

        /* Media List Table */
        .media-table {
            background: rgba(30, 30, 45, 0.3);
            border: 1px solid rgba(139, 92, 246, 0.1);
            border-radius: 12px;
            overflow: hidden;
        }

        .table-header {
            display: grid;
            grid-template-columns: 30px 2fr 1.5fr 1fr 1fr 1fr 120px;
            padding: 15px 20px;
            background: rgba(139, 92, 246, 0.05);
            border-bottom: 1px solid rgba(139, 92, 246, 0.1);
            font-size: 12px;
            text-transform: uppercase;
            color: #6b7280;
            font-weight: 600;
        }

        .table-row {
            display: grid;
            grid-template-columns: 30px 2fr 1.5fr 1fr 1fr 1fr 120px;
            padding: 15px 20px;
            border-bottom: 1px solid rgba(139, 92, 246, 0.05);
            align-items: center;
            transition: background 0.2s;
            cursor: pointer;
        }

        .table-row:hover {
            background: rgba(139, 92, 246, 0.03);
        }

        .checkbox {
            width: 18px;
            height: 18px;
            border: 2px solid rgba(139, 92, 246, 0.3);
            border-radius: 4px;
            cursor: pointer;
            position: relative;
        }

        .checkbox.checked {
            background: linear-gradient(135deg, #8b5cf6, #6366f1);
            border-color: #8b5cf6;
        }

        .checkbox.checked::after {
            content: '✓';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 12px;
        }

        .journalist-info {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .journalist-avatar {
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            color: white;
        }

        .journalist-details {
            display: flex;
            flex-direction: column;
        }

        .journalist-name {
            font-size: 14px;
            color: #fff;
            font-weight: 500;
        }

        .journalist-outlet {
            font-size: 12px;
            color: #6b7280;
        }

        .beat-tag {
            padding: 4px 8px;
            background: rgba(99, 102, 241, 0.1);
            color: #6366f1;
            border-radius: 6px;
            font-size: 12px;
        }

        .relationship-score {
            display: flex;
            align-items: center;
            gap: 5px;
        }

        .score-bar {
            width: 60px;
            height: 4px;
            background: rgba(30, 30, 45, 0.5);
            border-radius: 2px;
            overflow: hidden;
        }

        .score-fill {
            height: 100%;
            background: linear-gradient(90deg, #10b981, #6366f1);
            border-radius: 2px;
        }

        .recent-coverage {
            font-size: 12px;
            color: #6b7280;
        }

        .status-badge {
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 12px;
        }

        .status-badge.ready {
            background: rgba(16, 185, 129, 0.1);
            color: #10b981;
        }

        .status-badge.contacted {
            background: rgba(99, 102, 241, 0.1);
            color: #6366f1;
        }

        .row-actions {
            display: flex;
            gap: 5px;
        }

        .row-action-btn {
            padding: 6px 10px;
            background: rgba(30, 30, 45, 0.6);
            border: 1px solid rgba(139, 92, 246, 0.1);
            color: #8b5cf6;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s;
        }

        .row-action-btn:hover {
            background: rgba(139, 92, 246, 0.1);
        }

        /* Niv Assist Panel */
        .niv-panel {
            width: 380px;
            background: rgba(15, 15, 25, 0.95);
            border-left: 1px solid rgba(139, 92, 246, 0.1);
            display: flex;
            flex-direction: column;
        }

        .niv-panel-header {
            padding: 20px;
            border-bottom: 1px solid rgba(139, 92, 246, 0.1);
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .niv-avatar-small {
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, #8b5cf6, #6366f1);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
        }

        .niv-panel-title {
            flex: 1;
        }

        .niv-panel-name {
            font-size: 14px;
            font-weight: 600;
            color: #fff;
        }

        .niv-panel-status {
            font-size: 12px;
            color: #10b981;
        }

        /* Niv Suggestions */
        .niv-suggestions {
            padding: 20px;
            flex: 1;
            overflow-y: auto;
        }

        .suggestion-card {
            background: rgba(30, 30, 45, 0.4);
            border: 1px solid rgba(139, 92, 246, 0.1);
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 15px;
        }

        .suggestion-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 10px;
        }

        .suggestion-icon {
            width: 24px;
            height: 24px;
            background: rgba(139, 92, 246, 0.2);
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
        }

        .suggestion-title {
            font-size: 13px;
            color: #fff;
            font-weight: 500;
        }

        .suggestion-content {
            font-size: 13px;
            color: #9ca3af;
            line-height: 1.5;
            margin-bottom: 12px;
        }

        .suggestion-actions {
            display: flex;
            gap: 8px;
        }

        .suggestion-btn {
            padding: 6px 12px;
            background: rgba(139, 92, 246, 0.1);
            border: 1px solid rgba(139, 92, 246, 0.2);
            color: #8b5cf6;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s;
        }

        .suggestion-btn:hover {
            background: rgba(139, 92, 246, 0.2);
        }

        /* Niv Input */
        .niv-input-container {
            padding: 20px;
            border-top: 1px solid rgba(139, 92, 246, 0.1);
        }

        .niv-quick-actions {
            display: flex;
            gap: 8px;
            margin-bottom: 12px;
            flex-wrap: wrap;
        }

        .quick-action {
            padding: 6px 10px;
            background: rgba(30, 30, 45, 0.6);
            border: 1px solid rgba(139, 92, 246, 0.1);
            color: #9ca3af;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s;
        }

        .quick-action:hover {
            background: rgba(139, 92, 246, 0.1);
            color: #8b5cf6;
        }

        .niv-input-wrapper {
            display: flex;
            gap: 10px;
        }

        .niv-input {
            flex: 1;
            background: rgba(30, 30, 45, 0.6);
            border: 1px solid rgba(139, 92, 246, 0.2);
            border-radius: 8px;
            padding: 10px 15px;
            color: #fff;
            font-size: 13px;
        }

        .niv-input:focus {
            outline: none;
            border-color: #8b5cf6;
            background: rgba(30, 30, 45, 0.8);
        }

        .niv-send-btn {
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, #8b5cf6, #6366f1);
            border: none;
            border-radius: 8px;
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
        }

        .niv-send-btn:hover {
            transform: scale(1.05);
        }

        /* Summary Bar */
        .summary-bar {
            padding: 15px 30px;
            background: rgba(139, 92, 246, 0.05);
            border-top: 1px solid rgba(139, 92, 246, 0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .summary-stats {
            display: flex;
            gap: 30px;
        }

        .stat {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .stat-label {
            font-size: 12px;
            color: #6b7280;
        }

        .stat-value {
            font-size: 14px;
            color: #fff;
            font-weight: 600;
        }

        .summary-actions {
            display: flex;
            gap: 10px;
        }
    </style>

</head>
<body>
    <div class="workspace-container">
        <!-- Main Workspace Area -->
        <div class="main-workspace">
            <!-- Header -->
            <div class="workspace-header">
                <div class="workspace-title">
                    <button class="back-btn">
                        <span>←</span>
                        <span>Back to Niv</span>
                    </button>
                    <div>
                        <div class="workspace-name">📰 Media Outreach Plan</div>
                        <div class="workspace-meta">Part of: Crisis Response Workflow • Last updated by Niv 2 mins ago</div>
                    </div>
                </div>
                <div class="workspace-actions">
                    <button class="action-btn">Export</button>
                    <button class="action-btn">Share</button>
                    <button class="action-btn primary">Execute Outreach</button>
                </div>
            </div>

            <!-- Tabs -->
            <div class="workspace-tabs">
                <div class="tab active">
                    Journalist List
                    <span class="tab-badge">47</span>
                </div>
                <div class="tab">
                    Pitch Templates
                    <span class="tab-badge">3</span>
                </div>
                <div class="tab">
                    Timeline
                </div>
                <div class="tab">
                    Tracking
                    <span class="tab-badge">12 sent</span>
                </div>
            </div>

            <!-- Content -->
            <div class="workspace-content">
                <div class="media-table">
                    <div class="table-header">
                        <div></div>
                        <div>Journalist</div>
                        <div>Beat</div>
                        <div>Relationship</div>
                        <div>Recent Coverage</div>
                        <div>Status</div>
                        <div>Actions</div>
                    </div>

                    <div class="table-row">
                        <div class="checkbox checked"></div>
                        <div class="journalist-info">
                            <div class="journalist-avatar">JC</div>
                            <div class="journalist-details">
                                <div class="journalist-name">Jennifer Chen</div>
                                <div class="journalist-outlet">TechCrunch</div>
                            </div>
                        </div>
                        <div>
                            <span class="beat-tag">Security</span>
                        </div>
                        <div class="relationship-score">
                            <div class="score-bar">
                                <div class="score-fill" style="width: 85%"></div>
                            </div>
                            <span style="font-size: 12px; color: #10b981;">Strong</span>
                        </div>
                        <div class="recent-coverage">
                            2 days ago
                        </div>
                        <div>
                            <span class="status-badge ready">Ready</span>
                        </div>
                        <div class="row-actions">
                            <button class="row-action-btn">Pitch</button>
                            <button class="row-action-btn">View</button>
                        </div>
                    </div>

                    <div class="table-row">
                        <div class="checkbox checked"></div>
                        <div class="journalist-info">
                            <div class="journalist-avatar">MT</div>
                            <div class="journalist-details">
                                <div class="journalist-name">Michael Torres</div>
                                <div class="journalist-outlet">Wall Street Journal</div>
                            </div>
                        </div>
                        <div>
                            <span class="beat-tag">Enterprise</span>
                        </div>
                        <div class="relationship-score">
                            <div class="score-bar">
                                <div class="score-fill" style="width: 60%"></div>
                            </div>
                            <span style="font-size: 12px; color: #6366f1;">Moderate</span>
                        </div>
                        <div class="recent-coverage">
                            1 week ago
                        </div>
                        <div>
                            <span class="status-badge contacted">Contacted</span>
                        </div>
                        <div class="row-actions">
                            <button class="row-action-btn">Follow up</button>
                            <button class="row-action-btn">View</button>
                        </div>
                    </div>

                    <div class="table-row">
                        <div class="checkbox"></div>
                        <div class="journalist-info">
                            <div class="journalist-avatar">SK</div>
                            <div class="journalist-details">
                                <div class="journalist-name">Sarah Kim</div>
                                <div class="journalist-outlet">Wired</div>
                            </div>
                        </div>
                        <div>
                            <span class="beat-tag">Privacy</span>
                        </div>
                        <div class="relationship-score">
                            <div class="score-bar">
                                <div class="score-fill" style="width: 40%"></div>
                            </div>
                            <span style="font-size: 12px; color: #9ca3af;">New</span>
                        </div>
                        <div class="recent-coverage">
                            Yesterday
                        </div>
                        <div>
                            <span class="status-badge ready">Ready</span>
                        </div>
                        <div class="row-actions">
                            <button class="row-action-btn">Pitch</button>
                            <button class="row-action-btn">View</button>
                        </div>
                    </div>

                    <!-- More rows would continue... -->
                </div>
            </div>

            <!-- Summary Bar -->
            <div class="summary-bar">
                <div class="summary-stats">
                    <div class="stat">
                        <span class="stat-label">Total Journalists:</span>
                        <span class="stat-value">47</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Selected:</span>
                        <span class="stat-value">2</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Contacted:</span>
                        <span class="stat-value">12</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Response Rate:</span>
                        <span class="stat-value">33%</span>
                    </div>
                </div>
                <div class="summary-actions">
                    <button class="action-btn">Select All Tier 1</button>
                    <button class="action-btn primary">Generate Pitches for Selected</button>
                </div>
            </div>
        </div>

        <!-- Niv Assist Panel -->
        <div class="niv-panel">
            <div class="niv-panel-header">
                <div class="niv-avatar-small">🧠</div>
                <div class="niv-panel-title">
                    <div class="niv-panel-name">Niv</div>
                    <div class="niv-panel-status">Analyzing your media list...</div>
                </div>
            </div>

            <div class="niv-suggestions">
                <!-- Insight Card -->
                <div class="suggestion-card">
                    <div class="suggestion-header">
                        <div class="suggestion-icon">⚡</div>
                        <div class="suggestion-title">Timing Opportunity</div>
                    </div>
                    <div class="suggestion-content">
                        Jennifer Chen at TechCrunch just tweeted about data security 10 minutes ago. She's likely working on a story now. Reach out immediately.
                    </div>
                    <div class="suggestion-actions">
                        <button class="suggestion-btn">Generate Pitch</button>
                        <button class="suggestion-btn">View Tweet</button>
                    </div>
                </div>

                <!-- Gap Analysis -->
                <div class="suggestion-card">
                    <div class="suggestion-header">
                        <div class="suggestion-icon">🔍</div>
                        <div class="suggestion-title">Coverage Gap Found</div>
                    </div>
                    <div class="suggestion-content">
                        You're missing Bloomberg and Reuters - critical for financial impact angles. I found 3 relevant journalists who recently covered your competitors.
                    </div>
                    <div class="suggestion-actions">
                        <button class="suggestion-btn">Add to List</button>
                        <button class="suggestion-btn">View Journalists</button>
                    </div>
                </div>

                <!-- Strategic Advice -->
                <div class="suggestion-card">
                    <div class="suggestion-header">
                        <div class="suggestion-icon">🎯</div>
                        <div class="suggestion-title">Strategic Insight</div>
                    </div>
                    <div class="suggestion-content">
                        Based on the crisis timeline, prioritize Tier 1 journalists for the next 2 hours. After that, the news cycle will shift and you'll have missed the window.
                    </div>
                    <div class="suggestion-actions">
                        <button class="suggestion-btn">Adjust Priority</button>
                    </div>
                </div>

                <!-- Pattern Recognition -->
                <div class="suggestion-card">
                    <div class="suggestion-header">
                        <div class="suggestion-icon">📊</div>
                        <div class="suggestion-title">Historical Pattern</div>
                    </div>
                    <div class="suggestion-content">
                        Michael Torres has a 90% response rate to exclusives but only 20% to general pitches. Consider offering exclusive access to your CTO.
                    </div>
                    <div class="suggestion-actions">
                        <button class="suggestion-btn">Create Exclusive</button>
                    </div>
                </div>
            </div>

            <!-- Niv Input Area -->
            <div class="niv-input-container">
                <div class="niv-quick-actions">
                    <button class="quick-action">Find similar journalists</button>
                    <button class="quick-action">Generate all pitches</button>
                    <button class="quick-action">Optimize timing</button>
                    <button class="quick-action">Predict responses</button>
                </div>
                <div class="niv-input-wrapper">
                    <input type="text" class="niv-input" placeholder="Ask Niv to expand, analyze, or optimize...">
                    <button class="niv-send-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', function() {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                this.classList.add('active');
            });
        });

        // Checkbox toggling
        document.querySelectorAll('.checkbox').forEach(checkbox => {
            checkbox.addEventListener('click', function(e) {
                e.stopPropagation();
                this.classList.toggle('checked');
                updateSelectedCount();
            });
        });

        // Update selected count
        function updateSelectedCount() {
            const checked = document.querySelectorAll('.checkbox.checked').length;
            document.querySelector('.summary-stats .stat:nth-child(2) .stat-value').textContent = checked;
        }

        // Row hover effect
        document.querySelectorAll('.table-row').forEach(row => {
            row.addEventListener('mouseenter', function() {
                // Could trigger Niv to show relevant info
            });
        });

        // Suggestion actions
        document.querySelectorAll('.suggestion-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const action = this.textContent;
                document.querySelector('.niv-input').value = action;
                document.querySelector('.niv-panel-status').textContent = `Processing: ${action}...`;
            });
        });

        // Quick actions
        document.querySelectorAll('.quick-action').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelector('.niv-input').value = this.textContent;
                document.querySelector('.niv-input').focus();
            });
        });

        // Back button
        document.querySelector('.back-btn').addEventListener('click', function() {
            console.log('Return to Niv conversation view');
        });

        // Simulate Niv real-time analysis
        setTimeout(() => {
            document.querySelector('.niv-panel-status').textContent = 'Found 3 optimization opportunities';
        }, 3000);
    </script>

</body>
</html>
