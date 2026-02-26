'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, useDragControls } from 'framer-motion'
import { Brain, Send, X as CloseIcon, Maximize2, Minimize2, Sparkles, Move } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import NIVPanel from './NIVPanel'

interface Message {
  id: string
  role: 'user' | 'niv'
  content: string
  structured?: any
  timestamp: Date
  strategy?: NivStrategy // Added to attach strategies to messages
}

interface NivCanvasComponentProps {
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

export default function NivCanvasComponent({
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
}: NivCanvasComponentProps) {
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
      if (corner.includes('left')) {
        newWidth = startWidth - deltaX
      }
      if (corner.includes('bottom')) {
        newHeight = startHeight + deltaY
      }
      if (corner.includes('top')) {
        newHeight = startHeight - deltaY
      }

      const finalWidth = Math.max(350, Math.min(800, newWidth))
      const finalHeight = Math.max(400, Math.min(700, newHeight))

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

  const scrollToBottom = () => {
    // Only scroll if the chat window is already near the bottom
    const chatContainer = messagesEndRef.current?.parentElement
    if (chatContainer) {
      const isNearBottom = chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight < 100
      if (isNearBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const currentInput = input
    setInput('')
    setIsTyping(true)

    try {
      // Prepare conversation history (last 5 messages for context)
      const conversationHistory = messages.slice(-5).map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      // Step 1: Get immediate acknowledgment
      const ackResponse = await fetch('/api/supabase/functions/niv-orchestrator-robust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: currentInput,
          conversationHistory,
          stage: 'acknowledge',
          organizationContext: {
            conversationId: 'canvas-session',
            organizationId: organization?.id || 'OpenAI',
            name: organization?.name || 'OpenAI',
            industry: organization?.industry || 'technology'
          }
        })
      })

      if (ackResponse.ok) {
        const ackData = await ackResponse.json()

        // Show acknowledgment immediately
        const nivAck: Message = {
          id: (Date.now() + 1).toString(),
          role: 'niv',
          content: ackData.message,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, nivAck])
      }

      // Step 2: Get full response with orchestrator robust (strategic framework)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 240000) // 240 second timeout (4 minutes) for strategic framework generation

      const response = await fetch('/api/supabase/functions/niv-orchestrator-robust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: currentInput,
          conversationHistory,
          stage: 'full',
          organizationContext: {
            conversationId: 'canvas-session',
            organizationId: organization?.id || 'OpenAI',
            name: organization?.name || 'OpenAI',
            industry: organization?.industry || 'technology'
          }
        }),
        signal: controller.signal
      }).catch(err => {
        if (err.name === 'AbortError') {
          console.log('NIV request timed out, using fallback')
          return { ok: false, status: 408, statusText: 'Request Timeout' }
        }
        throw err
      }).finally(() => {
        clearTimeout(timeoutId)
      }) as Response

      if (response.ok) {
        const data = await response.json()
        console.log('='.repeat(80))
        console.log('🔍 FULL RESPONSE RECEIVED FROM BACKEND')
        console.log('🔍 Raw response:', JSON.stringify(data, null, 2))
        console.log('🔍 Response mode:', data.mode)
        console.log('🔍 Mode type:', typeof data.mode)
        console.log('🔍 mode === "generation_complete"?', data.mode === 'generation_complete')
        console.log('🔍 Has generatedContent?', !!data.generatedContent)
        console.log('🔍 generatedContent type:', typeof data.generatedContent)
        console.log('🔍 generatedContent length:', data.generatedContent?.length)
        console.log('🔍 Will enter handler?', (data.mode === 'generation_complete' && data.generatedContent))
        console.log('='.repeat(80))

        // Handle content generation complete
        if (data.mode === 'generation_complete' && data.generatedContent) {
          console.log('✅ ENTERING CONTENT DISPLAY HANDLER')
          console.log('✅ Content Generated:', data.generatedContent)

          // Display completion message
          const nivResponse: Message = {
            id: (Date.now() + 2).toString(),
            role: 'niv',
            content: data.message || `✅ Generated ${data.generatedContent.length} content pieces`,
            timestamp: new Date()
          }
          setMessages(prev => [...prev, nivResponse])

          // Display each content piece
          console.log('🔍 About to loop through content pieces:', data.generatedContent.length)
          data.generatedContent.forEach((item: any, index: number) => {
            console.log(`🔍 Processing content piece ${index + 1}:`, item.type)
            const contentMsg: Message = {
              id: (Date.now() + 3 + index).toString(),
              role: 'niv',
              content: `**${item.type.replace('-', ' ').toUpperCase()}**\n\n${item.content}`,
              timestamp: new Date()
            }
            console.log('🔍 Created message:', contentMsg)
            setMessages(prev => {
              console.log('🔍 setMessages called for piece', index + 1)
              return [...prev, contentMsg]
            })
          })
          console.log('✅ Finished displaying all content pieces')

          // Show errors if any
          if (data.errors && data.errors.length > 0) {
            const errorMsg: Message = {
              id: (Date.now() + 100).toString(),
              role: 'niv',
              content: `⚠️ ${data.errors.length} piece(s) had errors:\n${data.errors.map((e: any) => `• ${e.type}: ${e.error}`).join('\n')}`,
              timestamp: new Date()
            }
            setMessages(prev => [...prev, errorMsg])
          }

          setIsTyping(false)
          return
        }

        // Check if this is a strategic framework response
        if (data.type === 'strategic-framework' && data.framework) {
          console.log('🎯 Strategic Framework Generated:', data.framework)

          // Check for structured framework (new format)
          if (data.structuredFramework) {
            console.log('📋 Structured Framework Available:', data.structuredFramework)

            // Store the structured framework for orchestration
            sessionStorage.setItem(
              `framework-${data.sessionId || 'default'}`,
              JSON.stringify(data.structuredFramework)
            )
          }

          // Create strategy from NIV response
          // Use a default UUID if no organization exists
          const defaultOrgId = '00000000-0000-0000-0000-000000000000' // NULL UUID

          // Pass the full framework data - prefer structured if available
          const strategyData = {
            message: data.message,
            framework: data.structuredFramework || data.framework, // Use structured if available
            toolResults: data.toolResults || data.structured,
            discovery: data.discovery,
            conversationContext: data.structuredFramework?.conversationContext
          }

          const strategy = createStrategyFromResponse(
            strategyData,
            data.toolResults || data.structured,
            organization?.id || defaultOrgId,
            organization?.name || 'Default Organization'
          )

          // Save strategy to Memory Vault (with localStorage fallback)
          const strategyId = await saveStrategy(strategy, organization?.id || defaultOrgId)
          console.log('💾 Strategy saved with ID:', strategyId)

          // Send to Intelligence component via postMessage
          window.postMessage({
            type: 'niv-strategic-framework',
            framework: data.framework,
            discovery: data.discovery,
            readyForHandoff: data.readyForHandoff,
            strategyId: strategyId // Include strategy ID for reference
          }, '*')

          // Safely extract framework details with fallbacks
          const framework = data.framework || {}
          const frameworkStrategy = framework.strategy || {}
          const objective = frameworkStrategy.objective || 'Strategic objective defined'
          const urgency = frameworkStrategy.urgency || 'medium'
          const tactics = framework.tactics || {}
          const orchestration = framework.orchestration || {}

          // Use the formatted message from backend - it's already perfect!
          // The backend formatStrategicResponse() creates a complete display with:
          // - Objective, Core Narrative, Proof Points, Key Messages
          // - Target Audiences, Media Targets, Execution Timeline, KPIs, Auto-Executable Content
          const displayContent = data.message

          const nivResponse: Message = {
            id: (Date.now() + 2).toString(),
            role: 'niv',
            content: displayContent,
            structured: {
              ...data.structured,
              framework: data.structuredFramework || data.framework, // Use structured framework if available
              discovery: data.discovery
            },
            timestamp: new Date()
          }

          console.log('🎯 NIV Response with framework:', {
            hasFramework: !!nivResponse.structured?.framework,
            frameworkKeys: Object.keys(nivResponse.structured?.framework || {})
          })
          setMessages(prev => [...prev, nivResponse])
        } else {
          // Regular intelligence response
          const nivResponse: Message = {
            id: (Date.now() + 2).toString(),
            role: 'niv',
            content: data.message || 'Sorry, I encountered an issue processing your request.',
            structured: data.structured,
            timestamp: new Date()
          }
          setMessages(prev => [...prev, nivResponse])
        }
      } else {
        // Log the error but don't throw - handle gracefully
        console.error('NIV response not ok:', response.status, response.statusText)

        // Only try to parse JSON if response has a json method (not timeout)
        let errorData = { message: 'Service temporarily unavailable' }
        if (typeof response.json === 'function') {
          errorData = await response.json().catch(() => ({ message: 'Service temporarily unavailable' }))
        }
        console.error('Error details:', errorData)

        // Handle timeout specifically
        if (response.status === 408 || response.status === 504) {
          const timeoutMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'niv',
            content: '⏱️ Your strategic analysis is taking longer than expected (over 2 minutes). This usually means NIV is doing deep research and synthesis. \n\n**Options:**\n\n1. **Simplify your request** - Try breaking it into smaller, focused questions\n2. **Use templates for faster responses:**\n   • "Create a product launch strategy"\n   • "Competitive analysis for [company]"\n   • "Crisis response plan"\n   • "Media outreach strategy"\n\n3. **Retry** - Sometimes a fresh attempt works better\n\n💡 **Pro tip**: Complex multi-part requests work best when broken down. Start with "What\'s our main objective?" then build from there.\n\nI can provide a streamlined strategic framework immediately if you\'d prefer. Just say "yes" or try a simpler query.',
            timestamp: new Date()
          }
          setMessages(prev => [...prev, timeoutMessage])
        } else {
          // Provide helpful fallback message for other errors
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'niv',
            content: errorData.message || 'I\'m having trouble connecting right now. Let me try a different approach...',
            timestamp: new Date()
          }
          setMessages(prev => [...prev, errorMessage])

          // Try fallback response
          const fallbackResponse = await getNivResponse(currentInput)
          const nivResponse: Message = {
            id: (Date.now() + 2).toString(),
            role: 'niv',
            content: fallbackResponse,
            timestamp: new Date()
          }
          setMessages(prev => [...prev, nivResponse])
        }
      }
    } catch (error) {
      console.error('NIV response error:', error)

      // Fallback to legacy response
      try {
        const fallbackResponse = await getNivResponse(input)
        const nivResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: 'niv',
          content: fallbackResponse,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, nivResponse])
      } catch (fallbackError) {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'niv',
          content: 'I encountered an error processing your request. Please try again.',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } finally {
      setIsTyping(false)
    }
  }

  const getNivResponse = async (userInput: string): Promise<string> => {
    const input = userInput.toLowerCase()
    console.log('NIV processing query:', userInput)

    // Check if this is a search query - much broader detection
    if (input.includes('search') ||
        input.includes('find') ||
        input.includes('what') ||
        input.includes('who') ||
        input.includes('news') ||
        input.includes('any') ||
        input.includes('latest') ||
        input.includes('update') ||
        input.includes('happening') ||
        input.includes('tell me') ||
        input.includes('show me') ||
        input.includes('?')) {  // Any question
      console.log('Detected search query, calling Fireplexity...')

      try {
        const fireplexity = getFireplexity()
        console.log('Fireplexity service initialized')

        // Use Fireplexity for intelligent search
        const searchResult = await fireplexity.search(userInput, {
          module: activeModule,
          context: { organization: organization?.name }
        })

        console.log('Fireplexity result:', searchResult)

        // Format response with better structure
        let response = ''

        // Show summary if available
        if (searchResult.summary) {
          response = `${searchResult.cached ? '📦 ' : '🔍 '}${searchResult.summary}\n`
        }

        // Show articles in a clean format
        if (searchResult.articles?.length) {
          const articles = searchResult.articles.slice(0, 5) // Show first 5

          if (!response) {
            response = `📰 Found ${searchResult.articles.length} articles:\n`
          }

          response += '\n'

          articles.forEach((article: any, i: number) => {
            // Format date if available
            const date = article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : ''

            response += `\n${i + 1}. **${article.title}**\n`

            if (date) {
              response += `   📅 ${date}\n`
            }

            if (article.description) {
              response += `   ${article.description.substring(0, 150)}...\n`
            }

            if (article.url && !article.url.includes('example.com')) {
              response += `   🔗 [Read more](${article.url})\n`
            }
          })

          return response
        } else if (searchResult.results?.length) {
          return `Found ${searchResult.results.length} results. ${searchResult.results[0].title || searchResult.results[0].description}`
        } else if (searchResult.sources?.length) {
          // Handle Firecrawl sources
          return `Found ${searchResult.sources.length} sources. ${searchResult.sources[0].title || 'View details for more info'}`
        } else if (searchResult.opportunities?.length) {
          // Handle opportunities from pipeline data
          return `Found ${searchResult.opportunities.length} opportunities. Latest: ${searchResult.opportunities[0].title}`
        } else if (searchResult.mock) {
          return `🧪 Mock Data: ${searchResult.message || 'Using development mode data'}`
        } else {
          return 'No results found for your search. Try a different query.'
        }
      } catch (error) {
        console.error('Fireplexity error details:', error)
        return `Search error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
      }
    }

    if (input.includes('intelligence')) {
      return `Intelligence Hub is ${intelligenceData?.status || 'ready'}. I can run the 7-stage pipeline, analyze competitors, or search for real-time intelligence.`
    }

    if (input.includes('opportunity') || input.includes('opportunities')) {
      const oppCount = opportunities?.length || 0
      return `I see ${oppCount} opportunities. I can prioritize them by urgency, generate campaigns, or search for new opportunities.`
    }

    return `I'm analyzing your request through the ${activeModule} module lens. I have access to all MCPs and Fireplexity for real-time web intelligence.`
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
        // Prevent all keyboard events from bubbling to canvas
        e.stopPropagation()
      }}
      className="absolute bg-gray-900/95 backdrop-blur-xl rounded-lg shadow-2xl border border-violet-500/30 flex flex-col overflow-hidden"
      style={{
        width: dimensions.width,
        height: isMinimized ? 'auto' : dimensions.height,
        boxShadow: '0 0 40px rgba(139, 92, 246, 0.3)',
        zIndex: isResizing ? 100 : 10,
        left: 0,
        top: 0
      }}
    >
      {/* Header - Draggable */}
      <div
        className="flex-shrink-0 bg-gradient-to-r from-violet-600 to-indigo-600 p-3 rounded-t-lg cursor-move"
        onPointerDown={startDrag}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Move className="w-4 h-4 text-white/60" />
            <div className="relative">
              <Brain className="w-6 h-6 text-white" />
              <Sparkles className="w-3 h-3 text-yellow-300 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <h3 className="text-white font-bold text-sm">{title}</h3>
                <div className={`w-2 h-2 rounded-full ${useDatabase ? 'bg-green-400' : 'bg-yellow-400'}`} title={useDatabase ? 'Memory Vault Connected' : 'Using Local Storage'} />
              </div>
              <p className="text-white/80 text-xs">
                {activeModule === 'intelligence' ? 'Chief Intelligence Analyst' :
                 activeModule === 'opportunities' ? 'Strategic Advisor' :
                 activeModule === 'plan' ? 'Campaign Architect' :
                 activeModule === 'execute' ? 'Tactical Commander' :
                 activeModule === 'memoryvault' ? 'Knowledge Keeper' :
                 'Adaptive Intelligence Layer'}
              </p>
            </div>
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

      {!isMinimized && (
        <div className="flex flex-col flex-1 min-h-0">
          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0"
          >
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-violet-600 text-white p-3 rounded-lg'
                      : ''
                  }`}
                >
                  {message.role !== 'user' ? (
                    <div className="space-y-2">
                      <div className="bg-gray-800 text-gray-200 p-3 rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>

                      {/* Show orchestration buttons if this is a framework response */}
                      {message.structured?.framework && (
                        <div className="flex gap-2 mt-3 p-3 bg-gray-900/50 rounded-lg border border-violet-500/30">
                          <button
                            onClick={() => {
                              console.log('💾 Framework already saved to Memory Vault')
                              // Framework is already saved via saveStrategy
                            }}
                            className="px-4 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/30 rounded-lg text-sm font-medium flex items-center gap-2 transition-all"
                          >
                            <span className="text-lg">💾</span>
                            <span>Saved to Memory Vault</span>
                          </button>
                          <button
                            onClick={async () => {
                              const framework = message.structured.framework
                              setIsExecuting(true)

                              try {
                                console.log('🚀 Auto-executing framework:', framework.strategy?.objective)

                                // Call auto-execute endpoint
                                const response = await fetch('/api/supabase/functions/framework-auto-execute', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    framework: framework,
                                    organizationId: organization?.id,
                                    userId: 'user-id' // TODO: Get from auth
                                  })
                                })

                                const result = await response.json()

                                if (result.success) {
                                  // Show success message in chat
                                  const autoGenCount = result.contentGenerated?.length || 0
                                  const playbookCount = result.playbooksCreated || 0

                                  const successMsg: Message = {
                                    id: Date.now().toString(),
                                    role: 'niv',
                                    content: `✅ **Campaign Executed Successfully!**\n\n📦 Auto-Generated ${autoGenCount} pieces:\n${result.contentGenerated?.map((c: any) => `• ${c.type}`).join('\n') || 'Content pieces'}\n\n${playbookCount > 0 ? `📋 Created ${playbookCount} strategic playbooks for manual execution\n\n` : ''}💾 All content saved to: \`${result.folder}\`\n\n**Next Steps:**\n• View in Memory Vault to see your complete campaign package\n• Review strategic playbooks for high-impact manual campaigns\n• Customize any generated content as needed`,
                                    timestamp: new Date()
                                  }
                                  setMessages(prev => [...prev, successMsg])

                                  // Also send to Strategic Planning component
                                  window.postMessage({
                                    type: 'addComponentToCanvas',
                                    detail: {
                                      moduleId: 'plan',
                                      action: 'window',
                                      framework: framework
                                    }
                                  }, '*')
                                } else {
                                  throw new Error(result.error || 'Execution failed')
                                }
                              } catch (error) {
                                console.error('Execution error:', error)
                                const errorMsg: Message = {
                                  id: Date.now().toString(),
                                  role: 'niv',
                                  content: '❌ Campaign execution encountered an issue. Some content may have been generated - check Memory Vault. You can also generate content manually in the Execute tab.',
                                  timestamp: new Date()
                                }
                                setMessages(prev => [...prev, errorMsg])
                              } finally {
                                setIsExecuting(false)
                              }
                            }}
                            disabled={isExecuting}
                            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-lg shadow-violet-500/20"
                          >
                            <span className="text-lg">🚀</span>
                            <span>{isExecuting ? 'Executing...' : 'Execute Campaign'}</span>
                          </button>
                          <button
                            onClick={() => {
                              console.log('📋 Viewing execution plan...')
                              // Could open a modal or send to another component
                              window.postMessage({
                                type: 'niv-view-execution-plan',
                                framework: message.structured.framework
                              }, '*')
                            }}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600 rounded-lg text-sm font-medium flex items-center gap-2 transition-all"
                          >
                            <span className="text-lg">📋</span>
                            <span>View Plan</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-800 text-gray-200 p-3 rounded-lg">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-2" />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 p-3 border-t border-gray-700 bg-gray-900">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  // Stop spacebar from propagating to canvas
                  e.stopPropagation();
                  // Submit on Enter (without shift)
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask NIV anything... (Enter to send, Shift+Enter for new line)"
                className="flex-1 px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-violet-500 focus:outline-none text-sm resize-none"
                style={{
                  minHeight: '40px',
                  maxHeight: '120px',
                  height: 'auto'
                }}
                rows={1}
                ref={(textarea) => {
                  if (textarea) {
                    // Auto-resize textarea
                    textarea.style.height = 'auto';
                    textarea.style.height = textarea.scrollHeight + 'px';
                  }
                }}
              />
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg hover:opacity-90 transition-opacity self-end"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
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
              background: 'linear-gradient(135deg, transparent 50%, rgba(139, 92, 246, 0.5) 50%)'
            }}
          />
          {/* Right edge */}
          <div
            className="absolute right-0 top-12 bottom-4 w-1 cursor-ew-resize hover:bg-violet-500/30"
            onMouseDown={(e) => handleResizeStart(e, 'right')}
          />
          {/* Bottom edge */}
          <div
            className="absolute bottom-0 left-4 right-4 h-1 cursor-ns-resize hover:bg-violet-500/30"
            onMouseDown={(e) => handleResizeStart(e, 'bottom')}
          />
        </>
      )}
    </motion.div>
  )
}