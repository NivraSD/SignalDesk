import { useEffect, useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { LIFE_AREAS, type AreaId } from '@/lib/constants'
import { useActivities } from '@/hooks/useActivities'

export default function ActivityBankManager() {
  const { activityBank, loading, loadActivities, seedDefaults, addActivity, removeActivity, getActivitiesByArea } = useActivities()
  const [addingArea, setAddingArea] = useState<AreaId | null>(null)
  const [newName, setNewName] = useState('')

  useEffect(() => { loadActivities() }, [loadActivities])

  async function handleAdd() {
    if (!addingArea || !newName.trim()) return
    await addActivity(addingArea, newName.trim())
    setNewName('')
    setAddingArea(null)
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-6">
      <h1 className="text-2xl font-light text-stone-800 mb-6">Activity Bank</h1>

      {activityBank.length === 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-stone-400 text-sm mb-4">No activities yet. Start with defaults?</p>
          <button onClick={seedDefaults} className="px-6 py-2.5 rounded-xl bg-stone-800 text-white text-sm font-medium">
            Load Default Activities
          </button>
        </div>
      )}

      <div className="space-y-6">
        {LIFE_AREAS.map((area) => {
          const activities = getActivitiesByArea(area.id)
          if (activityBank.length === 0 && !loading) return null
          return (
            <div key={area.id}>
              <div className="flex items-center justify-between mb-2">
                <h2 className={`text-sm font-medium ${area.color}`}>{area.name}</h2>
                <button onClick={() => setAddingArea(addingArea === area.id ? null : area.id)} className="text-stone-400">
                  {addingArea === area.id ? <X size={16} /> : <Plus size={16} />}
                </button>
              </div>

              {addingArea === area.id && (
                <div className="flex gap-2 mb-2">
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Activity name"
                    className="flex-1 px-3 py-2 rounded-lg bg-white border border-stone-200 text-sm focus:outline-none"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  />
                  <button onClick={handleAdd} className="px-3 py-2 rounded-lg bg-stone-800 text-white text-sm">Add</button>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {activities.map((a) => (
                  <div key={a.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs ${area.bgColor} ${area.color}`}>
                    <span>{a.name}</span>
                    <button onClick={() => removeActivity(a.id)} className="opacity-50 hover:opacity-100">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                {activities.length === 0 && (
                  <span className="text-xs text-stone-300">No activities</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
