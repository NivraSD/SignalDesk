'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { flushSync } from 'react-dom'
import {
  Plus, Minus, Home, Grid3x3, Lock, Unlock,
  Brain, Target, Zap, Database, Shield, AlertTriangle,
  MessageSquare, LayoutGrid, FileEdit, TrendingUp
} from 'lucide-react'
import CanvasComponent from './CanvasComponent'
import IntelligenceStrategy from '@/components/modules/IntelligenceStrategy'
import IntelligenceModule from '@/components/modules/IntelligenceModule'
import OpportunitiesModule from '@/components/modules/OpportunitiesModule'
import NivCanvasComponentV4 from '@/components/niv/NivCanvasComponentV4'
import MemoryVaultModule from '@/components/modules/MemoryVaultModule'
import ExecuteTabProduction from '@/components/execute/ExecuteTabProduction'
import StrategicPlanningModule from '@/components/modules/StrategicPlanningModule'
import StrategicPlanningModuleV3Complete from '@/components/modules/StrategicPlanningModuleV3Complete'
import CrisisCommandCenter from '@/components/modules/CrisisCommandCenter'
import NivCrisisConsultant from '@/components/modules/NivCrisisConsultant'
import WorkspaceCanvasComponent from '@/components/workspace/WorkspaceCanvasComponent'
import StrategicCampaignPlanner from '@/components/prototype/StrategicCampaignPlanner'
import StakeholderPredictionDashboard from '@/components/predictions/StakeholderPredictionDashboard'
import { CommandCenterV2 } from '@/components/command-center'
import { useAppStore } from '@/stores/useAppStore'
import NIVResourcesPanel from '@/components/niv/NIVResourcesPanel'

interface CanvasState {
  zoom: number
  panX: number
  panY: number
  gridEnabled: boolean
  locked: boolean
}

interface CanvasComponentData {
  id: string
  type: string
  title: string
  x: number
  y: number
  width: number
  height: number
  zIndex: number
}

interface ComponentType {
  id: string
  label: string
  icon: any
  color: string
  defaultWidth: number
  defaultHeight: number
}

const GRID_SIZE = 50
const COMPONENT_MARGIN = 20

const COMPONENT_TYPES: ComponentType[] = [
  { id: 'niv-command', label: 'NIV', icon: Brain, color: 'from-purple-600 to-pink-600', defaultWidth: 770, defaultHeight: 525 },
  { id: 'intelligence', label: 'Intelligence', icon: Brain, color: 'from-blue-500 to-cyan-500', defaultWidth: 800, defaultHeight: 600 },
  { id: 'niv', label: 'NIV Strategy', icon: MessageSquare, color: 'from-purple-500 to-pink-500', defaultWidth: 640, defaultHeight: 480 },
  { id: 'niv-capabilities', label: 'NIV Resources', icon: Brain, color: 'from-purple-500 to-blue-500', defaultWidth: 900, defaultHeight: 700 },
  { id: 'niv-prompts', label: 'NIV Resources', icon: Brain, color: 'from-purple-500 to-blue-500', defaultWidth: 900, defaultHeight: 700 },
  { id: 'predictions', label: 'Predictions (BETA)', icon: AlertTriangle, color: 'from-yellow-500 to-orange-500', defaultWidth: 900, defaultHeight: 700 },
  { id: 'opportunities', label: 'Opportunities', icon: Target, color: 'from-green-500 to-emerald-500', defaultWidth: 800, defaultHeight: 600 },
  { id: 'execute', label: 'Execute', icon: Zap, color: 'from-yellow-500 to-orange-500', defaultWidth: 800, defaultHeight: 600 },
  { id: 'workspace', label: 'Workspace', icon: FileEdit, color: 'from-pink-500 to-rose-500', defaultWidth: 900, defaultHeight: 700 },
  { id: 'campaign-planner', label: 'Campaign Planner', icon: TrendingUp, color: 'from-cyan-500 to-teal-500', defaultWidth: 1000, defaultHeight: 800 },
  { id: 'memoryvault', label: 'Memory Vault', icon: Database, color: 'from-indigo-500 to-purple-500', defaultWidth: 800, defaultHeight: 600 },
  { id: 'plan', label: 'Planning', icon: LayoutGrid, color: 'from-teal-500 to-cyan-500', defaultWidth: 800, defaultHeight: 600 },
  { id: 'crisis', label: 'Crisis Center', icon: Shield, color: 'from-red-500 to-orange-500', defaultWidth: 800, defaultHeight: 600 },
  { id: 'niv-crisis', label: 'Crisis Advisor', icon: AlertTriangle, color: 'from-orange-500 to-red-500', defaultWidth: 800, defaultHeight: 600 },
]

export default function InfiniteCanvas({ children }: { children?: React.ReactNode }) {
  const { framework, organization } = useAppStore()
  const canvasRef = useRef<HTMLDivElement>(null)
  const [canvasState, setCanvasState] = useState<CanvasState>({
    zoom: 1.0,
    panX: 0,
    panY: 0,
    gridEnabled: true,
    locked: false
  })

  const [components, setComponents] = useState<CanvasComponentData[]>([])
  const [isPanning, setIsPanning] = useState(false)
  const [startPan, setStartPan] = useState({ x: 0, y: 0 })
  const [nextZIndex, setNextZIndex] = useState(10)
  const [activeComponentId, setActiveComponentId] = useState<string | null>(null)
  const [nivBlueprint, setNivBlueprint] = useState<any | null>(null)
  const [planData, setPlanData] = useState<{ blueprint: any; sessionId: string; orgId: string } | null>(null)

  // Find next available grid position - 2 column layout
  const findNextPosition = useCallback((width: number, height: number) => {
    if (components.length === 0) {
      return { x: COMPONENT_MARGIN, y: COMPONENT_MARGIN }
    }

    // 2-column grid: left, right, then next row left, next row right
    const cols = 2
    const baseWidth = 800 + COMPONENT_MARGIN
    const baseHeight = 600 + COMPONENT_MARGIN

    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < cols; col++) {
        const testX = col * baseWidth + COMPONENT_MARGIN
        const testY = row * baseHeight + COMPONENT_MARGIN

        // Check if this position overlaps with any existing component
        const hasOverlap = components.some(comp => {
          const overlapX = testX < comp.x + comp.width + COMPONENT_MARGIN &&
                          testX + width + COMPONENT_MARGIN > comp.x
          const overlapY = testY < comp.y + comp.height + COMPONENT_MARGIN &&
                          testY + height + COMPONENT_MARGIN > comp.y
          return overlapX && overlapY
        })

        if (!hasOverlap) {
          return { x: testX, y: testY }
        }
      }
    }

    // Fallback: stack to the right
    const maxX = Math.max(...components.map(c => c.x + c.width))
    return { x: maxX + COMPONENT_MARGIN, y: COMPONENT_MARGIN }
  }, [components])

  const addComponent = useCallback((type: string) => {
    console.log('Adding component:', type)

    const componentType = COMPONENT_TYPES.find(t => t.id === type)
    const width = componentType?.defaultWidth || 800
    const height = componentType?.defaultHeight || 600
    const position = findNextPosition(width, height)

    const newComponent: CanvasComponentData = {
      id: `${type}-${Date.now()}`,
      type,
      title: componentType?.label || type.charAt(0).toUpperCase() + type.slice(1),
      x: position.x,
      y: position.y,
      width,
      height,
      zIndex: nextZIndex
    }

    console.log('New component:', newComponent)
    setComponents(prev => [...prev, newComponent])
    setNextZIndex(prev => prev + 1)
  }, [components, nextZIndex, findNextPosition])

  // Listen for component add events from the header
  useEffect(() => {
    const handleAddComponent = (event: CustomEvent) => {
      console.log('Received addComponentToCanvas event:', event.detail)
      const { moduleId, action, data } = event.detail

      // If NIV is passing blueprint data for campaign-planner, store it
      if (moduleId === 'campaign-planner' && data?.blueprint) {
        console.log('Storing NIV blueprint for Campaign Planner:', data.blueprint)
        setNivBlueprint(data.blueprint)
      }

      // If Campaign Builder is passing blueprint data for plan, store it
      if (moduleId === 'plan' && data?.blueprint) {
        console.log('Storing blueprint for Strategic Planning:', data)
        setPlanData({
          blueprint: data.blueprint,
          sessionId: data.sessionId,
          orgId: data.orgId
        })
      }

      addComponent(moduleId)
    }

    const handleFocusComponent = (event: CustomEvent) => {
      const { moduleId } = event.detail
      const component = components.find(c => c.type === moduleId)
      if (component) {
        focusComponent(component.id)
      }
    }

    window.addEventListener('addComponentToCanvas' as any, handleAddComponent as any)
    window.addEventListener('focusComponent' as any, handleFocusComponent as any)
    return () => {
      window.removeEventListener('addComponentToCanvas' as any, handleAddComponent as any)
      window.removeEventListener('focusComponent' as any, handleFocusComponent as any)
    }
  }, [addComponent, components])

  // Handle zoom with mouse wheel
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const delta = e.deltaY > 0 ? 0.9 : 1.1
        setCanvasState(prev => ({
          ...prev,
          zoom: Math.min(Math.max(prev.zoom * delta, 0.1), 5)
        }))
      }
    }

    const canvas = canvasRef.current
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false })
      return () => canvas.removeEventListener('wheel', handleWheel)
    }
  }, [])

  // Handle panning with space + drag OR middle mouse button
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't pan if the user is typing in an input or textarea
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return
      }

      if (e.code === 'Space' && !isPanning) {
        e.preventDefault()
        setIsPanning(true)
        document.body.style.cursor = 'grab'
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      // Don't handle if the user is typing in an input or textarea
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return
      }

      if (e.code === 'Space') {
        setIsPanning(false)
        document.body.style.cursor = 'default'
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isPanning])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPanning || e.button === 1) { // Middle mouse button
      e.preventDefault()
      setStartPan({ x: e.clientX - canvasState.panX, y: e.clientY - canvasState.panY })
      document.body.style.cursor = 'grabbing'
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if ((isPanning || e.buttons === 4) && (e.buttons === 1 || e.buttons === 4)) { // Left or middle button
      const newPanX = e.clientX - startPan.x
      const newPanY = e.clientY - startPan.y
      console.log('Setting pan:', { newPanX, newPanY })
      setCanvasState(prev => ({
        ...prev,
        panX: newPanX,
        panY: newPanY
      }))
    }
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isPanning || e.button === 1) {
      document.body.style.cursor = isPanning ? 'grab' : 'default'
    }
  }

  const resetView = () => {
    setCanvasState(prev => ({
      ...prev,
      zoom: 1.6,
      panX: 0,
      panY: 0
    }))
  }

  const snapToGrid = (value: number) => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE
  }

  const handleComponentDrag = (id: string, x: number, y: number) => {
    if (canvasState.locked) return

    // Snap to grid if enabled
    const finalX = canvasState.gridEnabled ? snapToGrid(x) : x
    const finalY = canvasState.gridEnabled ? snapToGrid(y) : y

    setComponents(prev => prev.map(comp =>
      comp.id === id ? { ...comp, x: finalX, y: finalY } : comp
    ))
  }

  const handleComponentResize = (id: string, width: number, height: number) => {
    if (canvasState.locked) return
    
    setComponents(prev => prev.map(comp => 
      comp.id === id ? { ...comp, width, height } : comp
    ))
  }

  const handleComponentClose = (id: string) => {
    setComponents(prev => prev.filter(comp => comp.id !== id))
  }

  const handleComponentFocus = (id: string) => {
    setActiveComponentId(id)
    setComponents(prev => prev.map(comp =>
      comp.id === id ? { ...comp, zIndex: nextZIndex } : comp
    ))
    setNextZIndex(prev => prev + 1)
  }

  const focusComponent = (id: string) => {
    const component = components.find(c => c.id === id)
    if (!component) return

    // Bring to front
    handleComponentFocus(id)

    // Pan to center the component in viewport
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const centerX = viewportWidth / 2 - (component.width / 2)
    const centerY = viewportHeight / 2 - (component.height / 2)

    setCanvasState(prev => ({
      ...prev,
      panX: centerX - component.x,
      panY: centerY - component.y
    }))
  }

  const renderComponentContent = (component: CanvasComponentData) => {
    switch (component.type) {
      case 'niv-command':
        return (
          <CommandCenterV2
            onNavigateToTab={(tabId: string, context?: any) => {
              // Open the requested tab/module
              addComponent(tabId)
              // TODO: Pass context to the opened component
            }}
          />
        )
      case 'niv':
        return null  // NIV uses its own component
      case 'workspace':
        return null  // Workspace uses its own component
      case 'niv-capabilities':
      case 'niv-prompts':
        return <NIVResourcesPanel />
      case 'campaign-planner':
        return <StrategicCampaignPlanner nivBlueprint={nivBlueprint} />
      case 'predictions':
        return <StakeholderPredictionDashboard organizationId={organization?.id || ''} />
      case 'intelligence':
        return <IntelligenceModule />
      case 'intelligence-results':
        return <IntelligenceStrategy />
      case 'opportunities':
        return <OpportunitiesModule />
      case 'plan':
        // Use V3Complete if we have blueprint data from Campaign Builder
        console.log('🎯 Rendering plan component, planData:', !!planData, planData ? {
          hasBlueprint: !!planData.blueprint,
          sessionId: planData.sessionId,
          orgId: planData.orgId
        } : 'null')

        if (planData) {
          return (
            <StrategicPlanningModuleV3Complete
              blueprint={planData.blueprint}
              sessionId={planData.sessionId}
              orgId={planData.orgId}
            />
          )
        }
        // Fallback to old module for legacy support
        console.warn('⚠️ No planData available, showing empty state')
        return <StrategicPlanningModule />
      case 'execute':
        return <ExecuteTabProduction framework={framework} />
      case 'memoryvault':
        return <MemoryVaultModule />
      case 'crisis':
        return <CrisisCommandCenter />
      case 'niv-crisis':
        return <NivCrisisConsultant />
      default:
        return <div className="p-6">Unknown component type</div>
    }
  }

  // Load planData from localStorage when organization changes
  useEffect(() => {
    if (organization?.id) {
      // Clean up old non-organization-aware key on first load
      if (localStorage.getItem('planData')) {
        console.log('🧹 Cleaning up old planData localStorage key')
        localStorage.removeItem('planData')
      }

      const storageKey = `planData_${organization.id}`
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        try {
          const data = JSON.parse(saved)
          // Verify the orgId matches current organization
          if (data.orgId === organization.id) {
            console.log('📋 Loading saved plan data for organization:', organization.name)
            setPlanData(data)
          } else {
            // Clear mismatched data
            localStorage.removeItem(storageKey)
            setPlanData(null)
          }
        } catch (e) {
          console.error('Failed to parse saved plan data:', e)
          localStorage.removeItem(storageKey)
          setPlanData(null)
        }
      } else {
        // No saved data for this org, clear planData
        setPlanData(null)
      }
    }
  }, [organization?.id])

  // Save planData to localStorage whenever it changes (organization-aware)
  useEffect(() => {
    if (organization?.id && planData) {
      const storageKey = `planData_${organization.id}`
      localStorage.setItem(storageKey, JSON.stringify(planData))
      console.log('💾 Saved plan data for organization:', organization.name)
    }
  }, [planData, organization?.id])

  // Check for pending plan data from Campaign Builder on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('openPlan') === 'true') {
      const pendingData = sessionStorage.getItem('pendingPlanData')
      if (pendingData) {
        try {
          const data = JSON.parse(pendingData)
          console.log('📋 Loading pending plan data from Campaign Builder:', data)

          // Store in planData state (will auto-save to localStorage via effect above)
          const newPlanData = {
            blueprint: data.blueprint,
            sessionId: data.sessionId,
            orgId: data.orgId,
            campaignType: data.campaignType || 'VECTOR_CAMPAIGN' // Preserve campaign type
          }

          // Set state immediately
          setPlanData(newPlanData)

          // Clear the pending data and URL param
          sessionStorage.removeItem('pendingPlanData')
          window.history.replaceState({}, '', '/')

          // Wait for next render cycle to ensure state is flushed
          requestAnimationFrame(() => {
            console.log('✅ Opening Plan module with data:', {
              hasBlueprint: !!newPlanData.blueprint,
              sessionId: newPlanData.sessionId
            })
            addComponent('plan')
          })
        } catch (err) {
          console.error('Failed to parse pending plan data:', err)
        }
      }
    }
  }, [addComponent, setPlanData])

  // Broadcast open components to parent for tab highlighting
  useEffect(() => {
    const event = new CustomEvent('canvasComponentsChanged', {
      detail: { components: components.map(c => c.type) }
    })
    window.dispatchEvent(event)
  }, [components])

  return (
    <div className="relative w-full h-full overflow-auto bg-gray-950">
      {/* Canvas Viewport - INFINITE */}
      <div
        ref={canvasRef}
        className="absolute inset-0"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isPanning ? 'grabbing' : 'default' }}
      >
        {/* Infinite scrollable area */}
        <div
          className="relative"
          style={{
            width: '100000px',
            height: '100000px',
            transform: `translate(${canvasState.panX}px, ${canvasState.panY}px) scale(${canvasState.zoom})`,
            transformOrigin: '0 0',
            position: 'absolute',
            left: '-50000px',
            top: '-50000px'
          }}
        >
          {/* Grid Background */}
          {canvasState.gridEnabled && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(0, 255, 204, 0.05) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(0, 255, 204, 0.05) 1px, transparent 1px)
                `,
                backgroundSize: '50px 50px'
              }}
            />
          )}

          {/* Canvas Components */}
          <div className="relative" style={{ width: '100000px', height: '100000px' }}>
            {components.map(component => (
              <div
                key={component.id}
                onMouseDown={() => handleComponentFocus(component.id)}
                style={{ position: 'absolute', zIndex: component.zIndex }}
              >
                {component.type === 'niv' ? (
                  <NivCanvasComponentV4
                    id={component.id}
                    x={component.x + 50000}
                    y={component.y + 50000}
                    width={component.width}
                    height={component.height}
                    title={component.title}
                    locked={canvasState.locked}
                    onDrag={(x, y) => handleComponentDrag(component.id, x - 50000, y - 50000)}
                    onResize={(w, h) => handleComponentResize(component.id, w, h)}
                    onClose={() => handleComponentClose(component.id)}
                    onBringToFront={() => handleComponentFocus(component.id)}
                  />
                ) : component.type === 'workspace' ? (
                  <WorkspaceCanvasComponent
                    id={component.id}
                    position={{
                      x: component.x + 50000,
                      y: component.y + 50000
                    }}
                    onPositionChange={(id, pos) => handleComponentDrag(id, pos.x - 50000, pos.y - 50000)}
                    onClose={() => handleComponentClose(component.id)}
                  />
                ) : (
                  <CanvasComponent
                    id={component.id}
                    x={component.x + 50000}
                    y={component.y + 50000}
                    width={component.width}
                    height={component.height}
                    title={component.title}
                    locked={canvasState.locked}
                    onDrag={(x, y) => handleComponentDrag(component.id, x - 50000, y - 50000)}
                    onResize={(w, h) => handleComponentResize(component.id, w, h)}
                    onClose={() => handleComponentClose(component.id)}
                  >
                    {renderComponentContent(component)}
                  </CanvasComponent>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}