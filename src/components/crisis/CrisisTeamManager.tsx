'use client'

import React, { useState } from 'react'
import { Users, CheckCircle, Circle, Plus, Edit2, Trash2, UserCheck, UserX, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface CrisisTeamManagerProps {
  crisis: any
  onUpdate: () => void
}

export default function CrisisTeamManager({ crisis, onUpdate }: CrisisTeamManagerProps) {
  const [newTask, setNewTask] = useState({ title: '', assignee: '', priority: 'medium' })
  const [showAddTask, setShowAddTask] = useState(false)

  const teamStatus = crisis.team_status || {}
  const tasks = crisis.tasks || []

  const addTask = async () => {
    if (!newTask.title) return

    const updatedTasks = [
      ...tasks,
      {
        id: Date.now(),
        ...newTask,
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    ]

    const { error } = await supabase
      .from('crisis_events')
      .update({ tasks: updatedTasks })
      .eq('id', crisis.id)

    if (!error) {
      setNewTask({ title: '', assignee: '', priority: 'medium' })
      setShowAddTask(false)
      onUpdate()
    }
  }

  const updateTaskStatus = async (taskId: number, status: string) => {
    const updatedTasks = tasks.map((t: any) =>
      t.id === taskId ? { ...t, status, completedAt: status === 'completed' ? new Date().toISOString() : null } : t
    )

    const { error } = await supabase
      .from('crisis_events')
      .update({ tasks: updatedTasks })
      .eq('id', crisis.id)

    if (!error) onUpdate()
  }

  const deleteTask = async (taskId: number) => {
    const updatedTasks = tasks.filter((t: any) => t.id !== taskId)

    const { error } = await supabase
      .from('crisis_events')
      .update({ tasks: updatedTasks })
      .eq('id', crisis.id)

    if (!error) onUpdate()
  }

  const updateTeamMemberStatus = async (memberId: string, status: string, notified: boolean) => {
    const updatedTeamStatus = {
      ...teamStatus,
      [memberId]: { ...teamStatus[memberId], status, notified }
    }

    const { error } = await supabase
      .from('crisis_events')
      .update({ team_status: updatedTeamStatus })
      .eq('id', crisis.id)

    if (!error) onUpdate()
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-500 bg-red-500/10 border-red-500'
      case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500'
      case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500'
      case 'low': return 'text-blue-500 bg-blue-500/10 border-blue-500'
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500'
    }
  }

  return (
    <div className="h-full p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Team Status */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Users className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-bold text-white">Crisis Team Status</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(teamStatus).map(([memberId, member]: [string, any]) => (
              <div key={memberId} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold text-white">{member.name || member.role}</div>
                    <div className="text-sm text-gray-400">{member.role}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.notified ? (
                      <UserCheck className="w-4 h-4 text-green-400" />
                    ) : (
                      <UserX className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => updateTeamMemberStatus(memberId, 'active', true)}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                      member.status === 'active'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => updateTeamMemberStatus(memberId, 'pending', member.notified)}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                      member.status === 'pending'
                        ? 'bg-yellow-500 text-black'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => updateTeamMemberStatus(memberId, 'unavailable', member.notified)}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                      member.status === 'unavailable'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    Unavailable
                  </button>
                </div>
              </div>
            ))}
          </div>

          {Object.keys(teamStatus).length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No team members assigned</p>
              <p className="text-xs mt-1">Generate a crisis plan to define your team</p>
            </div>
          )}
        </div>

        {/* Tasks */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Crisis Tasks</h2>
            <button
              onClick={() => setShowAddTask(!showAddTask)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          </div>

          {showAddTask && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4">
              <div className="space-y-3">
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Task description"
                  className="w-full bg-gray-900 text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={newTask.assignee}
                    onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                    placeholder="Assignee"
                    className="bg-gray-900 text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="bg-gray-900 text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="critical">Critical Priority</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={addTask}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
                  >
                    Add Task
                  </button>
                  <button
                    onClick={() => {
                      setShowAddTask(false)
                      setNewTask({ title: '', assignee: '', priority: 'medium' })
                    }}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {tasks.map((task: any) => (
              <div
                key={task.id}
                className={`bg-gray-800 border rounded-lg p-4 ${
                  task.status === 'completed' ? 'border-green-500/30' : 'border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <button
                      onClick={() =>
                        updateTaskStatus(task.id, task.status === 'completed' ? 'pending' : 'completed')
                      }
                      className="mt-1"
                    >
                      {task.status === 'completed' ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-500" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className={`font-medium ${task.status === 'completed' ? 'text-gray-500 line-through' : 'text-white'}`}>
                        {task.title}
                      </div>
                      {task.assignee && (
                        <div className="text-sm text-gray-400 mt-1">Assigned to: {task.assignee}</div>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-1 rounded border ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(task.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {tasks.length === 0 && !showAddTask && (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No tasks yet</p>
              <p className="text-xs mt-1">Click "Add Task" to create action items</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
