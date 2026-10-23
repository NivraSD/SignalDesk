import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

// Lock screen art: how to set Grounded's art as the iPhone wallpaper with the Shortcuts app.
// Links come from the server: each person's own private wallpaper key, never in the app bundle.

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
  const [open, setOpen] = useState(false)
  const [links, setLinks] = useState<Links | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showOwnText, setShowOwnText] = useState(false)

  useEffect(() => {
    if (!open || links) return
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const r = await fetch('/api/wallpaper-link', { headers: { Authorization: `Bearer ${session.access_token}` } })
      if (r.ok) setLinks(await r.json())
      else setError("Couldn't load your link. Try again in a moment.")
    })()
  }, [open, links])

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between text-left">
        <span>
          <span className="block text-sm font-medium text-stone-700">Put new art on your lock screen</span>
          <span className="block text-xs text-stone-400">A new piece each time, set automatically (iPhone)</span>
        </span>
        <span className="text-stone-400 text-sm">{open ? '−' : '+'}</span>
      </button>

      {open && (
        <div className="space-y-3">
          <p className="text-xs text-stone-500">
            One-off: tap <b>Save</b> above, then in Photos tap Share → <b>Use as Wallpaper</b>. To have it change by
            itself, make this shortcut once (about two minutes):
          </p>

          {error && <p className="text-xs text-red-600">{error}</p>}
          {!links && !error && <p className="text-xs text-stone-400">…</p>}

          {links?.available && (
            <>
              <ol className="space-y-2.5 text-xs text-stone-600 list-decimal pl-4">
                <li>
                  Copy your link. It&apos;s private to you, so don&apos;t share it.
                  <div className="mt-2">
                    <CopyLink label="Your wallpaper link" url={links.captioned!} />
                  </div>
                </li>
                <li>
                  Open the <b>Shortcuts</b> app → <b>Shortcuts</b> tab → <b>+</b> (top right).
                </li>
                <li>
                  Tap <b>Add Action</b>, search <b>Get Contents of URL</b>, add it, tap the blue <b>URL</b> and paste your link.
                </li>
                <li>
                  Search <b>Set Wallpaper</b> and add <b>Set Wallpaper Photo</b> under it. Make sure it says <b>Lock Screen</b>,
                  tap the arrow ▸ and turn off <b>Show Preview</b> (and <b>Crop to Subject</b>).
                </li>
                <li>
                  Tap the name at the top, call it <b>Grounded Art</b>, then <b>Done</b>. Tap it once to try it.
                </li>
                <li>
                  To make it change on its own: <b>Automation</b> tab → <b>+</b> → <b>Time of Day</b>, pick a time (add more
                  automations for more changes a day), choose <b>Run Immediately</b>, then pick <b>Grounded Art</b>.
                </li>
              </ol>

              <button onClick={() => setShowOwnText((v) => !v)} className="text-xs text-stone-400 underline">
                {showOwnText ? 'Hide' : 'Prefer to add the title yourself?'}
              </button>
              {showOwnText && (
                <div className="space-y-3 bg-stone-50 rounded-lg p-3">
                  <p className="text-xs text-stone-500">
                    Use these two links instead: get the title, get the image, then add <b>Overlay Text</b> before
                    <b> Set Wallpaper Photo</b>. Run them within 30 seconds of each other so the title matches the image.
                  </p>
                  <CopyLink label="Title" url={links.title!} />
                  <CopyLink label="Image" url={links.image!} />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
