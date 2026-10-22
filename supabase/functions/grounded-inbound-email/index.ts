// Grounded: forward mail sent to any @groundedproject.app address (hello@, privacy@…) to the owner's inbox.
// Resend receives it (MX on the domain) and calls this webhook with `email.received`. Replies go back to
// the original sender. Deployed with --no-verify-jwt; requests are checked against the Svix signature instead.

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const WEBHOOK_SECRET = Deno.env.get('RESEND_INBOUND_WEBHOOK_SECRET')!
const FORWARD_TO = Deno.env.get('INBOUND_FORWARD_TO')!
const FROM = Deno.env.get('EMAIL_FROM') || 'Grounded <notifications@groundedproject.app>'

// Svix scheme: HMAC-SHA256 over `${id}.${timestamp}.${body}` with the base64 secret after "whsec_".
async function verified(req: Request, body: string): Promise<boolean> {
  const id = req.headers.get('svix-id')
  const ts = req.headers.get('svix-timestamp')
  const sigs = req.headers.get('svix-signature')
  if (!id || !ts || !sigs || !WEBHOOK_SECRET) return false
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false
  const key = await crypto.subtle.importKey(
    'raw',
    Uint8Array.from(atob(WEBHOOK_SECRET.replace(/^whsec_/, '')), (c) => c.charCodeAt(0)),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${ts}.${body}`))
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)))
  return sigs.split(' ').some((s) => s.split(',')[1] === expected)
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('POST only', { status: 405 })
  const body = await req.text()
  if (!(await verified(req, body))) return new Response('Bad signature', { status: 401 })

  const event = JSON.parse(body)
  if (event.type !== 'email.received') return new Response('ignored')
  const meta = event.data
  // The Resend account also receives for nivria.ai (NIV Mail handles that); only forward our own domain.
  if (!(meta.to || []).some((t: string) => /@groundedproject\.app>?$/i.test(t.trim()))) return new Response('not ours')

  const h = { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' }
  const r = await fetch(`https://api.resend.com/emails/receiving/${meta.email_id}`, { headers: h })
  if (!r.ok) return new Response(`Fetch failed: ${r.status}`, { status: 502 })
  const email = await r.json()

  const to = (meta.to || []).join(', ')
  const files = (meta.attachments || []).map((a: { filename: string }) => a.filename).filter(Boolean)
  const note = `Sent to ${to} by ${meta.from}${files.length ? ` · attachments (see Resend): ${files.join(', ')}` : ''}`

  const send = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: h,
    body: JSON.stringify({
      from: FROM,
      to: [FORWARD_TO],
      reply_to: meta.from,
      subject: `[Grounded] ${meta.subject || '(no subject)'}`,
      text: `${note}\n\n${email.text || ''}`,
      ...(email.html && { html: `<p style="color:#78716c;font-size:12px">${note.replace(/</g, '&lt;')}</p>${email.html}` }),
    }),
  })
  if (!send.ok) return new Response(`Forward failed: ${send.status} ${await send.text()}`, { status: 502 })
  return new Response('forwarded')
})
