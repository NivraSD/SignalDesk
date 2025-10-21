// Campaign Strategic Report Generation with Claude AI
module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    });
  }
  
  const { 
    campaignType,
    campaignCategory,
    brief,
    includeBrief,
    campaignData,
    reportType = 'strategic',
    format = 'detailed'
  } = req.body;
  
  // Accept either campaignData or individual fields
  const campaign = campaignData || {
    campaignName: campaignType || 'Campaign',
    type: campaignType,
    category: campaignCategory,
    brief: brief,
    includeBrief: includeBrief
  };
  
  if (!campaign && !campaignType && !brief) {
    return res.status(400).json({
      success: false,
      error: 'Campaign information is required'
    });
  }
  
  try {
    // Check if Claude API is available
    if (process.env.ANTHROPIC_API_KEY) {
      console.log('Using Claude AI for strategic report generation...');
      
      const { Anthropic } = require('@anthropic-ai/sdk');
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      
      const systemPrompt = `You are a strategic communications expert creating comprehensive campaign reports. Generate detailed, data-driven reports with actionable insights, competitive analysis, and strategic recommendations. Focus on measurable outcomes and ROI.`;
      
      const userPrompt = `Generate a ${reportType} campaign report based on this data:
${JSON.stringify(campaign, null, 2)}

Create a comprehensive report including:
1. Executive Summary
2. Campaign Overview & Objectives
3. Target Audience Analysis
4. Strategic Approach
5. Tactical Execution Plan
6. Competitive Positioning
7. Messaging Framework
8. Channel Strategy
9. Success Metrics & KPIs
10. Risk Assessment
11. Budget Recommendations
12. Timeline & Milestones
13. Expected Outcomes & ROI
14. Next Steps & Recommendations

Format: ${format === 'detailed' ? 'Provide detailed analysis for each section' : 'Provide concise bullet points'}`;
      
      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 3000,
        temperature: 0.4,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      });
      
      const report = message.content[0].text;
      
      return res.status(200).json({
        success: true,
        report,
        metadata: {
          powered_by: 'Claude AI',
          model: 'claude-3-haiku',
          report_type: reportType,
          format,
          generated_at: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    console.error('Claude API error:', error);
  }
  
  // Fallback template-based report
  console.log('Using template report generation');
  const templateReport = generateTemplateReport(campaign, reportType, format);
  
  return res.status(200).json({
    success: true,
    report: templateReport,
    metadata: {
      powered_by: 'Template Engine',
      report_type: reportType,
      format,
      generated_at: new Date().toISOString()
    }
  });
}

function generateTemplateReport(campaignData, reportType, format) {
  const { 
    campaignName = 'Campaign',
    type = 'General',
    industry = 'Industry',
    target = 'Target Audience',
    budget = 'TBD',
    timeline = 'TBD',
    goals = 'Campaign objectives'
  } = campaignData;
  
  return `STRATEGIC CAMPAIGN REPORT

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EXECUTIVE SUMMARY
${campaignName} is a ${type} campaign targeting ${target} in the ${industry} sector. This strategic initiative aims to ${goals}.

CAMPAIGN OVERVIEW
• Campaign Name: ${campaignName}
• Type: ${type}
• Industry: ${industry}
• Target Audience: ${target}
• Budget: ${budget}
• Timeline: ${timeline}

TARGET AUDIENCE ANALYSIS
Primary Audience:
• Demographics: ${target}
• Psychographics: Values innovation and quality
• Pain Points: Efficiency, cost-effectiveness, reliability
• Decision Drivers: ROI, peer recommendations, proven results

STRATEGIC APPROACH
1. Positioning Strategy
   • Establish thought leadership in ${industry}
   • Differentiate through unique value proposition
   • Build trust through consistent messaging

2. Competitive Advantage
   • Focus on unique differentiators
   • Highlight superior benefits
   • Address competitor weaknesses

3. Brand Narrative
   • Clear, compelling story
   • Emotional connection with audience
   • Consistent across all touchpoints

TACTICAL EXECUTION PLAN
Phase 1: Foundation (Weeks 1-2)
• Finalize messaging framework
• Develop creative assets
• Setup tracking systems

Phase 2: Launch (Weeks 3-4)
• Media outreach campaign
• Digital marketing activation
• Stakeholder engagement

Phase 3: Amplification (Weeks 5-8)
• Content marketing push
• Influencer partnerships
• Event activations

Phase 4: Optimization (Weeks 9-12)
• Performance analysis
• Strategy refinement
• Scale successful tactics

MESSAGING FRAMEWORK
Core Message: "${campaignName} delivers transformative results"

Key Messages:
1. Innovation Leadership: "Pioneering the future of ${industry}"
2. Customer Success: "Proven results that drive growth"
3. Partnership Value: "Your trusted partner in success"

CHANNEL STRATEGY
Tier 1 Channels:
• Digital Marketing (40% budget)
• PR & Media Relations (30% budget)
• Content Marketing (20% budget)

Tier 2 Channels:
• Events & Activations (5% budget)
• Partner Marketing (5% budget)

SUCCESS METRICS & KPIs
Awareness Metrics:
• Media impressions: Target 10M+
• Share of voice: 25% increase
• Brand awareness: 20% lift

Engagement Metrics:
• Website traffic: 50% increase
• Content engagement: 35% improvement
• Lead generation: 200+ qualified leads

Business Metrics:
• Pipeline contribution: $X
• ROI: 3:1 minimum
• Customer acquisition: X new customers

RISK ASSESSMENT
Identified Risks:
• Market volatility - Mitigation: Flexible messaging
• Competitive response - Mitigation: Rapid response team
• Budget constraints - Mitigation: Phased approach

BUDGET ALLOCATION
Total Budget: ${budget}
• Creative Development: 20%
• Media & Advertising: 35%
• Content Production: 15%
• PR & Outreach: 20%
• Analytics & Measurement: 5%
• Contingency: 5%

TIMELINE & MILESTONES
Week 1-2: Planning & Setup
Week 3-4: Campaign Launch
Week 5-8: Peak Activity
Week 9-10: Mid-campaign Review
Week 11-12: Optimization
Week 13: Final Analysis

EXPECTED OUTCOMES
• Increase brand awareness by 25%
• Generate 200+ qualified leads
• Achieve 10M+ media impressions
• Establish thought leadership position
• Drive measurable business growth

RECOMMENDATIONS
1. Prioritize digital channels for maximum reach
2. Invest in compelling creative assets
3. Establish measurement framework early
4. Build flexibility into execution plan
5. Focus on ROI-driven activities

NEXT STEPS
1. Approve strategic framework
2. Finalize budget allocation
3. Brief creative team
4. Setup tracking systems
5. Launch campaign

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Report Generated: ${new Date().toISOString()}
Powered by: SignalDesk Strategic Intelligence`;
}