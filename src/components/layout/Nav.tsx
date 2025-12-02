'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronDown, Building2, Plus, Settings, LogOut, User } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { useAuth } from '@/components/auth/AuthProvider'
import { useAppStore } from '@/stores/useAppStore'

interface NavProps {
  showOrgSwitcher?: boolean
  onNewOrganization?: () => void
  onOrgSettings?: () => void
}

export function Nav({ showOrgSwitcher = true, onNewOrganization, onOrgSettings }: NavProps) {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const { organization, setOrganization } = useAppStore()
  const [showOrgMenu, setShowOrgMenu] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [organizations, setOrganizations] = useState<any[]>([])
  const [loadingOrgs, setLoadingOrgs] = useState(true)
  const menuRef = useRef<HTMLDivElement>(null)

  // Load organizations
  useEffect(() => {
    const loadOrganizations = async () => {
      setLoadingOrgs(true)
      try {
        const response = await fetch('/api/organizations')
        const data = await response.json()
        if (data.success && data.organizations) {
          setOrganizations(data.organizations)
          if (!organization && data.organizations.length > 0) {
            const firstOrg = data.organizations[0]
            setOrganization({
              id: firstOrg.id,
              name: firstOrg.name,
              url: firstOrg.url,
              domain: firstOrg.url,
              industry: firstOrg.industry,
              size: firstOrg.size,
              config: {}
            })
          }
        }
      } catch (error) {
        console.error('Failed to load organizations:', error)
      } finally {
        setLoadingOrgs(false)
      }
    }
    loadOrganizations()
  }, [])

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowOrgMenu(false)
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const navLinks = [
    { id: 'hub', label: 'Hub', href: '/dashboard' },
    { id: 'intelligence', label: 'Intelligence', href: '/intelligence' },
    { id: 'opportunities', label: 'Opportunities', href: '/opportunities' },
    { id: 'campaigns', label: 'Campaigns', href: '/campaigns' },
    { id: 'studio', label: 'Studio', href: '/studio' },
  ]

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const userInitials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || 'U'

  return (
    <nav className="h-16 bg-white border-b border-[var(--grey-200)] flex items-center justify-between px-6 sticky top-0 z-50">
      {/* Left: Logo + Navigation Links */}
      <div className="flex items-center gap-8">
        <Link href="/dashboard">
          <Logo variant="light" size="sm" showByline={false} />
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              className="px-4 py-2 text-sm font-medium text-[var(--grey-500)] hover:text-[var(--charcoal)] hover:bg-[var(--grey-100)] rounded-md transition-colors"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Right: Org Switcher + Profile */}
      <div className="flex items-center gap-4" ref={menuRef}>
        {/* Organization Switcher */}
        {showOrgSwitcher && (
          <div className="relative">
            <button
              onClick={() => setShowOrgMenu(!showOrgMenu)}
              className="flex items-center gap-2 px-3 py-2 border border-[var(--grey-200)] rounded-lg hover:border-[var(--grey-300)] transition-colors bg-white"
            >
              <span className="text-sm font-medium text-[var(--charcoal)] max-w-[160px] truncate">
                {organization?.name || 'Select Organization'}
              </span>
              <ChevronDown className="w-4 h-4 text-[var(--grey-500)]" />
            </button>

            {showOrgMenu && (
              <div className="absolute top-full mt-2 right-0 bg-white border border-[var(--grey-200)] rounded-xl shadow-[var(--shadow-lg)] overflow-hidden min-w-[220px] z-50">
                {loadingOrgs ? (
                  <div className="px-4 py-3 text-sm text-[var(--grey-500)]">Loading...</div>
                ) : organizations.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-[var(--grey-500)]">No organizations</div>
                ) : (
                  <div className="max-h-[300px] overflow-y-auto">
                    {organizations.map((org) => (
                      <button
                        key={org.id}
                        onClick={() => {
                          setOrganization({
                            id: org.id,
                            name: org.name,
                            url: org.url,
                            domain: org.url,
                            industry: org.industry,
                            size: org.size,
                            config: {}
                          })
                          setShowOrgMenu(false)
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-[var(--grey-100)] transition-colors ${
                          organization?.id === org.id ? 'bg-[var(--grey-100)]' : ''
                        }`}
                      >
                        <div className="text-sm font-medium text-[var(--charcoal)]">{org.name}</div>
                        {org.industry && (
                          <div className="text-xs text-[var(--grey-500)]">{org.industry}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                <div className="border-t border-[var(--grey-200)]">
                  {organization && onOrgSettings && (
                    <button
                      onClick={() => {
                        setShowOrgMenu(false)
                        onOrgSettings()
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-[var(--grey-100)] text-sm flex items-center gap-2 text-[var(--charcoal)]"
                    >
                      <Building2 className="w-4 h-4" />
                      Organization Settings
                    </button>
                  )}
                  {onNewOrganization && (
                    <button
                      onClick={() => {
                        setShowOrgMenu(false)
                        onNewOrganization()
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-[var(--grey-100)] text-sm flex items-center gap-2 text-[var(--burnt-orange)]"
                    >
                      <Plus className="w-4 h-4" />
                      New Organization
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-9 h-9 rounded-full bg-[var(--charcoal)] text-white flex items-center justify-center text-sm font-semibold"
              style={{ fontFamily: 'var(--font-display)' }}>
              {userInitials}
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute top-full mt-2 right-0 bg-white border border-[var(--grey-200)] rounded-xl shadow-[var(--shadow-lg)] overflow-hidden min-w-[220px] z-50">
              <div className="px-4 py-3 border-b border-[var(--grey-200)]">
                <p className="text-sm font-medium text-[var(--charcoal)]">
                  {user?.user_metadata?.full_name || 'User'}
                </p>
                <p className="text-xs text-[var(--grey-500)]">{user?.email}</p>
              </div>

              <button
                onClick={() => {
                  setShowProfileMenu(false)
                  router.push('/settings')
                }}
                className="w-full text-left px-4 py-3 hover:bg-[var(--grey-100)] text-sm flex items-center gap-2 text-[var(--charcoal)]"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>

              <div className="border-t border-[var(--grey-200)]">
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-3 hover:bg-[var(--grey-100)] text-sm flex items-center gap-2 text-[var(--error)]"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
