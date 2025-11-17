'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, useDragControls } from 'framer-motion'
import { X as CloseIcon, Maximize2, GripVertical, Minimize2 } from 'lucide-react'

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
  const [isDragging, setIsDragging] = useState(false)
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [position, setPosition] = useState({ x, y })
  const [isMinimized, setIsMinimized] = useState(false)

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
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(e, info) => {
        setIsDragging(false)
        setPosition({
          x: position.x + info.offset.x,
          y: position.y + info.offset.y
        })
        onDrag(position.x + info.offset.x, position.y + info.offset.y)
      }}
      className="absolute backdrop-blur-sm rounded-lg shadow-2xl transition-opacity"
      style={{
        width: width,
        height: isMinimized ? 'auto' : height,
        background: 'rgba(42, 42, 42, 0.95)',
        border: '1px solid var(--border)',
        boxShadow: '0 0 30px rgba(184, 160, 200, 0.15)',
        zIndex: isResizing || isDragging ? 100 : 10,
        left: 0,
        top: 0,
        opacity: isDragging ? 0.8 : 1
      }}
    >
      {/* Header Bar with Drag Handle */}
      <div
        className="flex items-center justify-between px-3 py-2 rounded-t-lg cursor-move group"
        style={{
          background: 'rgba(184, 160, 200, 0.1)',
          borderBottom: '1px solid var(--border)'
        }}
        onPointerDown={startDrag}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 opacity-40 group-hover:opacity-70 transition-opacity" style={{ color: 'var(--mauve)' }} />
          <span className="text-sm font-light" style={{ color: 'var(--mauve)' }}>
            {title}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-gray-800 rounded transition-colors"
            onPointerDown={(e) => e.stopPropagation()}
            title={isMinimized ? 'Maximize' : 'Minimize'}
          >
            {isMinimized ? (
              <Maximize2 className="w-4 h-4 text-gray-400 hover:text-white" />
            ) : (
              <Minimize2 className="w-4 h-4 text-gray-400 hover:text-white" />
            )}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-800 rounded transition-colors"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <CloseIcon className="w-4 h-4 text-gray-400 hover:text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="overflow-auto" style={{ height: 'calc(100% - 36px)' }}>
          {children || (
            <div className="p-4 text-gray-500 text-sm">
              Component content here
            </div>
          )}
        </div>
      )}

      {/* Visible Resize Handles */}
      {!locked && !isMinimized && (
        <>
          {/* Corner handles - Larger and more visible */}
          <div
            className="absolute -bottom-2 -right-2 w-5 h-5 rounded-full cursor-se-resize hover:scale-110 transition-transform"
            style={{
              background: 'var(--mauve)',
              boxShadow: '0 0 10px rgba(184, 160, 200, 0.4)'
            }}
            onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}
          />
          <div
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full cursor-ne-resize hover:scale-110 transition-transform"
            style={{
              background: 'var(--mauve)',
              boxShadow: '0 0 10px rgba(184, 160, 200, 0.4)'
            }}
            onMouseDown={(e) => handleResizeStart(e, 'top-right')}
          />
          <div
            className="absolute -bottom-2 -left-2 w-5 h-5 rounded-full cursor-sw-resize hover:scale-110 transition-transform"
            style={{
              background: 'var(--mauve-dark)',
              boxShadow: '0 0 10px rgba(157, 132, 173, 0.4)'
            }}
            onMouseDown={(e) => handleResizeStart(e, 'bottom-left')}
          />
          <div
            className="absolute -top-2 -left-2 w-5 h-5 rounded-full cursor-nw-resize hover:scale-110 transition-transform"
            style={{
              background: 'var(--mauve-dark)',
              boxShadow: '0 0 10px rgba(157, 132, 173, 0.4)'
            }}
            onMouseDown={(e) => handleResizeStart(e, 'top-left')}
          />

          {/* Edge handles - More visible */}
          <div
            className="absolute -top-1 left-1/2 -translate-x-1/2 w-20 h-3 rounded-full cursor-n-resize opacity-50 hover:opacity-100 transition-opacity"
            style={{ background: 'linear-gradient(90deg, transparent, var(--mauve), transparent)' }}
            onMouseDown={(e) => handleResizeStart(e, 'top')}
          />
          <div
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-20 h-3 rounded-full cursor-s-resize opacity-50 hover:opacity-100 transition-opacity"
            style={{ background: 'linear-gradient(90deg, transparent, var(--mauve), transparent)' }}
            onMouseDown={(e) => handleResizeStart(e, 'bottom')}
          />
          <div
            className="absolute top-1/2 -left-1 -translate-y-1/2 w-3 h-20 rounded-full cursor-w-resize opacity-50 hover:opacity-100 transition-opacity"
            style={{ background: 'linear-gradient(180deg, transparent, var(--mauve-dark), transparent)' }}
            onMouseDown={(e) => handleResizeStart(e, 'left')}
          />
          <div
            className="absolute top-1/2 -right-1 -translate-y-1/2 w-3 h-20 rounded-full cursor-e-resize opacity-50 hover:opacity-100 transition-opacity"
            style={{ background: 'linear-gradient(180deg, transparent, var(--mauve-dark), transparent)' }}
            onMouseDown={(e) => handleResizeStart(e, 'right')}
          />
        </>
      )}
    </motion.div>
  )
}