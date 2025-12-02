'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Settings } from 'lucide-react'
import UserProfileSettings from '@/components/settings/UserProfileSettings'
import { Logo } from '@/components/ui/Logo'

export default function SettingsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen" style={{ background: 'var(--charcoal)' }}>
      {/* Header */}
      <div
        className="border-b backdrop-blur-sm sticky top-0 z-10"
        style={{ background: 'var(--charcoal)', borderColor: 'var(--grey-800)' }}
      >
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center transition-colors"
            style={{ color: 'var(--grey-400)' }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="text-sm" style={{ fontFamily: 'var(--font-display)' }}>
              Back to Dashboard
            </span>
          </button>
          <Logo variant="dark" size="sm" />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--burnt-orange)' }}
            >
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <div
                className="text-[0.65rem] uppercase tracking-[0.15em] mb-1"
                style={{ color: 'var(--burnt-orange)', fontFamily: 'var(--font-display)' }}
              >
                Account
              </div>
              <h1
                className="text-[1.5rem] font-normal text-white"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                Settings
              </h1>
            </div>
          </div>
          <p className="text-sm" style={{ color: 'var(--grey-500)' }}>
            Manage your account settings and preferences
          </p>
        </div>

        <UserProfileSettings />
      </div>
    </div>
  )
}
