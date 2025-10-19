/**
 * Intelligence Monitoring Controller
 * Handles monitoring status, targets, findings, and opportunities
 */

const pool = require('../config/db');
const Parser = require('rss-parser');
const axios = require('axios');
const claudeService = require('../../config/claude');

class IntelligenceMonitoringController {
  constructor() {
    // Bind all methods to preserve 'this' context
    this.getMonitoringStatus = this.getMonitoringStatus.bind(this);
    this.getOrganizationTargets = this.getOrganizationTargets.bind(this);
    this.getIntelligenceFindings = this.getIntelligenceFindings.bind(this);
    this.getOpportunities = this.getOpportunities.bind(this);
    this.getMonitoringMetrics = this.getMonitoringMetrics.bind(this);
    this.startMonitoring = this.startMonitoring.bind(this);
    this.stopMonitoring = this.stopMonitoring.bind(this);
    this.createTarget = this.createTarget.bind(this);
    this.fetchRealTimeData = this.fetchRealTimeData.bind(this);
    this.getFindings = this.getFindings.bind(this);
    this.triggerMonitoring = this.triggerMonitoring.bind(this);
    this.identifyOpportunities = this.identifyOpportunities.bind(this);
    this.updateOpportunityStatus = this.updateOpportunityStatus.bind(this);
    this.connectToRealtime = this.connectToRealtime.bind(this);
  }
  /**
   * Get monitoring status for an organization
   */
  async getMonitoringStatus(req, res) {
    try {
      const { organizationId } = req.params;
      
      // Try to get real data from database
      const statusQuery = await pool.query(
        'SELECT * FROM monitoring_status WHERE organization_id = $1',
        [organizationId]
      );
      
      let status;
      if (statusQuery.rows.length > 0) {
        const dbStatus = statusQuery.rows[0];
        
        // Get counts from last 24 hours
        const findingsCount = await pool.query(
          'SELECT COUNT(*) FROM intelligence_findings WHERE organization_id = $1 AND created_at > NOW() - INTERVAL \'24 hours\'',
          [organizationId]
        );
        
        const opportunitiesCount = await pool.query(
          'SELECT COUNT(*) FROM intelligence_opportunities WHERE organization_id = $1 AND created_at > NOW() - INTERVAL \'24 hours\'',
          [organizationId]
        );
        
        status = {
          monitoring: dbStatus.monitoring,
          active_targets: dbStatus.active_targets,
          active_sources: dbStatus.active_sources,
          findings_24h: parseInt(findingsCount.rows[0].count),
          opportunities_24h: parseInt(opportunitiesCount.rows[0].count),
          health: dbStatus.health,
          last_scan: dbStatus.last_scan || dbStatus.updated_at
        };
      } else {
        // Return default status if not found
        status = {
          monitoring: 'active',
          active_targets: 8,
          active_sources: 15,
          findings_24h: 12,
          opportunities_24h: 3,
          health: 'good',
          last_scan: new Date().toISOString()
        };
      }
      
      res.json(status);
    } catch (error) {
      console.error('Error getting monitoring status:', error);
      res.status(500).json({ error: 'Failed to get monitoring status' });
    }
  }

  /**
   * Get targets for an organization
   */
  async getOrganizationTargets(req, res) {
    try {
      const { organizationId } = req.params;
      const { active } = req.query;
      
      console.log('Getting targets for organization:', organizationId);
      
      // Query the actual database for targets
      let query = 'SELECT * FROM intelligence_targets WHERE organization_id = $1';
      let params = [organizationId];
      
      if (active === 'true') {
        query += ' AND active = true';
      }
      
      query += ' ORDER BY created_at DESC';
      
      const result = await pool.query(query, params);
      
      // Transform database results to match expected format
      const targets = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        type: row.type,
        priority: row.priority,
        keywords: row.keywords || [],
        topics: row.topics || [],
        sources: row.sources || [],
        description: row.description,
        active: row.active,
        created_at: row.created_at,
        updated_at: row.updated_at,
        lastUpdated: row.updated_at
      }));
      
      console.log(`Found ${targets.length} targets for organization ${organizationId}`);
      
      res.json(targets);
    } catch (error) {
      console.error('Error getting targets:', error);
      res.status(500).json({ error: 'Failed to get targets' });
    }
  }

  /**
   * Get intelligence findings
   */
  async getIntelligenceFindings(req, res) {
    try {
      const { organizationId, limit = 20 } = req.query;
      
      // Return mock findings with real-time data
      const findings = [];
      
      res.json(findings.slice(0, parseInt(limit)));
    } catch (error) {
      console.error('Error getting findings:', error);
      res.status(500).json({ error: 'Failed to get findings' });
    }
  }

  /**
   * Get opportunities for an organization
   */
  async getOpportunities(req, res) {
    try {
      const { organizationId } = req.params;
      const { status = 'identified', limit = 10 } = req.query;
      
      // Return mock opportunities
      const opportunities = [
        {
          id: 1,
          title: 'Partner with Local Transit Authorities',
          type: 'partnership',
          priority: 'high',
          confidence: 0.82,
          description: 'Cities are looking for first/last mile solutions to complement public transit',
          potentialValue: 'High',
          timeframe: '3-6 months',
          status: 'identified',
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          title: 'Launch Subscription Service for Commuters',
          type: 'product',
          priority: 'medium',
          confidence: 0.75,
          description: 'Market research shows demand for predictable monthly transportation costs',
          potentialValue: 'Medium',
          timeframe: '6-12 months',
          status: 'identified',
          createdAt: new Date().toISOString()
        }
      ];
      
      res.json(opportunities.slice(0, parseInt(limit)));
    } catch (error) {
      console.error('Error getting opportunities:', error);
      res.status(500).json({ error: 'Failed to get opportunities' });
    }
  }

  /**
   * Get monitoring metrics
   */
  async getMonitoringMetrics(req, res) {
    try {
      const { organizationId } = req.params;
      const { days = 7 } = req.query;
      
      // Generate mock metrics
      const metrics = {
        period: `${days} days`,
        totalFindings: 156,
        averageRelevance: 0.73,
        sentimentBreakdown: {
          positive: 45,
          neutral: 78,
          negative: 33
        },
        topSources: [
          { name: 'TechCrunch', count: 23 },
          { name: 'Reuters', count: 19 },
          { name: 'Bloomberg', count: 17 }
        ],
        topTargets: [
          { name: 'Lyft', count: 28 },
          { name: 'Gig Economy Regulation', count: 24 },
          { name: 'DoorDash', count: 21 }
        ],
        alertsTriggered: 8,
        opportunitiesIdentified: 5
      };
      
      res.json(metrics);
    } catch (error) {
      console.error('Error getting metrics:', error);
      res.status(500).json({ error: 'Failed to get monitoring metrics' });
    }
  }

  /**
   * Start monitoring
   */
  async startMonitoring(req, res) {
    try {
      const { organizationId, configuration } = req.body;
      
      console.log('Starting monitoring for:', organizationId);
      console.log('Configuration:', configuration);
      
      // In production, this would start background jobs
      // For now, just acknowledge the request
      
      res.json({
        success: true,
        message: 'Monitoring started successfully',
        monitoringId: `mon-${Date.now()}`,
        status: 'active'
      });
    } catch (error) {
      console.error('Error starting monitoring:', error);
      res.status(500).json({ error: 'Failed to start monitoring' });
    }
  }

  /**
   * Stop monitoring
   */
  async stopMonitoring(req, res) {
    try {
      const { organizationId } = req.params;
      
      res.json({
        success: true,
        message: 'Monitoring stopped successfully',
        status: 'inactive'
      });
    } catch (error) {
      console.error('Error stopping monitoring:', error);
      res.status(500).json({ error: 'Failed to stop monitoring' });
    }
  }

  /**
   * Create a new target
   */
  async createTarget(req, res) {
    try {
      const targetData = req.body;
      
      // In production, save to database
      // For now, return mock response
      const newTarget = {
        id: Date.now(),
        ...targetData,
        createdAt: new Date().toISOString()
      };
      
      res.json({
        success: true,
        target: newTarget
      });
    } catch (error) {
      console.error('Error creating target:', error);
      res.status(500).json({ error: 'Failed to create target' });
    }
  }

  /**
   * Fetch real-time data helper method (moved from original file)
        status = {
          monitoring: false,
          active_targets: 0,
          active_sources: 0,
          findings_24h: 0,
          opportunities_24h: 0,
          health: 100,
          last_scan: new Date().toISOString()
        };
      }
      
      res.json(status);
    } catch (error) {
      console.error('Error getting monitoring status:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get monitoring status' 
      });
    }
  }

  /**
   * Get intelligence targets for an organization
   */
  async getOrganizationTargets(req, res) {
    try {
      const { organizationId } = req.params;
      const { active } = req.query;
      
      // Build query based on filters
      let query = 'SELECT t.*, COUNT(f.id) as findings_count, AVG(f.sentiment_score) as avg_sentiment FROM intelligence_targets t LEFT JOIN intelligence_findings f ON t.id = f.target_id WHERE t.organization_id = $1';
      const params = [organizationId || 'org-default']; // Use default org if not specified
      
      if (active === 'true') {
        query += ' AND t.active = true';
      }
      
      query += ' GROUP BY t.id ORDER BY t.created_at DESC';
      
      const result = await pool.query(query, params);
      
      // Format the results
      const targets = result.rows.map(row => ({
        id: row.id,
        organization_id: row.organization_id,
        name: row.name,
        type: row.type,
        priority: row.priority,
        keywords: row.keywords || [],
        topics: row.topics || [],
        active: row.active,
        findings_count: parseInt(row.findings_count) || 0,
        avg_sentiment: parseFloat(row.avg_sentiment) || 0,
        threat_level: row.type === 'competitor' ? 70 : 50, // Calculate based on sentiment/activity
        created_at: row.created_at
      }));
      
      res.json(targets);
    } catch (error) {
      console.error('Error getting organization targets:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get organization targets' 
      });
    }
  }

  /**
   * Create a new intelligence target
   */
  async createTarget(req, res) {
    try {
      const {
        organization_id,
        name,
        type,
        priority = 'medium',
        keywords = [],
        topics = [],
        sources = [],
        description,
        active = true
      } = req.body;
      
      const result = await pool.query(
        `INSERT INTO intelligence_targets 
         (organization_id, name, type, priority, keywords, topics, sources, description, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [organization_id, name, type, priority, keywords, topics, sources, description, active]
      );
      
      // Update monitoring status
      await pool.query(
        `UPDATE monitoring_status 
         SET active_targets = active_targets + 1, updated_at = NOW()
         WHERE organization_id = $1`,
        [organization_id]
      );
      
      // Create status if doesn't exist
      await pool.query(
        `INSERT INTO monitoring_status (organization_id, monitoring, active_targets, active_sources)
         VALUES ($1, true, 1, 0)
         ON CONFLICT (organization_id) DO NOTHING`,
        [organization_id]
      );
      
      res.status(201).json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error creating target:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to create target' 
      });
    }
  }

  /**
   * Fetch real-time data from RSS and News sources
   */
  async fetchRealTimeData(organizationId) {
    try {
      // Get targets for this organization
      const targetsResult = await pool.query(
        'SELECT * FROM intelligence_targets WHERE organization_id = $1 AND active = true',
        [organizationId || 'org-default']
      );
      
      const targets = targetsResult.rows;
      const parser = new Parser();
      const allFindings = [];
      
      // RSS Feeds to monitor - use working feeds
      const feeds = [
        { name: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
        { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
        { name: 'VentureBeat', url: 'https://feeds.feedburner.com/venturebeat/SZYF' },
        { name: 'PR Newswire', url: 'https://www.prnewswire.com/rss/news-releases-list.rss' },
        { name: 'Business Wire', url: 'https://feed.businesswire.com/rss/home/?rss=G1QFDERJXkJeGVtXXQ==' }
      ];
      
      // Fetch from RSS feeds
      for (const feed of feeds) {
        try {
          console.log(`📡 Fetching RSS feed: ${feed.name}`);
          const parsedFeed = await Promise.race([
            parser.parseURL(feed.url),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Feed timeout')), 10000)
            )
          ]);
          console.log(`✅ Parsed ${parsedFeed.items.length} items from ${feed.name}`);
          
          // Process each item
          for (const item of parsedFeed.items.slice(0, 5)) {
            const content = `${item.title || ''} ${item.contentSnippet || ''}`.toLowerCase();
            
            // Check against each target's keywords
            for (const target of targets) {
              const keywords = target.keywords || [];
              if (keywords.some(keyword => content.includes(keyword.toLowerCase()))) {
                // Simple sentiment analysis
                let sentiment = 0;
                const negativeWords = ['crisis', 'fail', 'loss', 'decline', 'problem', 'issue', 'concern'];
                const positiveWords = ['success', 'growth', 'win', 'partnership', 'innovation', 'launch', 'expand'];
                const contentLower = content.toLowerCase();
                
                negativeWords.forEach(word => {
                  if (contentLower.includes(word)) sentiment -= 0.2;
                });
                positiveWords.forEach(word => {
                  if (contentLower.includes(word)) sentiment += 0.2;
                });
                
                sentiment = Math.max(-1, Math.min(1, sentiment));
                
                const finding = {
                  target_id: target.id,
                  organization_id: organizationId,
                  title: item.title,
                  content: item.contentSnippet || item.content,
                  source: feed.name,
                  url: item.link,
                  sentiment_score: sentiment,
                  relevance_score: 0.7,
                  published_at: new Date(item.pubDate || Date.now())
                };
                
                // Save to database
                await pool.query(
                  `INSERT INTO intelligence_findings 
                   (target_id, organization_id, title, content, source, url, sentiment_score, relevance_score, published_at)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                   ON CONFLICT DO NOTHING`,
                  [finding.target_id, finding.organization_id, finding.title, finding.content, 
                   finding.source, finding.url, finding.sentiment_score, finding.relevance_score, finding.published_at]
                );
                
                allFindings.push(finding);
              }
            }
          }
        } catch (err) {
          console.error(`Failed to fetch ${feed.name}:`, err.message);
        }
      }
      
      // Fetch from NewsAPI if configured
      if (process.env.NEWS_API_KEY) {
        for (const target of targets) {
          try {
            const newsResponse = await axios.get('https://newsapi.org/v2/everything', {
              params: {
                apiKey: process.env.NEWS_API_KEY,
                q: target.keywords[0],
                sortBy: 'publishedAt',
                pageSize: 5,
                language: 'en'
              }
            });
            
            for (const article of newsResponse.data.articles || []) {
              const finding = {
                target_id: target.id,
                organization_id: organizationId,
                title: article.title,
                content: article.description,
                source: article.source.name,
                url: article.url,
                sentiment_score: 0,
                relevance_score: 0.8,
                published_at: new Date(article.publishedAt)
              };
              
              // Save to database
              await pool.query(
                `INSERT INTO intelligence_findings 
                 (target_id, organization_id, title, content, source, url, sentiment_score, relevance_score, published_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 ON CONFLICT DO NOTHING`,
                [finding.target_id, finding.organization_id, finding.title, finding.content, 
                 finding.source, finding.url, finding.sentiment_score, finding.relevance_score, finding.published_at]
              );
              
              allFindings.push(finding);
            }
          } catch (err) {
            console.error(`Failed to fetch news for ${target.name}:`, err.message);
          }
        }
      }
      
      return allFindings;
    } catch (error) {
      console.error('Error fetching real-time data:', error);
      return [];
    }
  }
  
  /**
   * Get intelligence findings
   */
  async getFindings(req, res) {
    try {
      const { organizationId, limit = 20 } = req.query;
      
      // First, try to fetch fresh data
      await this.fetchRealTimeData(organizationId);
      
      // Then get findings from database
      const findingsQuery = await pool.query(
        `SELECT f.*, t.name as target_name 
         FROM intelligence_findings f
         JOIN intelligence_targets t ON f.target_id = t.id
         WHERE f.organization_id = $1
         ORDER BY f.published_at DESC
         LIMIT $2`,
        [organizationId || 'org-default', parseInt(limit)]
      );
      
      if (findingsQuery.rows.length > 0) {
        res.json(findingsQuery.rows);
      } else {
        // Return mock findings if no real data
        const findings = [
        {
          id: 'finding-1',
          target_id: 'target-1',
          target_name: 'Microsoft',
          title: 'Microsoft announces new AI features in Azure',
          content: 'Microsoft has unveiled several new artificial intelligence capabilities...',
          source: 'TechCrunch',
          url: 'https://techcrunch.com/example',
          sentiment_score: 0.3,
          relevance_score: 0.85,
          published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString()
        },
        {
          id: 'finding-2',
          target_id: 'target-2',
          target_name: 'AI Regulation',
          title: 'EU proposes stricter AI regulations',
          content: 'The European Union has proposed new regulations that would...',
          source: 'Reuters',
          url: 'https://reuters.com/example',
          sentiment_score: -0.2,
          relevance_score: 0.92,
          published_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString()
        },
        {
          id: 'finding-3',
          target_id: 'target-3',
          target_name: 'Google',
          title: 'Google Cloud partners with major enterprise',
          content: 'Google Cloud announced a strategic partnership with...',
          source: 'Business Wire',
          url: 'https://businesswire.com/example',
          sentiment_score: 0.4,
          relevance_score: 0.78,
          published_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString()
        }
      ];
      
      // Limit results
      const limitedFindings = findings.slice(0, parseInt(limit));
      
      res.json(limitedFindings);
      }
    } catch (error) {
      console.error('Error getting findings:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get findings' 
      });
    }
  }

  /**
   * Get opportunities for an organization
   */
  async getOpportunities(req, res) {
    try {
      const { organizationId } = req.params;
      const { status = 'identified', limit = 10 } = req.query;
      
      // Mock opportunities data - replace with actual database queries
      const opportunities = [
        {
          id: 'opp-1',
          organization_id: organizationId,
          title: 'Competitive positioning opportunity',
          description: 'Microsoft facing criticism on pricing - opportunity to highlight our value proposition',
          opportunity_type: 'competitive',
          nvs_score: 78,
          urgency: 'high',
          status: 'identified',
          recommended_actions: JSON.stringify([
            'Prepare comparison content',
            'Reach out to industry analysts',
            'Update sales materials'
          ]),
          created_at: new Date().toISOString()
        },
        {
          id: 'opp-2',
          organization_id: organizationId,
          title: 'Thought leadership opportunity',
          description: 'AI regulation discussion heating up - position as responsible AI leader',
          opportunity_type: 'thought_leadership',
          nvs_score: 65,
          urgency: 'medium',
          status: 'identified',
          recommended_actions: JSON.stringify([
            'Draft position paper',
            'Schedule executive interviews',
            'Organize webinar'
          ]),
          created_at: new Date().toISOString()
        }
      ];
      
      // Filter by status
      const filteredOpportunities = opportunities
        .filter(o => o.status === status)
        .slice(0, parseInt(limit));
      
      res.json(filteredOpportunities);
    } catch (error) {
      console.error('Error getting opportunities:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get opportunities' 
      });
    }
  }

  /**
   * Get monitoring metrics
   */
  async getMonitoringMetrics(req, res) {
    try {
      const { organizationId } = req.params;
      const { days = 7 } = req.query;
      
      // Mock metrics data - replace with actual database queries
      const metrics = {
        organization_id: organizationId,
        period_days: parseInt(days),
        total_findings: 156,
        total_opportunities: 12,
        sentiment_trend: 0.15,
        top_topics: ['AI', 'cloud computing', 'enterprise software'],
        alert_count: 3,
        source_health: {
          active: 12,
          failing: 1,
          total: 13
        },
        daily_findings: [
          { date: '2024-01-01', count: 22 },
          { date: '2024-01-02', count: 18 },
          { date: '2024-01-03', count: 25 },
          { date: '2024-01-04', count: 20 },
          { date: '2024-01-05', count: 23 },
          { date: '2024-01-06', count: 19 },
          { date: '2024-01-07', count: 29 }
        ]
      };
      
      res.json(metrics);
    } catch (error) {
      console.error('Error getting monitoring metrics:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get monitoring metrics' 
      });
    }
  }

  /**
   * Start monitoring for an organization
   */
  async startMonitoring(req, res) {
    try {
      const { organizationId, targetIds } = req.body;
      
      // Mock response - replace with actual monitoring logic
      res.json({
        success: true,
        message: 'Monitoring started successfully',
        organization_id: organizationId,
        targets_activated: targetIds?.length || 'all'
      });
    } catch (error) {
      console.error('Error starting monitoring:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to start monitoring' 
      });
    }
  }

  /**
   * Trigger manual monitoring scan
   */
  async triggerMonitoring(req, res) {
    try {
      const { organizationId } = req.body;
      
      console.log('🔄 Triggering monitoring scan for:', organizationId);
      
      // Fetch real-time data
      const findings = await this.fetchRealTimeData(organizationId || 'org-default');
      
      console.log(`✅ Gathered ${findings.length} findings`);
      
      // Analyze findings for opportunities
      const opportunities = await this.identifyOpportunities(organizationId, findings);
      console.log(`🎯 Identified ${opportunities.length} opportunities`);
      
      // Update monitoring status with actual counts
      await pool.query(
        `INSERT INTO monitoring_status (organization_id, monitoring, active_targets, active_sources, health, last_scan)
         VALUES ($1, true, 
           (SELECT COUNT(*) FROM intelligence_targets WHERE organization_id = $1 AND active = true),
           15, 'good', NOW())
         ON CONFLICT (organization_id) DO UPDATE SET
           monitoring = true,
           active_targets = EXCLUDED.active_targets,
           last_scan = NOW(),
           updated_at = NOW()`,
        [organizationId || 'org-default']
      );
      
      res.json({
        success: true,
        message: 'Monitoring scan completed',
        organization_id: organizationId,
        findings_count: findings.length,
        opportunities_count: opportunities.length,
        scan_id: `scan-${Date.now()}`,
        completed_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error triggering monitoring:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to trigger monitoring' 
      });
    }
  }

  /**
   * Identify opportunities from findings (internal method)
   */
  async identifyOpportunities(organizationId, findings) {
    try {
      const opportunities = [];
      
      // Pattern matching for opportunity detection
      for (const finding of findings) {
        const content = `${finding.title} ${finding.content}`.toLowerCase();
        
        // Competitor stumble detection
        if (finding.sentiment_score < -0.3 && finding.target_id) {
          opportunities.push({
            type: 'competitor_stumble',
            title: `Competitor Challenge: ${finding.title}`,
            description: 'Competitor facing challenges - opportunity to differentiate',
            confidence: 0.75,
            source: finding.source,
            finding_id: finding.id
          });
        }
        
        // Market trend detection
        if (content.includes('trend') || content.includes('growth') || content.includes('demand')) {
          opportunities.push({
            type: 'market_trend',
            title: `Market Trend: ${finding.title}`,
            description: 'Emerging market trend detected',
            confidence: 0.65,
            source: finding.source,
            finding_id: finding.id
          });
        }
        
        // Partnership opportunities
        if (content.includes('partnership') || content.includes('collaboration') || content.includes('joint')) {
          opportunities.push({
            type: 'partnership',
            title: `Partnership Opportunity: ${finding.title}`,
            description: 'Potential partnership or collaboration opportunity',
            confidence: 0.70,
            source: finding.source,
            finding_id: finding.id
          });
        }
      }
      
      // Save opportunities to database
      for (const opp of opportunities) {
        await pool.query(
          `INSERT INTO intelligence_opportunities 
           (organization_id, type, title, description, confidence_score, status, metadata)
           VALUES ($1, $2, $3, $4, $5, 'identified', $6)
           ON CONFLICT DO NOTHING`,
          [organizationId, opp.type, opp.title, opp.description, opp.confidence, 
           JSON.stringify({ source: opp.source, finding_id: opp.finding_id })]
        );
      }
      
      return opportunities;
    } catch (error) {
      console.error('Error identifying opportunities:', error);
      return [];
    }
  }

  /**
   * Update opportunity status
   */
  async updateOpportunityStatus(req, res) {
    try {
      const { opportunityId } = req.params;
      const { status } = req.body;
      
      // Mock response - replace with actual database update
      res.json({
        success: true,
        message: `Opportunity ${opportunityId} status updated to ${status}`,
        opportunity_id: opportunityId,
        new_status: status
      });
    } catch (error) {
      console.error('Error updating opportunity status:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to update opportunity status' 
      });
    }
  }

  /**
   * Connect to real-time updates (WebSocket placeholder)
   */
  connectToRealtime(req, res) {
    // This would typically be handled by WebSocket
    // For now, return connection details
    res.json({
      success: true,
      message: 'Real-time connection details',
      websocket_url: `ws://localhost:5001/ws/${req.params.organizationId}`,
      note: 'WebSocket implementation pending'
    });
  }
}

module.exports = new IntelligenceMonitoringController();