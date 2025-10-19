# Simple Auto-Execute Plan: Framework → Auto-Generate All Content

## Your Vision (Even Simpler!)

> "When frameworks are made and option is to execute, just execute all of the content types. No need for that extra selective step. So execute never needs to open theoretically."

**FLOW:**
1. User generates strategic framework in NIV Canvas
2. User clicks "Execute Campaign" button
3. System automatically generates ALL relevant content types
4. Everything saves to folder in Memory Vault
5. User sees "✅ Campaign executed! 12 pieces generated" message
6. User can view everything in Memory Vault

**NO Execute tab needed!**

## What Content Types to Auto-Generate?

From ExecuteTabProduction.tsx, we have 35 types. For a strategic framework execution, we probably want:

**Essential Package** (always generate):
- `press-release` - Core announcement
- `media-pitch` - Journalist outreach
- `qa-document` - Q&A prep
- `talking-points` - Executive messaging
- `social-post` - Social media content
- `email` - Email campaign

**Context-Specific** (based on framework type):
- If `workflow_type === 'crisis-response'`: Add `crisis-response`, `apology-statement`
- If `workflow_type === 'launch'`: Add `blog-post`, `media-kit`
- If `workflow_type === 'thought-leadership'`: Add `thought-leadership`, `linkedin-article`

## Implementation (2-3 hours)

### Step 1: Update Execute Button to Auto-Generate (1 hour)

**File**: `NivCanvasComponent.tsx` lines 735-749

**Replace the execute button handler:**

```typescript
<button
  onClick={async () => {
    const framework = message.structured.framework
    setIsExecuting(true) // Add loading state

    try {
      console.log('🚀 Auto-executing framework:', framework.strategy?.objective)

      // Call auto-execute endpoint
      const response = await fetch('/api/supabase/functions/framework-auto-execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          framework: framework,
          organizationId: organization?.id,
          userId: user?.id
        })
      })

      const result = await response.json()

      if (result.success) {
        // Show success message in chat
        const successMsg: Message = {
          id: Date.now().toString(),
          role: 'niv',
          content: `✅ **Campaign Executed Successfully!**\n\n📦 Generated ${result.contentGenerated.length} pieces:\n${result.contentGenerated.map(c => `• ${c.type}`).join('\n')}\n\n💾 All content saved to: \`${result.folder}\`\n\nView in Memory Vault to see your complete campaign package.`,
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
        content: '❌ Campaign execution failed. Please try again or generate content manually in the Execute tab.',
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
```

### Step 2: Create Auto-Execute Edge Function (1-1.5 hours)

**File**: `supabase/functions/framework-auto-execute/index.ts` (NEW)

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface ContentType {
  id: string
  label: string
  priority: 'essential' | 'contextual'
}

// Content types to always generate
const ESSENTIAL_CONTENT: ContentType[] = [
  { id: 'press-release', label: 'Press Release', priority: 'essential' },
  { id: 'media-pitch', label: 'Media Pitch', priority: 'essential' },
  { id: 'qa-document', label: 'Q&A Document', priority: 'essential' },
  { id: 'talking-points', label: 'Talking Points', priority: 'essential' },
  { id: 'social-post', label: 'Social Media Post', priority: 'essential' },
  { id: 'email', label: 'Email Campaign', priority: 'essential' }
]

// Additional content based on workflow type
const CONTEXTUAL_CONTENT: Record<string, ContentType[]> = {
  'crisis-response': [
    { id: 'crisis-response', label: 'Crisis Response', priority: 'contextual' },
    { id: 'executive-statement', label: 'Executive Statement', priority: 'contextual' }
  ],
  'launch': [
    { id: 'blog-post', label: 'Blog Post', priority: 'contextual' },
    { id: 'media-kit', label: 'Media Kit', priority: 'contextual' }
  ],
  'thought-leadership': [
    { id: 'thought-leadership', label: 'Thought Leadership Article', priority: 'contextual' },
    { id: 'linkedin-article', label: 'LinkedIn Article', priority: 'contextual' }
  ],
  'competitive': [
    { id: 'competitive-positioning', label: 'Competitive Positioning', priority: 'contextual' },
    { id: 'value-proposition', label: 'Value Proposition', priority: 'contextual' }
  ]
}

function mapFrameworkToContentFormat(framework: any) {
  const strategy = framework.strategy || {}
  const narrative = framework.narrative || {}
  const tactics = framework.tactics || {}
  const intelligence = framework.intelligence || {}

  return {
    subject: strategy.objective || 'Strategic Initiative',
    narrative: strategy.narrative || narrative.positioning_statement || '',
    target_audiences: extractTargetAudiences(framework),
    key_messages: narrative.key_messages || [],
    media_targets: extractMediaTargets(tactics.campaign_elements?.media_outreach),
    timeline: formatTimeline(framework.execution?.timeline),
    chosen_approach: strategy.rationale || '',
    tactical_recommendations: tactics.strategic_plays || []
  }
}

function extractTargetAudiences(framework: any): string[] {
  const audiences: string[] = []
  if (framework.tactics?.campaign_elements?.stakeholder_engagement) {
    audiences.push(...framework.tactics.campaign_elements.stakeholder_engagement.slice(0, 3))
  }
  return audiences.length > 0 ? audiences : ['Industry stakeholders', 'Media contacts', 'General public']
}

function extractMediaTargets(mediaOutreach?: string[]): string[] {
  return mediaOutreach && mediaOutreach.length > 0
    ? mediaOutreach.slice(0, 5)
    : ['Tier 1 media outlets', 'Industry publications', 'Trade media']
}

function formatTimeline(timeline?: any): string {
  if (!timeline) return 'Immediate execution recommended'
  if (typeof timeline === 'string') return timeline
  if (timeline.immediate) return `Immediate: ${timeline.immediate.join(', ')}`
  return 'Phased execution plan available'
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { framework, organizationId } = await req.json()

    if (!framework) {
      throw new Error('Framework is required')
    }

    console.log('🚀 Auto-executing framework:', framework.strategy?.objective)

    // Determine what content to generate
    const workflowType = framework.orchestration?.workflow_type || 'general'
    const contentTypes = [
      ...ESSENTIAL_CONTENT,
      ...(CONTEXTUAL_CONTENT[workflowType] || [])
    ]

    console.log(`📦 Generating ${contentTypes.length} content types for ${workflowType} workflow`)

    // Create folder name
    const folderName = framework.strategy?.objective
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .substring(0, 50) || `framework-${Date.now()}`

    const frameworkFolder = `strategic-frameworks/${folderName}`

    // Save framework first to the folder
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    await supabase.from('content_library').insert({
      organization_id: organizationId,
      content_type: 'strategic-framework',
      title: `${framework.strategy?.objective} - Framework`,
      content: JSON.stringify(framework, null, 2),
      folder: frameworkFolder,
      metadata: {
        frameworkId: framework.id,
        workflowType: workflowType,
        createdFrom: 'niv-orchestrator-robust'
      },
      status: 'approved',
      tags: ['strategic-framework', workflowType]
    })

    console.log(`💾 Framework saved to ${frameworkFolder}`)

    // Map framework to content generator format
    const mappedFramework = mapFrameworkToContentFormat(framework)

    // Generate all content pieces
    const generatedContent: any[] = []
    const errors: any[] = []

    for (const contentType of contentTypes) {
      try {
        console.log(`📝 Generating ${contentType.label}...`)

        // Call content generator for each type
        const response = await fetch(`${SUPABASE_URL}/functions/v1/niv-content-intelligent-v2`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
          },
          body: JSON.stringify({
            conversationId: `auto-exec-${Date.now()}-${contentType.id}`,
            message: `Generate a ${contentType.label} for: ${mappedFramework.subject}`,
            organizationId: organizationId,

            // Pre-populate the strategy
            preloadedStrategy: mappedFramework,
            requestedContentType: contentType.id,
            autoExecute: true,

            // Tell it where to save
            saveFolder: frameworkFolder
          })
        })

        const result = await response.json()

        if (result.success && result.content) {
          generatedContent.push({
            type: contentType.label,
            id: contentType.id,
            content: result.content
          })
          console.log(`✅ ${contentType.label} generated`)
        } else {
          throw new Error(result.error || 'Generation failed')
        }

      } catch (error) {
        console.error(`❌ Error generating ${contentType.label}:`, error)
        errors.push({
          type: contentType.label,
          error: error.message
        })
      }
    }

    console.log(`✅ Auto-execution complete: ${generatedContent.length}/${contentTypes.length} pieces generated`)

    return new Response(JSON.stringify({
      success: true,
      message: `Campaign executed: ${generatedContent.length} pieces generated`,
      contentGenerated: generatedContent,
      errors: errors.length > 0 ? errors : undefined,
      folder: frameworkFolder,
      frameworkId: framework.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('Auto-execute error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
```

### Step 3: Update Content Generator to Accept Auto-Execute Mode (30 min)

**File**: `supabase/functions/niv-content-intelligent-v2/index.ts`

**Add at request parsing** (around line 600):

```typescript
const body = await req.json()
const {
  conversationId,
  message,
  organizationId,
  preloadedStrategy,
  requestedContentType,
  autoExecute,
  saveFolder
} = body

// Handle auto-execute mode
if (autoExecute && preloadedStrategy && requestedContentType) {
  console.log(`⚡ Auto-execute mode: Generating ${requestedContentType}`)

  // Set up conversation state with pre-loaded strategy
  conversationState.approvedStrategy = preloadedStrategy
  conversationState.strategyChosen = preloadedStrategy.chosen_approach
  conversationState.stage = 'generating_content'
  conversationState.autoExecuteMode = true
  conversationState.saveFolder = saveFolder

  // Generate content immediately
  const content = await generateContent(requestedContentType, preloadedStrategy)

  // Save to folder
  await supabase.from('content_library').insert({
    organization_id: organizationId,
    content_type: requestedContentType,
    title: `${preloadedStrategy.subject} - ${requestedContentType}`,
    content: content,
    folder: saveFolder,
    metadata: {
      autoGenerated: true,
      fromFramework: true,
      strategy: preloadedStrategy.subject
    },
    status: 'approved'
  })

  return new Response(JSON.stringify({
    success: true,
    content: content,
    savedTo: saveFolder
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
```

### Step 4: Create API Route (15 min)

**File**: `src/app/api/supabase/functions/framework-auto-execute/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration')
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/framework-auto-execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Auto-execute failed: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Auto-execute API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
```

### Step 5: Update Framework Save to Include Folder (Already covered in previous plan)

**File**: `niv-orchestrator-robust/index.ts` line 2817

Same as before - add folder when saving framework.

## Result

When user clicks "Execute Campaign":

```
🚀 Starting auto-execution...
  ↓
💾 Framework saved to: strategic-frameworks/ai-leadership-strategy/
  ↓
📝 Generating 6-8 content pieces...
  ├─ Press Release ✅
  ├─ Media Pitch ✅
  ├─ Q&A Document ✅
  ├─ Talking Points ✅
  ├─ Social Post ✅
  ├─ Email Campaign ✅
  └─ [+ contextual types based on workflow]
  ↓
💾 All content saved to same folder
  ↓
✅ "Campaign executed! 7 pieces generated"
  ↓
User opens Memory Vault → sees complete campaign package
```

## Time Estimate

| Task | Time |
|------|------|
| Update execute button | 1 hour |
| Create auto-execute edge function | 1.5 hours |
| Update content generator | 30 min |
| Create API route | 15 min |
| Testing | 30 min |
| **TOTAL** | **~3.5 hours** |

## Benefits

1. ✅ No need to open Execute tab
2. ✅ One-click campaign generation
3. ✅ Everything organized in folder
4. ✅ Consistent with media plan pattern
5. ✅ Strategic Planning still gets framework
6. ✅ User sees immediate progress in NIV chat

This is the autonomous PR execution you envisioned!
