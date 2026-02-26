# Discovery UI Bug Fix

## **BUG FOUND AND FIXED** ✅

Discovery from org settings/intelligence targets was only saving competitors/topics to the `intelligence_targets` table, but NOT saving the full profile (sources, intelligence_context) to `organizations.company_profile`.

---

## The Bug

**What was happening:**

1. User clicks "Run Discovery" in org settings → Intelligence Targets
2. Discovery runs and finds competitors, sources, intelligence_context
3. UI shows discovered competitors/topics/stakeholders for user to select
4. User selects items and clicks "Save Selected"
5. **ONLY** the selected competitors/topics get saved to `intelligence_targets` table
6. **NEVER** saves the full profile (sources, intelligence_context) to `organizations.company_profile`

**Result:**
- Competitors appear in intelligence targets ✅
- BUT monitoring still uses old/wrong sources ❌
- AND monitoring can't find intelligence_context ❌
- So intelligent search doesn't work ❌

---

## Why This Happened

**File:** `src/components/settings/TargetManagementTab.tsx`

The `saveSelectedDiscoveryItems` function only called `/api/organizations/targets` to add selected items to the targets table:

```typescript
// This saved targets
await fetch('/api/organizations/targets', {
  method: 'POST',
  body: JSON.stringify({
    organization_id: organizationId,
    targets: targetsToAdd,
    append: true
  })
})

// But NEVER saved the full profile to company_profile!
```

**File:** `src/app/api/organizations/discover/route.ts`

The discover API always called mcp-discovery with `save_to_persistence: false`:

```typescript
body: JSON.stringify({
  tool: 'create_organization_profile',
  arguments: {
    organization_name,
    save_to_persistence: false // ← Never saved!
  }
})
```

---

## The Fix

### 1. Updated Discovery API Route

**File:** `src/app/api/organizations/discover/route.ts`

Added `save_profile` parameter to control whether to persist the full profile:

```typescript
export async function POST(req: NextRequest) {
  const { organization_name, organization_id, save_profile } = await req.json()

  const response = await fetch(`${SUPABASE_URL}/functions/v1/mcp-discovery`, {
    method: 'POST',
    body: JSON.stringify({
      tool: 'create_organization_profile',
      arguments: {
        organization_name,
        organization_id, // Pass org ID for saving
        save_to_persistence: save_profile || false // Save if requested
      }
    })
  })
}
```

### 2. Updated UI to Save Full Profile

**File:** `src/components/settings/TargetManagementTab.tsx`

Updated `runDiscovery` to pass organization_id:

```typescript
const runDiscovery = async () => {
  await fetch('/api/organizations/discover', {
    method: 'POST',
    body: JSON.stringify({
      organization_name: organizationName,
      organization_id: organizationId, // ← Added
      save_profile: false // Don't save yet
    })
  })
}
```

Updated `saveSelectedDiscoveryItems` to save full profile AFTER saving targets:

```typescript
const saveSelectedDiscoveryItems = async () => {
  // 1. Save selected targets to intelligence_targets
  if (targetsToAdd.length > 0) {
    await fetch('/api/organizations/targets', {
      method: 'POST',
      body: JSON.stringify({
        organization_id: organizationId,
        targets: targetsToAdd
      })
    })
  }

  // 2. CRITICAL: Save full profile to company_profile
  console.log('💾 Saving full discovery profile to company_profile...')
  const profileResponse = await fetch('/api/organizations/discover', {
    method: 'POST',
    body: JSON.stringify({
      organization_name: organizationName,
      organization_id: organizationId,
      save_profile: true // ← Save the full profile now
    })
  })

  if (profileResponse.ok) {
    console.log('✅ Full profile saved successfully')
  }
}
```

---

## What This Fixes

**Before:**
- Run discovery from UI → Only targets saved
- Monitoring uses old sources (WSJ, Bloomberg for PR firms)
- Monitoring can't find intelligence_context
- Strategic questions not generated
- Firecrawl returns 0 results

**After:**
- Run discovery from UI → Targets AND full profile saved
- Monitoring uses correct sources (PRWeek, Holmes Report for PR firms)
- Monitoring finds intelligence_context with key_questions
- Strategic questions generated from MCP Discovery
- Firecrawl searches correct industry sources

---

## Testing

**To verify the fix works:**

1. Go to org settings → Intelligence Targets
2. Click "Run Discovery"
3. Wait for results
4. Select some competitors/topics
5. Click "Save Selected"
6. Check browser console for:
   ```
   💾 Saving full discovery profile to company_profile...
   ✅ Full profile saved successfully
   ```
7. Run monitoring for the org
8. Check logs for:
   - Correct industry sources in TIER 1 domains
   - Strategic questions generated from intelligence_context
   - Firecrawl returning results (not 0)

---

## Files Changed

1. **src/app/api/organizations/discover/route.ts**
   - Added `save_profile` parameter
   - Pass `organization_id` to mcp-discovery
   - Control `save_to_persistence` based on `save_profile`

2. **src/components/settings/TargetManagementTab.tsx**
   - Pass `organization_id` when calling discovery
   - Call discover API again with `save_profile: true` after saving targets
   - Log profile save status

---

## Status

- ✅ Discovery API updated to support profile saving
- ✅ UI updated to save full profile after target selection
- ⏳ Needs build and deployment
- ⏳ Needs testing with KARV

**Next:** Build and deploy the frontend changes, then test with KARV.
