'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import UserProfileSettings from '@/components/settings/UserProfileSettings'

export default function SettingsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-gray-400">Manage your account settings and preferences</p>
        </div>

        <UserProfileSettings />
      </div>
    </div>
  )
}
