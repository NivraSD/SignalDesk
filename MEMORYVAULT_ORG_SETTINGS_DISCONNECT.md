# MemoryVault / Org Settings Disconnect Analysis

## The Core Problem

There's a **fundamental architectural disconnect** between how organizational data flows through the system during onboarding vs. how it's accessed in org settings.

---

## Current Data Flow (BROKEN)

### 1. Onboarding Flow
```
User enters:
  - Organization Name
  - Website URL
  - Industry
       ↓
POST /api/organizations
  → Creates org record with url, industry, size (NOW FIXED)
       ↓
MCP Discovery Pipeline:
  → website-entity-scraper
  → entity-extractor-v2
  → entity-enrichment
  → schema-synthesis
       ↓
Schema saved to content_library:
  - content_type: 'schema'
  - folder: 'Schemas'
  - content: { @graph: [...], @context: "schema.org" }
       ↓
Auto-generate company profile:
  → POST /api/organizations/generate-profile
  → Reads schema from content_library
  → Extracts leadership, headquarters, products
  → Saves to organizations.company_profile JSONB
```

### 2. Org Settings Flow
```
User opens Settings → About tab:
  → GET /api/organizations?id=xxx
  → Returns: url, industry, size from TOP-LEVEL columns ✅
  → User can edit and save ✅

User opens Settings → Profile tab:
  → GET /api/organizations/profile?id=xxx
  → Returns: organizations.company_profile JSONB
  → Shows: leadership, headquarters, product_lines, etc.

User clicks "Generate from Schema":
  → POST /api/organizations/generate-profile
  → Searches content_library for schema
  → IF FOUND: Extracts data, populates company_profile ✅
  → IF NOT FOUND: ERROR "No schema found" ❌
```

---

## The Disconnect Issues

### Issue #1: **Schema Availability**
**Problem:** The "Generate from Schema" button in Settings assumes a schema exists in `content_library`, but:
- User may have created org manually (no onboarding)
- Schema generation may have failed during onboarding
- content_library table is currently EMPTY (verified)

**Impact:** Button doesn't work, user sees error message

### Issue #2: **Data Duplication & Confusion**
**Problem:** Company data exists in MULTIPLE places:
1. `organizations.url` / `industry` / `size` (basic About fields)
2. `organizations.company_profile` (detailed profile JSONB)
3. `content_library` (schema.org structured data)
4. `organization_profiles` (MCP discovery profile data)
5. API update endpoint tries to update `memory_vault` (which doesn't exist!)

**Impact:** User confusion about which data source is "correct"

### Issue #3: **One-Way Data Flow**
**Problem:** Data flows FROM schema TO company_profile, but:
- If user manually edits company_profile in Settings, it doesn't update the schema
- If schema is regenerated, it overwrites manual edits
- No conflict resolution or merge logic

**Impact:** Lost user edits, data inconsistency

### Issue #4: **Missing "memory_vault" Table**
**Problem:** The code references `memory_vault` table (from docs) but:
- Table doesn't actually exist in database
- Only `content_library` exists
- Update endpoint tries to upsert to non-existent table

**Impact:** Silent failures in memory_vault updates

### Issue #5: **No Schema Extraction UI**
**Problem:** Settings "About" tab has no way to:
- Trigger schema extraction
- View current schema
- Update schema
- Re-run schema pipeline

**Impact:** User must go through full onboarding to generate schema

---

## What the Documentation Says

From `SIGNALDESK_V3_SYSTEM_STATUS.md`:

> **Memory Vault V2** is SignalDesk's centralized content intelligence and persistence layer

Key claims:
- "Playbook Intelligence System" with pre-synthesized guides
- "Voyage AI Embeddings" for semantic search
- "Brand Context Management" with sub-ms lookup
- Integration with `niv-memory-vault` edge function

**Reality:**
- `memory_vault` table **does not exist**
- Only `content_library` table exists (different schema)
- No obvious migration path or explanation

---

## Data Model Comparison

### organizations.company_profile (JSONB)
```json
{
  "leadership": [{"name": "...", "title": "..."}],
  "headquarters": {"city": "...", "country": "..."},
  "company_size": {"employees": "...", "revenue_tier": "..."},
  "product_lines": ["...", "..."],
  "key_markets": ["...", "..."],
  "business_model": "...",
  "strategic_goals": [...]
}
```

### content_library (schema.org)
```json
{
  "@context": "https://schema.org",
  "@graph": [
    {"@type": "Organization", "name": "...", "address": {...}},
    {"@type": "Person", "name": "...", "jobTitle": "..."},
    {"@type": "Product", "name": "...", "description": "..."}
  ]
}
```

### organization_profiles (MCP discovery)
```json
{
  "organization_name": "...",
  "profile_data": {
    "industry": "...",
    "sub_industry": "...",
    "description": "...",
    "competitors": [...],
    "stakeholders": {...}
  }
}
```

**These are THREE completely different data structures for the SAME company info!**

---

## Recommendations

### Option A: Canonical Source of Truth (Recommended)

**Make `organizations` table the SINGLE source of truth:**

1. **Basic Info** → Top-level columns: `url`, `industry`, `size`
2. **Detailed Profile** → `company_profile` JSONB
3. **Schema.org Export** → Generated ON-DEMAND from company_profile (not stored)
4. **MCP Discovery** → Updates company_profile (doesn't create separate profile)

**Migration Path:**
```sql
-- 1. Migrate organization_profiles → organizations.company_profile
UPDATE organizations o
SET company_profile = jsonb_set(
  COALESCE(o.company_profile, '{}'::jsonb),
  '{mcp_discovery}',
  op.profile_data
)
FROM organization_profiles op
WHERE o.id = op.organization_id;

-- 2. Migrate content_library schemas → organizations.company_profile
-- (Extract Person, Product, Place entities and merge into company_profile)

-- 3. Drop redundant tables
DROP TABLE organization_profiles;
```

**Benefits:**
- ✅ Single query to get all org data
- ✅ No sync issues between tables
- ✅ Simpler codebase
- ✅ Faster queries (no joins needed)

### Option B: Keep Separate but Sync

**Keep schema in content_library but add sync layer:**

1. Add triggers to sync changes bidirectionally
2. Create middleware that updates all sources
3. Add conflict resolution UI

**Problems:**
- ❌ Complex sync logic prone to bugs
- ❌ Performance overhead
- ❌ Hard to maintain consistency

### Option C: Hybrid (Compromise)

**Basic data in organizations, rich schemas in content_library:**

1. **organizations table**: Basic profile (what user edits)
2. **content_library**: Full schema.org (AI-generated, read-only reference)
3. **Clear UI separation**: "Edit Profile" vs "View Schema"
4. **One-way flow**: Schema → Profile (on user request only)

**Benefits:**
- ✅ Preserves rich schema.org data
- ✅ User can always regenerate from schema
- ✅ Manual edits are preserved
- ✅ Clear mental model

---

## Immediate Fixes Needed

### 1. Fix memory_vault References
```typescript
// In /api/organizations/update/route.ts
// REMOVE this block (lines 84-118):
try {
  await supabase
    .from('memory_vault')  // ❌ TABLE DOESN'T EXIST
    .upsert(...)
}
```

### 2. Add Schema Extraction to Settings
In `OrganizationSettings.tsx` About tab:
- Add "Extract Schema" button next to website field
- Calls schema pipeline when clicked
- Shows progress (same as onboarding)
- Saves to content_library

### 3. Fix Generate from Schema Button
In `CompanyProfileTab.tsx`:
- Check if schema exists BEFORE showing button
- Show "Extract Schema First" message if not found
- Link to About tab extraction flow

### 4. Document the Data Model
Create `/docs/DATA_MODEL.md`:
- Explain each table's purpose
- Show data flow diagrams
- Define canonical sources
- Migration guides

---

## Questions for User

1. **Do you want to keep schema.org data in content_library?**
   - If yes: We need sync logic between organizations and content_library
   - If no: We can simplify to just organizations table

2. **What is memory_vault supposed to be?**
   - Is it just content_library renamed?
   - Is it a separate table that needs to be created?
   - Should we remove all memory_vault references?

3. **What should "Generate from Schema" button do if no schema exists?**
   - Show error?
   - Automatically trigger schema extraction?
   - Guide user to extract schema first?

4. **Should manual edits in Profile tab override schema data?**
   - If yes: Schema becomes read-only reference
   - If no: Manual edits get overwritten on regeneration

---

## Next Steps

1. **Decide on canonical data model** (Option A, B, or C above)
2. **Remove memory_vault references** (immediate fix)
3. **Add schema extraction to Settings** (UX improvement)
4. **Create migration scripts** (data cleanup)
5. **Document the architecture** (prevent future confusion)
