import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CheckIn, Activity } from '@/types'

interface GroundedState {
  userId: string | null
  todayCheckIn: CheckIn | null
  activityBank: Activity[]
  setUserId: (id: string | null) => void
  setTodayCheckIn: (c: CheckIn | null) => void
  setActivityBank: (a: Activity[]) => void
}

export const useGroundedStore = create<GroundedState>()(
  persist(
    (set) => ({
      userId: null,
      todayCheckIn: null,
      activityBank: [],
      setUserId: (userId) => set({ userId }),
      setTodayCheckIn: (todayCheckIn) => set({ todayCheckIn }),
      setActivityBank: (activityBank) => set({ activityBank }),
    }),
    { name: 'grounded-store' }
  )
)
