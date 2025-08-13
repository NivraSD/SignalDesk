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
    
    // Detect content type from message if needed - be VERY aggressive
    const isContentRequest = 
      message.toLowerCase().includes('thought') ||
      message.toLowerCase().includes('leadership') ||
      message.toLowerCase().includes('write') ||
      message.toLowerCase().includes('create') ||
      message.toLowerCase().includes('press') ||
      message.toLowerCase().includes('release') ||
      message.toLowerCase().includes('social') ||
      message.toLowerCase().includes('blog') ||
      message.toLowerCase().includes('email') ||
      message.toLowerCase().includes('content') ||
      message.toLowerCase().includes('article') ||
      context?.folder === 'content-generator';
    
    // Check if switching to a new content type or feature
    const isFeatureSwitch = context?.folder && state.lastFolder && context.folder !== state.lastFolder;
    
    if (isContentRequest || isFeatureSwitch) {
      const newContentType = context?.contentTypeName || detectContentType(message);
      
      // If switching content types or features, reset the conversation
      if ((state.contentType && state.contentType !== newContentType) || isFeatureSwitch) {
        console.log("[CLAUDE FIX] Context switch detected:", {
          from: state.contentType || state.lastFolder,
          to: newContentType || context?.folder
        });
        state.history = [];
        state.messageCount = 0;
        state.contentType = newContentType;
        state.lastFolder = context?.folder;
      } else if (!state.contentType) {
        state.contentType = newContentType;
        state.lastFolder = context?.folder;
      }
    }
    
    // IMMEDIATELY generate if content request - don't wait
    let wantsToGenerate = isContentRequest || 
      message.toLowerCase().includes('generate') ||
      message.toLowerCase().includes('create') ||
      message.toLowerCase().includes('write') ||
      message.toLowerCase().includes('make') ||
      message.toLowerCase().includes('yes') ||
      message.toLowerCase().includes('go') ||
      message.toLowerCase().includes('do it') ||
      (state.messageCount >= 1 && isContentRequest); // Generate immediately for content
    
    let response = "";
    let isGeneratedContent = false;
    
    // Generate IMMEDIATELY if requested
    if (wantsToGenerate) {
      // Ensure we have content type
      if (!state.contentType) {
        state.contentType = detectContentType(message) || 'content';
      }
      
      // Generate actual content
      const prompt = `You are a professional content writer. Generate ACTUAL, REAL content - not a template or example.

Request: ${message}
Content Type: ${state.contentType}

Context from conversation:
${state.history.slice(-4).map(h => `${h.role}: ${h.content}`).join('\n')}

IMPORTANT: Generate the ACTUAL ${state.contentType} content now. 
- Do NOT provide a template or example
- Do NOT use placeholder text like [Company Name] or [Your Name]
- Create real, substantive, professional content
- Make it specific and detailed
- If the topic is general (like "AI"), create specific content about that topic

Begin the actual ${state.contentType} content below:`;

      try {
        const completion = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022', // Better model for content generation
          max_tokens: 2000,
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
      
      const prompt = `You are helping create ${state.contentType || 'content'}. Be action-oriented.

Rules:
1. After ONE clarifying question, offer to generate
2. If user provides ANY topic or direction, that's enough to generate
3. Keep responses under 50 words
4. Don't ask for more than one detail
5. Default to generating if you have a topic

Previous conversation:
${conversationContext}

User: "${message}"

Give a brief response (if you have enough info, say "I'll generate that now"):`;

      try {
        const completion = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022', // Better model for conversation
          max_tokens: 300, // Good length for conversation
          temperature: 0.7,
          messages: [{ role: 'user', content: prompt }]
        });
        
        response = completion.content[0].text.trim();
        
        // If AI says it will generate, force generation
        if (response.toLowerCase().includes("i'll generate") || 
            response.toLowerCase().includes("i will generate") ||
            response.toLowerCase().includes("generating") ||
            response.toLowerCase().includes("let me create")) {
          // Force immediate generation
          wantsToGenerate = true;
          state.contentType = state.contentType || detectContentType(message);
        }
        
        // Only validate for excessive length
        if (response.length > 300) {
          response = response.substring(0, 300) + "...";
        }
        
        // Check for stuck conversation (same response repeating 3+ times)
        if (state.history.length > 4) {
          const recentResponses = state.history.slice(-4).filter((_, i) => i % 2 === 1).map(h => h.content);
          const uniqueResponses = new Set(recentResponses);
          if (uniqueResponses.size === 1) {
            // Actually stuck in a loop after multiple attempts
            if (state.messageCount >= 4) {
              response = "I have a good understanding now. Would you like me to generate the content?";
            } else {
              response = "Let me approach this differently. What's the key message you want to convey?";
            }
          }
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
      
      // Add to history (limit to prevent memory issues)
      state.history.push(
        { role: 'user', content: message },
        { role: 'assistant', content: response }
      );
      state.messageCount++;
      
      // Keep history reasonable (last 10 exchanges)
      if (state.history.length > 20) {
        state.history = state.history.slice(-20);
      }
      
      // After 7 exchanges, gently suggest generation (but don't force it)
      if (state.messageCount >= 7 && !response.toLowerCase().includes('generate')) {
        response += " Feel free to let me know when you're ready to generate the content.";
      }
      
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
      shouldGenerate: wantsToGenerate,
      isGeneratedContent: isGeneratedContent,
      generatedContent: isGeneratedContent ? {
        type: state.contentType || 'content',
        content: response
      } : null
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