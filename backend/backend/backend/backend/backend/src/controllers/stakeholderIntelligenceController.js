const pool = require('../config/db');
const axios = require('axios');
const apiConfig = require('../../config/apis');
const claudeService = require('../../config/claude');

class StakeholderIntelligenceController {
  // Create or update organization profile
  async createOrganization(req, res) {
    try {
      const { name, url, industry, type, strategicGoals } = req.body;
      
      const result = await pool.query(
        `INSERT INTO organizations (name, url, industry, type, strategic_goals) 
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (name) DO UPDATE SET 
         url = EXCLUDED.url, 
         industry = EXCLUDED.industry,
         type = EXCLUDED.type,
         strategic_goals = EXCLUDED.strategic_goals
         RETURNING id`,
        [name, url, industry, type, strategicGoals]
      );
      
      res.json({ 
        success: true, 
        organizationId: result.rows[0].id,
        message: 'Organization profile created/updated successfully'
      });
    } catch (error) {
      console.error('Error creating organization:', error);
      res.status(500).json({ error: 'Failed to create organization profile' });
    }
  }

  // Generate smart stakeholder suggestions using Claude
  async generateStakeholderSuggestions(req, res) {
    try {
      const { company, url, strategicGoals, priorityStakeholders } = req.body;
      
      // Use Claude to analyze the organization and suggest stakeholders
      const prompt = `Analyze this organization and suggest relevant stakeholders to monitor:
        Company: ${company}
        URL: ${url}
        Strategic Goals: ${strategicGoals}
        Priority Stakeholders: ${priorityStakeholders}
        
        For a company like this, suggest 5-7 specific stakeholders they should monitor.
        For each stakeholder, provide:
        1. Name (specific company/organization name if possible)
        2. Type (target_client, competitor, referral_partner, media_outlet, regulator, etc.)
        3. Priority (critical, high, medium, low)
        4. Reason why they matter
        5. Monitoring topics (what to track about them)
        
        If this is a PR/marketing agency targeting tech companies, focus on:
        - Specific tech companies as prospects
        - VCs as referral sources
        - Tech media outlets
        - Competing agencies
        
        Return as JSON array.`;

      const aiResponse = await claudeService.sendMessage(prompt);
      const suggestions = this.parseAIResponse(aiResponse);
      
      // Check which suggestions match our pre-indexed database
      const enhancedSuggestions = await this.enhanceWithPreIndexedData(suggestions);
      
      res.json({
        success: true,
        suggestions: enhancedSuggestions
      });
    } catch (error) {
      console.error('Error generating suggestions:', error);
      res.status(500).json({ error: 'Failed to generate stakeholder suggestions' });
    }
  }

  // Search for stakeholder sources using external APIs and pre-indexed database
  async discoverStakeholderSources(req, res) {
    try {
      const { stakeholderName, stakeholderType } = req.body;
      
      let sources = [];
      
      // First, check if we have pre-indexed sources for this stakeholder
      if (stakeholderType === 'competitor') {
        // Look up the company in our pre-indexed database
        const companyResult = await pool.query(
          `SELECT c.*, i.name as industry_name
           FROM companies c
           JOIN industries i ON c.industry_id = i.id
           WHERE c.name ILIKE $1
           LIMIT 1`,
          [`%${stakeholderName}%`]
        );
        
        if (companyResult.rows.length > 0) {
          const company = companyResult.rows[0];
          
          // Get industry sources
          const industrySourcesResult = await pool.query(
            `SELECT s.*, ins.relevance_score
             FROM intelligence_sources s
             JOIN industry_sources ins ON s.id = ins.source_id
             WHERE ins.industry_id = $1 AND s.is_active = true
             ORDER BY ins.relevance_score DESC
             LIMIT 10`,
            [company.industry_id]
          );
          
          sources = industrySourcesResult.rows.map(source => ({
            name: `${source.source_name} - ${company.industry_name}`,
            url: source.source_url,
            type: source.source_type,
            extractionMethod: source.content_type === 'articles' ? 'scraping' : source.source_type,
            description: `Pre-indexed source for ${company.industry_name} industry`,
            source: 'database',
            verified: source.is_verified,
            rss: source.rss_feed_url,
            relevance: source.relevance_score
          }));
        }
      } else if (stakeholderType === 'topic') {
        // Look up the topic in our pre-indexed database
        const topicResult = await pool.query(
          `SELECT t.*, i.name as industry_name
           FROM industry_topics t
           JOIN industries i ON t.industry_id = i.id
           WHERE t.topic_name ILIKE $1
           LIMIT 1`,
          [`%${stakeholderName}%`]
        );
        
        if (topicResult.rows.length > 0) {
          const topic = topicResult.rows[0];
          
          // Get relevant sources for this topic category
          const topicSourcesResult = await pool.query(
            `SELECT s.*
             FROM intelligence_sources s
             WHERE s.source_type = $1 AND s.is_active = true
             LIMIT 5`,
            [topic.topic_category === 'regulation' ? 'regulatory' : 'news']
          );
          
          sources = topicSourcesResult.rows.map(source => ({
            name: `${source.source_name} - ${topic.topic_name}`,
            url: source.source_url,
            type: source.source_type,
            extractionMethod: source.content_type === 'articles' ? 'scraping' : source.source_type,
            description: `Relevant for ${topic.topic_category} topics`,
            source: 'database',
            verified: source.is_verified,
            rss: source.rss_feed_url
          }));
        }
      }
      
      // If no pre-indexed sources found, use the API search
      if (sources.length === 0) {
        const controller = new StakeholderIntelligenceController();
        sources = await controller.searchAllAPIs(stakeholderName, stakeholderType);
      }
      
      res.json({
        success: true,
        sources: sources
      });
    } catch (error) {
      console.error('Error discovering sources:', error);
      res.status(500).json({ error: 'Failed to discover stakeholder sources' });
    }
  }

  // Search across Google, News API, and Twitter
  async searchAllAPIs(query, type) {
    const sources = [];
    
    // Check cache first
    const cached = await pool.query(
      `SELECT results FROM source_discovery_cache 
       WHERE query = $1 AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [query]
    );
    
    if (cached.rows && cached.rows.length > 0) {
      return JSON.parse(cached.rows[0].results);
    }
    
    // Google Custom Search for websites and profiles
    try {
      const googleResponse = await axios.get(apiConfig.googleCustomSearch.baseUrl, {
        params: {
          key: apiConfig.googleCustomSearch.apiKey,
          cx: apiConfig.googleCustomSearch.searchEngineId,
          q: `${query} official website news press releases`,
          num: 5
        }
      });
      
      if (googleResponse.data.items) {
        googleResponse.data.items.forEach(item => {
          sources.push({
            name: item.title,
            url: item.link,
            type: 'web',
            extractionMethod: 'scraping',
            description: item.snippet,
            source: 'google',
            verified: item.link.includes('https')
          });
        });
      }
    } catch (error) {
      console.error('Google search error:', error.message);
    }
    
    // News API for news coverage
    try {
      const newsResponse = await axios.get(`${apiConfig.newsApi.baseUrl}/everything`, {
        params: {
          apiKey: apiConfig.newsApi.apiKey,
          q: query,
          sortBy: 'relevancy',
          pageSize: 5,
          language: 'en'
        }
      });
      
      if (newsResponse.data.articles) {
        newsResponse.data.articles.forEach(article => {
          sources.push({
            name: `${article.source.name} - News Coverage`,
            url: article.url,
            type: 'news',
            extractionMethod: 'api',
            description: article.description,
            source: 'news_api',
            verified: true
          });
        });
      }
    } catch (error) {
      console.error('News API error:', error.message);
    }
    
    // Search for RSS feeds
    try {
      const rssSearchResponse = await axios.get(apiConfig.googleCustomSearch.baseUrl, {
        params: {
          key: apiConfig.googleCustomSearch.apiKey,
          cx: apiConfig.googleCustomSearch.searchEngineId,
          q: `${query} RSS feed news blog`,
          num: 3
        }
      });
      
      if (rssSearchResponse.data.items) {
        rssSearchResponse.data.items.forEach(item => {
          if (item.link.includes('rss') || item.link.includes('feed') || item.link.includes('xml')) {
            sources.push({
              name: `${item.title} (RSS)`,
              url: item.link,
              type: 'rss',
              extractionMethod: 'rss',
              description: 'RSS Feed',
              source: 'google',
              verified: false
            });
          }
        });
      }
    } catch (error) {
      console.error('RSS search error:', error.message);
    }
    
    // Cache the results
    await pool.query(
      `INSERT INTO source_discovery_cache (query, api_source, results, expires_at)
       VALUES ($1, 'combined', $2, NOW() + INTERVAL '24 hours')`,
      [query, JSON.stringify(sources)]
    );
    
    return sources;
  }

  // Validate a source URL
  async validateSource(req, res) {
    try {
      const { url } = req.body;
      
      // Try to fetch the URL
      const response = await axios.head(url, { 
        timeout: 5000,
        validateStatus: (status) => status < 500 
      });
      
      const isValid = response.status < 400;
      const isRSS = url.includes('.xml') || url.includes('rss') || url.includes('feed');
      
      res.json({
        success: true,
        valid: isValid,
        status: response.status,
        type: isRSS ? 'rss' : 'web',
        headers: response.headers
      });
    } catch (error) {
      res.json({
        success: false,
        valid: false,
        error: error.message
      });
    }
  }

  // Save stakeholder configuration
  async saveStakeholderConfiguration(req, res) {
    try {
      const { organizationId, stakeholders } = req.body;
      
      for (const stakeholder of stakeholders) {
        // Insert stakeholder group
        const groupResult = await pool.query(
          `INSERT INTO stakeholder_groups 
           (organization_id, name, type, priority, reason, influence, is_pre_indexed)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
          [
            organizationId,
            stakeholder.name,
            stakeholder.type,
            stakeholder.priority,
            stakeholder.reason,
            stakeholder.influence || 7,
            stakeholder.preIndexed || false
          ]
        );
        
        const groupId = groupResult.rows[0].id;
        
        // Insert monitoring topics
        if (stakeholder.monitoringTopics && stakeholder.monitoringTopics.length > 0) {
          for (const topic of stakeholder.monitoringTopics) {
            await pool.query(
              `INSERT INTO stakeholder_monitoring_topics 
               (stakeholder_group_id, topic, category)
               VALUES ($1, $2, $3)`,
              [groupId, topic, stakeholder.type]
            );
          }
        }
        
        // Insert sources
        if (stakeholder.sources && stakeholder.sources.length > 0) {
          for (const source of stakeholder.sources) {
            await pool.query(
              `INSERT INTO stakeholder_sources 
               (stakeholder_group_id, name, url, type, extraction_method, rss_feed_url, is_verified)
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [
                groupId,
                source.name,
                source.url,
                source.type,
                source.extractionMethod,
                source.rss || null,
                source.verified || false
              ]
            );
          }
        }
      }
      
      res.json({
        success: true,
        message: 'Stakeholder configuration saved successfully'
      });
    } catch (error) {
      console.error('Error saving configuration:', error);
      res.status(500).json({ error: 'Failed to save stakeholder configuration' });
    }
  }

  // Get stakeholder monitoring data
  async getStakeholderMonitoring(req, res) {
    try {
      const { organizationId } = req.params;
      
      // Get all stakeholder groups with their sources and topics
      const groups = await pool.query(
        `SELECT sg.*, 
                COUNT(DISTINCT ss.id) as source_count,
                COUNT(DISTINCT smt.id) as topic_count,
                COUNT(DISTINCT if.id) as finding_count
         FROM stakeholder_groups sg
         LEFT JOIN stakeholder_sources ss ON sg.id = ss.stakeholder_group_id
         LEFT JOIN stakeholder_monitoring_topics smt ON sg.id = smt.stakeholder_group_id
         LEFT JOIN intelligence_findings if ON sg.id = if.stakeholder_group_id
         WHERE sg.organization_id = $1
         GROUP BY sg.id
         ORDER BY sg.priority DESC`,
        [organizationId]
      );
      
      // Get recent findings
      const findings = await pool.query(
        `SELECT if.*, sg.name as stakeholder_name
         FROM intelligence_findings if
         JOIN stakeholder_groups sg ON if.stakeholder_group_id = sg.id
         WHERE sg.organization_id = $1 AND if.is_archived = FALSE
         ORDER BY if.discovered_at DESC
         LIMIT 50`,
        [organizationId]
      );
      
      // Get active predictions
      const predictions = await pool.query(
        `SELECT sp.*, sg.name as stakeholder_name
         FROM stakeholder_predictions sp
         JOIN stakeholder_groups sg ON sp.stakeholder_group_id = sg.id
         WHERE sg.organization_id = $1 AND sp.is_active = TRUE
         ORDER BY sp.confidence_score DESC`,
        [organizationId]
      );
      
      res.json({
        success: true,
        stakeholders: groups.rows,
        findings: findings.rows,
        predictions: predictions.rows
      });
    } catch (error) {
      console.error('Error getting monitoring data:', error);
      res.status(500).json({ error: 'Failed to get monitoring data' });
    }
  }

  // Run monitoring scan for active sources
  async runMonitoringScan(req, res) {
    try {
      const { organizationId } = req.body;
      
      // Get all active sources that need checking
      const sources = await pool.query(
        `SELECT ss.*, sg.name as stakeholder_name, sg.id as group_id
         FROM stakeholder_sources ss
         JOIN stakeholder_groups sg ON ss.stakeholder_group_id = sg.id
         WHERE sg.organization_id = $1 
           AND ss.is_active = TRUE
           AND (ss.last_checked IS NULL 
                OR ss.last_checked + INTERVAL '1 hour' * ss.check_frequency_hours < NOW())
         LIMIT 20`,
        [organizationId]
      );
      
      const findings = [];
      
      for (const source of sources.rows) {
        try {
          if (source.type === 'rss' && source.rss_feed_url) {
            // Fetch RSS feed
            const feedData = await this.fetchRSSFeed(source.rss_feed_url);
            findings.push(...this.processRSSItems(feedData, source));
          } else if (source.type === 'news') {
            // Use News API
            const newsData = await this.fetchNewsForStakeholder(source.stakeholder_name);
            findings.push(...this.processNewsItems(newsData, source));
          }
          
          // Update last checked timestamp
          await pool.query(
            `UPDATE stakeholder_sources SET last_checked = NOW() WHERE id = $1`,
            [source.id]
          );
        } catch (error) {
          console.error(`Error checking source ${source.id}:`, error.message);
        }
      }
      
      // Save findings to database
      for (const finding of findings) {
        await pool.query(
          `INSERT INTO intelligence_findings 
           (stakeholder_group_id, stakeholder_source_id, title, content, url, type, 
            sentiment_score, relevance_score, priority, published_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            finding.groupId,
            finding.sourceId,
            finding.title,
            finding.content,
            finding.url,
            finding.type,
            finding.sentiment,
            finding.relevance,
            finding.priority,
            finding.publishedAt
          ]
        );
      }
      
      res.json({
        success: true,
        sourcesChecked: sources.rows.length,
        findingsDiscovered: findings.length
      });
    } catch (error) {
      console.error('Error running monitoring scan:', error);
      res.status(500).json({ error: 'Failed to run monitoring scan' });
    }
  }

  // Helper methods
  parseAIResponse(response) {
    try {
      // Extract JSON from Claude's response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return [];
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return [];
    }
  }

  async enhanceWithPreIndexedData(suggestions) {
    const enhanced = [];
    
    for (const suggestion of suggestions) {
      // Check if this stakeholder exists in our pre-indexed database
      const preIndexed = await pool.query(
        `SELECT * FROM pre_indexed_stakeholders 
         WHERE name ILIKE $1 OR aliases::jsonb @> $2
         LIMIT 1`,
        [`%${suggestion.name}%`, JSON.stringify(suggestion.name)]
      );
      
      if (preIndexed.rows && preIndexed.rows.length > 0) {
        suggestion.preIndexed = true;
        suggestion.verifiedSources = JSON.parse(preIndexed.rows[0].verified_sources || '[]');
        suggestion.sourceCount = suggestion.verifiedSources.length;
      } else {
        suggestion.preIndexed = false;
        suggestion.sourceCount = 0;
      }
      
      enhanced.push(suggestion);
    }
    
    return enhanced;
  }

  async fetchRSSFeed(url) {
    // Implementation for RSS feed fetching
    // This would use an RSS parser library
    return [];
  }

  async fetchNewsForStakeholder(name) {
    try {
      const response = await axios.get(`${apiConfig.newsApi.baseUrl}/everything`, {
        params: {
          apiKey: apiConfig.newsApi.apiKey,
          q: name,
          sortBy: 'publishedAt',
          pageSize: 10
        }
      });
      return response.data.articles || [];
    } catch (error) {
      console.error('Error fetching news:', error.message);
      return [];
    }
  }

  processRSSItems(items, source) {
    return items.map(item => ({
      groupId: source.group_id,
      sourceId: source.id,
      title: item.title,
      content: item.description,
      url: item.link,
      type: 'news',
      sentiment: 0, // Would need sentiment analysis
      relevance: 0.7,
      priority: 'medium',
      publishedAt: item.pubDate
    }));
  }

  processNewsItems(articles, source) {
    return articles.map(article => ({
      groupId: source.group_id,
      sourceId: source.id,
      title: article.title,
      content: article.description,
      url: article.url,
      type: 'news',
      sentiment: 0, // Would need sentiment analysis
      relevance: 0.7,
      priority: 'medium',
      publishedAt: article.publishedAt
    }));
  }
}

module.exports = new StakeholderIntelligenceController();