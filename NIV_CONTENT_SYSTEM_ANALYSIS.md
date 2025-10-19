# NIV Content System - Comprehensive Analysis & Fix Plan

## Current State Analysis

### System Overview
The NIV Content System is designed to act as an intelligent PR consultant that helps users create comprehensive media plans and content packages through conversational interaction. The system consists of:

1. **Frontend Component**: `NIVContentOrchestrator.tsx`
2. **API Route**: `/api/content/orchestrate/route.ts`
3. **Edge Functions**: `niv-content-robust`, `mcp-content`
4. **MCP Tools**: Individual content generation tools
5. **Storage**: Memory Vault and Content Library (Supabase)

### Critical Problems Identified

#### 1. **NIV Not Acting as a Consultant**
- **Issue**: When user says "we need a media plan for Sundance", NIV either:
  - Asks endless questions without creating anything
  - Tries to immediately generate content without strategy discussion
  - Returns generic fallback messages
- **Root Cause**: Logic flow doesn't understand consultant workflow

#### 2. **No Strategy Development Phase**
- **Issue**: System jumps straight to content generation or questioning
- **Expected**: Should present a media strategy FIRST for user agreement
- **Impact**: User never gets strategic alignment before content creation

#### 3. **MCP Content Tools Failing**
- **Issue**: All MCP tool calls return 500 errors (see logs lines 171-225)
- **Fallback**: Claude generation exists but isn't properly extracting context
- **Result**: Even when content generation is triggered, it fails

#### 4. **No Memory/Storage Integration**
- **Issue**: Content is not saved to Memory Vault or Content Library
- **Expected**: Each piece should be saved with metadata for later retrieval
- **Impact**: NIV can't remember or repackage content it created

#### 5. **Poor Response Flow**
- **Issue**: All content returned in one massive response
- **Expected**: Individual chat messages for each content piece
- **Missing**: Workspace integration, edit buttons, progress tracking

## How It's SUPPOSED to Work

### Correct Conversation Flow

#### Phase 1: Initial Request & Strategy Development
```
User: "We are hosting an event at Sundance film festival to highlight our capability
      of helping with every step of the creative process. We need a media plan to
      amplify the event and our narrative"

NIV: "Excellent opportunity at Sundance! Based on your focus on creative process
     capabilities, here's the media strategy I recommend:

     **STRATEGIC APPROACH**
     - Positioning: 'The Creative Industry's Essential Partner'
     - Core Narrative: 'From Concept to Screen - Powering Every Creative Step'
     - Target Media: Entertainment trades, tech media, creative industry pubs
     - Timing: Pre-event buzz → Event coverage → Follow-up stories

     **KEY ANGLES**
     - Technology meets creativity at Sundance
     - Behind-the-scenes of productions using your tools
     - Creator testimonials and success stories

     **DELIVERABLES I'LL CREATE**
     - Press release announcing Sundance presence
     - Targeted media list (50+ journalists)
     - Personalized media pitches
     - Event media advisory
     - Executive talking points
     - Q&A document
     - Social media campaign

     Does this strategy align with your vision? Any adjustments before I create
     the materials?"
```

#### Phase 2: Agreement & Content Generation
```
User: "Perfect, let's create it"

NIV: "Great! I'll create your complete media plan now. You'll see each component
     as it's completed..."

[Generates content one by one]

NIV: "✅ Press Release created - Announcing your Sundance presence"
     [Open in Workspace]

NIV: "✅ Media List compiled - 52 targeted journalists covering entertainment tech"
     [Open in Workspace]

[... continues for each piece ...]

NIV: "📁 Complete Sundance Media Plan saved
     - Location: /content-library/sundance-2025/
     - Memory Vault: Indexed for future use
     - All 7 components ready for editing"
```

## System Architecture & Data Flow

### Request Flow
```
1. User Input (NIVContentOrchestrator.tsx)
   ↓
2. API Route (/api/content/orchestrate/route.ts)
   ↓
3. Edge Function (niv-content-robust)
   ↓
4. Content Generation:
   - Primary: MCP Tools (mcp-content → specific tools)
   - Fallback: Claude API direct generation
   ↓
5. Storage:
   - Memory Vault (for NIV's memory)
   - Content Library (for user access)
   ↓
6. Response to Frontend
   - Individual messages per content piece
   - Workspace integration
```

### Key Components

#### niv-content-robust Edge Function
- **Purpose**: Main orchestrator for content conversations
- **Responsibilities**:
  - Maintain conversation state
  - Detect content requests vs. strategy discussions
  - Orchestrate multi-content generation
  - Save to storage systems

#### mcp-content Edge Function
- **Purpose**: Routes to specific MCP content tools
- **Current Issue**: Returning 500 errors
- **Tools Available**:
  - mcp-press-release
  - mcp-media-list
  - mcp-media-pitch
  - mcp-media-advisory
  - mcp-talking-points
  - mcp-qa-document
  - mcp-social-media-post

#### Content State Management
```typescript
interface ContentState {
  conversationId: string
  stage: 'discovery' | 'strategy' | 'agreement' | 'creating' | 'complete'
  strategy?: {
    positioning: string
    narrative: string
    angles: string[]
    deliverables: string[]
    approved: boolean
  }
  concept: {
    topic: string
    announcement: string
    goal: string
    audience: string
    keyMessages: string[]
  }
  generatedContent: {
    [contentType: string]: {
      content: string
      savedTo: {
        memoryVault: boolean
        contentLibrary: string
      }
      version: number
    }
  }
}
```

## Comprehensive Fix Plan

### Fix 1: Consultant Behavior & Strategy Phase
```typescript
// In niv-content-robust/index.ts

// Detect content request but DON'T generate yet
if (contentRequest.isContent && state.stage === 'discovery') {
  // Generate STRATEGY, not content
  const strategy = await generateMediaStrategy(message, state)
  state.stage = 'strategy'
  state.strategy = strategy

  return {
    message: formatStrategyPresentation(strategy),
    needsAgreement: true,
    stage: 'strategy'
  }
}

// Only generate content after strategy agreement
if (state.stage === 'agreement' && userAgreesWithStrategy(message)) {
  state.stage = 'creating'
  // NOW orchestrate content generation
  return await orchestrateContentGeneration(state)
}
```

### Fix 2: Content Generation with Progress Updates
```typescript
async function orchestrateContentGeneration(state: ContentState) {
  const messages = []
  const contentTypes = CONTENT_PACKAGES[state.requestedPackage]

  for (const contentType of contentTypes) {
    // Generate content
    const content = await generateContent(contentType, state)

    // Save to Memory Vault
    await saveToMemoryVault(content, contentType, state)

    // Save to Content Library
    const path = await saveToContentLibrary(content, contentType, state)

    // Add confirmation message
    messages.push({
      type: 'content-complete',
      contentType,
      message: `✅ ${formatContentType(contentType)} created`,
      workspaceUrl: `/workspace/edit/${path}`,
      content: content
    })
  }

  // Final summary
  messages.push({
    type: 'package-complete',
    message: '📁 Complete media plan saved',
    folderPath: state.contentLibraryFolder,
    itemCount: contentTypes.length
  })

  return messages
}
```

### Fix 3: MCP Tool Integration
```typescript
// Fix the MCP tool calling
async function callMCPTool(toolName: string, params: any) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/mcp-content`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` // Must use SERVICE key
    },
    body: JSON.stringify({
      tool: toolName,
      parameters: params
    })
  })

  if (!response.ok) {
    // Log the actual error
    const error = await response.text()
    console.error(`MCP tool ${toolName} failed:`, error)

    // Fall back to Claude
    return await generateWithClaude(toolName, params)
  }

  return await response.json()
}
```

### Fix 4: Memory Vault Integration
```typescript
async function saveToMemoryVault(content: string, contentType: string, state: ContentState) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  const { error } = await supabase
    .from('memory_vault')
    .insert({
      conversation_id: state.conversationId,
      organization_id: state.organization.id,
      content_type: contentType,
      content: content,
      metadata: {
        package: state.requestedPackage,
        strategy: state.strategy,
        created_for: state.concept.announcement,
        event: 'Sundance 2025'
      }
    })

  if (error) {
    console.error('Memory Vault save failed:', error)
  }
}
```

### Fix 5: Frontend Response Handling
```typescript
// In NIVContentOrchestrator.tsx

const handleContentResponse = (response: any) => {
  if (response.messages) {
    // Handle multi-message response
    response.messages.forEach((msg: any, index: number) => {
      setTimeout(() => {
        if (msg.type === 'content-complete') {
          addMessage({
            role: 'assistant',
            content: msg.message,
            metadata: {
              contentType: msg.contentType,
              workspaceUrl: msg.workspaceUrl,
              hasAction: true
            }
          })

          // Store content for workspace
          storeContentForWorkspace(msg.content, msg.contentType)
        }
      }, index * 500) // Stagger messages
    })
  }
}
```

## Implementation Priority

### Phase 1: Get Basic Strategy Response Working
1. Fix conversation flow to present strategy first
2. Ensure NIV responds appropriately to "media plan" requests
3. Test with Sundance prompt

### Phase 2: Fix Content Generation
1. Debug why MCP tools return 500 errors
2. Implement proper Claude fallback with context
3. Test single content generation

### Phase 3: Add Storage
1. Implement Memory Vault saving
2. Create Content Library folder structure
3. Add retrieval capabilities

### Phase 4: Improve Response Flow
1. Implement progressive message delivery
2. Add workspace integration
3. Create edit capabilities

### Phase 5: Complete System
1. Add progress tracking
2. Implement content versioning
3. Enable repackaging (e.g., for Gamma presentations)

## Testing Requirements

### Test Scenarios
1. **Basic Strategy**: "We need a media plan for Sundance"
   - Should return strategy, not questions

2. **Agreement Flow**: After strategy, user says "Yes, create it"
   - Should start generating content

3. **Direct Creation**: "Create a press release for our product launch"
   - Should generate single content piece

4. **Memory Recall**: "Use the Sundance content for a Gamma presentation"
   - Should retrieve from Memory Vault

## Key Files to Modify

1. `/supabase/functions/niv-content-robust/index.ts` - Main logic fixes
2. `/supabase/functions/mcp-content/index.ts` - Fix MCP routing
3. `/src/components/execute/NIVContentOrchestrator.tsx` - Frontend handling
4. `/src/app/api/content/orchestrate/route.ts` - API adjustments

## Environment Variables Required
```
ANTHROPIC_API_KEY=sk-ant-api03-...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI...
SUPABASE_URL=https://zskaxjtyuaqazydouifp.supabase.co
```

## Success Criteria
- [ ] NIV presents strategy before creating content
- [ ] User can agree/adjust strategy
- [ ] Content generates successfully (MCP or Claude fallback)
- [ ] Each piece shows completion in chat
- [ ] Content saved to Memory Vault
- [ ] Content saved to Content Library
- [ ] Workspace edit buttons functional
- [ ] NIV can recall and repackage content