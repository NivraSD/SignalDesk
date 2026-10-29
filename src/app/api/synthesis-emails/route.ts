// Your own executive-synthesis email for an organization (Settings).
//   GET  /api/synthesis-emails?organizationId=   -> { enabled, email, accountEmail }
//   POST /api/synthesis-emails { organizationId, enabled, email? }  -> { enabled, email }
// Each member manages only their own subscription; the synthesis-email function sends to everyone
// subscribed (plus organizations.settings.synthesis_emails).
import { NextRequest, NextResponse } from 'next/server'
import { HttpError, requireMember } from '@/lib/advisor/data'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function fail(e: unknown) {
  if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status })
  console.error('synthesis-emails error:', e)
  return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
}

export async function GET(req: NextRequest) {
  try {
    const organizationId = req.nextUrl.searchParams.get('organizationId') || ''
    const { user, admin } = await requireMember(organizationId)
    const { data } = await admin.from('synthesis_email_subscriptions').select('email').eq('organization_id', organizationId).eq('user_id', user.id).maybeSingle()
    return NextResponse.json({ enabled: !!data, email: data?.email || user.email || '', accountEmail: user.email || '' })
  } catch (e) {
    return fail(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const organizationId = String(body.organizationId || '')
    const { user, admin } = await requireMember(organizationId)
    if (!body.enabled) {
      await admin.from('synthesis_email_subscriptions').delete().eq('organization_id', organizationId).eq('user_id', user.id)
      return NextResponse.json({ enabled: false, email: user.email || '' })
    }
    const email = String(body.email || user.email || '').trim().toLowerCase()
    if (!EMAIL.test(email) || email.length > 200) throw new HttpError(400, 'Enter a valid email address.')
    const { error } = await admin.from('synthesis_email_subscriptions').upsert({ organization_id: organizationId, user_id: user.id, email })
    if (error) throw error
    return NextResponse.json({ enabled: true, email })
  } catch (e) {
    return fail(e)
  }
}
