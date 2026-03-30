// backend/src/controllers/assistantController.js
const claudeService = require('../../config/claude');

// In-memory storage for chat history (will be replaced with database later)
let chatHistory = {};

// Main chat function
const chat = async (req, res) => {
  try {
    const { message, projectId } = req.body;
    const userId = req.user?.id || 'demo-user'; // Using demo user for now

    // Initialize chat history for user/project if it doesn't exist
    const historyKey = projectId ? `${userId}-${projectId}` : userId;
    if (!chatHistory[historyKey]) {
      chatHistory[historyKey] = [];
    }

    // Add user message to history
    chatHistory[historyKey].push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    // Get response from Claude
    let response;
    try {
      // Pass conversation history for context
      const conversationHistory = chatHistory[historyKey].map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      response = await claudeService.sendConversation(conversationHistory);
    } catch (claudeError) {
      console.error('Claude API error:', claudeError);
      // Fallback response if Claude fails
      response = "I'm having trouble connecting to my AI service right now. Please try again in a moment.";
    }

    // Add Claude's response to history
    chatHistory[historyKey].push({
      role: 'assistant',
      content: response,
      timestamp: new Date()
    });

    // Extract any suggested actions from the response
    const actions = extractActionsFromResponse(response);

    res.json({
      success: true,
      response,
      actions,
      projectId
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process chat message',
      error: error.message
    });
  }
};

// Get chat history
const getHistory = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id || 'demo-user';
    
    const historyKey = projectId ? `${userId}-${projectId}` : userId;
    const history = chatHistory[historyKey] || [];

    res.json({
      success: true,
      history,
      projectId
    });

  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat history',
      error: error.message
    });
  }
};

// Clear chat history
const clearHistory = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id || 'demo-user';
    
    const historyKey = projectId ? `${userId}-${projectId}` : userId;
    chatHistory[historyKey] = [];

    res.json({
      success: true,
      message: 'Chat history cleared',
      projectId
    });

  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear chat history',
      error: error.message
    });
  }
};

// Helper function to extract action suggestions from Claude's response
const extractActionsFromResponse = (response) => {
  const actions = [];
  
  // Simple keyword matching for now - can be enhanced with better NLP
  if (response.toLowerCase().includes('create') && response.toLowerCase().includes('project')) {
    actions.push({
      type: 'create_project',
      label: 'Create New Project',
      data: {}
    });
  }
  
  if (response.toLowerCase().includes('generate content')) {
    actions.push({
      type: 'generate_content',
      label: 'Open Content Generator',
      data: {}
    });
  }

  if (response.toLowerCase().includes('media list')) {
    actions.push({
      type: 'media_list',
      label: 'Build Media List',
      data: {}
    });
  }

  if (response.toLowerCase().includes('campaign')) {
    actions.push({
      type: 'campaign_intelligence',
      label: 'Launch Campaign Intelligence',
      data: {}
    });
  }
  
  return actions;
};

// Keep the old function name for backward compatibility if needed
const chatWithAssistant = chat;

module.exports = {
  chat,
  chatWithAssistant,
  getHistory,
  clearHistory
};
