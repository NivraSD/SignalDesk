import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CheckIn } from '@/types'

interface GroundedState {
  // Auth
  userId: string | null
  userEmail: string | null
  setUser: (id: string | null, email: string | null) => void

  // Check-in state
  todayCheckIn: CheckIn | null
  setTodayCheckIn: (data: CheckIn | null) => void

  // Activity bank (local cache for quick access)
  activityBank: Record<string, string[]>
  setActivityBank: (bank: Record<string, string[]>) => void
}

export const useGroundedStore = create<GroundedState>()(
  persist(
    (set) => ({
      userId: null,
      userEmail: null,
      setUser: (id, email) => set({ userId: id, userEmail: email }),

      todayCheckIn: null,
      setTodayCheckIn: (data) => set({ todayCheckIn: data }),

      activityBank: {},
      setActivityBank: (bank) => set({ activityBank: bank }),
    }),
    {
      name: 'grounded-store',
      partialize: (state) => ({
        activityBank: state.activityBank,
      }),
    }
  )
)
