const claudeService = require('../../config/claude');
const pool = require('../config/db');
const Parser = require('rss-parser');

/**
 * Topic Momentum Agent Network
 * A specialized agent network for comprehensive topic momentum analysis
 */

class TopicMomentumCoordinator {
  constructor() {
    this.agents = {
      competitiveAnalyst: new CompetitivePositioningAgent(),
      trendAnalyst: new TrendAnalysisAgent(),
      marketDynamics: new MarketDynamicsAgent(),
      mediaMonitor: new MediaMonitoringAgent(),
      synthesizer: new SynthesisAgent()
    };
  }

  async analyzeTopicMomentum(organizationId, topics, competitors) {
    console.log(`[Coordinator] Starting comprehensive topic momentum analysis for ${topics.length} topics`);
    
    const analyses = [];
    
    for (const topic of topics) {
      console.log(`[Coordinator] Analyzing topic: ${topic.name}`);
      
      // Deploy agents in parallel for efficiency
      const [
        competitiveAnalysis,
        trendAnalysis,
        marketAnalysis,
        mediaAnalysis
      ] = await Promise.all([
        this.agents.competitiveAnalyst.analyze(topic, competitors),
        this.agents.trendAnalyst.analyze(topic),
        this.agents.marketDynamics.analyze(topic),
        this.agents.mediaMonitor.analyze(topic)
      ]);
      
      // Synthesize all analyses
      const synthesizedAnalysis = await this.agents.synthesizer.synthesize({
        topic,
        competitiveAnalysis,
        trendAnalysis,
        marketAnalysis,
        mediaAnalysis
      });
      
      analyses.push(synthesizedAnalysis);
    }
    
    return analyses;
  }
}

class CompetitivePositioningAgent {
  constructor() {
    // Knowledge base for common competitor strengths
    this.knowledgeBase = {
      // Ride-sharing competitors
      'Lyft': {
        'Gig Economy Regulation': { strength: 'strong', evidence: 'Active in driver classification debates, lobbying efforts' },
        'Autonomous Vehicle Development': { strength: 'moderate', evidence: 'Partnership with Waymo, limited own development' },
        'Urban Mobility Evolution': { strength: 'strong', evidence: 'Bike/scooter sharing, public transit integration' },
        'Driver Supply Dynamics': { strength: 'strong', evidence: 'Extensive driver incentive programs' },
        'Super App Competition': { strength: 'weak', evidence: 'Limited service expansion beyond mobility' }
      },
      'Uber': {
        'Gig Economy Regulation': { strength: 'strong', evidence: 'Leading voice in gig economy legislation' },
        'Autonomous Vehicle Development': { strength: 'strong', evidence: 'Uber ATG, partnerships with auto manufacturers' },
        'Urban Mobility Evolution': { strength: 'strong', evidence: 'Uber for Business, Jump bikes, freight' },
        'Driver Supply Dynamics': { strength: 'strong', evidence: 'Global driver network, dynamic pricing' },
        'Super App Competition': { strength: 'moderate', evidence: 'Uber Eats, expanding services' }
      },
      'DoorDash': {
        'Gig Economy Regulation': { strength: 'strong', evidence: 'Major player in delivery worker classification' },
        'Food Delivery Innovation': { strength: 'strong', evidence: 'Market leader in US food delivery' },
        'Last-Mile Logistics': { strength: 'strong', evidence: 'Expanding beyond food to retail delivery' }
      },
      'Waymo': {
        'Autonomous Vehicle Development': { strength: 'strong', evidence: 'Industry leader in self-driving technology' },
        'Urban Mobility Evolution': { strength: 'moderate', evidence: 'Limited commercial deployment' },
        'AI/ML Transportation': { strength: 'strong', evidence: 'Advanced AI research, extensive testing' }
      }
    };
  }

  getKnownCompetitorAnalysis(topic, competitors) {
    const knownResults = [];
    
    for (const competitor of competitors) {
      const competitorData = this.knowledgeBase[competitor.name];
      if (competitorData) {
        // Check if we have data for this specific topic
        const topicData = competitorData[topic.name];
        if (topicData) {
          knownResults.push({
            name: competitor.name,
            strength: topicData.strength,
            evidence: [topicData.evidence],
            position: `${competitor.name} has ${topicData.strength} position in ${topic.name}`,
            trend: 'stable', // Default trend for known data
            vulnerabilities: this.identifyVulnerabilities(topicData.strength)
          });
        }
      }
    }
    
    return knownResults;
  }
  
  identifyVulnerabilities(strength) {
    const vulnerabilityMap = {
      'strong': ['Market saturation risk', 'Regulatory target'],
      'moderate': ['Competitive pressure', 'Need for differentiation'],
      'weak': ['Limited market presence', 'Resource constraints'],
      'none': ['No established position', 'High entry barriers']
    };
    
    return vulnerabilityMap[strength] || [];
  }

  async analyze(topic, competitors) {
    console.log(`[CompetitiveAnalyst] Analyzing ${competitors.length} competitors for topic: ${topic.name}`);
    
    // First check knowledge base for known competitors
    const knownAnalysis = this.getKnownCompetitorAnalysis(topic, competitors);
    const unknownCompetitors = competitors.filter(c => 
      !knownAnalysis.find(ka => ka.name === c.name)
    );
    
    // Only query AI for unknown competitors or complex analysis
    let aiAnalysis = [];
    if (unknownCompetitors.length > 0) {
      const prompt = `
As a Competitive Intelligence Analyst, analyze how each competitor is positioned on the topic "${topic.name}".

Consider:
- Public announcements and initiatives
- Product offerings and capabilities
- Market presence and customer adoption
- Investment and R&D focus
- Strategic partnerships
- Regulatory compliance efforts

Competitors to analyze:
${competitors.map(c => `- ${c.name}: ${c.description || 'No description'}`).join('\n')}

For each competitor, provide:
1. STRENGTH LEVEL: Strong/Moderate/Weak/None
2. EVIDENCE: Specific examples of their activity (or lack thereof)
3. STRATEGIC POSITION: Their competitive advantage or vulnerability
4. TREND: Growing/Stable/Declining involvement

Format as JSON array with structure:
[{
  "name": "Competitor Name",
  "strength": "strong|moderate|weak|none",
  "evidence": ["specific example 1", "specific example 2"],
  "position": "description of strategic position",
  "trend": "growing|stable|declining",
  "vulnerabilities": ["weakness 1", "weakness 2"]
}]`;

      try {
        const response = await claudeService.sendMessage(prompt);
        aiAnalysis = this.parseCompetitiveAnalysis(response);
      } catch (error) {
        console.error('[CompetitiveAnalyst] AI analysis error:', error);
        aiAnalysis = unknownCompetitors.map(c => ({
          name: c.name,
          strength: 'unknown',
          evidence: ['Analysis unavailable'],
          position: 'Unable to determine',
          trend: 'unknown',
          vulnerabilities: []
        }));
      }
    }
    
    // Combine known and AI analysis
    const allAnalysis = [...knownAnalysis, ...aiAnalysis];
    
    // Calculate competitive metrics
    const metrics = this.calculateCompetitiveMetrics(allAnalysis);
    
    return {
      competitors: allAnalysis,
      metrics,
      analysisDate: new Date().toISOString(),
      dataSource: {
        knowledgeBase: knownAnalysis.length,
        aiGenerated: aiAnalysis.length
      }
    };
  }

  parseCompetitiveAnalysis(response) {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('[CompetitiveAnalyst] Parse error:', error);
    }
    
    // Fallback parsing
    return this.parseTextResponse(response);
  }

  parseTextResponse(response) {
    const competitors = [];
    const lines = response.split('\n');
    let currentCompetitor = null;
    
    lines.forEach(line => {
      if (line.includes('STRENGTH:') || line.includes('Strength:')) {
        if (currentCompetitor) competitors.push(currentCompetitor);
        currentCompetitor = {
          name: 'Unknown',
          strength: line.split(':')[1]?.trim().toLowerCase() || 'none',
          evidence: [],
          vulnerabilities: []
        };
      } else if (currentCompetitor && line.includes('EVIDENCE:')) {
        currentCompetitor.evidence.push(line.split(':')[1]?.trim());
      }
    });
    
    if (currentCompetitor) competitors.push(currentCompetitor);
    return competitors;
  }

  calculateCompetitiveMetrics(competitors) {
    const counts = {
      strong: 0,
      moderate: 0,
      weak: 0,
      none: 0
    };
    
    competitors.forEach(c => {
      counts[c.strength] = (counts[c.strength] || 0) + 1;
    });
    
    const total = competitors.length || 1;
    
    // Calculate detailed metrics
    const weaknessRatio = (counts.weak + counts.none) / total;
    const strongRatio = counts.strong / total;
    const absenceRatio = counts.none / total;
    
    // NVS Calculation Components:
    // 1. Base Score: Percentage of weak/absent competitors (0-100)
    const baseScore = weaknessRatio * 100;
    
    // 2. Strong Competitor Penalty: Each strong competitor reduces opportunity
    const strongPenalty = counts.strong * 15;
    
    // 3. Complete Absence Bonus: Reward topics where competitors have NO presence
    const absenceBonus = counts.none * 5;
    
    // 4. Calculate raw NVS
    const rawNVS = baseScore - strongPenalty + absenceBonus;
    
    // 5. Ensure NVS is between 0-100
    const nvs = Math.round(Math.max(0, Math.min(100, rawNVS)));
    
    // Log calculation for transparency
    console.log(`[NVS Calculation] Topic competitive analysis:
      - Total Competitors: ${total}
      - Strong: ${counts.strong} (${(strongRatio * 100).toFixed(0)}%)
      - Moderate: ${counts.moderate}
      - Weak: ${counts.weak}
      - None: ${counts.none} (${(absenceRatio * 100).toFixed(0)}%)
      - Base Score: ${baseScore.toFixed(0)}
      - Strong Penalty: -${strongPenalty}
      - Absence Bonus: +${absenceBonus}
      - Final NVS: ${nvs}`);
    
    return {
      counts,
      ratios: {
        weakness: weaknessRatio,
        strong: strongRatio,
        absence: absenceRatio
      },
      calculation: {
        baseScore: Math.round(baseScore),
        strongPenalty,
        absenceBonus,
        formula: `${Math.round(baseScore)} - ${strongPenalty} + ${absenceBonus} = ${nvs}`
      },
      narrativeVacuumScore: nvs,
      competitiveIntensity: counts.strong > counts.weak ? 'high' : 'low',
      interpretation: this.interpretNVS(nvs)
    };
  }
  
  interpretNVS(nvs) {
    if (nvs >= 80) return 'Exceptional opportunity - significant competitive vacuum';
    if (nvs >= 60) return 'Strong opportunity - limited competition';
    if (nvs >= 40) return 'Moderate opportunity - some competitive gaps';
    if (nvs >= 20) return 'Limited opportunity - significant competition';
    return 'Minimal opportunity - saturated market';
  }

  getFallbackAnalysis(competitors, topic) {
    return {
      competitors: competitors.map(c => ({
        name: c.name,
        strength: 'unknown',
        evidence: ['Analysis unavailable'],
        position: 'Unknown position',
        trend: 'unknown',
        vulnerabilities: []
      })),
      metrics: {
        counts: { strong: 0, moderate: 0, weak: 0, none: 0, unknown: competitors.length },
        weaknessRatio: 0,
        narrativeVacuumScore: 50
      }
    };
  }
}

class TrendAnalysisAgent {
  async analyze(topic) {
    console.log(`[TrendAnalyst] Analyzing momentum for topic: ${topic.name}`);
    
    const prompt = `
As a Market Trend Analyst, evaluate the momentum and trajectory of "${topic.name}".

Analyze:
1. MARKET MOMENTUM: Is this topic Hot/Growing/Stable/Emerging/Declining?
2. KEY DRIVERS: What are the top 3-5 factors driving interest in this topic?
3. ADOPTION CURVE: Where is this topic on the adoption lifecycle?
4. FUTURE OUTLOOK: 6-12 month projection
5. BARRIERS: Main challenges to adoption or growth
6. CATALYSTS: Events or factors that could accelerate adoption

Provide specific data points, statistics, or examples where possible.

Format response as:
MOMENTUM: [status]
DRIVERS:
- Driver 1: [explanation]
- Driver 2: [explanation]
- Driver 3: [explanation]
ADOPTION_STAGE: [innovators/early_adopters/early_majority/late_majority/laggards]
OUTLOOK: [projection]
BARRIERS:
- Barrier 1
- Barrier 2
CATALYSTS:
- Catalyst 1
- Catalyst 2`;

    try {
      const response = await claudeService.sendMessage(prompt);
      return this.parseTrendAnalysis(response);
    } catch (error) {
      console.error('[TrendAnalyst] Error:', error);
      return this.getDefaultTrend(topic);
    }
  }

  parseTrendAnalysis(response) {
    const analysis = {
      momentum: 'stable',
      drivers: [],
      adoptionStage: 'early_majority',
      outlook: 'steady growth expected',
      barriers: [],
      catalysts: []
    };

    const lines = response.split('\n');
    let currentSection = '';

    lines.forEach(line => {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('MOMENTUM:')) {
        analysis.momentum = trimmed.split(':')[1].trim().toLowerCase();
      } else if (trimmed.startsWith('ADOPTION_STAGE:')) {
        analysis.adoptionStage = trimmed.split(':')[1].trim().toLowerCase();
      } else if (trimmed.startsWith('OUTLOOK:')) {
        analysis.outlook = trimmed.split(':')[1].trim();
      } else if (trimmed.startsWith('DRIVERS:')) {
        currentSection = 'drivers';
      } else if (trimmed.startsWith('BARRIERS:')) {
        currentSection = 'barriers';
      } else if (trimmed.startsWith('CATALYSTS:')) {
        currentSection = 'catalysts';
      } else if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
        const item = trimmed.replace(/^[-•]\s*/, '').trim();
        if (item && analysis[currentSection]) {
          analysis[currentSection].push(item);
        }
      }
    });

    return analysis;
  }

  getDefaultTrend(topic) {
    return {
      momentum: 'stable',
      drivers: [
        `Growing interest in ${topic.name}`,
        'Market evolution and maturity',
        'Technological advancement'
      ],
      adoptionStage: 'early_majority',
      outlook: 'Moderate growth expected',
      barriers: ['Implementation complexity', 'Market education needed'],
      catalysts: ['Regulatory changes', 'Technology breakthroughs']
    };
  }
}

class MarketDynamicsAgent {
  async analyze(topic) {
    console.log(`[MarketDynamics] Analyzing market dynamics for: ${topic.name}`);
    
    const prompt = `
As a Market Dynamics Analyst, provide quantitative analysis for "${topic.name}".

Focus on:
1. MARKET SIZE: Current market size and growth projections
2. INVESTMENT ACTIVITY: VC funding, M&A activity, corporate investment
3. REGULATORY ENVIRONMENT: Current and upcoming regulations
4. TECHNOLOGY MATURITY: Readiness level and implementation challenges
5. CUSTOMER DEMAND: Evidence of market pull vs technology push
6. COMPETITIVE DYNAMICS: Market concentration and entry barriers

Provide specific metrics where available:
- Growth rates (CAGR)
- Investment amounts
- Number of active players
- Adoption percentages
- Time to market estimates

Format as structured data.`;

    try {
      const response = await claudeService.sendMessage(prompt);
      return this.parseMarketDynamics(response);
    } catch (error) {
      console.error('[MarketDynamics] Error:', error);
      return this.getDefaultDynamics(topic);
    }
  }

  parseMarketDynamics(response) {
    // Extract quantitative data from response
    const dynamics = {
      marketSize: this.extractMetric(response, /market size.*?(\$[\d.]+[BMT])/i),
      growthRate: this.extractMetric(response, /growth.*?(\d+%)/i),
      investmentLevel: this.extractMetric(response, /investment.*?(\$[\d.]+[BMK])/i),
      playerCount: this.extractMetric(response, /(\d+)\s*(?:companies|players|competitors)/i),
      maturityLevel: this.categorizeMaturity(response),
      demandSignal: this.assessDemand(response),
      timeToMarket: this.extractTimeframe(response)
    };

    return dynamics;
  }

  extractMetric(text, regex) {
    const match = text.match(regex);
    return match ? match[1] : 'N/A';
  }

  categorizeMaturity(text) {
    const lower = text.toLowerCase();
    if (lower.includes('mature') || lower.includes('established')) return 'mature';
    if (lower.includes('emerging') || lower.includes('early')) return 'emerging';
    if (lower.includes('experimental') || lower.includes('pilot')) return 'experimental';
    return 'developing';
  }

  assessDemand(text) {
    const lower = text.toLowerCase();
    if (lower.includes('strong demand') || lower.includes('high demand')) return 'strong';
    if (lower.includes('growing demand') || lower.includes('increasing')) return 'growing';
    if (lower.includes('limited demand') || lower.includes('weak')) return 'limited';
    return 'moderate';
  }

  extractTimeframe(text) {
    const match = text.match(/(\d+)\s*(months?|years?)/i);
    return match ? `${match[1]} ${match[2]}` : '12-24 months';
  }

  getDefaultDynamics(topic) {
    return {
      marketSize: 'Emerging',
      growthRate: 'N/A',
      investmentLevel: 'Moderate',
      playerCount: 'Multiple',
      maturityLevel: 'developing',
      demandSignal: 'moderate',
      timeToMarket: '12-24 months'
    };
  }
}

class MediaMonitoringAgent {
  constructor() {
    this.parser = new Parser();
    this.sources = [
      { url: 'https://techcrunch.com/feed/', name: 'TechCrunch' },
      { url: 'https://www.theverge.com/rss/index.xml', name: 'The Verge' },
      { url: 'https://feeds.feedburner.com/venturebeat/SZYF', name: 'VentureBeat' },
      { url: 'https://www.wired.com/feed/rss', name: 'Wired' },
      { url: 'https://feeds.arstechnica.com/arstechnica/index', name: 'Ars Technica' }
    ];
  }

  async analyze(topic) {
    console.log(`[MediaMonitor] Scanning media coverage for: ${topic.name}`);
    
    const recentNews = [];
    const keywords = [topic.name.toLowerCase(), ...(topic.keywords || [])];
    
    // Scan news sources in parallel
    const feedPromises = this.sources.map(async (source) => {
      try {
        const feed = await this.parser.parseURL(source.url);
        const relevantItems = feed.items
          .filter(item => {
            const content = `${item.title} ${item.contentSnippet || ''}`.toLowerCase();
            return keywords.some(keyword => content.includes(keyword.toLowerCase()));
          })
          .slice(0, 5)
          .map(item => ({
            title: item.title,
            date: item.pubDate,
            source: source.name,
            url: item.link,
            snippet: item.contentSnippet?.substring(0, 200)
          }));
        
        return relevantItems;
      } catch (err) {
        console.error(`[MediaMonitor] Error parsing ${source.name}:`, err.message);
        return [];
      }
    });
    
    const allFeeds = await Promise.all(feedPromises);
    allFeeds.forEach(items => recentNews.push(...items));
    
    // Sort by date and limit
    recentNews.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Analyze media sentiment and coverage
    const mediaTrend = this.analyzeMediaTrend(recentNews);
    
    return {
      recentNews: recentNews.slice(0, 10),
      mediaTrend,
      coverageVolume: recentNews.length,
      lastUpdated: new Date().toISOString()
    };
  }

  analyzeMediaTrend(news) {
    const volume = news.length;
    
    if (volume > 20) return 'increasing';
    if (volume > 10) return 'stable';
    if (volume > 5) return 'moderate';
    if (volume > 0) return 'emerging';
    return 'quiet';
  }
}

class SynthesisAgent {
  async synthesize(data) {
    const { topic, competitiveAnalysis, trendAnalysis, marketAnalysis, mediaAnalysis } = data;
    
    console.log(`[Synthesizer] Creating comprehensive analysis for: ${topic.name}`);
    
    // Determine time window based on NVS and momentum
    const timeWindow = this.calculateTimeWindow(
      competitiveAnalysis.metrics.narrativeVacuumScore,
      trendAnalysis.momentum
    );
    
    // Generate strategic recommendations
    const recommendations = await this.generateRecommendations({
      topic,
      nvs: competitiveAnalysis.metrics.narrativeVacuumScore,
      momentum: trendAnalysis.momentum,
      competitiveGaps: this.identifyGaps(competitiveAnalysis),
      marketDynamics: marketAnalysis
    });
    
    return {
      id: topic.id,
      name: topic.name,
      keywords: topic.keywords || [],
      momentum: trendAnalysis.momentum,
      opportunityScore: competitiveAnalysis.metrics.narrativeVacuumScore,
      mediaTrend: mediaAnalysis.mediaTrend,
      keyDrivers: trendAnalysis.drivers.slice(0, 3),
      barriers: trendAnalysis.barriers.slice(0, 3),
      catalysts: trendAnalysis.catalysts.slice(0, 2),
      timeWindow,
      adoptionStage: trendAnalysis.adoptionStage,
      marketDynamics: {
        size: marketAnalysis.marketSize,
        growth: marketAnalysis.growthRate,
        maturity: marketAnalysis.maturityLevel,
        demand: marketAnalysis.demandSignal
      },
      competitorActivity: {
        ...competitiveAnalysis.metrics.counts,
        details: competitiveAnalysis.competitors,
        weaknessRatio: competitiveAnalysis.metrics.ratios.weakness,
        intensity: competitiveAnalysis.metrics.competitiveIntensity,
        nvsCalculation: competitiveAnalysis.metrics.calculation,
        nvsInterpretation: competitiveAnalysis.metrics.interpretation
      },
      strategicRecommendations: recommendations,
      recentNews: mediaAnalysis.recentNews.slice(0, 5),
      analysisMetadata: {
        lastUpdated: new Date().toISOString(),
        dataQuality: this.assessDataQuality(data),
        confidence: this.calculateConfidence(data)
      }
    };
  }

  calculateTimeWindow(nvs, momentum) {
    if (nvs > 80 && ['hot', 'growing'].includes(momentum)) return 'immediate';
    if (nvs > 60) return '3months';
    if (nvs > 40) return '6months';
    return '12months';
  }

  identifyGaps(competitiveAnalysis) {
    return competitiveAnalysis.competitors
      .filter(c => c.strength === 'weak' || c.strength === 'none')
      .flatMap(c => c.vulnerabilities || []);
  }

  async generateRecommendations(context) {
    const { nvs, momentum, competitiveGaps, topic } = context;
    
    const recommendations = [];
    
    // High opportunity recommendations
    if (nvs > 70) {
      recommendations.push({
        priority: 'high',
        action: `Launch aggressive ${topic.name} initiative`,
        rationale: 'Significant competitive vacuum exists',
        timeline: 'immediate'
      });
    }
    
    // Momentum-based recommendations
    if (momentum === 'hot' || momentum === 'growing') {
      recommendations.push({
        priority: 'high',
        action: 'Establish thought leadership position',
        rationale: `${momentum} market momentum creates visibility opportunity`,
        timeline: '30days'
      });
    }
    
    // Gap-based recommendations
    if (competitiveGaps.length > 0) {
      recommendations.push({
        priority: 'medium',
        action: `Address competitor vulnerabilities: ${competitiveGaps[0]}`,
        rationale: 'Exploit identified competitive weaknesses',
        timeline: '90days'
      });
    }
    
    return recommendations.slice(0, 3);
  }

  assessDataQuality(data) {
    let quality = 0;
    
    // Check completeness
    if (data.competitiveAnalysis?.competitors?.length > 0) quality += 25;
    if (data.trendAnalysis?.drivers?.length > 0) quality += 25;
    if (data.marketAnalysis?.marketSize !== 'N/A') quality += 25;
    if (data.mediaAnalysis?.recentNews?.length > 0) quality += 25;
    
    if (quality >= 75) return 'high';
    if (quality >= 50) return 'medium';
    return 'low';
  }

  calculateConfidence(data) {
    const factors = [
      data.competitiveAnalysis?.competitors?.length > 3,
      data.mediaAnalysis?.recentNews?.length > 5,
      data.marketAnalysis?.growthRate !== 'N/A',
      data.trendAnalysis?.drivers?.length > 2
    ];
    
    const score = factors.filter(Boolean).length / factors.length;
    return Math.round(score * 100);
  }
}

module.exports = {
  TopicMomentumCoordinator,
  CompetitivePositioningAgent,
  TrendAnalysisAgent,
  MarketDynamicsAgent,
  MediaMonitoringAgent,
  SynthesisAgent
};