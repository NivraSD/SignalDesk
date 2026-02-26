'use client'

import { ReactNode, useState } from 'react'
import { Nav } from './Nav'
import { Sidebar } from './Sidebar'
import OrganizationOnboarding from '@/components/onboarding/OrganizationOnboarding'
import OrganizationSettings from '@/components/settings/OrganizationSettings'
import NIVFloatingAssistant from '@/components/niv/NIVFloatingAssistant'
import { useAppStore } from '@/stores/useAppStore'

interface DashboardLayoutProps {
  children: ReactNode
  showSidebar?: boolean
  sidebarHeader?: {
    label: string
    title: string
  }
  workspaceVariant?: 'light' | 'dark'
}

export function DashboardLayout({
  children,
  showSidebar = true,
  sidebarHeader,
  workspaceVariant = 'dark'
}: DashboardLayoutProps) {
  const { organization, setOrganization } = useAppStore()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showOrgSettings, setShowOrgSettings] = useState(false)

  const workspaceStyles = workspaceVariant === 'dark'
    ? 'bg-[var(--charcoal)]'
    : 'bg-[var(--grey-100)]'

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top Navigation */}
      <Nav
        showOrgSwitcher={true}
        onNewOrganization={() => setShowOnboarding(true)}
        onOrgSettings={() => setShowOrgSettings(true)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {showSidebar && (
          <Sidebar
            header={sidebarHeader}
          />
        )}

        {/* Workspace */}
        <main className={`flex-1 overflow-y-auto ${workspaceStyles}`}>
          {children}
        </main>
      </div>

      {/* Organization Onboarding Modal */}
      <OrganizationOnboarding
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={(newOrg) => {
          setOrganization(newOrg)
          setShowOnboarding(false)
        }}
      />

      {/* Organization Settings Modal */}
      {organization && (
        <OrganizationSettings
          isOpen={showOrgSettings}
          onClose={() => setShowOrgSettings(false)}
          organizationId={organization.id}
          organizationName={organization.name}
          onUpdate={() => {
            // Optionally reload organization data
          }}
        />
      )}

      {/* Global NIV Floating Assistant */}
      <NIVFloatingAssistant />
    </div>
  )
}
