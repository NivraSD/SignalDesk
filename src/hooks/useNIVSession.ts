'use client'

import { useState, useEffect } from 'react'

export interface NIVProject {
  id: string
  type: 'media-plan' | 'campaign' | 'product-launch' | 'crisis-response' | 'content-suite'
  title: string
  status: 'planning' | 'in-progress' | 'review' | 'complete'
  components: {
    [key: string]: {
      type: string
      status: 'pending' | 'in-progress' | 'complete'
      content?: any
      createdAt?: Date
    }
  }
  context: {
    objective: string
    timeline?: string
    audience?: string
    keyMessages?: string[]
    requirements?: string[]
  }
  conversation: any[]
  createdAt: Date
  updatedAt: Date
}

export function useNIVSession() {
  const [activeProject, setActiveProject] = useState<NIVProject | null>(null)
  const [sessionHistory, setSessionHistory] = useState<any[]>([])

  // Load session from localStorage
  useEffect(() => {
    const savedProject = localStorage.getItem('niv_active_project')
    if (savedProject) {
      try {
        setActiveProject(JSON.parse(savedProject))
      } catch (e) {
        console.error('Failed to load NIV project:', e)
      }
    }

    const savedHistory = localStorage.getItem('niv_session_history')
    if (savedHistory) {
      try {
        setSessionHistory(JSON.parse(savedHistory))
      } catch (e) {
        console.error('Failed to load NIV session history:', e)
      }
    }
  }, [])

  // Save session to localStorage whenever it changes
  useEffect(() => {
    if (activeProject) {
      localStorage.setItem('niv_active_project', JSON.stringify(activeProject))
    }
  }, [activeProject])

  useEffect(() => {
    if (sessionHistory.length > 0) {
      localStorage.setItem('niv_session_history', JSON.stringify(sessionHistory.slice(-50)))
    }
  }, [sessionHistory])

  // Start a new project
  const startProject = (type: NIVProject['type'], title: string, context: NIVProject['context']) => {
    const project: NIVProject = {
      id: `project-${Date.now()}`,
      type,
      title,
      status: 'planning',
      components: {},
      context,
      conversation: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Define expected components based on project type
    if (type === 'media-plan') {
      project.components = {
        'media-list': { type: 'list', status: 'pending' },
        'press-release': { type: 'content', status: 'pending' },
        'pitch-email': { type: 'email', status: 'pending' },
        'talking-points': { type: 'content', status: 'pending' },
        'social-posts': { type: 'social', status: 'pending' },
        'timeline': { type: 'plan', status: 'pending' }
      }
    } else if (type === 'product-launch') {
      project.components = {
        'announcement': { type: 'press-release', status: 'pending' },
        'blog-post': { type: 'content', status: 'pending' },
        'social-campaign': { type: 'social', status: 'pending' },
        'email-sequence': { type: 'email', status: 'pending' },
        'landing-page': { type: 'content', status: 'pending' },
        'demo-script': { type: 'content', status: 'pending' }
      }
    } else if (type === 'campaign') {
      project.components = {
        'strategy': { type: 'plan', status: 'pending' },
        'messaging': { type: 'content', status: 'pending' },
        'content-calendar': { type: 'plan', status: 'pending' },
        'assets': { type: 'multiple', status: 'pending' }
      }
    }

    setActiveProject(project)
    return project
  }

  // Update component status
  const updateComponent = (componentKey: string, updates: Partial<NIVProject['components'][string]>) => {
    if (!activeProject) return

    setActiveProject(prev => ({
      ...prev!,
      components: {
        ...prev!.components,
        [componentKey]: {
          ...prev!.components[componentKey],
          ...updates
        }
      },
      updatedAt: new Date()
    }))
  }

  // Add to project conversation
  const addToProjectConversation = (message: any) => {
    if (!activeProject) return

    setActiveProject(prev => ({
      ...prev!,
      conversation: [...prev!.conversation, message],
      updatedAt: new Date()
    }))
  }

  // Add to session history
  const addToHistory = (entry: any) => {
    setSessionHistory(prev => [...prev, {
      ...entry,
      timestamp: new Date(),
      projectId: activeProject?.id
    }])
  }

  // Get project progress
  const getProjectProgress = () => {
    if (!activeProject) return null

    const components = Object.values(activeProject.components)
    const completed = components.filter(c => c.status === 'complete').length
    const total = components.length

    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      nextSteps: Object.entries(activeProject.components)
        .filter(([_, c]) => c.status === 'pending')
        .map(([key, _]) => key)
    }
  }

  // Complete current project
  const completeProject = () => {
    if (!activeProject) return

    setActiveProject(prev => ({
      ...prev!,
      status: 'complete',
      updatedAt: new Date()
    }))

    // Archive to history
    addToHistory({
      type: 'project_completed',
      project: activeProject
    })

    // Clear active project after a delay
    setTimeout(() => {
      localStorage.removeItem('niv_active_project')
      setActiveProject(null)
    }, 2000)
  }

  // Clear session
  const clearSession = () => {
    setActiveProject(null)
    setSessionHistory([])
    localStorage.removeItem('niv_active_project')
    localStorage.removeItem('niv_session_history')
  }

  return {
    activeProject,
    sessionHistory,
    startProject,
    updateComponent,
    addToProjectConversation,
    addToHistory,
    getProjectProgress,
    completeProject,
    clearSession
  }
}