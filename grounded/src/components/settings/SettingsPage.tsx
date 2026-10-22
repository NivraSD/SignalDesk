import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import LockScreenArt from './LockScreenArt'
import { CONTRIBUTE_URL } from '@/lib/constants'
import { useGroundedStore } from '@/stores/groundedStore'

interface UserRule {
  id?: string
  rule_text: string
  category: string
  is_active: boolean
}


export default function SettingsPage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { userId, showPills, setShowPills } = useGroundedStore()

  // Optional pill tracker: saved per person; Home hides the card when off.
  const togglePills = async () => {
    if (!userId) return
    const next = !showPills
    setShowPills(next)
    const { error } = await supabase
      .from('grounded_user_settings')
      .upsert({ user_id: userId, show_pills: next }, { onConflict: 'user_id' })
    if (error) setShowPills(!next)
  }
  const [rules, setRules] = useState<UserRule[]>([])
  const [newRule, setNewRule] = useState('')
  const [loadingRules, setLoadingRules] = useState(true)
  const [saving, setSaving] = useState(false)
  const [clearState, setClearState] = useState<'idle' | 'confirm' | 'clearing' | 'done' | 'error'>('idle')

  // Hides the conversation from the Chat screen only; messages stay stored and the companion keeps them.
  const clearChat = async () => {
    if (!userId) return
    setClearState('clearing')
    const { error } = await supabase
      .from('grounded_user_settings')
      .upsert({ user_id: userId, chat_cleared_at: new Date().toISOString() }, { onConflict: 'user_id' })
    setClearState(error ? 'error' : 'done')
  }

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

      {/* You */}
      <div className="bg-white rounded-xl shadow-sm divide-y divide-stone-100">
        <button onClick={() => navigate('/you')} className="w-full flex items-center justify-between p-4 text-left">
          <span>
            <span className="block text-sm font-medium text-stone-700">About you</span>
            <span className="block text-xs text-stone-400">Your story, in your words, and what Grounded has learned</span>
          </span>
          <span className="text-stone-300">&rsaquo;</span>
        </button>
        <button onClick={() => navigate('/welcome?areas')} className="w-full flex items-center justify-between p-4 text-left">
          <span>
            <span className="block text-sm font-medium text-stone-700">Your areas</span>
            <span className="block text-xs text-stone-400">Rename or turn off the parts of life Grounded checks in on</span>
          </span>
          <span className="text-stone-300">&rsaquo;</span>
        </button>
        <div className="w-full flex items-center justify-between p-4">
          <span>
            <span className="block text-sm font-medium text-stone-700">Pill tracker</span>
            <span className="block text-xs text-stone-400">Show the four daily pill checks on Home</span>
          </span>
          <button
            onClick={togglePills}
            aria-pressed={showPills}
            aria-label="Show pill tracker on Home"
            className={`flex-none w-11 h-6 rounded-full transition-colors ${showPills ? 'bg-stone-700' : 'bg-stone-200'}`}
          >
            <span className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${showPills ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>

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

      {/* Chat */}
      <div className="bg-white rounded-xl p-4 shadow-sm space-y-2">
        <h3 className="text-sm font-medium text-stone-700">Chat</h3>
        <p className="text-xs text-stone-500">
          Clear the conversation from your screen. Nothing is deleted &mdash; Grounded still remembers it.
        </p>
        {clearState === 'confirm' ? (
          <div className="flex gap-2">
            <button onClick={clearChat} className="flex-1 py-2 bg-stone-700 text-white rounded-lg text-sm">
              Clear chat
            </button>
            <button onClick={() => setClearState('idle')} className="flex-1 py-2 border border-stone-200 rounded-lg text-sm">
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setClearState('confirm')}
            disabled={clearState === 'clearing'}
            className="w-full py-2 border border-stone-200 rounded-lg text-sm text-stone-700 disabled:opacity-50"
          >
            {clearState === 'clearing' ? 'Clearing…' : 'Clear chat'}
          </button>
        )}
        {clearState === 'done' && <p className="text-xs text-stone-500">Chat cleared.</p>}
        {clearState === 'error' && <p className="text-xs text-red-600">Couldn&apos;t clear chat. Try again.</p>}
      </div>

      {/* Lock screen art */}
      <LockScreenArt />

      {/* About */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="text-sm font-medium text-stone-700 mb-2">About</h3>
        <p className="text-xs text-stone-500">
          Grounded is a personal wellness and recovery tracker with an AI companion
          that learns your patterns, preferences, and goals over time.
        </p>
        {new URLSearchParams(window.location.search).has('contributed') && (
          <p className="mt-3 text-xs text-stone-600">Thank you. It genuinely helps keep Grounded free.</p>
        )}
        {CONTRIBUTE_URL && (
          <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
            <p className="text-xs text-stone-500">Grounded is free. Modest contributions go a long way.</p>
            <a
              href={CONTRIBUTE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-none text-xs px-3 py-1.5 rounded-full bg-stone-700 text-white"
            >
              Contribute
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
