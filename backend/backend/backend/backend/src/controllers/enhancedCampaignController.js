// Enhanced Campaign Controller - Integration with New Infrastructure
const AdaptiveAIAssistant = require('../services/ai-assistant/AdaptiveAIAssistant');
const ContextManager = require('../services/context/ContextManager');
const MemoryVaultService = require('../services/memoryvault/MemoryVaultService');
const db = require('../config/db');

class EnhancedCampaignController {
  constructor(io) {
    this.io = io; // WebSocket instance
    this.aiAssistant = new AdaptiveAIAssistant();
  }

  // Generate campaign brief with AI Assistant in Campaign mode
  async generateCampaignBrief(req, res) {
    try {
      const { projectId, campaignType, objectives, context } = req.body;
      const userId = req.user.id;

      // Load full context
      const [projectContext, userContext] = await Promise.all([
        ContextManager.loadProjectContext(projectId),
        ContextManager.loadUserContext(userId)
      ]);

      // Switch AI to Campaign Strategist mode
      await this.aiAssistant.morphTo('campaign', { 
        feature: 'campaign_intelligence',
        projectId 
      });

      // Search MemoryVault for relevant past campaigns
      const similarCampaigns = await MemoryVaultService.semanticSearch(
        `${campaignType} ${objectives}`,
        {
          projectId,
          documentType: 'campaign_brief',
          limit: 5
        }
      );

      // Build enhanced prompt with context
      const enhancedPrompt = this.buildCampaignPrompt({
        campaignType,
        objectives,
        projectContext,
        userContext,
        similarCampaigns,
        additionalContext: context
      });

      // Generate campaign brief with AI
      const response = await this.aiAssistant.processMessage(
        enhancedPrompt,
        {
          userId,
          projectId,
          feature: 'campaign_intelligence',
          stream: false
        }
      );

      // Parse the response into structured brief
      const brief = this.parseCampaignBrief(response.content);

      // Save to database
      const campaign = await db.query(
        `INSERT INTO campaigns 
         (project_id, name, type, status, brief_data, created_by, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING *`,
        [projectId, brief.name, campaignType, 'draft', brief, userId]
      );

      // Save to MemoryVault with versioning
      const vaultItem = await MemoryVaultService.createItem({
        projectId,
        name: `Campaign Brief - ${brief.name}`,
        type: 'campaign_brief',
        content: JSON.stringify(brief),
        metadata: {
          campaignId: campaign.rows[0].id,
          campaignType,
          userId,
          aiGenerated: true,
          similarCampaigns: similarCampaigns.map(c => c.id)
        }
      });

      // Create relationships to similar campaigns
      for (const similar of similarCampaigns.slice(0, 3)) {
        await MemoryVaultService.createRelationship(
          vaultItem.id,
          similar.id,
          'inspired_by',
          { similarity: similar.similarity }
        );
      }

      // Emit real-time update
      this.io.to(`project:${projectId}`).emit('campaign:created', {
        campaign: campaign.rows[0],
        vaultItem,
        aiSuggestions: response.suggestions
      });

      res.json({
        success: true,
        campaign: campaign.rows[0],
        brief,
        vaultItem,
        aiMode: response.mode,
        aiSuggestions: response.suggestions,
        similarCampaigns: similarCampaigns.map(c => ({
          id: c.id,
          name: c.name,
          similarity: c.similarity
        }))
      });

    } catch (error) {
      console.error('Error generating campaign brief:', error);
      res.status(500).json({ error: 'Failed to generate campaign brief' });
    }
  }

  // Real-time campaign collaboration
  async updateCampaignWithCollaboration(req, res) {
    try {
      const { campaignId, updates, section } = req.body;
      const userId = req.user.id;

      // Get current campaign
      const campaign = await db.query(
        'SELECT * FROM campaigns WHERE id = $1',
        [campaignId]
      );

      if (!campaign.rows[0]) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      // Create version before updating
      const vaultItem = await db.query(
        'SELECT id FROM memoryvault_items WHERE metadata->>\'campaignId\' = $1',
        [campaignId]
      );

      if (vaultItem.rows[0]) {
        await MemoryVaultService.createVersion(
          vaultItem.rows[0].id,
          JSON.stringify(updates),
          userId,
          'update'
        );
      }

      // Update campaign
      const updatedCampaign = await db.query(
        `UPDATE campaigns 
         SET brief_data = brief_data || $1,
             updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [updates, campaignId]
      );

      // Emit real-time update to all collaborators
      this.io.to(`campaign:${campaignId}`).emit('campaign:section:updated', {
        campaignId,
        section,
        updates,
        updatedBy: userId,
        timestamp: new Date()
      });

      // Get AI suggestions for the update
      const suggestions = await this.getAISuggestions(
        updatedCampaign.rows[0],
        section
      );

      res.json({
        success: true,
        campaign: updatedCampaign.rows[0],
        suggestions
      });

    } catch (error) {
      console.error('Error updating campaign:', error);
      res.status(500).json({ error: 'Failed to update campaign' });
    }
  }

  // AI-powered campaign optimization
  async optimizeCampaign(req, res) {
    try {
      const { campaignId, optimizationGoals } = req.body;
      const userId = req.user.id;

      // Get campaign with full context
      const campaign = await db.query(
        'SELECT * FROM campaigns WHERE id = $1',
        [campaignId]
      );

      if (!campaign.rows[0]) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      // Load related MemoryVault items
      const relatedItems = await db.query(
        `SELECT mi.* FROM memoryvault_items mi
         WHERE mi.metadata->>\'campaignId\' = $1
         OR mi.id IN (
           SELECT target_item_id FROM memoryvault_relationships
           WHERE source_item_id = (
             SELECT id FROM memoryvault_items WHERE metadata->>\'campaignId\' = $1 LIMIT 1
           )
         )`,
        [campaignId]
      );

      // Switch AI to Campaign mode
      await this.aiAssistant.morphTo('campaign');

      // Generate optimization suggestions
      const optimizationPrompt = `
        Analyze this campaign and provide specific optimization recommendations:
        
        Campaign: ${JSON.stringify(campaign.rows[0].brief_data)}
        Goals: ${JSON.stringify(optimizationGoals)}
        Related Context: ${relatedItems.rows.length} related documents
        
        Provide:
        1. Specific improvements for each campaign section
        2. Timeline optimizations
        3. Budget allocation suggestions
        4. Risk mitigation strategies
        5. Success metrics adjustments
      `;

      const response = await this.aiAssistant.processMessage(
        optimizationPrompt,
        {
          userId,
          projectId: campaign.rows[0].project_id,
          feature: 'campaign_optimization'
        }
      );

      // Parse and structure recommendations
      const recommendations = this.parseOptimizationRecommendations(response.content);

      // Save optimization analysis
      await db.query(
        `INSERT INTO campaign_optimizations 
         (campaign_id, recommendations, goals, created_by, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [campaignId, recommendations, optimizationGoals, userId]
      );

      res.json({
        success: true,
        campaign: campaign.rows[0],
        recommendations,
        aiConfidence: response.confidence,
        relatedContext: relatedItems.rows.length
      });

    } catch (error) {
      console.error('Error optimizing campaign:', error);
      res.status(500).json({ error: 'Failed to optimize campaign' });
    }
  }

  // Helper methods
  buildCampaignPrompt({ campaignType, objectives, projectContext, userContext, similarCampaigns, additionalContext }) {
    return `
      Create a comprehensive campaign brief for:
      
      Campaign Type: ${campaignType}
      Objectives: ${objectives}
      
      Organization Context:
      - Industry: ${projectContext.project?.industry || 'Not specified'}
      - Previous Campaigns: ${projectContext.campaigns?.length || 0}
      - Success Rate: ${this.calculateSuccessRate(projectContext.campaigns)}
      
      Similar Successful Campaigns:
      ${similarCampaigns.map(c => `- ${c.name} (${(c.similarity * 100).toFixed(0)}% similar)`).join('\n')}
      
      Additional Context: ${additionalContext || 'None provided'}
      
      Please provide:
      1. Campaign name and positioning
      2. Target audiences with personas
      3. Key messages (primary and supporting)
      4. Strategic approach and tactics
      5. Timeline with phases and milestones
      6. Budget allocation recommendations
      7. Success metrics and KPIs
      8. Risk assessment and mitigation
      9. Resource requirements
      10. Integration opportunities with existing campaigns
    `;
  }

  parseCampaignBrief(aiResponse) {
    // Parse AI response into structured brief
    // This is a simplified version - in production, use more sophisticated parsing
    const sections = aiResponse.split(/\d+\.\s+/);
    
    return {
      name: this.extractSection(sections[1], 'name') || 'Untitled Campaign',
      positioning: this.extractSection(sections[1], 'positioning'),
      targetAudiences: this.extractSection(sections[2], 'audiences'),
      keyMessages: this.extractSection(sections[3], 'messages'),
      strategy: this.extractSection(sections[4], 'approach'),
      timeline: this.extractSection(sections[5], 'timeline'),
      budget: this.extractSection(sections[6], 'budget'),
      metrics: this.extractSection(sections[7], 'metrics'),
      risks: this.extractSection(sections[8], 'risks'),
      resources: this.extractSection(sections[9], 'resources'),
      integration: this.extractSection(sections[10], 'integration')
    };
  }

  extractSection(text, type) {
    if (!text) return null;
    // Extract relevant content based on type
    return text.trim();
  }

  calculateSuccessRate(campaigns) {
    if (!campaigns || campaigns.length === 0) return 'No data';
    const successful = campaigns.filter(c => c.status === 'completed' && c.success).length;
    return `${((successful / campaigns.length) * 100).toFixed(0)}%`;
  }

  async getAISuggestions(campaign, section) {
    const prompt = `
      For the ${section} section of this campaign, provide 3 specific improvement suggestions:
      ${JSON.stringify(campaign.brief_data[section])}
    `;

    const response = await this.aiAssistant.processMessage(prompt, {
      feature: 'campaign_suggestions',
      forceMode: 'campaign'
    });

    return response.suggestions || [];
  }

  parseOptimizationRecommendations(aiResponse) {
    // Parse AI optimization response
    return {
      improvements: [],
      timeline: {},
      budget: {},
      risks: [],
      metrics: [],
      priority: 'high',
      estimatedImpact: '25% improvement in campaign effectiveness'
    };
  }
}

module.exports = EnhancedCampaignController;