'use client'

import React, { useState, useEffect } from 'react'
import { Brain, Sparkles, AlertCircle, TrendingUp, Target, Zap, ChevronUp, ChevronDown } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { motion, AnimatePresence } from 'framer-motion'

interface NivSuggestion {
  type: 'opportunity' | 'action' | 'insight' | 'warning'
  title: string
  description: string
  confidence: number
  action?: () => void
}

export default function NivOrchestrator() {
  const { activeModule, intelligenceData, opportunities } = useAppStore()
  const [isExpanded, setIsExpanded] = useState(true)
  const [isMinimized, setIsMinimized] = useState(false)
  const [suggestions, setSuggestions] = useState<NivSuggestion[]>([])
  const [nivThinking, setNivThinking] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 80 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Set initial position after mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPosition({ x: window.innerWidth - 340, y: 80 })
    }
  }, [])

  // Niv analyzes context and provides suggestions based on current module
  useEffect(() => {
    analyzeContext()
  }, [activeModule, intelligenceData, opportunities])

  const analyzeContext = () => {
    setNivThinking(true)
    
    // Simulate Niv thinking (in production, this would call the niv-orchestrator edge function)
    setTimeout(() => {
      const newSuggestions: NivSuggestion[] = []

      // Context-aware suggestions based on active module
      if (activeModule === 'intelligence' && intelligenceData) {
        newSuggestions.push({
          type: 'insight',
          title: 'Intelligence Analysis Complete',
          description: 'Found 3 critical competitor moves requiring immediate attention',
          confidence: 92,
          action: () => console.log('View critical moves')
        })
      }

      if (activeModule === 'opportunities' && opportunities.length > 0) {
        const criticalOpp = opportunities.find(o => o.urgency === 'CRITICAL')
        if (criticalOpp) {
          newSuggestions.push({
            type: 'warning',
            title: 'Time-Sensitive Opportunity',
            description: `"${criticalOpp.title}" expires in ${criticalOpp.time_window}`,
            confidence: criticalOpp.confidence,
            action: () => console.log('Execute opportunity')
          })
        }
      }

      // Always show high-level strategic insights
      newSuggestions.push({
        type: 'opportunity',
        title: 'Strategic Window Detected',
        description: 'Competitor vulnerability identified. 48-hour advantage window.',
        confidence: 87,
        action: () => console.log('View strategy')
      })

      setSuggestions(newSuggestions)
      setNivThinking(false)
    }, 1000)
  }

  const getIcon = (type: string) => {
    switch(type) {
      case 'opportunity': return <Target className="w-4 h-4" />
      case 'action': return <Zap className="w-4 h-4" />
      case 'insight': return <TrendingUp className="w-4 h-4" />
      case 'warning': return <AlertCircle className="w-4 h-4" />
      default: return <Sparkles className="w-4 h-4" />
    }
  }

  const getColor = (type: string) => {
    switch(type) {
      case 'opportunity': return 'text-green-400 bg-green-400/10 border-green-400/20'
      case 'action': return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
      case 'insight': return 'text-purple-400 bg-purple-400/10 border-purple-400/20'
      case 'warning': return 'text-amber-400 bg-amber-400/10 border-amber-400/20'
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20'
    }
  }

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag from the header
    if ((e.target as HTMLElement).closest('.niv-header')) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      })
      e.preventDefault()
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragStart])

  if (isMinimized) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed z-50"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onMouseDown={(e) => {
          setIsDragging(true)
          setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y
          })
          e.preventDefault()
        }}
      >
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 p-3 rounded-full shadow-2xl hover:shadow-violet-500/25 transition-all duration-300 group"
        >
          <Brain className="w-5 h-5 text-white group-hover:rotate-12 transition-transform" />
          {suggestions.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
              {suggestions.length}
            </span>
          )}
        </button>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed w-80 z-40 bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-lg shadow-2xl"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Niv Header */}
      <div className="niv-header bg-gradient-to-r from-violet-600 to-indigo-600 p-3 rounded-t-lg cursor-grab">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Brain className="w-6 h-6 text-white" />
              {nivThinking && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0"
                >
                  <Sparkles className="w-6 h-6 text-white/50" />
                </motion.div>
              )}
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">NIV</h3>
              <p className="text-white/80 text-xs">Strategic Orchestrator</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-white/80 hover:text-white transition-colors"
            >
              {isExpanded ? <ChevronUp /> : <ChevronDown />}
            </button>
            <button
              onClick={() => setIsMinimized(true)}
              className="text-white/80 hover:text-white transition-colors text-xl leading-none pb-1"
            >
              ×
            </button>
          </div>
        </div>
      </div>

      {/* Niv Status */}
      <div className="px-3 py-2 border-b border-gray-800 bg-gray-900/50">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Analyzing:</span>
          <span className="text-gray-200 font-medium capitalize">{activeModule} Module</span>
        </div>
        {nivThinking && (
          <div className="mt-1 text-xs text-violet-400 animate-pulse">
            Processing strategic implications...
          </div>
        )}
      </div>

      {/* Niv Suggestions */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
              {suggestions.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <Brain className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-xs">Niv is analyzing your data...</p>
                </div>
              ) : (
                suggestions.map((suggestion, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-2.5 rounded-lg border ${getColor(suggestion.type)} cursor-pointer hover:bg-opacity-20 transition-all`}
                    onClick={suggestion.action}
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">{getIcon(suggestion.type)}</div>
                      <div className="flex-1">
                        <h4 className="font-medium text-xs mb-0.5">{suggestion.title}</h4>
                        <p className="text-xs opacity-80">{suggestion.description}</p>
                        {suggestion.confidence && (
                          <div className="mt-1.5 flex items-center gap-2">
                            <div className="flex-1 bg-gray-800 rounded-full h-1">
                              <div 
                                className="bg-gradient-to-r from-violet-500 to-indigo-500 h-full rounded-full"
                                style={{ width: `${suggestion.confidence}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-400">{suggestion.confidence}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Niv Actions */}
      <div className="p-2.5 border-t border-gray-800 bg-gray-900/50">
        <button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-1.5 px-3 rounded-lg font-medium text-xs hover:shadow-lg hover:shadow-violet-500/25 transition-all">
          Ask Niv for Strategy
        </button>
      </div>
    </motion.div>
  )
}