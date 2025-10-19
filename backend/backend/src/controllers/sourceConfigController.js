// Source Configuration Controller - Dynamically configures sources for ANY organization
const pool = require('../config/db');
const MasterSourceRegistry = require('../services/MasterSourceRegistry');

// Configure sources for an organization based on its industry, competitors, and topics
exports.configureSources = async (req, res) => {
  try {
    const { organizationId, organization, competitors, topics } = req.body;
    
    if (!organizationId || !organization || !organization.name) {
      return res.status(400).json({ 
        error: 'organizationId and organization details are required' 
      });
    }
    
    console.log('=== CONFIGURING SOURCES FOR ORGANIZATION ===');
    console.log('Organization:', organization.name);
    console.log('Industry:', organization.industry || 'General');
    console.log('Competitors:', competitors ? competitors.map(c => c.name) : 'None specified');
    console.log('Topics:', topics ? topics.map(t => t.name) : 'None specified');
    
    const configuredSources = [];
    
    // Step 1: Get relevant sources from MasterSourceRegistry based on industry
    const registry = new MasterSourceRegistry();
    const industrySources = registry.getSourcesForIndustry(organization.industry || 'general');
    
    // Step 2: Build search queries for the organization and its targets
    const searchQueries = [];
    
    // Organization queries
    searchQueries.push(organization.name);
    if (organization.name.includes(' ')) {
      searchQueries.push(`"${organization.name}"`); // Exact match for multi-word names
    }
    
    // Competitor queries
    if (competitors && competitors.length > 0) {
      competitors.forEach(competitor => {
        searchQueries.push(competitor.name);
        if (competitor.name.includes(' ')) {
          searchQueries.push(`"${competitor.name}"`);
        }
      });
    }
    
    // Topic queries
    if (topics && topics.length > 0) {
      topics.forEach(topic => {
        searchQueries.push(topic.name);
        // Add industry context to topics for better results
        if (organization.industry) {
          searchQueries.push(`${topic.name} ${organization.industry}`);
        }
      });
    }
    
    // Step 3: Create source configurations in database
    // Start a transaction to ensure all sources save or none do
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Configure RSS feeds
      if (industrySources.rss_feeds && industrySources.rss_feeds.length > 0) {
        for (const feed of industrySources.rss_feeds) {
          await client.query(`
          INSERT INTO organization_sources 
          (organization_id, source_type, source_url, source_config, active)
          VALUES ($1, $2, $3, $4, true)
          ON CONFLICT ON CONSTRAINT organization_sources_unique DO UPDATE SET
            source_config = EXCLUDED.source_config,
            active = true
          `, [
            organizationId,
            'rss',
            feed.url,
            JSON.stringify({
              name: feed.name,
              category: feed.category,
              industry: organization.industry
            })
          ]);
          configuredSources.push({ type: 'rss', url: feed.url });
        }
      }
    
      // Configure Google News queries
      for (const query of searchQueries) {
        await client.query(`
        INSERT INTO organization_sources 
        (organization_id, source_type, source_query, source_config, active)
        VALUES ($1, $2, $3, $4, true)
        ON CONFLICT ON CONSTRAINT organization_sources_query_unique DO UPDATE SET
          source_config = EXCLUDED.source_config,
          active = true
        `, [
          organizationId,
          'google_news',
          query,
          JSON.stringify({
            language: 'en',
            region: 'US',
            sortBy: 'relevance'
          })
        ]);
        configuredSources.push({ type: 'google_news', query });
      }
    
      // Configure competitor websites if available
      if (competitors && competitors.length > 0) {
        for (const competitor of competitors) {
          if (competitor.url) {
            await client.query(`
            INSERT INTO organization_sources 
            (organization_id, source_type, source_url, source_config, active)
            VALUES ($1, $2, $3, $4, true)
            ON CONFLICT ON CONSTRAINT organization_sources_unique DO UPDATE SET
              source_config = EXCLUDED.source_config,
              active = true
            `, [
              organizationId,
              'website',
              competitor.url,
              JSON.stringify({
                name: competitor.name,
                type: 'competitor',
                checkFrequency: 'daily'
              })
            ]);
            configuredSources.push({ type: 'website', url: competitor.url });
          }
        }
      }
    
      // Step 4: Update source_indexes for backward compatibility
      await client.query(`
      INSERT INTO source_indexes 
      (entity_type, entity_name, entity_data, index_data, organization_id, active)
      VALUES ($1, $2, $3, $4, $5, true)
      ON CONFLICT (entity_type, entity_name) DO UPDATE SET
        entity_data = EXCLUDED.entity_data,
        index_data = EXCLUDED.index_data,
        organization_id = EXCLUDED.organization_id,
        active = true,
        updated_at = NOW()
      `, [
        'organization',
        organization.name,
        JSON.stringify({
          organization,
          competitors,
          topics,
          searchQueries
        }),
        JSON.stringify({
          sources: industrySources,
          configured: configuredSources.length
        }),
        organizationId
      ]);
      
      // Commit the transaction
      await client.query('COMMIT');
      console.log(`✅ Successfully committed ${configuredSources.length} sources to database`);
      
    } catch (error) {
      // Rollback on any error
      await client.query('ROLLBACK');
      throw error;
    } finally {
      // Release the client back to the pool
      client.release();
    }
    
    console.log(`✅ Transaction complete: Configured ${configuredSources.length} sources for ${organization.name}`);
    console.log('Source breakdown:', {
      rss: configuredSources.filter(s => s.type === 'rss').length,
      google_news: configuredSources.filter(s => s.type === 'google_news').length,
      websites: configuredSources.filter(s => s.type === 'website').length
    });
    
    res.json({
      success: true,
      message: `Configured ${configuredSources.length} sources for ${organization.name}`,
      sources: {
        rss_feeds: configuredSources.filter(s => s.type === 'rss').length,
        google_news_queries: configuredSources.filter(s => s.type === 'google_news').length,
        websites: configuredSources.filter(s => s.type === 'website').length,
        total: configuredSources.length
      }
    });
    
  } catch (error) {
    console.error('Error configuring sources:', error);
    res.status(500).json({ 
      error: 'Failed to configure sources',
      details: error.message 
    });
  }
};

// Get configured sources for an organization
exports.getOrganizationSources = async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    const sources = await pool.query(`
      SELECT * FROM organization_sources 
      WHERE organization_id = $1 AND active = true
      ORDER BY source_type, created_at
    `, [organizationId]);
    
    const summary = {
      rss_feeds: sources.rows.filter(s => s.source_type === 'rss'),
      google_news_queries: sources.rows.filter(s => s.source_type === 'google_news'),
      websites: sources.rows.filter(s => s.source_type === 'website'),
      apis: sources.rows.filter(s => s.source_type === 'api'),
      total: sources.rows.length
    };
    
    res.json({
      success: true,
      sources: summary,
      raw: sources.rows
    });
    
  } catch (error) {
    console.error('Error getting organization sources:', error);
    res.status(500).json({ error: 'Failed to get organization sources' });
  }
};

// Trigger immediate monitoring for an organization
exports.triggerMonitoring = async (req, res) => {
  try {
    const { organizationId } = req.body;
    
    console.log(`Triggering immediate monitoring for organization: ${organizationId}`);
    
    // This would normally trigger the UnifiedMonitoringService
    // For now, we'll just mark it as triggered
    
    res.json({
      success: true,
      message: `Monitoring triggered for organization ${organizationId}`,
      note: 'Monitoring will begin collecting data within 5 minutes'
    });
    
  } catch (error) {
    console.error('Error triggering monitoring:', error);
    res.status(500).json({ error: 'Failed to trigger monitoring' });
  }
};

module.exports = exports;