import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Support both NEXT_PUBLIC_* (Next.js) and REACT_APP_* (Create React App) prefixes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL or REACT_APP_SUPABASE_URL')
}
if (!supabaseAnonKey) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY or REACT_APP_SUPABASE_ANON_KEY')
}

// Singleton pattern to prevent multiple GoTrueClient instances
// This can happen with HMR in development
declare global {
  // eslint-disable-next-line no-var
  var supabaseClient: SupabaseClient | undefined
}

export const supabase = globalThis.supabaseClient ?? createClient(supabaseUrl, supabaseAnonKey)

if (process.env.NODE_ENV !== 'production') {
  globalThis.supabaseClient = supabase
}