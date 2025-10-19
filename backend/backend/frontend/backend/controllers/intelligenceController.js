const IntelligenceService = require('../services/intelligenceService');
const { pool } = require('../server');

class IntelligenceController {
  /**
   * Analyze intelligence request using the full pipeline
   */
  static async analyzeRequest(req, res) {
    try {
      const { query, organizationId, targetType } = req.body;
      
      if (!query || !organizationId) {
        return res.status(400).json({ error: 'Query and organizationId are required' });
      }

      // Process through intelligence pipeline
      const result = await IntelligenceService.processIntelligenceRequest({
        query,
        organizationId,
        targetType: targetType || 'mixed'
      });

      // If clarification needed, return questions
      if (result.status === 'needs_clarification') {
        return res.status(200).json({
          status: 'needs_clarification',
          projectId: result.projectId,
          questions: result.questions
        });
      }

      // Return complete analysis
      res.json(result);
    } catch (error) {
      console.error('Intelligence analysis error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Clarify an ambiguous query
   */
  static async clarifyQuery(req, res) {
    try {
      const { query, answers, projectId } = req.body;
      
      const clarifiedQuery = await IntelligenceService.clarifyQuery(query, answers);
      
      // Continue processing with clarified query if projectId exists
      if (projectId && !clarifiedQuery.needs_clarification) {
        const result = await IntelligenceService.continueProject(projectId, clarifiedQuery);
        return res.json(result);
      }
      
      res.json(clarifiedQuery);
    } catch (error) {
      console.error('Query clarification error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Create a new intelligence target
   */
  static async createTarget(req, res) {
    try {
      const { 
        organizationId, 
        name, 
        type, 
        priority, 
        threatLevel, 
        keywords 
      } = req.body;

      const query = `
        INSERT INTO intelligence_targets 
        (organization_id, name, type, priority, threat_level, keywords, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const values = [
        organizationId,
        name,
        type,
        priority || 'medium',
        threatLevel || 50,
        keywords || [],
        JSON.stringify({ created_via: 'api' })
      ];

      const result = await pool.query(query, values);
      
      // Set up monitoring sources for the new target
      await IntelligenceService.setupMonitoringSources(result.rows[0].id, type);
      
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Create target error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get intelligence targets for an organization
   */
  static async getOrganizationTargets(req, res) {
    try {
      const { orgId } = req.params;
      const { type, active } = req.query;

      let query = `
        SELECT 
          t.*,
          COUNT(DISTINCT f.id) as findings_count,
          MAX(f.published_at) as latest_finding,
          AVG(f.sentiment_score) as avg_sentiment
        FROM intelligence_targets t
        LEFT JOIN intelligence_findings f ON t.id = f.target_id
        WHERE t.organization_id = $1
      `;

      const params = [orgId];
      let paramIndex = 2;

      if (type) {
        query += ` AND t.type = $${paramIndex}`;
        params.push(type);
        paramIndex++;
      }

      if (active !== undefined) {
        query += ` AND t.active = $${paramIndex}`;
        params.push(active === 'true');
        paramIndex++;
      }

      query += ` GROUP BY t.id ORDER BY t.priority DESC, t.threat_level DESC`;

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error) {
      console.error('Get targets error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get intelligence findings
   */
  static async getFindings(req, res) {
    try {
      const { targetId, organizationId, importance, processed, limit = 50, offset = 0 } = req.query;

      let query = `
        SELECT 
          f.*,
          t.name as target_name,
          t.type as target_type,
          s.source_name
        FROM intelligence_findings f
        JOIN intelligence_targets t ON f.target_id = t.id
        LEFT JOIN monitoring_sources s ON f.source_id = s.id
        WHERE 1=1
      `;

      const params = [];
      let paramIndex = 1;

      if (targetId) {
        query += ` AND f.target_id = $${paramIndex}`;
        params.push(targetId);
        paramIndex++;
      }

      if (organizationId) {
        query += ` AND t.organization_id = $${paramIndex}`;
        params.push(organizationId);
        paramIndex++;
      }

      if (importance) {
        query += ` AND f.importance = $${paramIndex}`;
        params.push(importance);
        paramIndex++;
      }

      if (processed !== undefined) {
        query += ` AND f.processed = $${paramIndex}`;
        params.push(processed === 'true');
        paramIndex++;
      }

      query += ` ORDER BY f.published_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error) {
      console.error('Get findings error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Start real-time monitoring
   */
  static async startMonitoring(req, res) {
    try {
      const { organizationId, targetIds } = req.body;

      // Start monitoring for specified targets or all active targets
      const result = await IntelligenceService.startMonitoring(organizationId, targetIds);
      
      res.json({
        status: 'monitoring_started',
        targets: result.targets,
        sources: result.sources,
        nextCheck: result.nextCheck
      });
    } catch (error) {
      console.error('Start monitoring error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get monitoring status
   */
  static async getMonitoringStatus(req, res) {
    try {
      const { orgId } = req.params;

      const query = `
        SELECT 
          COUNT(DISTINCT t.id) as active_targets,
          COUNT(DISTINCT s.id) as active_sources,
          COUNT(DISTINCT f.id) FILTER (WHERE f.created_at > NOW() - INTERVAL '24 hours') as findings_24h,
          COUNT(DISTINCT o.id) FILTER (WHERE o.created_at > NOW() - INTERVAL '24 hours') as opportunities_24h,
          MAX(f.created_at) as last_finding,
          MIN(s.next_check) as next_check
        FROM intelligence_targets t
        LEFT JOIN monitoring_sources s ON t.id = s.target_id AND s.active = true
        LEFT JOIN intelligence_findings f ON t.id = f.target_id
        LEFT JOIN opportunities o ON t.organization_id = o.organization_id
        WHERE t.organization_id = $1 AND t.active = true
      `;

      const result = await pool.query(query, [orgId]);
      const status = result.rows[0];

      res.json({
        ...status,
        status: status.active_sources > 0 ? 'active' : 'inactive',
        health: IntelligenceService.calculateHealthScore(status)
      });
    } catch (error) {
      console.error('Get monitoring status error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Helper methods
  static async getTarget(req, res) {
    try {
      const { targetId } = req.params;
      const query = 'SELECT * FROM intelligence_targets WHERE id = $1';
      const result = await pool.query(query, [targetId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Target not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async updateTarget(req, res) {
    try {
      const { targetId } = req.params;
      const updates = req.body;
      
      const setClause = Object.keys(updates)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');
      
      const query = `
        UPDATE intelligence_targets 
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      
      const values = [targetId, ...Object.values(updates)];
      const result = await pool.query(query, values);
      
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async deleteTarget(req, res) {
    try {
      const { targetId } = req.params;
      await pool.query('DELETE FROM intelligence_targets WHERE id = $1', [targetId]);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getProject(req, res) {
    try {
      const { projectId } = req.params;
      const query = 'SELECT * FROM research_projects WHERE id = $1';
      const result = await pool.query(query, [projectId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getOrganizationProjects(req, res) {
    try {
      const { orgId } = req.params;
      const query = `
        SELECT * FROM research_projects 
        WHERE organization_id = $1 
        ORDER BY created_at DESC 
        LIMIT 20
      `;
      const result = await pool.query(query, [orgId]);
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getFinding(req, res) {
    try {
      const { findingId } = req.params;
      const query = 'SELECT * FROM intelligence_findings WHERE id = $1';
      const result = await pool.query(query, [findingId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Finding not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async createFinding(req, res) {
    try {
      const finding = req.body;
      const query = `
        INSERT INTO intelligence_findings 
        (target_id, source_id, title, content, url, author, published_at, 
         sentiment_score, relevance_score, importance, finding_type, keywords_matched)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;
      
      const values = [
        finding.targetId,
        finding.sourceId,
        finding.title,
        finding.content,
        finding.url,
        finding.author,
        finding.publishedAt || new Date(),
        finding.sentimentScore || 0,
        finding.relevanceScore || 0.5,
        finding.importance || 'medium',
        finding.findingType || 'news',
        finding.keywordsMatched || []
      ];
      
      const result = await pool.query(query, values);
      res.status(201).json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async stopMonitoring(req, res) {
    try {
      const { organizationId, targetIds } = req.body;
      
      // Update targets to inactive
      const query = targetIds 
        ? 'UPDATE intelligence_targets SET active = false WHERE organization_id = $1 AND id = ANY($2)'
        : 'UPDATE intelligence_targets SET active = false WHERE organization_id = $1';
      
      const params = targetIds ? [organizationId, targetIds] : [organizationId];
      await pool.query(query, params);
      
      res.json({ status: 'monitoring_stopped' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = IntelligenceController;