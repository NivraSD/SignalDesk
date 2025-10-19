import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  console.log('🔴🔴🔴 OPPORTUNITIES API CALLED - VERSION 2 🔴🔴🔴')
  console.log('Request URL:', request.url)
  
  try {
    // Get organization filter from query params
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials:', {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      })
      
      // Fallback: just use anon key if service role is not available
      if (supabaseUrl && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        const supabase = createClient(
          supabaseUrl,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        )
        
        // Calculate timestamp for 2 hours ago
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        
        let query = supabase
          .from('opportunities')
          .select('*')
          .order('score', { ascending: false })
          .limit(20)
          .gte('created_at', twoHoursAgo) // Only get opportunities from last 2 hours
        
        // Filter by organization if provided
        if (organizationId) {
          query = query.eq('organization_id', organizationId)
        }
        
        const { data, error } = await query
        
        if (error) {
          console.error('Supabase error with anon key:', error)
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
        
        return NextResponse.json(
      { opportunities: data || [] },
      { 
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    )
      }
      
      return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 })
    }
    
    // Use service role key which bypasses RLS
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Calculate timestamp for 2 hours ago
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    
    let query = supabase
      .from('opportunities')
      .select('*')
      .order('score', { ascending: false })
      .limit(20)
      .gte('created_at', twoHoursAgo) // Only get opportunities from last 2 hours
    
    // Filter by organization if provided
    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }
    
    const { data, error } = await query
    
    console.log('🔴 Database query result:', {
      timeFilter: `>= ${twoHoursAgo}`,
      dataCount: data?.length || 0,
      firstItem: data?.[0],
      error: error
    })
    
    if (error) {
      console.error('Error fetching opportunities:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json(
      { opportunities: data || [] },
      { 
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    )
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  console.log('🗑️ DELETE OPPORTUNITIES API CALLED')

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 })
    }

    // Use service role key to bypass RLS for deletion
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Delete all opportunities
    const { error, count } = await supabase
      .from('opportunities')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all (using impossible ID)

    if (error) {
      console.error('Error deleting opportunities:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`✅ Deleted ${count || 'all'} opportunities`)

    return NextResponse.json({
      success: true,
      message: `Cleared ${count || 'all'} opportunities`
    })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}