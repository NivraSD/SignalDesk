# Organization Schema Fix - Complete Summary

## Problems Identified

### 1. **Fragmented Data Schema** (Critical)
The organization data was scattered across **three different storage strategies**:

- **Onboarding (POST /api/organizations)**: Stored `industry`, `url`, `description` in `company_profile` JSONB
- **Settings Update (PUT /api/organizations/update)**: Stored `industry` at top-level, `url`/`size` in `settings` JSONB
- **UI Components**: Expected top-level `url`, `industry`, `size` columns (which didn't exist!)

**Result**: Data was being written to one location and read from another, causing all company profile data to appear blank in the UI.

### 2. **Missing Database Columns**
The `organizations` table was missing critical columns that the UI expected:
- `url` (website/domain)
- `industry`
- `size`

### 3. **Undefined Variable in Monitoring**
`niv-fireplexity-monitor-v2/index.ts` referenced `orgData.name` but `orgData` was never defined, causing monitoring to crash.

---

## Solutions Implemented

### 1. **Standardized Schema** ✅

**Final Organization Table Schema:**
```sql
organizations (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255),
  url TEXT,              -- ✨ NEW: Website/domain at top-level
  industry TEXT,         -- ✨ NEW: Industry at top-level
  size TEXT,             -- ✨ NEW: Company size at top-level
  company_profile JSONB, -- Detailed profile data
  created_at TIMESTAMP
)
```

**Data Storage Strategy:**
- **Top-level columns**: `url`, `industry`, `size` (basic "About" tab fields - fast indexed queries)
- **company_profile JSONB**: Everything else (leadership, headquarters, product_lines, strategic_goals, etc.)

**Benefits:**
- Fast queries on commonly-filtered fields (industry, size)
- Flexibility for complex nested profile data
- Clear separation: basic info vs. detailed profile

### 2. **API Endpoints Standardized** ✅

**POST /api/organizations** (onboarding):
```typescript
.insert({
  id: orgId,
  name,
  url,           // ✅ Top-level
  industry,      // ✅ Top-level
  size,          // ✅ Top-level
  company_profile: {
    description,
    // ... other detailed fields
  }
})
```

**PUT /api/organizations/update** (settings):
```typescript
.update({
  name: name.trim(),
  url: domain.trim(),       // ✅ Top-level
  industry: industry?.trim(), // ✅ Top-level
  size: size || null,        // ✅ Top-level
})
```

**GET /api/organizations**:
```typescript
// Returns org with all top-level fields
// Plus description from company_profile
```

### 3. **Database Migration Applied** ✅

```sql
-- supabase/migrations/20251119_fix_organizations_schema.sql
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS url TEXT,
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS size TEXT;

CREATE INDEX IF NOT EXISTS idx_organizations_industry ON organizations(industry);
CREATE INDEX IF NOT EXISTS idx_organizations_url ON organizations(url);
```

### 4. **Monitoring Bug Fixed** ✅

`niv-fireplexity-monitor-v2/index.ts`:
```diff
- let queries = await generateIntelligentQueries(profile, orgData.name, ...)
+ let queries = await generateIntelligentQueries(profile, orgName, ...)
```

---

## Data Flow (After Fix)

### Onboarding:
1. User enters: name, website, industry
2. POST `/api/organizations` → Creates org with top-level `url`, `industry`, `size`
3. MCP discovery runs → Populates `company_profile` with competitors, stakeholders, etc.
4. Schema generation → Stores in content_library/memory_vault

### Settings "About" Tab:
1. GET `/api/organizations?id={id}` → Returns `url`, `industry`, `size` from top-level columns ✅
2. User edits fields
3. PUT `/api/organizations/update` → Updates top-level columns ✅
4. UI refreshes with saved data ✅

### Settings "Profile" Tab:
1. GET `/api/organizations/profile?id={id}` → Returns `company_profile` JSONB
2. User edits leadership, headquarters, product lines, strategic goals
3. PUT `/api/organizations/profile` → Updates `company_profile` JSONB
4. AI functions read from `company_profile` for context

---

## Testing Checklist

- [ ] Create new organization via onboarding
- [ ] Verify website, industry saved to database
- [ ] Open Settings → About tab → Fields should show saved data
- [ ] Edit website/industry in About tab → Save → Refresh → Data persists
- [ ] Open Settings → Profile tab → Add leadership/products → Save
- [ ] Run monitoring pipeline → Should not crash on orgData error
- [ ] Check memory_vault updated with org context

---

## Files Modified

1. `/supabase/migrations/20251119_fix_organizations_schema.sql` - Added missing columns
2. `/src/app/api/organizations/route.ts` - Standardized POST/GET to use top-level columns
3. `/src/app/api/organizations/update/route.ts` - Standardized PUT to use top-level columns
4. `/supabase/functions/niv-fireplexity-monitor-v2/index.ts` - Fixed undefined orgData bug

---

## Migration Notes

**For Existing Organizations:**

If you have existing orgs in the database with data in `company_profile.industry`, `company_profile.url`, or `settings.url`, you'll need a data migration:

```sql
-- Migrate existing data from JSONB to top-level columns
UPDATE organizations
SET
  url = COALESCE(url, company_profile->>'url', settings->>'url'),
  industry = COALESCE(industry, company_profile->>'industry'),
  size = COALESCE(size, company_profile->>'size', settings->>'size')
WHERE url IS NULL OR industry IS NULL OR size IS NULL;
```

---

## Why This Happened

The root cause was **iterative development without a clear schema contract**:

1. Initial version stored everything in `company_profile` JSONB (flexible but unstructured)
2. Later, some fields moved to `settings` JSONB for "configuration"
3. UI components assumed top-level columns existed (they didn't)
4. Each developer/component chose their own storage location
5. No schema validation or tests caught the inconsistency

**Prevention:**
- Document the schema contract in `/docs/database-schema.md`
- Add TypeScript types that match database schema
- Write integration tests for CRUD operations
- Use migrations for all schema changes
