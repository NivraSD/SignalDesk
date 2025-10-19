# NIV Content - Intelligent Routing Architecture

## THE COMPLETE ECOSYSTEM

We have multiple specialized services:
- **niv-content-intelligent-v2** - Complex content orchestration (media plans, campaigns)
- **mcp-content** - Text content generation (press releases, social posts, articles)
- **vertex-ai-image-generation** - Image generation via Vertex AI
- **gamma-presentation** - Presentation creation via Gamma API
- **niv-fireplexity** - Research and intelligence

---

## ROUTING ARCHITECTURE

### Content Type → Service Mapping

```typescript
const CONTENT_ROUTING_MAP = {
  // COMPLEX ORCHESTRATED CONTENT (uses niv-content-intelligent-v2)
  'media-plan': {
    service: 'niv-content-intelligent-v2',
    complexity: 'complex',
    workflow: 'orchestrated',
    outputs: ['press-release', 'media-list', 'media-pitch', 'qa-document', 'social-posts']
  },
  'campaign': {
    service: 'niv-content-intelligent-v2',
    complexity: 'complex',
    workflow: 'orchestrated',
    outputs: ['multiple-pieces']
  },

  // SPECIALIZED SERVICES (direct routing)
  'presentation': {
    service: 'gamma-presentation',
    complexity: 'medium',
    workflow: 'direct',
    api: 'gamma'
  },
  'deck': {
    service: 'gamma-presentation',
    complexity: 'medium',
    workflow: 'direct',
    api: 'gamma'
  },
  'image': {
    service: 'vertex-ai-image-generation',
    complexity: 'simple',
    workflow: 'direct',
    api: 'vertex'
  },
  'visual': {
    service: 'vertex-ai-image-generation',
    complexity: 'simple',
    workflow: 'direct',
    api: 'vertex'
  },

  // SIMPLE TEXT CONTENT (uses mcp-content)
  'social-post': {
    service: 'mcp-content',
    complexity: 'simple',
    workflow: 'direct',
    tool: 'generate_social_posts'
  },
  'press-release': {
    service: 'mcp-content',
    complexity: 'simple',
    workflow: 'direct',
    tool: 'generate_press_release'
  },
  'article': {
    service: 'mcp-content',
    complexity: 'simple',
    workflow: 'direct',
    tool: 'generate_article'
  },
  'email': {
    service: 'mcp-content',
    complexity: 'simple',
    workflow: 'direct',
    tool: 'generate_email'
  },

  // CRISIS CONTENT (needs orchestrator for stakeholder coordination)
  'crisis-response': {
    service: 'niv-content-intelligent-v2',
    complexity: 'complex',
    workflow: 'orchestrated',
    urgency: 'immediate'
  }
}
```

---

## INTELLIGENT ROUTING AGENT

```typescript
// Frontend: Content Routing Agent
class ContentRoutingAgent {

  // Main routing decision
  static route(contentType: string, userMessage: string, context: any) {
    const route = CONTENT_ROUTING_MAP[contentType]

    if (!route) {
      // Unknown type - use orchestrator to figure it out
      return {
        service: 'niv-content-intelligent-v2',
        handler: 'handleComplexContent'
      }
    }

    switch (route.workflow) {
      case 'orchestrated':
        return {
          service: route.service,
          handler: 'handleComplexContent',
          metadata: route
        }

      case 'direct':
        if (route.api === 'gamma') {
          return {
            service: route.service,
            handler: 'handleGammaPresentation',
            metadata: route
          }
        } else if (route.api === 'vertex') {
          return {
            service: route.service,
            handler: 'handleVertexImage',
            metadata: route
          }
        } else if (route.tool) {
          return {
            service: route.service,
            handler: 'handleMCPContent',
            tool: route.tool,
            metadata: route
          }
        }
        break
    }
  }

  // Check if research is needed
  static needsResearch(contentType: string, context: any): boolean {
    const needsResearchTypes = ['media-plan', 'campaign', 'crisis-response', 'presentation']
    return needsResearchTypes.includes(contentType) && !context.research
  }

  // Check if it's multi-piece content
  static isMultiPiece(contentType: string): boolean {
    const route = CONTENT_ROUTING_MAP[contentType]
    return route?.outputs && route.outputs.length > 1
  }
}
```

---

## HANDLER IMPLEMENTATIONS

### 1. Complex Content Handler (Orchestrator)
```typescript
const handleComplexContent = async (userMessage: string, contentType: string) => {
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

  return await response.json()
}
```

### 2. Gamma Presentation Handler
```typescript
const handleGammaPresentation = async (userMessage: string, context: any) => {
  console.log('📊 Routing to Gamma for presentation')

  // First, use orchestrator to understand what presentation they want
  const understanding = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/niv-content-intelligent-v2`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        message: userMessage,
        conversationHistory: messages,
        organizationContext: {
          conversationId: conceptState.conversationId,
          organizationId: organization?.id
        },
        stage: 'acknowledge' // Just understand, don't generate
      })
    }
  )

  const understood = await understanding.json()

  // If we have enough info, call Gamma
  if (understood.understanding?.subject && understood.understanding?.purpose) {
    const gammaResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/gamma-presentation`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          topic: understood.understanding.subject,
          context: {
            purpose: understood.understanding.purpose,
            organization: organization?.name,
            conversationHistory: messages.slice(-3)
          }
        })
      }
    )

    return await gammaResponse.json()
  } else {
    // Need more info - return understanding response
    return understood
  }
}
```

### 3. Vertex Image Handler
```typescript
const handleVertexImage = async (userMessage: string, context: any) => {
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
        organization: organization?.name,
        context: {
          conversationHistory: messages.slice(-2),
          brandGuidelines: context.brandGuidelines
        }
      })
    }
  )

  return await response.json()
}
```

### 4. MCP Content Handler
```typescript
const handleMCPContent = async (userMessage: string, tool: string, context: any) => {
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
          organization: organization?.name,
          context: {
            conversationHistory: messages.slice(-3),
            tone: context.tone,
            keyMessages: context.keyMessages
          }
        }
      })
    }
  )

  return await response.json()
}
```

---

## MAIN MESSAGE HANDLER WITH ROUTING

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
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

  setIsThinking(true)

  try {
    const contentType = conceptState.contentConcept.type

    // GET ROUTING DECISION
    const routing = ContentRoutingAgent.route(contentType, userMessage, {
      organization,
      research: conceptState.researchHistory,
      framework: conceptState.orchestrationContext?.framework
    })

    console.log('🚦 Routing decision:', routing)

    // EXECUTE APPROPRIATE HANDLER
    let response
    switch (routing.handler) {
      case 'handleComplexContent':
        response = await handleComplexContent(userMessage, contentType)
        break

      case 'handleGammaPresentation':
        response = await handleGammaPresentation(userMessage, conceptState)
        break

      case 'handleVertexImage':
        response = await handleVertexImage(userMessage, conceptState)
        break

      case 'handleMCPContent':
        response = await handleMCPContent(userMessage, routing.tool, conceptState)
        break

      default:
        // Fallback to orchestrator
        response = await handleComplexContent(userMessage, contentType)
    }

    // PROCESS RESPONSE BASED ON TYPE
    processResponse(response, routing)

  } catch (error) {
    console.error('❌ Routing error:', error)
    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: 'I encountered an error. Please try again.',
      timestamp: new Date(),
      error: true
    }])
  } finally {
    setIsThinking(false)
  }
}
```

---

## RESPONSE PROCESSING

```typescript
const processResponse = (response: any, routing: any) => {

  // ORCHESTRATOR RESPONSES
  if (routing.service === 'niv-content-intelligent-v2') {
    if (response.mode === 'narrative_options') {
      // Show narrative selector
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
      // Show multi-piece content
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
      // Regular message
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
    if (response.presentationUrl) {
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `I've created your presentation! [View Presentation](${response.presentationUrl})`,
        timestamp: new Date(),
        metadata: {
          type: 'presentation',
          url: response.presentationUrl,
          slides: response.slides
        }
      }])
    } else if (response.message) {
      // Gamma needs more info
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: response.message,
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
          imageUrl: response.imageUrl || response.images[0],
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
      content: response.content || response.result,
      timestamp: new Date(),
      metadata: {
        type: routing.tool,
        generatedContent: response
      }
    }])
  }
}
```

---

## UPDATED CONTENT_MODE_EXPERTISE

```typescript
const CONTENT_MODE_EXPERTISE = {
  'media-plan': {
    service: 'niv-content-intelligent-v2',
    complexity: 'complex',
    expertise: 'PR strategy, media relations, multi-channel campaigns',
    components: ['Press Release', 'Media List', 'Media Pitch', 'Q&A Doc', 'Social Posts'],
    workflow: 'Research → Narratives → Multi-piece Generation'
  },
  'presentation': {
    service: 'gamma-presentation',
    complexity: 'medium',
    expertise: 'Storytelling, data visualization via Gamma API',
    workflow: 'Topic analysis → Structure → Gamma generation'
  },
  'deck': {
    service: 'gamma-presentation',
    complexity: 'medium',
    expertise: 'Professional slide decks via Gamma',
    workflow: 'Same as presentation'
  },
  'image': {
    service: 'vertex-ai-image-generation',
    complexity: 'simple',
    expertise: 'AI image generation via Google Vertex AI',
    workflow: 'Prompt → Vertex generation'
  },
  'social-post': {
    service: 'mcp-content',
    complexity: 'simple',
    expertise: 'Platform optimization, engagement',
    workflow: 'Direct generation'
  },
  'press-release': {
    service: 'mcp-content',
    complexity: 'simple',
    expertise: 'AP style, newsworthiness',
    workflow: 'Direct generation'
  },
  'campaign': {
    service: 'niv-content-intelligent-v2',
    complexity: 'complex',
    expertise: 'Integrated multi-channel campaigns',
    workflow: 'Strategic orchestration'
  }
}
```

---

## THE COMPLETE FLOW

### Example 1: Media Plan
```
User: "create a media plan for sora 2"
  ↓
ContentRoutingAgent.route('media-plan') → niv-content-intelligent-v2
  ↓
handleComplexContent()
  ↓
Backend: Research → Narratives → Generate 5 pieces
  ↓
processResponse() → Display all pieces
```

### Example 2: Presentation
```
User: "create a deck about AI safety"
  ↓
ContentRoutingAgent.route('presentation') → gamma-presentation
  ↓
handleGammaPresentation()
  ↓
niv-content (acknowledge stage) → Get topic/purpose
  ↓
Gamma API → Generate presentation
  ↓
processResponse() → Show presentation link
```

### Example 3: Image
```
User: "create an image of a futuristic city"
  ↓
ContentRoutingAgent.route('image') → vertex-ai-image-generation
  ↓
handleVertexImage()
  ↓
Vertex AI → Generate image
  ↓
processResponse() → Display image
```

### Example 4: Social Post
```
User: "social post about new feature"
  ↓
ContentRoutingAgent.route('social-post') → mcp-content
  ↓
handleMCPContent(tool: 'generate_social_posts')
  ↓
MCP → Generate post
  ↓
processResponse() → Display post
```

---

## WHY THIS WORKS

✅ **Intelligent routing** - Right service for each content type
✅ **Vertex AI utilized** - For all image generation
✅ **Gamma utilized** - For all presentations
✅ **Orchestrator utilized** - For complex multi-piece content
✅ **MCP utilized** - For simple text content
✅ **Unified interface** - User doesn't see complexity
✅ **Proper workflows** - Each service gets what it needs

The routing agent makes intelligent decisions about which specialized service to use.
