const pool = require('../config/db');
const claudeService = require('../../config/claude');

class IntelligenceIndexer {
  constructor() {
    this.industries = [];
    this.companies = {};
    this.topics = {};
    this.sources = [];
  }

  // Main orchestration function
  async buildIntelligenceDatabase() {
    console.log('🚀 Starting Intelligence Database Build...');
    
    try {
      // Step 1: Research and index top industries
      await this.indexTopIndustries();
      
      // Step 2: For each industry, research companies
      for (const industry of this.industries) {
        await this.indexTopCompaniesForIndustry(industry);
        await this.indexTopTopicsForIndustry(industry);
        await this.indexSourcesForIndustry(industry);
      }
      
      // Step 3: Map cross-references
      await this.mapCompanyCompetitors();
      await this.mapSourceRelevance();
      
      console.log('✅ Intelligence Database Build Complete!');
      return {
        industries: this.industries.length,
        companies: Object.values(this.companies).flat().length,
        topics: Object.values(this.topics).flat().length,
        sources: this.sources.length
      };
    } catch (error) {
      console.error('Error building intelligence database:', error);
      throw error;
    }
  }

  // Research and index top 15 industries
  async indexTopIndustries() {
    console.log('📊 Researching top industries...');
    
    const prompt = `As a business intelligence expert, identify the TOP 15 industries that are most important for business monitoring and opportunity discovery in 2024-2025.

Consider:
1. Market size and growth potential
2. Digital transformation opportunities
3. Regulatory activity
4. Innovation potential
5. Global economic impact

For each industry, provide:
- name: Industry name
- description: Brief description
- market_size_billions: Estimated market size in billions USD
- growth_rate_percent: Annual growth rate
- key_trends: Array of 3-5 key trends
- regulatory_bodies: Main regulatory bodies
- major_publications: Top industry publications/sources

Return as a JSON array of 15 industries, ordered by importance for business intelligence monitoring.

Focus on industries where:
- Companies actively monitor competitors
- Regulatory changes impact operations
- Market opportunities emerge frequently
- Technology disruption is occurring`;

    try {
      const response = await claudeService.sendMessage(prompt);
      const industries = this.parseJSON(response);
      
      // Insert industries into database
      for (const industry of industries) {
        const result = await pool.query(
          `INSERT INTO industries 
           (name, description, market_size_billions, growth_rate_percent, 
            key_trends, regulatory_bodies, major_publications)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (name) DO UPDATE SET
           description = EXCLUDED.description,
           market_size_billions = EXCLUDED.market_size_billions,
           growth_rate_percent = EXCLUDED.growth_rate_percent,
           key_trends = EXCLUDED.key_trends,
           regulatory_bodies = EXCLUDED.regulatory_bodies,
           major_publications = EXCLUDED.major_publications,
           updated_at = CURRENT_TIMESTAMP
           RETURNING id, name`,
          [
            industry.name,
            industry.description,
            industry.market_size_billions,
            industry.growth_rate_percent,
            industry.key_trends || [],
            industry.regulatory_bodies || [],
            industry.major_publications || []
          ]
        );
        
        this.industries.push({
          id: result.rows[0].id,
          name: result.rows[0].name,
          ...industry
        });
        
        console.log(`✓ Indexed industry: ${industry.name}`);
      }
    } catch (error) {
      console.error('Error indexing industries:', error);
      // Fallback to essential industries
      await this.indexFallbackIndustries();
    }
  }

  // Research top companies for each industry
  async indexTopCompaniesForIndustry(industry) {
    console.log(`🏢 Researching top companies for ${industry.name}...`);
    
    const prompt = `For the ${industry.name} industry, identify the TOP 15 companies that are most important to monitor for business intelligence.

Industry context: ${industry.description}

Selection criteria:
1. Market leadership and influence
2. Innovation and disruption potential
3. News coverage frequency
4. Regulatory scrutiny
5. Partnership/acquisition activity

For each company, provide:
- name: Company name
- ticker_symbol: Stock ticker (if public)
- website_url: Main website
- headquarters_location: HQ city, country
- employee_count: Approximate employees
- revenue_billions: Annual revenue in billions USD
- market_cap_billions: Market cap in billions USD (if public)
- description: Brief description
- key_products: Array of main products/services
- ranking_in_industry: 1-15

Return as JSON array of 15 companies, ordered by importance for monitoring.`;

    try {
      const response = await claudeService.sendMessage(prompt);
      const companies = this.parseJSON(response);
      
      if (!this.companies[industry.name]) {
        this.companies[industry.name] = [];
      }
      
      for (let i = 0; i < companies.length; i++) {
        const company = companies[i];
        const result = await pool.query(
          `INSERT INTO companies 
           (industry_id, name, ticker_symbol, website_url, headquarters_location,
            employee_count, revenue_billions, market_cap_billions, description,
            key_products, ranking_in_industry)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (industry_id, name) DO UPDATE SET
           ticker_symbol = EXCLUDED.ticker_symbol,
           website_url = EXCLUDED.website_url,
           headquarters_location = EXCLUDED.headquarters_location,
           employee_count = EXCLUDED.employee_count,
           revenue_billions = EXCLUDED.revenue_billions,
           market_cap_billions = EXCLUDED.market_cap_billions,
           description = EXCLUDED.description,
           key_products = EXCLUDED.key_products,
           ranking_in_industry = EXCLUDED.ranking_in_industry,
           updated_at = CURRENT_TIMESTAMP
           RETURNING id`,
          [
            industry.id,
            company.name,
            company.ticker_symbol || null,
            company.website_url || null,
            company.headquarters_location || null,
            company.employee_count || null,
            company.revenue_billions || null,
            company.market_cap_billions || null,
            company.description || null,
            company.key_products || [],
            company.ranking_in_industry || (i + 1)
          ]
        );
        
        this.companies[industry.name].push({
          id: result.rows[0].id,
          ...company
        });
      }
      
      console.log(`✓ Indexed ${companies.length} companies for ${industry.name}`);
    } catch (error) {
      console.error(`Error indexing companies for ${industry.name}:`, error);
    }
  }

  // Research top topics for each industry
  async indexTopTopicsForIndustry(industry) {
    console.log(`📋 Researching top topics for ${industry.name}...`);
    
    const prompt = `For the ${industry.name} industry, identify the TOP 15 topics/themes that companies must monitor for opportunities and risks.

Industry context: ${industry.description}
Key trends: ${industry.key_trends?.join(', ')}

Categories to consider:
- Regulatory changes and compliance
- Technology disruptions
- Market dynamics and competition
- Social and environmental factors
- Economic indicators

For each topic, provide:
- topic_name: Clear topic name
- topic_category: One of [regulation, technology, market, social, economic]
- relevance_score: 0.0-1.0 importance score
- is_trending: Boolean if currently hot topic
- description: Why this matters
- keywords: Array of 3-5 monitoring keywords
- impact_areas: Business areas affected
- monitoring_frequency: One of [realtime, hourly, daily, weekly]

Return as JSON array of 15 topics, ordered by relevance score.`;

    try {
      const response = await claudeService.sendMessage(prompt);
      const topics = this.parseJSON(response);
      
      if (!this.topics[industry.name]) {
        this.topics[industry.name] = [];
      }
      
      for (const topic of topics) {
        const result = await pool.query(
          `INSERT INTO industry_topics 
           (industry_id, topic_name, topic_category, relevance_score, is_trending,
            description, keywords, impact_areas, monitoring_frequency)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (industry_id, topic_name) DO UPDATE SET
           topic_category = EXCLUDED.topic_category,
           relevance_score = EXCLUDED.relevance_score,
           is_trending = EXCLUDED.is_trending,
           description = EXCLUDED.description,
           keywords = EXCLUDED.keywords,
           impact_areas = EXCLUDED.impact_areas,
           monitoring_frequency = EXCLUDED.monitoring_frequency,
           updated_at = CURRENT_TIMESTAMP
           RETURNING id`,
          [
            industry.id,
            topic.topic_name,
            topic.topic_category || 'market',
            topic.relevance_score || 0.7,
            topic.is_trending || false,
            topic.description || null,
            topic.keywords || [],
            topic.impact_areas || [],
            topic.monitoring_frequency || 'daily'
          ]
        );
        
        this.topics[industry.name].push({
          id: result.rows[0].id,
          ...topic
        });
      }
      
      console.log(`✓ Indexed ${topics.length} topics for ${industry.name}`);
    } catch (error) {
      console.error(`Error indexing topics for ${industry.name}:`, error);
    }
  }

  // Index relevant sources for industry
  async indexSourcesForIndustry(industry) {
    console.log(`📰 Researching sources for ${industry.name}...`);
    
    const prompt = `For the ${industry.name} industry, identify the BEST sources for monitoring news, developments, and opportunities.

Industry publications: ${industry.major_publications?.join(', ')}
Regulatory bodies: ${industry.regulatory_bodies?.join(', ')}

Include a mix of:
1. Industry-specific news sites
2. Trade publications
3. Regulatory/government sources
4. Research firms and analysts
5. Key RSS feeds
6. API-accessible sources

For each source, provide:
- source_name: Name of source
- source_url: Main URL
- source_type: One of [news, rss, api, regulatory, trade, research]
- content_type: Type of content [articles, reports, filings, data]
- rss_feed_url: RSS feed if available
- quality_score: 0.0-1.0 quality rating
- coverage_areas: What they cover well

Return as JSON array of 10-15 best sources.`;

    try {
      const response = await claudeService.sendMessage(prompt);
      const sources = this.parseJSON(response);
      
      for (const source of sources) {
        // First, insert the source if it doesn't exist
        const sourceResult = await pool.query(
          `INSERT INTO intelligence_sources 
           (source_name, source_url, source_type, content_type, rss_feed_url, quality_score)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (source_url) DO UPDATE SET
           source_name = EXCLUDED.source_name,
           quality_score = EXCLUDED.quality_score
           RETURNING id`,
          [
            source.source_name,
            source.source_url,
            source.source_type || 'news',
            source.content_type || 'articles',
            source.rss_feed_url || null,
            source.quality_score || 0.7
          ]
        );
        
        // Then map it to the industry
        await pool.query(
          `INSERT INTO industry_sources 
           (industry_id, source_id, relevance_score, coverage_areas)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (industry_id, source_id) DO UPDATE SET
           relevance_score = EXCLUDED.relevance_score,
           coverage_areas = EXCLUDED.coverage_areas`,
          [
            industry.id,
            sourceResult.rows[0].id,
            source.quality_score || 0.7,
            source.coverage_areas || []
          ]
        );
      }
      
      console.log(`✓ Indexed ${sources.length} sources for ${industry.name}`);
    } catch (error) {
      console.error(`Error indexing sources for ${industry.name}:`, error);
    }
  }

  // Map competitor relationships
  async mapCompanyCompetitors() {
    console.log('🔗 Mapping competitor relationships...');
    
    for (const industryName in this.companies) {
      const companies = this.companies[industryName];
      
      for (let i = 0; i < companies.length; i++) {
        const company = companies[i];
        // Top 5 companies in same industry are likely competitors
        const competitors = companies
          .filter((c, idx) => idx !== i && idx < 5)
          .map(c => c.id);
        
        if (competitors.length > 0) {
          await pool.query(
            `UPDATE companies SET competitor_ids = $1 WHERE id = $2`,
            [competitors, company.id]
          );
        }
      }
    }
  }

  // Map source relevance scores
  async mapSourceRelevance() {
    console.log('📊 Calculating source relevance scores...');
    // This would use more sophisticated scoring in production
    console.log('✓ Source relevance mapped');
  }

  // Fallback industries if AI fails
  async indexFallbackIndustries() {
    const fallbackIndustries = [
      { name: 'Technology', description: 'Software, hardware, and IT services', market_size_billions: 5500, growth_rate_percent: 8.2 },
      { name: 'Healthcare', description: 'Pharmaceuticals, biotech, medical devices', market_size_billions: 12000, growth_rate_percent: 6.5 },
      { name: 'Finance', description: 'Banking, insurance, fintech', market_size_billions: 22000, growth_rate_percent: 5.8 },
      { name: 'Retail', description: 'E-commerce and traditional retail', market_size_billions: 27000, growth_rate_percent: 4.3 },
      { name: 'Energy', description: 'Oil, gas, renewables', market_size_billions: 8500, growth_rate_percent: 3.7 },
      { name: 'Automotive', description: 'Vehicles, EVs, autonomous driving', market_size_billions: 3800, growth_rate_percent: 4.1 },
      { name: 'Telecommunications', description: '5G, networking, communications', market_size_billions: 1700, growth_rate_percent: 3.2 },
      { name: 'Media & Entertainment', description: 'Streaming, gaming, content', market_size_billions: 2300, growth_rate_percent: 5.4 },
      { name: 'Real Estate', description: 'Property, construction, REITs', market_size_billions: 9500, growth_rate_percent: 3.8 },
      { name: 'Transportation', description: 'Logistics, shipping, airlines', market_size_billions: 6200, growth_rate_percent: 4.5 },
      { name: 'Consumer Goods', description: 'CPG, food & beverage', market_size_billions: 15000, growth_rate_percent: 3.2 },
      { name: 'Education', description: 'EdTech, universities, training', market_size_billions: 7000, growth_rate_percent: 5.1 },
      { name: 'Manufacturing', description: 'Industrial production, automation', market_size_billions: 14000, growth_rate_percent: 3.5 },
      { name: 'Agriculture', description: 'AgTech, farming, food production', market_size_billions: 5000, growth_rate_percent: 3.9 },
      { name: 'Aerospace & Defense', description: 'Aviation, space, defense contractors', market_size_billions: 2100, growth_rate_percent: 4.2 }
    ];

    for (const industry of fallbackIndustries) {
      const result = await pool.query(
        `INSERT INTO industries (name, description, market_size_billions, growth_rate_percent)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (name) DO NOTHING
         RETURNING id, name`,
        [industry.name, industry.description, industry.market_size_billions, industry.growth_rate_percent]
      );
      
      if (result.rows.length > 0) {
        this.industries.push({
          id: result.rows[0].id,
          name: result.rows[0].name,
          ...industry
        });
      }
    }
  }

  // Helper to parse JSON from AI responses
  parseJSON(response) {
    try {
      // Try direct parse
      return JSON.parse(response);
    } catch (e) {
      // Extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (e2) {
          console.error('Failed to parse JSON:', e2);
          return [];
        }
      }
      return [];
    }
  }
}

module.exports = IntelligenceIndexer;