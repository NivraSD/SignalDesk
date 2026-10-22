import { useState } from 'react'
import { useAreas } from '@/hooks/useAreas'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useActivities } from '@/hooks/useActivities'

export default function ActivityBankManager() {
  const AREAS = useAreas()
  const navigate = useNavigate()
  const { activities, activityBank, addActivity, removeActivity } = useActivities()
  const [selectedArea, setSelectedArea] = useState(AREAS[0].id)
  const [newActivity, setNewActivity] = useState('')
  const [params] = useSearchParams()
  const firstTime = params.has('first')
  const area = AREAS.find((a) => a.id === selectedArea)
  const yours = activities.filter((a) => a.area_id === selectedArea && !a.is_default).length

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

      {firstTime ? (
        <div className="bg-white rounded-xl p-4 shadow-sm space-y-2">
          <p className="text-sm text-stone-700">Make it yours.</p>
          <p className="text-xs text-stone-500">
            These are starting ideas for each area. Remove what doesn&apos;t fit, and add a few things you actually do —
            those work best when Grounded suggests a plan.
          </p>
          <button onClick={() => navigate('/')} className="text-xs px-3 py-1.5 rounded-full bg-stone-700 text-white">
            Done for now
          </button>
        </div>
      ) : (
        <p className="text-xs text-stone-400 text-center">
          The things you do for each area. Grounded suggests from this list when you plan.
        </p>
      )}

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
          placeholder={`Add your own for ${area?.name ?? 'this area'}…`}
          aria-label={`Add your own activity for ${area?.name ?? 'this area'}`}
          className="flex-1 p-2 border border-stone-200 rounded-lg text-sm"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button onClick={handleAdd} className="px-4 py-2 bg-stone-700 text-white rounded-lg text-sm">
          Add
        </button>
      </div>

      {yours === 0 && (activityBank[selectedArea] || []).length > 0 && (
        <p className="text-xs text-amber-700">Nothing of your own here yet. Add one thing you actually do.</p>
      )}

      <div className="space-y-2">
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
