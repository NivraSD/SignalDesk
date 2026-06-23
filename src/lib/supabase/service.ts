import { createClient } from '@supabase/supabase-js'

// Service role client for server-side operations that bypass RLS.
// Placeholder fallbacks prevent module-load throws during build.
export const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
)