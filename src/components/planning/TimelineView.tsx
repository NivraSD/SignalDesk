'use client'

import React from 'react'
import { Calendar, Clock, Flag, AlertTriangle } from 'lucide-react'
import type { StrategicPlan, Task, Phase, TaskStatus } from '@/types/strategic-planning'

interface TimelineViewProps {
  plan: StrategicPlan
  onTaskUpdate?: (taskId: string, status: TaskStatus) => void
}

export function TimelineView({ plan, onTaskUpdate }: TimelineViewProps) {
  const startDate = new Date(plan.timeline.start_date)
  const endDate = new Date(plan.timeline.end_date)
  const totalDays = plan.timeline.duration_days
  const today = new Date()

  // Calculate today's position on timeline
  const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const todayPosition = (daysSinceStart / totalDays) * 100

  // Generate date headers
  const generateDateHeaders = () => {
    const headers = []
    const weeks = Math.ceil(totalDays / 7)

    for (let i = 0; i < weeks; i++) {
      const weekStart = new Date(startDate.getTime() + (i * 7 * 24 * 60 * 60 * 1000))
      headers.push({
        week: i + 1,
        label: weekStart.toLocaleDateString('en', { month: 'short', day: 'numeric' })
      })
    }
    return headers
  }

  const getTaskPosition = (task: Task) => {
    if (!task.scheduled_date) return { left: 0, width: 10 }

    const taskStart = new Date(task.scheduled_date)
    const taskEnd = new Date(task.due_date)

    const startDays = Math.floor((taskStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const duration = Math.floor((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)) + 1

    return {
      left: (startDays / totalDays) * 100,
      width: (duration / totalDays) * 100
    }
  }

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'done': return 'bg-green-500'
      case 'in_progress': return 'bg-yellow-500'
      case 'review': return 'bg-blue-500'
      case 'blocked': return 'bg-red-500'
      default: return 'bg-gray-600'
    }
  }

  const dateHeaders = generateDateHeaders()

  return (
    <div className="h-full flex flex-col p-4">
      {/* Timeline Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Campaign Timeline</h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span>{startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span>{totalDays} days</span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-600 rounded" />
            <span>To Do</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded" />
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded" />
            <span>Review</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded" />
            <span>Done</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded" />
            <span>Blocked</span>
          </div>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Date Headers */}
          <div className="flex border-b border-gray-700 pb-2 mb-4">
            {dateHeaders.map((header, index) => (
              <div
                key={index}
                className="flex-1 text-xs text-gray-500"
                style={{ minWidth: `${100 / dateHeaders.length}%` }}
              >
                Week {header.week}
                <div className="text-gray-400">{header.label}</div>
              </div>
            ))}
          </div>

          {/* Phases */}
          {plan.phases.map((phase, phaseIndex) => (
            <div key={phase.id} className="mb-6">
              {/* Phase Header */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: phase.color || '#6b7280' }}
                />
                <h4 className="font-medium">{phase.name}</h4>
                <span className="text-xs text-gray-500">
                  {phase.task_ids.length} tasks
                </span>
                <span className={`text-xs px-2 py-1 rounded ${
                  phase.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                  phase.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-gray-700 text-gray-400'
                }`}>
                  {phase.status.replace('_', ' ')}
                </span>
              </div>

              {/* Phase Timeline Bar */}
              <div className="relative h-2 bg-gray-800 rounded-full mb-2">
                <div
                  className="absolute h-full rounded-full opacity-30"
                  style={{
                    backgroundColor: phase.color || '#6b7280',
                    left: `${(Math.floor((new Date(phase.start_date).getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) / totalDays) * 100}%`,
                    width: `${(Math.floor((new Date(phase.end_date).getTime() - new Date(phase.start_date).getTime()) / (1000 * 60 * 60 * 24)) / totalDays) * 100}%`
                  }}
                />
              </div>

              {/* Tasks in Phase */}
              <div className="space-y-2 ml-7">
                {plan.tasks
                  .filter(task => task.phase_id === phase.id)
                  .map(task => {
                    const position = getTaskPosition(task)
                    return (
                      <div key={task.id} className="relative h-8">
                        {/* Task Bar */}
                        <div
                          className={`absolute h-full rounded cursor-pointer hover:opacity-80 transition-opacity
                                     flex items-center px-2 text-xs text-white overflow-hidden ${getStatusColor(task.status)}`}
                          style={{
                            left: `${position.left}%`,
                            width: `${position.width}%`,
                            minWidth: '100px'
                          }}
                          onClick={() => onTaskUpdate && onTaskUpdate(task.id,
                            task.status === 'todo' ? 'in_progress' :
                            task.status === 'in_progress' ? 'review' :
                            task.status === 'review' ? 'done' : 'todo'
                          )}
                        >
                          <span className="truncate">{task.title}</span>
                        </div>

                        {/* Dependencies Indicator */}
                        {task.dependencies.length > 0 && (
                          <div
                            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-orange-500 rounded-full
                                     flex items-center justify-center text-xs text-white"
                            style={{ left: `${position.left}%`, marginLeft: '-8px' }}
                          >
                            !
                          </div>
                        )}
                      </div>
                    )
                  })}
              </div>
            </div>
          ))}

          {/* Milestones */}
          <div className="mt-6 pt-4 border-t border-gray-700">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Flag className="w-4 h-4" />
              Milestones
            </h4>
            <div className="relative h-12">
              {plan.milestones.map(milestone => {
                const position = (Math.floor((new Date(milestone.date).getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) / totalDays) * 100

                return (
                  <div
                    key={milestone.id}
                    className="absolute flex flex-col items-center"
                    style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
                  >
                    <div className={`w-3 h-3 rounded-full ${
                      milestone.status === 'achieved' ? 'bg-green-500' :
                      milestone.status === 'missed' ? 'bg-red-500' :
                      milestone.status === 'at_risk' ? 'bg-orange-500' :
                      'bg-gray-500'
                    }`} />
                    <div className="mt-1 text-xs whitespace-nowrap">
                      {milestone.name}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Today Marker */}
          {todayPosition >= 0 && todayPosition <= 100 && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500"
              style={{ left: `${todayPosition}%` }}
            >
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs text-red-500 whitespace-nowrap">
                Today
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}