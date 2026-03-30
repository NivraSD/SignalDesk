// Unified Context Manager for SignalDesk Platform
const EventEmitter = require('events');
const Redis = require('redis');
const db = require('../../config/db');

class ContextManager extends EventEmitter {
  constructor() {
    super();
    
    this.globalContext = new Map();
    this.featureContext = new Map();
    this.userContext = new Map();
    this.projectContext = new Map();
    this.conversationHistory = new Map();
    this.activeFeatures = new Map();
    
    this.redis = null;
    this.initializeRedis();
    this.setupCleanupInterval();
  }

  async initializeRedis() {
    try {
      this.redis = Redis.createClient({
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379
        },
        password: process.env.REDIS_PASSWORD
      });

      await this.redis.connect();
      console.log('✅ Redis connected for Context Manager');

      // Subscribe to context updates
      const subscriber = this.redis.duplicate();
      await subscriber.connect();
      
      await subscriber.subscribe('context:updates', (message) => {
        this.handleContextUpdate(JSON.parse(message));
      });
    } catch (error) {
      console.error('❌ Redis connection failed for Context Manager:', error);
    }
  }

  // ==================== CONTEXT LOADING ====================

  async loadUserContext(userId) {
    try {
      // Check cache first
      if (this.userContext.has(userId)) {
        const cached = this.userContext.get(userId);
        if (Date.now() - cached.timestamp < 300000) { // 5 minutes
          return cached.data;
        }
      }

      // Load from database
      const user = await db.query(
        `SELECT u.*, 
                o.name as organization_name, 
                o.industry as organization_industry
         FROM users u
         LEFT JOIN organizations o ON u.organization_id = o.id
         WHERE u.id = $1`,
        [userId]
      );

      // Load user preferences
      const preferences = await db.query(
        'SELECT * FROM user_preferences WHERE user_id = $1',
        [userId]
      );

      // Load recent activity
      const recentActivity = await db.query(
        `SELECT * FROM user_activity 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT 50`,
        [userId]
      );

      const context = {
        profile: user.rows[0],
        preferences: preferences.rows[0] || {},
        recentActivity: recentActivity.rows,
        activeProjects: await this.getUserProjects(userId),
        timestamp: Date.now()
      };

      // Cache the context
      this.userContext.set(userId, {
        data: context,
        timestamp: Date.now()
      });

      // Store in Redis for cross-server access
      if (this.redis) {
        await this.redis.setex(
          `context:user:${userId}`,
          300, // 5 minutes TTL
          JSON.stringify(context)
        );
      }

      return context;
    } catch (error) {
      console.error('Error loading user context:', error);
      return null;
    }
  }

  async loadProjectContext(projectId) {
    try {
      // Check cache
      if (this.projectContext.has(projectId)) {
        const cached = this.projectContext.get(projectId);
        if (Date.now() - cached.timestamp < 300000) {
          return cached.data;
        }
      }

      // Load project details
      const project = await db.query(
        'SELECT * FROM projects WHERE id = $1',
        [projectId]
      );

      // Load campaign data
      const campaigns = await db.query(
        'SELECT * FROM campaigns WHERE project_id = $1 ORDER BY created_at DESC',
        [projectId]
      );

      // Load memory vault items
      const memoryVault = await db.query(
        `SELECT id, name, type, metadata, created_at 
         FROM memoryvault_items 
         WHERE project_id = $1 
         ORDER BY updated_at DESC 
         LIMIT 100`,
        [projectId]
      );

      // Load recent content
      const recentContent = await db.query(
        `SELECT * FROM generated_content 
         WHERE project_id = $1 
         ORDER BY created_at DESC 
         LIMIT 20`,
        [projectId]
      );

      // Load monitoring targets
      const monitoringTargets = await db.query(
        `SELECT * FROM intelligence_targets 
         WHERE organization_id = (SELECT organization_id FROM projects WHERE id = $1)
         AND active = true`,
        [projectId]
      );

      const context = {
        project: project.rows[0],
        campaigns: campaigns.rows,
        memoryVault: {
          items: memoryVault.rows,
          count: memoryVault.rows.length
        },
        recentContent: recentContent.rows,
        monitoringTargets: monitoringTargets.rows,
        statistics: await this.getProjectStatistics(projectId),
        timestamp: Date.now()
      };

      // Cache
      this.projectContext.set(projectId, {
        data: context,
        timestamp: Date.now()
      });

      // Store in Redis
      if (this.redis) {
        await this.redis.setex(
          `context:project:${projectId}`,
          300,
          JSON.stringify(context)
        );
      }

      return context;
    } catch (error) {
      console.error('Error loading project context:', error);
      return null;
    }
  }

  async loadFeatureContext(feature, userId, projectId) {
    const key = `${feature}:${userId}:${projectId}`;
    
    try {
      // Check cache
      if (this.featureContext.has(key)) {
        const cached = this.featureContext.get(key);
        if (Date.now() - cached.timestamp < 180000) { // 3 minutes
          return cached.data;
        }
      }

      let context = {};

      switch (feature) {
        case 'memoryvault':
          context = await this.loadMemoryVaultContext(projectId);
          break;
        case 'campaign':
          context = await this.loadCampaignContext(projectId);
          break;
        case 'intelligence':
          context = await this.loadIntelligenceContext(projectId);
          break;
        case 'media':
          context = await this.loadMediaContext(projectId);
          break;
        case 'content':
          context = await this.loadContentContext(projectId);
          break;
        default:
          context = { feature, empty: true };
      }

      // Add common context
      context.feature = feature;
      context.userId = userId;
      context.projectId = projectId;
      context.timestamp = Date.now();

      // Cache
      this.featureContext.set(key, {
        data: context,
        timestamp: Date.now()
      });

      return context;
    } catch (error) {
      console.error(`Error loading ${feature} context:`, error);
      return null;
    }
  }

  // ==================== FEATURE-SPECIFIC CONTEXT ====================

  async loadMemoryVaultContext(projectId) {
    const items = await db.query(
      `SELECT * FROM memoryvault_items 
       WHERE project_id = $1 
       ORDER BY updated_at DESC`,
      [projectId]
    );

    const relationships = await db.query(
      `SELECT r.*, 
              s.name as source_name, 
              t.name as target_name
       FROM memoryvault_relationships r
       JOIN memoryvault_items s ON r.source_item_id = s.id
       JOIN memoryvault_items t ON r.target_item_id = t.id
       WHERE s.project_id = $1`,
      [projectId]
    );

    return {
      items: items.rows,
      relationships: relationships.rows,
      totalItems: items.rows.length,
      graph: this.buildRelationshipGraph(relationships.rows)
    };
  }

  async loadCampaignContext(projectId) {
    const campaigns = await db.query(
      `SELECT c.*, 
              COUNT(DISTINCT ct.id) as task_count,
              COUNT(DISTINCT CASE WHEN ct.status = 'completed' THEN ct.id END) as completed_tasks
       FROM campaigns c
       LEFT JOIN campaign_tasks ct ON c.id = ct.campaign_id
       WHERE c.project_id = $1
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
      [projectId]
    );

    const activeCampaign = campaigns.rows.find(c => c.status === 'active');

    if (activeCampaign) {
      const tasks = await db.query(
        'SELECT * FROM campaign_tasks WHERE campaign_id = $1 ORDER BY due_date',
        [activeCampaign.id]
      );

      activeCampaign.tasks = tasks.rows;
    }

    return {
      campaigns: campaigns.rows,
      activeCampaign,
      statistics: {
        total: campaigns.rows.length,
        active: campaigns.rows.filter(c => c.status === 'active').length,
        completed: campaigns.rows.filter(c => c.status === 'completed').length
      }
    };
  }

  async loadIntelligenceContext(projectId) {
    const project = await db.query(
      'SELECT organization_id FROM projects WHERE id = $1',
      [projectId]
    );

    if (!project.rows[0]) return {};

    const targets = await db.query(
      `SELECT * FROM intelligence_targets 
       WHERE organization_id = $1 AND active = true`,
      [project.rows[0].organization_id]
    );

    const recentFindings = await db.query(
      `SELECT * FROM intelligence_findings 
       WHERE organization_id = $1 
       ORDER BY created_at DESC 
       LIMIT 20`,
      [project.rows[0].organization_id]
    );

    return {
      organizationId: project.rows[0].organization_id,
      targets: targets.rows,
      recentFindings: recentFindings.rows,
      monitoringActive: targets.rows.length > 0
    };
  }

  async loadMediaContext(projectId) {
    const mediaLists = await db.query(
      `SELECT * FROM media_lists 
       WHERE project_id = $1 
       ORDER BY created_at DESC`,
      [projectId]
    );

    const recentPitches = await db.query(
      `SELECT * FROM media_pitches 
       WHERE project_id = $1 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [projectId]
    );

    return {
      mediaLists: mediaLists.rows,
      recentPitches: recentPitches.rows,
      totalContacts: await this.countMediaContacts(projectId)
    };
  }

  async loadContentContext(projectId) {
    const recentContent = await db.query(
      `SELECT * FROM generated_content 
       WHERE project_id = $1 
       ORDER BY created_at DESC 
       LIMIT 20`,
      [projectId]
    );

    const templates = await db.query(
      `SELECT * FROM content_templates 
       WHERE project_id = $1 OR project_id IS NULL 
       ORDER BY usage_count DESC`,
      [projectId]
    );

    return {
      recentContent: recentContent.rows,
      templates: templates.rows,
      statistics: await this.getContentStatistics(projectId)
    };
  }

  // ==================== CONTEXT SWITCHING ====================

  async switchFeature(userId, fromFeature, toFeature, projectId) {
    try {
      // Save current feature context
      if (fromFeature) {
        await this.saveFeatureState(userId, fromFeature, projectId);
      }

      // Load new feature context
      const newContext = await this.loadFeatureContext(toFeature, userId, projectId);

      // Track feature switch
      this.activeFeatures.set(userId, {
        feature: toFeature,
        projectId,
        timestamp: Date.now()
      });

      // Create transition context
      const transition = {
        from: fromFeature,
        to: toFeature,
        carryOver: await this.extractCarryOverContext(fromFeature, toFeature, projectId),
        timestamp: Date.now()
      };

      // Emit event
      this.emit('feature:switched', {
        userId,
        transition,
        context: newContext
      });

      // Publish to Redis for other services
      if (this.redis) {
        await this.redis.publish('context:updates', JSON.stringify({
          type: 'feature_switch',
          userId,
          transition,
          context: newContext
        }));
      }

      return {
        transition,
        context: newContext
      };
    } catch (error) {
      console.error('Error switching feature:', error);
      throw error;
    }
  }

  async extractCarryOverContext(fromFeature, toFeature, projectId) {
    // Extract relevant context to carry over between features
    const carryOver = {
      recentTopics: [],
      selectedItems: [],
      activeFilters: {}
    };

    // Feature-specific carry-over logic
    if (fromFeature === 'intelligence' && toFeature === 'campaign') {
      // Carry intelligence insights to campaign planning
      const insights = await this.getRecentInsights(projectId);
      carryOver.intelligenceInsights = insights;
    } else if (fromFeature === 'campaign' && toFeature === 'content') {
      // Carry campaign context to content generation
      const campaign = await this.getActiveCampaign(projectId);
      carryOver.campaignContext = campaign;
    } else if (fromFeature === 'content' && toFeature === 'media') {
      // Carry content to media outreach
      const content = await this.getRecentContent(projectId);
      carryOver.contentForPitch = content;
    }

    return carryOver;
  }

  // ==================== CONVERSATION MANAGEMENT ====================

  async addToConversation(userId, message, response, metadata = {}) {
    const conversationKey = `${userId}:${metadata.projectId || 'global'}`;
    
    if (!this.conversationHistory.has(conversationKey)) {
      this.conversationHistory.set(conversationKey, []);
    }

    const entry = {
      id: Date.now(),
      userId,
      message,
      response,
      metadata,
      timestamp: new Date()
    };

    const history = this.conversationHistory.get(conversationKey);
    history.push(entry);

    // Keep only last 100 messages
    if (history.length > 100) {
      history.shift();
    }

    // Store in Redis for persistence
    if (this.redis) {
      await this.redis.setex(
        `conversation:${conversationKey}`,
        3600, // 1 hour TTL
        JSON.stringify(history)
      );
    }

    return entry;
  }

  async getConversationHistory(userId, projectId = null, limit = 20) {
    const conversationKey = `${userId}:${projectId || 'global'}`;
    
    if (this.conversationHistory.has(conversationKey)) {
      const history = this.conversationHistory.get(conversationKey);
      return history.slice(-limit);
    }

    // Try to load from Redis
    if (this.redis) {
      const cached = await this.redis.get(`conversation:${conversationKey}`);
      if (cached) {
        const history = JSON.parse(cached);
        this.conversationHistory.set(conversationKey, history);
        return history.slice(-limit);
      }
    }

    return [];
  }

  // ==================== GLOBAL CONTEXT ====================

  async setGlobalContext(key, value) {
    this.globalContext.set(key, {
      value,
      timestamp: Date.now()
    });

    // Broadcast to all services
    if (this.redis) {
      await this.redis.publish('context:updates', JSON.stringify({
        type: 'global_context',
        key,
        value
      }));
    }
  }

  getGlobalContext(key) {
    const context = this.globalContext.get(key);
    return context ? context.value : null;
  }

  // ==================== UTILITY METHODS ====================

  async getUserProjects(userId) {
    const projects = await db.query(
      'SELECT * FROM projects WHERE user_id = $1 ORDER BY updated_at DESC',
      [userId]
    );
    return projects.rows;
  }

  async getProjectStatistics(projectId) {
    const stats = await db.query(
      `SELECT 
        (SELECT COUNT(*) FROM campaigns WHERE project_id = $1) as campaigns,
        (SELECT COUNT(*) FROM generated_content WHERE project_id = $1) as content,
        (SELECT COUNT(*) FROM memoryvault_items WHERE project_id = $1) as vault_items,
        (SELECT COUNT(*) FROM media_lists WHERE project_id = $1) as media_lists`,
      [projectId]
    );
    return stats.rows[0];
  }

  buildRelationshipGraph(relationships) {
    const nodes = new Map();
    const edges = [];

    relationships.forEach(rel => {
      // Add nodes
      if (!nodes.has(rel.source_item_id)) {
        nodes.set(rel.source_item_id, {
          id: rel.source_item_id,
          name: rel.source_name
        });
      }
      if (!nodes.has(rel.target_item_id)) {
        nodes.set(rel.target_item_id, {
          id: rel.target_item_id,
          name: rel.target_name
        });
      }

      // Add edge
      edges.push({
        source: rel.source_item_id,
        target: rel.target_item_id,
        type: rel.relationship_type,
        strength: rel.strength
      });
    });

    return {
      nodes: Array.from(nodes.values()),
      edges
    };
  }

  async countMediaContacts(projectId) {
    const result = await db.query(
      `SELECT COUNT(DISTINCT mc.id) as count
       FROM media_contacts mc
       JOIN media_list_contacts mlc ON mc.id = mlc.contact_id
       JOIN media_lists ml ON mlc.list_id = ml.id
       WHERE ml.project_id = $1`,
      [projectId]
    );
    return result.rows[0].count;
  }

  async getContentStatistics(projectId) {
    const stats = await db.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN content_type = 'press_release' THEN 1 END) as press_releases,
        COUNT(CASE WHEN content_type = 'blog_post' THEN 1 END) as blog_posts,
        COUNT(CASE WHEN content_type = 'social_media' THEN 1 END) as social_posts
       FROM generated_content
       WHERE project_id = $1`,
      [projectId]
    );
    return stats.rows[0];
  }

  async saveFeatureState(userId, feature, projectId) {
    // Save current feature state for later restoration
    const state = {
      feature,
      projectId,
      timestamp: Date.now()
    };

    if (this.redis) {
      await this.redis.setex(
        `feature:state:${userId}:${feature}`,
        86400, // 24 hours
        JSON.stringify(state)
      );
    }
  }

  async getRecentInsights(projectId) {
    const insights = await db.query(
      `SELECT * FROM intelligence_findings 
       WHERE project_id = $1 
       ORDER BY created_at DESC 
       LIMIT 5`,
      [projectId]
    );
    return insights.rows;
  }

  async getActiveCampaign(projectId) {
    const campaign = await db.query(
      `SELECT * FROM campaigns 
       WHERE project_id = $1 AND status = 'active' 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [projectId]
    );
    return campaign.rows[0];
  }

  async getRecentContent(projectId) {
    const content = await db.query(
      `SELECT * FROM generated_content 
       WHERE project_id = $1 
       ORDER BY created_at DESC 
       LIMIT 5`,
      [projectId]
    );
    return content.rows;
  }

  handleContextUpdate(update) {
    // Handle context updates from Redis pub/sub
    this.emit('context:updated', update);
  }

  setupCleanupInterval() {
    // Clean up old cached contexts every 10 minutes
    setInterval(() => {
      const now = Date.now();
      const maxAge = 600000; // 10 minutes

      // Clean user context
      this.userContext.forEach((value, key) => {
        if (now - value.timestamp > maxAge) {
          this.userContext.delete(key);
        }
      });

      // Clean project context
      this.projectContext.forEach((value, key) => {
        if (now - value.timestamp > maxAge) {
          this.projectContext.delete(key);
        }
      });

      // Clean feature context
      this.featureContext.forEach((value, key) => {
        if (now - value.timestamp > maxAge) {
          this.featureContext.delete(key);
        }
      });
    }, 600000); // Every 10 minutes
  }

  // Public API
  async getFullContext(userId, projectId) {
    const [userCtx, projectCtx] = await Promise.all([
      this.loadUserContext(userId),
      this.loadProjectContext(projectId)
    ]);

    const activeFeature = this.activeFeatures.get(userId);
    let featureCtx = null;
    
    if (activeFeature) {
      featureCtx = await this.loadFeatureContext(
        activeFeature.feature,
        userId,
        projectId
      );
    }

    return {
      user: userCtx,
      project: projectCtx,
      feature: featureCtx,
      conversation: await this.getConversationHistory(userId, projectId),
      global: Object.fromEntries(this.globalContext)
    };
  }

  clearContext(userId, projectId = null) {
    const conversationKey = `${userId}:${projectId || 'global'}`;
    this.conversationHistory.delete(conversationKey);
    
    if (projectId) {
      this.projectContext.delete(projectId);
    }
    
    this.userContext.delete(userId);
    this.activeFeatures.delete(userId);
  }
}

module.exports = new ContextManager();