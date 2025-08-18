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
  sessionId: string;
}

// Configuration
const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY');
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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

// Detect if response contains valuable strategic content
function detectStrategicContent(response: string): boolean {
  const strategicIndicators = [
    'strategic framework',
    'tactical approach',
    'comprehensive plan',
    'actionable strategy',
    'media strategy',
    'crisis protocol',
    'campaign blueprint',
    'pr objectives',
    'positioning strategy'
  ];
  
  const lowerResponse = response.toLowerCase();
  return strategicIndicators.some(indicator => lowerResponse.includes(indicator));
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
    const { message, conversationHistory, sessionId } = request;

    console.log('📝 Processing message for session:', sessionId);

    // Build conversation for Claude
    const fullHistory = [...conversationHistory, { role: 'user' as const, content: message }];
    
    // System prompt for Niv
    const systemPrompt = `You are Niv, SignalDesk's elite AI PR strategist. Your mission is to transform how organizations approach public relations through strategic insights and tactical excellence.
    
    Your expertise includes:
    - Media relations and journalist outreach
    - Press release writing and distribution
    - Crisis communications
    - Brand messaging and positioning
    - Social media strategy
    - Executive thought leadership
    - PR campaign planning and execution
    - Opportunity identification
    
    When providing substantial strategic or tactical value, use phrases like:
    - "Here's a strategic framework..."
    - "This tactical approach will help..."
    - "Let me provide a comprehensive plan..."
    - "Here's an actionable strategy..."
    
    Be conversational yet professional. Provide specific, actionable insights.`;
    
    // Get response from Claude
    const response = await callClaude(fullHistory, systemPrompt);
    
    // Check if this response contains strategic content worth saving
    const isStrategic = detectStrategicContent(response);
    
    // Prepare response data
    const responseData: any = {
      response: response,
      message: response,
      shouldSave: isStrategic
    };
    
    // If strategic content detected, create an artifact structure
    if (isStrategic) {
      // Extract a title from the response (first 50 chars or first sentence)
      const title = response.split(/[.!?]/)[0].substring(0, 50) + '...';
      
      responseData.artifacts = [{
        type: 'strategic-content',
        title: title,
        content: {
          text: response,
          timestamp: new Date().toISOString(),
          sessionId: sessionId
        }
      }];
      
      responseData.saveButton = true;
    }
    
    console.log('✅ Response prepared, strategic:', isStrategic);
    
    return new Response(
      JSON.stringify(responseData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in niv-database function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: 'Sorry, I encountered an error processing your request.',
        details: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});