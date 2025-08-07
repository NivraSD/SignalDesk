/**
 * Source Index Controller
 * Manages intelligent source discovery and indexing
 */

const IntelligentIndexingAgent = require('../services/IntelligentIndexingAgent');
const pool = require('../config/db');

// Initialize the indexing agent
const indexingAgent = new IntelligentIndexingAgent();

/**
 * Index a single entity (company, industry, topic, etc.)
 */
exports.indexEntity = async (req, res) => {
  try {
    const { entityType, entityData, options } = req.body;
    
    console.log(`📚 INDEXING REQUEST: ${entityType} - ${entityData.name}`);
    
    // Validate input
    if (!entityType || !entityData || !entityData.name) {
      return res.status(400).json({
        success: false,
        error: 'Entity type and name are required'
      });
    }
    
    // Run the indexing pipeline
    const result = await indexingAgent.indexEntity(entityType, entityData, options);
    
    res.json({
      success: true,
      indexId: result.indexId,
      statistics: result.categorizedSources.statistics,
      sourceCount: result.categorizedSources.sources.length,
      topSources: result.categorizedSources.sources.slice(0, 10).map(s => ({
        name: s.name,
        url: s.url,
        type: s.type,
        score: s.qualityScore?.overall
      }))
    });
    
  } catch (error) {
    console.error('Indexing failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to index entity',
      details: error.message
    });
  }
};

/**
 * Bulk index multiple entities
 */
exports.bulkIndex = async (req, res) => {
  try {
    const { entities, options } = req.body;
    
    if (!entities || !Array.isArray(entities) || entities.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Entities array is required'
      });
    }
    
    console.log(`📚 BULK INDEXING: ${entities.length} entities`);
    
    // Start bulk indexing in background
    const jobId = `bulk-${Date.now()}`;
    
    // Return immediate response
    res.json({
      success: true,
      jobId: jobId,
      message: `Bulk indexing started for ${entities.length} entities`,
      status: 'processing'
    });
    
    // Run bulk indexing asynchronously
    indexingAgent.bulkIndex(entities, options).then(async (results) => {
      // Store results in database
      await pool.query(
        `INSERT INTO indexing_jobs 
         (job_id, entity_type, entity_name, status, completed_at, results)
         VALUES ($1, $2, $3, $4, NOW(), $5)`,
        [jobId, 'bulk', `Bulk Job (${entities.length} entities)`, 'completed', JSON.stringify(results)]
      );
      
      console.log(`✅ Bulk indexing completed: ${results.filter(r => r.success).length}/${entities.length} successful`);
    }).catch(async (error) => {
      await pool.query(
        `INSERT INTO indexing_jobs 
         (job_id, entity_type, entity_name, status, completed_at, error_message)
         VALUES ($1, $2, $3, $4, NOW(), $5)`,
        [jobId, 'bulk', `Bulk Job (${entities.length} entities)`, 'failed', error.message]
      );
      
      console.error('Bulk indexing failed:', error);
    });
    
  } catch (error) {
    console.error('Bulk indexing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start bulk indexing',
      details: error.message
    });
  }
};

/**
 * Search indexed sources
 */
exports.searchIndexes = async (req, res) => {
  try {
    const { query, entityType, limit = 100 } = req.query;
    
    let sql = `
      SELECT 
        id,
        entity_type,
        entity_name,
        entity_data,
        statistics,
        quality_score,
        source_count,
        created_at,
        updated_at
      FROM source_indexes
      WHERE active = true
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (query) {
      sql += ` AND (entity_name ILIKE $${paramIndex} OR entity_data::text ILIKE $${paramIndex})`;
      params.push(`%${query}%`);
      paramIndex++;
    }
    
    if (entityType) {
      sql += ` AND entity_type = $${paramIndex}`;
      params.push(entityType);
      paramIndex++;
    }
    
    sql += ` ORDER BY quality_score DESC NULLS LAST, created_at DESC LIMIT $${paramIndex}`;
    params.push(parseInt(limit));
    
    const result = await pool.query(sql, params);
    
    // Parse JSON fields
    const indexes = result.rows.map(row => ({
      ...row,
      entity_data: typeof row.entity_data === 'string' ? JSON.parse(row.entity_data) : row.entity_data,
      statistics: typeof row.statistics === 'string' ? JSON.parse(row.statistics) : row.statistics
    }));
    
    res.json({
      success: true,
      indexes: indexes,
      count: indexes.length
    });
    
  } catch (error) {
    console.error('Search failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search indexes',
      details: error.message
    });
  }
};

/**
 * Get detailed index with all sources
 */
exports.getIndex = async (req, res) => {
  try {
    const { indexId } = req.params;
    
    // Get main index
    const indexResult = await pool.query(
      'SELECT * FROM source_indexes WHERE id = $1',
      [indexId]
    );
    
    if (indexResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Index not found'
      });
    }
    
    const index = indexResult.rows[0];
    
    // Parse JSON fields
    index.entity_data = typeof index.entity_data === 'string' ? JSON.parse(index.entity_data) : index.entity_data;
    index.index_data = typeof index.index_data === 'string' ? JSON.parse(index.index_data) : index.index_data;
    index.statistics = typeof index.statistics === 'string' ? JSON.parse(index.statistics) : index.statistics;
    
    // Get individual sources if they exist
    const sourcesResult = await pool.query(
      'SELECT * FROM indexed_sources WHERE index_id = $1 ORDER BY quality_score DESC NULLS LAST',
      [indexId]
    );
    
    res.json({
      success: true,
      index: index,
      sources: sourcesResult.rows
    });
    
  } catch (error) {
    console.error('Failed to get index:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve index',
      details: error.message
    });
  }
};

/**
 * Get index statistics
 */
exports.getStatistics = async (req, res) => {
  try {
    // Get overall statistics
    const statsResult = await pool.query(`
      SELECT 
        entity_type,
        COUNT(DISTINCT entity_name) as entity_count,
        COUNT(*) as index_count,
        AVG(quality_score) as avg_quality,
        SUM(source_count) as total_sources,
        MAX(created_at) as last_indexed
      FROM source_indexes
      WHERE active = true
      GROUP BY entity_type
      ORDER BY entity_count DESC
    `);
    
    // Get recent indexes
    const recentResult = await pool.query(`
      SELECT 
        id,
        entity_type,
        entity_name,
        quality_score,
        source_count,
        created_at
      FROM source_indexes
      WHERE active = true
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    // Get top quality indexes
    const topQualityResult = await pool.query(`
      SELECT 
        id,
        entity_type,
        entity_name,
        quality_score,
        source_count,
        created_at
      FROM source_indexes
      WHERE active = true AND quality_score IS NOT NULL
      ORDER BY quality_score DESC
      LIMIT 10
    `);
    
    res.json({
      success: true,
      statistics: {
        byType: statsResult.rows,
        recentIndexes: recentResult.rows,
        topQuality: topQualityResult.rows,
        summary: {
          totalIndexes: statsResult.rows.reduce((sum, r) => sum + parseInt(r.index_count), 0),
          totalEntities: statsResult.rows.reduce((sum, r) => sum + parseInt(r.entity_count), 0),
          totalSources: statsResult.rows.reduce((sum, r) => sum + (parseInt(r.total_sources) || 0), 0)
        }
      }
    });
    
  } catch (error) {
    console.error('Failed to get statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve statistics',
      details: error.message
    });
  }
};

/**
 * Start continuous indexing for an entity
 */
exports.startContinuousIndexing = async (req, res) => {
  try {
    const { entityType, entityData, interval } = req.body;
    
    if (!entityType || !entityData || !entityData.name) {
      return res.status(400).json({
        success: false,
        error: 'Entity type and name are required'
      });
    }
    
    const jobId = `continuous-${Date.now()}`;
    
    // Store job in database
    await pool.query(
      `INSERT INTO indexing_jobs 
       (job_id, entity_type, entity_name, entity_data, status, interval_ms, next_run)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        jobId,
        entityType,
        entityData.name,
        JSON.stringify(entityData),
        'active',
        interval || 24 * 60 * 60 * 1000, // Default 24 hours
        new Date(Date.now() + (interval || 24 * 60 * 60 * 1000))
      ]
    );
    
    // Start continuous indexing
    const job = await indexingAgent.startContinuousIndexing(
      entityType,
      entityData,
      interval
    );
    
    res.json({
      success: true,
      jobId: jobId,
      message: `Continuous indexing started for ${entityData.name}`,
      nextRun: job.nextRun
    });
    
  } catch (error) {
    console.error('Failed to start continuous indexing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start continuous indexing',
      details: error.message
    });
  }
};

/**
 * Get job status
 */
exports.getJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM indexing_jobs WHERE job_id = $1',
      [jobId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }
    
    const job = result.rows[0];
    job.entity_data = typeof job.entity_data === 'string' ? JSON.parse(job.entity_data) : job.entity_data;
    job.results = typeof job.results === 'string' ? JSON.parse(job.results) : job.results;
    
    res.json({
      success: true,
      job: job
    });
    
  } catch (error) {
    console.error('Failed to get job status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve job status',
      details: error.message
    });
  }
};

/**
 * Discover sources for quick preview (without full indexing)
 */
exports.discoverSources = async (req, res) => {
  try {
    const { entityType, entityData } = req.body;
    
    console.log(`🔍 Quick source discovery for ${entityData.name}`);
    
    // Just run the discovery phase
    const sources = await indexingAgent.discoverEntitySources(entityType, entityData);
    
    // Count sources by category
    const summary = {};
    for (const [category, categorySource] of Object.entries(sources)) {
      summary[category] = categorySource.length;
    }
    
    res.json({
      success: true,
      summary: summary,
      totalSources: Object.values(summary).reduce((sum, count) => sum + count, 0),
      sampleSources: {
        official: sources.official.slice(0, 3),
        news: sources.news.slice(0, 3),
        industry: sources.industry.slice(0, 3),
        social: sources.social.slice(0, 3)
      }
    });
    
  } catch (error) {
    console.error('Source discovery failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to discover sources',
      details: error.message
    });
  }
};

/**
 * Pre-built industry indexes
 */
exports.getIndustryIndex = async (req, res) => {
  try {
    const { industry } = req.params;
    
    // Check if we have a pre-built index for this industry
    const result = await pool.query(
      `SELECT * FROM source_indexes 
       WHERE entity_type = 'industry' 
       AND LOWER(entity_name) = LOWER($1)
       AND active = true
       ORDER BY created_at DESC
       LIMIT 1`,
      [industry]
    );
    
    if (result.rows.length === 0) {
      // Create a new index for this industry
      console.log(`Creating new index for industry: ${industry}`);
      
      const indexResult = await indexingAgent.indexEntity('industry', {
        name: industry,
        industry: industry,
        description: `Comprehensive source index for ${industry} industry`
      });
      
      return res.json({
        success: true,
        message: `New index created for ${industry}`,
        indexId: indexResult.indexId
      });
    }
    
    const index = result.rows[0];
    index.entity_data = typeof index.entity_data === 'string' ? JSON.parse(index.entity_data) : index.entity_data;
    index.index_data = typeof index.index_data === 'string' ? JSON.parse(index.index_data) : index.index_data;
    index.statistics = typeof index.statistics === 'string' ? JSON.parse(index.statistics) : index.statistics;
    
    res.json({
      success: true,
      index: index
    });
    
  } catch (error) {
    console.error('Failed to get industry index:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve industry index',
      details: error.message
    });
  }
};