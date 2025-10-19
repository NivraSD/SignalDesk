// COMPLETE ROUTING IMPLEMENTATION FOR NIVContentOrchestratorProduction.tsx
// Replace lines 645-750 (handleSend function) with this

// Handler implementations
const handle

ComplexContent = async (userMessage: string, contentType: string) => {
  console.log('🎯 Routing to niv-content-intelligent-v2 for:', contentType)

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/niv-content-intelligent-v2`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        message: userMessage,
        conversationHistory: messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        organizationContext: {
          conversationId: conceptState.conversationId,
          organizationId: organization?.id || 'OpenAI'
        }
      })
    }
  )

  if (!response.ok) {
    throw new Error(`Backend error: ${response.statusText}`)
  }

  return await response.json()
}

const handleGammaPresentation = async (userMessage: string) => {
  console.log('📊 Routing to Gamma for presentation')

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/gamma-presentation`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        topic: userMessage,
        context: {
          organization: organization?.name || 'OpenAI',
          conversationHistory: messages.slice(-3).map(m => m.content)
        }
      })
    }
  )

  if (!response.ok) {
    throw new Error(`Gamma error: ${response.statusText}`)
  }

  return await response.json()
}

const handleVertexImage = async (userMessage: string) => {
  console.log('🎨 Routing to Vertex AI for image')

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/vertex-ai-image-generation`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        prompt: userMessage,
        organization: organization?.name || 'OpenAI'
      })
    }
  )

  if (!response.ok) {
    throw new Error(`Vertex error: ${response.statusText}`)
  }

  return await response.json()
}

const handleMCPContent = async (userMessage: string, tool: string) => {
  console.log('📝 Routing to mcp-content with tool:', tool)

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/mcp-content`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        tool: tool,
        parameters: {
          prompt: userMessage,
          organization: organization?.name || 'OpenAI',
          context: {
            conversationHistory: messages.slice(-3).map(m => m.content),
            tone: conceptState.contentConcept.tone,
            keyMessages: conceptState.contentConcept.keyMessages
          }
        }
      })
    }
  )

  if (!response.ok) {
    throw new Error(`MCP Content error: ${response.statusText}`)
  }

  return await response.json()
}

const processResponse = (response: any, routing: any) => {
  // ORCHESTRATOR RESPONSES
  if (routing.service === 'niv-content-intelligent-v2') {
    if (response.mode === 'question') {
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        metadata: { awaitingResponse: true }
      }])
    }
    else if (response.mode === 'narrative_options') {
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        metadata: { narratives: response.narrativeOptions }
      }])
      setShowNarrativeSelector(true)
      setNarrativeOptions(response.narrativeOptions)
    }
    else if (response.mode === 'generation_complete') {
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        metadata: { generatedContent: response.generatedContent }
      }])
      setGeneratedContent(response.generatedContent)
    }
    else {
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: response.message || response.response,
        timestamp: new Date()
      }])
    }
  }

  // GAMMA RESPONSES
  else if (routing.service === 'gamma-presentation') {
    if (response.presentationUrl || response.url) {
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `I've created your presentation! [View Presentation](${response.presentationUrl || response.url})`,
        timestamp: new Date(),
        metadata: {
          type: 'presentation',
          url: response.presentationUrl || response.url,
          slides: response.slides
        }
      }])
    } else {
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: response.message || 'Presentation created successfully',
        timestamp: new Date()
      }])
    }
  }

  // VERTEX RESPONSES
  else if (routing.service === 'vertex-ai-image-generation') {
    if (response.imageUrl || response.images) {
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: 'Here\'s your generated image:',
        timestamp: new Date(),
        metadata: {
          type: 'image',
          imageUrl: response.imageUrl || response.images?.[0],
          images: response.images
        }
      }])
    }
  }

  // MCP CONTENT RESPONSES
  else if (routing.service === 'mcp-content') {
    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: response.content || response.result || JSON.stringify(response),
      timestamp: new Date(),
      metadata: {
        type: routing.tool,
        generatedContent: response
      }
    }])
  }

  // Update conversation state
  setConceptState(prev => ({
    ...prev,
    fullConversation: [...prev.fullConversation, {
      role: 'assistant',
      content: response.message || response.content || 'Response received',
      timestamp: new Date()
    }]
  }))
}

// MAIN HANDLER WITH ROUTING
const handleSend = async () => {
  if (!input.trim() || isThinking) return

  const userMessage = input.trim()
  setInput('')

  // Add user message
  const userMsg = {
    id: `msg-${Date.now()}`,
    role: 'user',
    content: userMessage,
    timestamp: new Date()
  }
  setMessages(prev => [...prev, userMsg])

  // Update conversation state
  setConceptState(prev => ({
    ...prev,
    fullConversation: [...prev.fullConversation, {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }],
    lastUpdate: Date.now()
  }))

  setIsThinking(true)

  try {
    const contentType = conceptState.contentConcept.type

    // GET ROUTING DECISION
    const routing = ContentRoutingAgent.route(contentType || '', userMessage, {
      organization,
      research: conceptState.researchHistory,
      framework: conceptState.orchestrationContext?.framework
    })

    console.log('🚦 Routing decision:', routing)

    // EXECUTE APPROPRIATE HANDLER
    let response
    switch (routing.handler) {
      case 'handleComplexContent':
        response = await handleComplexContent(userMessage, contentType || '')
        break

      case 'handleGammaPresentation':
        response = await handleGammaPresentation(userMessage)
        break

      case 'handleVertexImage':
        response = await handleVertexImage(userMessage)
        break

      case 'handleMCPContent':
        response = await handleMCPContent(userMessage, routing.tool || '')
        break

      default:
        // Fallback to orchestrator
        response = await handleComplexContent(userMessage, contentType || '')
    }

    // PROCESS RESPONSE BASED ON TYPE
    processResponse(response, routing)

  } catch (error) {
    console.error('❌ Routing error:', error)
    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: `I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
      timestamp: new Date(),
      error: true
    }])
  } finally {
    setIsThinking(false)
  }
}
