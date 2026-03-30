'use client'

import React from 'react'
import {
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Target,
  Activity,
  Users
} from 'lucide-react'
import type { StrategicPlan } from '@/types/strategic-planning'

interface ProgressDashboardProps {
  plan: StrategicPlan
}

export function ProgressDashboard({ plan }: ProgressDashboardProps) {
  // Calculate metrics
  const calculateMetrics = () => {
    const totalTasks = plan.tasks.length
    const completedTasks = plan.tasks.filter(t => t.status === 'done').length
    const inProgressTasks = plan.tasks.filter(t => t.status === 'in_progress').length
    const blockedTasks = plan.tasks.filter(t => t.status === 'blocked').length
    const overdueTasks = plan.tasks.filter(t => {
      const dueDate = new Date(t.due_date)
      return dueDate < new Date() && t.status !== 'done'
    }).length

    const criticalTasks = plan.tasks.filter(t => t.priority === 'critical')
    const criticalCompleted = criticalTasks.filter(t => t.status === 'done').length

    const todayProgress = Math.floor(
      ((new Date().getTime() - new Date(plan.timeline.start_date).getTime()) /
       (new Date(plan.timeline.end_date).getTime() - new Date(plan.timeline.start_date).getTime())) * 100
    )

    const velocityRate = completedTasks / Math.max(1, Math.floor(
      (new Date().getTime() - new Date(plan.timeline.start_date).getTime()) / (1000 * 60 * 60 * 24)
    ))

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      blockedTasks,
      overdueTasks,
      criticalCompleted,
      criticalTotal: criticalTasks.length,
      todayProgress: Math.min(100, Math.max(0, todayProgress)),
      velocityRate: velocityRate.toFixed(2),
      completionRate: Math.round((completedTasks / totalTasks) * 100)
    }
  }

  const metrics = calculateMetrics()

  // Calculate phase progress
  const getPhaseProgress = () => {
    return plan.phases.map(phase => {
      const phaseTasks = plan.tasks.filter(t => t.phase_id === phase.id)
      const completed = phaseTasks.filter(t => t.status === 'done').length
      return {
        ...phase,
        progress: phaseTasks.length ? Math.round((completed / phaseTasks.length) * 100) : 0,
        completed,
        total: phaseTasks.length
      }
    })
  }

  const phaseProgress = getPhaseProgress()

  // Risk assessment
  const getRiskLevel = () => {
    if (metrics.blockedTasks > 3 || metrics.overdueTasks > 2) return 'high'
    if (metrics.blockedTasks > 1 || metrics.overdueTasks > 0) return 'medium'
    return 'low'
  }

  const riskLevel = getRiskLevel()
  const riskColors = {
    low: 'text-green-400 bg-green-500/10',
    medium: 'text-yellow-400 bg-yellow-500/10',
    high: 'text-red-400 bg-red-500/10'
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-5 h-5 text-yellow-500" />
            <span className="text-3xl font-bold text-yellow-500">
              {metrics.completionRate}%
            </span>
          </div>
          <p className="text-sm text-gray-400">Overall Progress</p>
          <div className="mt-2 h-2 bg-gray-700 rounded-full">
            <div
              className="h-full bg-yellow-500 rounded-full"
              style={{ width: `${metrics.completionRate}%` }}
            />
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <span className="text-3xl font-bold">
              {metrics.todayProgress}%
            </span>
          </div>
          <p className="text-sm text-gray-400">Timeline Progress</p>
          <div className="mt-2 h-2 bg-gray-700 rounded-full">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${metrics.todayProgress}%` }}
            />
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-5 h-5 text-green-500" />
            <span className="text-3xl font-bold text-green-500">
              {metrics.velocityRate}
            </span>
          </div>
          <p className="text-sm text-gray-400">Tasks/Day</p>
          <p className="text-xs text-gray-500 mt-1">Current velocity</p>
        </div>

        <div className={`rounded-lg p-4 ${riskColors[riskLevel]}`}>
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-2xl font-bold uppercase">
              {riskLevel}
            </span>
          </div>
          <p className="text-sm">Risk Level</p>
          {metrics.blockedTasks > 0 && (
            <p className="text-xs mt-1">{metrics.blockedTasks} blocked</p>
          )}
        </div>
      </div>

      {/* Task Status Breakdown */}
      <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-4">Task Status</h3>
        <div className="space-y-3">
          <TaskStatusBar
            label="Completed"
            count={metrics.completedTasks}
            total={metrics.totalTasks}
            color="bg-green-500"
          />
          <TaskStatusBar
            label="In Progress"
            count={metrics.inProgressTasks}
            total={metrics.totalTasks}
            color="bg-yellow-500"
          />
          <TaskStatusBar
            label="Blocked"
            count={metrics.blockedTasks}
            total={metrics.totalTasks}
            color="bg-red-500"
          />
          <TaskStatusBar
            label="Remaining"
            count={metrics.totalTasks - metrics.completedTasks - metrics.inProgressTasks - metrics.blockedTasks}
            total={metrics.totalTasks}
            color="bg-gray-600"
          />
        </div>
      </div>

      {/* Phase Progress */}
      <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-4">Phase Progress</h3>
        <div className="space-y-4">
          {phaseProgress.map(phase => (
            <div key={phase.id}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: phase.color || '#6b7280' }}
                  />
                  <span className="font-medium">{phase.name}</span>
                </div>
                <span className="text-sm text-gray-400">
                  {phase.completed}/{phase.total} tasks • {phase.progress}%
                </span>
              </div>
              <div className="h-3 bg-gray-700 rounded-full">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${phase.progress}%`,
                    backgroundColor: phase.color || '#6b7280'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Critical Tasks */}
      {metrics.criticalTotal > 0 && (
        <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-4 text-red-400">Critical Tasks</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold">
                {metrics.criticalCompleted}/{metrics.criticalTotal}
              </div>
              <div className="text-sm text-gray-400">
                <p>Critical tasks completed</p>
                <p className="text-xs text-gray-500">High priority items</p>
              </div>
            </div>
            <div className="w-32 h-2 bg-gray-700 rounded-full">
              <div
                className="h-full bg-red-500 rounded-full"
                style={{ width: `${(metrics.criticalCompleted / metrics.criticalTotal) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Alerts & Warnings */}
      {(metrics.overdueTasks > 0 || metrics.blockedTasks > 0) && (
        <div className="space-y-3">
          {metrics.overdueTasks > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <span className="font-medium text-red-400">
                  {metrics.overdueTasks} Overdue Tasks
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Review and update task schedules immediately
              </p>
            </div>
          )}

          {metrics.blockedTasks > 0 && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                <span className="font-medium text-orange-400">
                  {metrics.blockedTasks} Blocked Tasks
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                Address blockers to maintain momentum
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Task Status Bar Component
function TaskStatusBar({
  label,
  count,
  total,
  color
}: {
  label: string
  count: number
  total: number
  color: string
}) {
  const percentage = Math.round((count / total) * 100)

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="text-gray-400">{count} ({percentage}%)</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}