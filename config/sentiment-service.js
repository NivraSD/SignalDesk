const Anthropic = require("@anthropic-ai/sdk");

class SentimentService {
  constructor() {
    const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('No API key found');
    }
    
    this.client = new Anthropic({ apiKey });
  }

  async analyzeSentiment(text, context = null) {
    try {
      console.log('SentimentService: Analyzing text...');
      
      let prompt = `You are a sentiment analysis assistant. Analyze the following text and return JSON.

Text: "${text}"`;

      if (context) {
        prompt = `You are a sentiment analysis assistant. ${context}

Text: "${text}"`;
      }

      prompt += `

Return this exact JSON format:
{
  "sentiment": "positive" or "negative" or "neutral",
  "sentiment_score": -100 to 100,
  "rationale": "brief explanation"
}`;

      console.log('Prompt:', prompt);

      const response = await this.client.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
      });

      const responseText = response.content[0].text;
      console.log('Response:', responseText);

      // Parse JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Could not parse response as JSON');
    } catch (error) {
      console.error('SentimentService error:', error);
      throw error;
    }
  }
}

module.exports = new SentimentService();