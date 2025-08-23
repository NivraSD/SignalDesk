// Vercel API Route: Trigger Monitoring
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Use service key for server-side operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { organizationId = 'demo-org', targetId, targetType } = req.body

    // Trigger the Edge Function
    const { data, error } = await supabase.functions.invoke('monitor-intelligence', {
      body: {
        organizationId,
        targetId,
        targetType
      }
    })

    if (error) {
      console.error('Edge function error:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({
      success: true,
      message: 'Monitoring triggered successfully',
      data
    })

  } catch (error) {
    console.error('Trigger monitoring error:', error)
    return res.status(500).json({ error: 'Failed to trigger monitoring' })
  }
}