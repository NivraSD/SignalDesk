const express = require('express');
const router = express.Router();
const { pool } = require('../server');

// Get opportunities for an organization
router.get('/organization/:orgId', async (req, res) => {
  try {
    const { status, urgency, limit = 20 } = req.query;
    
    let query = `
      SELECT * FROM opportunities 
      WHERE organization_id = $1
    `;
    
    const params = [req.params.orgId];
    let paramIndex = 2;
    
    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (urgency) {
      query += ` AND urgency = $${paramIndex}`;
      params.push(urgency);
      paramIndex++;
    }
    
    query += ` ORDER BY nvs_score DESC, created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single opportunity
router.get('/:id', async (req, res) => {
  try {
    const query = `
      SELECT o.*, 
        array_agg(DISTINCT f.*) as supporting_findings
      FROM opportunities o
      LEFT JOIN intelligence_findings f ON f.id = ANY(o.supporting_findings)
      WHERE o.id = $1
      GROUP BY o.id
    `;
    const result = await pool.query(query, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update opportunity status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const query = `
      UPDATE opportunities 
      SET status = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [req.params.id, status]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Auto-identify opportunities
router.post('/identify', async (req, res) => {
  try {
    const { organizationId } = req.body;
    
    // Call stored procedure to identify opportunities
    await pool.query('SELECT identify_opportunities($1)', [organizationId]);
    
    // Get newly identified opportunities
    const result = await pool.query(`
      SELECT * FROM opportunities 
      WHERE organization_id = $1 
        AND status = 'identified'
        AND created_at > NOW() - INTERVAL '1 minute'
      ORDER BY nvs_score DESC
    `, [organizationId]);
    
    res.json({
      identified: result.rows.length,
      opportunities: result.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;