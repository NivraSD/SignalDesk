'use client'

// "Connect your AI tools": how to add NIV's MCP server to Claude, ChatGPT, Cursor… Most apps sign in
// with Nivria (OAuth); a personal access token covers the rest. Either acts as you, in this
// organization, with exactly your permissions. Lists connected apps and tokens, with revoke.
import React, { useCallback, useEffect, useState } from 'react'
import { X, Copy, Check, Plug, Trash2, Loader2 } from 'lucide-react'

type Token = { id: string; name: string; prefix: string; created_at: string; last_used_at: string | null; kind?: 'token' | 'app' }
type Tab = 'claude' | 'chatgpt' | 'claude-code' | 'cursor' | 'token'

function CopyBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="relative">
      <pre className="text-[11px] leading-relaxed bg-black/40 border border-[var(--grey-800)] rounded-lg p-3 pr-16 overflow-x-auto whitespace-pre text-[var(--grey-300)]">{text}</pre>
      <button
        onClick={async () => { try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch {} }}
        className="absolute top-2 right-2 text-[11px] px-2 py-1 rounded bg-[var(--grey-800)] text-[var(--grey-300)] inline-flex items-center gap-1"
      >
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}

export default function ConnectTools({ organizationId, onClose }: { organizationId: string; onClose: () => void }) {
  const [tokens, setTokens] = useState<Token[]>([])
  const [name, setName] = useState('Claude Desktop')
  const [created, setCreated] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('claude')
  const url = typeof window !== 'undefined' ? `${window.location.origin}/api/mcp` : 'https://nivria.ai/api/mcp'
  const token = created || '<your NIV token>'

  const load = useCallback(async () => {
    const r = await fetch(`/api/niv-tokens?organizationId=${organizationId}`)
    const j = await r.json().catch(() => ({}))
    if (r.ok) setTokens(j.tokens || [])
  }, [organizationId])
  useEffect(() => { load() }, [load])

  const create = async () => {
    setBusy(true); setError(null)
    const r = await fetch('/api/niv-tokens', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ organizationId, name }) })
    const j = await r.json().catch(() => ({}))
    if (r.ok) { setCreated(j.token); load() } else setError(j.error || 'Could not create a token.')
    setBusy(false)
  }
  const revoke = async (id: string) => {
    await fetch('/api/niv-tokens', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ organizationId, id }) })
    load()
  }

  const tokenSnippets = {
    'claude-code': `claude mcp add --transport http niv ${url} \\\n  --header "Authorization: Bearer ${token}"`,
    'claude-desktop': JSON.stringify({ mcpServers: { niv: { command: 'npx', args: ['-y', 'mcp-remote', url, '--header', `Authorization: Bearer ${token}`] } } }, null, 2),
    cursor: JSON.stringify({ mcpServers: { niv: { url, headers: { Authorization: `Bearer ${token}` } } } }, null, 2),
  }
  const signIn: Record<Exclude<Tab, 'token'>, { steps: string[]; snippet: string }> = {
    claude: {
      steps: ['In claude.ai, go to Settings → Connectors → Add custom connector.', 'Name it NIV and paste this URL.', 'Click Connect and sign in with your Nivria account. It also shows up in Claude Desktop and Claude on your phone.'],
      snippet: url,
    },
    chatgpt: {
      steps: ['In ChatGPT, open Settings → Apps & Connectors (turn on Developer mode under Advanced if you don\u2019t see Create).', 'Create a connector named NIV with this URL and OAuth authentication.', 'Sign in with your Nivria account when asked.'],
      snippet: url,
    },
    'claude-code': {
      steps: ['Run this in your terminal.', 'Then type /mcp in Claude Code, pick niv, and sign in with your Nivria account.'],
      snippet: `claude mcp add --transport http niv ${url}`,
    },
    cursor: {
      steps: ['Add this to ~/.cursor/mcp.json (or .cursor/mcp.json in a project).', 'Cursor shows a Connect button for niv in Settings → MCP; click it and sign in with your Nivria account.'],
      snippet: JSON.stringify({ mcpServers: { niv: { url } } }, null, 2),
    },
  }
  const TABS: [Tab, string][] = [['claude', 'Claude'], ['chatgpt', 'ChatGPT'], ['claude-code', 'Claude Code'], ['cursor', 'Cursor'], ['token', 'Other (token)']]

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--grey-800)] bg-[var(--grey-900,#141414)] p-5 space-y-5 text-sm text-[var(--grey-300)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg text-white flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}><Plug className="w-4 h-4 text-[var(--burnt-orange)]" /> Connect your AI tools</h2>
            <p className="text-xs text-[var(--grey-500)] mt-1">Use NIV from Claude, ChatGPT, Cursor and other MCP tools. A connection acts as you, in this organization, with exactly your access: company documents, intel, the Memory Vault, and Ask NIV.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-[var(--grey-500)] hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-1 text-xs">
            {TABS.map(([k, label]) => (
              <button key={k} onClick={() => setTab(k)} className={`px-2.5 py-1 rounded-md ${tab === k ? 'bg-[var(--grey-800)] text-white' : 'text-[var(--grey-500)] hover:text-[var(--grey-300)]'}`}>{label}</button>
            ))}
          </div>

          {tab !== 'token' ? (
            <>
              <ol className="list-decimal pl-5 space-y-1 text-xs text-[var(--grey-400,#a3a3a3)]">
                {signIn[tab].steps.map((st) => <li key={st}>{st}</li>)}
              </ol>
              <CopyBlock text={signIn[tab].snippet} />
            </>
          ) : (
            <>
              <p className="text-xs text-[var(--grey-500)]">For tools that can&rsquo;t sign in. Create a token, then use one of these. The token is shown once.</p>
              {created ? (
                <div className="rounded-lg border border-[var(--burnt-orange-muted,#7a3d22)] p-3 space-y-2">
                  <div className="text-xs text-[var(--burnt-orange)]">Your new token. Copy it now; it won't be shown again.</div>
                  <CopyBlock text={created} />
                </div>
              ) : (
                <div className="flex gap-2">
                  <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Name (e.g. Claude Desktop)" className="flex-1 bg-[var(--grey-800)] border border-[var(--grey-700)] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[var(--burnt-orange)]" />
                  <button onClick={create} disabled={busy} className="px-3 py-2 rounded-lg bg-[var(--burnt-orange)] text-white disabled:opacity-50 inline-flex items-center gap-1.5">
                    {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Create token
                  </button>
                </div>
              )}
              {error && <div className="text-xs text-red-400">{error}</div>}
              <div className="text-xs text-[var(--grey-500)]">Claude Code</div>
              <CopyBlock text={tokenSnippets['claude-code']} />
              <div className="text-xs text-[var(--grey-500)]">Claude Desktop (claude_desktop_config.json)</div>
              <CopyBlock text={tokenSnippets['claude-desktop']} />
              <div className="text-xs text-[var(--grey-500)]">Cursor and others that take headers</div>
              <CopyBlock text={tokenSnippets.cursor} />
            </>
          )}
        </div>

        <div className="space-y-2">
          <div className="text-xs uppercase tracking-wide text-[var(--grey-500)]">Connected apps and tokens</div>
          {!tokens.length && <div className="text-xs text-[var(--grey-500)]">None yet.</div>}
          {tokens.map((t) => (
            <div key={t.id} className="flex items-center justify-between text-xs border border-[var(--grey-800)] rounded-lg px-3 py-2">
              <div className="min-w-0">
                <div className="text-white truncate">{t.name} <span className="text-[var(--grey-500)]">· {t.kind === 'app' ? 'signed in' : `token ${t.prefix}…`}</span></div>
                <div className="text-[var(--grey-500)]">{t.kind === 'app' ? 'Connected' : 'Created'} {new Date(t.created_at).toLocaleDateString()} · {t.last_used_at ? `last used ${new Date(t.last_used_at).toLocaleString()}` : 'never used'}</div>
              </div>
              <button onClick={() => revoke(t.id)} className="text-[var(--grey-500)] hover:text-red-400 inline-flex items-center gap-1 flex-none ml-2"><Trash2 className="w-3.5 h-3.5" /> {t.kind === 'app' ? 'Disconnect' : 'Revoke'}</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
