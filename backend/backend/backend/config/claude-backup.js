const Anthropic = require('@anthropic-ai/sdk');

class ClaudeService {
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY,
    });
    this.model = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';
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
    } catch (error) {
      console.error('Claude API Error in sendConversation:', error);
      throw error; // Throw the actual error, not a generic one
    }
  }

  getDefaultSystemPrompt() {
    return `You are SignalDesk AI, an intelligent PR assistant. You help users with:
    - Campaign planning and intelligence
    - Content generation (press releases, pitches, social media)
    - Media list building and journalist research
    - Crisis management and response planning
    - Sentiment analysis and media monitoring
    
    Be professional, helpful, and provide actionable insights.`;
  }
}

module.exports = new ClaudeService();
