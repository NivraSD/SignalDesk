// Status of a deck NIV is building in Gamma (the open chat checks this; the server also follows up
// on its own after starting, so the "ready" note arrives either way).
//   GET /api/advisor/deck?organizationId=&messageId= -> { deck }
import { NextRequest, NextResponse } from 'next/server'
import { HttpError, requireMember } from '@/lib/advisor/data'
import { checkDeck } from '@/lib/advisor/deck'

export const maxDuration = 120

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams
    const organizationId = q.get('organizationId') || ''
    const messageId = q.get('messageId') || ''
    const { user, admin } = await requireMember(organizationId)
    const { data: msg } = await admin
      .from('advisor_messages')
      .select('id, advisor_threads!inner(user_id, organization_id)')
      .eq('id', messageId)
      .single()
    const thread = (msg as any)?.advisor_threads
    if (!msg || !thread || thread.user_id !== user.id || thread.organization_id !== organizationId) throw new HttpError(404, 'No deck here')
    const deck = await checkDeck(admin, organizationId, messageId)
    if (!deck) throw new HttpError(404, 'No deck here')
    return NextResponse.json({ deck })
  } catch (e) {
    if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status })
    console.error('advisor deck error:', e)
    return NextResponse.json({ error: 'Could not check the deck.' }, { status: 500 })
  }
}
