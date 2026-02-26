import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Plus, Trash2, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useGroundedStore } from '@/stores/groundedStore'
import type { UserRule } from '@/types'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { signOut, user } = useAuth()
  const userId = useGroundedStore((s) => s.userId)
  const [rules, setRules] = useState<UserRule[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newRule, setNewRule] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!userId) return
    supabase.from('grounded_user_rules').select('*').eq('user_id', userId).eq('is_active', true).then(({ data }) => {
      setRules((data ?? []) as UserRule[])
    })
    supabase.from('grounded_user_settings').select('*').eq('user_id', userId).maybeSingle().then(({ data }) => {
      if (data) setDisplayName(data.display_name ?? '')
    })
  }, [userId])

  async function addRule() {
    if (!userId || !newRule.trim()) return
    const { data } = await supabase
      .from('grounded_user_rules')
      .insert({ user_id: userId, rule_text: newRule.trim(), category: 'general', is_active: true })
      .select()
      .single()
    if (data) setRules((prev) => [...prev, data as UserRule])
    setNewRule('')
    setShowAdd(false)
  }

  async function removeRule(id: string) {
    await supabase.from('grounded_user_rules').update({ is_active: false }).eq('id', id)
    setRules((prev) => prev.filter((r) => r.id !== id))
  }

  async function saveName() {
    if (!userId) return
    setSaving(true)
    await supabase.from('grounded_user_settings').upsert({
      user_id: userId,
      display_name: displayName.trim() || null,
    }, { onConflict: 'user_id' })
    setSaving(false)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-6 space-y-6">
      <h1 className="text-2xl font-light text-stone-800">Settings</h1>

      {/* Display name */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 space-y-3">
        <h2 className="text-sm font-medium text-stone-700">Display Name</h2>
        <div className="flex gap-2">
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            className="flex-1 px-3 py-2 rounded-lg bg-stone-50 text-sm focus:outline-none"
          />
          <button onClick={saveName} disabled={saving} className="px-4 py-2 rounded-lg bg-stone-800 text-white text-sm disabled:opacity-50">
            Save
          </button>
        </div>
      </div>

      {/* AI Rules */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-stone-700">AI Guidance Rules</h2>
          <button onClick={() => setShowAdd(!showAdd)} className="text-stone-400">
            {showAdd ? <X size={16} /> : <Plus size={16} />}
          </button>
        </div>
        <p className="text-xs text-stone-400">Tell your AI companion how to talk to you.</p>

        {showAdd && (
          <div className="flex gap-2">
            <input
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              placeholder='e.g., "Prioritize morning routines"'
              className="flex-1 px-3 py-2 rounded-lg bg-stone-50 text-sm focus:outline-none"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && addRule()}
            />
            <button onClick={addRule} className="px-3 py-2 rounded-lg bg-stone-800 text-white text-sm">Add</button>
          </div>
        )}

        {rules.length > 0 && (
          <div className="space-y-2">
            {rules.map((r) => (
              <div key={r.id} className="flex items-center gap-2 text-sm text-stone-600 bg-stone-50 rounded-lg px-3 py-2">
                <span className="flex-1">{r.rule_text}</span>
                <button onClick={() => removeRule(r.id)} className="text-stone-300 hover:text-red-400 shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="space-y-2">
        {[
          { label: 'Activity Bank', path: '/activities' },
          { label: 'Vision Board', path: '/vision' },
          { label: 'Calendar', path: '/calendar' },
          { label: 'Reminders', path: '/reminders' },
        ].map(({ label, path }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="w-full bg-white rounded-xl p-4 border border-stone-200 text-left text-sm font-medium text-stone-700"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Account info */}
      <div className="text-xs text-stone-400 text-center">{user?.email}</div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="w-full py-3 rounded-xl border border-red-200 text-red-500 font-medium flex items-center justify-center gap-2"
      >
        <LogOut size={16} /> Sign Out
      </button>
    </div>
  )
}
