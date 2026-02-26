'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { useAppStore } from '@/stores/useAppStore'
import OrganizationOnboarding from '@/components/onboarding/OrganizationOnboarding'

export default function OnboardingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { setOrganization } = useAppStore()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [checkingOrgs, setCheckingOrgs] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    // Clear any cached organization first
    setOrganization(null)

    // Check if user already has organizations
    checkExistingOrganizations()
  }, [user])

  const checkExistingOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations')
      const data = await response.json()

      if (data.success && data.organizations && data.organizations.length > 0) {
        // User already has organizations, skip onboarding
        console.log('User already has organizations, redirecting to dashboard')
        router.push('/dashboard')
      } else {
        // No organizations, show onboarding
        setShowOnboarding(true)
      }
    } catch (error) {
      console.error('Failed to check organizations:', error)
      // On error, show onboarding to be safe
      setShowOnboarding(true)
    } finally {
      setCheckingOrgs(false)
    }
  }

  const handleOnboardingComplete = (organization: any) => {
    console.log('Onboarding complete, organization created:', organization)

    // Set the new organization in the store
    setOrganization({
      id: organization.id,
      name: organization.name,
      url: organization.settings?.url || organization.url,
      domain: organization.settings?.url || organization.url,
      industry: organization.industry,
      size: organization.settings?.size,
      config: {}
    })

    // Redirect to dashboard
    router.push('/dashboard')
  }

  if (checkingOrgs) {
    return (
      <div className="min-h-screen bg-[var(--grey-900)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--burnt-orange)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--grey-400)]">Checking your account...</p>
        </div>
      </div>
    )
  }

  if (!showOnboarding) {
    return null
  }

  return (
    <div className="min-h-screen bg-[var(--grey-900)]">
      <OrganizationOnboarding
        isOpen={true}
        onClose={() => {
          // Don't allow closing during onboarding
          // User must complete or can sign out
        }}
        onComplete={handleOnboardingComplete}
      />
    </div>
  )
}
