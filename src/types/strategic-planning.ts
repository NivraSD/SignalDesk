export interface StrategicPlan {
  id: string
  campaign_id?: string              // Links to MemoryVault campaign
  framework_id?: string             // Source NIV framework
  organization_id: string

  // Plan Details
  title: string
  objective: string
  timeline: {
    start_date: Date
    end_date: Date
    duration_days: number
  }

  // Phases
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

  // Metadata
  created_at: Date
  updated_at: Date
  created_by: string
}

export interface Phase {
  id: string
  name: string
  description: string
  order: number
  start_date: Date
  end_date: Date
  status: 'not_started' | 'in_progress' | 'completed'
  task_ids: string[]              // Task IDs in this phase
  deliverables: string[]
  color?: string                  // For UI display
}

export interface Task {
  id: string
  plan_id: string
  phase_id: string
  title: string
  description: string
  type: TaskType

  // Scheduling
  scheduled_date?: Date
  due_date: Date
  estimated_hours: number
  actual_hours?: number

  // Status
  status: TaskStatus
  priority: Priority
  progress: number               // 0-100

  // Assignment
  assigned_to?: string
  completed_by?: string
  completed_at?: Date

  // Relationships
  dependencies: string[]         // Other task IDs that must complete first
  blocks: string[]              // Task IDs that this blocks
  outputs?: string[]            // Links to generated content
  workflow_trigger?: string     // Workflow to execute on completion

  // Notes & Updates
  notes?: string
  updates?: TaskUpdate[]
}

export interface Milestone {
  id: string
  plan_id: string
  name: string
  description: string
  date: Date
  type: MilestoneType
  status: MilestoneStatus
  required_task_ids: string[]    // Tasks that must complete
  impact: 'critical' | 'major' | 'minor'
  color?: string
}

export interface TaskUpdate {
  id: string
  task_id: string
  message: string
  created_at: Date
  created_by: string
  type: 'progress' | 'blocker' | 'comment'
}

// Enums
export type TaskType =
  | 'content_creation'
  | 'media_outreach'
  | 'analysis'
  | 'coordination'
  | 'review'
  | 'approval'
  | 'publication'

export type TaskStatus =
  | 'todo'
  | 'in_progress'
  | 'review'
  | 'done'
  | 'blocked'
  | 'cancelled'

export type Priority =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'

export type MilestoneType =
  | 'launch'
  | 'deadline'
  | 'review'
  | 'delivery'
  | 'checkpoint'

export type MilestoneStatus =
  | 'upcoming'
  | 'at_risk'
  | 'achieved'
  | 'missed'

// View types
export type PlanView = 'timeline' | 'tasks' | 'milestones' | 'progress'

// Filters
export interface TaskFilter {
  status?: TaskStatus[]
  priority?: Priority[]
  type?: TaskType[]
  assigned_to?: string[]
  phase_id?: string
}

// Conversion from NIV Framework
export interface FrameworkConversionOptions {
  start_date?: Date
  aggressive_timeline?: boolean
  include_buffer_time?: boolean
  auto_assign?: boolean
}