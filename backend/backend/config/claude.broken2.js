const Anthropic = require('@anthropic-ai/sdk');

class ClaudeService {
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY,
    });
    this.model = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';
  }

  async sendMessage(prompt, conversationHistory = []) {
    try {
      console.log('Claude sendMessage called');
      console.log('Conversation history length:', conversationHistory.length);
      
      // Build messages array
      const messages = conversationHistory.length > 0 ? conversationHistory : [{
        role: 'user',
        content: prompt
      }];
      
      console.log('Sending to Claude:', messages.length, 'messages');
      
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1024,
        system: this.getDefaultSystemPrompt(),
        messages: messages
      });

      return response.content[0].text;
    } catch (error) {
      console.error('Claude API Error:', error.message);
      console.error('Full error:', error);
      throw error;
    }
  }

  async sendConversation(messages, options = {}) {
    try {
      console.log('sendConversation: Received', messages.length, 'messages');
      
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7,
        system: options.systemPrompt || this.getDefaultSystemPrompt(),
        messages: messages
      });
return response.content[0].text; 
} catch (error)
    }
  }
async generateContent(prompt, maxTokens = 4000) {
  try {
    console.log('=== generateContent called ===');
    console.log('API Key exists:', !!this.client.apiKey);
    console.log('Model:', this.model);
    console.log('Prompt preview:', prompt.substring(0, 100) + '...');
    
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: maxTokens,
      messages: [{
        role: 'user',
        content: prompt
      }],
      system: 'You are a professional PR and marketing content creator. Generate high-quality, industry-standard content based on the user\'s requirements.'
    });

    console.log('✅ Claude API responded successfully');
    const responseText = response.content[0].text;
    console.log('Response length:', responseText.length);
    console.log('Response preview:', responseText.substring(0, 200) + '...');
    
    return responseText;
  } catch (error) {
    console.error('❌ Claude content generation error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      status: error.status
    });
    
    if (error.status === 529) {
      throw new Error('Claude is temporarily overloaded. Please try again in a moment.');
    }
    
    throw error;
  }
}
  getDefaultSystemPrompt() {
    return 'You are SignalDesk AI, an intelligent PR assistant. You help users with PR strategy, content creation, and media relations.';
  }
}

module.exports = new ClaudeService();
