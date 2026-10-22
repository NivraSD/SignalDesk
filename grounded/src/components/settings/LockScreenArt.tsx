import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

// Lock screen art: how to set Grounded's art as the iPhone wallpaper with the Shortcuts app.
// Links come from the server (they carry the wallpaper key), only for the signed-in owner.

interface Links { available: boolean; captioned?: string; title?: string; image?: string }

function CopyLink({ label, url }: { label: string; url: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked: the link is still selectable below */
    }
  }
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-stone-500">{label}</span>
        <button onClick={copy} className="text-xs px-2.5 py-1 rounded-full bg-stone-700 text-white">
          {copied ? 'Copied' : 'Copy link'}
        </button>
      </div>
      <p className="text-[11px] text-stone-400 break-all select-all">{url}</p>
    </div>
  )
}

export default function LockScreenArt() {
  const [links, setLinks] = useState<Links | null>(null)
  const [showOwnText, setShowOwnText] = useState(false)

  useEffect(() => {
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const r = await fetch('/api/wallpaper-link', { headers: { Authorization: `Bearer ${session.access_token}` } })
      setLinks(r.ok ? await r.json() : { available: false })
    })()
  }, [])

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-stone-700">Lock screen art</h3>
        <p className="text-xs text-stone-500">
          Put a new piece of Grounded art, with its title, on your lock screen. Each time it runs you get a piece you
          haven&apos;t seen.
        </p>
      </div>

      {!links ? (
        <p className="text-xs text-stone-400">…</p>
      ) : !links.available ? (
        <p className="text-xs text-stone-500">Lock screen art isn&apos;t available for your account yet.</p>
      ) : (
        <>
          <ol className="space-y-2 text-xs text-stone-600 list-decimal pl-4">
            <li>
              Open the <b>Shortcuts</b> app and tap <b>+</b> to make a new shortcut.
            </li>
            <li>
              Add <b>Get Contents of URL</b> and paste this link:
              <div className="mt-2">
                <CopyLink label="Wallpaper with title" url={links.captioned!} />
              </div>
            </li>
            <li>
              Add <b>Set Wallpaper</b>, choose <b>Lock Screen</b>, and turn off <b>Show Preview</b>.
            </li>
            <li>
              To run it on its own: <b>Automation</b> tab → <b>+</b> → <b>Time of Day</b>, pick when, then
              <b> Run Immediately</b> and choose your shortcut. Or add it to your Home Screen to run it with one tap.
            </li>
          </ol>

          <button onClick={() => setShowOwnText((v) => !v)} className="text-xs text-stone-500 underline">
            {showOwnText ? 'Hide' : 'Prefer to add the title yourself?'}
          </button>
          {showOwnText && (
            <div className="space-y-3 bg-stone-50 rounded-lg p-3">
              <p className="text-xs text-stone-500">
                Use these two links instead: get the title, get the image, then add <b>Overlay Text</b> before
                <b> Set Wallpaper</b>. Run them within 30 seconds of each other so the title matches the image.
              </p>
              <CopyLink label="Title" url={links.title!} />
              <CopyLink label="Image" url={links.image!} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
