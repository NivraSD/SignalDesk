'use client'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'

import { useState, useEffect, useRef } from 'react'
import { Brain, Target, FileText, Rocket, Database, Sparkles, User, ChevronDown, Plus, Shield, Bot, FileEdit, TrendingUp, MessageCircle, AlertTriangle, Trash2, X, Building2 } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import InfiniteCanvas from '@/components/canvas/InfiniteCanvas'
import IntelligenceModule from '@/components/modules/IntelligenceModule'
import OrganizationOnboarding from '@/components/onboarding/OrganizationOnboarding'
import TargetManagement from '@/components/targets/TargetManagement'
import OrgManagementDashboard from '@/components/admin/OrgManagementDashboard'
import { motion, AnimatePresence } from 'framer-motion'

const tabs = [
  { id: 'niv-command', name: 'NIV', icon: Brain, color: '#bb44ff' },
  { id: 'intelligence', name: 'Intelligence', icon: Brain, color: '#00ffcc' },
  { id: 'opportunities', name: 'Opportunities', icon: Target, color: '#ff00ff' },
  { id: 'campaign-planner', name: 'Campaigns', icon: TrendingUp, color: '#00ddff' },
  { id: 'execute', name: 'Execute', icon: Rocket, color: '#00ff88' },
  { id: 'crisis', name: 'Crisis', icon: Shield, color: '#ff0000' },
  { id: 'memoryvault', name: 'MemoryVault', icon: Database, color: '#ffaa00' },
]

export default function Dashboard() {
  const router = useRouter()
  const { activeModule, switchModule, organization, setOrganization } = useAppStore()
  const [showModuleMenu, setShowModuleMenu] = useState<string | null>(null)
  const [showProjectMenu, setShowProjectMenu] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showTargetManagement, setShowTargetManagement] = useState(false)
  const [showOrgDashboard, setShowOrgDashboard] = useState(false)
  const [currentTime, setCurrentTime] = useState<string>('')
  const [openComponents, setOpenComponents] = useState<string[]>([])
  const [hasCrisisAlerts, setHasCrisisAlerts] = useState(false)
  const [organizations, setOrganizations] = useState<any[]>([])
  const [loadingOrgs, setLoadingOrgs] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [orgToDelete, setOrgToDelete] = useState<any>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Load organizations from database
  const loadOrganizations = async () => {
    setLoadingOrgs(true)
    try {
      const response = await fetch('/api/organizations')
      const data = await response.json()

      if (data.success && data.organizations) {
        setOrganizations(data.organizations)

        // If no org selected, select the first one
        if (!organization && data.organizations.length > 0) {
          const firstOrg = data.organizations[0]
          setOrganization({
            id: firstOrg.id,
            name: firstOrg.name,
            industry: firstOrg.industry,
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

  // Delete organization
  const deleteOrganization = async (org: any) => {
    try {
      const response = await fetch(`/api/organizations?id=${org.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        alert(`Failed to delete organization: ${data.error || 'Unknown error'}`)
        return
      }

      console.log(`✅ Deleted organization: ${org.name}`)

      // If deleted org was selected, switch to first available org
      if (organization?.id === org.id) {
        const remainingOrgs = organizations.filter(o => o.id !== org.id)
        if (remainingOrgs.length > 0) {
          setOrganization({
            id: remainingOrgs[0].id,
            name: remainingOrgs[0].name,
            industry: remainingOrgs[0].industry,
            config: {}
          })
        } else {
          setOrganization(null)
        }
      }

      // Reload organizations list
      await loadOrganizations()
    } catch (error) {
      console.error('Failed to delete organization:', error)
      alert('Failed to delete organization. Please try again.')
    }
  }

  // Handle delete confirmation
  const handleDeleteClick = (org: any, e: React.MouseEvent) => {
    e.stopPropagation()
    setOrgToDelete(org)
    setShowDeleteConfirm(true)
    setShowProjectMenu(false)
  }

  const confirmDelete = async () => {
    if (orgToDelete) {
      await deleteOrganization(orgToDelete)
      setShowDeleteConfirm(false)
      setOrgToDelete(null)
    }
  }

  const cancelDelete = () => {
    setShowDeleteConfirm(false)
    setOrgToDelete(null)
  }

  // Load organizations on mount
  useEffect(() => {
    loadOrganizations()
  }, [])

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowModuleMenu(null)
        setShowProjectMenu(false)
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Update time on client side only
  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString())
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Listen for canvas component changes to highlight tabs
  useEffect(() => {
    const handleComponentsChanged = (event: CustomEvent) => {
      setOpenComponents(event.detail.components)
    }
    window.addEventListener('canvasComponentsChanged' as any, handleComponentsChanged as any)
    return () => {
      window.removeEventListener('canvasComponentsChanged' as any, handleComponentsChanged as any)
    }
  }, [])

  // Listen for crisis alerts
  useEffect(() => {
    const handleCrisisAlerts = (event: CustomEvent) => {
      setHasCrisisAlerts(event.detail.alertCount > 0)
    }
    window.addEventListener('crisisAlertsDetected' as any, handleCrisisAlerts as any)
    return () => {
      window.removeEventListener('crisisAlertsDetected' as any, handleCrisisAlerts as any)
    }
  }, [])

  const handleModuleClick = (moduleId: string) => {
    if (showModuleMenu === moduleId) {
      setShowModuleMenu(null)
    } else {
      setShowModuleMenu(moduleId)
    }
  }

  const handleModuleAction = (moduleId: string, action: 'window' | 'view') => {
    if (action === 'view' && openComponents.includes(moduleId)) {
      // Focus existing component
      const event = new CustomEvent('focusComponent', {
        detail: { moduleId }
      })
      window.dispatchEvent(event)
    } else {
      // Add new component to canvas
      const event = new CustomEvent('addComponentToCanvas', {
        detail: { moduleId, action: 'window' }
      })
      window.dispatchEvent(event)
    }
    setShowModuleMenu(null)
  }

  return (
    <div className="h-screen overflow-hidden bg-gray-950 text-gray-100">
      {/* Header with Neon Styling */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-xl" 
        style={{ 
          borderBottom: '1px solid rgba(0, 255, 204, 0.2)',
          boxShadow: '0 2px 20px rgba(0, 255, 204, 0.1)' 
        }}>
        <div className="flex items-center justify-between px-6 py-3">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl font-bold" style={{ color: '#00ffcc', textShadow: '0 0 10px rgba(0, 255, 204, 0.5)' }}>
                SIGNALDESK
              </h1>
              <p className="text-xs text-gray-500">Intelligence Command Center</p>
            </div>
          </div>
          
          {/* Main Navigation Tabs */}
          <nav className="flex gap-1 md:gap-2 flex-wrap" ref={menuRef}>
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = openComponents.includes(tab.id) ||
                             (tab.id === 'intelligence' && (openComponents.includes('intelligence') || openComponents.includes('niv'))) ||
                             (tab.id === 'crisis' && (openComponents.includes('crisis') || openComponents.includes('niv-crisis')))
              
              return (
                <div key={tab.id} className="relative">
                  <button
                    onClick={() => handleModuleClick(tab.id)}
                    className={`
                      relative px-2 py-1.5 md:px-4 md:py-2 rounded-lg flex items-center gap-1 md:gap-2 transition-all text-xs md:text-sm
                      ${isActive
                        ? 'text-black font-semibold'
                        : 'hover:bg-gray-800 text-gray-400 hover:text-gray-200'
                      }
                      ${tab.id === 'crisis' && hasCrisisAlerts && !isActive ? 'ring-2 ring-red-500 animate-pulse' : ''}
                    `}
                    style={isActive ? {
                      background: tab.color,
                      boxShadow: `0 0 20px ${tab.color}50`,
                    } : tab.id === 'crisis' && hasCrisisAlerts ? {
                      boxShadow: '0 0 15px rgba(239, 68, 68, 0.5)',
                    } : {}}
                  >
                    <Icon className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden sm:inline">{tab.name}</span>
                    {tab.id === 'crisis' && hasCrisisAlerts && (
                      <span className="ml-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    )}
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </button>
                  
                  {/* Module Action Menu */}
                  <AnimatePresence>
                    {showModuleMenu === tab.id && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full mt-2 left-0 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50"
                        style={{ minWidth: '200px' }}
                      >
                        {tab.id === 'niv-command' ? (
                          <>
                            <div className="px-4 py-2 text-xs text-gray-500 font-semibold uppercase border-b border-gray-800">
                              NIV Strategic Advisor
                            </div>
                            {openComponents.includes('niv-command') ? (
                              <button
                                onClick={() => handleModuleAction('niv-command', 'view')}
                                className="w-full text-left px-4 py-2 hover:bg-gray-800 text-sm flex items-center gap-2"
                              >
                                <Brain className="w-4 h-4 text-purple-400" />
                                View NIV
                              </button>
                            ) : (
                              <button
                                onClick={() => handleModuleAction('niv-command', 'window')}
                                className="w-full text-left px-4 py-2 hover:bg-gray-800 text-sm flex items-center gap-2"
                              >
                                <Plus className="w-4 h-4" />
                                Open NIV
                              </button>
                            )}
                            <button
                              onClick={() => handleModuleAction('niv-command', 'window')}
                              className="w-full text-left px-4 py-2 hover:bg-gray-800 text-sm text-gray-400 flex items-center gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              Open New Window
                            </button>
                            <div className="px-4 py-2 text-xs text-gray-500 font-semibold uppercase border-b border-t border-gray-800">
                              Resources
                            </div>
                            {openComponents.includes('niv-capabilities') ? (
                              <button
                                onClick={() => handleModuleAction('niv-capabilities', 'view')}
                                className="w-full text-left px-4 py-2 hover:bg-gray-800 text-sm flex items-center gap-2"
                              >
                                <Sparkles className="w-4 h-4 text-purple-400" />
                                View NIV Capabilities
                              </button>
                            ) : (
                              <button
                                onClick={() => handleModuleAction('niv-capabilities', 'window')}
                                className="w-full text-left px-4 py-2 hover:bg-gray-800 text-sm flex items-center gap-2"
                              >
                                <Plus className="w-4 h-4" />
                                NIV Capabilities
                              </button>
                            )}
                            {openComponents.includes('niv-prompts') ? (
                              <button
                                onClick={() => handleModuleAction('niv-prompts', 'view')}
                                className="w-full text-left px-4 py-2 hover:bg-gray-800 text-sm flex items-center gap-2"
                              >
                                <FileText className="w-4 h-4 text-purple-400" />
                                View Prompt Library
                              </button>
                            ) : (
                              <button
                                onClick={() => handleModuleAction('niv-prompts', 'window')}
                                className="w-full text-left px-4 py-2 hover:bg-gray-800 text-sm flex items-center gap-2"
                              >
                                <Plus className="w-4 h-4" />
                                Prompt Library
                              </button>
                            )}
                          </>
                        ) : tab.id === 'intelligence' ? (
                          <>
                            <div className="px-4 py-2 text-xs text-gray-500 font-semibold uppercase border-b border-gray-800">
                              Intelligence Hub
                            </div>
                            {openComponents.includes('intelligence') ? (
                              <button
                                onClick={() => handleModuleAction('intelligence', 'view')}
                                className="w-full text-left px-4 py-2 hover:bg-gray-800 text-sm flex items-center gap-2"
                              >
                                <Brain className="w-4 h-4 text-cyan-400" />
                                View Intelligence
                              </button>
                            ) : (
                              <button
                                onClick={() => handleModuleAction('intelligence', 'window')}
                                className="w-full text-left px-4 py-2 hover:bg-gray-800 text-sm flex items-center gap-2"
                              >
                                <Plus className="w-4 h-4" />
                                Open Intelligence
                              </button>
                            )}
                            <button
                              onClick={() => handleModuleAction('intelligence', 'window')}
                              className="w-full text-left px-4 py-2 hover:bg-gray-800 text-sm text-gray-400 flex items-center gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              Open New Window
                            </button>
                          </>
                        ) : tab.id === 'campaign-planner' ? (
                          <>
                            <div className="px-4 py-2 text-xs text-gray-500 font-semibold uppercase border-b border-gray-800">
                              Strategic Campaigns
                            </div>
                            <button
                              onClick={() => {
                                router.push('/campaign-builder')
                                setShowModuleMenu(null)
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-800 text-sm flex items-center gap-2"
                            >
                              <TrendingUp className="w-4 h-4 text-cyan-400" />
                              Campaign Builder
                            </button>
                            <div className="px-4 py-2 text-xs text-gray-500 font-semibold uppercase border-b border-t border-gray-800">
                              Planning
                            </div>
                            {openComponents.includes('plan') ? (
                              <button
                                onClick={() => handleModuleAction('plan', 'view')}
                                className="w-full text-left px-4 py-2 hover:bg-gray-800 text-sm flex items-center gap-2"
                              >
                                <FileText className="w-4 h-4 text-cyan-400" />
                                View Planning
                              </button>
                            ) : (
                              <button
                                onClick={() => handleModuleAction('plan', 'window')}
                                className="w-full text-left px-4 py-2 hover:bg-gray-800 text-sm flex items-center gap-2"
                              >
                                <Plus className="w-4 h-4" />
                                Open Planning
                              </button>
                            )}
                          </>
                        ) : tab.id === 'crisis' ? (
                          <>
                            <div className="px-4 py-2 text-xs text-gray-500 font-semibold uppercase border-b border-gray-800">
                              Crisis Command Center
                            </div>
                            {openComponents.includes('crisis') ? (
                              <button
                                onClick={() => handleModuleAction('crisis', 'view')}
                                className="w-full text-left px-4 py-2 hover:bg-gray-800 text-sm flex items-center gap-2"
                              >
                                <Shield className="w-4 h-4 text-cyan-400" />
                                View Command Center
                              </button>
                            ) : (
                              <button
                                onClick={() => handleModuleAction('crisis', 'window')}
                                className="w-full text-left px-4 py-2 hover:bg-gray-800 text-sm flex items-center gap-2"
                              >
                                <Plus className="w-4 h-4" />
                                Open Command Center
                              </button>
                            )}
                            <button
                              onClick={() => handleModuleAction('crisis', 'window')}
                              className="w-full text-left px-4 py-2 hover:bg-gray-800 text-sm text-gray-400 flex items-center gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              Open New Window
                            </button>
                            <div className="px-4 py-2 text-xs text-gray-500 font-semibold uppercase border-b border-t border-gray-800">
                              NIV Crisis Consultant
                            </div>
                            {openComponents.includes('niv-crisis') ? (
                              <button
                                onClick={() => handleModuleAction('niv-crisis', 'view')}
                                className="w-full text-left px-4 py-2 hover:bg-gray-800 text-sm flex items-center gap-2"
                              >
                                <Bot className="w-4 h-4 text-cyan-400" />
                                View NIV Consultant
                              </button>
                            ) : (
                              <button
                                onClick={() => handleModuleAction('niv-crisis', 'window')}
                                className="w-full text-left px-4 py-2 hover:bg-gray-800 text-sm flex items-center gap-2"
                              >
                                <Plus className="w-4 h-4" />
                                Open NIV Consultant
                              </button>
                            )}
                            <button
                              onClick={() => handleModuleAction('niv-crisis', 'window')}
                              className="w-full text-left px-4 py-2 hover:bg-gray-800 text-sm text-gray-400 flex items-center gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              Open New Window
                            </button>
                          </>
                        ) : tab.id === 'execute' ? (
                          <>
                            <div className="px-4 py-2 text-xs text-gray-500 font-semibold uppercase border-b border-gray-800">
                              Content Execution
                            </div>
                            {openComponents.includes('execute') ? (
                              <button
                                onClick={() => handleModuleAction('execute', 'view')}
                                className="w-full text-left px-4 py-2 hover:bg-gray-800 text-sm flex items-center gap-2"
                              >
                                <Rocket className="w-4 h-4 text-cyan-400" />
                                View Execute
                              </button>
                            ) : (
                              <button
                                onClick={() => handleModuleAction('execute', 'window')}
                                className="w-full text-left px-4 py-2 hover:bg-gray-800 text-sm flex items-center gap-2"
                              >
                                <Plus className="w-4 h-4" />
                                Open Execute
                              </button>
                            )}
                            <button
                              onClick={() => handleModuleAction('execute', 'window')}
                              className="w-full text-left px-4 py-2 hover:bg-gray-800 text-sm text-gray-400 flex items-center gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              Open New Window
                            </button>
                            <div className="px-4 py-2 text-xs text-gray-500 font-semibold uppercase border-b border-t border-gray-800">
                              Workspace
                            </div>
                            {openComponents.includes('workspace') ? (
                              <button
                                onClick={() => handleModuleAction('workspace', 'view')}
                                className="w-full text-left px-4 py-2 hover:bg-gray-800 text-sm flex items-center gap-2"
                              >
                                <FileEdit className="w-4 h-4 text-cyan-400" />
                                View Workspace
                              </button>
                            ) : (
                              <button
                                onClick={() => handleModuleAction('workspace', 'window')}
                                className="w-full text-left px-4 py-2 hover:bg-gray-800 text-sm flex items-center gap-2"
                              >
                                <Plus className="w-4 h-4" />
                                Open Workspace
                              </button>
                            )}
                            <button
                              onClick={() => handleModuleAction('workspace', 'window')}
                              className="w-full text-left px-4 py-2 hover:bg-gray-800 text-sm text-gray-400 flex items-center gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              Open New Window
                            </button>
                          </>
                        ) : (
                          <>
                            {openComponents.includes(tab.id) ? (
                              <button
                                onClick={() => handleModuleAction(tab.id, 'view')}
                                className="w-full text-left px-4 py-2 hover:bg-gray-800 text-sm flex items-center gap-2"
                              >
                                <Icon className="w-4 h-4 text-cyan-400" />
                                View {tab.name}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleModuleAction(tab.id, 'window')}
                                className="w-full text-left px-4 py-2 hover:bg-gray-800 text-sm flex items-center gap-2"
                              >
                                <Plus className="w-4 h-4" />
                                Open {tab.name}
                              </button>
                            )}
                            <button
                              onClick={() => handleModuleAction(tab.id, 'window')}
                              className="w-full text-left px-4 py-2 hover:bg-gray-800 text-sm text-gray-400 flex items-center gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              Open New Window
                            </button>
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </nav>

          {/* Right Side: Project Selector and User Profile */}
          <div className="flex items-center gap-4">
            {/* Project Selector */}
            <div className="relative">
              <button
                onClick={() => setShowProjectMenu(!showProjectMenu)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <span className="text-sm">{organization?.name || 'Select Organization'}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              <AnimatePresence>
                {showProjectMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full mt-2 right-0 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden"
                    style={{ minWidth: '200px' }}
                  >
                    {loadingOrgs ? (
                      <div className="px-4 py-2 text-sm text-gray-500">Loading...</div>
                    ) : organizations.length === 0 ? (
                      <div className="px-4 py-2 text-sm text-gray-500">No organizations</div>
                    ) : (
                      organizations.map(org => (
                        <div
                          key={org.id}
                          className={`flex items-center justify-between gap-2 px-4 py-2 hover:bg-gray-800 text-sm group ${
                            organization?.id === org.id ? 'bg-gray-800 text-cyan-400' : ''
                          }`}
                        >
                          <button
                            onClick={() => {
                              setOrganization({
                                id: org.id,
                                name: org.name,
                                industry: org.industry,
                                config: {}
                              })
                              setShowProjectMenu(false)
                            }}
                            className="flex-1 text-left"
                          >
                            <div className="font-medium">{org.name}</div>
                            {org.industry && (
                              <div className="text-xs text-gray-500">{org.industry}</div>
                            )}
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(org, e)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                            title="Delete organization"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      ))
                    )}
                    <div className="border-t border-gray-700">
                      {organization && (
                        <button
                          onClick={() => {
                            setShowProjectMenu(false)
                            setShowTargetManagement(true)
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-800 text-sm text-white flex items-center gap-2"
                        >
                          <Target className="w-4 h-4" />
                          Manage Targets
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setShowProjectMenu(false)
                          setShowOnboarding(true)
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-800 text-sm text-cyan-400 flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        New Organization
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Profile */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full mt-2 right-0 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden"
                    style={{ minWidth: '200px' }}
                  >
                    <div className="px-4 py-3 border-b border-gray-700">
                      <p className="text-sm font-semibold">John Doe</p>
                      <p className="text-xs text-gray-500">john@signaldesk.ai</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowProfileMenu(false)
                        setShowOrgDashboard(true)
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-800 text-sm flex items-center gap-2"
                    >
                      <Building2 className="w-4 h-4" />
                      Manage Organizations
                    </button>
                    <button className="w-full text-left px-4 py-2 hover:bg-gray-800 text-sm">
                      Profile Settings
                    </button>
                    <button className="w-full text-left px-4 py-2 hover:bg-gray-800 text-sm">
                      Preferences
                    </button>
                    <div className="border-t border-gray-700">
                      <button className="w-full text-left px-4 py-2 hover:bg-gray-800 text-sm text-red-400">
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area with Infinite Canvas */}
      <main className="pt-16 h-screen overflow-hidden">
        <InfiniteCanvas>
          {/* Components will be added here dynamically */}
          {/* NIV is now integrated into the canvas as a draggable, resizable component */}
        </InfiniteCanvas>
      </main>

      {/* Organization Onboarding Modal */}
      <OrganizationOnboarding
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={(newOrg) => {
          // Reload organizations list
          loadOrganizations()
          // Set the new org as active
          setOrganization(newOrg)
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={cancelDelete}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 border border-red-500/30 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">Delete Organization?</h3>
                  <p className="text-gray-400 mb-4">
                    Are you sure you want to delete <span className="font-semibold text-white">{orgToDelete?.name}</span>?
                  </p>
                  <p className="text-sm text-red-400 mb-6">
                    ⚠️ This will permanently delete all data, including intelligence targets, campaigns, content, and predictions for this organization. This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={confirmDelete}
                      className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                    >
                      Delete Organization
                    </button>
                    <button
                      onClick={cancelDelete}
                      className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Target Management Modal */}
      {organization && (
        <TargetManagement
          isOpen={showTargetManagement}
          onClose={() => setShowTargetManagement(false)}
          organizationId={organization.id}
          organizationName={organization.name}
        />
      )}

      {/* Org Management Dashboard */}
      <OrgManagementDashboard
        isOpen={showOrgDashboard}
        onClose={() => setShowOrgDashboard(false)}
        onNewOrg={() => {
          setShowOrgDashboard(false)
          setShowOnboarding(true)
        }}
        onSelectOrg={(org) => {
          setOrganization({
            id: org.id,
            name: org.name,
            industry: org.industry,
            config: {}
          })
        }}
        onManageTargets={(org) => {
          setOrganization({
            id: org.id,
            name: org.name,
            industry: org.industry,
            config: {}
          })
          setShowTargetManagement(true)
        }}
        onDeleteOrg={(org) => {
          setOrgToDelete(org)
          setShowDeleteConfirm(true)
        }}
      />
    </div>
  )
}