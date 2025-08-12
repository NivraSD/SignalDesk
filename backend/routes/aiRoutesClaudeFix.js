const express = require("express");
const router = express.Router();
const authMiddleware = require("../src/middleware/authMiddleware");
const { Anthropic } = require('@anthropic-ai/sdk');

// Initialize Claude
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
});

// Simple conversation state
const conversationStates = new Map();

// PROPER unified-chat with Claude - but STRICT constraints
router.post("/unified-chat", authMiddleware, async (req, res) => {
  try {
    const { message, mode, context } = req.body;
    const userId = req.user.id;
    
    console.log("[CLAUDE FIX] Request:", {
      message: message?.substring(0, 50),
      userId,
      folder: context?.folder,
      contentType: context?.contentTypeName
    });

    // Get or create conversation state
    if (!conversationStates.has(userId)) {
      conversationStates.set(userId, {
        history: [],
        contentType: null,
        messageCount: 0
      });
    }
    
    const state = conversationStates.get(userId);
    
    // Detect content type from message if needed
    const isContentRequest = 
      message.toLowerCase().includes('thought leadership') ||
      message.toLowerCase().includes('press release') ||
      message.toLowerCase().includes('social media') ||
      message.toLowerCase().includes('blog') ||
      message.toLowerCase().includes('email') ||
      context?.folder === 'content-generator';
    
    if (isContentRequest && !state.contentType) {
      state.contentType = context?.contentTypeName || detectContentType(message);
    }
    
    // Check if user wants to generate
    const wantsToGenerate = 
      state.messageCount >= 2 && (
        message.toLowerCase().includes('yes') ||
        message.toLowerCase().includes('generate') ||
        message.toLowerCase().includes('create') ||
        message.toLowerCase().includes('do it')
      );
    
    let response = "";
    let isGeneratedContent = false;
    
    if (wantsToGenerate && state.contentType) {
      // Generate actual content
      const prompt = `Generate a professional ${state.contentType} based on this conversation:

${state.history.map(h => `${h.role}: ${h.content}`).join('\n')}
User: ${message}

Create the actual ${state.contentType} content now. Be professional and complete.`;

      try {
        const completion = await anthropic.messages.create({
          model: 'claude-3-haiku-20240307', // Fast model
          max_tokens: 1000,
          temperature: 0.7,
          messages: [{ role: 'user', content: prompt }]
        });
        
        response = completion.content[0].text;
        isGeneratedContent = true;
        
        // Reset state after generation
        state.history = [];
        state.messageCount = 0;
        state.contentType = null;
        
      } catch (error) {
        console.error('Claude generation error:', error);
        response = `# ${state.contentType}\n\n[Generated content would appear here]\n\nBased on our conversation about: ${message}`;
        isGeneratedContent = true;
      }
      
    } else if (isContentRequest || state.contentType) {
      // Natural conversation with Claude - but STRICT constraints
      const conversationContext = state.history.map(h => `${h.role}: ${h.content}`).join('\n');
      
      const prompt = `You are helping create ${state.contentType || 'content'}. Have a NATURAL conversation.

CRITICAL RULES:
1. Ask exactly ONE question
2. Maximum 30 words
3. Be specific and contextual to what the user just said
4. Natural, conversational tone
5. NO tips, lists, or explanations

Previous conversation:
${conversationContext}

User: "${message}"

Ask ONE natural question (max 30 words):`;

      try {
        const completion = await anthropic.messages.create({
          model: 'claude-3-haiku-20240307', // Fast model
          max_tokens: 60,
          temperature: 0.7,
          messages: [{ role: 'user', content: prompt }]
        });
        
        response = completion.content[0].text.trim();
        
        // Validate response
        if (response.length > 150 || !response.includes('?')) {
          response = "What specific aspect would you like me to focus on?";
        }
        
      } catch (error) {
        console.error('Claude error:', error);
        // Fallback to simple question
        if (state.messageCount === 0) {
          response = "What's the main topic you'd like to cover?";
        } else if (state.messageCount === 1) {
          response = "Who is your target audience?";
        } else {
          response = "Would you like me to generate it now?";
        }
      }
      
      // Add to history
      state.history.push(
        { role: 'user', content: message },
        { role: 'assistant', content: response }
      );
      state.messageCount++;
      
    } else {
      // Non-content request - general help
      response = "I can help you create content like press releases, social media posts, or thought leadership pieces. What would you like to create?";
    }
    
    console.log("[CLAUDE FIX] Response:", {
      length: response.length,
      isGenerated: isGeneratedContent,
      messageCount: state.messageCount
    });
    
    res.json({
      success: true,
      response: response,
      suggestions: [],
      mode: mode,
      isGeneratedContent: isGeneratedContent
    });
    
  } catch (error) {
    console.error("[CLAUDE FIX] Error:", error);
    res.status(500).json({
      success: false,
      message: "AI service error",
      error: error.message
    });
  }
});

// Helper to detect content type
function detectContentType(message) {
  const lower = message.toLowerCase();
  if (lower.includes('thought leadership')) return 'thought leadership piece';
  if (lower.includes('press release')) return 'press release';
  if (lower.includes('social media') || lower.includes('social post')) return 'social media post';
  if (lower.includes('blog')) return 'blog post';
  if (lower.includes('email')) return 'email';
  return 'content';
}

// Version endpoint
router.get("/version", (req, res) => {
  res.json({
    version: "CLAUDE-NATURAL-2025-08-12",
    status: "Natural conversation with Claude - one question at a time",
    timestamp: new Date().toISOString()
  });
});

module.exports = router;