# MemoryVault Organization Profile Sync

## The Critical Issue (FIXED)

**Problem:** Organization profile data was saved to `organizations.company_profile` BUT never synced to MemoryVault (`content_library`). This meant:
- NIV Content and Playbooks couldn't access company context
- Content generation happened without knowing company details
- Every content request failed to get leadership, products, industry info

## The Solution

**Single Source of Truth with Automatic Sync:**

```
organizations.company_profile (PRIMARY)
         ↓
    (auto-sync)
         ↓
content_library (content_type: 'org-profile')
         ↓
    NIV Content / Playbooks
```

### What Gets Synced

Every time the org profile changes, we save to BOTH:

1. **organizations table** (user-editable via Settings):
   - `url`, `industry`, `size` (top-level columns)
   - `company_profile` JSONB (leadership, headquarters, products, etc.)

2. **content_library** (MemoryVault intelligence feed):
   - `content_type: 'org-profile'`
   - `folder: 'Organization'`
   - Full org context in `content` field
   - Metadata with quick-access fields

### Sync Points (All Implemented)

**1. Organization Creation** (`POST /api/organizations`)
```typescript
// After creating org
await serviceClient.from('content_library').insert({
  organization_id: org.id,
  content_type: 'org-profile',
  title: `${org.name} - Organization Profile`,
  content: JSON.stringify({
    organization_name: org.name,
    industry: org.industry,
    url: org.url,
    size: org.size,
    company_profile: org.company_profile
  }),
  folder: 'Organization',
  salience_score: 1.0
})
```

**2. Settings About Tab Update** (`PUT /api/organizations/update`)
```typescript
// After updating url/industry/size
await supabase.from('content_library').upsert({
  organization_id: id,
  content_type: 'org-profile',
  // ... same structure
}, {
  onConflict: 'organization_id,content_type'
})
```

**3. Settings Profile Tab Update** (`PUT /api/organizations/profile`)
```typescript
// After updating company_profile
await supabase.from('content_library').upsert({
  organization_id: id,
  content_type: 'org-profile',
  // ... same structure
}, {
  onConflict: 'organization_id,content_type'
})
```

## How NIV Content Uses It

From `niv-content-intelligent-v2/index.ts`:

```typescript
// 1. Fetch company profile
const { data: orgData } = await supabase
  .from('organizations')
  .select('company_profile, industry')
  .eq('id', organizationId)
  .single()

const companyProfile = {
  ...orgData?.company_profile,
  industry: orgData.industry
}

// 2. Get or create playbook (includes company context)
const playbook = await getOrCreatePlaybook({
  organizationId,
  contentType,
  topic
})

// 3. Format for Claude (lines 150-178)
function formatPlaybookForClaude(playbook, contentType, topic, companyProfile) {
  let formatted = `**Company Profile:**\n`
  if (companyProfile.industry) {
    formatted += `Industry: ${companyProfile.industry}\n`
  }
  if (companyProfile.leadership) {
    formatted += `Leadership: ${companyProfile.leadership.map(l =>
      `${l.name} (${l.title})`
    ).join(', ')}\n`
  }
  if (companyProfile.product_lines) {
    formatted += `Products/Services: ${companyProfile.product_lines.join(', ')}\n`
  }
  // ... etc
}
```

## Data Flow (Complete Picture)

### Onboarding Flow
```
1. User enters: Name, Website, Industry
         ↓
2. POST /api/organizations
   - Creates org in organizations table
   - Saves url, industry, size to TOP-LEVEL columns ✅
   - Saves description to company_profile JSONB
   - SYNCS to content_library as 'org-profile' ✅
         ↓
3. MCP Discovery (optional)
   - Scrapes website
   - Generates schema.org data
   - Saves to content_library as 'schema'
         ↓
4. Auto-generate profile (optional)
   - Reads schema from content_library
   - Extracts leadership, products, etc.
   - Updates organizations.company_profile
   - RE-SYNCS to content_library 'org-profile' ✅
```

### Settings Update Flow
```
User opens Settings → About Tab
         ↓
1. GET /api/organizations?id=xxx
   - Returns url, industry, size from top-level
         ↓
2. User edits and saves
         ↓
3. PUT /api/organizations/update
   - Updates organizations table
   - SYNCS to content_library 'org-profile' ✅
```

```
User opens Settings → Profile Tab
         ↓
1. GET /api/organizations/profile?id=xxx
   - Returns company_profile JSONB
         ↓
2. User edits leadership, products, goals
         ↓
3. PUT /api/organizations/profile
   - Updates organizations.company_profile
   - SYNCS to content_library 'org-profile' ✅
```

### Content Generation Flow
```
User requests: "Write a media pitch about our energy products"
         ↓
1. NIV Content receives request
         ↓
2. Infers topic: "energy"
         ↓
3. getOrCreatePlaybook('media-pitch', 'energy')
   - Fetches company_profile from organizations ✅
   - Checks for cached playbook in playbooks table
   - Formats company context for Claude
         ↓
4. Claude receives:
   - Playbook guidance (proven hooks, structure)
   - Company context (industry, products, leadership)
   - Research data
         ↓
5. Generates content WITH proper company context ✅
```

## Database Schema

### content_library (org-profile entries)

```sql
SELECT * FROM content_library WHERE content_type = 'org-profile';

| id   | organization_id | content_type | title                           | content               | folder       | salience_score |
|------|-----------------|--------------|--------------------------------|----------------------|--------------|----------------|
| xxx  | abc-123         | org-profile  | Acme Corp - Organization Profile | {"organization_name"...} | Organization | 1.0            |
```

### Unique Constraint

```sql
-- Ensures only ONE org-profile per organization
-- Allows upsert to update existing instead of creating duplicates
UNIQUE (organization_id, content_type)
```

## Why This Matters

**Before Fix:**
```
❌ NIV Content: "I don't know your company details"
❌ Playbooks: Generic content, no brand context
❌ Leadership: AI invents fake executives
❌ Products: AI guesses what you sell
```

**After Fix:**
```
✅ NIV Content: "Based on your {industry} focus and {products}..."
✅ Playbooks: Include actual company context
✅ Leadership: Use real names/titles from profile
✅ Products: Reference actual product lines
```

## Testing Checklist

- [ ] Create new org via onboarding → Check content_library has org-profile
- [ ] Edit About tab (url/industry) → Verify content_library updates
- [ ] Edit Profile tab (leadership/products) → Verify content_library updates
- [ ] Request NIV Content → Verify it uses company context
- [ ] Check playbook formatting → Should include company profile
- [ ] Verify no duplicates in content_library (unique constraint works)

## Key Files Modified

1. `/src/app/api/organizations/route.ts` - POST adds MemoryVault sync
2. `/src/app/api/organizations/update/route.ts` - PUT adds MemoryVault sync
3. `/src/app/api/organizations/profile/route.ts` - PUT adds MemoryVault sync

## Architecture Decision

**Why not just read from organizations table in NIV?**

We COULD skip content_library and have NIV read directly from organizations. But:

1. **Consistency**: All intelligence data flows through MemoryVault
2. **Caching**: content_library has salience_score, access_count optimization
3. **Discoverability**: Org profile shows up in MemoryVault UI
4. **Extensibility**: Easy to add org-related content (brand guidelines, etc.)
5. **Playbooks**: Already integrated with content_library ecosystem

**The sync is cheap (one upsert) and keeps architecture clean.**
