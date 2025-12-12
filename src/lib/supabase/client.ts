import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Support both NEXT_PUBLIC_* (Next.js) and REACT_APP_* (Create React App) prefixes
// Trim to remove any trailing newlines from environment variables
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || '').trim()
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || '').trim()

if (!supabaseUrl) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL or REACT_APP_SUPABASE_URL')
}
if (!supabaseAnonKey) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY or REACT_APP_SUPABASE_ANON_KEY')
}

// Singleton pattern to prevent multiple GoTrueClient instances
// This can happen with HMR in development or module re-imports in production
declare global {
  // eslint-disable-next-line no-var
  var supabaseClient: SupabaseClient | undefined
}

export const supabase = globalThis.supabaseClient ?? createClient(supabaseUrl, supabaseAnonKey)

// Store singleton globally to prevent duplicate instances
globalThis.supabaseClient = supabase