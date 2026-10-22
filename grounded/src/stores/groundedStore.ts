import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Area, CheckIn } from '@/types'

interface GroundedState {
  // Auth
  userId: string | null
  userEmail: string | null
  setUser: (id: string | null, email: string | null) => void

  // Check-in state
  todayCheckIn: CheckIn | null
  setTodayCheckIn: (data: CheckIn | null) => void

  // This person's setup (grounded_user_settings); null until loaded
  areas: Area[] | null
  onboarded: boolean | null
  displayName: string | null
  hasCalendar: boolean
  setSetup: (s: { areas: Area[] | null; onboarded: boolean; displayName: string | null; hasCalendar?: boolean }) => void

  // Activity bank (local cache for quick access)
  activityBank: Record<string, string[]>
  setActivityBank: (bank: Record<string, string[]>) => void
}

export const useGroundedStore = create<GroundedState>()(
  persist(
    (set) => ({
      userId: null,
      userEmail: null,
      // A different person signing in on this device starts from a clean slate.
      setUser: (id, email) =>
        set((state) =>
          state.userId === id
            ? { userId: id, userEmail: email }
            : { userId: id, userEmail: email, areas: null, onboarded: null, displayName: null, hasCalendar: false, activityBank: {}, todayCheckIn: null }
        ),

      todayCheckIn: null,
      setTodayCheckIn: (data) => set({ todayCheckIn: data }),

      areas: null,
      onboarded: null,
      displayName: null,
      hasCalendar: false,
      setSetup: ({ areas, onboarded, displayName, hasCalendar }) =>
        set((state) => ({ areas, onboarded, displayName, hasCalendar: hasCalendar ?? state.hasCalendar })),

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
