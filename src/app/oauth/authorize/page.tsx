// OAuth consent screen: "Claude wants to use NIV as you". Reached from an MCP client's
// authorization request; sends people to sign in first, then asks which organization to connect.
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkAuthorizeRequest, consentToken } from '@/lib/advisor/oauth'
import { NivriaLogo } from '@/components/brand/NivriaWordmark'
import { AUTH_CSS } from '@/components/brand/authCss'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Connect to NIV' }

const SCOPE_TEXT: Record<string, string> = {
  read: 'Search and read the company documents you can see, intel and briefs, and your Memory Vault',
  ask: 'Ask NIV questions as you (the conversations are saved to your NIV history)',
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="nv-auth">
      <style>{AUTH_CSS + CONSENT_CSS}</style>
      <main className="nv-auth-main">
        <div className="nv-auth-card">
          <div className="nv-auth-logo"><NivriaLogo size="md" href="/" /></div>
          {children}
        </div>
      </main>
    </div>
  )
}

export default async function AuthorizePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams
  const p: Record<string, string> = {}
  for (const [k, v] of Object.entries(raw)) if (typeof v === 'string') p[k] = v

  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host') || ''
  const origin = `${h.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https')}://${host}`

  const check = await checkAuthorizeRequest(createServiceClient(), p, origin)
  if (!check.ok && 'redirect' in check) redirect(check.redirect)
  if (!check.ok) {
    return (
      <Shell>
        <header className="nv-auth-head">
          <h1 className="nv-auth-h">Can&rsquo;t <em>connect.</em></h1>
          <p className="nv-auth-sub">{check.fatal}</p>
        </header>
        <p className="nv-consent-note">Go back to the app you were connecting and try again. If it keeps happening, the app may not support NIV yet.</p>
      </Shell>
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/login?next=${encodeURIComponent(`/oauth/authorize?${new URLSearchParams(p)}`)}`)

  const admin = createServiceClient()
  const { data: memberships } = await admin.from('org_users').select('organization_id, role').eq('user_id', user.id)
  const orgIds = (memberships || []).map((m: any) => m.organization_id)
  const { data: orgs } = orgIds.length
    ? await admin.from('organizations').select('id, name').in('id', orgIds).order('name')
    : { data: [] as { id: string; name: string }[] }

  const { client, req } = check
  const appName = client.client_name
  const appHost = (() => { try { return new URL(client.client_uri || req.redirect_uri).host } catch { return '' } })()

  if (!orgs?.length) {
    return (
      <Shell>
        <header className="nv-auth-head">
          <h1 className="nv-auth-h">No <em>organization.</em></h1>
          <p className="nv-auth-sub">{user.email} isn&rsquo;t a member of an organization in NIV yet, so there&rsquo;s nothing to connect {appName} to.</p>
        </header>
      </Shell>
    )
  }

  return (
    <Shell>
      <header className="nv-auth-head">
        <h1 className="nv-auth-h">Connect <em>{appName}</em></h1>
        <p className="nv-auth-sub">{appName}{appHost && appHost !== appName ? ` (${appHost})` : ''} wants to use NIV as you.</p>
      </header>

      <form method="post" action="/api/oauth/authorize" className="nv-auth-form">
        {Object.entries({ ...p, client_id: req.client_id, redirect_uri: req.redirect_uri, consent: consentToken(user.id, req) }).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}

        <div className="nv-auth-field">
          <span className="nv-auth-label">It will be able to</span>
          <ul className="nv-consent-list">
            {req.scopes.map((s) => <li key={s}>{SCOPE_TEXT[s] || s}</li>)}
          </ul>
          <p className="nv-consent-note">It sees only what you can see, and your organization&rsquo;s permissions still apply.</p>
        </div>

        <label className="nv-auth-field">
          <span className="nv-auth-label">Organization</span>
          <select name="organization_id" className="nv-auth-input" defaultValue={orgs[0].id}>
            {orgs.map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </label>

        <p className="nv-consent-note">Signed in as {user.email}. You can disconnect it any time from NIV &rarr; Connect your AI tools.</p>

        <div className="nv-consent-actions">
          <button type="submit" name="decision" value="allow" className="nv-auth-cta">
            Allow
            <svg width="20" height="12" viewBox="0 0 20 12" fill="none" aria-hidden="true">
              <path d="M0 6h18.5M14 1l5 5-5 5" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </button>
          <button type="submit" name="decision" value="deny" className="nv-consent-deny">Cancel</button>
        </div>
      </form>
    </Shell>
  )
}

const CONSENT_CSS = `
.nv-consent-list { margin: 6px 0 0; padding-left: 20px; color: var(--ink-2); font-size: 15px; line-height: 1.5; }
.nv-consent-list li { margin: 4px 0; }
.nv-consent-note { color: var(--ink-4); font-size: 13.5px; line-height: 1.5; margin: 8px 0 0; }
.nv-consent-actions { display: flex; flex-direction: row-reverse; gap: 12px; align-items: stretch; margin-top: 4px; }
.nv-consent-actions .nv-auth-cta { flex: 1; }
.nv-consent-deny { background: transparent; color: var(--ink-3); border: 1px solid var(--rule); border-radius: 2px; padding: 0 20px; font: inherit; font-size: 15px; cursor: pointer; }
.nv-consent-deny:hover { color: var(--ink); border-color: var(--ink-4); }
select.nv-auth-input { appearance: auto; }
`
