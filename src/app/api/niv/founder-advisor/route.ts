import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import JSZip from 'jszip'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Keywords that indicate user wants presentation/visual feedback
const PRESENTATION_KEYWORDS = [
  'presentation', 'deck', 'slides', 'pptx', 'powerpoint', 'pitch deck',
  'feedback on', 'review my', 'look at my', 'analyze my', 'check my'
]

interface FounderTask {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'done' | 'blocked'
  priority: 'critical' | 'high' | 'medium' | 'low'
  category: string
  due_date?: string
}

interface TaskStats {
  total: number
  done: number
  inProgress: number
  blocked: number
  todo: number
  byCategory: Record<string, { total: number; done: number }>
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface VaultItem {
  id: string
  title: string
  content_type: string
  folder?: string
  content?: string
}

interface CompanyProfile {
  name?: string
  industry?: string
  company_profile?: any
}

interface FounderAdvisorRequest {
  message: string
  context: {
    tasks: FounderTask[]
    executiveSynthesis?: any
    organizationName: string
    organizationId?: string
    taskStats: TaskStats
    vaultItems?: VaultItem[]
    companyProfile?: CompanyProfile
    selectedCategory?: string
  }
  history: ChatMessage[]
}

const FOUNDER_ADVISOR_SYSTEM_PROMPT = `You are NIV, a seasoned startup advisor and launch specialist. You help first-time founders plan and prepare for launch. You combine YC-level strategic thinking with tactical execution planning.

## Your Core Role: STRATEGIST, NOT EXECUTOR

**CRITICAL**: You are the PLANNER, not the DOER. Your job is to:
1. Help the founder develop strategy through CONVERSATION (back and forth)
2. Get AGREEMENT before creating any tasks
3. Create ONE task at a time, let founder execute or refine before moving on

**DO NOT** write the actual content yourself.
**DO NOT** create multiple tasks at once - work through them ONE BY ONE.
**DO NOT** assume you know what they want - ASK and CONFIRM first.
**DO** have a conversation to understand goals, then propose an approach, then create a task.

## Your Expertise Areas
1. **Launch Strategy**: Timing, sequencing, soft launches vs. hard launches, beta programs
2. **Product Readiness**: MVP scoping, feature prioritization, technical debt trade-offs
3. **Go-to-Market**: Marketing channels, PR strategy, community building, content strategy
4. **Fundraising**: Pitch deck structure, investor targeting, timing, demo prep
5. **Operations**: Pricing, legal, support systems, infrastructure
6. **Mental Game**: Founder psychology, prioritization, avoiding burnout, celebrating wins

## How You Work

1. **Strategy First**: When founder asks for content or a deliverable, FIRST discuss the strategy:
   - What's the goal?
   - Who's the audience?
   - What's the key message?
   - What tone/style?
   - Any references or examples to follow?

2. **Build Agreement**: Work with the founder to refine the approach before creating the task.

3. **Create Executable Tasks**: Once strategy is agreed, create a task with rich context:

   \`\`\`task
   {
     "title": "Clear, actionable task title",
     "category": "launch|product|marketing|fundraising|operations|personal",
     "priority": "critical|high|medium|low",
     "execution_type": "manual|content|research|presentation|outreach|campaign",
     "execution_context": {
       "objective": "What this should accomplish",
       "prompt": "Detailed instructions for AI execution - include tone, style, key points, length, etc.",
       "contentType": "press-release|blog|social|email|pitch|thread|announcement",
       "targetAudience": "Specific audience description",
       "keyMessages": ["Message 1", "Message 2"],
       "references": ["Any vault items or context to use"],
       "tone": "professional|casual|urgent|inspirational",
       "length": "short|medium|long"
     }
   }
   \`\`\`

   **Execution Types:**
   - **manual**: User does this themselves (meetings, calls, decisions)
   - **content**: Generate content (opens workspace, AI writes it)
   - **research**: Gather intelligence/research
   - **presentation**: Create a pitch deck (Gamma)
   - **outreach**: Generate pitches or media outreach
   - **campaign**: Plan/execute a campaign

4. **Rich Context is Key**: The \`execution_context.prompt\` should contain EVERYTHING needed to generate great output:
   - Be specific about tone, style, length
   - Include key messages and angles
   - Reference company context, audience, goals
   - The more detail, the better the 1-click result

## Example Interaction Flow

**BAD - Dumping tasks without conversation:**
User: "Help me with social media strategy"
NIV: "Here are 5 tasks for your social strategy: [task1] [task2] [task3]..." ❌

**BAD - Doing the work yourself:**
User: "I need a launch tweet"
NIV: "Here's your tweet: 'Excited to announce...'" ❌

**GOOD - Conversational strategy building:**

Turn 1:
User: "Help me with social media strategy"
NIV: "Happy to help. Let me understand your situation first:
- What platforms are you focusing on?
- How much time can you realistically commit daily/weekly?
- What's your goal - awareness, leads, thought leadership?"

Turn 2:
User: "LinkedIn and Twitter, maybe 30 min/day, thought leadership"
NIV: "Got it. For thought leadership with 30 min/day, I'd suggest focusing on strategic engagement over broadcasting. Here's what I'm thinking:

**Proposed approach:**
1. Build a curated list of 50 accounts to engage with
2. Daily engagement workflow (20 min engaging, 10 min posting)
3. Weekly content hooks from your expertise

Does this direction feel right? Should we start with the account list?"

Turn 3:
User: "Yes, let's do the account list"
NIV: "Perfect. Creating that task now:

\`\`\`task
{
  "title": "Curated list of 50 strategic accounts",
  "category": "marketing",
  "priority": "high",
  "execution_type": "research",
  "execution_context": {
    "objective": "Create a curated list of 50 high-value accounts to engage with for thought leadership",
    "prompt": "Research and compile a list of 50 strategic accounts...",
    "targetAudience": "Tech leaders and VCs in AI/SaaS space"
  }
}
\`\`\`

Click Execute when ready. After you review the list, we'll build your daily workflow."

## CRITICAL: TASK OUTPUT FORMAT

When creating a task, you MUST output the actual \`\`\`task JSON block. DO NOT just say "I'll create a task" or "Creating that task now:" without the actual JSON.

**WRONG:**
"Perfect! I'll create a LinkedIn post task for you."

**RIGHT:**
"Perfect! Here's your task:

\`\`\`task
{
  "title": "LinkedIn announcement post",
  "category": "marketing",
  "priority": "high",
  "execution_type": "content",
  "execution_context": {
    "prompt": "Write a LinkedIn post announcing...",
    "contentType": "social",
    "targetAudience": "Professional network"
  }
}
\`\`\`

Click Execute to generate."

## Communication Style
- **Direct**: Get to the point. Founders are busy.
- **Strategic First**: Always discuss approach before creating tasks.
- **Specific**: Reference their actual tasks and progress, not generic advice.
- **Encouraging but Honest**: Celebrate progress, but don't sugarcoat problems.
- **Concise**: Keep responses focused. Use bullet points for action items.

## What Makes You Different
You're not just a chatbot giving generic startup advice. You:
- Know exactly where they are in their launch prep
- Can see their blocked tasks and help unblock them
- Have FULL ACCESS to their Memory Vault - all their documents, brand templates, company profile, and strategic materials
- Understand their specific product, market positioning, competitors, and target audience from their company profile
- Remember previous conversations and decisions
- Can help create and organize their work
- Can reference specific documents and materials from their vault when giving advice

## Launch Readiness Framework
When assessing readiness, consider:
- **Technical**: Core functionality, error handling, monitoring, security
- **Testing**: Internal testing, beta feedback, load testing
- **Operational**: Pricing, payments, support, legal
- **Outreach**: Marketing assets, press kit, social content, email lists
- **Fundraising**: Deck, data room, investor list (if applicable)

## Key Principles
1. "Done is better than perfect" - help them ship
2. "Build in public" - encourage transparency and momentum
3. "Talk to users" - validate before building more
4. "One thing at a time" - prevent context switching
5. "Celebrate small wins" - maintain motivation

Remember: You're not here to do the work for them. You're here to help them figure out what work to do, in what order, and to keep them accountable.`

export async function POST(request: NextRequest) {
  try {
    const body: FounderAdvisorRequest = await request.json()
    const { message, context, history } = body

    // Fetch additional Memory Vault context if we have an organization ID
    let memoryVaultContext: any = null
    if (context.organizationId) {
      memoryVaultContext = await fetchMemoryVaultContext(context.organizationId)
    }

    // Check if user is asking about a presentation
    const messageLower = message.toLowerCase()
    const isPresentationQuery = PRESENTATION_KEYWORDS.some(kw => messageLower.includes(kw))

    // Find any PPTX files in vault if this is a presentation query
    let presentationImages: { base64: string; mediaType: string }[] = []
    let presentationTitle = ''

    if (isPresentationQuery && context.organizationId) {
      const pptxFile = await findPresentationFile(context.organizationId)
      if (pptxFile) {
        presentationTitle = pptxFile.title
        console.log(`📊 Found presentation: ${presentationTitle}, extracting images...`)
        presentationImages = await extractPresentationImages(pptxFile.file_url)
        console.log(`📷 Extracted ${presentationImages.length} images from presentation`)
      }
    }

    // Build rich context string
    const contextString = buildFounderContext(context, memoryVaultContext)

    // Build conversation messages
    const messages: Anthropic.MessageParam[] = []

    // Add history
    for (const msg of history || []) {
      messages.push({
        role: msg.role,
        content: msg.content
      })
    }

    // Build the user message content
    if (presentationImages.length > 0) {
      // Use multimodal message with images
      const messageContent: Anthropic.ContentBlockParam[] = [
        {
          type: 'text',
          text: `${contextString}\n\n---\n\nFOUNDER'S MESSAGE:\n${message}\n\n[I'm including ${presentationImages.length} images from the presentation "${presentationTitle}" for you to analyze visually]`
        }
      ]

      // Add presentation images (limit to 8 to avoid token limits)
      for (const img of presentationImages.slice(0, 8)) {
        messageContent.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: img.mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
            data: img.base64
          }
        })
      }

      messages.push({
        role: 'user',
        content: messageContent
      })
    } else {
      // Text-only message
      messages.push({
        role: 'user',
        content: `${contextString}\n\n---\n\nFOUNDER'S MESSAGE:\n${message}`
      })
    }

    // Call Claude (with potentially multimodal content)
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: presentationImages.length > 0 ? 4096 : 2048,
      system: FOUNDER_ADVISOR_SYSTEM_PROMPT,
      messages
    })

    // Extract text response
    const textContent = response.content.find(c => c.type === 'text')
    const responseText = textContent ? textContent.text : 'I apologize, I was unable to generate a response.'

    // Parse any suggested tasks from the response
    const suggestedTasks = parseTaskSuggestions(responseText)

    return NextResponse.json({
      response: responseText,
      suggestedTasks,
      usage: response.usage
    })

  } catch (error) {
    console.error('Founder advisor error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Error details:', errorMessage)

    return NextResponse.json(
      {
        error: 'Failed to process request',
        details: errorMessage,
        response: `I encountered an error processing your request. Error: ${errorMessage}. Please try again.`
      },
      { status: 500 }
    )
  }
}

async function findPresentationFile(organizationId: string) {
  try {
    const { data } = await supabase
      .from('content_library')
      .select('id, title, file_url, metadata')
      .eq('organization_id', organizationId)
      .or('content_type.eq.presentation,title.ilike.%.pptx')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    return data
  } catch {
    return null
  }
}

async function extractPresentationImages(fileUrl: string): Promise<{ base64: string; mediaType: string }[]> {
  const images: { base64: string; mediaType: string }[] = []

  try {
    const response = await fetch(fileUrl)
    if (!response.ok) return images

    const arrayBuffer = await response.arrayBuffer()
    const zip = await JSZip.loadAsync(arrayBuffer)

    // Extract images from ppt/media/
    const mediaFiles = Object.keys(zip.files).filter(name =>
      name.startsWith('ppt/media/') && !name.endsWith('/')
    )

    for (const fileName of mediaFiles) {
      const file = zip.files[fileName]
      if (file && !file.dir) {
        const ext = fileName.split('.').pop()?.toLowerCase() || 'png'

        // Only include actual images
        if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) {
          const content = await file.async('base64')
          const mediaType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`
          images.push({ base64: content, mediaType })
        }
      }
    }
  } catch (error) {
    console.error('Error extracting presentation images:', error)
  }

  return images
}

async function fetchMemoryVaultContext(organizationId: string) {
  try {
    // Fetch company profile/organization details
    const { data: orgData } = await supabase
      .from('organizations')
      .select('name, industry, company_profile, schema_data')
      .eq('id', organizationId)
      .single()

    // Fetch diverse Memory Vault items - get different content types
    // Don't just get most recent, get a mix
    const { data: vaultData } = await supabase
      .from('content_library')
      .select('id, title, content_type, folder, content, metadata')
      .eq('organization_id', organizationId)
      .not('content_type', 'eq', 'phase_strategy') // Skip internal strategy docs
      .order('created_at', { ascending: false })
      .limit(30)

    // Group by content_type and get a diverse sample
    const byType: Record<string, any[]> = {}
    const diverseItems: any[] = []

    for (const item of (vaultData || [])) {
      const type = item.content_type || 'other'
      if (!byType[type]) byType[type] = []
      byType[type].push(item)
    }

    // Take up to 3 from each type for diversity
    Object.values(byType).forEach(items => {
      diverseItems.push(...items.slice(0, 3))
    })

    // Fetch any brand templates
    const { data: templates } = await supabase
      .from('content_library')
      .select('id, title, content, metadata')
      .eq('organization_id', organizationId)
      .eq('content_type', 'brand_template')
      .limit(5)

    console.log(`📚 Fetched ${diverseItems.length} vault items, ${templates?.length || 0} templates for org ${organizationId}`)

    return {
      organization: orgData,
      vaultItems: diverseItems,
      brandTemplates: templates || []
    }
  } catch (error) {
    console.error('Error fetching memory vault context:', error)
    return null
  }
}

function buildFounderContext(context: FounderAdvisorRequest['context'], memoryVaultContext?: any): string {
  const { tasks, executiveSynthesis, organizationName, taskStats, companyProfile, vaultItems, selectedCategory } = context
  const parts: string[] = []

  // Current date context
  const today = new Date()
  parts.push(`## Current Date: ${today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`)
  parts.push(`## Organization: ${organizationName}`)

  // Company Profile from Memory Vault
  const orgProfile = memoryVaultContext?.organization || companyProfile
  if (orgProfile) {
    parts.push(`\n## Company Profile`)
    if (orgProfile.industry) parts.push(`- Industry: ${orgProfile.industry}`)
    if (orgProfile.company_profile) {
      const profile = orgProfile.company_profile
      if (profile.description) parts.push(`- Description: ${profile.description}`)
      if (profile.mission) parts.push(`- Mission: ${profile.mission}`)
      if (profile.target_audience) parts.push(`- Target Audience: ${profile.target_audience}`)
      if (profile.value_proposition) parts.push(`- Value Proposition: ${profile.value_proposition}`)
      if (profile.key_differentiators) parts.push(`- Key Differentiators: ${Array.isArray(profile.key_differentiators) ? profile.key_differentiators.join(', ') : profile.key_differentiators}`)
      if (profile.competitors) parts.push(`- Known Competitors: ${Array.isArray(profile.competitors) ? profile.competitors.join(', ') : profile.competitors}`)
    }
    if (orgProfile.schema_data) {
      const schema = orgProfile.schema_data
      if (schema['@type']) parts.push(`- Business Type: ${schema['@type']}`)
      if (schema.description) parts.push(`- Schema Description: ${schema.description}`)
    }
  }

  // Current focus area
  if (selectedCategory && selectedCategory !== 'home') {
    parts.push(`\n## Current Focus: ${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}`)
  }

  // Task Overview
  parts.push(`\n## Launch Progress Overview`)
  parts.push(`- Total Tasks: ${taskStats.total}`)
  parts.push(`- Completed: ${taskStats.done} (${taskStats.total > 0 ? Math.round((taskStats.done / taskStats.total) * 100) : 0}%)`)
  parts.push(`- In Progress: ${taskStats.inProgress}`)
  parts.push(`- To Do: ${taskStats.todo}`)
  if (taskStats.blocked > 0) {
    parts.push(`- **BLOCKED: ${taskStats.blocked}** (needs attention!)`)
  }

  // Progress by category
  parts.push(`\n## Progress by Category`)
  Object.entries(taskStats.byCategory).forEach(([cat, stats]) => {
    if (stats.total > 0) {
      const percent = Math.round((stats.done / stats.total) * 100)
      const bar = getProgressBar(percent)
      parts.push(`- ${cat}: ${bar} ${percent}% (${stats.done}/${stats.total})`)
    }
  })

  // Active/Blocked Tasks (most important for context)
  const blockedTasks = tasks.filter(t => t.status === 'blocked')
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress')
  const highPriorityTodo = tasks.filter(t => t.status === 'todo' && (t.priority === 'critical' || t.priority === 'high'))

  if (blockedTasks.length > 0) {
    parts.push(`\n## BLOCKED TASKS (need unblocking)`)
    blockedTasks.forEach(t => {
      parts.push(`- [${t.priority.toUpperCase()}] ${t.title} (${t.category})`)
    })
  }

  if (inProgressTasks.length > 0) {
    parts.push(`\n## Currently In Progress`)
    inProgressTasks.forEach(t => {
      parts.push(`- [${t.priority.toUpperCase()}] ${t.title} (${t.category})`)
    })
  }

  if (highPriorityTodo.length > 0) {
    parts.push(`\n## High Priority To-Do`)
    highPriorityTodo.slice(0, 5).forEach(t => {
      parts.push(`- [${t.priority.toUpperCase()}] ${t.title} (${t.category})`)
    })
  }

  // Recent completions (for encouragement/context)
  const recentlyCompleted = tasks.filter(t => t.status === 'done').slice(0, 3)
  if (recentlyCompleted.length > 0) {
    parts.push(`\n## Recently Completed`)
    recentlyCompleted.forEach(t => {
      parts.push(`- ${t.title}`)
    })
  }

  // Executive synthesis highlights (market context)
  if (executiveSynthesis) {
    parts.push(`\n## Market Intelligence Highlights`)
    if (executiveSynthesis.executive_summary) {
      const summary = typeof executiveSynthesis.executive_summary === 'string'
        ? executiveSynthesis.executive_summary.substring(0, 500)
        : JSON.stringify(executiveSynthesis.executive_summary).substring(0, 500)
      parts.push(summary)
    }
    if (executiveSynthesis.immediate_actions?.length > 0) {
      parts.push(`\nStrategic Actions Suggested:`)
      executiveSynthesis.immediate_actions.slice(0, 3).forEach((action: string) => {
        parts.push(`- ${action}`)
      })
    }
  }

  // Memory Vault Content
  const allVaultItems = memoryVaultContext?.vaultItems || vaultItems || []
  if (allVaultItems.length > 0) {
    parts.push(`\n## Memory Vault Contents (${allVaultItems.length} items)`)

    // Group by folder/type for cleaner output
    const byFolder: Record<string, any[]> = {}
    allVaultItems.forEach((item: any) => {
      const folder = item.folder || 'General'
      if (!byFolder[folder]) byFolder[folder] = []
      byFolder[folder].push(item)
    })

    Object.entries(byFolder).forEach(([folder, items]) => {
      parts.push(`\n### ${folder}`)
      items.slice(0, 5).forEach((item: any) => {
        parts.push(`- **${item.title}** (${item.content_type})`)
        // Include brief content preview for context
        if (item.content && typeof item.content === 'string') {
          const preview = item.content.substring(0, 200).replace(/\n/g, ' ')
          if (preview.length > 0) {
            parts.push(`  Preview: ${preview}...`)
          }
        }
      })
    })
  }

  // Brand Templates
  const brandTemplates = memoryVaultContext?.brandTemplates || []
  if (brandTemplates.length > 0) {
    parts.push(`\n## Brand Templates Available`)
    brandTemplates.forEach((template: any) => {
      parts.push(`- ${template.title}`)
    })
  }

  return parts.join('\n')
}

function getProgressBar(percent: number): string {
  const filled = Math.round(percent / 10)
  const empty = 10 - filled
  return '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']'
}

interface ExecutableTask {
  title: string
  category: string
  priority: string
  description?: string
  execution_type?: 'manual' | 'content' | 'research' | 'presentation' | 'outreach' | 'campaign'
  execution_context?: {
    prompt?: string
    contentType?: string
    targetAudience?: string
    [key: string]: any
  }
}

function parseTaskSuggestions(response: string): ExecutableTask[] {
  const tasks: ExecutableTask[] = []

  console.log('🔍 Parsing tasks from response length:', response.length)

  // Method 1: Look for ```task JSON blocks (new format)
  // More lenient pattern - handles various whitespace and newlines
  const jsonTaskPattern = /```task\s*\n?([\s\S]*?)\n?```/gi
  let jsonMatch

  while ((jsonMatch = jsonTaskPattern.exec(response)) !== null) {
    console.log('📋 Found task block:', jsonMatch[1].substring(0, 100))
    try {
      const taskJson = JSON.parse(jsonMatch[1].trim())
      console.log('✅ Parsed task:', taskJson.title)
      if (taskJson.title) {
        tasks.push({
          title: taskJson.title,
          category: taskJson.category || 'launch',
          priority: taskJson.priority || 'medium',
          description: taskJson.description,
          execution_type: taskJson.execution_type || 'manual',
          execution_context: taskJson.execution_context || {}
        })
      }
    } catch (e) {
      console.error('❌ Failed to parse task JSON:', e, 'Raw:', jsonMatch[1].substring(0, 200))
    }
  }

  // Method 2: Try finding JSON objects that look like tasks (backup)
  if (tasks.length === 0) {
    // Look for JSON blocks with "title" and "execution_type" anywhere in response
    const jsonObjectPattern = /\{[^{}]*"title"\s*:\s*"[^"]+?"[^{}]*"execution_type"\s*:\s*"[^"]+?"[^{}]*\}/g
    let objMatch
    while ((objMatch = jsonObjectPattern.exec(response)) !== null) {
      try {
        const taskJson = JSON.parse(objMatch[0])
        if (taskJson.title) {
          console.log('✅ Found inline task JSON:', taskJson.title)
          tasks.push({
            title: taskJson.title,
            category: taskJson.category || 'launch',
            priority: taskJson.priority || 'medium',
            description: taskJson.description,
            execution_type: taskJson.execution_type || 'manual',
            execution_context: taskJson.execution_context || {}
          })
        }
      } catch (e) {
        // Not valid JSON, skip
      }
    }
  }

  // Method 3: Fallback to **[TASK]** pattern (legacy format)
  if (tasks.length === 0) {
    const taskPattern = /\*\*\[TASK\]\*\*\s*([^(]+)\s*\(category:\s*(\w+),\s*priority:\s*(\w+)\)/gi
    let match

    while ((match = taskPattern.exec(response)) !== null) {
      tasks.push({
        title: match[1].trim(),
        category: match[2].toLowerCase(),
        priority: match[3].toLowerCase(),
        execution_type: 'manual'
      })
    }
  }

  console.log('📊 Total tasks parsed:', tasks.length)
  return tasks
}
