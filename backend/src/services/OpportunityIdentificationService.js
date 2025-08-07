/**
 * Opportunity Identification Service
 * Advanced opportunity detection using coverage gap analysis and research agents
 */

const pool = require('../config/db');
const claudeService = require('../../config/claude');
const IntelligenceAnalysisService = require('./IntelligenceAnalysisService');

class OpportunityIdentificationService {
  /**
   * Identify opportunities from coverage analysis
   * @param {string} organizationId - Organization to identify opportunities for
   * @returns {Array} Array of identified opportunities
   */
  async identifyOpportunities(organizationId) {
    console.log('=== IDENTIFYING OPPORTUNITIES FROM COVERAGE GAPS ===');
    console.log('Organization ID:', organizationId);

    try {
      // 1. Get organization context
      const context = await this.getOrganizationContext(organizationId);
      if (!context) {
        console.error('Failed to get organization context');
        return [];
      }

      // 2. Get recent articles from monitoring
      const articles = await this.getRecentArticles(organizationId);
      console.log(`Analyzing ${articles.length} recent articles`);

      // 3. Perform coverage analysis
      const coverageAnalysis = await IntelligenceAnalysisService.analyzeCoverage(articles, context);
      console.log('Coverage analysis complete:', {
        orgCoverage: coverageAnalysis.organization?.coverageVolume,
        gaps: coverageAnalysis.organization?.coverageGaps?.length || 0,
        narrativeOpps: coverageAnalysis.topics?.narrativeOpportunities?.length || 0
      });

      // 4. Identify opportunities using advanced pattern recognition
      const opportunities = await this.detectOpportunityPatterns(
        articles,
        context,
        coverageAnalysis
      );

      // 5. Score and prioritize opportunities
      const scoredOpportunities = await this.scoreOpportunities(opportunities, context);

      // 6. Store high-value opportunities in database
      await this.storeOpportunities(organizationId, scoredOpportunities);

      return scoredOpportunities;

    } catch (error) {
      console.error('Error identifying opportunities:', error);
      return [];
    }
  }

  async getOrganizationContext(organizationId) {
    try {
      // Get organization details
      const orgResult = await pool.query(
        'SELECT * FROM organizations WHERE id = $1',
        [organizationId]
      );

      if (orgResult.rows.length === 0) {
        return null;
      }

      const organization = orgResult.rows[0];

      // Get intelligence targets
      const targetsResult = await pool.query(
        `SELECT * FROM intelligence_targets 
         WHERE organization_id = $1 AND active = true`,
        [organizationId]
      );

      const competitors = targetsResult.rows.filter(t => t.type === 'competitor');
      const topics = targetsResult.rows.filter(t => t.type === 'topic');

      return {
        organization,
        competitors,
        topics
      };
    } catch (error) {
      console.error('Error getting organization context:', error);
      return null;
    }
  }

  async getRecentArticles(organizationId, hoursBack = 24) {
    try {
      // Get articles from the last 24 hours
      const result = await pool.query(`
        SELECT DISTINCT ON (title) 
          title, content, url, source, created_at, metadata
        FROM intelligence_findings 
        WHERE created_at > NOW() - INTERVAL '${hoursBack} hours'
        ORDER BY title, created_at DESC
        LIMIT 500
      `);

      return result.rows;
    } catch (error) {
      console.error('Error getting recent articles:', error);
      return [];
    }
  }

  async detectOpportunityPatterns(articles, context, coverageAnalysis) {
    const prompt = `You are an expert PR strategist analyzing media coverage to identify strategic opportunities.

Organization: ${context.organization.name}
Industry: ${context.organization.industry || 'General'}
Competitors: ${context.competitors.map(c => c.name).join(', ')}
Topics: ${context.topics.map(t => t.name).join(', ')}

COVERAGE ANALYSIS RESULTS:
- Coverage gaps: ${JSON.stringify(coverageAnalysis.organization?.coverageGaps || [])}
- Underreported areas: ${JSON.stringify(coverageAnalysis.topics?.underreportedAreas || [])}
- Competitor narratives: ${JSON.stringify(coverageAnalysis.competitors?.competitorNarratives || {})}
- Narrative opportunities: ${JSON.stringify(coverageAnalysis.topics?.narrativeOpportunities || [])}
- Trending topics: ${JSON.stringify(coverageAnalysis.topics?.trendingTopics || [])}

RECENT HEADLINES (sample):
${articles.slice(0, 15).map(a => `- ${a.title} (${a.source})`).join('\n')}

Identify 5-7 SPECIFIC, ACTIONABLE opportunities based on these patterns:

1. NARRATIVE VACUUM: Topics with no current coverage where ${context.organization.name} can lead
2. COUNTER-NARRATIVE: Opportunities to challenge competitor messaging
3. TREND HIJACKING: Trending topics ${context.organization.name} can own
4. COVERAGE GAPS: Important issues being ignored that ${context.organization.name} can address
5. THOUGHT LEADERSHIP: Emerging themes where ${context.organization.name} can establish expertise

For each opportunity, provide:
- Type of opportunity
- Specific angle or story
- Why this is an opportunity NOW
- Recommended action (press release, op-ed, interview, event, etc.)
- Expected media impact

Return as JSON array with this structure:
[
  {
    "type": "Narrative Vacuum|Counter-Narrative|Trend Hijacking|Coverage Gap|Thought Leadership",
    "title": "Specific opportunity title",
    "description": "Why this is an opportunity",
    "angle": "The unique angle or story to tell",
    "urgency": "critical|high|medium|low",
    "timeWindow": "48 hours|1 week|2 weeks|1 month",
    "recommendedAction": {
      "type": "press release|op-ed|interview|event|social campaign",
      "description": "Specific action to take"
    },
    "expectedImpact": {
      "reach": "high|medium|low",
      "sentiment": "positive|neutral",
      "competitiveAdvantage": "How this positions vs competitors"
    },
    "keyMessages": ["message 1", "message 2", "message 3"]
  }
]`;

    try {
      const response = await claudeService.sendMessage(prompt);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Error detecting opportunity patterns:', error);
    }

    // Fallback opportunities based on coverage gaps
    const fallbackOpportunities = [];
    
    if (coverageAnalysis.organization?.coverageGaps?.length > 0) {
      fallbackOpportunities.push({
        type: 'Coverage Gap',
        title: `Address ${coverageAnalysis.organization.coverageGaps[0]}`,
        description: 'This topic lacks coverage and presents an opportunity',
        angle: 'Be the first to provide perspective on this issue',
        urgency: 'medium',
        timeWindow: '1 week',
        recommendedAction: {
          type: 'press release',
          description: 'Issue a statement addressing this gap'
        },
        expectedImpact: {
          reach: 'medium',
          sentiment: 'positive',
          competitiveAdvantage: 'First-mover advantage'
        },
        keyMessages: ['Leadership', 'Innovation', 'Expertise']
      });
    }

    return fallbackOpportunities;
  }

  async scoreOpportunities(opportunities, context) {
    // Score each opportunity based on multiple factors
    return opportunities.map(opp => {
      let score = 50; // Base score

      // Urgency scoring
      if (opp.urgency === 'critical') score += 30;
      else if (opp.urgency === 'high') score += 20;
      else if (opp.urgency === 'medium') score += 10;

      // Type scoring
      if (opp.type === 'Narrative Vacuum') score += 25; // High value - no competition
      else if (opp.type === 'Counter-Narrative') score += 20; // Direct competitive advantage
      else if (opp.type === 'Trend Hijacking') score += 15; // Riding existing momentum
      else if (opp.type === 'Thought Leadership') score += 15; // Long-term value
      else if (opp.type === 'Coverage Gap') score += 10; // Standard opportunity

      // Impact scoring
      if (opp.expectedImpact?.reach === 'high') score += 15;
      else if (opp.expectedImpact?.reach === 'medium') score += 10;
      else if (opp.expectedImpact?.reach === 'low') score += 5;

      // Time window scoring (shorter = more urgent)
      if (opp.timeWindow === '48 hours') score += 20;
      else if (opp.timeWindow === '1 week') score += 15;
      else if (opp.timeWindow === '2 weeks') score += 10;
      else if (opp.timeWindow === '1 month') score += 5;

      // Cap at 100
      score = Math.min(score, 100);

      return {
        ...opp,
        score,
        id: `opp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
    }).sort((a, b) => b.score - a.score); // Sort by score descending
  }

  async storeOpportunities(organizationId, opportunities) {
    try {
      for (const opp of opportunities.filter(o => o.score >= 60)) {
        await pool.query(`
          INSERT INTO opportunity_queue 
          (organization_id, pattern_name, title, description, urgency, score, 
           confidence, window_end, recommended_actions, source_data, detected_at, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), 'pending')
          ON CONFLICT (organization_id, title) DO UPDATE SET
            score = EXCLUDED.score,
            urgency = EXCLUDED.urgency,
            detected_at = NOW()
        `, [
          organizationId,
          opp.type,
          opp.title,
          opp.description,
          opp.urgency,
          opp.score,
          opp.score / 100, // Convert score to confidence
          new Date(Date.now() + this.parseTimeWindow(opp.timeWindow)),
          JSON.stringify(opp.recommendedAction),
          JSON.stringify(opp),
        ]);
      }
      console.log(`Stored ${opportunities.filter(o => o.score >= 60).length} high-value opportunities`);
    } catch (error) {
      console.error('Error storing opportunities:', error);
    }
  }

  parseTimeWindow(timeWindow) {
    const windowMap = {
      '48 hours': 48 * 60 * 60 * 1000,
      '1 week': 7 * 24 * 60 * 60 * 1000,
      '2 weeks': 14 * 24 * 60 * 60 * 1000,
      '1 month': 30 * 24 * 60 * 60 * 1000
    };
    return windowMap[timeWindow] || 7 * 24 * 60 * 60 * 1000; // Default to 1 week
  }
}

module.exports = new OpportunityIdentificationService();