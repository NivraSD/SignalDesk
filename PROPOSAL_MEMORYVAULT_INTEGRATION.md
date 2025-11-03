# Proposal System - Memory Vault Integration Plan

## Current Understanding

**Memory Vault = `content_library` table**
- Universal storage for ALL content
- Has folder support (`folder` field)
- Already used for: brand assets, intelligence content, etc.
- Proposals should be just another folder: `folder = 'proposals'`

## Architecture Correction

### ❌ What We Built (Standalone):
- Separate `proposals` table
- Own analytics views
- Separate upload flow
- Isolated from other content

### ✅ What We Need (Memory Vault Integration):
- Store proposals IN `content_library` table
- Use `folder = 'proposals'` for organization
- Proposal metadata goes in `metadata` JSONB field
- Reuse existing Memory Vault UI with folders
- Analytics can still query from `content_library` WHERE `folder = 'proposals'`

## Migration Strategy

### Option 1: Use content_library as Source of Truth (Recommended)
**Pros:**
- Single source of truth
- Unified search across all content
- Reuse existing Memory Vault UI
- Consistent architecture

**Cons:**
- Need to adapt analytics queries
- Metadata in JSONB (less typed)

### Option 2: Dual Storage (Hybrid)
**Pros:**
- Keep typed `proposals` table for analytics
- Use `content_library` for Memory Vault integration

**Cons:**
- Data duplication
- Sync complexity
- Two sources of truth

## Implementation Plan (Option 1 - Recommended)

### 1. Content Library Schema (Already Exists ✅)

```sql
content_library:
  id: text (PK)
  organization_id: text
  title: text
  content_type: text  -- 'proposal'
  content: text       -- Full proposal text
  folder: text        -- 'proposals'
  metadata: jsonb     -- All proposal-specific metadata
  file_url: text      -- Link to uploaded PDF/DOCX
  tags: text[]
  created_at: timestamptz
  updated_at: timestamptz
```

### 2. Proposal Metadata Structure

Store in `metadata` JSONB:
```json
{
  "proposalMetadata": {
    "clientName": "Wells Fargo",
    "industry": "Financial Services",
    "sector": "Commercial Banking",
    "proposalType": "new_business",
    "servicesOffered": ["Threat Intelligence", "Security Monitoring"],
    "dealValueRange": "500k_1m",
    "keyDifferentiators": ["24/7 monitoring", "AI-powered detection"],
    "outcome": "won",
    "outcomeDate": "2024-01-15",
    "outcomeNotes": "Won due to competitive pricing",
    "competitiveLandscape": {
      "competitors": ["Mandiant"],
      "whyWeWon": "Better pricing and 24/7 support"
    },
    "proposalSections": {
      "executiveSummary": "...",
      "technicalApproach": "...",
      "teamCredentials": "..."
    },
    "teamMembers": ["John Doe", "Jane Smith"],
    "fileSizeBytes": 2048576,
    "fileType": "application/pdf"
  }
}
```

### 3. Modified API Routes

**Save Proposal to Memory Vault:**
```typescript
// /api/content-library/save (existing endpoint, extend it)
POST /api/content-library/save
{
  organizationId: "...",
  title: "Wells Fargo Threat Intelligence Proposal",
  contentType: "proposal",
  content: "Full proposal text...",
  folder: "proposals",
  fileUrl: "https://storage.../proposals/file.pdf",
  metadata: {
    proposalMetadata: { /* all proposal fields */ }
  },
  tags: ["financial-services", "threat-intelligence", "won"]
}
```

**Query Proposals:**
```typescript
// Use existing content library query
GET /api/content-library?folder=proposals&organizationId=xxx
```

### 4. Analytics Queries

**Adapt to query content_library:**
```sql
-- Win rate by industry
SELECT
  metadata->'proposalMetadata'->>'industry' as industry,
  metadata->'proposalMetadata'->>'proposalType' as proposal_type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE metadata->'proposalMetadata'->>'outcome' = 'won') as wins,
  COUNT(*) FILTER (WHERE metadata->'proposalMetadata'->>'outcome' = 'lost') as losses,
  ROUND(
    COUNT(*) FILTER (WHERE metadata->'proposalMetadata'->>'outcome' = 'won')::numeric /
    NULLIF(COUNT(*) FILTER (WHERE metadata->'proposalMetadata'->>'outcome' IN ('won', 'lost')), 0) * 100,
    2
  ) as win_rate
FROM content_library
WHERE folder = 'proposals'
  AND organization_id = 'xxx'
GROUP BY
  metadata->'proposalMetadata'->>'industry',
  metadata->'proposalMetadata'->>'proposalType';
```

**Differentiator performance:**
```sql
-- Extract differentiators from JSONB array
WITH differentiators AS (
  SELECT
    id,
    organization_id,
    metadata->'proposalMetadata'->>'outcome' as outcome,
    jsonb_array_elements_text(metadata->'proposalMetadata'->'keyDifferentiators') as differentiator
  FROM content_library
  WHERE folder = 'proposals'
    AND metadata->'proposalMetadata'->'keyDifferentiators' IS NOT NULL
)
SELECT
  differentiator,
  COUNT(*) as times_used,
  COUNT(*) FILTER (WHERE outcome = 'won') as wins,
  COUNT(*) FILTER (WHERE outcome = 'lost') as losses,
  ROUND(
    COUNT(*) FILTER (WHERE outcome = 'won')::numeric /
    NULLIF(COUNT(*) FILTER (WHERE outcome IN ('won', 'lost')), 0) * 100,
    1
  ) as win_rate
FROM differentiators
WHERE organization_id = 'xxx'
GROUP BY differentiator
HAVING COUNT(*) >= 2
ORDER BY win_rate DESC;
```

### 5. NIV Proposal Function Update

**Query proposals from content_library:**
```typescript
// In niv-proposal-intelligent/index.ts
const { data: proposals } = await supabase
  .from('content_library')
  .select('*')
  .eq('folder', 'proposals')
  .eq('organization_id', organizationId)
  .eq('content_type', 'proposal')
  // Filter by industry
  .contains('metadata', {
    proposalMetadata: { industry: requestData.industry }
  })
  .order('created_at', { ascending: false })
  .limit(10)
```

### 6. UI Integration

**Use Existing Memory Vault UI:**
- File: `/src/components/execute/ContentLibraryWithFolders.tsx` (likely exists)
- Add "Proposals" folder to folder list
- Filter `content_library` WHERE `folder = 'proposals'`
- Reuse upload/view components
- Add proposal-specific metadata editor

### 7. Migration of Existing Data

If we already have data in `proposals` table:
```sql
-- Migrate proposals table -> content_library
INSERT INTO content_library (
  id,
  organization_id,
  title,
  content_type,
  content,
  folder,
  file_url,
  metadata,
  tags,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid()::text,
  organization_id::text,
  title,
  'proposal',
  COALESCE(outcome_notes, ''),
  'proposals',
  file_path,
  jsonb_build_object(
    'proposalMetadata', jsonb_build_object(
      'clientName', client_name,
      'industry', industry,
      'sector', sector,
      'proposalType', proposal_type,
      'servicesOffered', services_offered,
      'dealValueRange', deal_value_range,
      'keyDifferentiators', key_differentiators,
      'outcome', outcome,
      'outcomeDate', outcome_date,
      'outcomeNotes', outcome_notes,
      'competitiveLandscape', competitive_landscape,
      'proposalSections', proposal_sections,
      'teamMembers', team_members,
      'fileType', file_type,
      'fileSizeBytes', file_size_bytes
    )
  ),
  tags,
  created_at,
  updated_at
FROM proposals;
```

## Revised File Structure

```
content_library (table)
├── folder = 'brand_assets'
│   ├── content_type = 'logo'
│   ├── content_type = 'brand_guidelines'
│   └── ...
├── folder = 'proposals'
│   ├── content_type = 'proposal'
│   ├── metadata.proposalMetadata.outcome = 'won'
│   ├── metadata.proposalMetadata.outcome = 'lost'
│   └── ...
├── folder = 'intelligence'
│   ├── content_type = 'threat_report'
│   └── ...
└── ...
```

## Benefits of Memory Vault Integration

1. **Unified Search**: Search across proposals, brand assets, intelligence in one place
2. **Consistent UI**: Same upload/view interface for all content
3. **Cross-References**: Link proposals to brand assets, case studies, etc.
4. **Single Source of Truth**: All content in one table
5. **Flexible Metadata**: JSONB allows any structure
6. **Future-Proof**: Easy to add vector embeddings for semantic search

## Action Items

### Immediate:
- [ ] Decide: Keep or drop `proposals` table?
  - **Recommend**: Drop and use `content_library` only
  - **Alternative**: Keep for typed analytics, sync to `content_library`

- [ ] Update API routes to save to `content_library`
- [ ] Update NIV function to query `content_library`
- [ ] Create analytics views that query `content_library`
- [ ] Update React components to work with folder structure

### Short-term:
- [ ] Find existing Memory Vault UI components
- [ ] Add "Proposals" folder to UI
- [ ] Add proposal-specific metadata editor
- [ ] Migrate test data from `proposals` to `content_library`

### Question for You:
**Should we keep the `proposals` table for analytics, or fully migrate to `content_library`?**

I recommend fully migrating to `content_library` because:
- Single source of truth
- Simpler architecture
- JSONB queries are fast with indexes
- Consistent with Memory Vault architecture
- Easy to add more folders (market research, competitive intel, etc.)

Let me know and I'll implement accordingly!
