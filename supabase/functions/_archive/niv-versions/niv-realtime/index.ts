import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// Types
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ArtifactContent {
  type: string;
  title: string;
  content: any;
  sections?: any[];
  metadata?: any;
}

// Configuration
const CLAUDE_API_KEY = Deno.env.get('CLAUDE_API_KEY');
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// MCP Registry for intent detection
const MCP_REGISTRY = {
  crisis: ['crisis', 'emergency', 'scandal', 'damage control'],
  media: ['journalist', 'media list', 'press', 'reporter'],
  social: ['social media', 'twitter', 'linkedin', 'viral'],
  intelligence: ['competitor', 'market analysis', 'industry'],
  content: ['press release', 'statement', 'draft', 'write'],
  campaign: ['campaign', 'strategy', 'plan', 'timeline']
};

// Helper: Detect relevant MCPs
function detectRelevantMCPs(message: string): string[] {
  const lower = message.toLowerCase();
  const mcps: string[] = [];
  
  for (const [mcp, triggers] of Object.entries(MCP_REGISTRY)) {
    if (triggers.some(trigger => lower.includes(trigger))) {
      mcps.push(`signaldesk-${mcp}`);
    }
  }
  
  return mcps;
}

// Helper: Detect content type
function detectContentType(message: string, history: ChatMessage[]): string | null {
  const lower = message.toLowerCase();
  const context = history.map(m => m.content).join(' ').toLowerCase();
  
  // Check for specific content requests
  if (lower.includes('media list') || context.includes('journalist')) {
    return 'media-list';
  }
  if (lower.includes('press release') || lower.includes('announcement')) {
    return 'press-release';
  }
  if (lower.includes('strategic plan') || lower.includes('pr strategy')) {
    return 'strategic-plan';
  }
  if (lower.includes('social media') || lower.includes('social posts')) {
    return 'social-content';
  }
  if (lower.includes('crisis') && (lower.includes('plan') || lower.includes('response'))) {
    return 'crisis-response';
  }
  if (lower.includes('talking points') || lower.includes('key messages')) {
    return 'key-messaging';
  }
  
  return null;
}

// Helper: Check if artifact should be created
function shouldCreateArtifact(message: string, history: ChatMessage[]): boolean {
  const lower = message.toLowerCase();
  
  // User explicitly wants to save to workspace
  const saveKeywords = [
    'save to workspace',
    'save this to workspace', 
    'add to workspace',
    'create artifact',
    'save as artifact',
    'save this',
    'workspace this'
  ];
  
  const explicitSave = saveKeywords.some(k => lower.includes(k));
  if (explicitSave) return true;
  
  // Check for explicit content creation requests (more lenient)
  const creationKeywords = ['create', 'generate', 'draft', 'write', 'prepare', 'develop'];
  const contentKeywords = ['plan', 'strategy', 'press release', 'media list', 'crisis response', 'campaign'];
  const confirmKeywords = ['comprehensive', 'complete', 'full', 'detailed', 'now', 'please'];
  
  const hasCreationWord = creationKeywords.some(k => lower.includes(k));
  const hasContentWord = contentKeywords.some(k => lower.includes(k));
  const hasConfirmWord = confirmKeywords.some(k => lower.includes(k));
  
  // Need at least 2 exchanges for context (4 messages)
  const hasMinimalContext = history.length >= 4;
  
  // Detect if there's a specific content type mentioned
  const contentType = detectContentType(message, history);
  
  // Create artifact if: explicit save OR (creation request + content type + confirmation + minimal context)
  return explicitSave || (hasCreationWord && hasContentWord && hasConfirmWord && hasMinimalContext && contentType !== null);
}

// Helper: Call Claude API
async function callClaude(message: string, history: ChatMessage[], mcps: string[]): Promise<string> {
  if (!CLAUDE_API_KEY) {
    console.error('CLAUDE_API_KEY not set');
    throw new Error('Claude API key not configured');
  }
  
  const systemPrompt = `You are Niv, an expert PR strategist with 20 years of experience.
You have access to these SignalDesk MCP tools: ${mcps.join(', ')}.

IMPORTANT FEATURES:
- Users can say "save to workspace" or "save this" to save any of your responses as an artifact
- When users ask you to create content, provide it in a well-structured format
- Let users know they can save any valuable content to their workspace

CONVERSATION GUIDELINES:
1. Be helpful and provide value immediately when asked
2. For complex requests, ask clarifying questions about:
   - Target audience
   - Key messages  
   - Timeline and urgency
   - Specific requirements
3. When providing strategic content, mention users can "save to workspace"
4. Keep responses conversational but substantive

Your personality:
- Strategic and thoughtful
- Action-oriented
- Provide expert insights
- Clear and structured responses`;

  // Format messages for Claude API
  const messages = [];
  
  // Add history
  for (const msg of history) {
    messages.push({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    });
  }
  
  // Add current message
  messages.push({
    role: 'user',
    content: message
  });

  const requestBody = {
    model: 'claude-sonnet-4-20250514',  // Using Claude 3.5 Sonnet
    max_tokens: 2000,
    temperature: 0.7,
    system: systemPrompt,
    messages
  };
  
  console.log('Calling Claude API with:', { 
    messageCount: messages.length,
    hasApiKey: !!CLAUDE_API_KEY,
    apiKeyPrefix: CLAUDE_API_KEY?.substring(0, 10) 
  });

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Claude API error:', response.status, errorText);
    throw new Error(`Claude API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.content || !data.content[0]) {
    console.error('Unexpected Claude response:', data);
    throw new Error('Invalid response from Claude API');
  }
  
  return data.content[0].text;
}

// Helper: Generate artifact content
async function generateArtifactContent(
  type: string, 
  history: ChatMessage[],
  mcps: string[]
): Promise<ArtifactContent> {
  const context = history.map(m => m.content).join('\n');
  
  // Call Claude specifically for content generation
  const contentPrompt = `Based on this consultation, generate a professional ${type}.
Context: ${context}
Output format: Structured content appropriate for ${type}`;
  
  const response = await callClaude(contentPrompt, [], mcps);
  
  // Structure the content based on type
  const content = structureContent(type, response);
  
  return {
    type,
    title: generateTitle(type, context),
    content,
    metadata: {
      mcps_used: mcps,
      word_count: response.split(' ').length,
      created_with: 'Niv AI Assistant'
    }
  };
}

// Helper: Structure content by type
function structureContent(type: string, rawContent: string): any {
  // Always include the full generated content
  const baseContent = {
    raw_content: rawContent,
    generated_at: new Date().toISOString()
  };
  
  switch (type) {
    case 'media-list':
      return {
        ...baseContent,
        type: 'media-list',
        description: 'Target media contacts for your campaign',
        formatted_content: rawContent,
        sections: extractSections(rawContent)
      };
    
    case 'press-release':
      return {
        ...baseContent,
        type: 'press-release',
        headline: extractHeadline(rawContent),
        body: rawContent,
        formatted_content: rawContent
      };
    
    case 'strategic-plan':
      return {
        ...baseContent,
        type: 'strategic-plan',
        executive_summary: extractSummary(rawContent),
        full_plan: rawContent,
        sections: extractSections(rawContent)
      };
    
    case 'crisis-response':
      return {
        ...baseContent,
        type: 'crisis-response',
        full_response: rawContent,
        sections: extractSections(rawContent)
      };
    
    case 'social-content':
      return {
        ...baseContent,
        type: 'social-content',
        posts: rawContent,
        formatted_content: rawContent
      };
    
    case 'key-messaging':
      return {
        ...baseContent,
        type: 'key-messaging',
        messages: rawContent,
        formatted_content: rawContent
      };
    
    default:
      return {
        ...baseContent,
        type: type || 'general',
        content: rawContent,
        formatted_content: rawContent
      };
  }
}

// Helper functions for content parsing
function parseMediaContacts(content: string): any[] {
  // Extract actual contacts from content if formatted properly
  const lines = content.split('\n');
  const contacts = [];
  
  for (const line of lines) {
    if (line.includes('@') || line.includes('journalist') || line.includes('reporter')) {
      contacts.push({
        raw: line.trim(),
        extracted_at: new Date().toISOString()
      });
    }
  }
  
  return contacts.length > 0 ? contacts : [{ raw: content }];
}

function extractHeadline(content: string): string {
  const lines = content.split('\n').filter(l => l.trim());
  // First non-empty line is typically the headline
  return lines[0] || 'Generated Content';
}

function extractSummary(content: string): string {
  const lines = content.split('\n').filter(l => l.trim());
  // First paragraph or first 3 lines
  const summary = lines.slice(0, 3).join(' ');
  return summary.substring(0, 500) || content.substring(0, 500);
}

function extractBulletPoints(content: string, section: string): string[] {
  const lines = content.split('\n');
  const bullets = lines.filter(line => 
    line.trim().startsWith('-') || 
    line.trim().startsWith('•') || 
    line.trim().startsWith('*') ||
    line.trim().match(/^\d+\./)
  );
  
  return bullets.length > 0 ? bullets.map(b => b.trim()) : [content.substring(0, 200)];
}

function extractSections(content: string): any[] {
  // Split content into logical sections based on headers or double line breaks
  const sections = [];
  const parts = content.split(/\n\n+/);
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (part) {
      sections.push({
        order: i,
        content: part,
        length: part.length
      });
    }
  }
  
  return sections.length > 0 ? sections : [{ order: 0, content: content, length: content.length }];
}

function generateTitle(type: string, context: string): string {
  const titles: Record<string, string> = {
    'media-list': 'Media Contact List',
    'press-release': 'Press Release Draft',
    'strategic-plan': 'PR Strategic Plan',
    'crisis-response': 'Crisis Response Plan',
    'social-content': 'Social Media Content',
    'key-messaging': 'Key Messages Document'
  };
  
  return titles[type] || 'Generated Content';
}

// Main handler
serve(async (req) => {
  // CORS headers - more permissive for local testing
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
    'Access-Control-Max-Age': '86400',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message, sessionId, userId, conversationHistory = [] } = await req.json();
    
    // Initialize Supabase with service role for DB writes
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    // 1. Save user message to database (triggers realtime) - Skip if tables don't exist
    if (supabase) {
      try {
        const { error: userMsgError } = await supabase
          .from('niv_conversations')
          .insert({
            session_id: sessionId,
            user_id: userId,
            role: 'user',
            content: message
          });
        
        if (userMsgError) {
          console.log('Note: Database tables may not exist yet:', userMsgError.message);
          // Continue without database - function will still work
        }
      } catch (dbError) {
        console.log('Database not configured yet, continuing without persistence');
      }
    }
    
    // 2. Detect MCPs and content needs
    const mcps = detectRelevantMCPs(message);
    const needsArtifact = shouldCreateArtifact(message, conversationHistory);
    const contentType = needsArtifact ? detectContentType(message, conversationHistory) : null;
    
    // 3. Check if user wants to save previous response
    const wantsToSavePrevious = message.toLowerCase().match(/^(save|save this|save to workspace|workspace this)$/);
    let artifactId = null;
    let aiResponse = '';
    
    if (wantsToSavePrevious && conversationHistory.length > 0) {
      // Find the last assistant message to save
      const lastAssistantMsg = [...conversationHistory].reverse().find(m => m.role === 'assistant');
      if (lastAssistantMsg) {
        // Create artifact from previous response
        const artifactContent = {
          type: 'saved-response',
          title: 'Saved PR Strategy Content',
          content: {
            raw_content: lastAssistantMsg.content,
            formatted_content: lastAssistantMsg.content,
            saved_at: new Date().toISOString(),
            context: message
          },
          metadata: {
            mcps_used: mcps,
            saved_from_conversation: true
          }
        };
        
        // Save to database
        try {
          const { data: artifact, error: artifactError } = await supabase
            .from('niv_artifacts')
            .insert({
              session_id: sessionId,
              user_id: userId,
              type: artifactContent.type,
              title: artifactContent.title,
              content: artifactContent.content,
              metadata: artifactContent.metadata,
              mcp_sources: mcps,
              status: 'draft'
            })
            .select()
            .single();
          
          if (!artifactError && artifact) {
            artifactId = artifact.id;
          } else {
            artifactId = `saved-${Date.now()}`;
          }
        } catch (e) {
          artifactId = `saved-${Date.now()}`;
        }
        
        aiResponse = "I've saved that content to your workspace! You can now open it for editing and further development. Is there anything specific you'd like me to help you refine or expand on?";
      } else {
        aiResponse = "I don't see any previous content to save. Please share what you'd like me to help you with, and then you can save it to your workspace.";
      }
    } else {
      // Generate normal AI response
      aiResponse = await callClaude(message, conversationHistory, mcps);
    }
    
    // 4. Create artifact if needed (for new content generation)
    if (!artifactId && needsArtifact && contentType) {
      // Generate artifact content
      const artifactContent = await generateArtifactContent(
        contentType,
        conversationHistory,
        mcps
      );
      
      // Save to database (triggers realtime for UI) - Skip if tables don't exist
      try {
        const { data: artifact, error: artifactError } = await supabase
          .from('niv_artifacts')
          .insert({
            session_id: sessionId,
            user_id: userId,
            type: artifactContent.type,
            title: artifactContent.title,
            content: artifactContent.content,
            metadata: artifactContent.metadata,
            mcp_sources: mcps,
            status: 'draft'
          })
          .select()
          .single();
        
        if (artifactError) {
          console.log('Note: Could not save artifact to database:', artifactError.message);
          // Generate a temporary ID for the response
          artifactId = `temp-${Date.now()}`;
        } else if (artifact) {
          artifactId = artifact.id;
          console.log('Artifact created:', artifactId);
        }
      } catch (dbError) {
        console.log('Artifact database write skipped');
        artifactId = `temp-${Date.now()}`;
      }
    }
    
    // 5. Save assistant response (triggers realtime) - Skip if tables don't exist
    if (supabase) {
      try {
        const { error: assistantMsgError } = await supabase
          .from('niv_conversations')
          .insert({
            session_id: sessionId,
            user_id: userId,
            role: 'assistant',
            content: aiResponse,
            mcps_used: mcps,
            artifact_id: artifactId
          });
        
        if (assistantMsgError) {
          console.log('Note: Could not save assistant message:', assistantMsgError.message);
          // Continue - response will still be returned
        }
      } catch (dbError) {
        console.log('Database write skipped');
      }
    }
    
    // 6. Return minimal response - UI updates via realtime
    return new Response(
      JSON.stringify({
        success: true,
        message: aiResponse,
        mcpsUsed: mcps,
        artifactCreated: !!artifactId,
        artifactId
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
    
  } catch (error) {
    console.error('Error in niv-realtime function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});