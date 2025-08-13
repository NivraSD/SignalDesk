/**
 * MCP Integration Service
 * Provides helper functions to sync SignalDesk data with MCP servers
 */

const { Pool } = require('pg');

class MCPIntegrationService {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }

  /**
   * Sync MemoryVault item to MCP-accessible format
   */
  async syncMemoryItem(userId, item) {
    try {
      // Ensure item is in MCP-compatible format
      const mcpItem = {
        user_id: userId,
        title: item.title || item.name,
        content: item.content || item.description,
        category: item.category || 'general',
        tags: Array.isArray(item.tags) ? item.tags : [],
        metadata: {
          source: 'signaldesk-web',
          synced_at: new Date().toISOString(),
          original_id: item.id
        }
      };

      // Insert or update in memoryvault_items table
      const query = `
        INSERT INTO memoryvault_items (user_id, title, content, category, tags)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id, title) 
        DO UPDATE SET 
          content = EXCLUDED.content,
          category = EXCLUDED.category,
          tags = EXCLUDED.tags,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id
      `;

      const result = await this.pool.query(query, [
        mcpItem.user_id,
        mcpItem.title,
        mcpItem.content,
        mcpItem.category,
        mcpItem.tags
      ]);

      return {
        success: true,
        mcpId: result.rows[0].id,
        message: 'Item synced to MCP'
      };
    } catch (error) {
      console.error('MCP sync error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Sync campaign data for MCP access
   */
  async syncCampaign(userId, campaign) {
    try {
      const query = `
        INSERT INTO campaigns (
          user_id, name, objectives, start_date, end_date,
          target_audience, budget, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (user_id, name)
        DO UPDATE SET
          objectives = EXCLUDED.objectives,
          status = EXCLUDED.status,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id
      `;

      const result = await this.pool.query(query, [
        userId,
        campaign.name,
        JSON.stringify(campaign.objectives || []),
        campaign.startDate || new Date(),
        campaign.endDate,
        campaign.targetAudience || '',
        campaign.budget || 0,
        campaign.status || 'planning'
      ]);

      // Sync campaign tasks if provided
      if (campaign.tasks && Array.isArray(campaign.tasks)) {
        for (const task of campaign.tasks) {
          await this.syncCampaignTask(result.rows[0].id, task);
        }
      }

      return {
        success: true,
        campaignId: result.rows[0].id,
        message: 'Campaign synced to MCP'
      };
    } catch (error) {
      console.error('Campaign sync error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Sync campaign task
   */
  async syncCampaignTask(campaignId, task) {
    try {
      const query = `
        INSERT INTO campaign_tasks (
          campaign_id, name, description, due_date,
          assignee, dependencies, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `;

      const result = await this.pool.query(query, [
        campaignId,
        task.name,
        task.description || '',
        task.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        task.assignee || '',
        JSON.stringify(task.dependencies || []),
        task.status || 'pending'
      ]);

      return {
        success: true,
        taskId: result.rows[0].id
      };
    } catch (error) {
      console.error('Task sync error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Sync journalist data for media intelligence
   */
  async syncJournalist(journalist) {
    try {
      const query = `
        INSERT INTO journalists (name, publication, beat, email, twitter)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (email)
        DO UPDATE SET
          publication = EXCLUDED.publication,
          beat = EXCLUDED.beat,
          last_updated = CURRENT_TIMESTAMP
        RETURNING id
      `;

      const result = await this.pool.query(query, [
        journalist.name,
        journalist.publication || '',
        journalist.beat || '',
        journalist.email,
        journalist.twitter || ''
      ]);

      return {
        success: true,
        journalistId: result.rows[0].id,
        message: 'Journalist synced to MCP'
      };
    } catch (error) {
      console.error('Journalist sync error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get MCP-ready context for a user
   */
  async getMCPContext(userId) {
    try {
      // Get recent memory items
      const memoryQuery = `
        SELECT title, category, tags
        FROM memoryvault_items
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 10
      `;
      const memoryResult = await this.pool.query(memoryQuery, [userId]);

      // Get active campaigns
      const campaignQuery = `
        SELECT name, status, objectives
        FROM campaigns
        WHERE user_id = $1 AND status IN ('active', 'planning')
        ORDER BY created_at DESC
        LIMIT 5
      `;
      const campaignResult = await this.pool.query(campaignQuery, [userId]);

      // Get recent media outreach
      const mediaQuery = `
        SELECT j.name, j.publication, m.status
        FROM media_outreach m
        JOIN journalists j ON j.email = m.journalist_id
        WHERE m.user_id = $1
        ORDER BY m.updated_at DESC
        LIMIT 10
      `;
      const mediaResult = await this.pool.query(mediaQuery, [userId])
        .catch(() => ({ rows: [] })); // Graceful fallback

      return {
        memoryItems: memoryResult.rows,
        campaigns: campaignResult.rows,
        mediaOutreach: mediaResult.rows,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Get MCP context error:', error);
      return {
        memoryItems: [],
        campaigns: [],
        mediaOutreach: [],
        error: error.message
      };
    }
  }

  /**
   * Initialize MCP tables if they don't exist
   */
  async initializeMCPTables() {
    const queries = [
      // MemoryVault table
      `CREATE TABLE IF NOT EXISTS memoryvault_items (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        category VARCHAR(100),
        tags TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, title)
      )`,
      
      // Campaigns table
      `CREATE TABLE IF NOT EXISTS campaigns (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        objectives JSONB,
        start_date DATE,
        end_date DATE,
        target_audience TEXT,
        budget DECIMAL(10, 2),
        status VARCHAR(50) DEFAULT 'planning',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, name)
      )`,
      
      // Campaign tasks table
      `CREATE TABLE IF NOT EXISTS campaign_tasks (
        id SERIAL PRIMARY KEY,
        campaign_id INTEGER REFERENCES campaigns(id),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        due_date DATE,
        assignee VARCHAR(255),
        dependencies JSONB,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Journalists table
      `CREATE TABLE IF NOT EXISTS journalists (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        publication VARCHAR(255),
        beat VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        twitter VARCHAR(255),
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Media lists table
      `CREATE TABLE IF NOT EXISTS media_lists (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        topic TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Media outreach table
      `CREATE TABLE IF NOT EXISTS media_outreach (
        id SERIAL PRIMARY KEY,
        journalist_id VARCHAR(255),
        user_id VARCHAR(255),
        status VARCHAR(50),
        notes TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(journalist_id, user_id)
      )`
    ];

    try {
      for (const query of queries) {
        await this.pool.query(query);
      }
      console.log('✅ MCP tables initialized successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Error initializing MCP tables:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new MCPIntegrationService();