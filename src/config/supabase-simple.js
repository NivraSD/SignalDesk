// Simple Supabase functions that work without profile tables
// DEPRECATED: Use singleton client from config/supabase.js instead
import { supabase } from './supabase'  // Use singleton client

// Simple sign in - no profile lookup
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) throw error
  return data // Just return auth data, no profile
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user // Just return auth user, no profile
}

export default supabase