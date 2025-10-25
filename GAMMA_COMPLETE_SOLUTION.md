# Gamma Presentation Integration - Complete Solution ✅

## Yes! Presentations ARE Part of Opportunity Folders

When you generate a Gamma presentation linked to an opportunity, it's automatically saved within that opportunity's folder structure in **both** storage and Memory Vault.

## How It Works

### When Generating for an Opportunity

```typescript
const { data } = await supabase.functions.invoke('gamma-presentation', {
  body: {
    title: 'Strategic Growth Plan',
    content: '...',
    capture: true,
    organization_id: 'org-uuid',
    campaign_id: 'opportunity-uuid',  // 🔑 This links it to the opportunity
  }
})
```

### Automatic Folder Organization

```
🗂️ Supabase Storage (presentations bucket):
└── {org_id}/
    └── opportunities/
        └── {opportunity_id}/
            └── presentations/
                └── strategic-growth-plan_{gamma_id}.pptx  ← Your PPTX file here

📚 Memory Vault (content_library):
└── opportunities/
    └── {opportunity_id}/
        └── presentations/
            └── Strategic Growth Plan  ← Searchable, full text content
```

## Complete Data Flow

```
User requests presentation for opportunity
    ↓
1. Generate via Gamma API
    ↓
2. Poll for completion
    ↓
3. When complete, Gamma provides pptxDownloadUrl
    ↓
4. Download PPTX from Gamma
    ↓
5. Upload to Supabase Storage:
   → Path: {org}/opportunities/{opp_id}/presentations/{title}_{id}.pptx
    ↓
6. Extract text from all slides
    ↓
7. Save to campaign_presentations table:
   - gamma_id, gamma_url
   - campaign_id (opportunity link)
   - pptx_url (storage path)
   - full_text (extracted content)
   - slides (structured data)
    ↓
8. Save to content_library (Memory Vault):
   - folder_path: "opportunities/{opp_id}/presentations"
   - session_id: {opportunity_id}
   - metadata.opportunity_id: {opportunity_id}
   - tags: ['gamma', 'presentation', 'auto-generated', 'opportunity']
   - file_url: link to PPTX
    ↓
9. NIV can now access the presentation! 🎉
```

## Example: Q1 Market Expansion Opportunity

```
Opportunity:
  Title: "Q1 2025 Market Expansion"
  ID: abc-123-def

Presentations Generated:
  1. "Competitive Analysis" → abc-123-def/presentations/competitive-analysis_xyz.pptx
  2. "Go-to-Market Strategy" → abc-123-def/presentations/go-to-market-strategy_xyz.pptx
  3. "Budget Proposal" → abc-123-def/presentations/budget-proposal_xyz.pptx

All stored in:
  Storage: org-uuid/opportunities/abc-123-def/presentations/
  Memory Vault: opportunities/abc-123-def/presentations

NIV can query: "Show me all presentations for Q1 Market Expansion"
  → Returns all 3 presentations with full content
```

## What NIV Can Do

### Query All Presentations for an Opportunity
```typescript
const presentations = await supabase
  .from('content_library')
  .select('*')
  .eq('session_id', opportunity_id)
  .eq('content_type', 'presentation')

// Returns all presentations linked to that opportunity
```

### Browse Opportunity Folder
```typescript
const folderContents = await supabase
  .from('content_library')
  .select('*')
  .like('folder_path', `opportunities/${opportunity_id}%`)

// Returns ALL content in opportunity folder:
// - Presentations
// - Research briefs
// - Other documents
```

### Smart Context Awareness
```
User: "Create a new presentation building on our market expansion work"

NIV:
1. Finds "Q1 Market Expansion" opportunity
2. Retrieves all presentations from: opportunities/abc-123-def/presentations
3. Reads full text content from all presentations
4. Generates new presentation incorporating key themes
5. Saves new presentation in SAME opportunity folder
```

## Files Modified

### Main Implementation
- **`supabase/functions/gamma-presentation/index.ts`**
  - Added `exportAs: 'pptx'` to API request
  - Download PPTX from Gamma
  - Upload to opportunity folder structure
  - Extract text content
  - Save to both tables with proper folder paths

### Migrations
- **`20251025_create_presentations_storage_bucket.sql`**
  - Creates storage bucket
  - Sets up RLS policies

### Documentation
- **`GAMMA_OPPORTUNITY_INTEGRATION.md`** ← Read this for details!
  - Complete folder structure explanation
  - Query examples
  - NIV usage patterns

### Testing
- **`test-gamma-export.js`**
  - Set `OPPORTUNITY_ID` to test with an opportunity
  - Verifies folder structure is correct
  - Checks both storage and Memory Vault

## Key Implementation Details

### Storage Path Logic (Line 141-153)
```typescript
if (opportunityId) {
  // Store within opportunity folder
  filePath = `${organizationId}/opportunities/${opportunityId}/presentations/${sanitizedTitle}_${gammaId}.pptx`
} else {
  // Standalone presentation
  filePath = `${organizationId}/presentations/${gammaId}.pptx`
}
```

### Memory Vault Path Logic (Line 322-330)
```typescript
if (request.campaign_id) {
  // Store within opportunity folder in Memory Vault
  folderPath = `opportunities/${request.campaign_id}/presentations`
} else {
  // Standalone presentation folder
  folderPath = `presentations`
}
```

## Benefits

| Feature | Benefit |
|---------|---------|
| **Organized by Context** | All opportunity materials stay together |
| **NIV Access** | Can reference presentations in conversations |
| **Searchable** | Full text is indexed and searchable |
| **Downloadable** | Users can download PPTX files |
| **Hierarchical** | Browse: Org → Opportunities → Presentations |
| **Automatic** | No manual organization needed |
| **Scalable** | Works for any number of opportunities |

## Testing

### 1. Test Standalone Presentation
```bash
# In test-gamma-export.js, set:
const OPPORTUNITY_ID = null

node test-gamma-export.js
```

### 2. Test Opportunity-Linked Presentation
```bash
# In test-gamma-export.js, set:
const OPPORTUNITY_ID = 'your-opportunity-uuid'

node test-gamma-export.js
```

This will verify:
- ✅ PPTX stored in correct folder
- ✅ Memory Vault uses opportunity folder path
- ✅ Links are maintained
- ✅ NIV can access content

## Deployment Steps

```bash
# 1. Create storage bucket
psql $DATABASE_URL -f supabase/migrations/20251025_create_presentations_storage_bucket.sql

# 2. Deploy updated function
supabase functions deploy gamma-presentation

# 3. Test it
node test-gamma-export.js
```

## Summary

✅ **Presentations ARE saved in opportunity folders**
✅ **Storage path: `{org}/opportunities/{opp}/presentations/{title}.pptx`**
✅ **Memory Vault path: `opportunities/{opp}/presentations`**
✅ **NIV can access all presentations for an opportunity**
✅ **Full text content is searchable**
✅ **PPTX files are downloadable**
✅ **Automatically organized - no manual work needed**

Your presentations are now fully integrated into the opportunity folder structure! 🎉
