'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sun,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Activity,
  Users,
  Globe,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Plus,
  Building2,
  Settings,
  LogOut,
  Clock,
  ArrowRight,
  Sparkles,
  Loader2,
  X,
  Play,
  Target,
  Zap,
  HelpCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Logo } from '@/components/ui/Logo'
import { useAuth } from '@/components/auth/AuthProvider'
import { useAppStore } from '@/stores/useAppStore'
import { useProductTour } from '@/hooks/useProductTour'
import '@/styles/tour.css'
import OrganizationOnboarding from '@/components/onboarding/OrganizationOnboarding'
import OrganizationSettings from '@/components/settings/OrganizationSettings'
import { IntelligenceService } from '@/lib/services/intelligenceService'
import { PredictionTargetService } from '@/lib/services/predictionTargetService'
import { ConnectionService } from '@/lib/services/connectionService'
import IntelligenceBriefDisplay from '@/components/IntelligenceBriefDisplay'
import NIVFloatingAssistant from '@/components/niv/NIVFloatingAssistant'
import type { PredictionWithTarget } from '@/types/predictions'
import type { ConnectionSignal } from '@/lib/types/connections'

// Import existing modules for functionality
import OpportunitiesModule from '@/components/modules/OpportunitiesModule'
import StudioModule from '@/components/modules/StudioModule'
import CampaignsModule from '@/components/modules/CampaignsModule'
import CrisisModule from '@/components/modules/CrisisModule'
import MemoryVaultModule from '@/components/modules/MemoryVaultModule'
import GeoIntelModule from '@/components/modules/GeoIntelModule'
import ConnectionsModule from '@/components/modules/ConnectionsModule'
import PredictionsModule from '@/components/modules/PredictionsModule'
import SignalsModule from '@/components/modules/SignalsModule'

type ModuleView = 'hub' | 'opportunities' | 'studio' | 'campaigns' | 'crisis' | 'vault' | 'geointel' | 'connections' | 'predictions' | 'signals'

export default function Dashboard() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const { organization, setOrganization } = useAppStore()

  // UI State
  const [activeModule, setActiveModule] = useState<ModuleView>('hub')
  const [showOrgMenu, setShowOrgMenu] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showOrgSettings, setShowOrgSettings] = useState(false)
  const [organizations, setOrganizations] = useState<any[]>([])
  const [loadingOrgs, setLoadingOrgs] = useState(true)
  const [currentDate, setCurrentDate] = useState('')

  // Product Tour
  const { startTour, tourCompleted } = useProductTour({ autoStart: true })

  // Intelligence Pipeline State
  const [isRunningPipeline, setIsRunningPipeline] = useState(false)
  const [pipelineStage, setPipelineStage] = useState('')
  const [executiveSynthesis, setExecutiveSynthesis] = useState<any>(null)
  const [pipelineError, setPipelineError] = useState<string | null>(null)
  const [showReportPopout, setShowReportPopout] = useState(false)

  // Opportunities from pipeline
  const [opportunities, setOpportunities] = useState<any[]>([])
  const [loadingOpportunities, setLoadingOpportunities] = useState(false)

  // Predictions and Connections for Hub sidebar
  const [predictions, setPredictions] = useState<PredictionWithTarget[]>([])
  const [connections, setConnections] = useState<ConnectionSignal[]>([])
  const [loadingSidebarData, setLoadingSidebarData] = useState(false)

  // Studio content (for editing from Memory Vault)
  const [studioInitialContent, setStudioInitialContent] = useState<{
    id: string
    title: string
    content_type: string
    content: any
    folder?: string
    metadata?: any
  } | null>(null)

  // Load organizations
  useEffect(() => {
    const loadOrganizations = async () => {
      setLoadingOrgs(true)
      try {
        const response = await fetch('/api/organizations')
        const data = await response.json()
        if (data.success && data.organizations) {
          setOrganizations(data.organizations)

          // CRITICAL: Validate persisted organization belongs to this user
          // If not in the list, clear it (prevents cross-user data leakage)
          let validOrg = organization
          if (organization) {
            const hasAccess = data.organizations.some((org: any) => org.id === organization.id)
            if (!hasAccess) {
              console.log(`⚠️ User doesn't have access to persisted org "${organization.name}", clearing`)
              setOrganization(null)
              validOrg = null
            }
          }

          // Set first org if none selected and user has orgs
          if (!validOrg && data.organizations.length > 0) {
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
        } else {
          // No organizations - clear any persisted org
          if (organization) {
            console.log('⚠️ User has no organizations, clearing persisted org')
            setOrganization(null)
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

  // Set current date
  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }))
  }, [])

  // Load latest synthesis and opportunities when organization changes
  useEffect(() => {
    if (organization?.id) {
      // Load latest synthesis
      IntelligenceService.getLatestSynthesis(organization.id).then(synthesis => {
        if (synthesis) {
          setExecutiveSynthesis(synthesis.synthesis_data || synthesis)
        } else {
          setExecutiveSynthesis(null)
        }
      }).catch(error => {
        console.error('Failed to load synthesis:', error)
        setExecutiveSynthesis(null)
      })

      // Load opportunities
      loadOpportunities()

      // Load predictions and connections for sidebar
      loadSidebarData()
    }
  }, [organization?.id])

  const loadOpportunities = async () => {
    if (!organization?.id) return

    setLoadingOpportunities(true)
    try {
      const response = await fetch(`/api/opportunities?organization_id=${organization.id}`)
      const data = await response.json()
      if (data.opportunities && data.opportunities.length > 0) {
        setOpportunities(data.opportunities.slice(0, 5)) // Show top 5
      } else {
        setOpportunities([])
      }
    } catch (error) {
      console.error('Failed to load opportunities:', error)
      setOpportunities([])
    } finally {
      setLoadingOpportunities(false)
    }
  }

  const loadSidebarData = async () => {
    if (!organization?.id) return

    setLoadingSidebarData(true)
    try {
      const [predictionsData, connectionsData] = await Promise.all([
        PredictionTargetService.getFilteredPredictions(organization.id),
        ConnectionService.getConnectionSignals(organization.id)
      ])
      setPredictions(predictionsData)
      setConnections(connectionsData)
    } catch (error) {
      console.error('Failed to load sidebar data:', error)
    } finally {
      setLoadingSidebarData(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  // Handle opening content in Studio from Memory Vault
  const handleOpenInStudio = (item: any) => {
    console.log('📝 Opening in Studio:', item.title)
    setStudioInitialContent({
      id: item.id,
      title: item.title,
      content_type: item.content_type,
      content: item.content,
      folder: item.folder,
      metadata: item.metadata
    })
    setActiveModule('studio')
  }

  // Clear studio content when switching away
  const handleClearStudioContent = () => {
    setStudioInitialContent(null)
  }

  const userInitials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || 'U'

  // Run intelligence pipeline
  const runIntelligencePipeline = async () => {
    if (!organization) {
      setPipelineError('Please select an organization first')
      return
    }

    setIsRunningPipeline(true)
    setPipelineError(null)
    setPipelineStage('Initializing...')

    try {
      const pipelineData = await IntelligenceService.startPipeline(
        organization.id,
        organization.name,
        organization.industry,
        (stage, status, data) => {
          const stageNames: Record<string, string> = {
            'mcp-discovery': 'Preparing Targets',
            'monitor-stage-2-relevance': 'Organizing Results',
            'monitoring-stage-2-enrichment': 'Synthesizing',
            'mcp-executive-synthesis': 'Structuring Opportunities',
            'mcp-opportunity-detector': 'Finalizing'
          }
          setPipelineStage(stageNames[stage] || stage)
        }
      )

      const synthesisData = pipelineData?.synthesis || pipelineData?.executiveSynthesis
      if (synthesisData) {
        setExecutiveSynthesis(synthesisData)
        // Wait for opportunities to be saved to database
        // Increased from 1.5s to 5s because opportunity detector often times out
        // but continues saving in the background
        await new Promise(resolve => setTimeout(resolve, 5000))
        // Reload opportunities and sidebar data after pipeline completes
        await loadOpportunities()
        // Reload again after another delay in case first load was too early
        setTimeout(() => loadOpportunities(), 5000)
        await loadSidebarData()
      } else {
        setPipelineError('No synthesis data received from pipeline')
      }
    } catch (err: any) {
      console.error('Pipeline error:', err)
      setPipelineError(err.message || 'Pipeline failed. Please try again.')
    } finally {
      setIsRunningPipeline(false)
      setPipelineStage('')
    }
  }

  // Top nav links matching design mockup
  const navLinks: { id: ModuleView; label: string }[] = [
    { id: 'hub', label: 'Hub' },
    { id: 'opportunities', label: 'Opportunities' },
    { id: 'studio', label: 'Studio' },
    { id: 'campaigns', label: 'Campaigns' },
    { id: 'crisis', label: 'Crisis' },
    { id: 'vault', label: 'Vault' },
  ]

  // Get summary from synthesis
  const getSynthesisSummary = () => {
    if (!executiveSynthesis) return null

    // Try to get the executive summary or first paragraph
    if (executiveSynthesis.executive_summary) {
      return executiveSynthesis.executive_summary
    }
    if (executiveSynthesis.synthesis?.executive_summary) {
      return executiveSynthesis.synthesis.executive_summary
    }
    if (executiveSynthesis.summary) {
      return executiveSynthesis.summary
    }
    // Fallback to first section content
    if (executiveSynthesis.sections?.[0]?.content) {
      return executiveSynthesis.sections[0].content.substring(0, 300) + '...'
    }
    return 'Intelligence brief generated. Click to view full report.'
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top Navigation - White */}
      <nav className="h-16 bg-white border-b border-[var(--grey-200)] flex items-center justify-between px-6 shrink-0">
        {/* Left: Logo + Navigation */}
        <div className="flex items-center gap-8">
          <button onClick={() => setActiveModule('hub')} className="flex items-center gap-3">
            <Logo variant="dark" size="sm" showByline={true} />
          </button>

          <div className="flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                data-tour={`nav-${link.id}`}
                onClick={() => setActiveModule(link.id)}
                className={`px-4 py-2 text-[0.85rem] font-medium rounded-md transition-colors ${
                  activeModule === link.id
                    ? 'text-[var(--charcoal)] bg-[var(--grey-100)]'
                    : 'text-[var(--grey-500)] hover:text-[var(--charcoal)] hover:bg-[var(--grey-100)]'
                }`}
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Org Switcher + Profile */}
        <div className="flex items-center gap-4">
          {/* Organization Switcher */}
          <div className="relative" data-tour="org-switcher">
            <button
              onClick={() => setShowOrgMenu(!showOrgMenu)}
              className="flex items-center gap-2 px-3.5 py-2 border border-[var(--grey-200)] rounded-md bg-white text-[0.85rem] font-medium cursor-pointer"
            >
              <span className="text-[var(--charcoal)] max-w-[160px] truncate">
                {organization?.name || 'Select Organization'}
              </span>
              <ChevronDown className="w-4 h-4 text-[var(--grey-500)]" />
            </button>

            {showOrgMenu && (
              <div className="absolute top-full mt-2 right-0 bg-white border border-[var(--grey-200)] rounded-xl shadow-lg overflow-hidden min-w-[220px] z-50">
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
                  {organization && (
                    <button
                      onClick={() => {
                        setShowOrgMenu(false)
                        setShowOrgSettings(true)
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-[var(--grey-100)] text-sm flex items-center gap-2 text-[var(--charcoal)]"
                    >
                      <Building2 className="w-4 h-4" />
                      Organization Settings
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowOrgMenu(false)
                      setShowOnboarding(true)
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-[var(--grey-100)] text-sm flex items-center gap-2 text-[var(--burnt-orange)]"
                  >
                    <Plus className="w-4 h-4" />
                    New Organization
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile Button */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-9 h-9 rounded-full bg-[var(--charcoal)] text-white flex items-center justify-center text-[0.8rem] font-semibold"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {userInitials}
            </button>

            {showProfileMenu && (
              <div className="absolute top-full mt-2 right-0 bg-white border border-[var(--grey-200)] rounded-xl shadow-lg overflow-hidden min-w-[220px] z-50">
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

                <button
                  onClick={() => {
                    setShowProfileMenu(false)
                    startTour()
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-[var(--grey-100)] text-sm flex items-center gap-2 text-[var(--charcoal)]"
                >
                  <HelpCircle className="w-4 h-4" />
                  Take a Tour
                </button>

                <div className="border-t border-[var(--grey-200)]">
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-3 hover:bg-[var(--grey-100)] text-sm flex items-center gap-2 text-red-500"
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

      {/* Dashboard Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - White (hidden when Studio, Campaigns, Crisis, Vault, or Opportunities is active) */}
        {activeModule !== 'studio' && activeModule !== 'campaigns' && activeModule !== 'crisis' && activeModule !== 'vault' && activeModule !== 'opportunities' && (
        <aside className="w-[260px] bg-white border-r border-[var(--grey-200)] flex flex-col shrink-0">
          {/* Sidebar Header */}
          <div className="px-5 py-5 border-b border-[var(--grey-200)]">
            <div
              className="text-[0.65rem] uppercase tracking-[0.15em] text-[var(--grey-500)] mb-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Intelligence Hub
            </div>
            <div
              className="text-[1.1rem] text-[var(--charcoal)]"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Daily Brief
            </div>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {/* Quick Actions */}
            <div className="mb-6">
              <div
                className="text-[0.65rem] uppercase tracking-[0.1em] text-[var(--grey-400)] mb-3 px-3"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Quick Actions
              </div>

              <SidebarItem icon={Sun} label="Today's Brief" active={activeModule === 'hub'} onClick={() => setActiveModule('hub')} />
              <SidebarItem
                icon={TrendingUp}
                label="Opportunities"
                badge={opportunities.length || undefined}
                onClick={() => setActiveModule('opportunities')}
              />
              <SidebarItem
                icon={AlertTriangle}
                label="Crisis Monitor"
                onClick={() => setActiveModule('crisis')}
              />
            </div>

            {/* Intelligence */}
            <div>
              <div
                className="text-[0.65rem] uppercase tracking-[0.1em] text-[var(--grey-400)] mb-3 px-3"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Intelligence
              </div>

              <SidebarItem icon={BarChart3} label="Predictions" onClick={() => setActiveModule('predictions')} tourId="sidebar-predictions" />
              <SidebarItem icon={Activity} label="Social" onClick={() => setActiveModule('signals')} tourId="sidebar-signals" />
              <SidebarItem icon={Globe} label="Geo Intel" onClick={() => setActiveModule('geointel')} tourId="sidebar-geointel" />
              <SidebarItem icon={ExternalLink} label="Connections" onClick={() => setActiveModule('connections')} tourId="sidebar-connections" />
            </div>
          </div>
        </aside>
        )}

        {/* Workspace - Dark for Hub, light for Campaigns */}
        <main className={`flex-1 overflow-hidden flex ${activeModule === 'campaigns' ? 'bg-[var(--grey-100)]' : 'bg-[var(--charcoal)]'}`}>
          {activeModule === 'hub' && (
            <HubView
              currentDate={currentDate}
              organization={organization}
              executiveSynthesis={executiveSynthesis}
              opportunities={opportunities}
              predictions={predictions}
              connections={connections}
              isRunningPipeline={isRunningPipeline}
              pipelineStage={pipelineStage}
              pipelineError={pipelineError}
              onRunPipeline={runIntelligencePipeline}
              onOpenReport={() => setShowReportPopout(true)}
              onNavigate={setActiveModule}
              getSynthesisSummary={getSynthesisSummary}
              onOpportunitiesUpdate={loadOpportunities}
            />
          )}

          {activeModule === 'opportunities' && (
            <div className="flex-1 overflow-y-auto p-8">
              <OpportunitiesModule />
            </div>
          )}

          {activeModule === 'studio' && (
            <StudioModule
              initialContent={studioInitialContent}
              onClearInitialContent={handleClearStudioContent}
            />
          )}

          {activeModule === 'campaigns' && (
            <CampaignsModule />
          )}

          {activeModule === 'crisis' && (
            <CrisisModule />
          )}

          {activeModule === 'vault' && (
            <MemoryVaultModule onOpenInStudio={handleOpenInStudio} />
          )}

          {activeModule === 'geointel' && (
            <div className="flex-1 overflow-y-auto p-8">
              <GeoIntelModule />
            </div>
          )}

          {activeModule === 'connections' && (
            <div className="flex-1 overflow-y-auto p-8">
              <ConnectionsModule />
            </div>
          )}

          {activeModule === 'predictions' && (
            <div className="flex-1 overflow-y-auto p-8">
              <PredictionsModule />
            </div>
          )}

          {activeModule === 'signals' && (
            <div className="flex-1 overflow-y-auto p-8">
              <SignalsModule />
            </div>
          )}
        </main>
      </div>

      {/* Report Popout Modal */}
      {showReportPopout && executiveSynthesis && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8">
          <div className="bg-[var(--grey-900)] rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Popout Header */}
            <div className="px-6 py-4 border-b border-[var(--grey-800)] flex items-center justify-between shrink-0">
              <div
                className="text-[0.65rem] uppercase tracking-[0.1em] text-[var(--burnt-orange)] flex items-center gap-2"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <span className="w-1.5 h-1.5 bg-[var(--burnt-orange)] rounded-full" />
                Intelligence Brief - Full Report
              </div>
              <button
                onClick={() => setShowReportPopout(false)}
                className="p-2 hover:bg-[var(--grey-800)] rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[var(--grey-400)]" />
              </button>
            </div>

            {/* Popout Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <IntelligenceBriefDisplay synthesis={executiveSynthesis} />
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <OrganizationOnboarding
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={(newOrg) => {
          setOrganization(newOrg)
          setShowOnboarding(false)
          fetch('/api/organizations')
            .then(res => res.json())
            .then(data => {
              if (data.success) setOrganizations(data.organizations)
            })
        }}
      />

      {organization && (
        <OrganizationSettings
          isOpen={showOrgSettings}
          onClose={() => setShowOrgSettings(false)}
          organizationId={organization.id}
          organizationName={organization.name}
          onUpdate={() => {}}
        />
      )}

      {/* Global NIV Floating Assistant */}
      <NIVFloatingAssistant />
    </div>
  )
}

// Sidebar Item Component
function SidebarItem({
  icon: Icon,
  label,
  badge,
  active = false,
  onClick,
  tourId
}: {
  icon: any
  label: string
  badge?: number
  active?: boolean
  onClick?: () => void
  tourId?: string
}) {
  return (
    <button
      onClick={onClick}
      data-tour={tourId}
      className={`
        w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[0.85rem] transition-all text-left mb-0.5
        ${active
          ? 'bg-[var(--grey-100)] text-[var(--charcoal)]'
          : 'text-[var(--grey-600)] hover:bg-[var(--grey-100)] hover:text-[var(--charcoal)]'
        }
      `}
    >
      <Icon className="w-[18px] h-[18px] opacity-70" />
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span
          className="px-2 py-0.5 text-[0.7rem] font-medium rounded-[10px] bg-[var(--burnt-orange-muted)] text-[var(--burnt-orange)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {badge}
        </span>
      )}
    </button>
  )
}

// Hub View Component
function HubView({
  currentDate,
  organization,
  executiveSynthesis,
  opportunities,
  predictions,
  connections,
  isRunningPipeline,
  pipelineStage,
  pipelineError,
  onRunPipeline,
  onOpenReport,
  onNavigate,
  getSynthesisSummary,
  onOpportunitiesUpdate
}: {
  currentDate: string
  organization: any
  executiveSynthesis: any
  opportunities: any[]
  predictions: PredictionWithTarget[]
  connections: ConnectionSignal[]
  isRunningPipeline: boolean
  pipelineStage: string
  pipelineError: string | null
  onRunPipeline: () => void
  onOpenReport: () => void
  onNavigate: (module: ModuleView) => void
  getSynthesisSummary: () => string | null
  onOpportunitiesUpdate: () => void
}) {
  const opportunityCount = opportunities.length
  const [expandedOppId, setExpandedOppId] = useState<string | null>(null)
  const [executingOppId, setExecutingOppId] = useState<string | null>(null)
  const [executionProgress, setExecutionProgress] = useState<{ current?: string; progress?: number }>({})
  const [activeSidebarTab, setActiveSidebarTab] = useState<'social' | 'predictions' | 'connections'>('predictions')

  // Helper function to create clean folder name from opportunity title
  const getOpportunityFolderName = (title: string): string => {
    let cleanTitle = title.replace(/^Opportunity:\s*/i, '')
    return cleanTitle.trim()
  }

  // Execute opportunity - same logic as OpportunitiesModule
  const executeOpportunity = async (opp: any) => {
    console.log('🚀 Hub: Execute opportunity called:', opp)

    const folderName = getOpportunityFolderName(opp.title)
    console.log('📁 Using folder name:', folderName)

    if (!opp.version || opp.version !== 2 || !opp.execution_plan) {
      console.error('❌ Not a V2 opportunity or missing execution plan')
      return
    }

    setExecutingOppId(opp.id)
    setExecutionProgress({ current: 'Preparing campaign execution...', progress: 10 })

    let progressInterval: NodeJS.Timeout | null = null

    try {
      // Save opportunity overview to Memory Vault
      const overviewContent = `# ${opp.title}

${opp.description}

## Strategic Context

**Why Now:** ${opp.strategic_context?.why_now || 'N/A'}

**Market Dynamics:** ${opp.strategic_context?.market_dynamics || 'N/A'}

**Time Window:** ${opp.strategic_context?.time_window || 'N/A'}

**Competitive Advantage:** ${opp.strategic_context?.competitive_advantage || 'N/A'}

**Expected Impact:** ${opp.strategic_context?.expected_impact || 'N/A'}

**Risk if Missed:** ${opp.strategic_context?.risk_if_missed || 'N/A'}

**Trigger Events:**
${opp.strategic_context?.trigger_events?.map((e: string) => `- ${e}`).join('\n') || 'N/A'}
`

      try {
        const response = await fetch('/api/content-library/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: {
              type: 'strategy',
              title: `${folderName} - Overview`,
              content: overviewContent,
              organization_id: organization?.id,
              metadata: {
                opportunity_id: opp.id,
                urgency: opp.urgency,
                score: opp.score,
                is_overview: true,
                themes: [opp.category],
                topics: opp.strategic_context?.trigger_events || []
              }
            },
            folder: `Opportunities/${folderName}`
          })
        })

        if (response.ok) {
          console.log('✅ Saved opportunity overview to Memory Vault')
        }
      } catch (error) {
        console.error('❌ Failed to save overview:', error)
      }

      // Build content requirements from execution plan
      const contentRequirements: {
        owned: Array<{ type: string; stakeholder: string; purpose: string; keyPoints: string[] }>
        media: Array<{ type: string; stakeholder: string; purpose: string; keyPoints: string[] }>
      } = { owned: [], media: [] }

      for (const campaign of opp.execution_plan.stakeholder_campaigns) {
        for (const item of campaign.content_items) {
          if (item.type === 'webinar' || item.type === 'event' || item.type === 'partnership_outreach') {
            continue
          }

          const contentReq = {
            type: item.type,
            stakeholder: campaign.stakeholder_name,
            purpose: item.topic,
            keyPoints: item.brief?.key_points || []
          }

          if (item.type === 'press_release' || item.type === 'media_pitch' || item.type === 'media_list') {
            contentRequirements.media.push(contentReq)
          } else {
            contentRequirements.owned.push(contentReq)
          }
        }
      }

      const totalPieces = contentRequirements.owned.length + contentRequirements.media.length

      setExecutionProgress({
        current: `Generating ${totalPieces} content pieces...`,
        progress: 20
      })

      // Start progress simulator
      let simulatedProgress = 20
      progressInterval = setInterval(() => {
        if (simulatedProgress < 80) {
          simulatedProgress += 2
          setExecutionProgress({
            current: `Generating content...`,
            progress: simulatedProgress
          })
        }
      }, 3000)

      // Call niv-content-intelligent-v2
      const { data: orchestrationResult, error: contentError } = await supabase.functions.invoke('niv-content-intelligent-v2', {
        body: {
          message: `Generate campaign content for ${opp.title}`,
          conversationHistory: [],
          organizationContext: {
            conversationId: `opp-${opp.id}-${Date.now()}`,
            organizationId: opp.organization_id || organization?.id,
            organizationName: opp.description || 'Organization'
          },
          stage: 'campaign_generation',
          campaignContext: {
            phase: 'execution',
            phaseNumber: 1,
            objective: opp.title,
            narrative: opp.description,
            keyMessages: opp.strategic_context?.trigger_events || [],
            contentRequirements,
            researchInsights: [opp.strategic_context?.why_now || ''],
            currentDate: new Date().toISOString().split('T')[0],
            campaignFolder: `Opportunities/${folderName}`,
            blueprintId: opp.id,
            positioning: opp.strategic_context?.competitive_advantage || '',
            targetStakeholders: opp.execution_plan.stakeholder_campaigns.map((c: any) => c.stakeholder_name),
            campaignType: 'OPPORTUNITY_EXECUTION',
            timeline: opp.strategic_context?.time_window || 'Immediate'
          }
        }
      })

      if (progressInterval) clearInterval(progressInterval)

      if (contentError) {
        throw new Error(`Campaign orchestration failed: ${contentError.message}`)
      }

      if (orchestrationResult) {
        const generatedCount = orchestrationResult.generatedContent?.length || 0
        setExecutionProgress({
          current: `✅ Generated ${generatedCount}/${totalPieces} content pieces`,
          progress: 85
        })
      }

      // Generate Gamma presentation
      setExecutionProgress({ current: 'Finalizing Presentation...', progress: 90 })

      let presentationUrl = null
      try {
        const { data: gammaData, error: gammaError } = await supabase.functions.invoke('generate-opportunity-presentation', {
          body: {
            opportunity_id: opp.id,
            organization_id: opp.organization_id || organization?.id
          }
        })

        if (!gammaError && gammaData?.generationId) {
          for (let i = 0; i < 72; i++) {
            setExecutionProgress({
              current: `Finalizing Presentation... (${i * 5}s)`,
              progress: 90 + (i / 72) * 8
            })

            await new Promise(resolve => setTimeout(resolve, 5000))

            const { data: statusData } = await supabase.functions.invoke('gamma-presentation', {
              body: {
                generationId: gammaData.generationId,
                capture: true,
                organization_id: opp.organization_id || organization?.id,
                campaign_id: opp.id,
                campaign_folder: `Opportunities/${folderName}`,
                title: opp.title
              }
            })

            if (statusData?.status === 'completed' && statusData.gammaUrl) {
              presentationUrl = statusData.gammaUrl
              setExecutionProgress({ current: '✅ Presentation ready!', progress: 98 })
              break
            }

            if (statusData?.status === 'error') {
              setExecutionProgress({ current: '⚠️ Presentation failed', progress: 90 })
              break
            }
          }
        }
      } catch (gammaError) {
        console.error('Gamma generation failed:', gammaError)
        setExecutionProgress({ current: '⚠️ Presentation failed', progress: 90 })
      }

      // Update database
      await supabase
        .from('opportunities')
        .update({
          status: 'executed',
          executed: true,
          presentation_url: presentationUrl
        })
        .eq('id', opp.id)

      setExecutionProgress({ current: '✅ Campaign execution complete!', progress: 100 })

      // Refresh opportunities list
      setTimeout(() => {
        onOpportunitiesUpdate()
      }, 1000)

    } catch (error: any) {
      console.error('❌ Execution error:', error)
      setExecutionProgress({ current: `❌ Error: ${error.message}`, progress: 0 })
    } finally {
      if (progressInterval) clearInterval(progressInterval)
      setTimeout(() => {
        setExecutingOppId(null)
        setExecutionProgress({})
      }, 3000)
    }
  }

  return (
    <>
      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Workspace Header */}
        <div className="px-8 py-6 border-b border-[var(--grey-800)]">
          <div
            className="text-[0.7rem] uppercase tracking-[0.15em] text-[var(--grey-500)] mb-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {currentDate}
          </div>
          <h1
            className="text-[1.5rem] font-normal text-white leading-snug"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            Good morning. {opportunityCount > 0 ? (
              <><em className="italic text-[var(--burnt-orange)]">{opportunityCount} opportunities</em> detected.</>
            ) : (
              <>Run intelligence to detect <em className="italic text-[var(--burnt-orange)]">opportunities</em>.</>
            )}
          </h1>
        </div>

        {/* Workspace Content */}
        <div className="flex-1 px-8 py-6 overflow-y-auto">
          {/* Intelligence Brief Card - Now with Generate Button */}
          <div className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl mb-4">
            <div className="px-5 py-4 border-b border-[var(--grey-800)] flex items-center justify-between">
              <div
                className="text-[0.65rem] uppercase tracking-[0.1em] text-[var(--burnt-orange)] flex items-center gap-2"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <span className="w-1.5 h-1.5 bg-[var(--burnt-orange)] rounded-full" />
                Intelligence Brief
              </div>
              {executiveSynthesis && (
                <button
                  onClick={onOpenReport}
                  className="text-[var(--grey-500)] hover:text-white transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="p-5">
              {isRunningPipeline ? (
                <div className="flex items-center gap-4">
                  <Loader2 className="w-6 h-6 animate-spin text-[var(--burnt-orange)]" />
                  <div>
                    <p
                      className="text-base text-white mb-1"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      Generating Intelligence Brief...
                    </p>
                    <p className="text-sm text-[var(--grey-400)]">{pipelineStage}</p>
                  </div>
                </div>
              ) : pipelineError ? (
                <div>
                  <p className="text-red-400 text-sm mb-3">{pipelineError}</p>
                  <button
                    onClick={onRunPipeline}
                    className="px-4 py-2 bg-[var(--burnt-orange)] text-white rounded-md text-sm font-medium flex items-center gap-2 hover:bg-[var(--burnt-orange-light)] transition-colors"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    <Play className="w-4 h-4" />
                    Retry
                  </button>
                </div>
              ) : executiveSynthesis ? (
                <div>
                  <p
                    className="text-base leading-relaxed text-[var(--grey-200)] mb-4 cursor-pointer hover:text-white transition-colors"
                    style={{ fontFamily: 'var(--font-serif)' }}
                    onClick={onOpenReport}
                  >
                    {getSynthesisSummary()}
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={onOpenReport}
                      className="px-4 py-2 bg-[var(--grey-800)] text-white rounded-md text-sm font-medium flex items-center gap-2 hover:bg-[var(--grey-700)] transition-colors"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Full Report
                    </button>
                    <button
                      onClick={onRunPipeline}
                      className="px-4 py-2 text-[var(--grey-400)] hover:text-white text-sm font-medium flex items-center gap-2 transition-colors"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      <Sparkles className="w-4 h-4" />
                      Regenerate
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p
                    className="text-base leading-relaxed text-[var(--grey-400)] mb-4"
                    style={{ fontFamily: 'var(--font-serif)' }}
                  >
                    {organization
                      ? 'Generate an intelligence brief to get strategic insights and detect opportunities.'
                      : 'Select an organization to generate intelligence briefs.'}
                  </p>
                  <button
                    data-tour="generate-brief"
                    onClick={onRunPipeline}
                    disabled={!organization}
                    className="px-4 py-2 bg-[var(--burnt-orange)] text-white rounded-md text-sm font-medium flex items-center gap-2 hover:bg-[var(--burnt-orange-light)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    <Play className="w-4 h-4" />
                    Generate Intelligence Brief
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Opportunities Section Header */}
          <div
            className="flex items-center justify-between mb-4 mt-6 cursor-pointer"
            onClick={() => onNavigate('opportunities')}
          >
            <div
              className="text-[0.7rem] uppercase tracking-[0.15em] text-[var(--grey-500)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Opportunities
            </div>
            <div className="flex items-center gap-2">
              {opportunityCount > 0 && (
                <span
                  className="text-[0.7rem] font-medium text-[var(--burnt-orange)] bg-[var(--burnt-orange-muted)] px-2.5 py-1 rounded-xl"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {opportunityCount} active
                </span>
              )}
              <ExternalLink className="w-4 h-4 text-[var(--grey-500)]" />
            </div>
          </div>

          {/* Opportunity Cards - expandable with full details */}
          {opportunities.length > 0 ? (
            opportunities.map((opp, idx) => (
              <ExpandableOpportunityCard
                key={opp.id || idx}
                opportunity={opp}
                isExpanded={expandedOppId === opp.id}
                isExecuting={executingOppId === opp.id}
                executionProgress={executingOppId === opp.id ? executionProgress : undefined}
                onToggle={() => setExpandedOppId(expandedOppId === opp.id ? null : opp.id)}
                onExecute={() => executeOpportunity(opp)}
              />
            ))
          ) : (
            <div className="bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-xl p-8 text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-[var(--grey-600)]" />
              <p className="text-[var(--grey-400)] text-sm">
                {isRunningPipeline
                  ? 'Detecting opportunities...'
                  : 'Run the intelligence pipeline to detect opportunities.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Intel Sidebar - Right */}
      <aside className="w-[320px] bg-[var(--grey-900)] border-l border-[var(--grey-800)] p-5 overflow-y-auto shrink-0">
        {/* Tabs */}
        <div className="flex gap-1 mb-5">
          <button
            onClick={() => setActiveSidebarTab('social')}
            className={`px-3 py-2 text-[0.75rem] rounded-md transition-colors ${
              activeSidebarTab === 'social'
                ? 'bg-[var(--burnt-orange-muted)] text-[var(--burnt-orange)]'
                : 'text-[var(--grey-500)] hover:text-[var(--grey-300)]'
            }`}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Social
          </button>
          <button
            onClick={() => setActiveSidebarTab('predictions')}
            className={`px-3 py-2 text-[0.75rem] rounded-md transition-colors ${
              activeSidebarTab === 'predictions'
                ? 'bg-[var(--burnt-orange-muted)] text-[var(--burnt-orange)]'
                : 'text-[var(--grey-500)] hover:text-[var(--grey-300)]'
            }`}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Predictions
            {predictions.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[0.6rem] bg-[var(--burnt-orange)]/20 rounded">
                {predictions.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSidebarTab('connections')}
            className={`px-3 py-2 text-[0.75rem] rounded-md transition-colors ${
              activeSidebarTab === 'connections'
                ? 'bg-[var(--burnt-orange-muted)] text-[var(--burnt-orange)]'
                : 'text-[var(--grey-500)] hover:text-[var(--grey-300)]'
            }`}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Connections
            {connections.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[0.6rem] bg-[var(--burnt-orange)]/20 rounded">
                {connections.length}
              </span>
            )}
          </button>
        </div>

        {/* Social Tab Content - Placeholder for now */}
        {activeSidebarTab === 'social' && (
          <div>
            <div
              className="text-[0.65rem] uppercase tracking-[0.1em] text-[var(--grey-500)] mb-3"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Trending Mentions
            </div>
            <div className="text-center py-8 text-[var(--grey-500)] text-sm">
              Social monitoring coming soon
            </div>
          </div>
        )}

        {/* Predictions Tab Content */}
        {activeSidebarTab === 'predictions' && (
          <div>
            <div
              className="text-[0.65rem] uppercase tracking-[0.1em] text-[var(--grey-500)] mb-3 flex items-center justify-between"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <span>Predictions</span>
              <button
                onClick={() => onNavigate('predictions')}
                className="text-[var(--burnt-orange)] hover:underline text-[0.65rem]"
              >
                View All
              </button>
            </div>

            {predictions.length > 0 ? (
              predictions.slice(0, 5).map((pred, idx) => (
                <IntelItem
                  key={pred.id || idx}
                  title={pred.prediction_text || pred.title || 'Prediction'}
                  highlight={`${pred.confidence_score || 0}%`}
                  meta={`confidence · ${pred.category || 'general'}`}
                />
              ))
            ) : (
              <div className="text-center py-8 text-[var(--grey-500)] text-sm">
                No predictions yet. Generate an intelligence brief to detect predictions.
              </div>
            )}
          </div>
        )}

        {/* Connections Tab Content */}
        {activeSidebarTab === 'connections' && (
          <div>
            <div
              className="text-[0.65rem] uppercase tracking-[0.1em] text-[var(--grey-500)] mb-3 flex items-center justify-between"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <span>Connection Signals</span>
              <button
                onClick={() => onNavigate('connections')}
                className="text-[var(--burnt-orange)] hover:underline text-[0.65rem]"
              >
                View All
              </button>
            </div>

            {connections.length > 0 ? (
              connections.slice(0, 5).map((conn, idx) => (
                <IntelItem
                  key={conn.id || idx}
                  title={conn.signal_title || conn.headline || 'Connection Signal'}
                  highlight={conn.signal_strength ? `${Math.round(conn.signal_strength * 100)}%` : 'New'}
                  meta={`${conn.client_impact_level || 'medium'} impact · ${conn.signal_type || 'general'}`}
                />
              ))
            ) : (
              <div className="text-center py-8 text-[var(--grey-500)] text-sm">
                No connections yet. Generate an intelligence brief to detect connections.
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  )
}

// Expandable Opportunity Card Component for Hub
function ExpandableOpportunityCard({
  opportunity,
  isExpanded,
  isExecuting,
  executionProgress,
  onToggle,
  onExecute
}: {
  opportunity: any
  isExpanded: boolean
  isExecuting: boolean
  executionProgress?: { current?: string; progress?: number }
  onToggle: () => void
  onExecute: () => void
}) {
  const score = opportunity.score || opportunity.priority_score || 80
  const title = opportunity.title || opportunity.opportunity_title || 'Opportunity'
  const description = opportunity.description || opportunity.summary || ''
  const timeWindow = opportunity.strategic_context?.time_window || opportunity.time_window || '48h window'
  const isHigh = score >= 90
  const isMedium = score >= 70 && score < 90
  const isV2 = opportunity.version === 2 && opportunity.execution_plan
  const isExecuted = opportunity.executed

  return (
    <div
      className={`
        relative bg-[var(--grey-900)] border rounded-[10px] mb-3 overflow-hidden transition-all
        ${isExpanded ? 'border-[var(--burnt-orange)]' : 'border-[var(--grey-800)] hover:border-[var(--grey-700)]'}
        ${isHigh ? 'before:absolute before:top-0 before:left-0 before:w-1 before:h-full before:bg-[var(--burnt-orange)] before:rounded-l-[10px]' : ''}
      `}
    >
      {/* Header - Always visible, clickable to expand */}
      <div
        className="p-[18px] cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-3">
            <span
              className={`text-[1.2rem] font-bold ${isHigh ? 'text-[var(--burnt-orange)]' : isMedium ? 'text-[var(--grey-400)]' : 'text-[var(--grey-500)]'}`}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {score}
            </span>
            {isExecuted && (
              <span className="px-2 py-0.5 text-[0.65rem] bg-green-500/20 text-green-400 rounded border border-green-500/30">
                ✓ EXECUTED
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[0.75rem] text-[var(--grey-500)] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {timeWindow}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-[var(--grey-500)]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[var(--grey-500)]" />
            )}
          </div>
        </div>

        <h4
          className="text-[0.95rem] font-medium text-white mb-1"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {title}
        </h4>
        <p className={`text-[0.8rem] text-[var(--grey-400)] leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
          {description}
        </p>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-[18px] pb-[18px] border-t border-[var(--grey-800)]">
          {/* Strategic Context - V2 Only */}
          {isV2 && opportunity.strategic_context && (
            <div className="mt-4">
              <h5
                className="text-[0.7rem] uppercase tracking-[0.1em] text-white mb-3"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Strategic Context
              </h5>

              {/* Trigger Events */}
              {opportunity.strategic_context.trigger_events && opportunity.strategic_context.trigger_events.length > 0 && (
                <div className="mb-3 p-3 bg-[var(--grey-800)] rounded-lg">
                  <h6 className="text-[0.7rem] font-semibold text-white mb-2 uppercase tracking-wide">Trigger Events</h6>
                  <ul className="space-y-1">
                    {opportunity.strategic_context.trigger_events.slice(0, 3).map((event: string, idx: number) => (
                      <li key={idx} className="text-[0.8rem] text-[var(--grey-300)] flex items-start gap-2">
                        <ChevronRight className="w-3 h-3 text-[var(--burnt-orange)] mt-0.5 flex-shrink-0" />
                        <span>{event}</span>
                      </li>
                    ))}
                    {opportunity.strategic_context.trigger_events.length > 3 && (
                      <li className="text-[0.75rem] text-[var(--grey-500)]">
                        +{opportunity.strategic_context.trigger_events.length - 3} more
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Why Now */}
              {opportunity.strategic_context.why_now && (
                <div className="mb-3 p-3 bg-[var(--grey-800)] rounded-lg">
                  <h6 className="text-[0.7rem] font-semibold text-white mb-2 uppercase tracking-wide">Why Now</h6>
                  <p className="text-[0.8rem] text-[var(--grey-300)]">{opportunity.strategic_context.why_now}</p>
                </div>
              )}

              {/* Competitive Advantage */}
              {opportunity.strategic_context.competitive_advantage && (
                <div className="mb-3 p-3 bg-[var(--grey-800)] rounded-lg">
                  <h6 className="text-[0.7rem] font-semibold text-white mb-2 uppercase tracking-wide">Competitive Advantage</h6>
                  <p className="text-[0.8rem] text-[var(--grey-300)]">{opportunity.strategic_context.competitive_advantage}</p>
                </div>
              )}

              {/* Expected Impact */}
              {opportunity.strategic_context.expected_impact && (
                <div className="mb-3 p-3 bg-[var(--grey-800)] rounded-lg">
                  <h6 className="text-[0.7rem] font-semibold text-white mb-2 uppercase tracking-wide">Expected Impact</h6>
                  <p className="text-[0.8rem] text-[var(--grey-300)]">{opportunity.strategic_context.expected_impact}</p>
                </div>
              )}

              {/* Media Targeting */}
              {opportunity.strategic_context.media_targeting && (
                <div className="mb-3 p-3 bg-[var(--burnt-orange-muted)] rounded-lg border border-[var(--burnt-orange)]/30">
                  <h6 className="text-[0.7rem] font-semibold text-white mb-2 flex items-center gap-2 uppercase tracking-wide">
                    <Users className="w-3 h-3 text-[var(--burnt-orange)]" />
                    Media Targeting Strategy
                  </h6>
                  <p className="text-[0.75rem] text-[var(--grey-300)] mb-2">{opportunity.strategic_context.media_targeting.reasoning}</p>
                  {opportunity.strategic_context.media_targeting.primary_journalist_types && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {opportunity.strategic_context.media_targeting.primary_journalist_types.slice(0, 4).map((type: string, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 text-[0.65rem] bg-[var(--burnt-orange)]/20 text-[var(--burnt-orange)] rounded border border-[var(--burnt-orange)]/30">
                          {type}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Execution Plan Summary - V2 Only */}
          {isV2 && opportunity.execution_plan && (
            <div className="mt-4">
              <h5
                className="text-[0.7rem] uppercase tracking-[0.1em] text-white mb-3"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Execution Plan
              </h5>

              {opportunity.execution_plan.stakeholder_campaigns && (
                <div className="space-y-2">
                  {opportunity.execution_plan.stakeholder_campaigns.slice(0, 2).map((campaign: any, idx: number) => (
                    <div key={idx} className="p-3 bg-[var(--grey-800)] rounded-lg border border-[var(--grey-700)]">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-3 h-3 text-[var(--burnt-orange)]" />
                        <span className="text-[0.8rem] font-semibold text-white">{campaign.stakeholder_name}</span>
                        <span className="px-1.5 py-0.5 text-[0.6rem] bg-[var(--burnt-orange-muted)] text-[var(--burnt-orange)] rounded">
                          Priority {campaign.stakeholder_priority}
                        </span>
                      </div>
                      <div className="text-[0.7rem] text-[var(--grey-400)]">
                        {campaign.content_items?.length || 0} content pieces · {campaign.lever_name}
                      </div>
                    </div>
                  ))}
                  {opportunity.execution_plan.stakeholder_campaigns.length > 2 && (
                    <p className="text-[0.75rem] text-[var(--grey-500)] pl-3">
                      +{opportunity.execution_plan.stakeholder_campaigns.length - 2} more campaigns
                    </p>
                  )}
                </div>
              )}

              {/* Total Content Items */}
              {opportunity.execution_plan.stakeholder_campaigns && (
                <div className="mt-3 text-[0.75rem] text-[var(--grey-400)]">
                  Total: {opportunity.execution_plan.stakeholder_campaigns.reduce((sum: number, c: any) => sum + (c.content_items?.length || 0), 0)} content items to generate
                </div>
              )}
            </div>
          )}

          {/* Presentation Link - if executed */}
          {isExecuted && opportunity.presentation_url && (
            <div className="mt-4">
              <a
                href={opportunity.presentation_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[var(--burnt-orange)] text-white rounded-lg hover:bg-[var(--burnt-orange-light)] transition-colors text-[0.8rem] font-medium"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View Gamma Presentation
              </a>
            </div>
          )}

          {/* Execute Button - V2 only, not executed */}
          {isV2 && !isExecuted && (
            <div className="mt-4 space-y-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onExecute()
                }}
                disabled={isExecuting}
                className="w-full px-4 py-3 bg-gradient-to-r from-[var(--burnt-orange)] to-orange-600 text-white rounded-lg text-[0.85rem] font-medium flex items-center justify-center gap-2 hover:from-[var(--burnt-orange-light)] hover:to-orange-500 transition-all disabled:opacity-50"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {executionProgress?.current || 'Executing...'}
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Execute Campaign
                  </>
                )}
              </button>
              {isExecuting && executionProgress?.progress !== undefined && (
                <div className="space-y-1">
                  <div className="w-full bg-[var(--grey-800)] rounded-full h-1.5">
                    <div
                      className="bg-gradient-to-r from-[var(--burnt-orange)] to-orange-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${executionProgress.progress}%` }}
                    />
                  </div>
                  <div className="text-[0.7rem] text-[var(--grey-500)] text-center">
                    {executionProgress.progress}% complete
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Non-V2 Message */}
          {!isV2 && (
            <div className="mt-4 p-3 bg-[var(--grey-800)] rounded-lg text-center">
              <p className="text-[0.8rem] text-[var(--grey-500)]">
                This opportunity requires V2 format for execution. View in Opportunities tab for more details.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Legacy Opportunity Card Component (kept for reference)
function OpportunityCard({
  score,
  title,
  description,
  timeWindow,
  priority = 'normal',
  onExecute
}: {
  score: number
  title: string
  description: string
  timeWindow: string
  priority?: 'high' | 'medium' | 'normal'
  onExecute?: () => void
}) {
  const isHigh = priority === 'high' || score >= 90
  const isMedium = priority === 'medium' || (score >= 70 && score < 90)

  return (
    <div
      className={`
        relative bg-[var(--grey-900)] border border-[var(--grey-800)] rounded-[10px] p-[18px] mb-3
        cursor-pointer transition-all hover:border-[var(--burnt-orange)]
        ${isHigh ? 'before:absolute before:top-0 before:left-0 before:w-1 before:h-full before:bg-[var(--burnt-orange)] before:rounded-l-[10px]' : ''}
      `}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <span
          className={`text-[1.2rem] font-bold ${isHigh ? 'text-[var(--burnt-orange)]' : isMedium ? 'text-[var(--grey-400)]' : 'text-[var(--grey-500)]'}`}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {score}
        </span>
        <span className="text-[0.75rem] text-[var(--grey-500)] flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          {timeWindow}
        </span>
      </div>

      {/* Content */}
      <h4
        className="text-[0.95rem] font-medium text-white mb-1"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {title}
      </h4>
      <p className="text-[0.8rem] text-[var(--grey-400)] leading-relaxed line-clamp-2">
        {description}
      </p>

      {/* Execute Button */}
      {onExecute && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onExecute()
          }}
          className="mt-3 px-4 py-2.5 bg-[var(--burnt-orange)] text-white rounded-md text-[0.8rem] font-medium flex items-center gap-1.5 hover:bg-[var(--burnt-orange-light)] transition-colors"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <ArrowRight className="w-3.5 h-3.5" />
          Execute Campaign
        </button>
      )}
    </div>
  )
}

// Intel Item Component
function IntelItem({
  title,
  highlight,
  meta
}: {
  title: string
  highlight: string
  meta: string
}) {
  return (
    <div className="p-3 bg-[var(--grey-800)] rounded-lg mb-2 cursor-pointer hover:bg-[var(--grey-700)] transition-colors">
      <div className="text-[0.85rem] text-white mb-1">{title}</div>
      <div className="text-[0.75rem] text-[var(--grey-500)]">
        <span className="text-[var(--burnt-orange)] font-medium">{highlight}</span> {meta}
      </div>
    </div>
  )
}

// Coming Soon Placeholder
function ComingSoonView({ title }: { title: string }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <Sparkles className="w-16 h-16 mx-auto mb-4 text-[var(--grey-600)]" />
        <h2
          className="text-xl font-medium text-white mb-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {title}
        </h2>
        <p className="text-[var(--grey-500)] text-sm">
          This module is coming soon.
        </p>
      </div>
    </div>
  )
}
