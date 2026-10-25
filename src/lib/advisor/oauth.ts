// OAuth 2.1 authorization server for NIV's MCP server (see supabase/migrations/20261026_niv_oauth.sql).
// Public clients, authorization code + PKCE S256 only. Clients are registered dynamically (RFC 7591)
// or identified by a Client ID Metadata Document (an https client_id URL we fetch and cache).
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto'
import { lookup } from 'dns/promises'
import { isIP } from 'net'
import type { Admin } from './data'
import { hashToken, newToken } from './tokens'

export const SCOPES = ['read', 'ask'] as const
export const ACCESS_TTL_S = 3600
const REFRESH_TTL_MS = 60 * 24 * 3600 * 1000
const CODE_TTL_MS = 10 * 60 * 1000
const CIMD_CACHE_MS = 24 * 3600 * 1000

export type OAuthClient = { client_id: string; kind: 'dcr' | 'cimd'; client_name: string; client_uri?: string | null; logo_uri?: string | null; redirect_uris: string[] }

export class OAuthError extends Error {
  constructor(public code: string, message: string, public status = 400) { super(message) }
}

export function publicOrigin(req: Request) {
  const h = req.headers
  const host = h.get('x-forwarded-host')?.split(',')[0].trim()
  if (host) return `${h.get('x-forwarded-proto')?.split(',')[0].trim() || 'https'}://${host}`
  return new URL(req.url).origin
}

export function authServerMetadata(origin: string) {
  return {
    issuer: origin,
    authorization_endpoint: `${origin}/oauth/authorize`,
    token_endpoint: `${origin}/api/oauth/token`,
    registration_endpoint: `${origin}/api/oauth/register`,
    revocation_endpoint: `${origin}/api/oauth/revoke`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none'],
    scopes_supported: [...SCOPES],
    client_id_metadata_document_supported: true,
    authorization_response_iss_parameter_supported: true,
    service_documentation: `${origin}/niv`,
  }
}

// --- Redirect URIs -------------------------------------------------------------------------------

const LOOPBACK = new Set(['localhost', '127.0.0.1', '[::1]'])

// https anywhere, http only on loopback, or an app's private-use scheme (cursor://, vscode://…).
export function acceptableRedirect(uri: string) {
  let u: URL
  try { u = new URL(uri) } catch { return false }
  if (u.hash) return false
  if (u.protocol === 'https:') return true
  if (u.protocol === 'http:') return LOOPBACK.has(u.hostname)
  return /^[a-z][a-z0-9+.-]*:$/.test(u.protocol) && !['javascript:', 'data:', 'file:', 'blob:', 'vbscript:', 'about:'].includes(u.protocol)
}

// Exact match, except loopback redirects may use any port (RFC 8252 §7.3).
export function redirectAllowed(client: OAuthClient, uri: string) {
  if (client.redirect_uris.includes(uri)) return true
  let u: URL
  try { u = new URL(uri) } catch { return false }
  if (u.protocol !== 'http:' || !LOOPBACK.has(u.hostname)) return false
  return client.redirect_uris.some((r) => {
    try {
      const x = new URL(r)
      return x.protocol === 'http:' && x.hostname === u.hostname && x.pathname === u.pathname && x.search === u.search
    } catch { return false }
  })
}

// --- Clients -------------------------------------------------------------------------------------

const isUrlClientId = (id: string) => id.startsWith('https://')

function privateAddress(ip: string) {
  if (ip.includes(':')) {
    const v = ip.toLowerCase()
    if (v.startsWith('::ffff:')) return privateAddress(v.slice(7))
    return v === '::1' || v === '::' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe80')
  }
  const [a, b] = ip.split('.').map(Number)
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224
}

// Fetch a Client ID Metadata Document, refusing anything that resolves to a private network.
async function fetchClientMetadata(clientId: string): Promise<OAuthClient> {
  const u = new URL(clientId)
  if (u.protocol !== 'https:' || u.pathname === '/' || u.hash || u.username || u.password) throw new OAuthError('invalid_client', 'Invalid client_id URL')
  if (isIP(u.hostname.replace(/^\[|\]$/g, '')) || u.hostname === 'localhost' || !u.hostname.includes('.')) throw new OAuthError('invalid_client', 'Invalid client_id host')
  const addrs = await lookup(u.hostname, { all: true }).catch(() => [])
  if (!addrs.length || addrs.some((a) => privateAddress(a.address))) throw new OAuthError('invalid_client', 'Client metadata host is not reachable')

  const res = await fetch(clientId, { redirect: 'error', signal: AbortSignal.timeout(5000), headers: { Accept: 'application/json' } })
    .catch(() => { throw new OAuthError('invalid_client', 'Could not fetch client metadata') })
  if (!res.ok) throw new OAuthError('invalid_client', `Client metadata returned ${res.status}`)
  const body = await res.text()
  if (body.length > 64 * 1024) throw new OAuthError('invalid_client', 'Client metadata too large')
  let doc: any
  try { doc = JSON.parse(body) } catch { throw new OAuthError('invalid_client', 'Client metadata is not JSON') }
  if (doc.client_id !== clientId) throw new OAuthError('invalid_client', 'Client metadata client_id does not match')
  const redirects = Array.isArray(doc.redirect_uris) ? doc.redirect_uris.filter((r: unknown) => typeof r === 'string' && acceptableRedirect(r)) : []
  if (!redirects.length) throw new OAuthError('invalid_client', 'Client metadata has no usable redirect_uris')
  if (doc.token_endpoint_auth_method && doc.token_endpoint_auth_method !== 'none') throw new OAuthError('invalid_client', 'Only public clients are supported')
  return {
    client_id: clientId, kind: 'cimd',
    client_name: String(doc.client_name || u.hostname).slice(0, 100),
    client_uri: typeof doc.client_uri === 'string' ? doc.client_uri : null,
    logo_uri: typeof doc.logo_uri === 'string' && doc.logo_uri.startsWith('https://') ? doc.logo_uri : null,
    redirect_uris: redirects.slice(0, 20),
  }
}

export async function resolveClient(admin: Admin, clientId: string): Promise<OAuthClient> {
  if (!clientId || clientId.length > 500) throw new OAuthError('invalid_client', 'Missing or invalid client_id')
  const { data: row } = await admin.from('niv_oauth_clients').select('*').eq('client_id', clientId).maybeSingle()
  if (!isUrlClientId(clientId)) {
    if (!row) throw new OAuthError('invalid_client', 'Unknown client')
    return row
  }
  if (row && row.fetched_at && Date.now() - new Date(row.fetched_at).getTime() < CIMD_CACHE_MS) return row
  const client = await fetchClientMetadata(clientId)
  await admin.from('niv_oauth_clients').upsert({ ...client, fetched_at: new Date().toISOString() })
  return client
}

export async function registerClient(admin: Admin, body: any): Promise<OAuthClient> {
  const redirects: string[] = Array.isArray(body?.redirect_uris) ? body.redirect_uris.filter((r: unknown) => typeof r === 'string') : []
  if (!redirects.length || redirects.length > 20) throw new OAuthError('invalid_redirect_uri', 'Provide 1–20 redirect_uris')
  const bad = redirects.find((r) => !acceptableRedirect(r))
  if (bad) throw new OAuthError('invalid_redirect_uri', `Redirect URI not allowed: ${bad}`)
  if (body.token_endpoint_auth_method && body.token_endpoint_auth_method !== 'none') throw new OAuthError('invalid_client_metadata', 'Only public clients (token_endpoint_auth_method "none") are supported')
  const grants: string[] = body.grant_types || ['authorization_code', 'refresh_token']
  if (grants.some((g) => !['authorization_code', 'refresh_token'].includes(g))) throw new OAuthError('invalid_client_metadata', 'Unsupported grant_types')
  const client: OAuthClient = {
    client_id: `nivc_${randomBytes(18).toString('base64url')}`,
    kind: 'dcr',
    client_name: String(body.client_name || 'MCP client').slice(0, 100),
    client_uri: typeof body.client_uri === 'string' ? body.client_uri.slice(0, 300) : null,
    logo_uri: typeof body.logo_uri === 'string' && body.logo_uri.startsWith('https://') ? body.logo_uri.slice(0, 500) : null,
    redirect_uris: redirects,
  }
  const { error } = await admin.from('niv_oauth_clients').insert(client)
  if (error) throw error
  return client
}

// --- Consent form protection ---------------------------------------------------------------------

const secret = () => process.env.NIV_OAUTH_SECRET || createHash('sha256').update(`niv-oauth:${process.env.SUPABASE_SERVICE_ROLE_KEY}`).digest('hex')

// Binds the consent form to the signed-in person and this exact request, for 15 minutes.
export function consentToken(userId: string, p: { client_id: string; redirect_uri: string; code_challenge: string }, issuedAt = Date.now()) {
  const mac = createHmac('sha256', secret()).update([userId, p.client_id, p.redirect_uri, p.code_challenge, issuedAt].join('\n')).digest('base64url')
  return `${issuedAt}.${mac}`
}

export function consentTokenValid(token: string, userId: string, p: { client_id: string; redirect_uri: string; code_challenge: string }) {
  const [ts] = token.split('.')
  const issuedAt = Number(ts)
  if (!issuedAt || Date.now() - issuedAt > 15 * 60 * 1000) return false
  const a = Buffer.from(consentToken(userId, p, issuedAt))
  const b = Buffer.from(token)
  return a.length === b.length && timingSafeEqual(a, b)
}

// --- Codes and tokens ----------------------------------------------------------------------------

export function grantedScopes(requested: string | null | undefined) {
  const asked = (requested || '').split(/\s+/).filter(Boolean)
  const known = asked.filter((s) => (SCOPES as readonly string[]).includes(s))
  return known.length ? known : [...SCOPES]
}

export async function createCode(admin: Admin, g: { client_id: string; user_id: string; organization_id: string; redirect_uri: string; code_challenge: string; scopes: string[]; resource?: string | null }) {
  const code = randomBytes(32).toString('base64url')
  const { error } = await admin.from('niv_oauth_codes').insert({ ...g, code_hash: hashToken(code), expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString() })
  if (error) throw error
  return code
}

const newRefresh = () => `nivr_${randomBytes(30).toString('base64url')}`

function tokenResponse(access: string, refresh: string, scopes: string[]) {
  return { access_token: access, token_type: 'Bearer', expires_in: ACCESS_TTL_S, refresh_token: refresh, scope: scopes.join(' ') }
}

export async function exchangeCode(admin: Admin, p: { code: string; client_id: string; redirect_uri: string; code_verifier: string }) {
  if (!p.code || !p.code_verifier) throw new OAuthError('invalid_request', 'code and code_verifier are required')
  // Single use: claim the code atomically.
  const { data: row } = await admin.from('niv_oauth_codes')
    .update({ used_at: new Date().toISOString() })
    .eq('code_hash', hashToken(p.code)).is('used_at', null)
    .select('*').maybeSingle()
  if (!row || new Date(row.expires_at).getTime() < Date.now()) throw new OAuthError('invalid_grant', 'Code is invalid or expired')
  if (row.client_id !== p.client_id || row.redirect_uri !== p.redirect_uri) throw new OAuthError('invalid_grant', 'Code was issued to a different client or redirect_uri')
  const challenge = createHash('sha256').update(p.code_verifier).digest('base64url')
  if (challenge !== row.code_challenge) throw new OAuthError('invalid_grant', 'PKCE verification failed')

  const { data: member } = await admin.from('org_users').select('role').eq('organization_id', row.organization_id).eq('user_id', row.user_id).maybeSingle()
  if (!member) throw new OAuthError('invalid_grant', 'No longer a member of this organization')
  const { data: client } = await admin.from('niv_oauth_clients').select('client_name').eq('client_id', row.client_id).maybeSingle()

  const t = newToken()
  const refresh = newRefresh()
  const { error } = await admin.from('niv_access_tokens').insert({
    user_id: row.user_id, organization_id: row.organization_id,
    name: client?.client_name || 'Connected app', token_prefix: t.prefix, token_hash: t.hash, scopes: row.scopes,
    oauth_client_id: row.client_id, expires_at: new Date(Date.now() + ACCESS_TTL_S * 1000).toISOString(),
    refresh_hash: hashToken(refresh), refresh_expires_at: new Date(Date.now() + REFRESH_TTL_MS).toISOString(),
  })
  if (error) throw error
  return tokenResponse(t.token, refresh, row.scopes)
}

export async function refreshTokens(admin: Admin, p: { refresh_token: string; client_id: string }) {
  if (!p.refresh_token) throw new OAuthError('invalid_request', 'refresh_token is required')
  const { data: row } = await admin.from('niv_access_tokens')
    .select('id, user_id, organization_id, scopes, oauth_client_id, revoked_at, refresh_expires_at')
    .eq('refresh_hash', hashToken(p.refresh_token)).maybeSingle()
  if (!row || row.revoked_at || !row.refresh_expires_at || new Date(row.refresh_expires_at).getTime() < Date.now()) throw new OAuthError('invalid_grant', 'Refresh token is invalid or expired')
  if (p.client_id && row.oauth_client_id !== p.client_id) throw new OAuthError('invalid_grant', 'Refresh token was issued to a different client')
  const { data: member } = await admin.from('org_users').select('role').eq('organization_id', row.organization_id).eq('user_id', row.user_id).maybeSingle()
  if (!member) throw new OAuthError('invalid_grant', 'No longer a member of this organization')

  // Rotate both; the old refresh token stops working (compare-and-swap on the old hash).
  const t = newToken()
  const refresh = newRefresh()
  const { data: updated } = await admin.from('niv_access_tokens').update({
    token_prefix: t.prefix, token_hash: t.hash,
    expires_at: new Date(Date.now() + ACCESS_TTL_S * 1000).toISOString(),
    refresh_hash: hashToken(refresh), refresh_expires_at: new Date(Date.now() + REFRESH_TTL_MS).toISOString(),
  }).eq('id', row.id).eq('refresh_hash', hashToken(p.refresh_token)).select('id').maybeSingle()
  if (!updated) throw new OAuthError('invalid_grant', 'Refresh token was already used')
  return tokenResponse(t.token, refresh, row.scopes)
}

// RFC 7009: revoking either token ends the connection. Unknown tokens are not an error.
export async function revokeToken(admin: Admin, token: string) {
  if (!token) return
  const h = hashToken(token)
  const now = new Date().toISOString()
  await admin.from('niv_access_tokens').update({ revoked_at: now }).eq('token_hash', h).not('oauth_client_id', 'is', null)
  await admin.from('niv_access_tokens').update({ revoked_at: now }).eq('refresh_hash', h)
}

// --- HTTP helpers --------------------------------------------------------------------------------

export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, MCP-Protocol-Version',
  'Access-Control-Max-Age': '86400',
}

export const corsJson = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...CORS, ...extra } })

export const oauthErrorResponse = (e: unknown) => {
  if (e instanceof OAuthError) return corsJson({ error: e.code, error_description: e.message }, e.status)
  console.error('oauth error:', e)
  return corsJson({ error: 'server_error', error_description: 'Something went wrong' }, 500)
}

// Form-encoded (the spec) or JSON (some clients).
export async function readParams(req: Request): Promise<Record<string, string>> {
  const type = req.headers.get('content-type') || ''
  if (type.includes('application/json')) {
    const j = await req.json().catch(() => ({}))
    return Object.fromEntries(Object.entries(j || {}).map(([k, v]) => [k, String(v ?? '')]))
  }
  const f = new URLSearchParams(await req.text())
  return Object.fromEntries(f.entries())
}

export function protectedResourceMetadata(origin: string) {
  return {
    resource: `${origin}/api/mcp`,
    authorization_servers: [origin],
    scopes_supported: [...SCOPES],
    bearer_methods_supported: ['header'],
    resource_name: 'NIV',
    resource_documentation: `${origin}/niv`,
  }
}

// --- Authorization requests ----------------------------------------------------------------------

export type AuthorizeRequest = { client_id: string; redirect_uri: string; code_challenge: string; state: string; scopes: string[]; resource: string | null }

export type AuthorizeCheck =
  | { ok: true; client: OAuthClient; req: AuthorizeRequest }
  | { ok: false; fatal: string }        // can't trust the redirect_uri: show the error, don't redirect
  | { ok: false; redirect: string }     // report the error back to the client

export function errorRedirect(redirectUri: string, origin: string, error: string, description: string, state?: string) {
  const u = new URL(redirectUri)
  u.searchParams.set('error', error)
  u.searchParams.set('error_description', description)
  if (state) u.searchParams.set('state', state)
  u.searchParams.set('iss', origin)
  return u.toString()
}

export async function checkAuthorizeRequest(admin: Admin, p: Record<string, string | undefined>, origin: string): Promise<AuthorizeCheck> {
  let client: OAuthClient
  try {
    client = await resolveClient(admin, p.client_id || '')
  } catch (e) {
    return { ok: false, fatal: e instanceof OAuthError ? e.message : 'Unknown client' }
  }
  const redirect_uri = p.redirect_uri || (client.redirect_uris.length === 1 ? client.redirect_uris[0] : '')
  if (!redirect_uri || !redirectAllowed(client, redirect_uri)) return { ok: false, fatal: 'This app sent a redirect address it did not register.' }
  const state = p.state || ''
  const fail = (error: string, d: string): AuthorizeCheck => ({ ok: false, redirect: errorRedirect(redirect_uri, origin, error, d, state) })
  if (p.response_type !== 'code') return fail('unsupported_response_type', 'Only response_type=code is supported')
  if (!p.code_challenge || p.code_challenge.length < 43 || p.code_challenge.length > 128) return fail('invalid_request', 'PKCE code_challenge is required')
  if ((p.code_challenge_method || 'plain') !== 'S256') return fail('invalid_request', 'code_challenge_method must be S256')
  const resource = p.resource || null
  if (resource && !resource.startsWith(origin)) return fail('invalid_target', 'Unknown resource')
  return { ok: true, client, req: { client_id: client.client_id, redirect_uri, code_challenge: p.code_challenge, state, scopes: grantedScopes(p.scope), resource } }
}
