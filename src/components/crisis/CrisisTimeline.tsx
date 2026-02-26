'use client'

import React, { useState } from 'react'
import { Clock, Plus, Activity, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface CrisisTimelineProps {
  crisis: any | null
  onUpdate: () => void
}

export default function CrisisTimeline({ crisis, onUpdate }: CrisisTimelineProps) {
  const [showAddEntry, setShowAddEntry] = useState(false)
  const [newEntry, setNewEntry] = useState({ type: 'event', content: '', actor: '' })

  // Handle null crisis
  const timeline = crisis?.timeline || []

  const addTimelineEntry = async () => {
    if (!newEntry.content.trim() || !crisis) return

    const updatedTimeline = [
      ...timeline,
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
      case 'decision': return 'text-emerald-400'
      case 'communication': return 'text-[var(--burnt-orange)]'
      case 'ai_interaction': return 'text-amber-400'
      case 'alert': return 'text-red-400'
      default: return 'text-[var(--grey-400)]'
    }
  }

  return (
    <div className="h-full p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>Crisis Timeline</h2>
          <button
            onClick={() => setShowAddEntry(!showAddEntry)}
            className="px-4 py-2 bg-[var(--burnt-orange)] hover:brightness-110 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Entry</span>
          </button>
        </div>

        {/* Add Entry Form */}
        {showAddEntry && (
          <div className="bg-[var(--charcoal)] border border-zinc-800 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'var(--font-display)' }}>Add Timeline Entry</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--grey-400)] mb-2">Type</label>
                <select
                  value={newEntry.type}
                  onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value })}
                  className="w-full bg-zinc-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)]"
                >
                  <option value="event">Event</option>
                  <option value="decision">Decision</option>
                  <option value="communication">Communication</option>
                  <option value="alert">Alert</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--grey-400)] mb-2">Content</label>
                <textarea
                  value={newEntry.content}
                  onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                  className="w-full bg-zinc-800 text-white px-4 py-2 rounded-lg h-24 focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)]"
                  placeholder="Describe what happened..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--grey-400)] mb-2">Actor (optional)</label>
                <input
                  type="text"
                  value={newEntry.actor}
                  onChange={(e) => setNewEntry({ ...newEntry, actor: e.target.value })}
                  className="w-full bg-zinc-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)]"
                  placeholder="Who took this action?"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddEntry(false)}
                  className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addTimelineEntry}
                  className="px-4 py-2 bg-[var(--burnt-orange)] hover:brightness-110 text-white rounded-lg transition-colors"
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
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-zinc-700" />

          {/* Timeline Events */}
          <div className="space-y-6">
            {timeline.length > 0 ? (
              timeline.slice().reverse().map((event: any, idx: number) => {
                const Icon = getEventIcon(event.type)
                const color = getEventColor(event.type)

                return (
                  <div key={idx} className="relative flex items-start space-x-4">
                    {/* Icon */}
                    <div className={`relative z-10 w-10 h-10 rounded-full bg-[var(--charcoal)] border-2 border-zinc-700 flex items-center justify-center ${color}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 bg-[var(--charcoal)] border border-zinc-800 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className={`text-xs font-semibold uppercase ${color}`}>
                            {(event.type || 'event').replace('_', ' ')}
                          </span>
                          <div className="text-sm text-[var(--grey-500)] mt-1">
                            {event.time ? new Date(event.time).toLocaleString() : 'Unknown time'} • {event.actor || 'System'}
                          </div>
                        </div>
                      </div>
                      <div className="text-[var(--grey-300)]">{event.content || 'No content'}</div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-12 text-[var(--grey-500)]">
                No timeline entries yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
