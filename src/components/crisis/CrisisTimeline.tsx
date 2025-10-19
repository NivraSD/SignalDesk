'use client'

import React, { useState } from 'react'
import { Clock, Plus, Activity, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface CrisisTimelineProps {
  crisis: any
  onUpdate: () => void
}

export default function CrisisTimeline({ crisis, onUpdate }: CrisisTimelineProps) {
  const [showAddEntry, setShowAddEntry] = useState(false)
  const [newEntry, setNewEntry] = useState({ type: 'event', content: '', actor: '' })

  const addTimelineEntry = async () => {
    if (!newEntry.content.trim()) return

    const updatedTimeline = [
      ...(crisis.timeline || []),
      {
        time: new Date().toISOString(),
        type: newEntry.type,
        content: newEntry.content,
        actor: newEntry.actor || 'System'
      }
    ]

    await supabase
      .from('crisis_events')
      .update({ timeline: updatedTimeline })
      .eq('id', crisis.id)

    setNewEntry({ type: 'event', content: '', actor: '' })
    setShowAddEntry(false)
    onUpdate()
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'decision': return CheckCircle2
      case 'communication': return MessageSquare
      case 'ai_interaction': return Activity
      case 'alert': return AlertCircle
      default: return Clock
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'decision': return 'text-green-400'
      case 'communication': return 'text-blue-400'
      case 'ai_interaction': return 'text-purple-400'
      case 'alert': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <div className="h-full p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Crisis Timeline</h2>
          <button
            onClick={() => setShowAddEntry(!showAddEntry)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Entry</span>
          </button>
        </div>

        {/* Add Entry Form */}
        {showAddEntry && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-bold text-white mb-4">Add Timeline Entry</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Type</label>
                <select
                  value={newEntry.type}
                  onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value })}
                  className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg"
                >
                  <option value="event">Event</option>
                  <option value="decision">Decision</option>
                  <option value="communication">Communication</option>
                  <option value="alert">Alert</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Content</label>
                <textarea
                  value={newEntry.content}
                  onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                  className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg h-24"
                  placeholder="Describe what happened..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Actor (optional)</label>
                <input
                  type="text"
                  value={newEntry.actor}
                  onChange={(e) => setNewEntry({ ...newEntry, actor: e.target.value })}
                  className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg"
                  placeholder="Who took this action?"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddEntry(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addTimelineEntry}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                >
                  Add Entry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-800" />

          {/* Timeline Events */}
          <div className="space-y-6">
            {crisis.timeline && crisis.timeline.length > 0 ? (
              crisis.timeline.slice().reverse().map((event: any, idx: number) => {
                const Icon = getEventIcon(event.type)
                const color = getEventColor(event.type)

                return (
                  <div key={idx} className="relative flex items-start space-x-4">
                    {/* Icon */}
                    <div className={`relative z-10 w-10 h-10 rounded-full bg-gray-900 border-2 border-gray-800 flex items-center justify-center ${color}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 bg-gray-900 border border-gray-800 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className={`text-xs font-semibold uppercase ${color}`}>
                            {event.type.replace('_', ' ')}
                          </span>
                          <div className="text-sm text-gray-500 mt-1">
                            {new Date(event.time).toLocaleString()} • {event.actor}
                          </div>
                        </div>
                      </div>
                      <div className="text-gray-300">{event.content}</div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-12 text-gray-500">
                No timeline entries yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
