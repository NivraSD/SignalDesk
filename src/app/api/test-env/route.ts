import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    serviceRoleLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    anonKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    nodeEnv: process.env.NODE_ENV
  })
}