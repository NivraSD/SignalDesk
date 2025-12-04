'use client'

import { useEffect, useState, useCallback } from 'react'
import { driver, Driver, DriveStep } from 'driver.js'
import 'driver.js/dist/driver.css'

const TOUR_COMPLETED_KEY = 'niv_tour_completed'
const TOUR_VERSION = '1.1' // Increment to force re-show tour after major updates

export interface TourOptions {
  autoStart?: boolean
  onComplete?: () => void
  onSkip?: () => void
}

export function useProductTour(options: TourOptions = {}) {
  const [tourCompleted, setTourCompleted] = useState(true) // Default to true to prevent flash
  const [tourDriver, setTourDriver] = useState<Driver | null>(null)
  const [isReady, setIsReady] = useState(false)

  // Check if tour has been completed
  useEffect(() => {
    const stored = localStorage.getItem(TOUR_COMPLETED_KEY)
    if (stored) {
      const { version, completed } = JSON.parse(stored)
      setTourCompleted(completed && version === TOUR_VERSION)
    } else {
      setTourCompleted(false)
    }
    setIsReady(true)
  }, [])

  // Initialize driver instance
  useEffect(() => {
    if (typeof window === 'undefined') return

    const driverInstance = driver({
      showProgress: true,
      animate: true,
      smoothScroll: true,
      allowClose: true,
      overlayColor: 'rgba(20, 20, 20, 0.85)',
      stagePadding: 10,
      stageRadius: 8,
      popoverClass: 'niv-tour-popover',
      progressText: '{{current}} of {{total}}',
      nextBtnText: 'Next',
      prevBtnText: 'Back',
      doneBtnText: 'Get Started',
      onDestroyStarted: () => {
        // User clicked X or overlay
        if (options.onSkip) {
          options.onSkip()
        }
        markTourComplete()
        driverInstance.destroy()
      },
      onDestroyed: () => {
        if (options.onComplete) {
          options.onComplete()
        }
      }
    })

    setTourDriver(driverInstance)

    return () => {
      driverInstance.destroy()
    }
  }, [])

  const markTourComplete = useCallback(() => {
    localStorage.setItem(TOUR_COMPLETED_KEY, JSON.stringify({
      version: TOUR_VERSION,
      completed: true,
      completedAt: new Date().toISOString()
    }))
    setTourCompleted(true)
  }, [])

  const startTour = useCallback(() => {
    if (!tourDriver) return

    const steps: DriveStep[] = [
      {
        element: '[data-tour="nav-hub"]',
        popover: {
          title: 'Intelligence Hub',
          description: 'Your command center. Generate daily intelligence briefs, see key insights, and monitor what matters to your organization.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '[data-tour="generate-brief"]',
        popover: {
          title: 'Generate Intelligence Brief',
          description: 'Click here to run the intelligence pipeline. It scans your sources, analyzes articles, and generates an executive brief tailored to your organization.',
          side: 'bottom',
          align: 'center'
        }
      },
      {
        element: '[data-tour="nav-opportunities"]',
        popover: {
          title: 'Opportunities',
          description: 'Strategic opportunities identified by AI from your intelligence. Find thought leadership angles, competitive insights, and market trends.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '[data-tour="nav-studio"]',
        popover: {
          title: 'Content Studio',
          description: 'Create content powered by your intelligence. Write thought leadership, press releases, and more with AI that knows your brand.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '[data-tour="nav-campaigns"]',
        popover: {
          title: 'Campaigns',
          description: 'Build and manage integrated campaigns. Plan content calendars and track multi-channel initiatives.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '[data-tour="nav-vault"]',
        popover: {
          title: 'Memory Vault',
          description: 'Your organization\'s knowledge base. All content, schemas, and intelligence are stored here for AI context and retrieval.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '[data-tour="sidebar-predictions"]',
        popover: {
          title: 'Predictions',
          description: 'AI-detected predictions from your intelligence. See what analysts and experts are forecasting about your industry, competitors, and market.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '[data-tour="sidebar-geointel"]',
        popover: {
          title: 'GEO Intel',
          description: 'Generative Engine Optimization. Monitor your AI visibility, track how LLMs represent your brand, and optimize your presence in AI search results.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '[data-tour="sidebar-connections"]',
        popover: {
          title: 'Connections',
          description: 'Strategic relationship opportunities detected from news and intelligence. Find potential partners, clients, and collaborators.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '[data-tour="org-switcher"]',
        popover: {
          title: 'Organization Switcher',
          description: 'Switch between organizations or access settings. Configure intelligence targets, company profile, and monitoring sources.',
          side: 'bottom',
          align: 'end'
        }
      },
      {
        element: '[data-tour="niv-assistant"]',
        popover: {
          title: 'Chat with NIV',
          description: 'Your AI copilot. Ask questions, get help writing content, or explore your intelligence. NIV has full context of your organization.',
          side: 'left',
          align: 'center'
        }
      }
    ]

    // Filter steps to only include elements that exist in the DOM
    const availableSteps = steps.filter(step => {
      if (typeof step.element === 'string') {
        return document.querySelector(step.element) !== null
      }
      return true
    })

    if (availableSteps.length === 0) {
      console.warn('No tour elements found in DOM')
      markTourComplete()
      return
    }

    tourDriver.setSteps(availableSteps)
    tourDriver.drive()
  }, [tourDriver, markTourComplete])

  const resetTour = useCallback(() => {
    localStorage.removeItem(TOUR_COMPLETED_KEY)
    setTourCompleted(false)
  }, [])

  // Auto-start tour if enabled and not completed
  useEffect(() => {
    if (options.autoStart && isReady && !tourCompleted && tourDriver) {
      // Delay slightly to ensure DOM is ready
      const timer = setTimeout(() => {
        startTour()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [options.autoStart, isReady, tourCompleted, tourDriver, startTour])

  return {
    startTour,
    resetTour,
    tourCompleted,
    isReady,
    markTourComplete
  }
}
