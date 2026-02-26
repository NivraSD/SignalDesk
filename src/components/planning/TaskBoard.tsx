'use client'

import React, { useState } from 'react'
import {
  Clock,
  AlertCircle,
  CheckCircle,
  User,
  Calendar,
  ChevronRight,
  MoreVertical,
  Play,
  Pause,
  Check,
  X,
  MessageSquare
} from 'lucide-react'
import type { Task, TaskStatus, Priority } from '@/types/strategic-planning'

interface TaskBoardProps {
  tasks: Task[]
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void
}

export function TaskBoard({ tasks, onStatusChange }: TaskBoardProps) {
  const [draggedTask, setDraggedTask] = useState<string | null>(null)
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())

  const columns: { id: TaskStatus; label: string; color: string }[] = [
    { id: 'todo', label: 'To Do', color: 'gray' },
    { id: 'in_progress', label: 'In Progress', color: 'yellow' },
    { id: 'review', label: 'Review', color: 'blue' },
    { id: 'done', label: 'Done', color: 'green' },
    { id: 'blocked', label: 'Blocked', color: 'red' }
  ]

  const handleDragStart = (taskId: string) => {
    setDraggedTask(taskId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault()
    if (draggedTask) {
      onStatusChange(draggedTask, status)
      setDraggedTask(null)
    }
  }

  const toggleTaskExpanded = (taskId: string) => {
    const newExpanded = new Set(expandedTasks)
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId)
    } else {
      newExpanded.add(taskId)
    }
    setExpandedTasks(newExpanded)
  }

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status)
  }

  return (
    <div className="h-full flex gap-4 p-4 overflow-x-auto">
      {columns.map(column => (
        <div
          key={column.id}
          className="flex-shrink-0 w-80"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, column.id)}
        >
          {/* Column Header */}
          <div className={`mb-3 pb-2 border-b border-gray-800`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full bg-${column.color}-500`} />
                <h3 className="font-medium">{column.label}</h3>
                <span className="text-xs text-gray-500">
                  {getTasksByStatus(column.id).length}
                </span>
              </div>
              <button className="p-1 hover:bg-gray-800 rounded">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tasks */}
          <div className="space-y-2">
            {getTasksByStatus(column.id).map(task => (
              <TaskCard
                key={task.id}
                task={task}
                isExpanded={expandedTasks.has(task.id)}
                onToggleExpand={() => toggleTaskExpanded(task.id)}
                onDragStart={() => handleDragStart(task.id)}
                onStatusChange={onStatusChange}
              />
            ))}
          </div>

          {/* Add Task Button */}
          <button className="w-full mt-3 py-2 border border-dashed border-gray-700 rounded-lg
                           text-sm text-gray-500 hover:border-gray-600 hover:text-gray-400 transition-colors">
            + Add Task
          </button>
        </div>
      ))}
    </div>
  )
}

// Individual Task Card
function TaskCard({
  task,
  isExpanded,
  onToggleExpand,
  onDragStart,
  onStatusChange
}: {
  task: Task
  isExpanded: boolean
  onToggleExpand: () => void
  onDragStart: () => void
  onStatusChange: (taskId: string, status: TaskStatus) => void
}) {
  const priorityColors = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-gray-500'
  }

  const typeIcons = {
    content_creation: '✍️',
    media_outreach: '📢',
    analysis: '📊',
    coordination: '🤝',
    review: '👁️',
    approval: '✅',
    publication: '🚀'
  }

  const getQuickActions = () => {
    switch (task.status) {
      case 'todo':
        return (
          <button
            onClick={() => onStatusChange(task.id, 'in_progress')}
            className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded"
            title="Start Task"
          >
            <Play className="w-3 h-3" />
          </button>
        )
      case 'in_progress':
        return (
          <>
            <button
              onClick={() => onStatusChange(task.id, 'review')}
              className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded"
              title="Move to Review"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => onStatusChange(task.id, 'blocked')}
              className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded"
              title="Mark as Blocked"
            >
              <Pause className="w-3 h-3" />
            </button>
          </>
        )
      case 'review':
        return (
          <button
            onClick={() => onStatusChange(task.id, 'done')}
            className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded"
            title="Complete Task"
          >
            <Check className="w-3 h-3" />
          </button>
        )
      case 'blocked':
        return (
          <button
            onClick={() => onStatusChange(task.id, 'in_progress')}
            className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded"
            title="Unblock Task"
          >
            <Play className="w-3 h-3" />
          </button>
        )
      default:
        return null
    }
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="bg-gray-800/50 hover:bg-gray-800 rounded-lg p-3 cursor-move transition-all"
    >
      {/* Task Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{typeIcons[task.type]}</span>
          <div className={`w-1 h-4 rounded-full ${priorityColors[task.priority]}`} />
        </div>
        <button
          onClick={onToggleExpand}
          className="p-1 hover:bg-gray-700 rounded"
        >
          <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        </button>
      </div>

      {/* Task Title */}
      <h4 className="font-medium text-sm mb-2 line-clamp-2">{task.title}</h4>

      {/* Task Meta */}
      <div className="flex items-center gap-3 text-xs text-gray-500">
        {task.due_date && (
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(task.due_date).toLocaleDateString()}
          </div>
        )}
        {task.estimated_hours && (
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {task.estimated_hours}h
          </div>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          {task.description && (
            <p className="text-xs text-gray-400 mb-2">{task.description}</p>
          )}

          {/* Progress Bar */}
          {task.progress > 0 && (
            <div className="mb-2">
              <div className="flex justify-between text-xs mb-1">
                <span>Progress</span>
                <span>{task.progress}%</span>
              </div>
              <div className="h-1 bg-gray-700 rounded-full">
                <div
                  className="h-full bg-yellow-500 rounded-full"
                  style={{ width: `${task.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Dependencies */}
          {task.dependencies.length > 0 && (
            <div className="text-xs text-gray-500 mb-2">
              <span className="text-orange-400">⚠️</span> Depends on {task.dependencies.length} task(s)
            </div>
          )}

          {/* Workflow Trigger */}
          {task.workflow_trigger && (
            <div className="text-xs bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded mb-2">
              🚀 Triggers: {task.workflow_trigger}
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex gap-2 mt-3">
            {getQuickActions()}
          </div>
        </div>
      )}

      {/* Task Indicators */}
      <div className="flex items-center gap-2 mt-2">
        {task.dependencies.length > 0 && (
          <div className="text-xs text-orange-400">
            <AlertCircle className="w-3 h-3" />
          </div>
        )}
        {task.workflow_trigger && (
          <div className="text-xs text-yellow-400">⚡</div>
        )}
        {task.notes && (
          <div className="text-xs text-blue-400">
            <MessageSquare className="w-3 h-3" />
          </div>
        )}
      </div>
    </div>
  )
}