'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createAuthClient } from '@/lib/supabase/auth-client'
import { useAppStore } from '@/stores/useAppStore'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { setUser: setStoreUser } = useAppStore()
  const supabase = createAuthClient()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        setStoreUser({
          id: currentUser.id,
          email: currentUser.email!,
          name: currentUser.user_metadata?.full_name,
        })
      }

      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        setStoreUser({
          id: currentUser.id,
          email: currentUser.email!,
          name: currentUser.user_metadata?.full_name,
        })
      } else {
        setStoreUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, setStoreUser])

  const signOut = async () => {
    await supabase.auth.signOut()
    setStoreUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
