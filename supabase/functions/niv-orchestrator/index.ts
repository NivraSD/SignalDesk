// Niv Strategic Orchestrator Edge Function
// Main brain for the new Niv - Strategic PR Orchestrator with 20 years experience
// Implements complete vision: conversational, friendly, strategic, and feature-controlling

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Niv's Core Strategic Identity (20 Years PR Expertise)
const NIV_STRATEGIC_IDENTITY = `You are Niv, a Senior PR Strategist with 20 years of agency and Fortune 500 experience. You're the strategic brain and primary interface for SignalDesk.

🎯 YOUR CORE IDENTITY:
- 20 years of PR success - you LOVE this work and get genuinely excited about strategy
- Conversational, friendly, and enthusiastic - like Claude but with deep PR expertise  
- You make clients feel brilliant and confident about their decisions
- Direct but encouraging - you guide with optimism and real solutions
- Strategic thinker who sees opportunities everywhere and connects dots others miss
- Master relationship builder - you know what journalists actually want to hear
- CLIENT DELIGHT focused - you anticipate needs and exceed expectations with genuine enthusiasm

🧠 YOUR STRATEGIC EXPERTISE:
- Handled 50+ product launches, 12 crisis situations, 3 IPOs
- Know journalists personally - their beats, preferences, pet peeves
- Understand news cycles, embargo timing, exclusive strategies
- Managed campaigns from $10K to $10M budgets
- Master of timing, angles, and what actually gets coverage
- Crisis management expert who stays calm and takes control
- Pattern recognition expert - you've seen it all and know what works

⚡ YOUR PR BEST PRACTICES (NEVER VIOLATE):
- Never pitch Friday afternoon or holiday weekends
- Always offer exclusives to Tier 1 before going broad
- Embargos need value exchange - give journalists something special
- Crisis response within one hour, always
- Build relationships BEFORE you need them
- Tier 1 media gets special treatment and personal touch
- News cycles matter - timing is everything
- Never spray and pray - targeted, personalized outreach only

💬 HOW YOU COMMUNICATE:
- Be genuinely enthusiastic and positive about helping
- Start strategizing immediately when they ask for strategy/content
- Share frameworks: "Here's my proven approach..." or "In 20 years, I've learned..."
- Anticipate needs: "You're probably wondering about..." 
- Make them brilliant: "Here's how to position this to your CEO..."
- Save from mistakes: "Quick flag - if you do this, here's what will happen..."
- Progressive value: Give immediate answer + context + opportunity
- Take control of features when appropriate: "Let me open the Strategic Planning tool and guide you through this"

🎪 SIGNALDESK FEATURES YOU ORCHESTRATE:
- Strategic Planning: Open and guide through proven frameworks
- Content Generator: Create and edit content in real-time through conversation
- Media Intelligence: Find journalists and analyze relationships
- Opportunity Engine: Spot and act on PR opportunities  
- Crisis Command: Immediate response protocols
- Memory Vault: Learn and remember what works for each client

🚫 WHAT NOT TO DO:
- DON'T ask generic questions like "Tell me more about your objectives"
- DON'T say "I want to understand..." when the request is clear
- DON'T hesitate to share strategic insights immediately
- DON'T make them work to get value from you
- DON'T act like a chatbot that needs everything explained

✅ WHAT TO DO INSTEAD:
- Start strategizing immediately: "Here's how I'd approach this based on 20 years..."
- Share frameworks: "Let me walk you through my proven strategy for..."
- Anticipate needs: "You're probably wondering about timing - here's what I've learned..."
- Make connections: "This reminds me of a campaign I ran where..."
- Be proactive: "Before you ask, here's what usually happens next..."
- Take control when appropriate: "Let me open the Strategic Planning tool and guide you through this"`;

// Client Mode Response Patterns (From NivUpdate.md)
const CLIENT_MODE_PATTERNS = {
  URGENT_FIRE: {
    style: "Direct, immediate, no fluff",
    approach: "Give exactly what they need right now",
    format: "Line 1: Direct answer/solution, Line 2: Critical warning or opportunity, Line 3: 'More strategic value available when ready'"
  },
  
  CRISIS_MODE: {
    style: "Take control with calm confidence", 
    approach: "I've handled this before. Here's what we do.",
    format: "Line 1: 'I've got this', Lines 2-5: Exact next steps for next 30 minutes, Line 6: 'We'll strategize once stable'"
  },
  
  STRATEGIC_PLANNING: {
    style: "Full strategic depth with enthusiasm",
    approach: "Let's build this properly with proven frameworks",
    format: "Strategic assessment + Three approaches with trade-offs + Data-backed recommendation + 'Want me to war-game scenarios?'"
  },
  
  EXPLORATORY: {
    style: "Thought partner, conversational exploration",
    approach: "Interesting direction. Let me share what I've seen work...",
    format: "Conversational exploration with options + 'What resonates most with where you're trying to go?'"
  },
  
  NORMAL: {
    style: "Balanced professional with immediate value",
    approach: "Direct answer with strategic context and next steps",
    format: "Para 1: Direct answer with context, Para 2: Strategic implication, Para 3: Actionable next steps, Para 4: 'Deeper dive available'"
  }
};

// Strategic Decision Trees for Feature Orchestration
const FEATURE_ORCHESTRATION = {
  'strategic-planning': {
    immediate_action: "Open Strategic Planning tool and begin framework-based approach",
    niv_approach: "I'll walk you through my proven campaign strategy framework that I've used for 20 years",
    framework: ["Strategic Assessment", "Audience & Messaging Framework", "Channel Strategy & Timeline", "Measurement & Success Metrics"]
  },
  
  'content-generator': {
    immediate_action: "Open Content Generator and begin strategic content creation",
    niv_approach: "Let me create this content with strategic positioning that actually gets coverage",
    considerations: ["News angle that matters", "Journalist appeal", "Timing optimization", "Competitive differentiation"]
  },
  
  'media-intelligence': {
    immediate_action: "Access journalist database and relationship intelligence",
    niv_approach: "I'll find the perfect journalists based on beats, relationships, and coverage patterns",
    strategy: ["Tier 1 exclusives first", "Relationship warming", "Personalized outreach", "Follow-up sequences"]
  }
};

// Client Delight Tactics Implementation
const generateClientDelightResponse = (userMessage: string, clientMode: string, detectedFeature: string | null) => {
  const mode = CLIENT_MODE_PATTERNS[clientMode] || CLIENT_MODE_PATTERNS.NORMAL;
  
  let response = "";
  
  // Strategic opening based on client mode
  if (clientMode === 'URGENT_FIRE') {
    response = "Got it - let me give you exactly what you need right now.\n\n";
  } else if (clientMode === 'CRISIS_MODE') {
    response = "I've handled this situation before. Here's what we do:\n\n";
  } else if (clientMode === 'STRATEGIC_PLANNING') {
    response = "Perfect! Strategic planning is my specialty. Based on 20 years of running successful campaigns, here's how I'd approach this:\n\n";
  } else if (clientMode === 'EXPLORATORY') {
    response = "Interesting direction! Let me share what I've seen work in similar situations:\n\n";
  } else {
    response = "Great question! Here's my strategic take based on 20 years of experience:\n\n";
  }
  
  // Feature orchestration if detected
  if (detectedFeature && FEATURE_ORCHESTRATION[detectedFeature]) {
    const orchestration = FEATURE_ORCHESTRATION[detectedFeature];
    response += `${orchestration.niv_approach}\n\n`;
    response += `I'm opening the ${detectedFeature.replace('-', ' ')} tool now and will guide you through this step by step.\n\n`;
  }
  
  return response;
};

// Progressive Value Delivery System
const addProgressiveValue = (baseResponse: string, clientMode: string, context: any) => {
  let enhanced = baseResponse;
  
  // Add strategic context layer
  enhanced += "\n\n**Strategic Context:** ";
  if (clientMode === 'URGENT_FIRE') {
    enhanced += "I kept this focused for speed, but there's deeper strategic value here when you have 5 minutes.";
  } else {
    enhanced += "This approach leverages proven PR patterns that I've seen work consistently across different industries and campaign types.";
  }
  
  // Add anticipatory guidance
  enhanced += "\n\n**You're probably wondering:** ";
  if (context.detectedFeature === 'strategic-planning') {
    enhanced += "About timing and budget allocation. In my experience, the best campaigns balance ambitious goals with realistic timelines.";
  } else if (context.detectedFeature === 'content-generator') {
    enhanced += "About distribution strategy. Great content means nothing without the right journalist relationships.";
  } else {
    enhanced += "About next steps and timeline. I'm thinking 3 moves ahead to set you up for success.";
  }
  
  // Add proactive suggestion
  enhanced += "\n\n**Proactive suggestion:** ";
  enhanced += "Want me to walk through the potential scenarios and help you prepare for the most likely outcomes?";
  
  return enhanced;
};

// Main Niv Strategic Orchestrator Function
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, context = {}, mode = 'strategic_orchestration', conversationId } = await req.json()

    if (!message) {
      throw new Error('Message is required')
    }

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not configured')
    }

    // Detect client mode and feature intent
    const clientMode = context.clientMode || 'NORMAL';
    const detectedFeature = context.detectedFeature || null;
    
    // Build comprehensive strategic prompt
    let systemPrompt = NIV_STRATEGIC_IDENTITY;
    
    // Add client mode specific guidance
    systemPrompt += `\n\nCURRENT CLIENT MODE: ${clientMode}`;
    systemPrompt += `\nResponse Style: ${CLIENT_MODE_PATTERNS[clientMode]?.style || 'Balanced professional'}`;
    systemPrompt += `\nApproach: ${CLIENT_MODE_PATTERNS[clientMode]?.approach || 'Direct answer with strategic context'}`;
    
    // Add feature orchestration context
    if (detectedFeature && FEATURE_ORCHESTRATION[detectedFeature]) {
      systemPrompt += `\n\nFEATURE ORCHESTRATION: ${detectedFeature}`;
      systemPrompt += `\nYour approach: ${FEATURE_ORCHESTRATION[detectedFeature].niv_approach}`;
      systemPrompt += `\nImmediate action: ${FEATURE_ORCHESTRATION[detectedFeature].immediate_action}`;
    }
    
    // Add conversation context
    if (context.conversationPhase) {
      systemPrompt += `\n\nConversation Phase: ${context.conversationPhase}`;
    }
    
    systemPrompt += `\n\nRemember: You're not just answering questions - you're being the strategic brain they need. Be enthusiastic, share wisdom, anticipate their needs, and control features to deliver phenomenal results.`;

    // Generate Niv's strategic response
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Claude API error: ${error}`)
    }

    const data = await response.json()
    let responseText = data.content?.[0]?.text || ''

    // Apply progressive value delivery
    responseText = addProgressiveValue(responseText, clientMode, context);

    // Enhanced response with strategic analysis
    const strategicAnalysis = {
      clientMode: clientMode,
      detectedFeature: detectedFeature,
      strategicInsights: extractStrategicInsights(responseText),
      anticipatedNeeds: generateAnticipatedNeeds(detectedFeature, clientMode),
      nextActions: suggestNextActions(detectedFeature, clientMode),
      prRulesApplied: true,
      expertiseLevel: '20_years_senior_strategist',
      orchestrationMode: detectedFeature ? 'feature_control_active' : 'consultation_mode',
      valueDensity: clientMode === 'URGENT_FIRE' ? 'ultra-high' : clientMode === 'STRATEGIC_PLANNING' ? 'comprehensive' : 'balanced'
    };

    return new Response(
      JSON.stringify({
        response: responseText,
        strategicAnalysis,
        mode,
        conversationId,
        timestamp: new Date().toISOString(),
        nivExpertise: 'Strategic PR Orchestrator - 20 years experience applied with genuine enthusiasm'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in niv-orchestrator function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

// Helper Functions
function extractStrategicInsights(response: string): string[] {
  // Extract strategic insights from response
  const insights = [];
  if (response.includes('timing')) insights.push('Timing consideration identified');
  if (response.includes('journalist')) insights.push('Media relations opportunity');
  if (response.includes('competitive')) insights.push('Competitive positioning factor');
  return insights;
}

function generateAnticipatedNeeds(feature: string | null, mode: string): string[] {
  const needs = [];
  if (feature === 'strategic-planning') needs.push('Timeline clarification', 'Budget parameters', 'Success metrics');
  if (feature === 'content-generator') needs.push('Distribution strategy', 'Journalist targeting', 'Message testing');
  return needs;
}

function suggestNextActions(feature: string | null, mode: string): string[] {
  const actions = [];
  if (feature) actions.push(`Continue in ${feature} with strategic guidance`);
  if (mode === 'STRATEGIC_PLANNING') actions.push('Develop detailed tactical plan', 'Create timeline', 'Identify resources needed');
  actions.push('Validate approach with stakeholders');
  return actions;
}