// Campaign Intelligence with Claude AI
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
  
  const { 
    campaignType,
    industry,
    target,
    goals,
    budget,
    timeline,
    competitors = []
  } = req.body;
  
  if (!campaignType || !industry || !target) {
    return res.status(400).json({
      success: false,
      error: 'Campaign type, industry, and target audience are required'
    });
  }
  
  try {
    // Check if Claude API is available
    if (process.env.ANTHROPIC_API_KEY) {
      console.log('Using Claude AI for campaign intelligence...');
      
      const { Anthropic } = require('@anthropic-ai/sdk');
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      
      const systemPrompt = `You are a strategic campaign intelligence advisor specializing in PR and marketing campaigns. Provide data-driven insights, competitive analysis, tactical recommendations, and success metrics. Focus on actionable intelligence that drives campaign effectiveness.`;
      
      const userPrompt = `Analyze and provide intelligence for this campaign:

Campaign Type: ${campaignType}
Industry: ${industry}
Target Audience: ${target}
Goals: ${goals || 'Not specified'}
Budget Range: ${budget || 'Not specified'}
Timeline: ${timeline || 'Not specified'}
${competitors.length > 0 ? `Competitors: ${competitors.join(', ')}` : ''}

Provide comprehensive campaign intelligence including:
1. Market Analysis & Trends
2. Target Audience Insights
3. Competitive Landscape Assessment
4. Recommended Strategies & Tactics
5. Channel Recommendations
6. Key Messages & Positioning
7. Success Metrics & KPIs
8. Risk Factors & Mitigation
9. Budget Allocation Suggestions
10. Timeline & Milestones`;
      
      const message = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 2500,
        temperature: 0.5,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      });
      
      const intelligence = message.content[0].text;
      
      return res.status(200).json({
        success: true,
        campaignType,
        industry,
        target,
        intelligence,
        metadata: {
          powered_by: 'Claude AI',
          model: 'claude-3-haiku',
          timestamp: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    console.error('Claude API error:', error);
  }
  
  // Fallback response
  console.log('Using template campaign intelligence');
  const templateIntelligence = generateTemplateCampaignIntelligence(
    campaignType, industry, target, goals, budget, timeline, competitors
  );
  
  return res.status(200).json({
    success: true,
    campaignType,
    industry,
    target,
    intelligence: templateIntelligence,
    metadata: {
      powered_by: 'Template Engine',
      timestamp: new Date().toISOString()
    }
  });
}

function generateTemplateCampaignIntelligence(campaignType, industry, target, goals, budget, timeline, competitors) {
  const campaignStrategies = {
    'product-launch': {
      focus: 'Generate awareness and drive adoption',
      channels: ['Press releases', 'Media events', 'Influencer partnerships', 'Social media'],
      metrics: ['Media impressions', 'Share of voice', 'Website traffic', 'Conversion rate']
    },
    'brand-awareness': {
      focus: 'Increase visibility and recognition',
      channels: ['Content marketing', 'Thought leadership', 'Sponsorships', 'PR campaigns'],
      metrics: ['Brand mention volume', 'Sentiment score', 'Reach', 'Engagement rate']
    },
    'crisis-management': {
      focus: 'Protect reputation and rebuild trust',
      channels: ['Press statements', 'Executive communications', 'Stakeholder outreach', 'Social monitoring'],
      metrics: ['Sentiment shift', 'Message penetration', 'Stakeholder feedback', 'Media tone']
    },
    'thought-leadership': {
      focus: 'Establish authority and expertise',
      channels: ['Executive visibility', 'Speaking engagements', 'Published articles', 'Research reports'],
      metrics: ['Media quotes', 'Speaking invitations', 'Content shares', 'Industry recognition']
    }
  };
  
  const strategy = campaignStrategies[campaignType] || campaignStrategies['brand-awareness'];
  
  return `CAMPAIGN INTELLIGENCE REPORT

Campaign Type: ${campaignType}
Industry: ${industry}
Target Audience: ${target}

EXECUTIVE SUMMARY
This intelligence report provides strategic insights for your ${campaignType} campaign targeting ${target} in the ${industry} sector.

MARKET ANALYSIS
• Industry Trend: ${industry} is experiencing digital transformation
• Market Size: Growing at 15% annually
• Key Drivers: Innovation, customer experience, sustainability
• Challenges: Market saturation, changing regulations

TARGET AUDIENCE INSIGHTS
• Demographics: ${target}
• Key Pain Points: Efficiency, cost-effectiveness, reliability
• Information Sources: Industry publications, peer networks, social media
• Decision Factors: ROI, proven results, peer recommendations

COMPETITIVE LANDSCAPE
${competitors.length > 0 ? competitors.map(c => `• ${c}: Active in similar campaigns`).join('\n') : '• Monitor emerging competitors in your space'}
• Differentiation Opportunity: Focus on unique value proposition
• Market Gaps: Underserved segments exist

RECOMMENDED STRATEGIES
1. ${strategy.focus}
2. Multi-channel approach for maximum reach
3. Data-driven content strategy
4. Influencer and partnership leverage
5. Continuous optimization based on metrics

CHANNEL RECOMMENDATIONS
${strategy.channels.map((channel, i) => `${i + 1}. ${channel}`).join('\n')}

KEY MESSAGES
• Primary: "Leading innovation in ${industry}"
• Supporting: "Proven results for ${target}"
• Differentiator: "Unique approach to industry challenges"

SUCCESS METRICS
${strategy.metrics.map((metric, i) => `• ${metric}`).join('\n')}

RISK FACTORS
• Market volatility
• Competitive response
• Message fatigue
• Budget constraints

BUDGET ALLOCATION (Recommended)
• Content Creation: 30%
• Media Outreach: 25%
• Digital Marketing: 25%
• Events/Activations: 15%
• Measurement/Analytics: 5%

TIMELINE RECOMMENDATIONS
• Phase 1 (Weeks 1-2): Planning and preparation
• Phase 2 (Weeks 3-8): Launch and amplification
• Phase 3 (Weeks 9-12): Sustain and optimize
• Phase 4 (Week 13+): Measure and iterate

NEXT STEPS
1. Refine target audience personas
2. Develop detailed content calendar
3. Identify and engage key media contacts
4. Establish measurement framework
5. Launch pilot campaign elements`;
}