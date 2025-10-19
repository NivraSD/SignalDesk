// Organization Controller - Works for ANY organization (companies, startups, non-profits, etc.)
const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// Create or update organization - works for any company name
exports.createOrganization = async (req, res) => {
  try {
    const { name, url, industry, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Organization name is required' });
    }
    
    console.log('=== CREATING/UPDATING ORGANIZATION ===');
    console.log('Name:', name);
    console.log('Industry:', industry || 'To be determined');
    console.log('URL:', url || 'Not provided');
    
    // Check if organization already exists
    const existingOrg = await pool.query(
      'SELECT id FROM organizations WHERE LOWER(name) = LOWER($1)',
      [name]
    );
    
    let organizationId;
    
    if (existingOrg.rows.length > 0) {
      // Update existing organization
      organizationId = existingOrg.rows[0].id;
      
      await pool.query(`
        UPDATE organizations 
        SET url = COALESCE($2, url),
            industry = COALESCE($3, industry),
            description = COALESCE($4, description),
            updated_at = NOW()
        WHERE id = $1
      `, [organizationId, url, industry, description]);
      
      console.log('Updated existing organization:', organizationId);
      
    } else {
      // Create new organization with proper UUID (not prefixed)
      organizationId = uuidv4(); // Just the UUID, no "org-" prefix
      
      await pool.query(`
        INSERT INTO organizations (id, name, url, industry, description, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      `, [organizationId, name, url, industry, description]);
      
      console.log('Created new organization:', organizationId);
    }
    
    res.json({ 
      success: true,
      organizationId,
      name,
      message: `Organization "${name}" ${existingOrg.rows.length > 0 ? 'updated' : 'created'} successfully`
    });
    
  } catch (error) {
    console.error('Error creating/updating organization:', error);
    res.status(500).json({ 
      error: 'Failed to create organization',
      details: error.message 
    });
  }
};

// Get organization by ID
exports.getOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM organizations WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    res.json({
      success: true,
      organization: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error getting organization:', error);
    res.status(500).json({ error: 'Failed to get organization' });
  }
};

// Create intelligence target (competitor or topic) for any organization
exports.createIntelligenceTarget = async (req, res) => {
  try {
    const { organization_id, name, type, priority, keywords, metadata } = req.body;
    
    if (!organization_id || !name || !type) {
      return res.status(400).json({ 
        error: 'organization_id, name, and type are required' 
      });
    }
    
    console.log(`Creating ${type} target "${name}" for organization ${organization_id}`);
    
    // Generate keywords if not provided
    const targetKeywords = keywords || [
      name.toLowerCase(),
      ...name.toLowerCase().split(' ')
    ];
    
    await pool.query(`
      INSERT INTO intelligence_targets 
      (organization_id, name, type, priority, keywords, metadata, active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
      ON CONFLICT (organization_id, name, type) DO UPDATE SET
        priority = EXCLUDED.priority,
        keywords = EXCLUDED.keywords,
        metadata = EXCLUDED.metadata,
        active = true,
        updated_at = NOW()
    `, [
      organization_id, 
      name, 
      type, 
      priority || 'medium',
      targetKeywords,
      JSON.stringify(metadata || {})
    ]);
    
    res.json({ 
      success: true, 
      message: `${type} target "${name}" created successfully` 
    });
    
  } catch (error) {
    console.error('Error creating intelligence target:', error);
    res.status(500).json({ 
      error: 'Failed to create intelligence target',
      details: error.message 
    });
  }
};

// Get all targets for an organization
exports.getOrganizationTargets = async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    const targets = await pool.query(`
      SELECT * FROM intelligence_targets 
      WHERE organization_id = $1 AND active = true
      ORDER BY type, priority DESC, name
    `, [organizationId]);
    
    const competitors = targets.rows.filter(t => t.type === 'competitor');
    const topics = targets.rows.filter(t => t.type === 'topic');
    const stakeholders = targets.rows.filter(t => t.type === 'stakeholder');
    
    res.json({
      success: true,
      targets: {
        competitors,
        topics,
        stakeholders,
        total: targets.rows.length
      }
    });
    
  } catch (error) {
    console.error('Error getting organization targets:', error);
    res.status(500).json({ error: 'Failed to get organization targets' });
  }
};

// List all organizations (for admin/debugging)
exports.listOrganizations = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.*, 
             COUNT(DISTINCT it.id) as target_count,
             COUNT(DISTINCT CASE WHEN it.type = 'competitor' THEN it.id END) as competitor_count,
             COUNT(DISTINCT CASE WHEN it.type = 'topic' THEN it.id END) as topic_count
      FROM organizations o
      LEFT JOIN intelligence_targets it ON it.organization_id = o.id AND it.active = true
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);
    
    res.json({
      success: true,
      organizations: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    console.error('Error listing organizations:', error);
    res.status(500).json({ error: 'Failed to list organizations' });
  }
};

module.exports = exports;