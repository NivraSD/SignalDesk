import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AREAS } from '@/lib/constants'
import { useActivities } from '@/hooks/useActivities'

export default function ActivityBankManager() {
  const navigate = useNavigate()
  const { activities, activityBank, addActivity, removeActivity } = useActivities()
  const [selectedArea, setSelectedArea] = useState(AREAS[0].id)
  const [newActivity, setNewActivity] = useState('')

  const handleAdd = async () => {
    if (!newActivity.trim()) return
    await addActivity(selectedArea, newActivity.trim())
    setNewActivity('')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/')} className="text-stone-500 text-sm">
          &larr; Back
        </button>
        <h2 className="text-lg font-light text-stone-700">Activity Bank</h2>
        <div className="w-12" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {AREAS.map((area) => (
          <button
            key={area.id}
            onClick={() => setSelectedArea(area.id)}
            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${
              selectedArea === area.id
                ? 'bg-stone-700 text-white'
                : 'bg-stone-100 text-stone-600'
            }`}
          >
            {area.icon} {area.name}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newActivity}
          onChange={(e) => setNewActivity(e.target.value)}
          placeholder="Add activity..."
          className="flex-1 p-2 border border-stone-200 rounded-lg text-sm"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button onClick={handleAdd} className="px-4 py-2 bg-stone-700 text-white rounded-lg text-sm">
          Add
        </button>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {(activityBank[selectedArea] || []).map((activityName, idx) => {
          const dbActivity = activities.find(
            (a) => a.area_id === selectedArea && a.name === activityName
          )
          return (
            <div key={idx} className="flex items-center justify-between p-2 bg-stone-50 rounded-lg">
              <span className="text-sm text-stone-700">{activityName}</span>
              {dbActivity && (
                <button
                  onClick={() => dbActivity.id && removeActivity(dbActivity.id)}
                  className="text-stone-400 text-xs"
                >
                  Remove
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
