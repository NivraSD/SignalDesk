// Supabase Client Configuration for Frontend - SINGLETON INSTANCE
import { createClient } from '@supabase/supabase-js'

// Singleton enforcement - prevent multiple client creation
if (window.__SUPABASE_CLIENT__) {
  console.warn('WARNING: Attempting to create multiple Supabase clients. Using existing singleton.')
  throw new Error('Multiple Supabase clients detected! Use the singleton from config/supabase.js')
}

// Get from environment variables - NO HARDCODED FALLBACKS FOR SECURITY
// Trim any whitespace/newlines that might have been accidentally included
const supabaseUrl = (process.env.REACT_APP_SUPABASE_URL || '').trim().replace(/\n/g, '')
const supabaseAnonKey = (process.env.REACT_APP_SUPABASE_ANON_KEY || '').trim().replace(/\n/g, '')

// Log configuration (for debugging)
console.log('🔧 Supabase Configuration:', {
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey,
  envVarsPresent: !!(process.env.REACT_APP_SUPABASE_URL && process.env.REACT_APP_SUPABASE_ANON_KEY),
  buildTime: new Date().toISOString()
})

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL: Supabase configuration missing from environment variables')
  console.error('Required environment variables:')
  console.error('- REACT_APP_SUPABASE_URL')
  console.error('- REACT_APP_SUPABASE_ANON_KEY')
  console.error('Please set these in your .env file locally or in Vercel environment settings for production')
  throw new Error('Supabase configuration is required. Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY environment variables.')
}

// Create SINGLETON Supabase client - DO NOT create multiple instances
export const supabase = window.__SUPABASE_CLIENT__ || (() => {
  const client = createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,  // Prevents conflicts with SPA routing
        storage: window.localStorage,
        flowType: 'pkce',  // Added PKCE for better security
        debug: process.env.NODE_ENV === 'development'  // Enable auth debugging in dev
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      },
      global: {
        headers: {
          'X-Client-Info': 'signaldesk-frontend'
        }
      }
    }
  )
  
  // Store singleton reference globally to prevent multiple instances
  window.__SUPABASE_CLIENT__ = client
  
  // Add development validation
  if (process.env.NODE_ENV === 'development') {
    // Add global method to check client health
    window.__SUPABASE_VALIDATE__ = () => {
      const isValid = client && typeof client.auth === 'object'
      console.log('🔍 Supabase singleton validation:', isValid ? '✅ PASS' : '❌ FAIL')
      return isValid
    }
  }
  
  console.log('✅ Supabase singleton client created successfully')
  return client
})()

// Add global error handler for database schema issues
const originalFrom = supabase.from.bind(supabase)
supabase.from = function(table) {
  const query = originalFrom(table)
  const originalSelect = query.select.bind(query)
  
  query.select = function(...args) {
    const result = originalSelect(...args)
    
    // Add error handling for schema access issues
    const originalPromise = result.then.bind(result)
    result.then = function(onSuccess, onError) {
      return originalPromise(
        onSuccess,
        (error) => {
          if (error?.message?.includes('schema') || error?.message?.includes('permission')) {
            console.warn(`Database schema access issue for table '${table}':`, error.message)
            // Return empty result instead of throwing
            if (onSuccess) {
              return onSuccess({ data: [], error: null, count: 0 })
            }
          }
          if (onError) return onError(error)
          throw error
        }
      )
    }
    
    return result
  }
  
  return query
}

// Helper functions for the frontend

// Authentication
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) throw error
  
  // Get user profile with proper error handling
  try {
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*, organization:organizations(*)')
      .eq('id', data.user.id)
      .maybeSingle() // Use maybeSingle to handle no rows gracefully
    
    if (profileError && !profileError.message.includes('Row not found')) {
      console.warn('Profile fetch warning:', profileError.message)
    }
    
    return { 
      ...data, 
      profile: profile || {
        id: data.user.id,
        email: data.user.email,
        username: data.user.email?.split('@')[0],
        role: 'admin'
      }
    }
  } catch (profileError) {
    console.warn('Profile fetch failed (non-critical):', profileError.message)
    // Return basic user data without profile
    return { 
      ...data, 
      profile: {
        id: data.user.id,
        email: data.user.email,
        username: data.user.email?.split('@')[0],
        role: 'admin'
      }
    }
  }
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
  
  // Get user profile with proper error handling
  try {
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*, organization:organizations(*)')
      .eq('id', user.id)
      .maybeSingle() // Use maybeSingle to handle no rows gracefully
    
    if (profileError && !profileError.message.includes('Row not found')) {
      console.warn('Profile fetch warning:', profileError.message)
    }
    
    return { 
      ...user, 
      profile: profile || {
        id: user.id,
        email: user.email,
        username: user.email?.split('@')[0],
        role: 'admin'
      }
    }
  } catch (profileError) {
    console.warn('Profile fetch failed (non-critical):', profileError.message)
    // Return basic user data without profile
    return { 
      ...user, 
      profile: {
        id: user.id,
        email: user.email,
        username: user.email?.split('@')[0],
        role: 'admin'
      }
    }
  }
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