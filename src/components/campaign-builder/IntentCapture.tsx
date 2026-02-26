'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

interface IntentCaptureProps {
  onSubmit: (goal: string) => void
  isLoading?: boolean
}

export function IntentCapture({ onSubmit, isLoading }: IntentCaptureProps) {
  const [goal, setGoal] = useState('')
  const [showExamples, setShowExamples] = useState(true)

  const exampleGoals = [
    {
      title: 'Product Launch',
      description: 'Launch our new AI platform and establish thought leadership'
    },
    {
      title: 'Crisis Response',
      description: 'Address negative press and rebuild stakeholder trust'
    },
    {
      title: 'Funding Round',
      description: 'Build excitement and credibility ahead of Series B'
    },
    {
      title: 'Market Entry',
      description: 'Establish presence in European market with local partners'
    }
  ]

  const handleSubmit = () => {
    console.log('🎯 IntentCapture handleSubmit called', {
      goalLength: goal.trim().length,
      goal: goal.trim()
    })
    if (goal.trim().length > 10) {
      console.log('✅ Goal is valid, calling onSubmit')
      onSubmit(goal.trim())
    } else {
      console.log('❌ Goal too short, not calling onSubmit')
    }
  }

  const handleExampleClick = (example: typeof exampleGoals[0]) => {
    setGoal(example.description)
    setShowExamples(false)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white">
            Campaign Builder
          </h1>
          <p className="text-gray-400">
            Let's create a strategic campaign together. Tell me what you're trying to achieve.
          </p>
        </div>

        {/* Main Input */}
        <div className="space-y-4">
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            onFocus={() => setShowExamples(false)}
            placeholder="Describe your campaign goal..."
            className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
            disabled={isLoading}
          />

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {goal.length < 10 && goal.length > 0 && (
                <span className="text-amber-500">
                  Add a bit more detail ({10 - goal.length} characters needed)
                </span>
              )}
              {goal.length >= 10 && (
                <span className="text-emerald-500">
                  Looking good!
                </span>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={goal.trim().length < 10 || isLoading}
              className="px-6 py-2 text-white rounded-lg font-medium hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{ background: 'var(--burnt-orange)', fontFamily: 'var(--font-display)' }}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                'Start Building'
              )}
            </button>
          </div>
        </div>

        {/* Example Goals */}
        {showExamples && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            <p className="text-sm text-gray-500 text-center">
              Or try one of these examples:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {exampleGoals.map((example, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  onClick={() => handleExampleClick(example)}
                  className="text-left p-4 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-700 hover:bg-zinc-800 transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-white group-hover:text-blue-400 transition-colors">
                        {example.title}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {example.description}
                      </p>
                    </div>
                    <svg
                      className="w-5 h-5 text-gray-600 group-hover:text-blue-400 transition-colors flex-shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Info Cards */}
        {!isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8"
          >
            <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="font-medium text-white">Deep Research</h3>
              </div>
              <p className="text-sm text-gray-400">
                6-dimensional analysis of your landscape
              </p>
            </div>

            <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h3 className="font-medium text-white">Smart Strategy</h3>
              </div>
              <p className="text-sm text-gray-400">
                AI-powered positioning and approach selection
              </p>
            </div>

            <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="font-medium text-white">Tactical Blueprint</h3>
              </div>
              <p className="text-sm text-gray-400">
                Ready-to-execute campaign with timeline
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
