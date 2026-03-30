import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zskaxjtyuaqazydouifp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpza2F4anR5dWFxYXp5ZG91aWZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEyOTYzNywiZXhwIjoyMDcwNzA1NjM3fQ.WO35k7riuKT2QXj_YvbtRwzLwi3Pev30-X9Yziej2pM'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkMitsui() {
  // Check organizations table
  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .ilike('name', '%mitsui%')
    .order('created_at', { ascending: false })

  console.log('\n=== ORGANIZATIONS TABLE ===')
  if (orgError) {
    console.error('Error:', orgError)
  } else {
    console.log(`Found ${orgs.length} Mitsui organizations:`)
    orgs.forEach(org => {
      console.log(`\nID: ${org.id}`)
      console.log(`Name: ${org.name}`)
      console.log(`Industry: ${org.industry}`)
      console.log(`URL: ${org.url}`)
      console.log(`Size: ${org.size}`)
      console.log(`Created: ${org.created_at}`)
      console.log(`Company Profile Keys:`, Object.keys(org.company_profile || {}))
      if (org.company_profile) {
        console.log(`  - industry: ${org.company_profile.industry}`)
        console.log(`  - sub_industry: ${org.company_profile.sub_industry}`)
        console.log(`  - product_lines:`, org.company_profile.product_lines)
        console.log(`  - mcp_discovery_data:`, org.company_profile.mcp_discovery_data)
      }
    })
  }

  if (orgs && orgs.length > 0) {
    // Check content_library (MemoryVault)
    const { data: memVault, error: mvError } = await supabase
      .from('content_library')
      .select('*')
      .eq('organization_id', orgs[0].id)
      .eq('content_type', 'org-profile')

    console.log('\n=== MEMORY VAULT (content_library) ===')
    if (mvError) {
      console.error('Error:', mvError)
    } else {
      console.log(`Found ${memVault.length} org-profile entries:`)
      memVault.forEach(entry => {
        console.log(`\nTitle: ${entry.title}`)
        console.log(`Folder: ${entry.folder}`)
        console.log(`Created: ${entry.created_at}`)
        const content = JSON.parse(entry.content)
        console.log(`Content Keys:`, Object.keys(content))
        if (content.company_profile) {
          console.log(`Company Profile Keys:`, Object.keys(content.company_profile))
          console.log(`  - industry: ${content.company_profile.industry}`)
          console.log(`  - sub_industry: ${content.company_profile.sub_industry}`)
          console.log(`  - product_lines:`, content.company_profile.product_lines)
        }
      })
    }
  }
}

checkMitsui()
