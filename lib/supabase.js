// Supabase Client for SignalDesk
import { createClient } from '@supabase/supabase-js'

// Client-side Supabase instance
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found in environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Server-side Supabase instance (for API routes)
export const getServiceSupabase = () => {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_KEY is required for server-side operations')
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Helper functions for common operations

// Authentication
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  return { data, error }
}

export const signUp = async (email, password, metadata = {}) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

// Real-time subscriptions
export const subscribeToIntelligence = (organizationId, callback) => {
  return supabase
    .channel('intelligence-findings')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'intelligence_findings',
        filter: `organization_id=eq.${organizationId}`
      },
      (payload) => {
        console.log('New intelligence finding:', payload)
        callback(payload.new)
      }
    )
    .subscribe()
}

export const subscribeToOpportunities = (organizationId, callback) => {
  return supabase
    .channel('opportunity-updates')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'opportunity_queue',
        filter: `organization_id=eq.${organizationId}`
      },
      (payload) => {
        console.log('Opportunity update:', payload)
        callback(payload)
      }
    )
    .subscribe()
}

export const subscribeToMonitoringStatus = (organizationId, callback) => {
  return supabase
    .channel('monitoring-status')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'monitoring_runs',
        filter: `organization_id=eq.${organizationId}`
      },
      (payload) => {
        console.log('Monitoring status update:', payload)
        callback(payload)
      }
    )
    .subscribe()
}

// Database operations with RLS
export const getIntelligenceFindings = async (organizationId, limit = 50) => {
  const { data, error } = await supabase
    .from('intelligence_findings')
    .select(`
      *,
      target:intelligence_targets(name, type)
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  return { data, error }
}

export const getOpportunities = async (organizationId, status = 'active') => {
  const { data, error } = await supabase
    .from('opportunity_queue')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('status', status)
    .order('score', { ascending: false })
  
  return { data, error }
}

export const createIntelligenceTarget = async (target) => {
  const { data, error } = await supabase
    .from('intelligence_targets')
    .insert(target)
    .select()
    .single()
  
  return { data, error }
}

// Trigger monitoring job via Edge Function
export const triggerMonitoring = async (organizationId, targetId = null) => {
  const { data, error } = await supabase.functions.invoke('monitor-intelligence', {
    body: {
      organizationId,
      targetId
    }
  })
  
  return { data, error }
}

// Vector search for MemoryVault
export const searchMemory = async (query, organizationId, limit = 10) => {
  // This would require embedding generation first
  // For now, using text search
  const { data, error } = await supabase
    .from('memoryvault_items')
    .select('*')
    .eq('organization_id', organizationId)
    .textSearch('content', query)
    .limit(limit)
  
  return { data, error }
}

// Semantic search with embeddings (requires OpenAI integration)
export const semanticSearchMemory = async (embedding, organizationId, limit = 10) => {
  const { data, error } = await supabase.rpc('match_memoryvault_items', {
    query_embedding: embedding,
    match_threshold: 0.78,
    match_count: limit,
    organization_id: organizationId
  })
  
  return { data, error }
}

export default supabase