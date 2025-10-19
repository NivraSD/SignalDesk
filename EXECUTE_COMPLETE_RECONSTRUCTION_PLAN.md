# EXECUTE MODULE - COMPLETE RECONSTRUCTION PLAN
## EVERYTHING IS BROKEN - HERE'S THE TOTAL REBUILD SPEC

---

## CURRENT DISASTER STATE

### What's Completely Fucked:
1. **NIVContentOrchestrator** - 700+ lines of broken auto-trigger hell
2. **All service endpoints** - 404 errors everywhere
3. **Content generation** - Doesn't work for ANY content type
4. **Image generation** - Auto-triggers with wrong prompts
5. **Save functionality** - Database table missing, buttons don't work
6. **Research integration** - Wrong URLs, wrong parameters
7. **UI workspace** - Missing proper content editor, no real workspace
8. **Content library** - Not connected to anything

---

## COMPLETE RECONSTRUCTION ARCHITECTURE

### TIER 1: CORE CHAT INTERFACE (Like Working NIVStrategicAdvisor)

**Pattern to Copy:**
```javascript
// From working NivStrategicAdvisor.js
const handleSend = async () => {
  const userMessage = input.trim()
  setMessages(prev => [...prev, { role: 'user', content: userMessage }])
  setIsThinking(true)

  const response = await fetch('/api/niv/strategic-advice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: userMessage,
      context: { activeModule, organizationId }
    })
  })

  const data = await response.json()
  setMessages(prev => [...prev, { role: 'assistant', content: data.advice }])
}
```

**New Execute Pattern:**
```javascript
// New NIVContentOrchestrator - CLEAN & SIMPLE
const handleSend = async () => {
  const userMessage = input.trim()
  addMessage({ role: 'user', content: userMessage })
  setIsThinking(true)

  // Check if this is a direct content generation request
  if (isContentGenerationRequest(userMessage, selectedContentType)) {
    await generateContent(userMessage, selectedContentType)
  } else {
    // Normal conversation with NIV
    await haveBNormalConversation(userMessage)
  }
}
```

---

## TIER 2: CONTENT GENERATION BY TYPE

### PRESS RELEASE
**How It Should Work:**
1. User selects "Press Release" type
2. User types: "Create a press release about our new AI model launch"
3. NIV calls `/api/content/press-release` with proper parameters
4. Service returns structured press release
5. Display in workspace with edit/save buttons

**Service Integration:**
```javascript
// Endpoint: /api/content/press-release
const generatePressRelease = async (prompt, context) => {
  const response = await fetch('/api/content/press-release', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: prompt,
      organization: 'OpenAI',
      context: {
        selectedFramework: framework,
        recentIntelligence: getRecentIntelligence(),
        brandGuidelines: getBrandGuidelines()
      }
    })
  })

  return await response.json()
}
```

**Expected Response Format:**
```javascript
{
  success: true,
  content: {
    headline: "OpenAI Announces Revolutionary GPT-5 Model",
    subheadline: "New capabilities transform enterprise AI applications",
    body: "Full press release body...",
    boilerplate: "About OpenAI...",
    mediaContact: { name: "...", email: "..." }
  },
  metadata: {
    wordCount: 450,
    readingTime: "2 minutes",
    keyMessages: ["Innovation", "Leadership", "Impact"]
  }
}
```

### SOCIAL MEDIA POSTS
**How It Should Work:**
1. User selects "Social Media" type
2. User types: "Create LinkedIn post about AI safety milestone"
3. NIV calls `/api/content/social-post`
4. Service returns platform-optimized posts
5. Display with platform previews

**Service Integration:**
```javascript
const generateSocialPost = async (prompt, platforms = ['linkedin', 'twitter', 'facebook']) => {
  const response = await fetch('/api/content/social-post', {
    method: 'POST',
    body: JSON.stringify({
      prompt,
      platforms,
      organization: 'OpenAI',
      tone: 'professional',
      includeHashtags: true,
      includeCallToAction: true
    })
  })
}
```

**Expected Response:**
```javascript
{
  success: true,
  content: {
    linkedin: {
      text: "Excited to share a major milestone in AI safety...",
      hashtags: ["#AISafety", "#OpenAI", "#Innovation"],
      characterCount: 280
    },
    twitter: {
      text: "🚀 Major AI safety breakthrough at OpenAI...",
      hashtags: ["#AISafety", "#AI"],
      characterCount: 140,
      threadParts: ["Part 1...", "Part 2..."]
    },
    facebook: {
      text: "We're thrilled to announce...",
      suggestedImage: "Professional team photo",
      callToAction: "Learn more at openai.com"
    }
  }
}
```

### EMAIL CAMPAIGNS
**How It Should Work:**
1. User selects "Email" type
2. User types: "Create email for developer newsletter about API updates"
3. NIV calls `/api/content/email-campaign`
4. Service returns full email with subject lines, preview text, etc.

**Service Integration:**
```javascript
const generateEmail = async (prompt, emailType = 'newsletter') => {
  const response = await fetch('/api/content/email-campaign', {
    method: 'POST',
    body: JSON.stringify({
      prompt,
      type: emailType, // newsletter, announcement, nurture, etc.
      audience: 'developers',
      organization: 'OpenAI',
      includePersonalization: true
    })
  })
}
```

### EXECUTIVE STATEMENTS
**How It Should Work:**
1. User selects "Executive Statement"
2. User types: "CEO statement on responsible AI development"
3. NIV calls `/api/content/executive-statement`
4. Service returns executive-level messaging

**Service Integration:**
```javascript
const generateExecutiveStatement = async (prompt) => {
  const response = await fetch('/api/content/executive-statement', {
    method: 'POST',
    body: JSON.stringify({
      prompt,
      executive: 'CEO', // or CTO, etc.
      organization: 'OpenAI',
      tone: 'authoritative',
      topics: extractTopics(prompt),
      recentNews: getRecentNews()
    })
  })
}
```

### CRISIS RESPONSE
**How It Should Work:**
1. User selects "Crisis Response"
2. User types: "Response to AI model bias concerns"
3. NIV calls `/api/content/crisis-response` with URGENT priority
4. Service returns immediate response framework

**Service Integration:**
```javascript
const generateCrisisResponse = async (prompt) => {
  const response = await fetch('/api/content/crisis-response', {
    method: 'POST',
    body: JSON.stringify({
      prompt,
      urgency: 'high',
      organization: 'OpenAI',
      responseType: 'reactive', // or proactive
      stakeholders: ['media', 'customers', 'investors'],
      includeFactsSheet: true
    })
  })
}
```

### MEDIA PITCHES
**How It Should Work:**
1. User selects "Media Pitch"
2. User types: "Pitch TechCrunch on our new reasoning model"
3. NIV calls `/api/content/media-pitch`
4. Service returns personalized pitch

**Service Integration:**
```javascript
const generateMediaPitch = async (prompt) => {
  const response = await fetch('/api/content/media-pitch', {
    method: 'POST',
    body: JSON.stringify({
      prompt,
      targetOutlet: extractOutlet(prompt), // TechCrunch
      organization: 'OpenAI',
      newsAngle: extractAngle(prompt),
      includeMediaKit: true,
      contactInfo: getMediaContact()
    })
  })
}
```

### THOUGHT LEADERSHIP
**How It Should Work:**
1. User selects "Thought Leadership"
2. User types: "Blog post on the future of multimodal AI"
3. NIV calls `/api/content/thought-leadership`
4. Service returns long-form content

**Service Integration:**
```javascript
const generateThoughtLeadership = async (prompt) => {
  const response = await fetch('/api/content/thought-leadership', {
    method: 'POST',
    body: JSON.stringify({
      prompt,
      format: 'blog-post', // or whitepaper, op-ed
      organization: 'OpenAI',
      wordCount: 1500,
      includeDataPoints: true,
      authorVoice: 'technical-expert'
    })
  })
}
```

### Q&A DOCUMENTS
**How It Should Work:**
1. User selects "Q&A Document"
2. User types: "FAQ about GPT-4 capabilities and limitations"
3. NIV calls `/api/content/qa-document`
4. Service returns structured Q&A

**Service Integration:**
```javascript
const generateQADocument = async (prompt) => {
  const response = await fetch('/api/content/qa-document', {
    method: 'POST',
    body: JSON.stringify({
      prompt,
      organization: 'OpenAI',
      questionCount: 15,
      includeSourceLinks: true,
      difficulty: 'mixed' // basic, intermediate, advanced
    })
  })
}
```

### MESSAGING FRAMEWORKS
**How It Should Work:**
1. User selects "Messaging"
2. User types: "Core messaging for AI safety initiative"
3. NIV calls `/api/content/messaging-framework`
4. Service returns structured messaging hierarchy

**Service Integration:**
```javascript
const generateMessagingFramework = async (prompt) => {
  const response = await fetch('/api/content/messaging-framework', {
    method: 'POST',
    body: JSON.stringify({
      prompt,
      organization: 'OpenAI',
      messageHierarchy: true,
      includeProofPoints: true,
      audienceSegmentation: ['technical', 'business', 'general']
    })
  })
}
```

---

## TIER 3: VISUAL CONTENT GENERATION

### IMAGES (Google Imagen)
**How It Should Work:**
1. User selects "Image" type
2. User types: "Create image of AI-powered future workplace"
3. NIV calls Vertex AI Visual service
4. Returns base64 image
5. Display with download/save/regenerate buttons

**Service Integration:**
```javascript
const generateImage = async (prompt) => {
  const response = await fetch('/api/visual/image', {
    method: 'POST',
    body: JSON.stringify({
      prompt: enhancePromptWithBranding(prompt),
      model: 'imagen-3',
      aspectRatio: '16:9',
      style: 'professional',
      organization: 'OpenAI'
    })
  })
}

const enhancePromptWithBranding = (prompt) => {
  return `${prompt}, professional tech aesthetic, modern corporate style, OpenAI branding elements`
}
```

### VIDEOS (Google Veo)
**How It Should Work:**
1. User selects "Video" type
2. User types: "Create video explaining transformer architecture"
3. NIV calls Google Veo service
4. Returns video URL or job ID for polling
5. Display with player and download options

**Service Integration:**
```javascript
const generateVideo = async (prompt) => {
  const response = await fetch('/api/visual/video', {
    method: 'POST',
    body: JSON.stringify({
      prompt: prompt,
      duration: 15, // seconds
      style: 'educational',
      voiceover: false,
      organization: 'OpenAI'
    })
  })

  // Handle async generation
  if (response.jobId) {
    return pollVideoGeneration(response.jobId)
  }
}
```

### PRESENTATIONS (Gamma)
**How It Should Work:**
1. User selects "Presentation" type
2. User types: "Deck on Q4 product roadmap"
3. NIV calls Gamma API
4. Returns presentation URL
5. Display with embed or open in Gamma

**Service Integration:**
```javascript
const generatePresentation = async (prompt) => {
  const response = await fetch('/api/visual/presentation', {
    method: 'POST',
    body: JSON.stringify({
      prompt: prompt,
      slideCount: 10,
      template: 'corporate',
      organization: 'OpenAI',
      includeCharts: true
    })
  })
}
```

---

## TIER 4: RESEARCH INTEGRATION

### Intelligence Integration
**How It Should Work:**
1. User asks: "Research competitor messaging on AI safety"
2. NIV calls intelligence search
3. Returns relevant findings
4. User can then create content based on research

**Service Integration:**
```javascript
const performResearch = async (query) => {
  const response = await fetch('/api/intelligence/search', {
    method: 'POST',
    body: JSON.stringify({
      query: query,
      organization: 'OpenAI',
      sources: ['web', 'news', 'social', 'internal'],
      timeframe: '30d'
    })
  })
}
```

---

## TIER 5: CONTENT WORKSPACE UI

### Workspace Layout
```
┌─────────────────────────────────────────────────────────────┐
│ NIV CONTENT ORCHESTRATOR                                    │
├─────────────────┬───────────────────────────────────────────┤
│ CONTENT TYPES   │ CHAT INTERFACE                            │
│                 │                                           │
│ □ Press Release │ User: Create press release about...       │
│ ☑ Social Media  │ NIV:  I'll create a social media post... │
│ □ Email         │ [GENERATED CONTENT PREVIEW]               │
│ □ Executive     │                                           │
│ □ Crisis        │ [Edit] [Save] [Regenerate]                │
│ □ Media Pitch   │                                           │
│ □ Thought Lead  │ User: Now make it more technical          │
│ □ Q&A           │ NIV:  Here's a more technical version...  │
│ □ Messaging     │                                           │
│ □ Image         │ [INPUT BOX]                  [SEND]       │
│ □ Video         │                                           │
│ □ Presentation  │                                           │
├─────────────────┼───────────────────────────────────────────┤
│ ACTIONS         │ CONTENT EDITOR                            │
│                 │                                           │
│ Research        │ [Rich text editor with generated content] │
│ Generate        │ [Format controls, export options]         │
│ Save Draft      │                                           │
│ Publish         │                                           │
│ Export          │                                           │
└─────────────────┴───────────────────────────────────────────┘
```

### Content Editor Features
- **Rich text editing** for all content types
- **Format-specific controls** (headline/body for press releases, platform toggles for social)
- **Real-time preview** for different content types
- **Export options** (PDF, Word, HTML, JSON)
- **Version history**
- **Collaboration features**

---

## TIER 6: MEMORY VAULT INTEGRATION

### Save System
```javascript
const saveToMemoryVault = async (content, contentType) => {
  const response = await fetch('/api/memory-vault/save', {
    method: 'POST',
    body: JSON.stringify({
      content: content,
      type: contentType,
      organization: 'OpenAI',
      status: 'draft', // or published
      metadata: {
        createdBy: 'niv',
        generatedAt: Date.now(),
        version: 1
      }
    })
  })

  // Also save to content_library table
  await supabase.from('content_library').insert({
    organization_id: 'openai',
    type: contentType,
    content: content,
    status: 'completed'
  })
}
```

---

## TIER 7: REQUIRED API ENDPOINTS

### Content Generation Endpoints (Need to be created):
- `POST /api/content/press-release`
- `POST /api/content/social-post`
- `POST /api/content/email-campaign`
- `POST /api/content/executive-statement`
- `POST /api/content/crisis-response`
- `POST /api/content/media-pitch`
- `POST /api/content/thought-leadership`
- `POST /api/content/qa-document`
- `POST /api/content/messaging-framework`

### Visual Generation Endpoints (Need to be created):
- `POST /api/visual/image` (calls vertex-ai-visual)
- `POST /api/visual/video` (calls google-visual-generation)
- `POST /api/visual/presentation` (calls gamma-presentation)

### Research Integration Endpoints:
- `POST /api/intelligence/search` (calls existing intelligence)

### Storage Endpoints:
- `POST /api/memory-vault/save`
- `GET /api/memory-vault/list`
- `PUT /api/memory-vault/update`

---

## IMPLEMENTATION PHASES

### Phase 1: Core Chat Interface (Week 1)
1. Create new NIVContentOrchestrator based on working NIVStrategicAdvisor pattern
2. Basic message flow working
3. Content type selection working
4. No auto-generation, just conversation

### Phase 2: Text Content Generation (Week 2)
1. Create all content generation API endpoints
2. Wire up press releases, social posts, emails
3. Basic content display and editing
4. Save functionality

### Phase 3: Visual Content (Week 3)
1. Fix image generation with proper UI
2. Add video generation
3. Add presentation generation
4. Proper media display components

### Phase 4: Advanced Features (Week 4)
1. Research integration
2. Content workspace
3. Memory vault integration
4. Export functionality

### Phase 5: Polish & Testing (Week 5)
1. UI refinement
2. Error handling
3. Performance optimization
4. End-to-end testing

---

## SUCCESS CRITERIA

### Must Work Perfectly:
1. User selects content type → NIV acknowledges
2. User asks for content → NIV generates it correctly
3. Generated content displays properly with edit/save buttons
4. Save button actually saves to database
5. Images generate and display at correct size
6. No auto-generation unless explicitly requested
7. No debug logs in user interface
8. All content types work end-to-end
9. Research integration works without errors
10. Export/download functionality works

This is the COMPLETE reconstruction plan. Every single piece needs to be rebuilt from scratch using the working NIVStrategicAdvisor pattern as the foundation.