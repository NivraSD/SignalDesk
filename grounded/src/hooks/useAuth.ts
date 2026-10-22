import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useGroundedStore } from '@/stores/groundedStore'
import type { User } from '@supabase/supabase-js'

function issuedHere(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload.iss === 'string' && payload.iss.startsWith(import.meta.env.VITE_SUPABASE_URL)
  } catch {
    return true // can't read it: leave it to the server to decide
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { setUser: setStoreUser } = useGroundedStore()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      // A login issued by a different Supabase project (Grounded moved projects) is useless here:
      // every server call would come back Unauthorized. Drop it and show the sign-in screen.
      if (session && !issuedHere(session.access_token)) {
        await supabase.auth.signOut({ scope: 'local' })
        session = null
      }
      const u = session?.user ?? null
      setUser(u)
      setStoreUser(u?.id ?? null, u?.email ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      setStoreUser(u?.id ?? null, u?.email ?? null)
    })

    return () => subscription.unsubscribe()
  }, [setStoreUser])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setStoreUser(null, null)
  }

  return { user, loading, signIn, signUp, signOut }
}
