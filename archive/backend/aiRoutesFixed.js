const express = require("express");
const router = express.Router();
const authMiddleware = require("../src/middleware/authMiddleware");

// SIMPLE conversation state - in memory for now
const conversationStates = new Map();

// FIXED unified-chat endpoint - ALWAYS asks ONE question
router.post("/unified-chat", authMiddleware, async (req, res) => {
  try {
    const { message, mode, context } = req.body;
    const userId = req.user.id;
    
    console.log("[FIXED AI] Request:", {
      message: message?.substring(0, 50),
      userId,
      folder: context?.folder,
      contentType: context?.contentTypeName
    });

    // Get or create conversation state
    if (!conversationStates.has(userId)) {
      conversationStates.set(userId, {
        messageCount: 0,
        contentType: null,
        info: []
      });
    }
    
    const state = conversationStates.get(userId);
    
    // CRITICAL: Check if this is about content creation
    const isContentRequest = 
      message.toLowerCase().includes('thought leadership') ||
      message.toLowerCase().includes('press release') ||
      message.toLowerCase().includes('social media') ||
      message.toLowerCase().includes('blog') ||
      message.toLowerCase().includes('email') ||
      context?.folder === 'content-generator';
    
    let response = "";
    
    if (isContentRequest) {
      // FORCE ONE QUESTION RESPONSES
      if (state.messageCount === 0) {
        // First question
        response = "What's the main topic you'd like to cover?";
        state.contentType = context?.contentTypeName || detectContentType(message);
      } else if (state.messageCount === 1) {
        // Second question
        response = "Who is your target audience?";
        state.info.push(message);
      } else if (state.messageCount === 2) {
        // Third question - offer to generate
        response = "Great! Should I generate it now?";
        state.info.push(message);
      } else if (message.toLowerCase().includes('yes') || message.toLowerCase().includes('generate')) {
        // Generate content
        response = `# ${state.contentType || 'Content'}\n\nBased on our conversation, here's your content:\n\n[Generated content would appear here in production with Claude API]\n\nTopic: ${state.info[0] || 'Your topic'}\nAudience: ${state.info[1] || 'Your audience'}`;
        
        // Reset state after generation
        state.messageCount = 0;
        state.info = [];
        
        res.json({
          success: true,
          response: response,
          suggestions: [],
          mode: mode,
          isGeneratedContent: true // This makes it go to workspace
        });
        return;
      } else {
        // Continue gathering info
        response = "What key points should I include?";
        state.info.push(message);
      }
      
      state.messageCount++;
    } else {
      // Non-content request - just be helpful
      response = "I can help you create content like press releases, social media posts, or thought leadership pieces. What would you like to create?";
    }
    
    console.log("[FIXED AI] Response:", response.substring(0, 100));
    
    res.json({
      success: true,
      response: response,
      suggestions: [],
      mode: mode,
      isGeneratedContent: false
    });
    
  } catch (error) {
    console.error("[FIXED AI] Error:", error);
    res.status(500).json({
      success: false,
      message: "AI service error",
      error: error.message
    });
  }
});

// Helper to detect content type from message
function detectContentType(message) {
  const lower = message.toLowerCase();
  if (lower.includes('thought leadership')) return 'Thought Leadership';
  if (lower.includes('press release')) return 'Press Release';
  if (lower.includes('social media')) return 'Social Media Post';
  if (lower.includes('blog')) return 'Blog Post';
  if (lower.includes('email')) return 'Email';
  return 'Content';
}

// Version check endpoint
router.get("/version", (req, res) => {
  res.json({
    version: "FIXED-2025-08-12",
    status: "Questions only - no tips",
    timestamp: new Date().toISOString()
  });
});

module.exports = router;