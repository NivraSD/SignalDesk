'use client'

import { useState, useEffect } from 'react'
import { User, Mail, Loader2, Check, X as CloseIcon, Shield } from 'lucide-react'
import { createAuthClient } from '@/lib/supabase/auth-client'
import { useAuth } from '@/components/auth/AuthProvider'

export default function UserProfileSettings() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  const supabase = createAuthClient()

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user!.id)
        .single()

      if (error && error.code !== 'PGRST116') { // Not found error is ok
        throw error
      }

      if (data) {
        setFullName(data.full_name || '')
        setAvatarUrl(data.avatar_url || '')
      } else {
        // Pre-fill from auth metadata if profile doesn't exist
        setFullName(user?.user_metadata?.full_name || '')
      }
    } catch (error: any) {
      console.error('Error loading profile:', error)
      setMessage({ type: 'error', text: 'Failed to load profile' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      // Update or insert user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: user!.id,
          email: user!.email!,
          full_name: fullName,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })

      if (profileError) throw profileError

      // Also update auth user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
        },
      })

      if (authError) throw authError

      setMessage({ type: 'success', text: 'Profile updated successfully!' })

      // Clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      console.error('Error saving profile:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to save profile' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--burnt-orange)' }} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <div
        className="rounded-xl p-6"
        style={{ background: 'var(--grey-900)', border: '1px solid var(--grey-800)' }}
      >
        <div className="mb-6">
          <h2
            className="text-lg font-medium text-white mb-1"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Profile Information
          </h2>
          <p className="text-sm" style={{ color: 'var(--grey-500)' }}>
            Update your personal information and profile picture
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Avatar */}
          <div>
            <label
              className="block text-sm font-medium mb-3"
              style={{ color: 'var(--grey-400)', fontFamily: 'var(--font-display)' }}
            >
              Profile Picture
            </label>
            <div className="flex items-center gap-5">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
                style={{ background: 'var(--grey-800)', border: '2px solid var(--grey-700)' }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10" style={{ color: 'var(--grey-500)' }} />
                )}
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-4 py-2.5 rounded-lg text-white text-sm placeholder-[var(--grey-600)] focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)]"
                  style={{ background: 'var(--grey-800)', border: '1px solid var(--grey-700)' }}
                />
                <p className="text-xs mt-1.5" style={{ color: 'var(--grey-500)' }}>
                  Enter an image URL for your profile picture
                </p>
              </div>
            </div>
          </div>

          {/* Email (read-only) */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--grey-400)', fontFamily: 'var(--font-display)' }}
            >
              Email Address
            </label>
            <div
              className="flex items-center px-4 py-2.5 rounded-lg"
              style={{ background: 'var(--grey-800)/50', border: '1px solid var(--grey-700)' }}
            >
              <Mail className="w-4 h-4 mr-3" style={{ color: 'var(--grey-500)' }} />
              <span className="text-sm flex-1" style={{ color: 'var(--grey-400)' }}>{user?.email}</span>
              <span
                className="px-2 py-0.5 rounded text-xs"
                style={{ background: 'var(--grey-700)', color: 'var(--grey-400)' }}
              >
                Read-only
              </span>
            </div>
            <p className="text-xs mt-1.5" style={{ color: 'var(--grey-500)' }}>
              Email cannot be changed. Contact support if you need to update it.
            </p>
          </div>

          {/* Full Name */}
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--grey-400)', fontFamily: 'var(--font-display)' }}
            >
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              className="w-full px-4 py-2.5 rounded-lg text-white placeholder-[var(--grey-600)] focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)]"
              style={{ background: 'var(--grey-800)', border: '1px solid var(--grey-700)' }}
            />
          </div>

          {/* Message */}
          {message && (
            <div
              className="flex items-center p-4 rounded-lg"
              style={{
                background: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                border: message.type === 'error' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(34, 197, 94, 0.3)'
              }}
            >
              {message.type === 'success' ? (
                <Check className="w-4 h-4 text-green-400 mr-3" />
              ) : (
                <CloseIcon className="w-4 h-4 text-red-400 mr-3" />
              )}
              <span className={message.type === 'error' ? 'text-red-400' : 'text-green-400'}>
                {message.text}
              </span>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              style={{
                background: 'var(--burnt-orange)',
                color: 'white',
                fontFamily: 'var(--font-display)'
              }}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Security Section */}
      <div
        className="rounded-xl p-6"
        style={{ background: 'var(--grey-900)', border: '1px solid var(--grey-800)' }}
      >
        <div className="flex items-start gap-4">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--grey-800)' }}
          >
            <Shield className="w-5 h-5" style={{ color: 'var(--burnt-orange)' }} />
          </div>
          <div className="flex-1">
            <h3
              className="text-sm font-medium text-white mb-1"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Security
            </h3>
            <p className="text-sm mb-3" style={{ color: 'var(--grey-500)' }}>
              Manage your password and account security settings
            </p>
            <a
              href="/auth/reset-password"
              className="text-sm font-medium transition-colors"
              style={{ color: 'var(--burnt-orange)' }}
            >
              Change password
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
