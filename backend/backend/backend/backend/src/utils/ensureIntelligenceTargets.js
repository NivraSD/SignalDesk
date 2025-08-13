/**
 * Helper to ensure intelligence targets are properly configured
 * This fixes the org-xxx ID issue by ensuring proper names are stored
 */

const pool = require('../config/db');

async function ensureIntelligenceTargets(organizationId) {
  console.log('🔧 Ensuring intelligence targets for:', organizationId);
  
  try {
    // Check if any targets exist
    const existing = await pool.query(
      'SELECT * FROM intelligence_targets WHERE organization_id = $1',
      [organizationId]
    );
    
    if (existing.rows.length === 0) {
      console.log('📝 No intelligence targets found. Creating defaults...');
      
      // Try to get organization info
      let orgName = null;
      let industry = 'Technology';
      
      try {
        // Handle both UUID and string organization IDs
        let orgResult;
        
        // Check if organizationId looks like a UUID
        if (organizationId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          // It's a UUID
          orgResult = await pool.query(
            'SELECT name, industry FROM organizations WHERE id = $1',
            [organizationId]
          );
        } else {
          // It's a string ID like 'org-xxxxx' - check as text
          orgResult = await pool.query(
            'SELECT name, industry FROM organizations WHERE id::text = $1',
            [organizationId]
          );
        }
        
        if (orgResult.rows.length > 0) {
          orgName = orgResult.rows[0].name;
          industry = orgResult.rows[0].industry || 'Technology';
        }
      } catch (e) {
        console.log('Could not fetch organization details');
      }
      
      // Create default competitors based on industry or common patterns
      const defaultTargets = [];
      
      // Add some default competitors
      if (industry.toLowerCase().includes('event')) {
        defaultTargets.push(
          { name: 'Eventbrite', type: 'competitor', priority: 'high' },
          { name: 'Cvent', type: 'competitor', priority: 'high' },
          { name: 'Bizzabo', type: 'competitor', priority: 'medium' }
        );
      } else if (industry.toLowerCase().includes('cloud')) {
        defaultTargets.push(
          { name: 'AWS', type: 'competitor', priority: 'high' },
          { name: 'Microsoft Azure', type: 'competitor', priority: 'high' },
          { name: 'Google Cloud', type: 'competitor', priority: 'medium' }
        );
      } else {
        // Generic tech competitors
        defaultTargets.push(
          { name: 'Microsoft', type: 'competitor', priority: 'medium' },
          { name: 'Google', type: 'competitor', priority: 'medium' }
        );
      }
      
      // Add default topics
      defaultTargets.push(
        { name: 'Digital Transformation', type: 'topic', priority: 'high' },
        { name: 'AI and Machine Learning', type: 'topic', priority: 'high' },
        { name: 'Cybersecurity', type: 'topic', priority: 'medium' },
        { name: 'Market Trends', type: 'topic', priority: 'medium' }
      );
      
      // Insert defaults
      for (const target of defaultTargets) {
        await pool.query(
          `INSERT INTO intelligence_targets 
           (organization_id, name, type, priority, keywords, active)
           VALUES ($1, $2, $3, $4, $5, true)
           ON CONFLICT DO NOTHING`,
          [
            organizationId,
            target.name,
            target.type,
            target.priority,
            JSON.stringify([target.name.toLowerCase()])
          ]
        );
      }
      
      console.log('✅ Created', defaultTargets.length, 'default intelligence targets');
    } else {
      console.log('✅ Found', existing.rows.length, 'existing intelligence targets');
      
      // Fix any targets that have org-xxx style names
      for (const target of existing.rows) {
        if (target.name && target.name.startsWith('org-')) {
          console.log('🔧 Fixing target with ID-like name:', target.name);
          
          // Try to infer a better name based on type
          let betterName = target.name;
          
          if (target.type === 'competitor') {
            // For competitors, we need real names - can't fix automatically
            console.log('⚠️ Competitor has ID name - needs manual update:', target.name);
          } else if (target.type === 'topic') {
            // Topics should have descriptive names
            betterName = 'Industry Trends';
          }
          
          if (betterName !== target.name) {
            await pool.query(
              'UPDATE intelligence_targets SET name = $1 WHERE id = $2',
              [betterName, target.id]
            );
            console.log('✅ Updated target name to:', betterName);
          }
        }
      }
    }
    
    // Return the current targets
    const finalTargets = await pool.query(
      `SELECT * FROM intelligence_targets 
       WHERE organization_id = $1 AND active = true
       ORDER BY type, priority DESC`,
      [organizationId]
    );
    
    return finalTargets.rows;
    
  } catch (error) {
    console.error('Error ensuring intelligence targets:', error);
    return [];
  }
}

// Also export a function to fix organization names in the config
async function fixOrganizationName(organizationId) {
  console.log('🔧 Checking organization name for:', organizationId);
  
  try {
    // First check if it exists in organizations table
    let orgResult = { rows: [] };
    
    // Organizations table uses UUID, but we have string IDs
    // For string IDs like 'org-xxxxx', we'll create a new organization entry
    if (!organizationId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      // Not a UUID, it's a string ID - check if we already created an entry
      orgResult = await pool.query(
        `SELECT name, industry FROM organizations WHERE name = $1`,
        [organizationId]
      );
    } else {
      // It's a UUID
      orgResult = await pool.query(
        'SELECT name, industry FROM organizations WHERE id = $1',
        [organizationId]
      );
    }
    
    if (orgResult.rows.length > 0) {
      const org = orgResult.rows[0];
      
      // Check if name is an ID
      if (org.name && (org.name.startsWith('org-') || org.name === organizationId)) {
        console.log('⚠️ Organization has ID as name. Inferring from context...');
        
        // Get competitors to infer industry
        const competitors = await pool.query(
          `SELECT name FROM intelligence_targets 
           WHERE organization_id = $1 AND type = 'competitor' AND active = true`,
          [organizationId]
        );
        
        let inferredName = 'Your Organization';
        let inferredIndustry = 'Technology';
        
        if (competitors.rows.length > 0) {
          const compNames = competitors.rows.map(r => r.name.toLowerCase());
          
          if (compNames.some(n => n.includes('eventbrite') || n.includes('cvent'))) {
            inferredName = 'Event Management Company';
            inferredIndustry = 'Event Technology';
          } else if (compNames.some(n => n.includes('aws') || n.includes('azure'))) {
            inferredName = 'Cloud Services Company';
            inferredIndustry = 'Cloud Computing';
          } else if (compNames.some(n => n.includes('shopify') || n.includes('woocommerce'))) {
            inferredName = 'E-commerce Platform';
            inferredIndustry = 'E-commerce';
          }
        }
        
        // Update the organization
        await pool.query(
          'UPDATE organizations SET name = $1, industry = $2 WHERE id = $3',
          [inferredName, inferredIndustry, organizationId]
        );
        
        console.log('✅ Updated organization:', inferredName, '/', inferredIndustry);
        return { name: inferredName, industry: inferredIndustry };
      }
      
      return org;
    } else {
      // Organization doesn't exist - create it with inferred data
      console.log('📝 Organization not found. Creating with inferred data...');
      
      // Get any existing targets to infer from
      const targets = await pool.query(
        'SELECT * FROM intelligence_targets WHERE organization_id = $1',
        [organizationId]
      );
      
      let name = 'Your Organization';
      let industry = 'Technology';
      
      if (targets.rows.length > 0) {
        const competitors = targets.rows.filter(t => t.type === 'competitor');
        if (competitors.length > 0) {
          // Infer based on competitors
          const compNames = competitors.map(c => c.name.toLowerCase());
          
          if (compNames.some(n => n.includes('event'))) {
            name = 'Event Management Company';
            industry = 'Event Technology';
          } else if (compNames.some(n => n.includes('cloud'))) {
            name = 'Cloud Services Company';
            industry = 'Cloud Computing';
          }
        }
      }
      
      // Create the organization - handle UUID vs string ID
      if (organizationId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        // It's a UUID
        await pool.query(
          'INSERT INTO organizations (id, name, industry) VALUES ($1, $2, $3)',
          [organizationId, name, industry]
        );
      } else {
        // It's a string ID - create with a generated UUID but store the string ID as the name initially
        await pool.query(
          'INSERT INTO organizations (name, industry) VALUES ($1, $2)',
          [name, industry]
        );
      }
      
      console.log('✅ Created organization:', name, '/', industry);
      return { name, industry };
    }
  } catch (error) {
    console.error('Error fixing organization name:', error);
    return null;
  }
}

module.exports = {
  ensureIntelligenceTargets,
  fixOrganizationName
};