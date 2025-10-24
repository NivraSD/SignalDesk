'use client'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'

import { useState, useEffect, useRef } from 'react'
import { Brain, Target, FileText, Rocket, Database, Sparkles, User, ChevronDown, Plus, Shield, Bot, FileEdit, TrendingUp, MessageCircle, AlertTriangle } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import InfiniteCanvas from '@/components/canvas/InfiniteCanvas'
import IntelligenceModule from '@/components/modules/IntelligenceModule'
import { motion, AnimatePresence } from 'framer-motion'

const tabs = [
  { id: 'niv-command', name: 'NIV', icon: Brain, color: '#bb44ff' },
  { id: 'intelligence', name: 'Intelligence', icon: Brain, color: '#00ffcc' },
  { id: 'opportunities', name: 'Opportunities', icon: Target, color: '#ff00ff' },
  { id: 'campaign-planner', name: 'Campaigns', icon: TrendingUp, color: '#00ddff' },
  { id: 'plan', name: 'Plan', icon: FileText, color: '#8800ff' },
  { id: 'execute', name: 'Execute', icon: Rocket, color: '#00ff88' },
  { id: 'crisis', name: 'Crisis', icon: Shield, color: '#ff0000' },
  { id: 'memoryvault', name: 'MemoryVault', icon: Database, color: '#ffaa00' },
]

const projects = [
  { id: '7a2835cb-11ee-4512-acc3-b6caf8eb03ff', name: 'OpenAI', industry: 'Artificial Intelligence' },
  { id: '852099f4-1a4d-44d1-ad90-932d0ef7f840', name: 'Buffer', industry: 'Social Media' },
  { id: '85a7c337-8e83-4335-9897-986fdd56c84b', name: 'Sprout Social', industry: 'Social Media' },
  { id: 'b6ad8f95-d3ce-4bac-8cfa-da2d848accb0', name: 'Sprinklr', industry: 'Social Media' },
  { id: 'fd9f16ca-433d-4fd4-ad71-a5f0c325122f', name: 'Hootsuite', industry: 'Social Media' }
]

export default function Dashboard() {
  const router = useRouter()
  const { activeModule, switchModule, organization, setOrganization } = useAppStore()
  const [showModuleMenu, setShowModuleMenu] = useState<string | null>(null)
  const [showProjectMenu, setShowProjectMenu] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [currentTime, setCurrentTime] = useState<string>('')
  const [openComponents, setOpenComponents] = useState<string[]>([])
  const [hasCrisisAlerts, setHasCrisisAlerts] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Initialize with default organization if none exists or if ID is not a UUID
  useEffect(() => {
    const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)

    if (!organization || !isUUID(organization.id)) {
      setOrganization({
        id: projects[0].id,
        name: projects[0].name,
        industry: projects[0].industry,
        config: {}
      })
    }
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
          <nav className="flex gap-2" ref={menuRef}>
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
                      relative px-4 py-2 rounded-lg flex items-center gap-2 transition-all
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
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{tab.name}</span>
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
                            <div className="px-4 py-2 text-xs text-gray-500 font-semibold uppercase border-b border-t border-gray-800">
                              NIV Strategic Framework
                            </div>
                            {openComponents.includes('niv') ? (
                              <button
                                onClick={() => handleModuleAction('niv', 'view')}
                                className="w-full text-left px-4 py-2 hover:bg-gray-800 text-sm flex items-center gap-2"
                              >
                                <Sparkles className="w-4 h-4 text-cyan-400" />
                                View NIV Framework
                              </button>
                            ) : (
                              <button
                                onClick={() => handleModuleAction('niv', 'window')}
                                className="w-full text-left px-4 py-2 hover:bg-gray-800 text-sm flex items-center gap-2"
                              >
                                <Plus className="w-4 h-4" />
                                Open NIV Framework
                              </button>
                            )}
                            <button
                              onClick={() => handleModuleAction('niv', 'window')}
                              className="w-full text-left px-4 py-2 hover:bg-gray-800 text-sm text-gray-400 flex items-center gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              Open New Window
                            </button>
                            <div className="px-4 py-2 text-xs text-gray-500 font-semibold uppercase border-b border-t border-gray-800">
                              Predictions (BETA)
                            </div>
                            {openComponents.includes('predictions') ? (
                              <button
                                onClick={() => handleModuleAction('predictions', 'view')}
                                className="w-full text-left px-4 py-2 hover:bg-gray-800 text-sm flex items-center gap-2"
                              >
                                <AlertTriangle className="w-4 h-4 text-cyan-400" />
                                View Predictions
                              </button>
                            ) : (
                              <button
                                onClick={() => handleModuleAction('predictions', 'window')}
                                className="w-full text-left px-4 py-2 hover:bg-gray-800 text-sm flex items-center gap-2"
                              >
                                <Plus className="w-4 h-4" />
                                Open Predictions
                              </button>
                            )}
                            <button
                              onClick={() => handleModuleAction('predictions', 'window')}
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
                    {projects.map(project => (
                      <button
                        key={project.id}
                        onClick={() => {
                          setOrganization({
                            id: project.id,
                            name: project.name,
                            industry: project.industry,
                            config: {}
                          })
                          setShowProjectMenu(false)
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-800 text-sm ${
                          organization?.name === project.name ? 'bg-gray-800 text-cyan-400' : ''
                        }`}
                      >
                        {project.name}
                      </button>
                    ))}
                    <div className="border-t border-gray-700">
                      <button className="w-full text-left px-4 py-2 hover:bg-gray-800 text-sm text-cyan-400">
                        + New Project
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
    </div>
  )
}