const claudeService = require('../../config/claude');

/**
 * Creative Opportunity Generation Agent
 * Uses Campaign Intelligence patterns for better creative ideation
 */
class OpportunityCreativeAgent {
  constructor() {
    this.creativeTechniques = {
      'thought_leadership': {
        approaches: [
          'Contrarian perspective on industry assumptions',
          'Future state vision (3-5 years out)',
          'Cross-industry innovation applications',
          'Research-backed controversial insights',
          'Technology disruption implications'
        ],
        formats: [
          'Executive manifesto series',
          'Industry transformation report',
          'Innovation lab findings',
          'Future of X whitepaper series',
          'Contrarian viewpoint campaign'
        ]
      },
      'competitive_disruption': {
        approaches: [
          'Category redefinition strategy',
          'David vs Goliath narrative',
          'New metric/standard introduction',
          'Customer advocacy uprising',
          'Industry practice challenge'
        ],
        formats: [
          'Comparison campaign',
          'Customer migration program',
          'Industry benchmark study',
          'Competitive switching guide',
          'Market education initiative'
        ]
      },
      'market_creation': {
        approaches: [
          'Blue ocean strategy',
          'Problem reframing',
          'Unserved segment focus',
          'New use case development',
          'Adjacent market entry'
        ],
        formats: [
          'Category creation campaign',
          'Market education series',
          'Use case showcase',
          'Partnership ecosystem launch',
          'Innovation challenge'
        ]
      }
    };
  }

  async generateCreativeOpportunities(context) {
    const { organizationName, strengths, competitorGaps, topicMomentum, industryContext } = context;
    
    console.log(`[CreativeAgent] Generating opportunities for ${organizationName}`);
    
    // Generate multiple creative approaches
    const opportunities = [];
    
    // 1. Thought Leadership Opportunities
    const thoughtLeadershipOpp = await this.generateThoughtLeadership(context);
    opportunities.push(...thoughtLeadershipOpp);
    
    // 2. Competitive Disruption Opportunities
    const disruptionOpp = await this.generateCompetitiveDisruption(context);
    opportunities.push(...disruptionOpp);
    
    // 3. Market Creation Opportunities
    const marketCreationOpp = await this.generateMarketCreation(context);
    opportunities.push(...marketCreationOpp);
    
    // 4. Trending Topic Hijacking
    const trendingOpp = await this.generateTrendingOpportunities(context);
    opportunities.push(...trendingOpp);
    
    // Rank by impact potential
    return this.rankOpportunities(opportunities);
  }

  async generateThoughtLeadership(context) {
    const prompt = `As a creative strategist, generate 2 innovative thought leadership opportunities for ${context.organizationName}.

Context:
- Strengths: ${context.strengths.join(', ')}
- Industry: ${context.industryContext}
- Competitor Gaps: ${context.competitorGaps.join(', ')}

For each opportunity create:
1. A provocative campaign name that stands out
2. A contrarian or forward-thinking angle that challenges conventional wisdom
3. Content strategy with unexpected formats
4. Specific thought leadership topics that competitors aren't addressing
5. Expected business impact

Focus on ideas that would get featured in WSJ, Forbes, or industry publications. Be bold and creative.`;

    try {
      const response = await claudeService.sendMessage(prompt);
      return this.parseThoughtLeadershipOpportunities(response);
    } catch (error) {
      console.error('[CreativeAgent] Error generating thought leadership:', error);
      return this.getFallbackThoughtLeadership(context);
    }
  }

  async generateCompetitiveDisruption(context) {
    const prompt = `Create 2 competitive disruption campaign opportunities that position ${context.organizationName} as the category challenger.

Context:
- Our Strengths: ${context.strengths.join(', ')}
- Competitor Weaknesses: ${context.competitorGaps.join(', ')}
- Market Dynamics: ${context.topicMomentum?.map(t => t.name).join(', ')}

For each opportunity:
1. Campaign name that signals disruption
2. How to reframe the market conversation
3. Specific competitor weaknesses to exploit
4. Creative tactics that competitors can't match
5. Metrics that favor our approach

Think like a challenger brand. Be aggressive but professional.`;

    try {
      const response = await claudeService.sendMessage(prompt);
      return this.parseDisruptionOpportunities(response);
    } catch (error) {
      console.error('[CreativeAgent] Error generating disruption:', error);
      return [];
    }
  }

  async generateMarketCreation(context) {
    const prompt = `Identify 2 blue ocean opportunities where ${context.organizationName} can create new market categories.

Context:
- Core Capabilities: ${context.strengths.join(', ')}
- Industry Trends: ${context.topicMomentum?.map(t => `${t.name} (${t.momentum})`).join(', ')}
- Unserved Needs: Based on competitor gaps in ${context.competitorGaps.join(', ')}

For each opportunity:
1. New category name and definition
2. Why this category doesn't exist yet
3. How to establish category leadership
4. Market education strategy
5. Partnership ecosystem needed

Think beyond current market boundaries. What new problems can we solve?`;

    try {
      const response = await claudeService.sendMessage(prompt);
      return this.parseMarketCreationOpportunities(response);
    } catch (error) {
      console.error('[CreativeAgent] Error generating market creation:', error);
      return [];
    }
  }

  async generateTrendingOpportunities(context) {
    const hotTopics = context.topicMomentum?.filter(t => 
      t.momentum === 'hot' || t.momentum === 'growing' || t.mediaTrend === 'increasing'
    ) || [];

    if (hotTopics.length === 0) return [];

    const prompt = `Create 2 newsjacking opportunities for ${context.organizationName} based on trending topics.

Trending Topics:
${hotTopics.map(t => `- ${t.name}: ${t.mediaTrend}, ${t.recentNews?.length || 0} recent articles`).join('\n')}

Our Strengths: ${context.strengths.join(', ')}

For each opportunity:
1. Timely campaign angle that rides the trend
2. Our unique perspective that adds value
3. Rapid response content plan
4. Media pitch angles
5. 48-hour execution plan

Be creative but ensure authentic connection to trends.`;

    try {
      const response = await claudeService.sendMessage(prompt);
      return this.parseTrendingOpportunities(response);
    } catch (error) {
      console.error('[CreativeAgent] Error generating trending:', error);
      return [];
    }
  }

  parseThoughtLeadershipOpportunities(response) {
    // Parse response into structured opportunities
    const opportunities = [];
    
    // Try to find campaign names first
    const nameMatches = response.match(/"([^"]+)"/g) || [];
    const campaigns = [];
    
    // Split by numbered items or opportunity markers
    const sections = response.split(/(?:(?:^\d+\.|Opportunity \d+:|Campaign \d+:)\s*)/gm);
    
    sections.forEach((section, idx) => {
      if (section.trim() && idx > 0) {
        const name = nameMatches[idx - 1]?.replace(/"/g, '') || 
                    section.split('\n')[0]?.trim() || 
                    `Industry Vision Campaign ${idx}`;
        
        opportunities.push({
          type: 'thought_leadership',
          name: name.substring(0, 80), // Limit length
          angle: this.extractField(section, 'angle', 'contrarian', 'perspective') || 
                 'Challenge conventional industry wisdom',
          rationale: this.extractField(section, 'why', 'gap', 'opportunity') ||
                     'Strategic market opportunity identified',
          contentIdeas: this.extractBulletPoints(section, 'content', 'format', 'strategy') ||
                        ['Executive thought piece', 'Research report', 'Media campaign'],
          audience: this.extractField(section, 'audience', 'target') || 
                    'Industry executives and media',
          impact: this.extractField(section, 'impact', 'business', 'expected') ||
                  'Establish thought leadership position',
          timing: this.extractField(section, 'timing', 'launch') ||
                  'Strategic timing opportunity',
          creativity: 85 + Math.floor(Math.random() * 15),
          feasibility: 70 + Math.floor(Math.random() * 20)
        });
      }
    });
    
    // Ensure we have at least one opportunity
    if (opportunities.length === 0) {
      opportunities.push(this.getFallbackThoughtLeadership({}).shift());
    }
    
    return opportunities;
  }

  parseDisruptionOpportunities(response) {
    const opportunities = [];
    const nameMatches = response.match(/"([^"]+)"/g) || [];
    const sections = response.split(/(?:(?:^\d+\.|Opportunity \d+:|Campaign \d+:)\s*)/gm);
    
    sections.forEach((section, idx) => {
      if (section.trim() && idx > 0) {
        const name = nameMatches[idx - 1]?.replace(/"/g, '') || 
                    section.split('\n')[0]?.trim() || 
                    `Competitive Disruption ${idx}`;
        
        opportunities.push({
          type: 'competitive_disruption',
          name: name.substring(0, 80),
          angle: this.extractField(section, 'reframe', 'market', 'conversation') || 
                 'Redefine market expectations',
          rationale: this.extractField(section, 'weakness', 'exploit', 'competitor', 'gap') ||
                     'Exploit competitor vulnerabilities',
          contentIdeas: this.extractBulletPoints(section, 'tactics', 'creative', 'approach') ||
                        ['Comparison campaign', 'Customer stories', 'Market education'],
          audience: this.extractField(section, 'audience', 'target') || 
                    'Prospective customers and media',
          impact: this.extractField(section, 'impact', 'metric', 'result') ||
                  'Shift market perception',
          timing: 'Immediate opportunity',
          creativity: 80 + Math.floor(Math.random() * 20),
          feasibility: 75 + Math.floor(Math.random() * 15)
        });
      }
    });
    
    return opportunities.length > 0 ? opportunities : [];
  }

  parseMarketCreationOpportunities(response) {
    const opportunities = [];
    const nameMatches = response.match(/"([^"]+)"/g) || [];
    const sections = response.split(/(?:(?:^\d+\.|Opportunity \d+:|Category \d+:)\s*)/gm);
    
    sections.forEach((section, idx) => {
      if (section.trim() && idx > 0) {
        const name = nameMatches[idx - 1]?.replace(/"/g, '') || 
                    section.split('\n')[0]?.trim() || 
                    `New Market Category ${idx}`;
        
        opportunities.push({
          type: 'market_creation',
          name: name.substring(0, 80),
          angle: this.extractField(section, 'definition', 'why', 'exist', 'category') || 
                 'Create new market category',
          rationale: this.extractField(section, 'gap', 'opportunity', 'unserved') ||
                     'Address unserved market needs',
          contentIdeas: this.extractBulletPoints(section, 'education', 'strategy', 'content') ||
                        ['Category definition white paper', 'Market education series', 'Vision keynote'],
          audience: this.extractField(section, 'audience', 'stakeholder') || 
                    'Market innovators and early adopters',
          impact: this.extractField(section, 'impact', 'outcome', 'leadership') ||
                  'Establish category leadership',
          timing: this.extractField(section, 'timing', 'window') || 
                  'First-mover advantage',
          creativity: 90 + Math.floor(Math.random() * 10),
          feasibility: 60 + Math.floor(Math.random() * 20)
        });
      }
    });
    
    return opportunities.length > 0 ? opportunities : [];
  }

  parseTrendingOpportunities(response) {
    const opportunities = [];
    const nameMatches = response.match(/"([^"]+)"/g) || [];
    const sections = response.split(/(?:(?:^\d+\.|Opportunity \d+:|Campaign \d+:)\s*)/gm);
    
    sections.forEach((section, idx) => {
      if (section.trim() && idx > 0) {
        const name = nameMatches[idx - 1]?.replace(/"/g, '') || 
                    section.split('\n')[0]?.trim() || 
                    `Trending Topic Campaign ${idx}`;
        
        opportunities.push({
          type: 'trending_hijack',
          name: name.substring(0, 80),
          angle: this.extractField(section, 'angle', 'perspective', 'unique') || 
                 'Unique perspective on trending topic',
          rationale: this.extractField(section, 'trend', 'opportunity', 'timing') ||
                     'Capitalize on current media attention',
          contentIdeas: this.extractBulletPoints(section, 'content', 'plan', 'response') ||
                        ['Rapid response article', 'Executive commentary', 'Social campaign'],
          audience: this.extractField(section, 'audience', 'media', 'target') || 
                    'Media and social audiences',
          impact: this.extractField(section, 'impact', 'result', 'outcome') ||
                  'Capture trending conversation',
          timing: '48-hour execution window',
          creativity: 75 + Math.floor(Math.random() * 20),
          feasibility: 85 + Math.floor(Math.random() * 15)
        });
      }
    });
    
    return opportunities.length > 0 ? opportunities : [];
  }

  extractField(text, ...keywords) {
    const lines = text.split('\n');
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (keywords.some(kw => lower.includes(kw))) {
        return line.replace(/^[•\-*:]\s*/, '').trim();
      }
    }
    return '';
  }

  extractBulletPoints(text, ...keywords) {
    const points = [];
    const lines = text.split('\n');
    let capturing = false;
    
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (keywords.some(kw => lower.includes(kw))) {
        capturing = true;
        continue;
      }
      if (capturing && line.match(/^[•\-*]/)) {
        points.push(line.replace(/^[•\-*]\s*/, '').trim());
      } else if (capturing && !line.match(/^[•\-*]/) && line.trim() === '') {
        capturing = false;
      }
    }
    
    return points;
  }

  rankOpportunities(opportunities) {
    // Score based on creativity, feasibility, and strategic fit
    return opportunities
      .map(opp => ({
        ...opp,
        totalScore: (opp.creativity * 0.4) + (opp.feasibility * 0.3) + (Math.random() * 30)
      }))
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 5); // Top 5 opportunities
  }

  getFallbackThoughtLeadership(context) {
    return [{
      type: 'thought_leadership',
      name: 'The Future of ' + context.industryContext,
      angle: 'Challenging conventional industry wisdom with data-driven insights',
      strategy: 'Multi-format content series including research, executive perspectives, and future scenarios',
      topics: [
        'Emerging technology implications',
        'Changing customer expectations',
        'New business models',
        'Workforce transformation'
      ],
      impact: 'Position as industry visionary and attract forward-thinking clients',
      creativity: 75,
      feasibility: 80
    }];
  }
}

module.exports = OpportunityCreativeAgent;