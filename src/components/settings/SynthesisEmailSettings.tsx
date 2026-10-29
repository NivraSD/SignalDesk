'use client'

// "Email me the executive synthesis": each member turns it on for themselves, per organization.
import { useEffect, useState } from 'react'
import { Mail, Loader2 } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'

export default function SynthesisEmailSettings() {
  const { organization } = useAppStore()
  const [enabled, setEnabled] = useState(false)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (!organization?.id) return
    setLoading(true)
    fetch(`/api/synthesis-emails?organizationId=${organization.id}`)
      .then((r) => r.json())
      .then((j) => { setEnabled(!!j.enabled); setEmail(j.email || '') })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [organization?.id])

  const save = async (nextEnabled: boolean) => {
    if (!organization?.id) return
    setSaving(true); setMessage(null)
    const r = await fetch('/api/synthesis-emails', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizationId: organization.id, enabled: nextEnabled, email }),
    })
    const j = await r.json().catch(() => ({}))
    if (r.ok) {
      setEnabled(!!j.enabled); if (j.email) setEmail(j.email)
      setMessage({ type: 'success', text: j.enabled ? `You'll get each new synthesis at ${j.email}.` : 'Synthesis emails are off.' })
    } else {
      setMessage({ type: 'error', text: j.error || 'Could not save.' })
    }
    setSaving(false)
  }

  if (!organization?.id) return null

  return (
    <div className="rounded-xl p-6" style={{ background: 'var(--grey-900)', border: '1px solid var(--grey-800)' }}>
      <div className="mb-5">
        <h2 className="text-lg font-medium text-white mb-1 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
          <Mail className="w-4 h-4" style={{ color: 'var(--burnt-orange)' }} /> Executive synthesis email
        </h2>
        <p className="text-sm" style={{ color: 'var(--grey-500)' }}>
          Get the key developments from each new {organization.name} synthesis by email, with links to the articles.
        </p>
      </div>

      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--grey-500)' }} />
      ) : (
        <div className="space-y-4">
          <label className="block">
            <span className="block text-sm font-medium mb-2" style={{ color: 'var(--grey-400)', fontFamily: 'var(--font-display)' }}>Send to</span>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com"
              className="w-full max-w-sm rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              style={{ background: 'var(--grey-800)', border: '1px solid var(--grey-700)' }}
            />
          </label>
          <div className="flex items-center gap-3">
            {enabled ? (
              <>
                <button onClick={() => save(true)} disabled={saving} className="px-4 py-2 rounded-lg text-sm text-white disabled:opacity-50" style={{ background: 'var(--burnt-orange)' }}>Update address</button>
                <button onClick={() => save(false)} disabled={saving} className="px-4 py-2 rounded-lg text-sm disabled:opacity-50" style={{ color: 'var(--grey-400)', border: '1px solid var(--grey-700)' }}>Turn off</button>
              </>
            ) : (
              <button onClick={() => save(true)} disabled={saving} className="px-4 py-2 rounded-lg text-sm text-white disabled:opacity-50 inline-flex items-center gap-2" style={{ background: 'var(--burnt-orange)' }}>
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Email me each synthesis
              </button>
            )}
          </div>
          {message && <p className="text-sm" style={{ color: message.type === 'success' ? 'var(--grey-400)' : '#f87171' }}>{message.text}</p>}
        </div>
      )}
    </div>
  )
}
