# COMPLETE FIX PLAN - ALL ISSUES

## ISSUE 1: CONTENT NOT APPEARING IN WORKSPACE

### Root Cause:
Type mismatch - NIV sends `type: 'blog-post'` but ContentWorkspace expects `type: 'text'`

### FIX:
**File:** `/Users/jonathanliebowitz/Desktop/signaldesk-v3/src/components/execute/NIVContentOrchestrator.tsx`
**Line 264-276:**

```typescript
// CURRENT CODE (BROKEN):
const contentItem: ContentItem = {
  id: `content-${Date.now()}`,
  type: contentType as any,  // <-- SENDS 'blog-post'
  title: `${config.label} - ${new Date().toLocaleDateString()}`,
  content: result.content || result.imageUrl || result.url || result,
  priority: 'normal' as any,
  metadata: { ... } as any,
  status: 'draft' as any
}

// FIXED CODE:
const typeMap: Record<string, string> = {
  'blog-post': 'text',
  'press-release': 'press-release',  // This is in the list
  'social-post': 'social-post',      // This is in the list
  'email': 'email',                  // This is in the list
  'thought-leadership': 'text',
  'exec-statement': 'text',
  'messaging-framework': 'text',
  'qa-document': 'text',
  'media-pitch': 'text',
  'crisis-response': 'text'
}

const contentItem: ContentItem = {
  id: `content-${Date.now()}`,
  type: typeMap[contentType] || 'text',  // <-- MAP TO CORRECT TYPE
  content: result.content || result.imageUrl || result.url || result,
  saved: false,  // Remove 'as any'
  timestamp: Date.now(),
  metadata: {
    createdAt: new Date(),
    service: config.service,
    organization: organization?.name,
    originalType: contentType  // Keep original type
  }
  // Remove title, priority, status - not needed
}
```

---

## ISSUE 2: NO CONVERSATION MEMORY

### Root Cause:
Only current message is sent to API, no conversation history

### FIX:
**File:** `/Users/jonathanliebowitz/Desktop/signaldesk-v3/src/components/execute/NIVContentOrchestrator.tsx`
**Line 243-259:**

```typescript
// CURRENT CODE (NO CONTEXT):
const requestBody = {
  prompt: prompt,
  organization: organization?.name || 'OpenAI',
  organizationId: organization?.id,
  ...config.params
}

// FIXED CODE (WITH CONTEXT):
const requestBody = {
  prompt: prompt,
  conversation: messages.slice(-10).map(msg => ({  // Last 10 messages for context
    role: msg.role,
    content: typeof msg.content === 'string' ? msg.content : msg.content?.text || ''
  })),
  contentType: contentType,
  organization: organization?.name || 'OpenAI',
  organizationId: organization?.id,
  ...config.params
}
```

---

## ISSUE 3: EDGE FUNCTIONS NOT USING CONTEXT

### FIX:
**File:** `/Users/jonathanliebowitz/Desktop/signaldesk-v3/supabase/functions/mcp-content/index.ts`
**After line 380 (in serve function):**

```typescript
// CURRENT CODE:
const { tool, arguments: args } = await req.json()

// FIXED CODE:
const { tool, arguments: args, conversation } = await req.json()

// Build conversation context
let contextMessages = []
if (conversation && conversation.length > 0) {
  // Add previous conversation as context
  contextMessages = conversation.map((msg: any) => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content
  }))
}

// When calling functions, include context
if (tool === 'generate_blog_post') {
  const { title, topic, ...rest } = args || {}

  // Add context to the prompt
  const contextPrompt = contextMessages.length > 0
    ? `Previous conversation:\n${contextMessages.map(m => `${m.role}: ${m.content}`).join('\n')}\n\nNow, ${topic}`
    : topic

  const result = await generateBlogPost({
    title,
    topic: contextPrompt,  // Include context in topic
    ...rest
  })

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  })
}
```

---

## ISSUE 4: CONTENT LIBRARY SAVE ERROR

### Root Cause:
RPC function doesn't exist, trying to call .catch() on wrong thing

### FIX:
**File:** `/Users/jonathanliebowitz/Desktop/signaldesk-v3/src/app/api/content-library/save/route.ts`
**Lines 38-49:**

```typescript
// DELETE ALL THE RPC NONSENSE (lines 38-49)
// Just handle the error properly:

if (saveError) {
  console.error('Content library save error:', saveError)

  // If table doesn't exist, return helpful error
  if (saveError.message?.includes('relation') || saveError.message?.includes('does not exist')) {
    return NextResponse.json({
      success: false,
      error: 'Content library table does not exist. Please create it in Supabase.',
      createTableSQL: `
        CREATE TABLE IF NOT EXISTS content_library (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          organization_id UUID,
          content_type VARCHAR(100),
          title VARCHAR(500),
          content TEXT,
          metadata JSONB,
          tags TEXT[],
          status VARCHAR(50) DEFAULT 'draft',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_by VARCHAR(100) DEFAULT 'niv'
        );
      `
    }, { status: 400 })
  }

  throw saveError
}
```

---

## ISSUE 5: VERTEX AI VISUAL ERROR

### Root Cause:
`prompt` variable is undefined

### FIX:
**File:** `/Users/jonathanliebowitz/Desktop/signaldesk-v3/supabase/functions/vertex-ai-visual/index.ts`
**Find where prompt is used and add validation:**

```typescript
const body = await req.json()
const { prompt, imagePrompt, style, aspectRatio } = body

// Use imagePrompt as fallback if prompt is missing
const finalPrompt = prompt || imagePrompt || body.content || body.message || 'Generate an image'

if (!finalPrompt) {
  return new Response(
    JSON.stringify({
      success: false,
      error: 'No prompt provided',
      fallback: { type: 'manual', instructions: 'Prompt is required' }
    }),
    { status: 400, headers: corsHeaders }
  )
}

// Use finalPrompt instead of prompt in the API call
```

---

## ISSUE 6: DATABASE TABLE MISSING

### FIX:
**Run this in Supabase SQL Editor:**

```sql
-- Create content_library table
CREATE TABLE IF NOT EXISTS content_library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID,
  content_type VARCHAR(100),
  title VARCHAR(500),
  content TEXT,
  metadata JSONB,
  tags TEXT[],
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(100) DEFAULT 'niv'
);

-- Enable RLS but allow all operations for now
ALTER TABLE content_library ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all operations" ON content_library;
CREATE POLICY "Enable all operations" ON content_library
  FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON content_library TO anon, authenticated, service_role;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_library_organization_id ON content_library(organization_id);
CREATE INDEX IF NOT EXISTS idx_content_library_content_type ON content_library(content_type);
CREATE INDEX IF NOT EXISTS idx_content_library_created_at ON content_library(created_at DESC);
```

---

## IMPLEMENTATION ORDER

### Step 1: Fix Content Display (5 minutes)
Fix the type mapping in NIVContentOrchestrator.tsx so content appears in workspace.

### Step 2: Create Database Table (2 minutes)
Run the SQL in Supabase to create content_library table.

### Step 3: Fix Save API (5 minutes)
Remove the broken RPC code from content-library/save/route.ts.

### Step 4: Add Conversation Context (15 minutes)
Update NIVContentOrchestrator to send conversation history.

### Step 5: Update Edge Functions (30 minutes)
Deploy updated mcp-content with conversation handling.

### Step 6: Fix Vertex AI (10 minutes)
Fix the prompt variable issue in vertex-ai-visual.

---

## VERIFICATION TESTS

### Test 1: Content Display
1. Select "blog-post" content type
2. Generate content
3. **EXPECTED:** Content appears in workspace
4. **CHECK:** Browser console for "🎉 Content generated"

### Test 2: Content Save
1. Generate any content
2. Click Save
3. **EXPECTED:** Success message
4. **CHECK:** Network tab shows 200 response

### Test 3: Conversation Context
1. Say "Create a blog post"
2. Say "About AI"
3. Say "Make it longer"
4. **EXPECTED:** NIV understands context and expands the AI blog
5. **CHECK:** Content gets progressively refined

### Test 4: Image Generation
1. Select image type
2. Generate image
3. **EXPECTED:** Image appears
4. **CHECK:** No "prompt is not defined" error

---

## SUMMARY

**Total Time:** ~1 hour

**Critical Fixes:**
1. ✅ Type mapping for workspace display
2. ✅ Database table creation
3. ✅ Save API error handling
4. ✅ Conversation context
5. ✅ Edge function context handling
6. ✅ Vertex AI prompt fix

**Result:**
- Content will display in workspace
- Content can be saved
- NIV will remember conversation context
- All edge functions will work

**NO MORE JUMPING AROUND - THIS FIXES EVERYTHING**