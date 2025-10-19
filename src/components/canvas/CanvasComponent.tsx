'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, useDragControls } from 'framer-motion'
import { X, Maximize2 } from 'lucide-react'

interface CanvasComponentProps {
  id: string
  x: number
  y: number
  width: number
  height: number
  title: string
  locked: boolean
  onDrag: (x: number, y: number) => void
  onResize: (width: number, height: number) => void
  onClose?: () => void
  children?: React.ReactNode
}

export default function CanvasComponent({
  id,
  x,
  y,
  width,
  height,
  title,
  locked,
  onDrag,
  onResize,
  onClose,
  children
}: CanvasComponentProps) {
  const dragControls = useDragControls()
  const componentRef = useRef<HTMLDivElement>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [position, setPosition] = useState({ x, y })

  useEffect(() => {
    setPosition({ x, y })
  }, [x, y])

  const handleResizeStart = (e: React.MouseEvent, corner: string) => {
    if (locked) return
    e.preventDefault()
    e.stopPropagation()

    setIsResizing(true)

    // Capture initial values in closure
    const startX = e.clientX
    const startY = e.clientY
    const startWidth = width
    const startHeight = height

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault()
      const deltaX = e.clientX - startX
      const deltaY = e.clientY - startY

      let newWidth = startWidth
      let newHeight = startHeight

      if (corner.includes('right')) {
        newWidth = startWidth + deltaX
      }
      if (corner.includes('left')) {
        newWidth = startWidth - deltaX
      }
      if (corner.includes('bottom')) {
        newHeight = startHeight + deltaY
      }
      if (corner.includes('top')) {
        newHeight = startHeight - deltaY
      }

      onResize(Math.max(300, newWidth), Math.max(200, newHeight))
    }

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault()
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const startDrag = (e: React.PointerEvent) => {
    if (!locked) {
      dragControls.start(e)
    }
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
        setPosition({
          x: position.x + info.offset.x,
          y: position.y + info.offset.y
        })
        onDrag(position.x + info.offset.x, position.y + info.offset.y)
      }}
      className="absolute bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-2xl"
      style={{
        width: width,
        height: height,
        border: '1px solid rgba(0, 255, 204, 0.2)',
        boxShadow: '0 0 30px rgba(0, 255, 204, 0.1)',
        zIndex: isResizing ? 100 : 10,
        left: 0,
        top: 0
      }}
    >
      {/* Simple Header Bar */}
      <div
        className="flex items-center justify-between px-4 py-2 rounded-t-lg cursor-move"
        style={{ 
          background: 'linear-gradient(to right, rgba(0, 255, 204, 0.1), rgba(136, 0, 255, 0.1))',
          borderBottom: '1px solid rgba(0, 255, 204, 0.2)'
        }}
        onPointerDown={startDrag}
      >
        <span className="text-sm font-medium" style={{ color: '#00ffcc' }}>
          {title}
        </span>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-800 rounded transition-colors"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <X className="w-4 h-4 text-gray-400 hover:text-white" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="overflow-auto" style={{ height: 'calc(100% - 36px)' }}>
        {children || (
          <div className="p-4 text-gray-500 text-sm">
            Component content here
          </div>
        )}
      </div>

      {/* Visible Resize Handles */}
      {!locked && (
        <>
          {/* Corner handles - Always visible with neon glow */}
          <div
            className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full cursor-se-resize"
            style={{ 
              background: 'linear-gradient(135deg, #00ffcc, #00ff88)',
              boxShadow: '0 0 10px rgba(0, 255, 204, 0.5)'
            }}
            onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}
          />
          <div
            className="absolute -top-2 -right-2 w-4 h-4 rounded-full cursor-ne-resize"
            style={{ 
              background: 'linear-gradient(45deg, #00ffcc, #00ff88)',
              boxShadow: '0 0 10px rgba(0, 255, 204, 0.5)'
            }}
            onMouseDown={(e) => handleResizeStart(e, 'top-right')}
          />
          <div
            className="absolute -bottom-2 -left-2 w-4 h-4 rounded-full cursor-sw-resize"
            style={{ 
              background: 'linear-gradient(225deg, #8800ff, #ff00ff)',
              boxShadow: '0 0 10px rgba(136, 0, 255, 0.5)'
            }}
            onMouseDown={(e) => handleResizeStart(e, 'bottom-left')}
          />
          <div
            className="absolute -top-2 -left-2 w-4 h-4 rounded-full cursor-nw-resize"
            style={{ 
              background: 'linear-gradient(315deg, #8800ff, #ff00ff)',
              boxShadow: '0 0 10px rgba(136, 0, 255, 0.5)'
            }}
            onMouseDown={(e) => handleResizeStart(e, 'top-left')}
          />
          
          {/* Edge handles - Subtle but visible */}
          <div
            className="absolute -top-1 left-1/2 -translate-x-1/2 w-16 h-2 rounded-full cursor-n-resize opacity-40 hover:opacity-100 transition-opacity"
            style={{ background: 'linear-gradient(90deg, transparent, #00ffcc, transparent)' }}
            onMouseDown={(e) => handleResizeStart(e, 'top')}
          />
          <div
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-16 h-2 rounded-full cursor-s-resize opacity-40 hover:opacity-100 transition-opacity"
            style={{ background: 'linear-gradient(90deg, transparent, #00ffcc, transparent)' }}
            onMouseDown={(e) => handleResizeStart(e, 'bottom')}
          />
          <div
            className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-16 rounded-full cursor-w-resize opacity-40 hover:opacity-100 transition-opacity"
            style={{ background: 'linear-gradient(180deg, transparent, #8800ff, transparent)' }}
            onMouseDown={(e) => handleResizeStart(e, 'left')}
          />
          <div
            className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-16 rounded-full cursor-e-resize opacity-40 hover:opacity-100 transition-opacity"
            style={{ background: 'linear-gradient(180deg, transparent, #8800ff, transparent)' }}
            onMouseDown={(e) => handleResizeStart(e, 'right')}
          />
        </>
      )}
    </motion.div>
  )
}