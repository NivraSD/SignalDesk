# Strategic Planning Component Design
## Project Management Backbone for SignalDesk V3

### Overview

The Strategic Planning component transforms NIV's strategic frameworks into **actionable project plans** with timelines, tasks, milestones, and progress tracking. It's the bridge between strategy and execution.

---

## 🎯 Core Purpose

**From V2 (Keep):**
- Timeline management
- Milestone tracking
- Task breakdown
- Progress visualization

**For V3 (New):**
- Direct integration with NIV frameworks
- Automatic task generation from strategy
- Connection to MemoryVault orchestration
- Real-time execution tracking
- Campaign workspace management

**Drop from V2:**
- Redundant plan creation (NIV handles this)
- Local storage (use Supabase)
- Complex pillars structure (simplify to tasks/milestones)

---

## 📐 Component Architecture

```typescript
interface StrategicPlan {
  id: string
  campaign_id: string              // Links to MemoryVault campaign
  framework_id: string             // Source NIV framework

  // Plan Details
  title: string
  objective: string
  timeline: {
    start_date: Date
    end_date: Date
    duration_days: number
  }

  // Phases (replaces pillars)
  phases: Phase[]

  // Tasks & Milestones
  tasks: Task[]
  milestones: Milestone[]

  // Progress Tracking
  progress: {
    overall: number              // 0-100
    tasks_completed: number
    tasks_total: number
    on_track: boolean
    risk_level: 'low' | 'medium' | 'high'
  }

  // Team & Resources
  resources: {
    assigned_to: string[]
    budget?: number
    tools_required: string[]
  }
}

interface Phase {
  id: string
  name: string
  description: string
  start_date: Date
  end_date: Date
  status: 'not_started' | 'in_progress' | 'completed'
  tasks: string[]                // Task IDs
  deliverables: string[]
}

interface Task {
  id: string
  phase_id: string
  title: string
  description: string
  type: 'content' | 'outreach' | 'analysis' | 'coordination'

  // Scheduling
  scheduled_date: Date
  due_date: Date
  estimated_hours: number

  // Status
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked'
  priority: 'critical' | 'high' | 'medium' | 'low'

  // Execution
  assigned_to?: string
  completed_by?: string
  completed_at?: Date

  // Links
  dependencies: string[]         // Other task IDs
  outputs: string[]              // Links to generated content
  notes?: string
}

interface Milestone {
  id: string
  name: string
  date: Date
  type: 'launch' | 'deadline' | 'review' | 'delivery'
  status: 'upcoming' | 'achieved' | 'missed'
  tasks: string[]                // Required tasks
  description: string
  impact: 'critical' | 'major' | 'minor'
}
```

---

## 🎨 UI Components

### 1. Strategic Planning Dashboard

```typescript
export function StrategicPlanningModule() {
  return (
    <div className="strategic-planning">
      {/* Header with Campaign Info */}
      <PlanHeader plan={currentPlan} />

      {/* View Selector */}
      <ViewTabs>
        <Tab id="timeline" label="Timeline" icon={Calendar} />
        <Tab id="tasks" label="Tasks" icon={ListChecks} />
        <Tab id="milestones" label="Milestones" icon={Flag} />
        <Tab id="progress" label="Progress" icon={TrendingUp} />
      </ViewTabs>

      {/* Main Content Area */}
      <PlanContent>
        {activeView === 'timeline' && <TimelineView />}
        {activeView === 'tasks' && <TaskBoard />}
        {activeView === 'milestones' && <MilestonesView />}
        {activeView === 'progress' && <ProgressDashboard />}
      </PlanContent>

      {/* Quick Actions */}
      <QuickActions>
        <Button onClick={generateTasks}>Generate Tasks from Strategy</Button>
        <Button onClick={adjustTimeline}>Adjust Timeline</Button>
        <Button onClick={exportPlan}>Export Plan</Button>
      </QuickActions>
    </div>
  )
}
```

### 2. Timeline View (Gantt-style)

```typescript
export function TimelineView({ plan }) {
  return (
    <div className="timeline-view">
      {/* Timeline Header with dates */}
      <TimelineHeader
        startDate={plan.timeline.start_date}
        endDate={plan.timeline.end_date}
      />

      {/* Phases as swimlanes */}
      {plan.phases.map(phase => (
        <PhaseSwimlane key={phase.id}>
          <PhaseInfo>{phase.name}</PhaseInfo>
          <TaskBars tasks={phase.tasks} />
          <MilestoneMarkers milestones={phase.milestones} />
        </PhaseSwimlane>
      ))}

      {/* Today marker */}
      <TodayLine />
    </div>
  )
}
```

### 3. Task Board (Kanban-style)

```typescript
export function TaskBoard({ tasks }) {
  const columns = ['todo', 'in_progress', 'review', 'done']

  return (
    <div className="task-board">
      {columns.map(status => (
        <TaskColumn key={status} status={status}>
          {tasks
            .filter(task => task.status === status)
            .map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={updateTaskStatus}
                onEdit={editTask}
              />
            ))}
        </TaskColumn>
      ))}
    </div>
  )
}
```

### 4. Task Card

```typescript
export function TaskCard({ task }) {
  return (
    <div className={`task-card priority-${task.priority}`}>
      <div className="task-header">
        <span className="task-type">{task.type}</span>
        <PriorityBadge priority={task.priority} />
      </div>

      <h4>{task.title}</h4>
      <p className="task-description">{task.description}</p>

      <div className="task-meta">
        <DueDate date={task.due_date} />
        <AssignedTo user={task.assigned_to} />
        <EstimatedTime hours={task.estimated_hours} />
      </div>

      {task.dependencies.length > 0 && (
        <Dependencies count={task.dependencies.length} />
      )}

      <div className="task-actions">
        <Button size="sm" onClick={() => markInProgress(task.id)}>
          Start Task
        </Button>
        <Button size="sm" variant="ghost" onClick={() => viewDetails(task.id)}>
          Details
        </Button>
      </div>
    </div>
  )
}
```

---

## 🔄 Integration Points

### 1. From NIV Strategic Framework

```typescript
// Convert NIV framework to strategic plan
function createPlanFromFramework(framework: NivStrategicFramework): StrategicPlan {
  return {
    id: generateId(),
    framework_id: framework.id,
    title: framework.strategy.objective,
    objective: framework.strategy.objective,

    timeline: {
      start_date: new Date(),
      end_date: calculateEndDate(framework.strategy.urgency),
      duration_days: getDurationDays(framework.strategy.urgency)
    },

    phases: [
      {
        name: 'Immediate Actions',
        tasks: convertToTasks(framework.tactics.immediate_actions),
        duration: '48 hours'
      },
      {
        name: 'Week 1 Priorities',
        tasks: convertToTasks(framework.tactics.week_one_priorities),
        duration: '1 week'
      },
      {
        name: 'Strategic Execution',
        tasks: convertToTasks(framework.tactics.strategic_plays),
        duration: '2-4 weeks'
      }
    ],

    tasks: generateTasksFromFramework(framework),
    milestones: generateMilestones(framework)
  }
}
```

### 2. To MemoryVault Orchestration

```typescript
// When task is completed, trigger workflow if needed
async function onTaskComplete(task: Task) {
  // Update progress
  await updatePlanProgress(task.plan_id)

  // Check if this triggers a workflow
  if (task.triggers_workflow) {
    await memoryVault.executeWorkflow(task.workflow_type)
  }

  // Save outputs to campaign folder
  if (task.outputs) {
    await memoryVault.saveToFolder(task.campaign_id, task.outputs)
  }
}
```

### 3. Task Generation from Strategy

```typescript
function generateTasksFromFramework(framework: NivStrategicFramework): Task[] {
  const tasks: Task[] = []

  // Content Creation Tasks
  if (framework.tactics.campaign_elements.content_creation) {
    framework.tactics.campaign_elements.content_creation.forEach(item => {
      tasks.push({
        title: `Create ${item}`,
        type: 'content',
        priority: 'high',
        estimated_hours: 4,
        description: `Generate ${item} based on strategic narrative`
      })
    })
  }

  // Media Outreach Tasks
  if (framework.tactics.campaign_elements.media_outreach) {
    framework.tactics.campaign_elements.media_outreach.forEach(item => {
      tasks.push({
        title: `Media: ${item}`,
        type: 'outreach',
        priority: 'high',
        estimated_hours: 2,
        description: `Execute media outreach for ${item}`
      })
    })
  }

  // Add milestone-based tasks
  tasks.push({
    title: 'Campaign Launch Review',
    type: 'coordination',
    priority: 'critical',
    scheduled_date: addDays(new Date(), 7),
    description: 'Review all campaign materials before launch'
  })

  return tasks
}
```

---

## 📊 Key Features

### 1. Automatic Task Generation
- Parse NIV framework
- Create tasks from tactical elements
- Set priorities based on urgency
- Establish dependencies

### 2. Timeline Intelligence
- Calculate optimal schedule
- Identify critical path
- Highlight conflicts
- Suggest adjustments

### 3. Progress Tracking
- Real-time status updates
- Burndown charts
- Risk indicators
- Completion predictions

### 4. Resource Management
- Task assignment
- Workload balancing
- Capacity planning
- Tool requirements

### 5. Milestone Management
- Critical dates tracking
- Dependency management
- Alert system
- Achievement celebration

---

## 🚀 Implementation Priority

### Phase 1: Core (Immediate)
- [ ] Basic plan structure from NIV
- [ ] Task list view
- [ ] Simple timeline
- [ ] Status tracking

### Phase 2: Enhanced (Week 1)
- [ ] Gantt chart timeline
- [ ] Kanban board
- [ ] Milestone tracking
- [ ] Progress dashboard

### Phase 3: Advanced (Week 2)
- [ ] Resource management
- [ ] Dependency tracking
- [ ] Risk assessment
- [ ] Automated adjustments

---

## 🎯 Success Metrics

1. **Conversion Rate**: 100% of NIV frameworks → actionable plans
2. **Task Completion**: 80%+ on-time task completion
3. **Visibility**: Clear view of campaign progress at all times
4. **Automation**: <2 minutes to generate full plan from framework
5. **Integration**: Seamless handoff to execution components

This Strategic Planning component becomes the **command center** for campaign execution, turning NIV's strategies into trackable, manageable projects.