import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Get Mitsui organization
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .ilike('name', '%mitsui%')
      .order('created_at', { ascending: false })
      .limit(2)

    if (orgError) throw orgError

    // Get MemoryVault org-profile
    const orgIds = orgs?.map(o => o.id) || []
    const { data: memoryVault, error: mvError } = await supabase
      .from('content_library')
      .select('*')
      .in('organization_id', orgIds)
      .eq('content_type', 'org-profile')
      .order('created_at', { ascending: false })

    if (mvError) throw mvError

    return NextResponse.json({
      organizations: orgs,
      memoryVault: memoryVault
    }, { status: 200 })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
