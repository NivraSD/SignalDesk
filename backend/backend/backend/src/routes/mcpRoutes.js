/**
 * MCP Integration Routes
 * API endpoints for syncing data with MCP servers
 */

const express = require('express');
const router = express.Router();
const mcpIntegration = require('../services/mcpIntegration');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * Initialize MCP tables
 * GET /api/mcp/init
 */
router.get('/init', authMiddleware, async (req, res) => {
  try {
    const result = await mcpIntegration.initializeMCPTables();
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Sync memory item to MCP
 * POST /api/mcp/memory/sync
 */
router.post('/memory/sync', authMiddleware, async (req, res) => {
  try {
    const { item } = req.body;
    const userId = req.user.id || req.user.email;
    
    const result = await mcpIntegration.syncMemoryItem(userId, item);
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Sync campaign to MCP
 * POST /api/mcp/campaign/sync
 */
router.post('/campaign/sync', authMiddleware, async (req, res) => {
  try {
    const { campaign } = req.body;
    const userId = req.user.id || req.user.email;
    
    const result = await mcpIntegration.syncCampaign(userId, campaign);
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Sync journalist to MCP
 * POST /api/mcp/journalist/sync
 */
router.post('/journalist/sync', authMiddleware, async (req, res) => {
  try {
    const { journalist } = req.body;
    
    const result = await mcpIntegration.syncJournalist(journalist);
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Get MCP context for current user
 * GET /api/mcp/context
 */
router.get('/context', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id || req.user.email;
    
    const context = await mcpIntegration.getMCPContext(userId);
    res.json({
      success: true,
      context,
      message: 'MCP context loaded'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Batch sync multiple items
 * POST /api/mcp/batch-sync
 */
router.post('/batch-sync', authMiddleware, async (req, res) => {
  try {
    const { memoryItems = [], campaigns = [], journalists = [] } = req.body;
    const userId = req.user.id || req.user.email;
    
    const results = {
      memory: [],
      campaigns: [],
      journalists: []
    };
    
    // Sync memory items
    for (const item of memoryItems) {
      const result = await mcpIntegration.syncMemoryItem(userId, item);
      results.memory.push(result);
    }
    
    // Sync campaigns
    for (const campaign of campaigns) {
      const result = await mcpIntegration.syncCampaign(userId, campaign);
      results.campaigns.push(result);
    }
    
    // Sync journalists
    for (const journalist of journalists) {
      const result = await mcpIntegration.syncJournalist(journalist);
      results.journalists.push(result);
    }
    
    res.json({
      success: true,
      results,
      summary: {
        memorySynced: results.memory.filter(r => r.success).length,
        campaignsSynced: results.campaigns.filter(r => r.success).length,
        journalistsSynced: results.journalists.filter(r => r.success).length
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Health check for MCP integration
 * GET /api/mcp/health
 */
router.get('/health', async (req, res) => {
  try {
    // Check if MCP tables exist
    const tableCheck = await mcpIntegration.pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('memoryvault_items', 'campaigns', 'journalists')
    `);
    
    const tables = tableCheck.rows.map(r => r.table_name);
    
    res.json({
      success: true,
      status: 'operational',
      tables: {
        memoryvault: tables.includes('memoryvault_items'),
        campaigns: tables.includes('campaigns'),
        journalists: tables.includes('journalists')
      },
      message: 'MCP integration is operational'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'error',
      error: error.message
    });
  }
});

module.exports = router;