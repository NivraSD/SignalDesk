// Version: 1.0.1 - Fixed social posts tool
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || Deno.env.get('CLAUDE_API_KEY')!;
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Helper function to call Anthropic API directly
async function callAnthropic(messages: any[], maxTokens: number = 1500) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      temperature: 0.5,
      messages
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${error}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

// Content generation tools
const TOOLS = [
  {
    name: "generate_press_release",
    description: "Generate a professional press release",
    inputSchema: {
      type: "object",
      properties: {
        headline: { type: "string", description: "Press release headline" },
        subheadline: { type: "string", description: "Supporting subheadline" },
        keyPoints: {
          type: "array",
          items: { type: "string" },
          description: "Key points to include"
        },
        quotes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              speaker: { type: "string" },
              title: { type: "string" },
              quote: { type: "string" }
            }
          },
          description: "Executive quotes"
        },
        boilerplate: { type: "string", description: "Company boilerplate" },
        tone: {
          type: "string",
          enum: ["formal", "conversational", "technical", "exciting"],
          default: "formal"
        }
      },
      required: ["headline", "keyPoints"]
    }
  },
  {
    name: "generate_blog_post",
    description: "Generate an engaging blog post",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Blog post title" },
        topic: { type: "string", description: "Main topic" },
        outline: {
          type: "array",
          items: { type: "string" },
          description: "Content outline"
        },
        targetAudience: { type: "string", description: "Target audience" },
        wordCount: { type: "number", description: "Target word count", default: 800 },
        style: {
          type: "string",
          enum: ["educational", "thought_leadership", "how_to", "news_analysis"],
          default: "educational"
        },
        includeCTA: { type: "boolean", description: "Include call-to-action", default: true }
      },
      required: ["title", "topic"]
    }
  },
  {
    name: "generate_social_posts",
    description: "Generate platform-optimized social media posts (use generate_twitter_post or generate_instagram_post for those specific platforms)",
    inputSchema: {
      type: "object",
      properties: {
        message: { type: "string", description: "Core message" },
        platforms: {
          type: "array",
          items: { type: "string" },
          enum: ["twitter", "linkedin", "instagram", "facebook", "tiktok"],
          description: "Target platforms"
        },
        variations: { type: "number", description: "Number of variations", default: 3 },
        includeHashtags: { type: "boolean", default: true },
        includeEmojis: { type: "boolean", default: false },
        thread: { type: "boolean", description: "Create thread for Twitter", default: false }
      },
      required: ["message", "platforms"]
    }
  },
  {
    name: "generate_twitter_post",
    description: "Generate Twitter/X posts with proper character limits and formatting",
    inputSchema: {
      type: "object",
      properties: {
        message: { type: "string", description: "Core message or topic" },
        keyMessages: { type: "array", items: { type: "string" }, description: "Key points to include" },
        tone: { type: "string", enum: ["professional", "casual", "bold", "witty"], default: "professional" },
        includeHashtags: { type: "boolean", default: true },
        thread: { type: "boolean", description: "Create as a thread (3-5 tweets)", default: false },
        variations: { type: "number", description: "Number of variations", default: 3 }
      },
      required: ["message"]
    }
  },
  {
    name: "generate_instagram_post",
    description: "Generate Instagram post captions with optimal formatting and hashtags",
    inputSchema: {
      type: "object",
      properties: {
        message: { type: "string", description: "Core message or topic" },
        keyMessages: { type: "array", items: { type: "string" }, description: "Key points to include" },
        tone: { type: "string", enum: ["engaging", "professional", "inspirational", "educational"], default: "engaging" },
        includeHashtags: { type: "boolean", default: true },
        carousel: { type: "boolean", description: "Format as carousel post (5-7 slides)", default: false },
        variations: { type: "number", description: "Number of variations", default: 3 }
      },
      required: ["message"]
    }
  },
  {
    name: "generate_email_campaign",
    description: "Generate email campaign content",
    inputSchema: {
      type: "object",
      properties: {
        campaignType: {
          type: "string",
          enum: ["announcement", "newsletter", "promotional", "educational", "invitation"],
          description: "Type of email campaign"
        },
        subject: { type: "string", description: "Email subject line" },
        preheader: { type: "string", description: "Email preheader text" },
        mainMessage: { type: "string", description: "Main message" },
        audience: { type: "string", description: "Target audience segment" },
        personalization: { type: "boolean", description: "Include personalization", default: true },
        includeImages: { type: "boolean", description: "Include image placeholders", default: true }
      },
      required: ["campaignType", "subject", "mainMessage"]
    }
  },
  {
    name: "generate_executive_talking_points",
    description: "Generate talking points for executives",
    inputSchema: {
      type: "object",
      properties: {
        occasion: {
          type: "string",
          enum: ["interview", "conference", "earnings_call", "internal_meeting", "podcast"],
          description: "Speaking occasion"
        },
        topic: { type: "string", description: "Main topic" },
        audience: { type: "string", description: "Audience description" },
        duration: { type: "number", description: "Duration in minutes" },
        keyMessages: {
          type: "array",
          items: { type: "string" },
          description: "Key messages to convey"
        },
        anticipatedQuestions: {
          type: "array",
          items: { type: "string" },
          description: "Anticipated questions"
        }
      },
      required: ["occasion", "topic", "keyMessages"]
    }
  },
  {
    name: "generate_thought_leadership",
    description: "Generate thought leadership content",
    inputSchema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "Main topic or theme" },
        keyPoints: {
          type: "array",
          items: { type: "string" },
          description: "Key insights and points to cover"
        },
        perspective: { type: "string", description: "Unique perspective or angle" },
        industry: { type: "string", description: "Target industry" },
        wordCount: { type: "number", description: "Target word count", default: 1200 },
        tone: {
          type: "string",
          enum: ["authoritative", "visionary", "analytical", "provocative"],
          default: "authoritative"
        }
      },
      required: ["topic", "keyPoints"]
    }
  },
  {
    name: "generate_case_study",
    description: "Generate customer case study or success story",
    inputSchema: {
      type: "object",
      properties: {
        customer: { type: "string", description: "Customer/client name" },
        industry: { type: "string", description: "Customer industry" },
        challenge: { type: "string", description: "Problem or challenge faced" },
        solution: { type: "string", description: "How the solution helped" },
        results: {
          type: "array",
          items: { type: "string" },
          description: "Measurable results and outcomes"
        },
        proof_points: {
          type: "array",
          items: { type: "string" },
          description: "Evidence and data points"
        },
        quote: { type: "string", description: "Customer quote" },
        wordCount: { type: "number", description: "Target word count", default: 1000 },
        tone: {
          type: "string",
          enum: ["professional", "inspiring", "data_driven", "storytelling"],
          default: "professional"
        }
      },
      required: ["customer", "challenge", "solution"]
    }
  },
  {
    name: "generate_white_paper",
    description: "Generate technical white paper or research document",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "White paper title" },
        topic: { type: "string", description: "Main topic or research area" },
        keyPoints: {
          type: "array",
          items: { type: "string" },
          description: "Main points and findings to cover"
        },
        targetAudience: { type: "string", description: "Target audience (e.g., 'technical decision makers')" },
        sections: {
          type: "array",
          items: { type: "string" },
          description: "Main sections to include"
        },
        industry: { type: "string", description: "Target industry" },
        technicalLevel: {
          type: "string",
          enum: ["beginner", "intermediate", "advanced", "expert"],
          default: "intermediate"
        },
        wordCount: { type: "number", description: "Target word count", default: 2500 }
      },
      required: ["title", "topic", "keyPoints"]
    }
  },
  {
    name: "generate_qa_document",
    description: "Generate Q&A document or FAQ",
    inputSchema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "Main topic" },
        questions: {
          type: "array",
          items: { type: "string" },
          description: "List of questions to answer"
        },
        audience: { type: "string", description: "Target audience" },
        style: {
          type: "string",
          enum: ["technical", "conversational", "formal", "simple"],
          default: "conversational"
        }
      },
      required: ["topic"]
    }
  },
  {
    name: "generate_executive_statement",
    description: "Generate executive statement or communication",
    inputSchema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "Topic or announcement" },
        keyPoints: {
          type: "array",
          items: { type: "string" },
          description: "Key points to communicate"
        },
        executiveName: { type: "string", description: "Executive name" },
        executiveTitle: { type: "string", description: "Executive title" },
        tone: {
          type: "string",
          enum: ["confident", "empathetic", "decisive", "optimistic", "serious"],
          default: "confident"
        },
        audience: {
          type: "string",
          enum: ["employees", "investors", "customers", "public", "board"],
          default: "public"
        }
      },
      required: ["topic", "keyPoints"]
    }
  },
  {
    name: "generate_visual_content",
    description: "Generate visual content descriptions and specs",
    inputSchema: {
      type: "object",
      properties: {
        contentType: {
          type: "string",
          enum: ["infographic", "social_image", "presentation_slide", "banner", "video_script"],
          description: "Type of visual content"
        },
        message: { type: "string", description: "Core message" },
        visualStyle: {
          type: "string",
          enum: ["corporate", "modern", "playful", "minimalist", "bold"],
          default: "modern"
        },
        dimensions: { type: "string", description: "Required dimensions" },
        brandColors: {
          type: "array",
          items: { type: "string" },
          description: "Brand colors to use"
        },
        includeData: { type: "boolean", description: "Include data visualization", default: false }
      },
      required: ["contentType", "message"]
    }
  },
  {
    name: "optimize_content_seo",
    description: "Optimize content for SEO",
    inputSchema: {
      type: "object",
      properties: {
        content: { type: "string", description: "Content to optimize" },
        targetKeywords: {
          type: "array",
          items: { type: "string" },
          description: "Target keywords"
        },
        contentType: {
          type: "string",
          enum: ["blog", "landing_page", "article", "product_description"],
          description: "Type of content"
        },
        includeSchema: { type: "boolean", description: "Include schema markup", default: true },
        metaDescription: { type: "boolean", description: "Generate meta description", default: true }
      },
      required: ["content", "targetKeywords"]
    }
  },
  {
    name: "generate_media_list",
    description: "Generate targeted media list with journalist contacts",
    inputSchema: {
      type: "object",
      properties: {
        industry: { type: "string", description: "Target industry" },
        topic: { type: "string", description: "News topic or angle" },
        company: { type: "string", description: "Company name" },
        companyDescription: { type: "string", description: "Brief company description" },
        tiers: {
          type: "array",
          items: { type: "string" },
          enum: ["tier1", "tier2", "tier3", "trade"],
          description: "Media tiers to include"
        },
        geography: { type: "string", description: "Geographic focus", default: "US" },
        count: { type: "number", description: "Number of journalists", default: 15 }
      },
      required: ["industry", "topic"]
    }
  },
  {
    name: "generate_media_pitch",
    description: "Generate personalized media pitch templates",
    inputSchema: {
      type: "object",
      properties: {
        pitchType: {
          type: "string",
          enum: ["exclusive", "embargo", "general", "follow_up"],
          description: "Type of pitch"
        },
        story: { type: "string", description: "Story angle" },
        keyPoints: {
          type: "array",
          items: { type: "string" },
          description: "Key story points"
        },
        journalist: { type: "string", description: "Journalist name (optional)" },
        publication: { type: "string", description: "Target publication (optional)" },
        newsHook: { type: "string", description: "Why this is newsworthy now" },
        supportingData: {
          type: "array",
          items: { type: "string" },
          description: "Data points and proof"
        },
        executiveAvailable: { type: "boolean", description: "Executive available for interview", default: true }
      },
      required: ["pitchType", "story", "keyPoints"]
    }
  },
  {
    name: "generate_email_sequence",
    description: "Generate multi-touch email sequence for campaigns",
    inputSchema: {
      type: "object",
      properties: {
        sequenceType: {
          type: "string",
          enum: ["nurture", "onboarding", "re_engagement", "sales", "event"],
          description: "Type of email sequence"
        },
        numberOfEmails: { type: "number", description: "Number of emails in sequence", default: 5 },
        topic: { type: "string", description: "Main topic or campaign" },
        audience: { type: "string", description: "Target audience" },
        timeline: { type: "string", description: "Timeline (e.g., '2 weeks', '30 days')" },
        callToAction: { type: "string", description: "Primary CTA" },
        personalization: { type: "boolean", description: "Include personalization tokens", default: true }
      },
      required: ["sequenceType", "topic", "audience"]
    }
  }
];

// Tool implementations
async function generatePressRelease(args: any) {
  // Handle both specific parameters and generic parameters from NIV
  const headline = args.headline || args.announcement || `${args.company || 'Company'} Announcement`;
  const subheadline = args.subheadline || '';
  const keyPoints = args.keyPoints || args.keyMessages || ['Innovation', 'Leadership', 'Growth'];
  const quotes = args.quotes || [];
  const boilerplate = args.boilerplate || `About ${args.company || 'the company'}`;
  const tone = args.tone || 'formal';
  const company = args.company || args.organization || 'Company';
  const city = args.city || 'City';
  const state = args.state || 'STATE';
  const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const prompt = `Write a professional press release in AP Style format:

HEADLINE (ALL CAPS, BOLD): ${headline.toUpperCase()}

CITY, STATE – ${date} – ${company}

KEY FACTS TO INCLUDE:
${Array.isArray(keyPoints) ? keyPoints.map((kp, i) => `${i+1}. ${kp}`).join('\n') : keyPoints}

${quotes.length > 0 ? `REQUIRED QUOTES TO INTEGRATE:\n${quotes.map((q: any) => `- "${q.quote}" - ${q.speaker}, ${q.title}`).join('\n')}` : ''}

BOILERPLATE:
${boilerplate}

CRITICAL FORMATTING REQUIREMENTS:
1. Start with dateline: ${city.toUpperCase()}, ${state} – ${date} –
2. Lead paragraph (lede): Answer who, what, when, where, why in first 2 sentences
3. Second paragraph: Expand on most newsworthy detail
4. Third paragraph: Include executive quote naturally (if provided)
5. Fourth paragraph: Additional context and supporting details
6. Fifth paragraph: Second quote or customer testimonial (if provided)
7. Boilerplate: "About [Company]" section
8. Media contact: "For media inquiries, contact: [MEDIA CONTACT]"

STYLE REQUIREMENTS:
- Use AP Style (avoid Oxford comma, spell out numbers under 10, etc.)
- Third-person only (no "we", "our", "I")
- Strong, active verbs
- No marketing fluff or superlatives without attribution
- Quote marks for all quotes
- Short paragraphs (2-3 sentences max)
- Inverted pyramid structure (most important info first)

TONE: Professional, factual, ${tone}

Do NOT include the word "FOR IMMEDIATE RELEASE" or "###" - just the press release content.`;

  const pressRelease = await callAnthropic(
    [{ role: 'user', content: prompt }],
    2000
  );

  return {
    headline,
    subheadline,
    content: pressRelease,
    wordCount: pressRelease.split(' ').length,
    tone,
    timestamp: new Date().toISOString()
  };
}

async function generateBlogPost(args: any) {
  const { title, topic, outline = [], targetAudience = '', wordCount = 800, style = 'educational', includeCTA = true } = args;

  // Extract additional strategic context from fullFramework
  const context = args.context || {};
  const fullContext = context.fullContext || args.fullFramework || {};
  const narrative = args.narrative || args.angle || context.strategy?.narrative || fullContext.narrative || '';
  const keyMessages = args.keyMessages || args.keyPoints || context.strategy?.keyMessages || fullContext.keyMessages || [];
  const researchInsights = args.research || fullContext.researchInsights || [];
  const positioning = args.positioning || fullContext.positioning || '';
  const phase = fullContext.phase || '';
  const objective = fullContext.objective || '';
  const contentPurpose = fullContext.contentPurpose || '';
  const organization = args.organization || args.company || context.organization?.name || '';

  const prompt = `Write a ${style} blog post about ${organization}'s ${topic}:

STRATEGIC CONTEXT:
${narrative ? `Core Narrative: ${narrative}` : ''}
${positioning ? `Positioning: ${positioning}` : ''}
${phase ? `Campaign Phase: ${phase}` : ''}
${objective ? `Phase Objective: ${objective}` : ''}
${contentPurpose ? `Content Purpose: ${contentPurpose}` : ''}

TARGET AUDIENCE:
${targetAudience || 'General audience'}

KEY MESSAGES TO INCORPORATE:
${keyMessages.length > 0 ? keyMessages.map((msg: string) => `- ${msg}`).join('\n') : '- Innovation and thought leadership'}

${Array.isArray(researchInsights) && researchInsights.length > 0 ? `\nRESEARCH INSIGHTS TO REFERENCE:\n${researchInsights.map((insight: string) => `- ${insight}`).join('\n')}` : ''}

${outline.length > 0 ? `\nOUTLINE:\n${outline.join('\n')}` : ''}

SPECIFICATIONS:
- Title: ${title || 'Generate an engaging title'}
- Word Count: ~${wordCount}
- Style: ${style}
- ${includeCTA ? 'Include compelling call-to-action at the end' : ''}

REQUIREMENTS:
- Make it engaging, informative, and valuable to readers
- Use subheadings, examples, and actionable insights
- **IMPORTANT**: Align all content with the strategic narrative and key messages above
- Reference the research insights to add credibility
- Ensure the content supports the ${phase || 'campaign'} objective${objective ? `: ${objective}` : ''}
- Write with authority and expertise on this specific topic
- Include specific details, not generic platitudes`;

  const blogPost = await callAnthropic(
    [{ role: 'user', content: prompt }],
    2000
  );

  return {
    title: title || 'Generated',
    content: blogPost,
    wordCount: blogPost.split(' ').length,
    style,
    targetAudience,
    seoScore: Math.floor(Math.random() * 20) + 80 // Simulated SEO score
  };
}

async function generateSocialPosts(args: any) {
  // Handle both underscore and camelCase parameter names
  const topic = args.topic || args.subject || args.announcement;
  const message = args.message || args.narrative;
  const target_audience = args.target_audience || args.targetAudiences?.join(', ');
  const key_messages = args.key_messages || args.keyMessages || args.keyPoints || [];
  const tone = args.tone || 'professional';
  const platforms = args.platforms || ['linkedin']; // Default to single platform to avoid confusion
  const variations = args.variations || 3;
  const includeHashtags = args.includeHashtags !== undefined ? args.includeHashtags : true;
  const includeEmojis = args.includeEmojis !== undefined ? args.includeEmojis : false;
  const thread = args.thread || false;

  console.log('📱 generateSocialPosts called with:', {
    message: message?.substring(0, 100),
    topic: topic?.substring(0, 100),
    platforms,
    tone,
    variations
  });

  // Build comprehensive content message from available inputs
  let contentMessage = message;
  if (!message && (topic || target_audience || key_messages.length > 0)) {
    contentMessage = `Create social media posts about: ${topic || 'General announcement'}
    ${target_audience ? `Target Audience: ${target_audience}` : ''}
    ${key_messages.length > 0 ? `Key Messages to include: ${Array.isArray(key_messages) ? key_messages.join(', ') : key_messages}` : ''}
    ${tone ? `Tone: ${tone}` : ''}`;
  }

  // Fallback if still no content
  if (!contentMessage) {
    contentMessage = 'Create engaging social media content for professional audience';
  }

  console.log('📝 Content message:', contentMessage.substring(0, 200));

  const posts: any = {};

  for (const platform of platforms) {
    // Generate all variations in one call to ensure diversity
    const variationTypes = [
      'professional/informative tone',
      'engaging/conversational tone',
      'bold/attention-grabbing tone'
    ];

    const prompt = `Create ${variations} DISTINCT ${platform} posts about this topic. Each variation must be DIFFERENT in style and approach:

${contentMessage}

Generate ${variations} unique versions:
${variations >= 1 ? `\nVersion 1: ${variationTypes[0]} - Lead with the business value/impact` : ''}
${variations >= 2 ? `\nVersion 2: ${variationTypes[1]} - Focus on the human/user benefit` : ''}
${variations >= 3 ? `\nVersion 3: ${variationTypes[2]} - Emphasize innovation/what's new` : ''}

Requirements for ALL posts:
${includeHashtags ? '- Include relevant hashtags' : '- No hashtags'}
${includeEmojis ? '- Include appropriate emojis' : '- No emojis'}
${platform === 'twitter' ? '- Maximum 280 characters per post' : ''}
${platform === 'linkedin' ? '- Professional tone, 150-300 words' : ''}
${platform === 'twitter' && thread ? '- Create as thread (2-3 tweets)' : ''}

IMPORTANT: Write ONLY the social media post content itself. Do NOT include meta-labels like "Position:", "Tone:", "Version:", or any formatting instructions. Just write the actual post text that would be published.

Format your response as:

POST 1:
[actual post content only - no labels or metadata]

POST 2:
[actual post content only - no labels or metadata]

POST 3:
[actual post content only - no labels or metadata]

Make each post genuinely different - not just slight word changes.`;

    const generatedPosts = await callAnthropic(
      [{ role: 'user', content: prompt }],
      800
    );

    // Parse the response to extract individual posts
    const postMatches = generatedPosts.match(/POST \d+:\s*\n([\s\S]*?)(?=\nPOST \d+:|$)/g);
    const platformPosts = postMatches
      ? postMatches.map(p => p.replace(/POST \d+:\s*\n/, '').trim())
      : [generatedPosts];

    posts[platform] = platformPosts.slice(0, variations);
  }

  // Return with content field for consistency
  const allPosts = Object.entries(posts)
    .map(([platform, platformPosts]) =>
      `**${platform.toUpperCase()}**\n\n${(platformPosts as string[]).map((p, i) => `Version ${i + 1}:\n${p}`).join('\n\n---\n\n')}`
    )
    .join('\n\n═══════════════════\n\n');

  return {
    content: allPosts,
    message: message || contentMessage,
    platforms,
    posts,
    variations,
    totalGenerated: platforms.length * variations
  };
}

async function generateTwitterPost(args: any) {
  const message = args.message || args.topic || args.subject || '';
  const keyMessages = args.keyMessages || args.key_messages || [];
  const tone = args.tone || 'professional';
  const includeHashtags = args.includeHashtags !== undefined ? args.includeHashtags : true;
  const thread = args.thread || false;
  const variations = args.variations || 3;

  const prompt = `Create ${variations} DISTINCT Twitter/X posts (${thread ? 'as a thread' : 'standalone tweets'}):

TOPIC: ${message}
${keyMessages.length > 0 ? `KEY MESSAGES: ${Array.isArray(keyMessages) ? keyMessages.join(', ') : keyMessages}` : ''}
TONE: ${tone}

REQUIREMENTS:
- Maximum 280 characters per tweet
- ${thread ? 'Create 3-5 tweet thread with strong hook in first tweet' : 'Single impactful tweet'}
- ${includeHashtags ? 'Include 2-3 relevant hashtags' : 'No hashtags'}
- Use line breaks for readability
- Strong opening hook
- Clear value proposition
- ${thread ? 'Each tweet should flow naturally to the next' : 'Complete thought in one tweet'}

Generate ${variations} unique versions that are GENUINELY DIFFERENT:
Version 1: Data-driven approach (lead with statistics/facts)
Version 2: Storytelling approach (narrative hook)
Version 3: Question/engagement approach (provocative question)

Format as:
POST 1:
[tweet content${thread ? ' / THREAD:\nTweet 1:\n...\nTweet 2:\n...' : ''}]

POST 2:
[tweet content]

POST 3:
[tweet content]`;

  const twitterPosts = await callAnthropic(
    [{ role: 'user', content: prompt }],
    1000
  );

  const postMatches = twitterPosts.match(/POST \d+:\s*\n([\s\S]*?)(?=\nPOST \d+:|$)/g);
  const posts = postMatches
    ? postMatches.map(p => p.replace(/POST \d+:\s*\n/, '').trim())
    : [twitterPosts];

  return {
    content: posts.map((p, i) => `**Version ${i + 1}:**\n${p}`).join('\n\n---\n\n'),
    platform: 'twitter',
    posts,
    variations: posts.length,
    thread,
    characterCount: posts.map(p => p.length)
  };
}

async function generateInstagramPost(args: any) {
  const message = args.message || args.topic || args.subject || '';
  const keyMessages = args.keyMessages || args.key_messages || [];
  const tone = args.tone || 'engaging';
  const includeHashtags = args.includeHashtags !== undefined ? args.includeHashtags : true;
  const variations = args.variations || 3;
  const carousel = args.carousel || false;

  const prompt = `Create ${variations} DISTINCT Instagram ${carousel ? 'carousel' : 'post'} captions:

TOPIC: ${message}
${keyMessages.length > 0 ? `KEY MESSAGES: ${Array.isArray(keyMessages) ? keyMessages.join(', ') : keyMessages}` : ''}
TONE: ${tone}

REQUIREMENTS:
- 125-150 words (Instagram sweet spot for engagement)
- ${carousel ? 'Describe content for 5-7 carousel slides with slide-by-slide breakdown' : 'Single compelling post'}
- ${includeHashtags ? 'Include 8-12 relevant hashtags at the end' : 'No hashtags'}
- Use emojis strategically (2-4 per post)
- Strong hook in first line (pre-"...more")
- Line breaks for readability
- Call-to-action at the end
- Visual suggestions in [brackets]

Generate ${variations} unique versions with DIFFERENT approaches:
Version 1: Educational/Tutorial style (teach something valuable)
Version 2: Behind-the-scenes/Personal story (connect emotionally)
Version 3: Bold statement/Hot take (spark conversation)

${carousel ? 'For carousel posts, include:\nSLIDE 1: [Cover image description] + Hook\nSLIDE 2-6: [Content for each slide]\nSLIDE 7: CTA + [closing image]' : ''}

Format as:
POST 1:
[caption with emojis and structure]
${includeHashtags ? '\n#hashtag1 #hashtag2 #hashtag3...' : ''}

POST 2:
[caption]

POST 3:
[caption]`;

  const instagramPosts = await callAnthropic(
    [{ role: 'user', content: prompt }],
    1200
  );

  const postMatches = instagramPosts.match(/POST \d+:\s*\n([\s\S]*?)(?=\nPOST \d+:|$)/g);
  const posts = postMatches
    ? postMatches.map(p => p.replace(/POST \d+:\s*\n/, '').trim())
    : [instagramPosts];

  return {
    content: posts.map((p, i) => `**Version ${i + 1}:**\n${p}`).join('\n\n---\n\n'),
    platform: 'instagram',
    posts,
    variations: posts.length,
    carousel,
    wordCount: posts.map(p => p.split(' ').length)
  };
}

async function generateEmailCampaign(args: any) {
  // Handle both specific and generic parameters from NIV
  const campaignType = args.campaignType || 'announcement';
  const subject = args.subject || args.announcement || 'Important Update';
  const preheader = args.preheader || '';
  const mainMessage = args.mainMessage || args.narrative || args.keyMessages?.join(' ') || '';
  const audience = args.audience || args.targetAudiences?.join(', ') || 'customers';
  const personalization = args.personalization !== undefined ? args.personalization : true;
  const includeImages = args.includeImages !== undefined ? args.includeImages : true;

  const prompt = `Create ${campaignType} email campaign:
  Subject: ${subject}
  Preheader: ${preheader}
  Main Message: ${mainMessage}
  Audience: ${audience}
  ${personalization ? 'Include personalization tokens: {{first_name}}, {{company}}' : ''}
  ${includeImages ? 'Include [IMAGE PLACEHOLDER] markers where images should go' : ''}

  Structure:
  - Engaging opening
  - Clear value proposition
  - Supporting details
  - Strong CTA
  - Unsubscribe footer

  Make it scannable with good formatting.`;

  const emailContent = await callAnthropic(
    [{ role: 'user', content: prompt }],
    1200
  );

  return {
    content: emailContent,
    campaignType,
    subject,
    preheader,
    htmlContent: emailContent,
    plainTextVersion: emailContent.replace(/\[IMAGE PLACEHOLDER\]/g, '').replace(/<[^>]*>/g, ''),
    audience,
    estimatedReadTime: Math.ceil(emailContent.split(' ').length / 200) + ' min'
  };
}

async function generateExecutiveTalkingPoints(args: any) {
  // Handle both keyMessages and keyPoints
  const keyMessages = args.keyMessages || args.keyPoints || [];
  const occasion = args.occasion || 'interview';
  const topic = args.topic || args.subject || args.announcement || 'announcement';
  const audience = args.audience || args.targetAudiences?.join(', ') || 'media';
  const duration = args.duration || 5;
  const anticipatedQuestions = args.anticipatedQuestions || [];

  const prompt = `Generate executive talking points for ${occasion}:
  Topic: ${topic}
  Audience: ${audience}
  Duration: ${duration} minutes
  Key Messages: ${Array.isArray(keyMessages) ? keyMessages.join(', ') : keyMessages}
  ${anticipatedQuestions.length > 0 ? `Anticipated Questions: ${anticipatedQuestions.join(', ')}` : ''}

  Create:
  - Opening statement
  - 3-5 main talking points with supporting details
  - Bridging phrases
  - Q&A responses for anticipated questions
  - Closing statement

  Keep it concise, memorable, and on-message.`;

  const talkingPoints = await callAnthropic(
    [{ role: 'user', content: prompt }],
    1500
  );

  return {
    content: talkingPoints,
    occasion,
    topic,
    audience,
    duration,
    keyMessages,
    prepTime: `${Math.ceil(duration * 2)} minutes recommended prep`
  };
}

async function generateVisualContent(args: any) {
  const { contentType, message, visualStyle = 'modern', dimensions = '', brandColors = [], includeData = false } = args;
  
  const visualSpec: any = {
    contentType,
    message,
    visualStyle,
    dimensions: dimensions || getDefaultDimensions(contentType),
    designSpec: {}
  };
  
  // Generate design specifications
  visualSpec.designSpec = {
    layout: `${visualStyle} layout with clear hierarchy`,
    typography: {
      headline: "Bold, large font for main message",
      body: "Clean, readable font for supporting text",
      dataLabels: includeData ? "Clear, small font for data points" : null
    },
    colorPalette: brandColors.length > 0 ? brandColors : ["#0066CC", "#00AA44", "#FF6600"],
    imagery: `${visualStyle} style imagery or icons`,
    dataVisualization: includeData ? "Charts or graphs to support message" : null
  };
  
  // Generate content structure based on type
  switch(contentType) {
    case 'infographic':
      visualSpec.structure = [
        "Header with title",
        "3-5 key data points",
        "Visual flow from top to bottom",
        "Footer with source/CTA"
      ];
      break;
    case 'social_image':
      visualSpec.structure = [
        "Eye-catching headline",
        "Supporting visual element",
        "Brand logo",
        "Optional CTA"
      ];
      break;
    case 'video_script':
      visualSpec.structure = {
        opening: "Hook in first 3 seconds",
        middle: "Key message with supporting visuals",
        closing: "CTA and branding"
      };
      break;
  }
  
  visualSpec.altText = `${contentType} showing ${message}`;
  visualSpec.fileFormat = contentType === 'video_script' ? 'MP4' : 'PNG/JPG';
  
  return visualSpec;
}

function getDefaultDimensions(contentType: string): string {
  const dimensions: any = {
    infographic: "800x2000px",
    social_image: "1200x630px",
    presentation_slide: "1920x1080px",
    banner: "728x90px",
    video_script: "1920x1080px (16:9)"
  };
  return dimensions[contentType] || "1200x630px";
}

async function optimizeContentSEO(args: any) {
  const { content, targetKeywords, contentType = 'blog', includeSchema = true, metaDescription = true } = args;
  
  const optimization: any = {
    originalLength: content.length,
    optimizedContent: content,
    seoScore: 0,
    improvements: []
  };
  
  // Keyword density analysis
  const keywordDensity: any = {};
  for (const keyword of targetKeywords) {
    const regex = new RegExp(keyword, 'gi');
    const matches = content.match(regex);
    keywordDensity[keyword] = {
      count: matches ? matches.length : 0,
      density: matches ? `${((matches.length / content.split(' ').length) * 100).toFixed(2)}%` : '0%'
    };
  }
  optimization.keywordDensity = keywordDensity;
  
  // Generate improvements
  optimization.improvements = [
    "Add keywords to H1 and H2 tags",
    "Include keywords in first 100 words",
    "Add internal links",
    "Optimize image alt text",
    "Improve readability score"
  ];
  
  // Generate meta description
  if (metaDescription) {
    optimization.metaDescription = `${content.substring(0, 150)}... ${targetKeywords[0]}`;
  }
  
  // Generate schema markup
  if (includeSchema) {
    optimization.schemaMarkup = {
      "@context": "https://schema.org",
      "@type": contentType === 'blog' ? 'BlogPosting' : 'Article',
      "headline": "Generated from content",
      "keywords": targetKeywords.join(', ')
    };
  }
  
  // Calculate SEO score
  optimization.seoScore = Math.floor(Math.random() * 20) + 75;
  
  return optimization;
}

// Generate thought leadership content
async function generateThoughtLeadership(args: any) {
  const { topic, keyPoints = [], perspective, industry, wordCount = 1200, tone = 'authoritative' } = args;

  const prompt = `Write a ${tone} thought leadership article:
  Topic: ${topic}
  Industry: ${industry || 'technology'}
  Unique Perspective: ${perspective || 'forward-thinking'}
  Key Points: ${keyPoints.join('\n- ')}
  Word Count: ~${wordCount}

  Requirements:
  - Start with a compelling hook
  - Include data and trends
  - Provide unique insights and predictions
  - Challenge conventional thinking
  - End with actionable takeaways
  - Use authoritative voice and expert positioning`;

  const content = await callAnthropic(
    [{ role: 'user', content: prompt }],
    Math.round(wordCount * 1.5)
  );

  return { content };
}

// Generate case study
async function generateCaseStudy(args: any) {
  const {
    customer,
    industry,
    challenge,
    solution,
    results = [],
    proof_points = [],
    quote,
    wordCount = 1000,
    tone = 'professional'
  } = args;

  // Extract additional context if available
  const context = args.context || {};
  const fullContext = context.fullContext || args.fullFramework || {};
  const rationale = args.rationale || fullContext.strategy?.rationale || '';
  const narrative = args.narrative || context.strategy?.narrative || fullContext.strategy?.narrative || '';
  const keyMessages = args.keyMessages || context.strategy?.keyMessages || fullContext.strategy?.keyMessages || [];

  const prompt = `Write a ${tone} case study about ${customer}:

CUSTOMER BACKGROUND:
- Customer: ${customer}
- Industry: ${industry || 'technology'}

CHALLENGE:
${challenge}

SOLUTION PROVIDED:
${solution}

${narrative ? `\nSTRATEGIC NARRATIVE:\n${narrative}\n` : ''}
${rationale ? `\nRATIONALE:\n${rationale}\n` : ''}

KEY MESSAGES TO INCORPORATE:
${keyMessages.length > 0 ? keyMessages.map((msg: string) => `- ${msg}`).join('\n') : '- Innovation and results'}

${results.length > 0 ? `MEASURABLE RESULTS:\n${results.map((r: string) => `- ${r}`).join('\n')}` : ''}

${proof_points.length > 0 ? `EVIDENCE/PROOF POINTS:\n${proof_points.map((p: string) => `- ${p}`).join('\n')}` : ''}

${quote ? `CUSTOMER QUOTE:\n"${quote}"` : ''}

Word Count: ~${wordCount}

Requirements:
- Follow standard case study format (Challenge → Solution → Results)
- Use specific, measurable outcomes
- Include data and metrics
- Tell a compelling story
- Highlight the value delivered
- Use ${tone} tone throughout
- IMPORTANT: Base all content on the strategic narrative and proof points provided above
- Ensure the case study aligns with the key messages`;

  const content = await callAnthropic(
    [{ role: 'user', content: prompt }],
    Math.round(wordCount * 1.5)
  );

  return { content };
}

// Generate white paper
async function generateWhitePaper(args: any) {
  const {
    title,
    topic,
    keyPoints = [],
    targetAudience = 'technical decision makers',
    sections = [],
    industry,
    technicalLevel = 'intermediate',
    wordCount = 2500
  } = args;

  // Extract additional context if available
  const context = args.context || {};
  const fullContext = context.fullContext || args.fullFramework || {};
  const proof_points = args.proof_points || fullContext.strategy?.proof_points || [];
  const rationale = args.rationale || fullContext.strategy?.rationale || '';
  const narrative = args.narrative || context.strategy?.narrative || fullContext.strategy?.narrative || '';
  const keyMessages = args.keyMessages || context.strategy?.keyMessages || fullContext.strategy?.keyMessages || [];

  const prompt = `Write a ${technicalLevel}-level white paper:

TITLE: ${title}
TOPIC: ${topic}
TARGET AUDIENCE: ${targetAudience}
INDUSTRY: ${industry || 'technology'}

${narrative ? `\nCORE NARRATIVE:\n${narrative}\n` : ''}
${rationale ? `\nSTRATEGIC RATIONALE:\n${rationale}\n` : ''}

KEY POINTS TO COVER:
${keyPoints.map((point: string) => `- ${point}`).join('\n')}

${keyMessages.length > 0 ? `\nKEY MESSAGES:\n${keyMessages.map((msg: string) => `- ${msg}`).join('\n')}` : ''}

${proof_points.length > 0 ? `\nEVIDENCE/PROOF POINTS:\n${proof_points.map((p: string) => `- ${p}`).join('\n')}` : ''}

${sections.length > 0 ? `\nSECTIONS TO INCLUDE:\n${sections.map((s: string) => `- ${s}`).join('\n')}` : ''}

Word Count: ~${wordCount}

Requirements:
- Start with executive summary
- Include introduction explaining the problem/opportunity
- Present thorough analysis with data and research
- Provide evidence-based recommendations
- Include charts/graphs descriptions where relevant
- End with clear conclusions and next steps
- Use ${technicalLevel} technical depth appropriate for ${targetAudience}
- Cite credible sources and industry data
- IMPORTANT: Align all content with the strategic narrative and proof points provided
- Ensure recommendations match the key messages`;

  const content = await callAnthropic(
    [{ role: 'user', content: prompt }],
    Math.round(wordCount * 1.2)
  );

  return { content };
}

// Generate Q&A document
async function generateQADocument(args: any) {
  const { topic, questions = [], audience = 'general', style = 'conversational' } = args;

  // Extract context and strategy
  const context = args.context || {};
  const strategy = context.strategy || {};
  const organization = context.organization || {};
  const event = context.event || topic;
  const keyMessages = args.keyMessages || strategy.keyMessages || [];
  const primaryMessage = strategy.primaryMessage || topic;
  const narrative = strategy.narrative || '';
  const objective = strategy.objective || '';

  const prompt = `Create a comprehensive Q&A document for this SPECIFIC announcement:

ANNOUNCEMENT DETAILS:
Company: ${args.company || organization.name || 'Company'}
Event/Topic: ${event}
Primary Message: ${primaryMessage}
${narrative ? `Narrative: ${narrative}` : ''}
${objective ? `Objective: ${objective}` : ''}

KEY MESSAGES TO REINFORCE:
${keyMessages.length > 0 ? keyMessages.map((msg: string) => `- ${msg}`).join('\n') : `- ${topic}`}

TARGET AUDIENCES: ${audience}

QUESTIONS TO ANSWER:
${questions.length > 0 ? questions.map((q: string) => `- ${q}`).join('\n') : `Generate 10-15 relevant questions based on the announcement`}

REQUIREMENTS:
- Write SPECIFIC answers about THIS announcement, not generic templates
- Each answer should reinforce our key messages where appropriate
- Include concrete details, timelines, and specifics from the strategy
- Address potential concerns or objections
- Maintain ${style} tone but be substantive
- Answers should be quotable and media-ready
- Include data points and proof points where relevant
- Make sure answers align with the narrative: ${narrative}

DO NOT create generic Q&A. Every answer must be specific to:
- ${primaryMessage}
- ${args.company || organization.name}'s announcement
- The strategic objectives outlined

Format as:
Q: [Question]
A: [Detailed, specific answer that reinforces our key messages]`;

  const content = await callAnthropic(
    [{ role: 'user', content: prompt }],
    2000
  );

  return { content };
}

// Generate executive statement
async function generateExecutiveStatement(args: any) {
  const {
    topic,
    keyPoints = [],
    executiveName = 'CEO',
    executiveTitle = 'Chief Executive Officer',
    tone = 'confident',
    audience = 'public'
  } = args;

  const prompt = `Write an executive statement from ${executiveName}, ${executiveTitle}:
  Topic: ${topic}
  Key Points: ${keyPoints.join('\n- ')}
  Tone: ${tone}
  Audience: ${audience}

  Requirements:
  - Open with context and significance
  - Address the ${audience} directly
  - Include specific commitments or actions
  - Maintain ${tone} tone
  - Close with forward-looking vision
  - Keep it concise but impactful (400-600 words)`;

  const content = await callAnthropic(
    [{ role: 'user', content: prompt }],
    1000
  );

  return { content };
}

// Generate media list
async function generateMediaList(args: any) {
  // Handle parameters from NIV with full context
  const industry = args.industry || 'technology';
  const topic = args.topic || args.message || args.announcement || args.subject || 'company news';
  const company = args.company || args.organization || '';
  const companyDescription = args.companyDescription || '';
  const geography = args.geography || 'US';
  const count = args.count || 10;

  // Extract strategy context if provided
  const context = args.context || {};
  const strategy = context.strategy || {};
  const keyMessages = args.keyMessages || strategy.keyMessages || [];
  const narrative = args.newsHook || args.narrative || strategy.narrative || '';
  const primaryMessage = strategy.primaryMessage || topic;
  const pitchAngles = args.pitchAngles || [];

  // Extract media_targets from framework if available
  const media_targets = args.media_targets || args.mediaTargets || {};
  const tier1FromFramework = media_targets.tier_1_targets || [];
  const tier2FromFramework = media_targets.tier_2_targets || [];
  const tier3FromFramework = media_targets.tier_3_targets || [];

  console.log('📰 Generating targeted media list...');
  console.log(`   Industry: ${industry}, Topic: ${topic}`);
  console.log(`   Company: ${company}`);

  // IMPORTANT: journalist_registry database is not populated yet
  // So we use mcp-media for web-based journalist research instead
  // This finds REAL, RELEVANT journalists based on the actual campaign topic

  console.log('🌐 Using mcp-media for targeted journalist research...');

  let mediaListContent: string = '';

  try {
    const mcpMediaResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/mcp-media`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify({
          tool: 'media-list',
          parameters: {
            company: company,
            industry: industry,
            topic: topic,
            tiers: ['tier1', 'tier2'],
            count: count
          }
        })
      }
    );

    if (mcpMediaResponse.ok) {
      const mcpData = await mcpMediaResponse.json();
      mediaListContent = mcpData.content || mcpData.result || '';
      console.log(`✅ MCP Media generated ${mediaListContent.length} character media list`);
    } else {
      console.error('❌ MCP Media failed:', await mcpMediaResponse.text());
      // Fall back to Claude generation
    }
  } catch (error) {
    console.error('❌ Error calling mcp-media:', error);
    // Fall back to Claude generation
  }

  // If we got content from mcp-media, return it directly
  if (mediaListContent && mediaListContent.length > 100) {
    console.log('✅ Returning media list from mcp-media');
    return { content: mediaListContent };
  }

  // Fallback: generate with Claude directly
  console.log('⚠️ Falling back to Claude-generated media list');
  let realJournalists: any[] = [];

  // Determine which tiers to include based on framework or defaults
  let tiers = args.tiers || [];
  if (tiers.length === 0) {
    // Use tiers from framework if available
    if (tier1FromFramework.length > 0) tiers.push('tier1');
    if (tier2FromFramework.length > 0) tiers.push('tier2');
    if (tier3FromFramework.length > 0) tiers.push('tier3');
    // Default if no framework tiers
    if (tiers.length === 0) tiers = ['tier1', 'tier2', 'trade'];
  }

  // Build prompt with real journalist data if available
  let prompt = '';

  if (realJournalists.length > 0) {
    // Use REAL journalist data from registry
    prompt = `Create a formatted media list from these VERIFIED journalist contacts for this PR campaign:

COMPANY & ANNOUNCEMENT:
Company: ${company} ${companyDescription ? `- ${companyDescription}` : ''}
Industry: ${industry}
Topic: ${topic}
Primary Message: ${primaryMessage}
${narrative ? `Narrative: ${narrative}` : ''}

KEY MESSAGES:
${keyMessages.length > 0 ? keyMessages.map((msg: string) => `- ${msg}`).join('\n') : `- ${topic}`}

VERIFIED JOURNALISTS FROM DATABASE:
${realJournalists.map((j: any, idx: number) => `
${idx + 1}. ${j.name}
   - Outlet: ${j.outlet}
   - Beat: ${j.beat || 'General coverage'}
   - Email: ${j.email || 'Not available'}
   - Twitter: ${j.twitter || 'Not available'}
   - LinkedIn: ${j.linkedin || 'Not available'}
   - Bio: ${j.bio || 'No bio available'}
`).join('\n')}

For EACH journalist above, evaluate their relevance to this campaign:

**IMPORTANT EVALUATION CRITERIA:**
- If a journalist's beat is clearly IRRELEVANT to this campaign topic (e.g., consumer tech reporter for a B2B industrial story, gaming reporter for critical minerals), mark them as "Not recommended" and explain why their beat doesn't align
- If a journalist's beat has SOME relevance (e.g., business reporter for a trade story, general tech reporter for infrastructure tech), include them with a strategic pitch angle that bridges their beat to the story
- If a journalist's beat is HIGHLY relevant, emphasize why they're a priority contact

Format EACH journalist as:

## [Name from database]
**Outlet:** [Outlet from database]
**Beat:** [Beat from database]
**Email:** [Email from database - EXACT, do not modify]
**Twitter:** [Twitter from database]
**LinkedIn:** [LinkedIn from database]

**Why Contact:** [If relevant: Explain clear connection between their beat and this story. If NOT relevant: State "Not recommended for this campaign. [Journalist's] beat focuses on [their coverage area], which does not align with [campaign topic/angle]."]

**Pitch Angle:** [If relevant: Specific strategic approach for this journalist. If NOT relevant: "N/A - Consider removing from outreach list."]

---

CRITICAL:
- Use the EXACT contact information provided above. Do NOT make up or modify email addresses, names, or outlets.
- Be honest about relevance - if a journalist doesn't match, clearly state why
- If most/all journalists are not relevant, add a RECOMMENDATION section at the end suggesting the types of beats/outlets that would be better targets`;
  } else {
    // Fallback: Claude generates journalists (with disclaimer)
    prompt = `⚠️ NOTE: Journalist registry is empty. Generate a sample media list with realistic examples for this PR campaign.

COMPANY & ANNOUNCEMENT:
Company: ${company} ${companyDescription ? `- ${companyDescription}` : ''}
Industry: ${industry}
Primary Message: ${primaryMessage}
${narrative ? `Narrative: ${narrative}` : ''}

KEY MESSAGES:
${keyMessages.length > 0 ? keyMessages.map((msg: string) => `- ${msg}`).join('\n') : `- ${topic}`}

${tier1FromFramework.length > 0 || tier2FromFramework.length > 0 || tier3FromFramework.length > 0 ? `
STRATEGIC MEDIA TARGETS FROM FRAMEWORK:
${tier1FromFramework.length > 0 ? `**Tier 1 Priority Outlets:**
${tier1FromFramework.map((outlet: string) => `- ${outlet}`).join('\n')}
` : ''}
${tier2FromFramework.length > 0 ? `**Tier 2 Target Outlets:**
${tier2FromFramework.map((outlet: string) => `- ${outlet}`).join('\n')}
` : ''}
` : ''}

Generate ${count} sample journalist contacts organized by tier. For each contact:

## [Full Name]
**Outlet:** [Publication Name]
**Beat:** [Coverage Area]
**Email:** SAMPLE-firstname.lastname@publication.com (mark as SAMPLE)
**Twitter:** @handle (if known publicly)
**LinkedIn:** linkedin.com/in/[name]

**Typical Coverage:**
- [General topic area they typically cover]
- [Type of stories they write]

**Why Contact:** [Relevance to this story]
**Pitch Angle:** [Best approach]

---

⚠️ IMPORTANT: All contact information is SAMPLE DATA for planning purposes. Verify emails and contacts before outreach.`;
  }

  const content = await callAnthropic(
    [{ role: 'user', content: prompt }],
    8000  // Increased for full list
  );

  return { content, metadata: { count, tiers, industry, geography } };
}

// Generate media pitch
async function generateMediaPitch(args: any) {
  const {
    pitchType = 'general',
    story,
    keyPoints = [],
    journalist = '',
    publication = '',
    newsHook,
    supportingData = [],
    executiveAvailable = true
  } = args;

  // Extract strategic context from fullFramework
  const context = args.context || {};
  const fullContext = context.fullContext || args.fullFramework || {};
  const narrative = args.narrative || args.angle || context.strategy?.narrative || fullContext.narrative || '';
  const keyMessages = args.keyMessages || context.strategy?.keyMessages || fullContext.keyMessages || [];
  const researchInsights = args.research || fullContext.researchInsights || [];
  const positioning = args.positioning || fullContext.positioning || '';
  const phase = fullContext.phase || '';
  const objective = fullContext.objective || '';
  const organization = args.organization || args.company || context.organization?.name || '';
  const journalists = fullContext.journalists || [];

  const pitchContext = {
    exclusive: 'an exclusive story opportunity with embargo until your publication',
    embargo: 'an embargoed announcement that will go public on [DATE]',
    general: 'a newsworthy announcement we believe fits your coverage',
    follow_up: 'following up on our previous conversation about'
  };

  const prompt = `Write a compelling media pitch email (${pitchType}) from ${organization}:

${journalist ? `TO: ${journalist}` : journalists.length > 0 ? `TO: ${journalists.join(', ')}` : ''}
${publication ? `PUBLICATION: ${publication}` : ''}

STORY ANGLE:
${story}

STRATEGIC CONTEXT:
${narrative ? `Core Narrative: ${narrative}` : ''}
${positioning ? `Positioning: ${positioning}` : ''}
${phase ? `Campaign Phase: ${phase}` : ''}
${objective ? `Phase Objective: ${objective}` : ''}

KEY MESSAGES TO WEAVE IN:
${keyMessages.length > 0 ? keyMessages.map((msg: string) => `- ${msg}`).join('\n') : keyPoints.map((point: string) => `- ${point}`).join('\n')}

${Array.isArray(researchInsights) && researchInsights.length > 0 ? `\nMARKET CONTEXT/RESEARCH:\n${researchInsights.map((insight: string) => `- ${insight}`).join('\n')}` : ''}

WHY NOW:
${newsHook || 'Timely and relevant to current market trends'}

SUPPORTING DATA/PROOF POINTS:
${supportingData.length > 0 ? supportingData.map((data: string) => `- ${data}`).join('\n') : '- Include relevant metrics and proof points'}

${executiveAvailable ? 'INTERVIEW AVAILABILITY: Executive available for interview' : ''}

REQUIREMENTS FOR THE PITCH:
- Open with ${pitchContext[pitchType as keyof typeof pitchContext]}
- Personalize to the journalist's beat (if known)
- Lead with the most newsworthy angle that aligns with our narrative
- Include concrete data and specifics
- Reference the research insights and market context
- Offer exclusive access or information
- **IMPORTANT**: Ensure the pitch reinforces our key messages and positioning
- End with clear next steps
- Include a subject line that gets opened
- Keep it concise (150-200 words max) and compelling

FORMAT:
Subject: [Compelling Subject Line]

[Email Body - personalized, newsworthy, and aligned with strategic messaging]`;

  const content = await callAnthropic(
    [{ role: 'user', content: prompt }],
    1000
  );

  return { content, pitchType };
}

// Generate email sequence
async function generateEmailSequence(args: any) {
  const {
    sequenceType = 'nurture',
    numberOfEmails = 5,
    topic,
    audience,
    timeline = '2 weeks',
    callToAction = 'Learn more',
    personalization = true
  } = args;

  const prompt = `Create a ${numberOfEmails}-email ${sequenceType} sequence:

  Topic/Campaign: ${topic}
  Target Audience: ${audience}
  Timeline: ${timeline}
  Primary CTA: ${callToAction}
  ${personalization ? 'Include personalization tokens like {{first_name}}, {{company}}' : ''}

  Generate each email with:
  1. Subject line
  2. Preview text
  3. Email body
  4. CTA placement
  5. Timing (when to send)

  Email sequence strategy:
  - Email 1: Introduction/Welcome
  - Email 2-${numberOfEmails-1}: Value delivery, education, engagement
  - Email ${numberOfEmails}: Strong CTA/Conversion focus

  Each email should:
  - Build on the previous message
  - Provide unique value
  - Move recipient toward ${callToAction}
  - Maintain consistent voice
  - Include clear unsubscribe option

  Format each email clearly with labels.`;

  const content = await callAnthropic(
    [{ role: 'user', content: prompt }],
    2500
  );

  return {
    content,
    metadata: {
      sequenceType,
      numberOfEmails,
      timeline,
      audience
    }
  };
}

// HTTP handler
serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    // Support both 'arguments' and 'parameters' for backwards compatibility
    const { tool, arguments: argsFromArguments, parameters, conversation } = body;
    const args = parameters || argsFromArguments || {};
    
    if (tool === 'list_tools') {
      return new Response(
        JSON.stringify({ tools: TOOLS, success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    // Support both full tool names and simplified names
    let normalizedTool = tool;
    const toolMappings: { [key: string]: string } = {
      'press-release': 'generate_press_release',
      'blog-post': 'generate_blog_post',
      'social-post': 'generate_social_posts',
      'social-media-post': 'generate_social_posts',
      'twitter-post': 'generate_twitter_post',
      'twitter': 'generate_twitter_post',
      'tweet': 'generate_twitter_post',
      'instagram-post': 'generate_instagram_post',
      'instagram': 'generate_instagram_post',
      'email-campaign': 'generate_email_campaign',
      'talking-points': 'generate_executive_talking_points',
      'thought-leadership': 'generate_thought_leadership',
      'case-study': 'generate_case_study',
      'white-paper': 'generate_white_paper',
      'qa-document': 'generate_qa_document',
      'executive-statement': 'generate_executive_statement',
      'visual-content': 'generate_visual_content',
      'media-list': 'generate_media_list',
      'targeted-media-list': 'generate_media_list',
      'media-pitch': 'generate_media_pitch',
      'media-advisory': 'generate_media_pitch',
      'email-sequence': 'generate_email_sequence',
      'campaign-strategy': 'generate_thought_leadership',
      'social-campaign': 'generate_social_posts'
    };

    if (toolMappings[tool]) {
      normalizedTool = toolMappings[tool];
    }

    let result;
    switch(normalizedTool) {
      case 'generate_press_release':
        result = await generatePressRelease(args);
        break;
      case 'generate_blog_post':
        // Add conversation context if available
        if (conversation && conversation.length > 0 && args) {
          const contextString = conversation.map((msg: any) =>
            `${msg.role}: ${msg.content}`
          ).join('\n');
          args.topic = `Context from conversation:\n${contextString}\n\nCurrent request: ${args.topic || args.prompt || ''}`;
        }
        result = await generateBlogPost(args);
        break;
      case 'generate_social_posts':
        // Add conversation context if available
        if (conversation && conversation.length > 0 && args) {
          const contextString = conversation.map((msg: any) =>
            `${msg.role}: ${msg.content}`
          ).join('\n');
          // If message already contains context, use it; otherwise add context
          if (!args.message?.includes('Create social posts based on')) {
            args.message = `Context from conversation:\n${contextString}\n\nCurrent request: ${args.message || args.topic || ''}`;
          }
        }
        result = await generateSocialPosts(args);
        break;
      case 'generate_twitter_post':
        result = await generateTwitterPost(args);
        break;
      case 'generate_instagram_post':
        result = await generateInstagramPost(args);
        break;
      case 'generate_email_campaign':
        result = await generateEmailCampaign(args);
        break;
      case 'generate_executive_talking_points':
        result = await generateExecutiveTalkingPoints(args);
        break;
      case 'generate_thought_leadership':
        result = await generateThoughtLeadership(args);
        break;
      case 'generate_case_study':
        result = await generateCaseStudy(args);
        break;
      case 'generate_white_paper':
        result = await generateWhitePaper(args);
        break;
      case 'generate_qa_document':
        result = await generateQADocument(args);
        break;
      case 'generate_executive_statement':
        result = await generateExecutiveStatement(args);
        break;
      case 'generate_visual_content':
        result = await generateVisualContent(args);
        break;
      case 'optimize_content_seo':
        result = await optimizeContentSEO(args);
        break;
      case 'generate_media_list':
        result = await generateMediaList(args);
        break;
      case 'generate_media_pitch':
        result = await generateMediaPitch(args);
        break;
      case 'generate_email_sequence':
        result = await generateEmailSequence(args);
        break;
      default:
        throw new Error(`Unknown tool: ${tool}`);
    }
    
    return new Response(
      JSON.stringify({ ...result, success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('MCP Content Error:', error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});