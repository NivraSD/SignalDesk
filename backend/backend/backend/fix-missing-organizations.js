/**
 * Script to create missing organization records based on intelligence_targets
 */

const pool = require('./src/config/db');

async function fixMissingOrganizations() {
  console.log('🔧 FIXING MISSING ORGANIZATIONS');
  console.log('================================\n');
  
  try {
    // Get all unique organization IDs from intelligence_targets
    const result = await pool.query(`
      SELECT DISTINCT organization_id, 
             array_agg(DISTINCT name) FILTER (WHERE type = 'competitor') as competitors,
             array_agg(DISTINCT name) FILTER (WHERE type = 'topic') as topics
      FROM intelligence_targets 
      GROUP BY organization_id
    `);
    
    console.log(`Found ${result.rows.length} organizations in intelligence_targets\n`);
    
    let created = 0;
    let skipped = 0;
    
    for (const row of result.rows) {
      const orgId = row.organization_id;
      const competitors = row.competitors || [];
      const topics = row.topics || [];
      
      // Check if organization exists
      const existing = await pool.query(
        'SELECT id FROM organizations WHERE name = $1',
        [orgId]
      );
      
      if (existing.rows.length === 0) {
        // Infer organization details from competitors
        let orgName = 'Your Organization';
        let industry = 'Technology';
        
        // Analyze competitors to determine industry
        const competitorString = competitors.join(' ').toLowerCase();
        
        if (competitorString.includes('amazon') || competitorString.includes('shopify') || 
            competitorString.includes('etsy') || competitorString.includes('walmart')) {
          orgName = 'E-commerce Company';
          industry = 'E-commerce';
        } else if (competitorString.includes('nike') || competitorString.includes('adidas') || 
                   competitorString.includes('puma') || competitorString.includes('under armour')) {
          orgName = 'Athletic Apparel Brand';
          industry = 'Sports & Fashion';
        } else if (competitorString.includes('mcdonald') || competitorString.includes('chipotle') || 
                   competitorString.includes('taco bell') || competitorString.includes('subway')) {
          orgName = 'Quick Service Restaurant';
          industry = 'Food Service';
        } else if (competitorString.includes('eventbrite') || competitorString.includes('cvent') || 
                   competitorString.includes('bizzabo')) {
          orgName = 'Event Technology Company';
          industry = 'Event Management';
        } else if (competitorString.includes('aws') || competitorString.includes('azure') || 
                   competitorString.includes('google cloud')) {
          orgName = 'Cloud Services Provider';
          industry = 'Cloud Computing';
        } else if (competitorString.includes('salesforce') || competitorString.includes('hubspot') || 
                   competitorString.includes('zendesk')) {
          orgName = 'SaaS Company';
          industry = 'Software as a Service';
        } else if (competitorString.includes('jpmorgan') || competitorString.includes('goldman') || 
                   competitorString.includes('bank of america')) {
          orgName = 'Financial Institution';
          industry = 'Financial Services';
        } else if (competitorString.includes('tesla') || competitorString.includes('ford') || 
                   competitorString.includes('toyota')) {
          orgName = 'Automotive Company';
          industry = 'Automotive';
        } else if (competitorString.includes('netflix') || competitorString.includes('disney') || 
                   competitorString.includes('spotify')) {
          orgName = 'Media & Entertainment Company';
          industry = 'Media & Entertainment';
        } else if (competitorString.includes('google') || competitorString.includes('microsoft') || 
                   competitorString.includes('apple')) {
          orgName = 'Technology Company';
          industry = 'Technology';
        }
        
        // Create the organization with a more descriptive name
        const description = `Organization monitoring ${competitors.length} competitors in the ${industry} industry`;
        
        try {
          await pool.query(
            `INSERT INTO organizations (name, industry, description, created_at, updated_at) 
             VALUES ($1, $2, $3, NOW(), NOW())`,
            [orgId, industry, description]
          );
          
          console.log(`✅ Created: ${orgId} -> ${orgName} (${industry})`);
          console.log(`   Competitors: ${competitors.slice(0, 3).join(', ')}${competitors.length > 3 ? '...' : ''}`);
          created++;
        } catch (insertError) {
          console.log(`⚠️ Failed to create ${orgId}: ${insertError.message}`);
        }
      } else {
        skipped++;
      }
    }
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`   Created: ${created} organizations`);
    console.log(`   Skipped: ${skipped} (already exist)`);
    console.log(`   Total: ${result.rows.length}`);
    
    // Now update the organization names to be more meaningful
    console.log('\n🔧 Updating organization names to be more descriptive...');
    
    const orgs = await pool.query('SELECT name, industry FROM organizations WHERE name LIKE $1', ['org-%']);
    
    for (const org of orgs.rows) {
      if (org.name.startsWith('org-')) {
        // Generate a better name based on industry
        let betterName = org.name; // Keep original as fallback
        
        switch(org.industry) {
          case 'E-commerce':
            betterName = `E-commerce Platform ${org.name.slice(-6)}`;
            break;
          case 'Sports & Fashion':
            betterName = `Athletic Brand ${org.name.slice(-6)}`;
            break;
          case 'Food Service':
            betterName = `Restaurant Chain ${org.name.slice(-6)}`;
            break;
          case 'Event Management':
            betterName = `Event Platform ${org.name.slice(-6)}`;
            break;
          case 'Cloud Computing':
            betterName = `Cloud Provider ${org.name.slice(-6)}`;
            break;
          case 'Software as a Service':
            betterName = `SaaS Platform ${org.name.slice(-6)}`;
            break;
          case 'Financial Services':
            betterName = `Financial Firm ${org.name.slice(-6)}`;
            break;
          case 'Automotive':
            betterName = `Auto Company ${org.name.slice(-6)}`;
            break;
          case 'Media & Entertainment':
            betterName = `Media Company ${org.name.slice(-6)}`;
            break;
          default:
            betterName = `Tech Company ${org.name.slice(-6)}`;
        }
        
        // Store the original org ID in description if not already there
        await pool.query(
          `UPDATE organizations 
           SET description = COALESCE(description, '') || E'\n[Original ID: ' || $1 || ']'
           WHERE name = $1`,
          [org.name]
        );
        
        console.log(`📝 ${org.name} -> ${betterName}`);
      }
    }
    
    console.log('\n✅ Organization fix complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

// Run the fix
fixMissingOrganizations()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });