/**
 * Intelligence Analysis Service
 * Uses research agents to analyze monitoring results and extract insights
 */

const claudeService = require('../../config/claude');

class IntelligenceAnalysisService {
  /**
   * Analyze articles using research agents to extract intelligence
   * @param {Array} articles - Raw articles from monitoring
   * @param {Object} context - Organization context (name, competitors, topics)
   * @returns {Object} Analyzed intelligence with findings, opportunities, risks
   */
  async analyzeWithResearchAgents(articles, context) {
    console.log('=== ANALYZING COVERAGE WITH RESEARCH AGENTS ===');
    console.log(`Analyzing ${articles.length} articles for coverage of ${context.organization.name}`);
    console.log('Tracking competitors:', context.competitors.map(c => c.name).join(', '));
    console.log('Tracking topics:', context.topics.map(t => t.name).join(', '));

    // Analyze coverage across all configured targets
    const coverageAnalysis = await this.analyzeCoverage(articles, context);

    // Identify patterns and opportunities from the coverage
    const opportunities = await this.identifyOpportunitiesFromCoverage(
      articles,
      context,
      coverageAnalysis
    );

    return {
      coverageAnalysis: coverageAnalysis,
      opportunities: opportunities,
      // Keep legacy structure for compatibility
      organizationIntelligence: coverageAnalysis.organization,
      competitiveIntelligence: coverageAnalysis.competitors,
      topicIntelligence: coverageAnalysis.topics
    };
  }

  async analyzeCoverage(articles, context) {
    const prompt = `You are a coverage analysis agent monitoring media coverage for ${context.organization.name}.

I need you to analyze the coverage of:
- Organization: ${context.organization.name}
- Competitors: ${context.competitors.map(c => c.name).join(', ')}
- Topics: ${context.topics.map(t => t.name).join(', ')}

Articles collected (${articles.length} total):
${articles.slice(0, 20).map((a, i) => `
${i + 1}. ${a.title}
Source: ${a.source}
Date: ${a.date || a.pubDate}
Summary: ${(a.description || '').substring(0, 150)}
`).join('\n')}

Analyze the COVERAGE patterns, not the companies themselves:
1. What is being covered about each entity?
2. What narratives are emerging?
3. What gaps exist in the coverage?
4. What opportunities does the coverage reveal?

Return a JSON object:
{
  "organization": {
    "coverageVolume": "high|medium|low",
    "mainNarratives": ["narrative 1", "narrative 2"],
    "sentiment": "positive|negative|neutral|mixed",
    "keyMessages": ["message 1", "message 2"],
    "coverageGaps": ["gap 1", "gap 2"]
  },
  "competitors": {
    "mostCovered": "competitor name",
    "competitorNarratives": {"competitor1": "their narrative", "competitor2": "their narrative"},
    "competitiveAdvantages": ["advantage 1", "advantage 2"],
    "competitiveThreats": ["threat 1", "threat 2"]
  },
  "topics": {
    "trendingTopics": ["topic 1", "topic 2"],
    "emergingThemes": ["theme 1", "theme 2"],
    "underreportedAreas": ["area 1", "area 2"],
    "narrativeOpportunities": ["opportunity 1", "opportunity 2"]
  },
  "overallInsights": {
    "dominantStory": "The main story across all coverage",
    "coverageBalance": "How balanced is coverage between org and competitors",
    "strategicImplications": ["implication 1", "implication 2"]
  }
}`;

    try {
      const response = await claudeService.sendMessage(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Coverage analysis failed:', error);
    }

    // Fallback
    return {
      organization: {
        coverageVolume: 'low',
        mainNarratives: [],
        sentiment: 'neutral',
        keyMessages: [],
        coverageGaps: []
      },
      competitors: {
        mostCovered: 'Unknown',
        competitorNarratives: {},
        competitiveAdvantages: [],
        competitiveThreats: []
      },
      topics: {
        trendingTopics: [],
        emergingThemes: [],
        underreportedAreas: [],
        narrativeOpportunities: []
      },
      overallInsights: {
        dominantStory: 'Insufficient data',
        coverageBalance: 'Unknown',
        strategicImplications: []
      }
    };
  }

  // Legacy methods kept for backwards compatibility
  async analyzeOrganizationIntelligence(articles, organization) {
    // Redirect to coverage analysis
    const coverage = await this.analyzeCoverage(articles, {
      organization: organization,
      competitors: [],
      topics: []
    });
    return coverage.organization || {
      summary: `Coverage analysis for ${organization.name}`,
      findings: [],
      opportunities: [],
      risks: [],
      sentiment: 'neutral'
    };
  }

  async analyzeCompetitiveIntelligence(articles, competitors, organization) {
    // Redirect to coverage analysis
    const coverage = await this.analyzeCoverage(articles, {
      organization: organization,
      competitors: competitors,
      topics: []
    });
    return coverage.competitors || {
      summary: `Monitoring ${competitors.length} competitors`,
      competitorAnalyses: [],
      opportunities: [],
      threats: []
    };
  }

  async analyzeTopicIntelligence(articles, topics, organization) {
    // Redirect to coverage analysis
    const coverage = await this.analyzeCoverage(articles, {
      organization: organization,
      competitors: [],
      topics: topics
    });
    return coverage.topics || {
      summary: `Monitoring ${topics.length} key topics`,
      topicAnalyses: [],
      trends: [],
      recommendations: []
    };
  }

  async identifyOpportunitiesFromCoverage(articles, context, coverageAnalysis) {
    const prompt = `You are an opportunity detection agent analyzing media coverage patterns.

Organization: ${context.organization.name}
Competitors: ${context.competitors.map(c => c.name).join(', ')}
Topics: ${context.topics.map(t => t.name).join(', ')}

Coverage Analysis:
- Organization coverage: ${JSON.stringify(coverageAnalysis.organization?.mainNarratives || [])}
- Competitor narratives: ${JSON.stringify(coverageAnalysis.competitors?.competitorNarratives || {})}
- Coverage gaps: ${JSON.stringify(coverageAnalysis.organization?.coverageGaps || [])}
- Underreported areas: ${JSON.stringify(coverageAnalysis.topics?.underreportedAreas || [])}
- Narrative opportunities: ${JSON.stringify(coverageAnalysis.topics?.narrativeOpportunities || [])}

Based on the COVERAGE PATTERNS (not company analysis), identify opportunities:

1. **Narrative Vacuum**: Where can ${context.organization.name} fill gaps in coverage?
2. **Counter-Narrative**: Where can they challenge competitor narratives?
3. **First-Mover Coverage**: What emerging topics lack any coverage?
4. **Coverage Hijacking**: Which trending topics can they own?

Return a JSON array of opportunities:
[
  {
    "type": "Narrative Vacuum|Counter-Narrative|First-Mover Coverage|Coverage Hijacking",
    "title": "Specific opportunity based on coverage gap",
    "description": "How to exploit this coverage pattern",
    "urgency": "critical|high|medium|low",
    "window": "How long this opportunity exists",
    "recommendedAction": "Specific PR/comms action",
    "expectedImpact": "Media coverage outcome"
  }
]`;

    try {
      const response = await claudeService.sendMessage(prompt);
      // Try to extract JSON array
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      // Fallback to object with opportunities array
      const objMatch = response.match(/\{[\s\S]*\}/);
      if (objMatch) {
        const result = JSON.parse(objMatch[0]);
        return result.opportunities || [];
      }
    } catch (error) {
      console.error('Opportunity identification failed:', error);
    }

    return [];
  }
}

module.exports = new IntelligenceAnalysisService();