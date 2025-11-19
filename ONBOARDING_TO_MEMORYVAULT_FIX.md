# Onboarding → MemoryVault Flow Fix

## The Core Issue (FIXED)

**You identified the critical problem:** At onboarding, MCP Discovery gives us rich company data, but we were:
1. ❌ Creating a BARE BONES org profile (empty leadership, products, etc.)
2. ❌ NOT using MCP Discovery data to populate it
3. ❌ NOT linking the schema to the org profile in MemoryVault

**Result:** MemoryVault/Playbooks had no company context → NIV Content generated generic content.

---

## The Fix

### 1. Use MCP Discovery Data for Org Profile ✅

**OLD (Bare bones):**
```typescript
const companyProfile = {
  product_lines: serviceLines || [],
  key_markets: geographicFocus || [],
  business_model: '',
  leadership: [],  // EMPTY!
  headquarters: {}, // EMPTY!
  company_size: {}, // EMPTY!
}
```

**NEW (Rich from MCP Discovery):**
```typescript
const companyProfile = {
  // Core data from MCP Discovery
  industry: discovered?.industry || industry,
  sub_industry: discovered?.sub_industry,
  description: discovered?.description,

  // Product lines from GEO + MCP
  product_lines: serviceLines || fullProfile?.service_lines || [],
  key_markets: geographicFocus || fullProfile?.key_markets || [],
  business_model: inferredFromDescription,

  // Strategic context from MCP
  strategic_context: {
    target_customers: fullProfile?.strategic_context?.target_customers,
    brand_personality: fullProfile?.strategic_context?.brand_personality,
    strategic_priorities: fullProfile?.strategic_context?.strategic_priorities
  },

  // Strategic goals (user-defined)
  strategic_goals: strategicGoals,

  // Competitors & stakeholders (reference to intelligence_targets)
  competitors: Array.from(selectedCompetitors),
  stakeholders: Array.from(selectedStakeholders),

  // Leadership/HQ can be filled via schema generation
  leadership: [],
  headquarters: {},
  company_size: {},

  // Track that we have MCP Discovery data
  mcp_discovery_data: {
    discovered_at: new Date().toISOString(),
    has_full_profile: true
  }
}
```

### 2. Schema → Org Profile Link ✅

When schema is generated and saved:

1. **Save schema to content_library** (type: 'schema', folder: 'Schemas')
2. **Update org-profile with schema reference:**

```typescript
// After schema is saved
const updatedProfile = {
  ...existingProfile,
  schema_org_data: {
    has_schema: true,
    generated_at: new Date().toISOString(),
    schema_reference: 'content_library:schema'
  }
}

// This triggers auto-sync to MemoryVault org-profile
await PUT /api/organizations/profile
```

### 3. Auto-Sync to MemoryVault ✅

Every profile update (onboarding or Settings) syncs to MemoryVault:

```typescript
// In /api/organizations/profile PUT handler
await supabase.from('content_library').upsert({
  organization_id: id,
  content_type: 'org-profile',
  title: `${org.name} - Organization Profile`,
  content: JSON.stringify({
    organization_name: org.name,
    industry: org.industry,
    url: org.url,
    company_profile: org.company_profile  // Full MCP Discovery + user edits
  }),
  folder: 'Organization',
  salience_score: 1.0
})
```

---

## Complete Onboarding Flow (After Fix)

```
1. User enters: Name, Website, Industry
         ↓
2. MCP Discovery runs
   - Scrapes website
   - Analyzes competitors, stakeholders
   - Returns full_profile with:
     • industry, sub_industry, description
     • service_lines, key_markets
     • strategic_context
     • competition, stakeholders
         ↓
3. User customizes discovery results
   - Selects competitors
   - Selects stakeholders
   - Adds strategic goals
         ↓
4. POST /api/organizations
   - Creates org with url, industry, size
   - Syncs to content_library (org-profile) ✅
         ↓
5. PUT /api/organizations/profile
   - Saves RICH company_profile from MCP Discovery ✅
   - Includes:
     • industry, sub_industry, description
     • product_lines, key_markets, business_model
     • strategic_context, strategic_goals
     • competitors, stakeholders (references)
     • mcp_discovery_data (timestamp)
   - Auto-syncs to content_library (org-profile) ✅
         ↓
6. Save intelligence_targets
   - Competitors with monitoring_context
   - Stakeholders with relevance_filter
         ↓
7. [OPTIONAL] Schema Generation
   - Scrape website
   - Extract entities (Person, Product, Place)
   - Generate schema.org graph
   - Save to content_library (type: 'schema') ✅
   - Update org profile with schema_reference ✅
   - Auto-sync to MemoryVault ✅
         ↓
8. [OPTIONAL] Generate Profile from Schema
   - Extract leadership from Person entities
   - Extract headquarters from Place entities
   - Extract products from Product entities
   - Merge into company_profile
   - Auto-sync to MemoryVault ✅
```

---

## What MemoryVault Now Has

### content_library table:

```sql
-- Org Profile (auto-synced from organizations.company_profile)
{
  organization_id: "abc-123",
  content_type: "org-profile",
  title: "Acme Corp - Organization Profile",
  folder: "Organization",
  content: {
    organization_name: "Acme Corp",
    industry: "Energy Infrastructure",
    url: "https://acme.com",
    company_profile: {
      // Full MCP Discovery data
      industry: "Energy Infrastructure",
      sub_industry: "Grid Modernization",
      description: "Leading grid infrastructure provider...",
      product_lines: ["Smart Grid Solutions", "Energy Storage"],
      key_markets: ["North America", "Europe"],
      business_model: "B2B Infrastructure",
      strategic_context: {...},
      strategic_goals: [...],
      competitors: ["CompetitorA", "CompetitorB"],
      stakeholders: ["EPA", "FERC"],
      mcp_discovery_data: {
        discovered_at: "2025-01-19T...",
        has_full_profile: true
      },
      schema_org_data: {
        has_schema: true,
        generated_at: "2025-01-19T...",
        schema_reference: "content_library:schema"
      }
    }
  }
}

-- Schema (if generated)
{
  organization_id: "abc-123",
  content_type: "schema",
  title: "Acme Corp - Complete Schema",
  folder: "Schemas",
  content: {
    "@context": "https://schema.org",
    "@graph": [
      {"@type": "Organization", "name": "Acme Corp", ...},
      {"@type": "Person", "name": "Jane Doe", "jobTitle": "CEO"},
      {"@type": "Product", "name": "Smart Grid Platform"}
    ]
  }
}
```

---

## How NIV Content Uses It

```typescript
// 1. NIV Content receives request
"Write a media pitch about our grid modernization products"

// 2. Fetches org profile from organizations table
const { data: orgData } = await supabase
  .from('organizations')
  .select('company_profile, industry')
  .eq('id', organizationId)
  .single()

const companyProfile = {
  ...orgData.company_profile,
  industry: orgData.industry
}

// companyProfile NOW contains:
// - industry: "Energy Infrastructure"
// - sub_industry: "Grid Modernization"
// - product_lines: ["Smart Grid Solutions", "Energy Storage"]
// - strategic_context: { target_customers: "Utilities", ... }
// - competitors: ["CompetitorA", "CompetitorB"]

// 3. Get/Create Playbook (includes company_profile)
const playbook = await getOrCreatePlaybook({
  organizationId,
  contentType: 'media-pitch',
  topic: 'grid modernization'
})

// 4. Format for Claude
**Company Profile:**
Industry: Energy Infrastructure
Products/Services: Smart Grid Solutions, Energy Storage
Key Markets: North America, Europe
Headquarters: Austin, TX
Business Model: B2B Infrastructure

**IMPORTANT:** Use the above company facts in all generated content.
Do not invent product names or company details not listed above.

// 5. Claude generates content WITH proper context ✅
```

---

## Key Differences

### Before Fix:
```
MCP Discovery → Discarded (only used for competitors/stakeholders)
Org Profile → Empty (no products, no context)
MemoryVault → No company data
NIV Content → Generic content, invents fake details
Playbooks → No brand context
```

### After Fix:
```
MCP Discovery → Stored in company_profile ✅
Org Profile → Rich (industry, products, strategic context) ✅
MemoryVault → Has full org-profile ✅
NIV Content → Uses real company data ✅
Playbooks → Includes company context ✅
Schema → Linked to org profile ✅
```

---

## Files Modified

1. **OnboardingOrganizationOnboarding.tsx** (lines 232-278)
   - Use MCP Discovery data to populate company_profile
   - Include industry, sub_industry, description
   - Include strategic_context, strategic_goals
   - Include competitors, stakeholders references

2. **OnboardingOrganizationOnboarding.tsx** (lines 847-910)
   - Save schema to content_library
   - Update org profile with schema_reference
   - Trigger auto-sync to MemoryVault

3. **api/organizations/profile/route.ts** (lines 107-144)
   - Auto-sync company_profile to content_library on every update

4. **api/organizations/update/route.ts** (lines 66-104)
   - Auto-sync org context to content_library when url/industry/size changes

5. **api/organizations/route.ts** (lines 216-251)
   - Auto-sync new org to content_library on creation

---

## Testing Checklist

- [ ] Run onboarding with MCP Discovery
- [ ] Check `organizations.company_profile` has MCP Discovery data
- [ ] Verify `content_library` has org-profile with full context
- [ ] Generate schema, verify schema_reference added to profile
- [ ] Request NIV Content, verify it uses company context
- [ ] Check playbook formatting includes industry, products
- [ ] Edit profile in Settings, verify MemoryVault syncs
- [ ] Verify no duplicate org-profiles in content_library

---

## Summary

**The core principle:** MCP Discovery at onboarding gives us everything we need. We just need to:
1. ✅ Store it in `company_profile` immediately
2. ✅ Sync it to MemoryVault (`content_library`)
3. ✅ Link schema when generated
4. ✅ Keep it synced when user edits

**ONE profile, used everywhere, always in sync.**
