import { useEffect, useState } from 'react'
import { Plus, CheckCircle2, Circle, Trash2, X, Lightbulb, ListTodo, CalendarDays } from 'lucide-react'
import { useJournal } from '@/hooks/useJournal'
import { formatDate } from '@/lib/utils'
import type { JournalEntry } from '@/types'

const TYPE_CONFIG = {
  thought: { icon: Lightbulb, label: 'Thought', color: 'text-purple-500', bg: 'bg-purple-50' },
  task: { icon: ListTodo, label: 'Task', color: 'text-blue-500', bg: 'bg-blue-50' },
  event: { icon: CalendarDays, label: 'Event', color: 'text-green-500', bg: 'bg-green-50' },
}

export default function JournalPage() {
  const { entries, loading, loadEntries, createEntry, toggleComplete, deleteEntry } = useJournal()
  const [showCreate, setShowCreate] = useState(false)
  const [newType, setNewType] = useState<JournalEntry['entry_type']>('thought')
  const [newContent, setNewContent] = useState('')

  useEffect(() => { loadEntries() }, [loadEntries])

  async function handleCreate() {
    if (!newContent.trim()) return
    await createEntry({ entry_type: newType, content: newContent.trim() })
    setNewContent('')
    setShowCreate(false)
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-light text-stone-800">Journal</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="p-2 rounded-full bg-stone-800 text-white"
        >
          {showCreate ? <X size={18} /> : <Plus size={18} />}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-white rounded-2xl p-4 border border-stone-200 mb-4 space-y-3">
          <div className="flex gap-2">
            {(['thought', 'task', 'event'] as const).map((t) => {
              const cfg = TYPE_CONFIG[t]
              return (
                <button
                  key={t}
                  onClick={() => setNewType(t)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                    newType === t ? `${cfg.bg} ${cfg.color}` : 'bg-stone-50 text-stone-400'
                  }`}
                >
                  {cfg.label}
                </button>
              )
            })}
          </div>
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Write something..."
            rows={3}
            className="w-full p-3 rounded-xl bg-stone-50 text-sm text-stone-700 placeholder:text-stone-300 focus:outline-none resize-none"
            autoFocus
          />
          <button
            onClick={handleCreate}
            disabled={!newContent.trim()}
            className="w-full py-2.5 rounded-xl bg-stone-800 text-white text-sm font-medium disabled:opacity-30"
          >
            Add {TYPE_CONFIG[newType].label}
          </button>
        </div>
      )}

      {/* Entries list */}
      {loading ? (
        <div className="text-center text-stone-400 text-sm py-10">Loading...</div>
      ) : entries.length === 0 ? (
        <div className="text-center text-stone-400 text-sm py-10">
          No journal entries yet. Tap + to create one.
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => {
            const cfg = TYPE_CONFIG[entry.entry_type]
            const Icon = cfg.icon
            return (
              <div key={entry.id} className="bg-white rounded-xl p-4 border border-stone-200">
                <div className="flex items-start gap-3">
                  {entry.entry_type === 'task' ? (
                    <button onClick={() => toggleComplete(entry.id, !entry.completed)} className="mt-0.5">
                      {entry.completed
                        ? <CheckCircle2 size={18} className="text-green-500" />
                        : <Circle size={18} className="text-stone-300" />}
                    </button>
                  ) : (
                    <Icon size={18} className={`${cfg.color} mt-0.5 shrink-0`} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm text-stone-700 ${entry.completed ? 'line-through text-stone-400' : ''}`}>
                      {entry.content}
                    </p>
                    <span className="text-[10px] text-stone-400 mt-1 block">{formatDate(entry.created_at)}</span>
                  </div>
                  <button onClick={() => deleteEntry(entry.id)} className="text-stone-300 hover:text-red-400 shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
