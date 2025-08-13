// Enhanced MemoryVault Routes - Integration with Existing Features
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const MemoryVaultService = require('../services/memoryvault/MemoryVaultService');
const ContextManager = require('../services/context/ContextManager');
const AdaptiveAIAssistant = require('../services/ai-assistant/AdaptiveAIAssistant');
const db = require('../config/db');

// Initialize services
const aiAssistant = new AdaptiveAIAssistant();

// ==================== EXISTING FEATURE INTEGRATIONS ====================

// Save Campaign Brief to MemoryVault with versioning
router.post('/campaign-brief', authMiddleware, async (req, res) => {
  try {
    const { projectId, campaignId, brief, metadata } = req.body;
    const userId = req.user.id;

    // Get existing campaign data
    const campaign = await db.query(
      'SELECT * FROM campaigns WHERE id = $1 AND project_id = $2',
      [campaignId, projectId]
    );

    if (!campaign.rows[0]) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Create or update MemoryVault item
    const existingItem = await db.query(
      'SELECT * FROM memoryvault_items WHERE metadata->>\'campaignId\' = $1',
      [campaignId]
    );

    let vaultItem;
    if (existingItem.rows[0]) {
      // Update existing item (creates new version)
      vaultItem = await MemoryVaultService.updateItem(
        existingItem.rows[0].id,
        {
          content: JSON.stringify(brief),
          metadata: {
            ...existingItem.rows[0].metadata,
            ...metadata,
            updatedBy: userId,
            version: (existingItem.rows[0].metadata.version || 1) + 1
          }
        },
        userId
      );
    } else {
      // Create new item
      vaultItem = await MemoryVaultService.createItem({
        projectId,
        name: `Campaign Brief - ${campaign.rows[0].name}`,
        type: 'campaign_brief',
        content: JSON.stringify(brief),
        metadata: {
          campaignId,
          campaignName: campaign.rows[0].name,
          userId,
          ...metadata
        }
      });
    }

    // Create relationships to related documents
    if (metadata.relatedDocuments) {
      for (const docId of metadata.relatedDocuments) {
        await MemoryVaultService.createRelationship(
          vaultItem.id,
          docId,
          'references',
          { context: 'campaign_planning' }
        );
      }
    }

    // Update context for AI Assistant
    await ContextManager.loadProjectContext(projectId);
    
    // Notify via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.to(`project:${projectId}`).emit('memoryvault:updated', {
        type: 'campaign_brief',
        itemId: vaultItem.id,
        campaignId,
        action: existingItem.rows[0] ? 'updated' : 'created'
      });
    }

    res.json({
      success: true,
      vaultItem,
      message: 'Campaign brief saved to MemoryVault'
    });

  } catch (error) {
    console.error('Error saving campaign brief:', error);
    res.status(500).json({ error: 'Failed to save campaign brief' });
  }
});

// Save Generated Content with automatic versioning
router.post('/content', authMiddleware, async (req, res) => {
  try {
    const { projectId, contentType, content, brief, metadata } = req.body;
    const userId = req.user.id;

    // Check for similar content
    const similarContent = await MemoryVaultService.semanticSearch(
      content.substring(0, 500), // Use first 500 chars for search
      {
        projectId,
        documentType: 'generated_content',
        threshold: 0.9
      }
    );

    let vaultItem;
    if (similarContent.length > 0 && similarContent[0].similarity > 0.9) {
      // Very similar content exists - create as version
      const existingId = similarContent[0].id;
      vaultItem = await MemoryVaultService.updateItem(
        existingId,
        {
          content,
          metadata: {
            ...metadata,
            previousVersion: existingId,
            similarity: similarContent[0].similarity
          }
        },
        userId
      );
    } else {
      // Create new content item
      vaultItem = await MemoryVaultService.createItem({
        projectId,
        name: `${contentType} - ${new Date().toLocaleDateString()}`,
        type: 'generated_content',
        content,
        metadata: {
          contentType,
          brief,
          generatedBy: 'ai',
          userId,
          ...metadata
        }
      });
    }

    // Also save to existing generated_content table for compatibility
    await db.query(
      `INSERT INTO generated_content 
       (project_id, content_type, brief, content, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [projectId, contentType, brief, content, { vaultItemId: vaultItem.id, ...metadata }]
    );

    res.json({
      success: true,
      vaultItem,
      similar: similarContent.length > 0
    });

  } catch (error) {
    console.error('Error saving content:', error);
    res.status(500).json({ error: 'Failed to save content' });
  }
});

// Save Media List with journalist relationships
router.post('/media-list', authMiddleware, async (req, res) => {
  try {
    const { projectId, listName, journalists, metadata } = req.body;
    const userId = req.user.id;

    // Create media list in MemoryVault
    const vaultItem = await MemoryVaultService.createItem({
      projectId,
      name: `Media List - ${listName}`,
      type: 'media_list',
      content: JSON.stringify(journalists),
      metadata: {
        listName,
        journalistCount: journalists.length,
        userId,
        ...metadata
      }
    });

    // Create relationships between journalists and campaigns
    if (metadata.campaignId) {
      const campaignVault = await db.query(
        'SELECT id FROM memoryvault_items WHERE metadata->>\'campaignId\' = $1',
        [metadata.campaignId]
      );

      if (campaignVault.rows[0]) {
        await MemoryVaultService.createRelationship(
          vaultItem.id,
          campaignVault.rows[0].id,
          'media_targets',
          { context: 'media_outreach' }
        );
      }
    }

    // Save to existing media_lists table
    const mediaList = await db.query(
      `INSERT INTO media_lists 
       (project_id, name, metadata, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [projectId, listName, { vaultItemId: vaultItem.id, journalists, ...metadata }]
    );

    res.json({
      success: true,
      vaultItem,
      mediaList: mediaList.rows[0]
    });

  } catch (error) {
    console.error('Error saving media list:', error);
    res.status(500).json({ error: 'Failed to save media list' });
  }
});

// ==================== SEMANTIC SEARCH ACROSS FEATURES ====================

// Unified search across all content
router.post('/search', authMiddleware, async (req, res) => {
  try {
    const { query, projectId, filters = {} } = req.body;
    const userId = req.user.id;

    // Perform semantic search
    const results = await MemoryVaultService.semanticSearch(query, {
      projectId,
      limit: filters.limit || 20,
      documentType: filters.type,
      threshold: filters.threshold || 0.6
    });

    // Enrich results with feature-specific data
    const enrichedResults = await Promise.all(results.map(async (result) => {
      const enriched = { ...result };

      // Add campaign context if it's a campaign document
      if (result.metadata?.campaignId) {
        const campaign = await db.query(
          'SELECT name, status FROM campaigns WHERE id = $1',
          [result.metadata.campaignId]
        );
        enriched.campaign = campaign.rows[0];
      }

      // Add media context if it's a media list
      if (result.type === 'media_list') {
        enriched.journalistCount = result.metadata?.journalistCount || 0;
      }

      // Add content metrics if it's generated content
      if (result.type === 'generated_content') {
        const metrics = await db.query(
          'SELECT * FROM content_analyses WHERE content_id = $1',
          [result.metadata?.contentId]
        );
        enriched.metrics = metrics.rows[0];
      }

      return enriched;
    }));

    // Log search for analytics
    await db.query(
      `INSERT INTO search_history 
       (user_id, project_id, query, results_count, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [userId, projectId, query, enrichedResults.length]
    );

    res.json({
      success: true,
      query,
      results: enrichedResults,
      totalResults: enrichedResults.length
    });

  } catch (error) {
    console.error('Error performing search:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// ==================== RELATIONSHIP DISCOVERY ====================

// Discover relationships between documents
router.post('/discover-relationships', authMiddleware, async (req, res) => {
  try {
    const { itemId, projectId } = req.body;
    
    // Discover potential relationships
    const discoveries = await MemoryVaultService.discoverRelationships(itemId);
    
    // Filter by confidence and create suggestions
    const suggestions = discoveries
      .filter(d => d.confidence > 0.7)
      .map(d => ({
        ...d,
        actionRequired: d.confidence < 0.85 ? 'review' : 'auto_create'
      }));

    // Auto-create high confidence relationships
    const autoCreated = [];
    for (const suggestion of suggestions.filter(s => s.actionRequired === 'auto_create')) {
      const relationship = await MemoryVaultService.createRelationship(
        itemId,
        suggestion.targetId,
        suggestion.type,
        {
          ...suggestion.metadata,
          autoDiscovered: true,
          confidence: suggestion.confidence
        }
      );
      autoCreated.push(relationship);
    }

    res.json({
      success: true,
      discoveries: suggestions,
      autoCreated,
      requiresReview: suggestions.filter(s => s.actionRequired === 'review')
    });

  } catch (error) {
    console.error('Error discovering relationships:', error);
    res.status(500).json({ error: 'Relationship discovery failed' });
  }
});

// ==================== VERSION MANAGEMENT ====================

// Get version history for any feature document
router.get('/versions/:itemId', authMiddleware, async (req, res) => {
  try {
    const { itemId } = req.params;
    
    // Get version history
    const versions = await MemoryVaultService.getVersionHistory(itemId);
    
    // Add feature context to each version
    const enrichedVersions = await Promise.all(versions.map(async (version) => {
      const enriched = { ...version };
      
      // Add user info
      if (version.changed_by) {
        const user = await db.query(
          'SELECT name, email FROM users WHERE id = $1',
          [version.changed_by]
        );
        enriched.changedByUser = user.rows[0];
      }
      
      return enriched;
    }));

    res.json({
      success: true,
      itemId,
      versions: enrichedVersions,
      totalVersions: enrichedVersions.length
    });

  } catch (error) {
    console.error('Error getting versions:', error);
    res.status(500).json({ error: 'Failed to get versions' });
  }
});

// Rollback to specific version
router.post('/rollback', authMiddleware, async (req, res) => {
  try {
    const { itemId, versionNumber } = req.body;
    const userId = req.user.id;
    
    // Perform rollback
    const rolledBack = await MemoryVaultService.rollbackToVersion(
      itemId,
      versionNumber,
      userId
    );
    
    // Update related features
    const item = await MemoryVaultService.getItem(itemId);
    
    if (item.metadata?.campaignId) {
      // Update campaign if this is a campaign document
      await db.query(
        'UPDATE campaigns SET updated_at = NOW() WHERE id = $1',
        [item.metadata.campaignId]
      );
    }
    
    // Notify via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.to(`project:${item.project_id}`).emit('memoryvault:rollback', {
        itemId,
        versionNumber,
        userId
      });
    }

    res.json({
      success: true,
      item: rolledBack,
      message: `Rolled back to version ${versionNumber}`
    });

  } catch (error) {
    console.error('Error rolling back:', error);
    res.status(500).json({ error: 'Rollback failed' });
  }
});

// ==================== AI CONTEXT INTEGRATION ====================

// Add items to AI context
router.post('/ai-context/add', authMiddleware, async (req, res) => {
  try {
    const { itemIds, projectId, feature } = req.body;
    const userId = req.user.id;
    
    // Load items for context
    const items = await Promise.all(
      itemIds.map(id => MemoryVaultService.getItem(id))
    );
    
    // Add to context manager
    await ContextManager.loadProjectContext(projectId);
    
    // Create AI context session
    const session = await db.query(
      `INSERT INTO ai_context_sessions 
       (user_id, project_id, feature, context_items, active, created_at)
       VALUES ($1, $2, $3, $4, true, NOW())
       RETURNING *`,
      [userId, projectId, feature, itemIds]
    );
    
    // Notify AI Assistant
    await aiAssistant.morphTo(feature === 'campaigns' ? 'campaign' : 'default');
    
    res.json({
      success: true,
      session: session.rows[0],
      itemsLoaded: items.length,
      aiMode: aiAssistant.currentMode
    });

  } catch (error) {
    console.error('Error adding to AI context:', error);
    res.status(500).json({ error: 'Failed to add to AI context' });
  }
});

module.exports = router;