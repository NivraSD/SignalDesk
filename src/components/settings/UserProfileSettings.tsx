'use client'

import { useState, useEffect } from 'react'
import { User, Mail, Camera, Loader, Check, X as CloseIcon } from 'lucide-react'
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
      <div className="flex items-center justify-center p-8">
        <Loader className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-2">Profile Settings</h2>
        <p className="text-gray-400 text-sm">Manage your personal information</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Avatar */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Profile Picture
          </label>
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-gray-700 border border-gray-600 rounded-full flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-gray-400" />
              )}
            </div>
            <div>
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="w-64 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Enter image URL</p>
            </div>
          </div>
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email
          </label>
          <div className="flex items-center px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg">
            <Mail className="w-4 h-4 text-gray-400 mr-2" />
            <span className="text-gray-400 text-sm">{user?.email}</span>
            <span className="ml-2 px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-400">
              Read-only
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Email cannot be changed. Contact support if you need to update it.
          </p>
        </div>

        {/* Full Name */}
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Doe"
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Message */}
        {message && (
          <div className={`flex items-center p-3 rounded-lg ${
            message.type === 'error'
              ? 'bg-red-900/20 border border-red-700'
              : 'bg-green-900/20 border border-green-700'
          }`}>
            {message.type === 'success' ? (
              <Check className="w-4 h-4 text-green-400 mr-2" />
            ) : (
              <CloseIcon className="w-4 h-4 text-red-400 mr-2" />
            )}
            <span className={message.type === 'error' ? 'text-red-300' : 'text-green-300'}>
              {message.text}
            </span>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center"
          >
            {saving ? (
              <>
                <Loader className="w-4 h-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>

      {/* Password Change Link */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <h3 className="text-sm font-medium text-gray-300 mb-2">Security</h3>
        <a
          href="/auth/reset-password"
          className="text-sm text-blue-400 hover:text-blue-300 underline"
        >
          Change password
        </a>
      </div>
    </div>
  )
}
