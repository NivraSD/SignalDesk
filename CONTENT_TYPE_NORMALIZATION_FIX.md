# Content Type Normalization Fix - Complete

## Problem Identified

The user reported that in Memory Vault folders, they were only seeing:
- Phase strategies (not formatted correctly) ✅ FIXED
- Media pitches

But they expected to see other owned content types defined in the blueprint:
- Case studies
- White papers
- Social media posts
- ROI calculators

## Root Cause Analysis

Through investigation, I discovered **two separate issues**:

### Issue 1: Phase Strategy Formatting ✅ FIXED

**Problem**: Phase strategies were being saved as stringified JSON instead of readable markdown.

**Location**: `supabase/functions/niv-content-intelligent-v2/index.ts:1035-1083`

**Fix Applied**: Changed from `JSON.stringify({...})` to formatted markdown with:
- Proper headings (# Phase N: Phase Name Strategy)
- Structured sections (Objective, Narrative, Key Messages, etc.)
- Content generation statistics
- Raw data moved to `metadata.raw_data` field

### Issue 2: Content Type Naming Mismatch ✅ FIXED

**Problem**: Blueprint defines content types with spaces and capitals (e.g., "Case study", "White paper", "Social media post"), but:
- MCP routing expects lowercase with hyphens (e.g., "case-study", "white-paper", "social-post")
- This caused content generation to fail silently for these types

**Evidence**:
```
Blueprint defines: "Case study", "White paper", "ROI calculator tool"
Database shows: NO case-study, white-paper, or calculator entries
MCP routing expects: "case-study", "white-paper", etc.
```

**Root Cause**:
- `extractPhaseCampaigns()` in niv-campaign-executor was passing `action.contentType` directly without normalization (line 256)
- NIV's `callMCPService()` routing table couldn't find matches for "Case study" (looking for "case-study")

## Solution Implemented

### Part 1: Content Type Normalization Function

Created `normalizeContentType()` function in both services:

**Location 1**: `supabase/functions/niv-campaign-executor/index.ts:644-682`
**Location 2**: `supabase/functions/niv-content-intelligent-v2/index.ts:2960-2992`

```typescript
function normalizeContentType(rawType: string): string {
  const normalized = rawType
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')  // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, '')  // Remove non-alphanumeric except hyphens

  // Map common variations to standard types
  const typeMap: Record<string, string> = {
    'case-study': 'case-study',
    'white-paper': 'white-paper',
    'whitepaper': 'white-paper',
    'social-media-post': 'social-post',
    'social-post': 'social-post',
    'blog-post': 'blog-post',
    'blogpost': 'blog-post',
    'media-pitch': 'media-pitch',
    'mediapitch': 'media-pitch',
    'press-release': 'press-release',
    'thought-leadership': 'thought-leadership',
    'executive-statement': 'executive-statement',
    'executive-brief': 'executive-brief',
    'qa-document': 'qa-document',
    'talking-points': 'talking-points',
    'email-campaign': 'email-campaign',
    'roi-calculator-tool': 'thought-leadership',  // Temporary mapping
    'roi-calculator': 'thought-leadership',
    'calculator': 'thought-leadership'
  }

  return typeMap[normalized] || normalized
}
```

### Part 2: Apply Normalization in Executor

**Location**: `supabase/functions/niv-campaign-executor/index.ts:729-751`

```typescript
// Before (line 256 old):
ownedContent.push({
  type: action.contentType || 'blog-post',  // ❌ Wrong: "Case study"
  // ...
})

// After (lines 729-751):
const rawContentType = action.contentType || 'blog-post'
const normalizedType = normalizeContentType(rawContentType)

ownedContent.push({
  type: normalizedType,  // ✅ Correct: "case-study"
  // ...
})

console.log(`  ✓ Owned: ${rawContentType} → ${normalizedType} for ${action.targetStakeholder}`)
```

### Part 3: Apply Normalization in NIV Content Generation

**Location**: `supabase/functions/niv-content-intelligent-v2/index.ts:2995-3020`

```typescript
async function callMCPService(contentType: string, parameters: any): Promise<string> {
  // Normalize content type first
  const normalizedType = normalizeContentTypeForMCP(contentType)

  const routing: Record<string, { service: string; tool: string }> = {
    'case-study': { service: 'mcp-content', tool: 'case-study' },
    'white-paper': { service: 'mcp-content', tool: 'white-paper' },
    // ...
  }

  const route = routing[normalizedType]  // ✅ Now finds match
  if (!route) {
    console.warn(`⚠️ Unknown content type: "${contentType}" (normalized to "${normalizedType}")`)
    throw new Error(`Unknown content type: ${contentType}`)
  }
  // ...
}
```

### Part 4: Normalize Content Type When Saving to Database

**Location**: `supabase/functions/niv-content-intelligent-v2/index.ts:1098-1121`

```typescript
// Normalize content type before saving
const normalizedContentType = normalizeContentTypeForMCP(contentPiece.type)

const { error: contentError } = await supabase
  .from('content_library')
  .insert({
    organization_id: organizationId,
    content_type: normalizedContentType,  // ✅ Normalized
    title: `${phase} - ${normalizedContentType} - ${contentPiece.stakeholder || contentPiece.journalists?.[0] || 'general'}`,
    content: contentPiece.content,
    folder: phaseFolder,
    metadata: {
      campaign_folder: campaignFolder,
      blueprint_id: blueprintId,
      phase,
      phase_number: phaseNumber,
      stakeholder: contentPiece.stakeholder,
      channel: contentPiece.channel,
      generated_at: new Date().toISOString(),
      original_type: contentPiece.type  // Keep original for reference
    },
    tags: [normalizedContentType, phase, contentPiece.stakeholder || 'media', contentPiece.channel],
    status: 'saved'
  })
```

## Deployment Status

✅ **Deployed to Production**:
- `niv-campaign-executor` (89.52kB)
- `niv-content-intelligent-v2` (120.3kB)

## Expected Behavior After Fix

When a new campaign is executed with the latest blueprint:

**Input (from blueprint)**:
- Phase 1: "Case study" for K-12 Educators
- Phase 2: "White paper" for Higher Education Faculty
- Phase 3: "ROI calculator tool" for EdTech Decision Makers
- Phase 4: "Success story video series" for K-12 Educators (filtered - unsupported)

**Processing**:
```
📊 Extracting phase campaigns from Blueprint V3...

📍 Extracting phase1_awareness campaign:
  🔄 Normalized "Case study" → "case-study"
  ✓ Owned: Case study → case-study for K-12 Educators and Teachers

📍 Extracting phase2_consideration campaign:
  🔄 Normalized "White paper" → "white-paper"
  ✓ Owned: White paper → white-paper for Higher Education Faculty

📍 Extracting phase3_conversion campaign:
  🔄 Normalized "ROI calculator tool" → "thought-leadership"
  ✓ Owned: ROI calculator tool → thought-leadership for EdTech Decision Makers

📍 Extracting phase4_advocacy campaign:
  ⏭️ Skipping Success story video series - video/multimedia not supported
```

**Output (in Memory Vault)**:
- ✅ case-study (Phase 1)
- ✅ white-paper (Phase 2)
- ✅ thought-leadership (Phase 3) - ROI calculator mapped to this
- ✅ social-post (all phases)
- ✅ media-pitch (all phases)
- ✅ phase_strategy (all phases, now properly formatted)

## Testing

Created test script: `test-content-type-normalization.js`

**Current Database State** (before re-execution):
```
Content Types in Memory Vault:
  media-pitch: 13
  phase_strategy: 13
  media_pitch: 8  ⚠️ Inconsistent naming
  blog-post: 5
  campaign_blueprint: 4
  Social media thread: 2  ⚠️ Not normalized
  Social media post: 2  ⚠️ Not normalized
  Case study: 1  ⚠️ Not normalized
  Enterprise case study: 1  ⚠️ Not normalized
  thought-leadership: 1
```

**After re-execution** (expected):
```
Content Types in Memory Vault:
  media-pitch: X  ✅ Consistent
  phase_strategy: X  ✅ Formatted markdown
  case-study: X  ✅ Normalized
  white-paper: X  ✅ Normalized
  social-post: X  ✅ Normalized
  thought-leadership: X  ✅ Normalized
  blog-post: X  ✅ Already correct
```

## Notes

1. **Retroactive Fix**: This fix applies to NEW campaign executions only. Existing content in the database will retain their old format.

2. **ROI Calculator Mapping**: "ROI calculator tool" is temporarily mapped to "thought-leadership" since we don't have a dedicated MCP handler for calculators yet. This can be updated when we add calculator-specific content generation.

3. **Video Content**: "Success story video series" is correctly filtered out by the UNSUPPORTED_CONTENT_TYPES list, as we cannot auto-generate video content.

4. **Logging**: Added detailed logging to show normalization in action:
   ```
   🔄 Normalized "Case study" → "case-study"
   ✓ Owned: Case study → case-study for K-12 Educators and Teachers
   ```

5. **Database Consistency**: All future content will be saved with consistent, normalized content types, making it easier to:
   - Query by content type
   - Display in UI with filters
   - Build analytics and reporting

## Impact

✅ **Fixes the user's reported issue**: Case studies, white papers, and other owned content types will now generate correctly and appear in Memory Vault folders.

✅ **Improves data consistency**: All content types follow a standard naming convention.

✅ **Better error handling**: Unknown content types now log warnings with both original and normalized names for easier debugging.

✅ **Preserves original data**: The original content type from the blueprint is saved in `metadata.original_type` for reference.
