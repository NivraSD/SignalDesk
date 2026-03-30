# GEO Schema Recommendations Fix

**Date:** November 2, 2025
**Issue:** Schema recommendations suggesting fields that already exist
**Root Cause:** Synthesis function didn't know what was in the current schema

---

## The Problem

### What Was Happening
1. User runs GEO Monitor
2. Gets recommendations: "Add aggregateRating field"
3. But schema in Memory Vault **already has aggregateRating**
4. Execute button updates Memory Vault (which already has the field)
5. Schema not deployed to website anyway
6. = Useless recommendations

### Root Causes

**Issue 1: Blind Recommendations**
- `geo-executive-synthesis` function generates recommendations
- It was NOT checking the current schema
- Claude AI was recommending fields blindly
- Result: Duplicate recommendations for fields that already exist

**Issue 2: Schema Not Deployed**
- Schema exists in Memory Vault
- But it's not on the organization's website
- AI platforms can't see it
- So recommendations seem relevant but don't help

---

## The Fix

### What We Changed

**File:** `supabase/functions/geo-executive-synthesis/index.ts`

#### Change 1: Fetch Current Schema (Lines 94-120)

```typescript
// Fetch current schema from Memory Vault
let currentSchema: any = null
try {
  const { data: schemaData } = await supabase
    .from('content_library')
    .select('content')
    .eq('organization_id', organization_id)
    .eq('content_type', 'schema')
    .eq('folder', 'Schemas/Active/')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (schemaData) {
    currentSchema = typeof schemaData.content === 'string'
      ? JSON.parse(schemaData.content)
      : schemaData.content
    console.log('📋 Current schema loaded:', {
      type: currentSchema['@type'],
      fields: Object.keys(currentSchema).filter(k => !k.startsWith('@')).length
    })
  } else {
    console.log('⚠️  No schema found in Memory Vault')
  }
} catch (error) {
  console.error('Error fetching schema:', error)
}
```

#### Change 2: Pass Schema to Prompt (Line 132)

```typescript
const prompt = buildSynthesisPrompt({
  organizationName: organization_name,
  industry,
  analysis,
  geoTargets: geo_targets,
  currentSchema  // ← NEW: Pass current schema
})
```

#### Change 3: Update Prompt with Schema Context (Lines 308-313)

```typescript
${context.currentSchema ? `CURRENT SCHEMA IN MEMORY VAULT:
Schema Type: ${context.currentSchema['@type'] || 'Not set'}
Existing Fields: ${Object.keys(context.currentSchema).filter(k => !k.startsWith('@')).join(', ')}

IMPORTANT: Only recommend fields that are MISSING from the current schema above. Do NOT recommend adding fields that already exist.
` : 'CURRENT SCHEMA: Not available - recommend foundational schema setup'}
```

#### Change 4: Enhanced Recommendation Guidelines (Lines 417-428)

```typescript
IMPORTANT FOR SCHEMA RECOMMENDATIONS:
- Only recommend fields that are MISSING from the current schema
- If the schema already has good coverage, focus on CONTENT recommendations instead (e.g., "Update description to emphasize X")
- If no schema exists, recommend foundational setup
- Make recommendations ACTIONABLE and SPECIFIC
- For auto_executable: true only for simple field additions (not complex nested objects)

ABOUT SCHEMA DEPLOYMENT:
Note that the schema in Memory Vault may not be deployed to the organization's website yet. Your recommendations should:
1. Prioritize fields that will have the biggest impact on AI visibility
2. Include a note if deployment is needed
3. Focus on what SHOULD be in the schema, regardless of current deployment status
```

---

## How It Works Now

### New Flow

```
1. User runs GEO Monitor
   ↓
2. geo-intelligence-monitor tests queries on 4 AI platforms
   ↓
3. geo-executive-synthesis runs:
   a. Fetches current schema from Memory Vault
   b. Analyzes GEO test results
   c. Sends to Claude with CURRENT SCHEMA context
   d. Claude generates recommendations ONLY for missing fields
   ↓
4. User sees ACCURATE recommendations
   ↓
5. Click "Execute" → Updates Memory Vault
   ↓
6. User deploys to website (manual step)
```

### Smart Recommendations

**Before Fix:**
```json
{
  "title": "Add aggregateRating field",
  "description": "Add rating to improve visibility",
  "changes": {"field": "aggregateRating", "action": "add", "value": {...}}
}
```
❌ Even though schema already has this field!

**After Fix:**
```json
{
  "title": "Update description to emphasize renewable energy focus",
  "description": "Schema has good field coverage. Focus on content quality.",
  "type": "update_field",
  "changes": {"field": "description", "action": "update", "value": "..."}
}
```
✅ Or no schema recommendations if coverage is good!

---

## Deployment

```bash
npx supabase functions deploy geo-executive-synthesis
```

Status: ✅ **Deployed November 2, 2025**

---

## What About Schema Deployment?

### The Remaining Issue

Even with accurate recommendations, there's still a deployment gap:

1. Schema updated in Memory Vault ✅
2. BUT schema not on website ❌
3. AI platforms can't see it ❌
4. Recommendations won't show improvement ❌

### Solutions (Future)

**Option 1: Manual Deployment Instructions**
- Generate copy-paste HTML snippet
- User adds to their website
- Simple but requires manual step

**Option 2: Auto-Deploy via Integrations**
- Integrate with Webflow, WordPress, etc.
- Auto-deploy schema updates
- Requires API integrations

**Option 3: Hosted Schema Endpoint**
- SignalDesk hosts schema at `signaldesk.com/schema/{org-id}`
- User adds one-time script to website
- Schema auto-updates from Memory Vault
- **Recommended approach**

---

## Testing the Fix

### Before Testing
1. Check your current schema in Memory Vault
2. Note which fields it has (e.g., name, description, url, aggregateRating, etc.)

### Run Test
1. Go to Intelligence Hub → GEO tab
2. Click "Run GEO Monitor"
3. Wait for synthesis
4. Check recommendations

### Expected Results

**If schema has good coverage:**
- Few or no schema recommendations
- Or recommendations focus on content quality (e.g., "Update description to...")
- Or recommendations for truly missing fields

**If schema is missing key fields:**
- Recommendations for specific missing fields
- Example: "Add knowsAbout field to specify expertise areas"

**If no schema exists:**
- Recommendations to create foundational schema
- Basic fields: name, description, url, sameAs, etc.

---

## Migration Notes

### For Existing Users

If users already have good schemas from onboarding:
1. Next GEO Monitor run will detect existing fields
2. Recommendations will focus on optimization, not duplication
3. Execute button still works (updates Memory Vault)
4. Deployment to website remains manual step

### For New Users

1. Run GEO Monitor
2. Get foundational schema recommendations
3. Execute to populate Memory Vault
4. Deploy to website (manual)
5. Re-run GEO Monitor to verify

---

## Code Cleanup

### Removed Unnecessary Code

**Deleted Files:**
- `src/components/schema/SchemaEditorSmart.tsx` (manual editor not needed)
- `SCHEMA_EDITOR_IMPLEMENTATION.md` (documentation for removed feature)

**Reason:** You can edit schemas in Memory Vault workspace, don't need dedicated editor.

**Reverted Changes:**
- `src/components/modules/IntelligenceModule.tsx` (removed editor integration)

---

## Summary

### Before
- ❌ Recommendations suggested existing fields
- ❌ Claude didn't know what was in schema
- ❌ Wasted clicks on duplicate recommendations

### After
- ✅ Recommendations check existing schema
- ✅ Claude knows what fields already exist
- ✅ Only recommends MISSING or CONTENT improvements
- ✅ Smarter, more actionable recommendations

### Next Steps
- Consider schema deployment solution (hosted endpoint?)
- Track schema changes → AI visibility improvements
- Build attribution: "After adding X field, visibility improved Y%"

---

*Fix deployed November 2, 2025*
*Function: geo-executive-synthesis*
*Deployment: zskaxjtyuaqazydouifp*
