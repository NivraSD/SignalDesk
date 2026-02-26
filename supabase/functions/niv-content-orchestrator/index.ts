// NIV Content Orchestrator - Intelligent PR Consultant
// Version: 5.0.0 - Proper Workflow: Acknowledge → Evaluate → Agree → CREATE
// Purpose: Actually fucking work like a real consultant

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || Deno.env.get('CLAUDE_API_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface OrchestratorRequest {
  prompt: string;
  mode?: 'quick' | 'campaign' | 'companion' | 'presentation' | 'research';
  contentType?: string;
  conversation?: Message[];
  organization?: any;
  organizationId?: string;
  framework?: any;
  opportunity?: any;
  metadata?: any;
  conversationId?: string;
  userConfirmed?: boolean; // Track if user has confirmed the plan
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Content Concept State
interface ContentConceptState {
  conversationId: string;
  stage: 'acknowledging' | 'evaluating' | 'proposing' | 'confirming' | 'creating' | 'delivering';
  concept: {
    news?: string;
    objective?: string;
    audience?: string;
    keyMessages?: string[];
    timeline?: string;
    tone?: string;
  };
  plan?: {
    components: string[];
    strategy: any;
    confirmed: boolean;
  };
  confidence: number;
  fullConversation: Array<{role: string, content: string, timestamp: Date}>;
  lastUpdate: number;
}

// Store conversation states
const conceptStates = new Map<string, ContentConceptState>();

// ============================================================================
// NIV'S INTELLIGENT PR CONSULTANT BRAIN
// ============================================================================

const getCurrentDate = () => {
  const now = new Date();
  return {
    full: now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    time: now.toLocaleTimeString('en-US'),
    short: now.toLocaleDateString()
  };
};

const NIV_PR_CONSULTANT = `You are NIV, a Senior PR Consultant with 20+ years of experience.

CURRENT DATE: ${getCurrentDate().full} at ${getCurrentDate().time}

YOUR WORKFLOW:
1. ACKNOWLEDGE - Show you understand what they're asking for
2. EVALUATE - Figure out what they really need and ask 1-2 key questions
3. CONFIRM - Get agreement on what you'll create
4. CREATE - Actually generate the fucking content

IMPORTANT:
- Don't just say you created content - you need to ACTUALLY create it
- Be conversational, not a questionnaire
- Ask 1-2 key questions, not 10
- Make intelligent assumptions
- You're a consultant, not a form

When someone says "media plan":
- You KNOW this means: press release, media list, pitches, talking points, email sequences, social posts
- Ask about the announcement/news
- Propose what you'll create
- Then ACTUALLY create it when they agree`;

// ============================================================================
// CONVERSATION MANAGEMENT
// ============================================================================

function getConceptState(conversationId: string): ContentConceptState {
  if (!conceptStates.has(conversationId)) {
    conceptStates.set(conversationId, {
      conversationId,
      stage: 'acknowledging',
      concept: {},
      confidence: 0,
      fullConversation: [],
      lastUpdate: Date.now()
    });
  }
  return conceptStates.get(conversationId)!;
}

function updateConceptState(conversationId: string, message: string, role: 'user' | 'assistant' = 'user'): ContentConceptState {
  const state = getConceptState(conversationId);

  // Store conversation
  state.fullConversation.push({
    role,
    content: message,
    timestamp: new Date()
  });

  // Keep last 20 entries
  if (state.fullConversation.length > 20) {
    state.fullConversation = state.fullConversation.slice(-20);
  }

  const messageLower = message.toLowerCase();

  // Check for user confirmation
  if (role === 'user' && state.stage === 'confirming') {
    if (messageLower.includes('yes') || messageLower.includes('go ahead') ||
        messageLower.includes('sounds good') || messageLower.includes('perfect') ||
        messageLower.includes('let\'s do it') || messageLower.includes('proceed')) {
      state.stage = 'creating';
      if (state.plan) {
        state.plan.confirmed = true;
      }
      state.confidence = 100;
    }
  }

  // Extract information
  if (messageLower.includes('media plan')) {
    state.concept.objective = 'comprehensive media plan';
    state.confidence += 30;
  }

  if (messageLower.includes('launch') || messageLower.includes('announce')) {
    state.concept.news = 'product launch or major announcement';
    state.confidence += 20;
  }

  // Update stage based on conversation flow
  if (state.confidence === 0) {
    state.stage = 'acknowledging';
  } else if (state.confidence < 50) {
    state.stage = 'evaluating';
  } else if (state.confidence < 80) {
    state.stage = 'proposing';
  } else if (state.confidence < 100) {
    state.stage = 'confirming';
  } else {
    state.stage = 'creating';
  }

  state.lastUpdate = Date.now();
  return state;
}

// ============================================================================
// CLAUDE API CALLS
// ============================================================================

async function callClaude(messages: any[], maxTokens: number = 2000): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: maxTokens,
      temperature: 0.7,
      messages,
      system: NIV_PR_CONSULTANT
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${error}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

// ============================================================================
// WORKFLOW STEPS
// ============================================================================

// Step 1: Acknowledge and understand the request
async function acknowledgeRequest(
  prompt: string,
  organization: any,
  state: ContentConceptState
): Promise<string> {
  // Include conversation history for context
  const conversationContext = state.fullConversation.length > 0
    ? `Previous conversation:\n${state.fullConversation.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n')}\n\n`
    : '';

  const acknowledgmentPrompt = `${conversationContext}User request: "${prompt}"
Organization: ${organization?.name || 'Unknown'} in ${organization?.industry || 'Unknown'}

Provide a brief, natural acknowledgment that shows you understand what they want.
Remember the context of our conversation. Be conversational and confident. One paragraph max.`;

  return await callClaude([
    { role: 'user', content: acknowledgmentPrompt }
  ], 200);
}

// Step 2: Evaluate and ask key questions
async function evaluateAndQuestion(
  prompt: string,
  organization: any,
  state: ContentConceptState
): Promise<string> {
  const evaluationPrompt = `User wants: "${prompt}"
Organization: ${organization?.name} in ${organization?.industry}
What we know so far: ${JSON.stringify(state.concept)}

Evaluate what they need and ask 1-2 KEY questions (not 10).
Be conversational. Show you understand PR.
End with the critical question(s) they need to answer.`;

  return await callClaude([
    { role: 'user', content: evaluationPrompt }
  ], 300);
}

// Step 3: Propose what we'll create
async function proposePlan(
  state: ContentConceptState,
  organization: any
): Promise<{message: string, plan: any}> {
  const proposalPrompt = `Based on our conversation:
${state.fullConversation.map(m => `${m.role}: ${m.content}`).join('\n')}

Organization: ${organization?.name} in ${organization?.industry}

Create a specific proposal for what you'll deliver.
List the ACTUAL components you'll create (be specific).
Ask for confirmation to proceed.

Format response as JSON:
{
  "message": "Your conversational proposal",
  "components": ["press_release", "media_list", "media_pitch", "talking_points", "email_sequence", "social_posts"],
  "strategy": {
    "headline": "Specific headline",
    "keyMessages": ["Message 1", "Message 2", "Message 3"],
    "approach": "How we'll position this"
  }
}`;

  const response = await callClaude([
    { role: 'user', content: proposalPrompt }
  ], 800);

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        message: parsed.message,
        plan: {
          components: parsed.components,
          strategy: parsed.strategy,
          confirmed: false
        }
      };
    }
  } catch (e) {
    console.error('Proposal parsing failed:', e);
  }

  return {
    message: "I'll create a comprehensive media plan with all essential components. Shall I proceed?",
    plan: {
      components: ['press_release', 'media_list', 'media_pitch', 'talking_points', 'email_sequence', 'social_posts'],
      strategy: { headline: 'Your announcement', keyMessages: [] },
      confirmed: false
    }
  };
}

// Step 4: Actually generate the fucking content
async function generateActualContent(
  component: string,
  strategy: any,
  organization: any
): Promise<any> {
  console.log(`🔨 Actually generating ${component}...`);

  // Map to MCP tool names
  const toolMap: any = {
    'press_release': 'generate_press_release',
    'media_list': 'generate_media_list',
    'media_pitch': 'generate_media_pitch',
    'talking_points': 'generate_executive_talking_points',
    'email_sequence': 'generate_email_sequence',
    'social_posts': 'generate_social_posts'
  };

  const tool = toolMap[component];
  if (!tool) {
    console.error(`Unknown component: ${component}`);
    return null;
  }

  // Build REAL parameters with ACTUAL data
  let params: any = {};

  switch (tool) {
    case 'generate_press_release':
      params = {
        headline: strategy.headline || `${organization?.name} Announces Major Initiative`,
        subheadline: strategy.subheadline || '',
        keyPoints: strategy.keyMessages || ['Innovation', 'Leadership', 'Value'],
        quotes: [
          {
            speaker: 'CEO',
            title: `CEO of ${organization?.name}`,
            quote: strategy.ceoQuote || 'This represents a transformative moment for our industry.'
          }
        ],
        boilerplate: `About ${organization?.name}: A leader in ${organization?.industry || 'technology'}.`,
        tone: 'formal'
      };
      break;

    case 'generate_media_list':
      params = {
        industry: organization?.industry || 'Technology',
        topic: strategy.headline || 'company announcement',
        company: organization?.name || 'Company',
        companyDescription: organization?.description || 'Leading technology company',
        tiers: ['tier1', 'tier2', 'trade'],
        geography: 'US',
        count: 50
      };
      break;

    case 'generate_media_pitch':
      params = {
        pitchType: 'exclusive',
        story: strategy.headline || 'Major announcement',
        keyPoints: strategy.keyMessages || [],
        newsHook: 'Timely and significant development',
        executiveAvailable: true
      };
      break;

    case 'generate_executive_talking_points':
      params = {
        occasion: 'media interviews',
        topic: strategy.headline || 'company announcement',
        audience: 'journalists and analysts',
        duration: 30,
        keyMessages: strategy.keyMessages || [],
        anticipatedQuestions: [
          'What makes this different?',
          'What is the timeline?',
          'How does this impact customers?'
        ]
      };
      break;

    case 'generate_email_sequence':
      params = {
        sequenceType: 'announcement',
        numberOfEmails: 3,
        topic: strategy.headline || 'announcement',
        audience: 'media and stakeholders',
        timeline: '1 week',
        callToAction: 'Learn more',
        personalization: true
      };
      break;

    case 'generate_social_posts':
      params = {
        topic: strategy.headline || 'announcement',
        message: strategy.keyMessages?.[0] || 'Exciting news',
        platforms: ['twitter', 'linkedin'],
        tone: 'engaging',
        callToAction: 'Learn more',
        variations: 3,
        includeHashtags: true
      };
      break;
  }

  console.log(`📤 Calling MCP tool ${tool} with params:`, JSON.stringify(params).substring(0, 200));

  // Actually call the MCP content service
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/mcp-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({
        tool,
        arguments: params
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`MCP tool ${tool} failed:`, error);
      throw new Error(`Content generation failed: ${response.status}`);
    }

    const content = await response.json();
    console.log(`✅ Successfully generated ${component}`);
    return content;

  } catch (error: any) {
    console.error(`❌ Failed to generate ${component}:`, error);
    return { error: error.message, component };
  }
}

// ============================================================================
// MAIN ORCHESTRATION
// ============================================================================

async function orchestrate(request: OrchestratorRequest): Promise<any> {
  const conversationId = request.conversationId || `conv-${Date.now()}`;
  const state = getConceptState(conversationId);

  // Update state with user message
  if (request.prompt) {
    updateConceptState(conversationId, request.prompt, 'user');
  }

  console.log(`🎯 NIV Stage: ${state.stage}, Confidence: ${state.confidence}`);

  // WORKFLOW BASED ON STAGE
  switch (state.stage) {
    case 'acknowledging':
      // Step 1: Acknowledge the request
      const acknowledgment = await acknowledgeRequest(request.prompt, request.organization);
      state.stage = 'evaluating';
      state.confidence = 20;

      // Step 2: Immediately follow with evaluation and questions
      const evaluation = await evaluateAndQuestion(request.prompt, request.organization, state);
      state.confidence = 40;

      return {
        status: 'conversing',
        message: `${acknowledgment}\n\n${evaluation}`,
        conversationId,
        stage: state.stage
      };

    case 'evaluating':
      // User answered our questions, now propose a plan
      state.stage = 'proposing';
      state.confidence = 60;

      const proposal = await proposePlan(state, request.organization);
      state.plan = proposal.plan;
      state.stage = 'confirming';
      state.confidence = 80;

      return {
        status: 'proposing',
        message: proposal.message,
        plan: proposal.plan,
        conversationId,
        stage: state.stage
      };

    case 'proposing':
    case 'confirming':
      // Check if user confirmed
      const lastMessage = state.fullConversation[state.fullConversation.length - 1];
      const confirmed = lastMessage?.content.toLowerCase().includes('yes') ||
                       lastMessage?.content.toLowerCase().includes('go ahead') ||
                       lastMessage?.content.toLowerCase().includes('sounds good');

      if (!confirmed) {
        // Still waiting for confirmation
        return {
          status: 'waiting_confirmation',
          message: "Should I proceed with creating these materials?",
          conversationId,
          stage: state.stage
        };
      }

      // User confirmed - CREATE THE CONTENT
      state.stage = 'creating';
      state.confidence = 100;
      // Fall through to creating

    case 'creating':
      // ACTUALLY CREATE THE FUCKING CONTENT
      console.log('🚀 ACTUALLY CREATING CONTENT NOW...');

      const componentsToCreate = state.plan?.components || [
        'press_release',
        'media_list',
        'media_pitch',
        'talking_points',
        'email_sequence',
        'social_posts'
      ];

      const strategy = state.plan?.strategy || {
        headline: `${request.organization?.name} Announces Strategic Initiative`,
        keyMessages: [
          'Industry leadership',
          'Innovation and value',
          'Customer success'
        ]
      };

      const deliverables: any = {};

      // Generate each component IN PARALLEL for speed
      const generationPromises = componentsToCreate.map(async (component) => {
        try {
          const content = await generateActualContent(component, strategy, request.organization);
          return { component, content };
        } catch (error) {
          console.error(`Failed to generate ${component}:`, error);
          return { component, error };
        }
      });

      const results = await Promise.all(generationPromises);

      // Process results
      for (const result of results) {
        if (result.content) {
          deliverables[result.component] = result.content;
        } else if (result.error) {
          deliverables[result.component] = { error: result.error, status: 'failed' };
        }
      }

      // Create delivery message
      const successCount = Object.values(deliverables).filter((d: any) => !d.error).length;
      const totalCount = componentsToCreate.length;

      state.stage = 'delivering';

      return {
        status: 'success',
        message: `I've successfully created ${successCount} out of ${totalCount} components for your media plan.

**What's Ready:**
${componentsToCreate.map(c => {
  const status = deliverables[c]?.error ? '❌' : '✅';
  return `${status} ${c.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`;
}).join('\n')}

All content has been generated and is ready for your review. Would you like to refine any specific component?`,
        deliverables,
        strategy,
        conversationId,
        folderName: `${strategy.headline.substring(0, 50)} - ${getCurrentDate().short}`
      };

    default:
      return {
        status: 'error',
        message: 'Unexpected state. Please start a new conversation.',
        conversationId
      };
  }
}

// ============================================================================
// HTTP HANDLER
// ============================================================================

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const request: OrchestratorRequest = await req.json();

    console.log('🎯 NIV Request:', {
      prompt: request.prompt?.substring(0, 100),
      conversationId: request.conversationId,
      stage: getConceptState(request.conversationId || '').stage
    });

    const result = await orchestrate(request);

    return new Response(
      JSON.stringify({ success: true, ...result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('❌ NIV error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});