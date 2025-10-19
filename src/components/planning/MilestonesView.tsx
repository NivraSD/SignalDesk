'use client'

import React from 'react'
import { Flag, Calendar, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react'
import type { Milestone, Task, MilestoneStatus } from '@/types/strategic-planning'

interface MilestonesViewProps {
  milestones: Milestone[]
  tasks: Task[]
}

export function MilestonesView({ milestones, tasks }: MilestonesViewProps) {
  const getStatusIcon = (status: MilestoneStatus) => {
    switch (status) {
      case 'achieved':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'missed':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'at_risk':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: MilestoneStatus) => {
    switch (status) {
      case 'achieved': return 'bg-green-500/10 border-green-500/30'
      case 'missed': return 'bg-red-500/10 border-red-500/30'
      case 'at_risk': return 'bg-orange-500/10 border-orange-500/30'
      default: return 'bg-gray-800/50 border-gray-700'
    }
  }

  const getImpactBadge = (impact: string) => {
    const colors = {
      critical: 'bg-red-500/20 text-red-400',
      major: 'bg-orange-500/20 text-orange-400',
      minor: 'bg-gray-700 text-gray-400'
    }
    return colors[impact as keyof typeof colors] || colors.minor
  }

  const getDaysUntil = (date: Date) => {
    const today = new Date()
    const targetDate = new Date(date)
    const diffTime = targetDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getRequiredTasksProgress = (requiredTaskIds: string[]) => {
    if (requiredTaskIds.length === 0) return { completed: 0, total: 0, percentage: 100 }

    const requiredTasks = tasks.filter(t => requiredTaskIds.includes(t.id))
    const completedTasks = requiredTasks.filter(t => t.status === 'done').length

    return {
      completed: completedTasks,
      total: requiredTasks.length,
      percentage: Math.round((completedTasks / requiredTasks.length) * 100)
    }
  }

  // Sort milestones by date
  const sortedMilestones = [...milestones].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // Group milestones by status
  const upcomingMilestones = sortedMilestones.filter(m => m.status === 'upcoming')
  const atRiskMilestones = sortedMilestones.filter(m => m.status === 'at_risk')
  const achievedMilestones = sortedMilestones.filter(m => m.status === 'achieved')
  const missedMilestones = sortedMilestones.filter(m => m.status === 'missed')

  return (
    <div className="h-full overflow-y-auto p-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-gray-500" />
            <span className="text-2xl font-bold">{upcomingMilestones.length}</span>
          </div>
          <p className="text-sm text-gray-400">Upcoming</p>
        </div>

        <div className="bg-orange-500/10 rounded-lg p-4 border border-orange-500/30">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <span className="text-2xl font-bold text-orange-400">{atRiskMilestones.length}</span>
          </div>
          <p className="text-sm text-gray-400">At Risk</p>
        </div>

        <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/30">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-2xl font-bold text-green-400">{achievedMilestones.length}</span>
          </div>
          <p className="text-sm text-gray-400">Achieved</p>
        </div>

        <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/30">
          <div className="flex items-center justify-between mb-2">
            <XCircle className="w-5 h-5 text-red-500" />
            <span className="text-2xl font-bold text-red-400">{missedMilestones.length}</span>
          </div>
          <p className="text-sm text-gray-400">Missed</p>
        </div>
      </div>

      {/* Milestone List */}
      <div className="space-y-4">
        {/* At Risk Milestones (Priority) */}
        {atRiskMilestones.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 text-orange-400">⚠️ At Risk</h3>
            <div className="space-y-3">
              {atRiskMilestones.map(milestone => (
                <MilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  tasks={tasks}
                  getStatusIcon={getStatusIcon}
                  getStatusColor={getStatusColor}
                  getImpactBadge={getImpactBadge}
                  getDaysUntil={getDaysUntil}
                  getRequiredTasksProgress={getRequiredTasksProgress}
                />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Milestones */}
        {upcomingMilestones.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Upcoming Milestones</h3>
            <div className="space-y-3">
              {upcomingMilestones.map(milestone => (
                <MilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  tasks={tasks}
                  getStatusIcon={getStatusIcon}
                  getStatusColor={getStatusColor}
                  getImpactBadge={getImpactBadge}
                  getDaysUntil={getDaysUntil}
                  getRequiredTasksProgress={getRequiredTasksProgress}
                />
              ))}
            </div>
          </div>
        )}

        {/* Achieved Milestones */}
        {achievedMilestones.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 text-green-400">✅ Achieved</h3>
            <div className="space-y-3 opacity-75">
              {achievedMilestones.map(milestone => (
                <MilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  tasks={tasks}
                  getStatusIcon={getStatusIcon}
                  getStatusColor={getStatusColor}
                  getImpactBadge={getImpactBadge}
                  getDaysUntil={getDaysUntil}
                  getRequiredTasksProgress={getRequiredTasksProgress}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Individual Milestone Card
function MilestoneCard({
  milestone,
  tasks,
  getStatusIcon,
  getStatusColor,
  getImpactBadge,
  getDaysUntil,
  getRequiredTasksProgress
}: any) {
  const daysUntil = getDaysUntil(milestone.date)
  const progress = getRequiredTasksProgress(milestone.required_task_ids)

  return (
    <div className={`rounded-lg border p-4 ${getStatusColor(milestone.status)}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          {getStatusIcon(milestone.status)}
          <div>
            <h4 className="font-medium">{milestone.name}</h4>
            <p className="text-sm text-gray-400 mt-1">{milestone.description}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded text-xs ${getImpactBadge(milestone.impact)}`}>
          {milestone.impact}
        </span>
      </div>

      <div className="flex items-center gap-4 text-sm">
        {/* Date */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span>{new Date(milestone.date).toLocaleDateString()}</span>
          {milestone.status === 'upcoming' && (
            <span className={`text-xs ${daysUntil <= 3 ? 'text-red-400' : 'text-gray-500'}`}>
              ({daysUntil} days)
            </span>
          )}
        </div>

        {/* Required Tasks Progress */}
        {milestone.required_task_ids.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-24 h-1.5 bg-gray-700 rounded-full">
              <div
                className="h-full bg-yellow-500 rounded-full"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <span className="text-xs text-gray-500">
              {progress.completed}/{progress.total} tasks
            </span>
          </div>
        )}
      </div>
    </div>
  )
}