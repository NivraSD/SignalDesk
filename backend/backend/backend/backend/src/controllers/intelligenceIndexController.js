const pool = require('../config/db');

class IntelligenceIndexController {
  // Get all industries
  async getIndustries(req, res) {
    try {
      const result = await pool.query(
        `SELECT * FROM industries ORDER BY market_size_billions DESC`
      );
      
      res.json({
        success: true,
        industries: result.rows,
        count: result.rows.length
      });
    } catch (error) {
      console.error('Error fetching industries:', error);
      res.status(500).json({ error: 'Failed to fetch industries' });
    }
  }

  // Get companies by industry
  async getCompaniesByIndustry(req, res) {
    try {
      const { industryId } = req.params;
      
      const result = await pool.query(
        `SELECT c.*, i.name as industry_name
         FROM companies c
         JOIN industries i ON c.industry_id = i.id
         WHERE c.industry_id = $1
         ORDER BY c.ranking_in_industry`,
        [industryId]
      );
      
      res.json({
        success: true,
        companies: result.rows,
        count: result.rows.length
      });
    } catch (error) {
      console.error('Error fetching companies:', error);
      res.status(500).json({ error: 'Failed to fetch companies' });
    }
  }

  // Get topics by industry
  async getTopicsByIndustry(req, res) {
    try {
      const { industryId } = req.params;
      
      const result = await pool.query(
        `SELECT t.*, i.name as industry_name
         FROM industry_topics t
         JOIN industries i ON t.industry_id = i.id
         WHERE t.industry_id = $1
         ORDER BY t.relevance_score DESC`,
        [industryId]
      );
      
      res.json({
        success: true,
        topics: result.rows,
        count: result.rows.length
      });
    } catch (error) {
      console.error('Error fetching topics:', error);
      res.status(500).json({ error: 'Failed to fetch topics' });
    }
  }

  // Get sources by industry
  async getSourcesByIndustry(req, res) {
    try {
      const { industryId } = req.params;
      
      const result = await pool.query(
        `SELECT s.*, ins.relevance_score, ins.coverage_areas
         FROM intelligence_sources s
         JOIN industry_sources ins ON s.id = ins.source_id
         WHERE ins.industry_id = $1
         ORDER BY ins.relevance_score DESC`,
        [industryId]
      );
      
      res.json({
        success: true,
        sources: result.rows,
        count: result.rows.length
      });
    } catch (error) {
      console.error('Error fetching sources:', error);
      res.status(500).json({ error: 'Failed to fetch sources' });
    }
  }

  // Get complete intelligence profile for an industry
  async getIndustryProfile(req, res) {
    try {
      const { industryId } = req.params;
      
      // Get industry details
      const industryResult = await pool.query(
        `SELECT * FROM industries WHERE id = $1`,
        [industryId]
      );
      
      if (industryResult.rows.length === 0) {
        return res.status(404).json({ error: 'Industry not found' });
      }
      
      // Get companies
      const companiesResult = await pool.query(
        `SELECT * FROM companies 
         WHERE industry_id = $1 
         ORDER BY ranking_in_industry 
         LIMIT 15`,
        [industryId]
      );
      
      // Get topics
      const topicsResult = await pool.query(
        `SELECT * FROM industry_topics 
         WHERE industry_id = $1 
         ORDER BY relevance_score DESC 
         LIMIT 15`,
        [industryId]
      );
      
      // Get sources
      const sourcesResult = await pool.query(
        `SELECT s.*, ins.relevance_score, ins.coverage_areas
         FROM intelligence_sources s
         JOIN industry_sources ins ON s.id = ins.source_id
         WHERE ins.industry_id = $1
         ORDER BY ins.relevance_score DESC`,
        [industryId]
      );
      
      res.json({
        success: true,
        industry: industryResult.rows[0],
        companies: companiesResult.rows,
        topics: topicsResult.rows,
        sources: sourcesResult.rows
      });
    } catch (error) {
      console.error('Error fetching industry profile:', error);
      res.status(500).json({ error: 'Failed to fetch industry profile' });
    }
  }

  // Search companies across all industries
  async searchCompanies(req, res) {
    try {
      const { query } = req.query;
      
      const result = await pool.query(
        `SELECT c.*, i.name as industry_name
         FROM companies c
         JOIN industries i ON c.industry_id = i.id
         WHERE c.name ILIKE $1
         ORDER BY c.market_cap_billions DESC NULLS LAST
         LIMIT 20`,
        [`%${query}%`]
      );
      
      res.json({
        success: true,
        companies: result.rows,
        count: result.rows.length
      });
    } catch (error) {
      console.error('Error searching companies:', error);
      res.status(500).json({ error: 'Failed to search companies' });
    }
  }

  // Get trending topics across all industries
  async getTrendingTopics(req, res) {
    try {
      const result = await pool.query(
        `SELECT t.*, i.name as industry_name
         FROM industry_topics t
         JOIN industries i ON t.industry_id = i.id
         WHERE t.is_trending = true
         ORDER BY t.relevance_score DESC
         LIMIT 50`
      );
      
      res.json({
        success: true,
        topics: result.rows,
        count: result.rows.length
      });
    } catch (error) {
      console.error('Error fetching trending topics:', error);
      res.status(500).json({ error: 'Failed to fetch trending topics' });
    }
  }

  // Auto-configure sources based on company selection
  async autoConfigureSources(req, res) {
    try {
      const { companyName, industryName } = req.body;
      
      // Find the company and its industry
      let industryId;
      let companyData;
      
      if (companyName) {
        const companyResult = await pool.query(
          `SELECT c.*, i.id as industry_id, i.name as industry_name
           FROM companies c
           JOIN industries i ON c.industry_id = i.id
           WHERE c.name ILIKE $1
           LIMIT 1`,
          [`%${companyName}%`]
        );
        
        if (companyResult.rows.length > 0) {
          companyData = companyResult.rows[0];
          industryId = companyData.industry_id;
        }
      }
      
      if (!industryId && industryName) {
        const industryResult = await pool.query(
          `SELECT id FROM industries WHERE name ILIKE $1 LIMIT 1`,
          [`%${industryName}%`]
        );
        
        if (industryResult.rows.length > 0) {
          industryId = industryResult.rows[0].id;
        }
      }
      
      if (!industryId) {
        return res.status(404).json({ error: 'Industry not found' });
      }
      
      // Get relevant competitors
      const competitorsResult = await pool.query(
        `SELECT * FROM companies 
         WHERE industry_id = $1 
         ORDER BY ranking_in_industry 
         LIMIT 5`,
        [industryId]
      );
      
      // Get relevant topics
      const topicsResult = await pool.query(
        `SELECT * FROM industry_topics 
         WHERE industry_id = $1 AND relevance_score >= 0.8
         ORDER BY relevance_score DESC 
         LIMIT 10`,
        [industryId]
      );
      
      // Get best sources
      const sourcesResult = await pool.query(
        `SELECT s.*, ins.relevance_score, ins.coverage_areas
         FROM intelligence_sources s
         JOIN industry_sources ins ON s.id = ins.source_id
         WHERE ins.industry_id = $1 AND ins.relevance_score >= 0.85
         ORDER BY ins.relevance_score DESC
         LIMIT 10`,
        [industryId]
      );
      
      // Build configuration
      const configuration = {
        industry: industryId,
        company: companyData || { name: companyName },
        competitors: competitorsResult.rows.map(c => ({
          name: c.name,
          type: 'competitor',
          priority: 'high',
          keywords: [c.name, c.ticker_symbol].filter(Boolean),
          sources: sourcesResult.rows.slice(0, 5)
        })),
        topics: topicsResult.rows.map(t => ({
          name: t.topic_name,
          type: 'topic',
          priority: t.relevance_score >= 0.9 ? 'critical' : 'high',
          keywords: t.keywords || [t.topic_name],
          sources: sourcesResult.rows.filter(s => 
            t.topic_category === 'regulation' ? s.source_type === 'regulatory' : true
          ).slice(0, 5)
        })),
        sources: sourcesResult.rows
      };
      
      res.json({
        success: true,
        configuration: configuration,
        message: `Auto-configured monitoring for ${companyData?.name || companyName} in ${companyData?.industry_name || 'selected industry'}`
      });
    } catch (error) {
      console.error('Error auto-configuring sources:', error);
      res.status(500).json({ error: 'Failed to auto-configure sources' });
    }
  }

  // Get intelligence suggestions based on company/industry
  async getIntelligenceSuggestions(req, res) {
    try {
      const { company, industry } = req.query;
      
      let suggestions = {
        competitors: [],
        topics: [],
        sources: [],
        keywords: []
      };
      
      // Find industry
      let industryId;
      if (industry) {
        const industryResult = await pool.query(
          `SELECT id, name FROM industries WHERE name ILIKE $1 LIMIT 1`,
          [`%${industry}%`]
        );
        if (industryResult.rows.length > 0) {
          industryId = industryResult.rows[0].id;
        }
      }
      
      // If company provided, find its industry
      if (company && !industryId) {
        const companyResult = await pool.query(
          `SELECT industry_id FROM companies WHERE name ILIKE $1 LIMIT 1`,
          [`%${company}%`]
        );
        if (companyResult.rows.length > 0) {
          industryId = companyResult.rows[0].industry_id;
        }
      }
      
      if (industryId) {
        // Get competitor suggestions
        const competitorsResult = await pool.query(
          `SELECT name, ticker_symbol, market_cap_billions 
           FROM companies 
           WHERE industry_id = $1 
           ORDER BY ranking_in_industry 
           LIMIT 10`,
          [industryId]
        );
        suggestions.competitors = competitorsResult.rows;
        
        // Get topic suggestions
        const topicsResult = await pool.query(
          `SELECT topic_name, topic_category, relevance_score, is_trending, keywords
           FROM industry_topics 
           WHERE industry_id = $1 
           ORDER BY relevance_score DESC 
           LIMIT 10`,
          [industryId]
        );
        suggestions.topics = topicsResult.rows;
        
        // Get source suggestions
        const sourcesResult = await pool.query(
          `SELECT s.source_name, s.source_url, s.source_type, s.rss_feed_url, ins.relevance_score
           FROM intelligence_sources s
           JOIN industry_sources ins ON s.id = ins.source_id
           WHERE ins.industry_id = $1
           ORDER BY ins.relevance_score DESC
           LIMIT 10`,
          [industryId]
        );
        suggestions.sources = sourcesResult.rows;
        
        // Compile keywords
        const keywords = new Set();
        suggestions.competitors.forEach(c => {
          keywords.add(c.name);
          if (c.ticker_symbol) keywords.add(c.ticker_symbol);
        });
        suggestions.topics.forEach(t => {
          if (t.keywords) {
            t.keywords.forEach(k => keywords.add(k));
          }
        });
        suggestions.keywords = Array.from(keywords);
      }
      
      res.json({
        success: true,
        suggestions: suggestions
      });
    } catch (error) {
      console.error('Error getting intelligence suggestions:', error);
      res.status(500).json({ error: 'Failed to get intelligence suggestions' });
    }
  }
}

module.exports = new IntelligenceIndexController();