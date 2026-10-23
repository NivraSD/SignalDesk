// Daily limits on Grounded's paid calls (Claude, Gemini, Voyage, email), per person and per kind,
// plus one overall ceiling across everyone (a backstop against many throwaway accounts).
// Counted in grounded_ai_usage by the SQL function grounded_take_quota; days are Eastern.
// Generous for real use; raise a number here if someone genuinely hits it.
// deno-lint-ignore-file no-explicit-any

export const DAILY_LIMITS = {
  chat: 100,            // companion messages
  reflection: 10,       // check-in reflections
  'suggest-plan': 10,   // plan suggestions
  'update-profile': 6,  // running-summary refreshes
  embed: 300,           // memory indexing (Voyage)
  poem: 30,             // Laugh poems (Opus)
  orchestrate: 12,      // open-screen art (Claude + Gemini image)
  'pill-email': 10,     // pill summary emails
} as const

export const GLOBAL_DAILY_LIMIT = 5000

export type QuotaKind = keyof typeof DAILY_LIMITS

// True if this call may go ahead (and counts it). Fails closed: if the check itself errors, no paid call.
export async function takeQuota(admin: any, userId: string, kind: QuotaKind): Promise<boolean> {
  const { data, error } = await admin.rpc('grounded_take_quota', {
    p_user: userId,
    p_kind: kind,
    p_user_limit: DAILY_LIMITS[kind],
    p_global_limit: GLOBAL_DAILY_LIMIT,
  })
  if (error) {
    console.error('quota check failed:', error.message)
    return false
  }
  return data === true
}
