'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, useDragControls } from 'framer-motion'
import { X as CloseIcon, Maximize2, Minimize2, Move } from 'lucide-react'
import NIVPanel from './NIVPanel'

interface NivCanvasComponentV4Props {
  id: string
  x: number
  y: number
  width: number
  height: number
  title?: string
  locked: boolean
  onDrag: (x: number, y: number) => void
  onResize: (width: number, height: number) => void
  onClose?: () => void
  onBringToFront?: () => void
}

export default function NivCanvasComponentV4({
  id,
  x,
  y,
  width,
  height,
  title = "NIV - Total-Spectrum Communications",
  locked,
  onDrag,
  onResize,
  onClose,
  onBringToFront
}: NivCanvasComponentV4Props) {
  const dragControls = useDragControls()
  const componentRef = useRef<HTMLDivElement>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [position, setPosition] = useState({ x, y })
  const [dimensions, setDimensions] = useState({ width, height })
  const [isMinimized, setIsMinimized] = useState(false)

  useEffect(() => {
    setPosition({ x, y })
  }, [x, y])

  useEffect(() => {
    setDimensions({ width, height })
  }, [width, height])

  // Handle resize
  const handleResizeStart = (e: React.MouseEvent, corner: string) => {
    if (locked) return
    e.preventDefault()
    e.stopPropagation()
    onBringToFront?.()

    setIsResizing(true)
    const startX = e.clientX
    const startY = e.clientY
    const startWidth = dimensions.width
    const startHeight = dimensions.height

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX
      const deltaY = e.clientY - startY

      let newWidth = startWidth
      let newHeight = startHeight

      if (corner.includes('right')) {
        newWidth = startWidth + deltaX
      }
      if (corner.includes('bottom')) {
        newHeight = startHeight + deltaY
      }

      const finalWidth = Math.max(400, Math.min(1000, newWidth))
      const finalHeight = Math.max(500, Math.min(900, newHeight))

      setDimensions({ width: finalWidth, height: finalHeight })
      onResize(finalWidth, finalHeight)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const startDrag = (e: React.PointerEvent) => {
    if (!locked) {
      onBringToFront?.()
      dragControls.start(e)
    }
  }

  const handleCampaignGenerated = (blueprint: any) => {
    console.log('Campaign generated:', blueprint)
    // Campaign Planner component will be opened by NIVPanel
  }

  const handleOpportunityDetected = (opportunities: any[]) => {
    console.log('Opportunities detected:', opportunities)
    // Opportunities tab will be opened by NIVPanel
  }

  return (
    <motion.div
      ref={componentRef}
      drag
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0}
      animate={{ x: position.x, y: position.y }}
      onDragEnd={(e, info) => {
        const newX = position.x + info.offset.x
        const newY = position.y + info.offset.y
        setPosition({ x: newX, y: newY })
        onDrag(newX, newY)
      }}
      onClick={onBringToFront}
      onKeyDown={(e) => {
        e.stopPropagation()
      }}
      className="absolute bg-gray-900/95 backdrop-blur-xl rounded-lg shadow-2xl border border-purple-500/30 flex flex-col overflow-hidden"
      style={{
        width: dimensions.width,
        height: isMinimized ? 'auto' : dimensions.height,
        boxShadow: '0 0 40px rgba(168, 85, 247, 0.3)',
        zIndex: isResizing ? 100 : 10,
        left: 0,
        top: 0
      }}
    >
      {/* Header - Draggable */}
      <div
        className="flex-shrink-0 bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-t-lg cursor-move"
        onPointerDown={startDrag}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Move className="w-4 h-4 text-white/60" />
            <h3 className="text-white font-bold text-sm">{title}</h3>
          </div>
          <div className="flex items-center gap-1" onPointerDown={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              {isMinimized ? (
                <Maximize2 className="w-4 h-4 text-white" />
              ) : (
                <Minimize2 className="w-4 h-4 text-white" />
              )}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <CloseIcon className="w-4 h-4 text-white" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* NIV Panel */}
      {!isMinimized && (
        <div className="flex-1 min-h-0">
          <NIVPanel
            embedded={true}
            onCampaignGenerated={handleCampaignGenerated}
            onOpportunityDetected={handleOpportunityDetected}
          />
        </div>
      )}

      {/* Resize Handles */}
      {!locked && !isMinimized && (
        <>
          {/* Bottom-right resize handle */}
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
            onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}
            style={{
              background: 'linear-gradient(135deg, transparent 50%, rgba(168, 85, 247, 0.5) 50%)'
            }}
          />
          {/* Right edge */}
          <div
            className="absolute right-0 top-12 bottom-4 w-1 cursor-ew-resize hover:bg-purple-500/30"
            onMouseDown={(e) => handleResizeStart(e, 'right')}
          />
          {/* Bottom edge */}
          <div
            className="absolute bottom-0 left-4 right-4 h-1 cursor-ns-resize hover:bg-purple-500/30"
            onMouseDown={(e) => handleResizeStart(e, 'bottom')}
          />
        </>
      )}
    </motion.div>
  )
}
