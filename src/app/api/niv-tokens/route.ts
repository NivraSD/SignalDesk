// Manage your NIV access tokens (for connecting Claude, Cursor, Copilot… via MCP).
//   GET    /api/niv-tokens?organizationId=            -> { tokens: [{id, name, prefix, created_at, last_used_at, kind: 'token'|'app'}] }  (apps = OAuth connections)
//   POST   /api/niv-tokens { organizationId, name }    -> { token (shown once), id }
//   DELETE /api/niv-tokens { organizationId, id }      -> { ok }
import { NextRequest, NextResponse } from 'next/server'
import { HttpError, requireMember } from '@/lib/advisor/data'
import { newToken } from '@/lib/advisor/tokens'

const MAX_ACTIVE_TOKENS = 10

function fail(e: unknown) {
  if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status })
  console.error('niv-tokens error:', e)
  return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
}

export async function GET(req: NextRequest) {
  try {
    const organizationId = req.nextUrl.searchParams.get('organizationId') || ''
    const { user, admin } = await requireMember(organizationId)
    const { data } = await admin
      .from('niv_access_tokens')
      .select('id, name, token_prefix, created_at, last_used_at, oauth_client_id')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .is('revoked_at', null)
      .order('created_at', { ascending: false })
    return NextResponse.json({ tokens: (data || []).map((t: any) => ({ id: t.id, name: t.name, prefix: t.token_prefix, created_at: t.created_at, last_used_at: t.last_used_at, kind: t.oauth_client_id ? 'app' : 'token' })) })
  } catch (e) {
    return fail(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const organizationId = String(body.organizationId || '')
    const name = String(body.name || '').trim().slice(0, 60) || 'My AI tool'
    const { user, admin } = await requireMember(organizationId)
    const { count } = await admin.from('niv_access_tokens').select('id', { count: 'exact', head: true })
      .eq('user_id', user.id).eq('organization_id', organizationId).is('revoked_at', null).is('oauth_client_id', null)
    if ((count ?? 0) >= MAX_ACTIVE_TOKENS) throw new HttpError(400, 'You have the maximum number of tokens. Revoke one first.')
    const t = newToken()
    const { data, error } = await admin.from('niv_access_tokens')
      .insert({ user_id: user.id, organization_id: organizationId, name, token_prefix: t.prefix, token_hash: t.hash })
      .select('id').single()
    if (error) throw error
    return NextResponse.json({ id: data.id, token: t.token, name })
  } catch (e) {
    return fail(e)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const organizationId = String(body.organizationId || '')
    const { user, admin } = await requireMember(organizationId)
    const { error } = await admin.from('niv_access_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', String(body.id || '')).eq('user_id', user.id).eq('organization_id', organizationId)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e) {
    return fail(e)
  }
}
