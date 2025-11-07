'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createAuthClient } from '@/lib/supabase/auth-client'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null)
  const router = useRouter()

  const supabase = createAuthClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (password !== confirmPassword) {
      setMessage({
        type: 'error',
        text: 'Passwords do not match',
      })
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setMessage({
        type: 'error',
        text: 'Password must be at least 6 characters',
      })
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) throw error

      setMessage({
        type: 'success',
        text: 'Password updated successfully! Redirecting...',
      })

      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      setMessage({
        type: 'error',
        text: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Update Password</h1>
          <p className="text-gray-400">Enter your new password.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              placeholder="••••••••"
            />
          </div>

          {message && (
            <div className={`p-3 rounded-lg ${
              message.type === 'error'
                ? 'bg-red-900/20 border border-red-700 text-red-300'
                : 'bg-green-900/20 border border-green-700 text-green-300'
            }`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
