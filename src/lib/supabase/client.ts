import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Support both NEXT_PUBLIC_* (Next.js) and REACT_APP_* (Create React App) prefixes
// Trim to remove any trailing newlines from environment variables
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || '').trim()
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || '').trim()

// Don't throw at module-load — that crashes Next.js build prerendering.
// Use placeholder values so createClient is valid; real values come from
// the environment at runtime. If env vars are genuinely missing at runtime,
// requests will fail with auth errors that surface cleanly.
const safeUrl = supabaseUrl || 'https://placeholder.supabase.co'
const safeKey = supabaseAnonKey || 'placeholder-anon-key'

// Singleton pattern to prevent multiple GoTrueClient instances
// This can happen with HMR in development or module re-imports in production
declare global {
  // eslint-disable-next-line no-var
  var supabaseClient: SupabaseClient | undefined
}

export const supabase = globalThis.supabaseClient ?? createClient(safeUrl, safeKey)

// Store singleton globally to prevent duplicate instances
globalThis.supabaseClient = supabase