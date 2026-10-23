// Gemini Flash text call, the same model and settings the rest of SignalDesk uses
// (see mcp-opportunity-detector-v2). Returns the reply text; throws on API errors.
//  - thinkingLevel must nest under thinkingConfig (flat is a 400), and thinking tokens count against
//    maxOutputTokens, so keep that generous even for one-word answers.
//  - No temperature/top_p: Gemini 3.x is tuned for the defaults.

export const GEMINI_FLASH_MODEL = 'gemini-3.5-flash'

export async function callGeminiFlash(
  prompt: string,
  opts: { maxOutputTokens?: number; json?: boolean; system?: string; timeoutMs?: number } = {}
): Promise<string> {
  const key = Deno.env.get('GOOGLE_API_KEY') || Deno.env.get('GEMINI_API_KEY')
  if (!key) throw new Error('GOOGLE_API_KEY not configured')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 60000)
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_FLASH_MODEL}:generateContent?key=${key}`,
      {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(opts.system && { systemInstruction: { parts: [{ text: opts.system }] } }),
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: opts.maxOutputTokens ?? 8000,
            ...(opts.json && { responseMimeType: 'application/json' }),
            thinkingConfig: { thinkingLevel: 'low' },
          },
        }),
      }
    )
    if (!r.ok) throw new Error(`Gemini API error ${r.status}: ${(await r.text()).slice(0, 300)}`)
    const data = await r.json()
    const text = (data.candidates?.[0]?.content?.parts || []).map((p: { text?: string }) => p.text || '').join('')
    if (!text) throw new Error(`Gemini returned no text (finishReason: ${data.candidates?.[0]?.finishReason ?? 'none'})`)
    return text
  } finally {
    clearTimeout(timer)
  }
}
