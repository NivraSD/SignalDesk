// The consent screen's decision (/oauth/authorize posts here). Re-checks everything, then sends the
// browser back to the app with an authorization code (or access_denied).
import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkAuthorizeRequest, consentTokenValid, createCode, errorRedirect, publicOrigin } from '@/lib/advisor/oauth'

const page = (msg: string, status = 400) =>
  new NextResponse(`<!doctype html><meta charset="utf-8"><title>NIV</title><body style="font-family:system-ui;background:#0D0B08;color:#F4ECD9;padding:48px">${msg.replace(/</g, '&lt;')}</body>`, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } })

export async function POST(req: Request) {
  const origin = publicOrigin(req)
  // Only our own consent form may post here.
  const from = req.headers.get('origin')
  if (from && from !== origin) return page('This request did not come from NIV.', 403)

  const form = await req.formData()
  const p: Record<string, string> = {}
  for (const [k, v] of form.entries()) if (typeof v === 'string') p[k] = v

  const admin = createServiceClient()
  const check = await checkAuthorizeRequest(admin, p, origin)
  if (!check.ok) return 'redirect' in check ? NextResponse.redirect(check.redirect, 303) : page(check.fatal)
  const { req: ar } = check

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return page('Your session ended. Go back to the app and connect again.', 401)
  if (!consentTokenValid(p.consent || '', user.id, ar)) return page('This page expired. Go back to the app and connect again.')

  if (p.decision !== 'allow') {
    return NextResponse.redirect(errorRedirect(ar.redirect_uri, origin, 'access_denied', 'The user declined', ar.state), 303)
  }

  const organizationId = p.organization_id || ''
  const { data: member } = await admin.from('org_users').select('role').eq('organization_id', organizationId).eq('user_id', user.id).maybeSingle()
  if (!member) return page('You are not a member of that organization.', 403)

  const code = await createCode(admin, {
    client_id: ar.client_id, user_id: user.id, organization_id: organizationId,
    redirect_uri: ar.redirect_uri, code_challenge: ar.code_challenge, scopes: ar.scopes, resource: ar.resource,
  })
  const back = new URL(ar.redirect_uri)
  back.searchParams.set('code', code)
  if (ar.state) back.searchParams.set('state', ar.state)
  back.searchParams.set('iss', origin)
  return NextResponse.redirect(back.toString(), 303)
}
