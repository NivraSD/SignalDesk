const express = require('express');
const router = express.Router();
const stakeholderIntelligenceController = require('../controllers/stakeholderIntelligenceController');

// Organization management
router.post('/organization', stakeholderIntelligenceController.createOrganization);

// Stakeholder discovery and suggestions
router.post('/suggestions', stakeholderIntelligenceController.generateStakeholderSuggestions);
router.post('/discover-sources', stakeholderIntelligenceController.discoverStakeholderSources);
router.post('/validate-source', stakeholderIntelligenceController.validateSource);

// Stakeholder configuration
router.post('/configure', stakeholderIntelligenceController.saveStakeholderConfiguration);

// Monitoring and intelligence
router.get('/monitoring/:organizationId', stakeholderIntelligenceController.getStakeholderMonitoring);
router.post('/scan', stakeholderIntelligenceController.runMonitoringScan);

// Pre-indexed stakeholder lookup
router.get('/pre-indexed/:name', async (req, res) => {
  try {
    const pool = require('../config/db');
    const { name } = req.params;
    
    const [results] = await pool.execute(
      `SELECT * FROM pre_indexed_stakeholders 
       WHERE name LIKE ? OR JSON_CONTAINS(aliases, ?)
       LIMIT 10`,
      [`%${name}%`, JSON.stringify(name)]
    );
    
    res.json({
      success: true,
      stakeholders: results
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to lookup pre-indexed stakeholder' });
  }
});

// Intelligence findings management
router.get('/findings/:organizationId', async (req, res) => {
  try {
    const pool = require('../config/db');
    const { organizationId } = req.params;
    const { limit = 50, offset = 0, unreadOnly = false } = req.query;
    
    let query = `
      SELECT if.*, sg.name as stakeholder_name, ss.name as source_name
      FROM intelligence_findings if
      JOIN stakeholder_groups sg ON if.stakeholder_group_id = sg.id
      LEFT JOIN stakeholder_sources ss ON if.stakeholder_source_id = ss.id
      WHERE sg.organization_id = ? AND if.is_archived = FALSE
    `;
    
    if (unreadOnly === 'true') {
      query += ' AND if.is_read = FALSE';
    }
    
    query += ' ORDER BY if.discovered_at DESC LIMIT ? OFFSET ?';
    
    const [findings] = await pool.execute(query, [organizationId, parseInt(limit), parseInt(offset)]);
    
    res.json({
      success: true,
      findings: findings
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get intelligence findings' });
  }
});

// Mark finding as read
router.put('/findings/:findingId/read', async (req, res) => {
  try {
    const pool = require('../config/db');
    const { findingId } = req.params;
    
    await pool.execute(
      'UPDATE intelligence_findings SET is_read = TRUE WHERE id = ?',
      [findingId]
    );
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark finding as read' });
  }
});

// Archive finding
router.put('/findings/:findingId/archive', async (req, res) => {
  try {
    const pool = require('../config/db');
    const { findingId } = req.params;
    
    await pool.execute(
      'UPDATE intelligence_findings SET is_archived = TRUE WHERE id = ?',
      [findingId]
    );
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to archive finding' });
  }
});

// Get stakeholder predictions
router.get('/predictions/:organizationId', async (req, res) => {
  try {
    const pool = require('../config/db');
    const { organizationId } = req.params;
    
    const [predictions] = await pool.execute(
      `SELECT sp.*, sg.name as stakeholder_name
       FROM stakeholder_predictions sp
       JOIN stakeholder_groups sg ON sp.stakeholder_group_id = sg.id
       WHERE sg.organization_id = ? AND sp.is_active = TRUE
       ORDER BY sp.confidence_score DESC`,
      [organizationId]
    );
    
    res.json({
      success: true,
      predictions: predictions
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get predictions' });
  }
});

// Get recommended actions
router.get('/actions/:organizationId', async (req, res) => {
  try {
    const pool = require('../config/db');
    const { organizationId } = req.params;
    const { status = 'pending' } = req.query;
    
    const [actions] = await pool.execute(
      `SELECT sa.*, sg.name as stakeholder_name
       FROM stakeholder_actions sa
       JOIN stakeholder_groups sg ON sa.stakeholder_group_id = sg.id
       WHERE sg.organization_id = ? AND sa.status = ?
       ORDER BY sa.priority DESC, sa.due_date ASC`,
      [organizationId, status]
    );
    
    res.json({
      success: true,
      actions: actions
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get recommended actions' });
  }
});

// Update action status
router.put('/actions/:actionId', async (req, res) => {
  try {
    const pool = require('../config/db');
    const { actionId } = req.params;
    const { status, notes, assignedTo } = req.body;
    
    let updateFields = [];
    let values = [];
    
    if (status) {
      updateFields.push('status = ?');
      values.push(status);
      if (status === 'completed') {
        updateFields.push('completed_at = NOW()');
      }
    }
    
    if (notes !== undefined) {
      updateFields.push('notes = ?');
      values.push(notes);
    }
    
    if (assignedTo !== undefined) {
      updateFields.push('assigned_to = ?');
      values.push(assignedTo);
    }
    
    values.push(actionId);
    
    await pool.execute(
      `UPDATE stakeholder_actions SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update action' });
  }
});

// Dashboard summary
router.get('/dashboard/:organizationId', async (req, res) => {
  try {
    const pool = require('../config/db');
    const { organizationId } = req.params;
    
    // Get stakeholder summary
    const [stakeholderStats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_stakeholders,
        SUM(CASE WHEN priority = 'critical' THEN 1 ELSE 0 END) as critical_stakeholders,
        SUM(CASE WHEN current_sentiment >= 7 THEN 1 ELSE 0 END) as positive_sentiment,
        SUM(CASE WHEN current_sentiment < 5 THEN 1 ELSE 0 END) as negative_sentiment,
        AVG(current_sentiment) as avg_sentiment
       FROM stakeholder_groups
       WHERE organization_id = ?`,
      [organizationId]
    );
    
    // Get findings summary
    const [findingsStats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_findings,
        SUM(CASE WHEN is_read = FALSE THEN 1 ELSE 0 END) as unread_findings,
        SUM(CASE WHEN type = 'opportunity' THEN 1 ELSE 0 END) as opportunities,
        SUM(CASE WHEN type = 'risk' THEN 1 ELSE 0 END) as risks
       FROM intelligence_findings if
       JOIN stakeholder_groups sg ON if.stakeholder_group_id = sg.id
       WHERE sg.organization_id = ? AND if.is_archived = FALSE
         AND if.discovered_at > DATE_SUB(NOW(), INTERVAL 30 DAY)`,
      [organizationId]
    );
    
    // Get pending actions count
    const [actionStats] = await pool.execute(
      `SELECT 
        COUNT(*) as pending_actions,
        SUM(CASE WHEN priority = 'critical' THEN 1 ELSE 0 END) as critical_actions
       FROM stakeholder_actions sa
       JOIN stakeholder_groups sg ON sa.stakeholder_group_id = sg.id
       WHERE sg.organization_id = ? AND sa.status = 'pending'`,
      [organizationId]
    );
    
    res.json({
      success: true,
      summary: {
        stakeholders: stakeholderStats[0],
        findings: findingsStats[0],
        actions: actionStats[0]
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard summary' });
  }
});

module.exports = router;