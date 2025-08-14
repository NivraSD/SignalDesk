// Vercel API Route: Authentication
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' })
  }

  try {
    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) {
      return res.status(401).json({ error: authError.message })
    }

    // Get user data from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*, organization:organizations(*)')
      .eq('id', authData.user.id)
      .single()

    if (userError) {
      console.error('User data error:', userError)
      // User exists in Auth but not in database - create them
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          organization_id: 'demo-org',
          role: 'member'
        })
        .select('*, organization:organizations(*)')
        .single()

      if (createError) {
        return res.status(500).json({ error: 'Failed to create user profile' })
      }

      return res.status(200).json({
        success: true,
        token: authData.session.access_token,
        user: newUser,
        session: authData.session
      })
    }

    return res.status(200).json({
      success: true,
      token: authData.session.access_token,
      user: userData,
      session: authData.session
    })

  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}