// Supabase Client Configuration for Frontend
import { createClient } from '@supabase/supabase-js'

// Get from environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase configuration missing. Add REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY to .env')
}

// Create Supabase client
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: window.localStorage
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
)

// Helper functions for the frontend

// Authentication
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) throw error
  
  // Get user profile
  const { data: profile } = await supabase
    .from('users')
    .select('*, organization:organizations(*)')
    .eq('id', data.user.id)
    .single()
  
  return { ...data, profile }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  
  const { data: profile } = await supabase
    .from('users')
    .select('*, organization:organizations(*)')
    .eq('id', user.id)
    .single()
  
  return { ...user, profile }
}

// Real-time subscriptions
export const subscribeToFindings = (organizationId, callback) => {
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
        console.log('New finding:', payload)
        callback(payload.new)
      }
    )
    .subscribe()
}

export const subscribeToMonitoring = (organizationId, callback) => {
  return supabase
    .channel('monitoring-runs')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'monitoring_runs',
        filter: `organization_id=eq.${organizationId}`
      },
      (payload) => {
        console.log('Monitoring update:', payload)
        callback(payload)
      }
    )
    .subscribe()
}

export const subscribeToOpportunities = (organizationId, callback) => {
  return supabase
    .channel('opportunities')
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

// Data fetching
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
  
  if (error) throw error
  return data
}

export const getOpportunities = async (organizationId) => {
  const { data, error } = await supabase
    .from('opportunity_queue')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .order('score', { ascending: false })
  
  if (error) throw error
  return data
}

export const getProjects = async (organizationId) => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export const getContent = async (projectId) => {
  const { data, error } = await supabase
    .from('content')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

// Monitoring
export const triggerMonitoring = async (organizationId, targetId = null) => {
  const { data, error } = await supabase.functions.invoke('monitor-intelligence', {
    body: {
      organizationId,
      targetId
    }
  })
  
  if (error) throw error
  return data
}

// Content operations
export const saveContent = async (content) => {
  const { data, error } = await supabase
    .from('content')
    .insert(content)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const updateContent = async (id, updates) => {
  const { data, error } = await supabase
    .from('content')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// MemoryVault operations
export const searchMemory = async (organizationId, query) => {
  const { data, error } = await supabase
    .from('memoryvault_items')
    .select('*')
    .eq('organization_id', organizationId)
    .textSearch('content', query)
    .limit(10)
  
  if (error) throw error
  return data
}

export const addToMemory = async (item) => {
  const { data, error } = await supabase
    .from('memoryvault_items')
    .insert(item)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export default supabase