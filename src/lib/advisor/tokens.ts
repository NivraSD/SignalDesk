// NIV access tokens for the MCP server: personal tokens (no expiry) and OAuth access tokens (see oauth.ts). Format: niv_<40 random chars>. Only the SHA-256
// hash is stored. A token acts as one person in one org; membership is re-checked on every use.
import { createHash, randomBytes } from 'crypto'
import type { Admin } from './data'

export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')

export function newToken() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  const bytes = randomBytes(40)
  let body = ''
  for (const b of bytes) body += alphabet[b % alphabet.length]
  const token = `niv_${body}`
  return { token, prefix: token.slice(0, 10), hash: hashToken(token) }
}

export type TokenPrincipal = { tokenId: string; userId: string; organizationId: string; scopes: string[]; name: string }

// Valid, unrevoked token whose owner is still a member of its org; touches last_used_at (at most once a minute).
export async function verifyAccessToken(admin: Admin, token: string | undefined): Promise<TokenPrincipal | null> {
  if (!token || !token.startsWith('niv_') || token.length < 30) return null
  const { data: t } = await admin
    .from('niv_access_tokens')
    .select('id, user_id, organization_id, scopes, name, revoked_at, last_used_at, expires_at')
    .eq('token_hash', hashToken(token))
    .maybeSingle()
  if (!t || t.revoked_at) return null
  if (t.expires_at && new Date(t.expires_at).getTime() < Date.now()) return null   // OAuth access tokens expire hourly
  const { data: member } = await admin
    .from('org_users')
    .select('role')
    .eq('organization_id', t.organization_id)
    .eq('user_id', t.user_id)
    .maybeSingle()
  if (!member) return null
  if (!t.last_used_at || Date.now() - new Date(t.last_used_at).getTime() > 60_000) {
    await admin.from('niv_access_tokens').update({ last_used_at: new Date().toISOString() }).eq('id', t.id)
  }
  return { tokenId: t.id, userId: t.user_id, organizationId: t.organization_id, scopes: t.scopes || [], name: t.name }
}
