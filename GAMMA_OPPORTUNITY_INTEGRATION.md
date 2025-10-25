# Gamma Presentation + Opportunity Folder Integration

## Overview

Presentations are now automatically organized within their parent opportunity's folder structure. This ensures all content related to an opportunity stays together and is easily discoverable.

## Folder Structure

### When Linked to an Opportunity

```
Supabase Storage (presentations bucket):
└── {organization_id}/
    └── opportunities/
        └── {opportunity_id}/
            └── presentations/
                ├── strategic-growth-plan_{gamma_id}.pptx
                ├── market-analysis_{gamma_id}.pptx
                └── competitor-overview_{gamma_id}.pptx

Memory Vault (content_library):
└── opportunities/
    └── {opportunity_id}/
        └── presentations/
            ├── Strategic Growth Plan (searchable, full text)
            ├── Market Analysis (searchable, full text)
            └── Competitor Overview (searchable, full text)
```

### When Standalone (Not Linked to Opportunity)

```
Supabase Storage:
└── {organization_id}/
    └── presentations/
        └── {gamma_id}.pptx

Memory Vault:
└── presentations/
    └── {presentation_title} (searchable, full text)
```

## How It Works

### 1. Generate Presentation for Opportunity

When calling the gamma-presentation function:

```typescript
const { data } = await supabase.functions.invoke('gamma-presentation', {
  body: {
    title: 'Strategic Growth Plan',
    content: '...',
    capture: true,
    organization_id: 'org-uuid',
    campaign_id: 'opportunity-uuid',  // 🔑 KEY: Links to opportunity
    options: {
      numCards: 12,
      imageSource: 'ai'
    }
  }
})
```

### 2. Automatic Folder Organization

The system automatically:

1. **Creates storage path**: `{org}/opportunities/{opportunity_id}/presentations/{title}_{gamma_id}.pptx`
2. **Sanitizes filename**: Converts title to URL-safe format
3. **Maintains uniqueness**: Adds gamma_id to prevent conflicts
4. **Sets folder_path in Memory Vault**: `opportunities/{opportunity_id}/presentations`

### 3. Example Flow

```
Opportunity: "Q1 2025 Market Expansion"
ID: abc-123-def

Generate Presentation:
  Title: "Market Expansion Strategy"
  ↓
Storage Path:
  org-uuid/opportunities/abc-123-def/presentations/
    market-expansion-strategy_xyz789.pptx
  ↓
Memory Vault Folder:
  opportunities/abc-123-def/presentations
  ↓
Content Library Entry:
  - title: "Market Expansion Strategy"
  - content_type: "presentation"
  - folder_path: "opportunities/abc-123-def/presentations"
  - session_id: "abc-123-def" (links to opportunity)
  - metadata.opportunity_id: "abc-123-def"
  - tags: ['gamma', 'presentation', 'auto-generated', 'opportunity']
```

## Benefits

### ✅ **Organized by Context**
All presentations for an opportunity are grouped together, making them easy to find and manage.

### ✅ **NIV Can Access Opportunity Presentations**
NIV can query: "Show me all presentations for this opportunity" or "What did we cover in the market expansion presentations?"

```typescript
// NIV can find all presentations for an opportunity
const { data } = await supabase
  .from('content_library')
  .select('*')
  .eq('session_id', opportunity_id)
  .eq('content_type', 'presentation')
```

### ✅ **Hierarchical Browsing**
Users can browse:
- All opportunities
  - Specific opportunity
    - All presentations for that opportunity
    - Other content (research, briefs, etc.)

### ✅ **Automatic Cleanup**
If an opportunity is deleted, all its presentations can be cleaned up together.

### ✅ **Better Search Context**
Search results can show which opportunity a presentation belongs to.

## Data Structure

### campaign_presentations Table

```sql
{
  id: uuid,
  organization_id: uuid,
  campaign_id: uuid,  -- Links to opportunity
  gamma_id: text,
  gamma_url: text,
  pptx_url: text,  -- Storage path includes opportunity folder
  title: "Market Expansion Strategy",
  slide_count: 12,
  full_text: "...",  -- Extracted content
  slides: [...]  -- Structured data
}
```

### content_library Table (Memory Vault)

```sql
{
  id: uuid,
  organization_id: uuid,
  session_id: uuid,  -- Links to opportunity (if applicable)
  content_type: 'presentation',
  title: "Market Expansion Strategy",
  content: "...",  -- Full searchable text
  folder_path: "opportunities/{opportunity_id}/presentations",
  file_url: "https://.../{org}/opportunities/{opp_id}/presentations/...",
  metadata: {
    gamma_id: "xyz789",
    gamma_url: "...",
    slide_count: 12,
    opportunity_id: "abc-123-def",  -- Explicit link
    source: "gamma"
  },
  tags: ['gamma', 'presentation', 'auto-generated', 'opportunity']
}
```

## Querying Presentations

### Get All Presentations for an Opportunity

```typescript
const { data: presentations } = await supabase
  .from('content_library')
  .select('*')
  .eq('metadata->>opportunity_id', opportunityId)
  .eq('content_type', 'presentation')
```

### Get Opportunity Folder Contents

```typescript
const { data: folderContents } = await supabase
  .from('content_library')
  .select('*')
  .like('folder_path', `opportunities/${opportunityId}%`)
```

### Browse Opportunity Presentations in Storage

```typescript
const { data: files } = await supabase.storage
  .from('presentations')
  .list(`${orgId}/opportunities/${opportunityId}/presentations`)
```

## Integration with Opportunity Execution

When an opportunity is executed and generates presentations:

```typescript
// From generate-opportunity-presentation function
const gammaResponse = await fetch('/functions/v1/gamma-presentation', {
  body: JSON.stringify({
    title: opportunity.title,
    content: presentationContent,
    capture: true,
    organization_id: organization_id,
    campaign_id: opportunity_id,  // ✅ Links to opportunity
    options: { ... }
  })
})
```

This automatically:
1. Stores PPTX in opportunity folder
2. Saves to Memory Vault with opportunity link
3. Makes content searchable and accessible to NIV

## NIV Usage Examples

### "Show me presentations for this opportunity"

NIV can execute:
```typescript
const presentations = await supabase
  .from('content_library')
  .select('title, content, metadata')
  .eq('session_id', currentOpportunityId)
  .eq('content_type', 'presentation')
```

### "What topics are covered in our market expansion materials?"

NIV can:
1. Find the opportunity by name
2. Get all content in that opportunity's folder
3. Analyze presentations, research, briefs together
4. Provide comprehensive answer

### "Generate a new presentation building on our previous work"

NIV can:
1. Access previous presentations from the opportunity
2. Extract key themes and insights
3. Generate new presentation incorporating learnings
4. Store new presentation in same opportunity folder

## Migration from Old Structure

If you have existing presentations NOT linked to opportunities:

```sql
-- Find orphaned presentations
SELECT id, title, gamma_id, pptx_url
FROM campaign_presentations
WHERE campaign_id IS NULL;

-- Update to link to opportunity (if you know the connection)
UPDATE campaign_presentations
SET campaign_id = '{opportunity_id}'
WHERE gamma_id = '{gamma_id}';
```

For Memory Vault:
```sql
-- Update folder paths for linked presentations
UPDATE content_library
SET
  folder_path = 'opportunities/' || session_id || '/presentations',
  metadata = jsonb_set(
    metadata,
    '{opportunity_id}',
    to_jsonb(session_id)
  )
WHERE
  content_type = 'presentation'
  AND session_id IS NOT NULL
  AND folder_path NOT LIKE 'opportunities/%';
```

## Future Enhancements

### 1. Opportunity Index/Manifest
Create a JSON manifest for each opportunity listing all its assets:

```json
{
  "opportunity_id": "abc-123",
  "title": "Q1 2025 Market Expansion",
  "assets": {
    "presentations": [
      { "title": "Strategy Deck", "gamma_id": "xyz", "url": "..." }
    ],
    "research": [...],
    "briefs": [...]
  }
}
```

### 2. Smart Folder Browsing UI
Build a UI component that shows:
- Opportunity name
- Folder structure
- All assets organized by type
- Quick actions (view, download, share)

### 3. Automatic Tagging
When a presentation is saved to an opportunity folder, automatically tag it with:
- Opportunity title
- Stakeholders involved
- Campaign phase
- Content themes

### 4. Cross-Opportunity Learning
NIV can analyze presentations across all opportunities to identify:
- Common successful patterns
- Reusable content
- Best practices

## Summary

✅ **Presentations are now fully integrated with opportunity folders**
✅ **Storage path includes opportunity context**
✅ **Memory Vault organizes content by opportunity**
✅ **NIV has full access to opportunity presentations**
✅ **Folder structure is intuitive and scalable**
✅ **Supports both linked and standalone presentations**

This creates a comprehensive content management system where all materials related to an opportunity stay organized and accessible!
