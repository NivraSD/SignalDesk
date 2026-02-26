import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useGroundedStore } from '@/stores/groundedStore'
import { Copy, Check, Smartphone } from 'lucide-react'

interface UserRule {
  id?: string
  rule_text: string
  category: string
  is_active: boolean
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

export default function SettingsPage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { userId } = useGroundedStore()
  const [rules, setRules] = useState<UserRule[]>([])
  const [newRule, setNewRule] = useState('')
  const [loadingRules, setLoadingRules] = useState(true)
  const [saving, setSaving] = useState(false)

  // API key state
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [loadingKey, setLoadingKey] = useState(true)
  const [generatingKey, setGeneratingKey] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showSetup, setShowSetup] = useState(false)

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

  // Load API key
  useEffect(() => {
    if (!userId) return
    const load = async () => {
      const { data } = await supabase
        .from('grounded_api_keys')
        .select('api_key')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(1)
        .single()
      if (data) setApiKey(data.api_key)
      setLoadingKey(false)
    }
    load()
  }, [userId])

  const generateApiKey = async () => {
    if (!userId) return
    setGeneratingKey(true)
    // Deactivate existing keys
    await supabase
      .from('grounded_api_keys')
      .update({ is_active: false })
      .eq('user_id', userId)

    const { data, error } = await supabase
      .from('grounded_api_keys')
      .insert({ user_id: userId, label: 'iOS Shortcut' })
      .select('api_key')
      .single()

    if (!error && data) setApiKey(data.api_key)
    setGeneratingKey(false)
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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

  const shortcutUrl = apiKey
    ? `${SUPABASE_URL}/functions/v1/grounded-art?key=${apiKey}&action=generate`
    : ''

  return (
    <div className="space-y-4">
      <button onClick={() => navigate('/')} className="text-stone-500 text-sm">
        &larr; Back
      </button>
      <h2 className="text-xl font-light text-stone-700 text-center">Settings</h2>

      {/* Activity Bank */}
      <button
        onClick={() => navigate('/activities')}
        className="w-full bg-white rounded-xl p-4 shadow-sm flex items-center justify-between"
      >
        <div>
          <h3 className="text-sm font-medium text-stone-700 text-left">Activity Bank</h3>
          <p className="text-xs text-stone-400">Manage activities for each life area</p>
        </div>
        <span className="text-stone-400">&rarr;</span>
      </button>

      {/* Wallpaper Shortcut */}
      <div className="bg-white rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Smartphone size={16} className="text-stone-600" />
          <h3 className="text-sm font-medium text-stone-700">Auto Wallpaper</h3>
        </div>
        <p className="text-xs text-stone-400">
          Set up an iOS Shortcut that generates fresh art and sets it as your lock screen throughout the day.
        </p>

        {loadingKey ? (
          <p className="text-xs text-stone-400">Loading...</p>
        ) : !apiKey ? (
          <button
            onClick={generateApiKey}
            disabled={generatingKey}
            className="w-full py-2 bg-stone-700 text-white rounded-lg text-sm disabled:opacity-50"
          >
            {generatingKey ? 'Generating...' : 'Generate API Key'}
          </button>
        ) : (
          <div className="space-y-3">
            {/* API Key display */}
            <div className="flex items-center gap-2">
              <code className="flex-1 text-[11px] bg-stone-50 p-2 rounded-lg text-stone-600 truncate">
                {apiKey}
              </code>
              <button
                onClick={() => copyToClipboard(apiKey)}
                className="p-2 bg-stone-100 rounded-lg flex-shrink-0"
              >
                {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} className="text-stone-500" />}
              </button>
            </div>

            {/* Quick copy URL */}
            <button
              onClick={() => copyToClipboard(shortcutUrl)}
              className="w-full py-2 bg-stone-700 text-white rounded-lg text-sm"
            >
              Copy Shortcut URL
            </button>

            {/* Setup instructions toggle */}
            <button
              onClick={() => setShowSetup(!showSetup)}
              className="text-xs text-stone-500 underline"
            >
              {showSetup ? 'Hide setup instructions' : 'How to set up the iOS Shortcut'}
            </button>

            {showSetup && (
              <div className="bg-stone-50 rounded-lg p-3 space-y-2 text-xs text-stone-600">
                <p className="font-medium text-stone-700">iOS Shortcut Setup:</p>
                <ol className="list-decimal list-inside space-y-1.5">
                  <li>Open <strong>Shortcuts</strong> app, tap <strong>+</strong></li>
                  <li>Add <strong>Get Contents of URL</strong> — paste Shortcut URL</li>
                  <li>Add <strong>Get Dictionary Value</strong> — key: <strong>title</strong></li>
                  <li>Add <strong>Set Variable</strong> — name it <strong>ArtTitle</strong></li>
                  <li>Long-press step 2 output, add <strong>Get Dictionary Value</strong> — key: <strong>image_url</strong></li>
                  <li>Add <strong>Get Contents of URL</strong> (downloads the image)</li>
                  <li>Add <strong>Overlay Text</strong> — tap text field, select <strong>ArtTitle</strong> variable. Set font small, white, ~50% opacity, position lower-left</li>
                  <li>Add <strong>Set Wallpaper</strong> — choose Lock Screen</li>
                </ol>
                <p className="font-medium text-stone-700 pt-2">Auto-schedule:</p>
                <ol className="list-decimal list-inside space-y-1.5">
                  <li>Go to <strong>Automation</strong> tab</li>
                  <li>Tap <strong>+</strong> &rarr; <strong>Time of Day</strong></li>
                  <li>Set times (e.g., 8 AM, 1 PM, 7 PM)</li>
                  <li>Select your "Fresh Art" shortcut</li>
                  <li>Turn off "Ask Before Running"</li>
                </ol>
                <p className="text-stone-400 pt-1">
                  Each run generates a unique piece and sets it as your lock screen. Takes ~15 seconds.
                </p>
              </div>
            )}

            {/* Regenerate key */}
            <button
              onClick={generateApiKey}
              disabled={generatingKey}
              className="text-xs text-stone-400 underline"
            >
              Regenerate key
            </button>
          </div>
        )}
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
