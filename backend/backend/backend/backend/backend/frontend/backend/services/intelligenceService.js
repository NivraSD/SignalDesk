const axios = require('axios');
const { pool } = require('../server');
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');

// Initialize AI clients
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

class IntelligenceService {
  constructor() {
    this.activeMonitors = new Map();
    this.projectCache = new Map();
  }

  /**
   * Process complete intelligence request through the pipeline
   */
  async processIntelligenceRequest({ query, organizationId, targetType }) {
    const projectId = this.generateProjectId();
    
    try {
      // Phase 1: Query Clarification (using query-clarifier agent pattern)
      const clarifiedQuery = await this.clarifyQuery(query);
      
      if (clarifiedQuery.needs_clarification) {
        // Store project state for continuation
        this.projectCache.set(projectId, {
          originalQuery: query,
          organizationId,
          targetType,
          status: 'awaiting_clarification'
        });
        
        return {
          status: 'needs_clarification',
          projectId,
          questions: clarifiedQuery.questions
        };
      }

      // Phase 2: Research Coordination (using research-coordinator agent pattern)
      const researchPlan = await this.createResearchPlan(clarifiedQuery.refined_query, targetType);
      
      // Phase 3: Execute Research
      const findings = await this.executeResearch(researchPlan, organizationId);
      
      // Phase 4: Synthesize Findings (using research-synthesizer agent pattern)
      const synthesis = await this.synthesizeFindings(findings);
      
      // Phase 5: Identify Opportunities
      const opportunities = await this.identifyOpportunities(synthesis, organizationId);
      
      // Phase 6: Generate Report (using report-generator agent pattern)
      const report = await this.generateReport(synthesis, opportunities);
      
      // Store in database
      await this.storeProject({
        id: projectId,
        organizationId,
        query,
        clarifiedQuery: clarifiedQuery.refined_query,
        researchPlan,
        synthesis,
        report,
        status: 'completed'
      });
      
      return {
        status: 'completed',
        projectId,
        report,
        opportunities,
        synthesis,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Pipeline error:', error);
      throw error;
    }
  }

  /**
   * Clarify query using AI
   */
  async clarifyQuery(query, previousAnswers = null) {
    // Analyze query clarity
    const isVague = this.isQueryVague(query);
    
    if (!isVague) {
      return {
        needs_clarification: false,
        confidence_score: 0.9,
        refined_query: query,
        focus_areas: this.extractKeywords(query)
      };
    }

    // Generate clarification questions using AI
    try {
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `Analyze this research query and generate clarification questions if needed:
            Query: "${query}"
            
            Return JSON with:
            - needs_clarification: boolean
            - confidence_score: 0-1
            - questions: array of {question, type, options}
            - refined_query: improved version of the query`
        }]
      });

      return JSON.parse(response.content[0].text);
    } catch (error) {
      // Fallback to rule-based clarification
      return {
        needs_clarification: true,
        confidence_score: 0.4,
        questions: [{
          question: "What specific aspect would you like to focus on?",
          type: "multiple_choice",
          options: ["Competitor analysis", "Market trends", "Opportunities", "All aspects"]
        }],
        refined_query: query
      };
    }
  }

  /**
   * Create research plan
   */
  async createResearchPlan(query, targetType) {
    const plan = {
      strategy: `Comprehensive ${targetType} intelligence gathering for: ${query}`,
      iterations_planned: 1,
      researcher_tasks: {}
    };

    // Allocate tasks based on target type
    if (targetType === 'competitors' || targetType === 'mixed') {
      plan.researcher_tasks.competitor_research = {
        assigned: true,
        priority: 'high',
        tasks: [
          'Identify top competitors',
          'Analyze competitive positioning',
          'Track recent activities'
        ]
      };
    }

    if (targetType === 'topics' || targetType === 'mixed') {
      plan.researcher_tasks.topic_research = {
        assigned: true,
        priority: 'high',
        tasks: [
          'Monitor trending topics',
          'Analyze narrative gaps',
          'Identify thought leadership opportunities'
        ]
      };
    }

    plan.researcher_tasks.data_analysis = {
      assigned: true,
      priority: 'medium',
      tasks: [
        'Calculate metrics',
        'Identify patterns',
        'Score opportunities'
      ]
    };

    return plan;
  }

  /**
   * Execute research plan
   */
  async executeResearch(plan, organizationId) {
    const findings = {
      competitors: [],
      topics: [],
      metrics: [],
      sources: []
    };

    // Get existing targets from database
    const targetsQuery = `
      SELECT * FROM intelligence_targets 
      WHERE organization_id = $1 AND active = true
    `;
    const targetsResult = await pool.query(targetsQuery, [organizationId]);
    
    // Get recent findings
    const findingsQuery = `
      SELECT f.*, t.name as target_name, t.type as target_type
      FROM intelligence_findings f
      JOIN intelligence_targets t ON f.target_id = t.id
      WHERE t.organization_id = $1 
        AND f.published_at > NOW() - INTERVAL '7 days'
      ORDER BY f.relevance_score DESC
      LIMIT 100
    `;
    const findingsResult = await pool.query(findingsQuery, [organizationId]);

    // Process findings by type
    findingsResult.rows.forEach(finding => {
      if (finding.target_type === 'competitor') {
        findings.competitors.push({
          name: finding.target_name,
          finding: finding.title,
          sentiment: finding.sentiment_score,
          relevance: finding.relevance_score,
          url: finding.url
        });
      } else if (finding.target_type === 'topic') {
        findings.topics.push({
          topic: finding.target_name,
          finding: finding.title,
          sentiment: finding.sentiment_score,
          relevance: finding.relevance_score,
          url: finding.url
        });
      }
    });

    // Calculate metrics
    findings.metrics = await this.calculateMetrics(organizationId);

    return findings;
  }

  /**
   * Synthesize findings
   */
  async synthesizeFindings(findings) {
    const synthesis = {
      major_themes: [],
      unique_insights: [],
      contradictions: [],
      evidence_assessment: {
        strongest_findings: [],
        moderate_confidence: [],
        weak_evidence: []
      },
      knowledge_gaps: [],
      synthesis_summary: ''
    };

    // Identify major themes
    if (findings.competitors.length > 0) {
      synthesis.major_themes.push({
        theme: 'Competitive Landscape',
        description: `Analysis of ${findings.competitors.length} competitor activities`,
        supporting_evidence: findings.competitors.slice(0, 5).map(c => ({
          source_type: 'competitor_analysis',
          key_point: c.finding,
          confidence: c.relevance > 0.7 ? 'high' : 'medium'
        })),
        consensus_level: 'strong'
      });
    }

    if (findings.topics.length > 0) {
      synthesis.major_themes.push({
        theme: 'Trending Topics',
        description: `${findings.topics.length} trending narratives identified`,
        supporting_evidence: findings.topics.slice(0, 5).map(t => ({
          source_type: 'topic_analysis',
          key_point: t.finding,
          confidence: t.relevance > 0.7 ? 'high' : 'medium'
        })),
        consensus_level: 'moderate'
      });
    }

    // Identify unique insights
    const highRelevanceFindings = [...findings.competitors, ...findings.topics]
      .filter(f => f.relevance > 0.8);
    
    highRelevanceFindings.forEach(finding => {
      synthesis.unique_insights.push({
        insight: finding.finding,
        source: finding.name || finding.topic,
        significance: 'High relevance finding',
        citation: finding.url
      });
    });

    // Generate summary
    synthesis.synthesis_summary = `Analysis identified ${synthesis.major_themes.length} major themes and ${synthesis.unique_insights.length} unique insights. ` +
      `The research reveals significant activity in both competitive landscape and trending topics.`;

    return synthesis;
  }

  /**
   * Identify opportunities using NVS
   */
  async identifyOpportunities(synthesis, organizationId) {
    const opportunities = [];

    // Query for potential opportunities based on synthesis
    for (const theme of synthesis.major_themes) {
      if (theme.theme === 'Trending Topics') {
        for (const evidence of theme.supporting_evidence) {
          // Calculate NVS score
          const nvsScore = await this.calculateNVS(evidence.key_point, organizationId);
          
          if (nvsScore > 60) {
            opportunities.push({
              title: `Opportunity: ${evidence.key_point}`,
              type: 'thought_leadership',
              nvs_score: nvsScore,
              confidence: 0.7,
              urgency: nvsScore > 80 ? 'high' : 'medium',
              recommended_actions: [
                'Create content on this topic',
                'Engage with thought leaders',
                'Monitor competitor responses'
              ]
            });
          }
        }
      }
    }

    // Store opportunities in database
    for (const opp of opportunities) {
      await this.storeOpportunity(opp, organizationId);
    }

    return opportunities;
  }

  /**
   * Generate final report
   */
  async generateReport(synthesis, opportunities) {
    const report = [];
    
    report.push('# Intelligence Report\n\n');
    report.push(`Generated: ${new Date().toISOString()}\n\n`);
    
    // Executive Summary
    report.push('## Executive Summary\n\n');
    report.push(synthesis.synthesis_summary + '\n\n');
    
    // Major Themes
    report.push('## Key Findings\n\n');
    synthesis.major_themes.forEach(theme => {
      report.push(`### ${theme.theme}\n`);
      report.push(`${theme.description}\n\n`);
      theme.supporting_evidence.slice(0, 3).forEach(evidence => {
        report.push(`- ${evidence.key_point}\n`);
      });
      report.push('\n');
    });
    
    // Opportunities
    if (opportunities.length > 0) {
      report.push('## Identified Opportunities\n\n');
      opportunities.forEach((opp, idx) => {
        report.push(`### ${idx + 1}. ${opp.title}\n`);
        report.push(`- **Type**: ${opp.type}\n`);
        report.push(`- **NVS Score**: ${opp.nvs_score}\n`);
        report.push(`- **Urgency**: ${opp.urgency}\n`);
        report.push(`- **Actions**:\n`);
        opp.recommended_actions.forEach(action => {
          report.push(`  - ${action}\n`);
        });
        report.push('\n');
      });
    }
    
    // Unique Insights
    if (synthesis.unique_insights.length > 0) {
      report.push('## Unique Insights\n\n');
      synthesis.unique_insights.slice(0, 5).forEach(insight => {
        report.push(`- ${insight.insight} (Source: ${insight.source})\n`);
      });
    }
    
    return report.join('');
  }

  /**
   * Calculate Narrative Vacuum Score
   */
  async calculateNVS(topic, organizationId) {
    // Query for topic metrics
    const query = `
      SELECT 
        COUNT(*) as mention_count,
        AVG(sentiment_score) as avg_sentiment,
        MAX(relevance_score) as max_relevance
      FROM intelligence_findings f
      JOIN intelligence_targets t ON f.target_id = t.id
      WHERE t.organization_id = $1
        AND f.published_at > NOW() - INTERVAL '7 days'
        AND (f.title ILIKE $2 OR f.content ILIKE $2)
    `;
    
    const result = await pool.query(query, [organizationId, `%${topic}%`]);
    const metrics = result.rows[0];
    
    // Calculate NVS components
    const mediaDemand = Math.min(metrics.mention_count / 10, 1) * 100;
    const competitorAbsence = (1 - (metrics.mention_count / 100)) * 100;
    const clientStrength = 50; // Default
    const timeDecay = 80; // Recent topic
    const marketSaturation = metrics.mention_count > 50 ? 70 : 30;
    
    // Calculate final NVS
    const nvs = (
      (mediaDemand * 0.25) +
      (competitorAbsence * 0.25) +
      (clientStrength * 0.20) +
      (timeDecay * 0.15) +
      ((100 - marketSaturation) * 0.15)
    );
    
    return Math.round(nvs);
  }

  /**
   * Setup monitoring sources for a target
   */
  async setupMonitoringSources(targetId, targetType) {
    const sources = [];
    
    // Define sources based on target type
    if (targetType === 'competitor') {
      sources.push(
        {
          source_type: 'news',
          source_name: 'Google News',
          url: 'https://news.google.com',
          frequency: 'hourly'
        },
        {
          source_type: 'social',
          source_name: 'LinkedIn',
          url: 'https://linkedin.com',
          frequency: 'daily'
        }
      );
    } else if (targetType === 'topic') {
      sources.push(
        {
          source_type: 'news',
          source_name: 'Google News',
          url: 'https://news.google.com',
          frequency: 'real-time'
        },
        {
          source_type: 'social',
          source_name: 'Twitter',
          url: 'https://twitter.com',
          frequency: 'real-time'
        },
        {
          source_type: 'social',
          source_name: 'Reddit',
          url: 'https://reddit.com',
          frequency: 'hourly'
        }
      );
    }
    
    // Insert sources into database
    for (const source of sources) {
      const query = `
        INSERT INTO monitoring_sources 
        (target_id, source_type, source_name, url, frequency, active)
        VALUES ($1, $2, $3, $4, $5, true)
      `;
      await pool.query(query, [
        targetId,
        source.source_type,
        source.source_name,
        source.url,
        source.frequency
      ]);
    }
  }

  /**
   * Start monitoring for an organization
   */
  async startMonitoring(organizationId, targetIds = null) {
    // Get targets to monitor
    let query = `
      SELECT t.*, array_agg(s.*) as sources
      FROM intelligence_targets t
      LEFT JOIN monitoring_sources s ON t.id = s.target_id
      WHERE t.organization_id = $1 AND t.active = true
    `;
    
    const params = [organizationId];
    if (targetIds) {
      query += ' AND t.id = ANY($2)';
      params.push(targetIds);
    }
    
    query += ' GROUP BY t.id';
    
    const result = await pool.query(query, params);
    
    // Start monitoring for each target
    const monitoringTasks = result.rows.map(target => 
      this.monitorTarget(target)
    );
    
    await Promise.all(monitoringTasks);
    
    return {
      targets: result.rows.length,
      sources: result.rows.reduce((sum, t) => sum + (t.sources?.length || 0), 0),
      nextCheck: new Date(Date.now() + 3600000) // 1 hour
    };
  }

  /**
   * Monitor a specific target
   */
  async monitorTarget(target) {
    // This would connect to real data sources
    // For now, simulate finding discovery
    console.log(`Monitoring ${target.name} (${target.type})`);
    
    // Schedule next check
    const updateQuery = `
      UPDATE monitoring_sources 
      SET last_checked = NOW(), next_check = NOW() + INTERVAL '1 hour'
      WHERE target_id = $1
    `;
    await pool.query(updateQuery, [target.id]);
    
    return true;
  }

  /**
   * Helper methods
   */
  generateProjectId() {
    return `proj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  isQueryVague(query) {
    const vagueTerms = ['tell me about', 'what about', 'information on', 'show me'];
    return vagueTerms.some(term => query.toLowerCase().includes(term));
  }

  extractKeywords(query) {
    return query.split(' ')
      .filter(word => word.length > 3)
      .filter(word => !['what', 'about', 'tell', 'show', 'information'].includes(word.toLowerCase()));
  }

  async calculateMetrics(organizationId) {
    const query = `
      SELECT 
        COUNT(DISTINCT f.id) as total_findings,
        COUNT(DISTINCT o.id) as total_opportunities,
        AVG(f.relevance_score) as avg_relevance
      FROM intelligence_targets t
      LEFT JOIN intelligence_findings f ON t.id = f.target_id
      LEFT JOIN opportunities o ON t.organization_id = o.organization_id
      WHERE t.organization_id = $1
        AND f.created_at > NOW() - INTERVAL '7 days'
    `;
    
    const result = await pool.query(query, [organizationId]);
    return [{
      metric: 'Weekly Findings',
      value: result.rows[0].total_findings,
      trend: 'stable'
    }, {
      metric: 'Opportunities',
      value: result.rows[0].total_opportunities,
      trend: 'increasing'
    }];
  }

  async storeProject(project) {
    const query = `
      INSERT INTO research_projects 
      (id, organization_id, query, clarified_query, coordinator_plan, 
       synthesized_findings, final_report, status, completed_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      ON CONFLICT (id) DO UPDATE SET
        synthesized_findings = $6,
        final_report = $7,
        status = $8,
        completed_at = NOW()
    `;
    
    await pool.query(query, [
      project.id,
      project.organizationId,
      project.query,
      project.clarifiedQuery,
      JSON.stringify(project.researchPlan),
      JSON.stringify(project.synthesis),
      project.report,
      project.status
    ]);
  }

  async storeOpportunity(opportunity, organizationId) {
    const query = `
      INSERT INTO opportunities 
      (organization_id, title, description, opportunity_type, nvs_score, 
       confidence_score, urgency, recommended_actions, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'identified')
    `;
    
    await pool.query(query, [
      organizationId,
      opportunity.title,
      opportunity.title,
      opportunity.type,
      opportunity.nvs_score,
      opportunity.confidence,
      opportunity.urgency,
      JSON.stringify(opportunity.recommended_actions)
    ]);
  }

  calculateHealthScore(status) {
    let score = 0;
    if (status.active_targets > 0) score += 25;
    if (status.active_sources > 0) score += 25;
    if (status.findings_24h > 0) score += 25;
    if (status.opportunities_24h > 0) score += 25;
    return score;
  }

  async continueProject(projectId, clarifiedQuery) {
    const project = this.projectCache.get(projectId);
    if (!project) {
      throw new Error('Project not found');
    }
    
    // Continue with clarified query
    return this.processIntelligenceRequest({
      query: clarifiedQuery.refined_query,
      organizationId: project.organizationId,
      targetType: project.targetType
    });
  }
}

module.exports = new IntelligenceService();