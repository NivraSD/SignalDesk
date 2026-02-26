'use client'

import React, { useState, useEffect } from 'react'
import {
  Calendar,
  ListChecks,
  Flag,
  TrendingUp,
  PlayCircle,
  Clock,
  AlertCircle,
  CheckCircle,
  Target,
  ChevronRight,
  Filter,
  Plus,
  Download,
  RefreshCw,
  Zap
} from 'lucide-react'
import type { StrategicPlan, Task, Milestone, Phase, PlanView, TaskStatus, Priority } from '@/types/strategic-planning'
import { TimelineView } from '@/components/planning/TimelineView'
import { TaskBoard } from '@/components/planning/TaskBoard'
import { MilestonesView } from '@/components/planning/MilestonesView'
import { ProgressDashboard } from '@/components/planning/ProgressDashboard'

interface StrategicPlanningModuleProps {
  framework?: any  // NIV Strategic Framework
  campaignId?: string
}

export default function StrategicPlanningModule({ framework, campaignId }: StrategicPlanningModuleProps) {
  const [currentPlan, setCurrentPlan] = useState<StrategicPlan | null>(null)
  const [activeView, setActiveView] = useState<PlanView>('timeline')
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null)
  const [taskFilter, setTaskFilter] = useState<TaskStatus | null>(null)

  // Generate plan from framework on mount if provided
  useEffect(() => {
    if (framework && !currentPlan) {
      generatePlanFromFramework()
    }
  }, [framework])

  const generatePlanFromFramework = async () => {
    if (!framework) return

    setIsGenerating(true)
    try {
      // Convert NIV framework to strategic plan
      const plan = await convertFrameworkToPlan(framework)
      setCurrentPlan(plan)
    } catch (error) {
      console.error('Error generating plan:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  // Convert NIV framework to strategic plan
  const convertFrameworkToPlan = async (framework: any): Promise<StrategicPlan> => {
    const startDate = new Date()
    const urgencyDays = getUrgencyDays(framework.strategy?.urgency || 'medium')
    const endDate = new Date(startDate.getTime() + urgencyDays * 24 * 60 * 60 * 1000)

    const phases = generatePhases(framework, startDate)
    const tasks = generateTasks(framework, phases)
    const milestones = generateMilestones(framework, phases)

    return {
      id: `plan-${Date.now()}`,
      campaign_id: campaignId,
      framework_id: framework.id,
      organization_id: framework.organizationId || 'default',

      title: framework.strategy?.objective || 'Strategic Campaign',
      objective: framework.strategy?.objective || '',

      timeline: {
        start_date: startDate,
        end_date: endDate,
        duration_days: urgencyDays
      },

      phases,
      tasks,
      milestones,

      progress: {
        overall: 0,
        tasks_completed: 0,
        tasks_total: tasks.length,
        on_track: true,
        risk_level: 'low'
      },

      created_at: new Date(),
      updated_at: new Date(),
      created_by: 'system'
    }
  }

  const getUrgencyDays = (urgency: string): number => {
    switch (urgency) {
      case 'immediate': return 7
      case 'high': return 14
      case 'medium': return 30
      case 'low': return 60
      default: return 30
    }
  }

  const generatePhases = (framework: any, startDate: Date): Phase[] => {
    const phases: Phase[] = []
    let currentDate = new Date(startDate)

    // Phase 1: Immediate Actions (48 hours)
    if (framework.tactics?.immediate_actions?.length > 0) {
      phases.push({
        id: 'phase-immediate',
        name: 'Immediate Actions',
        description: 'Critical first 48-hour actions',
        order: 1,
        start_date: currentDate,
        end_date: new Date(currentDate.getTime() + 2 * 24 * 60 * 60 * 1000),
        status: 'not_started',
        task_ids: [],
        deliverables: framework.tactics.immediate_actions || [],
        color: '#ef4444'  // Red for urgent
      })
      currentDate = new Date(currentDate.getTime() + 2 * 24 * 60 * 60 * 1000)
    }

    // Phase 2: Week 1 Priorities
    if (framework.tactics?.week_one_priorities?.length > 0) {
      phases.push({
        id: 'phase-week1',
        name: 'Week 1 Priorities',
        description: 'First week execution',
        order: 2,
        start_date: currentDate,
        end_date: new Date(currentDate.getTime() + 5 * 24 * 60 * 60 * 1000),
        status: 'not_started',
        task_ids: [],
        deliverables: framework.tactics.week_one_priorities || [],
        color: '#f59e0b'  // Amber
      })
      currentDate = new Date(currentDate.getTime() + 5 * 24 * 60 * 60 * 1000)
    }

    // Phase 3: Strategic Execution
    if (framework.tactics?.strategic_plays?.length > 0) {
      phases.push({
        id: 'phase-strategic',
        name: 'Strategic Execution',
        description: 'Long-term strategic initiatives',
        order: 3,
        start_date: currentDate,
        end_date: new Date(currentDate.getTime() + 21 * 24 * 60 * 60 * 1000),
        status: 'not_started',
        task_ids: [],
        deliverables: framework.tactics.strategic_plays || [],
        color: '#10b981'  // Green
      })
    }

    return phases
  }

  const generateTasks = (framework: any, phases: Phase[]): Task[] => {
    const tasks: Task[] = []
    let taskIndex = 0

    // Generate tasks for each phase
    phases.forEach(phase => {
      phase.deliverables.forEach(deliverable => {
        const task: Task = {
          id: `task-${++taskIndex}`,
          plan_id: `plan-${Date.now()}`,
          phase_id: phase.id,
          title: deliverable,
          description: `Execute: ${deliverable}`,
          type: determineTaskType(deliverable),
          scheduled_date: phase.start_date,
          due_date: phase.end_date,
          estimated_hours: estimateHours(deliverable),
          status: 'todo',
          priority: phase.order === 1 ? 'critical' : phase.order === 2 ? 'high' : 'medium',
          progress: 0,
          dependencies: [],
          blocks: [],
          notes: `Generated from strategic framework`
        }
        tasks.push(task)
        phase.task_ids.push(task.id)
      })
    })

    // Add tasks from campaign elements if present
    if (framework.tactics?.campaign_elements) {
      // Content creation tasks
      framework.tactics.campaign_elements.content_creation?.forEach((content: string) => {
        tasks.push({
          id: `task-${++taskIndex}`,
          plan_id: `plan-${Date.now()}`,
          phase_id: phases[1]?.id || phases[0].id,
          title: `Create: ${content}`,
          description: `Generate ${content} based on strategic narrative`,
          type: 'content_creation',
          due_date: phases[1]?.end_date || phases[0].end_date,
          estimated_hours: 4,
          status: 'todo',
          priority: 'high',
          progress: 0,
          dependencies: [],
          blocks: [],
          workflow_trigger: 'content_generation'
        })
      })

      // Media outreach tasks
      framework.tactics.campaign_elements.media_outreach?.forEach((media: string) => {
        tasks.push({
          id: `task-${++taskIndex}`,
          plan_id: `plan-${Date.now()}`,
          phase_id: phases[1]?.id || phases[0].id,
          title: `Outreach: ${media}`,
          description: `Execute media outreach for ${media}`,
          type: 'media_outreach',
          due_date: phases[1]?.end_date || phases[0].end_date,
          estimated_hours: 2,
          status: 'todo',
          priority: 'high',
          progress: 0,
          dependencies: [],
          blocks: [],
          workflow_trigger: 'media_outreach'
        })
      })
    }

    return tasks
  }

  const generateMilestones = (framework: any, phases: Phase[]): Milestone[] => {
    const milestones: Milestone[] = []

    // Add phase completion milestones
    phases.forEach((phase, index) => {
      milestones.push({
        id: `milestone-${index + 1}`,
        plan_id: `plan-${Date.now()}`,
        name: `${phase.name} Complete`,
        description: `All ${phase.name.toLowerCase()} tasks completed`,
        date: phase.end_date,
        type: index === 0 ? 'checkpoint' : index === phases.length - 1 ? 'delivery' : 'review',
        status: 'upcoming',
        required_task_ids: phase.task_ids,
        impact: index === 0 ? 'critical' : 'major',
        color: phase.color
      })
    })

    // Add campaign launch milestone if applicable
    if (framework.strategy?.urgency === 'immediate') {
      milestones.push({
        id: `milestone-launch`,
        plan_id: `plan-${Date.now()}`,
        name: 'Campaign Launch',
        description: 'Official campaign launch',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        type: 'launch',
        status: 'upcoming',
        required_task_ids: [],
        impact: 'critical',
        color: '#8b5cf6'
      })
    }

    return milestones
  }

  const determineTaskType = (deliverable: string): any => {
    const lower = deliverable.toLowerCase()
    if (lower.includes('content') || lower.includes('write') || lower.includes('create')) {
      return 'content_creation'
    }
    if (lower.includes('media') || lower.includes('outreach') || lower.includes('pitch')) {
      return 'media_outreach'
    }
    if (lower.includes('analyze') || lower.includes('research') || lower.includes('monitor')) {
      return 'analysis'
    }
    return 'coordination'
  }

  const estimateHours = (deliverable: string): number => {
    const lower = deliverable.toLowerCase()
    if (lower.includes('comprehensive') || lower.includes('detailed')) return 8
    if (lower.includes('create') || lower.includes('develop')) return 4
    if (lower.includes('review') || lower.includes('analyze')) return 2
    return 3
  }

  const updateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    if (!currentPlan) return

    const updatedTasks = currentPlan.tasks.map(task => {
      if (task.id === taskId) {
        return { ...task, status: newStatus }
      }
      return task
    })

    const completedTasks = updatedTasks.filter(t => t.status === 'done').length
    const overall = Math.round((completedTasks / updatedTasks.length) * 100)

    setCurrentPlan({
      ...currentPlan,
      tasks: updatedTasks,
      progress: {
        ...currentPlan.progress,
        tasks_completed: completedTasks,
        overall
      }
    })
  }

  const viewOptions = [
    { id: 'timeline', label: 'Timeline', icon: Calendar },
    { id: 'tasks', label: 'Tasks', icon: ListChecks },
    { id: 'milestones', label: 'Milestones', icon: Flag },
    { id: 'progress', label: 'Progress', icon: TrendingUp }
  ]

  if (isGenerating) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Zap className="w-12 h-12 mx-auto mb-4 text-yellow-500 animate-pulse" />
          <p className="text-lg">Generating Strategic Plan...</p>
          <p className="text-sm text-gray-500 mt-2">Converting framework to actionable tasks</p>
        </div>
      </div>
    )
  }

  if (!currentPlan && !framework) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Target className="w-12 h-12 mx-auto mb-4 text-gray-500" />
          <p className="text-lg">No Strategic Plan</p>
          <p className="text-sm text-gray-500 mt-2">Generate a plan from NIV to get started</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">{currentPlan?.title || 'Strategic Plan'}</h2>
            <p className="text-sm text-gray-400 mt-1">
              {currentPlan?.timeline.duration_days} day campaign •
              {' '}{currentPlan?.tasks.length} tasks •
              {' '}{currentPlan?.milestones.length} milestones
            </p>
          </div>

          {/* Progress Overview */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-yellow-500">
                {currentPlan?.progress.overall || 0}%
              </div>
              <div className="text-xs text-gray-400">Complete</div>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex gap-2">
          {viewOptions.map(view => {
            const Icon = view.icon
            return (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id as PlanView)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  activeView === view.id
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {view.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeView === 'timeline' && currentPlan && (
          <TimelineView plan={currentPlan} onTaskUpdate={updateTaskStatus} />
        )}
        {activeView === 'tasks' && currentPlan && (
          <TaskBoard tasks={currentPlan.tasks} onStatusChange={updateTaskStatus} />
        )}
        {activeView === 'milestones' && currentPlan && (
          <MilestonesView milestones={currentPlan.milestones} tasks={currentPlan.tasks} />
        )}
        {activeView === 'progress' && currentPlan && (
          <ProgressDashboard plan={currentPlan} />
        )}
      </div>

      {/* Quick Actions */}
      {currentPlan && (
        <div className="p-4 border-t border-gray-800">
          <div className="flex gap-2">
            <button className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              Add Task
            </button>
            <button className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-center gap-2">
              <Flag className="w-4 h-4" />
              Add Milestone
            </button>
            <button className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-center gap-2">
              <Download className="w-4 h-4" />
              Export Plan
            </button>
          </div>
        </div>
      )}
    </div>
  )
}