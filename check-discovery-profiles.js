import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDiscoveryProfiles() {
  console.log('Checking existing discovery profiles...\n');
  
  const { data: profiles, error } = await supabase
    .from('mcp_discovery')
    .select('organization_id, organization_name, industry, keywords, competition')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`Found ${profiles.length} discovery profiles:\n`);
  
  profiles.forEach(profile => {
    console.log(`Organization: ${profile.organization_name || profile.organization_id}`);
    console.log(`  ID: ${profile.organization_id}`);
    console.log(`  Industry: ${profile.industry}`);
    console.log(`  Keywords: ${profile.keywords?.slice(0, 5).join(', ')}`);
    console.log(`  Competitors: ${profile.competition?.direct_competitors?.slice(0, 3).join(', ')}`);
    console.log('---');
  });
}

checkDiscoveryProfiles();
