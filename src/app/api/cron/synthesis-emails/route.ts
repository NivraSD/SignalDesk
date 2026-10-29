// Every 15 minutes: email any new executive synthesis to its org's recipients
// (organizations.settings.synthesis_emails). The synthesis-email edge function does the work and
// logs what it sent, so each synthesis goes out once.
import { NextResponse } from 'next/server'

export const maxDuration = 120
const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: Request) {
  if (CRON_SECRET && request.headers.get('authorization') !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const r = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/synthesis-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
    body: '{}',
    signal: AbortSignal.timeout(110_000),
  })
  return NextResponse.json(await r.json().catch(() => ({ status: r.status })), { status: r.ok ? 200 : 502 })
}
