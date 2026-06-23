import { createBrowserClient } from '@supabase/ssr'

// Use placeholder fallbacks so module load never throws during Next.js
// prerendering / static generation. Real env vars take over at runtime.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export function createAuthClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
