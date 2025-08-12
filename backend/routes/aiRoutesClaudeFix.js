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
      
      const prompt = `You are helping create ${state.contentType || 'content'}. Have a natural, helpful conversation.

Guidelines:
1. Ask relevant follow-up questions to understand the user's needs
2. Keep responses concise but complete (aim for 1-2 sentences)
3. Be specific and contextual to what the user just said
4. Natural, professional tone
5. Focus on gathering necessary information for content creation

Previous conversation:
${conversationContext}

User: "${message}"

Provide a helpful, contextual response:`;

      try {
        const completion = await anthropic.messages.create({
          model: 'claude-3-haiku-20240307', // Fast model
          max_tokens: 150, // Increased from 60
          temperature: 0.7,
          messages: [{ role: 'user', content: prompt }]
        });
        
        response = completion.content[0].text.trim();
        
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