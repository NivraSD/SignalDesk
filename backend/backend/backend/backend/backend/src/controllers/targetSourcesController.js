/**
 * Target Sources Controller
 * Manages custom data sources for each intelligence target
 */

const pool = require('../config/db');
const claudeService = require('../../config/claude');
const Parser = require('rss-parser');

/**
 * Get all sources for a specific target
 */
exports.getTargetSources = async (req, res) => {
  try {
    const { targetId } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM target_sources WHERE target_id = $1 ORDER BY created_at DESC',
      [targetId]
    );
    
    res.json({
      success: true,
      sources: result.rows
    });
  } catch (error) {
    console.error('Error fetching target sources:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch target sources'
    });
  }
};

/**
 * Add a new source for a target
 */
exports.addTargetSource = async (req, res) => {
  try {
    const { targetId } = req.params;
    const { source_type, source_name, source_url, check_frequency, metadata } = req.body;
    
    const result = await pool.query(
      `INSERT INTO target_sources 
       (target_id, source_type, source_name, source_url, check_frequency, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [targetId, source_type, source_name, source_url, check_frequency || 'daily', metadata || {}]
    );
    
    res.json({
      success: true,
      source: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding target source:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add target source'
    });
  }
};

/**
 * Update a source
 */
exports.updateTargetSource = async (req, res) => {
  try {
    const { sourceId } = req.params;
    const { source_name, source_url, is_active, check_frequency, metadata } = req.body;
    
    const result = await pool.query(
      `UPDATE target_sources 
       SET source_name = COALESCE($2, source_name),
           source_url = COALESCE($3, source_url),
           is_active = COALESCE($4, is_active),
           check_frequency = COALESCE($5, check_frequency),
           metadata = COALESCE($6, metadata),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [sourceId, source_name, source_url, is_active, check_frequency, metadata]
    );
    
    res.json({
      success: true,
      source: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating target source:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update target source'
    });
  }
};

/**
 * Delete a source
 */
exports.deleteTargetSource = async (req, res) => {
  try {
    const { sourceId } = req.params;
    
    await pool.query('DELETE FROM target_sources WHERE id = $1', [sourceId]);
    
    res.json({
      success: true,
      message: 'Source deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting target source:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete target source'
    });
  }
};

/**
 * Discover and suggest sources for a target using AI
 */
exports.discoverSourcesForTarget = async (req, res) => {
  try {
    const { targetId } = req.params;
    
    // Get target details
    const targetResult = await pool.query(
      'SELECT * FROM intelligence_targets WHERE id = $1',
      [targetId]
    );
    
    if (targetResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Target not found'
      });
    }
    
    const target = targetResult.rows[0];
    
    // Use Claude to suggest PR and media monitoring sources
    const prompt = `You are a PR intelligence specialist. For the ${target.type} "${target.name}", suggest specific sources for PR and media monitoring.

Context:
- Type: ${target.type}
- Priority: ${target.priority}
- Keywords: ${target.keywords?.join(', ') || 'None specified'}
- Description: ${target.description || 'No description'}

Please suggest 12-15 signal sources for opportunity discovery including:

**Media Demand Signals:**
1. Google News RSS for "${target.name}" 
2. HARO (Help a Reporter Out) queries related to ${target.type}
3. Journalist Twitter lists covering this beat
4. Google Trends API for topic momentum

**Competitor Activity Signals:**
5. ${target.type === 'competitor' ? target.name + ' press room/newsroom RSS' : 'Industry leader press releases'}
6. SEC filings and investor relations (if public company)
7. Executive LinkedIn activity and posts
8. Patent filings and R&D announcements

**Market Movement Signals:**
9. Industry event calendars and speaking opportunities
10. Regulatory comment periods and rule changes
11. Academic papers and research publications
12. Podcast transcripts mentioning ${target.name}

**Social Signals:**
13. Reddit discussions in relevant subreddits
14. Twitter/X trending topics and hashtags
15. LinkedIn trending articles and discussions

Focus on sources that reveal:
- Narrative vacuums (what's NOT being said)
- Competitor silence or weakness windows
- Emerging trends before mainstream coverage
- Journalist requests and media demand
- Time-sensitive opportunities

Return ONLY a JSON array in this format:
[
  {
    "source_type": "rss|website|social|api|news",
    "source_name": "Name of source",
    "source_url": "https://...",
    "check_frequency": "realtime|hourly|daily|weekly",
    "reason": "Why this source is valuable"
  }
]`;

    const response = await claudeService.sendMessage(prompt);
    
    // Parse response
    let suggestedSources = [];
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestedSources = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('Failed to parse AI suggestions:', parseError);
      suggestedSources = [];
    }
    
    res.json({
      success: true,
      target: {
        id: target.id,
        name: target.name,
        type: target.type
      },
      suggestions: suggestedSources
    });
    
  } catch (error) {
    console.error('Error discovering sources:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to discover sources'
    });
  }
};

/**
 * Test a source to verify it works
 */
exports.testSource = async (req, res) => {
  try {
    const { source_type, source_url } = req.body;
    
    let testResult = {
      success: false,
      message: '',
      sample_data: null
    };
    
    if (source_type === 'rss') {
      try {
        const parser = new Parser();
        const feed = await parser.parseURL(source_url);
        
        testResult.success = true;
        testResult.message = `RSS feed is valid. Found ${feed.items.length} items.`;
        testResult.sample_data = {
          title: feed.title,
          description: feed.description,
          item_count: feed.items.length,
          latest_item: feed.items[0] ? {
            title: feed.items[0].title,
            date: feed.items[0].pubDate
          } : null
        };
      } catch (err) {
        testResult.message = `RSS feed error: ${err.message}`;
      }
    } else if (source_type === 'website') {
      // For websites, we just check if URL is reachable
      try {
        const axios = require('axios');
        const response = await axios.head(source_url, { timeout: 5000 });
        testResult.success = response.status === 200;
        testResult.message = testResult.success ? 'Website is reachable' : 'Website returned non-200 status';
      } catch (err) {
        testResult.message = `Website unreachable: ${err.message}`;
      }
    } else {
      testResult.message = `Testing for ${source_type} not yet implemented`;
      testResult.success = true; // Assume valid for now
    }
    
    res.json(testResult);
    
  } catch (error) {
    console.error('Error testing source:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test source'
    });
  }
};

/**
 * Bulk add suggested sources
 */
exports.bulkAddSources = async (req, res) => {
  try {
    const { targetId } = req.params;
    const { sources } = req.body;
    
    const addedSources = [];
    const errors = [];
    
    for (const source of sources) {
      try {
        const result = await pool.query(
          `INSERT INTO target_sources 
           (target_id, source_type, source_name, source_url, check_frequency, metadata)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [
            targetId, 
            source.source_type, 
            source.source_name, 
            source.source_url, 
            source.check_frequency || 'daily', 
            source.metadata || {}
          ]
        );
        addedSources.push(result.rows[0]);
      } catch (err) {
        errors.push({
          source: source.source_name,
          error: err.message
        });
      }
    }
    
    res.json({
      success: true,
      added: addedSources.length,
      failed: errors.length,
      sources: addedSources,
      errors: errors
    });
    
  } catch (error) {
    console.error('Error bulk adding sources:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk add sources'
    });
  }
};