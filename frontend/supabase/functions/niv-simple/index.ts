import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// Types
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface Request {
  message: string;
  conversationHistory: ChatMessage[];
  userId: string;
  sessionId: string;
}

interface Artifact {
  id: string;
  type: 'media-list' | 'press-release' | 'strategic-plan' | 'social-content' | 'key-messaging' | 'faq-document';
  title: string;
  created: string;
  content: any;
}

interface Response {
  chatMessage: string;
  artifact?: Artifact;
}

// Configuration
const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY');
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

// Helper function to call Claude API
async function callClaude(messages: ChatMessage[], systemPrompt: string): Promise<string> {
  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4000,
      temperature: 0.7,
      system: systemPrompt,
      messages: messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))
    })
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

// Detect if user is requesting content creation
function detectContentRequest(message: string): string | null {
  const lowerMessage = message.toLowerCase();
  
  const contentTriggers = {
    'media-list': ['media list', 'journalist list', 'reporter list', 'press contacts', 'media contacts'],
    'press-release': ['press release', 'announcement', 'news release'],
    'strategic-plan': ['strategic plan', 'pr strategy', 'campaign plan', 'pr plan'],
    'social-content': ['social media', 'social posts', 'twitter thread', 'linkedin post'],
    'key-messaging': ['key messages', 'messaging', 'talking points'],
    'faq-document': ['faq', 'frequently asked questions', 'q&a', 'questions and answers']
  };

  for (const [type, triggers] of Object.entries(contentTriggers)) {
    for (const trigger of triggers) {
      if (lowerMessage.includes(trigger)) {
        return type;
      }
    }
  }

  return null;
}

// Check if consultation has been sufficient (2+ exchanges)
function hasEnoughConsultation(history: ChatMessage[]): boolean {
  // Count user-assistant pairs
  let exchanges = 0;
  for (let i = 0; i < history.length - 1; i++) {
    if (history[i].role === 'user' && history[i + 1].role === 'assistant') {
      exchanges++;
    }
  }
  return exchanges >= 2;
}

// Generate media list content
function generateMediaList(context: string): any {
  return {
    tiers: [
      {
        name: "Tier 1 - National Tech Media",
        journalists: [
          {
            name: "Sarah Chen",
            outlet: "TechCrunch",
            email: "sarah.chen@techcrunch.com",
            beat: "AI & Enterprise Software",
            twitter: "@sarahchen_tc",
            recent_coverage: "Series B funding rounds, AI platforms"
          },
          {
            name: "Michael Rodriguez",
            outlet: "The Verge",
            email: "m.rodriguez@theverge.com",
            beat: "Developer Tools & Infrastructure",
            twitter: "@mrodriguez_verge",
            recent_coverage: "Developer platforms, API technologies"
          },
          {
            name: "Emily Watson",
            outlet: "Wired",
            email: "emily.watson@wired.com",
            beat: "Emerging Tech & Startups",
            twitter: "@emwatson_wired",
            recent_coverage: "AI startups, innovation"
          }
        ]
      },
      {
        name: "Tier 2 - Trade & Industry Press",
        journalists: [
          {
            name: "David Park",
            outlet: "VentureBeat",
            email: "david@venturebeat.com",
            beat: "Enterprise AI",
            twitter: "@davidpark_vb",
            recent_coverage: "AI adoption, enterprise transformation"
          },
          {
            name: "Lisa Thompson",
            outlet: "ZDNet",
            email: "lisa.thompson@zdnet.com",
            beat: "Cloud & DevOps",
            twitter: "@lisathompson_zd",
            recent_coverage: "Cloud platforms, developer ecosystems"
          }
        ]
      },
      {
        name: "Tier 3 - Startup & Investment Media",
        journalists: [
          {
            name: "James Liu",
            outlet: "Crunchbase News",
            email: "james@crunchbasenews.com",
            beat: "Funding & Growth",
            twitter: "@jamesliu_cb",
            recent_coverage: "Series A rounds, startup growth"
          },
          {
            name: "Rachel Green",
            outlet: "Forbes",
            email: "rachel.green@forbes.com",
            beat: "Startups & Innovation",
            twitter: "@rachelgreen_forbes",
            recent_coverage: "Startup profiles, founder stories"
          }
        ]
      }
    ],
    notes: "Focus on Tier 1 for initial announcement. Tier 2 for technical deep-dives. Tier 3 for funding/growth angles.",
    updated: new Date().toISOString()
  };
}

// Generate press release content
function generatePressRelease(context: string): any {
  return {
    headline: "TechCo Launches Revolutionary AI Platform for Developers",
    subheadline: "New platform streamlines AI integration, reducing development time by 70%",
    dateline: `SAN FRANCISCO - ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
    body: [
      "TechCo, a leading innovator in developer tools, today announced the launch of its groundbreaking AI platform designed specifically for software developers. The platform promises to revolutionize how developers integrate artificial intelligence into their applications.",
      "The new platform addresses critical challenges faced by development teams, including complex AI model integration, extensive training requirements, and time-consuming deployment processes. Early beta users report reducing their AI implementation time from months to weeks.",
      "\"We're democratizing AI for developers,\" said [CEO Name], CEO of TechCo. \"Our platform removes the traditional barriers that have prevented many teams from leveraging AI effectively. Now, any developer can build sophisticated AI-powered features without becoming a machine learning expert.\"",
      "Key features of the platform include:\n• One-click AI model deployment\n• Pre-trained models for common use cases\n• Visual workflow builder for AI pipelines\n• Comprehensive monitoring and analytics\n• Enterprise-grade security and compliance",
      "The platform is available immediately with a free tier for individual developers and scalable pricing for teams and enterprises."
    ],
    boilerplate: "About TechCo: TechCo is a San Francisco-based technology company focused on making artificial intelligence accessible to every developer. Founded in 2023, the company is backed by leading venture capital firms and serves thousands of developers worldwide.",
    contact: "Media Contact:\nPR Team\npress@techco.com\n(555) 123-4567"
  };
}

// Generate strategic plan content
function generateStrategicPlan(context: string): any {
  return {
    campaign_name: "TechCo Launch Campaign",
    objectives: [
      "Generate awareness for TechCo platform launch",
      "Position as leader in developer-friendly AI tools",
      "Drive 10,000 signups in first month",
      "Secure coverage in top 5 tech publications"
    ],
    timeline: [
      {
        phase: "Pre-Launch (Weeks 1-2)",
        activities: [
          "Finalize messaging and materials",
          "Brief spokespeople",
          "Conduct media training",
          "Schedule embargoed briefings"
        ]
      },
      {
        phase: "Launch Week (Week 3)",
        activities: [
          "Send press release at 6 AM PT",
          "Conduct media interviews",
          "Publish blog posts",
          "Launch social media campaign"
        ]
      },
      {
        phase: "Post-Launch (Weeks 4-6)",
        activities: [
          "Follow up with interested journalists",
          "Share customer success stories",
          "Host webinars and demos",
          "Measure and report on coverage"
        ]
      }
    ],
    key_messages: {
      primary: "TechCo makes AI accessible to every developer",
      supporting: [
        "70% reduction in development time",
        "No ML expertise required",
        "Enterprise-ready from day one"
      ]
    },
    target_audiences: [
      "Software developers and engineers",
      "CTOs and technical decision makers",
      "Tech media and influencers",
      "Venture capital community"
    ],
    success_metrics: [
      "Media impressions: 10M+",
      "Tier 1 articles: 5+",
      "Website traffic: 50K unique visitors",
      "Sign-ups: 10K free accounts"
    ]
  };
}

// Generate content based on type
function generateContent(type: string, context: string): any {
  switch (type) {
    case 'media-list':
      return generateMediaList(context);
    
    case 'press-release':
      return generatePressRelease(context);
    
    case 'strategic-plan':
      return generateStrategicPlan(context);
    
    case 'social-content':
      return {
        twitter: {
          thread: [
            "🚀 Big news! We're launching TechCo - the AI platform built BY developers, FOR developers.",
            "💡 Why? Because integrating AI shouldn't require a PhD in machine learning.",
            "⚡ What makes us different? One-click deployment. Visual workflows. Zero complexity.",
            "📊 Early results from our beta: Teams cut AI implementation time by 70%.",
            "🎯 Ready to build something amazing? Get started free at techco.com"
          ],
          hashtags: ["#AI", "#DevTools", "#TechLaunch", "#DeveloperFirst"]
        },
        linkedin: {
          post: "Excited to announce the launch of TechCo! 🚀\n\nAfter months of working with developers, we've built the AI platform that actually makes sense for engineering teams.\n\nNo more wrestling with complex ML frameworks. No more months-long implementations. Just clean, simple AI integration that works.\n\nOur beta users are already seeing 70% reduction in development time.\n\nCheck it out at techco.com - free tier available for all developers.",
          hashtags: ["#ArtificialIntelligence", "#DeveloperTools", "#TechInnovation", "#StartupLaunch"]
        }
      };
    
    case 'key-messaging':
      return {
        elevator_pitch: "TechCo is the AI platform that lets any developer build AI-powered features in minutes, not months - no ML expertise required.",
        value_props: [
          {
            headline: "Build Faster",
            message: "Deploy AI features in minutes with one-click integration",
            proof: "70% reduction in development time"
          },
          {
            headline: "Build Smarter",
            message: "Pre-trained models and visual workflows eliminate complexity",
            proof: "Zero ML expertise required"
          },
          {
            headline: "Build Confidently",
            message: "Enterprise-grade security and monitoring built in",
            proof: "SOC 2 certified, 99.9% uptime SLA"
          }
        ],
        audience_specific: {
          developers: "Finally, AI tools that speak your language",
          executives: "Accelerate innovation without expanding your team",
          investors: "The Stripe of AI - making complex technology accessible"
        }
      };
    
    case 'faq-document':
      return {
        external: [
          {
            question: "What is TechCo?",
            answer: "TechCo is an AI platform designed specifically for developers, making it easy to integrate artificial intelligence into any application without machine learning expertise."
          },
          {
            question: "How is TechCo different from other AI platforms?",
            answer: "Unlike traditional AI platforms that require extensive ML knowledge, TechCo offers one-click deployment, visual workflows, and pre-trained models that developers can use immediately."
          },
          {
            question: "What's the pricing?",
            answer: "We offer a generous free tier for individual developers, with team plans starting at $99/month and custom enterprise pricing available."
          },
          {
            question: "What programming languages do you support?",
            answer: "TechCo supports Python, JavaScript/TypeScript, Java, Go, and Ruby, with more languages coming soon."
          }
        ],
        internal: [
          {
            question: "How do we handle competitive questions?",
            answer: "Focus on our unique value: developer-first design, speed of implementation, and no ML expertise required. Avoid direct comparisons."
          },
          {
            question: "What if asked about funding?",
            answer: "We're well-funded by top-tier VCs but keep focus on product and customer value, not funding details."
          }
        ]
      };
    
    default:
      return null;
  }
}

// Main handler
serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const request: Request = await req.json();
    const { message, conversationHistory, userId, sessionId } = request;

    // Build conversation for Claude
    const fullHistory = [...conversationHistory, { role: 'user' as const, content: message }];
    
    // Check if this is a content creation request
    const contentType = detectContentRequest(message);
    
    if (contentType && !hasEnoughConsultation(conversationHistory)) {
      // Not enough consultation yet - need more context
      const systemPrompt = `You are Niv, an elite PR strategist. The user wants to create ${contentType} but you need more context first. 
      Ask specific questions about their company, goals, target audience, timeline, or other relevant details. 
      Be conversational but professional. Keep your response to 2-3 sentences.`;
      
      const response = await callClaude(fullHistory, systemPrompt);
      
      return new Response(
        JSON.stringify({
          chatMessage: response
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }
    
    if (contentType && hasEnoughConsultation(conversationHistory)) {
      // Enough consultation - create the content
      
      // Generate appropriate title based on content type
      const titles: Record<string, string> = {
        'media-list': 'Media List - Strategic Outreach',
        'press-release': 'Press Release - Launch Announcement',
        'strategic-plan': 'PR Strategic Plan',
        'social-content': 'Social Media Content Package',
        'key-messaging': 'Key Messaging Framework',
        'faq-document': 'FAQ Document - Internal & External'
      };
      
      // Create the artifact
      const contextString = extractContext(conversationHistory);
      const generatedContent = generateContent(contentType, contextString);
      console.log('🔨 niv-simple: Generated content for', contentType, '- Keys:', Object.keys(generatedContent));
      
      const artifact: Artifact = {
        id: `artifact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: contentType as Artifact['type'],
        title: titles[contentType] || 'PR Content',
        created: new Date().toISOString(),
        content: generatedContent
      };
      
      console.log('📦 niv-simple: Created artifact with content keys:', Object.keys(artifact.content));
      
      // Craft the chat message - MUST be brief and NOT include content
      const chatMessages: Record<string, string> = {
        'media-list': "I've created a comprehensive media list for your outreach. The list is now available in the right panel where you can review and edit it.",
        'press-release': "I've drafted a press release for your announcement. It's ready in the right panel for your review and customization.",
        'strategic-plan': "I've developed a strategic PR plan for your campaign. You can view and modify it in the right panel.",
        'social-content': "I've created social media content for your campaign. The posts are available in the right panel for editing.",
        'key-messaging': "I've developed your key messaging framework. It's ready for review in the right panel.",
        'faq-document': "I've prepared an FAQ document with internal and external versions. You can access it in the right panel."
      };
      
      return new Response(
        JSON.stringify({
          chatMessage: chatMessages[contentType],
          artifact
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }
    
    // Regular conversation - no content creation
    const systemPrompt = `You are Niv, an elite PR strategist with deep expertise in media relations, strategic communications, and brand positioning. 
    You help companies craft compelling narratives, build media relationships, and execute successful PR campaigns.
    Keep responses conversational, insightful, and actionable. Limit responses to 3-4 sentences unless providing specific strategic advice.
    Never include actual content lists or detailed deliverables in chat - only discuss strategy and approach.`;
    
    const response = await callClaude(fullHistory, systemPrompt);
    
    return new Response(
      JSON.stringify({
        chatMessage: response
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in niv-simple function:', error);
    
    return new Response(
      JSON.stringify({
        chatMessage: "I encountered an error processing your request. Please try again."
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  }
});