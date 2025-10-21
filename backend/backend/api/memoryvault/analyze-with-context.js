// Memory Vault Context Analysis with Claude AI
module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { query, context_items = [], analysis_type = 'general' } = req.body;
  
  if (!query) {
    return res.status(400).json({
      success: false,
      error: 'Query is required'
    });
  }
  
  try {
    // Check if Claude API is available
    if (process.env.ANTHROPIC_API_KEY) {
      console.log('Using Claude AI for context analysis...');
      
      const { Anthropic } = require('@anthropic-ai/sdk');
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      
      // Build context from memory vault items
      let contextText = '';
      if (context_items && context_items.length > 0) {
        contextText = '\nRelevant context from Memory Vault:\n';
        context_items.forEach((item, index) => {
          contextText += `\n[Context ${index + 1}]: ${item.title || 'Untitled'}\n`;
          contextText += `Type: ${item.folder_type || 'general'}\n`;
          contextText += `Content: ${item.content || item.description || 'No content'}\n`;
          if (item.tags && item.tags.length > 0) {
            contextText += `Tags: ${item.tags.join(', ')}\n`;
          }
          contextText += '---\n';
        });
      }
      
      const systemPrompt = getSystemPromptForType(analysis_type);
      const userPrompt = `${contextText}\nUser Query: ${query}\n\nProvide a comprehensive analysis based on the context and query.`;
      
      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        temperature: 0.5,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      });
      
      const analysis = message.content[0].text;
      
      return res.status(200).json({
        success: true,
        analysis,
        query,
        context_items_count: context_items.length,
        metadata: {
          powered_by: 'Claude AI',
          model: 'claude-3-haiku',
          analysis_type,
          timestamp: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    console.error('Claude API error:', error);
  }
  
  // Fallback to basic analysis
  console.log('Using template-based analysis');
  const fallbackAnalysis = generateFallbackAnalysis(query, context_items, analysis_type);
  
  return res.status(200).json({
    success: true,
    analysis: fallbackAnalysis,
    query,
    context_items_count: context_items.length,
    metadata: {
      powered_by: 'Template Engine',
      analysis_type,
      timestamp: new Date().toISOString()
    }
  });
}

function getSystemPromptForType(type) {
  const prompts = {
    general: 'You are an intelligent assistant analyzing content from a knowledge base. Provide insights, connections, and actionable recommendations based on the provided context.',
    strategic: 'You are a strategic advisor analyzing business intelligence. Focus on strategic implications, competitive advantages, and long-term opportunities.',
    competitive: 'You are a competitive intelligence analyst. Focus on competitor analysis, market positioning, and competitive advantages.',
    crisis: 'You are a crisis management expert. Focus on risk assessment, mitigation strategies, and rapid response recommendations.',
    opportunity: 'You are an opportunity identification specialist. Focus on growth opportunities, market gaps, and potential innovations.',
    sentiment: 'You are a sentiment and perception analyst. Focus on public perception, brand sentiment, and reputation management.'
  };
  
  return prompts[type] || prompts.general;
}

function generateFallbackAnalysis(query, context_items, analysis_type) {
  const contextSummary = context_items.length > 0 
    ? `Based on ${context_items.length} relevant items from your Memory Vault,`
    : 'Without specific context items,';
    
  const typeSpecificInsights = {
    strategic: 'Strategic Implications: Consider long-term positioning and market dynamics.',
    competitive: 'Competitive Analysis: Monitor competitor activities and market positioning.',
    crisis: 'Risk Assessment: Evaluate potential risks and prepare mitigation strategies.',
    opportunity: 'Opportunity Identification: Look for market gaps and growth potential.',
    sentiment: 'Sentiment Analysis: Track public perception and brand reputation.',
    general: 'Key Insights: Focus on actionable recommendations and insights.'
  };
  
  return `Analysis for: "${query}"

${contextSummary} here is the analysis:

${typeSpecificInsights[analysis_type] || typeSpecificInsights.general}

Key Recommendations:
1. Review and prioritize the most relevant context items
2. Develop action plans based on identified patterns
3. Monitor ongoing developments related to this query
4. Update your Memory Vault with new findings

This analysis would be more comprehensive with Claude AI integration.`;
}