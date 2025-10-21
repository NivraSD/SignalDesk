// Media List Builder with Claude AI
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
    industry,
    topic,
    geographic,
    tier,
    publicationType,
    campaignGoals
  } = req.body;
  
  if (!industry || !topic) {
    return res.status(400).json({
      success: false,
      error: 'Industry and topic are required'
    });
  }
  
  try {
    // Check if Claude API is available
    if (process.env.ANTHROPIC_API_KEY) {
      console.log('Using Claude AI for media list building...');
      
      const { Anthropic } = require('@anthropic-ai/sdk');
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      
      const systemPrompt = `You are a media relations expert who builds targeted media lists. Create comprehensive, strategic media lists with specific outlet recommendations, beat reporters, and engagement strategies. Focus on quality over quantity, providing actionable intelligence about each media target.`;
      
      const userPrompt = `Build a strategic media list for:

Industry: ${industry}
Topic/Story: ${topic}
Geographic Focus: ${geographic || 'National'}
Media Tier: ${tier || 'All tiers'}
Publication Types: ${publicationType || 'All types'}
Campaign Goals: ${campaignGoals || 'Media coverage'}

Create a comprehensive media list including:
1. Top-tier media outlets (5-7 outlets)
2. Industry/trade publications (5-7 outlets)
3. Digital/online media (5-7 outlets)
4. Broadcast opportunities (3-5 outlets)
5. Influencers/podcasts (3-5 targets)

For each, provide:
- Outlet name and type
- Relevant beat/section
- Why they'd be interested
- Recommended angle/approach
- Engagement tips
- Estimated reach/influence`;
      
      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2500,
        temperature: 0.4,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      });
      
      const mediaList = message.content[0].text;
      
      // Parse into structured format if possible
      const structuredList = parseMediaList(mediaList);
      
      return res.status(200).json({
        success: true,
        industry,
        topic,
        mediaList,
        structured: structuredList,
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
  console.log('Using template media list');
  const { mediaList, structured } = generateTemplateMediaList(
    industry, topic, geographic, tier, publicationType
  );
  
  return res.status(200).json({
    success: true,
    industry,
    topic,
    mediaList,
    structured,
    metadata: {
      powered_by: 'Template Engine',
      timestamp: new Date().toISOString()
    }
  });
}

function parseMediaList(text) {
  // Attempt to structure the Claude response
  const structured = {
    topTier: [],
    trade: [],
    digital: [],
    broadcast: [],
    influencers: []
  };
  
  // Basic parsing - this would be more sophisticated in production
  const sections = text.split(/\n\n/);
  sections.forEach(section => {
    if (section.includes('top-tier') || section.includes('Top-tier')) {
      structured.topTier.push({ description: section });
    } else if (section.includes('trade') || section.includes('Industry')) {
      structured.trade.push({ description: section });
    } else if (section.includes('digital') || section.includes('Digital')) {
      structured.digital.push({ description: section });
    } else if (section.includes('broadcast') || section.includes('Broadcast')) {
      structured.broadcast.push({ description: section });
    } else if (section.includes('influencer') || section.includes('podcast')) {
      structured.influencers.push({ description: section });
    }
  });
  
  return structured;
}

function generateTemplateMediaList(industry, topic, geographic, tier, publicationType) {
  const geoFocus = geographic || 'National';
  const tierFocus = tier || 'All tiers';
  
  const structured = {
    topTier: [
      {
        outlet: 'Wall Street Journal',
        beat: `${industry} Reporter`,
        section: 'Business/Technology',
        why: `Covers major ${industry} developments and market trends`,
        angle: 'Industry innovation and market impact story',
        tips: 'Pitch exclusive data or first-look opportunities',
        reach: '3M+ subscribers'
      },
      {
        outlet: 'New York Times',
        beat: 'Business/Technology',
        section: 'Business',
        why: 'Interested in industry transformation stories',
        angle: 'Human interest angle with business impact',
        tips: 'Emphasize broader societal implications',
        reach: '9M+ subscribers'
      },
      {
        outlet: 'Forbes',
        beat: `${industry} Innovation`,
        section: 'Business/Innovation',
        why: 'Focuses on industry leaders and disruption',
        angle: 'Leadership and innovation narrative',
        tips: 'Offer executive interviews and thought leadership',
        reach: '150M+ monthly readers'
      }
    ],
    trade: [
      {
        outlet: `${industry} Week`,
        beat: 'Industry News',
        section: 'News & Analysis',
        why: `Primary source for ${industry} professionals`,
        angle: 'Deep industry expertise and technical details',
        tips: 'Provide industry-specific data and insights',
        reach: 'Industry professionals'
      },
      {
        outlet: `${industry} Journal`,
        beat: 'Market Trends',
        section: 'Analysis',
        why: 'Authoritative voice in the industry',
        angle: 'Technical innovation and market analysis',
        tips: 'Offer expert commentary and data',
        reach: 'C-suite and decision makers'
      }
    ],
    digital: [
      {
        outlet: 'TechCrunch',
        beat: 'Startups & Innovation',
        section: `${industry}`,
        why: 'Covers innovative companies and technologies',
        angle: 'Disruptive technology and startup story',
        tips: 'Highlight unique technology or approach',
        reach: '12M+ monthly readers'
      },
      {
        outlet: 'Business Insider',
        beat: `${industry} News`,
        section: 'Tech/Business',
        why: 'Quick-turn news and analysis',
        angle: 'Timely news with broad appeal',
        tips: 'Offer exclusive data or breaking news',
        reach: '100M+ monthly readers'
      }
    ],
    broadcast: [
      {
        outlet: 'CNBC',
        show: 'Squawk Box / Power Lunch',
        why: 'Business news leader, market impact stories',
        angle: 'Market-moving news and executive interviews',
        tips: 'Prepare concise talking points, offer live availability',
        reach: 'Business decision makers'
      },
      {
        outlet: 'Bloomberg TV',
        show: 'Bloomberg Markets',
        why: 'Financial and business focus',
        angle: 'Data-driven stories with market implications',
        tips: 'Provide strong visuals and data',
        reach: 'Global financial audience'
      }
    ],
    influencers: [
      {
        name: `Leading ${industry} Podcast`,
        platform: 'Podcast',
        why: 'Reaches engaged industry professionals',
        angle: 'In-depth discussion and thought leadership',
        tips: 'Prepare for 30-45 minute deep dive',
        reach: '50K+ downloads per episode'
      },
      {
        name: `${industry} Thought Leader`,
        platform: 'LinkedIn/Twitter',
        why: 'Influential voice in the industry',
        angle: 'Share innovative insights and trends',
        tips: 'Provide exclusive content or early access',
        reach: '100K+ followers'
      }
    ]
  };
  
  const mediaList = `STRATEGIC MEDIA LIST

Industry: ${industry}
Topic: ${topic}
Geographic Focus: ${geoFocus}
Tier: ${tierFocus}

TOP-TIER NATIONAL MEDIA
${structured.topTier.map(m => `
• ${m.outlet} - ${m.beat}
  Why: ${m.why}
  Angle: ${m.angle}
  Tips: ${m.tips}
  Reach: ${m.reach}`).join('\n')}

INDUSTRY/TRADE PUBLICATIONS
${structured.trade.map(m => `
• ${m.outlet} - ${m.beat}
  Why: ${m.why}
  Angle: ${m.angle}
  Tips: ${m.tips}
  Reach: ${m.reach}`).join('\n')}

DIGITAL/ONLINE MEDIA
${structured.digital.map(m => `
• ${m.outlet} - ${m.beat}
  Why: ${m.why}
  Angle: ${m.angle}
  Tips: ${m.tips}
  Reach: ${m.reach}`).join('\n')}

BROADCAST OPPORTUNITIES
${structured.broadcast.map(m => `
• ${m.outlet} - ${m.show}
  Why: ${m.why}
  Angle: ${m.angle}
  Tips: ${m.tips}
  Reach: ${m.reach}`).join('\n')}

INFLUENCERS/PODCASTS
${structured.influencers.map(m => `
• ${m.name} - ${m.platform}
  Why: ${m.why}
  Angle: ${m.angle}
  Tips: ${m.tips}
  Reach: ${m.reach}`).join('\n')}

ENGAGEMENT STRATEGY
1. Start with trade publications for credibility
2. Leverage trade coverage for top-tier pitches
3. Offer exclusives to tier-1 media
4. Prepare multimedia assets for broadcast
5. Build relationships before pitching

SUCCESS METRICS
• Media placements secured
• Audience reach achieved
• Message penetration
• Share of voice vs competitors
• Quality of coverage (tone, prominence)`;
  
  return { mediaList, structured };
}