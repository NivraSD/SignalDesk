import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useGroundedStore } from '@/stores/groundedStore'

interface UserRule {
  id?: string
  rule_text: string
  category: string
  is_active: boolean
}

function ShortcutField({ label, value, copyable, secret }: {
  label: string
  value: string
  copyable?: boolean
  secret?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const [revealed, setRevealed] = useState(false)

  const displayValue = secret && !revealed ? value.slice(0, 8) + '...' : value

  const copy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="space-y-0.5">
      <span className="text-[10px] font-medium text-stone-500 uppercase tracking-wide">{label}</span>
      <div className="flex items-center gap-1.5">
        <code className="text-[11px] text-stone-700 bg-white px-2 py-1 rounded border border-stone-200 flex-1 break-all select-all">
          {displayValue}
        </code>
        {secret && (
          <button
            onClick={() => setRevealed(!revealed)}
            className="text-[10px] text-stone-400 px-1.5 py-1 border border-stone-200 rounded bg-white flex-shrink-0"
          >
            {revealed ? 'Hide' : 'Show'}
          </button>
        )}
        {copyable && (
          <button
            onClick={copy}
            className="text-[10px] text-stone-400 px-1.5 py-1 border border-stone-200 rounded bg-white flex-shrink-0"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { userId } = useGroundedStore()
  const [rules, setRules] = useState<UserRule[]>([])
  const [newRule, setNewRule] = useState('')
  const [loadingRules, setLoadingRules] = useState(true)
  const [saving, setSaving] = useState(false)

  // Load rules
  useEffect(() => {
    if (!userId) return
    const load = async () => {
      const { data } = await supabase
        .from('grounded_user_rules')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
      if (data) setRules(data)
      setLoadingRules(false)
    }
    load()
  }, [userId])

  const addRule = async () => {
    if (!newRule.trim() || !userId) return
    setSaving(true)
    const { data, error } = await supabase
      .from('grounded_user_rules')
      .insert({ user_id: userId, rule_text: newRule.trim(), category: 'general', is_active: true })
      .select()
      .single()
    if (!error && data) {
      setRules((prev) => [...prev, data])
      setNewRule('')
    }
    setSaving(false)
  }

  const removeRule = async (id: string) => {
    await supabase.from('grounded_user_rules').delete().eq('id', id)
    setRules((prev) => prev.filter((r) => r.id !== id))
  }

  const toggleRule = async (id: string) => {
    const rule = rules.find((r) => r.id === id)
    if (!rule) return
    const newActive = !rule.is_active
    await supabase.from('grounded_user_rules').update({ is_active: newActive }).eq('id', id)
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, is_active: newActive } : r)))
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="space-y-4">
      <button onClick={() => navigate('/')} className="text-stone-500 text-sm">
        &larr; Back
      </button>
      <h2 className="text-xl font-light text-stone-700 text-center">Settings</h2>

      {/* AI Rules & Guidance */}
      <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
        <h3 className="text-sm font-medium text-stone-700">AI Rules &amp; Guidance</h3>
        <p className="text-xs text-stone-400">
          Tell your AI companion what to prioritize, avoid, or keep in mind. These shape every interaction.
        </p>

        {loadingRules ? (
          <p className="text-xs text-stone-400">Loading...</p>
        ) : (
          <div className="space-y-2">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className={`flex items-start gap-2 p-2 rounded-lg ${
                  rule.is_active ? 'bg-stone-50' : 'bg-stone-50 opacity-50'
                }`}
              >
                <button
                  onClick={() => rule.id && toggleRule(rule.id)}
                  className={`w-4 h-4 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
                    rule.is_active ? 'bg-stone-700 border-stone-700' : 'border-stone-300'
                  }`}
                >
                  {rule.is_active && <span className="text-white text-[10px]">{'\u2713'}</span>}
                </button>
                <span className="text-xs text-stone-600 flex-1">{rule.rule_text}</span>
                <button
                  onClick={() => rule.id && removeRule(rule.id)}
                  className="text-stone-400 text-xs flex-shrink-0"
                >
                  x
                </button>
              </div>
            ))}

            {rules.length === 0 && (
              <p className="text-xs text-stone-400 italic">
                No rules yet. Examples: &quot;Prioritize morning routines&quot;, &quot;I value stoic philosophy&quot;, &quot;Don&apos;t push exercise on bad days&quot;
              </p>
            )}
          </div>
        )}

        {/* Add new rule */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newRule}
            onChange={(e) => setNewRule(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addRule()}
            placeholder="Add a rule or preference..."
            className="flex-1 p-2 border border-stone-200 rounded-lg text-sm"
          />
          <button
            onClick={addRule}
            disabled={!newRule.trim() || saving}
            className="px-3 py-2 bg-stone-700 text-white rounded-lg text-sm disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>

      {/* Account */}
      <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
        <h3 className="text-sm font-medium text-stone-700">Account</h3>
        <div className="flex items-center justify-between">
          <span className="text-sm text-stone-600">{user?.email}</span>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full py-2 border border-stone-200 rounded-lg text-sm text-stone-600"
        >
          Sign Out
        </button>
      </div>

      {/* Google Calendar */}
      <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
        <h3 className="text-sm font-medium text-stone-700">Google Calendar</h3>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full" />
          <span className="text-sm text-stone-600">Connected</span>
        </div>
        <p className="text-xs text-stone-400">
          Calendar events sync automatically via service account.
        </p>
      </div>

      {/* iOS Shortcuts Setup */}
      <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
        <h3 className="text-sm font-medium text-stone-700">iOS Shortcuts</h3>
        <p className="text-xs text-stone-400">
          Set up two automations: one to pre-generate context-aware art every 2 hours, and one to show it when you open your phone.
        </p>

        {/* Shortcut 1: Pre-generate */}
        <div className="bg-stone-50 rounded-lg p-3 space-y-2">
          <h4 className="text-xs font-medium text-stone-600">1. Pre-Generate (every 2 hours)</h4>
          <p className="text-[11px] text-stone-400">Shortcuts app &rarr; Automation &rarr; Time of Day &rarr; repeat every 2 hours (6am–10pm)</p>
          <div className="space-y-1.5">
            <ShortcutField
              label="Action"
              value="Get Contents of URL"
            />
            <ShortcutField
              label="URL"
              value={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/grounded-orchestrate`}
              copyable
            />
            <ShortcutField
              label="Method"
              value="POST"
            />
            <ShortcutField
              label="Header: Content-Type"
              value="application/json"
            />
            <ShortcutField
              label="Header: x-api-key"
              value="36ea35d234cb83fcde687839fafe4f037c22f8822eea8b1faeb23d3cc6705358"
              copyable
              secret
            />
            <ShortcutField
              label="Request Body (JSON)"
              value='{"action":"pre-generate"}'
              copyable
            />
          </div>
        </div>

        {/* Shortcut 2: On-open */}
        <div className="bg-stone-50 rounded-lg p-3 space-y-2">
          <h4 className="text-xs font-medium text-stone-600">2. On Open (shows art screen)</h4>
          <p className="text-[11px] text-stone-400">Shortcuts app &rarr; Automation &rarr; choose a trigger (e.g. Open App, NFC tag, or manual) &rarr; Open URLs</p>
          <ShortcutField
            label="URL to open"
            value={`${window.location.origin}/open`}
            copyable
          />
          <p className="text-[11px] text-stone-400 mt-1">
            Tip: You can also add this as a Home Screen shortcut — in Safari, tap Share &rarr; Add to Home Screen.
          </p>
        </div>
      </div>

      {/* About */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="text-sm font-medium text-stone-700 mb-2">About</h3>
        <p className="text-xs text-stone-500">
          Grounded is a personal wellness and recovery tracker with an AI companion
          that learns your patterns, preferences, and goals over time.
        </p>
      </div>
    </div>
  )
}
