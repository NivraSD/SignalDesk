import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { NIV_CONTENT_SYSTEM_PROMPT } from './system-prompt.ts'
import {
  decomposeQuery,
  orchestrateResearch,
  type ResearchPlan
} from './self-orchestration.ts'
import {
  synthesizeConversationContext,
  requiresConversationSynthesis,
  formatSynthesisForPresentation,
  type ConversationSynthesis
} from './conversation-synthesizer.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

// Tool definitions for Claude
const CONTENT_GENERATION_TOOLS = [
  {
    name: "generate_image",
    description: "Generate an image using Vertex AI. Use this when user requests a single image (e.g., 'create an image of...', 'I need a visual showing...'). This is for SIMPLE single-image requests, not multi-piece campaigns.",
    input_schema: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "Detailed description of the image to generate"
        },
        style: {
          type: "string",
          description: "Visual style (photorealistic, illustrated, minimalist, etc.)",
          default: "photorealistic"
        }
      },
      required: ["prompt"]
    }
  },
  {
    name: "generate_social_post",
    description: "Generate a social media post. Use this for SIMPLE single-post requests (e.g., 'write a LinkedIn post about...', 'create a tweet for...'). Not for full social campaigns.",
    input_schema: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          description: "What the post is about"
        },
        platform: {
          type: "string",
          description: "Social platform (linkedin, twitter, instagram)",
          default: "linkedin"
        },
        tone: {
          type: "string",
          description: "Tone of the post (professional, casual, engaging)"
        }
      },
      required: ["topic"]
    }
  },
  {
    name: "generate_press_release",
    description: "Generate a press release. Use this for SIMPLE press release requests, not full media plans.",
    input_schema: {
      type: "object",
      properties: {
        announcement: {
          type: "string",
          description: "What is being announced"
        },
        key_points: {
          type: "array",
          items: { type: "string" },
          description: "Key points to include"
        }
      },
      required: ["announcement"]
    }
  },
  {
    name: "generate_blog_post",
    description: "Generate a blog post. Use this for SIMPLE blog post requests.",
    input_schema: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          description: "Blog post topic"
        },
        angle: {
          type: "string",
          description: "Angle or focus"
        }
      },
      required: ["topic"]
    }
  },
  {
    name: "create_presentation_outline",
    description: "Create a detailed presentation outline for user review BEFORE generating with Gamma. Use this when user requests a presentation. This creates a structured outline with sections, key points, and visual suggestions that the user can review and refine.",
    input_schema: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          description: "Main presentation topic"
        },
        audience: {
          type: "string",
          description: "Target audience (executives, customers, technical team, investors, etc.)"
        },
        purpose: {
          type: "string",
          description: "Presentation purpose (pitch, update, education, sales, etc.)"
        },
        key_messages: {
          type: "array",
          items: { type: "string" },
          description: "3-5 key messages to convey"
        },
        slide_count: {
          type: "number",
          description: "Approximate number of slides desired",
          default: 10
        },
        sections: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              talking_points: { type: "array", items: { type: "string" } },
              visual_suggestion: { type: "string" }
            }
          },
          description: "Detailed outline sections with talking points and visual suggestions"
        }
      },
      required: ["topic", "audience", "purpose", "key_messages", "sections"]
    }
  },
  {
    name: "generate_presentation",
    description: "Generate a presentation using Gamma based on an APPROVED outline. ONLY use this after the user has reviewed and approved the presentation outline created by create_presentation_outline. Do NOT use this if they haven't seen/approved the outline yet.",
    input_schema: {
      type: "object",
      properties: {
        approved_outline: {
          type: "object",
          description: "The complete approved presentation outline",
          properties: {
            topic: { type: "string" },
            audience: { type: "string" },
            purpose: { type: "string" },
            key_messages: { type: "array", items: { type: "string" } },
            sections: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  talking_points: { type: "array", items: { type: "string" } },
                  visual_suggestion: { type: "string" }
                }
              }
            }
          },
          required: ["topic", "audience", "purpose", "key_messages", "sections"]
        }
      },
      required: ["approved_outline"]
    }
  },
  {
    name: "generate_media_list",
    description: "Generate a media/journalist contact list with names, outlets, and contact information. ALWAYS use this tool when user asks for: 'media list', 'journalist list', 'reporter list', 'media contacts', 'journalists', 'reporters', 'PR contacts'. This queries a verified database of 149+ real journalists across 18 industries and fills gaps automatically if needed.",
    input_schema: {
      type: "object",
      properties: {
        focus_area: {
          type: "string",
          description: "Topic/industry focus (e.g., 'AI', 'technology', 'fintech', 'healthcare', 'crypto', 'space')"
        },
        tier: {
          type: "string",
          description: "Tier level (e.g., 'tier 1', 'tier 2', 'all tiers')",
          default: "tier 1"
        },
        count: {
          type: "number",
          description: "Number of journalists to include",
          default: 10
        }
      },
      required: ["focus_area"]
    }
  },
  {
    name: "generate_thought_leadership",
    description: "Generate thought leadership article. Use for opinion pieces, trend analysis, and executive perspectives.",
    input_schema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "Main topic or theme" },
        angle: { type: "string", description: "Unique angle or perspective" }
      },
      required: ["topic"]
    }
  },
  {
    name: "generate_case_study",
    description: "Generate customer case study or success story.",
    input_schema: {
      type: "object",
      properties: {
        customer: { type: "string", description: "Customer/client name" },
        challenge: { type: "string", description: "Problem they faced" },
        solution: { type: "string", description: "How you helped" }
      },
      required: ["customer", "challenge", "solution"]
    }
  },
  {
    name: "generate_white_paper",
    description: "Generate technical white paper or research document.",
    input_schema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "White paper topic" },
        key_points: { type: "array", items: { type: "string" }, description: "Main points to cover" }
      },
      required: ["topic"]
    }
  },
  {
    name: "generate_email_campaign",
    description: "Generate email campaign content.",
    input_schema: {
      type: "object",
      properties: {
        subject: { type: "string", description: "Email subject" },
        purpose: { type: "string", description: "Campaign purpose (announcement, newsletter, etc.)" }
      },
      required: ["subject", "purpose"]
    }
  },
  {
    name: "generate_qa_document",
    description: "Generate Q&A document or FAQ.",
    input_schema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "Topic for Q&A" },
        focus: { type: "string", description: "What to focus on" }
      },
      required: ["topic"]
    }
  },
  {
    name: "generate_talking_points",
    description: "Generate executive talking points or briefing.",
    input_schema: {
      type: "object",
      properties: {
        occasion: { type: "string", description: "Speaking occasion" },
        topic: { type: "string", description: "Main topic" }
      },
      required: ["occasion", "topic"]
    }
  },
  {
    name: "generate_executive_statement",
    description: "Generate executive statement or communication.",
    input_schema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "Statement topic" },
        tone: { type: "string", description: "Tone (confident, empathetic, etc.)", default: "confident" }
      },
      required: ["topic"]
    }
  },
  {
    name: "generate_media_pitch",
    description: "Generate personalized media pitch.",
    input_schema: {
      type: "object",
      properties: {
        story: { type: "string", description: "Story angle" },
        journalist: { type: "string", description: "Journalist name (optional)" }
      },
      required: ["story"]
    }
  },
  {
    name: "generate_ebook",
    description: "Generate eBook content with chapters and structure.",
    input_schema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "eBook topic" },
        chapters: { type: "array", items: { type: "string" }, description: "Chapter topics" }
      },
      required: ["topic"]
    }
  },
  {
    name: "generate_linkedin_article",
    description: "Generate LinkedIn article (long-form post).",
    input_schema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "Article topic" },
        tone: { type: "string", description: "Professional tone", default: "professional" }
      },
      required: ["topic"]
    }
  },
  {
    name: "generate_twitter_thread",
    description: "Generate Twitter/X thread with multiple tweets.",
    input_schema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "Thread topic" },
        tweet_count: { type: "number", description: "Number of tweets", default: 5 }
      },
      required: ["topic"]
    }
  },
  {
    name: "generate_instagram_caption",
    description: "Generate Instagram caption with hashtags only (no image).",
    input_schema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "Post topic" },
        style: { type: "string", description: "Caption style", default: "engaging" }
      },
      required: ["topic"]
    }
  },
  {
    name: "generate_instagram_post_with_image",
    description: "Generate a complete Instagram post package with both caption AND image. Use this when user requests an Instagram post (they typically need both text and visual). This tool creates the caption and automatically generates a matching image.",
    input_schema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "Post topic or announcement" },
        style: { type: "string", description: "Caption style", default: "engaging" },
        imageStyle: { type: "string", description: "Image style/aesthetic", default: "professional" }
      },
      required: ["topic"]
    }
  },
  {
    name: "generate_facebook_post",
    description: "Generate Facebook post.",
    input_schema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "Post topic" },
        tone: { type: "string", description: "Post tone", default: "friendly" }
      },
      required: ["topic"]
    }
  },
  {
    name: "generate_newsletter",
    description: "Generate newsletter content with sections.",
    input_schema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "Newsletter theme" },
        sections: { type: "array", items: { type: "string" }, description: "Section topics" }
      },
      required: ["topic"]
    }
  },
  {
    name: "generate_email_sequence",
    description: "Generate email drip sequence (multiple emails).",
    input_schema: {
      type: "object",
      properties: {
        campaign: { type: "string", description: "Campaign goal" },
        email_count: { type: "number", description: "Number of emails", default: 5 }
      },
      required: ["campaign"]
    }
  },
  {
    name: "generate_cold_outreach",
    description: "Generate cold outreach email.",
    input_schema: {
      type: "object",
      properties: {
        target: { type: "string", description: "Target audience" },
        offer: { type: "string", description: "What you're offering" }
      },
      required: ["target", "offer"]
    }
  },
  {
    name: "generate_crisis_response",
    description: "Generate crisis response or sensitive communication.",
    input_schema: {
      type: "object",
      properties: {
        situation: { type: "string", description: "Crisis situation" },
        tone: { type: "string", description: "Response tone", default: "empathetic" }
      },
      required: ["situation"]
    }
  },
  {
    name: "generate_apology_statement",
    description: "Generate apology or accountability statement.",
    input_schema: {
      type: "object",
      properties: {
        issue: { type: "string", description: "What went wrong" },
        actions: { type: "string", description: "Actions being taken" }
      },
      required: ["issue", "actions"]
    }
  },
  {
    name: "generate_investor_update",
    description: "Generate investor update or shareholder communication.",
    input_schema: {
      type: "object",
      properties: {
        period: { type: "string", description: "Time period (Q1, Q4, etc.)" },
        highlights: { type: "array", items: { type: "string" }, description: "Key highlights" }
      },
      required: ["period"]
    }
  },
  {
    name: "generate_board_presentation",
    description: "Generate board presentation or investor deck.",
    input_schema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "Presentation topic" },
        sections: { type: "array", items: { type: "string" }, description: "Key sections" }
      },
      required: ["topic"]
    }
  },
  {
    name: "generate_media_kit",
    description: "Generate media kit with company info and resources.",
    input_schema: {
      type: "object",
      properties: {
        focus: { type: "string", description: "Media kit focus" }
      },
      required: ["focus"]
    }
  },
  {
    name: "generate_podcast_pitch",
    description: "Generate podcast appearance pitch.",
    input_schema: {
      type: "object",
      properties: {
        podcast: { type: "string", description: "Podcast name" },
        topic: { type: "string", description: "Discussion topic" }
      },
      required: ["topic"]
    }
  },
  {
    name: "generate_tv_interview_prep",
    description: "Generate TV interview prep materials.",
    input_schema: {
      type: "object",
      properties: {
        show: { type: "string", description: "TV show name" },
        topics: { type: "array", items: { type: "string" }, description: "Expected topics" }
      },
      required: ["topics"]
    }
  },
  {
    name: "generate_infographic",
    description: "Generate infographic content and structure.",
    input_schema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "Infographic topic" },
        data_points: { type: "array", items: { type: "string" }, description: "Key data to visualize" }
      },
      required: ["topic"]
    }
  },
  {
    name: "generate_social_graphics",
    description: "Generate social media graphic descriptions.",
    input_schema: {
      type: "object",
      properties: {
        message: { type: "string", description: "Key message" },
        platform: { type: "string", description: "Social platform" }
      },
      required: ["message"]
    }
  },
  {
    name: "generate_video_script",
    description: "Generate video script or screenplay.",
    input_schema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "Video topic" },
        duration: { type: "string", description: "Target duration", default: "2-3 minutes" }
      },
      required: ["topic"]
    }
  },
  {
    name: "generate_messaging_framework",
    description: "Generate messaging framework or positioning document.",
    input_schema: {
      type: "object",
      properties: {
        product: { type: "string", description: "Product/service name" },
        audience: { type: "string", description: "Target audience" }
      },
      required: ["product", "audience"]
    }
  },
  {
    name: "generate_brand_narrative",
    description: "Generate brand narrative or story.",
    input_schema: {
      type: "object",
      properties: {
        brand: { type: "string", description: "Brand name" },
        values: { type: "array", items: { type: "string" }, description: "Core values" }
      },
      required: ["brand"]
    }
  },
  {
    name: "generate_value_proposition",
    description: "Generate value proposition statement.",
    input_schema: {
      type: "object",
      properties: {
        offering: { type: "string", description: "What you offer" },
        benefit: { type: "string", description: "Core benefit" }
      },
      required: ["offering", "benefit"]
    }
  },
  {
    name: "generate_competitive_positioning",
    description: "Generate competitive positioning analysis.",
    input_schema: {
      type: "object",
      properties: {
        product: { type: "string", description: "Your product" },
        competitors: { type: "array", items: { type: "string" }, description: "Competitors" }
      },
      required: ["product"]
    }
  },
  {
    name: "create_strategy_document",
    description: "Create a strategic media plan document after user has chosen an approach. Use this for COMPLEX media plan/campaign requests that need strategy. This document outlines the complete strategy. The user will review and approve this strategy document first.",
    input_schema: {
      type: "object",
      properties: {
        subject: {
          type: "string",
          description: "What is being announced/launched"
        },
        chosen_approach: {
          type: "string",
          description: "The strategic approach the user selected (e.g., 'Developer-First Strategy', 'Platform Evolution Story')"
        },
        target_audiences: {
          type: "array",
          items: { type: "string" },
          description: "Primary audiences to target"
        },
        narrative: {
          type: "string",
          description: "Core narrative/positioning"
        },
        key_messages: {
          type: "array",
          items: { type: "string" },
          description: "3-5 key messages to emphasize"
        },
        media_targets: {
          type: "array",
          items: { type: "string" },
          description: "Specific media outlets and journalists to target"
        },
        timeline: {
          type: "string",
          description: "Recommended timeline for execution (e.g., '2 weeks pre-launch to 1 month post')"
        },
        tactical_recommendations: {
          type: "array",
          items: { type: "string" },
          description: "Specific tactical recommendations"
        }
      },
      required: ["subject", "chosen_approach", "target_audiences", "narrative", "key_messages"]
    }
  },
  {
    name: "generate_media_plan",
    description: "Generate the 7 tactical content pieces (press release, media pitch, media list, Q&A doc, talking points, social post, email) based on an approved strategy. ONLY use this after the user has approved the strategy document. Do NOT use this if they haven't seen/approved the strategy yet.",
    input_schema: {
      type: "object",
      properties: {
        approved_strategy: {
          type: "object",
          description: "The complete approved strategy document",
          properties: {
            subject: { type: "string" },
            narrative: { type: "string" },
            target_audiences: { type: "array", items: { type: "string" } },
            key_messages: { type: "array", items: { type: "string" } },
            media_targets: { type: "array", items: { type: "string" } },
            timeline: { type: "string" }
          },
          required: ["subject", "narrative", "target_audiences", "key_messages"]
        }
      },
      required: ["approved_strategy"]
    }
  },
  {
    name: "search_memory_vault",
    description: "Search Memory Vault for templates, examples, or past content that can guide current content generation. Use this to find proven successful patterns, templates, or examples when generating content. Memory Vault uses AI-powered composite scoring to prioritize proven successful content over generic matches.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "What you're looking for (e.g., 'press release for product launch', 'social post about AI', 'thought leadership on sustainability')"
        },
        content_type: {
          type: "string",
          description: "Type of content to search for (press-release, social-post, thought-leadership, media-pitch, etc.)"
        },
        limit: {
          type: "number",
          description: "Number of results to return (default 3, max 10)",
          default: 3
        }
      },
      required: ["query"]
    }
  },
  {
    name: "generate_content_package",
    description: "Generate multiple content pieces at once as a coordinated package. Use this when the user requests multiple deliverables (e.g., 'create a pitch deck, press release, and social posts'). This tool will generate all requested pieces based on the approved strategy or context.",
    input_schema: {
      type: "object",
      properties: {
        content_types: {
          type: "array",
          description: "List of content types to generate. Each item should be one of: presentation, press-release, social-posts, media-pitch, talking-points, qa-document, event-brief, influencer-brief, one-pager, executive-summary",
          items: { type: "string" }
        },
        context: {
          type: "object",
          description: "The context/strategy for generating all content pieces",
          properties: {
            topic: { type: "string" },
            audience: { type: "string" },
            purpose: { type: "string" },
            key_messages: { type: "array", items: { type: "string" } },
            narrative: { type: "string" }
          }
        },
        details: {
          type: "object",
          description: "Specific details for each content type (e.g., slide count for presentation, number of posts for social)",
          additionalProperties: true
        }
      },
      required: ["content_types", "context"]
    }
  }
]

// Conversation State Tracking (like niv-orchestrator-robust)
interface ConversationState {
  conversationId: string
  stage: 'understanding' | 'research' | 'strategy' | 'strategy_review' | 'generation' | 'complete'
  understanding?: any
  researchResults?: any
  strategyChosen?: string
  approvedStrategy?: any  // The full strategy document after user approves
  userPreferences: {
    wants: string[]
    doesNotWant: string[]
    examples: string[]
    constraints: string[]
  }
  fullConversation: Array<{role: string, content: string, timestamp: Date}>
  lastUpdate: number
}

// Store conversation states in memory
const conversationStates = new Map<string, ConversationState>()

// Get or create conversation state
function getConversationState(conversationId: string): ConversationState {
  if (!conversationStates.has(conversationId)) {
    conversationStates.set(conversationId, {
      conversationId,
      stage: 'understanding',
      userPreferences: {
        wants: [],
        doesNotWant: [],
        examples: [],
        constraints: []
      },
      fullConversation: [],
      lastUpdate: Date.now()
    })
  }
  return conversationStates.get(conversationId)!
}

// Retry wrapper for failed operations
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 2,
  delayMs: number = 2000
): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')

      if (attempt < maxRetries) {
        console.log(`⚠️ Attempt ${attempt} failed, retrying in ${delayMs}ms... (${lastError.message})`)
        await new Promise(resolve => setTimeout(resolve, delayMs))
      }
    }
  }

  throw lastError
}

// Batch promises into groups to avoid overwhelming Claude API
async function batchPromises<T>(
  items: any[],
  batchSize: number,
  processFn: (item: any) => Promise<T>
): Promise<T[]> {
  const results: T[] = []

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(items.length / batchSize)} (${batch.length} items)`)

    const batchResults = await Promise.all(batch.map(processFn))
    results.push(...batchResults)

    // Small delay between batches to avoid rate limits
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  return results
}

// Update conversation state
function updateConversationState(
  conversationId: string,
  message: string,
  role: 'user' | 'assistant',
  understanding?: any,
  researchResults?: any
): ConversationState {
  const state = getConversationState(conversationId)

  // Store conversation with limit
  state.fullConversation.push({
    role,
    content: message,
    timestamp: new Date()
  })

  if (state.fullConversation.length > 20) {
    state.fullConversation = state.fullConversation.slice(-20)
  }

  // Extract user preferences
  if (role === 'user' && message) {
    const lower = message.toLowerCase()

    if (lower.includes('want to') || lower.includes('need to')) {
      const match = message.match(/(want to|need to)\s+([^.,;]+)/i)
      if (match) state.userPreferences.wants.push(match[2].trim())
    }

    if (lower.includes("don't want") || lower.includes("avoid")) {
      state.userPreferences.doesNotWant.push(message)
    }

    if (lower.includes('like') || lower.includes('example')) {
      state.userPreferences.examples.push(message)
    }

    if (lower.includes('budget') || lower.includes('deadline') || lower.includes('constraint')) {
      state.userPreferences.constraints.push(message)
    }
  }

  // Update understanding and research
  if (understanding) {
    state.understanding = understanding
  }
  if (researchResults) {
    state.researchResults = researchResults
  }

  state.lastUpdate = Date.now()
  return state
}

serve(async (req) => {
  // ALWAYS return CORS headers, even on crashes
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestBody = await req.json()
    const {
      message,
      conversationHistory = [],
      organizationContext,
      stage = 'full',
      campaignContext, // For campaign generation mode
      // Auto-execute mode params
      preloadedStrategy,
      requestedContentType,
      autoExecute,
      saveFolder
    } = requestBody

    const conversationId = organizationContext?.conversationId || `conv-${Date.now()}`
    const organizationId = organizationContext?.organizationId || 'OpenAI'
    const organizationName = organizationContext?.organizationName || organizationId

    // 🎯 AUTO-DETECTION: Detect when request should use campaign_generation mode
    let effectiveStage = stage
    const messageUpper = (message || '').toUpperCase()

    // Detect blueprint execution markers
    const isBlueprintExecution =
      messageUpper.includes('CONTENT GENERATION FROM APPROVED BLUEPRINT') ||
      messageUpper.includes('BLUEPRINT EXECUTION') ||
      messageUpper.includes('EXECUTING FROM APPROVED') ||
      messageUpper.includes('YOUR JOB IS TO GENERATE') ||
      (messageUpper.includes('APPROVED') && messageUpper.includes('GENERATE THE ACTUAL'))

    // Detect if campaignContext is provided - strong signal for campaign_generation mode
    const hasCampaignContext = !!campaignContext

    // Auto-route to campaign_generation if:
    // 1. Message contains blueprint execution markers, OR
    // 2. campaignContext is provided (regardless of stage parameter)
    if ((isBlueprintExecution || hasCampaignContext) && effectiveStage !== 'acknowledge') {
      console.log('🔄 AUTO-DETECTION: Routing to campaign_generation mode')
      console.log(`   Reason: ${isBlueprintExecution ? 'Blueprint execution markers detected' : 'campaignContext provided'}`)
      effectiveStage = 'campaign_generation'
    }

    console.log(`🎯 NIV Content: ${message.substring(0, 100)}... Stage: ${effectiveStage}${effectiveStage !== stage ? ` (auto-detected from: ${stage})` : ''}`)

    // Get or create conversation state
    const conversationState = getConversationState(conversationId)

    // Handle auto-execute mode (called from framework-auto-execute)
    if (autoExecute && preloadedStrategy && requestedContentType) {
      console.log(`⚡ Auto-execute mode: Generating ${requestedContentType}`)

      try {
        // Set up conversation state with pre-loaded strategy
        conversationState.approvedStrategy = preloadedStrategy
        conversationState.strategyChosen = preloadedStrategy.chosen_approach || 'framework-based'
        conversationState.stage = 'generation'

        // Generate content immediately using MCP service
        const content = await callMCPService(requestedContentType, {
          organization: organizationName,
          subject: preloadedStrategy.subject,
          narrative: preloadedStrategy.narrative,
          keyPoints: preloadedStrategy.key_messages,
          targetAudiences: preloadedStrategy.target_audiences,
          mediaTargets: preloadedStrategy.media_targets,
          timeline: preloadedStrategy.timeline,
          strategy: preloadedStrategy.chosen_approach
        })

        // Save to folder if specified
        if (saveFolder && content) {
          const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
          )

          await supabase.from('content_library').insert({
            id: crypto.randomUUID(),
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

          console.log(`💾 Auto-generated ${requestedContentType} saved to ${saveFolder}`)
        }

        return new Response(JSON.stringify({
          success: true,
          content: content,
          savedTo: saveFolder,
          conversationId
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      } catch (error: any) {
        console.error(`❌ Auto-execute error for ${requestedContentType}:`, error)
        return new Response(JSON.stringify({
          success: false,
          error: error.message,
          conversationId
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }
    console.log(`📊 Conversation State: ${conversationState.stage}`)

    // Get organization profile
    const orgProfile = await getOrgProfile(organizationId, organizationName)
    console.log('✅ Org:', orgProfile.organizationName)

    // Update conversation state with user message
    updateConversationState(conversationId, message, 'user')

    // ACKNOWLEDGE STAGE - Natural acknowledgment like orchestrator-robust
    if (effectiveStage === 'acknowledge') {
      console.log('🧠 Acknowledge stage: Quick understanding...')

      // Get Claude's understanding for better acknowledgment
      const understanding = await getClaudeUnderstanding(message, conversationHistory, orgProfile)
      const acknowledgment = understanding.acknowledgment || await getQuickAcknowledgment(message, orgProfile)

      console.log('✅ Understanding:', understanding.understanding)

      return new Response(JSON.stringify({
        success: true,
        message: acknowledgment,
        understanding: understanding.understanding
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // GENERATE PRESENTATION DIRECT - Button-triggered generation with stored outline
    if (effectiveStage === 'generate_presentation_direct') {
      console.log('🎨 Direct presentation generation triggered from button')
      const presentationOutline = requestBody.presentationOutline

      if (!presentationOutline) {
        console.error('❌ No presentation outline provided')
        return new Response(JSON.stringify({
          success: false,
          error: 'No presentation outline provided'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Update conversation state
      conversationState.stage = 'generation'
      conversationState.approvedStrategy = presentationOutline

      const outline = presentationOutline
      const currentDate = new Date().toISOString().split('T')[0]
      const currentYear = new Date().getFullYear()

      // Get research data if available
      const researchData = conversationState.researchResults
      let researchSection = ''

      if (researchData && (researchData.keyFindings?.length > 0 || researchData.synthesis)) {
        researchSection = `\n**CRITICAL: Use this research data in your presentation:**\n\n`
        if (researchData.synthesis) {
          researchSection += `**Overview:** ${researchData.synthesis}\n\n`
        }
        if (researchData.keyFindings && researchData.keyFindings.length > 0) {
          researchSection += `**Key Facts & Data Points (incorporate these into slides):**\n`
          researchData.keyFindings.forEach((finding: string, i: number) => {
            researchSection += `${i + 1}. ${finding}\n`
          })
          researchSection += '\n'
        }
        researchSection += `**INSTRUCTION:** Integrate the above facts, statistics, and insights throughout the presentation. Use specific data points to support key messages. Make the presentation data-driven and credible.\n\n`
      }

      const gammaPrompt = `**CURRENT DATE: ${currentDate}**
**CURRENT YEAR: ${currentYear}**

IMPORTANT: This presentation is being created in ${currentYear}. Use current data and avoid referencing outdated information from before 2024.
${researchSection}
Create a ${outline.slide_count || 10}-slide presentation on "${outline.topic}" for ${outline.audience}.

Purpose: ${outline.purpose}

Key Messages:
${outline.key_messages.map((m: string, i: number) => `${i + 1}. ${m}`).join('\n')}

Slide Structure:
${outline.sections.map((section: any, i: number) => `
Slide ${i + 1}: ${section.title}
Content: ${section.talking_points.join('; ')}
Visual: ${section.visual_suggestion}
`).join('\n')}

Style: Professional, clean design with visuals supporting each key point. Use specific data and facts from the research provided above.

REMINDER: Current date is ${currentDate}. Ensure all data references and examples are from 2024-${currentYear}. Incorporate the research findings listed above into relevant slides.`

      console.log('📊 Built Gamma prompt for direct generation')

      try {
        // Create folder path for Memory Vault capture
        const timestamp = new Date().toISOString().split('T')[0]
        const cleanTitle = outline.topic.replace(/[^a-zA-Z0-9\s-]/g, '').substring(0, 50)
        const folderPath = `NIV Content/${cleanTitle} - ${timestamp}`

        const requestBody = {
          title: outline.topic,
          topic: outline.topic,
          content: gammaPrompt,
          format: 'presentation',
          slideCount: outline.slide_count || 10,
          options: {
            audience: outline.audience,
            tone: outline.purpose
          },
          capture: true,
          organization_id: organizationId,
          campaign_id: null,
          campaign_folder: folderPath  // Save to Memory Vault under NIV Content folder
        }

        console.log(`📁 Gamma will save to Memory Vault: ${folderPath}`)

        console.log('📤 Sending to Gamma:', {
          title: requestBody.title,
          slideCount: requestBody.slideCount
        })

        // Call Gamma presentation service
        const gammaResponse = await fetch(
          `${SUPABASE_URL}/functions/v1/gamma-presentation`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
            },
            body: JSON.stringify(requestBody)
          }
        )

        if (!gammaResponse.ok) {
          const errorText = await gammaResponse.text()
          console.error('❌ Gamma API error:', errorText)
          throw new Error(`Gamma generation failed: ${gammaResponse.statusText}`)
        }

        const gammaData = await gammaResponse.json()
        console.log('✅ Gamma response:', gammaData)

        // Return with generationId for frontend to poll, or immediate URL if already complete
        return new Response(JSON.stringify({
          success: true,
          generationId: gammaData.generationId,
          presentationUrl: gammaData.gammaUrl || gammaData.presentationUrl || gammaData.url,
          status: gammaData.status || 'pending',
          message: gammaData.status === 'completed' ? 'Presentation generated successfully!' : 'Presentation is being generated...',
          conversationId
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

      } catch (error) {
        console.error('❌ Direct presentation generation failed:', error)
        return new Response(JSON.stringify({
          success: false,
          error: error.message,
          conversationId
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // CAMPAIGN GENERATION STAGE - Use NIV's intelligence for strategic content
    // Note: effectiveStage can be auto-detected based on message markers or campaignContext
    if (effectiveStage === 'campaign_generation' && (requestBody.campaignContext || hasCampaignContext)) {
      console.log('🎯 Campaign Generation Mode - Strategic Content Orchestration via NIV')

      // Create Supabase client for saving to Memory Vault
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )

      const campaignContext = requestBody.campaignContext
      const {
        phase,
        phaseNumber,
        objective,
        narrative,
        keyMessages,
        contentRequirements,
        researchInsights,
        currentDate,
        campaignFolder,
        blueprintId,
        positioning,
        targetStakeholders
      } = campaignContext

      console.log(`📍 Generating ${phase} phase campaign (Phase ${phaseNumber})`)
      console.log(`📋 Owned content: ${contentRequirements.owned?.length || 0} pieces`)
      console.log(`📋 Media engagement: ${contentRequirements.media?.length || 0} pieces`)

      const allGeneratedContent = []

      // Generate owned content with NIV's strategic intelligence
      // Use batching (5 at a time) to avoid overwhelming Claude API
      if (contentRequirements.owned && contentRequirements.owned.length > 0) {
        console.log(`🎨 Generating ${contentRequirements.owned.length} owned content pieces (batched: 5 at a time)...`)

        const processOwnedItem = async (ownedReq: any) => {
          try {
            console.log(`  📝 Generating ${ownedReq.type} for ${ownedReq.stakeholder}...`)

            // Use NIV to craft a strategic content brief
            const strategicBrief = await craftStrategicContentBrief({
              contentType: ownedReq.type,
              stakeholder: ownedReq.stakeholder,
              purpose: ownedReq.purpose,
              phase,
              phaseNumber,
              objective,
              narrative,
              keyMessages,
              researchInsights,
              positioning,
              targetStakeholders,
              organization: orgProfile.organizationName,
              specificGuidance: ownedReq.keyPoints,
              campaignSummary: campaignContext?.campaignSummary,
              currentDate: currentDate
            })

            console.log(`    📋 Strategic brief: ${strategicBrief.substring(0, 200)}...`)

            // Generate content directly with Claude (bypasses MCP for better quality)
            // Wrap in retry logic for timeout resilience
            const content = await withRetry(() => generateContentDirectly(ownedReq.type, strategicBrief, {
              organization: orgProfile.organizationName,
              subject: strategicBrief,
              topic: strategicBrief,
              narrative: narrative,
              angle: strategicBrief,
              keyPoints: keyMessages || [],
              targetAudiences: [ownedReq.stakeholder],
              research: researchInsights?.join('; ') || '',
              specificKeyPoints: ownedReq.keyPoints || [],
              positioning: positioning || '',
              currentDate: currentDate,
              fullFramework: {
                campaignContext: campaignContext,
                phase: phase,
                phaseNumber: phaseNumber,
                objective: objective,
                narrative: narrative,
                keyMessages: keyMessages,
                researchInsights: researchInsights,
                targetStakeholders: targetStakeholders,
                positioning: positioning,
                contentPurpose: ownedReq.purpose,
                specificGuidance: ownedReq.keyPoints,
                strategicBrief: strategicBrief
              }
            }), 2, 3000)  // 2 retries, 3 second delay

            console.log(`    ✅ ${ownedReq.type} generated for ${ownedReq.stakeholder}`)

            return {
              type: ownedReq.type,
              stakeholder: ownedReq.stakeholder,
              content: content,
              channel: 'owned',
              purpose: ownedReq.purpose
            }
          } catch (error) {
            console.error(`    ❌ Failed to generate ${ownedReq.type}:`, error)
            return {
              type: ownedReq.type,
              stakeholder: ownedReq.stakeholder,
              content: null,
              channel: 'owned',
              error: error instanceof Error ? error.message : 'Generation failed'
            }
          }
        }

        const ownedResults = await batchPromises(contentRequirements.owned, 5, processOwnedItem)
        allGeneratedContent.push(...ownedResults)
      }

      // Generate media engagement with NIV's strategic intelligence
      // Use batching (5 at a time) to avoid overwhelming Claude API
      if (contentRequirements.media && contentRequirements.media.length > 0) {
        console.log(`📰 Generating ${contentRequirements.media.length} media pieces (batched: 5 at a time)...`)

        const processMediaItem = async (mediaReq: any) => {
          try {
            console.log(`  📝 Generating ${mediaReq.type} for ${mediaReq.journalists?.join(', ') || 'media'}...`)

            // Use NIV to craft a strategic media brief
            const strategicBrief = await craftStrategicContentBrief({
              contentType: mediaReq.type,
              stakeholder: 'Media/Journalists',
              purpose: mediaReq.story,
              phase,
              phaseNumber,
              objective,
              narrative,
              keyMessages,
              researchInsights,
              positioning,
              targetStakeholders,
              organization: orgProfile.organizationName,
              specificGuidance: mediaReq.journalists || [],
              campaignSummary: campaignContext?.campaignSummary,
              currentDate: currentDate
            })

            console.log(`    📋 Strategic brief: ${strategicBrief.substring(0, 200)}...`)

            // Generate content directly with Claude (bypasses MCP for better quality)
            // Wrap in retry logic for timeout resilience
            const content = await withRetry(() => generateContentDirectly(mediaReq.type, strategicBrief, {
              organization: orgProfile.organizationName,
              subject: strategicBrief,
              topic: strategicBrief,
              announcement: strategicBrief,
              narrative: `${narrative} ${mediaReq.positioning || ''}`.trim(),
              angle: strategicBrief,
              keyPoints: keyMessages || [],
              mediaTargets: mediaReq.journalists || [],
              research: researchInsights?.join('; ') || '',
              positioning: positioning || '',
              currentDate: currentDate,
              fullFramework: {
                campaignContext: campaignContext,
                phase: phase,
                phaseNumber: phaseNumber,
                objective: objective,
                narrative: narrative,
                keyMessages: keyMessages,
                researchInsights: researchInsights,
                targetStakeholders: targetStakeholders,
                positioning: positioning,
                mediaStory: mediaReq.story,
                journalists: mediaReq.journalists,
                strategicBrief: strategicBrief
              }
            }), 2, 3000)  // 2 retries, 3 second delay

            console.log(`    ✅ ${mediaReq.type} generated`)

            return {
              type: mediaReq.type,
              journalists: mediaReq.journalists,
              content: content,
              channel: 'media',
              story: mediaReq.story
            }
          } catch (error) {
            console.error(`    ❌ Failed to generate ${mediaReq.type}:`, error)
            return {
              type: mediaReq.type,
              journalists: mediaReq.journalists,
              content: null,
              channel: 'media',
              error: error instanceof Error ? error.message : 'Generation failed'
            }
          }
        }

        const mediaResults = await batchPromises(contentRequirements.media, 5, processMediaItem)
        allGeneratedContent.push(...mediaResults)
      }

      console.log(`📦 Generated ${allGeneratedContent.filter(c => c.content).length}/${allGeneratedContent.length} pieces`)

      // Save all content to Memory Vault with folder organization
      const phaseFolder = `${campaignFolder}/phase-${phaseNumber}-${phase}`
      console.log(`💾 Saving content to folder: ${phaseFolder}`)

      try {
        // Save phase strategy document as formatted markdown
        const strategyContent = `# Phase ${phaseNumber}: ${phase.charAt(0).toUpperCase() + phase.slice(1)} Strategy

## Objective
${objective}

## Narrative
${narrative}

## Key Messages
${keyMessages?.map((msg: string) => `- ${msg}`).join('\n') || '- No key messages defined'}

## Target Stakeholders
${targetStakeholders?.map((s: string) => `- ${s}`).join('\n') || '- No stakeholders defined'}

## Timeline
${campaignContext.timeline || 'Not specified'}

## Content Generated
- **Owned Content**: ${allGeneratedContent.filter(c => c.channel === 'owned' && c.content).length} pieces
- **Media Engagement**: ${allGeneratedContent.filter(c => c.channel === 'media' && c.content).length} pieces
`

        const { error: strategyError } = await supabase
          .from('content_library')
          .insert({
            id: crypto.randomUUID(),
            organization_id: organizationId,
            content_type: 'phase_strategy',
            title: `Phase ${phaseNumber}: ${phase} - Strategy`,
            content: strategyContent,
            folder: phaseFolder,
            metadata: {
              campaign_folder: campaignFolder,
              blueprint_id: blueprintId,
              phase,
              phase_number: phaseNumber,
              raw_data: {
                phase,
                phaseNumber,
                objective,
                narrative,
                keyMessages,
                stakeholders: targetStakeholders,
                timeline: campaignContext.timeline
              }
            },
            tags: ['phase_strategy', phase, campaignContext.campaignType || 'VECTOR_CAMPAIGN'],
            status: 'saved'
          })

        if (strategyError) {
          console.error('❌ Failed to save phase strategy:', strategyError)
        } else {
          console.log('  ✅ Phase strategy saved')
        }

        // Save each content piece
        for (const contentPiece of allGeneratedContent) {
          if (!contentPiece.content) {
            console.log(`  ⏭️ Skipping failed piece: ${contentPiece.type}`)
            continue
          }

          // Normalize content type before saving
          const normalizedContentType = normalizeContentTypeForMCP(contentPiece.type)

          const { error: contentError } = await supabase
            .from('content_library')
            .insert({
              id: crypto.randomUUID(),
              organization_id: organizationId,
              content_type: normalizedContentType,  // Use normalized type
              title: `${phase} - ${normalizedContentType} - ${contentPiece.stakeholder || contentPiece.journalists?.[0] || 'general'}`,
              content: contentPiece.content,
              folder: phaseFolder,
              metadata: {
                campaign_folder: campaignFolder,
                blueprint_id: blueprintId,
                phase,
                phase_number: phaseNumber,
                stakeholder: contentPiece.stakeholder,
                channel: contentPiece.channel,
                generated_at: new Date().toISOString(),
                original_type: contentPiece.type  // Keep original for reference
              },
              tags: [normalizedContentType, phase, contentPiece.stakeholder || 'media', contentPiece.channel],
              status: 'saved'
            })

          if (contentError) {
            console.error(`  ❌ Failed to save ${contentPiece.type}:`, contentError)
          } else {
            console.log(`  ✅ Saved ${contentPiece.type}`)
          }
        }

        console.log(`✅ Saved ${allGeneratedContent.filter(c => c.content).length} pieces to ${phaseFolder}`)
      } catch (saveError) {
        console.error('❌ Error saving content to Memory Vault:', saveError)
      }

      return new Response(JSON.stringify({
        success: true,
        phase: phase,
        phaseNumber: phaseNumber,
        generatedContent: allGeneratedContent,
        folder: phaseFolder,
        metadata: {
          objective,
          stakeholders: targetStakeholders,
          timeline: campaignContext.timeline,
          successfulPieces: allGeneratedContent.filter(c => c.content).length,
          totalPieces: allGeneratedContent.length
        }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // FULL STAGE - Natural conversation with Claude
    console.log('💬 Full stage: Natural conversation...')

    // STEP 1: UNDERSTANDING - Like orchestrator-robust, analyze what user wants
    console.log('🧠 Understanding user request...')

    const understanding = await getClaudeUnderstanding(message, conversationHistory, orgProfile, conversationState)
    console.log('✅ Understanding:', understanding)

    // Update conversation state with understanding
    updateConversationState(conversationId, message, 'user', understanding)

    // Check if user is referencing conversation history ("based on what we discussed")
    let conversationSynthesis: ConversationSynthesis | null = null
    if (requiresConversationSynthesis(message)) {
      console.log('🧠 Detected conversation reference - synthesizing history...')
      conversationSynthesis = await synthesizeConversationContext(
        conversationHistory,
        message,
        ANTHROPIC_API_KEY
      )
      console.log('✅ Conversation synthesis complete:', {
        themes: conversationSynthesis.themes.length,
        decisions: conversationSynthesis.keyDecisions.length,
        concepts: conversationSynthesis.concepts.length
      })
    }

    // Build conversation context (with synthesis if available)
    const conversationContext = await buildConversationContext(
      message,
      conversationHistory,
      orgProfile,
      conversationSynthesis
    )

    // Detect if we need research based on understanding
    // Skip research if we have conversation synthesis (user wants content based on discussion)
    const isSimpleMediaList = message.toLowerCase().includes('media list') &&
                              !message.toLowerCase().includes('media plan');

    // Trust the understanding - if Claude says it needs fresh data, do research
    // BUT: Skip research if we synthesized conversation (user wants content from discussion)
    // Access the nested understanding object
    let needsResearch = !isSimpleMediaList &&
                       !conversationSynthesis &&
                       understanding.understanding?.requires_fresh_data;

    // TOPIC-CHANGE DETECTION: If topic has significantly changed from previous research, force new research
    if (!needsResearch && conversationState.researchResults) {
      const currentEntities = understanding.understanding?.entities || []
      const currentTopics = understanding.understanding?.topics || []

      // Get previous entities/topics from conversation history
      const previousMessages = conversationHistory.slice(-5) // Last 5 messages
      const previousEntities = new Set()
      const previousTopics = new Set()

      previousMessages.forEach(msg => {
        if (msg.metadata?.understanding?.entities) {
          msg.metadata.understanding.entities.forEach(e => previousEntities.add(e.toLowerCase()))
        }
        if (msg.metadata?.understanding?.topics) {
          msg.metadata.understanding.topics.forEach(t => previousTopics.add(t.toLowerCase()))
        }
      })

      // Check if current entities/topics overlap with previous ones
      const entityOverlap = currentEntities.filter(e =>
        previousEntities.has(e.toLowerCase())
      ).length

      const topicOverlap = currentTopics.filter(t =>
        previousTopics.has(t.toLowerCase())
      ).length

      // If less than 30% overlap, this is a new topic requiring fresh research
      const entityOverlapPercent = currentEntities.length > 0 ? entityOverlap / currentEntities.length : 0
      const topicOverlapPercent = currentTopics.length > 0 ? topicOverlap / currentTopics.length : 0

      if (entityOverlapPercent < 0.3 && topicOverlapPercent < 0.3 && (currentEntities.length > 0 || currentTopics.length > 0)) {
        console.log(`🔄 Topic change detected (${Math.round(topicOverlapPercent * 100)}% overlap) - triggering fresh research`)
        needsResearch = true
      }
    }

    let researchResults = null
    let freshResearch = false  // Track if this is NEW research
    let researchTimedOut = false // Track if research timed out

    if (needsResearch) {
      console.log('🔍 Research needed...')

      // CRITICAL: Use Claude's search_query from understanding (includes year, temporal context, etc.)
      // This is what NIV Advisor does - Claude builds the query, NOT code
      let researchQuery = understanding.understanding?.search_query || ''

      // Fallback: Build from topics if Claude didn't provide search_query
      if (!researchQuery.trim()) {
        const topics = understanding.understanding?.topics || []
        if (topics.length > 0) {
          researchQuery = topics.slice(0, 5).join(' ')
        }
      }

      // Last fallback to message if we have nothing
      if (!researchQuery.trim()) {
        researchQuery = message
      }

      console.log(`🔍 Research query: "${researchQuery.trim()}"`)

      // Use orchestrated multi-step research (like NIV Advisor)
      try {
        // Decompose query into research steps
        const researchPlan = await decomposeQuery(researchQuery.trim(), {organizationId}, ANTHROPIC_API_KEY)
        console.log(`📋 Research plan created: ${researchPlan.steps.length} steps`)

        // Define firesearch tool for orchestration
        const firesearchTool = async (query: string) => {
          console.log(`🔬 Orchestration calling Firecrawl for: "${query.substring(0, 50)}..."`)
          return await executeSimpleFirecrawl(query, organizationId)
        }

        // Execute orchestrated research
        const orchestrationResult = await orchestrateResearch(
          researchPlan,
          {organizationId},
          { firesearch: firesearchTool },
          ANTHROPIC_API_KEY,
          orgProfile.organizationName
        )

        console.log(`🔍 Orchestrated research complete: ${orchestrationResult.allArticles.length} articles`)

        // Format results like NIV Advisor
        const keyFindings = orchestrationResult.allArticles.slice(0, 10).map(article => {
          const title = (article.title || 'Article').replace(/\s+/g, ' ').trim()
          const description = (article.description || '').replace(/\s+/g, ' ').trim().substring(0, 200)
          return description
            ? `**${title}** - ${description}${description.length >= 200 ? '...' : ''}`
            : `**${title}**`
        }).filter(f => f)

        researchResults = {
          articles: orchestrationResult.allArticles,
          synthesis: orchestrationResult.synthesis || '',
          keyFindings: keyFindings,
          methodology: 'orchestrated_multi_step',
          stepsCompleted: researchPlan.steps.length,
          searchQueries: researchPlan.steps.map(s => s.query)
        }

        console.log(`✅ Research complete: ${researchResults.articles.length} articles, ${keyFindings.length} findings`)
        freshResearch = true
        updateConversationState(conversationId, '', 'assistant', undefined, researchResults)
        conversationState.researchResults = researchResults
        conversationState.stage = 'research_review'

      } catch (error) {
        console.error('⚠️ Orchestrated research failed:', error)
        // Fallback to simple research
        console.log('🔄 Falling back to simple Firecrawl search...')
        researchResults = await executeResearch(researchQuery.trim(), organizationId)

        if (researchResults.articles?.length > 0) {
          console.log(`✅ Fallback research complete: ${researchResults.articles.length} articles`)
          freshResearch = true
          updateConversationState(conversationId, '', 'assistant', undefined, researchResults)
          conversationState.researchResults = researchResults
          conversationState.stage = 'research_review'
        } else {
          console.log('⚠️ Research returned no results - proceeding without research')
          researchTimedOut = true
          researchResults = null
        }
      }
    }

    // If we just completed fresh research for a presentation, present findings FIRST
    // Don't create outline yet - let user review research and confirm approach
    // NOTE: We only present research if it succeeded - if it failed/timed out, we skip this step
    const isPresentationRequest = understanding.understanding?.content_type === 'presentation'
    const shouldPresentResearchFirst = freshResearch && isPresentationRequest &&
                                       conversationState.stage === 'research_review'

    // Check if user is confirming after research review
    const isConfirmingResearch = conversationState.stage === 'research_review' &&
                                 !freshResearch &&
                                 (message.toLowerCase().includes('looks good') ||
                                  message.toLowerCase().includes('create') ||
                                  message.toLowerCase().includes('outline') ||
                                  message.toLowerCase().includes('proceed') ||
                                  message.toLowerCase().includes('yes'))

    if (isConfirmingResearch) {
      console.log('✅ User confirmed research - ready for outline creation')
      conversationState.stage = 'understanding' // Reset to allow outline creation
    }

    // Call Claude for natural conversation with tool support
    // Pass research, and add instruction about whether to present findings or create outline
    // Use Sonnet for strategy phases: presenting research, early conversation, research_review stage
    const isStrategyPhase = shouldPresentResearchFirst ||
                           conversationState.stage === 'research_review' ||
                           conversationHistory.length < 4  // Early conversation needs strategic thinking

    const claudeResponseData = await callClaude(
      conversationContext,
      freshResearch ? researchResults : conversationState.researchResults,  // Use fresh or stored research
      orgProfile,
      conversationState,
      conversationHistory,  // Pass full conversation history
      shouldPresentResearchFirst,  // Tell Claude to present findings first
      isStrategyPhase  // Use Sonnet for strategy/research phases
    )

    console.log('✅ Claude response generated')
    console.log('🔍 Stop reason:', claudeResponseData.stop_reason)
    console.log('🔍 Response content:', JSON.stringify(claudeResponseData.content, null, 2))

    // Check if Claude wants to use a tool
    if (claudeResponseData.stop_reason === 'tool_use') {
      const toolUse = claudeResponseData.content.find((block: any) => block.type === 'tool_use')
      const textContent = claudeResponseData.content.find((block: any) => block.type === 'text')

      console.log('🔧 Tool use detected:', toolUse?.name)
      console.log('💬 Text content:', textContent?.text?.substring(0, 100))

      // Check if Claude included text BEFORE calling the tool
      // Only treat as dialogue mode if it's an ACTUAL QUESTION requiring user input
      // If it's just Claude being polite ("I'll create..."), let the tool execute
      if (textContent && textContent.text) {
        const text = textContent.text.toLowerCase()

        // Detect actual questions or option presentations requiring user choice
        const isActualQuestion =
          text.includes('?') ||
          text.includes('which option') ||
          text.includes('would you like') ||
          text.includes('would you prefer') ||
          text.includes('option 1:') ||
          text.includes('option 2:') ||
          text.includes('option 3:') ||
          text.includes('choose') ||
          text.includes('select one') ||
          text.includes('which approach') ||
          text.includes('which angle') ||
          text.includes('which resonates') ||
          text.includes('need clarification') ||
          text.includes('can you clarify')

        if (isActualQuestion) {
          console.log('⏸️  Claude asked a question before calling tool - returning question, NOT executing')
          return new Response(JSON.stringify({
            success: true,
            mode: 'dialogue',
            message: textContent.text,
            conversationId,
            pendingTool: {
              name: toolUse?.name,
              input: toolUse?.input
            }
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        } else {
          console.log('✅ Claude provided explanation before tool call - continuing with execution')
          // Fall through to execute the tool
        }
      }

      // Handle simple image generation
      if (toolUse && toolUse.name === 'generate_image') {
        console.log('🎨 Claude called generate_image tool!')
        console.log('📝 Prompt:', toolUse.input.prompt)
        console.log('🔗 Calling vertex-ai-visual at:', `${SUPABASE_URL}/functions/v1/vertex-ai-visual`)

        try {
          const requestBody = {
            type: 'image',
            prompt: toolUse.input.prompt,
            aspectRatio: '1:1',
            numberOfImages: 1
          }
          console.log('📤 Request body:', JSON.stringify(requestBody))

          const imageResponse = await fetch(
            `${SUPABASE_URL}/functions/v1/vertex-ai-visual`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
              },
              body: JSON.stringify(requestBody)
            }
          )

          console.log('📥 Vertex AI response status:', imageResponse.status)

          if (!imageResponse.ok) {
            const errorText = await imageResponse.text()
            console.error('Vertex AI error:', errorText)
            throw new Error(`Image generation failed: ${imageResponse.statusText}`)
          }

          const imageData = await imageResponse.json()
          console.log('✅ Image data:', imageData)

          // Extract image URL from response - must be a string, not an object
          const imageUrl = imageData.images?.[0]?.url ||
                          imageData.images?.[0]?.uri ||
                          imageData.images?.[0]?.gcsUri ||
                          imageData.imageUrl ||
                          imageData.url ||
                          null

          if (!imageUrl || typeof imageUrl !== 'string') {
            // Return visual brief if no image was generated
            return new Response(JSON.stringify({
              success: false,
              mode: 'visual_brief',
              message: imageData.fallback?.content || imageData.error || 'Image generation failed',
              instructions: imageData.fallback?.instructions,
              conversationId
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
          }

          return new Response(JSON.stringify({
            success: true,
            mode: 'image_generated',
            message: `✅ Image generated`,
            imageUrl,
            prompt: toolUse.input.prompt,
            conversationId
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        } catch (error) {
          console.error('❌ Image generation error:', error)
          return new Response(JSON.stringify({
            success: false,
            error: `Image generation failed: ${error.message}`,
            conversationId
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
        }
      }

      // Handle simple social post generation
      if (toolUse && toolUse.name === 'generate_social_post') {
        console.log('📱 Generating social post')

        const content = await callMCPService('social-post', {
          organization: orgProfile.organizationName,
          subject: toolUse.input.topic,
          tone: toolUse.input.tone || 'professional',
          platforms: [toolUse.input.platform || 'linkedin']
        })

        return new Response(JSON.stringify({
          success: true,
          mode: 'content_generated',
          contentType: 'social-post',
          message: `✅ Social post generated`,
          content,
          conversationId
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Handle simple press release generation
      if (toolUse && toolUse.name === 'generate_press_release') {
        console.log('📰 Generating press release')

        const content = await callMCPService('press-release', {
          organization: orgProfile.organizationName,
          subject: toolUse.input.announcement,
          keyPoints: toolUse.input.key_points || []
        })

        return new Response(JSON.stringify({
          success: true,
          mode: 'content_generated',
          contentType: 'press-release',
          message: `✅ Press release generated`,
          content,
          conversationId
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Handle simple blog post generation
      if (toolUse && toolUse.name === 'generate_blog_post') {
        console.log('📝 Generating blog post')

        const content = await callMCPServiceWithContext('blog-post', {
          organization: orgProfile.organizationName,
          subject: toolUse.input.topic,
          angle: toolUse.input.angle
        }, conversationHistory, conversationState, campaignContext)

        return new Response(JSON.stringify({
          success: true,
          mode: 'content_generated',
          contentType: 'blog-post',
          message: `✅ Blog post generated`,
          content,
          conversationId
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Handle Memory Vault search with composite scoring
      if (toolUse && toolUse.name === 'search_memory_vault') {
        console.log('🔍 Searching Memory Vault with composite scoring')
        console.log('   Query:', toolUse.input.query)
        console.log('   Type:', toolUse.input.content_type)

        try {
          const searchResponse = await supabase.functions.invoke('niv-memory-vault', {
            body: {
              action: 'search',
              query: toolUse.input.query,
              organizationId: organizationId,
              contentType: toolUse.input.content_type,
              limit: Math.min(toolUse.input.limit || 3, 10)
            }
          })

          if (searchResponse.error) {
            console.error('Memory Vault search error:', searchResponse.error)
            throw searchResponse.error
          }

          const results = searchResponse.data?.results || []
          console.log(`✅ Found ${results.length} results from Memory Vault`)

          // Format results for Claude with composite scores and explanations
          const formattedResults = results.map((r: any, idx: number) => ({
            rank: idx + 1,
            title: r.title,
            type: r.content_type,
            content_preview: r.content?.substring(0, 500) + '...',
            score: r.composite_score?.toFixed(2),
            why_recommended: r.retrieval_reason,
            metrics: {
              relevance: `${(r.similarity_score * 100).toFixed(0)}%`,
              success_rate: r.execution_score ? `${(r.execution_score * 100).toFixed(0)}%` : 'Not tracked',
              times_used: r.access_count || 0,
              last_used: r.last_accessed_at
            },
            executed: r.executed,
            full_content: r.content
          }))

          return new Response(JSON.stringify({
            success: true,
            mode: 'memory_vault_results',
            message: results.length > 0
              ? `Found ${results.length} template${results.length > 1 ? 's' : ''} from Memory Vault`
              : 'No templates found in Memory Vault for this query',
            results: formattedResults,
            query: toolUse.input.query,
            conversationId
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

        } catch (error) {
          console.error('❌ Memory Vault search error:', error)
          return new Response(JSON.stringify({
            success: false,
            mode: 'memory_vault_results',
            message: 'Memory Vault search failed - proceeding without templates',
            results: [],
            conversationId
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
      }

      // Handle simple media list generation
      if (toolUse && toolUse.name === 'generate_media_list') {
        console.log('📋 Generating media list with journalist registry')

        const requestedCount = toolUse.input.count || 10;
        const focusArea = toolUse.input.focus_area || '';
        const tier = toolUse.input.tier?.toLowerCase().replace(' ', '') || 'tier1';

        // Map focus area to industry name in database
        const industryMapping: { [key: string]: string } = {
          'ai': 'artificial_intelligence',
          'artificial intelligence': 'artificial_intelligence',
          'tech': 'technology',
          'technology': 'technology',
          'fintech': 'fintech',
          'finance': 'fintech',
          'crypto': 'cryptocurrency',
          'cryptocurrency': 'cryptocurrency',
          'blockchain': 'cryptocurrency',
          'healthcare': 'healthcare',
          'health': 'healthcare',
          'biotech': 'healthcare',
          'climate': 'climate',
          'energy': 'energy',
          'oil': 'energy',
          'gas': 'energy',
          'oil and gas': 'energy',
          'oil & gas': 'energy',
          'petroleum': 'energy',
          'renewables': 'energy',
          'clean energy': 'energy',          'sustainability': 'climate',
          'automotive': 'automotive',
          'cars': 'automotive',
          'ev': 'automotive',
          'retail': 'retail',
          'ecommerce': 'retail',
          'media': 'media',
          'entertainment': 'media',
          'advertising': 'advertising',
          'marketing': 'advertising',
          'real estate': 'real_estate',
          'property': 'real_estate',
          'vc': 'venture_capital',
          'venture capital': 'venture_capital',
          'private equity': 'venture_capital',
          'cybersecurity': 'cybersecurity',
          'security': 'cybersecurity',
          'space': 'space',
          'aerospace': 'space',
          'labor': 'labor',
          'workplace': 'labor',
          'food': 'food',
          'agriculture': 'food',
          'policy': 'policy',
          'regulation': 'policy',
          'business': 'business',
          'economy': 'business'
        };

        // Parse focus area for AND statements and multiple keywords
        const normalizedFocus = focusArea.toLowerCase().trim();
        const keywords = normalizedFocus
          .split(/\s+(?:and|&|,)\s+/) // Split on "and", "&", or ","
          .map(k => k.trim())
          .filter(k => k.length > 0);

        console.log(`📝 Parsed keywords from "${focusArea}":`, keywords);

        // Map all keywords to industries
        const industries: string[] = [];
        for (const keyword of keywords) {
          // Try exact match first
          if (industryMapping[keyword]) {
            industries.push(industryMapping[keyword]);
          } else {
            // Try keyword match
            for (const [key, value] of Object.entries(industryMapping)) {
              if (keyword.includes(key)) {
                industries.push(value);
                break;
              }
            }
          }
        }

        // Remove duplicates
        const uniqueIndustries = [...new Set(industries)];
        console.log(`🎯 Mapped to industries:`, uniqueIndustries);

        // STEP 1: Query journalist registry
        console.log(`🔍 Step 1: Querying journalist registry for ${focusArea} (${tier})...`);

        let allJournalists: any[] = [];

        if (uniqueIndustries.length > 0) {
          // Query each industry and combine results
          for (const industry of uniqueIndustries) {
            const registryBody = {
              industry,
              tier,
              count: requestedCount,
              mode: 'gap-analysis'
            };

            console.log('📤 Registry query:', registryBody);

            const registryResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/journalist-registry`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(registryBody)
            });

            const registryData = await registryResponse.json();
            if (registryData.journalists) {
              allJournalists.push(...registryData.journalists);
            }
          }

          // Remove duplicates and limit to requested count
          const uniqueJournalists = Array.from(
            new Map(allJournalists.map(j => [j.id, j])).values()
          ).slice(0, requestedCount);

          allJournalists = uniqueJournalists;
        } else {
          // No industry match - try beat search
          const registryBody = {
            beat: focusArea,
            tier,
            count: requestedCount,
            mode: 'gap-analysis'
          };

          console.log('📤 Registry query (beat search):', registryBody);

          const registryResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/journalist-registry`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(registryBody)
          });

          const registryData = await registryResponse.json();
          if (registryData.journalists) {
            allJournalists = registryData.journalists;
          }
        }

        console.log(`✅ Registry returned ${allJournalists.length} total journalists`);

        // STEP 2: Gap detection (like mcp-discovery)
        const hasGaps = allJournalists.length < requestedCount;
        const missingCount = Math.max(0, requestedCount - allJournalists.length);

        let content;
        if (hasGaps) {
          console.log(`⚠️ Gap detected: ${missingCount} journalists needed`);
          console.log('🌐 Step 2: Filling gaps with web search via mcp-media...');

          // Use mcp-media to fill gaps
          const mcpContent = await callMCPService('media-list', {
            company: orgProfile.organizationName,
            industry: focusArea,
            topic: focusArea,
            tiers: [tier],
            count: missingCount
          });

          // Combine registry journalists + mcp-generated ones
          content = {
            source: 'hybrid',
            verified_journalists: allJournalists,
            additional_journalists: mcpContent,
            gap_analysis: {
              hasGaps: true,
              currentCount: allJournalists.length,
              requestedCount,
              missingCount,
              suggestions: [
                `Found ${allJournalists.length} verified journalists from database`,
                `Filling ${missingCount} gaps with web search`
              ]
            },
            total_count: allJournalists.length,
            note: `✅ Found ${allJournalists.length} verified journalists from database. Filled ${missingCount} gaps with web search.`
          };
        } else {
          console.log('✅ No gaps - returning registry journalists only');
          content = {
            source: 'registry',
            journalists: allJournalists,
            total_count: allJournalists.length,
            note: `✅ All ${allJournalists.length} journalists from verified database`
          };
        }

        // Format journalists for display with full contact info
        const formattedList = allJournalists.map((j, i) => {
          const lines = [`${i + 1}. **${j.name}** - ${j.outlet}`];
          lines.push(`   ${j.title || 'Journalist'}`);
          lines.push(`   Focus: ${j.beat || j.coverage_area || focusArea}`);

          // Add contact information if available
          const contacts = [];
          if (j.email) contacts.push(`📧 ${j.email}`);
          if (j.twitter_handle || j.twitter) contacts.push(`🐦 @${j.twitter_handle || j.twitter}`);
          if (j.linkedin_url) contacts.push(`💼 ${j.linkedin_url}`);

          if (contacts.length > 0) {
            lines.push(`   ${contacts.join(' • ')}`);
          }

          return lines.join('\n');
        }).join('\n\n')

        // Include additional journalists from web search if present
        let displayMessage = `# Media List - ${focusArea}\n\n${content.note}\n\n${formattedList}`

        if (content.additional_journalists) {
          displayMessage += `\n\n---\n\n${content.additional_journalists}`
        }

        // Auto-save media list to Memory Vault
        const mediaListFolder = 'Media Lists/'
        console.log(`💾 Auto-saving media list to folder: ${mediaListFolder}`)

        try {
          const mediaListContent = {
            focus_area: focusArea,
            tier: tier,
            total_count: allJournalists.length,
            journalists: allJournalists.map(j => ({
              name: j.name,
              outlet: j.outlet,
              title: j.title,
              beat: j.beat || j.coverage_area,
              email: j.email,
              twitter: j.twitter_handle || j.twitter,
              linkedin: j.linkedin_url
            })),
            generated_at: new Date().toISOString()
          }

          await supabase.from('content_library').insert({
            id: crypto.randomUUID(),
            organization_id: organizationId,
            content_type: 'media-list',
            title: `Media List - ${focusArea} (${tier})`,
            content: mediaListContent,
            folder: mediaListFolder,
            metadata: {
              focus_area: focusArea,
              tier: tier,
              journalist_count: allJournalists.length,
              source: content.source,
              generated_by: 'niv-content'
            }
          })

          console.log(`✅ Auto-saved media list to ${mediaListFolder}`)
        } catch (saveError) {
          console.error('❌ Error auto-saving media list:', saveError)
          // Don't fail the request if save fails
        }

        return new Response(JSON.stringify({
          success: true,
          mode: 'content_generated',
          contentType: 'media-list',
          message: displayMessage,
          content,
          conversationId
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Handle thought leadership
      if (toolUse && toolUse.name === 'generate_thought_leadership') {
        console.log('💡 Generating thought leadership')

        const content = await callMCPServiceWithContext('thought-leadership', {
          organization: orgProfile.organizationName,
          topic: toolUse.input.topic,
          angle: toolUse.input.angle
        }, conversationHistory, conversationState, campaignContext)

        return new Response(JSON.stringify({
          success: true,
          mode: 'content_generated',
          contentType: 'thought-leadership',
          message: `✅ Thought leadership generated`,
          content,
          conversationId
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Handle case study
      if (toolUse && toolUse.name === 'generate_case_study') {
        console.log('📊 Generating case study')
        const content = await callMCPService('blog-post', {
          organization: orgProfile.organizationName,
          topic: `Case Study: ${toolUse.input.customer}`,
          angle: `Customer success story showing how we helped ${toolUse.input.customer} solve ${toolUse.input.challenge} with ${toolUse.input.solution}`
        })
        return new Response(JSON.stringify({
          success: true,
          mode: 'content_generated',
          contentType: 'case-study',
          message: `✅ Case study generated`,
          content,
          conversationId
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Handle white paper
      if (toolUse && toolUse.name === 'generate_white_paper') {
        console.log('📄 Generating white paper')
        const content = await callMCPService('thought-leadership', {
          organization: orgProfile.organizationName,
          topic: toolUse.input.topic,
          keyPoints: toolUse.input.key_points || []
        })
        return new Response(JSON.stringify({
          success: true,
          mode: 'content_generated',
          contentType: 'white-paper',
          message: `✅ White paper generated`,
          content,
          conversationId
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Handle email campaign
      if (toolUse && toolUse.name === 'generate_email_campaign') {
        console.log('📧 Generating email campaign')
        const content = await callMCPService('email-campaign', {
          organization: orgProfile.organizationName,
          subject: toolUse.input.subject,
          campaignType: toolUse.input.purpose || 'announcement'
        })
        return new Response(JSON.stringify({
          success: true,
          mode: 'content_generated',
          contentType: 'email',
          message: `✅ Email campaign generated`,
          content,
          conversationId
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Handle Q&A document
      if (toolUse && toolUse.name === 'generate_qa_document') {
        console.log('❓ Generating Q&A document')
        const content = await callMCPService('qa-document', {
          organization: orgProfile.organizationName,
          topic: toolUse.input.topic,
          focus: toolUse.input.focus
        })
        return new Response(JSON.stringify({
          success: true,
          mode: 'content_generated',
          contentType: 'qa-document',
          message: `✅ Q&A document generated`,
          content,
          conversationId
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Handle talking points
      if (toolUse && toolUse.name === 'generate_talking_points') {
        console.log('💬 Generating talking points')
        const content = await callMCPService('talking-points', {
          organization: orgProfile.organizationName,
          occasion: toolUse.input.occasion,
          topic: toolUse.input.topic
        })
        return new Response(JSON.stringify({
          success: true,
          mode: 'content_generated',
          contentType: 'talking-points',
          message: `✅ Talking points generated`,
          content,
          conversationId
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Handle executive statement
      if (toolUse && toolUse.name === 'generate_executive_statement') {
        console.log('👔 Generating executive statement')
        const content = await callMCPService('executive-statement', {
          organization: orgProfile.organizationName,
          topic: toolUse.input.topic,
          tone: toolUse.input.tone || 'confident'
        })
        return new Response(JSON.stringify({
          success: true,
          mode: 'content_generated',
          contentType: 'executive-statement',
          message: `✅ Executive statement generated`,
          content,
          conversationId
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Handle media pitch
      if (toolUse && toolUse.name === 'generate_media_pitch') {
        console.log('📣 Generating media pitch')
        const content = await callMCPService('media-pitch', {
          organization: orgProfile.organizationName,
          story: toolUse.input.story,
          journalist: toolUse.input.journalist
        })
        return new Response(JSON.stringify({
          success: true,
          mode: 'content_generated',
          contentType: 'media-pitch',
          message: `✅ Media pitch generated`,
          content,
          conversationId
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Handle all remaining content types
      if (toolUse && toolUse.name === 'generate_ebook') {
        const content = await callMCPService('thought-leadership', {
          organization: orgProfile.organizationName,
          topic: toolUse.input.topic,
          keyPoints: toolUse.input.chapters || []
        })
        return new Response(JSON.stringify({
          success: true, mode: 'content_generated', contentType: 'ebook',
          message: `✅ eBook generated`, content, conversationId
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (toolUse && toolUse.name === 'generate_linkedin_article') {
        const content = await callMCPService('social-post', {
          organization: orgProfile.organizationName,
          message: toolUse.input.topic,
          platforms: ['linkedin'],
          tone: toolUse.input.tone || 'professional'
        })
        return new Response(JSON.stringify({
          success: true, mode: 'content_generated', contentType: 'linkedin-article',
          message: `✅ LinkedIn article generated`, content, conversationId
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (toolUse && toolUse.name === 'generate_twitter_thread') {
        const content = await callMCPService('social-post', {
          organization: orgProfile.organizationName,
          message: `Create a ${toolUse.input.tweet_count || 5}-tweet thread about: ${toolUse.input.topic}`,
          platforms: ['twitter']
        })
        return new Response(JSON.stringify({
          success: true, mode: 'content_generated', contentType: 'twitter-thread',
          message: `✅ Twitter thread generated`, content, conversationId
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (toolUse && toolUse.name === 'generate_instagram_caption') {
        const content = await callMCPService('social-post', {
          organization: orgProfile.organizationName,
          message: toolUse.input.topic,
          platforms: ['instagram'],
          tone: toolUse.input.style || 'engaging'
        })
        return new Response(JSON.stringify({
          success: true, mode: 'content_generated', contentType: 'instagram-caption',
          message: `✅ Instagram caption generated`, content, conversationId
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (toolUse && toolUse.name === 'generate_instagram_post_with_image') {
        console.log('📸 Generating complete Instagram post with caption + image')

        // Step 1: Generate the caption
        const caption = await callMCPService('social-post', {
          organization: orgProfile.organizationName,
          message: toolUse.input.topic,
          platforms: ['instagram'],
          tone: toolUse.input.style || 'engaging'
        })

        console.log('✅ Caption generated, now generating image')

        // Step 2: Create image prompt based on the topic
        const imagePrompt = `Professional ${toolUse.input.imageStyle || 'modern'} social media graphic for ${orgProfile.organizationName} about: ${toolUse.input.topic}. Clean, brand-appropriate design suitable for Instagram. High quality, corporate aesthetic.`

        // Step 3: Generate the image
        try {
          const imageResponse = await fetch(
            `${SUPABASE_URL}/functions/v1/vertex-ai-visual`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
              },
              body: JSON.stringify({
                type: 'image',
                prompt: imagePrompt,
                aspectRatio: '1:1',
                numberOfImages: 1
              })
            }
          )

          if (!imageResponse.ok) {
            const errorText = await imageResponse.text()
            console.error('Image generation failed:', errorText)
            // Return just the caption if image fails
            return new Response(JSON.stringify({
              success: true,
              mode: 'content_generated',
              contentType: 'instagram-post',
              message: `✅ Instagram caption generated (image generation failed)`,
              content: caption,
              error: 'Image generation unavailable',
              conversationId
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
          }

          const imageData = await imageResponse.json()
          const imageUrl = imageData.images?.[0]?.url ||
                          imageData.images?.[0]?.uri ||
                          imageData.images?.[0]?.gcsUri ||
                          imageData.imageUrl ||
                          imageData.url ||
                          null

          console.log('✅ Complete Instagram post package ready')

          // Return both caption and image
          return new Response(JSON.stringify({
            success: true,
            mode: 'instagram_post_complete',
            contentType: 'instagram-post',
            message: `✅ Instagram post generated with caption and image`,
            caption: caption,
            imageUrl: imageUrl,
            imagePrompt: imagePrompt,
            conversationId
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        } catch (error) {
          console.error('Error generating image:', error)
          // Return caption even if image fails
          return new Response(JSON.stringify({
            success: true,
            mode: 'content_generated',
            contentType: 'instagram-caption',
            message: `✅ Instagram caption generated (image error: ${error.message})`,
            content: caption,
            conversationId
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
      }

      if (toolUse && toolUse.name === 'generate_facebook_post') {
        const content = await callMCPService('social-post', {
          organization: orgProfile.organizationName,
          message: toolUse.input.topic,
          platforms: ['facebook'],
          tone: toolUse.input.tone || 'friendly'
        })
        return new Response(JSON.stringify({
          success: true, mode: 'content_generated', contentType: 'facebook-post',
          message: `✅ Facebook post generated`, content, conversationId
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (toolUse && toolUse.name === 'generate_newsletter') {
        const content = await callMCPService('email-campaign', {
          organization: orgProfile.organizationName,
          campaignType: 'newsletter',
          topic: toolUse.input.topic,
          sections: toolUse.input.sections
        })
        return new Response(JSON.stringify({
          success: true, mode: 'content_generated', contentType: 'newsletter',
          message: `✅ Newsletter generated`, content, conversationId
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (toolUse && toolUse.name === 'generate_email_sequence') {
        const content = await callMCPService('email-campaign', {
          organization: orgProfile.organizationName,
          campaignType: 'sequence',
          goal: toolUse.input.campaign,
          emailCount: toolUse.input.email_count || 5
        })
        return new Response(JSON.stringify({
          success: true, mode: 'content_generated', contentType: 'drip-sequence',
          message: `✅ Email sequence generated`, content, conversationId
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (toolUse && toolUse.name === 'generate_cold_outreach') {
        const content = await callMCPService('email-campaign', {
          organization: orgProfile.organizationName,
          campaignType: 'cold_outreach',
          target: toolUse.input.target,
          offer: toolUse.input.offer
        })
        return new Response(JSON.stringify({
          success: true, mode: 'content_generated', contentType: 'cold-outreach',
          message: `✅ Cold outreach generated`, content, conversationId
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (toolUse && toolUse.name === 'generate_crisis_response') {
        const content = await callMCPService('executive-statement', {
          organization: orgProfile.organizationName,
          topic: `Crisis Response: ${toolUse.input.situation}`,
          tone: toolUse.input.tone || 'empathetic'
        })
        return new Response(JSON.stringify({
          success: true, mode: 'content_generated', contentType: 'crisis-response',
          message: `✅ Crisis response generated`, content, conversationId
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (toolUse && toolUse.name === 'generate_apology_statement') {
        const content = await callMCPService('executive-statement', {
          organization: orgProfile.organizationName,
          topic: `Apology regarding: ${toolUse.input.issue}`,
          keyPoints: [`Issue: ${toolUse.input.issue}`, `Actions: ${toolUse.input.actions}`],
          tone: 'empathetic'
        })
        return new Response(JSON.stringify({
          success: true, mode: 'content_generated', contentType: 'apology-statement',
          message: `✅ Apology statement generated`, content, conversationId
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (toolUse && toolUse.name === 'generate_investor_update') {
        const content = await callMCPService('executive-statement', {
          organization: orgProfile.organizationName,
          topic: `${toolUse.input.period} Investor Update`,
          keyPoints: toolUse.input.highlights || [],
          tone: 'confident'
        })
        return new Response(JSON.stringify({
          success: true, mode: 'content_generated', contentType: 'investor-update',
          message: `✅ Investor update generated`, content, conversationId
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (toolUse && toolUse.name === 'generate_board_presentation') {
        try {
          const presentationResponse = await fetch(
            `${SUPABASE_URL}/functions/v1/gamma-presentation`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` },
              body: JSON.stringify({ topic: toolUse.input.topic, sections: toolUse.input.sections || [] })
            }
          )
          const presentationData = await presentationResponse.json()
          return new Response(JSON.stringify({
            success: true, mode: 'presentation_generated',
            message: `✅ Board presentation generated`,
            presentationUrl: presentationData.url || presentationData.presentationUrl,
            conversationId
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        } catch (error) {
          console.error('Board presentation error:', error)
        }
      }

      if (toolUse && toolUse.name === 'generate_media_kit') {
        const content = await callMCPService('press-release', {
          organization: orgProfile.organizationName,
          announcement: `Media Kit - ${toolUse.input.focus}`,
          keyPoints: ['Company overview', 'Key facts', 'Media contacts', 'Brand assets']
        })
        return new Response(JSON.stringify({
          success: true, mode: 'content_generated', contentType: 'media-kit',
          message: `✅ Media kit generated`, content, conversationId
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (toolUse && toolUse.name === 'generate_podcast_pitch') {
        const content = await callMCPService('media-pitch', {
          organization: orgProfile.organizationName,
          story: `Podcast appearance pitch: ${toolUse.input.topic}`,
          journalist: toolUse.input.podcast
        })
        return new Response(JSON.stringify({
          success: true, mode: 'content_generated', contentType: 'podcast-pitch',
          message: `✅ Podcast pitch generated`, content, conversationId
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (toolUse && toolUse.name === 'generate_tv_interview_prep') {
        const content = await callMCPService('talking-points', {
          organization: orgProfile.organizationName,
          occasion: `TV interview on ${toolUse.input.show || 'show'}`,
          topic: toolUse.input.topics?.join(', ') || 'interview topics'
        })
        return new Response(JSON.stringify({
          success: true, mode: 'content_generated', contentType: 'tv-interview-prep',
          message: `✅ TV interview prep generated`, content, conversationId
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (toolUse && toolUse.name === 'generate_infographic') {
        const content = await callMCPService('blog-post', {
          organization: orgProfile.organizationName,
          topic: `Infographic: ${toolUse.input.topic}`,
          angle: `Data visualization showing: ${toolUse.input.data_points?.join(', ')}`
        })
        return new Response(JSON.stringify({
          success: true, mode: 'content_generated', contentType: 'infographic',
          message: `✅ Infographic content generated`, content, conversationId
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (toolUse && toolUse.name === 'generate_social_graphics') {
        try {
          const imageResponse = await fetch(`${SUPABASE_URL}/functions/v1/vertex-ai-visual`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` },
            body: JSON.stringify({
              type: 'image',
              prompt: `Social media graphic for ${toolUse.input.platform}: ${toolUse.input.message}`,
              aspectRatio: '1:1'
            })
          })
          const imageData = await imageResponse.json()
          const imageUrl = imageData.images?.[0]?.url ||
                          imageData.images?.[0]?.uri ||
                          imageData.images?.[0]?.gcsUri ||
                          imageData.imageUrl ||
                          imageData.url ||
                          null

          if (!imageUrl || typeof imageUrl !== 'string') {
            throw new Error('No valid image URL returned from Vertex AI')
          }

          return new Response(JSON.stringify({
            success: true, mode: 'image_generated',
            message: `✅ Social graphic generated`, imageUrl, conversationId
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        } catch (error) {
          console.error('Social graphics error:', error)
        }
      }

      if (toolUse && toolUse.name === 'generate_video_script') {
        const content = await callMCPService('blog-post', {
          organization: orgProfile.organizationName,
          topic: `Video Script: ${toolUse.input.topic}`,
          angle: `${toolUse.input.duration || '2-3 minute'} video script with scene descriptions`
        })
        return new Response(JSON.stringify({
          success: true, mode: 'content_generated', contentType: 'video',
          message: `✅ Video script generated`, content, conversationId
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (toolUse && toolUse.name === 'generate_messaging_framework') {
        const content = await callMCPService('thought-leadership', {
          organization: orgProfile.organizationName,
          topic: `Messaging Framework: ${toolUse.input.product}`,
          keyPoints: [`Target audience: ${toolUse.input.audience}`, 'Value proposition', 'Key messages', 'Positioning']
        })
        return new Response(JSON.stringify({
          success: true, mode: 'content_generated', contentType: 'messaging',
          message: `✅ Messaging framework generated`, content, conversationId
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (toolUse && toolUse.name === 'generate_brand_narrative') {
        const content = await callMCPService('thought-leadership', {
          organization: orgProfile.organizationName,
          topic: `Brand Narrative: ${toolUse.input.brand}`,
          keyPoints: toolUse.input.values || []
        })
        return new Response(JSON.stringify({
          success: true, mode: 'content_generated', contentType: 'brand-narrative',
          message: `✅ Brand narrative generated`, content, conversationId
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (toolUse && toolUse.name === 'generate_value_proposition') {
        const content = await callMCPService('thought-leadership', {
          organization: orgProfile.organizationName,
          topic: 'Value Proposition',
          keyPoints: [toolUse.input.offering, toolUse.input.benefit]
        })
        return new Response(JSON.stringify({
          success: true, mode: 'content_generated', contentType: 'value-proposition',
          message: `✅ Value proposition generated`, content, conversationId
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (toolUse && toolUse.name === 'generate_competitive_positioning') {
        const content = await callMCPService('thought-leadership', {
          organization: orgProfile.organizationName,
          topic: `Competitive Positioning: ${toolUse.input.product}`,
          keyPoints: toolUse.input.competitors || []
        })
        return new Response(JSON.stringify({
          success: true, mode: 'content_generated', contentType: 'competitive-positioning',
          message: `✅ Competitive positioning generated`, content, conversationId
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // OLD presentation handler removed - now using tool-based workflow at line 2083

      // Handle strategy document creation
      if (toolUse && toolUse.name === 'create_strategy_document') {
        console.log('📋 Claude created strategy document')
        console.log('📋 Strategy:', JSON.stringify(toolUse.input, null, 2))

        // Update state to strategy review
        conversationState.stage = 'strategy_review'
        conversationState.strategyChosen = toolUse.input.chosen_approach

        // Format the strategy document for display
        const strategyDoc = `# Media Strategy: ${toolUse.input.subject}

## Strategic Approach
${toolUse.input.chosen_approach}

## Core Narrative
${toolUse.input.narrative}

## Target Audiences
${toolUse.input.target_audiences.map((a: string) => `- ${a}`).join('\n')}

## Key Messages
${toolUse.input.key_messages.map((m: string, i: number) => `${i + 1}. ${m}`).join('\n')}

${toolUse.input.media_targets ? `## Media Targets
${toolUse.input.media_targets.map((t: string) => `- ${t}`).join('\n')}
` : ''}

${toolUse.input.timeline ? `## Timeline
${toolUse.input.timeline}
` : ''}

${toolUse.input.tactical_recommendations ? `## Tactical Recommendations
${toolUse.input.tactical_recommendations.map((r: string) => `- ${r}`).join('\n')}
` : ''}`

        return new Response(JSON.stringify({
          success: true,
          mode: 'strategy_document',
          message: strategyDoc,
          strategyDocument: toolUse.input,
          conversationId
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Handle presentation outline creation
      // Handle multi-content package generation
      if (toolUse && toolUse.name === 'generate_content_package') {
        console.log('📦 Claude requested multi-content package')
        console.log('📦 Content types:', toolUse.input.content_types)

        const contentTypes = toolUse.input.content_types || []
        const context = toolUse.input.context || {}
        const details = toolUse.input.details || {}

        // Start generating each piece
        const generationResults: any[] = []

        for (const contentType of contentTypes) {
          console.log(`🔄 Generating ${contentType}...`)

          try {
            // Map content type to appropriate generation method
            let result = null

            switch (contentType) {
              case 'presentation':
                // For presentations, create outline first
                result = {
                  type: 'presentation',
                  action: 'outline_created',
                  message: 'Presentation outline created - awaiting approval for Gamma generation'
                }
                // Store outline in conversation state
                conversationState.stage = 'strategy_review'
                conversationState.approvedStrategy = {
                  topic: context.topic,
                  audience: context.audience,
                  purpose: context.purpose,
                  key_messages: context.key_messages || [],
                  slide_count: details.slide_count || 12,
                  sections: [] // Would need to be generated
                }
                break

              case 'press-release':
                const pr = await callMCPService('press-release', {
                  organization: orgProfile.organizationName,
                  announcement: context.topic,
                  keyPoints: context.key_messages || [],
                  quotes: details.quotes || []
                })
                result = { type: 'press-release', content: pr, message: '✅ Press release generated' }
                generationResults.push(result)
                break

              case 'social-posts':
                const posts = await callMCPService('social-post', {
                  organization: orgProfile.organizationName,
                  message: context.topic,
                  platforms: details.platforms || ['linkedin', 'twitter'],
                  count: details.post_count || 5
                })
                result = { type: 'social-posts', content: posts, message: '✅ Social posts generated' }
                generationResults.push(result)
                break

              case 'talking-points':
                const talkingPoints = await callMCPService('talking-points', {
                  organization: orgProfile.organizationName,
                  subject: context.topic,
                  keyMessages: context.key_messages || [],
                  audience: context.audience
                })
                result = { type: 'talking-points', content: talkingPoints, message: '✅ Talking points generated' }
                generationResults.push(result)
                break

              case 'event-brief':
              case 'one-pager':
              case 'executive-summary':
                // These would be generated as structured documents
                result = {
                  type: contentType,
                  content: `# ${context.topic}\n\n${context.narrative || ''}\n\n## Key Messages\n${(context.key_messages || []).map((m, i) => `${i+1}. ${m}`).join('\n')}`,
                  message: `✅ ${contentType.replace('-', ' ')} generated`
                }
                generationResults.push(result)
                break

              default:
                console.log(`⚠️ Unsupported content type: ${contentType}`)
            }
          } catch (error) {
            console.error(`❌ Error generating ${contentType}:`, error)
            generationResults.push({
              type: contentType,
              error: error.message,
              message: `❌ Failed to generate ${contentType}`
            })
          }
        }

        return new Response(JSON.stringify({
          success: true,
          mode: 'content_package_generated',
          message: `✅ Generated ${generationResults.length} content pieces`,
          generatedContent: generationResults,
          conversationId
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (toolUse && toolUse.name === 'create_presentation_outline') {
        console.log('📊 Claude created presentation outline')
        console.log('📊 Outline:', JSON.stringify(toolUse.input, null, 2))

        // Update state to outline review
        conversationState.stage = 'strategy_review' // Re-use strategy_review stage
        conversationState.approvedStrategy = toolUse.input // Store outline for later use

        // Research was already done BEFORE Claude created the outline (if needed)
        // It was injected into Claude's context, so Claude used it to create better slides
        const researchData = conversationState.researchResults || null

        // Format the outline for display (like strategy document - no research display)
        let outline = `# Presentation: ${toolUse.input.topic}

**Audience:** ${toolUse.input.audience}
**Purpose:** ${toolUse.input.purpose}
**Slides:** ~${toolUse.input.slide_count || 10} slides

## Key Messages
${toolUse.input.key_messages.map((m: string, i: number) => `${i + 1}. ${m}`).join('\n')}

## Presentation Structure

${toolUse.input.sections.map((section: any, i: number) => `### Slide ${i + 1}: ${section.title}

**Talking Points:**
${section.talking_points.map((p: string) => `- ${p}`).join('\n')}

**Visual Suggestion:** ${section.visual_suggestion}
`).join('\n')}

---

*Once you're happy with this outline, I'll send it to Gamma to create your presentation!*`

        return new Response(JSON.stringify({
          success: true,
          mode: 'presentation_outline',
          message: outline,
          presentationOutline: toolUse.input,
          researchData: researchData, // Include research so it can be used in generation
          conversationId
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Handle presentation generation (with approved outline)
      if (toolUse && toolUse.name === 'generate_presentation' && toolUse.input.approved_outline) {
        console.log('🎨 Claude triggered presentation generation via tool')
        console.log('📊 Approved outline:', JSON.stringify(toolUse.input.approved_outline, null, 2))

        // Update state to generation stage
        conversationState.stage = 'generation'
        conversationState.approvedStrategy = toolUse.input.approved_outline

        const outline = toolUse.input.approved_outline

        // Validate outline has required fields
        if (!outline.topic || !outline.sections || outline.sections.length === 0) {
          console.error('❌ Invalid outline structure:', outline)
          throw new Error('Outline missing required fields (topic or sections)')
        }

        // Build detailed prompt for Gamma with the structured outline AND research data
        const currentDate = new Date().toISOString().split('T')[0]
        const currentYear = new Date().getFullYear()

        // Get research data if available
        const researchData = conversationState.researchResults
        let researchSection = ''

        if (researchData && (researchData.keyFindings?.length > 0 || researchData.synthesis)) {
          researchSection = `\n**CRITICAL: Use this research data in your presentation:**\n\n`

          if (researchData.synthesis) {
            researchSection += `**Overview:** ${researchData.synthesis}\n\n`
          }

          if (researchData.keyFindings && researchData.keyFindings.length > 0) {
            researchSection += `**Key Facts & Data Points (incorporate these into slides):**\n`
            researchData.keyFindings.forEach((finding: string, i: number) => {
              researchSection += `${i + 1}. ${finding}\n`
            })
            researchSection += '\n'
          }

          researchSection += `**INSTRUCTION:** Integrate the above facts, statistics, and insights throughout the presentation. Use specific data points to support key messages. Make the presentation data-driven and credible.\n\n`
        }

        const gammaPrompt = `**CURRENT DATE: ${currentDate}**
**CURRENT YEAR: ${currentYear}**

IMPORTANT: This presentation is being created in ${currentYear}. Use current data and avoid referencing outdated information from before 2024.
${researchSection}
Create a ${outline.slide_count || 10}-slide presentation on "${outline.topic}" for ${outline.audience}.

Purpose: ${outline.purpose}

Key Messages:
${outline.key_messages.map((m: string, i: number) => `${i + 1}. ${m}`).join('\n')}

Slide Structure:
${outline.sections.map((section: any, i: number) => `
Slide ${i + 1}: ${section.title}
Content: ${section.talking_points.join('; ')}
Visual: ${section.visual_suggestion}
`).join('\n')}

Style: Professional, clean design with visuals supporting each key point. Use specific data and facts from the research provided above.

REMINDER: Current date is ${currentDate}. Ensure all data references and examples are from 2024-${currentYear}. Incorporate the research findings listed above into relevant slides.`

        console.log('📊 Built Gamma prompt:', gammaPrompt.substring(0, 500))
        console.log('📊 Outline:', JSON.stringify(outline, null, 2))

        try {
          const requestBody = {
            title: outline.topic,
            topic: outline.topic,
            content: gammaPrompt,
            format: 'presentation',
            slideCount: outline.slide_count || 10,
            options: {
              audience: outline.audience,
              tone: outline.purpose
            },
            // IMPORTANT: Enable capture to SignalDesk database
            capture: true,
            organization_id: organizationId,
            campaign_id: null
          }

          console.log('📤 Sending to Gamma:', {
            title: requestBody.title,
            contentLength: requestBody.content?.length,
            hasContent: !!requestBody.content,
            format: requestBody.format,
            slideCount: requestBody.slideCount,
            capture: requestBody.capture,
            organization_id: requestBody.organization_id
          })

          console.log('📤 FULL REQUEST BODY:', JSON.stringify(requestBody, null, 2))

          // Call Gamma presentation service
          const gammaResponse = await fetch(`${SUPABASE_URL}/functions/v1/gamma-presentation`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
            },
            body: JSON.stringify(requestBody)
          })

          console.log('📥 Gamma response status:', gammaResponse.status, gammaResponse.ok)

          if (!gammaResponse.ok) {
            const errorText = await gammaResponse.text()
            console.error('❌ Gamma error response:', errorText)
            throw new Error(`Gamma API error (${gammaResponse.status}): ${errorText}`)
          }

          const gammaData = await gammaResponse.json()
          console.log('✅ Gamma generation started:', JSON.stringify(gammaData, null, 2))

          // Generate markdown version in parallel for Memory Vault storage
          const markdownContent = `# ${outline.topic}

**Created:** ${new Date().toISOString().split('T')[0]}
**Audience:** ${outline.audience}
**Purpose:** ${outline.purpose}
**Slides:** ${outline.slide_count || 10}

## Key Messages

${outline.key_messages.map((m: string, i: number) => `${i + 1}. ${m}`).join('\n')}

## Presentation Outline

${outline.sections.map((section: any, i: number) => `
### Slide ${i + 1}: ${section.title}

**Content:**
${section.talking_points.map((point: string) => `- ${point}`).join('\n')}

**Visual Suggestion:** ${section.visual_suggestion}
`).join('\n')}

---
*Generated with SignalDesk*
*Gamma Presentation ID: ${gammaData.generationId || 'pending'}*`

          // Save outline + markdown to Memory Vault (non-blocking)
          try {
            console.log('💾 Saving presentation outline to Memory Vault')
            await supabase.from('content_library').insert({
              id: crypto.randomUUID(),
              organization_id: organizationId,
              content_type: 'presentation_outline',
              title: outline.topic,
              content: markdownContent,
              metadata: {
                gamma_generation_id: gammaData.generationId,
                audience: outline.audience,
                purpose: outline.purpose,
                slide_count: outline.slide_count,
                key_messages: outline.key_messages,
                created_date: new Date().toISOString(),
                status: 'generating'
              },
              folder: `presentations/${outline.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
            })
            console.log('✅ Saved presentation outline to Memory Vault')
          } catch (saveError) {
            console.error('❌ Error saving to Memory Vault:', saveError)
            // Don't fail the request if vault save fails
          }

          // Check if presentation is ready or still pending
          if (gammaData.status === 'pending' || !gammaData.gammaUrl) {
            // Return with generationId for frontend to poll
            return new Response(JSON.stringify({
              success: true,
              mode: 'presentation_generating',
              message: `Your presentation is being created in Gamma! This usually takes 30-60 seconds. I'll let you know when it's ready.`,
              generationId: gammaData.generationId,
              status: 'pending',
              pollUrl: `${SUPABASE_URL}/functions/v1/gamma-presentation?generationId=${gammaData.generationId}`,
              metadata: {
                topic: outline.topic,
                slides: outline.slide_count,
                format: 'presentation',
                estimatedTime: '30-60 seconds',
                saved_to_vault: true
              },
              conversationId
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
          }

          // If already complete (rare but possible)
          return new Response(JSON.stringify({
            success: true,
            mode: 'presentation_generated',
            message: `I've created your presentation in Gamma! You can view and edit it here: ${gammaData.gammaUrl || gammaData.presentationUrl || gammaData.url}`,
            presentationUrl: gammaData.gammaUrl || gammaData.presentationUrl || gammaData.url,
            generationId: gammaData.generationId,
            metadata: {
              topic: outline.topic,
              slides: outline.slide_count,
              format: 'presentation'
            },
            conversationId
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

        } catch (error) {
          console.error('Gamma presentation error:', error)
          return new Response(JSON.stringify({
            success: false,
            error: 'Failed to generate presentation with Gamma',
            details: error instanceof Error ? error.message : 'Unknown error'
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
        }
      }

      // Handle media plan generation (with approved strategy)
      if (toolUse && toolUse.name === 'generate_media_plan') {
        console.log('🎨 Claude triggered media plan generation via tool')
        console.log('📋 Approved strategy:', JSON.stringify(toolUse.input.approved_strategy, null, 2))

        // Update state to generation stage
        conversationState.stage = 'generation'
        conversationState.approvedStrategy = toolUse.input.approved_strategy

        const strategy = toolUse.input.approved_strategy

        // Media plan components
        const deliverables = [
          'press-release',
          'media-pitch',
          'media-list',
          'qa-document',
          'talking-points',
          'social-post',
          'email'
        ]

        const subject = strategy.subject
        const folder = `${subject.toLowerCase().replace(/\s+/g, '-')}-${new Date().getFullYear()}`
        const contentPieces = []

        // Generate each component via appropriate MCP service
        for (const contentType of deliverables) {
          console.log(`📝 Generating ${contentType}...`)

          try {
            const content = await callMCPService(contentType, {
              organization: orgProfile.organizationName,
              subject: strategy.subject,
              narrative: strategy.narrative || '',
              strategy: conversationState.strategyChosen,
              keyPoints: strategy.key_messages || [],
              targetAudiences: strategy.target_audiences || [],
              mediaTargets: strategy.media_targets || [],
              timeline: strategy.timeline || '',
              research: researchResults?.synthesis || '',
              userPreferences: conversationState.userPreferences,
              conversationContext: conversationState.fullConversation.slice(-5)
            })

            contentPieces.push({
              type: contentType,
              content
            })

            console.log(`✅ ${contentType} generated`)
          } catch (error) {
            console.error(`Error generating ${contentType}:`, error)
            contentPieces.push({
              type: contentType,
              content: null,
              error: `Unable to generate: ${error instanceof Error ? error.message : 'Unknown error'}`
            })
          }
        }

        // Update state to complete
        conversationState.stage = 'complete'

        // Format response
        const generatedContent = contentPieces
          .filter(p => p.content)
          .map(p => ({
            type: p.type,
            content: p.content
          }))

        const errors = contentPieces
          .filter(p => p.error)
          .map(p => ({
            type: p.type,
            error: p.error
          }))

        // Auto-save all content to content_library with folder organization
        const mediaPlanFolder = `media-plans/${folder}`
        console.log(`💾 Auto-saving ${generatedContent.length} pieces to folder: ${mediaPlanFolder}`)

        try {
          // Save strategy document first
          await supabase.from('content_library').insert({
            id: crypto.randomUUID(),
            organization_id: organizationId,
            content_type: 'strategy-document',
            title: `${strategy.subject} - Strategy`,
            content: `# Media Strategy: ${strategy.subject}\n\n## Core Narrative\n${strategy.narrative}\n\n## Target Audiences\n${strategy.target_audiences?.join(', ')}\n\n## Key Messages\n${strategy.key_messages?.map((m: string, i: number) => `${i + 1}. ${m}`).join('\n')}`,
            folder: mediaPlanFolder,
            metadata: {
              subject: strategy.subject,
              strategyChosen: conversationState.strategyChosen,
              mediaPlan: true
            }
          })

          // Save each content piece
          for (const piece of generatedContent) {
            await supabase.from('content_library').insert({
              id: crypto.randomUUID(),
              organization_id: organizationId,
              content_type: piece.type,
              title: `${strategy.subject} - ${piece.type.replace('-', ' ').toUpperCase()}`,
              content: piece.content,
              folder: mediaPlanFolder,
              metadata: {
                subject: strategy.subject,
                mediaPlan: true,
                folder
              }
            })
          }

          console.log(`✅ Auto-saved ${generatedContent.length + 1} items to ${mediaPlanFolder}`)
        } catch (saveError) {
          console.error('❌ Error auto-saving content:', saveError)
        }

        const finalResponse = {
          success: true,
          mode: 'generation_complete',
          message: `✅ Complete media plan created with ${generatedContent.length} pieces and saved to ${folder}`,
          generatedContent,
          errors: errors.length > 0 ? errors : undefined,
          folder: mediaPlanFolder,
          metadata: {
            subject: strategy.subject,
            narrative: strategy.narrative,
            strategy: conversationState.strategyChosen,
            targetAudiences: strategy.target_audiences,
            keyMessages: strategy.key_messages,
            organizationId: orgProfile.organizationName
          },
          conversationId
        }

        console.log('📤 FINAL RESPONSE TO FRONTEND:', JSON.stringify(finalResponse, null, 2))

        return new Response(JSON.stringify(finalResponse), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    // Otherwise return Claude's conversational response
    const responseText = claudeResponseData.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('\n')

    return new Response(JSON.stringify({
      success: true,
      message: responseText,
      mode: 'conversation'
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error('❌ Error:', error)
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})

// Helper: Get Claude's understanding of the request (like orchestrator-robust)
async function getClaudeUnderstanding(
  message: string,
  conversationHistory: any[],
  orgProfile: any,
  conversationState?: ConversationState
): Promise<any> {
  // Extract previously mentioned entities to help resolve pronouns
  const previousEntities = new Set()
  conversationHistory.slice(-5).forEach(msg => {
    if (msg.metadata?.understanding?.entities) {
      msg.metadata.understanding.entities.forEach(e => previousEntities.add(e))
    }
  })

  const currentYear = new Date().getFullYear()
  const currentDate = new Date().toISOString().split('T')[0]

  const currentMonth = new Date().getMonth() + 1 // 1-12
  const nextSuperBowlYear = currentMonth >= 3 ? currentYear + 1 : currentYear // After Feb, next SB is next year

  const understandingPrompt = `You are NIV, a helpful content consultant who assists users with their requests.

**CRITICAL - CURRENT DATE & YEAR AWARENESS:**
- TODAY IS: ${currentDate}
- CURRENT YEAR: ${currentYear}
- CURRENT MONTH: ${new Date().toLocaleString('en-US', { month: 'long' })}
- **YOU MUST INCLUDE "${currentYear}" IN EVERY SEARCH QUERY FOR TOPICS** (prevents old 2024/2023 results)
- Example: NOT "tech event production trends" → CORRECT: "tech event production trends ${currentYear}"
- Example: NOT "AI healthcare market" → CORRECT: "AI healthcare market ${currentYear}"

**CRITICAL - SUPER BOWL TEMPORAL LOGIC:**
- The Super Bowl is ALWAYS in February of the following calendar year
- Next Super Bowl: February ${nextSuperBowlYear} (Super Bowl LX)
- If user mentions "upcoming Super Bowl" or "next Super Bowl", use ${nextSuperBowlYear}
- For research queries: "Super Bowl ${nextSuperBowlYear}" NOT "Super Bowl ${currentYear}"

IMPORTANT: If the user asks for an image (e.g., "create an image of...", "I need a visual of...", "generate an image..."), you should acknowledge that you can help with that. Do NOT refuse or lecture about being a "strategic consultant". Just acknowledge you'll help create the image.

${conversationHistory.length > 0 ? `Recent Conversation:
${conversationHistory.slice(-3).map(msg => `${msg.role === 'user' ? 'User' : 'NIV'}: ${msg.content}`).join('\n')}
` : ''}
${previousEntities.size > 0 ? `
Previously Mentioned Entities: ${Array.from(previousEntities).join(', ')}
(Use these to resolve pronouns like "them", "they", "it" in the current query)
` : ''}

Current User Query: "${message}"
Organization: ${orgProfile.organizationName}
Industry: ${orgProfile.industry}

${conversationState?.researchResults ? `IMPORTANT: Research was already completed for this conversation. You have fresh market data.` : ''}
${conversationState?.strategyChosen ? `IMPORTANT: Strategy was already chosen: "${conversationState.strategyChosen}". User may be confirming to proceed with execution.` : ''}
${conversationState?.approvedStrategy ? `IMPORTANT: Strategy document was already approved. User may be ready to generate content.` : ''}

${conversationHistory.length > 0 && conversationHistory.some((msg: any) => msg.role === 'assistant' && msg.content && msg.content.toLowerCase().includes('option')) ? `IMPORTANT: You already presented strategic options in this conversation. If user is selecting one, DO NOT request fresh research again.` : ''}

Analyze this request to understand what content they need and how to help them:

1. What is the user really asking for?
2. Is this a media plan, presentation, social post, press release, or something else?
3. Do I need fresh market intelligence?

   **Answer NO if ANY of these are true:**
   - Research was already completed (mentioned above)
   - You already presented strategic options in this conversation
   - User is selecting from options you gave
   - Request is for templates, frameworks, or best practices (not current market data)
   - Simple creative requests with no need for external validation (e.g., "write a social post about our new product")

   **Answer YES if:**
   - Creating pitches/proposals that would benefit from target company's recent news, campaigns, or positioning
   - User needs current market data, statistics, or trends they don't already have
   - Request explicitly asks for market analysis, competitive intelligence, or recent news
   - User is asking "what's happening in [market/industry]" or similar research questions
   - Presentations/decks that need data-driven insights or current industry trends

   **Examples:**
   - "Create a pitch to Rocket Mortgage for a Super Bowl activation" → YES (recent Rocket Mortgage campaigns help)
   - "Create a presentation on AI trends in healthcare" → YES (needs current trend data)
   - "Write a social post about our product launch" → NO (user knows their product)
   - "Create talking points for our press release" → NO (user already has the news)

4. What entities (companies, products, people) are mentioned?
5. What topics or themes should I focus on?

**CRITICAL - IF FRESH DATA IS NEEDED, BUILD RESEARCH QUERY:**
- **ALWAYS include "${currentYear}" in topics**
- For "recent/latest": Add "past 2 weeks" or "last month" for precision
- DON'T focus only on "announcements" - tech news breaks via LEAKS, RUMORS, PREVIEWS, API changes
- Example GOOD: "AI healthcare regulations past 30 days ${currentYear}"
- Example GOOD: "tech event spending trends corporate ${currentYear}"
- Example BAD: "AI healthcare" (no timeframe, no year)
- Example BAD: "tech events" (too generic, no year)

Respond with JSON only:
{
  "understanding": {
    "what_user_wants": "brief description of what they're asking for",
    "content_type": "media-plan|presentation|social-post|press-release|image|other",
    "entities": ["companies", "people", "products mentioned"],
    "topics": ["specific topics with ${currentYear} if research needed - be VERY specific"],
    "requires_fresh_data": true/false,
    "why_fresh_data": "explanation if true",
    "search_query": "IF requires_fresh_data is true: complete search query with temporal context and ${currentYear}, OTHERWISE: empty string"
  },
  "approach": {
    "needs_strategy_help": true/false,
    "needs_research": true/false,
    "ready_to_generate": true/false,
    "reasoning": "why this approach makes sense"
  },
  "acknowledgment": "Natural acknowledgment message showing you understand what they want"
}`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 500,
        messages: [{ role: 'user', content: understandingPrompt }]
      })
    })

    if (!response.ok) {
      console.error('Understanding API error:', response.statusText)
      return getDefaultUnderstanding(message)
    }

    const data = await response.json()
    const responseText = data.content[0].text

    // Extract JSON from response - handle malformed backticks
    let jsonText = responseText.trim()
    const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/) ||
                     jsonText.match(/```\s*([\s\S]*?)\s*```/)
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim()
    }

    // Remove any remaining backticks (handles malformed like `` `json`)
    jsonText = jsonText.replace(/`+/g, '').trim()

    const understanding = JSON.parse(jsonText)
    return understanding

  } catch (error) {
    console.error('Understanding error:', error)
    return getDefaultUnderstanding(message)
  }
}

// Helper: Default understanding if Claude fails
function getDefaultUnderstanding(message: string) {
  const lower = message.toLowerCase()

  let content_type = 'other'
  if (lower.includes('media plan')) content_type = 'media-plan'
  else if (lower.includes('presentation') || lower.includes('deck')) content_type = 'presentation'
  else if (lower.includes('social post') || lower.includes('social media')) content_type = 'social-post'
  else if (lower.includes('press release')) content_type = 'press-release'

  return {
    understanding: {
      what_user_wants: message,
      content_type,
      entities: [],
      topics: [],
      requires_fresh_data: lower.includes('latest') || lower.includes('current') || lower.includes('recent') ||
                          lower.includes('public response') || lower.includes('market response') ||
                          lower.includes('reception') || lower.includes('feedback') ||
                          lower.includes('sentiment') || lower.includes('reaction') ||
                          lower.includes('competitive') || lower.includes('competitor') ||
                          lower.includes('market data') || lower.includes('industry trends'),
      why_fresh_data: 'User requested current market/response information'
    },
    approach: {
      needs_strategy_help: content_type === 'media-plan' && !lower.includes('strategy'),
      needs_research: content_type === 'media-plan',
      ready_to_generate: false,
      reasoning: 'Default understanding - parsed from keywords'
    },
    acknowledgment: `I'll help you with that.`
  }
}

// Helper: Get org profile
async function getOrgProfile(organizationId: string, organizationName?: string) {
  // TODO: Fetch from Supabase in the future
  // For now, use the name passed from frontend
  return {
    organizationName: organizationName || organizationId,
    industry: 'Technology',
    competitors: [],
    keywords: [organizationName || organizationId]
  }
}

// Helper: Get quick natural acknowledgment
async function getQuickAcknowledgment(message: string, orgProfile: any): Promise<string> {
  const lower = message.toLowerCase()

  // Media plan
  if (lower.includes('media plan')) {
    const subject = message.match(/for\s+([^.!?,]+)/i)?.[1] || 'your launch'
    return `Got it - I'll help you create a comprehensive media plan for ${subject}. Let me gather market intelligence first.`
  }

  // Presentation
  if (lower.includes('presentation') || lower.includes('deck')) {
    return `I'll help you create a presentation for ${orgProfile.organizationName}.`
  }

  // Social post
  if (lower.includes('social post')) {
    return `I'll help you craft social content for ${orgProfile.organizationName}.`
  }

  // Generic
  return `I'll help you with that for ${orgProfile.organizationName}.`
}

// Helper: Build conversation context for Claude
async function buildConversationContext(
  message: string,
  history: any[],
  orgProfile: any,
  conversationSynthesis?: ConversationSynthesis | null
): Promise<string> {
  let context = `**ORGANIZATION:** ${orgProfile.organizationName}\n`
  context += `**INDUSTRY:** ${orgProfile.industry}\n\n`

  // If we have conversation synthesis (user referenced "what we discussed"), use it
  if (conversationSynthesis) {
    context += `**CONVERSATION SYNTHESIS:**\n`
    context += `Summary: ${conversationSynthesis.summary}\n\n`

    if (conversationSynthesis.keyDecisions.length > 0) {
      context += `**Key Decisions Made:**\n`
      conversationSynthesis.keyDecisions.forEach((decision, i) => {
        context += `${i + 1}. ${decision}\n`
      })
      context += `\n`
    }

    if (conversationSynthesis.concepts.length > 0) {
      context += `**Core Concepts Developed:**\n`
      conversationSynthesis.concepts.forEach((concept, i) => {
        context += `${i + 1}. ${concept}\n`
      })
      context += `\n`
    }

    if (conversationSynthesis.themes.length > 0) {
      context += `**Themes:**\n`
      conversationSynthesis.themes.forEach(theme => {
        context += `- ${theme.theme}: ${theme.description}\n`
      })
      context += `\n`
    }

    context += `**CRITICAL:** The user wants content based on this conversation. Use the synthesis above, not web research.\n\n`
  } else if (history.length > 0) {
    // Standard conversation history (last 5 messages)
    context += `**CONVERSATION HISTORY:**\n`
    history.slice(-5).forEach(msg => {
      context += `${msg.role === 'user' ? 'User' : 'NIV'}: ${msg.content}\n`
    })
    context += `\n`
  }

  context += `**CURRENT REQUEST:** ${message}\n`

  return context
}

// Helper: Detect if research is needed
function detectResearchNeed(message: string, history: any[]): boolean {
  const lower = message.toLowerCase()

  // Media plans always need research if not done yet
  if (lower.includes('media plan') && history.length < 3) {
    return true
  }

  // Presentations about public response, market data, competitive analysis need research
  if ((lower.includes('presentation') || lower.includes('deck')) && history.length < 3) {
    // Check if it's about topics that need factual data
    if (lower.includes('response') || lower.includes('reception') ||
        lower.includes('market') || lower.includes('competitive') ||
        lower.includes('sentiment') || lower.includes('feedback') ||
        lower.includes('adoption') || lower.includes('trends') ||
        lower.includes('analysis') || lower.includes('data')) {
      return true
    }
  }

  // User asking for help with strategy
  if (lower.includes('help') && lower.includes('strategy')) {
    return true
  }

  return false
}

// Helper: Call Claude for natural conversation
async function callClaude(
  context: string,
  research: any,
  orgProfile: any,
  conversationState: ConversationState,
  conversationHistory: any[] = [],
  shouldPresentResearchFirst: boolean = false,
  useStrategyModel: boolean = false
): Promise<any> {
  // Build system prompt with organization context
  const enhancedSystemPrompt = NIV_CONTENT_SYSTEM_PROMPT + `

**ORGANIZATION CONTEXT:**
- Name: ${orgProfile.organizationName}
- Industry: ${orgProfile.industry}

**CONVERSATION STATE:**
- Current stage: ${conversationState.stage}
- Strategy chosen: ${conversationState.strategyChosen || 'none yet'}
- Research completed: ${!!research}

**IMPORTANT:** When the user has chosen a strategy and is ready for content generation, use the generate_media_plan tool. Do NOT write the content yourself - the tool will handle generation via specialized MCP services that create professional-quality deliverables.`

  // Build proper message array from conversation history
  const messages: any[] = []

  // Add conversation history as proper alternating messages
  if (conversationHistory && conversationHistory.length > 0) {
    conversationHistory.forEach(msg => {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })
    })
  }

  // Detect if Claude is stuck in "I'll create..." loop without actually creating
  const recentAssistantMessages = conversationHistory
    .filter(m => m.role === 'assistant')
    .slice(-5) // Look at last 5 assistant messages
    .map(m => typeof m.content === 'string' ? m.content : '')

  const promisesToCreateCount = recentAssistantMessages.filter(content =>
    content.toLowerCase().includes("i'll create") ||
    content.toLowerCase().includes("i'll build") ||
    content.toLowerCase().includes("let me create") ||
    content.toLowerCase().includes("let me build")
  ).length

  // If Claude has said "I'll create..." 2+ times recently, force tool usage with a strong directive
  if (promisesToCreateCount >= 2) {
    console.log(`⚠️ Detected ${promisesToCreateCount} creation promises without action - adding strong directive`)
    context = `${context}

**SYSTEM OVERRIDE:** You have said you would create something ${promisesToCreateCount} times already. The user is frustrated. STOP TALKING and IMMEDIATELY call the appropriate tool (create_presentation_outline, create_strategy_document, generate_image, etc.). Do NOT respond with text - respond ONLY with a tool call. If you respond with text instead of a tool call, you will have failed the user.`
  }

  // Add research context if available as a system injection
  let currentUserMessage = context
  if (research) {
    // Inject research findings for Claude to use in creating slides
    const researchContext = []

    if (research.synthesis) {
      researchContext.push(`**Research Overview:**`)
      researchContext.push(research.synthesis)
      researchContext.push('')  // Empty line for spacing
    }

    if (research.keyFindings && research.keyFindings.length > 0) {
      researchContext.push(`**Sources Found:**`)
      research.keyFindings.forEach((finding: string, i: number) => {
        researchContext.push(`${i + 1}. ${finding}`)
      })
      researchContext.push('')  // Empty line for spacing
    }

    // Different instructions based on whether we should present findings first
    if (shouldPresentResearchFirst) {
      // NOTE: shouldPresentResearchFirst is only true when research actually succeeded
      // If research failed/timed out, we skip presenting research and just continue
      if (research && research.articles && research.articles.length > 0) {
        currentUserMessage = `**RESEARCH COMPLETED**

${researchContext.join('\n')}

**INSTRUCTIONS FOR PRESENTING RESEARCH:**
Your job now is to synthesize these findings into a clear, scannable summary for the user:

1. **Start with a brief context** (1-2 sentences about what you researched)
2. **Present 2-4 key themes/insights** - synthesize the sources above into clear takeaways
3. **Format for readability:**
   - Use clear headers like "Key Trends:", "Market Context:", "Competitive Landscape:"
   - Use bullets or short numbered lists
   - Keep each insight to 1-2 sentences
4. **Then propose 2-3 strategic angles** based on the research
5. **Ask which approach the user prefers**

DO NOT:
- Dump raw source data
- Create the presentation outline yet
- Call any generation tools

Example format:
"I researched [topic]. Here's what I found:

**Key Trends:**
- [Insight 1]
- [Insight 2]
- [Insight 3]

**Strategic Angles:**
1. [Approach 1] - [Why it works]
2. [Approach 2] - [Why it works]

Which resonates with your goals?"

${context}`
      }

    } else {
      currentUserMessage = `**RESEARCH AVAILABLE:**

${researchContext.join('\n')}

Use these sources to inform your response with specific facts, statistics, and insights. Synthesize the findings naturally into your answer.

${context}`
    }
  }

  // Add current message
  messages.push({
    role: 'user',
    content: currentUserMessage
  })

  // Use Sonnet for strategy/research phases (like NIV Advisor), Haiku for simple generation
  // Strategy phases: presenting research, discussing approaches, choosing angles
  // Simple generation: creating single content pieces after decisions are made
  const model = useStrategyModel ? 'claude-sonnet-4-20250514' : 'claude-haiku-4-5-20251001'

  console.log('📤 Sending to Claude:', {
    model: model,
    messageCount: messages.length,
    lastMessage: messages[messages.length - 1].content.substring(0, 100)
  })

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,  // Increased from 2000 - tool calls need more space
      system: enhancedSystemPrompt,
      messages: messages,
      tools: CONTENT_GENERATION_TOOLS
    })
  })

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.statusText}`)
  }

  const data = await response.json()
  return data // Return full response object, not just text
}

// Helper: Simple Firecrawl call for orchestration (no retries, just one call)
async function executeSimpleFirecrawl(query: string, organizationId: string) {
  console.log(`🔥 Simple Firecrawl: "${query.substring(0, 80)}..."`)

  try {
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY') || 'fc-3048810124b640eb99293880a4ab25d0'
    const FIRECRAWL_BASE_URL = 'https://api.firecrawl.dev/v2'

    // Determine timeframe
    let timeframe = 'week'
    const queryLower = query.toLowerCase()
    if (queryLower.match(/breaking|just|today|current|right now|this morning/i)) {
      timeframe = 'current'
    } else if (queryLower.match(/latest|recent|new/i)) {
      timeframe = 'recent'
    } else if (queryLower.match(/this month|past month|market share|revenue|analysis|landscape|positioning/i)) {
      timeframe = 'month'
    }

    const tbsMap: Record<string, string> = {
      'current': 'qdr:h',
      'recent': 'qdr:d3',
      'week': 'qdr:w',
      'month': 'qdr:m',
    }
    const tbs = tbsMap[timeframe] || 'qdr:d3'

    const response = await fetch(`${FIRECRAWL_BASE_URL}/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: query,
        limit: 10,
        tbs,
        scrapeOptions: {
          formats: ['markdown'],
          onlyMainContent: true
        }
      })
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        const webResults = data.data?.web || []
        const newsResults = data.data?.news || []
        const allResults = [...webResults, ...newsResults]

        return allResults.map(result => ({
          title: result.title || 'Untitled',
          description: result.description || '',
          url: result.url,
          content: result.markdown || result.description || '',
          source: {
            name: result.url ? extractSourceName(result.url) : 'Unknown',
            domain: result.url ? extractDomain(result.url) : ''
          },
          publishedAt: result.publishedTime || new Date().toISOString(),
          relevanceScore: result.score || 50
        }))
      }
    }
  } catch (error) {
    console.error(`⚠️ Simple Firecrawl failed:`, error.message)
  }

  return []
}

// Helper: Execute research via Fireplexity (DIRECT - like niv-orchestrator-robust)
async function executeResearch(query: string, organizationId: string) {
  console.log('🔍 Executing research directly via Firecrawl (like NIV Advisor)...')

  // Retry configuration
  const maxRetries = 2
  const retryDelay = 2000 // 2 seconds

  // Determine timeframe based on query intent (from NIV Advisor)
  let timeframe = 'week' // default: past 7 days
  const queryLower = query.toLowerCase()
  if (queryLower.match(/breaking|just|today|current|right now|this morning/i)) {
    timeframe = 'current' // past 24 hours
  } else if (queryLower.match(/latest|recent|new/i)) {
    timeframe = 'recent' // past 3 days
  } else if (queryLower.match(/this week/i)) {
    timeframe = 'week' // past 7 days
  } else if (queryLower.match(/this month|past month|market share|revenue|analysis|landscape|positioning/i)) {
    timeframe = 'month' // past 30 days
  }

  // Map timeframe to tbs parameter
  const tbsMap: Record<string, string> = {
    'current': 'qdr:h',    // Last hour
    'recent': 'qdr:d3',    // Last 3 days
    'week': 'qdr:w',       // Last week
    'month': 'qdr:m',      // Last month
  }
  const tbs = tbsMap[timeframe] || 'qdr:d3'
  console.log(`⏰ Timeframe detected: ${timeframe} (tbs=${tbs})`)

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`🔄 Retry attempt ${attempt}/${maxRetries}`)
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt - 1)))
      }

      // Call Firecrawl DIRECTLY like NIV Advisor does
      const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY') || 'fc-3048810124b640eb99293880a4ab25d0'
      const FIRECRAWL_BASE_URL = 'https://api.firecrawl.dev/v2'

      const response = await fetch(`${FIRECRAWL_BASE_URL}/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: query,
          limit: 10,
          tbs, // Time-based filter
          scrapeOptions: {
            formats: ['markdown'],
            onlyMainContent: true
          }
        })
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        console.error(`Research failed (attempt ${attempt}/${maxRetries}):`, response.status, errorText.substring(0, 200))

        // If 502/503 (server error), retry. If 4xx (client error), don't retry
        if (response.status >= 500 && attempt < maxRetries) {
          console.log(`🔄 Server error ${response.status}, will retry...`)
          continue
        }

        throw new Error(`Research failed: ${response.status}`)
      }

      const data = await response.json()

      // If we got here, research succeeded
      console.log(`✅ Research succeeded on attempt ${attempt}/${maxRetries}`)

      if (data.success) {
        const webResults = data.data?.web || []
        const newsResults = data.data?.news || []
        const allResults = [...webResults, ...newsResults]

        console.log(`✅ Firecrawl complete:`)
        console.log(`   - Web results: ${webResults.length}`)
        console.log(`   - News results: ${newsResults.length}`)
        console.log(`   - Total: ${allResults.length}`)

        // Transform to article format (like NIV Advisor)
        const articles = allResults.map(result => ({
          title: result.title || 'Untitled',
          description: result.description || '',
          url: result.url,
          content: result.markdown || result.description || '',
          source: {
            name: result.url ? extractSourceName(result.url) : 'Unknown',
            domain: result.url ? extractDomain(result.url) : ''
          },
          publishedAt: result.publishedTime || new Date().toISOString(),
          relevanceScore: result.score || 50
        }))

        // Build clean, readable keyFindings
        const keyFindings = articles.slice(0, 5).map(article => {
          const title = (article.title || 'Article')
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s\-\.,&]/g, '')
            .trim()

          const description = (article.description || '')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 200)

          return description
            ? `**${title}** - ${description}${description.length >= 200 ? '...' : ''}`
            : `**${title}**`
        }).filter(f => f)

        console.log(`📊 Research data: ${articles.length} articles, ${keyFindings.length} key findings`)
        if (keyFindings.length > 0) {
          console.log(`📋 Key finding preview: ${keyFindings[0]?.substring(0, 100)}...`)
        } else {
          console.log(`⚠️ No results returned from research!`)
        }

        return {
          articles: articles,
          synthesis: '', // Let Claude synthesize from articles
          keyFindings: keyFindings
        }
      }

    } catch (error) {
      console.error(`⚠️ Research attempt ${attempt}/${maxRetries} failed:`, error.message)

      // If this was the last attempt, return empty results
      if (attempt === maxRetries) {
        console.error('⚠️ All research attempts failed - continuing without research')
        return {
          articles: [],
          synthesis: '',
          keyFindings: []
        }
      }

      // Otherwise, continue to next retry
    }
  }

  // Should never reach here, but just in case
  return {
    articles: [],
    synthesis: '',
    keyFindings: []
  }
}

// Helper: Extract source name from URL
function extractSourceName(url: string): string {
  try {
    const urlObj = new URL(url)
    const domain = urlObj.hostname.replace('www.', '')
    const parts = domain.split('.')
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
  } catch {
    return 'Unknown'
  }
}

// Helper: Extract domain from URL
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace('www.', '')
  } catch {
    return ''
  }
}

// Helper: Call MCP service with full conversation context
async function callMCPServiceWithContext(
  service: string,
  baseParams: any,
  conversationHistory: any[],
  conversationState: ConversationState,
  campaignContext?: any
) {
  // Build context from conversation history, research, and campaign blueprint
  const contentContext = buildContentContext(conversationHistory, conversationState, campaignContext)

  // Merge base params with context
  return await callMCPService(service, {
    ...baseParams,
    narrative: contentContext.narrative,
    positioning: contentContext.positioning,
    research: contentContext.research,
    keyPoints: contentContext.keyPoints
  })
}

// Helper: Extract strategic framework from presentation outline
function extractFrameworkFromOutline(outline: any): {
  narrative: string
  positioning: string
  keyMessages: string[]
  targetAudiences: string[]
  proof_points: string[]
} {
  const framework = {
    narrative: '',
    positioning: '',
    keyMessages: [] as string[],
    targetAudiences: [] as string[],
    proof_points: [] as string[]
  }

  if (!outline) return framework

  // Extract key messages
  if (outline.key_messages && Array.isArray(outline.key_messages)) {
    framework.keyMessages = outline.key_messages
  }

  // Build narrative from topic and purpose
  if (outline.topic && outline.purpose) {
    framework.narrative = `${outline.topic} - ${outline.purpose}`
  }

  // Extract from sections/slides
  if (outline.sections && Array.isArray(outline.sections)) {
    outline.sections.forEach((section: any) => {
      // Look for audience/stakeholder sections
      if (section.title?.toLowerCase().includes('audience') ||
          section.title?.toLowerCase().includes('stakeholder')) {
        if (section.talking_points && Array.isArray(section.talking_points)) {
          framework.targetAudiences.push(...section.talking_points)
        }
      }

      // Look for narrative/positioning sections
      if (section.title?.toLowerCase().includes('narrative') ||
          section.title?.toLowerCase().includes('positioning') ||
          section.title?.toLowerCase().includes('value prop')) {
        if (section.talking_points && Array.isArray(section.talking_points)) {
          if (!framework.positioning) {
            framework.positioning = section.talking_points.join('. ')
          }
        }
      }

      // Look for proof points/differentiation sections
      if (section.title?.toLowerCase().includes('competitive') ||
          section.title?.toLowerCase().includes('differentiation') ||
          section.title?.toLowerCase().includes('proof')) {
        if (section.talking_points && Array.isArray(section.talking_points)) {
          framework.proof_points.push(...section.talking_points)
        }
      }
    })
  }

  console.log('📋 Extracted framework from outline:', {
    hasNarrative: !!framework.narrative,
    hasPositioning: !!framework.positioning,
    keyMessagesCount: framework.keyMessages.length,
    audiencesCount: framework.targetAudiences.length,
    proofPointsCount: framework.proof_points.length
  })

  return framework
}

// Helper: Build context from conversation history and research for content generation
function buildContentContext(
  conversationHistory: any[],
  conversationState: ConversationState,
  campaignContext?: any
): {
  narrative: string
  positioning: string
  research: string
  keyPoints: string[]
} {
  const context = {
    narrative: '',
    positioning: '',
    research: '',
    keyPoints: [] as string[]
  }

  // Extract from campaign context (VECTOR blueprint) if available
  if (campaignContext?.blueprint) {
    const blueprint = campaignContext.blueprint

    // Extract positioning from message architecture or positioning field
    if (blueprint.messageArchitecture?.coreMessage) {
      context.positioning = blueprint.messageArchitecture.coreMessage
    } else if (campaignContext.positioning) {
      context.positioning = campaignContext.positioning
    }

    // Extract narrative from campaign goal or primary objective
    if (blueprint.part1_goalFramework?.primaryObjective) {
      context.narrative = blueprint.part1_goalFramework.primaryObjective
    } else if (campaignContext.campaignGoal) {
      context.narrative = campaignContext.campaignGoal
    }

    // Extract key points from behavioral goals or message frames
    if (blueprint.part1_goalFramework?.behavioralGoals) {
      context.keyPoints = blueprint.part1_goalFramework.behavioralGoals.map((g: any) =>
        g.desiredBehavior || g
      )
    } else if (blueprint.messageArchitecture?.narrativeFrames) {
      context.keyPoints = blueprint.messageArchitecture.narrativeFrames.map((f: any) =>
        f.frame || f
      )
    }

    console.log('📋 Extracted context from campaign blueprint:', {
      hasNarrative: !!context.narrative,
      hasPositioning: !!context.positioning,
      keyPointsCount: context.keyPoints.length
    })
  }

  // Extract research if available (from conversation state)
  if (conversationState.researchResults) {
    const research = conversationState.researchResults
    if (research.synthesis) {
      context.research = research.synthesis
    }
    if (research.keyFindings && research.keyFindings.length > 0) {
      context.keyPoints = [...context.keyPoints, ...research.keyFindings]
    }
  }

  // Extract narrative and positioning from conversation history
  // Look for strategic discussions, presentation outlines, approved strategies
  conversationHistory.forEach(msg => {
    if (msg.role === 'assistant' && msg.content) {
      const content = msg.content.toLowerCase()

      // Look for narrative/positioning discussions
      if (content.includes('narrative') || content.includes('positioning') ||
          content.includes('key message') || content.includes('strategic')) {
        if (!context.narrative && msg.content.length > 100) {
          // Extract substantial assistant responses that discuss strategy
          context.narrative += msg.content.substring(0, 500) + '\n\n'
        }
      }

      // Look for key points in list format
      const bulletPoints = msg.content.match(/^[•\-*]\s+(.+)$/gm)
      if (bulletPoints && bulletPoints.length > 0) {
        bulletPoints.slice(0, 5).forEach(point => {
          const cleaned = point.replace(/^[•\-*]\s+/, '').trim()
          if (cleaned.length > 10 && !context.keyPoints.includes(cleaned)) {
            context.keyPoints.push(cleaned)
          }
        })
      }
    }
  })

  // If we have approved strategy or presentation outline, extract framework from it
  if (conversationState.approvedStrategy) {
    const strategy = conversationState.approvedStrategy

    // Try extracting framework from presentation outline structure
    const extractedFramework = extractFrameworkFromOutline(strategy)

    // Use extracted framework if available, otherwise use direct fields
    if (extractedFramework.narrative) {
      context.narrative = extractedFramework.narrative
    } else if (strategy.narrative) {
      context.narrative = strategy.narrative
    }

    if (extractedFramework.positioning) {
      context.positioning = extractedFramework.positioning
    } else if (strategy.positioning) {
      context.positioning = strategy.positioning
    }

    // Combine key messages from both extraction and direct fields
    if (extractedFramework.keyMessages.length > 0) {
      context.keyPoints = [...context.keyPoints, ...extractedFramework.keyMessages]
    }
    if (strategy.key_messages && Array.isArray(strategy.key_messages)) {
      context.keyPoints = [...context.keyPoints, ...strategy.key_messages]
    }
    if (strategy.keyMessages && Array.isArray(strategy.keyMessages)) {
      context.keyPoints = [...context.keyPoints, ...strategy.keyMessages]
    }

    // Add proof points as additional key points
    if (extractedFramework.proof_points.length > 0) {
      context.keyPoints = [...context.keyPoints, ...extractedFramework.proof_points]
    }
  }

  console.log('📋 Built content context:', {
    hasNarrative: !!context.narrative,
    hasPositioning: !!context.positioning,
    hasResearch: !!context.research,
    keyPointsCount: context.keyPoints.length
  })

  return context
}

// Helper: Detect if user wants to generate content - IMPROVED VERSION
function detectGenerationSignal(
  message: string,
  history: any[],
  claudeResponse: string
): boolean {
  const lower = message.toLowerCase().trim()

  // 1. EXPLICIT AGREEMENT SIGNALS
  const agreementPhrases = [
    'sounds good', 'yes', 'yeah', 'yep', 'sure', 'ok', 'okay',
    'go ahead', 'let\'s do it', 'proceed', 'perfect', 'great',
    'looks good', 'that works', 'approved', 'let\'s go'
  ]

  if (agreementPhrases.some(phrase => lower === phrase || lower.startsWith(phrase + ' '))) {
    console.log('✅ Detected explicit agreement:', message)
    return true
  }

  // 2. OPTION SELECTION BY NUMBER
  if (lower.match(/(?:choose|pick|select|go with|want)?\s*(?:option|strategy|approach)?\s*#?\d+/i)) {
    console.log('✅ Detected numbered option selection:', message)
    return true
  }

  // 3. STRATEGY/APPROACH SELECTION BY NAME
  // Check if NIV offered options in the last few messages
  const recentAssistantMessages = history
    .filter(msg => msg.role === 'assistant')
    .slice(-3) // Last 3 assistant messages

  const hasOfferedOptions = recentAssistantMessages.some(msg => {
    const content = typeof msg.content === 'string' ? msg.content : msg.content?.text || ''
    return content.includes('**Option') ||
           content.includes('approach:') ||
           content.includes('Strategy') ||
           content.match(/\d+\.\s*\*\*/) // Numbered lists with bold text
  })

  if (hasOfferedOptions) {
    // Extract option keywords from assistant messages
    const optionKeywords = new Set<string>()
    recentAssistantMessages.forEach(msg => {
      const content = typeof msg.content === 'string' ? msg.content : msg.content?.text || ''

      // Match patterns like "**Developer-First Approach**" or "1. **Enterprise Focus**"
      const matches = content.matchAll(/\*\*([^*]+?)\s*(?:Approach|Focus|Strategy)\*\*/gi)
      for (const match of matches) {
        optionKeywords.add(match[1].toLowerCase().trim())
      }
    })

    // Check if user message references any of these keywords
    for (const keyword of optionKeywords) {
      if (lower.includes(keyword)) {
        console.log(`✅ Detected strategy selection by name: "${keyword}" in message "${message}"`)
        return true
      }
    }

    // Also check for common strategy patterns
    const strategyPatterns = [
      'approach', 'strategy', 'focus', 'option',
      'developer', 'enterprise', 'mass market', 'creative industry',
      'that one', 'this one', 'first one', 'second one'
    ]

    // User message must contain a strategy pattern AND be relatively short (< 15 words)
    const wordCount = lower.split(/\s+/).length
    if (wordCount <= 15 && strategyPatterns.some(pattern => lower.includes(pattern))) {
      console.log('✅ Detected strategy selection by pattern:', message)
      return true
    }
  }

  // 4. EXPLICIT GENERATION REQUEST
  if (lower.includes('generate') || lower.includes('create it') ||
      lower.includes('make it') || lower.includes('build it')) {
    console.log('✅ Detected explicit generation request:', message)
    return true
  }

  // 5. CONFIRMATION IN CONTEXT
  // If Claude just presented options and user responds with ANY short affirmative message
  const lastAssistantMsg = recentAssistantMessages[recentAssistantMessages.length - 1]
  if (lastAssistantMsg) {
    const lastContent = typeof lastAssistantMsg.content === 'string'
      ? lastAssistantMsg.content
      : lastAssistantMsg.content?.text || ''

    const askedForChoice = lastContent.toLowerCase().includes('which') ||
                          lastContent.toLowerCase().includes('choose') ||
                          lastContent.toLowerCase().includes('select') ||
                          lastContent.includes('?')

    const shortAffirmative = lower.split(/\s+/).length <= 10 &&
                            (lower.includes('first') || lower.includes('developer') ||
                             lower.includes('enterprise') || lower.includes('mass'))

    if (askedForChoice && shortAffirmative) {
      console.log('✅ Detected contextual confirmation after option presentation:', message)
      return true
    }
  }

  console.log('❌ No generation signal detected in:', message)
  return false
}

// Helper: Route content generation to appropriate MCP service
// Helper: Use NIV's intelligence to craft strategic content briefs
async function craftStrategicContentBrief(context: any): Promise<string> {
  const {
    contentType,
    stakeholder,
    purpose,
    phase,
    objective,
    narrative,
    keyMessages,
    researchInsights,
    positioning,
    organization,
    specificGuidance,
    campaignSummary,  // NEW: Use campaign summary if available
    currentDate
  } = context

  // If we have a campaign summary, use it as the primary context source
  const contextPrompt = campaignSummary
    ? `
CAMPAIGN SUMMARY (ONE SOURCE OF TRUTH):
- Organization: ${campaignSummary.organizationName}
- Industry: ${campaignSummary.industry}
- Campaign Goal: ${campaignSummary.campaignGoal}
- Positioning: ${campaignSummary.positioning}
- Core Narrative: ${campaignSummary.coreNarrative}

KEY MESSAGES (CAMPAIGN-WIDE):
${campaignSummary.keyMessages?.map((msg: string) => `- ${msg}`).join('\n')}

RESEARCH INSIGHTS (TOP FINDINGS):
${campaignSummary.researchInsights?.map((insight: string) => `- ${insight}`).join('\n')}

${phase ? `
PHASE-SPECIFIC CONTEXT (${phase.toUpperCase()}):
${campaignSummary.phases?.find((p: any) => p.phase.toLowerCase() === phase.toLowerCase()) ? `
- Objective: ${campaignSummary.phases.find((p: any) => p.phase.toLowerCase() === phase.toLowerCase()).objective}
- Narrative: ${campaignSummary.phases.find((p: any) => p.phase.toLowerCase() === phase.toLowerCase()).narrative}
- Phase Messages: ${campaignSummary.phases.find((p: any) => p.phase.toLowerCase() === phase.toLowerCase()).keyMessages?.join('; ')}
` : `- Objective: ${objective}`}
` : ''}
`
    : `
CAMPAIGN CONTEXT:
- Organization: ${organization}
- Campaign Phase: ${phase} (Objective: ${objective})
- Positioning: ${positioning}
- Core Narrative: ${narrative}

KEY MESSAGES:
${keyMessages?.map((msg: string) => `- ${msg}`).join('\n')}

RESEARCH INSIGHTS:
${Array.isArray(researchInsights) && researchInsights.length > 0 ? researchInsights.map((insight: string) => `- ${insight}`).join('\n') : 'None provided'}
`

  const briefPrompt = `You are NIV, a Senior Strategic Content Consultant.

**TODAY'S DATE:** ${currentDate || new Date().toISOString().split('T')[0]}

${contextPrompt}

CONTENT REQUIREMENT:
Create a ${contentType} for ${stakeholder}
Purpose: ${purpose}
${specificGuidance?.length > 0 ? `Specific Points to Cover:\n${specificGuidance.map((point: string) => `- ${point}`).join('\n')}` : ''}

YOUR TASK:
Craft a concise but strategically rich content brief (2-3 sentences) that a content generator should use to create this ${contentType}. The brief should:
1. Integrate the core narrative seamlessly
2. Reference 1-2 most relevant key messages
3. Include the most compelling research insight if available
4. Establish the positioning clearly
5. Be specific to ${stakeholder} needs
6. Avoid generic tech clichés
7. Use current/timely references where appropriate (today is ${currentDate})

Write ONLY the brief, nothing else. Make it compelling and strategic.`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 300,
        temperature: 0.7,
        messages: [{
          role: 'user',
          content: briefPrompt
        }]
      })
    })

    if (!response.ok) {
      console.error('Failed to craft strategic brief, using fallback')
      return `${purpose} for ${stakeholder} - ${narrative}`
    }

    const data = await response.json()
    const brief = data.content[0].text.trim()
    return brief
  } catch (error) {
    console.error('Error crafting strategic brief:', error)
    return `${purpose} for ${stakeholder} - ${narrative}`
  }
}

// Helper: Normalize content type names to match MCP routing
function normalizeContentTypeForMCP(rawType: string): string {
  const normalized = rawType
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')  // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, '')  // Remove non-alphanumeric except hyphens

  // Map common variations to standard types
  const typeMap: Record<string, string> = {
    'case-study': 'case-study',
    'white-paper': 'white-paper',
    'whitepaper': 'white-paper',
    'social-media-post': 'social-post',
    'social-post': 'social-post',
    'blog-post': 'blog-post',
    'blogpost': 'blog-post',
    'media-pitch': 'media-pitch',
    'mediapitch': 'media-pitch',
    'press-release': 'press-release',
    'thought-leadership': 'thought-leadership',
    'executive-statement': 'executive-statement',
    'executive-brief': 'executive-brief',
    'qa-document': 'qa-document',
    'talking-points': 'talking-points',
    'email-campaign': 'email-campaign',
    'roi-calculator-tool': 'thought-leadership',
    'roi-calculator': 'thought-leadership',
    'calculator': 'thought-leadership'
  }

  return typeMap[normalized] || normalized
}

// NEW: Direct content generation using Claude (bypasses MCP)
async function generateContentDirectly(contentType: string, strategicBrief: string, parameters: any): Promise<string> {
  const normalizedType = normalizeContentTypeForMCP(contentType)

  console.log(`🎨 Generating ${normalizedType} directly with Claude (bypassing MCP)...`)

  // Extract context
  const fullFramework = parameters.fullFramework || {}
  const organization = parameters.organization || 'Organization'
  const currentDate = parameters.currentDate || new Date().toISOString().split('T')[0]
  const narrative = fullFramework.narrative || parameters.narrative || ''
  const keyMessages = fullFramework.keyMessages || parameters.keyPoints || []
  const researchInsights = fullFramework.researchInsights || []
  const positioning = fullFramework.positioning || parameters.positioning || ''
  const phase = fullFramework.phase || ''
  const objective = fullFramework.objective || ''
  const targetAudiences = parameters.targetAudiences || []

  // Build comprehensive prompt based on content type
  const contentPrompts: Record<string, string> = {
    'blog-post': `Write a compelling, strategic blog post for ${organization}:

**TODAY'S DATE:** ${currentDate}

**STRATEGIC BRIEF:**
${strategicBrief}

**CAMPAIGN CONTEXT:**
${narrative ? `Core Narrative: ${narrative}` : ''}
${positioning ? `Positioning: ${positioning}` : ''}
${phase ? `Campaign Phase: ${phase}` : ''}
${objective ? `Phase Objective: ${objective}` : ''}

**KEY MESSAGES TO WEAVE IN:**
${keyMessages.length > 0 ? keyMessages.map((msg: string) => `- ${msg}`).join('\n') : '- Innovation and thought leadership'}

${researchInsights.length > 0 ? `**RESEARCH INSIGHTS TO REFERENCE:**\n${researchInsights.slice(0, 5).map((insight: string) => `- ${insight}`).join('\n')}` : ''}

${targetAudiences.length > 0 ? `**TARGET AUDIENCE:**\n${targetAudiences[0]}` : ''}

**REQUIREMENTS:**
- Length: 800-1200 words
- Use the strategic brief as your foundation
- Integrate key messages naturally
- Reference research insights with specific data
- Align with the campaign narrative and positioning
- Write with authority and expertise
- Include specific details, NOT generic platitudes
- Make it timely and relevant to ${currentDate}
- Include subheadings for readability
- End with a compelling call-to-action

Write ONLY the blog post content. No meta-commentary.`,

    'social-post': `Create ${parameters.variations || 3} distinct, platform-specific social media posts:

**TODAY'S DATE:** ${currentDate}

**STRATEGIC BRIEF:**
${strategicBrief}

**CAMPAIGN CONTEXT:**
${narrative ? `Core Narrative: ${narrative}` : ''}
${positioning ? `Positioning: ${positioning}` : ''}

**KEY MESSAGES:**
${keyMessages.length > 0 ? keyMessages.map((msg: string) => `- ${msg}`).join('\n') : '- Innovation and impact'}

**PLATFORMS:** ${parameters.platforms?.join(', ') || 'Twitter, LinkedIn, Facebook'}

**CRITICAL PLATFORM-SPECIFIC REQUIREMENTS:**

FOR TWITTER/X:
- Maximum 280 characters per post
- Punchy, concise language
- Strong hook in first 10 words
- Optional emoji usage (1-2 max)
${parameters.includeHashtags ? '- 1-2 relevant hashtags at end' : '- No hashtags'}
- Thread-friendly if needed (but each tweet stands alone)

FOR LINKEDIN:
- Professional tone
- 150-300 words optimal (can go longer for thought leadership)
- Start with compelling hook or question
- Include line breaks for readability
- Can include personal insights or story
${parameters.includeHashtags ? '- 3-5 relevant hashtags at end' : '- No hashtags'}
- Professional emoji usage acceptable (minimal)

FOR FACEBOOK:
- Conversational, friendly tone
- 100-250 words
- Engaging question or hook
- Personal and relatable
${parameters.includeHashtags ? '- 2-3 relevant hashtags' : '- No hashtags'}

FOR INSTAGRAM:
- Visual-first mindset
- 125-150 words caption
- Engaging storytelling
- Multiple line breaks
${parameters.includeHashtags ? '- 10-15 relevant hashtags (mix of popular and niche)' : '- No hashtags'}

**GENERAL REQUIREMENTS:**
- Create ${parameters.variations || 3} GENUINELY DIFFERENT posts
- Each must have unique angle, not just reworded
- Align with strategic brief and key messages
- Include compelling hooks
- Reference current context (${currentDate})
- Platform voice must match channel

**OUTPUT FORMAT:**

Platform: [Platform Name]
---
[Actual post content respecting character limits]
---

Platform: [Platform Name]
---
[Actual post content respecting character limits]
---

Platform: [Platform Name]
---
[Actual post content respecting character limits]
---

Write ONLY the posts. No explanations. STRICTLY respect character limits.`,

    'media-pitch': `Write a compelling, personalized media pitch email:

**TODAY'S DATE:** ${currentDate}

**STRATEGIC BRIEF:**
${strategicBrief}

**CAMPAIGN CONTEXT:**
${narrative ? `Core Narrative: ${narrative}` : ''}
${positioning ? `Positioning: ${positioning}` : ''}

**KEY MESSAGES:**
${keyMessages.length > 0 ? keyMessages.map((msg: string) => `- ${msg}`).join('\n') : ''}

${researchInsights.length > 0 ? `**SUPPORTING DATA:**\n${researchInsights.slice(0, 3).map((insight: string) => `- ${insight}`).join('\n')}` : ''}

${parameters.journalists?.length > 0 ? `**RECIPIENT JOURNALISTS:**\n${parameters.journalists.join(', ')}` : ''}

**REQUIREMENTS:**
- Personalize to journalist's beat
- Lead with newsworthy angle
- Include specific data and proof points
- Reference research insights
- Align with strategic brief
- Explain why this matters NOW (${currentDate})
- Keep concise (150-250 words)
- Include compelling subject line
- Professional tone

Format:
Subject: [Subject Line]

[Email Body]

Write ONLY the pitch email.`,

    'case-study': `Write a detailed, evidence-based case study:

**TODAY'S DATE:** ${currentDate}

**STRATEGIC BRIEF:**
${strategicBrief}

**CAMPAIGN CONTEXT:**
${narrative ? `Core Narrative: ${narrative}` : ''}
${positioning ? `Positioning: ${positioning}` : ''}

**KEY MESSAGES TO DEMONSTRATE:**
${keyMessages.length > 0 ? keyMessages.map((msg: string) => `- ${msg}`).join('\n') : ''}

${researchInsights.length > 0 ? `**PROOF POINTS/DATA:**\n${researchInsights.slice(0, 5).map((insight: string) => `- ${insight}`).join('\n')}` : ''}

**REQUIREMENTS:**
- Length: 1000-1500 words
- Follow standard format: Challenge → Solution → Results
- Include specific, measurable outcomes
- Use concrete data and metrics from research insights
- Tell a compelling story
- Align with strategic brief and key messages
- Include customer quotes (realistic examples)
- Professional tone
- Make results specific and credible

Write ONLY the case study content.`,

    'white-paper': `Write a comprehensive, authoritative white paper:

**TODAY'S DATE:** ${currentDate}

**STRATEGIC BRIEF:**
${strategicBrief}

**CAMPAIGN CONTEXT:**
${narrative ? `Core Narrative: ${narrative}` : ''}
${positioning ? `Positioning: ${positioning}` : ''}

**KEY POINTS TO COVER:**
${keyMessages.length > 0 ? keyMessages.map((msg: string) => `- ${msg}`).join('\n') : ''}

${researchInsights.length > 0 ? `**RESEARCH FINDINGS:**\n${researchInsights.slice(0, 8).map((insight: string) => `- ${insight}`).join('\n')}` : ''}

${targetAudiences.length > 0 ? `**TARGET AUDIENCE:**\n${targetAudiences[0]}` : ''}

**REQUIREMENTS:**
- Length: 2000-3000 words
- Executive summary at start
- Clear problem/opportunity statement
- Thorough analysis with data
- Evidence-based recommendations
- Reference research insights and data
- Technical depth appropriate for audience
- Include section headings
- Cite credible sources
- Align with strategic brief and positioning

Write ONLY the white paper content.`,

    'press-release': `Write a professional press release in proper AP format:

**TODAY'S DATE:** ${currentDate}

**STRATEGIC BRIEF:**
${strategicBrief}

**CAMPAIGN CONTEXT:**
${narrative ? `Core Narrative: ${narrative}` : ''}
${positioning ? `Positioning: ${positioning}` : ''}

**KEY MESSAGES:**
${keyMessages.length > 0 ? keyMessages.map((msg: string) => `- ${msg}`).join('\n') : ''}

**STRICT FORMAT REQUIREMENTS - MUST FOLLOW EXACTLY:**

1. FOR IMMEDIATE RELEASE header
2. CITY, STATE – Date (${currentDate}) format dateline
3. Bold, compelling headline in title case
4. Italicized subheadline expanding on headline
5. Strong lede paragraph covering who, what, when, where, why
6. Body paragraphs with supporting details and context
7. Executive quote in this format:
   "Quote content," said [Name], [Title] at [Organization]. "Continuation of quote if needed."
8. Additional data points and details
9. Professional boilerplate paragraph starting with "About [Organization]:"
10. Contact information:
    Media Contact:
    [Name]
    [Title]
    [Email]
    [Phone]
11. ### (three hash marks) centered at end to indicate end of release

**STYLE:**
- AP style throughout
- Third person only
- 400-600 words
- Newsworthy angle
- Timely relevance to ${currentDate}

Write the complete press release with ALL required elements in proper format.`,

    'thought-leadership': `Write an authoritative thought leadership article:

**TODAY'S DATE:** ${currentDate}

**STRATEGIC BRIEF:**
${strategicBrief}

**CAMPAIGN CONTEXT:**
${narrative ? `Core Narrative: ${narrative}` : ''}
${positioning ? `Positioning: ${positioning}` : ''}

**KEY INSIGHTS:**
${keyMessages.length > 0 ? keyMessages.map((msg: string) => `- ${msg}`).join('\n') : ''}

${researchInsights.length > 0 ? `**RESEARCH/TRENDS:**\n${researchInsights.slice(0, 5).map((insight: string) => `- ${insight}`).join('\n')}` : ''}

**REQUIREMENTS:**
- Length: 1200-1800 words
- Compelling hook
- Unique perspective
- Challenge conventional thinking
- Include data and trends
- Provide actionable insights
- Authoritative voice
- Align with strategic brief
- Reference current market context (${currentDate})

Write ONLY the thought leadership content.`
  }

  const prompt = contentPrompts[normalizedType] || contentPrompts['blog-post']

  // Content-type-specific timeouts (in milliseconds)
  const timeoutDurations: Record<string, number> = {
    'thought-leadership': 150000,  // 150s - long-form content
    'case-study': 150000,          // 150s - detailed narrative
    'white-paper': 180000,         // 180s - comprehensive technical
    'blog-post': 120000,           // 120s - medium-form
    'media-pitch': 60000,          // 60s - short, focused
    'social-post': 60000,          // 60s - brief
    'press-release': 90000         // 90s - structured format
  }
  const timeoutMs = timeoutDurations[normalizedType] || 90000

  let timeoutId: number | undefined
  try {
    // Call Claude directly with content-type-specific timeout
    const controller = new AbortController()
    timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 16000,
        temperature: 0.7,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Claude API failed for ${normalizedType}:`, response.status, errorText)
      throw new Error(`Content generation failed: ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.content[0].text

    console.log(`✅ Generated ${normalizedType} directly (${content.length} chars)`)
    return content

  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutSeconds = Math.round(timeoutMs / 1000)
      console.error(`⏱️ Claude API timed out for ${normalizedType} after ${timeoutSeconds} seconds`)
      throw new Error(`Content generation timed out for ${normalizedType}`)
    }

    console.error(`❌ Error generating ${normalizedType}:`, error)
    throw error
  }
}

async function callMCPService(contentType: string, parameters: any): Promise<string> {
  // Normalize content type first
  const normalizedType = normalizeContentTypeForMCP(contentType)

  // Map content types to MCP services (like niv-content-robust)
  const routing: Record<string, { service: string; tool: string }> = {
    'press-release': { service: 'mcp-content', tool: 'press-release' },
    'blog-post': { service: 'mcp-content', tool: 'blog-post' },
    'media-pitch': { service: 'mcp-content', tool: 'media-pitch' },
    'media-list': { service: 'mcp-content', tool: 'media-list' },
    'qa-document': { service: 'mcp-content', tool: 'qa-document' },
    'talking-points': { service: 'mcp-content', tool: 'talking-points' },
    'social-post': { service: 'mcp-content', tool: 'social-post' },
    'email': { service: 'mcp-content', tool: 'email-campaign' },
    'email-campaign': { service: 'mcp-content', tool: 'email-campaign' },
    'thought-leadership': { service: 'mcp-content', tool: 'thought-leadership' },
    'case-study': { service: 'mcp-content', tool: 'case-study' },
    'white-paper': { service: 'mcp-content', tool: 'white-paper' },
    'executive-statement': { service: 'mcp-content', tool: 'executive-statement' },
    'executive-brief': { service: 'mcp-content', tool: 'executive-statement' }
  }

  const route = routing[normalizedType]
  if (!route) {
    console.warn(`⚠️ Unknown content type: "${contentType}" (normalized to "${normalizedType}")`)
    throw new Error(`Unknown content type: ${contentType}`)
  }

  console.log(`📡 Calling ${route.service} with tool: ${route.tool}`)
  console.log(`   Context preview:`, {
    narrative: parameters.narrative?.substring(0, 100),
    positioning: parameters.positioning?.substring(0, 100),
    research: parameters.research?.substring(0, 100),
    hasFullFramework: !!parameters.fullFramework,
    keyPoints: parameters.keyPoints?.length || 0
  })

  let timeoutId: number | undefined
  try {
    // Create timeout controller - 90 seconds max for content generation
    // (Complex content needs more time than 30s)
    const controller = new AbortController()
    timeoutId = setTimeout(() => controller.abort(), 90000)

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/${route.service}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        },
        signal: controller.signal,
        body: JSON.stringify({
          tool: route.tool,
          parameters: {
            company: parameters.organization || 'Organization',
            organization: parameters.organization || 'Organization',
            announcement: parameters.subject || parameters.topic || 'Product Announcement',
            subject: parameters.subject || parameters.topic || 'Product Announcement',
            topic: parameters.topic || parameters.subject || parameters.message || '',
            message: parameters.message || parameters.topic || parameters.subject || '',
            angle: parameters.angle || '',
            narrative: parameters.narrative || parameters.angle || '',
            keyPoints: parameters.keyPoints || [],
            keyMessages: parameters.keyPoints || [],
            research: parameters.research || '',
            industry: parameters.industry || 'technology',
            strategy: parameters.strategy || parameters.angle || '',
            tone: parameters.tone || 'professional',

            // Social media specific parameters
            platforms: parameters.platforms || undefined,
            includeHashtags: parameters.includeHashtags !== undefined ? parameters.includeHashtags : true,
            includeEmojis: parameters.includeEmojis !== undefined ? parameters.includeEmojis : false,

            // Pass through complete framework data for maximum context
            proof_points: parameters.proof_points || [],
            rationale: parameters.rationale || parameters.angle || '',
            target_audiences: parameters.targetAudiences || parameters.target_audiences || [],
            media_targets: parameters.mediaTargets || parameters.media_targets || {},
            timeline: parameters.timeline || {},

            // Pass full framework for evidence-based content types
            fullFramework: parameters.fullFramework || null,
            contentStrategy: parameters.contentStrategy || null,
            executionPlan: parameters.executionPlan || null,

            context: {
              strategy: {
                keyMessages: parameters.keyPoints || [],
                primaryMessage: parameters.message || parameters.topic || parameters.subject || 'Product Announcement',
                narrative: parameters.narrative || parameters.angle || '',
                objective: parameters.topic || parameters.subject || parameters.narrative || '',
                proof_points: parameters.proof_points || [],
                rationale: parameters.rationale || parameters.angle || '',
                target_audiences: parameters.targetAudiences || parameters.target_audiences || []
              },
              organization: {
                name: parameters.organization || 'Organization',
                industry: parameters.industry || 'technology'
              },
              event: parameters.subject || parameters.topic || 'Product Announcement',
              // Include full strategic context for evidence-based content
              fullContext: parameters.fullFramework || null
            }
          }
        })
      }
    )

    // Clear timeout on success
    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`${route.service} failed:`, response.status, errorText)
      throw new Error(`${route.service} failed: ${response.statusText}`)
    }

    const data = await response.json()
    console.log(`✅ ${route.service} responded successfully for ${route.tool}`)
    return data.content || data.result || data.text || '[Content generated but format unknown]'
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId)

    if (error.name === 'AbortError') {
      console.error(`⏱️ ${route.service} timed out after 30 seconds for ${route.tool}`)
      throw new Error(`Content generation timed out for ${contentType}`)
    }

    console.error(`Error calling ${route.service} for ${route.tool}:`, error)
    throw error
  }
}

// Helper: Extract subject from conversation
function extractSubject(history: any[], currentMessage: string): string {
  const allText = [...history.map(h => h.content), currentMessage].join(' ')
  const match = allText.match(/(?:for|about|launch of)\s+([A-Z][a-zA-Z0-9\s]+?)(?:\s+launch|\s+announcement|\.|\,|$)/i)
  return match ? match[1].trim() : 'the product'
}

// Helper: Extract narrative from conversation
function extractNarrative(history: any[], currentMessage: string): string {
  // Look for chosen strategy or narrative mentions
  const allText = [...history.map(h => h.content), currentMessage].join(' ')

  if (allText.includes('Mass Market') || allText.includes('mass market')) {
    return 'broad consumer and tech media appeal'
  }
  if (allText.includes('Enterprise') || allText.includes('enterprise')) {
    return 'enterprise innovation and business value'
  }
  if (allText.includes('Creative Industry') || allText.includes('creative')) {
    return 'creative industry transformation'
  }
  if (allText.includes('Developer') || allText.includes('developer')) {
    return 'developer empowerment and technical excellence'
  }

  return 'innovative technology advancement'
}

// Helper: Extract strategy choice from conversation
function extractStrategyChoice(history: any[], currentMessage: string): string {
  const allText = [...history.map(h => h.content), currentMessage].join(' ').toLowerCase()

  if (allText.includes('developer first') || allText.includes('developer-first')) {
    return 'Developer-First Approach'
  }
  if (allText.includes('mass market')) {
    return 'Mass Market Approach'
  }
  if (allText.includes('enterprise focus') || allText.includes('enterprise-focus')) {
    return 'Enterprise Focus'
  }
  if (allText.includes('creative industry')) {
    return 'Creative Industry Approach'
  }

  // Try to extract from recent messages
  const recentMessages = history.slice(-3).map(h => h.content).join(' ')
  const strategyMatch = recentMessages.match(/\*\*([^*]+?)\s*(?:Approach|Focus|Strategy)\*\*/i)
  if (strategyMatch) {
    return strategyMatch[1].trim() + ' Approach'
  }

  return 'Strategic Approach'
}
