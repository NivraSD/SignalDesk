'use client'

import React, { useState } from 'react'
import { Plus, Brain, Target, FileText, Rocket, Database } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { motion, AnimatePresence } from 'framer-motion'

const componentTypes = [
  { id: 'intelligence', name: 'Intelligence', icon: Brain, color: 'from-blue-600 to-cyan-600' },
  { id: 'opportunity', name: 'Opportunity', icon: Target, color: 'from-green-600 to-emerald-600' },
  { id: 'plan', name: 'Plan', icon: FileText, color: 'from-purple-600 to-pink-600' },
  { id: 'campaign', name: 'Campaign', icon: Rocket, color: 'from-orange-600 to-red-600' },
  { id: 'memory', name: 'Memory', icon: Database, color: 'from-gray-600 to-slate-600' }
]

export default function AddComponentButton() {
  const { updateCanvasComponent } = useAppStore()
  const [showMenu, setShowMenu] = useState(false)

  const addComponent = (type: string) => {
    const id = `${type}-${Date.now()}`
    const randomX = 200 + Math.random() * 400
    const randomY = 200 + Math.random() * 300
    
    updateCanvasComponent(id, {
      x: randomX,
      y: randomY,
      width: 400,
      height: 300,
      minimized: false,
      type
    })
    
    setShowMenu(false)
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-16 right-0 bg-gray-900 border border-gray-800 rounded-lg p-3 shadow-2xl"
          >
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Add Component
            </div>
            <div className="space-y-2">
              {componentTypes.map((type) => {
                const Icon = type.icon
                return (
                  <button
                    key={type.id}
                    onClick={() => addComponent(type.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-800 rounded-lg transition-colors text-left"
                  >
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${type.color}`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm">{type.name}</span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`bg-gradient-to-r from-violet-600 to-indigo-600 p-4 rounded-full shadow-2xl hover:shadow-violet-500/25 transition-all duration-300 ${
          showMenu ? 'rotate-45' : ''
        }`}
      >
        <Plus className="w-6 h-6 text-white" />
      </button>
    </div>
  )
}