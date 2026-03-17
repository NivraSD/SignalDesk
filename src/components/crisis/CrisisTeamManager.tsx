'use client'

import React, { useState } from 'react'
import { Users, CheckCircle, Circle, Plus, Edit2, Trash2, UserCheck, UserX, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface CrisisTeamManagerProps {
  crisis: any | null
  onUpdate: () => void
}

const PRESET_ROLES = [
  {
    role: 'Crisis Response Leader',
    title: 'Chief Executive Officer or designated senior executive',
    responsibilities: [
      'Overall crisis response authority and decision-making',
      'External stakeholder communications approval',
      'Resource allocation and strategic direction'
    ]
  },
  {
    role: 'Communications Director',
    title: 'Head of Communications/PR or senior communications executive',
    responsibilities: [
      'Develop and implement communication strategies',
      'Media relations and press release coordination',
      'Message consistency across all channels'
    ]
  },
  {
    role: 'Operations Manager',
    title: 'Chief Operating Officer or senior operations executive',
    responsibilities: [
      'Operational impact assessment and mitigation',
      'Business continuity plan activation',
      'Internal coordination and resource management'
    ]
  },
  {
    role: 'Legal Counsel',
    title: 'General Counsel or external legal advisor',
    responsibilities: [
      'Legal risk assessment and regulatory compliance',
      'Review all external communications for liability',
      'Coordinate with regulators and enforcement agencies'
    ]
  },
  {
    role: 'Government Affairs Lead',
    title: 'Head of Government Relations or Policy',
    responsibilities: [
      'Engage relevant government officials and regulators',
      'Monitor and brief on legislative/regulatory response',
      'Coordinate with industry associations and coalitions'
    ]
  },
  {
    role: 'Stakeholder Relations Lead',
    title: 'Head of Investor Relations or Stakeholder Engagement',
    responsibilities: [
      'Manage investor, board, and partner communications',
      'Monitor stakeholder sentiment and concerns',
      'Coordinate briefings for key external stakeholders'
    ]
  },
]

export default function CrisisTeamManager({ crisis, onUpdate }: CrisisTeamManagerProps) {
  const [newTask, setNewTask] = useState({ title: '', assignee: '', priority: 'medium' })
  const [showAddTask, setShowAddTask] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)

  // Handle null crisis
  const teamStatus = crisis?.team_status || {}
  const tasks = crisis?.tasks || []

  const addTask = async () => {
    if (!newTask.title || !crisis) return

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
    if (!crisis) return
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
    if (!crisis) return
    const updatedTasks = tasks.filter((t: any) => t.id !== taskId)

    const { error } = await supabase
      .from('crisis_events')
      .update({ tasks: updatedTasks })
      .eq('id', crisis.id)

    if (!error) onUpdate()
  }

  const addTeamMember = async (preset: typeof PRESET_ROLES[0], memberName?: string) => {
    if (!crisis) return
    const memberId = `member-${Date.now()}`
    const updatedTeamStatus = {
      ...teamStatus,
      [memberId]: {
        name: memberName || '',
        role: preset.role,
        title: preset.title,
        status: 'pending',
        notified: false,
        responsibilities: preset.responsibilities
      }
    }

    // Also create tasks from the new member's responsibilities
    const now = Date.now()
    const newTasks = preset.responsibilities.map((resp, idx) => ({
      id: now + idx,
      title: resp,
      assignee: preset.role,
      priority: 'high' as string,
      status: 'pending',
      createdAt: new Date().toISOString(),
      source: 'responsibility'
    }))

    const { error } = await supabase
      .from('crisis_events')
      .update({
        team_status: updatedTeamStatus,
        tasks: [...tasks, ...newTasks]
      })
      .eq('id', crisis.id)

    if (!error) {
      setShowAddMember(false)
      onUpdate()
    }
  }

  const updateTeamMemberStatus = async (memberId: string, status: string, notified: boolean) => {
    if (!crisis) return
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
      case 'high': return 'text-[var(--burnt-orange)] bg-[var(--burnt-orange)]/10 border-[var(--burnt-orange)]'
      case 'medium': return 'text-amber-500 bg-amber-500/10 border-amber-500'
      case 'low': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500'
      default: return 'text-[var(--grey-500)] bg-[var(--grey-500)]/10 border-[var(--grey-500)]'
    }
  }

  return (
    <div className="h-full p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Team Status */}
        <div className="bg-[var(--charcoal)] border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Users className="w-6 h-6 text-[var(--burnt-orange)]" />
              <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>Crisis Team Status</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(teamStatus).map(([memberId, member]: [string, any]) => (
              <div key={memberId} className="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold text-white">{member.name || member.role}</div>
                    <div className="text-sm text-[var(--grey-400)]">{member.name ? member.role : ''}</div>
                    {member.title && <div className="text-xs text-[var(--grey-500)]">{member.title}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    {member.notified ? (
                      <UserCheck className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <UserX className="w-4 h-4 text-[var(--grey-500)]" />
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => updateTeamMemberStatus(memberId, 'active', true)}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                      member.status === 'active'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-zinc-700 text-[var(--grey-400)] hover:bg-zinc-600'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => updateTeamMemberStatus(memberId, 'pending', member.notified)}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                      member.status === 'pending'
                        ? 'bg-amber-500 text-black'
                        : 'bg-zinc-700 text-[var(--grey-400)] hover:bg-zinc-600'
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => updateTeamMemberStatus(memberId, 'unavailable', member.notified)}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                      member.status === 'unavailable'
                        ? 'bg-red-500 text-white'
                        : 'bg-zinc-700 text-[var(--grey-400)] hover:bg-zinc-600'
                    }`}
                  >
                    Unavailable
                  </button>
                </div>
              </div>
            ))}
          </div>

          {Object.keys(teamStatus).length === 0 && (
            <div className="text-center py-8 text-[var(--grey-500)]">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No team members assigned</p>
              <p className="text-xs mt-1">Add team members below or generate a crisis plan to define your team</p>
            </div>
          )}

          {/* Add Team Member */}
          {showAddMember ? (
            <div className="mt-4 bg-zinc-800 border border-zinc-700 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-white" style={{ fontFamily: 'var(--font-display)' }}>Add Team Member</h4>
                <button
                  onClick={() => setShowAddMember(false)}
                  className="text-[var(--grey-500)] hover:text-white text-xs"
                >
                  Cancel
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {PRESET_ROLES
                  .filter(preset => !Object.values(teamStatus).some((m: any) => m.role === preset.role))
                  .map(preset => (
                  <button
                    key={preset.role}
                    onClick={() => addTeamMember(preset)}
                    className="text-left p-3 rounded-lg border border-zinc-700 hover:border-[var(--burnt-orange)] hover:bg-[var(--burnt-orange)]/5 transition-all group"
                  >
                    <div className="text-sm font-medium text-white group-hover:text-[var(--burnt-orange)]">{preset.role}</div>
                    <div className="text-xs text-[var(--grey-500)] mt-0.5">{preset.title}</div>
                    <div className="text-xs text-[var(--grey-600)] mt-1">{preset.responsibilities.length} tasks will be auto-created</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddMember(true)}
              className="mt-4 w-full py-3 border-2 border-dashed border-zinc-700 hover:border-[var(--burnt-orange)] rounded-xl text-[var(--grey-400)] hover:text-[var(--burnt-orange)] transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" /> Add Team Member
            </button>
          )}
        </div>

        {/* Tasks */}
        <div className="bg-[var(--charcoal)] border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>Crisis Tasks</h2>
            <button
              onClick={() => setShowAddTask(!showAddTask)}
              className="px-4 py-2 bg-[var(--burnt-orange)] hover:brightness-110 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          </div>

          {showAddTask && (
            <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 mb-4">
              <div className="space-y-3">
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Task description"
                  className="w-full bg-zinc-900 text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)]"
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={newTask.assignee}
                    onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                    className="bg-zinc-900 text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)]"
                  >
                    <option value="">Select Assignee</option>
                    {Object.entries(teamStatus).map(([memberId, member]: [string, any]) => (
                      <option key={memberId} value={member.role || member.name}>
                        {member.name ? `${member.name} (${member.role})` : member.role}
                      </option>
                    ))}
                    <option value="Unassigned">Unassigned</option>
                  </select>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="bg-zinc-900 text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)]"
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
                    className="px-4 py-2 bg-[var(--burnt-orange)] hover:brightness-110 text-white rounded transition-colors"
                  >
                    Add Task
                  </button>
                  <button
                    onClick={() => {
                      setShowAddTask(false)
                      setNewTask({ title: '', assignee: '', priority: 'medium' })
                    }}
                    className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded transition-colors"
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
                className={`bg-zinc-800 border rounded-lg p-4 ${
                  task.status === 'completed' ? 'border-emerald-500/30' : 'border-zinc-700'
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
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-[var(--grey-500)]" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className={`font-medium ${task.status === 'completed' ? 'text-[var(--grey-500)] line-through' : 'text-white'}`}>
                        {task.title}
                      </div>
                      {task.assignee && (
                        <div className="text-sm text-[var(--grey-400)] mt-1">Assigned to: {task.assignee}</div>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-1 rounded border ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span className="text-xs text-[var(--grey-500)] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(task.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-[var(--grey-500)] hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {tasks.length === 0 && !showAddTask && (
            <div className="text-center py-8 text-[var(--grey-500)]">
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
